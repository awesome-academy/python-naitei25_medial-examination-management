import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from django.http import Http404
from django.utils.dateparse import parse_date 
from .models import Doctor, Department, ExaminationRoom, Schedule
from .serializers import DoctorSerializer, CreateDoctorRequestSerializer, DepartmentSerializer, ExaminationRoomSerializer, ScheduleSerializer
from .services import DoctorService, DepartmentService, ExaminationRoomService, ScheduleService

logger = logging.getLogger(__name__) 

class DoctorViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get_object(self, pk):
        try:
            return Doctor.objects.get(pk=pk)
        except Doctor.DoesNotExist:
            raise Http404

    def list(self, request):
        doctors = DoctorService().get_all_doctors()
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        doctor = self.get_object(pk)
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)

    def create(self, request):
        serializer = CreateDoctorRequestSerializer(data=request.data)
        if serializer.is_valid():
            doctor = DoctorService().create_doctor(serializer.validated_data)
            return Response(DoctorSerializer(doctor).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        doctor = self.get_object(pk)
        serializer = DoctorSerializer(doctor, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        DoctorService().delete_doctor(pk)
        return Response({"message": "Bác sĩ được xóa thành công"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_avatar(self, request, pk=None):
        file = request.FILES.get('file')
        doctor = self.get_object(pk)
        updated_doctor = DoctorService().upload_avatar(doctor, file)
        return Response(DoctorSerializer(updated_doctor).data)

    @action(detail=True, methods=['delete'])
    def delete_avatar(self, request, pk=None):
        doctor = self.get_object(pk)
        updated_doctor = DoctorService().delete_avatar(doctor)
        return Response(DoctorSerializer(updated_doctor).data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        identity_number = request.query_params.get('identityNumber')
        doctor = DoctorService().find_by_identity_number(identity_number)
        return Response(DoctorSerializer(doctor).data if doctor else None)

    @action(detail=False, methods=['get'])
    def filter(self, request):
        gender = request.query_params.get('gender')
        academic_degree = request.query_params.get('academicDegree')
        specialization = request.query_params.get('specialization')
        type = request.query_params.get('type')
        doctors = DoctorService().filter_doctors(gender, academic_degree, specialization, type)
        return Response(DoctorSerializer(doctors, many=True).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>\d+)')
    def get_doctor_by_user_id(self, request, user_id=None):
        doctor = DoctorService().get_doctor_by_user_id(user_id)
        return Response(DoctorSerializer(doctor).data if doctor else None)

class DepartmentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            raise Http404

    def list(self, request):
        departments = DepartmentService().get_all_departments()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        department = self.get_object(pk)
        serializer = DepartmentSerializer(department)
        return Response(serializer.data)

    def create(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            department = DepartmentService().create_department(serializer.validated_data)
            return Response(DepartmentSerializer(department).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        department = self.get_object(pk)
        serializer = DepartmentSerializer(department, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        DepartmentService().delete_department(pk)
        return Response({"message": "Khoa được xóa thành công"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def doctors(self, request, pk=None):
        doctors = DepartmentService().get_doctors_by_department_id(pk)
        return Response(DoctorSerializer(doctors, many=True).data)

class ExaminationRoomViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return ExaminationRoom.objects.get(pk=pk)
        except ExaminationRoom.DoesNotExist:
            raise Http404

    def list(self, request):
        rooms = ExaminationRoomService().get_all_examination_rooms()
        serializer = ExaminationRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        room = self.get_object(pk)
        serializer = ExaminationRoomSerializer(room)
        return Response(serializer.data)

    def create(self, request):
        serializer = ExaminationRoomSerializer(data=request.data)
        if serializer.is_valid():
            room = ExaminationRoomService().create_examination_room(serializer.validated_data)
            return Response(ExaminationRoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        room = self.get_object(pk)
        serializer = ExaminationRoomSerializer(room, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        ExaminationRoomService().delete_examination_room(pk)
        return Response({"message": "Phòng được xóa thành công"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def search(self, request):
        type = request.query_params.get('type')
        building = request.query_params.get('building')
        floor = request.query_params.get('floor')
        rooms = ExaminationRoomService().filter_rooms(type, building, floor)
        return Response(ExaminationRoomSerializer(rooms, many=True).data)

class ScheduleViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Schedule.objects.get(pk=pk)
        except Schedule.DoesNotExist:
            raise Http404

    def list(self, request, doctor_id=None):
        shift = request.query_params.get('shift')
        work_date = request.query_params.get('workDate')
        room_id = request.query_params.get('roomId')
        doctor_id = request.query_params.get('doctor_id') # Lấy doctor_id từ query params
        schedules = ScheduleService().get_all_schedules(doctor_id, shift, work_date, room_id)
        serializer = ScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        schedule = self.get_object(pk)
        serializer = ScheduleSerializer(schedule)
        return Response(serializer.data)

    def create(self, request, doctor_id=None):
        # Không ép phải có doctor_id nếu đã có doctor trong body
        serializer = ScheduleSerializer(data=request.data)
        if serializer.is_valid():
            # Nếu doctor_id trên URL, ưu tiên truyền vào service, nếu không thì None
            schedule = ScheduleService().create_schedule(doctor_id, serializer.validated_data)
            return Response(ScheduleSerializer(schedule).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, doctor_id=None, pk=None):
        schedule = self.get_object(pk)
        if doctor_id is None:
            doctor_id = request.data.get('doctor_id', schedule.doctor_id)

        serializer = ScheduleSerializer(schedule, data=request.data, partial=True) 
        if serializer.is_valid():
            schedule = ScheduleService().update_schedule(doctor_id, pk, serializer.validated_data)
            return Response(ScheduleSerializer(schedule).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, doctor_id=None, pk=None):
        schedule = self.get_object(pk)
        if doctor_id is None:
            doctor_id = schedule.doctor_id

        ScheduleService().delete_schedule(doctor_id, pk)
        return Response({"message": "Lịch được xóa thành công"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def admin(self, request):
        schedules = ScheduleService().get_all_schedules_for_admin()
        return Response(ScheduleSerializer(schedules, many=True).data)

    @action(detail=False, methods=['post'])
    def batch(self, request):
        schedule_ids = request.data.get('scheduleIds', [])
        schedules = ScheduleService().get_schedules_by_ids(schedule_ids)
        return Response(ScheduleSerializer(schedules, many=True).data)

    @action(detail=False, methods=['get'], url_path='date/(?P<date>[^/.]+)')
    def get_by_date(self, request, date=None):
        if not date:
            return Response({"message": "Ngày không được để trống."}, status=status.HTTP_400_BAD_REQUEST)

        parsed_date = parse_date(date)
        if not parsed_date:
            return Response({"message": "Định dạng ngày không hợp lệ. YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        doctor_id = request.query_params.get('doctor_id') 

        schedules = ScheduleService().get_all_schedules(
            doctor_id=doctor_id,
            shift=None,
            work_date=parsed_date,
            room_id=None
        )
        serializer = ScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
