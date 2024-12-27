from database import Base, engine
from sqlalchemy import Integer, String, Column, Boolean



class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    
# def create_tables():
#     Base.metadata.create_all(bind=engine)