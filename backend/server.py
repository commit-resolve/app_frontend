from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ==================== MODELS ====================

# Auth Models
class UserRegister(BaseModel):
    email: str
    phone: str
    name: str
    password: str

class UserLogin(BaseModel):
    identifier: str  # Can be email or phone
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: Optional[str] = None
    email: str
    phone: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Mandate Models
class MandateCreate(BaseModel):
    goal_name: str
    percentage: float  # e.g., 10.0 for 10%
    target_amount: float
    description: Optional[str] = None

class Mandate(BaseModel):
    id: Optional[str] = None
    user_id: str
    goal_name: str
    percentage: float
    target_amount: float
    current_savings: float = 0.0
    status: str = "active"  # active, paused, completed
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Transaction Models
class TransactionSimulate(BaseModel):
    amount: float
    description: str
    category: Optional[str] = "UPI Payment"

class Transaction(BaseModel):
    id: Optional[str] = None
    user_id: str
    amount: float
    type: str  # debit, credit, savings
    category: str
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Savings Models
class Saving(BaseModel):
    id: Optional[str] = None
    user_id: str
    mandate_id: str
    amount: float
    source_transaction_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DashboardStats(BaseModel):
    total_savings: float
    active_mandates: int
    total_transactions: int
    recent_transactions: List[Transaction]
    mandates: List[Mandate]

# ==================== AUTH FUNCTIONS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return serialize_doc(user)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [{"email": user_data.email}, {"phone": user_data.phone}]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "email": user_data.email,
        "phone": user_data.phone,
        "name": user_data.name,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    # Find user by email or phone
    user = await db.users.find_one({
        "$or": [{"email": login_data.identifier}, {"phone": login_data.identifier}]
    })
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ==================== MANDATE ROUTES ====================

@api_router.post("/mandates", response_model=Mandate)
async def create_mandate(mandate_data: MandateCreate, current_user: dict = Depends(get_current_user)):
    mandate_dict = {
        "user_id": current_user["id"],
        "goal_name": mandate_data.goal_name,
        "percentage": mandate_data.percentage,
        "target_amount": mandate_data.target_amount,
        "current_savings": 0.0,
        "status": "active",
        "description": mandate_data.description,
        "created_at": datetime.utcnow()
    }
    
    result = await db.mandates.insert_one(mandate_dict)
    mandate_dict["id"] = str(result.inserted_id)
    if "_id" in mandate_dict:
        del mandate_dict["_id"]
    
    return Mandate(**mandate_dict)

@api_router.get("/mandates", response_model=List[Mandate])
async def get_mandates(current_user: dict = Depends(get_current_user)):
    mandates = await db.mandates.find({"user_id": current_user["id"]}).to_list(100)
    return [Mandate(**serialize_doc(m)) for m in mandates]

@api_router.put("/mandates/{mandate_id}")
async def update_mandate(mandate_id: str, status: str, current_user: dict = Depends(get_current_user)):
    result = await db.mandates.update_one(
        {"_id": ObjectId(mandate_id), "user_id": current_user["id"]},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mandate not found")
    
    return {"message": "Mandate updated successfully"}

@api_router.delete("/mandates/{mandate_id}")
async def delete_mandate(mandate_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.mandates.delete_one(
        {"_id": ObjectId(mandate_id), "user_id": current_user["id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mandate not found")
    
    return {"message": "Mandate deleted successfully"}

# ==================== TRANSACTION ROUTES ====================

@api_router.post("/transactions/simulate")
async def simulate_transaction(transaction_data: TransactionSimulate, current_user: dict = Depends(get_current_user)):
    # Create the main transaction (debit)
    transaction_dict = {
        "user_id": current_user["id"],
        "amount": transaction_data.amount,
        "type": "debit",
        "category": transaction_data.category,
        "description": transaction_data.description,
        "timestamp": datetime.utcnow()
    }
    
    result = await db.transactions.insert_one(transaction_dict)
    transaction_id = str(result.inserted_id)
    
    # Get all active mandates for this user
    mandates = await db.mandates.find({
        "user_id": current_user["id"],
        "status": "active"
    }).to_list(100)
    
    savings_breakdown = []
    
    # Process each mandate
    for mandate in mandates:
        # Calculate savings amount
        savings_amount = (transaction_data.amount * mandate["percentage"]) / 100
        
        # Create savings record
        saving_dict = {
            "user_id": current_user["id"],
            "mandate_id": str(mandate["_id"]),
            "amount": savings_amount,
            "source_transaction_id": transaction_id,
            "timestamp": datetime.utcnow()
        }
        await db.savings.insert_one(saving_dict)
        
        # Update mandate current_savings
        new_savings = mandate["current_savings"] + savings_amount
        await db.mandates.update_one(
            {"_id": mandate["_id"]},
            {"$set": {"current_savings": new_savings}}
        )
        
        # Create a credit transaction for the savings
        credit_dict = {
            "user_id": current_user["id"],
            "amount": savings_amount,
            "type": "savings",
            "category": f"Auto-save: {mandate['goal_name']}",
            "description": f"Saved {mandate['percentage']}% from {transaction_data.description}",
            "timestamp": datetime.utcnow()
        }
        await db.transactions.insert_one(credit_dict)
        
        # Check if goal is completed
        if new_savings >= mandate["target_amount"]:
            await db.mandates.update_one(
                {"_id": mandate["_id"]},
                {"$set": {"status": "completed"}}
            )
        
        savings_breakdown.append({
            "goal_name": mandate["goal_name"],
            "percentage": mandate["percentage"],
            "amount": savings_amount
        })
    
    return {
        "message": "Transaction simulated successfully",
        "transaction_amount": transaction_data.amount,
        "total_saved": sum(s["amount"] for s in savings_breakdown),
        "savings_breakdown": savings_breakdown
    }

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": current_user["id"]}
    ).sort("timestamp", -1).to_list(100)
    
    return [Transaction(**serialize_doc(t)) for t in transactions]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    # Get total savings
    mandates = await db.mandates.find({"user_id": current_user["id"]}).to_list(100)
    total_savings = sum(m.get("current_savings", 0) for m in mandates)
    active_mandates = len([m for m in mandates if m.get("status") == "active"])
    
    # Get total transactions
    total_transactions = await db.transactions.count_documents({"user_id": current_user["id"]})
    
    # Get recent transactions
    recent_transactions = await db.transactions.find(
        {"user_id": current_user["id"]}
    ).sort("timestamp", -1).limit(5).to_list(5)
    
    return DashboardStats(
        total_savings=total_savings,
        active_mandates=active_mandates,
        total_transactions=total_transactions,
        recent_transactions=[Transaction(**serialize_doc(t)) for t in recent_transactions],
        mandates=[Mandate(**serialize_doc(m)) for m in mandates]
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
