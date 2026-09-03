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
})();
