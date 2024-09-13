from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.


class eniUser(AbstractUser):
    email = models.EmailField(unique=True)
    fun_sex = models.CharField(max_length=10, blank=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

#    def nombre_completo(self):
#        return self.first_name + " " + self.last_name

#    def __str__(self) -> str:
#        return self.nombre_completo()

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
