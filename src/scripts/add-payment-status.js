import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

async function addPaymentStatusToAllMembers() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    await mongoose.connect(MONGODB_URI);
    console.log("Bağlantı başarılı!");

    const db = mongoose.connection.db;
    const membersCollection = db.collection("members");

    // Tüm üyelere paymentStatus alanı ekle (yoksa)
    const result = await membersCollection.updateMany(
      { paymentStatus: { $exists: false } },
      { $set: { paymentStatus: "unpaid" } }
    );

    console.log(`${result.modifiedCount} üyeye paymentStatus alanı eklendi.`);

    // Kontrol
    const updatedMembers = await membersCollection.find({}).toArray();
    console.log("Güncellenmiş üyeler:");
    updatedMembers.forEach((m) => {
      console.log(`- ${m.firstName} ${m.lastName}: ${m.paymentStatus}`);
    });

    await mongoose.disconnect();
    console.log("İşlem tamamlandı!");
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    process.exit(1);
  }
}

addPaymentStatusToAllMembers();
