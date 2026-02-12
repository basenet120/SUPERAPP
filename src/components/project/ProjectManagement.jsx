import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderKanban, Plus, Search, Filter, MoreVertical, Calendar, 
  Clock, Users, CheckCircle2, AlertCircle, BarChart3, ChevronLeft,
  ChevronRight, Edit, Trash2, ListTodo, GanttChart, Kanban,
  Flag, ArrowRight, Paperclip, MessageSquare, PlayCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

// Project Form Component
function ProjectForm({ project, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    companyId: '',
    status: 'planning',
    priority: 'medium',
    type: 'production',
    budget: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    projectManagerId: '',
    notes: '',
    ...project
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Project Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]"
          placeholder="Project description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'planning', label: 'Planning' },
              { value: 'active', label: 'Active' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date *</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date *</label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Budget ($)</label>
        <Input
          type="number"
          step="0.01"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          placeholder="Additional notes..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Gantt Chart Component
function GanttChart({ project, milestones = [], tasks = [] }) {
  const [zoom, setZoom] = useState(40); // pixels per day
  const chartRef = useRef(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = parseISO(project.startDate) || new Date();
    const end = parseISO(project.endDate) || addDays(new Date(), 30);
    const days = eachDayOfInterval({ start, end });
    return { start, end, days };
  }, [project]);

  const getPosition = (date) => {
    const daysDiff = Math.floor((parseISO(date) - dateRange.start) / (1000 * 60 * 60 * 24));
    return daysDiff * zoom;
  };

  const getWidth = (startDate, endDate) => {
    const days = Math.max(1, Math.floor((parseISO(endDate) - parseISO(startDate)) / (1000 * 60 * 60 * 24)));
    return days * zoom;
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div className="min-w-max">
        {/* Header - Dates */}
        <div className="flex border-b bg-gray-50">
          <div className="w-48 flex-shrink-0 p-2 border-r font-medium text-sm">Task</div>
          <div className="flex">
            {dateRange.days.map((day) => (
              <div 
                key={day.toISOString()} 
                className="flex-shrink-0 border-r text-center text-xs py-1 text-gray-500"
                style={{ width: zoom }}
              >
                <div>{format(day, 'd')}</div>
                <div>{format(day, 'EEE')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Bar */}
        <div className="flex border-b bg-brand-50">
          <div className="w-48 flex-shrink-0 p-2 border-r text-sm font-medium truncate">
            {project.name}
          </div>
          <div className="relative flex-1 py-2">
            <div 
              className="absolute h-6 bg-brand-500 rounded flex items-center px-2 text-white text-xs"
              style={{
                left: getPosition(project.startDate),
                width: getWidth(project.startDate, project.endDate)
              }}
            >
              {project.progressPercentage}%
            </div>
          </div>
        </div>

        {/* Milestones */}
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex border-b hover:bg-gray-50">
            <div className="w-48 flex-shrink-0 p-2 border-r text-sm truncate pl-6">
              <Flag className="w-3 h-3 inline mr-1 text-amber-500" />
              {milestone.name}
            </div>
            <div className="relative flex-1 py-2">
              <div 
                className={`absolute w-4 h-4 transform rotate-45 -translate-x-1/2 ${
                  milestone.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ left: getPosition(milestone.dueDate) }}
              />
            </div>
          </div>
        ))}

        {/* Tasks */}
        {tasks.map((task) => (
          <div key={task.id} className="flex border-b hover:bg-gray-50">
            <div className="w-48 flex-shrink-0 p-2 border-r text-sm truncate pl-6">
              <ListTodo className="w-3 h-3 inline mr-1 text-gray-400" />
              {task.title}
            </div>
            <div className="relative flex-1 py-2">
              {task.startDate && task.dueDate && (
                <div 
                  className={`absolute h-5 rounded flex items-center px-2 text-white text-xs ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}
                  style={{
                    left: getPosition(task.startDate),
                    width: getWidth(task.startDate, task.dueDate)
                  }}
                >
                  {task.assigneeName || 'Unassigned'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Kanban Board Component
function KanbanBoard({ tasks = [], onUpdateTask }) {
  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
    { id: 'review', title: 'Review', color: 'bg-amber-50' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50' }
  ];

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-72">
          <div className={`${column.color} rounded-lg p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{column.title}</h4>
              <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
            </div>
            <div className="space-y-2">
              {getTasksByStatus(column.id).map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white p-3 rounded border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onUpdateTask(task)}
                >
                  <div className="font-medium text-sm mb-1">{task.title}</div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : 'No date'}
                    </div>
                    {task.assigneeName && (
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-600">
                        {task.assigneeName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={
                      task.priority === 'urgent' ? 'destructive' :
                      task.priority === 'high' ? 'warning' :
                      'secondary'
                    }
                    className="mt-2 text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Task Form Component
function TaskForm({ task, projectId, milestones = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    projectId,
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    milestoneId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    estimatedHours: '',
    ...task
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Task Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'review', label: 'Review' },
              { value: 'completed', label: 'Completed' }
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Milestone</label>
        <Select
          value={formData.milestoneId || ''}
          onChange={(e) => setFormData({ ...formData, milestoneId: e.target.value })}
          options={[
            { value: '', label: 'No milestone' },
            ...milestones.map(m => ({ value: m.id, label: m.name }))
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Estimated Hours</label>
        <Input
          type="number"
          value={formData.estimatedHours}
          onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
          placeholder="0"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Import useRef
import { useRef } from 'react';

// Main Project Management Component
export default function ProjectManagement() {
  const [view, setView] = useState('list'); // list, gantt, kanban
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', searchQuery, statusFilter],
    queryFn: () => api.get('/projects', {
      params: {
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        limit: 50
      }
    }).then(r => r.data)
  });

  const { data: selectedProjectData } = useQuery({
    queryKey: ['project', selectedProject?.id],
    queryFn: () => api.get(`/projects/${selectedProject.id}`).then(r => r.data.data),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateOpen(false);
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create project');
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/projects/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', selectedProject?.id] });
      setIsTaskFormOpen(false);
      setSelectedTask(null);
      toast.success('Task created successfully');
    }
  });

  const projects = projectsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-500">Manage projects, milestones, and tasks</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <ListTodo className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button
              variant={view === 'gantt' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('gantt')}
            >
              <GanttChart className="w-4 h-4 mr-1" />
              Gantt
            </Button>
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <Kanban className="w-4 h-4 mr-1" />
              Kanban
            </Button>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <FolderKanban className="w-8 h-8 text-brand-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <PlayCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Hold</p>
                <p className="text-2xl font-bold text-amber-600">
                  {projects.filter(p => p.status === 'on_hold').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
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
                placeholder="Search projects..."
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
                { value: 'planning', label: 'Planning' },
                { value: 'active', label: 'Active' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' }
              ]}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderKanban className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No projects found</p>
              </div>
            ) : (
              <div className="divide-y">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{project.name}</h3>
                          <Badge 
                            variant={
                              project.status === 'active' ? 'success' :
                              project.status === 'completed' ? 'default' :
                              project.status === 'on_hold' ? 'warning' :
                              'secondary'
                            }
                          >
                            {project.status}
                          </Badge>
                          <Badge variant="outline">{project.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.clientName || project.companyName || 'No client'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(parseISO(project.startDate), 'MMM d')} - {format(parseISO(project.endDate), 'MMM d')}
                          </span>
                          {project.budget && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              ${parseFloat(project.budget).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <div className="text-xs text-gray-500 mb-1">{project.progressPercentage || 0}%</div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 transition-all"
                              style={{ width: `${project.progressPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === 'gantt' && selectedProjectData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedProjectData.name} - Gantt Chart</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GanttChart 
              project={selectedProjectData}
              milestones={selectedProjectData.milestones || []}
              tasks={selectedProjectData.tasks || []}
            />
          </CardContent>
        </Card>
      )}

      {view === 'kanban' && selectedProjectData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedProjectData.name} - Kanban</h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsTaskFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <KanbanBoard 
              tasks={selectedProjectData.tasks || []}
              onUpdateTask={setSelectedTask}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm 
            onClose={() => setIsCreateOpen(false)}
            onSave={(data) => createMutation.mutate(data)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen || !!selectedTask} onOpenChange={(open) => {
        if (!open) {
          setIsTaskFormOpen(false);
          setSelectedTask(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={selectedTask}
            projectId={selectedProject?.id}
            milestones={selectedProjectData?.milestones || []}
            onClose={() => {
              setIsTaskFormOpen(false);
              setSelectedTask(null);
            }}
            onSave={(data) => {
              if (selectedTask) {
                // Update existing task
              } else {
                createTaskMutation.mutate(data);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
