import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Users } from 'lucide-react';
import type { DepartmentDetail } from '../../../../../shared/types/department';

interface DepartmentCardProps {
  department: DepartmentDetail;
  onClick: (id: number) => void;
  showDoctorCount?: boolean;
  doctorCount?: number;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ 
  department, 
  onClick, 
  showDoctorCount = false,
  doctorCount = 0 
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-200"
      onClick={() => onClick(department.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {department.department_name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {department.description && (
          <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-3">
            {department.description}
          </CardDescription>
        )}
        {showDoctorCount && (
          <div className="flex items-center text-sm text-cyan-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{doctorCount} bác sĩ</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentCard;