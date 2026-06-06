const Effects = (() => {
  const SYMBOLS    = ['🎰', '7', '🍒', '🍋', '⭐', '💎', '🔔'];
  const RESULT_SYM = { jackpot: '💎', big: '⭐', medium: '🍒', small: '🔔', even: '🍋', lose: '🎰' };
  const COLORS     = ['#ff2d78', '#00f0ff', '#ffd700', '#9d00ff', '#00ff88', '#ff8800'];

  function screenShake(intensity) {
    const el = document.getElementById('screen-game');
    if (!el) return;
    const cls = 'shake-' + (intensity || 'hard');
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  function spinReel(resultKey, onDone) {
    const overlay = document.createElement('div');
    overlay.id = 'pachinko-reel';
    overlay.innerHTML = `
      <div class="reel-box">
        <div class="reel-title">🎰 パチンコ 🎰</div>
        <div class="reel-symbol" id="reel-sym">🎰</div>
        <div class="reel-progress"><div id="reel-fill"></div></div>
      </div>`;
    document.body.appendChild(overlay);

    const symEl      = overlay.querySelector('#reel-sym');
    const fillEl     = overlay.querySelector('#reel-fill');
    const finalSym   = RESULT_SYM[resultKey] || '🎰';
    const totalMs    = 1800;
    const start      = Date.now();
    let lastSwap     = 0;
    let swapInterval = 70;

    function tick() {
      const elapsed  = Date.now() - start;
      const progress = elapsed / totalMs;
      fillEl.style.width = Math.min(100, progress * 100) + '%';

      if (Date.now() - lastSwap > swapInterval) {
        if (progress < 0.65) {
          symEl.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          swapInterval = 70 + progress * 150;
        } else {
          symEl.textContent = Math.random() < 0.35
            ? finalSym
            : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          swapInterval = 150 + progress * 500;
        }
        lastSwap = Date.now();
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(tick);
      } else {
        symEl.textContent = finalSym;
        symEl.style.animation = 'reel-land 0.35s ease-out forwards';
        setTimeout(() => {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.25s';
          setTimeout(() => { overlay.remove(); onDone(); }, 260);
        }, 480);
      }
    }
    requestAnimationFrame(tick);
  }

  function jackpotBlast() {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9998;pointer-events:none;';
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const cx  = canvas.width / 2;
      const cy  = canvas.height / 2;

      const particles = Array.from({ length: 150 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 12;
        return {
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 5,
          size:  [4, 4, 6, 6, 8][Math.floor(Math.random() * 5)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life:  1,
          decay: 0.007 + Math.random() * 0.01,
        };
      });

      screenShake('hard');
      const t0 = Date.now();

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of particles) {
          if (p.life <= 0) continue;
          alive = true;
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += 0.3;
          p.life -= p.decay;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle   = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;
        if (alive && Date.now() - t0 < 3000) requestAnimationFrame(draw);
        else { canvas.remove(); resolve(); }
      }
      requestAnimationFrame(draw);
    });
  }

  return { spinReel, jackpotBlast, screenShake };
})();
