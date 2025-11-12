import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// @desc    Create new project
// @route   POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { title, description, members } = req.body;

    // Create project with owner (owner is NOT in members array)
    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      members: [], // Start with empty members array
    });

    // Add additional members if provided (excluding owner)
    if (members && members.length > 0) {
      const memberEmails = members.filter((email) => email !== req.user.email);
      const memberUsers = await User.find({ email: { $in: memberEmails } });
      
      // Remove duplicates by using Set with user IDs
      const uniqueMemberIds = [...new Set(memberUsers.map((user) => user._id.toString()))];
      project.members = uniqueMemberIds;
      await project.save();
    }

    await project.populate("owner members", "name email");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all projects for logged-in user
// @route   GET /api/projects
export const getProjects = async (req, res) => {
  try {
    // Find projects where user is either owner OR member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate("owner members", "name email")
      .sort("-createdAt");

    // Get task counts and completion percentage for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (task) => task.status === "completed"
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project.toObject(),
          taskCount: totalTasks,
          completedTaskCount: completedTasks,
          completionPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithStats.length,
      projects: projectsWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "owner members",
      "name email"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner OR member
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Get tasks based on user role
    let tasks;
    if (isOwner) {
      // Owner sees ALL tasks
      tasks = await Task.find({ projectId: project._id })
        .populate("assignedTo createdBy", "name email")
        .sort("-createdAt");
    } else {
      // Members only see tasks assigned to them
      tasks = await Task.find({ 
        projectId: project._id,
        assignedTo: req.user._id
      })
        .populate("assignedTo createdBy", "name email")
        .sort("-createdAt");
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        tasks,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        completionPercentage,
        isOwner, // Add this line
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// @desc    Update project
// @route   PATCH /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can update the project",
      });
    }

    const { title, description, members } = req.body;

    // Update basic fields
    if (title) project.title = title;
    if (description !== undefined) project.description = description;

    // Update members if provided
    if (members && Array.isArray(members)) {
      // Remove owner email from members list
      const memberEmails = members.filter((email) => {
        return email !== project.owner.email && email !== req.user.email;
      });
      
      const memberUsers = await User.find({ email: { $in: memberEmails } });
      
      // Remove duplicates using Set
      const uniqueMemberIds = [...new Set(memberUsers.map((user) => user._id.toString()))];
      project.members = uniqueMemberIds;
    }

    await project.save();
    await project.populate("owner members", "name email");

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is the owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can delete the project",
      });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ projectId: project._id });

    // Delete the project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project and associated tasks deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
