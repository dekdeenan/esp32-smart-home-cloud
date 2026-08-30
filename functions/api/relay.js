export async function onRequestPost(context) {
  const token = context.env.BLYNK_TOKEN;
  const server = context.env.BLYNK_SERVER || "https://blynk.cloud";
  if (!token) return Response.json({ error: "BLYNK_TOKEN is missing" }, { status: 500 });

  const body = await context.request.json().catch(() => ({}));
  const id = Number(body.id);
  const state = Number(body.state) === 1 ? 1 : 0;
  if (!Number.isInteger(id) || id < 1 || id > 4) {
    return Response.json({ error: "Relay id must be 1-4" }, { status: 400 });
  }

  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(token)}&V${id}=${state}`);
  if (!response.ok) return Response.json({ error: "Blynk update failed" }, { status: 502 });
  return Response.json({ ok: true });
}

