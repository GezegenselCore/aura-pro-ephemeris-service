# Production-Ready Checklist

## ✅ Pre-Deployment Verification

### 1. Swiss Ephemeris Integration
- [x] `bodies.ts`: Real Swiss Ephemeris ID mapping (Chiron=15, Ceres=4, Pallas=5, Juno=6, Vesta=7)
- [x] `swephProvider.ts`: Multiple API patterns supported (calc_ut, swe_calc_ut, calc)
- [x] `swephProvider.ts`: Fallback for ayanamsa calculation (Lahiri)
- [x] Error handling: Partial results if one body fails

### 2. Ephemeris Files Management
- [ ] Ephemeris files uploaded to GCS bucket (`gs://aura-ephemeris/se/`)
  - Required: `seas_433.se1` (asteroid ephemeris)
  - Optional: `sepl_433.se1` (planetary base)
- [ ] GCS bucket accessible from Firebase Functions
- [ ] Files download to `/tmp/se/` on cold start
- [ ] `setEphePath` / `swe_set_ephe_path` called after download

### 3. Environment Variables
- [ ] `EPHEMERIS_BUCKET` set (default: `aura-ephemeris`)
- [ ] `EPHEMERIS_PREFIX` set (default: `se/`)
- [ ] `RATE_LIMIT_PER_DAY` set (default: `100`)
- [ ] `FUNCTION_REGION` set (default: `us-central1`)

### 4. Cache (Firestore)
- [x] Cache TTL: 3 days (optimal accuracy + cost)
- [x] Cache key: SHA-256 hash of `utcISO|zodiacSystem|bodiesSorted|wantSpeed`
- [x] Expired entries auto-deleted
- [ ] Firestore collection `proEphemerisCache` accessible

### 5. Rate Limiting
- [x] Rate limit: 100 requests/day per user (configurable)
- [x] Atomic transaction for counter increment
- [x] TTL: 2 days (auto-cleanup)
- [ ] Firestore collection `proRate` accessible

### 6. Authentication & Security
- [x] `requireAuth` middleware: Firebase Auth token required
- [x] Input validation: Zod schema
- [x] Error handling: Safe error messages (no internal details)
- [x] Rate limiting: Per-user daily limits

### 7. Testing
- [x] Unit tests: `functions/src/__tests__/getProEphemeris.test.ts`
- [ ] `npm test` passes
- [ ] Emulator test: `firebase emulators:start --only functions,firestore`
- [ ] Local call test: `node scripts/call-local.js`

### 8. Documentation
- [x] README.md: Complete setup instructions
- [x] README.md: License notice (AGPL-3.0)
- [x] README.md: GCS bucket structure
- [x] README.md: Environment variables
- [x] README.md: Deployment steps
- [x] DEPLOY.md: Deployment guide
- [x] LICENSE: AGPL-3.0

### 9. Build & Deploy
- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] TypeScript compilation: No errors
- [ ] Deploy command: `firebase deploy --only functions:getProEphemeris`
- [ ] Post-deployment: Function accessible via Firebase Console

### 10. Production Readiness
- [ ] Ephemeris files in GCS (required before first deploy)
- [ ] Environment variables set in Firebase
- [ ] Firestore security rules allow cache/rate limit collections
- [ ] First cold start: Ephemeris files download successfully
- [ ] Cache hit: Second call returns cached result
- [ ] Rate limit: 100+ requests trigger `resource-exhausted` error

## 🚨 Critical Before Production

1. **Ephemeris Files**: Must be uploaded to GCS before first deploy
2. **Environment Variables**: Set in Firebase Functions config
3. **Firestore Rules**: Allow read/write to `proEphemerisCache` and `proRate`
4. **Test First Call**: Verify ephemeris files download on cold start
5. **Monitor Logs**: Check for sweph API compatibility issues

## 📝 Notes

- **Cold Start**: First invocation downloads ephemeris files (~2-5 seconds)
- **Cache**: 3-day TTL balances accuracy (0.06-0.3° error) and cost efficiency
- **Rate Limit**: 100/day per user (configurable via `RATE_LIMIT_PER_DAY`)
- **Cost**: ~$0.40/month for 1000 active users (very low)

## 🔗 Resources

- [Swiss Ephemeris Documentation](https://www.astro.com/swisseph/swephinfo_e.htm)
- [Firebase Functions Pricing](https://firebase.google.com/pricing)
- [Firestore Pricing](https://firebase.google.com/pricing)
