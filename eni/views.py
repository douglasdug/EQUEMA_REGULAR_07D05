from django.shortcuts import render
from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, UnidadSaludRegistrationSerializer, TempranoRegistrationSerializer, TardioRegistrationSerializer, DesperdicioRegistrationSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from .models import unidadSalud, temprano, tardio, desperdicio

from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta

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
        user = serializer.validated_data
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
            return Response(status=status.HTTP_400_BAD_REQUEST)


class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user


class UnidadSaludRegistrationAPIView(viewsets.ModelViewSet):
    serializer_class = UnidadSaludRegistrationSerializer
    queryset = unidadSalud.objects.all()
    permission_classes = [permissions.AllowAny]


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

        return queryset.order_by('tem_fech')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)


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

        return queryset.order_by('des_fech')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)


class TempranoCreateView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        tem_fech = parse_date(data.get('tem_fech'))
        eni_user_id = data.get('eniUser')
        tem_tota = data.get('tem_tota', False)
        tem_intr = int(data.get('tem_intr', 0))
        tem_extr_mies_cnh = int(data.get('tem_extr_mies_cnh', 0))
        tem_extr_mies_cibv = int(data.get('tem_extr_mies_cibv', 0))
        tem_extr_mine_egen = int(data.get('tem_extr_mine_egen', 0))
        tem_extr_mine_bach = int(data.get('tem_extr_mine_bach', 0))
        tem_extr_visi = int(data.get('tem_extr_visi', 0))
        tem_extr_aten = int(data.get('tem_extr_aten', 0))
        tem_otro = int(data.get('tem_otro', 0))
        tem_sexo_homb = int(data.get('tem_sexo_homb', 0))
        tem_sexo_muje = int(data.get('tem_sexo_muje', 0))
        tem_luga_pert = int(data.get('tem_luga_pert', 0))
        tem_luga_nope = int(data.get('tem_luga_nope', 0))
        tem_naci_ecua = int(data.get('tem_naci_ecua', 0))
        tem_naci_colo = int(data.get('tem_naci_colo', 0))
        tem_naci_peru = int(data.get('tem_naci_peru', 0))
        tem_naci_cuba = int(data.get('tem_naci_cuba', 0))
        tem_naci_vene = int(data.get('tem_naci_vene', 0))
        tem_naci_otro = int(data.get('tem_naci_otro', 0))
        tem_auto_indi = int(data.get('tem_auto_indi', 0))
        tem_auto_afro = int(data.get('tem_auto_afro', 0))
        tem_auto_negr = int(data.get('tem_auto_negr', 0))
        tem_auto_mula = int(data.get('tem_auto_mula', 0))
        tem_auto_mont = int(data.get('tem_auto_mont', 0))
        tem_auto_mest = int(data.get('tem_auto_mest', 0))
        tem_auto_blan = int(data.get('tem_auto_blan', 0))
        tem_auto_otro = int(data.get('tem_auto_otro', 0))
        tem_naci_achu = int(data.get('tem_naci_achu', 0))
        tem_naci_ando = int(data.get('tem_naci_ando', 0))
        tem_naci_awa = int(data.get('tem_naci_awa', 0))
        tem_naci_chac = int(data.get('tem_naci_chac', 0))
        tem_naci_cofa = int(data.get('tem_naci_cofa', 0))
        tem_naci_eper = int(data.get('tem_naci_eper', 0))
        tem_naci_huan = int(data.get('tem_naci_huan', 0))
        tem_naci_kich = int(data.get('tem_naci_kich', 0))
        tem_naci_mant = int(data.get('tem_naci_mant', 0))
        tem_naci_seco = int(data.get('tem_naci_seco', 0))
        tem_naci_shiw = int(data.get('tem_naci_shiw', 0))
        tem_naci_shua = int(data.get('tem_naci_shua', 0))
        tem_naci_sion = int(data.get('tem_naci_sion', 0))
        tem_naci_tsac = int(data.get('tem_naci_tsac', 0))
        tem_naci_waor = int(data.get('tem_naci_waor', 0))
        tem_naci_zapa = int(data.get('tem_naci_zapa', 0))
        tem_pueb_chib = int(data.get('tem_pueb_chib', 0))
        tem_pueb_kana = int(data.get('tem_pueb_kana', 0))
        tem_pueb_kara = int(data.get('tem_pueb_kara', 0))
        tem_pueb_kaya = int(data.get('tem_pueb_kaya', 0))
        tem_pueb_kich = int(data.get('tem_pueb_kich', 0))
        tem_pueb_kisa = int(data.get('tem_pueb_kisa', 0))
        tem_pueb_kitu = int(data.get('tem_pueb_kitu', 0))
        tem_pueb_nata = int(data.get('tem_pueb_nata', 0))
        tem_pueb_otav = int(data.get('tem_pueb_otav', 0))
        tem_pueb_palt = int(data.get('tem_pueb_palt', 0))
        tem_pueb_panz = int(data.get('tem_pueb_panz', 0))
        tem_pueb_past = int(data.get('tem_pueb_past', 0))
        tem_pueb_puru = int(data.get('tem_pueb_puru', 0))
        tem_pueb_sala = int(data.get('tem_pueb_sala', 0))
        tem_pueb_sara = int(data.get('tem_pueb_sara', 0))
        tem_pueb_toma = int(data.get('tem_pueb_toma', 0))
        tem_pueb_wara = int(data.get('tem_pueb_wara', 0))
        tem_men1_dosi_bcgp = int(data.get('tem_men1_dosi_bcgp', 0))
        tem_men1_dosi_hbpr = int(data.get('tem_men1_dosi_hbpr', 0))
        tem_men1_dosi_bcgd = int(data.get('tem_men1_dosi_bcgd', 0))
        tem_men1_1rad_rota = int(data.get('tem_men1_1rad_rota', 0))
        tem_men1_1rad_fipv = int(data.get('tem_men1_1rad_fipv', 0))
        tem_men1_1rad_neum = int(data.get('tem_men1_1rad_neum', 0))
        tem_men1_1rad_pent = int(data.get('tem_men1_1rad_pent', 0))
        tem_men1_2dad_rota = int(data.get('tem_men1_2dad_rota', 0))
        tem_men1_2dad_fipv = int(data.get('tem_men1_2dad_fipv', 0))
        tem_men1_2dad_neum = int(data.get('tem_men1_2dad_neum', 0))
        tem_men1_2dad_pent = int(data.get('tem_men1_2dad_pent', 0))
        tem_men1_3rad_bopv = int(data.get('tem_men1_3rad_bopv', 0))
        tem_men1_3rad_neum = int(data.get('tem_men1_3rad_neum', 0))
        tem_men1_3rad_pent = int(data.get('tem_men1_3rad_pent', 0))
        tem_12a23m_1rad_srp = int(data.get('tem_12a23m_1rad_srp', 0))
        tem_12a23m_dosi_fa = int(data.get('tem_12a23m_dosi_fa', 0))
        tem_12a23m_dosi_vari = int(data.get('tem_12a23m_dosi_vari', 0))
        tem_12a23m_2dad_srp = int(data.get('tem_12a23m_2dad_srp', 0))
        tem_12a23m_4tad_bopv = int(data.get('tem_12a23m_4tad_bopv', 0))
        tem_12a23m_4tad_dpt = int(data.get('tem_12a23m_4tad_dpt', 0))
        tem_5ano_5tad_bopv = int(data.get('tem_5ano_5tad_bopv', 0))
        tem_5ano_5tad_dpt = int(data.get('tem_5ano_5tad_dpt', 0))
        tem_9ano_1rad_hpv = int(data.get('tem_9ano_1rad_hpv', 0))
        tem_9ano_2dad_hpv = int(data.get('tem_9ano_2dad_hpv', 0))
        tem_10an_2dad_hpv = int(data.get('tem_10an_2dad_hpv', 0))
        tem_15an_terc_dtad = int(data.get('tem_15an_terc_dtad', 0))

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

        # Verificar si la fecha ya existe para el usuario cuando tem_tota es False
        if not tem_tota and temprano.objects.filter(eniUser_id=eni_user_id, tem_fech=tem_fech, tem_tota=False).exists():
            return Response(
                {"error": "La fecha ya ha sido registrada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear variables de control
        tem_fech_inicio = tem_fech.replace(day=1)
        tem_fech_fin = (tem_fech.replace(day=1) +
                        timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Guardar la información enviada en el método POST Temprano
        temprano.objects.create(
            tem_fech=tem_fech,
            tem_intr=tem_intr,
            tem_extr_mies_cnh=tem_extr_mies_cnh,
            tem_extr_mies_cibv=tem_extr_mies_cibv,
            tem_extr_mine_egen=tem_extr_mine_egen,
            tem_extr_mine_bach=tem_extr_mine_bach,
            tem_extr_visi=tem_extr_visi,
            tem_extr_aten=tem_extr_aten,
            tem_otro=tem_otro,
            tem_sexo_homb=tem_sexo_homb,
            tem_sexo_muje=tem_sexo_muje,
            tem_luga_pert=tem_luga_pert,
            tem_luga_nope=tem_luga_nope,
            tem_naci_ecua=tem_naci_ecua,
            tem_naci_colo=tem_naci_colo,
            tem_naci_peru=tem_naci_peru,
            tem_naci_cuba=tem_naci_cuba,
            tem_naci_vene=tem_naci_vene,
            tem_naci_otro=tem_naci_otro,
            tem_auto_indi=tem_auto_indi,
            tem_auto_afro=tem_auto_afro,
            tem_auto_negr=tem_auto_negr,
            tem_auto_mula=tem_auto_mula,
            tem_auto_mont=tem_auto_mont,
            tem_auto_mest=tem_auto_mest,
            tem_auto_blan=tem_auto_blan,
            tem_auto_otro=tem_auto_otro,
            tem_naci_achu=tem_naci_achu,
            tem_naci_ando=tem_naci_ando,
            tem_naci_awa=tem_naci_awa,
            tem_naci_chac=tem_naci_chac,
            tem_naci_cofa=tem_naci_cofa,
            tem_naci_eper=tem_naci_eper,
            tem_naci_huan=tem_naci_huan,
            tem_naci_kich=tem_naci_kich,
            tem_naci_mant=tem_naci_mant,
            tem_naci_seco=tem_naci_seco,
            tem_naci_shiw=tem_naci_shiw,
            tem_naci_shua=tem_naci_shua,
            tem_naci_sion=tem_naci_sion,
            tem_naci_tsac=tem_naci_tsac,
            tem_naci_waor=tem_naci_waor,
            tem_naci_zapa=tem_naci_zapa,
            tem_pueb_chib=tem_pueb_chib,
            tem_pueb_kana=tem_pueb_kana,
            tem_pueb_kara=tem_pueb_kara,
            tem_pueb_kaya=tem_pueb_kaya,
            tem_pueb_kich=tem_pueb_kich,
            tem_pueb_kisa=tem_pueb_kisa,
            tem_pueb_kitu=tem_pueb_kitu,
            tem_pueb_nata=tem_pueb_nata,
            tem_pueb_otav=tem_pueb_otav,
            tem_pueb_palt=tem_pueb_palt,
            tem_pueb_panz=tem_pueb_panz,
            tem_pueb_past=tem_pueb_past,
            tem_pueb_puru=tem_pueb_puru,
            tem_pueb_sala=tem_pueb_sala,
            tem_pueb_sara=tem_pueb_sara,
            tem_pueb_toma=tem_pueb_toma,
            tem_pueb_wara=tem_pueb_wara,
            tem_men1_dosi_bcgp=tem_men1_dosi_bcgp,
            tem_men1_dosi_hbpr=tem_men1_dosi_hbpr,
            tem_men1_dosi_bcgd=tem_men1_dosi_bcgd,
            tem_men1_1rad_rota=tem_men1_1rad_rota,
            tem_men1_1rad_fipv=tem_men1_1rad_fipv,
            tem_men1_1rad_neum=tem_men1_1rad_neum,
            tem_men1_1rad_pent=tem_men1_1rad_pent,
            tem_men1_2dad_rota=tem_men1_2dad_rota,
            tem_men1_2dad_fipv=tem_men1_2dad_fipv,
            tem_men1_2dad_neum=tem_men1_2dad_neum,
            tem_men1_2dad_pent=tem_men1_2dad_pent,
            tem_men1_3rad_bopv=tem_men1_3rad_bopv,
            tem_men1_3rad_neum=tem_men1_3rad_neum,
            tem_men1_3rad_pent=tem_men1_3rad_pent,
            tem_12a23m_1rad_srp=tem_12a23m_1rad_srp,
            tem_12a23m_dosi_fa=tem_12a23m_dosi_fa,
            tem_12a23m_dosi_vari=tem_12a23m_dosi_vari,
            tem_12a23m_2dad_srp=tem_12a23m_2dad_srp,
            tem_12a23m_4tad_bopv=tem_12a23m_4tad_bopv,
            tem_12a23m_4tad_dpt=tem_12a23m_4tad_dpt,
            tem_5ano_5tad_bopv=tem_5ano_5tad_bopv,
            tem_5ano_5tad_dpt=tem_5ano_5tad_dpt,
            tem_9ano_1rad_hpv=tem_9ano_1rad_hpv,
            tem_9ano_2dad_hpv=tem_9ano_2dad_hpv,
            tem_10an_2dad_hpv=tem_10an_2dad_hpv,
            tem_15an_terc_dtad=tem_15an_terc_dtad,
            tem_tota=tem_tota,
            eniUser_id=eni_user_id
        )

        # Filtrar y sumar columnas Temprano
        sum_data = temprano.objects.filter(
            eniUser_id=eni_user_id,
            tem_tota=False,
            tem_fech__range=(tem_fech_inicio, tem_fech_fin)
        ).aggregate(
            total_tem_intr=Sum('tem_intr'),
            total_tem_extr_mies_cnh=Sum('tem_extr_mies_cnh'),
            total_tem_extr_mies_cibv=Sum('tem_extr_mies_cibv'),
            total_tem_extr_mine_egen=Sum('tem_extr_mine_egen'),
            total_tem_extr_mine_bach=Sum('tem_extr_mine_bach'),
            total_tem_extr_visi=Sum('tem_extr_visi'),
            total_tem_extr_aten=Sum('tem_extr_aten'),
            total_tem_otro=Sum('tem_otro'),
            total_tem_sexo_homb=Sum('tem_sexo_homb'),
            total_tem_sexo_muje=Sum('tem_sexo_muje'),
            total_tem_luga_pert=Sum('tem_luga_pert'),
            total_tem_luga_nope=Sum('tem_luga_nope'),
            total_tem_naci_ecua=Sum('tem_naci_ecua'),
            total_tem_naci_colo=Sum('tem_naci_colo'),
            total_tem_naci_peru=Sum('tem_naci_peru'),
            total_tem_naci_cuba=Sum('tem_naci_cuba'),
            total_tem_naci_vene=Sum('tem_naci_vene'),
            total_tem_naci_otro=Sum('tem_naci_otro'),
            total_tem_auto_indi=Sum('tem_auto_indi'),
            total_tem_auto_afro=Sum('tem_auto_afro'),
            total_tem_auto_negr=Sum('tem_auto_negr'),
            total_tem_auto_mula=Sum('tem_auto_mula'),
            total_tem_auto_mont=Sum('tem_auto_mont'),
            total_tem_auto_mest=Sum('tem_auto_mest'),
            total_tem_auto_blan=Sum('tem_auto_blan'),
            total_tem_auto_otro=Sum('tem_auto_otro'),
            total_tem_naci_achu=Sum('tem_naci_achu'),
            total_tem_naci_ando=Sum('tem_naci_ando'),
            total_tem_naci_awa=Sum('tem_naci_awa'),
            total_tem_naci_chac=Sum('tem_naci_chac'),
            total_tem_naci_cofa=Sum('tem_naci_cofa'),
            total_tem_naci_eper=Sum('tem_naci_eper'),
            total_tem_naci_huan=Sum('tem_naci_huan'),
            total_tem_naci_kich=Sum('tem_naci_kich'),
            total_tem_naci_mant=Sum('tem_naci_mant'),
            total_tem_naci_seco=Sum('tem_naci_seco'),
            total_tem_naci_shiw=Sum('tem_naci_shiw'),
            total_tem_naci_shua=Sum('tem_naci_shua'),
            total_tem_naci_sion=Sum('tem_naci_sion'),
            total_tem_naci_tsac=Sum('tem_naci_tsac'),
            total_tem_naci_waor=Sum('tem_naci_waor'),
            total_tem_naci_zapa=Sum('tem_naci_zapa'),
            total_tem_pueb_chib=Sum('tem_pueb_chib'),
            total_tem_pueb_kana=Sum('tem_pueb_kana'),
            total_tem_pueb_kara=Sum('tem_pueb_kara'),
            total_tem_pueb_kaya=Sum('tem_pueb_kaya'),
            total_tem_pueb_kich=Sum('tem_pueb_kich'),
            total_tem_pueb_kisa=Sum('tem_pueb_kisa'),
            total_tem_pueb_kitu=Sum('tem_pueb_kitu'),
            total_tem_pueb_nata=Sum('tem_pueb_nata'),
            total_tem_pueb_otav=Sum('tem_pueb_otav'),
            total_tem_pueb_palt=Sum('tem_pueb_palt'),
            total_tem_pueb_panz=Sum('tem_pueb_panz'),
            total_tem_pueb_past=Sum('tem_pueb_past'),
            total_tem_pueb_puru=Sum('tem_pueb_puru'),
            total_tem_pueb_sala=Sum('tem_pueb_sala'),
            total_tem_pueb_sara=Sum('tem_pueb_sara'),
            total_tem_pueb_toma=Sum('tem_pueb_toma'),
            total_tem_pueb_wara=Sum('tem_pueb_wara'),
            total_tem_men1_dosi_bcgp=Sum('tem_men1_dosi_bcgp'),
            total_tem_men1_dosi_hbpr=Sum('tem_men1_dosi_hbpr'),
            total_tem_men1_dosi_bcgd=Sum('tem_men1_dosi_bcgd')
        )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(tem_fech_inicio, tem_fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Temprano
        existing_record = temprano.objects.filter(
            eniUser_id=eni_user_id,
            tem_fech__range=(tem_fech_inicio, tem_fech_fin),
            tem_tota=True
        ).first()

        # Temprano
        if existing_record:
            existing_record.tem_intr = sum_data['total_tem_intr']
            existing_record.tem_extr_mies_cnh = sum_data['total_tem_extr_mies_cnh']
            existing_record.tem_extr_mies_cibv = sum_data['total_tem_extr_mies_cibv']
            existing_record.tem_extr_mine_egen = sum_data['total_tem_extr_mine_egen']
            existing_record.tem_extr_mine_bach = sum_data['total_tem_extr_mine_bach']
            existing_record.tem_extr_visi = sum_data['total_tem_extr_visi']
            existing_record.tem_extr_aten = sum_data['total_tem_extr_aten']
            existing_record.tem_otro = sum_data['total_tem_otro']
            existing_record.tem_sexo_homb = sum_data['total_tem_sexo_homb']
            existing_record.tem_sexo_muje = sum_data['total_tem_sexo_muje']
            existing_record.tem_luga_pert = sum_data['total_tem_luga_pert']
            existing_record.tem_luga_nope = sum_data['total_tem_luga_nope']
            existing_record.tem_naci_ecua = sum_data['total_tem_naci_ecua']
            existing_record.tem_naci_colo = sum_data['total_tem_naci_colo']
            existing_record.tem_naci_peru = sum_data['total_tem_naci_peru']
            existing_record.tem_naci_cuba = sum_data['total_tem_naci_cuba']
            existing_record.tem_naci_vene = sum_data['total_tem_naci_vene']
            existing_record.tem_naci_otro = sum_data['total_tem_naci_otro']
            existing_record.tem_auto_indi = sum_data['total_tem_auto_indi']
            existing_record.tem_auto_afro = sum_data['total_tem_auto_afro']
            existing_record.tem_auto_negr = sum_data['total_tem_auto_negr']
            existing_record.tem_auto_mula = sum_data['total_tem_auto_mula']
            existing_record.tem_auto_mont = sum_data['total_tem_auto_mont']
            existing_record.tem_auto_mest = sum_data['total_tem_auto_mest']
            existing_record.tem_auto_blan = sum_data['total_tem_auto_blan']
            existing_record.tem_auto_otro = sum_data['total_tem_auto_otro']
            existing_record.tem_naci_achu = sum_data['total_tem_naci_achu']
            existing_record.tem_naci_ando = sum_data['total_tem_naci_ando']
            existing_record.tem_naci_awa = sum_data['total_tem_naci_awa']
            existing_record.tem_naci_chac = sum_data['total_tem_naci_chac']
            existing_record.tem_naci_cofa = sum_data['total_tem_naci_cofa']
            existing_record.tem_naci_eper = sum_data['total_tem_naci_eper']
            existing_record.tem_naci_huan = sum_data['total_tem_naci_huan']
            existing_record.tem_naci_kich = sum_data['total_tem_naci_kich']
            existing_record.tem_naci_mant = sum_data['total_tem_naci_mant']
            existing_record.tem_naci_seco = sum_data['total_tem_naci_seco']
            existing_record.tem_naci_shiw = sum_data['total_tem_naci_shiw']
            existing_record.tem_naci_shua = sum_data['total_tem_naci_shua']
            existing_record.tem_naci_sion = sum_data['total_tem_naci_sion']
            existing_record.tem_naci_tsac = sum_data['total_tem_naci_tsac']
            existing_record.tem_naci_waor = sum_data['total_tem_naci_waor']
            existing_record.tem_naci_zapa = sum_data['total_tem_naci_zapa']
            existing_record.tem_pueb_chib = sum_data['total_tem_pueb_chib']
            existing_record.tem_pueb_kana = sum_data['total_tem_pueb_kana']
            existing_record.tem_pueb_kara = sum_data['total_tem_pueb_kara']
            existing_record.tem_pueb_kaya = sum_data['total_tem_pueb_kaya']
            existing_record.tem_pueb_kich = sum_data['total_tem_pueb_kich']
            existing_record.tem_pueb_kisa = sum_data['total_tem_pueb_kisa']
            existing_record.tem_pueb_kitu = sum_data['total_tem_pueb_kitu']
            existing_record.tem_pueb_nata = sum_data['total_tem_pueb_nata']
            existing_record.tem_pueb_otav = sum_data['total_tem_pueb_otav']
            existing_record.tem_pueb_palt = sum_data['total_tem_pueb_palt']
            existing_record.tem_pueb_panz = sum_data['total_tem_pueb_panz']
            existing_record.tem_pueb_past = sum_data['total_tem_pueb_past']
            existing_record.tem_pueb_puru = sum_data['total_tem_pueb_puru']
            existing_record.tem_pueb_sala = sum_data['total_tem_pueb_sala']
            existing_record.tem_pueb_sara = sum_data['total_tem_pueb_sara']
            existing_record.tem_pueb_toma = sum_data['total_tem_pueb_toma']
            existing_record.tem_pueb_wara = sum_data['total_tem_pueb_wara']
            existing_record.tem_men1_dosi_bcgp = sum_data['total_tem_men1_dosi_bcgp']
            existing_record.tem_men1_dosi_hbpr = sum_data['total_tem_men1_dosi_hbpr']
            existing_record.tem_men1_dosi_bcgd = sum_data['total_tem_men1_dosi_bcgd']
            existing_record.tem_men1_1rad_rota = sum_data['total_tem_men1_1rad_rota']
            existing_record.tem_men1_1rad_fipv = sum_data['total_tem_men1_1rad_fipv']
            existing_record.tem_men1_1rad_neum = sum_data['total_tem_men1_1rad_neum']
            existing_record.tem_men1_1rad_pent = sum_data['total_tem_men1_1rad_pent']
            existing_record.tem_men1_2dad_rota = sum_data['total_tem_men1_2dad_rota']
            existing_record.tem_men1_2dad_fipv = sum_data['total_tem_men1_2dad_fipv']
            existing_record.tem_men1_2dad_neum = sum_data['total_tem_men1_2dad_neum']
            existing_record.tem_men1_2dad_pent = sum_data['total_tem_men1_2dad_pent']
            existing_record.tem_men1_3rad_bopv = sum_data['total_tem_men1_3rad_bopv']
            existing_record.tem_men1_3rad_neum = sum_data['total_tem_men1_3rad_neum']
            existing_record.tem_men1_3rad_pent = sum_data['total_tem_men1_3rad_pent']
            existing_record.tem_12a23m_1rad_srp = sum_data['total_tem_12a23m_1rad_srp']
            existing_record.tem_12a23m_dosi_fa = sum_data['total_tem_12a23m_dosi_fa']
            existing_record.tem_12a23m_dosi_vari = sum_data['total_tem_12a23m_dosi_vari']
            existing_record.tem_12a23m_2dad_srp = sum_data['total_tem_12a23m_2dad_srp']
            existing_record.tem_12a23m_4tad_bopv = sum_data['total_tem_12a23m_4tad_bopv']
            existing_record.tem_12a23m_4tad_dpt = sum_data['total_tem_12a23m_4tad_dpt']
            existing_record.tem_5ano_5tad_bopv = sum_data['total_tem_5ano_5tad_bopv']
            existing_record.tem_5ano_5tad_dpt = sum_data['total_tem_5ano_5tad_dpt']
            existing_record.tem_9ano_1rad_hpv = sum_data['total_tem_9ano_1rad_hpv']
            existing_record.tem_9ano_2dad_hpv = sum_data['total_tem_9ano_2dad_hpv']
            existing_record.tem_10an_2dad_hpv = sum_data['total_tem_10an_2dad_hpv']
            existing_record.tem_15an_terc_dtad = sum_data['total_tem_15an_terc_dtad']
            existing_record.save()
        else:
            temprano.objects.create(
                tem_fech=tem_fech_fin,  # Último día del mes
                tem_intr=sum_data['total_tem_intr'],
                tem_extr_mies_cnh=sum_data['total_tem_extr_mies_cnh'],
                tem_extr_mies_cibv=sum_data['total_tem_extr_mies_cibv'],
                tem_extr_mine_egen=sum_data['total_tem_extr_mine_egen'],
                tem_extr_mine_bach=sum_data['total_tem_extr_mine_bach'],
                tem_extr_visi=sum_data['total_tem_extr_visi'],
                tem_extr_aten=sum_data['total_tem_extr_aten'],
                tem_otro=sum_data['total_tem_otro'],
                tem_sexo_homb=sum_data['total_tem_sexo_homb'],
                tem_sexo_muje=sum_data['total_tem_sexo_muje'],
                tem_luga_pert=sum_data['total_tem_luga_pert'],
                tem_luga_nope=sum_data['total_tem_luga_nope'],
                tem_naci_ecua=sum_data['total_tem_naci_ecua'],
                tem_naci_colo=sum_data['total_tem_naci_colo'],
                tem_naci_peru=sum_data['total_tem_naci_peru'],
                tem_naci_cuba=sum_data['total_tem_naci_cuba'],
                tem_naci_vene=sum_data['total_tem_naci_vene'],
                tem_naci_otro=sum_data['total_tem_naci_otro'],
                tem_auto_indi=sum_data['total_tem_auto_indi'],
                tem_auto_afro=sum_data['total_tem_auto_afro'],
                tem_auto_negr=sum_data['total_tem_auto_negr'],
                tem_auto_mula=sum_data['total_tem_auto_mula'],
                tem_auto_mont=sum_data['total_tem_auto_mont'],
                tem_auto_mest=sum_data['total_tem_auto_mest'],
                tem_auto_blan=sum_data['total_tem_auto_blan'],
                tem_auto_otro=sum_data['total_tem_auto_otro'],
                tem_naci_achu=sum_data['total_tem_naci_achu'],
                tem_naci_ando=sum_data['total_tem_naci_ando'],
                tem_naci_awa=sum_data['total_tem_naci_awa'],
                tem_naci_chac=sum_data['total_tem_naci_chac'],
                tem_naci_cofa=sum_data['total_tem_naci_cofa'],
                tem_naci_eper=sum_data['total_tem_naci_eper'],
                tem_naci_huan=sum_data['total_tem_naci_huan'],
                tem_naci_kich=sum_data['total_tem_naci_kich'],
                tem_naci_mant=sum_data['total_tem_naci_mant'],
                tem_naci_seco=sum_data['total_tem_naci_seco'],
                tem_naci_shiw=sum_data['total_tem_naci_shiw'],
                tem_naci_shua=sum_data['total_tem_naci_shua'],
                tem_naci_sion=sum_data['total_tem_naci_sion'],
                tem_naci_tsac=sum_data['total_tem_naci_tsac'],
                tem_naci_waor=sum_data['total_tem_naci_waor'],
                tem_naci_zapa=sum_data['total_tem_naci_zapa'],
                tem_pueb_chib=sum_data['total_tem_pueb_chib'],
                tem_pueb_kana=sum_data['total_tem_pueb_kana'],
                tem_pueb_kara=sum_data['total_tem_pueb_kara'],
                tem_pueb_kaya=sum_data['total_tem_pueb_kaya'],
                tem_pueb_kich=sum_data['total_tem_pueb_kich'],
                tem_pueb_kisa=sum_data['total_tem_pueb_kisa'],
                tem_pueb_kitu=sum_data['total_tem_pueb_kitu'],
                tem_pueb_nata=sum_data['total_tem_pueb_nata'],
                tem_pueb_otav=sum_data['total_tem_pueb_otav'],
                tem_pueb_palt=sum_data['total_tem_pueb_palt'],
                tem_pueb_panz=sum_data['total_tem_pueb_panz'],
                tem_pueb_past=sum_data['total_tem_pueb_past'],
                tem_pueb_puru=sum_data['total_tem_pueb_puru'],
                tem_pueb_sala=sum_data['total_tem_pueb_sala'],
                tem_pueb_sara=sum_data['total_tem_pueb_sara'],
                tem_pueb_toma=sum_data['total_tem_pueb_toma'],
                tem_pueb_wara=sum_data['total_tem_pueb_wara'],
                tem_men1_dosi_bcgp=sum_data['total_tem_men1_dosi_bcgp'],
                tem_men1_dosi_hbpr=sum_data['total_tem_men1_dosi_hbpr'],
                tem_men1_dosi_bcgd=sum_data['total_tem_men1_dosi_bcgd'],
                tem_men1_1rad_rota=sum_data['total_tem_men1_1rad_rota'],
                tem_men1_1rad_fipv=sum_data['total_tem_men1_1rad_fipv'],
                tem_men1_1rad_neum=sum_data['total_tem_men1_1rad_neum'],
                tem_men1_1rad_pent=sum_data['total_tem_men1_1rad_pent'],
                tem_men1_2dad_rota=sum_data['total_tem_men1_2dad_rota'],
                tem_men1_2dad_fipv=sum_data['total_tem_men1_2dad_fipv'],
                tem_men1_2dad_neum=sum_data['total_tem_men1_2dad_neum'],
                tem_men1_2dad_pent=sum_data['total_tem_men1_2dad_pent'],
                tem_men1_3rad_bopv=sum_data['total_tem_men1_3rad_bopv'],
                tem_men1_3rad_neum=sum_data['total_tem_men1_3rad_neum'],
                tem_men1_3rad_pent=sum_data['total_tem_men1_3rad_pent'],
                tem_12a23m_1rad_srp=sum_data['total_tem_12a23m_1rad_srp'],
                tem_12a23m_dosi_fa=sum_data['total_tem_12a23m_dosi_fa'],
                tem_12a23m_dosi_vari=sum_data['total_tem_12a23m_dosi_vari'],
                tem_12a23m_2dad_srp=sum_data['total_tem_12a23m_2dad_srp'],
                tem_12a23m_4tad_bopv=sum_data['total_tem_12a23m_4tad_bopv'],
                tem_12a23m_4tad_dpt=sum_data['total_tem_12a23m_4tad_dpt'],
                tem_5ano_5tad_bopv=sum_data['total_tem_5ano_5tad_bopv'],
                tem_5ano_5tad_dpt=sum_data['total_tem_5ano_5tad_dpt'],
                tem_9ano_1rad_hpv=sum_data['total_tem_9ano_1rad_hpv'],
                tem_9ano_2dad_hpv=sum_data['total_tem_9ano_2dad_hpv'],
                tem_10an_2dad_hpv=sum_data['total_tem_10an_2dad_hpv'],
                tem_15an_terc_dtad=sum_data['total_tem_15an_terc_dtad'],
                tem_tota=True,
                eniUser_id=eni_user_id
            )

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
                des_fech=tem_fech_fin,  # Último día del mes
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

        return Response({"message": "Datos registrados correctamente!."}, status=status.HTTP_201_CREATED)


class TardioCreateView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        tar_fech = parse_date(data.get('tar_fech'))
        eni_user_id = data.get('eniUser')
        tar_tota = data.get('tar_tota', False)
# para
        # Verificar si la fecha ya existe para el usuario cuando tem_tota es False
        if not tar_tota and tardio.objects.filter(eniUser_id=eni_user_id, tar_fech=tar_fech, tar_tota=False).exists():
            return Response(
                {"error": "La fecha ya ha sido registrada!."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear variables de control
        tar_fech_inicio = tar_fech.replace(day=1)
        tar_fech_fin = (tar_fech.replace(day=1) +
                        timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Guardar la información enviada en el método POST
        tardio.objects.create(
            tar_fech=tar_fech,
            tar_intr=data.get('tar_intr'),
            tar_extr_mies_cnh=data.get('tar_extr_mies_cnh'),
            tar_tota=tar_tota,
            eniUser_id=eni_user_id
        )

        # Filtrar y sumar columnas Tardio
        sum_data = tardio.objects.filter(
            eniUser_id=eni_user_id,
            tar_tota=False,
            tar_fech__range=(tar_fech_inicio, tar_fech_fin)
        ).aggregate(
            total_tar_intr=Sum('tar_intr'),
            total_tar_extr_mies_cnh=Sum('tar_extr_mies_cnh')
        )

        # Actualizar o crear una nueva fila Tarde
        existing_record = tardio.objects.filter(
            eniUser_id=eni_user_id,
            tar_fech__range=(tar_fech_inicio, tar_fech_fin),
            tar_tota=True
        ).first()

        # Tardio
        if existing_record:
            existing_record.tar_intr = sum_data['total_tar_intr']
            existing_record.tar_extr_mies_cnh = sum_data['total_tar_extr_mies_cnh']
            existing_record.save()
        else:
            tardio.objects.create(
                tar_fech=tar_fech_fin,  # Último día del mes
                tar_intr=sum_data['total_tar_intr'],
                tar_extr_mies_cnh=sum_data['total_tar_extr_mies_cnh'],
                tar_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": "Datos registrados correctamente."}, status=status.HTTP_201_CREATED)
