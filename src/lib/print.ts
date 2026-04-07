const PRINT_WINDOW_FEATURES = "width=1200,height=800";

export type PrintPageOrientation = "portrait" | "landscape";

export interface PrintElementAsPdfOptions {
  tournamentDateRange?: string;
}

/** Maps orientation to CSS @page size (A4). */
export function printPageSizeCss(orientation: PrintPageOrientation): string {
  return orientation === "portrait" ? "A4 portrait" : "A4 landscape";
}

/**
 * Opens a preview window with print controls (orientation + print). The system print dialog cannot be customized by web apps.
 */
export function printElementAsPdf(title: string, element: HTMLElement, options?: PrintElementAsPdfOptions) {
  const tournamentDateRange = options?.tournamentDateRange;

  const printWindow = window.open("", "_blank", PRINT_WINDOW_FEATURES);
  if (!printWindow) {
    alert("Unable to open print window. Please allow popups for this site.");
    return;
  }

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".wr-print-hide").forEach((node) => node.remove());
  clone.querySelectorAll(".wr-print-duplicate-title").forEach((node) => node.remove());
  const doc = printWindow.document;
  doc.title = title;

  while (doc.head.firstChild) doc.head.removeChild(doc.head.firstChild);
  while (doc.body.firstChild) doc.body.removeChild(doc.body.firstChild);

  const charsetMeta = doc.createElement("meta");
  charsetMeta.setAttribute("charset", "utf-8");
  doc.head.appendChild(charsetMeta);

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const copy = doc.createElement("link");
    const href = link.getAttribute("href");
    const rel = link.getAttribute("rel");
    if (href) copy.setAttribute("href", href);
    if (rel) copy.setAttribute("rel", rel);
    doc.head.appendChild(copy);
  });

  document.querySelectorAll("style").forEach((style) => {
    const copy = doc.createElement("style");
    copy.textContent = style.textContent;
    doc.head.appendChild(copy);
  });

  const dynamicPageStyle = doc.createElement("style");
  dynamicPageStyle.id = "wr-print-dynamic-page";
  dynamicPageStyle.textContent = `@page { size: ${printPageSizeCss("landscape")}; margin: 10mm; }`;
  doc.head.appendChild(dynamicPageStyle);

  const printStyleTag = doc.createElement("style");
  printStyleTag.textContent = `
    @media print {
      .wr-print-window-toolbar {
        display: none !important;
      }
    }
    .wr-print-window-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-sizing: border-box;
      width: 100%;
      margin: 0 0 12px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      font-size: 14px;
      color: #4D4D4D;
      background: #FAFAFA;
      border-bottom: 1px solid #D4D4D4;
    }
    .wr-print-window-toolbar button {
      font: inherit;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #D4D4D4;
      background: #FFFFFF;
      cursor: pointer;
    }
    .wr-print-window-toolbar button:hover {
      background: #EBEBEB;
    }
    .wr-print-window-toolbar button.wr-print-orient-active {
      border-color: #4BA8DE;
      background: #A5D3EF;
      font-weight: 600;
    }
    .wr-print-window-toolbar .wr-print-toolbar-primary {
      background: #4BA8DE;
      color: #FFFFFF;
      border-color: #90A1B9;
    }
    .wr-print-window-toolbar .wr-print-toolbar-primary:hover {
      background: #90A1B9;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, sans-serif;
      color: #4D4D4D;
      margin: 0;
    }
    .wr-print-hide {
      display: none !important;
    }
    .wr-print-header {
      margin-bottom: 12px;
    }
    .wr-print-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
    }
    .wr-print-subtitle {
      font-size: 14px;
      margin: 4px 0 0;
      color: #717171;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #D4D4D4;
      padding: 6px 8px;
      vertical-align: middle;
    }
    thead th {
      font-weight: 700;
    }
    .MuiPaper-root {
      box-shadow: none !important;
    }
    .MuiTableContainer-root {
      overflow: visible !important;
    }
    .MuiTable-root {
      table-layout: auto;
    }
  `;
  doc.head.appendChild(printStyleTag);

  const toolbar = doc.createElement("div");
  toolbar.className = "wr-print-window-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Print preview options");
  toolbar.innerHTML = `
    <span>Orientacja strony:</span>
    <button type="button" id="wr-print-orient-portrait" aria-pressed="false">Pionowo</button>
    <button type="button" id="wr-print-orient-landscape" aria-pressed="true" class="wr-print-orient-active">Poziomo</button>
    <button type="button" class="wr-print-toolbar-primary" id="wr-print-run">Drukuj…</button>
    <button type="button" id="wr-print-close-window">Zamknij</button>
  `;

  const header = doc.createElement("header");
  header.className = "wr-print-header";
  const heading = doc.createElement("h1");
  heading.className = "wr-print-title";
  heading.textContent = title;
  header.appendChild(heading);
  if (tournamentDateRange) {
    const subtitle = doc.createElement("p");
    subtitle.className = "wr-print-subtitle";
    subtitle.textContent = tournamentDateRange;
    header.appendChild(subtitle);
  }

  const main = doc.createElement("div");
  main.appendChild(header);
  main.appendChild(clone);

  doc.body.appendChild(toolbar);
  doc.body.appendChild(main);

  const script = doc.createElement("script");
  script.textContent = `
    (function () {
      var w = window;
      var dynamic = document.getElementById("wr-print-dynamic-page");
      var btnP = document.getElementById("wr-print-orient-portrait");
      var btnL = document.getElementById("wr-print-orient-landscape");
      function setPageSize(css) {
        dynamic.textContent = "@page { size: " + css + "; margin: 10mm; }";
      }
      function syncButtons(orientation) {
        var isP = orientation === "portrait";
        btnP.setAttribute("aria-pressed", isP ? "true" : "false");
        btnL.setAttribute("aria-pressed", isP ? "false" : "true");
        btnP.classList.toggle("wr-print-orient-active", isP);
        btnL.classList.toggle("wr-print-orient-active", !isP);
      }
      btnP.addEventListener("click", function () {
        setPageSize(${JSON.stringify(printPageSizeCss("portrait"))});
        syncButtons("portrait");
      });
      btnL.addEventListener("click", function () {
        setPageSize(${JSON.stringify(printPageSizeCss("landscape"))});
        syncButtons("landscape");
      });
      document.getElementById("wr-print-run").addEventListener("click", function () {
        w.focus();
        w.print();
      });
      document.getElementById("wr-print-close-window").addEventListener("click", function () {
        w.close();
      });
    })();
  `;
  doc.body.appendChild(script);
}
