const nodemailer = require('nodemailer');
const config = require('../alertConfig');

async function sendAlertEmail(alerts) {
  if (!config.email.enabled) {
    console.log('[Email] Email notifications disabled. Enable in alertConfig.js');
    return;
  }
  if (alerts.length === 0) return;

  const expired  = alerts.filter(a => a.status === 'expired');
  const expiring = alerts.filter(a => a.status === 'expiring');

  const rows = (list, color) => list.map(a => `
    <tr>
      <td style="padding:10px; border-bottom:1px solid #eee;">${a.entityType === 'employee' ? '👤' : '🚗'} <strong>${a.name}</strong></td>
      <td style="padding:10px; border-bottom:1px solid #eee;">${a.field}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; color:${color}; font-weight:bold;">
        ${a.dateStr} (${a.days < 0 ? Math.abs(a.days) + ' days ago' : 'in ' + a.days + ' days'})
      </td>
    </tr>`).join('');

  const html = `
    <div style="font-family:Arial,sans-serif; max-width:700px; margin:0 auto;">
      <div style="background:#1B4B8A; color:#fff; padding:20px 30px; border-radius:12px 12px 0 0;">
        <h2 style="margin:0;">🔔 DOZANDA HR — Expiry Alert</h2>
        <p style="margin:5px 0 0; opacity:0.8;">Daily report — ${new Date().toDateString()}</p>
      </div>
      <div style="background:#fff; padding:30px; border:1px solid #ddd; border-radius:0 0 12px 12px;">
        ${expired.length > 0 ? `
          <h3 style="color:#C53030;">🔴 Expired (${expired.length})</h3>
          <table style="width:100%; border-collapse:collapse;">
            <thead><tr style="background:#FFF5F5;">
              <th style="padding:10px; text-align:left;">Name</th>
              <th style="padding:10px; text-align:left;">Field</th>
              <th style="padding:10px; text-align:left;">Expiry Date</th>
            </tr></thead>
            <tbody>${rows(expired, '#C53030')}</tbody>
          </table>` : ''}
        ${expiring.length > 0 ? `
          <h3 style="color:#D69E2E; margin-top:30px;">🟠 Expiring Within 30 Days (${expiring.length})</h3>
          <table style="width:100%; border-collapse:collapse;">
            <thead><tr style="background:#FFFBEB;">
              <th style="padding:10px; text-align:left;">Name</th>
              <th style="padding:10px; text-align:left;">Field</th>
              <th style="padding:10px; text-align:left;">Expiry Date</th>
            </tr></thead>
            <tbody>${rows(expiring, '#D69E2E')}</tbody>
          </table>` : ''}
        <p style="margin-top:30px; color:#666; font-size:0.85rem;">
          This is an automated alert from DOZANDA HR & Asset Management System.
        </p>
      </div>
    </div>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.email.from, pass: config.email.password }
  });

  await transporter.sendMail({
    from: `"DOZANDA HR System" <${config.email.from}>`,
    to:   config.email.to,
    subject: `🔔 DOZANDA HR Alert — ${expired.length} Expired, ${expiring.length} Expiring Soon`,
    html
  });

  console.log('[Email] Alert email sent to', config.email.to);
}

module.exports = { sendAlertEmail };
