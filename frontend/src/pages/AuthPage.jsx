// pages/AuthPage.jsx
const { useState } = React;

window.AuthPage = ({ onAuth }) => {
  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');
  const [form, setForm]     = useState({
    username: '', password: '', confirm_password: '',
    first_name: '', last_name: '', email: '', phone: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await window.api.login({ username: form.username, password: form.password });
      } else {
        res = await window.api.register({
          username: form.username, password: form.password,
          confirm_password: form.confirm_password,
          first_name: form.first_name, last_name: form.last_name,
          email: form.email, phone: form.phone,
        });
      }
      window.auth.save(res.token, res.user);
      onAuth(res.user);
    } catch (e) {
      const msg = typeof e === 'object'
        ? Object.values(e).flat().join(' ')
        : 'Something went wrong.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, k, type = 'text', placeholder, icon }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <i className={`bi bi-${icon}`} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', fontSize: 15, pointerEvents: 'none',
          }} />
        )}
        <input
          className="form-ctrl"
          style={icon ? { paddingLeft: 40 } : {}}
          type={type}
          placeholder={placeholder}
          value={form[k]}
          onChange={e => set(k, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-bg">
        <div className="auth-glow g1" />
        <div className="auth-glow g2" />
      </div>

      <div className="auth-card">
        <div className="auth-head">
          <div className="logo-icon" style={{
            width: 58, height: 58, background: 'linear-gradient(135deg,#00D46A,#00A352)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 14px',
            boxShadow: '0 0 22px rgba(0,212,106,0.4)',
          }}>💚</div>
          <h1>Digi<span style={{ color: 'var(--green)' }}>Pay</span></h1>
          <p>Kenya's fastest mobile banking experience</p>
        </div>

        <div className="auth-tabs">
          {['login', 'register'].map(t => (
            <button
              key={t}
              className={`auth-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setErr(''); }}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {err && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle-fill" /> {err}
          </div>
        )}

        {tab === 'login' ? (
          <>
            <Field label="Username / Phone" k="username" icon="person" placeholder="Enter username" />
            <Field label="PIN / Password" k="password" type="password" icon="lock" placeholder="Enter your PIN" />
            <div style={{ marginTop: 6, marginBottom: 20, textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: 'var(--green)', cursor: 'pointer' }}>Forgot PIN?</span>
            </div>
          </>
        ) : (
          <>
            <div className="two-col">
              <Field label="First Name" k="first_name" placeholder="John" />
              <Field label="Last Name"  k="last_name"  placeholder="Doe" />
            </div>
            <Field label="Username"     k="username" icon="person"    placeholder="johndoe" />
            <Field label="Phone Number" k="phone"    icon="phone"     placeholder="0712345678" />
            <Field label="Email"        k="email"    icon="envelope"  type="email" placeholder="john@email.com" />
            <Field label="PIN / Password"       k="password"         type="password" icon="lock" placeholder="Create PIN (min 4 chars)" />
            <Field label="Confirm PIN" k="confirm_password" type="password" icon="lock-fill" placeholder="Repeat PIN" />
          </>
        )}

        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing…</> :
            tab === 'login' ? <><i className="bi bi-box-arrow-in-right" /> Sign In</> :
                              <><i className="bi bi-person-plus-fill" /> Create Account</>}
        </button>

        {tab === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 18 }}>
            No account?{' '}
            <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setTab('register')}>Register free →</span>
          </p>
        )}
      </div>
    </div>
  );
};