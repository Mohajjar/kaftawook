document.addEventListener("DOMContentLoaded", () => {
  // PASTE YOUR SHEETDB API URL HERE
  const sheetDbUrl = "https://sheetdb.io/api/v1/vdctpm8verwrq";

  const ordersGrid = document.getElementById("orders-grid");
  const statusIndicator = document.getElementById("status-indicator");
  const statusText = document.getElementById("status-text");

  let processedOrders = new Set();
  let notificationSound;
  let isSoundPlaying = false;
  let hasInitialized = false;

  // Initialize notification sound using Tone.js
  function initializeSound() {
    if (!notificationSound) {
      notificationSound = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
      }).toDestination();
    }
  }

  // Play a repeating notification sound
  function playNotification() {
    if (isSoundPlaying || !notificationSound) return;
    isSoundPlaying = true;
    Tone.Transport.start();
    new Tone.Loop((time) => {
      notificationSound.triggerAttackRelease("C5", "8n", time);
    }, "1n").start(0);
  }

  // Stop the notification sound
  function stopNotification() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isSoundPlaying = false;
  }

  // Function to render a single order card
  function renderOrder(order, isNew = false) {
    // Extract time from the date string
    const time = new Date(
      order.date.split(", ")[0].split("/").reverse().join("-") +
        "T" +
        order.date.split(", ")[1]
    ).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const card = document.createElement("div");
    card.className = "order-card";
    if (isNew) card.classList.add("new");
    card.dataset.orderDate = order.date; // Use date as a unique identifier

    card.innerHTML = `
            <div class="order-header">
                <h3>${order.name}</h3>
                <span class="time">${time}</span>
            </div>
            <div class="order-body">
                <div class="customer-info">
                    <p>Phone: <span>${order.phone}</span></p>
                    <p>Address: <span>${order.address}</span></p>
                    ${
                      order.delivery_notes
                        ? `<p>Notes: <span>${order.delivery_notes}</span></p>`
                        : ""
                    }
                </div>
                <div class="order-items">
                    <h4>Items</h4>
                    <pre>${order.order_details}</pre>
                </div>
            </div>
            <div class="order-total">
                <span>${order.total}</span>
            </div>
            <div class="order-actions">
                <button class="confirm-btn">Confirm Order</button>
            </div>
        `;

    // Add event listener to the confirm button
    card.querySelector(".confirm-btn").addEventListener("click", () => {
      card.classList.remove("new");
      // If no other new orders, stop the sound
      if (document.querySelectorAll(".order-card.new").length === 0) {
        stopNotification();
      }
    });

    ordersGrid.prepend(card);
  }

  // Fetch orders from the Google Sheet
  async function fetchOrders() {
    try {
      const response = await fetch(sheetDbUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      statusIndicator.classList.add("connected");
      statusText.textContent = "Connected";

      let newOrdersFound = false;
      // Iterate in reverse to process newest orders first
      for (const order of data.reverse()) {
        if (!processedOrders.has(order.date)) {
          if (hasInitialized) {
            newOrdersFound = true;
          }
          renderOrder(order, hasInitialized);
          processedOrders.add(order.date);
        }
      }

      if (newOrdersFound) {
        playNotification();
      }

      if (!hasInitialized) {
        hasInitialized = true;
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      statusIndicator.classList.remove("connected");
      statusText.textContent = "Disconnected";
    }
  }

  // Start fetching orders and set it to repeat
  document.body.addEventListener("click", () => Tone.start(), { once: true });
  initializeSound();
  fetchOrders();
  setInterval(fetchOrders, 15000); // Check for new orders every 15 seconds
});
