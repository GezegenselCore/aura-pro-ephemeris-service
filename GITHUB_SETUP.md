# GitHub Repository Setup Instructions

## A) GitHub Repo Oluşturma (ORG altına)

### 1. GitHub Web Interface

1. Go to: https://github.com/organizations/gezegenselgames (or navigate to GezegenselCore team)
2. Click **"New repository"** button
3. Fill in:
   - **Repository name**: `aura-pro-ephemeris-service`
   - **Description**: `AURA PRO Ephemeris Service - Swiss Ephemeris based cloud service for Chiron + asteroids (AGPL-3.0)`
   - **Owner**: Select **`gezegenselgames/gezegenselcore`** (or appropriate team)
   - **Visibility**: **Public** (required for AGPL-3.0 compliance)
   - **Initialize repository**: **DO NOT CHECK** any boxes (README, .gitignore, license)
     - We already have these files locally
4. Click **"Create repository"**

### 2. Verify Repo URL

After creation, verify the URL is:
```
https://github.com/gezegenselgames/aura-pro-ephemeris-service
```
(Or if created under GezegenselCore team: `https://github.com/gezegenselgames/gezegenselcore/aura-pro-ephemeris-service`)

## B) Push Local Code to GitHub

After creating the repo on GitHub, run these commands locally:

### Option 1: Using Personal Access Token (Recommended)

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `aura-pro-ephemeris-service-push`
   - Scopes: Check `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using token:**
   ```bash
   cd aura-pro-ephemeris-service
   git push -u origin main
   ```
   - Username: `gezegenseltr` (your GitHub username)
   - Password: **Paste the Personal Access Token** (not your GitHub password)

### Option 2: Using SSH (Alternative)

1. **Set SSH remote:**
   ```bash
   cd aura-pro-ephemeris-service
   git remote set-url origin git@github.com:GezegenselCore/aura-pro-ephemeris-service.git
   ```

2. **Push:**
   ```bash
   git push -u origin main
   ```

### Option 3: Fix Organization Permissions

If you're a member of GezegenselGames/GezegenselCore organization:
1. Go to: https://github.com/organizations/gezegenselgames/settings/members
2. Ensure your account (`gezegenseltr`) has **Write** or **Admin** permission
3. If not, ask organization owner to grant you access

### Troubleshooting 403 Error

If you still get `403 Permission denied`:
- **Check:** Are you a member of `gezegenselgames` organization?
- **Check:** Does the repo exist? Verify the actual repo URL
- **Try:** Use Personal Access Token (Option 1) - this usually works even without org membership if you created the repo

## C) Verify Push Success

After pushing, check:
- ✅ README.md is visible on GitHub
- ✅ LICENSE file is visible
- ✅ `functions/` directory structure is complete
- ✅ `scripts/` directory exists
- ✅ `.gitignore` is present

## D) Post-Push Checklist

- [ ] Repo is PUBLIC
- [ ] README.md renders correctly
- [ ] LICENSE (AGPL-3.0) is visible
- [ ] All source files are present
- [ ] `.gitignore` excludes `node_modules/`, `.env`, etc.
