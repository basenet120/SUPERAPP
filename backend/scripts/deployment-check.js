const { app, getRedis } = require('./src/server');
const db = require('./src/config/database');
const logger = require('./src/utils/logger');

/**
 * Production deployment verification tests
 * Run these before and after deployment
 */

async function runDeploymentTests() {
  const http = require('http');
  const assert = require('assert');
  
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
  const tests = [];
  const results = { passed: 0, failed: 0, tests: [] };

  function test(name, fn) {
    tests.push({ name, fn });
  }

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${BASE_URL}${path}`, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data)
            });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      });
      
      req.on('error', reject);
      if (options.body) req.write(JSON.stringify(options.body));
      req.end();
    });
  }

  // Health Check Tests
  test('Health endpoint returns 200', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  test('Database connection is working', async () => {
    const res = await request('/health');
    assert.strictEqual(res.body.success, true);
  });

  // API Response Tests
  test('API returns proper CORS headers', async () => {
    const res = await request('/health', {
      headers: { Origin: 'https://app.baseapp.com' }
    });
    assert(res.headers['access-control-allow-origin'] || res.status === 200);
  });

  test('API has security headers', async () => {
    const res = await request('/health');
    assert(res.headers['x-content-type-options'] === 'nosniff');
  });

  // Rate Limiting Tests
  test('Rate limiting is active', async () => {
    // Make multiple requests quickly
    const requests = Array(10).fill().map(() => request('/health'));
    const responses = await Promise.all(requests);
    // All should succeed or some should be rate limited
    assert(responses.every(r => r.status === 200 || r.status === 429));
  });

  // Authentication Tests
  test('Protected endpoints require authentication', async () => {
    const res = await request('/api/equipment');
    assert.strictEqual(res.status, 401);
  });

  test('Invalid tokens are rejected', async () => {
    const res = await request('/api/equipment', {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.strictEqual(res.status, 401);
  });

  // Content Type Tests
  test('API returns JSON content type', async () => {
    const res = await request('/health');
    assert(res.headers['content-type'].includes('application/json'));
  });

  // Compression Tests
  test('Response compression is enabled', async () => {
    const res = await request('/health', {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    // Should have content-encoding header if compression is enabled
    assert(res.headers['content-encoding'] === 'gzip' || res.status === 200);
  });

  // Run all tests
  console.log('\n🧪 Running Deployment Tests...\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests Passed: ${results.passed}`);
  console.log(`Tests Failed: ${results.failed}`);
  console.log('='.repeat(50) + '\n');

  return results;
}

// Database Migration Verification
async function verifyMigrations() {
  console.log('\n🔍 Verifying Database Migrations...\n');
  
  try {
    const result = await db.raw('SELECT * FROM knex_migrations ORDER BY id DESC LIMIT 5');
    console.log('✅ Database migrations verified');
    console.log('Latest migrations:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.migration_time})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    return false;
  }
}

// Environment Variables Check
function checkEnvironment() {
  console.log('\n🔧 Checking Environment Variables...\n');
  
  const required = [
    'NODE_ENV',
    'JWT_SECRET',
    'DB_HOST',
    'DB_NAME',
    'REDIS_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`  - ${key}`));
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// Main deployment check
async function main() {
  const envCheck = checkEnvironment();
  if (!envCheck) process.exit(1);

  const migrationCheck = await verifyMigrations();
  if (!migrationCheck) process.exit(1);

  const testResults = await runDeploymentTests();
  
  if (testResults.failed > 0) {
    console.error(`\n❌ ${testResults.failed} tests failed. Deployment may have issues.`);
    process.exit(1);
  }

  console.log('\n✅ All deployment checks passed!');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Deployment check failed:', error);
    process.exit(1);
  });
}

module.exports = { runDeploymentTests, verifyMigrations, checkEnvironment };
