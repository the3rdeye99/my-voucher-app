const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['staff', 'accountant', 'admin'], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export the model
const User = mongoose.model('User', userSchema);
module.exports = User; 