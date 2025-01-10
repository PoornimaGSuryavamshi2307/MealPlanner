from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

password = quote_plus("pgAdmin@123")
# DATABASE_URL = f"postgresql://postgres:{password}@localhost:5432/mealplanner"
DATABASE_URL = f"postgresql://mealplanner_e4d8_user:syzSwYqwSyDUa7WlCrbHVAh0BP8RDVgr@dpg-cu0cvg5umphs7381oimg-a/mealplanner_e4d8"

engine = create_engine(DATABASE_URL, echo=True)  # Added echo=True for debugging

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()