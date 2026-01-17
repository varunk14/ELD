from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model (read-only representation)."""

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'company_name', 'truck_number', 
                  'trailer_number', 'home_terminal', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'name', 
                  'company_name', 'truck_number', 'home_terminal']
        extra_kwargs = {
            'email': {'required': True},
            'name': {'required': True},
            'company_name': {'required': False},
            'truck_number': {'required': False},
            'home_terminal': {'required': False},
        }

    def validate_email(self, value):
        """Check that email is unique."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value.lower()

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match'
            })
        return attrs

    def create(self, validated_data):
        """Create and return a new user."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Validate credentials and return user."""
        email = attrs.get('email', '').lower()
        password = attrs.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'error': 'Invalid credentials'
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                'error': 'Invalid credentials'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'error': 'Account is disabled'
            })

        attrs['user'] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout (token blacklisting)."""

    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        """Validate the refresh token."""
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        """Blacklist the refresh token."""
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError({
                'error': 'Invalid or expired token'
            })


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for token response structure."""

    user = UserSerializer(read_only=True)
    tokens = serializers.SerializerMethodField()

    def get_tokens(self, obj):
        """Generate JWT tokens for the user."""
        refresh = RefreshToken.for_user(obj)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that uses email instead of username."""

    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        """Add custom claims to the token."""
        token = super().get_token(user)
        token['email'] = user.email
        token['name'] = user.name
        return token
