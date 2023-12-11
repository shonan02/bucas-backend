const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 5
    },
    email: {
        type: String,
        required: true,
        minLength: 5
    },
    password: {
        type: String,
        required: true,
        minLength: 7
    }
})

module.exports = mongoose.model('User', schema);