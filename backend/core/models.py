from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid, random, string


def gen_account():
    return '0' + ''.join(random.choices(string.digits, k=9))

def gen_ref():
    return 'DP' + uuid.uuid4().hex[:10].upper()


class UserProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone       = models.CharField(max_length=15, unique=True)
    id_number   = models.CharField(max_length=20, blank=True)
    credit_score= models.IntegerField(default=350)
    is_verified = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.user.username} – {self.phone}"


class Wallet(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    account_no  = models.CharField(max_length=20, unique=True, default=gen_account)
    balance     = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.user.username} | {self.account_no} | {self.balance}"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('SEND',            'Send Money'),
        ('RECEIVE',         'Receive Money'),
        ('DEPOSIT',         'Deposit'),
        ('WITHDRAW',        'Withdraw'),
        ('LIPA',            'Lipa Na DigiPay'),
        ('LOAN_DISBURSE',   'Loan Disbursement'),
        ('LOAN_REPAY',      'Loan Repayment'),
        ('SAVE_IN',         'Savings Deposit'),
        ('SAVE_OUT',        'Savings Withdrawal'),
    ]
    STATUS = [('SUCCESS','Success'),('PENDING','Pending'),('FAILED','Failed')]

    wallet          = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    txn_type        = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount          = models.DecimalField(max_digits=14, decimal_places=2)
    reference       = models.CharField(max_length=20, unique=True, default=gen_ref)
    recipient_no    = models.CharField(max_length=20, blank=True)
    recipient_name  = models.CharField(max_length=100, blank=True)
    description     = models.TextField(blank=True)
    status          = models.CharField(max_length=10, choices=STATUS, default='SUCCESS')
    balance_after   = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta: ordering = ['-created_at']
    def __str__(self): return f"{self.reference} {self.txn_type} {self.amount}"


class Loan(models.Model):
    STATUS = [('ACTIVE','Active'),('REPAID','Repaid'),('OVERDUE','Overdue')]

    wallet          = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='loans')
    amount          = models.DecimalField(max_digits=14, decimal_places=2)
    interest_rate   = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)
    total_repayable = models.DecimalField(max_digits=14, decimal_places=2)
    amount_paid     = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    duration_days   = models.IntegerField(default=30)
    purpose         = models.TextField(blank=True)
    reference       = models.CharField(max_length=20, unique=True, default=gen_ref)
    status          = models.CharField(max_length=10, choices=STATUS, default='ACTIVE')
    due_date        = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"Loan {self.reference} – {self.amount}"

    @property
    def balance_remaining(self):
        return max(0, float(self.total_repayable) - float(self.amount_paid))

    @property
    def progress_pct(self):
        if float(self.total_repayable) == 0: return 0
        return round((float(self.amount_paid) / float(self.total_repayable)) * 100, 1)


class SavingsGoal(models.Model):
    wallet          = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='savings')
    name            = models.CharField(max_length=100)
    target_amount   = models.DecimalField(max_digits=14, decimal_places=2)
    current_amount  = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    interest_rate   = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    target_date     = models.DateField(null=True, blank=True)
    emoji           = models.CharField(max_length=5, default='🎯')
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.wallet.user.username} – {self.name}"

    @property
    def progress_pct(self):
        if float(self.target_amount) == 0: return 0
        return min(100, round((float(self.current_amount) / float(self.target_amount)) * 100, 1))


class MerchantPayment(models.Model):
    wallet          = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='merchant_payments')
    merchant_code   = models.CharField(max_length=20)
    merchant_name   = models.CharField(max_length=100)
    amount          = models.DecimalField(max_digits=14, decimal_places=2)
    account_ref     = models.CharField(max_length=50, blank=True)
    reference       = models.CharField(max_length=20, unique=True, default=gen_ref)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.merchant_name} – {self.amount}"


@receiver(post_save, sender=User)
def bootstrap_user(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(user=instance)