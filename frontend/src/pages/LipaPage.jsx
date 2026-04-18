// pages/LipaPage.jsx
const { useState } = React;

window.LipaPage = ({ addToast, setPage }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [success, setSuccess] = useState(null);
  const [selMerchant, setSelMerchant] = useState(null);
  const [form, setForm]       = useState({ merchant_code: '', merchant_name: '', amount: '', account_ref: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const popularMerchants = [
    { code: '174379', name: 'Safaricom Shop',   icon: '📡', category: 'Telecom' },
    { code: '247247', name: 'Kenya Power',       icon: '⚡', category: 'Utilities' },
    { code: '891300', name: 'Nairobi Water',     icon: '💧', category: 'Utilities' },
    { code: '400222', name: 'DStv Kenya',        icon: '📺', category: 'Entertainment' },
    { code: '514100', name: 'Java House',        icon: '☕', category: 'Food' },
    { code: '603130', name: 'Uber Kenya',        icon: '🚗', category: 'Transport' },
    { code: '729929', name: 'Jumia Kenya',       icon: '🛍️', category: 'Shopping' },
    { code: '338338', name: 'Equity Bank',       icon: '🏦', category: 'Banking' },
    { code: '111000', name: 'KRA iTax',          icon: '🏛️', category: 'Government' },
  ];

  const pickMerchant = (m) => {
    setSelMerchant(m);
    setForm(f => ({ ...f, merchant_code: m.code, merchant_name: m.name }));
    setErr('');
  };

  const pay = async () => {
    if (!form.merchant_code) return setErr('Enter or select a merchant.');
    if (!form.merchant_name) return setErr('Enter merchant name.');
    if (!form.amount || Number(form.amount) <= 0) return setErr('Enter a valid amount.');
    setErr(''); setLoading(true);
    try {
      const res = await window.api.lipa({
        merchant_code: form.merchant_code,
        merchant_name: form.merchant_name,
        amount:        form.amount,
        account_ref:   form.account_ref,
      });
      setSuccess(res);
      addToast(res.message, 'success');
    } catch (e) {
      setErr(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-shop-window" style={{ color: 'var(--purple)', marginRight: 10 }} />Lipa Na DigiPay</div>
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,106,0.1)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30 }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>Payment Successful!</h2>
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
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setSuccess(null); setSelMerchant(null); setForm({ merchant_code: '', merchant_name: '', amount: '', account_ref: '' }); }}>
            Pay Again
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPage('dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-shop-window" style={{ color: 'var(--purple)', marginRight: 10 }} />Lipa Na DigiPay</div>
        <div className="page-sub">Pay bills and merchants instantly</div>
      </div>

      {err && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {err}</div>}

      {/* Popular merchants */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="sec-head">
          <span className="sec-title">Popular Merchants</span>
          {selMerchant && (
            <button className="see-all" onClick={() => { setSelMerchant(null); setForm(f => ({ ...f, merchant_code: '', merchant_name: '' })); }}>
              Clear
            </button>
          )}
        </div>
        <div className="merchant-grid">
          {popularMerchants.map(m => (
            <div
              key={m.code}
              className={`merchant-tile ${selMerchant?.code === m.code ? 'sel' : ''}`}
              onClick={() => pickMerchant(m)}
            >
              <div className="icon">{m.icon}</div>
              <div className="name">{m.name}</div>
              <div className="code">{m.code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment form */}
      <div className="card" style={{ maxWidth: 480 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 15 }}>
          {selMerchant ? `Pay ${selMerchant.name}` : 'Or Enter Merchant Details'}
        </h3>

        <div className="form-group">
          <label className="form-label">Till / Paybill Number</label>
          <input className="form-ctrl mono" placeholder="e.g. 174379"
            value={form.merchant_code} onChange={e => set('merchant_code', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Merchant / Business Name</label>
          <input className="form-ctrl" placeholder="e.g. Safaricom Shop"
            value={form.merchant_name} onChange={e => set('merchant_name', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Account Reference <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <input className="form-ctrl" placeholder="e.g. Meter number, Account No"
            value={form.account_ref} onChange={e => set('account_ref', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Amount (KES)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', fontWeight: 700 }}>KES</span>
            <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" placeholder="0.00"
              value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[50, 100, 200, 500, 1000, 2500].map(a => (
              <button key={a} className={`chip ${Number(form.amount) === a ? 'active' : ''}`} onClick={() => set('amount', a)}>
                {a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {form.merchant_name && form.amount && Number(form.amount) > 0 && (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
            <div className="flex-bc">
              <span className="small">Paying {form.merchant_name}</span>
              <span style={{ fontWeight: 800, color: 'var(--purple)', fontSize: 16 }}>KES {fmt(form.amount)}</span>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={pay} disabled={loading}
          style={{ background: loading ? undefined : 'var(--purple)', color: '#fff' }}>
          {loading
            ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</>
            : <><i className="bi bi-shop-window" /> Pay Now</>}
        </button>
      </div>
    </div>
  );
};