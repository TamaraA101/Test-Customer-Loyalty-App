const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/databaseConfig');


const app = express();

// middleware
app.use(cors());
app.use(express());

connectDB();

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Customer Loyalty API is running'
    });
});

// port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Customer loyalty API is running on ${PORT}`);
});