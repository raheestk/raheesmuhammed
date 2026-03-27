const express = require('express');
const router = express.Router();
const db = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapEmployee = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, (req, res) => {
    db.all('SELECT * FROM employees', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(mapEmployee));
    });
});

router.post('/', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}"; 
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : []; 

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

    db.run(`INSERT INTO employees (name, department, contact_number, relative_contact_number, address, date_of_birth, passport_number, passport_issue, passport_expiry, visa_number, visa_issue, visa_expiry, insurance_provider, insurance_number, insurance_expiry, medical_status, medical_expiry, custom_fields, documents, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [data.name, data.department, data.contact_number, data.relative_contact_number, data.address, data.date_of_birth, data.passport_number, data.passport_issue, data.passport_expiry, data.visa_number, data.visa_issue, data.visa_expiry, data.insurance_provider, data.insurance_number, data.insurance_expiry, data.medical_status, data.medical_expiry, customFields, JSON.stringify(documents), photoFilename], 
    function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Employee registered." });
    });
});

router.put('/:id', auth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files', maxCount: 10 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    db.get('SELECT documents, photo FROM employees WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found.' });

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

        db.run(`UPDATE employees SET name=?, department=?, contact_number=?, relative_contact_number=?, address=?, date_of_birth=?, passport_number=?, passport_issue=?, passport_expiry=?, visa_number=?, visa_issue=?, visa_expiry=?, insurance_provider=?, insurance_number=?, insurance_expiry=?, medical_status=?, medical_expiry=?, custom_fields=?, documents=?, photo=? WHERE id=?`,
            [data.name, data.department, data.contact_number, data.relative_contact_number, data.address, data.date_of_birth, data.passport_number, data.passport_issue, data.passport_expiry, data.visa_number, data.visa_issue, data.visa_expiry, data.insurance_provider, data.insurance_number, data.insurance_expiry, data.medical_status, data.medical_expiry, customFields, JSON.stringify(finalDocs), photoFilename, req.params.id],
            function(updateErr) {
                if (updateErr) return res.status(500).json({ error: updateErr.message });
                res.json({ message: 'Employee updated.' });
            }
        );
    });
});

router.delete('/:id', auth, (req, res) => {
    db.run(`DELETE FROM employees WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

module.exports = router;
