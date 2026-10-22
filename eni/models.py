from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class EniUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        """
        Create and return a regular user with a username and password.
        """
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """
        Create and return a superuser with a username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)

# Create your models here.


class eniUser(AbstractUser):
    username = models.CharField(max_length=20, unique=True)
    email = models.EmailField(max_length=40, blank=True)
    fun_tipo_iden = models.CharField(max_length=40, blank=True)
    fun_sex = models.CharField(max_length=10, blank=True)
    fun_titu = models.CharField(max_length=40, blank=True)
    fun_esta = models.IntegerField(default=0)
    fun_admi_rol = models.IntegerField(default=0)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = EniUserManager()

    class Meta:
        unique_together = ('fun_tipo_iden', 'username')

    @classmethod
    def get_all_users(cls):
        return cls.objects.all()

    # def nombre_completo(self):
    #     return self.first_name + " " + self.last_name

    # def __str__(self) -> str:
    #     return self.nombre_completo()


# Crea la tabla de Unidad de Salud
class unidad_salud(models.Model):
    uni_unid_prin = models.IntegerField()
    uni_inst_sist = models.CharField(max_length=15, blank=True)
    uni_zona = models.CharField(max_length=10, blank=True)
    uni_dist = models.CharField(max_length=8, blank=True)
    uni_prov = models.CharField(max_length=20, blank=True)
    uni_cant = models.CharField(max_length=30, blank=True)
    uni_parr = models.CharField(max_length=60, blank=True)
    uni_unic = models.CharField(max_length=8, blank=True)
    uni_unid = models.CharField(max_length=130, blank=True)
    uni_tipo = models.CharField(max_length=60, blank=True)
    uni_nive = models.CharField(max_length=30, blank=True)
    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE, related_name='unidades_salud'
    )


# Crea la tabla de Admision de Registro de Paciente


class admision_datos(models.Model):
    adm_dato_admi_fech_admi = models.DateTimeField(auto_now_add=True)
    adm_dato_admi_fech_admi_actu = models.DateTimeField(auto_now=True)
    adm_dato_pers_tipo_iden = models.CharField(max_length=40, blank=True)
    adm_dato_pers_nume_iden = models.CharField(max_length=25, blank=True)
    adm_dato_pers_apel_prim = models.CharField(max_length=40, blank=True)
    adm_dato_pers_apel_segu = models.CharField(max_length=40, blank=True)
    adm_dato_pers_nomb_prim = models.CharField(max_length=40, blank=True)
    adm_dato_pers_nomb_segu = models.CharField(max_length=40, blank=True)
    adm_dato_pers_esta_civi = models.CharField(max_length=25, blank=True)
    adm_dato_pers_sexo = models.CharField(max_length=15, blank=True)
    adm_dato_pers_tele = models.CharField(max_length=15, blank=True)
    adm_dato_pers_celu = models.CharField(max_length=15, blank=True)
    adm_dato_pers_corr_elec = models.CharField(max_length=40, blank=True)
    adm_dato_naci_luga_naci = models.CharField(max_length=60, blank=True)
    adm_dato_naci_naci = models.CharField(max_length=60, blank=True)
    adm_dato_naci_fech_naci = models.DateField(blank=True, null=True)
    adm_dato_resi_pais_resi = models.CharField(max_length=60, blank=True)
    adm_dato_resi_prov = models.CharField(max_length=60, blank=True)
    adm_dato_resi_cant = models.CharField(max_length=60, blank=True)
    adm_dato_resi_parr = models.CharField(max_length=60, blank=True)
    adm_dato_resi_esta_adsc_terr = models.CharField(max_length=100, blank=True)
    adm_dato_resi_barr_sect = models.CharField(max_length=100, blank=True)
    adm_dato_resi_call_prin = models.CharField(max_length=100, blank=True)
    adm_dato_resi_call_secu = models.CharField(max_length=100, blank=True)
    adm_dato_resi_refe_resi = models.CharField(max_length=100, blank=True)
    adm_dato_auto_auto_etni = models.CharField(max_length=40, blank=True)
    adm_dato_auto_naci_etni = models.CharField(max_length=40, blank=True)
    adm_dato_auto_pueb_kich = models.CharField(max_length=40, blank=True)
    adm_dato_adic_grup_prio = models.CharField(max_length=50, blank=True)
    adm_dato_adic_nive_educ = models.CharField(max_length=40, blank=True)
    adm_dato_adic_esta_nive_educ = models.CharField(max_length=20, blank=True)
    adm_dato_adic_tipo_empr_trab = models.CharField(max_length=20, blank=True)
    adm_dato_adic_ocup_prof_prin = models.CharField(max_length=70, blank=True)
    adm_dato_adic_tipo_segu = models.CharField(max_length=40, blank=True)
    adm_dato_adic_tien_disc = models.CharField(max_length=10, blank=True)
    adm_dato_repr_tipo_iden = models.CharField(max_length=40, blank=True)
    adm_dato_repr_nume_iden = models.CharField(max_length=25, blank=True)
    adm_dato_repr_apel = models.CharField(max_length=80, blank=True)
    adm_dato_repr_nomb = models.CharField(max_length=80, blank=True)
    adm_dato_repr_fech_naci = models.DateField(blank=True, null=True)
    adm_dato_repr_pare = models.CharField(max_length=60, blank=True)
    adm_dato_repr_nume_tele = models.CharField(max_length=15, blank=True)
    adm_dato_repr_naci = models.CharField(max_length=60, blank=True)
    adm_dato_cont_enca_nece_llam = models.CharField(max_length=60, blank=True)
    adm_dato_cont_pare = models.CharField(max_length=50, blank=True)
    adm_dato_cont_dire = models.CharField(max_length=60, blank=True)
    adm_dato_cont_tele = models.CharField(max_length=15, blank=True)
    adm_dato_paci_falt_dato = models.IntegerField(default=0)

    class Meta:
        unique_together = ('adm_dato_pers_tipo_iden',
                           'adm_dato_pers_nume_iden')

# Crea la tabla de Form 008 EMERGENCIA


class form_008_emergencia(models.Model):
    for_008_emer_inst_sist = models.CharField(max_length=15, blank=True)
    for_008_emer_unic = models.CharField(max_length=10, blank=True)
    for_008_emer_unid = models.CharField(max_length=100, blank=True)
    for_008_emer_zona = models.CharField(max_length=10, blank=True)
    for_008_emer_prov = models.CharField(max_length=60, blank=True)
    for_008_emer_cant = models.CharField(max_length=60, blank=True)
    for_008_emer_dist = models.CharField(max_length=10, blank=True)
    for_008_emer_nive = models.CharField(max_length=10, blank=True)
    for_008_emer_fech_aten = models.DateField(blank=True, null=True)
    for_008_emer_hora_aten = models.TimeField(blank=True, null=True)
    for_008_emer_fech_naci_paci = models.DateField(blank=True, null=True)
    for_008_emer_tipo_docu_iden = models.CharField(max_length=40, blank=True)
    for_008_emer_nume_iden = models.CharField(max_length=25, blank=True)
    for_008_emer_prim_apel = models.CharField(max_length=40, blank=True)
    for_008_emer_segu_apel = models.CharField(max_length=40, blank=True)
    for_008_emer_prim_nomb = models.CharField(max_length=40, blank=True)
    for_008_emer_segu_nomb = models.CharField(max_length=40, blank=True)
    for_008_emer_sexo = models.CharField(max_length=20, blank=True)
    for_008_emer_edad = models.IntegerField(blank=True, null=True)
    for_008_emer_cond_edad = models.CharField(max_length=10, blank=True)
    for_008_emer_naci = models.CharField(max_length=60, blank=True)
    for_008_emer_etni = models.CharField(max_length=40, blank=True)
    for_008_emer_grup_prio = models.CharField(max_length=50, blank=True)
    for_008_emer_tipo_segu = models.CharField(max_length=40, blank=True)
    for_008_emer_prov_resi = models.CharField(max_length=60, blank=True)
    for_008_emer_cant_resi = models.CharField(max_length=60, blank=True)
    for_008_emer_parr_resi = models.CharField(max_length=60, blank=True)
    for_008_emer_espe_prof = models.CharField(max_length=40, blank=True)
    for_008_emer_cie_10_prin = models.CharField(max_length=10, blank=True)
    for_008_emer_diag_prin = models.CharField(max_length=260, blank=True)
    for_008_emer_cond_diag = models.CharField(max_length=50, blank=True)
    for_008_emer_cie_10_caus_exte = models.CharField(max_length=10, blank=True)
    for_008_emer_diag_caus_exte = models.CharField(max_length=260, blank=True)
    for_008_emer_cond_alta = models.CharField(max_length=15, blank=True)
    for_008_emer_hosp = models.CharField(max_length=10, blank=True)
    for_008_emer_nomb_hosp_refe_hosp = models.CharField(
        max_length=100, blank=True)
    for_008_emer_caus_aten = models.CharField(max_length=60, blank=True)
    for_008_emer_resp_aten_medi = models.CharField(max_length=80, blank=True)
    for_008_emer_apoy_aten_medi = models.CharField(max_length=80, blank=True)
    for_008_emer_obse = models.CharField(max_length=500, blank=True)
    for_008_emer_fech_repor = models.DateTimeField(auto_now=True)
    for_008_emer_edad_gest = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        blank=True,
        null=True,
        help_text='Edad gestacional en semanas (ej: 38.5)'
    )
    for_008_emer_ries_obst = models.CharField(max_length=15, blank=True)
    for_008_emer_unid_salu_resp_segu_aten = models.CharField(
        max_length=100, blank=True)
    for_008_emer_dire_domi = models.CharField(max_length=460, blank=True)
    for_008_emer_tele_paci = models.CharField(max_length=30, blank=True)
    for_008_emer_aten_fina = models.IntegerField(blank=True, null=True)
    for_008_emer_tipo_tria = models.CharField(max_length=40, blank=True)
    eniUser = models.ForeignKey(
        'eniUser', null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='formularios_008_emergencia',
        help_text='ID de usuario que registra la atencion formulario 008 emergencia'
    )
    admision_datos = models.IntegerField(
        blank=True, null=True, help_text='ID de admision de datos del paciente del formulario 008 emergencia')

    class Meta:
        verbose_name = 'Formulario 008 Emergencia'
        verbose_name_plural = 'Formularios 008 Emergencia'
        ordering = ['-for_008_emer_fech_aten']
        indexes = [
            models.Index(fields=['for_008_emer_nume_iden']),
            models.Index(fields=['for_008_emer_fech_aten']),
        ]

    def __str__(self):
        return f"Form 008 - {self.for_008_emer_prim_nomb} {self.for_008_emer_prim_apel} - {self.for_008_emer_fech_aten}"

    def get_nombre_completo(self):
        """Retorna el nombre completo del paciente"""
        nombres = f"{self.for_008_emer_prim_nomb or ''} {self.for_008_emer_segu_nomb or ''}".strip()
        apellidos = f"{self.for_008_emer_prim_apel or ''} {self.for_008_emer_segu_apel or ''}".strip()
        return f"{nombres} {apellidos}".strip()

    def clean(self):
        """Validaciones esenciales a nivel de modelo"""
        from django.core.exceptions import ValidationError

        # Solo validaciones críticas que afectan la integridad de los datos
        if self.for_008_emer_edad is not None and self.for_008_emer_edad < 0:
            raise ValidationError('La edad no puede ser negativa')


# Crea la tabla de Administra la Agenda de Turnos


class admin_agenda_turnos(models.Model):
    adm_agen_turn_fech = models.DateField(blank=True, null=True)
    adm_agen_turn_unid_salu = models.CharField(max_length=100, blank=True)
    adm_agen_turn_tipo_espe = models.CharField(max_length=100, blank=True)
    adm_agen_turn_prof_cita = models.CharField(max_length=100, blank=True)
    adm_agen_turn_dura_cita = models.IntegerField(blank=True, null=True)
    adm_agen_turn_hora_inic = models.TimeField(blank=True, null=True)
    adm_agen_turn_hora_fin = models.TimeField(blank=True, null=True)
    adm_agen_turn_tipo_iden_paci = models.CharField(max_length=40, blank=True)
    adm_agen_turn_nume_iden_paci = models.CharField(max_length=25, blank=True)
    adm_agen_turn_apel_nomb_paci = models.CharField(max_length=160, blank=True)
    adm_agen_turn_tele_paci = models.CharField(max_length=15, blank=True)
    adm_agen_turn_corr_paci = models.CharField(max_length=40, blank=True)
    adm_agen_turn_dire_paci = models.CharField(max_length=460, blank=True)
    adm_agen_turn_unid_salu_resp_segu_aten_paci = models.CharField(
        max_length=100, blank=True)
    adm_agen_turn_obse_paci = models.CharField(max_length=400, blank=True)
    adm_agen_turn_esta_cita = models.IntegerField(blank=True, null=True)
    adm_agen_turn_rese_unic_salu = models.CharField(max_length=8, blank=True)
    adm_agen_turn_cons_obse_paci = models.CharField(max_length=500, blank=True)
    adm_agen_turn_cons_link_paci = models.URLField(max_length=500, blank=True)
    adm_agen_turn_cons_tipo_serv = models.CharField(max_length=40, blank=True)
    id_admi_paci = models.IntegerField(
        blank=True, null=True, help_text='ID de paciente registrado en admision de datos')
    id_prof_cita = models.IntegerField(
        blank=True, null=True, help_text='ID de profesional que hara la atencion')
    eniUser = models.ForeignKey(
        'eniUser', null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='agent_diagnostico_imagen',
        help_text='ID de usuario que registra el turno para el paciente'
    )
