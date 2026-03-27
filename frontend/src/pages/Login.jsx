import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{marginBottom: '2rem'}}>
          <h2 style={{fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize:'1.6rem', color:'#1A2E4A', marginBottom:'0.35rem', letterSpacing:'-0.5px'}}>DOZANDA FUEL TRADING</h2>
          <p style={{color: '#0B9DBF', fontWeight: 800, margin: '0', fontSize:'1.1rem', fontFamily:'Nunito, sans-serif'}}>دوزاندا لتجارة الديزل ش.ذ.م.م</p>
          <div style={{height: '3px', background: 'linear-gradient(90deg, #0B9DBF, #F5A100, #0B9DBF)', margin: '1rem 0', borderRadius:'2px'}}></div>
          <p style={{color: '#4B6280', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'3px', margin:0, fontWeight:800, fontFamily:'Nunito, sans-serif'}}>HR Management Portal</p>
        </div>
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
}
