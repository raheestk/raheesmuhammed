import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download, FileText, Trash2, Pencil, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = 'http://localhost:5000';

export default function CompanyDocs() {
  const [docs, setDocs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({ company_name: '', trade_license: '', vat_details: '', audit_reports: '', category: '', legal_docs: '' });
  const [customFields, setCustomFields] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  const fetchDocs = async () => {
    const res = await axios.get(`${API}/api/company`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setDocs(res.data);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleCustomFieldChange = (index, key, value) => {
    const f = [...customFields]; f[index][key] = value; setCustomFields(f);
  };
  const addCustomField = () => setCustomFields([...customFields, { heading: '', value: '' }]);
  const addNewDocField = () => setNewDocuments([...newDocuments, { heading: '', file: null }]);
  const handleNewDocChange = (index, key, value) => {
    const arr = [...newDocuments]; arr[index][key] = value; setNewDocuments(arr);
  };
  const removeExistingDoc = (index) => setExistingDocuments(existingDocuments.filter((_, i) => i !== index));
  const removeNewDoc = (index) => setNewDocuments(newDocuments.filter((_, i) => i !== index));

  const openViewCard = (doc) => { setViewDoc(doc); setIsViewModalOpen(true); };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ company_name: '', trade_license: '', vat_details: '', audit_reports: '', category: '', legal_docs: '' });
    setCustomFields([]); setExistingDocuments([]); setNewDocuments([]); setPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    const customFieldsObj = {};
    customFields.forEach(f => { if (f.heading) customFieldsObj[f.heading] = f.value; });
    data.append('custom_fields', JSON.stringify(customFieldsObj));
    data.append('existing_documents', JSON.stringify(existingDocuments));
    if (photo) data.append('photo', photo);
    const docHeadings = [];
    newDocuments.forEach(nd => { if (nd.file) { data.append('files', nd.file); docHeadings.push(nd.heading); } });
    data.append('document_headings', JSON.stringify(docHeadings));

    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    if (editingId) {
      await axios.put(`${API}/api/company/${editingId}`, data, { headers });
    } else {
      await axios.post(`${API}/api/company`, data, { headers });
    }
    resetForm(); setIsModalOpen(false); fetchDocs();
  };

  const editDoc = (doc) => {
    setEditingId(doc.id);
    setFormData({ company_name: doc.company_name || '', trade_license: doc.trade_license || '', vat_details: doc.vat_details || '', audit_reports: doc.audit_reports || '', category: doc.category || '', legal_docs: doc.legal_docs || '' });
    setCustomFields(Object.entries(doc.custom_fields || {}).map(([heading, value]) => ({ heading, value })));
    setExistingDocuments(doc.documents || []);
    setNewDocuments([]); setPhoto(null);
    setIsModalOpen(true);
  };

  const deleteDoc = async (id) => {
    if (!window.confirm("Delete this document record?")) return;
    await axios.delete(`${API}/api/company/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchDocs();
  };

  const filteredDocs = docs.filter((doc) => {
    const text = `${doc.company_name} ${doc.trade_license} ${doc.vat_details} ${doc.category}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!categoryFilter || doc.category === categoryFilter);
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(docs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Documents");
    XLSX.writeFile(wb, "company-documents.xlsx");
  };

  const exportPDF = () => {
    const d = new jsPDF();
    d.text("Company Documents List", 14, 15);
    d.autoTable({ head: [['Company Name', 'Document Name', 'Trade License']], body: docs.map(doc => [doc.company_name, doc.category, doc.trade_license]), startY: 20 });
    d.save("company-docs.pdf");
  };

  const inputStyle = { flex: 1, padding: '0.5rem 0.75rem', border: '1.5px solid var(--border-color)', borderRadius: '6px', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem' };

  return (
    <div>
      <div className="page-header">
        <h1>Company Documents</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><FileText size={16} /> PDF</button>
          <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}><Plus size={16} /> Add Document</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input placeholder="Search company, document name, VAT..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: '260px', padding: '0.75rem 1rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '0.75rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
          <option value="">All Document Names</option>
          <option value="Certificates">Certificates</option>
          <option value="VAT">VAT</option>
          <option value="Audit">Audit</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SL NO</th>
              <th>Photo</th>
              <th>Company Name</th>
              <th>Document Name</th>
              <th>Trade License</th>
              <th>VAT Details</th>
              <th>Files</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc, index) => (
              <tr key={doc.id}>
                <td>{index + 1}</td>
                <td>
                  {doc.photo
                    ? <img src={`${API}/uploads/company/${doc.photo}`} alt="Doc" className="table-photo" />
                    : <div className="table-photo" style={{ background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="var(--text-muted)" /></div>}
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => openViewCard(doc)}>
                    {doc.company_name}
                  </span>
                </td>
                <td><span className="status-badge status-neutral">{doc.category}</span></td>
                <td>{doc.trade_license}</td>
                <td>{doc.vat_details}</td>
                <td>
                  {doc.documents?.length > 0
                    ? doc.documents.map((d, i) => (
                      <div key={i}>
                        <a href={`${API}/uploads/company/${d.filename}`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                          {d.heading}
                        </a>
                      </div>
                    ))
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => editDoc(doc)}><Pencil size={14} /></button>
                    <button className="btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => deleteDoc(doc.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDocs.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No company documents found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ── DETAIL VIEW MODAL ── */}
      {isViewModalOpen && viewDoc && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2>Document Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="id-card-view">
                {/* Photo column */}
                <div className="id-card-photo-container">
                  <div className="id-card-photo">
                    {viewDoc.photo
                      ? <img src={`${API}/uploads/company/${viewDoc.photo}`} alt="Document" />
                      : <Building2 size={64} color="var(--primary-color)" />}
                  </div>
                  <h3 style={{ textAlign: 'center', fontSize: '1rem', marginTop: '0.5rem', color: 'var(--primary-color)' }}>{viewDoc.company_name}</h3>
                  <span className="status-badge status-neutral">{viewDoc.category}</span>
                </div>

                {/* Detail grid */}
                <div className="id-card-details">
                  <div className="detail-group"><span className="detail-label">Trade License</span><span className="detail-value">{viewDoc.trade_license || '—'}</span></div>
                  <div className="detail-group"><span className="detail-label">VAT Details</span><span className="detail-value">{viewDoc.vat_details || '—'}</span></div>
                  <div className="detail-group"><span className="detail-label">Audit Reports</span><span className="detail-value">{viewDoc.audit_reports || '—'}</span></div>
                  <div className="detail-group"><span className="detail-label">Legal Docs</span><span className="detail-value">{viewDoc.legal_docs || '—'}</span></div>
                  {Object.entries(viewDoc.custom_fields || {}).map(([key, val], i) => (
                    <div className="detail-group" key={i}><span className="detail-label">{key}</span><span className="detail-value">{val}</span></div>
                  ))}
                </div>
              </div>

              {/* Uploaded files */}
              {viewDoc.documents?.length > 0 && (
                <div className="dynamic-fields-card" style={{ marginTop: 0 }}>
                  <h4>Uploaded Documents</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {viewDoc.documents.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-solid)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.heading}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <a href={`${API}/uploads/company/${d.filename}`} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>View ↗</a>
                          <a href={`${API}/uploads/company/${d.filename}`} download
                            style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', background: 'var(--accent-light)', padding: '2px 10px', borderRadius: '50px', border: '1px solid var(--accent-color)' }}>⬇ Download</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Company Document' : 'Add Company Document'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>

                {/* ── Photo upload ── */}
                <div className="dynamic-fields-card" style={{ marginTop: 0, marginBottom: '1.5rem', background: 'var(--primary-light)', borderColor: 'var(--primary-color)', borderStyle: 'dashed' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16} /> Document / Company Photo</h4>
                  <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Upload a logo, stamp, or photo of the document. Leave empty to keep existing.</p>
                </div>

                <div className="form-grid">
                  <div className="input-group"><label>Company Name</label><input required value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} /></div>
                  <div className="input-group">
                    <label>Document Name</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="">Select Document Name...</option>
                      <option value="Certificates">Certificates</option>
                      <option value="VAT">VAT</option>
                      <option value="Audit">Audit</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="input-group"><label>Trade License</label><input value={formData.trade_license} onChange={e => setFormData({ ...formData, trade_license: e.target.value })} /></div>
                  <div className="input-group"><label>VAT Details</label><input value={formData.vat_details} onChange={e => setFormData({ ...formData, vat_details: e.target.value })} /></div>
                  <div className="input-group full-width"><label>Audit Reports / Legal Docs</label><input value={formData.legal_docs} onChange={e => setFormData({ ...formData, legal_docs: e.target.value })} /></div>
                </div>

                <div className="dynamic-fields-card">
                  <h4>Attached Files (with Custom Headings)</h4>
                  {existingDocuments.map((d, idx) => (
                    <div key={idx} className="document-item">
                      <div>
                        <span className="document-heading">{d.heading}: </span>
                        <a href={`${API}/uploads/company/${d.filename}`} target="_blank" rel="noreferrer" className="document-file">{d.filename}</a>
                      </div>
                      <button type="button" className="btn-danger" style={{ padding: '4px 10px' }} onClick={() => removeExistingDoc(idx)}>Remove</button>
                    </div>
                  ))}
                  {newDocuments.map((nd, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                      <input placeholder="File Heading (e.g. Trade License 2024)" required value={nd.heading} onChange={e => handleNewDocChange(idx, 'heading', e.target.value)} style={inputStyle} />
                      <input type="file" required onChange={e => handleNewDocChange(idx, 'file', e.target.files[0])} style={{ flex: 1 }} />
                      <button type="button" className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => removeNewDoc(idx)}>&times;</button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" style={{ marginTop: '12px' }} onClick={addNewDocField}>+ Attach File</button>
                </div>

                <div className="dynamic-fields-card">
                  <h4>Custom Data Fields</h4>
                  {customFields.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <input placeholder="Field Name" value={field.heading} onChange={e => handleCustomFieldChange(idx, 'heading', e.target.value)} style={inputStyle} />
                      <input placeholder="Value" value={field.value} onChange={e => handleCustomFieldChange(idx, 'value', e.target.value)} style={inputStyle} />
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" style={{ marginTop: '12px' }} onClick={addCustomField}>+ Add Custom Field</button>
                </div>

                <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ width: '220px' }}>Save Document</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
