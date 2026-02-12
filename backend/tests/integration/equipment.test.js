const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Equipment API Integration Tests', () => {
  let authToken;
  let userId;
  let testEquipmentId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'equipment@test.com',
      password: 'TestPass123!',
      firstName: 'Equipment',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
    userId = userData.user.id;
  });

  describe('POST /api/equipment', () => {
    it('should create new equipment', async () => {
      const equipmentData = {
        name: 'Sony A7IV Camera',
        category: 'Camera',
        subcategory: 'Mirrorless',
        manufacturer: 'Sony',
        model: 'A7IV',
        serialNumber: 'SN123456',
        barcode: 'BAR001',
        description: 'Professional mirrorless camera',
        dailyRate: 150.00,
        weeklyRate: 900.00,
        monthlyRate: 3000.00,
        replacementValue: 2500.00,
        locationId: 1,
        status: 'available'
      };

      const response = await request(app)
        .post('/api/equipment')
        .set(getAuthHeader(authToken))
        .send(equipmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment).toHaveProperty('id');
      expect(response.body.data.equipment.name).toBe(equipmentData.name);
      testEquipmentId = response.body.data.equipment.id;
    });

    it('should reject equipment creation without required fields', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set(getAuthHeader(authToken))
        .send({ name: 'Incomplete Equipment' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject equipment creation without auth', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .send({ name: 'Test Equipment' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/equipment', () => {
    it('should get all equipment with pagination', async () => {
      const response = await request(app)
        .get('/api/equipment?page=1&limit=10')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.equipment)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter equipment by category', async () => {
      const response = await request(app)
        .get('/api/equipment?category=Camera')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment.every(e => e.category === 'Camera')).toBe(true);
    });

    it('should filter equipment by status', async () => {
      const response = await request(app)
        .get('/api/equipment?status=available')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should search equipment by name', async () => {
      const response = await request(app)
        .get('/api/equipment?search=Sony')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/equipment/:id', () => {
    it('should get equipment by id', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment.id).toBe(testEquipmentId);
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .get('/api/equipment/999999')
        .set(getAuthHeader(authToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/equipment/:id', () => {
    it('should update equipment', async () => {
      const updateData = {
        name: 'Sony A7IV Camera (Updated)',
        dailyRate: 175.00
      };

      const response = await request(app)
        .put(`/api/equipment/${testEquipmentId}`)
        .set(getAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment.name).toBe(updateData.name);
      expect(parseFloat(response.body.data.equipment.dailyRate)).toBe(updateData.dailyRate);
    });

    it('should reject update without auth', async () => {
      const response = await request(app)
        .put(`/api/equipment/${testEquipmentId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    it('should delete equipment', async () => {
      // Create equipment to delete
      const createResponse = await request(app)
        .post('/api/equipment')
        .set(getAuthHeader(authToken))
        .send({
          name: 'Equipment to Delete',
          category: 'Test',
          dailyRate: 100
        });

      const equipmentId = createResponse.body.data.equipment.id;

      const response = await request(app)
        .delete(`/api/equipment/${equipmentId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/equipment/:id/availability', () => {
    it('should get equipment availability', async () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}/availability`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.availability).toBeDefined();
    });
  });

  describe('Equipment Images', () => {
    it('should upload equipment image', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/images`)
        .set(getAuthHeader(authToken))
        .attach('image', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get equipment images', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}/images`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Equipment Maintenance', () => {
    it('should create maintenance record', async () => {
      const maintenanceData = {
        type: 'routine',
        description: 'Regular maintenance check',
        scheduledDate: new Date().toISOString(),
        cost: 50.00
      };

      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/maintenance`)
        .set(getAuthHeader(authToken))
        .send(maintenanceData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should get maintenance history', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}/maintenance`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
