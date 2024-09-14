from django.urls import path, include
from .views import UserRegistrationAPIView, UserLoginAPIView, UserLogoutAPIView, UserInfoAPIView, UnidadSaludRegistrationAPIView, TempranoRegistrationAPIView, TardioRegistrationAPIView, TempranoCreateView, TardioCreateView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import routers

# Api de vesiones
router = routers.DefaultRouter()
router.register(r'unidadsalud', UnidadSaludRegistrationAPIView, 'unidadsalud')
router.register(r'temprano', TempranoRegistrationAPIView, 'temprano')
router.register(r'tardio', TardioRegistrationAPIView, 'tardio')

urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/register/', UserRegistrationAPIView.as_view(), name='register-user'),
    path('v1/login/', UserLoginAPIView.as_view(), name='login-user'),
    path('v1/logout/', UserLogoutAPIView.as_view(), name='logout-user'),
    path('v1/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('v1/user/', UserInfoAPIView.as_view(), name='user-info'),
    path('v1/tempranocreate/', TempranoCreateView.as_view(), name='temprano-create'),
    path('v1/tardiocreate/', TardioCreateView.as_view(), name='tardio-create'),
]
