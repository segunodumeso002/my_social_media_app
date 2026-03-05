@echo off
echo Starting Lambda deployment...
echo.

cd backend\lambdas

echo Deploying markAllNotificationsRead...
powershell -Command "Compress-Archive -Path markAllNotificationsRead.mjs -DestinationPath markAllNotificationsRead.zip -Force"
aws lambda update-function-code --function-name markAllNotificationsRead --zip-file fileb://markAllNotificationsRead.zip --region us-east-1
del markAllNotificationsRead.zip
echo.

echo Deploying getNotifications...
powershell -Command "Compress-Archive -Path getNotifications.mjs -DestinationPath getNotifications.zip -Force"
aws lambda update-function-code --function-name getNotifications --zip-file fileb://getNotifications.zip --region us-east-1
del getNotifications.zip
echo.

echo Deploying getUnreadNotificationsCount...
powershell -Command "Compress-Archive -Path getUnreadNotificationsCount.mjs -DestinationPath getUnreadNotificationsCount.zip -Force"
aws lambda update-function-code --function-name getUnreadNotificationsCount --zip-file fileb://getUnreadNotificationsCount.zip --region us-east-1
del getUnreadNotificationsCount.zip
echo.

echo Deploying markNotificationRead...
powershell -Command "Compress-Archive -Path markNotificationRead.mjs -DestinationPath markNotificationRead.zip -Force"
aws lambda update-function-code --function-name markNotificationRead --zip-file fileb://markNotificationRead.zip --region us-east-1
del markNotificationRead.zip
echo.

cd ..\..

echo ========================================
echo All Lambda functions deployed!
echo ========================================
echo.
echo Next steps:
echo 1. Test your app at: https://cool-social-media-app.netlify.app
echo 2. Check browser console - CORS errors should be gone
pause
