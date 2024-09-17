# Generated by Django 5.1.1 on 2024-09-17 06:12

import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='eniUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('fun_sex', models.CharField(blank=True, max_length=10)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='desperdicio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('des_fech', models.DateField()),
                ('des_bcg_dosapli', models.IntegerField(blank=True)),
                ('des_bcg_pervacenfabi', models.IntegerField(blank=True)),
                ('des_bcg_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_hbpe_dosapli', models.IntegerField(blank=True)),
                ('des_hbpe_pervacenfabi', models.IntegerField(blank=True)),
                ('des_hbpe_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_rota_dosapli', models.IntegerField(blank=True)),
                ('des_rota_pervacenfabi', models.IntegerField(blank=True)),
                ('des_rota_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_pent_dosapli', models.IntegerField(blank=True)),
                ('des_pent_pervacenfabi', models.IntegerField(blank=True)),
                ('des_pent_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_fipv_dosapli', models.IntegerField(blank=True)),
                ('des_fipv_pervacenfabi', models.IntegerField(blank=True)),
                ('des_fipv_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_anti_dosapli', models.IntegerField(blank=True)),
                ('des_anti_pervacenfabi', models.IntegerField(blank=True)),
                ('des_anti_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_neum_dosapli', models.IntegerField(blank=True)),
                ('des_neum_pervacenfabi', models.IntegerField(blank=True)),
                ('des_neum_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_sr_dosapli', models.IntegerField(blank=True)),
                ('des_sr_pervacenfabi', models.IntegerField(blank=True)),
                ('des_sr_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_srp_dosapli', models.IntegerField(blank=True)),
                ('des_srp_pervacenfabi', models.IntegerField(blank=True)),
                ('des_srp_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_vari_dosapli', models.IntegerField(blank=True)),
                ('des_vari_pervacenfabi', models.IntegerField(blank=True)),
                ('des_vari_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_fieb_dosapli', models.IntegerField(blank=True)),
                ('des_fieb_pervacenfabi', models.IntegerField(blank=True)),
                ('des_fieb_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_dift_dosapli', models.IntegerField(blank=True)),
                ('des_dift_pervacenfabi', models.IntegerField(blank=True)),
                ('des_dift_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_hpv_dosapli', models.IntegerField(blank=True)),
                ('des_hpv_pervacenfabi', models.IntegerField(blank=True)),
                ('des_hpv_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_dtad_dosapli', models.IntegerField(blank=True)),
                ('des_dtad_pervacenfabi', models.IntegerField(blank=True)),
                ('des_dtad_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_hepa_dosapli', models.IntegerField(blank=True)),
                ('des_hepa_pervacenfabi', models.IntegerField(blank=True)),
                ('des_hepa_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_inmant_dosapli', models.IntegerField(blank=True)),
                ('des_inmant_pervacenfabi', models.IntegerField(blank=True)),
                ('des_inmant_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_inmanthepb_dosapli', models.IntegerField(blank=True)),
                ('des_inmanthepb_pervacenfabi', models.IntegerField(blank=True)),
                ('des_inmanthepb_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_inmantrra_dosapli', models.IntegerField(blank=True)),
                ('des_inmantrra_pervacenfabi', models.IntegerField(blank=True)),
                ('des_inmantrra_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_infped_dosapli', models.IntegerField(blank=True)),
                ('des_infped_pervacenfabi', models.IntegerField(blank=True)),
                ('des_infped_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_infadu_dosapli', models.IntegerField(blank=True)),
                ('des_infadu_pervacenfabi', models.IntegerField(blank=True)),
                ('des_infadu_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_viru_dosapli', models.IntegerField(blank=True)),
                ('des_viru_pervacenfabi', models.IntegerField(blank=True)),
                ('des_viru_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_vacsin_dosapli', models.IntegerField(blank=True)),
                ('des_vacsin_pervacenfabi', models.IntegerField(blank=True)),
                ('des_vacsin_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_vacpfi_dosapli', models.IntegerField(blank=True)),
                ('des_vacpfi_pervacenfabi', models.IntegerField(blank=True)),
                ('des_vacpfi_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_vacmod_dosapli', models.IntegerField(blank=True)),
                ('des_vacmod_pervacenfabi', models.IntegerField(blank=True)),
                ('des_vacmod_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_vacvphcam_dosapli', models.IntegerField(blank=True)),
                ('des_vacvphcam_pervacenfabi', models.IntegerField(blank=True)),
                ('des_vacvphcam_pervacfrasnoabi', models.IntegerField(blank=True)),
                ('des_tota', models.BooleanField(default=False)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='registroVacunado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('vac_reg_ano_apli', models.IntegerField(blank=True)),
                ('vac_reg_mes_apli', models.IntegerField(blank=True)),
                ('vac_reg_dia_apli', models.IntegerField(blank=True)),
                ('vac_reg_punt_vacu', models.CharField(blank=True, max_length=40)),
                ('vac_reg_unic_esta', models.CharField(blank=True, max_length=8)),
                ('vac_reg_nomb_esta_salu', models.CharField(blank=True, max_length=40)),
                ('vac_reg_zona', models.CharField(blank=True, max_length=8)),
                ('vac_reg_dist', models.CharField(blank=True, max_length=8)),
                ('vac_reg_prov', models.CharField(blank=True, max_length=20)),
                ('vac_reg_cant', models.CharField(blank=True, max_length=30)),
                ('vac_reg_apel', models.CharField(blank=True, max_length=40)),
                ('vac_reg_nomb', models.CharField(blank=True, max_length=40)),
                ('vac_reg_tipo_iden', models.CharField(blank=True, max_length=30)),
                ('vac_reg_nume_iden', models.CharField(blank=True, max_length=20)),
                ('vac_reg_sexo', models.CharField(blank=True, max_length=10)),
                ('vac_reg_ano_naci', models.IntegerField(blank=True)),
                ('vac_reg_mes_naci', models.IntegerField(blank=True)),
                ('vac_reg_dia_naci', models.IntegerField(blank=True)),
                ('vac_reg_naci', models.CharField(blank=True, max_length=30)),
                ('vac_reg_etni', models.CharField(blank=True, max_length=20)),
                ('vac_reg_naci_etni', models.CharField(blank=True, max_length=30)),
                ('vac_reg_pueb', models.CharField(blank=True, max_length=30)),
                ('vac_reg_resi_prov', models.CharField(blank=True, max_length=20)),
                ('vac_reg_resi_cant', models.CharField(blank=True, max_length=30)),
                ('vac_reg_resi_parr', models.CharField(blank=True, max_length=40)),
                ('vac_reg_teld_cont', models.CharField(blank=True, max_length=15)),
                ('vac_reg_corr_elec', models.CharField(blank=True, max_length=40)),
                ('vac_reg_grup_ries', models.CharField(blank=True, max_length=40)),
                ('vac_reg_fase_vacu', models.IntegerField(blank=True)),
                ('vac_reg_esta_vacu', models.CharField(blank=True, max_length=15)),
                ('vac_reg_tipo_esqu', models.CharField(blank=True, max_length=30)),
                ('vac_reg_vacu', models.CharField(blank=True, max_length=40)),
                ('vac_reg_lote_vacu', models.CharField(blank=True, max_length=20)),
                ('vac_reg_dosi_apli', models.IntegerField(blank=True)),
                ('vac_reg_paci_agen', models.CharField(blank=True, max_length=8)),
                ('vac_reg_nomb_vacu', models.CharField(blank=True, max_length=40)),
                ('vac_reg_iden_vacu', models.CharField(blank=True, max_length=20)),
                ('vac_reg_nomb_prof_regi', models.CharField(blank=True, max_length=40)),
                ('vac_reg_reci_dosi_prev_exte', models.CharField(blank=True, max_length=8)),
                ('vac_reg_nomb_dosi_exte', models.CharField(blank=True, max_length=40)),
                ('vac_reg_fech_anio_dosi_exte', models.IntegerField(blank=True)),
                ('vac_reg_fech_mes_dosi_exte', models.IntegerField(blank=True)),
                ('vac_reg_fech_dia_dosi_exte', models.IntegerField(blank=True)),
                ('vac_reg_pais_dosi_exte', models.CharField(blank=True, max_length=30)),
                ('vac_reg_lote_dosi_exte', models.CharField(blank=True, max_length=20)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='tardio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tar_fech', models.DateField()),
                ('tar_intr', models.IntegerField(blank=True)),
                ('tar_extr_mies_cnh', models.IntegerField(blank=True)),
                ('tar_extr_mies_cibv', models.IntegerField(blank=True)),
                ('tar_extr_mine_egen', models.IntegerField(blank=True)),
                ('tar_extr_mine_bach', models.IntegerField(blank=True)),
                ('tar_extr_visi', models.IntegerField(blank=True)),
                ('tar_extr_aten', models.IntegerField(blank=True)),
                ('tar_otro', models.IntegerField(blank=True)),
                ('tar_sexo_homb', models.IntegerField(blank=True)),
                ('tar_sexo_muje', models.IntegerField(blank=True)),
                ('tar_luga_pert', models.IntegerField(blank=True)),
                ('tar_luga_nope', models.IntegerField(blank=True)),
                ('tar_naci_ecua', models.IntegerField(blank=True)),
                ('tar_naci_colo', models.IntegerField(blank=True)),
                ('tar_naci_peru', models.IntegerField(blank=True)),
                ('tar_naci_cuba', models.IntegerField(blank=True)),
                ('tar_naci_vene', models.IntegerField(blank=True)),
                ('tar_naci_otro', models.IntegerField(blank=True)),
                ('tar_auto_indi', models.IntegerField(blank=True)),
                ('tar_auto_afro', models.IntegerField(blank=True)),
                ('tar_auto_negr', models.IntegerField(blank=True)),
                ('tar_auto_mula', models.IntegerField(blank=True)),
                ('tar_auto_mont', models.IntegerField(blank=True)),
                ('tar_auto_mest', models.IntegerField(blank=True)),
                ('tar_auto_blan', models.IntegerField(blank=True)),
                ('tar_auto_otro', models.IntegerField(blank=True)),
                ('tar_naci_achu', models.IntegerField(blank=True)),
                ('tar_naci_ando', models.IntegerField(blank=True)),
                ('tar_naci_awa', models.IntegerField(blank=True)),
                ('tar_naci_chac', models.IntegerField(blank=True)),
                ('tar_naci_cofa', models.IntegerField(blank=True)),
                ('tar_naci_eper', models.IntegerField(blank=True)),
                ('tar_naci_huan', models.IntegerField(blank=True)),
                ('tar_naci_kich', models.IntegerField(blank=True)),
                ('tar_naci_mant', models.IntegerField(blank=True)),
                ('tar_naci_seco', models.IntegerField(blank=True)),
                ('tar_naci_shiw', models.IntegerField(blank=True)),
                ('tar_naci_shua', models.IntegerField(blank=True)),
                ('tar_naci_sion', models.IntegerField(blank=True)),
                ('tar_naci_tsac', models.IntegerField(blank=True)),
                ('tar_naci_waor', models.IntegerField(blank=True)),
                ('tar_naci_zapa', models.IntegerField(blank=True)),
                ('tar_pueb_chib', models.IntegerField(blank=True)),
                ('tar_pueb_kana', models.IntegerField(blank=True)),
                ('tar_pueb_kara', models.IntegerField(blank=True)),
                ('tar_pueb_kaya', models.IntegerField(blank=True)),
                ('tar_pueb_kich', models.IntegerField(blank=True)),
                ('tar_pueb_kisa', models.IntegerField(blank=True)),
                ('tar_pueb_kitu', models.IntegerField(blank=True)),
                ('tar_pueb_nata', models.IntegerField(blank=True)),
                ('tar_pueb_otav', models.IntegerField(blank=True)),
                ('tar_pueb_palt', models.IntegerField(blank=True)),
                ('tar_pueb_panz', models.IntegerField(blank=True)),
                ('tar_pueb_past', models.IntegerField(blank=True)),
                ('tar_pueb_puru', models.IntegerField(blank=True)),
                ('tar_pueb_sala', models.IntegerField(blank=True)),
                ('tar_pueb_sara', models.IntegerField(blank=True)),
                ('tar_pueb_toma', models.IntegerField(blank=True)),
                ('tar_pueb_wara', models.IntegerField(blank=True)),
                ('tar_1ano_1rad_fipv', models.IntegerField(blank=True)),
                ('tar_1ano_1rad_hbpe', models.IntegerField(blank=True)),
                ('tar_1ano_1rad_dpt', models.IntegerField(blank=True)),
                ('tar_1ano_2dad_fipv', models.IntegerField(blank=True)),
                ('tar_1ano_2dad_hbpe', models.IntegerField(blank=True)),
                ('tar_1ano_2dad_dpt', models.IntegerField(blank=True)),
                ('tar_1ano_3rad_bopv', models.IntegerField(blank=True)),
                ('tar_1ano_3rad_hbpe', models.IntegerField(blank=True)),
                ('tar_1ano_3rad_dpt', models.IntegerField(blank=True)),
                ('tar_2ano_1rad_fipv', models.IntegerField(blank=True)),
                ('tar_2ano_1rad_srp', models.IntegerField(blank=True)),
                ('tar_2ano_1rad_hbpe', models.IntegerField(blank=True)),
                ('tar_2ano_1rad_dpt', models.IntegerField(blank=True)),
                ('tar_2ano_2dad_fipv', models.IntegerField(blank=True)),
                ('tar_2ano_2dad_srp', models.IntegerField(blank=True)),
                ('tar_2ano_2dad_hbpe', models.IntegerField(blank=True)),
                ('tar_2ano_2dad_dpt', models.IntegerField(blank=True)),
                ('tar_2ano_3rad_bopv', models.IntegerField(blank=True)),
                ('tar_2ano_3rad_hbpe', models.IntegerField(blank=True)),
                ('tar_2ano_3rad_dpt', models.IntegerField(blank=True)),
                ('tar_2ano_4tad_bopv', models.IntegerField(blank=True)),
                ('tar_2ano_4tad_dpt', models.IntegerField(blank=True)),
                ('tar_2ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_3ano_1rad_fipv', models.IntegerField(blank=True)),
                ('tar_3ano_1rad_srp', models.IntegerField(blank=True)),
                ('tar_3ano_1rad_hbpe', models.IntegerField(blank=True)),
                ('tar_3ano_1rad_dpt', models.IntegerField(blank=True)),
                ('tar_3ano_2dad_fipv', models.IntegerField(blank=True)),
                ('tar_3ano_2dad_srp', models.IntegerField(blank=True)),
                ('tar_3ano_2dad_hbpe', models.IntegerField(blank=True)),
                ('tar_3ano_2dad_dpt', models.IntegerField(blank=True)),
                ('tar_3ano_3rad_bopv', models.IntegerField(blank=True)),
                ('tar_3ano_3rad_hbpe', models.IntegerField(blank=True)),
                ('tar_3ano_3rad_dpt', models.IntegerField(blank=True)),
                ('tar_3ano_4tad_bopv', models.IntegerField(blank=True)),
                ('tar_3ano_4tad_dpt', models.IntegerField(blank=True)),
                ('tar_3ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_4ano_1rad_fipv', models.IntegerField(blank=True)),
                ('tar_4ano_1rad_srp', models.IntegerField(blank=True)),
                ('tar_4ano_1rad_hbpe', models.IntegerField(blank=True)),
                ('tar_4ano_1rad_dpt', models.IntegerField(blank=True)),
                ('tar_4ano_2dad_fipv', models.IntegerField(blank=True)),
                ('tar_4ano_2dad_srp', models.IntegerField(blank=True)),
                ('tar_4ano_2dad_hbpe', models.IntegerField(blank=True)),
                ('tar_4ano_2dad_dpt', models.IntegerField(blank=True)),
                ('tar_4ano_3rad_bopv', models.IntegerField(blank=True)),
                ('tar_4ano_3rad_hbpe', models.IntegerField(blank=True)),
                ('tar_4ano_3rad_dpt', models.IntegerField(blank=True)),
                ('tar_4ano_4tad_bopv', models.IntegerField(blank=True)),
                ('tar_4ano_4tad_dpt', models.IntegerField(blank=True)),
                ('tar_4ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_5ano_1rad_ipv', models.IntegerField(blank=True)),
                ('tar_5ano_1rad_srp', models.IntegerField(blank=True)),
                ('tar_5ano_1rad_hbpe', models.IntegerField(blank=True)),
                ('tar_5ano_1rad_dpt', models.IntegerField(blank=True)),
                ('tar_5ano_2dad_fipv', models.IntegerField(blank=True)),
                ('tar_5ano_2dad_srp', models.IntegerField(blank=True)),
                ('tar_5ano_2dad_hbpe', models.IntegerField(blank=True)),
                ('tar_5ano_2dad_dpt', models.IntegerField(blank=True)),
                ('tar_5ano_3rad_bopv', models.IntegerField(blank=True)),
                ('tar_5ano_3rad_hbpe', models.IntegerField(blank=True)),
                ('tar_5ano_3rad_dpt', models.IntegerField(blank=True)),
                ('tar_5ano_4tad_bopv', models.IntegerField(blank=True)),
                ('tar_5ano_4tad_dpt', models.IntegerField(blank=True)),
                ('tar_5ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_6ano_1rad_srp', models.IntegerField(blank=True)),
                ('tar_6ano_2dad_srp', models.IntegerField(blank=True)),
                ('tar_6ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_7ano_1rad_sr', models.IntegerField(blank=True)),
                ('tar_7ano_2dad_sr', models.IntegerField(blank=True)),
                ('tar_7ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_8ano_dosi_fa', models.IntegerField(blank=True)),
                ('tar_7a14_dosi_dtad', models.IntegerField(blank=True)),
                ('tar_9a14_dosi_fa', models.IntegerField(blank=True)),
                ('tar_15a19_dosi_fa', models.IntegerField(blank=True)),
                ('tar_20a59_dosi_fa', models.IntegerField(blank=True)),
                ('tar_8a14_1rad_sr', models.IntegerField(blank=True)),
                ('tar_8a14_2dad_sr', models.IntegerField(blank=True)),
                ('tar_15a29_1rad_sr', models.IntegerField(blank=True)),
                ('tar_15a29_2dad_sr', models.IntegerField(blank=True)),
                ('tar_30a50_1rad_sr', models.IntegerField(blank=True)),
                ('tar_30a50_2dad_sr', models.IntegerField(blank=True)),
                ('tar_16a49mefne_dtad_prim', models.IntegerField(blank=True)),
                ('tar_16a49mefne_dtad_segu', models.IntegerField(blank=True)),
                ('tar_16a49mefne_dtad_terc', models.IntegerField(blank=True)),
                ('tar_16a49mefne_dtad_cuar', models.IntegerField(blank=True)),
                ('tar_16a49mefne_dtad_quin', models.IntegerField(blank=True)),
                ('tar_mefe_dtad_prim', models.IntegerField(blank=True)),
                ('tar_mefe_dtad_segu', models.IntegerField(blank=True)),
                ('tar_mefe_dtad_terc', models.IntegerField(blank=True)),
                ('tar_mefe_dtad_cuar', models.IntegerField(blank=True)),
                ('tar_mefe_dtad_quin', models.IntegerField(blank=True)),
                ('tar_16a49_dtad_prim', models.IntegerField(blank=True)),
                ('tar_16a49_dtad_segu', models.IntegerField(blank=True)),
                ('tar_16a49_dtad_terc', models.IntegerField(blank=True)),
                ('tar_16a49_dtad_cuar', models.IntegerField(blank=True)),
                ('tar_16a49_dtad_quin', models.IntegerField(blank=True)),
                ('tar_hepa_trasal_prim', models.IntegerField(blank=True)),
                ('tar_hepa_trasal_segu', models.IntegerField(blank=True)),
                ('tar_hepa_trasal_terc', models.IntegerField(blank=True)),
                ('tar_hepa_estsal_prim', models.IntegerField(blank=True)),
                ('tar_hepa_estsal_segu', models.IntegerField(blank=True)),
                ('tar_hepa_estsal_terc', models.IntegerField(blank=True)),
                ('tar_hepa_trasex_prim', models.IntegerField(blank=True)),
                ('tar_hepa_trasex_segu', models.IntegerField(blank=True)),
                ('tar_hepa_trasex_terc', models.IntegerField(blank=True)),
                ('tar_hepa_pervih_prim', models.IntegerField(blank=True)),
                ('tar_hepa_pervih_segu', models.IntegerField(blank=True)),
                ('tar_hepa_pervih_terc', models.IntegerField(blank=True)),
                ('tar_hepa_perppl_prim', models.IntegerField(blank=True)),
                ('tar_hepa_perppl_segu', models.IntegerField(blank=True)),
                ('tar_hepa_perppl_terc', models.IntegerField(blank=True)),
                ('tar_hepa_otro_prim', models.IntegerField(blank=True)),
                ('tar_hepa_otro_segu', models.IntegerField(blank=True)),
                ('tar_hepa_otro_terc', models.IntegerField(blank=True)),
                ('tar_inmant', models.IntegerField(blank=True)),
                ('tar_inmanthep', models.IntegerField(blank=True)),
                ('tar_inmantrra', models.IntegerField(blank=True)),
                ('tar_tota', models.BooleanField(default=False)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='temprano',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tem_fech', models.DateField()),
                ('tem_intr', models.IntegerField(blank=True)),
                ('tem_extr_mies_cnh', models.IntegerField(blank=True)),
                ('tem_extr_mies_cibv', models.IntegerField(blank=True)),
                ('tem_extr_mine_egen', models.IntegerField(blank=True)),
                ('tem_extr_mine_bach', models.IntegerField(blank=True)),
                ('tem_extr_visi', models.IntegerField(blank=True)),
                ('tem_extr_aten', models.IntegerField(blank=True)),
                ('tem_otro', models.IntegerField(blank=True)),
                ('tem_sexo_homb', models.IntegerField(blank=True)),
                ('tem_sexo_muje', models.IntegerField(blank=True)),
                ('tem_luga_pert', models.IntegerField(blank=True)),
                ('tem_luga_nope', models.IntegerField(blank=True)),
                ('tem_naci_ecua', models.IntegerField(blank=True)),
                ('tem_naci_colo', models.IntegerField(blank=True)),
                ('tem_naci_peru', models.IntegerField(blank=True)),
                ('tem_naci_cuba', models.IntegerField(blank=True)),
                ('tem_naci_vene', models.IntegerField(blank=True)),
                ('tem_naci_otro', models.IntegerField(blank=True)),
                ('tem_auto_indi', models.IntegerField(blank=True)),
                ('tem_auto_afro', models.IntegerField(blank=True)),
                ('tem_auto_negr', models.IntegerField(blank=True)),
                ('tem_auto_mula', models.IntegerField(blank=True)),
                ('tem_auto_mont', models.IntegerField(blank=True)),
                ('tem_auto_mest', models.IntegerField(blank=True)),
                ('tem_auto_blan', models.IntegerField(blank=True)),
                ('tem_auto_otro', models.IntegerField(blank=True)),
                ('tem_naci_achu', models.IntegerField(blank=True)),
                ('tem_naci_ando', models.IntegerField(blank=True)),
                ('tem_naci_awa', models.IntegerField(blank=True)),
                ('tem_naci_chac', models.IntegerField(blank=True)),
                ('tem_naci_cofa', models.IntegerField(blank=True)),
                ('tem_naci_eper', models.IntegerField(blank=True)),
                ('tem_naci_huan', models.IntegerField(blank=True)),
                ('tem_naci_kich', models.IntegerField(blank=True)),
                ('tem_naci_mant', models.IntegerField(blank=True)),
                ('tem_naci_seco', models.IntegerField(blank=True)),
                ('tem_naci_shiw', models.IntegerField(blank=True)),
                ('tem_naci_shua', models.IntegerField(blank=True)),
                ('tem_naci_sion', models.IntegerField(blank=True)),
                ('tem_naci_tsac', models.IntegerField(blank=True)),
                ('tem_naci_waor', models.IntegerField(blank=True)),
                ('tem_naci_zapa', models.IntegerField(blank=True)),
                ('tem_pueb_chib', models.IntegerField(blank=True)),
                ('tem_pueb_kana', models.IntegerField(blank=True)),
                ('tem_pueb_kara', models.IntegerField(blank=True)),
                ('tem_pueb_kaya', models.IntegerField(blank=True)),
                ('tem_pueb_kich', models.IntegerField(blank=True)),
                ('tem_pueb_kisa', models.IntegerField(blank=True)),
                ('tem_pueb_kitu', models.IntegerField(blank=True)),
                ('tem_pueb_nata', models.IntegerField(blank=True)),
                ('tem_pueb_otav', models.IntegerField(blank=True)),
                ('tem_pueb_palt', models.IntegerField(blank=True)),
                ('tem_pueb_panz', models.IntegerField(blank=True)),
                ('tem_pueb_past', models.IntegerField(blank=True)),
                ('tem_pueb_puru', models.IntegerField(blank=True)),
                ('tem_pueb_sala', models.IntegerField(blank=True)),
                ('tem_pueb_sara', models.IntegerField(blank=True)),
                ('tem_pueb_toma', models.IntegerField(blank=True)),
                ('tem_pueb_wara', models.IntegerField(blank=True)),
                ('tem_men1_dosi_bcgp', models.IntegerField(blank=True)),
                ('tem_men1_dosi_hbpr', models.IntegerField(blank=True)),
                ('tem_men1_dosi_bcgd', models.IntegerField(blank=True)),
                ('tem_men1_1rad_rota', models.IntegerField(blank=True)),
                ('tem_men1_1rad_fipv', models.IntegerField(blank=True)),
                ('tem_men1_1rad_neum', models.IntegerField(blank=True)),
                ('tem_men1_1rad_pent', models.IntegerField(blank=True)),
                ('tem_men1_2dad_rota', models.IntegerField(blank=True)),
                ('tem_men1_2dad_fipv', models.IntegerField(blank=True)),
                ('tem_men1_2dad_neum', models.IntegerField(blank=True)),
                ('tem_men1_2dad_pent', models.IntegerField(blank=True)),
                ('tem_men1_3rad_bopv', models.IntegerField(blank=True)),
                ('tem_men1_3rad_neum', models.IntegerField(blank=True)),
                ('tem_men1_3rad_pent', models.IntegerField(blank=True)),
                ('tem_12a23m_1rad_srp', models.IntegerField(blank=True)),
                ('tem_12a23m_dosi_fa', models.IntegerField(blank=True)),
                ('tem_12a23m_dosi_vari', models.IntegerField(blank=True)),
                ('tem_12a23m_2dad_srp', models.IntegerField(blank=True)),
                ('tem_12a23m_4tad_bopv', models.IntegerField(blank=True)),
                ('tem_12a23m_4tad_dpt', models.IntegerField(blank=True)),
                ('tem_5ano_5tad_bopv', models.IntegerField(blank=True)),
                ('tem_5ano_5tad_dpt', models.IntegerField(blank=True)),
                ('tem_9ano_1rad_hpv', models.IntegerField(blank=True)),
                ('tem_9ano_2dad_hpv', models.IntegerField(blank=True)),
                ('tem_10an_2dad_hpv', models.IntegerField(blank=True)),
                ('tem_15an_terc_dtad', models.IntegerField(blank=True)),
                ('tem_tota', models.BooleanField(default=False)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='unidadSalud',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uni_zona', models.CharField(blank=True, max_length=10)),
                ('uni_dist', models.CharField(blank=True, max_length=8)),
                ('uni_prov', models.CharField(blank=True, max_length=20)),
                ('uni_cant', models.CharField(blank=True, max_length=30)),
                ('uni_parr', models.CharField(blank=True, max_length=40)),
                ('uni_unic', models.CharField(blank=True, max_length=8)),
                ('uni_unid', models.CharField(blank=True, max_length=40)),
                ('uni_tipo', models.CharField(blank=True, max_length=30)),
                ('uni_nive', models.CharField(blank=True, max_length=8)),
                ('eniUser', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
