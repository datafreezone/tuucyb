# Deploy Tuusula Cybersecurity Dashboard with Azure Functions
# This script deploys both the static site and the Azure Functions API

Write-Host "Starting deployment of Tuusula Cybersecurity Dashboard with API..." -ForegroundColor Green

# Check if Azure CLI is installed
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Configuration
$resourceGroupName = "tuucyb-rg"
$appName = "tuucyb"
$location = "West Europe"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $resourceGroupName"
Write-Host "  App Name: $appName"
Write-Host "  Location: $location"

try {
    # Install API dependencies
    Write-Host "Installing API dependencies..." -ForegroundColor Yellow
    Set-Location "api"
    npm install
    Set-Location ".."
    
    # Create zip package for deployment
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    if (Test-Path "deployment.zip") {
        Remove-Item "deployment.zip"
    }
    
    # Create deployment package including both static files and API
    Compress-Archive -Path "index.html", "web.config", "staticwebapp.config.json", "api" -DestinationPath "deployment.zip" -Force
    
    Write-Host "Deployment package created successfully!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Push to GitHub - your workflow will deploy automatically"
    Write-Host "  2. Or upload deployment.zip to Azure Portal"
    Write-Host "  3. The API will be available at: https://tuucyb.azurestaticapps.net/api/ncsc-rss"
    
} catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment preparation completed successfully!" -ForegroundColor Green
