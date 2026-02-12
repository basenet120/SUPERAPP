const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Notification API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'notification@test.com',
      password: 'TestPass123!',
      firstName: 'Notification',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
    userId = userData.user.id;
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should paginate notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.count).toBe('number');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      // First create a notification via socket or API
      // Then mark as read
      const response = await request(app)
        .put('/api/notifications/1/read')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should get notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        inapp_booking_confirmed: true,
        email_booking_confirmed: false,
        push_booking_confirmed: true
      };

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set(getAuthHeader(authToken))
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/notifications/subscribe', () => {
    it('should subscribe to push notifications', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const response = await request(app)
        .post('/api/notifications/subscribe')
        .set(getAuthHeader(authToken))
        .send({ subscription })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/vapid-key', () => {
    it('should get VAPID public key', async () => {
      const response = await request(app)
        .get('/api/notifications/vapid-key')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Inventory Alert API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'inventory@test.com',
      password: 'TestPass123!',
      firstName: 'Inventory',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('GET /api/inventory/alerts', () => {
    it('should get inventory alerts', async () => {
      const response = await request(app)
        .get('/api/inventory/alerts')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by severity', async () => {
      const response = await request(app)
        .get('/api/inventory/alerts?severity=high')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/inventory/alerts', () => {
    it('should create inventory alert', async () => {
      const alertData = {
        equipmentId: 1,
        type: 'low_stock',
        threshold: 2,
        message: 'Low stock warning'
      };

      const response = await request(app)
        .post('/api/inventory/alerts')
        .set(getAuthHeader(authToken))
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Location API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'location@test.com',
      password: 'TestPass123!',
      firstName: 'Location',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('GET /api/locations', () => {
    it('should get all locations', async () => {
      const response = await request(app)
        .get('/api/locations')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/locations', () => {
    it('should create new location', async () => {
      const locationData = {
        name: 'Main Warehouse',
        address: {
          street: '123 Warehouse St',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001'
        },
        type: 'warehouse',
        isActive: true
      };

      const response = await request(app)
        .post('/api/locations')
        .set(getAuthHeader(authToken))
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('CSV Import API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'import@test.com',
      password: 'TestPass123!',
      firstName: 'Import',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
  });

  describe('POST /api/import/equipment', () => {
    it('should import equipment from CSV', async () => {
      const csvContent = `name,category,dailyRate,status
Camera A,Camera,100,available
Lens B,Lens,50,available`;

      const response = await request(app)
        .post('/api/import/equipment')
        .set(getAuthHeader(authToken))
        .attach('file', Buffer.from(csvContent), 'equipment.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/import/clients', () => {
    it('should import clients from CSV', async () => {
      const csvContent = `firstName,lastName,email,phone
John,Doe,john@example.com,+1234567890
Jane,Smith,jane@example.com,+0987654321`;

      const response = await request(app)
        .post('/api/import/clients')
        .set(getAuthHeader(authToken))
        .attach('file', Buffer.from(csvContent), 'clients.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/import/validate', () => {
    it('should validate CSV before import', async () => {
      const csvContent = `name,category,dailyRate
Valid Item,Camera,100`;

      const response = await request(app)
        .post('/api/import/validate')
        .set(getAuthHeader(authToken))
        .field('type', 'equipment')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Health Check API', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('healthy');
  });
});
