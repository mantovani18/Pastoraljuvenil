// Navegação entre seções (SPA simples)
document.addEventListener('DOMContentLoaded',()=>{
  const links = document.querySelectorAll('.main-nav .nav-link, .btn[data-target]');
  links.forEach(btn=> btn.addEventListener('click', navTo));

  // lightbox
  const galleryImgs = document.querySelectorAll('.gallery img');
  galleryImgs.forEach(img=> img.addEventListener('click', openLightbox));
  // make card and group photos open lightbox as well
  const photoImgs = document.querySelectorAll('.card-photos img, .group-photos img');
  photoImgs.forEach(img=> img.addEventListener('click', openLightbox));
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e)=>{ if(e.target.id==='lightbox') closeLightbox(); });
  // delegate clicks as a fallback (works even if images are added later or covered by other layers)
  document.addEventListener('click', (e)=>{
    const tgt = e.target.closest && e.target.closest('img');
    if(!tgt) return;
    if(tgt.matches('.gallery img, .card-photos img, .group-photos img')){
      // stop if some control handled it
      e.preventDefault();
      openLightbox({ currentTarget: tgt });
    }
  });

  // gerar eventos e preencher listas
  populateEvents();
  // inicializa hash de rota
  const hash = location.hash.replace('#','');
  if(hash) showPage(hash); else showPage('home');

  // modal handlers
  const modalClose = document.getElementById('modal-close');
  const modal = document.getElementById('event-modal');
  if(modalClose) modalClose.addEventListener('click', closeEventModal);
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target.id === 'event-modal') closeEventModal(); });
  const modalRsvp = document.getElementById('modal-rsvp');
  const modalRsvpNo = document.getElementById('modal-rsvp-no');
  const modalIcs = document.getElementById('modal-ics');
  if(modalRsvp) modalRsvp.addEventListener('click', ()=>{ if(window.__currentModalEvent) toggleRsvp(window.__currentModalEvent, 'yes'); });
  if(modalRsvpNo) modalRsvpNo.addEventListener('click', ()=>{ if(window.__currentModalEvent) toggleRsvp(window.__currentModalEvent, 'no'); });
  if(modalIcs) modalIcs.addEventListener('click', ()=>{ if(window.__currentModalEvent) downloadICS(window.__currentModalEvent); });

  // gallery filter buttons (All / Yeshua / Dom / Pastoral)
  const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
  if(filterBtns && filterBtns.length){
    filterBtns.forEach(btn=> btn.addEventListener('click', (e)=>{
      filterBtns.forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      filterGallery(f);
    }));
    // ensure default
    const active = document.querySelector('.gallery-filters .filter-btn.active');
    if(active) filterGallery(active.dataset.filter || 'all');
  }
});

function navTo(e){
  e.preventDefault();
  const target = e.currentTarget.dataset.target;
  if(target) showPage(target);
}
function showPage(id){
  document.querySelectorAll('.page').forEach(s=> s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  document.querySelectorAll('.main-nav .nav-link').forEach(btn=> btn.classList.toggle('active', btn.dataset.target===id));
  location.hash = id;
  // set page theme class on body
  const body = document.body;
  body.classList.remove('theme-home','theme-yeshua','theme-dom');
  if(id === 'home') body.classList.add('theme-home');
  else if(id === 'yeshua') body.classList.add('theme-yeshua');
  else if(id === 'dom') body.classList.add('theme-dom');
}

function openLightbox(e){
  const src = e.currentTarget.dataset.full || e.currentTarget.src;
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-image').src = src;
  lb.style.display = 'flex';
  lb.setAttribute('aria-hidden','false');
}
function closeLightbox(){
  const lb = document.getElementById('lightbox');
  lb.style.display='none';
  lb.setAttribute('aria-hidden','true');
  document.getElementById('lb-image').src='';
}

// --- calendário e geração de eventos recorrentes ---
function nextDatesForWeekday(weekday, hour, minute, count){
  // weekday: 0 (domingo) .. 6 (sábado)
  const res = [];
  const now = new Date();
  // começar da próxima ocorrência (pode incluir hoje se posterior ao horário)
  let dt = new Date(now);
  dt.setHours(hour, minute, 0, 0);
  // ajustar ao dia desejado
  const diff = (weekday - dt.getDay() + 7) % 7;
  dt.setDate(dt.getDate() + diff);
  if(dt < now) dt.setDate(dt.getDate() + 7);
  for(let i=0;i<count;i++){
    res.push(new Date(dt));
    dt = new Date(dt);
    dt.setDate(dt.getDate()+7);
  }
  return res;
}

function formatDateBR(d){
  return d.toLocaleString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

function populateEvents(){
  // Gerar datas recorrentes
  // Yeshua: sábado (6) às 18:00
  const yeshuaDates = nextDatesForWeekday(6,18,0,8);
  // Dom: domingo (0) às 20:00
  const domDates = nextDatesForWeekday(0,20,0,8);
  // Pastoral Juvenil: (assunção razoável) reunião mensal/recorrente às sextas às 19:00
  // Observação: se preferir outro dia/hora, posso ajustar.
  const pastoralDates = nextDatesForWeekday(5,19,0,8);

  // Montar objetos de evento com título e categorias
  const yeshuaEvents = yeshuaDates.map(d=>({date:d, title:'Encontro Yeshua', groups:['yeshua']}));
  const domEvents = domDates.map(d=>({date:d, title:'Encontro Dom', groups:['dom']}));
  const pastoralEvents = pastoralDates.map(d=>({date:d, title:'Evento Pastoral', groups:['pastoral']}));

  const ulYes = document.getElementById('yeshua-events');
  const ulDom = document.getElementById('dom-events');
  const upc = document.getElementById('upcoming-events');
  const calY = document.getElementById('cal-yeshua');
  const calD = document.getElementById('cal-dom');

  // helper para criar li
  function makeLi(event){
    const li = document.createElement('li');
    li.textContent = `${event.title} — ${formatDateBR(event.date)}`;
    return li;
  }

  function createEventCard(event, idx){
    const card = document.createElement('article');
    card.className = `event-card ${event.groups[0]}`;
    if(typeof idx === 'number') card.style.animationDelay = `${idx * 80}ms`;

    const title = document.createElement('h4');
    title.textContent = event.title;
    const dateP = document.createElement('p');
    dateP.textContent = formatDateBR(event.date);

    const badge = document.createElement('span');
    badge.className = 'event-badge';
    badge.textContent = event.groups[0].charAt(0).toUpperCase() + event.groups[0].slice(1);

    card.appendChild(title);
    card.appendChild(dateP);
    card.appendChild(badge);

    // open detailed event modal when clicking a card
    card.addEventListener('click', ()=>{
      openEventModal(event);
    });

    return card;
  }

  function renderCardsInto(containerEl, events){
    if(!containerEl) return;
    // limpar
    containerEl.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-events-grid';
    events.forEach((ev, i)=> wrapper.appendChild(createEventCard(ev, i)));
    containerEl.appendChild(wrapper);
  }

  // Preencher listas dos grupos: devem conter eventos da Pastoral + eventos do próprio grupo
  // Yeshua: pastoral + yeshua
  const yCombined = pastoralEvents.concat(yeshuaEvents).sort((a,b)=> a.date - b.date);
  // Dom: pastoral + dom
  const dCombined = pastoralEvents.concat(domEvents).sort((a,b)=> a.date - b.date);

  // Renderizar como cartões visuais em todas as seções solicitadas
  renderCardsInto(ulYes, yCombined.slice(0,12));
  renderCardsInto(ulDom, dCombined.slice(0,12));
  renderCardsInto(calY, yCombined.slice(0,12));
  renderCardsInto(calD, dCombined.slice(0,12));

  // Página inicial: apenas eventos da Pastoral Juvenil (próximos N)
  renderCardsInto(upc, pastoralEvents.sort((a,b)=> a.date - b.date).slice(0,6));

  // --- Render visual calendar (cards) ---
  const calendarContainer = document.getElementById('calendar-events');
  if(calendarContainer){
    calendarContainer.innerHTML = '';
    // combinar todos os eventos e ordenar
    const allEvents = pastoralEvents.concat(yeshuaEvents, domEvents).sort((a,b)=> a.date - b.date).slice(0,12);
    allEvents.forEach((ev, idx)=>{
      calendarContainer.appendChild(createEventCard(ev, idx));
    });
  }
}

// --- Event modal and utilities ---
function openEventModal(event){
  const modal = document.getElementById('event-modal');
  if(!modal) return;
  window.__currentModalEvent = event;
  const title = document.getElementById('modal-title');
  const dateP = document.getElementById('modal-date');
  title.textContent = event.title || 'Evento';
  dateP.textContent = formatDateBR(event.date);
  // initialize RSVP counts if missing
  if(!event.rsvps){
    // seed with small sample counts so the chart looks informative
    event.rsvps = { yes: Math.floor(Math.random()*6)+2, no: Math.floor(Math.random()*4), user: null };
  }
  updateModalChart(event);
  updateModalButtons(event);
  modal.setAttribute('aria-hidden','false');
  const chart = document.getElementById('modal-chart'); if(chart) chart.setAttribute('aria-hidden','false');
}
function closeEventModal(){
  const modal = document.getElementById('event-modal');
  if(!modal) return;
  modal.setAttribute('aria-hidden','true');
  window.__currentModalEvent = null;
}
function goToEventGroup(event){
  if(!event) return;
  const g = event.groups && event.groups[0];
  if(g === 'pastoral') showPage('home'); else showPage(g);
}
function downloadICS(event){
  if(!event || !event.date) return;
  const dt = event.date;
  // format YYYYMMDDTHHMMSSZ in UTC
  const pad = n => String(n).padStart(2,'0');
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth()+1);
  const d = pad(dt.getUTCDate());
  const hh = pad(dt.getUTCHours());
  const mm = pad(dt.getUTCMinutes());
  const ss = pad(dt.getUTCSeconds());
  const dtstart = `${y}${m}${d}T${hh}${mm}${ss}Z`;
  const dtend = `${y}${m}${d}T${String(dt.getUTCHours()+2).padStart(2,'0')}${mm}${ss}Z`;
  const uid = `pastoral-${dt.getTime()}@rolandia.local`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PastoralJuvenil//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstart}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${event.title.replace(/\n/g,' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/\s+/g,'_') || 'evento'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- RSVP helpers ---
function updateModalChart(event){
  if(!event) return;
  const chart = document.getElementById('modal-chart');
  if(!chart) return;
  const yesEl = chart.querySelector('.bar.yes .fill');
  const yesCount = chart.querySelector('.bar.yes .count');
  const noEl = chart.querySelector('.bar.no .fill');
  const noCount = chart.querySelector('.bar.no .count');
  const r = event.rsvps || {yes:0,no:0};
  const y = r.yes || 0; const n = r.no || 0; const total = y + n;
  const pYes = total > 0 ? Math.round((y/total)*100) : 0;
  const pNo = total > 0 ? 100 - pYes : 0;
  if(yesEl) yesEl.style.width = pYes + '%';
  if(noEl) noEl.style.width = pNo + '%';
  if(yesCount) yesCount.textContent = String(y);
  if(noCount) noCount.textContent = String(n);
}

function updateModalButtons(event){
  const btnYes = document.getElementById('modal-rsvp');
  const btnNo = document.getElementById('modal-rsvp-no');
  if(!btnYes || !btnNo) return;
  const user = event.rsvps && event.rsvps.user;
  if(user === 'yes'){
    btnYes.textContent = 'Cancelar presença';
    btnYes.classList.add('active');
    btnNo.textContent = 'Não vou';
  } else if(user === 'no'){
    btnYes.textContent = 'Marcar presença';
    btnYes.classList.remove('active');
    btnNo.textContent = 'Cancelar - Não vou';
    btnNo.classList.add('active');
  } else {
    btnYes.textContent = 'Marcar presença';
    btnYes.classList.remove('active');
    btnNo.textContent = 'Não vou';
    btnNo.classList.remove('active');
  }
}

function toggleRsvp(event, choice){
  if(!event) return;
  if(!event.rsvps) event.rsvps = {yes:0,no:0,user:null};
  const r = event.rsvps;
  const prev = r.user;
  // if clicking same choice -> cancel that choice
  if(prev === choice){
    if(choice === 'yes') r.yes = Math.max(0, r.yes - 1);
    if(choice === 'no') r.no = Math.max(0, r.no - 1);
    r.user = null;
  } else {
    // remove previous
    if(prev === 'yes') r.yes = Math.max(0, r.yes - 1);
    if(prev === 'no') r.no = Math.max(0, r.no - 1);
    // add new
    if(choice === 'yes') r.yes = (r.yes || 0) + 1;
    if(choice === 'no') r.no = (r.no || 0) + 1;
    r.user = choice;
  }
  updateModalChart(event);
  updateModalButtons(event);
}

// filter gallery items in #gallery-all by data-group
function filterGallery(filter){
  const items = document.querySelectorAll('#gallery-all .gallery-item');
  if(!items) return;
  items.forEach(it=>{
    if(filter === 'all') it.style.display = '';
    else {
      const g = it.dataset.group;
      it.style.display = (g === filter) ? '' : 'none';
    }
  });
}
