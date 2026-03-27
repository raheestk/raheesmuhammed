const db = require('../database');

const SOON_DAYS = 30;

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
  if (days === null) return null;
  if (days < 0)          return 'expired';
  if (days <= SOON_DAYS) return 'expiring';
  return null;
}

function buildAlert(entityType, name, id, field, dateStr) {
  const days   = daysDiff(dateStr);
  const status = getStatus(days);
  if (!status) return null;
  return { entityType, id, name, field, dateStr, days, status };
}

async function getActiveAlerts() {
  return new Promise((resolve, reject) => {
    const alerts = [];

    db.all('SELECT * FROM employees', [], (err, employees) => {
      if (err) return reject(err);

      employees.forEach(emp => {
        const a1 = buildAlert('employee', emp.name, emp.id, 'Visa Expiry',       emp.visa_expiry);
        const a2 = buildAlert('employee', emp.name, emp.id, 'Passport Expiry',   emp.passport_expiry);
        const a3 = buildAlert('employee', emp.name, emp.id, 'Insurance Expiry',  emp.insurance_expiry);
        [a1, a2, a3].forEach(a => a && alerts.push(a));
      });

      db.all('SELECT * FROM vehicles', [], (err2, vehicles) => {
        if (err2) return reject(err2);

        vehicles.forEach(veh => {
          const a4 = buildAlert('vehicle', veh.vehicle_number, veh.id, 'Insurance Expiry', veh.insurance_expiry);
          if (a4) alerts.push(a4);
        });

        // Sort: expired first, then by days ascending
        alerts.sort((a, b) => a.days - b.days);
        resolve(alerts);
      });
    });
  });
}

async function saveAlertLogs(alerts) {
  return new Promise((resolve) => {
    const now = new Date().toISOString();
    let done  = 0;
    if (alerts.length === 0) return resolve();

    alerts.forEach(a => {
      db.run(
        `INSERT INTO alert_logs (entity_type, entity_id, entity_name, alert_field, expiry_date, status, notified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [a.entityType, a.id, a.name, a.field, a.dateStr, a.status, now],
        () => { done++; if (done === alerts.length) resolve(); }
      );
    });
  });
}

module.exports = { getActiveAlerts, saveAlertLogs };
