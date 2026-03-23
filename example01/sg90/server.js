// server.js
// Node.js 내장 모듈만 사용 — npm install 불필요
const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT    = 3030;
const HOST    = '0.0.0.0';          // 모든 네트워크 인터페이스 (LAN에서도 접속 가능)
const PUBLIC  = path.join(__dirname, 'public');  // 정적 파일 루트

// ─────────────────────────────────────
// MIME 타입 매핑
// ─────────────────────────────────────
const MIME = {
    '.html' : 'text/html; charset=utf-8',
    '.js'   : 'text/javascript',
    '.mjs'  : 'text/javascript',
    '.css'  : 'text/css',
    '.json' : 'application/json',
    '.png'  : 'image/png',
    '.jpg'  : 'image/jpeg',
    '.jpeg' : 'image/jpeg',
    '.gif'  : 'image/gif',
    '.svg'  : 'image/svg+xml',
    '.ico'  : 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff' : 'font/woff',
    '.ttf'  : 'font/ttf',
    '.wasm' : 'application/wasm',
    '.glb'  : 'model/gltf-binary',   // GLB 전용 MIME
    '.gltf' : 'model/gltf+json',     // GLTF JSON 버전
    '.bin'  : 'application/octet-stream',
};

// ─────────────────────────────────────
// HTTP 서버 생성
// ─────────────────────────────────────
const server = http.createServer((req, res) => {
    const ts = new Date().toLocaleTimeString('ko-KR');
    console.log(`[${ts}] ${req.method} ${req.url}`);

    // ── 경로 파싱 ──
    let urlPath = decodeURIComponent(req.url.split('?')[0]);  // 쿼리스트링 제거
    if (urlPath === '/') urlPath = '/index.html';             // 루트 → index.html

    // ── 보안: 디렉토리 트래버설 방지 ──
    const absPath = path.resolve(path.join(PUBLIC, urlPath));
    if (!absPath.startsWith(path.resolve(PUBLIC))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    // ── MIME 타입 결정 ──
    const ext         = path.extname(absPath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    // ── 파일 읽기 및 응답 ──
    fs.readFile(absPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<h2>404 Not Found</h2><code>${urlPath}</code>`);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
            console.error(`  ❌ ${err.code}: ${absPath}`);
            return;
        }

        res.writeHead(200, {
            'Content-Type'                : contentType,
            'Access-Control-Allow-Origin' : '*',        // CORS 허용
            'Cache-Control'               : 'no-cache', // 개발 중 캐시 비활성화
        });
        res.end(data);
        console.log(`  ✅ 200 ${contentType} (${(data.length / 1024).toFixed(1)}KB)`);
    });
});

// ─────────────────────────────────────
// 서버 시작
// ─────────────────────────────────────
server.listen(PORT, HOST, () => {
    // 로컬 IP 탐색
    let localIP = 'localhost';
    for (const ifaces of Object.values(os.networkInterfaces())) {
        for (const iface of ifaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
    }

    console.log('\n' + '='.repeat(55));
    console.log('🦾  SG90 Servo Viewer  서버 시작!');
    console.log('='.repeat(55));
    console.log(`📍 로컬    : http://localhost:${PORT}`);
    console.log(`📍 네트워크: http://${localIP}:${PORT}`);
    console.log(`📂 루트    : ${PUBLIC}`);
    console.log(`⏰ 시작    : ${new Date().toLocaleString('ko-KR')}`);
    console.log('='.repeat(55));
    console.log('종료: Ctrl + C\n');
});

// ─────────────────────────────────────
// 에러 처리
// ─────────────────────────────────────
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 포트 ${PORT} 이미 사용 중`);
        console.error(`   다른 터미널에서 실행 중인 서버를 종료하거나`);
        console.error(`   PORT 변수를 다른 번호로 변경하세요.\n`);
    } else {
        console.error('서버 오류:', err.message);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n서버 종료 중...');
    server.close(() => {
        console.log('✅ 정상 종료');
        process.exit(0);
    });
});