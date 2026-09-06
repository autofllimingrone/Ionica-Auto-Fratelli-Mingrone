/* =====================================================
   0) OTTIMIZZAZIONE FOTO (riduce i dati scaricati dai clienti)
   Passa ogni foto attraverso wsrv.nl (servizio gratuito di
   ridimensionamento/compressione immagini) chiedendo una versione
   più piccola e convertita in WebP. Se la foto è già un placeholder
   locale, la lascia invariata.
   ===================================================== */
function optimizeImg(url, width) {
  if (!url || url.startsWith('https://placehold.co')) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=75`;
}

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     1) INTERAZIONI HEADER (posizione -> mappa, email -> copia)
     ===================================================== */
  const addressBtn = document.getElementById('addressLink');
  if (addressBtn) {
    const LAT = 39.63974747859017;
    const LNG = 16.49232138723663;

    const openMaps = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const url = isIOS
        ? `https://maps.apple.com/?q=${LAT},${LNG}`
        : `https://www.google.com/maps?q=${LAT},${LNG}`;
      window.open(url, '_blank', 'noopener');
    };

    addressBtn.addEventListener('click', openMaps);
    addressBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMaps();
      }
    });
  }

  /* =====================================================
     2) SLIDER FOTO HERO
     ===================================================== */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  let currentSlide = 0;
  let sliderInterval;

  function goToSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if(slides[index]) slides[index].classList.add('active');
    if(dots[index]) dots[index].classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    if(slides.length === 0) return;
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  }

  if (slides.length > 0) {
    sliderInterval = setInterval(nextSlide, 4000);
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(sliderInterval);
        goToSlide(i);
        sliderInterval = setInterval(nextSlide, 4000);
      });
    });
  }

  /* =====================================================
     3) CARICAMENTO DEI VEICOLI DA DECAP CMS / NETLIFY
     ===================================================== */
  const vehicleList = document.getElementById('vehicleList');
  const sortSelect = document.getElementById('sort');
  const paginationNav = document.getElementById('pagination');
  
  const ITEMS_PER_PAGE = 5;
  let allVehiclesData = [];
  let currentPage = 1;

  const GITHUB_USERNAME = "autofllimingrone"; 
  const GITHUB_REPO = "Ionica-Auto-Fratelli-Mingrone";

  async function fetchVehicles() {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/content/veicoli`);

      // Cartella vuota o non ancora creata su GitHub: non è un errore di configurazione,
      // semplicemente non ci sono veicoli da mostrare.
      if (res.status === 404) {
        allVehiclesData = [];
        applySortAndRender();
        return;
      }

      if (!res.ok) {
        throw new Error("Impossibile recuperare i file dalla repository");
      }

      const files = await res.json();

      // Se la risposta non è un array (es. cartella vuota restituita come oggetto),
      // trattalo come "nessun veicolo disponibile" invece che come errore.
      if (!Array.isArray(files)) {
        allVehiclesData = [];
        applySortAndRender();
        return;
      }

      const fetchPromises = files
        .filter(file => file.name.endsWith('.json'))
        .map(file =>
          fetch(file.download_url)
            .then(r => r.json())
            .then(data => ({ ...data, _slug: file.name.replace(/\.json$/, '') }))
        );

      allVehiclesData = await Promise.all(fetchPromises);
      applySortAndRender();

    } catch (err) {
      console.error("Errore durante il caricamento dei veicoli:", err);
      vehicleList.innerHTML = `<li style="padding:20px; text-align:center;">Impossibile caricare i veicoli. Verifica la configurazione della repository.</li>`;
    }
  }

  /* =====================================================
     4) CREAZIONE DELLA CARD VEICOLO CON GALLERIA FOTO
     ===================================================== */
  function createVehicleCard(v) {
    const li = document.createElement('li');
    li.className = 'vehicle-card';

    // Solo la foto di copertina viene usata nella home: le altre foto della
    // galleria non vengono nemmeno richieste finché l'utente non apre la
    // scheda del veicolo (risparmia dati a chi sfoglia solo l'elenco).
    const coverPhoto = v.foto_copertina
      || (Array.isArray(v.galleria) && v.galleria.length > 0
        ? (typeof v.galleria[0] === 'string' ? v.galleria[0] : v.galleria[0]?.foto)
        : null)
      || 'https://placehold.co/320x220/cccccc/666666?text=No+Foto';

    // Formattazione dati con fallback per valori mancanti
    const hasPrezzo = v.prezzo !== undefined && v.prezzo !== null && v.prezzo !== '';
    const formattedPrezzo = hasPrezzo ? Number(v.prezzo).toLocaleString('it-IT') : '';
    const hasKm = v.kilometri !== undefined && v.kilometri !== null && v.kilometri !== '';
    const formattedKm = hasKm ? Number(v.kilometri).toLocaleString('it-IT') : '-';
    const titolo = v.titolo || 'Senza Titolo';
    const alimentazione = v.alimentazione || '-';
    const cambio = v.cambio || '-';
    const anno = v.anno || '-';

    li.innerHTML = `
      <div class="vehicle-photo">
        <img src="${optimizeImg(coverPhoto, 480)}" alt="${titolo}" class="card-img-active" loading="lazy" decoding="async">
      </div>
      <div class="vehicle-info">
        <h2 class="vehicle-title">${titolo}</h2>
        <ul class="vehicle-specs">
          <li><span class="spec-icon spec-icon-road"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 20L9 4"/><path d="M18 20L15 4"/><path d="M12 4v2.5"/><path d="M12 9.5v2.5"/><path d="M12 15v2.5"/></svg></span><span class="spec-label">KM</span><span class="spec-value">${formattedKm}</span></li>
          <li><span class="spec-icon">&#128197;</span><span class="spec-label">ANNO</span><span class="spec-value">${anno}</span></li>
          <li><span class="spec-icon">&#9981;</span><span class="spec-label">ALIMENTAZIONE</span><span class="spec-value">${alimentazione}</span></li>
          <li><span class="spec-icon">&#9881;</span><span class="spec-label">CAMBIO</span><span class="spec-value">${cambio}</span></li>
        </ul>
        <div class="vehicle-actions">
          <span class="contact-label">CONTATTACI</span>
          <a href="tel:+393317047561" class="btn-icon" aria-label="Chiama"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg><span class="btn-icon-text">Telefono</span></a>
          <a href="https://wa.me/393317047561" target="_blank" rel="noopener" class="btn-icon btn-icon-wa" aria-label="Scrivi su WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.4.8 3.1 1.3 5 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.8-2-1.4-.5-.5-.9-1.1-1.3-1.7-.1-.2 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.1-.4-.2z"/></svg><span class="btn-icon-text">WhatsApp</span></a>
        </div>
      </div>
      <div class="vehicle-price">
        <span class="price-label">${hasPrezzo ? 'TUA A:' : ''}</span>
        <span class="price-value${hasPrezzo ? '' : ' price-onrequest'}">${hasPrezzo ? `&euro; ${formattedPrezzo}` : 'Trattativa riservata'}</span>
      </div>
    `;

    // Apertura scheda dettaglio veicolo al click sulla card
    // (esclude i pulsanti di contatto, che hanno la loro funzione)
    li.style.cursor = 'pointer';
    li.addEventListener('click', (e) => {
      if (e.target.closest('.vehicle-actions')) return;
      if (v._slug) {
        window.location.href = `veicolo.html?id=${encodeURIComponent(v._slug)}`;
      }
    });

    return li;
  }

  /* =====================================================
     5) ORDINAMENTO E PAGINAZIONE
     ===================================================== */
  function applySortAndRender() {
    const value = sortSelect.value;

    allVehiclesData.sort((a, b) => {
      const priceA = Number(a.prezzo) || 0;
      const priceB = Number(b.prezzo) || 0;
      const kmA = Number(a.kilometri) || 0;
      const kmB = Number(b.kilometri) || 0;
      const annoA = Number(a.anno) || 0;
      const annoB = Number(b.anno) || 0;

      if (value === 'Prezzo crescente') return priceA - priceB;
      if (value === 'Prezzo decrescente') return priceB - priceA;
      if (value === 'Km crescenti') return kmA - kmB;
      if (value === 'Km decrescenti') return kmB - kmA;
      if (value === 'Anno crescente') return annoA - annoB;
      if (value === 'Anno decrescente') return annoB - annoA;
      return 0;
    });

    renderPage(1);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applySortAndRender);
  }

  function renderPage(page) {
    currentPage = page;
    vehicleList.innerHTML = '';

    // Nessun veicolo disponibile: mostra un messaggio semplice e nascondi la paginazione
    if (allVehiclesData.length === 0) {
      vehicleList.innerHTML = `<li style="padding:40px 20px; text-align:center; color: var(--gray-text);">Nessun veicolo disponibile al momento.</li>`;
      if (paginationNav) paginationNav.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(allVehiclesData.length / ITEMS_PER_PAGE) || 1;
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageVehicles = allVehiclesData.slice(start, end);

    pageVehicles.forEach(v => {
      vehicleList.appendChild(createVehicleCard(v));
    });

    renderPaginationControls(totalPages);
  }

  function renderPaginationControls(totalPages) {
    if (!paginationNav) return;
    paginationNav.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-arrow';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
    paginationNav.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-num ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => renderPage(i));
      paginationNav.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-arrow';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => renderPage(currentPage + 1));
    paginationNav.appendChild(nextBtn);
  }

  fetchVehicles();
});