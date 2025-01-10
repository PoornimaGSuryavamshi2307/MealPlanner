from datetime import datetime
from email.policy import default
from database import Base, engine
from sqlalchemy import Integer, String, Column, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.orm import configure_mappers
configure_mappers()



class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    ingredients = relationship("Ingredient", back_populates="user", cascade="all, delete")
    created_at = Column(DateTime, default=datetime.now)
class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    ingredients = Column(String)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE")) 
    created_at = Column(DateTime, default=datetime.now)
    
     # Foreign Key linking to User table
    # user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # # Many-to-One relationship: Many Posts can belong to One User
    user = relationship("User", back_populates="ingredients")


# Configure mappers after all models are defined
from sqlalchemy.orm import configure_mappers
configure_mappers()

# Create tables
Base.metadata.create_all(bind=engine)