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

// Store selected values
let selectedCategories = [];
let selectedTech = [];

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
  };

  bubble.appendChild(removeBtn);
  container.appendChild(bubble);
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
  submitBtn.textContent = "Uploading...";

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

  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project)
    });
    const data = await res.json();
    if (data.id) alert(`Project added! ID: ${data.id}`);
    else alert("Project added but ID not returned");

    // Reset
    form.reset();
    previewContainer.innerHTML = "";
    selectedCategories = [];
    selectedTech = [];
    categoryBubbles.innerHTML = "";
    techBubbles.innerHTML = "";
  } catch (err) {
    console.error(err);
    alert("Failed to save project");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Add Project";
});