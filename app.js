const businesses = [];

const businessListEl = document.querySelector("#businessList");
const emptyStateEl = document.querySelector("#emptyState");
const searchInputEl = document.querySelector("#searchInput");
const formSectionEl = document.querySelector("#formSection");
const toggleFormButton = document.querySelector("#toggleFormButton");
const cancelButton = document.querySelector("#cancelButton");
const businessForm = document.querySelector("#businessForm");
const copyrightYearEl = document.querySelector("#copyrightYear");

const renderBusinesses = (items) => {
  businessListEl.innerHTML = "";

  if (items.length === 0) {
    emptyStateEl.hidden = false;
    businessListEl.setAttribute("aria-live", "polite");
    return;
  }

  emptyStateEl.hidden = true;

  const fragment = document.createDocumentFragment();

  items.forEach((business) => {
    const card = document.createElement("article");
    card.className = "business";
    card.setAttribute("role", "listitem");

    const title = document.createElement("h3");
    title.className = "business__name";
    title.textContent = business.name;

    const meta = document.createElement("div");
    meta.className = "business__meta";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge";
    categoryBadge.textContent = business.category;

    const locationBadge = document.createElement("span");
    locationBadge.className = "badge";
    locationBadge.textContent = business.location;

    const description = document.createElement("p");
    description.className = "business__description";
    description.textContent = business.description || "No description provided.";

    meta.append(categoryBadge, locationBadge);
    card.append(title, meta, description);
    fragment.append(card);
  });

  businessListEl.append(fragment);
};

const filterBusinesses = (query) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    renderBusinesses(businesses);
    return;
  }

  const filtered = businesses.filter(({ name, category, location, description }) => {
    const haystack = [name, category, location, description].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  renderBusinesses(filtered);
};

const toggleFormVisibility = (show) => {
  const shouldShow = typeof show === "boolean" ? show : formSectionEl.classList.contains("form--hidden");

  if (shouldShow) {
    formSectionEl.classList.remove("form--hidden");
    formSectionEl.setAttribute("aria-hidden", "false");
    toggleFormButton.setAttribute("aria-expanded", "true");
  } else {
    formSectionEl.classList.add("form--hidden");
    formSectionEl.setAttribute("aria-hidden", "true");
    toggleFormButton.setAttribute("aria-expanded", "false");
  }
};

const handleFormSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(businessForm);
  const entry = Object.fromEntries(formData.entries());

  if (!entry.name || !entry.category || !entry.location) {
    alert("Please fill in the required fields: name, category, and location.");
    return;
  }

  entry.description = entry.description?.trim();

  businesses.unshift(entry);
  renderBusinesses(businesses);
  toggleFormVisibility(false);
  businessForm.reset();
};

const handleSearchInput = (event) => {
  filterBusinesses(event.target.value);
};

const init = () => {
  renderBusinesses(businesses);
  searchInputEl.addEventListener("input", handleSearchInput);
  toggleFormButton.addEventListener("click", () => toggleFormVisibility());
  cancelButton.addEventListener("click", () => {
    toggleFormVisibility(false);
  });
  businessForm.addEventListener("submit", handleFormSubmit);
  businessForm.addEventListener("reset", () => toggleFormVisibility(false));

  const currentYear = new Date().getFullYear();
  copyrightYearEl.textContent = currentYear;
};

document.addEventListener("DOMContentLoaded", init);
