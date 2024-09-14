from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import datetime, timedelta

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
<<<<<<< HEAD
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
=======
    tem_men1_dosi_bcgp = models.IntegerField(blank=True)
    tem_men1_dosi_hbpr = models.IntegerField(blank=True)
    tem_men1_dosi_bcgd = models.IntegerField(blank=True)
>>>>>>> 954e220b5a2028e01cdd59462c81c3aa5fb6e907
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

<<<<<<< HEAD
    @receiver(post_save, sender=temprano)
    def create_totals_row(sender, instance, created, **kwargs):
        if created and not instance.tem_tota:
            last_day_of_month = instance.tem_fech.replace(
                day=28) + timedelta(days=4)
            last_day_of_month = last_day_of_month - \
                timedelta(days=last_day_of_month.day)

            totals = temprano.objects.filter(
                tem_fech__year=instance.tem_fech.year,
                tem_fech__month=instance.tem_fech.month,
                tem_tota=False
            ).aggregate(
                tem_intr=models.Sum('tem_intr'),
                tem_extr_mies_cnh=models.Sum('tem_extr_mies_cnh'),
                tem_extr_mies_cibv=models.Sum('tem_extr_mies_cibv'),
                tem_extr_mine_egen=models.Sum('tem_extr_mine_egen'),
                tem_extr_mine_bach=models.Sum('tem_extr_mine_bach'),
                tem_extr_visi=models.Sum('tem_extr_visi'),
                tem_extr_aten=models.Sum('tem_extr_aten'),
                tem_otro=models.Sum('tem_otro'),
                tem_sexo_homb=models.Sum('tem_sexo_homb'),
                tem_sexo_muje=models.Sum('tem_sexo_muje'),
                tem_luga_pert=models.Sum('tem_luga_pert'),
                tem_luga_nope=models.Sum('tem_luga_nope'),
                tem_naci_ecua=models.Sum('tem_naci_ecua'),
                tem_naci_colo=models.Sum('tem_naci_colo'),
                tem_naci_peru=models.Sum('tem_naci_peru'),
                tem_naci_cuba=models.Sum('tem_naci_cuba'),
                tem_naci_vene=models.Sum('tem_naci_vene'),
                tem_naci_otro=models.Sum('tem_naci_otro'),
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
=======

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
            tem_fech__year=year,
            tem_fech__month=month
        ).order_by('tar_fech')


class desperdicio(models.Model):
    des_fech = models.DateField()
    des_bcg_dosapli = models.IntegerField(blank=True)
    des_bcg_pervacenfabi = models.IntegerField(blank=True)
    des_bcg_pervacfrasnoabi = models.IntegerField(blank=True)
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
>>>>>>> 954e220b5a2028e01cdd59462c81c3aa5fb6e907
