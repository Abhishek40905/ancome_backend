import { Router } from "express";
import authrouter from "./routes/auth.routes.js"
import project_router from "./routes/project.routes.js"
import super_admin_router from "./routes/super_admin.routes.js"
import event_router from "./routes/event.routes.js"
const router = Router()

router.use('/auth',authrouter)
router.use('/project',project_router)
router.use('/super-admin',super_admin_router)
router.use('/event',event_router)
export default router;