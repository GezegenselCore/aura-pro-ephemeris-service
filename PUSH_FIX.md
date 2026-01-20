# Push Fix - 403 Permission Denied

## Problem
```
remote: Permission to GezegenselCore/aura-pro-ephemeris-service.git denied to cprkdr.
fatal: unable to access 'https://github.com/GezegenselCore/aura-pro-ephemeris-service.git/': The requested URL returned error: 403
```

## Solution: Clear Old Credentials + Use Personal Access Token

### Step 1: Clear Old GitHub Credentials

**Option A: Windows Credential Manager (GUI)**
1. Press `Win + R`, type `control /name Microsoft.CredentialManager`
2. Go to **"Windows Credentials"**
3. Find entries starting with `git:https://github.com`
4. Delete all GitHub-related entries

**Option B: Command Line**
```powershell
# List GitHub credentials
cmdkey /list | Select-String -Pattern "github"

# Delete specific credential (replace with actual target name)
cmdkey /delete:git:https://github.com
```

### Step 2: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note**: `aura-pro-ephemeris-service-push`
   - **Expiration**: 90 days
   - **Scopes**: Check **`repo`** (Full control)
4. Click **"Generate token"**
5. **COPY THE TOKEN** (starts with `ghp_`)

### Step 3: Push with Token

```powershell
cd D:\GezegenselGames\Aura\aura-pro-ephemeris-service
git push -u origin main
```

When prompted:
- **Username**: `gezegenseltr`
- **Password**: **Paste the Personal Access Token** (NOT your GitHub password)

### Alternative: Use Token in URL (One-time)

```powershell
cd D:\GezegenselGames\Aura\aura-pro-ephemeris-service
git remote set-url origin https://gezegenseltr:YOUR_TOKEN@github.com/GezegenselCore/aura-pro-ephemeris-service.git
git push -u origin main
```

**⚠️ Warning**: This stores token in git config. Remove it after push:
```powershell
git remote set-url origin https://github.com/GezegenselCore/aura-pro-ephemeris-service.git
```

## Verify Push Success

After successful push:
- Check: https://github.com/GezegenselCore/aura-pro-ephemeris-service
- README.md should be visible
- LICENSE file should be visible
- All source files should be present
