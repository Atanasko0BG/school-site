/* ====== NAV: burger + active link ====== */
function toggleMenu(btn) {
  const nav = document.getElementById('nav-links');
  const isOpen = nav.classList.toggle('active');
  if (btn && btn.setAttribute) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

(function markActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('#nav-links a');
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
})();

/* lazy за всички img, ако липсва атрибут */
document.querySelectorAll('img:not([loading])')
  .forEach(img => img.setAttribute('loading', 'lazy'));


/* ====== LIGHTBOX (галерия) ====== */
(function setupLightbox(){
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  // създаваме модал само веднъж
  const modal = document.createElement('div');
  modal.className = 'lightbox hidden';
  modal.innerHTML = `
    <div class="lightbox__backdrop" data-close></div>
    <div class="lightbox__content" role="dialog" aria-modal="true" aria-label="Преглед на снимка">
      <button class="lightbox__close" aria-label="Затвори" data-close>&times;</button>
      <img class="lightbox__img" alt="">
      <div class="lightbox__caption" aria-live="polite"></div>
      <div class="lightbox__controls">
        <button class="lightbox__prev" aria-label="Предишна снимка">&#10094;</button>
        <button class="lightbox__next" aria-label="Следваща снимка">&#10095;</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const imgEl = modal.querySelector('.lightbox__img');
  const capEl = modal.querySelector('.lightbox__caption');
  const btnPrev = modal.querySelector('.lightbox__prev');
  const btnNext = modal.querySelector('.lightbox__next');

  const items = [...gallery.querySelectorAll('a[data-full]')];
  let index = 0;

  function openAt(i){
    index = (i + items.length) % items.length;
    const a = items[index];
    imgEl.src = a.getAttribute('data-full');
    imgEl.alt = a.querySelector('img')?.alt || 'Снимка';
    capEl.textContent = a.getAttribute('data-caption') || '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  function next(){ openAt(index + 1); }
  function prev(){ openAt(index - 1); }

  gallery.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-full]');
    if (!a) return;
    e.preventDefault();
    const i = items.indexOf(a);
    openAt(i);
  });

  modal.addEventListener('click', (e)=>{
    if (e.target.hasAttribute('data-close')) close();
  });
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  document.addEventListener('keydown', (e)=>{
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();


/* ===== Екип: търсене и филтри ===== */
(function teamFilters(){
  const grid = document.getElementById('team-grid');
  if (!grid) return;

  const search = document.getElementById('team-search');
  const stage = document.getElementById('team-stage');
  const subject = document.getElementById('team-subject');
  const cards = Array.from(grid.querySelectorAll('.teacher-card'));

  function normalize(s){ return (s||'').toString().toLowerCase().trim(); }

  function apply(){
    const q = normalize(search?.value);
    const st = normalize(stage?.value);
    const sub = normalize(subject?.value);

    let visible = 0;
    cards.forEach(card=>{
      const cName = normalize(card.dataset.name);
      const cStage = normalize(card.dataset.stage);
      const cSubject = normalize(card.dataset.subject);

      const matchSearch =
        !q ||
        cName.includes(q) ||
        cSubject.includes(q);

      const matchStage = !st || cStage === st;
      const matchSubject = !sub || cSubject === normalize(sub);

      const show = matchSearch && matchStage && matchSubject;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // ако няма резултати
    showNoResults(visible === 0);
  }

  // „няма резултати“ етикет
  let emptyEl = null;
  function showNoResults(show){
    if (show){
      if (!emptyEl){
        emptyEl = document.createElement('div');
        emptyEl.className = 'card';
        emptyEl.style.textAlign = 'center';
        emptyEl.style.gridColumn = '1 / -1';
        emptyEl.textContent = 'Няма съвпадения. Променете търсенето или филтрите.';
        grid.appendChild(emptyEl);
      }
    } else if (emptyEl){
      emptyEl.remove();
      emptyEl = null;
    }
  }

  search?.addEventListener('input', apply);
  stage?.addEventListener('change', apply);
  subject?.addEventListener('change', apply);

  apply(); // първоначален рендер
})();

/* ===== Екип: търсене по име/предмет ===== */
(function(){
  const search = document.getElementById('team-search');
  if (!search) return;

  const cards = Array.from(document.querySelectorAll('.teacher-card'));

  function normalize(s){ return (s||'').toLowerCase().trim(); }

  function apply(){
    const q = normalize(search.value);
    let visible = 0;
    cards.forEach(card=>{
      const name = normalize(card.querySelector('.teacher-name')?.textContent);
      const role = normalize(card.querySelector('.teacher-role')?.textContent);
      const subj = normalize(card.querySelector('.teacher-subject')?.textContent);

      const show = !q || name.includes(q) || role.includes(q) || subj.includes(q);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (!visible){
      if (!document.getElementById('no-results')){
        const msg = document.createElement('div');
        msg.id = 'no-results';
        msg.className = 'card';
        msg.style.textAlign = 'center';
        msg.style.gridColumn = '1 / -1';
        msg.textContent = 'Няма намерени съвпадения.';
        cards[0].parentNode.appendChild(msg);
      }
    } else {
      document.getElementById('no-results')?.remove();
    }
  }

  search.addEventListener('input', apply);
})();

/* ===== Екип: търсене + филтър ===== */
(function(){
  const search = document.getElementById('team-search');
  const filter = document.getElementById('team-filter');
  const cards = Array.from(document.querySelectorAll('.teacher-card'));
  if (!search || !filter || !cards.length) return;

  function normalize(s){ return (s||'').toLowerCase().trim(); }

  function apply(){
    const q = normalize(search.value);
    const f = filter.value;
    let visible = 0;

    cards.forEach(card=>{
      const name = normalize(card.querySelector('.teacher-name')?.textContent);
      const role = normalize(card.querySelector('.teacher-role')?.textContent);
      const subj = normalize(card.querySelector('.teacher-subject')?.textContent);
      const stage = card.dataset.stage;

      const matchSearch = !q || name.includes(q) || role.includes(q) || subj.includes(q);
      const matchFilter = !f || stage === f;

      const show = matchSearch && matchFilter;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (!visible){
      if (!document.getElementById('no-results')){
        const msg = document.createElement('div');
        msg.id = 'no-results';
        msg.className = 'card';
        msg.style.textAlign = 'center';
        msg.style.gridColumn = '1 / -1';
        msg.textContent = 'Няма намерени съвпадения.';
        cards[0].parentNode.appendChild(msg);
      }
    } else {
      document.getElementById('no-results')?.remove();
    }
  }

  search.addEventListener('input', apply);
  filter.addEventListener('change', apply);
})();
/* ===== Екип: търсене + чип филтри ===== */
(function(){
  const search = document.getElementById('team-search');
  const chipsWrap = document.querySelector('.filter-chips');
  const cards = Array.from(document.querySelectorAll('.teacher-card'));
  if (!chipsWrap || !cards.length) return;

  function normalize(s){ return (s||'').toLowerCase().trim(); }

  function activeStage() {
    const active = chipsWrap.querySelector('.chip.active');
    return active ? active.dataset.stage : '';
  }

  function apply(){
    const q = normalize(search?.value || '');
    const stageFilter = activeStage();
    let visible = 0;

    cards.forEach(card=>{
      const name = normalize(card.querySelector('.teacher-name')?.textContent);
      const role = normalize(card.querySelector('.teacher-role')?.textContent);
      // ако имаш .teacher-subject, ще участва:
      const subjEl = card.querySelector('.teacher-subject');
      const subj = normalize(subjEl ? subjEl.textContent : '');
      const stage = card.dataset.stage;

      const matchText = !q || name.includes(q) || role.includes(q) || subj.includes(q);
      const matchStage = !stageFilter || stage === stageFilter;

      const show = matchText && matchStage;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Показване/скриване на „няма резултати“
    const parentGrid = cards[0].parentNode;
    let msg = document.getElementById('no-results');
    if (!visible){
      if (!msg){
        msg = document.createElement('div');
        msg.id = 'no-results';
        msg.className = 'card';
        msg.style.textAlign = 'center';
        msg.style.gridColumn = '1 / -1';
        msg.textContent = 'Няма намерени съвпадения.';
        parentGrid.appendChild(msg);
      }
    } else {
      msg?.remove();
    }
  }

  // Делегиране за чиповете
  chipsWrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chip');
    if (!btn) return;
    chipsWrap.querySelectorAll('.chip').forEach(c=>{
      c.classList.toggle('active', c === btn);
      c.setAttribute('aria-pressed', c === btn ? 'true' : 'false');
    });
    apply();
  });

  search?.addEventListener('input', apply);

  apply(); // първи рендер
})();
/* ===== Новини: търсене + категория ===== */
(function(){
  const search = document.getElementById('news-search');
  const chips = document.querySelector('.news-chips');
  const cards = Array.from(document.querySelectorAll('.news-card'));
  if (!cards.length) return;

  function normalize(s){ return (s||'').toLowerCase().trim(); }
  function activeCat(){
    const a = chips?.querySelector('.chip.active');
    return a ? a.dataset.cat : '';
  }

  function apply(){
    const q = normalize(search?.value || '');
    const cat = activeCat();
    let visible = 0;

    cards.forEach(card=>{
      const title = normalize(card.querySelector('.news-title')?.textContent);
      const text  = normalize(card.querySelector('.news-excerpt')?.textContent);
      const c     = card.dataset.cat || '';

      const matchText = !q || title.includes(q) || text.includes(q);
      const matchCat  = !cat || c === cat;

      const show = matchText && matchCat;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    let msg = document.getElementById('news-nores');
    if (!visible) {
      if (!msg) {
        msg = document.createElement('div');
        msg.id = 'news-nores';
        msg.className = 'card';
        msg.style.textAlign = 'center';
        msg.style.gridColumn = '1 / -1';
        msg.textContent = 'Няма намерени новини.';
        document.getElementById('news-grid').appendChild(msg);
      }
    } else {
      msg?.remove();
    }
  }

  search?.addEventListener('input', apply);
  chips?.addEventListener('click', e=>{
    const btn = e.target.closest('.chip'); if (!btn) return;
    chips.querySelectorAll('.chip').forEach(c=>{
      c.classList.toggle('active', c===btn);
      c.setAttribute('aria-pressed', c===btn ? 'true' : 'false');
    });
    apply();
  });

  // по желание: сортиране по дата (новите първо)
  cards.sort((a,b)=> (b.dataset.date||'').localeCompare(a.dataset.date||''))
       .forEach(c=> c.parentNode.appendChild(c));

  apply();
})();
/* ===== Документи: търсене + филтър ===== */
(function(){
  const search = document.getElementById('doc-search');
  const chips = document.querySelector('.doc-chips');
  const items = Array.from(document.querySelectorAll('.doc-item'));
  if (!items.length) return;

  // сложи разширението като data-ext върху .doc-ico за етикета
  items.forEach(li=>{
    const ext = (li.dataset.ext || '').toUpperCase();
    const ico = li.querySelector('.doc-ico');
    if (ico) ico.setAttribute('data-ext', ext);
  });

  function normalize(s){ return (s||'').toLowerCase().trim(); }
  function activeCat(){
    const a = chips?.querySelector('.chip.active');
    return a ? a.dataset.cat : '';
  }

  function apply(){
    const q = normalize(search?.value || '');
    const cat = activeCat();
    let visible = 0;

    items.forEach(li=>{
      const title = normalize(li.querySelector('.doc-link')?.textContent);
      const thisCat = li.dataset.cat || '';
      const matchesText = !q || title.includes(q);
      const matchesCat = !cat || thisCat === cat;
      const show = matchesText && matchesCat;

      li.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // ако искаш „няма резултати“ – може да се добави както при новините
  }

  search?.addEventListener('input', apply);
  chips?.addEventListener('click', e=>{
    const btn = e.target.closest('.chip'); if (!btn) return;
    chips.querySelectorAll('.chip').forEach(c=>{
      c.classList.toggle('active', c===btn);
      c.setAttribute('aria-pressed', c===btn ? 'true' : 'false');
    });
    apply();
  });

  apply();
})();
