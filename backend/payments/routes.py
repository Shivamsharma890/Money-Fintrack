from flask import Blueprint, request, jsonify, current_app
from pymongo import ReturnDocument
from database.connection import get_db
from database.models import utc_now
from security.auth import authenticated_user
from cache.redis import delete_cache
import hashlib
import hmac
import uuid

payments_bp = Blueprint("payments", __name__)


def _razorpay_client(mode=None):
    import razorpay

    mode = (mode or current_app.config.get("PAYMENT_MODE", "test")).lower()

    if mode == "test":
        key_id = current_app.config.get("RAZORPAY_TEST_KEY_ID")
        secret = current_app.config.get("RAZORPAY_TEST_KEY_SECRET")
    elif mode == "live":
        key_id = current_app.config.get("RAZORPAY_LIVE_KEY_ID")
        secret = current_app.config.get("RAZORPAY_LIVE_KEY_SECRET")
    else:
        raise ValueError("Payment mode must be test or live")

    if not key_id or not secret:
        raise RuntimeError(f"Razorpay {mode.upper()} credentials are not configured")

    import razorpay

    return razorpay.Client(auth=(key_id, secret)), key_id, secret, mode


@payments_bp.post("/create_order")
@authenticated_user
def create_order(user):
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "test")

    if not isinstance(mode, str) or mode.lower() not in ("test", "live"):
        return jsonify(error="Payment mode must be test or live"), 400

    mode = mode.lower()

    try:
        amount = float(data.get("amount"))

        if not 0 < amount <= 100000 or round(amount, 2) != amount:
            return (
                jsonify(error="Enter an amount up to ₹100,000 with two decimal places"),
                400,
            )

        amount_paise = int(round(amount * 100))

        client, key_id, _, actual_mode = _razorpay_client(mode)

        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"mf_{uuid.uuid4().hex[:20]}",
                "payment_capture": 1,
            }
        )

        db = get_db()

        db.payments.insert_one(
            {
                "user_id": user["_id"],
                "razorpay_order_id": order["id"],
                "amount_paise": amount_paise,
                "currency": "INR",
                "status": "created",
                "mode": actual_mode,
                "created_at": utc_now(),
            }
        )

        return (
            jsonify(
                order_id=order["id"],
                amount=amount_paise,
                currency="INR",
                key_id=key_id,
                mode=actual_mode,
            ),
            201,
        )

    except (ValueError, TypeError):
        return jsonify(error="Invalid payment amount"), 400

    except Exception:
        current_app.logger.exception("Razorpay order creation failed")
        return jsonify(error="Unable to create payment order"), 502


@payments_bp.post("/verify_payment")
@authenticated_user
def verify_payment(user):
    print("VERIFY_PAYMENT UPDATED VERSION RUNNING")
    data = request.get_json(silent=True) or {}

    payment_id = data.get("razorpay_payment_id")
    order_id = data.get("razorpay_order_id")
    signature = data.get("razorpay_signature")

    if not all(
        isinstance(value, str) and value for value in (payment_id, order_id, signature)
    ):
        return jsonify(error="Missing payment verification fields"), 400

    db = get_db()

    payment = db.payments.find_one(
        {
            "razorpay_order_id": order_id,
            "user_id": user["_id"],
        }
    )

    if not payment:
        return jsonify(error="Payment order not found"), 404

    try:
        _, _, secret, _ = _razorpay_client(payment.get("mode"))

        expected_signature = hmac.new(
            secret.encode("utf-8"),
            f"{order_id}|{payment_id}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            return jsonify(error="Invalid payment signature"), 400

        if payment.get("status") == "credited":
            current_user = db.users.find_one({"_id": user["_id"]})

            return (
                jsonify(
                    success=True,
                    message="Payment already credited",
                    balance=(
                        current_user.get("balance_paise", 0) / 100
                        if current_user
                        else 0
                    ),
                ),
                200,
            )

        claimed = db.payments.find_one_and_update(
            {
                "_id": payment["_id"],
                "status": "created",
            },
            {
                "$set": {
                    "status": "processing",
                    "razorpay_payment_id": payment_id,
                    "verified_at": utc_now(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if not claimed:
            return (
                jsonify(
                    error=(
                        "Payment is already being processed. "
                        "Check the wallet balance before retrying."
                    )
                ),
                409,
            )

        updated_user = db.users.find_one_and_update(
            {
                "_id": user["_id"],
                "is_active": True,
            },
            {
                "$inc": {
                    "balance_paise": payment["amount_paise"],
                },
                "$set": {
                    "updated_at": utc_now(),
                },
            },
            return_document=ReturnDocument.AFTER,
        )

        if not updated_user:
            db.payments.update_one(
                {
                    "_id": payment["_id"],
                    "status": "processing",
                },
                {
                    "$set": {
                        "status": "credit_failed",
                    }
                },
            )

            return jsonify(error="Account is not active"), 409

        delete_cache(f"money-fintrack:transactions:{user['_id']}")

        try:
            db.transactions.insert_one(
                {
                    "user_id": user["_id"],
                    "type": "deposit",
                    "amount_paise": payment["amount_paise"],
                    "balance_after_paise": updated_user["balance_paise"],
                    "description": "Razorpay deposit",
                    "payment_id": payment_id,
                    "created_at": utc_now(),
                }
            )

        except Exception:
            current_app.logger.exception(
                "Wallet credited but transaction insert failed: %s",
                order_id,
            )

            return (
                jsonify(
                    error=(
                        "Wallet was updated, but transaction recording failed. "
                        "Contact support for reconciliation."
                    )
                ),
                500,
            )

        marked = db.payments.update_one(
            {
                "_id": payment["_id"],
                "status": "processing",
            },
            {
                "$set": {
                    "status": "credited",
                    "credited_at": utc_now(),
                }
            },
        )

        if marked.modified_count != 1:
            current_app.logger.error(
                "Wallet credited but payment status update failed: %s",
                order_id,
            )

            return (
                jsonify(
                    error=("Payment was processed but its status needs reconciliation.")
                ),
                500,
            )

        return (
            jsonify(
                success=True,
                message="Payment verified and wallet credited",
                balance=updated_user["balance_paise"] / 100,
            ),
            200,
        )

    except Exception:
        current_app.logger.exception("Payment verification failed")

        return (
            jsonify(
                error=(
                    "Payment processing failed. Check the wallet balance "
                    "and contact support if money was debited."
                )
            ),
            502,
        )


@payments_bp.post("/razorpay_webhook")
def razorpay_webhook():
    secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET")
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not secret or not signature:
        return jsonify(error="Webhook is not configured"), 400

    expected = hmac.new(
        secret.encode("utf-8"),
        request.get_data(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return jsonify(error="Invalid webhook signature"), 400

    return jsonify(status="verified"), 200
