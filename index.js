// 🌸 HamHam Buddy v7 — wall climbing edition
// - No moods (single hamster, 4-direction sprites)
// - Wall-climbing AI: hamster prefers walking along screen edges
// - Direction sprite swaps based on movement vector

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";

const MODULE = "HamHamBuddy";
const LONG_PRESS_MS = 5000;

// ───────────────────────────── Sprites (4 directions, single image each) ─────────────────────────────
const SPRITES = {
    front: "https://i.postimg.cc/gcsfX3DN/1000045228-removebg-preview.png",
    back:  "https://i.postimg.cc/z3ZznNrP/1000045221-removebg-preview.png",
    left:  "https://i.postimg.cc/fknzxsNP/1000045217-removebg-preview.png",  // swapped
    right: "https://i.postimg.cc/YjKr17Hs/1000045215-removebg-preview.png",  // swapped
};

// Single voice profile (no per-mood)
const VOICE_TTS = { pitch: 1.75, rate: 0.97 };
const VOICE_ELEVEN = { stability: 0.4, similarity_boost: 0.75, style: 0.5 };

// ───────────────────────────── Lines ─────────────────────────────
const LINES = {
    click: [
        "โอ้ย ทำหนูทำไมเนี่ย",
        "อย่าจิ้มสิคะ",
        "ฮึ่ง แกล้งหนูตลอดเลย",
        "พอเถอะน้า",
        "หยุดนะ ไม่หยุดร้องให้แม่มุนะ",
        "อ๊ายย จิ้มอะไรของเธอ",
        "นิ้วใหญ่จัง น่ากลัวอ่ะ",
        "อย่าน้าาา หนูเล็กกว่าเยอะ",
        "หนูบอกแล้วไงว่าอย่าจิ้ม",
        "เธอนี่นะ ขี้แกล้งจังเลย",
        "ก๊าก ตกใจหมดเลย",
        "พี่นี่นะ ใจร้ายจังเลย ฮึ่ง",
        "ทำไมต้องจิ้มหนูด้วยอ่ะ",
        "อย่าจิ้มขนหนูสิ ยุ่งหมดแล้ว",
        "หยุดน้า หนูจะหนีแล้ว",
        "แตะเบาๆ สิคะ",
        "หนูเป็นแฮมไม่ใช่กระจกน้า",
    ],
    clickAngry: [
        "พอได้แล้ว!",
        "หนูจะกัดจริงๆ แล้วน้า!",
        "ไม่เล่นด้วยแล้ว ฮึ่ง!",
        "แกล้งหนูพอแล้ว โกรธจริงนะ!",
        "พี่! หนูจะร้องบอกแม่มุนะ!",
        "ใจร้ายมากเลยรู้มั้ย!",
        "ไม่ปั่นด้วยแล้ว ไปแล้ว ฮึ่ง!",
        "บอกแล้วไงว่าหยุด ไม่ฟังเลย!",
        "หนูโมโหแล้วน้า! ไปไกลๆ เลย!",
    ],
    clickSad: [
        "หนูร้องไห้แล้วน้า",
        "ทำไมแกล้งหนูตลอดเลยอ่ะ",
        "หนูไปอยู่คนเดียวดีกว่า",
        "พี่ไม่รักหนูแล้วเหรอ",
        "หนูเสียใจจริงๆ น้า",
        "ไม่อยากเล่นกับพี่อีกแล้ว",
        "หนูทำอะไรผิดเหรอ ทำไมแกล้งกัน",
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
        "ระวังด้วยนะ เดี๋ยวหนูตก",
        "ใครก็ได้ช่วยหนูที",
        "อ๊ายย ทำไมต้องลากด้วยอ่ะ",
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
    climbing: [
        "หึๆ ปีนป่ายเก่งมั้ย",
        "ไต่ๆ ไต่ๆ",
        "ดูสิ! หนูปีนได้น้า",
        "ระวังตกน้า แต่หนูเก่ง!",
        "ยืดขาแบบนี้ๆ",
    ],
};

// RPS lines
const RPS_CHALLENGE = [
    "อ๊ะ กล้าจิ้มหนูเหรอ เป่ายิงฉุบเลย แพ้ห้ามร้อง!",
    "หนูท้า! เป่ายิงฉุบ พี่กล้าไหม กลัวๆ ใช่มั้ย",
    "อ้าว มาแบบนี้เลย เป่ายิงฉุบเลยยย หนูเก่งน้า",
    "หนูจะเอาคืน เป่ายิงฉุบกัน แพ้แล้วต้องยอมรับนะ",
    "หนูมือเล็กแต่ใจใหญ่ มาเลยพี่!",
    "ฮึ่ม! ทำหนูทำไม เอาเลย เป่ายิงฉุบ!",
    "พี่นี่นะ ขี้แพ้แน่ๆ มาดูกัน เป่าๆ",
    "หนูแชมป์ปีที่แล้วน้า รับประกันคุณภาพ!",
    "หึๆ มาก็มา ใครจะกลัวใคร เป่ายิงฉุบ!",
];
const RPS_HAM_WIN = [
    "เย่! ${name} แพ้แล้วววว ไปเรียนอนุบาลใหม่ไปป! หนูเก่งสุดในจักรวาล! ใครคือแชมป์ ก็แฮมไงคะ",
    "ฮ่าๆ ${name} แพ้แล้ว ไปเรียนอนุบาลก่อนนะ หนูจะรอรับสมัครศิษย์ใหม่ ค่าเรียน 5 เมล็ดทานตะวัน อิอิ",
    "หนูชนะแล้วววว ${name} แพ้สุดๆ! เห็นมั้ย แฮมตัวจิ๋วเอาชนะได้! ไปฝึกซ้อมมาใหม่นะ จะรอเป่ากันรอบหน้า",
    "${name} เป่ายิงฉุบไม่เก่งเลย แพ้แฮมตัวเล็กๆ! โอ๊ยอายแทน! รีบไปอ่านคู่มือเป่ายิงฉุบขั้นเทพมาเลยน้า",
    "เห็นมั้ย หนูเก่งกว่า ${name} เลย! ก้มหัวให้แชมป์โลกหน่อย! กราบสามครั้งก่อนได้คุย หึๆ",
    "${name} แพ้! แพ้! แพ้สามรอบติด! เอ๊ะ ครั้งเดียวเหรอ? อ้าว แต่รู้สึกชนะหลายรอบมาก หนูดีใจสุดเลยย",
    "หา? ${name} แพ้เด็กแฮมเหรอ น่าอายมากกก! เอาไปบอกเพื่อนว่าแพ้แฮมไม่กล้าแน่ ฮ่าๆๆ",
    "หนูจะส่ง ${name} กลับไปเรียนเป่ายิงฉุบใหม่! ห้องเรียนชั้นอนุบาล วิชาแรก: รู้จักค้อน กระดาษ กรรไกร",
    "${name} ยอมแพ้สิ ยอมรับเลย หนูเทพกว่า ฮึ่ม! เอาน้ำตามาเช็ดดี? หนูใจดี แบ่งให้นิดนึง",
    "อิอิ ${name} โดนหนูซะแล้ว เก็บค่าเรียนด้วย! หนูคิดค่าสอน 10 เมล็ดทานตะวันค่ะ ผ่อนได้ ไม่มีดอกเบี้ย",
    "เห็นมะ ${name}! บอกแล้วว่าหนูชนะแน่ๆ ไม่ฟังหนู ก็แพ้สิคะ ทีหลังเชื่อหนูบ้างนะ",
    "${name} ไปนอนเล่นไป หนูแชมป์แล้ว! ขออนุญาตเก็บถ้วยรางวัล โล่ห์ และเหรียญทองค่ะ ขอบคุณค่ะ",
    "หนูชนะ! ${name} ต้องเลี้ยงเมล็ดทานตะวันหนูนะ! สัญญาแล้วน้า ห้ามเบี้ยว ไม่งั้นจะฟ้องแม่มุ!",
];
const RPS_USER_WIN = [
    "เก่งจริงด้วย... แต่หนูจะเอาคืนนะ! รอเลย! เดี๋ยวซ้อมมาใหม่ คราวหน้าหนูชนะแน่!",
    "อึ้ก... ฟลุ๊กแน่ๆ! ฟลุ๊ก! บังเอิญทั้งนั้น ไม่ใช่ฝีมือพี่หรอกน้า ฮึ่ม",
    "ขอเวลาตั้งสติแป๊ปนึง... ดาวลอยรอบหัวเลย หนูยังงงอยู่เลยว่าแพ้ได้ไง",
    "หนูพลาดดด ตาตาาา! เอาน่า แค่รอบเดียว ไม่ได้แปลว่าพี่เก่งกว่านะ!",
    "หนูยอมแพ้... แต่แค่รอบนี้นะ! รอบหน้าหนูเอาคืนแน่ๆ จำคำหนูไว้!",
    "พี่นี่... โชคดีจัง! หนูเสียใจจริงๆ แต่ก็ยินดีด้วย ขอกอดทีนึง",
    "หาาา แพ้ได้ไงเนี่ย หนูไม่ยอมรับ! ขอแก้มือ! เป่าใหม่ได้ปะ ได้นะๆ ขอนะๆ",
    "ฮึ่ม... รอบนี้พี่ฟลุ๊ก! แต่หนูจะจำไว้เลย รอบหน้าหนูจะอ่านใจพี่ออกแน่ๆ ดูสิว่าใครจะชนะ",
];
const RPS_TIE = [
    "เอ๊ะ ออกเหมือนกัน เสมอ!",
    "เสมอแล้ว ลองใหม่มั้ย",
    "เป่าใหม่ๆ ยังไม่จบ!",
    "ฮะ! สมองเดียวกันเหรอเรา? เสมอน้า",
    "อ้าว เลียนแบบหนูเหรอ เสมอน้า!",
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
    squeakVolume: 0.12,
};

// ───────────────────────────── State ─────────────────────────────
const state = {
    pet: null,
    bubble: null,
    panel: null,
    rpsModal: null,
    x: 80, y: 80,
    facing: "front",                  // "front" | "back" | "left" | "right"
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
    recentHamPicks: [],
};

const audioCache = new Map();

// Speech history
const speechHistory = [];
const HISTORY_MAX = 30;
function logSpeech(text) {
    speechHistory.unshift({ text, timestamp: Date.now() });
    if (speechHistory.length > HISTORY_MAX) speechHistory.length = HISTORY_MAX;
    refreshHistoryView();
}
function refreshHistoryView() {
    if (!state.panel) return;
    const list = state.panel.querySelector(".hh-history");
    if (list) list.innerHTML = renderHistoryItems();
}
function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return "เพิ่งกี้";
    if (diff < 60) return `${diff} วิที่แล้ว`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m} นาทีที่แล้ว`;
    const h = Math.floor(m / 60);
    return `${h} ชม.ที่แล้ว`;
}
function escapeHtml(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderHistoryItems() {
    if (!speechHistory.length) {
        return `<div class="hh-history-empty">ยังไม่ได้พูดอะไรเลย รอแฮมพูดก่อนน้า~</div>`;
    }
    return speechHistory.map(h => `
        <div class="hh-history-item">
            <div class="hh-history-text">${escapeHtml(h.text)}</div>
            <div class="hh-history-meta">${timeAgo(h.timestamp)}</div>
        </div>
    `).join("");
}

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
        try { window.speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch (_) {}
    }
    state.audioUnlocked = true;
}

// ───────────────────────────── TTS ─────────────────────────────
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

function speakTTS(text) {
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
            u.pitch = clamp(VOICE_TTS.pitch + (s.ttsPitchBoost || 0), 0.1, 2.0);
            u.rate = clamp(VOICE_TTS.rate * (s.ttsRate || 1.0), 0.5, 2.0);
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

async function speakElevenLabs(text) {
    const s = settings();
    if (!s.elKey || !s.elVoiceId) return speakTTS(text);
    const cleaned = preprocessText(text);
    if (!cleaned) return;
    const cacheKey = `${s.elVoiceId}::${s.elModelId}::${cleaned}`;
    if (audioCache.has(cacheKey)) {
        return playAudioUrl(audioCache.get(cacheKey), s.ttsVolume ?? 0.85);
    }
    try {
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
                        stability: VOICE_ELEVEN.stability,
                        similarity_boost: VOICE_ELEVEN.similarity_boost,
                        style: VOICE_ELEVEN.style,
                        use_speaker_boost: true,
                    },
                }),
            }
        );
        if (!r.ok) {
            console.warn(`[HamHam] ElevenLabs ${r.status}`);
            return speakTTS(text);
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        audioCache.set(cacheKey, url);
        trimAudioCache();
        return playAudioUrl(url, s.ttsVolume ?? 0.85);
    } catch (err) {
        console.warn("[HamHam] ElevenLabs error", err);
        return speakTTS(text);
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
async function speakCustomAudio(text, category) {
    const s = settings();
    const map = s.customAudio || {};
    let urls = null;
    if (category && Array.isArray(map[category])) urls = map[category];
    else if (Array.isArray(map.hamFallback)) urls = map.hamFallback;
    const url = pickOne(urls);
    if (!url) return;
    return playAudioUrl(url, s.ttsVolume ?? 0.85);
}

// ───────────────────────────── Squeak ─────────────────────────────
let _squeakCtx = null;
function getSqueakCtx() {
    if (!_squeakCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        _squeakCtx = new Ctx();
    }
    return _squeakCtx;
}

function squeak() {
    const ctx = getSqueakCtx();
    if (!ctx) return Promise.resolve();
    if (ctx.state === "suspended") {
        ctx.resume();
        if (ctx.state === "suspended") return Promise.resolve();
    }
    const s = settings();
    const vol = clamp(s.squeakVolume ?? 0.12, 0, 0.5);
    const count = 2 + Math.floor(Math.random() * 2);  // 2-3 squeaks
    const now = ctx.currentTime;

    let cursor = 0;
    let totalDur = 0;
    for (let i = 0; i < count; i++) {
        const start = now + cursor;
        const dur = 0.07 + Math.random() * 0.04;
        const basePitch = 1300 + Math.random() * 400;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.setValueAtTime(basePitch * 0.7, start);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 1.3, start + dur * 0.25);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.85, start + dur);
        filter.type = "lowpass";
        filter.frequency.value = 4500;
        filter.Q.value = 0.7;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
        cursor += dur + 0.06 + Math.random() * 0.10;
        totalDur = cursor;
    }
    return new Promise(r => setTimeout(r, Math.ceil(totalDur * 1000) + 50));
}

async function vocalize(text, category) {
    const s = settings();
    if (s.voiceMode === "off") return;
    if (s.voiceMode === "squeak") return squeak();
    if (s.voiceMode === "elevenlabs") return speakElevenLabs(text);
    if (s.voiceMode === "custom") return speakCustomAudio(text, category);
    if (s.voiceMode === "tts") return speakTTS(text);
}

// ───────────────────────────── DOM ─────────────────────────────
function buildPet() {
    if (state.pet) return;
    const s = settings();

    // Create a root container outside ST's DOM tree to avoid parent transform issues
    if (!state.rootContainer) {
        state.rootContainer = document.createElement("div");
        state.rootContainer.id = "hh-root";
        state.rootContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
        `;
        // Append to documentElement (html), not body — escapes any transformed wrappers
        document.documentElement.appendChild(state.rootContainer);
    }

    state.pet = document.createElement("div");
    state.pet.id = "hh-pet";
    state.pet.style.width = `${s.size}px`;
    state.pet.style.height = `${s.size}px`;
    state.pet.style.pointerEvents = "auto";

    const inner = document.createElement("div");
    inner.className = "hh-inner";

    const img = document.createElement("img");
    img.className = "hh-sprite";
    img.src = SPRITES.front;
    img.draggable = false;
    img.alt = "";

    inner.appendChild(img);
    state.pet.appendChild(inner);

    state.bubble = document.createElement("div");
    state.bubble.id = "hh-bubble";

    state.rootContainer.appendChild(state.pet);
    state.rootContainer.appendChild(state.bubble);

    state.x = s.posX;
    state.y = s.posY;
    applyTransform();

    bindInputs();

    setTimeout(() => {
        if (state.status === "idle") sayQueued(pickOne(LINES.greeting), "greeting");
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
    state.rootContainer?.remove();
    state.pet = null;
    state.bubble = null;
    state.panel = null;
    state.rpsModal = null;
    state.rootContainer = null;
}

function applyTransform() {
    if (!state.pet) return;
    state.pet.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    positionBubble();
}

function setDirection(dir) {
    if (!SPRITES[dir]) return;
    state.facing = dir;
    if (!state.pet) return;
    const img = state.pet.querySelector(".hh-sprite");
    if (img) img.src = SPRITES[dir];
}

function positionBubble() {
    if (!state.bubble || !state.pet) return;
    const s = settings();
    const margin = 8;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // First, force the bubble to natural width by removing fixed sizing
    state.bubble.style.width = "";

    // Measure
    const bubbleW = state.bubble.offsetWidth || 200;
    const bubbleH = state.bubble.offsetHeight || 40;

    // Center horizontally above pet by default
    let bx = state.x + s.size / 2;
    let by = state.y - margin;
    const placeBelow = state.y < bubbleH + 20;

    if (placeBelow) {
        by = state.y + s.size + margin;
        state.bubble.classList.add("hh-bubble-below");
    } else {
        state.bubble.classList.remove("hh-bubble-below");
    }

    // Clamp horizontally — KEY FIX: bubble x range is [halfW + margin, W - halfW - margin]
    const halfW = bubbleW / 2;
    const minBx = halfW + margin;
    const maxBx = W - halfW - margin;
    if (minBx > maxBx) {
        // Bubble is wider than screen — pin to left edge
        bx = halfW + margin;
    } else {
        bx = clamp(bx, minBx, maxBx);
    }

    state.bubble.style.left = `${bx}px`;
    state.bubble.style.top = `${by}px`;
}

function showBubble(text) {
    if (!state.bubble) return;
    if (state.bubbleTimer) { clearTimeout(state.bubbleTimer); state.bubbleTimer = null; }
    state.bubble.textContent = text;
    state.bubble.classList.add("hh-visible");
    // Position now (rough) and again next frame (accurate, after layout)
    positionBubble();
    requestAnimationFrame(() => positionBubble());
}

function hideBubble() {
    if (!state.bubble) return;
    if (state.bubbleTimer) { clearTimeout(state.bubbleTimer); state.bubbleTimer = null; }
    state.bubble.classList.remove("hh-visible");
}

function sayQueued(text, category = null, holdMs = null) {
    if (!text) return;
    state.queue.push({ text, category, holdMs });
    if (!state.queueRunning) runQueue();
}

function readingTime(text) {
    const len = (text || "").length;
    return clamp(2500 + len * 90, 3000, 25000);
}

async function runQueue() {
    if (state.queueRunning) return;
    state.queueRunning = true;
    try {
        while (state.queue.length) {
            const item = state.queue.shift();
            showBubble(item.text);
            logSpeech(item.text);
            state.status = "talking";
            const wait = item.holdMs ?? readingTime(item.text);
            const minWait = new Promise(r => setTimeout(r, wait));
            const speech = vocalize(item.text, item.category) || Promise.resolve();
            await Promise.all([minWait, speech]);
            hideBubble();
            await new Promise(r => setTimeout(r, 250));
        }
    } finally {
        state.queueRunning = false;
        state.status = "idle";
    }
}

// ───────────────────────────── Wall climbing ─────────────────────────────
function getEdgeOf(x, y) {
    const s = settings();
    const padding = 12;
    const W = window.innerWidth - s.size;
    const H = window.innerHeight - s.size;
    if (y <= padding) return "top";
    if (y >= H - padding) return "bottom";
    if (x <= padding) return "left";
    if (x >= W - padding) return "right";
    return null;
}

function pickWallTarget() {
    const s = settings();
    const W = window.innerWidth - s.size;
    const H = window.innerHeight - s.size;
    const currentEdge = getEdgeOf(state.x, state.y);

    // 70% follow current edge, 30% jump to a different edge
    const followEdge = currentEdge && Math.random() < 0.7;
    const target = followEdge ? currentEdge :
        ["top", "bottom", "left", "right"].filter(e => e !== currentEdge)[Math.floor(Math.random() * 3)];

    switch (target) {
        case "top":    return { x: Math.random() * W, y: 0 };
        case "bottom": return { x: Math.random() * W, y: H };
        case "left":   return { x: 0, y: Math.random() * H };
        case "right":  return { x: W, y: Math.random() * H };
    }
    return { x: Math.random() * W, y: Math.random() * H };
}

function moveTo(nx, ny, durMs = null) {
    if (!state.pet) return;
    if (state.walkAnim) cancelAnimationFrame(state.walkAnim);

    const s = settings();
    nx = clamp(nx, 0, window.innerWidth - s.size);
    ny = clamp(ny, 0, window.innerHeight - s.size);

    const sx = state.x, sy = state.y;
    const dx = nx - sx, dy = ny - sy;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;

    // Direction sprite based on dominant axis
    let dir;
    if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? "right" : "left";
    } else {
        dir = dy > 0 ? "front" : "back";
    }
    setDirection(dir);

    const isClimbing = dir === "back" || dir === "front";
    const speed = isClimbing ? 50 : 65;
    const dur = durMs ?? clamp((dist / speed) * 1000, 1000, 8000);
    state.status = "walking";
    state.pet.classList.add("hh-walking");
    state.pet.classList.toggle("hh-climbing", isClimbing);

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
            state.pet.classList.remove("hh-walking", "hh-climbing");
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
        if (state.status === "idle" && !state.rpsActive) {
            const target = pickWallTarget();
            moveTo(target.x, target.y);
            // Comment if climbing (vertical movement)
            if (Math.abs(target.y - state.y) > Math.abs(target.x - state.x) && Math.random() < 0.3) {
                setTimeout(() => sayQueued(pickOne(LINES.climbing), "idle"), 400);
            }
        }
        scheduleWalk();
        if (s.idleChatter && Math.random() < 0.2 && state.status === "idle" && !state.rpsActive) {
            sayQueued(pickOne(LINES.idle), "idle");
        }
        if (s.avoidChat && !state.rpsActive) maybeAvoidChat();
    }, wait);
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
    sayQueued(pickOne(LINES.blocking), "blocking");
    const s = settings();
    const goLeft = a.left > window.innerWidth / 2;
    const targetX = goLeft ? 0 : window.innerWidth - s.size;
    const targetY = clamp(state.y + (Math.random() * 80 - 40), 0, window.innerHeight - s.size);
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
        if (state.rpsActive) return;
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
        state.pet.classList.remove("hh-walking", "hh-climbing");
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
            sayQueued(pickOne(LINES.drag), "drag");
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

    if (state.clickStreak === 3) {
        triggerRPSGame();
        return;
    }

    let line, category;
    if (state.clickStreak >= 7) { line = pickOne(LINES.clickSad); category = "clickSad"; }
    else if (state.clickStreak >= 5) { line = pickOne(LINES.clickAngry); category = "clickAngry"; }
    else { line = pickOne(LINES.click); category = "click"; }

    if (state.queue.length > 1) state.queue.length = 1;
    sayQueued(line, category);
    state.pet.classList.remove("hh-bounce");
    void state.pet.offsetWidth;
    state.pet.classList.add("hh-bounce");
}

// ───────────────────────────── RPS mini-game ─────────────────────────────
function triggerRPSGame() {
    if (state.rpsActive) return;
    state.rpsActive = true;
    state.clickStreak = 0;
    state.queue.length = 0;
    state.queueRunning = false;
    if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (_) {}
    if (state.currentAudio) try { state.currentAudio.pause(); } catch (_) {}
    state.pet.classList.remove("hh-bounce", "hh-knockout", "hh-celebrate");
    setDirection("front");
    sayQueued(pickOne(RPS_CHALLENGE), "click");
    setTimeout(() => showRPSUI(), 1800);
}

function showRPSUI() {
    if (!state.rpsActive) return;
    if (state.rpsModal) { state.rpsModal.remove(); state.rpsModal = null; }
    const rps = document.createElement("div");
    rps.id = "hh-rps";
    // Force inline styles — covers full viewport, escapes any ST parent transforms
    rps.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transform: none !important;
        pointer-events: auto !important;
    `;
    rps.innerHTML = `
        <div class="hh-rps-card">
            <button class="hh-rps-x" aria-label="ปิด">✕</button>
            <div class="hh-rps-title">เป่า ยิง ฉุบ!</div>
            <div class="hh-rps-subtitle">เลือกเลย ใครแพ้ยอม~</div>
            <div class="hh-rps-buttons">
                <button data-c="rock"><span class="hh-rps-emoji">✊</span><span class="hh-rps-label">ค้อน</span></button>
                <button data-c="paper"><span class="hh-rps-emoji">✋</span><span class="hh-rps-label">กระดาษ</span></button>
                <button data-c="scissors"><span class="hh-rps-emoji">✌️</span><span class="hh-rps-label">กรรไกร</span></button>
            </div>
        </div>
    `;
    // Append to documentElement (html) to escape body-level transforms
    document.documentElement.appendChild(rps);
    state.rpsModal = rps;
    state._prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // X button — quit without picking
    rps.querySelector(".hh-rps-x").addEventListener("click", () => {
        rps.remove();
        state.rpsModal = null;
        document.body.style.overflow = state._prevBodyOverflow || "";
        state.rpsActive = false;
        state.clickStreak = 0;
        sayQueued(pickOne([
            "เอ้อ ไม่กล้าเล่นเหรอ ฮึ่ม",
            "หนีหนูเหรอ ขี้แพ้ชะมัด",
            "เออ ไปเหอะ ขี้กลัว",
            "หา เลิกแล้วเหรอ น่าน่ารักดี ฮิๆ",
        ]), "click");
    });

    rps.querySelectorAll("button[data-c]").forEach(b => {
        b.addEventListener("click", () => {
            const userPick = b.dataset.c;
            const counter = { rock: "paper", paper: "scissors", scissors: "rock" };
            const r = Math.random();
            let hamPick;
            if (r < 0.50)      hamPick = counter[userPick];
            else if (r < 0.75) hamPick = userPick;
            else if (r < 0.90) hamPick = counter[counter[userPick]];
            else hamPick = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];

            const recent = state.recentHamPicks;
            if (recent.length >= 2 && recent[recent.length-1] === hamPick && recent[recent.length-2] === hamPick) {
                const others = ["rock", "paper", "scissors"].filter(x => x !== hamPick);
                hamPick = others[Math.floor(Math.random() * others.length)];
            }
            recent.push(hamPick);
            if (recent.length > 5) recent.shift();

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
        // restore body scroll
        document.body.style.overflow = state._prevBodyOverflow || "";
        finishRPS(result);
    }, 2200);
}

function finishRPS(result) {
    const ctx = getContext?.();
    const userName = (ctx?.name1 || "พี่").toString().trim() || "พี่";
    state.queue.length = 0;
    state.queueRunning = false;

    if (result === "user") {
        state.pet.classList.remove("hh-bounce", "hh-celebrate");
        state.pet.classList.add("hh-knockout");
        sayQueued(pickOne(RPS_USER_WIN), "click", 9000);
        setTimeout(() => {
            state.pet?.classList.remove("hh-knockout");
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 9500);
    } else if (result === "ham") {
        state.pet.classList.remove("hh-bounce", "hh-knockout");
        state.pet.classList.add("hh-celebrate");
        const line = pickOne(RPS_HAM_WIN).replace(/\$\{name\}/g, userName);
        sayQueued(line, "click", 12000);
        setTimeout(() => {
            state.pet?.classList.remove("hh-celebrate");
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 12500);
    } else {
        sayQueued(pickOne(RPS_TIE), "click", 5000);
        setTimeout(() => {
            state.rpsActive = false;
            state.clickStreak = 0;
        }, 5500);
    }
}

// ───────────────────────────── Ham tag interception ─────────────────────────────
const HAM_RE = /<ham(?:\s+[^>]*)?>([\s\S]*?)<\/ham>/gi;
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
        const text = (m[1] || "").trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
        if (text) sayQueued(text, "hamFallback");
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
        : `<option value="">⏳ กำลังโหลดเสียง...</option>`;

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
                <option value="off" ${s.voiceMode==="off"?"selected":""}>🔇 ปิดเสียง</option>
                <option value="squeak" ${s.voiceMode==="squeak"?"selected":""}>🐹 จี๊ดๆ แบบหนูแฮม</option>
                <option value="elevenlabs" ${s.voiceMode==="elevenlabs"?"selected":""}>✨ ElevenLabs (เสียงคนจริง)</option>
                <option value="custom" ${s.voiceMode==="custom"?"selected":""}>📼 อัดเสียงเอง (MP3 URL)</option>
                <option value="tts" ${s.voiceMode==="tts"?"selected":""}>📢 Browser TTS (หุ่นยนต์)</option>
            </select>
        </label>

        <div class="hh-squeak-block" style="display:${s.voiceMode==="squeak"?"block":"none"}">
            <div class="hh-info">🐹 จี๊ดสั้นๆ 2-3 ครั้ง ฟังคล้ายเสียงหนูจริง</div>
            <label class="hh-row"><span>ดังเสียงจี๊ด <span class="hh-val">${Math.round((s.squeakVolume??0.12)*100)}%</span></span><input type="range" min="0" max="40" step="2" data-k="squeakVolume" value="${(s.squeakVolume??0.12)*100}"></label>
            <button class="hh-test-btn">▶️ ทดสอบเสียง</button>
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
                📼 อัดเสียงตัวเอง upload เป็น MP3 → ใส่ JSON<br>
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

        <div class="hh-section">📜 แฮมพึ่งพูดอะไรไป</div>
        <div class="hh-history">${renderHistoryItems()}</div>

        <div class="hh-section">🎮 มินิเกม</div>
        <button class="hh-rps-test">เป่ายิงฉุบ! (ทดสอบ)</button>

        <button class="hh-close">ปิดเมนู</button>
    `;
    p.style.pointerEvents = "auto";
    (state.rootContainer || document.documentElement).appendChild(p);
    state.panel = p;
    const px = clamp(x - 145, 8, window.innerWidth - 300);
    const py = clamp(y - 50, 8, window.innerHeight - 600);
    p.style.left = `${px}px`;
    p.style.top = `${py}px`;

    function refreshBlocks(mode) {
        p.querySelector(".hh-eleven-block").style.display = mode === "elevenlabs" ? "block" : "none";
        p.querySelector(".hh-custom-block").style.display = mode === "custom" ? "block" : "none";
        p.querySelector(".hh-tts-block").style.display = mode === "tts" ? "block" : "none";
        p.querySelector(".hh-squeak-block").style.display = mode === "squeak" ? "block" : "none";
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
                if (k === "ttsPitchBoost" || k === "ttsRate" || k === "ttsVolume" || k === "squeakVolume") v = v / 100;
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
            sayQueued(sample, "click");
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
