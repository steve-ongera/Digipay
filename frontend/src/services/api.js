// src/services/api.js
const BASE = '/api';

const getToken = () => localStorage.getItem('digipay_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Token ${getToken()}` } : {}),
  ...extra,
});

const req = async (method, path, body = null) => {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const api = {
  // ── Auth
  register: (d) => req('POST', '/auth/register/', d),
  login:    (d) => req('POST', '/auth/login/',    d),
  logout:   ()  => req('POST', '/auth/logout/'),

  // ── Core
  dashboard:    () => req('GET', '/dashboard/'),
  wallet:       () => req('GET', '/wallet/'),
  transactions: () => req('GET', '/transactions/'),

  // ── Money ops
  sendMoney: (d) => req('POST', '/send/',     d),
  deposit:   (d) => req('POST', '/deposit/',  d),
  withdraw:  (d) => req('POST', '/withdraw/', d),

  // ── Loans
  getLoans:  ()  => req('GET',  '/loans/'),
  applyLoan: (d) => req('POST', '/loans/',       d),
  repayLoan: (d) => req('POST', '/loans/repay/', d),

  // ── Savings
  getSavings:     () => req('GET',  '/savings/'),
  createGoal:     (d) => req('POST', '/savings/',         d),
  savingsDeposit: (d) => req('POST', '/savings/deposit/', d),

  // ── Lipa
  lipa: (d) => req('POST', '/lipa/', d),
};

export const auth = {
  save:   (token, user) => {
    localStorage.setItem('digipay_token', token);
    localStorage.setItem('digipay_user', JSON.stringify(user));
  },
  clear:  () => {
    localStorage.removeItem('digipay_token');
    localStorage.removeItem('digipay_user');
  },
  token:  () => localStorage.getItem('digipay_token'),
  user:   () => {
    try { return JSON.parse(localStorage.getItem('digipay_user')); }
    catch { return null; }
  },
  isAuth: () => !!localStorage.getItem('digipay_token'),
};