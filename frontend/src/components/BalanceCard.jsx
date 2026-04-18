// components/BalanceCard.jsx
window.BalanceCard = ({ balance = 0, accountNo = '', name = '', totalSaved = 0, totalLoanDue = 0 }) => {
  const fmt = (n) => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="balance-card">
      <div className="bc-header">
        <div>
          <div className="bc-label">Available Balance</div>
          <div className="bc-acct" style={{ marginTop: 2 }}>{name}</div>
        </div>
        <div className="bc-pill"><i className="bi bi-shield-check" style={{ marginRight: 4 }} />Verified</div>
      </div>

      <div className="bc-amount">
        <span className="cur">KES</span>
        {fmt(balance)}
      </div>
      <div className="bc-acct">Account: {accountNo}</div>

      <div className="bc-stats">
        <div>
          <div className="bc-stat-label">Total Saved</div>
          <div className="bc-stat-val c-g">KES {fmt(totalSaved)}</div>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 20 }}>
          <div className="bc-stat-label">Loan Due</div>
          <div className="bc-stat-val c-r">KES {fmt(totalLoanDue)}</div>
        </div>
      </div>
    </div>
  );
};