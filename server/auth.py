# Remove this import as it's not needed and could cause conflicts
# import token  
from datetime import timedelta, datetime, timezone
import secrets
from typing import Annotated
from fastapi import FastAPI, status, Depends, HTTPException, APIRouter
from database import engine, SessionLocal
from models import User
from sqlalchemy.orm import Session
from passlib.context import CryptContext 
from jose import JWTError, jwt
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette import status

router = APIRouter(
    tags=["auth"],
    prefix="/auth"
)

SECRET_KEY = "f7b3e1234"
ALGORITHM = "HS256"

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")

class CreateUserRequest(BaseModel):  # Changed to PascalCase as per convention
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(user: CreateUserRequest, db: db_dependency):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    new_user = User(
        username=user.username,
        email=user.email, 
        hashed_password=bcrypt_context.hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: db_dependency
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    token = create_access_token(
        user.username,
        user.id,
        timedelta(minutes=20)
    )
    return {"access_token": token, "token_type": "bearer"}

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email"
        )
    if not bcrypt_context.verify(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    return user

def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    to_encode = {"sub": username, "id": user_id}
    expires = datetime.now(tz=timezone.utc) + expires_delta
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str,Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user"
            )
        return {"username": username, "id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate user"
        )
    
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class PasswordReset(BaseModel):
    email: str
    
class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # In a stateless JWT system, the client simply needs to remove the token
    # For additional security, you could implement a token blacklist
    return {"message": "Successfully logged out"}

@router.post("/password-reset", response_model=dict)
def request_password_reset(reset_data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_password_token = reset_token
    db.commit()
    
    # In a real application, you would send this token via email
    # For demo purposes, we'll just return it
    return {
        "message": "Password reset token generated",
        "reset_token": reset_token  # In production, send this via email instead
    }

@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.reset_password_token == reset_data.token).first()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.reset_password_token = None
    db.commit()
    
    return {"message": "Password successfully reset"}

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)