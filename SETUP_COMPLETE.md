# Setup Complete Checklist

## ✅ Adım 1: GCS Bucket

- [ ] Bucket oluşturuldu: `gs://aura-ephemeris`
- [ ] Region: `europe-west3` (veya Firebase region)
- [ ] Public access: **KAPALI**
- [ ] Service account erişimi: **AÇIK** (otomatik)

**Komut:**
```bash
gsutil ls gs://aura-ephemeris
```

## ✅ Adım 2: Klasör Yapısı

- [ ] `sweph/` klasörü oluşturuldu

**Komut:**
```bash
gsutil ls gs://aura-ephemeris/sweph/
```

## ✅ Adım 3: Ephemeris Dosyaları

- [ ] `seas_433.se1` yüklendi → `gs://aura-ephemeris/sweph/seas_433.se1`
- [ ] `sepl_433.se1` yüklendi → `gs://aura-ephemeris/sweph/sepl_433.se1`

**Doğrulama:**
```bash
gsutil ls -lh gs://aura-ephemeris/sweph/
# Beklenen:
# gs://aura-ephemeris/sweph/seas_433.se1
# gs://aura-ephemeris/sweph/sepl_433.se1
```

## ✅ Adım 4: Firebase Environment Variables

### Yöntem: Firebase Console (Önerilen)

1. Firebase Console → Functions → `getProEphemeris`
2. Configuration → Environment variables
3. Şu değişkenleri ekle:

| Key | Value |
|-----|-------|
| `EPHEMERIS_BUCKET` | `aura-ephemeris` |
| `EPHEMERIS_PREFIX` | `sweph/` |
| `RATE_LIMIT_PER_DAY` | `100` |
| `FUNCTION_REGION` | `us-central1` (veya `europe-west3`) |

**Doğrulama:**
```bash
firebase functions:config:get
# Veya Firebase Console'dan kontrol et
```

## ✅ Adım 5: Firestore Security Rules

- [ ] `firestore.rules` dosyasına eklenmiş
- [ ] Deploy edilmiş: `firebase deploy --only firestore:rules`

**Doğrulama:**
```bash
# Rules dosyasını kontrol et
cat firestore.rules | grep -A 5 "proEphemerisCache"
```

## ✅ Adım 6: Final Test

### Local Emulator Test:

```bash
cd functions
firebase emulators:start --only functions,firestore

# Başka terminal:
node scripts/call-local.js
```

### Production Deploy:

```bash
cd functions
npm run build
firebase deploy --only functions:getProEphemeris
```

### Post-Deploy Test:

```bash
# Firebase Console → Functions → getProEphemeris → Logs
# İlk çağrıda ephemeris dosyaları indirilmeli
# İkinci çağrıda cache hit olmalı
```

## 📋 Özet

| Bileşen | Durum | Yol/Değer |
|---------|-------|-----------|
| GCS Bucket | ⬜ | `gs://aura-ephemeris` |
| Ephemeris Files | ⬜ | `sweph/seas_433.se1`, `sweph/sepl_433.se1` |
| Env Variables | ⬜ | Firebase Console'da set edilmeli |
| Firestore Rules | ⬜ | `firestore.rules` içinde |
| Deploy | ⬜ | `firebase deploy --only functions:getProEphemeris` |

## 🚨 Önemli Notlar

1. **Ephemeris dosyaları** Swiss Ephemeris'ten indirilmeli:
   - https://www.astro.com/swisseph/swephinfo_e.htm
   - Veya `sweph` npm paketi ile birlikte gelebilir

2. **Service Account**: Firebase Functions otomatik olarak `PROJECT_ID@appspot.gserviceaccount.com` kullanır
   - Bu account varsayılan olarak Storage'a erişebilir
   - Manuel permission gerekmez (genellikle)

3. **Cold Start**: İlk çağrıda ephemeris dosyaları indirilir (~2-5 saniye)
   - Sonraki çağrılar cache'den gelir (hızlı)

4. **Maliyet**: 
   - Storage: ~$0.02/GB/ay (dosyalar ~10-50MB)
   - Functions: Sadece çağrı yapıldığında ücret
