const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const startBtn = document.getElementById("startBtn");

const lanes = [200, 400, 600];
const groundY = canvas.height - 80;
const laneWidth = 120;

let gameRunning = false;
let score = 0;
let bestScore = Number(localStorage.getItem("templeBest")) || 0;

const player = {
  lane: 1,
  x: lanes[1],
  y: groundY - 50,
  width: 44,
  height: 50,
  vy: 0,
  jumpPower: 14,
  gravity: 0.6,
  isJumping: false,
};

const obstacles = [];
const coins = [];

let obstacleTimer = 0;
let coinTimer = 0;

function resetGame() {
  score = 0;
  obstacles.length = 0;
  coins.length = 0;
  obstacleTimer = 0;
  coinTimer = 0;

  player.lane = 1;
  player.x = lanes[player.lane];
  player.y = groundY - player.height;
  player.vy = 0;
  player.isJumping = false;

  scoreEl.textContent = score;
}

function startGame() {
  resetGame();
  gameRunning = true;
  startBtn.textContent = "Restart Game";
}

function endGame() {
  gameRunning = false;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("templeBest", String(bestScore));
  bestScoreEl.textContent = bestScore;
  alert("Game Over! Final Score: " + score);
}

function moveLeft() {
  if (!gameRunning) return;
  player.lane = Math.max(0, player.lane - 1);
  player.x = lanes[player.lane];
}

function moveRight() {
  if (!gameRunning) return;
  player.lane = Math.min(2, player.lane + 1);
  player.x = lanes[player.lane];
}

function jump() {
  if (!gameRunning || player.isJumping) return;
  player.isJumping = true;
  player.vy = -player.jumpPower;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLeft();
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveRight();
  if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") {
    event.preventDefault();
    jump();
  }
});

startBtn.addEventListener("click", startGame);

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const height = 35 + Math.random() * 50;
  obstacles.push({
    lane,
    x: lanes[lane],
    y: -height,
    width: 52,
    height,
    color: "#d35400",
  });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * 3);
  const y = -30 - Math.random() * 160;
  coins.push({
    lane,
    x: lanes[lane],
    y,
    r: 10,
    color: "#f1c40f",
  });
}

function updatePlayer() {
  if (player.isJumping) {
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= groundY - player.height) {
      player.y = groundY - player.height;
      player.vy = 0;
      player.isJumping = false;
    }
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.y += 4 + score * 0.03;

    if (obstacle.y > canvas.height + obstacle.height) {
      obstacles.splice(i, 1);
      continue;
    }

    const playerBox = {
      x: player.x - player.width / 2,
      y: player.y,
      width: player.width,
      height: player.height,
    };

    const obstacleBox = {
      x: obstacle.x - obstacle.width / 2,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height,
    };

    const hit =
      playerBox.x < obstacleBox.x + obstacleBox.width &&
      playerBox.x + playerBox.width > obstacleBox.x &&
      playerBox.y < obstacleBox.y + obstacleBox.height &&
      playerBox.y + playerBox.height > obstacleBox.y;

    if (hit && obstacle.lane === player.lane) {
      endGame();
      return;
    }
  }
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.y += 4 + score * 0.03;

    if (coin.y > canvas.height + 20) {
      coins.splice(i, 1);
      continue;
    }

    const dx = Math.abs(coin.x - player.x);
    const dy = Math.abs(coin.y - (player.y + player.height / 2));

    if (dx < 22 && dy < 22) {
      coins.splice(i, 1);
      score += 10;
      scoreEl.textContent = score;
    }
  }
}

function update() {
  if (gameRunning) {
    score += 0.2;
    scoreEl.textContent = Math.floor(score);

    obstacleTimer += 1;
    coinTimer += 1;

    if (obstacleTimer > 70) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    if (coinTimer > 40) {
      spawnCoin();
      coinTimer = 0;
    }

    updatePlayer();
    updateObstacles();
    updateCoins();

    if (!gameRunning) return;
  }

  draw();
  requestAnimationFrame(update);
}

function drawBackground() {
  ctx.fillStyle = "#1d2b36";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "#4a3521";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // lane lines
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo((canvas.width / 3) * i, groundY);
    ctx.lineTo((canvas.width / 3) * i, canvas.height);
    ctx.stroke();
  }

  // subtle moving effect
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 20; i++) {
    const x = (i * 70 + (score * 2)) % (canvas.width + 80);
    const y = (i * 40) % canvas.height;
    ctx.fillRect(x, y, 18, 2);
  }
}

function drawPlayer() {
  ctx.fillStyle = "#3498db";
  ctx.fillRect(player.x - player.width / 2, player.y, player.width, player.height);

  // head
  ctx.fillStyle = "#eaf2ff";
  ctx.fillRect(player.x - 10, player.y - 12, 20, 12);
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y, obstacle.width, obstacle.height);
  }
}

function drawCoins() {
  for (const coin of coins) {
    ctx.beginPath();
    ctx.fillStyle = coin.color;
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawCoins();
  drawObstacles();
  drawPlayer();
}

resetGame();
bestScoreEl.textContent = bestScore;
requestAnimationFrame(update);
