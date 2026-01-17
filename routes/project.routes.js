import {  Router } from "express";
// import { is_user_logged_in } from "../middlewares/auth.middleware.js";
import { create_project_controller } from "../controllers/create_project.controller.js";
import { delete_project_controller } from "../controllers/delete_project.controller.js";
import { request_join_project } from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { update_project_settings,approve_join_request,reject_join_request,remove_collaborator} from "../controllers/project_management_controller.js";
import { get_project_comments,add_comment,reply_to_comment } from "../controllers/comments.controller.js";
const router = Router();

router.post('/create-project',create_project_controller)
router.post('/delete-project',delete_project_controller)
router.post('/request-join',verifyJWT,request_join_project)
router.route("/update-settings").put(verifyJWT, update_project_settings);
router.route("/approve-request").post(verifyJWT, approve_join_request);
router.route("/reject-request").post(verifyJWT, reject_join_request);
router.route("/remove-collaborator").post(verifyJWT, remove_collaborator);


router.route("/comments/:projectId").get(verifyJWT, get_project_comments);


router.route("/comment").post(verifyJWT, add_comment);

router.route("/reply").post(verifyJWT, reply_to_comment);

export default router;