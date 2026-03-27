import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download, FileText, Trash2, Pencil, Banknote, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = 'http://localhost:5000';

export default function PendingCheques() {
  const [cheques, setCheques] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clearingId, setClearingId] = useState(null);
  const [query, setQuery] = useState('');
  
  const [formData, setFormData] = useState({
    received_date: '',
    name: '',
    cheque_date: '',
    amount: '',
    custodian: '',
    remark: ''
  });
  
  const [clearData, setClearData] = useState({
    deposit_date: '',
    deposited_bank: ''
  });

  const [chequeImage, setChequeImage] = useState(null);

  const fetchCheques = async () => {
    const res = await axios.get(`${API}/api/cheques?status=Pending`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setCheques(res.data);
  };

  useEffect(() => { fetchCheques(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ received_date: '', name: '', cheque_date: '', amount: '', custodian: '', remark: '' });
    setChequeImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (chequeImage) data.append('cheque_image', chequeImage);

    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    if (editingId) {
      await axios.put(`${API}/api/cheques/${editingId}`, data, { headers });
    } else {
      await axios.post(`${API}/api/cheques`, data, { headers });
    }
    resetForm(); setIsModalOpen(false); fetchCheques();
  };

  const handleClearSubmit = async (e) => {
    e.preventDefault();
    await axios.patch(`${API}/api/cheques/${clearingId}/clear`, clearData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setClearingId(null);
    setClearData({ deposit_date: '', deposited_bank: '' });
    setIsClearModalOpen(false);
    fetchCheques();
  };

  const editCheque = (chq) => {
    setEditingId(chq.id);
    setFormData({
      received_date: chq.received_date || '',
      name: chq.name || '',
      cheque_date: chq.cheque_date || '',
      amount: chq.amount || '',
      custodian: chq.custodian || '',
      remark: chq.remark || ''
    });
    setChequeImage(null);
    setIsModalOpen(true);
  };

  const openClearModal = (id) => {
    setClearingId(id);
    setClearData({ deposit_date: new Date().toISOString().split('T')[0], deposited_bank: '' });
    setIsClearModalOpen(true);
  };

  const deleteCheque = async (id) => {
    if (!window.confirm("Delete this cheque record?")) return;
    await axios.delete(`${API}/api/cheques/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchCheques();
  };

  const getRowClass = (chequeDateStr) => {
    if (!chequeDateStr) return '';
    const chqDate = new Date(chequeDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    chqDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((chqDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'highlight-row-danger';
    if (diffDays === 2 || diffDays === 3) return 'highlight-row-warning';
    return '';
  };

  const getStatusBadge = (chequeDateStr) => {
    if (!chequeDateStr) return <span className="status-badge status-neutral">Pending</span>;
    const chqDate = new Date(chequeDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    chqDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((chqDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="status-badge status-danger">Overdue</span>;
    if (diffDays === 0) return <span className="status-badge status-danger">Due Today!</span>;
    if (diffDays === 1) return <span className="status-badge status-danger">Due Tmrw</span>;
    if (diffDays === 2 || diffDays === 3) return <span className="status-badge status-warning">Soon ({diffDays}d)</span>;
    return <span className="status-badge status-success">In {diffDays} days</span>;
  };

  const filteredCheques = cheques.filter((c) => {
    const text = `${c.name} ${c.custodian} ${c.remark}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(cheques);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pending Cheques");
    XLSX.writeFile(wb, "pending-cheques.xlsx");
  };

  const exportPDF = () => {
    const d = new jsPDF('landscape');
    d.text("Pending Cheques List", 14, 15);
    d.autoTable({ 
      head: [['Received Date', 'Name', 'Cheque Date', 'Amount', 'Custodian', 'Remark']], 
      body: cheques.map(c => [
        c.received_date, c.name, c.cheque_date, c.amount, c.custodian, c.remark
      ]), 
      startY: 20 
    });
    d.save("pending-cheques.pdf");
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pending Cheques</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><FileText size={16} /> PDF</button>
          <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}><Plus size={16} /> Add Cheque</button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input placeholder="Search payee, custodian, remark..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '380px', padding: '0.75rem 1rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Received Date</th>
              <th>Name</th>
              <th>Cheque Date</th>
              <th>Amount</th>
              <th>Custodian</th>
              <th>Status</th>
              <th>Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheques.map((chq) => (
              <tr key={chq.id} className={getRowClass(chq.cheque_date)}>
                <td>
                  {chq.cheque_image ? (
                    <div style={{display:'flex', gap:'8px', flexDirection:'column', alignItems:'center'}}>
                      <a href={`${API}/uploads/cheques/${chq.cheque_image}`} target="_blank" rel="noreferrer">
                        <img src={`${API}/uploads/cheques/${chq.cheque_image}`} alt="Cheque" className="table-photo" style={{width:'80px', height:'40px', objectFit:'cover', borderRadius:'6px'}} />
                      </a>
                      <a href={`${API}/uploads/cheques/${chq.cheque_image}`} download style={{fontSize:'0.65rem', fontWeight:'bold', color:'var(--primary-color)', textDecoration:'none', border:'1px solid var(--border-color)', padding:'1px 6px', borderRadius:'4px'}}>Download</a>
                    </div>
                  ) : (
                    <div className="table-photo" style={{ width:'80px', height:'40px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface-hover)' }}>
                      <Banknote size={18} color="var(--text-muted)" />
                    </div>
                  )}
                </td>
                <td style={{fontWeight:600}}>{chq.received_date || '—'}</td>
                <td style={{fontWeight:800, color:'var(--text-primary)'}}>{chq.name}</td>
                <td style={{fontWeight:800, color:'var(--text-primary)'}}>{chq.cheque_date || '—'}</td>
                <td style={{fontWeight:800, color:'var(--primary-color)'}}>{chq.amount ? Number(chq.amount).toLocaleString() : '—'}</td>
                <td>{chq.custodian || '—'}</td>
                <td>{getStatusBadge(chq.cheque_date)}</td>
                <td style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>{chq.remark || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.6rem', background: '#2D8653', borderColor: '#2D8653' }} onClick={() => openClearModal(chq.id)} title="Mark as Cleared"><CheckCircle size={14} /></button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => editCheque(chq)}><Pencil size={14} /></button>
                    <button className="btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => deleteCheque(chq.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCheques.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No pending cheques found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Cheque' : 'Add Pending Cheque'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="dynamic-fields-card" style={{ marginTop: 0, marginBottom: '1.5rem', background: 'var(--primary-light)', borderColor: 'var(--primary-color)', borderStyle: 'dashed' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin:0, marginBottom:'10px' }}><Banknote size={16} /> Cheque Image</h4>
                  <input type="file" accept="image/*" onChange={e => setChequeImage(e.target.files[0])} style={{width:'100%', padding:'0.5rem', background:'var(--surface-color)', border:'1px solid var(--border-color)', borderRadius:'6px', color:'var(--text-primary)'}} />
                </div>

                <div className="form-grid">
                  <div className="input-group"><label>Payee / Name</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="input-group"><label>Amount</label><input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
                  <div className="input-group"><label>Cheque Received Date</label><input type="date" value={formData.received_date} onChange={e => setFormData({ ...formData, received_date: e.target.value })} /></div>
                  <div className="input-group"><label>Cheque Date <span style={{color:'var(--danger-color)'}}>*</span></label><input type="date" required value={formData.cheque_date} onChange={e => setFormData({ ...formData, cheque_date: e.target.value })} /></div>
                  <div className="input-group"><label>Custodian</label><input value={formData.custodian} onChange={e => setFormData({ ...formData, custodian: e.target.value })} /></div>
                  <div className="input-group full-width"><label>Remark</label><input value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} /></div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ width: '220px' }}>Save Cheque</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAR CHEQUE MODAL ── */}
      {isClearModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ background: '#2D8653', borderBottom: 'none' }}>
              <h2>Mark as Cleared</h2>
              <button onClick={() => setIsClearModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleClearSubmit}>
                <div className="input-group">
                  <label>Deposit Date <span style={{color:'var(--danger-color)'}}>*</span></label>
                  <input type="date" required value={clearData.deposit_date} onChange={e => setClearData({ ...clearData, deposit_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Deposited Bank Name <span style={{color:'var(--danger-color)'}}>*</span></label>
                  <input required placeholder="e.g. Emirates NBD" value={clearData.deposited_bank} onChange={e => setClearData({ ...clearData, deposited_bank: e.target.value })} />
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', background: '#2D8653', boxShadow: 'none' }}>Confirm Clearance</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
