import {  Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get_all_events,create_event ,delete_event,edit_event} from "../controllers/event.controller.js";
const router = Router();

router.post('/create-event',verifyJWT,create_event)
router.route("/get-all-events").get(get_all_events);
router.put('/edit-event', edit_event);      // Using PUT for updates
router.delete('/delete-event', delete_event); // Using DELETE for delete
export default router;