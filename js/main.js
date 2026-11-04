/* =====================================================================
   ATG CaliFit – Interactivity
   Vanilla JS, no dependencies. Reads business data from SITE_CONFIG.
   ===================================================================== */
(() => {
  "use strict";

  const CFG = window.SITE_CONFIG || (typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG : {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enc = encodeURIComponent;

  const waNumber = String(CFG.whatsappNumber || "").replace(/\D/g, "");
  const waLink = (text) => `https://wa.me/${waNumber}?text=${enc(text)}`;

  document.documentElement.classList.remove("no-js");

  /* ---------- 1. Render config values ---------- */
  function applyConfig() {
    $$("[data-config-text]").forEach((el) => {
      const v = CFG[el.dataset.configText];
      if (v) el.textContent = v;
    });
    $$("[data-config-href]").forEach((el) => {
      const v = CFG[el.dataset.configHref];
      if (v) el.href = v;
    });

    // Address + map + directions
    if (CFG.address) {
      const addr = $("#contactAddress");
      if (addr && Array.isArray(CFG.addressLines)) {
        addr.innerHTML = CFG.addressLines.map(escapeHtml).join("<br>");
      }
      const dir = $("#directionsBtn");
      if (dir) dir.href = `https://www.google.com/maps/dir/?api=1&destination=${enc(CFG.address)}`;
      const map = $("#mapFrame");
      if (map) map.dataset.src = `https://www.google.com/maps?q=${enc(CFG.address)}&output=embed`;
    }

    // WhatsApp – only activated once a real number is configured
    const waFloat = $("#waFloat");
    const waBtn = $("#whatsappBtn");
    if (waNumber) {
      const href = waLink(CFG.whatsappMessage || "");
      [waFloat, waBtn].forEach((el) => { if (el) { el.href = href; el.hidden = false; } });
    } else {
      // No number yet: keep the floating button visible for the design, pointing to the contact form
      if (waFloat) { waFloat.href = "contact.html#contact"; waFloat.removeAttribute("target"); waFloat.hidden = false; }
      console.warn("[ATG CaliFit] WhatsApp is disabled: add SITE_CONFIG.whatsappNumber in js/config.js (country code, digits only) to enable the WhatsApp buttons.");
    }

    // Optional verified details: phone, email, timings, pricing
    const extra = $("#contactExtra");
    if (extra) {
      const rows = [];
      if (CFG.phone) rows.push(["Phone", `<a href="tel:${escapeHtml(CFG.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(CFG.phone)}</a>`]);
      if (CFG.email) rows.push(["Email", `<a href="mailto:${escapeHtml(CFG.email)}">${escapeHtml(CFG.email)}</a>`]);
      [CFG.classTimings, CFG.pricing].forEach((list) => {
        if (Array.isArray(list)) list.forEach((r) => r && r.label && rows.push([escapeHtml(r.label), escapeHtml(r.value || "")]));
      });
      if (rows.length) {
        extra.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
        extra.hidden = false;
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- 2. Hero video (supplied asset) ---------- */
  function setupHeroVideo() {
    if (!CFG.heroVideo) return;
    const media = $("#heroMedia");
    const img = media && $(".hero-img", media);

    // Video tile in the gallery (shares the lightbox)
    const grid = $("#galleryGrid");
    if (grid) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "g-item g-tall reveal";
      tile.dataset.lightbox = "gallery";
      tile.dataset.type = "video";
      tile.dataset.src = CFG.heroVideo;
      tile.dataset.caption = "Training at ATG CaliFit";
      tile.setAttribute("aria-label", "Play video: training at ATG CaliFit");
      // Thumbnail: the hero still when on the same page, else the clip's first frame
      const thumb = img
        ? `<img src="${img.currentSrc || img.src}" alt="" loading="lazy" decoding="async">`
        : `<video src="${CFG.heroVideo}#t=0.1" muted playsinline preload="metadata" aria-hidden="true"></video>`;
      tile.innerHTML = `${thumb}
        <span class="g-video-badge"><svg class="icon"><use href="#i-play"/></svg> Watch</span>`;
      grid.prepend(tile);
    }

    if (!media) return;
    if (reducedMotion) return; // keep the still image
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) return;

    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("aria-hidden", "true");
    if (img) video.poster = img.currentSrc || img.src;
    video.src = CFG.heroVideo;
    video.addEventListener("canplay", () => {
      video.classList.add("is-ready");
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }, { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
    media.insertBefore(video, $(".hero-overlay", media));
  }

  /* ---------- 3. Header: scroll state, active link ---------- */
  function setupHeader() {
    const header = $("#siteHeader");
    const toTop = $("#toTop");
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 80);
      if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight * 0.8);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        const brand = $(".brand");
        if (brand) brand.focus({ preventScroll: true });
      });
    }
    // Active nav link is marked per page in the HTML (aria-current="page")
  }

  /* ---------- 4. Mobile menu ---------- */
  function setupMenu() {
    const toggle = $("#menuToggle");
    const menu = $("#mobileMenu");
    const header = $("#siteHeader");
    if (!toggle || !menu) return;

    const focusables = () => $$("a, button", menu).concat(toggle);

    const open = () => {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      header.classList.add("menu-open");
      document.body.classList.add("no-scroll");
      const first = $("a", menu);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 150);
    };
    const close = (returnFocus = true) => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      header.classList.remove("menu-open");
      document.body.classList.remove("no-scroll");
      if (returnFocus) toggle.focus({ preventScroll: true });
    };
    const isOpen = () => menu.classList.contains("is-open");

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) close(false);
      else if (e.target === menu) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") {
        const f = focusables();
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (mq) => {
      if (mq.matches && isOpen()) close(false);
    });
  }

  /* ---------- 5. Challenge list (from config) ---------- */
  function renderChallenge() {
    const list = $("#challengeList");
    if (!list) return;
    const items = Array.isArray(CFG.challenge) ? CFG.challenge : [];
    list.innerHTML = items.map((raw, i) => {
      const text = String(raw).trim();
      // Split leading quantity ("5", "1 Min") from the movement name
      const m = text.match(/^(\d+(?:\s*(?:min|mins|sec|secs|s|m)\b)?)\s+(.*)$/i);
      const qty = m ? m[1] : "";
      const what = m ? m[2] : text;
      return `<li class="challenge-item" style="--i:${i}">${qty ? `<span class="challenge-qty">${escapeHtml(qty)}</span>` : ""}<span class="challenge-what">${escapeHtml(what)}</span></li>`;
    }).join("");
  }

  /* ---------- 6. Scroll reveal + lazy map ---------- */
  function setupReveal() {
    const targets = $$(".reveal, .challenge-list");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      targets.forEach((el) => io.observe(el));
    }

    // Map iframe: only load when near the viewport
    const map = $("#mapFrame");
    if (map) {
      const load = () => { if (!map.src) map.src = map.dataset.src; };
      if ("IntersectionObserver" in window) {
        const mo = new IntersectionObserver((entries, obs) => {
          if (entries.some((e) => e.isIntersecting)) { load(); obs.disconnect(); }
        }, { rootMargin: "600px 0px" });
        mo.observe(map);
      } else load();
    }
  }

  /* ---------- 7. Lightbox ---------- */
  function setupLightbox() {
    const lb = $("#lightbox");
    if (!lb) return;
    const mediaBox = $("#lightboxMedia");
    const caption = $("#lightboxCaption");
    const count = $("#lightboxCount");
    const prevBtn = $(".lb-prev", lb);
    const nextBtn = $(".lb-next", lb);
    let group = [];
    let index = 0;
    let lastFocus = null;

    const show = (i) => {
      index = (i + group.length) % group.length;
      const item = group[index];
      const src = item.dataset.src;
      const cap = item.dataset.caption || "";
      const thumb = $("img", item);
      mediaBox.innerHTML = "";
      if (item.dataset.type === "video") {
        const v = document.createElement("video");
        v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.loop = true;
        v.setAttribute("playsinline", "");
        mediaBox.appendChild(v);
      } else {
        const img = new Image();
        img.alt = thumb ? thumb.alt : cap;
        img.decoding = "async";
        mediaBox.classList.add("is-loading");
        img.onload = img.onerror = () => mediaBox.classList.remove("is-loading");
        img.src = src;
        mediaBox.appendChild(img);
      }
      caption.textContent = cap;
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}`;
      const multi = group.length > 1;
      prevBtn.hidden = nextBtn.hidden = !multi;
      // Preload neighbours
      if (multi) [group[(index + 1) % group.length], group[(index - 1 + group.length) % group.length]]
        .forEach((n) => { if (n.dataset.type !== "video") { const p = new Image(); p.src = n.dataset.src; } });
    };

    const open = (trigger) => {
      group = $$(`[data-lightbox="${trigger.dataset.lightbox}"]`);
      lastFocus = trigger;
      lb.hidden = false;
      document.body.classList.add("no-scroll");
      requestAnimationFrame(() => lb.classList.add("is-open"));
      show(group.indexOf(trigger));
      $(".lb-close", lb).focus();
    };
    const close = () => {
      lb.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      const v = $("video", mediaBox); if (v) v.pause();
      setTimeout(() => { lb.hidden = true; mediaBox.innerHTML = ""; }, reducedMotion ? 0 : 250);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-lightbox]");
      if (trigger) { e.preventDefault(); open(trigger); }
    });
    lb.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    prevBtn.addEventListener("click", () => show(index - 1));
    nextBtn.addEventListener("click", () => show(index + 1));

    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "Tab") {
        const f = $$("button:not([hidden]), video[controls]", lb);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe
    let x0 = null, y0 = null;
    const stage = $(".lightbox-stage", lb);
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && group.length > 1) show(index + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
  }

  /* ---------- 7b. "Join ATG" opens the enquiry form in a popup ---------- */
  function setupEnquiryModal() {
    const modal = $("#enquiryModal");
    const panel = $("#enquiryModalPanel");
    const form = $("#enquiryForm");
    if (!modal || !panel || !form) return;
    // Marks the form's home (contact section, or the popup itself on other pages) so it can be put back on close
    const home = document.createComment("enquiry-form");
    let lastFocus = null;

    const open = (trigger) => {
      lastFocus = trigger;
      form.parentNode.insertBefore(home, form);
      form.classList.add("is-visible");
      panel.appendChild(form);
      modal.hidden = false;
      document.body.classList.add("no-scroll");
      requestAnimationFrame(() => modal.classList.add("is-open"));
      modal.scrollTop = 0;
      setTimeout(() => form.elements.fullName.focus({ preventScroll: true }), reducedMotion ? 0 : 200);
    };
    const close = () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      setTimeout(() => {
        modal.hidden = true;
        if (home.parentNode) { home.parentNode.insertBefore(form, home); home.remove(); }
      }, reducedMotion ? 0 : 250);
      if (lastFocus && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
    };

    $$("[data-enquiry]").forEach((btn) => btn.addEventListener("click", (e) => {
      e.preventDefault();
      // Let the mobile menu finish closing before opening
      setTimeout(() => open(btn), 0);
    }));
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "Tab") {
        const f = $$("button, input:not([tabindex='-1']), select, textarea, a[href]", panel).filter((el) => !el.disabled);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 8. Program CTAs pre-select the goal ---------- */
  function setupGoalLinks() {
    const select = $("#goal");
    if (!select) return;
    $$("[data-goal]").forEach((a) => a.addEventListener("click", () => {
      const opt = Array.from(select.options).find((o) => o.text === a.dataset.goal);
      if (opt) select.value = opt.value || opt.text;
    }));
  }

  /* ---------- 9. Enquiry form ---------- */
  function setupForm() {
    const form = $("#enquiryForm");
    if (!form) return;
    const status = $("#formStatus");
    const submitBtn = $("#submitBtn");
    const startedAt = Date.now();
    const MIN_FILL_MS = 3000;

    const rules = {
      fullName: (v) => {
        v = v.trim();
        if (!v) return "Please enter your full name.";
        if (v.length < 2) return "Name must be at least 2 characters.";
        if (!/^[\p{L}\s.'-]+$/u.test(v)) return "Please use letters only.";
        return "";
      },
      mobile: (v) => {
        const d = normaliseMobile(v);
        if (!v.trim()) return "Please enter your mobile number.";
        if (!/^[6-9]\d{9}$/.test(d)) return "Enter a valid 10-digit Indian mobile number starting with 6–9.";
        return "";
      },
      email: (v) => {
        v = v.trim();
        if (!v) return "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email address.";
        return "";
      },
      experience: () => (form.querySelector('input[name="experience"]:checked') ? "" : "Please choose your fitness experience."),
    };

    function normaliseMobile(v) {
      let d = String(v).replace(/\D/g, "");
      if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
      if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
      return d;
    }

    const fieldOf = (name) => {
      const input = form.elements[name];
      const el = input instanceof RadioNodeList ? input[0] : input;
      return el ? el.closest(".field") : null;
    };

    function validateField(name, show = true) {
      const input = form.elements[name];
      const value = input && "value" in input ? input.value : "";
      const msg = rules[name](value);
      const field = fieldOf(name);
      const err = $(`#${name}-err`);
      if (show && field) {
        field.classList.toggle("has-error", !!msg);
        field.classList.toggle("is-valid", !msg && !!String(value).trim() && name !== "experience");
        if (err) err.textContent = msg;
        const targets = input instanceof RadioNodeList ? Array.from(input) : [input];
        targets.forEach((t) => t && t.setAttribute("aria-invalid", msg ? "true" : "false"));
      }
      return !msg;
    }

    // Real-time validation: after first blur, validate as the user types
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      if (input instanceof RadioNodeList) {
        Array.from(input).forEach((r) => r.addEventListener("change", () => validateField(name)));
        return;
      }
      input.addEventListener("blur", () => { input.dataset.touched = "1"; validateField(name); });
      input.addEventListener("input", () => { if (input.dataset.touched) validateField(name); });
    });
    // Mobile: digits, spaces and leading + only
    form.elements.mobile.addEventListener("input", (e) => {
      const el = e.target;
      const cleaned = el.value.replace(/[^\d+\s-]/g, "");
      if (cleaned !== el.value) el.value = cleaned;
    });

    const setStatus = (type, html) => {
      const icon = type === "success" ? "i-check" : type === "error" ? "i-alert" : "i-alert";
      status.innerHTML = html ? `<div class="msg msg-${type}"><svg class="icon"><use href="#${icon}"/></svg><div>${html}</div></div>` : "";
    };
    const setLoading = (on) => {
      submitBtn.disabled = on;
      submitBtn.setAttribute("aria-busy", on ? "true" : "false");
      const label = $(".btn-label", submitBtn);
      label.textContent = on ? "Sending…" : "Start my journey";
      const icon = $(".icon, .spinner", submitBtn);
      if (icon) icon.outerHTML = on ? '<span class="spinner" aria-hidden="true"></span>' : '<svg class="icon"><use href="#i-arrow"/></svg>';
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", "");

      const names = Object.keys(rules);
      const results = names.map((n) => validateField(n));
      if (results.includes(false)) {
        const firstBad = names[results.indexOf(false)];
        const el = form.elements[firstBad];
        (el instanceof RadioNodeList ? el[0] : el).focus();
        setStatus("error", "Please fix the highlighted fields and try again.");
        return;
      }

      // Spam checks: honeypot + minimum time on form
      if (form.elements.company.value) { fakeSuccess(); return; }
      if (Date.now() - startedAt < MIN_FILL_MS) {
        setStatus("error", "That was quick! Please take a moment to review your details and submit again.");
        return;
      }

      const data = {
        fullName: form.elements.fullName.value.trim(),
        mobile: "+91 " + normaliseMobile(form.elements.mobile.value),
        email: form.elements.email.value.trim(),
        experience: form.querySelector('input[name="experience"]:checked').value,
        goal: form.elements.goal.value,
        message: form.elements.message.value.trim(),
        source: "atgcalifit.in enquiry form",
        submittedAt: new Date().toISOString(),
      };

      if (CFG.formEndpoint) {
        setLoading(true);
        try {
          const res = await fetch(CFG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          onSuccess(data);
        } catch (err) {
          setStatus("error", `Sorry, your enquiry couldn't be sent right now. Please try again, or message us on <a href="${escapeHtml(CFG.instagram || "#")}" target="_blank" rel="noopener">Instagram</a>.`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // No endpoint configured: hand off to WhatsApp, else point to Instagram
      if (waNumber) {
        const text = [
          `Hi ATG CaliFit! I'd like to start my journey.`,
          ``,
          `Name: ${data.fullName}`,
          `Mobile: ${data.mobile}`,
          data.email && `Email: ${data.email}`,
          `Experience: ${data.experience}`,
          data.goal && `Goal: ${data.goal}`,
          data.message && `Message: ${data.message}`,
        ].filter((l) => l !== false && l !== "").join("\n");
        window.open(waLink(text), "_blank", "noopener");
        setStatus("success", "Opening WhatsApp with your details — just hit send to complete your enquiry.");
        return;
      }

      setStatus("info", `Online enquiries are being set up. In the meantime, please send us a message on <a href="${escapeHtml(CFG.instagram || "#")}" target="_blank" rel="noopener">Instagram ${escapeHtml(CFG.instagramHandle || "")}</a> — we'd love to hear from you.`);
    });

    function onSuccess(data) {
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("is-valid", "has-error"));
      setStatus("success", `Thanks, ${escapeHtml(data.fullName.split(" ")[0])}! Your enquiry is in. We'll get back to you soon.`);
    }
    function fakeSuccess() {
      form.reset();
      setStatus("success", "Thanks! Your enquiry is in.");
    }
  }

  /* ---------- Init ---------- */
  applyConfig();
  setupHeroVideo();
  renderChallenge();
  setupHeader();
  setupMenu();
  setupReveal();
  setupLightbox();
  setupEnquiryModal();
  setupGoalLinks();
  setupForm();
})();
