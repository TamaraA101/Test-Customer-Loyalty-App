const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const User = require('../models/user');

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '1d'});
};

// Create new user

exports.createUser = async (req, res) => {
    try {

        // required fields
        const {firstName, lastName, email, phone, password, role} = req.body;

        if (!firstName || !lastName || !email || !phone || !password)  {
            return res.status(409).json({
                success: false,
                message: 'All fields are required',
                data: null
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be atleast 6 characters'
            })
        }

        // Check for existing password

        const normalizedEmail = email.toLowerCase().trim();

        const existingCustomer = await CustomElementRegistry.findOne({
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

        const user = await User.create({
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            role: role || 'CUSTOMER', 
        });

        // Generate token
        const token = generateToken(user.id);

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
                },
                token,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user', 
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
        const user = await User.findeOne({email: normalizedEmail}).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
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

        // Compare if hashed password match

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                data: null
            });
        }

        // Generate token

        const token = generateToken(user._id);

        // Return login response

        res.status(200).json({
            suucess: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    pointsBalance: user.pointsBalance
                },

                token,
            }
        }); 
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to login',
            data: null,
        })
    }
}