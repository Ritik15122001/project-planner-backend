import express from "express";
import { body } from "express-validator";
import {
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

router.use(protect);

router.post(
  "/projects/:projectId/tasks",
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    validate,
  ],
  createTask
);

router.route("/tasks/:id").patch(updateTask).delete(deleteTask);

export default router;
