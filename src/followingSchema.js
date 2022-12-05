const mongoose = require('mongoose');



const followingSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required']
    },
    following: [],
})

module.exports = followingSchema;