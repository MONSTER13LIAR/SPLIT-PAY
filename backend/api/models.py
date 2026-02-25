from django.db import models
from django.contrib.auth.models import User

class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    members = models.ManyToManyField(User, related_name='expense_groups', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups', null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='invitations')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invited_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'invited_user')

    def __str__(self):
        return f"{self.invited_by.username} invited {self.invited_user.username} to {self.group.name}"

class Expense(models.Model):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses_paid')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_splits')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} owes {self.amount} for {self.expense.description}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    bio = models.TextField(max_length=500, null=True, blank=True)
    has_set_username = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
