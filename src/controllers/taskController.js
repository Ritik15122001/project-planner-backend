import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

// Helper function to emit project update
const emitProjectUpdate = async (io, projectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (project) {
      // Calculate completion percentage
      const tasks = await Task.find({ projectId });
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const completionPercentage = tasks.length > 0 
        ? Math.round((completedTasks / tasks.length) * 100) 
        : 0;
      
      const projectData = {
        ...project.toObject(),
        taskCount: tasks.length,
        completionPercentage
      };
      
      // Emit to all users (not just project room)
      io.emit('projectUpdated', projectData);
    }
  } catch (error) {
    console.error('Error emitting project update:', error);
  }
};

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    // Check authorization (commented but kept for reference)
    // if (!isOwner && !isMember) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only project members can create tasks",
    //   });
    // }

    const { title, description, status, assignedTo, dueDate } = req.body;

    // Members cannot assign tasks to others (commented but kept for reference)
    // if (!isOwner && assignedTo && assignedTo !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only project owner can assign tasks to other members",
    //   });
    // }

    // Determine assignedTo value
    let taskAssignedTo;
    if (isOwner) {
      // Owner can assign to anyone or leave unassigned
      taskAssignedTo = assignedTo || undefined;
    } else {
      // Members: auto-assign to themselves
      taskAssignedTo = req.user._id;
    }

    const task = await Task.create({
      title,
      description,
      status: status || "todo",
      assignedTo: taskAssignedTo,
      dueDate,
      projectId,
      createdBy: req.user._id,
    });

    await task.populate("assignedTo createdBy", "name email");

    // Emit socket events
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(projectId).emit("taskCreated", task);
      
      // Emit project update for dashboard
      await emitProjectUpdate(io, projectId);
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @desc    Update task
// @route   PATCH /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("projectId");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const project = task.projectId;
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    const { title, description, status, assignedTo, dueDate } = req.body;

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    
    // Only owner can update assignedTo
    if (isOwner && assignedTo !== undefined) {
      task.assignedTo = assignedTo || null;
    }

    await task.save();
    await task.populate("assignedTo createdBy", "name email");

    // THIS IS THE FIX - Convert to string FIRST
    const projectIdString = task.projectId._id 
      ? task.projectId._id.toString() 
      : task.projectId.toString();

    // Emit socket events
    if (req.app.get("io")) {
      const io = req.app.get("io");
      
      console.log('📡 Emitting taskUpdated to room:', projectIdString); // Debug log
      io.to(projectIdString).emit("taskUpdated", task);
      
      // Emit project update for dashboard
      await emitProjectUpdate(io, projectIdString);
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("projectId");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const project = task.projectId;
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    // Check authorization (commented but kept for reference)
    // if (!isOwner && !isMember) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only project members can delete tasks",
    //   });
    // }

    const projectId = task.projectId._id.toString();
    await task.deleteOne();

    // Emit socket events
    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(projectId).emit("taskDeleted", { taskId: req.params.id });
      
      // Emit project update for dashboard
      await emitProjectUpdate(io, projectId);
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
