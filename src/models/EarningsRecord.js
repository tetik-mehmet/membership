import mongoose from 'mongoose';

/**
 * Üyelik verildiğinde kazanılan tutarı kaydeder.
 * Üye silindiğinde MemberMembership silinir ama bu kayıtlar silinmez;
 * böylece toplam ve aylık kazanç düşmez.
 */
const EarningsRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

EarningsRecordSchema.index({ date: 1 });

const EarningsRecord =
  mongoose.models.EarningsRecord ||
  mongoose.model('EarningsRecord', EarningsRecordSchema);

export default EarningsRecord;
