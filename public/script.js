let allProjects = []; // store fetched projects

async function loadProjects() {
  const res = await fetch("/api/projects");
  allProjects = await res.json();
  renderProjects("All");
}

// Render projects for a category
function renderProjects(category) {
  const container = document.getElementById("projects");
  container.innerHTML = "";

  const filtered = category === "All"
    ? allProjects
    : allProjects.filter(p => p.category.split(', ').includes(category));

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      ${p.url ? `<img src="${p.url}" alt="${p.title}">` : ""}
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <p>
        ${p.demo ? `<a href="${p.demo}" target="_blank">Demo</a>` : ""}
        ${p.github ? `<a href="${p.github}" target="_blank">GitHub</a>` : ""}
      </p>
    `;
    container.appendChild(card);
  });
}

// Set up filter buttons
document.querySelectorAll("#filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
    // Set this button active
    btn.classList.add("active");
    // Render projects for selected category
    renderProjects(btn.dataset.category);
  });
});

loadProjects();