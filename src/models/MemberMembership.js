import mongoose from 'mongoose';

const MemberMembershipSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member ID is required'],
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPackage',
    required: [true, 'Package ID is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
MemberMembershipSchema.index({ memberId: 1, status: 1 });
MemberMembershipSchema.index({ endDate: 1, status: 1 });

// Prevent model recompilation in development
const MemberMembership = mongoose.models.MemberMembership || 
  mongoose.model('MemberMembership', MemberMembershipSchema);

export default MemberMembership;
