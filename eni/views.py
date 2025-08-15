from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import eniUser, unidad_salud, temprano, tardio, desperdicio, influenza, reporte_eni, admision_datos, form_008_emergencia, registro_vacunado
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, EniUserRegistrationSerializer, UnidadSaludRegistrationSerializer, TempranoRegistrationSerializer, TardioRegistrationSerializer, DesperdicioRegistrationSerializer, InfluenzaRegistrationSerializer, ReporteENIRegistrationSerializer, AdmisionDatosRegistrationSerializer, Form008EmergenciaRegistrationSerializer, RegistroVacunadoRegistrationSerializer

from django.db.models import F, Sum, Count, Max
from django.utils.dateparse import parse_date
from datetime import datetime, timezone, timedelta, time, date
from django.http import HttpResponse, StreamingHttpResponse
import csv

from django.db.models.functions import ExtractMonth

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator, PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count


# Create your views here.


class UserRegistrationAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializers = self.get_serializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        user = serializers.save()
        token = RefreshToken.for_user(user)
        data = serializers.data
        data["tokens"] = {"refresh": str(
            token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_201_CREATED)


class UserLoginAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        serializer = CustomUserSerializer(user)
        token = RefreshToken.for_user(user)
        data = serializer.data
        data["tokens"] = {"refresh": str(
            token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_200_OK)


class UserLogoutAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user


class HasRole(BasePermission):
    """
    Permiso que valida que el usuario autenticado tenga un rol permitido.
    Úsalo junto con IsAuthenticated.
    Configura allowed_roles en la vista (lista de enteros).
    """
    message = "No tiene permisos para realizar esta acción."

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        allowed = getattr(view, 'allowed_roles', None)
        if not allowed:
            # Si no se configuró, por defecto permitir a cualquier rol autenticado
            return True
        try:
            return int(getattr(user, 'fun_admi_rol', 0)) in allowed
        except (TypeError, ValueError):
            return False


class NewPasswordResetAPIView(APIView):
    # Constante para la URL del frontend
    FRONTEND_URL = "http://localhost:5173/new-password"

    @staticmethod
    def censurar_email(email):
        if '@' not in email:
            return '*' * len(email)
        local, domain = email.split('@', 1)
        if len(local) > 4:
            censored_local = local[:3] + '*' * (len(local) - 4) + local[-1]
        elif len(local) > 1:
            censored_local = local[0] + '*' * (len(local) - 2) + local[-1]
        else:
            censored_local = local + '*' * (3 - len(local))
        return f"{censored_local}@{domain}"

    def post(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'El identificador es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = eniUser.objects.get(username=username)
            email = user.email or ''
            if not email:
                return Response({'error': 'No existe un correo registrado con el Usuario. Por favor, comuníquese con el Administrador.'}, status=status.HTTP_404_NOT_FOUND)

            censored_email = self.censurar_email(email)

            # Generar token con tiempo de expiración
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Construir URL del frontend
            reset_url = f"{self.FRONTEND_URL}/{uid}/{token}"

            subject = 'Recuperación de contraseña SIRA-07D05'
            text_content = (
                f'Estimado/a {user.last_name} {user.first_name},\n\n'
                f'Para confirmar esta petición, y establecer una nueva contraseña para su cuenta, por favor vaya a la siguiente dirección de Internet:\n\n'
                f'{reset_url}\n\n'
                f'(Este enlace es válido durante 30 minutos desde el momento en que hizo la solicitud por primera vez.)\n'
                f'Si no solicitaste este cambio, ignora este correo.\n'
                'Este correo es informativo, favor no responder a esta direccion de correo.'
            )

            html_content = (
                f'<h3>Estimado/a "{user.last_name} {user.first_name}",</h3><br><br>'
                f'Para confirmar esta petición, y establecer una nueva contraseña para su cuenta, por favor vaya a la siguiente dirección de Internet:<br><br>'
                f'<a href="{reset_url}">LINK para Restablecer la contraseña</a><br><br>'
                f'(Este enlace es válido durante 30 minutos desde el momento en que hizo la solicitud por primera vez.)<br>'
                f'Si no solicitaste este cambio, ignora este correo.<br>'
                '<p style="color: red;"><strong>Este correo es informativo, favor no responder a esta direccion de correo.</strong></p>'
            )

            try:
                msg = EmailMultiAlternatives(
                    subject,
                    text_content,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email]
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()
            except Exception as e:
                return Response({'error': 'No se pudo enviar el correo. Intente más tarde.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'email': censored_email}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            return Response({'error': 'El usuario ingresado no existe en la base de datos.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, token=None):
        """Verificar token y permitir cambio de contraseña"""
        if not token:
            return Response({'error': 'Token no proporcionado'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
        try:
            # Verificar token con tiempo máximo de 30 minutos (1800 segundos)
            user_pk = serializer.loads(
                token, salt='password-reset', max_age=1800)
            user = eniUser.objects.get(pk=user_pk)
            return Response({'message': 'Token válido', 'username': user.username})
        except SignatureExpired:
            return Response({'error': 'El enlace ha expirado'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, eniUser.DoesNotExist):
            return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordTokenAPIView(APIView):
    """
    Cambia la contraseña de un usuario usando username y token válido.
    """

    def post(self, request, uid, token):
        new_password = request.data.get('new_password')

        if not new_password:
            return Response({'error': 'Falta la nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decodifica el uidb64 para obtener el id del usuario
            uid = urlsafe_base64_decode(uid).decode()
            user = eniUser.objects.get(pk=uid)
        except (eniUser.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'El usuario ingresado no existe en la base de datos.'}, status=status.HTTP_404_NOT_FOUND)

        # Validar el token
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Token inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Cambiar la contraseña
        user.set_password(new_password)
        user.save()

        return Response({'success': 'Contraseña cambiada exitosamente.'}, status=status.HTTP_200_OK)


class EniUserRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = EniUserRegistrationSerializer
    queryset = eniUser.objects.all()
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().order_by('last_name')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='buscar-usuario')
    def buscar_usuario(self, request):
        tipo = request.query_params.get('tipo')
        identificacion = request.query_params.get('identificacion')

        if not tipo or not identificacion:
            return Response({"error": "El parámetro identificacion es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        # Primera búsqueda en eniUser
        try:
            user_data = eniUser.objects.get(
                fun_tipo_iden=tipo, username=identificacion)
            # Asumiendo que hay una relación con unidades_salud
            unidades_salud = user_data.unidades_salud.all()
            unidades_data = [{
                "uni_unic": unidad.uni_unic, "uni_unid": unidad.uni_unid
            }
                for unidad in unidades_salud] if unidades_salud else []
            data = {
                "id_eniUser": user_data.id,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "fun_sex": user_data.fun_sex,
                "email": user_data.email,
                "fun_titu": user_data.fun_titu,
                "fun_admi_rol": user_data.fun_admi_rol,
                "fun_esta": user_data.fun_esta,
                "unidades_data": unidades_data,
            }
            return Response({"message": "El usuario ya se encuentra registrado. Por favor, comuníquese con el Administrador!", "data": data}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            pass

        # Segundo búsqueda en admision_datos
        try:
            user_data = admision_datos.objects.get(
                adm_dato_pers_tipo_iden=tipo, adm_dato_pers_nume_iden=identificacion
            )
            data = {
                "adm_dato_pers_apel_prim": user_data.adm_dato_pers_apel_prim,
                "adm_dato_pers_apel_segu": user_data.adm_dato_pers_apel_segu,
                "adm_dato_pers_nomb_prim": user_data.adm_dato_pers_nomb_prim,
                "adm_dato_pers_nomb_segu": user_data.adm_dato_pers_nomb_segu,
                "adm_dato_pers_sexo": user_data.adm_dato_pers_sexo,
            }
            return Response({"message": "El usuario está registrado en el sistema pero falta que se registre como usuario!", "data": data}, status=status.HTTP_200_OK)
        except admision_datos.DoesNotExist:
            return Response({"error": "El usuario ingresado no existe en la base de datos porfavor registrese!"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='buscar-usuario-id-unidad-salud')
    def buscar_usuario_id_unidad_salud(self, request):
        id_eni_user = request.query_params.get('id_eni_user')

        # Primera búsqueda en eniUser
        try:
            user_data = eniUser.objects.get(
                id=id_eni_user)
            # Asumiendo que hay una relación con unidades_salud
            unidades_salud = user_data.unidades_salud.all()
            unidades_data = [{
                "id": unidad.id, "uni_unid_prin": unidad.uni_unid_prin, "uni_unic": unidad.uni_unic, "uni_unid": unidad.uni_unid
            }
                for unidad in unidades_salud] if unidades_salud else []
            data = {
                "id_eniUser": user_data.id,
                "unidades_data": unidades_data,
            }
            return Response({"message": "Se encontro las unidades de salud del usuario!", "data": data}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            return Response({"error": "No se encontro las unidades de salud del usuario!"}, status=status.HTTP_404_NOT_FOUND)

    # , permission_classes=[IsAuthenticated])
    @action(detail=False, methods=['get'], url_path='listar-filtrado')
    def listar_filtrado(self, request):
        try:
            exclude_id = request.query_params.get(
                'id_eni_user') or getattr(request.user, 'id', None)
            titulos_excluir = request.query_params.getlist('excluir_fun_titu') or [
                "BIOQUÍMICO MÉDICO/A",
                "OTROS/A",
            ]

            qs = self.get_queryset()
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if titulos_excluir:
                qs = qs.exclude(fun_titu__in=titulos_excluir)

            data = list(
                qs.order_by('last_name', 'first_name')
                  .values('id', 'username', 'first_name', 'last_name', 'fun_titu')
            )
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        now = timezone.now()
        data['adm_dato_admi_fech_admi'] = now.strftime('%Y-%m-%d %H:%M:%S')

        tipo = data.get('fun_tipo_iden')
        identificacion = data.get('username')

        # Procesar nombres y apellidos
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        apellidos = last_name.split(' ', 1)
        nombres = first_name.split(' ', 1)
        email = data.get('email', '').strip()

        try:
            with transaction.atomic():
                # Guardar SIEMPRE en eniUser
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                user = serializer.save()

                # Buscar registros en admision_datos
                if not admision_datos.objects.filter(
                    adm_dato_pers_tipo_iden=tipo,
                    adm_dato_pers_nume_iden=identificacion
                ).exists():
                    admision_datos.objects.create(
                        adm_dato_admi_fech_admi=now,
                        adm_dato_pers_tipo_iden=tipo,
                        adm_dato_pers_nume_iden=identificacion,
                        adm_dato_pers_apel_prim=apellidos[0] if apellidos else '',
                        adm_dato_pers_apel_segu=apellidos[1] if len(
                            apellidos) > 1 else '',
                        adm_dato_pers_nomb_prim=nombres[0] if nombres else '',
                        adm_dato_pers_nomb_segu=nombres[1] if len(
                            nombres) > 1 else '',
                        adm_dato_pers_sexo=data.get('fun_sex'),
                        adm_dato_pers_corr_elec=email
                    )

                # Procesar unidades de salud
                uni_unic_list = data.get('uni_unic')
                if uni_unic_list:
                    # Asegurarse de que sea lista
                    if isinstance(uni_unic_list, (str, dict)):
                        uni_unic_list = [uni_unic_list]
                    # Si es lista de dicts o strings
                    for idx, item in enumerate(uni_unic_list):
                        if isinstance(item, dict):
                            uni_unic = item.get('value')
                        else:
                            uni_unic = item
                        unidad_salud_data = self.get_unidad_salud_data(
                            uni_unic)
                        if unidad_salud_data:
                            # Asignar 1 al primero, 0 a los demás
                            unidad_salud_data['uni_unid_prin'] = 1 if idx == 0 else 0
                            unidad_salud.objects.create(
                                eniUser=user,
                                **unidad_salud_data
                            )

                # Generar token
                token = RefreshToken.for_user(user)
                response_data = serializer.data
                response_data["tokens"] = {
                    "refresh": str(token),
                    "access": str(token.access_token)
                }
                return Response(
                    {"message": "El usuario fue creado exitosamente!",
                        "data": response_data},
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response(
                {"message": "Error al crear el usuario", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_unidad_salud_data(self, uni_unic):
        matriz = [
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000541", "uni_unid": "SAN VICENTE", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000542", "uni_unid": "SAN ISIDRO URBANO", "uni_tipo": "CENTRO DE SALUD TIPO B", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000543", "uni_unid": "CAÑAS", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "LA CUCA",
                "uni_unic": "000544", "uni_unid": "LA CUCA", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "CARCABON",
                "uni_unic": "000545", "uni_unid": "CARCABON", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "CHACRAS",
                "uni_unic": "000546",	"uni_unid": "CHACRAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "PALMALES",
                "uni_unic": "000547", "uni_unid": "PALMALES", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "PALMALES",
                "uni_unic": "000548", "uni_unid": "MANABI DE EL ORO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "EL PARAISO",
                "uni_unic": "000549", "uni_unid": "EL PARAISO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "LA LIBERTAD",
                "uni_unic": "000550", "uni_unid": "LA LIBERTAD", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS",
                "uni_parr": "LA VICTORIA (URBANO)", "uni_unic": "000551", "uni_unid": "LAS LAJAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "VALLE HERMOSO",
                "uni_unic": "000552", "uni_unid": "VALLE HERMOSO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "SAN ISIDRO",
                "uni_unic": "000553", "uni_unid": "SAN ISIDRO RURAL", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "ECUADOR",
                "uni_unic": "000554", "uni_unid": "18 DE NOVIEMBRE", "uni_tipo": "CENTRO DE SALUD TIPO B", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "MILTON REYES",
                "uni_unic": "000555", "uni_unid": "LA PAZ", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "HUALTACO",
                "uni_unic": "000556", "uni_unid": "HUALTACO", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000591", "uni_unid": "HOSPITAL BASICO ARENILLAS", "uni_tipo": "HOSPITAL BASICO", "uni_nive": "NIVEL 2"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "000592", "uni_unid": "HOSPITAL BASICO HUAQUILLAS", "uni_tipo": "HOSPITAL BASICO", "uni_nive": "NIVEL 2"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "002763", "uni_unid": "EL JOBO SAN VICENTE", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "002879", "uni_unid": "CENTRO DE SALUD DE HUAQUILLAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "002900", "uni_unid": "CENTRO DE SALUD DE ARENILLAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_inst_sist": "MSP", "uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "050748", "uni_unid": "PUESTO DE VIGILANCIA HUAQUILLAS", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
        ]
        for unidad in matriz:
            if unidad['uni_unic'] == uni_unic:
                return unidad
        return None

    def update(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        eni_user_id = pk
        if not eni_user_id:
            return Response({"error": "El parámetro 'id' es requerido para actualizar el registro!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            eni_user = eniUser.objects.get(id=eni_user_id)
        except eniUser.DoesNotExist:
            return Response({"error": "Registro de usuario no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(
            eni_user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Actualizar unidades de salud
        uni_unic_list = data.get('uni_unic')
        if isinstance(uni_unic_list, list) and len(uni_unic_list) > 0:
            # 1. Obtener las unidades de salud actuales del usuario, ordenadas por uni_unid_prin DESC
            unidades_actuales = list(unidad_salud.objects.filter(
                eniUser=eni_user
            ).order_by('-uni_unid_prin', 'id'))  # El principal primero

            # --- NUEVO BLOQUE PARA ELIMINAR SEGUNDO Y TERCER REGISTRO SIEMPRE ---
            # Eliminar siempre los registros secundarios (posición 1 y 2, si existen)
            if len(unidades_actuales) > 1:
                # Eliminar desde el segundo registro hasta el final
                for unidad in unidades_actuales[1:]:
                    unidad.delete()
            # ------------------------------------------------------

            # 2. Procesar el primer registro (principal)
            if len(uni_unic_list) > 0:
                uni_unic_item = uni_unic_list[0]
                uni_unic = uni_unic_item.get('value')
                unidad_salud_data = self.get_unidad_salud_data(uni_unic)
                if unidad_salud_data:
                    if len(unidades_actuales) > 0:
                        # Actualizar el primer registro existente
                        unidad_principal = unidades_actuales[0]
                        unidad_principal.uni_unic = unidad_salud_data['uni_unic']
                        unidad_principal.uni_inst_sist = unidad_salud_data['uni_inst_sist']
                        unidad_principal.uni_zona = unidad_salud_data['uni_zona']
                        unidad_principal.uni_dist = unidad_salud_data['uni_dist']
                        unidad_principal.uni_prov = unidad_salud_data['uni_prov']
                        unidad_principal.uni_cant = unidad_salud_data['uni_cant']
                        unidad_principal.uni_parr = unidad_salud_data['uni_parr']
                        unidad_principal.uni_unid = unidad_salud_data['uni_unid']
                        unidad_principal.uni_tipo = unidad_salud_data['uni_tipo']
                        unidad_principal.uni_nive = unidad_salud_data['uni_nive']
                        unidad_principal.uni_unid_prin = 1
                        unidad_principal.save()
                    else:
                        # Si no existe, crearla
                        unidad_principal = unidad_salud.objects.create(
                            eniUser=eni_user,
                            uni_unic=unidad_salud_data['uni_unic'],
                            uni_inst_sist=unidad_salud_data['uni_inst_sist'],
                            uni_zona=unidad_salud_data['uni_zona'],
                            uni_dist=unidad_salud_data['uni_dist'],
                            uni_prov=unidad_salud_data['uni_prov'],
                            uni_cant=unidad_salud_data['uni_cant'],
                            uni_parr=unidad_salud_data['uni_parr'],
                            uni_unid=unidad_salud_data['uni_unid'],
                            uni_tipo=unidad_salud_data['uni_tipo'],
                            uni_nive=unidad_salud_data['uni_nive'],
                            uni_unid_prin=1
                        )

            # 3. Procesar segundo y tercer registro (si existen en uni_unic_list)
            for idx in range(1, min(3, len(uni_unic_list))):
                uni_unic_item = uni_unic_list[idx]
                uni_unic = uni_unic_item.get('value')
                unidad_salud_data = self.get_unidad_salud_data(uni_unic)
                if unidad_salud_data:
                    # Crear el nuevo registro secundario
                    unidad_salud.objects.create(
                        eniUser=eni_user,
                        uni_unic=unidad_salud_data['uni_unic'],
                        uni_inst_sist=unidad_salud_data['uni_inst_sist'],
                        uni_zona=unidad_salud_data['uni_zona'],
                        uni_dist=unidad_salud_data['uni_dist'],
                        uni_prov=unidad_salud_data['uni_prov'],
                        uni_cant=unidad_salud_data['uni_cant'],
                        uni_parr=unidad_salud_data['uni_parr'],
                        uni_unid=unidad_salud_data['uni_unid'],
                        uni_tipo=unidad_salud_data['uni_tipo'],
                        uni_nive=unidad_salud_data['uni_nive'],
                        uni_unid_prin=0
                    )

        return Response({"message": "El usuario se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='eliminar-usuario')
    def delete_by_username(self, request):
        username = request.data.get('username')
        if not username:
            return Response({"error": "El parámetro de identificacion es requerido!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = eniUser.objects.get(username=username)
        except eniUser.DoesNotExist:
            return Response({"error": "El usuario ingresado no existe en la base de datos!"}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response({"message": "Usuario eliminado exitosamente!"}, status=status.HTTP_204_NO_CONTENT)


class UnidadSaludRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = UnidadSaludRegistrationSerializer
    queryset = unidad_salud.objects.all()
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['patch'], url_path='unidad-salud-principal')
    def update_unidad_salud_principal(self, request):
        # 1. Obtener el id de la unidad a actualizar desde el frontend
        # O request.data['id'] si es obligatorio
        unidad_id = request.data.get('id_unid_salu')
        print(f"Unidad ID: {unidad_id}")

        if not unidad_id:
            return Response({'error': 'No se proporcionó el id de la unidad de salud.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Obtener la unidad de salud y su eniUser_id
            unidad = unidad_salud.objects.get(id=unidad_id)
            eni_user_id = unidad.eniUser_id
        except unidad_salud.DoesNotExist:
            return Response({"error": "Registro de unidad de salud no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Obtener todas las unidades de ese usuario
        unidades_usuario = unidad_salud.objects.filter(eniUser_id=eni_user_id)

        # 4. Actualizar uni_unid_prin para todas las unidades
        for u in unidades_usuario:
            if u.id == unidad.id:
                u.uni_unid_prin = 1
            else:
                u.uni_unid_prin = 0
            u.save()

        serializer = self.get_serializer(unidad)

        return Response({"message": "La unidad de salud principal se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)


Error_Fecha_Registrada = "La fecha ya ha sido registrada desea Actualizar la información!."
Dato_Create_Correcto = "Datos registrados correctamente!."
Dato_Update_Correcto = "El registro se actualizó exitosamente!"
Dato_Delete_Correcto = "Registros eliminados correctamente!"


class TempranoRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = TempranoRegistrationSerializer
    queryset = temprano.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                tem_fech__year=year, tem_fech__month=month)

        return queryset.order_by('tem_fech', 'tem_tota')

    @action(detail=False, methods=['post'], url_path='crear-temprano')
    def create_temprano(self, request, *args, **kwargs):
        data = request.data
        tem_fech = parse_date(data.get('tem_fech'))
        eni_user_id = data.get('eniUser')

        # Verificar si ya existe un registro con las mismas variables
        if temprano.objects.filter(eniUser_id=eni_user_id, tem_fech=tem_fech, tem_tota=False).exists():
            return Response({"error": Error_Fecha_Registrada}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Crear variables de control
        fech_inicio = tem_fech.replace(day=1)
        fech_fin = (tem_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde tem_tota es False
        registros_mes = temprano.objects.filter(
            tem_fech__range=(fech_inicio, fech_fin), eniUser_id=eni_user_id, tem_tota=False)
        sum_totals = registros_mes.aggregate(
            tem_intr=Sum('tem_intr'),
            tem_extr_mies_cnh=Sum('tem_extr_mies_cnh'),
            tem_extr_mies_cibv=Sum('tem_extr_mies_cibv'),
            tem_extr_mine_egen=Sum('tem_extr_mine_egen'),
            tem_extr_mine_bach=Sum('tem_extr_mine_bach'),
            tem_extr_visi=Sum('tem_extr_visi'),
            tem_extr_aten=Sum('tem_extr_aten'),
            tem_otro=Sum('tem_otro'),
            tem_sexo_homb=Sum('tem_sexo_homb'),
            tem_sexo_muje=Sum('tem_sexo_muje'),
            tem_luga_pert=Sum('tem_luga_pert'),
            tem_luga_nope=Sum('tem_luga_nope'),
            tem_naci_ecua=Sum('tem_naci_ecua'),
            tem_naci_colo=Sum('tem_naci_colo'),
            tem_naci_peru=Sum('tem_naci_peru'),
            tem_naci_cuba=Sum('tem_naci_cuba'),
            tem_naci_vene=Sum('tem_naci_vene'),
            tem_naci_otro=Sum('tem_naci_otro'),
            tem_auto_indi=Sum('tem_auto_indi'),
            tem_auto_afro=Sum('tem_auto_afro'),
            tem_auto_negr=Sum('tem_auto_negr'),
            tem_auto_mula=Sum('tem_auto_mula'),
            tem_auto_mont=Sum('tem_auto_mont'),
            tem_auto_mest=Sum('tem_auto_mest'),
            tem_auto_blan=Sum('tem_auto_blan'),
            tem_auto_otro=Sum('tem_auto_otro'),
            tem_naci_achu=Sum('tem_naci_achu'),
            tem_naci_ando=Sum('tem_naci_ando'),
            tem_naci_awa=Sum('tem_naci_awa'),
            tem_naci_chac=Sum('tem_naci_chac'),
            tem_naci_cofa=Sum('tem_naci_cofa'),
            tem_naci_eper=Sum('tem_naci_eper'),
            tem_naci_huan=Sum('tem_naci_huan'),
            tem_naci_kich=Sum('tem_naci_kich'),
            tem_naci_mant=Sum('tem_naci_mant'),
            tem_naci_seco=Sum('tem_naci_seco'),
            tem_naci_shiw=Sum('tem_naci_shiw'),
            tem_naci_shua=Sum('tem_naci_shua'),
            tem_naci_sion=Sum('tem_naci_sion'),
            tem_naci_tsac=Sum('tem_naci_tsac'),
            tem_naci_waor=Sum('tem_naci_waor'),
            tem_naci_zapa=Sum('tem_naci_zapa'),
            tem_pueb_chib=Sum('tem_pueb_chib'),
            tem_pueb_kana=Sum('tem_pueb_kana'),
            tem_pueb_kara=Sum('tem_pueb_kara'),
            tem_pueb_kaya=Sum('tem_pueb_kaya'),
            tem_pueb_kich=Sum('tem_pueb_kich'),
            tem_pueb_kisa=Sum('tem_pueb_kisa'),
            tem_pueb_kitu=Sum('tem_pueb_kitu'),
            tem_pueb_nata=Sum('tem_pueb_nata'),
            tem_pueb_otav=Sum('tem_pueb_otav'),
            tem_pueb_palt=Sum('tem_pueb_palt'),
            tem_pueb_panz=Sum('tem_pueb_panz'),
            tem_pueb_past=Sum('tem_pueb_past'),
            tem_pueb_puru=Sum('tem_pueb_puru'),
            tem_pueb_sala=Sum('tem_pueb_sala'),
            tem_pueb_sara=Sum('tem_pueb_sara'),
            tem_pueb_toma=Sum('tem_pueb_toma'),
            tem_pueb_wara=Sum('tem_pueb_wara'),
            tem_men1_dosi_bcgp=Sum('tem_men1_dosi_bcgp'),
            tem_men1_dosi_hbpr=Sum('tem_men1_dosi_hbpr'),
            tem_men1_dosi_bcgd=Sum('tem_men1_dosi_bcgd'),
            tem_men1_1rad_rota=Sum('tem_men1_1rad_rota'),
            tem_men1_1rad_fipv=Sum('tem_men1_1rad_fipv'),
            tem_men1_1rad_neum=Sum('tem_men1_1rad_neum'),
            tem_men1_1rad_pent=Sum('tem_men1_1rad_pent'),
            tem_men1_2dad_rota=Sum('tem_men1_2dad_rota'),
            tem_men1_2dad_fipv=Sum('tem_men1_2dad_fipv'),
            tem_men1_2dad_neum=Sum('tem_men1_2dad_neum'),
            tem_men1_2dad_pent=Sum('tem_men1_2dad_pent'),
            tem_men1_3rad_bopv=Sum('tem_men1_3rad_bopv'),
            tem_men1_3rad_neum=Sum('tem_men1_3rad_neum'),
            tem_men1_3rad_pent=Sum('tem_men1_3rad_pent'),
            tem_12a23m_1rad_srp=Sum('tem_12a23m_1rad_srp'),
            tem_12a23m_dosi_fa=Sum('tem_12a23m_dosi_fa'),
            tem_12a23m_dosi_vari=Sum('tem_12a23m_dosi_vari'),
            tem_12a23m_2dad_srp=Sum('tem_12a23m_2dad_srp'),
            tem_12a23m_4tad_bopv=Sum('tem_12a23m_4tad_bopv'),
            tem_12a23m_4tad_dpt=Sum('tem_12a23m_4tad_dpt'),
            tem_5ano_5tad_bopv=Sum('tem_5ano_5tad_bopv'),
            tem_5ano_5tad_dpt=Sum('tem_5ano_5tad_dpt'),
            tem_9ano_1rad_hpv=Sum('tem_9ano_1rad_hpv'),
            tem_9ano_2dad_hpv=Sum('tem_9ano_2dad_hpv'),
            tem_10an_2dad_hpv=Sum('tem_10an_2dad_hpv'),
            tem_15an_terc_dtad=Sum('tem_15an_terc_dtad')
        )

        # Verificar si ya existe un registro con la misma fecha y tem_tota=True
        total_record = temprano.objects.filter(
            eniUser_id=eni_user_id, tem_fech=fech_fin, tem_tota=True).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.tem_intr = sum_totals['tem_intr'] or 0
            total_record.tem_extr_mies_cnh = sum_totals['tem_extr_mies_cnh'] or 0
            total_record.tem_extr_mies_cibv = sum_totals['tem_extr_mies_cibv'] or 0
            total_record.tem_extr_mine_egen = sum_totals['tem_extr_mine_egen'] or 0
            total_record.tem_extr_mine_bach = sum_totals['tem_extr_mine_bach'] or 0
            total_record.tem_extr_visi = sum_totals['tem_extr_visi'] or 0
            total_record.tem_extr_aten = sum_totals['tem_extr_aten'] or 0
            total_record.tem_otro = sum_totals['tem_otro'] or 0
            total_record.tem_sexo_homb = sum_totals['tem_sexo_homb'] or 0
            total_record.tem_sexo_muje = sum_totals['tem_sexo_muje'] or 0
            total_record.tem_luga_pert = sum_totals['tem_luga_pert'] or 0
            total_record.tem_luga_nope = sum_totals['tem_luga_nope'] or 0
            total_record.tem_naci_ecua = sum_totals['tem_naci_ecua'] or 0
            total_record.tem_naci_colo = sum_totals['tem_naci_colo'] or 0
            total_record.tem_naci_peru = sum_totals['tem_naci_peru'] or 0
            total_record.tem_naci_cuba = sum_totals['tem_naci_cuba'] or 0
            total_record.tem_naci_vene = sum_totals['tem_naci_vene'] or 0
            total_record.tem_naci_otro = sum_totals['tem_naci_otro'] or 0
            total_record.tem_auto_indi = sum_totals['tem_auto_indi'] or 0
            total_record.tem_auto_afro = sum_totals['tem_auto_afro'] or 0
            total_record.tem_auto_negr = sum_totals['tem_auto_negr'] or 0
            total_record.tem_auto_mula = sum_totals['tem_auto_mula'] or 0
            total_record.tem_auto_mont = sum_totals['tem_auto_mont'] or 0
            total_record.tem_auto_mest = sum_totals['tem_auto_mest'] or 0
            total_record.tem_auto_blan = sum_totals['tem_auto_blan'] or 0
            total_record.tem_auto_otro = sum_totals['tem_auto_otro'] or 0
            total_record.tem_naci_achu = sum_totals['tem_naci_achu'] or 0
            total_record.tem_naci_ando = sum_totals['tem_naci_ando'] or 0
            total_record.tem_naci_awa = sum_totals['tem_naci_awa'] or 0
            total_record.tem_naci_chac = sum_totals['tem_naci_chac'] or 0
            total_record.tem_naci_cofa = sum_totals['tem_naci_cofa'] or 0
            total_record.tem_naci_eper = sum_totals['tem_naci_eper'] or 0
            total_record.tem_naci_huan = sum_totals['tem_naci_huan'] or 0
            total_record.tem_naci_kich = sum_totals['tem_naci_kich'] or 0
            total_record.tem_naci_mant = sum_totals['tem_naci_mant'] or 0
            total_record.tem_naci_seco = sum_totals['tem_naci_seco'] or 0
            total_record.tem_naci_shiw = sum_totals['tem_naci_shiw'] or 0
            total_record.tem_naci_shua = sum_totals['tem_naci_shua'] or 0
            total_record.tem_naci_sion = sum_totals['tem_naci_sion'] or 0
            total_record.tem_naci_tsac = sum_totals['tem_naci_tsac'] or 0
            total_record.tem_naci_waor = sum_totals['tem_naci_waor'] or 0
            total_record.tem_naci_zapa = sum_totals['tem_naci_zapa'] or 0
            total_record.tem_pueb_chib = sum_totals['tem_pueb_chib'] or 0
            total_record.tem_pueb_kana = sum_totals['tem_pueb_kana'] or 0
            total_record.tem_pueb_kara = sum_totals['tem_pueb_kara'] or 0
            total_record.tem_pueb_kaya = sum_totals['tem_pueb_kaya'] or 0
            total_record.tem_pueb_kich = sum_totals['tem_pueb_kich'] or 0
            total_record.tem_pueb_kisa = sum_totals['tem_pueb_kisa'] or 0
            total_record.tem_pueb_kitu = sum_totals['tem_pueb_kitu'] or 0
            total_record.tem_pueb_nata = sum_totals['tem_pueb_nata'] or 0
            total_record.tem_pueb_otav = sum_totals['tem_pueb_otav'] or 0
            total_record.tem_pueb_palt = sum_totals['tem_pueb_palt'] or 0
            total_record.tem_pueb_panz = sum_totals['tem_pueb_panz'] or 0
            total_record.tem_pueb_past = sum_totals['tem_pueb_past'] or 0
            total_record.tem_pueb_puru = sum_totals['tem_pueb_puru'] or 0
            total_record.tem_pueb_sala = sum_totals['tem_pueb_sala'] or 0
            total_record.tem_pueb_sara = sum_totals['tem_pueb_sara'] or 0
            total_record.tem_pueb_toma = sum_totals['tem_pueb_toma'] or 0
            total_record.tem_pueb_wara = sum_totals['tem_pueb_wara'] or 0
            total_record.tem_men1_dosi_bcgp = sum_totals['tem_men1_dosi_bcgp'] or 0
            total_record.tem_men1_dosi_hbpr = sum_totals['tem_men1_dosi_hbpr'] or 0
            total_record.tem_men1_dosi_bcgd = sum_totals['tem_men1_dosi_bcgd'] or 0
            total_record.tem_men1_1rad_rota = sum_totals['tem_men1_1rad_rota'] or 0
            total_record.tem_men1_1rad_fipv = sum_totals['tem_men1_1rad_fipv'] or 0
            total_record.tem_men1_1rad_neum = sum_totals['tem_men1_1rad_neum'] or 0
            total_record.tem_men1_1rad_pent = sum_totals['tem_men1_1rad_pent'] or 0
            total_record.tem_men1_2dad_rota = sum_totals['tem_men1_2dad_rota'] or 0
            total_record.tem_men1_2dad_fipv = sum_totals['tem_men1_2dad_fipv'] or 0
            total_record.tem_men1_2dad_neum = sum_totals['tem_men1_2dad_neum'] or 0
            total_record.tem_men1_2dad_pent = sum_totals['tem_men1_2dad_pent'] or 0
            total_record.tem_men1_3rad_bopv = sum_totals['tem_men1_3rad_bopv'] or 0
            total_record.tem_men1_3rad_neum = sum_totals['tem_men1_3rad_neum'] or 0
            total_record.tem_men1_3rad_pent = sum_totals['tem_men1_3rad_pent'] or 0
            total_record.tem_12a23m_1rad_srp = sum_totals['tem_12a23m_1rad_srp'] or 0
            total_record.tem_12a23m_dosi_fa = sum_totals['tem_12a23m_dosi_fa'] or 0
            total_record.tem_12a23m_dosi_vari = sum_totals['tem_12a23m_dosi_vari'] or 0
            total_record.tem_12a23m_2dad_srp = sum_totals['tem_12a23m_2dad_srp'] or 0
            total_record.tem_12a23m_4tad_bopv = sum_totals['tem_12a23m_4tad_bopv'] or 0
            total_record.tem_12a23m_4tad_dpt = sum_totals['tem_12a23m_4tad_dpt'] or 0
            total_record.tem_5ano_5tad_bopv = sum_totals['tem_5ano_5tad_bopv'] or 0
            total_record.tem_5ano_5tad_dpt = sum_totals['tem_5ano_5tad_dpt'] or 0
            total_record.tem_9ano_1rad_hpv = sum_totals['tem_9ano_1rad_hpv'] or 0
            total_record.tem_9ano_2dad_hpv = sum_totals['tem_9ano_2dad_hpv'] or 0
            total_record.tem_10an_2dad_hpv = sum_totals['tem_10an_2dad_hpv'] or 0
            total_record.tem_15an_terc_dtad = sum_totals['tem_15an_terc_dtad'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            temprano.objects.create(
                tem_fech=fech_fin,
                eniUser_id=eni_user_id,  # Guardar la relación con User
                tem_tota=True,
                tem_intr=sum_totals['tem_intr'] or 0,
                tem_extr_mies_cnh=sum_totals['tem_extr_mies_cnh'] or 0,
                tem_extr_mies_cibv=sum_totals['tem_extr_mies_cibv'] or 0,
                tem_extr_mine_egen=sum_totals['tem_extr_mine_egen'] or 0,
                tem_extr_mine_bach=sum_totals['tem_extr_mine_bach'] or 0,
                tem_extr_visi=sum_totals['tem_extr_visi'] or 0,
                tem_extr_aten=sum_totals['tem_extr_aten'] or 0,
                tem_otro=sum_totals['tem_otro'] or 0,
                tem_sexo_homb=sum_totals['tem_sexo_homb'] or 0,
                tem_sexo_muje=sum_totals['tem_sexo_muje'] or 0,
                tem_luga_pert=sum_totals['tem_luga_pert'] or 0,
                tem_luga_nope=sum_totals['tem_luga_nope'] or 0,
                tem_naci_ecua=sum_totals['tem_naci_ecua'] or 0,
                tem_naci_colo=sum_totals['tem_naci_colo'] or 0,
                tem_naci_peru=sum_totals['tem_naci_peru'] or 0,
                tem_naci_cuba=sum_totals['tem_naci_cuba'] or 0,
                tem_naci_vene=sum_totals['tem_naci_vene'] or 0,
                tem_naci_otro=sum_totals['tem_naci_otro'] or 0,
                tem_auto_indi=sum_totals['tem_auto_indi'] or 0,
                tem_auto_afro=sum_totals['tem_auto_afro'] or 0,
                tem_auto_negr=sum_totals['tem_auto_negr'] or 0,
                tem_auto_mula=sum_totals['tem_auto_mula'] or 0,
                tem_auto_mont=sum_totals['tem_auto_mont'] or 0,
                tem_auto_mest=sum_totals['tem_auto_mest'] or 0,
                tem_auto_blan=sum_totals['tem_auto_blan'] or 0,
                tem_auto_otro=sum_totals['tem_auto_otro'] or 0,
                tem_naci_achu=sum_totals['tem_naci_achu'] or 0,
                tem_naci_ando=sum_totals['tem_naci_ando'] or 0,
                tem_naci_awa=sum_totals['tem_naci_awa'] or 0,
                tem_naci_chac=sum_totals['tem_naci_chac'] or 0,
                tem_naci_cofa=sum_totals['tem_naci_cofa'] or 0,
                tem_naci_eper=sum_totals['tem_naci_eper'] or 0,
                tem_naci_huan=sum_totals['tem_naci_huan'] or 0,
                tem_naci_kich=sum_totals['tem_naci_kich'] or 0,
                tem_naci_mant=sum_totals['tem_naci_mant'] or 0,
                tem_naci_seco=sum_totals['tem_naci_seco'] or 0,
                tem_naci_shiw=sum_totals['tem_naci_shiw'] or 0,
                tem_naci_shua=sum_totals['tem_naci_shua'] or 0,
                tem_naci_sion=sum_totals['tem_naci_sion'] or 0,
                tem_naci_tsac=sum_totals['tem_naci_tsac'] or 0,
                tem_naci_waor=sum_totals['tem_naci_waor'] or 0,
                tem_naci_zapa=sum_totals['tem_naci_zapa'] or 0,
                tem_pueb_chib=sum_totals['tem_pueb_chib'] or 0,
                tem_pueb_kana=sum_totals['tem_pueb_kana'] or 0,
                tem_pueb_kara=sum_totals['tem_pueb_kara'] or 0,
                tem_pueb_kaya=sum_totals['tem_pueb_kaya'] or 0,
                tem_pueb_kich=sum_totals['tem_pueb_kich'] or 0,
                tem_pueb_kisa=sum_totals['tem_pueb_kisa'] or 0,
                tem_pueb_kitu=sum_totals['tem_pueb_kitu'] or 0,
                tem_pueb_nata=sum_totals['tem_pueb_nata'] or 0,
                tem_pueb_otav=sum_totals['tem_pueb_otav'] or 0,
                tem_pueb_palt=sum_totals['tem_pueb_palt'] or 0,
                tem_pueb_panz=sum_totals['tem_pueb_panz'] or 0,
                tem_pueb_past=sum_totals['tem_pueb_past'] or 0,
                tem_pueb_puru=sum_totals['tem_pueb_puru'] or 0,
                tem_pueb_sala=sum_totals['tem_pueb_sala'] or 0,
                tem_pueb_sara=sum_totals['tem_pueb_sara'] or 0,
                tem_pueb_toma=sum_totals['tem_pueb_toma'] or 0,
                tem_pueb_wara=sum_totals['tem_pueb_wara'] or 0,
                tem_men1_dosi_bcgp=sum_totals['tem_men1_dosi_bcgp'] or 0,
                tem_men1_dosi_hbpr=sum_totals['tem_men1_dosi_hbpr'] or 0,
                tem_men1_dosi_bcgd=sum_totals['tem_men1_dosi_bcgd'] or 0,
                tem_men1_1rad_rota=sum_totals['tem_men1_1rad_rota'] or 0,
                tem_men1_1rad_fipv=sum_totals['tem_men1_1rad_fipv'] or 0,
                tem_men1_1rad_neum=sum_totals['tem_men1_1rad_neum'] or 0,
                tem_men1_1rad_pent=sum_totals['tem_men1_1rad_pent'] or 0,
                tem_men1_2dad_rota=sum_totals['tem_men1_2dad_rota'] or 0,
                tem_men1_2dad_fipv=sum_totals['tem_men1_2dad_fipv'] or 0,
                tem_men1_2dad_neum=sum_totals['tem_men1_2dad_neum'] or 0,
                tem_men1_2dad_pent=sum_totals['tem_men1_2dad_pent'] or 0,
                tem_men1_3rad_bopv=sum_totals['tem_men1_3rad_bopv'] or 0,
                tem_men1_3rad_neum=sum_totals['tem_men1_3rad_neum'] or 0,
                tem_men1_3rad_pent=sum_totals['tem_men1_3rad_pent'] or 0,
                tem_12a23m_1rad_srp=sum_totals['tem_12a23m_1rad_srp'] or 0,
                tem_12a23m_dosi_fa=sum_totals['tem_12a23m_dosi_fa'] or 0,
                tem_12a23m_dosi_vari=sum_totals['tem_12a23m_dosi_vari'] or 0,
                tem_12a23m_2dad_srp=sum_totals['tem_12a23m_2dad_srp'] or 0,
                tem_12a23m_4tad_bopv=sum_totals['tem_12a23m_4tad_bopv'] or 0,
                tem_12a23m_4tad_dpt=sum_totals['tem_12a23m_4tad_dpt'] or 0,
                tem_5ano_5tad_bopv=sum_totals['tem_5ano_5tad_bopv'] or 0,
                tem_5ano_5tad_dpt=sum_totals['tem_5ano_5tad_dpt'] or 0,
                tem_9ano_1rad_hpv=sum_totals['tem_9ano_1rad_hpv'] or 0,
                tem_9ano_2dad_hpv=sum_totals['tem_9ano_2dad_hpv'] or 0,
                tem_10an_2dad_hpv=sum_totals['tem_10an_2dad_hpv'] or 0,
                tem_15an_terc_dtad=sum_totals['tem_15an_terc_dtad'] or 0
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tem_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las valores de las variables de Temprano y Desperdicio
        des_bcg_dosapli = int(data.get('tem_men1_dosi_bcgp', 0)) + \
            int(data.get('tem_men1_dosi_bcgd', 0))
        des_hbpe_dosapli = int(data.get('tem_men1_dosi_hbpr', 0))
        des_rota_dosapli = int(data.get('tem_men1_1rad_rota', 0)) + \
            int(data.get('tem_men1_2dad_rota', 0))
        des_pent_dosapli = int(data.get('tem_men1_1rad_pent', 0)) + int(
            data.get('tem_men1_2dad_pent', 0)) + int(data.get('tem_men1_3rad_pent', 0))
        des_fipv_dosapli = int(data.get('tem_men1_1rad_fipv', 0)) + \
            int(data.get('tem_men1_2dad_fipv', 0))
        des_anti_dosapli = int(data.get('tem_men1_3rad_bopv', 0)) + int(
            data.get('tem_12a23m_4tad_bopv', 0)) + int(data.get('tem_5ano_5tad_bopv', 0))
        des_neum_dosapli = int(data.get('tem_men1_1rad_neum', 0)) + int(
            data.get('tem_men1_2dad_neum', 0)) + int(data.get('tem_men1_3rad_neum', 0))
        des_srp_dosapli = int(data.get('tem_12a23m_1rad_srp', 0)) + \
            int(data.get('tem_12a23m_2dad_srp', 0))
        des_vari_dosapli = int(data.get('tem_12a23m_dosi_vari', 0))
        des_fieb_dosapli = int(data.get('tem_12a23m_dosi_fa', 0))
        des_dift_dosapli = int(
            data.get('tem_12a23m_4tad_dpt', 0)) + int(data.get('tem_5ano_5tad_dpt', 0))
        des_hpv_dosapli = int(data.get('tem_9ano_1rad_hpv', 0)) + int(
            data.get('tem_9ano_2dad_hpv', 0)) + int(data.get('tem_10an_2dad_hpv', 0))
        des_dtad_dosapli = int(data.get('tem_15an_terc_dtad', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_dosapli = int(data.get('des_sr_dosapli', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_dosapli = int(data.get('des_hepa_dosapli', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_dosapli = int(data.get('des_inmant_dosapli', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_dosapli = int(data.get('des_inmanthepb_dosapli', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_dosapli = int(data.get('des_inmantrra_dosapli', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('des_infped_dosapli', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('des_infadu_dosapli', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli += des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi += des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi += des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli += des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi += des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi += des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli += des_rota_dosapli
            existing_record.des_rota_pervacenfabi += des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi += des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli += des_pent_dosapli
            existing_record.des_pent_pervacenfabi += des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi += des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli += des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi += des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi += des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli += des_anti_dosapli
            existing_record.des_anti_pervacenfabi += des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi += des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli += des_neum_dosapli
            existing_record.des_neum_pervacenfabi += des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi += des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli += des_sr_dosapli
            existing_record.des_sr_pervacenfabi += des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi += des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli += des_srp_dosapli
            existing_record.des_srp_pervacenfabi += des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi += des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli += des_vari_dosapli
            existing_record.des_vari_pervacenfabi += des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi += des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli += des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi += des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi += des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli += des_dift_dosapli
            existing_record.des_dift_pervacenfabi += des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi += des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli += des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi += des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi += des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli += des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi += des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi += des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli += des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi += des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi += des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli += des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi += des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi += des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli += des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi += des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi += des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli += des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi += des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi += des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli += des_infped_dosapli
            existing_record.des_infped_pervacenfabi += des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi += des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli += des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi += des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi += des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli += des_viru_dosapli
            existing_record.des_viru_pervacenfabi += des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi += des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli += des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi += des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi += des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli += des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi += des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi += des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli += des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi += des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi += des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli += des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi += des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi += des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tem_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Create_Correcto}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch'], url_path='actualizar-temprano')
    def update_temprano(self, request, pk=None):
        data = request.data
        tem_fech = parse_date(data.get('tem_fech'))
        eni_user_id = data.get('eniUser')

        # Obtener la instancia existente
        instance = self.get_object()

        # Actualizar la instancia con los nuevos datos
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Crear variables de control
        fech_inicio = tem_fech.replace(day=1)
        fech_fin = (tem_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde tem_tota es False
        registros_mes = temprano.objects.filter(
            tem_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, tem_tota=False
        )
        sum_totals = registros_mes.aggregate(
            tem_intr=Sum('tem_intr'),
            tem_extr_mies_cnh=Sum('tem_extr_mies_cnh'),
            tem_extr_mies_cibv=Sum('tem_extr_mies_cibv'),
            tem_extr_mine_egen=Sum('tem_extr_mine_egen'),
            tem_extr_mine_bach=Sum('tem_extr_mine_bach'),
            tem_extr_visi=Sum('tem_extr_visi'),
            tem_extr_aten=Sum('tem_extr_aten'),
            tem_otro=Sum('tem_otro'),
            tem_sexo_homb=Sum('tem_sexo_homb'),
            tem_sexo_muje=Sum('tem_sexo_muje'),
            tem_luga_pert=Sum('tem_luga_pert'),
            tem_luga_nope=Sum('tem_luga_nope'),
            tem_naci_ecua=Sum('tem_naci_ecua'),
            tem_naci_colo=Sum('tem_naci_colo'),
            tem_naci_peru=Sum('tem_naci_peru'),
            tem_naci_cuba=Sum('tem_naci_cuba'),
            tem_naci_vene=Sum('tem_naci_vene'),
            tem_naci_otro=Sum('tem_naci_otro'),
            tem_auto_indi=Sum('tem_auto_indi'),
            tem_auto_afro=Sum('tem_auto_afro'),
            tem_auto_negr=Sum('tem_auto_negr'),
            tem_auto_mula=Sum('tem_auto_mula'),
            tem_auto_mont=Sum('tem_auto_mont'),
            tem_auto_mest=Sum('tem_auto_mest'),
            tem_auto_blan=Sum('tem_auto_blan'),
            tem_auto_otro=Sum('tem_auto_otro'),
            tem_naci_achu=Sum('tem_naci_achu'),
            tem_naci_ando=Sum('tem_naci_ando'),
            tem_naci_awa=Sum('tem_naci_awa'),
            tem_naci_chac=Sum('tem_naci_chac'),
            tem_naci_cofa=Sum('tem_naci_cofa'),
            tem_naci_eper=Sum('tem_naci_eper'),
            tem_naci_huan=Sum('tem_naci_huan'),
            tem_naci_kich=Sum('tem_naci_kich'),
            tem_naci_mant=Sum('tem_naci_mant'),
            tem_naci_seco=Sum('tem_naci_seco'),
            tem_naci_shiw=Sum('tem_naci_shiw'),
            tem_naci_shua=Sum('tem_naci_shua'),
            tem_naci_sion=Sum('tem_naci_sion'),
            tem_naci_tsac=Sum('tem_naci_tsac'),
            tem_naci_waor=Sum('tem_naci_waor'),
            tem_naci_zapa=Sum('tem_naci_zapa'),
            tem_pueb_chib=Sum('tem_pueb_chib'),
            tem_pueb_kana=Sum('tem_pueb_kana'),
            tem_pueb_kara=Sum('tem_pueb_kara'),
            tem_pueb_kaya=Sum('tem_pueb_kaya'),
            tem_pueb_kich=Sum('tem_pueb_kich'),
            tem_pueb_kisa=Sum('tem_pueb_kisa'),
            tem_pueb_kitu=Sum('tem_pueb_kitu'),
            tem_pueb_nata=Sum('tem_pueb_nata'),
            tem_pueb_otav=Sum('tem_pueb_otav'),
            tem_pueb_palt=Sum('tem_pueb_palt'),
            tem_pueb_panz=Sum('tem_pueb_panz'),
            tem_pueb_past=Sum('tem_pueb_past'),
            tem_pueb_puru=Sum('tem_pueb_puru'),
            tem_pueb_sala=Sum('tem_pueb_sala'),
            tem_pueb_sara=Sum('tem_pueb_sara'),
            tem_pueb_toma=Sum('tem_pueb_toma'),
            tem_pueb_wara=Sum('tem_pueb_wara'),
            tem_men1_dosi_bcgp=Sum('tem_men1_dosi_bcgp'),
            tem_men1_dosi_hbpr=Sum('tem_men1_dosi_hbpr'),
            tem_men1_dosi_bcgd=Sum('tem_men1_dosi_bcgd'),
            tem_men1_1rad_rota=Sum('tem_men1_1rad_rota'),
            tem_men1_1rad_fipv=Sum('tem_men1_1rad_fipv'),
            tem_men1_1rad_neum=Sum('tem_men1_1rad_neum'),
            tem_men1_1rad_pent=Sum('tem_men1_1rad_pent'),
            tem_men1_2dad_rota=Sum('tem_men1_2dad_rota'),
            tem_men1_2dad_fipv=Sum('tem_men1_2dad_fipv'),
            tem_men1_2dad_neum=Sum('tem_men1_2dad_neum'),
            tem_men1_2dad_pent=Sum('tem_men1_2dad_pent'),
            tem_men1_3rad_bopv=Sum('tem_men1_3rad_bopv'),
            tem_men1_3rad_neum=Sum('tem_men1_3rad_neum'),
            tem_men1_3rad_pent=Sum('tem_men1_3rad_pent'),
            tem_12a23m_1rad_srp=Sum('tem_12a23m_1rad_srp'),
            tem_12a23m_dosi_fa=Sum('tem_12a23m_dosi_fa'),
            tem_12a23m_dosi_vari=Sum('tem_12a23m_dosi_vari'),
            tem_12a23m_2dad_srp=Sum('tem_12a23m_2dad_srp'),
            tem_12a23m_4tad_bopv=Sum('tem_12a23m_4tad_bopv'),
            tem_12a23m_4tad_dpt=Sum('tem_12a23m_4tad_dpt'),
            tem_5ano_5tad_bopv=Sum('tem_5ano_5tad_bopv'),
            tem_5ano_5tad_dpt=Sum('tem_5ano_5tad_dpt'),
            tem_9ano_1rad_hpv=Sum('tem_9ano_1rad_hpv'),
            tem_9ano_2dad_hpv=Sum('tem_9ano_2dad_hpv'),
            tem_10an_2dad_hpv=Sum('tem_10an_2dad_hpv'),
            tem_15an_terc_dtad=Sum('tem_15an_terc_dtad')
        )

        # Actualizar o crear el registro total_record como en create_temprano
        total_record = temprano.objects.filter(
            eniUser_id=eni_user_id, tem_fech=fech_fin, tem_tota=True
        ).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.tem_intr = sum_totals['tem_intr'] or 0
            total_record.tem_extr_mies_cnh = sum_totals['tem_extr_mies_cnh'] or 0
            total_record.tem_extr_mies_cibv = sum_totals['tem_extr_mies_cibv'] or 0
            total_record.tem_extr_mine_egen = sum_totals['tem_extr_mine_egen'] or 0
            total_record.tem_extr_mine_bach = sum_totals['tem_extr_mine_bach'] or 0
            total_record.tem_extr_visi = sum_totals['tem_extr_visi'] or 0
            total_record.tem_extr_aten = sum_totals['tem_extr_aten'] or 0
            total_record.tem_otro = sum_totals['tem_otro'] or 0
            total_record.tem_sexo_homb = sum_totals['tem_sexo_homb'] or 0
            total_record.tem_sexo_muje = sum_totals['tem_sexo_muje'] or 0
            total_record.tem_luga_pert = sum_totals['tem_luga_pert'] or 0
            total_record.tem_luga_nope = sum_totals['tem_luga_nope'] or 0
            total_record.tem_naci_ecua = sum_totals['tem_naci_ecua'] or 0
            total_record.tem_naci_colo = sum_totals['tem_naci_colo'] or 0
            total_record.tem_naci_peru = sum_totals['tem_naci_peru'] or 0
            total_record.tem_naci_cuba = sum_totals['tem_naci_cuba'] or 0
            total_record.tem_naci_vene = sum_totals['tem_naci_vene'] or 0
            total_record.tem_naci_otro = sum_totals['tem_naci_otro'] or 0
            total_record.tem_auto_indi = sum_totals['tem_auto_indi'] or 0
            total_record.tem_auto_afro = sum_totals['tem_auto_afro'] or 0
            total_record.tem_auto_negr = sum_totals['tem_auto_negr'] or 0
            total_record.tem_auto_mula = sum_totals['tem_auto_mula'] or 0
            total_record.tem_auto_mont = sum_totals['tem_auto_mont'] or 0
            total_record.tem_auto_mest = sum_totals['tem_auto_mest'] or 0
            total_record.tem_auto_blan = sum_totals['tem_auto_blan'] or 0
            total_record.tem_auto_otro = sum_totals['tem_auto_otro'] or 0
            total_record.tem_naci_achu = sum_totals['tem_naci_achu'] or 0
            total_record.tem_naci_ando = sum_totals['tem_naci_ando'] or 0
            total_record.tem_naci_awa = sum_totals['tem_naci_awa'] or 0
            total_record.tem_naci_chac = sum_totals['tem_naci_chac'] or 0
            total_record.tem_naci_cofa = sum_totals['tem_naci_cofa'] or 0
            total_record.tem_naci_eper = sum_totals['tem_naci_eper'] or 0
            total_record.tem_naci_huan = sum_totals['tem_naci_huan'] or 0
            total_record.tem_naci_kich = sum_totals['tem_naci_kich'] or 0
            total_record.tem_naci_mant = sum_totals['tem_naci_mant'] or 0
            total_record.tem_naci_seco = sum_totals['tem_naci_seco'] or 0
            total_record.tem_naci_shiw = sum_totals['tem_naci_shiw'] or 0
            total_record.tem_naci_shua = sum_totals['tem_naci_shua'] or 0
            total_record.tem_naci_sion = sum_totals['tem_naci_sion'] or 0
            total_record.tem_naci_tsac = sum_totals['tem_naci_tsac'] or 0
            total_record.tem_naci_waor = sum_totals['tem_naci_waor'] or 0
            total_record.tem_naci_zapa = sum_totals['tem_naci_zapa'] or 0
            total_record.tem_pueb_chib = sum_totals['tem_pueb_chib'] or 0
            total_record.tem_pueb_kana = sum_totals['tem_pueb_kana'] or 0
            total_record.tem_pueb_kara = sum_totals['tem_pueb_kara'] or 0
            total_record.tem_pueb_kaya = sum_totals['tem_pueb_kaya'] or 0
            total_record.tem_pueb_kich = sum_totals['tem_pueb_kich'] or 0
            total_record.tem_pueb_kisa = sum_totals['tem_pueb_kisa'] or 0
            total_record.tem_pueb_kitu = sum_totals['tem_pueb_kitu'] or 0
            total_record.tem_pueb_nata = sum_totals['tem_pueb_nata'] or 0
            total_record.tem_pueb_otav = sum_totals['tem_pueb_otav'] or 0
            total_record.tem_pueb_palt = sum_totals['tem_pueb_palt'] or 0
            total_record.tem_pueb_panz = sum_totals['tem_pueb_panz'] or 0
            total_record.tem_pueb_past = sum_totals['tem_pueb_past'] or 0
            total_record.tem_pueb_puru = sum_totals['tem_pueb_puru'] or 0
            total_record.tem_pueb_sala = sum_totals['tem_pueb_sala'] or 0
            total_record.tem_pueb_sara = sum_totals['tem_pueb_sara'] or 0
            total_record.tem_pueb_toma = sum_totals['tem_pueb_toma'] or 0
            total_record.tem_pueb_wara = sum_totals['tem_pueb_wara'] or 0
            total_record.tem_men1_dosi_bcgp = sum_totals['tem_men1_dosi_bcgp'] or 0
            total_record.tem_men1_dosi_hbpr = sum_totals['tem_men1_dosi_hbpr'] or 0
            total_record.tem_men1_dosi_bcgd = sum_totals['tem_men1_dosi_bcgd'] or 0
            total_record.tem_men1_1rad_rota = sum_totals['tem_men1_1rad_rota'] or 0
            total_record.tem_men1_1rad_fipv = sum_totals['tem_men1_1rad_fipv'] or 0
            total_record.tem_men1_1rad_neum = sum_totals['tem_men1_1rad_neum'] or 0
            total_record.tem_men1_1rad_pent = sum_totals['tem_men1_1rad_pent'] or 0
            total_record.tem_men1_2dad_rota = sum_totals['tem_men1_2dad_rota'] or 0
            total_record.tem_men1_2dad_fipv = sum_totals['tem_men1_2dad_fipv'] or 0
            total_record.tem_men1_2dad_neum = sum_totals['tem_men1_2dad_neum'] or 0
            total_record.tem_men1_2dad_pent = sum_totals['tem_men1_2dad_pent'] or 0
            total_record.tem_men1_3rad_bopv = sum_totals['tem_men1_3rad_bopv'] or 0
            total_record.tem_men1_3rad_neum = sum_totals['tem_men1_3rad_neum'] or 0
            total_record.tem_men1_3rad_pent = sum_totals['tem_men1_3rad_pent'] or 0
            total_record.tem_12a23m_1rad_srp = sum_totals['tem_12a23m_1rad_srp'] or 0
            total_record.tem_12a23m_dosi_fa = sum_totals['tem_12a23m_dosi_fa'] or 0
            total_record.tem_12a23m_dosi_vari = sum_totals['tem_12a23m_dosi_vari'] or 0
            total_record.tem_12a23m_2dad_srp = sum_totals['tem_12a23m_2dad_srp'] or 0
            total_record.tem_12a23m_4tad_bopv = sum_totals['tem_12a23m_4tad_bopv'] or 0
            total_record.tem_12a23m_4tad_dpt = sum_totals['tem_12a23m_4tad_dpt'] or 0
            total_record.tem_5ano_5tad_bopv = sum_totals['tem_5ano_5tad_bopv'] or 0
            total_record.tem_5ano_5tad_dpt = sum_totals['tem_5ano_5tad_dpt'] or 0
            total_record.tem_9ano_1rad_hpv = sum_totals['tem_9ano_1rad_hpv'] or 0
            total_record.tem_9ano_2dad_hpv = sum_totals['tem_9ano_2dad_hpv'] or 0
            total_record.tem_10an_2dad_hpv = sum_totals['tem_10an_2dad_hpv'] or 0
            total_record.tem_15an_terc_dtad = sum_totals['tem_15an_terc_dtad'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            temprano.objects.create(
                tem_fech=fech_fin,
                eniUser_id=eni_user_id,
                tem_tota=True,
                tem_intr=sum_totals['tem_intr'] or 0,
                tem_extr_mies_cnh=sum_totals['tem_extr_mies_cnh'] or 0,
                tem_extr_mies_cibv=sum_totals['tem_extr_mies_cibv'] or 0,
                tem_extr_mine_egen=sum_totals['tem_extr_mine_egen'] or 0,
                tem_extr_mine_bach=sum_totals['tem_extr_mine_bach'] or 0,
                tem_extr_visi=sum_totals['tem_extr_visi'] or 0,
                tem_extr_aten=sum_totals['tem_extr_aten'] or 0,
                tem_otro=sum_totals['tem_otro'] or 0,
                tem_sexo_homb=sum_totals['tem_sexo_homb'] or 0,
                tem_sexo_muje=sum_totals['tem_sexo_muje'] or 0,
                tem_luga_pert=sum_totals['tem_luga_pert'] or 0,
                tem_luga_nope=sum_totals['tem_luga_nope'] or 0,
                tem_naci_ecua=sum_totals['tem_naci_ecua'] or 0,
                tem_naci_colo=sum_totals['tem_naci_colo'] or 0,
                tem_naci_peru=sum_totals['tem_naci_peru'] or 0,
                tem_naci_cuba=sum_totals['tem_naci_cuba'] or 0,
                tem_naci_vene=sum_totals['tem_naci_vene'] or 0,
                tem_naci_otro=sum_totals['tem_naci_otro'] or 0,
                tem_auto_indi=sum_totals['tem_auto_indi'] or 0,
                tem_auto_afro=sum_totals['tem_auto_afro'] or 0,
                tem_auto_negr=sum_totals['tem_auto_negr'] or 0,
                tem_auto_mula=sum_totals['tem_auto_mula'] or 0,
                tem_auto_mont=sum_totals['tem_auto_mont'] or 0,
                tem_auto_mest=sum_totals['tem_auto_mest'] or 0,
                tem_auto_blan=sum_totals['tem_auto_blan'] or 0,
                tem_auto_otro=sum_totals['tem_auto_otro'] or 0,
                tem_naci_achu=sum_totals['tem_naci_achu'] or 0,
                tem_naci_ando=sum_totals['tem_naci_ando'] or 0,
                tem_naci_awa=sum_totals['tem_naci_awa'] or 0,
                tem_naci_chac=sum_totals['tem_naci_chac'] or 0,
                tem_naci_cofa=sum_totals['tem_naci_cofa'] or 0,
                tem_naci_eper=sum_totals['tem_naci_eper'] or 0,
                tem_naci_huan=sum_totals['tem_naci_huan'] or 0,
                tem_naci_kich=sum_totals['tem_naci_kich'] or 0,
                tem_naci_mant=sum_totals['tem_naci_mant'] or 0,
                tem_naci_seco=sum_totals['tem_naci_seco'] or 0,
                tem_naci_shiw=sum_totals['tem_naci_shiw'] or 0,
                tem_naci_shua=sum_totals['tem_naci_shua'] or 0,
                tem_naci_sion=sum_totals['tem_naci_sion'] or 0,
                tem_naci_tsac=sum_totals['tem_naci_tsac'] or 0,
                tem_naci_waor=sum_totals['tem_naci_waor'] or 0,
                tem_naci_zapa=sum_totals['tem_naci_zapa'] or 0,
                tem_pueb_chib=sum_totals['tem_pueb_chib'] or 0,
                tem_pueb_kana=sum_totals['tem_pueb_kana'] or 0,
                tem_pueb_kara=sum_totals['tem_pueb_kara'] or 0,
                tem_pueb_kaya=sum_totals['tem_pueb_kaya'] or 0,
                tem_pueb_kich=sum_totals['tem_pueb_kich'] or 0,
                tem_pueb_kisa=sum_totals['tem_pueb_kisa'] or 0,
                tem_pueb_kitu=sum_totals['tem_pueb_kitu'] or 0,
                tem_pueb_nata=sum_totals['tem_pueb_nata'] or 0,
                tem_pueb_otav=sum_totals['tem_pueb_otav'] or 0,
                tem_pueb_palt=sum_totals['tem_pueb_palt'] or 0,
                tem_pueb_panz=sum_totals['tem_pueb_panz'] or 0,
                tem_pueb_past=sum_totals['tem_pueb_past'] or 0,
                tem_pueb_puru=sum_totals['tem_pueb_puru'] or 0,
                tem_pueb_sala=sum_totals['tem_pueb_sala'] or 0,
                tem_pueb_sara=sum_totals['tem_pueb_sara'] or 0,
                tem_pueb_toma=sum_totals['tem_pueb_toma'] or 0,
                tem_pueb_wara=sum_totals['tem_pueb_wara'] or 0,
                tem_men1_dosi_bcgp=sum_totals['tem_men1_dosi_bcgp'] or 0,
                tem_men1_dosi_hbpr=sum_totals['tem_men1_dosi_hbpr'] or 0,
                tem_men1_dosi_bcgd=sum_totals['tem_men1_dosi_bcgd'] or 0,
                tem_men1_1rad_rota=sum_totals['tem_men1_1rad_rota'] or 0,
                tem_men1_1rad_fipv=sum_totals['tem_men1_1rad_fipv'] or 0,
                tem_men1_1rad_neum=sum_totals['tem_men1_1rad_neum'] or 0,
                tem_men1_1rad_pent=sum_totals['tem_men1_1rad_pent'] or 0,
                tem_men1_2dad_rota=sum_totals['tem_men1_2dad_rota'] or 0,
                tem_men1_2dad_fipv=sum_totals['tem_men1_2dad_fipv'] or 0,
                tem_men1_2dad_neum=sum_totals['tem_men1_2dad_neum'] or 0,
                tem_men1_2dad_pent=sum_totals['tem_men1_2dad_pent'] or 0,
                tem_men1_3rad_bopv=sum_totals['tem_men1_3rad_bopv'] or 0,
                tem_men1_3rad_neum=sum_totals['tem_men1_3rad_neum'] or 0,
                tem_men1_3rad_pent=sum_totals['tem_men1_3rad_pent'] or 0,
                tem_12a23m_1rad_srp=sum_totals['tem_12a23m_1rad_srp'] or 0,
                tem_12a23m_dosi_fa=sum_totals['tem_12a23m_dosi_fa'] or 0,
                tem_12a23m_dosi_vari=sum_totals['tem_12a23m_dosi_vari'] or 0,
                tem_12a23m_2dad_srp=sum_totals['tem_12a23m_2dad_srp'] or 0,
                tem_12a23m_4tad_bopv=sum_totals['tem_12a23m_4tad_bopv'] or 0,
                tem_12a23m_4tad_dpt=sum_totals['tem_12a23m_4tad_dpt'] or 0,
                tem_5ano_5tad_bopv=sum_totals['tem_5ano_5tad_bopv'] or 0,
                tem_5ano_5tad_dpt=sum_totals['tem_5ano_5tad_dpt'] or 0,
                tem_9ano_1rad_hpv=sum_totals['tem_9ano_1rad_hpv'] or 0,
                tem_9ano_2dad_hpv=sum_totals['tem_9ano_2dad_hpv'] or 0,
                tem_10an_2dad_hpv=sum_totals['tem_10an_2dad_hpv'] or 0,
                tem_15an_terc_dtad=sum_totals['tem_15an_terc_dtad'] or 0
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tem_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las valores de las variables de Temprano y Desperdicio
        des_bcg_dosapli = int(data.get('tem_men1_dosi_bcgp', 0)) + \
            int(data.get('tem_men1_dosi_bcgd', 0))
        des_hbpe_dosapli = int(data.get('tem_men1_dosi_hbpr', 0))
        des_rota_dosapli = int(data.get('tem_men1_1rad_rota', 0)) + \
            int(data.get('tem_men1_2dad_rota', 0))
        des_pent_dosapli = int(data.get('tem_men1_1rad_pent', 0)) + int(
            data.get('tem_men1_2dad_pent', 0)) + int(data.get('tem_men1_3rad_pent', 0))
        des_fipv_dosapli = int(data.get('tem_men1_1rad_fipv', 0)) + \
            int(data.get('tem_men1_2dad_fipv', 0))
        des_anti_dosapli = int(data.get('tem_men1_3rad_bopv', 0)) + int(
            data.get('tem_12a23m_4tad_bopv', 0)) + int(data.get('tem_5ano_5tad_bopv', 0))
        des_neum_dosapli = int(data.get('tem_men1_1rad_neum', 0)) + int(
            data.get('tem_men1_2dad_neum', 0)) + int(data.get('tem_men1_3rad_neum', 0))
        des_srp_dosapli = int(data.get('tem_12a23m_1rad_srp', 0)) + \
            int(data.get('tem_12a23m_2dad_srp', 0))
        des_vari_dosapli = int(data.get('tem_12a23m_dosi_vari', 0))
        des_fieb_dosapli = int(data.get('tem_12a23m_dosi_fa', 0))
        des_dift_dosapli = int(
            data.get('tem_12a23m_4tad_dpt', 0)) + int(data.get('tem_5ano_5tad_dpt', 0))
        des_hpv_dosapli = int(data.get('tem_9ano_1rad_hpv', 0)) + int(
            data.get('tem_9ano_2dad_hpv', 0)) + int(data.get('tem_10an_2dad_hpv', 0))
        des_dtad_dosapli = int(data.get('tem_15an_terc_dtad', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_dosapli = int(data.get('des_sr_dosapli', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_dosapli = int(data.get('des_hepa_dosapli', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_dosapli = int(data.get('des_inmant_dosapli', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_dosapli = int(data.get('des_inmanthepb_dosapli', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_dosapli = int(data.get('des_inmantrra_dosapli', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('des_infped_dosapli', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('des_infadu_dosapli', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli = des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi = des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi = des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli = des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi = des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi = des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli = des_rota_dosapli
            existing_record.des_rota_pervacenfabi = des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi = des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli = des_pent_dosapli
            existing_record.des_pent_pervacenfabi = des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi = des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli = des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi = des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi = des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli = des_anti_dosapli
            existing_record.des_anti_pervacenfabi = des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi = des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli = des_neum_dosapli
            existing_record.des_neum_pervacenfabi = des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi = des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli = des_sr_dosapli
            existing_record.des_sr_pervacenfabi = des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi = des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli = des_srp_dosapli
            existing_record.des_srp_pervacenfabi = des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi = des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli = des_vari_dosapli
            existing_record.des_vari_pervacenfabi = des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi = des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli = des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi = des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi = des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli = des_dift_dosapli
            existing_record.des_dift_pervacenfabi = des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi = des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli = des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi = des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi = des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli = des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi = des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi = des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli = des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi = des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi = des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli = des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi = des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi = des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli = des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi = des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi = des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli = des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi = des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi = des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli = des_infped_dosapli
            existing_record.des_infped_pervacenfabi = des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi = des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli = des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi = des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi = des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli = des_viru_dosapli
            existing_record.des_viru_pervacenfabi = des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi = des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli = des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi = des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi = des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli = des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi = des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi = des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli = des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi = des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi = des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli = des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi = des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi = des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tem_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Update_Correcto, "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='eliminar-temprano')
    def delete_temprano(self, request, pk=None):
        data = request.data
        tem_fech = parse_date(data.get('tem_fech'))
        eni_user_id = data.get('eniUser')

        # Crear variables de control
        fech_inicio = tem_fech.replace(day=1)
        fech_fin = (tem_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Eliminar registros en 'temprano' donde tem_tota=False
        primeros_registros = temprano.objects.filter(
            eniUser_id=eni_user_id,
            tem_fech=tem_fech,
            tem_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros.exists():
            primer_registro = primeros_registros.first()
            primer_registro.delete()

        # Filtrar registros del mes y sumar los valores donde tem_tota es False
        registros_mes = temprano.objects.filter(
            tem_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, tem_tota=False
        )
        sum_totals = registros_mes.aggregate(
            tem_intr=Sum('tem_intr') or 0,
            tem_extr_mies_cnh=Sum('tem_extr_mies_cnh') or 0,
            tem_extr_mies_cibv=Sum('tem_extr_mies_cibv') or 0,
            tem_extr_mine_egen=Sum('tem_extr_mine_egen') or 0,
            tem_extr_mine_bach=Sum('tem_extr_mine_bach') or 0,
            tem_extr_visi=Sum('tem_extr_visi') or 0,
            tem_extr_aten=Sum('tem_extr_aten') or 0,
            tem_otro=Sum('tem_otro') or 0,
            tem_sexo_homb=Sum('tem_sexo_homb') or 0,
            tem_sexo_muje=Sum('tem_sexo_muje') or 0,
            tem_luga_pert=Sum('tem_luga_pert') or 0,
            tem_luga_nope=Sum('tem_luga_nope') or 0,
            tem_naci_ecua=Sum('tem_naci_ecua') or 0,
            tem_naci_colo=Sum('tem_naci_colo') or 0,
            tem_naci_peru=Sum('tem_naci_peru') or 0,
            tem_naci_cuba=Sum('tem_naci_cuba') or 0,
            tem_naci_vene=Sum('tem_naci_vene') or 0,
            tem_naci_otro=Sum('tem_naci_otro') or 0,
            tem_auto_indi=Sum('tem_auto_indi') or 0,
            tem_auto_afro=Sum('tem_auto_afro') or 0,
            tem_auto_negr=Sum('tem_auto_negr') or 0,
            tem_auto_mula=Sum('tem_auto_mula') or 0,
            tem_auto_mont=Sum('tem_auto_mont') or 0,
            tem_auto_mest=Sum('tem_auto_mest') or 0,
            tem_auto_blan=Sum('tem_auto_blan') or 0,
            tem_auto_otro=Sum('tem_auto_otro') or 0,
            tem_naci_achu=Sum('tem_naci_achu') or 0,
            tem_naci_ando=Sum('tem_naci_ando') or 0,
            tem_naci_awa=Sum('tem_naci_awa') or 0,
            tem_naci_chac=Sum('tem_naci_chac') or 0,
            tem_naci_cofa=Sum('tem_naci_cofa') or 0,
            tem_naci_eper=Sum('tem_naci_eper') or 0,
            tem_naci_huan=Sum('tem_naci_huan') or 0,
            tem_naci_kich=Sum('tem_naci_kich') or 0,
            tem_naci_mant=Sum('tem_naci_mant') or 0,
            tem_naci_seco=Sum('tem_naci_seco') or 0,
            tem_naci_shiw=Sum('tem_naci_shiw') or 0,
            tem_naci_shua=Sum('tem_naci_shua') or 0,
            tem_naci_sion=Sum('tem_naci_sion') or 0,
            tem_naci_tsac=Sum('tem_naci_tsac') or 0,
            tem_naci_waor=Sum('tem_naci_waor') or 0,
            tem_naci_zapa=Sum('tem_naci_zapa') or 0,
            tem_pueb_chib=Sum('tem_pueb_chib') or 0,
            tem_pueb_kana=Sum('tem_pueb_kana') or 0,
            tem_pueb_kara=Sum('tem_pueb_kara') or 0,
            tem_pueb_kaya=Sum('tem_pueb_kaya') or 0,
            tem_pueb_kich=Sum('tem_pueb_kich') or 0,
            tem_pueb_kisa=Sum('tem_pueb_kisa') or 0,
            tem_pueb_kitu=Sum('tem_pueb_kitu') or 0,
            tem_pueb_nata=Sum('tem_pueb_nata') or 0,
            tem_pueb_otav=Sum('tem_pueb_otav') or 0,
            tem_pueb_palt=Sum('tem_pueb_palt') or 0,
            tem_pueb_panz=Sum('tem_pueb_panz') or 0,
            tem_pueb_past=Sum('tem_pueb_past') or 0,
            tem_pueb_puru=Sum('tem_pueb_puru') or 0,
            tem_pueb_sala=Sum('tem_pueb_sala') or 0,
            tem_pueb_sara=Sum('tem_pueb_sara') or 0,
            tem_pueb_toma=Sum('tem_pueb_toma') or 0,
            tem_pueb_wara=Sum('tem_pueb_wara') or 0,
            tem_men1_dosi_bcgp=Sum('tem_men1_dosi_bcgp') or 0,
            tem_men1_dosi_hbpr=Sum('tem_men1_dosi_hbpr') or 0,
            tem_men1_dosi_bcgd=Sum('tem_men1_dosi_bcgd') or 0,
            tem_men1_1rad_rota=Sum('tem_men1_1rad_rota') or 0,
            tem_men1_1rad_fipv=Sum('tem_men1_1rad_fipv') or 0,
            tem_men1_1rad_neum=Sum('tem_men1_1rad_neum') or 0,
            tem_men1_1rad_pent=Sum('tem_men1_1rad_pent') or 0,
            tem_men1_2dad_rota=Sum('tem_men1_2dad_rota') or 0,
            tem_men1_2dad_fipv=Sum('tem_men1_2dad_fipv') or 0,
            tem_men1_2dad_neum=Sum('tem_men1_2dad_neum') or 0,
            tem_men1_2dad_pent=Sum('tem_men1_2dad_pent') or 0,
            tem_men1_3rad_bopv=Sum('tem_men1_3rad_bopv') or 0,
            tem_men1_3rad_neum=Sum('tem_men1_3rad_neum') or 0,
            tem_men1_3rad_pent=Sum('tem_men1_3rad_pent') or 0,
            tem_12a23m_1rad_srp=Sum('tem_12a23m_1rad_srp') or 0,
            tem_12a23m_dosi_fa=Sum('tem_12a23m_dosi_fa') or 0,
            tem_12a23m_dosi_vari=Sum('tem_12a23m_dosi_vari') or 0,
            tem_12a23m_2dad_srp=Sum('tem_12a23m_2dad_srp') or 0,
            tem_12a23m_4tad_bopv=Sum('tem_12a23m_4tad_bopv') or 0,
            tem_12a23m_4tad_dpt=Sum('tem_12a23m_4tad_dpt') or 0,
            tem_5ano_5tad_bopv=Sum('tem_5ano_5tad_bopv') or 0,
            tem_5ano_5tad_dpt=Sum('tem_5ano_5tad_dpt') or 0,
            tem_9ano_1rad_hpv=Sum('tem_9ano_1rad_hpv') or 0,
            tem_9ano_2dad_hpv=Sum('tem_9ano_2dad_hpv') or 0,
            tem_10an_2dad_hpv=Sum('tem_10an_2dad_hpv') or 0,
            tem_15an_terc_dtad=Sum('tem_15an_terc_dtad') or 0
        )
        sum_totals = {k: v if v is not None else 0 for k,
                      v in sum_totals.items()}

        # Actualizar o crear el registro total en 'temprano'
        _, created = temprano.objects.update_or_create(
            eniUser_id=eni_user_id,
            tem_fech=fech_fin,
            tem_tota=True,
            defaults=sum_totals
        )

        # Eliminar registros en 'desperdicio' donde des_tota=False
        primeros_registros_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech=tem_fech,
            des_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros_des.exists():
            primer_registro_des = primeros_registros_des.first()
            primer_registro_des.delete()

        # Recalcular los totales en 'desperdicio' para el mes
        registros_mes_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=False
        )

        sum_totals_des = registros_mes_des.aggregate(
            des_bcg_dosapli=Sum('des_bcg_dosapli') or 0,
            des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi') or 0,
            des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi') or 0,
            des_hbpe_dosapli=Sum('des_hbpe_dosapli') or 0,
            des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi') or 0,
            des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi') or 0,
            des_rota_dosapli=Sum('des_rota_dosapli') or 0,
            des_rota_pervacenfabi=Sum('des_rota_pervacenfabi') or 0,
            des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi') or 0,
            des_pent_dosapli=Sum('des_pent_dosapli') or 0,
            des_pent_pervacenfabi=Sum('des_pent_pervacenfabi') or 0,
            des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi') or 0,
            des_fipv_dosapli=Sum('des_fipv_dosapli') or 0,
            des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi') or 0,
            des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi') or 0,
            des_anti_dosapli=Sum('des_anti_dosapli') or 0,
            des_anti_pervacenfabi=Sum('des_anti_pervacenfabi') or 0,
            des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi') or 0,
            des_neum_dosapli=Sum('des_neum_dosapli') or 0,
            des_neum_pervacenfabi=Sum('des_neum_pervacenfabi') or 0,
            des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi') or 0,
            des_sr_dosapli=Sum('des_sr_dosapli') or 0,
            des_sr_pervacenfabi=Sum('des_sr_pervacenfabi') or 0,
            des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi') or 0,
            des_srp_dosapli=Sum('des_srp_dosapli') or 0,
            des_srp_pervacenfabi=Sum('des_srp_pervacenfabi') or 0,
            des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi') or 0,
            des_vari_dosapli=Sum('des_vari_dosapli') or 0,
            des_vari_pervacenfabi=Sum('des_vari_pervacenfabi') or 0,
            des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi') or 0,
            des_fieb_dosapli=Sum('des_fieb_dosapli') or 0,
            des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi') or 0,
            des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi') or 0,
            des_dift_dosapli=Sum('des_dift_dosapli') or 0,
            des_dift_pervacenfabi=Sum('des_dift_pervacenfabi') or 0,
            des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi') or 0,
            des_hpv_dosapli=Sum('des_hpv_dosapli') or 0,
            des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi') or 0,
            des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi') or 0,
            des_dtad_dosapli=Sum('des_dtad_dosapli') or 0,
            des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi') or 0,
            des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi') or 0,
            des_hepa_dosapli=Sum('des_hepa_dosapli') or 0,
            des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi') or 0,
            des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi') or 0,
            des_inmant_dosapli=Sum('des_inmant_dosapli') or 0,
            des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi') or 0,
            des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi') or 0,
            des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli') or 0,
            des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi') or 0,
            des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi') or 0,
            des_inmantrra_dosapli=Sum('des_inmantrra_dosapli') or 0,
            des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi') or 0,
            des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi') or 0,
            des_infped_dosapli=Sum('des_infped_dosapli') or 0,
            des_infped_pervacenfabi=Sum('des_infped_pervacenfabi') or 0,
            des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi') or 0,
            des_infadu_dosapli=Sum('des_infadu_dosapli') or 0,
            des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi') or 0,
            des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi') or 0,
            des_viru_dosapli=Sum('des_viru_dosapli') or 0,
            des_viru_pervacenfabi=Sum('des_viru_pervacenfabi') or 0,
            des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi') or 0,
            des_vacsin_dosapli=Sum('des_vacsin_dosapli') or 0,
            des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi') or 0,
            des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi') or 0,
            des_vacpfi_dosapli=Sum('des_vacpfi_dosapli') or 0,
            des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi') or 0,
            des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi') or 0,
            des_vacmod_dosapli=Sum('des_vacmod_dosapli') or 0,
            des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi') or 0,
            des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi') or 0,
            des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli') or 0,
            des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi') or 0,
            des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi') or 0,
        )
        sum_totals_des = {k: v if v is not None else 0 for k,
                          v in sum_totals_des.items()}

        # Actualizar o crear el registro total en 'desperdicio'
        _, created = desperdicio.objects.update_or_create(
            eniUser_id=eni_user_id,
            des_fech=fech_fin,
            des_tota=True,
            defaults=sum_totals_des
        )

        return Response({"message": Dato_Delete_Correcto}, status=status.HTTP_200_OK)


class TardioRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = TardioRegistrationSerializer
    queryset = tardio.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                tar_fech__year=year, tar_fech__month=month)

        return queryset.order_by('tar_fech')

    @action(detail=False, methods=['post'], url_path='crear-tardio')
    def create_tardio(self, request, *args, **kwargs):
        data = request.data
        tar_fech = parse_date(data.get('tar_fech'))
        eni_user_id = data.get('eniUser')

        # Verificar si ya existe un registro con las mismas variables
        if tardio.objects.filter(eniUser_id=eni_user_id, tar_fech=tar_fech, tar_tota=False).exists():
            return Response({"error": Error_Fecha_Registrada}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Crear variables de control
        fech_inicio = tar_fech.replace(day=1)
        fech_fin = (tar_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde tem_tota es False
        registros_mes = tardio.objects.filter(
            tar_fech__range=(fech_inicio, fech_fin), eniUser_id=eni_user_id, tar_tota=False)
        sum_totals = registros_mes.aggregate(
            tar_intr=Sum('tar_intr'),
            tar_extr_mies_cnh=Sum('tar_extr_mies_cnh'),
            tar_extr_mies_cibv=Sum('tar_extr_mies_cibv'),
            tar_extr_mine_egen=Sum('tar_extr_mine_egen'),
            tar_extr_mine_bach=Sum('tar_extr_mine_bach'),
            tar_extr_visi=Sum('tar_extr_visi'),
            tar_extr_aten=Sum('tar_extr_aten'),
            tar_otro=Sum('tar_otro'),
            tar_sexo_homb=Sum('tar_sexo_homb'),
            tar_sexo_muje=Sum('tar_sexo_muje'),
            tar_luga_pert=Sum('tar_luga_pert'),
            tar_luga_nope=Sum('tar_luga_nope'),
            tar_naci_ecua=Sum('tar_naci_ecua'),
            tar_naci_colo=Sum('tar_naci_colo'),
            tar_naci_peru=Sum('tar_naci_peru'),
            tar_naci_cuba=Sum('tar_naci_cuba'),
            tar_naci_vene=Sum('tar_naci_vene'),
            tar_naci_otro=Sum('tar_naci_otro'),
            tar_auto_indi=Sum('tar_auto_indi'),
            tar_auto_afro=Sum('tar_auto_afro'),
            tar_auto_negr=Sum('tar_auto_negr'),
            tar_auto_mula=Sum('tar_auto_mula'),
            tar_auto_mont=Sum('tar_auto_mont'),
            tar_auto_mest=Sum('tar_auto_mest'),
            tar_auto_blan=Sum('tar_auto_blan'),
            tar_auto_otro=Sum('tar_auto_otro'),
            tar_naci_achu=Sum('tar_naci_achu'),
            tar_naci_ando=Sum('tar_naci_ando'),
            tar_naci_awa=Sum('tar_naci_awa'),
            tar_naci_chac=Sum('tar_naci_chac'),
            tar_naci_cofa=Sum('tar_naci_cofa'),
            tar_naci_eper=Sum('tar_naci_eper'),
            tar_naci_huan=Sum('tar_naci_huan'),
            tar_naci_kich=Sum('tar_naci_kich'),
            tar_naci_mant=Sum('tar_naci_mant'),
            tar_naci_seco=Sum('tar_naci_seco'),
            tar_naci_shiw=Sum('tar_naci_shiw'),
            tar_naci_shua=Sum('tar_naci_shua'),
            tar_naci_sion=Sum('tar_naci_sion'),
            tar_naci_tsac=Sum('tar_naci_tsac'),
            tar_naci_waor=Sum('tar_naci_waor'),
            tar_naci_zapa=Sum('tar_naci_zapa'),
            tar_pueb_chib=Sum('tar_pueb_chib'),
            tar_pueb_kana=Sum('tar_pueb_kana'),
            tar_pueb_kara=Sum('tar_pueb_kara'),
            tar_pueb_kaya=Sum('tar_pueb_kaya'),
            tar_pueb_kich=Sum('tar_pueb_kich'),
            tar_pueb_kisa=Sum('tar_pueb_kisa'),
            tar_pueb_kitu=Sum('tar_pueb_kitu'),
            tar_pueb_nata=Sum('tar_pueb_nata'),
            tar_pueb_otav=Sum('tar_pueb_otav'),
            tar_pueb_palt=Sum('tar_pueb_palt'),
            tar_pueb_panz=Sum('tar_pueb_panz'),
            tar_pueb_past=Sum('tar_pueb_past'),
            tar_pueb_puru=Sum('tar_pueb_puru'),
            tar_pueb_sala=Sum('tar_pueb_sala'),
            tar_pueb_sara=Sum('tar_pueb_sara'),
            tar_pueb_toma=Sum('tar_pueb_toma'),
            tar_pueb_wara=Sum('tar_pueb_wara'),
            tar_1ano_1rad_fipv=Sum('tar_1ano_1rad_fipv'),
            tar_1ano_1rad_hbpe=Sum('tar_1ano_1rad_hbpe'),
            tar_1ano_1rad_dpt=Sum('tar_1ano_1rad_dpt'),
            tar_1ano_2dad_fipv=Sum('tar_1ano_2dad_fipv'),
            tar_1ano_2dad_hbpe=Sum('tar_1ano_2dad_hbpe'),
            tar_1ano_2dad_dpt=Sum('tar_1ano_2dad_dpt'),
            tar_1ano_3rad_bopv=Sum('tar_1ano_3rad_bopv'),
            tar_1ano_3rad_hbpe=Sum('tar_1ano_3rad_hbpe'),
            tar_1ano_3rad_dpt=Sum('tar_1ano_3rad_dpt'),
            tar_2ano_1rad_fipv=Sum('tar_2ano_1rad_fipv'),
            tar_2ano_1rad_srp=Sum('tar_2ano_1rad_srp'),
            tar_2ano_1rad_hbpe=Sum('tar_2ano_1rad_hbpe'),
            tar_2ano_1rad_dpt=Sum('tar_2ano_1rad_dpt'),
            tar_2ano_2dad_fipv=Sum('tar_2ano_2dad_fipv'),
            tar_2ano_2dad_srp=Sum('tar_2ano_2dad_srp'),
            tar_2ano_2dad_hbpe=Sum('tar_2ano_2dad_hbpe'),
            tar_2ano_2dad_dpt=Sum('tar_2ano_2dad_dpt'),
            tar_2ano_3rad_bopv=Sum('tar_2ano_3rad_bopv'),
            tar_2ano_3rad_hbpe=Sum('tar_2ano_3rad_hbpe'),
            tar_2ano_3rad_dpt=Sum('tar_2ano_3rad_dpt'),
            tar_2ano_4tad_bopv=Sum('tar_2ano_4tad_bopv'),
            tar_2ano_4tad_dpt=Sum('tar_2ano_4tad_dpt'),
            tar_2ano_dosi_fa=Sum('tar_2ano_dosi_fa'),
            tar_3ano_1rad_fipv=Sum('tar_3ano_1rad_fipv'),
            tar_3ano_1rad_srp=Sum('tar_3ano_1rad_srp'),
            tar_3ano_1rad_hbpe=Sum('tar_3ano_1rad_hbpe'),
            tar_3ano_1rad_dpt=Sum('tar_3ano_1rad_dpt'),
            tar_3ano_2dad_fipv=Sum('tar_3ano_2dad_fipv'),
            tar_3ano_2dad_srp=Sum('tar_3ano_2dad_srp'),
            tar_3ano_2dad_hbpe=Sum('tar_3ano_2dad_hbpe'),
            tar_3ano_2dad_dpt=Sum('tar_3ano_2dad_dpt'),
            tar_3ano_3rad_bopv=Sum('tar_3ano_3rad_bopv'),
            tar_3ano_3rad_hbpe=Sum('tar_3ano_3rad_hbpe'),
            tar_3ano_3rad_dpt=Sum('tar_3ano_3rad_dpt'),
            tar_3ano_4tad_bopv=Sum('tar_3ano_4tad_bopv'),
            tar_3ano_4tad_dpt=Sum('tar_3ano_4tad_dpt'),
            tar_3ano_dosi_fa=Sum('tar_3ano_dosi_fa'),
            tar_4ano_1rad_fipv=Sum('tar_4ano_1rad_fipv'),
            tar_4ano_1rad_srp=Sum('tar_4ano_1rad_srp'),
            tar_4ano_1rad_hbpe=Sum('tar_4ano_1rad_hbpe'),
            tar_4ano_1rad_dpt=Sum('tar_4ano_1rad_dpt'),
            tar_4ano_2dad_fipv=Sum('tar_4ano_2dad_fipv'),
            tar_4ano_2dad_srp=Sum('tar_4ano_2dad_srp'),
            tar_4ano_2dad_hbpe=Sum('tar_4ano_2dad_hbpe'),
            tar_4ano_2dad_dpt=Sum('tar_4ano_2dad_dpt'),
            tar_4ano_3rad_bopv=Sum('tar_4ano_3rad_bopv'),
            tar_4ano_3rad_hbpe=Sum('tar_4ano_3rad_hbpe'),
            tar_4ano_3rad_dpt=Sum('tar_4ano_3rad_dpt'),
            tar_4ano_4tad_bopv=Sum('tar_4ano_4tad_bopv'),
            tar_4ano_4tad_dpt=Sum('tar_4ano_4tad_dpt'),
            tar_4ano_dosi_fa=Sum('tar_4ano_dosi_fa'),
            tar_5ano_1rad_ipv=Sum('tar_5ano_1rad_ipv'),
            tar_5ano_1rad_srp=Sum('tar_5ano_1rad_srp'),
            tar_5ano_1rad_hbpe=Sum('tar_5ano_1rad_hbpe'),
            tar_5ano_1rad_dpt=Sum('tar_5ano_1rad_dpt'),
            tar_5ano_2dad_fipv=Sum('tar_5ano_2dad_fipv'),
            tar_5ano_2dad_srp=Sum('tar_5ano_2dad_srp'),
            tar_5ano_2dad_hbpe=Sum('tar_5ano_2dad_hbpe'),
            tar_5ano_2dad_dpt=Sum('tar_5ano_2dad_dpt'),
            tar_5ano_3rad_bopv=Sum('tar_5ano_3rad_bopv'),
            tar_5ano_3rad_hbpe=Sum('tar_5ano_3rad_hbpe'),
            tar_5ano_3rad_dpt=Sum('tar_5ano_3rad_dpt'),
            tar_5ano_4tad_bopv=Sum('tar_5ano_4tad_bopv'),
            tar_5ano_4tad_dpt=Sum('tar_5ano_4tad_dpt'),
            tar_5ano_dosi_fa=Sum('tar_5ano_dosi_fa'),
            tar_6ano_1rad_srp=Sum('tar_6ano_1rad_srp'),
            tar_6ano_2dad_srp=Sum('tar_6ano_2dad_srp'),
            tar_6ano_dosi_fa=Sum('tar_6ano_dosi_fa'),
            tar_7ano_1rad_sr=Sum('tar_7ano_1rad_sr'),
            tar_7ano_2dad_sr=Sum('tar_7ano_2dad_sr'),
            tar_7ano_dosi_fa=Sum('tar_7ano_dosi_fa'),
            tar_8ano_dosi_fa=Sum('tar_8ano_dosi_fa'),
            tar_7a14_dosi_dtad=Sum('tar_7a14_dosi_dtad'),
            tar_9a14_dosi_fa=Sum('tar_9a14_dosi_fa'),
            tar_15a19_dosi_fa=Sum('tar_15a19_dosi_fa'),
            tar_20a59_dosi_fa=Sum('tar_20a59_dosi_fa'),
            tar_8a14_1rad_sr=Sum('tar_8a14_1rad_sr'),
            tar_8a14_2dad_sr=Sum('tar_8a14_2dad_sr'),
            tar_15a29_1rad_sr=Sum('tar_15a29_1rad_sr'),
            tar_15a29_2dad_sr=Sum('tar_15a29_2dad_sr'),
            tar_30a50_1rad_sr=Sum('tar_30a50_1rad_sr'),
            tar_30a50_2dad_sr=Sum('tar_30a50_2dad_sr'),
            tar_16a49mefne_dtad_prim=Sum('tar_16a49mefne_dtad_prim'),
            tar_16a49mefne_dtad_segu=Sum('tar_16a49mefne_dtad_segu'),
            tar_16a49mefne_dtad_terc=Sum('tar_16a49mefne_dtad_terc'),
            tar_16a49mefne_dtad_cuar=Sum('tar_16a49mefne_dtad_cuar'),
            tar_16a49mefne_dtad_quin=Sum('tar_16a49mefne_dtad_quin'),
            tar_mefe_dtad_prim=Sum('tar_mefe_dtad_prim'),
            tar_mefe_dtad_segu=Sum('tar_mefe_dtad_segu'),
            tar_mefe_dtad_terc=Sum('tar_mefe_dtad_terc'),
            tar_mefe_dtad_cuar=Sum('tar_mefe_dtad_cuar'),
            tar_mefe_dtad_quin=Sum('tar_mefe_dtad_quin'),
            tar_16a49_dtad_prim=Sum('tar_16a49_dtad_prim'),
            tar_16a49_dtad_segu=Sum('tar_16a49_dtad_segu'),
            tar_16a49_dtad_terc=Sum('tar_16a49_dtad_terc'),
            tar_16a49_dtad_cuar=Sum('tar_16a49_dtad_cuar'),
            tar_16a49_dtad_quin=Sum('tar_16a49_dtad_quin'),
            tar_hepa_trasal_prim=Sum('tar_hepa_trasal_prim'),
            tar_hepa_trasal_segu=Sum('tar_hepa_trasal_segu'),
            tar_hepa_trasal_terc=Sum('tar_hepa_trasal_terc'),
            tar_hepa_estsal_prim=Sum('tar_hepa_estsal_prim'),
            tar_hepa_estsal_segu=Sum('tar_hepa_estsal_segu'),
            tar_hepa_estsal_terc=Sum('tar_hepa_estsal_terc'),
            tar_hepa_trasex_prim=Sum('tar_hepa_trasex_prim'),
            tar_hepa_trasex_segu=Sum('tar_hepa_trasex_segu'),
            tar_hepa_trasex_terc=Sum('tar_hepa_trasex_terc'),
            tar_hepa_pervih_prim=Sum('tar_hepa_pervih_prim'),
            tar_hepa_pervih_segu=Sum('tar_hepa_pervih_segu'),
            tar_hepa_pervih_terc=Sum('tar_hepa_pervih_terc'),
            tar_hepa_perppl_prim=Sum('tar_hepa_perppl_prim'),
            tar_hepa_perppl_segu=Sum('tar_hepa_perppl_segu'),
            tar_hepa_perppl_terc=Sum('tar_hepa_perppl_terc'),
            tar_hepa_otro_prim=Sum('tar_hepa_otro_prim'),
            tar_hepa_otro_segu=Sum('tar_hepa_otro_segu'),
            tar_hepa_otro_terc=Sum('tar_hepa_otro_terc'),
            tar_inmant=Sum('tar_inmant'),
            tar_inmanthep=Sum('tar_inmanthep'),
            tar_inmantrra=Sum('tar_inmantrra')
        )

        # Verificar si ya existe un registro con la misma fecha y tar_tota=True
        total_record = tardio.objects.filter(
            eniUser_id=eni_user_id, tar_fech=fech_fin, tar_tota=True).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.tar_intr = sum_totals['tar_intr'] or 0
            total_record.tar_extr_mies_cnh = sum_totals['tar_extr_mies_cnh'] or 0
            total_record.tar_extr_mies_cibv = sum_totals['tar_extr_mies_cibv'] or 0
            total_record.tar_extr_mine_egen = sum_totals['tar_extr_mine_egen'] or 0
            total_record.tar_extr_mine_bach = sum_totals['tar_extr_mine_bach'] or 0
            total_record.tar_extr_visi = sum_totals['tar_extr_visi'] or 0
            total_record.tar_extr_aten = sum_totals['tar_extr_aten'] or 0
            total_record.tar_otro = sum_totals['tar_otro'] or 0
            total_record.tar_sexo_homb = sum_totals['tar_sexo_homb'] or 0
            total_record.tar_sexo_muje = sum_totals['tar_sexo_muje'] or 0
            total_record.tar_luga_pert = sum_totals['tar_luga_pert'] or 0
            total_record.tar_luga_nope = sum_totals['tar_luga_nope'] or 0
            total_record.tar_naci_ecua = sum_totals['tar_naci_ecua'] or 0
            total_record.tar_naci_colo = sum_totals['tar_naci_colo'] or 0
            total_record.tar_naci_peru = sum_totals['tar_naci_peru'] or 0
            total_record.tar_naci_cuba = sum_totals['tar_naci_cuba'] or 0
            total_record.tar_naci_vene = sum_totals['tar_naci_vene'] or 0
            total_record.tar_naci_otro = sum_totals['tar_naci_otro'] or 0
            total_record.tar_auto_indi = sum_totals['tar_auto_indi'] or 0
            total_record.tar_auto_afro = sum_totals['tar_auto_afro'] or 0
            total_record.tar_auto_negr = sum_totals['tar_auto_negr'] or 0
            total_record.tar_auto_mula = sum_totals['tar_auto_mula'] or 0
            total_record.tar_auto_mont = sum_totals['tar_auto_mont'] or 0
            total_record.tar_auto_mest = sum_totals['tar_auto_mest'] or 0
            total_record.tar_auto_blan = sum_totals['tar_auto_blan'] or 0
            total_record.tar_auto_otro = sum_totals['tar_auto_otro'] or 0
            total_record.tar_naci_achu = sum_totals['tar_naci_achu'] or 0
            total_record.tar_naci_ando = sum_totals['tar_naci_ando'] or 0
            total_record.tar_naci_awa = sum_totals['tar_naci_awa'] or 0
            total_record.tar_naci_chac = sum_totals['tar_naci_chac'] or 0
            total_record.tar_naci_cofa = sum_totals['tar_naci_cofa'] or 0
            total_record.tar_naci_eper = sum_totals['tar_naci_eper'] or 0
            total_record.tar_naci_huan = sum_totals['tar_naci_huan'] or 0
            total_record.tar_naci_kich = sum_totals['tar_naci_kich'] or 0
            total_record.tar_naci_mant = sum_totals['tar_naci_mant'] or 0
            total_record.tar_naci_seco = sum_totals['tar_naci_seco'] or 0
            total_record.tar_naci_shiw = sum_totals['tar_naci_shiw'] or 0
            total_record.tar_naci_shua = sum_totals['tar_naci_shua'] or 0
            total_record.tar_naci_sion = sum_totals['tar_naci_sion'] or 0
            total_record.tar_naci_tsac = sum_totals['tar_naci_tsac'] or 0
            total_record.tar_naci_waor = sum_totals['tar_naci_waor'] or 0
            total_record.tar_naci_zapa = sum_totals['tar_naci_zapa'] or 0
            total_record.tar_pueb_chib = sum_totals['tar_pueb_chib'] or 0
            total_record.tar_pueb_kana = sum_totals['tar_pueb_kana'] or 0
            total_record.tar_pueb_kara = sum_totals['tar_pueb_kara'] or 0
            total_record.tar_pueb_kaya = sum_totals['tar_pueb_kaya'] or 0
            total_record.tar_pueb_kich = sum_totals['tar_pueb_kich'] or 0
            total_record.tar_pueb_kisa = sum_totals['tar_pueb_kisa'] or 0
            total_record.tar_pueb_kitu = sum_totals['tar_pueb_kitu'] or 0
            total_record.tar_pueb_nata = sum_totals['tar_pueb_nata'] or 0
            total_record.tar_pueb_otav = sum_totals['tar_pueb_otav'] or 0
            total_record.tar_pueb_palt = sum_totals['tar_pueb_palt'] or 0
            total_record.tar_pueb_panz = sum_totals['tar_pueb_panz'] or 0
            total_record.tar_pueb_past = sum_totals['tar_pueb_past'] or 0
            total_record.tar_pueb_puru = sum_totals['tar_pueb_puru'] or 0
            total_record.tar_pueb_sala = sum_totals['tar_pueb_sala'] or 0
            total_record.tar_pueb_sara = sum_totals['tar_pueb_sara'] or 0
            total_record.tar_pueb_toma = sum_totals['tar_pueb_toma'] or 0
            total_record.tar_pueb_wara = sum_totals['tar_pueb_wara'] or 0
            total_record.tar_1ano_1rad_fipv = sum_totals['tar_1ano_1rad_fipv'] or 0
            total_record.tar_1ano_1rad_hbpe = sum_totals['tar_1ano_1rad_hbpe'] or 0
            total_record.tar_1ano_1rad_dpt = sum_totals['tar_1ano_1rad_dpt'] or 0
            total_record.tar_1ano_2dad_fipv = sum_totals['tar_1ano_2dad_fipv'] or 0
            total_record.tar_1ano_2dad_hbpe = sum_totals['tar_1ano_2dad_hbpe'] or 0
            total_record.tar_1ano_2dad_dpt = sum_totals['tar_1ano_2dad_dpt'] or 0
            total_record.tar_1ano_3rad_bopv = sum_totals['tar_1ano_3rad_bopv'] or 0
            total_record.tar_1ano_3rad_hbpe = sum_totals['tar_1ano_3rad_hbpe'] or 0
            total_record.tar_1ano_3rad_dpt = sum_totals['tar_1ano_3rad_dpt'] or 0
            total_record.tar_2ano_1rad_fipv = sum_totals['tar_2ano_1rad_fipv'] or 0
            total_record.tar_2ano_1rad_srp = sum_totals['tar_2ano_1rad_srp'] or 0
            total_record.tar_2ano_1rad_hbpe = sum_totals['tar_2ano_1rad_hbpe'] or 0
            total_record.tar_2ano_1rad_dpt = sum_totals['tar_2ano_1rad_dpt'] or 0
            total_record.tar_2ano_2dad_fipv = sum_totals['tar_2ano_2dad_fipv'] or 0
            total_record.tar_2ano_2dad_srp = sum_totals['tar_2ano_2dad_srp'] or 0
            total_record.tar_2ano_2dad_hbpe = sum_totals['tar_2ano_2dad_hbpe'] or 0
            total_record.tar_2ano_2dad_dpt = sum_totals['tar_2ano_2dad_dpt'] or 0
            total_record.tar_2ano_3rad_bopv = sum_totals['tar_2ano_3rad_bopv'] or 0
            total_record.tar_2ano_3rad_hbpe = sum_totals['tar_2ano_3rad_hbpe'] or 0
            total_record.tar_2ano_3rad_dpt = sum_totals['tar_2ano_3rad_dpt'] or 0
            total_record.tar_2ano_4tad_bopv = sum_totals['tar_2ano_4tad_bopv'] or 0
            total_record.tar_2ano_4tad_dpt = sum_totals['tar_2ano_4tad_dpt'] or 0
            total_record.tar_2ano_dosi_fa = sum_totals['tar_2ano_dosi_fa'] or 0
            total_record.tar_3ano_1rad_fipv = sum_totals['tar_3ano_1rad_fipv'] or 0
            total_record.tar_3ano_1rad_srp = sum_totals['tar_3ano_1rad_srp'] or 0
            total_record.tar_3ano_1rad_hbpe = sum_totals['tar_3ano_1rad_hbpe'] or 0
            total_record.tar_3ano_1rad_dpt = sum_totals['tar_3ano_1rad_dpt'] or 0
            total_record.tar_3ano_2dad_fipv = sum_totals['tar_3ano_2dad_fipv'] or 0
            total_record.tar_3ano_2dad_srp = sum_totals['tar_3ano_2dad_srp'] or 0
            total_record.tar_3ano_2dad_hbpe = sum_totals['tar_3ano_2dad_hbpe'] or 0
            total_record.tar_3ano_2dad_dpt = sum_totals['tar_3ano_2dad_dpt'] or 0
            total_record.tar_3ano_3rad_bopv = sum_totals['tar_3ano_3rad_bopv'] or 0
            total_record.tar_3ano_3rad_hbpe = sum_totals['tar_3ano_3rad_hbpe'] or 0
            total_record.tar_3ano_3rad_dpt = sum_totals['tar_3ano_3rad_dpt'] or 0
            total_record.tar_3ano_4tad_bopv = sum_totals['tar_3ano_4tad_bopv'] or 0
            total_record.tar_3ano_4tad_dpt = sum_totals['tar_3ano_4tad_dpt'] or 0
            total_record.tar_3ano_dosi_fa = sum_totals['tar_3ano_dosi_fa'] or 0
            total_record.tar_4ano_1rad_fipv = sum_totals['tar_4ano_1rad_fipv'] or 0
            total_record.tar_4ano_1rad_srp = sum_totals['tar_4ano_1rad_srp'] or 0
            total_record.tar_4ano_1rad_hbpe = sum_totals['tar_4ano_1rad_hbpe'] or 0
            total_record.tar_4ano_1rad_dpt = sum_totals['tar_4ano_1rad_dpt'] or 0
            total_record.tar_4ano_2dad_fipv = sum_totals['tar_4ano_2dad_fipv'] or 0
            total_record.tar_4ano_2dad_srp = sum_totals['tar_4ano_2dad_srp'] or 0
            total_record.tar_4ano_2dad_hbpe = sum_totals['tar_4ano_2dad_hbpe'] or 0
            total_record.tar_4ano_2dad_dpt = sum_totals['tar_4ano_2dad_dpt'] or 0
            total_record.tar_4ano_3rad_bopv = sum_totals['tar_4ano_3rad_bopv'] or 0
            total_record.tar_4ano_3rad_hbpe = sum_totals['tar_4ano_3rad_hbpe'] or 0
            total_record.tar_4ano_3rad_dpt = sum_totals['tar_4ano_3rad_dpt'] or 0
            total_record.tar_4ano_4tad_bopv = sum_totals['tar_4ano_4tad_bopv'] or 0
            total_record.tar_4ano_4tad_dpt = sum_totals['tar_4ano_4tad_dpt'] or 0
            total_record.tar_4ano_dosi_fa = sum_totals['tar_4ano_dosi_fa'] or 0
            total_record.tar_5ano_1rad_ipv = sum_totals['tar_5ano_1rad_ipv'] or 0
            total_record.tar_5ano_1rad_srp = sum_totals['tar_5ano_1rad_srp'] or 0
            total_record.tar_5ano_1rad_hbpe = sum_totals['tar_5ano_1rad_hbpe'] or 0
            total_record.tar_5ano_1rad_dpt = sum_totals['tar_5ano_1rad_dpt'] or 0
            total_record.tar_5ano_2dad_fipv = sum_totals['tar_5ano_2dad_fipv'] or 0
            total_record.tar_5ano_2dad_srp = sum_totals['tar_5ano_2dad_srp'] or 0
            total_record.tar_5ano_2dad_hbpe = sum_totals['tar_5ano_2dad_hbpe'] or 0
            total_record.tar_5ano_2dad_dpt = sum_totals['tar_5ano_2dad_dpt'] or 0
            total_record.tar_5ano_3rad_bopv = sum_totals['tar_5ano_3rad_bopv'] or 0
            total_record.tar_5ano_3rad_hbpe = sum_totals['tar_5ano_3rad_hbpe'] or 0
            total_record.tar_5ano_3rad_dpt = sum_totals['tar_5ano_3rad_dpt'] or 0
            total_record.tar_5ano_4tad_bopv = sum_totals['tar_5ano_4tad_bopv'] or 0
            total_record.tar_5ano_4tad_dpt = sum_totals['tar_5ano_4tad_dpt'] or 0
            total_record.tar_5ano_dosi_fa = sum_totals['tar_5ano_dosi_fa'] or 0
            total_record.tar_6ano_1rad_srp = sum_totals['tar_6ano_1rad_srp'] or 0
            total_record.tar_6ano_2dad_srp = sum_totals['tar_6ano_2dad_srp'] or 0
            total_record.tar_6ano_dosi_fa = sum_totals['tar_6ano_dosi_fa'] or 0
            total_record.tar_7ano_1rad_sr = sum_totals['tar_7ano_1rad_sr'] or 0
            total_record.tar_7ano_2dad_sr = sum_totals['tar_7ano_2dad_sr'] or 0
            total_record.tar_7ano_dosi_fa = sum_totals['tar_7ano_dosi_fa'] or 0
            total_record.tar_8ano_dosi_fa = sum_totals['tar_8ano_dosi_fa'] or 0
            total_record.tar_7a14_dosi_dtad = sum_totals['tar_7a14_dosi_dtad'] or 0
            total_record.tar_9a14_dosi_fa = sum_totals['tar_9a14_dosi_fa'] or 0
            total_record.tar_15a19_dosi_fa = sum_totals['tar_15a19_dosi_fa'] or 0
            total_record.tar_20a59_dosi_fa = sum_totals['tar_20a59_dosi_fa'] or 0
            total_record.tar_8a14_1rad_sr = sum_totals['tar_8a14_1rad_sr'] or 0
            total_record.tar_8a14_2dad_sr = sum_totals['tar_8a14_2dad_sr'] or 0
            total_record.tar_15a29_1rad_sr = sum_totals['tar_15a29_1rad_sr'] or 0
            total_record.tar_15a29_2dad_sr = sum_totals['tar_15a29_2dad_sr'] or 0
            total_record.tar_30a50_1rad_sr = sum_totals['tar_30a50_1rad_sr'] or 0
            total_record.tar_30a50_2dad_sr = sum_totals['tar_30a50_2dad_sr'] or 0
            total_record.tar_16a49mefne_dtad_prim = sum_totals['tar_16a49mefne_dtad_prim'] or 0
            total_record.tar_16a49mefne_dtad_segu = sum_totals['tar_16a49mefne_dtad_segu'] or 0
            total_record.tar_16a49mefne_dtad_terc = sum_totals['tar_16a49mefne_dtad_terc'] or 0
            total_record.tar_16a49mefne_dtad_cuar = sum_totals['tar_16a49mefne_dtad_cuar'] or 0
            total_record.tar_16a49mefne_dtad_quin = sum_totals['tar_16a49mefne_dtad_quin'] or 0
            total_record.tar_mefe_dtad_prim = sum_totals['tar_mefe_dtad_prim'] or 0
            total_record.tar_mefe_dtad_segu = sum_totals['tar_mefe_dtad_segu'] or 0
            total_record.tar_mefe_dtad_terc = sum_totals['tar_mefe_dtad_terc'] or 0
            total_record.tar_mefe_dtad_cuar = sum_totals['tar_mefe_dtad_cuar'] or 0
            total_record.tar_mefe_dtad_quin = sum_totals['tar_mefe_dtad_quin'] or 0
            total_record.tar_16a49_dtad_prim = sum_totals['tar_16a49_dtad_prim'] or 0
            total_record.tar_16a49_dtad_segu = sum_totals['tar_16a49_dtad_segu'] or 0
            total_record.tar_16a49_dtad_terc = sum_totals['tar_16a49_dtad_terc'] or 0
            total_record.tar_16a49_dtad_cuar = sum_totals['tar_16a49_dtad_cuar'] or 0
            total_record.tar_16a49_dtad_quin = sum_totals['tar_16a49_dtad_quin'] or 0
            total_record.tar_hepa_trasal_prim = sum_totals['tar_hepa_trasal_prim'] or 0
            total_record.tar_hepa_trasal_segu = sum_totals['tar_hepa_trasal_segu'] or 0
            total_record.tar_hepa_trasal_terc = sum_totals['tar_hepa_trasal_terc'] or 0
            total_record.tar_hepa_estsal_prim = sum_totals['tar_hepa_estsal_prim'] or 0
            total_record.tar_hepa_estsal_segu = sum_totals['tar_hepa_estsal_segu'] or 0
            total_record.tar_hepa_estsal_terc = sum_totals['tar_hepa_estsal_terc'] or 0
            total_record.tar_hepa_trasex_prim = sum_totals['tar_hepa_trasex_prim'] or 0
            total_record.tar_hepa_trasex_segu = sum_totals['tar_hepa_trasex_segu'] or 0
            total_record.tar_hepa_trasex_terc = sum_totals['tar_hepa_trasex_terc'] or 0
            total_record.tar_hepa_pervih_prim = sum_totals['tar_hepa_pervih_prim'] or 0
            total_record.tar_hepa_pervih_segu = sum_totals['tar_hepa_pervih_segu'] or 0
            total_record.tar_hepa_pervih_terc = sum_totals['tar_hepa_pervih_terc'] or 0
            total_record.tar_hepa_perppl_prim = sum_totals['tar_hepa_perppl_prim'] or 0
            total_record.tar_hepa_perppl_segu = sum_totals['tar_hepa_perppl_segu'] or 0
            total_record.tar_hepa_perppl_terc = sum_totals['tar_hepa_perppl_terc'] or 0
            total_record.tar_hepa_otro_prim = sum_totals['tar_hepa_otro_prim'] or 0
            total_record.tar_hepa_otro_segu = sum_totals['tar_hepa_otro_segu'] or 0
            total_record.tar_hepa_otro_terc = sum_totals['tar_hepa_otro_terc'] or 0
            total_record.tar_inmant = sum_totals['tar_inmant'] or 0
            total_record.tar_inmanthep = sum_totals['tar_inmanthep'] or 0
            total_record.tar_inmantrra = sum_totals['tar_inmantrra'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            tardio.objects.create(
                tar_fech=fech_fin,
                eniUser_id=eni_user_id,  # Guardar la relación con User
                tar_tota=True,
                tar_intr=sum_totals['tar_intr'] or 0,
                tar_extr_mies_cnh=sum_totals['tar_extr_mies_cnh'] or 0,
                tar_extr_mies_cibv=sum_totals['tar_extr_mies_cibv'] or 0,
                tar_extr_mine_egen=sum_totals['tar_extr_mine_egen'] or 0,
                tar_extr_mine_bach=sum_totals['tar_extr_mine_bach'] or 0,
                tar_extr_visi=sum_totals['tar_extr_visi'] or 0,
                tar_extr_aten=sum_totals['tar_extr_aten'] or 0,
                tar_otro=sum_totals['tar_otro'] or 0,
                tar_sexo_homb=sum_totals['tar_sexo_homb'] or 0,
                tar_sexo_muje=sum_totals['tar_sexo_muje'] or 0,
                tar_luga_pert=sum_totals['tar_luga_pert'] or 0,
                tar_luga_nope=sum_totals['tar_luga_nope'] or 0,
                tar_naci_ecua=sum_totals['tar_naci_ecua'] or 0,
                tar_naci_colo=sum_totals['tar_naci_colo'] or 0,
                tar_naci_peru=sum_totals['tar_naci_peru'] or 0,
                tar_naci_cuba=sum_totals['tar_naci_cuba'] or 0,
                tar_naci_vene=sum_totals['tar_naci_vene'] or 0,
                tar_naci_otro=sum_totals['tar_naci_otro'] or 0,
                tar_auto_indi=sum_totals['tar_auto_indi'] or 0,
                tar_auto_afro=sum_totals['tar_auto_afro'] or 0,
                tar_auto_negr=sum_totals['tar_auto_negr'] or 0,
                tar_auto_mula=sum_totals['tar_auto_mula'] or 0,
                tar_auto_mont=sum_totals['tar_auto_mont'] or 0,
                tar_auto_mest=sum_totals['tar_auto_mest'] or 0,
                tar_auto_blan=sum_totals['tar_auto_blan'] or 0,
                tar_auto_otro=sum_totals['tar_auto_otro'] or 0,
                tar_naci_achu=sum_totals['tar_naci_achu'] or 0,
                tar_naci_ando=sum_totals['tar_naci_ando'] or 0,
                tar_naci_awa=sum_totals['tar_naci_awa'] or 0,
                tar_naci_chac=sum_totals['tar_naci_chac'] or 0,
                tar_naci_cofa=sum_totals['tar_naci_cofa'] or 0,
                tar_naci_eper=sum_totals['tar_naci_eper'] or 0,
                tar_naci_huan=sum_totals['tar_naci_huan'] or 0,
                tar_naci_kich=sum_totals['tar_naci_kich'] or 0,
                tar_naci_mant=sum_totals['tar_naci_mant'] or 0,
                tar_naci_seco=sum_totals['tar_naci_seco'] or 0,
                tar_naci_shiw=sum_totals['tar_naci_shiw'] or 0,
                tar_naci_shua=sum_totals['tar_naci_shua'] or 0,
                tar_naci_sion=sum_totals['tar_naci_sion'] or 0,
                tar_naci_tsac=sum_totals['tar_naci_tsac'] or 0,
                tar_naci_waor=sum_totals['tar_naci_waor'] or 0,
                tar_naci_zapa=sum_totals['tar_naci_zapa'] or 0,
                tar_pueb_chib=sum_totals['tar_pueb_chib'] or 0,
                tar_pueb_kana=sum_totals['tar_pueb_kana'] or 0,
                tar_pueb_kara=sum_totals['tar_pueb_kara'] or 0,
                tar_pueb_kaya=sum_totals['tar_pueb_kaya'] or 0,
                tar_pueb_kich=sum_totals['tar_pueb_kich'] or 0,
                tar_pueb_kisa=sum_totals['tar_pueb_kisa'] or 0,
                tar_pueb_kitu=sum_totals['tar_pueb_kitu'] or 0,
                tar_pueb_nata=sum_totals['tar_pueb_nata'] or 0,
                tar_pueb_otav=sum_totals['tar_pueb_otav'] or 0,
                tar_pueb_palt=sum_totals['tar_pueb_palt'] or 0,
                tar_pueb_panz=sum_totals['tar_pueb_panz'] or 0,
                tar_pueb_past=sum_totals['tar_pueb_past'] or 0,
                tar_pueb_puru=sum_totals['tar_pueb_puru'] or 0,
                tar_pueb_sala=sum_totals['tar_pueb_sala'] or 0,
                tar_pueb_sara=sum_totals['tar_pueb_sara'] or 0,
                tar_pueb_toma=sum_totals['tar_pueb_toma'] or 0,
                tar_pueb_wara=sum_totals['tar_pueb_wara'] or 0,
                tar_1ano_1rad_fipv=sum_totals['tar_1ano_1rad_fipv'] or 0,
                tar_1ano_1rad_hbpe=sum_totals['tar_1ano_1rad_hbpe'] or 0,
                tar_1ano_1rad_dpt=sum_totals['tar_1ano_1rad_dpt'] or 0,
                tar_1ano_2dad_fipv=sum_totals['tar_1ano_2dad_fipv'] or 0,
                tar_1ano_2dad_hbpe=sum_totals['tar_1ano_2dad_hbpe'] or 0,
                tar_1ano_2dad_dpt=sum_totals['tar_1ano_2dad_dpt'] or 0,
                tar_1ano_3rad_bopv=sum_totals['tar_1ano_3rad_bopv'] or 0,
                tar_1ano_3rad_hbpe=sum_totals['tar_1ano_3rad_hbpe'] or 0,
                tar_1ano_3rad_dpt=sum_totals['tar_1ano_3rad_dpt'] or 0,
                tar_2ano_1rad_fipv=sum_totals['tar_2ano_1rad_fipv'] or 0,
                tar_2ano_1rad_srp=sum_totals['tar_2ano_1rad_srp'] or 0,
                tar_2ano_1rad_hbpe=sum_totals['tar_2ano_1rad_hbpe'] or 0,
                tar_2ano_1rad_dpt=sum_totals['tar_2ano_1rad_dpt'] or 0,
                tar_2ano_2dad_fipv=sum_totals['tar_2ano_2dad_fipv'] or 0,
                tar_2ano_2dad_srp=sum_totals['tar_2ano_2dad_srp'] or 0,
                tar_2ano_2dad_hbpe=sum_totals['tar_2ano_2dad_hbpe'] or 0,
                tar_2ano_2dad_dpt=sum_totals['tar_2ano_2dad_dpt'] or 0,
                tar_2ano_3rad_bopv=sum_totals['tar_2ano_3rad_bopv'] or 0,
                tar_2ano_3rad_hbpe=sum_totals['tar_2ano_3rad_hbpe'] or 0,
                tar_2ano_3rad_dpt=sum_totals['tar_2ano_3rad_dpt'] or 0,
                tar_2ano_4tad_bopv=sum_totals['tar_2ano_4tad_bopv'] or 0,
                tar_2ano_4tad_dpt=sum_totals['tar_2ano_4tad_dpt'] or 0,
                tar_2ano_dosi_fa=sum_totals['tar_2ano_dosi_fa'] or 0,
                tar_3ano_1rad_fipv=sum_totals['tar_3ano_1rad_fipv'] or 0,
                tar_3ano_1rad_srp=sum_totals['tar_3ano_1rad_srp'] or 0,
                tar_3ano_1rad_hbpe=sum_totals['tar_3ano_1rad_hbpe'] or 0,
                tar_3ano_1rad_dpt=sum_totals['tar_3ano_1rad_dpt'] or 0,
                tar_3ano_2dad_fipv=sum_totals['tar_3ano_2dad_fipv'] or 0,
                tar_3ano_2dad_srp=sum_totals['tar_3ano_2dad_srp'] or 0,
                tar_3ano_2dad_hbpe=sum_totals['tar_3ano_2dad_hbpe'] or 0,
                tar_3ano_2dad_dpt=sum_totals['tar_3ano_2dad_dpt'] or 0,
                tar_3ano_3rad_bopv=sum_totals['tar_3ano_3rad_bopv'] or 0,
                tar_3ano_3rad_hbpe=sum_totals['tar_3ano_3rad_hbpe'] or 0,
                tar_3ano_3rad_dpt=sum_totals['tar_3ano_3rad_dpt'] or 0,
                tar_3ano_4tad_bopv=sum_totals['tar_3ano_4tad_bopv'] or 0,
                tar_3ano_4tad_dpt=sum_totals['tar_3ano_4tad_dpt'] or 0,
                tar_3ano_dosi_fa=sum_totals['tar_3ano_dosi_fa'] or 0,
                tar_4ano_1rad_fipv=sum_totals['tar_4ano_1rad_fipv'] or 0,
                tar_4ano_1rad_srp=sum_totals['tar_4ano_1rad_srp'] or 0,
                tar_4ano_1rad_hbpe=sum_totals['tar_4ano_1rad_hbpe'] or 0,
                tar_4ano_1rad_dpt=sum_totals['tar_4ano_1rad_dpt'] or 0,
                tar_4ano_2dad_fipv=sum_totals['tar_4ano_2dad_fipv'] or 0,
                tar_4ano_2dad_srp=sum_totals['tar_4ano_2dad_srp'] or 0,
                tar_4ano_2dad_hbpe=sum_totals['tar_4ano_2dad_hbpe'] or 0,
                tar_4ano_2dad_dpt=sum_totals['tar_4ano_2dad_dpt'] or 0,
                tar_4ano_3rad_bopv=sum_totals['tar_4ano_3rad_bopv'] or 0,
                tar_4ano_3rad_hbpe=sum_totals['tar_4ano_3rad_hbpe'] or 0,
                tar_4ano_3rad_dpt=sum_totals['tar_4ano_3rad_dpt'] or 0,
                tar_4ano_4tad_bopv=sum_totals['tar_4ano_4tad_bopv'] or 0,
                tar_4ano_4tad_dpt=sum_totals['tar_4ano_4tad_dpt'] or 0,
                tar_4ano_dosi_fa=sum_totals['tar_4ano_dosi_fa'] or 0,
                tar_5ano_1rad_ipv=sum_totals['tar_5ano_1rad_ipv'] or 0,
                tar_5ano_1rad_srp=sum_totals['tar_5ano_1rad_srp'] or 0,
                tar_5ano_1rad_hbpe=sum_totals['tar_5ano_1rad_hbpe'] or 0,
                tar_5ano_1rad_dpt=sum_totals['tar_5ano_1rad_dpt'] or 0,
                tar_5ano_2dad_fipv=sum_totals['tar_5ano_2dad_fipv'] or 0,
                tar_5ano_2dad_srp=sum_totals['tar_5ano_2dad_srp'] or 0,
                tar_5ano_2dad_hbpe=sum_totals['tar_5ano_2dad_hbpe'] or 0,
                tar_5ano_2dad_dpt=sum_totals['tar_5ano_2dad_dpt'] or 0,
                tar_5ano_3rad_bopv=sum_totals['tar_5ano_3rad_bopv'] or 0,
                tar_5ano_3rad_hbpe=sum_totals['tar_5ano_3rad_hbpe'] or 0,
                tar_5ano_3rad_dpt=sum_totals['tar_5ano_3rad_dpt'] or 0,
                tar_5ano_4tad_bopv=sum_totals['tar_5ano_4tad_bopv'] or 0,
                tar_5ano_4tad_dpt=sum_totals['tar_5ano_4tad_dpt'] or 0,
                tar_5ano_dosi_fa=sum_totals['tar_5ano_dosi_fa'] or 0,
                tar_6ano_1rad_srp=sum_totals['tar_6ano_1rad_srp'] or 0,
                tar_6ano_2dad_srp=sum_totals['tar_6ano_2dad_srp'] or 0,
                tar_6ano_dosi_fa=sum_totals['tar_6ano_dosi_fa'] or 0,
                tar_7ano_1rad_sr=sum_totals['tar_7ano_1rad_sr'] or 0,
                tar_7ano_2dad_sr=sum_totals['tar_7ano_2dad_sr'] or 0,
                tar_7ano_dosi_fa=sum_totals['tar_7ano_dosi_fa'] or 0,
                tar_8ano_dosi_fa=sum_totals['tar_8ano_dosi_fa'] or 0,
                tar_7a14_dosi_dtad=sum_totals['tar_7a14_dosi_dtad'] or 0,
                tar_9a14_dosi_fa=sum_totals['tar_9a14_dosi_fa'] or 0,
                tar_15a19_dosi_fa=sum_totals['tar_15a19_dosi_fa'] or 0,
                tar_20a59_dosi_fa=sum_totals['tar_20a59_dosi_fa'] or 0,
                tar_8a14_1rad_sr=sum_totals['tar_8a14_1rad_sr'] or 0,
                tar_8a14_2dad_sr=sum_totals['tar_8a14_2dad_sr'] or 0,
                tar_15a29_1rad_sr=sum_totals['tar_15a29_1rad_sr'] or 0,
                tar_15a29_2dad_sr=sum_totals['tar_15a29_2dad_sr'] or 0,
                tar_30a50_1rad_sr=sum_totals['tar_30a50_1rad_sr'] or 0,
                tar_30a50_2dad_sr=sum_totals['tar_30a50_2dad_sr'] or 0,
                tar_16a49mefne_dtad_prim=sum_totals['tar_16a49mefne_dtad_prim'] or 0,
                tar_16a49mefne_dtad_segu=sum_totals['tar_16a49mefne_dtad_segu'] or 0,
                tar_16a49mefne_dtad_terc=sum_totals['tar_16a49mefne_dtad_terc'] or 0,
                tar_16a49mefne_dtad_cuar=sum_totals['tar_16a49mefne_dtad_cuar'] or 0,
                tar_16a49mefne_dtad_quin=sum_totals['tar_16a49mefne_dtad_quin'] or 0,
                tar_mefe_dtad_prim=sum_totals['tar_mefe_dtad_prim'] or 0,
                tar_mefe_dtad_segu=sum_totals['tar_mefe_dtad_segu'] or 0,
                tar_mefe_dtad_terc=sum_totals['tar_mefe_dtad_terc'] or 0,
                tar_mefe_dtad_cuar=sum_totals['tar_mefe_dtad_cuar'] or 0,
                tar_mefe_dtad_quin=sum_totals['tar_mefe_dtad_quin'] or 0,
                tar_16a49_dtad_prim=sum_totals['tar_16a49_dtad_prim'] or 0,
                tar_16a49_dtad_segu=sum_totals['tar_16a49_dtad_segu'] or 0,
                tar_16a49_dtad_terc=sum_totals['tar_16a49_dtad_terc'] or 0,
                tar_16a49_dtad_cuar=sum_totals['tar_16a49_dtad_cuar'] or 0,
                tar_16a49_dtad_quin=sum_totals['tar_16a49_dtad_quin'] or 0,
                tar_hepa_trasal_prim=sum_totals['tar_hepa_trasal_prim'] or 0,
                tar_hepa_trasal_segu=sum_totals['tar_hepa_trasal_segu'] or 0,
                tar_hepa_trasal_terc=sum_totals['tar_hepa_trasal_terc'] or 0,
                tar_hepa_estsal_prim=sum_totals['tar_hepa_estsal_prim'] or 0,
                tar_hepa_estsal_segu=sum_totals['tar_hepa_estsal_segu'] or 0,
                tar_hepa_estsal_terc=sum_totals['tar_hepa_estsal_terc'] or 0,
                tar_hepa_trasex_prim=sum_totals['tar_hepa_trasex_prim'] or 0,
                tar_hepa_trasex_segu=sum_totals['tar_hepa_trasex_segu'] or 0,
                tar_hepa_trasex_terc=sum_totals['tar_hepa_trasex_terc'] or 0,
                tar_hepa_pervih_prim=sum_totals['tar_hepa_pervih_prim'] or 0,
                tar_hepa_pervih_segu=sum_totals['tar_hepa_pervih_segu'] or 0,
                tar_hepa_pervih_terc=sum_totals['tar_hepa_pervih_terc'] or 0,
                tar_hepa_perppl_prim=sum_totals['tar_hepa_perppl_prim'] or 0,
                tar_hepa_perppl_segu=sum_totals['tar_hepa_perppl_segu'] or 0,
                tar_hepa_perppl_terc=sum_totals['tar_hepa_perppl_terc'] or 0,
                tar_hepa_otro_prim=sum_totals['tar_hepa_otro_prim'] or 0,
                tar_hepa_otro_segu=sum_totals['tar_hepa_otro_segu'] or 0,
                tar_hepa_otro_terc=sum_totals['tar_hepa_otro_terc'] or 0,
                tar_inmant=sum_totals['tar_inmant'] or 0,
                tar_inmanthep=sum_totals['tar_inmanthep'] or 0,
                tar_inmantrra=sum_totals['tar_inmantrra'] or 0
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tar_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las variables de los valores que se utilizan en Tardio y Desperdicio
        des_hbpe_dosapli = int(data.get('tar_1ano_1rad_hbpe', 0)) + int(data.get('tar_1ano_2dad_hbpe', 0)) + int(data.get('tar_1ano_3rad_hbpe', 0)) + int(data.get('tar_2ano_1rad_hbpe', 0)) + int(data.get('tar_2ano_2dad_hbpe', 0)) + int(data.get('tar_2ano_3rad_hbpe', 0)) + int(data.get('tar_3ano_1rad_hbpe', 0)) + int(
            data.get('tar_3ano_2dad_hbpe', 0)) + int(data.get('tar_3ano_3rad_hbpe', 0)) + int(data.get('tar_4ano_1rad_hbpe', 0)) + int(data.get('tar_4ano_2dad_hbpe', 0)) + int(data.get('tar_4ano_3rad_hbpe', 0)) + int(data.get('tar_5ano_1rad_hbpe', 0)) + int(data.get('tar_5ano_2dad_hbpe', 0)) + int(data.get('tar_5ano_3rad_hbpe', 0))
        des_fipv_dosapli = int(data.get('tar_1ano_1rad_fipv', 0)) + int(data.get('tar_1ano_2dad_fipv', 0)) + int(data.get('tar_2ano_1rad_fipv', 0)) + int(data.get('tar_2ano_2dad_fipv', 0)) + int(data.get('tar_3ano_1rad_fipv', 0)) + \
            int(data.get('tar_3ano_2dad_fipv', 0)) + int(data.get('tar_4ano_1rad_fipv', 0)) + int(data.get(
                'tar_4ano_2dad_fipv', 0)) + int(data.get('tar_5ano_1rad_ipv', 0)) + int(data.get('tar_5ano_2dad_fipv', 0))
        des_anti_dosapli = int(data.get('tar_1ano_3rad_bopv', 0)) + int(data.get('tar_2ano_3rad_bopv', 0)) + int(data.get('tar_2ano_4tad_bopv', 0)) + int(data.get('tar_3ano_3rad_bopv', 0)) + int(
            data.get('tar_3ano_4tad_bopv', 0)) + int(data.get('tar_4ano_3rad_bopv', 0)) + int(data.get('tar_5ano_3rad_bopv', 0)) + int(data.get('tar_5ano_4tad_bopv', 0)) + int(data.get('tar_4ano_4tad_bopv', 0))
        des_sr_dosapli = int(data.get('tar_7ano_1rad_sr', 0)) + int(data.get('tar_7ano_2dad_sr', 0)) + int(data.get('tar_8a14_1rad_sr', 0)) + int(data.get('tar_8a14_2dad_sr', 0)) + \
            int(data.get('tar_15a29_1rad_sr', 0)) + int(data.get('tar_15a29_2dad_sr', 0)) + \
            int(data.get('tar_30a50_1rad_sr', 0)) + \
            int(data.get('tar_30a50_2dad_sr', 0))
        des_srp_dosapli = int(data.get('tar_2ano_1rad_srp', 0)) + int(data.get('tar_2ano_2dad_srp', 0)) + int(data.get('tar_3ano_1rad_srp', 0)) + int(data.get('tar_3ano_2dad_srp', 0)) + int(data.get('tar_4ano_1rad_srp', 0)) + \
            int(data.get('tar_4ano_2dad_srp', 0)) + int(data.get('tar_5ano_1rad_srp', 0)) + int(data.get(
                'tar_5ano_2dad_srp', 0)) + int(data.get('tar_6ano_1rad_srp', 0)) + int(data.get('tar_6ano_2dad_srp', 0))
        des_fieb_dosapli = int(data.get('tar_2ano_dosi_fa', 0)) + int(data.get('tar_3ano_dosi_fa', 0)) + int(data.get('tar_4ano_dosi_fa', 0)) + int(data.get('tar_5ano_dosi_fa', 0)) + int(data.get('tar_6ano_dosi_fa', 0)) + \
            int(data.get('tar_7ano_dosi_fa', 0)) + int(data.get('tar_8ano_dosi_fa', 0)) + int(data.get(
                'tar_9a14_dosi_fa', 0)) + int(data.get('tar_15a19_dosi_fa', 0)) + int(data.get('tar_20a59_dosi_fa', 0))
        des_dift_dosapli = int(data.get('tar_1ano_1rad_dpt', 0)) + int(data.get('tar_1ano_2dad_dpt', 0)) + int(data.get('tar_1ano_3rad_dpt', 0)) + int(data.get('tar_2ano_1rad_dpt', 0)) + int(data.get('tar_2ano_2dad_dpt', 0)) + int(data.get('tar_2ano_3rad_dpt', 0)) + int(data.get('tar_2ano_4tad_dpt', 0)) + int(data.get('tar_3ano_1rad_dpt', 0)) + \
            int(data.get('tar_3ano_2dad_dpt', 0)) + int(
            data.get('tar_3ano_3rad_dpt', 0)) + int(data.get('tar_3ano_4tad_dpt', 0)) + int(data.get('tar_4ano_1rad_dpt', 0)) + int(data.get('tar_4ano_2dad_dpt', 0)) + int(data.get('tar_4ano_3rad_dpt', 0)) + int(data.get('tar_4ano_4tad_dpt', 0)) + int(data.get('tar_5ano_1rad_dpt', 0)) + int(data.get('tar_5ano_2dad_dpt', 0)) + \
            int(data.get('tar_5ano_3rad_dpt', 0)) + \
            int(data.get('tar_5ano_4tad_dpt', 0))
        des_dtad_dosapli = int(data.get('tar_7a14_dosi_dtad', 0)) + int(data.get('tar_16a49mefne_dtad_prim', 0)) + int(data.get('tar_16a49mefne_dtad_segu', 0)) + int(data.get('tar_16a49mefne_dtad_terc', 0)) + int(data.get('tar_16a49mefne_dtad_cuar', 0)) + int(data.get('tar_16a49mefne_dtad_quin', 0)) + int(data.get('tar_mefe_dtad_prim', 0)) + \
            int(data.get('tar_mefe_dtad_segu', 0)) + int(data.get('tar_mefe_dtad_terc', 0)) + int(data.get('tar_mefe_dtad_cuar', 0)) + int(data.get('tar_mefe_dtad_quin', 0)) + int(data.get(
                'tar_16a49_dtad_prim', 0)) + int(data.get('tar_16a49_dtad_segu', 0)) + int(data.get('tar_16a49_dtad_terc', 0)) + int(data.get('tar_16a49_dtad_cuar', 0)) + int(data.get('tar_16a49_dtad_quin', 0))
        des_hepa_dosapli = int(data.get('tar_hepa_trasal_prim', 0)) + int(data.get('tar_hepa_trasal_segu', 0)) + int(data.get('tar_hepa_trasal_terc', 0)) + int(data.get('tar_hepa_estsal_prim', 0)) + int(data.get('tar_hepa_estsal_segu', 0)) + int(data.get('tar_hepa_estsal_terc', 0)) + int(data.get('tar_hepa_trasex_prim', 0)) + \
            int(data.get('tar_hepa_trasex_segu', 0)) + int(data.get('tar_hepa_trasex_terc', 0)) + int(data.get('tar_hepa_pervih_prim', 0)) + int(data.get('tar_hepa_pervih_segu', 0)) + int(data.get('tar_hepa_pervih_terc', 0)) + int(data.get('tar_hepa_perppl_prim', 0)) + int(data.get('tar_hepa_perppl_segu', 0)) + int(data.get('tar_hepa_perppl_terc', 0)) + \
            int(data.get('tar_hepa_otro_prim', 0)) + \
            int(data.get('tar_hepa_otro_segu', 0)) + \
            int(data.get('tar_hepa_otro_terc', 0))
        des_inmant_dosapli = int(data.get('tar_inmant', 0))
        des_inmanthepb_dosapli = int(data.get('tar_inmanthep', 0))
        des_inmantrra_dosapli = int(data.get('tar_inmantrra', 0))
        des_bcg_dosapli = int(data.get('des_bcg_dosapli', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_dosapli = int(data.get('des_rota_dosapli', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_dosapli = int(data.get('des_pent_dosapli', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_dosapli = int(data.get('des_neum_dosapli', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_dosapli = int(data.get('des_vari_dosapli', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_dosapli = int(data.get('des_hpv_dosapli', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('des_infped_dosapli', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('des_infadu_dosapli', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli += des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi += des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi += des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli += des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi += des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi += des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli += des_rota_dosapli
            existing_record.des_rota_pervacenfabi += des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi += des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli += des_pent_dosapli
            existing_record.des_pent_pervacenfabi += des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi += des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli += des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi += des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi += des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli += des_anti_dosapli
            existing_record.des_anti_pervacenfabi += des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi += des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli += des_neum_dosapli
            existing_record.des_neum_pervacenfabi += des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi += des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli += des_sr_dosapli
            existing_record.des_sr_pervacenfabi += des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi += des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli += des_srp_dosapli
            existing_record.des_srp_pervacenfabi += des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi += des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli += des_vari_dosapli
            existing_record.des_vari_pervacenfabi += des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi += des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli += des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi += des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi += des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli += des_dift_dosapli
            existing_record.des_dift_pervacenfabi += des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi += des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli += des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi += des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi += des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli += des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi += des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi += des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli += des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi += des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi += des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli += des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi += des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi += des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli += des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi += des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi += des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli += des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi += des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi += des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli += des_infped_dosapli
            existing_record.des_infped_pervacenfabi += des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi += des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli += des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi += des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi += des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli += des_viru_dosapli
            existing_record.des_viru_pervacenfabi += des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi += des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli += des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi += des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi += des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli += des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi += des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi += des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli += des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi += des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi += des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli += des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi += des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi += des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tar_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Create_Correcto}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch'], url_path='actualizar-tardio')
    def update_tardio(self, request, pk=None):
        data = request.data
        tar_fech = parse_date(data.get('tar_fech'))
        eni_user_id = data.get('eniUser')

        # Obtener la instancia existente
        instance = self.get_object()

        # Actualizar la instancia con los nuevos datos
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Crear variables de control
        fech_inicio = tar_fech.replace(day=1)
        fech_fin = (tar_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde tem_tota es False
        registros_mes = tardio.objects.filter(
            tar_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, tar_tota=False
        )
        sum_totals = registros_mes.aggregate(
            tar_intr=Sum('tar_intr'),
            tar_extr_mies_cnh=Sum('tar_extr_mies_cnh'),
            tar_extr_mies_cibv=Sum('tar_extr_mies_cibv'),
            tar_extr_mine_egen=Sum('tar_extr_mine_egen'),
            tar_extr_mine_bach=Sum('tar_extr_mine_bach'),
            tar_extr_visi=Sum('tar_extr_visi'),
            tar_extr_aten=Sum('tar_extr_aten'),
            tar_otro=Sum('tar_otro'),
            tar_sexo_homb=Sum('tar_sexo_homb'),
            tar_sexo_muje=Sum('tar_sexo_muje'),
            tar_luga_pert=Sum('tar_luga_pert'),
            tar_luga_nope=Sum('tar_luga_nope'),
            tar_naci_ecua=Sum('tar_naci_ecua'),
            tar_naci_colo=Sum('tar_naci_colo'),
            tar_naci_peru=Sum('tar_naci_peru'),
            tar_naci_cuba=Sum('tar_naci_cuba'),
            tar_naci_vene=Sum('tar_naci_vene'),
            tar_naci_otro=Sum('tar_naci_otro'),
            tar_auto_indi=Sum('tar_auto_indi'),
            tar_auto_afro=Sum('tar_auto_afro'),
            tar_auto_negr=Sum('tar_auto_negr'),
            tar_auto_mula=Sum('tar_auto_mula'),
            tar_auto_mont=Sum('tar_auto_mont'),
            tar_auto_mest=Sum('tar_auto_mest'),
            tar_auto_blan=Sum('tar_auto_blan'),
            tar_auto_otro=Sum('tar_auto_otro'),
            tar_naci_achu=Sum('tar_naci_achu'),
            tar_naci_ando=Sum('tar_naci_ando'),
            tar_naci_awa=Sum('tar_naci_awa'),
            tar_naci_chac=Sum('tar_naci_chac'),
            tar_naci_cofa=Sum('tar_naci_cofa'),
            tar_naci_eper=Sum('tar_naci_eper'),
            tar_naci_huan=Sum('tar_naci_huan'),
            tar_naci_kich=Sum('tar_naci_kich'),
            tar_naci_mant=Sum('tar_naci_mant'),
            tar_naci_seco=Sum('tar_naci_seco'),
            tar_naci_shiw=Sum('tar_naci_shiw'),
            tar_naci_shua=Sum('tar_naci_shua'),
            tar_naci_sion=Sum('tar_naci_sion'),
            tar_naci_tsac=Sum('tar_naci_tsac'),
            tar_naci_waor=Sum('tar_naci_waor'),
            tar_naci_zapa=Sum('tar_naci_zapa'),
            tar_pueb_chib=Sum('tar_pueb_chib'),
            tar_pueb_kana=Sum('tar_pueb_kana'),
            tar_pueb_kara=Sum('tar_pueb_kara'),
            tar_pueb_kaya=Sum('tar_pueb_kaya'),
            tar_pueb_kich=Sum('tar_pueb_kich'),
            tar_pueb_kisa=Sum('tar_pueb_kisa'),
            tar_pueb_kitu=Sum('tar_pueb_kitu'),
            tar_pueb_nata=Sum('tar_pueb_nata'),
            tar_pueb_otav=Sum('tar_pueb_otav'),
            tar_pueb_palt=Sum('tar_pueb_palt'),
            tar_pueb_panz=Sum('tar_pueb_panz'),
            tar_pueb_past=Sum('tar_pueb_past'),
            tar_pueb_puru=Sum('tar_pueb_puru'),
            tar_pueb_sala=Sum('tar_pueb_sala'),
            tar_pueb_sara=Sum('tar_pueb_sara'),
            tar_pueb_toma=Sum('tar_pueb_toma'),
            tar_pueb_wara=Sum('tar_pueb_wara'),
            tar_1ano_1rad_fipv=Sum('tar_1ano_1rad_fipv'),
            tar_1ano_1rad_hbpe=Sum('tar_1ano_1rad_hbpe'),
            tar_1ano_1rad_dpt=Sum('tar_1ano_1rad_dpt'),
            tar_1ano_2dad_fipv=Sum('tar_1ano_2dad_fipv'),
            tar_1ano_2dad_hbpe=Sum('tar_1ano_2dad_hbpe'),
            tar_1ano_2dad_dpt=Sum('tar_1ano_2dad_dpt'),
            tar_1ano_3rad_bopv=Sum('tar_1ano_3rad_bopv'),
            tar_1ano_3rad_hbpe=Sum('tar_1ano_3rad_hbpe'),
            tar_1ano_3rad_dpt=Sum('tar_1ano_3rad_dpt'),
            tar_2ano_1rad_fipv=Sum('tar_2ano_1rad_fipv'),
            tar_2ano_1rad_srp=Sum('tar_2ano_1rad_srp'),
            tar_2ano_1rad_hbpe=Sum('tar_2ano_1rad_hbpe'),
            tar_2ano_1rad_dpt=Sum('tar_2ano_1rad_dpt'),
            tar_2ano_2dad_fipv=Sum('tar_2ano_2dad_fipv'),
            tar_2ano_2dad_srp=Sum('tar_2ano_2dad_srp'),
            tar_2ano_2dad_hbpe=Sum('tar_2ano_2dad_hbpe'),
            tar_2ano_2dad_dpt=Sum('tar_2ano_2dad_dpt'),
            tar_2ano_3rad_bopv=Sum('tar_2ano_3rad_bopv'),
            tar_2ano_3rad_hbpe=Sum('tar_2ano_3rad_hbpe'),
            tar_2ano_3rad_dpt=Sum('tar_2ano_3rad_dpt'),
            tar_2ano_4tad_bopv=Sum('tar_2ano_4tad_bopv'),
            tar_2ano_4tad_dpt=Sum('tar_2ano_4tad_dpt'),
            tar_2ano_dosi_fa=Sum('tar_2ano_dosi_fa'),
            tar_3ano_1rad_fipv=Sum('tar_3ano_1rad_fipv'),
            tar_3ano_1rad_srp=Sum('tar_3ano_1rad_srp'),
            tar_3ano_1rad_hbpe=Sum('tar_3ano_1rad_hbpe'),
            tar_3ano_1rad_dpt=Sum('tar_3ano_1rad_dpt'),
            tar_3ano_2dad_fipv=Sum('tar_3ano_2dad_fipv'),
            tar_3ano_2dad_srp=Sum('tar_3ano_2dad_srp'),
            tar_3ano_2dad_hbpe=Sum('tar_3ano_2dad_hbpe'),
            tar_3ano_2dad_dpt=Sum('tar_3ano_2dad_dpt'),
            tar_3ano_3rad_bopv=Sum('tar_3ano_3rad_bopv'),
            tar_3ano_3rad_hbpe=Sum('tar_3ano_3rad_hbpe'),
            tar_3ano_3rad_dpt=Sum('tar_3ano_3rad_dpt'),
            tar_3ano_4tad_bopv=Sum('tar_3ano_4tad_bopv'),
            tar_3ano_4tad_dpt=Sum('tar_3ano_4tad_dpt'),
            tar_3ano_dosi_fa=Sum('tar_3ano_dosi_fa'),
            tar_4ano_1rad_fipv=Sum('tar_4ano_1rad_fipv'),
            tar_4ano_1rad_srp=Sum('tar_4ano_1rad_srp'),
            tar_4ano_1rad_hbpe=Sum('tar_4ano_1rad_hbpe'),
            tar_4ano_1rad_dpt=Sum('tar_4ano_1rad_dpt'),
            tar_4ano_2dad_fipv=Sum('tar_4ano_2dad_fipv'),
            tar_4ano_2dad_srp=Sum('tar_4ano_2dad_srp'),
            tar_4ano_2dad_hbpe=Sum('tar_4ano_2dad_hbpe'),
            tar_4ano_2dad_dpt=Sum('tar_4ano_2dad_dpt'),
            tar_4ano_3rad_bopv=Sum('tar_4ano_3rad_bopv'),
            tar_4ano_3rad_hbpe=Sum('tar_4ano_3rad_hbpe'),
            tar_4ano_3rad_dpt=Sum('tar_4ano_3rad_dpt'),
            tar_4ano_4tad_bopv=Sum('tar_4ano_4tad_bopv'),
            tar_4ano_4tad_dpt=Sum('tar_4ano_4tad_dpt'),
            tar_4ano_dosi_fa=Sum('tar_4ano_dosi_fa'),
            tar_5ano_1rad_ipv=Sum('tar_5ano_1rad_ipv'),
            tar_5ano_1rad_srp=Sum('tar_5ano_1rad_srp'),
            tar_5ano_1rad_hbpe=Sum('tar_5ano_1rad_hbpe'),
            tar_5ano_1rad_dpt=Sum('tar_5ano_1rad_dpt'),
            tar_5ano_2dad_fipv=Sum('tar_5ano_2dad_fipv'),
            tar_5ano_2dad_srp=Sum('tar_5ano_2dad_srp'),
            tar_5ano_2dad_hbpe=Sum('tar_5ano_2dad_hbpe'),
            tar_5ano_2dad_dpt=Sum('tar_5ano_2dad_dpt'),
            tar_5ano_3rad_bopv=Sum('tar_5ano_3rad_bopv'),
            tar_5ano_3rad_hbpe=Sum('tar_5ano_3rad_hbpe'),
            tar_5ano_3rad_dpt=Sum('tar_5ano_3rad_dpt'),
            tar_5ano_4tad_bopv=Sum('tar_5ano_4tad_bopv'),
            tar_5ano_4tad_dpt=Sum('tar_5ano_4tad_dpt'),
            tar_5ano_dosi_fa=Sum('tar_5ano_dosi_fa'),
            tar_6ano_1rad_srp=Sum('tar_6ano_1rad_srp'),
            tar_6ano_2dad_srp=Sum('tar_6ano_2dad_srp'),
            tar_6ano_dosi_fa=Sum('tar_6ano_dosi_fa'),
            tar_7ano_1rad_sr=Sum('tar_7ano_1rad_sr'),
            tar_7ano_2dad_sr=Sum('tar_7ano_2dad_sr'),
            tar_7ano_dosi_fa=Sum('tar_7ano_dosi_fa'),
            tar_8ano_dosi_fa=Sum('tar_8ano_dosi_fa'),
            tar_7a14_dosi_dtad=Sum('tar_7a14_dosi_dtad'),
            tar_9a14_dosi_fa=Sum('tar_9a14_dosi_fa'),
            tar_15a19_dosi_fa=Sum('tar_15a19_dosi_fa'),
            tar_20a59_dosi_fa=Sum('tar_20a59_dosi_fa'),
            tar_8a14_1rad_sr=Sum('tar_8a14_1rad_sr'),
            tar_8a14_2dad_sr=Sum('tar_8a14_2dad_sr'),
            tar_15a29_1rad_sr=Sum('tar_15a29_1rad_sr'),
            tar_15a29_2dad_sr=Sum('tar_15a29_2dad_sr'),
            tar_30a50_1rad_sr=Sum('tar_30a50_1rad_sr'),
            tar_30a50_2dad_sr=Sum('tar_30a50_2dad_sr'),
            tar_16a49mefne_dtad_prim=Sum('tar_16a49mefne_dtad_prim'),
            tar_16a49mefne_dtad_segu=Sum('tar_16a49mefne_dtad_segu'),
            tar_16a49mefne_dtad_terc=Sum('tar_16a49mefne_dtad_terc'),
            tar_16a49mefne_dtad_cuar=Sum('tar_16a49mefne_dtad_cuar'),
            tar_16a49mefne_dtad_quin=Sum('tar_16a49mefne_dtad_quin'),
            tar_mefe_dtad_prim=Sum('tar_mefe_dtad_prim'),
            tar_mefe_dtad_segu=Sum('tar_mefe_dtad_segu'),
            tar_mefe_dtad_terc=Sum('tar_mefe_dtad_terc'),
            tar_mefe_dtad_cuar=Sum('tar_mefe_dtad_cuar'),
            tar_mefe_dtad_quin=Sum('tar_mefe_dtad_quin'),
            tar_16a49_dtad_prim=Sum('tar_16a49_dtad_prim'),
            tar_16a49_dtad_segu=Sum('tar_16a49_dtad_segu'),
            tar_16a49_dtad_terc=Sum('tar_16a49_dtad_terc'),
            tar_16a49_dtad_cuar=Sum('tar_16a49_dtad_cuar'),
            tar_16a49_dtad_quin=Sum('tar_16a49_dtad_quin'),
            tar_hepa_trasal_prim=Sum('tar_hepa_trasal_prim'),
            tar_hepa_trasal_segu=Sum('tar_hepa_trasal_segu'),
            tar_hepa_trasal_terc=Sum('tar_hepa_trasal_terc'),
            tar_hepa_estsal_prim=Sum('tar_hepa_estsal_prim'),
            tar_hepa_estsal_segu=Sum('tar_hepa_estsal_segu'),
            tar_hepa_estsal_terc=Sum('tar_hepa_estsal_terc'),
            tar_hepa_trasex_prim=Sum('tar_hepa_trasex_prim'),
            tar_hepa_trasex_segu=Sum('tar_hepa_trasex_segu'),
            tar_hepa_trasex_terc=Sum('tar_hepa_trasex_terc'),
            tar_hepa_pervih_prim=Sum('tar_hepa_pervih_prim'),
            tar_hepa_pervih_segu=Sum('tar_hepa_pervih_segu'),
            tar_hepa_pervih_terc=Sum('tar_hepa_pervih_terc'),
            tar_hepa_perppl_prim=Sum('tar_hepa_perppl_prim'),
            tar_hepa_perppl_segu=Sum('tar_hepa_perppl_segu'),
            tar_hepa_perppl_terc=Sum('tar_hepa_perppl_terc'),
            tar_hepa_otro_prim=Sum('tar_hepa_otro_prim'),
            tar_hepa_otro_segu=Sum('tar_hepa_otro_segu'),
            tar_hepa_otro_terc=Sum('tar_hepa_otro_terc'),
            tar_inmant=Sum('tar_inmant'),
            tar_inmanthep=Sum('tar_inmanthep'),
            tar_inmantrra=Sum('tar_inmantrra'),
        )

        # Actualizar o crear el registro total_record como en create_tardio
        total_record = tardio.objects.filter(
            eniUser_id=eni_user_id, tar_fech=fech_fin, tar_tota=True
        ).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.tar_intr = sum_totals['tar_intr'] or 0
            total_record.tar_extr_mies_cnh = sum_totals['tar_extr_mies_cnh'] or 0
            total_record.tar_extr_mies_cibv = sum_totals['tar_extr_mies_cibv'] or 0
            total_record.tar_extr_mine_egen = sum_totals['tar_extr_mine_egen'] or 0
            total_record.tar_extr_mine_bach = sum_totals['tar_extr_mine_bach'] or 0
            total_record.tar_extr_visi = sum_totals['tar_extr_visi'] or 0
            total_record.tar_extr_aten = sum_totals['tar_extr_aten'] or 0
            total_record.tar_otro = sum_totals['tar_otro'] or 0
            total_record.tar_sexo_homb = sum_totals['tar_sexo_homb'] or 0
            total_record.tar_sexo_muje = sum_totals['tar_sexo_muje'] or 0
            total_record.tar_luga_pert = sum_totals['tar_luga_pert'] or 0
            total_record.tar_luga_nope = sum_totals['tar_luga_nope'] or 0
            total_record.tar_naci_ecua = sum_totals['tar_naci_ecua'] or 0
            total_record.tar_naci_colo = sum_totals['tar_naci_colo'] or 0
            total_record.tar_naci_peru = sum_totals['tar_naci_peru'] or 0
            total_record.tar_naci_cuba = sum_totals['tar_naci_cuba'] or 0
            total_record.tar_naci_vene = sum_totals['tar_naci_vene'] or 0
            total_record.tar_naci_otro = sum_totals['tar_naci_otro'] or 0
            total_record.tar_auto_indi = sum_totals['tar_auto_indi'] or 0
            total_record.tar_auto_afro = sum_totals['tar_auto_afro'] or 0
            total_record.tar_auto_negr = sum_totals['tar_auto_negr'] or 0
            total_record.tar_auto_mula = sum_totals['tar_auto_mula'] or 0
            total_record.tar_auto_mont = sum_totals['tar_auto_mont'] or 0
            total_record.tar_auto_mest = sum_totals['tar_auto_mest'] or 0
            total_record.tar_auto_blan = sum_totals['tar_auto_blan'] or 0
            total_record.tar_auto_otro = sum_totals['tar_auto_otro'] or 0
            total_record.tar_naci_achu = sum_totals['tar_naci_achu'] or 0
            total_record.tar_naci_ando = sum_totals['tar_naci_ando'] or 0
            total_record.tar_naci_awa = sum_totals['tar_naci_awa'] or 0
            total_record.tar_naci_chac = sum_totals['tar_naci_chac'] or 0
            total_record.tar_naci_cofa = sum_totals['tar_naci_cofa'] or 0
            total_record.tar_naci_eper = sum_totals['tar_naci_eper'] or 0
            total_record.tar_naci_huan = sum_totals['tar_naci_huan'] or 0
            total_record.tar_naci_kich = sum_totals['tar_naci_kich'] or 0
            total_record.tar_naci_mant = sum_totals['tar_naci_mant'] or 0
            total_record.tar_naci_seco = sum_totals['tar_naci_seco'] or 0
            total_record.tar_naci_shiw = sum_totals['tar_naci_shiw'] or 0
            total_record.tar_naci_shua = sum_totals['tar_naci_shua'] or 0
            total_record.tar_naci_sion = sum_totals['tar_naci_sion'] or 0
            total_record.tar_naci_tsac = sum_totals['tar_naci_tsac'] or 0
            total_record.tar_naci_waor = sum_totals['tar_naci_waor'] or 0
            total_record.tar_naci_zapa = sum_totals['tar_naci_zapa'] or 0
            total_record.tar_pueb_chib = sum_totals['tar_pueb_chib'] or 0
            total_record.tar_pueb_kana = sum_totals['tar_pueb_kana'] or 0
            total_record.tar_pueb_kara = sum_totals['tar_pueb_kara'] or 0
            total_record.tar_pueb_kaya = sum_totals['tar_pueb_kaya'] or 0
            total_record.tar_pueb_kich = sum_totals['tar_pueb_kich'] or 0
            total_record.tar_pueb_kisa = sum_totals['tar_pueb_kisa'] or 0
            total_record.tar_pueb_kitu = sum_totals['tar_pueb_kitu'] or 0
            total_record.tar_pueb_nata = sum_totals['tar_pueb_nata'] or 0
            total_record.tar_pueb_otav = sum_totals['tar_pueb_otav'] or 0
            total_record.tar_pueb_palt = sum_totals['tar_pueb_palt'] or 0
            total_record.tar_pueb_panz = sum_totals['tar_pueb_panz'] or 0
            total_record.tar_pueb_past = sum_totals['tar_pueb_past'] or 0
            total_record.tar_pueb_puru = sum_totals['tar_pueb_puru'] or 0
            total_record.tar_pueb_sala = sum_totals['tar_pueb_sala'] or 0
            total_record.tar_pueb_sara = sum_totals['tar_pueb_sara'] or 0
            total_record.tar_pueb_toma = sum_totals['tar_pueb_toma'] or 0
            total_record.tar_pueb_wara = sum_totals['tar_pueb_wara'] or 0
            total_record.tar_1ano_1rad_fipv = sum_totals['tar_1ano_1rad_fipv'] or 0
            total_record.tar_1ano_1rad_hbpe = sum_totals['tar_1ano_1rad_hbpe'] or 0
            total_record.tar_1ano_1rad_dpt = sum_totals['tar_1ano_1rad_dpt'] or 0
            total_record.tar_1ano_2dad_fipv = sum_totals['tar_1ano_2dad_fipv'] or 0
            total_record.tar_1ano_2dad_hbpe = sum_totals['tar_1ano_2dad_hbpe'] or 0
            total_record.tar_1ano_2dad_dpt = sum_totals['tar_1ano_2dad_dpt'] or 0
            total_record.tar_1ano_3rad_bopv = sum_totals['tar_1ano_3rad_bopv'] or 0
            total_record.tar_1ano_3rad_hbpe = sum_totals['tar_1ano_3rad_hbpe'] or 0
            total_record.tar_1ano_3rad_dpt = sum_totals['tar_1ano_3rad_dpt'] or 0
            total_record.tar_2ano_1rad_fipv = sum_totals['tar_2ano_1rad_fipv'] or 0
            total_record.tar_2ano_1rad_srp = sum_totals['tar_2ano_1rad_srp'] or 0
            total_record.tar_2ano_1rad_hbpe = sum_totals['tar_2ano_1rad_hbpe'] or 0
            total_record.tar_2ano_1rad_dpt = sum_totals['tar_2ano_1rad_dpt'] or 0
            total_record.tar_2ano_2dad_fipv = sum_totals['tar_2ano_2dad_fipv'] or 0
            total_record.tar_2ano_2dad_srp = sum_totals['tar_2ano_2dad_srp'] or 0
            total_record.tar_2ano_2dad_hbpe = sum_totals['tar_2ano_2dad_hbpe'] or 0
            total_record.tar_2ano_2dad_dpt = sum_totals['tar_2ano_2dad_dpt'] or 0
            total_record.tar_2ano_3rad_bopv = sum_totals['tar_2ano_3rad_bopv'] or 0
            total_record.tar_2ano_3rad_hbpe = sum_totals['tar_2ano_3rad_hbpe'] or 0
            total_record.tar_2ano_3rad_dpt = sum_totals['tar_2ano_3rad_dpt'] or 0
            total_record.tar_2ano_4tad_bopv = sum_totals['tar_2ano_4tad_bopv'] or 0
            total_record.tar_2ano_4tad_dpt = sum_totals['tar_2ano_4tad_dpt'] or 0
            total_record.tar_2ano_dosi_fa = sum_totals['tar_2ano_dosi_fa'] or 0
            total_record.tar_3ano_1rad_fipv = sum_totals['tar_3ano_1rad_fipv'] or 0
            total_record.tar_3ano_1rad_srp = sum_totals['tar_3ano_1rad_srp'] or 0
            total_record.tar_3ano_1rad_hbpe = sum_totals['tar_3ano_1rad_hbpe'] or 0
            total_record.tar_3ano_1rad_dpt = sum_totals['tar_3ano_1rad_dpt'] or 0
            total_record.tar_3ano_2dad_fipv = sum_totals['tar_3ano_2dad_fipv'] or 0
            total_record.tar_3ano_2dad_srp = sum_totals['tar_3ano_2dad_srp'] or 0
            total_record.tar_3ano_2dad_hbpe = sum_totals['tar_3ano_2dad_hbpe'] or 0
            total_record.tar_3ano_2dad_dpt = sum_totals['tar_3ano_2dad_dpt'] or 0
            total_record.tar_3ano_3rad_bopv = sum_totals['tar_3ano_3rad_bopv'] or 0
            total_record.tar_3ano_3rad_hbpe = sum_totals['tar_3ano_3rad_hbpe'] or 0
            total_record.tar_3ano_3rad_dpt = sum_totals['tar_3ano_3rad_dpt'] or 0
            total_record.tar_3ano_4tad_bopv = sum_totals['tar_3ano_4tad_bopv'] or 0
            total_record.tar_3ano_4tad_dpt = sum_totals['tar_3ano_4tad_dpt'] or 0
            total_record.tar_3ano_dosi_fa = sum_totals['tar_3ano_dosi_fa'] or 0
            total_record.tar_4ano_1rad_fipv = sum_totals['tar_4ano_1rad_fipv'] or 0
            total_record.tar_4ano_1rad_srp = sum_totals['tar_4ano_1rad_srp'] or 0
            total_record.tar_4ano_1rad_hbpe = sum_totals['tar_4ano_1rad_hbpe'] or 0
            total_record.tar_4ano_1rad_dpt = sum_totals['tar_4ano_1rad_dpt'] or 0
            total_record.tar_4ano_2dad_fipv = sum_totals['tar_4ano_2dad_fipv'] or 0
            total_record.tar_4ano_2dad_srp = sum_totals['tar_4ano_2dad_srp'] or 0
            total_record.tar_4ano_2dad_hbpe = sum_totals['tar_4ano_2dad_hbpe'] or 0
            total_record.tar_4ano_2dad_dpt = sum_totals['tar_4ano_2dad_dpt'] or 0
            total_record.tar_4ano_3rad_bopv = sum_totals['tar_4ano_3rad_bopv'] or 0
            total_record.tar_4ano_3rad_hbpe = sum_totals['tar_4ano_3rad_hbpe'] or 0
            total_record.tar_4ano_3rad_dpt = sum_totals['tar_4ano_3rad_dpt'] or 0
            total_record.tar_4ano_4tad_bopv = sum_totals['tar_4ano_4tad_bopv'] or 0
            total_record.tar_4ano_4tad_dpt = sum_totals['tar_4ano_4tad_dpt'] or 0
            total_record.tar_4ano_dosi_fa = sum_totals['tar_4ano_dosi_fa'] or 0
            total_record.tar_5ano_1rad_ipv = sum_totals['tar_5ano_1rad_ipv'] or 0
            total_record.tar_5ano_1rad_srp = sum_totals['tar_5ano_1rad_srp'] or 0
            total_record.tar_5ano_1rad_hbpe = sum_totals['tar_5ano_1rad_hbpe'] or 0
            total_record.tar_5ano_1rad_dpt = sum_totals['tar_5ano_1rad_dpt'] or 0
            total_record.tar_5ano_2dad_fipv = sum_totals['tar_5ano_2dad_fipv'] or 0
            total_record.tar_5ano_2dad_srp = sum_totals['tar_5ano_2dad_srp'] or 0
            total_record.tar_5ano_2dad_hbpe = sum_totals['tar_5ano_2dad_hbpe'] or 0
            total_record.tar_5ano_2dad_dpt = sum_totals['tar_5ano_2dad_dpt'] or 0
            total_record.tar_5ano_3rad_bopv = sum_totals['tar_5ano_3rad_bopv'] or 0
            total_record.tar_5ano_3rad_hbpe = sum_totals['tar_5ano_3rad_hbpe'] or 0
            total_record.tar_5ano_3rad_dpt = sum_totals['tar_5ano_3rad_dpt'] or 0
            total_record.tar_5ano_4tad_bopv = sum_totals['tar_5ano_4tad_bopv'] or 0
            total_record.tar_5ano_4tad_dpt = sum_totals['tar_5ano_4tad_dpt'] or 0
            total_record.tar_5ano_dosi_fa = sum_totals['tar_5ano_dosi_fa'] or 0
            total_record.tar_6ano_1rad_srp = sum_totals['tar_6ano_1rad_srp'] or 0
            total_record.tar_6ano_2dad_srp = sum_totals['tar_6ano_2dad_srp'] or 0
            total_record.tar_6ano_dosi_fa = sum_totals['tar_6ano_dosi_fa'] or 0
            total_record.tar_7ano_1rad_sr = sum_totals['tar_7ano_1rad_sr'] or 0
            total_record.tar_7ano_2dad_sr = sum_totals['tar_7ano_2dad_sr'] or 0
            total_record.tar_7ano_dosi_fa = sum_totals['tar_7ano_dosi_fa'] or 0
            total_record.tar_8ano_dosi_fa = sum_totals['tar_8ano_dosi_fa'] or 0
            total_record.tar_7a14_dosi_dtad = sum_totals['tar_7a14_dosi_dtad'] or 0
            total_record.tar_9a14_dosi_fa = sum_totals['tar_9a14_dosi_fa'] or 0
            total_record.tar_15a19_dosi_fa = sum_totals['tar_15a19_dosi_fa'] or 0
            total_record.tar_20a59_dosi_fa = sum_totals['tar_20a59_dosi_fa'] or 0
            total_record.tar_8a14_1rad_sr = sum_totals['tar_8a14_1rad_sr'] or 0
            total_record.tar_8a14_2dad_sr = sum_totals['tar_8a14_2dad_sr'] or 0
            total_record.tar_15a29_1rad_sr = sum_totals['tar_15a29_1rad_sr'] or 0
            total_record.tar_15a29_2dad_sr = sum_totals['tar_15a29_2dad_sr'] or 0
            total_record.tar_30a50_1rad_sr = sum_totals['tar_30a50_1rad_sr'] or 0
            total_record.tar_30a50_2dad_sr = sum_totals['tar_30a50_2dad_sr'] or 0
            total_record.tar_16a49mefne_dtad_prim = sum_totals['tar_16a49mefne_dtad_prim'] or 0
            total_record.tar_16a49mefne_dtad_segu = sum_totals['tar_16a49mefne_dtad_segu'] or 0
            total_record.tar_16a49mefne_dtad_terc = sum_totals['tar_16a49mefne_dtad_terc'] or 0
            total_record.tar_16a49mefne_dtad_cuar = sum_totals['tar_16a49mefne_dtad_cuar'] or 0
            total_record.tar_16a49mefne_dtad_quin = sum_totals['tar_16a49mefne_dtad_quin'] or 0
            total_record.tar_mefe_dtad_prim = sum_totals['tar_mefe_dtad_prim'] or 0
            total_record.tar_mefe_dtad_segu = sum_totals['tar_mefe_dtad_segu'] or 0
            total_record.tar_mefe_dtad_terc = sum_totals['tar_mefe_dtad_terc'] or 0
            total_record.tar_mefe_dtad_cuar = sum_totals['tar_mefe_dtad_cuar'] or 0
            total_record.tar_mefe_dtad_quin = sum_totals['tar_mefe_dtad_quin'] or 0
            total_record.tar_16a49_dtad_prim = sum_totals['tar_16a49_dtad_prim'] or 0
            total_record.tar_16a49_dtad_segu = sum_totals['tar_16a49_dtad_segu'] or 0
            total_record.tar_16a49_dtad_terc = sum_totals['tar_16a49_dtad_terc'] or 0
            total_record.tar_16a49_dtad_cuar = sum_totals['tar_16a49_dtad_cuar'] or 0
            total_record.tar_16a49_dtad_quin = sum_totals['tar_16a49_dtad_quin'] or 0
            total_record.tar_hepa_trasal_prim = sum_totals['tar_hepa_trasal_prim'] or 0
            total_record.tar_hepa_trasal_segu = sum_totals['tar_hepa_trasal_segu'] or 0
            total_record.tar_hepa_trasal_terc = sum_totals['tar_hepa_trasal_terc'] or 0
            total_record.tar_hepa_estsal_prim = sum_totals['tar_hepa_estsal_prim'] or 0
            total_record.tar_hepa_estsal_segu = sum_totals['tar_hepa_estsal_segu'] or 0
            total_record.tar_hepa_estsal_terc = sum_totals['tar_hepa_estsal_terc'] or 0
            total_record.tar_hepa_trasex_prim = sum_totals['tar_hepa_trasex_prim'] or 0
            total_record.tar_hepa_trasex_segu = sum_totals['tar_hepa_trasex_segu'] or 0
            total_record.tar_hepa_trasex_terc = sum_totals['tar_hepa_trasex_terc'] or 0
            total_record.tar_hepa_pervih_prim = sum_totals['tar_hepa_pervih_prim'] or 0
            total_record.tar_hepa_pervih_segu = sum_totals['tar_hepa_pervih_segu'] or 0
            total_record.tar_hepa_pervih_terc = sum_totals['tar_hepa_pervih_terc'] or 0
            total_record.tar_hepa_perppl_prim = sum_totals['tar_hepa_perppl_prim'] or 0
            total_record.tar_hepa_perppl_segu = sum_totals['tar_hepa_perppl_segu'] or 0
            total_record.tar_hepa_perppl_terc = sum_totals['tar_hepa_perppl_terc'] or 0
            total_record.tar_hepa_otro_prim = sum_totals['tar_hepa_otro_prim'] or 0
            total_record.tar_hepa_otro_segu = sum_totals['tar_hepa_otro_segu'] or 0
            total_record.tar_hepa_otro_terc = sum_totals['tar_hepa_otro_terc'] or 0
            total_record.tar_inmant = sum_totals['tar_inmant'] or 0
            total_record.tar_inmanthep = sum_totals['tar_inmanthep'] or 0
            total_record.tar_inmantrra = sum_totals['tar_inmantrra'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            tardio.objects.create(
                tar_fech=fech_fin,
                eniUser_id=eni_user_id,
                tar_tota=True,
                tar_intr=sum_totals['tar_intr'] or 0,
                tar_extr_mies_cnh=sum_totals['tar_extr_mies_cnh'] or 0,
                tar_extr_mies_cibv=sum_totals['tar_extr_mies_cibv'] or 0,
                tar_extr_mine_egen=sum_totals['tar_extr_mine_egen'] or 0,
                tar_extr_mine_bach=sum_totals['tar_extr_mine_bach'] or 0,
                tar_extr_visi=sum_totals['tar_extr_visi'] or 0,
                tar_extr_aten=sum_totals['tar_extr_aten'] or 0,
                tar_otro=sum_totals['tar_otro'] or 0,
                tar_sexo_homb=sum_totals['tar_sexo_homb'] or 0,
                tar_sexo_muje=sum_totals['tar_sexo_muje'] or 0,
                tar_luga_pert=sum_totals['tar_luga_pert'] or 0,
                tar_luga_nope=sum_totals['tar_luga_nope'] or 0,
                tar_naci_ecua=sum_totals['tar_naci_ecua'] or 0,
                tar_naci_colo=sum_totals['tar_naci_colo'] or 0,
                tar_naci_peru=sum_totals['tar_naci_peru'] or 0,
                tar_naci_cuba=sum_totals['tar_naci_cuba'] or 0,
                tar_naci_vene=sum_totals['tar_naci_vene'] or 0,
                tar_naci_otro=sum_totals['tar_naci_otro'] or 0,
                tar_auto_indi=sum_totals['tar_auto_indi'] or 0,
                tar_auto_afro=sum_totals['tar_auto_afro'] or 0,
                tar_auto_negr=sum_totals['tar_auto_negr'] or 0,
                tar_auto_mula=sum_totals['tar_auto_mula'] or 0,
                tar_auto_mont=sum_totals['tar_auto_mont'] or 0,
                tar_auto_mest=sum_totals['tar_auto_mest'] or 0,
                tar_auto_blan=sum_totals['tar_auto_blan'] or 0,
                tar_auto_otro=sum_totals['tar_auto_otro'] or 0,
                tar_naci_achu=sum_totals['tar_naci_achu'] or 0,
                tar_naci_ando=sum_totals['tar_naci_ando'] or 0,
                tar_naci_awa=sum_totals['tar_naci_awa'] or 0,
                tar_naci_chac=sum_totals['tar_naci_chac'] or 0,
                tar_naci_cofa=sum_totals['tar_naci_cofa'] or 0,
                tar_naci_eper=sum_totals['tar_naci_eper'] or 0,
                tar_naci_huan=sum_totals['tar_naci_huan'] or 0,
                tar_naci_kich=sum_totals['tar_naci_kich'] or 0,
                tar_naci_mant=sum_totals['tar_naci_mant'] or 0,
                tar_naci_seco=sum_totals['tar_naci_seco'] or 0,
                tar_naci_shiw=sum_totals['tar_naci_shiw'] or 0,
                tar_naci_shua=sum_totals['tar_naci_shua'] or 0,
                tar_naci_sion=sum_totals['tar_naci_sion'] or 0,
                tar_naci_tsac=sum_totals['tar_naci_tsac'] or 0,
                tar_naci_waor=sum_totals['tar_naci_waor'] or 0,
                tar_naci_zapa=sum_totals['tar_naci_zapa'] or 0,
                tar_pueb_chib=sum_totals['tar_pueb_chib'] or 0,
                tar_pueb_kana=sum_totals['tar_pueb_kana'] or 0,
                tar_pueb_kara=sum_totals['tar_pueb_kara'] or 0,
                tar_pueb_kaya=sum_totals['tar_pueb_kaya'] or 0,
                tar_pueb_kich=sum_totals['tar_pueb_kich'] or 0,
                tar_pueb_kisa=sum_totals['tar_pueb_kisa'] or 0,
                tar_pueb_kitu=sum_totals['tar_pueb_kitu'] or 0,
                tar_pueb_nata=sum_totals['tar_pueb_nata'] or 0,
                tar_pueb_otav=sum_totals['tar_pueb_otav'] or 0,
                tar_pueb_palt=sum_totals['tar_pueb_palt'] or 0,
                tar_pueb_panz=sum_totals['tar_pueb_panz'] or 0,
                tar_pueb_past=sum_totals['tar_pueb_past'] or 0,
                tar_pueb_puru=sum_totals['tar_pueb_puru'] or 0,
                tar_pueb_sala=sum_totals['tar_pueb_sala'] or 0,
                tar_pueb_sara=sum_totals['tar_pueb_sara'] or 0,
                tar_pueb_toma=sum_totals['tar_pueb_toma'] or 0,
                tar_pueb_wara=sum_totals['tar_pueb_wara'] or 0,
                tar_1ano_1rad_fipv=sum_totals['tar_1ano_1rad_fipv'] or 0,
                tar_1ano_1rad_hbpe=sum_totals['tar_1ano_1rad_hbpe'] or 0,
                tar_1ano_1rad_dpt=sum_totals['tar_1ano_1rad_dpt'] or 0,
                tar_1ano_2dad_fipv=sum_totals['tar_1ano_2dad_fipv'] or 0,
                tar_1ano_2dad_hbpe=sum_totals['tar_1ano_2dad_hbpe'] or 0,
                tar_1ano_2dad_dpt=sum_totals['tar_1ano_2dad_dpt'] or 0,
                tar_1ano_3rad_bopv=sum_totals['tar_1ano_3rad_bopv'] or 0,
                tar_1ano_3rad_hbpe=sum_totals['tar_1ano_3rad_hbpe'] or 0,
                tar_1ano_3rad_dpt=sum_totals['tar_1ano_3rad_dpt'] or 0,
                tar_2ano_1rad_fipv=sum_totals['tar_2ano_1rad_fipv'] or 0,
                tar_2ano_1rad_srp=sum_totals['tar_2ano_1rad_srp'] or 0,
                tar_2ano_1rad_hbpe=sum_totals['tar_2ano_1rad_hbpe'] or 0,
                tar_2ano_1rad_dpt=sum_totals['tar_2ano_1rad_dpt'] or 0,
                tar_2ano_2dad_fipv=sum_totals['tar_2ano_2dad_fipv'] or 0,
                tar_2ano_2dad_srp=sum_totals['tar_2ano_2dad_srp'] or 0,
                tar_2ano_2dad_hbpe=sum_totals['tar_2ano_2dad_hbpe'] or 0,
                tar_2ano_2dad_dpt=sum_totals['tar_2ano_2dad_dpt'] or 0,
                tar_2ano_3rad_bopv=sum_totals['tar_2ano_3rad_bopv'] or 0,
                tar_2ano_3rad_hbpe=sum_totals['tar_2ano_3rad_hbpe'] or 0,
                tar_2ano_3rad_dpt=sum_totals['tar_2ano_3rad_dpt'] or 0,
                tar_2ano_4tad_bopv=sum_totals['tar_2ano_4tad_bopv'] or 0,
                tar_2ano_4tad_dpt=sum_totals['tar_2ano_4tad_dpt'] or 0,
                tar_2ano_dosi_fa=sum_totals['tar_2ano_dosi_fa'] or 0,
                tar_3ano_1rad_fipv=sum_totals['tar_3ano_1rad_fipv'] or 0,
                tar_3ano_1rad_srp=sum_totals['tar_3ano_1rad_srp'] or 0,
                tar_3ano_1rad_hbpe=sum_totals['tar_3ano_1rad_hbpe'] or 0,
                tar_3ano_1rad_dpt=sum_totals['tar_3ano_1rad_dpt'] or 0,
                tar_3ano_2dad_fipv=sum_totals['tar_3ano_2dad_fipv'] or 0,
                tar_3ano_2dad_srp=sum_totals['tar_3ano_2dad_srp'] or 0,
                tar_3ano_2dad_hbpe=sum_totals['tar_3ano_2dad_hbpe'] or 0,
                tar_3ano_2dad_dpt=sum_totals['tar_3ano_2dad_dpt'] or 0,
                tar_3ano_3rad_bopv=sum_totals['tar_3ano_3rad_bopv'] or 0,
                tar_3ano_3rad_hbpe=sum_totals['tar_3ano_3rad_hbpe'] or 0,
                tar_3ano_3rad_dpt=sum_totals['tar_3ano_3rad_dpt'] or 0,
                tar_3ano_4tad_bopv=sum_totals['tar_3ano_4tad_bopv'] or 0,
                tar_3ano_4tad_dpt=sum_totals['tar_3ano_4tad_dpt'] or 0,
                tar_3ano_dosi_fa=sum_totals['tar_3ano_dosi_fa'] or 0,
                tar_4ano_1rad_fipv=sum_totals['tar_4ano_1rad_fipv'] or 0,
                tar_4ano_1rad_srp=sum_totals['tar_4ano_1rad_srp'] or 0,
                tar_4ano_1rad_hbpe=sum_totals['tar_4ano_1rad_hbpe'] or 0,
                tar_4ano_1rad_dpt=sum_totals['tar_4ano_1rad_dpt'] or 0,
                tar_4ano_2dad_fipv=sum_totals['tar_4ano_2dad_fipv'] or 0,
                tar_4ano_2dad_srp=sum_totals['tar_4ano_2dad_srp'] or 0,
                tar_4ano_2dad_hbpe=sum_totals['tar_4ano_2dad_hbpe'] or 0,
                tar_4ano_2dad_dpt=sum_totals['tar_4ano_2dad_dpt'] or 0,
                tar_4ano_3rad_bopv=sum_totals['tar_4ano_3rad_bopv'] or 0,
                tar_4ano_3rad_hbpe=sum_totals['tar_4ano_3rad_hbpe'] or 0,
                tar_4ano_3rad_dpt=sum_totals['tar_4ano_3rad_dpt'] or 0,
                tar_4ano_4tad_bopv=sum_totals['tar_4ano_4tad_bopv'] or 0,
                tar_4ano_4tad_dpt=sum_totals['tar_4ano_4tad_dpt'] or 0,
                tar_4ano_dosi_fa=sum_totals['tar_4ano_dosi_fa'] or 0,
                tar_5ano_1rad_ipv=sum_totals['tar_5ano_1rad_ipv'] or 0,
                tar_5ano_1rad_srp=sum_totals['tar_5ano_1rad_srp'] or 0,
                tar_5ano_1rad_hbpe=sum_totals['tar_5ano_1rad_hbpe'] or 0,
                tar_5ano_1rad_dpt=sum_totals['tar_5ano_1rad_dpt'] or 0,
                tar_5ano_2dad_fipv=sum_totals['tar_5ano_2dad_fipv'] or 0,
                tar_5ano_2dad_srp=sum_totals['tar_5ano_2dad_srp'] or 0,
                tar_5ano_2dad_hbpe=sum_totals['tar_5ano_2dad_hbpe'] or 0,
                tar_5ano_2dad_dpt=sum_totals['tar_5ano_2dad_dpt'] or 0,
                tar_5ano_3rad_bopv=sum_totals['tar_5ano_3rad_bopv'] or 0,
                tar_5ano_3rad_hbpe=sum_totals['tar_5ano_3rad_hbpe'] or 0,
                tar_5ano_3rad_dpt=sum_totals['tar_5ano_3rad_dpt'] or 0,
                tar_5ano_4tad_bopv=sum_totals['tar_5ano_4tad_bopv'] or 0,
                tar_5ano_4tad_dpt=sum_totals['tar_5ano_4tad_dpt'] or 0,
                tar_5ano_dosi_fa=sum_totals['tar_5ano_dosi_fa'] or 0,
                tar_6ano_1rad_srp=sum_totals['tar_6ano_1rad_srp'] or 0,
                tar_6ano_2dad_srp=sum_totals['tar_6ano_2dad_srp'] or 0,
                tar_6ano_dosi_fa=sum_totals['tar_6ano_dosi_fa'] or 0,
                tar_7ano_1rad_sr=sum_totals['tar_7ano_1rad_sr'] or 0,
                tar_7ano_2dad_sr=sum_totals['tar_7ano_2dad_sr'] or 0,
                tar_7ano_dosi_fa=sum_totals['tar_7ano_dosi_fa'] or 0,
                tar_8ano_dosi_fa=sum_totals['tar_8ano_dosi_fa'] or 0,
                tar_7a14_dosi_dtad=sum_totals['tar_7a14_dosi_dtad'] or 0,
                tar_9a14_dosi_fa=sum_totals['tar_9a14_dosi_fa'] or 0,
                tar_15a19_dosi_fa=sum_totals['tar_15a19_dosi_fa'] or 0,
                tar_20a59_dosi_fa=sum_totals['tar_20a59_dosi_fa'] or 0,
                tar_8a14_1rad_sr=sum_totals['tar_8a14_1rad_sr'] or 0,
                tar_8a14_2dad_sr=sum_totals['tar_8a14_2dad_sr'] or 0,
                tar_15a29_1rad_sr=sum_totals['tar_15a29_1rad_sr'] or 0,
                tar_15a29_2dad_sr=sum_totals['tar_15a29_2dad_sr'] or 0,
                tar_30a50_1rad_sr=sum_totals['tar_30a50_1rad_sr'] or 0,
                tar_30a50_2dad_sr=sum_totals['tar_30a50_2dad_sr'] or 0,
                tar_16a49mefne_dtad_prim=sum_totals['tar_16a49mefne_dtad_prim'] or 0,
                tar_16a49mefne_dtad_segu=sum_totals['tar_16a49mefne_dtad_segu'] or 0,
                tar_16a49mefne_dtad_terc=sum_totals['tar_16a49mefne_dtad_terc'] or 0,
                tar_16a49mefne_dtad_cuar=sum_totals['tar_16a49mefne_dtad_cuar'] or 0,
                tar_16a49mefne_dtad_quin=sum_totals['tar_16a49mefne_dtad_quin'] or 0,
                tar_mefe_dtad_prim=sum_totals['tar_mefe_dtad_prim'] or 0,
                tar_mefe_dtad_segu=sum_totals['tar_mefe_dtad_segu'] or 0,
                tar_mefe_dtad_terc=sum_totals['tar_mefe_dtad_terc'] or 0,
                tar_mefe_dtad_cuar=sum_totals['tar_mefe_dtad_cuar'] or 0,
                tar_mefe_dtad_quin=sum_totals['tar_mefe_dtad_quin'] or 0,
                tar_16a49_dtad_prim=sum_totals['tar_16a49_dtad_prim'] or 0,
                tar_16a49_dtad_segu=sum_totals['tar_16a49_dtad_segu'] or 0,
                tar_16a49_dtad_terc=sum_totals['tar_16a49_dtad_terc'] or 0,
                tar_16a49_dtad_cuar=sum_totals['tar_16a49_dtad_cuar'] or 0,
                tar_16a49_dtad_quin=sum_totals['tar_16a49_dtad_quin'] or 0,
                tar_hepa_trasal_prim=sum_totals['tar_hepa_trasal_prim'] or 0,
                tar_hepa_trasal_segu=sum_totals['tar_hepa_trasal_segu'] or 0,
                tar_hepa_trasal_terc=sum_totals['tar_hepa_trasal_terc'] or 0,
                tar_hepa_estsal_prim=sum_totals['tar_hepa_estsal_prim'] or 0,
                tar_hepa_estsal_segu=sum_totals['tar_hepa_estsal_segu'] or 0,
                tar_hepa_estsal_terc=sum_totals['tar_hepa_estsal_terc'] or 0,
                tar_hepa_trasex_prim=sum_totals['tar_hepa_trasex_prim'] or 0,
                tar_hepa_trasex_segu=sum_totals['tar_hepa_trasex_segu'] or 0,
                tar_hepa_trasex_terc=sum_totals['tar_hepa_trasex_terc'] or 0,
                tar_hepa_pervih_prim=sum_totals['tar_hepa_pervih_prim'] or 0,
                tar_hepa_pervih_segu=sum_totals['tar_hepa_pervih_segu'] or 0,
                tar_hepa_pervih_terc=sum_totals['tar_hepa_pervih_terc'] or 0,
                tar_hepa_perppl_prim=sum_totals['tar_hepa_perppl_prim'] or 0,
                tar_hepa_perppl_segu=sum_totals['tar_hepa_perppl_segu'] or 0,
                tar_hepa_perppl_terc=sum_totals['tar_hepa_perppl_terc'] or 0,
                tar_hepa_otro_prim=sum_totals['tar_hepa_otro_prim'] or 0,
                tar_hepa_otro_segu=sum_totals['tar_hepa_otro_segu'] or 0,
                tar_hepa_otro_terc=sum_totals['tar_hepa_otro_terc'] or 0,
                tar_inmant=sum_totals['tar_inmant'] or 0,
                tar_inmanthep=sum_totals['tar_inmanthep'] or 0,
                tar_inmantrra=sum_totals['tar_inmantrra'] or 0,
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tar_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las variables de los valores que se utilizan en Tardio y Desperdicio
        des_hbpe_dosapli = int(data.get('tar_1ano_1rad_hbpe', 0)) + int(data.get('tar_1ano_2dad_hbpe', 0)) + int(data.get('tar_1ano_3rad_hbpe', 0)) + int(data.get('tar_2ano_1rad_hbpe', 0)) + int(data.get('tar_2ano_2dad_hbpe', 0)) + int(data.get('tar_2ano_3rad_hbpe', 0)) + int(data.get('tar_3ano_1rad_hbpe', 0)) + int(
            data.get('tar_3ano_2dad_hbpe', 0)) + int(data.get('tar_3ano_3rad_hbpe', 0)) + int(data.get('tar_4ano_1rad_hbpe', 0)) + int(data.get('tar_4ano_2dad_hbpe', 0)) + int(data.get('tar_4ano_3rad_hbpe', 0)) + int(data.get('tar_5ano_1rad_hbpe', 0)) + int(data.get('tar_5ano_2dad_hbpe', 0)) + int(data.get('tar_5ano_3rad_hbpe', 0))
        des_fipv_dosapli = int(data.get('tar_1ano_1rad_fipv', 0)) + int(data.get('tar_1ano_2dad_fipv', 0)) + int(data.get('tar_2ano_1rad_fipv', 0)) + int(data.get('tar_2ano_2dad_fipv', 0)) + int(data.get('tar_3ano_1rad_fipv', 0)) + \
            int(data.get('tar_3ano_2dad_fipv', 0)) + int(data.get('tar_4ano_1rad_fipv', 0)) + int(data.get(
                'tar_4ano_2dad_fipv', 0)) + int(data.get('tar_5ano_1rad_ipv', 0)) + int(data.get('tar_5ano_2dad_fipv', 0))
        des_anti_dosapli = int(data.get('tar_1ano_3rad_bopv', 0)) + int(data.get('tar_2ano_3rad_bopv', 0)) + int(data.get('tar_2ano_4tad_bopv', 0)) + int(data.get('tar_3ano_3rad_bopv', 0)) + int(
            data.get('tar_3ano_4tad_bopv', 0)) + int(data.get('tar_4ano_3rad_bopv', 0)) + int(data.get('tar_5ano_3rad_bopv', 0)) + int(data.get('tar_5ano_4tad_bopv', 0)) + int(data.get('tar_4ano_4tad_bopv', 0))
        des_sr_dosapli = int(data.get('tar_7ano_1rad_sr', 0)) + int(data.get('tar_7ano_2dad_sr', 0)) + int(data.get('tar_8a14_1rad_sr', 0)) + int(data.get('tar_8a14_2dad_sr', 0)) + \
            int(data.get('tar_15a29_1rad_sr', 0)) + int(data.get('tar_15a29_2dad_sr', 0)) + \
            int(data.get('tar_30a50_1rad_sr', 0)) + \
            int(data.get('tar_30a50_2dad_sr', 0))
        des_srp_dosapli = int(data.get('tar_2ano_1rad_srp', 0)) + int(data.get('tar_2ano_2dad_srp', 0)) + int(data.get('tar_3ano_1rad_srp', 0)) + int(data.get('tar_3ano_2dad_srp', 0)) + int(data.get('tar_4ano_1rad_srp', 0)) + \
            int(data.get('tar_4ano_2dad_srp', 0)) + int(data.get('tar_5ano_1rad_srp', 0)) + int(data.get(
                'tar_5ano_2dad_srp', 0)) + int(data.get('tar_6ano_1rad_srp', 0)) + int(data.get('tar_6ano_2dad_srp', 0))
        des_fieb_dosapli = int(data.get('tar_2ano_dosi_fa', 0)) + int(data.get('tar_3ano_dosi_fa', 0)) + int(data.get('tar_4ano_dosi_fa', 0)) + int(data.get('tar_5ano_dosi_fa', 0)) + int(data.get('tar_6ano_dosi_fa', 0)) + \
            int(data.get('tar_7ano_dosi_fa', 0)) + int(data.get('tar_8ano_dosi_fa', 0)) + int(data.get(
                'tar_9a14_dosi_fa', 0)) + int(data.get('tar_15a19_dosi_fa', 0)) + int(data.get('tar_20a59_dosi_fa', 0))
        des_dift_dosapli = int(data.get('tar_1ano_1rad_dpt', 0)) + int(data.get('tar_1ano_2dad_dpt', 0)) + int(data.get('tar_1ano_3rad_dpt', 0)) + int(data.get('tar_2ano_1rad_dpt', 0)) + int(data.get('tar_2ano_2dad_dpt', 0)) + int(data.get('tar_2ano_3rad_dpt', 0)) + int(data.get('tar_2ano_4tad_dpt', 0)) + int(data.get('tar_3ano_1rad_dpt', 0)) + \
            int(data.get('tar_3ano_2dad_dpt', 0)) + int(
            data.get('tar_3ano_3rad_dpt', 0)) + int(data.get('tar_3ano_4tad_dpt', 0)) + int(data.get('tar_4ano_1rad_dpt', 0)) + int(data.get('tar_4ano_2dad_dpt', 0)) + int(data.get('tar_4ano_3rad_dpt', 0)) + int(data.get('tar_4ano_4tad_dpt', 0)) + int(data.get('tar_5ano_1rad_dpt', 0)) + int(data.get('tar_5ano_2dad_dpt', 0)) + \
            int(data.get('tar_5ano_3rad_dpt', 0)) + \
            int(data.get('tar_5ano_4tad_dpt', 0))
        des_dtad_dosapli = int(data.get('tar_7a14_dosi_dtad', 0)) + int(data.get('tar_16a49mefne_dtad_prim', 0)) + int(data.get('tar_16a49mefne_dtad_segu', 0)) + int(data.get('tar_16a49mefne_dtad_terc', 0)) + int(data.get('tar_16a49mefne_dtad_cuar', 0)) + int(data.get('tar_16a49mefne_dtad_quin', 0)) + int(data.get('tar_mefe_dtad_prim', 0)) + \
            int(data.get('tar_mefe_dtad_segu', 0)) + int(data.get('tar_mefe_dtad_terc', 0)) + int(data.get('tar_mefe_dtad_cuar', 0)) + int(data.get('tar_mefe_dtad_quin', 0)) + int(data.get(
                'tar_16a49_dtad_prim', 0)) + int(data.get('tar_16a49_dtad_segu', 0)) + int(data.get('tar_16a49_dtad_terc', 0)) + int(data.get('tar_16a49_dtad_cuar', 0)) + int(data.get('tar_16a49_dtad_quin', 0))
        des_hepa_dosapli = int(data.get('tar_hepa_trasal_prim', 0)) + int(data.get('tar_hepa_trasal_segu', 0)) + int(data.get('tar_hepa_trasal_terc', 0)) + int(data.get('tar_hepa_estsal_prim', 0)) + int(data.get('tar_hepa_estsal_segu', 0)) + int(data.get('tar_hepa_estsal_terc', 0)) + int(data.get('tar_hepa_trasex_prim', 0)) + \
            int(data.get('tar_hepa_trasex_segu', 0)) + int(data.get('tar_hepa_trasex_terc', 0)) + int(data.get('tar_hepa_pervih_prim', 0)) + int(data.get('tar_hepa_pervih_segu', 0)) + int(data.get('tar_hepa_pervih_terc', 0)) + int(data.get('tar_hepa_perppl_prim', 0)) + int(data.get('tar_hepa_perppl_segu', 0)) + int(data.get('tar_hepa_perppl_terc', 0)) + \
            int(data.get('tar_hepa_otro_prim', 0)) + \
            int(data.get('tar_hepa_otro_segu', 0)) + \
            int(data.get('tar_hepa_otro_terc', 0))
        des_inmant_dosapli = int(data.get('tar_inmant', 0))
        des_inmanthepb_dosapli = int(data.get('tar_inmanthep', 0))
        des_inmantrra_dosapli = int(data.get('tar_inmantrra', 0))
        des_bcg_dosapli = int(data.get('des_bcg_dosapli', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_dosapli = int(data.get('des_rota_dosapli', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_dosapli = int(data.get('des_pent_dosapli', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_dosapli = int(data.get('des_neum_dosapli', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_dosapli = int(data.get('des_vari_dosapli', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_dosapli = int(data.get('des_hpv_dosapli', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('des_infped_dosapli', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('des_infadu_dosapli', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli = des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi = des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi = des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli = des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi = des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi = des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli = des_rota_dosapli
            existing_record.des_rota_pervacenfabi = des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi = des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli = des_pent_dosapli
            existing_record.des_pent_pervacenfabi = des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi = des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli = des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi = des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi = des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli = des_anti_dosapli
            existing_record.des_anti_pervacenfabi = des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi = des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli = des_neum_dosapli
            existing_record.des_neum_pervacenfabi = des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi = des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli = des_sr_dosapli
            existing_record.des_sr_pervacenfabi = des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi = des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli = des_srp_dosapli
            existing_record.des_srp_pervacenfabi = des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi = des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli = des_vari_dosapli
            existing_record.des_vari_pervacenfabi = des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi = des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli = des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi = des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi = des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli = des_dift_dosapli
            existing_record.des_dift_pervacenfabi = des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi = des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli = des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi = des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi = des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli = des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi = des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi = des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli = des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi = des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi = des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli = des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi = des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi = des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli = des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi = des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi = des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli = des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi = des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi = des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli = des_infped_dosapli
            existing_record.des_infped_pervacenfabi = des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi = des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli = des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi = des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi = des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli = des_viru_dosapli
            existing_record.des_viru_pervacenfabi = des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi = des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli = des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi = des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi = des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli = des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi = des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi = des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli = des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi = des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi = des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli = des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi = des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi = des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tar_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Update_Correcto, "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='eliminar-tardio')
    def delete_tardio(self, request, pk=None):
        data = request.data
        tar_fech = parse_date(data.get('tar_fech'))
        eni_user_id = data.get('eniUser')

        # Crear variables de control
        fech_inicio = tar_fech.replace(day=1)
        fech_fin = (tar_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Eliminar registros en 'tardio' donde tar_tota=False
        primeros_registros = tardio.objects.filter(
            eniUser_id=eni_user_id,
            tar_fech=tar_fech,
            tar_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros.exists():
            primer_registro = primeros_registros.first()
            primer_registro.delete()

        # Filtrar registros del mes y sumar los valores donde tar_tota es False
        registros_mes = tardio.objects.filter(
            tar_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, tar_tota=False
        )
        sum_totals = registros_mes.aggregate(
            tar_intr=Sum('tar_intr') or 0,
            tar_extr_mies_cnh=Sum('tar_extr_mies_cnh') or 0,
            tar_extr_mies_cibv=Sum('tar_extr_mies_cibv') or 0,
            tar_extr_mine_egen=Sum('tar_extr_mine_egen') or 0,
            tar_extr_mine_bach=Sum('tar_extr_mine_bach') or 0,
            tar_extr_visi=Sum('tar_extr_visi') or 0,
            tar_extr_aten=Sum('tar_extr_aten') or 0,
            tar_otro=Sum('tar_otro') or 0,
            tar_sexo_homb=Sum('tar_sexo_homb') or 0,
            tar_sexo_muje=Sum('tar_sexo_muje') or 0,
            tar_luga_pert=Sum('tar_luga_pert') or 0,
            tar_luga_nope=Sum('tar_luga_nope') or 0,
            tar_naci_ecua=Sum('tar_naci_ecua') or 0,
            tar_naci_colo=Sum('tar_naci_colo') or 0,
            tar_naci_peru=Sum('tar_naci_peru') or 0,
            tar_naci_cuba=Sum('tar_naci_cuba') or 0,
            tar_naci_vene=Sum('tar_naci_vene') or 0,
            tar_naci_otro=Sum('tar_naci_otro') or 0,
            tar_auto_indi=Sum('tar_auto_indi') or 0,
            tar_auto_afro=Sum('tar_auto_afro') or 0,
            tar_auto_negr=Sum('tar_auto_negr') or 0,
            tar_auto_mula=Sum('tar_auto_mula') or 0,
            tar_auto_mont=Sum('tar_auto_mont') or 0,
            tar_auto_mest=Sum('tar_auto_mest') or 0,
            tar_auto_blan=Sum('tar_auto_blan') or 0,
            tar_auto_otro=Sum('tar_auto_otro') or 0,
            tar_naci_achu=Sum('tar_naci_achu') or 0,
            tar_naci_ando=Sum('tar_naci_ando') or 0,
            tar_naci_awa=Sum('tar_naci_awa') or 0,
            tar_naci_chac=Sum('tar_naci_chac') or 0,
            tar_naci_cofa=Sum('tar_naci_cofa') or 0,
            tar_naci_eper=Sum('tar_naci_eper') or 0,
            tar_naci_huan=Sum('tar_naci_huan') or 0,
            tar_naci_kich=Sum('tar_naci_kich') or 0,
            tar_naci_mant=Sum('tar_naci_mant') or 0,
            tar_naci_seco=Sum('tar_naci_seco') or 0,
            tar_naci_shiw=Sum('tar_naci_shiw') or 0,
            tar_naci_shua=Sum('tar_naci_shua') or 0,
            tar_naci_sion=Sum('tar_naci_sion') or 0,
            tar_naci_tsac=Sum('tar_naci_tsac') or 0,
            tar_naci_waor=Sum('tar_naci_waor') or 0,
            tar_naci_zapa=Sum('tar_naci_zapa') or 0,
            tar_pueb_chib=Sum('tar_pueb_chib') or 0,
            tar_pueb_kana=Sum('tar_pueb_kana') or 0,
            tar_pueb_kara=Sum('tar_pueb_kara') or 0,
            tar_pueb_kaya=Sum('tar_pueb_kaya') or 0,
            tar_pueb_kich=Sum('tar_pueb_kich') or 0,
            tar_pueb_kisa=Sum('tar_pueb_kisa') or 0,
            tar_pueb_kitu=Sum('tar_pueb_kitu') or 0,
            tar_pueb_nata=Sum('tar_pueb_nata') or 0,
            tar_pueb_otav=Sum('tar_pueb_otav') or 0,
            tar_pueb_palt=Sum('tar_pueb_palt') or 0,
            tar_pueb_panz=Sum('tar_pueb_panz') or 0,
            tar_pueb_past=Sum('tar_pueb_past') or 0,
            tar_pueb_puru=Sum('tar_pueb_puru') or 0,
            tar_pueb_sala=Sum('tar_pueb_sala') or 0,
            tar_pueb_sara=Sum('tar_pueb_sara') or 0,
            tar_pueb_toma=Sum('tar_pueb_toma') or 0,
            tar_pueb_wara=Sum('tar_pueb_wara') or 0,
            tar_1ano_1rad_fipv=Sum('tar_1ano_1rad_fipv') or 0,
            tar_1ano_1rad_hbpe=Sum('tar_1ano_1rad_hbpe') or 0,
            tar_1ano_1rad_dpt=Sum('tar_1ano_1rad_dpt') or 0,
            tar_1ano_2dad_fipv=Sum('tar_1ano_2dad_fipv') or 0,
            tar_1ano_2dad_hbpe=Sum('tar_1ano_2dad_hbpe') or 0,
            tar_1ano_2dad_dpt=Sum('tar_1ano_2dad_dpt') or 0,
            tar_1ano_3rad_bopv=Sum('tar_1ano_3rad_bopv') or 0,
            tar_1ano_3rad_hbpe=Sum('tar_1ano_3rad_hbpe') or 0,
            tar_1ano_3rad_dpt=Sum('tar_1ano_3rad_dpt') or 0,
            tar_2ano_1rad_fipv=Sum('tar_2ano_1rad_fipv') or 0,
            tar_2ano_1rad_srp=Sum('tar_2ano_1rad_srp') or 0,
            tar_2ano_1rad_hbpe=Sum('tar_2ano_1rad_hbpe') or 0,
            tar_2ano_1rad_dpt=Sum('tar_2ano_1rad_dpt') or 0,
            tar_2ano_2dad_fipv=Sum('tar_2ano_2dad_fipv') or 0,
            tar_2ano_2dad_srp=Sum('tar_2ano_2dad_srp') or 0,
            tar_2ano_2dad_hbpe=Sum('tar_2ano_2dad_hbpe') or 0,
            tar_2ano_2dad_dpt=Sum('tar_2ano_2dad_dpt') or 0,
            tar_2ano_3rad_bopv=Sum('tar_2ano_3rad_bopv') or 0,
            tar_2ano_3rad_hbpe=Sum('tar_2ano_3rad_hbpe') or 0,
            tar_2ano_3rad_dpt=Sum('tar_2ano_3rad_dpt') or 0,
            tar_2ano_4tad_bopv=Sum('tar_2ano_4tad_bopv') or 0,
            tar_2ano_4tad_dpt=Sum('tar_2ano_4tad_dpt') or 0,
            tar_2ano_dosi_fa=Sum('tar_2ano_dosi_fa') or 0,
            tar_3ano_1rad_fipv=Sum('tar_3ano_1rad_fipv') or 0,
            tar_3ano_1rad_srp=Sum('tar_3ano_1rad_srp') or 0,
            tar_3ano_1rad_hbpe=Sum('tar_3ano_1rad_hbpe') or 0,
            tar_3ano_1rad_dpt=Sum('tar_3ano_1rad_dpt') or 0,
            tar_3ano_2dad_fipv=Sum('tar_3ano_2dad_fipv') or 0,
            tar_3ano_2dad_srp=Sum('tar_3ano_2dad_srp') or 0,
            tar_3ano_2dad_hbpe=Sum('tar_3ano_2dad_hbpe') or 0,
            tar_3ano_2dad_dpt=Sum('tar_3ano_2dad_dpt') or 0,
            tar_3ano_3rad_bopv=Sum('tar_3ano_3rad_bopv') or 0,
            tar_3ano_3rad_hbpe=Sum('tar_3ano_3rad_hbpe') or 0,
            tar_3ano_3rad_dpt=Sum('tar_3ano_3rad_dpt') or 0,
            tar_3ano_4tad_bopv=Sum('tar_3ano_4tad_bopv') or 0,
            tar_3ano_4tad_dpt=Sum('tar_3ano_4tad_dpt') or 0,
            tar_3ano_dosi_fa=Sum('tar_3ano_dosi_fa') or 0,
            tar_4ano_1rad_fipv=Sum('tar_4ano_1rad_fipv') or 0,
            tar_4ano_1rad_srp=Sum('tar_4ano_1rad_srp') or 0,
            tar_4ano_1rad_hbpe=Sum('tar_4ano_1rad_hbpe') or 0,
            tar_4ano_1rad_dpt=Sum('tar_4ano_1rad_dpt') or 0,
            tar_4ano_2dad_fipv=Sum('tar_4ano_2dad_fipv') or 0,
            tar_4ano_2dad_srp=Sum('tar_4ano_2dad_srp') or 0,
            tar_4ano_2dad_hbpe=Sum('tar_4ano_2dad_hbpe') or 0,
            tar_4ano_2dad_dpt=Sum('tar_4ano_2dad_dpt') or 0,
            tar_4ano_3rad_bopv=Sum('tar_4ano_3rad_bopv') or 0,
            tar_4ano_3rad_hbpe=Sum('tar_4ano_3rad_hbpe') or 0,
            tar_4ano_3rad_dpt=Sum('tar_4ano_3rad_dpt') or 0,
            tar_4ano_4tad_bopv=Sum('tar_4ano_4tad_bopv') or 0,
            tar_4ano_4tad_dpt=Sum('tar_4ano_4tad_dpt') or 0,
            tar_4ano_dosi_fa=Sum('tar_4ano_dosi_fa') or 0,
            tar_5ano_1rad_ipv=Sum('tar_5ano_1rad_ipv') or 0,
            tar_5ano_1rad_srp=Sum('tar_5ano_1rad_srp') or 0,
            tar_5ano_1rad_hbpe=Sum('tar_5ano_1rad_hbpe') or 0,
            tar_5ano_1rad_dpt=Sum('tar_5ano_1rad_dpt') or 0,
            tar_5ano_2dad_fipv=Sum('tar_5ano_2dad_fipv') or 0,
            tar_5ano_2dad_srp=Sum('tar_5ano_2dad_srp') or 0,
            tar_5ano_2dad_hbpe=Sum('tar_5ano_2dad_hbpe') or 0,
            tar_5ano_2dad_dpt=Sum('tar_5ano_2dad_dpt') or 0,
            tar_5ano_3rad_bopv=Sum('tar_5ano_3rad_bopv') or 0,
            tar_5ano_3rad_hbpe=Sum('tar_5ano_3rad_hbpe') or 0,
            tar_5ano_3rad_dpt=Sum('tar_5ano_3rad_dpt') or 0,
            tar_5ano_4tad_bopv=Sum('tar_5ano_4tad_bopv') or 0,
            tar_5ano_4tad_dpt=Sum('tar_5ano_4tad_dpt') or 0,
            tar_5ano_dosi_fa=Sum('tar_5ano_dosi_fa') or 0,
            tar_6ano_1rad_srp=Sum('tar_6ano_1rad_srp') or 0,
            tar_6ano_2dad_srp=Sum('tar_6ano_2dad_srp') or 0,
            tar_6ano_dosi_fa=Sum('tar_6ano_dosi_fa') or 0,
            tar_7ano_1rad_sr=Sum('tar_7ano_1rad_sr') or 0,
            tar_7ano_2dad_sr=Sum('tar_7ano_2dad_sr') or 0,
            tar_7ano_dosi_fa=Sum('tar_7ano_dosi_fa') or 0,
            tar_8ano_dosi_fa=Sum('tar_8ano_dosi_fa') or 0,
            tar_7a14_dosi_dtad=Sum('tar_7a14_dosi_dtad') or 0,
            tar_9a14_dosi_fa=Sum('tar_9a14_dosi_fa') or 0,
            tar_15a19_dosi_fa=Sum('tar_15a19_dosi_fa') or 0,
            tar_20a59_dosi_fa=Sum('tar_20a59_dosi_fa') or 0,
            tar_8a14_1rad_sr=Sum('tar_8a14_1rad_sr') or 0,
            tar_8a14_2dad_sr=Sum('tar_8a14_2dad_sr') or 0,
            tar_15a29_1rad_sr=Sum('tar_15a29_1rad_sr') or 0,
            tar_15a29_2dad_sr=Sum('tar_15a29_2dad_sr') or 0,
            tar_30a50_1rad_sr=Sum('tar_30a50_1rad_sr') or 0,
            tar_30a50_2dad_sr=Sum('tar_30a50_2dad_sr') or 0,
            tar_16a49mefne_dtad_prim=Sum('tar_16a49mefne_dtad_prim') or 0,
            tar_16a49mefne_dtad_segu=Sum('tar_16a49mefne_dtad_segu') or 0,
            tar_16a49mefne_dtad_terc=Sum('tar_16a49mefne_dtad_terc') or 0,
            tar_16a49mefne_dtad_cuar=Sum('tar_16a49mefne_dtad_cuar') or 0,
            tar_16a49mefne_dtad_quin=Sum('tar_16a49mefne_dtad_quin') or 0,
            tar_mefe_dtad_prim=Sum('tar_mefe_dtad_prim') or 0,
            tar_mefe_dtad_segu=Sum('tar_mefe_dtad_segu') or 0,
            tar_mefe_dtad_terc=Sum('tar_mefe_dtad_terc') or 0,
            tar_mefe_dtad_cuar=Sum('tar_mefe_dtad_cuar') or 0,
            tar_mefe_dtad_quin=Sum('tar_mefe_dtad_quin') or 0,
            tar_16a49_dtad_prim=Sum('tar_16a49_dtad_prim') or 0,
            tar_16a49_dtad_segu=Sum('tar_16a49_dtad_segu') or 0,
            tar_16a49_dtad_terc=Sum('tar_16a49_dtad_terc') or 0,
            tar_16a49_dtad_cuar=Sum('tar_16a49_dtad_cuar') or 0,
            tar_16a49_dtad_quin=Sum('tar_16a49_dtad_quin') or 0,
            tar_hepa_trasal_prim=Sum('tar_hepa_trasal_prim') or 0,
            tar_hepa_trasal_segu=Sum('tar_hepa_trasal_segu') or 0,
            tar_hepa_trasal_terc=Sum('tar_hepa_trasal_terc') or 0,
            tar_hepa_estsal_prim=Sum('tar_hepa_estsal_prim') or 0,
            tar_hepa_estsal_segu=Sum('tar_hepa_estsal_segu') or 0,
            tar_hepa_estsal_terc=Sum('tar_hepa_estsal_terc') or 0,
            tar_hepa_trasex_prim=Sum('tar_hepa_trasex_prim') or 0,
            tar_hepa_trasex_segu=Sum('tar_hepa_trasex_segu') or 0,
            tar_hepa_trasex_terc=Sum('tar_hepa_trasex_terc') or 0,
            tar_hepa_pervih_prim=Sum('tar_hepa_pervih_prim') or 0,
            tar_hepa_pervih_segu=Sum('tar_hepa_pervih_segu') or 0,
            tar_hepa_pervih_terc=Sum('tar_hepa_pervih_terc') or 0,
            tar_hepa_perppl_prim=Sum('tar_hepa_perppl_prim') or 0,
            tar_hepa_perppl_segu=Sum('tar_hepa_perppl_segu') or 0,
            tar_hepa_perppl_terc=Sum('tar_hepa_perppl_terc') or 0,
            tar_hepa_otro_prim=Sum('tar_hepa_otro_prim') or 0,
            tar_hepa_otro_segu=Sum('tar_hepa_otro_segu') or 0,
            tar_hepa_otro_terc=Sum('tar_hepa_otro_terc') or 0,
            tar_inmant=Sum('tar_inmant') or 0,
            tar_inmanthep=Sum('tar_inmanthep') or 0,
            tar_inmantrra=Sum('tar_inmantrra') or 0,
        )
        sum_totals = {k: v if v is not None else 0 for k,
                      v in sum_totals.items()}

        # Actualizar o crear el registro total en 'tardio'
        _, created = tardio.objects.update_or_create(
            eniUser_id=eni_user_id,
            tar_fech=fech_fin,
            tar_tota=True,
            defaults=sum_totals
        )

        # Eliminar registros en 'desperdicio' donde des_tota=False
        primeros_registros_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech=tar_fech,
            des_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros_des.exists():
            primer_registro_des = primeros_registros_des.first()
            primer_registro_des.delete()

        # Recalcular los totales en 'desperdicio' para el mes
        registros_mes_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=False
        )

        sum_totals_des = registros_mes_des.aggregate(
            des_bcg_dosapli=Sum('des_bcg_dosapli') or 0,
            des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi') or 0,
            des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi') or 0,
            des_hbpe_dosapli=Sum('des_hbpe_dosapli') or 0,
            des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi') or 0,
            des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi') or 0,
            des_rota_dosapli=Sum('des_rota_dosapli') or 0,
            des_rota_pervacenfabi=Sum('des_rota_pervacenfabi') or 0,
            des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi') or 0,
            des_pent_dosapli=Sum('des_pent_dosapli') or 0,
            des_pent_pervacenfabi=Sum('des_pent_pervacenfabi') or 0,
            des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi') or 0,
            des_fipv_dosapli=Sum('des_fipv_dosapli') or 0,
            des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi') or 0,
            des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi') or 0,
            des_anti_dosapli=Sum('des_anti_dosapli') or 0,
            des_anti_pervacenfabi=Sum('des_anti_pervacenfabi') or 0,
            des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi') or 0,
            des_neum_dosapli=Sum('des_neum_dosapli') or 0,
            des_neum_pervacenfabi=Sum('des_neum_pervacenfabi') or 0,
            des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi') or 0,
            des_sr_dosapli=Sum('des_sr_dosapli') or 0,
            des_sr_pervacenfabi=Sum('des_sr_pervacenfabi') or 0,
            des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi') or 0,
            des_srp_dosapli=Sum('des_srp_dosapli') or 0,
            des_srp_pervacenfabi=Sum('des_srp_pervacenfabi') or 0,
            des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi') or 0,
            des_vari_dosapli=Sum('des_vari_dosapli') or 0,
            des_vari_pervacenfabi=Sum('des_vari_pervacenfabi') or 0,
            des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi') or 0,
            des_fieb_dosapli=Sum('des_fieb_dosapli') or 0,
            des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi') or 0,
            des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi') or 0,
            des_dift_dosapli=Sum('des_dift_dosapli') or 0,
            des_dift_pervacenfabi=Sum('des_dift_pervacenfabi') or 0,
            des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi') or 0,
            des_hpv_dosapli=Sum('des_hpv_dosapli') or 0,
            des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi') or 0,
            des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi') or 0,
            des_dtad_dosapli=Sum('des_dtad_dosapli') or 0,
            des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi') or 0,
            des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi') or 0,
            des_hepa_dosapli=Sum('des_hepa_dosapli') or 0,
            des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi') or 0,
            des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi') or 0,
            des_inmant_dosapli=Sum('des_inmant_dosapli') or 0,
            des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi') or 0,
            des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi') or 0,
            des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli') or 0,
            des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi') or 0,
            des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi') or 0,
            des_inmantrra_dosapli=Sum('des_inmantrra_dosapli') or 0,
            des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi') or 0,
            des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi') or 0,
            des_infped_dosapli=Sum('des_infped_dosapli') or 0,
            des_infped_pervacenfabi=Sum('des_infped_pervacenfabi') or 0,
            des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi') or 0,
            des_infadu_dosapli=Sum('des_infadu_dosapli') or 0,
            des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi') or 0,
            des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi') or 0,
            des_viru_dosapli=Sum('des_viru_dosapli') or 0,
            des_viru_pervacenfabi=Sum('des_viru_pervacenfabi') or 0,
            des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi') or 0,
            des_vacsin_dosapli=Sum('des_vacsin_dosapli') or 0,
            des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi') or 0,
            des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi') or 0,
            des_vacpfi_dosapli=Sum('des_vacpfi_dosapli') or 0,
            des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi') or 0,
            des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi') or 0,
            des_vacmod_dosapli=Sum('des_vacmod_dosapli') or 0,
            des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi') or 0,
            des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi') or 0,
            des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli') or 0,
            des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi') or 0,
            des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi') or 0,
        )
        sum_totals_des = {k: v if v is not None else 0 for k,
                          v in sum_totals_des.items()}

        # Actualizar o crear el registro total en 'desperdicio'
        _, created = desperdicio.objects.update_or_create(
            eniUser_id=eni_user_id,
            des_fech=fech_fin,
            des_tota=True,
            defaults=sum_totals_des
        )

        return Response({"message": Dato_Delete_Correcto}, status=status.HTTP_200_OK)


class DesperdicioRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = DesperdicioRegistrationSerializer
    queryset = desperdicio.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                des_fech__year=year, des_fech__month=month)

        return queryset.order_by('des_fech', 'des_tota')

    @action(detail=False, methods=['get'], url_path='total-desperdicio')
    def get_total_mes(self, request, *args, **kwargs):
        user_id = self.request.query_params.get('user_id', None)
        queryset = self.queryset
        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id, des_tota=True)
        queryset = queryset.order_by('des_fech', 'des_tota')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='crear-desperdicio')
    def create_desperdicio(self, request, *args, **kwargs):
        data = request.data
        des_fech = parse_date(data.get('des_fech'))
        eni_user_id = data.get('eniUser')

        # Verificar si ya existe un registro con las mismas variables
        if desperdicio.objects.filter(eniUser_id=eni_user_id, des_fech=des_fech, des_tota=False).exists():
            return Response({"error": Error_Fecha_Registrada}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Crear variables de control
        fech_inicio = des_fech.replace(day=1)
        fech_fin = (des_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde des_tota es False
        registros_mes = desperdicio.objects.filter(
            des_fech__range=(fech_inicio, fech_fin), eniUser_id=eni_user_id, des_tota=False)
        sum_totals_des = registros_mes.aggregate(
            des_bcg_dosapli=Sum('des_bcg_dosapli'),
            des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            des_rota_dosapli=Sum('des_rota_dosapli'),
            des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            des_pent_dosapli=Sum('des_pent_dosapli'),
            des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            des_fipv_dosapli=Sum('des_fipv_dosapli'),
            des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            des_anti_dosapli=Sum('des_anti_dosapli'),
            des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            des_neum_dosapli=Sum('des_neum_dosapli'),
            des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            des_sr_dosapli=Sum('des_sr_dosapli'),
            des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            des_srp_dosapli=Sum('des_srp_dosapli'),
            des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            des_vari_dosapli=Sum('des_vari_dosapli'),
            des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            des_fieb_dosapli=Sum('des_fieb_dosapli'),
            des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            des_dift_dosapli=Sum('des_dift_dosapli'),
            des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            des_hpv_dosapli=Sum('des_hpv_dosapli'),
            des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            des_dtad_dosapli=Sum('des_dtad_dosapli'),
            des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            des_hepa_dosapli=Sum('des_hepa_dosapli'),
            des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            des_inmant_dosapli=Sum('des_inmant_dosapli'),
            des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            des_inmanthepb_pervacenfabi=Sum('des_inmanthepb_pervacenfabi'),
            des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            des_inmantrra_pervacfrasnoabi=Sum('des_inmantrra_pervacfrasnoabi'),
            des_infped_dosapli=Sum('des_infped_dosapli'),
            des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            des_infadu_dosapli=Sum('des_infadu_dosapli'),
            des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            des_viru_dosapli=Sum('des_viru_dosapli'),
            des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            des_vacvphcam_pervacfrasnoabi=Sum('des_vacvphcam_pervacfrasnoabi')
        )

        # Verificar si ya existe un registro con la misma fecha y des_tota=True
        total_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id, des_fech=fech_fin, des_tota=True).first()

        if total_record_des:
            # Actualizar el registro existente sumando los nuevos valores
            total_record_des.des_bcg_dosapli = sum_totals_des['des_bcg_dosapli'] or 0
            total_record_des.des_bcg_pervacenfabi = sum_totals_des['des_bcg_pervacenfabi'] or 0
            total_record_des.des_bcg_pervacfrasnoabi = sum_totals_des['des_bcg_pervacfrasnoabi'] or 0
            total_record_des.des_hbpe_dosapli = sum_totals_des['des_hbpe_dosapli'] or 0
            total_record_des.des_hbpe_pervacenfabi = sum_totals_des['des_hbpe_pervacenfabi'] or 0
            total_record_des.des_hbpe_pervacfrasnoabi = sum_totals_des[
                'des_hbpe_pervacfrasnoabi'] or 0
            total_record_des.des_rota_dosapli = sum_totals_des['des_rota_dosapli'] or 0
            total_record_des.des_rota_pervacenfabi = sum_totals_des['des_rota_pervacenfabi'] or 0
            total_record_des.des_rota_pervacfrasnoabi = sum_totals_des[
                'des_rota_pervacfrasnoabi'] or 0
            total_record_des.des_pent_dosapli = sum_totals_des['des_pent_dosapli'] or 0
            total_record_des.des_pent_pervacenfabi = sum_totals_des['des_pent_pervacenfabi'] or 0
            total_record_des.des_pent_pervacfrasnoabi = sum_totals_des[
                'des_pent_pervacfrasnoabi'] or 0
            total_record_des.des_fipv_dosapli = sum_totals_des['des_fipv_dosapli'] or 0
            total_record_des.des_fipv_pervacenfabi = sum_totals_des['des_fipv_pervacenfabi'] or 0
            total_record_des.des_fipv_pervacfrasnoabi = sum_totals_des[
                'des_fipv_pervacfrasnoabi'] or 0
            total_record_des.des_anti_dosapli = sum_totals_des['des_anti_dosapli'] or 0
            total_record_des.des_anti_pervacenfabi = sum_totals_des['des_anti_pervacenfabi'] or 0
            total_record_des.des_anti_pervacfrasnoabi = sum_totals_des[
                'des_anti_pervacfrasnoabi'] or 0
            total_record_des.des_neum_dosapli = sum_totals_des['des_neum_dosapli'] or 0
            total_record_des.des_neum_pervacenfabi = sum_totals_des['des_neum_pervacenfabi'] or 0
            total_record_des.des_neum_pervacfrasnoabi = sum_totals_des[
                'des_neum_pervacfrasnoabi'] or 0
            total_record_des.des_sr_dosapli = sum_totals_des['des_sr_dosapli'] or 0
            total_record_des.des_sr_pervacenfabi = sum_totals_des['des_sr_pervacenfabi'] or 0
            total_record_des.des_sr_pervacfrasnoabi = sum_totals_des['des_sr_pervacfrasnoabi'] or 0
            total_record_des.des_srp_dosapli = sum_totals_des['des_srp_dosapli'] or 0
            total_record_des.des_srp_pervacenfabi = sum_totals_des['des_srp_pervacenfabi'] or 0
            total_record_des.des_srp_pervacfrasnoabi = sum_totals_des['des_srp_pervacfrasnoabi'] or 0
            total_record_des.des_vari_dosapli = sum_totals_des['des_vari_dosapli'] or 0
            total_record_des.des_vari_pervacenfabi = sum_totals_des['des_vari_pervacenfabi'] or 0
            total_record_des.des_vari_pervacfrasnoabi = sum_totals_des[
                'des_vari_pervacfrasnoabi'] or 0
            total_record_des.des_fieb_dosapli = sum_totals_des['des_fieb_dosapli'] or 0
            total_record_des.des_fieb_pervacenfabi = sum_totals_des['des_fieb_pervacenfabi'] or 0
            total_record_des.des_fieb_pervacfrasnoabi = sum_totals_des[
                'des_fieb_pervacfrasnoabi'] or 0
            total_record_des.des_dift_dosapli = sum_totals_des['des_dift_dosapli'] or 0
            total_record_des.des_dift_pervacenfabi = sum_totals_des['des_dift_pervacenfabi'] or 0
            total_record_des.des_dift_pervacfrasnoabi = sum_totals_des[
                'des_dift_pervacfrasnoabi'] or 0
            total_record_des.des_hpv_dosapli = sum_totals_des['des_hpv_dosapli'] or 0
            total_record_des.des_hpv_pervacenfabi = sum_totals_des['des_hpv_pervacenfabi'] or 0
            total_record_des.des_hpv_pervacfrasnoabi = sum_totals_des['des_hpv_pervacfrasnoabi'] or 0
            total_record_des.des_dtad_dosapli = sum_totals_des['des_dtad_dosapli'] or 0
            total_record_des.des_dtad_pervacenfabi = sum_totals_des['des_dtad_pervacenfabi'] or 0
            total_record_des.des_dtad_pervacfrasnoabi = sum_totals_des[
                'des_dtad_pervacfrasnoabi'] or 0
            total_record_des.des_hepa_dosapli = sum_totals_des['des_hepa_dosapli'] or 0
            total_record_des.des_hepa_pervacenfabi = sum_totals_des['des_hepa_pervacenfabi'] or 0
            total_record_des.des_hepa_pervacfrasnoabi = sum_totals_des[
                'des_hepa_pervacfrasnoabi'] or 0
            total_record_des.des_inmant_dosapli = sum_totals_des['des_inmant_dosapli'] or 0
            total_record_des.des_inmant_pervacenfabi = sum_totals_des['des_inmant_pervacenfabi'] or 0
            total_record_des.des_inmant_pervacfrasnoabi = sum_totals_des[
                'des_inmant_pervacfrasnoabi'] or 0
            total_record_des.des_inmanthepb_dosapli = sum_totals_des['des_inmanthepb_dosapli'] or 0
            total_record_des.des_inmanthepb_pervacenfabi = sum_totals_des[
                'des_inmanthepb_pervacenfabi'] or 0
            total_record_des.des_inmanthepb_pervacfrasnoabi = sum_totals_des[
                'des_inmanthepb_pervacfrasnoabi'] or 0
            total_record_des.des_inmantrra_dosapli = sum_totals_des['des_inmantrra_dosapli'] or 0
            total_record_des.des_inmantrra_pervacenfabi = sum_totals_des[
                'des_inmantrra_pervacenfabi'] or 0
            total_record_des.des_inmantrra_pervacfrasnoabi = sum_totals_des[
                'des_inmantrra_pervacfrasnoabi'] or 0
            total_record_des.des_infped_dosapli = sum_totals_des['des_infped_dosapli'] or 0
            total_record_des.des_infped_pervacenfabi = sum_totals_des['des_infped_pervacenfabi'] or 0
            total_record_des.des_infped_pervacfrasnoabi = sum_totals_des[
                'des_infped_pervacfrasnoabi'] or 0
            total_record_des.des_infadu_dosapli = sum_totals_des['des_infadu_dosapli'] or 0
            total_record_des.des_infadu_pervacenfabi = sum_totals_des['des_infadu_pervacenfabi'] or 0
            total_record_des.des_infadu_pervacfrasnoabi = sum_totals_des[
                'des_infadu_pervacfrasnoabi'] or 0
            total_record_des.des_viru_dosapli = sum_totals_des['des_viru_dosapli'] or 0
            total_record_des.des_viru_pervacenfabi = sum_totals_des['des_viru_pervacenfabi'] or 0
            total_record_des.des_viru_pervacfrasnoabi = sum_totals_des[
                'des_viru_pervacfrasnoabi'] or 0
            total_record_des.des_vacsin_dosapli = sum_totals_des['des_vacsin_dosapli'] or 0
            total_record_des.des_vacsin_pervacenfabi = sum_totals_des['des_vacsin_pervacenfabi'] or 0
            total_record_des.des_vacsin_pervacfrasnoabi = sum_totals_des[
                'des_vacsin_pervacfrasnoabi'] or 0
            total_record_des.des_vacpfi_dosapli = sum_totals_des['des_vacpfi_dosapli'] or 0
            total_record_des.des_vacpfi_pervacenfabi = sum_totals_des['des_vacpfi_pervacenfabi'] or 0
            total_record_des.des_vacpfi_pervacfrasnoabi = sum_totals_des[
                'des_vacpfi_pervacfrasnoabi'] or 0
            total_record_des.des_vacmod_dosapli = sum_totals_des['des_vacmod_dosapli'] or 0
            total_record_des.des_vacmod_pervacenfabi = sum_totals_des['des_vacmod_pervacenfabi'] or 0
            total_record_des.des_vacmod_pervacfrasnoabi = sum_totals_des[
                'des_vacmod_pervacfrasnoabi'] or 0
            total_record_des.des_vacvphcam_dosapli = sum_totals_des['des_vacvphcam_dosapli'] or 0
            total_record_des.des_vacvphcam_pervacenfabi = sum_totals_des[
                'des_vacvphcam_pervacenfabi'] or 0
            total_record_des.des_vacvphcam_pervacfrasnoabi = sum_totals_des[
                'des_vacvphcam_pervacfrasnoabi'] or 0
            total_record_des.save()
        else:
            # Crear una nueva fila con los totales
            desperdicio.objects.create(
                des_fech=fech_fin,
                eniUser_id=eni_user_id,  # Guardar la relación con User
                des_tota=True,
                des_bcg_dosapli=sum_totals_des['des_bcg_dosapli'] or 0,
                des_bcg_pervacenfabi=sum_totals_des['des_bcg_pervacenfabi'] or 0,
                des_bcg_pervacfrasnoabi=sum_totals_des['des_bcg_pervacfrasnoabi'] or 0,
                des_hbpe_dosapli=sum_totals_des['des_hbpe_dosapli'] or 0,
                des_hbpe_pervacenfabi=sum_totals_des['des_hbpe_pervacenfabi'] or 0,
                des_hbpe_pervacfrasnoabi=sum_totals_des['des_hbpe_pervacfrasnoabi'] or 0,
                des_rota_dosapli=sum_totals_des['des_rota_dosapli'] or 0,
                des_rota_pervacenfabi=sum_totals_des['des_rota_pervacenfabi'] or 0,
                des_rota_pervacfrasnoabi=sum_totals_des['des_rota_pervacfrasnoabi'] or 0,
                des_pent_dosapli=sum_totals_des['des_pent_dosapli'] or 0,
                des_pent_pervacenfabi=sum_totals_des['des_pent_pervacenfabi'] or 0,
                des_pent_pervacfrasnoabi=sum_totals_des['des_pent_pervacfrasnoabi'] or 0,
                des_fipv_dosapli=sum_totals_des['des_fipv_dosapli'] or 0,
                des_fipv_pervacenfabi=sum_totals_des['des_fipv_pervacenfabi'] or 0,
                des_fipv_pervacfrasnoabi=sum_totals_des['des_fipv_pervacfrasnoabi'] or 0,
                des_anti_dosapli=sum_totals_des['des_anti_dosapli'] or 0,
                des_anti_pervacenfabi=sum_totals_des['des_anti_pervacenfabi'] or 0,
                des_anti_pervacfrasnoabi=sum_totals_des['des_anti_pervacfrasnoabi'] or 0,
                des_neum_dosapli=sum_totals_des['des_neum_dosapli'] or 0,
                des_neum_pervacenfabi=sum_totals_des['des_neum_pervacenfabi'] or 0,
                des_neum_pervacfrasnoabi=sum_totals_des['des_neum_pervacfrasnoabi'] or 0,
                des_sr_dosapli=sum_totals_des['des_sr_dosapli'] or 0,
                des_sr_pervacenfabi=sum_totals_des['des_sr_pervacenfabi'] or 0,
                des_sr_pervacfrasnoabi=sum_totals_des['des_sr_pervacfrasnoabi'] or 0,
                des_srp_dosapli=sum_totals_des['des_srp_dosapli'] or 0,
                des_srp_pervacenfabi=sum_totals_des['des_srp_pervacenfabi'] or 0,
                des_srp_pervacfrasnoabi=sum_totals_des['des_srp_pervacfrasnoabi'] or 0,
                des_vari_dosapli=sum_totals_des['des_vari_dosapli'] or 0,
                des_vari_pervacenfabi=sum_totals_des['des_vari_pervacenfabi'] or 0,
                des_vari_pervacfrasnoabi=sum_totals_des['des_vari_pervacfrasnoabi'] or 0,
                des_fieb_dosapli=sum_totals_des['des_fieb_dosapli'] or 0,
                des_fieb_pervacenfabi=sum_totals_des['des_fieb_pervacenfabi'] or 0,
                des_fieb_pervacfrasnoabi=sum_totals_des['des_fieb_pervacfrasnoabi'] or 0,
                des_dift_dosapli=sum_totals_des['des_dift_dosapli'] or 0,
                des_dift_pervacenfabi=sum_totals_des['des_dift_pervacenfabi'] or 0,
                des_dift_pervacfrasnoabi=sum_totals_des['des_dift_pervacfrasnoabi'] or 0,
                des_hpv_dosapli=sum_totals_des['des_hpv_dosapli'] or 0,
                des_hpv_pervacenfabi=sum_totals_des['des_hpv_pervacenfabi'] or 0,
                des_hpv_pervacfrasnoabi=sum_totals_des['des_hpv_pervacfrasnoabi'] or 0,
                des_dtad_dosapli=sum_totals_des['des_dtad_dosapli'] or 0,
                des_dtad_pervacenfabi=sum_totals_des['des_dtad_pervacenfabi'] or 0,
                des_dtad_pervacfrasnoabi=sum_totals_des['des_dtad_pervacfrasnoabi'] or 0,
                des_hepa_dosapli=sum_totals_des['des_hepa_dosapli'] or 0,
                des_hepa_pervacenfabi=sum_totals_des['des_hepa_pervacenfabi'] or 0,
                des_hepa_pervacfrasnoabi=sum_totals_des['des_hepa_pervacfrasnoabi'] or 0,
                des_inmant_dosapli=sum_totals_des['des_inmant_dosapli'] or 0,
                des_inmant_pervacenfabi=sum_totals_des['des_inmant_pervacenfabi'] or 0,
                des_inmant_pervacfrasnoabi=sum_totals_des['des_inmant_pervacfrasnoabi'] or 0,
                des_inmanthepb_dosapli=sum_totals_des['des_inmanthepb_dosapli'] or 0,
                des_inmanthepb_pervacenfabi=sum_totals_des['des_inmanthepb_pervacenfabi'] or 0,
                des_inmanthepb_pervacfrasnoabi=sum_totals_des['des_inmanthepb_pervacfrasnoabi'] or 0,
                des_inmantrra_dosapli=sum_totals_des['des_inmantrra_dosapli'] or 0,
                des_inmantrra_pervacenfabi=sum_totals_des['des_inmantrra_pervacenfabi'] or 0,
                des_inmantrra_pervacfrasnoabi=sum_totals_des['des_inmantrra_pervacfrasnoabi'] or 0,
                des_infped_dosapli=sum_totals_des['des_infped_dosapli'] or 0,
                des_infped_pervacenfabi=sum_totals_des['des_infped_pervacenfabi'] or 0,
                des_infped_pervacfrasnoabi=sum_totals_des['des_infped_pervacfrasnoabi'] or 0,
                des_infadu_dosapli=sum_totals_des['des_infadu_dosapli'] or 0,
                des_infadu_pervacenfabi=sum_totals_des['des_infadu_pervacenfabi'] or 0,
                des_infadu_pervacfrasnoabi=sum_totals_des['des_infadu_pervacfrasnoabi'] or 0,
                des_viru_dosapli=sum_totals_des['des_viru_dosapli'] or 0,
                des_viru_pervacenfabi=sum_totals_des['des_viru_pervacenfabi'] or 0,
                des_viru_pervacfrasnoabi=sum_totals_des['des_viru_pervacfrasnoabi'] or 0,
                des_vacsin_dosapli=sum_totals_des['des_vacsin_dosapli'] or 0,
                des_vacsin_pervacenfabi=sum_totals_des['des_vacsin_pervacenfabi'] or 0,
                des_vacsin_pervacfrasnoabi=sum_totals_des['des_vacsin_pervacfrasnoabi'] or 0,
                des_vacpfi_dosapli=sum_totals_des['des_vacpfi_dosapli'] or 0,
                des_vacpfi_pervacenfabi=sum_totals_des['des_vacpfi_pervacenfabi'] or 0,
                des_vacpfi_pervacfrasnoabi=sum_totals_des['des_vacpfi_pervacfrasnoabi'] or 0,
                des_vacmod_dosapli=sum_totals_des['des_vacmod_dosapli'] or 0,
                des_vacmod_pervacenfabi=sum_totals_des['des_vacmod_pervacenfabi'] or 0,
                des_vacmod_pervacfrasnoabi=sum_totals_des['des_vacmod_pervacfrasnoabi'] or 0,
                des_vacvphcam_dosapli=sum_totals_des['des_vacvphcam_dosapli'] or 0,
                des_vacvphcam_pervacenfabi=sum_totals_des['des_vacvphcam_pervacenfabi'] or 0,
                des_vacvphcam_pervacfrasnoabi=sum_totals_des['des_vacvphcam_pervacfrasnoabi'] or 0
            )

        return Response({"message": Dato_Create_Correcto}, status=status.HTTP_201_CREATED)


class InfluenzaRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = InfluenzaRegistrationSerializer
    queryset = influenza.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                inf_fech__year=year, inf_fech__month=month)

        return queryset.order_by('inf_fech', 'inf_tota')

    @action(detail=False, methods=['post'], url_path='crear-influenza')
    def create_influenza(self, request, *args, **kwargs):
        data = request.data
        inf_fech = parse_date(data.get('inf_fech'))
        eni_user_id = data.get('eniUser')

        # Verificar si ya existe un registro con las mismas variables
        if influenza.objects.filter(eniUser_id=eni_user_id, inf_fech=inf_fech, inf_tota=False).exists():
            return Response({"error": Error_Fecha_Registrada}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Crear variables de control
        fech_inicio = inf_fech.replace(day=1)
        fech_fin = (inf_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde inf_tota es False
        registros_mes = influenza.objects.filter(
            inf_fech__range=(fech_inicio, fech_fin), eniUser_id=eni_user_id, inf_tota=False)
        sum_totals = registros_mes.aggregate(
            inf_intr=Sum('inf_intr'),
            inf_extr_mies_cnh=Sum('inf_extr_mies_cnh'),
            inf_extr_mies_cibv=Sum('inf_extr_mies_cibv'),
            inf_extr_mine_egen=Sum('inf_extr_mine_egen'),
            inf_extr_mine_bach=Sum('inf_extr_mine_bach'),
            inf_extr_visi=Sum('inf_extr_visi'),
            inf_extr_aten=Sum('inf_extr_aten'),
            inf_otro=Sum('inf_otro'),
            inf_sexo_homb=Sum('inf_sexo_homb'),
            inf_sexo_muje=Sum('inf_sexo_muje'),
            inf_luga_pert=Sum('inf_luga_pert'),
            inf_luga_nope=Sum('inf_luga_nope'),
            inf_naci_ecua=Sum('inf_naci_ecua'),
            inf_naci_colo=Sum('inf_naci_colo'),
            inf_naci_peru=Sum('inf_naci_peru'),
            inf_naci_cuba=Sum('inf_naci_cuba'),
            inf_naci_vene=Sum('inf_naci_vene'),
            inf_naci_otro=Sum('inf_naci_otro'),
            inf_auto_indi=Sum('inf_auto_indi'),
            inf_auto_afro=Sum('inf_auto_afro'),
            inf_auto_negr=Sum('inf_auto_negr'),
            inf_auto_mula=Sum('inf_auto_mula'),
            inf_auto_mont=Sum('inf_auto_mont'),
            inf_auto_mest=Sum('inf_auto_mest'),
            inf_auto_blan=Sum('inf_auto_blan'),
            inf_auto_otro=Sum('inf_auto_otro'),
            inf_naci_achu=Sum('inf_naci_achu'),
            inf_naci_ando=Sum('inf_naci_ando'),
            inf_naci_awa=Sum('inf_naci_awa'),
            inf_naci_chac=Sum('inf_naci_chac'),
            inf_naci_cofa=Sum('inf_naci_cofa'),
            inf_naci_eper=Sum('inf_naci_eper'),
            inf_naci_huan=Sum('inf_naci_huan'),
            inf_naci_kich=Sum('inf_naci_kich'),
            inf_naci_mant=Sum('inf_naci_mant'),
            inf_naci_seco=Sum('inf_naci_seco'),
            inf_naci_shiw=Sum('inf_naci_shiw'),
            inf_naci_shua=Sum('inf_naci_shua'),
            inf_naci_sion=Sum('inf_naci_sion'),
            inf_naci_tsac=Sum('inf_naci_tsac'),
            inf_naci_waor=Sum('inf_naci_waor'),
            inf_naci_zapa=Sum('inf_naci_zapa'),
            inf_pueb_chib=Sum('inf_pueb_chib'),
            inf_pueb_kana=Sum('inf_pueb_kana'),
            inf_pueb_kara=Sum('inf_pueb_kara'),
            inf_pueb_kaya=Sum('inf_pueb_kaya'),
            inf_pueb_kich=Sum('inf_pueb_kich'),
            inf_pueb_kisa=Sum('inf_pueb_kisa'),
            inf_pueb_kitu=Sum('inf_pueb_kitu'),
            inf_pueb_nata=Sum('inf_pueb_nata'),
            inf_pueb_otav=Sum('inf_pueb_otav'),
            inf_pueb_palt=Sum('inf_pueb_palt'),
            inf_pueb_panz=Sum('inf_pueb_panz'),
            inf_pueb_past=Sum('inf_pueb_past'),
            inf_pueb_puru=Sum('inf_pueb_puru'),
            inf_pueb_sala=Sum('inf_pueb_sala'),
            inf_pueb_sara=Sum('inf_pueb_sara'),
            inf_pueb_toma=Sum('inf_pueb_toma'),
            inf_pueb_wara=Sum('inf_pueb_wara'),
            inf_6a11_prim=Sum('inf_6a11_prim'),
            inf_6a11_segu=Sum('inf_6a11_segu'),
            inf_1ano_dosi=Sum('inf_1ano_dosi'),
            inf_2ano_dosi=Sum('inf_2ano_dosi'),
            inf_3ano_dosi=Sum('inf_3ano_dosi'),
            inf_4ano_dosi=Sum('inf_4ano_dosi'),
            inf_5ano_dosi=Sum('inf_5ano_dosi'),
            inf_6ano_dosi=Sum('inf_6ano_dosi'),
            inf_7ano_dosi=Sum('inf_7ano_dosi'),
            inf_65an_dosi=Sum('inf_65an_dosi'),
            inf_emba_dosi=Sum('inf_emba_dosi'),
            inf_8a64_dosi=Sum('inf_8a64_dosi'),
            inf_puer_dosi=Sum('inf_puer_dosi'),
            inf_pers_salu_dosi=Sum('inf_pers_salu_dosi'),
            inf_pers_disc_dosi=Sum('inf_pers_disc_dosi'),
            inf_cuid_adul_dosi=Sum('inf_cuid_adul_dosi'),
            inf_pers_cuid_dosi=Sum('inf_pers_cuid_dosi'),
            inf_trab_avic_dosi=Sum('inf_trab_avic_dosi'),
            inf_ppl_dosi=Sum('inf_ppl_dosi'),
            inf_otro_ries_dosi=Sum('inf_otro_ries_dosi'),
            inf_pobl_gene_dosi=Sum('inf_pobl_gene_dosi'),
        )

        # Verificar si ya existe un registro con la misma fecha y inf_tota=True
        total_record = influenza.objects.filter(
            eniUser_id=eni_user_id, inf_fech=fech_fin, inf_tota=True).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.inf_intr = sum_totals['inf_intr'] or 0
            total_record.inf_extr_mies_cnh = sum_totals['inf_extr_mies_cnh'] or 0
            total_record.inf_extr_mies_cibv = sum_totals['inf_extr_mies_cibv'] or 0
            total_record.inf_extr_mine_egen = sum_totals['inf_extr_mine_egen'] or 0
            total_record.inf_extr_mine_bach = sum_totals['inf_extr_mine_bach'] or 0
            total_record.inf_extr_visi = sum_totals['inf_extr_visi'] or 0
            total_record.inf_extr_aten = sum_totals['inf_extr_aten'] or 0
            total_record.inf_otro = sum_totals['inf_otro'] or 0
            total_record.inf_sexo_homb = sum_totals['inf_sexo_homb'] or 0
            total_record.inf_sexo_muje = sum_totals['inf_sexo_muje'] or 0
            total_record.inf_luga_pert = sum_totals['inf_luga_pert'] or 0
            total_record.inf_luga_nope = sum_totals['inf_luga_nope'] or 0
            total_record.inf_naci_ecua = sum_totals['inf_naci_ecua'] or 0
            total_record.inf_naci_colo = sum_totals['inf_naci_colo'] or 0
            total_record.inf_naci_peru = sum_totals['inf_naci_peru'] or 0
            total_record.inf_naci_cuba = sum_totals['inf_naci_cuba'] or 0
            total_record.inf_naci_vene = sum_totals['inf_naci_vene'] or 0
            total_record.inf_naci_otro = sum_totals['inf_naci_otro'] or 0
            total_record.inf_auto_indi = sum_totals['inf_auto_indi'] or 0
            total_record.inf_auto_afro = sum_totals['inf_auto_afro'] or 0
            total_record.inf_auto_negr = sum_totals['inf_auto_negr'] or 0
            total_record.inf_auto_mula = sum_totals['inf_auto_mula'] or 0
            total_record.inf_auto_mont = sum_totals['inf_auto_mont'] or 0
            total_record.inf_auto_mest = sum_totals['inf_auto_mest'] or 0
            total_record.inf_auto_blan = sum_totals['inf_auto_blan'] or 0
            total_record.inf_auto_otro = sum_totals['inf_auto_otro'] or 0
            total_record.inf_naci_achu = sum_totals['inf_naci_achu'] or 0
            total_record.inf_naci_ando = sum_totals['inf_naci_ando'] or 0
            total_record.inf_naci_awa = sum_totals['inf_naci_awa'] or 0
            total_record.inf_naci_chac = sum_totals['inf_naci_chac'] or 0
            total_record.inf_naci_cofa = sum_totals['inf_naci_cofa'] or 0
            total_record.inf_naci_eper = sum_totals['inf_naci_eper'] or 0
            total_record.inf_naci_huan = sum_totals['inf_naci_huan'] or 0
            total_record.inf_naci_kich = sum_totals['inf_naci_kich'] or 0
            total_record.inf_naci_mant = sum_totals['inf_naci_mant'] or 0
            total_record.inf_naci_seco = sum_totals['inf_naci_seco'] or 0
            total_record.inf_naci_shiw = sum_totals['inf_naci_shiw'] or 0
            total_record.inf_naci_shua = sum_totals['inf_naci_shua'] or 0
            total_record.inf_naci_sion = sum_totals['inf_naci_sion'] or 0
            total_record.inf_naci_tsac = sum_totals['inf_naci_tsac'] or 0
            total_record.inf_naci_waor = sum_totals['inf_naci_waor'] or 0
            total_record.inf_naci_zapa = sum_totals['inf_naci_zapa'] or 0
            total_record.inf_pueb_chib = sum_totals['inf_pueb_chib'] or 0
            total_record.inf_pueb_kana = sum_totals['inf_pueb_kana'] or 0
            total_record.inf_pueb_kara = sum_totals['inf_pueb_kara'] or 0
            total_record.inf_pueb_kaya = sum_totals['inf_pueb_kaya'] or 0
            total_record.inf_pueb_kich = sum_totals['inf_pueb_kich'] or 0
            total_record.inf_pueb_kisa = sum_totals['inf_pueb_kisa'] or 0
            total_record.inf_pueb_kitu = sum_totals['inf_pueb_kitu'] or 0
            total_record.inf_pueb_nata = sum_totals['inf_pueb_nata'] or 0
            total_record.inf_pueb_otav = sum_totals['inf_pueb_otav'] or 0
            total_record.inf_pueb_palt = sum_totals['inf_pueb_palt'] or 0
            total_record.inf_pueb_panz = sum_totals['inf_pueb_panz'] or 0
            total_record.inf_pueb_past = sum_totals['inf_pueb_past'] or 0
            total_record.inf_pueb_puru = sum_totals['inf_pueb_puru'] or 0
            total_record.inf_pueb_sala = sum_totals['inf_pueb_sala'] or 0
            total_record.inf_pueb_sara = sum_totals['inf_pueb_sara'] or 0
            total_record.inf_pueb_toma = sum_totals['inf_pueb_toma'] or 0
            total_record.inf_pueb_wara = sum_totals['inf_pueb_wara'] or 0
            total_record.inf_6a11_prim = sum_totals['inf_6a11_prim'] or 0
            total_record.inf_6a11_segu = sum_totals['inf_6a11_segu'] or 0
            total_record.inf_1ano_dosi = sum_totals['inf_1ano_dosi'] or 0
            total_record.inf_2ano_dosi = sum_totals['inf_2ano_dosi'] or 0
            total_record.inf_3ano_dosi = sum_totals['inf_3ano_dosi'] or 0
            total_record.inf_4ano_dosi = sum_totals['inf_4ano_dosi'] or 0
            total_record.inf_5ano_dosi = sum_totals['inf_5ano_dosi'] or 0
            total_record.inf_6ano_dosi = sum_totals['inf_6ano_dosi'] or 0
            total_record.inf_7ano_dosi = sum_totals['inf_7ano_dosi'] or 0
            total_record.inf_65an_dosi = sum_totals['inf_65an_dosi'] or 0
            total_record.inf_emba_dosi = sum_totals['inf_emba_dosi'] or 0
            total_record.inf_8a64_dosi = sum_totals['inf_8a64_dosi'] or 0
            total_record.inf_puer_dosi = sum_totals['inf_puer_dosi'] or 0
            total_record.inf_pers_salu_dosi = sum_totals['inf_pers_salu_dosi'] or 0
            total_record.inf_pers_disc_dosi = sum_totals['inf_pers_disc_dosi'] or 0
            total_record.inf_cuid_adul_dosi = sum_totals['inf_cuid_adul_dosi'] or 0
            total_record.inf_pers_cuid_dosi = sum_totals['inf_pers_cuid_dosi'] or 0
            total_record.inf_trab_avic_dosi = sum_totals['inf_trab_avic_dosi'] or 0
            total_record.inf_ppl_dosi = sum_totals['inf_ppl_dosi'] or 0
            total_record.inf_otro_ries_dosi = sum_totals['inf_otro_ries_dosi'] or 0
            total_record.inf_pobl_gene_dosi = sum_totals['inf_pobl_gene_dosi'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            influenza.objects.create(
                inf_fech=fech_fin,
                eniUser_id=eni_user_id,  # Guardar la relación con User
                inf_tota=True,
                inf_intr=sum_totals['inf_intr'] or 0,
                inf_extr_mies_cnh=sum_totals['inf_extr_mies_cnh'] or 0,
                inf_extr_mies_cibv=sum_totals['inf_extr_mies_cibv'] or 0,
                inf_extr_mine_egen=sum_totals['inf_extr_mine_egen'] or 0,
                inf_extr_mine_bach=sum_totals['inf_extr_mine_bach'] or 0,
                inf_extr_visi=sum_totals['inf_extr_visi'] or 0,
                inf_extr_aten=sum_totals['inf_extr_aten'] or 0,
                inf_otro=sum_totals['inf_otro'] or 0,
                inf_sexo_homb=sum_totals['inf_sexo_homb'] or 0,
                inf_sexo_muje=sum_totals['inf_sexo_muje'] or 0,
                inf_luga_pert=sum_totals['inf_luga_pert'] or 0,
                inf_luga_nope=sum_totals['inf_luga_nope'] or 0,
                inf_naci_ecua=sum_totals['inf_naci_ecua'] or 0,
                inf_naci_colo=sum_totals['inf_naci_colo'] or 0,
                inf_naci_peru=sum_totals['inf_naci_peru'] or 0,
                inf_naci_cuba=sum_totals['inf_naci_cuba'] or 0,
                inf_naci_vene=sum_totals['inf_naci_vene'] or 0,
                inf_naci_otro=sum_totals['inf_naci_otro'] or 0,
                inf_auto_indi=sum_totals['inf_auto_indi'] or 0,
                inf_auto_afro=sum_totals['inf_auto_afro'] or 0,
                inf_auto_negr=sum_totals['inf_auto_negr'] or 0,
                inf_auto_mula=sum_totals['inf_auto_mula'] or 0,
                inf_auto_mont=sum_totals['inf_auto_mont'] or 0,
                inf_auto_mest=sum_totals['inf_auto_mest'] or 0,
                inf_auto_blan=sum_totals['inf_auto_blan'] or 0,
                inf_auto_otro=sum_totals['inf_auto_otro'] or 0,
                inf_naci_achu=sum_totals['inf_naci_achu'] or 0,
                inf_naci_ando=sum_totals['inf_naci_ando'] or 0,
                inf_naci_awa=sum_totals['inf_naci_awa'] or 0,
                inf_naci_chac=sum_totals['inf_naci_chac'] or 0,
                inf_naci_cofa=sum_totals['inf_naci_cofa'] or 0,
                inf_naci_eper=sum_totals['inf_naci_eper'] or 0,
                inf_naci_huan=sum_totals['inf_naci_huan'] or 0,
                inf_naci_kich=sum_totals['inf_naci_kich'] or 0,
                inf_naci_mant=sum_totals['inf_naci_mant'] or 0,
                inf_naci_seco=sum_totals['inf_naci_seco'] or 0,
                inf_naci_shiw=sum_totals['inf_naci_shiw'] or 0,
                inf_naci_shua=sum_totals['inf_naci_shua'] or 0,
                inf_naci_sion=sum_totals['inf_naci_sion'] or 0,
                inf_naci_tsac=sum_totals['inf_naci_tsac'] or 0,
                inf_naci_waor=sum_totals['inf_naci_waor'] or 0,
                inf_naci_zapa=sum_totals['inf_naci_zapa'] or 0,
                inf_pueb_chib=sum_totals['inf_pueb_chib'] or 0,
                inf_pueb_kana=sum_totals['inf_pueb_kana'] or 0,
                inf_pueb_kara=sum_totals['inf_pueb_kara'] or 0,
                inf_pueb_kaya=sum_totals['inf_pueb_kaya'] or 0,
                inf_pueb_kich=sum_totals['inf_pueb_kich'] or 0,
                inf_pueb_kisa=sum_totals['inf_pueb_kisa'] or 0,
                inf_pueb_kitu=sum_totals['inf_pueb_kitu'] or 0,
                inf_pueb_nata=sum_totals['inf_pueb_nata'] or 0,
                inf_pueb_otav=sum_totals['inf_pueb_otav'] or 0,
                inf_pueb_palt=sum_totals['inf_pueb_palt'] or 0,
                inf_pueb_panz=sum_totals['inf_pueb_panz'] or 0,
                inf_pueb_past=sum_totals['inf_pueb_past'] or 0,
                inf_pueb_puru=sum_totals['inf_pueb_puru'] or 0,
                inf_pueb_sala=sum_totals['inf_pueb_sala'] or 0,
                inf_pueb_sara=sum_totals['inf_pueb_sara'] or 0,
                inf_pueb_toma=sum_totals['inf_pueb_toma'] or 0,
                inf_pueb_wara=sum_totals['inf_pueb_wara'] or 0,
                inf_6a11_prim=sum_totals['inf_6a11_prim'] or 0,
                inf_6a11_segu=sum_totals['inf_6a11_segu'] or 0,
                inf_1ano_dosi=sum_totals['inf_1ano_dosi'] or 0,
                inf_2ano_dosi=sum_totals['inf_2ano_dosi'] or 0,
                inf_3ano_dosi=sum_totals['inf_3ano_dosi'] or 0,
                inf_4ano_dosi=sum_totals['inf_4ano_dosi'] or 0,
                inf_5ano_dosi=sum_totals['inf_5ano_dosi'] or 0,
                inf_6ano_dosi=sum_totals['inf_6ano_dosi'] or 0,
                inf_7ano_dosi=sum_totals['inf_7ano_dosi'] or 0,
                inf_65an_dosi=sum_totals['inf_65an_dosi'] or 0,
                inf_emba_dosi=sum_totals['inf_emba_dosi'] or 0,
                inf_8a64_dosi=sum_totals['inf_8a64_dosi'] or 0,
                inf_puer_dosi=sum_totals['inf_puer_dosi'] or 0,
                inf_pers_salu_dosi=sum_totals['inf_pers_salu_dosi'] or 0,
                inf_pers_disc_dosi=sum_totals['inf_pers_disc_dosi'] or 0,
                inf_cuid_adul_dosi=sum_totals['inf_cuid_adul_dosi'] or 0,
                inf_pers_cuid_dosi=sum_totals['inf_pers_cuid_dosi'] or 0,
                inf_trab_avic_dosi=sum_totals['inf_trab_avic_dosi'] or 0,
                inf_ppl_dosi=sum_totals['inf_ppl_dosi'] or 0,
                inf_otro_ries_dosi=sum_totals['inf_otro_ries_dosi'] or 0,
                inf_pobl_gene_dosi=sum_totals['inf_pobl_gene_dosi'] or 0,
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=inf_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las valores de las variables de Influenza y Desperdicio
        des_bcg_dosapli = int(data.get('des_bcg_dosapli', 0))
        des_hbpe_dosapli = int(data.get('des_hbpe_dosapli', 0))
        des_rota_dosapli = int(data.get('des_rota_dosapli', 0))
        des_pent_dosapli = int(data.get('des_pent_dosapli', 0))
        des_fipv_dosapli = int(data.get('des_fipv_dosapli', 0))
        des_anti_dosapli = int(data.get('des_anti_dosapli', 0))
        des_neum_dosapli = int(data.get('des_neum_dosapli', 0))
        des_srp_dosapli = int(data.get('des_srp_dosapli', 0))
        des_vari_dosapli = int(data.get('des_vari_dosapli', 0))
        des_fieb_dosapli = int(data.get('des_fieb_dosapli', 0))
        des_dift_dosapli = int(data.get('des_dift_dosapli', 0))
        des_hpv_dosapli = int(data.get('des_hpv_dosapli', 0))
        des_dtad_dosapli = int(data.get('des_dtad_dosapli', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_dosapli = int(data.get('des_sr_dosapli', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_dosapli = int(data.get('des_hepa_dosapli', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_dosapli = int(data.get('des_inmant_dosapli', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_dosapli = int(data.get('des_inmanthepb_dosapli', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_dosapli = int(data.get('des_inmantrra_dosapli', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('inf_6a11_prim', 0)) + int(data.get('inf_6a11_segu', 0)) + \
            int(data.get('inf_1ano_dosi', 0)) + \
            int(data.get('inf_2ano_dosi', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('inf_3ano_dosi', 0)) + int(data.get('inf_4ano_dosi', 0)) + int(data.get('inf_5ano_dosi', 0)) + int(data.get('inf_6ano_dosi', 0)) + int(data.get('inf_7ano_dosi', 0)) + int(data.get('inf_65an_dosi', 0)) + int(data.get('inf_emba_dosi', 0)) + int(data.get('inf_8a64_dosi', 0)) + int(data.get(
            'inf_puer_dosi', 0)) + int(data.get('inf_pers_salu_dosi', 0)) + int(data.get('inf_pers_disc_dosi', 0)) + int(data.get('inf_cuid_adul_dosi', 0)) + int(data.get('inf_pers_cuid_dosi', 0)) + int(data.get('inf_trab_avic_dosi', 0)) + int(data.get('inf_ppl_dosi', 0)) + int(data.get('inf_otro_ries_dosi', 0)) + int(data.get('inf_pobl_gene_dosi', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli += des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi += des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi += des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli += des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi += des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi += des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli += des_rota_dosapli
            existing_record.des_rota_pervacenfabi += des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi += des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli += des_pent_dosapli
            existing_record.des_pent_pervacenfabi += des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi += des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli += des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi += des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi += des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli += des_anti_dosapli
            existing_record.des_anti_pervacenfabi += des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi += des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli += des_neum_dosapli
            existing_record.des_neum_pervacenfabi += des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi += des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli += des_sr_dosapli
            existing_record.des_sr_pervacenfabi += des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi += des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli += des_srp_dosapli
            existing_record.des_srp_pervacenfabi += des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi += des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli += des_vari_dosapli
            existing_record.des_vari_pervacenfabi += des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi += des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli += des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi += des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi += des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli += des_dift_dosapli
            existing_record.des_dift_pervacenfabi += des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi += des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli += des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi += des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi += des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli += des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi += des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi += des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli += des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi += des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi += des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli += des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi += des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi += des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli += des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi += des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi += des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli += des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi += des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi += des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli += des_infped_dosapli
            existing_record.des_infped_pervacenfabi += des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi += des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli += des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi += des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi += des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli += des_viru_dosapli
            existing_record.des_viru_pervacenfabi += des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi += des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli += des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi += des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi += des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli += des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi += des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi += des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli += des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi += des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi += des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli += des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi += des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi += des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=inf_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Create_Correcto}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch'], url_path='actualizar-influenza')
    def update_influenza(self, request, pk=None):
        data = request.data
        inf_fech = parse_date(data.get('inf_fech'))
        eni_user_id = data.get('eniUser')

        # Obtener la instancia existente
        instance = self.get_object()

        # Actualizar la instancia con los nuevos datos
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Crear variables de control
        fech_inicio = inf_fech.replace(day=1)
        fech_fin = (inf_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Filtrar registros del mes y sumar los valores donde inf_tota es False
        registros_mes = influenza.objects.filter(
            inf_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, inf_tota=False
        )
        sum_totals = registros_mes.aggregate(
            inf_intr=Sum('inf_intr'),
            inf_extr_mies_cnh=Sum('inf_extr_mies_cnh'),
            inf_extr_mies_cibv=Sum('inf_extr_mies_cibv'),
            inf_extr_mine_egen=Sum('inf_extr_mine_egen'),
            inf_extr_mine_bach=Sum('inf_extr_mine_bach'),
            inf_extr_visi=Sum('inf_extr_visi'),
            inf_extr_aten=Sum('inf_extr_aten'),
            inf_otro=Sum('inf_otro'),
            inf_sexo_homb=Sum('inf_sexo_homb'),
            inf_sexo_muje=Sum('inf_sexo_muje'),
            inf_luga_pert=Sum('inf_luga_pert'),
            inf_luga_nope=Sum('inf_luga_nope'),
            inf_naci_ecua=Sum('inf_naci_ecua'),
            inf_naci_colo=Sum('inf_naci_colo'),
            inf_naci_peru=Sum('inf_naci_peru'),
            inf_naci_cuba=Sum('inf_naci_cuba'),
            inf_naci_vene=Sum('inf_naci_vene'),
            inf_naci_otro=Sum('inf_naci_otro'),
            inf_auto_indi=Sum('inf_auto_indi'),
            inf_auto_afro=Sum('inf_auto_afro'),
            inf_auto_negr=Sum('inf_auto_negr'),
            inf_auto_mula=Sum('inf_auto_mula'),
            inf_auto_mont=Sum('inf_auto_mont'),
            inf_auto_mest=Sum('inf_auto_mest'),
            inf_auto_blan=Sum('inf_auto_blan'),
            inf_auto_otro=Sum('inf_auto_otro'),
            inf_naci_achu=Sum('inf_naci_achu'),
            inf_naci_ando=Sum('inf_naci_ando'),
            inf_naci_awa=Sum('inf_naci_awa'),
            inf_naci_chac=Sum('inf_naci_chac'),
            inf_naci_cofa=Sum('inf_naci_cofa'),
            inf_naci_eper=Sum('inf_naci_eper'),
            inf_naci_huan=Sum('inf_naci_huan'),
            inf_naci_kich=Sum('inf_naci_kich'),
            inf_naci_mant=Sum('inf_naci_mant'),
            inf_naci_seco=Sum('inf_naci_seco'),
            inf_naci_shiw=Sum('inf_naci_shiw'),
            inf_naci_shua=Sum('inf_naci_shua'),
            inf_naci_sion=Sum('inf_naci_sion'),
            inf_naci_tsac=Sum('inf_naci_tsac'),
            inf_naci_waor=Sum('inf_naci_waor'),
            inf_naci_zapa=Sum('inf_naci_zapa'),
            inf_pueb_chib=Sum('inf_pueb_chib'),
            inf_pueb_kana=Sum('inf_pueb_kana'),
            inf_pueb_kara=Sum('inf_pueb_kara'),
            inf_pueb_kaya=Sum('inf_pueb_kaya'),
            inf_pueb_kich=Sum('inf_pueb_kich'),
            inf_pueb_kisa=Sum('inf_pueb_kisa'),
            inf_pueb_kitu=Sum('inf_pueb_kitu'),
            inf_pueb_nata=Sum('inf_pueb_nata'),
            inf_pueb_otav=Sum('inf_pueb_otav'),
            inf_pueb_palt=Sum('inf_pueb_palt'),
            inf_pueb_panz=Sum('inf_pueb_panz'),
            inf_pueb_past=Sum('inf_pueb_past'),
            inf_pueb_puru=Sum('inf_pueb_puru'),
            inf_pueb_sala=Sum('inf_pueb_sala'),
            inf_pueb_sara=Sum('inf_pueb_sara'),
            inf_pueb_toma=Sum('inf_pueb_toma'),
            inf_pueb_wara=Sum('inf_pueb_wara'),
            inf_6a11_prim=Sum('inf_6a11_prim'),
            inf_6a11_segu=Sum('inf_6a11_segu'),
            inf_1ano_dosi=Sum('inf_1ano_dosi'),
            inf_2ano_dosi=Sum('inf_2ano_dosi'),
            inf_3ano_dosi=Sum('inf_3ano_dosi'),
            inf_4ano_dosi=Sum('inf_4ano_dosi'),
            inf_5ano_dosi=Sum('inf_5ano_dosi'),
            inf_6ano_dosi=Sum('inf_6ano_dosi'),
            inf_7ano_dosi=Sum('inf_7ano_dosi'),
            inf_65an_dosi=Sum('inf_65an_dosi'),
            inf_emba_dosi=Sum('inf_emba_dosi'),
            inf_8a64_dosi=Sum('inf_8a64_dosi'),
            inf_puer_dosi=Sum('inf_puer_dosi'),
            inf_pers_salu_dosi=Sum('inf_pers_salu_dosi'),
            inf_pers_disc_dosi=Sum('inf_pers_disc_dosi'),
            inf_cuid_adul_dosi=Sum('inf_cuid_adul_dosi'),
            inf_pers_cuid_dosi=Sum('inf_pers_cuid_dosi'),
            inf_trab_avic_dosi=Sum('inf_trab_avic_dosi'),
            inf_ppl_dosi=Sum('inf_ppl_dosi'),
            inf_otro_ries_dosi=Sum('inf_otro_ries_dosi'),
            inf_pobl_gene_dosi=Sum('inf_pobl_gene_dosi'),
        )

        # Actualizar o crear el registro total_record como en create_influenza
        total_record = influenza.objects.filter(
            eniUser_id=eni_user_id, inf_fech=fech_fin, inf_tota=True
        ).first()

        if total_record:
            # Actualizar el registro existente sumando los nuevos valores
            total_record.inf_intr = sum_totals['inf_intr'] or 0
            total_record.inf_extr_mies_cnh = sum_totals['inf_extr_mies_cnh'] or 0
            total_record.inf_extr_mies_cibv = sum_totals['inf_extr_mies_cibv'] or 0
            total_record.inf_extr_mine_egen = sum_totals['inf_extr_mine_egen'] or 0
            total_record.inf_extr_mine_bach = sum_totals['inf_extr_mine_bach'] or 0
            total_record.inf_extr_visi = sum_totals['inf_extr_visi'] or 0
            total_record.inf_extr_aten = sum_totals['inf_extr_aten'] or 0
            total_record.inf_otro = sum_totals['inf_otro'] or 0
            total_record.inf_sexo_homb = sum_totals['inf_sexo_homb'] or 0
            total_record.inf_sexo_muje = sum_totals['inf_sexo_muje'] or 0
            total_record.inf_luga_pert = sum_totals['inf_luga_pert'] or 0
            total_record.inf_luga_nope = sum_totals['inf_luga_nope'] or 0
            total_record.inf_naci_ecua = sum_totals['inf_naci_ecua'] or 0
            total_record.inf_naci_colo = sum_totals['inf_naci_colo'] or 0
            total_record.inf_naci_peru = sum_totals['inf_naci_peru'] or 0
            total_record.inf_naci_cuba = sum_totals['inf_naci_cuba'] or 0
            total_record.inf_naci_vene = sum_totals['inf_naci_vene'] or 0
            total_record.inf_naci_otro = sum_totals['inf_naci_otro'] or 0
            total_record.inf_auto_indi = sum_totals['inf_auto_indi'] or 0
            total_record.inf_auto_afro = sum_totals['inf_auto_afro'] or 0
            total_record.inf_auto_negr = sum_totals['inf_auto_negr'] or 0
            total_record.inf_auto_mula = sum_totals['inf_auto_mula'] or 0
            total_record.inf_auto_mont = sum_totals['inf_auto_mont'] or 0
            total_record.inf_auto_mest = sum_totals['inf_auto_mest'] or 0
            total_record.inf_auto_blan = sum_totals['inf_auto_blan'] or 0
            total_record.inf_auto_otro = sum_totals['inf_auto_otro'] or 0
            total_record.inf_naci_achu = sum_totals['inf_naci_achu'] or 0
            total_record.inf_naci_ando = sum_totals['inf_naci_ando'] or 0
            total_record.inf_naci_awa = sum_totals['inf_naci_awa'] or 0
            total_record.inf_naci_chac = sum_totals['inf_naci_chac'] or 0
            total_record.inf_naci_cofa = sum_totals['inf_naci_cofa'] or 0
            total_record.inf_naci_eper = sum_totals['inf_naci_eper'] or 0
            total_record.inf_naci_huan = sum_totals['inf_naci_huan'] or 0
            total_record.inf_naci_kich = sum_totals['inf_naci_kich'] or 0
            total_record.inf_naci_mant = sum_totals['inf_naci_mant'] or 0
            total_record.inf_naci_seco = sum_totals['inf_naci_seco'] or 0
            total_record.inf_naci_shiw = sum_totals['inf_naci_shiw'] or 0
            total_record.inf_naci_shua = sum_totals['inf_naci_shua'] or 0
            total_record.inf_naci_sion = sum_totals['inf_naci_sion'] or 0
            total_record.inf_naci_tsac = sum_totals['inf_naci_tsac'] or 0
            total_record.inf_naci_waor = sum_totals['inf_naci_waor'] or 0
            total_record.inf_naci_zapa = sum_totals['inf_naci_zapa'] or 0
            total_record.inf_pueb_chib = sum_totals['inf_pueb_chib'] or 0
            total_record.inf_pueb_kana = sum_totals['inf_pueb_kana'] or 0
            total_record.inf_pueb_kara = sum_totals['inf_pueb_kara'] or 0
            total_record.inf_pueb_kaya = sum_totals['inf_pueb_kaya'] or 0
            total_record.inf_pueb_kich = sum_totals['inf_pueb_kich'] or 0
            total_record.inf_pueb_kisa = sum_totals['inf_pueb_kisa'] or 0
            total_record.inf_pueb_kitu = sum_totals['inf_pueb_kitu'] or 0
            total_record.inf_pueb_nata = sum_totals['inf_pueb_nata'] or 0
            total_record.inf_pueb_otav = sum_totals['inf_pueb_otav'] or 0
            total_record.inf_pueb_palt = sum_totals['inf_pueb_palt'] or 0
            total_record.inf_pueb_panz = sum_totals['inf_pueb_panz'] or 0
            total_record.inf_pueb_past = sum_totals['inf_pueb_past'] or 0
            total_record.inf_pueb_puru = sum_totals['inf_pueb_puru'] or 0
            total_record.inf_pueb_sala = sum_totals['inf_pueb_sala'] or 0
            total_record.inf_pueb_sara = sum_totals['inf_pueb_sara'] or 0
            total_record.inf_pueb_toma = sum_totals['inf_pueb_toma'] or 0
            total_record.inf_pueb_wara = sum_totals['inf_pueb_wara'] or 0
            total_record.inf_6a11_prim = sum_totals['inf_6a11_prim'] or 0
            total_record.inf_6a11_segu = sum_totals['inf_6a11_segu'] or 0
            total_record.inf_1ano_dosi = sum_totals['inf_1ano_dosi'] or 0
            total_record.inf_2ano_dosi = sum_totals['inf_2ano_dosi'] or 0
            total_record.inf_3ano_dosi = sum_totals['inf_3ano_dosi'] or 0
            total_record.inf_4ano_dosi = sum_totals['inf_4ano_dosi'] or 0
            total_record.inf_5ano_dosi = sum_totals['inf_5ano_dosi'] or 0
            total_record.inf_6ano_dosi = sum_totals['inf_6ano_dosi'] or 0
            total_record.inf_7ano_dosi = sum_totals['inf_7ano_dosi'] or 0
            total_record.inf_65an_dosi = sum_totals['inf_65an_dosi'] or 0
            total_record.inf_emba_dosi = sum_totals['inf_emba_dosi'] or 0
            total_record.inf_8a64_dosi = sum_totals['inf_8a64_dosi'] or 0
            total_record.inf_puer_dosi = sum_totals['inf_puer_dosi'] or 0
            total_record.inf_pers_salu_dosi = sum_totals['inf_pers_salu_dosi'] or 0
            total_record.inf_pers_disc_dosi = sum_totals['inf_pers_disc_dosi'] or 0
            total_record.inf_cuid_adul_dosi = sum_totals['inf_cuid_adul_dosi'] or 0
            total_record.inf_pers_cuid_dosi = sum_totals['inf_pers_cuid_dosi'] or 0
            total_record.inf_trab_avic_dosi = sum_totals['inf_trab_avic_dosi'] or 0
            total_record.inf_ppl_dosi = sum_totals['inf_ppl_dosi'] or 0
            total_record.inf_otro_ries_dosi = sum_totals['inf_otro_ries_dosi'] or 0
            total_record.inf_pobl_gene_dosi = sum_totals['inf_pobl_gene_dosi'] or 0
            total_record.save()
        else:
            # Crear una nueva fila con los totales
            influenza.objects.create(
                inf_fech=fech_fin,
                eniUser_id=eni_user_id,
                inf_tota=True,
                inf_intr=sum_totals['inf_intr'] or 0,
                inf_extr_mies_cnh=sum_totals['inf_extr_mies_cnh'] or 0,
                inf_extr_mies_cibv=sum_totals['inf_extr_mies_cibv'] or 0,
                inf_extr_mine_egen=sum_totals['inf_extr_mine_egen'] or 0,
                inf_extr_mine_bach=sum_totals['inf_extr_mine_bach'] or 0,
                inf_extr_visi=sum_totals['inf_extr_visi'] or 0,
                inf_extr_aten=sum_totals['inf_extr_aten'] or 0,
                inf_otro=sum_totals['inf_otro'] or 0,
                inf_sexo_homb=sum_totals['inf_sexo_homb'] or 0,
                inf_sexo_muje=sum_totals['inf_sexo_muje'] or 0,
                inf_luga_pert=sum_totals['inf_luga_pert'] or 0,
                inf_luga_nope=sum_totals['inf_luga_nope'] or 0,
                inf_naci_ecua=sum_totals['inf_naci_ecua'] or 0,
                inf_naci_colo=sum_totals['inf_naci_colo'] or 0,
                inf_naci_peru=sum_totals['inf_naci_peru'] or 0,
                inf_naci_cuba=sum_totals['inf_naci_cuba'] or 0,
                inf_naci_vene=sum_totals['inf_naci_vene'] or 0,
                inf_naci_otro=sum_totals['inf_naci_otro'] or 0,
                inf_auto_indi=sum_totals['inf_auto_indi'] or 0,
                inf_auto_afro=sum_totals['inf_auto_afro'] or 0,
                inf_auto_negr=sum_totals['inf_auto_negr'] or 0,
                inf_auto_mula=sum_totals['inf_auto_mula'] or 0,
                inf_auto_mont=sum_totals['inf_auto_mont'] or 0,
                inf_auto_mest=sum_totals['inf_auto_mest'] or 0,
                inf_auto_blan=sum_totals['inf_auto_blan'] or 0,
                inf_auto_otro=sum_totals['inf_auto_otro'] or 0,
                inf_naci_achu=sum_totals['inf_naci_achu'] or 0,
                inf_naci_ando=sum_totals['inf_naci_ando'] or 0,
                inf_naci_awa=sum_totals['inf_naci_awa'] or 0,
                inf_naci_chac=sum_totals['inf_naci_chac'] or 0,
                inf_naci_cofa=sum_totals['inf_naci_cofa'] or 0,
                inf_naci_eper=sum_totals['inf_naci_eper'] or 0,
                inf_naci_huan=sum_totals['inf_naci_huan'] or 0,
                inf_naci_kich=sum_totals['inf_naci_kich'] or 0,
                inf_naci_mant=sum_totals['inf_naci_mant'] or 0,
                inf_naci_seco=sum_totals['inf_naci_seco'] or 0,
                inf_naci_shiw=sum_totals['inf_naci_shiw'] or 0,
                inf_naci_shua=sum_totals['inf_naci_shua'] or 0,
                inf_naci_sion=sum_totals['inf_naci_sion'] or 0,
                inf_naci_tsac=sum_totals['inf_naci_tsac'] or 0,
                inf_naci_waor=sum_totals['inf_naci_waor'] or 0,
                inf_naci_zapa=sum_totals['inf_naci_zapa'] or 0,
                inf_pueb_chib=sum_totals['inf_pueb_chib'] or 0,
                inf_pueb_kana=sum_totals['inf_pueb_kana'] or 0,
                inf_pueb_kara=sum_totals['inf_pueb_kara'] or 0,
                inf_pueb_kaya=sum_totals['inf_pueb_kaya'] or 0,
                inf_pueb_kich=sum_totals['inf_pueb_kich'] or 0,
                inf_pueb_kisa=sum_totals['inf_pueb_kisa'] or 0,
                inf_pueb_kitu=sum_totals['inf_pueb_kitu'] or 0,
                inf_pueb_nata=sum_totals['inf_pueb_nata'] or 0,
                inf_pueb_otav=sum_totals['inf_pueb_otav'] or 0,
                inf_pueb_palt=sum_totals['inf_pueb_palt'] or 0,
                inf_pueb_panz=sum_totals['inf_pueb_panz'] or 0,
                inf_pueb_past=sum_totals['inf_pueb_past'] or 0,
                inf_pueb_puru=sum_totals['inf_pueb_puru'] or 0,
                inf_pueb_sala=sum_totals['inf_pueb_sala'] or 0,
                inf_pueb_sara=sum_totals['inf_pueb_sara'] or 0,
                inf_pueb_toma=sum_totals['inf_pueb_toma'] or 0,
                inf_pueb_wara=sum_totals['inf_pueb_wara'] or 0,
                inf_6a11_prim=sum_totals['inf_6a11_prim'] or 0,
                inf_6a11_segu=sum_totals['inf_6a11_segu'] or 0,
                inf_1ano_dosi=sum_totals['inf_1ano_dosi'] or 0,
                inf_2ano_dosi=sum_totals['inf_2ano_dosi'] or 0,
                inf_3ano_dosi=sum_totals['inf_3ano_dosi'] or 0,
                inf_4ano_dosi=sum_totals['inf_4ano_dosi'] or 0,
                inf_5ano_dosi=sum_totals['inf_5ano_dosi'] or 0,
                inf_6ano_dosi=sum_totals['inf_6ano_dosi'] or 0,
                inf_7ano_dosi=sum_totals['inf_7ano_dosi'] or 0,
                inf_65an_dosi=sum_totals['inf_65an_dosi'] or 0,
                inf_emba_dosi=sum_totals['inf_emba_dosi'] or 0,
                inf_8a64_dosi=sum_totals['inf_8a64_dosi'] or 0,
                inf_puer_dosi=sum_totals['inf_puer_dosi'] or 0,
                inf_pers_salu_dosi=sum_totals['inf_pers_salu_dosi'] or 0,
                inf_pers_disc_dosi=sum_totals['inf_pers_disc_dosi'] or 0,
                inf_cuid_adul_dosi=sum_totals['inf_cuid_adul_dosi'] or 0,
                inf_pers_cuid_dosi=sum_totals['inf_pers_cuid_dosi'] or 0,
                inf_trab_avic_dosi=sum_totals['inf_trab_avic_dosi'] or 0,
                inf_ppl_dosi=sum_totals['inf_ppl_dosi'] or 0,
                inf_otro_ries_dosi=sum_totals['inf_otro_ries_dosi'] or 0,
                inf_pobl_gene_dosi=sum_totals['inf_pobl_gene_dosi'] or 0,
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=inf_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular las valores de las variables de Temprano y Desperdicio
        des_bcg_dosapli = int(data.get('des_bcg_dosapli', 0))
        des_hbpe_dosapli = int(data.get('des_hbpe_dosapli', 0))
        des_rota_dosapli = int(data.get('des_rota_dosapli', 0))
        des_pent_dosapli = int(data.get('des_pent_dosapli', 0))
        des_fipv_dosapli = int(data.get('des_fipv_dosapli', 0))
        des_anti_dosapli = int(data.get('des_anti_dosapli', 0))
        des_neum_dosapli = int(data.get('des_neum_dosapli', 0))
        des_srp_dosapli = int(data.get('des_srp_dosapli', 0))
        des_vari_dosapli = int(data.get('des_vari_dosapli', 0))
        des_fieb_dosapli = int(data.get('des_fieb_dosapli', 0))
        des_dift_dosapli = int(data.get('des_dift_dosapli', 0))
        des_hpv_dosapli = int(data.get('des_hpv_dosapli', 0))
        des_dtad_dosapli = int(data.get('des_dtad_dosapli', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))
        des_hbpe_pervacenfabi = int(data.get('des_hbpe_pervacenfabi', 0))
        des_hbpe_pervacfrasnoabi = int(data.get('des_hbpe_pervacfrasnoabi', 0))
        des_rota_pervacenfabi = int(data.get('des_rota_pervacenfabi', 0))
        des_rota_pervacfrasnoabi = int(data.get('des_rota_pervacfrasnoabi', 0))
        des_pent_pervacenfabi = int(data.get('des_pent_pervacenfabi', 0))
        des_pent_pervacfrasnoabi = int(data.get('des_pent_pervacfrasnoabi', 0))
        des_fipv_pervacenfabi = int(data.get('des_fipv_pervacenfabi', 0))
        des_fipv_pervacfrasnoabi = int(data.get('des_fipv_pervacfrasnoabi', 0))
        des_anti_pervacenfabi = int(data.get('des_anti_pervacenfabi', 0))
        des_anti_pervacfrasnoabi = int(data.get('des_anti_pervacfrasnoabi', 0))
        des_neum_pervacenfabi = int(data.get('des_neum_pervacenfabi', 0))
        des_neum_pervacfrasnoabi = int(data.get('des_neum_pervacfrasnoabi', 0))
        des_sr_dosapli = int(data.get('des_sr_dosapli', 0))
        des_sr_pervacenfabi = int(data.get('des_sr_pervacenfabi', 0))
        des_sr_pervacfrasnoabi = int(data.get('des_sr_pervacfrasnoabi', 0))
        des_srp_pervacenfabi = int(data.get('des_srp_pervacenfabi', 0))
        des_srp_pervacfrasnoabi = int(data.get('des_srp_pervacfrasnoabi', 0))
        des_vari_pervacenfabi = int(data.get('des_vari_pervacenfabi', 0))
        des_vari_pervacfrasnoabi = int(data.get('des_vari_pervacfrasnoabi', 0))
        des_fieb_pervacenfabi = int(data.get('des_fieb_pervacenfabi', 0))
        des_fieb_pervacfrasnoabi = int(data.get('des_fieb_pervacfrasnoabi', 0))
        des_dift_pervacenfabi = int(data.get('des_dift_pervacenfabi', 0))
        des_dift_pervacfrasnoabi = int(data.get('des_dift_pervacfrasnoabi', 0))
        des_hpv_pervacenfabi = int(data.get('des_hpv_pervacenfabi', 0))
        des_hpv_pervacfrasnoabi = int(data.get('des_hpv_pervacfrasnoabi', 0))
        des_dtad_pervacenfabi = int(data.get('des_dtad_pervacenfabi', 0))
        des_dtad_pervacfrasnoabi = int(data.get('des_dtad_pervacfrasnoabi', 0))
        des_hepa_dosapli = int(data.get('des_hepa_dosapli', 0))
        des_hepa_pervacenfabi = int(data.get('des_hepa_pervacenfabi', 0))
        des_hepa_pervacfrasnoabi = int(data.get('des_hepa_pervacfrasnoabi', 0))
        des_inmant_dosapli = int(data.get('des_inmant_dosapli', 0))
        des_inmant_pervacenfabi = int(data.get('des_inmant_pervacenfabi', 0))
        des_inmant_pervacfrasnoabi = int(
            data.get('des_inmant_pervacfrasnoabi', 0))
        des_inmanthepb_dosapli = int(data.get('des_inmanthepb_dosapli', 0))
        des_inmanthepb_pervacenfabi = int(
            data.get('des_inmanthepb_pervacenfabi', 0))
        des_inmanthepb_pervacfrasnoabi = int(
            data.get('des_inmanthepb_pervacfrasnoabi', 0))
        des_inmantrra_dosapli = int(data.get('des_inmantrra_dosapli', 0))
        des_inmantrra_pervacenfabi = int(
            data.get('des_inmantrra_pervacenfabi', 0))
        des_inmantrra_pervacfrasnoabi = int(
            data.get('des_inmantrra_pervacfrasnoabi', 0))
        des_infped_dosapli = int(data.get('inf_6a11_prim', 0)) + int(data.get('inf_6a11_segu', 0)) + \
            int(data.get('inf_1ano_dosi', 0)) + \
            int(data.get('inf_2ano_dosi', 0))
        des_infped_pervacenfabi = int(data.get('des_infped_pervacenfabi', 0))
        des_infped_pervacfrasnoabi = int(
            data.get('des_infped_pervacfrasnoabi', 0))
        des_infadu_dosapli = int(data.get('inf_3ano_dosi', 0)) + int(data.get('inf_4ano_dosi', 0)) + int(data.get('inf_5ano_dosi', 0)) + int(data.get('inf_6ano_dosi', 0)) + int(data.get('inf_7ano_dosi', 0)) + int(data.get('inf_65an_dosi', 0)) + int(data.get('inf_emba_dosi', 0)) + int(data.get('inf_8a64_dosi', 0)) + int(data.get(
            'inf_puer_dosi', 0)) + int(data.get('inf_pers_salu_dosi', 0)) + int(data.get('inf_pers_disc_dosi', 0)) + int(data.get('inf_cuid_adul_dosi', 0)) + int(data.get('inf_pers_cuid_dosi', 0)) + int(data.get('inf_trab_avic_dosi', 0)) + int(data.get('inf_ppl_dosi', 0)) + int(data.get('inf_otro_ries_dosi', 0)) + int(data.get('inf_pobl_gene_dosi', 0))
        des_infadu_pervacenfabi = int(data.get('des_infadu_pervacenfabi', 0))
        des_infadu_pervacfrasnoabi = int(
            data.get('des_infadu_pervacfrasnoabi', 0))
        des_viru_dosapli = int(data.get('des_viru_dosapli', 0))
        des_viru_pervacenfabi = int(data.get('des_viru_pervacenfabi', 0))
        des_viru_pervacfrasnoabi = int(data.get('des_viru_pervacfrasnoabi', 0))
        des_vacsin_dosapli = int(data.get('des_vacsin_dosapli', 0))
        des_vacsin_pervacenfabi = int(data.get('des_vacsin_pervacenfabi', 0))
        des_vacsin_pervacfrasnoabi = int(
            data.get('des_vacsin_pervacfrasnoabi', 0))
        des_vacpfi_dosapli = int(data.get('des_vacpfi_dosapli', 0))
        des_vacpfi_pervacenfabi = int(data.get('des_vacpfi_pervacenfabi', 0))
        des_vacpfi_pervacfrasnoabi = int(
            data.get('des_vacpfi_pervacfrasnoabi', 0))
        des_vacmod_dosapli = int(data.get('des_vacmod_dosapli', 0))
        des_vacmod_pervacenfabi = int(data.get('des_vacmod_pervacenfabi', 0))
        des_vacmod_pervacfrasnoabi = int(
            data.get('des_vacmod_pervacfrasnoabi', 0))
        des_vacvphcam_dosapli = int(data.get('des_vacvphcam_dosapli', 0))
        des_vacvphcam_pervacenfabi = int(
            data.get('des_vacvphcam_pervacenfabi', 0))
        des_vacvphcam_pervacfrasnoabi = int(
            data.get('des_vacvphcam_pervacfrasnoabi', 0))

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli = des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi = des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi = des_bcg_pervacfrasnoabi
            existing_record.des_hbpe_dosapli = des_hbpe_dosapli
            existing_record.des_hbpe_pervacenfabi = des_hbpe_pervacenfabi
            existing_record.des_hbpe_pervacfrasnoabi = des_hbpe_pervacfrasnoabi
            existing_record.des_rota_dosapli = des_rota_dosapli
            existing_record.des_rota_pervacenfabi = des_rota_pervacenfabi
            existing_record.des_rota_pervacfrasnoabi = des_rota_pervacfrasnoabi
            existing_record.des_pent_dosapli = des_pent_dosapli
            existing_record.des_pent_pervacenfabi = des_pent_pervacenfabi
            existing_record.des_pent_pervacfrasnoabi = des_pent_pervacfrasnoabi
            existing_record.des_fipv_dosapli = des_fipv_dosapli
            existing_record.des_fipv_pervacenfabi = des_fipv_pervacenfabi
            existing_record.des_fipv_pervacfrasnoabi = des_fipv_pervacfrasnoabi
            existing_record.des_anti_dosapli = des_anti_dosapli
            existing_record.des_anti_pervacenfabi = des_anti_pervacenfabi
            existing_record.des_anti_pervacfrasnoabi = des_anti_pervacfrasnoabi
            existing_record.des_neum_dosapli = des_neum_dosapli
            existing_record.des_neum_pervacenfabi = des_neum_pervacenfabi
            existing_record.des_neum_pervacfrasnoabi = des_neum_pervacfrasnoabi
            existing_record.des_sr_dosapli = des_sr_dosapli
            existing_record.des_sr_pervacenfabi = des_sr_pervacenfabi
            existing_record.des_sr_pervacfrasnoabi = des_sr_pervacfrasnoabi
            existing_record.des_srp_dosapli = des_srp_dosapli
            existing_record.des_srp_pervacenfabi = des_srp_pervacenfabi
            existing_record.des_srp_pervacfrasnoabi = des_srp_pervacfrasnoabi
            existing_record.des_vari_dosapli = des_vari_dosapli
            existing_record.des_vari_pervacenfabi = des_vari_pervacenfabi
            existing_record.des_vari_pervacfrasnoabi = des_vari_pervacfrasnoabi
            existing_record.des_fieb_dosapli = des_fieb_dosapli
            existing_record.des_fieb_pervacenfabi = des_fieb_pervacenfabi
            existing_record.des_fieb_pervacfrasnoabi = des_fieb_pervacfrasnoabi
            existing_record.des_dift_dosapli = des_dift_dosapli
            existing_record.des_dift_pervacenfabi = des_dift_pervacenfabi
            existing_record.des_dift_pervacfrasnoabi = des_dift_pervacfrasnoabi
            existing_record.des_hpv_dosapli = des_hpv_dosapli
            existing_record.des_hpv_pervacenfabi = des_hpv_pervacenfabi
            existing_record.des_hpv_pervacfrasnoabi = des_hpv_pervacfrasnoabi
            existing_record.des_dtad_dosapli = des_dtad_dosapli
            existing_record.des_dtad_pervacenfabi = des_dtad_pervacenfabi
            existing_record.des_dtad_pervacfrasnoabi = des_dtad_pervacfrasnoabi
            existing_record.des_hepa_dosapli = des_hepa_dosapli
            existing_record.des_hepa_pervacenfabi = des_hepa_pervacenfabi
            existing_record.des_hepa_pervacfrasnoabi = des_hepa_pervacfrasnoabi
            existing_record.des_inmant_dosapli = des_inmant_dosapli
            existing_record.des_inmant_pervacenfabi = des_inmant_pervacenfabi
            existing_record.des_inmant_pervacfrasnoabi = des_inmant_pervacfrasnoabi
            existing_record.des_inmanthepb_dosapli = des_inmanthepb_dosapli
            existing_record.des_inmanthepb_pervacenfabi = des_inmanthepb_pervacenfabi
            existing_record.des_inmanthepb_pervacfrasnoabi = des_inmanthepb_pervacfrasnoabi
            existing_record.des_inmantrra_dosapli = des_inmantrra_dosapli
            existing_record.des_inmantrra_pervacenfabi = des_inmantrra_pervacenfabi
            existing_record.des_inmantrra_pervacfrasnoabi = des_inmantrra_pervacfrasnoabi
            existing_record.des_infped_dosapli = des_infped_dosapli
            existing_record.des_infped_pervacenfabi = des_infped_pervacenfabi
            existing_record.des_infped_pervacfrasnoabi = des_infped_pervacfrasnoabi
            existing_record.des_infadu_dosapli = des_infadu_dosapli
            existing_record.des_infadu_pervacenfabi = des_infadu_pervacenfabi
            existing_record.des_infadu_pervacfrasnoabi = des_infadu_pervacfrasnoabi
            existing_record.des_viru_dosapli = des_viru_dosapli
            existing_record.des_viru_pervacenfabi = des_viru_pervacenfabi
            existing_record.des_viru_pervacfrasnoabi = des_viru_pervacfrasnoabi
            existing_record.des_vacsin_dosapli = des_vacsin_dosapli
            existing_record.des_vacsin_pervacenfabi = des_vacsin_pervacenfabi
            existing_record.des_vacsin_pervacfrasnoabi = des_vacsin_pervacfrasnoabi
            existing_record.des_vacpfi_dosapli = des_vacpfi_dosapli
            existing_record.des_vacpfi_pervacenfabi = des_vacpfi_pervacenfabi
            existing_record.des_vacpfi_pervacfrasnoabi = des_vacpfi_pervacfrasnoabi
            existing_record.des_vacmod_dosapli = des_vacmod_dosapli
            existing_record.des_vacmod_pervacenfabi = des_vacmod_pervacenfabi
            existing_record.des_vacmod_pervacfrasnoabi = des_vacmod_pervacfrasnoabi
            existing_record.des_vacvphcam_dosapli = des_vacvphcam_dosapli
            existing_record.des_vacvphcam_pervacenfabi = des_vacvphcam_pervacenfabi
            existing_record.des_vacvphcam_pervacfrasnoabi = des_vacvphcam_pervacfrasnoabi
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=inf_fech,
                des_bcg_dosapli=des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_hbpe_dosapli=des_hbpe_dosapli,
                des_hbpe_pervacenfabi=des_hbpe_pervacenfabi,
                des_hbpe_pervacfrasnoabi=des_hbpe_pervacfrasnoabi,
                des_rota_dosapli=des_rota_dosapli,
                des_rota_pervacenfabi=des_rota_pervacenfabi,
                des_rota_pervacfrasnoabi=des_rota_pervacfrasnoabi,
                des_pent_dosapli=des_pent_dosapli,
                des_pent_pervacenfabi=des_pent_pervacenfabi,
                des_pent_pervacfrasnoabi=des_pent_pervacfrasnoabi,
                des_fipv_dosapli=des_fipv_dosapli,
                des_fipv_pervacenfabi=des_fipv_pervacenfabi,
                des_fipv_pervacfrasnoabi=des_fipv_pervacfrasnoabi,
                des_anti_dosapli=des_anti_dosapli,
                des_anti_pervacenfabi=des_anti_pervacenfabi,
                des_anti_pervacfrasnoabi=des_anti_pervacfrasnoabi,
                des_neum_dosapli=des_neum_dosapli,
                des_neum_pervacenfabi=des_neum_pervacenfabi,
                des_neum_pervacfrasnoabi=des_neum_pervacfrasnoabi,
                des_sr_dosapli=des_sr_dosapli,
                des_sr_pervacenfabi=des_sr_pervacenfabi,
                des_sr_pervacfrasnoabi=des_sr_pervacfrasnoabi,
                des_srp_dosapli=des_srp_dosapli,
                des_srp_pervacenfabi=des_srp_pervacenfabi,
                des_srp_pervacfrasnoabi=des_srp_pervacfrasnoabi,
                des_vari_dosapli=des_vari_dosapli,
                des_vari_pervacenfabi=des_vari_pervacenfabi,
                des_vari_pervacfrasnoabi=des_vari_pervacfrasnoabi,
                des_fieb_dosapli=des_fieb_dosapli,
                des_fieb_pervacenfabi=des_fieb_pervacenfabi,
                des_fieb_pervacfrasnoabi=des_fieb_pervacfrasnoabi,
                des_dift_dosapli=des_dift_dosapli,
                des_dift_pervacenfabi=des_dift_pervacenfabi,
                des_dift_pervacfrasnoabi=des_dift_pervacfrasnoabi,
                des_hpv_dosapli=des_hpv_dosapli,
                des_hpv_pervacenfabi=des_hpv_pervacenfabi,
                des_hpv_pervacfrasnoabi=des_hpv_pervacfrasnoabi,
                des_dtad_dosapli=des_dtad_dosapli,
                des_dtad_pervacenfabi=des_dtad_pervacenfabi,
                des_dtad_pervacfrasnoabi=des_dtad_pervacfrasnoabi,
                des_hepa_dosapli=des_hepa_dosapli,
                des_hepa_pervacenfabi=des_hepa_pervacenfabi,
                des_hepa_pervacfrasnoabi=des_hepa_pervacfrasnoabi,
                des_inmant_dosapli=des_inmant_dosapli,
                des_inmant_pervacenfabi=des_inmant_pervacenfabi,
                des_inmant_pervacfrasnoabi=des_inmant_pervacfrasnoabi,
                des_inmanthepb_dosapli=des_inmanthepb_dosapli,
                des_inmanthepb_pervacenfabi=des_inmanthepb_pervacenfabi,
                des_inmanthepb_pervacfrasnoabi=des_inmanthepb_pervacfrasnoabi,
                des_inmantrra_dosapli=des_inmantrra_dosapli,
                des_inmantrra_pervacenfabi=des_inmantrra_pervacenfabi,
                des_inmantrra_pervacfrasnoabi=des_inmantrra_pervacfrasnoabi,
                des_infped_dosapli=des_infped_dosapli,
                des_infped_pervacenfabi=des_infped_pervacenfabi,
                des_infped_pervacfrasnoabi=des_infped_pervacfrasnoabi,
                des_infadu_dosapli=des_infadu_dosapli,
                des_infadu_pervacenfabi=des_infadu_pervacenfabi,
                des_infadu_pervacfrasnoabi=des_infadu_pervacfrasnoabi,
                des_viru_dosapli=des_viru_dosapli,
                des_viru_pervacenfabi=des_viru_pervacenfabi,
                des_viru_pervacfrasnoabi=des_viru_pervacfrasnoabi,
                des_vacsin_dosapli=des_vacsin_dosapli,
                des_vacsin_pervacenfabi=des_vacsin_pervacenfabi,
                des_vacsin_pervacfrasnoabi=des_vacsin_pervacfrasnoabi,
                des_vacpfi_dosapli=des_vacpfi_dosapli,
                des_vacpfi_pervacenfabi=des_vacpfi_pervacenfabi,
                des_vacpfi_pervacfrasnoabi=des_vacpfi_pervacfrasnoabi,
                des_vacmod_dosapli=des_vacmod_dosapli,
                des_vacmod_pervacenfabi=des_vacmod_pervacenfabi,
                des_vacmod_pervacfrasnoabi=des_vacmod_pervacfrasnoabi,
                des_vacvphcam_dosapli=des_vacvphcam_dosapli,
                des_vacvphcam_pervacenfabi=des_vacvphcam_pervacenfabi,
                des_vacvphcam_pervacfrasnoabi=des_vacvphcam_pervacfrasnoabi,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(fech_inicio, fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi'),
            total_des_hbpe_dosapli=Sum('des_hbpe_dosapli'),
            total_des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi'),
            total_des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi'),
            total_des_rota_dosapli=Sum('des_rota_dosapli'),
            total_des_rota_pervacenfabi=Sum('des_rota_pervacenfabi'),
            total_des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi'),
            total_des_pent_dosapli=Sum('des_pent_dosapli'),
            total_des_pent_pervacenfabi=Sum('des_pent_pervacenfabi'),
            total_des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi'),
            total_des_fipv_dosapli=Sum('des_fipv_dosapli'),
            total_des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi'),
            total_des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi'),
            total_des_anti_dosapli=Sum('des_anti_dosapli'),
            total_des_anti_pervacenfabi=Sum('des_anti_pervacenfabi'),
            total_des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi'),
            total_des_neum_dosapli=Sum('des_neum_dosapli'),
            total_des_neum_pervacenfabi=Sum('des_neum_pervacenfabi'),
            total_des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi'),
            total_des_sr_dosapli=Sum('des_sr_dosapli'),
            total_des_sr_pervacenfabi=Sum('des_sr_pervacenfabi'),
            total_des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi'),
            total_des_srp_dosapli=Sum('des_srp_dosapli'),
            total_des_srp_pervacenfabi=Sum('des_srp_pervacenfabi'),
            total_des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi'),
            total_des_vari_dosapli=Sum('des_vari_dosapli'),
            total_des_vari_pervacenfabi=Sum('des_vari_pervacenfabi'),
            total_des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi'),
            total_des_fieb_dosapli=Sum('des_fieb_dosapli'),
            total_des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi'),
            total_des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi'),
            total_des_dift_dosapli=Sum('des_dift_dosapli'),
            total_des_dift_pervacenfabi=Sum('des_dift_pervacenfabi'),
            total_des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi'),
            total_des_hpv_dosapli=Sum('des_hpv_dosapli'),
            total_des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi'),
            total_des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi'),
            total_des_dtad_dosapli=Sum('des_dtad_dosapli'),
            total_des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi'),
            total_des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi'),
            total_des_hepa_dosapli=Sum('des_hepa_dosapli'),
            total_des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi'),
            total_des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi'),
            total_des_inmant_dosapli=Sum('des_inmant_dosapli'),
            total_des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi'),
            total_des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi'),
            total_des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli'),
            total_des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi'),
            total_des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            total_des_inmantrra_dosapli=Sum('des_inmantrra_dosapli'),
            total_des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi'),
            total_des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi'),
            total_des_infped_dosapli=Sum('des_infped_dosapli'),
            total_des_infped_pervacenfabi=Sum('des_infped_pervacenfabi'),
            total_des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi'),
            total_des_infadu_dosapli=Sum('des_infadu_dosapli'),
            total_des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi'),
            total_des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi'),
            total_des_viru_dosapli=Sum('des_viru_dosapli'),
            total_des_viru_pervacenfabi=Sum('des_viru_pervacenfabi'),
            total_des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi'),
            total_des_vacsin_dosapli=Sum('des_vacsin_dosapli'),
            total_des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi'),
            total_des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi'),
            total_des_vacpfi_dosapli=Sum('des_vacpfi_dosapli'),
            total_des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi'),
            total_des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi'),
            total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'),
            total_des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi'),
            total_des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi'),
            total_des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli'),
            total_des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi'),
            total_des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.des_hbpe_dosapli = sum_data_des['total_des_hbpe_dosapli']
            existing_record_des.des_hbpe_pervacenfabi = sum_data_des['total_des_hbpe_pervacenfabi']
            existing_record_des.des_hbpe_pervacfrasnoabi = sum_data_des[
                'total_des_hbpe_pervacfrasnoabi']
            existing_record_des.des_rota_dosapli = sum_data_des['total_des_rota_dosapli']
            existing_record_des.des_rota_pervacenfabi = sum_data_des['total_des_rota_pervacenfabi']
            existing_record_des.des_rota_pervacfrasnoabi = sum_data_des[
                'total_des_rota_pervacfrasnoabi']
            existing_record_des.des_pent_dosapli = sum_data_des['total_des_pent_dosapli']
            existing_record_des.des_pent_pervacenfabi = sum_data_des['total_des_pent_pervacenfabi']
            existing_record_des.des_pent_pervacfrasnoabi = sum_data_des[
                'total_des_pent_pervacfrasnoabi']
            existing_record_des.des_fipv_dosapli = sum_data_des['total_des_fipv_dosapli']
            existing_record_des.des_fipv_pervacenfabi = sum_data_des['total_des_fipv_pervacenfabi']
            existing_record_des.des_fipv_pervacfrasnoabi = sum_data_des[
                'total_des_fipv_pervacfrasnoabi']
            existing_record_des.des_anti_dosapli = sum_data_des['total_des_anti_dosapli']
            existing_record_des.des_anti_pervacenfabi = sum_data_des['total_des_anti_pervacenfabi']
            existing_record_des.des_anti_pervacfrasnoabi = sum_data_des[
                'total_des_anti_pervacfrasnoabi']
            existing_record_des.des_neum_dosapli = sum_data_des['total_des_neum_dosapli']
            existing_record_des.des_neum_pervacenfabi = sum_data_des['total_des_neum_pervacenfabi']
            existing_record_des.des_neum_pervacfrasnoabi = sum_data_des[
                'total_des_neum_pervacfrasnoabi']
            existing_record_des.des_sr_dosapli = sum_data_des['total_des_sr_dosapli']
            existing_record_des.des_sr_pervacenfabi = sum_data_des['total_des_sr_pervacenfabi']
            existing_record_des.des_sr_pervacfrasnoabi = sum_data_des['total_des_sr_pervacfrasnoabi']
            existing_record_des.des_srp_dosapli = sum_data_des['total_des_srp_dosapli']
            existing_record_des.des_srp_pervacenfabi = sum_data_des['total_des_srp_pervacenfabi']
            existing_record_des.des_srp_pervacfrasnoabi = sum_data_des[
                'total_des_srp_pervacfrasnoabi']
            existing_record_des.des_vari_dosapli = sum_data_des['total_des_vari_dosapli']
            existing_record_des.des_vari_pervacenfabi = sum_data_des['total_des_vari_pervacenfabi']
            existing_record_des.des_vari_pervacfrasnoabi = sum_data_des[
                'total_des_vari_pervacfrasnoabi']
            existing_record_des.des_fieb_dosapli = sum_data_des['total_des_fieb_dosapli']
            existing_record_des.des_fieb_pervacenfabi = sum_data_des['total_des_fieb_pervacenfabi']
            existing_record_des.des_fieb_pervacfrasnoabi = sum_data_des[
                'total_des_fieb_pervacfrasnoabi']
            existing_record_des.des_dift_dosapli = sum_data_des['total_des_dift_dosapli']
            existing_record_des.des_dift_pervacenfabi = sum_data_des['total_des_dift_pervacenfabi']
            existing_record_des.des_dift_pervacfrasnoabi = sum_data_des[
                'total_des_dift_pervacfrasnoabi']
            existing_record_des.des_hpv_dosapli = sum_data_des['total_des_hpv_dosapli']
            existing_record_des.des_hpv_pervacenfabi = sum_data_des['total_des_hpv_pervacenfabi']
            existing_record_des.des_hpv_pervacfrasnoabi = sum_data_des[
                'total_des_hpv_pervacfrasnoabi']
            existing_record_des.des_dtad_dosapli = sum_data_des['total_des_dtad_dosapli']
            existing_record_des.des_dtad_pervacenfabi = sum_data_des['total_des_dtad_pervacenfabi']
            existing_record_des.des_dtad_pervacfrasnoabi = sum_data_des[
                'total_des_dtad_pervacfrasnoabi']
            existing_record_des.des_hepa_dosapli = sum_data_des['total_des_hepa_dosapli']
            existing_record_des.des_hepa_pervacenfabi = sum_data_des['total_des_hepa_pervacenfabi']
            existing_record_des.des_hepa_pervacfrasnoabi = sum_data_des[
                'total_des_hepa_pervacfrasnoabi']
            existing_record_des.des_inmant_dosapli = sum_data_des['total_des_inmant_dosapli']
            existing_record_des.des_inmant_pervacenfabi = sum_data_des[
                'total_des_inmant_pervacenfabi']
            existing_record_des.des_inmant_pervacfrasnoabi = sum_data_des[
                'total_des_inmant_pervacfrasnoabi']
            existing_record_des.des_inmanthepb_dosapli = sum_data_des['total_des_inmanthepb_dosapli']
            existing_record_des.des_inmanthepb_pervacenfabi = sum_data_des[
                'total_des_inmanthepb_pervacenfabi']
            existing_record_des.des_inmanthepb_pervacfrasnoabi = sum_data_des[
                'total_des_inmanthepb_pervacfrasnoabi']
            existing_record_des.des_inmantrra_dosapli = sum_data_des['total_des_inmantrra_dosapli']
            existing_record_des.des_inmantrra_pervacenfabi = sum_data_des[
                'total_des_inmantrra_pervacenfabi']
            existing_record_des.des_inmantrra_pervacfrasnoabi = sum_data_des[
                'total_des_inmantrra_pervacfrasnoabi']
            existing_record_des.des_infped_dosapli = sum_data_des['total_des_infped_dosapli']
            existing_record_des.des_infped_pervacenfabi = sum_data_des[
                'total_des_infped_pervacenfabi']
            existing_record_des.des_infped_pervacfrasnoabi = sum_data_des[
                'total_des_infped_pervacfrasnoabi']
            existing_record_des.des_infadu_dosapli = sum_data_des['total_des_infadu_dosapli']
            existing_record_des.des_infadu_pervacenfabi = sum_data_des[
                'total_des_infadu_pervacenfabi']
            existing_record_des.des_infadu_pervacfrasnoabi = sum_data_des[
                'total_des_infadu_pervacfrasnoabi']
            existing_record_des.des_viru_dosapli = sum_data_des['total_des_viru_dosapli']
            existing_record_des.des_viru_pervacenfabi = sum_data_des['total_des_viru_pervacenfabi']
            existing_record_des.des_viru_pervacfrasnoabi = sum_data_des[
                'total_des_viru_pervacfrasnoabi']
            existing_record_des.des_vacsin_dosapli = sum_data_des['total_des_vacsin_dosapli']
            existing_record_des.des_vacsin_pervacenfabi = sum_data_des[
                'total_des_vacsin_pervacenfabi']
            existing_record_des.des_vacsin_pervacfrasnoabi = sum_data_des[
                'total_des_vacsin_pervacfrasnoabi']
            existing_record_des.des_vacpfi_dosapli = sum_data_des['total_des_vacpfi_dosapli']
            existing_record_des.des_vacpfi_pervacenfabi = sum_data_des[
                'total_des_vacpfi_pervacenfabi']
            existing_record_des.des_vacpfi_pervacfrasnoabi = sum_data_des[
                'total_des_vacpfi_pervacfrasnoabi']
            existing_record_des.des_vacmod_dosapli = sum_data_des['total_des_vacmod_dosapli']
            existing_record_des.des_vacmod_pervacenfabi = sum_data_des[
                'total_des_vacmod_pervacenfabi']
            existing_record_des.des_vacmod_pervacfrasnoabi = sum_data_des[
                'total_des_vacmod_pervacfrasnoabi']
            existing_record_des.des_vacvphcam_dosapli = sum_data_des['total_des_vacvphcam_dosapli']
            existing_record_des.des_vacvphcam_pervacenfabi = sum_data_des[
                'total_des_vacvphcam_pervacenfabi']
            existing_record_des.des_vacvphcam_pervacfrasnoabi = sum_data_des[
                'total_des_vacvphcam_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_hbpe_dosapli=sum_data_des['total_des_hbpe_dosapli'],
                des_hbpe_pervacenfabi=sum_data_des['total_des_hbpe_pervacenfabi'],
                des_hbpe_pervacfrasnoabi=sum_data_des['total_des_hbpe_pervacfrasnoabi'],
                des_rota_dosapli=sum_data_des['total_des_rota_dosapli'],
                des_rota_pervacenfabi=sum_data_des['total_des_rota_pervacenfabi'],
                des_rota_pervacfrasnoabi=sum_data_des['total_des_rota_pervacfrasnoabi'],
                des_pent_dosapli=sum_data_des['total_des_pent_dosapli'],
                des_pent_pervacenfabi=sum_data_des['total_des_pent_pervacenfabi'],
                des_pent_pervacfrasnoabi=sum_data_des['total_des_pent_pervacfrasnoabi'],
                des_fipv_dosapli=sum_data_des['total_des_fipv_dosapli'],
                des_fipv_pervacenfabi=sum_data_des['total_des_fipv_pervacenfabi'],
                des_fipv_pervacfrasnoabi=sum_data_des['total_des_fipv_pervacfrasnoabi'],
                des_anti_dosapli=sum_data_des['total_des_anti_dosapli'],
                des_anti_pervacenfabi=sum_data_des['total_des_anti_pervacenfabi'],
                des_anti_pervacfrasnoabi=sum_data_des['total_des_anti_pervacfrasnoabi'],
                des_neum_dosapli=sum_data_des['total_des_neum_dosapli'],
                des_neum_pervacenfabi=sum_data_des['total_des_neum_pervacenfabi'],
                des_neum_pervacfrasnoabi=sum_data_des['total_des_neum_pervacfrasnoabi'],
                des_sr_dosapli=sum_data_des['total_des_sr_dosapli'],
                des_sr_pervacenfabi=sum_data_des['total_des_sr_pervacenfabi'],
                des_sr_pervacfrasnoabi=sum_data_des['total_des_sr_pervacfrasnoabi'],
                des_srp_dosapli=sum_data_des['total_des_srp_dosapli'],
                des_srp_pervacenfabi=sum_data_des['total_des_srp_pervacenfabi'],
                des_srp_pervacfrasnoabi=sum_data_des['total_des_srp_pervacfrasnoabi'],
                des_vari_dosapli=sum_data_des['total_des_vari_dosapli'],
                des_vari_pervacenfabi=sum_data_des['total_des_vari_pervacenfabi'],
                des_vari_pervacfrasnoabi=sum_data_des['total_des_vari_pervacfrasnoabi'],
                des_fieb_dosapli=sum_data_des['total_des_fieb_dosapli'],
                des_fieb_pervacenfabi=sum_data_des['total_des_fieb_pervacenfabi'],
                des_fieb_pervacfrasnoabi=sum_data_des['total_des_fieb_pervacfrasnoabi'],
                des_dift_dosapli=sum_data_des['total_des_dift_dosapli'],
                des_dift_pervacenfabi=sum_data_des['total_des_dift_pervacenfabi'],
                des_dift_pervacfrasnoabi=sum_data_des['total_des_dift_pervacfrasnoabi'],
                des_hpv_dosapli=sum_data_des['total_des_hpv_dosapli'],
                des_hpv_pervacenfabi=sum_data_des['total_des_hpv_pervacenfabi'],
                des_hpv_pervacfrasnoabi=sum_data_des['total_des_hpv_pervacfrasnoabi'],
                des_dtad_dosapli=sum_data_des['total_des_dtad_dosapli'],
                des_dtad_pervacenfabi=sum_data_des['total_des_dtad_pervacenfabi'],
                des_dtad_pervacfrasnoabi=sum_data_des['total_des_dtad_pervacfrasnoabi'],
                des_hepa_dosapli=sum_data_des['total_des_hepa_dosapli'],
                des_hepa_pervacenfabi=sum_data_des['total_des_hepa_pervacenfabi'],
                des_hepa_pervacfrasnoabi=sum_data_des['total_des_hepa_pervacfrasnoabi'],
                des_inmant_dosapli=sum_data_des['total_des_inmant_dosapli'],
                des_inmant_pervacenfabi=sum_data_des['total_des_inmant_pervacenfabi'],
                des_inmant_pervacfrasnoabi=sum_data_des['total_des_inmant_pervacfrasnoabi'],
                des_inmanthepb_dosapli=sum_data_des['total_des_inmanthepb_dosapli'],
                des_inmanthepb_pervacenfabi=sum_data_des['total_des_inmanthepb_pervacenfabi'],
                des_inmanthepb_pervacfrasnoabi=sum_data_des['total_des_inmanthepb_pervacfrasnoabi'],
                des_inmantrra_dosapli=sum_data_des['total_des_inmantrra_dosapli'],
                des_inmantrra_pervacenfabi=sum_data_des['total_des_inmantrra_pervacenfabi'],
                des_inmantrra_pervacfrasnoabi=sum_data_des['total_des_inmantrra_pervacfrasnoabi'],
                des_infped_dosapli=sum_data_des['total_des_infped_dosapli'],
                des_infped_pervacenfabi=sum_data_des['total_des_infped_pervacenfabi'],
                des_infped_pervacfrasnoabi=sum_data_des['total_des_infped_pervacfrasnoabi'],
                des_infadu_dosapli=sum_data_des['total_des_infadu_dosapli'],
                des_infadu_pervacenfabi=sum_data_des['total_des_infadu_pervacenfabi'],
                des_infadu_pervacfrasnoabi=sum_data_des['total_des_infadu_pervacfrasnoabi'],
                des_viru_dosapli=sum_data_des['total_des_viru_dosapli'],
                des_viru_pervacenfabi=sum_data_des['total_des_viru_pervacenfabi'],
                des_viru_pervacfrasnoabi=sum_data_des['total_des_viru_pervacfrasnoabi'],
                des_vacsin_dosapli=sum_data_des['total_des_vacsin_dosapli'],
                des_vacsin_pervacenfabi=sum_data_des['total_des_vacsin_pervacenfabi'],
                des_vacsin_pervacfrasnoabi=sum_data_des['total_des_vacsin_pervacfrasnoabi'],
                des_vacpfi_dosapli=sum_data_des['total_des_vacpfi_dosapli'],
                des_vacpfi_pervacenfabi=sum_data_des['total_des_vacpfi_pervacenfabi'],
                des_vacpfi_pervacfrasnoabi=sum_data_des['total_des_vacpfi_pervacfrasnoabi'],
                des_vacmod_dosapli=sum_data_des['total_des_vacmod_dosapli'],
                des_vacmod_pervacenfabi=sum_data_des['total_des_vacmod_pervacenfabi'],
                des_vacmod_pervacfrasnoabi=sum_data_des['total_des_vacmod_pervacfrasnoabi'],
                des_vacvphcam_dosapli=sum_data_des['total_des_vacvphcam_dosapli'],
                des_vacvphcam_pervacenfabi=sum_data_des['total_des_vacvphcam_pervacenfabi'],
                des_vacvphcam_pervacfrasnoabi=sum_data_des['total_des_vacvphcam_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": Dato_Update_Correcto, "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='eliminar-influenza')
    def delete_influenza(self, request, pk=None):
        data = request.data
        inf_fech = parse_date(data.get('inf_fech'))
        eni_user_id = data.get('eniUser')

        # Crear variables de control
        fech_inicio = inf_fech.replace(day=1)
        fech_fin = (inf_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)

        # Eliminar registros en 'influenza' donde inf_tota=False
        primeros_registros = influenza.objects.filter(
            eniUser_id=eni_user_id,
            inf_fech=inf_fech,
            inf_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros.exists():
            primer_registro = primeros_registros.first()
            primer_registro.delete()

        # Filtrar registros del mes y sumar los valores donde inf_tota es False
        registros_mes = influenza.objects.filter(
            inf_fech__range=(
                fech_inicio, fech_fin), eniUser_id=eni_user_id, inf_tota=False
        )
        sum_totals = registros_mes.aggregate(
            inf_intr=Sum('inf_intr') or 0,
            inf_extr_mies_cnh=Sum('inf_extr_mies_cnh') or 0,
            inf_extr_mies_cibv=Sum('inf_extr_mies_cibv') or 0,
            inf_extr_mine_egen=Sum('inf_extr_mine_egen') or 0,
            inf_extr_mine_bach=Sum('inf_extr_mine_bach') or 0,
            inf_extr_visi=Sum('inf_extr_visi') or 0,
            inf_extr_aten=Sum('inf_extr_aten') or 0,
            inf_otro=Sum('inf_otro') or 0,
            inf_sexo_homb=Sum('inf_sexo_homb') or 0,
            inf_sexo_muje=Sum('inf_sexo_muje') or 0,
            inf_luga_pert=Sum('inf_luga_pert') or 0,
            inf_luga_nope=Sum('inf_luga_nope') or 0,
            inf_naci_ecua=Sum('inf_naci_ecua') or 0,
            inf_naci_colo=Sum('inf_naci_colo') or 0,
            inf_naci_peru=Sum('inf_naci_peru') or 0,
            inf_naci_cuba=Sum('inf_naci_cuba') or 0,
            inf_naci_vene=Sum('inf_naci_vene') or 0,
            inf_naci_otro=Sum('inf_naci_otro') or 0,
            inf_auto_indi=Sum('inf_auto_indi') or 0,
            inf_auto_afro=Sum('inf_auto_afro') or 0,
            inf_auto_negr=Sum('inf_auto_negr') or 0,
            inf_auto_mula=Sum('inf_auto_mula') or 0,
            inf_auto_mont=Sum('inf_auto_mont') or 0,
            inf_auto_mest=Sum('inf_auto_mest') or 0,
            inf_auto_blan=Sum('inf_auto_blan') or 0,
            inf_auto_otro=Sum('inf_auto_otro') or 0,
            inf_naci_achu=Sum('inf_naci_achu') or 0,
            inf_naci_ando=Sum('inf_naci_ando') or 0,
            inf_naci_awa=Sum('inf_naci_awa') or 0,
            inf_naci_chac=Sum('inf_naci_chac') or 0,
            inf_naci_cofa=Sum('inf_naci_cofa') or 0,
            inf_naci_eper=Sum('inf_naci_eper') or 0,
            inf_naci_huan=Sum('inf_naci_huan') or 0,
            inf_naci_kich=Sum('inf_naci_kich') or 0,
            inf_naci_mant=Sum('inf_naci_mant') or 0,
            inf_naci_seco=Sum('inf_naci_seco') or 0,
            inf_naci_shiw=Sum('inf_naci_shiw') or 0,
            inf_naci_shua=Sum('inf_naci_shua') or 0,
            inf_naci_sion=Sum('inf_naci_sion') or 0,
            inf_naci_tsac=Sum('inf_naci_tsac') or 0,
            inf_naci_waor=Sum('inf_naci_waor') or 0,
            inf_naci_zapa=Sum('inf_naci_zapa') or 0,
            inf_pueb_chib=Sum('inf_pueb_chib') or 0,
            inf_pueb_kana=Sum('inf_pueb_kana') or 0,
            inf_pueb_kara=Sum('inf_pueb_kara') or 0,
            inf_pueb_kaya=Sum('inf_pueb_kaya') or 0,
            inf_pueb_kich=Sum('inf_pueb_kich') or 0,
            inf_pueb_kisa=Sum('inf_pueb_kisa') or 0,
            inf_pueb_kitu=Sum('inf_pueb_kitu') or 0,
            inf_pueb_nata=Sum('inf_pueb_nata') or 0,
            inf_pueb_otav=Sum('inf_pueb_otav') or 0,
            inf_pueb_palt=Sum('inf_pueb_palt') or 0,
            inf_pueb_panz=Sum('inf_pueb_panz') or 0,
            inf_pueb_past=Sum('inf_pueb_past') or 0,
            inf_pueb_puru=Sum('inf_pueb_puru') or 0,
            inf_pueb_sala=Sum('inf_pueb_sala') or 0,
            inf_pueb_sara=Sum('inf_pueb_sara') or 0,
            inf_pueb_toma=Sum('inf_pueb_toma') or 0,
            inf_pueb_wara=Sum('inf_pueb_wara') or 0,
            inf_6a11_prim=Sum('inf_6a11_prim') or 0,
            inf_6a11_segu=Sum('inf_6a11_segu') or 0,
            inf_1ano_dosi=Sum('inf_1ano_dosi') or 0,
            inf_2ano_dosi=Sum('inf_2ano_dosi') or 0,
            inf_3ano_dosi=Sum('inf_3ano_dosi') or 0,
            inf_4ano_dosi=Sum('inf_4ano_dosi') or 0,
            inf_5ano_dosi=Sum('inf_5ano_dosi') or 0,
            inf_6ano_dosi=Sum('inf_6ano_dosi') or 0,
            inf_7ano_dosi=Sum('inf_7ano_dosi') or 0,
            inf_65an_dosi=Sum('inf_65an_dosi') or 0,
            inf_emba_dosi=Sum('inf_emba_dosi') or 0,
            inf_8a64_dosi=Sum('inf_8a64_dosi') or 0,
            inf_puer_dosi=Sum('inf_puer_dosi') or 0,
            inf_pers_salu_dosi=Sum('inf_pers_salu_dosi') or 0,
            inf_pers_disc_dosi=Sum('inf_pers_disc_dosi') or 0,
            inf_cuid_adul_dosi=Sum('inf_cuid_adul_dosi') or 0,
            inf_pers_cuid_dosi=Sum('inf_pers_cuid_dosi') or 0,
            inf_trab_avic_dosi=Sum('inf_trab_avic_dosi') or 0,
            inf_ppl_dosi=Sum('inf_ppl_dosi') or 0,
            inf_otro_ries_dosi=Sum('inf_otro_ries_dosi') or 0,
            inf_pobl_gene_dosi=Sum('inf_pobl_gene_dosi') or 0,
        )
        sum_totals = {k: v if v is not None else 0 for k,
                      v in sum_totals.items()}

        # Actualizar o crear el registro total en 'influenza'
        _, created = influenza.objects.update_or_create(
            eniUser_id=eni_user_id,
            inf_fech=fech_fin,
            inf_tota=True,
            defaults=sum_totals
        )

        # Eliminar registros en 'desperdicio' donde des_tota=False
        primeros_registros_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech=inf_fech,
            des_tota=False
            # Asegúrate de que 'id' es el campo correcto para ordenar
        ).order_by('id')
        if primeros_registros_des.exists():
            primer_registro_des = primeros_registros_des.first()
            primer_registro_des.delete()

        # Recalcular los totales en 'desperdicio' para el mes
        registros_mes_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(fech_inicio, fech_fin),
            des_tota=False
        )

        sum_totals_des = registros_mes_des.aggregate(
            des_bcg_dosapli=Sum('des_bcg_dosapli') or 0,
            des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi') or 0,
            des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi') or 0,
            des_hbpe_dosapli=Sum('des_hbpe_dosapli') or 0,
            des_hbpe_pervacenfabi=Sum('des_hbpe_pervacenfabi') or 0,
            des_hbpe_pervacfrasnoabi=Sum('des_hbpe_pervacfrasnoabi') or 0,
            des_rota_dosapli=Sum('des_rota_dosapli') or 0,
            des_rota_pervacenfabi=Sum('des_rota_pervacenfabi') or 0,
            des_rota_pervacfrasnoabi=Sum('des_rota_pervacfrasnoabi') or 0,
            des_pent_dosapli=Sum('des_pent_dosapli') or 0,
            des_pent_pervacenfabi=Sum('des_pent_pervacenfabi') or 0,
            des_pent_pervacfrasnoabi=Sum('des_pent_pervacfrasnoabi') or 0,
            des_fipv_dosapli=Sum('des_fipv_dosapli') or 0,
            des_fipv_pervacenfabi=Sum('des_fipv_pervacenfabi') or 0,
            des_fipv_pervacfrasnoabi=Sum('des_fipv_pervacfrasnoabi') or 0,
            des_anti_dosapli=Sum('des_anti_dosapli') or 0,
            des_anti_pervacenfabi=Sum('des_anti_pervacenfabi') or 0,
            des_anti_pervacfrasnoabi=Sum('des_anti_pervacfrasnoabi') or 0,
            des_neum_dosapli=Sum('des_neum_dosapli') or 0,
            des_neum_pervacenfabi=Sum('des_neum_pervacenfabi') or 0,
            des_neum_pervacfrasnoabi=Sum('des_neum_pervacfrasnoabi') or 0,
            des_sr_dosapli=Sum('des_sr_dosapli') or 0,
            des_sr_pervacenfabi=Sum('des_sr_pervacenfabi') or 0,
            des_sr_pervacfrasnoabi=Sum('des_sr_pervacfrasnoabi') or 0,
            des_srp_dosapli=Sum('des_srp_dosapli') or 0,
            des_srp_pervacenfabi=Sum('des_srp_pervacenfabi') or 0,
            des_srp_pervacfrasnoabi=Sum('des_srp_pervacfrasnoabi') or 0,
            des_vari_dosapli=Sum('des_vari_dosapli') or 0,
            des_vari_pervacenfabi=Sum('des_vari_pervacenfabi') or 0,
            des_vari_pervacfrasnoabi=Sum('des_vari_pervacfrasnoabi') or 0,
            des_fieb_dosapli=Sum('des_fieb_dosapli') or 0,
            des_fieb_pervacenfabi=Sum('des_fieb_pervacenfabi') or 0,
            des_fieb_pervacfrasnoabi=Sum('des_fieb_pervacfrasnoabi') or 0,
            des_dift_dosapli=Sum('des_dift_dosapli') or 0,
            des_dift_pervacenfabi=Sum('des_dift_pervacenfabi') or 0,
            des_dift_pervacfrasnoabi=Sum('des_dift_pervacfrasnoabi') or 0,
            des_hpv_dosapli=Sum('des_hpv_dosapli') or 0,
            des_hpv_pervacenfabi=Sum('des_hpv_pervacenfabi') or 0,
            des_hpv_pervacfrasnoabi=Sum('des_hpv_pervacfrasnoabi') or 0,
            des_dtad_dosapli=Sum('des_dtad_dosapli') or 0,
            des_dtad_pervacenfabi=Sum('des_dtad_pervacenfabi') or 0,
            des_dtad_pervacfrasnoabi=Sum('des_dtad_pervacfrasnoabi') or 0,
            des_hepa_dosapli=Sum('des_hepa_dosapli') or 0,
            des_hepa_pervacenfabi=Sum('des_hepa_pervacenfabi') or 0,
            des_hepa_pervacfrasnoabi=Sum('des_hepa_pervacfrasnoabi') or 0,
            des_inmant_dosapli=Sum('des_inmant_dosapli') or 0,
            des_inmant_pervacenfabi=Sum('des_inmant_pervacenfabi') or 0,
            des_inmant_pervacfrasnoabi=Sum('des_inmant_pervacfrasnoabi') or 0,
            des_inmanthepb_dosapli=Sum('des_inmanthepb_dosapli') or 0,
            des_inmanthepb_pervacenfabi=Sum(
                'des_inmanthepb_pervacenfabi') or 0,
            des_inmanthepb_pervacfrasnoabi=Sum(
                'des_inmanthepb_pervacfrasnoabi') or 0,
            des_inmantrra_dosapli=Sum('des_inmantrra_dosapli') or 0,
            des_inmantrra_pervacenfabi=Sum('des_inmantrra_pervacenfabi') or 0,
            des_inmantrra_pervacfrasnoabi=Sum(
                'des_inmantrra_pervacfrasnoabi') or 0,
            des_infped_dosapli=Sum('des_infped_dosapli') or 0,
            des_infped_pervacenfabi=Sum('des_infped_pervacenfabi') or 0,
            des_infped_pervacfrasnoabi=Sum('des_infped_pervacfrasnoabi') or 0,
            des_infadu_dosapli=Sum('des_infadu_dosapli') or 0,
            des_infadu_pervacenfabi=Sum('des_infadu_pervacenfabi') or 0,
            des_infadu_pervacfrasnoabi=Sum('des_infadu_pervacfrasnoabi') or 0,
            des_viru_dosapli=Sum('des_viru_dosapli') or 0,
            des_viru_pervacenfabi=Sum('des_viru_pervacenfabi') or 0,
            des_viru_pervacfrasnoabi=Sum('des_viru_pervacfrasnoabi') or 0,
            des_vacsin_dosapli=Sum('des_vacsin_dosapli') or 0,
            des_vacsin_pervacenfabi=Sum('des_vacsin_pervacenfabi') or 0,
            des_vacsin_pervacfrasnoabi=Sum('des_vacsin_pervacfrasnoabi') or 0,
            des_vacpfi_dosapli=Sum('des_vacpfi_dosapli') or 0,
            des_vacpfi_pervacenfabi=Sum('des_vacpfi_pervacenfabi') or 0,
            des_vacpfi_pervacfrasnoabi=Sum('des_vacpfi_pervacfrasnoabi') or 0,
            des_vacmod_dosapli=Sum('des_vacmod_dosapli') or 0,
            des_vacmod_pervacenfabi=Sum('des_vacmod_pervacenfabi') or 0,
            des_vacmod_pervacfrasnoabi=Sum('des_vacmod_pervacfrasnoabi') or 0,
            des_vacvphcam_dosapli=Sum('des_vacvphcam_dosapli') or 0,
            des_vacvphcam_pervacenfabi=Sum('des_vacvphcam_pervacenfabi') or 0,
            des_vacvphcam_pervacfrasnoabi=Sum(
                'des_vacvphcam_pervacfrasnoabi') or 0,
        )
        sum_totals_des = {k: v if v is not None else 0 for k,
                          v in sum_totals_des.items()}

        # Actualizar o crear el registro total en 'desperdicio'
        _, created = desperdicio.objects.update_or_create(
            eniUser_id=eni_user_id,
            des_fech=fech_fin,
            des_tota=True,
            defaults=sum_totals_des
        )

        return Response({"message": Dato_Delete_Correcto}, status=status.HTTP_200_OK)


class ReporteENIRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = ReporteENIRegistrationSerializer
    queryset = reporte_eni.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                rep_fech__year=year, rep_fech__month=month)

        return queryset.order_by('rep_fech', 'rep_eni')


class AdmisionDatosRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = AdmisionDatosRegistrationSerializer
    queryset = admision_datos.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                adm_dato_admi_fech_admi__year=year, adm_dato_admi_fech_admi__month=month)

        return queryset.order_by('adm_dato_admi_fech_admi')

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        fecha_admision = datetime.now()
        data['adm_dato_admi_fech_admi'] = fecha_admision.strftime(
            '%Y-%m-%d %H:%M:%S')

        # Procesar nombres y apellidos correctamente
        apellidos = data.get('adm_dato_pers_apel_prim',
                             '').strip().split(' ', 1)
        nombres = data.get('adm_dato_pers_nomb_prim', '').strip().split(' ', 1)

        data['adm_dato_pers_apel_prim'] = apellidos[0] if apellidos else ''
        data['adm_dato_pers_apel_segu'] = apellidos[1] if len(
            apellidos) > 1 else ''
        data['adm_dato_pers_nomb_prim'] = nombres[0] if nombres else ''
        data['adm_dato_pers_nomb_segu'] = nombres[1] if len(
            nombres) > 1 else ''
        data['adm_dato_paci_falt_dato'] = 1

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Se creo la admision del usuario exitosamente!", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"message": "Error al crear la admision", "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='buscar-admision')
    def buscar_admision(self, request):
        tipo = request.query_params.get('tipo')
        identificacion = request.query_params.get('identificacion')

        if not tipo or not identificacion:
            return Response({"error": "El parámetro identificacion es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_data = admision_datos.objects.get(
                adm_dato_pers_tipo_iden=tipo, adm_dato_pers_nume_iden=identificacion
            )
            data = {
                "id_admision_datos": user_data.id,
                "adm_dato_pers_apel_prim": user_data.adm_dato_pers_apel_prim,
                "adm_dato_pers_apel_segu": user_data.adm_dato_pers_apel_segu,
                "adm_dato_pers_nomb_prim": user_data.adm_dato_pers_nomb_prim,
                "adm_dato_pers_nomb_segu": user_data.adm_dato_pers_nomb_segu,
                'adm_dato_pers_esta_civi': user_data.adm_dato_pers_esta_civi,
                'adm_dato_pers_sexo': user_data.adm_dato_pers_sexo,
                'adm_dato_pers_tele': user_data.adm_dato_pers_tele,
                'adm_dato_pers_celu': user_data.adm_dato_pers_celu,
                'adm_dato_pers_corr_elec': user_data.adm_dato_pers_corr_elec,
                'adm_dato_naci_luga_naci': user_data.adm_dato_naci_luga_naci,
                'adm_dato_naci_naci': user_data.adm_dato_naci_naci,
                'adm_dato_naci_fech_naci': user_data.adm_dato_naci_fech_naci,
                'adm_dato_resi_pais_resi': user_data.adm_dato_resi_pais_resi,
                'adm_dato_resi_prov': user_data.adm_dato_resi_prov,
                'adm_dato_resi_cant': user_data.adm_dato_resi_cant,
                'adm_dato_resi_parr': user_data.adm_dato_resi_parr,
                'adm_dato_resi_esta_adsc_terr': user_data.adm_dato_resi_esta_adsc_terr,
                'adm_dato_resi_barr_sect': user_data.adm_dato_resi_barr_sect,
                'adm_dato_resi_call_prin': user_data.adm_dato_resi_call_prin,
                'adm_dato_resi_call_secu': user_data.adm_dato_resi_call_secu,
                'adm_dato_resi_refe_resi': user_data.adm_dato_resi_refe_resi,
                'adm_dato_auto_auto_etni': user_data.adm_dato_auto_auto_etni,
                'adm_dato_auto_naci_etni': user_data.adm_dato_auto_naci_etni,
                'adm_dato_auto_pueb_kich': user_data.adm_dato_auto_pueb_kich,
                'adm_dato_adic_grup_prio': user_data.adm_dato_adic_grup_prio,
                'adm_dato_adic_nive_educ': user_data.adm_dato_adic_nive_educ,
                'adm_dato_adic_esta_nive_educ': user_data.adm_dato_adic_esta_nive_educ,
                'adm_dato_adic_tipo_empr_trab': user_data.adm_dato_adic_tipo_empr_trab,
                'adm_dato_adic_ocup_prof_prin': user_data.adm_dato_adic_ocup_prof_prin,
                'adm_dato_adic_tipo_segu': user_data.adm_dato_adic_tipo_segu,
                'adm_dato_adic_tien_disc': user_data.adm_dato_adic_tien_disc,
                'adm_dato_repr_tipo_iden': user_data.adm_dato_repr_tipo_iden,
                'adm_dato_repr_nume_iden': user_data.adm_dato_repr_nume_iden,
                'adm_dato_repr_apel': user_data.adm_dato_repr_apel,
                'adm_dato_repr_nomb': user_data.adm_dato_repr_nomb,
                'adm_dato_repr_fech_naci': user_data.adm_dato_repr_fech_naci,
                'adm_dato_repr_pare': user_data.adm_dato_repr_pare,
                'adm_dato_repr_nume_tele': user_data.adm_dato_repr_nume_tele,
                'adm_dato_repr_naci': user_data.adm_dato_repr_naci,
                'adm_dato_cont_enca_nece_llam': user_data.adm_dato_cont_enca_nece_llam,
                'adm_dato_cont_pare': user_data.adm_dato_cont_pare,
                'adm_dato_cont_dire': user_data.adm_dato_cont_dire,
                'adm_dato_cont_tele': user_data.adm_dato_cont_tele,
                'adm_dato_paci_falt_dato': user_data.adm_dato_paci_falt_dato,
            }
            return Response({"message": "El usuario está registrado en admision!", "data": data}, status=status.HTTP_200_OK)
        except admision_datos.DoesNotExist:
            return Response({"error": "El usuario ingresado no existe en la base de datos."}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        admision_id = pk
        if not admision_id:
            return Response({"error": "El parámetro 'id' es requerido para actualizar el registro!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            admision = admision_datos.objects.get(id=admision_id)
        except admision_datos.DoesNotExist:
            return Response({"error": "Registro de admisión no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        apellidos = data.get('adm_dato_pers_apel_prim',
                             '').strip().split(' ', 1)
        nombres = data.get('adm_dato_pers_nomb_prim', '').strip().split(' ', 1)

        data['adm_dato_pers_apel_prim'] = apellidos[0] if apellidos else ''
        data['adm_dato_pers_apel_segu'] = apellidos[1] if len(
            apellidos) > 1 else ''
        data['adm_dato_pers_nomb_prim'] = nombres[0] if nombres else ''
        data['adm_dato_pers_nomb_segu'] = nombres[1] if len(
            nombres) > 1 else ''
        data['adm_dato_paci_falt_dato'] = 1

        serializer = self.get_serializer(
            admision, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({"message": "La admisión se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)


class Form008EmergenciaRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = Form008EmergenciaRegistrationSerializer
    queryset = form_008_emergencia.objects.all()
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [1, 3]  # p.ej. 1=ADMINISTRADOR, 3=MEDICO

    def get_permissions(self):
        # Puedes ajustar por acción
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            self.allowed_roles = [1, 3]
        elif self.action in ('reporte_mensual', 'reporte_diagnostico'):
            self.allowed_roles = [1, 3]
        else:
            self.allowed_roles = [1, 3]
        return [IsAuthenticated(), HasRole()]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                for_008_emer_fech_aten__year=year, for_008_emer_fech_aten__month=month)

        return queryset.order_by('for_008_emer_fech_aten')

    # , permission_classes=[IsAuthenticated])
    @action(detail=False, methods=['get'], url_path='listar-atenciones-form-008')
    def listar_atenciones_form_008(self, request):
        try:
            id_eni_user = request.query_params.get('id_eni_user')
            if not id_eni_user:
                return Response(
                    {"detail": "El parámetro id_eni_user es requerido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            qs = (
                self.get_queryset()
                .filter(eniUser=id_eni_user)
                .order_by(
                    '-for_008_emer_fech_repor',
                    'for_008_emer_prim_apel',
                    'for_008_emer_segu_apel',
                    'for_008_emer_prim_nomb',
                    'for_008_emer_segu_nomb'
                )[:30]
            )

            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # , permission_classes=[IsAuthenticated])
    @action(detail=False, methods=['get'], url_path='listar-atenciones-paciente')
    def listar_atenciones_paciente(self, request):
        try:
            id_admision_datos = request.query_params.get('admision_datos')
            if not id_admision_datos:
                return Response(
                    {"detail": "El parámetro id_admision_datos es requerido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            qs = (
                self.get_queryset()
                .filter(admision_datos=id_admision_datos)
                .order_by(
                    '-for_008_emer_fech_aten',
                    '-for_008_emer_hora_aten',
                )[:6]
            )

            if not qs.exists():
                return Response({"message": "El paciente no registra atenciones previas de Form-008 Emergencia en el sistema!"}, status=status.HTTP_200_OK)

            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    class Echo:
        def write(self, value):
            return value

    # , permission_classes=[IsAuthenticated])
    @action(detail=False, methods=['get'], url_path='reporte-atenciones-csv')
    def reporte_atenciones_csv(self, request):
        """
        GET /form-008-emergencia/reporte-atenciones-csv/?id_eni_user=ID&for_008_emer_fech_aten_min=YYYY-MM-DD&for_008_emer_fech_aten_max=YYYY-MM-DD&user_rol=ROL        
        """
        # 1) Parámetros
        id_eni_user = request.query_params.get("id_eni_user")
        fecha_min_str = request.query_params.get("for_008_emer_fech_aten_min")
        fecha_max_str = request.query_params.get("for_008_emer_fech_aten_max")
        form_008_user_rol = request.query_params.get('user_rol', None)

        faltantes = []
        if form_008_user_rol is None:
            faltantes.append('user_rol')
        if not fecha_min_str or not fecha_max_str:
            faltantes.append(
                'for_008_emer_fech_aten_min/for_008_emer_fech_aten_max')
        if faltantes:
            return Response(
                {"detail": f"Faltan parámetros requeridos: {', '.join(faltantes)}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2) Validar user_rol y requerir id_eni_user solo si user_rol == 3
        if str(form_008_user_rol) not in ('1', '3'):
            return Response(
                {"detail": "user_rol inválido. Valores permitidos: 1 o 3."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if str(form_008_user_rol) == '3' and not id_eni_user:
            return Response(
                {"detail": "id_eni_user es requerido cuando user_rol = 3."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3) Parsear y validar formato de fechas
        try:
            start_date = datetime.strptime(fecha_min_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(fecha_max_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4) Validaciones de rango
        if start_date > end_date:
            return Response(
                {"detail": "for_008_emer_fech_aten_min no puede ser mayor que for_008_emer_fech_aten_max."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (end_date - start_date).days > 31:
            return Response(
                {"detail": "Solo puede descargar un rango máximo de un mes (31 días)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5) Preparar filtros (Date vs DateTime con zona horaria)
        fecha_field_name = "for_008_emer_fech_aten"
        try:
            field = form_008_emergencia._meta.get_field(fecha_field_name)
            if field.get_internal_type() == "DateTimeField":
                tz = timezone.get_current_timezone()
                start_filter = timezone.make_aware(
                    datetime.combine(start_date, time.min), tz)
                end_filter = timezone.make_aware(
                    datetime.combine(end_date, time.max), tz)
            else:
                start_filter = start_date
                end_filter = end_date
        except Exception:
            start_filter = start_date
            end_filter = end_date

        # 6) Query según user_rol
        base_qs = (
            form_008_emergencia.objects
            .filter(**{f"{fecha_field_name}__range": (start_filter, end_filter)})
        )
        if str(form_008_user_rol) == '3':
            base_qs = base_qs.filter(eniUser=id_eni_user)
        base_qs = base_qs.order_by(fecha_field_name)

        HEADERS = [
            "INSTITUCIÓN DEL SISTEMA", "UNICODIGO", "NOMBRE DEL ESTABLECIMIENTO DE SALUD", "ZONA",
            "PROVINCIA", "CANTON", "DISTRITO", "NIVEL", "FECHA DE ATENCIÓN",
            "TIPO DE DOCUMENTO DE IDENTIFICACIÓN", "NÚMERO DE IDENTIFICACION", "PRIMER APELLIDO",
            "SEGUNDO APELLIDO", "PRIMER NOMBRE", "SEGUNDO NOMBRE", "SEXO", "EDAD", "CONDICIÓN DE LA EDAD",
            "NACIONALIDAD", "ETNIA", "GRUPO PRIORITARIO", "TIPO DE SEGURO",
            "PROVINCIA DE RECIDENCIA", "CANTON DE RECIDENCIA", "PARROQUIA DE RECIDENCIA",
            "ESPECIALIDAD DEL PROFESIONAL", "CIE-10 (PRINCIPAL)", "DIAGNÓSTICO 1 (PRINCIPAL)",
            "CONDICIÓN DEL DIAGNÓSTICO", "CIE-10 (CAUSA EXTERNA)", "DIAGNOSTICO (CAUSA  EXTERNA)",
            "HOSPITALIZACIÓN", "HORA ATENCIÓN", "CONDICIÓN DEL ALTA", "OBSERVACIÓN",
        ]

        FIELDS = [
            "for_008_emer_inst_sist", "for_008_emer_unic", "for_008_emer_unid", "for_008_emer_zona",
            "for_008_emer_prov", "for_008_emer_cant", "for_008_emer_dist", "for_008_emer_nive",
            "for_008_emer_fech_aten", "for_008_emer_tipo_docu_iden", "for_008_emer_nume_iden",
            "for_008_emer_prim_apel", "for_008_emer_segu_apel", "for_008_emer_prim_nomb",
            "for_008_emer_segu_nomb", "for_008_emer_sexo", "for_008_emer_edad", "for_008_emer_cond_edad",
            "for_008_emer_naci", "for_008_emer_etni", "for_008_emer_grup_prio", "for_008_emer_tipo_segu",
            "for_008_emer_prov_resi", "for_008_emer_cant_resi", "for_008_emer_parr_resi",
            "for_008_emer_espe_prof", "for_008_emer_cie_10_prin", "for_008_emer_diag_prin",
            "for_008_emer_cond_diag", "for_008_emer_cie_10_caus_exte", "for_008_emer_diag_caus_exte",
            "for_008_emer_hosp", "for_008_emer_hora_aten", "for_008_emer_cond_alta", "for_008_emer_obse",
        ]

        class Echo:
            def write(self, value):
                return value

        def serialize_value(val):
            if val is None:
                return ""
            if isinstance(val, (datetime, date, time)):
                return val.isoformat()
            return val

        def row_iter():
            writer = csv.writer(Echo())
            # BOM para Excel
            yield "\ufeff"
            # Encabezados
            yield writer.writerow(HEADERS)
            # Filas en streaming
            for row in base_qs.values(*FIELDS).iterator(chunk_size=5000):
                yield writer.writerow([serialize_value(row.get(field)) for field in FIELDS])

        filename = f'form008_emergencia_{start_date.strftime("%Y%m%d")}_{end_date.strftime("%Y%m%d")}.csv'
        response = StreamingHttpResponse(
            row_iter(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'
        response["X-Accel-Buffering"] = "no"
        return response

    @action(detail=False, methods=['get'], url_path='reporte-mensual')
    def reporte_mensual(self, request, *args, **kwargs):
        """
        GET /form008-emergencia/reporte-mensual/?id_eni_user=ID&form_008_year=YYYY&user_rol=ROL
        Agrupa por unidad de salud (for_008_emer_unic, for_008_emer_unid) y retorna por mes:
        - total de registros (todas las filas)
        - total de atenciones únicas (distinct for_008_emer_aten_fina)        
        """
        # id_eni_user = request.query_params.get('id_eni_user')
        id_eni_user = getattr(request.user, 'id', None)
        try:
            form_008_year = int(request.query_params.get(
                'form_008_year', timezone.now().year))
        except (TypeError, ValueError):
            return Response({"detail": "Parámetro 'form_008_year' inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # form_008_user_rol = request.query_params.get('user_rol', None)
        form_008_user_rol = getattr(request.user, 'fun_admi_rol', None)

        faltantes = []
        if not id_eni_user:
            faltantes.append('id_eni_user')
        if form_008_user_rol is None:
            faltantes.append('user_rol')
        if not form_008_year:
            faltantes.append('form_008_year')
        if faltantes:
            return Response(
                {"detail": f"Faltan parámetros requeridos: {', '.join(faltantes)}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            year = int(form_008_year)
            form_008_user_rol = int(form_008_user_rol)
        except (TypeError, ValueError):
            return Response({"detail": "Parámetros 'form_008_year' o 'user_rol' inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        base_qs = self.get_queryset().filter(for_008_emer_fech_aten__year=year)

        # Rol 3: solo sus atenciones; Rol 1: total (sin filtro por eniUser)
        if str(form_008_user_rol) == '3':
            if not id_eni_user:
                return Response(
                    {"detail": "id_eni_user es requerido cuando user_rol = 3."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            base_qs = base_qs.filter(eniUser=id_eni_user)

        qs = (
            base_qs
            .annotate(month=ExtractMonth('for_008_emer_fech_aten'))
            .values('for_008_emer_unic', 'for_008_emer_unid', 'month')
            .annotate(
                total_all=Count('for_008_emer_aten_fina'),
                total_unique=Count('for_008_emer_aten_fina', distinct=True)
            )
            .order_by('for_008_emer_unic', 'month')
        )

        meses_es = [
            "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
            "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
        ]

        # Agrupar por unidad (unic, unid) y armar conteos por mes
        agrupado = {}
        for row in qs:
            unic = row.get('for_008_emer_unic') or ''
            unid = row.get('for_008_emer_unid') or ''
            key = (unic, unid)
            if key not in agrupado:
                agrupado[key] = {
                    "for_008_emer_unic": unic,
                    "for_008_emer_unid": unid,
                    "meses": {m: [0, 0] for m in meses_es}
                }
            num_mes = row.get('month')
            if num_mes and 1 <= num_mes <= 12:
                agrupado[key]["meses"][meses_es[num_mes - 1]] = [
                    row.get('total_all', 0) or 0,
                    row.get('total_unique', 0) or 0
                ]

        # Calcular totales por unidad y preparar salida
        results = []
        for (unic, unid), data_u in sorted(agrupado.items(), key=lambda x: (x[0][0], x[0][1])):
            total_all_anual = sum(v[0] for v in data_u["meses"].values())
            total_unique_anual = sum(v[1] for v in data_u["meses"].values())
            results.append({
                "unidad_salud": f"{unic} {unid}".strip(),
                "meses": data_u["meses"],
                "total": [total_all_anual, total_unique_anual]
            })

        # Si no hay registros y se filtró por una unidad específica, devolver unidad con ceros
        if not results:
            label_unic = ""
            label_unid = ""
            results.append({
                "unidad_salud": f"{label_unic} {label_unid}".strip(),
                "meses": {m: [0, 0] for m in meses_es},
                "total": [0, 0]
            })

        return Response(
            {
                "id_eni_user": str(id_eni_user),
                "year": year,
                "results": results
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='reporte-diagnostico')
    def reporte_diagnostico(self, request, *args, **kwargs):
        """
        GET /form008-emergencia/reporte-diagnostico/?id_eni_user=ID&form_008_year=YYYY&user_rol=ROL
        """

        id_eni_user = request.query_params.get('id_eni_user')
        form_008_year = request.query_params.get(
            'form_008_year', timezone.now().year)
        form_008_user_rol = request.query_params.get('user_rol')

        faltantes = []
        if not id_eni_user:
            faltantes.append('id_eni_user')
        if form_008_user_rol is None:
            faltantes.append('user_rol')
        if not form_008_year:
            faltantes.append('form_008_year')
        if faltantes:
            return Response(
                {"detail": f"Faltan parámetros requeridos: {', '.join(faltantes)}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            year = int(form_008_year)
            form_008_user_rol = int(form_008_user_rol)
        except (TypeError, ValueError):
            return Response({"detail": "Parámetros 'form_008_year' o 'user_rol' inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(for_008_emer_fech_aten__year=year)

        if str(form_008_user_rol) == '3':
            if not id_eni_user:
                return Response(
                    {"detail": "id_eni_user es requerido cuando user_rol = 3."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            qs = qs.filter(eniUser=id_eni_user)
        elif str(form_008_user_rol) not in ('1',):
            return Response(
                {"detail": "user_rol inválido. Valores permitidos: 1 o 3."},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = qs.exclude(for_008_emer_cie_10_prin__isnull=True).exclude(
            for_008_emer_cie_10_prin='')

        agg = (
            qs.values('for_008_emer_cie_10_prin', 'for_008_emer_diag_prin')
            .annotate(
                hombre=Count(
                    'id',
                    filter=(
                        Q(for_008_emer_sexo__iexact='HOMBRE') |
                        Q(for_008_emer_sexo__iexact='H') |
                        Q(for_008_emer_sexo__istartswith='MASC')
                    )
                ),
                mujer=Count(
                    'id',
                    filter=(
                        Q(for_008_emer_sexo__iexact='MUJER') |
                        Q(for_008_emer_sexo__iexact='M') |
                        Q(for_008_emer_sexo__istartswith='FEM')
                    )
                ),
                intersexual=Count(
                    'id',
                    filter=(
                        Q(for_008_emer_sexo__iexact='INTERSEXUAL') |
                        Q(for_008_emer_sexo__iexact='I') |
                        Q(for_008_emer_sexo__istartswith='INTER')
                    )
                ),
                total=Count('id')
            )
            .order_by('-total')
        )

        results = [
            {
                "diagnostico": f"{row['for_008_emer_cie_10_prin']} {row['for_008_emer_diag_prin']}".strip(),
                "hombre": row['hombre'] or 0,
                "intersexual": row['intersexual'] or 0,
                "mujer": row['mujer'] or 0,
                "total": row['total'] or 0,
            }
            for row in agg
        ]

        return Response(
            {
                "id_eni_user": str(id_eni_user) if id_eni_user is not None else None,
                "year": year,
                "results": results
            },
            status=status.HTTP_200_OK
        )

    def get_eni_user(self, eni_user_id):
        try:
            return eniUser.objects.get(id=eni_user_id)
        except eniUser.DoesNotExist:
            return None

    def get_unidad_salud(self, eni_user):
        try:
            return unidad_salud.objects.get(eniUser=eni_user, uni_unid_prin=1)
        except unidad_salud.DoesNotExist:
            return None

    def get_next_codigo_atencion(self):
        max_valor = form_008_emergencia.objects.aggregate(Max('for_008_emer_aten_fina'))[
            'for_008_emer_aten_fina__max'] or 1
        return max_valor + 1

    def split_nombre_apellido(self, nombre_completo):
        partes = nombre_completo.strip().split(' ', 1)
        return partes[0], partes[1] if len(partes) > 1 else ''

    def procesar_diagnosticos(self, cie10_list):
        cie10 = []
        diag = []
        for code in cie10_list:
            cie10.append(code[:4])
            diag.append(code[4:])
        return cie10, diag

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        eni_user_id = data.get('id_eniUser', '')
        medic_apoll_id = data.get('for_008_emer_apoy_aten_medi', '')
        eni_user = self.get_eni_user(eni_user_id)

        medic_apoll = None
        if medic_apoll_id:
            medic_apoll = self.get_eni_user(medic_apoll_id)

        if not eni_user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        unidad_salud_data = self.get_unidad_salud(eni_user)
        if not unidad_salud_data:
            return Response({'error': 'Unidad de salud no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        nuevo_codigo_atencion = self.get_next_codigo_atencion()

        # Datos de unidad de salud
        # Asignar campos de unidad_salud a los campos correspondientes en data
        data['for_008_emer_inst_sist'] = getattr(
            unidad_salud_data, 'uni_inst_sist')
        for field in ['uni_unic', 'uni_unid', 'uni_zona', 'uni_prov', 'uni_cant', 'uni_dist', 'uni_nive']:
            data[f'for_008_emer_{field.split("_")[1]}'] = getattr(
                unidad_salud_data, field)

        tipo_docu_iden = data.get('for_008_busc_pers_tipo_iden', '')
        nume_iden = data.get('for_008_busc_pers_nume_iden', '')
        data['for_008_emer_tipo_docu_iden'] = tipo_docu_iden
        data['for_008_emer_nume_iden'] = nume_iden

        # Edad y condición
        edad_cond_str = data.get('for_008_emer_edad_cond', '').strip()
        parts = edad_cond_str.split(' ')
        data['for_008_emer_edad'] = parts[0] if parts and parts[0] else ''
        data['for_008_emer_cond_edad'] = parts[1] if len(parts) > 1 else ''

        # Nombres y apellidos
        apellidos = self.split_nombre_apellido(
            data.get('for_008_emer_apel_comp', ''))
        nombres = self.split_nombre_apellido(
            data.get('for_008_emer_nomb_comp', ''))
        data['for_008_emer_prim_apel'], data['for_008_emer_segu_apel'] = apellidos
        data['for_008_emer_prim_nomb'], data['for_008_emer_segu_nomb'] = nombres

        # Diagnósticos
        cie10_prin_diag = data.get('for_008_emer_cie_10_prin_diag', [])
        cond_diag = data.get('for_008_emer_cond_diag', [])
        cie10_secu_diag = data.get('for_008_emer_cie_10_caus_exte_diag', [])

        if not (len(cie10_prin_diag) == len(cond_diag) == len(cie10_secu_diag)):
            return Response(
                {"detail": "Los arrays de diagnósticos deben tener la misma longitud."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cie10_prin, diag_prin = self.procesar_diagnosticos(cie10_prin_diag)
        cie10_caus_exte, diag_caus_exte = self.procesar_diagnosticos(
            cie10_secu_diag)

        data['for_008_emer_resp_aten_medi'] = f"{eni_user.username or ''} {eni_user.last_name or ''} {eni_user.first_name or ''}".strip(
        )
        if medic_apoll:
            data['for_008_emer_apoy_aten_medi'] = f"{medic_apoll.username or ''} {medic_apoll.last_name or ''} {medic_apoll.first_name or ''}".strip(
            )
        else:
            data['for_008_emer_apoy_aten_medi'] = ''

        data['eniUser'] = eni_user_id
        data['admision_datos'] = data.get('id_admision_datos', '')

        created_objects = []
        errors = []

        for i in range(len(cie10_prin_diag)):
            data_item = data.copy()
            data_item.update({
                'for_008_emer_cie_10_prin_diag': cie10_prin_diag[i],
                'for_008_emer_cond_diag': cond_diag[i],
                'for_008_emer_cie_10_caus_exte_diag': cie10_secu_diag[i],
                'for_008_emer_cie_10_prin': cie10_prin[i],
                'for_008_emer_diag_prin': diag_prin[i],
                'for_008_emer_cie_10_caus_exte': cie10_caus_exte[i],
                'for_008_emer_diag_caus_exte': diag_caus_exte[i],
                'for_008_emer_aten_fina': nuevo_codigo_atencion,
            })
            serializer = self.get_serializer(data=data_item)
            if serializer.is_valid():
                self.perform_create(serializer)
                created_objects.append(serializer.data)
            else:
                errors.append(serializer.errors)

        if errors:
            return Response({"message": "Error al crear la atencion del formulario 008-EMERGENCIA", "error": errors}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Se creo la atencion del formulario 008-EMERGENCIA del usuario exitosamente!", "data": created_objects}, status=status.HTTP_201_CREATED)


class RegistroVacunadoRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = RegistroVacunadoRegistrationSerializer
    queryset = registro_vacunado.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                vac_reg_ano_mes_dia_apli__year=year, vac_reg_ano_mes_dia_apli__month=month)

        return queryset.order_by('vac_reg_ano_mes_dia_apli')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Guardar en desperdicio
        registro_data = serializer.validated_data
        des_fech = registro_data['vac_reg_ano_mes_dia_apli']
        eni_user_id = registro_data['eniUser'].id

        # Verificar si la fecha es el último día del mes
        ultimo_dia_mes = (des_fech.replace(
            day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Crear o actualizar registro de desperdicio solo si la fecha no es duplicada o es el último día del mes
        if des_fech == ultimo_dia_mes or not desperdicio.objects.filter(des_fech=des_fech, des_tota=False).exists():
            desperdicio_obj, created = desperdicio.objects.get_or_create(
                des_fech=des_fech,
                des_tota=False,
                defaults={'des_vacmod_dosapli': 1, 'eniUser_id': eni_user_id}
            )
            if not created:
                desperdicio_obj.des_vacmod_dosapli = F(
                    'des_vacmod_dosapli') + 1
                desperdicio_obj.eniUser_id = eni_user_id
                desperdicio_obj.save()
        else:
            # Manejar el caso donde la fecha no es el último día del mes y ya existe un registro
            desperdicio_obj = desperdicio.objects.filter(
                des_fech=des_fech, des_tota=False).first()
            desperdicio_obj.des_vacmod_dosapli = F('des_vacmod_dosapli') + 1
            desperdicio_obj.eniUser_id = eni_user_id
            desperdicio_obj.save()

        # Crear variables de control
        des_fech_inicio = des_fech.replace(day=1)
        des_fech_fin = (des_fech.replace(day=1) +
                        timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Obtener el total de des_vacmod_dosapli excluyendo las filas donde des_tota es True
        total_vacmod_dosapli = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(des_fech_inicio, des_fech_fin)
        ).aggregate(total_des_vacmod_dosapli=Sum('des_vacmod_dosapli'))['total_des_vacmod_dosapli'] or 0

        # Crear o actualizar registro de desperdicio total
        desperdicio_total, created = desperdicio.objects.get_or_create(
            des_fech=des_fech_fin,
            des_tota=True,
            defaults={
                'des_vacmod_dosapli': total_vacmod_dosapli, 'eniUser_id': eni_user_id}
        )
        if not created:
            desperdicio_total.des_vacmod_dosapli = total_vacmod_dosapli
            desperdicio_total.save(update_fields=['des_vacmod_dosapli'])

        headers = self.get_success_headers(serializer.data)
        return Response({"message": Dato_Create_Correcto, "data": serializer.data}, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], url_path='descargar-csv')
    def get_descargar_csv(self, request, *args, **kwargs):
        # Obtener las fechas de inicio y fin de los parámetros de la solicitud
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        eniuser_id = request.query_params.get('eniUser_id')

        if not fecha_inicio or not fecha_fin:
            return Response({"error": "Los parámetros 'fecha_inicio' y 'fecha_fin' son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
        except ValueError:
            return Response({"error": "Formato de fecha inválido. Use 'YYYY-MM-DD'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Crear la respuesta HTTP con el tipo de contenido CSV
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="registro_vacunado.csv"'

            writer = csv.writer(response)

            # Escribir los encabezados del CSV
            writer.writerow([
                'Año aplicacion', 'Mes aplicacion', 'Día aplicacion', 'Punto vacunacion', 'Unicódigo establecimiento', 'Nombre establecimiento de salud', 'Zona', 'Distrito',
                'Provincia', 'Canton', 'Apellidos', 'Nombres', 'Tipo identificación', 'Número de identificación', 'Sexo', 'Año nacimiento',
                'Mes nacimiento', 'Dia nacimiento', 'Nacionalidad', 'Etnia', 'Nacionalidad étnica', 'Pueblo', 'Residencia provincia', 'Residencia cantón',
                'Residencia parroquia', 'Tel. de contacto', 'Correo electronico', 'Grupo de riesgo', 'Fase vacuna', 'Estado vacunación', 'Tipo esquema', 'Vacuna',
                'Lote vacuna', 'Dosis aplicada', 'Paciente agendado', 'Nombre vacunador', 'Identificación vacunador', 'Nombre del profesional que registra', 'Recibió dosis previa exterior', 'Nombre dosis exterior ',
                'Fecha anio dosis exterior', 'Fecha mes dosis exterior', 'Fecha dia dosis exterior', 'Pais dosis exterior', 'Lote dosis exterior',
            ])

            # Obtener los registros de registroVacunado dentro del rango de fechas
            registros = registro_vacunado.objects.filter(
                vac_reg_ano_mes_dia_apli__range=(fecha_inicio, fecha_fin), eniUser_id=eniuser_id)

            # Escribir los datos de cada registro en el CSV
            for registro in registros:
                ano_aplicacion = registro.vac_reg_ano_mes_dia_apli.year
                mes_aplicacion = registro.vac_reg_ano_mes_dia_apli.month
                dia_aplicacion = registro.vac_reg_ano_mes_dia_apli.day

                ano_nacimiento = registro.vac_reg_ano_mes_dia_naci.year
                mes_nacimiento = registro.vac_reg_ano_mes_dia_naci.month
                dia_nacimiento = registro.vac_reg_ano_mes_dia_naci.day

                fecha_anio_dosis_exterior = registro.vac_reg_fech_anio_mes_dia_dosi_exte.year
                fecha_mes_dosis_exterior = registro.vac_reg_fech_anio_mes_dia_dosi_exte.month
                fecha_dia_dosis_exterior = registro.vac_reg_fech_anio_mes_dia_dosi_exte.day

                writer.writerow([
                    ano_aplicacion, mes_aplicacion, dia_aplicacion, registro.vac_reg_punt_vacu, registro.vac_reg_unic_esta, registro.vac_reg_nomb_esta_salu,
                    registro.vac_reg_zona, registro.vac_reg_dist, registro.vac_reg_prov, registro.vac_reg_cant,
                    registro.vac_reg_apel, registro.vac_reg_nomb, registro.vac_reg_tipo_iden, registro.vac_reg_nume_iden,
                    registro.vac_reg_sexo, ano_nacimiento, mes_nacimiento, dia_nacimiento, registro.vac_reg_naci, registro.vac_reg_etni,
                    registro.vac_reg_naci_etni, registro.vac_reg_pueb, registro.vac_reg_resi_prov, registro.vac_reg_resi_cant,
                    registro.vac_reg_resi_parr, registro.vac_reg_teld_cont, registro.vac_reg_corr_elec, registro.vac_reg_grup_ries,
                    registro.vac_reg_fase_vacu, registro.vac_reg_esta_vacu, registro.vac_reg_tipo_esqu, registro.vac_reg_vacu,
                    registro.vac_reg_lote_vacu, registro.vac_reg_dosi_apli, registro.vac_reg_paci_agen, registro.vac_reg_nomb_vacu,
                    registro.vac_reg_iden_vacu, registro.vac_reg_nomb_prof_regi, registro.vac_reg_reci_dosi_prev_exte, registro.vac_reg_nomb_dosi_exte,
                    fecha_anio_dosis_exterior, fecha_mes_dosis_exterior, fecha_dia_dosis_exterior, registro.vac_reg_pais_dosi_exte, registro.vac_reg_lote_dosi_exte
                ])
            response['message'] = "Descarga de archivo iniciado!"
            return response
        except Exception as e:
            return Response({"error": "Se produjo un error al procesar la solicitud: {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)
