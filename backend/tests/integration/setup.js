const request = require('supertest');
const { app } = require('../src/server');
const db = require('../src/config/database');
const { getRedis, closeRedis } = require('../src/config/redis');

// Test configuration
const TEST_DB = process.env.TEST_DB_NAME || 'base_super_app_test';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890'
};

// Global test setup
beforeAll(async () => {
  // Ensure test database exists
  await db.raw(`CREATE DATABASE IF NOT EXISTS ${TEST_DB}`);
});

afterAll(async () => {
  // Clean up
  await db.destroy();
  await closeRedis();
});

// Test helpers
const createTestUser = async (userData = TEST_USER) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  return response.body.data;
};

const loginTestUser = async (email = TEST_USER.email, password = TEST_USER.password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return response.body.data;
};

const getAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`
});

module.exports = {
  app,
  db,
  TEST_USER,
  createTestUser,
  loginTestUser,
  getAuthHeader
};
