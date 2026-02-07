from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, Expense, ExpenseSplit

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number']

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=User.objects.all(), source='members'
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'members', 'member_ids', 'created_at']

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user'
    )

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'user_id', 'amount']

class ExpenseSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='payer'
    )
    splits = ExpenseSplitSerializer(many=True)

    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'payer', 'payer_id', 'group', 'splits', 'created_at']

    def create(self, validated_data):
        splits_data = validated_data.pop('splits')
        expense = Expense.objects.create(**validated_data)
        for split_data in splits_data:
            ExpenseSplit.objects.create(expense=expense, **split_data)
        return expense
