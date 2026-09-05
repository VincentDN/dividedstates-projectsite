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

  // Static, portrait Shorts carousel mirrors the American Kingdoms interaction.
  const shortsTrack = document.querySelector('#tds-shorts-track');
  if (shortsTrack) {
    const shortVideos = [...shortsTrack.querySelectorAll('.tds-short-video')];
    shortVideos.forEach(shortVideo => {
      const playShort = () => {
        if (shortVideo.dataset.playing === 'true') return;
        const frame = document.createElement('iframe');
        frame.src = shortVideo.dataset.embed;
        frame.title = shortVideo.dataset.title;
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.allowFullscreen = true;
        shortVideo.replaceChildren(frame);
        shortVideo.dataset.playing = 'true';
      };
      shortVideo.addEventListener('click', playShort);
      shortVideo.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          playShort();
        }
      });
    });
    const shortsPrevious = document.querySelector('.tds-shorts-prev');
    const shortsNext = document.querySelector('.tds-shorts-next');
    const updateShortsControls = () => {
      const end = shortsTrack.scrollWidth - shortsTrack.clientWidth;
      shortsPrevious.disabled = shortsTrack.scrollLeft <= 2;
      shortsNext.disabled = shortsTrack.scrollLeft >= end - 2;
    };
    const scrollShorts = direction => {
      const card = shortsTrack.querySelector('.tds-short-card');
      const gap = parseFloat(getComputedStyle(shortsTrack).columnGap) || 0;
      shortsTrack.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    };
    shortsPrevious.addEventListener('click', () => scrollShorts(-1));
    shortsNext.addEventListener('click', () => scrollShorts(1));
    shortsTrack.addEventListener('scroll', updateShortsControls, { passive: true });
    window.addEventListener('resize', updateShortsControls);
    shortsTrack.addEventListener('keydown', event => {
      if (event.target !== shortsTrack) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        scrollShorts(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    let shortsDrag = null;
    let suppressShortClick = false;
    shortsTrack.addEventListener('pointerdown', event => {
      suppressShortClick = false;
      if (event.pointerType === 'touch' || event.button !== 0) return;
      shortsDrag = { id: event.pointerId, x: event.clientX, left: shortsTrack.scrollLeft, moved: false };
    });
    shortsTrack.addEventListener('pointermove', event => {
      if (!shortsDrag || event.pointerId !== shortsDrag.id) return;
      const distance = event.clientX - shortsDrag.x;
      if (!shortsDrag.moved && Math.abs(distance) < 6) return;
      shortsDrag.moved = true;
      shortsTrack.classList.add('is-dragging');
      shortsTrack.scrollLeft = shortsDrag.left - distance;
    });
    const endShortsDrag = event => {
      if (!shortsDrag || event.pointerId !== shortsDrag.id) return;
      suppressShortClick = shortsDrag.moved;
      shortsDrag = null;
      shortsTrack.classList.remove('is-dragging');
    };
    window.addEventListener('pointerup', endShortsDrag);
    window.addEventListener('pointercancel', endShortsDrag);
    shortsTrack.addEventListener('click', event => {
      if (!suppressShortClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressShortClick = false;
    }, true);
    updateShortsControls();
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
    .tds-newsletter-popup[hidden]{display:none!important}
    .tds-newsletter-popup{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px}
    .tds-newsletter-backdrop{position:absolute;inset:0;background:#000d}
    .tds-newsletter-card{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr);width:min(980px,94vw);max-height:calc(100dvh - 32px);overflow:hidden;background:#111;border:1px solid #555;box-shadow:0 18px 60px #000;color:#d3d3d3}
    .tds-newsletter-card>img{width:100%;height:100%;min-height:0;object-fit:cover;object-position:center}
    .tds-newsletter-copy{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:clamp(28px,4vw,48px);text-align:left}
    .tds-newsletter-copy h2{font:700 clamp(28px,3.2vw,40px)/1.08 var(--display-font);margin-bottom:16px;color:#fff}
    .tds-newsletter-copy p{max-width:620px;margin:0 0 24px;line-height:1.6}
    .tds-newsletter-copy .button{align-self:flex-start}
    .tds-newsletter-close{position:absolute;top:10px;right:10px;z-index:2;width:44px;height:44px;border:1px solid #777;background:#111e;color:#fff;font-size:30px;line-height:1}
    .tds-newsletter-close:hover{background:#333}
    body.newsletter-popup-open{overflow:hidden}
    @media(max-width:600px){
      .gallery:not(.gallery-expanded) .gallery-item:nth-child(n+14){display:none}
      .gallery-reveal{display:block}
      .episodes-heading{margin-bottom:22px}
      .episodes-heading h2{font-size:27px}
      .episodes-heading p{font-size:14px;line-height:1.65}
      .tds-newsletter-popup{padding:12px}
      .tds-newsletter-card{grid-template-columns:1fr;grid-template-rows:minmax(150px,30dvh) auto;width:min(94vw,560px);max-height:calc(100dvh - 24px)}
      .tds-newsletter-card>img{height:100%;min-height:0}
      .tds-newsletter-copy{padding:clamp(18px,4dvh,25px) 20px;text-align:center}
      .tds-newsletter-copy h2{font-size:clamp(22px,6.5vw,28px);line-height:1.05;margin-bottom:10px}
      .tds-newsletter-copy p{font-size:clamp(13px,3.7vw,15px);line-height:1.45;margin-bottom:16px}
      .tds-newsletter-copy .button{width:100%;padding-inline:18px}
    }
    @media print{.gallery-reveal,.tds-shorts,.tds-newsletter-popup{display:none!important}}
  `;
  document.head.append(enhancements);
})();
