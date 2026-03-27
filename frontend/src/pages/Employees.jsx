import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Download, FileText, Trash2, Pencil, Eye, User, Briefcase, Calendar } from 'lucide-react';

const API = 'http://localhost:5000';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [dynamicColumn, setDynamicColumn] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', department: '', contact_number: '', relative_contact_number: '', address: '', date_of_birth: '',
    passport_number: '', passport_issue: '', passport_expiry: '', visa_number: '', visa_issue: '', visa_expiry: '',
    insurance_provider: '', insurance_number: '', insurance_expiry: '', medical_status: '', medical_expiry: ''
  });
  const [customFields, setCustomFields] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  const availableCustomHeadings = Array.from(new Set(employees.flatMap(e => Object.keys(e.custom_fields || {}))));

  const fetchEmployees = async () => {
    const res = await axios.get(`${API}/api/employees`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    setEmployees(res.data);
  };

  useEffect(() => { fetchEmployees(); }, []);

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
      await axios.put(`${API}/api/employees/${editingId}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    } else {
      await axios.post(`${API}/api/employees`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    }
    
    setEditingId(null);
    setFormData({ name: '', department: '', contact_number: '', relative_contact_number: '', address: '', date_of_birth: '', passport_number: '', passport_issue: '', passport_expiry: '', visa_number: '', visa_issue: '', visa_expiry: '', insurance_provider: '', insurance_number: '', insurance_expiry: '', medical_status: '', medical_expiry: '' });
    setCustomFields([]); setExistingDocuments([]); setNewDocuments([]); setPhoto(null);
    setIsModalOpen(false);
    fetchEmployees();
  };

  const openViewCard = (emp) => {
    setViewEmployee(emp);
    setIsViewModalOpen(true);
  };

  const editEmployee = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name || '', department: emp.department || '', contact_number: emp.contact_number || '', relative_contact_number: emp.relative_contact_number || '', address: emp.address || '', date_of_birth: emp.date_of_birth || '',
      passport_number: emp.passport_number || '', passport_issue: emp.passport_issue || '', passport_expiry: emp.passport_expiry || '', visa_number: emp.visa_number || '', visa_issue: emp.visa_issue || '', visa_expiry: emp.visa_expiry || '',
      insurance_provider: emp.insurance_provider || '', insurance_number: emp.insurance_number || '', insurance_expiry: emp.insurance_expiry || '', medical_status: emp.medical_status || '', medical_expiry: emp.medical_expiry || ''
    });
    setCustomFields(Object.entries(emp.custom_fields || {}).map(([heading, value]) => ({ heading, value })));
    setExistingDocuments(emp.documents || []);
    setNewDocuments([]);
    setPhoto(null);
    setIsModalOpen(true);
  };

  const deleteEmployee = async (id) => {
    if(!window.confirm("Delete employee?")) return;
    await axios.delete(`${API}/api/employees/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchEmployees();
  };

  const getStatusClass = (dateStr) => {
    if (!dateStr) return 'status-neutral';
    const today = new Date();
    const expDate = new Date(dateStr);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'status-danger';
    if (diffDays <= 30) return 'status-warning';
    return 'status-success';
  };

  const getRowHighlight = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    const expDate = new Date(dateStr);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'highlight-row-danger';
    if (diffDays <= 30) return 'highlight-row-warning';
    return '';
  }

  const sortedAndFiltered = employees
    .filter(emp => `${emp.name} ${emp.department} ${emp.contact_number}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const d1 = a.visa_expiry ? new Date(a.visa_expiry) : new Date('2099-01-01');
      const d2 = b.visa_expiry ? new Date(b.visa_expiry) : new Date('2099-01-01');
      return d1 - d2;
    });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedAndFiltered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Employees List (Sorted by Visa Expiry)", 14, 15);
    doc.autoTable({
        head: [['SL NO', 'Name', 'Department', 'Phone Number', 'Visa Expiry', 'Passport Expiry']],
        body: sortedAndFiltered.map((emp, idx) => [idx+1, emp.name, emp.department, emp.contact_number, emp.visa_expiry || '-', emp.passport_expiry || '-']),
        startY: 20
    });
    doc.save("employees.pdf");
  };

  return (
    <div>
      <div className="page-header">
        <h1>Employees Directory</h1>
        <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
          <button className="btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><FileText size={16} /> PDF</button>
          <button className="btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ name: '', department: '', contact_number: '', relative_contact_number: '', address: '', date_of_birth: '', passport_number: '', passport_issue: '', passport_expiry: '', visa_number: '', visa_issue: '', visa_expiry: '', insurance_provider: '', insurance_number: '', insurance_expiry: '', medical_status: '', medical_expiry: '' });
            setCustomFields([]); setExistingDocuments([]); setNewDocuments([]); setPhoto(null);
            setIsModalOpen(true);
          }}><Plus size={16}/> Add Employee</button>
        </div>
      </div>
      
      <div style={{display:'flex', gap: '10px', marginBottom: '1.5rem', flexWrap:'wrap'}}>
        <input placeholder="Search employees..." value={query} onChange={(e)=>setQuery(e.target.value)} style={{flex:1, minWidth:'250px', padding:'0.75rem', border:'1px solid var(--border-color)', borderRadius:'8px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
        <select value={dynamicColumn} onChange={(e)=>setDynamicColumn(e.target.value)} style={{padding:'0.75rem', border:'1px solid var(--border-color)', borderRadius:'8px', background: 'var(--surface-color)', color: 'var(--text-primary)'}}>
          <option value="">+ Add Dynamic Column</option>
          {availableCustomHeadings.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SL NO</th>
              <th>Photo</th>
              <th>Name</th>
              <th>Department</th>
              <th>Phone Number</th>
              <th>Visa Expiry</th>
              <th>Passport Expiry</th>
              {dynamicColumn && <th>{dynamicColumn}</th>}
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((emp, index) => {
              const hlClass = getRowHighlight(emp.visa_expiry);
              return (
              <tr key={emp.id} className={hlClass}>
                <td>{index + 1}</td>
                <td>
                  {emp.photo ? <img src={`${API}/uploads/employees/photos/${emp.photo}`} alt="DP" className="table-photo" /> : <div className="table-photo" style={{background:'var(--surface-color)'}}></div>}
                </td>
                <td>
                  <span style={{fontWeight: '700', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline'}} onClick={(e) => { e.stopPropagation(); openViewCard(emp); }}>
                    {emp.name}
                  </span>
                </td>
                <td>{emp.department}</td>
                <td>{emp.contact_number}</td>
                <td><span className={`status-badge ${getStatusClass(emp.visa_expiry)}`}>{emp.visa_expiry || 'N/A'}</span></td>
                <td><span className={`status-badge ${getStatusClass(emp.passport_expiry)}`}>{emp.passport_expiry || 'N/A'}</span></td>
                {dynamicColumn && <td>{emp.custom_fields?.[dynamicColumn] || '-'}</td>}
                <td style={{display: 'flex', gap: '8px', justifyContent:'flex-end'}}>
                  <button className="btn-secondary" style={{padding: '0.4rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); editEmployee(emp); }}><Pencil size={14}/></button>
                  <button className="btn-danger" style={{padding: '0.4rem 0.6rem'}} onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id); }}><Trash2 size={14}/></button>
                </td>
              </tr>
            )})}
            {sortedAndFiltered.length === 0 && <tr><td colSpan={dynamicColumn ? 9 : 8} style={{textAlign: 'center', padding: '2rem'}}>No employees found.</td></tr>}
          </tbody>
        </table>
      </div>

      {isViewModalOpen && viewEmployee && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h2>Employee ID Card</h2>
              <button onClick={() => setIsViewModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color: 'var(--text-primary)'}}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="id-card-view">
                <div className="id-card-photo-container">
                  <div className="id-card-photo">
                    {viewEmployee.photo ? <img src={`${API}/uploads/employees/photos/${viewEmployee.photo}`} alt="Profile" /> : <User size={64} color="var(--text-secondary)" />}
                  </div>
                  <h3 style={{marginTop: '0.5rem', textAlign:'center'}}>{viewEmployee.name}</h3>
                  <span className="status-badge status-neutral">{viewEmployee.department}</span>
                </div>
                
                <div className="id-card-details">
                  <div className="detail-group"><span className="detail-label">Phone #</span><span className="detail-value">{viewEmployee.contact_number || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Date of Birth</span><span className="detail-value">{viewEmployee.date_of_birth || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Address</span><span className="detail-value">{viewEmployee.address || '-'}</span></div>
                  
                  <div className="detail-group"><span className="detail-label">Passport No.</span><span className="detail-value">{viewEmployee.passport_number || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Passport Expiry</span><span className={`detail-value ${getStatusClass(viewEmployee.passport_expiry)}`}>{viewEmployee.passport_expiry || '-'}</span></div>
                  
                  <div className="detail-group"><span className="detail-label">Visa No.</span><span className="detail-value">{viewEmployee.visa_number || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Visa Expiry</span><span className={`detail-value ${getStatusClass(viewEmployee.visa_expiry)}`}>{viewEmployee.visa_expiry || '-'}</span></div>
                  
                  <div className="detail-group"><span className="detail-label">Insurance Provider</span><span className="detail-value">{viewEmployee.insurance_provider || '-'}</span></div>
                  <div className="detail-group"><span className="detail-label">Insurance Expiry</span><span className={`detail-value ${getStatusClass(viewEmployee.insurance_expiry)}`}>{viewEmployee.insurance_expiry || '-'}</span></div>
                  
                  {Object.entries(viewEmployee.custom_fields || {}).map(([key, val], i) => (
                    <div className="detail-group" key={i}><span className="detail-label">{key}</span><span className="detail-value">{val}</span></div>
                  ))}
                </div>
              </div>

              {viewEmployee.documents && viewEmployee.documents.length > 0 && (
                <div className="dynamic-fields-card" style={{marginTop: 0}}>
                  <h4 style={{marginBottom: '1rem'}}>Uploaded Documents</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {viewEmployee.documents.map((doc, idx) => (
                      <div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'0.75rem', background:'var(--bg-color)', borderRadius:'6px', border:'1px solid var(--border-color)'}}>
                        <span style={{fontWeight:'600'}}>{doc.heading}</span>
                        <a href={`${API}/uploads/employees/${doc.filename}`} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', textDecoration:'none'}}>View Document</a>
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
              <h2>{editingId ? 'Edit Employee Data' : 'Add New Employee'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color: 'var(--text-primary)'}}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="dynamic-fields-card" style={{marginTop:0, marginBottom:'1.5rem', background: 'rgba(229, 9, 20, 0.05)', borderColor: 'rgba(229, 9, 20, 0.2)'}}>
                  <div className="input-group full-width" style={{marginBottom:0}}>
                    <label>Profile Photo</label>
                    <input type="file" onChange={e => setPhoto(e.target.files[0])} accept="image/*" />
                    <p style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'4px'}}>Max size 5MB. Leave empty to keep existing.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group"><label>Full Name</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
                  <div className="input-group"><label>Department</label><input required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} /></div>
                  <div className="input-group"><label>Primary Phone</label><input required value={formData.contact_number} onChange={e=>setFormData({...formData, contact_number: e.target.value})} /></div>
                  <div className="input-group"><label>Relative Phone</label><input value={formData.relative_contact_number} onChange={e=>setFormData({...formData, relative_contact_number: e.target.value})} /></div>
                  <div className="input-group"><label>Date of Birth</label><input type="date" value={formData.date_of_birth} onChange={e=>setFormData({...formData, date_of_birth: e.target.value})} /></div>
                  <div className="input-group"><label>Address</label><input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} /></div>
                  
                  <div className="input-group"><label>Passport No.</label><input value={formData.passport_number} onChange={e=>setFormData({...formData, passport_number: e.target.value})} /></div>
                  <div className="input-group"><label>Passport Expiry</label><input type="date" value={formData.passport_expiry} onChange={e=>setFormData({...formData, passport_expiry: e.target.value})} /></div>
                  <div className="input-group"><label>Visa No.</label><input value={formData.visa_number} onChange={e=>setFormData({...formData, visa_number: e.target.value})} /></div>
                  <div className="input-group"><label>Visa Expiry</label><input type="date" value={formData.visa_expiry} onChange={e=>setFormData({...formData, visa_expiry: e.target.value})} /></div>
                  <div className="input-group"><label>Insurance Provider</label><input value={formData.insurance_provider} onChange={e=>setFormData({...formData, insurance_provider: e.target.value})} /></div>
                  <div className="input-group"><label>Insurance Expiry</label><input type="date" value={formData.insurance_expiry} onChange={e=>setFormData({...formData, insurance_expiry: e.target.value})} /></div>
                </div>

                <div className="dynamic-fields-card">
                  <h4>Documents (with Custom Headings)</h4>
                  {existingDocuments.map((doc, idx) => (
                    <div key={idx} className="document-item">
                      <div><span className="document-heading">{doc.heading}: </span><a href={`${API}/uploads/employees/${doc.filename}`} target="_blank" rel="noreferrer" className="document-file">{doc.filename}</a></div>
                      <button type="button" className="btn-danger" style={{padding:'4px 8px'}} onClick={() => removeExistingDoc(idx)}>Remove</button>
                    </div>
                  ))}
                  {newDocuments.map((nd, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center'}}>
                      <input placeholder="Doc Heading (e.g. Visa Copy)" required value={nd.heading} onChange={e => handleNewDocChange(idx, 'heading', e.target.value)} style={{flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius:'6px', background: 'var(--surface-color)', color: 'var(--text-primary)'}} />
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
                  <button type="submit" className="btn-primary" style={{width: '200px'}}>Save Employee Data</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
