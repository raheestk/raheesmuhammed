const express = require('express');
const router = express.Router();
const pool = require('../database');
const auth = require('../middlewares/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const [empRes, vehRes, compRes] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM employees'),
            pool.query('SELECT COUNT(*) as count FROM vehicles'),
            pool.query('SELECT COUNT(*) as count FROM company_documents')
        ]);
        res.json({
            employees: parseInt(empRes.rows[0].count),
            vehicles: parseInt(vehRes.rows[0].count),
            company_documents: parseInt(compRes.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
