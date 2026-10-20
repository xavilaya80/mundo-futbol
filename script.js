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
            btn.innerHTML = `<span class="el-emoji">${el.emoji}</span><span class="el-nombre">${el.name}</span>`;
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
        div.innerHTML = id ? `${elementsDB[id].emoji}<br><span>${elementsDB[id].name}</span>` : "?";
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

// Arpegio ascendente brillante: ¡descubrimiento nuevo!
function soundDiscover() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, 0.35, 'triangle', 0.18, i * 0.09));
    playTone(2093, 0.5, 'sine', 0.06, 0.36);
}

// Pop suave: combinación válida pero ya conocida
function soundCombine() {
    playTone(440, 0.12, 'sine', 0.15);
    playTone(660, 0.15, 'sine', 0.12, 0.07);
}

// Zumbido grave descendente: no reaccionan
function soundFail() {
    playTone(180, 0.25, 'sawtooth', 0.08);
    playTone(130, 0.3, 'sawtooth', 0.08, 0.12);
}

// Fanfarria: ¡logro desbloqueado!
function soundAchievement() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => playTone(f, 0.3, 'square', 0.07, i * 0.12));
    playTone(1046.5, 0.7, 'triangle', 0.14, 0.48);
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
const CITAS = [
    "«La pelota no se mancha.» — Diego Maradona",
    "«El fútbol es lo más importante de las cosas menos importantes.» — Arrigo Sacchi",
    "«Jugar al fútbol es muy simple, pero jugar un fútbol simple es lo más difícil que hay.» — Johan Cruyff",
    "«Sin la pelota no se puede ganar.» — Johan Cruyff",
    "«El fútbol se juega con la cabeza; las piernas son solo las herramientas.» — Johan Cruyff",
    "«El fútbol no es cuestión de vida o muerte; es mucho más importante que eso.» — Bill Shankly",
    "«El fútbol es el ballet de las masas.» — Dmitri Shostakóvich",
    "«En el fútbol todo se complica por la presencia del equipo contrario.» — Jean-Paul Sartre",
    "«Se puede cambiar de partido o de religión, pero jamás de equipo de fútbol.» — Eduardo Galeano",
    "«Jugamos como nunca y perdimos como siempre.» — Dicho popular",
    "«Mientras la pelota ruede, hay esperanza.» — Dicho popular",
    "«El que no corre hoy, mira el partido desde el banco mañana.» — Dicho de camarín",
    "«Los partidos se ganan en la cancha.» — Dicho popular",
    "«La pelota siempre al 10.» — Dicho popular"
];

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
    const cita = CITAS[Math.floor(Math.random() * CITAS.length)];
    document.getElementById('discoveryFx').innerHTML = `
        <div class="dg-overlay" onclick="cerrarFx()" title="Toca para continuar">
            <div class="dg-rays"></div>
            <div class="dg-flash"></div>
            <div class="dg-centro">
                <div class="dg-emoji">${el.emoji}</div>
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
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showEncDetail('${elementId}');}">${el.emoji} ${el.name}</span>`;
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
            <div class="enc-emoji">${el.emoji}</div>
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
