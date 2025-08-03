// game.js

const socket = io();

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 10;
const maxPaddleY = canvas.height - grid - paddleHeight;

let paddleSpeed = 12;
let ballSpeed = 10;
let gameOver = false;

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

function createBall() {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
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
  alert(`${winner} wins the game! 🎉`);
  // TODO: optional canvas confetti effect
}

function loop() {
  if (gameOver) return;

  requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

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
      if (leftScore >= 200 && balls.length > 10) {
        balls[i] = null;
      } else {
        ball.dx *= -1;
        ball.x = leftPaddle.x + leftPaddle.width;
        balls.push(createBall());
      }
    }

    if (collides(ball, rightPaddle)) {
      rightScore += 10;
      if (rightScore >= 1000) {
        fireConfetti('Yellow');
        gameOver = true;
        return;
      }
      ballHandled = true;
      if (rightScore >= 200 && balls.length > 10) {
        balls[i] = null;
      } else {
        ball.dx *= -1;
        ball.x = rightPaddle.x - ball.width;
        balls.push(createBall());
      }
    }

    if (!ballHandled) {
      context.fillStyle = 'white';
      context.fillRect(ball.x, ball.y, ball.width, ball.height);
    }
  }

  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, grid);

  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }

  drawScore();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') rightPaddle.dy = -paddleSpeed;
  if (e.key === 'ArrowDown') rightPaddle.dy = paddleSpeed;
  if (e.key === 'w') leftPaddle.dy = -paddleSpeed;
  if (e.key === 's') leftPaddle.dy = paddleSpeed;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') rightPaddle.dy = 0;
  if (e.key === 'w' || e.key === 's') leftPaddle.dy = 0;
});

loop();
