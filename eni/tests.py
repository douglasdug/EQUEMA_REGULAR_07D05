from django.test import TestCase
from django.contrib.auth import get_user_model
from eni.serializer import UserRegistrationSerializer, UserLoginSerializer

User = get_user_model()


# python

class UserCreateSerializerTest(TestCase):
    def test_invalid_data(self):
        data = {
            'username': 'invalid',
            'email': 'invalid-email',
            'password1': '',
            'password2': '',
            'fun_tipo_iden': '',
            'fun_sex': '',
            'fun_titu': '',
            'fun_esta': '',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password1', serializer.errors)


class UserLoginSerializerTest(TestCase):
    def test_valid_login(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass')
        data = {
            'username': 'testuser',
            'password': 'testpass',
        }
        serializer = UserLoginSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['user'], user)
