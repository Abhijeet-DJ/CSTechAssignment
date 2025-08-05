const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  firstName: String,
  phone: String,
  notes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
module.exports = mongoose.model('Task', taskSchema);
