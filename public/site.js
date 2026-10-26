// 전체메뉴 열고 닫기, 팝업존 슬라이더, 목록 검색·필터, 모집 상태 표시
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.allmenu-toggle');
  const menu = document.getElementById('allmenu');
  if (toggle && menu) {
    const set = (open) => { menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open); };
    toggle.addEventListener('click', () => set(menu.hidden));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); toggle.focus(); } });
  }

  // 팝업존: 이전/다음/일시정지, 6초 자동 넘김 (움직임 감소 설정이면 자동 넘김 끔)
  document.querySelectorAll('[data-slider]').forEach((root) => {
    const slides = [...root.querySelectorAll('[data-slide]')];
    const counter = root.querySelector('[data-counter]');
    const pauseBtn = root.querySelector('[data-pause]');
    let i = 0, timer = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.hidden = k !== i; });
      if (counter) counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const play = () => { stop(); if (!reduce && slides.length > 1) timer = setInterval(() => show(i + 1), 6000); };
    const stop = () => { clearInterval(timer); timer = null; };
    root.querySelector('[data-prev]')?.addEventListener('click', () => { show(i - 1); if (timer) play(); });
    root.querySelector('[data-next]')?.addEventListener('click', () => { show(i + 1); if (timer) play(); });
    pauseBtn?.addEventListener('click', () => {
      if (timer) { stop(); pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', '자동 넘김 시작'); }
      else { play(); pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.setAttribute('aria-label', '자동 넘김 멈춤'); }
    });
    show(0); play();
    if (reduce && pauseBtn) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', '자동 넘김 시작'); }
  });

  // 모집 상태: 오늘 날짜 기준으로 다시 계산 (빌드 시점 값은 대체값)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  document.querySelectorAll('[data-recruit]').forEach((el) => {
    const [a, b] = el.dataset.recruit.split('|');
    const state = today < d(a) ? 'soon' : today > d(b) ? 'closed' : 'open';
    el.dataset.state = state;
    el.textContent = { soon: '모집 예정', open: '모집 중', closed: '모집 마감' }[state];
  });

  // 목록 검색 + 필터 (프로그램, 공지)
  document.querySelectorAll('[data-list]').forEach((wrap) => {
    const items = [...wrap.querySelectorAll('[data-item]')];
    const input = wrap.querySelector('[data-search]');
    const chips = [...wrap.querySelectorAll('[data-filter]')];
    const count = wrap.querySelector('[data-count]');
    const empty = wrap.querySelector('[data-empty]');
    let filter = 'all';
    const apply = () => {
      const q = (input?.value || '').trim().toLowerCase();
      let n = 0;
      items.forEach((it) => {
        const ok = (filter === 'all' || it.dataset.group === filter) && (!q || it.dataset.text.toLowerCase().includes(q));
        it.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n;
      if (empty) empty.hidden = n > 0;
    };
    input?.addEventListener('input', apply);
    wrap.querySelector('form')?.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
    chips.forEach((c) => c.addEventListener('click', () => {
      filter = c.dataset.filter;
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      apply();
    }));
    apply();
  });

  // 로그인 시안: 학생/사업단 탭 전환(#staff로 바로 열기), 제출은 막고 안내만 표시
  document.querySelectorAll('[data-login-tabs]').forEach((card) => {
    const tabs = [...card.querySelectorAll('[role="tab"]')];
    const select = (tab) => tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tabs.forEach((t) => t.addEventListener('click', () => select(t)));
    const fromHash = tabs.find((t) => '#' + t.getAttribute('aria-controls') === location.hash);
    if (fromHash) select(fromHash);
    window.addEventListener('hashchange', () => { const t = tabs.find((x) => '#' + x.getAttribute('aria-controls') === location.hash); if (t) select(t); });
    const note = card.querySelector('[data-login-note]');
    card.querySelectorAll('form').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      note.textContent = '시안 화면이라 로그인되지 않습니다. 실제 기능은 업체가 개발할 예정입니다.';
      note.classList.add('is-warn');
    }));
  });
});
