"""Flask application configuration."""

import os


class Config:
    """Base configuration."""

    # Flask
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    PORT = int(os.environ.get('PORT', 5000))

    # Database (MongoDB optional, SQLite fallback)
    MONGODB_URI = os.environ.get('MONGODB_URI', '')
    DATABASE_URL = os.environ.get('DATABASE_URL', '')

    # Model paths
    MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    MODEL_PATH = os.path.join(MODELS_DIR, 'best_model.pkl')
    METADATA_PATH = os.path.join(MODELS_DIR, 'model_metadata.json')

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
