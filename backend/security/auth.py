from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from bson import ObjectId
from database.connection import get_db


def authenticated_user(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = get_db().users.find_one(
                {"_id": ObjectId(identity), "is_active": True}
            )
            if not user:
                return jsonify({"error": "Authentication required"}), 401
        except Exception:
            return jsonify({"error": "Authentication required"}), 401
        return fn(user, *args, **kwargs)

    return wrapper
