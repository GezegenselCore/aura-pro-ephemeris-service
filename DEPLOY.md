# Deployment Guide

## Prerequisites

1. **Firebase CLI**: `npm install -g firebase-tools`
2. **Firebase Project**: Create or use existing project
3. **Google Cloud Storage**: Bucket for ephemeris files
4. **Node.js 20+**: Required for Functions runtime

## Setup Steps

### 1. Firebase Project Configuration

```bash
# Login to Firebase
firebase login

# Initialize (if not already done)
firebase init functions

# Select existing project or create new
```

### 2. Environment Variables

Set environment variables in Firebase Functions:

```bash
firebase functions:config:set \
  ephemeris.bucket="aura-ephemeris" \
  ephemeris.prefix="se/" \
  rate_limit.per_day="100"
```

Or use `.env` file for local development (see `.env.example`).

### 3. Google Cloud Storage Setup

```bash
# Create bucket
gsutil mb gs://aura-ephemeris

# Upload ephemeris files
# Download Swiss Ephemeris files and upload to bucket
gsutil cp seas_433.se1 gs://aura-ephemeris/se/
# Add other required files...
```

### 4. Firestore Security Rules

Add rules for cache and rate limit collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PRO Ephemeris Cache (public read/write for authenticated users)
    match /proEphemerisCache/{cacheKey} {
      allow read, write: if request.auth != null;
    }
    
    // PRO Rate Limit (user-specific)
    match /proRate/{docId} {
      allow read, write: if request.auth != null && 
        resource == null || resource.data.uid == request.auth.uid;
    }
  }
}
```

### 5. Build and Deploy

```bash
cd functions
npm install
npm run build
cd ..

# Deploy function
firebase deploy --only functions:getProEphemeris

# Or deploy all functions
firebase deploy --only functions
```

### 6. Verify Deployment

```bash
# Check function logs
firebase functions:log --only getProEphemeris

# Test with Firebase CLI
firebase functions:shell
# Then call: getProEphemeris({...})
```

## Local Testing

### Start Emulators

```bash
firebase emulators:start --only functions,firestore
```

### Test Script

```bash
# Edit scripts/call-local.js with your ID token
node scripts/call-local.js
```

## Troubleshooting

### Ephemeris Files Not Found

- Verify GCS bucket exists and files are uploaded
- Check `EPHEMERIS_BUCKET` and `EPHEMERIS_PREFIX` env vars
- Check function logs for download errors

### Rate Limit Issues

- Verify Firestore rules allow writes to `proRate` collection
- Check `RATE_LIMIT_PER_DAY` env var

### Auth Errors

- Ensure Firebase Auth is enabled in project
- Verify client sends valid ID token
- Check function logs for auth context

## Production Checklist

- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] GCS bucket created and ephemeris files uploaded
- [ ] Firestore security rules updated
- [ ] Function deployed and tested
- [ ] Rate limits configured
- [ ] Monitoring/alerts set up (optional)
