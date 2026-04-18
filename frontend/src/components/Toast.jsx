// components/Toast.jsx
const { useState, useEffect, useCallback } = React;

window.useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const ToastContainer = () => (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`bi bi-${
            t.type === 'success' ? 'check-circle-fill' :
            t.type === 'error'   ? 'x-circle-fill' :
            'info-circle-fill'
          }`} style={{ color: t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : 'var(--blue)', fontSize: 16 }} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
};