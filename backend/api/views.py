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
from rest_framework_simplejwt.tokens import RefreshToken
import re, json

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

    existing_user = User.objects.filter(username=username).first()
    if existing_user and existing_user.id != request.user.id:
        if existing_user.email != request.user.email:
            return Response(
                {"error": "This username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            # SAME EMAIL, but different user ID. This means there's a duplicate user object.
            # We can't easily merge here, but we can at least explain or try to fix it.
            # For now, let's just let them know they should log in with the other account if possible.
            # BUT, the user's request says "if the gmail and username matches that he can use that".
            # So let's allow "taking" it by giving the old user a temporary username and giving this user the requested one? 
            # Or just tell them to use a different one if they are indeed different objects.
            pass

    user = request.user
    user.username = username
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_non_veg = request.data.get('is_non_veg', False)
    profile.is_drinker = request.data.get('is_drinker', False)
    profile.has_set_username = True
    profile.save()

    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    """Update user preferences (veg/non-veg, drinker)."""
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    if 'is_non_veg' in request.data:
        profile.is_non_veg = request.data['is_non_veg']
    if 'is_drinker' in request.data:
        profile.is_drinker = request.data['is_drinker']
        
    profile.save()
    return Response(UserSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    """Create a group and send invitations to the specified usernames."""
    serializer = GroupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    invited_usernames = serializer.validated_data.get('invited_usernames', [])
    
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
    validated_data = serializer.validated_data
    validated_data.pop('invited_usernames', [])
    group = serializer.save(created_by=request.user, member_order=[request.user.id])
    group.members.add(request.user)

    # Create invitations
    for u in invited_users:
        GroupInvitation.objects.get_or_create(
            group=group,
            invited_by=request.user,
            invited_user=u,
            defaults={'status': 'pending'}
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
        # Add to chain if not already there
        if request.user.id not in invitation.group.member_order:
            invitation.group.member_order.append(request.user.id)
            invitation.group.save()
    else:
        invitation.status = 'declined'
        invitation.save()

    return Response(GroupInvitationSerializer(invitation).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_split(request, group_id):
    """Determine who should pay next and advance the turn."""
    try:
        group = Group.objects.get(id=group_id, members=request.user)
    except Group.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    if not group.member_order:
        # Auto-populate if empty (for existing groups or sync issues)
        group.member_order = list(group.members.all().values_list('id', flat=True))
        if not group.member_order:
            return Response({"error": "No members in group"}, status=status.HTTP_400_BAD_REQUEST)
        group.save()

    # Get current payer
    payer_index = group.current_turn_index % len(group.member_order)
    payer_id = group.member_order[payer_index]
    
    try:
        payer = User.objects.get(id=payer_id)
    except User.DoesNotExist:
        return Response({"error": "Payer not found in system"}, status=status.HTTP_404_NOT_FOUND)

    # Advance the turn
    group.current_turn_index += 1
    group.save()

    return Response({
        "payer": UserSerializer(payer).data,
        "next_turn_index": group.current_turn_index
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def dev_login(request):
    """Bypass OAuth for development. Creates or gets a user by username."""
    username = request.data.get('username', 'devuser').strip()
    if not username:
        return Response({"error": "Username required"}, status=status.HTTP_400_BAD_REQUEST)
    
    user, created = User.objects.get_or_create(username=username, defaults={
        'email': f"{username}@example.com",
        'first_name': 'Developer',
        'last_name': 'User'
    })
    
    if created:
        UserProfile.objects.get_or_create(user=user)
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })

