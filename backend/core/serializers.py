from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Wallet, Transaction, Loan, SavingsGoal, MerchantPayment, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['phone', 'id_number', 'credit_score', 'is_verified']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class WalletSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model  = Wallet
        fields = ['id', 'user', 'account_no', 'balance', 'is_active', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Transaction
        fields = ['id', 'txn_type', 'amount', 'reference', 'recipient_no',
                  'recipient_name', 'description', 'status', 'balance_after', 'created_at']


class LoanSerializer(serializers.ModelSerializer):
    balance_remaining = serializers.ReadOnlyField()
    progress_pct      = serializers.ReadOnlyField()
    class Meta:
        model  = Loan
        fields = ['id', 'amount', 'interest_rate', 'total_repayable', 'amount_paid',
                  'balance_remaining', 'progress_pct', 'duration_days', 'purpose',
                  'reference', 'status', 'due_date', 'created_at']


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_pct = serializers.ReadOnlyField()
    class Meta:
        model  = SavingsGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'interest_rate',
                  'target_date', 'emoji', 'is_active', 'progress_pct', 'created_at']


class MerchantPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MerchantPayment
        fields = ['id', 'merchant_code', 'merchant_name', 'amount', 'account_ref', 'reference', 'created_at']


# ── Input serializers ────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    phone            = serializers.CharField(write_only=True)
    password         = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'first_name', 'last_name', 'email', 'phone', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return data

    def create(self, validated_data):
        phone = validated_data.pop('phone')
        validated_data.pop('confirm_password')
        user  = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, phone=phone)
        return user


class SendMoneySerializer(serializers.Serializer):
    recipient_no  = serializers.CharField()
    amount        = serializers.DecimalField(max_digits=14, decimal_places=2)
    description   = serializers.CharField(required=False, allow_blank=True, default='')


class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    method = serializers.CharField(default='M-PESA')


class WithdrawSerializer(serializers.Serializer):
    recipient_no = serializers.CharField()
    amount       = serializers.DecimalField(max_digits=14, decimal_places=2)


class LoanRequestSerializer(serializers.Serializer):
    amount       = serializers.DecimalField(max_digits=14, decimal_places=2)
    duration_days= serializers.IntegerField(default=30, min_value=7, max_value=90)
    purpose      = serializers.CharField(required=False, allow_blank=True, default='')


class LoanRepaySerializer(serializers.Serializer):
    loan_id = serializers.IntegerField()
    amount  = serializers.DecimalField(max_digits=14, decimal_places=2)


class SavingsCreateSerializer(serializers.Serializer):
    name          = serializers.CharField()
    target_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    target_date   = serializers.DateField(required=False)
    emoji         = serializers.CharField(required=False, default='🎯')


class SavingsDepositSerializer(serializers.Serializer):
    goal_id = serializers.IntegerField()
    amount  = serializers.DecimalField(max_digits=14, decimal_places=2)


class LipaSerializer(serializers.Serializer):
    merchant_code = serializers.CharField()
    merchant_name = serializers.CharField()
    amount        = serializers.DecimalField(max_digits=14, decimal_places=2)
    account_ref   = serializers.CharField(required=False, allow_blank=True, default='')