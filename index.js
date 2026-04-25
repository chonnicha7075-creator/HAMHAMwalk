// 🌸 HamHam Buddy — desktop pet for SillyTavern
// Picks up <ham mood="..."> tags from incoming messages and lets the pet say them.
// Walks around the screen, complains when poked, gets dragged.

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";

const MODULE = "HamHamBuddy";

// ───────────────────────────── Sprite map (mood → [frame_a, frame_b]) ─────────────────────────────
const SPRITES = {
    normal:   ["https://i.postimg.cc/Z5YwyMGd/1000040832_removebg_preview.png", "https://i.postimg.cc/vHtPTsN4/1000040824_removebg_preview.png"],
    wave:     ["https://i.postimg.cc/Y0sv35Jk/1000040953-Picsart-Background-Remover.gif", "https://i.postimg.cc/Z5YwyMGd/1000040832_removebg_preview.png"],
    happy:    ["https://i.postimg.cc/sgfTZNkY/1000040841_removebg_preview.png", "https://i.postimg.cc/Z5YwyMGd/1000040832_removebg_preview.png"],
    angry:    ["https://i.postimg.cc/TYJk164W/1000040831_removebg_preview.png", "https://i.postimg.cc/3JFLNTcy/1000040823_removebg_preview.png"],
    tense:    ["https://i.postimg.cc/CxMcfQ3k/1000040833_removebg_preview.png", "https://i.postimg.cc/vHtPTsN4/1000040824_removebg_preview.png"],
    curious:  ["https://i.postimg.cc/rwyftPBS/1000040834_removebg_preview.png", "https://i.postimg.cc/SNfZRhv9/1000040825_removebg_preview.png"],
    scheming: ["https://i.postimg.cc/dVQ5TxbW/1000040842_removebg_preview.png", "https://i.postimg.cc/rwyftPBS/1000040834_removebg_preview.png"],
    sad:      ["https://i.postimg.cc/ZYBnJY0x/1000040845-removebg-preview.png", "https://i.postimg.cc/vHtPTsN4/1000040824_removebg_preview.png"],
    nsfw:     ["https://i.postimg.cc/Z5YwyMGd/1000040832_removebg_preview.png", "https://i.postimg.cc/3JFLNTcy/1000040823_removebg_preview.png"],
};

// Mood-tinted bubble colors
const MOOD_COLORS = {
    normal:   { border: "#d7789b", bg: "#fff5f9" },
    wave:     { border: "#e89162", bg: "#fff3eb" },
    happy:    { border: "#dcb630", bg: "#fff9e0" },
    angry:    { border: "#da5864", bg: "#ffeef0" },
    tense:    { border: "#986ce4", bg: "#f4ecff" },
    curious:  { border: "#30bc98", bg: "#e8faf3" },
    scheming: { border: "#c060d8", bg: "#faecff" },
    sad:      { border: "#7090c8", bg: "#eef2fa" },
    nsfw:     { border: "#d7789b", bg: "#fff0f5" },
};

// ───────────────────────────── Reaction lines ─────────────────────────────
const LINES = {
    click: [
        "โอ้ย ทำหนูทำไมเนี่ย!",
        "อย่าจิ้มสิคะ เจ็บนะ",
        "ฮึ่งงง! แกล้งหนูตลอดเลย",
        "พอแล้วๆ! ตัวเล็กๆ จะแตกแล้วน้า",
        "หยุดนะ! ไม่หยุดร้องนะ",
    ],
    clickAngry: [
        "พอได้แล้ว! 😡",
        "หนูจะกัดจริงๆ แล้วน้า!",
        "ไม่เล่นด้วยแล้ว! ฮึ่ง!",
    ],
    clickSad: [
        "หนูร้องไห้แล้วน้า... 🥺",
        "ทำไมแกล้งหนูตลอดเลยอ่ะ...",
        "หนูไปอยู่คนเดียวดีกว่า ฮึ่ก",
    ],
    drag: [
        "พี่จะมาลากหนูไปไหน ฟ้องแม่มุแน่!",
        "วางหนูลงนะะะ ตกใจหมดแล้ว",
        "อ๊ายยย หล่นน หล่นน",
        "หนูไม่ใช่ของเล่นน้า!",
        "อุ๊ย ขนยุ่งเลย",
    ],
    blocking: [
        "บังข้อความดีกว่าอิอิ ไม่เห็นแล้วว 🙈",
        "เห็นมั้ยคะ ไม่เห็นใช่ปะ ฮิๆ",
        "เธอไม่ต้องอ่าน หนูบังให้",
        "ตรงนี้ของหนูแล้วน้า",
        "อยากอ่านเหรอ ไล่หนูสิ ม่ายไป๊ 🤭",
    ],
    idle: [
        "หิวจัง...",
        "เย้ๆ ว่างเลย",
        "ง่วงน้อนนน",
        "บ๊วยอยู่ไหนนะ",
        "วันนี้อากาศดีจัง",
        "เด๋วต้องไปกินขนม",
    ],
    greeting: [
        "ฮัลโหลล! แฮมๆ มาแล้วว 🌸",
        "พี่กลับมาแล้วเหรอ คิดถึงงง",
        "ว่าไง ว่าไง วันนี้เล่นอะไรกันดี",
    ],
};

// ───────────────────────────── Default settings ─────────────────────────────
const DEFAULTS = {
    enabled: true,
    size: 80,
    walkInterval: 8,           // sec between random walks
    bubbleDuration: 4,         // sec idle bubbles last
    interceptHam: true,        // pull ham tags from messages
    hideRegexBubble: true,     // hide regex output if present
    avoidChat: true,           // walk away when blocking text
    idleChatter: false,        // random idle one-liners
    posX: 80,
    posY: 80,
    voiceEnabled: true,        // browser speech synthesis (Thai voice if available)
};

// ───────────────────────────── State ─────────────────────────────
const state = {
    pet: null,
    bubble: null,
    panel: null,
    x: 80, y: 80,
    facing: "right",
    mood: "normal",
    status: "idle",            // idle | walking | talking | dragging | hurt | resting
    walkTimer: null,
    bubbleTimer: null,
    statusTimer: null,
    queue: [],
    queueRunning: false,
    drag: { active: false, moved: false, ox: 0, oy: 0, downAt: 0, sx: 0, sy: 0 },
    clickStreak: 0,
    clickResetTimer: null,
};

// ───────────────────────────── Utils ─────────────────────────────
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function settings() {
    if (!extension_settings[MODULE]) extension_settings[MODULE] = structuredClone(DEFAULTS);
    // merge any new defaults
    for (const k of Object.keys(DEFAULTS)) {
        if (extension_settings[MODULE][k] === undefined) extension_settings[MODULE][k] = DEFAULTS[k];
    }
    return extension_settings[MODULE];
}

function save() { saveSettingsDebounced(); }

// ───────────────────────────── DOM build ─────────────────────────────
function buildPet() {
    if (state.pet) return;

    const s = settings();
    const size = s.size;

    state.pet = document.createElement("div");
    state.pet.id = "hh-pet";
    state.pet.style.width = `${size}px`;
    state.pet.style.height = `${size}px`;

    const inner = document.createElement("div");
    inner.className = "hh-inner";

    const a = document.createElement("img");
    a.className = "hh-sprite hh-frame-a";
    a.src = SPRITES.normal[0];
    a.draggable = false;

    const b = document.createElement("img");
    b.className = "hh-sprite hh-frame-b";
    b.src = SPRITES.normal[1];
    b.draggable = false;

    inner.append(a, b);
    state.pet.appendChild(inner);

    state.bubble = document.createElement("div");
    state.bubble.id = "hh-bubble";

    document.body.appendChild(state.pet);
    document.body.appendChild(state.bubble);

    state.x = s.posX;
    state.y = s.posY;
    applyTransform();

    bindInputs();
    setMood("normal");

    // soft greeting
    setTimeout(() => {
        if (state.status === "idle") sayQueued(pickOne(LINES.greeting), "wave", 3000);
    }, 1200);
}

function destroyPet() {
    if (state.walkTimer) clearTimeout(state.walkTimer);
    if (state.bubbleTimer) clearTimeout(state.bubbleTimer);
    if (state.statusTimer) clearTimeout(state.statusTimer);
    state.pet?.remove();
    state.bubble?.remove();
    state.pet = null;
    state.bubble = null;
}

function applyTransform() {
    if (!state.pet) return;
    const flip = state.facing === "left" ? -1 : 1;
    state.pet.style.transform = `translate(${state.x}px, ${state.y}px)`;
    state.pet.querySelector(".hh-inner").style.transform = `scaleX(${flip})`;
    positionBubble();
}

function positionBubble() {
    if (!state.bubble || !state.pet) return;
    const s = settings();
    const size = s.size;
    // bubble follows pet
    let bx = state.x + size / 2;
    let by = state.y - 8;
    state.bubble.style.left = `${bx}px`;
    state.bubble.style.top = `${by}px`;
    // flip below if too high
    if (state.y < 80) {
        state.bubble.classList.add("hh-bubble-below");
        state.bubble.style.top = `${state.y + size + 8}px`;
    } else {
        state.bubble.classList.remove("hh-bubble-below");
    }
}

// ───────────────────────────── Mood + bubble ─────────────────────────────
function setMood(mood) {
    if (!SPRITES[mood]) mood = "normal";
    state.mood = mood;
    if (!state.pet) return;
    const sprites = state.pet.querySelectorAll(".hh-sprite");
    sprites[0].src = SPRITES[mood][0];
    sprites[1].src = SPRITES[mood][1];

    const c = MOOD_COLORS[mood] || MOOD_COLORS.normal;
    state.bubble.style.setProperty("--hh-border", c.border);
    state.bubble.style.setProperty("--hh-bg", c.bg);
}

function showBubble(text, ms = 4000) {
    if (!state.bubble) return;
    state.bubble.textContent = text;
    state.bubble.classList.add("hh-visible");
    positionBubble();
    if (state.bubbleTimer) clearTimeout(state.bubbleTimer);
    state.bubbleTimer = setTimeout(() => {
        state.bubble.classList.remove("hh-visible");
    }, ms);
}

// Queue: lines spoken sequentially (e.g. multiple ham tags in one message)
function sayQueued(text, mood = "normal", ms = null) {
    state.queue.push({ text, mood, ms });
    if (!state.queueRunning) runQueue();
}

async function runQueue() {
    state.queueRunning = true;
    while (state.queue.length) {
        const item = state.queue.shift();
        const dur = item.ms ?? Math.min(8000, 2200 + (item.text?.length ?? 10) * 70);
        setMood(item.mood);
        showBubble(item.text, dur);
        speak(item.text);
        state.status = "talking";
        if (state.statusTimer) clearTimeout(state.statusTimer);
        await new Promise((r) => setTimeout(r, dur + 200));
    }
    state.queueRunning = false;
    state.status = "idle";
    setMood("normal");
}

// ───────────────────────────── Movement ─────────────────────────────
function moveTo(nx, ny, ms = 2000) {
    if (!state.pet) return;
    const s = settings();
    nx = clamp(nx, 0, window.innerWidth - s.size);
    ny = clamp(ny, 0, window.innerHeight - s.size);
    if (nx > state.x + 4) state.facing = "right";
    else if (nx < state.x - 4) state.facing = "left";
    state.pet.style.transition = `transform ${ms}ms cubic-bezier(.34,.1,.27,1)`;
    state.x = nx;
    state.y = ny;
    state.status = "walking";
    applyTransform();
    // animate bubble too
    const startTs = performance.now();
    function follow(now) {
        if (now - startTs > ms + 50) return;
        positionBubble();
        requestAnimationFrame(follow);
    }
    requestAnimationFrame(follow);

    if (state.statusTimer) clearTimeout(state.statusTimer);
    state.statusTimer = setTimeout(() => {
        state.status = "idle";
        // persist position
        const cur = settings();
        cur.posX = state.x;
        cur.posY = state.y;
        save();
    }, ms);
}

function scheduleWalk() {
    if (state.walkTimer) clearTimeout(state.walkTimer);
    const s = settings();
    if (!s.enabled) return;
    const wait = (s.walkInterval * 1000) + Math.random() * 4000;
    state.walkTimer = setTimeout(() => {
        if (state.status === "idle") doRandomWalk();
        scheduleWalk();
        if (s.idleChatter && Math.random() < 0.3 && state.status === "idle") {
            sayQueued(pickOne(LINES.idle), "normal", 2500);
        }
        if (s.avoidChat) maybeAvoidChat();
    }, wait);
}

function doRandomWalk() {
    const s = settings();
    const w = window.innerWidth - s.size;
    const h = window.innerHeight - s.size;
    // pet prefers upper 75% so it doesn't sit on the input box
    const ny = Math.random() * (h * 0.75) + 20;
    const nx = Math.random() * w;
    const dist = Math.hypot(nx - state.x, ny - state.y);
    moveTo(nx, ny, clamp(dist * 8, 1200, 3500));
}

// ───────────────────────────── Avoid chat content ─────────────────────────────
function maybeAvoidChat() {
    if (state.status !== "idle") return;
    const chat = document.getElementById("chat");
    if (!chat) return;
    const messages = chat.querySelectorAll(".mes .mes_text");
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    const a = state.pet.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    if (!overlap) return;

    sayQueued(pickOne(LINES.blocking), "scheming", 3000);
    // walk to a free corner
    const s = settings();
    const goLeft = a.left > window.innerWidth / 2;
    const targetX = goLeft ? 20 : window.innerWidth - s.size - 20;
    const targetY = clamp(state.y + (Math.random() * 100 - 50), 40, window.innerHeight * 0.4);
    setTimeout(() => moveTo(targetX, targetY, 1500), 800);
}

// ───────────────────────────── Drag / click ─────────────────────────────
function bindInputs() {
    const onDown = (e) => {
        const ev = e.touches ? e.touches[0] : e;
        e.preventDefault();
        state.drag.active = true;
        state.drag.moved = false;
        state.drag.downAt = Date.now();
        const rect = state.pet.getBoundingClientRect();
        state.drag.ox = ev.clientX - rect.left;
        state.drag.oy = ev.clientY - rect.top;
        state.drag.sx = ev.clientX;
        state.drag.sy = ev.clientY;
        state.pet.classList.add("hh-grabbing");
        state.pet.style.transition = "none";
    };
    const onMove = (e) => {
        if (!state.drag.active) return;
        const ev = e.touches ? e.touches[0] : e;
        const dx = ev.clientX - state.drag.sx;
        const dy = ev.clientY - state.drag.sy;
        if (!state.drag.moved && Math.hypot(dx, dy) > 4) {
            state.drag.moved = true;
            state.status = "dragging";
            sayQueued(pickOne(LINES.drag), "tense", 2500);
        }
        if (state.drag.moved) {
            state.x = ev.clientX - state.drag.ox;
            state.y = ev.clientY - state.drag.oy;
            applyTransform();
        }
    };
    const onUp = () => {
        if (!state.drag.active) return;
        const wasClick = !state.drag.moved && Date.now() - state.drag.downAt < 350;
        state.drag.active = false;
        state.pet.classList.remove("hh-grabbing");
        if (wasClick) {
            handleClick();
        } else {
            state.status = "idle";
            const s = settings();
            s.posX = state.x;
            s.posY = state.y;
            save();
        }
    };

    state.pet.addEventListener("mousedown", onDown);
    state.pet.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    state.pet.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        togglePanel(e.clientX, e.clientY);
    });

    window.addEventListener("resize", () => {
        const s = settings();
        state.x = clamp(state.x, 0, window.innerWidth - s.size);
        state.y = clamp(state.y, 0, window.innerHeight - s.size);
        applyTransform();
    });
}

function handleClick() {
    state.clickStreak++;
    if (state.clickResetTimer) clearTimeout(state.clickResetTimer);
    state.clickResetTimer = setTimeout(() => state.clickStreak = 0, 2200);

    let line, mood;
    if (state.clickStreak >= 6) {
        line = pickOne(LINES.clickSad);
        mood = "sad";
    } else if (state.clickStreak >= 3) {
        line = pickOne(LINES.clickAngry);
        mood = "angry";
    } else {
        line = pickOne(LINES.click);
        mood = "tense";
    }
    state.queue.length = 0; // interrupt anything else
    state.queueRunning = false;
    sayQueued(line, mood, 2500);

    state.pet.classList.remove("hh-bounce");
    void state.pet.offsetWidth; // restart animation
    state.pet.classList.add("hh-bounce");
}

// ───────────────────────────── Speech (browser TTS, optional) ─────────────────────────────
let _voiceCache = null;
function getThaiVoice() {
    if (_voiceCache !== null) return _voiceCache;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    _voiceCache = voices.find(v => /th(-|_)?TH/i.test(v.lang) || /thai/i.test(v.name)) || null;
    return _voiceCache;
}
function speak(text) {
    const s = settings();
    if (!s.voiceEnabled) return;
    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = getThaiVoice();
        if (v) u.voice = v;
        u.rate = 1.05;
        u.pitch = 1.4;
        u.volume = 0.7;
        window.speechSynthesis.speak(u);
    } catch (_) { /* noop */ }
}
// preload voices
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { _voiceCache = null; getThaiVoice(); };
}

// ───────────────────────────── Ham tag interception ─────────────────────────────
const HAM_RE = /<ham\s+mood=['"]([a-z_]+)['"]\s*>([\s\S]*?)<\/ham>/gi;

function processMessage(messageId) {
    const s = settings();
    if (!s.enabled || !s.interceptHam) return;
    const ctx = getContext();
    const msg = ctx?.chat?.[messageId];
    if (!msg || !msg.mes) return;
    if (msg.is_user) return; // only AI messages

    const matches = [...msg.mes.matchAll(HAM_RE)];
    if (!matches.length) return;

    // hide existing regex bubbles in this message DOM, if any
    if (s.hideRegexBubble) {
        const mesDom = document.querySelector(`.mes[mesid="${messageId}"] .mes_text`);
        if (mesDom) {
            mesDom.querySelectorAll("div").forEach(div => {
                if (/แฮมแฮม\s*·/.test(div.textContent || "")) {
                    div.style.display = "none";
                }
            });
        }
    }

    // queue every line so multiple ham tags play in sequence
    for (const m of matches) {
        const mood = (m[1] || "normal").toLowerCase();
        const text = (m[2] || "").trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
        if (text) sayQueued(text, mood);
    }
}

// ───────────────────────────── Settings panel (right-click) ─────────────────────────────
function togglePanel(x, y) {
    if (state.panel) { state.panel.remove(); state.panel = null; return; }
    const s = settings();
    const p = document.createElement("div");
    p.id = "hh-panel";
    p.innerHTML = `
        <div class="hh-panel-title">🌸 แฮมๆ Buddy</div>
        <label class="hh-row"><span>เปิดใช้งาน</span><input type="checkbox" data-k="enabled" ${s.enabled?"checked":""}></label>
        <label class="hh-row"><span>ดักแท็ก &lt;ham&gt;</span><input type="checkbox" data-k="interceptHam" ${s.interceptHam?"checked":""}></label>
        <label class="hh-row"><span>ซ่อน bubble จาก regex</span><input type="checkbox" data-k="hideRegexBubble" ${s.hideRegexBubble?"checked":""}></label>
        <label class="hh-row"><span>หลบข้อความ</span><input type="checkbox" data-k="avoidChat" ${s.avoidChat?"checked":""}></label>
        <label class="hh-row"><span>พึมพำตอนว่าง</span><input type="checkbox" data-k="idleChatter" ${s.idleChatter?"checked":""}></label>
        <label class="hh-row"><span>เสียงพูด (TTS)</span><input type="checkbox" data-k="voiceEnabled" ${s.voiceEnabled?"checked":""}></label>
        <label class="hh-row"><span>ขนาด ${s.size}px</span><input type="range" min="48" max="160" step="4" data-k="size" value="${s.size}"></label>
        <label class="hh-row"><span>ช่วงเดิน ${s.walkInterval}s</span><input type="range" min="3" max="30" step="1" data-k="walkInterval" value="${s.walkInterval}"></label>
        <div class="hh-row hh-mood-row">
            <span>ลอง mood:</span>
            <div class="hh-moods">
                ${Object.keys(SPRITES).map(m => `<button data-mood="${m}">${m}</button>`).join("")}
            </div>
        </div>
        <div class="hh-row"><button class="hh-close">ปิดเมนู</button></div>
    `;
    document.body.appendChild(p);
    state.panel = p;
    const px = clamp(x, 8, window.innerWidth - 280);
    const py = clamp(y, 8, window.innerHeight - 380);
    p.style.left = `${px}px`;
    p.style.top = `${py}px`;

    p.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("change", () => {
            const k = inp.dataset.k;
            const cur = settings();
            if (inp.type === "checkbox") cur[k] = inp.checked;
            else if (inp.type === "range") {
                cur[k] = parseInt(inp.value, 10);
                inp.previousElementSibling.textContent = inp.previousElementSibling.textContent.replace(/\d+/, inp.value);
                if (k === "size" && state.pet) {
                    state.pet.style.width = `${cur[k]}px`;
                    state.pet.style.height = `${cur[k]}px`;
                }
            }
            save();
            if (k === "enabled") {
                if (cur.enabled) { buildPet(); scheduleWalk(); }
                else destroyPet();
            }
        });
    });
    p.querySelectorAll("[data-mood]").forEach(b => {
        b.addEventListener("click", () => {
            sayQueued(`mood: ${b.dataset.mood} ✨`, b.dataset.mood, 2500);
        });
    });
    p.querySelector(".hh-close").addEventListener("click", () => { p.remove(); state.panel = null; });

    setTimeout(() => {
        document.addEventListener("mousedown", function dismiss(e) {
            if (state.panel && !state.panel.contains(e.target) && e.target !== state.pet && !state.pet.contains(e.target)) {
                state.panel.remove();
                state.panel = null;
                document.removeEventListener("mousedown", dismiss);
            }
        });
    }, 0);
}

// ───────────────────────────── Boot ─────────────────────────────
function boot() {
    settings();
    if (settings().enabled) {
        buildPet();
        scheduleWalk();
    }
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, processMessage);
    eventSource.on(event_types.MESSAGE_SWIPED, processMessage);
    eventSource.on(event_types.MESSAGE_EDITED, processMessage);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.walkTimer) clearTimeout(state.walkTimer);
        else scheduleWalk();
    });
}

// wait for DOM-ish readiness
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    setTimeout(boot, 400);
}
