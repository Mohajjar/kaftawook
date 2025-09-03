document.addEventListener("DOMContentLoaded", () => {
  // --- STATE & CONFIG ---
  let cart = JSON.parse(localStorage.getItem("kaftawookCart") || "[]");
  let currentCurrency = localStorage.getItem("kaftawookCurrency") || "LBP";
  let deliveryType = "delivery";
  const exchangeRate = 90000;
  const deliveryFeeLBP = 100000;
  // PASTE YOUR SHEETDB API URL HERE
  const sheetDbUrl = "https://sheetdb.io/api/v1/vdctpm8verwrq";

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

  // --- UPDATED EVENT LISTENER ---
  placeOrderBtn.addEventListener("click", () => {
    if (validateForm()) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = "Placing Order...";

      // 1. Format the data with the CORRECT column names
      const orderData = {
        Date: new Date().toLocaleString("en-GB"), // Capital 'D'
        Name: document.getElementById("full-name").value, // Capital 'N'
        Phone: document.getElementById("phone").value, // Capital 'P'
        Address:
          deliveryType === "delivery"
            ? document.getElementById("address").value
            : "Pickup", // Capital 'A'
        "Delivery Notes":
          deliveryType === "delivery"
            ? document.getElementById("delivery-notes").value
            : "", // Correct spacing
        "Order Details": cart
          .map((item) => {
            // Correct spacing
            let details = `${item.quantity}x ${item.name}`;
            if (item.options && item.options.removals.length > 0)
              details += ` (No: ${item.options.removals.join(", ")})`;
            if (item.options && item.options.addons.length > 0)
              details += ` (Add: ${item.options.addons.join(", ")})`;
            if (item.note) details += ` (Note: ${item.note})`;
            return details;
          })
          .join("\n"),
        Total: totalDisplay.textContent, // Capital 'T'
      };

      // 2. Send the data to the Google Sheet API
      fetch(sheetDbUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [orderData],
        }),
      })
        .then((response) => response.json())
        .then(() => {
          // 3. On success, clear the cart and show the confirmation
          localStorage.removeItem("kaftawookCart");
          successModal.classList.add("show");
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = "Place Order";
        })
        .catch((error) => {
          console.error(error);
          alert("There was an error placing your order. Please try again.");
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = "Place Order";
        });
    }
  });

  // --- INITIALIZATION ---
  renderOrderSummary();
  handleDeliveryTypeChange();
});
