const express = require('express');
const router = express.Router();
const db = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapDoc = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, (req, res) => {
    db.all('SELECT * FROM company_documents', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(mapDoc));
    });
});

router.post('/', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];
    if (!data.company_name) return res.status(400).json({ error: 'Company name is required.' });
    
    const photoFilename = req.files && req.files['photo'] ? req.files['photo'][0].filename : null;

    const documents = [];
    if (req.files && req.files['files']) {
        req.files['files'].forEach((f, i) => {
            documents.push({
                heading: docHeadings[i] || 'Document',
                filename: f.filename
            });
        });
    }

    db.run(`INSERT INTO company_documents (company_name, trade_license, vat_details, audit_reports, category, legal_docs, custom_fields, documents, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [data.company_name, data.trade_license, data.vat_details, data.audit_reports, data.category, data.legal_docs, customFields, JSON.stringify(documents), photoFilename], 
    function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Company document added." });
    });
});

router.put('/:id', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    if (!data.company_name) return res.status(400).json({ error: 'Company name is required.' });
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    db.get('SELECT documents, photo FROM company_documents WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Record not found.' });

        const photoFilename = req.files && req.files['photo'] ? req.files['photo'][0].filename : row.photo;

        const uploadedDocs = [];
        if (req.files && req.files['files']) {
            req.files['files'].forEach((f, i) => {
                uploadedDocs.push({
                    heading: docHeadings[i] || 'Document',
                    filename: f.filename
                });
            });
        }
        const finalDocs = [...existingDocs, ...uploadedDocs];

        db.run(`UPDATE company_documents SET company_name=?, trade_license=?, vat_details=?, audit_reports=?, category=?, legal_docs=?, custom_fields=?, documents=?, photo=? WHERE id=?`,
            [data.company_name, data.trade_license, data.vat_details, data.audit_reports, data.category, data.legal_docs, customFields, JSON.stringify(finalDocs), photoFilename, req.params.id],
            function(updateErr) {
                if (updateErr) return res.status(500).json({ error: updateErr.message });
                res.json({ message: 'Company document updated.' });
            }
        );
    });
});

router.delete('/:id', auth, (req, res) => {
    db.run(`DELETE FROM company_documents WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Document deleted" });
    });
});

module.exports = router;
