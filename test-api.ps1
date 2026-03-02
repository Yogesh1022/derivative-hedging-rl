# Test HedgeAI Registration and Login with Visible Logs

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Testing HedgeAI Backend API" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
    Write-Host "✅ Health Check Passed" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Register New User
Write-Host "2. Registering New User..." -ForegroundColor Yellow
$registerBody = @{
    email = "test$(Get-Random -Maximum 9999)@hedgeai.com"
    password = "TestPass123!"
   name = "Test User"
    role = "TRADER"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $registerBody -TimeoutSec 10
    Write-Host "✅ User Registered Successfully" -ForegroundColor Green
    Write-Host "   Email: $($register.data.user.email)" -ForegroundColor Gray
    Write-Host "   Name: $($register.data.user.name)" -ForegroundColor Gray
    Write-Host "   Role: $($register.data.user.role)" -ForegroundColor Gray
    Write-Host "   Token: $($register.data.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    $userEmail = $register.data.user.email
    $token = $register.data.token
} catch {
    Write-Host "❌ Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Login
Write-Host "3. Logging in with same user..." -ForegroundColor Yellow
$loginBody = @{
    email = $userEmail
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -TimeoutSec 10
    Write-Host "✅ Login Successful" -ForegroundColor Green
    Write-Host "   Email: $($login.data.user.email)" -ForegroundColor Gray
    Write-Host "   Name: $($login.data.user.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Profile
Write-Host "4. Getting User Profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Headers @{Authorization = "Bearer $token"} -TimeoutSec 5
    Write-Host "✅ Profile Retrieved" -ForegroundColor Green
    Write-Host "   Email: $($profile.data.email)" -ForegroundColor Gray
    Write-Host "   Name: $($profile.data.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Profile Retrieval Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ All Tests Completed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Check the backend terminal for detailed logs showing:" -ForegroundColor Yellow
Write-Host "  - User Registration Success Message" -ForegroundColor Gray
Write-Host "  - User Login Success Message" -ForegroundColor Gray
Write-Host ""
