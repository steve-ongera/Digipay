# 💚 DigiPay – Mobile Banking Application

A full-stack M-Pesa inspired mobile banking app built with **Django REST Framework** + **React**.

---

## 📁 Project Structure

```
digipay/
├── backend/                   # Django REST API
│   ├── digipay/               # Project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── core/                  # Single core app
│   │   ├── models.py          # Wallet, Transaction, Loan, SavingsGoal, MerchantPayment
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # All API views
│   │   ├── urls.py            # API routes
│   │   └── admin.py
│   ├── manage.py
│   ├── requirements.txt
│   └── setup.sh               # One-command setup
│
└── frontend/                  # React (CDN, no build step)
    ├── index.html             # Entry point + Bootstrap Icons
    ├── app.jsx                # Root component + routing
    ├── styles/
    │   └── main.css           # Full design system
    ├── services/
    │   └── api.js             # All API calls
    ├── components/
    │   ├── Sidebar.jsx        # Navigation sidebar
    │   ├── BalanceCard.jsx    # Hero balance display
    │   ├── TxnItem.jsx        # Transaction list item
    │   ├── Modal.jsx          # Reusable modal
    │   └── Toast.jsx          # Toast notifications
    └── pages/
        ├── AuthPage.jsx       # Login + Register
        ├── DashboardPage.jsx  # Home / overview
        ├── SendPage.jsx       # Send money (3-step)
        ├── DepositPage.jsx    # Deposit funds
        ├── WithdrawPage.jsx   # Withdraw to M-PESA
        ├── TransactionsPage.jsx # History + filters
        ├── LoansPage.jsx      # Apply & repay loans
        ├── SavingsPage.jsx    # Goals + deposits
        └── LipaPage.jsx       # Lipa Na DigiPay
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
chmod +x setup.sh
./setup.sh           # installs deps, migrates, creates demo user
source venv/bin/activate
python manage.py runserver
```

**Demo login:** `admin` / `admin123` (KES 10,000 balance pre-loaded)

### Frontend

No build step needed — just open `frontend/index.html` in a browser, or serve it:

```bash
cd frontend
python3 -m http.server 3000
# open http://localhost:3000
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns token |
| POST | `/api/auth/logout/` | Invalidate token |
| GET | `/api/dashboard/` | Full dashboard data |
| GET | `/api/wallet/` | Wallet details |
| GET | `/api/transactions/` | Transaction history |
| POST | `/api/send/` | Send money |
| POST | `/api/deposit/` | Deposit funds |
| POST | `/api/withdraw/` | Withdraw to M-PESA |
| GET/POST | `/api/loans/` | List / apply for loan |
| POST | `/api/loans/repay/` | Repay a loan |
| GET/POST | `/api/savings/` | List / create savings goal |
| POST | `/api/savings/deposit/` | Add to savings goal |
| POST | `/api/lipa/` | Lipa Na DigiPay payment |

---

## ✨ Features

- 🔐 **Token authentication** (DRF TokenAuth)
- 💸 **Send Money** — P2P between DigiPay accounts (3-step flow)
- 📥 **Deposit** — M-PESA, Bank, Agent
- 📤 **Withdraw** — Instant to M-PESA
- 📊 **Transactions** — Full history with filters & search
- 🏦 **Loans** — Apply, auto-approve, repay (8% flat rate)
- 🐷 **Savings Goals** — Create goals, track progress (5% p.a.)
- 🛍️ **Lipa Na DigiPay** — Pay 9 popular merchants + custom
- 📱 **Fully responsive** — Mobile sidebar, touch-friendly
- 🌙 **Dark UI** — DigiPay green-on-dark design system

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, DRF 3.14 |
| Database | SQLite (dev), PostgreSQL (prod) |
| Auth | DRF Token Authentication |
| CORS | django-cors-headers |
| Frontend | React 18 (CDN + Babel) |
| Styling | Custom CSS (no framework) |
| Icons | Bootstrap Icons 1.11 |
| Fonts | Sora + DM Mono (Google Fonts) |

---

## 🛡️ Production Checklist

- [ ] Change `SECRET_KEY` in settings.py
- [ ] Set `DEBUG = False`
- [ ] Use PostgreSQL
- [ ] Set proper `ALLOWED_HOSTS`
- [ ] Configure proper CORS origins
- [ ] Use HTTPS
- [ ] Integrate real M-PESA Daraja API
- [ ] Bundle React with Vite/Webpack