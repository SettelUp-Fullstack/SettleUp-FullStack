<div align="center">

# 💸 SettleUp

### A modern group expense management web application

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

</div>

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)

---

## 📖 Project Description

**SettleUp** is a full-stack group expense management web application built on the **MEAN stack** (MongoDB, Express.js, Angular, Node.js). It enables users to register, log in, create groups, add shared expenses, and automatically split bills among group members — making it effortless to track who owes what and settle up debts.

Whether you're splitting rent with flatmates, managing a group trip, or tracking shared meals, SettleUp keeps everything transparent and organized in one place.

---

## ✨ Features

- 🔐 **User Authentication** — Secure register and login with hashed passwords
- 🛡️ **JWT-Based Auth** — Stateless authentication using JSON Web Tokens
- 🔒 **Protected Routes** — Angular route guards restrict access to authenticated users only
- 👥 **Group Management** — Create, update, and delete expense groups; add or remove members
- 💰 **Expense Tracking** — Add, edit, and delete shared expenses within groups
- ⚖️ **Bill Splitting** — Automatically calculate each member's share of expenses
- 📊 **Dashboard Overview** — At-a-glance summary of balances, groups, and recent activity
- 🤝 **Settlements** — Record and track payments between group members
- 📱 **Responsive UI** — Mobile-friendly design powered by Tailwind CSS

---

## 🛠️ Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | Angular 21 (Standalone), Tailwind CSS 4      |
| Backend    | Node.js 20+, Express.js 4                    |
| Database   | MongoDB 7 (via Mongoose)                     |
| Auth       | JSON Web Tokens (JWT), bcryptjs              |
| Dev Tools  | Nodemon, Angular CLI, Vitest                 |
| Deployment | Vercel (frontend), Render (backend)          |

---

## 📁 Folder Structure

```
SettleUp-FullStack/
│
├── client/                        # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   └── guards/        # Auth guards
│   │   │   ├── features/
│   │   │   │   ├── login/         # Login page
│   │   │   │   ├── register/      # Register page
│   │   │   │   ├── dashboard/     # Dashboard overview
│   │   │   │   ├── groups/        # Group management
│   │   │   │   ├── expenses/      # Expense management
│   │   │   │   ├── balances/      # Balance viewer
│   │   │   │   ├── settlements/   # Settlement tracker
│   │   │   │   └── layout/        # Shared layout wrapper
│   │   │   ├── services/          # Angular HTTP services
│   │   │   ├── app.routes.ts      # Route definitions
│   │   │   └── app.config.ts      # App configuration
│   │   └── environments/          # Environment config files
│   ├── angular.json
│   └── package.json
│
└── backend/                       # Node.js + Express backend
    ├── src/
    │   ├── config/                # Database configuration
    │   ├── controllers/           # Route controllers
    │   ├── middleware/            # Auth middleware
    │   ├── models/                # Mongoose models
    │   └── routes/                # Express route definitions
    ├── server.js                  # Express app entry point
    └── package.json
```

---

## 🚀 Installation

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [Angular CLI](https://angular.io/cli) v17+
- [MongoDB](https://www.mongodb.com/) (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/SettelUp-Fullstack/SettleUp-FullStack.git
cd SettleUp-FullStack
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

---

## 🔧 Environment Variables

### Backend — `backend/.env`

Create a `.env` file inside the `backend/` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/settleup?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
```

| Variable     | Description                                      |
|--------------|--------------------------------------------------|
| `PORT`       | Port the Express server listens on (default 3000)|
| `NODE_ENV`   | Environment — `development` or `production`      |
| `MONGO_URI`  | MongoDB connection string (Atlas or local)       |
| `JWT_SECRET` | Secret key for signing JWT tokens                |

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## ▶️ Running the Project

### Start the Backend

```bash
cd backend

# Development (with hot-reload via nodemon)
npm run dev

# Production
npm start
```

The backend server starts at: `http://localhost:3000`

---

### Start the Frontend

```bash
cd client

# Development server
npm start
```

The Angular app is available at: `http://localhost:4200`

---

## 📡 API Endpoints

All protected endpoints require the `Authorization: Bearer <token>` header.

### 🔑 Authentication — `/api/auth`

| Method | Endpoint             | Auth Required | Description              |
|--------|----------------------|:-------------:|--------------------------|
| POST   | `/api/auth/register` | ❌            | Register a new user      |
| POST   | `/api/auth/login`    | ❌            | Login and receive a token|

<details>
<summary>Register — Request Body</summary>

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```
</details>

<details>
<summary>Login — Request Body</summary>

```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```
</details>

---

### 👥 Groups — `/api/groups`

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/groups`                         | Get all groups for user        |
| POST   | `/api/groups`                         | Create a new group             |
| GET    | `/api/groups/:id`                     | Get a specific group           |
| PUT    | `/api/groups/:id`                     | Update a group                 |
| DELETE | `/api/groups/:id`                     | Delete a group                 |
| POST   | `/api/groups/:id/members`             | Add a member to a group        |
| DELETE | `/api/groups/:id/members/:memberId`   | Remove a member from a group   |
| GET    | `/api/groups/:id/expenses/summary`    | Get expense summary for group  |

---

### 💰 Expenses — `/api/expenses`

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/expenses`                 | Get all expenses for user          |
| POST   | `/api/expenses`                 | Create a new expense               |
| GET    | `/api/expenses/:id`             | Get a specific expense             |
| PUT    | `/api/expenses/:id`             | Update an expense                  |
| DELETE | `/api/expenses/:id`             | Delete an expense                  |
| GET    | `/api/expenses/group/:groupId`  | Get all expenses for a group       |
| GET    | `/api/expenses/summary/all`     | Get expenses summary               |

---

### ⚖️ Balances — `/api/balances`

| Method | Endpoint                         | Description                         |
|--------|----------------------------------|-------------------------------------|
| GET    | `/api/balances`                  | Get overall balances for current user |
| GET    | `/api/balances/group/:groupId`   | Get balances for a specific group   |
| GET    | `/api/balances/settlements`      | Get settlement suggestions          |

---

### 🤝 Settlements — `/api/settlements`

| Method | Endpoint                              | Description                        |
|--------|---------------------------------------|------------------------------------|
| GET    | `/api/settlements`                    | Get all settlements                |
| POST   | `/api/settlements`                    | Create a new settlement            |
| GET    | `/api/settlements/:id`                | Get a specific settlement          |
| PUT    | `/api/settlements/:id`                | Update a settlement                |
| PATCH  | `/api/settlements/:id/complete`       | Mark a settlement as complete      |
| DELETE | `/api/settlements/:id`                | Delete a settlement                |
| GET    | `/api/settlements/history/me`         | Get current user's history         |
| GET    | `/api/settlements/stats/summary`      | Get settlement statistics          |
| GET    | `/api/settlements/group/:groupId`     | Get settlements for a group        |

---

### 📊 Dashboard — `/api/dashboard`

| Method | Endpoint                | Description                        |
|--------|-------------------------|------------------------------------|
| GET    | `/api/dashboard/stats`  | Get dashboard statistics for user  |

---

## 🔮 Future Enhancements

- [ ] 📧 Email notifications when a new expense is added or a settlement is requested
- [ ] 💱 Multi-currency support with real-time exchange rates
- [ ] 📸 Receipt image upload for expenses
- [ ] 🔔 In-app push notifications
- [ ] 📊 Advanced analytics and spending charts
- [ ] 📱 Progressive Web App (PWA) support
- [ ] 🌙 Dark mode toggle
- [ ] 🔗 Share group invite links
- [ ] 🏦 Integration with payment gateways (UPI, PayPal, etc.)
- [ ] 🔄 Real-time updates using WebSockets

---

## 👩‍💻 Author

**Yashashri**

> Built with ❤️ as a full-stack MEAN application.

---

<div align="center">

⭐ If you found this project helpful, give it a star on [GitHub](https://github.com/SettelUp-Fullstack/SettleUp-FullStack)!

</div>

