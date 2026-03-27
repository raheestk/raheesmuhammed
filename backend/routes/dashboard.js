const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middlewares/auth');

router.get('/stats', auth, (req, res) => {
    const stats = { employees: 0, vehicles: 0, company_documents: 0 };
    
    db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
        if (!err && row) stats.employees = row.count;
        
        db.get('SELECT COUNT(*) as count FROM vehicles', [], (err, row) => {
            if (!err && row) stats.vehicles = row.count;
            
            db.get('SELECT COUNT(*) as count FROM company_documents', [], (err, row) => {
                if (!err && row) stats.company_documents = row.count;
                
                res.json(stats);
            });
        });
    });
});

module.exports = router;
