const express = require('express');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },

    lastName: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
        trim: true,
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: user
    },

    pointsBalance: {
        type: Number,
        default: 0,
        min: 0,
    },

    isActive: {
        type: Boolean,
        deafault: true,
    },

},
{
    timestamps: true,
}
);

const User = mongoose.model('User', userSchema);

module.exports = User;