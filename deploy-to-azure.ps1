# Azure App Service ZIP Deployment Script
param(
    [string]$WebAppName = "tuucyb",
    [string]$ZipFile = "tuucyb-fresh.zip"
)

Write-Host "Starting deployment of $ZipFile to $WebAppName..."

# Kudu ZIP deployment endpoint
$kuduUrl = "https://$WebAppName.scm.azurewebsites.net/api/zipdeploy"

# Check if ZIP file exists
if (-not (Test-Path $ZipFile)) {
    Write-Error "ZIP file $ZipFile not found!"
    exit 1
}

try {
    Write-Host "Deploying to: $kuduUrl"
    Write-Host "This will use Azure's basic authentication (you may need to enter credentials)..."
    
    # Read ZIP file as bytes
    $zipBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ZipFile).Path)
    
    # Create web request
    $webRequest = [System.Net.HttpWebRequest]::Create($kuduUrl)
    $webRequest.Method = "POST"
    $webRequest.ContentType = "application/zip"
    $webRequest.ContentLength = $zipBytes.Length
    
    # Write ZIP data to request stream
    $requestStream = $webRequest.GetRequestStream()
    $requestStream.Write($zipBytes, 0, $zipBytes.Length)
    $requestStream.Close()
    
    # Get response
    Write-Host "Uploading and deploying..."
    $response = $webRequest.GetResponse()
    
    Write-Host "Deployment successful! Status: $($response.StatusCode)"
    Write-Host "Your site should be available at: https://$WebAppName.azurewebsites.net"
    
} catch [System.Net.WebException] {
    $errorResponse = $_.Exception.Response
    if ($errorResponse -and $errorResponse.StatusCode -eq "Unauthorized") {
        Write-Host ""
        Write-Host "Authentication required. Please use one of these methods instead:"
        Write-Host "1. Go to Azure Portal > $WebAppName > Development Tools > Advanced Tools (Kudu)"
        Write-Host "2. Use Azure Portal > $WebAppName > Deployment Center > Browse and manually upload the ZIP"
        Write-Host "3. Download publish profile and use Web Deploy"
    } else {
        Write-Error "Deployment failed: $($_.Exception.Message)"
    }
} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
}
