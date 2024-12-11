from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from .models import eniUser, unidad_salud, temprano, tardio, desperdicio, admision_datos, registro_vacunado
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, EniUserRegistrationSerializer, UnidadSaludRegistrationSerializer, TempranoRegistrationSerializer, TardioRegistrationSerializer, DesperdicioRegistrationSerializer, AdmisionDatosRegistrationSerializer, RegistroVacunadoRegistrationSerializer

from django.db.models import F, Sum
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
from django.http import HttpResponse
import csv
from rest_framework.decorators import action
from datetime import datetime


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


class EniUserRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = EniUserRegistrationSerializer
    queryset = eniUser.objects.prefetch_related('unidades_salud').all()
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
            uni_unic = [
                unidad.uni_unic for unidad in unidades_salud] if unidades_salud else []
            data = {
                "last_name": user_data.last_name,
                "first_name": user_data.first_name,
                "fun_sex": user_data.fun_sex,
                "email": user_data.email,
                "fun_titu": user_data.fun_titu,
                "password": user_data.password,
                "fun_admi_rol": user_data.fun_admi_rol,
                "fun_esta": user_data.fun_esta,
                "uni_unic": uni_unic,
            }
            return Response({"message": "El usuario está registrado en el sistema!", "data": data}, status=status.HTTP_200_OK)
        except eniUser.DoesNotExist:
            pass

        # Segunda búsqueda en admision_datos
        try:
            user_data = admision_datos.objects.get(
                adm_dato_pers_tipo_iden=tipo, adm_dato_pers_nume_iden=identificacion
            )
            data = {
                "adm_dato_pers_apel": user_data.adm_dato_pers_apel,
                "adm_dato_pers_nomb": user_data.adm_dato_pers_nomb,
                "adm_dato_pers_sexo": user_data.adm_dato_pers_sexo,
                "adm_dato_pers_corr_elec": user_data.adm_dato_pers_corr_elec,
            }
            return Response({"message": "El usuario está registrado en el sistema!", "data": data}, status=status.HTTP_200_OK)
        except admision_datos.DoesNotExist:
            return Response({"error": "Usuario no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Guardar en admision_datos
        admision_datos.objects.create(
            adm_dato_fech=datetime.now(),
            adm_dato_pers_tipo_iden=request.data.get('fun_tipo_iden'),
            adm_dato_pers_nume_iden=request.data.get('username'),
            adm_dato_pers_apel=request.data.get('last_name'),
            adm_dato_pers_nomb=request.data.get('first_name'),
            adm_dato_pers_sexo=request.data.get('fun_sex'),
            adm_dato_pers_corr_elec=request.data.get('email') or ''
        )

        # Buscar en la matriz y registrar en eni_unidad_salud
        uni_unic_list = request.data.get('uni_unic')
        print("Unic " + str(uni_unic_list))
        if isinstance(uni_unic_list, list) and len(uni_unic_list) > 0:
            for uni_unic_item in uni_unic_list:
                uni_unic = uni_unic_item.get('value')
                unidad_salud_data = self.get_unidad_salud_data(uni_unic)
                # Registro de depuración
                if unidad_salud_data:
                    unidad_salud.objects.create(
                        eniUser=user,
                        uni_zona=unidad_salud_data['uni_zona'],
                        uni_dist=unidad_salud_data['uni_dist'],
                        uni_prov=unidad_salud_data['uni_prov'],
                        uni_cant=unidad_salud_data['uni_cant'],
                        uni_parr=unidad_salud_data['uni_parr'],
                        uni_unic=unidad_salud_data['uni_unic'],
                        uni_unid=unidad_salud_data['uni_unid'],
                        uni_tipo=unidad_salud_data['uni_tipo'],
                        uni_nive=unidad_salud_data['uni_nive'],
                    )

        elif isinstance(uni_unic_list, str):
            uni_unic = uni_unic_list
            unidad_salud_data = self.get_unidad_salud_data(uni_unic)
            if unidad_salud_data:
                unidad_salud.objects.create(
                    eniUser=user,
                    uni_zona=unidad_salud_data['uni_zona'],
                    uni_dist=unidad_salud_data['uni_dist'],
                    uni_prov=unidad_salud_data['uni_prov'],
                    uni_cant=unidad_salud_data['uni_cant'],
                    uni_parr=unidad_salud_data['uni_parr'],
                    uni_unic=unidad_salud_data['uni_unic'],
                    uni_unid=unidad_salud_data['uni_unid'],
                    uni_tipo=unidad_salud_data['uni_tipo'],
                    uni_nive=unidad_salud_data['uni_nive'],
                )

        token = RefreshToken.for_user(user)
        data = serializer.data
        data["tokens"] = {
            "refresh": str(token),
            "access": str(token.access_token)
        }
        return Response({"message": "El usuario fue creado exitosamente!", "data": data}, status=status.HTTP_201_CREATED)

    def get_unidad_salud_data(self, uni_unic):
        matriz = [
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000541", "uni_unid": "SAN VICENTE", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000542", "uni_unid": "SAN ISIDRO URBANO", "uni_tipo": "CENTRO DE SALUD TIPO B", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000543", "uni_unid": "CAÑAS", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "LA CUCA",
                "uni_unic": "000544", "uni_unid": "LA CUCA", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "CARCABON",
                "uni_unic": "000545", "uni_unid": "CARCABON", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "CHACRAS",
                "uni_unic": "000546",	"uni_unid": "CHACRAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "PALMALES",
                "uni_unic": "000547", "uni_unid": "PALMALES", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "PALMALES",
                "uni_unic": "000548", "uni_unid": "MANABI DE EL ORO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "EL PARAISO",
                "uni_unic": "000549", "uni_unid": "EL PARAISO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "LA LIBERTAD",
                "uni_unic": "000550", "uni_unid": "LA LIBERTAD", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS",
                "uni_parr": "LA VICTORIA (URBANO)", "uni_unic": "000551", "uni_unid": "LAS LAJAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "VALLE HERMOSO",
                "uni_unic": "000552", "uni_unid": "VALLE HERMOSO", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "LAS LAJAS", "uni_parr": "SAN ISIDRO",
                "uni_unic": "000553", "uni_unid": "SAN ISIDRO RURAL", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "ECUADOR",
                "uni_unic": "000554", "uni_unid": "18 DE NOVIEMBRE", "uni_tipo": "CENTRO DE SALUD TIPO B", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "MILTON REYES",
                "uni_unic": "000555", "uni_unid": "LA PAZ", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "HUALTACO",
                "uni_unic": "000556", "uni_unid": "HUALTACO", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "000591", "uni_unid": "HOSPITAL BASICO ARENILLAS", "uni_tipo": "HOSPITAL BASICO", "uni_nive": "NIVEL 2"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "000592", "uni_unid": "HOSPITAL BASICO HUAQUILLAS", "uni_tipo": "HOSPITAL BASICO", "uni_nive": "NIVEL 2"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "002763", "uni_unid": "EL JOBO SAN VICENTE", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05",	"uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "002879", "uni_unid": "CENTRO DE SALUD DE HUAQUILLAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "ARENILLAS", "uni_parr": "ARENILLAS",
                "uni_unic": "002900", "uni_unid": "CENTRO DE SALUD DE ARENILLAS", "uni_tipo": "CENTRO DE SALUD TIPO A", "uni_nive": "NIVEL 1"},
            {"uni_zona": "ZONA 7", "uni_dist": "07D05", "uni_prov": "EL ORO", "uni_cant": "HUAQUILLAS", "uni_parr": "UNION LOJANA",
                "uni_unic": "050748", "uni_unid": "PUESTO DE VIGILANCIA HUAQUILLAS", "uni_tipo": "PUESTO DE SALUD", "uni_nive": "NIVEL 1"},
        ]
        for unidad in matriz:
            if unidad['uni_unic'] == uni_unic:
                return unidad
        return None

    @action(detail=False, methods=['patch'], url_path='actualizar-usuario')
    def update_by_username(self, request):
        username = request.data.get('username')
        if not username:
            return Response({"error": "El parámetro de identificacion es requerido!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = eniUser.objects.get(username=username)
        except eniUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Actualizar unidades de salud
        uni_unic_list = request.data.get('uni_unic')
        if isinstance(uni_unic_list, list) and len(uni_unic_list) > 0:
            user.unidades_salud.clear()  # Limpiar unidades de salud existentes
            for uni_unic_item in uni_unic_list:
                uni_unic = uni_unic_item.get('value')
                unidad_salud_data = self.get_unidad_salud_data(uni_unic)
                if unidad_salud_data:
                    # Verificar si la unidad de salud ya existe
                    unidad_salud_instance, _ = unidad_salud.objects.get_or_create(
                        uni_unic=unidad_salud_data['uni_unic'],
                        defaults={
                            'uni_zona': unidad_salud_data['uni_zona'],
                            'uni_dist': unidad_salud_data['uni_dist'],
                            'uni_prov': unidad_salud_data['uni_prov'],
                            'uni_cant': unidad_salud_data['uni_cant'],
                            'uni_parr': unidad_salud_data['uni_parr'],
                            'uni_unid': unidad_salud_data['uni_unid'],
                            'uni_tipo': unidad_salud_data['uni_tipo'],
                            'uni_nive': unidad_salud_data['uni_nive'],
                        }
                    )
                    # Asociar la unidad de salud existente o nueva con el usuario
                    user.unidades_salud.add(unidad_salud_instance)

        return Response({"message": "El usuario se actualizó exitosamente!", "data": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='eliminar-usuario')
    def delete_by_username(self, request):
        username = request.data.get('username')
        if not username:
            return Response({"error": "El parámetro de identificacion es requerido!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = eniUser.objects.get(username=username)
        except eniUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado!"}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response({"message": "Usuario eliminado exitosamente!"}, status=status.HTTP_204_NO_CONTENT)


class UnidadSaludRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = UnidadSaludRegistrationSerializer
    queryset = unidad_salud.objects.all()
    permission_classes = [permissions.AllowAny]


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
        print(f"Fecha original: {tem_fech}")
        eni_user_id = data.get('eniUser')

        # Crear variables de control
        fech_inicio = tem_fech.replace(day=1)
        fech_fin = (tem_fech.replace(day=1) + timedelta(days=32)
                    ).replace(day=1) - timedelta(days=1)
        print(f"EniUserId: {eni_user_id}")
        print(f"Inicio del mes (fech_inicio): {fech_inicio}")
        print(f"Fin del mes (fech_fin): {fech_fin}")

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
                adm_dato_fech__year=year, adm_dato_fech__month=month)

        return queryset.order_by('adm_dato_fech')

    def create_admision_datos(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

    @action(detail=False, methods=['get'], url_path='buscar-usuario')
    def buscar_usuario(self, request):
        tipo = request.query_params.get('tipo')
        identificacion = request.query_params.get('identificacion')
        if not tipo or not identificacion:
            return Response({"error": "El parámetro identificacion es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_data = admision_datos.objects.get(
                adm_dato_pers_tipo_iden=tipo, adm_dato_pers_nume_iden=identificacion
            )
            data = {
                "adm_dato_pers_apel": user_data.adm_dato_pers_apel,
                "adm_dato_pers_nomb": user_data.adm_dato_pers_nomb,
                "adm_dato_pers_sexo": user_data.adm_dato_pers_sexo,
                "adm_dato_pers_corr_elec": user_data.adm_dato_pers_corr_elec,
            }
            return Response({"message": "El usuario está registrado en el sistema!", "data": data}, status=status.HTTP_200_OK)
        except admision_datos.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)


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

    @ action(detail=False, methods=['get'], url_path='descargar-csv')
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
