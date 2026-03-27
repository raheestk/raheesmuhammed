const config = require('../alertConfig');

async function sendWhatsAppAlert(alerts) {
  if (!config.whatsapp.enabled) {
    console.log('[WhatsApp] WhatsApp notifications disabled. Enable in alertConfig.js');
    return;
  }
  if (alerts.length === 0) return;

  try {
    const twilio = require('twilio');
    const client = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);

    const expired  = alerts.filter(a => a.status === 'expired');
    const expiring = alerts.filter(a => a.status === 'expiring');

    let message = `🔔 *DOZANDA HR Alert* — ${new Date().toDateString()}\n\n`;

    if (expired.length > 0) {
      message += `🔴 *EXPIRED (${expired.length}):*\n`;
      expired.forEach(a => {
        message += `• ${a.entityType === 'employee' ? '👤' : '🚗'} ${a.name} — ${a.field}: ${a.dateStr}\n`;
      });
      message += '\n';
    }

    if (expiring.length > 0) {
      message += `🟠 *EXPIRING SOON (${expiring.length}):*\n`;
      expiring.forEach(a => {
        message += `• ${a.entityType === 'employee' ? '👤' : '🚗'} ${a.name} — ${a.field}: ${a.dateStr} (${a.days} days left)\n`;
      });
    }

    await client.messages.create({
      from: config.whatsapp.from,
      to:   config.whatsapp.to,
      body: message
    });

    console.log('[WhatsApp] Alert sent to', config.whatsapp.to);
  } catch (err) {
    console.error('[WhatsApp] Failed to send:', err.message);
  }
}

module.exports = { sendWhatsAppAlert };
