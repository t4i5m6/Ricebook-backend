const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    commentId: {
        type: Number,
        required: [true, 'comment is required']
    },
    comment: {
        type: String,
        required: [true, 'comment is required']
    },
    author: {
        type: String,
        required: [true, 'author is required']
    }
})

const articleSchema = new mongoose.Schema({
    pid: {
        type: Number,
        unique: true,
    },
    author: {
        type: String,
        required: [true, 'Author is required']
    },
    text: {
        type: String,
        required: [true, 'Text is required']
    },
    picture:{
        type: String
    },
    comments: {
        type: [ commentSchema],
    },
    date: {
        type: Date,
        required: [true, 'Created date is required']
    }
})



module.exports = articleSchema;