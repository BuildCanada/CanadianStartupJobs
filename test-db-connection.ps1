# Test PostgreSQL Connection Script
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Cyan

# Test 1: Check if port is accessible
Write-Host "`n1. Testing port accessibility..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
if ($portTest) {
    Write-Host "   Port 5432 is accessible" -ForegroundColor Green
} else {
    Write-Host "   Port 5432 is NOT accessible" -ForegroundColor Red
    exit 1
}

# Test 2: Test connection using docker exec
Write-Host "`n2. Testing connection from inside container..." -ForegroundColor Yellow
$testResult = docker exec canadian-startup-jobs-db sh -c "PGPASSWORD=password psql -h 127.0.0.1 -U postgres -d postgres -c 'SELECT version();' 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Connection from inside container works" -ForegroundColor Green
    $version = $testResult | Select-String 'PostgreSQL'
    Write-Host "   Database version: $version" -ForegroundColor Gray
} else {
    Write-Host "   Connection failed" -ForegroundColor Red
    Write-Host "   Error: $testResult" -ForegroundColor Red
}

# Display connection information
Write-Host "`n3. Connection Information for pgAdmin:" -ForegroundColor Yellow
Write-Host "   Host: 127.0.0.1" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Maintenance DB: postgres" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: password" -ForegroundColor White

Write-Host "`nAll tests completed!" -ForegroundColor Green
