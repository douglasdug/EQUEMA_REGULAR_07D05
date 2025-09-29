from django.urls import path, include
from .views import UserRegistrationAPIView, UserLoginAPIView, UserLogoutAPIView, UserInfoAPIView, NewPasswordResetAPIView, ChangePasswordTokenAPIView, FirmarPDFAPIView, EniUserRegistrationAPIView, UnidadSaludRegistrationAPIView, TempranoRegistrationAPIView, TardioRegistrationAPIView, DesperdicioRegistrationAPIView, InfluenzaRegistrationAPIView, ReporteENIRegistrationAPIView, AdmisionDatosRegistrationAPIView, Form008EmergenciaRegistrationAPIView, ContactoAPIView, RegistroVacunadoRegistrationAPIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework import routers
from .report import reporteTempranoPDF

# Api de vesiones
router = routers.DefaultRouter()

router.register(r'eni-user', EniUserRegistrationAPIView, 'eni-user')
router.register(r'unidad-salud',
                UnidadSaludRegistrationAPIView, 'unidad-salud')
router.register(r'temprano', TempranoRegistrationAPIView, 'temprano')
router.register(r'tardio', TardioRegistrationAPIView, 'tardio')
router.register(r'desperdicio', DesperdicioRegistrationAPIView, 'desperdicio')
router.register(r'influenza', InfluenzaRegistrationAPIView, 'influenza')
router.register(r'reporte-eni', ReporteENIRegistrationAPIView, 'reporte-eni')
router.register(r'admision-datos',
                AdmisionDatosRegistrationAPIView, 'admision-datos')
router.register(r'form-008-emergencia',
                Form008EmergenciaRegistrationAPIView, 'form-008-emergencia')
router.register(r'registro-vacunado',
                RegistroVacunadoRegistrationAPIView, 'registro-vacunado')

urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/register/', UserRegistrationAPIView.as_view(), name='register-user'),
    path('v1/login/', UserLoginAPIView.as_view(), name='login-user'),
    path('v1/logout/', UserLogoutAPIView.as_view(), name='logout-user'),
    path('v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('v1/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('v1/user/', UserInfoAPIView.as_view(), name='user-info'),
    path('v1/new-password/',
         NewPasswordResetAPIView.as_view(), name='new_password'),
    path('v1/new-password/<str:uid>/<str:token>/',
         ChangePasswordTokenAPIView.as_view(), name='new_password_reset'),
    path('v1/firmar-pdf/', FirmarPDFAPIView.as_view(), name='firmar-pdf'),
    path('v1/contacto/', ContactoAPIView.as_view(), name='contacto'),
    path('v1/reporte/pdf/', reporteTempranoPDF, name='reporte-temprano-pdf'),
]
