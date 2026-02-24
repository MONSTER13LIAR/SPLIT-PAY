from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    GroupViewSet, ExpenseViewSet, register_user, GoogleLogin,
    set_username, create_group, list_invitations, respond_invitation,
)

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('set-username/', set_username, name='set_username'),
    path('create-group/', create_group, name='create_group'),
    path('invitations/', list_invitations, name='list_invitations'),
    path('invitations/<int:invitation_id>/respond/', respond_invitation, name='respond_invitation'),
]
