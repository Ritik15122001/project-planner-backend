import express from "express";
import { body } from "express-validator";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(
    [
      body("title").trim().notEmpty().withMessage("Project title is required"),
      validate,
    ],
    createProject
  );

router.route("/:id").get(getProject).patch(updateProject).delete(deleteProject);

export default router;
