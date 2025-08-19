#!/usr/bin/env python3
"""
Test script for Disease Prediction API
Chạy script này để test các API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_get_symptoms():
    """Test API lấy danh sách triệu chứng"""
    print("🔍 Testing GET /api/symptoms...")
    try:
        response = requests.get(f"{BASE_URL}/api/symptoms")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data['symptoms'])} symptoms")
            print(f"Sample symptoms: {data['symptoms'][:5]}")
        else:
            print(f"❌ Failed with status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_get_diseases():
    """Test API lấy danh sách bệnh"""
    print("\n🔍 Testing GET /api/diseases...")
    try:
        response = requests.get(f"{BASE_URL}/api/diseases")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data['diseases'])} diseases")
            print(f"Sample diseases: {data['diseases'][:5]}")
        else:
            print(f"❌ Failed with status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_predict():
    """Test API dự đoán bệnh"""
    print("\n🔍 Testing POST /api/predict...")
    
    # Test với một số triệu chứng phổ biến
    test_symptoms = ["headache", "fever", "cough"]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json={"symptoms": test_symptoms},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prediction successful!")
            print(f"Predicted disease: {data['predicted_disease_vn']}")
            print(f"Confidence: {data['confidence']:.2%}")
            print(f"Top predictions: {len(data['top_predictions'])}")
            
            # Hiển thị top 3 predictions
            for i, pred in enumerate(data['top_predictions'][:3]):
                print(f"  {i+1}. {pred['disease_vn']} ({pred['probability']:.2%})")
                
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_invalid_request():
    """Test API với request không hợp lệ"""
    print("\n🔍 Testing invalid request...")
    
    try:
        # Test với symptoms rỗng
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json={"symptoms": []},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✅ Correctly handled empty symptoms")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            
        # Test với symptoms không tồn tại
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json={"symptoms": ["invalid_symptom_123"]},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Handled invalid symptoms gracefully")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main test function"""
    print("🚀 Starting API tests...")
    print("=" * 50)
    
    # Test các endpoints
    test_get_symptoms()
    test_get_diseases()
    test_predict()
    test_invalid_request()
    
    print("\n" + "=" * 50)
    print("✨ API testing completed!")
    print("\n💡 Tips:")
    print("- Make sure the Flask app is running on http://localhost:5000")
    print("- Check the console output for any errors")
    print("- Use the web interface at http://localhost:5000 for manual testing")

if __name__ == "__main__":
    main()

