# Backend Lambda Functions

This folder contains the Lambda functions for your social media app.

## Files Structure

```
backend/
└── lambdas/
  ├── updatePost.mjs
  ├── deletePost.mjs
    ├── markAllNotificationsRead.mjs
    ├── getNotifications.mjs
    ├── getUnreadNotificationsCount.mjs
    └── markNotificationRead.mjs
```

## Setup Instructions

### Step 1: Paste Your Code
1. Open each `.mjs` file in the `lambdas` folder
2. Replace the placeholder code with your actual Lambda function code from AWS Console
3. Make sure each function has the CORS headers configured correctly

### Step 2: Deploy to AWS Lambda

#### Option A: Deploy via AWS Console (Easiest)
1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda
2. For each function:
   - Click on the function name
   - Go to "Code" tab
   - Copy the content from the corresponding `.mjs` file
   - Paste it into the Lambda code editor
   - Click "Deploy" button
   - Wait for "Successfully deployed" confirmation

#### Option B: Deploy via AWS CLI (If you have it installed)
```bash
# For each function, run:
aws lambda update-function-code \
  --function-name markAllNotificationsRead \
  --zip-file fileb://markAllNotificationsRead.zip \
  --region us-east-1

# Repeat for other functions
```

### Step 3: Test
After deploying all functions:
1. Go to your Netlify app: https://cool-social-media-app.netlify.app
2. Test the notifications feature
3. Check browser console - CORS errors should be gone

## Important Notes
- All functions already include CORS headers for both localhost and Netlify
- Make sure to deploy ALL 4 functions for notifications to work properly
- After deployment, changes take effect immediately (no need to restart anything)

## Post Edit/Delete Backend Setup

To support post editing/deleting from the frontend:

1. Create two Lambda functions in AWS Lambda:
  - `updatePost`
  - `deletePost`
2. Paste code from:
  - `backend/lambdas/updatePost.mjs`
  - `backend/lambdas/deletePost.mjs`
3. In API Gateway add methods on `/posts/{postId}`:
  - `PUT` -> Lambda proxy integration -> `updatePost`
  - `DELETE` -> Lambda proxy integration -> `deletePost`
4. Ensure your Cognito authorizer is attached to both methods (same as your existing protected post routes).
5. Redeploy the API stage.
