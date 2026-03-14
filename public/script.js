/* Homepage JS: Fetch and Display Projects */

const projectsContainer = document.getElementById("projects");
const categoryFilter = document.getElementById("categoryFilter");

// Render a single project card
function renderProject(project) {
  const card = document.createElement("div");
  card.className = "project";

  // Media: check if URL exists and is video or image
  let mediaHTML = "";
  if (project.url) {
    if (project.url.match(/\.(mp4|webm|ogg)$/i)) {
      mediaHTML = `<video src="${project.url}" controls></video>`;
    } else {
      mediaHTML = `<img src="${project.url}" alt="${project.title}">`;
    }
  }

  card.innerHTML = `
    ${mediaHTML}
    <h3>${project.title}</h3>
    <p>${project.description}</p>
    <p><strong>Category:</strong> ${project.category}</p>
    <p><strong>Tech:</strong> ${project.tech}</p>
    <p>
      ${project.demo ? `<a href="${project.demo}" target="_blank">Demo</a>` : ""}
      ${project.github ? `<a href="${project.github}" target="_blank">GitHub</a>` : ""}
    </p>
  `;

  projectsContainer.appendChild(card);
}

// Fetch projects from server
async function fetchProjects() {
  try {
    const res = await fetch("/api/projects");
    const projects = await res.json();

    // Optional: filter by category
    const selectedCategory = categoryFilter?.value || "";
    const filteredProjects = selectedCategory
      ? projects.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase())
      : projects;

    projectsContainer.innerHTML = ""; // clear previous
    filteredProjects.forEach(renderProject);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  }
}

// Initial load
fetchProjects();

// Filter change
if (categoryFilter) {
  categoryFilter.addEventListener("change", fetchProjects);
}