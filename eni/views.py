from django.shortcuts import render
from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, UnidadSaludRegistrationSerializer, TempranoRegistrationSerializer, TardioRegistrationSerializer
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


class TempranoCreateView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        tem_fech = parse_date(data.get('tem_fech'))
        eni_user_id = data.get('eniUser')
        tem_tota = data.get('tem_tota', False)
        tem_intr = int(data.get('tem_intr', 0))
        tem_extr_mies_cnh = int(data.get('tem_extr_mies_cnh', 0))
        tem_men1_dosi_bcgp = int(data.get('tem_men1_dosi_bcgp', 0))
        tem_men1_dosi_hbpr = int(data.get('tem_men1_dosi_hbpr', 0))
        tem_men1_dosi_bcgd = int(data.get('tem_men1_dosi_bcgd', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))

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
            tem_men1_dosi_bcgp=tem_men1_dosi_bcgp,
            tem_men1_dosi_hbpr=tem_men1_dosi_hbpr,
            tem_men1_dosi_bcgd=tem_men1_dosi_bcgd,
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
            total_tem_men1_dosi_bcgp=Sum('tem_men1_dosi_bcgp'),
            total_tem_men1_dosi_hbpr=Sum('tem_men1_dosi_hbpr'),
            total_tem_men1_dosi_bcgd=Sum('tem_men1_dosi_bcgd')
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
            existing_record.tem_men1_dosi_bcgp = sum_data['total_tem_men1_dosi_bcgp']
            existing_record.tem_men1_dosi_hbpr = sum_data['total_tem_men1_dosi_hbpr']
            existing_record.tem_men1_dosi_bcgd = sum_data['total_tem_men1_dosi_bcgd']
            existing_record.save()
        else:
            temprano.objects.create(
                tem_fech=tem_fech_fin,  # Último día del mes
                tem_intr=sum_data['total_tem_intr'],
                tem_extr_mies_cnh=sum_data['total_tem_extr_mies_cnh'],
                tem_men1_dosi_bcgp=sum_data['total_tem_men1_dosi_bcgp'],
                tem_men1_dosi_hbpr=sum_data['total_tem_men1_dosi_hbpr'],
                tem_men1_dosi_bcgd=sum_data['total_tem_men1_dosi_bcgd'],
                tem_tota=True,
                eniUser_id=eni_user_id
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tem_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular des_bcg_dosapli sumando tem_men1_dosi_bcgp y tem_men1_dosi_bcgd
        total_des_bcg_dosapli = tem_men1_dosi_bcgp + tem_men1_dosi_bcgd

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli += total_des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi += des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi += des_bcg_pervacfrasnoabi
            existing_record.des_tota += tem_tota
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tem_fech,
                des_bcg_dosapli=total_des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_tota=tem_tota,
                eniUser_id=eni_user_id
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

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(tem_fech_inicio, tem_fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=tem_fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": "Datos registrados correctamente."}, status=status.HTTP_201_CREATED)


class TardioCreateView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        tar_fech = parse_date(data.get('tar_fech'))
        eni_user_id = data.get('eniUser')
        tar_tota = data.get('tar_tota', False)
        tar_intr = int(data.get('tar_intr', 0))
        tar_extr_mies_cnh = int(data.get('tar_extr_mies_cnh', 0))
        tar_1ano_1rad_fipv = int(data.get('tar_1ano_1rad_fipv', 0))
        tar_1ano_1rad_hbpe = int(data.get('tar_1ano_1rad_hbpe', 0))
        tar_1ano_1rad_dpt = int(data.get('tar_1ano_1rad_dpt', 0))
        tar_1ano_2dad_fipv = int(data.get('tar_1ano_2dad_fipv', 0))
        des_bcg_pervacenfabi = int(data.get('des_bcg_pervacenfabi', 0))
        des_bcg_pervacfrasnoabi = int(data.get('des_bcg_pervacfrasnoabi', 0))

        # Verificar si la fecha ya existe para el usuario cuando tar_tota es False
        if not tar_tota and tardio.objects.filter(eniUser_id=eni_user_id, tar_fech=tar_fech, tar_tota=False).exists():
            return Response(
                {"error": "La fecha ya ha sido registrada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear variables de control
        tar_fech_inicio = tar_fech.replace(day=1)
        tar_fech_fin = (tar_fech.replace(day=1) +
                        timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Guardar la información enviada en el método POST Tardio
        tardio.objects.create(
            tar_fech=tar_fech,
            tar_intr=tar_intr,
            tar_extr_mies_cnh=tar_extr_mies_cnh,
            tar_1ano_1rad_fipv=tar_1ano_1rad_fipv,
            tar_1ano_1rad_hbpe=tar_1ano_1rad_hbpe,
            tar_1ano_1rad_dpt=tar_1ano_1rad_dpt,
            tar_1ano_2dad_fipv=tar_1ano_2dad_fipv,
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
            total_tar_extr_mies_cnh=Sum('tar_extr_mies_cnh'),
            total_tar_1ano_1rad_fipv=Sum('tar_1ano_1rad_fipv'),
            total_tar_1ano_1rad_hbpe=Sum('tar_1ano_1rad_hbpe'),
            total_tar_1ano_1rad_dpt=Sum('tar_1ano_1rad_dpt'),
            total_tar_1ano_2dad_fipv=Sum('tar_1ano_2dad_fipv')
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
            existing_record.tar_1ano_1rad_fipv = sum_data['total_tar_1ano_1rad_fipv']
            existing_record.tar_1ano_1rad_hbpe = sum_data['total_tar_1ano_1rad_hbpe']
            existing_record.tar_1ano_1rad_dpt = sum_data['total_tar_1ano_1rad_dpt']
            existing_record.tar_1ano_2dad_fipv = sum_data['total_tar_1ano_2dad_fipv']
            existing_record.save()
        else:
            tardio.objects.create(
                tar_fech=tar_fech_fin,  # Último día del mes
                tar_intr=sum_data['total_tar_intr'],
                tar_extr_mies_cnh=sum_data['total_tar_extr_mies_cnh'],
                tar_1ano_1rad_fipv=sum_data['total_tar_1ano_1rad_fipv'],
                tar_1ano_1rad_hbpe=sum_data['total_tar_1ano_1rad_hbpe'],
                tar_1ano_1rad_dpt=sum_data['total_tar_1ano_1rad_dpt'],
                tar_1ano_2dad_fipv=sum_data['total_tar_1ano_2dad_fipv'],
                tar_tota=True,
                eniUser_id=eni_user_id
            )

        # Filtrar en la tabla desperdicio para verificar si ya existe un registro con la misma fecha
        existing_record = desperdicio.objects.filter(
            des_fech=tar_fech,
            eniUser_id=eni_user_id
        ).first()

        # Calcular des_bcg_dosapli sumando tar_1ano_1rad_fipv y tar_1ano_2dad_fipv
        total_des_bcg_dosapli = tar_1ano_1rad_fipv + tar_1ano_2dad_fipv

        if existing_record:
            # Si existe, actualizar el registro sumando los valores actuales
            existing_record.des_bcg_dosapli += total_des_bcg_dosapli
            existing_record.des_bcg_pervacenfabi += des_bcg_pervacenfabi
            existing_record.des_bcg_pervacfrasnoabi += des_bcg_pervacfrasnoabi
            existing_record.des_tota += tar_tota
            existing_record.save()
        else:
            # Si no existe, crear un nuevo registro con los valores proporcionados
            desperdicio.objects.create(
                des_fech=tar_fech,
                des_bcg_dosapli=total_des_bcg_dosapli,
                des_bcg_pervacenfabi=des_bcg_pervacenfabi,
                des_bcg_pervacfrasnoabi=des_bcg_pervacfrasnoabi,
                des_tota=tar_tota,
                eniUser_id=eni_user_id
            )

        # Filtrar y sumar columnas Desperdicio
        sum_data_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_tota=False,
            des_fech__range=(tar_fech_inicio, tar_fech_fin)
        ).aggregate(
            total_des_bcg_dosapli=Sum('des_bcg_dosapli'),
            total_des_bcg_pervacenfabi=Sum('des_bcg_pervacenfabi'),
            total_des_bcg_pervacfrasnoabi=Sum('des_bcg_pervacfrasnoabi')
        )

        # Actualizar o crear una nueva fila Desperdicio
        existing_record_des = desperdicio.objects.filter(
            eniUser_id=eni_user_id,
            des_fech__range=(tar_fech_inicio, tar_fech_fin),
            des_tota=True
        ).first()

        # Desperdicio
        if existing_record_des:
            existing_record_des.des_bcg_dosapli = sum_data_des['total_des_bcg_dosapli']
            existing_record_des.des_bcg_pervacenfabi = sum_data_des['total_des_bcg_pervacenfabi']
            existing_record_des.des_bcg_pervacfrasnoabi = sum_data_des[
                'total_des_bcg_pervacfrasnoabi']
            existing_record_des.save()
        else:
            desperdicio.objects.create(
                des_fech=tar_fech_fin,  # Último día del mes
                des_bcg_dosapli=sum_data_des['total_des_bcg_dosapli'],
                des_bcg_pervacenfabi=sum_data_des['total_des_bcg_pervacenfabi'],
                des_bcg_pervacfrasnoabi=sum_data_des['total_des_bcg_pervacfrasnoabi'],
                des_tota=True,
                eniUser_id=eni_user_id
            )

        return Response({"message": "Datos registrados correctamente."}, status=status.HTTP_201_CREATED)
