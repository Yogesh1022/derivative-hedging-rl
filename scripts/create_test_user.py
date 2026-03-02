"""Create test user for development and testing."""

import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import select
from src.database import AsyncSessionLocal, async_engine, Base
from src.database.models import User
from src.auth.security import get_password_hash
from src.utils.logger import setup_logger

logger = setup_logger(__name__)


async def create_tables():
    """Create all database tables."""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return False


async def create_test_user():
    """Create test user for development."""
    try:
        async with AsyncSessionLocal() as session:
            # Check if user exists
            result = await session.execute(
                select(User).where(User.email == "demo@hedgerl.com")
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                logger.info("✅ Test user already exists")
                logger.info(f"   📧 Email: demo@hedgerl.com")
                logger.info(f"   🔑 Password: demo123")
                logger.info(f"   👤 Username: {existing_user.username}")
                logger.info(f"   🆔 User ID: {existing_user.id}")
                return existing_user
            
            # Create new user
            user = User(
                email="demo@hedgerl.com",
                username="demo",
                hashed_password=get_password_hash("demo123"),
                full_name="Demo User",
                is_active=True,
                is_superuser=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            logger.info("✅ Test user created successfully!")
            logger.info(f"   📧 Email: demo@hedgerl.com")
            logger.info(f"   🔑 Password: demo123")
            logger.info(f"   👤 Username: demo")
            logger.info(f"   🆔 User ID: {user.id}")
            logger.info(f"   🔐 Is Superuser: Yes")
            
            return user
            
    except Exception as e:
        logger.error(f"❌ Failed to create test user: {e}")
        raise


async def create_additional_users():
    """Create additional test users for different roles."""
    users_to_create = [
        {
            "email": "trader@hedgerl.com",
            "username": "trader",
            "password": "trader123",
            "full_name": "Test Trader",
            "is_superuser": False,
        },
        {
            "email": "researcher@hedgerl.com",
            "username": "researcher",
            "password": "research123",
            "full_name": "Test Researcher",
            "is_superuser": False,
        },
        {
            "email": "admin@hedgerl.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "Test Admin",
            "is_superuser": True,
        },
    ]
    
    created = []
    
    try:
        async with AsyncSessionLocal() as session:
            for user_data in users_to_create:
                # Check if user exists
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    logger.info(f"   User {user_data['email']} already exists")
                    continue
                
                # Create user
                user = User(
                    email=user_data["email"],
                    username=user_data["username"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    is_active=True,
                    is_superuser=user_data["is_superuser"],
                )
                session.add(user)
                created.append(user_data["email"])
            
            await session.commit()
            
            if created:
                logger.info(f"✅ Created {len(created)} additional users")
                for email in created:
                    logger.info(f"   - {email}")
            
    except Exception as e:
        logger.error(f"❌ Failed to create additional users: {e}")
        raise


async def main():
    """Main execution."""
    logger.info("=" * 60)
    logger.info("🗄️  Database Setup Script")
    logger.info("=" * 60)
    
    # Step 1: Create tables
    logger.info("\n📋 Step 1: Creating database tables...")
    if not await create_tables():
        logger.error("Database setup failed!")
        return False
    
    # Step 2: Create main test user
    logger.info("\n👤 Step 2: Creating main test user...")
    await create_test_user()
    
    # Step 3: Create additional users
    logger.info("\n👥 Step 3: Creating additional test users...")
    await create_additional_users()
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ Database setup completed successfully!")
    logger.info("=" * 60)
    logger.info("\n📝 Available Test Users:")
    logger.info("   1. demo@hedgerl.com / demo123 (Superuser)")
    logger.info("   2. trader@hedgerl.com / trader123")
    logger.info("   3. researcher@hedgerl.com / research123")
    logger.info("   4. admin@hedgerl.com / admin123 (Superuser)")
    logger.info("\n🚀 You can now start the backend server:")
    logger.info("   uvicorn src.api.main:app --reload")
    logger.info("=" * 60)
    
    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ Setup failed: {e}")
        sys.exit(1)
