# Farrukh Consultancy — Immigration CRM v2.1
## Full-Stack Immigration Management System

**Built for:** Farrukh Nadeem | Farrukh Consultancy | +92 309 6136 080  
**Stack:** React 18 + Vite + Firebase (Firestore + Storage + Auth) + Vercel  
**Cost:** $0/month on free tiers  

---

## ✅ BUILD STATUS: VERIFIED PASSING

```
vite v4.5.14 — production build
✓ 1517 modules transformed
✓ 0 errors  ✓ 0 warnings
Built in 14.61s
```

---

## 🚀 COMPLETE DEPLOYMENT GUIDE

### STEP 1 — Create Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project** → Name it: `farrukh-immigration-crm`
3. Disable Google Analytics (not needed) → **Create project**

### STEP 2 — Enable Firebase Services

#### Firestore Database
1. Sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Production mode** → Select region (e.g., `asia-south1` for Pakistan)
4. Click **Enable**

**Paste these Security Rules** (Firestore → Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Click **Publish**.

#### Firebase Storage
1. Sidebar → **Build → Storage**
2. Click **Get started** → **Production mode** → **Done**

**Paste these Storage Rules** (Storage → Rules tab):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /clients/{clientId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Click **Publish**.

#### Authentication
1. Sidebar → **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method** → Enable **Anonymous** → **Save**

### STEP 3 — Get Firebase Config

1. **Project Settings** (gear icon, top-left) → **General** tab
2. Scroll to **Your apps** → Click **</>** (Web app) icon
3. App nickname: `farrukh-crm-web` → **Register app**
4. Copy the `firebaseConfig` object — you'll need the 6 values below

### STEP 4 — Push to GitHub

```bash
# Option A: GitHub Desktop (easier)
# 1. Download GitHub Desktop from desktop.github.com
# 2. File → Add Local Repository → select this farrukh-crm folder
# 3. Publish repository (set to Private)

# Option B: Command line
git init
git add .
git commit -m "Farrukh Consultancy CRM v2.1 — initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/farrukh-crm.git
git branch -M main
git push -u origin main
```

### STEP 5 — Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up/in with GitHub
2. Click **Add New → Project**
3. **Import** your `farrukh-crm` repository
4. Framework Preset: **Vite** (auto-detected)
5. **Before clicking Deploy** — add Environment Variables:

| Variable Name                       | Value (from Firebase config) |
|-------------------------------------|------------------------------|
| `VITE_FIREBASE_API_KEY`             | `apiKey` value               |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `authDomain` value           |
| `VITE_FIREBASE_PROJECT_ID`          | `projectId` value            |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `storageBucket` value        |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` value    |
| `VITE_FIREBASE_APP_ID`              | `appId` value                |

6. Click **Deploy** — your app goes live in ~2 minutes
7. Your URL: `https://farrukh-crm.vercel.app` (or custom domain)

### STEP 6 — First Login

Open your deployed URL and log in:

| Mode          | Credentials                    |
|---------------|--------------------------------|
| Master Access | Code: **`7586373`**            |
| Staff Login   | Phone + PIN (auto-generated)   |

---

## 🔑 MASTER ACCESS CODE

```
7586373
```
This is hardcoded in the app. To change it, edit `MASTER_CODE` in `src/App.jsx` line 64, then redeploy.

---

## ✨ FEATURE SUMMARY

| Module           | Features                                                                    |
|------------------|-----------------------------------------------------------------------------|
| **Dashboard**    | Live stats (clients, active cases, approvals, pending embassy)              |
| **Clients**      | Add/edit/search by name·CNIC·passport, full profile, soft-delete, recover   |
| **Cases**        | 38 visa categories, 10 status stages, priority flags, case history          |
| **Documents**    | Upload PDF/JPG/DOCX/XLSX, 21 type categories, Firebase Storage, preview     |
| **Reports**      | Client report + internal office template, paste AI content, print           |
| **WhatsApp**     | Auto-generated update messages, open directly in WhatsApp                   |
| **Timeline**     | Timestamped case notes, delete notes (admin only)                           |
| **Staff**        | Add staff, auto-PIN, suspend/reinstate, terminate, force-logout, reset PIN  |
| **Activity Log** | Every action logged, filterable by staff and action type                    |
| **Archive**      | Soft-delete → recover flow; permanent delete (admin, double-confirmed)      |

---

## 🔄 UPDATING THE APP

After code changes:
```bash
git add .
git commit -m "Update: description of change"
git push
```
Vercel auto-deploys on every push to `main`. No manual steps needed.

---

## 🤝 AI WORKFLOW (Claude.ai Integration)

Since the deployed app has no AI key, use this hybrid workflow:

1. Open **Claude.ai** with your immigration skills loaded
2. Use `fc-immigration-lawyer` skill for full case analysis
3. Paste the client's profile from the CRM into Claude
4. Copy Claude's output (strategy, report, WhatsApp message)
5. In CRM → Client → **Reports tab** → Generate Report → Paste → Save
6. In CRM → Client → **WhatsApp tab** → Edit template → Send

---

## 📁 PROJECT STRUCTURE

```
farrukh-crm/
├── src/
│   ├── App.jsx          ← Full CRM (2,239 lines — all components)
│   ├── main.jsx         ← React entry point
│   └── index.css        ← Tailwind + custom styles
├── index.html           ← Vite HTML entry
├── vite.config.js       ← Build config with code-splitting
├── tailwind.config.js   ← Tailwind setup
├── postcss.config.js    ← PostCSS / autoprefixer
├── .eslintrc.cjs        ← ESLint rules
├── vercel.json          ← Vercel SPA routing + security headers
├── package.json         ← Dependencies
├── .env.example         ← Env var template (copy to .env)
└── .gitignore           ← Excludes node_modules, .env, dist
```

---

## 🛠️ LOCAL DEVELOPMENT

```bash
# 1. Copy env template
cp .env.example .env
# 2. Fill in your Firebase values in .env
# 3. Install & run
npm install
npm run dev
# Opens at http://localhost:3000
```

---

*Farrukh Consultancy | farrukhimmigration@gmail.com | +92 309 6136 080 | Lahore, Pakistan*
