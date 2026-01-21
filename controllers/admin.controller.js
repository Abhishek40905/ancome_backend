import { Project } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";

const updateBasicInfo = (project, data) => {
  if (data.name) project.name = data.name.trim();
  if (data.description) project.description = data.description.trim();
  if (data.type) project.type = data.type;
  if (data.status) project.status = data.status;
  
  if (data.skillsRequired) {
    project.skillsRequired = Array.isArray(data.skillsRequired) 
      ? data.skillsRequired 
      : [];
  }


};

// 2. Handle GitHub Data
const updateGithubInfo = (project, data) => {
  if (project.type === "code" && data.github) {
    project.github = {
      repoUrl: data.github.repoUrl || "",
      owner: data.github.owner || "",
      repo: data.github.repo || "",
      lastSyncedAt: Date.now()
    };
  } else if (project.type === "non-code") {
    // If switched to non-code, clear github data
    project.github = undefined;
  }
};

// 3. Rebuild Members List (Admins & Collaborators)
// This logic preserves "invitedAt" dates for existing members while adding new ones
const updateMembers = (project, adminIds, collabIds, modifierId) => {
  if (!adminIds && !collabIds) return; // No changes requested

  const currentMembers = project.members || [];
  let newMembersMap = new Map();

  // Helper to process a role list
  const processRole = (userIds, roleName) => {
    if (!userIds || !Array.isArray(userIds)) return;

    userIds.forEach(userId => {
      const idStr = userId.toString();
      
      // If user already processed in this loop (e.g. was already added as admin), just add role
      if (newMembersMap.has(idStr)) {
        const member = newMembersMap.get(idStr);
        if (!member.roles.includes(roleName)) {
          member.roles.push(roleName);
        }
      } else {
        // Check if user existed in the OLD project data (to preserve history)
        const existingMember = currentMembers.find(m => m.userId.toString() === idStr);

        if (existingMember) {
          // Keep old data, just reset roles to what we are assigning now
          newMembersMap.set(idStr, {
            ...existingMember.toObject(), // Convert mongoose doc to object
            roles: [roleName] // Start with this role
          });
        } else {
          // Brand new member
          newMembersMap.set(idStr, {
            userId: userId,
            roles: [roleName],
            invitedAt: Date.now(),
            invitedBy: modifierId
          });
        }
      }
    });
  };

  // Process both lists
  processRole(adminIds, "admin");
  processRole(collabIds, "collaborator");

  // Replace project members with the newly constructed list
  project.members = Array.from(newMembersMap.values());
};

// =====================================================================
// MAIN CONTROLLER
// =====================================================================

const update_project_controller = asyncHandler(async (req, res) => {
  const {
    projectId,
    name,
    description,
    type,
    status,
    skillsRequired,
    github,
    admins,       // Array of User IDs
    collaborators // Array of User IDs
  } = req.body;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "Project ID is required" });
  }

  // 1. Find Project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  // 2. Apply Updates using Helper Functions
  updateBasicInfo(project, { name, description, type, status, skillsRequired });
  updateGithubInfo(project, { github });
  updateMembers(project, admins, collaborators, req.user._id);

  // 3. Save Changes
  // Mongoose middleware will automatically update 'updatedAt'
  const updatedProject = await project.save();

  // 4. Return formatted response (matches your get-all format)
  // We need to transform members back to admins/collabs arrays for the frontend
  const projectObj = updatedProject.toObject();
  const formattedProject = {
    ...projectObj,
    admins: projectObj.members.filter(m => m.roles.includes("admin")).map(m => m.userId),
    collaborators: projectObj.members.filter(m => m.roles.includes("collaborator")).map(m => m.userId)
  };

  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project: formattedProject
  });
});

// --- PASTE THE HELPER FUNCTION HERE ---
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-');  
};
// --------------------------------------

const create_project_controller = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type,
    skillsRequired,
    github,
    startDate,
    endDate,
    tags,
    status,
    admins,         
    collaborators   
  } = req.body;

  // 1. Validate
  if (!name || !name.trim() || !type) {
    return res.status(400).json({ success: false, message: "Project name and type are required." });
  }

  // 2. Generate Slug (USING THE HELPER FUNCTION)
  const baseSlug = createSlug(name);
  // Add random numbers to ensure it's unique in the DB
  const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const creatorId = req.user._id.toString();

  // 3. Prepare Members List
  let membersList = [
    {
      userId: req.user._id,
      roles: ["admin"],
      invitedAt: Date.now(),
      invitedBy: req.user._id
    }
  ];

  const addMembers = (userIds, role) => {
    if (!userIds || !Array.isArray(userIds)) return;
    userIds.forEach((id) => {
      if (id === creatorId) return; 
      const existingMember = membersList.find(m => m.userId.toString() === id);
      if (existingMember) {
        if (!existingMember.roles.includes(role)) existingMember.roles.push(role);
      } else {
        membersList.push({
          userId: id,
          roles: [role],
          invitedAt: Date.now(),
          invitedBy: req.user._id
        });
      }
    });
  };

  addMembers(admins, "admin");
  addMembers(collaborators, "collaborator");

  // 4. Create Project
  const newProject = await Project.create({
    name: name.trim(),
    slug: uniqueSlug, // <--- Using our manual slug here
    description: description ? description.trim() : "",
    type,
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
    github: (type === "code" && github) ? {
      repoUrl: github.repoUrl || "",
      owner: github.owner || "",
      repo: github.repo || "",
      lastSyncedAt: Date.now()
    } : undefined,
    startDate,
    endDate,
    tags: Array.isArray(tags) ? tags : [],
    status: status || "active",
    createdBy: req.user._id,
    members: membersList,
    requests: [],
    comments: []
  });

  return res.status(201).json({
    success: true,
    message: "Project created successfully",
    project: newProject
  });
});

const get_all_projects_controller = asyncHandler(async (req, res) => {
  const projects = await Project.find({}).sort({ createdAt: -1 });

  const formattedProjects = projects.map(project => {
    const projectObj = project.toObject();
    
    // Destructure to remove 'comments' from the rest of the data
    const { comments, ...rest } = projectObj;
    const members = projectObj.members || [];

    return {
      ...rest,
      admins: members.filter(m => m.roles.includes("admin")).map(m => m.userId),
      collaborators: members.filter(m => m.roles.includes("collaborator") || m.roles.includes("viewer")).map(m => m.userId)
    };
  });

  return res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    projects: formattedProjects
  });
});

const delete_project_controller = asyncHandler(async (req, res) => {
  const { projectId } = req.params; // We will pass ID in the URL

  // 1. Check if project exists
  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found"
    });
  }

  // 2. Delete the project
  await Project.findByIdAndDelete(projectId);

  return res.status(200).json({
    success: true,
    message: "Project deleted successfully",
    deletedId: projectId
  });
});

// const add_user = asyncHandler(async (req,res) => {
//   const {}
// })
export { create_project_controller, get_all_projects_controller ,delete_project_controller,update_project_controller};