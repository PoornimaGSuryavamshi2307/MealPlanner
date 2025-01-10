from fastapi import FastAPI, status, Depends, HTTPException
from database import engine, SessionLocal
from typing import Annotated
from databases import Database, DatabaseURL
from sqlalchemy.orm import Session
import models
from sqlalchemy import create_engine, Column, String, Integer, MetaData, Table
from pydantic import BaseModel
from auth import get_current_user, router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(router)

# models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@app.get("/", status_code=status.HTTP_200_OK)
async def user(user: user_dependency, db:db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    return {"user": user}


# @app.get("/user")
# async def get_user(db: Session = db_dependency, user_id: int = None):
#     if user_id is None:
#         raise HTTPException(status_code=401, detail="Authentication Failed")
#     user = db.query(models.User).filter(models.User.id == user_id).first()
#     if user is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     return user