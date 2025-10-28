"""
MongoDB Storage Manager for See&Say Application
"""

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import pymongo.errors
from pymongo.errors import ConnectionFailure, DuplicateKeyError
import certifi
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
mongodb_url = os.environ.get("MONGODB_URL")
database_name = os.environ.get("DATABASE_NAME")


class SeeSayMongoStorage:
    """Shared MongoDB storage for user data"""

    def __init__(self, mongodb_url=None, database_name=None):
        self.mongodb_url = mongodb_url or os.environ.get("MONGODB_URL")
        self.database_name = database_name or os.environ.get("DATABASE_NAME")
        self.client = None ## MongoDB whole Information
        self.db = None  ## MongoDB specific Database
        self.users_collection = None   ## =self.db.{collecntion_name}
        self.connect()

    ## connect sets all the mongoDB info, creating the self variables.
    def connect(self):
        """Connect to MongoDB"""
        try:
            if not self.mongodb_url:
                raise ValueError("MongoDB URI not provided")

            # Use certifi for SSL certificate verification
            self.client = MongoClient(
                self.mongodb_url,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=10000,
                maxPoolSize=50,
                retryWrites=True
            )

            # Test the connection
            self.client.admin.command('ping')

            self.db = self.client[self.database_name]
            self.users_collection = self.db.users

            # Create indexes for better performance
            self.users_collection.create_index("userId", unique=True)


            logger.info(f"✅ Connected to MongoDB: {self.database_name}")

        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            raise

    def add_user(self, user_id, user_name, age_years, age_months):
        """Add a new user to MongoDB if userId does not already exist"""
        try:
            user_data = {
                'userId': user_id,
                'userName': user_name,
                'createdAt': datetime.now(),
                'last_update': datetime.now(),
                'ageYears': age_years,
                'ageMonths': age_months,
                'tests': [],
                'active': True,
            }

            result = self.users_collection.insert_one(user_data)
            logger.info(f"✅ Added new user: {user_id} ({user_name})")
            return True

        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"⚠️ User ID {user_id} already exists. No action taken.")
            return False

        except Exception as e:
            logger.error(f"❌ Error adding user {user_id} ({user_name}): {e}")
            return False


    def add_test_to_user(self, user_id,correct, partly, wrong, audio_file, final_evaluation):
        """
        Adds a new exam record to the 'tests' array of a specific user.
        Time_took --> how long it took to finish
        """
        try:
            new_test = {
                'dateFinished': datetime.now(),
                'correct': correct,
                'partly': partly,
                'wrong': wrong,
                'audioFile': audio_file,
                'txtFile': final_evaluation
            }

            result = self.users_collection.update_one(
                {'id': user_id},
                {'$push': {'tests': new_test}}
            )

            if result.matched_count == 0:
                # User was not found in the database
                logger.warning(f"⚠️ User ID {user_id} not found. Cannot add test.")
                return False
            elif result.modified_count == 1:
                # Successfully pushed the new test
                logger.info(f"✅ Successfully added new test for user ID: {user_id}")
                return True
            else:
                # Matched but not modified (shouldn't happen with $push unless user document is locked)
                logger.warning(f"⚠️ Test addition for user {user_id} resulted in no change.")
                return False

        except Exception as e:
            logger.error(f"❌ Error adding test for user {user_id}: {e}")
            return False

    # get one user info using user_id.
    def get_user_config(self, user_id):
        """Get user configuration"""
        try:
            user = self.users_collection.find_one({'user_id': user_id})
            return user
        except Exception as e:
            logger.error(f"❌ Error getting user config for {user_id}: {e}")
            return None

    # get all active users
    def get_active_users(self):
        """Get all active users as list of (user_id, user_name) tuples"""
        try:
            active_users = []
            cursor = self.users_collection.find({
                'active': True,
                'user_name': {'$exists': True, '$ne': None}
            })

            for user in cursor:
                active_users.append((user['user_id'], user['user_name']))

            return active_users

        except Exception as e:
            logger.error(f"❌ Error getting active users: {e}")
            return []



    def deactivate_user(self, user_id):
        """Mark user as inactive (uninstalled)"""
        try:
            result = self.users_collection.update_one(
                {'team_id': user_id},
                {'$set': {'active': False}}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Deactivated user: {user_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error deactivating user {user_id}: {e}")
            return False


    def get_latest_test(self, user_id):
        try:
            # Use projection with $slice: -1 to return only the last item
            # in the 'tests' array (the latest one).
            projection = {'_id': 0, 'tests': {'$slice': -1}}

            result = self.users_collection.find_one(
                {'user_id': user_id},
                projection
            )

            if not result or 'tests' not in result or not result['tests']:
                logger.warning(f"⚠️ User ID {user_id} found, but no tests recorded or user not found.")
                return None

            # The result['tests'] is a list containing exactly one element: the latest test object.
            latest_exam = result['tests'][0]
            logger.info(f"✅ Retrieved latest test for user ID: {user_id}")
            return latest_exam

        except Exception as e:
            logger.error(f"❌ Error getting latest test for user {user_id}: {e}")
            return None


    # def cleanup_old_snapshots(self, team_id, retention_days=RETENTION_DAYS):
    #     """Clean up old snapshots based on retention policy"""
    #     try:
    #         from datetime import timedelta
    #         cutoff_date = datetime.now() - timedelta(days=retention_days)
    #
    #         result = self.snapshots_collection.delete_many({
    #             'team_id': team_id,
    #             'timestamp': {'$lt': cutoff_date}
    #         })
    #
    #         if result.deleted_count > 0:
    #             logger.info(f"✅ Cleaned up {result.deleted_count} old snapshots for {team_id}")
    #
    #         return result.deleted_count
    #
    #     except Exception as e:
    #         logger.error(f"❌ Error cleaning up snapshots for {team_id}: {e}")
    #         return 0



    # Debug and utility methods
    def get_all_users(self):
        """Get all users for debugging"""
        try:
            users = list(self.users_collection.find({}))
            return users
        except Exception as e:
            logger.error(f"❌ Error getting all users: {e}")
            return []

    def get_stats(self):
        """Get database statistics"""
        try:
            user_count = self.users_collection.count_documents({})
            active_users_count = self.users_collection.count_documents({'active': True})

            return {
                'total_users': user_count,
                'active_users': active_users_count,
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
def create_storage(mongodb_url=None, database_name=None):
    """Create a new storage instance"""
    return SeeSayMongoStorage(mongodb_url, database_name)



if __name__ == '__main__':
    # Initialize storage manager
    try:
        storage_manager = SeeSayMongoStorage()
    except Exception as e:
        logger.error(f"❌ Failed to initialize MongoDB storage: {e}")


    # storage_manager.add_user(user_id= "123123",user_name= "TomTESTTTT",age= 1)
    # storage_manager.add_test_to_user(user_id= "123123",time_took=2,errors=10000,audio_file=None,final_evaluation="Great!")
    # # fdgss
