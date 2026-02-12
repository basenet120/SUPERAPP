const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const projectController = require('../controllers/projectController');

// All routes require authentication
router.use(authenticate);

// Projects
router.post('/', requirePermission('projects', 'create'), projectController.createProject);
router.get('/', requirePermission('projects', 'read'), projectController.listProjects);
router.get('/:id', requirePermission('projects', 'read'), projectController.getProject);
router.patch('/:id', requirePermission('projects', 'update'), projectController.updateProject);
router.delete('/:id', requirePermission('projects', 'delete'), projectController.deleteProject);

// Milestones
router.post('/milestones', requirePermission('projects', 'update'), projectController.createMilestone);
router.get('/:id/milestones', requirePermission('projects', 'read'), projectController.getMilestones);
router.patch('/milestones/:milestoneId', requirePermission('projects', 'update'), projectController.updateMilestone);
router.delete('/milestones/:milestoneId', requirePermission('projects', 'delete'), projectController.deleteMilestone);

// Tasks
router.post('/tasks', requirePermission('projects', 'update'), projectController.createTask);
router.get('/:id/tasks', requirePermission('projects', 'read'), projectController.getTasks);
router.get('/tasks/:taskId', requirePermission('projects', 'read'), projectController.getTask);
router.patch('/tasks/:taskId', requirePermission('projects', 'update'), projectController.updateTask);
router.delete('/tasks/:taskId', requirePermission('projects', 'delete'), projectController.deleteTask);
router.post('/tasks/:taskId/comments', requirePermission('projects', 'update'), projectController.addTaskComment);

// Project Members
router.post('/:id/members', requirePermission('projects', 'update'), projectController.addProjectMember);
router.get('/:id/members', requirePermission('projects', 'read'), projectController.getProjectMembers);
router.delete('/:id/members/:employeeId', requirePermission('projects', 'update'), projectController.removeProjectMember);

// Time Tracking
router.post('/tasks/:taskId/time', requirePermission('projects', 'update'), projectController.logTaskTime);
router.get('/:id/time-summary', requirePermission('projects', 'read'), projectController.getProjectTimeSummary);

// Gantt & Kanban
router.get('/:id/gantt', requirePermission('projects', 'read'), projectController.getGanttData);
router.get('/:id/kanban', requirePermission('projects', 'read'), projectController.getKanbanBoard);
router.patch('/tasks/:taskId/reorder', requirePermission('projects', 'update'), projectController.reorderKanbanTasks);

module.exports = router;
