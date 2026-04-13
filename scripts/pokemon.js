import { POPULAR_SETS } from "./sets.js";
import { buildAutoSet } from "./autoBuilder.js";
import { MOVES_BY_POKEMON } from "./movesByPokemon.js";
import { MOVES_DB } from "./moves.js";

let ALL_MOVES = [];
let POKEMON_MOVES = [];

const toggle = document.getElementById('toggle');

toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

const POKEMON_NAME = new URLSearchParams(location.search).get("name") || "greninja";

const TYPE_COLORS = {
  Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
  Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
  Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
  Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
  Steel: "#B8B8D0", Fairy: "#EE99AC"
};
const STAT_COLORS = {
  hp: "#FF5959", attack: "#F5AC78", defense: "#FAE078",
  "special-attack": "#9DB7F5", "special-defense": "#A7DB8D", speed: "#FA92B2"
};
const STAT_LABELS = {
  hp: "HP", attack: "ATK", defense: "DEF",
  "special-attack": "SPA", "special-defense": "SPD", speed: "SPE"
};
const CAT_COLORS = { Physical: "#E8834D", Special: "#7B62A3", Status: "#929DA3" };

async function getMoveData(moveName) {
  if (MOVES_DB[moveName]) return MOVES_DB[moveName];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/move/${moveName.toLowerCase().replace(/ /g, "-")}`);
    const data = await res.json();
    const move = {
      type: cap(data.type.name),
      cat: cap(data.damage_class.name),
      power: data.power,
      acc: data.accuracy,
      pp: data.pp
    };
    MOVES_DB[moveName] = move;
    return move;
  } catch {
    return null;
  }
}

async function getAllMoves() {
  const res = await fetch("https://pokeapi.co/api/v2/move?limit=10000");
  const data = await res.json();
  return data.results.map(m =>
    m.name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  );
}

async function loadAllMoves() {
  if (ALL_MOVES.length) return;
  ALL_MOVES = await getAllMoves();
}

function getMoveOptions() {
  if (POKEMON_MOVES.length) return POKEMON_MOVES;
  if (ALL_MOVES.length) return ALL_MOVES;
  return [];
}

async function getPokemonMovesFromAPI(name) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    const validMethods = ["level-up", "machine", "tutor", "egg"];
    const allowedVersion = data.id <= 898 ? "sword-shield" : "scarlet-violet";

    const moves = data.moves
      .filter(m =>
        m.version_group_details.some(v =>
          validMethods.includes(v.move_learn_method.name) &&
          v.version_group.name === allowedVersion
        )
      )
      .map(m =>
        m.move.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, l => l.toUpperCase())
      );

    return moves;
  } catch (e) {
    console.error("Erro ao buscar moves:", e);
    return [];
  }
}

import { ITEMS_DB } from "./items.js";
const ITEMS = Object.keys(ITEMS_DB);

const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed",
  "Impish", "Lax", "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild",
  "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"
];
const NATURE_BOOSTS = {
  Timid: "speed", Modest: "special-attack", Jolly: "speed", Adamant: "attack",
  Bold: "defense", Calm: "special-defense", Careful: "special-defense",
  Impish: "defense", Hasty: "speed", Naive: "speed", Rash: "special-attack", Mild: "special-attack"
};
const NATURE_CUTS = {
  Timid: "attack", Modest: "attack", Jolly: "special-attack", Adamant: "special-attack",
  Bold: "attack", Calm: "attack", Careful: "special-attack", Impish: "special-attack",
  Hasty: "defense", Naive: "special-defense", Rash: "special-defense", Mild: "defense"
};

let state = {
  moves: ["Tackle", "Protect", "Rest", "Substitute"],
  evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  item: "",
  nature: "Hardy",
  ability: "",
  teraType: "Normal",
  stats: [],
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  abilityUrls: {},
  evAlertShown: false
};

const cap = s => s ? s[0].toUpperCase() + s.slice(1) : "";

function calcStat(n, base, ev, iv, nat) {
  const mod = NATURE_BOOSTS[nat] === n ? 1.1 : NATURE_CUTS[nat] === n ? 0.9 : 1;
  if (n === "hp") return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100 + 100 + 10);
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100 + 5) * mod);
}

function evForStat(n) {
  return ({
    hp: state.evs.hp, attack: state.evs.atk, defense: state.evs.def,
    "special-attack": state.evs.spa, "special-defense": state.evs.spd, speed: state.evs.spe
  }[n] ?? 0);
}

function totalEvs() { return Object.values(state.evs).reduce((a, b) => a + b, 0); }

async function loadAbilityDesc(abilityName) {
  const box = document.getElementById("ability-desc");
  box.className = "loading";
  box.textContent = "Carregando descrição…";
  const url = state.abilityUrls[abilityName];
  if (!url) { box.className = ""; box.textContent = "—"; return; }
  try {
    const data = await (await fetch(url)).json();
    const entry =
      data.flavor_text_entries?.find(e => e.language.name === "en") ||
      data.effect_entries?.find(e => e.language.name === "en");
    box.className = "";
    box.textContent = entry
      ? (entry.flavor_text || entry.short_effect || entry.effect).replace(/\f/g, " ")
      : "No description available.";
  } catch {
    box.className = ""; box.textContent = "Could not load description.";
  }
}

function renderStatBars() {
  const col = document.getElementById("stats-col"); col.innerHTML = "";
  state.stats.forEach(s => {
    const n = s.stat.name, base = s.base_stat, ev = evForStat(n);
    const calc = calcStat(n, base, ev, 31, state.nature);
    const bp = Math.min((base / 255) * 100, 100).toFixed(1);
    const cp = Math.min((calc / 400) * 100, 100).toFixed(1);
    col.innerHTML += `
      <div class="stat-row">
        <span class="stat-name">${STAT_LABELS[n] || n.toUpperCase()}</span>
        <span class="stat-val">${base}</span>
        <div class="stat-track">
          <div class="stat-base" style="width:${bp}%"></div>
          <div class="stat-calc" style="width:${Math.min(parseFloat(cp), parseFloat(bp) + 20)}%;background:${STAT_COLORS[n] || "#78C850"}"></div>
        </div>
      </div>`;
  });
}

function getNatureText(nature) {
  const boost = NATURE_BOOSTS[nature];
  const cut = NATURE_CUTS[nature];
  const format = s => s ? (STAT_LABELS[s] || s.toUpperCase()) : "";
  if (!boost && !cut) return nature;
  return `${nature} (+${format(boost)} -${format(cut)})`;
}

async function renderMoveSlots() {
  const col = document.getElementById("move-slots");
  col.innerHTML = "";

  for (let i = 0; i < state.moves.length; i++) {
    const mv = state.moves[i];
    const info = await getMoveData(mv);
    const slot = document.createElement("div");
    slot.className = "move-slot";
    slot.dataset.index = i;
    const header = document.createElement("div");
    header.className = "move-header";
    const input = document.createElement("input");
    input.type = "text";
    input.value = mv;
    input.placeholder = "Search move...";
    Object.assign(input.style, {
      background: "transparent",
      border: "none",
      outline: "none",
      color: "inherit",
      font: "inherit",
      fontSize: "15px",
      fontWeight: "600",
      fontFamily: "inherit",
      padding: "0",
      margin: "0",
      width: "100%",
      cursor: "text",
      boxShadow: "none",
    });
    input.addEventListener("input", () => handleMoveInput(i, input.value, suggestionsBox));
    input.addEventListener("focus", () => handleMoveInput(i, input.value, suggestionsBox));
    input.addEventListener("blur", () => setTimeout(() => { suggestionsBox.innerHTML = ""; }, 150));

    const suggestionsBox = document.createElement("div");
    suggestionsBox.className = "move-suggestions";

    header.appendChild(input);
    header.appendChild(suggestionsBox);

    const infoDiv = document.createElement("div");
    infoDiv.className = "move-info";
    if (info) {
      infoDiv.innerHTML = `
        <span class="type-badge" style="background:${TYPE_COLORS[info.type] || "#666"}">${info.type}</span>
        <span class="cat-badge"  style="background:${CAT_COLORS[info.cat] || "#666"}">${info.cat}</span>
        <span class="move-stats">Power: ${info.power ?? "—"} | Acc: ${info.acc ?? "—"} | PP: ${info.pp}</span>`;
    }

    slot.appendChild(header);
    slot.appendChild(infoDiv);
    col.appendChild(slot);
  }
}

function handleMoveInput(index, value, suggestionsBox) {
  suggestionsBox.innerHTML = "";
  if (!value.trim()) return;

  const filtered = getMoveOptions()
    .filter(m => m.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 10);

  filtered.forEach(m => {
    const item = document.createElement("div");
    item.className = "suggestion";
    item.textContent = m;
    item.addEventListener("mousedown", () => {
      state.moves[index] = m;
      suggestionsBox.innerHTML = "";
      renderMoveSlots();
    });
    suggestionsBox.appendChild(item);
  });
}

function renderTeraSelect() {
  const sel = document.getElementById("sel-tera");
  if (!sel) return;

  const tipos = Object.keys(TYPE_COLORS);

  sel.innerHTML = tipos.map(t => `<option value="${t}">${t}</option>`).join("");
  sel.value = state.teraType || "Normal";
  sel.style.borderLeft = `10px solid ${TYPE_COLORS[sel.value]}`;
  sel.onchange = () => {
    state.teraType = sel.value;
    sel.style.borderLeft = `10px solid ${TYPE_COLORS[sel.value]}`;
  };
}

function renderEvInputs() {
  const col = document.getElementById("evs-col");
  const fields = [["hp", "HP EV"], ["atk", "Atk EV"], ["def", "Def EV"], ["spa", "SpA EV"], ["spd", "SpD EV"], ["spe", "Spe EV"]];
  col.innerHTML = fields.map(([k, lbl]) => `
    <div class="ev-group">
      <label>${lbl}</label>
      <input type="number" min="0" max="252" value="${state.evs[k]}" oninput="changeEv('${k}',this.value)" />
    </div>`).join("") + `<div id="ev-total">Total EVs: ${totalEvs()} / 510</div>`;
}

function applyInitialSet(data) {
  const name = POKEMON_NAME.toLowerCase();
  let set = POPULAR_SETS[name];
  if (!set) set = buildAutoSet(data, MOVES_DB);

  state.moves = [...set.moves];
  state.item = set.item;
  state.nature = set.nature;
  state.evs = { ...set.evs };

  document.getElementById("sel-nature").value = set.nature;
  document.getElementById("sel-item").value = set.item;
}

function updateItemIcon() {
  const iconBox = document.getElementById("item-icon-box");
  if (!iconBox) return;

  let itemName = state.item;

  if (itemName && itemName !== "None" && itemName !== "") {

    let nameForUrl = itemName.toLowerCase()
      .replace(/ /g, "-")
      .replace(/[.'’]/g, "");

    if (nameForUrl.endsWith("-z")) {
      nameForUrl = nameForUrl + "--held";
    }

    const iconUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${nameForUrl}.png`;

    iconBox.innerHTML = `<img src="${iconUrl}" 
      onerror="this.src='../imagens/item.png'" 
      onload="this.style.opacity='1'"
      style="width: 22px; height: 22px; object-fit: contain; transition: opacity 0.2s; opacity: 0;">`;
  } else {
    iconBox.innerHTML = "";
  }
}

function renderItemSelect() {
  const sel = document.getElementById("sel-item");
  if (!sel) return;

  sel.innerHTML = ITEMS.map(it => {
    const itemData = ITEMS_DB[it];
    const categoryText = (itemData && itemData.category) ? ` (${itemData.category})` : "";
    return `<option value="${it}">${it}${categoryText}</option>`;
  }).join("");

  sel.value = state.item;

  sel.onchange = () => {
    state.item = sel.value;
    updateItemIcon();
  };

  updateItemIcon();
}

function updateEvTotal() {
  const el = document.getElementById("ev-total");
  if (!el) return;
  const t = totalEvs();
  el.textContent = `Total EVs: ${t} / 510`;
  el.className = t > 510 ? "over" : "";
}

window.changeEv = (k, v) => {
  const novoValor = Math.min(252, Math.max(0, parseInt(v) || 0));
  const outrosTotal = Object.entries(state.evs)
    .filter(([key]) => key !== k)
    .reduce((sum, [, val]) => sum + val, 0);
  const maxPermitido = 510 - outrosTotal;

  if (novoValor > maxPermitido) {
    state.evs[k] = maxPermitido;
    if (!state.evAlertShown) {
      alert("⚠️ Limite máximo de 510 EVs atingido!");
      state.evAlertShown = true;
    }
  } else {
    state.evs[k] = novoValor;
    state.evAlertShown = false;
  }
  renderEvInputs();
  updateEvTotal();
  renderStatBars();
};

async function init() {
  document.getElementById("poke-name").textContent = cap(POKEMON_NAME);

  const selNature = document.getElementById("sel-nature");
  NATURES.forEach(n => {
    const o = document.createElement("option");
    o.value = n;
    o.textContent = getNatureText(n);
    if (n === state.nature) o.selected = true;
    selNature.appendChild(o);
  });
  selNature.onchange = () => { state.nature = selNature.value; renderStatBars(); };

  let pokeData = null;

  try {
    pokeData = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${POKEMON_NAME.toLowerCase()}`)).json();
    POKEMON_MOVES = await getPokemonMovesFromAPI(POKEMON_NAME.toLowerCase());

    const sp = pokeData.sprites?.other?.["official-artwork"]?.front_default || pokeData.sprites?.front_default;
    const spriteBox = document.getElementById("sprite-box");
    if (spriteBox && sp) {
      spriteBox.innerHTML = `<img src="${sp}">`;
    }

    const typeRow = document.getElementById("type-row");
    pokeData.types.forEach(t => {
      const n = cap(t.type.name);
      typeRow.innerHTML += `<span class="type-badge" style="background:${TYPE_COLORS[n] || "#777"}">${n}</span>`;
    });

    const selAbility = document.getElementById("sel-ability");
    pokeData.abilities.forEach(a => {
      const n = cap(a.ability.name.replace(/-/g, " "));
      state.abilityUrls[n] = a.ability.url;
      const o = document.createElement("option"); o.value = o.textContent = n;
      selAbility.appendChild(o);
    });
    if (!state.ability) {
      state.ability = selAbility.value;
    }
    await loadAbilityDesc(state.ability);
    selAbility.onchange = () => { state.ability = selAbility.value; loadAbilityDesc(state.ability); };

    state.stats = pokeData.stats;
    if (!editData) {
      applyInitialSet(pokeData);
    }

  } catch {
    state.stats = [
      { stat: { name: "hp" }, base_stat: 72 },
      { stat: { name: "attack" }, base_stat: 85 },
      { stat: { name: "defense" }, base_stat: 67 },
      { stat: { name: "special-attack" }, base_stat: 103 },
      { stat: { name: "special-defense" }, base_stat: 71 },
      { stat: { name: "speed" }, base_stat: 134 }
    ];
    const box = document.getElementById("ability-desc");
    box.className = ""; box.textContent = "Could not load description.";
  }

  document.getElementById("loading").style.display = "none";
  document.getElementById("card-base").style.display = "block";
  document.getElementById("card-builder").style.display = "block";

  await loadAllMoves();
  renderStatBars();
  await renderMoveSlots();
  renderEvInputs();
  renderItemSelect();
  renderTeraSelect();

  let popular = POPULAR_SETS[POKEMON_NAME.toLowerCase()];
  if (!popular && pokeData) popular = buildAutoSet(pokeData, MOVES_DB);

  if (popular) {
    document.getElementById("card-set").style.display = "block";
    document.getElementById("set-name").textContent = popular.name;

    document.getElementById("set-moves").innerHTML =
      popular.moves.map((m, i) => `<div class="set-row">Move ${i + 1}: ${m}</div>`).join("");

    document.getElementById("set-details").innerHTML = `
      <div class="set-row">Item: ${popular.item}</div>
      <div class="set-row">Ability: ${popular.ability}</div>
      <div class="set-row">Nature: ${popular.nature}</div>
      <div class="set-row">EVs: ${Object.entries(popular.evs)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${v} ${k.toUpperCase()}`)
        .join(" / ")
      }</div>`;


    document.getElementById("btn-apply").onclick = async () => {
      state.moves = [...popular.moves];
      state.item = popular.item;
      state.nature = popular.nature;
      state.evs = { ...popular.evs };
      state.teraType = popular.teraType || "Stellar";
      state.ability = popular.ability;

      document.getElementById("sel-nature").value = popular.nature;
      document.getElementById("sel-item").value = popular.item;

      const selTera = document.getElementById("sel-tera");
      if (selTera) {
        selTera.value = state.teraType;
        selTera.style.borderLeft = `10px solid ${TYPE_COLORS[state.teraType] || '#ccc'}`;
      }

      const selAbility = document.getElementById("sel-ability");
      if (selAbility) {
        selAbility.value = popular.ability;
      }

      await renderMoveSlots();
      renderEvInputs();
      renderStatBars();
    };
  }
}

function exportParaOBuild() {
  const build = {
    name: document.getElementById("poke-name").textContent.toLowerCase(),
    teraType: state.teraType,
    item: state.item,
    ability: state.ability,
    nature: state.nature,
    evs: `${state.evs.hp} HP / ${state.evs.atk} Atk / ${state.evs.def} Def / ${state.evs.spa} SpA / ${state.evs.spd} SpD / ${state.evs.spe} Spe`,
    moves: [...state.moves]
  };

  let teams = JSON.parse(localStorage.getItem("teams") || "[]");
  const editData = JSON.parse(localStorage.getItem("editPokemon") || "null");

  if (editData) {
    teams[editData.teamIndex].pokemons[editData.pokeIndex] = build;
    localStorage.removeItem("editPokemon");

  } else {
    const escolha = prompt(`1 - Novo time\n2 - Time existente`);

    if (escolha === "1") {
      const nome = prompt("Nome do time:");
      if (!nome) return;

      teams.push({
        name: nome,
        pokemons: [build]
      });

    } else if (escolha === "2") {
      if (!teams.length) return alert("Sem times");

      let lista = "Escolha:\n";
      teams.forEach((t, i) => lista += `${i} - ${t.name}\n`);

      const index = parseInt(prompt(lista));
      if (!teams[index]) return;

      if (teams[index].pokemons.length >= 6) {
        alert("⚠️ Máximo de 6 Pokémon!");
        return;
      }

      teams[index].pokemons.push(build);
    } else return;
  }

  localStorage.setItem("teams", JSON.stringify(teams));
  alert("✅ Salvo!");

  window.location.href = "build.html";
}

function validateBuild() {

  if (!getMoveOptions().length) {
    alert("⚠️ Moves ainda carregando...");
    return [];
  }

  const validMoves = new Set(getMoveOptions().map(m => m.toLowerCase()));
  const errors = [];

  state.moves.forEach((mv, i) => {
    const label = `Move ${i + 1}`;
    if (!mv || !mv.trim()) {
      errors.push(`❌ ${label}: está vazio.`);
    } else if (!validMoves.has(mv.toLowerCase())) {
      errors.push(`❌ ${label} "${mv}": movimento inválido ou não encontrado.`);
    }
  });

  const filled = state.moves.filter(m => m && m.trim() && validMoves.has(m.toLowerCase()));
  const seen = new Set();
  const dupes = new Set();
  filled.forEach(m => {
    const key = m.toLowerCase();
    if (seen.has(key)) dupes.add(m);
    seen.add(key);
  });
  if (dupes.size > 0) {
    dupes.forEach(d => errors.push(`⚠️ Movimento repetido: "${d}"`));
  }

  return errors;
}

function exportBuild() {
  const errors = validateBuild();

  if (errors.length > 0) {
    alert(
      `⚠️ Corrija os problemas antes de exportar:\n\n${errors.join("\n")}`
    );
    return;
  }

  const evList = Object.entries({
    hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe"
  })
    .filter(([k]) => state.evs[k] > 0)
    .map(([k, label]) => `${state.evs[k]} ${label}`)
    .join(" / ");

  const lines = [
    `${cap(POKEMON_NAME)} @ ${state.item}`,
    `Ability: ${state.ability}`,
    `Tera Type: ${state.teraType}`,
    `EVs: ${evList || "—"}`,
    `${state.nature} Nature`,
    ...state.moves.map(m => `- ${m}`)
  ];

  const text = lines.join("\n");

  navigator.clipboard.writeText(text).then(() => {
    alert(`✅ Build exportado e copiado!\n\n${text}`);
  }).catch(() => {
    alert(`✅ Build pronto! Copie manualmente:\n\n${text}`);
  });
}

const editData = JSON.parse(localStorage.getItem("editPokemon") || "null");

if (editData) {
  const teams = JSON.parse(localStorage.getItem("teams") || "[]");

  if (
    teams[editData.teamIndex] &&
    teams[editData.teamIndex].pokemons &&
    teams[editData.teamIndex].pokemons[editData.pokeIndex]
  ) {
    const p = teams[editData.teamIndex].pokemons[editData.pokeIndex];

    state.moves = (p.moves && p.moves.length === 4)
      ? [...p.moves]
      : ["Tackle", "Protect", "Rest", "Substitute"];
    state.item = p.item || "";
    state.ability = p.ability || "";
    state.nature = p.nature || "Hardy";

    const evObj = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

    if (p.evs) {
      p.evs.split("/").forEach(part => {
        const [val, stat] = part.trim().split(" ");
        if (stat === "HP") evObj.hp = +val;
        if (stat === "Atk") evObj.atk = +val;
        if (stat === "Def") evObj.def = +val;
        if (stat === "SpA") evObj.spa = +val;
        if (stat === "SpD") evObj.spd = +val;
        if (stat === "Spe") evObj.spe = +val;
      });
    }

    state.evs = evObj;

  } else {
    localStorage.removeItem("editPokemon");
  }
}

document.getElementById("btn-apply").onclick = async () => {
  state.moves = [...popular.moves];
  state.item = popular.item;
  state.nature = popular.nature;
  state.evs = { ...popular.evs };
  state.tera = popular.tera;

  document.getElementById("sel-nature").value = popular.nature;
  document.getElementById("sel-item").value = popular.item;

  await renderMoveSlots();
  renderEvInputs();
  renderStatBars();
  updateItemIcon();
};

window.exportBuild = exportBuild;
window.exportParaOBuild = exportParaOBuild;

init();