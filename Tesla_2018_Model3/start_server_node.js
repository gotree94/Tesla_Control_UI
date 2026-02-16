const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3030;
const HOST = '0.0.0.0'; // 모든 IP에서 접근 가능하도록 변경

// MIME 타입 매핑
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // URL 디코딩 및 경로 정리
    let filePath = '.' + decodeURIComponent(req.url);
    if (filePath === './') {
        filePath = './tesla_viewer.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - 파일을 찾을 수 없습니다</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`서버 에러: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // 네트워크 IP 찾기
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIP = net.address;
                break;
            }
        }
    }
    
    console.log('='.repeat(60));
    console.log('🚗 Tesla Model 3 Viewer 서버 시작!');
    console.log('='.repeat(60));
    console.log(`📍 로컬 접속: http://localhost:${PORT}/tesla_viewer.html`);
    console.log(`📍 네트워크 접속: http://${localIP}:${PORT}/tesla_viewer.html`);
    console.log(`⏰ 시작 시간: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    console.log('종료하려면 Ctrl+C 를 누르세요\n');

    // 자동으로 브라우저 열기
    const url = `http://localhost:${PORT}/tesla_viewer.html`;
    const start = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${start} ${url}`, (err) => {
        if (err) {
            console.log('브라우저를 자동으로 열 수 없습니다.');
            console.log(`수동으로 접속하세요: ${url}`);
        } else {
            console.log('✅ 브라우저가 자동으로 열렸습니다!\n');
        }
    });
});

// 에러 처리
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 포트 ${PORT}가 이미 사용중입니다.`);
        console.error('다른 서버를 종료하거나 포트를 변경하세요.');
    } else {
        console.error('서버 에러:', err);
    }
    process.exit(1);
});

// Ctrl+C 처리
process.on('SIGINT', () => {
    console.log('\n\n서버를 종료합니다...');
    server.close(() => {
        console.log('✅ 서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    });
});
