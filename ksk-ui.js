/**
 * KSK i18n + Sidebar Module
 * Include this script in every page: <script src="/ksk-ui.js"></script>
 * Then call: KSK.init('deck') — pass the active page key
 */

const KSK = (() => {
  // ── SVG Icons ─────────────────────────────────────────────────────────────
  const ICONS = {
    dashboard: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
    customdeck: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>`,
    deck: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    phone: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>`,
    obs: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2" ry="2"/></svg>`,
    kd: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    patreon: `<svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.2-3.22-7.2-7.18 0-3.97 3.23-7.21 7.2-7.21M2 21.6h3.5V2.4H2V21.6z"/></svg>`,
    saweria: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    topup: `<svg width="15" height="15" viewBox="0 0 530 530" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M327.337 199.224C339.692 182.592 348.102 160.936 348.102 138.877C348.102 92.5591 311.023 62 278.214 62C245.406 62 211.82 99.548 211.82 145.866C211.82 172.562 222.978 196.345 238.712 211.704C202.048 192.521 180.712 182.625 141.933 166.834C116.163 213.784 109.89 243.438 110.483 303.115C154.603 300.908 176.087 294.322 211.821 278.655C175.711 333.078 150.501 361.026 100 407.947C117.277 415.627 141.133 415.074 164.933 414.521C185.533 414.044 206.091 413.567 222.304 418.431C257.248 428.914 274.697 440.008 295.687 467.352C323.301 390.021 330.921 344.234 327.136 257.688C357.189 271.088 374.053 276.88 404.013 278.655C438.768 222.109 433.512 147.383 417.991 156.35C417.991 156.35 365.272 173.638 327.337 199.224Z" fill="currentColor"/></svg>`,
    trash: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>`,
    lang: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    facebook: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    discord: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
    tiktok: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>`,
    instagram: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    youtube: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>`,
    twitter: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    contact: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let _lang = {};
  let _langCode = 'id';
  let _activePage = 'dashboard';
  const LANG_KEY = 'ksk_lang';

  // ── Load Language ──────────────────────────────────────────────────────────
  async function loadLang(code) {
    try {
      const r = await fetch(`/lang/${code}.json`);
      if (!r.ok) throw new Error('not found');
      _lang = await r.json();
      _langCode = code;
      localStorage.setItem(LANG_KEY, code);
    } catch {
      // fallback to id
      try {
        const r = await fetch('/lang/id.json');
        _lang = await r.json();
        _langCode = 'id';
      } catch {}
    }
  }

  function t(key) { return _lang[key] || key; }

  // ── Sidebar HTML ───────────────────────────────────────────────────────────
  function sidebarHTML() {
    const pages = [
      { key: 'dashboard', href: '/', label: t('nav_dashboard'), icon: ICONS.dashboard },
      { key: 'customdeck', href: '/customdeck.html', label: t('nav_custom_deck'), icon: ICONS.customdeck },
      { key: 'deck', href: '/deck.html', label: t('nav_deck_view'), icon: ICONS.deck },
    ];
    // Connect to phone — only on dashboard (calls JS function)
    const connectItem = _activePage === 'dashboard'
      ? `<a href="#" class="nav-item" onclick="closeSidebar();openConnect();return false;">${ICONS.phone}${t('nav_connect_phone')}</a>`
      : '';
    const obsItem = `<a href="/obs.html" target="_blank" class="nav-item">${ICONS.obs}${t('nav_obs_overlay')}</a>`;

    const kdItem = _activePage === 'dashboard'
      ? `<a class="nav-item" onclick="closeSidebar();openKDSetup();return false;" style="cursor:pointer;">${ICONS.kd}${t('nav_kd_counter')}</a>`
      : `<a href="/" class="nav-item">${ICONS.kd}${t('nav_kd_counter')}</a>`;

    const navLinks = pages.map(p =>
      `<a href="${p.href}" class="nav-item${_activePage === p.key ? ' active' : ''}">${p.icon}${p.label}</a>`
    ).join('');

    // Contact social icons row
    const socials = [
      { href: 'https://www.facebook.com/Kurohiko.id/', icon: ICONS.facebook, label: 'Facebook', color: '#1877f2' },
      { href: 'https://discord.gg/nRMnWfQFAV', icon: ICONS.discord, label: 'Discord', color: '#5865f2' },
      { href: 'https://www.tiktok.com/@kurohiko', icon: ICONS.tiktok, label: 'TikTok', color: '#e4e4f0' },
      { href: 'https://www.instagram.com/kurohiko_id/', icon: ICONS.instagram, label: 'Instagram', color: '#e1306c' },
      { href: 'https://www.youtube.com/@Kurohiko', icon: ICONS.youtube, label: 'YouTube', color: '#ff0000' },
      { href: 'https://x.com/Kurohiko_id', icon: ICONS.twitter, label: 'X / Twitter', color: '#e4e4f0' },
    ];
    const socialBtns = socials.map(s =>
      `<a href="${s.href}" target="_blank" title="${s.label}"
        style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:5px;background:rgba(255,255,255,.05);border:1px solid var(--bd2);color:${s.color};transition:all .15s;text-decoration:none;"
        onmouseover="this.style.borderColor='${s.color}';this.style.background='${s.color}22'"
        onmouseout="this.style.borderColor='';this.style.background='rgba(255,255,255,.05)'">${s.icon}</a>`
    ).join('');

    // Language switcher
    const langs = [
      { code: 'id', flag: '🇮🇩', name: 'Indonesia' },
      { code: 'en', flag: '🇬🇧', name: 'English' },
    ];
    const langBtns = langs.map(l =>
      `<button onclick="KSK.switchLang('${l.code}')"
        style="flex:1;padding:5px 4px;border-radius:5px;font-size:.58rem;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;
          background:${_langCode===l.code?'var(--ac)':'var(--s3)'};
          color:${_langCode===l.code?'#000':'var(--tx2)'};
          border:1px solid ${_langCode===l.code?'var(--ac)':'var(--bd2)'};
          ">${l.flag} ${l.name}</button>`
    ).join('');

    const langSection = `
      <div style="padding:10px 14px;border-top:1px solid var(--bd);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:var(--tx3);display:flex;align-items:center;">${ICONS.lang.replace('16','13').replace('height="16"','height="13"')}</span>
          <span style="font-size:.54rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tx3);">${t('nav_language')}</span>
        </div>
        <div style="display:flex;gap:5px;">${langBtns}</div>
      </div>`;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;border-bottom:1px solid var(--bd);">
        <div style="font-size:.72rem;font-weight:900;letter-spacing:1px;line-height:1.3;font-family:'Syne',sans-serif;">KUROHIKO<span style="color:var(--ac);display:block;">STREAM KIT AIO</span></div>
        <button onclick="closeSidebar()" style="background:none;border:1px solid var(--bd2);color:var(--tx2);width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:.8rem;">✕</button>
      </div>
      <nav style="flex:1;padding:8px 0;overflow-y:auto;min-height:0;">
        ${navLinks}
        ${connectItem}
        ${obsItem}
        <div class="nav-sep"></div>
        <div style="padding:8px 18px 4px;font-size:.54rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tx3);">${t('nav_more_tools')}</div>
        ${kdItem}
      </nav>
      <div style="flex-shrink:0;border-top:1px solid var(--bd);">
        <div style="padding:8px 18px 4px;font-size:.54rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tx3);">${t('nav_support_us')}</div>
        <a href="https://www.patreon.com/kurohiko_id" target="_blank" class="nav-item" style="color:#ff5664;">${ICONS.patreon}${t('nav_patreon')}</a>
        <a href="https://saweria.co/kurohiko" target="_blank" class="nav-item" style="color:#f5a623;">${ICONS.saweria}${t('nav_saweria')}</a>
        <a href="https://KurohikoTopUp.com" target="_blank" class="nav-item" style="color:var(--ac);">${ICONS.topup}${t('nav_topup')}</a>
        <div class="nav-sep"></div>
        <div style="padding:4px 18px 4px;font-size:.54rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tx3);">${t('nav_contact_us')}</div>
        <div style="padding:6px 18px 8px;display:flex;flex-wrap:wrap;gap:6px;">${socialBtns}</div>
      </div>
      ${langSection}`;
  }

  // ── Inject Sidebar ─────────────────────────────────────────────────────────
  function injectSidebar() {
    const aside = document.getElementById('sidebar');
    if (aside) aside.innerHTML = sidebarHTML();
    // Override active color untuk customdeck (merah)
    let styleEl = document.getElementById('ksk-sidebar-accent');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'ksk-sidebar-accent'; document.head.appendChild(styleEl); }
    const accentCSS = _activePage === 'customdeck'
      ? '.nav-item.active{color:#ef4444!important;}.nav-item.active::before{background:#ef4444!important;}'
      : '';
    // Scrollbar tipis untuk sidebar
    const scrollCSS = `
      #sidebar::-webkit-scrollbar{width:3px;}
      #sidebar::-webkit-scrollbar-track{background:transparent;}
      #sidebar::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px;}
      #sidebar::-webkit-scrollbar-thumb:hover{background:var(--bd3);}
      #sidebar nav::-webkit-scrollbar{width:3px;}
      #sidebar nav::-webkit-scrollbar-track{background:transparent;}
      #sidebar nav::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px;}
    `;
    styleEl.textContent = accentCSS + scrollCSS;
  }

  // ── Switch Language ────────────────────────────────────────────────────────
  async function switchLang(code) {
    await loadLang(code);
    injectSidebar();
    applyPageStrings();
  }

  // ── Apply strings to page elements ─────────────────────────────────────────
  // Pages use data-i18n="key" attribute for dynamic text replacement
  function applyPageStrings() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
        el.placeholder = val;
      } else {
        el.innerHTML = val;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
  }

  // ── Public Init ────────────────────────────────────────────────────────────
  async function init(activePage) {
    _activePage = activePage || 'dashboard';
    const saved = localStorage.getItem(LANG_KEY) || 'id';
    await loadLang(saved);
    injectSidebar();
    applyPageStrings();
  }

  return { init, switchLang, t, applyPageStrings };
})();