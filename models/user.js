const mongoose = require('mongoose');

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

    passwordChangedAt: {
        type: Date,
        select: false
    },

    role: {
        type: String,
        enum: ['CUSTOMER', 'BUSINESS', 'ADMIN'],
        default: 'CUSTOMER'
    },

    pointsBalance: {
        type: Number,
        default: 0,
        min: 0,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isEmailVerified: {
        type: Boolean,
        default: false,
    },

    emailVerificationCode: {
        type: String,
        select: false
    },

    emailVerificationExpires: {
        type: Date,
        select: false
    },

    emailVerificationLastSentAt: {
        type: Date,
        select: false,
    },

},
{
    timestamps: true,
}
);

const User = mongoose.model('User', userSchema);

module.exports = User;