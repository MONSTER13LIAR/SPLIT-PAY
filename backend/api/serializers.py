from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, Expense, ExpenseSplit, GroupInvitation, Settlement

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True)
    has_set_username = serializers.BooleanField(source='profile.has_set_username', read_only=True)
    is_non_veg = serializers.BooleanField(source='profile.is_non_veg', read_only=True)
    is_drinker = serializers.BooleanField(source='profile.is_drinker', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'has_set_username', 'is_non_veg', 'is_drinker']


class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    invited_usernames = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, default=[]
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'members', 'created_by', 'invited_usernames', 'member_order', 'current_turn_index', 'created_at']
        read_only_fields = ['created_at', 'member_order', 'current_turn_index']

    def create(self, validated_data):
        # Remove invited_usernames before calling the model's create
        validated_data.pop('invited_usernames', [])
        return super().create(validated_data)

    def to_representation(self, instance):
        """Ensure member_order is populated if empty but members exist."""
        if not instance.member_order and instance.members.exists():
            instance.member_order = list(instance.members.all().values_list('id', flat=True))
            instance.save()
        return super().to_representation(instance)


class GroupInvitationSerializer(serializers.ModelSerializer):
    group = GroupSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    invited_user = UserSerializer(read_only=True)

    class Meta:
        model = GroupInvitation
        fields = ['id', 'group', 'invited_by', 'invited_user', 'status', 'created_at']
        read_only_fields = ['created_at']


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
        queryset=User.objects.all(), source='payer', required=False
    )
    splits = ExpenseSplitSerializer(many=True, required=False)

    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'non_veg_amount', 'alcohol_amount', 'payer', 'payer_id', 'group', 'splits', 'created_at']

    def create(self, validated_data):
        splits_data = validated_data.pop('splits', [])
        expense = Expense.objects.create(**validated_data)
        for split_data in splits_data:
            ExpenseSplit.objects.create(expense=expense, **split_data)
        return expense

class SettlementSerializer(serializers.ModelSerializer):
    debtor = UserSerializer(read_only=True)
    creditor = UserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'debtor', 'creditor', 'amount', 'group_name']
