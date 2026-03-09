# Quick Reference: Using Deployed ML Models

## 🚀 ML Service Quick Start

### Service Information
- **URL:** http://localhost:8000
- **Status:** ✅ RUNNING
- **Model:** PPO (Curriculum Trained)
- **Confidence:** 0.92 (High)

---

## 📡 API Endpoints

### 1. Check Model Status
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-02T23:13:49.113072",
  "model_loaded": true
}
```

---

### 2. Get Risk Prediction

**Endpoint:** `POST /predict-risk`

**Example Request (Python):**
```python
import requests

response = requests.post('http://localhost:8000/predict-risk', json={
    "portfolioId": "portfolio-001",
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
})

print(response.json())
```

**Example Request (JavaScript/TypeScript):**
```typescript
const response = await fetch('http://localhost:8000/predict-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        portfolioId: 'portfolio-001',
        portfolioData: {
            totalValue: 50000,
            positions: [{
                symbol: 'SPY',
                quantity: 10,
                price: 105,
                delta: 0.6,
                gamma: 0.03,
                vega: 0.25,
                theta: -0.05
            }]
        }
    })
});

const prediction = await response.json();
console.log(prediction);
```

**Example Request (curl):**
```bash
curl -X POST http://localhost:8000/predict-risk \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "portfolio-001",
    "portfolioData": {
      "totalValue": 50000,
      "positions": [{
        "symbol": "SPY",
        "quantity": 10,
        "price": 105,
        "delta": 0.6,
        "gamma": 0.03,
        "vega": 0.25,
        "theta": -0.05
      }]
    }
  }'
```

**Example Response:**
```json
{
  "riskScore": 0,
  "volatility": 0.112,
  "var95": -580.2,
  "var99": -820.39,
  "sharpeRatio": 1.9,
  "recommendation": "LOW RISK: Portfolio is well-hedged. Continue monitoring.",
  "confidence": 0.92,
  "timestamp": "2026-03-02T23:13:51.176412"
}
```

---

### 3. Get Hedging Recommendation

**Endpoint:** `POST /recommend-hedge`

**Example Request:**
```python
response = requests.post('http://localhost:8000/recommend-hedge', json={
    "portfolioId": "portfolio-001",
    "portfolioData": {
        "totalValue": 50000,
        "positions": [...]
    }
})
```

---

### 4. Batch Predictions

**Endpoint:** `POST /batch-predict`

**Example Request:**
```python
response = requests.post('http://localhost:8000/batch-predict', json=[
    {
        "portfolioId": "portfolio-001",
        "portfolioData": {...}
    },
    {
        "portfolioId": "portfolio-002",
        "portfolioData": {...}
    }
])
```

---

## 📊 Understanding Predictions

### Risk Score (0-100)
- **0-30:** LOW RISK - Portfolio well-hedged
- **31-60:** MODERATE - Acceptable range, monitor
- **61-80:** WARNING - Consider hedging
- **81-100:** CRITICAL - Immediate action required

### Confidence (0-1)
- **0.92:** ✅ RL model prediction (HIGH CONFIDENCE)
- **0.65:** ⚠️ Heuristic fallback (LOWER CONFIDENCE)

If confidence is 0.92, the RL model is actively making predictions.

### VaR (Value at Risk)
- **VaR 95%:** Maximum loss with 95% confidence (1-day)
- **VaR 99%:** Maximum loss with 99% confidence (1-day)
- Values are negative (e.g., -580.2 means $580.20 max loss)

### Sharpe Ratio
- **> 1.5:** Excellent risk-adjusted returns
- **1.0-1.5:** Good returns
- **< 1.0:** Poor risk-adjusted performance

---

## 🔧 Testing the Service

### Quick Test Script
Save as `test_ml_service.py`:
```python
import requests
import json

# Test health
health = requests.get('http://localhost:8000/health').json()
print("Health:", json.dumps(health, indent=2))

# Test prediction
prediction = requests.post('http://localhost:8000/predict-risk', json={
    "portfolioId": "test",
    "portfolioData": {
        "totalValue": 50000,
        "positions": [{
            "symbol": "SPY",
            "quantity": 10,
            "price": 105,
            "delta": 0.6,
            "gamma": 0.03,
            "vega": 0.25,
            "theta": -0.05
        }]
    }
}).json()

print("\\nPrediction:", json.dumps(prediction, indent=2))
print(f"\\nConfidence: {prediction['confidence']} (0.92 = RL model active)")
```

Run:
```bash
python test_ml_service.py
```

---

## 🎯 Integration Examples

### Backend (Node.js/Express)
```typescript
// backend/src/services/mlService.ts
import axios from 'axios';

const ML_SERVICE_URL = 'http://localhost:8000';

export async function predictRisk(portfolioData: any) {
    const response = await axios.post(
        `${ML_SERVICE_URL}/predict-risk`,
        {
            portfolioId: portfolioData.id,
            portfolioData: {
                totalValue: portfolioData.totalValue,
                positions: portfolioData.positions
            }
        }
    );
    
    return response.data;
}

// Usage in controller
app.get('/api/portfolio/:id/risk', async (req, res) => {
    const portfolio = await getPortfolio(req.params.id);
    const prediction = await predictRisk(portfolio);
    
    res.json({
        portfolio: portfolio,
        mlPrediction: prediction,
        isRealModel: prediction.confidence === 0.92
    });
});
```

### Frontend (React)
```typescript
// frontend/src/services/mlService.ts
export const mlService = {
    async predictRisk(portfolioData: any) {
        const response = await fetch('http://localhost:5000/api/ml/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolioData })
        });
        return response.json();
    }
};

// Usage in component
function RiskDashboard({ portfolio }) {
    const [prediction, setPrediction] = useState(null);
    
    useEffect(() => {
        mlService.predictRisk(portfolio).then(setPrediction);
    }, [portfolio]);
    
    return (
        <div>
            <h3>AI Risk Assessment</h3>
            {prediction && (
                <>
                    <RiskScore value={prediction.riskScore} />
                    <Confidence value={prediction.confidence} />
                    <Recommendation text={prediction.recommendation} />
                    {prediction.confidence === 0.92 && (
                        <Badge>Using RL Model</Badge>
                    )}
                </>
            )}
        </div>
    );
}
```

---

## 🐛 Troubleshooting

### Service Not Running?
```bash
cd ml-service
uvicorn main:app --reload --port 8000
```

### Model Not Loaded (model_loaded: false)?
Check if model file exists:
```bash
ls ml-service/models/rl_agent_ppo.zip
```

If missing, copy from notebooks:
```bash
cp notebooks/models/notebook_curriculum/stage_3_hard/best_model/best_model.zip ml-service/models/rl_agent_ppo.zip
```

### Low Confidence (0.65)?
This means the RL model failed and heuristics are being used. Check logs:
```bash
# In ml-service directory
tail -f logs/ml_service.log
```

Look for errors like:
- "RL model prediction error"
- "Observation shape mismatch"
- "Model loading failed"

### Test Specific Endpoint
```bash
# Health check
curl http://localhost:8000/health

# Docs
open http://localhost:8000/docs
```

---

## 📚 Additional Resources

- **Full Deployment Details:** [ML_MODEL_DEPLOYMENT_SUMMARY.md](ML_MODEL_DEPLOYMENT_SUMMARY.md)
- **Integration Status:** [ML_INTEGRATION_STATUS.md](ML_INTEGRATION_STATUS.md)
- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc

---

## 🔄 Model Management

### Available Models
See all trained models:
```bash
cd notebooks/models
ls -R
```

### Deploy Different Model
```bash
# Copy SAC model instead of PPO
cp notebooks/models/notebook_evaluation/best_sac_agent/best_model.zip ml-service/models/rl_agent_sac.zip

# Update ml-service/main.py
# Change: MODEL_TYPE = "SAC"
# Change: MODEL_PATH = "./models/rl_agent_sac.zip"

# Restart service
uvicorn main:app --reload --port 8000
```

### Switch Between Models
Edit `ml-service/main.py`:
```python
# Configuration
MODEL_TYPE = "PPO"  # or "SAC"
MODEL_PATH = "./models/rl_agent_ppo.zip"  # or rl_agent_sac.zip
```

---

**Last Updated:** March 2, 2026 23:15  
**Service Status:** ✅ OPERATIONAL  
**Model:** PPO Curriculum Stage 3
