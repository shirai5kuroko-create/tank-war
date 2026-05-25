const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
let gameState = {
    running: false,
    paused: false,
    score: 0,
    health: 3
};

// 玩家坦克
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    angle: 0,
    vx: 0,
    vy: 0
};

// 敌人坦克数组
let enemies = [];
let bullets = [];
let enemyBullets = [];

// 键盘状态
const keys = {};

// 事件监听
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        shootBullet();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);

// 开始游戏
function startGame() {
    if (!gameState.running) {
        gameState.running = true;
        gameState.paused = false;
        gameState.score = 0;
        gameState.health = 3;
        enemies = [];
        bullets = [];
        enemyBullets = [];
        player.x = canvas.width / 2;
        player.y = canvas.height - 60;
        document.getElementById('startBtn').textContent = '重新开始';
        update();
    }
}

// 暂停游戏
function togglePause() {
    if (gameState.running) {
        gameState.paused = !gameState.paused;
        document.getElementById('pauseBtn').textContent = gameState.paused ? '继续' : '暂停';
        if (!gameState.paused) {
            update();
        }
    }
}

// 移动玩家坦克
function movePlayer() {
    if (keys['ArrowUp'] || keys['w']) {
        player.vy = -player.speed;
        player.angle = 0;
    } else if (keys['ArrowDown'] || keys['s']) {
        player.vy = player.speed;
        player.angle = Math.PI;
    } else {
        player.vy = 0;
    }

    if (keys['ArrowLeft'] || keys['a']) {
        player.vx = -player.speed;
        player.angle = Math.PI / 2;
    } else if (keys['ArrowRight'] || keys['d']) {
        player.vx = player.speed;
        player.angle = -Math.PI / 2;
    } else {
        player.vx = 0;
    }

    player.x += player.vx;
    player.y += player.vy;

    // 边界检测
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// 射击
function shootBullet() {
    if (gameState.running) {
        const bullet = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            vx: Math.cos(player.angle) * 7,
            vy: Math.sin(player.angle) * 7,
            radius: 3,
            life: 200
        };
        bullets.push(bullet);
    }
}

// 生成敌人
function spawnEnemy() {
    const side = Math.random() > 0.5 ? 0 : 1;
    const enemy = {
        x: side === 0 ? Math.random() * canvas.width : (Math.random() > 0.5 ? 0 : canvas.width - 40),
        y: Math.random() * (canvas.height * 0.6),
        width: 40,
        height: 40,
        speed: 2 + Math.random() * 1.5,
        angle: Math.random() * Math.PI * 2,
        health: 1,
        shootCounter: 0
    };
    enemies.push(enemy);
}

// 更新敌人
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // 移动
        enemy.x += Math.cos(enemy.angle) * enemy.speed;
        enemy.y += Math.sin(enemy.angle) * enemy.speed;

        // 边界反弹
        if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
            enemy.angle = Math.PI - enemy.angle;
        }
        if (enemy.y < 0 || enemy.y + enemy.height > canvas.height * 0.7) {
            enemy.angle = -enemy.angle;
        }

        // 随机改变方向
        if (Math.random() < 0.01) {
            enemy.angle = Math.random() * Math.PI * 2;
        }

        // 射击
        enemy.shootCounter++;
        if (enemy.shootCounter > 60 + Math.random() * 40) {
            const bulletX = enemy.x + enemy.width / 2;
            const bulletY = enemy.y + enemy.height / 2;
            const dx = player.x - bulletX;
            const dy = player.y - bulletY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            enemyBullets.push({
                x: bulletX,
                y: bulletY,
                vx: normalizedDx * 5,
                vy: normalizedDy * 5,
                radius: 3
            });
            enemy.shootCounter = 0;
        }
    });
}

// 更新子弹
function updateBullets() {
    // 玩家子弹
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        // 碰撞检测
        enemies.forEach((enemy, index) => {
            const dx = bullet.x - (enemy.x + enemy.width / 2);
            const dy = bullet.y - (enemy.y + enemy.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bullet.radius + enemy.width / 2) {
                enemy.health--;
                if (enemy.health <= 0) {
                    enemies.splice(index, 1);
                    gameState.score += 10;
                    document.getElementById('score').textContent = gameState.score;
                }
                return false;
            }
        });

        return bullet.life > 0 && bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height;
    });

    // 敌人子弹
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // 碰撞检测
        const dx = bullet.x - (player.x + player.width / 2);
        const dy = bullet.y - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bullet.radius + player.width / 2) {
            gameState.health--;
            document.getElementById('health').textContent = gameState.health;
            if (gameState.health <= 0) {
                endGame();
            }
            return false;
        }

        return bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height;
    });
}

// 绘制玩家坦克
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);

    // 坦克身体
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // 坦克炮塔
    ctx.fillStyle = '#00AA00';
    ctx.fillRect(-5, -player.height / 2 - 15, 10, 15);

    ctx.restore();
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        ctx.rotate(enemy.angle);

        // 敌人身体
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

        // 炮塔
        ctx.fillStyle = '#CC3333';
        ctx.fillRect(-5, -enemy.height / 2 - 15, 10, 15);

        ctx.restore();
    });
}

// 绘制子弹
function drawBullets() {
    // 玩家子弹
    ctx.fillStyle = '#FFFF00';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // 敌人子弹
    ctx.fillStyle = '#FF6666';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 结束游戏
function endGame() {
    gameState.running = false;
    gameState.paused = false;
    document.getElementById('pauseBtn').textContent = '暂停';
}

// 主游戏循环
function update() {
    if (!gameState.running || gameState.paused) return;

    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新游戏状态
    movePlayer();
    updateEnemies();
    updateBullets();

    // 生成敌人
    if (enemies.length < 5 + Math.floor(gameState.score / 50)) {
        if (Math.random() < 0.02) {
            spawnEnemy();
        }
    }

    // 绘制所有元素
    drawPlayer();
    drawEnemies();
    drawBullets();

    requestAnimationFrame(update);
}