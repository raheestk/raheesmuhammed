const express = require('express');
const router  = express.Router();
const db      = require('../database');
const upload  = require('../middlewares/upload');
const auth    = require('../middlewares/auth');

// GET cheques (filter by status ?status=Pending or ?status=Cleared)
router.get('/', auth, (req, res) => {
  const status = req.query.status || 'Pending';
  // If Pending, sort by cheque_date ASC so upcoming is first
  // If Cleared, sort by deposit_date DESC so most recently cleared is first
  const order = status === 'Pending' ? 'cheque_date ASC' : 'deposit_date DESC';
  
  db.all(
    `SELECT * FROM cheques_v2 WHERE status = ? ORDER BY ${order}`,
    [status],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST – add new pending cheque
router.post('/', auth, upload.single('cheque_image'), (req, res) => {
  const d = req.body;
  
  const image = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO cheques_v2
       (received_date, name, cheque_date, amount, custodian, deposit_date, deposited_bank, status, remark, cheque_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.received_date || null, d.name || 'Unknown', d.cheque_date || null, d.amount || null,
     d.custodian || null, d.deposit_date || null, d.deposited_bank || null,
     d.status || 'Pending', d.remark || null, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Cheque added.' });
    }
  );
});

// PUT – update existing cheque metadata
router.put('/:id', auth, upload.single('cheque_image'), (req, res) => {
  const d = req.body;
  if (!d.name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  db.get('SELECT cheque_image FROM cheques_v2 WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found.' });

    const image = req.file ? req.file.filename : row.cheque_image;

    db.run(
      `UPDATE cheques_v2
       SET received_date=?, name=?, cheque_date=?, amount=?, custodian=?,
           deposit_date=?, deposited_bank=?, status=?, remark=?, cheque_image=?
       WHERE id=?`,
      [d.received_date || null, d.name, d.cheque_date || null, d.amount || null,
       d.custodian || null, d.deposit_date || null, d.deposited_bank || null,
       d.status || 'Pending', d.remark || null, image, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Cheque updated.' });
      }
    );
  });
});

// PATCH - Clear cheque (mark as Cleared, set deposit_date and deposited_bank)
router.patch('/:id/clear', auth, (req, res) => {
  const { deposit_date, deposited_bank } = req.body;
  if (!deposit_date || !deposited_bank) {
    return res.status(400).json({ error: 'Deposit Date and Bank Name are required to clear cheque.' });
  }

  db.run(
    `UPDATE cheques_v2 SET status = 'Cleared', deposit_date = ?, deposited_bank = ? WHERE id = ?`,
    [deposit_date, deposited_bank, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Cheque marked as cleared.' });
    }
  );
});

// DELETE
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cheques_v2 WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cheque deleted.' });
  });
});

module.exports = router;
