# ML Service Routing Analysis

## Current Routing Configuration

### 1. Frontend → Backend Routing

**Frontend Config** (`frontend/vite.config.ts`):
```typescript
server: {
  port: 5174,  // ⚠️ MISMATCH - Should be 5173
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // ✅ Correct
      changeOrigin: true,
    }
  }
}
```

**Frontend .env** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api  # ❌ WRONG - Should be '/api' for proxy
```

**Frontend API Client** (`frontend/src/services/api.ts`):
```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api';  // Uses '/api' if env not set
```

**Frontend ML Service** (`frontend/src/services/mlService.ts`):
```typescript
async predictRisk(portfolioId: string): Promise<MLPrediction> {
  const response = await apiClient.post('/ml/predict', { portfolioId });
  //                                      ^^^^^^^^^^^^
  //                                      Calls /api/ml/predict via proxy
  return response.data.data;
}
```

### 2. Backend ML Routes

**Backend App** (`backend/src/app.ts`):
```typescript
app.use('/api/ml', mlRoutes);  // ✅ Correct - Mounts ML routes at /api/ml
```

**ML Routes** (`backend/src/routes/ml.routes.ts`):
```typescript
router.post('/predict', authenticate, requireTrader, mlController.predictRisk);
//           ^^^^^^^^
//           Full path: /api/ml/predict
```

### 3. Backend → ML Service Routing

**Backend Config** (`backend/.env`):
```env
ML_SERVICE_URL=http://localhost:8000  # ✅ Correct
ML_SERVICE_TIMEOUT=30000              # ✅ Correct
CLIENT_URL=http://localhost:5174      # ⚠️ Port mismatch
```

**Backend ML Service Client** (`backend/src/services/ml.service.ts`):
```typescript
constructor() {
  this.client = axios.create({
    baseURL: config.mlService.url,  // http://localhost:8000
    timeout: config.mlService.timeout,
  });
}

async predictRisk(request: MLPredictionRequest): Promise<MLPredictionResponse> {
  const response = await this.client.post<MLPredictionResponse>(
    '/predict-risk',  // ✅ Correct - Calls http://localhost:8000/predict-risk
    request
  );
  return response.data;
}
```

### 4. ML Service Endpoints

**ML Service** (`ml-service/main.py`):
```python
@app.post("/predict-risk")  # ✅ Correct endpoint
async def predict_risk(portfolio: PortfolioData) -> RiskPrediction:
    # Uses RL model if loaded, otherwise fallback
    obs = prepare_observation(portfolio)
    action, _states = app.state.ml_model.predict(obs, deterministic=True)
    return RiskPrediction(...)
```

**CORS Configuration**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",  # ⚠️ Port mismatch
        "http://localhost:5000"   # ✅ Backend allowed
    ],
)
```

---

## Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ROUTING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. User Action (Frontend)
   └─> mlService.predictRisk(portfolioId)
       └─> apiClient.post('/ml/predict', { portfolioId })

2. Frontend Makes Request
   URL: /ml/predict
   Full URL (via VITE_API_URL): http://localhost:5000/api/ml/predict  ❌ WRONG
   OR
   Full URL (via proxy): http://localhost:5000/api/ml/predict  ✅ CORRECT
   
   ⚠️ ISSUE: VITE_API_URL should be '/api' not 'http://localhost:5000/api'

3. Vite Dev Server Proxy (if using '/api')
   Incoming: http://localhost:5174/api/ml/predict
   Proxied to: http://localhost:5000/api/ml/predict  ✅ Correct

4. Backend Receives Request
   Endpoint: POST /api/ml/predict
   Route: app.use('/api/ml', mlRoutes)
   Handler: mlController.predictRisk
   
5. Backend Calls ML Service
   mlService.predictRisk(mlRequest)
   └─> POST http://localhost:8000/predict-risk  ✅ Correct

6. ML Service Processes
   @app.post("/predict-risk")
   └─> Uses RL model (PPO) if loaded
   └─> Returns RiskPrediction
```

---

## Issues Found

### 🔴 CRITICAL ISSUES

1. **Frontend Port Mismatch**
   - **File**: `frontend/vite.config.ts`
   - **Current**: `port: 5174`
   - **Expected**: `port: 5173` (Vite default)
   - **Impact**: Documentation and scripts expect port 5173
   - **Fix**: Change to 5173

2. **Frontend API URL Wrong**
   - **File**: `frontend/.env`
   - **Current**: `VITE_API_URL=http://localhost:5000/api`
   - **Should be**: `VITE_API_URL=/api` (for proxy) or remove (uses default)
   - **Impact**: Breaks proxy, causes CORS issues
   - **Fix**: Change to `/api`

### ⚠️ MINOR ISSUES

3. **Backend CLIENT_URL Mismatch**
   - **File**: `backend/.env`
   - **Current**: `CLIENT_URL=http://localhost:5174`
   - **Should be**: `CLIENT_URL=http://localhost:5173`
   - **Impact**: CORS might fail
   - **Fix**: Change to match frontend port

4. **ML Service CORS Port Mismatch**
   - **File**: `ml-service/main.py`
   - **Current**: `allow_origins=["http://localhost:5174", ...]`
   - **Should be**: `allow_origins=["http://localhost:5173", ...]`
   - **Impact**: Direct ML service calls from frontend fail (not used normally)
   - **Fix**: Update to 5173

---

## Recommended Fixes

### Fix 1: Frontend Port (Critical)

**File**: `frontend/vite.config.ts`
```typescript
server: {
  port: 5173,  // ✅ Changed from 5174
  strictPort: true,
  host: true,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

### Fix 2: Frontend API URL (Critical)

**File**: `frontend/.env`
```env
# VITE_API_URL=/api  # ✅ Use relative path for proxy
# OR remove this line entirely - defaults to '/api'
```

### Fix 3: Backend CORS URL

**File**: `backend/.env`
```env
CLIENT_URL=http://localhost:5173  # ✅ Changed from 5174
```

**File**: `backend/src/config/index.ts` (if hardcoded)
Update CORS configuration to use port 5173

### Fix 4: ML Service CORS

**File**: `ml-service/main.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # ✅ Changed from 5174
        "http://localhost:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Correct Routing (After Fixes)

```
┌──────────────┐
│  Frontend    │  http://localhost:5173
│  (Vite)      │
└──────┬───────┘
       │
       │ GET/POST /api/ml/predict
       │ (proxied by Vite)
       ▼
┌──────────────┐
│  Backend     │  http://localhost:5000
│  (Express)   │  
└──────┬───────┘
       │
       │ POST http://localhost:8000/predict-risk
       │ (via mlService client)
       ▼
┌──────────────┐
│ ML Service   │  http://localhost:8000
│  (FastAPI)   │
└──────────────┘
```

---

## Testing After Fixes

### 1. Test Frontend → Backend
```powershell
# Start frontend (should be on 5173)
cd frontend
npm run dev

# In browser console:
fetch('/api/ml/health', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
  .then(r => r.json())
  .then(console.log)
```

### 2. Test Backend → ML Service
```powershell
# Direct backend test
curl -X GET http://localhost:5000/api/ml/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test ML Service Directly
```powershell
# Test ML service
curl -X GET http://localhost:8000/health

# Test prediction
curl -X POST http://localhost:8000/predict-risk \
  -H "Content-Type: application/json" \
  -d '{
    "positions": [{"symbol":"AAPL","quantity":100,"entry_price":150,"current_price":155}],
    "totalValue": 100000
  }'
```

---

## Summary

### ✅ Routing is MOSTLY Correct

The core routing logic is properly implemented:
- Frontend uses proxy to backend ✅
- Backend routes ML requests correctly ✅  
- Backend calls ML service on correct endpoint ✅
- ML service has correct endpoints ✅

### ❌ Configuration Issues

However, there are **configuration mismatches**:
- Port inconsistency (5173 vs 5174)
- Frontend API URL should use proxy, not absolute URL
- CORS settings need port updates

### 🔧 Action Required

**Apply the 4 fixes above** to resolve all routing issues.

After fixes, the routing will work correctly:
```
Frontend (5173) → Proxy → Backend (5000) → ML Service (8000)
```
