"""
Database Configuration for 3D Character Admiring App (MCP Phase)
Uses SQLite for development as specified in requirements
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base
import os

# Database configuration
DATABASE_URL = "sqlite:///./character_admiring.db"

# Create SQLAlchemy engine
# Using SQLite for MCP phase as per requirements
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL query debugging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize database by creating all tables
    Called during application startup
    """
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
        
        # Create database directory if it doesn't exist
        db_dir = os.path.dirname(os.path.abspath("character_admiring.db"))
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise


def get_database():
    """
    Dependency to get database session
    Use this in FastAPI route dependencies
    """
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


def get_db():
    """
    Generator function for database session dependency
    Used with FastAPI Depends()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database utility functions
def reset_database():
    """
    Reset database by dropping and recreating all tables
    USE WITH CAUTION - This will delete all data!
    """
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database reset successfully")
    except Exception as e:
        print(f"Error resetting database: {e}")
        raise


def backup_database(backup_path: str = None):
    """
    Create a backup of the SQLite database
    """
    import shutil
    from datetime import datetime
    
    if backup_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"backup_character_admiring_{timestamp}.db"
    
    try:
        shutil.copy2("character_admiring.db", backup_path)
        print(f"Database backed up to: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"Error backing up database: {e}")
        raise


def get_db_stats():
    """
    Get database statistics for monitoring
    """
    db = get_database()
    try:
        from models.models import User, ChatMessage, OTPCode
        
        stats = {
            "total_users": db.query(User).count(),
            "active_users": db.query(User).filter(User.is_active == True).count(),
            "total_messages": db.query(ChatMessage).count(),
            "pending_otps": db.query(OTPCode).filter(
                OTPCode.is_used == False,
                OTPCode.expires_at > datetime.utcnow()
            ).count()
        }
        
        return stats
        
    except Exception as e:
        print(f"Error getting database stats: {e}")
        return {"error": str(e)}
    finally:
        db.close()


# Database health check
def check_db_health():
    """
    Check database connectivity and health
    """
    try:
        db = get_database()
        # Simple query to test connection
        db.execute("SELECT 1")
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
