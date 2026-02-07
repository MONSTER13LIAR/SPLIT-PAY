from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import Group, Expense, ExpenseSplit, UserProfile
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer
import re

def is_strong_password(password):
    if len(password) < 8: return False
    if not re.search("[a-z]", password): return False
    if not re.search("[A-Z]", password): return False
    if not re.search("[0-9]", password): return False
    if not re.search("[_@$!%*#?&]", password): return False
    return True

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    phone_number = request.data.get('phone_number')
    password = request.data.get('password')
    
    if not username or len(username) < 3:
        return Response({"error": "Username must be at least 3 characters"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not is_strong_password(password):
        return Response({"error": "Password is too weak. Must be 8+ chars and include upper, lower, digit, and special char."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password)
    UserProfile.objects.create(user=user, phone_number=phone_number)
    
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return groups the user is a member of
        return self.request.user.expense_groups.all()

    def perform_create(self, serializer):
        # Automatically add the creator as a member
        group = serializer.save()
        group.members.add(self.request.user)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return expenses in groups the user belongs to
        user_groups = self.request.user.expense_groups.all()
        return Expense.objects.filter(group__in=user_groups)
