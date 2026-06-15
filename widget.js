// ==========================================================
//  POKEMON PARTY WIDGET — JS
//  Versão 4.0
// ==========================================================

// ── Permissões ────────────────────────────────────────────
// Apenas broadcaster e moderadores podem usar os comandos.
const ALLOWED_ROLES = ['broadcaster', 'moderator'];

function isAllowed(ev) {
  const channel = (ev.channel || '').toLowerCase();
  const nick    = (ev.nick || ev.username || ev.name || (ev.data && ev.data.nick) || '').toLowerCase();
  if (channel && nick && channel === nick) return true;

  const tags     = ev.tags || (ev.data && ev.data.tags) || ev.data || {};
  if (tags.broadcaster === true || tags.broadcaster === '1') return true;

  const badges   = tags.badges || tags.badge || '';
  const badgeStr = typeof badges === 'string' ? badges : JSON.stringify(badges);
  if (badgeStr.includes('broadcaster')) return true;
  if (badgeStr.includes('moderator') || badgeStr.includes('mod/')) return true;

  if (tags.mod === true || tags.mod === '1' || tags.mod === 1) return true;

  const role = (tags.userType || tags['user-type'] || tags.role || '').toLowerCase();
  if (role === 'mod' || role === 'moderator' || role === 'broadcaster') return true;

  if (tags.isMod === true || tags.isMod === '1') return true;

  return false;
}

// ── Config ────────────────────────────────────────────────
const PARTY_SIZE = 6;
const GIF_BASE  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/';
const GIF_SHINY = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/';
const PNG_BASE  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const PNG_SHINY = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/';
const ITEM_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

// ── State ─────────────────────────────────────────────────
let party = Array.from({ length: PARTY_SIZE }, (_, i) => ({
  slot: i,
  id: null,
  species: null,
  customName: null,
  item: null,
  shiny: false,
  speciesUrl: null,
}));

let cmdQueue   = [];
let processing = false;

// ── DOM ───────────────────────────────────────────────────
const logEl = document.getElementById('logArea');
const rowEl = document.getElementById('partyRow');

function log(msg) { logEl.textContent = '▶ ' + msg; }

// ── Pokeball SVG ──────────────────────────────────────────
function ballSVG() {
  return `<svg class="pokeball-empty" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M 4,50 A 46,46 0 0,1 96,50 Z" fill="#b0b0b0" opacity="0.55"/>
    <path d="M 4,50 A 46,46 0 0,0 96,50 Z" fill="#e8e8e8" opacity="0.45"/>
    <circle cx="50" cy="50" r="46" stroke="#aaa" stroke-width="3.5" fill="none" opacity="0.6"/>
    <line x1="4" y1="50" x2="37" y2="50" stroke="#aaa" stroke-width="3.5" opacity="0.6"/>
    <line x1="63" y1="50" x2="96" y2="50" stroke="#aaa" stroke-width="3.5" opacity="0.6"/>
    <circle cx="50" cy="50" r="13" fill="#e8e8e8" stroke="#aaa" stroke-width="3.5" opacity="0.75"/>
    <circle cx="50" cy="50" r="6" fill="#bbb" opacity="0.8"/>
  </svg>`;
}

// ── Auto-escala sprites pequenas ──────────────────────────
function autoScale(img) {
  img.onload = null;
  const natural = Math.max(img.naturalWidth, img.naturalHeight);
  if (natural > 0 && natural < 80) {
    const size = Math.min(100, Math.round(natural * Math.min(2.8, 96 / natural)));
    img.style.width  = size + 'px';
    img.style.height = size + 'px';
  }
}

// ── Render ────────────────────────────────────────────────
function renderParty() {
  rowEl.innerHTML = '';
  party.forEach((p, i) => {
    const slot  = document.createElement('div');
    slot.className = 'slot';
    slot.id = 'slot-' + i;

    const frame = document.createElement('div');
    frame.className = 'slot-frame' + (p.id ? '' : ' empty') + (p.shiny && p.id ? ' shiny-glow' : '');
    frame.id = 'frame-' + i;

    if (p.id) {
      const gifUrl = (p.shiny ? GIF_SHINY : GIF_BASE) + p.id + '.gif';
      const pngUrl = (p.shiny ? PNG_SHINY : PNG_BASE) + p.id + '.png';
      frame.innerHTML = `<img class="poke-sprite" id="sprite-${i}" src="${gifUrl}" alt="${p.species}"
        onerror="this.src='${pngUrl}'" onload="autoScale(this)">`;
      if (p.shiny) frame.innerHTML += `<div class="shiny-badge">★</div>`;
      if (p.item)  frame.innerHTML += `<img class="item-icon" src="${ITEM_BASE}${p.item}.png" alt="${p.item}" title="${p.item}">`;
    } else {
      frame.innerHTML = ballSVG();
    }

    const label = document.createElement('div');
    label.className = 'slot-label';
    if (p.id) {
      if (p.customName) {
        label.innerHTML =
          `<div class="slot-number">S${i + 1}</div>` +
          `<div class="slot-custom-name">${p.customName}</div>` +
          `<div class="slot-species">${p.species}</div>`;
      } else {
        label.innerHTML =
          `<div class="slot-number">S${i + 1}</div>` +
          `<div class="slot-name-only">${p.species}</div>` +
          `<div class="slot-dex">#${String(p.id).padStart(3, '0')}</div>`;
      }
    } else {
      label.innerHTML =
        `<div class="slot-number">S${i + 1}</div>` +
        `<div class="slot-name-only" style="color:rgba(255,255,255,0.2)">—</div>`;
    }

    slot.appendChild(frame);
    slot.appendChild(label);
    rowEl.appendChild(slot);
  });
}

function animateEnter(idx) {
  const frame = document.getElementById('frame-' + idx);
  if (!frame) return;
  frame.classList.add('entering');
  setTimeout(() => frame.classList.remove('entering'), 500);
}

// ── API ───────────────────────────────────────────────────
async function fetchPokemon(nameOrId) {
  const key = String(nameOrId).toLowerCase().trim();
  const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
  if (!res.ok) throw new Error('Pokémon não encontrado: ' + nameOrId);
  const data = await res.json();
  return { id: data.id, name: data.name, speciesUrl: data.species.url };
}

async function fetchEvolutionChain(speciesUrl) {
  const sRes  = await fetch(speciesUrl);
  const sData = await sRes.json();
  const eRes  = await fetch(sData.evolution_chain.url);
  const eData = await eRes.json();
  return eData.chain;
}

function findNextEvolution(chain, currentName) {
  if (chain.species.name === currentName)
    return chain.evolves_to.length > 0 ? chain.evolves_to[0].species.name : null;
  for (const next of chain.evolves_to) {
    const found = findNextEvolution(next, currentName);
    if (found !== undefined) return found;
  }
  return undefined;
}

// ── Commands ──────────────────────────────────────────────

async function cmdSetSlot(slotIdx, nameOrId, customName = undefined, item = undefined, forceShiny = null) {
  if (slotIdx < 0 || slotIdx >= PARTY_SIZE) { log('Slot inválido!'); return; }
  log(`Carregando ${nameOrId} no slot ${slotIdx + 1}...`);
  try {
    const poke = await fetchPokemon(nameOrId);
    party[slotIdx].id         = poke.id;
    party[slotIdx].species    = poke.name;
    party[slotIdx].speciesUrl = poke.speciesUrl;
    if (customName !== undefined) party[slotIdx].customName = customName || null;
    if (item !== undefined)       party[slotIdx].item       = item || null;
    if (forceShiny !== null)      party[slotIdx].shiny      = forceShiny;
    renderParty();
    animateEnter(slotIdx);
    log(`${poke.name} (#${poke.id}) no slot ${slotIdx + 1}!`);
  } catch (e) {
    log('Erro: ' + e.message);
  }
}

async function cmdSet(slotIdx, parts) {
  const speciesRaw = (parts[0] || '').trim();
  const nameRaw    = (parts[1] || '').trim() || undefined;
  const itemRaw    = (parts[2] || '').trim() || undefined;
  if (!speciesRaw && party[slotIdx].id) {
    if (nameRaw !== undefined) party[slotIdx].customName = nameRaw || null;
    if (itemRaw !== undefined) party[slotIdx].item       = itemRaw || null;
    renderParty();
    log(`Slot ${slotIdx + 1} atualizado!`);
    return;
  }
  if (!speciesRaw) { log('Informe a espécie no !set.'); return; }
  await cmdSetSlot(slotIdx, speciesRaw, nameRaw, itemRaw);
}

async function cmdTeam(names) {
  for (let i = 0; i < Math.min(names.length, PARTY_SIZE); i++)
    await cmdSetSlot(i, names[i]);
}

async function cmdEvolve(slotIdx) {
  const p = party[slotIdx];
  if (!p.id) { log(`Slot ${slotIdx + 1} está vazio!`); return; }
  log(`Evoluindo ${p.species}...`);
  const frame = document.getElementById('frame-' + slotIdx);
  if (frame) frame.classList.add('evolving');
  try {
    const chain    = await fetchEvolutionChain(p.speciesUrl);
    const nextName = findNextEvolution(chain, p.species);
    if (!nextName) {
      log(`${p.species} não tem mais evoluções!`);
      if (frame) frame.classList.remove('evolving');
      return;
    }
    const poke = await fetchPokemon(nextName);
    setTimeout(() => {
      if (frame) frame.classList.remove('evolving');
      const prev = p.species;
      party[slotIdx].id         = poke.id;
      party[slotIdx].species    = poke.name;
      party[slotIdx].speciesUrl = poke.speciesUrl;
      renderParty();
      animateEnter(slotIdx);
      log(`${prev} evoluiu para ${poke.name}!`);
    }, 800);
  } catch (e) {
    if (frame) frame.classList.remove('evolving');
    log('Erro ao evoluir: ' + e.message);
  }
}

function cmdShiny(slotIdx) {
  const p = party[slotIdx];
  if (!p.id) { log(`Slot ${slotIdx + 1} está vazio!`); return; }
  p.shiny = !p.shiny;
  renderParty();
  const sprite = document.getElementById('sprite-' + slotIdx);
  if (sprite) {
    sprite.classList.add('sparkle-anim');
    setTimeout(() => sprite.classList.remove('sparkle-anim'), 700);
  }
  log(`${p.species} ${p.shiny ? 'é shiny ★ agora!' : 'voltou ao normal.'}`);
}

function cmdName(slotIdx, newName) {
  const p = party[slotIdx];
  if (!p.id) { log(`Slot ${slotIdx + 1} está vazio!`); return; }
  p.customName = newName === 'clear' ? null : newName;
  renderParty();
  log(p.customName ? `Nickname "${p.customName}" no slot ${slotIdx + 1}!` : `Nickname removido do slot ${slotIdx + 1}.`);
}

function cmdItem(slotIdx, itemName) {
  const p = party[slotIdx];
  if (!p.id) { log(`Slot ${slotIdx + 1} está vazio!`); return; }
  p.item = itemName === 'clear' ? null : itemName;
  renderParty();
  log(p.item ? `Item "${p.item}" no slot ${slotIdx + 1}!` : `Item removido do slot ${slotIdx + 1}.`);
}

function cmdClear(slotIdx = null) {
  const empty = i => ({ slot: i, id: null, species: null, customName: null, item: null, shiny: false, speciesUrl: null });
  if (slotIdx !== null) {
    party[slotIdx] = empty(slotIdx);
    renderParty();
    log(`Slot ${slotIdx + 1} limpo!`);
  } else {
    party = Array.from({ length: PARTY_SIZE }, (_, i) => empty(i));
    renderParty();
    log('Time limpo!');
  }
}

function cmdParty() {
  const filled = party.filter(p => p.id);
  if (filled.length === 0) { log('Time vazio!'); return; }
  log('Time: ' + filled.map(p => {
    const label = p.customName ? `${p.customName}(${p.species})` : p.species;
    return `S${p.slot + 1}:${label}${p.shiny ? '★' : ''}${p.item ? '+' + p.item : ''}`;
  }).join(' · '));
}

// !save — gera !team completo e exibe numa textarea selecionada
function cmdSave() {
  const filled = party.filter(p => p.id);
  if (filled.length === 0) { log('Time vazio, nada para salvar!'); return; }

  const parts = filled.map(p => {
    const nick = p.customName || '';
    const item = p.item || '';
    if (!nick && !item) return p.species;
    if (!item)          return `${p.species} | ${nick}`;
    return `${p.species} | ${nick} | ${item}`;
  });

  const cmd = '!team ' + parts.join(', ');

  // Remove textarea anterior se existir
  const old = document.getElementById('saveBox');
  if (old) old.remove();

  // Cria textarea visível já com o texto selecionado
  log(cmd);
}

// ── Parser ────────────────────────────────────────────────
function parseSlotArg(arg) {
  const m = arg.match(/^slot([1-6])$/i);
  return m ? parseInt(m[1]) - 1 : -1;
}

async function executeCommand(raw) {
  const msg   = raw.trim();
  const lower = msg.toLowerCase();

  // !slot1 pikachu
  const slotMatch = lower.match(/^!slot([1-6])\s+(.+)/);
  if (slotMatch) {
    await cmdSetSlot(parseInt(slotMatch[1]) - 1, slotMatch[2].trim());
    return;
  }

  // !set slot1 pikachu | Relâmpago | light-ball
  const setMatch = msg.match(/^!set\s+slot([1-6])\s+(.*)/i);
  if (setMatch) {
    await cmdSet(parseInt(setMatch[1]) - 1, setMatch[2].split('|').map(s => s.trim()));
    return;
  }

  // !team bulbasaur, charmander, squirtle
  const teamMatch = lower.match(/^!team\s+(.+)/);
  if (teamMatch) {
    const entries = teamMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    // Suporta !team com pipes por entrada: "pikachu | Bolt | light-ball, eevee"
    if (entries.some(e => e.includes('|'))) {
      for (let i = 0; i < Math.min(entries.length, PARTY_SIZE); i++) {
        const parts = entries[i].split('|').map(s => s.trim());
        await cmdSetSlot(i, parts[0], parts[1] || undefined, parts[2] || undefined);
      }
    } else {
      await cmdTeam(entries);
    }
    return;
  }

  // !evolve slot2 ou !evolve pikachu
  const evolveMatch = lower.match(/^!evolve\s+(.+)/);
  if (evolveMatch) {
    const arg = evolveMatch[1].trim();
    const idx = parseSlotArg(arg);
    if (idx >= 0) {
      await cmdEvolve(idx);
    } else {
      const fi = party.findIndex(p => p.species && p.species.toLowerCase() === arg);
      fi >= 0 ? await cmdEvolve(fi) : log(`"${arg}" não está no time!`);
    }
    return;
  }

  // !shiny slot1 ou !shiny pikachu
  const shinyMatch = lower.match(/^!shiny\s+(.+)/);
  if (shinyMatch) {
    const arg = shinyMatch[1].trim();
    const idx = parseSlotArg(arg);
    if (idx >= 0) {
      cmdShiny(idx);
    } else {
      const fi = party.findIndex(p => p.species && p.species.toLowerCase() === arg);
      fi >= 0 ? cmdShiny(fi) : log(`"${arg}" não está no time!`);
    }
    return;
  }

  // !name slot1 Relâmpago (preserva capitalização)
  const nameMatch = msg.match(/^!name\s+slot([1-6])\s+(.+)/i);
  if (nameMatch) {
    cmdName(parseInt(nameMatch[1]) - 1, nameMatch[2].trim());
    return;
  }

  // !item slot1 light-ball
  const itemMatch = lower.match(/^!item\s+slot([1-6])\s+(.+)/);
  if (itemMatch) {
    cmdItem(parseInt(itemMatch[1]) - 1, itemMatch[2].trim());
    return;
  }

  // !clear ou !clear slot3
  const clearMatch = lower.match(/^!clear(?:\s+slot([1-6]))?$/);
  if (clearMatch) {
    cmdClear(clearMatch[1] ? parseInt(clearMatch[1]) - 1 : null);
    return;
  }

  // !save — gera comando !team do time atual
  if (lower === '!save') { cmdSave(); return; }

  // !party
  if (lower === '!party') { cmdParty(); return; }

  log('Comando desconhecido: ' + msg);
}

// ── Queue ─────────────────────────────────────────────────
function enqueue(msg) {
  if (!msg.startsWith('!')) return;
  cmdQueue.push(msg);
  if (!processing) processQueue();
}

async function processQueue() {
  if (processing || cmdQueue.length === 0) return;
  processing = true;
  await executeCommand(cmdQueue.shift());
  processing = false;
  processQueue();
}

// ── StreamElements listener ───────────────────────────────
window.addEventListener('onEventReceived', function (e) {
  const ev = e.detail && e.detail.event;
  if (!ev || ev.type === 'bot') return;
  const text = (ev.data && ev.data.text) || ev.message || '';
  if (!text.startsWith('!')) return;
  if (!isAllowed(ev)) return;
  enqueue(text);
});

// ── Init ──────────────────────────────────────────────────
renderParty();
