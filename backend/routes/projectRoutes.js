const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");

// GET ALL PROJECTS
router.get("/", projectController.getProjects);
// CREATE PROJECT TEST
router.post("/", projectController.createProject);
// CREATE PROJECT
router.post("/", projectController.createProject);

module.exports = router;

router.get("/:id", projectController.getProjectById);

router.delete("/:id", projectController.deleteProject);git add .