import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024
