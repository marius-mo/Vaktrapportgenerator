/* =====================================================================
   Voss Chalet – app.js
   Bygger sidene ut fra innholdet i content.js, og håndterer språkvalg,
   mørkt tema, meny, galleri og husmanual.

   Du trenger normalt ikke endre noe i denne filen — all tekst ligger i
   assets/js/content.js.
   ===================================================================== */

(function () {
  "use strict";

  var S = window.SITE;
  if (!S) return;

  /* --- Små hjelpere ------------------------------------------------- */

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function frag(kids) {
    var f = document.createDocumentFragment();
    kids.forEach(function (k) { if (k) f.appendChild(k); });
    return f;
  }

  /* --- Ikoner ------------------------------------------------------- */

  var PATHS = {
    ski: "M5 20L15 4M10 21l9-15M4 21h16",
    sauna: "M7 14c0-2 2-2.6 2-4.5S7 6 7 6M12 14c0-2 2-2.6 2-4.5S12 6 12 6M17 14c0-2 2-2.6 2-4.5S17 6 17 6M3 18h18",
    hottub: "M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM8 9c0-1 1-1.6 1-2.5S8 5 8 5M12 9c0-1 1-1.6 1-2.5S12 5 12 5M16 9c0-1 1-1.6 1-2.5S16 5 16 5",
    fire: "M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2.2 1.2-3.3 2.2-4.2.4 1.5 1.4 2.2 1.9 2.2.6-2.2-1.3-4.6.9-7z",
    mountain: "M3 19h18L14.5 6l-3.6 6.6L8.4 9.6z",
    car: "M5 17h14M7.5 17V19M16.5 17v2M4.5 17v-4l1.8-4.5h11.4L19.5 13v4zM4.5 13h15",
    wifi: "M4.5 11.5a11 11 0 0 1 15 0M8 15a6 6 0 0 1 8 0M12 18.5h.01",
    kids: "M12 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM9.5 21v-5h-2l2-5.5h5l2 5.5h-2v5",
    bed: "M3 19v-9h12.5a4.5 4.5 0 0 1 4.5 4.5V19M3 15h17M7 10V7.5h5V10",
    key: "M14.5 5.5a3.5 3.5 0 1 1-2.6 5.9L4 19.3V21h2.5v-2H9v-2.2h2.1l.8-.8a3.5 3.5 0 0 0 2.6-10.5z",
    thermo: "M12 4a2 2 0 0 1 2 2v7.2a4 4 0 1 1-4 0V6a2 2 0 0 1 2-2z",
    kitchen: "M4 8h16M6.5 8v8.5A3.5 3.5 0 0 0 10 20h4a3.5 3.5 0 0 0 3.5-3.5V8M9.5 8V4.5M14.5 8V4.5",
    tv: "M3.5 5.5h17v11h-17zM8.5 20.5h7",
    trash: "M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9L17.5 7",
    check: "M20 6.5L9.2 17.3 4 12",
    clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5V12l3 2",
    users: "M16.5 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M10.5 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM17 5.5a3 3 0 0 1 2 5.3M21 20v-1.5a4 4 0 0 0-2.5-3.7",
    moon: "M20.5 14.5A8.5 8.5 0 1 1 10 4a6.6 6.6 0 0 0 10.5 10.5z",
    party: "M3.5 20.5l5.2-12.4 7.2 7.2zM14.5 4l1 2.2M19 8.5l2-1M17 12.5l2.2 1M13 9.5l1.5-1.5",
    smoke: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM5.8 18.2L18.2 5.8",
    shoe: "M3 17h11.5l3.5-2 3 1.2V19H3zM6.5 17v-5.5l3.2 1.4 2 2.1",
    lock: "M5.5 11h13v9.5h-13zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
    shield: "M12 3.2l7 3v5.3c0 4.8-3 7.9-7 9.5-4-1.6-7-4.7-7-9.5V6.2z",
    star: "M12 3.2l2.7 5.7 6.1.8-4.5 4.2 1.2 6.1L12 17.1 6.5 20l1.2-6.1L3.2 9.7l6.1-.8z",
    sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    chevron: "M6 9.5l6 6 6-6",
    chevronLeft: "M15 5.5l-6.5 6.5L15 18.5",
    chevronRight: "M9 5.5l6.5 6.5L9 18.5",
    image: "M4 5h16v14H4zM4 16l4.5-4.5 3 3L16 10l4 4.5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z",
    bulb: "M9.5 18.5h5M10.5 21.5h3M12 3a6 6 0 0 1 3.8 10.6V16.5h-7.6v-2.9A6 6 0 0 1 12 3z",
    printer: "M7 8.5V4h10v4.5M7 16.5H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14.5h10V21H7z",
    marker: "M12 21.5s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
    logo: "M2.5 20l6.5-11.5 3.6 6.3 2.1-3.4L21.5 20zM9 8.5L12.5 3l3.7 6.3",
    quote: "M9 11H5.5V7.5H9zM18.5 11H15V7.5h3.5zM9 11c0 3.5-1.5 5-3.5 5.5M18.5 11c0 3.5-1.5 5-3.5 5.5"
  };

  function icon(name, opts) {
    var d = PATHS[name] || PATHS.check;
    var o = opts || {};
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", o.fill || "none");
    svg.setAttribute("stroke", o.fill ? "none" : "currentColor");
    svg.setAttribute("stroke-width", o.width || "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (o.class) svg.setAttribute("class", o.class);
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    if (o.fill) p.setAttribute("fill", "currentColor");
    svg.appendChild(p);
    return svg;
  }

  /* --- Språk og tema ------------------------------------------------ */

  var LANG_KEY = "vc-lang";
  var THEME_KEY = "vc-theme";

  function pickLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "no" || q === "en") return q;
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === "no" || saved === "en") return saved;
    var nav = (navigator.language || "en").toLowerCase();
    return (nav.indexOf("nb") === 0 || nav.indexOf("nn") === 0 || nav.indexOf("no") === 0) ? "no" : "en";
  }

  var lang = pickLang();
  var T = S[lang];

  function setLang(next) {
    if (next === lang) return;
    localStorage.setItem(LANG_KEY, next);
    var url = new URL(location.href);
    url.searchParams.delete("lang");
    location.href = url.toString();
  }

  function applyTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme");
    if (!current) {
      current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  }

  applyTheme();
  document.documentElement.lang = lang === "no" ? "no" : "en";

  /* --- Bilder med plassholder --------------------------------------- */

  function placeholder() {
    return el("div", { class: "ph" }, [icon("image"), el("span", { text: T.common.imagePlaceholder })]);
  }

  function picture(src, alt, cls) {
    if (!src) return placeholder();
    var img = el("img", { src: src, alt: alt || "", loading: "lazy", class: cls || null });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.replaceChild(placeholder(), img);
    });
    return img;
  }

  // Toppbildet: mangler filen, faller vi tilbake på fjellgradienten i CSS
  function heroImage() {
    var img = el("img", { src: S.media.hero, alt: "" });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    });
    return img;
  }

  /* --- Toppmeny og bunntekst ---------------------------------------- */

  var PAGES = [
    { key: "home", href: "index.html", label: function () { return T.nav.home; } },
    { key: "manual", href: "husmanual.html", label: function () { return T.nav.manual; } },
    { key: "rules", href: "husregler.html", label: function () { return T.nav.rules; } },
    { key: "area", href: "omradet.html", label: function () { return T.nav.area; } }
  ];

  var page = document.body.dataset.page || "home";

  function buildHeader() {
    var nav = el("nav", { class: "nav", id: "site-nav" },
      PAGES.map(function (p) {
        return el("a", {
          href: p.href,
          text: p.label(),
          "aria-current": p.key === page ? "page" : null
        });
      }).concat([
        el("a", { class: "btn btn-primary btn-sm nav-book-desktop", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.nav.book })
      ])
    );

    var toggle = el("button", {
      class: "icon-btn nav-toggle", type: "button",
      "aria-label": T.common.openMenu, "aria-expanded": "false", "aria-controls": "site-nav"
    }, [icon("menu")]);

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.replaceChildren(icon(open ? "close" : "menu"));
    });

    var langSwitch = el("div", { class: "lang-switch", role: "group", "aria-label": T.common.langLabel }, [
      el("button", { type: "button", text: "NO", "aria-pressed": String(lang === "no"), onclick: function () { setLang("no"); } }),
      el("button", { type: "button", text: "EN", "aria-pressed": String(lang === "en"), onclick: function () { setLang("en"); } })
    ]);

    var themeBtn = el("button", {
      class: "icon-btn theme-btn", type: "button", "aria-label": T.common.themeLabel, onclick: toggleTheme
    }, [icon("sun", { class: "icon-sun" }), icon("moon", { class: "icon-moon" })]);

    var header = el("header", { class: "site-header" }, [
      el("div", { class: "wrap" }, [
        el("a", { class: "brand", href: "index.html" }, [
          icon("logo"),
          el("span", {}, [
            document.createTextNode(S.meta.siteName),
            el("small", { text: S.meta.address })
          ])
        ]),
        nav,
        el("div", { class: "header-tools" }, [langSwitch, themeBtn, toggle])
      ])
    ]);

    window.addEventListener("scroll", function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    }, { passive: true });

    return header;
  }

  function buildFooter() {
    var contact = [];
    if (S.meta.email) contact.push(el("li", {}, [el("a", { href: "mailto:" + S.meta.email, text: S.meta.email })]));
    if (S.meta.phone) contact.push(el("li", {}, [el("a", { href: "tel:" + S.meta.phone.replace(/\s/g, ""), text: S.meta.phone })]));
    contact.push(el("li", {}, [el("a", { href: S.meta.mapLink, target: "_blank", rel: "noopener", text: S.meta.address })]));

    return el("footer", { class: "site-footer" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "footer-grid" }, [
          el("div", {}, [
            el("a", { class: "brand", href: "index.html", style: "margin-bottom:14px" }, [
              icon("logo"), el("span", { text: S.meta.siteName })
            ]),
            el("p", { text: T.footer.about })
          ]),
          el("div", {}, [
            el("h3", { text: T.footer.linksTitle }),
            el("ul", {}, PAGES.map(function (p) {
              return el("li", {}, [el("a", { href: p.href, text: p.label() })]);
            }))
          ]),
          el("div", {}, [
            el("h3", { text: T.footer.contactTitle }),
            el("ul", {}, contact)
          ]),
          el("div", {}, [
            el("h3", { text: T.footer.bookTitle }),
            el("p", { text: T.footer.bookText }),
            el("a", { class: "btn btn-ghost btn-sm", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.nav.book })
          ])
        ]),
        el("div", { class: "footer-bottom" }, [
          el("span", { text: "© " + new Date().getFullYear() + " " + S.meta.siteName + ". " + T.footer.rights }),
          el("span", { text: (T.host && T.host.name) || S.meta.hostName })
        ])
      ])
    ]);
  }

  /* --- Gjenbrukbare byggeklosser ------------------------------------ */

  function sectionHead(title, subtitle, center) {
    return el("div", { class: "section-head" + (center ? " center" : "") }, [
      el("h2", { text: title }),
      subtitle ? el("p", { text: subtitle }) : null
    ]);
  }

  function ctaBand() {
    return el("section", { class: "cta-band" }, [
      el("div", { class: "wrap" }, [
        el("h2", { text: T.cta.title }),
        el("p", { text: T.cta.text }),
        el("a", { class: "btn", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.cta.button })
      ])
    ]);
  }

  function pageHead(title, intro) {
    return el("section", { class: "page-head" }, [
      el("div", { class: "wrap" }, [
        el("span", { class: "eyebrow", text: S.meta.siteName }),
        el("h1", { text: title }),
        el("p", { text: intro })
      ])
    ]);
  }

  /* --- Forsiden ------------------------------------------------------ */

  function renderHome(main) {
    var r = S.meta.rating;

    var hero = el("section", { class: "hero" }, [
      el("div", { class: "hero-media" }, [S.media.hero ? heroImage() : null]),
      el("div", { class: "wrap" }, [
        el("div", { class: "hero-inner" }, [
          el("span", { class: "eyebrow", text: T.hero.eyebrow }),
          r ? el("div", { class: "rating-badge" }, [
            icon("star", { fill: true }),
            document.createTextNode((lang === "no" ? r.score : (r.scoreEn || r.score)) + " "),
            el("span", { text: "· " + r.count + " " + (lang === "no" ? "anmeldelser" : "reviews") + " · " + (lang === "no" ? r.badgeNo : r.badgeEn) })
          ]) : null,
          el("h1", { text: T.hero.title }),
          el("p", { text: T.hero.subtitle }),
          el("div", { class: "hero-actions" }, [
            el("a", { class: "btn btn-primary", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.hero.ctaPrimary }),
            el("a", { class: "btn btn-light", href: "husmanual.html", text: T.hero.ctaSecondary })
          ])
        ])
      ])
    ]);

    var f = S.meta.facts;
    var facts = el("section", { class: "facts" }, [
      el("div", { class: "wrap" }, [
        el("ul", {}, [
          el("li", {}, [el("strong", { text: String(f.guests) }), el("span", { text: T.facts.guests })]),
          el("li", {}, [el("strong", { text: String(f.bedrooms) }), el("span", { text: T.facts.bedrooms })]),
          el("li", {}, [el("strong", { text: String(f.beds) }), el("span", { text: T.facts.beds })]),
          el("li", {}, [el("strong", { text: String(f.baths) }), el("span", { text: T.facts.baths })])
        ])
      ])
    ]);

    var about = el("section", { class: "section", id: "om" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "about-grid" }, [
          el("div", {}, [
            el("h2", { text: T.about.title }),
            el("p", { class: "lead", text: T.about.lead })
          ]),
          el("div", {}, T.about.paragraphs.map(function (p) { return el("p", { text: p }); }))
        ])
      ])
    ]);

    var highlights = el("section", { class: "section section-alt" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.highlights.title),
        el("div", { class: "card-grid" }, T.highlights.items.map(function (it) {
          return el("article", { class: "card reveal" }, [
            el("div", { class: "card-icon" }, [icon(it.icon)]),
            el("h3", { text: it.title }),
            el("p", { text: it.text })
          ]);
        }))
      ])
    ]);

    var sleeping = el("section", { class: "section", id: "soverom" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.sleeping.title, T.sleeping.subtitle),
        el("div", { class: "room-grid" }, T.sleeping.rooms.map(function (room) {
          return el("article", { class: "room" }, [
            icon("bed"),
            el("h3", { text: room.title }),
            el("p", { text: room.beds })
          ]);
        })),
        T.sleeping.note ? el("p", { class: "room-note", text: T.sleeping.note }) : null
      ])
    ]);

    var amenities = el("section", { class: "section section-alt", id: "fasiliteter" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.amenities.title, T.amenities.subtitle),
        el("div", { class: "amenity-groups" }, T.amenities.groups.map(function (g) {
          return el("div", {}, [
            el("h3", { text: g.title }),
            el("ul", {}, g.items.map(function (item) {
              return el("li", {}, [icon("check"), el("span", { text: item })]);
            }))
          ]);
        })),
        T.amenities.note ? el("div", { class: "note-box" }, [
          el("strong", { text: T.amenities.noteTitle }),
          el("p", { text: T.amenities.note })
        ]) : null
      ])
    ]);

    var gallery = el("section", { class: "section", id: "bilder" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.gallery.title, T.gallery.subtitle),
        buildGallery()
      ])
    ]);

    var reviews = el("section", { class: "section section-alt", id: "anmeldelser" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.reviews.title, T.reviews.subtitle),
        el("div", { class: "review-grid" }, T.reviews.items.map(function (rev) {
          var stars = el("div", { class: "stars", "aria-label": "5/5" });
          for (var i = 0; i < 5; i++) stars.appendChild(icon("star", { fill: true }));
          return el("article", { class: "review reveal" }, [
            stars,
            el("blockquote", { text: "“" + rev.text + "”" }),
            el("footer", {}, [el("strong", { text: rev.author }), el("span", { text: rev.meta })])
          ]);
        })),
        el("p", { style: "margin-top:24px" }, [
          el("a", { class: "btn btn-ghost btn-sm", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.reviews.cta })
        ])
      ])
    ]);

    var location = el("section", { class: "section", id: "beliggenhet" }, [
      el("div", { class: "wrap" }, [
        sectionHead(T.location.title),
        el("div", { class: "location-grid" }, [
          el("div", {}, [
            el("p", { class: "lead", text: T.location.text }),
            el("h3", { style: "margin-top:28px", text: T.location.distancesTitle }),
            el("ul", { class: "distances" }, T.location.distances.map(function (d) {
              return el("li", {}, [el("strong", { text: d.label }), el("span", { text: d.value })]);
            })),
            el("p", { style: "margin-top:22px" }, [
              el("a", { class: "btn btn-ghost btn-sm", href: S.meta.mapLink, target: "_blank", rel: "noopener" }, [
                icon("marker"), document.createTextNode(T.location.mapCta)
              ])
            ])
          ]),
          el("div", { class: "map-frame" }, [
            S.meta.mapEmbed
              ? el("iframe", { src: S.meta.mapEmbed, loading: "lazy", title: T.location.title, referrerpolicy: "no-referrer-when-downgrade", allowfullscreen: "" })
              : placeholder()
          ])
        ])
      ])
    ]);

    var host = el("section", { class: "section section-alt", id: "vertskap" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "host-card" }, [
          el("div", { class: "host-avatar", text: T.host.name.charAt(0) }),
          el("div", {}, [
            el("span", { class: "host-badge" }, [icon("star", { fill: true }), document.createTextNode(T.host.badge)]),
            el("h2", { text: T.host.name }),
            el("p", { text: T.host.text }),
            el("div", { class: "host-stats" }, T.host.stats.map(function (s) {
              return el("div", {}, [el("strong", { text: s.value }), el("span", { text: s.label })]);
            }))
          ])
        ])
      ])
    ]);

    main.appendChild(frag([hero, facts, about, highlights, sleeping, amenities, gallery, reviews, location, host, ctaBand()]));
  }

  /* --- Galleri og lightbox ------------------------------------------ */

  var galleryItems = [];

  function buildGallery() {
    galleryItems = (S.media.gallery || []).map(function (g) {
      return { src: g.src, caption: lang === "no" ? g.captionNo : g.captionEn };
    });

    var grid = el("div", { class: "gallery" }, galleryItems.map(function (item, i) {
      return el("button", { type: "button", onclick: function () { openLightbox(i); } }, [
        picture(item.src, item.caption),
        item.caption ? el("figcaption", { text: item.caption }) : null
      ]);
    }));
    return grid;
  }

  var lb, lbImg, lbCap, lbIndex = 0;

  function ensureLightbox() {
    if (lb) return;
    lbImg = el("img", { alt: "" });
    lbCap = el("figcaption");
    lb = el("div", { class: "lightbox", role: "dialog", "aria-modal": "true" }, [
      el("button", { class: "icon-btn", type: "button", "aria-label": T.common.close, onclick: closeLightbox }, [icon("close")]),
      el("button", { class: "icon-btn lightbox-nav lightbox-prev", type: "button", "aria-label": "‹", onclick: function (e) { e.stopPropagation(); step(-1); } }, [icon("chevronLeft")]),
      el("button", { class: "icon-btn lightbox-nav lightbox-next", type: "button", "aria-label": "›", onclick: function (e) { e.stopPropagation(); step(1); } }, [icon("chevronRight")]),
      el("figure", { style: "margin:0" }, [lbImg, lbCap])
    ]);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.body.appendChild(lb);
  }

  function openLightbox(i) {
    ensureLightbox();
    lbIndex = i;
    var item = galleryItems[i];
    lbImg.src = item.src;
    lbImg.alt = item.caption || "";
    lbCap.textContent = item.caption || "";
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function step(delta) {
    if (!galleryItems.length) return;
    openLightbox((lbIndex + delta + galleryItems.length) % galleryItems.length);
  }

  document.addEventListener("keydown", function (e) {
    if (!lb || !lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* --- Husmanual ----------------------------------------------------- */

  function mediaBlock(section) {
    if (section.video) {
      var v = section.video;
      var isEmbed = /youtube|youtu\.be|vimeo/.test(v);
      if (isEmbed) {
        var src = v;
        var yt = v.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
        if (yt) src = "https://www.youtube-nocookie.com/embed/" + yt[1];
        var vi = v.match(/vimeo\.com\/(\d+)/);
        if (vi) src = "https://player.vimeo.com/video/" + vi[1];
        return el("div", { class: "acc-media" }, [
          el("iframe", { src: src, title: section.title, loading: "lazy", allowfullscreen: "" })
        ]);
      }
      return el("div", { class: "acc-media" }, [
        el("video", { src: v, controls: "", preload: "metadata", playsinline: "" })
      ]);
    }
    if (section.image) return el("div", { class: "acc-media" }, [picture(section.image, section.title)]);
    return null;
  }

  function copyRow(label, value) {
    var btn = el("button", { class: "copy-btn", type: "button", text: T.manual.wifiCopy });
    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = T.manual.wifiCopied;
        btn.classList.add("is-done");
        setTimeout(function () { btn.textContent = T.manual.wifiCopy; btn.classList.remove("is-done"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {});
      } else {
        var ta = el("textarea", { style: "position:fixed;opacity:0" });
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (err) {}
        document.body.removeChild(ta);
      }
    });
    return el("div", { class: "info-row" }, [
      el("span", { text: label }),
      el("strong", { text: value }),
      btn
    ]);
  }

  function renderManual(main) {
    var m = T.manual;

    var info = el("div", { class: "info-strip" }, [
      el("div", { class: "info-card" }, [
        el("h3", { text: m.wifiTitle }),
        copyRow(m.wifiNetwork, S.meta.wifi.ssid),
        copyRow(m.wifiPassword, S.meta.wifi.password)
      ]),
      el("div", { class: "info-card" }, [
        el("h3", { text: m.checkInLabel + " / " + m.checkOutLabel }),
        el("div", { class: "info-row" }, [el("span", { text: m.checkInLabel }), el("strong", { text: S.meta.checkIn })]),
        el("div", { class: "info-row" }, [el("span", { text: m.checkOutLabel }), el("strong", { text: S.meta.checkOut })])
      ]),
      el("div", { class: "info-card" }, [
        el("h3", { text: m.emergencyTitle }),
        el("ul", { class: "emergency" }, S.meta.emergency.map(function (e) {
          return el("li", {}, [el("span", { text: e.label }), el("strong", { text: e.value })]);
        }))
      ])
    ]);

    var head = pageHead(m.title, m.intro);
    head.querySelector(".wrap").appendChild(info);

    var accordion = el("div", { class: "accordion" }, m.sections.map(function (s, i) {
      return el("details", { class: "acc-item", id: s.id, open: i === 0 ? "" : null }, [
        el("summary", { class: "acc-head" }, [
          el("span", { class: "card-icon" }, [icon(s.icon)]),
          el("h2", { text: s.title }),
          icon("chevron", { class: "acc-chevron" })
        ]),
        el("div", { class: "acc-body" }, [
          mediaBlock(s),
          frag((s.paragraphs || []).map(function (p) { return el("p", { text: p }); })),
          (s.steps && s.steps.length)
            ? el("ol", { class: "steps" }, s.steps.map(function (st) { return el("li", { text: st }); }))
            : null,
          s.tip ? el("div", { class: "tip" }, [icon("bulb"), el("p", { text: s.tip })]) : null
        ])
      ]);
    }));

    var body = el("section", { class: "section" }, [
      el("div", { class: "wrap" }, [
        accordion,
        el("div", { class: "manual-actions" }, [
          el("button", { class: "btn btn-ghost", type: "button", onclick: function () { window.print(); } }, [
            icon("printer"), document.createTextNode(m.printCta)
          ]),
          el("a", { class: "btn btn-ghost", href: "husregler.html", text: T.nav.rules })
        ])
      ])
    ]);

    main.appendChild(frag([head, body]));
  }

  /* --- Husregler ------------------------------------------------------ */

  function renderRules(main) {
    var r = T.rules;

    var list = el("section", { class: "section" }, [
      el("div", { class: "wrap" }, [
        sectionHead(r.keyPointsTitle),
        el("div", { class: "rule-list" }, r.items.map(function (item) {
          return el("article", { class: "rule reveal" }, [
            el("span", { class: "card-icon" }, [icon(item.icon)]),
            el("div", {}, [el("h3", { text: item.title }), el("p", { text: item.text })])
          ]);
        }))
      ])
    ]);

    var more = el("section", { class: "section section-alt" }, [
      el("div", { class: "wrap wrap-narrow" }, [
        sectionHead(r.moreTitle),
        el("ul", { class: "check-list" }, r.more.map(function (t) {
          return el("li", {}, [icon("check"), el("span", { text: t })]);
        }))
      ])
    ]);

    var contact = el("section", { class: "section" }, [
      el("div", { class: "wrap" }, [
        el("div", { class: "contact-box" }, [
          el("div", {}, [el("h2", { text: r.contactTitle }), el("p", { text: r.contactText })]),
          el("a", { class: "btn btn-primary", href: S.meta.airbnbUrl, target: "_blank", rel: "noopener", text: T.nav.book })
        ])
      ])
    ]);

    main.appendChild(frag([pageHead(r.title, r.intro), list, more, contact]));
  }

  /* --- Området -------------------------------------------------------- */

  function renderArea(main) {
    var a = T.area;

    var body = el("section", { class: "section" }, [
      el("div", { class: "wrap" }, a.categories.map(function (cat) {
        return el("div", { class: "area-block" }, [
          el("h2", { text: cat.title }),
          el("div", { class: "area-list" }, cat.items.map(function (item) {
            return el("article", { class: "area-item reveal" }, [
              el("div", { class: "area-item-head" }, [
                el("h3", { text: item.name }),
                item.meta ? el("span", { class: "meta", text: item.meta }) : null
              ]),
              el("p", { text: item.desc })
            ]);
          }))
        ]);
      }))
    ]);

    main.appendChild(frag([pageHead(a.title, a.intro), body, ctaBand()]));
  }

  /* --- Oppstart -------------------------------------------------------- */

  function revealAll() {
    document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-visible"); });
  }

  function reveal() {
    document.documentElement.classList.add("js");
    var items = document.querySelectorAll(".reveal");
    // Ved utskrift og søk i siden skal alt være synlig
    window.addEventListener("beforeprint", revealAll);
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  }

  function init() {
    document.title = (page === "home" ? T.hero.title : T[pageTitleKey()].title) + " · " + S.meta.siteName;

    var main = document.getElementById("main");
    document.body.insertBefore(buildHeader(), main);

    if (page === "manual") renderManual(main);
    else if (page === "rules") renderRules(main);
    else if (page === "area") renderArea(main);
    else renderHome(main);

    document.body.appendChild(buildFooter());
    reveal();

    // Åpne riktig punkt i manualen hvis noen deler en lenke med #id
    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target && target.tagName === "DETAILS") {
        target.open = true;
        target.scrollIntoView({ block: "start" });
      }
    }
  }

  function pageTitleKey() {
    return page === "manual" ? "manual" : page === "rules" ? "rules" : "area";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
