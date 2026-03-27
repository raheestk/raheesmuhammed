const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// When bundled with Electron, `__dirname` points inside `resources/app.asar/...`.
// SQLite cannot open database files from inside `app.asar`, so we copy it
// to a writable location on first run.
const sourceDbPath = path.resolve(__dirname, 'database.sqlite');

let dbPath = sourceDbPath;
try {
    // Only available when running inside Electron.
    const { app } = require('electron');
    const userDataDir = app && typeof app.getPath === 'function' ? app.getPath('userData') : null;

    if (userDataDir) {
        const destDir = path.join(userDataDir, 'dozanda-hr');
        const destDbPath = path.join(destDir, 'database.sqlite');

        const needsCopy =
            !fs.existsSync(destDbPath) || (fs.statSync(destDbPath).size === 0);

        if (needsCopy) {
            fs.mkdirSync(destDir, { recursive: true });
            // Copy from asar -> real filesystem.
            fs.copyFileSync(sourceDbPath, destDbPath);
        }

        dbPath = destDbPath;
    }
} catch (_) {
    // Running outside Electron (normal `node server.js` dev mode).
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // ── Database Durability Settings ──
    // Makes the database "strong" against app closing/crashing
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");
    db.run("PRAGMA busy_timeout = 5000;");

    // Users for Auth
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Employees
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        department TEXT,
        contact_number TEXT,
        relative_contact_number TEXT,
        address TEXT,
        date_of_birth TEXT,
        passport_number TEXT,
        passport_issue TEXT,
        passport_expiry TEXT,
        visa_number TEXT,
        visa_issue TEXT,
        visa_expiry TEXT,
        insurance_provider TEXT,
        insurance_number TEXT,
        insurance_expiry TEXT,
        medical_status TEXT,
        medical_expiry TEXT,
        custom_fields TEXT,
        files TEXT
    )`);

    // Company Documents
    db.run(`CREATE TABLE IF NOT EXISTS company_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT,
        trade_license TEXT,
        vat_details TEXT,
        audit_reports TEXT,
        category TEXT,
        legal_docs TEXT,
        custom_fields TEXT,
        files TEXT
    )`);

    // Vehicles
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT,
        insurance_number TEXT,
        insurance_start TEXT,
        insurance_expiry TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        custom_fields TEXT,
        files TEXT,
        photo TEXT
    )`);

    // Safely apply alterations for V2/V3 schema if elements don't already exist
    db.run("ALTER TABLE employees ADD COLUMN photo TEXT", () => {});
    db.run("ALTER TABLE employees ADD COLUMN documents TEXT", () => {});
    db.run("ALTER TABLE company_documents ADD COLUMN documents TEXT", () => {});
    db.run("ALTER TABLE vehicles ADD COLUMN documents TEXT", () => {});
    
    // Phase 3 Schemas
    db.run("ALTER TABLE vehicles ADD COLUMN vehicle_type TEXT", () => {}); // User requested type of vehicle, ensuring it exists
    db.run("ALTER TABLE vehicles ADD COLUMN mulkiya_number TEXT", () => {});
    db.run("ALTER TABLE vehicles ADD COLUMN mulkiya_expiry TEXT", () => {});
    db.run("ALTER TABLE company_documents ADD COLUMN photo TEXT", () => {});

    // Alert logs table
    db.run(`CREATE TABLE IF NOT EXISTS alert_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT,
      entity_id INTEGER,
      entity_name TEXT,
      alert_field TEXT,
      expiry_date TEXT,
      status TEXT,
      notified_at TEXT
    )`);

    // Cheques table (Version 2 with Cleared Status)
    db.run(`CREATE TABLE IF NOT EXISTS cheques_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      received_date TEXT,
      name TEXT NOT NULL,
      cheque_date TEXT,
      amount REAL,
      custodian TEXT,
      deposit_date TEXT,
      deposited_bank TEXT,
      status TEXT DEFAULT 'Pending',
      remark TEXT,
      cheque_image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    // Auto-recover missing cheques that were saved before the new update
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_cheques'", [], (err, tables) => {
      if (tables && tables.length > 0) {
        db.run(`
          INSERT INTO cheques_v2 (received_date, name, cheque_date, amount, custodian, deposit_date, status, remark, cheque_image)
          SELECT received_date, name, cheque_date, amount, custodian, deposit_date, 'Pending', remark, cheque_image
          FROM pending_cheques
          WHERE name NOT IN (SELECT name FROM cheques_v2)
        `, (err) => {
          if (!err) {
            // Once data is migrated safely, drop the old table
            db.run("DROP TABLE pending_cheques");
          }
        });
      }
    });

    // Seed default admin user
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 8);
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
        }
    });

    db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
        if (!err && row && row.count === 0) {
            db.run(`INSERT INTO employees (name, department, contact_number, relative_contact_number, address, date_of_birth, passport_number, passport_issue, passport_expiry, visa_number, visa_issue, visa_expiry, insurance_provider, insurance_number, insurance_expiry, medical_status, medical_expiry, custom_fields, files)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Ahmed Khan', 'Operations', '+971501112233', '+971552223344', 'Dubai, UAE', '1990-08-15', 'P1234567', '2021-04-01', '2031-03-31', 'V445566', '2023-01-01', '2026-12-31', 'Dubai Insurance', 'INS-9001', '2026-10-15', 'Fit', '2026-11-20', JSON.stringify({ "Blood Group": "O+" }), JSON.stringify([])]);
        }
    });

    db.get('SELECT COUNT(*) as count FROM company_documents', [], (err, row) => {
        if (!err && row && row.count === 0) {
            db.run(`INSERT INTO company_documents (company_name, trade_license, vat_details, audit_reports, category, legal_docs, custom_fields, files)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['DOZANDA FUEL TRADING LLC', 'TL-2026-0001', 'VAT-TRN-100200300', 'FY2025 External Audit', 'Certificates', 'Incorporation and legal agreements', JSON.stringify({ "Renewal Month": "December" }), JSON.stringify([])]);
        }
    });

    db.get('SELECT COUNT(*) as count FROM vehicles', [], (err, row) => {
        if (!err && row && row.count === 0) {
            db.run(`INSERT INTO vehicles (vehicle_number, insurance_number, insurance_start, insurance_expiry, driver_name, driver_phone, custom_fields, files, photo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['DXB-45721', 'VEH-INS-7788', '2025-06-01', '2026-05-31', 'Rashid Ali', '+971507778899', JSON.stringify({ "Fuel Type": "Diesel" }), JSON.stringify([]), null]);
        }
    });
});

module.exports = db;
