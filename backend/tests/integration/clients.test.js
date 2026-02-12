const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Client Management API Integration Tests', () => {
  let authToken;
  let userId;
  let testClientId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'client@test.com',
      password: 'TestPass123!',
      firstName: 'Client',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
    userId = userData.user.id;
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Test Productions',
        address: {
          street: '456 Client St',
          city: 'Client City',
          state: 'CA',
          zip: '67890'
        },
        type: 'production_company',
        taxExempt: false
      };

      const response = await request(app)
        .post('/api/clients')
        .set(getAuthHeader(authToken))
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client).toHaveProperty('id');
      expect(response.body.data.client.email).toBe(clientData.email);
      testClientId = response.body.data.client.id;
    });

    it('should reject client with invalid email', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set(getAuthHeader(authToken))
        .send({
          firstName: 'Invalid',
          lastName: 'Email',
          email: 'not-an-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/clients', () => {
    it('should get all clients with pagination', async () => {
      const response = await request(app)
        .get('/api/clients?page=1&limit=10')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.clients)).toBe(true);
    });

    it('should filter clients by type', async () => {
      const response = await request(app)
        .get('/api/clients?type=production_company')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should search clients by name', async () => {
      const response = await request(app)
        .get('/api/clients?search=John')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get client by id with full details', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.id).toBe(testClientId);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client information', async () => {
      const updateData = {
        company: 'Updated Productions',
        phone: '+0987654321'
      };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set(getAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.company).toBe(updateData.company);
    });
  });

  describe('Client COI (Certificate of Insurance)', () => {
    it('should upload COI document', async () => {
      const response = await request(app)
        .post(`/api/clients/${testClientId}/coi`)
        .set(getAuthHeader(authToken))
        .field('expirationDate', '2025-12-31')
        .field('provider', 'Test Insurance Co')
        .attach('document', Buffer.from('fake-coi-pdf'), 'coi.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should get client COI documents', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/coi`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate COI expiration', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/coi/valid`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.valid).toBe('boolean');
    });
  });

  describe('Client Notes', () => {
    it('should add note to client', async () => {
      const noteData = {
        content: 'Important client note',
        type: 'general'
      };

      const response = await request(app)
        .post(`/api/clients/${testClientId}/notes`)
        .set(getAuthHeader(authToken))
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should get client notes', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/notes`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Client Communication', () => {
    it('should log client communication', async () => {
      const commData = {
        type: 'email',
        subject: 'Booking Confirmation',
        content: 'Your booking has been confirmed',
        direction: 'outbound'
      };

      const response = await request(app)
        .post(`/api/clients/${testClientId}/communications`)
        .set(getAuthHeader(authToken))
        .send(commData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should get client communication history', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/communications`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Client Projects', () => {
    it('should get client projects', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/projects`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Client Statistics', () => {
    it('should get client booking statistics', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClientId}/statistics`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });
  });
});
