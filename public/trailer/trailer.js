// JapLearn trailer player: scene timeline, an app-like phone that slides between
// screens, generated background music, and Sumi's voiced lines with lip-sync.
// Kept in its own file because the site's Content-Security-Policy only allows
// scripts from 'self' (no inline scripts).
(function () {
  var stage = document.getElementById('stage');
  var scenes = Array.prototype.slice.call(stage.querySelectorAll('.scene'));
  var durations = scenes.map(function (s) { return Number(s.dataset.duration) || 5000; });
  var starts = [];
  durations.reduce(function (acc, d, i) { starts[i] = acc; return acc + d; }, 0);
  var total = durations.reduce(function (a, b) { return a + b; }, 0);
  var bar = document.getElementById('bar');
  var toggle = document.getElementById('toggle');
  var muteBtn = document.getElementById('mute');
  var start = document.getElementById('start');
  var pages = Array.prototype.slice.call(stage.querySelectorAll('.page'));
  var tap = document.getElementById('tap');

  var elapsed = 0, last = 0, playing = false, current = -1, muted = false, tapped = false, currentPage = null;

  // ---------- Background: kana and sakura ----------
  var rain = document.getElementById('rain');
  'あいうえおかきくけこさしすせそアイウエオ'.split('').forEach(function (ch, i) {
    var span = document.createElement('span');
    span.textContent = ch;
    span.style.left = (i * 5.3) % 100 + '%';
    span.style.top = '-' + (10 + (i * 37) % 60) + '%';
    span.style.animationDuration = 16 + (i % 6) * 3 + 's';
    span.style.animationDelay = -(i * 1.7) + 's';
    rain.appendChild(span);
  });
  var petals = document.getElementById('petals');
  for (var p = 0; p < 12; p++) {
    var petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = (p * 8.3 + 4) % 100 + '%';
    petal.style.animationDuration = 12 + (p % 5) * 2.5 + 's';
    petal.style.animationDelay = -(p * 2.1) + 's';
    petal.style.scale = String(0.6 + (p % 4) * 0.2);
    petals.appendChild(petal);
  }

  // ---------- Audio graph ----------
  var ctx = null, master = null, musicBus = null, voiceBus = null, analyser = null, levelData = null;

  function ensureAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
    voiceBus = ctx.createGain(); voiceBus.gain.value = 1.0; voiceBus.connect(master);
    analyser = ctx.createAnalyser(); analyser.fftSize = 512; levelData = new Uint8Array(analyser.fftSize);
    voiceLines.forEach(function (line) {
      var src = ctx.createMediaElementSource(line.audio);
      src.connect(analyser); src.connect(voiceBus);
    });
  }

  // ---------- Generated music: soft lo-fi loop in A minor pentatonic ----------
  var BPM = 92, STEP = 60 / BPM / 2; // eighth notes
  var CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  var BASS = [45, 41, 36, 43];
  var MELODY = [76, -1, 74, 72, -1, 69, 72, -1, 74, -1, 76, 79, -1, 76, 74, -1,
                72, -1, 69, 67, -1, 69, 72, -1, 69, -1, 67, 64, -1, 67, 69, -1];
  var nextTime = 0, step = 0, timer = null, noiseBuffer = null;

  function hz(note) { return 440 * Math.pow(2, (note - 69) / 12); }

  function tone(freq, time, length, type, gain) {
    var osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(env); env.connect(musicBus);
    osc.start(time); osc.stop(time + length + 0.05);
  }

  function kick(time) {
    var osc = ctx.createOscillator(), env = ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);
    env.gain.setValueAtTime(0.5, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    osc.connect(env); env.connect(musicBus);
    osc.start(time); osc.stop(time + 0.3);
  }

  function hat(time, gain) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      var d = noiseBuffer.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), env = ctx.createGain();
    src.buffer = noiseBuffer; filter.type = 'highpass'; filter.frequency.value = 7000;
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(filter); filter.connect(env); env.connect(musicBus);
    src.start(time); src.stop(time + 0.06);
  }

  function scheduleStep(s, time) {
    var chord = Math.floor(s / 8) % 4;
    if (s % 8 === 0) {
      CHORDS[chord].forEach(function (n) { tone(hz(n), time, STEP * 8, 'triangle', 0.05); });
      tone(hz(BASS[chord]), time, STEP * 3.5, 'sine', 0.22);
    }
    if (s % 8 === 4) tone(hz(BASS[chord] + 7), time, STEP * 2, 'sine', 0.12);
    if (s % 4 === 0) kick(time);
    hat(time, s % 2 ? 0.03 : 0.06);
    var note = MELODY[s % 32];
    if (note > 0) tone(hz(note), time, STEP * 1.6, 'sine', 0.08);
  }

  function scheduler() {
    while (nextTime < ctx.currentTime + 0.15) { scheduleStep(step, nextTime); nextTime += STEP; step++; }
  }
  function startMusic() { if (!ctx || timer) return; nextTime = ctx.currentTime + 0.05; timer = setInterval(scheduler, 40); }
  function stopMusic() { clearInterval(timer); timer = null; }
  function duck(down) {
    if (!ctx) return;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(down ? 0.09 : 0.3, ctx.currentTime, 0.15);
  }

  // ---------- Sumi: voice, subtitles, lip-sync, blinking ----------
  var sumi = document.getElementById('sumi');
  var subtitle = document.getElementById('subtitle');
  var subJp = document.getElementById('subJp'), subRo = document.getElementById('subRo'), subEn = document.getElementById('subEn');
  var scoreChip = document.getElementById('scoreChip');
  var waveBars = Array.prototype.slice.call(document.querySelectorAll('#wave i'));
  var voiceLines = [
    { src: '/trailer/sumi-line-1.mp3', jp: 'まず、体を洗ってから入りましょう。', ro: 'Mazu, karada o aratte kara hairimashou.', en: 'First, wash your body before getting in.' },
    { src: '/trailer/sumi-line-2.mp3', jp: '写真を撮る前に、聞きましょう。', ro: 'Shashin o toru mae ni, kikimashou.', en: "Let's ask before taking a photo." }
  ];
  voiceLines.forEach(function (line) { line.audio = new Audio(line.src); line.audio.preload = 'auto'; });

  var sumiTimers = [], speaking = null, mouthLoop = null, blinkTimer = null;
  function later(fn, ms) { sumiTimers.push(setTimeout(fn, ms)); }

  function sayLine(index) {
    var line = voiceLines[index];
    subtitle.classList.remove('show');
    later(function () {
      subJp.textContent = line.jp; subRo.textContent = line.ro; subEn.textContent = line.en;
      subtitle.classList.add('show');
      speaking = line;
      line.audio.currentTime = 0;
      duck(true);
      var started = line.audio.play();
      if (started && started.catch) started.catch(function () { /* Autoplay blocked: subtitles still show. */ });
    }, index ? 250 : 0);
    line.audio.onended = function () {
      speaking = null;
      sumi.classList.remove('talking');
      duck(false);
      if (index + 1 < voiceLines.length) later(function () { sayLine(index + 1); }, 700);
      else later(function () { scoreChip.classList.add('show'); }, 400);
    };
  }

  function animateMouth() {
    var level = 0;
    if (speaking && !speaking.audio.paused) {
      if (analyser) {
        analyser.getByteTimeDomainData(levelData);
        for (var i = 0; i < levelData.length; i++) level = Math.max(level, Math.abs(levelData[i] - 128));
      } else {
        level = Math.floor(performance.now() / 120) % 2 ? 30 : 0;
      }
    }
    sumi.classList.toggle('talking', level > 10);
    waveBars.forEach(function (barEl, i) {
      var h = level > 4 ? 25 + Math.min(75, level * (0.8 + ((i * 37 + Date.now() / 60) % 10) / 12)) : 25;
      barEl.style.height = h + '%';
    });
  }

  function scheduleBlink() {
    blinkTimer = setTimeout(function () {
      if (!sumi.classList.contains('talking')) {
        sumi.classList.add('blinking');
        setTimeout(function () { sumi.classList.remove('blinking'); }, 140);
      }
      scheduleBlink();
    }, 2200 + Math.random() * 1800);
  }

  function startSumi() {
    resetSumi();
    later(function () { sayLine(0); }, 1600);
    if (!mouthLoop) mouthLoop = setInterval(animateMouth, 50);
    if (!blinkTimer) scheduleBlink();
  }

  function resetSumi() {
    sumiTimers.forEach(clearTimeout); sumiTimers = [];
    voiceLines.forEach(function (line) { line.audio.pause(); line.audio.onended = null; });
    speaking = null;
    subtitle.classList.remove('show'); scoreChip.classList.remove('show');
    sumi.classList.remove('talking', 'blinking');
    duck(false);
  }

  // ---------- Phone: pages, scrolling shots, taps ----------
  function showPage(number) {
    var next = pages.filter(function (pg) { return pg.dataset.page === String(number); })[0] || null;
    if (next === currentPage) return;
    pages.forEach(function (pg) { pg.classList.remove('prev'); });
    if (currentPage) { currentPage.classList.remove('current'); currentPage.classList.add('prev'); }
    if (next) {
      // Start the incoming page at its first screenshot.
      Array.prototype.forEach.call(next.querySelectorAll('.shot'), function (shot, i) {
        shot.classList.toggle('on', i === 0); shot.classList.remove('past');
      });
      next.classList.add('current');
    }
    currentPage = next;
  }

  function updateShots(timeInScene) {
    if (!currentPage) return;
    var shots = Array.prototype.slice.call(currentPage.querySelectorAll('.shot'));
    var active = 0;
    shots.forEach(function (shot, i) { if (Number(shot.dataset.at) <= timeInScene) active = i; });
    shots.forEach(function (shot, i) {
      shot.classList.toggle('on', i === active);
      shot.classList.toggle('past', i < active);
    });
  }

  function fireTap(xPercent) {
    tap.classList.remove('go');
    tap.style.left = xPercent + '%';
    tap.style.top = '93.6%';
    void tap.offsetWidth;
    tap.classList.add('go');
  }

  // ---------- Timeline ----------
  function sceneAt(time) {
    for (var i = durations.length - 1; i >= 0; i--) if (time >= starts[i]) return i;
    return 0;
  }

  function show(index) {
    if (index === current) return;
    if (current >= 0 && scenes[current].dataset.sumi) resetSumi();
    current = index;
    tapped = false;
    tap.classList.remove('go');
    scenes.forEach(function (s, i) {
      // Re-adding the class restarts each scene's entrance animations.
      s.classList.remove('active');
      if (i === index) { void s.offsetWidth; s.classList.add('active'); }
    });
    var scene = scenes[index];
    stage.classList.toggle('with-device', !!scene.dataset.step);
    stage.classList.toggle('outro', !!scene.dataset.outro);
    if (scene.dataset.step) showPage(scene.dataset.step);
    if (scene.dataset.sumi && playing) startSumi();
  }

  var ticker = null;
  function frame() {
    if (!playing) return;
    var now = performance.now();
    elapsed += now - last;
    last = now;
    if (elapsed >= total) {
      elapsed = total;
      bar.style.width = '100%';
      pause();
      stage.classList.add('ended');
      return;
    }
    var index = sceneAt(elapsed);
    show(index);
    var t = elapsed - starts[index];
    var scene = scenes[index];
    if (scene.dataset.step && !scene.dataset.outro) updateShots(t);
    if (scene.dataset.tap && !tapped && t >= durations[index] - 1250) { tapped = true; fireTap(Number(scene.dataset.tap)); }
    bar.style.width = (elapsed / total * 100) + '%';
  }

  function play() {
    if (elapsed >= total) restart();
    ensureAudio();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    startMusic();
    if (speaking && speaking.audio.paused) speaking.audio.play().catch(function () {});
    playing = true;
    stage.classList.remove('paused', 'ended');
    toggle.textContent = 'Pause';
    if (current >= 0 && scenes[current].dataset.sumi && !speaking && !subtitle.classList.contains('show')) startSumi();
    last = performance.now();
    clearInterval(ticker);
    ticker = setInterval(frame, 33);
  }

  function pause() {
    playing = false;
    clearInterval(ticker);
    stage.classList.add('paused');
    toggle.textContent = 'Play';
    stopMusic();
    if (ctx) ctx.suspend();
    voiceLines.forEach(function (line) { line.audio.pause(); });
  }

  function restart() {
    resetSumi();
    elapsed = 0;
    current = -1;
    step = 0;
    currentPage = null;
    pages.forEach(function (pg) { pg.classList.remove('current', 'prev'); });
    bar.style.width = '0';
  }

  function setMuted(value) {
    muted = value;
    muteBtn.textContent = muted ? 'Sound: Off' : 'Sound: On';
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
  }

  document.getElementById('startBtn').addEventListener('click', function () {
    start.classList.add('hidden');
    play();
  });
  toggle.addEventListener('click', function () { playing ? pause() : play(); });
  muteBtn.addEventListener('click', function () { setMuted(!muted); });
  document.getElementById('replay').addEventListener('click', function () {
    start.classList.add('hidden');
    pause();
    restart();
    play();
  });
  document.addEventListener('keydown', function (event) {
    if (!start.classList.contains('hidden')) return;
    if (event.code === 'Space') { event.preventDefault(); playing ? pause() : play(); }
    if (event.key === 'm' || event.key === 'M') setMuted(!muted);
  });

  // First scene visible behind the start button.
  show(0);
})();
