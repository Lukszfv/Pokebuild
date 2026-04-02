const toggle = document.getElementById('toggle');
const saved = localStorage.getItem('theme');
if (saved === 'light') document.body.classList.add('light');

toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

const popular = [
  { name: 'greninja',  types: ['water', 'dark'] },
  { name: 'charizard', types: ['fire', 'flying'] },
  { name: 'pikachu',   types: ['electric'] },
  { name: 'lucario',   types: ['fighting', 'steel'] },
  { name: 'garchomp',  types: ['dragon', 'ground'] },
  { name: 'dragapult', types: ['dragon', 'ghost'] },
  { name: 'mewtwo',    types: ['psychic'] },
  { name: 'gengar',    types: ['ghost', 'poison'] },
  { name: 'eevee',     types: ['normal'] },
  { name: 'sylveon',   types: ['fairy'] },
  { name: 'scizor',    types: ['bug', 'steel'] },
  { name: 'tyranitar', types: ['rock', 'dark'] },
];

const grid = document.getElementById('popular-grid');

async function getSprite(name) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    const data = await res.json();
    return data.sprites.other['official-artwork'].front_default
        || data.sprites.front_default;
  } catch {
    return null;
  }
}

popular.forEach(async (p) => {
  const card = document.createElement('a');
  card.className = 'pokemon-card';
  card.href = `pages/pokemon.html?name=${p.name}`;

  const typeBadges = p.types
    .map(t => `<span class="type-badge t-${t}">${t}</span>`)
    .join('');

  card.innerHTML = `
    <div class="poke-sprite">
      <img src="" alt="${p.name}" id="sprite-${p.name}">
    </div>
    <div class="poke-name">${p.name}</div>
    <div class="types">${typeBadges}</div>
  `;

  grid.appendChild(card);

  const sprite = await getSprite(p.name);
  const img = document.getElementById(`sprite-${p.name}`);
  if (sprite && img) img.src = sprite;
  else if (img) img.src = '../imagens/ultra-ball.png';
});