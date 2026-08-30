"""
Flask application factory and route registration.
"""

import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from backend.services.database import DatabaseService
from backend.services.prediction import run_prediction, ValidationError


def create_app(config_class: type = Config) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=Config.CORS_ORIGINS)

    db = DatabaseService()

    # --- Health check ---
    @app.route('/')
    def index():
        return jsonify({'status': 'healthy', 'service': 'CrediScan API', 'version': '1.0.0'})

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'})

    # --- Prediction ---
    @app.route('/api/predict', methods=['POST'])
    def predict():
        try:
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({'error': 'Request body must be valid JSON.'}), 400

            result = run_prediction(data)

            # Save to history
            try:
                record_id = db.save_prediction(
                    applicant_data=data,
                    prediction=result['prediction'],
                    probability=result['probability'],
                    risk=result['risk'],
                    factors=result.get('factors'),
                )
                result['id'] = record_id
            except Exception as e:
                app.logger.warning(f'Failed to save prediction to database: {e}')

            return jsonify(result)

        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.errors}), 422
        except FileNotFoundError as e:
            return jsonify({'error': str(e)}), 503
        except Exception as e:
            app.logger.error(f'Prediction error: {e}', exc_info=True)
            return jsonify({'error': 'An internal error occurred. Please try again.'}), 500

    # --- History ---
    @app.route('/api/history')
    def history():
        limit = request.args.get('limit', 100, type=int)
        limit = min(limit, 500)
        records = db.get_history(limit=limit)
        return jsonify(records)

    # --- Stats ---
    @app.route('/api/stats')
    def stats():
        return jsonify(db.get_stats())

    # --- Model info ---
    @app.route('/api/model-info')
    def model_info():
        metadata_path = Config.METADATA_PATH
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                return jsonify(json.load(f))
        return jsonify({'error': 'Model metadata not found.'}), 404

    # --- Error handlers ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found.'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed.'}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal error occurred.'}), 500

    return app


app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.FLASK_ENV == 'development')
