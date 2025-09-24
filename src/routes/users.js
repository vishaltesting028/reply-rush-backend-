const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers);

router.route('/profile')
  .put(protect, updateProfile);

router.route('/:id')
  .get(protect, admin, getUser)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
