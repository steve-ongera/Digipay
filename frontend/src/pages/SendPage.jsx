// pages/SendPage.jsx
const { useState } = React;

window.SendPage = ({ addToast, setPage }) => {
  const [step, setStep]       = useState(1); // 1=form, 2=confirm, 3=success
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [result, setResult]   = useState(null);
  const [form, setForm]       = useState({ recipient_no: '', amount: '', description: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const toConfirm = () => {
    setErr('');
    if (!form.recipient_no) return setErr('Enter recipient account number.');
    if (!form.amount || Number(form.amount) <= 0) return setErr('Enter a valid amount.');
    setStep(2);
  };

  const send = async () => {
    setLoading(true); setErr('');
    try {
      const res = await window.api.sendMoney({
        recipient_no: form.recipient_no,
        amount:       form.amount,
        description:  form.description,
      });
      setResult(res);
      setStep(3);
      addToast(res.message, 'success');
    } catch (e) {
      const msg = typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Send failed.';
      setErr(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <div className="page-title"><i className="bi bi-send-fill" style={{ color: 'var(--green)', marginRight: 10 }} />Send Money</div>
        <div className="page-sub">Transfer funds instantly to any DigiPay account</div>
      </div>

      {/* Steps indicator */}
      <div className="flex-c gap-2 mb-2" style={{ marginBottom: 24 }}>
        {['Details', 'Confirm', 'Done'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex-c gap-1">
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step > i ? 'var(--green)' : step === i + 1 ? 'var(--green)' : 'var(--bg3)',
                border: `2px solid ${step >= i + 1 ? 'var(--green)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: step >= i + 1 ? '#000' : 'var(--text3)',
              }}>
                {step > i + 1 ? <i className="bi bi-check" /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? 'var(--text)' : 'var(--text3)' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--green)' : 'var(--border)' }} />}
          </React.Fragment>
        ))}
      </div>

      {err && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {err}</div>}

      {step === 1 && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Recipient Account Number</label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-person-circle" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16 }} />
              <input className="form-ctrl mono" style={{ paddingLeft: 42 }} type="text"
                placeholder="e.g. 0712345678" value={form.recipient_no}
                onChange={e => set('recipient_no', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (KES)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>KES</span>
              <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" min="10"
                placeholder="0.00" value={form.amount}
                onChange={e => set('amount', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[100, 500, 1000, 2000, 5000].map(amt => (
                <button key={amt} className="chip" onClick={() => set('amount', amt)}>
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Description <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-ctrl" type="text" placeholder="e.g. Lunch money"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={toConfirm}>
            <i className="bi bi-arrow-right" /> Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Confirm Transfer</h3>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            {[
              ['To Account', form.recipient_no],
              ['Amount', `KES ${fmt(form.amount)}`],
              ['Description', form.description || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex-bc" style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: 14, fontFamily: label === 'To Account' ? 'DM Mono' : 'inherit' }}>{value}</span>
              </div>
            ))}
            <hr className="div" style={{ margin: '14px 0' }} />
            <div className="flex-bc">
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>You will send</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>KES {fmt(form.amount)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>
              <i className="bi bi-arrow-left" /> Back
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={send} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending…</> :
                <><i className="bi bi-send-fill" /> Confirm & Send</>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--green-glow)', border: '2px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', fontSize: 30,
          }}>✅</div>
          <h2 style={{ fontWeight: 800, marginBottom: 6 }}>Transfer Successful!</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 22 }}>{result.message}</p>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 18, marginBottom: 22, textAlign: 'left' }}>
            <div className="flex-bc" style={{ marginBottom: 10 }}>
              <span className="small">Reference</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{result.reference}</span>
            </div>
            <div className="flex-bc">
              <span className="small">New Balance</span>
              <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: 16 }}>KES {fmt(result.balance)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setForm({ recipient_no: '', amount: '', description: '' }); setStep(1); setResult(null); }}>
              Send Again
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPage('dashboard')}>
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};