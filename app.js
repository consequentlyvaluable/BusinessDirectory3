let supabaseClient;
let businesses = [];
let lastQuery = "";

const businessListEl = document.querySelector("#businessList");
const emptyStateEl = document.querySelector("#emptyState");
const statusMessageEl = document.querySelector("#statusMessage");
const searchInputEl = document.querySelector("#searchInput");
const formSectionEl = document.querySelector("#formSection");
const toggleFormButton = document.querySelector("#toggleFormButton");
const cancelButton = document.querySelector("#cancelButton");
const businessForm = document.querySelector("#businessForm");
const submitButton = businessForm.querySelector('[type="submit"]');
const categoryOptionsList = document.querySelector("#categoryOptions");
const copyrightYearEl = document.querySelector("#copyrightYear");

const setStatusMessage = (message, { variant } = {}) => {
  if (!message) {
    statusMessageEl.hidden = true;
    statusMessageEl.textContent = "";
    delete statusMessageEl.dataset.variant;
    return;
  }

  statusMessageEl.hidden = false;
  statusMessageEl.textContent = message;

  if (variant) {
    statusMessageEl.dataset.variant = variant;
  } else {
    delete statusMessageEl.dataset.variant;
  }
};

const updateCategoryOptions = () => {
  if (!categoryOptionsList) return;

  const seen = new Set();
  const options = [];

  businesses.forEach(({ category }) => {
    const value = category?.trim();
    if (!value) return;

    const key = value.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    options.push(value);
  });

  categoryOptionsList.innerHTML = "";

  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    categoryOptionsList.append(option);
  });
};

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
  lastQuery = query;
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    renderBusinesses(businesses);
    return;
  }

  // For larger datasets consider issuing a filtered query to Supabase instead of client-side filtering.
  const filtered = businesses.filter(({ name, category, location, description }) => {
    const haystack = [name, category, location, description].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  renderBusinesses(filtered);
};

const loadBusinesses = async () => {
  setStatusMessage("Loading businesses…");
  businessListEl.setAttribute("aria-busy", "true");
  emptyStateEl.hidden = true;

  const { data, error } = await supabaseClient
    .from("businesses")
    .select("id, name, category, location, description");

  businessListEl.removeAttribute("aria-busy");

  if (error) {
    businesses = [];
    renderBusinesses([]);
    setStatusMessage(`Unable to load businesses: ${error.message}`, {
      variant: "error",
    });
    updateCategoryOptions();
    return;
  }

  businesses = data ?? [];
  updateCategoryOptions();
  setStatusMessage("");

  if (!lastQuery) {
    renderBusinesses(businesses);
  } else {
    filterBusinesses(lastQuery);
  }
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

const handleFormSubmit = async (event) => {
  event.preventDefault();

  const formData = new FormData(businessForm);
  const entry = Object.fromEntries(formData.entries());

  if (!entry.name || !entry.category || !entry.location) {
    alert("Please fill in the required fields: name, category, and location.");
    return;
  }

  if (!supabaseClient) {
    setStatusMessage("Supabase client is not configured. Please check your settings.", {
      variant: "error",
    });
    return;
  }

  entry.name = entry.name.trim();
  entry.category = entry.category.trim();
  entry.location = entry.location.trim();
  entry.description = entry.description?.trim() || null;

  submitButton.disabled = true;
  setStatusMessage("Saving business…");

  const { data, error } = await supabaseClient
    .from("businesses")
    .insert([entry])
    .select()
    .single();

  submitButton.disabled = false;

  if (error) {
    setStatusMessage(`Unable to save business: ${error.message}`, {
      variant: "error",
    });
    return;
  }

  if (data) {
    businesses = [data, ...businesses];
    updateCategoryOptions();
    filterBusinesses(lastQuery);
  } else {
    await loadBusinesses();
  }

  setStatusMessage("Business saved successfully!");
  toggleFormVisibility(false);
  businessForm.reset();
};

const handleSearchInput = (event) => {
  filterBusinesses(event.target.value);
};

const init = async () => {
  renderBusinesses(businesses);
  updateCategoryOptions();
  searchInputEl.addEventListener("input", handleSearchInput);
  toggleFormButton.addEventListener("click", () => toggleFormVisibility());
  cancelButton.addEventListener("click", () => {
    toggleFormVisibility(false);
  });
  businessForm.addEventListener("submit", handleFormSubmit);
  businessForm.addEventListener("reset", () => toggleFormVisibility(false));

  const currentYear = new Date().getFullYear();
  copyrightYearEl.textContent = currentYear;

  const config = window.supabaseConfig ?? {};

  if (!config.url || !config.key) {
    setStatusMessage(
      "Supabase configuration is missing. Update window.supabaseConfig with your project details.",
      { variant: "error" }
    );
    return;
  }

  const { createClient } = supabase;
  supabaseClient = createClient(config.url, config.key);

  try {
    await loadBusinesses();
  } catch (error) {
    setStatusMessage(`Unexpected error loading businesses: ${error.message}`, {
      variant: "error",
    });
  }
};

// THEME TOGGLE LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    toggle.checked = theme === "light";
  };

  const saved = localStorage.getItem("theme");
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const prefersDark = mediaQuery.matches;
  const initialTheme = saved || (prefersDark ? "dark" : "light");

  applyTheme(initialTheme);

  toggle.addEventListener("change", (event) => {
    const theme = event.target.checked ? "light" : "dark";
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  });

  mediaQuery.addEventListener("change", (event) => {
    if (localStorage.getItem("theme")) return;
    applyTheme(event.matches ? "dark" : "light");
  });
});

init();

