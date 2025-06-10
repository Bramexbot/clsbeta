from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import jwt
from passlib.context import CryptContext
import bcrypt
import requests
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Admin credentials
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@cl-scripter.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "scripter2024")  # Change this in production

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_admin: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    language: str
    tutorial_id: int
    completed: bool = False
    code_snapshot: Optional[str] = None
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    completion_time: Optional[datetime] = None

class CodeExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    language: str
    code: str
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: datetime = Field(default_factory=datetime.utcnow)
    tutorial_id: Optional[int] = None

# Admin Analytics Models
class UserStats(BaseModel):
    total_users: int
    active_today: int
    active_this_week: int
    new_this_week: int

class LanguageStats(BaseModel):
    language: str
    total_users: int
    total_completions: int
    avg_completion_rate: float

class TutorialStats(BaseModel):
    language: str
    tutorial_id: int
    tutorial_title: str
    completion_rate: float
    avg_time_spent: Optional[float] = None
    common_errors: List[str] = []

class AdminDashboard(BaseModel):
    user_stats: UserStats
    language_stats: List[LanguageStats]
    tutorial_stats: List[TutorialStats]
    recent_activity: List[Dict[str, Any]]

# Auth utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Define Models (existing)
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    message: str
    response: str
    context: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: Optional[str] = None
    current_code: Optional[str] = None
    error_message: Optional[str] = None
    tutorial_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Online compiler integration
class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    tutorial_id: Optional[int] = None

class CodeExecutionResponse(BaseModel):
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: float

# Online compiler function
async def execute_code_online(language: str, code: str) -> CodeExecutionResponse:
    """Execute code using online compiler APIs"""
    
    # Language mapping for different APIs
    language_map = {
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'python': 'python3',
        'javascript': 'nodejs',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust'
    }
    
    if language not in language_map:
        return CodeExecutionResponse(error=f"Language {language} not supported")
    
    try:
        # Using JDoodle API (free tier available)
        api_url = "https://api.jdoodle.com/v1/execute"
        
        payload = {
            "clientId": os.getenv("JDOODLE_CLIENT_ID", "your_client_id"),  # Get from JDoodle
            "clientSecret": os.getenv("JDOODLE_CLIENT_SECRET", "your_secret"),  # Get from JDoodle
            "script": code,
            "language": language_map[language],
            "versionIndex": "0"
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        start_time = datetime.utcnow()
        response = requests.post(api_url, headers=headers, json=payload, timeout=10)
        end_time = datetime.utcnow()
        
        execution_time = (end_time - start_time).total_seconds()
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get("error"):
                return CodeExecutionResponse(
                    error=result["error"],
                    execution_time=execution_time
                )
            else:
                return CodeExecutionResponse(
                    output=result.get("output", ""),
                    execution_time=execution_time
                )
        else:
            return CodeExecutionResponse(
                error="Compilation service unavailable",
                execution_time=execution_time
            )
            
    except requests.exceptions.Timeout:
        return CodeExecutionResponse(error="Code execution timed out")
    except Exception as e:
        return CodeExecutionResponse(error=f"Execution error: {str(e)}")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    # Check if this is admin user
    is_admin = user_data.email == ADMIN_EMAIL
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        is_admin=is_admin
    )
    
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user.dict())
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_obj.dict())
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Code execution routes
@api_router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(
    request: CodeExecutionRequest,
    current_user: Optional[User] = Depends(lambda credentials: get_current_user(credentials) if credentials else None)
):
    result = await execute_code_online(request.language, request.code)
    
    # Log execution for analytics
    execution_log = CodeExecution(
        user_id=current_user.id if current_user else None,
        session_id=f"exec_{datetime.utcnow().timestamp()}",
        language=request.language,
        code=request.code,
        output=result.output,
        error=result.error,
        tutorial_id=request.tutorial_id
    )
    
    await db.code_executions.insert_one(execution_log.dict())
    
    return result

# Progress Routes
@api_router.post("/progress", response_model=UserProgress)
async def save_progress(
    progress_data: dict,
    current_user: User = Depends(get_current_user)
):
    # Find existing progress or create new
    existing_progress = await db.user_progress.find_one({
        "user_id": current_user.id,
        "language": progress_data["language"],
        "tutorial_id": progress_data["tutorial_id"]
    })
    
    if existing_progress:
        # Update existing progress
        update_data = {
            "completed": progress_data.get("completed", False),
            "code_snapshot": progress_data.get("code_snapshot"),
            "last_accessed": datetime.utcnow()
        }
        if progress_data.get("completed"):
            update_data["completion_time"] = datetime.utcnow()
            
        await db.user_progress.update_one(
            {"id": existing_progress["id"]},
            {"$set": update_data}
        )
        
        updated_progress = await db.user_progress.find_one({"id": existing_progress["id"]})
        return UserProgress(**updated_progress)
    else:
        # Create new progress
        progress = UserProgress(
            user_id=current_user.id,
            language=progress_data["language"],
            tutorial_id=progress_data["tutorial_id"],
            completed=progress_data.get("completed", False),
            code_snapshot=progress_data.get("code_snapshot")
        )
        
        if progress_data.get("completed"):
            progress.completion_time = datetime.utcnow()
            
        await db.user_progress.insert_one(progress.dict())
        return progress

@api_router.get("/progress", response_model=List[UserProgress])
async def get_user_progress(current_user: User = Depends(get_current_user)):
    progress_list = await db.user_progress.find({"user_id": current_user.id}).to_list(1000)
    return [UserProgress(**progress) for progress in progress_list]

@api_router.get("/progress/{language}")
async def get_language_progress(
    language: str,
    current_user: User = Depends(get_current_user)
):
    progress_list = await db.user_progress.find({
        "user_id": current_user.id,
        "language": language
    }).to_list(1000)
    return [UserProgress(**progress) for progress in progress_list]

# Admin Analytics Routes
@api_router.get("/admin/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard(admin_user: User = Depends(get_admin_user)):
    """Get comprehensive admin dashboard data"""
    
    # User statistics
    total_users = await db.users.count_documents({})
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    active_today = await db.user_progress.count_documents({
        "last_accessed": {"$gte": today}
    })
    
    active_this_week = await db.user_progress.count_documents({
        "last_accessed": {"$gte": week_ago}
    })
    
    new_this_week = await db.users.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    user_stats = UserStats(
        total_users=total_users,
        active_today=active_today,
        active_this_week=active_this_week,
        new_this_week=new_this_week
    )
    
    # Language statistics
    language_pipeline = [
        {"$group": {
            "_id": "$language",
            "total_users": {"$addToSet": "$user_id"},
            "total_completions": {"$sum": {"$cond": ["$completed", 1, 0]}},
            "total_attempts": {"$sum": 1}
        }},
        {"$project": {
            "language": "$_id",
            "total_users": {"$size": "$total_users"},
            "total_completions": 1,
            "avg_completion_rate": {
                "$divide": ["$total_completions", "$total_attempts"]
            }
        }}
    ]
    
    language_stats_cursor = db.user_progress.aggregate(language_pipeline)
    language_stats = []
    
    async for stat in language_stats_cursor:
        language_stats.append(LanguageStats(
            language=stat["language"],
            total_users=stat["total_users"],
            total_completions=stat["total_completions"],
            avg_completion_rate=stat["avg_completion_rate"]
        ))
    
    # Tutorial statistics
    tutorial_pipeline = [
        {"$group": {
            "_id": {
                "language": "$language",
                "tutorial_id": "$tutorial_id"
            },
            "total_attempts": {"$sum": 1},
            "completions": {"$sum": {"$cond": ["$completed", 1, 0]}}
        }},
        {"$project": {
            "language": "$_id.language",
            "tutorial_id": "$_id.tutorial_id",
            "completion_rate": {
                "$divide": ["$completions", "$total_attempts"]
            }
        }}
    ]
    
    tutorial_stats_cursor = db.user_progress.aggregate(tutorial_pipeline)
    tutorial_stats = []
    
    # Tutorial titles mapping
    tutorial_titles = {
        "javascript": {1: "Hello World", 2: "Variables", 3: "Math Operations", 4: "Functions"},
        "python": {1: "Hello World", 2: "Variables", 3: "Math & Numbers", 4: "Functions"},
        "html": {1: "Hello Web", 2: "Text & Paragraphs", 3: "Colors & Styling", 4: "Layout & Structure"}
    }
    
    async for stat in tutorial_stats_cursor:
        title = tutorial_titles.get(stat["language"], {}).get(stat["tutorial_id"], f"Tutorial {stat['tutorial_id']}")
        tutorial_stats.append(TutorialStats(
            language=stat["language"],
            tutorial_id=stat["tutorial_id"],
            tutorial_title=title,
            completion_rate=stat["completion_rate"]
        ))
    
    # Recent activity
    recent_activity_cursor = db.user_progress.find({}).sort("last_accessed", -1).limit(10)
    recent_activity = []
    
    async for activity in recent_activity_cursor:
        user = await db.users.find_one({"id": activity["user_id"]})
        recent_activity.append({
            "username": user["username"] if user else "Unknown",
            "language": activity["language"],
            "tutorial_id": activity["tutorial_id"],
            "completed": activity["completed"],
            "timestamp": activity["last_accessed"]
        })
    
    return AdminDashboard(
        user_stats=user_stats,
        language_stats=language_stats,
        tutorial_stats=tutorial_stats,
        recent_activity=recent_activity
    )

@api_router.get("/admin/users")
async def get_users_analytics(admin_user: User = Depends(get_admin_user)):
    """Get detailed user analytics"""
    
    users_cursor = db.users.find({}, {"hashed_password": 0})  # Exclude password
    users = []
    
    async for user in users_cursor:
        # Get user progress count
        progress_count = await db.user_progress.count_documents({"user_id": user["id"]})
        completions = await db.user_progress.count_documents({
            "user_id": user["id"],
            "completed": True
        })
        
        # Get last activity
        last_progress = await db.user_progress.find_one(
            {"user_id": user["id"]},
            sort=[("last_accessed", -1)]
        )
        
        user_data = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": user["created_at"],
            "last_login": user.get("last_login"),
            "total_progress": progress_count,
            "completions": completions,
            "last_activity": last_progress["last_accessed"] if last_progress else None,
            "current_language": last_progress["language"] if last_progress else None
        }
        users.append(user_data)
    
    return users

@api_router.get("/admin/errors")
async def get_common_errors(admin_user: User = Depends(get_admin_user)):
    """Get common errors from code executions"""
    
    error_pipeline = [
        {"$match": {"error": {"$ne": None}}},
        {"$group": {
            "_id": {
                "language": "$language",
                "error": "$error"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    
    errors_cursor = db.code_executions.aggregate(error_pipeline)
    errors = []
    
    async for error in errors_cursor:
        errors.append({
            "language": error["_id"]["language"],
            "error": error["_id"]["error"],
            "count": error["count"]
        })
    
    return errors

# Existing routes with auth integration
@api_router.get("/")
async def root():
    return {"message": "Code Learning Scripter API is running!"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: Optional[User] = Depends(lambda credentials: get_current_user(credentials) if credentials else None)
):
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Build context-aware system message
        system_message = """You are a helpful coding tutor specializing in multiple programming languages for complete beginners. 
        
Your role:
- Help students learn programming step by step
- Explain concepts in simple, beginner-friendly language
- Debug code issues and provide clear explanations
- Encourage learning and provide positive feedback
- Give specific, actionable guidance

Guidelines:
- Keep responses concise but informative (2-3 sentences max for simple questions)
- Use encouraging, patient tone
- Provide code examples when helpful
- Focus on understanding, not just answers
- If a student is stuck, offer hints before full solutions"""

        # Enhance system message with context
        if request.context:
            system_message += f"\n\nCurrent context: {request.context}"
        
        if request.current_code:
            system_message += f"\n\nStudent's current code:\n```\n{request.current_code}\n```"
            
        if request.error_message:
            system_message += f"\n\nCurrent error: {request.error_message}"
            
        if request.tutorial_id:
            system_message += f"\n\nCurrent tutorial ID: {request.tutorial_id}"

        # Initialize Gemini chat
        chat = LlmChat(
            api_key=gemini_api_key,
            session_id=request.session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(500)

        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        # Save conversation to database
        chat_record = ChatMessage(
            session_id=request.session_id,
            user_id=current_user.id if current_user else None,
            message=request.message,
            response=response,
            context=request.context
        )
        await db.chat_messages.insert_one(chat_record.dict())
        
        return ChatResponse(
            response=response,
            session_id=request.session_id
        )
        
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 10,
    current_user: Optional[User] = Depends(lambda credentials: get_current_user(credentials) if credentials else None)
):
    """Get chat history for a session"""
    try:
        query = {"session_id": session_id}
        if current_user:
            query["user_id"] = current_user.id
            
        chat_history = await db.chat_messages.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return [ChatMessage(**chat) for chat in chat_history]
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving chat history")

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