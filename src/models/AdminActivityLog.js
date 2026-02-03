import mongoose from "mongoose";

const AdminActivityLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ["login", "logout"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Sorgu performansı için index
AdminActivityLogSchema.index({ timestamp: -1 });
AdminActivityLogSchema.index({ adminId: 1, timestamp: -1 });

const AdminActivityLog =
  mongoose.models.AdminActivityLog ||
  mongoose.model("AdminActivityLog", AdminActivityLogSchema);

export default AdminActivityLog;
