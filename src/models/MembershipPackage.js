import mongoose from 'mongoose';

const MembershipPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
  },
  durationInDays: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model recompilation in development
const MembershipPackage = mongoose.models.MembershipPackage || 
  mongoose.model('MembershipPackage', MembershipPackageSchema);

export default MembershipPackage;
