// 🌸 HamHam Buddy v6
// - Removed "wave" mood
// - Rock-Paper-Scissors mini-game on 3 rapid clicks (with cute knockout/celebrate animations)
// - X close button on settings popup

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";

const MODULE = "HamHamBuddy";
const LONG_PRESS_MS = 5000;

// ───────────────────────────── Sprite map (no wave) ─────────────────────────────
const SPRITES = {
    normal:   ["https://i.postimg.cc/Z5YwyMGd/1000040832_removebg_preview.png", "https://i.postimg.cc/vHtPTsN4/1000040824_removebg_preview.png"],
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
    happy:    { border: "#dcb630", bg: "#fff9e0" },
    angry:    { border: "#da5864", bg: "#ffeef0" },
    tense:    { border: "#986ce4", bg: "#f4ecff" },
    curious:  { border: "#30bc98", bg: "#e8faf3" },
    scheming: { border: "#c060d8", bg: "#faecff" },
    sad:      { border: "#7090c8", bg: "#eef2fa" },
    nsfw:     { border: "#d7789b", bg: "#fff0f5" },
};

const MOOD_TTS = {
    happy:    { pitch: 2.0,  rate: 1.05 },
    curious:  { pitch: 1.85, rate: 1.0 },
    normal:   { pitch: 1.75, rate: 0.97 },
    nsfw:     { pitch: 1.7,  rate: 0.93 },
    scheming: { pitch: 1.6,  rate: 0.95 },
    tense:    { pitch: 1.7,  rate: 1.05 },
    angry:    { pitch: 1.55, rate: 1.15 },
    sad:      { pitch: 1.35, rate: 0.85 },
};

const MOOD_ELEVEN = {
    happy:    { stability: 0.30, similarity_boost: 0.75, style: 0.65 },
    curious:  { stability: 0.40, similarity_boost: 0.75, style: 0.45 },
    normal:   { stability: 0.50, similarity_boost: 0.75, style: 0.30 },
    nsfw:     { stability: 0.45, similarity_boost: 0.80, style: 0.40 },
    scheming: { stability: 0.40, similarity_boost: 0.75, style: 0.50 },
    tense:    { stability: 0.30, similarity_boost: 0.75, style: 0.60 },
    angry:    { stability: 0.25, similarity_boost: 0.70, style: 0.75 },
    sad:      { stability: 0.45, similarity_boost: 0.80, style: 0.40 },
};

// ───────────────────────────── Lines ─────────────────────────────
const LINES = {
    click: [
        "โอ้ย ทำหนูทำไมเนี่ย",
        "อย่าจิ้มสิคะ เจ็บนะ",
        "ฮึ่ง แกล้งหนูตลอดเลย",
        "พอแล้ว ตัวเล็กๆ จะแตกแล้วน้า",
        "หยุดนะ ไม่หยุดร้องนะ",
        "อ๊ายย จิ้มอะไรของเธอ",
        "นิ้วใหญ่จัง น่ากลัวอ่ะ",
        "อย่าน้าาา หนูตัวบาง",
        "หนูบอกแล้วไงว่าอย่าจิ้ม",
        "เธอนี่นะ ขี้แกล้งจังเลย",
        "ก๊าก ตกใจหมดเลย",
        "พี่นี่นะ ใจร้ายจังเลย ฮึ่ง",
        "ทำไมต้องจิ้มหนูด้วยอ่ะ",
    ],
    clickAngry: [
        "พอได้แล้ว",
        "หนูจะกัดจริงๆ แล้วน้า",
        "ไม่เล่นด้วยแล้ว ฮึ่ง",
        "แกล้งหนูพอแล้ว โกรธจริงนะ",
        "พี่ หนูจะร้องบอกแม่มุนะ",
        "ใจร้ายมากเลยรู้มั้ย",
        "ไม่ปั่นด้วยแล้ว ไปแล้ว ฮึ่ง",
    ],
    clickSad: [
        "หนูร้องไห้แล้วน้า",
        "ทำไมแกล้งหนูตลอดเลยอ่ะ",
        "หนูไปอยู่คนเดียวดีกว่า",
        "พี่ไม่รักหนูแล้วเหรอ",
        "หนูเจ็บจริงๆ น้า",
    ],
    drag: [
        "พี่จะมาลากหนูไปไหน ฟ้องแม่มุแน่",
        "วางหนูลงนะ ตกใจหมดแล้ว",
        "อ๊ายย หล่นแล้วๆ",
        "หนูไม่ใช่ของเล่นน้า",
        "อุ๊ย ขนยุ่งเลย",
        "บินได้เหรอเนี่ย น่ากลัวจัง",
        "ปล่อยหนูสิ ปล่อยน้า",
        "พี่หิ้วหนูแบบไม่บอกก่อน รุนแรงเลย",
        "หมุนๆ เวียนหัวแล้ว",
        "พี่จะพาหนูไปไหนเหรอ ไปกินบ๊วยมั้ย",
        "ระวังด้วยนะ หนูเปราะบาง",
        "ใครก็ได้ช่วยหนูที",
    ],
    blocking: [
        "บังข้อความดีกว่า อิอิ ไม่เห็นแล้ว",
        "เห็นมั้ยคะ ไม่เห็นใช่ปะ ฮิๆ",
        "เธอไม่ต้องอ่าน หนูบังให้",
        "ตรงนี้ของหนูแล้วน้า",
        "อยากอ่านเหรอ ไล่หนูสิ ไม่ไป",
        "นั่งทับดีกว่า ฮิๆ",
        "ความลับของพี่ หนูเก็บให้",
        "อย่าอ่านน้า อยู่กับหนูดีกว่า",
        "ทำตัวเป็นป้ายเซ็นเซอร์ ฮิๆ",
        "หนูเป็นสติกเกอร์บังข้อความน้า",
        "ตรงนี้ของหนูจองแล้ว",
    ],
    idle: [
        "หิวจังเลย",
        "เย้ๆ ว่างเลย",
        "ง่วงนอนนน",
        "บ๊วยอยู่ไหนนะ",
        "วันนี้อากาศดีจัง",
        "เดี๋ยวต้องไปกินขนม",
        "แม่มุๆ คิดถึงจัง",
        "เบื่อจัง ทำไรดีน้า",
        "อยากกินเมล็ดทานตะวัน",
        "ขนหนูฟูๆ น่ารักมั้ยคะ",
        "หาวๆ ง่วงๆ",
        "ฮัมเพลงนิดนึงน้า ลา ลา ลา",
        "ใครเรียกหนูเหรอ",
        "วันนี้พี่ดูเท่ดีน้า ฮิๆ",
        "หนูแก้มยุ้ย เพราะเก็บอาหารไว้",
    ],
    greeting: [
        "ฮัลโหลล แฮม แฮม มาแล้ว",
        "พี่กลับมาแล้วเหรอ คิดถึงงง",
        "ว่าไง ว่าไง วันนี้เล่นอะไรกันดี",
        "เย้ ได้เจอพี่แล้ว",
        "ตื่นแล้วน้าาา",
        "วันนี้พร้อมแล้วค่า",
    ],
};

// RPS lines
const RPS_CHALLENGE = [
    "อ๊ะ กล้าจิ้มหนูเหรอ เป่ายิงฉุบเลย!",
    "หนูท้า! เป่ายิงฉุบ พี่กล้าไหม",
    "อ้าว มาแบบนี้เลย เป่ายิงฉุบเลยยย",
    "หนูจะเอาคืน เป่ายิงฉุบกัน",
];
const RPS_HAM_WIN = [
    "เย่! ${name} จะชนะเค้า ไปเรียนอนุบาลใหม่ไปป!",
    "ฮ่าๆ ${name} แพ้แล้ว! ไปเรียนอนุบาลก่อนนะ",
    "หนูชนะแล้วววว ${name} แพ้สุดๆ",
    "${name} เป่ายิงฉุบไม่เก่งเลย แพ้แฮมตัวเล็กๆ",
    "เห็นมั้ย หนูเก่งกว่า ${name} เลย!",
];
const RPS_USER_WIN = [
    "น็อกเอ้าท์แล้ว... จุก...",
    "อ้าาา หนูแพ้... จุกๆ...",
    "อึ๋ย ยอมแพ้แล้ว...",
    "หนูพลาดดด ตาตาาา",
    "หนูล้มแล้ว... ลุกไม่ขึ้น...",
];
const RPS_TIE = [
    "เอ๊ะ ออกเหมือนกัน เสมอ!",
    "เสมอแล้ว ลองใหม่มั้ย",
    "เป่าใหม่ๆ ยังไม่จบ!",
];

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
    voiceMode: "off",
    ttsVoice: "",
    ttsPitchBoost: 0,
    ttsRate: 1.0,
    ttsVolume: 0.85,
    elKey: "",
    elVoiceId: "",
    elModelId: "eleven_multilingual_v2",
    elVoices: [],
    customAudio: {},
};

// ───────────────────────────── State ─────────────────────────────
const state = {
    pet: null,
    bubble: null,
    panel: null,
    rpsModal: null,
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
    audioUnlocked: false,
    ring: null,
    ringStart: null,
    ringRAF: null,
    currentAudio: null,
    rpsActive: false,
};

const audioCache = new Map();

// ───────────────────────────── Utils ─────────────────────────────
const pickOne = (arr) => arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

function settings() {
    if (!extension_settings[MODULE]) extension_settings[MODULE] = structuredClone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) {
        if (extension_settings[MODULE][k] === undefined) extension_settings[MODULE][k] = DEFAULTS[k];
    }
    return extension_settings[MODULE];
}
function save() { saveSettingsDebounced(); }

function preprocessText(text) {
    return (text || "")
        .replace(/แฮมๆ/g, "แฮม แฮม")
        .replace(/ฮิๆ/g, "ฮิ ฮิ")
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

function unlockAudio() {
    if (state.audioUnlocked) return;
    if (window.speechSynthesis) {
        try {
            const u = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(u);
        } catch (_) {}
    }
    state.audioUnlocked = true;
}

// ───────────────────────────── Browser TTS ─────────────────────────────
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
    return [...voices].sort((a, b) => score(b) - score(a))[0] || null;
}

function speakTTS(text, mood) {
    return new Promise(resolve => {
        if (!window.speechSynthesis) return resolve();
        try {
            window.speechSynthesis.cancel();
            const cleaned = preprocessText(text);
            if (!cleaned) return resolve();
            const u = new SpeechSynthesisUtterance(cleaned);
            const v = pickBestVoice();
            if (v) { u.voice = v; u.lang = v.lang; }
            const s = settings();
            const m = MOOD_TTS[mood] || MOOD_TTS.normal;
            u.pitch = clamp(m.pitch + (s.ttsPitchBoost || 0), 0.1, 2.0);
            u.rate = clamp(m.rate * (s.ttsRate || 1.0), 0.5, 2.0);
            u.volume = s.ttsVolume ?? 0.85;
            u.onend = () => resolve();
            u.onerror = () => resolve();
            window.speechSynthesis.speak(u);
            setTimeout(resolve, 30000);
        } catch (_) { resolve(); }
    });
}

// ───────────────────────────── ElevenLabs ─────────────────────────────
function trimAudioCache(maxSize = 100) {
    while (audioCache.size > maxSize) {
        const firstKey = audioCache.keys().next().value;
        const url = audioCache.get(firstKey);
        try { URL.revokeObjectURL(url); } catch (_) {}
        audioCache.delete(firstKey);
    }
}

function playAudioUrl(url, volume = 0.85) {
    return new Promise(resolve => {
        if (state.currentAudio) {
            try { state.currentAudio.pause(); } catch (_) {}
        }
        const audio = new Audio(url);
        audio.volume = volume;
        state.currentAudio = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
        setTimeout(resolve, 30000);
    });
}

async function speakElevenLabs(text, mood) {
    const s = settings();
    if (!s.elKey || !s.elVoiceId) return speakTTS(text, mood);
    const cleaned = preprocessText(text);
    if (!cleaned) return;
    const cacheKey = `${s.elVoiceId}::${s.elModelId}::${mood}::${cleaned}`;
    if (audioCache.has(cacheKey)) {
        return playAudioUrl(audioCache.get(cacheKey), s.ttsVolume ?? 0.85);
    }
    try {
        const settingsBody = MOOD_ELEVEN[mood] || MOOD_ELEVEN.normal;
        const r = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${s.elVoiceId}?output_format=mp3_44100_128`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": s.elKey,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                body: JSON.stringify({
                    text: cleaned,
                    model_id: s.elModelId || "eleven_multilingual_v2",
                    voice_settings: {
                        stability: settingsBody.stability,
                        similarity_boost: settingsBody.similarity_boost,
                        style: settingsBody.style,
                        use_speaker_boost: true,
                    },
                }),
            }
        );
        if (!r.ok) {
            console.warn(`[HamHam] ElevenLabs ${r.status}`);
            return speakTTS(text, mood);
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        audioCache.set(cacheKey, url);
        trimAudioCache();
        return playAudioUrl(url, s.ttsVolume ?? 0.85);
    } catch (err) {
        console.warn("[HamHam] ElevenLabs error", err);
        return speakTTS(text, mood);
    }
}

async function fetchElevenVoices(apiKey) {
    if (!apiKey) return [];
    try {
        const r = await fetch("https://api.elevenlabs.io/v1/voices", {
            headers: { "xi-api-key": apiKey },
        });
        if (!r.ok) return [];
        const data = await r.json();
        return (data.voices || []).map(v => ({ voice_id: v.voice_id, name: v.name, category: v.category }));
    } catch (_) { return []; }
}

// ───────────────────────────── Custom audio ─────────────────────────────
async function speakCustomAudio(text, mood, category) {
    const s = settings();
    const map = s.customAudio || {};
    let urls = null;
    if (category && Array.isArray(map[category])) urls = map[category];
    else if (Array.isArray(map.hamFallback)) urls = map.hamFallback;
    const url = pickOne(urls);
    if (!url) return;
    return playAudioUrl(url, s.ttsVolume ?? 0.85);
}

async function vocalize(text, mood, category) {
    const s = settings();
    if (s.voiceMode === "off") return;
    if (s.voiceMode === "elevenlabs") return speakElevenLabs(text, mood);
    if (s.voiceMode === "custom") return speakCustomAudio(text, mood, category);
    if (s.voiceMode === "tts") return speakTTS(text, mood);
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
        if (state.status === "idle") sayQueued(pickOne(LINES.greeting), "happy", "greeting");
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
    state.rpsModal?.remove();
    state.pet = null;
    state.bubble = null;
    state.panel = null;
    state.rpsModal = null;
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

function showBubble(text) {
    if (!state.bubble) return;
    if (state.bubbleTimer) { clearTimeout(state.bubbleTimer); state.bubbleTimer = null; }
    state.bubble.textContent = text;
    state.bubble.classList.add("hh-visible");
    positionBubble();
}

function hideBubble() {
    if (!state.bubble) return;
    if (state.bubbleTimer) { clearTimeout(state.bubbleTimer); state.bubbleTimer = null; }
    state.bubble.classList.remove("hh-visible");
}

function sayQueued(text, mood = "normal", category = null) {
    if (!text) return;
    state.queue.push({ text, mood, category });
    if (!state.queueRunning) runQueue();
}

function readingTime(text) {
    const len = (text || "").length;
    return clamp(2500 + len * 90, 3000, 18000);
}

async function runQueue() {
    if (state.queueRunning) return;
    state.queueRunning = true;
    try {
        while (state.queue.length) {
            const item = state.queue.shift();
            setMood(item.mood);
            showBubble(item.text);
            state.status = "talking";
            const minWait = new Promise(r => setTimeout(r, readingTime(item.text)));
            const speech = vocalize(item.text, item.mood, item.category) || Promise.resolve();
            await Promise.all([minWait, speech]);
            hideBubble();
            await new Promise(r => setTimeout(r, 250));
        }
    } finally {
        state.queueRunning = false;
        state.status = "idle";
        setTimeout(() => { if (state.status === "idle" && !state.rpsActive) setMood("normal"); }, 400);
    }
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
    const speed = 65;
    const dur = durMs ?? clamp((dist / speed) * 1000, 1000, 6000);
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
        if (state.status === "idle" && !state.rpsActive) doRandomWalk();
        scheduleWalk();
        if (s.idleChatter && Math.random() < 0.25 && state.status === "idle" && !state.rpsActive) {
            sayQueued(pickOne(LINES.idle), "normal", "idle");
        }
        if (s.avoidChat && !state.rpsActive) maybeAvoidChat();
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
    sayQueued(pickOne(LINES.blocking), "scheming", "blocking");
    const s = settings();
    const goLeft = a.left > window.innerWidth / 2;
    const targetX = goLeft ? 30 : window.innerWidth - s.size - 30;
    const targetY = clamp(state.y + (Math.random() * 80 - 40), 50, window.innerHeight * 0.4);
    setTimeout(() => moveTo(targetX, targetY), 900);
}

// ───────────────────────────── Long-press ─────────────────────────────
function startLongPress() {
    cancelLongPress();
    state.ringStart = performance.now();
    const s = settings();
    const ringSize = s.size + 24;
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
        if (state.rpsActive) return; // ignore inputs during RPS
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
            sayQueued(pickOne(LINES.drag), "tense", "drag");
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
        if (state.rpsActive) return;
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
    if (state.rpsActive) return;
    state.clickStreak++;
    if (state.clickResetTimer) clearTimeout(state.clickResetTimer);
    state.clickResetTimer = setTimeout(() => state.clickStreak = 0, 2200);

    // 3 rapid clicks → trigger RPS game!
    if (state.clickStreak === 3) {
        triggerRPSGame();
        return;
    }

    let line, mood, category;
    if (state.clickStreak >= 7) { line = pickOne(LINES.clickSad); mood = "sad"; category = "clickSad"; }
    else if (state.clickStreak >= 5) { line = pickOne(LINES.clickAngry); mood = "angry"; category = "clickAngry"; }
    else { line = pickOne(LINES.click); mood = "tense"; category = "click"; }

    if (state.queue.length > 1) state.queue.length = 1;
    sayQueued(line, mood, category);
    state.pet.classList.remove("hh-bounce");
    void state.pet.offsetWidth;
    state.pet.classList.add("hh-bounce");
}

// ───────────────────────────── Rock-Paper-Scissors mini-game ─────────────────────────────
function triggerRPSGame() {
    if (state.rpsActive) return;
    state.rpsActive = true;
    state.clickStreak = 0;
    state.queue.length = 0;
    state.queueRunning = false;
    if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (_) {}
    if (state.currentAudio) try { state.currentAudio.pause(); } catch (_) {}
    state.pet.classList.remove("hh-bounce", "hh-knockout", "hh-celebrate");

    sayQueued(pickOne(RPS_CHALLENGE), "scheming", "click");
    setTimeout(() => showRPSUI(), 1800);
}

function showRPSUI() {
    if (!state.rpsActive) return;
    if (state.rpsModal) { state.rpsModal.remove(); state.rpsModal = null; }
    const rps = document.createElement("div");
    rps.id = "hh-rps";
    rps.innerHTML = `
        <div class="hh-rps-card">
            <div class="hh-rps-title">เป่า ยิง ฉุบ!</div>
            <div class="hh-rps-subtitle">เลือกเลย ใครแพ้ยอม~</div>
            <div class="hh-rps-buttons">
                <button data-c="rock"><span class="hh-rps-emoji">✊</span><span class="hh-rps-label">ค้อน</span></button>
                <button data-c="paper"><span class="hh-rps-emoji">✋</span><span class="hh-rps-label">กระดาษ</span></button>
                <button data-c="scissors"><span class="hh-rps-emoji">✌️</span><span class="hh-rps-label">กรรไกร</span></button>
            </div>
        </div>
    `;
    document.body.appendChild(rps);
    state.rpsModal = rps;
    rps.querySelectorAll("button[data-c]").forEach(b => {
        b.addEventListener("click", () => {
            const userPick = b.dataset.c;
            const hamPick = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];
            revealRPS(rps, hamPick, userPick);
        });
    });
}

function determineRPS(user, ham) {
    if (user === ham) return "tie";
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
    return beats[user] === ham ? "user" : "ham";
}

function revealRPS(container, hamPick, userPick) {
    const emoji = { rock: "✊", paper: "✋", scissors: "✌️" };
    const card = container.querySelector(".hh-rps-card");
    const result = determineRPS(userPick, hamPick);
    card.innerHTML = `
        <div class="hh-rps-vs">
            <div class="hh-rps-side">
                <div class="hh-rps-side-label">แฮม</div>
                <div class="hh-rps-side-emoji hh-rps-shake">${emoji[hamPick]}</div>
            </div>
            <div class="hh-rps-vs-text">VS</div>
            <div class="hh-rps-side">
                <div class="hh-rps-side-label">เธอ</div>
                <div class="hh-rps-side-emoji hh-rps-shake">${emoji[userPick]}</div>
            </div>
        </div>
        <div class="hh-rps-result hh-rps-result-${result}">
            ${result === "user" ? "พี่ชนะ!" : result === "ham" ? "หนูชนะ!" : "เสมอ!"}
        </div>
    `;
    setTimeout(() => {
        container.remove();
        state.rpsModal = null;
        finishRPS(result);
    }, 2200);
}

function finishRPS(result) {
    const ctx = getContext?.();
    const userName = (ctx?.name1 || "พี่").toString().trim() || "พี่";
    state.queue.length = 0;
    state.queueRunning = false;

    if (result === "user") {
        // Ham loses → knockout!
        state.pet.classList.remove("hh-bounce", "hh-celebrate");
        state.pet.classList.add("hh-knockout");
        setMood("sad");
        sayQueued(pickOne(RPS_USER_WIN), "sad", "click");
        setTimeout(() => {
            state.pet?.classList.remove("hh-knockout");
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 5500);
    } else if (result === "ham") {
        // Ham wins → celebrate!
        state.pet.classList.remove("hh-bounce", "hh-knockout");
        state.pet.classList.add("hh-celebrate");
        setMood("happy");
        const line = pickOne(RPS_HAM_WIN).replace(/\$\{name\}/g, userName);
        sayQueued(line, "happy", "click");
        setTimeout(() => {
            state.pet?.classList.remove("hh-celebrate");
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 4500);
    } else {
        // Tie
        sayQueued(pickOne(RPS_TIE), "curious", "click");
        setTimeout(() => {
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 3000);
    }
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
        // Map removed "wave" mood to "happy" so old cards keep working
        let mood = (m[1] || "normal").toLowerCase();
        if (mood === "wave") mood = "happy";
        const text = (m[2] || "").trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
        if (text) sayQueued(text, mood, "hamFallback");
    }
}

// ───────────────────────────── Settings panel ─────────────────────────────
function togglePanel(x, y) {
    if (state.panel) { state.panel.remove(); state.panel = null; return; }
    const s = settings();
    const voices = loadVoices();
    const voiceOptions = voices.length
        ? `<option value="">🎲 อัตโนมัติ</option>` +
          voices.map(v => {
              const isThai = /th/i.test(v.lang);
              const label = `${isThai ? "🇹🇭 " : ""}${v.name} (${v.lang})`;
              const safe = label.replace(/</g, "&lt;");
              return `<option value="${v.name.replace(/"/g, "&quot;")}" ${v.name===s.ttsVoice?"selected":""}>${safe}</option>`;
          }).join("")
        : `<option value="">⏳ กำลังโหลดเสียง... ลองปิด-เปิดเมนูใหม่</option>`;

    const elVoiceOptions = (s.elVoices || []).length
        ? `<option value="">— เลือก voice —</option>` +
          s.elVoices.map(v => `<option value="${v.voice_id}" ${v.voice_id===s.elVoiceId?"selected":""}>${v.name} (${v.category||""})</option>`).join("")
        : `<option value="">${s.elVoiceId ? `(ใช้: ${s.elVoiceId.slice(0,8)}...)` : "ยังไม่ได้โหลดรายการ"}</option>`;

    const customAudioJson = JSON.stringify(s.customAudio || {}, null, 2);

    const p = document.createElement("div");
    p.id = "hh-panel";
    p.innerHTML = `
        <button class="hh-x-close" aria-label="ปิด">✕</button>
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
                <option value="off" ${s.voiceMode==="off"?"selected":""}>🔇 ปิดเสียง (แนะนำ)</option>
                <option value="elevenlabs" ${s.voiceMode==="elevenlabs"?"selected":""}>✨ ElevenLabs</option>
                <option value="custom" ${s.voiceMode==="custom"?"selected":""}>📼 อัดเสียงเอง (MP3 URL)</option>
                <option value="tts" ${s.voiceMode==="tts"?"selected":""}>📢 Browser TTS (หุ่นยนต์)</option>
            </select>
        </label>
        <div class="hh-info" data-show="off" style="display:${s.voiceMode==="off"?"block":"none"}">
            ✨ Default ปิดเสียง เพราะเบราเซอร์ไม่มีเสียงน่ารักจริงๆ
        </div>

        <div class="hh-eleven-block" style="display:${s.voiceMode==="elevenlabs"?"block":"none"}">
            <div class="hh-info">
                📌 สมัครฟรีที่ <a href="https://elevenlabs.io" target="_blank">elevenlabs.io</a><br>
                Profile → API Keys → Create<br>
                Voice Lab → Instant Voice Clone (อัด 1-5 นาที)<br>
                💰 ฟรี 10 นาที/เดือน
            </div>
            <label class="hh-row hh-col"><span>API Key</span>
                <input type="password" data-k="elKey" value="${s.elKey || ""}" placeholder="sk_...">
            </label>
            <button class="hh-fetch-voices">🔄 ดึงรายการ voices</button>
            <label class="hh-row hh-col"><span>เลือก Voice</span>
                <select data-k="elVoiceId">${elVoiceOptions}</select>
            </label>
            <label class="hh-row hh-col"><span>หรือใส่ Voice ID เอง</span>
                <input type="text" data-k="elVoiceIdManual" value="${s.elVoiceId || ""}" placeholder="21m00Tcm4TlvDq8ikWAM">
            </label>
            <label class="hh-row hh-col"><span>โมเดล</span>
                <select data-k="elModelId">
                    <option value="eleven_multilingual_v2" ${s.elModelId==="eleven_multilingual_v2"?"selected":""}>Multilingual v2</option>
                    <option value="eleven_turbo_v2_5" ${s.elModelId==="eleven_turbo_v2_5"?"selected":""}>Turbo v2.5</option>
                    <option value="eleven_flash_v2_5" ${s.elModelId==="eleven_flash_v2_5"?"selected":""}>Flash v2.5</option>
                </select>
            </label>
            <label class="hh-row"><span>ความดัง <span class="hh-val">${Math.round(s.ttsVolume*100)}%</span></span><input type="range" min="0" max="100" step="5" data-k="ttsVolume" value="${s.ttsVolume*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบเสียง</button>
        </div>

        <div class="hh-custom-block" style="display:${s.voiceMode==="custom"?"block":"none"}">
            <div class="hh-info">
                📼 อัดเสียงตัวเอง upload เป็น MP3 → ใส่ JSON ตามรูปแบบ<br>
                หมวด: <code>click, clickAngry, clickSad, drag, blocking, idle, greeting, hamFallback</code>
            </div>
            <label class="hh-row hh-col"><span>JSON Audio Map</span>
                <textarea data-k="customAudio" rows="8" placeholder='{"click":["https://.../click1.mp3"]}'>${customAudioJson === "{}" ? "" : customAudioJson}</textarea>
            </label>
            <label class="hh-row"><span>ความดัง <span class="hh-val">${Math.round(s.ttsVolume*100)}%</span></span><input type="range" min="0" max="100" step="5" data-k="ttsVolume" value="${s.ttsVolume*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบ</button>
        </div>

        <div class="hh-tts-block" style="display:${s.voiceMode==="tts"?"block":"none"}">
            <div class="hh-info">⚠️ TTS ฟังเป็นหุ่นยนต์ แนะนำใช้ ElevenLabs แทน</div>
            <label class="hh-row hh-col"><span>เสียง</span>
                <select data-k="ttsVoice">${voiceOptions}</select>
            </label>
            <label class="hh-row"><span>Pitch <span class="hh-val">${s.ttsPitchBoost>=0?"+":""}${s.ttsPitchBoost.toFixed(2)}</span></span><input type="range" min="-50" max="25" step="5" data-k="ttsPitchBoost" value="${s.ttsPitchBoost*100}"></label>
            <label class="hh-row"><span>Rate <span class="hh-val">${s.ttsRate.toFixed(2)}x</span></span><input type="range" min="60" max="140" step="5" data-k="ttsRate" value="${s.ttsRate*100}"></label>
            <label class="hh-row"><span>Volume <span class="hh-val">${Math.round(s.ttsVolume*100)}%</span></span><input type="range" min="0" max="100" step="5" data-k="ttsVolume" value="${s.ttsVolume*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบเสียง</button>
        </div>

        <div class="hh-section">✨ ลอง mood</div>
        <div class="hh-moods">
            ${Object.keys(SPRITES).map(m => `<button data-mood="${m}">${m}</button>`).join("")}
        </div>

        <div class="hh-section">🎮 มินิเกม</div>
        <button class="hh-rps-test">เป่ายิงฉุบ! (ทดสอบ)</button>

        <button class="hh-close">ปิดเมนู</button>
    `;
    document.body.appendChild(p);
    state.panel = p;
    const px = clamp(x - 145, 8, window.innerWidth - 300);
    const py = clamp(y - 50, 8, window.innerHeight - 600);
    p.style.left = `${px}px`;
    p.style.top = `${py}px`;

    function refreshBlocks(mode) {
        p.querySelector(".hh-eleven-block").style.display = mode === "elevenlabs" ? "block" : "none";
        p.querySelector(".hh-custom-block").style.display = mode === "custom" ? "block" : "none";
        p.querySelector(".hh-tts-block").style.display = mode === "tts" ? "block" : "none";
        const offInfo = p.querySelector('[data-show="off"]');
        if (offInfo) offInfo.style.display = mode === "off" ? "block" : "none";
    }

    const closePanel = () => { p.remove(); state.panel = null; };
    p.querySelector(".hh-x-close").addEventListener("click", closePanel);
    p.querySelector(".hh-close").addEventListener("click", closePanel);

    p.querySelectorAll("input, select, textarea").forEach(inp => {
        inp.addEventListener("change", () => {
            const k = inp.dataset.k;
            const cur = settings();
            if (inp.type === "checkbox") cur[k] = inp.checked;
            else if (inp.type === "range") {
                let v = parseFloat(inp.value);
                if (k === "ttsPitchBoost" || k === "ttsRate" || k === "ttsVolume") v = v / 100;
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
                if (k === "voiceMode") refreshBlocks(cur[k]);
                if (k === "elVoiceId") {
                    const manual = p.querySelector('input[data-k="elVoiceIdManual"]');
                    if (manual) manual.value = cur[k];
                }
            } else if (inp.tagName === "TEXTAREA") {
                if (k === "customAudio") {
                    try {
                        cur.customAudio = inp.value.trim() ? JSON.parse(inp.value) : {};
                        inp.style.borderColor = "#d7789b";
                    } catch (_) {
                        inp.style.borderColor = "#da5864";
                        return;
                    }
                }
            } else if (inp.type === "password" || inp.type === "text") {
                if (k === "elVoiceIdManual") cur.elVoiceId = inp.value.trim();
                else cur[k] = inp.value.trim();
            }
            save();
            if (k === "enabled") {
                if (cur.enabled) { buildPet(); scheduleWalk(); }
                else destroyPet();
            }
        });
    });

    p.querySelector(".hh-fetch-voices")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const cur = settings();
        const keyInput = p.querySelector('input[data-k="elKey"]');
        const apiKey = (keyInput?.value || cur.elKey || "").trim();
        if (!apiKey) { alert("ใส่ API Key ก่อนนะคะ"); return; }
        e.target.textContent = "⏳ กำลังโหลด...";
        e.target.disabled = true;
        const list = await fetchElevenVoices(apiKey);
        e.target.textContent = "🔄 ดึงรายการ voices";
        e.target.disabled = false;
        if (!list.length) { alert("โหลดไม่สำเร็จ ตรวจ API Key อีกที"); return; }
        cur.elVoices = list;
        cur.elKey = apiKey;
        save();
        const sel = p.querySelector('select[data-k="elVoiceId"]');
        if (sel) {
            sel.innerHTML = `<option value="">— เลือก voice —</option>` +
                list.map(v => `<option value="${v.voice_id}" ${v.voice_id===cur.elVoiceId?"selected":""}>${v.name} (${v.category||""})</option>`).join("");
        }
    });

    p.querySelectorAll(".hh-test-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            unlockAudio();
            const sample = pickOne(["สวัสดีค่า แฮม แฮม มาแล้วน้า", "พี่จ๋า คิดถึงเลยน้า", "เย้ ได้ทดสอบเสียงแล้ว"]);
            sayQueued(sample, "happy", "click");
        });
    });
    p.querySelectorAll("[data-mood]").forEach(b => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            unlockAudio();
            sayQueued(`mood: ${b.dataset.mood}`, b.dataset.mood, null);
        });
    });
    p.querySelector(".hh-rps-test")?.addEventListener("click", (e) => {
        e.stopPropagation();
        unlockAudio();
        closePanel();
        setTimeout(() => triggerRPSGame(), 300);
    });

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
