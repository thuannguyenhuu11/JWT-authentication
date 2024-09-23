import express from 'express';
import authController from '../controllers/authController.js';
import middlewareController from '../controllers/middlewareController.js';

const router = express.Router();

//REGISTER
router.post('/register', authController.registerUser);

//LOGIN
router.post('/login', authController.loginUser);

//REFRESH
router.post('/refresh', authController.requestRefreshToke);

//LOGOUT
router.post('/logout', middlewareController.verifyToken, authController.userLogout);

export default router;
