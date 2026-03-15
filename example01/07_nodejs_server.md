# 07. Node.js 웹 서버 구성

← [06. GLB 구조 검증](./06_analyze_glb.md) | 다음 → [08. Three.js 뷰어](./08_threejs_viewer.md)

---

## 7.1 왜 로컬 서버가 필요한가?

GLB 파일을 Three.js로 로드할 때 브라우저는 **CORS(Cross-Origin Resource Sharing)** 정책을 적용합니다.  
`file://` 프로토콜로 HTML을 직접 열면 GLB 파일 로드가 차단됩니다.

```
❌ 실패하는 방법:
   index.html을 더블클릭 → file:///C:/sg90/public/index.html
   → GLB 로드 시 CORS 오류 발생

✅ 올바른 방법:
   node server.js 실행
   → http://localhost:3030 접속
   → 동일 출처(same-origin)이므로 GLB 로드 성공
```

---

## 7.2 server.js 완성 코드

```javascript
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
```

---

## 7.3 서버 구조 설명

### 요청 처리 흐름

```
브라우저 요청
  GET /index.html
  GET /sg90_servo.glb
  GET /analyze_glb.html
       │
       ▼
server.js 수신
       │
       ├─ URL 디코딩 (한글, 공백 등 처리)
       ├─ 쿼리스트링 제거 (?v=123 등)
       ├─ 루트(/) → /index.html 리다이렉트
       ├─ 보안: public/ 폴더 밖 접근 차단
       ├─ 확장자 → MIME 타입 결정
       └─ public/ 폴더에서 파일 읽기 → 응답
```

### GLB 파일이 정상 서빙되는지 확인

```bash
# 터미널에서 서버 로그 확인
node server.js

# 브라우저에서 GLB 직접 요청
curl -I http://localhost:3030/sg90_servo.glb

# 기대 응답:
# HTTP/1.1 200 OK
# Content-Type: model/gltf-binary   ← 이 MIME이 중요!
# Access-Control-Allow-Origin: *
```

---

## 7.4 포트 충돌 해결

```bash
# 포트 3030 사용 중인 프로세스 확인
# Windows:
netstat -ano | findstr :3030
taskkill /PID <PID> /F

# Linux / macOS:
lsof -i :3030
kill -9 <PID>

# 또는 server.js에서 포트 변경
const PORT = 3031;  # 다른 포트 번호로
```

---

## 7.5 Raspberry Pi에서 실행 (네트워크 접속)

SG90 실물 제어와 연동할 때 Raspberry Pi를 서버로 사용하는 경우:

```bash
# Pi에서 서버 실행
node server.js

# Pi의 IP 확인
hostname -I
# → 192.168.1.xxx

# PC 브라우저에서 Pi 서버 접속
# http://192.168.1.xxx:3030
```

---

## 7.6 기존 start_server_node.js와의 차이점

| 항목 | 기존 (Tesla용) | 새 server.js (SG90용) |
|------|--------------|----------------------|
| 기본 파일 | `tesla_viewer.html` | `index.html` |
| 정적 파일 루트 | 실행 디렉토리 | `public/` 폴더 분리 |
| 보안 | 없음 | 디렉토리 트래버설 방지 |
| 로그 | 기본 | 파일 크기, MIME 포함 |
| 브라우저 자동 열기 | 있음 | 제거 (선택적 추가 가능) |

---

← [06. GLB 구조 검증](./06_analyze_glb.md) | 다음 → [08. Three.js 뷰어](./08_threejs_viewer.md)
