from datetime import datetime, timezone


def utc_now():
    return datetime.now(timezone.utc)


def public_user(user):
    if not user:
        return None
    return {
        "id": str(user.get("_id", "")),
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "phone": user.get("phone", ""),
        "address": user.get("address", ""),
        "age": user.get("age"),
        "work_email": user.get("work_email", ""),
        "userid": user.get("userid", ""),
        "balance": int(user.get("balance_paise", 0)) / 100,
        "created_at": (
            user.get("created_at").isoformat() if user.get("created_at") else None
        ),
    }


def public_transaction(tx):
    return {
        "id": str(tx.get("_id", "")),
        "type": tx.get("type", ""),
        "amount": int(tx.get("amount_paise", 0)) / 100,
        "balance_after": int(tx.get("balance_after_paise", 0)) / 100,
        "description": tx.get("description", ""),
        "created_at": (
            tx.get("created_at").isoformat() if tx.get("created_at") else None
        ),
    }
