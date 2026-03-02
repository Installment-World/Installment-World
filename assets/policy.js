(function () {
  var STORAGE_KEY = "iw_policy_lang";
  var SUPPORTED_LANGS = { ar: true, en: true };
  var html = document.documentElement;

  function getInitialLanguage() {
    var queryLanguage = new URLSearchParams(window.location.search).get("lang");
    if (SUPPORTED_LANGS[queryLanguage]) {
      return queryLanguage;
    }

    try {
      var storedLanguage = window.localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LANGS[storedLanguage]) {
        return storedLanguage;
      }
    } catch (error) {
      // Ignore storage failures.
    }

    return html.lang === "en" ? "en" : "ar";
  }

  function applyDirection(language) {
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
  }

  function applyDataLanguageBlocks(language) {
    var blocks = document.querySelectorAll("[data-lang]");
    blocks.forEach(function (block) {
      var isTargetLanguage = block.getAttribute("data-lang") === language;
      block.classList.toggle("is-hidden", !isTargetLanguage);
    });
  }

  function applyLegacyPrivacyBlocks(language) {
    var englishSections = document.querySelectorAll(".englishWrap");
    if (!englishSections.length) {
      return;
    }

    var main = document.querySelector("main");
    if (!main) {
      return;
    }

    var englishDivider = null;
    main.querySelectorAll(".divider").forEach(function (divider) {
      var dividerText = (divider.textContent || "").toLowerCase();
      if (dividerText.indexOf("english") >= 0) {
        englishDivider = divider;
      }
    });

    Array.from(main.children).forEach(function (child) {
      if (child.tagName === "FOOTER") {
        return;
      }

      var isEnglishChild = child.classList.contains("englishWrap") || child === englishDivider;
      child.classList.toggle("is-hidden", language === "ar" ? isEnglishChild : !isEnglishChild);
    });

    englishSections.forEach(function (section) {
      section.classList.toggle("is-hidden", language === "ar");
    });
  }

  function updateToggleLabel(language) {
    var button = document.getElementById("langToggle");
    if (!button) {
      return;
    }

    var targetLanguage = language === "ar" ? "en" : "ar";
    var code = button.querySelector(".lang-code");
    if (code) {
      code.textContent = targetLanguage.toUpperCase();
    }

    var label = targetLanguage === "en" ? "Switch to English" : "التبديل إلى العربية";
    button.setAttribute("aria-label", label);
  }

  function syncInternalLinks(language) {
    var anchors = document.querySelectorAll("a[href]");

    anchors.forEach(function (anchor) {
      var rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.charAt(0) === "#") {
        return;
      }

      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) {
        return;
      }

      var resolvedUrl;
      try {
        resolvedUrl = new URL(rawHref, window.location.href);
      } catch (error) {
        return;
      }

      if (resolvedUrl.origin !== window.location.origin) {
        return;
      }

      resolvedUrl.searchParams.set("lang", language);
      anchor.setAttribute("href", resolvedUrl.pathname + resolvedUrl.search + resolvedUrl.hash);
    });
  }

  function persistLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Ignore storage failures.
    }

    var url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function applyLanguage(language, shouldPersist) {
    var safeLanguage = SUPPORTED_LANGS[language] ? language : "ar";

    applyDirection(safeLanguage);
    applyDataLanguageBlocks(safeLanguage);
    applyLegacyPrivacyBlocks(safeLanguage);
    updateToggleLabel(safeLanguage);
    syncInternalLinks(safeLanguage);

    if (shouldPersist) {
      persistLanguage(safeLanguage);
    }
  }

  function wireToggle() {
    var button = document.getElementById("langToggle");
    if (!button) {
      return;
    }

    button.addEventListener("click", function () {
      var nextLanguage = html.lang === "ar" ? "en" : "ar";
      applyLanguage(nextLanguage, true);
    });
  }

  var initialLanguage = getInitialLanguage();
  wireToggle();
  applyLanguage(initialLanguage, true);
})();
