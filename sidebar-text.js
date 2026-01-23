(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function buildSidebar(sidebar) {

    sidebar.insertAdjacentHTML("beforeend", `
      <h3>Ubicación</h3>
      <div class="d-inline-bloc text-capitalize">FCFM</div>
      <hr class="doble">
      <h3>Salón</h3>
      <div class="d-inline-bloc text-capitalize">Auditorio</div>
    `);
  }

  ready(function () {
    document.querySelectorAll('.sidebar-pagina[data-sidebar="fcfm"]').forEach(buildSidebar);
  });
})();
