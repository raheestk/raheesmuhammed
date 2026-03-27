const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uDirs = ['uploads/employees', 'uploads/employees/photos', 'uploads/company', 'uploads/vehicles', 'uploads/vehicles/photos'];
uDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Import Routes
const authRoutes      = require('./routes/auth');
const employeeRoutes  = require('./routes/employees');
const companyRoutes   = require('./routes/company');
const vehicleRoutes   = require('./routes/vehicles');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes     = require('./routes/alerts');
const chequeRoutes    = require('./routes/cheques');

app.use('/api/auth',      authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/company',   companyRoutes);
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/cheques',   chequeRoutes);

// Start cron job for daily expiry checks
try {
    const { startExpiryChecker } = require('./cron/expiryChecker');
    startExpiryChecker();
} catch (err) {
    console.warn('[Cron] Could not start expiry checker (node-cron may not be installed yet):', err.message);
    console.warn('[Cron] Run: npm install node-cron nodemailer twilio');
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
