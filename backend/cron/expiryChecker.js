const cron = require('node-cron');
const { getActiveAlerts, saveAlertLogs } = require('../services/alertService');
const { sendAlertEmail } = require('../services/emailService');
const { sendWhatsAppAlert } = require('../services/whatsappService');

// Run every day at 8:00 AM
function startExpiryChecker() {
  console.log('[Cron] Expiry checker registered — runs daily at 8:00 AM');

  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily expiry check...', new Date().toLocaleString());
    await runCheck();
  });

  // Also run immediately on server startup so alerts are fresh
  runCheck();
}

async function runCheck() {
  try {
    const alerts = await getActiveAlerts();
    console.log(`[Cron] Found ${alerts.length} active alerts`);

    if (alerts.length > 0) {
      await saveAlertLogs(alerts);
      await sendAlertEmail(alerts);
      await sendWhatsAppAlert(alerts);
    }

    console.log('[Cron] Expiry check complete.');
  } catch (err) {
    console.error('[Cron] Error during expiry check:', err.message);
  }
}

module.exports = { startExpiryChecker, runCheck };
