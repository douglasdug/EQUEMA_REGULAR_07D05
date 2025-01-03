# Generated by Django 5.1.1 on 2024-12-20 03:34

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eni', '0009_alter_admision_datos_adm_dato_pers_corr_elec_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='influenza',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('inf_fech', models.DateField()),
                ('inf_intr', models.IntegerField(default=0)),
                ('inf_extr_mies_cnh', models.IntegerField(default=0)),
                ('inf_extr_mies_cibv', models.IntegerField(default=0)),
                ('inf_extr_mine_egen', models.IntegerField(default=0)),
                ('inf_extr_mine_bach', models.IntegerField(default=0)),
                ('inf_extr_visi', models.IntegerField(default=0)),
                ('inf_extr_aten', models.IntegerField(default=0)),
                ('inf_otro', models.IntegerField(default=0)),
                ('inf_sexo_homb', models.IntegerField(default=0)),
                ('inf_sexo_muje', models.IntegerField(default=0)),
                ('inf_luga_pert', models.IntegerField(default=0)),
                ('inf_luga_nope', models.IntegerField(default=0)),
                ('inf_naci_ecua', models.IntegerField(default=0)),
                ('inf_naci_colo', models.IntegerField(default=0)),
                ('inf_naci_peru', models.IntegerField(default=0)),
                ('inf_naci_cuba', models.IntegerField(default=0)),
                ('inf_naci_vene', models.IntegerField(default=0)),
                ('inf_naci_otro', models.IntegerField(default=0)),
                ('inf_auto_indi', models.IntegerField(default=0)),
                ('inf_auto_afro', models.IntegerField(default=0)),
                ('inf_auto_negr', models.IntegerField(default=0)),
                ('inf_auto_mula', models.IntegerField(default=0)),
                ('inf_auto_mont', models.IntegerField(default=0)),
                ('inf_auto_mest', models.IntegerField(default=0)),
                ('inf_auto_blan', models.IntegerField(default=0)),
                ('inf_auto_otro', models.IntegerField(default=0)),
                ('inf_naci_achu', models.IntegerField(default=0)),
                ('inf_naci_ando', models.IntegerField(default=0)),
                ('inf_naci_awa', models.IntegerField(default=0)),
                ('inf_naci_chac', models.IntegerField(default=0)),
                ('inf_naci_cofa', models.IntegerField(default=0)),
                ('inf_naci_eper', models.IntegerField(default=0)),
                ('inf_naci_huan', models.IntegerField(default=0)),
                ('inf_naci_kich', models.IntegerField(default=0)),
                ('inf_naci_mant', models.IntegerField(default=0)),
                ('inf_naci_seco', models.IntegerField(default=0)),
                ('inf_naci_shiw', models.IntegerField(default=0)),
                ('inf_naci_shua', models.IntegerField(default=0)),
                ('inf_naci_sion', models.IntegerField(default=0)),
                ('inf_naci_tsac', models.IntegerField(default=0)),
                ('inf_naci_waor', models.IntegerField(default=0)),
                ('inf_naci_zapa', models.IntegerField(default=0)),
                ('inf_pueb_chib', models.IntegerField(default=0)),
                ('inf_pueb_kana', models.IntegerField(default=0)),
                ('inf_pueb_kara', models.IntegerField(default=0)),
                ('inf_pueb_kaya', models.IntegerField(default=0)),
                ('inf_pueb_kich', models.IntegerField(default=0)),
                ('inf_pueb_kisa', models.IntegerField(default=0)),
                ('inf_pueb_kitu', models.IntegerField(default=0)),
                ('inf_pueb_nata', models.IntegerField(default=0)),
                ('inf_pueb_otav', models.IntegerField(default=0)),
                ('inf_pueb_palt', models.IntegerField(default=0)),
                ('inf_pueb_panz', models.IntegerField(default=0)),
                ('inf_pueb_past', models.IntegerField(default=0)),
                ('inf_pueb_puru', models.IntegerField(default=0)),
                ('inf_pueb_sala', models.IntegerField(default=0)),
                ('inf_pueb_sara', models.IntegerField(default=0)),
                ('inf_pueb_toma', models.IntegerField(default=0)),
                ('inf_pueb_wara', models.IntegerField(default=0)),
                ('inf_6a11_prim', models.IntegerField(default=0)),
                ('inf_6a11_segu', models.IntegerField(default=0)),
                ('inf_1ano_dosi', models.IntegerField(default=0)),
                ('inf_2ano_dosi', models.IntegerField(default=0)),
                ('inf_3ano_dosi', models.IntegerField(default=0)),
                ('inf_4ano_dosi', models.IntegerField(default=0)),
                ('inf_5ano_dosi', models.IntegerField(default=0)),
                ('inf_6ano_dosi', models.IntegerField(default=0)),
                ('inf_7ano_dosi', models.IntegerField(default=0)),
                ('inf_65an_dosi', models.IntegerField(default=0)),
                ('inf_emba_dosi', models.IntegerField(default=0)),
                ('inf_8a64_dosi', models.IntegerField(default=0)),
                ('inf_puer_dosi', models.IntegerField(default=0)),
                ('inf_pers_salu_dosi', models.IntegerField(default=0)),
                ('inf_pers_disc_dosi', models.IntegerField(default=0)),
                ('inf_cuid_adul_dosi', models.IntegerField(default=0)),
                ('inf_pers_cuid_dosi', models.IntegerField(default=0)),
                ('inf_trab_avic_dosi', models.IntegerField(default=0)),
                ('inf_ppl_dosi', models.IntegerField(default=0)),
                ('inf_otro_ries_dosi', models.IntegerField(default=0)),
                ('inf_pobl_gene_dosi', models.IntegerField(default=0)),
                ('inf_tota', models.BooleanField(default=False)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
