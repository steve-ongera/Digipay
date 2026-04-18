// pages/WithdrawPage.jsx
const { useState } = React;

window.WithdrawPage = ({ addToast, setPage }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [success, setSuccess] = useState(null);
  const [form, setForm]       = useState({ recipient_no: '', amount: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const withdraw = async () => {
    if (!form.recipient_no) return setErr('Enter M-PESA phone number.');
    if (!form.amount || Number(form.amount) < 50) return setErr('Minimum withdrawal is KES 50.');
    setErr(''); setLoading(true);
    try {
      const res = await window.api.withdraw(form);
      setSuccess(res);
      addToast(res.message, 'success');
    } catch (e) {
      setErr(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-upload" style={{ color: 'var(--red)', marginRight: 10 }} />Withdraw</div>
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,106,0.1)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30 }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>Withdrawal Successful!</h2>
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
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setSuccess(null); setForm({ recipient_no: '', amount: '' }); }}>
            Withdraw Again
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPage('dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-upload" style={{ color: 'var(--red)', marginRight: 10 }} />Withdraw Cash</div>
        <div className="page-sub">Withdraw to your M-PESA in seconds</div>
      </div>

      {err && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {err}</div>}

      <div className="card">
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <i className="bi bi-info-circle-fill" />
          Funds will be sent to your M-PESA within 30 seconds
        </div>

        <div className="form-group">
          <label className="form-label">M-PESA Phone Number</label>
          <div style={{ position: 'relative' }}>
            <i className="bi bi-phone" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16 }} />
            <input className="form-ctrl mono" style={{ paddingLeft: 42 }} type="tel"
              placeholder="e.g. 0712345678" value={form.recipient_no}
              onChange={e => set('recipient_no', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Amount (KES)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--red)', fontWeight: 700 }}>KES</span>
            <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" min="50"
              placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[200, 500, 1000, 2000, 5000].map(a => (
              <button key={a} className={`chip ${Number(form.amount) === a ? 'active' : ''}`} onClick={() => set('amount', a)}>
                {a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div className="flex-bc">
            <span className="small">Withdrawal Fee</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>FREE</span>
          </div>
          <div className="flex-bc" style={{ marginTop: 8 }}>
            <span className="small">You will receive</span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>
              KES {form.amount ? fmt(form.amount) : '0.00'}
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={withdraw} disabled={loading}
          style={{ background: loading ? undefined : 'var(--red)', color: loading ? undefined : '#fff' }}>
          {loading
            ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</>
            : <><i className="bi bi-upload" /> Withdraw to M-PESA</>}
        </button>
      </div>
    </div>
  );
};