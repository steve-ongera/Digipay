"""
DigiPay – seed_data management command
Generates ~1 year of realistic Kenyan mobile-banking data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --users 10 --clear
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import (
    UserProfile, Wallet, Transaction, Loan, SavingsGoal, MerchantPayment
)
import random
import decimal
from datetime import timedelta, date


# ── Kenyan names pool ────────────────────────────────────────────────────────

FIRST_NAMES = [
    "Amina", "Brian", "Cynthia", "David", "Esther", "Faith", "George",
    "Hannah", "Isaac", "Joyce", "Kevin", "Lydia", "Moses", "Nancy",
    "Oliver", "Patricia", "Quincy", "Rachel", "Samuel", "Tabitha",
    "Ursula", "Victor", "Wanjiru", "Xavier", "Yvonne", "Zachary",
    "Achieng", "Baraka", "Chebet", "Dennis", "Eunice", "Felix",
    "Grace", "Hassan", "Irene", "John", "Kendi", "Lilian", "Michael",
    "Njeri", "Obed", "Priscilla", "Rono", "Sharon", "Timothy",
    "Uchenna", "Violet", "Wekesa", "Xolani", "Yasmin", "Zawadi",
]

LAST_NAMES = [
    "Kamau", "Odhiambo", "Wanjiku", "Mwangi", "Otieno", "Kariuki",
    "Mutua", "Achieng", "Njoroge", "Kipchoge", "Rotich", "Cheruiyot",
    "Nderitu", "Omondi", "Kimani", "Waweru", "Mugo", "Adhiambo",
    "Kiplangat", "Ogola", "Gitonga", "Simiyu", "Waithaka", "Juma",
    "Mbugua", "Owino", "Gathoni", "Ruto", "Korir", "Ndegwa",
    "Musyoka", "Auma", "Kinyua", "Odongo", "Gicheru", "Bett",
    "Wangari", "Okello", "Mukami", "Siele",
]

PHONE_PREFIXES = ["0700", "0701", "0702", "0710", "0711", "0712",
                  "0720", "0721", "0722", "0723", "0740", "0741",
                  "0745", "0750", "0757", "0769", "0790", "0791"]

TOWNS = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
    "Thika", "Malindi", "Kitale", "Garissa", "Nyeri",
]

LOAN_PURPOSES = [
    "Business stock purchase", "School fees payment", "Medical expenses",
    "Home renovation", "Agricultural inputs", "Rent arrears",
    "Asset purchase – motorcycle", "Working capital", "Emergency funds",
    "Wedding expenses", "Funeral costs", "Buy airtime & data bundles",
    "Utility bills settlement", "Salary advance top-up",
    "Import goods from China", "Transport business fuel",
]

SAVINGS_GOALS = [
    ("Emergency Fund",   "🚨", 50_000),
    ("New Smartphone",   "📱", 35_000),
    ("Holiday – Malindi","🏖️", 25_000),
    ("School Fees",      "🎓", 80_000),
    ("New Laptop",       "💻", 60_000),
    ("Wedding Fund",     "💍", 200_000),
    ("Land Purchase",    "🏡", 500_000),
    ("Car Savings",      "🚗", 300_000),
    ("Business Capital", "💼", 100_000),
    ("Baby Shopping",    "🍼", 30_000),
    ("Travel Fund",      "✈️", 45_000),
    ("Electronics",      "🎮", 20_000),
]

MERCHANTS = [
    ("174379", "Safaricom Shop"),
    ("247247", "Kenya Power"),
    ("891300", "Nairobi Water"),
    ("400222", "DStv Kenya"),
    ("514100", "Java House"),
    ("603130", "Uber Kenya"),
    ("729929", "Jumia Kenya"),
    ("338338", "Equity Bank"),
    ("111000", "KRA iTax"),
    ("522900", "Airtel Money"),
    ("333555", "KPLC Prepaid"),
    ("200555", "Multichoice"),
    ("700200", "Quickmart"),
    ("888100", "Naivas Supermarket"),
    ("101010", "Bolt Kenya"),
    ("654321", "Pizza Inn"),
    ("963852", "Carrefour Kenya"),
    ("741852", "Zuku Fibre"),
]

SEND_DESCRIPTIONS = [
    "Rent payment", "Lunch contribution", "Chama deposit",
    "Bus fare refund", "Groceries contribution", "Borrowed money back",
    "SACCO monthly", "Church offering", "Family support",
    "Matatu fare", "Doctor consultation", "Fuel contribution",
    "Game night contribution", "Project funds", "Birthday gift",
    "School trip money", "Water bill share", "Netflix share",
    "House shopping", "Baby shower contribution",
]

DEPOSIT_METHODS = ["M-PESA", "M-PESA", "M-PESA", "BANK", "AGENT"]


# ── Helper functions ──────────────────────────────────────────────────────────

def rand_phone():
    return random.choice(PHONE_PREFIXES) + "".join(str(random.randint(0, 9)) for _ in range(6))


def rand_amount(lo, hi, step=50):
    steps = int((hi - lo) / step)
    return decimal.Decimal(lo + random.randint(0, steps) * step)


def rand_date_in_year():
    """Random datetime within the past 365 days, up to yesterday."""
    now = timezone.now()
    days_ago = random.randint(1, 365)
    hour = random.randint(6, 22)
    minute = random.randint(0, 59)
    return now - timedelta(days=days_ago, hours=(23 - hour), minutes=minute)


def weighted_date():
    """Skew towards more recent dates (last 3 months heavier)."""
    now = timezone.now()
    r = random.random()
    if r < 0.50:      # 50 % – last 90 days
        days = random.randint(1, 90)
    elif r < 0.80:    # 30 % – 91–180 days
        days = random.randint(91, 180)
    else:             # 20 % – 181–365 days
        days = random.randint(181, 365)
    hour   = random.randint(6, 22)
    minute = random.randint(0, 59)
    return now - timedelta(days=days, hours=(23 - hour), minutes=minute)


def force_date(obj, dt):
    """Bypass auto_now_add by updating via queryset."""
    type(obj).objects.filter(pk=obj.pk).update(created_at=dt)


# ── Main command ──────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed DigiPay with ~1 year of realistic Kenyan banking data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--users", type=int, default=8,
            help="Number of additional demo users to create (default: 8)"
        )
        parser.add_argument(
            "--clear", action="store_true",
            help="Delete all existing seed data before seeding"
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  💚 DigiPay – Data Seeder  \n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ))

        if options["clear"]:
            self._clear()

        users = self._create_users(options["users"])
        self._seed_all(users)

        self.stdout.write(self.style.SUCCESS(
            "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "  ✅ Seeding complete!\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        ))

    # ── Clear ────────────────────────────────────────────────────────────────

    def _clear(self):
        self.stdout.write("🗑️  Clearing previous seed data…")
        MerchantPayment.objects.all().delete()
        Transaction.objects.all().delete()
        Loan.objects.all().delete()
        SavingsGoal.objects.all().delete()
        # keep superusers
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING("   Done – non-superuser data removed.\n"))

    # ── Create users ─────────────────────────────────────────────────────────

    def _create_users(self, count):
        self.stdout.write(f"👥 Creating {count} demo users…")
        users = []

        # Ensure admin exists
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults=dict(
                email="admin@digipay.ke",
                first_name="Admin",
                last_name="DigiPay",
                is_superuser=True,
                is_staff=True,
            ),
        )
        if created:
            admin.set_password("admin123")
            admin.save()
        if not hasattr(admin, "profile"):
            UserProfile.objects.get_or_create(
                user=admin,
                defaults={"phone": "0700000000", "credit_score": 750, "is_verified": True},
            )
        admin.wallet.balance = decimal.Decimal("10000.00")
        admin.wallet.save()
        users.append(admin)

        # Named demo accounts
        demo_accounts = [
            ("wanjiru",  "Wanjiru",  "Kamau",      "0712345678", 680),
            ("brian",    "Brian",    "Odhiambo",   "0722987654", 620),
            ("esther",   "Esther",   "Mwangi",     "0701456789", 700),
            ("kipchoge", "Kipchoge", "Rotich",      "0740123456", 590),
        ]
        for uname, fn, ln, phone, score in demo_accounts:
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults=dict(first_name=fn, last_name=ln, email=f"{uname}@digipay.ke"),
            )
            u.set_password("demo1234")
            u.save()
            UserProfile.objects.get_or_create(
                user=u,
                defaults={
                    "phone": phone,
                    "credit_score": score,
                    "is_verified": random.choice([True, True, False]),
                },
            )
            u.wallet.balance = rand_amount(500, 45_000, 500)
            u.wallet.save()
            users.append(u)

        # Random users
        used_phones = set(UserProfile.objects.values_list("phone", flat=True))
        for i in range(count):
            fn  = random.choice(FIRST_NAMES)
            ln  = random.choice(LAST_NAMES)
            uname = f"{fn.lower()}{ln.lower()}{random.randint(10,99)}"
            if User.objects.filter(username=uname).exists():
                continue
            phone = rand_phone()
            while phone in used_phones:
                phone = rand_phone()
            used_phones.add(phone)

            u = User.objects.create_user(
                username=uname,
                password="demo1234",
                first_name=fn,
                last_name=ln,
                email=f"{uname}@digipay.ke",
            )
            UserProfile.objects.create(
                user=u,
                phone=phone,
                credit_score=random.randint(300, 800),
                is_verified=random.choice([True, True, False]),
            )
            u.wallet.balance = rand_amount(0, 60_000, 500)
            u.wallet.save()
            users.append(u)

        self.stdout.write(self.style.SUCCESS(f"   ✔ {len(users)} users ready"))
        return users

    # ── Seed everything for all users ────────────────────────────────────────

    def _seed_all(self, users):
        for user in users:
            name = f"{user.first_name} {user.last_name}".strip() or user.username
            self.stdout.write(f"\n📊 Seeding: {name}")
            wallet = user.wallet

            self._seed_deposits(wallet, users)
            self._seed_sends(wallet, users)
            self._seed_withdrawals(wallet)
            self._seed_lipa(wallet)
            self._seed_loans(wallet)
            self._seed_savings(wallet)

            # Recompute balance from transactions so it's internally consistent
            self._recalculate_balance(wallet)

        self.stdout.write("")

    # ── Deposits ──────────────────────────────────────────────────────────────

    def _seed_deposits(self, wallet, users):
        # 8 – 24 deposits over the year
        n = random.randint(8, 24)
        self.stdout.write(f"   💰 {n} deposits", ending="")
        for _ in range(n):
            amount = rand_amount(500, 20_000, 500)
            dt     = weighted_date()
            method = random.choice(DEPOSIT_METHODS)
            tx = Transaction.objects.create(
                wallet=wallet,
                txn_type="DEPOSIT",
                amount=amount,
                description=f"Deposit via {method}",
                status="SUCCESS",
                balance_after=0,  # recalculated later
            )
            force_date(tx, dt)
        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Sends ─────────────────────────────────────────────────────────────────

    def _seed_sends(self, wallet, users):
        other_wallets = [u.wallet for u in users if u.wallet.pk != wallet.pk]
        n = random.randint(10, 35)
        self.stdout.write(f"   📤 {n} sends/receives", ending="")

        for _ in range(n):
            amount = rand_amount(50, 5_000, 50)
            dt     = weighted_date()
            desc   = random.choice(SEND_DESCRIPTIONS)

            # Outgoing
            if other_wallets:
                recv_wallet = random.choice(other_wallets)
                recv_name   = recv_wallet.user.get_full_name() or recv_wallet.user.username
                tx_out = Transaction.objects.create(
                    wallet=wallet,
                    txn_type="SEND",
                    amount=amount,
                    recipient_no=recv_wallet.account_no,
                    recipient_name=recv_name,
                    description=desc,
                    status="SUCCESS",
                    balance_after=0,
                )
                force_date(tx_out, dt)

                # Matching receive on recipient
                tx_in = Transaction.objects.create(
                    wallet=recv_wallet,
                    txn_type="RECEIVE",
                    amount=amount,
                    recipient_no=wallet.account_no,
                    recipient_name=wallet.user.get_full_name() or wallet.user.username,
                    description=f"From {wallet.user.get_full_name() or wallet.user.username}",
                    status="SUCCESS",
                    balance_after=0,
                )
                force_date(tx_in, dt + timedelta(seconds=random.randint(1, 10)))
            else:
                # External send (no matching wallet)
                phone = rand_phone()
                tx_out = Transaction.objects.create(
                    wallet=wallet,
                    txn_type="SEND",
                    amount=amount,
                    recipient_no=phone,
                    recipient_name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    description=desc,
                    status="SUCCESS",
                    balance_after=0,
                )
                force_date(tx_out, dt)

        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Withdrawals ───────────────────────────────────────────────────────────

    def _seed_withdrawals(self, wallet):
        n = random.randint(4, 14)
        self.stdout.write(f"   🏧 {n} withdrawals", ending="")
        for _ in range(n):
            amount = rand_amount(200, 10_000, 200)
            dt     = weighted_date()
            tx = Transaction.objects.create(
                wallet=wallet,
                txn_type="WITHDRAW",
                amount=amount,
                recipient_no=rand_phone(),
                description="Withdrawal to M-PESA",
                status="SUCCESS",
                balance_after=0,
            )
            force_date(tx, dt)
        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Lipa Na DigiPay ───────────────────────────────────────────────────────

    def _seed_lipa(self, wallet):
        n = random.randint(6, 22)
        self.stdout.write(f"   🛍️  {n} lipa payments", ending="")
        for _ in range(n):
            merchant = random.choice(MERCHANTS)
            code, name = merchant
            amount = rand_amount(50, 5_000, 50)
            dt     = weighted_date()

            payment = MerchantPayment.objects.create(
                wallet=wallet,
                merchant_code=code,
                merchant_name=name,
                amount=amount,
                account_ref=f"ACC{random.randint(10000, 99999)}",
            )
            force_date(payment, dt)

            tx = Transaction.objects.create(
                wallet=wallet,
                txn_type="LIPA",
                amount=amount,
                recipient_no=code,
                recipient_name=name,
                description=f"Lipa Na DigiPay – {name}",
                status="SUCCESS",
                balance_after=0,
            )
            force_date(tx, dt)

        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Loans ─────────────────────────────────────────────────────────────────

    def _seed_loans(self, wallet):
        # 0 – 4 loans over the year
        n = random.randint(0, 4)
        if n == 0:
            self.stdout.write(f"   🏦 0 loans")
            return
        self.stdout.write(f"   🏦 {n} loans", ending="")

        for i in range(n):
            amount   = rand_amount(500, 50_000, 500)
            rate     = decimal.Decimal("8.00")
            total    = amount + (amount * rate / 100)
            duration = random.choice([7, 14, 21, 30, 60, 90])
            purpose  = random.choice(LOAN_PURPOSES)

            # Spread loans across the year; ensure earlier loans are repaid
            created_dt = weighted_date()
            due_dt     = created_dt + timedelta(days=duration)
            now        = timezone.now()

            # Last loan may still be active
            is_last    = (i == n - 1)
            is_overdue = due_dt < now
            if is_last and random.random() < 0.35:
                loan_status = "ACTIVE"
                amount_paid = decimal.Decimal("0.00")
            elif is_overdue:
                loan_status = random.choice(["REPAID", "REPAID", "ACTIVE"])
                amount_paid = total if loan_status == "REPAID" else rand_amount(0, float(total), 100)
            else:
                loan_status = "ACTIVE"
                amount_paid = rand_amount(0, float(total) * 0.6, 100)

            loan = Loan(
                wallet=wallet,
                amount=amount,
                interest_rate=rate,
                total_repayable=total,
                amount_paid=amount_paid,
                duration_days=duration,
                purpose=purpose,
                status=loan_status,
                due_date=due_dt,
            )
            loan.save()
            Loan.objects.filter(pk=loan.pk).update(created_at=created_dt)

            # Disbursement transaction
            tx_d = Transaction.objects.create(
                wallet=wallet,
                txn_type="LOAN_DISBURSE",
                amount=amount,
                description=f"DigiPay Loan – {loan.reference}",
                status="SUCCESS",
                balance_after=0,
            )
            force_date(tx_d, created_dt + timedelta(seconds=5))

            # Repayment transactions
            if amount_paid > 0:
                remaining   = float(amount_paid)
                repay_start = created_dt + timedelta(days=random.randint(3, max(4, duration // 3)))
                repay_count = random.randint(1, 4)
                chunk       = remaining / repay_count
                for j in range(repay_count):
                    pay_amt  = decimal.Decimal(str(round(chunk, 2)))
                    repay_dt = repay_start + timedelta(days=j * random.randint(3, 12))
                    if repay_dt > now:
                        repay_dt = now - timedelta(hours=random.randint(1, 24))
                    tx_r = Transaction.objects.create(
                        wallet=wallet,
                        txn_type="LOAN_REPAY",
                        amount=pay_amt,
                        description=f"Loan repayment – {loan.reference}",
                        status="SUCCESS",
                        balance_after=0,
                    )
                    force_date(tx_r, repay_dt)

        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Savings Goals ─────────────────────────────────────────────────────────

    def _seed_savings(self, wallet):
        n = random.randint(1, 4)
        pool = random.sample(SAVINGS_GOALS, min(n, len(SAVINGS_GOALS)))
        self.stdout.write(f"   🐷 {len(pool)} savings goals", ending="")

        for name, emoji, target_max in pool:
            target   = rand_amount(target_max * 0.2, target_max, 1000)
            saved    = rand_amount(0, float(target) * random.uniform(0.1, 0.95), 500)
            created  = weighted_date()
            td_days  = random.randint(30, 300)
            tdate    = (timezone.now() + timedelta(days=td_days)).date()

            goal = SavingsGoal(
                wallet=wallet,
                name=name,
                emoji=emoji,
                target_amount=target,
                current_amount=saved,
                interest_rate=decimal.Decimal("5.00"),
                target_date=tdate,
                is_active=True,
            )
            goal.save()
            SavingsGoal.objects.filter(pk=goal.pk).update(created_at=created)

            # Individual deposit transactions that add up to `saved`
            if saved > 0:
                deposit_count = random.randint(2, 8)
                remaining     = float(saved)
                dep_start     = created + timedelta(days=1)

                for k in range(deposit_count):
                    is_last_dep = (k == deposit_count - 1)
                    chunk       = remaining if is_last_dep else random.uniform(0.1, 0.5) * remaining
                    chunk       = max(50, round(chunk / 50) * 50)  # round to nearest 50
                    remaining  -= chunk
                    if remaining < 0:
                        chunk += remaining
                        remaining = 0
                    if chunk <= 0:
                        break

                    dep_dt = dep_start + timedelta(days=k * random.randint(5, 30))
                    if dep_dt > timezone.now():
                        dep_dt = timezone.now() - timedelta(hours=random.randint(1, 48))

                    tx = Transaction.objects.create(
                        wallet=wallet,
                        txn_type="SAVE_IN",
                        amount=decimal.Decimal(str(chunk)),
                        description=f"Savings: {name}",
                        status="SUCCESS",
                        balance_after=0,
                    )
                    force_date(tx, dep_dt)

                    if remaining <= 0:
                        break

        self.stdout.write(self.style.SUCCESS(" ✔"))

    # ── Recalculate balance ───────────────────────────────────────────────────

    def _recalculate_balance(self, wallet):
        """
        Walk all transactions chronologically, compute running balance,
        update balance_after on each, and set wallet.balance to final value.
        Clamps to 0 if it would go negative (data realism over strict accuracy).
        """
        CREDIT = {"RECEIVE", "DEPOSIT", "LOAN_DISBURSE"}
        DEBIT  = {"SEND", "WITHDRAW", "LIPA", "LOAN_REPAY", "SAVE_IN"}

        txns = list(
            wallet.transactions.order_by("created_at").values("id", "txn_type", "amount")
        )
        running = decimal.Decimal("0.00")

        for t in txns:
            amt = decimal.Decimal(str(t["amount"]))
            if t["txn_type"] in CREDIT:
                running += amt
            elif t["txn_type"] in DEBIT:
                running = max(decimal.Decimal("0.00"), running - amt)

            Transaction.objects.filter(pk=t["id"]).update(
                balance_after=running
            )

        # Set wallet balance to running total + a small realistic buffer
        final = running + rand_amount(0, 2_000, 100)
        wallet.balance = final
        wallet.save()