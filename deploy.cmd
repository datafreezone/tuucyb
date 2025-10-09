@echo off

echo Deploying Tuusula Cybersecurity Dashboard...

:: Copy files to deployment target
if exist "%DEPLOYMENT_TARGET%" (
    echo Copying files to %DEPLOYMENT_TARGET%
    copy /Y "index.html" "%DEPLOYMENT_TARGET%\"
    copy /Y "web.config" "%DEPLOYMENT_TARGET%\"
    echo Deployment completed successfully
) else (
    echo DEPLOYMENT_TARGET not set, copying to current directory
    echo Files are already in place
)

echo Tuusula Cybersecurity Dashboard deployed successfully!
