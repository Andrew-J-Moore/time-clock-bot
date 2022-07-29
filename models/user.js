const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  user_id: {type: Number},
  clockin: {type: Date},
  clocked_in: {type: Boolean, default: false},
  total_time: {type: Number, default: 0},
  server_id: {type: Number}
})

module.exports = mongoose.model("User", userSchema);