import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download, FileText, Trash2, Pencil, Car } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = 'http://localhost:5000';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEntity, setViewEntity] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  
  const [formData, setFormData] = useState({
    vehicle_number: '', vehicle_type: '', driver_name: '', driver_phone: '',
    mulkiya_number: '', mulkiya_expiry: '', insurance_number: '', insurance_start: '', insurance_expiry: ''
  });
  const [customFields, setCustomFields] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  const fetchVehicles = async () => {
    const res = await axios.get(`${API}/api/vehicles`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    setVehicles(res.data);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleCustomFieldChange = (index, key, value) => {
    const newFields = [...customFields];
    newFields[index][key] = value;
    setCustomFields(newFields);
  };
  const addCustomField = () => setCustomFields([...customFields, { heading: '', value: '' }]);
  const addNewDocField = () => setNewDocuments([...newDocuments, { heading: '', file: null }]);
  const handleNewDocChange = (index, key, value) => {
    const arr = [...newDocuments];
    arr[index][key] = value;
    setNewDocuments(arr);
  };
  const removeExistingDoc = (index) => setExistingDocuments(existingDocuments.filter((_, i) => i !== index));
  const removeNewDoc = (index) => setNewDocuments(newDocuments.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    const customFieldsObj = {};
    customFields.forEach(f => { if(f.heading) customFieldsObj[f.heading] = f.value; });
    data.append('custom_fields', JSON.stringify(customFieldsObj));
    data.append('existing_documents', JSON.stringify(existingDocuments));

    if (photo) data.append('photo', photo);

    const docHeadings = [];
    newDocuments.forEach(nd => {
      if (nd.file) {
        data.append('files', nd.file);
        docHeadings.push(nd.heading);
      }
    });
    data.append('document_headings', JSON.stringify(docHeadings));

    if (editingId) {
      await axios.put(`${API}/api/vehicles/${editingId}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    } else {
      await axios.post(`${API}/api/vehicles`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    }
    
    setEditingId(null);
    setFormData({ vehicle_number: '', vehicle_type: '', driver_name: '', driver_phone: '', mulkiya_number: '', mulkiya_expiry: '', insurance_number: '', insurance_start: '', insurance_expiry: '' });
    setCustomFields([]); setExistingDocuments([]); setNewDocuments([]); setPhoto(null);
    setIsModalOpen(false);
    fetchVehicles();
  };

  const editVehicle = (v) => {
    setEditingId(v.id);
    setFormData({
      vehicle_number: v.vehicle_number || '', vehicle_type: v.vehicle_type || '', driver_name: v.driver_name || '', driver_phone: v.driver_phone || '',
      mulkiya_number: v.mulkiya_number || '', mulkiya_expiry: v.mulkiya_expiry || '',
      insurance_number: v.insurance_number || '', insurance_start: v.insurance_start || '', insurance_expiry: v.insurance_expiry || ''
    });
    setCustomFields(Object.entries(v.custom_fields || {}).map(([heading, value]) => ({ heading, value })));
    setExistingDocuments(v.documents || []);
    setNewDocuments([]);
    setPhoto(null);
    setIsModalOpen(true);
  };

  const openViewCard = (v) => {
    setViewEntity(v);
    setIsViewModalOpen(true);
  }

  const deleteVehicle = async (id) => {
    if(!window.confirm("Delete vehicle?")) return;
    await axios.delete(`${API}/api/vehicles/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchVehicles();
  };

  // Helper to get nearest expiry date between insurance and mulkiya
  const getNearestExpiry = (insDate, mulkDate) => {
    if (!insDate && !mulkDate) return null;
    const d1 = insDate ? new Date(insDate) : new Date('2099-12-31');
    const d2 = mulkDate ? new Date(mulkDate) : new Date('2099-12-31');
    return d1 < d2 ? insDate : mulkDate;
  };

  const getStatusClass = (dateStr) => {
    if (!dateStr) return 'status-neutral';
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(dateStr);
    expDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'status-danger';
    if (diffDays <= 30) return 'status-warning';
    return 'status-success';
  };

  const getRowHighlight = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(dateStr);
    expDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'highlight-row-danger';
    if (diffDays <= 30) return 'highlight-row-warning';
    return '';
  }

  const sortedAndFiltered = vehicles
    .filter((v) => `${v.vehicle_number} ${v.driver_name} ${v.vehicle_type} ${v.mulkiya_number} ${v.insurance_number}`.toLowerCase().includes(query.toLowerCase()));

  const exportExcel = () => { /* ... */ };
  const exportPDF = () => {
    const d = new jsPDF('landscape');
    d.text("Vehicles List (Sorted by Earliest Expiry)", 14, 15);
    d.autoTable({
        head: [['Vehicle Number', 'Type', 'Driver Name', 'Mulkiya No', 'Mulkiya Expiry', 'Insurance Expiry']],
        body: sortedAndFiltered.map(v => [v.vehicle_number, v.vehicle_type, v.driver_name, v.mulkiya_number || '-', v.mulkiya_expiry || '-', v.insurance_expiry || '-']),
        startY: 20
    });
    d.save("vehicles.pdf");
  };

  return (
    <div>
      <div className="page-header">
        <h1>Vehicles Fleet</h1>
        <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
          <button className="btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><FileText size={16} /> PDF</button>
          <button className="btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ vehicle_number: '', vehicle_type: '', driver_name: '', driver_phone: '', mulkiya_number: '', mulkiya_expiry: '', insurance_number: '', insurance_start: '', insurance_expiry: '' });
            setCustomFields([]); setExistingDocuments([]); setNewDocuments([]); setPhoto(null);
            setIsModalOpen(true);
          }}><Plus size={16}/> Add Vehicle</button>
        </div>
      </div>
      
      <div style={{marginBottom: '1.5rem'}}>
        <input placeholder="Search vehicles by number, driver, mulkiya..." value={query} onChange={(e)=>setQuery(e.target.value)} style={{maxWidth:'380px', width:'100%', padding:'0.75rem', border:'1.5px solid var(--border-color)', borderRadius:'8px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Vehicle Number / Ownership Type</th>
              <th>Driver Info</th>
              <th>Mulkiya No</th>
              <th>Mulkiya Expiry</th>
              <th>Insurance Expiry</th>
              <th>Status (Nearest)</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((v) => {
              const nearestExpiry = getNearestExpiry(v.insurance_expiry, v.mulkiya_expiry);
              const hlClass = getRowHighlight(nearestExpiry);
              return (
              <tr key={v.id} className={hlClass}>
                <td>
                  {v.photo ? <img src={`${API}/uploads/vehicles/photos/${v.photo}`} alt="Veh" className="table-photo" /> : <div className="table-photo" style={{background:'var(--surface-hover)'}}><Car size={18} color="var(--text-muted)"/></div>}
                </td>
                <td>
                  <span style={{fontWeight: '900', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline'}} onClick={(e) => { e.stopPropagation(); openViewCard(v); }}>
                    {v.vehicle_number}
                  </span>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700}}>{v.vehicle_type || '—'}</div>
                </td>
                <td><span style={{fontWeight: 700}}>{v.driver_name}</span> <br/><small style={{color:'var(--text-secondary)'}}>{v.driver_phone}</small></td>
                <td><span style={{fontWeight: 700}}>{v.mulkiya_number || '—'}</span></td>
                <td><span style={{fontWeight: 700}}>{v.mulkiya_expiry || '—'}</span></td>
                <td><span style={{fontWeight: 700}}>{v.insurance_expiry || '—'}</span></td>
                <td><span className={`status-badge ${getStatusClass(nearestExpiry)}`}>{nearestExpiry || 'N/A'}</span></td>
                <td style={{display: 'flex', gap: '8px', justifyContent:'flex-end'}}>
                  <button className="btn-secondary" style={{padding: '0.4rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); editVehicle(v); }}><Pencil size={14}/></button>
                  <button className="btn-danger" style={{padding: '0.4rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); deleteVehicle(v.id); }}><Trash2 size={14}/></button>
                </td>
              </tr>
            )})}
            {sortedAndFiltered.length === 0 && <tr><td colSpan="8" style={{textAlign: 'center', padding: '2.5rem'}}>No vehicles found.</td></tr>}
          </tbody>
        </table>
      </div>

      {isViewModalOpen && viewEntity && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h2>Vehicle Detailed File</h2>
              <button onClick={() => setIsViewModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color: '#fff'}}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="id-card-view">
                <div className="id-card-photo-container">
                  <div className="id-card-photo" style={{borderRadius:'8px'}}>
                    {viewEntity.photo ? <img src={`${API}/uploads/vehicles/photos/${viewEntity.photo}`} alt="Vehicle" style={{borderRadius:'6px'}} /> : <Car size={64} color="var(--text-secondary)" />}
                  </div>
                  <h3 style={{marginTop: '0.8rem', textAlign:'center', fontSize:'1.25rem', marginBottom:'0', color:'var(--text-primary)'}}>{viewEntity.vehicle_number}</h3>
                  <div style={{textAlign:'center', fontSize:'0.9rem', color:'var(--primary-color)', fontWeight:800}}>{viewEntity.vehicle_type}</div>
                </div>
                
                <div className="id-card-details">
                  <div className="detail-group"><span className="detail-label">Driver Name</span><span className="detail-value">{viewEntity.driver_name || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Driver Phone</span><span className="detail-value">{viewEntity.driver_phone || '-'}</span></div>
                  
                  <div className="detail-group" style={{marginTop:'5px', borderTop:'1px dashed var(--border-color)', paddingTop:'5px'}}><span className="detail-label">Mulkiya No.</span><span className="detail-value" style={{fontWeight:800}}>{viewEntity.mulkiya_number || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Mulkiya Expiry</span><span className={`detail-value ${getStatusClass(viewEntity.mulkiya_expiry)}`}>{viewEntity.mulkiya_expiry || '-'}</span></div>

                  <div className="detail-group" style={{marginTop:'5px', borderTop:'1px dashed var(--border-color)', paddingTop:'5px'}}><span className="detail-label">Insurance No.</span><span className="detail-value" style={{fontWeight:800}}>{viewEntity.insurance_number || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Insurance Start</span><span className="detail-value">{viewEntity.insurance_start || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Insurance Expiry</span><span className={`detail-value ${getStatusClass(viewEntity.insurance_expiry)}`}>{viewEntity.insurance_expiry || '-'}</span></div>
                  
                  {Object.entries(viewEntity.custom_fields || {}).map(([key, val], i) => (
                    <div className="detail-group" key={i}><span className="detail-label">{key}</span><span className="detail-value">{val}</span></div>
                  ))}
                </div>
              </div>

              {viewEntity.documents && viewEntity.documents.length > 0 && (
                <div className="dynamic-fields-card" style={{marginTop: 0}}>
                  <h4 style={{marginBottom: '1rem'}}>Associated Documents</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {viewEntity.documents.map((doc, idx) => (
                      <div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'0.75rem', background:'var(--bg-color)', borderRadius:'6px', border:'1px solid var(--border-color)'}}>
                        <span style={{fontWeight:'600'}}>{doc.heading}</span>
                        <a href={`${API}/uploads/vehicles/${doc.filename}`} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', textDecoration:'none', fontWeight:700}}>View Document</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color: '#fff'}}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="dynamic-fields-card" style={{marginTop:0, marginBottom:'1.5rem', background: 'rgba(11, 157, 191, 0.05)', borderColor: 'rgba(11, 157, 191, 0.2)'}}>
                  <div className="input-group full-width" style={{marginBottom:0}}>
                    <label>Vehicle Photo</label>
                    <input type="file" onChange={e => setPhoto(e.target.files[0])} accept="image/*" />
                    <p style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'4px'}}>Upload front/side view. Max size 5MB.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group"><label>Vehicle Number <span style={{color:'var(--danger-color)'}}>*</span></label><input required value={formData.vehicle_number} onChange={e=>setFormData({...formData, vehicle_number: e.target.value})} /></div>
                  <div className="input-group">
                    <label>Vehicle Type (Owner/Tanker)</label>
                    <select required value={formData.vehicle_type} onChange={e=>setFormData({...formData, vehicle_type: e.target.value})} style={{width:'100%', padding:'0.75rem', borderRadius:'6px', border:'1px solid var(--border-color)', outline:'none', background:'var(--surface-color)', color:'var(--text-primary)'}}>
                      <option value="">Select...</option>
                      <option value="Owner">Owner</option>
                      <option value="Tanker">Tanker</option>
                    </select>
                  </div>
                  
                  <div className="input-group"><label>Driver Name</label><input value={formData.driver_name} onChange={e=>setFormData({...formData, driver_name: e.target.value})} /></div>
                  <div className="input-group"><label>Driver Phone</label><input value={formData.driver_phone} onChange={e=>setFormData({...formData, driver_phone: e.target.value})} /></div>
                  
                  <div className="input-group"><label>Mulkiya No.</label><input value={formData.mulkiya_number} onChange={e=>setFormData({...formData, mulkiya_number: e.target.value})} /></div>
                  <div className="input-group"><label>Mulkiya Expiry</label><input type="date" value={formData.mulkiya_expiry} onChange={e=>setFormData({...formData, mulkiya_expiry: e.target.value})} /></div>

                  <div className="input-group"><label>Insurance No.</label><input value={formData.insurance_number} onChange={e=>setFormData({...formData, insurance_number: e.target.value})} /></div>
                  <div className="input-group"><label>Insurance Start</label><input type="date" value={formData.insurance_start} onChange={e=>setFormData({...formData, insurance_start: e.target.value})} /></div>
                  <div className="input-group full-width"><label>Insurance Expiry</label><input type="date" value={formData.insurance_expiry} onChange={e=>setFormData({...formData, insurance_expiry: e.target.value})} /></div>
                </div>

                <div className="dynamic-fields-card">
                  <h4>Documents (Mulkiya Copy, Ins. Copy)</h4>
                  {existingDocuments.map((doc, idx) => (
                    <div key={idx} className="document-item">
                      <div><span className="document-heading">{doc.heading}: </span><a href={`${API}/uploads/vehicles/${doc.filename}`} target="_blank" rel="noreferrer" className="document-file">{doc.filename}</a></div>
                      <button type="button" className="btn-danger" style={{padding:'4px 8px'}} onClick={() => removeExistingDoc(idx)}>Remove</button>
                    </div>
                  ))}
                  {newDocuments.map((nd, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center'}}>
                      <input placeholder="Doc Heading" required value={nd.heading} onChange={e => handleNewDocChange(idx, 'heading', e.target.value)} style={{flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius:'6px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
                      <input type="file" required onChange={e => handleNewDocChange(idx, 'file', e.target.files[0])} style={{flex: 1}} />
                      <button type="button" className="btn-secondary" style={{padding:'4px'}} onClick={() => removeNewDoc(idx)}>&times;</button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" style={{marginTop: '10px'}} onClick={addNewDocField}>+ Add Document</button>
                </div>

                <div className="dynamic-fields-card">
                  <h4>Custom Data Fields</h4>
                  {customFields.map((field, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                      <input placeholder="Field Name" required value={field.heading} onChange={e => handleCustomFieldChange(idx, 'heading', e.target.value)} style={{flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius:'6px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
                      <input placeholder="Value" required value={field.value} onChange={e => handleCustomFieldChange(idx, 'value', e.target.value)} style={{flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius:'6px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" style={{marginTop: '10px'}} onClick={addCustomField}>+ Add Custom Field</button>
                </div>

                <div style={{textAlign: 'right', marginTop: '1.5rem'}}>
                  <button type="submit" className="btn-primary" style={{width: '200px'}}>Save Vehicle Data</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
