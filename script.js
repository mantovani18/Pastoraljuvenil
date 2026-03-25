const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQA5-kIyDfIr2981yaxAA-GSPuRFODF-Kkq-XhD6zFEeMG2KXTMACCeQxlkbmuXPGTVA/exec';

const EVENT_CONFIG = {
  name: 'Amoriza',
  description: 'Um encontro jovem para viver a fe, a amizade e a missao com alegria.',
  image: 'evento-amoriza.jpg',
  date: 'Em breve',
  location: 'Paroquia Sao Jose'
};

document.addEventListener('DOMContentLoaded', ()=>{
  applyEventContent();
  setupMenu();
  setupRegistrationModal();
  setupForm();
});

function applyEventContent(){
  const nameEl = document.getElementById('event-name');
  const descEl = document.getElementById('event-description');
  const imgEl = document.getElementById('event-image');
  const dateEl = document.getElementById('event-date');
  const locEl = document.getElementById('event-location');
  const dateCard = document.getElementById('event-date-card');
  const locCard = document.getElementById('event-location-card');
  const shortEl = document.getElementById('event-short');
  const inputEl = document.getElementById('event-name-input');
  const summaryName = document.getElementById('summary-name');
  const summaryDesc = document.getElementById('summary-description');
  const summaryDate = document.getElementById('summary-date');
  const summaryLocation = document.getElementById('summary-location');

  if(nameEl) nameEl.textContent = EVENT_CONFIG.name;
  if(descEl) descEl.textContent = EVENT_CONFIG.description;
  if(imgEl){
    imgEl.src = EVENT_CONFIG.image;
    imgEl.alt = `Imagem do evento ${EVENT_CONFIG.name}`;
  }
  if(dateEl) dateEl.textContent = EVENT_CONFIG.date;
  if(locEl) locEl.textContent = EVENT_CONFIG.location;
  if(dateCard) dateCard.textContent = EVENT_CONFIG.date;
  if(locCard) locCard.textContent = EVENT_CONFIG.location;
  if(shortEl) shortEl.textContent = EVENT_CONFIG.description;
  if(inputEl) inputEl.value = EVENT_CONFIG.name;
  if(summaryName) summaryName.textContent = EVENT_CONFIG.name;
  if(summaryDesc) summaryDesc.textContent = EVENT_CONFIG.description;
  if(summaryDate) summaryDate.textContent = EVENT_CONFIG.date;
  if(summaryLocation) summaryLocation.textContent = EVENT_CONFIG.location;
}

function setupMenu(){
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('site-menu');
  const overlay = document.getElementById('menu-overlay');
  if(!toggle || !menu || !overlay) return;

  const closeMenu = () => {
    menu.classList.remove('open');
    overlay.classList.remove('show');
    menu.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
  };
  const openMenu = () => {
    menu.classList.add('open');
    overlay.classList.add('show');
    menu.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
  };

  toggle.addEventListener('click', ()=>{
    const isOpen = menu.classList.contains('open');
    if(isOpen) closeMenu(); else openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  menu.querySelectorAll('a, button').forEach(link=> link.addEventListener('click', closeMenu));
}

function setupForm(){
  const form = document.getElementById('registration-form');
  const status = document.getElementById('form-status');
  const contactInput = form ? form.querySelector('input[name="contato"]') : null;
  if(!form) return;

  if(contactInput){
    contactInput.addEventListener('input', ()=>{
      contactInput.value = formatPhone(contactInput.value);
    });
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      evento: data.get('evento') || EVENT_CONFIG.name,
      nome: String(data.get('nome') || '').trim(),
      idade: String(data.get('idade') || '').trim(),
      contato: String(data.get('contato') || '').trim(),
      alergia: String(data.get('alergia') || '').trim() || 'Nao informado'
    };

    if(!payload.nome || !payload.idade || !payload.contato){
      if(status) status.textContent = 'Preencha nome, idade e contato.';
      return;
    }

    if(!GOOGLE_SCRIPT_URL){
      if(status) status.textContent = 'Inscricao pronta. Configure a URL do Google Sheets no script.js.';
      return;
    }

    if(status) status.textContent = 'Enviando inscricao...';
    try{
      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
      if(!resp.ok) throw new Error('Erro no envio');
      if(status) status.textContent = 'Inscricao enviada com sucesso.';
      form.reset();
      const inputEl = document.getElementById('event-name-input');
      if(inputEl) inputEl.value = EVENT_CONFIG.name;
    } catch (err){
      if(status) status.textContent = 'Nao foi possivel enviar agora. Tente novamente.';
    }
  });
}

function setupRegistrationModal(){
  const modal = document.getElementById('registration-modal');
  const overlay = document.getElementById('registration-overlay');
  const closeBtn = document.getElementById('registration-close');
  const openButtons = document.querySelectorAll('[data-open-registration]');
  if(!modal || !overlay) return;

  const openModal = () => {
    modal.classList.add('show');
    overlay.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
  };
  const closeModal = () => {
    modal.classList.remove('show');
    overlay.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
  };

  openButtons.forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault();
    openModal();
  }));
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeModal();
  });
}

function formatPhone(value){
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if(digits.length <= 2) return `(${digits}`;
  if(digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if(digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}
