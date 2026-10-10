/*!
 * Founder Files → company icons + company filter
 * Drop-in, framework-free. Works with server-rendered or React-rendered menus
 * (a MutationObserver enhances the menu whenever it mounts).
 *
 * Usage:
 *   <link rel="stylesheet" href="/founder-company-tags/founder-company-tags.css">
 *   <script src="/founder-company-tags/founder-company-tags.js" defer></script>
 *
 * Optional config (set BEFORE the script loads):
 *   window.FOUNDER_COMPANY_TAGS = {
 *     menu: '#founder-files-menu',            // selector for the dropdown panel (auto-detected if omitted)
 *     iconBase: '/founder-company-tags/icons' // where the SVGs live
 *   };
 */
(function () {
  'use strict';

  var cfg = window.FOUNDER_COMPANY_TAGS || {};
  var ICON_BASE = (cfg.iconBase || '/founder-company-tags/icons').replace(/\/$/, '');

  // Filter chips render in this order.
  var COMPANIES = [
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'xai', label: 'xAI / Grok' },
    { id: 'deepmind', label: 'DeepMind' },
    { id: 'ssi', label: 'SSI' },
    { id: 'blitzy', label: 'Blitzy' }
  ];

  // Who works where. Edit this list to add/move people — names are matched
  // loosely (case, accents, "Dr.", "Sir", ", PhD" and punctuation are ignored).
  var FOUNDERS = {
    anthropic: [
      'Daniela Amodei', 'Dario Amodei', 'Amanda Askell', 'Tom Brown',
      'Boris Cherny', 'Jack Clark', 'Jared Kaplan', 'Mike Krieger',
      'Joel Lewenstein', 'Benjamin Mann', 'Samuel McCandlish', 'Chris Olah'
    ],
    openai: ['Christopher Berner', 'Jakub Pachocki', 'Peter Steinberger'],
    xai: ['Ethan He'],
    deepmind: ['Demis Hassabis', 'John Jumper', 'Sergey Brin'],
    ssi: ['Ilya Sutskever'],
    blitzy: ['Brian Elliott', 'Sid Pardeshi']
  };

  if (cfg.founders) {
    Object.keys(cfg.founders).forEach(function (k) { FOUNDERS[k] = cfg.founders[k]; });
  }

  function norm(s) {
    return (s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/,?\s*ph\.?\s*d\.?/g, ' ')
      .replace(/\b(dr|sir)\b\.?/g, ' ')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var NAME_TO_CO = {};
  Object.keys(FOUNDERS).forEach(function (co) {
    FOUNDERS[co].forEach(function (n) { NAME_TO_CO[norm(n)] = co; });
  });

  var LABELS = {};
  COMPANIES.forEach(function (c) { LABELS[c.id] = c.label; });

  // --- find the dropdown --------------------------------------------------
  var HEAD_FIRST = /^a\s*[-–—]\s*d$/i;
  var HEAD_LAST = /^s\s*[-–—]\s*z$/i;

  function findMenu() {
    if (cfg.menu) return document.querySelector(cfg.menu);
    var tagged = document.querySelector('[data-founder-menu]');
    if (tagged) return tagged;
    // Auto-detect: the smallest element containing both the "A – D" and "S – Z" headings.
    var nodes = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,li,strong,small');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.children.length || !HEAD_FIRST.test(el.textContent.trim())) continue;
      for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        var hits = p.querySelectorAll('*');
        for (var j = 0; j < hits.length; j++) {
          if (!hits[j].children.length && HEAD_LAST.test(hits[j].textContent.trim())) return p;
        }
      }
    }
    return null;
  }

  // --- enhance ------------------------------------------------------------
  function badge(co) {
    var img = document.createElement('img');
    img.className = 'fct-icon';
    img.src = ICON_BASE + '/' + co + '.svg';
    img.alt = LABELS[co] || co;
    img.title = LABELS[co] || co;
    img.width = 16;
    img.height = 16;
    img.decoding = 'async';
    return img;
  }

  function enhance(menu) {
    if (!menu || menu.hasAttribute('data-fct')) return;
    menu.setAttribute('data-fct', '');

    var links = menu.querySelectorAll('a');
    var rows = [];
    var counts = {};
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var co = NAME_TO_CO[norm(a.textContent)];
      var row = a.closest('li') || a;
      rows.push({ row: row, co: co || null });
      if (co) {
        a.setAttribute('data-company', co);
        row.setAttribute('data-company', co);
        a.appendChild(badge(co));
        counts[co] = (counts[co] || 0) + 1;
      }
    }

    var bar = document.createElement('div');
    bar.className = 'fct-filter';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Filter founders by company');

    var title = document.createElement('span');
    title.className = 'fct-filter-label';
    title.textContent = 'Company';
    bar.appendChild(title);

    function chip(id, label, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fct-chip';
      b.setAttribute('data-filter', id);
      b.setAttribute('aria-pressed', id === 'all' ? 'true' : 'false');
      if (id !== 'all') b.appendChild(badge(id));
      b.appendChild(document.createTextNode(label));
      if (n != null) {
        var c = document.createElement('span');
        c.className = 'fct-count';
        c.textContent = n;
        b.appendChild(c);
      }
      return b;
    }

    bar.appendChild(chip('all', 'All'));
    COMPANIES.forEach(function (c) {
      if (counts[c.id]) bar.appendChild(chip(c.id, c.label, counts[c.id]));
    });

    menu.insertBefore(bar, menu.firstChild);
    // A single-row flex menu needs to wrap so the bar can sit above the columns.
    var cs = getComputedStyle(menu);
    if (cs.display.indexOf('flex') > -1 && cs.flexDirection.indexOf('row') === 0 && cs.flexWrap === 'nowrap') {
      menu.style.flexWrap = 'wrap';
    }

    function apply(id) {
      menu.setAttribute('data-fct-filter', id);
      rows.forEach(function (r) {
        r.row.hidden = id !== 'all' && r.co !== id;
      });
      var chips = bar.querySelectorAll('.fct-chip');
      for (var k = 0; k < chips.length; k++) {
        chips[k].setAttribute('aria-pressed', chips[k].getAttribute('data-filter') === id ? 'true' : 'false');
      }
    }

    // Clicks inside the dropdown must not bubble up and close it.
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.fct-chip');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      apply(btn.getAttribute('data-filter'));
    });
  }

  function run() { enhance(findMenu()); }

  // Re-check at most once per frame, and only while no enhanced menu is mounted.
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (!document.querySelector('[data-fct]')) run();
    });
  }

  function start() {
    run();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
