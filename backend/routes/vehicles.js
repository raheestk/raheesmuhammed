const express = require('express');
const router = express.Router();
const db = require('../database');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const mapVehicle = (row) => ({
    ...row,
    documents: row.documents ? JSON.parse(row.documents) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
});

router.get('/', auth, (req, res) => {
    // Sort by the earliest expiry date between insurance and mulkiya
    const query = `
      SELECT * FROM vehicles
      ORDER BY MIN(
        COALESCE(insurance_expiry, '9999-12-31'),
        COALESCE(mulkiya_expiry, '9999-12-31')
      ) ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(mapVehicle));
    });
});

router.post('/', auth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'photo', maxCount: 1 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    let photo = req.files && req.files['photo'] ? req.files['photo'][0].filename : null;
    
    const documents = [];
    if (req.files && req.files['files']) {
        req.files['files'].forEach((f, i) => {
            documents.push({
                heading: docHeadings[i] || 'Document',
                filename: f.filename
            });
        });
    }

    db.run(`INSERT INTO vehicles (vehicle_number, vehicle_type, mulkiya_number, mulkiya_expiry, insurance_number, insurance_start, insurance_expiry, driver_name, driver_phone, custom_fields, documents, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [data.vehicle_number, data.vehicle_type, data.mulkiya_number, data.mulkiya_expiry, data.insurance_number, data.insurance_start, data.insurance_expiry, data.driver_name, data.driver_phone, customFields, JSON.stringify(documents), photo], 
    function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Vehicle added." });
    });
});

router.put('/:id', auth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'photo', maxCount: 1 }]), (req, res) => {
    const data = req.body;
    const customFields = data.custom_fields || "{}";
    const existingDocs = data.existing_documents ? JSON.parse(data.existing_documents) : [];
    const docHeadings = data.document_headings ? JSON.parse(data.document_headings) : [];

    db.get('SELECT documents, photo FROM vehicles WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Vehicle not found.' });

        let photo = req.files && req.files['photo'] ? req.files['photo'][0].filename : row.photo;
        
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

        db.run(`UPDATE vehicles SET vehicle_number=?, vehicle_type=?, mulkiya_number=?, mulkiya_expiry=?, insurance_number=?, insurance_start=?, insurance_expiry=?, driver_name=?, driver_phone=?, custom_fields=?, documents=?, photo=? WHERE id=?`,
            [data.vehicle_number, data.vehicle_type, data.mulkiya_number, data.mulkiya_expiry, data.insurance_number, data.insurance_start, data.insurance_expiry, data.driver_name, data.driver_phone, customFields, JSON.stringify(finalDocs), photo, req.params.id],
            function(updateErr) {
                if (updateErr) return res.status(500).json({ error: updateErr.message });
                res.json({ message: 'Vehicle updated.' });
            }
        );
    });
});

router.delete('/:id', auth, (req, res) => {
    db.run(`DELETE FROM vehicles WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Vehicle deleted" });
    });
});

module.exports = router;
