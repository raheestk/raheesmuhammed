const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getActiveAlerts, saveAlertLogs } = require('../services/alertService');
const { runCheck } = require('../cron/expiryChecker');
const pool = require('../database');

// GET /api/alerts
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await getActiveAlerts();
    const expired  = alerts.filter(a => a.status === 'expired');
    const expiring = alerts.filter(a => a.status === 'expiring');
    res.json({ total: alerts.length, expired, expiring, all: alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/logs
router.get('/logs', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alert_logs ORDER BY notified_at DESC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/trigger
router.post('/trigger', auth, async (req, res) => {
  try {
    await runCheck();
    const alerts = await getActiveAlerts();
    res.json({ message: 'Check triggered', total: alerts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
