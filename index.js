// 🌸 HamHam Buddy v2 — desktop pet for SillyTavern
// - Cute hamster chitter (Web Audio) instead of robotic TTS
// - Step-by-step walking animation (not floating)
// - Mali font, calmer blink, way more lines

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";

const MODULE = "HamHamBuddy";

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

// chitter pitch by mood (multiplier on base 700-1100 Hz)
const MOOD_PITCH = {
    happy: 1.45, wave: 1.35, curious: 1.20, normal: 1.00,
    nsfw: 1.05, scheming: 0.95, tense: 0.90, angry: 0.80, sad: 0.70,
};

// ───────────────────────────── Reaction lines (เยอะขึ้นเยอะ) ─────────────────────────────
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
        "จุ่บปากแบบเปาเปา 🤨",
        "เธอนี่นะ ขี้แกล้งง",
        "ก๊าก! ตกใจหมดเลย",
        "พี่นี่นะ ใจร้ายจังเลย ฮึ่ง",
        "เอ๊ะ ทำไมต้องจิ้มหนูด้วย!",
    ],
    clickAngry: [
        "พอได้แล้ว! 😡",
        "หนูจะกัดจริงๆ แล้วน้า!",
        "ไม่เล่นด้วยแล้ว! ฮึ่ง!",
        "แกล้งหนูพอแล้วน้า โกรธจริงน่ะ!",
        "พี่!! หนูจะร้องบอกแม่มุนะ!",
        "ใจร้ายมากเลยรู้มั้ย!! 😤",
        "ไม่ปั่นด้วยแล้ว ไปแล้ว ฮึ่ง!",
        "บอกแล้วไงว่าหยุด! ไม่ฟังเลย!",
    ],
    clickSad: [
        "หนูร้องไห้แล้วน้า... 🥺",
        "ทำไมแกล้งหนูตลอดเลยอ่ะ...",
        "หนูไปอยู่คนเดียวดีกว่า ฮึ่ก",
        "พี่ไม่รักหนูแล้วเหรอ... 😢",
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
        "หมุนๆ เวียนหัวแล้ววว 😵",
        "พี่จะพาหนูไปไหนเหรอ บ๊วยมั้ย? 🥺",
        "ระวังด้วยนะ หนูเปราะบาง!",
        "หนูร้องน้อยา ใครก็ได้ช่วยที!",
        "อ๊ายย ทำไมต้องลากด้วยอ่ะ",
    ],
    blocking: [
        "บังข้อความดีกว่าอิอิ ไม่เห็นแล้วว 🙈",
        "เห็นมั้ยคะ ไม่เห็นใช่ปะ ฮิๆ",
        "เธอไม่ต้องอ่าน หนูบังให้",
        "ตรงนี้ของหนูแล้วน้า",
        "อยากอ่านเหรอ ไล่หนูสิ ม่ายไป๊ 🤭",
        "นั่งทับดีก่า ฮิๆ",
        "ความลับของพี่ หนูเก็บให้ 🤫",
        "อย่าอ่านน้า อยู่กับหนูดีกว่า",
        "ทำตัวเป็นป้าย censor ฮิๆ",
        "หนูเป็น sticker บังข้อความน้า~",
        "ตรงนี้ของหนูจองแล้ว!",
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
        "อยากกินเมล็ดทานตะวัน 🌻",
        "ขนหนูฟูๆ น่ารักมั้ยคะ",
        "หาวๆ ง่วงๆ",
        "ฮัมเพลงนิดนึงน้า ลา ลา ลา~",
        "ใครเรียกหนูเหรอ?",
        "วันนี้พี่ดูเท่ดีน้า ฮิๆ",
        "หนูแก้มยุ้ย เพราะเก็บอาหารไว้ 🐹",
    ],
    greeting: [
        "ฮัลโหลล! แฮมๆ มาแล้วว 🌸",
        "พี่กลับมาแล้วเหรอ คิดถึงงง",
        "ว่าไง ว่าไง วันนี้เล่นอะไรกันดี",
        "เย้! ได้เจอพี่แล้ว 💕",
        "ตื่นแล้วน้าาา~",
        "วันนี้พร้อมแล้วค่า!",
        "ฮายยย พี่~ คิดถึงสุดๆ เลย",
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
    voiceMode: "chitter",  // "chitter" | "tts" | "off"
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
    drag: { active: false, moved: false, ox: 0, oy: 0, downAt: 0, sx: 0, sy: 0 },
    clickStreak: 0,
    clickResetTimer: null,
    audioCtx: null,
    audioUnlocked: false,
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

// ───────────────────────────── Audio: cute hamster chitter ─────────────────────────────
function getAudio() {
    if (!state.audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        state.audioCtx = new Ctx();
    }
    return state.audioCtx;
}
// iOS/Chrome require user-gesture to start AudioContext
function unlockAudio() {
    if (state.audioUnlocked) return;
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    state.audioUnlocked = true;
}

function chitter(text, mood = "normal") {
    const s = settings();
    if (s.voiceMode !== "chitter") return;
    const ctx = getAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        // try to resume; if not unlocked yet, just bail
        ctx.resume();
        if (ctx.state === "suspended") return;
    }

    // syllable count from text length (Thai chars ~ 1 syllable per 2 chars on average)
    const syllables = clamp(Math.floor((text || "").length / 2.2), 2, 14);
    const moodPitch = MOOD_PITCH[mood] || 1.0;
    const vol = s.chitterVolume;

    const now = ctx.currentTime;
    const interval = 0.11; // sec between blips

    for (let i = 0; i < syllables; i++) {
        const t = now + i * interval;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // triangle = soft, squeaky
        osc.type = "triangle";

        // Each syllable: pitch wobble so it sounds organic, not mechanical
        const basePitch = (700 + Math.random() * 400) * moodPitch;
        // tone shape: rises slightly then falls, like a real squeak
        osc.frequency.setValueAtTime(basePitch * 0.85, t);
        osc.frequency.linearRampToValueAtTime(basePitch * 1.08, t + 0.025);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.7, t + 0.09);

        // mild lowpass for warmth
        filter.type = "lowpass";
        filter.frequency.value = 3200;
        filter.Q.value = 1.0;

        // ADSR — fast attack, fast decay
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }
}

// fallback: TTS (only if user chose it)
function speakTTS(text) {
    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices() || [];
        const thai = voices.find(v => /th/i.test(v.lang) || /thai/i.test(v.name));
        if (thai) u.voice = thai;
        u.rate = 1.05; u.pitch = 1.6; u.volume = 0.6;
        window.speechSynthesis.speak(u);
    } catch (_) { /* noop */ }
}

function vocalize(text, mood) {
    const s = settings();
    if (s.voiceMode === "off") return;
    if (s.voiceMode === "tts") return speakTTS(text);
    return chitter(text, mood);
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
    state.pet?.remove();
    state.bubble?.remove();
    state.pet = null;
    state.bubble = null;
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
    let bx = state.x + s.size / 2;
    let by = state.y - 8;
    state.bubble.style.left = `${bx}px`;
    state.bubble.style.top = `${by}px`;
    if (state.y < 90) {
        state.bubble.classList.add("hh-bubble-below");
        state.bubble.style.top = `${state.y + s.size + 8}px`;
    } else {
        state.bubble.classList.remove("hh-bubble-below");
    }
}

// ───────────────────────────── Mood ─────────────────────────────
function setMood(mood) {
    if (!SPRITES[mood]) mood = "normal";
    state.mood = mood;
    if (!state.pet) return;
    const sprites = state.pet.querySelectorAll(".hh-sprite");
    // gentle crossfade by reusing blink anim — just swap src
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
    // settle back to normal mood after a beat (so pet doesn't stay angry forever)
    setTimeout(() => { if (state.status === "idle") setMood("normal"); }, 400);
}

// ───────────────────────────── Walking — step-by-step animation ─────────────────────────────
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

    // walk speed 75 px/s — feels like real walking
    const speed = 75;
    const dur = durMs ?? clamp((dist / speed) * 1000, 800, 6000);

    state.status = "walking";
    state.pet.classList.add("hh-walking");

    const startTs = performance.now();
    function step(now) {
        const t = clamp((now - startTs) / dur, 0, 1);
        // ease in-out so it accelerates and decelerates naturally
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

// ───────────────────────────── Drag / click ─────────────────────────────
function bindInputs() {
    const onDown = (e) => {
        unlockAudio(); // unlock on first user interaction
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
        // cancel any walk
        if (state.walkAnim) cancelAnimationFrame(state.walkAnim);
        state.pet.classList.remove("hh-walking");
    };
    const onMove = (e) => {
        if (!state.drag.active) return;
        const ev = e.touches ? e.touches[0] : e;
        const dx = ev.clientX - state.drag.sx;
        const dy = ev.clientY - state.drag.sy;
        if (!state.drag.moved && Math.hypot(dx, dy) > 5) {
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
        unlockAudio();
        togglePanel(e.clientX, e.clientY);
    });

    // long-press for mobile (open panel)
    let longPress;
    state.pet.addEventListener("touchstart", (e) => {
        longPress = setTimeout(() => {
            const t = e.touches[0];
            togglePanel(t.clientX, t.clientY);
        }, 700);
    }, { passive: true });
    state.pet.addEventListener("touchend", () => clearTimeout(longPress));
    state.pet.addEventListener("touchmove", () => clearTimeout(longPress));

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
                if (/แฮมแฮม\s*·/.test(div.textContent || "")) {
                    div.style.display = "none";
                }
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
    const p = document.createElement("div");
    p.id = "hh-panel";
    p.innerHTML = `
        <div class="hh-panel-title">🌸 แฮมๆ Buddy</div>
        <label class="hh-row"><span>เปิดใช้งาน</span><input type="checkbox" data-k="enabled" ${s.enabled?"checked":""}></label>
        <label class="hh-row"><span>ดักแท็ก &lt;ham&gt;</span><input type="checkbox" data-k="interceptHam" ${s.interceptHam?"checked":""}></label>
        <label class="hh-row"><span>ซ่อน bubble จาก regex</span><input type="checkbox" data-k="hideRegexBubble" ${s.hideRegexBubble?"checked":""}></label>
        <label class="hh-row"><span>หลบข้อความ</span><input type="checkbox" data-k="avoidChat" ${s.avoidChat?"checked":""}></label>
        <label class="hh-row"><span>พึมพำตอนว่าง</span><input type="checkbox" data-k="idleChatter" ${s.idleChatter?"checked":""}></label>
        <label class="hh-row hh-col"><span>เสียง</span>
            <select data-k="voiceMode">
                <option value="chitter" ${s.voiceMode==="chitter"?"selected":""}>🐹 เสียงแฮม (ปี๊ๆ)</option>
                <option value="tts" ${s.voiceMode==="tts"?"selected":""}>📢 อ่านออกเสียง (TTS)</option>
                <option value="off" ${s.voiceMode==="off"?"selected":""}>🔇 ปิดเสียง</option>
            </select>
        </label>
        <label class="hh-row"><span>เสียงดัง <span class="hh-val">${Math.round(s.chitterVolume*100)}%</span></span><input type="range" min="0" max="50" step="2" data-k="chitterVolume" value="${s.chitterVolume*100}"></label>
        <label class="hh-row"><span>ขนาด <span class="hh-val">${s.size}px</span></span><input type="range" min="48" max="160" step="4" data-k="size" value="${s.size}"></label>
        <label class="hh-row"><span>ช่วงเดิน <span class="hh-val">${s.walkInterval}s</span></span><input type="range" min="3" max="30" step="1" data-k="walkInterval" value="${s.walkInterval}"></label>
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
    const py = clamp(y, 8, window.innerHeight - 460);
    p.style.left = `${px}px`;
    p.style.top = `${py}px`;

    p.querySelectorAll("input, select").forEach(inp => {
        inp.addEventListener("change", () => {
            const k = inp.dataset.k;
            const cur = settings();
            if (inp.type === "checkbox") cur[k] = inp.checked;
            else if (inp.type === "range") {
                let v = parseInt(inp.value, 10);
                if (k === "chitterVolume") v = v / 100;
                cur[k] = v;
                const valEl = inp.parentElement.querySelector(".hh-val");
                if (valEl) {
                    if (k === "chitterVolume") valEl.textContent = `${Math.round(v*100)}%`;
                    else if (k === "size") valEl.textContent = `${v}px`;
                    else if (k === "walkInterval") valEl.textContent = `${v}s`;
                }
                if (k === "size" && state.pet) {
                    state.pet.style.width = `${v}px`;
                    state.pet.style.height = `${v}px`;
                }
            } else if (inp.tagName === "SELECT") {
                cur[k] = inp.value;
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

    // unlock audio on any first interaction with the page
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
