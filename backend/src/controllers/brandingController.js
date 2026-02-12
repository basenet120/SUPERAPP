const logger = require('../utils/logger');

class BrandingController {
  // Get branding settings
  async getBranding(req, res, next) {
    try {
      const { client_id, location_id } = req.query;

      let query = knex('branding_settings').first();

      if (client_id) {
        query = query.where('client_id', client_id);
      } else if (location_id) {
        query = query.where('location_id', location_id);
      } else {
        // Get default branding
        query = query.where('is_default', true);
      }

      const branding = await query;

      if (!branding) {
        // Return default branding
        return res.json({
          success: true,
          data: this.getDefaultBranding()
        });
      }

      // Get email templates
      const templates = await knex('email_templates')
        .where('branding_id', branding.id)
        .where('is_active', true);

      // Get portal pages
      const pages = await knex('portal_pages')
        .where('branding_id', branding.id)
        .where('status', 'published')
        .orderBy('sort_order');

      res.json({
        success: true,
        data: {
          ...branding,
          email_templates: templates,
          portal_pages: pages
        }
      });
    } catch (error) {
      logger.error('Error fetching branding:', error);
      next(error);
    }
  }

  // Create or update branding
  async saveBranding(req, res, next) {
    try {
      const brandingData = req.body;

      // Check if branding exists
      let existing = await knex('branding_settings')
        .where(builder => {
          if (brandingData.client_id) {
            builder.where('client_id', brandingData.client_id);
          } else if (brandingData.location_id) {
            builder.where('location_id', brandingData.location_id);
          } else {
            builder.where('is_default', true);
          }
        })
        .first();

      let branding;
      if (existing) {
        branding = await knex('branding_settings')
          .where('id', existing.id)
          .update({
            ...brandingData,
            updated_at: new Date().toISOString()
          })
          .returning('*');
        branding = branding[0];
      } else {
        branding = await knex('branding_settings')
          .insert(brandingData)
          .returning('*');
        branding = branding[0];
      }

      res.json({
        success: true,
        data: branding
      });
    } catch (error) {
      logger.error('Error saving branding:', error);
      next(error);
    }
  }

  // Upload logo
  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file provided' }
        });
      }

      const { brandingId, type = 'logo' } = req.body;
      
      // Upload to S3
      const uploadResult = await uploadToS3(req.file, 'branding');

      // Update branding
      const updateField = type === 'logo_dark' ? 'logo_dark_url' : 
                         type === 'favicon' ? 'favicon_url' : 'logo_url';

      await knex('branding_settings')
        .where('id', brandingId)
        .update({ [updateField]: uploadResult.url });

      res.json({
        success: true,
        data: { url: uploadResult.url }
      });
    } catch (error) {
      logger.error('Error uploading logo:', error);
      next(error);
    }
  }

  // Get email templates
  async getEmailTemplates(req, res, next) {
    try {
      const { brandingId } = req.params;

      const templates = await knex('email_templates')
        .where('branding_id', brandingId)
        .orderBy('template_key');

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Error fetching email templates:', error);
      next(error);
    }
  }

  // Update email template
  async updateEmailTemplate(req, res, next) {
    try {
      const { brandingId, templateKey } = req.params;
      const { subject, body_html, body_text } = req.body;

      const existing = await knex('email_templates')
        .where({ branding_id: brandingId, template_key: templateKey })
        .first();

      let template;
      if (existing) {
        template = await knex('email_templates')
          .where('id', existing.id)
          .update({
            subject,
            body_html,
            body_text,
            updated_at: new Date().toISOString()
          })
          .returning('*');
      } else {
        template = await knex('email_templates')
          .insert({
            branding_id: brandingId,
            template_key: templateKey,
            subject,
            body_html,
            body_text
          })
          .returning('*');
      }

      res.json({
        success: true,
        data: template[0]
      });
    } catch (error) {
      logger.error('Error updating email template:', error);
      next(error);
    }
  }

  // Get portal pages
  async getPortalPages(req, res, next) {
    try {
      const { brandingId } = req.params;

      const pages = await knex('portal_pages')
        .where('branding_id', brandingId)
        .orderBy('sort_order');

      res.json({
        success: true,
        data: pages
      });
    } catch (error) {
      logger.error('Error fetching portal pages:', error);
      next(error);
    }
  }

  // Update portal page
  async updatePortalPage(req, res, next) {
    try {
      const { brandingId, pageId } = req.params;
      const updateData = req.body;

      const page = await knex('portal_pages')
        .where({ id: pageId, branding_id: brandingId })
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .returning('*');

      res.json({
        success: true,
        data: page[0]
      });
    } catch (error) {
      logger.error('Error updating portal page:', error);
      next(error);
    }
  }

  // Create portal page
  async createPortalPage(req, res, next) {
    try {
      const { brandingId } = req.params;
      const pageData = req.body;

      const page = await knex('portal_pages')
        .insert({
          ...pageData,
          branding_id: brandingId
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: page[0]
      });
    } catch (error) {
      logger.error('Error creating portal page:', error);
      next(error);
    }
  }

  // Delete portal page
  async deletePortalPage(req, res, next) {
    try {
      const { brandingId, pageId } = req.params;

      await knex('portal_pages')
        .where({ id: pageId, branding_id: brandingId })
        .delete();

      res.json({
        success: true,
        message: 'Page deleted'
      });
    } catch (error) {
      logger.error('Error deleting portal page:', error);
      next(error);
    }
  }

  // Get public branding (for client portal)
  async getPublicBranding(req, res, next) {
    try {
      const { domain, clientId } = req.query;

      let query = knex('branding_settings').first();

      if (domain) {
        query = query.where('custom_domain', domain);
      } else if (clientId) {
        query = query.where('client_id', clientId);
      } else {
        query = query.where('is_default', true);
      }

      const branding = await query.where('status', 'active');

      if (!branding) {
        return res.json({
          success: true,
          data: this.getDefaultBranding()
        });
      }

      // Only return public-safe fields
      const publicFields = {
        company_name: branding.company_name,
        tagline: branding.tagline,
        logo_url: branding.logo_url,
        logo_dark_url: branding.logo_dark_url,
        favicon_url: branding.favicon_url,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        text_color: branding.text_color,
        background_color: branding.background_color,
        sidebar_color: branding.sidebar_color,
        heading_font: branding.heading_font,
        body_font: branding.body_font,
        portal_title: branding.portal_title,
        portal_welcome_message: branding.portal_welcome_message,
        portal_primary_button_text: branding.portal_primary_button_text,
        custom_css: branding.custom_css,
        enable_chat: branding.enable_chat,
        enable_project_portal: branding.enable_project_portal,
        enable_document_download: branding.enable_document_download,
        enable_equipment_browsing: branding.enable_equipment_browsing
      };

      // Get published portal pages
      const pages = await knex('portal_pages')
        .where('branding_id', branding.id)
        .where('status', 'published')
        .where('show_in_footer', true)
        .select('slug', 'title', 'show_in_nav')
        .orderBy('sort_order');

      res.json({
        success: true,
        data: {
          ...publicFields,
          portal_pages: pages
        }
      });
    } catch (error) {
      logger.error('Error fetching public branding:', error);
      next(error);
    }
  }

  // Default branding
  getDefaultBranding() {
    return {
      company_name: 'Base Production Rentals',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      accent_color: '#10B981',
      text_color: '#1F2937',
      background_color: '#FFFFFF',
      sidebar_color: '#111827',
      heading_font: 'Inter',
      body_font: 'Inter',
      show_powered_by: true,
      enable_chat: true,
      enable_project_portal: true,
      enable_document_download: true,
      enable_equipment_browsing: true
    };
  }
}

module.exports = new BrandingController();