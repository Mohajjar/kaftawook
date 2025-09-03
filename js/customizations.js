const customizations = {
  // We use the exact item name as the key
  "Kafta Sandwich": {
    // Things that are in the sandwich by default and can be removed
    removals: [
      { name: "Hummus", price: 0 },
      { name: "Pickles", price: 0 },
    ],
    // Things that can be added as extras
    addons: [
      { name: "Ketchup", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Cheese", price: 30000 },
      { name: "Extra Hummus", price: 30000 },
    ],
  },
  "Kafta Pro": {
    removals: [
      { name: "Hummus", price: 0 },
      { name: "Pickles", price: 0 },
      { name: "Tomato", price: 0 },
      { name: "Onion", price: 0 },
      { name: "Lettuce", price: 0 },
    ],
    addons: [
      { name: "Ketchup", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Cheese", price: 30000 },
      { name: "Extra Hummus", price: 30000 },
    ],
  },
  // You can add other items with their own options here in the future
  // 'Tawouk Markouk': { removals: [...], addons: [...] }
};
