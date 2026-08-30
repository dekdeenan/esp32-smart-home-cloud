export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const suppliedKey = context.request.headers.get("X-Dashboard-Key") || "";
  const expectedKey = context.env.DASHBOARD_KEY || "";
  if (!expectedKey || suppliedKey !== expectedKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, headers });
}

