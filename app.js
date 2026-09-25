// Call dotenv
require('dotenv').config();

// Call dependencies
const express = require('express');
const cors = require('cors');

// Call database and routes
const connectDB = require('./config/databaseConfig');
const authRoutes = require('./routes/authRoutes');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Customer Loyalty API is running',
        data: null,
    });
});

app.use('/api/auth', authRoutes);

// port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Customer loyalty API is running on ${PORT}`);
});