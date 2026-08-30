export async function onRequestPost(context) {
  const token = context.env.BLYNK_TOKEN;
  const server = context.env.BLYNK_SERVER || "https://blynk.cloud";
  if (!token) return Response.json({ error: "BLYNK_TOKEN is missing" }, { status: 500 });

  const body = await context.request.json().catch(() => ({}));
  const turnOn = Number(body.state) === 1;
  const pin = turnOn ? "V5" : "V8";
  const response = await fetch(`${server}/external/api/update?token=${encodeURIComponent(token)}&${pin}=1`);
  if (!response.ok) return Response.json({ error: "Blynk update failed" }, { status: 502 });
  return Response.json({ ok: true });
}

