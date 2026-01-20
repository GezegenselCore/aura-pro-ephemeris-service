# Firestore Security Rules for PRO Ephemeris Service

## Gerekli Koleksiyonlar

Servis şu 2 koleksiyonu kullanır:
1. `proEphemerisCache` - Cache için (30 gün TTL)
2. `proRate` - Rate limiting için (2 gün TTL)

## Güvenlik Kuralı

Bu koleksiyonlar **sadece Firebase Functions (server-side)** tarafından yazılmalı.
**Client-side (AURA app)** erişimi **KAPALI** olmalı.

## Firestore Rules

`firestore.rules` dosyasına ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // PRO Ephemeris Cache - Sadece server-side erişim
    match /proEphemerisCache/{docId} {
      // Client'tan erişim KAPALI
      allow read, write: if false;
      
      // Not: Firebase Functions service account otomatik erişebilir
      // (server-side SDK kullanır, rules'ı bypass eder)
    }
    
    // PRO Rate Limit - Sadece server-side erişim
    match /proRate/{docId} {
      // Client'tan erişim KAPALI
      allow read, write: if false;
      
      // Not: Firebase Functions service account otomatik erişebilir
    }
    
    // Diğer koleksiyonlar (mevcut rules'larınız)
    // ... existing rules ...
  }
}
```

## Deploy Rules

```bash
firebase deploy --only firestore:rules
```

## Doğrulama

### Test (Client-side erişim engellendi mi?):

```javascript
// AURA app içinde (bu BAŞARISIZ olmalı):
import { getFirestore, collection, getDoc } from '@react-native-firebase/firestore';

const db = getFirestore();
const cacheRef = collection(db, 'proEphemerisCache');
const doc = await getDoc(cacheRef.doc('test-key'));

// Beklenen: permission-denied hatası
```

### Server-side (Functions) erişim:

```typescript
// Firebase Functions içinde (bu BAŞARILI olmalı):
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const cacheRef = db.collection('proEphemerisCache').doc('test-key');
await cacheRef.set({ test: 'data' }); // ✅ Çalışır (server-side)
```

## Notlar

- **Firebase Admin SDK**: Rules'ı bypass eder (server-side)
- **Client SDK**: Rules'a tabidir (client-side)
- **Security**: Client'tan cache/rate limit manipülasyonu engellenmiş olur
