function numberValue(text) {
  const value = Number(String(text).replaceAll('"', '').trim());
  return Number.isFinite(value) ? value : null;
}

export async function onRequestGet(context) {
  const token = context.env.BLYNK_TOKEN;
  const server = context.env.BLYNK_SERVER || "https://blynk.cloud";
  if (!token) return Response.json({ error: "BLYNK_TOKEN is missing" }, { status: 500 });

  const pins = ["V1", "V2", "V3", "V4", "V6", "V7"];
  try {
    const values = await Promise.all(pins.map(async pin => {
      const url = `${server}/external/api/get?token=${encodeURIComponent(token)}&${pin}`;
      const response = await fetch(url, { headers: { "Accept": "text/plain" } });
      if (!response.ok) throw new Error(`Blynk ${pin}: ${response.status}`);
      return numberValue(await response.text());
    }));

    return Response.json({
      relays: values.slice(0, 4).map(value => value === 1 ? 1 : 0),
      temperature: values[4],
      humidity: values[5]
    });
  } catch (error) {
    return Response.json({ error: "Blynk is unavailable" }, { status: 502 });
  }
}

