const form = document.getElementById("projectForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const demoInput = document.getElementById("demo");
const githubInput = document.getElementById("github");
const mediaInput = document.getElementById("media");
const previewContainer = document.getElementById("preview");
const submitBtn = document.getElementById("submitBtn");

// category and tech dropdown elements
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryBubbles = document.getElementById("categoryBubbles");
const techDropdown = document.getElementById("techDropdown");
const techBubbles = document.getElementById("techBubbles");

const projectsList = document.getElementById("projects-list");

// selected values storage
let selectedCategories = [];
let selectedTech = [];
let allProjects = [];

// load projects from backend
async function loadProjects() {
  try {
    const res = await fetch("/api/projects");
    allProjects = await res.json();
    renderProjectsList();
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

// render projects in admin list
function renderProjectsList() {
  projectsList.innerHTML = "";

  allProjects.forEach(p => {
    const projectDiv = document.createElement("div");
    projectDiv.className = "admin-project";
    projectDiv.innerHTML = `
      <div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Tech:</strong> ${p.tech}</p>
      </div>
      <div>
        <button class="edit-btn" onclick="editProject(${p.id})">Edit</button>
        <button class="delete-btn" onclick="deleteProject(${p.id})">Delete</button>
      </div>
    `;
    projectsList.appendChild(projectDiv);
  });
}

// load project into form for editing
function editProject(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;

  titleInput.value = project.title;
  descriptionInput.value = project.description;
  demoInput.value = project.demo || "";
  githubInput.value = project.github || "";

  selectedCategories = project.category ? project.category.split(", ") : [];
  categoryBubbles.innerHTML = "";
  selectedCategories.forEach(cat => addBubble(cat, categoryBubbles, selectedCategories));

  selectedTech = project.tech ? project.tech.split(", ") : [];
  techBubbles.innerHTML = "";
  selectedTech.forEach(tech => addBubble(tech, techBubbles, selectedTech));

  renderPreview(project.url || "");

  submitBtn.textContent = "Update Project";
  submitBtn.dataset.editId = id;
}

// delete project from backend
async function deleteProject(id) {
  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Project deleted!");
      loadProjects();
    } else {
      alert("Failed to delete project");
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
}

// create selection bubble
function addBubble(value, container, selectedArray) {
  if (!value || selectedArray.includes(value)) return;

  selectedArray.push(value);

  const bubble = document.createElement("span");
  bubble.classList.add("bubble");
  bubble.textContent = value;

  const removeBtn = document.createElement("span");
  removeBtn.classList.add("remove");
  removeBtn.textContent = "×";

  removeBtn.onclick = () => {
    selectedArray.splice(selectedArray.indexOf(value), 1);
    bubble.remove();
  };

  bubble.appendChild(removeBtn);
  container.appendChild(bubble);
}

// category dropdown handler
categoryDropdown.addEventListener("change", () => {
  addBubble(categoryDropdown.value, categoryBubbles, selectedCategories);
  categoryDropdown.value = "";
});

// tech dropdown handler
techDropdown.addEventListener("change", () => {
  addBubble(techDropdown.value, techBubbles, selectedTech);
  techDropdown.value = "";
});

// render live preview
function renderPreview(url) {
  previewContainer.innerHTML = `
    <div class="project">
      ${url ? (url.match(/\.(mp4|webm|ogg)$/i) ? `<video src="${url}" controls></video>` : `<img src="${url}" alt="Preview">`) : ""}
      <h3>${titleInput.value}</h3>
      <p>${descriptionInput.value}</p>
      <p><strong>Category:</strong> ${selectedCategories.join(", ")}</p>
      <p><strong>Tech:</strong> ${selectedTech.join(", ")}</p>
    </div>
  `;
}

// input listeners for preview update
[titleInput, descriptionInput, demoInput, githubInput].forEach(input => {
  input.addEventListener("input", () => renderPreview());
});

// media preview handler
mediaInput.addEventListener("change", () => {
  renderPreview();
});

// upload media to server
async function uploadMedia(file) {
  if (!file) return "";
  const formData = new FormData();
  formData.append("media", file);

  try {
    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || "";
  } catch (err) {
    console.error(err);
    return "";
  }
}

// github import button handler
const importBtn = document.getElementById("importGitHubBtn");

if (importBtn) {
  importBtn.addEventListener("click", importGitHubProjects);
}

// import github repositories
async function importGitHubProjects() {
  try {
    const res = await fetch("https://api.github.com/users/KDavis00/repos");
    const repos = await res.json();

    if (!repos.length) {
      alert("No repos found");
      return;
    }

    const repo = repos[0]; // start with first repo (or let user choose later)

    // fill form only
    titleInput.value = repo.name || "";
    descriptionInput.value = repo.description || "";

    githubInput.value = repo.html_url || "";
    demoInput.value = repo.homepage || "";

    // optional auto-fill (but user can change)
    selectedCategories = repo.language ? [repo.language] : [];
    categoryBubbles.innerHTML = "";
    selectedCategories.forEach(cat =>
      addBubble(cat, categoryBubbles, selectedCategories)
    );

    selectedTech = repo.language ? [repo.language] : [];
    techBubbles.innerHTML = "";
    selectedTech.forEach(tech =>
      addBubble(tech, techBubbles, selectedTech)
    );

    renderPreview();

    alert("Form filled from GitHub repo. You can edit before saving.");

  } catch (err) {
    console.error(err);
    alert("GitHub import failed");
  }
}

// form submit handler
form.addEventListener("submit", async e => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = submitBtn.dataset.editId ? "Updating..." : "Uploading...";

  const mediaUrl = await uploadMedia(mediaInput.files[0]);

  const project = {
    title: titleInput.value,
    description: descriptionInput.value,
    category: selectedCategories.join(", "),
    tech: selectedTech.join(", "),
    demo: demoInput.value || "",
    github: githubInput.value || "",
    url: mediaUrl || ""
  };

  const editId = submitBtn.dataset.editId;
  const method = editId ? "PUT" : "POST";
  const url = editId ? `/api/projects/${editId}` : "/api/projects";

  try {
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project)
    });

    form.reset();
    previewContainer.innerHTML = "";
    selectedCategories = [];
    selectedTech = [];
    categoryBubbles.innerHTML = "";
    techBubbles.innerHTML = "";

    delete submitBtn.dataset.editId;
    submitBtn.textContent = "Add Project";

    loadProjects();
  } catch (err) {
    console.error(err);
  }

  submitBtn.disabled = false;
});

// initial load
loadProjects();
