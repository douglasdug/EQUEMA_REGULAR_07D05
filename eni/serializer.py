from rest_framework import serializers
from .models import eniUser, unidadSalud, temprano, tardio, desperdicio, registroVacunado
from django.contrib.auth import authenticate

DATE_FORMAT = "%d/%m/%Y"


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = eniUser
        fields = ("id", "fun_titu", "username",
                  "fun_email", "first_name", "last_name",)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = eniUser
        fields = (
            "id", "fun_tipo_iden", "username", "first_name", "last_name", "fun_sex", "fun_email", "password1", "password2"
        )
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError("Password no es correcto!")
        password = attrs.get("password1", "")
        if len(password) < 8:
            raise serializers.ValidationError(
                "Password tiene que tener mas de 8 caracteres!")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        return eniUser.objects.create_user(password=password, **validated_data)


class UserLoginSerializer(serializers.Serializer):
    fun_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Usuario o Clave es incorrecto!.")


class UnidadSaludRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = unidadSalud
        fields = '__all__'


class TempranoRegistrationSerializer(serializers.ModelSerializer):
    tem_fech = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = temprano
        fields = '__all__'


class TardioRegistrationSerializer(serializers.ModelSerializer):
    tar_fech = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = tardio
        fields = '__all__'


class DesperdicioRegistrationSerializer(serializers.ModelSerializer):
    des_fech = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = desperdicio
        fields = '__all__'


class RegistroVacunadoRegistrationSerializer(serializers.ModelSerializer):
    vac_reg_ano_mes_dia_apli = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = registroVacunado
        fields = '__all__'
