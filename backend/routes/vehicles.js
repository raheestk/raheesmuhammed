const express = require('express');
const router = express.Router();
const pool = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapVehicle = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM vehicles
            ORDER BY LEAST(
                COALESCE(NULLIF(insurance_expiry, ''), '9999-12-31'),
                COALESCE(NULLIF(mulkiya_expiry, ''), '9999-12-31')
            ) ASC
        `);
        res.json(result.rows.map(mapVehicle));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];
    let photo = req.files && req.files['photo'] ? req.files['photo'][0].filename : null;

    const documents = [];
    if (req.files && req.files['files']) {
        req.files['files'].forEach((f, i) => {
            documents.push({ heading: docHeadings[i] || 'Document', filename: f.filename });
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO vehicles (vehicle_number, vehicle_type, mulkiya_number, mulkiya_expiry,
                insurance_number, insurance_start, insurance_expiry, driver_name, driver_phone,
                custom_fields, documents, photo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [data.vehicle_number, data.vehicle_type, data.mulkiya_number, data.mulkiya_expiry,
             data.insurance_number, data.insurance_start, data.insurance_expiry, data.driver_name,
             data.driver_phone, customFields, JSON.stringify(documents), photo]
        );
        res.json({ id: result.rows[0].id, message: "Vehicle added." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    try {
        const rowRes = await pool.query('SELECT documents, photo FROM vehicles WHERE id = $1', [req.params.id]);
        if (rowRes.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found.' });
        const row = rowRes.rows[0];

        let photo = req.files && req.files['photo'] ? req.files['photo'][0].filename : row.photo;
        const uploadedDocs = [];
        if (req.files && req.files['files']) {
            req.files['files'].forEach((f, i) => {
                uploadedDocs.push({ heading: docHeadings[i] || 'Document', filename: f.filename });
            });
        }
        const finalDocs = [...existingDocs, ...uploadedDocs];

        await pool.query(
            `UPDATE vehicles SET vehicle_number=$1, vehicle_type=$2, mulkiya_number=$3, mulkiya_expiry=$4,
                insurance_number=$5, insurance_start=$6, insurance_expiry=$7, driver_name=$8, driver_phone=$9,
                custom_fields=$10, documents=$11, photo=$12 WHERE id=$13`,
            [data.vehicle_number, data.vehicle_type, data.mulkiya_number, data.mulkiya_expiry,
             data.insurance_number, data.insurance_start, data.insurance_expiry, data.driver_name,
             data.driver_phone, customFields, JSON.stringify(finalDocs), photo, req.params.id]
        );
        res.json({ message: 'Vehicle updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
        res.json({ message: "Vehicle deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
