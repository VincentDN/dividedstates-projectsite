/* Progressive enhancement only. All copy, links and schema live in index.html. */
(() => {
  'use strict';
  document.documentElement.classList.add('enhanced');

  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#navigation-links');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });

  const player = document.querySelector('#video-player');
  const caption = document.querySelector('#video-caption');
  const choices = [...document.querySelectorAll('.video-choice')];
  function playVideo(choice) {
    const videoId = choice.dataset.video;
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return;
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
    frame.title = choice.dataset.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    player.replaceChildren(frame);
    caption.textContent = choice.dataset.title;
    choices.forEach(item => item.setAttribute('aria-pressed', String(item === choice)));
  }
  document.querySelector('.play-video').addEventListener('click', () => playVideo(choices[0]));
  choices.forEach(choice => choice.addEventListener('click', () => playVideo(choice)));
  document.querySelectorAll('[data-play-video]').forEach(link => link.addEventListener('click', () => {
    const choice = choices.find(item => item.dataset.video === link.dataset.playVideo);
    if (choice) playVideo(choice);
  }));

  // Native scrolling keeps every biography available without JavaScript.
  const crewTrack = document.querySelector('#crew-track');
  const crewPrevious = document.querySelector('.crew-prev');
  const crewNext = document.querySelector('.crew-next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function updateCrewControls() {
    const end = crewTrack.scrollWidth - crewTrack.clientWidth;
    crewPrevious.disabled = crewTrack.scrollLeft <= 2;
    crewNext.disabled = crewTrack.scrollLeft >= end - 2;
  }
  function scrollCrew(direction) {
    const card = crewTrack.querySelector('.crew-card');
    const gap = parseFloat(getComputedStyle(crewTrack).columnGap) || 0;
    crewTrack.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }
  crewPrevious.addEventListener('click', () => scrollCrew(-1));
  crewNext.addEventListener('click', () => scrollCrew(1));
  crewTrack.addEventListener('scroll', updateCrewControls, { passive: true });
  window.addEventListener('resize', updateCrewControls);
  crewTrack.addEventListener('keydown', event => {
    if (event.target !== crewTrack) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scrollCrew(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      crewTrack.scrollTo({ left: event.key === 'Home' ? 0 : crewTrack.scrollWidth, behavior: 'instant' });
    }
  });
  let crewDrag = null;
  let suppressCrewClick = false;
  crewTrack.addEventListener('pointerdown', event => {
    suppressCrewClick = false;
    if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('a,button')) return;
    crewDrag = { id: event.pointerId, x: event.clientX, left: crewTrack.scrollLeft, moved: false };
  });
  crewTrack.addEventListener('pointermove', event => {
    if (!crewDrag || event.pointerId !== crewDrag.id) return;
    const distance = event.clientX - crewDrag.x;
    if (!crewDrag.moved && Math.abs(distance) < 6) return;
    crewDrag.moved = true;
    crewTrack.setPointerCapture(event.pointerId);
    crewTrack.classList.add('is-dragging');
    crewTrack.scrollLeft = crewDrag.left - distance;
  });
  function endCrewDrag(event) {
    if (!crewDrag || event.pointerId !== crewDrag.id) return;
    suppressCrewClick = crewDrag.moved;
    crewDrag = null;
    crewTrack.classList.remove('is-dragging');
    if (crewTrack.hasPointerCapture(event.pointerId)) crewTrack.releasePointerCapture(event.pointerId);
    updateCrewControls();
  }
  window.addEventListener('pointerup', endCrewDrag);
  window.addEventListener('pointercancel', endCrewDrag);
  crewTrack.addEventListener('lostpointercapture', endCrewDrag);
  crewTrack.addEventListener('dragstart', event => event.preventDefault());
  crewTrack.addEventListener('click', event => {
    if (!suppressCrewClick) return;
    event.preventDefault();
    suppressCrewClick = false;
  }, true);
  crewTrack.classList.add('is-draggable');
  document.querySelector('.crew-controls').hidden = false;
  updateCrewControls();

  const gallery = [...document.querySelectorAll('.gallery-item')];
  const dialog = document.querySelector('#gallery-dialog');
  const image = dialog.querySelector('img');
  const imageCaption = dialog.querySelector('figcaption');
  let index = 0;
  let invoker = null;
  function showImage() {
    const selected = gallery[index];
    image.alt = selected.dataset.caption;
    image.src = selected.dataset.full;
    imageCaption.textContent = selected.dataset.caption + ' · ' + (index + 1) + ' / ' + gallery.length;
  }
  function step(amount) {
    index = (index + amount + gallery.length) % gallery.length;
    showImage();
  }
  gallery.forEach((item, position) => item.addEventListener('click', () => {
    index = position;
    invoker = item;
    showImage();
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => step(-1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => step(1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    image.removeAttribute('src');
    invoker?.focus();
  });
  image.addEventListener('error', () => {
    imageCaption.textContent = 'This image could not be loaded. Please try the next image.';
  });
  let touchStart = null;
  dialog.addEventListener('touchstart', event => {
    if (event.touches.length === 1) touchStart = [event.touches[0].clientX, event.touches[0].clientY];
  }, { passive: true });
  dialog.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Mobile gallery: keep roughly half the artwork visible until requested.
  const galleryContainer = document.querySelector('.gallery');
  if (galleryContainer && gallery.length > 13) {
    const galleryToggle = document.createElement('button');
    galleryToggle.type = 'button';
    galleryToggle.className = 'gallery-reveal';
    galleryToggle.setAttribute('aria-expanded', 'false');
    galleryToggle.textContent = 'See more artwork';
    document.querySelector('.gallery-action')?.before(galleryToggle);
    galleryToggle.addEventListener('click', () => {
      const expanded = galleryToggle.getAttribute('aria-expanded') !== 'true';
      galleryToggle.setAttribute('aria-expanded', String(expanded));
      galleryContainer.classList.toggle('gallery-expanded', expanded);
      galleryToggle.textContent = expanded ? 'Show less artwork' : 'See more artwork';
      if (!expanded) document.querySelector('#gallery')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  }

  // Compact Divided States video carousel below the main video choices.
  const videoList = document.querySelector('.video-list');
  if (videoList) {
    const shorts = [
      { id: 'fLonhsbW4B8', title: 'Strife' },
      { id: 'qiyC9opmoVM', title: 'Victoria' },
      { id: 'i1ZbyGbnAVw', title: 'George' }
    ];
    const shortsSection = document.createElement('section');
    shortsSection.className = 'tds-shorts';
    shortsSection.setAttribute('aria-labelledby', 'tds-shorts-title');
    shortsSection.innerHTML = '<div class="tds-shorts-head"><h3 id="tds-shorts-title">Divided States Shorts</h3><div class="tds-shorts-controls"><button type="button" class="tds-shorts-prev" aria-label="Previous short">‹</button><button type="button" class="tds-shorts-next" aria-label="Next short">›</button></div></div><div class="tds-shorts-track"></div>';
    const shortsTrack = shortsSection.querySelector('.tds-shorts-track');
    shorts.forEach(short => {
      const card = document.createElement('a');
      card.className = 'tds-short-card';
      card.href = 'https://www.youtube.com/watch?v=' + short.id;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = '<img src="assets/videos/' + short.id + '.jpg" alt="" width="480" height="360" loading="lazy" decoding="async"><span>' + short.title + '</span>';
      shortsTrack.append(card);
    });
    videoList.after(shortsSection);
    const scrollShorts = direction => shortsTrack.scrollBy({ left: direction * Math.max(240, shortsTrack.clientWidth * 0.72), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    shortsSection.querySelector('.tds-shorts-prev').addEventListener('click', () => scrollShorts(-1));
    shortsSection.querySelector('.tds-shorts-next').addEventListener('click', () => scrollShorts(1));
  }

  // Newsletter popup, visually matched to the Divided States site.
  const popupKey = 'tds-newsletter-popup-dismissed';
  let popupDismissed = false;
  try { popupDismissed = localStorage.getItem(popupKey) === '1'; } catch (_) {}
  if (!popupDismissed) {
    const popup = document.createElement('div');
    popup.className = 'tds-newsletter-popup';
    popup.hidden = true;
    popup.innerHTML = '<div class="tds-newsletter-backdrop"></div><section class="tds-newsletter-card" role="dialog" aria-modal="true" aria-labelledby="tds-newsletter-title"><button class="tds-newsletter-close" type="button" aria-label="Close newsletter popup">×</button><img src="assets/crew-on-set.jpg" alt="The Kaiser Cat Cinema crew on the set of The Divided States: Strife" width="1920" height="1005"><div class="tds-newsletter-copy"><h2 id="tds-newsletter-title">Support The Divided States &amp; join the newsletter!</h2><p>If you\'d like to support the project, join the Kaiser Cat Cinema newsletter. We share project updates, behind-the-scenes material and new releases in our State of the Cinema digest.</p><a class="button" href="https://kaisercatcinema.com/pages/connect">Join the newsletter</a></div></section>';
    document.body.append(popup);
    const closePopup = () => {
      popup.hidden = true;
      document.body.classList.remove('newsletter-popup-open');
      try { localStorage.setItem(popupKey, '1'); } catch (_) {}
    };
    popup.querySelector('.tds-newsletter-close').addEventListener('click', closePopup);
    popup.querySelector('.tds-newsletter-backdrop').addEventListener('click', closePopup);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popup.hidden) closePopup();
    });
    window.setTimeout(() => {
      popup.hidden = false;
      document.body.classList.add('newsletter-popup-open');
      popup.querySelector('.tds-newsletter-close').focus();
    }, 12000);
  }

  const enhancements = document.createElement('style');
  enhancements.textContent = `
    .gallery-reveal{display:none;margin:24px auto 0;padding:12px 28px;border:1px solid #777;background:#151515;color:#fff;font:700 14px/1.4 var(--display-font);letter-spacing:1px;text-transform:uppercase}
    .gallery-reveal:hover{background:#292929}
    .tds-shorts{margin-top:34px;border-top:1px solid #3a3a3a;padding-top:24px}
    .tds-shorts-head{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:16px}
    .tds-shorts-head h3{margin:0;font:700 22px/1.25 var(--display-font)}
    .tds-shorts-controls{display:flex;gap:8px}
    .tds-shorts-controls button{width:42px;height:42px;border:1px solid #666;background:#151515;color:#fff;font-size:26px;line-height:1}
    .tds-shorts-controls button:hover{background:#292929}
    .tds-shorts-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(220px,31%);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding-bottom:10px;scrollbar-width:thin;scrollbar-color:#777 #222}
    .tds-short-card{scroll-snap-align:start;display:block;background:#151515;border:1px solid #333;color:#eee;text-decoration:none;overflow:hidden}
    .tds-short-card:hover{border-color:#777;color:#fff}
    .tds-short-card img{width:100%;aspect-ratio:16/9;object-fit:cover}
    .tds-short-card span{display:block;padding:10px 12px;font-weight:700}
    .tds-newsletter-popup[hidden]{display:none!important}
    .tds-newsletter-popup{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px}
    .tds-newsletter-backdrop{position:absolute;inset:0;background:#000d}
    .tds-newsletter-card{position:relative;z-index:1;width:min(760px,94vw);max-height:90dvh;overflow:auto;background:#111;border:1px solid #555;box-shadow:0 18px 60px #000;color:#d3d3d3}
    .tds-newsletter-card>img{width:100%;aspect-ratio:1.91/1;object-fit:cover}
    .tds-newsletter-copy{padding:30px 34px 34px;text-align:center}
    .tds-newsletter-copy h2{font:700 30px/1.18 var(--display-font);margin-bottom:16px;color:#fff}
    .tds-newsletter-copy p{max-width:620px;margin:0 auto 24px;line-height:1.7}
    .tds-newsletter-close{position:absolute;top:10px;right:10px;z-index:2;width:44px;height:44px;border:1px solid #777;background:#111e;color:#fff;font-size:30px;line-height:1}
    .tds-newsletter-close:hover{background:#333}
    body.newsletter-popup-open{overflow:hidden}
    @media(max-width:600px){
      .gallery:not(.gallery-expanded) .gallery-item:nth-child(n+14){display:none}
      .gallery-reveal{display:block}
      .tds-shorts{margin-top:28px}
      .tds-shorts-track{grid-auto-columns:78%}
      .tds-shorts-controls{display:none}
      .tds-newsletter-popup{padding:12px}
      .tds-newsletter-copy{padding:24px 20px 28px}
      .tds-newsletter-copy h2{font-size:25px}
      .tds-newsletter-copy .button{width:100%;padding-inline:18px}
    }
    @media print{.gallery-reveal,.tds-shorts,.tds-newsletter-popup{display:none!important}}
  `;
  document.head.append(enhancements);
})();
