// pages/TransactionsPage.jsx
const { useState, useEffect } = React;

window.TransactionsPage = ({ addToast }) => {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    window.api.transactions()
      .then(setTxns)
      .catch(() => addToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filters = [
    { id: 'ALL',    label: 'All' },
    { id: 'CREDIT', label: 'Money In' },
    { id: 'DEBIT',  label: 'Money Out' },
    { id: 'LIPA',   label: 'Lipa' },
    { id: 'LOAN',   label: 'Loans' },
    { id: 'SAVE',   label: 'Savings' },
  ];

  const creditTypes = ['RECEIVE', 'DEPOSIT', 'LOAN_DISBURSE'];
  const debitTypes  = ['SEND', 'WITHDRAW', 'LOAN_REPAY', 'SAVE_IN', 'LIPA'];

  const filtered = txns.filter(tx => {
    const matchesFilter =
      filter === 'ALL'    ? true :
      filter === 'CREDIT' ? creditTypes.includes(tx.txn_type) :
      filter === 'DEBIT'  ? debitTypes.includes(tx.txn_type) :
      filter === 'LIPA'   ? tx.txn_type === 'LIPA' :
      filter === 'LOAN'   ? tx.txn_type.startsWith('LOAN') :
      filter === 'SAVE'   ? tx.txn_type.startsWith('SAVE') : true;

    const matchesSearch = !search ||
      tx.reference.toLowerCase().includes(search.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.recipient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.recipient_no || '').includes(search);

    return matchesFilter && matchesSearch;
  });

  const totalIn  = txns.filter(t => creditTypes.includes(t.txn_type)).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txns.filter(t => debitTypes.includes(t.txn_type)).reduce((s, t) => s + Number(t.amount), 0);
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  return (
    <div>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-clock-history" style={{ color: 'var(--green)', marginRight: 10 }} />Transaction History</div>
        <div className="page-sub">All your DigiPay transactions</div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL TRANSACTIONS</div>
          <div className="stat-val">{txns.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MONEY IN</div>
          <div className="stat-val c-g">KES {fmt(totalIn)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MONEY OUT</div>
          <div className="stat-val c-r">KES {fmt(totalOut)}</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }} />
        <input className="form-ctrl" style={{ paddingLeft: 42 }} type="text"
          placeholder="Search by reference, name, description…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter chips */}
      <div className="chip-row">
        {filters.map(f => (
          <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading transactions…</div>
      ) : (
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox" />
              <h4>No transactions found</h4>
              <p>{search ? 'Try a different search term' : 'Transactions will appear here'}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 600 }}>
                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
              </div>
              <div className="txn-list">
                {filtered.map(tx => <TxnItem key={tx.id} tx={tx} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};