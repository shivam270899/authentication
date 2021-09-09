const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        trim: true,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: true
    },
    isSeller: {
        type: Boolean,
        default: true
    }
},{timestamps: true} )

module.exports = mongoose.model('User', userSchema);
