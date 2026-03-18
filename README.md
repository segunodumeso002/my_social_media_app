# Social Media App (React + AWS)

A full-stack social media web application with authentication, post creation, comments, likes, profiles, follow/unfollow, notifications, and image uploads.

This project is built for portfolio and interview demonstration, with a React frontend and AWS-backed serverless APIs.

## Live Demo
- Frontend (Netlify): `https://cool-social-media-app.netlify.app`

## Tech Stack
- Frontend: React 19, Vite, React Router, Tailwind CSS, Framer Motion
- Auth: AWS Cognito (via AWS Amplify)
- Backend: AWS Lambda + API Gateway
- Database: DynamoDB
- Storage: Amazon S3
- Hosting: Netlify (frontend)

## Core Features
- User registration, login, email verification, logout
- Protected routes for authenticated pages
- Create posts with optional image upload
- Edit and delete own posts
- Like posts
- Add, edit, and delete comments
- User profile view/edit with profile picture upload
- Follow/unfollow other users
- Notifications page with unread count badge
- Mark one/all notifications as read

## Portfolio Impact
- Built and deployed a complete cloud-backed social media app from scratch using React and AWS serverless services
- Implemented end-to-end authenticated flows and social interactions (posts, comments, likes, follows, notifications)
- Applied production debugging and hardening across frontend, API Gateway, Lambda, and Cognito integration

## Production Debugging Highlights
- Fixed API Gateway CORS mismatch on gateway error responses (`DEFAULT_4XX` and `DEFAULT_5XX`) for Netlify origin
- Improved auth resilience by adding token fallback behavior when Identity Pool credential exchange fails
- Corrected notification-read handling and redeployed the related Lambda with validated handler packaging

## Architecture Overview

### Frontend (`src/`)
- `context/AuthContext.jsx`: Auth session state and Cognito flows
- `services/api.js`: Centralized API calls, headers, error handling
- `pages/`: Route-level pages (`Home`, `Login`, `Register`, `Verify`, `Profile`, `Notifications`)
- `components/`: Reusable UI (`Navbar`, `CreatePost`, `Post`)
- `utils/storage.js`: S3 upload + signed URL handling
- `utils/notifications.js`: Notification refresh event bridge

### Backend (`backend/lambdas/`)
- `getNotifications.mjs`
- `getUnreadNotificationsCount.mjs`
- `markNotificationRead.mjs`
- `markAllNotificationsRead.mjs`
- `updatePost.mjs`
- `deletePost.mjs`
- `updateComment.mjs`
- `deleteComment.mjs`

APIs are exposed through API Gateway and protected with Cognito authorizers where required.

## Local Setup

### Prerequisites
- Node.js 18+ (recommended)
- npm

### 1. Clone
```bash
git clone https://github.com/segunodumeso002/my_social_media_app.git
cd tutorial005-react
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and set values:

```env
VITE_USER_POOL_ID=...
VITE_USER_POOL_CLIENT_ID=...
VITE_API_ENDPOINT=...
VITE_S3_BUCKET=...
VITE_AWS_REGION=us-east-1
VITE_IDENTITY_POOL_ID=...
```

### 4. Run locally
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

## Available Scripts
- `npm run dev` - start Vite dev server
- `npm run dev:host` - expose dev server on network
- `npm run dev:vpn` - bind host/port explicitly
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - lint project

## Deployment Notes

### Frontend
- Netlify is connected to GitHub and auto-deploys from `main`.

### Backend
- Lambda source files are in `backend/lambdas/`.
- API Gateway routes map to Lambda handlers.
- Deploy/redeploy backend after Lambda updates to ensure changes are live.

See:
- `backend/README.md`
- `backend/DEPLOY_INSTRUCTIONS.md`

## Challenges Solved During Development
- Implemented robust CORS handling patterns for local and production origins
- Added ownership checks for post/comment update/delete operations
- Normalized variable backend payload shapes for comments and notifications
- Added notification refresh/event bridge to keep unread badge and page in sync
- Added profile image upload and signed URL resolution for stable media rendering
- Improved UI consistency and responsiveness across major pages

## Manual Test Checklist (Interview Evidence)

Authentication
- Register new user
- Verify email code
- Login/logout
- Access protected routes only when authenticated

Posts and Comments
- Create post (text only)
- Create post (with image)
- Edit/delete own post
- Like/unlike post
- Add/edit/delete own comment

Profile and Social
- View profile by route param
- Edit own bio/profile picture
- Follow/unfollow another user

Notifications
- See unread badge updates in navbar
- Open notifications page
- Mark single notification read
- Mark all notifications read

Cross-Environment
- Confirm local behavior (`npm run dev`)
- Confirm production behavior on Netlify
- Confirm `npm run build` succeeds

## Screenshots
- Add screenshots in a `/screenshots` folder and link them here for interview presentation.
- Suggested captures:
  - Login/Register/Verify screens
  - Home feed and post interactions
  - Profile edit
  - Notifications with unread/read states

## Repository Structure (Top Level)
```text
.
├── backend/
├── public/
├── src/
├── .env.example
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Author
- Segun Odumeso
