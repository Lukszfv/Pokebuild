let ALL_MOVES_DATA = [];

const toggle = document.getElementById('toggle');
const saved = localStorage.getItem('theme');
if (saved === 'light') document.body.classList.add('light');

toggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

const TYPE_COLORS = {
    normal: "#8a8878", fire: "#e8632a", water: "#4a90d9", electric: "#e2c124",
    grass: "#4c9e4c", ice: "#74c4c4", fighting: "#cc4444", poison: "#9a44a0",
    ground: "#c4a250", flying: "#7c9ac7", psychic: "#da5474", bug: "#7c9444",
    rock: "#9c8c54", ghost: "#634a9a", dragon: "#6050b0", dark: "#5a5274",
    steel: "#8a9bb0", fairy: "#d47cb4"
};

async function fetchAllMoves() {
    const container = document.getElementById("moves-list-container");
    if (!container) return;

    container.innerHTML = "<div class='loading'>Carregando todos os movimentos da PokéAPI...</div>";

    try {
        const response = await fetch("https://pokeapi.co/api/v2/move?limit=1000");
        const data = await response.json();
        const sortedMoves = data.results.sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = "";

        for (const moveShort of sortedMoves) {
            const moveData = await fetchMoveData(moveShort.url);
            ALL_MOVES_DATA.push(moveData);
        }

        renderMoves(ALL_MOVES_DATA);

    } catch (error) {
        container.innerHTML = "<div class='error'>Erro ao conectar com a API.</div>";
    }
}

async function fetchMoveData(url) {
    const res = await fetch(url);
    const data = await res.json();

    const entry = data.flavor_text_entries.find(e => e.language.name === "en");

    return {
        name: data.name,
        type: data.type.name,
        category: data.damage_class.name,
        power: data.power || "--",
        acc: data.accuracy || "--",
        pp: data.pp || "--",
        desc: entry ? entry.flavor_text.replace(/\f/g, " ") : "No description."
    };
}

function renderMoves(list) {
    const container = document.getElementById("moves-list-container");
    container.innerHTML = "";

    list.forEach(move => {
        const el = document.createElement("div");
        el.className = "move-row";

        el.innerHTML = `
            <div class="move-type-icon" style="background:${TYPE_COLORS[move.type]}">
                ${move.type}
            </div>

            <div class="move-details">
                <div class="move-name-row">
                    <span class="move-name-text">${move.name.toUpperCase()}</span>

                    <span class="cat-badge">
                        ${move.category}
                    </span>

                    <span class="move-stats-badge">
                        PWR: ${move.power} | ACC: ${move.acc} | PP: ${move.pp}
                    </span>
                </div>

                <div class="move-description-text">
                    ${move.desc}
                </div>
            </div>
        `;

        container.appendChild(el);
    });
}

function renderMovePlaceholder(name, url, container) {
    const moveId = `move-${name}`;
    const displayName = name.replace(/-/g, " ").toUpperCase();

    const moveRow = document.createElement("div");
    moveRow.className = "move-row";
    moveRow.id = moveId;
    moveRow.innerHTML = `
        <div class="move-type-icon" style="background: #333">?</div>
        <div class="move-details" style="flex: 1;">
            <div class="move-name-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 5px;">
                <span class="move-name-text" style="font-size: 18px; font-weight: 600; color: #fff;">${displayName}</span>
                <span class="move-stats-badge" style="font-size: 11px; color: #888;">Carregando dados...</span>
            </div>
            <div class="move-description-text" style="font-size: 14px; color: #bbb;">
                Buscando descrição na PokéAPI...
            </div>
        </div>
    `;

    container.appendChild(moveRow);

    fetchMoveDetails(url, moveId);
}

function applyFilters() {
    const search = document.getElementById("search-input").value.toLowerCase();
    const type = document.getElementById("type-filter").value;
    const category = document.getElementById("category-filter").value;

    const filtered = ALL_MOVES_DATA.filter(move => {

        const matchName = move.name.includes(search);
        const matchType = !type || move.type === type;
        const matchCategory = !category || move.category === category;

        return matchName && matchType && matchCategory;
    });

    renderMoves(filtered);
}

async function fetchMoveDetails(url, elementId) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const row = document.getElementById(elementId);
        if (!row) return;

        const type = data.type.name;
        const cat = data.damage_class.name;
        const power = data.power || "--";
        const acc = data.accuracy || "--";
        const pp = data.pp || "--";
        const entry = data.flavor_text_entries.find(e => e.language.name === "en");
        const desc = entry ? entry.flavor_text.replace(/\f/g, " ") : "No description available.";

        row.style.borderLeft = `6px solid ${TYPE_COLORS[type] || '#666'}`;

        row.innerHTML = `
            <div class="move-type-icon" style="background: ${TYPE_COLORS[type]}; min-width: 55px; height: 55px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 10px; text-transform: uppercase;">
                ${type}
            </div>
            <div class="move-details" style="flex: 1;">
                <div class="move-name-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 5px;">
                    <span class="move-name-text" style="font-size: 18px; font-weight: 600; color: #fff;">${data.name.replace(/-/g, " ").toUpperCase()}</span>
                    <span class="cat-badge cat-${cat}" style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: white; background: ${cat === 'physical' ? '#cc4444' : cat === 'special' ? '#5a5274' : '#8a8878'}">
                        ${cat}
                    </span>
                    <span class="move-stats-badge" style="font-size: 11px; color: #888;">
                        PWR: ${power} | ACC: ${acc} | PP: ${pp}
                    </span>
                </div>
                <div class="move-description-text" style="font-size: 14px; color: #bbb;">
                    ${desc}
                </div>
            </div>
        `;
    } catch (e) {
        console.error("Erro ao carregar detalhe:", e);
    }
}

document.addEventListener("DOMContentLoaded", fetchAllMoves);
document.getElementById("search-input").addEventListener("input", applyFilters);
document.getElementById("type-filter").addEventListener("change", applyFilters);
document.getElementById("category-filter").addEventListener("change", applyFilters);