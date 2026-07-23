// Cloudflare Pages Function — served at /api/newsletter
//
// Pulls your published newsletter issues from Kit's Posts API. When you
// mark a broadcast "Public" in Kit, it publishes a matching Post — that's
// the resource with the actual public_url, which is why this calls
// /v4/posts rather than /v4/broadcasts.
//
// SET THIS UP IN CLOUDFLARE:
//   Pages project > Settings > Environment variables
//   Name:  KIT_API_KEY
//   Value: (see README.md for how to generate this in Kit)
//   Add it to both "Production" and "Preview" environments, then redeploy.
//
// IN KIT: when you send a broadcast, toggle it "Public" (this is what
// gives it a public_url) — otherwise it won't appear in the archive here.

export async function onRequestGet(context) {
  const apiKey = context.env.KIT_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      { error: "KIT_API_KEY is not set. Add it under Pages > Settings > Environment variables." },
      500
    );
  }

  try {
    const res = await fetch("https://api.kit.com/v4/posts?per_page=200", {
      headers: { "X-Kit-Api-Key": apiKey },
      cf: { cacheTtl: 900, cacheEverything: true }, // cache 15 min at the edge
    });

    if (!res.ok) {
      return jsonResponse({ error: `Kit API responded with ${res.status}` }, 502);
    }

    const data = await res.json();
    const issues = (data.posts || [])
      .filter((p) => p.status === "published" && p.public_url)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .map((p, i, arr) => ({
        subject: p.title,
        description: p.description || "",
        publishedAt: p.published_at,
        url: p.public_url,
        thumbnail: p.thumbnail_url,
        issueNumber: arr.length - i,
      }));

    return jsonResponse({ issues }, 200, 900);
  } catch (err) {
    return jsonResponse({ error: "Could not fetch or parse Kit posts.", detail: String(err) }, 502);
  }
}

function jsonResponse(data, status, cacheSeconds) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (cacheSeconds) headers["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  return new Response(JSON.stringify(data), { status, headers });
}
