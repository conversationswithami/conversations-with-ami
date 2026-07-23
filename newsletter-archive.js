(function () {
  const grid = document.getElementById("archive-grid");
  if (!grid) return;

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function renderMessage(message) {
    grid.innerHTML = `<p class="state-msg">${message}</p>`;
  }

  function render(issues) {
    if (!issues.length) {
      renderMessage(
        "No public issues yet — mark a broadcast \u201cPublic\u201d in Kit when you send it, and it'll show up here automatically."
      );
      return;
    }
    grid.innerHTML = issues
      .map(function (issue) {
        return `
          <a class="archive-card" href="${issue.url}" target="_blank" rel="noopener">
            <span class="issue-num">Issue ${String(issue.issueNumber).padStart(2, "0")}</span>
            <h3>${issue.subject || "Untitled issue"}</h3>
            <span class="issue-date">${formatDate(issue.publishedAt)}</span>
          </a>`;
      })
      .join("");
  }

  renderMessage("Loading past issues…");

  fetch("/api/newsletter")
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok || result.data.error) {
        renderMessage(
          "The newsletter archive isn't connected yet. Once KIT_API_KEY is set as an environment variable in Cloudflare Pages, public issues will show up here automatically."
        );
        return;
      }
      render(result.data.issues || []);
    })
    .catch(function () {
      renderMessage("Couldn't load past issues right now — please check back later.");
    });
})();
