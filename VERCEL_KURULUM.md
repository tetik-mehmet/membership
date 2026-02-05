# Vercel Kurulum Rehberi

## Admin Giriş/Çıkış Logları - Environment Variable Ayarları

Projeyi Vercel'e deploy ettikten sonra, admin aktivite loglarının çalışması için aşağıdaki adımları uygulayın.

### 1. Vercel Dashboard'a Giriş

1. [vercel.com](https://vercel.com) adresine gidin
2. Projenize tıklayın
3. Üst menüden **Settings** sekmesine girin

### 2. Environment Variables Ekleme

1. Sol menüden **Environment Variables** bölümüne tıklayın
2. Aşağıdaki değişkeni ekleyin:

| Name                                       | Value                                                                                                      | Ortam                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_ACTIVITY_LOG_VIEWER_USERNAME` | Logları görmesini istediğiniz admin kullanıcı adları, virgülle ayrılmış (örn: `admin` veya `mehmet,ahmet`) | Production, Preview, Development |

3. **Add** veya **Save** butonuna basın

### 3. Redeploy

Environment variable ekledikten veya değiştirdikten sonra değişikliğin uygulanması için:

1. **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **⋮** (üç nokta) menüsüne tıklayın
3. **Redeploy** seçeneğini seçin
4. Onaylayın

Veya yeni bir commit push'layarak otomatik redeploy tetikleyebilirsiniz.

### 4. Doğrulama

- Belirlediğiniz kullanıcı adıyla giriş yaptığınızda sidebar'da **"Admin Logları"** menü öğesini görmelisiniz
- Bu menüye tıklayarak admin giriş/çıkış loglarını görüntüleyebilirsiniz
- Diğer admin hesaplarıyla giriş yapıldığında bu menü görünmez ve `/dashboard/activity-logs` adresine doğrudan gidilse bile erişim engellenir (403)

### Notlar

- `NEXT_PUBLIC_` prefix'i sayesinde bu değişken hem API (sunucu) hem de client tarafında kullanılır
- Logları farklı bir kullanıcıya vermek için sadece bu env değişkeninin değerini güncellemeniz yeterlidir
- Değer büyük/küçük harf duyarsızdır (admin = Admin = ADMIN)
