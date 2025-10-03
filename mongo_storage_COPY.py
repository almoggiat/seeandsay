"""
Shared MongoDB storage manager for ReconcileAI
Use this in both your main_site_app.py and public_bot.py
"""

import os
import logging
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError
import certifi

logger = logging.getLogger(__name__)



RETENTION_DAYS = 7

class ReconcileAIMongoStorage:
    """Shared MongoDB storage for workspace data"""

    def __init__(self, mongodb_uri=None, database_name=None):
        self.mongodb_uri = mongodb_uri or os.environ.get("MONGODB_URI")
        self.database_name = database_name or os.environ.get("DATABASE_NAME")
        self.client = None ## MongoDB whole Information
        self.db = None  ## MongoDB specific Database
        self.workspaces_collection = None   ## =self.db.{collecntion_name}
        self.snapshots_collection = None
        self.usersWaitList_collection = None
        self.connect()

    ## connect sets all the mongoDB info, creating the self variables.
    def connect(self):
        """Connect to MongoDB"""
        try:
            if not self.mongodb_uri:
                raise ValueError("MongoDB URI not provided")

            # Use certifi for SSL certificate verification
            self.client = MongoClient(
                self.mongodb_uri,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=10000,
                maxPoolSize=50,
                retryWrites=True
            )

            # Test the connection
            self.client.admin.command('ping')

            self.db = self.client[self.database_name]
            self.workspaces_collection = self.db.workspaces
            self.snapshots_collection = self.db.snapshots
            self.usersWaitList_collection = self.db.userWaitList

            # Create indexes for better performance
            self.workspaces_collection.create_index("team_id", unique=True)
            self.snapshots_collection.create_index([("team_id", 1), ("timestamp", -1)])
            self.snapshots_collection.create_index("channel_id")

            logger.info(f"✅ Connected to MongoDB: {self.database_name}")

        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            raise

    # Workspace management methods
    def add_workspace(self, team_id, team_name,installing_user, bot_token, bot_user_id=None):
        """Add new workspace to MongoDB"""
        try:
            workspace_data = {
                'team_id': team_id,
                'team_name': team_name,
                'installing_user': installing_user,
                'bot_token': bot_token,
                'bot_user_id': bot_user_id,
                'kora_channel_id': None,
                'snapshot_interval_hours': 1,
                'retention_days': RETENTION_DAYS,
                'active': True,
                'created_at': datetime.now(),
                'last_snapshot': None,
                'opt_out_channels': []
            }

            ## Insert new workspace if there is no same team_id, $set is the set command
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$set': workspace_data},
                upsert=True
            )

            if result.upserted_id:
                logger.info(f"✅ Added new workspace: {team_id} ({team_name})")
            else:
                logger.info(f"✅ Updated workspace: {team_id} ({team_name})")

            return True

        except Exception as e:
            logger.error(f"❌ Error adding workspace {team_id}: {e}")
            return False

    # Workspace management methods
    def add_userToWaitList(self, mail):
        """Add new workspace to MongoDB"""
        try:
            user_data = {'mail':mail}

            ## Insert new user if there is no same mail, $set is the set command
            result = self.usersWaitList_collection.update_one(
                {'mail': mail},
                {'$set': user_data},
                upsert=True
            )

            if result.upserted_id:
                logger.info(f"✅ Added new user to wait list: {mail}")
            else:
                logger.info(f"✅ Updated user: {mail}")

            return True

        except Exception as e:
            logger.error(f"❌ Error adding user {mail}: {e}")
            return False

    # get one workspace info using team_id.
    def get_workspace_config(self, team_id):
        """Get workspace configuration"""
        try:
            workspace = self.workspaces_collection.find_one({'team_id': team_id})
            return workspace
        except Exception as e:
            logger.error(f"❌ Error getting workspace config for {team_id}: {e}")
            return None

    # get all active workspaces
    def get_active_workspaces(self):
        """Get all active workspaces as list of (team_id, bot_token) tuples"""
        try:
            active_workspaces = []
            cursor = self.workspaces_collection.find({
                'active': True,
                'bot_token': {'$exists': True, '$ne': None}
            })

            for workspace in cursor:
                active_workspaces.append((workspace['team_id'], workspace['bot_token']))

            return active_workspaces

        except Exception as e:
            logger.error(f"❌ Error getting active workspaces: {e}")
            return []

    def update_last_snapshot(self, team_id):
        """Update last snapshot timestamp"""
        try:
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$set': {'last_snapshot': datetime.now()}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"❌ Error updating last snapshot for {team_id}: {e}")
            return False

    # Set kora_hr channel
    def update_kora_channel(self, team_id, kora_channel_id):
        """Update Kora channel ID for workspace"""
        try:
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$set': {'kora_channel_id': kora_channel_id}}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Updated Kora channel for {team_id}: {kora_channel_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error updating Kora channel for {team_id}: {e}")
            return False

    # Check if specific channel has been removed from a team_id workspace
    def is_channel_opted_out(self, team_id, channel_id):
        """Check if channel is opted out"""
        try:
            workspace = self.workspaces_collection.find_one(
                {'team_id': team_id},
                {'opt_out_channels': 1}
            )

            if workspace:
                opt_out_channels = workspace.get('opt_out_channels', [])
                return channel_id in opt_out_channels

            return False

        except Exception as e:
            logger.error(f"❌ Error checking opt-out status for {team_id}/{channel_id}: {e}")
            return False

    # Add channel the opt_out in specific team_id workspace
    def add_opt_out_channel(self, team_id, channel_id, channel_name=None):
        """Add channel to opt-out list"""
        try:
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$addToSet': {'opt_out_channels': channel_id}}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Added opt-out channel {channel_id} for workspace {team_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error adding opt-out channel {channel_id} for {team_id}: {e}")
            return False

    def remove_opt_out_channel(self, team_id, channel_id):
        """Remove channel from opt-out list"""
        try:
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$pull': {'opt_out_channels': channel_id}}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Removed opt-out channel {channel_id} for workspace {team_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error removing opt-out channel {channel_id} for {team_id}: {e}")
            return False

    def deactivate_workspace(self, team_id):
        """Mark workspace as inactive (uninstalled)"""
        try:
            result = self.workspaces_collection.update_one(
                {'team_id': team_id},
                {'$set': {'active': False}}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Deactivated workspace: {team_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error deactivating workspace {team_id}: {e}")
            return False

    # Snapshot management methods
    def save_channel_snapshot(self, team_id, team_name, channel_id, channel_name, messages, timestamp=None):
        """Save a channel snapshot"""
        try:
            snapshot_data = {
                'team_id': team_id,
                'team_name': team_name,
                'channel_id': channel_id,
                'channel_name': channel_name,
                'messages': messages,
                'timestamp': timestamp or datetime.now(),
                'message_count': len(messages)
            }

            # Use upsert to replace existing data or insert new data
            result = self.snapshots_collection.replace_one(
                {'channel_id': channel_id},  # Filter to find existing document
                snapshot_data,  # New document data
                upsert=True  # Insert if no document matches the filter
            )

            if result.upserted_id or result.modified_count > 0:
                action = "Updated" if result.modified_count > 0 else "Saved"
                logger.info(f"✅ {action} snapshot for {team_name}_{team_id}_{channel_id} with {len(messages)} messages")
                return True

            return False

        except Exception as e:
            logger.error(f"❌ Error saving snapshot for {team_name}_{team_id}_{channel_id}: {e}")
            return False

    def get_latest_snapshot(self, team_id, channel_id):
        """Get the latest snapshot for a channel"""
        try:
            snapshot = self.snapshots_collection.find_one(
                {'team_id': team_id, 'channel_id': channel_id},
                sort=[('timestamp', -1)]
            )
            return snapshot
        except Exception as e:
            logger.error(f"❌ Error getting latest snapshot for {team_id}/{channel_id}: {e}")
            return None

    def get_snapshots_for_workspace(self, team_id, limit=100):
        """Get recent snapshots for a workspace"""
        try:
            snapshots = list(self.snapshots_collection.find(
                {'team_id': team_id},
                sort=[('timestamp', -1)],
                limit=limit
            ))
            return snapshots
        except Exception as e:
            logger.error(f"❌ Error getting snapshots for workspace {team_id}: {e}")
            return []

    def cleanup_old_snapshots(self, team_id, retention_days=RETENTION_DAYS):
        """Clean up old snapshots based on retention policy"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=retention_days)

            result = self.snapshots_collection.delete_many({
                'team_id': team_id,
                'timestamp': {'$lt': cutoff_date}
            })

            if result.deleted_count > 0:
                logger.info(f"✅ Cleaned up {result.deleted_count} old snapshots for {team_id}")

            return result.deleted_count

        except Exception as e:
            logger.error(f"❌ Error cleaning up snapshots for {team_id}: {e}")
            return 0

    # Debug and utility methods
    def get_all_workspaces(self):
        """Get all workspaces for debugging"""
        try:
            workspaces = list(self.workspaces_collection.find({}))
            return workspaces
        except Exception as e:
            logger.error(f"❌ Error getting all workspaces: {e}")
            return []

    def get_stats(self):
        """Get database statistics"""
        try:
            workspace_count = self.workspaces_collection.count_documents({})
            active_workspace_count = self.workspaces_collection.count_documents({'active': True})
            snapshot_count = self.snapshots_collection.count_documents({})

            return {
                'total_workspaces': workspace_count,
                'active_workspaces': active_workspace_count,
                'total_snapshots': snapshot_count
            }
        except Exception as e:
            logger.error(f"❌ Error getting stats: {e}")
            return {}

    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("✅ MongoDB connection closed")

    def __enter__(self):
        """Context manager entry"""
        return self

    # def __exit__(self, exc_type, exc_val, exc_tb):
    #     """Context manager exit"""
    #     self.close_connection()


# Convenience function to create storage instance
def create_storage(mongodb_uri=None, database_name=None):
    """Create a new storage instance"""
    return ReconcileAIMongoStorage(mongodb_uri, database_name)