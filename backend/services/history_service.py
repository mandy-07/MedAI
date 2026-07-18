"""
Prediction History Service

Handles CRUD operations for prediction history stored in MongoDB.
"""

from datetime import date, datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from backend.database import mongodb
from backend.utils.logger import logger


class HistoryService:
    """
    Service class for managing prediction history.
    """

    COLLECTION_NAME = "prediction_history"

    @property
    def collection(self):
        """Return the prediction history collection."""
        return mongodb.database[self.COLLECTION_NAME]

    @staticmethod
    def serialize_document(document: dict) -> dict:
        """Convert MongoDB document into a JSON serializable format."""

        if not document:
            return document

        document = document.copy()
        # Keep _id as a string (frontend HistoryItem interface uses _id)
        document["_id"] = str(document["_id"])

        # Convert raw filesystem report_path to a relative URL the frontend can use.
        # e.g. "D:\...\reports\file.pdf" → "/reports/file.pdf"
        if document.get("report_path"):
            from pathlib import Path as _Path
            rp = document["report_path"]
            if not rp.startswith("/") and not rp.startswith("http"):
                document["report_path"] = f"/reports/{_Path(rp).name}"

        return document

    @staticmethod
    def _serialize_dates(data: Any) -> Any:
        """Recursively convert date objects into ISO strings."""

        if isinstance(data, dict):
            return {
                key: HistoryService._serialize_dates(value)
                for key, value in data.items()
            }

        if isinstance(data, list):
            return [
                HistoryService._serialize_dates(item)
                for item in data
            ]

        if isinstance(data, date) and not isinstance(data, datetime):
            return data.isoformat()

        return data

    @staticmethod
    def _validate_object_id(history_id: str) -> ObjectId:
        """Validate and convert a MongoDB ObjectId."""

        if not ObjectId.is_valid(history_id):
            raise ValueError(f"Invalid history ID: {history_id}")

        return ObjectId(history_id)

    async def save_prediction(
        self,
        patient: Optional[dict[str, Any]],
        prediction: dict[str, Any],
        report_path: Optional[str] = None,
        gradcam_path: Optional[str] = None,
    ) -> dict:
        """Save prediction history."""

        try:
            patient = self._serialize_dates(patient)
            prediction = self._serialize_dates(prediction)

            document = {
                "patient": patient,
                "prediction": prediction,
                "report_path": report_path,
                "gradcam_path": gradcam_path,
                "created_at": datetime.now(timezone.utc),
            }

            result = await self.collection.insert_one(document)
            document["_id"] = result.inserted_id

            logger.info(
                "Prediction history saved successfully: %s",
                result.inserted_id,
            )

            return self.serialize_document(document)

        except Exception:
            logger.exception("Error saving prediction history.")
            raise

    async def get_prediction_by_id(
        self,
        history_id: str,
    ) -> Optional[dict]:
        """Retrieve a prediction by ID."""

        try:
            document = await self.collection.find_one(
                {"_id": self._validate_object_id(history_id)}
            )

            if document is None:
                return None

            return self.serialize_document(document)

        except Exception:
            logger.exception("Error retrieving prediction history.")
            raise

    async def get_all_predictions(
        self,
        limit: int = 100,
        skip: int = 0,
    ) -> list[dict]:
        """Retrieve prediction history."""

        try:
            cursor = (
                self.collection.find()
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )

            documents = await cursor.to_list(length=limit)

            return [
                self.serialize_document(document)
                for document in documents
            ]

        except Exception:
            logger.exception("Error retrieving prediction history.")
            raise

    async def delete_prediction(
        self,
        history_id: str,
    ) -> bool:
        """Delete a prediction history record."""

        try:
            result = await self.collection.delete_one(
                {"_id": self._validate_object_id(history_id)}
            )

            if result.deleted_count == 0:
                return False

            logger.info(
                "Prediction history deleted: %s",
                history_id,
            )

            return True

        except Exception:
            logger.exception("Error deleting prediction history.")
            raise

    async def update_report_path(
        self,
        history_id: str,
        report_path: str,
    ) -> bool:
        """Update report path."""

        try:
            result = await self.collection.update_one(
                {"_id": self._validate_object_id(history_id)},
                {"$set": {"report_path": report_path}},
            )

            if result.modified_count:
                logger.info(
                    "Updated report path for history: %s",
                    history_id,
                )

            return result.modified_count > 0

        except Exception:
            logger.exception("Error updating report path.")
            raise

    async def update_gradcam_path(
        self,
        history_id: str,
        gradcam_path: str,
    ) -> bool:
        """Update Grad-CAM path."""

        try:
            result = await self.collection.update_one(
                {"_id": self._validate_object_id(history_id)},
                {"$set": {"gradcam_path": gradcam_path}},
            )

            if result.modified_count:
                logger.info(
                    "Updated Grad-CAM path for history: %s",
                    history_id,
                )

            return result.modified_count > 0

        except Exception:
            logger.exception("Error updating Grad-CAM path.")
            raise

    async def get_prediction_count(self) -> int:
        """Return total prediction count."""

        try:
            return await self.collection.count_documents({})

        except Exception:
            logger.exception("Error counting prediction history.")
            raise

    async def clear_history(self) -> int:
        """Delete all prediction history."""

        try:
            result = await self.collection.delete_many({})

            logger.warning(
                "Deleted %d prediction history records.",
                result.deleted_count,
            )

            return result.deleted_count

        except Exception:
            logger.exception("Error clearing prediction history.")
            raise


history_service = HistoryService()
