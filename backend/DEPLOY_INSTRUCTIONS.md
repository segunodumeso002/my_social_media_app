# Lambda Deployment Instructions

## ✅ All 4 Lambda functions are ready with complete code!

### Files created:
1. `backend/lambdas/getNotifications.mjs`
2. `backend/lambdas/getUnreadNotificationsCount.mjs`
3. `backend/lambdas/markNotificationRead.mjs`
4. `backend/lambdas/markAllNotificationsRead.mjs`

---

## 🚀 Deploy to AWS (Do this for EACH function):

### Step 1: getNotifications
1. Open AWS Lambda Console
2. Click on `getNotifications` function
3. If file is missing, click "Create File" button
4. Open `backend/lambdas/getNotifications.mjs` in your editor
5. Copy ALL the code (Ctrl+A, Ctrl+C)
6. Paste into AWS Lambda editor
7. Click "Deploy" button (wait for success message)

### Step 2: getUnreadNotificationsCount
1. Click on `getUnreadNotificationsCount` function
2. If file is missing, click "Create File" button
3. Open `backend/lambdas/getUnreadNotificationsCount.mjs`
4. Copy ALL the code
5. Paste into AWS Lambda editor
6. Click "Deploy" button

### Step 3: markNotificationRead
1. Click on `markNotificationRead` function
2. If file is missing, click "Create File" button
3. Open `backend/lambdas/markNotificationRead.mjs`
4. Copy ALL the code
5. Paste into AWS Lambda editor
6. Click "Deploy" button

### Step 4: markAllNotificationsRead
1. Click on `markAllNotificationsRead` function
2. If file is missing, click "Create File" button
3. Open `backend/lambdas/markAllNotificationsRead.mjs`
4. Copy ALL the code
5. Paste into AWS Lambda editor
6. Click "Deploy" button

---

## ✅ After deploying all 4 functions:

1. Go to your Netlify app: https://cool-social-media-app.netlify.app
2. Open browser console (F12)
3. Test the notifications feature
4. CORS errors should be GONE!

---

## 📝 What each function does:

- **getNotifications**: Fetches all notifications for the logged-in user
- **getUnreadNotificationsCount**: Returns count of unread notifications
- **markNotificationRead**: Marks a single notification as read
- **markAllNotificationsRead**: Marks all notifications as read

All functions include:
- ✅ CORS headers for localhost and Netlify
- ✅ DynamoDB operations
- ✅ User authentication from Cognito
- ✅ Error handling

---

## ✨ Post Edit/Delete (Portfolio upgrade)

Add these two new Lambda handlers:

1. `backend/lambdas/updatePost.mjs`
2. `backend/lambdas/deletePost.mjs`

Then in API Gateway for route `/posts/{postId}`:

- Add `PUT` method -> Lambda proxy -> `updatePost`
- Add `DELETE` method -> Lambda proxy -> `deletePost`
- Keep `OPTIONS` for CORS
- Attach same Cognito authorizer used on your protected post routes

Finally click **Deploy API** so frontend calls to `PUT/DELETE /posts/{postId}` start working.
