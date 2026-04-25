# 🌸 HamHam Buddy

แฮมๆ มาสคอตเดินบนจอ SillyTavern! ลากได้ จิ้มได้ และ "ดักจับ" แท็ก `<ham mood="...">...</ham>` จากข้อความ AI → ให้แฮมๆบนจอพูดแทน bubble ปกติ

## ✨ ฟีเจอร์

- **เดินรอบจอ** — สุ่มเดินไปมา, มี blink animation, ใช้ sprite เดียวกับ regex เดิม
- **ดักแท็ก `<ham>`** — เมื่อ AI ส่งข้อความใหม่ที่มี `<ham mood="happy">เย้ๆ</ham>` แฮมๆ บนจอจะเปลี่ยน mood แล้วพูดประโยคนั้นใน speech bubble
- **หลบข้อความ** — ถ้าตำแหน่งซ้อนข้อความ → "บังข้อความดีกว่าอิอิ ไม่เห็นแล้วว 🙈" แล้วเดินหนีไปเอง
- **โดนจิ้มแล้วโวย** — กดครั้งแรกๆ "โอ้ย ทำหนูทำไมเนี่ย!" → จิ้มถี่ๆ → "พอได้แล้ว! 😡" → จิ้มเรื่อยๆ → "หนูร้องไห้แล้วน้า... 🥺"
- **ลากได้** — "พี่จะมาลากหนูไปไหน ฟ้องแม่มุแน่!"
- **9 mood** — normal, wave, happy, angry, tense, curious, scheming, sad, nsfw (ตรงกับ regex เดิม)
- **TTS เสียงไทย** (option) — ถ้าเบราเซอร์มี Thai voice จะอ่านออกเสียงเล็กๆ
- **คลิกขวาที่ตัวแฮมๆ** → เปิด settings panel + ลอง mood ได้

## 📦 วิธีติดตั้ง

### วิธี A — Manual (แนะนำ)

1. โหลด zip นี้ แตกไฟล์ออกมาให้ได้โฟลเดอร์ชื่อ `HamHam-Buddy`
2. วางในตำแหน่ง:
   - **ST รุ่นใหม่ (มี user data folder):** `data/<your-username>/extensions/HamHam-Buddy/`
   - **ST รุ่นเก่า:** `public/scripts/extensions/third-party/HamHam-Buddy/`
3. เปิด/รีเฟรช SillyTavern — จะเห็นแฮมๆ โผล่มามุมจอเลย

### วิธี B — ผ่าน UI (ถ้า upload ขึ้น git)

1. ไปที่ Extensions panel → Install Extension → ใส่ URL repo
2. รอติดตั้งเสร็จ → Reload

## 🎮 วิธีใช้

- **ลาก**: กดค้างที่ตัวแฮมๆ แล้วลากไปที่ไหนก็ได้
- **จิ้ม**: คลิกครั้งเดียว → จะโวยใส่
- **เปิด settings**: คลิกขวาที่ตัวแฮมๆ
- **ลอง mood**: ใน settings มีปุ่มของแต่ละ mood ให้ทดสอบ

## ⚙️ Settings ทั้งหมด

| ตัวเลือก | ทำอะไร |
|---|---|
| เปิดใช้งาน | on/off ทั้งระบบ |
| ดักแท็ก `<ham>` | ให้ pet ดึงข้อความจาก ham tag มาพูด |
| ซ่อน bubble จาก regex | ถ้ายัง enable regex เดิมไว้ จะซ่อน bubble ที่ regex สร้าง (กันซ้อนกัน) |
| หลบข้อความ | ตรวจ overlap แล้วเดินหนี |
| พึมพำตอนว่าง | random idle one-liner ทุกๆ ~30s |
| เสียงพูด (TTS) | ใช้ browser speech synthesis (เสียงไทยถ้ามี) |
| ขนาด | 48–160px |
| ช่วงเดิน | ความถี่ random walk |

## 💡 Tips

- ถ้าใช้ extension แล้ว **แนะนำ disable regex `🐹 HamHam · *` เก่า** (หรือเปิด "ซ่อน bubble จาก regex") เพื่อไม่ให้ข้อความขึ้น 2 ที่
- ถ้าอยากให้ AI ใช้ ham tag เหมือนเดิม → system prompt / character card ยังคงเดิมได้เลย ไม่ต้องแก้
- TTS ไทยจะมีเฉพาะ Chrome/Edge บน Windows/Mac และ Safari บน iOS

## 🐛 Known issues

- ถ้าหน้าจอเล็กมาก (<480px) แฮมๆ อาจไปอยู่นอกจอชั่วคราวตอน resize — ลากกลับมาได้
- iOS Safari บางทีบล็อก TTS จนกว่าจะแตะอะไรสักอย่าง

— ขอให้สนุกกับแฮมๆ 🐹💕
