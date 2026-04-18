// components/Modal.jsx
window.Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-head">
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose}><i className="bi bi-x" /></button>
      </div>
      {children}
    </div>
  </div>
);