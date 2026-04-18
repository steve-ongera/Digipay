from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from .models import Wallet, Transaction, Loan, SavingsGoal, MerchantPayment
from .serializers import (
    RegisterSerializer, UserSerializer, WalletSerializer,
    TransactionSerializer, LoanSerializer, SavingsGoalSerializer,
    MerchantPaymentSerializer, SendMoneySerializer, DepositSerializer,
    WithdrawSerializer, LoanRequestSerializer, LoanRepaySerializer,
    SavingsCreateSerializer, SavingsDepositSerializer, LipaSerializer,
)


# ── AUTH ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    user  = s.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token':      token.key,
        'user':       UserSerializer(user).data,
        'account_no': user.wallet.account_no,
        'message':    'Welcome to DigiPay! Your account is ready.',
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    user = authenticate(
        username=request.data.get('username'),
        password=request.data.get('password'),
    )
    if not user:
        return Response({'error': 'Invalid phone/username or PIN.'}, status=401)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': UserSerializer(user).data})


@api_view(['POST'])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out.'})


# ── DASHBOARD ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
def dashboard(request):
    wallet   = request.user.wallet
    recent   = wallet.transactions.all()[:6]
    loans    = wallet.loans.filter(status='ACTIVE')
    goals    = wallet.savings.filter(is_active=True)
    return Response({
        'balance':        float(wallet.balance),
        'account_no':     wallet.account_no,
        'full_name':      request.user.get_full_name() or request.user.username,
        'recent_txns':    TransactionSerializer(recent, many=True).data,
        'active_loans':   LoanSerializer(loans, many=True).data,
        'savings_goals':  SavingsGoalSerializer(goals, many=True).data,
        'total_saved':    sum(float(g.current_amount) for g in goals),
        'total_loan_due': sum(float(l.balance_remaining) for l in loans),
    })


# ── WALLET ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def wallet_detail(request):
    return Response(WalletSerializer(request.user.wallet).data)


# ── SEND MONEY ────────────────────────────────────────────────────────────────

@api_view(['POST'])
def send_money(request):
    s = SendMoneySerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    wallet = request.user.wallet
    amount = Decimal(str(d['amount']))

    if amount < 10:
        return Response({'error': 'Minimum send is KES 10.'}, status=400)
    if amount > wallet.balance:
        return Response({'error': 'Insufficient balance.'}, status=400)

    # find recipient
    try:
        recv_wallet = Wallet.objects.get(account_no=d['recipient_no'])
        recv_name   = recv_wallet.user.get_full_name() or recv_wallet.user.username
    except Wallet.DoesNotExist:
        recv_wallet = None
        recv_name   = 'DigiPay User'

    wallet.balance -= amount
    wallet.save()

    tx = Transaction.objects.create(
        wallet=wallet, txn_type='SEND', amount=amount,
        recipient_no=d['recipient_no'], recipient_name=recv_name,
        description=d.get('description', ''), balance_after=wallet.balance,
    )

    if recv_wallet:
        recv_wallet.balance += amount
        recv_wallet.save()
        Transaction.objects.create(
            wallet=recv_wallet, txn_type='RECEIVE', amount=amount,
            recipient_no=wallet.account_no,
            recipient_name=request.user.get_full_name() or request.user.username,
            description=f'From {request.user.get_full_name() or request.user.username}',
            balance_after=recv_wallet.balance,
        )

    return Response({
        'message':     f'KES {amount:,.2f} sent to {recv_name}',
        'reference':   tx.reference,
        'balance':     float(wallet.balance),
        'transaction': TransactionSerializer(tx).data,
    })


# ── DEPOSIT ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
def deposit(request):
    s = DepositSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    amount = Decimal(str(s.validated_data['amount']))
    if amount < 50:
        return Response({'error': 'Minimum deposit is KES 50.'}, status=400)

    wallet = request.user.wallet
    wallet.balance += amount
    wallet.save()

    tx = Transaction.objects.create(
        wallet=wallet, txn_type='DEPOSIT', amount=amount,
        description=f'Deposit via {s.validated_data.get("method","M-PESA")}',
        balance_after=wallet.balance,
    )
    return Response({
        'message':     f'KES {amount:,.2f} deposited.',
        'reference':   tx.reference,
        'balance':     float(wallet.balance),
        'transaction': TransactionSerializer(tx).data,
    })


# ── WITHDRAW ──────────────────────────────────────────────────────────────────

@api_view(['POST'])
def withdraw(request):
    s = WithdrawSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    amount = Decimal(str(d['amount']))
    wallet = request.user.wallet

    if amount < 50:
        return Response({'error': 'Minimum withdrawal is KES 50.'}, status=400)
    if amount > wallet.balance:
        return Response({'error': 'Insufficient balance.'}, status=400)

    wallet.balance -= amount
    wallet.save()

    tx = Transaction.objects.create(
        wallet=wallet, txn_type='WITHDRAW', amount=amount,
        recipient_no=d['recipient_no'],
        description='Withdrawal to M-PESA', balance_after=wallet.balance,
    )
    return Response({
        'message':     f'KES {amount:,.2f} withdrawn to {d["recipient_no"]}',
        'reference':   tx.reference,
        'balance':     float(wallet.balance),
        'transaction': TransactionSerializer(tx).data,
    })


# ── TRANSACTIONS ──────────────────────────────────────────────────────────────

@api_view(['GET'])
def transactions(request):
    txns = request.user.wallet.transactions.all()[:100]
    return Response(TransactionSerializer(txns, many=True).data)


# ── LOANS ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def loans(request):
    wallet = request.user.wallet

    if request.method == 'GET':
        return Response(LoanSerializer(wallet.loans.all(), many=True).data)

    s = LoanRequestSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    amount = Decimal(str(d['amount']))

    if amount < 500:
        return Response({'error': 'Minimum loan is KES 500.'}, status=400)
    if amount > 100000:
        return Response({'error': 'Maximum loan is KES 100,000.'}, status=400)
    if wallet.loans.filter(status='ACTIVE').exists():
        return Response({'error': 'Repay your active loan before applying for a new one.'}, status=400)

    rate     = Decimal('8.00')
    total    = amount + (amount * rate / 100)
    due_date = timezone.now() + timedelta(days=d['duration_days'])

    loan = Loan.objects.create(
        wallet=wallet, amount=amount, interest_rate=rate,
        total_repayable=total, duration_days=d['duration_days'],
        purpose=d.get('purpose', ''), due_date=due_date,
    )

    wallet.balance += amount
    wallet.save()

    Transaction.objects.create(
        wallet=wallet, txn_type='LOAN_DISBURSE', amount=amount,
        description=f'DigiPay Loan – {loan.reference}', balance_after=wallet.balance,
    )

    return Response({
        'message': f'Loan of KES {amount:,.2f} approved & disbursed!',
        'loan':    LoanSerializer(loan).data,
        'balance': float(wallet.balance),
    }, status=201)


@api_view(['POST'])
def repay_loan(request):
    s = LoanRepaySerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    wallet = request.user.wallet
    amount = Decimal(str(d['amount']))

    try:
        loan = wallet.loans.get(id=d['loan_id'], status='ACTIVE')
    except Loan.DoesNotExist:
        return Response({'error': 'Active loan not found.'}, status=404)

    if amount > wallet.balance:
        return Response({'error': 'Insufficient balance.'}, status=400)

    pay = min(amount, Decimal(str(loan.balance_remaining)))
    wallet.balance  -= pay
    wallet.save()
    loan.amount_paid += pay
    if loan.amount_paid >= loan.total_repayable:
        loan.status = 'REPAID'
    loan.save()

    Transaction.objects.create(
        wallet=wallet, txn_type='LOAN_REPAY', amount=pay,
        description=f'Loan repayment – {loan.reference}', balance_after=wallet.balance,
    )
    return Response({
        'message': f'KES {pay:,.2f} repaid.',
        'loan':    LoanSerializer(loan).data,
        'balance': float(wallet.balance),
    })


# ── SAVINGS ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def savings(request):
    wallet = request.user.wallet

    if request.method == 'GET':
        return Response(SavingsGoalSerializer(wallet.savings.filter(is_active=True), many=True).data)

    s = SavingsCreateSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d    = s.validated_data
    goal = SavingsGoal.objects.create(
        wallet=wallet, name=d['name'], target_amount=d['target_amount'],
        target_date=d.get('target_date'), emoji=d.get('emoji', '🎯'),
    )
    return Response({'message': f'"{goal.name}" goal created!', 'goal': SavingsGoalSerializer(goal).data}, status=201)


@api_view(['POST'])
def savings_deposit(request):
    s = SavingsDepositSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    wallet = request.user.wallet
    amount = Decimal(str(d['amount']))

    try:
        goal = wallet.savings.get(id=d['goal_id'], is_active=True)
    except SavingsGoal.DoesNotExist:
        return Response({'error': 'Savings goal not found.'}, status=404)

    if amount > wallet.balance:
        return Response({'error': 'Insufficient balance.'}, status=400)

    wallet.balance -= amount
    wallet.save()
    goal.current_amount += amount
    goal.save()

    Transaction.objects.create(
        wallet=wallet, txn_type='SAVE_IN', amount=amount,
        description=f'Savings: {goal.name}', balance_after=wallet.balance,
    )
    return Response({
        'message': f'KES {amount:,.2f} saved to "{goal.name}"',
        'goal':    SavingsGoalSerializer(goal).data,
        'balance': float(wallet.balance),
    })


# ── LIPA NA DIGIPAY ───────────────────────────────────────────────────────────

@api_view(['POST'])
def lipa(request):
    s = LipaSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    d      = s.validated_data
    wallet = request.user.wallet
    amount = Decimal(str(d['amount']))

    if amount <= 0:
        return Response({'error': 'Amount must be > 0.'}, status=400)
    if amount > wallet.balance:
        return Response({'error': 'Insufficient balance.'}, status=400)

    wallet.balance -= amount
    wallet.save()

    payment = MerchantPayment.objects.create(
        wallet=wallet, merchant_code=d['merchant_code'],
        merchant_name=d['merchant_name'], amount=amount,
        account_ref=d.get('account_ref', ''),
    )
    Transaction.objects.create(
        wallet=wallet, txn_type='LIPA', amount=amount,
        recipient_no=d['merchant_code'], recipient_name=d['merchant_name'],
        description=f'Lipa Na DigiPay – {d["merchant_name"]}',
        balance_after=wallet.balance,
    )
    return Response({
        'message':   f'KES {amount:,.2f} paid to {d["merchant_name"]}',
        'reference': payment.reference,
        'balance':   float(wallet.balance),
        'payment':   MerchantPaymentSerializer(payment).data,
    })