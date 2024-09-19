from django.db import models, IntegrityError
from django.contrib.auth.models import AbstractUser

from django.utils.timezone import now
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError


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
    tar_extr_mies_cibv = models.IntegerField(blank=True)
    tar_extr_mine_egen = models.IntegerField(blank=True)
    tar_extr_mine_bach = models.IntegerField(blank=True)
    tar_extr_visi = models.IntegerField(blank=True)
    tar_extr_aten = models.IntegerField(blank=True)
    tar_otro = models.IntegerField(blank=True)
    tar_sexo_homb = models.IntegerField(blank=True)
    tar_sexo_muje = models.IntegerField(blank=True)
    tar_luga_pert = models.IntegerField(blank=True)
    tar_luga_nope = models.IntegerField(blank=True)
    tar_naci_ecua = models.IntegerField(blank=True)
    tar_naci_colo = models.IntegerField(blank=True)
    tar_naci_peru = models.IntegerField(blank=True)
    tar_naci_cuba = models.IntegerField(blank=True)
    tar_naci_vene = models.IntegerField(blank=True)
    tar_naci_otro = models.IntegerField(blank=True)
    tar_auto_indi = models.IntegerField(blank=True)
    tar_auto_afro = models.IntegerField(blank=True)
    tar_auto_negr = models.IntegerField(blank=True)
    tar_auto_mula = models.IntegerField(blank=True)
    tar_auto_mont = models.IntegerField(blank=True)
    tar_auto_mest = models.IntegerField(blank=True)
    tar_auto_blan = models.IntegerField(blank=True)
    tar_auto_otro = models.IntegerField(blank=True)
    tar_naci_achu = models.IntegerField(blank=True)
    tar_naci_ando = models.IntegerField(blank=True)
    tar_naci_awa = models.IntegerField(blank=True)
    tar_naci_chac = models.IntegerField(blank=True)
    tar_naci_cofa = models.IntegerField(blank=True)
    tar_naci_eper = models.IntegerField(blank=True)
    tar_naci_huan = models.IntegerField(blank=True)
    tar_naci_kich = models.IntegerField(blank=True)
    tar_naci_mant = models.IntegerField(blank=True)
    tar_naci_seco = models.IntegerField(blank=True)
    tar_naci_shiw = models.IntegerField(blank=True)
    tar_naci_shua = models.IntegerField(blank=True)
    tar_naci_sion = models.IntegerField(blank=True)
    tar_naci_tsac = models.IntegerField(blank=True)
    tar_naci_waor = models.IntegerField(blank=True)
    tar_naci_zapa = models.IntegerField(blank=True)
    tar_pueb_chib = models.IntegerField(blank=True)
    tar_pueb_kana = models.IntegerField(blank=True)
    tar_pueb_kara = models.IntegerField(blank=True)
    tar_pueb_kaya = models.IntegerField(blank=True)
    tar_pueb_kich = models.IntegerField(blank=True)
    tar_pueb_kisa = models.IntegerField(blank=True)
    tar_pueb_kitu = models.IntegerField(blank=True)
    tar_pueb_nata = models.IntegerField(blank=True)
    tar_pueb_otav = models.IntegerField(blank=True)
    tar_pueb_palt = models.IntegerField(blank=True)
    tar_pueb_panz = models.IntegerField(blank=True)
    tar_pueb_past = models.IntegerField(blank=True)
    tar_pueb_puru = models.IntegerField(blank=True)
    tar_pueb_sala = models.IntegerField(blank=True)
    tar_pueb_sara = models.IntegerField(blank=True)
    tar_pueb_toma = models.IntegerField(blank=True)
    tar_pueb_wara = models.IntegerField(blank=True)
    tar_1ano_1rad_fipv = models.IntegerField(blank=True)
    tar_1ano_1rad_hbpe = models.IntegerField(blank=True)
    tar_1ano_1rad_dpt = models.IntegerField(blank=True)
    tar_1ano_2dad_fipv = models.IntegerField(blank=True)
    tar_1ano_2dad_hbpe = models.IntegerField(blank=True)
    tar_1ano_2dad_dpt = models.IntegerField(blank=True)
    tar_1ano_3rad_bopv = models.IntegerField(blank=True)
    tar_1ano_3rad_hbpe = models.IntegerField(blank=True)
    tar_1ano_3rad_dpt = models.IntegerField(blank=True)
    tar_2ano_1rad_fipv = models.IntegerField(blank=True)
    tar_2ano_1rad_srp = models.IntegerField(blank=True)
    tar_2ano_1rad_hbpe = models.IntegerField(blank=True)
    tar_2ano_1rad_dpt = models.IntegerField(blank=True)
    tar_2ano_2dad_fipv = models.IntegerField(blank=True)
    tar_2ano_2dad_srp = models.IntegerField(blank=True)
    tar_2ano_2dad_hbpe = models.IntegerField(blank=True)
    tar_2ano_2dad_dpt = models.IntegerField(blank=True)
    tar_2ano_3rad_bopv = models.IntegerField(blank=True)
    tar_2ano_3rad_hbpe = models.IntegerField(blank=True)
    tar_2ano_3rad_dpt = models.IntegerField(blank=True)
    tar_2ano_4tad_bopv = models.IntegerField(blank=True)
    tar_2ano_4tad_dpt = models.IntegerField(blank=True)
    tar_2ano_dosi_fa = models.IntegerField(blank=True)
    tar_3ano_1rad_fipv = models.IntegerField(blank=True)
    tar_3ano_1rad_srp = models.IntegerField(blank=True)
    tar_3ano_1rad_hbpe = models.IntegerField(blank=True)
    tar_3ano_1rad_dpt = models.IntegerField(blank=True)
    tar_3ano_2dad_fipv = models.IntegerField(blank=True)
    tar_3ano_2dad_srp = models.IntegerField(blank=True)
    tar_3ano_2dad_hbpe = models.IntegerField(blank=True)
    tar_3ano_2dad_dpt = models.IntegerField(blank=True)
    tar_3ano_3rad_bopv = models.IntegerField(blank=True)
    tar_3ano_3rad_hbpe = models.IntegerField(blank=True)
    tar_3ano_3rad_dpt = models.IntegerField(blank=True)
    tar_3ano_4tad_bopv = models.IntegerField(blank=True)
    tar_3ano_4tad_dpt = models.IntegerField(blank=True)
    tar_3ano_dosi_fa = models.IntegerField(blank=True)
    tar_4ano_1rad_fipv = models.IntegerField(blank=True)
    tar_4ano_1rad_srp = models.IntegerField(blank=True)
    tar_4ano_1rad_hbpe = models.IntegerField(blank=True)
    tar_4ano_1rad_dpt = models.IntegerField(blank=True)
    tar_4ano_2dad_fipv = models.IntegerField(blank=True)
    tar_4ano_2dad_srp = models.IntegerField(blank=True)
    tar_4ano_2dad_hbpe = models.IntegerField(blank=True)
    tar_4ano_2dad_dpt = models.IntegerField(blank=True)
    tar_4ano_3rad_bopv = models.IntegerField(blank=True)
    tar_4ano_3rad_hbpe = models.IntegerField(blank=True)
    tar_4ano_3rad_dpt = models.IntegerField(blank=True)
    tar_4ano_4tad_bopv = models.IntegerField(blank=True)
    tar_4ano_4tad_dpt = models.IntegerField(blank=True)
    tar_4ano_dosi_fa = models.IntegerField(blank=True)
    tar_5ano_1rad_ipv = models.IntegerField(blank=True)
    tar_5ano_1rad_srp = models.IntegerField(blank=True)
    tar_5ano_1rad_hbpe = models.IntegerField(blank=True)
    tar_5ano_1rad_dpt = models.IntegerField(blank=True)
    tar_5ano_2dad_fipv = models.IntegerField(blank=True)
    tar_5ano_2dad_srp = models.IntegerField(blank=True)
    tar_5ano_2dad_hbpe = models.IntegerField(blank=True)
    tar_5ano_2dad_dpt = models.IntegerField(blank=True)
    tar_5ano_3rad_bopv = models.IntegerField(blank=True)
    tar_5ano_3rad_hbpe = models.IntegerField(blank=True)
    tar_5ano_3rad_dpt = models.IntegerField(blank=True)
    tar_5ano_4tad_bopv = models.IntegerField(blank=True)
    tar_5ano_4tad_dpt = models.IntegerField(blank=True)
    tar_5ano_dosi_fa = models.IntegerField(blank=True)
    tar_6ano_1rad_srp = models.IntegerField(blank=True)
    tar_6ano_2dad_srp = models.IntegerField(blank=True)
    tar_6ano_dosi_fa = models.IntegerField(blank=True)
    tar_7ano_1rad_sr = models.IntegerField(blank=True)
    tar_7ano_2dad_sr = models.IntegerField(blank=True)
    tar_7ano_dosi_fa = models.IntegerField(blank=True)
    tar_8ano_dosi_fa = models.IntegerField(blank=True)
    tar_7a14_dosi_dtad = models.IntegerField(blank=True)
    tar_9a14_dosi_fa = models.IntegerField(blank=True)
    tar_15a19_dosi_fa = models.IntegerField(blank=True)
    tar_20a59_dosi_fa = models.IntegerField(blank=True)
    tar_8a14_1rad_sr = models.IntegerField(blank=True)
    tar_8a14_2dad_sr = models.IntegerField(blank=True)
    tar_15a29_1rad_sr = models.IntegerField(blank=True)
    tar_15a29_2dad_sr = models.IntegerField(blank=True)
    tar_30a50_1rad_sr = models.IntegerField(blank=True)
    tar_30a50_2dad_sr = models.IntegerField(blank=True)
    tar_16a49mefne_dtad_prim = models.IntegerField(blank=True)
    tar_16a49mefne_dtad_segu = models.IntegerField(blank=True)
    tar_16a49mefne_dtad_terc = models.IntegerField(blank=True)
    tar_16a49mefne_dtad_cuar = models.IntegerField(blank=True)
    tar_16a49mefne_dtad_quin = models.IntegerField(blank=True)
    tar_mefe_dtad_prim = models.IntegerField(blank=True)
    tar_mefe_dtad_segu = models.IntegerField(blank=True)
    tar_mefe_dtad_terc = models.IntegerField(blank=True)
    tar_mefe_dtad_cuar = models.IntegerField(blank=True)
    tar_mefe_dtad_quin = models.IntegerField(blank=True)
    tar_16a49_dtad_prim = models.IntegerField(blank=True)
    tar_16a49_dtad_segu = models.IntegerField(blank=True)
    tar_16a49_dtad_terc = models.IntegerField(blank=True)
    tar_16a49_dtad_cuar = models.IntegerField(blank=True)
    tar_16a49_dtad_quin = models.IntegerField(blank=True)
    tar_hepa_trasal_prim = models.IntegerField(blank=True)
    tar_hepa_trasal_segu = models.IntegerField(blank=True)
    tar_hepa_trasal_terc = models.IntegerField(blank=True)
    tar_hepa_estsal_prim = models.IntegerField(blank=True)
    tar_hepa_estsal_segu = models.IntegerField(blank=True)
    tar_hepa_estsal_terc = models.IntegerField(blank=True)
    tar_hepa_trasex_prim = models.IntegerField(blank=True)
    tar_hepa_trasex_segu = models.IntegerField(blank=True)
    tar_hepa_trasex_terc = models.IntegerField(blank=True)
    tar_hepa_pervih_prim = models.IntegerField(blank=True)
    tar_hepa_pervih_segu = models.IntegerField(blank=True)
    tar_hepa_pervih_terc = models.IntegerField(blank=True)
    tar_hepa_perppl_prim = models.IntegerField(blank=True)
    tar_hepa_perppl_segu = models.IntegerField(blank=True)
    tar_hepa_perppl_terc = models.IntegerField(blank=True)
    tar_hepa_otro_prim = models.IntegerField(blank=True)
    tar_hepa_otro_segu = models.IntegerField(blank=True)
    tar_hepa_otro_terc = models.IntegerField(blank=True)
    tar_inmant = models.IntegerField(blank=True)
    tar_inmanthep = models.IntegerField(blank=True)
    tar_inmantrra = models.IntegerField(blank=True)
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
    des_bcg_dosapli = models.IntegerField(default=0)
    des_bcg_pervacenfabi = models.IntegerField(default=0)
    des_bcg_pervacfrasnoabi = models.IntegerField(default=0)
    des_hbpe_dosapli = models.IntegerField(default=0)
    des_hbpe_pervacenfabi = models.IntegerField(default=0)
    des_hbpe_pervacfrasnoabi = models.IntegerField(default=0)
    des_rota_dosapli = models.IntegerField(default=0)
    des_rota_pervacenfabi = models.IntegerField(default=0)
    des_rota_pervacfrasnoabi = models.IntegerField(default=0)
    des_pent_dosapli = models.IntegerField(default=0)
    des_pent_pervacenfabi = models.IntegerField(default=0)
    des_pent_pervacfrasnoabi = models.IntegerField(default=0)
    des_fipv_dosapli = models.IntegerField(default=0)
    des_fipv_pervacenfabi = models.IntegerField(default=0)
    des_fipv_pervacfrasnoabi = models.IntegerField(default=0)
    des_anti_dosapli = models.IntegerField(default=0)
    des_anti_pervacenfabi = models.IntegerField(default=0)
    des_anti_pervacfrasnoabi = models.IntegerField(default=0)
    des_neum_dosapli = models.IntegerField(default=0)
    des_neum_pervacenfabi = models.IntegerField(default=0)
    des_neum_pervacfrasnoabi = models.IntegerField(default=0)
    des_sr_dosapli = models.IntegerField(default=0)
    des_sr_pervacenfabi = models.IntegerField(default=0)
    des_sr_pervacfrasnoabi = models.IntegerField(default=0)
    des_srp_dosapli = models.IntegerField(default=0)
    des_srp_pervacenfabi = models.IntegerField(default=0)
    des_srp_pervacfrasnoabi = models.IntegerField(default=0)
    des_vari_dosapli = models.IntegerField(default=0)
    des_vari_pervacenfabi = models.IntegerField(default=0)
    des_vari_pervacfrasnoabi = models.IntegerField(default=0)
    des_fieb_dosapli = models.IntegerField(default=0)
    des_fieb_pervacenfabi = models.IntegerField(default=0)
    des_fieb_pervacfrasnoabi = models.IntegerField(default=0)
    des_dift_dosapli = models.IntegerField(default=0)
    des_dift_pervacenfabi = models.IntegerField(default=0)
    des_dift_pervacfrasnoabi = models.IntegerField(default=0)
    des_hpv_dosapli = models.IntegerField(default=0)
    des_hpv_pervacenfabi = models.IntegerField(default=0)
    des_hpv_pervacfrasnoabi = models.IntegerField(default=0)
    des_dtad_dosapli = models.IntegerField(default=0)
    des_dtad_pervacenfabi = models.IntegerField(default=0)
    des_dtad_pervacfrasnoabi = models.IntegerField(default=0)
    des_hepa_dosapli = models.IntegerField(default=0)
    des_hepa_pervacenfabi = models.IntegerField(default=0)
    des_hepa_pervacfrasnoabi = models.IntegerField(default=0)
    des_inmant_dosapli = models.IntegerField(default=0)
    des_inmant_pervacenfabi = models.IntegerField(default=0)
    des_inmant_pervacfrasnoabi = models.IntegerField(default=0)
    des_inmanthepb_dosapli = models.IntegerField(default=0)
    des_inmanthepb_pervacenfabi = models.IntegerField(default=0)
    des_inmanthepb_pervacfrasnoabi = models.IntegerField(default=0)
    des_inmantrra_dosapli = models.IntegerField(default=0)
    des_inmantrra_pervacenfabi = models.IntegerField(default=0)
    des_inmantrra_pervacfrasnoabi = models.IntegerField(default=0)
    des_infped_dosapli = models.IntegerField(default=0)
    des_infped_pervacenfabi = models.IntegerField(default=0)
    des_infped_pervacfrasnoabi = models.IntegerField(default=0)
    des_infadu_dosapli = models.IntegerField(default=0)
    des_infadu_pervacenfabi = models.IntegerField(default=0)
    des_infadu_pervacfrasnoabi = models.IntegerField(default=0)
    des_viru_dosapli = models.IntegerField(default=0)
    des_viru_pervacenfabi = models.IntegerField(default=0)
    des_viru_pervacfrasnoabi = models.IntegerField(default=0)
    des_vacsin_dosapli = models.IntegerField(default=0)
    des_vacsin_pervacenfabi = models.IntegerField(default=0)
    des_vacsin_pervacfrasnoabi = models.IntegerField(default=0)
    des_vacpfi_dosapli = models.IntegerField(default=0)
    des_vacpfi_pervacenfabi = models.IntegerField(default=0)
    des_vacpfi_pervacfrasnoabi = models.IntegerField(default=0)
    des_vacmod_dosapli = models.IntegerField(default=0)
    des_vacmod_pervacenfabi = models.IntegerField(default=0)
    des_vacmod_pervacfrasnoabi = models.IntegerField(default=0)
    des_vacvphcam_dosapli = models.IntegerField(default=0)
    des_vacvphcam_pervacenfabi = models.IntegerField(default=0)
    des_vacvphcam_pervacfrasnoabi = models.IntegerField(default=0)
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

    def clean(self):
        # Verificar si hay fechas repetidas
        if desperdicio.objects.filter(des_fech=self.des_fech).exists() and not self.des_tota:
            raise ValidationError(
                'La fecha des_fech no puede repetirse a menos que des_tota sea True.')

    def save(self, *args, **kwargs):
        self.clean()  # Llamar a la validación personalizada
        super(desperdicio, self).save(*args, **kwargs)

    @classmethod
    def actualizar_desperdicio(cls, fecha, eniUser_id):
        # Obtener el primer y último día del mes
        primer_dia_mes = fecha.replace(day=1)
        ultimo_dia_mes = (fecha.replace(day=28) +
                          timedelta(days=4)).replace(day=1) - timedelta(days=1)

        # Crear o actualizar el registro del día específico
        desperdicio, created = cls.objects.get_or_create(des_fech=fecha, eniUser_id=eniUser_id, defaults={
            'des_bcg_dosapli': 0,
            'des_bcg_pervacenfabi': 0,
            'des_bcg_pervacfrasnoabi': 0,
            'des_hbpe_dosapli': 0,
            'des_hbpe_pervacenfabi': 0,
            'des_hbpe_pervacfrasnoabi': 0,
            'des_rota_dosapli': 0,
            'des_rota_pervacenfabi': 0,
            'des_rota_pervacfrasnoabi': 0,
            'des_pent_dosapli': 0,
            'des_pent_pervacenfabi': 0,
            'des_pent_pervacfrasnoabi': 0,
            'des_fipv_dosapli': 0,
            'des_fipv_pervacenfabi': 0,
            'des_fipv_pervacfrasnoabi': 0,
            'des_anti_dosapli': 0,
            'des_anti_pervacenfabi': 0,
            'des_anti_pervacfrasnoabi': 0,
            'des_neum_dosapli': 0,
            'des_neum_pervacenfabi': 0,
            'des_neum_pervacfrasnoabi': 0,
            'des_sr_dosapli': 0,
            'des_sr_pervacenfabi': 0,
            'des_sr_pervacfrasnoabi': 0,
            'des_srp_dosapli': 0,
            'des_srp_pervacenfabi': 0,
            'des_srp_pervacfrasnoabi': 0,
            'des_vari_dosapli': 0,
            'des_vari_pervacenfabi': 0,
            'des_vari_pervacfrasnoabi': 0,
            'des_fieb_dosapli': 0,
            'des_fieb_pervacenfabi': 0,
            'des_fieb_pervacfrasnoabi': 0,
            'des_dift_dosapli': 0,
            'des_dift_pervacenfabi': 0,
            'des_dift_pervacfrasnoabi': 0,
            'des_hpv_dosapli': 0,
            'des_hpv_pervacenfabi': 0,
            'des_hpv_pervacfrasnoabi': 0,
            'des_dtad_dosapli': 0,
            'des_dtad_pervacenfabi': 0,
            'des_dtad_pervacfrasnoabi': 0,
            'des_hepa_dosapli': 0,
            'des_hepa_pervacenfabi': 0,
            'des_hepa_pervacfrasnoabi': 0,
            'des_inmant_dosapli': 0,
            'des_inmant_pervacenfabi': 0,
            'des_inmant_pervacfrasnoabi': 0,
            'des_inmanthepb_dosapli': 0,
            'des_inmanthepb_pervacenfabi': 0,
            'des_inmanthepb_pervacfrasnoabi': 0,
            'des_inmantrra_dosapli': 0,
            'des_inmantrra_pervacenfabi': 0,
            'des_inmantrra_pervacfrasnoabi': 0,
            'des_infped_dosapli': 0,
            'des_infped_pervacenfabi': 0,
            'des_infped_pervacfrasnoabi': 0,
            'des_infadu_dosapli': 0,
            'des_infadu_pervacenfabi': 0,
            'des_infadu_pervacfrasnoabi': 0,
            'des_viru_dosapli': 0,
            'des_viru_pervacenfabi': 0,
            'des_viru_pervacfrasnoabi': 0,
            'des_vacsin_dosapli': 0,
            'des_vacsin_pervacenfabi': 0,
            'des_vacsin_pervacfrasnoabi': 0,
            'des_vacpfi_dosapli': 0,
            'des_vacpfi_pervacenfabi': 0,
            'des_vacpfi_pervacfrasnoabi': 0,
            'des_vacmod_dosapli': 0,
            'des_vacmod_pervacenfabi': 0,
            'des_vacmod_pervacfrasnoabi': 0,
            'des_vacvphcam_dosapli': 0,
            'des_vacvphcam_pervacenfabi': 0,
            'des_vacvphcam_pervacfrasnoabi': 0,
            'des_tota': False
        })
        desperdicio.des_vacmod_dosapli += 1
        desperdicio.save()

        # Crear o actualizar el registro del último día del mes
        try:
            desperdicio_mes, created = cls.objects.get_or_create(
                des_fech=ultimo_dia_mes,
                eniUser_id=eniUser_id,
                defaults={
                    'des_bcg_dosapli': 0,
                    'des_bcg_pervacenfabi': 0,
                    'des_bcg_pervacfrasnoabi': 0,
                    'des_hbpe_dosapli': 0,
                    'des_hbpe_pervacenfabi': 0,
                    'des_hbpe_pervacfrasnoabi': 0,
                    'des_rota_dosapli': 0,
                    'des_rota_pervacenfabi': 0,
                    'des_rota_pervacfrasnoabi': 0,
                    'des_pent_dosapli': 0,
                    'des_pent_pervacenfabi': 0,
                    'des_pent_pervacfrasnoabi': 0,
                    'des_fipv_dosapli': 0,
                    'des_fipv_pervacenfabi': 0,
                    'des_fipv_pervacfrasnoabi': 0,
                    'des_anti_dosapli': 0,
                    'des_anti_pervacenfabi': 0,
                    'des_anti_pervacfrasnoabi': 0,
                    'des_neum_dosapli': 0,
                    'des_neum_pervacenfabi': 0,
                    'des_neum_pervacfrasnoabi': 0,
                    'des_sr_dosapli': 0,
                    'des_sr_pervacenfabi': 0,
                    'des_sr_pervacfrasnoabi': 0,
                    'des_srp_dosapli': 0,
                    'des_srp_pervacenfabi': 0,
                    'des_srp_pervacfrasnoabi': 0,
                    'des_vari_dosapli': 0,
                    'des_vari_pervacenfabi': 0,
                    'des_vari_pervacfrasnoabi': 0,
                    'des_fieb_dosapli': 0,
                    'des_fieb_pervacenfabi': 0,
                    'des_fieb_pervacfrasnoabi': 0,
                    'des_dift_dosapli': 0,
                    'des_dift_pervacenfabi': 0,
                    'des_dift_pervacfrasnoabi': 0,
                    'des_hpv_dosapli': 0,
                    'des_hpv_pervacenfabi': 0,
                    'des_hpv_pervacfrasnoabi': 0,
                    'des_dtad_dosapli': 0,
                    'des_dtad_pervacenfabi': 0,
                    'des_dtad_pervacfrasnoabi': 0,
                    'des_hepa_dosapli': 0,
                    'des_hepa_pervacenfabi': 0,
                    'des_hepa_pervacfrasnoabi': 0,
                    'des_inmant_dosapli': 0,
                    'des_inmant_pervacenfabi': 0,
                    'des_inmant_pervacfrasnoabi': 0,
                    'des_inmanthepb_dosapli': 0,
                    'des_inmanthepb_pervacenfabi': 0,
                    'des_inmanthepb_pervacfrasnoabi': 0,
                    'des_inmantrra_dosapli': 0,
                    'des_inmantrra_pervacenfabi': 0,
                    'des_inmantrra_pervacfrasnoabi': 0,
                    'des_infped_dosapli': 0,
                    'des_infped_pervacenfabi': 0,
                    'des_infped_pervacfrasnoabi': 0,
                    'des_infadu_dosapli': 0,
                    'des_infadu_pervacenfabi': 0,
                    'des_infadu_pervacfrasnoabi': 0,
                    'des_viru_dosapli': 0,
                    'des_viru_pervacenfabi': 0,
                    'des_viru_pervacfrasnoabi': 0,
                    'des_vacsin_dosapli': 0,
                    'des_vacsin_pervacenfabi': 0,
                    'des_vacsin_pervacfrasnoabi': 0,
                    'des_vacpfi_dosapli': 0,
                    'des_vacpfi_pervacenfabi': 0,
                    'des_vacpfi_pervacfrasnoabi': 0,
                    'des_vacmod_dosapli': 0,
                    'des_vacmod_pervacenfabi': 0,
                    'des_vacmod_pervacfrasnoabi': 0,
                    'des_vacvphcam_dosapli': 0,
                    'des_vacvphcam_pervacenfabi': 0,
                    'des_vacvphcam_pervacfrasnoabi': 0,
                    'des_tota': True
                }
            )
        except IntegrityError:
            desperdicio_mes = cls.objects.get(
                des_fech=ultimo_dia_mes, eniUser_id=eniUser_id, des_tota=True)

        # Obtener la suma de todas las columnas de desperdicio
        suma_campos = cls.objects.filter(
            des_fech__range=(primer_dia_mes, ultimo_dia_mes),
            eniUser_id=eniUser_id, des_tota=False
        ).aggregate(
            des_bcg_dosapli=models.Sum('des_bcg_dosapli'),
            des_bcg_pervacenfabi=models.Sum('des_bcg_pervacenfabi'),
            des_bcg_pervacfrasnoabi=models.Sum('des_bcg_pervacfrasnoabi'),
            des_hbpe_dosapli=models.Sum('des_hbpe_dosapli'),
            des_hbpe_pervacenfabi=models.Sum('des_hbpe_pervacenfabi'),
            des_hbpe_pervacfrasnoabi=models.Sum('des_hbpe_pervacfrasnoabi'),
            des_rota_dosapli=models.Sum('des_rota_dosapli'),
            des_rota_pervacenfabi=models.Sum('des_rota_pervacenfabi'),
            des_rota_pervacfrasnoabi=models.Sum('des_rota_pervacfrasnoabi'),
            des_pent_dosapli=models.Sum('des_pent_dosapli'),
            des_pent_pervacenfabi=models.Sum('des_pent_pervacenfabi'),
            des_pent_pervacfrasnoabi=models.Sum('des_pent_pervacfrasnoabi'),
            des_fipv_dosapli=models.Sum('des_fipv_dosapli'),
            des_fipv_pervacenfabi=models.Sum('des_fipv_pervacenfabi'),
            des_fipv_pervacfrasnoabi=models.Sum('des_fipv_pervacfrasnoabi'),
            des_anti_dosapli=models.Sum('des_anti_dosapli'),
            des_anti_pervacenfabi=models.Sum('des_anti_pervacenfabi'),
            des_anti_pervacfrasnoabi=models.Sum('des_anti_pervacfrasnoabi'),
            des_neum_dosapli=models.Sum('des_neum_dosapli'),
            des_neum_pervacenfabi=models.Sum('des_neum_pervacenfabi'),
            des_neum_pervacfrasnoabi=models.Sum('des_neum_pervacfrasnoabi'),
            des_sr_dosapli=models.Sum('des_sr_dosapli'),
            des_sr_pervacenfabi=models.Sum('des_sr_pervacenfabi'),
            des_sr_pervacfrasnoabi=models.Sum('des_sr_pervacfrasnoabi'),
            des_srp_dosapli=models.Sum('des_srp_dosapli'),
            des_srp_pervacenfabi=models.Sum('des_srp_pervacenfabi'),
            des_srp_pervacfrasnoabi=models.Sum('des_srp_pervacfrasnoabi'),
            des_vari_dosapli=models.Sum('des_vari_dosapli'),
            des_vari_pervacenfabi=models.Sum('des_vari_pervacenfabi'),
            des_vari_pervacfrasnoabi=models.Sum('des_vari_pervacfrasnoabi'),
            des_fieb_dosapli=models.Sum('des_fieb_dosapli'),
            des_fieb_pervacenfabi=models.Sum('des_fieb_pervacenfabi'),
            des_fieb_pervacfrasnoabi=models.Sum('des_fieb_pervacfrasnoabi'),
            des_dift_dosapli=models.Sum('des_dift_dosapli'),
            des_dift_pervacenfabi=models.Sum('des_dift_pervacenfabi'),
            des_dift_pervacfrasnoabi=models.Sum('des_dift_pervacfrasnoabi'),
            des_hpv_dosapli=models.Sum('des_hpv_dosapli'),
            des_hpv_pervacenfabi=models.Sum('des_hpv_pervacenfabi'),
            des_hpv_pervacfrasnoabi=models.Sum('des_hpv_pervacfrasnoabi'),
            des_dtad_dosapli=models.Sum('des_dtad_dosapli'),
            des_dtad_pervacenfabi=models.Sum('des_dtad_pervacenfabi'),
            des_dtad_pervacfrasnoabi=models.Sum('des_dtad_pervacfrasnoabi'),
            des_hepa_dosapli=models.Sum('des_hepa_dosapli'),
            des_hepa_pervacenfabi=models.Sum('des_hepa_pervacenfabi'),
            des_hepa_pervacfrasnoabi=models.Sum('des_hepa_pervacfrasnoabi'),
            des_inmant_dosapli=models.Sum('des_inmant_dosapli'),
            des_inmant_pervacenfabi=models.Sum('des_inmant_pervacenfabi'),
            des_inmant_pervacfrasnoabi=models.Sum(
                'des_inmant_pervacfrasnoabi'),
            des_inmanthepb_dosapli=models.Sum('des_inmanthepb_dosapli'),
            des_inmanthepb_pervacenfabi=models.Sum(
                'des_inmanthepb_pervacenfabi'),
            des_inmanthepb_pervacfrasnoabi=models.Sum(
                'des_inmanthepb_pervacfrasnoabi'),
            des_inmantrra_dosapli=models.Sum('des_inmantrra_dosapli'),
            des_inmantrra_pervacenfabi=models.Sum(
                'des_inmantrra_pervacenfabi'),
            des_inmantrra_pervacfrasnoabi=models.Sum(
                'des_inmantrra_pervacfrasnoabi'),
            des_infped_dosapli=models.Sum('des_infped_dosapli'),
            des_infped_pervacenfabi=models.Sum('des_infped_pervacenfabi'),
            des_infped_pervacfrasnoabi=models.Sum(
                'des_infped_pervacfrasnoabi'),
            des_infadu_dosapli=models.Sum('des_infadu_dosapli'),
            des_infadu_pervacenfabi=models.Sum('des_infadu_pervacenfabi'),
            des_infadu_pervacfrasnoabi=models.Sum(
                'des_infadu_pervacfrasnoabi'),
            des_viru_dosapli=models.Sum('des_viru_dosapli'),
            des_viru_pervacenfabi=models.Sum('des_viru_pervacenfabi'),
            des_viru_pervacfrasnoabi=models.Sum('des_viru_pervacfrasnoabi'),
            des_vacsin_dosapli=models.Sum('des_vacsin_dosapli'),
            des_vacsin_pervacenfabi=models.Sum('des_vacsin_pervacenfabi'),
            des_vacsin_pervacfrasnoabi=models.Sum(
                'des_vacsin_pervacfrasnoabi'),
            des_vacpfi_dosapli=models.Sum('des_vacpfi_dosapli'),
            des_vacpfi_pervacenfabi=models.Sum('des_vacpfi_pervacenfabi'),
            des_vacpfi_pervacfrasnoabi=models.Sum(
                'des_vacpfi_pervacfrasnoabi'),
            des_vacmod_dosapli=models.Sum('des_vacmod_dosapli'),
            des_vacmod_pervacenfabi=models.Sum('des_vacmod_pervacenfabi'),
            des_vacmod_pervacfrasnoabi=models.Sum(
                'des_vacmod_pervacfrasnoabi'),
            des_vacvphcam_dosapli=models.Sum('des_vacvphcam_dosapli'),
            des_vacvphcam_pervacenfabi=models.Sum(
                'des_vacvphcam_pervacenfabi'),
            des_vacvphcam_pervacfrasnoabi=models.Sum(
                'des_vacvphcam_pervacfrasnoabi')
        )

        # Actualizar los campos del registro del último día del mes
        for campo, valor in suma_campos.items():
            setattr(desperdicio_mes, campo, valor or 0)

        desperdicio_mes.save()


class registroVacunado(models.Model):
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
    vac_reg_fech_anio_mes_dia_dosi_exte = models.IntegerField(blank=True)
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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        desperdicio.actualizar_desperdicio(
            self.vac_reg_ano_mes_dia_apli, self.eniUser_id)
