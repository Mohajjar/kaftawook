document.addEventListener("DOMContentLoaded", () => {
  // --- STATE & CONFIG ---
  let cart = JSON.parse(localStorage.getItem("kaftawookCart") || "[]");
  let currentCurrency = localStorage.getItem("kaftawookCurrency") || "LBP";
  let deliveryType = "delivery";
  const exchangeRate = 90000;
  const deliveryFeeLBP = 100000;

  // --- ELEMENT SELECTORS ---
  const orderItemsContainer = document.getElementById("order-items-summary");
  const subtotalDisplay = document.getElementById("subtotal-summary");
  const deliveryFeeDisplay = document.getElementById("delivery-fee-summary");
  const totalDisplay = document.getElementById("total-summary");
  const deliveryOptions = document.querySelectorAll(".delivery-option");
  const addressGroup = document.getElementById("address-group");
  const deliveryNotesGroup = document.getElementById("delivery-notes-group");
  const placeOrderBtn = document.getElementById("place-order-btn");
  const successModal = document.getElementById("success-modal");

  // --- FUNCTIONS ---
  function formatPrice(priceInLBP) {
    if (currentCurrency === "USD") {
      return `$${(priceInLBP / exchangeRate).toFixed(2)}`;
    }
    return `${priceInLBP.toLocaleString()} L.L`;
  }

  function renderOrderSummary() {
    if (cart.length === 0) {
      orderItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      // Also update totals to 0
      subtotalDisplay.textContent = formatPrice(0);
      deliveryFeeDisplay.textContent = formatPrice(0);
      totalDisplay.textContent = formatPrice(0);
      return;
    }

    orderItemsContainer.innerHTML = "";
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.price * item.quantity;
      let customizationsHTML = "";
      if (item.options && item.options.removals.length > 0) {
        customizationsHTML += `<p class="item-customizations">No: ${item.options.removals.join(
          ", "
        )}</p>`;
      }
      if (item.options && item.options.addons.length > 0) {
        customizationsHTML += `<p class="item-customizations">Add: ${item.options.addons.join(
          ", "
        )}</p>`;
      }
      if (item.note) {
        customizationsHTML += `<p class="item-customizations">Note: ${item.note}</p>`;
      }

      orderItemsContainer.innerHTML += `
                <div class="order-item">
                    <div class="item-details">
                        <h4>${item.quantity} x ${item.name}</h4>
                        ${customizationsHTML}
                    </div>
                    <div class="item-price">${formatPrice(
                      item.price * item.quantity
                    )}</div>
                </div>
            `;
    });

    const currentDeliveryFee = deliveryType === "delivery" ? deliveryFeeLBP : 0;
    const total = subtotal + currentDeliveryFee;

    subtotalDisplay.textContent = formatPrice(subtotal);
    deliveryFeeDisplay.textContent = formatPrice(currentDeliveryFee);
    totalDisplay.textContent = formatPrice(total);
  }

  function handleDeliveryTypeChange() {
    deliveryOptions.forEach((option) => {
      option.addEventListener("click", () => {
        document
          .querySelector(".delivery-option.selected")
          .classList.remove("selected");
        option.classList.add("selected");
        deliveryType = option.dataset.type;

        if (deliveryType === "delivery") {
          addressGroup.style.display = "flex";
          deliveryNotesGroup.style.display = "flex";
        } else {
          addressGroup.style.display = "none";
          deliveryNotesGroup.style.display = "none";
        }

        renderOrderSummary();
      });
    });
  }

  function validateForm() {
    let isValid = true;
    const requiredFields = ["full-name", "phone"];
    if (deliveryType === "delivery") {
      requiredFields.push("address");
    }

    requiredFields.forEach((id) => {
      const input = document.getElementById(id);
      if (!input.value.trim()) {
        input.style.borderColor = "red";
        isValid = false;
      } else {
        input.style.borderColor = "#e5e7eb";
      }
    });

    if (!isValid) {
      alert("Please fill in all required fields.");
    }
    return isValid;
  }

  // --- EVENT LISTENERS ---
  placeOrderBtn.addEventListener("click", () => {
    if (validateForm()) {
      // Here you would typically send the order to a server.
      // For now, we'll just show the success message.
      localStorage.removeItem("kaftawookCart"); // Clear cart after order
      successModal.classList.add("show");
    }
  });

  // --- INITIALIZATION ---
  renderOrderSummary();
  handleDeliveryTypeChange();
});
