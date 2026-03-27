const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Users
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
            )
        `);

        // Employees
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
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
                files TEXT,
                photo TEXT,
                documents TEXT
            )
        `);

        // Company Documents
        await client.query(`
            CREATE TABLE IF NOT EXISTS company_documents (
                id SERIAL PRIMARY KEY,
                company_name TEXT,
                trade_license TEXT,
                vat_details TEXT,
                audit_reports TEXT,
                category TEXT,
                legal_docs TEXT,
                custom_fields TEXT,
                files TEXT,
                documents TEXT,
                photo TEXT
            )
        `);

        // Vehicles
        await client.query(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id SERIAL PRIMARY KEY,
                vehicle_number TEXT,
                vehicle_type TEXT,
                mulkiya_number TEXT,
                mulkiya_expiry TEXT,
                insurance_number TEXT,
                insurance_start TEXT,
                insurance_expiry TEXT,
                driver_name TEXT,
                driver_phone TEXT,
                custom_fields TEXT,
                files TEXT,
                photo TEXT,
                documents TEXT
            )
        `);

        // Alert Logs
        await client.query(`
            CREATE TABLE IF NOT EXISTS alert_logs (
                id SERIAL PRIMARY KEY,
                entity_type TEXT,
                entity_id INTEGER,
                entity_name TEXT,
                alert_field TEXT,
                expiry_date TEXT,
                status TEXT,
                notified_at TEXT
            )
        `);

        // Cheques
        await client.query(`
            CREATE TABLE IF NOT EXISTS cheques_v2 (
                id SERIAL PRIMARY KEY,
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
                created_at TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
            )
        `);

        // Seed default admin user if not exists
        const userRes = await client.query(`SELECT * FROM users WHERE username = $1`, ['admin']);
        if (userRes.rows.length === 0) {
            const hash = bcrypt.hashSync('admin123', 8);
            await client.query(`INSERT INTO users (username, password) VALUES ($1, $2)`, ['admin', hash]);
        }

        // Seed sample employee
        const empRes = await client.query(`SELECT COUNT(*) as count FROM employees`);
        if (parseInt(empRes.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO employees (name, department, contact_number, relative_contact_number, address, date_of_birth,
                    passport_number, passport_issue, passport_expiry, visa_number, visa_issue, visa_expiry,
                    insurance_provider, insurance_number, insurance_expiry, medical_status, medical_expiry, custom_fields, files)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
                ['Ahmed Khan', 'Operations', '+971501112233', '+971552223344', 'Dubai, UAE', '1990-08-15',
                 'P1234567', '2021-04-01', '2031-03-31', 'V445566', '2023-01-01', '2026-12-31',
                 'Dubai Insurance', 'INS-9001', '2026-10-15', 'Fit', '2026-11-20',
                 JSON.stringify({ "Blood Group": "O+" }), JSON.stringify([])]
            );
        }

        // Seed sample company doc
        const compRes = await client.query(`SELECT COUNT(*) as count FROM company_documents`);
        if (parseInt(compRes.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO company_documents (company_name, trade_license, vat_details, audit_reports, category, legal_docs, custom_fields, files)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                ['DOZANDA FUEL TRADING LLC', 'TL-2026-0001', 'VAT-TRN-100200300', 'FY2025 External Audit',
                 'Certificates', 'Incorporation and legal agreements',
                 JSON.stringify({ "Renewal Month": "December" }), JSON.stringify([])]
            );
        }

        // Seed sample vehicle
        const vehRes = await client.query(`SELECT COUNT(*) as count FROM vehicles`);
        if (parseInt(vehRes.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO vehicles (vehicle_number, insurance_number, insurance_start, insurance_expiry, driver_name, driver_phone, custom_fields, files, photo)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                ['DXB-45721', 'VEH-INS-7788', '2025-06-01', '2026-05-31',
                 'Rashid Ali', '+971507778899', JSON.stringify({ "Fuel Type": "Diesel" }),
                 JSON.stringify([]), null]
            );
        }

        console.log('[DB] PostgreSQL database initialized successfully.');
    } finally {
        client.release();
    }
}

initializeDatabase().catch(err => {
    console.error('[DB] Failed to initialize database:', err.message);
});

module.exports = pool;
