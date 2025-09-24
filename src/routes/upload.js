const express = require('express');
const {
  upload,
  uploadSingle,
  uploadMultiple,
  deleteFile,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/single', protect, upload.single('file'), uploadSingle);
router.post('/multiple', protect, upload.array('files', 10), uploadMultiple);
router.post('/avatar', protect, upload.single('avatar'), uploadSingle);
router.delete('/:filename', protect, deleteFile);

module.exports = router;
