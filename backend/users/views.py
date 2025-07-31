from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.http import Http404
from django.utils.translation import gettext as _
from .models import User
from .serializers import (
    UserRequestSerializer, UserUpdateRequestSerializer, UserResponseSerializer,
    PagedResponseSerializer, ChangePasswordRequestSerializer, RegisterRequestSerializer,
    RegisterVerifyRequestSerializer, LoginFlexibleRequestSerializer, 
    ResetPasswordRequestSerializer, ForgotPasswordEmailRequestSerializer,
)
from .services import AuthService, UserService
from common.enums import UserRole

# Custom permission classes
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN.value

class IsAdminOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [UserRole.ADMIN.value, UserRole.DOCTOR.value]

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (
            request.user.id == obj.id or 
            request.user.role == UserRole.ADMIN.value
        )

class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['get_all_users', 'add_user']:
            permission_classes = [IsAdminUser] 
        elif self.action in ['retrieve', 'get_user_by_id']:
            permission_classes = [IsAdminOrDoctor]
        elif self.action in ['edit_user', 'delete_user', 'change_password']:
            permission_classes = [IsOwnerOrAdmin] 
        else:
            permission_classes = [IsAuthenticated]  
        
        return [permission() for permission in permission_classes]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise Http404

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            return Response(UserResponseSerializer(user).data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='me')
    def get_current_user(self, request):
        return Response(UserResponseSerializer(request.user).data)

    @action(detail=False, methods=['get'], url_path='all')
    def get_all_users(self, request):
        page = int(request.query_params.get('page', 0))
        size = int(request.query_params.get('size', 10))
        data = UserService().get_all_users(page, size)
        return Response(PagedResponseSerializer(data).data)

    @action(detail=True, methods=['get'])
    def get_user_by_id(self, request, pk=None):
        user = self.get_object(pk)
        return Response(UserResponseSerializer(user).data)

    @action(detail=False, methods=['post'], url_path='add')
    def add_user(self, request):
        serializer = UserRequestSerializer(data=request.data)
        if serializer.is_valid():
            user_data = UserService().add_user(serializer.validated_data)
            return Response(user_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'])
    def edit_user(self, request, pk=None):
        user = self.get_object(pk)
        if request.user.id != int(pk) and request.user.role != UserRole.ADMIN.value:
            return Response({"error": "Bạn không có quyền sửa thông tin user này"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserUpdateRequestSerializer(data=request.data)
        if serializer.is_valid():
            user_data = UserService().edit_user(pk, serializer.validated_data)
            return Response(user_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def delete_user(self, request, pk=None):
        """Xóa user - chỉ Admin"""
        if request.user.role != UserRole.ADMIN.value:
            return Response({"error": "Chỉ Admin mới có quyền xóa user"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        result = UserService().delete_user(pk)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], url_path='change-password')
    def change_password(self, request, pk=None):
        """Đổi mật khẩu - chỉ chủ sở hữu hoặc Admin"""
        if request.user.id != int(pk) and request.user.role != UserRole.ADMIN.value:
            return Response({"error": "Bạn không có quyền đổi mật khẩu của user này"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        serializer = ChangePasswordRequestSerializer(data=request.data)
        if serializer.is_valid():
            UserService().change_password(pk, serializer.validated_data)
            return Response({"message": _("Đổi mật khẩu thành công")}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        if serializer.is_valid():
            message = AuthService().pre_register(serializer.validated_data)
            email = request.data.get('email')
            return Response({"message": f"OTP đã được gửi tới {email}"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='register/verify')
    def verify_registration(self, request):
        serializer = RegisterVerifyRequestSerializer(data=request.data)
        if serializer.is_valid():
            user = AuthService().complete_registration(serializer.validated_data)
            return Response({"id": user['id'], "role": user['role']}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='login')
    def login_flexible(self, request):
        serializer = LoginFlexibleRequestSerializer(data=request.data)
        if serializer.is_valid():
            response = AuthService().login(serializer.validated_data)
            return Response(response)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='forgot-password')
    def forgot_password_email(self, request):
        serializer = ForgotPasswordEmailRequestSerializer(data=request.data)
        if serializer.is_valid():
            response = AuthService().send_reset_password_email(serializer.validated_data['email'])
            return Response(response)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put'], url_path='reset-password')
    def reset_password(self, request):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        if serializer.is_valid():
            response = AuthService().reset_password(serializer.validated_data)
            return Response(response)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
