const form = document.getElementById("projectForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const demoInput = document.getElementById("demo");
const githubInput = document.getElementById("github");
const mediaInput = document.getElementById("media");
const previewContainer = document.getElementById("preview");
const submitBtn = document.getElementById("submitBtn");

// Bubbles
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryBubbles = document.getElementById("categoryBubbles");
const techDropdown = document.getElementById("techDropdown");
const techBubbles = document.getElementById("techBubbles");

const projectsList = document.getElementById("projects-list");

// Store selected values
let selectedCategories = [];
let selectedTech = [];
let allProjects = []; // Store all projects for admin

// Load existing projects
async function loadProjects() {
  try {
    const res = await fetch("/api/projects");
    allProjects = await res.json();
    renderProjectsList();
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

// Render projects list in admin
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

// Edit project
function editProject(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;

  // Populate form
  titleInput.value = project.title;
  descriptionInput.value = project.description;
  demoInput.value = project.demo || "";
  githubInput.value = project.github || "";
  
  // Populate categories
  selectedCategories = project.category ? project.category.split(', ') : [];
  categoryBubbles.innerHTML = "";
  selectedCategories.forEach(cat => addBubble(cat, categoryBubbles, selectedCategories));
  
  // Populate tech
  selectedTech = project.tech ? project.tech.split(', ') : [];
  techBubbles.innerHTML = "";
  selectedTech.forEach(tech => addBubble(tech, techBubbles, selectedTech));
  
  // Update preview
  renderPreview(project.url || "");
  
  // Change submit button to update
  submitBtn.textContent = "Update Project";
  submitBtn.dataset.editId = id;
}

// Delete project
async function deleteProject(id) {
  if (!confirm("Are you sure you want to delete this project?")) return;
  
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Project deleted!");
      loadProjects(); // Reload the list
    } else {
      alert("Failed to delete project");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete project");
  }
}

// Add bubble function
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
    renderPreview(mediaInput.files[0] ? URL.createObjectURL(mediaInput.files[0]) : "");
  };

  bubble.appendChild(removeBtn);
  container.appendChild(bubble);
  renderPreview(mediaInput.files[0] ? URL.createObjectURL(mediaInput.files[0]) : "");
}

// Dropdown click event
categoryDropdown.addEventListener("change", () => {
  addBubble(categoryDropdown.value, categoryBubbles, selectedCategories);
  categoryDropdown.value = "";
});

techDropdown.addEventListener("change", () => {
  addBubble(techDropdown.value, techBubbles, selectedTech);
  techDropdown.value = "";
});

// Live preview
function renderPreview(url) {
  previewContainer.innerHTML = `
    <div class="project">
      ${url ? (url.match(/\.(mp4|webm|ogg)$/i) ? `<video src="${url}" controls></video>` : `<img src="${url}" alt="Preview">`) : ""}
      <h3>${titleInput.value}</h3>
      <p>${descriptionInput.value}</p>
      <p><strong>Category:</strong> ${selectedCategories.join(", ")}</p>
      <p><strong>Tech:</strong> ${selectedTech.join(", ")}</p>
      <p>
        ${demoInput.value ? `<a href="${demoInput.value}" target="_blank">Demo</a>` : ""}
        ${githubInput.value ? `<a href="${githubInput.value}" target="_blank">GitHub</a>` : ""}
      </p>
    </div>
  `;
}

[titleInput, descriptionInput, demoInput, githubInput].forEach(input => {
  input.addEventListener("input", () => renderPreview(mediaInput.files[0] ? URL.createObjectURL(mediaInput.files[0]) : ""));
});

mediaInput.addEventListener("change", () => {
  if (mediaInput.files[0]) renderPreview(URL.createObjectURL(mediaInput.files[0]));
});

// Upload media to Cloudinary
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
    alert("Media upload failed");
    return "";
  }
}

// Submit form
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
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project)
    });
    const data = await res.json();
    
    if (editId) {
      alert("Project updated!");
    } else {
      if (data.id) alert(`Project added! ID: ${data.id}`);
      else alert("Project added but ID not returned");
    }

    // Reset
    form.reset();
    previewContainer.innerHTML = "";
    selectedCategories = [];
    selectedTech = [];
    categoryBubbles.innerHTML = "";
    techBubbles.innerHTML = "";
    delete submitBtn.dataset.editId;
    submitBtn.textContent = "Add Project";
    
    // Reload projects list
    loadProjects();
  } catch (err) {
    console.error(err);
    alert("Failed to save project");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = submitBtn.dataset.editId ? "Update Project" : "Add Project";
});

// Load projects on page load
loadProjects();