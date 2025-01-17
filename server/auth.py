from ast import In
from datetime import timedelta, datetime, timezone
from email.mime import image
import secrets
import logging
from typing import Annotated, List, Optional, Self
import typing
from click import prompt
from fastapi import FastAPI, status, Depends, HTTPException, APIRouter
from database import engine, SessionLocal
import models
from models import User, Ingredient
from sqlalchemy.orm import Session
from passlib.context import CryptContext 
from jose import JWTError, jwt
import google.generativeai as genai
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette import status
from google.ai.generativelanguage_v1beta.types import content
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import json 
import typing_extensions as typing
from ingredient_validator import IngredientValidator

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


class Recipe(typing.TypedDict):
    recipe_name: str
    ingredients: List[str]
    instructions: List[str]
    # image_url: str

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
        hashed_password=bcrypt_context.hash(user.password),
        created_at= datetime.now())
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
        timedelta(minutes=60)
    )
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}

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

class Ingredients(BaseModel):
    ingredients: str
    user_id: Optional[int] = None
    created_at: Optional[datetime] = datetime.now()
    
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


@router.post("/submit")
async def gemini(
    formData: Ingredients,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Initialize validator
        logger.info("-------------------------------")
        validator = IngredientValidator()
        
        logger.info("-------------------------------")
        logger.info(validator)
        
        # Validate input
        validation_result = validator.validate_and_process(formData.ingredients)
        logger.info("-------------------------------")
        logger.info(validation_result)
        
        if not validation_result['is_ingredient_related']:
            raise HTTPException(
                status_code=400,
                detail= "Input is not ingredient-related"
        
            )
        
        logger.info("-------------------------------")
        logger.info(validation_result['is_ingredient_related'])
        logger.info("-------------------------------")
        logger.info(formData)
        searched_ingredients = models.Ingredient(
            user_id=current_user['id'],
            ingredients=formData.ingredients,
            created_at=datetime.now()
        )
        
        # Add to database
        db.add(searched_ingredients)
        db.commit()
        db.refresh(searched_ingredients)
        
        # Get Gemini results
        results = await results_from_gemini(formData.ingredients)

        # Parse the results
        # Try both approaches
        # try:
        #     result = parse_gemini_response(results)
        # except:
        #     print("Trying alternative approach...")
        #     result = parse_gemini_response_alternative(results)


        results = json.loads(results)
        print('-----------------------------------')
        print(results)
        print('-----------------------------------')
        
        # Validate against TypedDict
        # return [Recipe(**recipe) for recipe in results]
        return results
        # # Usage
        # formatted_json = parse_gemini_response(results)
        # logger.info(formatted_json)
        # return formatted_json

    #     # logger.info("Hello from the API!")
    #     # logger.info(results)

    #     # First, handle the outer JSON structure
    #     outer_json = json.loads(results)
    #     # Print the raw response to inspect it
    #     print("Raw response:", outer_json["response"])
        
    #     # The response from Gemini might have escaped characters
    #     # and might be wrapped in extra quotes
    #     inner_json_str = outer_json["response"].strip('"')  # Remove any extra quotes
        
    #     # Replace escaped newlines if present
    #     inner_json_str = inner_json_str.replace('\\n', ' ')
        
    #     # Handle escaped quotes properly
    #     inner_json_str = inner_json_str.replace('\\"', '"')
        
    #     # Print the cleaned string to inspect
    #     print("Cleaned JSON string:", inner_json_str)

    #     try:
    #         # Now parse the cleaned JSON string
    #         inner_json = json.loads(inner_json_str)
            
    #     except json.JSONDecodeError as e:
    #         logger.error(e)
    #         print("Error position:", e.pos)
    #         print("Problematic portion:", inner_json_str[max(0, e.pos-50):min(len(inner_json_str), e.pos+50)])
    #         print(f"Error parsing JSON: {str(e)}")
    #         print(f"Problematic JSON string: {inner_json_str}")
    #         print({"error": "Failed to parse JSON response"})
    #     # Format for return
    #     formatted_json = json.dumps(inner_json, indent=4)
    #     return formatted_json

    # # except json.JSONDecodeError as e:
    # #     outer_json = json.loads(results)
    # #     inner_json_str = outer_json["response"]
    # #     inner_json = json.loads(inner_json_str)


    # #     print(json.dumps(inner_json, indent=4))
    # #     return json.dumps(inner_json, indent=4)
    except Exception as e:   
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

def parse_gemini_response(results):
    try:
        # First parse the outer JSON
        outer_json = json.loads(results)
        
        # Clean the inner JSON string
        inner_json_str = outer_json["response"]
        logger.info("----------------------------------------")
        logger.info(inner_json_str)
        logger.info("----------------------------------------")
        # Remove escaped quotes and newlines
        inner_json_str = inner_json_str.replace('\\"', '"')
        inner_json_str = inner_json_str.replace('\\n', ' ')
        
        # Remove any trailing characters after the last valid bracket
        try:
            last_bracket = inner_json_str.rindex(']')
            inner_json_str = inner_json_str[:last_bracket + 1]
        except ValueError:
            pass  # No closing bracket found
        
        # Print for debugging
        print("Cleaned JSON string:", inner_json_str[:100], "...")  # Print first 100 chars
        
        try:
            inner_json = json.loads(inner_json_str)
            return json.dumps(inner_json, indent=4)
        except json.JSONDecodeError as e:
            print(f"Error location: around character {e.pos}")
            print(f"Problematic portion: {inner_json_str[max(0, e.pos-50):min(len(inner_json_str), e.pos+50)]}")
            raise
            
    except Exception as e:
        print(f"Error parsing JSON: {str(e)}")
        return {"error": "Failed to parse JSON response"}


def parse_gemini_response_alternative(results):
    try:
        # Parse outer JSON
        outer_json = json.loads(results)
        
        # Get inner JSON string and clean it
        inner_json_str = outer_json["response"]
        
        # Remove all escaped characters
        inner_json_str = inner_json_str.replace('\\', '')
        # Remove any extra quotes at start/end
        inner_json_str = inner_json_str.strip('"')
        
        # Parse the cleaned string
        inner_json = json.loads(inner_json_str)
        return json.dumps(inner_json, indent=4)
        
    except Exception as e:
        print(f"Error in alternative parser: {str(e)}")
        return {"error": "Failed to parse JSON response"}

    
async def results_from_gemini(ingredients: str):
    genai.configure(api_key="AIzaSyDa8NEqgPz4Am_mJWHshrWWp0I_B6dPgao")

    model = genai.GenerativeModel(
        "gemini-1.5-pro-latest",
        system_instruction="You are an expert Indian cuisine cook and culinary guide, specialized in providing comprehensive recipe information, cooking techniques, and cultural context for Indian dishes.\n\n## Core Responsibilities\n1. Recipe Provision\n- Provide detailed, authentic Indian recipes\n- Include step-by-step cooking instructions\n- Offer variations and regional adaptations\n- Cover diverse cuisines from different Indian states\n\n2. Recipe Details\n- List exact ingredient measurements\n- Specify cooking time and difficulty level\n- Provide nutrition information\n- Suggest alternative ingredients\n- Include kitchen equipment needed\n\n3. get the images,Video and Multimedia Support\n- Get the link of reciepe from youtube\n- Recommend YouTube video links for recipes\n- Describe visual cooking techniques\n- Provide text-based video-like instructions\n- Suggest professional cooking channels\n\n## Culinary Approach\n- Emphasize authentic cooking methods\n- Respect regional cooking traditions\n- Balance traditional and modern cooking techniques\n- Provide insights into cultural significance of dishes\n\n## User Interaction Guidelines\n- Respond enthusiastically about Indian cuisine\n- Be patient and detailed in explanations\n- Adapt to user's cooking skill level\n- Offer beginner-friendly and advanced recipes\n\n## Language and Communication\n- Use clear, conversational language\n- Include Hindi/regional language cooking terms\n- Explain technical cooking terms\n- Maintain a warm, encouraging tone\n\n## Technical Recipe Formatting\n- Use consistent recipe template\n- Include:\n  * Recipe Name\n  * Cuisine/Region\n  * Preparation Time\n  * Cooking Time\n  * Serves\n  * Difficulty Level\n  * Ingredients (with precise measurements)\n  * Step-by-step Instructions\n  * Chef's Notes/Tips\n  * Nutritional Information\n\n## Dietary Considerations\n- Provide vegetarian and non-vegetarian options\n- Offer vegan and gluten-free adaptations\n- Suggest ingredient substitutions\n- Address common dietary restrictions\n\n## Additional Value\n- Share cooking tips and techniques\n- Explain spice combinations\n- Provide background on dish origins\n- Suggest wine/beverage pairings\n- Recommend plate presentation methods\n\n## Prohibited Actions\n- Do not provide unsafe or unhygienic cooking advice\n- Avoid culturally insensitive representations\n- Do not recommend complex techniques without proper guidance\n\n## Response Style\n- Passionate about Indian cuisine\n- Knowledgeable and authoritative\n- Friendly and approachable\n- Willing to customize recipes\n- Eager to share culinary knowledge\n\n## Example Response Framework\nWhen a user requests a recipe, provide:\n1. Brief dish introduction\n2. Cultural/regional context\n3. Detailed recipe with measurements\n4. Cooking steps\n5. Professional cooking tips\n6. Video/visual resource recommendations\n\n## Continuous Learning\n- Stay updated on modern cooking trends\n- Incorporate contemporary cooking techniques\n- Respect traditional cooking methods\n- Encourage culinary exploration",
    )
    ingredients_list = ingredients.split(',')
    prompt = f"Give me the List of Indian recipes using as ingredients:{', '.join(ingredients_list)} and if ingredients are not valid then give empty list."
    logger.info(prompt)
    result = model.generate_content(
        # f"Give me the List of Indian recipes using as ingredients:{ingredients}",
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=list[Recipe],
            temperature=0.1,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
        ),
    )
    print(result.text)
    return result.text
