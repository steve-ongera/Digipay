// pages/LoansPage.jsx
const { useState, useEffect } = React;

window.LoansPage = ({ addToast }) => {
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [showRepay, setShowRepay] = useState(null); // loan object
  const [applying, setApplying]   = useState(false);
  const [repaying, setRepaying]   = useState(false);
  const [err, setErr]             = useState('');
  const [form, setForm]           = useState({ amount: '', duration_days: 30, purpose: '' });
  const [repayAmt, setRepayAmt]   = useState('');

  const load = () => {
    window.api.getLoans()
      .then(setLoans)
      .catch(() => addToast('Failed to load loans', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const apply = async () => {
    if (!form.amount || Number(form.amount) < 500) return setErr('Minimum loan is KES 500.');
    setErr(''); setApplying(true);
    try {
      const res = await window.api.applyLoan(form);
      addToast(res.message, 'success');
      setShowApply(false);
      setForm({ amount: '', duration_days: 30, purpose: '' });
      load();
    } catch (e) {
      setErr(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Application failed.');
    } finally {
      setApplying(false);
    }
  };

  const repay = async () => {
    if (!repayAmt || Number(repayAmt) <= 0) return addToast('Enter a valid amount', 'error');
    setRepaying(true);
    try {
      const res = await window.api.repayLoan({ loan_id: showRepay.id, amount: repayAmt });
      addToast(res.message, 'success');
      setShowRepay(null); setRepayAmt('');
      load();
    } catch (e) {
      addToast(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Repayment failed.', 'error');
    } finally {
      setRepaying(false);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const repaidLoans = loans.filter(l => l.status === 'REPAID');

  const interestAmt = form.amount ? (Number(form.amount) * 8 / 100) : 0;
  const totalRepay  = form.amount ? (Number(form.amount) + interestAmt) : 0;

  const statusBadge = s =>
    s === 'ACTIVE' ? <span className="badge badge-r">Active</span> :
    s === 'REPAID' ? <span className="badge badge-g">Repaid</span> :
                     <span className="badge badge-a">{s}</span>;

  return (
    <div>
      <div className="page-header">
        <div className="flex-bc">
          <div>
            <div className="page-title"><i className="bi bi-bank" style={{ color: 'var(--blue)', marginRight: 10 }} />DigiPay Loans</div>
            <div className="page-sub">Instant loans, approved in seconds</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { setShowApply(true); setErr(''); }}
            style={{ border: '1px solid var(--green)', color: 'var(--green)' }}>
            <i className="bi bi-plus-circle" /> Apply
          </button>
        </div>
      </div>

      {/* Key Info */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">INTEREST RATE</div>
          <div className="stat-val c-b">8%</div>
          <div className="stat-sub">Per loan period</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MAX LOAN</div>
          <div className="stat-val">KES 100K</div>
          <div className="stat-sub">Based on credit score</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ACTIVE LOANS</div>
          <div className={`stat-val ${activeLoans.length > 0 ? 'c-r' : 'c-g'}`}>{activeLoans.length}</div>
          <div className="stat-sub">{activeLoans.length === 0 ? 'Eligible to borrow' : 'Repay to borrow again'}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading loans…</div>
      ) : loans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="bi bi-bank" />
            <h4>No loans yet</h4>
            <p>Apply for a DigiPay loan and get money in seconds</p>
            <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto', padding: '12px 28px' }}
              onClick={() => setShowApply(true)}>
              <i className="bi bi-plus-circle" /> Apply for Loan
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeLoans.length > 0 && (
            <>
              <div className="sec-head"><span className="sec-title">Active Loans</span></div>
              {activeLoans.map(loan => (
                <div key={loan.id} className="loan-card">
                  <div className="loan-head">
                    <div>
                      <div className="loan-amt">KES {fmt(loan.amount)}</div>
                      <div className="loan-meta">{loan.reference} · Due {new Date(loan.due_date).toLocaleDateString('en-KE')}</div>
                    </div>
                    {statusBadge(loan.status)}
                  </div>
                  <div className="loan-row"><span>Total Repayable</span><span>KES {fmt(loan.total_repayable)}</span></div>
                  <div className="loan-row"><span>Amount Paid</span><span className="c-g">KES {fmt(loan.amount_paid)}</span></div>
                  <div className="loan-row"><span>Balance Remaining</span><span className="c-r">KES {fmt(loan.balance_remaining)}</span></div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${loan.progress_pct}%` }} />
                  </div>
                  <div className="flex-bc" style={{ marginTop: 4 }}>
                    <span className="small">{loan.progress_pct}% repaid</span>
                    <button className="btn btn-sm" onClick={() => { setShowRepay(loan); setRepayAmt(''); }}
                      style={{ background: 'var(--green)', color: '#000', fontSize: 12, padding: '6px 16px' }}>
                      <i className="bi bi-arrow-return-left" /> Repay
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {repaidLoans.length > 0 && (
            <>
              <div className="sec-head" style={{ marginTop: 8 }}><span className="sec-title">Repaid Loans</span></div>
              {repaidLoans.map(loan => (
                <div key={loan.id} className="loan-card" style={{ opacity: 0.7 }}>
                  <div className="loan-head">
                    <div>
                      <div className="loan-amt">KES {fmt(loan.amount)}</div>
                      <div className="loan-meta">{loan.reference}</div>
                    </div>
                    {statusBadge(loan.status)}
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: '100%' }} /></div>
                  <div className="small" style={{ marginTop: 4 }}>Fully repaid ✓</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* Apply Modal */}
      {showApply && (
        <Modal title="Apply for a Loan" onClose={() => setShowApply(false)}>
          {err && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {err}</div>}
          <div className="form-group">
            <label className="form-label">Loan Amount (KES)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue)', fontWeight: 700 }}>KES</span>
              <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number"
                placeholder="500 – 100,000" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[1000, 2000, 5000, 10000, 20000].map(a => (
                <button key={a} className={`chip ${Number(form.amount) === a ? 'active' : ''}`} onClick={() => set('amount', a)}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Duration</label>
            <select className="form-ctrl" value={form.duration_days} onChange={e => set('duration_days', Number(e.target.value))}>
              {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Purpose <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-ctrl" placeholder="e.g. Business stock" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
          </div>
          {form.amount && Number(form.amount) >= 500 && (
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div className="flex-bc" style={{ marginBottom: 8 }}>
                <span className="small">Principal</span><span style={{ fontWeight: 600 }}>KES {fmt(form.amount)}</span>
              </div>
              <div className="flex-bc" style={{ marginBottom: 8 }}>
                <span className="small">Interest (8%)</span><span style={{ fontWeight: 600, color: 'var(--amber)' }}>KES {fmt(interestAmt)}</span>
              </div>
              <hr className="div" style={{ margin: '10px 0' }} />
              <div className="flex-bc">
                <span style={{ fontWeight: 700 }}>Total Repayable</span>
                <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 16 }}>KES {fmt(totalRepay)}</span>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={apply} disabled={applying}>
            {applying ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</> :
              <><i className="bi bi-bank" /> Apply Now</>}
          </button>
        </Modal>
      )}

      {/* Repay Modal */}
      {showRepay && (
        <Modal title={`Repay Loan – ${showRepay.reference}`} onClose={() => setShowRepay(null)}>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div className="flex-bc" style={{ marginBottom: 8 }}>
              <span className="small">Outstanding</span>
              <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 16 }}>KES {fmt(showRepay.balance_remaining)}</span>
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${showRepay.progress_pct}%` }} />
            </div>
            <div className="small" style={{ marginTop: 4 }}>{showRepay.progress_pct}% already paid</div>
          </div>
          <div className="form-group">
            <label className="form-label">Repayment Amount (KES)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontWeight: 700 }}>KES</span>
              <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number"
                placeholder="0.00" value={repayAmt} onChange={e => setRepayAmt(e.target.value)} />
            </div>
            <button className="chip active" style={{ marginTop: 8 }} onClick={() => setRepayAmt(showRepay.balance_remaining)}>
              Pay full balance KES {fmt(showRepay.balance_remaining)}
            </button>
          </div>
          <button className="btn btn-primary" onClick={repay} disabled={repaying}>
            {repaying ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</> :
              <><i className="bi bi-arrow-return-left" /> Repay Now</>}
          </button>
        </Modal>
      )}
    </div>
  );
};