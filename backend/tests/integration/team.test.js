const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Team Management API Integration Tests', () => {
  let authToken;
  let adminToken;
  let userId;
  let testTeamMemberId;

  beforeAll(async () => {
    // Create admin user
    const adminData = await createTestUser({
      email: 'admin@team.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    adminToken = adminData.tokens.accessToken;

    // Create regular user
    const userData = await createTestUser({
      email: 'user@team.com',
      password: 'UserPass123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user'
    });
    authToken = userData.tokens.accessToken;
    userId = userData.user.id;
  });

  describe('POST /api/team/members', () => {
    it('should create new team member (admin only)', async () => {
      const memberData = {
        email: 'newmember@team.com',
        firstName: 'New',
        lastName: 'Member',
        role: 'technician',
        department: 'production',
        permissions: ['view_bookings', 'manage_equipment']
      };

      const response = await request(app)
        .post('/api/team/members')
        .set(getAuthHeader(adminToken))
        .send(memberData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member).toHaveProperty('id');
      testTeamMemberId = response.body.data.member.id;
    });

    it('should reject team member creation by non-admin', async () => {
      const response = await request(app)
        .post('/api/team/members')
        .set(getAuthHeader(authToken))
        .send({
          email: 'another@team.com',
          firstName: 'Another',
          lastName: 'Member'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/team/members', () => {
    it('should get all team members', async () => {
      const response = await request(app)
        .get('/api/team/members')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.members)).toBe(true);
    });

    it('should filter by department', async () => {
      const response = await request(app)
        .get('/api/team/members?department=production')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by role', async () => {  
      const response = await request(app)
        .get('/api/team/members?role=technician')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/team/members/:id', () => {
    it('should get team member details', async () => {
      const response = await request(app)
        .get(`/api/team/members/${testTeamMemberId}`)
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member.id).toBe(testTeamMemberId);
    });
  });

  describe('PUT /api/team/members/:id', () => {
    it('should update team member (admin only)', async () => {
      const updateData = {
        role: 'senior_technician',
        department: 'logistics'
      };

      const response = await request(app)
        .put(`/api/team/members/${testTeamMemberId}`)
        .set(getAuthHeader(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.member.role).toBe(updateData.role);
    });
  });

  describe('DELETE /api/team/members/:id', () => {
    it('should deactivate team member (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/team/members/${testTeamMemberId}`)
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Team Permissions', () => {
    it('should get team member permissions', async () => {
      const response = await request(app)
        .get(`/api/team/members/${userId}/permissions`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    it('should update team member permissions (admin only)', async () => {
      const response = await request(app)
        .put(`/api/team/members/${testTeamMemberId}/permissions`)
        .set(getAuthHeader(adminToken))
        .send({
          permissions: ['view_bookings', 'manage_equipment', 'manage_clients']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Team Schedule', () => {
    it('should get team member schedule', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/team/members/${userId}/schedule`)
        .query({ startDate, endDate })
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should update team member availability', async () => {
      const response = await request(app)
        .put(`/api/team/members/${userId}/availability`)
        .set(getAuthHeader(authToken))
        .send({
          availability: [
            { day: 'monday', startTime: '09:00', endTime: '17:00', available: true },
            { day: 'tuesday', startTime: '09:00', endTime: '17:00', available: true }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Team Activity', () => {
    it('should get team member activity log', async () => {
      const response = await request(app)
        .get(`/api/team/members/${userId}/activity`)
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
