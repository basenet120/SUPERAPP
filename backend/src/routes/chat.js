const express = require('express');
const ChatService = require('../services/chatService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Get user's channels
router.get('/channels', async (req, res) => {
  try {
    const chatService = new ChatService(req.app.get('io'));
    const channels = await chatService.getUserChannels(req.user.id);

    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create channel
router.post('/channels', requirePermission('chat.admin'), async (req, res) => {
  try {
    const { name, type, description, projectId } = req.body;
    
    const chatService = new ChatService(req.app.get('io'));
    const channel = await chatService.createChannel({
      name,
      type,
      description,
      createdBy: req.user.id,
      projectId
    });

    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get channel messages
router.get('/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit, before } = req.query;

    const chatService = new ChatService(req.app.get('io'));
    const messages = await chatService.getChannelMessages(channelId, {
      limit: parseInt(limit) || 50,
      before
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message
router.post('/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, type = 'text', attachments, parentId } = req.body;

    const chatService = new ChatService(req.app.get('io'));
    const message = await chatService.sendMessage({
      channelId,
      userId: req.user.id,
      content,
      type,
      attachments,
      parentId
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add reaction
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const chatService = new ChatService(req.app.get('io'));
    const reactions = await chatService.addReaction(messageId, req.user.id, emoji);

    res.json({ success: true, data: reactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark channel as read
router.post('/channels/:channelId/read', async (req, res) => {
  try {
    const { channelId } = req.params;

    const chatService = new ChatService(req.app.get('io'));
    await chatService.markAsRead(channelId, req.user.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { q, channelId } = req.query;

    const chatService = new ChatService(req.app.get('io'));
    const messages = await chatService.searchMessages(q, {
      channelId,
      userId: req.user.id
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get channel members
router.get('/channels/:channelId/members', async (req, res) => {
  try {
    const { channelId } = req.params;

    const chatService = new ChatService(req.app.get('io'));
    const members = await chatService.getChannelMembers(channelId);

    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join channel
router.post('/channels/:channelId/join', async (req, res) => {
  try {
    const { channelId } = req.params;

    const chatService = new ChatService(req.app.get('io'));
    await chatService.joinChannel(channelId, req.user.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread counts
router.get('/unread', async (req, res) => {
  try {
    const chatService = new ChatService(req.app.get('io'));
    const counts = await chatService.getUnreadCounts(req.user.id);

    res.json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
