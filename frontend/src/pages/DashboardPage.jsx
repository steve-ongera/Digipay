// pages/DashboardPage.jsx
const { useState, useEffect } = React;

window.DashboardPage = ({ setPage, addToast }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.dashboard()
      .then(setData)
      .catch(() => addToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading"><div className="spinner" /> Loading dashboard…</div>
  );

  if (!data) return null;

  const quickActions = [
    { label: 'Send',     icon: 'send-fill',        cls: 'g',  page: 'send'     },
    { label: 'Deposit',  icon: 'download',          cls: 'b',  page: 'deposit'  },
    { label: 'Withdraw', icon: 'upload',            cls: 'r',  page: 'withdraw' },
    { label: 'Lipa',     icon: 'shop-window',       cls: 'p',  page: 'lipa'     },
    { label: 'Loans',    icon: 'bank',              cls: 'a',  page: 'loans'    },
    { label: 'Savings',  icon: 'piggy-bank-fill',   cls: 'g',  page: 'savings'  },
    { label: 'History',  icon: 'clock-history',     cls: 'b',  page: 'transactions' },
    { label: 'Wallet',   icon: 'wallet2',           cls: 'r',  page: 'dashboard'},
  ];

  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          Hello, {data.full_name.split(' ')[0]} 👋
        </div>
        <div className="page-sub">Here's what's happening with your account</div>
      </div>

      {/* Balance Card */}
      <BalanceCard
        balance={data.balance}
        accountNo={data.account_no}
        name={data.full_name}
        totalSaved={data.total_saved}
        totalLoanDue={data.total_loan_due}
      />

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map(a => (
          <button key={a.page + a.label} className="qa-btn" onClick={() => setPage(a.page)}>
            <div className={`qa-icon ${a.cls}`}>
              <i className={`bi bi-${a.icon}`} />
            </div>
            {a.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">ACTIVE LOANS</div>
          <div className={`stat-val ${data.active_loans.length > 0 ? 'c-r' : 'c-g'}`}>
            {data.active_loans.length}
          </div>
          <div className="stat-sub">
            {data.active_loans.length > 0 ? `Due: KES ${fmt(data.total_loan_due)}` : 'No active loans'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SAVINGS GOALS</div>
          <div className="stat-val c-a">{data.savings_goals.length}</div>
          <div className="stat-sub">KES {fmt(data.total_saved)} saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ACCOUNT STATUS</div>
          <div className="stat-val c-g">Active</div>
          <div className="stat-sub">In good standing</div>
        </div>
      </div>

      {/* Active Loans snippet */}
      {data.active_loans.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="sec-head">
            <span className="sec-title"><i className="bi bi-bank" style={{ marginRight: 8, color: 'var(--blue)' }} />Active Loans</span>
            <button className="see-all" onClick={() => setPage('loans')}>View all →</button>
          </div>
          {data.active_loans.map(loan => (
            <div key={loan.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-bc">
                <span style={{ fontWeight: 700 }}>KES {fmt(loan.amount)}</span>
                <span className="badge badge-r">Due: KES {fmt(loan.balance_remaining)}</span>
              </div>
              <div className="progress" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${loan.progress_pct}%` }} />
              </div>
              <div className="small" style={{ marginTop: 4 }}>{loan.progress_pct}% repaid</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="sec-head">
          <span className="sec-title"><i className="bi bi-clock-history" style={{ marginRight: 8, color: 'var(--green)' }} />Recent Transactions</span>
          <button className="see-all" onClick={() => setPage('transactions')}>View all →</button>
        </div>
        {data.recent_txns.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox" />
            <h4>No transactions yet</h4>
            <p>Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="txn-list">
            {data.recent_txns.map(tx => <TxnItem key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

      {/* Savings Goals snippet */}
      {data.savings_goals.length > 0 && (
        <div className="card">
          <div className="sec-head">
            <span className="sec-title"><i className="bi bi-piggy-bank-fill" style={{ marginRight: 8, color: 'var(--amber)' }} />Savings Goals</span>
            <button className="see-all" onClick={() => setPage('savings')}>View all →</button>
          </div>
          <div className="two-col">
            {data.savings_goals.slice(0, 2).map(g => (
              <div key={g.id} className="save-card" style={{ margin: 0 }}>
                <div className="save-head">
                  <span className="save-emoji">{g.emoji}</span>
                  <span className="save-name">{g.name}</span>
                  <span className="badge badge-g">{g.progress_pct}%</span>
                </div>
                <div className="progress">
                  <div className="progress-fill amber" style={{ width: `${g.progress_pct}%` }} />
                </div>
                <div className="small">KES {fmt(g.current_amount)} / KES {fmt(g.target_amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};