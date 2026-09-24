# OpenTaskit Backend - Deployment Guide (VPS)

This guide documents the setup, deployment, updating, and maintenance of the **OpenTaskit NestJS Backend** on the production VPS.

---

## 1. Server & Deployment Overview

| Property | Details |
|---|---|
| **Server IP** | `206.162.244.11` |
| **SSH Port** | `22` |
| **SSH User** | `anik` |
| **Backend Port** | `5000` *(Port 3000 is reserved on this server)* |
| **App Path on VPS** | `/home/anik/opentaskit/opentaskit-backend` |
| **Process Manager** | PM2 (`opentaskit-backend`) |
| **Base API URL** | `http://206.162.244.11:5000/api/v1` |
| **Swagger Docs** | `http://206.162.244.11:5000/api/docs` |

---

## 2. Connecting to the Server

Open PowerShell or your preferred terminal:

```bash
ssh anik@206.162.244.11 -p 22
```

Navigate to the backend directory:

```bash
cd ~/opentaskit/opentaskit-backend
```

---

## 3. Environment Variables Configuration (`.env`)

The `.env` file must be located in `/home/anik/opentaskit/opentaskit-backend/.env`.

### Key Configuration
```env
# Application
PORT=5000
NODE_ENV=production

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/<db_name>?schema=public"

# Authentication Secrets
JWT_ACCESS_SECRET="<your-access-secret>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<your-refresh-secret>"

# Super Admin Seed Credentials
ADMIN_EMAIL="admin@opentaskit.com"
ADMIN_PASSWORD="<your-secure-password>"

# Mailer (SMTP)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="<smtp-user>"
SMTP_PASS="<smtp-password>"
SMTP_FROM="OpenTaskit <noreply@opentaskit.com>"

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME="<cloud_name>"
CLOUDINARY_API_KEY="<api_key>"
CLOUDINARY_API_SECRET="<api_secret>"

# SMS Gateway (SMSLenz)
SMSLENZ_USER_ID="<user_id>"
SMSLENZ_API_KEY="<api_key>"
SMSLENZ_SENDER_ID="SMSlenzDEMO"
SMS_SANDBOX_MODE="true"
```

To edit the file on the VPS:
```bash
nano .env
```
*(Press `Ctrl + O`, `Enter` to save, then `Ctrl + X` to exit).*

---

## 4. Initial Setup & Build Steps

Run these commands inside the `opentaskit-backend` directory:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Synchronize database schema
npx prisma db push

# 4. (Optional) Seed the database with initial admin and reference data
npm run db:seed

# 5. Compile TypeScript into JavaScript
npm run build
```

> [!NOTE]
> Because of project sub-structures, NestJS compiles the entry point to **`dist/src/main.js`** (not `dist/main.js`).

---

## 5. Starting & Managing with PM2

### Start the Service
```bash
pm2 start dist/src/main.js --name "opentaskit-backend"
```

### Save Process State
Save the current PM2 process list so it can be restored:
```bash
pm2 save
```

*(If the VPS is rebooted, you can restore your processes anytime by running `pm2 resurrect`).*

---

## 6. Updating the Deployment (Future Changes)

Whenever you push new code to Git and want to apply updates on the VPS:

```bash
# 1. Navigate to the project directory
cd ~/opentaskit/opentaskit-backend

# 2. Pull the latest code
git pull origin main

# 3. Install new dependencies (if package.json changed)
npm install

# 4. Regenerate Prisma & apply database changes (if schema.prisma changed)
npx prisma generate
npx prisma db push

# 5. Rebuild the application
npm run build

# 6. Restart PM2 with zero-downtime or fresh reload
pm2 restart opentaskit-backend --update-env

# 7. Check logs to confirm startup
pm2 logs opentaskit-backend --lines 50
```

---

## 7. Useful PM2 Commands

| Command | Description |
|---|---|
| `pm2 status` | Check status, CPU, memory, and uptime |
| `pm2 logs opentaskit-backend` | Stream live server output & error logs |
| `pm2 logs opentaskit-backend --lines 100` | View the last 100 lines of logs |
| `pm2 restart opentaskit-backend` | Restart the application process |
| `pm2 stop opentaskit-backend` | Stop the application |
| `pm2 save` | Save the current list of running processes |
| `pm2 resurrect` | Restore saved processes after a reboot |

---

## 8. Troubleshooting Common Issues

### 1. `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause**: Port 3000 is used by another service on the VPS.
- **Solution**: Keep `PORT=5000` in `.env` and restart with `pm2 restart opentaskit-backend --update-env`.

### 2. `[PM2][ERROR] Script not found: .../dist/main.js`
- **Cause**: Entry point path mismatch or missing build.
- **Solution**: Make sure you ran `npm run build`, and use `dist/src/main.js` as the target file:
  ```bash
  pm2 start dist/src/main.js --name "opentaskit-backend"
  ```

### 3. Prisma Client Out of Sync
- **Cause**: Schema changes were made without regenerating the client.
- **Solution**:
  ```bash
  npx prisma generate
  npm run build
  pm2 restart opentaskit-backend
  ```
