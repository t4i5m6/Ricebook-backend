const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required']
  },
  oauth: {
    type: String,
    default: ""
  },
  oauthUsername: {
    type: String,
    default: ""
  },
  salt: {
    type: String,
    default: ""
  },
  hash: {
    type: String,
    default: ""
  },
  created: {
    type: Date,
    required: [true, 'Created date is required']
  }
})

module.exports = userSchema;
