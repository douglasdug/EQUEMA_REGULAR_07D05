from rest_framework import serializers
from .models import eniUser, unidad_salud, temprano, tardio, desperdicio, influenza, reporte_eni, admision_datos, form_008_emergencia, registro_vacunado
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

DATE_FORMAT = "%d/%m/%Y"
TIME_FORMAT = "%H:%M:%S"


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = eniUser
        fields = (
            "id", "username", "last_name", "first_name", "email", "fun_titu",
        )


class UserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = eniUser
        fields = (
            "id", "fun_tipo_iden", "username", "last_name", "first_name", "fun_sex", "email", "fun_titu", "password1", "password2", "fun_esta"
        )
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError(
                "Clave 1 y Clave 2 no son iguales!")

        password = attrs.get("password1")
        validate_password(password)

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        user = eniUser.objects.create_user(password=password, **validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        style={'input_type': 'password'}, trim_whitespace=False)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(request=self.context.get(
                'request'), username=username, password=password)
            if not user:
                raise serializers.ValidationError(
                    {"error": "No se puede iniciar sesión con las credenciales proporcionadas revisar Identificacion o Clave!"}, code='authorization')
            if user.fun_esta != 1:
                raise serializers.ValidationError(
                    {"error": "Su cuenta aún no ha sido activada. Por favor, contacte al administrador para completar el proceso de activación!"}, code='authorization')
        else:
            raise serializers.ValidationError(
                {"error": 'Debe incluir "username" y "password"!'}, code='authorization')

        data['user'] = user
        return data


class EniUserRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    password = serializers.CharField(read_only=True)
    uni_unic = serializers.SerializerMethodField()

    class Meta:
        model = eniUser
        fields = (
            "id", "fun_tipo_iden", "username", "last_name", "first_name", "fun_sex", "email", "fun_titu", "password1", "password2", "password", "fun_admi_rol", "fun_esta", "uni_unic"
        )
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError(
                "Clave 1 y Clave 2 no son iguales!")

        password = attrs.get("password1")
        validate_password(password)

        return attrs

    def get_uni_unic(self, obj):
        # Obtiene una lista de 'uni_unic' de todas las 'unidades_salud' relacionadas
        return [unidad.uni_unic for unidad in obj.unidades_salud.all()]

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        user = eniUser.objects.create_user(password=password, **validated_data)
        return user


class UnidadSaludRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = unidad_salud
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


class InfluenzaRegistrationSerializer(serializers.ModelSerializer):
    inf_fech = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = influenza
        fields = '__all__'


class ReporteENIRegistrationSerializer(serializers.ModelSerializer):
    rep_fech = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = reporte_eni
        fields = '__all__'


class AdmisionDatosRegistrationSerializer(serializers.ModelSerializer):
    adm_dato_admi_fech_admi = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])
    adm_dato_admi_fech_admi_actu = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])
    adm_dato_naci_fech_naci = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = admision_datos
        fields = '__all__'
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=admision_datos.objects.all(),
                fields=['adm_dato_pers_tipo_iden', 'adm_dato_pers_nume_iden'],
                message="Ya existe un registro con este tipo y número de identificación."
            )
        ]


class Form008EmergenciaSerializer(serializers.ModelSerializer):
    for_008_emer_fech_aten = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])
    for_008_emer_hora_aten = serializers.TimeField(
        format=TIME_FORMAT, input_formats=[TIME_FORMAT, 'iso-8601'])

    # Campo calculado para respuesta
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = form_008_emergencia
        fields = '__all__'

    def get_nombre_completo(self, obj):
        """Campo calculado para obtener el nombre completo"""
        return obj.get_nombre_completo()

    def validate(self, attrs):
        """Validaciones de nivel de formulario - API específicas"""
        # Validación de identificación
        if attrs.get('for_008_emer_nume_iden') and not attrs.get('for_008_emer_tipo_docu_iden'):
            raise serializers.ValidationError({
                'for_008_emer_tipo_docu_iden': 'Si ingresa número de identificación, debe especificar el tipo'
            })

        return attrs

    def validate_for_008_emer_edad(self, value):
        """Validación específica de edad"""
        if value is not None and value < 0:
            raise serializers.ValidationError('La edad no puede ser negativa')
        if value is not None and value > 150:
            raise serializers.ValidationError(
                'La edad no puede ser mayor a 150 años')
        return value

    def validate_for_008_emer_nume_iden(self, value):
        """Validación de número de identificación"""
        if value and len(value) < 7:
            raise serializers.ValidationError(
                'El número de identificación debe tener al menos 7 caracteres')
        return value

    def create(self, validated_data):
        """Lógica personalizada de creación"""
        # Aquí puedes agregar lógica adicional antes de crear
        instance = super().create(validated_data)

        # Ejemplo: Logging automático
        # logger.info(f"Nuevo formulario 008 creado: {instance.id}")

        return instance

    def update(self, instance, validated_data):
        """Lógica personalizada de actualización"""
        # Aquí puedes agregar lógica adicional antes de actualizar
        updated_instance = super().update(instance, validated_data)

        # Ejemplo: Tracking de cambios
        # logger.info(f"Formulario 008 actualizado: {instance.id}")

        return updated_instance


class RegistroVacunadoRegistrationSerializer(serializers.ModelSerializer):
    vac_reg_ano_mes_dia_apli = serializers.DateField(
        format=DATE_FORMAT, input_formats=[DATE_FORMAT, 'iso-8601'])

    class Meta:
        model = registro_vacunado
        fields = '__all__'
