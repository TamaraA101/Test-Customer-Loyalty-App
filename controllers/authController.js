

const bcrypt = require('bcryptjs');

const User = require('../models/user');

const sendVerificationEmail = require('../services/emailService');

const generateToken = require('../utilities/generateToken');

const generateVerificationCode = require('../utilities/generateEmailCode');

// Create new user

exports.createUser = async (req, res) => {
    try {

        // required fields
        const {firstName, lastName, email, phone, password} = req.body;

        if (!firstName || !lastName || !email || !phone || !password)  {
            return res.status(409).json({
                success: false,
                message: 'All fields are required',
                data: null
            });
        }

        // check name length
        if (firstName.trim().length < 3 || lastName.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 3 characters',
                data: null
            });
        }

        // check password length

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
                data: null
            });
        }

        // check email pattern

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                data: null
            });
        }

        if (phone.length < 11) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid phone number',
                data: null
            });
        }

        // Check for existing customer (email and phone)

        const normalizedEmail = email.toLowerCase().trim();

        const existingCustomer = await User.findOne({
            $or: [{ email: normalizedEmail }, { phone }]
        });

        if (existingCustomer) {
            if (existingCustomer.email === normalizedEmail) {
                return res.status(409).json({
                    message: 'Email already exists'
                });
            }

            if (existingCustomer.phone === phone) {
                return res.status(409).json({
                    message: 'Phone number already exists'
                });
            }

        if (existingCustomer) {
            return res.status(400).json({ 
                success: false,
                message: 'Customer already exists',
                data: null,
            });
            }
        }

        // Encrypt password

        const salt = await bcrypt.genSalt(5);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Generate Code

        const verificationCode = generateVerificationCode();

        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Save created user

        const user = await User.create({
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            role: 'CUSTOMER', 
            emailVerificationCode: verificationCode,
            emailVerificationExpires: verificationExpires,
            emailVerificationLastSentAt: new Date(),
        });

        await sendVerificationEmail(user.email, verificationCode);

        // Generate token
        // const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    pointsBalance: user.pointsBalance,
                    isEmailVerified: user.isEmailVerified
                },
                // token,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message,
            data: null,
        })
    }
};

// Login User

exports.loginUser = async (req, res) => {
    try {

        // Check required fields
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
                data: null,
            });
        }

        // Check for existing user
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({email: normalizedEmail}).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        // Compare if hashed password match

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                data: null
            });
        }

        // Check if Account is active

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This account has been deactivated',
                data: null,
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
                data: null
            });
        }

        // Generate token

        const token = generateToken(user._id);

        // Return login response

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    pointsBalance: user.pointsBalance,
                    isActive: user.isActive,
                    isEmailVerified: user.isEmailVerified
                },

                token,
            }
        }); 
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to login',
            error: error.message,
            data: null,
        })
    }
};

// get user

exports.getUser = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
            user: {
                id: req.user._id.toString(),
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                pointsBalance: req.user.pointsBalance,
                isEmailVerified: req.user.isEmailVerified,
            },
        },
    });
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const {firstName, lastName, phone} = req.body;

        const user = req.user;

        if (firstName !== undefined) {
            user.firstName = firstName;
        }

        if (lastName !== undefined) {
            user.lastName = lastName;
        }

        if (phone !== undefined) {
            const existingPhone = await User.findOne({
                phone,
                _id: {$ne: user._id},
            });

            if (existingPhone) {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number is already in use',
                    data: null
                });
            }

            user.phone = phone;
        }

        await user.save();

        return res.status (200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    pointsBalance: user.pointsBalance
                },
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to update profile',
            data: null
        })
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please enter current and new password',
                data: null
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
                data: null
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword, 
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
                data: null
            });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from your current password',
                data: null
            });
        }

        // Encrypt password

        const salt = await bcrypt.genSalt(5);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.passwordChangedAt = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: null
        });
    } catch (error) {
        console.error('Change Password error:', error)

        res.status(500).json({
            success: false,
            message: 'Unable to change password',
            data: null
        });
    }
};

// Deactivate own Account 
exports.deactivateAccount = async (req, res) => {
    try {
        const user = req.user;

        user.isActive = false;

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Account deactivated successfully',
            data: null
        });
    } catch (error) {
        console.error('Deactivate account error:', error);

        return res.status(500).json({
            success: false,
            message: 'Deactivation failed',
            data: null
        });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const {email, code} = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Please enter email and code',
                data: null
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }). select('+emailVerificationCode +emailVerificationExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
                data: null
            });
        }

        if (!user.emailVerificationCode || !user.emailVerificationExpires) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is invalid or has expired',
                data: null
            });
        }

        // Check if code has expired

        if (new Date() > user.emailVerificationExpires) { 
            return res.status(400).json({ 
                success: false, 
                message: 'Verification code has expired', 
                data: null 
            });
        } 

        if (user.emailVerificationCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code',
                data: null
            });
        }

        user.isEmailVerified = true;

        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    pointsBalance: user.pointsBalance,
                    isEmailVerified: user.isEmailVerified
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to verify email',
            data: null
        });
    }
};
// Resend OTP
exports.resendVerificationCode = async (req, res) => {
    try {
        const {email} = req.body; 

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
                data: null
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({email: normalizedEmail}).select('+emailVerificationLastSentAt');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
                data: null            
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
                data: null
            });
        }

        if (user.emailVerificationLastSentAt) {
            const timeSinceLastSent = Date.now() - user.emailVerificationLastSentAt.getTime();

            const cooldown = 60 * 1000;

            if (timeSinceLastSent < cooldown) {
                const remainingSeconds = Math.ceil((cooldown - timeSinceLastSent) / 1000 );

                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remainingSeconds} seconds before requesting another code`,
                    data: null
                });
            }
        }

        const verificationCode = generateVerificationCode();

        const verificationExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = verificationExpires;
        user.emailVerificationLastSentAt = new Date();

        await user.save();

        await sendVerificationEmail(user.email, verificationCode);

        res.status(200).json({
            success: true,
            message: 'A new verification code has been sent to your email',
            data: null
        });
    } catch (error) {
        console.error('RESEND VERIFICATION ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to resend verification code',
            data: null
        });
    }
};

// ADMIN

// Get all users (ADMIN)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve users',
            data: null
        });
    }
};

// Admin Deactivation (ADMIN)
exports.deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account from this endpoint',
                data: null
            });
        }

        user.isActive = false;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User account deactivated successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to deactivate user account',
            data: null
        });
    }
};

// Activate user (ADMIN)
exports.activateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        user.isActive = true;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User account activated successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to activate user account',
            data: null
        });
    }
};

