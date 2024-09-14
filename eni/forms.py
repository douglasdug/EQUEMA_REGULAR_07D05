from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import eniUser


class CustomUserCreationFrom(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = eniUser
        fields = ("email",)


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = eniUser
        fields = ("email",)