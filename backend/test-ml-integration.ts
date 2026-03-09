/**
 * Test Backend ML Service Integration
 * Tests the connection between backend and ML service
 */

import axios from 'axios';

const ML_SERVICE_URL = 'http://localhost:8000';
const BACKEND_URL = 'http://localhost:5000';

interface MLPredictionRequest {
  portfolioId: string;
  portfolioData: {
    totalValue: number;
    positions: Array<{
      symbol: string;
      quantity: number;
      price: number;
      delta?: number;
      gamma?: number;
      vega?: number;
      theta?: number;
    }>;
  };
}

async function testMLServiceHealth() {
  console.log('='.repeat(60));
  console.log('TESTING ML SERVICE HEALTH');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    console.log('✅ ML Service is healthy');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Model Loaded: ${response.data.model_loaded}`);
    console.log(`   Timestamp: ${response.data.timestamp}`);
    return true;
  } catch (error: any) {
    console.log('❌ ML Service health check failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testMLPrediction() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING ML PREDICTION DIRECTLY');
  console.log('='.repeat(60));
  
  const testData: MLPredictionRequest = {
    portfolioId: 'test-portfolio-001',
    portfolioData: {
      totalValue: 75000,
      positions: [
        {
          symbol: 'AAPL',
          quantity: 15,
          price: 150.0,
          delta: 0.65,
          gamma: 0.04,
          vega: 0.3,
          theta: -0.06,
        },
        {
          symbol: 'SPY',
          quantity: 10,
          price: 450.0,
          delta: 0.55,
          gamma: 0.02,
          vega: 0.2,
          theta: -0.04,
        },
      ],
    },
  };

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict-risk`,
      testData
    );
    
    console.log('✅ ML Prediction successful');
    console.log('\nPrediction Results:');
    console.log(`   Risk Score: ${response.data.riskScore}`);
    console.log(`   Confidence: ${response.data.confidence} ${response.data.confidence === 0.92 ? '(RL Model)' : '(Heuristic)'}`);
    console.log(`   Volatility: ${response.data.volatility}`);
    console.log(`   VaR 95%: ${response.data.var95}`);
    console.log(`   VaR 99%: ${response.data.var99}`);
    console.log(`   Sharpe Ratio: ${response.data.sharpeRatio}`);
    console.log(`   Recommendation: ${response.data.recommendation}`);
    
    // Verify it's using the real RL model
    if (response.data.confidence === 0.92) {
      console.log('\n🎉 SUCCESS: Real RL model is being used!');
    } else {
      console.log('\n⚠️  WARNING: Using heuristic fallback (confidence = 0.65)');
    }
    
    return response.data;
  } catch (error: any) {
    console.log('❌ ML Prediction failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

async function testBackendMLEndpoint() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING BACKEND ML ENDPOINT');
  console.log('='.repeat(60));
  console.log('⚠️  This requires backend server running and database accessible');
  console.log('   Skipping for now - use direct ML service test above');
  
  // This would require authentication and a real portfolio
  // Keeping it here for reference when database is available
}

async function runTests() {
  console.log('\n🚀 Backend ML Integration Test Suite\n');
  
  // Test 1: ML Service Health
  const healthOk = await testMLServiceHealth();
  if (!healthOk) {
    console.log('\n❌ ML Service is not running. Start it with:');
    console.log('   cd ml-service');
    console.log('   uvicorn main:app --reload --port 8000');
    return;
  }
  
  // Test 2: Direct ML Prediction
  const prediction = await testMLPrediction();
  
  // Test 3: Backend endpoint (requires database)
  await testBackendMLEndpoint();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ ML Service: OPERATIONAL');
  console.log(`✅ RL Model: ${prediction?.confidence === 0.92 ? 'ACTIVE' : 'FALLBACK'}`);
  console.log('⚠️  Backend Integration: Requires database setup');
  console.log('\nNext Steps:');
  console.log('1. Start PostgreSQL: docker-compose up -d postgres');
  console.log('2. Run migrations: cd backend && npm run prisma:migrate');
  console.log('3. Start backend: npm run dev');
  console.log('4. Test full integration with real portfolios');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
