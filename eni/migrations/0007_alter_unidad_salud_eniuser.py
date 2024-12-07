# Generated by Django 5.1.1 on 2024-11-17 06:01

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eni', '0006_alter_admision_datos_adm_dato_naci_fech_naci'),
    ]

    operations = [
        migrations.AlterField(
            model_name='unidad_salud',
            name='eniUser',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='unidades_salud', to=settings.AUTH_USER_MODEL),
        ),
    ]