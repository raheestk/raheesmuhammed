const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getActiveAlerts, saveAlertLogs } = require('../services/alertService');
const { runCheck } = require('../cron/expiryChecker');
const db = require('../database');

// GET /api/alerts — returns current live alerts for the dashboard
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

// GET /api/alerts/logs — returns stored historical log
router.get('/logs', auth, (req, res) => {
  db.all('SELECT * FROM alert_logs ORDER BY notified_at DESC LIMIT 200', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/alerts/trigger — manually trigger a check (for testing)
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
