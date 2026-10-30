// ============================================================
// MUNDO FÚTBOL — Motor del juego (mismo motor que Mundo Alquimia)
// Los datos (elementsDB, categoryNames, rawRecipes) viven en data.js
// ============================================================

// 3. PROCESAMIENTO DE RECETAS
const recipes = {};
for (let key in rawRecipes) {
    let sortedKey = key.split('+').sort().join('+');
    let result = rawRecipes[key];
    recipes[sortedKey] = Array.isArray(result) ? result : [result];
}

// Validador de datos: avisa por consola (F12) si alguna receta queda rota al editar
for (let key in recipes) {
    key.split('+').forEach(ing => {
        if (!elementsDB[ing]) console.warn(`⚠️ Receta "${key}": el ingrediente "${ing}" no existe en elementsDB.`);
    });
    recipes[key].forEach(r => {
        if (!elementsDB[r]) console.warn(`⚠️ Receta "${key}": el resultado "${r}" no existe en elementsDB.`);
    });
}

// === ÍNDICES PARA LA ENCICLOPEDIA ===
const recipesByResult = {};     // id -> recetas que lo producen
const recipesByIngredient = {}; // id -> recetas donde participa
for (let key in recipes) {
    const parts = key.split('+'); // 2 o 3 ingredientes
    const entry = { parts, results: recipes[key] };
    recipes[key].forEach(r => {
        if (!recipesByResult[r]) recipesByResult[r] = [];
        recipesByResult[r].push(entry);
    });
    [...new Set(parts)].forEach(ing => {
        if (!recipesByIngredient[ing]) recipesByIngredient[ing] = [];
        recipesByIngredient[ing].push(entry);
    });
}

// === ESCUDOS DE CLUBES (SVG vectoriales sin fondo, generados por código) ===
function crestDataURI([c1, c2, tx, txc, st]) {
    const escudo = "M50 4 L96 16 V60 C96 92 76 108 50 118 C24 108 4 92 4 60 V16 Z";
    let deco = "";
    if (st === "stripes") {
        for (let i = 1; i < 5; i += 2) deco += `<rect x='${4 + i * 18.4}' y='0' width='18.4' height='122' fill='${c2}'/>`;
    } else if (st === "half") {
        deco = `<rect x='50' y='0' width='50' height='122' fill='${c2}'/>`;
    } else if (st === "hoops") {
        for (let i = 1; i < 5; i += 2) deco += `<rect x='0' y='${i * 24.4}' width='100' height='24.4' fill='${c2}'/>`;
    } else if (st === "band") {
        deco = `<rect x='-25' y='46' width='150' height='28' fill='${c2}' transform='rotate(-18 50 60)'/>`;
    }
    const fs = tx.length > 3 ? 21 : (tx.length === 1 ? 40 : 27);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 122'>` +
        `<defs><clipPath id='s'><path d='${escudo}'/></clipPath></defs>` +
        `<path d='${escudo}' fill='${c1}'/>` +
        `<g clip-path='url(#s)'>${deco}</g>` +
        `<path d='${escudo}' fill='none' stroke='#131b15' stroke-width='5'/>` +
        `<text x='50' y='${62 + fs * 0.36}' font-family='Verdana, Arial, sans-serif' font-size='${fs}' font-weight='bold' text-anchor='middle' fill='${txc}' stroke='rgba(0,0,0,0.35)' stroke-width='0.6' paint-order='stroke'>${tx}</text>` +
        `</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

for (const id in CLUB_CRESTS) {
    if (elementsDB[id]) elementsDB[id].img = crestDataURI(CLUB_CRESTS[id]);
}

// === INSIGNIAS DE LIGAS (medallones redondos SVG, sin fondo) ===
function badgeDataURI([c1, c2, tx, txc]) {
    const fs = tx.length > 2 ? 26 : 34;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
        `<circle cx='50' cy='50' r='46' fill='${c1}' stroke='#131b15' stroke-width='4'/>` +
        `<circle cx='50' cy='50' r='37' fill='none' stroke='${c2}' stroke-width='2.5' opacity='0.85'/>` +
        `<text x='50' y='${50 + fs * 0.36}' font-family='Verdana, Arial, sans-serif' font-size='${fs}' font-weight='bold' text-anchor='middle' fill='${txc}' stroke='rgba(0,0,0,0.3)' stroke-width='0.5' paint-order='stroke'>${tx}</text>` +
        `</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

for (const id in LEAGUE_BADGES) {
    if (elementsDB[id]) elementsDB[id].img = badgeDataURI(LEAGUE_BADGES[id]);
}
for (const id in ORG_BADGES) {
    if (elementsDB[id]) elementsDB[id].img = badgeDataURI(ORG_BADGES[id]);
}

// === TROFEOS (copas SVG sin fondo, doradas o plateadas) ===
function trophyDataURI([metal, accent, style]) {
    const m = metal === "silver"
        ? { body: "#d9dee5", dark: "#929daa", hi: "#f4f7fa" }
        : { body: "#e8c14a", dark: "#a9821f", hi: "#f7e7a8" };
    const stem = `<path d='M46 64 L43 100 H57 L54 64 Z' fill='${m.dark}'/>`;
    const base = `<rect x='34' y='96' width='32' height='12' rx='2' fill='${accent}'/>` +
        `<rect x='28' y='106' width='44' height='10' rx='3' fill='${m.dark}'/>`;
    let top = "";
    if (style === "copa" || style === "orejona") {
        const earR = style === "orejona" ? 15 : 9;
        top = `<circle cx='${28 - earR * 0.4}' cy='36' r='${earR}' fill='none' stroke='${m.body}' stroke-width='5'/>` +
            `<circle cx='${72 + earR * 0.4}' cy='36' r='${earR}' fill='none' stroke='${m.body}' stroke-width='5'/>` +
            `<path d='M28 20 Q28 62 50 70 Q72 62 72 20 Z' fill='${m.body}'/>` +
            `<path d='M28 20 Q28 62 50 70 L50 20 Z' fill='${m.hi}' opacity='0.35'/>` +
            `<ellipse cx='50' cy='20' rx='22' ry='6' fill='${m.hi}'/>`;
    } else if (style === "globo") {
        top = `<path d='M38 68 Q34 42 50 36 Q66 42 62 68 Z' fill='${m.body}'/>` +
            `<circle cx='50' cy='22' r='17' fill='${m.body}'/>` +
            `<circle cx='44' cy='16' r='6' fill='${m.hi}' opacity='0.75'/>` +
            `<path d='M33 22 Q50 32 67 22' fill='none' stroke='${m.dark}' stroke-width='2' opacity='0.7'/>` +
            `<path d='M50 5 Q44 22 50 39' fill='none' stroke='${m.dark}' stroke-width='2' opacity='0.55'/>`;
    } else if (style === "balon") {
        top = `<circle cx='50' cy='44' r='26' fill='${m.body}'/>` +
            `<circle cx='42' cy='34' r='8' fill='${m.hi}' opacity='0.8'/>` +
            `<path d='M50 30 L59 37 L55 48 H45 L41 37 Z' fill='${m.dark}'/>`;
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 122'>` + stem + top + base + `</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

for (const id in TROPHY_ART) {
    if (elementsDB[id]) elementsDB[id].img = trophyDataURI(TROPHY_ART[id]);
}

// Logos locales opcionales (logos-local.js, solo en copias privadas): pisan a los generados
if (typeof LOGOS_LOCALES !== "undefined") {
    for (const id in LOGOS_LOCALES) {
        if (elementsDB[id]) elementsDB[id].img = LOGOS_LOCALES[id];
    }
}

// Visual de un elemento: escudo SVG si lo tiene, emoji si no
function iconoDe(el) {
    return el.img ? `<img class="crest" src="${el.img}" alt="">` : el.emoji;
}

// Los demás ingredientes de una receta, quitando UNA aparición del elemento dado
// (importante para recetas con repetidos, como gol+gol+gol)
function otrosIngredientes(parts, elementId) {
    const otros = [...parts];
    otros.splice(otros.indexOf(elementId), 1);
    return otros;
}

const totalElements = Object.keys(elementsDB).length;
document.getElementById('total-elements').innerText = totalElements;

// Total de elementos por categoría (para progreso y logros)
const categoryTotals = {};
for (const id in elementsDB) {
    const g = elementsDB[id].group;
    categoryTotals[g] = (categoryTotals[g] || 0) + 1;
}
document.getElementById('progressBar').max = totalElements;

// 4. ESTADO DEL JUEGO
const ELEMENTOS_INICIALES = ["balon", "jugador", "cancha", "pasion"];
let unlockedElements = [];
let slot1 = null;
let slot2 = null;
let slot3 = null;

function loadProgress() {
    const savedData = localStorage.getItem("futbolSave");
    if (savedData) {
        unlockedElements = JSON.parse(savedData).filter(id => elementsDB[id]);
        ELEMENTOS_INICIALES.forEach(id => {
            if (!unlockedElements.includes(id)) unlockedElements.push(id);
        });
    } else {
        unlockedElements = [...ELEMENTOS_INICIALES];
    }
}

function saveProgress() {
    localStorage.setItem("futbolSave", JSON.stringify(unlockedElements));
}

// === RESPALDO DE PROGRESO (código portátil entre dispositivos) ===
function exportarProgreso() {
    const codigo = btoa(unescape(encodeURIComponent(JSON.stringify(unlockedElements))));
    if (navigator.clipboard) navigator.clipboard.writeText(codigo).catch(() => {});
    prompt(`Tu código de respaldo (${unlockedElements.length} elementos). Ya se copió al portapapeles; guárdalo donde quieras:`, codigo);
}

function importarProgreso() {
    const codigo = prompt("Pega aquí tu código de respaldo:");
    if (!codigo) return;
    try {
        const lista = JSON.parse(decodeURIComponent(escape(atob(codigo.trim()))));
        if (!Array.isArray(lista)) throw new Error("formato");
        const validos = lista.filter(id => elementsDB[id]);
        const antes = unlockedElements.length;
        validos.forEach(id => { if (!unlockedElements.includes(id)) unlockedElements.push(id); });
        saveProgress();
        renderInventory();
        checkAchievements(true);
        showMessage(`📥 Respaldo restaurado: +${unlockedElements.length - antes} elementos (${unlockedElements.length} en total).`, "#00f5d4");
    } catch (e) {
        showMessage("Ese código no es válido. Revisa que lo hayas pegado completo.", "orange");
    }
}

function resetGame() {
    if (confirm("¿Estás seguro de que quieres borrar todo tu progreso y empezar la temporada desde cero?")) {
        localStorage.removeItem("futbolSave");
        localStorage.removeItem("futbolLogros");
        unlockedElements = [...ELEMENTOS_INICIALES];
        slot1 = null; slot2 = null; slot3 = null;
        updateSlots();
        document.getElementById('searchBar').value = "";
        showMessage("Pitazo inicial: el mundo del fútbol vuelve a empezar.", "orange");
        renderInventory();
    }
}

// ¿Este elemento aún puede crear algo nuevo con el inventario actual?
function hasNewCombos(elementId, unlockedSet) {
    const entries = recipesByIngredient[elementId];
    if (!entries) return false;
    return entries.some(r => {
        const otros = otrosIngredientes(r.parts, elementId);
        return otros.every(o => unlockedSet.has(o)) &&
               r.results.some(res => elementsDB[res] && !unlockedSet.has(res));
    });
}

function renderInventory() {
    const inventoryDiv = document.getElementById('inventory');
    const unlockedSet = new Set(unlockedElements);
    const unlockedCount = unlockedElements.length;
    document.getElementById('count').innerText = unlockedCount;
    document.getElementById('progressBar').value = unlockedCount;
    inventoryDiv.innerHTML = '';

    let groupedElements = {};
    unlockedElements.forEach(elementId => {
        const el = elementsDB[elementId];
        if(el) {
            if (!groupedElements[el.group]) groupedElements[el.group] = [];
            groupedElements[el.group].push(elementId);
        }
    });

    const sortedGroupKeys = Object.keys(groupedElements).sort((a, b) => {
        // Los Elementos Básicos siempre primero: son la mesa de trabajo del jugador
        if (a === "basico") return -1;
        if (b === "basico") return 1;
        const nameA = categoryNames[a] || "Otros";
        const nameB = categoryNames[b] || "Otros";
        return nameA.localeCompare(nameB);
    });

    sortedGroupKeys.forEach(groupKey => {
        groupedElements[groupKey].sort((a, b) => elementsDB[a].name.localeCompare(elementsDB[b].name));

        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-block';

        const title = document.createElement('h3');
        title.className = 'category-title';
        const enCat = groupedElements[groupKey].length;
        const totalCat = categoryTotals[groupKey] || enCat;
        const completa = enCat === totalCat ? " 🏆" : "";
        title.innerText = `${categoryNames[groupKey] || "Otros"} · ${enCat}/${totalCat}${completa}`;
        groupDiv.appendChild(title);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'category-items';

        groupedElements[groupKey].forEach(elementId => {
            const el = elementsDB[elementId];
            const btn = document.createElement('div');
            btn.className = 'element';
            btn.innerHTML = `<span class="el-emoji">${iconoDe(el)}</span><span class="el-nombre">${el.name}</span>`;
            let tooltip = "Clic/Enter: seleccionar · Arrastrar a un espacio · Clic derecho o tecla E: enciclopedia";
            if (hasNewCombos(elementId, unlockedSet)) {
                btn.classList.add('has-combos');
                tooltip = "● ¡Aún puede crear algo nuevo! · " + tooltip;
            }
            btn.title = tooltip;
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-label', el.name);
            btn.onclick = () => {
                if (btn._longPressFired) { btn._longPressFired = false; return; }
                selectElement(elementId);
            };
            // Gestos táctiles: toque = seleccionar · mantener ~0.25s y mover = arrastrar
            // · mantener quieto 0.6s = enciclopedia · deslizar de inmediato = scroll
            btn.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                btn._touch = { x: t.clientX, y: t.clientY, dragReady: false, dragging: false, ghost: null, scrolled: false };
                btn._dragReadyTimer = setTimeout(() => {
                    if (btn._touch && !btn._touch.scrolled) {
                        btn._touch.dragReady = true;
                        btn.classList.add('drag-ready');
                        if (navigator.vibrate) navigator.vibrate(30);
                    }
                }, 250);
                btn._pressTimer = setTimeout(() => {
                    if (btn._touch && !btn._touch.dragging && !btn._touch.scrolled) {
                        btn._longPressFired = true;
                        limpiarGestoTactil(btn);
                        openEncyclopedia(elementId);
                    }
                }, 600);
            }, { passive: true });

            btn.addEventListener('touchmove', (e) => {
                const st = btn._touch;
                if (!st) return;
                const t = e.touches[0];
                const dist = Math.hypot(t.clientX - st.x, t.clientY - st.y);
                if (!st.dragReady && !st.dragging) {
                    if (dist > 12) { // movimiento inmediato: es scroll, cancelar gestos
                        st.scrolled = true;
                        clearTimeout(btn._dragReadyTimer);
                        clearTimeout(btn._pressTimer);
                    }
                    return;
                }
                e.preventDefault(); // ya es un arrastre: bloquear el scroll
                if (!st.dragging && dist > 6) {
                    st.dragging = true;
                    clearTimeout(btn._pressTimer);
                    st.ghost = btn.cloneNode(true);
                    st.ghost.className = 'element drag-ghost';
                    document.body.appendChild(st.ghost);
                }
                if (st.dragging) {
                    st.ghost.style.left = t.clientX + 'px';
                    st.ghost.style.top = t.clientY + 'px';
                    marcarSlotBajo(t.clientX, t.clientY);
                    // Auto-scroll hacia los slots si el dedo llega al borde de la pantalla
                    if (t.clientY < 100) window.scrollBy(0, -12);
                    else if (t.clientY > window.innerHeight - 100) window.scrollBy(0, 12);
                }
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                clearTimeout(btn._dragReadyTimer);
                clearTimeout(btn._pressTimer);
                const st = btn._touch;
                if (st && st.dragging) {
                    const t = e.changedTouches[0];
                    const idx = slotBajoPunto(t.clientX, t.clientY);
                    if (idx > 0) ponerEnSlot(idx, elementId);
                    btn._longPressFired = true; // suprime el click sintético que sigue
                }
                limpiarGestoTactil(btn);
            });

            btn.addEventListener('touchcancel', () => {
                clearTimeout(btn._dragReadyTimer);
                clearTimeout(btn._pressTimer);
                limpiarGestoTactil(btn);
            });
            btn.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectElement(elementId);
                } else if (e.key === 'e' || e.key === 'E' || e.key === 'ContextMenu') {
                    e.preventDefault();
                    openEncyclopedia(elementId);
                }
            };
            btn.draggable = true;
            btn.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', elementId);
                e.dataTransfer.effectAllowed = 'copy';
            };
            btn.oncontextmenu = (e) => {
                e.preventDefault();
                openEncyclopedia(elementId);
            };
            itemsDiv.appendChild(btn);
        });

        groupDiv.appendChild(itemsDiv);
        inventoryDiv.appendChild(groupDiv);
    });
}

function filterInventory() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const elements = document.querySelectorAll('.element');
    elements.forEach(el => {
        if (el.innerText.toLowerCase().includes(searchTerm)) {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}

function selectElement(elementId) {
    if (!slot1) { slot1 = elementId; updateSlots(); }
    else if (!slot2) { slot2 = elementId; updateSlots(); }
    else if (!slot3) { slot3 = elementId; updateSlots(); }
    else { showMessage("Los espacios están llenos. ¡Combínalos!", "orange"); }
}

function clearSlot(slotNumber) {
    if (slotNumber === 1) slot1 = null;
    if (slotNumber === 2) slot2 = null;
    if (slotNumber === 3) slot3 = null;
    updateSlots();
    showMessage("¡Combina elementos para descubrir el mundo del fútbol!");
}

function updateSlots() {
    [[1, slot1], [2, slot2], [3, slot3]].forEach(([n, id]) => {
        const div = document.getElementById('slot' + n);
        div.innerHTML = id ? `<span class="slot-ico">${iconoDe(elementsDB[id])}</span><span>${elementsDB[id].name}</span>` : "?";
    });
}

function showMessage(text, color = "#4cc9f0") {
    const msgDiv = document.getElementById('message');
    msgDiv.innerText = text;
    msgDiv.style.color = color;
}

function getAvailableRecipes() {
    const unlockedSet = new Set(unlockedElements);
    const available = [];
    for (const key in recipes) {
        const parts = key.split('+');
        if (!parts.every(p => unlockedSet.has(p))) continue;
        const results = recipes[key];
        if (results.some(r => elementsDB[r] && !unlockedSet.has(r))) {
            available.push({ parts, results });
        }
    }
    return available;
}

// === PISTAS CON COOLDOWN ===
const HINT_COOLDOWN_MS = 30000; // 30 segundos por botón
const hintButtons = {
    elemento: { btnId: "btnHintElement", label: "Pista Elemento 💡" },
    grupo: { btnId: "btnHintCombo", label: "Pista Grupo 🧩" }
};

function getHintCooldowns() {
    try { return JSON.parse(localStorage.getItem("futbolHintCd")) || {}; }
    catch (e) { return {}; }
}

function hintRemainingMs(kind) {
    const cd = getHintCooldowns();
    return Math.max(0, (cd[kind] || 0) + HINT_COOLDOWN_MS - Date.now());
}

function startHintCooldown(kind) {
    const cd = getHintCooldowns();
    cd[kind] = Date.now();
    localStorage.setItem("futbolHintCd", JSON.stringify(cd));
    updateHintButtons();
}

function updateHintButtons() {
    for (const kind in hintButtons) {
        const { btnId, label } = hintButtons[kind];
        const btn = document.getElementById(btnId);
        const rem = hintRemainingMs(kind);
        if (rem > 0) {
            btn.disabled = true;
            btn.innerText = `⏳ ${Math.ceil(rem / 1000)}s`;
        } else {
            btn.disabled = false;
            btn.innerText = label;
        }
    }
}

setInterval(updateHintButtons, 1000);

function giveElementHint() {
    if (hintRemainingMs("elemento") > 0) return;
    let available = getAvailableRecipes();
    if(available.length === 0) return showMessage("¡Ya descubriste todo lo posible con tu inventario actual!", "gold");
    let randomRecipe = available[Math.floor(Math.random() * available.length)];
    let missingResults = randomRecipe.results.filter(r => !unlockedElements.includes(r));
    let targetId = missingResults[0];
    let target = elementsDB[targetId];
    showMessage(`💡 Pista: Aún puedes descubrir "${target.name} ${target.emoji}". ¡Averigua cómo!`, "#fca311");
    startHintCooldown("elemento");
}

function giveComboHint() {
    if (hintRemainingMs("grupo") > 0) return;
    let available = getAvailableRecipes();
    if(available.length === 0) return showMessage("¡Ya descubriste todo lo posible con tu inventario actual!", "gold");
    let randomRecipe = available[Math.floor(Math.random() * available.length)];
    const cats = randomRecipe.parts.map(p => `"${categoryNames[elementsDB[p].group]}"`);
    showMessage(`🧩 Pista: Combina algo de ${cats.join(" con algo de ")}.`, "#fca311");
    startHintCooldown("grupo");
}

// === EFECTOS DE SONIDO (sintetizados con Web Audio, sin archivos) ===
let audioCtx = null;
let soundOn = localStorage.getItem("futbolSound") !== "off";

function toggleSound() {
    soundOn = !soundOn;
    localStorage.setItem("futbolSound", soundOn ? "on" : "off");
    document.getElementById('btnSound').innerText = soundOn ? "🔊" : "🔇";
    if (soundOn) playTone(660, 0.1, 'sine', 0.15);
}

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.2, delay = 0) {
    if (!soundOn) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.05);
    } catch (e) { /* audio no disponible: seguir en silencio */ }
}

// === SONIDOS DE ESTADIO (sintetizados, sin archivos) ===

// Ruido blanco compartido: la materia prima del sonido de multitud
let _noiseBuf = null;
function getNoiseBuffer(ctx) {
    if (_noiseBuf && _noiseBuf.sampleRate === ctx.sampleRate) return _noiseBuf;
    const len = ctx.sampleRate * 2;
    _noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = _noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return _noiseBuf;
}

// Multitud: ruido filtrado con envolvente (filtro que sube = ovación, que baja = lamento)
function playCrowd({ dur = 1.2, from = 400, to = 1200, vol = 0.25, delay = 0, type = 'bandpass' } = {}) {
    if (!soundOn) return;
    try {
        const ctx = getAudioCtx();
        const t0 = ctx.currentTime + delay;
        const src = ctx.createBufferSource();
        src.buffer = getNoiseBuffer(ctx);
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.Q.value = 0.9;
        filter.frequency.setValueAtTime(from, t0);
        filter.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.55);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + dur * 0.25);
        gain.gain.setValueAtTime(vol, t0 + dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        src.start(t0); src.stop(t0 + dur + 0.1);
    } catch (e) { /* sin audio */ }
}

// Silbato de árbitro: tono agudo con el trino de la bolita (pip / piiiip)
function playWhistle(dur = 0.18, delay = 0, freq = 2350, vol = 0.1) {
    if (!soundOn) return;
    try {
        const ctx = getAudioCtx();
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t0);
        const trill = ctx.createOscillator();
        trill.type = 'sine';
        trill.frequency.setValueAtTime(55, t0);
        const trillGain = ctx.createGain();
        trillGain.gain.setValueAtTime(vol * 0.7, t0);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
        gain.gain.setValueAtTime(vol, t0 + Math.max(0.02, dur - 0.03));
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        trill.connect(trillGain); trillGain.connect(gain.gain);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.05);
        trill.start(t0); trill.stop(t0 + dur + 0.05);
    } catch (e) { /* sin audio */ }
}

// Patada al balón: golpe grave y seco
function playKick(delay = 0, vol = 0.3) {
    if (!soundOn) return;
    try {
        const ctx = getAudioCtx();
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t0);
        osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.12);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t0); osc.stop(t0 + 0.2);
    } catch (e) { /* sin audio */ }
}

// ¡GOOOL! Patada, y la hinchada explota
function soundDiscover() {
    playKick(0, 0.32);
    playCrowd({ dur: 1.6, from: 350, to: 1500, vol: 0.3, delay: 0.1 });
    playCrowd({ dur: 1.3, from: 900, to: 2400, vol: 0.1, delay: 0.25, type: 'highpass' });
}

// Toque-toque: jugada conocida, el partido sigue
function soundCombine() {
    playKick(0, 0.22);
    playKick(0.16, 0.18);
    playCrowd({ dur: 0.5, from: 500, to: 800, vol: 0.05, delay: 0.05 });
}

// ¡Uuuh! La tiró afuera: lamento de la hinchada y pitazo
function soundFail() {
    playCrowd({ dur: 1.1, from: 1100, to: 280, vol: 0.2 });
    playWhistle(0.3, 0.55, 2100, 0.06);
}

// Pitazo final + ovación: ¡logro desbloqueado!
function soundAchievement() {
    playWhistle(0.15, 0);
    playWhistle(0.15, 0.25);
    playWhistle(0.6, 0.5);
    playCrowd({ dur: 2, from: 400, to: 1600, vol: 0.28, delay: 0.75 });
}

// === SISTEMA DE LOGROS ===
const MILESTONES = [
    { n: 10, nombre: "Juvenil de Cantera", emoji: "🌱" },
    { n: 25, nombre: "Debutante", emoji: "🎽" },
    { n: 50, nombre: "Titular Indiscutido", emoji: "👟" },
    { n: 100, nombre: "Figura del Club", emoji: "⭐" },
    { n: 150, nombre: "Crack Mundial", emoji: "💫" },
    { n: 200, nombre: "Ídolo de la Hinchada", emoji: "📣" },
    { n: 250, nombre: "Balón de Oro", emoji: "🥇" },
    { n: 300, nombre: "Leyenda Eterna", emoji: "👑" },
    { n: 400, nombre: "Crack Planetario", emoji: "🌍" },
    { n: 500, nombre: "Salón de la Fama", emoji: "🏛️" },
    { n: 600, nombre: "Inmortal del Fútbol", emoji: "🗿" },
    { n: totalElements, nombre: "Dios del Fútbol", emoji: "🐐" }
];

function getLogrosGuardados() {
    try { return JSON.parse(localStorage.getItem("futbolLogros")) || []; }
    catch (e) { return []; }
}

function contarPorCategoria() {
    const conteo = {};
    unlockedElements.forEach(id => {
        const el = elementsDB[id];
        if (el) conteo[el.group] = (conteo[el.group] || 0) + 1;
    });
    return conteo;
}

function logrosActuales() {
    const ids = [];
    const n = unlockedElements.length;
    MILESTONES.forEach(m => { if (n >= m.n) ids.push("hito_" + m.n); });
    const conteo = contarPorCategoria();
    for (const g in conteo) {
        if (conteo[g] === categoryTotals[g]) ids.push("cat_" + g);
    }
    return ids;
}

function nombreDeLogro(id) {
    if (id.startsWith("hito_")) {
        const m = MILESTONES.find(m => m.n === parseInt(id.slice(5)));
        return m ? `${m.emoji} ${m.nombre} (${m.n} elementos)` : id;
    }
    const g = id.slice(4);
    return `📁 Categoría completa: ${categoryNames[g] || g}`;
}

function mostrarToast(texto) {
    const cont = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = texto;
    cont.appendChild(t);
    setTimeout(() => t.remove(), 4100);
}

function checkAchievements(silencioso = false) {
    const antes = new Set(getLogrosGuardados());
    const ahora = logrosActuales();
    const nuevos = ahora.filter(id => !antes.has(id));
    if (nuevos.length === 0) return;
    localStorage.setItem("futbolLogros", JSON.stringify(ahora));
    if (!silencioso) {
        nuevos.forEach((id, i) => {
            setTimeout(() => {
                mostrarToast(`🏆 ¡Logro desbloqueado! ${nombreDeLogro(id)}`);
                soundAchievement();
            }, 600 + i * 900);
        });
    }
}

function openAchievements() {
    document.getElementById('encModal').classList.add('open');
    document.getElementById('encTitle').innerText = "🏆 Logros";
    const n = unlockedElements.length;
    const conteo = contarPorCategoria();

    let hitosHTML = "";
    MILESTONES.forEach(m => {
        const logrado = n >= m.n;
        hitosHTML += `<div class="logro-fila ${logrado ? 'logrado' : ''}">
            <span>${logrado ? m.emoji : '🔒'} ${m.nombre}</span>
            <span class="logro-progreso">${Math.min(n, m.n)}/${m.n}${logrado ? ' ✓' : ''}</span>
        </div>`;
    });

    let catsHTML = "";
    const clavesOrdenadas = Object.keys(categoryTotals).sort((a, b) =>
        (categoryNames[a] || a).localeCompare(categoryNames[b] || b));
    clavesOrdenadas.forEach(g => {
        const x = conteo[g] || 0;
        const y = categoryTotals[g];
        if (x === 0) {
            catsHTML += `<div class="logro-fila"><span>🔒 Categoría por descubrir</span><span class="logro-progreso">0/${y}</span></div>`;
        } else {
            const completa = x === y;
            catsHTML += `<div class="logro-fila ${completa ? 'logrado' : ''}">
                <span>${completa ? '🏆' : '📁'} ${categoryNames[g] || g}</span>
                <span class="logro-progreso">${x}/${y}${completa ? ' ✓' : ''}</span>
            </div>`;
        }
    });

    document.getElementById('encBody').innerHTML = `
        <div class="enc-section-title">⭐ Hitos de descubrimiento</div>
        ${hitosHTML}
        <div class="enc-section-title">📚 Categorías (${Object.keys(conteo).filter(g => conteo[g] === categoryTotals[g]).length}/${Object.keys(categoryTotals).length} completas)</div>
        ${catsHTML}
    `;
    document.getElementById('encBody').scrollTop = 0;
}

// === REVELACIÓN DE GOL (descubrimiento estilo Doodle God) ===
// Frases generales + frases según la categoría de lo descubierto, sin repetirse seguido.
const CITAS_GENERALES = [
    "«La pelota no se mancha.» — Diego Maradona",
    "«El fútbol es lo más importante de las cosas menos importantes.» — Arrigo Sacchi",
    "«El fútbol no es cuestión de vida o muerte; es mucho más importante que eso.» — Bill Shankly",
    "«El fútbol es el ballet de las masas.» — Dmitri Shostakóvich",
    "«En el fútbol todo se complica por la presencia del equipo contrario.» — Jean-Paul Sartre",
    "«Jugamos como nunca y perdimos como siempre.» — Dicho popular",
    "«Mientras la pelota ruede, hay esperanza.» — Dicho popular",
    "«Los partidos se ganan en la cancha.» — Dicho popular",
    "«La pelota siempre al 10.» — Dicho popular"
];

const CITAS_POR_GRUPO = {
    "basico": [
        "Todo gran mundo empieza con una pelota.",
        "Una cancha, un balón y pasión: no hace falta más."
    ],
    "fundamentos": [
        "«El fútbol se juega con la cabeza; las piernas son solo las herramientas.» — Johan Cruyff",
        "Lo simple bien hecho vale un gol.",
        "¡Qué jugada, señores, qué jugada!",
        "El potrero aplaude de pie.",
        "Primero el control, después el lujo."
    ],
    "reglas": [
        "¡Cobró el árbitro, y no hay nada más que hablar!",
        "El reglamento también es parte del juego.",
        "Sin árbitro no hay partido, aunque nadie lo aplauda.",
        "El VAR lo está revisando…",
        "Las 17 reglas caben en un bolsillo; el criterio, no."
    ],
    "posiciones": [
        "Cada camiseta tiene su misión en la cancha.",
        "No hay equipo grande sin un 5 que barra.",
        "El 10 nace, no se hace.",
        "Detrás de cada arquero hay un loco lindo."
    ],
    "equipamiento": [
        "Botines limpios, conciencia tranquila.",
        "La camiseta pesa, y eso no se entrena.",
        "Sin red, el gol no suena igual.",
        "El utilero: el jugador número 12."
    ],
    "balones": [
        "Cada Mundial tiene su balón, y cada balón su historia.",
        "Redondo y de cuero: el juguete más serio del mundo.",
        "Este balón ya es pieza de museo.",
        "Hay balones que todavía ruedan en la memoria."
    ],
    "estadios": [
        "Los templos del fútbol no se construyen: se consagran.",
        "Un estadio vacío es cemento; lleno, es un corazón.",
        "Aquí las paredes también gritan los goles.",
        "El césped sagrado tiene memoria."
    ],
    "hinchada": [
        "«Se puede cambiar de partido o de religión, pero jamás de equipo de fútbol.» — Eduardo Galeano",
        "El aliento no se compra: se hereda.",
        "La hinchada es el único jugador que nunca baja el ritmo.",
        "Domingo, bombo y bufanda: la santa trinidad."
    ],
    "organizaciones": [
        "Mucho escritorio para tan poca pelota.",
        "El fútbol también se juega con corbata.",
        "De aquí salen los calendarios que nadie entiende.",
        "Burocracia con olor a pasto."
    ],
    "ligas": [
        "Cada liga es un país con su propio idioma futbolero.",
        "La tabla no miente… casi nunca.",
        "Fútbol todos los fines de semana: bendita costumbre.",
        "Otra liga más para trasnochar."
    ],
    "clubes": [
        "Un club no es un equipo: es una forma de vivir.",
        "Los colores no se eligen: se heredan.",
        "Fundado por soñadores, sostenido por hinchas.",
        "Grande de verdad es el que tiene gente que lo quiera."
    ],
    "selecciones": [
        "La camiseta de la selección pesa como ninguna.",
        "Un país entero detrás de once jugadores.",
        "Cuando juega la selección, el país se detiene.",
        "Himno, escudo y un nudo en la garganta."
    ],
    "torneos": [
        "Las copas se ganan en los detalles.",
        "El que gana se queda con la gloria; el que pierde, con la historia.",
        "Un trofeo más para la vitrina soñada.",
        "«Las finales no se juegan: se ganan.» — Dicho de camarín"
    ],
    "premios": [
        "Los premios individuales se ganan en equipo.",
        "El oro brilla, pero el juego deslumbra.",
        "Vitrina nueva para tanto talento.",
        "Primero el fútbol, después los premios."
    ],
    "actuales": [
        "El futuro del fútbol ya está jugando.",
        "Crack se nace, figura se hace.",
        "Hoy rompe las redes; mañana, los libros de historia.",
        "La nueva generación no pide permiso."
    ],
    "leyendas": [
        "Las leyendas no envejecen: se agigantan.",
        "Hay jugadores eternos aunque cuelguen los botines.",
        "El fútbol le debe una estatua.",
        "Cierra los ojos: todavía lo ves jugar."
    ],
    "entrenadores": [
        "«Jugar al fútbol es muy simple, pero jugar un fútbol simple es lo más difícil que hay.» — Johan Cruyff",
        "La pizarra también gana partidos.",
        "Un buen DT ve lo que nadie más ve.",
        "Los técnicos viven con la maleta lista."
    ],
    "tacticas": [
        "«Sin la pelota no se puede ganar.» — Johan Cruyff",
        "La táctica ordena todo hasta que la magia lo desordena.",
        "Once contra once, y la pizarra de testigo.",
        "Un sistema no gana solo… pero cómo ayuda."
    ],
    "eras": [
        "El fútbol cambia; la pasión, jamás.",
        "Cada época tiene el fútbol que se merece.",
        "Del blanco y negro al 4K: siempre la misma pelota.",
        "La historia del fútbol se escribe por capítulos."
    ],
    "momentos": [
        "Hay partidos de 90 minutos y recuerdos para toda la vida.",
        "El fútbol es el único lugar donde el tiempo se detiene.",
        "Esto no fue un partido: fue historia pura.",
        "¿Dónde estabas tú cuando pasó esto?"
    ],
    "femenino": [
        "El fútbol es de todas y de todos.",
        "Ellas también hacen historia con la pelota.",
        "El talento no tiene género.",
        "Otra pionera que agrandó la cancha."
    ],
    "negocio": [
        "El fútbol moderno: pasión con cláusula de rescisión.",
        "«Here we go!» — Fabrizio Romano",
        "Los millones pasan; los goles quedan.",
        "El mercado nunca duerme."
    ],
    "voces": [
        "Un gol sin relato es solo una estadística.",
        "¡GOOOOOOL! Así suena mejor, ¿cierto?",
        "La radio inventó el fútbol dos veces.",
        "Las voces del fútbol también hacen historia."
    ]
};

// Anti-repetición: recuerda las últimas frases mostradas y las evita
let citasRecientes = [];
function citaParaElemento(el) {
    const pool = [...(CITAS_POR_GRUPO[el.group] || []), ...CITAS_GENERALES];
    let candidatas = pool.filter(c => !citasRecientes.includes(c));
    if (candidatas.length === 0) {
        citasRecientes = citasRecientes.slice(-3); // deja respirar el pool sin repetir lo recién visto
        candidatas = pool.filter(c => !citasRecientes.includes(c));
    }
    const cita = candidatas[Math.floor(Math.random() * candidatas.length)];
    citasRecientes.push(cita);
    if (citasRecientes.length > 30) citasRecientes.shift();
    return cita;
}

let fxCola = [];
let fxActivo = false;

function playDiscoveryFx(newIds) {
    fxCola.push(...newIds);
    procesarFxCola();
}

function procesarFxCola() {
    if (fxActivo || fxCola.length === 0) return;
    fxActivo = true;
    const el = elementsDB[fxCola.shift()];
    const cita = citaParaElemento(el);
    document.getElementById('discoveryFx').innerHTML = `
        <div class="dg-overlay" onclick="cerrarFx()" title="Toca para continuar">
            <div class="dg-rays"></div>
            <div class="dg-flash"></div>
            <div class="dg-centro">
                <div class="dg-emoji">${iconoDe(el)}</div>
                <div class="dg-titulo">¡Nuevo descubrimiento!</div>
                <div class="dg-nombre">${el.name}</div>
                <div class="dg-cita">${cita}</div>
            </div>
        </div>`;
    procesarFxCola._timer = setTimeout(cerrarFx, 2400);
}

function cerrarFx() {
    clearTimeout(procesarFxCola._timer);
    document.getElementById('discoveryFx').innerHTML = '';
    fxActivo = false;
    procesarFxCola();
}

function combineElements() {
    const seleccionados = [slot1, slot2, slot3].filter(Boolean);
    if (seleccionados.length < 2) {
        showMessage("Necesitas al menos 2 elementos para combinar.", "orange");
        return;
    }
    const combinationKey = seleccionados.sort().join('+');
    const results = (recipes[combinationKey] || []).filter(r => elementsDB[r]);
    if (results.length > 0) {
        let discoveredNew = false;
        let generatedNames = [];
        let newIds = [];
        results.forEach(resultId => {
            if (elementsDB[resultId]) {
                const elInfo = elementsDB[resultId];
                generatedNames.push(`${elInfo.name} ${elInfo.emoji}`);
                if (!unlockedElements.includes(resultId)) {
                    unlockedElements.push(resultId);
                    newIds.push(resultId);
                    discoveredNew = true;
                }
            }
        });
        const resultText = generatedNames.join(" y ");
        if (discoveredNew) {
            showMessage(`⚽ ¡GOOOL! Descubriste: ${resultText} ⚽`, "#00f5d4");
            soundDiscover();
            playDiscoveryFx(newIds);
            document.body.style.backgroundColor = "#0a2a14";
            setTimeout(() => document.body.style.backgroundColor = "var(--bg-color)", 300);
            saveProgress();
            document.getElementById('searchBar').value = "";
            renderInventory();
            checkAchievements();
        } else {
            showMessage(`Creaste ${resultText}, pero ya los tenías.`, "white");
            soundCombine();
        }
    } else {
        showMessage("Esa jugada no termina en nada... ¡prueba otra combinación!", "gray");
        soundFail();
    }
    slot1 = null;
    slot2 = null;
    slot3 = null;
    updateSlots();
}

// === HELPERS DEL ARRASTRE TÁCTIL ===
function slotBajoPunto(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return 0;
    if (el.closest('#slot1')) return 1;
    if (el.closest('#slot2')) return 2;
    if (el.closest('#slot3')) return 3;
    return 0;
}

function ponerEnSlot(idx, elementId) {
    if (idx === 1) slot1 = elementId;
    else if (idx === 2) slot2 = elementId;
    else if (idx === 3) slot3 = elementId;
    updateSlots();
}

function marcarSlotBajo(x, y) {
    const idx = slotBajoPunto(x, y);
    [1, 2, 3].forEach(n =>
        document.getElementById('slot' + n).classList.toggle('drag-over', idx === n));
}

function limpiarGestoTactil(btn) {
    if (btn._touch && btn._touch.ghost) btn._touch.ghost.remove();
    btn.classList.remove('drag-ready');
    btn._touch = null;
    [1, 2, 3].forEach(n =>
        document.getElementById('slot' + n).classList.remove('drag-over'));
}

// === ARRASTRAR Y SOLTAR EN LOS SLOTS ===
["slot1", "slot2", "slot3"].forEach((slotId, idx) => {
    const div = document.getElementById(slotId);
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Espacio de combinación ${idx + 1} (Enter para vaciar)`);
    div.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            clearSlot(idx + 1);
        }
    };
    div.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        div.classList.add('drag-over');
    };
    div.ondragleave = () => div.classList.remove('drag-over');
    div.ondrop = (e) => {
        e.preventDefault();
        div.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        if (elementsDB[id] && unlockedElements.includes(id)) {
            ponerEnSlot(idx + 1, id);
        }
    };
});

// === ENCICLOPEDIA ===
function openEncyclopedia(elementId = null) {
    document.getElementById('encModal').classList.add('open');
    if (elementId && unlockedElements.includes(elementId)) {
        showEncDetail(elementId);
    } else {
        renderEncIndex();
    }
}

function closeEncyclopedia() {
    document.getElementById('encModal').classList.remove('open');
}

document.getElementById('encModal').addEventListener('click', (e) => {
    if (e.target.id === 'encModal') closeEncyclopedia();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEncyclopedia();
});

function encChip(elementId) {
    const el = elementsDB[elementId];
    return `<span class="enc-chip" role="button" tabindex="0" aria-label="${el.name}"
        onclick="showEncDetail('${elementId}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showEncDetail('${elementId}');}">${iconoDe(el)} ${el.name}</span>`;
}

function renderEncIndex() {
    document.getElementById('encTitle').innerText = "📖 Enciclopedia";
    const sorted = [...unlockedElements].sort((a, b) => elementsDB[a].name.localeCompare(elementsDB[b].name));
    const chips = sorted.map(id => encChip(id)).join('');
    document.getElementById('encBody').innerHTML = `
        <input type="text" id="encSearch" class="enc-search" placeholder="Buscar en tus ${sorted.length} descubrimientos..." oninput="filterEncIndex()">
        <div id="encList">${chips}</div>
    `;
}

function filterEncIndex() {
    const term = document.getElementById('encSearch').value.toLowerCase();
    document.querySelectorAll('#encList .enc-chip').forEach(chip => {
        chip.style.display = chip.innerText.toLowerCase().includes(term) ? 'inline-flex' : 'none';
    });
}

function showEncDetail(elementId) {
    const el = elementsDB[elementId];
    document.getElementById('encTitle').innerText = "📖 Enciclopedia";
    const conocido = (id) => unlockedElements.includes(id);

    // Recetas que lo crean (solo si ya conoces los ingredientes)
    let creadoHTML = "";
    let creadoOcultas = 0;
    (recipesByResult[elementId] || []).forEach(r => {
        if (r.parts.every(conocido)) {
            creadoHTML += `<div class="enc-recipe">${r.parts.map(encChip).join(' + ')}</div>`;
        } else {
            creadoOcultas++;
        }
    });
    if (!recipesByResult[elementId]) {
        creadoHTML = `<div class="enc-none">Es un elemento primordial: existe desde el primer pitazo. 🌟</div>`;
    } else if (creadoHTML === "") {
        creadoHTML = `<div class="enc-none">Aún no conoces sus ingredientes.</div>`;
    }
    if (creadoOcultas > 0) {
        creadoHTML += `<div class="enc-locked">🔒 ${creadoOcultas} receta(s) secreta(s) más para crearlo.</div>`;
    }

    // Recetas donde participa (solo si conoces al otro ingrediente y todos los resultados)
    let usosHTML = "";
    let usosOcultos = 0;
    (recipesByIngredient[elementId] || []).forEach(r => {
        const otros = otrosIngredientes(r.parts, elementId);
        if (otros.every(conocido) && r.results.every(conocido)) {
            const ingredientes = [encChip(elementId), ...otros.map(encChip)].join(' + ');
            const resultados = r.results.map(id => encChip(id)).join(' y ');
            usosHTML += `<div class="enc-recipe">${ingredientes} = ${resultados}</div>`;
        } else {
            usosOcultos++;
        }
    });
    if (usosHTML === "" && usosOcultos === 0) {
        usosHTML = `<div class="enc-none">No participa en ninguna combinación. Es un elemento final.</div>`;
    }
    if (usosOcultos > 0) {
        usosHTML += `<div class="enc-locked">🔒 ¡Este elemento aún esconde ${usosOcultos} combinación(es) por descubrir!</div>`;
    }

    document.getElementById('encBody').innerHTML = `
        <button class="btn btn-info enc-back" onclick="renderEncIndex()">← Volver al índice</button>
        <div class="enc-hero">
            <div class="enc-emoji">${iconoDe(el)}</div>
            <h3>${el.name}</h3>
            <div class="enc-cat">${categoryNames[el.group] || "Otros"}</div>
        </div>
        <div class="enc-section-title">🧪 Se descubre con</div>
        ${creadoHTML}
        <div class="enc-section-title">⚽ Combinaciones conocidas</div>
        ${usosHTML}
    `;
    document.getElementById('encBody').scrollTop = 0;
}

// Iniciar
loadProgress();
renderInventory();
updateHintButtons();
document.getElementById('btnSound').innerText = soundOn ? "🔊" : "🔇";

// Mensaje inicial adaptado a pantallas táctiles (sin arrastrar ni clic derecho)
if (window.matchMedia("(pointer: coarse)").matches) {
    showMessage("¡Toca 2 elementos, o mantenlos pulsados y arrástralos! Quieto un momento = enciclopedia.");
}

// Sincronizar logros ya obtenidos sin mostrar toasts (ej. partidas antiguas)
checkAchievements(true);

// PWA: registrar el service worker (solo sobre http/https; en file:// no aplica)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin conexión o no soportado */ });
}
