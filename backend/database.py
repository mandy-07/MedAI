from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
    AsyncIOMotorGridFSBucket,
)

from backend.config import settings
from backend.utils.logger import logger


class MongoDB:
    """
    MongoDB connection manager for MedAI backend.
    Handles database, GridFS, and connection lifecycle.
    """

    def __init__(self):
        self.client: AsyncIOMotorClient | None = None
        self.database: AsyncIOMotorDatabase | None = None
        self.gridfs: AsyncIOMotorGridFSBucket | None = None

    async def connect(self) -> None:
        """
        Establish MongoDB connection with safety checks.
        """

        try:
            logger.info("Connecting to MongoDB...")

            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
            )

            self.database = self.client[settings.DATABASE_NAME]

            self.gridfs = AsyncIOMotorGridFSBucket(
                self.database,
                bucket_name=settings.GRIDFS_BUCKET,
            )

            # Verify connection
            await self.client.admin.command("ping")

            logger.info("MongoDB connected successfully.")

        except Exception as e:
            logger.exception(
                "MongoDB connection failed: %s",
                e,
            )
            raise RuntimeError(
                f"Database connection failed: {e}"
            )

    async def disconnect(self) -> None:
        """
        Close MongoDB connection gracefully.
        """

        if self.client:
            self.client.close()

            self.client = None
            self.database = None
            self.gridfs = None

            logger.info("MongoDB connection closed.")


# Singleton instance
mongodb = MongoDB()