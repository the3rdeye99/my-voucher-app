const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  purpose: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  date: { type: Date, default: Date.now },
  neededBy: { type: Date, required: true },
  updatedAt: { type: Date, default: Date.now },
  approvedBy: { type: String, required: false },
  paidBy: { type: String, required: false }
});

module.exports = mongoose.model('Voucher', voucherSchema); 