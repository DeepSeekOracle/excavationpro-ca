(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('local') !== '1' && !params.get('pair')) return;
    var code = (params.get('pair') || '').toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return;

    var bar = document.createElement('div');
    bar.id = 'lygo-local-banner';
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'position:fixed', 'left:16px', 'bottom:16px', 'z-index:9999',
      'max-width:420px', 'padding:12px 14px', 'border-radius:12px',
      'border:1px solid rgba(224,179,106,.6)', 'background:#0d1723',
      'color:#eaf1fa', 'box-shadow:0 12px 40px rgba(0,0,0,.6)',
      'font:13px/1.5 "Segoe UI",system-ui,sans-serif'
    ].join(';');

    var title = document.createElement('strong');
    title.textContent = 'Local engine ready';
    title.style.cssText = 'display:block;color:#e0b36a;font:600 11px/1.4 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px';

    var text = document.createElement('span');
    text.textContent = 'Pair code ' + code + '. Open the local engine inside the portal.';

    var link = document.createElement('a');
    link.href = '/portal/local/pair.html?code=' + encodeURIComponent(code);
    link.textContent = 'Use local engine →';
    link.style.cssText = 'display:inline-block;margin-top:8px;color:#5eead4;font-weight:600;text-decoration:none';

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss local engine notice');
    close.textContent = '×';
    close.style.cssText = 'float:right;border:0;background:transparent;color:#93a4ba;font-size:18px;line-height:1;cursor:pointer;padding:0 0 0 10px';
    close.onclick = function () { bar.remove(); };

    bar.appendChild(close);
    bar.appendChild(title);
    bar.appendChild(text);
    bar.appendChild(document.createElement('br'));
    bar.appendChild(link);
    document.body.appendChild(bar);
  } catch (_) { /* portal still works without the local banner */ }
})();
