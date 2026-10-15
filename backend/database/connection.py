from pymongo import MongoClient, ASCENDING, DESCENDING
from flask import current_app, g


def get_db():
    if "mongo_db" not in g:
        client = MongoClient(
            current_app.config["MONGODB_URI"], serverSelectionTimeoutMS=5000
        )
        g.mongo_client = client
        g.mongo_db = client[current_app.config["MONGODB_DATABASE"]]
    return g.mongo_db


def close_db(_error=None):
    client = g.pop("mongo_client", None)
    g.pop("mongo_db", None)
    if client is not None:
        client.close()


def ensure_indexes(db):
    db.users.create_index([("userid", ASCENDING)], unique=True)
    db.users.create_index([("phone", ASCENDING)], unique=True)
    db.users.create_index([("work_email", ASCENDING)], unique=True, sparse=True)
    db.transactions.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    db.payments.create_index([("razorpay_order_id", ASCENDING)], unique=True)
    db.payments.create_index(
        [("razorpay_payment_id", ASCENDING)], unique=True, sparse=True
    )
