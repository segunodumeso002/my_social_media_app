# Lambda Deployment Script
# This script updates all notification Lambda functions with CORS-enabled code

$ErrorActionPreference = "Stop"
$region = "us-east-1"
$lambdaDir = "backend\lambdas"

Write-Host "Starting Lambda deployment..." -ForegroundColor Green

# Function to deploy a Lambda
function Deploy-Lambda {
    param($functionName, $filePath)
    
    Write-Host "`nDeploying $functionName..." -ForegroundColor Yellow
    
    # Create temp directory for this function
    $tempDir = "temp_$functionName"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    
    # Copy the file to temp directory as index.mjs
    Copy-Item $filePath "$tempDir\index.mjs"
    
    # Create ZIP file
    $zipFile = "$functionName.zip"
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force
    
    # Deploy to AWS Lambda
    aws lambda update-function-code `
        --function-name $functionName `
        --zip-file "fileb://$zipFile" `
        --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $functionName deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to deploy $functionName" -ForegroundColor Red
    }
    
    # Cleanup
    Remove-Item -Recurse -Force $tempDir
    Remove-Item -Force $zipFile
}

# Deploy all Lambda functions
Deploy-Lambda "markAllNotificationsRead" "$lambdaDir\markAllNotificationsRead.mjs"
Deploy-Lambda "getNotifications" "$lambdaDir\getNotifications.mjs"
Deploy-Lambda "getUnreadNotificationsCount" "$lambdaDir\getUnreadNotificationsCount.mjs"
Deploy-Lambda "markNotificationRead" "$lambdaDir\markNotificationRead.mjs"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "All Lambda functions deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Test your app at: https://cool-social-media-app.netlify.app" -ForegroundColor White
Write-Host "2. Check browser console - CORS errors should be gone" -ForegroundColor White
