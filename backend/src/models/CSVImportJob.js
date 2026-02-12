const db = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * CSV Import Job Model
 * Tracks bulk import operations with progress
 */
class CSVImportJob {
  /**
   * Create a new import job
   * @param {Object} data - Job data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [job] = await db('csv_import_jobs')
      .insert({
        type: data.type || 'equipment',
        status: 'pending',
        total_rows: data.totalRows || 0,
        processed_rows: 0,
        success_count: 0,
        error_count: 0,
        created_by: data.createdBy,
        file_name: data.fileName,
        file_size: data.fileSize,
        mappings: data.mappings ? JSON.stringify(data.mappings) : '{}',
        options: data.options ? JSON.stringify(data.options) : '{}'
      })
      .returning('*');

    return this.formatJob(job);
  }

  /**
   * Find job by ID
   * @param {string} id - Job ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const job = await db('csv_import_jobs')
      .leftJoin('users', 'csv_import_jobs.created_by', 'users.id')
      .where('csv_import_jobs.id', id)
      .select(
        'csv_import_jobs.*',
        db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
      )
      .first();

    if (!job) return null;

    return this.formatJob(job);
  }

  /**
   * Update job progress
   * @param {string} id - Job ID
   * @param {Object} progress - Progress data
   */
  static async updateProgress(id, progress) {
    const updateData = {};
    
    if (progress.processedRows !== undefined) {
      updateData.processed_rows = progress.processedRows;
    }
    if (progress.successCount !== undefined) {
      updateData.success_count = progress.successCount;
    }
    if (progress.errorCount !== undefined) {
      updateData.error_count = progress.errorCount;
    }
    if (progress.status) {
      updateData.status = progress.status;
    }
    if (progress.results) {
      updateData.results = JSON.stringify(progress.results);
    }
    if (progress.errorLog) {
      updateData.error_log = JSON.stringify(progress.errorLog);
    }
    if (progress.completedAt !== undefined) {
      updateData.completed_at = progress.completedAt;
    }

    await db('csv_import_jobs')
      .where({ id })
      .update(updateData);
  }

  /**
   * List import jobs
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  static async list(filters = {}, pagination = { page: 1, limit: 20 }) {
    const query = db('csv_import_jobs')
      .leftJoin('users', 'csv_import_jobs.created_by', 'users.id')
      .orderBy('csv_import_jobs.created_at', 'desc');

    if (filters.type) {
      query.where('csv_import_jobs.type', filters.type);
    }

    if (filters.status) {
      query.where('csv_import_jobs.status', filters.status);
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [countResult, rows] = await Promise.all([
      query.clone().count('* as count').first(),
      query
        .select(
          'csv_import_jobs.*',
          db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as created_by_name")
        )
        .limit(pagination.limit)
        .offset(offset)
    ]);

    return {
      data: rows.map(this.formatJob),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.count, 10),
        totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
      }
    };
  }

  /**
   * Delete old completed jobs
   * @param {number} days - Days to keep
   */
  static async cleanupOldJobs(days = 30) {
    await db('csv_import_jobs')
      .where('status', 'in', ['completed', 'failed'])
      .where('created_at', '<', db.raw(`NOW() - INTERVAL '${days} days'`))
      .delete();
  }

  /**
   * Format job object
   * @param {Object} job - Raw job data
   * @returns {Object} Formatted job
   */
  static formatJob(job) {
    return {
      ...job,
      mappings: job.mappings ? JSON.parse(job.mappings) : {},
      options: job.options ? JSON.parse(job.options) : {},
      results: job.results ? JSON.parse(job.results) : null,
      errorLog: job.error_log ? JSON.parse(job.error_log) : [],
      progress: job.total_rows > 0 
        ? Math.round((job.processed_rows / job.total_rows) * 100) 
        : 0
    };
  }
}

module.exports = CSVImportJob;
