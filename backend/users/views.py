import logging

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    LogoutSerializer,
    UserSerializer,
)


logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    
    Register a new user account.
    
    Request Body:
    {
        "email": "driver@example.com",
        "password": "SecurePass123!",
        "password_confirm": "SecurePass123!",
        "name": "John Doe",
        "company_name": "ABC Trucking",  // optional
        "truck_number": "1234",          // optional
        "home_terminal": "Green Bay, WI" // optional
    }
    
    Response 201:
    {
        "user": {
            "id": "uuid",
            "email": "driver@example.com",
            "name": "John Doe",
            ...
        },
        "tokens": {
            "access": "eyJ...",
            "refresh": "eyJ..."
        }
    }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Validation failed',
                    'code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user registered: {user.email}")
        
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    
    Authenticate a user and return JWT tokens.
    
    Request Body:
    {
        "email": "driver@example.com",
        "password": "SecurePass123!"
    }
    
    Response 200:
    {
        "user": {
            "id": "uuid",
            "email": "driver@example.com",
            "name": "John Doe",
            ...
        },
        "tokens": {
            "access": "eyJ...",
            "refresh": "eyJ..."
        }
    }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            # Check if it's a credentials error
            if 'error' in serializer.errors:
                return Response(
                    {
                        'error': 'Invalid credentials',
                        'code': 'UNAUTHORIZED'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response(
                {
                    'error': 'Validation failed',
                    'code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"User logged in: {user.email}")
        
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            },
            status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Logout user by blacklisting the refresh token.
    
    Request Body:
    {
        "refresh": "eyJ..."
    }
    
    Response 200:
    {
        "message": "Successfully logged out"
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid token',
                    'code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            serializer.save()
            logger.info(f"User logged out: {request.user.email}")
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response(
                {
                    'error': 'Failed to logout',
                    'code': 'SERVER_ERROR'
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class RefreshTokenView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    
    Refresh the access token using a valid refresh token.
    
    Request Body:
    {
        "refresh": "eyJ..."
    }
    
    Response 200:
    {
        "access": "eyJ..."
    }
    """

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/auth/me/
    
    Get the current authenticated user's profile.
    
    Response 200:
    {
        "user": {
            "id": "uuid",
            "email": "driver@example.com",
            "name": "John Doe",
            ...
        }
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {'user': UserSerializer(request.user).data},
            status=status.HTTP_200_OK
        )
