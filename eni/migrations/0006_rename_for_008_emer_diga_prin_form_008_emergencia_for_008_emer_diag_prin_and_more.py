# Generated by Django 5.1.1 on 2025-07-20 06:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eni', '0005_admision_datos_adm_dato_resi_esta_adsc_terr'),
    ]

    operations = [
        migrations.RenameField(
            model_name='form_008_emergencia',
            old_name='for_008_emer_diga_prin',
            new_name='for_008_emer_diag_prin',
        ),
        migrations.AlterField(
            model_name='form_008_emergencia',
            name='for_008_emer_edad_gest',
            field=models.DecimalField(blank=True, decimal_places=1, help_text='Edad gestacional en semanas (ej: 38,5)', max_digits=4, null=True),
        ),
    ]
