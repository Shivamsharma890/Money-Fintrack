import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_HOURS", "8"))
    )
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/money_fintrack")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "money_fintrack")
    REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    PAYMENT_MODE = os.getenv("PAYMENT_MODE", "test").lower()
    RAZORPAY_TEST_KEY_ID = os.getenv("RAZORPAY_TEST_KEY_ID")
    RAZORPAY_TEST_KEY_SECRET = os.getenv("RAZORPAY_TEST_KEY_SECRET")
    RAZORPAY_LIVE_KEY_ID = os.getenv("RAZORPAY_LIVE_KEY_ID")
    RAZORPAY_LIVE_KEY_SECRET = os.getenv("RAZORPAY_LIVE_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
