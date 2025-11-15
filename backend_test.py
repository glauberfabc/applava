#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Automotive Detailing Management System
Tests all endpoints according to test_result.md priorities
"""

import requests
import json
import base64
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://autobooth-admin.preview.emergentagent.com/api"
TIMEOUT = 30

# Test credentials from seed_data.py
ADMIN_CREDENTIALS = {
    "email": "admin@estetica.com",
    "password": "admin123"
}

COLLABORATOR_CREDENTIALS = {
    "email": "colaborador@estetica.com", 
    "password": "collab123"
}

# Test data
TEST_VEHICLE_PLATE = "ABC123"
TEST_CLIENT_DATA = {
    "name": "Juan Perez",
    "phone": "+1234567890"
}

# Sample base64 image for OCR testing (small 1x1 pixel PNG)
SAMPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class APITester:
    def __init__(self):
        self.admin_token = None
        self.collaborator_token = None
        self.client_token = None
        self.test_results = []
        self.created_vehicle_id = None
        self.created_service_id = None
        self.created_appointment_id = None
        self.created_payment_id = None
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "PATCH":
                response = requests.patch(url, json=data, headers=request_headers, timeout=TIMEOUT)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.Timeout:
            return None, f"Request timeout after {TIMEOUT}s"
        except requests.exceptions.ConnectionError:
            return None, "Connection error - backend may be down"
        except Exception as e:
            return None, f"Request error: {str(e)}"
    
    # ==========================================
    # AUTHENTICATION TESTS (HIGH PRIORITY)
    # ==========================================
    
    def test_admin_login(self):
        """Test admin login endpoint"""
        response, error = self.make_request("POST", "/auth/login", ADMIN_CREDENTIALS)
        
        if error:
            self.log_result("Admin Login", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.admin_token = data["access_token"]
                user = data["user"]
                if user.get("role") == "admin" and user.get("email") == ADMIN_CREDENTIALS["email"]:
                    self.log_result("Admin Login", True, f"Successfully logged in as admin: {user['name']}")
                    return True
                else:
                    self.log_result("Admin Login", False, f"Invalid user data: {user}")
            else:
                self.log_result("Admin Login", False, f"Missing token or user in response: {data}")
        else:
            self.log_result("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_collaborator_login(self):
        """Test collaborator login endpoint"""
        response, error = self.make_request("POST", "/auth/login", COLLABORATOR_CREDENTIALS)
        
        if error:
            self.log_result("Collaborator Login", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.collaborator_token = data["access_token"]
                user = data["user"]
                if user.get("role") == "collaborator":
                    self.log_result("Collaborator Login", True, f"Successfully logged in as collaborator: {user['name']}")
                    return True
                else:
                    self.log_result("Collaborator Login", False, f"Invalid role: {user.get('role')}")
            else:
                self.log_result("Collaborator Login", False, f"Missing token or user in response")
        else:
            self.log_result("Collaborator Login", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_auth_me(self):
        """Test token verification endpoint"""
        if not self.admin_token:
            self.log_result("Auth Me", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/auth/me", token=self.admin_token)
        
        if error:
            self.log_result("Auth Me", False, error)
            return False
            
        if response.status_code == 200:
            user = response.json()
            if user.get("email") == ADMIN_CREDENTIALS["email"]:
                self.log_result("Auth Me", True, f"Token verification successful for {user['name']}")
                return True
            else:
                self.log_result("Auth Me", False, f"Token returned wrong user: {user}")
        else:
            self.log_result("Auth Me", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    # ==========================================
    # SERVICES TESTS (HIGH PRIORITY)
    # ==========================================
    
    def test_get_services(self):
        """Test getting all services"""
        response, error = self.make_request("GET", "/services")
        
        if error:
            self.log_result("Get Services", False, error)
            return False
            
        if response.status_code == 200:
            services = response.json()
            if isinstance(services, list) and len(services) >= 6:
                self.log_result("Get Services", True, f"Retrieved {len(services)} services (expected 6 seeded services)")
                return True
            else:
                self.log_result("Get Services", False, f"Expected list with 6+ services, got: {len(services) if isinstance(services, list) else 'not a list'}")
        else:
            self.log_result("Get Services", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_create_service_admin(self):
        """Test creating service as admin"""
        if not self.admin_token:
            self.log_result("Create Service (Admin)", False, "No admin token available")
            return False
            
        service_data = {
            "name": "Test Premium Wash",
            "price": 150.0,
            "estimated_duration": 120,
            "description": "Premium wash service for testing"
        }
        
        response, error = self.make_request("POST", "/services", service_data, token=self.admin_token)
        
        if error:
            self.log_result("Create Service (Admin)", False, error)
            return False
            
        if response.status_code == 200:
            service = response.json()
            if service.get("name") == service_data["name"] and service.get("price") == service_data["price"]:
                self.created_service_id = service.get("_id")
                self.log_result("Create Service (Admin)", True, f"Created service: {service['name']} (${service['price']})")
                return True
            else:
                self.log_result("Create Service (Admin)", False, f"Service data mismatch: {service}")
        else:
            self.log_result("Create Service (Admin)", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_create_service_collaborator_forbidden(self):
        """Test that collaborator cannot create services"""
        if not self.collaborator_token:
            self.log_result("Create Service (Collaborator Forbidden)", False, "No collaborator token available")
            return False
            
        service_data = {
            "name": "Unauthorized Service",
            "price": 100.0,
            "estimated_duration": 60
        }
        
        response, error = self.make_request("POST", "/services", service_data, token=self.collaborator_token)
        
        if error:
            self.log_result("Create Service (Collaborator Forbidden)", False, error)
            return False
            
        if response.status_code == 403:
            self.log_result("Create Service (Collaborator Forbidden)", True, "Correctly blocked collaborator from creating service")
            return True
        else:
            self.log_result("Create Service (Collaborator Forbidden)", False, f"Expected 403, got HTTP {response.status_code}")
        return False
    
    # ==========================================
    # VEHICLE & OCR TESTS (HIGH PRIORITY)
    # ==========================================
    
    def test_ocr_endpoint(self):
        """Test OCR endpoint with base64 image"""
        if not self.admin_token:
            self.log_result("OCR Endpoint", False, "No admin token available")
            return False
            
        ocr_data = {"image_base64": SAMPLE_IMAGE_BASE64}
        
        response, error = self.make_request("POST", "/vehicles/ocr", ocr_data, token=self.admin_token)
        
        if error:
            self.log_result("OCR Endpoint", False, error)
            return False
            
        if response.status_code == 200:
            result = response.json()
            if "plate" in result:
                self.log_result("OCR Endpoint", True, f"OCR processed successfully, extracted: '{result['plate']}'")
                return True
            else:
                self.log_result("OCR Endpoint", False, f"Missing 'plate' in response: {result}")
        else:
            self.log_result("OCR Endpoint", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_create_vehicle(self):
        """Test creating vehicle with services and photos"""
        if not self.admin_token:
            self.log_result("Create Vehicle", False, "No admin token available")
            return False
            
        # First get available services
        services_response, _ = self.make_request("GET", "/services")
        if services_response and services_response.status_code == 200:
            services = services_response.json()
            service_ids = [s["_id"] for s in services[:2]]  # Use first 2 services
        else:
            service_ids = []
            
        vehicle_data = {
            "plate": TEST_VEHICLE_PLATE,
            "client_name": TEST_CLIENT_DATA["name"],
            "client_phone": TEST_CLIENT_DATA["phone"],
            "services": service_ids,
            "observations": "Test vehicle for API testing",
            "photos": [SAMPLE_IMAGE_BASE64]
        }
        
        response, error = self.make_request("POST", "/vehicles", vehicle_data, token=self.admin_token)
        
        if error:
            self.log_result("Create Vehicle", False, error)
            return False
            
        if response.status_code == 200:
            vehicle = response.json()
            if vehicle.get("plate") == TEST_VEHICLE_PLATE and vehicle.get("status") == "waiting":
                self.created_vehicle_id = vehicle.get("_id")
                self.log_result("Create Vehicle", True, f"Created vehicle {vehicle['plate']} with {len(vehicle.get('services', []))} services")
                return True
            else:
                self.log_result("Create Vehicle", False, f"Vehicle data mismatch: {vehicle}")
        else:
            self.log_result("Create Vehicle", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_get_vehicles(self):
        """Test getting all vehicles"""
        if not self.admin_token:
            self.log_result("Get Vehicles", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/vehicles", token=self.admin_token)
        
        if error:
            self.log_result("Get Vehicles", False, error)
            return False
            
        if response.status_code == 200:
            vehicles = response.json()
            if isinstance(vehicles, list):
                self.log_result("Get Vehicles", True, f"Retrieved {len(vehicles)} vehicles")
                return True
            else:
                self.log_result("Get Vehicles", False, f"Expected list, got: {type(vehicles)}")
        else:
            self.log_result("Get Vehicles", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_get_vehicles_by_status(self):
        """Test filtering vehicles by status"""
        if not self.admin_token:
            self.log_result("Get Vehicles by Status", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/vehicles?status=waiting", token=self.admin_token)
        
        if error:
            self.log_result("Get Vehicles by Status", False, error)
            return False
            
        if response.status_code == 200:
            vehicles = response.json()
            if isinstance(vehicles, list):
                waiting_count = len([v for v in vehicles if v.get("status") == "waiting"])
                self.log_result("Get Vehicles by Status", True, f"Retrieved {len(vehicles)} vehicles, {waiting_count} with 'waiting' status")
                return True
            else:
                self.log_result("Get Vehicles by Status", False, f"Expected list, got: {type(vehicles)}")
        else:
            self.log_result("Get Vehicles by Status", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_get_vehicle_by_plate(self):
        """Test getting vehicle by plate"""
        if not self.admin_token:
            self.log_result("Get Vehicle by Plate", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", f"/vehicles/{TEST_VEHICLE_PLATE}", token=self.admin_token)
        
        if error:
            self.log_result("Get Vehicle by Plate", False, error)
            return False
            
        if response.status_code == 200:
            vehicle = response.json()
            if vehicle.get("plate") == TEST_VEHICLE_PLATE:
                service_details = vehicle.get("service_details", [])
                self.log_result("Get Vehicle by Plate", True, f"Found vehicle {vehicle['plate']} with {len(service_details)} service details")
                return True
            else:
                self.log_result("Get Vehicle by Plate", False, f"Plate mismatch: expected {TEST_VEHICLE_PLATE}, got {vehicle.get('plate')}")
        else:
            self.log_result("Get Vehicle by Plate", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_update_vehicle_status(self):
        """Test updating vehicle status"""
        if not self.admin_token or not self.created_vehicle_id:
            self.log_result("Update Vehicle Status", False, "No admin token or vehicle ID available")
            return False
            
        update_data = {"status": "in_progress"}
        
        response, error = self.make_request("PATCH", f"/vehicles/{self.created_vehicle_id}", update_data, token=self.admin_token)
        
        if error:
            self.log_result("Update Vehicle Status", False, error)
            return False
            
        if response.status_code == 200:
            vehicle = response.json()
            if vehicle.get("status") == "in_progress":
                self.log_result("Update Vehicle Status", True, f"Updated vehicle status to {vehicle['status']}")
                return True
            else:
                self.log_result("Update Vehicle Status", False, f"Status not updated: {vehicle.get('status')}")
        else:
            self.log_result("Update Vehicle Status", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_client_plate_login(self):
        """Test client login with plate"""
        plate_data = {"plate": TEST_VEHICLE_PLATE}
        
        response, error = self.make_request("POST", "/auth/login-plate", plate_data)
        
        if error:
            self.log_result("Client Plate Login", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.client_token = data["access_token"]
                user = data["user"]
                if user.get("role") == "client" and user.get("plate") == TEST_VEHICLE_PLATE:
                    self.log_result("Client Plate Login", True, f"Client logged in with plate {user['plate']}")
                    return True
                else:
                    self.log_result("Client Plate Login", False, f"Invalid client data: {user}")
            else:
                self.log_result("Client Plate Login", False, f"Missing token or user in response")
        else:
            self.log_result("Client Plate Login", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    # ==========================================
    # DASHBOARD TESTS (HIGH PRIORITY)
    # ==========================================
    
    def test_dashboard_metrics(self):
        """Test admin dashboard metrics"""
        if not self.admin_token:
            self.log_result("Dashboard Metrics", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/dashboard/metrics", token=self.admin_token)
        
        if error:
            self.log_result("Dashboard Metrics", False, error)
            return False
            
        if response.status_code == 200:
            metrics = response.json()
            required_fields = ["vehicles_in_yard", "appointments_today", "completed_today", "revenue_today", "revenue_month"]
            
            if all(field in metrics for field in required_fields):
                self.log_result("Dashboard Metrics", True, f"Retrieved metrics: {metrics}")
                return True
            else:
                missing = [f for f in required_fields if f not in metrics]
                self.log_result("Dashboard Metrics", False, f"Missing fields: {missing}")
        else:
            self.log_result("Dashboard Metrics", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_dashboard_metrics_collaborator_forbidden(self):
        """Test that collaborator cannot access dashboard metrics"""
        if not self.collaborator_token:
            self.log_result("Dashboard Metrics (Collaborator Forbidden)", False, "No collaborator token available")
            return False
            
        response, error = self.make_request("GET", "/dashboard/metrics", token=self.collaborator_token)
        
        if error:
            self.log_result("Dashboard Metrics (Collaborator Forbidden)", False, error)
            return False
            
        if response.status_code == 403:
            self.log_result("Dashboard Metrics (Collaborator Forbidden)", True, "Correctly blocked collaborator from accessing dashboard")
            return True
        else:
            self.log_result("Dashboard Metrics (Collaborator Forbidden)", False, f"Expected 403, got HTTP {response.status_code}")
        return False
    
    # ==========================================
    # APPOINTMENTS TESTS (MEDIUM PRIORITY)
    # ==========================================
    
    def test_create_appointment(self):
        """Test creating appointment"""
        if not self.admin_token:
            self.log_result("Create Appointment", False, "No admin token available")
            return False
            
        appointment_data = {
            "client_phone": TEST_CLIENT_DATA["phone"],
            "vehicle_plate": TEST_VEHICLE_PLATE,
            "services": ["service1", "service2"],
            "date": "2024-01-15",
            "time": "10:00",
            "notes": "Test appointment"
        }
        
        response, error = self.make_request("POST", "/appointments", appointment_data, token=self.admin_token)
        
        if error:
            self.log_result("Create Appointment", False, error)
            return False
            
        if response.status_code == 200:
            appointment = response.json()
            if appointment.get("vehicle_plate") == TEST_VEHICLE_PLATE:
                self.created_appointment_id = appointment.get("_id")
                self.log_result("Create Appointment", True, f"Created appointment for {appointment['date']} at {appointment['time']}")
                return True
            else:
                self.log_result("Create Appointment", False, f"Appointment data mismatch: {appointment}")
        else:
            self.log_result("Create Appointment", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_get_appointments(self):
        """Test getting appointments"""
        if not self.admin_token:
            self.log_result("Get Appointments", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/appointments", token=self.admin_token)
        
        if error:
            self.log_result("Get Appointments", False, error)
            return False
            
        if response.status_code == 200:
            appointments = response.json()
            if isinstance(appointments, list):
                self.log_result("Get Appointments", True, f"Retrieved {len(appointments)} appointments")
                return True
            else:
                self.log_result("Get Appointments", False, f"Expected list, got: {type(appointments)}")
        else:
            self.log_result("Get Appointments", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    # ==========================================
    # PAYMENTS TESTS (MEDIUM PRIORITY)
    # ==========================================
    
    def test_create_payment(self):
        """Test creating payment"""
        if not self.admin_token or not self.created_vehicle_id:
            self.log_result("Create Payment", False, "No admin token or vehicle ID available")
            return False
            
        payment_data = {
            "vehicle_id": self.created_vehicle_id,
            "amount": 150.0,
            "payment_method": "cash"
        }
        
        response, error = self.make_request("POST", "/payments", payment_data, token=self.admin_token)
        
        if error:
            self.log_result("Create Payment", False, error)
            return False
            
        if response.status_code == 200:
            payment = response.json()
            if payment.get("amount") == 150.0 and payment.get("status") == "paid":
                self.created_payment_id = payment.get("_id")
                self.log_result("Create Payment", True, f"Created payment of ${payment['amount']} via {payment['payment_method']}")
                return True
            else:
                self.log_result("Create Payment", False, f"Payment data mismatch: {payment}")
        else:
            self.log_result("Create Payment", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_get_payments_admin(self):
        """Test getting payments as admin"""
        if not self.admin_token:
            self.log_result("Get Payments (Admin)", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/payments", token=self.admin_token)
        
        if error:
            self.log_result("Get Payments (Admin)", False, error)
            return False
            
        if response.status_code == 200:
            payments = response.json()
            if isinstance(payments, list):
                self.log_result("Get Payments (Admin)", True, f"Retrieved {len(payments)} payments")
                return True
            else:
                self.log_result("Get Payments (Admin)", False, f"Expected list, got: {type(payments)}")
        else:
            self.log_result("Get Payments (Admin)", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    # ==========================================
    # CLIENTS TESTS (MEDIUM PRIORITY)
    # ==========================================
    
    def test_get_clients(self):
        """Test getting clients"""
        if not self.admin_token:
            self.log_result("Get Clients", False, "No admin token available")
            return False
            
        response, error = self.make_request("GET", "/clients", token=self.admin_token)
        
        if error:
            self.log_result("Get Clients", False, error)
            return False
            
        if response.status_code == 200:
            clients = response.json()
            if isinstance(clients, list):
                # Should have at least the client created when we created the vehicle
                client_found = any(c.get("phone") == TEST_CLIENT_DATA["phone"] for c in clients)
                if client_found:
                    self.log_result("Get Clients", True, f"Retrieved {len(clients)} clients, including test client")
                else:
                    self.log_result("Get Clients", True, f"Retrieved {len(clients)} clients (test client may not be created yet)")
                return True
            else:
                self.log_result("Get Clients", False, f"Expected list, got: {type(clients)}")
        else:
            self.log_result("Get Clients", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    def test_create_client(self):
        """Test creating client"""
        if not self.admin_token:
            self.log_result("Create Client", False, "No admin token available")
            return False
            
        client_data = {
            "name": "Maria Rodriguez",
            "phone": "+9876543210",
            "plate": "XYZ789"
        }
        
        response, error = self.make_request("POST", "/clients", client_data, token=self.admin_token)
        
        if error:
            self.log_result("Create Client", False, error)
            return False
            
        if response.status_code == 200:
            client = response.json()
            if client.get("name") == client_data["name"] and client.get("phone") == client_data["phone"]:
                self.log_result("Create Client", True, f"Created client: {client['name']} ({client['phone']})")
                return True
            else:
                self.log_result("Create Client", False, f"Client data mismatch: {client}")
        else:
            self.log_result("Create Client", False, f"HTTP {response.status_code}: {response.text}")
        return False
    
    # ==========================================
    # MAIN TEST RUNNER
    # ==========================================
    
    def run_all_tests(self):
        """Run all tests in priority order"""
        print(f"\n🚀 Starting Backend API Tests for Automotive Detailing Management")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # HIGH PRIORITY TESTS
        print("\n🔥 HIGH PRIORITY TESTS")
        print("-" * 40)
        
        # Authentication Tests
        self.test_admin_login()
        self.test_collaborator_login()
        self.test_auth_me()
        
        # Services Tests
        self.test_get_services()
        self.test_create_service_admin()
        self.test_create_service_collaborator_forbidden()
        
        # Vehicle & OCR Tests
        self.test_ocr_endpoint()
        self.test_create_vehicle()
        self.test_get_vehicles()
        self.test_get_vehicles_by_status()
        self.test_get_vehicle_by_plate()
        self.test_update_vehicle_status()
        self.test_client_plate_login()
        
        # Dashboard Tests
        self.test_dashboard_metrics()
        self.test_dashboard_metrics_collaborator_forbidden()
        
        # MEDIUM PRIORITY TESTS
        print("\n🔶 MEDIUM PRIORITY TESTS")
        print("-" * 40)
        
        # Appointments Tests
        self.test_create_appointment()
        self.test_get_appointments()
        
        # Payments Tests
        self.test_create_payment()
        self.test_get_payments_admin()
        
        # Clients Tests
        self.test_get_clients()
        self.test_create_client()
        
        # SUMMARY
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n⏰ Completed at: {datetime.now().isoformat()}")
        
        return passed, failed

if __name__ == "__main__":
    tester = APITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if tests failed
    exit(0 if failed == 0 else 1)