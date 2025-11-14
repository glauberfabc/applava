from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import base64
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google Vision API
GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# =======================
# MODELS
# =======================

class UserRole:
    ADMIN = "admin"
    COLLABORATOR = "collaborator"
    CLIENT = "client"

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = UserRole.COLLABORATOR

class UserLogin(BaseModel):
    email: str
    password: str

class PlateLogin(BaseModel):
    plate: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class ClientCreate(BaseModel):
    name: str
    phone: str
    plate: Optional[str] = None

class ServiceCreate(BaseModel):
    name: str
    price: float
    estimated_duration: int  # minutes
    description: Optional[str] = None

class VehicleCreate(BaseModel):
    plate: str
    client_name: str
    client_phone: str
    services: List[str]  # service IDs
    observations: Optional[str] = None
    photos: List[str] = []  # base64 images

class VehicleUpdate(BaseModel):
    status: Optional[str] = None
    photos: Optional[List[str]] = None
    observations: Optional[str] = None

class AppointmentCreate(BaseModel):
    client_phone: str
    vehicle_plate: str
    services: List[str]
    date: str
    time: str
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    vehicle_id: str
    amount: float
    payment_method: str
    stripe_token: Optional[str] = None

class OCRRequest(BaseModel):
    image_base64: str

# =======================
# HELPER FUNCTIONS
# =======================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthCredential = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return user

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result[key] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

# =======================
# OCR SERVICE
# =======================

async def perform_ocr(image_base64: str) -> str:
    """Use Google Vision API to extract text from license plate"""
    if not GOOGLE_VISION_API_KEY:
        raise HTTPException(status_code=500, detail="Google Vision API key not configured")
    
    # Remove data URL prefix if present
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"
    
    request_body = {
        "requests": [{
            "image": {"content": image_base64},
            "features": [{"type": "TEXT_DETECTION", "maxResults": 10}]
        }]
    }
    
    try:
        response = requests.post(url, json=request_body, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if 'responses' in result and len(result['responses']) > 0:
            annotations = result['responses'][0].get('textAnnotations', [])
            if annotations:
                # First annotation contains all detected text
                full_text = annotations[0].get('description', '').strip()
                # Remove spaces and newlines
                plate_text = ''.join(full_text.split()).upper()
                return plate_text
        
        return ""
    except Exception as e:
        logging.error(f"OCR error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

# =======================
# AUTHENTICATION ROUTES
# =======================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    
    token = create_access_token({"user_id": str(result.inserted_id), "role": user_data.role})
    
    user_response = {
        "id": user_doc["_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"]
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": str(user["_id"]), "role": user["role"]})
    
    user_response = {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@api_router.post("/auth/login-plate", response_model=TokenResponse)
async def login_with_plate(plate_data: PlateLogin):
    # Find vehicle with this plate
    vehicle = await db.vehicles.find_one({"plate": plate_data.plate.upper()})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get client info
    client = await db.clients.find_one({"phone": vehicle["client_phone"]})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    token = create_access_token({
        "user_id": str(client["_id"]),
        "role": UserRole.CLIENT,
        "plate": plate_data.plate.upper()
    })
    
    user_response = {
        "id": str(client["_id"]),
        "name": client["name"],
        "phone": client["phone"],
        "plate": plate_data.plate.upper(),
        "role": UserRole.CLIENT
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_doc(current_user)

# =======================
# VEHICLE ROUTES
# =======================

@api_router.post("/vehicles/ocr")
async def ocr_plate(ocr_data: OCRRequest, current_user: dict = Depends(get_current_user)):
    plate_text = await perform_ocr(ocr_data.image_base64)
    return {"plate": plate_text}

@api_router.post("/vehicles")
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    # Check if client exists
    client = await db.clients.find_one({"phone": vehicle_data.client_phone})
    if not client:
        # Create new client
        client_doc = {
            "name": vehicle_data.client_name,
            "phone": vehicle_data.client_phone,
            "created_at": datetime.utcnow()
        }
        result = await db.clients.insert_one(client_doc)
        client = client_doc
        client["_id"] = result.inserted_id
    
    vehicle_doc = {
        "plate": vehicle_data.plate.upper(),
        "client_name": vehicle_data.client_name,
        "client_phone": vehicle_data.client_phone,
        "client_id": str(client["_id"]),
        "services": vehicle_data.services,
        "status": "waiting",  # waiting, in_progress, completed
        "observations": vehicle_data.observations,
        "photos": vehicle_data.photos,
        "entry_date": datetime.utcnow(),
        "created_by": str(current_user["_id"]),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.vehicles.insert_one(vehicle_doc)
    vehicle_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(vehicle_doc)

@api_router.get("/vehicles")
async def get_vehicles(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    # Client can only see their own vehicles
    if current_user["role"] == UserRole.CLIENT:
        query["client_phone"] = current_user.get("phone")
    
    if status:
        query["status"] = status
    
    vehicles = await db.vehicles.find(query).sort("entry_date", -1).to_list(1000)
    
    # Get service details for each vehicle
    for vehicle in vehicles:
        service_ids = [ObjectId(sid) for sid in vehicle.get("services", []) if ObjectId.is_valid(sid)]
        services = await db.services.find({"_id": {"$in": service_ids}}).to_list(100)
        vehicle["service_details"] = [serialize_doc(s) for s in services]
    
    return [serialize_doc(v) for v in vehicles]

@api_router.get("/vehicles/{plate}")
async def get_vehicle_by_plate(plate: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"plate": plate.upper()})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get service details
    service_ids = [ObjectId(sid) for sid in vehicle.get("services", []) if ObjectId.is_valid(sid)]
    services = await db.services.find({"_id": {"$in": service_ids}}).to_list(100)
    vehicle["service_details"] = [serialize_doc(s) for s in services]
    
    return serialize_doc(vehicle)

@api_router.patch("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, update_data: VehicleUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.vehicles.update_one(
        {"_id": ObjectId(vehicle_id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle = await db.vehicles.find_one({"_id": ObjectId(vehicle_id)})
    return serialize_doc(vehicle)

# =======================
# SERVICE ROUTES
# =======================

@api_router.post("/services")
async def create_service(service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create services")
    
    service_doc = {
        **service_data.dict(),
        "active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await db.services.insert_one(service_doc)
    service_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(service_doc)

@api_router.get("/services")
async def get_services():
    services = await db.services.find({"active": True}).to_list(1000)
    return [serialize_doc(s) for s in services]

@api_router.patch("/services/{service_id}")
async def update_service(service_id: str, service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update services")
    
    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": service_data.dict()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    return serialize_doc(service)

# =======================
# APPOINTMENTS ROUTES
# =======================

@api_router.post("/appointments")
async def create_appointment(appointment_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    appointment_doc = {
        **appointment_data.dict(),
        "status": "scheduled",
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment_doc)
    appointment_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(appointment_doc)

@api_router.get("/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == UserRole.CLIENT:
        query["client_phone"] = current_user.get("phone")
    
    appointments = await db.appointments.find(query).sort("date", -1).to_list(1000)
    return [serialize_doc(a) for a in appointments]

# =======================
# DASHBOARD ROUTES
# =======================

@api_router.get("/dashboard/metrics")
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Count vehicles in yard
    vehicles_in_yard = await db.vehicles.count_documents({"status": {"$in": ["waiting", "in_progress"]}})
    
    # Today's appointments
    today = datetime.utcnow().date().isoformat()
    appointments_today = await db.appointments.count_documents({"date": today})
    
    # Services completed today
    start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    completed_today = await db.vehicles.count_documents({
        "status": "completed",
        "updated_at": {"$gte": start_of_day}
    })
    
    # Revenue calculation
    payments_today = await db.payments.find({
        "date": {"$gte": start_of_day},
        "status": "paid"
    }).to_list(1000)
    revenue_today = sum(p.get("amount", 0) for p in payments_today)
    
    # Monthly revenue
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payments_month = await db.payments.find({
        "date": {"$gte": start_of_month},
        "status": "paid"
    }).to_list(1000)
    revenue_month = sum(p.get("amount", 0) for p in payments_month)
    
    return {
        "vehicles_in_yard": vehicles_in_yard,
        "appointments_today": appointments_today,
        "completed_today": completed_today,
        "revenue_today": revenue_today,
        "revenue_month": revenue_month
    }

# =======================
# PAYMENT ROUTES
# =======================

@api_router.post("/payments")
async def create_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    payment_doc = {
        "vehicle_id": payment_data.vehicle_id,
        "amount": payment_data.amount,
        "payment_method": payment_data.payment_method,
        "stripe_token": payment_data.stripe_token,
        "status": "paid",
        "date": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    
    result = await db.payments.insert_one(payment_doc)
    payment_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(payment_doc)

@api_router.get("/payments")
async def get_payments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    payments = await db.payments.find().sort("date", -1).to_list(1000)
    return [serialize_doc(p) for p in payments]

# =======================
# CLIENTS ROUTES
# =======================

@api_router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    clients = await db.clients.find().sort("created_at", -1).to_list(1000)
    return [serialize_doc(c) for c in clients]

@api_router.post("/clients")
async def create_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    client_doc = {
        **client_data.dict(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.clients.insert_one(client_doc)
    client_doc["_id"] = str(result.inserted_id)
    
    return serialize_doc(client_doc)

# Include router
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
