import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { Project } from "../models/models.js";


const delete_project_controller = asyncHandler(async (req,res) =>{
    const user = req.user;

    if (user.globalRole !== "super_admin") {
        return res.status(403).json({ message: "Only super admins can delete projects" });
    }

    const {project_id} = req.body;

    if(!project_id) return res.json({message:"cannot find the project id", success:false})
    
    if(!isValidObjectId(project_id)) return res.json({message:"not a valid project id ",success :false})

   try {
        await Project.deleteOne({ _id: project_id });
        return res.json({message:"project deleted successfully" ,success:true })
   } catch (error) {
        return res.status(500).json({message:"operation failed at the server try again later",success:false})
   }
})

export {delete_project_controller}