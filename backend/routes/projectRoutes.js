const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");

// GET ALL PROJECTS
router.get("/", projectController.getProjects);
// CREATE PROJECT
router.post("/", projectController.createProject);

router.get("/:id", projectController.getProjectById);

router.put("/:id", projectController.updateProject);

router.delete("/:id", projectController.deleteProject);

// GET ALL CLIPS BY PROJECT ID
router.get("/:id/clips", projectController.getProjectClips);

module.exports = router;