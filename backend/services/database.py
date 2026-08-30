"""
Database service for prediction history.

Uses MongoDB if MONGODB_URI is set, otherwise falls back to SQLite.
"""

import os
import json
from datetime import datetime, timezone
from typing import Any

from config import Config


class DatabaseService:
    """Abstracts prediction history persistence."""

    def __init__(self):
        self._use_mongo = bool(Config.MONGODB_URI)
        if self._use_mongo:
            try:
                import pymongo
                self._client = pymongo.MongoClient(Config.MONGODB_URI)
                self._db = self._client.get_database()
                self._collection = self._db['predictions']
                self._collection.create_index('created_at')
                print("Connected to MongoDB for prediction history.")
            except ImportError:
                print("pymongo not installed, falling back to SQLite.")
                self._use_mongo = False

        if not self._use_mongo:
            import sqlite3
            self._sqlite_path = os.path.join(os.path.dirname(__file__), '..', 'predictions.db')
            conn = sqlite3.connect(self._sqlite_path)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id TEXT PRIMARY KEY,
                    applicant_data TEXT NOT NULL,
                    prediction TEXT NOT NULL,
                    probability REAL NOT NULL,
                    risk TEXT NOT NULL,
                    factors TEXT,
                    created_at TEXT NOT NULL
                )
            ''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at DESC)')
            conn.commit()
            conn.close()
            print("Using SQLite for prediction history.")

    def save_prediction(self, applicant_data: dict, prediction: str,
                        probability: float, risk: str, factors: list | None) -> str:
        """Save a prediction record. Returns the record ID."""
        import uuid
        record_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        if self._use_mongo:
            self._collection.insert_one({
                '_id': record_id,
                'applicant_data': applicant_data,
                'prediction': prediction,
                'probability': probability,
                'risk': risk,
                'factors': factors,
                'created_at': created_at,
            })
        else:
            import sqlite3
            conn = sqlite3.connect(self._sqlite_path)
            conn.execute(
                'INSERT INTO predictions (id, applicant_data, prediction, probability, risk, factors, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (record_id, json.dumps(applicant_data), prediction, probability, risk,
                 json.dumps(factors) if factors else None, created_at),
            )
            conn.commit()
            conn.close()

        return record_id

    def get_history(self, limit: int = 100) -> list[dict[str, Any]]:
        """Retrieve prediction history."""
        if self._use_mongo:
            cursor = self._collection.find({}, {'_id': 0}).sort('created_at', -1).limit(limit)
            return list(cursor)
        else:
            import sqlite3
            conn = sqlite3.connect(self._sqlite_path)
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                'SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?', (limit,)
            ).fetchall()
            conn.close()
            return [
                {
                    'id': row['id'],
                    'applicant_data': json.loads(row['applicant_data']),
                    'prediction': row['prediction'],
                    'probability': row['probability'],
                    'risk': row['risk'],
                    'factors': json.loads(row['factors']) if row['factors'] else None,
                    'created_at': row['created_at'],
                }
                for row in rows
            ]

    def get_stats(self) -> dict[str, Any]:
        """Compute aggregate statistics."""
        history = self.get_history(limit=10000)
        total = len(history)
        approved = sum(1 for h in history if h['prediction'] == 'Approved')
        rejected = sum(1 for h in history if h['prediction'] == 'Rejected')
        high_risk = sum(1 for h in history if h['risk'] == 'High')
        avg_prob = sum(h['probability'] for h in history) / total if total > 0 else 0

        return {
            'total': total,
            'approved': approved,
            'rejected': rejected,
            'high_risk': high_risk,
            'avg_probability': round(avg_prob, 4),
        }
