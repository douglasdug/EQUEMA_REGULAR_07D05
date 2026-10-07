from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, JSONParser
from .models import eniUser, unidad_salud, admision_datos, form_008_emergencia, admin_agenda_turnos
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, EniUserRegistrationSerializer, UnidadSaludRegistrationSerializer, AdmisionDatosRegistrationSerializer, Form008EmergenciaRegistrationSerializer, AdminAgendaTurnosRegistrationSerializer
from django.db.models import F, Sum, Count, Max, Q, Count
from django.db.models.functions import ExtractMonth
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator, PasswordResetTokenGenerator
from django.urls import reverse
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.core.cache import cache
from django.core.mail import send_mail, EmailMultiAlternatives
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import render
from datetime import datetime, timedelta, time, date
from dateutil.relativedelta import relativedelta
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import csv
import unicodedata
import re
import os
import io
import json
from io import BytesIO
import logging
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, PdfSigner
from pyhanko.pdf_utils.font import opentype
from pyhanko_certvalidator.registry import SimpleCertificateStore
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.sign.timestamps import HTTPTimeStamper
from pyhanko.sign.validation import RevocationInfoValidationType
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.pdf_utils.text import TextBoxStyle
from pyhanko.stamp import QRStampStyle
from pyhanko.keys import load_certs_from_pemder
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, A6
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
from twilio.rest import Client
import pandas as pd

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
        username = request.data.get('username', '').strip()
        cache_key = f"login_attempts_{username}"
        attempts = cache.get(cache_key, 0)

        # Si supera el límite, bloquea el login
        if attempts >= 5:
            return Response(
                {"error": "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            # Si el login es exitoso, resetea el contador
            cache.delete(cache_key)
            serializer = CustomUserSerializer(user)
            token = RefreshToken.for_user(user)
            data = serializer.data
            data["tokens"] = {"refresh": str(
                token), "access": str(token.access_token)}
            return Response(data, status=status.HTTP_200_OK)
        except Exception:
            # Si falla, incrementa el contador y bloquea por 15 minutos
            cache.set(cache_key, attempts + 1, timeout=900)  # 900s = 15min
            return Response(
                {
                    "error": "Usuario o contraseña incorrectos.",
                    "attempts": attempts + 1,
                    "max_attempts": 5
                },
                status=status.HTTP_401_UNAUTHORIZED
            )


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
    frontend_url = settings.FRONTEND_URL

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
            # Validar si el usuario ya solicitó un cambio en los últimos 60 minutos
            cache_key = f"password_reset_{user.pk}"
            if cache.get(cache_key):
                return Response({'error': 'Ya solicitaste un cambio de contraseña recientemente. Por favor, espera 60 minutos antes de volver a intentarlo.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            email = user.email or ''
            if not email:
                return Response({'error': 'No existe un correo registrado con el Usuario. Por favor, comuníquese con el Administrador.'}, status=status.HTTP_404_NOT_FOUND)

            censored_email = self.censurar_email(email)

            # Generar token con tiempo de expiración
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Construir URL del frontend
            reset_url = f"{self.frontend_url}/{uid}/{token}"

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
            except Exception:
                return Response({'error': 'No se pudo enviar el correo. Intente más tarde.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Guardar en caché la solicitud por 60 minutos (3600 segundos)
            cache.set(cache_key, True, timeout=3600)

            return Response({'email': censored_email}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            return Response({'error': 'El usuario ingresado no existe en la base de datos.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, token=None):
        """Verificar token y permitir cambio de contraseña"""
        _ = getattr(request, "method",
                    None)  # Referencia para evitar advertencia de argumento no usado
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


logger = logging.getLogger(__name__)


class FirmarPDFAPIView(APIView):
    """
    API para firmar electrónicamente un PDF usando un certificado P12.
    """
    parser_classes = [JSONParser]

    def _create_text_pdf(self, text):
        buffer = io.BytesIO()
        # Reemplazar los saltos de línea por etiquetas HTML <br/>
        processed_text = text.replace('\n', '<br/>')
        # Crear un documento simple con márgenes en mm
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=8.5 * mm,
            rightMargin=8.5 * mm,
            topMargin=36 * mm,
            bottomMargin=36 * mm
        )
        styles = getSampleStyleSheet()
        style = ParagraphStyle(
            name='Helvetica',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=14
        )
        # Crear un flowable (párrafo) con el texto procesado
        flowables = [Paragraph(processed_text, style)]

        doc.build(flowables)
        buffer.seek(0)
        return buffer

    def _merge_pdfs(self, text_pdf_buffer, template_path):
        """Combina el PDF de texto con el PDF de la plantilla."""
        if not os.path.exists(template_path):
            raise FileNotFoundError(
                f"Plantilla no encontrada: {template_path}")

        template_reader = PdfReader(template_path)
        text_reader = PdfReader(text_pdf_buffer)

        writer = PdfWriter()

        for i in range(len(template_reader.pages)):
            page_template = template_reader.pages[i]
            if i < len(text_reader.pages):
                page_text = text_reader.pages[i]
                page_template.merge_page(page_text)
            writer.add_page(page_template)

        merged_buffer = io.BytesIO()
        writer.write(merged_buffer)
        merged_buffer.seek(0)
        return merged_buffer

    def post(self, request, *args, **kwargs):
        certificado_texto = request.data.get('certificado_texto')
        clave_p12 = request.data.get('clave_p12')

        # Validación de entrada
        if not certificado_texto or not clave_p12:
            return Response({'error': 'Faltan certificado_texto o clave_p12'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(clave_p12, str):
            return Response({'error': 'La clave_p12 debe ser un string.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Crear el PDF a partir del texto
        try:
            # Obtener la ruta de la plantilla desde el mismo directorio que views.py
            template_path = os.path.join(os.path.dirname(
                __file__), 'static', 'Plantilla_MSP.pdf')
            pdf_texto_buffer = self._create_text_pdf(certificado_texto)
            pdf_merged_buffer = self._merge_pdfs(
                pdf_texto_buffer, template_path)
        except Exception as e:
            logger.exception("Error al crear el PDF a partir del texto.")
            return Response({'error': f'Error al generar el PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Obtener ruta del certificado P12
        p12_path = getattr(settings, 'SIGN_P12_PATH', None)
        if not p12_path:
            logger.error("SIGN_P12_PATH no está configurado en settings.")
            return Response({'error': 'No está configurada SIGN_P12_PATH en settings'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if not os.path.exists(p12_path):
            logger.error(f"No se encontró el archivo P12 en: {p12_path}")
            return Response({'error': f'No se encontró el archivo P12 en: {p12_path}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        signer_data = None
        # Aislamiento de la carga del P12 para capturar errores de contraseña
        try:
            passphrase_bytes = clave_p12.encode('utf-8')
            signer_data = self._load_signer(p12_path, passphrase_bytes)
        except ValueError:
            logger.error("Error al cargar certificado: clave P12 incorrecta.")
            return Response({'error': 'Error al cargar certificado: clave incorrecta o archivo corrupto.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Error inesperado al cargar P12")
            return Response({'error': f'Error inesperado al cargar P12: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        if signer_data is None:
            logger.error(
                "El objeto signer_data es None. Posible error de carga del P12.")
            return Response({'error': 'No se pudo cargar el certificado P12. Verifique la clave y el archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Firmar el PDF generado
        try:
            pdf_out_bytes_io = self._sign_pdf_with_hanko(
                pdf_merged_buffer, signer_data)
            return HttpResponse(pdf_out_bytes_io, content_type='application/pdf')
        except Exception as e:
            logger.exception("Error al firmar el PDF")
            return Response({'error': f'Error al firmar el PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _sign_pdf_with_hanko(self, pdf_buffer, signer_data):
        original_pdf_bytes = pdf_buffer.read()
        nombre_firmante = signer_data.signing_cert.subject.human_friendly
        datos_firmante = self._extraer_datos_firmante(nombre_firmante)
        fecha_firma = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        texto_estampa = (
            f'Firmado electrónicamente por:\n{datos_firmante["nombres"]}\n{datos_firmante["apellidos"]}\n'
            f'Validado por:\n{datos_firmante["organization"]}'
        )

        qr_contenido = (
            f'FIRMADO POR: {datos_firmante["common_name"]}\n'
            f'RAZON:\nLOCALIZACION:\nFECHA: {fecha_firma}\n'
            f'UNIDAD ORGANIZATIVA: {datos_firmante["organizational_unit"]}\n'
            f'ORGANIZACIÓN: {datos_firmante["organization"]}\n'
            f'PAIS: {datos_firmante["country"]}'
        )

        # Crear apariencia de la firma
        stamp_style_qr = QRStampStyle(
            stamp_text=texto_estampa,
            text_box_style=TextBoxStyle(font_size=8)
        )

        # --- NUEVO: obtener el número de páginas ---
        pdf_reader = PdfReader(BytesIO(original_pdf_bytes))
        num_pages = len(pdf_reader.pages)
        last_page_index = num_pages - 1  # Índice de la última página

        sig_field_spec = SigFieldSpec(
            'Firma1',
            box=(250, 50, 400, 90),
            on_page=last_page_index,  # <-- AQUÍ VA LA FIRMA EN LA ÚLTIMA PÁGINA
        )

        signature_meta_data = signers.PdfSignatureMetadata(
            field_name='Firma1',
            reason='Firma digital',
            location='Ecuador',
        )

        pdf_signer = signers.PdfSigner(
            signature_meta=signature_meta_data,
            signer=signer_data,
            stamp_style=stamp_style_qr,
            new_field_spec=sig_field_spec,
        )

        pdf_writer = IncrementalPdfFileWriter(BytesIO(original_pdf_bytes))
        pdf_out_bytes_io = pdf_signer.sign_pdf(
            pdf_writer,
            appearance_text_params={'url': qr_contenido}
        )
        pdf_out_bytes_io.seek(0)
        return pdf_out_bytes_io

    def _load_signer(self, p12_path, passphrase_bytes):
        signer = signers.SimpleSigner.load_pkcs12(
            p12_path,
            passphrase=passphrase_bytes
        )
        if signer is None:
            raise ValueError(
                "No se pudo cargar el certificado P12. Retornó None.")
        return signer

    def _extraer_datos_firmante(self, nombre_firmante):
        match_cn = re.search(r'Common Name:\s*([^,]+)', nombre_firmante)
        common_name = match_cn.group(1).strip() if match_cn else ''
        parts = common_name.split()
        nombres = " ".join(parts[:2])
        apellidos = " ".join(parts[2:])

        match_ou = re.search(
            r'Organizational Unit:\s*([^,]+)', nombre_firmante)
        organizational_unit = match_ou.group(1).strip() if match_ou else ''
        match_org = re.search(r'Organization:\s*([^,]+)', nombre_firmante)
        organization = match_org.group(1).strip() if match_org else ''
        match_c = re.search(r'Country:\s*([^,]+)', nombre_firmante)
        country = match_c.group(1).strip() if match_c else ''

        return {
            'common_name': common_name,
            'nombres': nombres,
            'apellidos': apellidos,
            'organizational_unit': organizational_unit,
            'organization': organization,
            'country': country,
        }


class EniUserRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = EniUserRegistrationSerializer
    queryset = eniUser.objects.all()
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [1, 2, 3, 4, 5, 6]

    def get_permissions(self):
        # Público para registro (create) y búsqueda
        if getattr(self, 'action', None) in ('buscar_usuario', 'create'):
            return [AllowAny()]
        # Para el resto, usa los permisos definidos en la vista (IsAuthenticated + HasRole)
        return [perm() for perm in self.permission_classes]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().order_by('last_name')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='buscar-usuario')
    def buscar_usuario(self, request):
        """
        GET /eni-user/buscar-usuario/?tipo=<tipo>&identificacion=<identificacion>
        """
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
        """
        GET /eni-user/buscar-usuario-id-unidad-salud/
        """
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2  # Solo para pruebas, luego se cambia por el id del usuario autenticado
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

    @action(detail=False, methods=['get'], url_path='listar-filtrado')
    def listar_filtrado(self, request):
        """
        GET /eni-user/listar-filtrado/
        """
        try:
            exclude_id = getattr(request.user, 'id', None)
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
        fun_esta = data.get('fun_esta')

        try:
            with transaction.atomic():
                # Guardar SIEMPRE en eniUser
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                user = serializer.save()

                if str(fun_esta) == "1" and email:
                    send_mail(
                        subject='¡Tu usuario ha sido validado!',
                        message=(
                            f'Estimado {last_name} {first_name} con el usuario {identificacion},\n\n'
                            'Te informamos que tu usuario ha sido validado por el administrador. '
                            'Ahora puedes ingresar al sistema "SIRA-07D05" con tu usuario y clave registrados.\n\n'
                            'Saludos cordiales,\nEl equipo de soporte.\n'
                            'Nota: Este correo es informativo, favor no responder a esta direccion de correo.'
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )

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

    from eni.data.unidades_salud_data import MATRIZ_UNIDADES_SALUD

    def get_unidad_salud_data(self, uni_unic):
        for unidad in self.MATRIZ_UNIDADES_SALUD:
            if unidad['uni_unic'] == uni_unic:
                return unidad
        return None

    def update(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        eni_user_id = pk
        # eni_user_id = 2  # Solo para pruebas, luego se cambia por el id del usuario autenticado
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

        username = data.get('username')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        fun_esta = data.get('fun_esta')
        email = data.get('email')
        if str(fun_esta) == "1" and email:
            send_mail(
                subject='¡Tu usuario ha sido validado!',
                message=(
                    f'Estimado {last_name} {first_name} con el usuario {username},\n\n'
                    'Te informamos que tu usuario ha sido validado por el administrador. '
                    'Ahora puedes ingresar al sistema "SIRA-07D05" con tu usuario y clave registrados.\n\n'
                    'Saludos cordiales,\nEl equipo de soporte.\n'
                    'Nota: Este correo es informativo, favor no responder a esta direccion de correo.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

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
        """
        DELETE /eni-user/eliminar-usuario/
        """
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
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [1, 2, 3, 4, 5, 6]

    def get_permissions(self):
        # Para el resto, usa los permisos definidos en la vista (IsAuthenticated + HasRole)
        return [perm() for perm in self.permission_classes]

    @action(detail=False, methods=['patch'], url_path='unidad-salud-principal')
    def update_unidad_salud_principal(self, request):
        # 1. Obtener el id de la unidad a actualizar desde el frontend
        # O request.data['id'] si es obligatorio
        unidad_id = request.data.get('id_unid_salu')

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


class AdmisionDatosRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = AdmisionDatosRegistrationSerializer
    queryset = admision_datos.objects.all()
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [1, 2, 3, 4, 5, 6]

    def get_permissions(self):
        # Público para registro (create) y búsqueda
        if getattr(self, 'action', None) in ('buscar_admision', 'buscar_admisionados', 'create'):
            return [AllowAny()]
        # Para el resto, usa los permisos definidos en la vista (IsAuthenticated + HasRole)
        return [perm() for perm in self.permission_classes]

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

    @action(detail=False, methods=['get'], url_path='buscar-admision')
    def buscar_admision(self, request):
        """
        GET /admision-datos/buscar-admision/?tipo=<tipo>&identificacion=<identificacion>
        """
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

    @action(detail=False, methods=['get', 'post'], url_path='buscar-admisionados')
    def buscar_admisionados(self, request):
        """
        GET /admision-datos/buscar-admisionados/?apellidos=<apellidos>&nombres=<nombres>
        """
        # Puedes cambiar a request.data si lo llamas vía POST
        apellidos = (request.query_params.get('apellidos') or '').strip()
        nombres = (request.query_params.get('nombres') or '').strip()

        def normalizar(texto):
            texto = unicodedata.normalize('NFKD', texto)
            texto = ''.join(c for c in texto if not unicodedata.combining(c))
            texto = re.sub(r'\s+', ' ', texto)
            return texto.upper().strip()

        apellidos = normalizar(apellidos)
        nombres = normalizar(nombres)

        # Separar en partes
        ape_parts = apellidos.split(' ') if apellidos else []
        nom_parts = nombres.split(' ') if nombres else []

        # Inicializar variables (None si no están)
        ape1 = ape_parts[0] if len(ape_parts) >= 1 else ''
        ape2 = ape_parts[1] if len(ape_parts) >= 2 else ''
        nom1 = nom_parts[0] if len(nom_parts) >= 1 else ''
        nom2 = nom_parts[1] if len(nom_parts) >= 2 else ''

        # Construir Q dinámicamente solo con partes válidas (>3 chars)
        q = Q()
        filtros_usados = 0

        if len(ape1) >= 3:
            q &= Q(adm_dato_pers_apel_prim__istartswith=ape1)
            filtros_usados += 1
        if len(ape2) >= 1:
            q &= Q(adm_dato_pers_apel_segu__istartswith=ape2)
            filtros_usados += 1
        if len(nom1) >= 3:
            q &= Q(adm_dato_pers_nomb_prim__istartswith=nom1)
            filtros_usados += 1
        if len(nom2) >= 1:
            q &= Q(adm_dato_pers_nomb_segu__istartswith=nom2)
            filtros_usados += 1

        if filtros_usados == 0:
            return Response(
                {
                    "message": "Ingrese al menos un APELLIDO o NOMBRE con más de 3 caracteres.",
                    "cantidad": 0,
                    "resultados": []
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ejecutar la consulta
        qs = (
            admision_datos.objects
            .filter(q)
            .order_by(
                "adm_dato_pers_apel_prim",
                "adm_dato_pers_apel_segu",
                "adm_dato_pers_nomb_prim",
                "adm_dato_pers_nomb_segu"
            ).values(
                'id',
                'adm_dato_pers_tipo_iden',
                'adm_dato_pers_nume_iden',
                'adm_dato_pers_apel_prim',
                'adm_dato_pers_apel_segu',
                'adm_dato_pers_nomb_prim',
                'adm_dato_pers_nomb_segu',
            )
        )

        # Limitar a 50
        limite = 50
        resultados = list(qs[:limite])
        total = len(list(qs))
        cantidad = len(resultados)

        if cantidad == 0:
            return Response(
                {
                    "message": "Los APELLIDOS o NOMBRES ingresados no tienen resultado.",
                    "cantidad": 0,
                    "resultados": []
                },
                status=status.HTTP_200_OK
            )

        if cantidad == limite:
            mensaje = f"La búsqueda produjo {total} registros. Por favor detalle más los APELLIDOS y NOMBRES para refinar el resultado."
        else:
            mensaje = f"Se encontraron {cantidad} registro(s)."

        # serializer = self.get_serializer(resultados, many=True)
        return Response(
            {
                "message": mensaje,
                "cantidad": len(resultados),
                "resultados": resultados
            },
            status=status.HTTP_200_OK
        )

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
        pais_residencia = data.get('adm_dato_resi_pais_resi', '').strip()
        if pais_residencia != 'ECUADOR':
            data['adm_dato_resi_prov'] = pais_residencia
            data['adm_dato_resi_cant'] = pais_residencia
            data['adm_dato_resi_parr'] = pais_residencia
        data['adm_dato_paci_falt_dato'] = 1

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Se creo la admision del usuario exitosamente!", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response({"message": "Error al crear la admision", "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

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
        pais_residencia = data.get('adm_dato_resi_pais_resi', '').strip()
        if pais_residencia != 'ECUADOR':
            data['adm_dato_resi_prov'] = pais_residencia
            data['adm_dato_resi_cant'] = pais_residencia
            data['adm_dato_resi_parr'] = pais_residencia
        data['adm_dato_paci_falt_dato'] = 1

        serializer = self.get_serializer(admision, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({"message": "La admisión se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)


class Form008EmergenciaRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = Form008EmergenciaRegistrationSerializer
    queryset = form_008_emergencia.objects.all()
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [1, 2, 3, 4]  # p.ej. 1=ADMINISTRADOR, 3=MEDICO

    def get_permissions(self):
        # Para el resto, usa los permisos definidos en la vista (IsAuthenticated + HasRole)
        return [perm() for perm in self.permission_classes]

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

    @action(detail=False, methods=['get'], url_path='listar-atenciones-form-008')
    def listar_atenciones_form_008(self, request):
        """
        GET /form-008-emergencia/listar-atenciones-form-008/
        """
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2  # SOLO PARA PRUEBAS, QUITAR ESTA LÍNEA EN PRODUCCIÓN
        try:
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

    @action(detail=False, methods=['get'], url_path='listar-atenciones-paciente')
    def listar_atenciones_paciente(self, request):
        """
        GET /form-008-emergencia/listar-atenciones-paciente/?admision_datos=<id_admision_datos>&month=<month>&year=<year>
        """
        mes_form_008 = request.query_params.get("month")
        year_form_008 = request.query_params.get("year")

        try:
            id_admision_datos = request.query_params.get(
                'admision_datos')
            if not id_admision_datos:
                return Response(
                    {"detail": "El parámetro id_admision_datos es requerido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Si se proporcionan month y year, filtrar por fecha de atención
            if mes_form_008 and year_form_008:
                qs = (
                    self.get_queryset()
                    .filter(admision_datos=id_admision_datos,
                            for_008_emer_fech_aten__year=year_form_008,
                            for_008_emer_fech_aten__month=mes_form_008
                            ))
                if not qs.exists():
                    return Response({"message": f"El paciente no registra atenciones en el mes {mes_form_008} y año {year_form_008} seleccionados de Form-008 Emergencia en el sistema!"}, status=status.HTTP_200_OK)
            else:
                qs = (
                    self.get_queryset()
                    .filter(admision_datos=id_admision_datos)
                    .order_by(
                        '-for_008_emer_fech_aten',
                        '-for_008_emer_hora_aten',
                    )[:12]
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

    @action(detail=False, methods=['get'], url_path='reporte-atenciones-csv')
    def reporte_atenciones_csv(self, request):
        """
        GET /form-008-emergencia/reporte-atenciones-csv/?for_008_emer_fech_aten_min=YYYY-MM-DD&for_008_emer_fech_aten_max=YYYY-MM-DD
        """
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2  # SOLO PARA PRUEBAS, QUITAR ESTA LÍNEA EN PRODUCCIÓN
        fecha_min_str = request.query_params.get("for_008_emer_fech_aten_min")
        fecha_max_str = request.query_params.get("for_008_emer_fech_aten_max")
        form_008_user_rol = getattr(request.user, 'fun_admi_rol', None)

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

        if str(form_008_user_rol) not in ('1', '2', '4'):
            return Response(
                {"detail": "user_rol inválido. Valores permitidos: 1 o 2."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if str(form_008_user_rol) == '3' and not id_eni_user:
            return Response(
                {"detail": "id_eni_user es requerido cuando user_rol = 3."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(fecha_min_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(fecha_max_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if start_date > end_date:
            return Response(
                {"detail": "Fecha de inicio no puede ser mayor que fecha de fin."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (end_date - start_date).days > 31:
            return Response(
                {"detail": "Solo puede descargar un rango máximo de un mes (31 días)."},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        base_qs = (
            form_008_emergencia.objects
            .filter(**{f"{fecha_field_name}__range": (start_filter, end_filter)})
        )
        if str(form_008_user_rol) == '3':
            base_qs = base_qs.filter(eniUser=id_eni_user)
        elif str(form_008_user_rol) == '2' or str(form_008_user_rol) == '4':
            # Obtener los uni_unic asociados al usuario
            unidades = unidad_salud.objects.filter(
                eniUser=id_eni_user).values_list('uni_unic', flat=True)
            base_qs = base_qs.filter(for_008_emer_unic__in=list(unidades))

        base_qs = base_qs.order_by(fecha_field_name)

        HEADERS = [
            "INSTITUCIÓN DEL SISTEMA", "UNICODIGO", "NOMBRE DEL ESTABLECIMIENTO DE SALUD", "ZONA",
            "PROVINCIA", "CANTON", "DISTRITO", "NIVEL", "FECHA DE ATENCIÓN (DD/MM/AAAA)", "HORA ATENCION (HH:MM)", "FECHA DE NACIMIENTO DEL PACIENTE (DD-MM-AAA)",
            "TIPO DE DOCUMENTO DE IDENTIFICACIÓN", "NÚMERO DE IDENTIFICACION", "PRIMER APELLIDO", "SEGUNDO APELLIDO", "PRIMER NOMBRE",
            "SEGUNDO NOMBRE", "SEXO", "EDAD", "CONDICIÓN DE LA EDAD", "NACIONALIDAD", "ETNIA", "GRUPO PRIORITARIO", "TIPO DE SEGURO",
            "PROVINCIA DE RECIDENCIA", "CANTON DE RECIDENCIA", "PARROQUIA DE RECIDENCIA", "ESPECIALIDAD DEL PROFESIONAL", "CIE-10 (PRINCIPAL)", "DIAGNÓSTICO 1 (PRINCIPAL)",
            "CONDICIÓN DEL DIAGNÓSTICO", "CIE-10 (CAUSA EXTERNA)", "DIAGNOSTICO (CAUSA  EXTERNA)",
            "CONDICIÓN DEL ALTA", "REQUIERE HOSPITALIZACIÓN", "NOMBRE DEL HOSPITAL AL QUE FUE REFERIDO PARA LA HOSPITALIZACIÓN", "CAUSA DE ATENCIÓN", "TIPO DE TRIAJE",
            "NÚMERO DE IDENTIFICACIÓN DEL PROFESIONAL DE SALUD", "NOMBRES Y APELLIDOS DEL PROFESIONAL DE SALUD", "CI DEL PROFESIONAL DE SALUD DE APOYO", "NOMBRES Y APELLIDOS DEL PROFESIONAL DE SALUD DE APOYO",
            "OBSERVACIÓN", "ATENCION FINALIZADA", "FECHA DE REPORTE", "EDAD GESTACIONAL", "RIESGO OBSTÉTRICO",
            "UNIDAD SALUD CERCANA", "DIRECCIÓN DOMICILIARIA", "TELÉFONO DE PACIENTE"
        ]

        FIELDS = [
            "for_008_emer_inst_sist", "for_008_emer_unic", "for_008_emer_unid", "for_008_emer_zona",
            "for_008_emer_prov", "for_008_emer_cant", "for_008_emer_dist", "for_008_emer_nive", "for_008_emer_fech_aten", "for_008_emer_hora_aten", "for_008_emer_fech_naci_paci",
            "for_008_emer_tipo_docu_iden", "for_008_emer_nume_iden", "for_008_emer_prim_apel", "for_008_emer_segu_apel", "for_008_emer_prim_nomb",
            "for_008_emer_segu_nomb", "for_008_emer_sexo", "for_008_emer_edad", "for_008_emer_cond_edad", "for_008_emer_naci", "for_008_emer_etni", "for_008_emer_grup_prio", "for_008_emer_tipo_segu",
            "for_008_emer_prov_resi", "for_008_emer_cant_resi", "for_008_emer_parr_resi", "for_008_emer_espe_prof", "for_008_emer_cie_10_prin", "for_008_emer_diag_prin",
            "for_008_emer_cond_diag", "for_008_emer_cie_10_caus_exte", "for_008_emer_diag_caus_exte",
            "for_008_emer_cond_alta", "for_008_emer_hosp", "for_008_emer_nomb_hosp_refe_hosp", "for_008_emer_caus_aten", "for_008_emer_tipo_tria",
            "for_008_emer_resp_aten_medi", "for_008_emer_apoy_aten_medi",
            "for_008_emer_obse", "for_008_emer_aten_fina", "for_008_emer_fech_repor", "for_008_emer_edad_gest", "for_008_emer_ries_obst",
            "for_008_emer_unid_salu_resp_segu_aten", "for_008_emer_dire_domi", "for_008_emer_tele_paci"
        ]

        def separar_profesional(valor):
            texto = (valor or "").strip()
            if not texto:
                return "", ""
            partes = texto.split(" ", 1)
            if len(partes) == 1:
                return partes[0], ""
            return partes[0], partes[1]

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
            writer = csv.writer(Echo(), delimiter=';')
            yield "\ufeff"
            yield writer.writerow(HEADERS)

            for row in base_qs.values(*FIELDS).iterator(chunk_size=5000):
                resp_cedula, resp_nombre = separar_profesional(
                    row.get("for_008_emer_resp_aten_medi")
                )
                apoy_cedula, apoy_nombre = separar_profesional(
                    row.get("for_008_emer_apoy_aten_medi")
                )

                fila = []
                for field in FIELDS:
                    valor = row.get(field)

                    if field in ("for_008_emer_segu_apel", "for_008_emer_segu_nomb"):
                        fila.append(valor.strip() if valor else "NNN")
                    elif field == "for_008_emer_resp_aten_medi":
                        fila.extend([resp_cedula, resp_nombre])
                    elif field == "for_008_emer_apoy_aten_medi":
                        fila.extend([apoy_cedula, apoy_nombre])
                    else:
                        fila.append(serialize_value(valor))

                yield writer.writerow(fila)

        filename = f'form008_emergencia_{start_date.strftime("%Y%m%d")}_{end_date.strftime("%Y%m%d")}.csv'
        response = StreamingHttpResponse(
            row_iter(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'
        response["X-Accel-Buffering"] = "no"
        return response

    @action(detail=False, methods=['get'], url_path='reporte-mensual')
    def reporte_mensual(self, request, *args, **kwargs):
        """
        GET /form-008-emergencia/reporte-mensual/?form_008_year=YYYY
        """
        # Año
        try:
            year = int(request.query_params.get(
                'form_008_year', timezone.now().year))
        except (TypeError, ValueError):
            return Response({"detail": "Parámetro 'form_008_year' inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Rol autenticado
        auth_eni_user_id = getattr(request.user, 'id', None)
        try:
            user_rol = getattr(request.user, 'fun_admi_rol', 0)
        except (TypeError, ValueError):
            return Response({"detail": "Rol de usuario inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Objetivo (solo para rol 1)
        target_eni_user = request.query_params.get(
            'id_eni_user') or request.query_params.get('eni_user_id')
        if target_eni_user is not None:
            try:
                target_eni_user = int(target_eni_user)
            except (TypeError, ValueError):
                return Response({"detail": "Parámetro 'id_eni_user' inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Base queryset
        base_qs = self.get_queryset().filter(for_008_emer_fech_aten__year=year)

        # Filtros por rol
        if user_rol == 3:
            if not auth_eni_user_id:
                return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)
            base_qs = base_qs.filter(eniUser=auth_eni_user_id)
            response_id_eni_user = str(auth_eni_user_id)
        elif user_rol == 2 or user_rol == 4:
            if not auth_eni_user_id:
                return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)
            unidades = unidad_salud.objects.filter(
                eniUser=auth_eni_user_id
            ).values_list('uni_unic', flat=True)
            base_qs = base_qs.filter(for_008_emer_unic__in=list(unidades))
            response_id_eni_user = str(auth_eni_user_id)
        elif user_rol == 1:
            # Admin: si especifica un médico, filtra por ese médico (comportamiento solicitado)
            if target_eni_user is not None:
                base_qs = base_qs.filter(eniUser=target_eni_user)
                response_id_eni_user = str(target_eni_user)
            else:
                # Sin filtro de médico: se reporta agrupado por cada médico
                response_id_eni_user = str(
                    auth_eni_user_id) if auth_eni_user_id else ""
        else:
            return Response({"detail": "Rol no soportado."}, status=status.HTTP_403_FORBIDDEN)

        # Agregación mensual por unidad y médico
        qs = (
            base_qs
            .annotate(month=ExtractMonth('for_008_emer_fech_aten'))
            .values('for_008_emer_unic', 'for_008_emer_unid', 'for_008_emer_resp_aten_medi', 'month')
            .annotate(
                total_all=Count('for_008_emer_aten_fina'),
                total_unique=Count('for_008_emer_aten_fina', distinct=True)
            )
            .order_by('for_008_emer_unic', 'for_008_emer_resp_aten_medi', 'month')
        )

        meses_es = [
            "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
            "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
        ]

        # Agrupar por (unidad, médico)
        agrupado = {}
        for row in qs:
            unic = (row.get('for_008_emer_unic') or '').strip()
            unid = (row.get('for_008_emer_unid') or '').strip()
            medi = (row.get('for_008_emer_resp_aten_medi') or '').strip()
            key = (unic, unid, medi)
            if key not in agrupado:
                agrupado[key] = {
                    "for_008_emer_unic": unic,
                    "for_008_emer_unid": unid,
                    "for_008_emer_resp_aten_medi": medi,
                    "meses": {m: [0, 0] for m in meses_es}
                }
            num_mes = row.get('month')
            if num_mes and 1 <= num_mes <= 12:
                agrupado[key]["meses"][meses_es[num_mes - 1]] = [
                    row.get('total_all', 0) or 0,
                    row.get('total_unique', 0) or 0
                ]

        # Preparar salida
        results = []
        for (unic, unid, medi), data_u in sorted(agrupado.items(), key=lambda x: (x[0][0], x[0][1], x[0][2])):
            total_all_anual = sum(v[0] for v in data_u["meses"].values())
            total_unique_anual = sum(v[1] for v in data_u["meses"].values())
            results.append({
                "unidad_salud": f"{unic} {unid}".replace("  ", " ").strip(),
                "medico": medi,
                "meses": data_u["meses"],
                "total": [total_all_anual, total_unique_anual]
            })

        # Si no hay registros, retornar estructura con ceros
        if not results:
            results.append({
                "unidad_salud": "",
                "medico": "",
                "meses": {m: [0, 0] for m in meses_es},
                "total": [0, 0]
            })

        return Response(
            {
                "id_eni_user": response_id_eni_user,
                "year": year,
                "results": results
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='reporte-diagnostico')
    def reporte_diagnostico(self, request, *args, **kwargs):
        """
        GET /form008-emergencia/reporte-diagnostico/?form_008_year=YYYY
        """
        try:
            form_008_year = int(request.query_params.get(
                'form_008_year', timezone.now().year))
        except (TypeError, ValueError):
            return Response({"detail": "Parámetro 'form_008_year' inválido."}, status=status.HTTP_400_BAD_REQUEST)

        id_eni_user = getattr(request.user, 'id', None)
        form_008_user_rol = int(getattr(request.user, 'fun_admi_rol', 0) or 0)
        if not id_eni_user or form_008_user_rol not in (1, 2, 3, 4):
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        qs = self.get_queryset().filter(for_008_emer_fech_aten__year=form_008_year)
        if form_008_user_rol == 3:
            qs = qs.filter(eniUser=id_eni_user)

        if form_008_user_rol == 2 or form_008_user_rol == 4:
            unidades = unidad_salud.objects.filter(
                eniUser=id_eni_user).values_list('uni_unic', flat=True)
            qs = qs.filter(for_008_emer_unic__in=list(unidades))

        qs = qs.exclude(for_008_emer_cie_10_prin__isnull=True).exclude(
            for_008_emer_cie_10_prin='')
        agg = (
            qs.values('for_008_emer_cie_10_prin', 'for_008_emer_diag_prin')
            .annotate(
                hombre=Count('id', filter=Q(
                    for_008_emer_sexo__iregex=r'^(H|HOMBRE|MASC)')),
                mujer=Count('id', filter=Q(
                    for_008_emer_sexo__iregex=r'^(M|MUJER|FEM)')),
                intersexual=Count('id', filter=Q(
                    for_008_emer_sexo__istartswith='INTER')),
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
                "year": form_008_year,
                "results": results
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='buscar-atendidos-emergencia')
    def buscar_atendidos_emergencia(self, request):
        """
        GET /form-008-emergencia/buscar-atendidos-emergencia/?fechamin=YYYY-MM-DD&fechamax=YYYY-MM-DD&identidad=valor
        Limita el resultado a un máximo de 100 registros.
        """
        fechamin = (request.query_params.get('fechamin') or '').strip()
        fechamax = (request.query_params.get('fechamax') or '').strip()
        identidad = (request.query_params.get('identidad') or '').strip()

        if not fechamin or not fechamax:
            return Response(
                {"detail": "Los parámetros 'fechamin' y 'fechamax' son obligatorios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha_min = datetime.strptime(fechamin, "%Y-%m-%d").date()
            fecha_max = datetime.strptime(fechamax, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if fecha_min > fecha_max:
            return Response(
                {"detail": "'fechamin' no puede ser mayor que 'fechamax'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if (fecha_max - fecha_min).days > 31:
            return Response(
                {"detail": "El rango máximo permitido es de 31 días."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not identidad:
            return Response(
                {"detail": "El parámetro 'Cedula, Apellido o Nombres' es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        def normalizar(texto):
            texto = unicodedata.normalize('NFKD', texto)
            texto = ''.join(c for c in texto if not unicodedata.combining(c))
            texto = re.sub(r'\s+', ' ', texto)
            return texto.upper().strip()

        identidad_norm = normalizar(identidad)
        q = Q()

        if re.fullmatch(r'\d{5,20}', identidad_norm):
            q &= Q(for_008_emer_nume_iden__iexact=identidad_norm)
        else:
            tokens = identidad_norm.split()
            for token in tokens:
                if not token:
                    continue
                q_token = (
                    Q(for_008_emer_prim_apel__istartswith=token) |
                    Q(for_008_emer_segu_apel__istartswith=token) |
                    Q(for_008_emer_prim_nomb__istartswith=token) |
                    Q(for_008_emer_segu_nomb__istartswith=token)
                )
                q &= q_token

        fecha_field = "for_008_emer_fech_aten"
        try:
            model_field = form_008_emergencia._meta.get_field(fecha_field)
            if model_field.get_internal_type() == "DateTimeField":
                tz = timezone.get_current_timezone()
                fecha_min_bound = timezone.make_aware(
                    datetime.combine(fecha_min, time.min), tz)
                fecha_max_bound = timezone.make_aware(
                    datetime.combine(fecha_max, time.max), tz)
            else:
                fecha_min_bound = fecha_min
                fecha_max_bound = fecha_max
        except Exception:
            fecha_min_bound = fecha_min
            fecha_max_bound = fecha_max

        qs = (
            form_008_emergencia.objects
            .filter(**{f"{fecha_field}__range": (fecha_min_bound, fecha_max_bound)})
            .filter(q)
            .order_by(
                "for_008_emer_prim_apel",
                "for_008_emer_segu_apel",
                "for_008_emer_prim_nomb",
                "for_008_emer_segu_nomb"
            )
        )

        total = qs.count()
        if total == 0:
            return Response(
                {
                    "message": "No se encontraron atenciones con los criterios proporcionados.",
                    "cantidad": 0,
                    "resultados": []
                },
                status=status.HTTP_200_OK
            )

        limite = 100
        if total > limite:
            qs_limited = qs[:limite]
            serializer = self.get_serializer(qs_limited, many=True)
            return Response(
                {
                    "message": f"La búsqueda produjo {total} registros. Se muestran los primeros {limite}. Por favor refine su búsqueda.",
                    "cantidad": limite,
                    "resultados": serializer.data
                },
                status=status.HTTP_200_OK
            )

        serializer = self.get_serializer(qs, many=True)
        return Response(
            {
                "message": f"Se encontraron {total} registro(s).",
                "cantidad": total,
                "resultados": serializer.data
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
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2  # SOLO PARA PRUEBAS, QUITAR ESTA LÍNEA EN PRODUCCIÓN
        medic_apoll_id = data.get('for_008_emer_apoy_aten_medi', '')
        eni_user = self.get_eni_user(id_eni_user)

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
        edad_cond_str = data.get('for_008_emer_edad_cond', '').strip().upper()
        # Buscar el primer grupo de número + unidad (AÑO/S, MES/ES, DIA/S, HORA/S)
        match = re.search(
            r'(\d+)\s*(AÑO/S|MES/ES|DIA/S|HORA/S)', edad_cond_str)
        if match:
            edad_numero = match.group(1)
            edad_cond = match.group(2)
            edad_cond = {'AÑO/S': 'AÑO/S', 'MES/ES': 'MES/ES',
                         'DIA/S': 'DIA/S', 'HORA/S': 'HORA/S'}.get(edad_cond, edad_cond)
            if edad_numero == '0':
                edad_numero = '1'
                edad_cond = 'HORA/S'
        else:
            edad_numero = ''
            edad_cond = ''
        data['for_008_emer_edad'] = edad_numero
        data['for_008_emer_cond_edad'] = edad_cond

        # Nombres y apellidos
        apellidos = self.split_nombre_apellido(
            data.get('for_008_emer_apel_comp', ''))
        nombres = self.split_nombre_apellido(
            data.get('for_008_emer_nomb_comp', ''))
        data['for_008_emer_prim_apel'], data['for_008_emer_segu_apel'] = apellidos
        data['for_008_emer_prim_nomb'], data['for_008_emer_segu_nomb'] = nombres

        # --- ACTUALIZAR admision_datos ---
        id_admision = data.get('id_admision_datos')
        tipo_segu = data.get('for_008_emer_tipo_segu')
        if id_admision and tipo_segu:
            try:
                admision = admision_datos.objects.get(pk=id_admision)
                admision.adm_dato_adic_tipo_segu = tipo_segu
                admision.save()
            except admision_datos.DoesNotExist:
                pass  # O puedes retornar un error si es crítico

        # Diagnósticos
        cie10_prin_diag = data.get('for_008_emer_cie_10_prin_diag', [])
        cond_diag = data.get('for_008_emer_cond_diag', [])
        cie10_secu_diag = data.get('for_008_emer_cie_10_caus_exte_diag', [])

        for_008_emer_nomb_hosp_refe_hosp = data.get(
            'for_008_emer_nomb_hosp_refe_hosp', '')
        for_008_emer_caus_aten = data.get('for_008_emer_caus_aten', '')
        data['for_008_emer_nomb_hosp_refe_hosp'] = for_008_emer_nomb_hosp_refe_hosp
        data['for_008_emer_caus_aten'] = for_008_emer_caus_aten
        for_008_emer_tipo_tria = data.get('for_008_emer_tipo_tria', '')
        data['for_008_emer_tipo_tria'] = for_008_emer_tipo_tria

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

        data['eniUser'] = id_eni_user
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


class AdminAgendaTurnosRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = AdminAgendaTurnosRegistrationSerializer
    queryset = admin_agenda_turnos.objects.all()
    # permission_classes = [permissions.AllowAny]
    permission_classes = [IsAuthenticated, HasRole]
    allowed_roles = [3, 5, 6, 7]

    def get_permissions(self):
        # Para el resto, usa los permisos definidos en la vista (IsAuthenticated + HasRole)
        return [perm() for perm in self.permission_classes]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)

        queryset = self.queryset

        if user_id is not None:
            queryset = queryset.filter(eniUser=user_id)

        if month is not None and year is not None:
            queryset = queryset.filter(
                adm_agen_turn_fech__year=year, adm_agen_turn_fech__month=month)

        now = timezone.localtime()
        today = now.date()
        current_time = now.time()
        # Aproximadamente 4 meses
        four_months_later = today + timedelta(days=4*30)
        queryset = queryset.filter(
            adm_agen_turn_fech__gte=today,
            adm_agen_turn_fech__lte=four_months_later
        )
        queryset = queryset.exclude(
            adm_agen_turn_fech=today,
            adm_agen_turn_hora_inic__lt=current_time
        )

        return queryset.order_by('adm_agen_turn_fech', 'adm_agen_turn_hora_inic')

    @action(detail=False, methods=['get'], url_path='buscar-agenda')
    def get_buscar_agenda(self, request):
        """
        GET /admin-agenda-turnos/buscar-agenda/?tipo_especialidad=<ESPECIALIDAD>&unid_salu=<UNIDAD_DE_SALUD>&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
        """

        tipo_espe = request.query_params.get('tipo_especialidad', None)
        unid_salu = request.query_params.get('unid_salu', None)
        fecha_inic = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        four_months_later = today + timedelta(days=120)
        # Primera búsqueda en eniUser
        try:
            queryset = admin_agenda_turnos.objects.filter(
                adm_agen_turn_unid_salu=unid_salu,
                adm_agen_turn_esta_cita__in=[1, 2],
                adm_agen_turn_fech__gte=today,
                adm_agen_turn_fech__lte=four_months_later
            )
            # Filtro por especialidad
            if tipo_espe:
                queryset = queryset.filter(adm_agen_turn_tipo_espe=tipo_espe)
            # Filtro por fecha de inicio
            if fecha_inic:
                queryset = queryset.filter(adm_agen_turn_fech__gte=fecha_inic)
            # Filtro por fecha de fin
            if fecha_fin:
                queryset = queryset.filter(adm_agen_turn_fech__lte=fecha_fin)
            # Filtro adicional: si es hoy, solo horas futuras
            queryset = queryset.exclude(
                adm_agen_turn_fech=today,
                adm_agen_turn_hora_inic__lt=current_time
            )
            # Solo los campos requeridos
            data = queryset.values(
                'id',
                'adm_agen_turn_fech',
                'adm_agen_turn_hora_inic',
                'adm_agen_turn_hora_fin',
                'adm_agen_turn_unid_salu',
                'adm_agen_turn_tipo_espe',
                'adm_agen_turn_prof_cita',
                'adm_agen_turn_dura_cita',
                'adm_agen_turn_esta_cita',
                'adm_agen_turn_rese_unic_salu',
            ).order_by('adm_agen_turn_fech', 'adm_agen_turn_hora_inic')

            data_list = list(data)
            if not data_list:
                return Response({"message": "No se encontraron turnos disponibles para los filtros seleccionados."})

            # return Response(data_list)
            return Response({"message": "Listado de turnos disponibles", "data": data_list}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            return Response({"error": "No se encontro las unidades de salud del usuario!"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='pacientes-agendados')
    def get_pacientes_agendados(self, request):
        """
        GET /admin-agenda-turnos/pacientes-agendados/?tipo_especialidad=<ESPECIALIDAD>&tipo_cita=<TIPO_CITA>&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
        """
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2  # Solo para pruebas, luego se cambia por el id del usuario autenticado

        tipo_espe = request.query_params.get('tipo_especialidad', None)
        tipo_cita = int(request.query_params.get('tipo_cita', None))
        fecha_inicio = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)
        now = datetime.now()
        today = now.date()

        try:
            date_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            date_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            return Response(
                {"error": "Fechas de inicio o fin inválidas."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if date_inicio > date_fin:
            return Response(
                {"error": "La fecha de inicio no puede ser mayor a la fecha de fin."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (date_fin - date_inicio).days > 31:
            return Response(
                {"error": "El rango de fechas no puede exceder 31 días."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_data = eniUser.objects.get(id=id_eni_user)
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
            unidad_str = f"{unidades_salud[0].uni_unic} {unidades_salud[0].uni_unid}" if unidades_salud else ""
            unidad_salud = unidad_str.strip()

            if tipo_cita == 1:
                queryset = admin_agenda_turnos.objects.filter(
                    adm_agen_turn_unid_salu=unidad_salud,
                    adm_agen_turn_tipo_espe=tipo_espe,
                    adm_agen_turn_esta_cita__in=[3, 4, 5],
                    adm_agen_turn_fech__gte=today,
                    adm_agen_turn_fech__lte=date_fin
                )
            elif tipo_cita == 2:
                today = today - timedelta(days=1)
                queryset = admin_agenda_turnos.objects.filter(
                    adm_agen_turn_unid_salu=unidad_salud,
                    adm_agen_turn_tipo_espe=tipo_espe,
                    adm_agen_turn_esta_cita__in=[3, 4, 5],
                    adm_agen_turn_fech__gte=date_inicio,
                    adm_agen_turn_fech__lte=today
                )

            data = queryset.values(
                'id',
                'adm_agen_turn_fech',
                'adm_agen_turn_hora_inic',
                'adm_agen_turn_hora_fin',
                'adm_agen_turn_unid_salu',
                'adm_agen_turn_tipo_espe',
                'adm_agen_turn_prof_cita',
                'adm_agen_turn_dura_cita',
                'adm_agen_turn_esta_cita',
                'adm_agen_turn_nume_iden_paci',
                'adm_agen_turn_apel_nomb_paci',
                'adm_agen_turn_cons_link_paci',
                'adm_agen_turn_cons_obse_paci',
                'adm_agen_turn_cons_tipo_serv',
            ).order_by('adm_agen_turn_fech', 'adm_agen_turn_hora_inic')

            data_list = list(data)
            if not data_list:
                return Response({"message": "No se encontraron agendados disponibles para los filtros seleccionados."})

            # return Response(data_list)
            return Response({"message": "Se genero el reporte de agendados exitosamente.", "data": data_list}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            return Response({"error": "No se encontro las unidades de salud del usuario!"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='agenda-paciente')
    def get_agenda_paciente(self, request):
        """
        GET /admin-agenda-turnos/agenda-paciente/?tipo_iden=<TIPO_IDENTIFICACION>&nume_iden=<NUMERO_IDENTIFICACION>
        """
        tipo_iden = request.query_params.get('tipo_iden', None)
        nume_iden = request.query_params.get('nume_iden', None)

        queryset = admin_agenda_turnos.objects.filter(
            adm_agen_turn_tipo_iden_paci=tipo_iden,
            adm_agen_turn_nume_iden_paci=nume_iden,
        )
        # Solo los campos requeridos
        data = queryset.values(
            'id',
            'adm_agen_turn_fech',
            'adm_agen_turn_hora_inic',
            'adm_agen_turn_hora_fin',
            'adm_agen_turn_unid_salu',
            'adm_agen_turn_tipo_espe',
            'adm_agen_turn_prof_cita',
            'adm_agen_turn_esta_cita',
        ).order_by('-adm_agen_turn_fech', 'adm_agen_turn_hora_inic')[:10]

        data_list = list(data)
        if not data_list:
            return Response({"message": "No se encontraron turnos agendados para el paciente especificado."})

        return Response(data_list)

    @action(detail=False, methods=['get'], url_path='consulta-paciente')
    def get_consulta_paciente(self, request):
        """
        GET /admin-agenda-turnos/consulta-paciente/?tipo_iden=<TIPO_IDENTIFICACION>&nume_iden=<NUMERO_IDENTIFICACION>&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
        O TAMBIÉN:
        GET /admin-agenda-turnos/consulta-paciente/?apel_nomb_paci=<APELLIDOS_NOMBRES>&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
        """
        tipo_iden = request.query_params.get('tipo_iden', None)
        nume_iden = request.query_params.get('nume_iden', None)
        apel_nomb_paci = request.query_params.get('apel_nomb_paci', None)
        fecha_inicio = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)

        try:
            date_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            date_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            return Response(
                {"error": "Fechas de inicio o fin inválidas."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if date_inicio > date_fin:
            return Response(
                {"error": "La fecha de inicio no puede ser mayor a la fecha de fin."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (date_fin - date_inicio).days > 31:
            return Response(
                {"error": "El rango de fechas no puede exceder 31 días."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            queryset = admin_agenda_turnos.objects.filter(
                adm_agen_turn_fech__gte=date_inicio,
                adm_agen_turn_fech__lte=date_fin,
                adm_agen_turn_esta_cita__in=[4, 5]
            )
            # Si se envían tipo_iden y nume_iden, filtra por ellos
            if tipo_iden and nume_iden:
                queryset = queryset.filter(
                    adm_agen_turn_tipo_iden_paci=tipo_iden,
                    adm_agen_turn_nume_iden_paci=nume_iden
                )
            # Si se envía apel_nomb_paci, filtra por nombre/apellido (puedes usar icontains para búsqueda parcial)
            elif apel_nomb_paci:
                queryset = queryset.filter(
                    adm_agen_turn_apel_nomb_paci__icontains=apel_nomb_paci
                )
            else:
                return Response(
                    {"error": "Debe enviar tipo_iden y nume_iden o apel_nomb_paci."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Solo los campos requeridos
            data = queryset.values(
                'id',
                'adm_agen_turn_fech',
                'adm_agen_turn_hora_inic',
                'adm_agen_turn_unid_salu',
                'adm_agen_turn_tipo_espe',
                'adm_agen_turn_prof_cita',
                'adm_agen_turn_nume_iden_paci',
                'adm_agen_turn_apel_nomb_paci',
                'adm_agen_turn_esta_cita',
                'adm_agen_turn_cons_link_paci',
                'adm_agen_turn_cons_obse_paci',
                'adm_agen_turn_cons_tipo_serv',
            ).order_by('-adm_agen_turn_fech', 'adm_agen_turn_hora_inic')

            data_list = list(data)
            if not data_list:
                return Response({"message": "No se encontraron consultas para el paciente con los parametros ingresados."})

            return Response({"message": "Se genero el reporte de resultado de la consulta exitosamente.", "data": data_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Ocurrió un error al consultar las consultas del paciente: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        id_eni_user = getattr(request.user, 'id', None)
        if isinstance(data, list):
            created_objects = []
            errors = []
            for item in data:
                mapped_data = {
                    "adm_agen_turn_fech": item.get("adm_agen_turn_fech"),
                    "adm_agen_turn_unid_salu": item.get("adm_agen_turn_unid_salu"),
                    "adm_agen_turn_tipo_espe": item.get("adm_agen_turn_tipo_espe"),
                    "adm_agen_turn_prof_cita": item.get("adm_agen_turn_eniUser"),
                    "adm_agen_turn_dura_cita": int(item.get("adm_agen_turn_dura_min")),
                    "adm_agen_turn_hora_inic": item.get("adm_agen_turn_hora_inic"),
                    "adm_agen_turn_hora_fin": item.get("adm_agen_turn_hora_fin"),
                    "adm_agen_turn_esta_cita": int(item.get("adm_agen_turn_esta_cita")),
                    "adm_agen_turn_rese_unic_salu": item.get("adm_agen_turn_rese_unid_salu"),
                    "id_prof_cita": int(item.get("adm_agen_turn_prof_cita")),
                    "eniUser": id_eni_user
                }

                try:
                    now = timezone.localtime()
                    today = now.date()
                    current_time = now.time()

                    turno_fecha = datetime.strptime(
                        mapped_data["adm_agen_turn_fech"], "%Y-%m-%d"
                    ).date()
                    turno_hora_inic = datetime.strptime(
                        mapped_data["adm_agen_turn_hora_inic"], "%H:%M"
                    ).time()
                except (TypeError, ValueError):
                    return Response(
                        {"message": "Fecha u hora de inicio inválidas."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if turno_fecha < today or (turno_fecha == today and turno_hora_inic < current_time):
                    return Response(
                        {"message": "No se permiten turnos en fechas u horas ya pasadas."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                existe = admin_agenda_turnos.objects.filter(
                    adm_agen_turn_fech=mapped_data["adm_agen_turn_fech"],
                    adm_agen_turn_tipo_espe=mapped_data["adm_agen_turn_tipo_espe"],
                    adm_agen_turn_hora_inic=mapped_data["adm_agen_turn_hora_inic"],
                    adm_agen_turn_hora_fin=mapped_data["adm_agen_turn_hora_fin"],
                    id_prof_cita=mapped_data["id_prof_cita"]
                ).exists()

                if existe:
                    errors.append({
                        "turno": mapped_data,
                        "error": "Ya existe un turno con estos datos (fecha, tipo, profesional, hora)."
                    })
                    continue
                if int(mapped_data["adm_agen_turn_dura_cita"]) <= 10:
                    errors.append({
                        "turno": mapped_data,
                        "error": "La duración del turno debe ser al menos 10 minutos."
                    })
                    continue
                serializer = self.get_serializer(data=mapped_data)
                if serializer.is_valid():
                    serializer.save()
                    created_objects.append(serializer.data)
                else:
                    errors.append(serializer.errors)
            if errors:
                return Response({"message": "Algunos turnos no se pudieron crear", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"message": "Se crearon los turnos exitosamente!", "data": created_objects}, status=status.HTTP_201_CREATED)
        else:
            # Si recibes un solo objeto, comportamiento original
            mapped_data = {
                "adm_agen_turn_fech": data.get("adm_agen_turn_fech"),
                "adm_agen_turn_unid_salu": data.get("adm_agen_turn_unid_salu"),
                "adm_agen_turn_tipo_espe": data.get("adm_agen_turn_tipo_espe"),
                "adm_agen_turn_prof_cita": data.get("adm_agen_turn_eniUser"),
                "adm_agen_turn_dura_cita": int(data.get("adm_agen_turn_dura_min")),
                "adm_agen_turn_hora_inic": data.get("adm_agen_turn_hora_inic"),
                "adm_agen_turn_hora_fin": data.get("adm_agen_turn_hora_fin"),
                "adm_agen_turn_esta_cita": int(data.get("adm_agen_turn_esta_cita")),
                "adm_agen_turn_rese_unic_salu": data.get("adm_agen_turn_rese_unid_salu"),
                "id_prof_cita": int(data.get("adm_agen_turn_prof_cita")),
                "eniUser": id_eni_user
            }
            existe = admin_agenda_turnos.objects.filter(
                adm_agen_turn_fech=mapped_data["adm_agen_turn_fech"],
                adm_agen_turn_tipo_espe=mapped_data["adm_agen_turn_tipo_espe"],
                adm_agen_turn_hora_inic=mapped_data["adm_agen_turn_hora_inic"],
                adm_agen_turn_hora_fin=mapped_data["adm_agen_turn_hora_fin"],
                id_prof_cita=mapped_data["id_prof_cita"]
            ).exists()
            if existe:
                return Response({"message": "Ya existe un turno con estos datos (fecha, tipo, profesional, hora)."}, status=status.HTTP_400_BAD_REQUEST)
            if int(mapped_data["adm_agen_turn_dura_cita"]) <= 10:
                return Response({"message": "La duración del turno debe ser al menos 10 minutos."}, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.get_serializer(data=mapped_data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"message": "Se creó el turno exitosamente!", "data": serializer.data}, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Validar el estado antes de eliminar
        if instance.adm_agen_turn_esta_cita not in [1, 2]:
            return Response(
                {"detail": "Solo se pueden eliminar turnos en estado DISPONIBLE o RESERVADO."},
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response({"message": "Turno eliminado correctamente."}, status=status.HTTP_204_NO_CONTENT)

    def mensaje_paciente(self, telefono, message):
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_whatsapp = os.environ.get('TWILIO_WHATSAPP_FROM')

        client = Client(account_sid, auth_token)
        # Formatear el número: quitar 0 inicial y anteponer +593
        telefono = telefono.strip()
        if telefono.startswith('0'):
            telefono = telefono[1:]
        telefono_formateado = f'+593{telefono}'

        message = client.messages.create(
            from_=from_whatsapp,
            body=message,
            to=f'whatsapp:{telefono_formateado}'
        )
        return message.sid

    @transaction.atomic
    def update(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        id_turno_age = pk
        if not id_turno_age:
            return Response({"error": "El parámetro 'id_turno' es requerido para actualizar el registro!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            id_turno = admin_agenda_turnos.objects.get(id=id_turno_age)
        except admin_agenda_turnos.DoesNotExist:
            return Response({"error": "Registro de turno no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        try:
            turno = admin_agenda_turnos.objects.get(id=id_turno_age)
            adm_agen_turn_unid_salu = turno.adm_agen_turn_unid_salu
            adm_agen_turn_tipo_espe = turno.adm_agen_turn_tipo_espe
            adm_agen_turn_dura_cita = turno.adm_agen_turn_dura_cita
            adm_agen_turn_fech = turno.adm_agen_turn_fech
            adm_agen_turn_hora_inic = turno.adm_agen_turn_hora_inic
        except admin_agenda_turnos.DoesNotExist:
            # Manejo de error si no existe el turno
            return Response({"error": "Turno no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        try:
            now = timezone.localtime()
            today = now.date()
            current_time = now.time()

            turno_fecha = adm_agen_turn_fech
            turno_hora_inic = adm_agen_turn_hora_inic
        except (TypeError, ValueError):
            return Response({"message": "Fecha u hora de inicio inválidas."}, status=status.HTTP_400_BAD_REQUEST)

        if turno_fecha < today or (turno_fecha == today and turno_hora_inic < current_time):
            return Response({"message": f"No se permiten turnos en fechas u horas ya pasadas. {today} - {current_time.strftime('%H:%M:%S')}"}, status=status.HTTP_400_BAD_REQUEST)

        adm_agen_turn_tipo_iden_paci = data.get('age_turn_paci_tipo_iden')
        adm_agen_turn_nume_iden_paci = data.get('age_turn_paci_nume_iden')
        adm_agen_turn_apel_nomb_paci = data.get('age_turn_paci_apel_nomb')
        adm_agen_turn_tele_paci = data.get('age_turn_paci_tele')
        adm_agen_turn_corr_paci = data.get('age_turn_paci_corr_paci')
        adm_agen_turn_dire_paci = data.get('age_turn_paci_dire_paci')
        adm_agen_turn_unid_salu_resp_segu_aten_paci = data.get(
            'age_turn_paci_unid_salu_resp_segu_aten_paci')
        adm_agen_turn_obse_paci = data.get('age_turn_paci_obse_paci')
        id_admi_paci = data.get('id_admision_paci')

        existe_turno = admin_agenda_turnos.objects.filter(
            adm_agen_turn_fech=turno_fecha,
            adm_agen_turn_unid_salu=adm_agen_turn_unid_salu,
            adm_agen_turn_tipo_espe=adm_agen_turn_tipo_espe,
            adm_agen_turn_tipo_iden_paci=adm_agen_turn_tipo_iden_paci,
            adm_agen_turn_nume_iden_paci=adm_agen_turn_nume_iden_paci
        ).exclude(id=id_turno_age).exists()

        if existe_turno:
            return Response(
                {"message": f"El paciente ya tiene un turno para ese día {turno_fecha} en esa unidad de salud {adm_agen_turn_unid_salu}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if adm_agen_turn_tele_paci or adm_agen_turn_corr_paci:
            try:
                admision = admision_datos.objects.get(
                    adm_dato_pers_tipo_iden=adm_agen_turn_tipo_iden_paci,
                    adm_dato_pers_nume_iden=adm_agen_turn_nume_iden_paci
                )
                if adm_agen_turn_tele_paci:
                    admision.adm_dato_pers_celu = adm_agen_turn_tele_paci
                if adm_agen_turn_corr_paci:
                    admision.adm_dato_pers_corr_elec = adm_agen_turn_corr_paci
                admision.save()
            except admision_datos.DoesNotExist:
                pass

        data['adm_agen_turn_tipo_iden_paci'] = adm_agen_turn_tipo_iden_paci
        data['adm_agen_turn_nume_iden_paci'] = adm_agen_turn_nume_iden_paci
        data['adm_agen_turn_apel_nomb_paci'] = adm_agen_turn_apel_nomb_paci
        data['adm_agen_turn_tele_paci'] = adm_agen_turn_tele_paci
        data['adm_agen_turn_corr_paci'] = adm_agen_turn_corr_paci
        data['adm_agen_turn_dire_paci'] = adm_agen_turn_dire_paci
        data['adm_agen_turn_unid_salu_resp_segu_aten_paci'] = adm_agen_turn_unid_salu_resp_segu_aten_paci
        data['adm_agen_turn_obse_paci'] = adm_agen_turn_obse_paci
        data['adm_agen_turn_esta_cita'] = 3
        data['id_admision_paci'] = id_admi_paci

        serializer = self.get_serializer(id_turno, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # if adm_agen_turn_tele_paci != "":
        #     mensaje = (
        #         f'Estimado/a *{adm_agen_turn_apel_nomb_paci}*, su cita médica ha sido agendada exitosamente.\n'
        #         f'Fecha: {adm_agen_turn_fech}\n'
        #         f'Hora: {adm_agen_turn_hora_inic}\n'
        #         f'Especialidad: {adm_agen_turn_tipo_espe}\n'
        #         f'Unidad de Salud: {adm_agen_turn_unid_salu}\n'
        #         'Por favor, preséntese 30 minutos antes. Si no puede asistir, avísenos con anticipación.'
        #     )
        #     try:
        #         self.mensaje_paciente(adm_agen_turn_tele_paci, mensaje)
        #     except Exception as e:
        #         logger.error(f"Error enviando WhatsApp: {e}")

        # if adm_agen_turn_corr_paci != "":
        #     send_mail(
        #         subject='¡CITA MEDICA AGENDADA!',
        #         message=(
        #             f'Estimado Sr/Sra. {adm_agen_turn_apel_nomb_paci}:\n\n'
        #             'Reciba un cordial saludo.\n'
        #             'Le informamos que su cita médica ha sido agendada exitosamente en nuestro sistema.\n'
        #             'A continuación, se detallan los datos correspondientes a su turno:\n'
        #             f'- Identificación: {adm_agen_turn_nume_iden_paci}\n'
        #             f'- Tipo de atención: {adm_agen_turn_tipo_espe}\n'
        #             f'- Lugar donde se realizará: {adm_agen_turn_unid_salu}\n'
        #             f'- Fecha de la cita: {adm_agen_turn_fech}\n'
        #             f'- Hora de la cita: {adm_agen_turn_hora_inic}\n'
        #             f'- Duración de la cita: {adm_agen_turn_dura_cita} minutos\n'
        #             'Recomendaciones importantes:\n'
        #             '- Presentarse con al menos 30 minutos de anticipación.\n'
        #             '- Portar su documento de identidad original.\n'
        #             '- Acudir con mascarilla o cumplir con las medidas de bioseguridad vigentes, si aplica.\n'
        #             'En caso de no poder asistir a su cita, le solicitamos informarlo con anticipación a la unidad de salud correspondiente, \n'
        #             'a fin de reasignar el turno y optimizar la atención a otros usuarios.\n'
        #             'Agradecemos su puntualidad y colaboración para brindar un servicio de calidad.\n\n'
        #             'Saludos cordiales,\nEl equipo de soporte.\n'
        #             'Nota: Este correo es informativo, favor no responder a esta direccion de correo.'
        #         ),
        #         from_email=settings.DEFAULT_FROM_EMAIL,
        #         recipient_list=[adm_agen_turn_corr_paci],
        #         fail_silently=False,
        #     )

        return Response({"message": "El usuario se agendo exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], url_path='update-turno')
    def update_turno(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        id_turno_age = pk
        if not id_turno_age:
            return Response({"error": "El parámetro 'id_turno' es requerido para actualizar el registro!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            id_turno = admin_agenda_turnos.objects.get(id=id_turno_age)
        except admin_agenda_turnos.DoesNotExist:
            return Response({"error": "Registro de turno no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        adm_agen_turn_fech = data.get('adm_agen_turn_fech_moda')
        adm_agen_turn_tipo_espe = data.get('adm_agen_turn_tipo_espe_moda')
        adm_agen_turn_prof_cita = data.get('adm_agen_turn_prof_cita_moda')
        adm_agen_turn_hora_inic = data.get('adm_agen_turn_hora_inic_moda')
        adm_agen_turn_hora_fin = data.get('adm_agen_turn_hora_fin_moda')
        adm_agen_turn_dura_cita = data.get('adm_agen_turn_dura_min_moda')
        adm_agen_turn_esta_cita = data.get('adm_agen_turn_esta_cita_moda')
        adm_agen_turn_rese_unic_salu = data.get(
            'adm_agen_turn_rese_unid_salu_moda')

        try:
            now = timezone.localtime()
            today = now.date()
            current_time = now.time()

            turno_fecha = adm_agen_turn_fech
            turno_hora_inic = adm_agen_turn_hora_inic
        except (TypeError, ValueError):
            return Response({"message": "Fecha u hora de inicio inválidas."}, status=status.HTTP_400_BAD_REQUEST)

        if turno_fecha < today or (turno_fecha == today and turno_hora_inic < current_time):
            return Response({"message": "No se permiten turnos en fechas u horas ya pasadas."}, status=status.HTTP_400_BAD_REQUEST)

        campos_llenos = all([
            adm_agen_turn_fech,
            adm_agen_turn_tipo_espe,
            adm_agen_turn_prof_cita,
            adm_agen_turn_hora_inic,
            adm_agen_turn_hora_fin,
            adm_agen_turn_dura_cita,
            adm_agen_turn_esta_cita
        ])
        rese_unic_ok = adm_agen_turn_esta_cita == 2 and adm_agen_turn_rese_unic_salu != ""

        if campos_llenos:
            data['adm_agen_turn_fech'] = adm_agen_turn_fech
            data['adm_agen_turn_tipo_espe'] = adm_agen_turn_tipo_espe
            data['adm_agen_turn_prof_cita'] = adm_agen_turn_prof_cita
            data['adm_agen_turn_hora_inic'] = adm_agen_turn_hora_inic
            data['adm_agen_turn_hora_fin'] = adm_agen_turn_hora_fin
            data['adm_agen_turn_dura_cita'] = adm_agen_turn_dura_cita
            data['adm_agen_turn_esta_cita'] = adm_agen_turn_esta_cita
            if rese_unic_ok:
                data['adm_agen_turn_rese_unic_salu'] = adm_agen_turn_rese_unic_salu
        else:
            data['adm_agen_turn_tipo_iden_paci'] = ""
            data['adm_agen_turn_nume_iden_paci'] = ""
            data['adm_agen_turn_apel_nomb_paci'] = ""
            data['adm_agen_turn_tele_paci'] = ""
            data['adm_agen_turn_corr_paci'] = ""
            data['adm_agen_turn_dire_paci'] = ""
            data['adm_agen_turn_unid_salu_resp_segu_aten_paci'] = ""
            data['adm_agen_turn_obse_paci'] = ""
            data['adm_agen_turn_esta_cita'] = 1

        serializer = self.get_serializer(id_turno, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({"message": "El turno se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], url_path='update-turno-atendido-inasistencia')
    def update_turno_atendido_inasistencia(self, request, pk=None, *args, **kwargs):
        data = request.data.copy()
        id_turno_age = pk
        if not id_turno_age:
            return Response({"error": "El parámetro 'id_turno' es requerido para actualizar el registro!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            id_turno = admin_agenda_turnos.objects.get(id=id_turno_age)
        except admin_agenda_turnos.DoesNotExist:
            return Response({"error": "Registro de turno no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        adm_agen_turn_fech = data.get('fecha_turno')
        estado_turno = int(data.get('estado_turno'))
        adm_agen_turn_cons_link_paci = data.get('link_consulta')
        adm_agen_turn_cons_obse_paci = data.get('obse_atencion')
        adm_agen_turn_cons_tipo_serv = data.get('tipo_servicio')
        tipo_cita = int(data.get('tipo_cita'))

        try:
            now = timezone.localtime()
            today = now.date()
            formato_fecha_turno = datetime.strptime(
                adm_agen_turn_fech, "%Y-%m-%d").date()
            turno_fecha = formato_fecha_turno
        except (TypeError, ValueError):
            return Response({"message": "Fecha u hora de inicio inválidas."}, status=status.HTTP_400_BAD_REQUEST)

        if (today != turno_fecha and tipo_cita == 1):
            return Response({"message": f"Los turnos atendidos o inasistentes solo se permiten el día de la cita {turno_fecha}."}, status=status.HTTP_400_BAD_REQUEST)
        campos_llenos = all([
            adm_agen_turn_fech,
            estado_turno
        ])

        if campos_llenos:
            if estado_turno == 1:
                data['adm_agen_turn_fech'] = turno_fecha
                data['adm_agen_turn_esta_cita'] = 4
                data['adm_agen_turn_cons_link_paci'] = adm_agen_turn_cons_link_paci
                data['adm_agen_turn_cons_obse_paci'] = adm_agen_turn_cons_obse_paci
                data['adm_agen_turn_cons_tipo_serv'] = adm_agen_turn_cons_tipo_serv
            elif estado_turno == 2:
                data['adm_agen_turn_fech'] = turno_fecha
                data['adm_agen_turn_esta_cita'] = 5
                data['adm_agen_turn_cons_link_paci'] = ""
                data['adm_agen_turn_cons_obse_paci'] = ""
                data['adm_agen_turn_cons_tipo_serv'] = ""
        serializer = self.get_serializer(id_turno, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({"message": "El turno se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='reporte-turno-pdf')
    def reporte_turno_pdf(self, request, pk=None):
        """
        GET /admin-agenda-turnos/<id_turno>/reporte-turno-pdf/
        """
        try:
            turno = admin_agenda_turnos.objects.get(pk=pk)
        except admin_agenda_turnos.DoesNotExist:
            return Response({"error": "Turno no encontrado"}, status=404)

        # Datos del turno
        nombre = getattr(turno, "adm_agen_turn_apel_nomb_paci", "")
        identificacion = getattr(turno, "adm_agen_turn_nume_iden_paci", "")
        tipo_espe = getattr(turno, "adm_agen_turn_tipo_espe", "")
        unidad = getattr(turno, "adm_agen_turn_unid_salu", "")
        fecha = getattr(turno, "adm_agen_turn_fech", "")
        hora = getattr(turno, "adm_agen_turn_hora_inic", "")
        duracion = getattr(turno, "adm_agen_turn_dura_cita", "")
        observaciones = getattr(turno, "adm_agen_turn_obse_paci", "")

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="turno_{pk}.pdf"'
        c = canvas.Canvas(response, pagesize=A6)
        width, height = A6
        margen = 5 * mm
        c.setLineWidth(1)
        c.rect(margen, margen, width - 2 * margen, height - 2 * margen)

        y = height - margen - 18
        c.setFont("Helvetica-Bold", 7)
        c.drawString(
            margen + 5, y, "OFICINA TECNICA 07D05 ARENILLAS-HUAQUILLAS-LAS LAJAS-SALUD")
        y -= 14
        c.setFont("Helvetica-Bold", 11)
        c.drawString(margen + 5, y, "¡CITA MEDICA AGENDADA!")
        y -= 20
        c.setFont("Helvetica", 8)
        c.drawString(margen + 5, y, f"Estimado/a Sr./Sra. {nombre}:")
        y -= 10
        c.drawString(margen + 5, y, "Reciba un cordial saludo.")
        y -= 10
        c.drawString(
            margen + 5, y, "Le informamos que su cita médica ha sido agendada exitosamente.")
        y -= 10
        c.drawString(
            margen + 5, y, "A continuación, se detallan los datos de su turno.")
        y -= 14
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margen + 7, y, "Información del paciente y turno:")
        y -= 14

        # ancho_total = width - 2 * margen
        # ancho_cuadro = (ancho_total) / 2
        # alto_cuadro = 90
        # y_cuadro = y - alto_cuadro

        # # Primer cuadro (izquierda)
        # c.rect(margen + 2, y_cuadro, ancho_cuadro, alto_cuadro)
        # c.drawString(margen + 8, y_cuadro +
        #              alto_cuadro - 12, "- Identificación:")
        # c.drawString(margen + 8, y_cuadro + alto_cuadro -
        #              24, "- Tipo de atención:")
        # c.drawString(margen + 8, y_cuadro + alto_cuadro - 36, "- Lugar:")
        # c.drawString(margen + 8, y_cuadro + alto_cuadro - 48, "- Fecha:")
        # c.drawString(margen + 8, y_cuadro + alto_cuadro - 60, "- Hora:")
        # c.drawString(margen + 8, y_cuadro + alto_cuadro - 72, "- Duración:")

        # # Segundo cuadro (derecha)
        # c.rect(margen + 2 + ancho_cuadro, y_cuadro, ancho_cuadro, alto_cuadro)
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 12, f"{identificacion}")
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 24, f"{tipo_espe}")
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 36, f"{unidad}")
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 48, f"{fecha}")
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 60, f"{hora}")
        # c.drawString(margen + 8 + ancho_cuadro, y_cuadro +
        #              alto_cuadro - 72, f"{duracion} minutos")
        # y -= 108

        c.drawString(margen + 12, y,
                     f"- Número de identificación: {identificacion}")
        y -= 10
        c.drawString(margen + 12, y, f"- Tipo de Servicio: {tipo_espe}")
        y -= 4

        styles = getSampleStyleSheet()
        mi_estilo = ParagraphStyle(
            'MiEstilo',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10
        )
        texto_largo = f"- Establecimiento de salud: {unidad}"
        p = Paragraph(texto_largo, mi_estilo)
        ancho_texto = width - 3 * margen - 10
        alto_texto = 12
        w, h = p.wrap(ancho_texto, alto_texto)
        p.drawOn(c, margen + 12, y - h)

        y -= h + 10
        c.drawString(margen + 12, y, f"- Fecha de atención: {fecha}")
        y -= 10
        c.drawString(margen + 12, y, f"- Hora de atención: {hora}")
        y -= 10
        c.drawString(margen + 12, y,
                     f"- Duración estimada: {duracion} minutos")
        y -= 4
        text_observaciones = f"- Observaciones: {observaciones}"
        p_observaciones = Paragraph(text_observaciones, mi_estilo)
        w_obs, h_obs = p_observaciones.wrap(ancho_texto, alto_texto)
        p_observaciones.drawOn(c, margen + 12, y - h_obs)
        y -= h_obs + 14

        c.drawString(margen + 7, y, "Indicaciones importantes:")
        y -= 10
        c.setFont("Helvetica", 8)
        c.drawString(
            margen + 12, y, "- Presentarse en la unidad de salud con al menos 30 minutos")
        y -= 10
        c.drawString(margen + 12, y, "de anticipación.")
        y -= 10
        c.drawString(margen + 12, y,
                     "- Portar su documento de identidad original.")
        y -= 10
        c.drawString(margen + 12, y,
                     "- Cumplir con las medidas de bioseguridad vigentes.")
        y -= 14
        c.drawString(
            margen + 5, y, "En caso de no poder asistir, le solicitamos informar oportunamente")
        y -= 10
        c.drawString(margen + 5, y, "para la reasignación de su turno.")
        y -= 14
        c.drawString(
            margen + 5, y, "Agradecemos su puntualidad y colaboración.")
        c.showPage()
        c.save()
        return response

    @action(detail=False, methods=['get'], url_path='reporte-agenda-pacientes-csv')
    def reporte_agenda_pacientes_csv(self, request):
        """
        GET /admin-agenda-turnos/reporte-agenda-pacientes-csv/?tipo_especialidad=<especialidad>&fech_inicio=YYYY-MM-DD&fech_fin=YYYY-MM-DD
        """
        id_eni_user = getattr(request.user, 'id', None)
        # id_eni_user = 2
        tipo_especialidad = request.query_params.get("tipo_especialidad")
        fecha_min_str = request.query_params.get("fech_inicio")
        fecha_max_str = request.query_params.get("fech_fin")

        faltantes = []
        if not fecha_min_str or not fecha_max_str:
            faltantes.append('fech_inicio/fech_fin')
        if not tipo_especialidad:
            faltantes.append('tipo_especialidad')
        if faltantes:
            return Response(
                {"error": f"Faltan parámetros requeridos: {', '.join(faltantes)}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_data = eniUser.objects.get(
                id=id_eni_user)
            # Asumiendo que hay una relación con unidades_salud
            unidades_salud = user_data.unidades_salud.all()
            unidad_str = f"{unidades_salud[0].uni_unic} {unidades_salud[0].uni_unid}" if unidades_salud else ""

            unidad_salud = unidad_str.strip()
        except eniUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            start_date = datetime.strptime(fecha_min_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(fecha_max_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if start_date > end_date:
            return Response(
                {"error": "Fecha de inicio no puede ser mayor que fecha de fin."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if (end_date - start_date).days > 31:
            return Response(
                {"error": "Solo puede descargar un rango máximo de un mes (31 días)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            data_path = os.path.join(os.path.dirname(
                __file__), 'data', 'all.list.datos.json')
            with open(data_path, 'r', encoding='utf-8') as f:
                data_json = json.load(f)
                ESTADOS_CITA = {str(list(d.keys())[0]): list(d.values())[
                    0] for d in data_json.get('estados_citas', [])}
                UNIDAD_SALUD = {str(list(d.keys())[0]): list(d.values())[
                    0] for d in data_json.get('unidad_salud', [])}
                TIPO_SERVICIO = {str(list(d.keys())[0]): list(d.values())[
                    0] for d in data_json.get('tipo_servicio', [])}
        except Exception as e:
            return Response(
                {"error": f"Error cargando catálogos: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        FIELDS = [
            "adm_agen_turn_fech", "adm_agen_turn_unid_salu", "adm_agen_turn_tipo_espe", "adm_agen_turn_prof_cita",
            "adm_agen_turn_dura_cita", "adm_agen_turn_hora_inic", "adm_agen_turn_hora_fin", "adm_agen_turn_tipo_iden_paci",
            "adm_agen_turn_nume_iden_paci", "adm_agen_turn_apel_nomb_paci", "adm_agen_turn_tele_paci",
            "adm_agen_turn_corr_paci", "adm_agen_turn_dire_paci", "adm_agen_turn_unid_salu_resp_segu_aten_paci",
            "adm_agen_turn_obse_paci", "adm_agen_turn_esta_cita", "adm_agen_turn_rese_unic_salu", "adm_agen_turn_cons_tipo_serv", "eniUser"
        ]
        HEADERS = [
            "FECHA DE TURNO", "NOMBRE DEL ESTABLECIMIENTO DE SALUD", "TIPO DE ESPECIALIDAD", "PROFESIONAL DE LA CITA",
            "DURACIÓN DE LA CITA (MINUTOS)", "HORA DE INICIO", "HORA DE FIN", "TIPO DE DOCUMENTO", "NUMERO DE DOCUMENTO",
            "APELLIDOS Y NOMBRES", "TELEFONO", "CORREO ELECTRÓNICO", "DIRECCIÓN",
            "UNIDAD DE SALUD RESPONSABLE SEGUIMIENTO ATENCIÓN PACIENTE", "OBSERVACIONES PARA EL PACIENTE",
            "ESTADO DE LA CITA", "UNIDAD DE SALUD DE RESERVA PARA LA CITA", "TIPO DE SERVICIO", "ADMISIONISTA"
        ]

        fecha_field_name = "adm_agen_turn_fech"
        try:
            field = admin_agenda_turnos._meta.get_field(fecha_field_name)
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

        base_qs = (
            admin_agenda_turnos.objects
            .filter(**{f"{fecha_field_name}__range": (start_filter, end_filter)},
                    adm_agen_turn_unid_salu=unidad_salud,
                    adm_agen_turn_tipo_espe=tipo_especialidad,
                    adm_agen_turn_esta_cita__in=[3, 4, 5])
            .order_by(fecha_field_name)
        )

        if not base_qs.exists():
            return Response(
                {"error": "No se puede generar el reporte porque no existen datos para los filtros seleccionados."},
                status=status.HTTP_404_NOT_FOUND
            )

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
            writer = csv.writer(Echo(), delimiter=';')
            yield "\ufeff"
            yield writer.writerow(HEADERS)
            for row in base_qs.values(*FIELDS).iterator(chunk_size=5000):
                fila = []
                for field in FIELDS:
                    val = row.get(field)
                    if field == "adm_agen_turn_esta_cita":
                        val = ESTADOS_CITA.get(str(val), val)
                    elif field == "adm_agen_turn_rese_unic_salu":
                        val = UNIDAD_SALUD.get(str(val), val)
                    elif field == "adm_agen_turn_cons_tipo_serv":
                        val = TIPO_SERVICIO.get(str(val), val)
                    elif field == "eniUser":
                        try:
                            user = eniUser.objects.get(pk=val)
                            val = f"{user.username} - {user.last_name} {user.first_name}"
                        except eniUser.DoesNotExist:
                            val = ""
                    else:
                        val = serialize_value(val)
                    fila.append(val)
                yield writer.writerow(fila)

        filename = f'reporte_agenda_{start_date.strftime("%Y%m%d")}_{end_date.strftime("%Y%m%d")}.csv'
        response = StreamingHttpResponse(
            row_iter(), content_type="text/csv; charset=utf-8"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'
        response["X-Accel-Buffering"] = "no"
        return response


class ContactoAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    SOPORTE_EMAIL = "soporte.tics@07d05.mspz7.gob.ec"

    def post(self, request):
        nombre = (request.data.get("nombre") or "").strip()
        email = (request.data.get("email") or "").strip()
        asunto = (request.data.get("asunto") or "").strip()
        mensaje = (request.data.get("mensaje") or "").strip()

        # Validaciones básicas
        faltantes = [campo for campo, val in [
            ("nombre", nombre),
            ("email", email),
            ("asunto", asunto),
            ("mensaje", mensaje)
        ] if not val]

        if faltantes:
            return Response(
                {"error": f"Los campos {', '.join(faltantes)} son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(mensaje) < 10:
            return Response(
                {"error": "El mensaje debe contener al menos 10 caracteres."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Asunto final (agrega prefijo identificable)
        subject = f"[CONTACTO SIRA-07D05] {asunto[:120]}"

        text_content = (
            f"Mensaje de contacto SIRA-07D05\n\n"
            f"Nombre: {nombre}\n"
            f"Correo: {email}\n"
            f"Asunto: {asunto}\n\n"
            f"Mensaje:\n{mensaje}\n"
        )

        html_content = f"""
        <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div style="background:#0d47a1; color:#fff; padding:16px 20px;">
                <h2 style="margin:0; font-size:18px;">Contacto SIRA-07D05</h2>
            </div>
            <div style="padding:20px; background:#fafafa;">
                <p style="margin:0 0 10px;"><strong>Nombre:</strong> {nombre}</p>
                <p style="margin:0 0 10px;"><strong>Correo:</strong> {email}</p>
                <p style="margin:0 0 10px;"><strong>Asunto:</strong> {asunto}</p>
                <hr style="border:none; border-top:1px solid #ddd; margin:18px 0;">
                <p style="white-space:pre-line; line-height:1.4; margin:0; font-size:14px;">{mensaje}</p>
            </div>
            <div style="background:#f1f5f9; padding:10px 16px; font-size:12px; color:#555;">
                <em>Este mensaje fue generado desde el formulario público de contacto.</em>
            </div>
        </div>
        """

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=getattr(
                    settings, "DEFAULT_FROM_EMAIL", self.SOPORTE_EMAIL),
                to=[self.SOPORTE_EMAIL],
                reply_to=[email] if email else None
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        except Exception as e:
            return Response(
                {"error": f"No se pudo enviar el mensaje. Intente más tarde. Detalle: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "Mensaje enviado correctamente. Pronto será contactado."},
            status=status.HTTP_201_CREATED
        )


class DashboardAPIView(viewsets.ViewSet):
    def list(self, request):
        can_descri = request.GET.get('can_descri')
        uni_codigo = request.GET.get('uni_codigo')
        df = pd.read_csv('eni/data/poblacion.csv', encoding='latin1', sep=';')
        if can_descri:
            df = df[df['can_descri'] == can_descri]
        if uni_codigo:
            df = df[df['uni_codigo'] == uni_codigo]

        grupos = {
            '0_edad': ['edad_0'],
            '1_A_4': ['edad_1', 'edad_2', 'edad_3', 'edad_4'],
            '5_A_9': ['edad_5', 'edad_6', 'edad_7', 'edad_8', 'edad_9'],
            '10_A_14': ['edad_10', 'edad_11', 'edad_12', 'edad_13', 'edad_14'],
            '15_A_19': ['edad_15', 'edad_16', 'edad_17', 'edad_18', 'edad_19'],
            '20_A_24': ['edad_20', 'edad_21', 'edad_22', 'edad_23', 'edad_24'],
            '25_A_29': ['edad_25', 'edad_26', 'edad_27', 'edad_28', 'edad_29'],
            '30_A_34': ['edad_30', 'edad_31', 'edad_32', 'edad_33', 'edad_34'],
            '35_A_39': ['edad_35', 'edad_36', 'edad_37', 'edad_38', 'edad_39'],
            '40_A_44': ['edad_40', 'edad_41', 'edad_42', 'edad_43', 'edad_44'],
            '45_A_49': ['edad_45', 'edad_46', 'edad_47', 'edad_48', 'edad_49'],
            '50_A_54': ['edad_50', 'edad_51', 'edad_52', 'edad_53', 'edad_54'],
            '55_A_59': ['edad_55', 'edad_56', 'edad_57', 'edad_58', 'edad_59'],
            '60_A_64': ['edad_60', 'edad_61', 'edad_62', 'edad_63', 'edad_64'],
            '65_A_69': ['edad_65', 'edad_66', 'edad_67', 'edad_68', 'edad_69'],
            '70_A_74': ['edad_70', 'edad_71', 'edad_72', 'edad_73', 'edad_74'],
            '75_A_79': ['edad_75', 'edad_76', 'edad_77', 'edad_78', 'edad_79'],
            '80_A_MAS': [
                'edad_80', 'edad_81', 'edad_82', 'edad_83', 'edad_84', 'edad_85', 'edad_86', 'edad_87', 'edad_88', 'edad_89',
                'edad_90', 'edad_91', 'edad_92', 'edad_93', 'edad_94', 'edad_95', 'edad_96', 'edad_97', 'edad_98', 'edad_99', 'edad_100'
            ]
        }

        # Agrupar por uni_codigo y sexo
        resultado = []
        for (unidad, unidad_nombre, canton, parroquia, sexo, latitud), grupo_df in df.groupby(['uni_codigo', 'uni_nombre', 'can_descri', 'parr_descr', 'sexo', 'latitud']):
            grupo_data = {
                'uni_codigo': unidad,
                'uni_nombre': unidad_nombre,
                'can_descri': canton,
                'parr_descr': parroquia,
                'sexo': sexo,
                'latitud': latitud
            }
            for nombre_grupo, columnas in grupos.items():
                grupo_data[nombre_grupo] = int(grupo_df[columnas].sum().sum())
            resultado.append(grupo_data)

        return Response(resultado)

    @action(detail=False, methods=['get'], url_path='emergencia-produccion-mes')
    def get_emergencia_produccion_mes(self, request):
        unic = request.GET.get('unic')
        fech_aten = request.GET.get('fech_aten')

        df = pd.read_csv('eni/data/emergencia_07ot05_2026.csv',
                         encoding='latin1', sep=';')
        if unic:
            df = df[df['unic'] == unic]
        if fech_aten:
            df = df[df['fech_aten'] == fech_aten]

        # Convertir fech_aten a datetime y extraer el mes
        df['fech_aten'] = pd.to_datetime(
            df['fech_aten'], format='%d/%m/%Y', errors='coerce')
        df['mes'] = df['fech_aten'].dt.month

        # Agrupar por unic y mes, y contar registros
        conteo = df.groupby(['unic', 'nomb_esta_salu', 'mes']
                            ).size().reset_index(name='total')

        resultado = []
        for _, row in conteo.iterrows():
            resultado.append({
                'unic': row['unic'],
                'nomb_esta_salu': row['nomb_esta_salu'],
                'mes': int(row['mes']) if not pd.isnull(row['mes']) else None,
                'total': int(row['total'])
            })

        return Response(resultado)

    @action(detail=False, methods=['get'], url_path='emergencia-produccion-cie10')
    def get_emergencia_produccion_cie10(self, request):
        unic = request.GET.get('unic')
        fech_aten = request.GET.get('fech_aten')

        df = pd.read_csv('eni/data/emergencia_07ot05_2026.csv',
                         encoding='latin1', sep=';', dtype={'unic': str})

        df['unic'] = df['unic'].astype(str).str.zfill(6)

        if unic:
            df = df[df['unic'] == str(unic).zfill(6)]

        # Convertir fecha y extraer mes
        df['fech_aten'] = pd.to_datetime(
            df['fech_aten'], dayfirst=True, errors='coerce')
        df = df.dropna(subset=['fech_aten'])
        df['mes'] = df['fech_aten'].dt.month

        if fech_aten:
            mes_buscado = int(fech_aten)
            df = df[df['mes'] == mes_buscado]

        meses_es = {
            1: 'ENERO',
            2: 'FEBRERO',
            3: 'MARZO',
            4: 'ABRIL',
            5: 'MAYO',
            6: 'JUNIO',
            7: 'JULIO',
            8: 'AGOSTO',
            9: 'SEPTIEMBRE',
            10: 'OCTUBRE',
            11: 'NOVIEMBRE',
            12: 'DICIEMBRE',
        }

        # Normalizar sexo
        def norm_sexo(s):
            s = str(s).strip().upper()
            if s in ['HOMBRE']:
                return 'HOMBRE'
            elif s in ['MUJER']:
                return 'MUJER'
            elif s in ['INTERSEXUAL']:
                return 'INTERSEXUAL'
            return 'SIN DATO'

        df['sexo'] = df['sexo'].apply(norm_sexo)

        # Si quieres filtrar por una fecha exacta, se mantiene ese filtro
        if fech_aten:
            fecha_busqueda = pd.to_datetime(
                fech_aten, dayfirst=True, errors='coerce')
            if pd.notna(fecha_busqueda):
                df = df[df['fech_aten'].dt.date == fecha_busqueda.date()]

        # Consolidado general top 10
        pivot_total = pd.pivot_table(
            df,
            index=['cie_10_prin', 'diga_prin'],
            columns='sexo',
            values='unic',
            aggfunc='count',
            fill_value=0
        )

        for col in ['HOMBRE', 'MUJER', 'INTERSEXUAL']:
            if col not in pivot_total.columns:
                pivot_total[col] = 0

        pivot_total['TOTAL'] = pivot_total['HOMBRE'] + \
            pivot_total['MUJER'] + pivot_total['INTERSEXUAL']
        pivot_total = pivot_total.sort_values('TOTAL', ascending=False)

        total_general = pivot_total['TOTAL'].sum()
        top10 = pivot_total.head(10).copy()
        otros = pivot_total.iloc[10:].sum()

        consolidado_10 = []
        for idx, ((cie10, diga_prin), row) in enumerate(top10.iterrows(), 1):
            porcentaje = (row['TOTAL'] / total_general *
                          100) if total_general > 0 else 0
            consolidado_10.append({
                'N': idx,
                'CIE-10': cie10,
                'DIAGNOSTICO_PRINCIPAL': diga_prin,
                'HOMBRE': int(row['HOMBRE']),
                'INTERSEXUAL': int(row['INTERSEXUAL']),
                'MUJER': int(row['MUJER']),
                'TOTAL': int(row['TOTAL']),
                '%': f"{porcentaje:.1f}%"
            })

        if total_general > 0 and otros.get('TOTAL', 0) > 0:
            porcentaje_otros = (otros['TOTAL'] / total_general) * 100
            consolidado_10.append({
                'N': '',
                'CIE-10': 'OTROS DIAGNOSTICO',
                'DIAGNOSTICO_PRINCIPAL': '',
                'HOMBRE': int(otros['HOMBRE']),
                'INTERSEXUAL': int(otros['INTERSEXUAL']),
                'MUJER': int(otros['MUJER']),
                'TOTAL': int(otros['TOTAL']),
                '%': f"{porcentaje_otros:.1f}%"
            })

        # Tablas por mes
        tablas_por_mes = []
        for mes_num in sorted(df['mes'].dropna().unique()):
            df_mes = df[df['mes'] == mes_num]

            pivot_mes = pd.pivot_table(
                df_mes,
                index=['cie_10_prin', 'diga_prin'],
                columns='sexo',
                values='unic',
                aggfunc='count',
                fill_value=0
            )

            for col in ['HOMBRE', 'MUJER', 'INTERSEXUAL']:
                if col not in pivot_mes.columns:
                    pivot_mes[col] = 0

            pivot_mes['TOTAL'] = pivot_mes['HOMBRE'] + \
                pivot_mes['MUJER'] + pivot_mes['INTERSEXUAL']
            pivot_mes = pivot_mes.sort_values('TOTAL', ascending=False)

            total_mes = pivot_mes['TOTAL'].sum()
            top10_mes = pivot_mes.head(10).copy()

            resultados_mes = []
            for idx, ((cie10, diga_prin), row) in enumerate(top10_mes.iterrows(), 1):
                porcentaje = (row['TOTAL'] / total_mes *
                              100) if total_mes > 0 else 0
                resultados_mes.append({
                    'N': idx,
                    'CIE-10': cie10,
                    'DIAGNOSTICO_PRINCIPAL': diga_prin,
                    'HOMBRE': int(row['HOMBRE']),
                    'INTERSEXUAL': int(row['INTERSEXUAL']),
                    'MUJER': int(row['MUJER']),
                    'TOTAL': int(row['TOTAL']),
                    '%': f"{porcentaje:.1f}%"
                })

            tablas_por_mes.append({
                'mes': int(mes_num),
                'mes_nombre': meses_es.get(int(mes_num), ''),
                'results': resultados_mes
            })

        return Response(
            {
                'unic': unic,
                'fech_aten': fech_aten,
                'tablas_por_mes': tablas_por_mes,
                'consolidado_10': consolidado_10
            },
            status=status.HTTP_200_OK
        )
