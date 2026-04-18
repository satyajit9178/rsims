import { useState } from 'react';
import { DemoProvider, useDemo } from './context/DemoContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products  from './pages/Products';
import Sales     from './pages/Sales';
import Purchases from './pages/Purchases';
import Reports   from './pages/Reports';
import Users     from './pages/Users';
import Navbar    from './components/Navbar';
import DemoBanner from './components/DemoBanner';

const DEMO_USER = { id: 0, username: 'demo_admin', role: 'Admin' };

function AppInner() {
  const { isDemo, setIsDemo } = useDemo();
  const saved = JSON.parse(localStorage.getItem('user') || 'null');
  const [user, setUser] = useState(saved);
  const [page, setPage] = useState('dashboard');

  const handleLogin = (u) => { setUser(u); setPage('dashboard'); };

  const handleDemoLogin = () => {
    setIsDemo(true);
    setUser(DEMO_USER);
    setPage('dashboard');
  };

  console.log(isDemo);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDemo(false);
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} onDemoLogin={handleDemoLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard />;
      case 'products':   return <Products  user={user} />;
      case 'sales':      return <Sales     user={user} />;
      case 'purchases':  return <Purchases user={user} />;
      case 'reports':    return <Reports   user={user} />;
      case 'users':      return user.role === 'Admin' ? <Users currentUser={user} /> : <Dashboard />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-900">
      <DemoBanner />
      <Navbar user={user} page={page} onNav={setPage} onLogout={handleLogout} />
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <AppInner />
    </DemoProvider>
  );
}