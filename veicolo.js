document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     0) INTERAZIONI HEADER (posizione -> mappa, email -> copia)
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
     1) CARICAMENTO SCHEDA VEICOLO DA GITHUB
     ===================================================== */
  const GITHUB_USERNAME = "autofllimingrone";
  const GITHUB_REPO = "Ionica-Auto-Fratelli-Mingrone";

  const detailEl = document.getElementById('vehicleDetail');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    detailEl.innerHTML = `<p class="detail-error">Veicolo non trovato.</p>`;
    return;
  }

  async function loadVehicle() {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/content/veicoli`);
      if (!res.ok) throw new Error("Impossibile recuperare i file dalla repository");

      const files = await res.json();
      const match = files.find(f => f.name === `${id}.json`);
      if (!match) throw new Error("Veicolo non trovato");

      const vehicle = await fetch(match.download_url).then(r => r.json());
      renderVehicle(vehicle);

    } catch (err) {
      console.error("Errore durante il caricamento del veicolo:", err);
      detailEl.innerHTML = `<p class="detail-error">Impossibile caricare il veicolo richiesto.</p>`;
    }
  }

  function renderVehicle(v) {
    document.title = `${v.titolo || 'Veicolo'} usata a Corigliano Rossano - Ionica Auto Fratelli Mingrone`;

    // Aggiornamento dinamico dei meta tag SEO per questo specifico veicolo
    const pageUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(id)}`;
    const seoDescription = `${v.titolo || 'Veicolo'}${v.anno ? ' anno ' + v.anno : ''}${v.kilometri ? ', ' + Number(v.kilometri).toLocaleString('it-IT') + ' km' : ''}. In vendita da Ionica Auto Fratelli Mingrone, Corigliano Rossano (CS). Contattaci per informazioni e disponibilità.`;
    const metaDescEl = document.getElementById('metaDescription');
    if (metaDescEl) metaDescEl.setAttribute('content', seoDescription);
    const canonicalEl = document.getElementById('canonicalLink');
    if (canonicalEl) canonicalEl.setAttribute('href', pageUrl);
    const ogTitleEl = document.getElementById('ogTitle');
    if (ogTitleEl) ogTitleEl.setAttribute('content', `${v.titolo || 'Veicolo'} - Ionica Auto Fratelli Mingrone`);
    const ogDescEl = document.getElementById('ogDescription');
    if (ogDescEl) ogDescEl.setAttribute('content', seoDescription);
    const ogImageEl = document.getElementById('ogImage');
    if (ogImageEl && v.foto_copertina) ogImageEl.setAttribute('content', v.foto_copertina);

    // Galleria foto (copertina + galleria, senza duplicati)
    let photos = [];
    if (v.foto_copertina) photos.push(v.foto_copertina);
    if (Array.isArray(v.galleria)) {
      v.galleria.forEach(img => {
        const photoUrl = typeof img === 'string' ? img : (img && img.foto);
        if (photoUrl && !photos.includes(photoUrl)) {
          photos.push(photoUrl);
        }
      });
    }
    if (photos.length === 0) {
      photos.push('https://placehold.co/800x550/cccccc/666666?text=No+Foto');
    }

    const hasPrezzo = v.prezzo !== undefined && v.prezzo !== null && v.prezzo !== '';
    const formattedPrezzo = hasPrezzo ? Number(v.prezzo).toLocaleString('it-IT') : '';
    const hasKm = v.kilometri !== undefined && v.kilometri !== null && v.kilometri !== '';
    const formattedKm = hasKm ? Number(v.kilometri).toLocaleString('it-IT') : '-';
    const titolo = v.titolo || 'Senza Titolo';

    // Costruzione dinamica di tutte le specifiche dal CMS
    const specsRows = [
      ['Kilometri', hasKm ? `${formattedKm} km` : '-'],
      ['Anno Immatricolazione', v.anno || '-'],
      ['Alimentazione', v.alimentazione || '-'],
      ['Cambio', v.cambio || '-']
    ];

    if (v.cilindrata) {
      specsRows.push(['Cilindrata', `${Number(v.cilindrata).toLocaleString('it-IT')} cc`]);
    }

    // Potenza: CV e kW mostrati insieme ma chiaramente differenziati con due badge
    if (v.potenza || v.kilowatt) {
      const powerParts = [];
      if (v.potenza) powerParts.push(`${v.potenza} CV`);
      if (v.kilowatt) powerParts.push(`${v.kilowatt} kW`);
      specsRows.push(['Potenza', powerParts.join(' - ')]);
    }

    detailEl.innerHTML = `
      <div class="detail-header">
        <a href="index.html" class="back-arrow" aria-label="Torna indietro">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>
        </a>
        <h1 class="detail-title">${escapeHtml(titolo)}</h1>
      </div>

      <div class="detail-grid">
        <div class="detail-gallery">
          <div class="detail-main-photo">
            <img id="detailMainImg" src="${photos[0]}" alt="${escapeHtml(titolo)}">
            ${photos.length > 1 ? `
              <button class="photo-nav prev-photo" id="detailPrevBtn" aria-label="Foto precedente">&#8249;</button>
              <button class="photo-nav next-photo" id="detailNextBtn" aria-label="Foto successiva">&#8250;</button>
              <span class="photo-counter"><span id="detailCurrentIdx">1</span>/${photos.length}</span>
            ` : ''}
          </div>
          ${photos.length > 1 ? `
          <div class="detail-thumbs" id="detailThumbs">
            ${photos.map((p, i) => `
              <button class="detail-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Foto ${i + 1}">
                <img src="${p}" alt="${escapeHtml(titolo)} - foto ${i + 1}">
              </button>
            `).join('')}
          </div>` : ''}
        </div>

        <aside class="detail-sidebar">
          <div class="detail-price-box">
            <span class="price-label">${hasPrezzo ? 'TUA A:' : ''}</span>
            <span class="price-value${hasPrezzo ? '' : ' price-onrequest'}">${hasPrezzo ? `&euro; ${formattedPrezzo}` : 'Trattativa riservata'}</span>
          </div>
          <ul class="detail-specs-list">
            ${specsRows.map(([label, val]) => `
              <li><span class="detail-spec-label">${label}</span><strong class="detail-spec-value">${val}</strong></li>
            `).join('')}
          </ul>
          <div class="detail-actions vehicle-actions">
            <div class="detail-contact-row">
              <span class="contact-label">CONTATTACI</span>
              <a href="tel:+393317047561" class="btn-icon" aria-label="Chiama">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg>
                <span class="btn-icon-text">Telefono</span>
              </a>
              <a href="https://wa.me/393317047561" target="_blank" rel="noopener" class="btn-icon btn-icon-wa" aria-label="Scrivi su WhatsApp">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.4.8 3.1 1.3 5 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.8-2-1.4-.5-.5-.9-1.1-1.3-1.7-.1-.2 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.1-.4-.2z"/></svg>
                <span class="btn-icon-text">WhatsApp</span>
              </a>
            </div>
          </div>
        </aside>
      </div>

      ${v.info ? `
      <div class="detail-info-section">
        <h3 class="detail-info-title">ALTRE INFORMAZIONI</h3>
        <p class="detail-description">${escapeHtml(v.info).replace(/\n/g, '<br>')}</p>
      </div>` : ''}

      <a href="index.html" class="back-link">&larr; Torna ai veicoli disponibili</a>

      <div class="lightbox-overlay" id="lightboxOverlay" hidden>
        <div class="lightbox-img-wrap">
          <button class="lightbox-close" id="lightboxClose" aria-label="Chiudi">&times;</button>
          ${photos.length > 1 ? `
            <button class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Foto precedente">&#8249;</button>
            <button class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Foto successiva">&#8250;</button>
          ` : ''}
          <img id="lightboxImg" src="${photos[0]}" alt="${escapeHtml(titolo)}">
          ${photos.length > 1 ? `<span class="lightbox-counter"><span id="lightboxCurrentIdx">1</span>/${photos.length}</span>` : ''}
        </div>
      </div>
    `;

    /* ---- Stato galleria condiviso tra thumbnail, frecce e lightbox ---- */
    let activeIdx = 0;
    const mainImg = document.getElementById('detailMainImg');
    const thumbs = detailEl.querySelectorAll('.detail-thumb');
    const currentIdxEl = document.getElementById('detailCurrentIdx');

    function setActivePhoto(idx) {
      activeIdx = (idx + photos.length) % photos.length;
      mainImg.src = photos[activeIdx];
      if (currentIdxEl) currentIdxEl.textContent = activeIdx + 1;
      thumbs.forEach(t => t.classList.toggle('active', Number(t.dataset.idx) === activeIdx));
    }

    // Miniature
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => setActivePhoto(Number(thumb.dataset.idx)));
    });

    // Frecce sulla foto principale
    if (photos.length > 1) {
      document.getElementById('detailPrevBtn').addEventListener('click', () => setActivePhoto(activeIdx - 1));
      document.getElementById('detailNextBtn').addEventListener('click', () => setActivePhoto(activeIdx + 1));
    }

    /* ---- Lightbox (popup foto a schermo intero) ---- */
    const overlay = document.getElementById('lightboxOverlay');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCounter = document.getElementById('lightboxCurrentIdx');

    function openLightbox(idx) {
      setActivePhoto(idx);
      updateLightboxImg();
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      overlay.hidden = true;
      document.body.style.overflow = '';
    }

    function updateLightboxImg() {
      lightboxImg.src = photos[activeIdx];
      if (lightboxCounter) lightboxCounter.textContent = activeIdx + 1;
    }

    function lightboxPrev() {
      setActivePhoto(activeIdx - 1);
      updateLightboxImg();
    }

    function lightboxNext() {
      setActivePhoto(activeIdx + 1);
      updateLightboxImg();
    }

    mainImg.addEventListener('click', () => openLightbox(activeIdx));
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });

    if (photos.length > 1) {
      document.getElementById('lightboxPrev').addEventListener('click', lightboxPrev);
      document.getElementById('lightboxNext').addEventListener('click', lightboxNext);
    }

    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && photos.length > 1) lightboxPrev();
      if (e.key === 'ArrowRight' && photos.length > 1) lightboxNext();
    });

    /* ---- Dati strutturati Schema.org Vehicle (aiuta Google a capire i dettagli dell'auto) ---- */
    const vehicleSchema = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      "name": titolo,
      "image": photos,
      "url": pageUrl,
      "vehicleModelDate": v.anno || undefined,
      "mileageFromOdometer": hasKm ? { "@type": "QuantitativeValue", "value": v.kilometri, "unitCode": "KMT" } : undefined,
      "fuelType": v.alimentazione || undefined,
      "vehicleTransmission": v.cambio || undefined,
      "vehicleEngine": v.cilindrata ? { "@type": "EngineSpecification", "engineDisplacement": `${v.cilindrata} cc` } : undefined,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": hasPrezzo ? v.prezzo : undefined,
        "availability": "https://schema.org/InStock",
        "url": pageUrl,
        "seller": {
          "@type": "AutoDealer",
          "name": "Ionica Auto Fratelli Mingrone",
          "telephone": "+393317047561"
        }
      }
    };
    // Rimuove le chiavi con valore undefined per non generare JSON-LD sporco
    const cleanSchema = JSON.parse(JSON.stringify(vehicleSchema, (k, val) => val === undefined ? undefined : val));
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(cleanSchema);
    document.head.appendChild(schemaScript);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadVehicle();
});