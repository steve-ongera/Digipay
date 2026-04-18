from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register,    name='register'),
    path('auth/login/',    views.login_view,  name='login'),
    path('auth/logout/',   views.logout_view, name='logout'),

    # Dashboard & Wallet
    path('dashboard/',  views.dashboard,    name='dashboard'),
    path('wallet/',     views.wallet_detail,name='wallet'),

    # Money ops
    path('send/',     views.send_money, name='send'),
    path('deposit/',  views.deposit,    name='deposit'),
    path('withdraw/', views.withdraw,   name='withdraw'),

    # Transactions
    path('transactions/', views.transactions, name='transactions'),

    # Loans
    path('loans/',       views.loans,      name='loans'),
    path('loans/repay/', views.repay_loan, name='repay_loan'),

    # Savings
    path('savings/',         views.savings,         name='savings'),
    path('savings/deposit/', views.savings_deposit, name='savings_deposit'),

    # Lipa Na DigiPay
    path('lipa/', views.lipa, name='lipa'),
]