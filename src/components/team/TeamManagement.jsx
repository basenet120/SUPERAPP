import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, Calendar, 
  Clock, Briefcase, Award, MapPin, Phone, Mail, ChevronDown,
  CheckCircle, XCircle, AlertCircle, Edit, Trash2, Eye,
  Building2, DollarSign, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Employee Form Component
function EmployeeForm({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    userId: '',
    employeeId: '',
    department: '',
    jobTitle: '',
    employmentType: 'full_time',
    hireDate: '',
    hourlyRate: '',
    skills: [],
    certifications: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    maxHoursPerWeek: 40,
    notes: '',
    ...employee
  });

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const addCert = () => {
    if (certInput.trim() && !formData.certifications.includes(certInput.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, certInput.trim()] });
      setCertInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const removeCert = (cert) => {
    setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Employee ID</label>
          <Input
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="EMP-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Employment Type</label>
          <Select
            value={formData.employmentType}
            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
            options={[
              { value: 'full_time', label: 'Full Time' },
              { value: 'part_time', label: 'Part Time' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'intern', label: 'Intern' }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Production"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <Input
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            placeholder="Equipment Technician"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hire Date</label>
          <Input
            type="date"
            value={formData.hireDate}
            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
          <Input
            type="number"
            step="0.01"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            placeholder="25.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Max Hours/Week</label>
        <Input
          type="number"
          value={formData.maxHoursPerWeek}
          onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: e.target.value })}
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium mb-1">Skills</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add a skill..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500">
                <XCircle className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium mb-1">Certifications</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            placeholder="Add a certification..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
          />
          <Button type="button" onClick={addCert} variant="secondary">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.certifications.map((cert) => (
            <Badge key={cert} variant="secondary" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {cert}
              <button type="button" onClick={() => removeCert(cert)} className="hover:text-red-500">
                <XCircle className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Contact</label>
          <Input
            value={formData.emergencyContactName}
            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Phone</label>
          <Input
            value={formData.emergencyContactPhone}
            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            placeholder="Phone"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]"
          placeholder="Additional notes..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">
          {employee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Employee Detail View
function EmployeeDetail({ employee, onClose }) {
  const { data: assignments } = useQuery({
    queryKey: ['employee-assignments', employee.id],
    queryFn: () => api.get(`/team/${employee.id}/assignments`).then(r => r.data.data)
  });

  const { data: timeEntries } = useQuery({
    queryKey: ['employee-time', employee.id],
    queryFn: () => api.get(`/team/${employee.id}/time-entries?limit=5`).then(r => r.data.data)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
          {employee.name?.charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{employee.name}</h3>
          <p className="text-gray-500">{employee.jobTitle}</p>
          <p className="text-gray-500">{employee.department}</p>
          <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>
            {employee.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Employee ID:</span>
          <span className="ml-2 font-medium">{employee.employeeId || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-500">Hire Date:</span>
          <span className="ml-2 font-medium">
            {employee.hireDate ? format(new Date(employee.hireDate), 'MMM d, yyyy') : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Employment Type:</span>
          <span className="ml-2 font-medium capitalize">{employee.employmentType?.replace('_', ' ')}</span>
        </div>
        <div>
          <span className="text-gray-500">Hourly Rate:</span>
          <span className="ml-2 font-medium">${employee.hourlyRate || '0'}/hr</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Contact</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            {employee.phone || 'N/A'}
          </div>
        </div>
      </div>

      {employee.skills?.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {employee.skills.map(skill => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {employee.certifications?.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Certifications</h4>
          <div className="flex flex-wrap gap-2">
            {employee.certifications.map(cert => (
              <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {assignments && assignments.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recent Assignments</h4>
          <div className="space-y-2">
            {assignments.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{assignment.booking_number}</div>
                <div className="text-gray-500 capitalize">{assignment.role}</div>
                <div className="text-xs text-gray-400">
                  {format(new Date(assignment.scheduled_start), 'MMM d')} - {format(new Date(assignment.scheduled_end), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  );
}

// Main Team Management Component
export default function TeamManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const queryClient = useQueryClient();

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', searchQuery, statusFilter, departmentFilter],
    queryFn: () => api.get('/team', {
      params: {
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        limit: 50
      }
    }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/team', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreateOpen(false);
      toast.success('Employee created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create employee');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/team/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedEmployee(null);
      toast.success('Employee updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update employee');
    }
  });

  const handleSave = (data) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const employees = employeesData?.data || [];

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage employees, skills, and assignments</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-brand-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(e => e.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl font-bold text-amber-600">
                  {employees.filter(e => e.status === 'on_leave').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'on_leave', label: 'On Leave' },
                { value: 'terminated', label: 'Terminated' }
              ]}
              className="w-40"
            />
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map(d => ({ value: d, label: d }))
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Employees</h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Skills</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Rate</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-medium text-brand-600">
                            {employee.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{employee.department || '-'}</div>
                        <div className="text-sm text-gray-500 capitalize">{employee.employmentType?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={
                            employee.status === 'active' ? 'success' :
                            employee.status === 'on_leave' ? 'warning' :
                            employee.status === 'terminated' ? 'destructive' : 'secondary'
                          }
                        >
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {employee.skills?.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {employee.skills?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{employee.skills.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        ${employee.hourlyRate || '0'}/hr
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!selectedEmployee} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setSelectedEmployee(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm 
            employee={selectedEmployee}
            onClose={() => {
              setIsCreateOpen(false);
              setSelectedEmployee(null);
            }}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <EmployeeDetail 
              employee={viewEmployee}
              onClose={() => setViewEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
