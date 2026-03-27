const express = require('express');
const router  = express.Router();
const pool    = require('../database');
const upload  = require('../middlewares/upload');
const auth    = require('../middlewares/auth');

// GET cheques (filter by status ?status=Pending or ?status=Cleared)
router.get('/', auth, async (req, res) => {
  const status = req.query.status || 'Pending';
  const order = status === 'Pending' ? 'cheque_date ASC' : 'deposit_date DESC';

  try {
    const result = await pool.query(
      `SELECT * FROM cheques_v2 WHERE status = $1 ORDER BY ${order}`,
      [status]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – add new cheque
router.post('/', auth, upload.single('cheque_image'), async (req, res) => {
  const d = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    const result = await pool.query(
      `INSERT INTO cheques_v2
         (received_date, name, cheque_date, amount, custodian, deposit_date, deposited_bank, status, remark, cheque_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [d.received_date || null, d.name || 'Unknown', d.cheque_date || null, d.amount || null,
       d.custodian || null, d.deposit_date || null, d.deposited_bank || null,
       d.status || 'Pending', d.remark || null, image]
    );
    res.json({ id: result.rows[0].id, message: 'Cheque added.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT – update existing cheque
router.put('/:id', auth, upload.single('cheque_image'), async (req, res) => {
  const d = req.body;
  if (!d.name) return res.status(400).json({ error: 'Name is required.' });

  try {
    const rowRes = await pool.query('SELECT cheque_image FROM cheques_v2 WHERE id = $1', [req.params.id]);
    if (rowRes.rows.length === 0) return res.status(404).json({ error: 'Not found.' });

    const image = req.file ? req.file.filename : rowRes.rows[0].cheque_image;

    await pool.query(
      `UPDATE cheques_v2
       SET received_date=$1, name=$2, cheque_date=$3, amount=$4, custodian=$5,
           deposit_date=$6, deposited_bank=$7, status=$8, remark=$9, cheque_image=$10
       WHERE id=$11`,
      [d.received_date || null, d.name, d.cheque_date || null, d.amount || null,
       d.custodian || null, d.deposit_date || null, d.deposited_bank || null,
       d.status || 'Pending', d.remark || null, image, req.params.id]
    );
    res.json({ message: 'Cheque updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH – clear cheque
router.patch('/:id/clear', auth, async (req, res) => {
  const { deposit_date, deposited_bank } = req.body;
  if (!deposit_date || !deposited_bank) {
    return res.status(400).json({ error: 'Deposit Date and Bank Name are required to clear cheque.' });
  }

  try {
    await pool.query(
      `UPDATE cheques_v2 SET status = 'Cleared', deposit_date = $1, deposited_bank = $2 WHERE id = $3`,
      [deposit_date, deposited_bank, req.params.id]
    );
    res.json({ message: 'Cheque marked as cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cheques_v2 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cheque deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
