(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  nav.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (link) setOpen(false);
  });
})();

(function () {
  var dialog;

  function open(src, caption, alt) {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
        '<figure class="lightbox-figure"><img alt="" /><figcaption></figcaption></figure>';
      dialog.addEventListener("click", function (e) {
        if (e.target === dialog || e.target.closest(".lightbox-close")) dialog.close();
      });
      document.body.appendChild(dialog);
    }
    var img = dialog.querySelector("img");
    img.src = src;
    img.alt = alt || caption || "";
    dialog.querySelector("figcaption").textContent = caption || "";
    dialog.showModal();
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-lightbox]");
    if (!link || typeof HTMLDialogElement !== "function") return;
    e.preventDefault();
    open(link.getAttribute("href"), link.dataset.caption, link.dataset.alt);
  });
})();

(function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".table-expand");
    if (!btn) return;
    var parent = btn.closest(".table-expand-parent");
    var ids = (btn.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean);
    if (!parent || !ids.length) return;
    var open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    parent.classList.toggle("is-open", open);
    ids.forEach(function (id) {
      var row = document.getElementById(id);
      if (row) row.hidden = !open;
    });
  });
})();

(function () {
  var canvases = document.querySelectorAll("canvas.js-chart[data-chart]");
  if (!canvases.length) return;

  function boot() {
    if (typeof Chart === "undefined") {
      setTimeout(boot, 30);
      return;
    }
    if (typeof ChartDataLabels !== "undefined") {
      Chart.register(ChartDataLabels);
    }

    var ink = "#2b1d1a";
    var muted = "#6b5a55";
    var grid = "rgba(43, 29, 26, 0.1)";

    canvases.forEach(function (canvas) {
      var spec;
      try {
        spec = JSON.parse(canvas.getAttribute("data-chart") || "{}");
      } catch (e) {
        return;
      }
      var kind = spec.kind || "bar";
      var config;

      if (kind === "stackedShare") {
        config = {
          type: "bar",
          data: {
            labels: spec.labels,
            datasets: (spec.datasets || []).map(function (ds) {
              return {
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor,
                borderWidth: 0,
                borderSkipped: false,
                borderRadius: ds.borderRadius || 0,
              };
            }),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                align: "start",
                labels: { color: ink, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: "rectRounded" },
              },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    var meta = (spec.segmentLabels || {})[ctx.datasetIndex];
                    var piece = meta && meta[ctx.dataIndex];
                    if (piece) return ctx.dataset.label + ": " + piece;
                    return ctx.dataset.label + ": " + ctx.parsed.y + "%";
                  },
                },
              },
              datalabels: {
                color: function (ctx) {
                  return (spec.labelColors && spec.labelColors[ctx.datasetIndex]) || "#fff";
                },
                font: { weight: "600", size: 11 },
                formatter: function (_v, ctx) {
                  var meta = (spec.segmentLabels || {})[ctx.datasetIndex];
                  return (meta && meta[ctx.dataIndex]) || "";
                },
              },
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: ink, font: { weight: "600" } },
              },
              y: {
                stacked: true,
                min: 0,
                max: 100,
                grid: { color: grid },
                ticks: {
                  color: muted,
                  callback: function (v) {
                    return v + "%";
                  },
                },
              },
            },
          },
        };
      } else if (kind === "shareBars") {
        var horizontal = !!spec.horizontal;
        var valueAxis = {
          min: 0,
          max: spec.axisMax || 100,
          grid: { color: grid },
          ticks: {
            color: muted,
            callback: function (v) {
              return v + "%";
            },
          },
        };
        var categoryAxis = {
          grid: { display: false },
          ticks: { color: ink, font: { weight: "600" } },
        };
        config = {
          type: "bar",
          data: {
            labels: spec.labels,
            datasets: [
              {
                label: spec.datasetLabel || "Share",
                data: spec.values,
                backgroundColor: spec.colors || "#8c2328",
                borderWidth: 0,
                borderRadius: 6,
                maxBarThickness: 64,
              },
            ],
          },
          options: {
            indexAxis: horizontal ? "y" : "x",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    return (horizontal ? ctx.parsed.x : ctx.parsed.y) + "%";
                  },
                },
              },
              datalabels: {
                anchor: "end",
                align: "end",
                clamp: true,
                color: ink,
                font: { weight: "700", size: 12 },
                formatter: function (v) {
                  return "~" + v + "%";
                },
              },
            },
            scales: horizontal
              ? { x: valueAxis, y: categoryAxis }
              : { x: categoryAxis, y: valueAxis },
          },
        };
      } else if (kind === "lineSeries") {
        config = {
          type: "line",
          data: {
            labels: spec.labels,
            datasets: (spec.datasets || []).map(function (ds) {
              return {
                label: ds.label,
                data: ds.data,
                borderColor: ds.borderColor,
                backgroundColor: ds.backgroundColor || "transparent",
                borderWidth: ds.borderWidth || 2.5,
                pointRadius: ds.pointRadius == null ? 0 : ds.pointRadius,
                pointHoverRadius: 4,
                tension: ds.tension == null ? 0.15 : ds.tension,
                spanGaps: !!ds.spanGaps,
              };
            }),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                position: "top",
                align: "start",
                labels: {
                  color: ink,
                  boxWidth: 12,
                  boxHeight: 12,
                  usePointStyle: true,
                  pointStyle: "line",
                },
              },
              datalabels: { display: false },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    var v = ctx.parsed.y;
                    if (v == null) return ctx.dataset.label + ": —";
                    return ctx.dataset.label + ": " + Math.round(v).toLocaleString("en-US");
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { color: grid },
                ticks: {
                  color: muted,
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 12,
                },
              },
              y: {
                beginAtZero: true,
                suggestedMax: spec.yMax || undefined,
                grid: { color: grid },
                ticks: {
                  color: muted,
                  callback: function (v) {
                    return Number(v).toLocaleString("en-US");
                  },
                },
              },
            },
          },
        };
      } else {
        config = spec.config;
      }

      if (!config) return;
      new Chart(canvas, config);
    });
  }

  boot();
})();
