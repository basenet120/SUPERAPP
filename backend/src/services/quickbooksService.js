const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const db = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');

class QuickBooksService {
  constructor() {
    this.oauthClient = new OAuthClient({
      clientId: config.quickbooks.clientId,
      clientSecret: config.quickbooks.clientSecret,
      environment: config.quickbooks.environment,
      redirectUri: config.quickbooks.redirectUri
    });
  }

  /**
   * Get OAuth authorization URL
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: require('crypto').randomUUID()
    });
  }

  /**
   * Handle OAuth callback
   * @param {string} url - Callback URL with code
   * @param {string} userId - User ID establishing connection
   * @returns {Promise<Object>} Connection details
   */
  async handleCallback(url, userId) {
    try {
      const authResponse = await this.oauthClient.createToken(url);
      const token = authResponse.getJson();

      // Get company info
      const qbo = this.getQBOClient(token);
      const companyInfo = await this.makeRequest(qbo, 'getCompanyInfo', token.realmId);

      // Store connection
      const [connection] = await db('quickbooks_connections')
        .insert({
          user_id: userId,
          realm_id: token.realmId,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_expires_at: new Date(Date.now() + token.expires_in * 1000),
          company_name: companyInfo.CompanyName,
          company_email: companyInfo.Email?.Address,
          environment: config.quickbooks.environment
        })
        .onConflict('realm_id')
        .merge()
        .returning('*');

      return connection;
    } catch (error) {
      logger.error('QuickBooks OAuth error:', error);
      throw error;
    }
  }

  /**
   * Get QBO client instance
   * @param {Object} token - OAuth token
   * @returns {QuickBooks} QBO client
   */
  getQBOClient(token) {
    return new QuickBooks(
      config.quickbooks.clientId,
      config.quickbooks.clientSecret,
      token.access_token,
      false, // no token secret for OAuth 2
      token.realmId,
      config.quickbooks.environment === 'sandbox',
      true, // debug
      null, // minorversion
      '2.0', // OAuth version
      token.refresh_token
    );
  }

  /**
   * Make authenticated request to QuickBooks
   * @param {QuickBooks} qbo - QBO client
   * @param {string} method - Method name
   * @param {...any} args - Method arguments
   * @returns {Promise<any>}
   */
  async makeRequest(qbo, method, ...args) {
    return new Promise((resolve, reject) => {
      qbo[method](...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Refresh access token
   * @param {string} realmId - QuickBooks realm ID
   * @returns {Promise<Object>} Updated connection
   */
  async refreshToken(realmId) {
    const connection = await db('quickbooks_connections')
      .where({ realm_id: realmId, active: true })
      .first();

    if (!connection) {
      throw new Error('QuickBooks connection not found');
    }

    try {
      this.oauthClient.setToken({
        token_type: 'Bearer',
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
        expires_in: Math.floor((new Date(connection.token_expires_at) - Date.now()) / 1000)
      });

      const authResponse = await this.oauthClient.refresh();
      const token = authResponse.getJson();

      const [updated] = await db('quickbooks_connections')
        .where({ id: connection.id })
        .update({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_expires_at: new Date(Date.now() + token.expires_in * 1000)
        })
        .returning('*');

      return updated;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Sync customers from QuickBooks
   * @param {string} realmId - QuickBooks realm ID
   * @returns {Promise<Object>} Sync results
   */
  async syncCustomers(realmId) {
    const connection = await this.refreshToken(realmId);
    const qbo = this.getQBOClient(connection);

    const syncLog = {
      connection_id: connection.id,
      entity_type: 'customer',
      sync_type: 'pull',
      status: 'in_progress'
    };

    const [logEntry] = await db('quickbooks_sync_logs').insert(syncLog).returning('*');

    try {
      const customers = await this.makeRequest(qbo, 'findCustomers');
      let processed = 0;
      let created = 0;
      let updated = 0;
      let errors = [];

      for (const qbCustomer of customers.QueryResponse.Customer || []) {
        try {
          // Map QuickBooks customer to our client model
          const clientData = {
            company_name: qbCustomer.CompanyName,
            contact_name: qbCustomer.DisplayName,
            email: qbCustomer.PrimaryEmailAddr?.Address,
            phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
            address: qbCustomer.BillAddr?.Line1,
            city: qbCustomer.BillAddr?.City,
            state: qbCustomer.BillAddr?.CountrySubDivisionCode,
            zip: qbCustomer.BillAddr?.PostalCode,
            quickbooks_id: qbCustomer.Id
          };

          // Check if client exists
          const existing = await db('clients')
            .where({ quickbooks_id: qbCustomer.Id })
            .first();

          if (existing) {
            await db('clients')
              .where({ id: existing.id })
              .update({ ...clientData, updated_at: new Date() });
            updated++;
          } else {
            await db('clients').insert({
              ...clientData,
              status: 'active',
              created_at: new Date()
            });
            created++;
          }

          processed++;
        } catch (err) {
          errors.push({ customer: qbCustomer.Id, error: err.message });
        }
      }

      await db('quickbooks_sync_logs')
        .where({ id: logEntry.id })
        .update({
          status: errors.length > 0 ? 'partial' : 'completed',
          records_processed: processed,
          records_created: created,
          records_updated: updated,
          records_failed: errors.length,
          errors: JSON.stringify(errors),
          completed_at: new Date()
        });

      await db('quickbooks_connections')
        .where({ id: connection.id })
        .update({ last_sync_at: new Date() });

      return { processed, created, updated, errors };
    } catch (error) {
      await db('quickbooks_sync_logs')
        .where({ id: logEntry.id })
        .update({
          status: 'failed',
          errors: JSON.stringify([{ error: error.message }]),
          completed_at: new Date()
        });

      throw error;
    }
  }

  /**
   * Create invoice in QuickBooks
   * @param {string} realmId - QuickBooks realm ID
   * @param {Object} booking - Booking data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(realmId, booking) {
    const connection = await this.refreshToken(realmId);
    const qbo = this.getQBOClient(connection);

    // Get customer
    const client = await db('clients').where({ id: booking.client_id }).first();

    // Build line items
    const lineItems = booking.items.map(item => ({
      Amount: item.total_price,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: {
          value: item.equipment_id, // You'd need to map this to QB item IDs
          name: item.equipment_name
        },
        Qty: item.quantity,
        UnitPrice: item.unit_price
      }
    }));

    const invoice = {
      CustomerRef: {
        value: client.quickbooks_id
      },
      Line: lineItems,
      TxnDate: new Date().toISOString().split('T')[0],
      DueDate: booking.payment_due_date?.toISOString().split('T')[0],
      PrivateNote: booking.internal_notes
    };

    return this.makeRequest(qbo, 'createInvoice', invoice);
  }

  /**
   * Sync invoice payments
   * @param {string} realmId - QuickBooks realm ID
   * @returns {Promise<Object>} Sync results
   */
  async syncPayments(realmId) {
    const connection = await this.refreshToken(realmId);
    const qbo = this.getQBOClient(connection);

    const payments = await this.makeRequest(qbo, 'findPayments');
    const results = { processed: 0, created: 0, errors: [] };

    for (const qbPayment of payments.QueryResponse.Payment || []) {
      try {
        // Map payment to our system
        const paymentData = {
          quickbooks_payment_id: qbPayment.Id,
          amount: qbPayment.TotalAmt,
          status: 'completed',
          processed_at: new Date(qbPayment.TxnDate)
        };

        // Find related booking by invoice number
        const booking = await db('bookings')
          .where({ quickbooks_invoice_id: qbPayment.Line[0]?.LinkedTxn[0]?.TxnId })
          .first();

        if (booking) {
          await db('payments').insert({
            ...paymentData,
            booking_id: booking.id,
            client_id: booking.client_id,
            type: 'final',
            method: 'other'
          });
          results.created++;
        }

        results.processed++;
      } catch (err) {
        results.errors.push({ payment: qbPayment.Id, error: err.message });
      }
    }

    return results;
  }
}

module.exports = new QuickBooksService();
