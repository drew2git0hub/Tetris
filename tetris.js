// JavaScript: 게임 로직
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
// 20배 확대 (1픽셀을 20x20 블록으로 취급)
context.scale(20, 20);
// 테트로미노 모양 정의 (각 숫자는 색상과 모양을 의미)
const pieces = 'ILJOTSZ';
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];
// 7가지 블록 구조 생성 함수
function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}
// 게임 판(Arena) 생성 (w: 너비, h: 높이)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}
// 충돌 감지 로직
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            // 1. 블록 데이터가 0이 아니고 (실제 블록 부분)
            // 2. 게임 판(arena) 바깥이거나 이미 채워진(0이 아닌) 칸이라면 충돌
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}
// 화면 그리기
function draw() {
    // 검은 배경으로 초기화
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0}); // 고정된 블록 그리기
    drawMatrix(player.matrix, player.pos); // 움직이는 플레이어 그리기
}
// 행렬(블록) 그리기 함수
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
             if (value !== 0) {
                context.fillStyle = colors[value];
                // 1px보다 약간 작게 그려서 격자 느낌 냄
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                // 블록 입체감 (선택 사항)
                context.lineWidth = 0.05;
                context.strokeStyle = 'white';
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}
// 블록 합치기 (플레이어 블록 -> 아레나에 고정)
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}
// 행렬 회전
function rotate(matrix, dir) {
    // 전치 행렬 (Transpose)
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    // 좌우 반전
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}
// 플레이어 떨구기
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--; // 충돌 시 한 칸 위로 복구
        merge(arena, player); // 바닥에 고정
        playerReset(); // 새 블록 생성
        arenaSweep(); // 줄 삭제 확인
        updateScore();
    }
    dropCounter = 0;
}
// 플레이어 이동
function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}
// 플레이어 초기화 및 게임 오버 체크
function playerReset() {
    const piecesStr = 'ILJOTSZ';
    player.matrix = createPiece(piecesStr[piecesStr.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    // 생성하자마자 충돌하면 게임 오버
    if (collide(arena, player)) {
        gameOver();
    }
}
// 플레이어 회전
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    // 회전 시 벽을 뚫는 버그 방지 (벽 차기)
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}
// 줄 삭제 (Arena Sweep)
function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // 0이 하나라도 있으면 꽉 찬 게 아님
            }
        }
        // 꽉 찬 줄을 제거하고(splice), 맨 위에 빈 줄 추가(unshift)
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += 10;
    }
}
// 게임 루프 변수
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = true; // 게임 상태 플래그
function update(time = 0) {
    if (isPaused) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}
function updateScore() {
    document.getElementById('score').innerText = player.score;
}
// 게임 상태 관리
const arena = createMatrix(12, 20); // 12x20 게임판
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};
// 키보드 컨트롤
document.addEventListener('keydown', event => {
    if (isPaused) return;
    const key = (event.key || '').toString().toLowerCase();
    if (event.code === 'ArrowLeft' || key === 'a') { // Left
        playerMove(-1);
    } else if (event.code === 'ArrowRight' || key === 'd') { // Right
        playerMove(1);
    } else if (event.code === 'ArrowDown' || key === 's') { // Down
        playerDrop();
    } else if (key === 'q') { // Q (반시계)
        playerRotate(-1);
    } else if (key === 'w' || event.code === 'ArrowUp') { // W or Up (시계)
        playerRotate(1);
    }
});
// UI 함수들
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    // 게임 초기화
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    playerReset();
    isPaused = false;
    update();
}
function gameOver() {
    isPaused = true;
    document.getElementById('final-score').innerText = player.score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}
function resetGame() {
    // 돌아가기 버튼 누르면 다시 시작 화면으로
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}