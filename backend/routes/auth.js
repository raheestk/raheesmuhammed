const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const auth = require('../middlewares/auth');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'dozanda123', { expiresIn: '1d' });
        res.json({ token, username: user.username });
    });
});

// Change Password
router.put('/change-password', auth, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ message: 'User error' });

        const isMatch = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        const hash = bcrypt.hashSync(newPassword, 8);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId], (err2) => {
            if (err2) return res.status(500).json({ message: 'Failed to update password' });
            res.json({ message: 'Password updated successfully' });
        });
    });
});

module.exports = router;
