import { ITEMS_DB } from "./items.js";

const container = document.getElementById("items-list");

function renderItems() {
  container.innerHTML = "";

  Object.entries(ITEMS_DB).forEach(([name, item]) => {
    const el = document.createElement("div");
    el.className = "item-card";

    const icon = item.icon
      ? item.icon
      : "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

    el.innerHTML = `
      <div class="item-left"><img src="${icon}" class="item-icon"></div>
      <div class="item-right">
        <span class="item-name">${name}</span>
        <span class="item-desc">${item.desc}</span>
      </div>
    `;

    container.appendChild(el);
  });
}

renderItems();