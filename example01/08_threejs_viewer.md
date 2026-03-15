# 08. Three.js 3D 뷰어 구성

← [07. Node.js 서버](./07_nodejs_server.md) | 다음 → [09. 서보 제어 로직](./09_servo_control.md)

---

## 8.1 Three.js 개요

**Three.js**는 WebGL 기반 3D 렌더링 라이브러리입니다.  
CDN으로 설치 없이 사용 가능하며, GLB 파일을 브라우저에서 직접 렌더링합니다.

```
사용 버전 : r159 (CDN)
주요 모듈 :
  - WebGLRenderer   : 3D 장면을 Canvas에 렌더링
  - Scene           : 3D 오브젝트 컨테이너
  - PerspectiveCamera : 원근 카메라
  - GLTFLoader      : GLB/GLTF 파일 로더
  - OrbitControls   : 마우스로 카메라 조작
```

---

## 8.2 Import Map 방식 (CDN)

```html
<!-- HTML <head>에 추가 — npm 설치 불필요 -->
<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/"
    }
}
</script>

<!-- 사용 -->
<script type="module">
import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>
```

---

## 8.3 Three.js 3D 씬 구성 요소

```
┌──────────────────────────────────────────┐
│  Scene (3D 공간)                         │
│  ├─ Camera (PerspectiveCamera)           │
│  │   └─ 위치: (0, 60, 120)              │
│  │   └─ FOV: 45°                        │
│  │                                       │
│  ├─ Lights (조명)                        │
│  │   ├─ AmbientLight     (환경광)        │
│  │   ├─ DirectionalLight (태양광+그림자) │
│  │   └─ PointLight       (보조광)        │
│  │                                       │
│  ├─ GridHelper (바닥 그리드)             │
│  │                                       │
│  └─ GLB Model (sg90_servo.glb)          │
│      ├─ sg90_body  (고정)               │
│      ├─ sg90_horn  (회전 제어 대상)      │
│      └─ sg90_screw …                    │
│                                          │
│  WebGLRenderer → <canvas> 출력          │
│  OrbitControls → 마우스 카메라 조작      │
└──────────────────────────────────────────┘
```

---

## 8.4 public/index.html 전체 코드

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦾 SG90 Servo 3D Viewer</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }

        body {
            font-family: 'Segoe UI', sans-serif;
            background: #1a1a2e;
            color: #e0e0e0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* ── 3D 뷰어 영역 ── */
        #viewer { flex:1; position:relative; }
        #canvas  { width:100%; height:100%; display:block; }

        /* ── 로딩 오버레이 ── */
        #loading {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: rgba(26,26,46,0.92);
            gap: 16px; font-size: 1rem;
        }
        .spinner {
            width: 48px; height: 48px;
            border: 4px solid #333;
            border-top-color: #4fc3f7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── 제어 패널 ── */
        #panel {
            width: 280px;
            background: #16213e;
            border-left: 1px solid #0f3460;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
        }
        #panel h2 { font-size:1rem; color:#4fc3f7; border-bottom:1px solid #0f3460; padding-bottom:8px; }

        .ctrl-group label { display:block; font-size:0.8rem; color:#90caf9; margin-bottom:6px; }

        #angle-display {
            text-align: center; font-size: 2.4rem;
            font-weight: bold; color: #4fc3f7;
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.05em;
        }

        input[type=range] { width:100%; accent-color:#4fc3f7; cursor:pointer; }

        .preset-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .preset-btn {
            padding: 8px 4px;
            background: #0f3460; border: 1px solid #1a5276;
            border-radius: 6px; color: #e0e0e0;
            font-size: 0.8rem; cursor: pointer;
            transition: all 0.15s;
        }
        .preset-btn:hover, .preset-btn.active {
            background: #4fc3f7; color: #1a1a2e; border-color: #4fc3f7;
        }

        select {
            width:100%; padding:6px 8px;
            background:#0f3460; border:1px solid #1a5276;
            border-radius:6px; color:#e0e0e0; font-size:0.85rem;
        }

        #status { font-size:0.75rem; color:#78909c; text-align:center; min-height:1.2em; }
        #status.moving { color:#ffb74d; }
        #status.done   { color:#81c784; }
        #status.error  { color:#ef5350; }

        .info-box {
            background: #0d1b2a; border-radius:8px;
            padding: 12px; font-size:0.78rem;
            line-height: 1.9; color: #90a4ae;
        }
        .info-box strong { color:#4fc3f7; display:block; margin-bottom:4px; }
    </style>
</head>
<body>

<div id="viewer">
    <canvas id="canvas"></canvas>
    <div id="loading">
        <div class="spinner"></div>
        <span id="load-msg">sg90_servo.glb 로딩 중...</span>
    </div>
</div>

<div id="panel">
    <h2>🦾 SG90 서보 제어</h2>

    <div class="ctrl-group">
        <label>현재 각도</label>
        <div id="angle-display">90°</div>
    </div>

    <div class="ctrl-group">
        <label>각도 조절 (0° ~ 180°)</label>
        <input type="range" id="slider" min="0" max="180" value="90" step="1">
    </div>

    <div class="ctrl-group">
        <label>빠른 선택</label>
        <div class="preset-grid">
            <button class="preset-btn" data-angle="0">0°</button>
            <button class="preset-btn" data-angle="45">45°</button>
            <button class="preset-btn active" data-angle="90">90°</button>
            <button class="preset-btn" data-angle="135">135°</button>
            <button class="preset-btn" data-angle="180">180°</button>
            <button class="preset-btn" data-angle="-1" id="sweep-btn">스윕</button>
        </div>
    </div>

    <div class="ctrl-group">
        <label>회전 속도</label>
        <select id="speed">
            <option value="0.02">느림 (교육용)</option>
            <option value="0.05" selected>보통</option>
            <option value="0.15">빠름</option>
            <option value="1">즉시</option>
        </select>
    </div>

    <div id="status">준비 완료</div>

    <div class="info-box">
        <strong>SG90 스펙</strong>
        전압: 4.8V ~ 6.0V<br>
        토크: 1.8 kgf·cm @ 4.8V<br>
        속도: 0.1sec / 60°<br>
        각도: 0° ~ 180°<br>
        PWM: 500μs ~ 2400μs<br>
        크기: 22 × 11.8 × 31 mm
    </div>

    <div class="info-box">
        <strong>3D 뷰어 조작</strong>
        🖱 드래그: 회전<br>
        🖱 우클릭 드래그: 이동<br>
        🖱 스크롤: 확대/축소<br>
        🖱 더블클릭: 카메라 초기화
    </div>
</div>

<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/"
    }
}
</script>

<script type="module">
import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ══════════════════════════════════════
// DOM 참조
// ══════════════════════════════════════
const canvas    = document.getElementById('canvas');
const loading   = document.getElementById('loading');
const loadMsg   = document.getElementById('load-msg');
const angleDisp = document.getElementById('angle-display');
const slider    = document.getElementById('slider');
const speedSel  = document.getElementById('speed');
const statusEl  = document.getElementById('status');
const sweepBtn  = document.getElementById('sweep-btn');

// ══════════════════════════════════════
// 1. Renderer 설정
// ══════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;

// ══════════════════════════════════════
// 2. Scene
// ══════════════════════════════════════
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog        = new THREE.Fog(0x1a1a2e, 300, 600);  // 원거리 안개

// ══════════════════════════════════════
// 3. Camera
// ══════════════════════════════════════
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 60, 120);

// ══════════════════════════════════════
// 4. OrbitControls
// ══════════════════════════════════════
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance   = 20;
controls.maxDistance   = 300;
controls.target.set(0, 15, 0);

// 더블클릭 → 카메라 초기화
renderer.domElement.addEventListener('dblclick', resetCamera);
function resetCamera() {
    camera.position.set(0, 60, 120);
    controls.target.set(0, 15, 0);
    controls.update();
}

// ══════════════════════════════════════
// 5. 조명
// ══════════════════════════════════════
// 환경광
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// 메인 디렉셔널 라이트 (그림자 포함)
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(60, 100, 60);
sun.castShadow = true;
Object.assign(sun.shadow.mapSize, { width:2048, height:2048 });
Object.assign(sun.shadow.camera, { near:1, far:300, left:-80, right:80, top:80, bottom:-80 });
scene.add(sun);

// 보조 포인트 라이트 (파란빛 — 그림자 없음)
const fill = new THREE.PointLight(0x4fc3f7, 0.6, 250);
fill.position.set(-60, 40, -50);
scene.add(fill);

// 바닥 그리드
const grid = new THREE.GridHelper(200, 20, 0x0f3460, 0x0f3460);
grid.position.y = -2;
scene.add(grid);

// ══════════════════════════════════════
// 6. GLB 모델 로드
// ══════════════════════════════════════
let hornMesh     = null;
let targetAngle  = 90;
let currentAngle = 90;
let sweeping     = false;
let sweepDir     = 1;

new GLTFLoader().load(
    'sg90_servo.glb',

    (gltf) => {
        const model = gltf.scene;

        // 크기 자동 정규화 (50mm 기준)
        const box    = new THREE.Box3().setFromObject(model);
        const maxDim = box.getSize(new THREE.Vector3()).length();
        model.scale.setScalar(50 / maxDim);

        // 바닥에 붙이기
        box.setFromObject(model);
        model.position.y = -box.min.y;

        // 그림자 설정
        model.traverse(c => {
            if (c.isMesh) {
                c.castShadow    = true;
                c.receiveShadow = true;
            }
        });

        scene.add(model);

        // 혼 파트 탐색
        hornMesh = model.getObjectByName('sg90_horn');

        if (hornMesh) {
            setStatus('✅ 모델 로드 완료 — 혼 제어 준비', 'done');
            console.log('sg90_horn 탐색 성공:', hornMesh);
        } else {
            setStatus('⚠️ sg90_horn 없음 — analyze_glb.html로 이름 확인', 'error');
            console.warn('발견된 메시:', []);
            model.traverse(c => { if (c.isMesh) console.warn(' -', c.name); });
        }

        loading.style.display = 'none';
        applyRotation(90);
    },

    (xhr) => {
        const pct = xhr.total ? Math.round(xhr.loaded / xhr.total * 100) : '...';
        loadMsg.textContent = `sg90_servo.glb 로딩 중... ${pct}%`;
    },

    (err) => {
        loadMsg.textContent = '❌ GLB 로드 실패 — 파일 경로 확인 (public/sg90_servo.glb)';
        console.error(err);
    }
);

// ══════════════════════════════════════
// 7. 각도 제어 함수
// ══════════════════════════════════════

// 각도(도) → Three.js Y축 회전(라디안)
// 90° 중립 기준, -90° ~ +90° 범위
function degToRad(deg) {
    return THREE.MathUtils.degToRad(deg - 90);
}

function applyRotation(deg) {
    if (!hornMesh) return;
    hornMesh.rotation.y = degToRad(deg);
}

function setTargetAngle(deg) {
    sweeping = false;
    sweepBtn.textContent = '스윕';
    targetAngle = Math.max(0, Math.min(180, deg));
    slider.value = targetAngle;
    updateUI(targetAngle);
}

function updateUI(deg) {
    const rounded = Math.round(deg);
    angleDisp.textContent = `${rounded}°`;
    slider.value = rounded;
    document.querySelectorAll('.preset-btn[data-angle]').forEach(btn => {
        const a = parseInt(btn.dataset.angle);
        btn.classList.toggle('active', a === rounded);
    });
}

function setStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className   = cls || '';
}

// ══════════════════════════════════════
// 8. UI 이벤트
// ══════════════════════════════════════
slider.addEventListener('input', () => setTargetAngle(parseInt(slider.value)));

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const a = parseInt(btn.dataset.angle);
        if (a === -1) {
            sweeping = !sweeping;
            sweepBtn.textContent = sweeping ? '⏹ 정지' : '스윕';
            setStatus(sweeping ? '스윕 동작 중...' : '정지', sweeping ? 'moving' : '');
        } else {
            setTargetAngle(a);
            setStatus(`목표: ${a}°`, 'moving');
        }
    });
});

// ══════════════════════════════════════
// 9. 애니메이션 루프
// ══════════════════════════════════════
function animate() {
    requestAnimationFrame(animate);

    const speed = parseFloat(speedSel.value);

    // 스윕 모드
    if (sweeping) {
        targetAngle += sweepDir * 1.2;
        if (targetAngle >= 180) { targetAngle = 180; sweepDir = -1; }
        if (targetAngle <=   0) { targetAngle =   0; sweepDir =  1; }
        updateUI(targetAngle);
    }

    // 보간 (Lerp)
    const diff = targetAngle - currentAngle;
    if (Math.abs(diff) > 0.05) {
        currentAngle += diff * Math.min(speed, 1);
        applyRotation(currentAngle);
        if (!sweeping) setStatus(`이동 중: ${Math.round(currentAngle)}°`, 'moving');
    } else if (!sweeping && statusEl.classList.contains('moving')) {
        currentAngle = targetAngle;
        applyRotation(currentAngle);
        setStatus(`완료: ${Math.round(currentAngle)}°`, 'done');
    }

    controls.update();
    renderer.render(scene, camera);
}

// ══════════════════════════════════════
// 10. 리사이즈 대응
// ══════════════════════════════════════
function onResize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

animate();
</script>
</body>
</html>
```

---

## 8.5 Three.js 핵심 개념 정리

### WebGLRenderer

```javascript
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;          // 그림자 활성화
renderer.outputColorSpace = THREE.SRGBColorSpace;  // 색공간 보정
```

### GLTFLoader 로드 콜백 3가지

```javascript
loader.load(
    'sg90_servo.glb',    // URL
    (gltf) => { … },    // ① onLoad  — 성공 시
    (xhr)  => { … },    // ② onProgress — 진행률
    (err)  => { … }     // ③ onError — 실패 시
);
```

### OrbitControls 핵심 설정

```javascript
controls.enableDamping = true;   // 관성 효과 (부드러운 회전)
controls.dampingFactor = 0.08;   // 감쇠 계수 (작을수록 부드러움)
controls.target.set(0, 15, 0);  // 회전 중심점 (모델 중앙)
// ※ animate() 루프에서 controls.update() 반드시 호출
```

---

← [07. Node.js 서버](./07_nodejs_server.md) | 다음 → [09. 서보 제어 로직](./09_servo_control.md)
