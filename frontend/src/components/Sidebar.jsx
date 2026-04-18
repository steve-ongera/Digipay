// components/Sidebar.jsx
window.Sidebar = ({ page, setPage, user, onLogout, open, onClose }) => {
  const nav = [
    { id: 'dashboard',     icon: 'grid-1x2-fill',      label: 'Dashboard',     group: 'MAIN' },
    { id: 'send',          icon: 'send-fill',           label: 'Send Money',    group: 'MAIN' },
    { id: 'deposit',       icon: 'download',            label: 'Deposit',       group: 'MAIN' },
    { id: 'withdraw',      icon: 'upload',              label: 'Withdraw',      group: 'MAIN' },
    { id: 'lipa',          icon: 'shop-window',         label: 'Lipa Na DigiPay', group: 'PAYMENTS' },
    { id: 'transactions',  icon: 'clock-history',       label: 'Transactions',  group: 'ACCOUNT' },
    { id: 'loans',         icon: 'bank',                label: 'Loans',         group: 'ACCOUNT' },
    { id: 'savings',       icon: 'piggy-bank-fill',     label: 'Savings',       group: 'ACCOUNT' },
  ];

  const groups = [...new Set(nav.map(n => n.group))];
  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'D').toUpperCase();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'User';
  const phone = user?.profile?.phone || '';

  const go = (id) => { setPage(id); onClose(); };

  return (
    <>
      <div className={`overlay-bg ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">💚</div>
          <div className="logo-text">Digi<em>Pay</em></div>
        </div>

        <nav className="sidebar-nav">
          {groups.map(g => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {nav.filter(n => n.group === g).map(n => (
                <button
                  key={n.id}
                  className={`nav-item ${page === n.id ? 'active' : ''}`}
                  onClick={() => go(n.id)}
                >
                  <i className={`bi bi-${n.icon}`} />
                  {n.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{fullName}</div>
              <div className="user-phone">{phone}</div>
            </div>
            <button
              className="btn-ghost btn-xs"
              onClick={onLogout}
              style={{ padding: '6px', color: 'var(--red)' }}
              title="Logout"
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};