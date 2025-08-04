// game.js

const socket = io();

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 10;
const maxPaddleY = canvas.height - grid - paddleHeight;

let paddleSpeed = 12;
let ballSpeed = 5;
let gameOver = false;
let isOnline = false;
let playerSide = null; // 'left' or 'right'
let gameId = null;
let joinTimeout = null;
let countdown = 0;  // countdown seconds before game start


const leftPaddle = {
  x: grid * 2,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,
  dy: 0
};

const rightPaddle = {
  x: canvas.width - grid * 3,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,
  dy: 0
};

let balls = [createBall()];
let leftScore = 0;
let rightScore = 0;

function createBall(x = canvas.width / 2, y = canvas.height / 2) {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: x,
    y: y,
    width: grid,
    height: grid,
    dx: Math.cos(angle) * ballSpeed,
    dy: Math.sin(angle) * ballSpeed
  };
}

function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

function drawScore() {
  context.fillStyle = 'white';
  context.font = '20px Arial';
  context.fillText(`Blue: ${leftScore}`, 30, 30);
  context.fillText(`Yellow: ${rightScore}`, canvas.width - 140, 30);
}

function fireConfetti(winner) {
  const audio = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3');
  audio.play();
  const count = 150;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  alert(`${winner} wins the game! 🎉`);
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('restartBtn').style.display = 'inline-block';
}

function startGameMode(mode) {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('restartBtn').style.display = 'none';
  gameOver = false;
  balls = [createBall()];
  leftScore = 0;
  rightScore = 0;
  countdown = 3; // start countdown at 3 seconds

  leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
  rightPaddle.y = canvas.height / 2 - paddleHeight / 2;

  if (mode === 'online') {
    isOnline = true;
    gameId = new URLSearchParams(window.location.search).get('game') || Math.random().toString(36).substr(2, 6);
    window.history.replaceState({}, '', `?game=${gameId}`);
    socket.emit('joinGame', gameId);
    const status = document.getElementById('status');
    status.innerText = 'Waiting for another player to join...';
    status.style.display = 'block';

    let timeLeft = 300;
    joinTimeout = setInterval(() => {
      timeLeft--;
      status.innerText = `Waiting for another player to join... (${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')})`;
      if (timeLeft <= 0) {
        clearInterval(joinTimeout);
        status.innerText = 'Time out! No player joined. Game over.';
        setTimeout(() => location.reload(), 3000);
      }
    }, 1000);
  } else {
    isOnline = false;
    playerSide = null;
    loop();
  }

  // Start countdown timer
  if (countdown > 0) {
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        // Start the game loop if not already running
        if (!gameOver) {
          loop();
        }
      }
    }, 1000);
  }
}

function loop() {
  if (gameOver) return;

  requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (countdown > 0) {
    // Draw countdown text centered on canvas
    context.fillStyle = 'white';
    context.font = '80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(countdown, canvas.width / 2, canvas.height / 2);
    return;  // skip rest of loop to freeze gameplay
  }

  // normal game updates below...

  leftPaddle.y += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  leftPaddle.y = Math.max(grid, Math.min(maxPaddleY, leftPaddle.y));
  rightPaddle.y = Math.max(grid, Math.min(maxPaddleY, rightPaddle.y));

  context.fillStyle = 'blue';
  context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  context.fillStyle = 'yellow';
  context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  balls = balls.filter(ball => ball !== null);

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < grid || ball.y + ball.height > canvas.height - grid) {
      ball.dy *= -1;
    }

    if (ball.x < 0 || ball.x > canvas.width) {
      balls[i] = null;
      continue;
    }

    let ballHandled = false;

    if (collides(ball, leftPaddle)) {
      leftScore += 10;
      if (leftScore >= 1000) {
        fireConfetti('Blue');
        gameOver = true;
        return;
      }
      ballHandled = true;
      ball.dx *= -1;
      ball.x = leftPaddle.x + leftPaddle.width;
      balls.push(createBall(ball.x, ball.y));
    }

    if (collides(ball, rightPaddle)) {
      rightScore += 10;
      if (rightScore >= 1000) {
        fireConfetti('Yellow');
        gameOver = true;
        return;
      }
      ballHandled = true;
      ball.dx *= -1;
      ball.x = rightPaddle.x - ball.width;
      balls.push(createBall(ball.x, ball.y));
    }

    if (!ballHandled) {
      context.fillStyle = 'white';
      context.fillRect(ball.x, ball.y, ball.width, ball.height);
    }
  }

  if (balls.length === 0) {
    gameOver = true;
    const winner = leftScore > rightScore ? 'Blue' : (rightScore > leftScore ? 'Yellow' : 'No one');
    fireConfetti(winner);
    return;
  }

  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, grid);

  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }

  drawScore();
}

socket.on('playerCount', (count) => {
  const status = document.getElementById('status');
  if (count < 2) {
    status.style.display = 'block';
    status.innerText = `Waiting for another player to join... (${count}/2)`;
  } else {
    status.innerText = 'Both players joined! Starting soon...';
  }
});

socket.on('startOnlineGame', (side) => {
  if (joinTimeout) clearInterval(joinTimeout);
  document.getElementById('status').style.display = 'none';
  playerSide = side;

  // Reset game state just like local start
  gameOver = false;
  balls = [createBall()];
  leftScore = 0;
  rightScore = 0;
  leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
  rightPaddle.y = canvas.height / 2 - paddleHeight / 2;
  countdown = 3; // start countdown for online game

  const entranceAudio = new Audio('https://www.soundjay.com/human/sounds/cheering-01.mp3');
  entranceAudio.play();
  confetti();

  // Start countdown timer for online game
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (!gameOver) loop();
    }
  }, 1000);
});


document.addEventListener('keydown', (e) => {
  if (isOnline) {
    if ((playerSide === 'right' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) ||
        (playerSide === 'left' && (e.key === 'w' || e.key === 's'))){
      socket.emit('keydown', e.key);
    }
  } else {
    if (e.key === 'ArrowUp') rightPaddle.dy = -paddleSpeed;
    if (e.key === 'ArrowDown') rightPaddle.dy = paddleSpeed;
    if (e.key === 'w') leftPaddle.dy = -paddleSpeed;
    if (e.key === 's') leftPaddle.dy = paddleSpeed;
  }
});

document.addEventListener('keyup', (e) => {
  if (isOnline) {
    if ((playerSide === 'right' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) ||
        (playerSide === 'left' && (e.key === 'w' || e.key === 's'))){
      socket.emit('keyup', e.key);
    }
  } else {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') rightPaddle.dy = 0;
    if (e.key === 'w' || e.key === 's') leftPaddle.dy = 0;
  }
});

const menuDiv = document.createElement('div');
menuDiv.id = 'menu';
menuDiv.style.position = 'absolute';
menuDiv.style.top = '0';
menuDiv.style.left = '0';
menuDiv.style.width = '100%';
menuDiv.style.height = '100%';
menuDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
menuDiv.style.display = 'flex';
menuDiv.style.flexDirection = 'column';
menuDiv.style.justifyContent = 'center';
menuDiv.style.alignItems = 'center';
menuDiv.innerHTML = `
  <h1 style="color:white">Pong Multiplayer</h1>
  <div id="status" style="color:yellow; margin-bottom: 10px;"></div>
  <button onclick="startGameMode('local')" style="font-size: 20px; padding: 10px 20px; margin: 10px;">Play on Same Machine</button>
  <button onclick="startGameMode('online')" style="font-size: 20px; padding: 10px 20px; margin: 10px;">Play with a Friend Online</button>
  <button id="restartBtn" onclick="startGameMode(isOnline ? 'online' : 'local')" style="display:inline-block; font-size: 18px; padding: 8px 16px; margin-top: 20px;">Restart Game</button>
`;
document.body.appendChild(menuDiv);

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
document.head.appendChild(script);
