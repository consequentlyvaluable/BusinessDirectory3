let supabaseClient;
let businesses = [];
let lastQuery = "";

const businessListEl = document.querySelector("#businessList");
const emptyStateEl = document.querySelector("#emptyState");
const statusMessageEl = document.querySelector("#statusMessage");
const searchInputEl = document.querySelector("#searchInput");
const formSectionEl = document.querySelector("#formSection");
const popoverEl = document.querySelector("#businessPopover");
const popoverContentEl = popoverEl?.querySelector(".popover__content");
const popoverCloseButton = popoverEl?.querySelector(".popover__close");
const toggleFormButton = document.querySelector("#toggleFormButton");
const cancelButton = document.querySelector("#cancelButton");
const businessForm = document.querySelector("#businessForm");
const submitButton = businessForm.querySelector('[type="submit"]');
const categoryOptionsList = document.querySelector("#categoryOptions");
const copyrightYearEl = document.querySelector("#copyrightYear");
const locationInput = businessForm?.querySelector('input[name="location"]');
const nameInput = businessForm?.querySelector('input[name="name"]');

let googleMapsLoadedPromise;
let locationAutocomplete;
let currentPopoverAnchor = null;

const loadGoogleMapsPlaces = () => {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsLoadedPromise) {
    return googleMapsLoadedPromise;
  }

  const config = window.googleMapsConfig ?? {};
  const apiKey = config.apiKey?.trim();
  const isPlaceholder = apiKey && /YOUR_GOOGLE_MAPS_API_KEY/i.test(apiKey);

  if (!apiKey || isPlaceholder) {
    return Promise.resolve(null);
  }

  googleMapsLoadedPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      libraries: "places",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps did not load as expected."));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load the Google Maps script."));
    };

    document.head.append(script);
  })
    .catch((error) => {
      console.error(error);
      googleMapsLoadedPromise = null;
      return null;
    });

  return googleMapsLoadedPromise;
};

const setupLocationAutocomplete = async () => {
  if (!locationInput) return;
  if (locationAutocomplete) return;

  try {
    const maps = await loadGoogleMapsPlaces();

    if (!maps?.places) return;

    locationAutocomplete = new maps.places.Autocomplete(locationInput, {
      fields: ["formatted_address", "name"],
    });

    locationAutocomplete.addListener("place_changed", () => {
      const place = locationAutocomplete.getPlace();
      if (!place) return;

      if (place.formatted_address) {
        locationInput.value = place.formatted_address;
      }

      if (place.name && nameInput && !nameInput.value.trim()) {
        nameInput.value = place.name;
      }
    });
  } catch (error) {
    console.error("Unable to initialise Google Maps autocomplete", error);
  }
};

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

const hideBusinessPopover = () => {
  if (!popoverEl) return;
  popoverEl.hidden = true;
  popoverEl.classList.remove("is-visible");
  popoverEl.style.left = "";
  popoverEl.style.top = "";
  popoverEl.style.removeProperty("--arrow-offset");
  currentPopoverAnchor = null;
};

const positionBusinessPopover = () => {
  if (!popoverEl || !currentPopoverAnchor || popoverEl.hidden) return;

  const anchorRect = currentPopoverAnchor.getBoundingClientRect();
  const popoverRect = popoverEl.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;

  const offset = 12;
  const top = window.scrollY + anchorRect.bottom + offset;
  const preferredLeft = window.scrollX + anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
  const minLeft = window.scrollX + 12;
  const maxLeft = window.scrollX + viewportWidth - popoverRect.width - 12;
  const left = Math.min(Math.max(preferredLeft, minLeft), Math.max(minLeft, maxLeft));

  popoverEl.style.top = `${top}px`;
  popoverEl.style.left = `${left}px`;

  const arrowOffset = anchorRect.left + anchorRect.width / 2 - left;
  popoverEl.style.setProperty("--arrow-offset", `${arrowOffset}px`);
};

const showBusinessPopover = (business, anchorEl) => {
  if (!popoverEl || !popoverContentEl) return;

  currentPopoverAnchor = anchorEl;

  popoverContentEl.innerHTML = `
    <h3 class="popover__title">${business.name}</h3>
    <div class="popover__meta">
      <span class="badge">${business.category}</span>
      <span class="badge">${business.location}</span>
    </div>
    <p class="popover__description">${business.description || "No description provided."}</p>
  `;

  popoverEl.hidden = false;
  popoverEl.classList.add("is-visible");
  popoverEl.style.visibility = "hidden";

  requestAnimationFrame(() => {
    positionBusinessPopover();
    popoverEl.style.visibility = "visible";
  });
};

document.addEventListener("click", (event) => {
  if (!popoverEl || popoverEl.hidden) return;
  if (popoverEl.contains(event.target)) return;
  if (currentPopoverAnchor?.contains(event.target)) return;
  hideBusinessPopover();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideBusinessPopover();
  }
});

window.addEventListener("scroll", () => {
  if (!popoverEl || popoverEl.hidden) return;
  positionBusinessPopover();
});

window.addEventListener("resize", () => {
  if (!popoverEl || popoverEl.hidden) return;
  positionBusinessPopover();
});

const renderBusinesses = (items) => {
  hideBusinessPopover();
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

    const openPopover = () => showBusinessPopover(business, card);
    card.tabIndex = 0;
    card.addEventListener("click", openPopover);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPopover();
      }
    });

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
  popoverCloseButton?.addEventListener("click", hideBusinessPopover);
  toggleFormButton.addEventListener("click", () => toggleFormVisibility());
  cancelButton.addEventListener("click", () => {
    toggleFormVisibility(false);
  });
  businessForm.addEventListener("submit", handleFormSubmit);
  businessForm.addEventListener("reset", () => toggleFormVisibility(false));
  setupLocationAutocomplete();

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

