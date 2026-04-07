const form = document.getElementById("projectForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const demoInput = document.getElementById("demo");
const githubInput = document.getElementById("github");
const mediaInput = document.getElementById("media");
const previewContainer = document.getElementById("preview");
const submitBtn = document.getElementById("submitBtn");

// dropdown elements
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryBubbles = document.getElementById("categoryBubbles");
const techDropdown = document.getElementById("techDropdown");
const techBubbles = document.getElementById("techBubbles");
const repoDropdown = document.getElementById("repoDropdown");

const projectsList = document.getElementById("projects-list");

// state
let selectedCategories = [];
let selectedTech = [];
let allProjects = [];
let githubRepos = [];

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

// render admin list
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
        <button onclick="editProject(${p.id})">Edit</button>
        <button onclick="deleteProject(${p.id})">Delete</button>
      </div>
    `;

    projectsList.appendChild(projectDiv);
  });
}

// edit project
function editProject(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;

  titleInput.value = project.title;
  descriptionInput.value = project.description;
  demoInput.value = project.demo || "";
  githubInput.value = project.github || "";

  selectedCategories = project.category ? project.category.split(", ") : [];
  categoryBubbles.innerHTML = "";
  selectedCategories.forEach(cat =>
    addBubble(cat, categoryBubbles, selectedCategories)
  );

  selectedTech = project.tech ? project.tech.split(", ") : [];
  techBubbles.innerHTML = "";
  selectedTech.forEach(tech =>
    addBubble(tech, techBubbles, selectedTech)
  );

  renderPreview();

  submitBtn.textContent = "Update Project";
  submitBtn.dataset.editId = id;
}

// delete project
async function deleteProject(id) {
  try {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    loadProjects();
  } catch (err) {
    console.error("Delete error:", err);
  }
}

// bubble system
function addBubble(value, container, selectedArray) {
  if (!value || selectedArray.includes(value)) return;

  selectedArray.push(value);

  const bubble = document.createElement("span");
  bubble.classList.add("bubble");
  bubble.textContent = value;

  const removeBtn = document.createElement("span");
  removeBtn.textContent = "x";

  removeBtn.onclick = () => {
    selectedArray.splice(selectedArray.indexOf(value), 1);
    bubble.remove();
  };

  bubble.appendChild(removeBtn);
  container.appendChild(bubble);
}

// dropdown handlers
categoryDropdown.addEventListener("change", () => {
  addBubble(categoryDropdown.value, categoryBubbles, selectedCategories);
  categoryDropdown.value = "";
});

techDropdown.addEventListener("change", () => {
  addBubble(techDropdown.value, techBubbles, selectedTech);
  techDropdown.value = "";
});

// preview
function renderPreview(url) {
  previewContainer.innerHTML = `
    <div class="project">
      ${url ? `<img src="${url}">` : ""}
      <h3>${titleInput.value}</h3>
      <p>${descriptionInput.value}</p>
      <p>${selectedCategories.join(", ")}</p>
      <p>${selectedTech.join(", ")}</p>
    </div>
  `;
}

// form inputs update preview
[titleInput, descriptionInput, demoInput, githubInput].forEach(input => {
  input.addEventListener("input", () => renderPreview());
});

mediaInput.addEventListener("change", () => {
  renderPreview();
});

// upload media
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

// load github repos
async function loadGitHubRepos() {
  try {
    const res = await fetch("https://api.github.com/users/KDavis00/repos");
    githubRepos = await res.json();

    repoDropdown.innerHTML = `<option value="">Select repo</option>`;

    githubRepos.forEach((repo, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = repo.name;
      repoDropdown.appendChild(option);
    });
  } catch (err) {
    console.error("GitHub load failed:", err);
  }
}

// fill form from repo
repoDropdown.addEventListener("change", () => {
  const repo = githubRepos[repoDropdown.value];
  if (!repo) return;

  titleInput.value = repo.name || "";
  descriptionInput.value = repo.description || "";
  githubInput.value = repo.html_url || "";
  demoInput.value = repo.homepage || "";

  selectedCategories = [];
  selectedTech = repo.language ? [repo.language] : [];

  categoryBubbles.innerHTML = "";
  techBubbles.innerHTML = "";

  selectedTech.forEach(t =>
    addBubble(t, techBubbles, selectedTech)
  );

  renderPreview();
});

// submit form
form.addEventListener("submit", async e => {
  e.preventDefault();

  submitBtn.disabled = true;

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

// init
loadProjects();
loadGitHubRepos();
