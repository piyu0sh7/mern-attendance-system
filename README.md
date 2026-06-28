# Modern Attendance Management System

A full-stack, enterprise-grade HR Attendance Management System built with the MERN stack (MongoDB, Express, React, Node.js). 

## 🚀 Features

### Core Features
- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Employees, Managers, and Admins.
- **Biometric-style Verification:** Employees must capture a live webcam selfie to punch in and punch out.
- **Dynamic Geofencing:** Attendance can only be logged if the employee is within a designated GPS radius of their worksite.
- **Cloud Media Storage:** Selfies are securely uploaded and stored via Cloudinary APIs to prevent database bloat.

### Advanced HR Modules
- **Leave Management:** Employees can request leaves; Managers/Admins can approve or reject with remarks.
- **Overtime Management:** Overtime requests are tracked and managed via a dedicated approval pipeline.
- **Manual Adjustments:** Fallback workflow allowing employees to request manual punch-ins if they forget or experience hardware failures.
- **Visual Anti-Fraud Validation:** Admins can view side-by-side comparisons of punch-in and punch-out selfies to manually validate records.

### Analytics & Reporting
- **Pagination:** Enterprise data tables support pagination for massive datasets.
- **CSV Export:** Managers and Admins can export daily and global attendance reports directly to CSV.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Redux Toolkit + RTK Query (State Management & API caching)
- React Router DOM
- React-Webcam
- Leaflet + React-Leaflet (Interactive Maps & Geofencing)

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs (Authentication)
- Cloudinary SDK (Image hosting)

## 📦 Local Setup

1. **Clone the repository**
2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```
4. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/attendance_db
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=90d
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
5. **Run the Application:**
   Open two terminal windows:
   - Terminal 1 (Backend): `npm run dev` (Requires nodemon) or `node server.js`
   - Terminal 2 (Frontend): `cd frontend && npm run dev`

## 👥 Default Test Accounts (After Seeding)
- **Admin:** admin@test.com / password123
- **Manager:** manager@test.com / password123
- **Employee:** employee@test.com / password123
