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
  // İşlem yapılan hedef üye/üyelik bilgileri
  targetMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
  },
  targetMemberName: {
    type: String,
  },
  targetMembershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MemberMembership",
  },
  targetPackageName: {
    type: String,
  },
  targetPackageDurationInDays: {
    type: Number,
  },
  targetNote: {
    type: String,
  },
  action: {
    type: String,
    enum: [
      "login",
      "logout",
      "member_created",
      "member_deleted",
      "membership_created",
      "membership_renewed",
      "membership_deleted",
      "member_note_updated",
    ],
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
