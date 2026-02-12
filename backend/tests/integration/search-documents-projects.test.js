const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Search API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'search@test.com',
      password: 'TestPass123!',
      firstName: 'Search',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('GET /api/search', () => {
    it('should perform global search', async () => {
      const response = await request(app)
        .get('/api/search?q=camera')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });

    it('should filter search by type', async () => {
      const response = await request(app)
        .get('/api/search?q=test&type=equipment')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/search?q=test&limit=5')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/search/equipment', () => {
    it('should search equipment', async () => {
      const response = await request(app)
        .get('/api/search/equipment?q=sony')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/search/equipment?q=camera&category=Camera')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by availability', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/search/equipment?q=lens&available=true&startDate=${startDate}&endDate=${endDate}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/search/clients', () => {
    it('should search clients', async () => {
      const response = await request(app)
        .get('/api/search/clients?q=production')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/search/bookings', () => {
    it('should search bookings', async () => {
      const response = await request(app)
        .get('/api/search/bookings?q=confirmed')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/search/documents', () => {
    it('should search documents', async () => {
      const response = await request(app)
        .get('/api/search/documents?q=contract')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Document API Integration Tests', () => {
  let authToken;
  let testDocumentId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'document@test.com',
      password: 'TestPass123!',
      firstName: 'Document',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('POST /api/documents', () => {
    it('should upload document', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set(getAuthHeader(authToken))
        .field('name', 'Test Document')
        .field('type', 'contract')
        .attach('file', Buffer.from('fake-document'), 'test-contract.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      testDocumentId = response.body.data.document.id;
    });
  });

  describe('GET /api/documents', () => {
    it('should get all documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/documents?type=contract')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should get document by id', async () => {
      const response = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete document', async () => {
      const response = await request(app)
        .delete(`/api/documents/${testDocumentId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Project API Integration Tests', () => {
  let authToken;
  let testProjectId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'project@test.com',
      password: 'TestPass123!',
      firstName: 'Project',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('POST /api/projects', () => {
    it('should create new project', async () => {
      const projectData = {
        name: 'Test Production Project',
        description: 'A test project for integration testing',
        clientId: 1,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planning',
        budget: 50000
      };

      const response = await request(app)
        .post('/api/projects')
        .set(getAuthHeader(authToken))
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      testProjectId = response.body.data.project.id;
    });
  });

  describe('GET /api/projects', () => {
    it('should get all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set(getAuthHeader(authToken))
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
