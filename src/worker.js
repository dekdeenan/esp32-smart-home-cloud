function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function numberValue(text) {
  const value = Number(String(text).replaceAll('"', '').trim());
  return Number.isFinite(value) ? value : null;
}

function authorized(request, env) {
  const suppliedKey = request.headers.get("X-Dashboard-Key") || "";
  return Boolean(env.DASHBOARD_KEY) && suppliedKey === env.DASHBOARD_KEY;
}

async function readStatus(env) {
  if (!env.BLYNK_TOKEN) return json({ error: "BLYNK_TOKEN is missing" }, 500);
  const server = env.BLYNK_SERVER || "https://blynk.cloud";
  const pins = ["V1", "V2", "V3", "V4", "V6", "V7", "V9"];

  try {
    const values = await Promise.all(pins.map(async (pin, index) => {
      const url = `${server}/external/api/get?token=${encodeURIComponent(env.BLYNK_TOKEN)}&${pin}`;
      const response = await fetch(url, { headers: { "Accept": "text/plain" } });
      if (!response.ok) throw new Error(`Blynk ${pin}: ${response.status}`);
      const text = (await response.text()).replaceAll('"', '').trim();
      return index < 6 ? numberValue(text) : text;
    }));

    const slots = String(values[6] || "").split(";");
    const schedules = Array.from({ length: 4 }, (_, index) => {
      const parts = String(slots[index] || "-").split(",").map(Number);
      return parts.length === 2 && parts.every(Number.isFinite)
        ? { start: parts[0], stop: parts[1] }
        : null;
    });
    return json({
      relays: values.slice(0, 4).map(value => value === 1 ? 1 : 0),
      temperature: values[4],
      humidity: values[5],
      now: Math.floor(Date.now() / 1000),
      schedules
    });
  } catch (error) {
    return json({ error: "Blynk is unavailable" }, 502);
  }
}

async function updateSchedule(request, env) {
  if (!env.BLYNK_TOKEN) return json({ error: "BLYNK_TOKEN is missing" }, 500);
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const start = Math.floor(Number(body.start));
  const stop = Math.floor(Number(body.stop));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(id) || id < 1 || id > 4 ||
      !Number.isFinite(start) || !Number.isFinite(stop) || start <= now || stop <= start) {
    return json({ error: "Invalid or expired schedule" }, 400);
  }

  const server = env.BLYNK_SERVER || "https://blynk.cloud";
  const getResponse = await fetch(`${server}/external/api/get?token=${encodeURIComponent(env.BLYNK_TOKEN)}&V9`);
  if (!getResponse.ok) return json({ error: "Blynk schedule read failed" }, 502);
  const current = (await getResponse.text()).replaceAll('"', '').trim();
  const slots = current ? current.split(";") : [];
  while (slots.length < 4) slots.push("-");
  slots[id - 1] = `${start},${stop}`;
  const value = encodeURIComponent(slots.slice(0, 4).join(";"));
  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(env.BLYNK_TOKEN)}&V9=${value}`);
  return response.ok ? json({ ok: true }) : json({ error: "Blynk update failed" }, 502);
}

async function cancelSchedule(request, env) {
  if (!env.BLYNK_TOKEN) return json({ error: "BLYNK_TOKEN is missing" }, 500);
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1 || id > 4) return json({ error: "Relay id must be 1-4" }, 400);
  const server = env.BLYNK_SERVER || "https://blynk.cloud";
  const getResponse = await fetch(`${server}/external/api/get?token=${encodeURIComponent(env.BLYNK_TOKEN)}&V9`);
  if (!getResponse.ok) return json({ error: "Blynk schedule read failed" }, 502);
  const current = (await getResponse.text()).replaceAll('"', '').trim();
  const slots = current ? current.split(";") : [];
  while (slots.length < 4) slots.push("-");
  slots[id - 1] = "-";
  const value = encodeURIComponent(slots.slice(0, 4).join(";"));
  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(env.BLYNK_TOKEN)}&V9=${value}`);
  return response.ok ? json({ ok: true }) : json({ error: "Blynk update failed" }, 502);
}

async function updateRelay(request, env) {
  if (!env.BLYNK_TOKEN) return json({ error: "BLYNK_TOKEN is missing" }, 500);
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const state = Number(body.state) === 1 ? 1 : 0;
  if (!Number.isInteger(id) || id < 1 || id > 4) return json({ error: "Relay id must be 1-4" }, 400);

  const server = env.BLYNK_SERVER || "https://blynk.cloud";
  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(env.BLYNK_TOKEN)}&V${id}=${state}`);
  return response.ok ? json({ ok: true }) : json({ error: "Blynk update failed" }, 502);
}

async function updateAll(request, env) {
  if (!env.BLYNK_TOKEN) return json({ error: "BLYNK_TOKEN is missing" }, 500);
  const body = await request.json().catch(() => ({}));
  const pin = Number(body.state) === 1 ? "V5" : "V8";
  const server = env.BLYNK_SERVER || "https://blynk.cloud";
  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(env.BLYNK_TOKEN)}&${pin}=1`);
  return response.ok ? json({ ok: true }) : json({ error: "Blynk update failed" }, 502);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (!env.DASHBOARD_KEY) {
        return json({ error: "DASHBOARD_KEY is missing in Worker secrets" }, 500);
      }
      if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

      if (url.pathname === "/api/status" && request.method === "GET") return readStatus(env);
      if (url.pathname === "/api/relay" && request.method === "POST") return updateRelay(request, env);
      if (url.pathname === "/api/all" && request.method === "POST") return updateAll(request, env);
      if (url.pathname === "/api/schedule" && request.method === "POST") return updateSchedule(request, env);
      if (url.pathname === "/api/schedule/cancel" && request.method === "POST") return cancelSchedule(request, env);
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
