document.addEventListener("DOMContentLoaded", () => {
  const allMenuItems = [
    ...kaftaItems,
    ...tawoukItems,
    ...sandwichItems,
    ...burgerItems,
    ...comboItems,
    ...friesItems,
    ...dessertItems,
    ...drinkItems,
  ];

  // --- Element Selectors ---
  const menuContainer = document.getElementById("menu-container");
  const searchInput = document.getElementById("search-input");
  const filterContainer = document.querySelector(".filter-container");
  const currencyToggleBtn = document.getElementById("currency-toggle");
  const cartIcon = document.getElementById("cart-icon-wrapper");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartCountElement = document.getElementById("cart-count");
  const cartSubtotalElement = document.getElementById("cart-subtotal");
  const toastNotification = document.getElementById("toast-notification");
  // Modal selectors
  const modal = document.getElementById("customization-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalTitle = document.getElementById("modal-title");
  const modalRemovalsList = document.getElementById("modal-removals-list");
  const modalAddonsList = document.getElementById("modal-addons-list");
  const modalNotesInput = document.getElementById("modal-notes-input");
  const modalAddToCartBtn = document.getElementById("modal-add-to-cart-btn");
  const modalTotalPrice = document.getElementById("modal-total-price");

  // --- State Management ---
  let cart = [];
  let currentCurrency = "LBP";
  const exchangeRate = 90000;
  let currentItemForModal = null;
  let toastTimeout;

  // --- TOAST NOTIFICATION LOGIC ---
  function showToast(message) {
    clearTimeout(toastTimeout);
    toastNotification.textContent = message;
    toastNotification.classList.add("show");
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove("show");
    }, 3000);
  }

  // --- Price Formatting ---
  function formatPrice(priceInLBP) {
    if (currentCurrency === "USD") {
      return `$${(priceInLBP / exchangeRate).toFixed(2)}`;
    }
    return `${priceInLBP.toLocaleString()} L.L`;
  }

  // --- MODAL LOGIC ---
  function openModal(item) {
    currentItemForModal = item;
    modalTitle.textContent = item.name;
    const itemOptions = customizations[item.name] || {};
    populateOptions(modalRemovalsList, itemOptions.removals, "removal");
    populateOptions(modalAddonsList, itemOptions.addons, "addon");
    updateModalPrice();
    modal.classList.add("is-visible");
  }

  function closeModal() {
    modal.classList.remove("is-visible");
    modalNotesInput.value = "";
    currentItemForModal = null;
  }

  function populateOptions(listElement, options, type) {
    listElement.innerHTML = "";
    if (!options || options.length === 0) {
      listElement.parentElement.style.display = "none";
      return;
    }
    listElement.parentElement.style.display = "block";
    options.forEach((opt) => {
      const priceString = opt.price > 0 ? ` (+${formatPrice(opt.price)})` : "";
      listElement.innerHTML += `
        <div class="option-item">
            <label>
                <input type="checkbox" data-price="${opt.price}" data-name="${opt.name}" data-type="${type}">
                ${opt.name}
            </label>
            <span class="price">${priceString}</span>
        </div>`;
    });
  }

  function updateModalPrice() {
    if (!currentItemForModal) return;
    let total = currentItemForModal.price;
    const selectedAddons = modal.querySelectorAll(
      'input[data-type="addon"]:checked'
    );
    selectedAddons.forEach((addon) => {
      total += parseInt(addon.dataset.price);
    });
    modalTotalPrice.textContent = formatPrice(total);
  }

  // --- CART LOGIC ---
  function addToCartFromModal() {
    const selectedOptions = { removals: [], addons: [] };
    modal
      .querySelectorAll('input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        const type = checkbox.dataset.type;
        selectedOptions[type + "s"].push(checkbox.dataset.name);
      });
    const note = modalNotesInput.value.trim();
    let finalPrice = currentItemForModal.price;
    modal
      .querySelectorAll('input[data-type="addon"]:checked')
      .forEach((addon) => {
        finalPrice += parseInt(addon.dataset.price);
      });
    const uniqueId = `${currentItemForModal.name}|${JSON.stringify(
      selectedOptions
    )}|${note}`;
    const existingItem = cart.find((item) => item.uniqueId === uniqueId);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({
        ...currentItemForModal,
        price: finalPrice,
        quantity: 1,
        options: selectedOptions,
        note: note,
        uniqueId: uniqueId,
      });
    }
    updateCartUI();
    showToast("Added to Cart!");
    closeModal();
  }

  function adjustQuantity(uniqueId, action) {
    const item = cart.find((cartItem) => cartItem.uniqueId === uniqueId);
    if (!item) return;
    if (action === "increase") {
      item.quantity++;
      showToast("Cart Updated!");
    } else if (action === "decrease") {
      item.quantity--;
      if (item.quantity <= 0) {
        cart = cart.filter((cartItem) => cartItem.uniqueId !== uniqueId);
      }
    }
    updateCartUI();
  }

  function renderCart() {
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<p class="cart-empty-message">Your cart is empty.</p>';
      cartSubtotalElement.textContent = formatPrice(0);
      return;
    }
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.price * item.quantity;
      let customizationsHTML = "";
      if (item.options && item.options.removals.length > 0) {
        customizationsHTML += `<p class="cart-item-customization">No: ${item.options.removals.join(
          ", "
        )}</p>`;
      }
      if (item.options && item.options.addons.length > 0) {
        customizationsHTML += `<p class="cart-item-customization">Add: ${item.options.addons.join(
          ", "
        )}</p>`;
      }
      if (item.note) {
        customizationsHTML += `<p class="cart-item-customization">Note: ${item.note}</p>`;
      }
      cartItemsContainer.innerHTML += `
        <div class="cart-item">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                ${customizationsHTML}
                <p class="cart-item-price">${formatPrice(item.price)}</p>
            </div>
            <div class="cart-item-quantity">
                <button class='quantity-btn' data-id='${
                  item.uniqueId
                }' data-action='decrease'>-</button>
                <span>${item.quantity}</span>
                <button class='quantity-btn' data-id='${
                  item.uniqueId
                }' data-action='increase'>+</button>
            </div>
        </div>`;
    });
    cartSubtotalElement.textContent = formatPrice(subtotal);
  }

  function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    renderCart();
  }

  // --- MENU & DISPLAY LOGIC ---
  function filterAndSearch() {
    const activeCategory =
      document.querySelector(".filter-btn.active").dataset.category;
    const searchTerm = searchInput.value.toLowerCase();
    let categoryFiltered =
      activeCategory === "all"
        ? allMenuItems
        : allMenuItems.filter((item) => item.category === activeCategory);
    let finalFiltered = categoryFiltered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
    if (finalFiltered.length === 0 && searchTerm !== "") {
      const allItemsFiltered = allMenuItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
      if (allItemsFiltered.length > 0) {
        document.querySelector(".filter-btn.active").classList.remove("active");
        document
          .querySelector('.filter-btn[data-category="all"]')
          .classList.add("active");
        finalFiltered = allItemsFiltered;
      }
    }
    displayMenuItems(
      finalFiltered,
      document.querySelector(".filter-btn.active").dataset.category
    );
  }

  function displayMenuItems(items, activeCategory) {
    menuContainer.innerHTML = "";
    if (activeCategory === "all") {
      const categoryOrder = [
        "Kafta",
        "Tawouk",
        "Sandwich",
        "Burgers",
        "Combo",
        "Fries",
        "Desserts",
        "Drinks",
      ];
      categoryOrder.forEach((category) => {
        const itemsInCategory = items.filter(
          (item) => item.category === category
        );
        if (itemsInCategory.length > 0) {
          menuContainer.innerHTML += `<h2 class="menu-category-title">${category}</h2>`;
          itemsInCategory.forEach((item) => {
            menuContainer.innerHTML += createMenuItemHTML(item);
          });
        }
      });
    } else {
      items.forEach((item) => {
        menuContainer.innerHTML += createMenuItemHTML(item);
      });
    }
  }

  function createMenuItemHTML(item) {
    return `
      <div class="menu-item" data-name="${item.name}">
          <div class="menu-item-details">
              <h3>${item.name}</h3>
              <p class="price">${formatPrice(item.price)}</p>
              ${
                item.description
                  ? `<p class="description">${item.description}</p>`
                  : ""
              }
          </div>
      </div>`;
  }

  // --- EVENT LISTENERS ---
  menuContainer.addEventListener("click", (e) => {
    const menuItemElement = e.target.closest(".menu-item");
    if (!menuItemElement) return;
    const itemName = menuItemElement.dataset.name;
    const itemData = allMenuItems.find((i) => i.name === itemName);

    if (!customizations[itemName]) {
      // If item has no customization options
      const uniqueId = `${itemData.name}|{}|`;
      const existingItem = cart.find((i) => i.uniqueId === uniqueId);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({
          ...itemData,
          quantity: 1,
          uniqueId,
          options: { removals: [], addons: [] },
        });
      }
      updateCartUI();

      // Show toast and border animation
      showToast("Added to Cart!");
      menuItemElement.classList.add("item-added-animation");
      setTimeout(() => {
        menuItemElement.classList.remove("item-added-animation");
      }, 700);
    } else {
      // If item IS customizable
      const customizedVersionsInCart = cart.filter((i) => i.name === itemName);
      if (customizedVersionsInCart.length > 0) {
        const firstVersion = customizedVersionsInCart[0];
        if (
          confirm(
            `You already have a customized ${itemName}. Add another with the same changes? Click 'Cancel' to create a new version.`
          )
        ) {
          adjustQuantity(firstVersion.uniqueId, "increase");
        } else {
          openModal(itemData);
        }
      } else {
        openModal(itemData);
      }
    }
  });

  currencyToggleBtn.addEventListener("click", () => {
    currentCurrency = currentCurrency === "LBP" ? "USD" : "LBP";
    currencyToggleBtn.textContent =
      currentCurrency === "LBP" ? "Change to $" : "Change to L.L";
    filterAndSearch();
    renderCart();
  });

  searchInput.addEventListener("input", filterAndSearch);

  filterContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      document.querySelector(".filter-btn.active").classList.remove("active");
      e.target.classList.add("active");
      searchInput.value = "";
      filterAndSearch();
    }
  });

  cartItemsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("quantity-btn")) {
      // **THE FIX IS HERE:** Changed 'e.target.dataset..id' to 'e.target.dataset.id'
      const uniqueId = e.target.dataset.id;
      const action = e.target.dataset.action;
      adjustQuantity(uniqueId, action);
    }
  });

  modal.addEventListener("change", updateModalPrice);
  modalAddToCartBtn.addEventListener("click", addToCartFromModal);
  closeModalBtn.addEventListener("click", closeModal);
  cartIcon.addEventListener("click", () =>
    cartSidebar.classList.add("is-open")
  );
  closeCartBtn.addEventListener("click", () =>
    cartSidebar.classList.remove("is-open")
  );

  // --- Initial Run ---
  filterAndSearch();
});
