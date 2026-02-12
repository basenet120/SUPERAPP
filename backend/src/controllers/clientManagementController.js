const ClientEnhanced = require('../models/ClientEnhanced');
const db = require('../config/database');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Client Management Controller
 * Handles client tiers, tags, notes, and communication history
 */
class ClientManagementController {
  /**
   * Get client with full details
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getClient(req, res, next) {
    try {
      const { id } = req.params;
      
      const client = await ClientEnhanced.findById(id);
      if (!client) {
        throw new NotFoundError('Client');
      }

      // Get statistics
      const stats = await ClientEnhanced.getStatistics(id);

      res.json({
        success: true,
        data: {
          ...client,
          statistics: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List clients with filters
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async listClients(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search,
        tier,
        companyId,
        tags
      } = req.query;

      const result = await ClientEnhanced.search(
        { search, tier, companyId, tags },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update client tier
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateTier(req, res, next) {
    try {
      const { id } = req.params;
      const { tier, reason } = req.body;

      if (!tier) {
        throw new ValidationError('Tier is required');
      }

      const result = await ClientEnhanced.setTier(id, tier, req.user.id, reason);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tier configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTierConfig(req, res, next) {
    try {
      const tiers = await ClientEnhanced.getAllTiers();

      res.json({
        success: true,
        data: tiers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client's tier history
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTierHistory(req, res, next) {
    try {
      const { id } = req.params;
      
      const history = await ClientEnhanced.getTierHistory(id);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add tag to client
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async addTag(req, res, next) {
    try {
      const { id } = req.params;
      const { tagId } = req.body;

      if (!tagId) {
        throw new ValidationError('Tag ID is required');
      }

      await ClientEnhanced.addTag(id, tagId, req.user.id);

      res.json({
        success: true,
        message: 'Tag added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove tag from client
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async removeTag(req, res, next) {
    try {
      const { id, tagId } = req.params;

      await ClientEnhanced.removeTag(id, tagId);

      res.json({
        success: true,
        message: 'Tag removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available tags
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getTags(req, res, next) {
    try {
      const tags = await db('client_tags')
        .orderBy('category')
        .orderBy('name');

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new tag
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async createTag(req, res, next) {
    try {
      const { name, slug, color, description, category } = req.body;

      if (!name || !slug) {
        throw new ValidationError('Name and slug are required');
      }

      const [tag] = await db('client_tags')
        .insert({
          name,
          slug,
          color: color || '#6B7280',
          description,
          category: category || 'custom'
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: tag
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add note to client
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async addNote(req, res, next) {
    try {
      const { id } = req.params;
      const { content, type, isPrivate, isPinned } = req.body;

      if (!content) {
        throw new ValidationError('Note content is required');
      }

      const note = await ClientEnhanced.addNote({
        clientId: id,
        content,
        type,
        isPrivate,
        isPinned,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update note
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async updateNote(req, res, next) {
    try {
      const { noteId } = req.params;
      const note = await ClientEnhanced.updateNote(noteId, req.body);

      res.json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete note
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async deleteNote(req, res, next) {
    try {
      const { noteId } = req.params;
      await ClientEnhanced.deleteNote(noteId);

      res.json({
        success: true,
        message: 'Note deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client notes
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getNotes(req, res, next) {
    try {
      const { id } = req.params;
      const { type, isPinned } = req.query;

      const notes = await ClientEnhanced.getNotes(id, { type, isPinned });

      res.json({
        success: true,
        data: notes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log communication
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async logCommunication(req, res, next) {
    try {
      const { id } = req.params;
      const {
        type,
        direction,
        subject,
        content,
        metadata,
        relatedBookingId,
        relatedDealId
      } = req.body;

      if (!type || !direction) {
        throw new ValidationError('Type and direction are required');
      }

      const communication = await ClientEnhanced.logCommunication({
        clientId: id,
        type,
        direction,
        subject,
        content,
        metadata,
        relatedBookingId,
        relatedDealId,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: communication
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client communications
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getCommunications(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, type, direction } = req.query;

      const result = await ClientEnhanced.getCommunications(
        id,
        { type, direction },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate client tier based on spend
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async recalculateTier(req, res, next) {
    try {
      const { id } = req.params;
      
      const client = await db('clients').where('id', id).first();
      if (!client) {
        throw new NotFoundError('Client');
      }

      const newTier = await ClientEnhanced.calculateTier(
        client.lifetime_spend || 0,
        client.total_bookings || 0
      );

      if (newTier !== client.tier) {
        await ClientEnhanced.setTier(id, newTier, req.user.id, 'Manual recalculation');
      }

      res.json({
        success: true,
        data: {
          previousTier: client.tier,
          newTier,
          changed: newTier !== client.tier
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client statistics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getStatistics(req, res, next) {
    try {
      const { id } = req.params;
      
      const stats = await ClientEnhanced.getStatistics(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update tiers
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async bulkUpdateTiers(req, res, next) {
    try {
      const { clientIds, tier, reason } = req.body;

      if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
        throw new ValidationError('Client IDs array is required');
      }

      if (!tier) {
        throw new ValidationError('Tier is required');
      }

      const results = [];
      for (const clientId of clientIds) {
        try {
          const result = await ClientEnhanced.setTier(clientId, tier, req.user.id, reason);
          results.push({ clientId, success: true, ...result });
        } catch (error) {
          results.push({ clientId, success: false, error: error.message });
        }
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientManagementController();
