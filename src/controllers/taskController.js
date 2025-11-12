import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

// @desc    Create new task
// @route   POST /api/projects/:projectId/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, dueDate } = req.body;
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is a member
    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only project members can create tasks",
      });
    }

    // Find assigned user if email provided
    let assignedUserId = null;
    if (assignedTo) {
      const assignedUser = await User.findOne({ email: assignedTo });
      if (assignedUser) {
        assignedUserId = assignedUser._id;
      }
    }

    // Create task
  // Line 49 - Update the default status
const task = await Task.create({
  title,
  description,
  projectId,
  assignedTo: assignedUserId,
  status: status || "todo", // ← Changed to lowercase
  dueDate,
  createdBy: req.user._id,
});


    await task.populate("assignedTo createdBy", "name email");

    // Emit socket event if io is available
    if (req.app.get("io")) {
      req.app.get("io").to(projectId).emit("taskCreated", task);
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PATCH /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is a project member
    const project = await Project.findById(task.projectId);
    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only project members can update tasks",
      });
    }

    const { title, description, assignedTo, status, dueDate } = req.body;

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    // Update assigned user
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const assignedUser = await User.findOne({ email: assignedTo });
        task.assignedTo = assignedUser ? assignedUser._id : null;
      } else {
        task.assignedTo = null;
      }
    }

    await task.save();
    await task.populate("assignedTo createdBy", "name email");

    // Emit socket event if io is available
    if (req.app.get("io")) {
      req.app.get("io").to(task.projectId.toString()).emit("taskUpdated", task);
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
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
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is a project member
    const project = await Project.findById(task.projectId);
    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only project members can delete tasks",
      });
    }

    const projectId = task.projectId.toString();
    await task.deleteOne();

    // Emit socket event if io is available
    if (req.app.get("io")) {
      req.app
        .get("io")
        .to(projectId)
        .emit("taskDeleted", { taskId: req.params.id });
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
