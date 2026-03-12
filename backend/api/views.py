from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from decimal import Decimal
from .models import Group, Expense, ExpenseSplit, UserProfile, GroupInvitation, Settlement, SettlementRequest, Vote
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, GroupInvitationSerializer, SettlementSerializer, SettlementRequestSerializer, VoteSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework_simplejwt.tokens import RefreshToken
import re, json, os

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
    callback_url = os.environ.get('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/callback')
    client_class = OAuth2Client
    permission_classes = [AllowAny]
    
    def login(self):
        # Call the parent login() to authenticate the user
        super().login()
        # Ensure UserProfile exists for this user immediately after they are logged in
        if not hasattr(self.user, 'profile'):
            from .models import UserProfile
            UserProfile.objects.get_or_create(user=self.user)

    def get_response(self):
        # Now it's safe to call super().get_response() because the profile exists
        response = super().get_response()
        user = self.user
        # Ensure user data is in the response with our custom serializer fields
        from .serializers import UserSerializer
        response.data['user'] = UserSerializer(user).data
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_username(request):
    """Allow an authenticated user to set their username (once)."""
    username = request.data.get('username', '').strip()
    print(f"DEBUG: set_username called for user {request.user.id} ({request.user.email}) with username: {username}")

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

    user = request.user
    existing_user = User.objects.filter(username=username).first()
    
    if existing_user and existing_user.id != user.id:
        print(f"DEBUG: Username '{username}' already taken by user {existing_user.id} ({existing_user.email})")
        
        # If the current user doesn't have an email set on the User model, 
        # try to get it from their SocialAccount
        user_email = user.email
        if not user_email:
            from allauth.socialaccount.models import SocialAccount
            social_acc = SocialAccount.objects.filter(user=user).first()
            if social_acc:
                user_email = social_acc.extra_data.get('email')
                if user_email:
                    user.email = user_email
                    user.save()
                    print(f"DEBUG: Updated user {user.id} email from SocialAccount: {user_email}")

        if existing_user.email != user_email:
            return Response(
                {"error": "This username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            # SAME EMAIL, different ID. The user is trying to reclaim their username.
            # We rename the old user to free up the username.
            print(f"DEBUG: Same email detected. Renaming old user {existing_user.id}")
            import uuid
            existing_user.username = f"old_{existing_user.username}_{uuid.uuid4().hex[:8]}"
            existing_user.save()

    try:
        user.username = username
        user.save()
        print(f"DEBUG: User {user.id} updated with username: {user.username}")

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.is_non_veg = request.data.get('is_non_veg', False)
        profile.is_drinker = request.data.get('is_drinker', False)
        profile.has_set_username = True
        profile.save()
        print(f"DEBUG: UserProfile for {user.id} {'created' if created else 'updated'}")

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"DEBUG: set_username EXCEPTION for user {user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Internal error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    print(f"DEBUG: create_group called by {request.user.username}")
    print(f"DEBUG: Request data: {request.data}")
    
    serializer = GroupSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"DEBUG: Serializer invalid: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    invited_usernames = request.data.get('invited_usernames', [])
    print(f"DEBUG: Invited usernames: {invited_usernames}")
    
    # Validate all usernames exist before creating
    invited_users = []
    errors = []
    for uname in invited_usernames:
        uname = uname.strip()
        if not uname: continue
        if uname.lower() == request.user.username.lower():
            continue  # Skip self
        try:
            # Case-insensitive search for user
            u = User.objects.get(username__iexact=uname)
            invited_users.append(u)
        except User.DoesNotExist:
            print(f"DEBUG: User '{uname}' not found")
            errors.append(f"User '{uname}' does not exist.")

    if errors:
        print(f"DEBUG: Validation errors: {errors}")
        return Response({"error": errors[0]}, status=status.HTTP_400_BAD_REQUEST)

    # Create the group
    try:
        group = serializer.save(created_by=request.user, member_order=[request.user.id])
        group.members.add(request.user)
        print(f"DEBUG: Group created: {group.name} (ID: {group.id})")
    except Exception as e:
        print(f"DEBUG: Failed to save group: {str(e)}")
        return Response({"error": f"Failed to save group: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Create invitations
    inv_count = 0
    for u in invited_users:
        inv, created = GroupInvitation.objects.get_or_create(
            group=group,
            invited_by=request.user,
            invited_user=u,
            defaults={'status': 'pending'}
        )
        if created:
            inv_count += 1
            print(f"DEBUG: Invitation created for {u.username}")
        else:
            print(f"DEBUG: Invitation already existed for {u.username}")

    print(f"DEBUG: Total invitations created: {inv_count}")
    return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_member(request, group_id):
    """Invite a member to an existing group."""
    username = request.data.get('username', '').strip()
    if not username:
        return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        group = Group.objects.get(id=group_id, members=request.user)
        user_to_invite = User.objects.get(username__iexact=username)
    except Group.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({"error": f"User '{username}' not found."}, status=status.HTTP_404_NOT_FOUND)

    if user_to_invite in group.members.all():
        return Response({"error": "User is already a member."}, status=status.HTTP_400_BAD_REQUEST)

    GroupInvitation.objects.get_or_create(
        group=group,
        invited_by=request.user,
        invited_user=user_to_invite,
        defaults={'status': 'pending'}
    )
    
    return Response({"message": f"Invitation sent to @{user_to_invite.username}"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exit_group(request, group_id):
    """Allow a user to leave a group if they have no debts."""
    try:
        group = Group.objects.get(id=group_id, members=request.user)
    except Group.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user has any outstanding settlements (owing or owed) in this group
    has_settlements = Settlement.objects.filter(
        models.Q(debtor=request.user) | models.Q(creditor=request.user),
        group=group,
        amount__gt=0
    ).exists()

    if has_settlements:
        return Response({"error": "You cannot leave the group until all your debts and credits are settled."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        group.members.remove(request.user)
        # Update member_order
        if request.user.id in group.member_order:
            new_order = [uid for uid in group.member_order if uid != request.user.id]
            group.member_order = new_order
            if len(new_order) > 0:
                group.current_turn_index = group.current_turn_index % len(new_order)
            else:
                group.current_turn_index = 0
            group.save()
        
        # Clean up any pending invitations sent to this user for this group
        GroupInvitation.objects.filter(group=group, invited_user=request.user).delete()
        
    return Response({"message": "Successfully left the group."}, status=status.HTTP_200_OK)


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
    """
    1. Calculate shares based on total, non-veg, and alcohol costs.
    2. ONLY account for members present for this specific bill.
    3. Update Settlements (balances) between users.
    4. Advance the turn.
    """
    try:
        group = Group.objects.get(id=group_id, members=request.user)
    except Group.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    try:
        total_amount = Decimal(str(data.get('total_amount', '0')))
        non_veg_amount = Decimal(str(data.get('non_veg_amount', '0') or '0'))
        alcohol_amount = Decimal(str(data.get('alcohol_amount', '0') or '0'))
        present_member_ids = data.get('present_member_ids', [])
    except Exception:
        return Response({"error": "Invalid input format"}, status=status.HTTP_400_BAD_REQUEST)

    if not present_member_ids:
        return Response({"error": "At least one member must be present"}, status=status.HTTP_400_BAD_REQUEST)

    description = data.get('description', f"Expense in {group.name}")

    if total_amount <= 0:
        return Response({"error": "Total amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

    if non_veg_amount + alcohol_amount > total_amount:
         return Response({"error": "Non-veg + Alcohol cannot exceed total"}, status=status.HTTP_400_BAD_REQUEST)

    common_amount = total_amount - non_veg_amount - alcohol_amount
    
    # Filter only members who were present
    all_members = list(group.members.all())
    present_members = [m for m in all_members if m.id in present_member_ids]
    num_present = len(present_members)

    if num_present == 0:
        return Response({"error": "No valid members selected as present"}, status=status.HTTP_400_BAD_REQUEST)

    non_veg_present = [m for m in present_members if hasattr(m, 'profile') and m.profile.is_non_veg]
    drinker_present = [m for m in present_members if hasattr(m, 'profile') and m.profile.is_drinker]

    if non_veg_amount > 0 and not non_veg_present:
        return Response({"error": "Non-veg cost specified but no non-veg members present"}, status=status.HTTP_400_BAD_REQUEST)
    if alcohol_amount > 0 and not drinker_present:
        return Response({"error": "Alcohol cost specified but no drinkers present"}, status=status.HTTP_400_BAD_REQUEST)

    # Current Payer (Turn always follows member_order regardless of presence for a single bill)
    if not group.member_order:
        group.member_order = list(group.members.all().values_list('id', flat=True))
        group.save()

    payer_index = group.current_turn_index % len(group.member_order)
    scheduled_payer_id = group.member_order[payer_index]
    
    # If a specific payer is provided (e.g., because scheduled payer is absent), use them.
    # Otherwise, use the scheduled payer.
    payer_id = data.get('payer_id', scheduled_payer_id)
    
    try:
        payer = User.objects.get(id=payer_id)
    except User.DoesNotExist:
        return Response({"error": "Payer not found"}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        # Create Expense
        expense = Expense.objects.create(
            group=group,
            payer=payer,
            amount=total_amount,
            non_veg_amount=non_veg_amount,
            alcohol_amount=alcohol_amount,
            description=description
        )

        # Calculate shares for present members
        shares = {m.id: Decimal('0') for m in present_members}
        
        # 1. Common split (veg/others) among all present
        common_share = common_amount / num_present
        for m in present_members:
            shares[m.id] += common_share
        
        # 2. Non-veg split among present non-veg members
        if non_veg_present:
            nv_share = non_veg_amount / len(non_veg_present)
            for m in non_veg_present:
                shares[m.id] += nv_share
        
        # 3. Alcohol split among present drinkers
        if drinker_present:
            alc_share = alcohol_amount / len(drinker_present)
            for m in drinker_present:
                shares[m.id] += alc_share

        # Create ExpenseSplits and Update Settlements
        for m in present_members:
            amount_owed = shares[m.id]
            ExpenseSplit.objects.create(expense=expense, user=m, amount=amount_owed)

            if m.id != payer.id:
                # User m owes payer 'amount_owed'
                s1, _ = Settlement.objects.get_or_create(group=group, debtor=m, creditor=payer)
                s1.amount += amount_owed
                s1.save()

                # Simplify: if payer owes m, reduce that first
                s2, _ = Settlement.objects.get_or_create(group=group, debtor=payer, creditor=m)
                if s1.amount >= s2.amount:
                    s1.amount -= s2.amount
                    s2.amount = 0
                else:
                    s2.amount -= s1.amount
                    s1.amount = 0
                s1.save()
                s2.save()

        # Advance Turn
        group.current_turn_index += 1
        group.save()

    return Response({
        "message": "Split calculated and turn advanced",
        "expense": ExpenseSerializer(expense).data,
        "next_turn_index": group.current_turn_index
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_settlements(request, group_id):
    """Get net balances for a group."""
    settlements = Settlement.objects.filter(group_id=group_id, amount__gt=0)
    return Response(SettlementSerializer(settlements, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_group_expenses(request, group_id):
    """List all expenses for a group."""
    expenses = Expense.objects.filter(group_id=group_id).order_by('-created_at')
    return Response(ExpenseSerializer(expenses, many=True).data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_settlements(request):
    """List all settlements involving the current user across all groups."""
    debts = Settlement.objects.filter(debtor=request.user, amount__gt=0)
    credits = Settlement.objects.filter(creditor=request.user, amount__gt=0)
    
    return Response({
        "debts": SettlementSerializer(debts, many=True).data,
        "credits": SettlementSerializer(credits, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_settled(request, settlement_id):
    """Instead of marking as settled immediately, create a SettlementRequest."""
    try:
        settlement = Settlement.objects.get(id=settlement_id)
    except Settlement.DoesNotExist:
        return Response({"error": "Settlement not found"}, status=status.HTTP_404_NOT_FOUND)

    # Only debtor can initiate a settlement request
    if request.user != settlement.debtor:
        return Response({"error": "Only the debtor can initiate a settlement request."}, status=status.HTTP_403_FORBIDDEN)

    amount_to_settle = Decimal(str(request.data.get('amount', settlement.amount)))
    
    if amount_to_settle <= 0:
        return Response({"error": "Amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
        
    if amount_to_settle > settlement.amount:
        return Response({"error": "Cannot settle more than the owed amount"}, status=status.HTTP_400_BAD_REQUEST)

    # Check if there's already a pending request for this settlement
    if SettlementRequest.objects.filter(settlement=settlement, status='pending').exists():
        return Response({"error": "A settlement request is already pending for this debt."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        request_obj = SettlementRequest.objects.create(
            settlement=settlement,
            debtor=settlement.debtor,
            creditor=settlement.creditor,
            amount=amount_to_settle,
            status='pending'
        )
        
    return Response(SettlementRequestSerializer(request_obj).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_settlement_requests(request):
    """List settlement requests involving the current user."""
    # Received requests (as creditor) - these need action
    received = SettlementRequest.objects.filter(creditor=request.user, status='pending').order_by('-created_at')
    # Sent requests (as debtor) - these are waiting for confirmation
    sent = SettlementRequest.objects.filter(debtor=request.user, status='pending').order_by('-created_at')
    
    return Response({
        "received": SettlementRequestSerializer(received, many=True).data,
        "sent": SettlementRequestSerializer(sent, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_settlement_request(request, request_id):
    """Accept or decline a settlement request."""
    action = request.data.get('action', '').strip().lower()

    if action not in ('accept', 'decline'):
        return Response(
            {"error": "Action must be 'accept' or 'decline'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        settlement_request = SettlementRequest.objects.get(id=request_id, creditor=request.user)
    except SettlementRequest.DoesNotExist:
        return Response({"error": "Settlement request not found."}, status=status.HTTP_404_NOT_FOUND)

    if settlement_request.status != 'pending':
        return Response(
            {"error": f"Request has already been {settlement_request.status}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        if action == 'accept':
            settlement_request.status = 'accepted'
            settlement_request.save()
            
            # Apply the settlement to the actual balance
            settlement = settlement_request.settlement
            settlement.amount -= settlement_request.amount
            settlement.save()
        else:
            settlement_request.status = 'declined'
            settlement_request.save()

    return Response(SettlementRequestSerializer(settlement_request).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_member(request, group_id, member_id):
    """Vote to remove a member from a group."""
    try:
        group = Group.objects.get(id=group_id, members=request.user)
        suspect = User.objects.get(id=member_id)
    except (Group.DoesNotExist, User.DoesNotExist):
        return Response({"error": "Group or Member not found"}, status=status.HTTP_404_NOT_FOUND)

    if suspect == request.user:
        return Response({"error": "You cannot vote yourself out."}, status=status.HTTP_400_BAD_REQUEST)

    if suspect not in group.members.all():
        return Response({"error": "User is not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing vote
    existing_vote = Vote.objects.filter(group=group, voter=request.user, suspect=suspect).first()
    
    # Check if suspect owes money to voter
    settlement = Settlement.objects.filter(group=group, debtor=suspect, creditor=request.user, amount__gt=0).first()
    
    confirm = request.data.get('confirm', False)
    if settlement and not confirm and not existing_vote:
        return Response({
            "warning": "if you vote him you will lose your money you gave to him , if you dont care then go ahead",
            "needs_confirmation": True
        }, status=status.HTTP_200_OK)

    with transaction.atomic():
        vote, created = Vote.objects.get_or_create(group=group, voter=request.user, suspect=suspect)
        
        # Check if everyone (except suspect) has voted
        other_members = group.members.exclude(id=suspect.id)
        total_votes = Vote.objects.filter(group=group, suspect=suspect).count()
        
        if total_votes >= other_members.count():
            # DISCARD MEMBER
            group.members.remove(suspect)
            # Remove from member_order
            if suspect.id in group.member_order:
                new_order = [uid for uid in group.member_order if uid != suspect.id]
                group.member_order = new_order
                # Adjust current_turn_index if needed (simple approach: reset if it breaks)
                if group.current_turn_index >= len(new_order) and len(new_order) > 0:
                    group.current_turn_index = group.current_turn_index % len(new_order)
                group.save()
            
            # Delete related settlements
            Settlement.objects.filter(group=group, debtor=suspect).delete()
            Settlement.objects.filter(group=group, creditor=suspect).delete()
            # Delete related settlement requests
            SettlementRequest.objects.filter(settlement__group=group, debtor=suspect).delete()
            SettlementRequest.objects.filter(settlement__group=group, creditor=suspect).delete()
            # Delete votes for this suspect
            Vote.objects.filter(group=group, suspect=suspect).delete()
            
            return Response({"message": f"{suspect.username} has been voted out of the group."}, status=status.HTTP_200_OK)

    return Response(VoteSerializer(vote).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_group_votes(request, group_id):
    """List all votes in a group."""
    votes = Vote.objects.filter(group_id=group_id)
    return Response(VoteSerializer(votes, many=True).data)
