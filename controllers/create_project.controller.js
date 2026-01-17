import asyncHandler from "../utils/asyncHandler.js";
import { Project } from "../models/models.js";

const create_project_controller = asyncHandler(async (req, res) => {
    const user = req.user;

    if (user.globalRole !== "super_admin") {
        return res.status(403).json({ message: "Only super admins can create projects" });
    }

    const {
        name,
        description,
        type,
        skillsRequired,
        githubUrl,
        startDate,
        endDate,
        tags,
        status
    } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: "name and type are required" });
    }
    const projectData = {
        name,
        description: description || "",
        type,
        skillsRequired: skillsRequired || [],
        startDate: startDate || null,
        endDate: endDate || null,
        tags: tags || [],
        status: status || "active",
        createdBy: user._id,
        members: [
            {
                userId: user._id,
                roles: ["admin", "collaborator"],
                invitedBy: user.user._id
            }
        ]
    };

    if (type === "code") {
        if (!githubUrl) {
            return res.status(400).json({ message: "githubUrl is required for code projects" });
        }

        projectData.github = {
            repoUrl: githubUrl,
            owner: null,
            repo: null,
            lastSyncedAt: null
        };
    }

    const project = new Project(projectData);
    await project.save();

    res.status(201).json(project);
});

export {create_project_controller}
