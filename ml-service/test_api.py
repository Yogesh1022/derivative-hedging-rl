"""Test ML Service Endpoints"""
import requests
import json

print("="*60)
print("TESTING ML SERVICE")
print("="*60)

# Test health endpoint
print("\n1. Testing /health endpoint...")
try:
    response = requests.get("http://localhost:8000/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test prediction endpoint
print("\n2. Testing /predict-risk endpoint with portfolio data...")
test_data = {
    "portfolioId": "test-portfolio-001",
    "portfolioData": {
        "totalValue": 50000.0,
        "positions": [
            {
                "symbol": "SPY",
                "quantity": 10,
                "price": 105.0,
                "delta": 0.6,
                "gamma": 0.03,
                "vega": 0.25,
                "theta": -0.05
            }
        ]
    }
}

try:
    response = requests.post("http://localhost:8000/predict-risk", json=test_data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"\nFULL RESPONSE:")
        print(json.dumps(result, indent=2))
        print(f"\nPrediction Results:")
        print(f"  Risk Score: {result.get('riskScore')}")
        print(f"  Confidence: {result.get('confidence')}")
        print(f"  Recommendation: {result.get('recommendation')}")
        print(f"  RL Action (Hedging): {result.get('metrics', {}).get('hedgingPosition', 'N/A')}")
        print(f"  VaR 95%: {result.get('var95', 'N/A')}")
        print(f"  VaR 99%: {result.get('var99', 'N/A')}")
    else:
        print(f"ERROR Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("TESTS COMPLETE")
print("="*60)
