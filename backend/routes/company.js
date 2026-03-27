const express = require('express');
const router = express.Router();
const pool = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapDoc = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM company_documents');
        res.json(result.rows.map(mapDoc));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];
    if (!data.company_name) return res.status(400).json({ error: 'Company name is required.' });

    const photoFilename = req.files && req.files['photo'] ? req.files['photo'][0].filename : null;
    const documents = [];
    if (req.files && req.files['files']) {
        req.files['files'].forEach((f, i) => {
            documents.push({ heading: docHeadings[i] || 'Document', filename: f.filename });
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO company_documents
                (company_name, trade_license, vat_details, audit_reports, category, legal_docs, custom_fields, documents, photo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [data.company_name, data.trade_license, data.vat_details, data.audit_reports,
             data.category, data.legal_docs, customFields, JSON.stringify(documents), photoFilename]
        );
        res.json({ id: result.rows[0].id, message: "Company document added." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), async (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    if (!data.company_name) return res.status(400).json({ error: 'Company name is required.' });
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    try {
        const rowRes = await pool.query('SELECT documents, photo FROM company_documents WHERE id = $1', [req.params.id]);
        if (rowRes.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
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
            `UPDATE company_documents SET company_name=$1, trade_license=$2, vat_details=$3,
                audit_reports=$4, category=$5, legal_docs=$6, custom_fields=$7, documents=$8, photo=$9
             WHERE id=$10`,
            [data.company_name, data.trade_license, data.vat_details, data.audit_reports,
             data.category, data.legal_docs, customFields, JSON.stringify(finalDocs), photoFilename, req.params.id]
        );
        res.json({ message: 'Company document updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM company_documents WHERE id = $1', [req.params.id]);
        res.json({ message: "Document deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
