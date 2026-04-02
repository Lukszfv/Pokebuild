console.log("teamCoverage carregado");

const TYPE_CHART = {
  fire: { weak: ["water", "ground", "rock"], resist: ["fire","grass","ice","bug","steel","fairy"] },

  water: { weak: ["electric", "grass"], resist: ["fire","water","ice","steel"] },

  grass: { weak: ["fire","ice","poison","flying","bug"], resist: ["water","electric","grass","ground"] },

  electric: { weak: ["ground"], resist: ["electric","flying","steel"] },

  ground: { weak: ["water","grass","ice"], resist: ["poison","rock"] },

  dragon: { weak: ["ice","dragon","fairy"], resist: ["fire","water","electric","grass"] },

  ghost: { weak: ["ghost","dark"], resist: ["poison","bug"] },
};

async function getPokemonTypes(name){
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const data = await res.json();
  return data.types.map(t => t.type.name);
}

export async function renderTeamCoverage(team){
  const container = document.getElementById("team-coverage");
  if(!container) return;

  container.innerHTML = "Calculando cobertura...";

  let coverage = {};

  for(const p of team.pokemons){
    const types = await getPokemonTypes(p.name);

    for(const t in TYPE_CHART){
      if(!coverage[t]) coverage[t] = { weak:0, resist:0 };

      types.forEach(pt => {
        if(TYPE_CHART[t]?.weak.includes(pt)) coverage[t].weak++;
        if(TYPE_CHART[t]?.resist.includes(pt)) coverage[t].resist++;
      });
    }
  }

  container.innerHTML = Object.entries(coverage).map(([type, data]) => `
    <div class="coverage-row">
      <span>${type.toUpperCase()}</span>
      <span style="color:red;">Weak: ${data.weak}</span>
      <span style="color:lightgreen;">Resist: ${data.resist}</span>
    </div>
  `).join("");
}