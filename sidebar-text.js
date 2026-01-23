(function () {
  function init() {
    const sidebars = document.querySelectorAll('.sidebar-pagina');
    if (!sidebars.length) return;

    sidebars.forEach(sidebar => {
      sidebar.insertAdjacentHTML('beforeend', `
        <hr class="doble">
        <h3>Ubicación</h3>
        <div class="d-inline-bloc text-capitalize">FCFM</div>
        <hr class="doble">
        <h3>Salón</h3>
        <div class="d-inline-bloc text-capitalize">Auditorio</div>
      `);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
