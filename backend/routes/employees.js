const express = require('express');
const router = express.Router();
const pool = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapEmployee = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees');
        res.json(result.rows.map(mapEmployee));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];
    const photoFilename = req.files && req.files['photo'] ? req.files['photo'][0].filename : null;

    const documents = [];
    if (req.files && req.files['files']) {
        req.files['files'].forEach((f, i) => {
            documents.push({ heading: docHeadings[i] || 'Document', filename: f.filename });
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO employees (name, department, contact_number, relative_contact_number, address, date_of_birth,
                passport_number, passport_issue, passport_expiry, visa_number, visa_issue, visa_expiry,
                insurance_provider, insurance_number, insurance_expiry, medical_status, medical_expiry,
                custom_fields, documents, photo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
             RETURNING id`,
            [data.name, data.department, data.contact_number, data.relative_contact_number, data.address,
             data.date_of_birth, data.passport_number, data.passport_issue, data.passport_expiry,
             data.visa_number, data.visa_issue, data.visa_expiry, data.insurance_provider,
             data.insurance_number, data.insurance_expiry, data.medical_status, data.medical_expiry,
             customFields, JSON.stringify(documents), photoFilename]
        );
        res.json({ id: result.rows[0].id, message: "Employee registered." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    try {
        const rowRes = await pool.query('SELECT documents, photo FROM employees WHERE id = $1', [req.params.id]);
        if (rowRes.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
        const row = rowRes.rows[0];

        const photoFilename = req.files && req.files['photo'] ? req.files['photo'][0].filename : row.photo;
        const uploadedDocs = [];
        if (req.files && req.files['files']) {
            req.files['files'].forEach((f, i) => {
                uploadedDocs.push({ heading: docHeadings[i] || 'Document', filename: f.filename });
            });
        }
        const finalDocs = [...existingDocs, ...uploadedDocs];

        await pool.query(
            `UPDATE employees SET name=$1, department=$2, contact_number=$3, relative_contact_number=$4,
                address=$5, date_of_birth=$6, passport_number=$7, passport_issue=$8, passport_expiry=$9,
                visa_number=$10, visa_issue=$11, visa_expiry=$12, insurance_provider=$13, insurance_number=$14,
                insurance_expiry=$15, medical_status=$16, medical_expiry=$17, custom_fields=$18,
                documents=$19, photo=$20 WHERE id=$21`,
            [data.name, data.department, data.contact_number, data.relative_contact_number, data.address,
             data.date_of_birth, data.passport_number, data.passport_issue, data.passport_expiry,
             data.visa_number, data.visa_issue, data.visa_expiry, data.insurance_provider,
             data.insurance_number, data.insurance_expiry, data.medical_status, data.medical_expiry,
             customFields, JSON.stringify(finalDocs), photoFilename, req.params.id]
        );
        res.json({ message: 'Employee updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
