from database import engine, Base
from models import User  # Important: import the User model

if __name__ == "__main__":
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"An error occurred: {e}")