import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Car, AlertTriangle, CheckCircle } from 'lucide-react';

const API = 'http://localhost:5000';

export default function Dashboard() {
  const [stats, setStats]   = useState({ employees: 0, vehicles: 0, company_documents: 0 });
  const [alerts, setAlerts] = useState({ expired: [], expiring: [], total: 0 });
  const [tab, setTab]       = useState('expired');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/api/dashboard/stats`, { headers })
      .then(r => setStats(r.data)).catch(() => {});

    axios.get(`${API}/api/alerts`, { headers })
      .then(r => setAlerts(r.data)).catch(() => {});
  }, []);

  const entityIcon = (type) => type === 'employee' ? '👤' : '🚗';

  const AlertRow = ({ a }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.5rem',
      background: a.status === 'expired' ? 'rgba(229,62,62,0.08)' : 'rgba(214,158,46,0.08)',
      border: `1.5px solid ${a.status === 'expired' ? 'rgba(229,62,62,0.25)' : 'rgba(214,158,46,0.25)'}`,
    }}>
      <div>
        <span style={{ fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>{entityIcon(a.entityType)} {a.name}</span>
        <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{a.field}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          display: 'inline-block', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 800,
          fontFamily: 'Nunito, sans-serif',
          background: a.status === 'expired' ? 'rgba(229,62,62,0.15)' : 'rgba(214,158,46,0.15)',
          color: a.status === 'expired' ? '#E53E3E' : '#D69E2E',
          border: `1px solid ${a.status === 'expired' ? 'rgba(229,62,62,0.3)' : 'rgba(214,158,46,0.3)'}`,
        }}>
          {a.status === 'expired' ? `${Math.abs(a.days)} days ago` : `${a.days} days left`}
        </span>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{a.dateStr}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        {alerts.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(229,62,62,0.1)', border: '1.5px solid rgba(229,62,62,0.3)', borderRadius: '50px', padding: '6px 16px' }}>
            <AlertTriangle size={16} color="#E53E3E" />
            <span style={{ fontWeight: 800, color: '#E53E3E', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem' }}>
              {alerts.total} Active Alert{alerts.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-title"><Users size={16} /> Total Employees</div>
          <div className="stat-card-value">{stats.employees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title"><FileText size={16} /> Company Documents</div>
          <div className="stat-card-value">{stats.company_documents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title"><Car size={16} /> Vehicles</div>
          <div className="stat-card-value">{stats.vehicles}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#E53E3E' }}>
          <div className="stat-card-title"><AlertTriangle size={16} color="#E53E3E" /> Expired Records</div>
          <div className="stat-card-value" style={{ color: '#E53E3E' }}>{alerts.expired?.length || 0}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#D69E2E' }}>
          <div className="stat-card-title"><AlertTriangle size={16} color="#D69E2E" /> Expiring Soon (≤30 days)</div>
          <div className="stat-card-value" style={{ color: '#D69E2E' }}>{alerts.expiring?.length || 0}</div>
        </div>
      </div>

      {/* ── Alert Panel ── */}
      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🔔 Expiry Alerts
            {alerts.total > 0 && (
              <span style={{ background: '#E53E3E', color: '#fff', borderRadius: '50px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800 }}>{alerts.total}</span>
            )}
          </h2>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setTab('expired')} style={{ padding: '6px 18px', borderRadius: '50px', border: '2px solid', cursor: 'pointer', fontWeight: 800, fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', background: tab === 'expired' ? 'rgba(229,62,62,0.1)' : 'transparent', color: tab === 'expired' ? '#E53E3E' : 'var(--text-secondary)', borderColor: tab === 'expired' ? '#E53E3E' : 'var(--border-color)', transition: 'all 0.2s' }}>
              🔴 Expired ({alerts.expired?.length || 0})
            </button>
            <button onClick={() => setTab('expiring')} style={{ padding: '6px 18px', borderRadius: '50px', border: '2px solid', cursor: 'pointer', fontWeight: 800, fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', background: tab === 'expiring' ? 'rgba(214,158,46,0.1)' : 'transparent', color: tab === 'expiring' ? '#D69E2E' : 'var(--text-secondary)', borderColor: tab === 'expiring' ? '#D69E2E' : 'var(--border-color)', transition: 'all 0.2s' }}>
              🟠 Expiring Soon ({alerts.expiring?.length || 0})
            </button>
          </div>
        </div>

        {/* Alert list */}
        <div style={{ padding: '1.5rem', maxHeight: '420px', overflowY: 'auto' }}>
          {tab === 'expired' && (
            alerts.expired?.length > 0
              ? alerts.expired.map((a, i) => <AlertRow key={i} a={a} />)
              : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><CheckCircle size={32} style={{ marginBottom: '8px', color: '#2D8653' }} /><br />No expired records 🎉</div>
          )}
          {tab === 'expiring' && (
            alerts.expiring?.length > 0
              ? alerts.expiring.map((a, i) => <AlertRow key={i} a={a} />)
              : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><CheckCircle size={32} style={{ marginBottom: '8px', color: '#2D8653' }} /><br />Nothing expiring within 30 days 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}
