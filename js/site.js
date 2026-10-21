// 全站共用脚本：背景点阵、导航、滚动渐显、联系弹窗、主题与语言切换、作品页交互。
// 关于我 / 作品集两个页面都引用这一份；英文文案在 js/i18n.js。
(() => {
    const root = document.documentElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EMAIL = 'lyh021120@88.com';
    const THEME_COLOR = { aurora: '#09090b', paper: '#F2EDE3' };

    // 界面短文案（按钮标签、提示），正文翻译在 i18n.js
    const UI = {
        zh: {
            toPaper: '切换到纸墨主题', toAurora: '切换到暗夜极光主题',
            langBtn: 'EN', langLabel: 'Switch to English',
            modalLabel: '联系邮箱', copyLabel: '复制邮箱', copied: '邮箱已复制', copyFail: '复制失败，请手动选取邮箱',
            gameTitle: '合成小鸡（可试玩）',
        },
        en: {
            toPaper: 'Switch to Paper & Ink theme', toAurora: 'Switch to Midnight Aurora theme',
            langBtn: '中', langLabel: '切换到中文',
            modalLabel: 'Email address', copyLabel: 'Copy email', copied: 'Email copied', copyFail: 'Copy failed — please select the address manually',
            gameTitle: 'Chick Merge (playable)',
        },
    };

    const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    const theme = () => (root.dataset.theme === 'paper' ? 'paper' : 'aurora');
    let lang = root.lang === 'en' ? 'en' : 'zh';
    const ui = () => UI[lang];

    /* ---------- 1. 背景交互：暗夜极光 = 避让鼠标的点阵；纸墨 = 鼠标经过留下渐散的墨迹 ---------- */
    const canvas = document.getElementById('bgCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const SPACING = 40, RADIUS = 100, PUSH = 5, R = 1.5;
        const mouse = { x: -1e4, y: -1e4 };
        let dots = [], w = 0, h = 0, color = '', mode = 'dots';
        const blots = [];
        let lastInk = null, inkIdle = true;

        const readColor = () => {
            const css = getComputedStyle(root);
            color = css.getPropertyValue('--dot-color').trim() || 'rgba(148,163,184,0.25)';
            mode = css.getPropertyValue('--canvas-mode').trim() === 'ink' ? 'ink' : 'dots';
            blots.length = 0; lastInk = null;
        };
        // 墨点：落下后半径缓慢扩散、浓度逐渐变淡，像墨滴在宣纸上洇开
        const addInk = (x, y) => {
            if (lastInk && Math.hypot(x - lastInk.x, y - lastInk.y) < 14) return;
            lastInk = { x, y };
            blots.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, r: 18 + Math.random() * 26, life: 1, decay: 0.28 + Math.random() * 0.17 }); // 每秒衰减，约 2.2–3.6 秒散尽
            if (blots.length > 140) blots.shift();
            inkIdle = false;
        };
        let lastFrame = performance.now();
        const drawInk = now => {
            const dt = Math.min((now - lastFrame) / 1000, 0.1);
            lastFrame = now;
            if (inkIdle) return;
            ctx.clearRect(0, 0, w, h);
            for (let i = blots.length - 1; i >= 0; i--) {
                const b = blots[i];
                b.life -= b.decay * dt;
                if (b.life <= 0) { blots.splice(i, 1); continue; }
                const rad = b.r * (1.6 - 0.6 * b.life);
                const a = 0.16 * b.life * b.life;
                const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
                g.addColorStop(0, `rgba(38,31,25,${a})`);
                g.addColorStop(0.45, `rgba(38,31,25,${a * 0.6})`);
                g.addColorStop(1, 'rgba(38,31,25,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2); ctx.fill();
            }
            if (!blots.length) { ctx.clearRect(0, 0, w, h); inkIdle = true; }
        };
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = innerWidth; h = innerHeight;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dots = [];
            for (let x = SPACING / 2; x < w; x += SPACING)
                for (let y = SPACING / 2; y < h; y += SPACING) dots.push({ x, y, ox: x, oy: y });
        };
        // 所有点合成一条路径、一次填充，比逐点 fill 省得多
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = color;
            ctx.beginPath();
            for (const d of dots) {
                const dx = mouse.x - d.x, dy = mouse.y - d.y;
                const dist = Math.hypot(dx, dy);
                if (dist < RADIUS) {
                    const f = (RADIUS - dist) / RADIUS, a = Math.atan2(dy, dx);
                    d.x -= Math.cos(a) * f * PUSH;
                    d.y -= Math.sin(a) * f * PUSH;
                }
                d.x += (d.ox - d.x) * 0.1;
                d.y += (d.oy - d.y) * 0.1;
                ctx.moveTo(d.x + R, d.y);
                ctx.arc(d.x, d.y, R, 0, Math.PI * 2);
            }
            ctx.fill();
        };
        const loop = now => { if (mode === 'ink') drawInk(now); else draw(); requestAnimationFrame(loop); };
        const drawStatic = () => { if (mode === 'ink') ctx.clearRect(0, 0, w, h); else draw(); };

        let resizeTimer;
        addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); if (reduceMotion) drawStatic(); }, 120); });
        document.addEventListener('themechange', () => { readColor(); ctx.clearRect(0, 0, w, h); if (reduceMotion) drawStatic(); });
        readColor(); resize();
        if (reduceMotion) {
            drawStatic();
        } else {
            addEventListener('mousemove', e => {
                mouse.x = e.clientX; mouse.y = e.clientY;
                if (mode === 'ink') addInk(e.clientX, e.clientY);
            }, { passive: true });
            document.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e4; });
            addEventListener('blur', () => { mouse.x = mouse.y = -1e4; });
            requestAnimationFrame(loop);
        }
    }

    /* ---------- 2. 导航滚动状态 ---------- */
    const nav = document.getElementById('mainNav');
    if (nav) {
        const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
        addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- 3. 滚动渐显 ---------- */
    const revealer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); revealer.unobserve(e.target); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => revealer.observe(el));

    /* ---------- 4. 能力矩阵标签依次浮现 ---------- */
    const capCard = document.getElementById('skills-bento');
    if (capCard) {
        const capObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                e.target.querySelectorAll('.cap-chips span').forEach((chip, i) => {
                    chip.style.transitionDelay = (i * 0.05 + 0.1) + 's';
                });
                e.target.classList.add('go');
                capObserver.unobserve(e.target);
            });
        }, { threshold: 0.2 });
        capObserver.observe(capCard);
    }

    /* ---------- 5. 页内锚点平滑滚动 ---------- */
    document.querySelectorAll('a[href^="#"]:not([data-contact])').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            const target = id.length > 1 && document.querySelector(id);
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
        });
    });

    /* ---------- 6. 头像 3D 倾斜（漂浮动画在外层，倾斜在内层，互不覆盖） ---------- */
    const avatarWrap = document.querySelector('.hero-avatar-wrap');
    const avatarImg = avatarWrap && avatarWrap.querySelector('.avatar-img');
    if (avatarImg && !reduceMotion && matchMedia('(hover: hover)').matches) {
        avatarWrap.addEventListener('mousemove', e => {
            const r = avatarWrap.getBoundingClientRect();
            const rx = ((e.clientY - r.top) / r.height - 0.5) * -24;
            const ry = ((e.clientX - r.left) / r.width - 0.5) * 24;
            avatarImg.style.transition = 'transform 0.12s linear, box-shadow 0.6s';
            avatarImg.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        avatarWrap.addEventListener('mouseleave', () => {
            avatarImg.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s';
            avatarImg.style.transform = '';
        });
    }

    /* ---------- 7. 轻提示 ---------- */
    let toastEl, toastTimer;
    const toast = msg => {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'site-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
    };

    /* ---------- 8. 联系弹窗（两页共用，由脚本生成） ---------- */
    const modal = document.createElement('div');
    modal.className = 'email-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-well">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span class="modal-email">${EMAIL}</span>
            </div>
            <button class="copy-btn" type="button">
                <svg class="copy-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <svg class="check-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </button>
        </div>`;
    document.body.appendChild(modal);
    const copyBtn = modal.querySelector('.copy-btn');
    let lastFocus = null;

    const openModal = () => {
        lastFocus = document.activeElement;
        modal.classList.add('open');
        copyBtn.focus({ preventScroll: true });
    };
    const closeModal = () => {
        modal.classList.remove('open');
        copyBtn.classList.remove('done');
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
            copyBtn.classList.add('done');
            toast(ui().copied);
            setTimeout(closeModal, 1100);
        } catch (e) {
            toast(ui().copyFail);
        }
    });
    document.querySelectorAll('[data-contact]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openModal(); }));

    /* ---------- 9. 语言 ---------- */
    // 中文写在 HTML 里（便于搜索引擎与无脚本访问）；首次切换时缓存原文，切回时还原。
    const zhText = new WeakMap();
    const zhAttr = new WeakMap();
    const applyLang = next => {
        const dict = next === 'en' ? (window.I18N && window.I18N.en) || {} : null;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (!zhText.has(el)) zhText.set(el, el.innerHTML);
            const v = dict ? dict[el.dataset.i18n] : undefined;
            el.innerHTML = v != null ? v : zhText.get(el);
        });
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            let saved = zhAttr.get(el);
            if (!saved) { saved = {}; zhAttr.set(el, saved); }
            el.dataset.i18nAttr.split(';').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
                const v = dict ? dict[key] : undefined;
                el.setAttribute(attr, v != null ? v : saved[attr]);
            });
        });
        lang = next;
        root.lang = next === 'en' ? 'en' : 'zh-CN';
        root.dataset.lang = next;
        // 能力标签换成新节点后直接显示
        if (capCard && capCard.classList.contains('go')) capCard.querySelectorAll('.cap-chips span').forEach(s => { s.style.transitionDelay = '0s'; });
        syncControls();
    };

    /* ---------- 10. 主题 / 语言按钮 ---------- */
    const themeBtn = document.getElementById('themeToggle');
    const langBtn = document.getElementById('langToggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    function syncControls() {
        const t = ui();
        if (themeBtn) {
            const label = theme() === 'paper' ? t.toAurora : t.toPaper;
            themeBtn.setAttribute('aria-label', label);
            themeBtn.title = label;
        }
        if (langBtn) {
            langBtn.textContent = t.langBtn;
            langBtn.setAttribute('aria-label', t.langLabel);
            langBtn.title = t.langLabel;
        }
        modal.setAttribute('aria-label', t.modalLabel);
        copyBtn.setAttribute('aria-label', t.copyLabel);
        const frame = document.querySelector('#chickPhone iframe');
        if (frame) frame.title = t.gameTitle;
        if (themeMeta) themeMeta.content = THEME_COLOR[theme()];
    }

    let switching = false;
    const canAnimate = () => !reduceMotion && typeof document.startViewTransition === 'function';

    const setTheme = (next, origin) => {
        const commit = () => {
            if (next === 'paper') root.dataset.theme = 'paper'; else root.removeAttribute('data-theme');
            store('theme', next);
            syncControls();
            document.dispatchEvent(new CustomEvent('themechange'));
        };
        if (!canAnimate()) {
            root.classList.add('theme-fade');
            commit();
            setTimeout(() => root.classList.remove('theme-fade'), 600);
            return;
        }
        // 新主题从按钮中心以圆形扩散，像墨滴在纸上晕开
        const r = origin.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        switching = true;
        root.classList.add('vt-theme');
        const vt = document.startViewTransition(commit);
        vt.ready.then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
                { duration: 780, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
            );
        }).catch(() => {});
        vt.finished.finally(() => { root.classList.remove('vt-theme'); switching = false; });
    };

    const setLang = next => {
        const commit = () => { applyLang(next); store('lang', next); };
        if (!canAnimate()) { commit(); return; }
        switching = true;
        root.classList.add('vt-lang');
        const vt = document.startViewTransition(commit);
        vt.finished.finally(() => { root.classList.remove('vt-lang'); switching = false; });
    };

    if (themeBtn) themeBtn.addEventListener('click', () => { if (!switching) setTheme(theme() === 'paper' ? 'aurora' : 'paper', themeBtn); });
    if (langBtn) langBtn.addEventListener('click', () => { if (!switching) setLang(lang === 'en' ? 'zh' : 'en'); });

    // 首次加载：链接里带 ?lang= / ?theme= 时记住，之后在两页间跳转保持一致
    try {
        const q = new URLSearchParams(location.search);
        if (q.get('lang')) store('lang', q.get('lang') === 'en' ? 'en' : 'zh');
        if (q.get('theme')) store('theme', q.get('theme') === 'paper' ? 'paper' : 'aurora');
    } catch (e) {}
    if (lang === 'en') applyLang('en'); else syncControls();
    root.classList.remove('i18n-pending');

    /* ---------- 11. 作品页：报告自动滚动、页内试玩、宣传片 ---------- */
    const scrollers = document.querySelectorAll('.autoscroll');
    if (scrollers.length && !reduceMotion) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => e.target.classList.toggle('playing', e.isIntersecting));
        }, { threshold: 0.25 });
        scrollers.forEach(el => io.observe(el));
    }

    const chickPhone = document.getElementById('chickPhone');
    document.querySelectorAll('[data-play]').forEach(btn => btn.addEventListener('click', () => {
        const src = btn.dataset.play;
        // 手机上在页面里的小手机框太小，直接全屏打开
        if (!chickPhone || matchMedia('(max-width: 768px)').matches) { window.open(src, '_blank', 'noopener'); return; }
        let frame = chickPhone.querySelector('iframe');
        if (!frame) {
            frame = document.createElement('iframe');
            frame.src = src;
            frame.title = ui().gameTitle;
            frame.allow = 'autoplay';
            chickPhone.querySelector('.phone-screen').appendChild(frame);
            chickPhone.classList.add('is-playing');
            chickPhone.closest('.chick-play')?.classList.add('is-playing');
        }
        chickPhone.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => frame.focus(), 400);
    }));

    // 宣传片播放浮层（点击后有声播放，关闭即暂停）
    const watchBtns = document.querySelectorAll('[data-watch]');
    if (watchBtns.length) {
        const vm = document.createElement('div');
        vm.className = 'video-modal';
        vm.setAttribute('role', 'dialog');
        vm.setAttribute('aria-modal', 'true');
        vm.innerHTML = '<div class="video-box"><button type="button" class="video-close">×</button><video controls playsinline preload="none"></video></div>';
        document.body.appendChild(vm);
        const video = vm.querySelector('video'), closeBtn = vm.querySelector('.video-close');
        let opener = null;
        const closeVideo = () => { video.pause(); vm.classList.remove('open'); if (opener) opener.focus({ preventScroll: true }); };
        watchBtns.forEach(b => b.addEventListener('click', () => {
            opener = b;
            if (video.dataset.src !== b.dataset.watch) { video.dataset.src = b.dataset.watch; video.src = b.dataset.watch; video.poster = b.dataset.poster || ''; }
            vm.querySelector('.video-box').style.setProperty('--ratio', b.dataset.ratio || '16 / 9');
            closeBtn.setAttribute('aria-label', lang === 'en' ? 'Close video' : '关闭视频');
            vm.setAttribute('aria-label', [...b.children].map(c => c.textContent.trim()).filter(Boolean).join(' · '));
            vm.classList.add('open');
            video.currentTime = 0;
            video.play().catch(() => {});
            closeBtn.focus({ preventScroll: true });
        }));
        closeBtn.addEventListener('click', closeVideo);
        vm.addEventListener('click', e => { if (e.target === vm) closeVideo(); });
        addEventListener('keydown', e => { if (e.key === 'Escape' && vm.classList.contains('open')) closeVideo(); });
    }

    // 宣传片：舞台 data-video 填入路径后自动替换为静音循环视频
    document.querySelectorAll('.work-stage[data-video]').forEach(stage => {
        const src = stage.dataset.video;
        if (!src) return;
        const v = document.createElement('video');
        Object.assign(v, { src, muted: true, loop: true, playsInline: true, autoplay: !reduceMotion, controls: reduceMotion });
        if (stage.dataset.poster) v.poster = stage.dataset.poster;
        v.className = 'stage-video';
        stage.appendChild(v);
    });
})();
