// game.js - Comprehensive Vibe Crush Game Engine
// Features: 10 Saga Stages, 3 Game Modes, 3 Difficulties, Career XP & Ranks, In-Game Boosters, Smart Hints, Particle Fireworks, Match-4 Small Blast Power-Ups, Announcer Banners, Nickname Collection, Interactive Tutorial

const GRID_SIZE = 8;

const VIBERS = [
  { id: 1, name: "Mint Antenna", color: "#00F5D4", img: "assets/vibers/viber1.webp" },
  { id: 2, name: "Cap Blue", color: "#3B82F6", img: "assets/vibers/viber2.webp" },
  { id: 3, name: "Peach Chest", color: "#FB7185", img: "assets/vibers/viber3.webp" },
  { id: 4, name: "Visor Slate", color: "#F59E0B", img: "assets/vibers/viber4.webp" },
  { id: 5, name: "Crown Lavender", color: "#A855F7", img: "assets/vibers/viber5.webp" },
  { id: 6, name: "Gold Ears", color: "#EAB308", img: "assets/vibers/viber6.webp" },
  { id: 7, name: "Ice Cap", color: "#06B6D4", img: "assets/vibers/viber7.webp" }
];

const SAGA_STAGES = [
  { level: 1, title: "Stage 1: Scout Raider", targetScore: 1200, moves: 22, numTypes: 4, iceCount: 0, rewardPfp: "assets/vibers/viber1.webp", rewardName: "Scout Antenna" },
  { level: 2, title: "Stage 2: Break the FUD", targetScore: 2400, moves: 20, numTypes: 5, iceCount: 8, rewardPfp: "assets/vibers/viber2.webp", rewardName: "Defender Cap" },
  { level: 3, title: "Stage 3: Spark Charge", targetScore: 3800, moves: 20, numTypes: 5, iceCount: 10, rewardPfp: "assets/vibers/viber3.webp", rewardName: "Spark Chest" },
  { level: 4, title: "Stage 4: FUD Blizzard", targetScore: 5200, moves: 18, numTypes: 6, iceCount: 14, rewardPfp: "assets/vibers/viber4.webp", rewardName: "Visor Sentinel" },
  { level: 5, title: "Stage 5: Testnet Boss", targetScore: 7000, moves: 16, numTypes: 6, iceCount: 16, rewardPfp: "assets/vibers/viber5.webp", rewardName: "Crown Master" },
  { level: 6, title: "Stage 6: Neon Surge", targetScore: 8800, moves: 18, numTypes: 6, iceCount: 18, rewardPfp: "assets/vibers/viber6.webp", rewardName: "Gold Ear Raider" },
  { level: 7, title: "Stage 7: Glitch Zone", targetScore: 10500, moves: 17, numTypes: 6, iceCount: 20, rewardPfp: "assets/vibers/viber7.webp", rewardName: "Frost Navigator" },
  { level: 8, title: "Stage 8: Deep Matrix", targetScore: 12500, moves: 16, numTypes: 7, iceCount: 22, rewardPfp: "assets/vibers/viber8.webp", rewardName: "Matrix Hacker" },
  { level: 9, title: "Stage 9: Overdrive", targetScore: 15000, moves: 15, numTypes: 7, iceCount: 24, rewardPfp: "assets/vibers/viber9.webp", rewardName: "Overdrive Viber" },
  { level: 10, title: "Stage 10: Supreme Vibe God", targetScore: 18000, moves: 14, numTypes: 7, iceCount: 26, rewardPfp: "assets/vibers/viber10.webp", rewardName: "Supreme Commander" }
];

const RANKS = [
  { name: "Novice Raider", minXP: 0 },
  { name: "FUD Fighter", minXP: 2500 },
  { name: "Vibe Specialist", minXP: 7000 },
  { name: "Chain Veteran", minXP: 14000 },
  { name: "Apex Viber", minXP: 24000 },
  { name: "Legendary God", minXP: 40000 }
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
        x, y,
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
      p.vy += 0.1;
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
    this.currentMode = "saga";
    this.difficulty = "normal";
    this.stageIndex = 0;
    this.score = 0;
    this.movesLeft = 0;
    this.timeLeft = 60;
    this.targetScore = 0;
    this.iceLeft = 0;
    this.timerInterval = null;

    // Player Identity & Career
    this.playerNickname = localStorage.getItem("vibecrush_nickname") || "";
    this.careerXP = parseInt(localStorage.getItem("vibecrush_xp") || "0");
    this.unlockedStage = parseInt(localStorage.getItem("vibecrush_unlocked_stage") || "0");
    this.unlockedPFPs = JSON.parse(localStorage.getItem("vibecrush_unlocked_pfps") || "[]");

    // Boosters Inventory
    this.boosters = JSON.parse(localStorage.getItem("vibecrush_boosters") || '{"hammer": 3, "bomb": 2, "shuffle": 3}');
    this.activeBooster = null;

    // Interaction & Animation
    this.selectedTile = null;
    this.isProcessing = false;
    this.comboCount = 0;
    this.hintTimer = null;
    this.currentHint = null;

    // UI Elements
    this.boardEl = document.getElementById("boardGrid");
    this.scoreEl = document.getElementById("scoreValue");
    this.targetEl = document.getElementById("targetValue");
    this.movesEl = document.getElementById("movesValue");
    this.levelEl = document.getElementById("levelBadge");
    this.movesLabelEl = document.getElementById("movesLabel");
    this.objectiveEl = document.getElementById("objectiveDesc");
    this.comboBadgeEl = document.getElementById("comboBadge");
    this.progressFillEl = document.getElementById("progressFill");
    this.rankNameEl = document.getElementById("rankName");
    this.xpValueEl = document.getElementById("xpValue");
    this.playerNicknameEl = document.getElementById("playerNickname");

    const pCanvas = document.getElementById("particlesCanvas");
    this.particles = new ParticleSystem(pCanvas);

    this.checkOnboarding();
    this.updateCareerUI();
    this.updateBoosterUI();
    this.initEventListeners();
    this.startCurrentMode();
  }

  get currentStage() {
    return SAGA_STAGES[this.stageIndex];
  }

  checkOnboarding() {
    if (!this.playerNickname) {
      document.getElementById("modalNickname").classList.add("active");
    } else {
      this.playerNicknameEl.textContent = this.playerNickname;
    }
  }

  setNickname(nick) {
    this.playerNickname = nick.trim() || "Raider";
    localStorage.setItem("vibecrush_nickname", this.playerNickname);
    this.playerNicknameEl.textContent = this.playerNickname;
    document.getElementById("modalNickname").classList.remove("active");

    // Show tutorial on first session
    const hasSeenTut = localStorage.getItem("vibecrush_seen_tutorial");
    if (!hasSeenTut) {
      document.getElementById("modalTutorial").classList.add("active");
      localStorage.setItem("vibecrush_seen_tutorial", "true");
    }
  }

  updateCareerUI() {
    this.xpValueEl.textContent = `${this.careerXP.toLocaleString()} XP`;
    let currentRank = RANKS[0].name;
    for (const r of RANKS) {
      if (this.careerXP >= r.minXP) currentRank = r.name;
    }
    this.rankNameEl.textContent = currentRank;
  }

  updateBoosterUI() {
    document.getElementById("countHammer").textContent = this.boosters.hammer;
    document.getElementById("countBomb").textContent = this.boosters.bomb;
    document.getElementById("countShuffle").textContent = this.boosters.shuffle;
  }

  startCurrentMode() {
    this.stopTimer();
    this.clearHintTimer();
    this.score = 0;
    this.comboCount = 0;
    this.selectedTile = null;
    this.isProcessing = false;
    this.activeBooster = null;
    this.resetBoosterHighlight();

    if (this.currentMode === "saga") {
      this.initSagaStage();
    } else if (this.currentMode === "time_rush") {
      this.initTimeRush();
    } else if (this.currentMode === "endless") {
      this.initEndlessMode();
    }

    this.scoreEl.textContent = this.score;
    this.updateProgressBar();
    this.renderBoard();
    this.resetHintTimer();
  }

  getDifficultyMultiplier() {
    if (this.difficulty === "easy") return 0.8;
    if (this.difficulty === "hard") return 1.35;
    return 1.0;
  }

  initSagaStage() {
    const stage = this.currentStage;
    const diffMult = this.getDifficultyMultiplier();
    this.movesLeft = Math.round(stage.moves * (this.difficulty === "easy" ? 1.25 : this.difficulty === "hard" ? 0.85 : 1));
    this.targetScore = Math.round(stage.targetScore * diffMult);
    this.iceLeft = stage.iceCount;

    this.levelEl.textContent = `S${stage.level}`;
    this.movesLabelEl.textContent = "Moves";
    this.movesEl.textContent = this.movesLeft;
    this.targetEl.textContent = this.targetScore.toLocaleString();

    if (this.iceLeft > 0) {
      this.objectiveEl.innerHTML = `Break <b>${this.iceLeft} FUD Ice</b> & hit <b>${this.targetScore.toLocaleString()}</b> pts`;
    } else {
      this.objectiveEl.innerHTML = `Reach <b>${this.targetScore.toLocaleString()}</b> points in <b>${this.movesLeft}</b> moves`;
    }

    this.initBoard(stage.numTypes, this.iceLeft);
  }

  initTimeRush() {
    this.timeLeft = 60;
    this.targetScore = Math.round(5000 * this.getDifficultyMultiplier());
    this.iceLeft = 0;

    this.levelEl.textContent = "⏱";
    this.movesLabelEl.textContent = "Time";
    this.movesEl.textContent = `${this.timeLeft}s`;
    this.targetEl.textContent = this.targetScore.toLocaleString();
    this.objectiveEl.innerHTML = `Score as many points as possible before time expires!`;

    this.initBoard(5, 0);

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.movesEl.textContent = `${this.timeLeft}s`;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.checkLevelOutcome();
      }
    }, 1000);
  }

  initEndlessMode() {
    this.movesLeft = 999;
    this.targetScore = 10000;
    this.iceLeft = 0;

    this.levelEl.textContent = "∞";
    this.movesLabelEl.textContent = "Endless";
    this.movesEl.textContent = "∞";
    this.targetEl.textContent = "Leaderboard";
    this.objectiveEl.innerHTML = `Chill out and vibe. Build massive combos with no turn limits.`;

    this.initBoard(5, 0);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  initBoard(numTypes, iceCount) {
    this.board = [];
    const pool = VIBERS.slice(0, numTypes);

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
          special: null, // 'laser_h', 'laser_v', 'bomb', 'rainbow'
          ice: false
        };
      }
    }

    if (iceCount > 0) {
      let placed = 0;
      while (placed < iceCount) {
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
    // Initialize static 8x8 slot DOM elements once if not already present
    if (this.boardEl.children.length !== GRID_SIZE * GRID_SIZE) {
      this.boardEl.innerHTML = "";
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const slot = document.createElement("div");
          slot.className = "tile-slot";
          slot.dataset.row = r;
          slot.dataset.col = c;
          this.boardEl.appendChild(slot);
        }
      }
    }

    // Update each slot smoothly without destroying the DOM tree
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const slot = this.boardEl.children[r * GRID_SIZE + c];
        const cell = this.board[r][c];

        if (!cell || !cell.type) {
          slot.innerHTML = "";
          continue;
        }

        let tile = slot.querySelector(".tile");
        const isNewTile = !tile;

        if (isNewTile) {
          tile = document.createElement("div");
          tile.className = "tile";
          tile.dataset.row = r;
          tile.dataset.col = c;
          if (cell.isNewDrop) {
            tile.classList.add("tile-drop");
            cell.isNewDrop = false;
          }
          slot.innerHTML = "";
          slot.appendChild(tile);
        } else {
          tile.dataset.row = r;
          tile.dataset.col = c;
          tile.className = "tile";
        }

        tile.style.backgroundImage = `url('${cell.type.img}')`;
        tile.style.backgroundColor = cell.type.color;

        if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
          tile.classList.add("selected");
        }

        if (this.activeBooster === "hammer") {
          tile.classList.add("hammer-target");
        }

        if (this.currentHint && (
          (this.currentHint.r1 === r && this.currentHint.c1 === c) ||
          (this.currentHint.r2 === r && this.currentHint.c2 === c)
        )) {
          tile.classList.add("hint-pulse");
        }

        // Special tile decorations
        let badge = tile.querySelector(".power-badge");
        if (cell.special === "laser_h" || cell.special === "laser_v") {
          if (!badge) {
            badge = document.createElement("div");
            tile.appendChild(badge);
          }
          badge.className = "power-badge power-line";
          badge.textContent = cell.special === "laser_h" ? "↔" : "↕";
        } else if (cell.special === "bomb") {
          if (!badge) {
            badge = document.createElement("div");
            tile.appendChild(badge);
          }
          badge.className = "power-badge power-bomb";
          badge.textContent = "💥";
        } else if (cell.special === "rainbow") {
          if (!badge) {
            badge = document.createElement("div");
            tile.appendChild(badge);
          }
          badge.className = "power-badge power-rainbow";
          badge.textContent = "★";
        } else if (badge) {
          badge.remove();
        }

        // Ice Block overlay
        let ice = slot.querySelector(".ice-overlay");
        if (cell.ice) {
          if (!ice) {
            ice = document.createElement("div");
            ice.className = "ice-overlay";
            slot.appendChild(ice);
          }
        } else if (ice) {
          ice.remove();
        }
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

      if (this.activeBooster === "hammer") {
        this.useHammer(activeSlot.r, activeSlot.c);
        activeSlot = null;
        return;
      }

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

    if (this.activeBooster === "hammer") {
      this.useHammer(r, c);
      return;
    }

    // Direct tap detonation on special power-up tiles
    const currentCell = this.board[r][c];
    if (currentCell && currentCell.special && !this.selectedTile) {
      this.detonateSpecialTileDirectly(r, c);
      return;
    }

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

  async detonateSpecialTileDirectly(r, c) {
    this.isProcessing = true;
    if (this.currentMode === "saga") this.decrementMove();

    const cell = this.board[r][c];
    const toClear = new Map();
    toClear.set(`${r},${c}`, { r, c });

    if (cell.special === "bomb") {
      this.showShockwave(r, c);
      window.audio.playExplosion();
      this.shakeBoard();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (this.isValidCoord(nr, nc)) toClear.set(`${nr},${nc}`, { r: nr, c: nc });
        }
      }
    } else if (cell.special === "laser_h") {
      window.audio.playLaser();
      this.showLaserEffect(r, 0, "horizontal");
      for (let sc = 0; sc < GRID_SIZE; sc++) toClear.set(`${r},${sc}`, { r, c: sc });
    } else if (cell.special === "laser_v") {
      window.audio.playLaser();
      this.showLaserEffect(0, c, "vertical");
      for (let sr = 0; sr < GRID_SIZE; sr++) toClear.set(`${sr},${c}`, { r: sr, c });
    } else if (cell.special === "rainbow") {
      await this.triggerRainbowSwap(r, c, r === 0 ? r + 1 : r - 1, c);
      await this.resolveBoard();
      this.checkLevelOutcome();
      this.isProcessing = false;
      return;
    }

    toClear.forEach((pt) => {
      const slotEl = this.boardEl.querySelector(`[data-row='${pt.r}'][data-col='${pt.c}'] .tile`);
      if (slotEl) slotEl.classList.add("pop");
    });
    await this.sleep(200);

    toClear.forEach((pt) => {
      if (this.board[pt.r][pt.c] && this.board[pt.r][pt.c].ice) {
        this.board[pt.r][pt.c].ice = false;
        this.iceLeft = Math.max(0, this.iceLeft - 1);
        window.audio.playIceBreak();
      }
      this.board[pt.r][pt.c] = null;
    });

    this.addScore(toClear.size * 80);
    await this.applyGravity();
    this.renderBoard();
    await this.resolveBoard();
    this.checkLevelOutcome();
    this.isProcessing = false;
  }

  isValidCoord(r, c) {
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
  }

  async useHammer(r, c) {
    if (this.boosters.hammer <= 0) return;
    this.boosters.hammer--;
    this.activeBooster = null;
    this.resetBoosterHighlight();
    this.updateBoosterUI();
    this.saveBoosters();

    window.audio.playExplosion();
    this.shakeBoard();
    const cell = this.board[r][c];
    if (cell && cell.ice) {
      cell.ice = false;
      this.iceLeft = Math.max(0, this.iceLeft - 1);
    }
    this.board[r][c] = null;
    this.addScore(150);
    this.renderBoard();
    await this.applyGravity();
    this.renderBoard();
    await this.resolveBoard();
    this.checkLevelOutcome();
  }

  async useBombBooster() {
    if (this.boosters.bomb <= 0 || this.isProcessing) return;
    this.boosters.bomb--;
    this.updateBoosterUI();
    this.saveBoosters();

    window.audio.playBooster();
    window.audio.playRainbow();
    this.shakeBoard();

    const r = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    const c = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    this.board[r][c] = {
      type: VIBERS[0],
      special: "rainbow",
      ice: false
    };
    this.renderBoard();
    this.particles.spawnFirework(window.innerWidth / 2, window.innerHeight / 2, 40);
  }

  async useShuffleBooster() {
    if (this.boosters.shuffle <= 0 || this.isProcessing) return;
    this.boosters.shuffle--;
    this.updateBoosterUI();
    this.saveBoosters();

    window.audio.playBooster();
    window.audio.playSwap();

    const allTypes = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.board[r][c]) allTypes.push(this.board[r][c].type);
      }
    }
    allTypes.sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.board[r][c]) {
          this.board[r][c].type = allTypes[idx++];
        }
      }
    }
    this.renderBoard();
    await this.resolveBoard();
  }

  saveBoosters() {
    localStorage.setItem("vibecrush_boosters", JSON.stringify(this.boosters));
  }

  resetBoosterHighlight() {
    document.querySelectorAll(".btn-booster").forEach(b => b.classList.remove("active"));
  }

  async handleSwap(r1, c1, r2, c2) {
    this.isProcessing = true;
    this.clearHint();
    window.audio.playSwap();

    const cell1 = this.board[r1][c1];
    const cell2 = this.board[r2][c2];

    // Double Special Tile Combos (e.g. Bomb + Laser or Bomb + Bomb)
    if (cell1.special && cell2.special) {
      if (this.currentMode === "saga") this.decrementMove();
      await this.triggerSpecialCombo(r1, c1, r2, c2);
      await this.resolveBoard();
      this.checkLevelOutcome();
      this.isProcessing = false;
      this.resetHintTimer();
      return;
    }

    if (cell1.special === "rainbow" || cell2.special === "rainbow") {
      if (this.currentMode === "saga") this.decrementMove();
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
      if (this.currentMode === "saga") this.decrementMove();
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

  async triggerSpecialCombo(r1, c1, r2, c2) {
    this.triggerAnnouncer("SUPER COMBO! 💥", "tasty");
    this.shakeBoard();
    window.audio.playExplosion();
    this.showShockwave(r1, c1);
    this.showShockwave(r2, c2);

    const toClear = new Map();
    // Wipe 5x5 area and cross lasers
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r1 + dr;
        const nc = c1 + dc;
        if (this.isValidCoord(nr, nc)) toClear.set(`${nr},${nc}`, { r: nr, c: nc });
      }
    }
    toClear.forEach((pt) => {
      this.board[pt.r][pt.c] = null;
    });
    this.addScore(toClear.size * 100);
    await this.applyGravity();
    this.renderBoard();
  }

  decrementMove() {
    this.movesLeft--;
    this.movesEl.textContent = this.movesLeft;
  }

  swapTiles(r1, c1, r2, c2) {
    const temp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = temp;
  }

  findMatches() {
    const matches = [];
    const matchedCoords = new Set();

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

      // Announcer on big combos
      if (this.comboCount === 2) this.triggerAnnouncer("SWEET! 🍬", "sweet");
      if (this.comboCount === 3) this.triggerAnnouncer("TASTY! ⚡", "tasty");
      if (this.comboCount >= 4) this.triggerAnnouncer("VIBING! 🔥", "tasty");

      const toClear = new Map();
      const newSpecials = [];

      matches.forEach((m) => {
        // FORMING FOUR: Creates a small explosive bomb or line laser!
        if (m.count === 4) {
          window.audio.playPowerSpawn();
          const pivot = m.group[1];
          // Randomly spawn small 3x3 blast bomb or line laser!
          const specialType = Math.random() > 0.5 ? "bomb" : (m.dir === "h" ? "laser_v" : "laser_h");
          newSpecials.push({
            r: pivot.r,
            c: pivot.c,
            type: this.board[pivot.r][pivot.c].type,
            special: specialType
          });
        } else if (m.count >= 5) {
          window.audio.playPowerSpawn();
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

      // Detonate special tiles that were caught in matches
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
          this.showShockwave(pt.r, pt.c);
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

      this.careerXP += points;
      localStorage.setItem("vibecrush_xp", this.careerXP);
      this.updateCareerUI();

      toClear.forEach((pt) => {
        if (this.board[pt.r][pt.c]) {
          const slotEl = this.boardEl.querySelector(`[data-row='${pt.r}'][data-col='${pt.c}']`);
          if (slotEl) {
            const rect = slotEl.getBoundingClientRect();
            this.particles.spawnFirework(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
          }
        }
      });

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

      // Animate newly spawned powerups
      newSpecials.forEach((sp) => {
        const powerEl = this.boardEl.querySelector(`[data-row='${sp.r}'][data-col='${sp.c}'] .tile`);
        if (powerEl) powerEl.classList.add("special-spawn");
      });

      matches = this.findMatches();
    }

    this.hideComboBadge();
  }

  showShockwave(r, c) {
    const ring = document.createElement("div");
    ring.className = "shockwave-ring";
    ring.style.top = `calc(var(--tile-size) * ${r} + var(--tile-size) / 2)`;
    ring.style.left = `calc(var(--tile-size) * ${c} + var(--tile-size) / 2)`;
    this.boardEl.parentElement.appendChild(ring);
    setTimeout(() => ring.remove(), 420);
  }

  triggerAnnouncer(text, type = "sweet") {
    window.audio.playAnnounce(type);
    const existing = document.querySelector(".announcer-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.className = "announcer-banner";
    banner.textContent = text;
    this.boardEl.parentElement.appendChild(banner);
    setTimeout(() => banner.remove(), 850);
  }

  async triggerRainbowSwap(r1, c1, r2, c2) {
    const rainbowPt = this.board[r1][c1].special === "rainbow" ? { r: r1, c: c1 } : { r: r2, c: c2 };
    const targetCell = this.board[r1][c1].special === "rainbow" ? this.board[r2][c2] : this.board[r1][c1];
    const targetId = targetCell.type.id;

    this.triggerAnnouncer("SUPERNOVA! ★", "tasty");
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
    const pool = VIBERS.slice(0, this.currentMode === "saga" ? this.currentStage.numTypes : 6);

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
          ice: false,
          isNewDrop: true
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
    if (this.currentMode === "endless") {
      this.progressFillEl.style.width = "100%";
      return;
    }
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

  resetHintTimer() {
    this.clearHintTimer();
    this.hintTimer = setTimeout(() => {
      this.findAndShowHint();
    }, 4500);
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

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
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
    if (this.currentMode === "endless") return;

    if (this.currentMode === "saga") {
      const won = this.score >= this.targetScore && this.iceLeft === 0;
      const outOfMoves = this.movesLeft <= 0;
      if (won) {
        this.handleLevelWin();
      } else if (outOfMoves) {
        this.handleLevelFail();
      }
    } else if (this.currentMode === "time_rush") {
      if (this.score >= this.targetScore) {
        this.handleLevelWin();
      } else {
        this.handleLevelFail();
      }
    }
  }

  handleLevelWin() {
    this.clearHint();
    this.stopTimer();
    window.audio.playVictory();

    this.boosters.hammer = Math.min(5, this.boosters.hammer + 1);
    this.saveBoosters();
    this.updateBoosterUI();

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.particles.spawnFirework(cx + (Math.random() * 200 - 100), cy + (Math.random() * 200 - 100), 45);
      }, i * 200);
    }

    let stars = 1;
    if (this.currentMode === "saga") {
      const stage = this.currentStage;
      if (this.movesLeft >= Math.floor(stage.moves * 0.35)) stars = 2;
      if (this.movesLeft >= Math.floor(stage.moves * 0.55) && this.score >= stage.targetScore * 1.3) stars = 3;

      if (this.stageIndex + 1 > this.unlockedStage) {
        this.unlockedStage = this.stageIndex + 1;
        localStorage.setItem("vibecrush_unlocked_stage", this.unlockedStage);
      }

      if (!this.unlockedPFPs.includes(stage.rewardPfp)) {
        this.unlockedPFPs.push(stage.rewardPfp);
        localStorage.setItem("vibecrush_unlocked_pfps", JSON.stringify(this.unlockedPFPs));
      }

      document.getElementById("winRewardImg").src = stage.rewardPfp;
      document.getElementById("winRewardName").textContent = stage.rewardName;
      const dlBtn = document.getElementById("btnDownloadReward");
      if (dlBtn) {
        dlBtn.href = stage.rewardPfp;
        dlBtn.download = `${stage.rewardName.replace(/\s+/g, "_")}.webp`;
      }
    }

    document.getElementById("winLevelTitle").textContent = `${this.currentMode === "saga" ? this.currentStage.title : "Challenge"} Cleared!`;
    document.getElementById("winScore").textContent = this.score.toLocaleString();
    document.getElementById("winMovesLeft").textContent = this.currentMode === "saga" ? this.movesLeft : `${this.timeLeft}s left`;
    document.getElementById("winStars").innerHTML = "★".repeat(stars) + "☆".repeat(3 - stars);

    const callSign = this.playerNickname ? `[${this.playerNickname}] ` : "";
    const tweetText = `${callSign}Just crushed ${this.currentStage ? this.currentStage.title : "Vibe Crush"} with ${this.score.toLocaleString()} points (${stars}★)! 🎮⚡\n\nRank: ${this.rankNameEl.textContent} | Raiding the testnet with @vibevibefun. Can your team beat my score?\n\nhttps://ayoola-tech2024.github.io/vibe-crush/`;
    document.getElementById("btnShareWin").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    const nextBtn = document.getElementById("btnNextLevel");
    if (this.currentMode === "saga" && this.stageIndex < SAGA_STAGES.length - 1) {
      nextBtn.style.display = "flex";
      nextBtn.onclick = () => {
        this.closeModals();
        this.stageIndex++;
        this.startCurrentMode();
      };
    } else {
      nextBtn.style.display = "none";
    }

    document.getElementById("modalWin").classList.add("active");
  }

  handleLevelFail() {
    this.clearHint();
    this.stopTimer();
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

  // Nickname Submit
  document.getElementById("btnSubmitNickname").onclick = () => {
    const val = document.getElementById("inputNickname").value;
    window.game.setNickname(val);
  };
  document.getElementById("inputNickname").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = document.getElementById("inputNickname").value;
      window.game.setNickname(val);
    }
  });

  // Tutorial Modal Controls
  document.getElementById("btnTutorial").onclick = () => {
    document.getElementById("modalTutorial").classList.add("active");
  };
  document.getElementById("btnCloseTutorial").onclick = () => {
    document.getElementById("modalTutorial").classList.remove("active");
  };

  // Mode Selection Tabs
  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      window.game.currentMode = tab.dataset.mode;
      window.game.startCurrentMode();
    };
  });

  // Difficulty Pills
  document.querySelectorAll(".diff-pill").forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll(".diff-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      window.game.difficulty = pill.dataset.diff;
      window.game.startCurrentMode();
    };
  });

  // In-Game Booster Buttons
  document.getElementById("btnBoosterHammer").onclick = () => {
    if (window.game.boosters.hammer <= 0) return;
    window.audio.playBooster();
    const btn = document.getElementById("btnBoosterHammer");
    if (window.game.activeBooster === "hammer") {
      window.game.activeBooster = null;
      btn.classList.remove("active");
    } else {
      window.game.activeBooster = "hammer";
      btn.classList.add("active");
    }
    window.game.renderBoard();
  };

  document.getElementById("btnBoosterBomb").onclick = () => {
    window.game.useBombBooster();
  };

  document.getElementById("btnBoosterShuffle").onclick = () => {
    window.game.useShuffleBooster();
  };

  // Retry modal
  document.getElementById("btnRetryLevel").onclick = () => {
    window.game.closeModals();
    window.game.startCurrentMode();
  };

  // Sound toggle
  const muteBtn = document.getElementById("btnMute");
  muteBtn.onclick = () => {
    const isMuted = window.audio.toggleMute();
    muteBtn.innerHTML = isMuted ? "🔇" : "🔊";
  };

  // Restart
  document.getElementById("btnRestart").onclick = () => {
    if (confirm("Restart this stage?")) {
      window.game.startCurrentMode();
    }
  };

  // Saga Map Modal
  const mapModal = document.getElementById("modalSagaMap");
  document.getElementById("btnSagaMap").onclick = () => {
    const grid = document.getElementById("sagaMapGrid");
    grid.innerHTML = "";
    SAGA_STAGES.forEach((stg, idx) => {
      const unlocked = idx <= window.game.unlockedStage;
      const card = document.createElement("div");
      card.className = `saga-card ${unlocked ? "unlocked" : "locked"}`;
      card.innerHTML = `
        <img src="${stg.rewardPfp}" alt="${stg.title}" />
        <h4>${stg.title}</h4>
        <span>${stg.targetScore.toLocaleString()} pts</span>
        <span style="font-size:10px; color:${unlocked ? '#00f5d4' : '#666'}">${unlocked ? 'Unlocked 🔓' : 'Locked 🔒'}</span>
      `;
      if (unlocked) {
        card.onclick = () => {
          window.game.stageIndex = idx;
          window.game.currentMode = "saga";
          document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
          document.querySelector("[data-mode='saga']").classList.add("active");
          mapModal.classList.remove("active");
          window.game.startCurrentMode();
        };
      }
      grid.appendChild(card);
    });
    mapModal.classList.add("active");
  };

  document.getElementById("btnCloseMap").onclick = () => mapModal.classList.remove("active");

  // Gallery Modal
  const galleryModal = document.getElementById("modalGallery");
  document.getElementById("btnGallery").onclick = () => {
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = "";
    SAGA_STAGES.forEach((stg) => {
      const unlocked = window.game.unlockedPFPs.includes(stg.rewardPfp);
      const item = document.createElement("div");
      item.className = `gallery-item ${unlocked ? "unlocked" : "locked"}`;
      item.innerHTML = `
        <img src="${stg.rewardPfp}" alt="${stg.rewardName}" />
        <span>${stg.rewardName}</span>
        ${unlocked ? `<a class="btn-download-pfp" href="${stg.rewardPfp}" download="${stg.rewardName}.webp">⬇ Save PFP</a>` : `<span style="font-size:10px; color:#666;">Locked (Beat S${stg.level})</span>`}
      `;
      grid.appendChild(item);
    });
    galleryModal.classList.add("active");
  };

  document.getElementById("btnCloseGallery").onclick = () => galleryModal.classList.remove("active");
});
