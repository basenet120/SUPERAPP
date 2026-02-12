const request = require('supertest');
const { app, createTestUser, loginTestUser, getAuthHeader } = require('./setup');

describe('Booking API Integration Tests', () => {
  let authToken;
  let userId;
  let testBookingId;
  let testEquipmentId;

  beforeAll(async () => {
    const userData = await createTestUser({
      email: 'booking@test.com',
      password: 'TestPass123!',
      firstName: 'Booking',
      lastName: 'Test'
    });
    authToken = userData.tokens.accessToken;
    userId = userData.user.id;

    // Create test equipment
    const equipmentResponse = await request(app)
      .post('/api/equipment')
      .set(getAuthHeader(authToken))
      .send({
        name: 'Test Camera',
        category: 'Camera',
        dailyRate: 100,
        status: 'available'
      });
    testEquipmentId = equipmentResponse.body.data.equipment.id;
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const bookingData = {
        clientId: 1,
        equipmentIds: [testEquipmentId],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zip: '12345'
        },
        notes: 'Test booking notes'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toHaveProperty('id');
      expect(response.body.data.booking.status).toBe('pending');
      testBookingId = response.body.data.booking.id;
    });

    it('should calculate booking totals correctly', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const bookingData = {
        clientId: 1,
        equipmentIds: [testEquipmentId],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const response = await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.subtotal).toBeDefined();
      expect(response.body.data.booking.tax).toBeDefined();
      expect(response.body.data.booking.total).toBeDefined();
    });

    it('should reject booking for unavailable equipment', async () => {
      // Create a booking that blocks the equipment
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send({
          clientId: 1,
          equipmentIds: [testEquipmentId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      // Try to create overlapping booking
      const response = await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send({
          clientId: 1,
          equipmentIds: [testEquipmentId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject booking without required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send({ notes: 'Incomplete booking' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings with pagination', async () => {
      const response = await request(app)
        .get('/api/bookings?page=1&limit=10')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/bookings?status=pending')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter bookings by date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/bookings?startDate=${startDate}&endDate=${endDate}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should search bookings by client name', async () => {
      const response = await request(app)
        .get('/api/bookings?search=test')
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get booking by id', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.id).toBe(testBookingId);
      expect(response.body.data.booking.equipment).toBeDefined();
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/999999')
        .set(getAuthHeader(authToken))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/bookings/:id', () => {
    it('should update booking', async () => {
      const updateData = {
        notes: 'Updated booking notes',
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.notes).toBe(updateData.notes);
    });

    it('should reject invalid status transition', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}`)
        .set(getAuthHeader(authToken))
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Booking Status Transitions', () => {
    it('should confirm a pending booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/confirm`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('confirmed');
    });

    it('should check out a confirmed booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/checkout`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('out');
    });

    it('should check in an out booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/checkin`)
        .set(getAuthHeader(authToken))
        .send({ conditionNotes: 'Good condition' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('returned');
    });

    it('should complete a returned booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/complete`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('completed');
    });
  });

  describe('Booking Cancellation', () => {
    it('should cancel a booking', async () => {
      // Create a new booking to cancel
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 20);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const createResponse = await request(app)
        .post('/api/bookings')
        .set(getAuthHeader(authToken))
        .send({
          clientId: 1,
          equipmentIds: [testEquipmentId],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      const bookingId = createResponse.body.data.booking.id;

      const response = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set(getAuthHeader(authToken))
        .send({ reason: 'Client requested cancellation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('cancelled');
    });
  });

  describe('Booking Documents', () => {
    it('should generate rental agreement', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}/agreement`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should generate invoice', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}/invoice`)
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Booking Calendar', () => {
    it('should get booking calendar data', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get('/api/bookings/calendar')
        .query({ startDate, endDate })
        .set(getAuthHeader(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
