# ESP32 Smart Home — Cloudflare Pages + Blynk Cloud

โครงการนี้มีเฉพาะส่วนที่ต้องนำขึ้นโฮสต์:

- `public/index.html` — หน้า Dashboard
- `public/_routes.json` — ให้เฉพาะ `/api/*` เรียก Pages Functions
- `functions/api/status.js` — อ่าน V1–V4, V6 และ V7
- `functions/api/relay.js` — ควบคุม V1–V4
- `functions/api/all.js` — สั่ง V5 หรือ V8
- `functions/api/_middleware.js` — ตรวจรหัส Dashboard

## Secret ที่ต้องตั้งบน Cloudflare

- `BLYNK_TOKEN` — Device Auth Token ของ Blynk
- `DASHBOARD_KEY` — รหัสผ่านหน้า Dashboard ที่ผู้ใช้ตั้งเอง
- `BLYNK_SERVER` — ค่าไม่ลับ เช่น `https://blynk.cloud`

ห้ามเขียน Token ลงใน `index.html` และห้าม commit ไฟล์ `.dev.vars` หรือ `.env`

## Deploy ด้วย Wrangler

จากโฟลเดอร์นี้:

```powershell
npx wrangler login
npx wrangler pages project create
npx wrangler pages deploy public --project-name esp32-smart-home
```

โฟลเดอร์ `functions` ต้องอยู่ระดับเดียวกับ `public` ขณะสั่ง deploy

