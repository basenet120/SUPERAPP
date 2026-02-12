const knex = require('knex');
const knexConfig = require('../../knexfile');
const config = require('./index');

const environment = config.env || 'development';
const db = knex(knexConfig[environment]);

// Add query logging in development
if (environment === 'development') {
  db.on('query', (queryData) => {
    console.log(`[DB] ${queryData.sql}`);
  });
}

module.exports = db;
