// Cloudflare Pages Function — served at /api/newsletter
//
// Pulls your sent newsletter issues from Kit's API and returns only the
// ones you've marked "Public" (those are the only ones with a public_url).
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
    const res = await fetch("https://api.kit.com/v4/broadcasts?status=completed&per_page=200", {
      headers: { "X-Kit-Api-Key": apiKey },
      cf: { cacheTtl: 900, cacheEverything: true }, // cache 15 min at the edge
    });

    if (!res.ok) {
      return jsonResponse({ error: `Kit API responded with ${res.status}` }, 502);
    }

    const data = await res.json();
    const issues = (data.broadcasts || [])
      .filter((b) => b.public && b.public_url)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .map((b, i, arr) => ({
        subject: b.subject,
        description: b.description || b.preview_text || "",
        publishedAt: b.published_at,
        url: b.public_url,
        thumbnail: b.thumbnail_url,
        issueNumber: arr.length - i,
      }));

    return jsonResponse({ issues }, 200, 900);
  } catch (err) {
    return jsonResponse({ error: "Could not fetch or parse Kit broadcasts.", detail: String(err) }, 502);
  }
}

function jsonResponse(data, status, cacheSeconds) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (cacheSeconds) headers["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  return new Response(JSON.stringify(data), { status, headers });
}
