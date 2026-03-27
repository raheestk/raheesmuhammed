import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Employees from './pages/Employees';
import CompanyDocs from './pages/CompanyDocs';
import Vehicles from './pages/Vehicles';
import PendingCheques from './pages/PendingCheques';
import ClearedCheques from './pages/ClearedCheques';

function App() {
  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours();
      // 6:00 PM = 18. Switch to dark from 6 PM until 6 AM
      if (hour >= 18 || hour < 6) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };
    applyTheme();
    const interval = setInterval(applyTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  const PrivateRoute = ({ children }) => {
    return <Layout>{children}</Layout>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
        <Route path="/company-docs" element={<PrivateRoute><CompanyDocs /></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
        <Route path="/pending-cheques" element={<PrivateRoute><PendingCheques /></PrivateRoute>} />
        <Route path="/cleared-cheques" element={<PrivateRoute><ClearedCheques /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
