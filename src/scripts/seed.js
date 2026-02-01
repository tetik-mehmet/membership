import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

// Simple schema definitions for seeding
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const MembershipPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  durationInDays: { type: Number, required: true },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
const MembershipPackage = mongoose.models.MembershipPackage || 
  mongoose.model('MembershipPackage', MembershipPackageSchema);

async function seed() {
  try {
    console.log('🌱 Seeding başlatılıyor...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Create default admin
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        passwordHash,
        isActive: true,
      });
      console.log('✅ Admin kullanıcısı oluşturuldu');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin kullanıcısı zaten mevcut');
    }

    // Create default membership packages
    const packages = [
      {
        name: 'Aylık',
        durationInDays: 30,
        price: 500,
      },
      {
        name: '5 Aylık',
        durationInDays: 150,
        price: 2000,
      },
      {
        name: 'Yıllık',
        durationInDays: 365,
        price: 4000,
      },
    ];

    for (const pkg of packages) {
      const existing = await MembershipPackage.findOne({ name: pkg.name });
      if (!existing) {
        await MembershipPackage.create(pkg);
        console.log(`✅ Paket oluşturuldu: ${pkg.name}`);
      } else {
        console.log(`ℹ️  Paket zaten mevcut: ${pkg.name}`);
      }
    }

    console.log('\n🎉 Seeding tamamlandı!');
    console.log('\n📝 Giriş bilgileri:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding hatası:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
  }
}

// Run seed
seed();
