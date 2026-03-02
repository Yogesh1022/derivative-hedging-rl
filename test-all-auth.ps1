# ═══════════════════════════════════════════════════════════════
# TEST ALL AUTHENTICATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║   🧪  Testing All Authentication Endpoints                   ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$apiUrl = "http://localhost:5000/api"
$testEmail = "testuser_$(Get-Random)@example.com"
$testPassword = "Test123!Pass"
$newPassword = "NewTest123!Pass"

# Test 1: Register
Write-Host "`n[1/7] Testing /auth/register..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User"
    email = $testEmail
    password = $testPassword
    role = "TRADER"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User ID: $($response.data.user.id)" -ForegroundColor Gray
    Write-Host "   Token: $($response.data.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $response.data.token
    $userId = $response.data.user.id
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n[2/7] Testing /auth/login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($response.data.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $response.data.token
    $refreshToken = $response.data.refreshToken
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Get Profile (/me)
Write-Host "`n[3/7] Testing /auth/me..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/me" -Method Get -Headers $headers
    Write-Host "✅ Get profile successful!" -ForegroundColor Green
    Write-Host "   Name: $($response.data.name)" -ForegroundColor Gray
    Write-Host "   Email: $($response.data.email)" -ForegroundColor Gray
    Write-Host "   Role: $($response.data.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get profile failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Change Password
Write-Host "`n[4/7] Testing /auth/change-password..." -ForegroundColor Yellow
$changePasswordBody = @{
    currentPassword = $testPassword
    newPassword = $newPassword
} | ConvertTo-Json

try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/change-password" -Method Post -Body $changePasswordBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Change password successful!" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Change password failed: $_" -ForegroundColor Red
    exit 1
}

# Test 5: Login with new password
Write-Host "`n[5/7] Testing login with new password..." -ForegroundColor Yellow
$loginNewBody = @{
    email = $testEmail
    password = $newPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginNewBody -ContentType "application/json"
    Write-Host "✅ Login with new password successful!" -ForegroundColor Green
    $token = $response.data.token
} catch {
    Write-Host "❌ Login with new password failed: $_" -ForegroundColor Red
    exit 1
}

# Test 6: Refresh Token
Write-Host "`n[6/7] Testing /auth/refresh..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    Write-Host "✅ Token refresh successful!" -ForegroundColor Green
    Write-Host "   New Token: $($response.data.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $response.data.token
} catch {
    Write-Host "❌ Token refresh failed: $_" -ForegroundColor Red
    exit 1
}

# Test 7: Logout
Write-Host "`n[7/7] Testing /auth/logout..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/logout" -Method Post -Headers $headers
    Write-Host "✅ Logout successful!" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Logout failed: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "║   ✅  ALL AUTHENTICATION TESTS PASSED!                       ║" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "║   Test user created: $testEmail" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Registration" -ForegroundColor Green
Write-Host "   ✅ Login" -ForegroundColor Green
Write-Host "   ✅ Get Profile (/me)" -ForegroundColor Green
Write-Host "   ✅ Change Password" -ForegroundColor Green
Write-Host "   ✅ Login with New Password" -ForegroundColor Green
Write-Host "   ✅ Refresh Token" -ForegroundColor Green
Write-Host "   ✅ Logout" -ForegroundColor Green
Write-Host ""
