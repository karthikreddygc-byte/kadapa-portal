# Kadapa Smart District Portal — Deployment Guide

This guide covers how to deploy both the **Frontend** and the **Node.js/MongoDB Backend** to the internet.

---

## 🚀 Option A: Modern Full-Stack Deployment (Recommended)
This is the easiest way to get your live URL working with a database.

### 1. Setup MongoDB Atlas (Cloud Database)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Create a **Free Cluster (M0)**.
3.  Go to **Database Access** → Add New Database User (Set username/password).
4.  Go to **Network Access** → Add IP Address → Select **Allow Access from Anywhere** (0.0.0.0/0).
5.  Go to **Clusters** → **Connect** → **Drivers** → Copy your **Connection String**:
    `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

### 2. Push Code to GitHub
Hosting services need your code on GitHub to deploy automatically.
1.  Initialize Git:
    ```powershell
    git init
    git add .
    git commit -m "Initial commit: Kadapa Portal v1.0"
    ```
2.  Create a new repository on [GitHub](https://github.com/new).
3.  Link and Push:
    ```powershell
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    git branch -M main
    git push -u origin main
    ```

### 3. Deploy on Render
1.  Sign up at [Render.com](https://render.com).
2.  Click **New +** → **Web Service**.
3.  Connect your GitHub repository.
4.  Configure:
    - **Name**: `kadapa-portal`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  Click **Advanced** → **Add Environment Variable**:
    - `MONGO_URI` = (Your MongoDB connection string from Step 1)
6.  Click **Create Web Service**. Render will give you a live URL like `https://kadapa-portal.onrender.com`.

---

## 🌩️ Option B: Firebase (Serverless Approach)
Best if you want to use Google's infrastructure and scale automatically.

### Step 1: Initialize Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init
```
- Select **Hosting** and **Functions** (if using the backend).

### Step 2: Configure Environment
- Set your MongoDB URI in Firebase functions config.
- Point hosting to your static files.

---

## 🖥️ Option C: Run Locally (Production Mode)
To run the full app on your own computer or a local server:

1.  **Install Node.js**: Download from [nodejs.org](https://nodejs.org).
2.  **Environment Variables**:
    - Create a `.env` file in the root.
    - Add: `MONGO_URI=mongodb://localhost:27017/kadapadb`
3.  **Start for Production**:
    ```bash
    npm install
    npm start
    ```
4.  **Access**: View at `http://localhost:3000`.

---

## 🔒 Security Checklist Before Going Live

- [ ] **Secrets**: Ensure `.env` is in `.gitignore` (Done).
- [ ] **Passwords**: Change admin passwords in `login.html` script area if necessary.
- [ ] **HTTPS**: Render/Firebase handle this automatically.
- [ ] **CORS**: Current CORS in `server.js` is permissive; restrict to your domain once live.
- [ ] **NoIndex**: Remove `<meta name="robots" content="noindex">` from public pages once ready for Google.

---

*Last Updated: March 2026 — Kadapa Smart District Technical Team*
