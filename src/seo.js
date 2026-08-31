// Per-route SEO for the SPA. Google renders JS, so setting the head on each
// route change is picked up; index.html carries sensible defaults for anything
// that doesn't run JS. Change SITE if the primary domain isn't the apex.

export const SITE = "https://portfolio.sladdagiri.org";
const AUTHOR = "Suraj Laddagiri";
const WORK = { name: "Work", path: "/portfolio" };

// title, desc (unique per page), optional breadcrumb crumb + parent.
export const ROUTE_META = {
  "/": {
    title: "Suraj Laddagiri",
    desc: "Suraj Laddagiri is a software engineer and a UC San Diego senior. He ships iOS apps, builds Bluetooth hardware, and trains machine-learning models.",
    type: "profile",
  },
  "/portfolio": {
    title: "Work | Suraj Laddagiri",
    desc: "Projects by Suraj Laddagiri, including two shipped iOS apps, Bluetooth hardware, and a machine-learning model that predicts congressional votes.",
    crumb: "Work",
  },
  "/haven": {
    title: "HAVEN | Suraj Laddagiri",
    desc: "HAVEN is a head-mounted navigation aid for blind and low-vision users. Suraj led the iOS and Core Bluetooth software behind its five-motor haptic guidance.",
    crumb: "HAVEN",
    parent: WORK,
  },
  "/musicstrip": {
    title: "Music Strip | Suraj Laddagiri",
    desc: "Music Strip is a Bluetooth-controlled LED strip with an iOS app that reacts to music and matches the colors of your album art. Built by Suraj Laddagiri.",
    crumb: "Music Strip",
    parent: WORK,
  },
  "/congress": {
    title: "Congressional Vote Prediction | Suraj Laddagiri",
    desc: "A machine-learning model by Suraj Laddagiri that predicts how each of the 535 members of Congress votes on a bill, at 86.4% mean accuracy.",
    crumb: "Congressional Vote Prediction",
    parent: WORK,
  },
  "/igadblock": {
    title: "IGAdBlock | Suraj Laddagiri",
    desc: "IGAdBlock is an iOS tweak by Suraj Laddagiri that removes ads from Instagram's feed by hooking its data sources at runtime, found through reverse engineering.",
    crumb: "IGAdBlock",
    parent: WORK,
  },
  "/demos": {
    title: "Demos | Suraj Laddagiri",
    desc: "Live, interactive demos from Suraj Laddagiri.",
    crumb: "Demos",
  },
  "/atlas": {
    title: "Atlas: San Diego Research Labs | Suraj Laddagiri",
    desc: "Atlas is a searchable map of San Diego research labs across UC San Diego, Salk, Scripps, and more, with what each does and where they fit.",
    crumb: "Atlas",
  },
  "/haven/privacy": {
    title: "HAVEN Privacy | Suraj Laddagiri",
    desc: "Privacy policy for the HAVEN app.",
    crumb: "Privacy",
    parent: { name: "HAVEN", path: "/haven" },
  },
  "/musicstrip/privacy": {
    title: "Music Strip Privacy | Suraj Laddagiri",
    desc: "Privacy policy for the Music Strip app.",
    crumb: "Privacy",
    parent: { name: "Music Strip", path: "/musicstrip" },
  },
};

function upsertMeta(key, content, attr = "name") {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(graph) {
  let el = document.getElementById("ld-json");
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "ld-json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

export function applyMeta(pathname) {
  const m = ROUTE_META[pathname] || {
    title: "Suraj Laddagiri",
    desc: ROUTE_META["/"].desc,
  };
  const url = SITE + (pathname === "/" ? "/" : pathname);

  document.title = m.title;
  upsertMeta("description", m.desc);
  upsertLink("canonical", url);

  upsertMeta("og:title", m.title, "property");
  upsertMeta("og:description", m.desc, "property");
  upsertMeta("og:url", url, "property");
  upsertMeta("og:type", m.type === "profile" ? "profile" : "website", "property");
  upsertMeta("og:site_name", "Suraj Laddagiri", "property");
  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", m.title);
  upsertMeta("twitter:description", m.desc);

  const graph = [];
  if (pathname === "/") {
    graph.push({
      "@type": "Person",
      name: AUTHOR,
      url: SITE,
      jobTitle: "Software Engineer",
      alumniOf: "University of California, San Diego",
      sameAs: [
        "https://github.com/surajladdagiri",
        "https://www.linkedin.com/in/suraj-laddagiri-903602272/",
      ],
    });
    graph.push({ "@type": "WebSite", name: "Suraj Laddagiri", url: SITE });
  } else if (m.crumb) {
    const trail = [{ name: "Home", item: SITE + "/" }];
    if (m.parent) trail.push({ name: m.parent.name, item: SITE + m.parent.path });
    trail.push({ name: m.crumb, item: url });
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: trail.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.name,
        item: t.item,
      })),
    });
  }
  setJsonLd(graph);
}
