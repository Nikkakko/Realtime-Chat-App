import express from 'express';
import {
  registerUser,
  loginUser,
  allUsers,
} from '../controllers/useControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, allUsers);
router.post('/login', loginUser);

export default router;
