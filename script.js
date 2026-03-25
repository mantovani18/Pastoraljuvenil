const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwuOyuRMnJpJod-RU_JhSjBi8wH6z8qcoaor_zBCsCMIosrXjOaI-quvSDC9rlkBfMkHQ/exec';

const EVENT_CONFIG = {
  name: 'Amoriza',
  description: 'O AMOR FLORESCEU EM MIM - DESPERTAR',
  image: 'imgEvento/Amoriza.jpeg',
  date: '01/02/03 de Maio de 2026',
  location: 'Paroquia São José',
  group: 'Pastoral Juvenil',
  paid: true,
  price: 'R$ 80,00',
  pixKey: '07799478942'
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
  const summaryPrice = document.getElementById('summary-price');
  const paymentNote = document.getElementById('payment-note');

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
  if(summaryPrice) summaryPrice.textContent = EVENT_CONFIG.paid ? `Valor: ${EVENT_CONFIG.price}` : 'Evento gratuito';
  if(paymentNote) paymentNote.textContent = EVENT_CONFIG.paid
    ? `Inscrição: ${EVENT_CONFIG.price}. PIX: ${EVENT_CONFIG.pixKey}. Envie o comprovante para concluir.`
    : 'Evento gratuito. Não é necessário comprovante.';
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
  const proofInput = form ? form.querySelector('input[name="comprovante"]') : null;
  if(!form) return;

  if(contactInput){
    contactInput.addEventListener('input', ()=>{
      contactInput.value = formatPhone(contactInput.value);
    });
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    const comprovanteFile = proofInput && proofInput.files ? proofInput.files[0] : null;

    if(EVENT_CONFIG.paid && !comprovanteFile){
      if(status) status.textContent = `Envie o comprovante para concluir a inscrição (${EVENT_CONFIG.price}).`;
      return;
    }

    if(comprovanteFile && comprovanteFile.size > 6 * 1024 * 1024){
      if(status) status.textContent = 'O comprovante deve ter no máximo 6MB.';
      return;
    }

    let comprovanteData = null;
    if(comprovanteFile){
      try {
        comprovanteData = await readFileAsBase64(comprovanteFile);
      } catch (_error) {
        if(status) status.textContent = 'Não foi possível ler o comprovante. Tente outro arquivo.';
        return;
      }
    }

    const payload = {
      evento: data.get('evento') || EVENT_CONFIG.name,
      nome: String(data.get('nome') || '').trim(),
      idade: String(data.get('idade') || '').trim(),
      contato: String(data.get('contato') || '').trim(),
      alergia: String(data.get('alergia') || '').trim() || 'Nao informado',
      comprovanteNome: comprovanteData ? comprovanteData.fileName : '',
      comprovanteMimeType: comprovanteData ? comprovanteData.mimeType : '',
      comprovanteBase64: comprovanteData ? comprovanteData.base64 : ''
    };

    if(!payload.nome || !payload.idade || !payload.contato){
      if(status) status.textContent = 'Preencha nome, idade e contato.';
      return;
    }

    const scriptUrl = GOOGLE_SCRIPT_URL.trim();
    if(!scriptUrl){
      if(status) status.textContent = 'Inscricao pronta. Configure a URL do Google Sheets no script.js.';
      return;
    }

    if(status) status.textContent = EVENT_CONFIG.paid ? 'Enviando inscrição e comprovante...' : 'Enviando inscrição...';
    try{
      const result = await sendRegistration(scriptUrl, payload);
      if(status) status.textContent = result.message;
      form.reset();
      const inputEl = document.getElementById('event-name-input');
      if(inputEl) inputEl.value = EVENT_CONFIG.name;
    } catch (err){
      if(status) status.textContent = err.message || 'Nao foi possivel enviar agora. Tente novamente.';
    }
  });
}

function readFileAsBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : '';
      if(!base64){
        reject(new Error('Arquivo inválido'));
        return;
      }
      resolve({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64
      });
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function sendRegistration(scriptUrl, payload){
  const body = JSON.stringify(payload);

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body
    });

    if(!response.ok) {
      throw new Error(`Falha HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (_parseError) {
      data = null;
    }

    if(data && data.ok === false){
      throw new Error(data.error || 'O script retornou erro no processamento.');
    }

    if(!data && contentType.includes('text/html')){
      if(rawText.includes('Função de script não encontrada: doPost') || rawText.includes('Funcao de script nao encontrada: doPost')){
        throw new Error('A URL existe, mas o Apps Script nao tem a funcao doPost publicada.');
      }
      if(rawText.includes('<title>Erro</title>')){
        throw new Error('O Apps Script retornou uma pagina de erro em vez de confirmar a inscricao.');
      }
    }

    return { message: 'Inscricao enviada com sucesso.' };
  } catch (firstError) {
    if(String(firstError.message || '').toLowerCase().includes('dopost')){
      throw firstError;
    }
    throw new Error(`Nao foi possivel enviar a inscricao (${firstError.message}).`);
  }
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
