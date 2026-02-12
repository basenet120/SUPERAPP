const DocumentModel = require('../models/Document');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Document Management Controller
 * Handles documents, versions, sharing, and COI tracking
 */
class DocumentController {
  /**
   * Upload document
   */
  async uploadDocument(req, res, next) {
    try {
      const { name, fileUrl, fileName, type } = req.body;

      if (!name || !fileUrl) {
        throw new ValidationError('Name and file URL are required');
      }

      const document = await DocumentModel.create({
        ...req.body,
        uploadedBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      const document = await DocumentModel.findById(id);
      if (!document) {
        throw new NotFoundError('Document');
      }

      // Log view activity
      await DocumentModel.logActivity(id, req.user.id, 'viewed', 'Document viewed');

      // Get related data
      const [versions, activity, shares] = await Promise.all([
        DocumentModel.getVersions(id),
        DocumentModel.getActivity(id),
        DocumentModel.getShares(id)
      ]);

      // Get COI details if applicable
      let coiDetails = null;
      if (document.type === 'coi') {
        coiDetails = await DocumentModel.getCOI(id);
      }

      res.json({
        success: true,
        data: {
          ...document,
          versions,
          activity,
          shares,
          coiDetails
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document
   */
  async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      const document = await DocumentModel.update(id, req.body, req.user.id);

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      await DocumentModel.delete(id, req.user.id);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore deleted document
   */
  async restoreDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      await DocumentModel.restore(id, req.user.id);

      res.json({
        success: true,
        message: 'Document restored successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List documents
   */
  async listDocuments(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type,
        status,
        category,
        clientId,
        companyId,
        projectId,
        bookingId,
        equipmentId,
        employeeId,
        visibility,
        search,
        expiringWithin,
        requiresSignature
      } = req.query;

      const filters = {
        type, status, category, clientId, companyId, projectId, 
        bookingId, equipmentId, employeeId, visibility, search, 
        expiringWithin,
        requiresSignature: requiresSignature === 'true'
      };

      const result = await DocumentModel.list(filters, { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      });

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
   * Download document
   */
  async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      const document = await DocumentModel.findById(id);
      if (!document) {
        throw new NotFoundError('Document');
      }

      // Log download activity
      await DocumentModel.logActivity(id, req.user.id, 'downloaded', 'Document downloaded');

      res.json({
        success: true,
        data: {
          downloadUrl: document.fileUrl,
          fileName: document.fileName,
          mimeType: document.mimeType
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== VERSION CONTROL ====================

  /**
   * Create new version
   */
  async createVersion(req, res, next) {
    try {
      const { id } = req.params;
      const { fileUrl, fileName, changeNotes } = req.body;

      if (!fileUrl) {
        throw new ValidationError('File URL is required');
      }

      const document = await DocumentModel.createVersion(id, {
        fileUrl,
        fileName,
        changeNotes,
        ...req.body
      }, req.user.id);

      res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document versions
   */
  async getVersions(req, res, next) {
    try {
      const { id } = req.params;
      
      const versions = await DocumentModel.getVersions(id);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SHARING ====================

  /**
   * Share document
   */
  async shareDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { sharedWith, shareEmail, permission, expiresAt, passwordProtected } = req.body;

      if (!sharedWith && !shareEmail) {
        throw new ValidationError('Share recipient is required');
      }

      const share = await DocumentModel.shareDocument({
        documentId: id,
        sharedBy: req.user.id,
        sharedWith,
        shareEmail,
        permission,
        expiresAt,
        passwordProtected
      });

      res.status(201).json({
        success: true,
        data: share
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document shares
   */
  async getShares(req, res, next) {
    try {
      const { id } = req.params;
      
      const shares = await DocumentModel.getShares(id);

      res.json({
        success: true,
        data: shares
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke share
   */
  async revokeShare(req, res, next) {
    try {
      const { shareId } = req.params;
      
      await db('document_shares').where({ id: shareId }).del();

      res.json({
        success: true,
        message: 'Share revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SIGNATURES ====================

  /**
   * Sign document
   */
  async signDocument(req, res, next) {
    try {
      const { id } = req.params;
      
      const document = await DocumentModel.signDocument(id, req.user.id);

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request signature
   */
  async requestSignature(req, res, next) {
    try {
      const { id } = req.params;
      const { signatoryEmail, message } = req.body;

      await db('documents')
        .where({ id })
        .update({
          requires_signature: true,
          signature_status: 'pending'
        });

      // TODO: Send signature request email

      await DocumentModel.logActivity(id, req.user.id, 'shared', 
        `Signature requested from ${signatoryEmail}`);

      res.json({
        success: true,
        message: 'Signature request sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== COI TRACKING ====================

  /**
   * Add COI details
   */
  async addCOIDetails(req, res, next) {
    try {
      const { id } = req.params;
      const { providerName, policyNumber, policyType, coverageAmount, 
              certificateHolder, effectiveDate, expirationDate } = req.body;

      if (!providerName || !policyNumber || !expirationDate) {
        throw new ValidationError('Provider name, policy number, and expiration date are required');
      }

      const coi = await DocumentModel.createCOI({
        documentId: id,
        providerName,
        policyNumber,
        policyType,
        coverageAmount,
        certificateHolder,
        effectiveDate,
        expirationDate
      });

      res.status(201).json({
        success: true,
        data: coi
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expiring COIs
   */
  async getExpiringCOIs(req, res, next) {
    try {
      const { days = 30 } = req.query;
      
      const cois = await DocumentModel.getExpiringCOIs(parseInt(days));

      res.json({
        success: true,
        data: cois
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify COI
   */
  async verifyCOI(req, res, next) {
    try {
      const { coiId } = req.params;
      const { notes } = req.body;
      
      const coi = await DocumentModel.verifyCOI(coiId, {
        verifiedBy: req.user.id,
        notes
      });

      res.json({
        success: true,
        data: coi
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request COI renewal
   */
  async requestCOIRenewal(req, res, next) {
    try {
      const { coiId } = req.params;
      
      const coi = await DocumentModel.requestCOIRenewal(coiId, req.user.id);

      // TODO: Send renewal request notification

      res.json({
        success: true,
        data: coi
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get document statistics
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await DocumentModel.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update documents
   */
  async bulkUpdate(req, res, next) {
    try {
      const { ids, updates } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('Document IDs are required');
      }

      await db('documents')
        .whereIn('id', ids)
        .update(updates);

      // Log activity for each document
      for (const id of ids) {
        await DocumentModel.logActivity(id, req.user.id, 'edited', 'Bulk update');
      }

      res.json({
        success: true,
        message: `${ids.length} documents updated`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk delete documents
   */
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('Document IDs are required');
      }

      for (const id of ids) {
        await DocumentModel.delete(id, req.user.id);
      }

      res.json({
        success: true,
        message: `${ids.length} documents deleted`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
