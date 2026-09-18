/* Progressive enhancement only. All copy, links and schema live in index.html. */
(() => {
  'use strict';
  document.documentElement.classList.add('enhanced');

  // Conversion tracking via Cloudflare Zaraz (zaraz.track), enabled per-zone
  // in the Cloudflare dashboard with a destination (e.g. GA4) configured
  // there. No-ops until Zaraz is turned on, so this ships ahead of that
  // dashboard step. See README "Conversion tracking".
  const track = (name, props) => {
    try { window.zaraz && window.zaraz.track(name, props); } catch (_) {}
  };

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
    track('video_play', { video_id: videoId, title: choice.dataset.title });
  }
  document.querySelector('.play-video').addEventListener('click', () => playVideo(choices[0]));
  choices.forEach(choice => choice.addEventListener('click', () => playVideo(choice)));
  document.querySelectorAll('[data-play-video]').forEach(link => link.addEventListener('click', () => {
    const choice = choices.find(item => item.dataset.video === link.dataset.playVideo);
    if (choice) playVideo(choice);
  }));

  // Native scrolling keeps every card's content available without JavaScript.
  // Shared by the Crew and Factions rows below -- same arrow-button +
  // pointer-drag + keyboard behaviour for both, parameterised by prefix
  // (element ids/classes are "<prefix>-track", ".<prefix>-prev", etc).
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function initCarousel(prefix, cardSelector) {
    const track = document.querySelector('#' + prefix + '-track');
    const previous = document.querySelector('.' + prefix + '-prev');
    const next = document.querySelector('.' + prefix + '-next');
    const controls = document.querySelector('.' + prefix + '-controls');
    if (!track || !previous || !next) return;
    function updateControls() {
      const end = track.scrollWidth - track.clientWidth;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= end - 2;
    }
    function scroll(direction) {
      const card = track.querySelector(cardSelector);
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: reducedMotion.matches ? 'instant' : 'smooth'
      });
    }
    previous.addEventListener('click', () => scroll(-1));
    next.addEventListener('click', () => scroll(1));
    track.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        scroll(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: 'instant' });
      }
    });
    let drag = null;
    let suppressClick = false;
    track.addEventListener('pointerdown', event => {
      suppressClick = false;
      if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('a,button')) return;
      drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
    });
    track.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 6) return;
      drag.moved = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
      track.scrollLeft = drag.left - distance;
    });
    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = drag.moved;
      drag = null;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      updateControls();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    track.addEventListener('lostpointercapture', endDrag);
    track.addEventListener('dragstart', event => event.preventDefault());
    track.addEventListener('click', event => {
      if (!suppressClick) return;
      event.preventDefault();
      suppressClick = false;
    }, true);
    track.classList.add('is-draggable');
    if (controls) controls.hidden = false;
    updateControls();
  }
  initCarousel('crew', '.crew-card');
  initCarousel('faction', '.faction-card');

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

  // Keep roughly half the artwork visible until the visitor asks to expand it.
  const galleryContainer = document.querySelector('.gallery');
  const galleryShell = document.querySelector('.gallery-shell');
  const galleryToggle = document.querySelector('.gallery-reveal');
  if (galleryContainer && galleryShell && galleryToggle && gallery.length > 12) {
    galleryToggle.addEventListener('click', () => {
      const expanded = galleryToggle.getAttribute('aria-expanded') !== 'true';
      galleryToggle.setAttribute('aria-expanded', String(expanded));
      galleryContainer.classList.toggle('gallery-expanded', expanded);
      galleryShell.classList.toggle('is-expanded', expanded);
      galleryToggle.textContent = expanded ? 'Show Less Art' : 'Show More Art';
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
        track('video_play', { title: shortVideo.dataset.title });
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

  // Newsletter popup, visually matched to the Divided States site. Built
  // unconditionally so the footer eagle can always summon it, even after
  // its automatic 40s appearance has already been dismissed once.
  const popupKey = 'tds-newsletter-popup-dismissed';
  const popup = document.createElement('div');
  popup.className = 'tds-newsletter-popup';
  popup.hidden = true;
  popup.innerHTML = '<div class="tds-newsletter-backdrop"></div><section class="tds-newsletter-card" role="dialog" aria-modal="true" aria-labelledby="tds-newsletter-title" tabindex="-1"><button class="tds-newsletter-close" type="button" aria-label="Close newsletter popup">×</button><img src="assets/crew-on-set.jpg" alt="The Kaiser Cat Cinema crew on the set of The Divided States: Strife" width="1920" height="1005"><div class="tds-newsletter-copy"><h2 id="tds-newsletter-title">Support The Divided States &amp; join the newsletter!</h2><p>If you\'d like to support the project, join the Kaiser Cat Cinema newsletter. We share project updates, behind-the-scenes material and new releases in our State of the Cinema digest.</p><div class="newsletter-widget"><form class="newsletter-form" novalidate><div class="newsletter-form-row"><label class="sr-only" for="tdsPopupEmail">Email address</label><input type="email" id="tdsPopupEmail" name="email" placeholder="Your email" autocomplete="email" required><button type="submit" class="button newsletter-button">Sign Up</button></div><input type="text" name="company" class="newsletter-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="newsletter-error" role="alert" hidden></p></form></div></div></section>';
  document.body.append(popup);
  const closePopup = () => {
    popup.hidden = true;
    document.body.classList.remove('newsletter-popup-open');
    try { localStorage.setItem(popupKey, '1'); } catch (_) {}
  };
  const openPopup = () => {
    popup.hidden = false;
    document.body.classList.add('newsletter-popup-open');
    popup.querySelector('.tds-newsletter-card').focus();
  };
  popup.querySelector('.tds-newsletter-close').addEventListener('click', closePopup);
  popup.querySelector('.tds-newsletter-backdrop').addEventListener('click', closePopup);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popup.hidden) closePopup();
  });

  // Footer eagle: a quiet manual trigger, alongside its existing "back to top" link.
  document.querySelector('.footer-mark')?.addEventListener('click', () => openPopup());

  let popupDismissed = false;
  try { popupDismissed = localStorage.getItem(popupKey) === '1'; } catch (_) {}
  if (!popupDismissed) window.setTimeout(openPopup, 40000);

  // Newsletter signup: posts to /api/subscribe (a Cloudflare Pages Function),
  // which adds the email to Shopify Mail via the Shopify Admin API. Wires up
  // every .newsletter-form on the page (the Connect section and the popup).
  document.querySelectorAll('.newsletter-form').forEach(form => {
    const widget = form.closest('.newsletter-widget');
    const emailInput = form.querySelector('input[type="email"]');
    const honeypot = form.querySelector('.newsletter-hp');
    const error = form.querySelector('.newsletter-error');
    const submit = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (honeypot.value) return;
      const email = emailInput.value.trim();
      if (!email) return;
      submit.disabled = true;
      error.hidden = true;
      const originalLabel = submit.textContent;
      submit.textContent = 'Signing Up…';
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, company: honeypot.value })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok) {
          widget.innerHTML = '<div class="newsletter-success"><p class="newsletter-success-title">Thanks for subscribing!</p><p class="newsletter-success-copy">You will receive an email confirmation shortly.</p></div>';
          try { localStorage.setItem(popupKey, '1'); } catch (_) {}
          track('newsletter_signup', { form: widget.id || form.id || 'newsletter' });
        } else {
          error.textContent = data.error || 'Something went wrong. Please try again.';
          error.hidden = false;
        }
      } catch (_) {
        error.textContent = 'Something went wrong. Please try again.';
        error.hidden = false;
      } finally {
        if (document.body.contains(submit)) {
          submit.disabled = false;
          submit.textContent = originalLabel;
        }
      }
    });
  });

  // Outbound conversion-link tracking: clicks on links to the Shopify-backed
  // merch/flag stores (the actual purchase funnel, off-site). Delegated so
  // new links are picked up automatically without extra wiring per button.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (!/^https?:\/\/([\w-]+\.)?(kaisercatcinema|flagmaker-print)\.com/.test(link.href)) return;
    track('outbound_click', {
      url: link.href,
      label: (link.textContent || link.getAttribute('aria-label') || '').trim().slice(0, 80),
      section: link.closest('section[id]')?.id || ''
    });
  });

  const enhancements = document.createElement('style');
  enhancements.textContent = `
    .tds-newsletter-popup[hidden]{display:none!important}
    .tds-newsletter-popup{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px}
    .tds-newsletter-backdrop{position:absolute;inset:0;background:#000d}
    .tds-newsletter-card{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr);width:min(980px,94vw);max-height:calc(100dvh - 32px);overflow:hidden;background:#111;border:1px solid #555;box-shadow:0 18px 60px #000;color:#d3d3d3}
    .tds-newsletter-card:focus{outline:none}
    .tds-newsletter-card>img{width:100%;height:100%;min-height:0;object-fit:cover;object-position:center}
    .tds-newsletter-copy{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:clamp(28px,4vw,48px);text-align:left}
    .tds-newsletter-copy h2{font:700 clamp(28px,3.2vw,40px)/1.08 var(--display-font);margin-bottom:16px;color:#fff}
    .tds-newsletter-copy p{max-width:620px;margin:0 0 24px;line-height:1.6}
    .tds-newsletter-copy .button{align-self:flex-start}
    .tds-newsletter-copy .newsletter-form-row{justify-content:flex-start;margin:0}
    .tds-newsletter-close{position:absolute;top:10px;right:10px;z-index:2;width:44px;height:44px;border:0;background:#111e;color:#fff;font-size:30px;line-height:1}
    .tds-newsletter-close:hover{background:#333}
    body.newsletter-popup-open{overflow:hidden}
    @media(max-width:600px){
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
      .tds-newsletter-copy .newsletter-form-row{justify-content:center}
    }
    @media print{.gallery-reveal,.tds-shorts,.tds-newsletter-popup{display:none!important}}
  `;
  document.head.append(enhancements);
})();
