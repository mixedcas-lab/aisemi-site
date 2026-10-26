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
        const tags = (it.dataset.tags || it.dataset.group || '').split(' ');
        const ok = (filter === 'all' || tags.includes(filter)) && (!q || it.dataset.text.toLowerCase().includes(q));
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
    card.querySelectorAll('form').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      setRole(f.dataset.role);
      location.href = f.dataset.next + '?demo=' + f.dataset.role;
    }));
  });

  // 시안 로그인 상태(가짜): 상단 띠, 보호 화면, 로그아웃
  const role = getRole();
  const guest = document.querySelector('[data-util-guest]');
  const session = document.querySelector('[data-util-session]');
  if (role && guest && session) {
    guest.hidden = true; session.hidden = false;
    const home = session.querySelector('[data-session-home]');
    home.href = role === 'staff' ? session.dataset.admin : session.dataset.my;
    home.textContent = role === 'staff' ? '관리자 화면' : '나의 참여현황';
  }
  document.querySelector('[data-logout]')?.addEventListener('click', () => { setRole(null); location.href = session.dataset.home; });
  document.querySelectorAll('[data-demo-guard]').forEach((g) => {
    const ok = role === g.dataset.demoGuard;
    g.querySelector('[data-guard-msg]').hidden = ok;
    g.querySelector('[data-guard-body]').hidden = !ok;
  });

  // 시안 표: 승인·반려·취소는 이 화면에서만 바뀐다
  document.querySelectorAll('[data-set-status]').forEach((b) => b.addEventListener('click', () => {
    const cell = b.closest('[data-row]').querySelector('[data-cell-status]');
    cell.textContent = cell.dataset.state = b.dataset.setStatus;
    if (b.dataset.setStatus === '취소') b.remove();
    const reason = b.closest('[data-row]').querySelector('[data-cell-reason]');
    if (reason) reason.textContent = '';
    recount();
    toast(`${b.dataset.setStatus} 처리했습니다 (시안: 저장되지 않음).`);
  }));
  // 반려: 사유를 받아 표에 표시
  const dlg = document.querySelector('[data-reject-dialog]');
  let rejectRow = null;
  document.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => {
    rejectRow = b.closest('[data-row]');
    if (dlg?.showModal) { dlg.querySelector('textarea').value = ''; dlg.showModal(); } else applyReject('');
  }));
  dlg?.addEventListener('close', () => { if (dlg.returnValue === 'ok') applyReject(dlg.querySelector('textarea').value.trim()); });
  function applyReject(reason) {
    if (!rejectRow) return;
    const cell = rejectRow.querySelector('[data-cell-status]');
    cell.textContent = cell.dataset.state = '반려';
    rejectRow.querySelector('[data-cell-reason]').textContent = reason ? `사유: ${reason}` : '';
    recount();
    toast('반려 처리했습니다 (시안: 저장되지 않음).');
  }

  // 단체 메일: 받는 사람 수만 안내
  document.querySelector('[data-mail-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const opt = e.target.querySelector('select').selectedOptions[0];
    toast(`${opt.dataset.count}명에게 보낼 메일입니다. 시안이라 실제로 발송하지 않습니다.`);
  });

  // 지금 신청 가능한 프로그램, 마감 임박 알림: 오늘 날짜 기준
  const items = [...document.querySelectorAll('[data-open-item]')];
  if (items.length) {
    let n = 0;
    items.forEach((it) => { const [a, b] = it.dataset.recruitRange.split('|'); const open = today >= d(a) && today <= d(b); it.hidden = !open; if (open) n++; });
    document.querySelector('[data-open-empty]').hidden = n > 0;
  }
  const soon = document.querySelector('[data-closing-soon]');
  if (soon) soon.hidden = !soon.dataset.ranges.split(',').some((r) => { const [a, b] = r.split('|'); const end = d(b); return today >= d(a) && end >= today && (end - today) / 864e5 <= 7; });

  document.querySelectorAll('[data-mock]').forEach((b) => b.addEventListener('click', () => toast(`"${b.textContent.trim()}"은 시안에서 동작하지 않습니다. 업체가 개발할 기능입니다.`)));
});

function recount() {
  document.querySelectorAll('[data-count-status]').forEach((c) => {
    c.textContent = [...document.querySelectorAll('[data-cell-status]')].filter((x) => x.dataset.state === c.dataset.countStatus).length;
  });
}

const ROLE_KEY = 'aisemi-demo-role';
function setRole(r) { try { r ? localStorage.setItem(ROLE_KEY, r) : localStorage.removeItem(ROLE_KEY); } catch (e) {} }
function getRole() {
  const q = new URLSearchParams(location.search).get('demo');
  if (q === 'student' || q === 'staff') { setRole(q); return q; }
  try { return localStorage.getItem(ROLE_KEY); } catch (e) { return null; }
}
let toastTimer;
function toast(msg) {
  const t = document.querySelector('[data-toast]');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
