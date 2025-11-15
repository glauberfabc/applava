# CLAUDE.md - Applava Codebase Guide for AI Assistants

## Project Overview

**Applava** is a full-stack **Automotive Detailing Management System** (Estética Automotiva) designed to manage car detailing business operations. The application provides comprehensive features for vehicle tracking, service management, scheduling, and payment processing.

### Application Purpose
- Vehicle registration and tracking through the detailing process
- Service management and scheduling
- Role-based access for Admins, Collaborators, and Clients
- Real-time vehicle status updates
- Payment processing via Stripe
- Dashboard analytics and business metrics
- Automated license plate recognition using Google Vision OCR
- Photo documentation for each service stage

### User Roles
1. **Admin**: Full system access, dashboard metrics, financial management, user management
2. **Collaborator**: Vehicle registration, yard management, service history tracking
3. **Client**: View vehicle status, schedule appointments, view service history

---

## Tech Stack

### Frontend
- **Framework**: React Native 0.79.5 with Expo SDK ~54.0
- **Language**: TypeScript 5.8.3 (strict mode)
- **Routing**: Expo Router 5.1.4 (file-based routing)
- **Navigation**: React Navigation (bottom tabs, native stack)
- **State Management**: React Context API (AuthContext)
- **HTTP Client**: Axios 1.13.2
- **Camera**: Expo Camera for license plate capture
- **Payments**: Stripe React Native SDK 0.57.0
- **Charts**: React Native Chart Kit
- **Storage**: AsyncStorage for persistence
- **Package Manager**: Yarn 1.22.22

### Backend
- **Framework**: FastAPI 0.110.1
- **Language**: Python 3.x
- **Database**: MongoDB with Motor 3.3.1 (async driver)
- **Server**: Uvicorn 0.25.0 (ASGI)
- **Authentication**: JWT (PyJWT 2.10.1) + BCrypt 4.1.3
- **Data Validation**: Pydantic 2.12.4
- **External APIs**:
  - Google Vision API (license plate OCR)
  - Stripe API (payment processing)
- **Testing**: Pytest 8.4.2

### Development Tools
- **Linting**: ESLint (frontend), Flake8, Black, isort (backend)
- **Type Checking**: TypeScript, MyPy
- **Environment**: Docker-based (emergent.yml config)

---

## Project Structure

```
/home/user/applava/
├── backend/                    # Python FastAPI backend
│   ├── server.py              # Main API application (570 lines)
│   ├── seed_data.py           # Database initialization script
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/                   # React Native Expo frontend
│   ├── app/                   # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx        # Root layout with AuthProvider
│   │   ├── index.tsx          # Auth redirect logic
│   │   ├── login.tsx          # Dual login (email/plate)
│   │   └── (tabs)/            # Protected tab navigation
│   │       ├── _layout.tsx            # Role-based tab configuration
│   │       ├── dashboard.tsx          # Admin metrics dashboard
│   │       ├── yard.tsx               # Vehicle yard view
│   │       ├── register-vehicle.tsx   # Vehicle registration with OCR
│   │       ├── vehicle-status.tsx     # Client vehicle tracking
│   │       ├── schedule.tsx           # Appointment scheduling
│   │       ├── financial.tsx          # Financial management
│   │       ├── history.tsx            # Service history
│   │       └── settings.tsx           # User settings/profile
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context & hooks
│   │
│   ├── assets/
│   │   ├── images/            # App icons and images
│   │   └── fonts/             # Custom fonts
│   │
│   ├── scripts/
│   │   └── reset-project.js   # Project reset utility
│   │
│   ├── package.json           # Dependencies and scripts
│   ├── app.json              # Expo configuration
│   ├── tsconfig.json         # TypeScript configuration
│   ├── metro.config.js       # Metro bundler config
│   └── .env                  # Frontend environment variables
│
├── tests/                      # Test directory
│   └── __init__.py
│
├── backend_test.py            # Comprehensive API test suite
├── test_result.md             # Testing protocol and tracking
├── model.patch                # Model changes/patches
├── .gitignore                 # Git ignore rules
├── .emergent/                 # Emergent environment config
│   └── emergent.yml
└── README.md                  # Project readme

```

---

## Architecture Patterns

### Backend Architecture (server.py)
- **Pattern**: Layered monolithic architecture
- **Structure**: Models → Routes → Database operations
- **Authentication**: JWT Bearer tokens with dependency injection
- **Database**: MongoDB with async Motor driver
- **Security**: BCrypt password hashing, CORS middleware
- **API**: RESTful endpoints with `/api` prefix
- **Serialization**: Custom `serialize_doc()` for MongoDB ObjectId handling

### Frontend Architecture
- **Pattern**: File-based routing with Expo Router
- **State**: Context API for global auth state
- **Navigation**: Role-based tab layouts
- **Components**: Functional components with hooks
- **Data Flow**: Axios → Context → Components
- **Authentication**: Token stored in AsyncStorage, auto-attached to requests

---

## Database Schema

### MongoDB Collections

#### `users`
```python
{
  "_id": ObjectId,
  "email": str,
  "password": str,  # BCrypt hashed
  "role": str,      # "admin" | "collaborator" | "client"
  "name": str,
  "phone": str,
  "created_at": datetime
}
```

#### `vehicles`
```python
{
  "_id": ObjectId,
  "plate": str,              # License plate (unique)
  "model": str,
  "color": str,
  "client_id": ObjectId,     # Reference to users
  "services": [              # Selected services
    {
      "service_id": ObjectId,
      "name": str,
      "price": float,
      "duration": int
    }
  ],
  "status": str,             # "in_yard" | "in_progress" | "completed"
  "photos": [str],           # Base64 or URLs
  "entry_date": datetime,
  "exit_date": datetime,
  "total_price": float,
  "paid": bool,
  "notes": str
}
```

#### `services`
```python
{
  "_id": ObjectId,
  "name": str,               # e.g., "Lavagem Completa"
  "description": str,
  "price": float,
  "duration": int,           # Minutes
  "active": bool
}
```

#### `appointments`
```python
{
  "_id": ObjectId,
  "client_id": ObjectId,
  "vehicle_plate": str,
  "service_ids": [ObjectId],
  "scheduled_date": datetime,
  "status": str,             # "pending" | "confirmed" | "completed" | "cancelled"
  "notes": str
}
```

#### `payments`
```python
{
  "_id": ObjectId,
  "vehicle_id": ObjectId,
  "amount": float,
  "method": str,             # "stripe" | "cash" | "pix"
  "stripe_payment_id": str,
  "status": str,             # "pending" | "completed" | "failed"
  "paid_at": datetime
}
```

#### `clients`
```python
{
  "_id": ObjectId,
  "name": str,
  "email": str,
  "phone": str,
  "cpf": str,
  "address": str,
  "user_id": ObjectId        # Reference to users (for login)
}
```

### Database Connection
- **URL**: Configured via `MONGO_URL` environment variable
- **Default**: `mongodb://localhost:27017`
- **Database Name**: `automotive_detailing` (from `DB_NAME` env var)
- **Driver**: Motor (async MongoDB driver)

---

## API Endpoints

Base URL: `/api`

### Authentication Routes (`/auth`)

#### `POST /auth/register`
- **Purpose**: Register new user
- **Body**: `{ email, password, name, phone, role }`
- **Returns**: `{ access_token, token_type, user }`
- **Auth**: None

#### `POST /auth/login`
- **Purpose**: Email/password login for staff
- **Body**: `{ email, password }`
- **Returns**: `{ access_token, token_type, user }`
- **Auth**: None

#### `POST /auth/login-plate`
- **Purpose**: License plate login for clients
- **Body**: `{ plate }`
- **Returns**: `{ access_token, token_type, user }`
- **Auth**: None
- **Note**: Links client to their vehicle

#### `GET /auth/me`
- **Purpose**: Get current authenticated user
- **Returns**: User object
- **Auth**: Required (Bearer token)

### Vehicle Routes (`/vehicles`)

#### `POST /vehicles/ocr`
- **Purpose**: Extract license plate from image using Google Vision API
- **Body**: Multipart form with image file
- **Returns**: `{ plate: str }`
- **Auth**: Required
- **File**: Image upload via UploadFile

#### `POST /vehicles`
- **Purpose**: Register new vehicle with services
- **Body**: `{ plate, model, color, client_id, service_ids, photos, notes }`
- **Returns**: Created vehicle object
- **Auth**: Required (admin/collaborator)

#### `GET /vehicles`
- **Purpose**: List all vehicles (filtered by role)
- **Query**: `?status=in_yard` (optional)
- **Returns**: Array of vehicle objects
- **Auth**: Required
- **Note**: Clients only see their own vehicles

#### `GET /vehicles/{plate}`
- **Purpose**: Get vehicle by license plate
- **Returns**: Vehicle object with populated services
- **Auth**: Required

#### `PATCH /vehicles/{vehicle_id}`
- **Purpose**: Update vehicle status, photos, or completion
- **Body**: `{ status?, photos?, exit_date?, paid? }`
- **Returns**: Updated vehicle object
- **Auth**: Required (admin/collaborator)

### Service Routes (`/services`)

#### `POST /services`
- **Purpose**: Create new service offering
- **Body**: `{ name, description, price, duration }`
- **Returns**: Created service object
- **Auth**: Required (admin/collaborator)

#### `GET /services`
- **Purpose**: List all active services
- **Returns**: Array of service objects
- **Auth**: Required

#### `PATCH /services/{service_id}`
- **Purpose**: Update service details
- **Body**: `{ name?, description?, price?, duration?, active? }`
- **Returns**: Updated service object
- **Auth**: Required (admin)

### Appointment Routes (`/appointments`)

#### `POST /appointments`
- **Purpose**: Create new appointment
- **Body**: `{ vehicle_plate, service_ids, scheduled_date, notes }`
- **Returns**: Created appointment object
- **Auth**: Required

#### `GET /appointments`
- **Purpose**: List appointments (filtered by role)
- **Returns**: Array of appointment objects
- **Auth**: Required

### Dashboard Routes (`/dashboard`)

#### `GET /dashboard/metrics`
- **Purpose**: Get business metrics
- **Returns**:
  ```json
  {
    "vehicles_in_yard": int,
    "vehicles_in_progress": int,
    "vehicles_completed_today": int,
    "revenue_today": float,
    "pending_appointments": int
  }
  ```
- **Auth**: Required (admin)

### Payment Routes (`/payments`)

#### `POST /payments`
- **Purpose**: Process payment via Stripe
- **Body**: `{ vehicle_id, amount, payment_method_id }`
- **Returns**: Payment object with Stripe confirmation
- **Auth**: Required

#### `GET /payments`
- **Purpose**: List all payments
- **Returns**: Array of payment objects
- **Auth**: Required (admin)

### Client Routes (`/clients`)

#### `GET /clients`
- **Purpose**: List all clients
- **Returns**: Array of client objects
- **Auth**: Required (admin/collaborator)

#### `POST /clients`
- **Purpose**: Create client record
- **Body**: `{ name, email, phone, cpf, address }`
- **Returns**: Created client object
- **Auth**: Required (admin/collaborator)

### Authentication Header Format
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Flow

### Staff Login (Admin/Collaborator)
1. User enters email + password in `login.tsx`
2. Frontend calls `POST /api/auth/login` with credentials
3. Backend validates credentials, generates JWT token
4. Token returned with user object (includes role)
5. Frontend stores token in AsyncStorage
6. Token added to Axios default headers
7. User redirected to role-appropriate tabs

### Client Login (License Plate)
1. Client enters license plate in `login.tsx`
2. Frontend calls `POST /api/auth/login-plate` with plate
3. Backend finds vehicle by plate, retrieves associated client/user
4. JWT token generated for client user
5. Token stored and user redirected to client tabs

### Token Management
- **Storage**: AsyncStorage (persistent across app restarts)
- **Expiration**: 7 days (ACCESS_TOKEN_EXPIRE_MINUTES)
- **Auto-attach**: Axios interceptor adds token to all requests
- **Validation**: Backend uses `get_current_user()` dependency

### Protected Routes
- All `/api/vehicles`, `/api/services`, `/api/appointments` routes require authentication
- Role-based access control enforced in backend
- Frontend tabs dynamically rendered based on user role

---

## Development Workflows

### Initial Setup

#### Frontend Setup
```bash
cd frontend
npm install  # or yarn install
```

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Seed database with test data
python seed_data.py
```

### Environment Configuration

#### Backend `.env` (required)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=automotive_detailing
JWT_SECRET_KEY=your-secret-key-change-in-production
GOOGLE_VISION_API_KEY=your-google-vision-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

#### Frontend `.env` (required)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000/api
EXPO_TUNNEL_SUBDOMAIN=your-subdomain
METRO_CACHE_ROOT=.metro-cache
```

### Running the Application

#### Start Backend
```bash
cd backend
uvicorn server:app --reload
# Server runs on http://localhost:8000
# API docs available at http://localhost:8000/docs
```

#### Start Frontend
```bash
cd frontend
npx expo start

# Options:
# - Press 'a' for Android
# - Press 'i' for iOS
# - Press 'w' for web
# - Scan QR code for physical device
```

### Development Commands

#### Frontend Scripts (from `package.json`)
```bash
npm start              # Start Expo dev server
npm run android        # Start on Android emulator
npm run ios            # Start on iOS simulator
npm run web            # Start web version
npm run lint           # Run ESLint
npm run reset-project  # Reset to blank project
```

#### Backend Development
```bash
# Run server with auto-reload
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Run tests
python backend_test.py

# Seed database
python seed_data.py

# Format code
black .
isort .

# Type check
mypy server.py

# Lint
flake8 .
```

### Testing

#### Backend Testing
- **File**: `backend_test.py`
- **Framework**: Manual test script (can be migrated to pytest)
- **Test Data**: Uses seeded users from `seed_data.py`
- **Coverage**: All API endpoints, OCR functionality, auth flows

**Default Test Credentials**:
```python
# Admin
email: admin@estetica.com
password: admin123

# Collaborator
email: colaborador@estetica.com
password: collab123
```

#### Testing Protocol
The project uses a structured testing workflow documented in `test_result.md`:
- Task tracking with implementation status
- Priority levels (high, medium, low)
- Stuck count for blocked tasks
- Status history with agent comments
- Communication between main and testing agents

### Database Management

#### Reset Database
```bash
# Drop existing data and reseed
cd backend
python seed_data.py
```

#### Default Seeded Data
- 2 users (admin, collaborator)
- 5 standard services (Lavagem Completa, Polimento, etc.)
- Test vehicles and clients

### Deployment

#### Current Deployment
- **URL**: `autobooth-admin.preview.emergentagent.com`
- **Environment**: Emergent cloud environment
- **Docker Image**: `expo_mongo_base_image_cloud_arm:release-11112025-1`

#### Deployment Checklist
1. Update environment variables for production
2. Change JWT_SECRET_KEY to secure random value
3. Update MONGO_URL to production database
4. Configure CORS allowed origins (currently allows all)
5. Build frontend: `expo build:android` or `expo build:ios`
6. Deploy backend with Uvicorn + Gunicorn for production

---

## Code Conventions & Best Practices

### TypeScript/Frontend Conventions

#### Naming
- **Files**: kebab-case (`register-vehicle.tsx`, `login.tsx`)
- **Components**: PascalCase (`AuthProvider`, `VehicleCard`)
- **Variables/Functions**: camelCase (`currentUser`, `fetchVehicles`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `DEFAULT_TIMEOUT`)

#### TypeScript Patterns
```typescript
// Always define interfaces for data structures
interface Vehicle {
  _id: string;
  plate: string;
  model: string;
  status: 'in_yard' | 'in_progress' | 'completed';
}

// Use strict type checking
const user: User | null = null;

// Prefer functional components with hooks
const MyScreen = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch data
  }, []);

  return <View>...</View>;
};
```

#### Styling Patterns
```typescript
// Use StyleSheet.create for performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  // Consistent color scheme
  primary: '#007AFF',     // iOS blue
  secondary: '#FFA500',   // Orange
  success: '#4CAF50',     // Green
  background: '#1a1a2e',  // Dark blue
});
```

#### Error Handling
```typescript
try {
  const response = await axios.post('/api/vehicles', data);
  // Handle success
} catch (error) {
  Alert.alert('Error', error.response?.data?.detail || 'An error occurred');
  console.error('Vehicle creation error:', error);
}
```

### Python/Backend Conventions

#### Naming
- **Files**: snake_case (`server.py`, `seed_data.py`)
- **Functions**: snake_case (`get_current_user`, `create_vehicle`)
- **Classes**: PascalCase (`UserCreate`, `VehicleResponse`)
- **Constants**: UPPER_SNAKE_CASE (`SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`)

#### Python Patterns
```python
# Always use Pydantic models for validation
class VehicleCreate(BaseModel):
    plate: str
    model: str
    color: str
    client_id: str

# Use async/await for database operations
async def get_vehicle(plate: str):
    vehicle = await db.vehicles.find_one({"plate": plate})
    return serialize_doc(vehicle)

# Use dependency injection for auth
@router.get("/vehicles")
async def list_vehicles(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "client":
        # Filter by client
        pass
```

#### MongoDB Patterns
```python
# Always serialize ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# Use async operations
result = await db.collection.insert_one(data)
documents = await db.collection.find(query).to_list(None)
```

#### Error Handling
```python
from fastapi import HTTPException, status

# Use HTTPException for API errors
if not vehicle:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Vehicle not found"
    )

# Use try/except for external API calls
try:
    response = requests.post(GOOGLE_VISION_API_URL, json=data)
    response.raise_for_status()
except requests.RequestException as e:
    raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")
```

### Security Best Practices

#### Authentication
- Never store passwords in plain text (always use BCrypt)
- JWT tokens expire after 7 days
- Validate user role before allowing operations
- Use Bearer token authentication
- Sanitize user inputs in Pydantic models

#### Environment Variables
- Never commit `.env` files
- Use strong, random JWT_SECRET_KEY in production
- Keep API keys secure (Google Vision, Stripe)
- Use environment-specific configurations

#### API Security
```python
# Always validate current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        # Validate and return user
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## Common Tasks & Solutions

### Adding a New API Endpoint

1. **Define Pydantic model** in `server.py`:
```python
class NewResourceCreate(BaseModel):
    field1: str
    field2: int
```

2. **Create route**:
```python
@api_router.post("/new-resource")
async def create_resource(
    data: NewResourceCreate,
    current_user: dict = Depends(get_current_user)
):
    # Validate user role if needed
    if current_user["role"] not in ["admin", "collaborator"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Insert into database
    result = await db.new_collection.insert_one(data.dict())

    # Return created resource
    resource = await db.new_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(resource)
```

3. **Test endpoint**:
```bash
curl -X POST http://localhost:8000/api/new-resource \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field1": "value", "field2": 123}'
```

### Adding a New Frontend Screen

1. **Create file** in `frontend/app/(tabs)/`:
```typescript
// frontend/app/(tabs)/new-screen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function NewScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  title: { color: 'white', fontSize: 24 },
});
```

2. **Add to tab layout** in `frontend/app/(tabs)/_layout.tsx`:
```typescript
<Tabs.Screen
  name="new-screen"
  options={{
    title: 'New Screen',
    tabBarIcon: ({ color }) => <Ionicons name="add" size={28} color={color} />,
  }}
/>
```

3. **Configure role-based visibility** (if needed):
```typescript
{user?.role === 'admin' && (
  <Tabs.Screen name="new-screen" ... />
)}
```

### Implementing OCR for Images

The project already has OCR implemented for license plates. To add OCR for other use cases:

1. **Backend endpoint** (already exists at `/vehicles/ocr`):
```python
@api_router.post("/vehicles/ocr")
async def ocr_license_plate(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Read image
    image_data = await file.read()
    base64_image = base64.b64encode(image_data).decode()

    # Call Google Vision API
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"
    payload = {
        "requests": [{
            "image": {"content": base64_image},
            "features": [{"type": "TEXT_DETECTION"}]
        }]
    }

    response = requests.post(url, json=payload)
    result = response.json()

    # Extract text
    text = result["responses"][0]["textAnnotations"][0]["description"]
    return {"plate": text.strip()}
```

2. **Frontend usage** (see `register-vehicle.tsx`):
```typescript
const performOCR = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plate.jpg',
  } as any);

  const response = await axios.post('/vehicles/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.plate;
};
```

### Adding Role-Based Access Control

1. **Backend validation**:
```python
async def require_role(required_roles: List[str]):
    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of: {required_roles}"
            )
        return current_user
    return dependency

# Usage
@api_router.post("/admin-only")
async def admin_endpoint(
    current_user: dict = Depends(require_role(["admin"]))
):
    # Only admins can access
    pass
```

2. **Frontend UI hiding**:
```typescript
const { user } = useAuth();

{user?.role === 'admin' && (
  <Button title="Admin Only Action" onPress={adminAction} />
)}
```

### Implementing Real-time Updates

Socket.io is already installed but not actively used. To implement:

1. **Backend**: Add Socket.io server in `server.py`
2. **Frontend**: Use socket.io-client (already installed)

```typescript
import io from 'socket.io-client';

const socket = io(process.env.EXPO_PUBLIC_BACKEND_URL!);

socket.on('vehicle_updated', (data) => {
  // Update UI
  console.log('Vehicle updated:', data);
});
```

---

## Important Files Reference

### Configuration Files
- **`frontend/app.json`**: Expo app configuration (name, version, icon, splash screen)
- **`frontend/tsconfig.json`**: TypeScript strict mode, path aliases
- **`frontend/metro.config.js`**: Metro bundler configuration with custom cache
- **`frontend/eslint.config.js`**: ESLint rules with Expo preset
- **`backend/requirements.txt`**: Python dependencies (69 packages)
- **`.emergent/emergent.yml`**: Docker environment configuration
- **`.gitignore`**: Ignore rules (node_modules, .env, caches, etc.)

### Core Application Files
- **`backend/server.py`** (570 lines): Entire FastAPI application
  - Models (Pydantic)
  - Authentication logic
  - All API routes
  - Database operations
  - External API integrations

- **`backend/seed_data.py`**: Database initialization
  - Creates default users
  - Seeds services
  - Sets up test data

- **`frontend/contexts/AuthContext.tsx`**: Authentication state management
  - Login/logout functions
  - Token storage
  - User state
  - Axios configuration

- **`frontend/app/_layout.tsx`**: Root app layout
  - AuthProvider wrapper
  - Font loading
  - Theme configuration

- **`frontend/app/(tabs)/_layout.tsx`**: Tab navigation
  - Role-based tab rendering
  - Tab icons and titles
  - Navigation options

### Key Screen Files
- **`frontend/app/login.tsx`**: Dual authentication UI
- **`frontend/app/(tabs)/dashboard.tsx`**: Admin metrics and analytics
- **`frontend/app/(tabs)/register-vehicle.tsx`**: Vehicle registration with camera and OCR
- **`frontend/app/(tabs)/yard.tsx`**: Vehicle yard management
- **`frontend/app/(tabs)/vehicle-status.tsx`**: Client vehicle tracking

### Testing Files
- **`backend_test.py`**: Comprehensive API test suite
- **`test_result.md`**: Testing protocol and status tracking
- **`tests/__init__.py`**: Test package (minimal)

### Documentation
- **`README.md`**: Project root readme (minimal)
- **`frontend/README.md`**: Expo app setup instructions
- **`CLAUDE.md`**: This file - comprehensive codebase guide

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Error: connection refused
# Solution: Ensure MongoDB is running
mongod --dbpath /path/to/data

# Or use Docker
docker run -d -p 27017:27017 mongo
```

#### Expo Metro Bundler Cache Issues
```bash
# Clear Metro cache
cd frontend
rm -rf .metro-cache
npx expo start --clear
```

#### Authentication Token Expired
```typescript
// Frontend: Clear AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
// Then re-login
```

#### CORS Errors
```python
# Backend server.py already has CORS enabled for all origins
# For production, restrict to specific origins:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourapp.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Google Vision API Errors
```bash
# Error: API key invalid
# Solution: Check .env file
GOOGLE_VISION_API_KEY=your-valid-api-key

# Enable Vision API in Google Cloud Console
# https://console.cloud.google.com/apis/library/vision.googleapis.com
```

### Debug Mode

#### Backend Debug
```bash
# Run with debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Or use --log-level flag
uvicorn server:app --reload --log-level debug
```

#### Frontend Debug
```bash
# Enable React Native debugger
# In app: Shake device → Debug → Enable Remote JS Debugging

# Or use Expo dev tools
npx expo start
# Press 'd' to open dev menu
```

---

## Migration & Upgrade Notes

### Zustand State Management (Future)
The project has Zustand installed but not actively used. To migrate from Context API:

```typescript
// Create store: frontend/stores/authStore.ts
import create from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    // Login logic
    set({ user, token });
  },
  logout: () => set({ user: null, token: null }),
}));
```

### Socket.io Real-time (Future)
Socket.io client is installed. To implement server:

```python
# Backend: Add socketio
import socketio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio, app)

@sio.on('connect')
async def connect(sid, environ):
    print(f'Client {sid} connected')

@sio.on('disconnect')
async def disconnect(sid):
    print(f'Client {sid} disconnected')
```

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always Check User Role**: Many operations are role-based. Verify user permissions.

2. **Database Operations**: Always use async/await with Motor. Always serialize ObjectId.

3. **Authentication**: All protected routes need `current_user: dict = Depends(get_current_user)`.

4. **Error Handling**: Use HTTPException for API errors, Alert.alert for frontend errors.

5. **Testing**: Update `test_result.md` when implementing features. Run `backend_test.py` after API changes.

6. **Environment Variables**: Never hardcode sensitive data. Use `.env` files.

7. **TypeScript**: Enable strict mode. Define interfaces for all data structures.

8. **Styling**: Follow existing dark theme color scheme. Use StyleSheet.create.

9. **Git**: Commit messages should be descriptive. Push to designated Claude branch.

10. **Documentation**: Update this CLAUDE.md if you add major features or change architecture.

### File Modification Priorities

**High Priority** (frequently modified):
- `backend/server.py` - API routes and logic
- `frontend/app/(tabs)/*.tsx` - Screen implementations
- `frontend/contexts/AuthContext.tsx` - Auth logic

**Medium Priority** (occasionally modified):
- `backend/seed_data.py` - Test data
- `frontend/app/_layout.tsx` - App structure
- Configuration files

**Low Priority** (rarely modified):
- `package.json` / `requirements.txt` - Only for new dependencies
- `.gitignore` - Only for new ignore patterns
- `README.md` - Only for setup changes

### Code Quality Checklist

Before committing changes:

- [ ] TypeScript: No type errors (`tsc --noEmit`)
- [ ] ESLint: No linting errors (`npm run lint`)
- [ ] Python: Code formatted (`black .`, `isort .`)
- [ ] Python: Type check passes (`mypy server.py`)
- [ ] Tests: All tests pass (`python backend_test.py`)
- [ ] Environment: No hardcoded secrets
- [ ] Authentication: Proper role checks in place
- [ ] Error Handling: User-friendly error messages
- [ ] Database: ObjectId serialization correct
- [ ] Documentation: Updated if needed

---

## Additional Resources

### Expo Documentation
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo Camera: https://docs.expo.dev/versions/latest/sdk/camera/
- AsyncStorage: https://react-native-async-storage.github.io/async-storage/

### FastAPI Documentation
- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- Motor: https://motor.readthedocs.io/

### External APIs
- Google Vision API: https://cloud.google.com/vision/docs/ocr
- Stripe API: https://stripe.com/docs/api

### Database
- MongoDB Manual: https://docs.mongodb.com/manual/
- MongoDB with Python: https://pymongo.readthedocs.io/

---

## Changelog

### Version 1.0 (Current)
- Full-stack automotive detailing management system
- Expo Router with file-based routing
- MongoDB database with Motor
- JWT authentication with role-based access
- Google Vision OCR integration
- Stripe payment processing
- Comprehensive API endpoints
- Testing protocol established

### Future Enhancements
- [ ] Implement Socket.io for real-time updates
- [ ] Migrate to Zustand for state management
- [ ] Add push notifications (Expo Notifications)
- [ ] Implement image upload to AWS S3 (boto3 ready)
- [ ] Add multilingual support (i18n)
- [ ] Create admin web dashboard
- [ ] Add service completion workflows
- [ ] Implement appointment reminders
- [ ] Add vehicle service history reports
- [ ] Create mobile app builds (EAS Build)

---

**Last Updated**: 2025-11-15
**Environment**: Emergent Cloud (Docker ARM)
**Deployment**: autobooth-admin.preview.emergentagent.com
**Maintained By**: AI Assistants via Claude Code

For questions or clarifications, refer to the code comments in `server.py` and key screen files.
