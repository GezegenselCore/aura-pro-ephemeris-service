# GitHub Push Instructions (403 Error Fix)

## Problem
```
remote: Permission to GezegenselCore/aura-pro-ephemeris-service.git denied to cprkdr.
fatal: unable to access 'https://github.com/GezegenselCore/aura-pro-ephemeris-service.git/': The requested URL returned error: 403
```

## Solution: Use Personal Access Token

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note**: `aura-pro-ephemeris-service-push`
   - **Expiration**: Choose (90 days recommended)
   - **Scopes**: Check **`repo`** (Full control of private repositories)
4. Click **"Generate token"**
5. **COPY THE TOKEN** - You won't see it again!

### Step 2: Push Using Token

```powershell
cd D:\GezegenselGames\Aura\aura-pro-ephemeris-service
git push -u origin main
```

When prompted:
- **Username**: `cprkdr` (or your GitHub username)
- **Password**: **Paste the Personal Access Token** (NOT your GitHub password)

### Alternative: Use SSH

If you have SSH keys set up:

```powershell
cd D:\GezegenselGames\Aura\aura-pro-ephemeris-service
git remote set-url origin git@github.com:GezegenselCore/aura-pro-ephemeris-service.git
git push -u origin main
```

### Check Organization Membership

If you're still getting 403:
1. Verify you're a member: https://github.com/orgs/GezegenselCore/people
2. If not a member, ask organization owner to add you
3. Or ensure you created the repo (creators have push access)

## Quick Test

After push, verify:
- https://github.com/GezegenselCore/aura-pro-ephemeris-service
- README.md should be visible
- LICENSE file should be visible
- All source files should be present
