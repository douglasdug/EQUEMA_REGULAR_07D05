from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class eniUser(AbstractUser):
    email = models.EmailField(unique=True)
    fun_sex = models.CharField(max_length=10, blank=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def nombre_completo(self):
        return self.first_name + " " + self.last_name

    def __str__(self) -> str:
        return self.nombre_completo()

# Crea la tabla de Unidad de Salud


class unidadSalud(models.Model):
    uni_zona = models.CharField(max_length=10, blank=True)
    uni_dist = models.CharField(max_length=8, blank=True)
    uni_prov = models.CharField(max_length=20, blank=True)
    uni_cant = models.CharField(max_length=30, blank=True)
    uni_parr = models.CharField(max_length=40, blank=True)
    uni_unic = models.CharField(max_length=8, blank=True)
    uni_unid = models.CharField(max_length=40, blank=True)
    uni_tipo = models.CharField(max_length=30, blank=True)
    uni_nive = models.CharField(max_length=8, blank=True)
    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE)


# Crea la tabla de Esquema Regular Temprano
class temprano(models.Model):
    tem_fech = models.DateField()
    tem_intr = models.IntegerField(blank=True)
    tem_extr_mies_cnh = models.IntegerField(blank=True)
    tem_extr_mies_cibv = models.IntegerField(blank=True)
    tem_extr_mine_egen = models.IntegerField(blank=True)
    tem_extr_mine_bach = models.IntegerField(blank=True)
    tem_extr_visi = models.IntegerField(blank=True)
    tem_extr_aten = models.IntegerField(blank=True)
    tem_otro = models.IntegerField(blank=True)
    tem_sexo_homb = models.IntegerField(blank=True)
    tem_sexo_muje = models.IntegerField(blank=True)
    tem_luga_pert = models.IntegerField(blank=True)
    tem_luga_nope = models.IntegerField(blank=True)
    tem_naci_ecua = models.IntegerField(blank=True)
    tem_naci_colo = models.IntegerField(blank=True)
    tem_naci_peru = models.IntegerField(blank=True)
    tem_naci_cuba = models.IntegerField(blank=True)
    tem_naci_vene = models.IntegerField(blank=True)
    tem_naci_otro = models.IntegerField(blank=True)
    tem_auto_indi = models.IntegerField(blank=True)
    tem_auto_afro = models.IntegerField(blank=True)
    tem_auto_negr = models.IntegerField(blank=True)
    tem_auto_mula = models.IntegerField(blank=True)
    tem_auto_mont = models.IntegerField(blank=True)
    tem_auto_mest = models.IntegerField(blank=True)
    tem_auto_blan = models.IntegerField(blank=True)
    tem_auto_otro = models.IntegerField(blank=True)
    tem_naci_achu = models.IntegerField(blank=True)
    tem_naci_ando = models.IntegerField(blank=True)
    tem_naci_awa = models.IntegerField(blank=True)
    tem_naci_chac = models.IntegerField(blank=True)
    tem_naci_cofa = models.IntegerField(blank=True)
    tem_naci_eper = models.IntegerField(blank=True)
    tem_naci_huan = models.IntegerField(blank=True)
    tem_naci_kich = models.IntegerField(blank=True)
    tem_naci_mant = models.IntegerField(blank=True)
    tem_naci_seco = models.IntegerField(blank=True)
    tem_naci_shiw = models.IntegerField(blank=True)
    tem_naci_shua = models.IntegerField(blank=True)
    tem_naci_sion = models.IntegerField(blank=True)
    tem_naci_tsac = models.IntegerField(blank=True)
    tem_naci_waor = models.IntegerField(blank=True)
    tem_naci_zapa = models.IntegerField(blank=True)
    tem_pueb_chib = models.IntegerField(blank=True)
    tem_pueb_kana = models.IntegerField(blank=True)
    tem_pueb_kara = models.IntegerField(blank=True)
    tem_pueb_kaya = models.IntegerField(blank=True)
    tem_pueb_kich = models.IntegerField(blank=True)
    tem_pueb_kisa = models.IntegerField(blank=True)
    tem_pueb_kitu = models.IntegerField(blank=True)
    tem_pueb_nata = models.IntegerField(blank=True)
    tem_pueb_otav = models.IntegerField(blank=True)
    tem_pueb_palt = models.IntegerField(blank=True)
    tem_pueb_panz = models.IntegerField(blank=True)
    tem_pueb_past = models.IntegerField(blank=True)
    tem_pueb_puru = models.IntegerField(blank=True)
    tem_pueb_sala = models.IntegerField(blank=True)
    tem_pueb_sara = models.IntegerField(blank=True)
    tem_pueb_toma = models.IntegerField(blank=True)
    tem_pueb_wara = models.IntegerField(blank=True)
    tem_men1_dosi_bcgp = models.IntegerField(blank=True)
    tem_men1_dosi_hbpr = models.IntegerField(blank=True)
    tem_men1_dosi_bcgd = models.IntegerField(blank=True)
    tem_men1_1rad_rota = models.IntegerField(blank=True)
    tem_men1_1rad_fipv = models.IntegerField(blank=True)
    tem_men1_1rad_neum = models.IntegerField(blank=True)
    tem_men1_1rad_pent = models.IntegerField(blank=True)
    tem_men1_2dad_rota = models.IntegerField(blank=True)
    tem_men1_2dad_fipv = models.IntegerField(blank=True)
    tem_men1_2dad_neum = models.IntegerField(blank=True)
    tem_men1_2dad_pent = models.IntegerField(blank=True)
    tem_men1_3rad_bopv = models.IntegerField(blank=True)
    tem_men1_3rad_neum = models.IntegerField(blank=True)
    tem_men1_3rad_pent = models.IntegerField(blank=True)
    tem_12a23m_1rad_srp = models.IntegerField(blank=True)
    tem_12a23m_dosi_fa = models.IntegerField(blank=True)
    tem_12a23m_dosi_vari = models.IntegerField(blank=True)
    tem_12a23m_2dad_srp = models.IntegerField(blank=True)
    tem_12a23m_4tad_bopv = models.IntegerField(blank=True)
    tem_12a23m_4tad_dpt = models.IntegerField(blank=True)
    tem_5ano_5tad_bopv = models.IntegerField(blank=True)
    tem_5ano_5tad_dpt = models.IntegerField(blank=True)
    tem_9ano_1rad_hpv = models.IntegerField(blank=True)
    tem_9ano_2dad_hpv = models.IntegerField(blank=True)
    tem_10an_2dad_hpv = models.IntegerField(blank=True)
    tem_15an_terc_dtad = models.IntegerField(blank=True)
    tem_tota = models.BooleanField(default=False)
    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE)

    @classmethod
    def get_by_month_and_user(cls, user_id, month, year):
        return cls.objects.filter(
            eniUser_id=user_id,
            tem_fech__year=year,
            tem_fech__month=month
        ).order_by('tem_fech')


class tardio(models.Model):
    tar_fech = models.DateField()
    tar_intr = models.IntegerField(blank=True)
    tar_extr_mies_cnh = models.IntegerField(blank=True)
    tar_tota = models.BooleanField(default=False)
    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE)

    @classmethod
    def get_by_month_and_user(cls, user_id, month, year):
        return cls.objects.filter(
            eniUser_id=user_id,
            tar_fech__year=year,
            tar_fech__month=month
        ).order_by('tar_fech')


class desperdicio(models.Model):
    des_fech = models.DateField()
    des_bcg_dosapli = models.IntegerField(blank=True)
    des_bcg_pervacenfabi = models.IntegerField(blank=True)
    des_bcg_pervacfrasnoabi = models.IntegerField(blank=True)
    des_hbpe_dosapli = models.IntegerField(blank=True)
    des_hbpe_pervacenfabi = models.IntegerField(blank=True)
    des_hbpe_pervacfrasnoabi = models.IntegerField(blank=True)
    des_rota_dosapli = models.IntegerField(blank=True)
    des_rota_pervacenfabi = models.IntegerField(blank=True)
    des_rota_pervacfrasnoabi = models.IntegerField(blank=True)
    des_pent_dosapli = models.IntegerField(blank=True)
    des_pent_pervacenfabi = models.IntegerField(blank=True)
    des_pent_pervacfrasnoabi = models.IntegerField(blank=True)
    des_fipv_dosapli = models.IntegerField(blank=True)
    des_fipv_pervacenfabi = models.IntegerField(blank=True)
    des_fipv_pervacfrasnoabi = models.IntegerField(blank=True)
    des_anti_dosapli = models.IntegerField(blank=True)
    des_anti_pervacenfabi = models.IntegerField(blank=True)
    des_anti_pervacfrasnoabi = models.IntegerField(blank=True)
    des_neum_dosapli = models.IntegerField(blank=True)
    des_neum_pervacenfabi = models.IntegerField(blank=True)
    des_neum_pervacfrasnoabi = models.IntegerField(blank=True)
    des_sr_dosapli = models.IntegerField(blank=True)
    des_sr_pervacenfabi = models.IntegerField(blank=True)
    des_sr_pervacfrasnoabi = models.IntegerField(blank=True)
    des_srp_dosapli = models.IntegerField(blank=True)
    des_srp_pervacenfabi = models.IntegerField(blank=True)
    des_srp_pervacfrasnoabi = models.IntegerField(blank=True)
    des_vari_dosapli = models.IntegerField(blank=True)
    des_vari_pervacenfabi = models.IntegerField(blank=True)
    des_vari_pervacfrasnoabi = models.IntegerField(blank=True)
    des_fieb_dosapli = models.IntegerField(blank=True)
    des_fieb_pervacenfabi = models.IntegerField(blank=True)
    des_fieb_pervacfrasnoabi = models.IntegerField(blank=True)
    des_dift_dosapli = models.IntegerField(blank=True)
    des_dift_pervacenfabi = models.IntegerField(blank=True)
    des_dift_pervacfrasnoabi = models.IntegerField(blank=True)
    des_hpv_dosapli = models.IntegerField(blank=True)
    des_hpv_pervacenfabi = models.IntegerField(blank=True)
    des_hpv_pervacfrasnoabi = models.IntegerField(blank=True)
    des_dtad_dosapli = models.IntegerField(blank=True)
    des_dtad_pervacenfabi = models.IntegerField(blank=True)
    des_dtad_pervacfrasnoabi = models.IntegerField(blank=True)
    des_hepa_dosapli = models.IntegerField(blank=True)
    des_hepa_pervacenfabi = models.IntegerField(blank=True)
    des_hepa_pervacfrasnoabi = models.IntegerField(blank=True)
    des_inmant_dosapli = models.IntegerField(blank=True)
    des_inmant_pervacenfabi = models.IntegerField(blank=True)
    des_inmant_pervacfrasnoabi = models.IntegerField(blank=True)
    des_inmanthepb_dosapli = models.IntegerField(blank=True)
    des_inmanthepb_pervacenfabi = models.IntegerField(blank=True)
    des_inmanthepb_pervacfrasnoabi = models.IntegerField(blank=True)
    des_inmantrra_dosapli = models.IntegerField(blank=True)
    des_inmantrra_pervacenfabi = models.IntegerField(blank=True)
    des_inmantrra_pervacfrasnoabi = models.IntegerField(blank=True)
    des_infped_dosapli = models.IntegerField(blank=True)
    des_infped_pervacenfabi = models.IntegerField(blank=True)
    des_infped_pervacfrasnoabi = models.IntegerField(blank=True)
    des_infadu_dosapli = models.IntegerField(blank=True)
    des_infadu_pervacenfabi = models.IntegerField(blank=True)
    des_infadu_pervacfrasnoabi = models.IntegerField(blank=True)
    des_viru_dosapli = models.IntegerField(blank=True)
    des_viru_pervacenfabi = models.IntegerField(blank=True)
    des_viru_pervacfrasnoabi = models.IntegerField(blank=True)
    des_vacsin_dosapli = models.IntegerField(blank=True)
    des_vacsin_pervacenfabi = models.IntegerField(blank=True)
    des_vacsin_pervacfrasnoabi = models.IntegerField(blank=True)
    des_vacpfi_dosapli = models.IntegerField(blank=True)
    des_vacpfi_pervacenfabi = models.IntegerField(blank=True)
    des_vacpfi_pervacfrasnoabi = models.IntegerField(blank=True)
    des_vacmod_dosapli = models.IntegerField(blank=True)
    des_vacmod_pervacenfabi = models.IntegerField(blank=True)
    des_vacmod_pervacfrasnoabi = models.IntegerField(blank=True)
    des_vacvphcam_dosapli = models.IntegerField(blank=True)
    des_vacvphcam_pervacenfabi = models.IntegerField(blank=True)
    des_vacvphcam_pervacfrasnoabi = models.IntegerField(blank=True)
    des_tota = models.BooleanField(default=False)
    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE)

    @classmethod
    def get_by_month_and_user(cls, user_id, month, year):
        return cls.objects.filter(
            eniUser_id=user_id,
            des_fech__year=year,
            des_fech__month=month
        ).order_by('des_fech')


class registroVacunador(models.Model):
    vac_reg_ano_mes_dia_apli = models.DateField()
    vac_reg_punt_vacu = models.CharField(max_length=40, blank=True)
    vac_reg_unic_esta = models.CharField(max_length=8, blank=True)
    vac_reg_nomb_esta_salu = models.CharField(max_length=40, blank=True)
    vac_reg_zona = models.CharField(max_length=8, blank=True)
    vac_reg_dist = models.CharField(max_length=8, blank=True)
    vac_reg_prov = models.CharField(max_length=20, blank=True)
    vac_reg_cant = models.CharField(max_length=30, blank=True)
    vac_reg_apel = models.CharField(max_length=40, blank=True)
    vac_reg_nomb = models.CharField(max_length=40, blank=True)
    vac_reg_tipo_iden = models.CharField(max_length=30, blank=True)
    vac_reg_nume_iden = models.CharField(max_length=20, blank=True)
    vac_reg_sexo = models.CharField(max_length=10, blank=True)
    vac_reg_ano_mes_dia_naci = models.DateField()
    vac_reg_naci = models.CharField(max_length=30, blank=True)
    vac_reg_etni = models.CharField(max_length=20, blank=True)
    vac_reg_naci_etni = models.CharField(max_length=30, blank=True)
    vac_reg_pueb = models.CharField(max_length=30, blank=True)
    vac_reg_resi_prov = models.CharField(max_length=20, blank=True)
    vac_reg_resi_cant = models.CharField(max_length=30, blank=True)
    vac_reg_resi_parr = models.CharField(max_length=40, blank=True)
    vac_reg_teld_cont = models.CharField(max_length=15, blank=True)
    vac_reg_corr_elec = models.CharField(max_length=40, blank=True)
    vac_reg_grup_ries = models.CharField(max_length=40, blank=True)
    vac_reg_fase_vacu = models.IntegerField(blank=True)
    vac_reg_esta_vacu = models.CharField(max_length=15, blank=True)
    vac_reg_tipo_esqu = models.CharField(max_length=30, blank=True)
    vac_reg_vacu = models.CharField(max_length=40, blank=True)
    vac_reg_lote_vacu = models.CharField(max_length=20, blank=True)
    vac_reg_dosi_apli = models.IntegerField(blank=True)
    vac_reg_paci_agen = models.CharField(max_length=8, blank=True)
    vac_reg_nomb_vacu = models.CharField(max_length=40, blank=True)
    vac_reg_iden_vacu = models.CharField(max_length=20, blank=True)
    vac_reg_nomb_prof_regi = models.CharField(max_length=40, blank=True)
    vac_reg_reci_dosi_prev_exte = models.CharField(max_length=8, blank=True)
    vac_reg_nomb_dosi_exte = models.CharField(max_length=40, blank=True)
    vac_reg_fech_anio_mes_dia_dosi_exte = models.DateField()
    vac_reg_pais_dosi_exte = models.CharField(max_length=30, blank=True)
    vac_reg_lote_dosi_exte = models.CharField(max_length=20, blank=True)

    eniUser = models.ForeignKey(
        eniUser, null=True, blank=True, on_delete=models.CASCADE)

    @classmethod
    def get_by_month_and_user(cls, user_id, month, year):
        return cls.objects.filter(
            eniUser_id=user_id,
            vac_reg_fech__year=year,
            vac_reg_fech__month=month
        ).order_by('vac_reg_ano_mes_dia_apli')
