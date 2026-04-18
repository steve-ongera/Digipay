// pages/SavingsPage.jsx
const { useState, useEffect } = React;

window.SavingsPage = ({ addToast }) => {
  const [goals, setGoals]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeposit, setShowDeposit] = useState(null);
  const [creating, setCreating]   = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [form, setForm]           = useState({ name: '', target_amount: '', target_date: '', emoji: '🎯' });
  const [depositAmt, setDepositAmt] = useState('');

  const emojis = ['🎯', '🏠', '🚗', '✈️', '📱', '🎓', '💍', '🏖️', '💼', '🎮'];

  const load = () => {
    window.api.getSavings()
      .then(setGoals)
      .catch(() => addToast('Failed to load savings', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmt = n => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const create = async () => {
    if (!form.name) return addToast('Enter goal name', 'error');
    if (!form.target_amount || Number(form.target_amount) <= 0) return addToast('Enter target amount', 'error');
    setCreating(true);
    try {
      const res = await window.api.createGoal(form);
      addToast(res.message, 'success');
      setShowCreate(false);
      setForm({ name: '', target_amount: '', target_date: '', emoji: '🎯' });
      load();
    } catch (e) {
      addToast(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Failed to create goal.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const deposit = async () => {
    if (!depositAmt || Number(depositAmt) <= 0) return addToast('Enter valid amount', 'error');
    setDepositing(true);
    try {
      const res = await window.api.savingsDeposit({ goal_id: showDeposit.id, amount: depositAmt });
      addToast(res.message, 'success');
      setShowDeposit(null); setDepositAmt('');
      load();
    } catch (e) {
      addToast(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Deposit failed.', 'error');
    } finally {
      setDepositing(false);
    }
  };

  const totalSaved  = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const overallPct  = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="flex-bc">
          <div>
            <div className="page-title"><i className="bi bi-piggy-bank-fill" style={{ color: 'var(--amber)', marginRight: 10 }} />Savings Goals</div>
            <div className="page-sub">Save smarter, reach your goals faster</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(true)}
            style={{ border: '1px solid var(--green)', color: 'var(--green)' }}>
            <i className="bi bi-plus-circle" /> New Goal
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL SAVED</div>
          <div className="stat-val c-g">KES {fmt(totalSaved)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL TARGET</div>
          <div className="stat-val c-a">KES {fmt(totalTarget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">OVERALL PROGRESS</div>
          <div className="stat-val">{overallPct}%</div>
          <div className="progress" style={{ marginTop: 8 }}>
            <div className="progress-fill amber" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      {/* Interest banner */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <i className="bi bi-percent" />
        <div>
          <div style={{ fontWeight: 700 }}>Earn 5% interest per year</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>Interest is added monthly on your savings balance</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading goals…</div>
      ) : goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="bi bi-piggy-bank" />
            <h4>No savings goals yet</h4>
            <p>Create a goal and start saving towards something meaningful</p>
            <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto', padding: '12px 28px' }}
              onClick={() => setShowCreate(true)}>
              <i className="bi bi-plus-circle" /> Create First Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="two-col">
          {goals.map(g => (
            <div key={g.id} className="save-card">
              <div className="save-head">
                <span className="save-emoji">{g.emoji}</span>
                <span className="save-name">{g.name}</span>
                <span className="badge badge-g">{g.progress_pct}%</span>
              </div>
              <div className="save-row"><span>Saved</span><span className="c-g">KES {fmt(g.current_amount)}</span></div>
              <div className="save-row"><span>Target</span><span>KES {fmt(g.target_amount)}</span></div>
              {g.target_date && <div className="save-row"><span>Deadline</span><span>{new Date(g.target_date).toLocaleDateString('en-KE')}</span></div>}
              <div className="progress">
                <div className="progress-fill amber" style={{ width: `${g.progress_pct}%` }} />
              </div>
              <div className="small" style={{ marginBottom: 12 }}>
                KES {fmt(Number(g.target_amount) - Number(g.current_amount))} remaining
              </div>
              <button
                className="btn btn-sm w-full"
                style={{ background: 'var(--amber)', color: '#000', fontWeight: 700 }}
                onClick={() => { setShowDeposit(g); setDepositAmt(''); }}
                disabled={g.progress_pct >= 100}
              >
                <i className="bi bi-plus-circle" />
                {g.progress_pct >= 100 ? 'Goal Reached! 🎉' : 'Add Money'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreate && (
        <Modal title="Create Savings Goal" onClose={() => setShowCreate(false)}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input className="form-ctrl" placeholder="e.g. New iPhone" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pick an Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {emojis.map(e => (
                <button key={e}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: `2px solid ${form.emoji === e ? 'var(--green)' : 'var(--border)'}`,
                    background: form.emoji === e ? 'var(--green-glow)' : 'var(--bg3)',
                    fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => set('emoji', e)}>{e}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Target Amount (KES)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--amber)', fontWeight: 700 }}>KES</span>
              <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" placeholder="0.00"
                value={form.target_amount} onChange={e => set('target_amount', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Target Date <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-ctrl" type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={create} disabled={creating}
            style={{ background: 'var(--amber)', color: '#000' }}>
            {creating ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating…</> :
              <><i className="bi bi-piggy-bank-fill" /> Create Goal</>}
          </button>
        </Modal>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <Modal title={`Save to: ${showDeposit.emoji} ${showDeposit.name}`} onClose={() => setShowDeposit(null)}>
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div className="flex-bc" style={{ marginBottom: 8 }}>
              <span className="small">Current savings</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>KES {fmt(showDeposit.current_amount)}</span>
            </div>
            <div className="flex-bc">
              <span className="small">Remaining to goal</span>
              <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                KES {fmt(Number(showDeposit.target_amount) - Number(showDeposit.current_amount))}
              </span>
            </div>
            <div className="progress" style={{ marginTop: 10 }}>
              <div className="progress-fill amber" style={{ width: `${showDeposit.progress_pct}%` }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount to Save (KES)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--amber)', fontWeight: 700 }}>KES</span>
              <input className="form-ctrl" style={{ paddingLeft: 52 }} type="number" placeholder="0.00"
                value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[100, 500, 1000, 2000].map(a => (
                <button key={a} className={`chip ${Number(depositAmt) === a ? 'active' : ''}`} onClick={() => setDepositAmt(a)}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={deposit} disabled={depositing}
            style={{ background: 'var(--amber)', color: '#000' }}>
            {depositing ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving…</> :
              <><i className="bi bi-piggy-bank-fill" /> Save Now</>}
          </button>
        </Modal>
      )}
    </div>
  );
};