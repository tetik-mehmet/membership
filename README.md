# Üyelik Yönetim Sistemi

Modern, JWT tabanlı üyelik yönetim sistemi. Next.js, MongoDB ve Tailwind CSS ile geliştirilmiştir.

## Özellikler

- ✅ JWT tabanlı authentication
- ✅ Çoklu admin desteği
- ✅ Üye yönetimi (CRUD)
- ✅ Üyelik paketleri yönetimi
- ✅ Üyelik atama ve yenileme
- ✅ Responsive admin dashboard
- ✅ Vercel deploy desteği
- ✅ MongoDB Atlas uyumlu

## Teknolojiler

- **Framework:** Next.js 16 (App Router)
- **Veritabanı:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + HTTP-only cookies
- **UI:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun:

```env
MONGODB_URI=mongodb://localhost:27017/membership_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
NODE_ENV=development
```

### 3. MongoDB

**Local MongoDB:**
```bash
mongod
```

**Veya MongoDB Atlas kullanın:**
- MongoDB Atlas hesabı oluşturun
- Cluster oluşturun
- Connection string'i `.env.local` dosyasına ekleyin

### 4. Seed Database

İlk admin kullanıcısı ve örnek paketleri oluşturun:

```bash
npm run seed
```

Bu komut şunları oluşturur:
- Admin kullanıcısı (username: `admin`, password: `admin123`)
- 3 üyelik paketi (Aylık, 5 Aylık, Yıllık)

### 5. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Giriş Bilgileri

```
URL: http://localhost:3000/login
Username: admin
Password: admin123
```

> ⚠️ **Önemli:** Production'da bu şifreyi değiştirin!

## Proje Yapısı

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Login/logout
│   │   ├── members/      # Üye CRUD
│   │   ├── packages/     # Paket CRUD
│   │   └── memberships/  # Üyelik CRUD
│   ├── dashboard/        # Dashboard sayfaları
│   ├── login/            # Login sayfası
│   └── layout.js         # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── db.js             # MongoDB connection
│   ├── auth.js           # JWT utilities
│   └── utils.js          # Helper functions
├── models/               # Mongoose models
├── services/             # Business logic
└── scripts/
    └── seed.js           # Database seed script
```

## Veritabanı Şeması

### Collections

**admins**
- username (unique)
- passwordHash
- isActive
- createdAt

**members**
- firstName
- lastName
- email
- createdAt

**membershippackages**
- name
- durationInDays
- price
- isActive
- createdAt

**membermemberships**
- memberId (ref → members)
- packageId (ref → membershippackages)
- startDate
- endDate
- status (active/expired/cancelled)
- createdAt

## API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/logout` - Çıkış yap

### Members
- `GET /api/members` - Tüm üyeleri listele
- `POST /api/members` - Yeni üye oluştur
- `PUT /api/members/[id]` - Üye güncelle
- `DELETE /api/members/[id]` - Üye sil

### Packages
- `GET /api/packages` - Tüm paketleri listele
- `POST /api/packages` - Yeni paket oluştur
- `PUT /api/packages/[id]` - Paket güncelle
- `DELETE /api/packages/[id]` - Paket deaktif et

### Memberships
- `GET /api/memberships` - Tüm üyelikleri listele
- `POST /api/memberships` - Üyelik ata
- `PUT /api/memberships/[id]` - Üyelik durumu güncelle
- `DELETE /api/memberships/[id]` - Üyelik sil
- `POST /api/memberships/renew` - Üyelik yenile

## Vercel Deployment

### 1. MongoDB Atlas Hazırlığı

- MongoDB Atlas'ta cluster oluşturun
- Database user oluşturun
- Network Access: `0.0.0.0/0` (tüm IP'lere izin)
- Connection string'i kopyalayın

### 2. Vercel'e Deploy

```bash
# Vercel CLI ile
npm i -g vercel
vercel

# Veya GitHub'a push edip Vercel dashboard'dan import edin
```

### 3. Environment Variables

Vercel dashboard'da aşağıdaki environment variables'ı ekleyin:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/membership_management
JWT_SECRET=your-strong-production-secret-min-32-characters
NODE_ENV=production
```

### 4. Deploy Sonrası

Production veritabanını seed edin:
```bash
# Local'de production URI ile
MONGODB_URI="your-production-uri" npm run seed
```

## Güvenlik

- ✅ JWT HTTP-only cookie'lerde saklanır
- ✅ Şifreler bcrypt ile hashlenir
- ✅ Middleware ile route protection
- ✅ API endpoint'lerde authentication kontrolü
- ✅ Environment variables ile secret yönetimi

## Production Checklist

- [ ] JWT_SECRET'i güçlü bir değerle değiştir
- [ ] Admin şifresini değiştir
- [ ] MongoDB Atlas network access ayarlarını kontrol et
- [ ] CORS ayarlarını kontrol et (Next.js otomatik handle eder)
- [ ] Error handling'i production için optimize et

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run seed     # Database seed
npm run lint     # ESLint
```

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

MIT

## Destek

Sorularınız için issue açabilirsiniz.
