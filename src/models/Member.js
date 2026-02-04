import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
    default: "",
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "partial", "unpaid"],
    default: "unpaid",
  },
  photoUrl: {
    type: String,
    trim: true,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for full name
MemberSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
MemberSchema.set("toJSON", { virtuals: true });
MemberSchema.set("toObject", { virtuals: true });

// Prevent model recompilation in development
const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);

// Hot-reload sırasında mevcut model şemasını da güncel tut (özellikle enum için)
(() => {
  const existing = mongoose.models.Member;
  if (!existing) return;

  const paymentStatusPath = existing.schema.path("paymentStatus");
  if (!paymentStatusPath) return;

  // enum validator'ın kullandığı gerçek dizi genelde `enumValues`
  if (
    Array.isArray(paymentStatusPath.enumValues) &&
    !paymentStatusPath.enumValues.includes("partial")
  ) {
    paymentStatusPath.enumValues.push("partial");
  }

  // Yine de options.enum üzerinde de tutarlılık sağlayalım
  if (
    Array.isArray(paymentStatusPath.options?.enum) &&
    !paymentStatusPath.options.enum.includes("partial")
  ) {
    paymentStatusPath.options.enum.push("partial");
  }
})();

export default Member;
