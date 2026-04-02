let pokemons = [];

const toggle = document.getElementById('toggle');

toggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

async function loadList(){
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1300');
  const data = await res.json();
  pokemons = data.results;
}

function searchPokemon(text){
  return pokemons.filter(p => {
    const id = p.url.split('/')[6];

    return (
      p.name.includes(text.toLowerCase()) ||
      id.includes(text)
    );
  });
}

function formatNumber(id){
  return '#' + id.toString().padStart(3, '0');
}

function showSuggestions(list){
  const box = document.getElementById('suggestions');
  box.innerHTML = '';

  list.slice(0, 10).forEach(p => {
    const div = document.createElement('div');
    div.classList.add('suggestion-item');

    div.onclick = () => {
      const id = p.url.split('/').filter(Boolean).pop();
      window.location.href = `pokemon.html?id=${id}`;
    };

    box.appendChild(div);
  });
}

function capitalize(name){
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function showResults(list){
  const grid = document.getElementById('resultsGrid');
  grid.innerHTML = '';

  list.slice(0, 20).forEach((p) => {

    const div = document.createElement('div');
    div.classList.add('pokemon-row');

   const id = p.url.split('/').filter(Boolean).pop();

    const img = document.createElement('img');
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    const info = document.createElement('div');
    info.classList.add('pokemon-info');

    info.style.display = 'flex';
    info.style.alignItems = 'center';
    info.style.gap = '8px';

    const number = document.createElement('span');
    number.classList.add('pokemon-number');
    number.textContent = formatNumber(id);

    const name = document.createElement('span');
    name.classList.add('pokemon-name');
    name.textContent = capitalize(p.name);

    info.appendChild(number);
    info.appendChild(name);

    div.appendChild(img);
    div.appendChild(info);

    div.onclick = () => {
      window.location.href = `pokemon.html?name=${p.name}`;
    };

    grid.appendChild(div);
  });
}

const input = document.getElementById('pokemonSearch');

if(input){
  input.addEventListener('input', () => {
    const results = searchPokemon(input.value);

    showSuggestions(results);
    showResults(results);
  });
}

loadList();