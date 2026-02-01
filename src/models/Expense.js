import mongoose from 'mongoose';

/**
 * Admin harcamaları için model.
 * Kategoriler: elektrik (Elektrik Faturası), water (Su Faturası), extra (Ekstra Masraflar)
 */
const CATEGORIES = ['electricity', 'water', 'extra'];

const ExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Kategori gereklidir'],
    enum: {
      values: CATEGORIES,
      message: 'Geçersiz kategori',
    },
  },
  amount: {
    type: Number,
    required: [true, 'Tutar gereklidir'],
    min: [0, 'Tutar negatif olamaz'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ category: 1 });

const Expense =
  mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

export default Expense;
export { CATEGORIES };
