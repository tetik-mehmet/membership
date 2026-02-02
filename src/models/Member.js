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

export default Member;
