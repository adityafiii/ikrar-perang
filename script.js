/**
 * ============================================================================
 * JAVASCRIPT LOGIC - CINEMATIC WEDDING THEME
 * "Departure to the Front Line" (Shutsujin)
 * Aditya Firmansyah & Salsa Nabila Ramadhani
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const coverOverlay = document.getElementById('coverOverlay');
  const btnOpenInvitation = document.getElementById('btnOpenInvitation');
  const customSelectTrigger = document.getElementById('customSelectTrigger');
  const customSelectWrapper = document.getElementById('customSelectWrapper');
  const selectedGuestText = document.getElementById('selectedGuestText');
  const guestSearchInput = document.getElementById('guestSearchInput');
  const guestOptionsList = document.getElementById('guestOptionsList');
  const displayGuestName = document.getElementById('displayGuestName');
  const bgMusic = document.getElementById('bgMusic');
  const bgMusicStory = document.getElementById('bgMusicStory') || bgMusic;
  const bgMusicClimax = document.getElementById('bgMusicClimax') || bgMusic;
  const cinematicFadeVeil = document.getElementById('cinematicFadeVeil');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicBtnText = document.getElementById('musicBtnText');
  const wishesForm = document.getElementById('wishesForm');
  const wishesList = document.getElementById('wishesList');
  const wishSenderInput = document.getElementById('wishSender');
  const wishMessageInput = document.getElementById('wishMessage');
  const toastMsg = document.getElementById('toastMsg');
  const embersCanvas = document.getElementById('embersCanvas');

  let selectedGuest = '';
  let isMusicPlaying = false;
  let audioCtx = null;
  let synthMusicInterval = null;

  // ==========================================================================
  // 1. FLOATING GLOWING EMBERS PARTICLE SYSTEM (CANVAS)
  // ==========================================================================
  if (embersCanvas) {
    const ctx = embersCanvas.getContext('2d');
    let width = (embersCanvas.width = window.innerWidth);
    let height = (embersCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = embersCanvas.width = window.innerWidth;
      height = embersCanvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = window.innerWidth < 480 ? 35 : 65;

    class EmberParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.size = Math.random() * 2.5 + 1;
        this.speedY = Math.random() * 0.8 + 0.35;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.7 + 0.2;
        this.fade = Math.random() * 0.005 + 0.002;
        // Warm Gold to Ember Orange colors
        const colors = [
          '229, 169, 59', // gold
          '255, 87, 34',  // ember orange
          '255, 179, 0',  // amber
          '247, 210, 131' // pale gold
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.02) * 0.3;
        this.opacity -= this.fade;

        if (this.y < -10 || this.opacity <= 0) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${this.color}, 0.8)`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new EmberParticle());
    }

    function animateEmbers() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateEmbers);
    }
    animateEmbers();
  }

  // ==========================================================================
  // 2. GUEST SELECTION SYSTEM (guests.js + URL param)
  // ==========================================================================
  const guestList =
    typeof GUEST_LIST !== 'undefined' && Array.isArray(GUEST_LIST)
      ? GUEST_LIST
      : ['Tamu Terhormat / Kerabat', 'Keluarga Besar', 'Sahabat & Rekan'];

  const urlParams = new URLSearchParams(window.location.search);
  const paramTo = urlParams.get('to') || urlParams.get('nama') || urlParams.get('guest');

  function renderGuestOptions(filterText = '') {
    guestOptionsList.innerHTML = '';
    const filtered = guestList.filter((name) =>
      name.toLowerCase().includes(filterText.toLowerCase().trim())
    );

    if (filtered.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'option-item no-result';
      emptyLi.textContent = 'Nama tidak ditemukan. Ketik atau gunakan opsi umum.';
      guestOptionsList.appendChild(emptyLi);
      return;
    }

    filtered.forEach((name) => {
      const li = document.createElement('li');
      li.className = `option-item ${name === selectedGuest ? 'selected' : ''}`;
      li.textContent = name;
      li.addEventListener('click', () => {
        selectGuest(name);
      });
      guestOptionsList.appendChild(li);
    });
  }

  function selectGuest(name) {
    selectedGuest = name;
    selectedGuestText.textContent = name;
    customSelectWrapper.classList.remove('open');
    if (guestSearchInput) guestSearchInput.value = '';
    renderGuestOptions();
  }

  if (paramTo) {
    const cleanParam = decodeURIComponent(paramTo).replace(/\+/g, ' ');
    if (!guestList.includes(cleanParam)) {
      guestList.unshift(cleanParam);
    }
    selectGuest(cleanParam);
  } else {
    selectGuest(guestList[0]);
  }

  customSelectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customSelectWrapper.classList.toggle('open');
    if (isOpen && guestSearchInput) {
      setTimeout(() => guestSearchInput.focus(), 100);
    }
  });

  if (guestSearchInput) {
    guestSearchInput.addEventListener('input', (e) => {
      renderGuestOptions(e.target.value);
    });
    guestSearchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  document.addEventListener('click', (e) => {
    if (!customSelectWrapper.contains(e.target)) {
      customSelectWrapper.classList.remove('open');
    }
  });

  // ==========================================================================
  // 3. CINEMATIC WEB AUDIO SOUND EFFECTS (TAIKO BOOM & DRAMATIC HITS)
  // ==========================================================================
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Deep Sub-bass Cinematic Boom on Gateway Open
  function playCinematicBoom() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.8);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.1);
    } catch (e) {
      console.warn('Audio effect error:', e);
    }
  }

  // Button Click Percussion Sound
  function playPercussiveClick() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // ==========================================================================
  // 4. OPEN INVITATION FLOW (THE GATEWAY SAKSI SUMPAH)
  // ==========================================================================
  btnOpenInvitation.addEventListener('click', () => {
    const finalGuestName =
      selectedGuest ||
      (typeof DEFAULT_GUEST_NAME !== 'undefined'
        ? DEFAULT_GUEST_NAME
        : 'Tamu Terhormat');

    if (displayGuestName) {
      displayGuestName.textContent = finalGuestName;
    }

    if (wishSenderInput) {
      wishSenderInput.value =
        finalGuestName !== 'Tamu Terhormat / Kerabat' ? finalGuestName : '';
    }

    // Play Dramatic Taiko Boom Effect
    playCinematicBoom();

    // Hide Cover with Dramatic Fade
    coverOverlay.classList.add('hidden');
    document.body.classList.remove('locked');

    // Start "Departure to the Front Line" BGM
    startMusic();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    goToPage(1);
  });

  // ==========================================================================
  // 5. AUDIO CONTROLLER (DUAL TRACK: STORY BGM & CLIMAX BGM)
  // ==========================================================================
  const SUSPENSE_START = 60.0;   // 1:00 Ancang-ancang start on Climax track
  const CLIMAX_BEAT_DROP = 69.0; // 1:09 Beat drop & slideshow trigger
  const TRACK_END = 130.5;       // ~2:11 Slideshow song conclusion

  function getActiveAudio() {
    return currentPage === 8 ? bgMusicClimax : bgMusicStory;
  }

  function fadeAudioOut(audioEl, duration = 400) {
    return new Promise((resolve) => {
      if (!audioEl || audioEl.paused) return resolve();
      const initialVol = audioEl.volume;
      const steps = 10;
      const stepTime = duration / steps;
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        audioEl.volume = Math.max(0, initialVol * (1 - currentStep / steps));
        if (currentStep >= steps) {
          clearInterval(interval);
          audioEl.pause();
          audioEl.volume = 1.0;
          resolve();
        }
      }, stepTime);
    });
  }

  function fadeAudioIn(audioEl, targetVol = 1.0, duration = 450) {
    if (!audioEl) return;
    audioEl.volume = 0;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        const steps = 10;
        const stepTime = duration / steps;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          audioEl.volume = Math.min(targetVol, (currentStep / steps) * targetVol);
          if (currentStep >= steps) {
            clearInterval(interval);
          }
        }, stepTime);
      }).catch(() => {});
    }
  }

  function startMusic() {
    isMusicPlaying = true;
    updateMusicUI(true);
    if (bgMusicStory) {
      bgMusicStory.currentTime = 0;
      bgMusicStory.volume = 1.0;
      const playPromise = bgMusicStory.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('Autoplay prevented. Using dramatic fallback synth:', err);
          startDramaticShutsujinSynth();
        });
      }
    } else {
      startDramaticShutsujinSynth();
    }
  }

  function toggleMusic() {
    playPercussiveClick();
    const activeAudio = getActiveAudio();
    if (isMusicPlaying) {
      if (bgMusicStory && !bgMusicStory.paused) bgMusicStory.pause();
      if (bgMusicClimax && !bgMusicClimax.paused) bgMusicClimax.pause();
      stopDramaticShutsujinSynth();
      isMusicPlaying = false;
      updateMusicUI(false);
      showToast('Musik dijeda');
    } else {
      if (activeAudio) {
        activeAudio
          .play()
          .then(() => {
            isMusicPlaying = true;
            updateMusicUI(true);
            showToast('Musik diputar');
          })
          .catch(() => {
            startDramaticShutsujinSynth();
            isMusicPlaying = true;
            updateMusicUI(true);
            showToast('Musik diputar');
          });
      } else {
        startDramaticShutsujinSynth();
        isMusicPlaying = true;
        updateMusicUI(true);
        showToast('Musik diputar');
      }
    }
  }

  function updateMusicUI(playing) {
    if (!musicToggleBtn) return;
    if (playing) {
      musicToggleBtn.classList.add('playing');
      musicToggleBtn.classList.remove('muted');
      if (musicBtnText) musicBtnText.textContent = 'Matikan Musik';
      musicToggleBtn.setAttribute('aria-label', 'Matikan Musik');
    } else {
      musicToggleBtn.classList.remove('playing');
      musicToggleBtn.classList.add('muted');
      if (musicBtnText) musicBtnText.textContent = 'Putar Musik';
      musicToggleBtn.setAttribute('aria-label', 'Putar Musik');
    }
  }

  musicToggleBtn.addEventListener('click', toggleMusic);

  // Dramatic Web Audio Synthesizer (Fallback mimicking the heroic tension of Shutsujin)
  function startDramaticShutsujinSynth() {
    try {
      const ctx = getAudioContext();
      // Minor cinematic battle progression (D minor heroic tension: D, F, G, A)
      const bassNotes = [73.42, 87.31, 98.00, 110.00]; // D2, F2, G2, A2
      const melodyNotes = [293.66, 349.23, 392.00, 440.00, 523.25]; // D4, F4, G4, A4, C5
      let step = 0;

      function triggerTensePulse() {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const now = ctx.currentTime;

        // Taiko-like low drum hit
        const drumOsc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(110, now);
        drumOsc.frequency.exponentialRampToValueAtTime(38, now + 0.4);
        drumGain.gain.setValueAtTime(0.18, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        drumOsc.connect(drumGain);
        drumGain.connect(ctx.destination);
        drumOsc.start(now);
        drumOsc.stop(now + 0.45);

        // Dramatic saw/brass pulse
        const brassOsc = ctx.createOscillator();
        const brassGain = ctx.createGain();
        brassOsc.type = 'sawtooth';
        const rootFreq = bassNotes[step % bassNotes.length];
        brassOsc.frequency.setValueAtTime(rootFreq, now);

        brassGain.gain.setValueAtTime(0.001, now);
        brassGain.gain.exponentialRampToValueAtTime(0.06, now + 0.1);
        brassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        // Lowpass filter for deep cinematic warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        brassOsc.connect(filter);
        filter.connect(brassGain);
        brassGain.connect(ctx.destination);

        brassOsc.start(now);
        brassOsc.stop(now + 0.95);

        step++;
      }

      synthMusicInterval = setInterval(triggerTensePulse, 600);
    } catch (e) {
      console.warn('Synth error:', e);
    }
  }

  function stopDramaticShutsujinSynth() {
    if (synthMusicInterval) {
      clearInterval(synthMusicInterval);
      synthMusicInterval = null;
    }
  }

  // ==========================================================================
  // 6. MULTI-CHAPTER STORYTELLING CONTROLLER (8 CHAPTERS)
  // ==========================================================================
  let currentPage = 1;
  const totalPages = 8;
  const pageCounterBadge = document.getElementById('pageCounterBadge');
  const pages = document.querySelectorAll('.wedding-page');
  const dots = document.querySelectorAll('.page-dots-indicator .dot');

  // Slideshow & Suspense Elements (Chapter 8)
  const suspenseScreen = document.getElementById('suspenseScreen');
  const slideshowStage = document.getElementById('slideshowStage');
  const slideTrackerBar = document.getElementById('slideTrackerBar'); // hairline-fill element
  const slideItems = document.querySelectorAll('.slides-viewport .slide-item');
  const slideshowFinishOverlay = document.getElementById('slideshowFinishOverlay');
  const btnReplaySlideshow = document.getElementById('btnReplaySlideshow');

  const TOTAL_SLIDES = slideItems.length || 12;
  const CLIMAX_DURATION = TRACK_END - CLIMAX_BEAT_DROP; // ~61.5s
  const DURATION_PER_SLIDE = CLIMAX_DURATION / TOTAL_SLIDES; // ~5.125s per slide

  // Audio Sync & Time Update Handler for Chapter 8 Climax & Slideshow
  function onClimaxTimeUpdate() {
    if (!bgMusicClimax || currentPage !== 8) return;
    const curTime = bgMusicClimax.currentTime;

    // Guard: If before 1:00 (60s), jump to 1:00
    if (curTime < SUSPENSE_START - 0.5) {
      bgMusicClimax.currentTime = SUSPENSE_START;
      return;
    }

    // Phase 1: 1:00 to 1:09 — Pure black void (Ancang-ancang)
    if (curTime < CLIMAX_BEAT_DROP) {
      if (suspenseScreen) suspenseScreen.style.display = 'flex';
      if (slideshowStage) slideshowStage.style.display = 'none';
      if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'none';
      return;
    }

    // Phase 2: 1:09 until end — Climax Beat Drop & Fullscreen Photo Slideshow
    if (curTime >= CLIMAX_BEAT_DROP && curTime < TRACK_END) {
      if (suspenseScreen) suspenseScreen.style.display = 'none';
      if (slideshowStage) slideshowStage.style.display = 'block';
      if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'none';

      const elapsedClimax = curTime - CLIMAX_BEAT_DROP;
      let activeIdx = Math.floor(elapsedClimax / DURATION_PER_SLIDE);
      if (activeIdx < 0) activeIdx = 0;
      if (activeIdx >= TOTAL_SLIDES) activeIdx = TOTAL_SLIDES - 1;

      slideItems.forEach((item, idx) => {
        if (idx === activeIdx) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      if (slideTrackerBar) {
        const overallPct = Math.min(100, Math.max(0, (elapsedClimax / CLIMAX_DURATION) * 100));
        slideTrackerBar.style.width = `${overallPct}%`;
      }
      return;
    }

    // Phase 3: Track ended (~130.5s+)
    if (curTime >= TRACK_END) {
      if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'flex';
      if (slideTrackerBar) slideTrackerBar.style.width = '100%';
    }
  }

  if (bgMusicClimax) {
    bgMusicClimax.addEventListener('timeupdate', onClimaxTimeUpdate);
    bgMusicClimax.addEventListener('ended', () => {
      if (currentPage === 8) {
        if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'flex';
      }
    });
  }

  // Replay Slideshow Button
  if (btnReplaySlideshow) {
    btnReplaySlideshow.addEventListener('click', () => {
      playPercussiveClick();
      if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'none';
      if (slideshowStage) slideshowStage.style.display = 'none';
      if (suspenseScreen) suspenseScreen.style.display = 'flex';
      if (bgMusicClimax) {
        bgMusicClimax.currentTime = SUSPENSE_START;
        bgMusicClimax.play().then(() => {
          isMusicPlaying = true;
          updateMusicUI(true);
        }).catch(() => {});
      }
    });
  }

  function executePageSwitch(pageNumber) {
    currentPage = pageNumber;

    pages.forEach((p) => {
      if (parseInt(p.getAttribute('data-page')) === currentPage) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    dots.forEach((d) => {
      if (parseInt(d.getAttribute('data-goto')) === currentPage) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });

    if (pageCounterBadge) {
      pageCounterBadge.textContent = `BAB ${currentPage} / ${totalPages}`;
    }

    // Toggle body class for fullscreen slideshow mode (hides nav/music btn)
    if (currentPage === 8) {
      document.body.classList.add('page-8-active');
    } else {
      document.body.classList.remove('page-8-active');
    }

    // For non-slideshow pages: scroll to nav top
    if (currentPage < 8) {
      const nav = document.getElementById('pageTopNav');
      if (nav) {
        nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  let isPageTransitioning = false;

  function goToPage(pageNumber, forceFade = false) {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    if (isPageTransitioning) return;

    const prevPage = currentPage;
    const isEnteringClimax = pageNumber === 8;
    const isExitingClimax = prevPage === 8 && pageNumber < 8;

    // Use cinematic fade curtain when transitioning to or from the final slideshow page
    if (forceFade || isEnteringClimax || isExitingClimax) {
      isPageTransitioning = true;
      if (cinematicFadeVeil) {
        cinematicFadeVeil.classList.add('active');
      }

      // Smooth audio fade out of current playing track
      if (isEnteringClimax) {
        fadeAudioOut(bgMusicStory, 400);
      } else if (isExitingClimax) {
        fadeAudioOut(bgMusicClimax, 400);
      }

      setTimeout(() => {
        executePageSwitch(pageNumber);

        if (isEnteringClimax) {
          // Initialize Chapter 8 state: pure black void, suspense screen
          if (suspenseScreen) suspenseScreen.style.display = 'flex';
          if (slideshowStage) slideshowStage.style.display = 'none';
          if (slideshowFinishOverlay) slideshowFinishOverlay.style.display = 'none';
          if (slideTrackerBar) slideTrackerBar.style.width = '0%';

          if (bgMusicClimax) {
            bgMusicClimax.currentTime = SUSPENSE_START;
            bgMusicClimax.volume = 1.0;
            if (isMusicPlaying) {
              bgMusicClimax.play().catch(() => {});
            }
          }
        } else if (isExitingClimax) {
          // Resume story BGM for Chapters 1-7
          if (bgMusicStory && isMusicPlaying) {
            fadeAudioIn(bgMusicStory, 1.0, 500);
          }
        }

        setTimeout(() => {
          if (cinematicFadeVeil) {
            cinematicFadeVeil.classList.remove('active');
          }
          isPageTransitioning = false;
        }, 150);
      }, 450);
    } else {
      executePageSwitch(pageNumber);
      // Ensure story BGM is playing if on Chapters 1-7
      if (bgMusicStory && isMusicPlaying && bgMusicStory.paused) {
        bgMusicStory.play().catch(() => {});
      }
    }
  }

  document.addEventListener('click', (e) => {
    const nextBtn = e.target.closest('[data-next]');
    if (nextBtn) {
      e.preventDefault();
      playPercussiveClick();
      goToPage(parseInt(nextBtn.getAttribute('data-next')));
      return;
    }

    const prevBtn = e.target.closest('[data-prev]');
    if (prevBtn) {
      e.preventDefault();
      playPercussiveClick();
      goToPage(parseInt(prevBtn.getAttribute('data-prev')));
      return;
    }

    const gotoBtn = e.target.closest('[data-goto]');
    if (gotoBtn) {
      e.preventDefault();
      playPercussiveClick();
      goToPage(parseInt(gotoBtn.getAttribute('data-goto')));
      return;
    }
  });

  // Keyboard navigation (Arrow keys on PC/Laptop)
  document.addEventListener('keydown', (e) => {
    if (coverOverlay.classList.contains('hidden')) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          playPercussiveClick();
          goToPage(currentPage + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          playPercussiveClick();
          goToPage(currentPage - 1);
        }
      }
    }
  });

  // Touch Swipe Navigation on Mobile
  let touchStartX = 0;
  let touchStartY = 0;
  const mainContainer = document.getElementById('mainContainer');

  if (mainContainer) {
    mainContainer.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: true }
    );

    mainContainer.addEventListener(
      'touchend',
      (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0 && currentPage < totalPages) {
            playPercussiveClick();
            goToPage(currentPage + 1);
          } else if (deltaX > 0 && currentPage > 1) {
            playPercussiveClick();
            goToPage(currentPage - 1);
          }
        }
      },
      { passive: true }
    );
  }

  // ==========================================================================
  // 7. PRASASTI DOA RESTU (STORAGE & WISHES BOARD)
  // ==========================================================================
  const STORAGE_KEY = 'wedding_wishes_dramatic_aditya_salsa';
  const defaultWishes = [
    {
      name: 'Keluarga Besar',
      message:
        "Barakallahu laka wa baraka 'alaika wa jama'a bainakuma fii khair. Selamat melangkah bersama ke garis depan takdir baru, Aditya & Salsa. Semoga menjadi keluarga sakinah, mawaddah, warahmah yang kokoh tak terpatahkan.",
      time: 'Baru saja',
    },
    {
      name: 'Sahabat Seperjuangan',
      message:
        'Kalian berdua adalah pejuang terhebat. Ikrar suci telah terpatri, semoga langkah kalian selalu dinaungi keberanian, kelapangan, dan kemenangan hidup.',
      time: 'Hari ini',
    },
    {
      name: 'Rekan Kerja',
      message:
        'Selamat menempuh babak baru yang sakral Aditya dan Salsa! Semoga senantiasa diberikan kelimpahan rezeki dan kebahagiaan abadi.',
      time: 'Kemarin',
    },
  ];

  function getStoredWishes() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWishes));
      return defaultWishes;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return defaultWishes;
    }
  }

  function renderWishes() {
    const wishes = getStoredWishes();
    wishesList.innerHTML = '';
    wishes.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'wish-item';
      card.innerHTML = `
        <div class="wish-header">
          <span class="wish-sender">${escapeHTML(item.name)}</span>
          <span class="wish-time">${escapeHTML(item.time || 'Baru saja')}</span>
        </div>
        <p class="wish-message">${escapeHTML(item.message)}</p>
      `;
      wishesList.appendChild(card);
    });
  }

  if (wishesForm) {
    wishesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = wishSenderInput.value.trim();
      const message = wishMessageInput.value.trim();

      if (!name || !message) {
        showToast('Mohon isi nama dan pesan doa Anda');
        return;
      }

      playCinematicBoom();
      const wishes = getStoredWishes();
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      wishes.unshift({
        name: name,
        message: message,
        time: `Hari ini ${timeStr}`,
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
      renderWishes();
      wishMessageInput.value = '';
      showToast('⚔️ Doa restu telah tertoreh di prasasti!');
    });
  }

  // Toast Utility
  function showToast(text) {
    if (!toastMsg) return;
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 3200);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[tag] || tag));
  }

  // Initial render
  renderWishes();
});
