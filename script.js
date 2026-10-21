
/* =========================================================
   WRECKLESS SUPPLY®
   PROJECT 02 — STOREFRONT ENGINE
   File: script.js
   ========================================================= */

"use strict";

/* 01 — CONFIGURATION
   ========================================================= */

const CONFIG = {
  storageKey: "wreckless-supply-cart-v1",
  currency: "ZAR",
  locale: "en-ZA",
  maxQuantity: 10
};

const moneyFormatter = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0
});

/* 02 — PRODUCT DATABASE
   ========================================================= */

const PRODUCTS = [
  {
    id: "rm001",
    code: "RM—001 / HOODIE",
    name: "ARCHIVE HOODIE",
    category: "hoodies",
    price: 899,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    alt: "Black heavyweight hoodie",
    description:
      "The first recorded artifact. An oversized streetwear essential designed around the Wreckless archive identity.",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: "rm002",
    code: "RM—002 / TEE",
    name: "EVIDENCE TEE",
    category: "tees",
    price: 449,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    alt: "Minimal heavyweight white T-shirt",
    description:
      "A considered everyday essential from the Evidence series. Clean lines, understated design, and a statement built on action.",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: "rm003",
    code: "RM—003 / CREW",
    name: "PRESSURE CREWNECK",
    category: "hoodies",
    price: 749,
    image:
      "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=80",
    alt: "Dark minimalist crewneck sweatshirt",
    description:
      "An archive-inspired crewneck concept representing the discipline to keep moving under pressure.",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: "rm004",
    code: "RM—004 / OBJECT",
    name: "UNIFORM CAP",
    category: "accessories",
    price: 349,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80",
    alt: "Black structured streetwear cap",
    description:
      "A daily-issue accessory from the Wreckless Supply concept collection.",
    sizes: ["ONE SIZE"]
  }
];

/* 03 — APPLICATION STATE
   ========================================================= */

const state = {
  cart: [],
  activeFilter: "all",
  selectedProductId: null,
  selectedSize: null,
  lastFocusedElement: null,
  storageAvailable: true
};

const elements = {
  body: document.body,

  menuToggle: document.getElementById("menu-toggle"),
  navigation: document.getElementById("primary-navigation"),

  cartTrigger: document.getElementById("cart-trigger"),
  cartCount: document.getElementById("cart-count"),
  cartHeadingCount: document.getElementById("cart-heading-count"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartBackdrop: document.getElementById("cart-backdrop"),
  cartClose: document.getElementById("cart-close"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  continueShopping: document.getElementById("continue-shopping"),
  checkoutButton: document.getElementById("checkout-button"),

  productGrid: document.getElementById("product-grid"),
  productTotal: document.getElementById("product-total"),

  productDialog: document.getElementById("product-dialog"),
  dialogClose: document.getElementById("dialog-close"),
  dialogImage: document.getElementById("dialog-product-image"),
  dialogCode: document.getElementById("dialog-product-code"),
  dialogName: document.getElementById("dialog-product-name"),
  dialogPrice: document.getElementById("dialog-product-price"),
  dialogDescription: document.getElementById("dialog-product-description"),
  sizeSelector: document.getElementById("size-selector"),
  sizeOptions: document.getElementById("size-options"),
  sizeError: document.getElementById("size-error"),
  dialogAddButton: document.getElementById("dialog-add-button"),

  newsletterForm: document.getElementById("newsletter-form"),
  newsletterEmail: document.getElementById("newsletter-email"),
  newsletterMessage: document.getElementById("newsletter-message"),

  liveAnnouncer: document.getElementById("live-announcer"),
  currentYear: document.getElementById("current-year")
};

/* 04 — UTILITIES
   ========================================================= */

function formatMoney(amount) {
  return moneyFormatter.format(amount);
}

function getProduct(productId) {
  return PRODUCTS.find(product => product.id === productId) || null;
}

function getCartQuantity() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartSubtotal() {
  return state.cart.reduce((total, item) => {
    const product = getProduct(item.productId);

    if (!product) {
      return total;
    }

    return total + product.price * item.quantity;
  }, 0);
}

function announce(message) {
  if (!elements.liveAnnouncer) {
    return;
  }

  elements.liveAnnouncer.textContent = "";

  window.requestAnimationFrame(() => {
    elements.liveAnnouncer.textContent = message;
  });
}

function getSafeImage(product) {
  return product.image;
}

function isValidCartItem(item) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const product = getProduct(item.productId);

  if (!product) {
    return false;
  }

  if (
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > CONFIG.maxQuantity
  ) {
    return false;
  }

  if (!product.sizes.includes(item.size)) {
    return false;
  }

  return true;
}

/* 05 — LOCAL STORAGE
   ========================================================= */

function saveCart() {
  try {
    localStorage.setItem(
      CONFIG.storageKey,
      JSON.stringify(state.cart)
    );

    state.storageAvailable = true;
  } catch (error) {
    state.storageAvailable = false;

    console.warn(
      "Wreckless Supply: cart persistence is unavailable.",
      error
    );
  }
}

function loadCart() {
  try {
    const storedCart = localStorage.getItem(CONFIG.storageKey);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    const restoredCart = [];

    parsedCart.forEach(item => {
      if (!isValidCartItem(item)) {
        return;
      }

      const existing = restoredCart.find(entry =>
        entry.productId === item.productId &&
        entry.size === item.size
      );

      if (existing) {
        existing.quantity = Math.min(
          CONFIG.maxQuantity,
          existing.quantity + item.quantity
        );
      } else {
        restoredCart.push({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity
        });
      }
    });

    return restoredCart;
  } catch (error) {
    console.warn("Wreckless Supply: saved cart could not be read.", error);
    return [];
  }
}

/* 06 — PRODUCT FILTERS
   ========================================================= */

function initializeFilters() {
  const filterButtons = document.querySelectorAll("[data-filter]");

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      if (!filter) {
        return;
      }

      state.activeFilter = filter;

      filterButtons.forEach(filterButton => {
        const isActive = filterButton === button;

        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      });

      renderProducts();
    });
  });
}

function renderProducts() {
  const cards = elements.productGrid.querySelectorAll(
    ".product-card[data-product-id]"
  );

  let visibleCount = 0;

  cards.forEach(card => {
    const category = card.dataset.category;

    const shouldShow =
      state.activeFilter === "all" ||
      category === state.activeFilter;

    card.hidden = !shouldShow;

    if (shouldShow) {
      visibleCount++;
    }
  });

  elements.productTotal.textContent =
    `${String(visibleCount).padStart(2, "0")} ARTIFACTS`;
}

/* 07 — PRODUCT DETAILS DIALOG
   ========================================================= */

function openProductDialog(productId, triggerElement) {
  const product = getProduct(productId);

  if (!product || !elements.productDialog) {
    return;
  }

  state.selectedProductId = product.id;
  state.selectedSize = null;
  state.lastFocusedElement = triggerElement || document.activeElement;

  elements.dialogImage.src = getSafeImage(product);
  elements.dialogImage.alt = product.alt;
  elements.dialogCode.textContent = product.code;
  elements.dialogName.textContent = product.name;
  elements.dialogPrice.textContent = formatMoney(product.price);
  elements.dialogDescription.textContent = product.description;

  elements.sizeOptions.replaceChildren();

  product.sizes.forEach(size => {
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.size = size;
    button.textContent = size;
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      selectProductSize(size);
    });

    elements.sizeOptions.appendChild(button);
  });

  elements.sizeSelector.hidden = product.sizes.length === 1;

  if (product.sizes.length === 1) {
    state.selectedSize = product.sizes[0];
  }

  elements.sizeError.textContent = "";

  if (!elements.productDialog.open) {
    elements.productDialog.showModal();
  }

  elements.dialogClose.focus();
}

function selectProductSize(size) {
  const product = getProduct(state.selectedProductId);

  if (!product || !product.sizes.includes(size)) {
    return;
  }

  state.selectedSize = size;
  elements.sizeError.textContent = "";

  const sizeButtons = elements.sizeOptions.querySelectorAll(
    "[data-size]"
  );

  sizeButtons.forEach(button => {
    const selected = button.dataset.size === size;

    button.setAttribute("aria-pressed", String(selected));
  });
}

function closeProductDialog() {
  if (!elements.productDialog.open) {
    return;
  }

  elements.productDialog.close();

  const focusTarget = state.lastFocusedElement;

  if (focusTarget && focusTarget.isConnected) {
    focusTarget.focus();
  }

  state.lastFocusedElement = null;
}

function initializeProductInteractions() {
  elements.productGrid.addEventListener("click", event => {
    const detailsButton = event.target.closest("[data-product-details]");
    const addButton = event.target.closest("[data-add-product]");

    if (detailsButton) {
      openProductDialog(
        detailsButton.dataset.productDetails,
        detailsButton
      );

      return;
    }

    if (addButton) {
      openProductDialog(
        addButton.dataset.addProduct,
        addButton
      );
    }
  });

  document.querySelectorAll(
    ".spotlight [data-add-product]"
  ).forEach(button => {
    button.addEventListener("click", () => {
      openProductDialog(button.dataset.addProduct, button);
    });
  });

  elements.dialogClose.addEventListener("click", closeProductDialog);

  elements.productDialog.addEventListener("click", event => {
    if (event.target === elements.productDialog) {
      closeProductDialog();
    }
  });

  elements.dialogAddButton.addEventListener("click", () => {
    const product = getProduct(state.selectedProductId);

    if (!product) {
      return;
    }

    if (!state.selectedSize) {
      elements.sizeError.textContent = "SELECT A SIZE TO CONTINUE.";

      const firstSizeButton = elements.sizeOptions.querySelector(
        "[data-size]"
      );

      if (firstSizeButton) {
        firstSizeButton.focus();
      }

      return;
    }

    const result = addToCart(product.id, state.selectedSize);

    if (!result.success) {
      elements.sizeError.textContent = result.message;
      return;
    }

    closeProductDialog();
    openCart();
  });
}

/* 08 — CART OPERATIONS
   ========================================================= */

function addToCart(productId, size) {
  const product = getProduct(productId);

  if (!product || !product.sizes.includes(size)) {
    return {
      success: false,
      message: "THIS ITEM OR SIZE IS UNAVAILABLE."
    };
  }

  const existingItem = state.cart.find(item =>
    item.productId === productId &&
    item.size === size
  );

  if (existingItem) {
    if (existingItem.quantity >= CONFIG.maxQuantity) {
      return {
        success: false,
        message: `MAXIMUM ${CONFIG.maxQuantity} PER SIZE.`
      };
    }

    existingItem.quantity++;
  } else {
    state.cart.push({
      productId,
      size,
      quantity: 1
    });
  }

  saveCart();
  renderCart();

  announce(
    `${product.name}, size ${size}, added to your bag.`
  );

  return {
    success: true,
    message: `${product.name} ADDED TO BAG.`
  };
}

function changeQuantity(productId, size, delta) {
  const item = state.cart.find(entry =>
    entry.productId === productId &&
    entry.size === size
  );

  if (!item || !Number.isInteger(delta)) {
    return;
  }

  const nextQuantity = item.quantity + delta;

  if (nextQuantity < 1) {
    removeFromCart(productId, size);
    return;
  }

  if (nextQuantity > CONFIG.maxQuantity) {
    announce(`MAXIMUM ${CONFIG.maxQuantity} PER SIZE.`);
    return;
  }

  item.quantity = nextQuantity;

  saveCart();
  renderCart();
}

function removeFromCart(productId, size) {
  const item = state.cart.find(entry =>
    entry.productId === productId &&
    entry.size === size
  );

  if (!item) {
    return;
  }

  const product = getProduct(productId);

  state.cart = state.cart.filter(entry =>
    !(
      entry.productId === productId &&
      entry.size === size
    )
  );

  saveCart();
  renderCart();

  announce(`${product ? product.name : "Item"} removed from your bag.`);
}

/* 09 — CART RENDERING
   ========================================================= */

function renderCart() {
  const itemCount = getCartQuantity();

  elements.cartCount.textContent = String(itemCount).padStart(2, "0");
  elements.cartHeadingCount.textContent =
    `(${String(itemCount).padStart(2, "0")})`;

  elements.cartTrigger.setAttribute(
    "aria-label",
    `Open shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
  );

  elements.cartSubtotal.textContent = formatMoney(getCartSubtotal());

  elements.checkoutButton.disabled = state.cart.length === 0;

  elements.cartItems.replaceChildren();

  if (state.cart.length === 0) {
    renderEmptyCart();
    return;
  }

  const fragment = document.createDocumentFragment();

  state.cart.forEach(item => {
    const product = getProduct(item.productId);

    if (!product) {
      return;
    }

    const article = document.createElement("article");
    article.className = "cart-item";

    const image = document.createElement("img");
    image.className = "cart-item-image";
    image.src = getSafeImage(product);
    image.alt = product.alt;
    image.loading = "lazy";
    image.width = 95;
    image.height = 118;

    const details = document.createElement("div");
    details.className = "cart-item-details";

    const code = document.createElement("p");
    code.className = "cart-item-code";
    code.textContent = product.code;

    const name = document.createElement("h3");
    name.className = "cart-item-name";
    name.textContent = product.name;

    const size = document.createElement("p");
    size.className = "cart-item-size";
    size.textContent = `SIZE: ${item.size}`;

    const bottom = document.createElement("div");
    bottom.className = "cart-item-bottom";

    const quantityControl = document.createElement("div");
    quantityControl.className = "quantity-control";
    quantityControl.setAttribute("aria-label", `${product.name} quantity`);

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.textContent = "−";
    decreaseButton.setAttribute(
      "aria-label",
      `Decrease ${product.name} quantity`
    );

    decreaseButton.addEventListener("click", () => {
      changeQuantity(product.id, item.size, -1);
    });

    const quantity = document.createElement("span");
    quantity.textContent = String(item.quantity);
    quantity.setAttribute("aria-live", "polite");

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute(
      "aria-label",
      `Increase ${product.name} quantity`
    );

    increaseButton.disabled = item.quantity >= CONFIG.maxQuantity;

    increaseButton.addEventListener("click", () => {
      changeQuantity(product.id, item.size, 1);
    });

    quantityControl.append(
      decreaseButton,
      quantity,
      increaseButton
    );

    const lineTotal = document.createElement("span");
    lineTotal.className = "cart-item-line-total";
    lineTotal.textContent = formatMoney(product.price * item.quantity);

    bottom.append(quantityControl, lineTotal);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "cart-remove";
    removeButton.textContent = "REMOVE";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${product.name}, size ${item.size}`
    );

    removeButton.addEventListener("click", () => {
      removeFromCart(product.id, item.size);
    });

    details.append(
      code,
      name,
      size,
      bottom,
      removeButton
    );

    article.append(image, details);
    fragment.appendChild(article);
  });

  elements.cartItems.appendChild(fragment);
}

function renderEmptyCart() {
  const wrapper = document.createElement("div");
  wrapper.className = "cart-empty";

  const symbol = document.createElement("span");
  symbol.className = "cart-empty-symbol";
  symbol.textContent = "W.";

  const heading = document.createElement("h3");
  heading.textContent = "NOTHING ON RECORD.";

  const description = document.createElement("p");
  description.textContent =
    "Your bag is currently empty. Find something worth keeping.";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-dark";
  button.textContent = "EXPLORE THE DROP ↗";

  button.addEventListener("click", () => {
    closeCart();
    document.getElementById("collection").scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  });

  wrapper.append(symbol, heading, description, button);
  elements.cartItems.appendChild(wrapper);
}

/* 10 — CART DRAWER ACCESSIBILITY
   ========================================================= */

function openCart() {
  if (elements.cartDrawer.classList.contains("is-open")) {
    return;
  }

  closeMobileMenu();

  state.lastFocusedElement = document.activeElement;

  elements.cartBackdrop.hidden = false;
  elements.cartDrawer.inert = false;
  elements.cartDrawer.setAttribute("aria-hidden", "false");

  elements.body.classList.add("cart-open");

  elements.cartDrawer.classList.add("is-open");

  requestAnimationFrame(() => {
    elements.cartBackdrop.classList.add("is-visible");
  });

  elements.cartClose.focus();
}

function closeCart() {
  if (!elements.cartDrawer.classList.contains("is-open")) {
    return;
  }

  elements.cartDrawer.classList.remove("is-open");
  elements.cartBackdrop.classList.remove("is-visible");

  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.cartDrawer.inert = true;

  elements.body.classList.remove("cart-open");

  const focusTarget = state.lastFocusedElement;
  state.lastFocusedElement = null;

  window.setTimeout(() => {
    if (!elements.cartDrawer.classList.contains("is-open")) {
      elements.cartBackdrop.hidden = true;
    }
  }, 360);

  if (focusTarget && focusTarget.isConnected) {
    focusTarget.focus();
  } else {
    elements.cartTrigger.focus();
  }
}

function initializeCartDrawer() {
  elements.cartTrigger.addEventListener("click", openCart);
  elements.cartClose.addEventListener("click", closeCart);
  elements.cartBackdrop.addEventListener("click", closeCart);

  elements.continueShopping.addEventListener("click", () => {
    closeCart();

    document.getElementById("collection").scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  });

  elements.checkoutButton.addEventListener("click", () => {
    if (state.cart.length === 0) {
      return;
    }

    const total = formatMoney(getCartSubtotal());

    window.alert(
      "WRECKLESS SUPPLY — DEMO CHECKOUT\n\n" +
      `Bag subtotal: ${total}\n\n` +
      "This portfolio demonstration does not process payments, " +
      "create orders, or collect payment information.\n\n" +
      "No transaction has taken place."
    );
  });
}

/* 11 — MOBILE NAVIGATION
   ========================================================= */

function openMobileMenu() {
  elements.navigation.classList.add("is-open");
  elements.menuToggle.setAttribute("aria-expanded", "true");
  elements.menuToggle.setAttribute("aria-label", "Close navigation");

  elements.body.classList.add("menu-open");
}

function closeMobileMenu() {
  elements.navigation.classList.remove("is-open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
  elements.menuToggle.setAttribute("aria-label", "Open navigation");

  elements.body.classList.remove("menu-open");
}

function initializeMobileNavigation() {
  elements.menuToggle.addEventListener("click", () => {
    const isOpen =
      elements.menuToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  elements.navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeMobileMenu();
    }
  });
}

/* 12 — NEWSLETTER VALIDATION
   ========================================================= */

function initializeNewsletter() {
  elements.newsletterForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = elements.newsletterEmail.value.trim();

    if (!elements.newsletterEmail.checkValidity() || !email) {
      elements.newsletterMessage.textContent =
        "PLEASE ENTER A VALID EMAIL ADDRESS.";

      elements.newsletterMessage.style.color = "var(--red)";

      elements.newsletterEmail.focus();
      return;
    }

    elements.newsletterMessage.textContent =
      "DEMO COMPLETE — NO EMAIL WAS SENT OR STORED. CONNECT A NEWSLETTER SERVICE TO ENABLE SIGNUPS.";

    elements.newsletterMessage.style.color = "var(--black)";

    announce("Newsletter demo validation successful. No signup was submitted.");

    // Intentionally no network request and no personal data storage.
  });

  elements.newsletterEmail.addEventListener("input", () => {
    elements.newsletterMessage.style.color = "var(--grey)";
    elements.newsletterMessage.textContent =
      "DEMO FORM — NO EMAILS WILL BE SENT OR STORED ON A SERVER.";
  });
}

/* 13 — KEYBOARD AND GLOBAL INTERACTIONS
   ========================================================= */

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

function initializeGlobalKeyboardControls() {
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.productDialog.open) {
      closeProductDialog();
      return;
    }

    if (elements.cartDrawer.classList.contains("is-open")) {
      closeCart();
      return;
    }

    closeMobileMenu();
  });
}

/* 14 — INITIALIZE STORE
   ========================================================= */

function initializeStore() {
  state.cart = loadCart();

  if (elements.currentYear) {
    elements.currentYear.textContent = String(
      new Date().getFullYear()
    );
  }

  initializeFilters();
  initializeProductInteractions();
  initializeCartDrawer();
  initializeMobileNavigation();
  initializeNewsletter();
  initializeGlobalKeyboardControls();

  renderProducts();
  renderCart();

  console.info(
    "WRECKLESS SUPPLY® initialized.",
    `${PRODUCTS.length} demo products available.`
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeStore, {
    once: true
  });
} else {
  initializeStore();
}
