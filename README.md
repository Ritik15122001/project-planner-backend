
# Collaborative Project Planner - MERN Stack

A full-stack web application for collaborative project management with real-time Kanban boards, task management, and team collaboration.

---

## 📋 Project Setup and Run Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account

### Backend Setup

cd backend
npm install

text

Create `.env` file in `backend/`:
PORT=8080
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
CLIENT_URL=http://localhost:5173
NODE_ENV=development

text

Start backend:
npm run dev

Runs on http://localhost:8080
text

### Frontend Setup

cd frontend
npm install

text

Create `.env` file in `frontend/`:
VITE_API_URL=http://localhost:8080/api

text

Start frontend:
npm run dev

Runs on http://localhost:5173
text

Open browser: `http://localhost:5173`

---

## 🛠️ Technologies Used

### Frontend
- **React.js 18.x** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router DOM** - Routing
- **@hello-pangea/dnd** - Drag and drop
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time WebSocket
- **JWT** - Authentication
- **bcryptjs** - Password hashing

---

## 📡 API Documentation

### Base URL: `http://localhost:8080/api`

### Authentication (Public)

**Register**
POST /api/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "pass123" }
Response: { "success": true, "token": "...", "user": {...} }

text

**Login**
POST /api/auth/login
Body: { "email": "john@example.com", "password": "pass123" }
Response: { "success": true, "token": "...", "user": {...} }

text

### Projects (Protected - Require `Authorization: Bearer <token>`)

GET /api/projects # Get all projects
POST /api/projects # Create project
GET /api/projects/:id # Get project by ID
PATCH /api/projects/:id # Update project
DELETE /api/projects/:id # Delete project
POST /api/projects/:id/members # Add member (Body: { "email": "..." })
DELETE /api/projects/:id/members/:memberId # Remove member

text

### Tasks (Protected)

GET /api/projects/:projectId/tasks # Get all tasks
POST /api/projects/:projectId/tasks # Create task
PATCH /api/tasks/:id # Update task
DELETE /api/tasks/:id # Delete task

text

**Task Body Example:**
{
"title": "Task title",
"description": "Description",
"status": "todo",
"assignedTo": "user_id",
"dueDate": "2025-12-31"
}

text

### Socket.IO Events

**Client → Server:**
- `joinProject(projectId)` - Join project room
- `leaveProject(projectId)` - Leave project room

**Server → Client:**
- `taskCreated(task)` - New task created
- `taskUpdated(task)` - Task updated
- `taskDeleted({ taskId })` - Task deleted
- `projectUpdated(project)` - Project metrics updated

---

## 📝 Assumptions

1. Users have valid email addresses for registration and collaboration
2. Stable internet connection required for real-time features
3. Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
4. MongoDB Atlas used for database (cloud-hosted)
5. Each project has one owner with full control
6. Team members can create tasks auto-assigned to themselves
7. JWT tokens stored in localStorage (expires in 30 days)
8. Task status limited to: To Do, In Progress, Completed

---




## 🎯 Features Implemented

✅ User authentication (JWT-based)  
✅ Project CRUD operations  
✅ Team member management  
✅ Task CRUD with assignment  
✅ Kanban board with drag-and-drop  
✅ Real-time updates (Socket.IO)  
✅ Role-based access (Owner vs Member)  
✅ Dashboard with project metrics  
✅ Responsive UI design  
✅ Toast notifications  

---


## 🧪 Testing

1. Register account at `http://localhost:5173`
2. Create a new project
3. Add team member by email
4. Create tasks and drag between columns
5. Open two browsers with different users to test real-time sync

---

## ⚠️ Setup Notes

- Whitelist IP in MongoDB Atlas: `0.0.0.0/0` for development
- Ensure `JWT_SECRET` is minimum 32 characters
- Both backend and frontend must run simultaneously
- Clear browser cache if real-time updates fail

---
