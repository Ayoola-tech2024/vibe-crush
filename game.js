// game.js - Core Match-3 Engine for Vibe Crush
// 8x8 Board, Match Detection, Line/Bomb/Rainbow Special Tiles, Cascades, FUD Ice Obstacles, Particle Fireworks, Smart Move Hint

const GRID_SIZE = 8;

const VIBERS = [
  { id: 1, name: "Mint Antenna", color: "#00F5D4", img: "assets/vibers/viber1.webp" },
  { id: 2, name: "Cap Blue", color: "#3B82F6", img: "assets/vibers/viber2.webp" },
  { id: 3, name: "Peach Chest", color: "#FB7185", img: "assets/vibers/viber3.webp" },
  { id: 4, name: "Visor Slate", color: "#F59E0B", img: "assets/vibers/viber4.webp" },
  { id: 5, name: "Crown Lavender", color: "#A855F7", img: "assets/vibers/viber5.webp" },
  { id: 6, name: "Gold Ears", color: "#EAB308", img: "assets/vibers/viber6.webp" }
];

// Progressive 5-Stage Saga
const LEVELS = [
  {
    level: 1,
    title: "Stage 1: The New Raider",
    description: "Welcome to the Vibe raid. Match 3 or more Vibers to build momentum!",
    targetScore: 1200,
    moves: 22,
    numTypes: 4,
    iceCount: 0,
    rewardPfp: "assets/vibers/viber1.webp",
    rewardName: "Raider Antenna Mint"
  },
  {
    level: 2,
    title: "Stage 2: Break the FUD",
    description: "FUD has frozen some tiles! Make matches adjacent to ice blocks to shatter them.",
    targetScore: 2400,
    moves: 20,
    numTypes: 5,
    iceCount: 8,
    rewardPfp: "assets/vibers/viber2.webp",
    rewardName: "Raider Cap Blue"
  },
  {
    level: 3,
    title: "Stage 3: Vibe Energy Charge",
    description: "Chain massive 4-in-a-row and 5-in-a-row combos to trigger Lightning and Bombs!",
    targetScore: 4000,
    moves: 20,
    numTypes: 5,
    iceCount: 12,
    rewardPfp: "assets/vibers/viber3.webp",
    rewardName: "Raider Peach Chest"
  },
  {
    level: 4,
    title: "Stage 4: FUD Storm",
    description: "Heavy resistance! Clear the board obstacles and pump the Vibe score.",
    targetScore: 6000,
    moves: 18,
    numTypes: 6,
    iceCount: 16,
    rewardPfp: "assets/vibers/viber4.webp",
    rewardName: "Raider Visor Slate"
  },
  {
    level: 5,
    title: "Stage 5: Grand Raider Master",
    description: "The ultimate bounty stage! Unleash cascading frenzies and claim victory.",
    targetScore: 9000,
    moves: 16,
    numTypes: 6,
    iceCount: 18,
    rewardPfp: "assets/vibers/viber5.webp",
    rewardName: "Master Crown Lavender"
  }
];

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.loop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawnFirework(x, y, count = 35) {
    const colors = ["#00F5D4", "#A855F7", "#FACC15", "#F43F5E", "#38BDF8", "#FFFFFF"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 3 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gentle gravity
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    requestAnimationFrame(() => this.loop());
  }
}

class VibeCrushGame {
  constructor() {
    this.board = [];
    this.currentLevelIndex = 0;
    this.score = 0;
    this.movesLeft = 0;
    this.targetScore = 0;
    this.iceLeft = 0;
    this.selectedTile = null;
    this.isProcessing = false;
    this.comboCount = 0;
    this.hintTimer = null;
    this.currentHint = null;
    this.unlockedPFPs = JSON.parse(localStorage.getItem("vibecrush_unlocked_pfps") || "[]");

    // UI Elements
    this.boardEl = document.getElementById("boardGrid");
    this.scoreEl = document.getElementById("scoreValue");
    this.targetEl = document.getElementById("targetValue");
    this.movesEl = document.getElementById("movesValue");
    this.levelEl = document.getElementById("levelBadge");
    this.objectiveEl = document.getElementById("objectiveDesc");
    this.comboBadgeEl = document.getElementById("comboBadge");
    this.progressFillEl = document.getElementById("progressFill");

    // Canvas Fireworks
    const pCanvas = document.getElementById("particlesCanvas");
    this.particles = new ParticleSystem(pCanvas);

    this.initEventListeners();
    this.startLevel(0);
  }

  get currentLevel() {
    return LEVELS[this.currentLevelIndex];
  }

  startLevel(index) {
    this.clearHintTimer();
    this.currentLevelIndex = index;
    const lvl = this.currentLevel;
    this.score = 0;
    this.movesLeft = lvl.moves;
    this.targetScore = lvl.targetScore;
    this.comboCount = 0;
    this.selectedTile = null;
    this.isProcessing = false;

    this.levelEl.textContent = `L${lvl.level}`;
    this.scoreEl.textContent = this.score;
    this.targetEl.textContent = this.targetScore.toLocaleString();
    this.movesEl.textContent = this.movesLeft;
    this.updateProgressBar();
    
    if (lvl.iceCount > 0) {
      this.objectiveEl.innerHTML = `Break <b>${lvl.iceCount} FUD Ice</b> & reach <b>${lvl.targetScore.toLocaleString()}</b> pts`;
    } else {
      this.objectiveEl.innerHTML = `Reach <b>${lvl.targetScore.toLocaleString()}</b> points in <b>${lvl.moves}</b> moves`;
    }

    this.initBoard(lvl);
    this.renderBoard();
    this.resetHintTimer();
  }

  initBoard(levelConfig) {
    this.board = [];
    const pool = VIBERS.slice(0, levelConfig.numTypes);

    for (let r = 0; r < GRID_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let candidate;
        do {
          candidate = pool[Math.floor(Math.random() * pool.length)];
        } while (
          (r >= 2 && this.board[r - 1][c].type.id === candidate.id && this.board[r - 2][c].type.id === candidate.id) ||
          (c >= 2 && this.board[r][c - 1].type.id === candidate.id && this.board[r][c - 2].type.id === candidate.id)
        );

        this.board[r][c] = {
          type: candidate,
          special: null,
          ice: false
        };
      }
    }

    // Place FUD Ice Blocks
    this.iceLeft = levelConfig.iceCount;
    if (this.iceLeft > 0) {
      let placed = 0;
      while (placed < this.iceLeft) {
        const r = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        const c = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        if (!this.board[r][c].ice) {
          this.board[r][c].ice = true;
          placed++;
        }
      }
    }
  }

  renderBoard() {
    this.boardEl.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const slot = document.createElement("div");
        slot.className = "tile-slot";
        slot.dataset.row = r;
        slot.dataset.col = c;

        const cell = this.board[r][c];
        if (cell && cell.type) {
          const tile = document.createElement("div");
          tile.className = "tile";
          tile.dataset.row = r;
          tile.dataset.col = c;
          tile.style.backgroundImage = `url('${cell.type.img}')`;
          tile.style.backgroundColor = cell.type.color;

          if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
            tile.classList.add("selected");
          }

          // Hint highlight
          if (this.currentHint && (
            (this.currentHint.r1 === r && this.currentHint.c1 === c) ||
            (this.currentHint.r2 === r && this.currentHint.c2 === c)
          )) {
            tile.classList.add("hint-pulse");
          }

          // Special tile decorations
          if (cell.special === "laser_h" || cell.special === "laser_v") {
            const badge = document.createElement("div");
            badge.className = "power-badge power-line";
            badge.textContent = cell.special === "laser_h" ? "↔" : "↕";
            tile.appendChild(badge);
          } else if (cell.special === "bomb") {
            const badge = document.createElement("div");
            badge.className = "power-badge power-bomb";
            badge.textContent = "💥";
            tile.appendChild(badge);
          } else if (cell.special === "rainbow") {
            const badge = document.createElement("div");
            badge.className = "power-badge power-rainbow";
            badge.textContent = "★";
            tile.appendChild(badge);
          }

          // Ice Block
          if (cell.ice) {
            const ice = document.createElement("div");
            ice.className = "ice-overlay";
            slot.appendChild(ice);
          }

          slot.appendChild(tile);
        }

        this.boardEl.appendChild(slot);
      }
    }
  }

  initEventListeners() {
    let startX = 0;
    let startY = 0;
    let activeSlot = null;

    this.boardEl.addEventListener("pointerdown", (e) => {
      if (this.isProcessing) return;
      window.audio.init();

      const tile = e.target.closest(".tile");
      if (!tile) return;
      startX = e.clientX;
      startY = e.clientY;
      activeSlot = {
        r: parseInt(tile.dataset.row),
        c: parseInt(tile.dataset.col)
      };
      this.clearHint();
    });

    this.boardEl.addEventListener("pointerup", (e) => {
      if (!activeSlot || this.isProcessing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.hypot(dx, dy);

      if (dist > 25) {
        let targetR = activeSlot.r;
        let targetC = activeSlot.c;
        if (Math.abs(dx) > Math.abs(dy)) {
          targetC += dx > 0 ? 1 : -1;
        } else {
          targetR += dy > 0 ? 1 : -1;
        }

        if (this.isValidCoord(targetR, targetC)) {
          this.handleSwap(activeSlot.r, activeSlot.c, targetR, targetC);
        }
        activeSlot = null;
        this.selectedTile = null;
        this.renderBoard();
      } else {
        this.handleTap(activeSlot.r, activeSlot.c);
        activeSlot = null;
      }
      this.resetHintTimer();
    });
  }

  handleTap(r, c) {
    if (this.isProcessing) return;
    this.clearHint();

    if (!this.selectedTile) {
      this.selectedTile = { r, c };
      window.audio.playClick();
      this.renderBoard();
      return;
    }

    const { r: r1, c: c1 } = this.selectedTile;
    const isAdjacent = Math.abs(r - r1) + Math.abs(c - c1) === 1;

    if (isAdjacent) {
      this.selectedTile = null;
      this.handleSwap(r1, c1, r, c);
    } else {
      this.selectedTile = { r, c };
      window.audio.playClick();
      this.renderBoard();
    }
  }

  isValidCoord(r, c) {
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
  }

  async handleSwap(r1, c1, r2, c2) {
    this.isProcessing = true;
    this.clearHint();
    window.audio.playSwap();

    const cell1 = this.board[r1][c1];
    const cell2 = this.board[r2][c2];

    if (cell1.special === "rainbow" || cell2.special === "rainbow") {
      this.movesLeft--;
      this.movesEl.textContent = this.movesLeft;
      await this.triggerRainbowSwap(r1, c1, r2, c2);
      await this.resolveBoard();
      this.checkLevelOutcome();
      this.isProcessing = false;
      this.resetHintTimer();
      return;
    }

    this.swapTiles(r1, c1, r2, c2);
    this.renderBoard();

    const matches = this.findMatches();

    if (matches.length > 0) {
      this.movesLeft--;
      this.movesEl.textContent = this.movesLeft;
      this.comboCount = 0;
      await this.resolveBoard();
      this.checkLevelOutcome();
    } else {
      await this.sleep(180);
      this.swapTiles(r1, c1, r2, c2);
      this.renderBoard();
    }

    this.isProcessing = false;
    this.resetHintTimer();
  }

  swapTiles(r1, c1, r2, c2) {
    const temp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = temp;
  }

  findMatches() {
    const matches = [];
    const matchedCoords = new Set();

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      let streak = 1;
      for (let c = 1; c <= GRID_SIZE; c++) {
        if (
          c < GRID_SIZE &&
          this.board[r][c] &&
          this.board[r][c - 1] &&
          this.board[r][c].type.id === this.board[r][c - 1].type.id
        ) {
          streak++;
        } else {
          if (streak >= 3) {
            const group = [];
            for (let i = c - streak; i < c; i++) {
              group.push({ r, c: i });
              matchedCoords.add(`${r},${i}`);
            }
            matches.push({ group, dir: "h", count: streak });
          }
          streak = 1;
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      let streak = 1;
      for (let r = 1; r <= GRID_SIZE; r++) {
        if (
          r < GRID_SIZE &&
          this.board[r][c] &&
          this.board[r - 1][c] &&
          this.board[r][c].type.id === this.board[r - 1][c].type.id
        ) {
          streak++;
        } else {
          if (streak >= 3) {
            const group = [];
            for (let i = r - streak; i < r; i++) {
              group.push({ r: i, c });
              matchedCoords.add(`${i},${c}`);
            }
            matches.push({ group, dir: "v", count: streak });
          }
          streak = 1;
        }
      }
    }

    return matches;
  }

  async resolveBoard() {
    let matches = this.findMatches();

    while (matches.length > 0) {
      this.comboCount++;
      this.showComboBadge();

      const toClear = new Map();
      const newSpecials = [];

      matches.forEach((m) => {
        if (m.count === 4) {
          const pivot = m.group[1];
          newSpecials.push({
            r: pivot.r,
            c: pivot.c,
            type: this.board[pivot.r][pivot.c].type,
            special: m.dir === "h" ? "laser_v" : "laser_h"
          });
        } else if (m.count >= 5) {
          const pivot = m.group[2];
          newSpecials.push({
            r: pivot.r,
            c: pivot.c,
            type: this.board[pivot.r][pivot.c].type,
            special: "rainbow"
          });
        }

        m.group.forEach((pt) => {
          toClear.set(`${pt.r},${pt.c}`, pt);
        });
      });

      const secondaryClear = new Set();
      toClear.forEach((pt) => {
        const cell = this.board[pt.r][pt.c];
        if (!cell) return;

        if (cell.special === "laser_h") {
          window.audio.playLaser();
          this.showLaserEffect(pt.r, 0, "horizontal");
          for (let c = 0; c < GRID_SIZE; c++) secondaryClear.add(`${pt.r},${c}`);
        } else if (cell.special === "laser_v") {
          window.audio.playLaser();
          this.showLaserEffect(0, pt.c, "vertical");
          for (let r = 0; r < GRID_SIZE; r++) secondaryClear.add(`${r},${pt.c}`);
        } else if (cell.special === "bomb") {
          window.audio.playExplosion();
          this.shakeBoard();
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = pt.r + dr;
              const nc = pt.c + dc;
              if (this.isValidCoord(nr, nc)) secondaryClear.add(`${nr},${nc}`);
            }
          }
        }
      });

      secondaryClear.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        toClear.set(key, { r, c });
      });

      window.audio.playMatch(this.comboCount);
      const points = toClear.size * 50 * this.comboCount;
      this.addScore(points);

      // Trigger floating score animation & sparks
      toClear.forEach((pt) => {
        if (this.board[pt.r][pt.c]) {
          const slotEl = this.boardEl.querySelector(`[data-row='${pt.r}'][data-col='${pt.c}']`);
          if (slotEl) {
            const rect = slotEl.getBoundingClientRect();
            this.particles.spawnFirework(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
          }
        }
      });

      // Break FUD ice
      toClear.forEach((pt) => {
        if (this.board[pt.r][pt.c] && this.board[pt.r][pt.c].ice) {
          this.board[pt.r][pt.c].ice = false;
          this.iceLeft = Math.max(0, this.iceLeft - 1);
          window.audio.playIceBreak();
        }
        const neighbors = [
          { r: pt.r - 1, c: pt.c },
          { r: pt.r + 1, c: pt.c },
          { r: pt.r, c: pt.c - 1 },
          { r: pt.r, c: pt.c + 1 }
        ];
        neighbors.forEach((n) => {
          if (this.isValidCoord(n.r, n.c) && this.board[n.r][n.c] && this.board[n.r][n.c].ice) {
            this.board[n.r][n.c].ice = false;
            this.iceLeft = Math.max(0, this.iceLeft - 1);
            window.audio.playIceBreak();
          }
        });
      });

      toClear.forEach((pt) => {
        const slotEl = this.boardEl.querySelector(`[data-row='${pt.r}'][data-col='${pt.c}'] .tile`);
        if (slotEl) slotEl.classList.add("pop");
      });

      await this.sleep(200);

      toClear.forEach((pt) => {
        this.board[pt.r][pt.c] = null;
      });

      newSpecials.forEach((sp) => {
        this.board[sp.r][sp.c] = {
          type: sp.type,
          special: sp.special,
          ice: false
        };
      });

      await this.applyGravity();
      this.renderBoard();

      matches = this.findMatches();
    }

    this.hideComboBadge();
  }

  async triggerRainbowSwap(r1, c1, r2, c2) {
    const rainbowPt = this.board[r1][c1].special === "rainbow" ? { r: r1, c: c1 } : { r: r2, c: c2 };
    const targetCell = this.board[r1][c1].special === "rainbow" ? this.board[r2][c2] : this.board[r1][c1];
    const targetId = targetCell.type.id;

    window.audio.playRainbow();
    this.shakeBoard();

    let wiped = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.board[r][c] && this.board[r][c].type.id === targetId) {
          this.board[r][c] = null;
          wiped++;
          const slotEl = this.boardEl.querySelector(`[data-row='${r}'][data-col='${c}']`);
          if (slotEl) {
            const rect = slotEl.getBoundingClientRect();
            this.particles.spawnFirework(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
          }
        }
      }
    }
    this.board[rainbowPt.r][rainbowPt.c] = null;
    this.addScore(wiped * 120);

    await this.applyGravity();
    this.renderBoard();
  }

  async applyGravity() {
    const pool = VIBERS.slice(0, this.currentLevel.numTypes);

    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (this.board[r][c] !== null) {
          if (emptyRow !== r) {
            this.board[emptyRow][c] = this.board[r][c];
            this.board[r][c] = null;
          }
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        this.board[r][c] = {
          type: candidate,
          special: null,
          ice: false
        };
      }
    }
    await this.sleep(160);
  }

  addScore(pts) {
    this.score += pts;
    this.scoreEl.textContent = this.score.toLocaleString();
    this.updateProgressBar();
  }

  updateProgressBar() {
    const percent = Math.min(100, Math.floor((this.score / this.targetScore) * 100));
    this.progressFillEl.style.width = `${percent}%`;
  }

  showComboBadge() {
    if (this.comboCount > 1) {
      this.comboBadgeEl.textContent = `${this.comboCount}x FRENZY!`;
      this.comboBadgeEl.classList.add("active");
    }
  }

  hideComboBadge() {
    setTimeout(() => {
      this.comboBadgeEl.classList.remove("active");
    }, 800);
  }

  shakeBoard() {
    this.boardEl.classList.remove("shake");
    void this.boardEl.offsetWidth;
    this.boardEl.classList.add("shake");
  }

  showLaserEffect(r, c, dir) {
    const beam = document.createElement("div");
    beam.className = `laser-beam ${dir}`;
    if (dir === "horizontal") {
      beam.style.top = `calc(var(--tile-size) * ${r} + var(--tile-size) / 2)`;
    } else {
      beam.style.left = `calc(var(--tile-size) * ${c} + var(--tile-size) / 2)`;
    }
    this.boardEl.parentElement.appendChild(beam);
    setTimeout(() => beam.remove(), 320);
  }

  // --- Smart Move Hint Detection ---
  resetHintTimer() {
    this.clearHintTimer();
    this.hintTimer = setTimeout(() => {
      this.findAndShowHint();
    }, 4500); // Trigger hint if idle for 4.5s
  }

  clearHintTimer() {
    if (this.hintTimer) clearTimeout(this.hintTimer);
  }

  clearHint() {
    this.clearHintTimer();
    this.currentHint = null;
    document.querySelectorAll(".hint-pulse").forEach(el => el.classList.remove("hint-pulse"));
  }

  findAndShowHint() {
    if (this.isProcessing) return;

    // Simulate all possible swaps to find a match
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // Horizontal swap check
        if (c < GRID_SIZE - 1) {
          this.swapTiles(r, c, r, c + 1);
          const matches = this.findMatches();
          this.swapTiles(r, c, r, c + 1);
          if (matches.length > 0) {
            this.currentHint = { r1: r, c1: c, r2: r, c2: c + 1 };
            this.renderBoard();
            return;
          }
        }
        // Vertical swap check
        if (r < GRID_SIZE - 1) {
          this.swapTiles(r, c, r + 1, c);
          const matches = this.findMatches();
          this.swapTiles(r, c, r + 1, c);
          if (matches.length > 0) {
            this.currentHint = { r1: r, c1: c, r2: r + 1, c2: c };
            this.renderBoard();
            return;
          }
        }
      }
    }
  }

  checkLevelOutcome() {
    const won = this.score >= this.targetScore && this.iceLeft === 0;
    const outOfMoves = this.movesLeft <= 0;

    if (won) {
      this.handleLevelWin();
    } else if (outOfMoves) {
      this.handleLevelFail();
    }
  }

  handleLevelWin() {
    this.clearHint();
    window.audio.playVictory();
    const lvl = this.currentLevel;

    // Victory confetti fireworks!
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.particles.spawnFirework(cx + (Math.random() * 200 - 100), cy + (Math.random() * 200 - 100), 45);
      }, i * 200);
    }

    let stars = 1;
    if (this.movesLeft >= Math.floor(lvl.moves * 0.35)) stars = 2;
    if (this.movesLeft >= Math.floor(lvl.moves * 0.55) && this.score >= lvl.targetScore * 1.3) stars = 3;

    if (!this.unlockedPFPs.includes(lvl.rewardPfp)) {
      this.unlockedPFPs.push(lvl.rewardPfp);
      localStorage.setItem("vibecrush_unlocked_pfps", JSON.stringify(this.unlockedPFPs));
    }

    document.getElementById("winLevelTitle").textContent = `${lvl.title} Cleared!`;
    document.getElementById("winScore").textContent = this.score.toLocaleString();
    document.getElementById("winMovesLeft").textContent = this.movesLeft;
    document.getElementById("winStars").innerHTML = "★".repeat(stars) + "☆".repeat(3 - stars);
    document.getElementById("winRewardImg").src = lvl.rewardPfp;
    document.getElementById("winRewardName").textContent = lvl.rewardName;

    // Download PFP Link
    const dlBtn = document.getElementById("btnDownloadReward");
    if (dlBtn) {
      dlBtn.href = lvl.rewardPfp;
      dlBtn.download = `${lvl.rewardName.replace(/\s+/g, "_")}.webp`;
    }

    const tweetText = `Just crushed ${lvl.title} on #VibeCrush with ${this.score.toLocaleString()} points (${stars}★)! 🎮⚡\n\nRaiding the testnet with @vibevibefun. Can your team beat my score?\n\nhttps://testnet.vibevibe.fun/vibe-vibers/for-raiders`;
    document.getElementById("btnShareWin").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    const nextBtn = document.getElementById("btnNextLevel");
    if (this.currentLevelIndex < LEVELS.length - 1) {
      nextBtn.style.display = "flex";
      nextBtn.onclick = () => {
        this.closeModals();
        this.startLevel(this.currentLevelIndex + 1);
      };
    } else {
      nextBtn.style.display = "none";
      document.getElementById("winLevelTitle").textContent = `🎉 ALL SAGA STAGES CLEARED!`;
    }

    document.getElementById("modalWin").classList.add("active");
  }

  handleLevelFail() {
    this.clearHint();
    window.audio.playDefeat();
    document.getElementById("failScore").textContent = this.score.toLocaleString();
    document.getElementById("failTarget").textContent = this.targetScore.toLocaleString();
    document.getElementById("modalFail").classList.add("active");
  }

  closeModals() {
    document.querySelectorAll(".modal-overlay").forEach((m) => m.classList.remove("active"));
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  window.game = new VibeCrushGame();

  document.getElementById("btnRetryLevel").onclick = () => {
    window.game.closeModals();
    window.game.startLevel(window.game.currentLevelIndex);
  };

  const muteBtn = document.getElementById("btnMute");
  muteBtn.onclick = () => {
    const isMuted = window.audio.toggleMute();
    muteBtn.innerHTML = isMuted ? "🔇" : "🔊";
  };

  document.getElementById("btnRestart").onclick = () => {
    if (confirm("Restart this level?")) {
      window.game.startLevel(window.game.currentLevelIndex);
    }
  };

  // Gallery Modal
  const galleryModal = document.getElementById("modalGallery");
  document.getElementById("btnGallery").onclick = () => {
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = "";
    LEVELS.forEach((lvl, idx) => {
      const unlocked = window.game.unlockedPFPs.includes(lvl.rewardPfp);
      const item = document.createElement("div");
      item.className = `gallery-item ${unlocked ? "unlocked" : "locked"}`;
      item.innerHTML = `
        <img src="${lvl.rewardPfp}" alt="${lvl.rewardName}" />
        <span>${lvl.rewardName}</span>
        ${unlocked ? `<a class="btn-download-pfp" href="${lvl.rewardPfp}" download="${lvl.rewardName}.webp">⬇ Save PFP</a>` : `<span style="font-size:10px; color:#666;">Locked (Beat L${lvl.level})</span>`}
        <button style="margin-top:6px; font-size:10px; padding:3px 8px; border-radius:6px; background:#222; border:1px solid #444; color:#fff; cursor:pointer;" onclick="window.game.closeModals(); window.game.startLevel(${idx});">Play L${lvl.level}</button>
      `;
      grid.appendChild(item);
    });
    galleryModal.classList.add("active");
  };

  document.getElementById("btnCloseGallery").onclick = () => {
    galleryModal.classList.remove("active");
  };
});
