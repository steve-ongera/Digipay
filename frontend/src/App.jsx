// app.jsx — DigiPay root
const { useState, useEffect } = React;

const App = () => {
  const [user, setUser]     = useState(null);
  const [page, setPage]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [booting, setBooting] = useState(true);

  const { addToast, ToastContainer } = window.useToast();

  // Restore session
  useEffect(() => {
    if (window.auth.isAuth()) {
      setUser(window.auth.user());
    }
    setBooting(false);
  }, []);

  const handleAuth = (usr) => {
    setUser(usr);
    setPage('dashboard');
  };

  const handleLogout = async () => {
    try { await window.api.logout(); } catch (_) {}
    window.auth.clear();
    setUser(null);
    setPage('dashboard');
    addToast('Logged out successfully', 'info');
  };

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (booting) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg, #00D46A, #00A352)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        boxShadow: '0 0 28px rgba(0,212,106,0.4)',
      }}>💚</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
        Digi<span style={{ color: 'var(--green)' }}>Pay</span>
      </div>
      <div className="spinner" style={{ marginTop: 8 }} />
    </div>
  );

  if (!user) return (
    <>
      <AuthPage onAuth={handleAuth} />
      <ToastContainer />
    </>
  );

  const pageProps = { addToast, setPage: navigate };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <DashboardPage    {...pageProps} />;
      case 'send':         return <SendPage         {...pageProps} />;
      case 'deposit':      return <DepositPage      {...pageProps} />;
      case 'withdraw':     return <WithdrawPage     {...pageProps} />;
      case 'transactions': return <TransactionsPage {...pageProps} />;
      case 'loans':        return <LoansPage        {...pageProps} />;
      case 'savings':      return <SavingsPage      {...pageProps} />;
      case 'lipa':         return <LipaPage         {...pageProps} />;
      default:             return <DashboardPage    {...pageProps} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile header */}
      <header className="mob-header">
        <button className="burger" onClick={() => setSidebarOpen(o => !o)}>
          <i className={`bi bi-${sidebarOpen ? 'x' : 'list'}`} />
        </button>
        <div className="logo-text" style={{ fontSize: 18, fontWeight: 800 }}>
          Digi<em style={{ color: 'var(--green)', fontStyle: 'normal' }}>Pay</em>
        </div>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
          {(user.first_name?.[0] || user.username?.[0] || 'D').toUpperCase()}
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={navigate}
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="main-content">
        {renderPage()}
      </main>

      <ToastContainer />
    </div>
  );
};

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);