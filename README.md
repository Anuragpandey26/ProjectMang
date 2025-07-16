ProjectMang

Overview

ProjectMang is a project management application designed to streamline collaboration and task tracking for teams. The backend, built with Node.js, Express, and MongoDB, provides a robust API for managing users, workspaces, projects, and tasks. It includes features like user authentication, email verification, task assignments, and workspace management, with security measures such as JWT-based authentication and email validation.
Features

User Authentication: Secure user registration, login, email verification, and password reset functionality using JWT and bcrypt.

Workspace Management: Create and manage workspaces, invite members, and track workspace activities.

Project Management: Create, update, and retrieve project details, including tasks and member roles.

Task Management: Create tasks, assign users, add subtasks, comments, and track task status and priority.

Activity Logging: Record user actions (e.g., task updates, workspace joins) for transparency.

Security: Email validation with Arcjet, rate limiting, and secure password hashing.

Email Notifications: Send verification, password reset, and workspace invitation emails via SendGrid.

Technologies Used

Backend: Node.js, Express.js

Database: MongoDB with Mongoose

Authentication: JSON Web Tokens (JWT), bcrypt

Security: Arcjet for email validation and bot protection

Email Service: SendGrid

Validation: Zod for schema validation

Other Libraries: CORS, Morgan (logging), dotenv (environment variables)

Installation

Clone the Repository:
git clone <repository-url>
cd project-manager-main/backend


Install Dependencies:
npm install


Set Up Environment Variables:Create a .env file in the backend directory and add the following:

PORT=PORT_NO

MONGODB_URI=<your-mongodb-connection-string>

JWT_SECRET=<your-jwt-secret>

ARCJET_KEY=<your-arcjet-key>

SEND_GRID_API=<your-sendgrid-api-key>

FROM_EMAIL=<your-sendgrid-from-email>






API Endpoints

Authentication

POST /api-v1/auth/register: Register a new user

POST /api-v1/auth/login: Log in a user

POST /api-v1/auth/verify-email: Verify user email

POST /api-v1/auth/reset-password-request: Request password reset

POST /api-v1/auth/reset-password: Reset password with token

Workspaces

POST /api-v1/workspaces: Create a new workspace

GET /api-v1/workspaces: Get all workspaces for the authenticated user

GET /api-v1/workspaces/:workspaceId: Get workspace details

GET /api-v1/workspaces/:workspaceId/projects: Get projects in a workspace

GET /api-v1/workspaces/:workspaceId/stats: Get workspace statistics

POST /api-v1/workspaces/:workspaceId/invite-member: Invite a user to a workspace

POST /api-v1/workspaces/:workspaceId/accept-generate-invite: Accept workspace invitation

POST /api-v1/workspaces/accept-invite-token: Accept invitation via token


Projects

POST /api-v1/projects/:workspaceId/create-project: Create a project

GET /api-v1/projects/:projectId: Get project details

GET /api-v1/projects/:projectId/tasks: Get tasks in a project


Tasks

POST /api-v1/tasks/:projectId/create-task: Create a task


GET /api-v1/tasks/:taskId: Get task details

GET /api-v1/tasks/my-tasks: Get tasks assigned to the authenticated user

PUT /api-v1/tasks/:taskId/title: Update task title

PUT /api-v1/tasks/:taskId/description: Update task description

PUT /api-v1/tasks/:taskId/status: Update task status

PUT /api-v1/tasks/:taskId/assignees: Update task assignees

PUT /api-v1/tasks/:taskId/priority: Update task priority


POST /api-v1/tasks/:taskId/add-subtask: Add a subtask


PUT /api-v1/tasks/:taskId/update-subtask/:subTaskId: Update a subtask


POST /api-v1/tasks/:taskId/add-comment: Add a comment to a task


GET /api-v1/tasks/:taskId/comments: Get task comments


POST /api-v1/tasks/:taskId/watch: Watch/unwatch a task


POST /api-v1/tasks/:taskId/achieved: Mark task as achieved/unachieved

GET /api-v1/tasks/:resourceId/activity: Get activity log for a resource

Users

GET /api-v1/users/profile: Get user profile


PUT /api-v1/users/profile: Update user profile


PUT /api-v1/users/change-password: Change user password



Security Notes

JWT Authentication: All protected routes require a valid JWT token in the Authorization header (format: Bearer <token>).
Arcjet Protection: Configured to block disposable/invalid email addresses and limit request rates.
Environment Variables: Store sensitive information (e.g., API keys, JWT secret) in the .env file and ensure it is not committed to version control (included in .gitignore).
Email Security: Uses SendGrid for secure email delivery.

Directory Structure

project-manager-main/

├── backend/

│   ├── controllers/

│   │   ├── auth-controller.js

│   │   ├── project.js

│   │   ├── task.js

│   │   ├── user.js

│   │   └── workspace.js

│   ├── libs/
│   │   ├── arcjet.js

│   │   ├── index.js

│   │   ├── send-email.js

│   │   └── validate-schema.js

│   ├── middleware/

│   │   └── auth-middleware.js

│   ├── models/

│   │   ├── activity.js

│   │   ├── comment.js

│   │   ├── project.js

│   │   ├── task.js

│   │   ├── user.js

│   │   ├── verification.js

│   │   └── workspace-invite.js

│   ├── routes/

│   │   ├── auth.js

│   │   ├── index.js

│   │   ├── project.js

│   │   ├── task.js

│   │   ├── user.js

│   │   └── workspace.js

│   ├── .gitignore

│   ├── index.js

│   └── package.json

