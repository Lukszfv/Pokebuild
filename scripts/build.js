const toggle = document.getElementById('toggle');

toggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

const defaultTeams = [
    {
        name: "Time Competitivo",
        pokemons: [
            {
                name: "dragapult",
                item: "Choice Specs",
                ability: "Clear Body",
                nature: "Timid",
                evs: "252 SpA / 4 SpD / 252 Spe",
                moves: ["Shadow Ball", "Flamethrower", "Thunderbolt", "U-turn"]
            },
            {
                name: "garchomp",
                item: "Life Orb",
                ability: "Rough Skin",
                nature: "Jolly",
                evs: "252 Atk / 252 Spe",
                moves: ["Earthquake", "Dragon Claw", "Stone Edge", "Swords Dance"]
            }
        ]
    }
];

function createTeam() {
    const name = prompt("Nome do novo time:");

    if (!name) return;

    teams.push({
        name,
        pokemons: []
    });

    localStorage.setItem("teams", JSON.stringify(teams));
    renderTeams();
}

let teams = JSON.parse(localStorage.getItem("teams"));

if (!teams || !teams.length) {
    teams = defaultTeams;
    localStorage.setItem("teams", JSON.stringify(teams));
}

const teamsDiv = document.getElementById("teams");

async function getSprite(name) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    const data = await res.json();
    return data.sprites.front_default;
}

async function renderTeams() {
    teamsDiv.innerHTML = "";

    for (const [i, team] of teams.entries()) {
        const card = document.createElement("div");
        card.className = "team-card";
        card.onclick = () => openBuild(i);

       card.innerHTML = `
  <div class="team-header">
    <h3>${team.name}</h3>

    <button class="delete-team-btn"
      onclick="event.stopPropagation(); deleteTeam(${i})">
      ✖
    </button>
  </div>

  <span>${team.pokemons.length} Pokémon</span>
  <div class="team-sprites" id="sprites-${i}"></div>
`;
        teamsDiv.appendChild(card);

        const box = document.getElementById(`sprites-${i}`);

        for (const p of team.pokemons) {
            const img = document.createElement("img");
            img.src = await getSprite(p.name);
            img.className = "mini-sprite";
            box.appendChild(img);
        }
    }
}

function deleteTeam(index) {
    const confirmDelete = confirm("Tem certeza que deseja excluir este time?");

    if (!confirmDelete) return;

    teams.splice(index, 1);

    localStorage.setItem("teams", JSON.stringify(teams));
    renderTeams();
}

async function openBuild(teamIndex) {
    const team = teams[teamIndex];

    document.getElementById("teams-container").style.display = "none";
    document.getElementById("buildView").style.display = "block";
    document.getElementById("currentTeamName").innerText = team.name;

    const container = document.getElementById("teamDetail");
    container.innerHTML = "";

    for (const [index, p] of team.pokemons.entries()) {
        const sprite = await getSprite(p.name);

        const wrapper = document.createElement("div");
        wrapper.className = "poke-wrapper";

        wrapper.innerHTML = `
  <div class="poke-pill" onclick="toggleDetails(${index})">

    <!-- ESQUERDA -->
    <div class="poke-info-left">
      <img src="${sprite}">
      <div>${p.name}</div>
    </div>

    <!-- DIREITA -->
    <div class="poke-right">
      <div class="item-name">${p.item}</div>

      <div class="actions">
        <button onclick="event.stopPropagation(); deletePokemon(${teamIndex}, ${index})" class="delete-btn">
          ✖
        </button>

        <button onclick="event.stopPropagation(); editPokemon(${teamIndex}, ${index})" class="edit-btn">
          ✎
        </button>
      </div>
    </div>

  </div>

  <div class="poke-details" id="details-${index}">
    <div class="poke-details-inner">
      <b>${capitalize(p.name)} @ ${p.item}</b><br>
      Ability: ${p.ability}<br>
      EVs: ${p.evs}<br>
      ${p.nature} Nature<br><br>

      ${p.moves.map(m => `- ${m}`).join("<br>")}
    </div>
  </div>
`;

        container.appendChild(wrapper);
    }

    
if (team.pokemons.length < 6) {
    const addBtn = document.createElement("div");
    addBtn.className = "add-pokemon";
    addBtn.innerHTML = "+ Adicionar Pokémon";

    addBtn.onclick = () => {
        localStorage.setItem("editPokemon", JSON.stringify({
            teamIndex,
            pokeIndex: team.pokemons.length
        }));

        window.location.href = "search.html";
    };

    await renderTeamCoverage(team);
    container.appendChild(addBtn);
}
}

function deletePokemon(teamIndex, pokeIndex) {
    let teamsLocal = JSON.parse(localStorage.getItem("teams") || "[]");

    teamsLocal[teamIndex].pokemons.splice(pokeIndex, 1);

    localStorage.setItem("teams", JSON.stringify(teamsLocal));

    teams = teamsLocal;

    openBuild(teamIndex);
}

function editPokemon(teamIndex, pokeIndex) {
    localStorage.setItem("editPokemon", JSON.stringify({
        teamIndex,
        pokeIndex
    }));

    const teams = JSON.parse(localStorage.getItem("teams"));
    const p = teams[teamIndex].pokemons[pokeIndex];

    window.location.href = `pokemon.html?name=${p.name}`;
}

function toggleDetails(index) {
    const el = document.getElementById(`details-${index}`);

    if (!el) return;

    document.querySelectorAll(".poke-details").forEach(d => {
        if (d !== el) d.classList.remove("open");
    });

    el.classList.toggle("open");
}

function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function closeBuild() {
    document.getElementById("teams-container").style.display = "block";
    document.getElementById("buildView").style.display = "none";
}

function toggleMode() {
    document.body.classList.toggle("light");
}

window.closeBuild = closeBuild;
window.createTeam = createTeam;
window.deleteTeam = deleteTeam;
window.deletePokemon = deletePokemon;
window.editPokemon = editPokemon;
window.toggleDetails = toggleDetails;

renderTeams();