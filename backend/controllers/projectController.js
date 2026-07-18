const Project = require("../models/projectModel");

// GET ALL
exports.getProjects = (req, res) => {
    Project.getAllProjects((err, rows) => {
        if (err) return res.status(500).json(err);

        res.json(rows);
    });
};

// CREATE
exports.createProject = (req, res) => {
    const { title, user_id } = req.body;

   Project.createProject(title, user_id, function (err, projectId) {
        if (err) return res.status(500).json(err);

       res.json({
    message: "Project created successfully",
    projectId: projectId
});
    });
};

exports.getProjectById = (req, res) => {

    const id = req.params.id;

    Project.getProjectById(id, (err, row) => {

        if (err)
            return res.status(500).json(err);

        if (!row)
            return res.status(404).json({
                message: "Project tidak ditemukan"
            });

        res.json(row);

    });

};

// UPDATE PROJECT
exports.updateProject = (req, res) => {

    const id = req.params.id;
    const { title } = req.body;

    Project.updateProject(id, title, function(err) {

        if (err)
            return res.status(500).json(err);

        res.json({
            message: "Project berhasil diupdate"
        });

    });

};

exports.deleteProject = (req,res)=>{

    Project.deleteProject(req.params.id,function(err){

        if(err)
            return res.status(500).json(err);

        res.json({
            message:"Project berhasil dihapus"
        });

    });

};

// GET ALL CLIPS BY PROJECT ID
exports.getProjectClips = (req, res) => {

    const id = req.params.id;

    Project.getClipsByProjectId(id, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};