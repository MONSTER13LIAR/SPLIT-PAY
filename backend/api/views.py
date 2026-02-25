from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import Group, Expense, ExpenseSplit, UserProfile, GroupInvitation
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, GroupInvitationSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
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


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000/auth/callback"
    client_class = OAuth2Client

    def get_response(self):
        # Additional logic to ensure user profile exists after social login
        response = super().get_response()
        user = self.user
        if not hasattr(user, 'profile'):
            UserProfile.objects.get_or_create(user=user)
        # Include user details in the response
        user_data = UserSerializer(user).data
        response.data['user'] = user_data
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_username(request):
    """Allow an authenticated user to set their username (once)."""
    username = request.data.get('username', '').strip()

    if not username or len(username) < 3:
        return Response(
            {"error": "Username must be at least 3 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(username) > 30:
        return Response(
            {"error": "Username must be 30 characters or fewer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Only allow alphanumeric, underscores, and hyphens
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return Response(
            {"error": "Username can only contain letters, numbers, underscores, and hyphens."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "This username is already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    user.username = username
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.has_set_username = True
    profile.save()

    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    """Create a group and send invitations to the specified usernames."""
    name = request.data.get('name', '').strip()
    description = request.data.get('description', '').strip()
    invited_usernames = request.data.get('invited_usernames', [])

    if not name:
        return Response({"error": "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Validate all usernames exist before creating
    invited_users = []
    errors = []
    for uname in invited_usernames:
        uname = uname.strip()
        if uname == request.user.username:
            continue  # Skip self
        try:
            u = User.objects.get(username=uname)
            invited_users.append(u)
        except User.DoesNotExist:
            errors.append(f"User '{uname}' does not exist.")

    if errors:
        return Response({"error": errors[0]}, status=status.HTTP_400_BAD_REQUEST)

    # Create the group
    group = Group.objects.create(name=name, description=description, created_by=request.user)
    group.members.add(request.user)

    # Create invitations
    for u in invited_users:
        GroupInvitation.objects.create(
            group=group,
            invited_by=request.user,
            invited_user=u,
            status='pending',
        )

    return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_invitations(request):
    """List pending invitations for the current user."""
    invitations = GroupInvitation.objects.filter(
        invited_user=request.user,
        status='pending',
    ).order_by('-created_at')
    serializer = GroupInvitationSerializer(invitations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_invitation(request, invitation_id):
    """Accept or decline a group invitation."""
    action = request.data.get('action', '').strip().lower()

    if action not in ('accept', 'decline'):
        return Response(
            {"error": "Action must be 'accept' or 'decline'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        invitation = GroupInvitation.objects.get(id=invitation_id, invited_user=request.user)
    except GroupInvitation.DoesNotExist:
        return Response({"error": "Invitation not found."}, status=status.HTTP_404_NOT_FOUND)

    if invitation.status != 'pending':
        return Response(
            {"error": f"Invitation has already been {invitation.status}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if action == 'accept':
        invitation.status = 'accepted'
        invitation.save()
        invitation.group.members.add(request.user)
    else:
        invitation.status = 'declined'
        invitation.save()

    return Response(GroupInvitationSerializer(invitation).data)
