import {  Router } from "express";
import {getAllUsersDisplayNames} from "../controllers/get_users.controller.js"
import { create_project_controller,get_all_projects_controller,delete_project_controller,update_project_controller } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.post('/get-all-users',getAllUsersDisplayNames)
router.post('/create-project',verifyJWT,create_project_controller)
router.post('/get-all-projects',verifyJWT,get_all_projects_controller)
router.delete("/delete-project/:projectId",verifyJWT, delete_project_controller);
router.put("/update-project",verifyJWT, update_project_controller);

export default router