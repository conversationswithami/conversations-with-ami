(function () {
  const listEl = document.getElementById("episode-list");
  if (!listEl) return;

  function formatDate(pubDate) {
    if (!pubDate) return "";
    const d = new Date(pubDate);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function renderEmpty(message) {
    listEl.innerHTML = `<p class="state-msg">${message}</p>`;
  }

  function render(episodes) {
    if (!episodes.length) {
      renderEmpty("No episodes found yet — check back soon.");
      return;
    }

    const total = episodes.length;
    listEl.innerHTML = episodes
      .map(function (ep, i) {
        const num = ep.episode || total - i;
        const audio = ep.audioUrl || ep.link || "#";
        return `
          <article class="episode">
            <div class="episode-num">${String(num).padStart(2, "0")}</div>
            <div class="episode-body">
              <p class="episode-meta">${formatDate(ep.pubDate)}${ep.duration ? " · " + ep.duration : ""}</p>
              <h3>${ep.title || "Untitled episode"}</h3>
              <p class="episode-desc">${(ep.description || "").slice(0, 180)}${ep.description && ep.description.length > 180 ? "…" : ""}</p>
            </div>
            <a class="episode-play" href="${audio}" target="_blank" rel="noopener" aria-label="Listen to ${ep.title || "this episode"}">▶</a>
          </article>`;
      })
      .join("");
  }

  renderEmpty("Loading episodes…");

  fetch("/api/episodes")
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok || result.data.error) {
        renderEmpty(
          "Episodes aren't connected yet. Once the RSS feed is set as the PODCAST_RSS_URL environment variable in Cloudflare Pages, they'll show up here automatically."
        );
        return;
      }
      render(result.data.episodes || []);
    })
    .catch(function () {
      renderEmpty("Couldn't load episodes right now — please check back later.");
    });
})();
