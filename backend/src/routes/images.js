const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve equipment images from the rental images folder
router.get('/:sku/*', (req, res) => {
  const { sku } = req.params;
  const imagePath = req.params[0];
  
  // Security: prevent directory traversal
  if (sku.includes('..') || imagePath.includes('..')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const baseDir = path.join(process.env.HOME || '/Users/bobbotsworth', 'Desktop', 'rental images');
  const fullPath = path.join(baseDir, sku, imagePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  res.sendFile(fullPath);
});

// Get list of images for a SKU
router.get('/:sku', (req, res) => {
  const { sku } = req.params;
  
  if (sku.includes('..')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const baseDir = path.join(process.env.HOME || '/Users/bobbotsworth', 'Desktop', 'rental images');
  const skuDir = path.join(baseDir, sku);
  
  if (!fs.existsSync(skuDir)) {
    return res.json({ images: [] });
  }
  
  try {
    const files = fs.readdirSync(skuDir);
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => `/api/images/${sku}/${f}`);
    
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
