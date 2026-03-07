from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    GroupViewSet, ExpenseViewSet, register_user, GoogleLogin,
    set_username, create_group, list_invitations, respond_invitation,
    update_preferences, calculate_split, get_settlements, list_user_settlements, mark_settled,
    list_group_expenses, list_settlement_requests, respond_settlement_request,
)

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('register/', register_user, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('set-username/', set_username, name='set_username'),
    path('update-preferences/', update_preferences, name='update_preferences'),
    path('create-group/', create_group, name='create_group'),
    path('invitations/', list_invitations, name='list_invitations'),
    path('invitations/<int:invitation_id>/respond/', respond_invitation, name='respond_invitation'),
    path('groups/<int:group_id>/calculate-split/', calculate_split, name='calculate_split'),
    path('groups/<int:group_id>/settlements/', get_settlements, name='get_settlements'),
    path('groups/<int:group_id>/expenses/', list_group_expenses, name='list_group_expenses'),
    path('settlement-requests/', list_settlement_requests, name='list_settlement_requests'),
    path('settlement-requests/<int:request_id>/respond/', respond_settlement_request, name='respond_settlement_request'),
    path('settlements/', list_user_settlements, name='list_user_settlements'),
    path('settlements/<int:settlement_id>/mark-settled/', mark_settled, name='mark_settled'),
    path('', include(router.urls)),
]
