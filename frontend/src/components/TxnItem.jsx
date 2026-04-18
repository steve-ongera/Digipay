// components/TxnItem.jsx
window.TxnItem = ({ tx }) => {
  const isCredit = ['RECEIVE', 'DEPOSIT', 'LOAN_DISBURSE'].includes(tx.txn_type);
  const isSave   = ['SAVE_IN', 'SAVE_OUT'].includes(tx.txn_type);
  const isLoan   = ['LOAN_DISBURSE', 'LOAN_REPAY'].includes(tx.txn_type);
  const isLipa   = tx.txn_type === 'LIPA';

  const iconMap = {
    SEND:         { icon: 'arrow-up-right',    cls: 'debit'  },
    RECEIVE:      { icon: 'arrow-down-left',   cls: 'credit' },
    DEPOSIT:      { icon: 'download',          cls: 'credit' },
    WITHDRAW:     { icon: 'upload',            cls: 'debit'  },
    LIPA:         { icon: 'shop-window',       cls: 'lipa'   },
    LOAN_DISBURSE:{ icon: 'bank',              cls: 'loan'   },
    LOAN_REPAY:   { icon: 'arrow-return-left', cls: 'loan'   },
    SAVE_IN:      { icon: 'piggy-bank-fill',   cls: 'save'   },
    SAVE_OUT:     { icon: 'piggy-bank',        cls: 'save'   },
  };

  const labelMap = {
    SEND:         'Sent Money',
    RECEIVE:      'Received Money',
    DEPOSIT:      'Deposit',
    WITHDRAW:     'Withdrawal',
    LIPA:         'Lipa Na DigiPay',
    LOAN_DISBURSE:'Loan Disbursed',
    LOAN_REPAY:   'Loan Repayment',
    SAVE_IN:      'Savings Deposit',
    SAVE_OUT:     'Savings Withdrawal',
  };

  const { icon, cls } = iconMap[tx.txn_type] || { icon: 'arrow-left-right', cls: 'debit' };
  const fmt = (n) => Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });
  const dateStr = new Date(tx.created_at).toLocaleString('en-KE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const descLine = tx.description || tx.recipient_name || tx.recipient_no || '';

  return (
    <div className="txn-item">
      <div className={`txn-icon ${cls}`}>
        <i className={`bi bi-${icon}`} />
      </div>
      <div className="txn-body">
        <div className="txn-type">{labelMap[tx.txn_type] || tx.txn_type}</div>
        {descLine && <div className="txn-desc">{descLine}</div>}
        <div className="txn-ref">{tx.reference}</div>
      </div>
      <div className="txn-right">
        <div className={`txn-amount ${isCredit ? 'credit' : 'debit'}`}>
          {isCredit ? '+' : '-'} KES {fmt(tx.amount)}
        </div>
        <div className="txn-date">{dateStr}</div>
      </div>
    </div>
  );
};