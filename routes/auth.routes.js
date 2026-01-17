import {  Router } from "express";
import { check_login_controller, login_controller,logout_controller} from "../controllers/login.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get_user_profile } from "../controllers/get_users.controller.js";
const router = Router();

router.post('/verify-jwt',check_login_controller)
router.get('/login',login_controller)
router.post('/logout',logout_controller)
router.route("/profile").get(verifyJWT, get_user_profile);

export default router;