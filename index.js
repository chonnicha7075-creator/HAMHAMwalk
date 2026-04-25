// 🌸 HamHam Buddy v3
// - Default voice = best-tuned TTS (cute pitch + mood-based rate)
// - Voice picker so user can find their favorite voice on their device
// - 5-second long-press to open settings (with visual progress ring)
// - Right-click on PC still opens settings instantly

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";

const MODULE = "HamHamBuddy";
const LONG_PRESS_MS = 5000;

// ───────────────────────────── Sprite map ─────────────────────────────
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

// pitch + rate per mood (TTS)
const MOOD_TTS = {
    happy:    { pitch: 2.0, rate: 1.05 },
    wave:     { pitch: 1.95, rate: 1.0 },
    curious:  { pitch: 1.85, rate: 1.0 },
    normal:   { pitch: 1.75, rate: 0.97 },
    nsfw:     { pitch: 1.7,  rate: 0.93 },
    scheming: { pitch: 1.6,  rate: 0.95 },
    tense:    { pitch: 1.7,  rate: 1.05 },
    angry:    { pitch: 1.55, rate: 1.15 },
    sad:      { pitch: 1.35, rate: 0.85 },
};

// chitter pitch by mood
const MOOD_PITCH = {
    happy: 1.45, wave: 1.35, curious: 1.20, normal: 1.00,
    nsfw: 1.05, scheming: 0.95, tense: 0.90, angry: 0.80, sad: 0.70,
};

// ───────────────────────────── Lines ─────────────────────────────
const LINES = {
    click: [
        "โอ้ย ทำหนูทำไมเนี่ย!",
        "อย่าจิ้มสิคะ เจ็บนะ!",
        "ฮึ่งงง! แกล้งหนูตลอดเลย",
        "พอแล้วๆ! ตัวเล็กๆ จะแตกแล้วน้า",
        "หยุดนะ! ไม่หยุดร้องนะ",
        "อ๊ายยย จิ้มอะไรของเธอ!",
        "นิ้วใหญ่จัง น่ากลัวอ่ะ",
        "อย่าน้าาา หนูตัวบาง!",
        "หนูบอกแล้วไงว่าอย่าจิ้ม",
        "เธอนี่นะ ขี้แกล้งง",
        "ก๊าก! ตกใจหมดเลย",
        "พี่นี่นะ ใจร้ายจังเลย ฮึ่ง",
        "เอ๊ะ ทำไมต้องจิ้มหนูด้วย!",
    ],
    clickAngry: [
        "พอได้แล้ว!",
        "หนูจะกัดจริงๆ แล้วน้า!",
        "ไม่เล่นด้วยแล้ว! ฮึ่ง!",
        "แกล้งหนูพอแล้วน้า โกรธจริงน่ะ!",
        "พี่!! หนูจะร้องบอกแม่มุนะ!",
        "ใจร้ายมากเลยรู้มั้ย!",
        "ไม่ปั่นด้วยแล้ว ไปแล้ว ฮึ่ง!",
        "บอกแล้วไงว่าหยุด! ไม่ฟังเลย!",
    ],
    clickSad: [
        "หนูร้องไห้แล้วน้า...",
        "ทำไมแกล้งหนูตลอดเลยอ่ะ...",
        "หนูไปอยู่คนเดียวดีกว่า ฮึ่ก",
        "พี่ไม่รักหนูแล้วเหรอ...",
        "หนูเจ็บจริงๆ น้า ฮือออ",
        "ไม่อยากเล่นกับพี่อีกแล้ว...",
        "หนูทำอะไรผิดเหรอ ทำไมแกล้งกัน...",
    ],
    drag: [
        "พี่จะมาลากหนูไปไหน ฟ้องแม่มุแน่!",
        "วางหนูลงนะะะ ตกใจหมดแล้ว",
        "อ๊ายยย หล่นน หล่นน",
        "หนูไม่ใช่ของเล่นน้า!",
        "อุ๊ย ขนยุ่งเลย!",
        "บินได้เหรอเนี่ย น่ากลัวจังง",
        "ปล่อยหนูสิ! ปล่อยน้า!",
        "พี่หิ้วหนูแบบไม่บอกก่อน รุนแรง!",
        "หมุนๆ เวียนหัวแล้วววว",
        "พี่จะพาหนูไปไหนเหรอ บ๊วยมั้ย",
        "ระวังด้วยนะ หนูเปราะบาง!",
        "หนูร้องน้อยา ใครก็ได้ช่วยที!",
        "อ๊ายย ทำไมต้องลากด้วยอ่ะ",
    ],
    blocking: [
        "บังข้อความดีกว่าอิอิ ไม่เห็นแล้วว",
        "เห็นมั้ยคะ ไม่เห็นใช่ปะ ฮิๆ",
        "เธอไม่ต้องอ่าน หนูบังให้",
        "ตรงนี้ของหนูแล้วน้า",
        "อยากอ่านเหรอ ไล่หนูสิ ม่ายไป๊",
        "นั่งทับดีก่า ฮิๆ",
        "ความลับของพี่ หนูเก็บให้",
        "อย่าอ่านน้า อยู่กับหนูดีกว่า",
        "ทำตัวเป็นป้าย censor ฮิๆ",
        "หนูเป็น sticker บังข้อความน้า",
        "ตรงนี้ของหนูจองแล้ว",
    ],
    idle: [
        "หิวจัง...",
        "เย้ๆ ว่างเลย",
        "ง่วงน้อนนน",
        "บ๊วยอยู่ไหนนะ",
        "วันนี้อากาศดีจัง",
        "เด๋วต้องไปกินขนม",
        "แม่มุๆ คิดถึงงง",
        "เบื่อจัง ทำไรดีน้า",
        "อยากกินเมล็ดทานตะวัน",
        "ขนหนูฟูๆ น่ารักมั้ยคะ",
        "หาวๆ ง่วงๆ",
        "ฮัมเพลงนิดนึงน้า ลา ลา ลา",
        "ใครเรียกหนูเหรอ?",
        "วันนี้พี่ดูเท่ดีน้า ฮิๆ",
        "หนูแก้มยุ้ย เพราะเก็บอาหารไว้",
    ],
    greeting: [
        "ฮัลโหลล! แฮมๆ มาแล้วว",
        "พี่กลับมาแล้วเหรอ คิดถึงงง",
        "ว่าไง ว่าไง วันนี้เล่นอะไรกันดี",
        "เย้! ได้เจอพี่แล้ว",
        "ตื่นแล้วน้าาา",
        "วันนี้พร้อมแล้วค่า!",
        "ฮายยย พี่ คิดถึงสุดๆ เลย",
    ],
};

// ───────────────────────────── Defaults ─────────────────────────────
const DEFAULTS = {
    enabled: true,
    size: 80,
    walkInterval: 10,
    interceptHam: true,
    hideRegexBubble: true,
    avoidChat: true,
    idleChatter: true,
    posX: 80,
    posY: 80,
    voiceMode: "tts",       // tts | chitter | off
    ttsVoice: "",            // empty = auto
    ttsPitchBoost: 0,        // -0.5 ... +0.25 user adjustment on top of mood pitch
    ttsRate: 1.0,            // user multiplier
    ttsVolume: 0.85,
    chitterVolume: 0.18,
};

// ───────────────────────────── State ─────────────────────────────
const state = {
    pet: null,
    bubble: null,
    panel: null,
    x: 80, y: 80,
    facing: "right",
    mood: "normal",
    status: "idle",
    walkTimer: null,
    bubbleTimer: null,
    walkAnim: null,
    queue: [],
    queueRunning: false,
    drag: { active: false, moved: false, longPressed: false, ox: 0, oy: 0, downAt: 0, sx: 0, sy: 0 },
    clickStreak: 0,
    clickResetTimer: null,
    audioCtx: null,
    audioUnlocked: false,
    ring: null,
    ringStart: null,
    ringRAF: null,
};

// ───────────────────────────── Utils ─────────────────────────────
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

function settings() {
    if (!extension_settings[MODULE]) extension_settings[MODULE] = structuredClone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (extension_settings[MODULE][k] === undefined) extension_settings[MODULE][k] = DEFAULTS[k];
    }
    return extension_settings[MODULE];
}
function save() { saveSettingsDebounced(); }

// ───────────────────────────── Audio ─────────────────────────────
function getAudio() {
    if (!state.audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        state.audioCtx = new Ctx();
    }
    return state.audioCtx;
}
function unlockAudio() {
    if (state.audioUnlocked) return;
    const ctx = getAudio();
    if (ctx?.state === "suspended") ctx.resume();
    if (window.speechSynthesis) {
        try {
            const u = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(u);
        } catch (_) {}
    }
    state.audioUnlocked = true;
}

function chitter(text, mood = "normal") {
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume();
        if (ctx.state === "suspended") return;
    }
    const s = settings();
    const syllables = clamp(Math.floor((text || "").length / 2.2), 2, 14);
    const moodPitch = MOOD_PITCH[mood] || 1.0;
    const vol = s.chitterVolume;
    const now = ctx.currentTime;
    const interval = 0.11;

    for (let i = 0; i < syllables; i++) {
        const t = now + i * interval;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "triangle";
        const basePitch = (700 + Math.random() * 400) * moodPitch;
        osc.frequency.setValueAtTime(basePitch * 0.85, t);
        osc.frequency.linearRampToValueAtTime(basePitch * 1.08, t + 0.025);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.7, t + 0.09);
        filter.type = "lowpass";
        filter.frequency.value = 3200;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }
}

let voicesCache = [];
function loadVoices() {
    if (!window.speechSynthesis) return [];
    const v = window.speechSynthesis.getVoices() || [];
    if (v.length) voicesCache = v;
    return voicesCache;
}
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 800);
}

function pickBestVoice() {
    const voices = loadVoices();
    if (!voices.length) return null;
    const s = settings();
    if (s.ttsVoice) {
        const found = voices.find(v => v.name === s.ttsVoice);
        if (found) return found;
    }
    const score = (v) => {
        const n = (v.name || "").toLowerCase();
        const lang = (v.lang || "").toLowerCase();
        let pts = 0;
        if (lang.startsWith("th")) pts += 100;
        if (/(kanya|narisa|premwadee|orachat)/i.test(n)) pts += 50;
        if (/google/i.test(n) && lang.startsWith("th")) pts += 30;
        if (/female|woman|girl/i.test(n)) pts += 10;
        return pts;
    };
    const sorted = [...voices].sort((a, b) => score(b) - score(a));
    return sorted[0] || null;
}

function speakTTS(text, mood = "normal") {
    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = pickBestVoice();
        if (v) { u.voice = v; u.lang = v.lang; }
        const s = settings();
        const m = MOOD_TTS[mood] || MOOD_TTS.normal;
        u.pitch = clamp(m.pitch + (s.ttsPitchBoost || 0), 0.1, 2.0);
        u.rate = clamp(m.rate * (s.ttsRate || 1.0), 0.5, 2.0);
        u.volume = s.ttsVolume ?? 0.85;
        window.speechSynthesis.speak(u);
    } catch (_) {}
}

function vocalize(text, mood) {
    const s = settings();
    if (s.voiceMode === "off") return;
    if (s.voiceMode === "chitter") return chitter(text, mood);
    return speakTTS(text, mood);
}

// ───────────────────────────── DOM ─────────────────────────────
function buildPet() {
    if (state.pet) return;
    const s = settings();

    state.pet = document.createElement("div");
    state.pet.id = "hh-pet";
    state.pet.style.width = `${s.size}px`;
    state.pet.style.height = `${s.size}px`;

    const inner = document.createElement("div");
    inner.className = "hh-inner";

    const a = document.createElement("img");
    a.className = "hh-sprite hh-frame-a";
    a.src = SPRITES.normal[0];
    a.draggable = false;
    a.alt = "";

    const b = document.createElement("img");
    b.className = "hh-sprite hh-frame-b";
    b.src = SPRITES.normal[1];
    b.draggable = false;
    b.alt = "";

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

    setTimeout(() => {
        if (state.status === "idle") sayQueued(pickOne(LINES.greeting), "wave", 3000);
    }, 1500);
}

function destroyPet() {
    if (state.walkTimer) clearTimeout(state.walkTimer);
    if (state.bubbleTimer) clearTimeout(state.bubbleTimer);
    if (state.walkAnim) cancelAnimationFrame(state.walkAnim);
    cancelLongPress();
    state.pet?.remove();
    state.bubble?.remove();
    state.panel?.remove();
    state.pet = null;
    state.bubble = null;
    state.panel = null;
}

function applyTransform() {
    if (!state.pet) return;
    state.pet.style.transform = `translate(${state.x}px, ${state.y}px)`;
    const flip = state.facing === "left" ? -1 : 1;
    state.pet.style.setProperty("--flip", flip);
    positionBubble();
}

function positionBubble() {
    if (!state.bubble || !state.pet) return;
    const s = settings();
    state.bubble.style.left = `${state.x + s.size / 2}px`;
    state.bubble.style.top = `${state.y - 8}px`;
    if (state.y < 90) {
        state.bubble.classList.add("hh-bubble-below");
        state.bubble.style.top = `${state.y + s.size + 8}px`;
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

function sayQueued(text, mood = "normal", ms = null) {
    state.queue.push({ text, mood, ms });
    if (!state.queueRunning) runQueue();
}

async function runQueue() {
    state.queueRunning = true;
    while (state.queue.length) {
        const item = state.queue.shift();
        const dur = item.ms ?? clamp(2200 + (item.text?.length ?? 10) * 70, 2400, 8000);
        setMood(item.mood);
        showBubble(item.text, dur);
        vocalize(item.text, item.mood);
        state.status = "talking";
        await new Promise((r) => setTimeout(r, dur + 200));
    }
    state.queueRunning = false;
    state.status = "idle";
    setTimeout(() => { if (state.status === "idle") setMood("normal"); }, 400);
}

// ───────────────────────────── Walking ─────────────────────────────
function moveTo(nx, ny, durMs = null) {
    if (!state.pet) return;
    if (state.walkAnim) cancelAnimationFrame(state.walkAnim);

    const s = settings();
    nx = clamp(nx, 4, window.innerWidth - s.size - 4);
    ny = clamp(ny, 4, window.innerHeight - s.size - 4);

    const sx = state.x, sy = state.y;
    const dx = nx - sx, dy = ny - sy;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;

    if (dx > 4) state.facing = "right";
    else if (dx < -4) state.facing = "left";

    const speed = 75;
    const dur = durMs ?? clamp((dist / speed) * 1000, 800, 6000);
    state.status = "walking";
    state.pet.classList.add("hh-walking");

    const startTs = performance.now();
    function step(now) {
        const t = clamp((now - startTs) / dur, 0, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        state.x = sx + dx * eased;
        state.y = sy + dy * eased;
        applyTransform();
        if (t < 1) {
            state.walkAnim = requestAnimationFrame(step);
        } else {
            state.pet.classList.remove("hh-walking");
            state.status = "idle";
            const cur = settings();
            cur.posX = state.x;
            cur.posY = state.y;
            save();
            state.walkAnim = null;
        }
    }
    state.walkAnim = requestAnimationFrame(step);
}

function scheduleWalk() {
    if (state.walkTimer) clearTimeout(state.walkTimer);
    const s = settings();
    if (!s.enabled) return;
    const wait = (s.walkInterval * 1000) + Math.random() * 5000;
    state.walkTimer = setTimeout(() => {
        if (state.status === "idle") doRandomWalk();
        scheduleWalk();
        if (s.idleChatter && Math.random() < 0.25 && state.status === "idle") {
            sayQueued(pickOne(LINES.idle), "normal", 2500);
        }
        if (s.avoidChat) maybeAvoidChat();
    }, wait);
}

function doRandomWalk() {
    const s = settings();
    const w = window.innerWidth - s.size;
    const h = window.innerHeight - s.size;
    const ny = Math.random() * (h * 0.7) + 30;
    const nx = Math.random() * w;
    moveTo(nx, ny);
}

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
    const s = settings();
    const goLeft = a.left > window.innerWidth / 2;
    const targetX = goLeft ? 30 : window.innerWidth - s.size - 30;
    const targetY = clamp(state.y + (Math.random() * 80 - 40), 50, window.innerHeight * 0.4);
    setTimeout(() => moveTo(targetX, targetY), 900);
}

// ───────────────────────────── Long-press ring ─────────────────────────────
function startLongPress() {
    cancelLongPress();
    state.ringStart = performance.now();

    const s = settings();
    const size = s.size;
    const ringSize = size + 24;
    const radius = (ringSize / 2) - 5;
    const circumference = 2 * Math.PI * radius;

    const svgNs = "http://www.w3.org/2000/svg";
    state.ring = document.createElementNS(svgNs, "svg");
    state.ring.setAttribute("class", "hh-ring");
    state.ring.setAttribute("width", ringSize);
    state.ring.setAttribute("height", ringSize);
    state.ring.setAttribute("viewBox", `0 0 ${ringSize} ${ringSize}`);
    state.ring.style.left = `-12px`;
    state.ring.style.top = `-12px`;

    const bg = document.createElementNS(svgNs, "circle");
    bg.setAttribute("cx", ringSize / 2);
    bg.setAttribute("cy", ringSize / 2);
    bg.setAttribute("r", radius);
    bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "rgba(215,120,155,.2)");
    bg.setAttribute("stroke-width", "3");

    const fg = document.createElementNS(svgNs, "circle");
    fg.setAttribute("class", "hh-ring-fg");
    fg.setAttribute("cx", ringSize / 2);
    fg.setAttribute("cy", ringSize / 2);
    fg.setAttribute("r", radius);
    fg.setAttribute("fill", "none");
    fg.setAttribute("stroke", "#d7789b");
    fg.setAttribute("stroke-width", "4");
    fg.setAttribute("stroke-linecap", "round");
    fg.setAttribute("stroke-dasharray", String(circumference));
    fg.setAttribute("stroke-dashoffset", String(circumference));
    fg.setAttribute("transform", `rotate(-90 ${ringSize/2} ${ringSize/2})`);

    state.ring.appendChild(bg);
    state.ring.appendChild(fg);
    state.pet.appendChild(state.ring);

    function tick() {
        if (state.ringStart === null) return;
        const elapsed = performance.now() - state.ringStart;
        const progress = Math.min(1, elapsed / LONG_PRESS_MS);
        if (state.ring) {
            const fgEl = state.ring.querySelector(".hh-ring-fg");
            if (fgEl) fgEl.setAttribute("stroke-dashoffset", String(circumference * (1 - progress)));
        }
        if (progress >= 1) {
            const rect = state.pet.getBoundingClientRect();
            fireLongPress(rect.left + rect.width / 2, rect.top + rect.height / 2);
            return;
        }
        state.ringRAF = requestAnimationFrame(tick);
    }
    state.ringRAF = requestAnimationFrame(tick);
}

function cancelLongPress() {
    if (state.ringRAF) cancelAnimationFrame(state.ringRAF);
    state.ring?.remove();
    state.ring = null;
    state.ringStart = null;
    state.ringRAF = null;
}

function fireLongPress(x, y) {
    state.drag.longPressed = true;
    state.drag.active = false;
    state.pet.classList.remove("hh-grabbing");
    cancelLongPress();
    if (navigator.vibrate) try { navigator.vibrate([40, 30, 60]); } catch (_) {}
    togglePanel(x, y);
}

// ───────────────────────────── Drag / click / long-press ─────────────────────────────
function bindInputs() {
    const onDown = (e) => {
        unlockAudio();
        const ev = e.touches ? e.touches[0] : e;
        e.preventDefault();
        state.drag.active = true;
        state.drag.moved = false;
        state.drag.longPressed = false;
        state.drag.downAt = Date.now();
        const rect = state.pet.getBoundingClientRect();
        state.drag.ox = ev.clientX - rect.left;
        state.drag.oy = ev.clientY - rect.top;
        state.drag.sx = ev.clientX;
        state.drag.sy = ev.clientY;
        state.pet.classList.add("hh-grabbing");
        if (state.walkAnim) cancelAnimationFrame(state.walkAnim);
        state.pet.classList.remove("hh-walking");
        startLongPress();
    };
    const onMove = (e) => {
        if (!state.drag.active) return;
        const ev = e.touches ? e.touches[0] : e;
        const dx = ev.clientX - state.drag.sx;
        const dy = ev.clientY - state.drag.sy;
        if (!state.drag.moved && Math.hypot(dx, dy) > 8) {
            state.drag.moved = true;
            state.status = "dragging";
            cancelLongPress();
            sayQueued(pickOne(LINES.drag), "tense", 2500);
        }
        if (state.drag.moved) {
            state.x = ev.clientX - state.drag.ox;
            state.y = ev.clientY - state.drag.oy;
            applyTransform();
        }
    };
    const onUp = () => {
        cancelLongPress();
        if (state.drag.longPressed) {
            state.drag.longPressed = false;
            state.drag.active = false;
            return;
        }
        if (!state.drag.active) return;
        const wasClick = !state.drag.moved && Date.now() - state.drag.downAt < 350;
        state.drag.active = false;
        state.pet.classList.remove("hh-grabbing");
        if (wasClick) {
            handleClick();
        } else if (state.drag.moved) {
            state.status = "idle";
            const s = settings();
            s.posX = state.x;
            s.posY = state.y;
            save();
        } else {
            state.status = "idle";
        }
    };

    state.pet.addEventListener("mousedown", onDown);
    state.pet.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);

    state.pet.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        unlockAudio();
        cancelLongPress();
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
    if (state.clickStreak >= 6) { line = pickOne(LINES.clickSad); mood = "sad"; }
    else if (state.clickStreak >= 3) { line = pickOne(LINES.clickAngry); mood = "angry"; }
    else { line = pickOne(LINES.click); mood = "tense"; }

    state.queue.length = 0;
    state.queueRunning = false;
    sayQueued(line, mood, 2500);

    state.pet.classList.remove("hh-bounce");
    void state.pet.offsetWidth;
    state.pet.classList.add("hh-bounce");
}

// ───────────────────────────── Ham tag interception ─────────────────────────────
const HAM_RE = /<ham\s+mood=['"]([a-z_]+)['"]\s*>([\s\S]*?)<\/ham>/gi;

function processMessage(messageId) {
    const s = settings();
    if (!s.enabled || !s.interceptHam) return;
    const ctx = getContext();
    const msg = ctx?.chat?.[messageId];
    if (!msg || !msg.mes || msg.is_user) return;

    const matches = [...msg.mes.matchAll(HAM_RE)];
    if (!matches.length) return;

    if (s.hideRegexBubble) {
        const mesDom = document.querySelector(`.mes[mesid="${messageId}"] .mes_text`);
        if (mesDom) {
            mesDom.querySelectorAll("div").forEach(div => {
                if (/แฮมแฮม\s*·/.test(div.textContent || "")) div.style.display = "none";
            });
        }
    }
    for (const m of matches) {
        const mood = (m[1] || "normal").toLowerCase();
        const text = (m[2] || "").trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
        if (text) sayQueued(text, mood);
    }
}

// ───────────────────────────── Settings panel ─────────────────────────────
function togglePanel(x, y) {
    if (state.panel) { state.panel.remove(); state.panel = null; return; }
    const s = settings();
    const voices = loadVoices();
    const voiceOptions = voices.length
        ? `<option value="">🎲 อัตโนมัติ (เลือกเสียงไทยที่ดีที่สุด)</option>` +
          voices.map(v => {
              const isThai = /th/i.test(v.lang);
              const label = `${isThai ? "🇹🇭 " : ""}${v.name} (${v.lang})`;
              const safe = label.replace(/</g, "&lt;");
              return `<option value="${v.name.replace(/"/g, "&quot;")}" ${v.name===s.ttsVoice?"selected":""}>${safe}</option>`;
          }).join("")
        : `<option value="">⏳ กำลังโหลดเสียง... ลองปิด-เปิดเมนูใหม่</option>`;

    const p = document.createElement("div");
    p.id = "hh-panel";
    p.innerHTML = `
        <div class="hh-panel-title">🌸 แฮมๆ Buddy</div>

        <div class="hh-section">⚙️ ทั่วไป</div>
        <label class="hh-row"><span>เปิดใช้งาน</span><input type="checkbox" data-k="enabled" ${s.enabled?"checked":""}></label>
        <label class="hh-row"><span>ดักแท็ก &lt;ham&gt;</span><input type="checkbox" data-k="interceptHam" ${s.interceptHam?"checked":""}></label>
        <label class="hh-row"><span>ซ่อน bubble จาก regex</span><input type="checkbox" data-k="hideRegexBubble" ${s.hideRegexBubble?"checked":""}></label>
        <label class="hh-row"><span>หลบข้อความ</span><input type="checkbox" data-k="avoidChat" ${s.avoidChat?"checked":""}></label>
        <label class="hh-row"><span>พึมพำตอนว่าง</span><input type="checkbox" data-k="idleChatter" ${s.idleChatter?"checked":""}></label>
        <label class="hh-row"><span>ขนาด <span class="hh-val">${s.size}px</span></span><input type="range" min="48" max="160" step="4" data-k="size" value="${s.size}"></label>
        <label class="hh-row"><span>ช่วงเดิน <span class="hh-val">${s.walkInterval}s</span></span><input type="range" min="3" max="30" step="1" data-k="walkInterval" value="${s.walkInterval}"></label>

        <div class="hh-section">🎙️ เสียง</div>
        <label class="hh-row hh-col"><span>โหมดเสียง</span>
            <select data-k="voiceMode">
                <option value="tts" ${s.voiceMode==="tts"?"selected":""}>📢 พูดออกเสียง (TTS)</option>
                <option value="chitter" ${s.voiceMode==="chitter"?"selected":""}>🐹 เสียงปี๊ๆ (chitter)</option>
                <option value="off" ${s.voiceMode==="off"?"selected":""}>🔇 ปิดเสียง</option>
            </select>
        </label>
        <div class="hh-tts-block" style="display:${s.voiceMode==="tts"?"block":"none"}">
            <label class="hh-row hh-col"><span>เสียงพูด (เลือกได้!)</span>
                <select data-k="ttsVoice">${voiceOptions}</select>
            </label>
            <label class="hh-row"><span>เสียงสูงเพิ่ม <span class="hh-val">${s.ttsPitchBoost>=0?"+":""}${s.ttsPitchBoost.toFixed(2)}</span></span><input type="range" min="-50" max="25" step="5" data-k="ttsPitchBoost" value="${s.ttsPitchBoost*100}"></label>
            <label class="hh-row"><span>ความเร็ว <span class="hh-val">${s.ttsRate.toFixed(2)}x</span></span><input type="range" min="60" max="140" step="5" data-k="ttsRate" value="${s.ttsRate*100}"></label>
            <label class="hh-row"><span>ความดัง <span class="hh-val">${Math.round(s.ttsVolume*100)}%</span></span><input type="range" min="0" max="100" step="5" data-k="ttsVolume" value="${s.ttsVolume*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบเสียง</button>
        </div>
        <div class="hh-chitter-block" style="display:${s.voiceMode==="chitter"?"block":"none"}">
            <label class="hh-row"><span>ดังเสียงปี๊ <span class="hh-val">${Math.round(s.chitterVolume*100)}%</span></span><input type="range" min="0" max="50" step="2" data-k="chitterVolume" value="${s.chitterVolume*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบเสียง</button>
        </div>

        <div class="hh-section">✨ ลอง mood</div>
        <div class="hh-moods">
            ${Object.keys(SPRITES).map(m => `<button data-mood="${m}">${m}</button>`).join("")}
        </div>

        <button class="hh-close">ปิดเมนู</button>
    `;
    document.body.appendChild(p);
    state.panel = p;
    const px = clamp(x - 135, 8, window.innerWidth - 290);
    const py = clamp(y - 50, 8, window.innerHeight - 580);
    p.style.left = `${px}px`;
    p.style.top = `${py}px`;

    p.querySelectorAll("input, select").forEach(inp => {
        inp.addEventListener("change", () => {
            const k = inp.dataset.k;
            const cur = settings();
            if (inp.type === "checkbox") cur[k] = inp.checked;
            else if (inp.type === "range") {
                let v = parseFloat(inp.value);
                if (k === "ttsPitchBoost" || k === "ttsRate" || k === "ttsVolume" || k === "chitterVolume") v = v / 100;
                cur[k] = v;
                const valEl = inp.parentElement.querySelector(".hh-val");
                if (valEl) {
                    if (k === "size") valEl.textContent = `${v}px`;
                    else if (k === "walkInterval") valEl.textContent = `${v}s`;
                    else if (k === "ttsPitchBoost") valEl.textContent = `${v>=0?"+":""}${v.toFixed(2)}`;
                    else if (k === "ttsRate") valEl.textContent = `${v.toFixed(2)}x`;
                    else valEl.textContent = `${Math.round(v*100)}%`;
                }
                if (k === "size" && state.pet) {
                    state.pet.style.width = `${v}px`;
                    state.pet.style.height = `${v}px`;
                }
            } else if (inp.tagName === "SELECT") {
                cur[k] = inp.value;
                if (k === "voiceMode") {
                    p.querySelector(".hh-tts-block").style.display = cur[k] === "tts" ? "block" : "none";
                    p.querySelector(".hh-chitter-block").style.display = cur[k] === "chitter" ? "block" : "none";
                }
            }
            save();
            if (k === "enabled") {
                if (cur.enabled) { buildPet(); scheduleWalk(); }
                else destroyPet();
            }
        });
    });
    p.querySelectorAll(".hh-test-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            unlockAudio();
            const sample = pickOne(["สวัสดีค่า แฮมๆ มาแล้วน้า", "พี่จ๋า คิดถึงเลยน้า", "เย้! ได้ทดสอบเสียงแล้ว", "ทดสอบ ทดสอบ ฮัลโหลล!"]);
            setMood("happy");
            showBubble(sample, 3500);
            vocalize(sample, "happy");
        });
    });
    p.querySelectorAll("[data-mood]").forEach(b => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            unlockAudio();
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

    const unlocker = () => {
        unlockAudio();
        document.removeEventListener("click", unlocker);
        document.removeEventListener("touchstart", unlocker);
    };
    document.addEventListener("click", unlocker);
    document.addEventListener("touchstart", unlocker);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.walkTimer) clearTimeout(state.walkTimer);
        else scheduleWalk();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    setTimeout(boot, 400);
}
