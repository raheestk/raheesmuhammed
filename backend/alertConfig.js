// ─────────────────────────────────────────────
//  DOZANDA HR — Alert Configuration
//  Fill in your credentials here to enable
//  email and WhatsApp notifications.
// ─────────────────────────────────────────────

module.exports = {

  // ── Email (Gmail) ──────────────────────────
  // 1. Enable 2-Step Verification on your Google account
  // 2. Go to: Google Account → Security → App Passwords
  // 3. Generate a password for "Mail" and paste it below
  email: {
    enabled: false,           // Set to true once credentials are ready
    from: 'your-gmail@gmail.com',
    to:   'admin@dozanda.com', // Where alerts are sent
    password: 'xxxx xxxx xxxx xxxx',  // Gmail App Password (16 chars)
  },

  // ── WhatsApp (Twilio) ──────────────────────
  // Sign up free at twilio.com to get these values
  whatsapp: {
    enabled: false,           // Set to true once credentials are ready
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authToken:  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    from:  'whatsapp:+14155238886',  // Twilio sandbox number
    to:    'whatsapp:+971586411591', // Admin WhatsApp number
  },

  // ── Alert Thresholds ──────────────────────
  thresholds: {
    expiringSoonDays: 30,  // Days before expiry to show ORANGE warning
  }
};
