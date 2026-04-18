// pages/DepositPage.jsx
const { useState } = React;

window.DepositPage = ({ addToast, setPage }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [success, setSuccess] = useState(null);
  const [amount, setAmount]   = useState('');
  const [method, setMethod]   = useState('M-PESA');

  const methods = [
    { id: 'M-PESA',      icon: '📱', label: 'M-PESA', desc: 'Safaricom M-PESA' },
    { id: 'BANK',        icon: '🏦', label: 'Bank Transfer', desc: 'Direct bank deposit' },
    { id: 'AGENT',       icon: '👤', label: 'DigiPay Agent', desc: 'Cash via agent' },
  ];

  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const deposit = async () => {
    if (!amount || Number(amount) < 50) return setErr('Minimum deposit is KES 50.');
    setErr(''); setLoading(true);
    try {
      const res = await window.api.deposit({ amount, method });
      setSuccess(res);
      addToast(res.message, 'success');
    } catch (e) {
      setErr(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Deposit failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-download" style={{ color: 'var(--blue)', marginRight: 10 }} />Deposit</div>
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,106,0.1)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30 }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>Deposit Successful!</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 22 }}>{success.message}</p>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 18, marginBottom: 22, textAlign: 'left' }}>
          <div className="flex-bc" style={{ marginBottom: 10 }}>
            <span className="small">Reference</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{success.reference}</span>
          </div>
          <div className="flex-bc">
            <span className="small">New Balance</span>
            <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: 16 }}>KES {fmt(success.balance)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setSuccess(null); setAmount(''); }}>
            Deposit Again
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPage('dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-download" style={{ color: 'var(--blue)', marginRight: 10 }} />Deposit Funds</div>
        <div className="page-sub">Add money to your DigiPay wallet instantly</div>
      </div>

      {err && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {err}</div>}

      <div className="card">
        <label className="form-label mb-2" style={{ display: 'block', marginBottom: 12 }}>Select Deposit Method</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {methods.map(m => (
            <div
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 12, cursor: 'pointer',
                background: method === m.id ? 'var(--green-glow)' : 'var(--bg3)',
                border: `1px solid ${method === m.id ? 'var(--green-border)' : 'var(--border)'}`,
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: 24 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                <div className="small">{m.desc}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${method === m.id ? 'var(--green)' : 'var(--border)'}`,
                background: method === m.id ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {method === m.id && <i className="bi bi-check" style={{ fontSize: 12, color: '#000' }} />}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Amount (KES)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontWeight: 700 }}>KES</span>
            <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" min="50"
              placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[500, 1000, 2000, 5000, 10000].map(a => (
              <button key={a} className={`chip ${Number(amount) === a ? 'active' : ''}`} onClick={() => setAmount(a)}>
                {a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {method === 'M-PESA' && amount && Number(amount) >= 50 && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <i className="bi bi-info-circle-fill" />
            You'll receive an M-PESA prompt on your phone to authorize KES {fmt(amount)}
          </div>
        )}

        <button className="btn btn-primary" onClick={deposit} disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</> :
            <><i className="bi bi-download" /> Deposit KES {amount ? fmt(amount) : '0.00'}</>}
        </button>
      </div>
    </div>
  );
};