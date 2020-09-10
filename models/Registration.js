const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
  },
  roles: {
    type: Array,
    defaut: "User",
  },
  registrationDate: {
    type:Date
  },
  balance:Number,
});

module.exports = mongoose.model('Registration', registrationSchema);
