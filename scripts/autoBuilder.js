// autoBuilder.js

export function buildAutoSet(data, MOVES_DB) {
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : "";

  const moves = data.moves
    .map(m => cap(m.move.name.replace(/-/g, " ")))
    .filter(m => MOVES_DB[m])
    .slice(0, 4);

  while (moves.length < 4) {
    moves.push("Tackle");
  }

  return {
    name: "Standard Build",
    moves,
    item: "Leftovers",
    ability: cap(data.abilities[0].ability.name.replace(/-/g, " ")),
    nature: "Serious",
    evs: { hp: 252, atk: 0, def: 0, spa: 252, spd: 4, spe: 0 }
  };
}