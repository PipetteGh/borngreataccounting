(function () {
  var DARK_THEMES = {
    midnight: true,
    dark: true,
    'emerald-dark': true,
    amethyst: true,
    amber: true,
    nord: true,
  };
  var VALID_THEMES = {
    light: true,
    midnight: true,
    dark: true,
    emerald: true,
    'emerald-dark': true,
    indigo: true,
    amethyst: true,
    crimson: true,
    amber: true,
    ocean: true,
    nord: true,
    slate: true,
  };

  var stored = localStorage.getItem('theme');
  var fallback = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'midnight'
    : 'light';
  var themeId = stored && VALID_THEMES[stored] ? stored : fallback;
  var isPaymentPortal = window.location.pathname.startsWith('/payment');

  document.documentElement.setAttribute('data-theme', themeId);

  if (DARK_THEMES[themeId] && !isPaymentPortal) {
    document.documentElement.classList.add('bp4-dark');
    if (document.body) document.body.classList.add('bp4-dark');
  } else {
    document.documentElement.classList.remove('bp4-dark');
    if (document.body) document.body.classList.remove('bp4-dark');
  }
})();
