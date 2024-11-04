from django.contrib import admin
from .models import eniUser, unidad_salud, temprano
from .forms import CustomUserChangeForm, CustomUserCreationFrom
from django.contrib.auth.admin import UserAdmin

# Register your models here.


@admin.register(eniUser)
class CustomAdminUser(UserAdmin):
    add_form = CustomUserCreationFrom
    form = CustomUserChangeForm

    model = eniUser


admin.site.register(unidad_salud)

admin.site.register(temprano)
