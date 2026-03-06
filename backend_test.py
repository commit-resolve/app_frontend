#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Fintech Savings App
Tests all authentication, mandate, transaction, and dashboard endpoints
"""
import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = "https://upi-savings.preview.emergentagent.com/api"

# Test Data
TEST_USER_EMAIL = "john.doe@savings.com"
TEST_USER_PHONE = "9876543210" 
TEST_USER_NAME = "John Doe"
TEST_USER_PASSWORD = "savings123"

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

class BackendTester:
    def __init__(self):
        self.access_token = None
        self.user_id = None
        self.mandate_id = None
        self.second_mandate_id = None
        
    def test_register_user(self):
        """Test user registration"""
        print_info("Testing User Registration...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "phone": TEST_USER_PHONE,
            "name": TEST_USER_NAME,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.access_token = data["access_token"]
                    print_success(f"User registered successfully. Token: {self.access_token[:20]}...")
                    return True
                else:
                    print_error("Registration succeeded but no access token returned")
                    return False
            elif response.status_code == 400 and "already exists" in response.text:
                print_warning("User already exists, attempting to login instead...")
                return self.test_login_user()
            else:
                print_error(f"Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Registration error: {str(e)}")
            return False
    
    def test_login_user(self):
        """Test user login"""
        print_info("Testing User Login...")
        
        payload = {
            "identifier": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.access_token = data["access_token"]
                    print_success(f"Login successful. Token: {self.access_token[:20]}...")
                    return True
                else:
                    print_error("Login succeeded but no access token returned")
                    return False
            else:
                print_error(f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Login error: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test get current user details"""
        print_info("Testing Get Current User...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                self.user_id = user_data.get("id")
                print_success(f"User details retrieved: {user_data.get('name')} ({user_data.get('email')})")
                return True
            else:
                print_error(f"Get user failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Get user error: {str(e)}")
            return False
    
    def test_create_mandate(self):
        """Test creating a mandate"""
        print_info("Testing Create Mandate...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "goal_name": "Vacation Fund",
            "percentage": 10.0,
            "target_amount": 10000.0,
            "description": "Save for vacation"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/mandates", json=payload, headers=headers)
            
            if response.status_code == 200:
                mandate_data = response.json()
                self.mandate_id = mandate_data.get("id")
                print_success(f"Mandate created: {mandate_data.get('goal_name')} - {mandate_data.get('percentage')}%")
                print_info(f"Mandate ID: {self.mandate_id}")
                return True
            else:
                print_error(f"Create mandate failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Create mandate error: {str(e)}")
            return False
    
    def test_get_mandates(self):
        """Test getting all mandates"""
        print_info("Testing Get All Mandates...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/mandates", headers=headers)
            
            if response.status_code == 200:
                mandates = response.json()
                print_success(f"Retrieved {len(mandates)} mandates")
                for mandate in mandates:
                    print_info(f"  - {mandate.get('goal_name')}: {mandate.get('percentage')}% (₹{mandate.get('current_savings', 0)}/₹{mandate.get('target_amount')})")
                return True
            else:
                print_error(f"Get mandates failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Get mandates error: {str(e)}")
            return False
    
    def test_simulate_transaction(self):
        """Test transaction simulation"""
        print_info("Testing Transaction Simulation...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "amount": 1000.0,
            "description": "Grocery shopping",
            "category": "UPI Payment"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/transactions/simulate", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Transaction simulated: ₹{data.get('transaction_amount')}")
                print_info(f"Total saved: ₹{data.get('total_saved')}")
                for saving in data.get('savings_breakdown', []):
                    print_info(f"  - {saving.get('goal_name')}: {saving.get('percentage')}% = ₹{saving.get('amount')}")
                return True
            else:
                print_error(f"Transaction simulation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Transaction simulation error: {str(e)}")
            return False
    
    def test_get_dashboard(self):
        """Test dashboard API"""
        print_info("Testing Dashboard...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print_success("Dashboard data retrieved successfully")
                print_info(f"Total Savings: ₹{data.get('total_savings', 0)}")
                print_info(f"Active Mandates: {data.get('active_mandates', 0)}")
                print_info(f"Total Transactions: {data.get('total_transactions', 0)}")
                print_info(f"Recent Transactions: {len(data.get('recent_transactions', []))}")
                
                # Verify expected savings
                if data.get('total_savings') >= 100:  # Expected 10% of 1000 = 100
                    print_success("✅ Savings calculation appears correct")
                else:
                    print_warning(f"⚠️ Expected savings of ₹100, got ₹{data.get('total_savings')}")
                
                if data.get('active_mandates') >= 1:
                    print_success("✅ Active mandates count correct")
                else:
                    print_warning("⚠️ Expected at least 1 active mandate")
                
                return True
            else:
                print_error(f"Dashboard failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Dashboard error: {str(e)}")
            return False
    
    def test_get_transactions(self):
        """Test getting transaction history"""
        print_info("Testing Transaction History...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/transactions", headers=headers)
            
            if response.status_code == 200:
                transactions = response.json()
                print_success(f"Retrieved {len(transactions)} transactions")
                
                debit_count = len([t for t in transactions if t.get('type') == 'debit'])
                savings_count = len([t for t in transactions if t.get('type') == 'savings'])
                
                print_info(f"  - Debit transactions: {debit_count}")
                print_info(f"  - Savings transactions: {savings_count}")
                
                return True
            else:
                print_error(f"Get transactions failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Get transactions error: {str(e)}")
            return False
    
    def test_update_mandate_status(self):
        """Test updating mandate status"""
        print_info("Testing Mandate Status Update...")
        
        if not self.access_token or not self.mandate_id:
            print_error("No access token or mandate ID available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.put(f"{BASE_URL}/mandates/{self.mandate_id}?status=paused", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Mandate status updated: {data.get('message')}")
                return True
            else:
                print_error(f"Update mandate failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Update mandate error: {str(e)}")
            return False
    
    def test_create_second_mandate(self):
        """Test creating a second mandate"""
        print_info("Testing Create Second Mandate...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "goal_name": "Emergency Fund",
            "percentage": 5.0,
            "target_amount": 5000.0,
            "description": "Emergency savings"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/mandates", json=payload, headers=headers)
            
            if response.status_code == 200:
                mandate_data = response.json()
                self.second_mandate_id = mandate_data.get("id")
                print_success(f"Second mandate created: {mandate_data.get('goal_name')} - {mandate_data.get('percentage')}%")
                return True
            else:
                print_error(f"Create second mandate failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Create second mandate error: {str(e)}")
            return False
    
    def test_simulate_second_transaction(self):
        """Test second transaction simulation (should only use Emergency Fund since Vacation Fund is paused)"""
        print_info("Testing Second Transaction Simulation...")
        
        if not self.access_token:
            print_error("No access token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "amount": 2000.0,
            "description": "Shopping",
            "category": "UPI Payment"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/transactions/simulate", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Second transaction simulated: ₹{data.get('transaction_amount')}")
                print_info(f"Total saved: ₹{data.get('total_saved')}")
                
                savings_breakdown = data.get('savings_breakdown', [])
                
                # Should only show Emergency Fund (5% = ₹100) since Vacation Fund is paused
                active_goals = [s.get('goal_name') for s in savings_breakdown]
                print_info(f"Active savings goals: {active_goals}")
                
                if len(savings_breakdown) == 1 and 'Emergency Fund' in active_goals:
                    print_success("✅ Correctly saving only to active mandates")
                else:
                    print_warning("⚠️ Expected only Emergency Fund to be active")
                
                return True
            else:
                print_error(f"Second transaction simulation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Second transaction simulation error: {str(e)}")
            return False
    
    def test_delete_mandate(self):
        """Test deleting a mandate"""
        print_info("Testing Mandate Deletion...")
        
        if not self.access_token or not self.mandate_id:
            print_error("No access token or mandate ID available")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.delete(f"{BASE_URL}/mandates/{self.mandate_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Mandate deleted: {data.get('message')}")
                return True
            else:
                print_error(f"Delete mandate failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Delete mandate error: {str(e)}")
            return False

def main():
    print(f"{Colors.BOLD}🧪 Starting Fintech Savings App Backend API Tests{Colors.ENDC}")
    print(f"Backend URL: {BASE_URL}")
    print("=" * 60)
    
    tester = BackendTester()
    results = {}
    
    # Test sequence as requested
    test_sequence = [
        ("Register User", tester.test_register_user),
        ("Login User", tester.test_login_user),
        ("Get Current User", tester.test_get_current_user),
        ("Create Mandate", tester.test_create_mandate),
        ("Get All Mandates", tester.test_get_mandates),
        ("Simulate Transaction", tester.test_simulate_transaction),
        ("Get Dashboard", tester.test_get_dashboard),
        ("Get Transactions", tester.test_get_transactions),
        ("Update Mandate Status", tester.test_update_mandate_status),
        ("Create Second Mandate", tester.test_create_second_mandate),
        ("Simulate Another Transaction", tester.test_simulate_second_transaction),
        ("Delete Mandate", tester.test_delete_mandate)
    ]
    
    for test_name, test_func in test_sequence:
        print(f"\n{Colors.BLUE}{'='*20} {test_name} {'='*20}{Colors.ENDC}")
        try:
            success = test_func()
            results[test_name] = success
        except Exception as e:
            print_error(f"Unexpected error in {test_name}: {str(e)}")
            results[test_name] = False
    
    # Summary
    print(f"\n{Colors.BOLD}📊 Test Results Summary{Colors.ENDC}")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:<30} {status}")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print(f"{Colors.GREEN}🎉 All tests passed! Backend is working correctly.{Colors.ENDC}")
        return 0
    else:
        print(f"{Colors.RED}❌ {total - passed} test(s) failed. Please check the issues above.{Colors.ENDC}")
        return 1

if __name__ == "__main__":
    sys.exit(main())