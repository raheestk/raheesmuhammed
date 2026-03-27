import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, FileText, Car, LayoutDashboard, LogOut, Bell, Banknote, CheckCircle, Key } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdData, setPwdData] = useState({ oldPassword: '', newPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    const fetchAlerts = () => {
      axios.get(`${API}/api/alerts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => setAlertCount(r.data.total || 0)).catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    try {
      await axios.put(`${API}/api/auth/change-password`, pwdData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPwdSuccess('Password changed successfully!');
      setPwdData({ oldPassword: '', newPassword: '' });
      setTimeout(() => setIsPwdModalOpen(false), 2000);
    } catch(err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const navItems = [
    { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees',    icon: Users,            label: 'Employees' },
    { path: '/company-docs', icon: FileText,         label: 'Company Docs' },
    { path: '/vehicles',     icon: Car,              label: 'Vehicles' },
    { path: '/pending-cheques', icon: Banknote,      label: 'Pending Cheques' },
    { path: '/cleared-cheques', icon: CheckCircle,   label: 'Cleared Cheques' }
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'Nunito, sans-serif', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            DOZANDA FUEL TRADING
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--primary-color)', fontWeight: 700, fontFamily: 'Nunito, sans-serif', marginTop: '4px' }}>
            دوزاندا لتجارة الديزل ش.ذ.م.م
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            HR & Asset Portal
          </div>
        </div>

        <ul className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                  <Icon size={20} />
                  {item.label}
                  {/* Bell badge on Dashboard */}
                  {item.path === '/' && alertCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: '#E53E3E', color: '#fff',
                      borderRadius: '50px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800
                    }}>{alertCount}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Alert Bell */}
        {alertCount > 0 && (
          <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem',
              background: 'rgba(229,62,62,0.1)', border: '1.5px solid rgba(229,62,62,0.3)',
              borderRadius: '10px', textDecoration: 'none', color: '#E53E3E', fontWeight: 800,
              fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem'
            }}>
              <Bell size={18} />
              {alertCount} Expiry Alert{alertCount !== 1 ? 's' : ''}
            </Link>
          </div>
        )}

        <div className="sidebar-footer" style={{ display:'flex', gap:'8px', padding:'0 1rem' }}>
          <button onClick={() => setIsPwdModalOpen(true)} style={{flex: 1, padding:'10px', display:'flex', justifyContent:'center'}} title="Change Password"><Key size={18} /></button>
          <button onClick={handleLogout} style={{flex: 4, display:'flex', justifyContent:'center'}}><LogOut size={18} /> Logout</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {isPwdModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button onClick={() => { setIsPwdModalOpen(false); setPwdError(''); setPwdSuccess(''); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>&times;</button>
            </div>
            <div className="modal-body">
              {pwdError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontWeight: 800 }}>{pwdError}</div>}
              {pwdSuccess && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', fontWeight: 800 }}>{pwdSuccess}</div>}
              <form onSubmit={handleChangePwd}>
                <div className="input-group">
                  <label>Current Password</label>
                  <input type="password" required value={pwdData.oldPassword} onChange={e => setPwdData({ ...pwdData, oldPassword: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>New Password</label>
                  <input type="password" required minLength="6" value={pwdData.newPassword} onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })} />
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
