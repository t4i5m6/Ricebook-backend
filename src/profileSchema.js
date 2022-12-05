const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required']
    },
    headline: {
        type: String,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    zipcode: {
        type: String,
        default: ""
    },
    dob: {
        type: String,
        default: ""
    },
    created: {
        type: Date,
        required: [true, 'Created date is required']
    }
})

module.exports = profileSchema;