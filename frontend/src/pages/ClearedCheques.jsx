import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Trash2, Banknote, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = 'http://localhost:5000';

export default function ClearedCheques() {
  const [cheques, setCheques] = useState([]);
  const [query, setQuery] = useState('');

  const fetchCheques = async () => {
    const res = await axios.get(`${API}/api/cheques?status=Cleared`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setCheques(res.data);
  };

  useEffect(() => { fetchCheques(); }, []);

  const deleteCheque = async (id) => {
    if (!window.confirm("Delete this cleared cheque record?")) return;
    await axios.delete(`${API}/api/cheques/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchCheques();
  };

  const filteredCheques = cheques.filter((c) => {
    const text = `${c.name} ${c.deposited_bank} ${c.remark}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(cheques);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cleared Cheques");
    XLSX.writeFile(wb, "cleared-cheques.xlsx");
  };

  const exportPDF = () => {
    const d = new jsPDF('landscape');
    d.text("Cleared Cheques List", 14, 15);
    d.autoTable({ 
      head: [['Bank Name', 'Payee Name', 'Amount', 'Deposit Date', 'Cheque Date', 'Remark']], 
      body: cheques.map(c => [
        c.deposited_bank, c.name, c.amount, c.deposit_date, c.cheque_date, c.remark
      ]), 
      startY: 20 
    });
    d.save("cleared-cheques.pdf");
  };

  return (
    <div>
      <div className="page-header">
        <h1>Cleared Cheques</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><FileText size={16} /> PDF</button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input placeholder="Search payee, bank name, remark..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '380px', padding: '0.75rem 1rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Status</th>
              <th>Deposited Bank</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Deposit Date</th>
              <th>Cheque Date</th>
              <th>Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheques.map((chq) => (
              <tr key={chq.id}>
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
                <td><span className="status-badge status-success" style={{display:'flex', alignItems:'center', gap:'4px'}}><CheckCircle size={12}/> Cleared</span></td>
                <td style={{fontWeight:800, color:'var(--primary-color)'}}>{chq.deposited_bank}</td>
                <td style={{fontWeight:800, color:'var(--text-primary)'}}>{chq.name}</td>
                <td style={{fontWeight:800}}>{chq.amount ? Number(chq.amount).toLocaleString() : '—'}</td>
                <td style={{fontWeight:800, color:'var(--text-primary)'}}>{chq.deposit_date}</td>
                <td>{chq.cheque_date || '—'}</td>
                <td style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>{chq.remark || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => deleteCheque(chq.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCheques.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No cleared cheques found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
