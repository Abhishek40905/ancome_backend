import {  Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get_all_events,create_event } from "../controllers/event.controller.js";
const router = Router();

router.post('/create-event',verifyJWT,create_event)
router.route("/get-all-events").get(get_all_events);

export default router;