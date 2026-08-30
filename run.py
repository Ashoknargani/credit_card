"""Entry point for running the Flask backend."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from backend.app import app
from config import Config


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=True)
