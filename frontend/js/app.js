async function loadProjects() {

    const projectList = document.getElementById("projectList");

    try {

        const response = await fetch("/api/projects");
        const projects = await response.json();

        if (projects.length === 0) {
            projectList.innerHTML = "Belum ada project.";
            return;
        }

        projectList.innerHTML = "";

        projects.forEach(project => {

            projectList.innerHTML += `
    <div class="project-card">
        📁 ${project.title}
        <button onclick="renameProject(${project.id}, '${project.title}')">✏️</button>
        <button onclick="deleteProject(${project.id})">🗑</button>
    </div>
`;

        });

    } catch (err) {

        console.error(err);
        projectList.innerHTML = "Gagal mengambil data.";

    }
}

async function createProject() {

    const title = "Project Baru " + Date.now();

    try {
        const response = await fetch("/api/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                user_id: 1
            })
        });

        const result = await response.json();
        console.log(result);

        loadProjects();

    } catch (err) {
        console.error("ERROR:", err);
        alert("Gagal membuat project");
    }
}

async function deleteProject(id) {

    if (!confirm("Hapus project ini?")) {
        return;
    }

    try {

        const response = await fetch(`/api/projects/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        console.log(result);

        loadProjects();

    } catch (err) {

        console.error("Delete Error:", err);

    }

}

async function renameProject(id, currentTitle) {

    const newTitle = "Project Rename " + Date.now();

    try {

        await fetch(`/api/projects/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: newTitle
            })
        });

        loadProjects();

    } catch (err) {

        console.error("Rename Error:", err);

    }

}

window.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("newProject");

    if (!btn) {
        console.error("Button newProject tidak ditemukan");
        return;
    }

    btn.addEventListener("click", createProject);

    loadProjects();

});