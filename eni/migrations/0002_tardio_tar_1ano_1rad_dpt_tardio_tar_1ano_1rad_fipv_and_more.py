# Generated by Django 5.1.1 on 2024-09-13 21:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eni', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tardio',
            name='tar_1ano_1rad_dpt',
            field=models.IntegerField(blank=True, default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tardio',
            name='tar_1ano_1rad_fipv',
            field=models.IntegerField(blank=True, default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tardio',
            name='tar_1ano_1rad_hbpe',
            field=models.IntegerField(blank=True, default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tardio',
            name='tar_1ano_2dad_fipv',
            field=models.IntegerField(blank=True, default=0),
            preserve_default=False,
        ),
    ]
