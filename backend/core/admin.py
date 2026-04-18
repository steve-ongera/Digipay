from django.contrib import admin
from .models import Wallet, Transaction, Loan, SavingsGoal, MerchantPayment, UserProfile
for m in [Wallet, Transaction, Loan, SavingsGoal, MerchantPayment, UserProfile]:
    admin.site.register(m)