# Firebase Environment Variables Setup

## Yöntem 1: Firebase Functions Config (Önerilen)

### Komut:

```bash
cd aura-pro-ephemeris-service
firebase functions:config:set \
  ephemeris.bucket="aura-ephemeris" \
  ephemeris.prefix="sweph/" \
  cache.ttl_days="3" \
  ratelimit.per_day="100"
```

### Kullanım (Kod içinde):

```typescript
// functions/src/ephemeris/swephProvider.ts
const BUCKET_NAME = functions.config().ephemeris?.bucket || 'aura-ephemeris';
const EPHEMERIS_PREFIX = functions.config().ephemeris?.prefix || 'sweph/';
```

**Not**: Bu yöntem için kodda `functions.config()` kullanımı gerekir.

## Yöntem 2: Environment Variables (Firebase Functions v2)

### Firebase Console'dan:

1. Firebase Console → Functions → `getProEphemeris`
2. "Configuration" sekmesi
3. "Environment variables" bölümü
4. Şu değişkenleri ekle:

| Key | Value |
|-----|-------|
| `EPHEMERIS_BUCKET` | `aura-ephemeris` |
| `EPHEMERIS_PREFIX` | `sweph/` |
| `RATE_LIMIT_PER_DAY` | `100` |
| `FUNCTION_REGION` | `us-central1` (veya `europe-west3`) |

### Kod içinde kullanım:

```typescript
// Zaten mevcut kodda var:
const BUCKET_NAME = process.env.EPHEMERIS_BUCKET || 'aura-ephemeris';
const EPHEMERIS_PREFIX = process.env.EPHEMERIS_PREFIX || 'sweph/';
```

## Yöntem 3: .env.production (Local Development)

`functions/.env.production` dosyası oluştur:

```bash
EPHEMERIS_BUCKET=aura-ephemeris
EPHEMERIS_PREFIX=sweph/
RATE_LIMIT_PER_DAY=100
FUNCTION_REGION=us-central1
```

**Not**: `.env.production` dosyasını `.gitignore`'a ekleyin.

## Yöntem 4: firebase.json (Runtime Config)

`firebase.json` içine ekle:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "environmentVariables": {
      "EPHEMERIS_BUCKET": "aura-ephemeris",
      "EPHEMERIS_PREFIX": "sweph/",
      "RATE_LIMIT_PER_DAY": "100",
      "FUNCTION_REGION": "us-central1"
    }
  }
}
```

## Doğrulama

### Local Test:

```bash
cd functions
node -e "console.log(process.env.EPHEMERIS_BUCKET)"
```

### Production'da:

```bash
firebase functions:config:get
```

Veya Firebase Console → Functions → Configuration → Environment variables

## Önerilen Yöntem

**Firebase Functions v2** için **Yöntem 2** (Environment Variables) önerilir:
- Daha modern
- Firebase Console'dan kolay yönetim
- Kod zaten `process.env` kullanıyor
