import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo.errors import DuplicateKeyError
from pymongo import ReturnDocument
from database.connection import get_db
from database.models import public_user, public_transaction, utc_now
from cache.redis import (
    check_login_rate_limit,
    clear_login_rate_limit,
    get_json_cache,
    set_json_cache,
    delete_cache,
)
from security.auth import authenticated_user

security_bp = Blueprint("security", __name__)


def payload():
    return request.get_json(silent=True) or {}


def valid_password(password):
    return isinstance(password, str) and len(password) >= 8 and len(password) <= 128


@security_bp.post("/account")
def create_account():
    data = payload()
    required = [
        "first_name",
        "last_name",
        "phone",
        "address",
        "age",
        "work_email",
        "userid",
        "password",
    ]
    if any(not str(data.get(k, "")).strip() for k in required):
        return jsonify(error="All required fields must be provided"), 400
    password = data["password"]
    if not valid_password(password):
        return jsonify(error="Password must be 8–128 characters"), 400
    userid = str(data["userid"]).strip()
    phone = re.sub(r"\s+", "", str(data["phone"]))
    email = str(data["work_email"]).strip().lower()
    try:
        age = int(data["age"])
        if age < 18 or age > 120:
            return jsonify(error="Age must be between 18 and 120"), 400
    except (ValueError, TypeError):
        return jsonify(error="Age must be a valid number"), 400
    user = {
        "first_name": str(data["first_name"]).strip(),
        "last_name": str(data["last_name"]).strip(),
        "phone": phone,
        "address": str(data["address"]).strip(),
        "age": age,
        "work_email": email,
        "userid": userid,
        "password_hash": generate_password_hash(password),
        "balance_paise": 0,
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    try:
        get_db().users.insert_one(user)
    except DuplicateKeyError:
        return jsonify(error="User ID, phone, or email is already registered"), 409
    return jsonify(message="Account created successfully"), 201


@security_bp.post("/login")
def login():
    data = payload()
    userid = str(data.get("userid", "")).strip()
    password = data.get("password", "")
    if not userid or not isinstance(password, str):
        return jsonify(error="User ID and password are required"), 400

    if not check_login_rate_limit(userid.lower(), limit=10, window_seconds=300):
        return (
            jsonify(
                error="Login temporarily unavailable or too many attempts. Try again in a few minutes."
            ),
            429,
        )

    user = get_db().users.find_one({"userid": userid, "is_active": True})

    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify(error="Invalid User ID or password"), 401

    clear_login_rate_limit(userid)
    token = create_access_token(identity=str(user["_id"]))

    txs = (
        get_db()
        .transactions.find({"user_id": user["_id"]})
        .sort("created_at", -1)
        .limit(20)
    )
    result = public_user(user)
    result["transactions"] = [public_transaction(t) for t in txs]
    return jsonify(message="Login successful", access_token=token, user=result), 200


@security_bp.get("/me")
@authenticated_user
def me(user):
    return jsonify(user=public_user(user)), 200


@security_bp.get("/balance")
@authenticated_user
def balance(user):
    return jsonify(balance=int(user.get("balance_paise", 0)) / 100), 200


@security_bp.put("/profile")
@authenticated_user
def update_profile(user):
    data = payload()
    allowed = {
        k: str(data[k]).strip()
        for k in ("first_name", "last_name", "phone", "address", "work_email")
        if k in data and str(data[k]).strip()
    }
    if "phone" in allowed:
        allowed["phone"] = re.sub(r"\s+", "", allowed["phone"])
    if "work_email" in allowed:
        allowed["work_email"] = allowed["work_email"].lower()
    if "age" in data:
        try:
            age = int(data["age"])
            if not 18 <= age <= 120:
                raise ValueError
            allowed["age"] = age
        except (ValueError, TypeError):
            return jsonify(error="Age must be between 18 and 120"), 400
    if not allowed:
        return jsonify(error="No valid profile fields provided"), 400
    allowed["updated_at"] = utc_now()
    try:
        get_db().users.update_one({"_id": user["_id"]}, {"$set": allowed})
    except DuplicateKeyError:
        return jsonify(error="Phone or email is already in use"), 409
    updated = get_db().users.find_one({"_id": user["_id"]})
    return jsonify(message="Profile updated", user=public_user(updated)), 200


@security_bp.get("/transactions")
@authenticated_user
def transactions(user):
    cache_key = f"money-fintrack:transactions:{user['_id']}"

    cached = get_json_cache(cache_key)

    if isinstance(cached, list):
        return jsonify(transactions=cached), 200

    txs = (
        get_db()
        .transactions.find({"user_id": user["_id"]})
        .sort("created_at", -1)
        .limit(100)
    )

    result = [public_transaction(tx) for tx in txs]

    set_json_cache(cache_key, result, ttl_seconds=30)

    return jsonify(transactions=result), 200


@security_bp.delete("/account")
@authenticated_user
def delete_account(user):
    data = payload()
    password = data.get("password", "")
    if not isinstance(password, str) or not check_password_hash(
        user.get("password_hash", ""), password
    ):
        return jsonify(error="Password confirmation is required"), 401
    if int(user.get("balance_paise", 0)) != 0:
        return (
            jsonify(
                error="Withdraw or settle the remaining wallet balance before deleting the account"
            ),
            409,
        )
    db = get_db()
    db.users.update_one(
        {"_id": user["_id"]}, {"$set": {"is_active": False, "deleted_at": utc_now()}}
    )
    return jsonify(message="Account deactivated successfully"), 200


@security_bp.post("/forgot")
def forgot_password():
    return (
        jsonify(
            message="If the phone number is registered, use the verified password-reset process. OTP delivery is not configured yet."
        ),
        501,
    )


@security_bp.post("/transfer")
@authenticated_user
def wallet_action(user):
    data = payload()
    action = data.get("action")
    if action == "auth":
        return (
            jsonify(
                name=f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                balance=int(user.get("balance_paise", 0)) / 100,
            ),
            200,
        )
    if action == "deposit":
        return (
            jsonify(
                error="Direct deposits are disabled. Use the verified Razorpay payment flow."
            ),
            400,
        )
    if action != "withdraw":
        return jsonify(error="Unsupported wallet action"), 400
    try:
        amount = float(data.get("amount"))
        if amount <= 0 or amount > 100000 or round(amount, 2) != amount:
            raise ValueError
        amount_paise = int(round(amount * 100))
    except (ValueError, TypeError):
        return (
            jsonify(error="Amount must be a valid positive amount up to ₹100,000"),
            400,
        )
    db = get_db()
    updated = db.users.find_one_and_update(
        {
            "_id": user["_id"],
            "is_active": True,
            "balance_paise": {"$gte": amount_paise},
        },
        {"$inc": {"balance_paise": -amount_paise}, "$set": {"updated_at": utc_now()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        latest = db.users.find_one({"_id": user["_id"]})
        if not latest or not latest.get("is_active"):
            return jsonify(error="Account is not active"), 401
        return jsonify(error="Insufficient balance"), 400

    delete_cache(f"money-fintrack:transactions:{user['_id']}")

    db.transactions.insert_one(
        {
            "user_id": user["_id"],
            "type": "withdraw",
            "amount_paise": amount_paise,
            "balance_after_paise": updated["balance_paise"],
            "description": f"Wallet withdrawal ₹{amount:.2f}",
            "created_at": utc_now(),
        }
    )
    return (
        jsonify(
            message="Withdrawal successful", new_balance=updated["balance_paise"] / 100
        ),
        200,
    )
