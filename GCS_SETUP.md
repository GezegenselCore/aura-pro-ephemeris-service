# Google Cloud Storage Setup Guide

## 1. GCS Bucket Oluşturma/Kontrol

### Yöntem A: Google Cloud Console (Web UI)

1. **Google Cloud Console'a git:**
   - https://console.cloud.google.com/storage
   - Firebase projenizi seçin

2. **Bucket oluştur:**
   - "Create Bucket" butonuna tıklayın
   - **Name**: `aura-ephemeris`
   - **Location type**: Region
   - **Region**: `europe-west3` (veya mevcut Firebase region)
   - **Storage class**: Standard
   - **Access control**: Uniform
   - **Public access**: **OFF** (sadece service account erişecek)
   - "Create" tıklayın

### Yöntem B: gcloud CLI

```bash
# Login
gcloud auth login

# Project seç
gcloud config set project YOUR_FIREBASE_PROJECT_ID

# Bucket oluştur
gsutil mb -p YOUR_FIREBASE_PROJECT_ID -c STANDARD -l europe-west3 gs://aura-ephemeris
```

## 2. Klasör Yapısı Oluşturma

Bucket içinde `sweph/` klasörünü oluşturun:

```bash
# gsutil ile
gsutil mkdir gs://aura-ephemeris/sweph/

# Veya web UI'da direkt dosya yüklerken path belirtin
```

## 3. Ephemeris Dosyalarını İndirme

Swiss Ephemeris dosyalarını indirin:

### Kaynak:
- **Swiss Ephemeris Website**: https://www.astro.com/swisseph/swephinfo_e.htm
- **Download**: https://www.astro.com/ftp/swisseph/src/

### Gerekli Dosyalar:
1. **seas_433.se1** - Asteroid ephemeris (Ceres, Pallas, Juno, Vesta için)
2. **sepl_433.se1** - Planetary base ephemeris (coordinate transforms için)

### Alternatif Kaynak:
- Swiss Ephemeris dosyaları genellikle `sweph` npm paketi ile birlikte gelir
- Veya manuel olarak Astrodienst'ten indirilebilir

## 4. Dosyaları GCS'ye Yükleme

### Yöntem A: gsutil (CLI)

```bash
# Dosyaları yükle
gsutil cp seas_433.se1 gs://aura-ephemeris/sweph/
gsutil cp sepl_433.se1 gs://aura-ephemeris/sweph/

# Doğrulama
gsutil ls gs://aura-ephemeris/sweph/
```

### Yöntem B: Google Cloud Console (Web UI)

1. Bucket'a git: `gs://aura-ephemeris`
2. "Create Folder" → `sweph`
3. `sweph/` klasörüne gir
4. "Upload Files" → `seas_433.se1` ve `sepl_433.se1` seç
5. Upload

### Yöntem C: Firebase Console

1. Firebase Console → Storage
2. `aura-ephemeris` bucket'ı seç
3. `sweph/` klasörü oluştur
4. Dosyaları yükle

## 5. Service Account Permissions

Firebase Functions'ın bucket'a erişebilmesi için:

### Otomatik (Firebase Functions):
- Firebase Functions otomatik olarak `PROJECT_ID@appspot.gserviceaccount.com` service account kullanır
- Bu account varsayılan olarak Storage'a erişebilir

### Manuel Kontrol:
```bash
# Service account'a Storage Object Viewer + Creator rolü ver
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

## 6. Doğrulama

```bash
# Dosyaları listele
gsutil ls -lh gs://aura-ephemeris/sweph/

# Beklenen çıktı:
# gs://aura-ephemeris/sweph/seas_433.se1
# gs://aura-ephemeris/sweph/sepl_433.se1

# Dosya boyutlarını kontrol et (seas_433.se1 genellikle ~10-50MB)
gsutil du -sh gs://aura-ephemeris/sweph/*
```

## 7. Bucket Yapısı (Final)

```
gs://aura-ephemeris/
└── sweph/
    ├── seas_433.se1  (asteroid ephemeris)
    └── sepl_433.se1  (planetary base)
```

## Notlar

- **Public Access**: KAPALI (sadece service account erişecek)
- **Region**: `europe-west3` veya Firebase Functions region'ı ile aynı
- **Storage Class**: Standard (düşük maliyet, yeterli performans)
- **Lifecycle**: Gerekirse eski dosyaları otomatik silmek için policy eklenebilir
