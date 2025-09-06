// 遊戲變數
const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const finalScoreDisplay = document.getElementById("final-score");
const gameOverDisplay = document.getElementById("game-over");
const touchControls = document.getElementById("touch-controls");

// 設定畫布大小
function resizeCanvas() {
    const size = Math.min(window.innerWidth - 40, 400);
    canvas.width = size;
    canvas.height = size;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gridSize = 20;
let tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let direction = "right";
let nextDirection = "right";
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameSpeed = 150; // 毫秒
let gameLoop;
let isPaused = false;
let isGameOver = false;
let isGameStarted = false;
let isTouchDevice = false;

// 觸控相關變數
let touchStartX = 0;
let touchStartY = 0;
let touchIndicator = null;

// 檢測是否為觸控設備
function checkTouchDevice() {
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
    if (isTouchDevice) {
        touchControls.style.display = "block";
        canvas.style.cursor = "pointer";
    }
}

// 初始化遊戲
function initGame() {
    // 重新計算 tileCount
    tileCount = canvas.width / gridSize;
    
    // 初始化蛇
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    
    // 初始化食物
    generateFood();
    
    // 重置分數和方向
    score = 0;
    scoreDisplay.textContent = score;
    direction = "right";
    nextDirection = "right";
    
    // 隱藏遊戲結束畫面
    gameOverDisplay.style.display = "none";
    isGameOver = false;
    isPaused = false;
    pauseBtn.textContent = "暫停";
    
    // 繪製遊戲
    drawGame();
}

// 生成食物
function generateFood() {
    // 確保食物不會出現在蛇身上
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        validPosition = true;
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === food.x && snake[i].y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

// 繪製遊戲
function drawGame() {
    // 清空畫布
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製蛇
    for (let i = 0; i < snake.length; i++) {
        // 蛇頭用不同顏色
        if (i === 0) {
            ctx.fillStyle = "#2ecc71";
        } else {
            ctx.fillStyle = "#27ae60";
        }
        
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1);
        
        // 繪製蛇的眼睛（只在蛇頭）
        if (i === 0) {
            ctx.fillStyle = "#000";
            const eyeSize = gridSize / 5;
            
            // 根據方向繪製眼睛位置
            if (direction === "right") {
                ctx.fillRect(
                    snake[i].x * gridSize + gridSize - eyeSize * 2, 
                    snake[i].y * gridSize + eyeSize, 
                    eyeSize, eyeSize
                );
                ctx.fillRect(
                    snake[i].x * gridSize + gridSize - eyeSize * 2, 
                    snake[i].y * gridSize + gridSize - eyeSize * 2, 
                    eyeSize, eyeSize
                );
            } else if (direction === "left") {
                ctx.fillRect(
                    snake[i].x * gridSize + eyeSize, 
                    snake[i].y * gridSize + eyeSize, 
                    eyeSize, eyeSize
                );
                ctx.fillRect(
                    snake[i].x * gridSize + eyeSize, 
                    snake[i].y * gridSize + gridSize - eyeSize * 2, 
                    eyeSize, eyeSize
                );
            } else if (direction === "up") {
                ctx.fillRect(
                    snake[i].x * gridSize + eyeSize, 
                    snake[i].y * gridSize + eyeSize, 
                    eyeSize, eyeSize
                );
                ctx.fillRect(
                    snake[i].x * gridSize + gridSize - eyeSize * 2, 
                    snake[i].y * gridSize + eyeSize, 
                    eyeSize, eyeSize
                );
            } else if (direction === "down") {
                ctx.fillRect(
                    snake[i].x * gridSize + eyeSize, 
                    snake[i].y * gridSize + gridSize - eyeSize * 2, 
                    eyeSize, eyeSize
                );
                ctx.fillRect(
                    snake[i].x * gridSize + gridSize - eyeSize * 2, 
                    snake[i].y * gridSize + gridSize - eyeSize * 2, 
                    eyeSize, eyeSize
                );
            }
        }
    }
    
    // 繪製食物
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 1;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
}

// 更新遊戲狀態
function updateGame() {
    if (isPaused || isGameOver) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 計算新蛇頭位置
    let head = {x: snake[0].x, y: snake[0].y};
    
    switch (direction) {
        case "right":
            head.x++;
            break;
        case "left":
            head.x--;
            break;
        case "up":
            head.y--;
            break;
        case "down":
            head.y++;
            break;
    }
    
    // 檢查是否撞牆
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // 檢查是否撞到自己
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // 移動蛇
    snake.unshift(head);
    
    // 檢查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分數
        score++;
        scoreDisplay.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem("snakeHighScore", highScore);
        }
        
        // 生成新食物
        generateFood();
        
        // 加快遊戲速度（但不要太快）
        if (gameSpeed > 50) {
            gameSpeed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(updateGame, gameSpeed);
        }
    } else {
        // 如果沒吃到食物，移除蛇尾
        snake.pop();
    }
    
    // 繪製遊戲
    drawGame();
}

// 遊戲結束
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreDisplay.textContent = score;
    gameOverDisplay.style.display = "flex";
}

// 鍵盤控制
document.addEventListener("keydown", function(e) {
    // 防止按鍵重複觸發
    if (e.repeat) return;
    
    switch (e.key) {
        case "ArrowUp":
            if (direction !== "down") nextDirection = "up";
            break;
        case "ArrowDown":
            if (direction !== "up") nextDirection = "down";
            break;
        case "ArrowLeft":
            if (direction !== "right") nextDirection = "left";
            break;
        case "ArrowRight":
            if (direction !== "left") nextDirection = "right";
            break;
        case " ":
            // 空格鍵暫停/繼續
            togglePause();
            break;
    }
});

// 觸控控制
canvas.addEventListener('touchstart', function(e) {
    if (!isGameStarted || isGameOver) return;
    
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchStartX = e.touches[0].clientX - rect.left;
    touchStartY = e.touches[0].clientY - rect.top;
    
    // 顯示觸控方向指示器
    if (touchIndicator) {
        touchControls.removeChild(touchIndicator);
    }
    touchIndicator = document.createElement('div');
    touchIndicator.className = 'touch-direction';
    touchIndicator.style.left = (touchStartX - 30) + 'px';
    touchIndicator.style.top = (touchStartY - 30) + 'px';
    touchControls.appendChild(touchIndicator);
});

canvas.addEventListener('touchmove', function(e) {
    if (!isGameStarted || isGameOver) return;
    
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // 計算觸控方向
    const dx = touchX - touchStartX;
    const dy = touchY - touchStartY;
    
    // 更新方向指示器
    if (touchIndicator) {
        let directionSymbol = '';
        if (Math.abs(dx) > Math.abs(dy)) {
            directionSymbol = dx > 0 ? '→' : '←';
        } else {
            directionSymbol = dy > 0 ? '↓' : '↑';
        }
        touchIndicator.textContent = directionSymbol;
    }
    
    // 根據滑動方向改變蛇的方向
    if (Math.abs(dx) > Math.abs(dy)) {
        // 水平方向
        if (dx > 0 && direction !== "left") {
            nextDirection = "right";
        } else if (dx < 0 && direction !== "right") {
            nextDirection = "left";
        }
    } else {
        // 垂直方向
        if (dy > 0 && direction !== "up") {
            nextDirection = "down";
        } else if (dy < 0 && direction !== "down") {
            nextDirection = "up";
        }
    }
});

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (touchIndicator) {
        touchControls.removeChild(touchIndicator);
        touchIndicator = null;
    }
});

// 點擊控制（用於非觸控設備的點擊控制）
canvas.addEventListener('click', function(e) {
    if (!isTouchDevice && isGameStarted && !isGameOver) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const headX = snake[0].x * gridSize + gridSize / 2;
        const headY = snake[0].y * gridSize + gridSize / 2;
        
        const dx = clickX - headX;
        const dy = clickY - headY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平方向
            if (dx > 0 && direction !== "left") {
                nextDirection = "right";
            } else if (dx < 0 && direction !== "right") {
                nextDirection = "left";
            }
        } else {
            // 垂直方向
            if (dy > 0 && direction !== "up") {
                nextDirection = "down";
            } else if (dy < 0 && direction !== "down") {
                nextDirection = "up";
            }
        }
    }
});

// 切換暫停狀態
function togglePause() {
    if (!isGameStarted || isGameOver) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "繼續" : "暫停";
}

// 事件監聽器
startBtn.addEventListener("click", function() {
    if (!isGameStarted) {
        isGameStarted = true;
        startBtn.textContent = "重新開始";
        initGame();
        gameLoop = setInterval(updateGame, gameSpeed);
    } else {
        clearInterval(gameLoop);
        gameSpeed = 150;
        initGame();
        gameLoop = setInterval(updateGame, gameSpeed);
    }
});

pauseBtn.addEventListener("click", togglePause);

restartBtn.addEventListener("click", function() {
    clearInterval(gameLoop);
    gameSpeed = 150;
    initGame();
    gameLoop = setInterval(updateGame, gameSpeed);
});

// 初始化顯示
checkTouchDevice();
highScoreDisplay.textContent = highScore;
initGame();