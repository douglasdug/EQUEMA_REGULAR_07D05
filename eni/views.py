from django.shortcuts import render
from rest_framework import status, permissions, viewsets
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializer import CustomUserSerializer, UserRegistrationSerializer, UserLoginSerializer, UnidadSaludRegistrationSerializer, TempranoRegistrationSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from .models import unidadSalud, temprano
from datetime import datetime, timedelta
from django.db.models import Sum
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

        # Obtener los datos validados
        data = serializer.validated_data

        # Crear la primera fila con los datos enviados desde el formulario
        instance = serializer.instance

        # Crear la segunda fila con los totales
        if not data.get('tem_tota', False):
            last_day_of_month = instance.tem_fech.replace(
                day=28) + timedelta(days=4)
            last_day_of_month = last_day_of_month - \
                timedelta(days=last_day_of_month.day)

            totals = temprano.objects.filter(
                tem_fech__year=instance.tem_fech.year,
                tem_fech__month=instance.tem_fech.month,
                tem_tota=False
            ).aggregate(
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
            )

            temprano.objects.create(
                tem_fech=last_day_of_month,
                tem_intr=totals['tem_intr'],
                tem_extr_mies_cnh=totals['tem_extr_mies_cnh'],
                tem_extr_mies_cibv=totals['tem_extr_mies_cibv'],
                tem_extr_mine_egen=totals['tem_extr_mine_egen'],
                tem_extr_mine_bach=totals['tem_extr_mine_bach'],
                tem_extr_visi=totals['tem_extr_visi'],
                tem_extr_aten=totals['tem_extr_aten'],
                tem_otro=totals['tem_otro'],
                tem_sexo_homb=totals['tem_sexo_homb'],
                tem_sexo_muje=totals['tem_sexo_muje'],
                tem_luga_pert=totals['tem_luga_pert'],
                tem_luga_nope=totals['tem_luga_nope'],
                tem_naci_ecua=totals['tem_naci_ecua'],
                tem_naci_colo=totals['tem_naci_colo'],
                tem_naci_peru=totals['tem_naci_peru'],
                tem_naci_cuba=totals['tem_naci_cuba'],
                tem_naci_vene=totals['tem_naci_vene'],
                tem_naci_otro=totals['tem_naci_otro'],
                tem_tota=True,
                eniUser=instance.eniUser
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
