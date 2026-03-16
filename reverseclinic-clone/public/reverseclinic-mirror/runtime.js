(function () {
  function toggleClass(selector, className) {
    var node = document.querySelector(selector);
    if (!node) {
      return;
    }

    node.classList.toggle(className);
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest(".btn-dropdown")) {
      event.preventDefault();
      toggleClass(".language", "show");
      return;
    }

    if (target.closest(".header .network > button") || target.closest(".header .network > a")) {
      event.preventDefault();
      toggleClass(".header .network", "show");
      return;
    }

    if (target.closest(".mmn")) {
      event.preventDefault();
      toggleClass(".totalmenu", "is-open");
      return;
    }

    if (target.closest(".close_top")) {
      event.preventDefault();
      var banner = document.querySelector(".event_top");
      if (banner instanceof HTMLElement) {
        banner.style.display = "none";
      }
      return;
    }

    if (target.closest(".rnb-top")) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  });

  document.addEventListener("mouseover", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("a.tmn") || target.closest(".tmn")) {
      var totalMenu = document.querySelector(".totalmenu");
      if (totalMenu instanceof HTMLElement && !totalMenu.classList.contains("is-open")) {
        totalMenu.style.height = "inherit";
      }
    }
  });

  document.addEventListener("mouseout", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest(".totalmenu")) {
      var totalMenu = document.querySelector(".totalmenu");
      if (totalMenu instanceof HTMLElement && !totalMenu.classList.contains("is-open")) {
        totalMenu.style.height = "0";
      }
    }
  });

  document.addEventListener("submit", function (event) {
    var target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }

    if (target.action && target.action.indexOf("__db__=y") >= 0) {
      event.preventDefault();
      window.alert("로컬 미러에서는 상담 접수가 비활성화되어 있습니다.");
    }
  });
})();
