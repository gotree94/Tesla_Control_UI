# 🦾 SG90 Micro Servo — SolidWorks → GLB → Node.js 3D 인터랙티브 제어

> SolidWorks로 설계된 SG90 서보모터 어셈블리를 GLB 포맷으로 변환하고,  
> Node.js 웹 서버 + Three.js로 브라우저에서 3D 인터랙티브 제어하는 교육용 프로젝트

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 대상 모델 | Tower Pro SG90 Micro Servo 9g |
| 원본 포맷 | SolidWorks 2018 어셈블리 (STEP AP214) |
| 변환 도구 | FreeCAD 1.0.2 또는 CAD Assistant |
| 3D 렌더링 | Three.js r159 (GLB / glTF 2.0) |
| 웹 서버 | Node.js 18 LTS (순수 `http` 모듈, npm install 불필요) |
| 제어 UI | 슬라이더 · 프리셋 버튼 · 스윕 모드 · 속도 조절 |

---

## 🗂️ 프로젝트 폴더 구조

```
sg90-servo-viewer/
├── server.js              ← Node.js 웹 서버
├── package.json
└── public/
    ├── index.html         ← Three.js 3D 뷰어
    ├── analyze_glb.html   ← GLB 구조 분석 도구
    └── sg90_servo.glb     ← 변환된 3D 모델
```

---

## ⚡ 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/your-id/sg90-servo-viewer.git
cd sg90-servo-viewer

# 2. 서버 실행 (npm install 불필요)
node server.js

# 3. 브라우저 접속
# http://localhost:3030
```

---

## 🔄 전체 작업 흐름

```
SolidWorks 2018
    └─ SG90 어셈블리 (STEP AP214)
            │
            ▼  FreeCAD 또는 CAD Assistant로 변환
    sg90_servo.glb
            │
            ▼  Blender 3.6 (방향/이름 보정 후 재내보내기)
    sg90_servo.glb  ← Three.js 적합 버전
            │
            ▼  Node.js 서버 + 브라우저
    Three.js 3D 뷰어
     ├─ GLTFLoader → 모델 로드 + Z-up 보정
     ├─ OrbitControls → 카메라 제어
     └─ 슬라이더 → 혼(Horn) rotation.y 제어
```

---

## 📋 GLB 파일 구조 (STEP 변환 결과)

| 노드 | 메시 이름 | 역할 |
|------|----------|------|
| NAUO1 | 1_Pea… | 서보 본체 하우징 |
| NAUO2 | 2_Pea… | 혼 / 출력축 ← **회전 제어 대상** |
| NAUO3 | 3_Pea… | 하단 캡 또는 기어 케이스 |
| NAUO4 | 4_Pea… | 상단 커버 |
| NAUO5~6 | M2×8 나사 | ISO 7045 십자 나사 |
| NAUO7 | M2×4 나사 | ISO 7045 십자 나사 |

> Blender에서 파트 이름을 `sg90_horn` 등으로 직접 설정 후 재내보내면  
> `getObjectByName('sg90_horn')`으로 정확히 탐색 가능합니다.

---

## 🖥️ server.js 구조 설명

```javascript
const PORT   = 3030;
const HOST   = '0.0.0.0';                        // LAN 접속 허용
const PUBLIC = path.join(__dirname, 'public');    // 정적 파일 루트
```

### 주요 특징

- Node.js 내장 모듈(`http`, `fs`, `path`, `os`)만 사용 — **npm install 불필요**
- GLB 전용 MIME 타입 등록 (`model/gltf-binary`)
- 디렉토리 트래버설 보안 방지
- 개발용 캐시 비활성화 (`Cache-Control: no-cache`)
- LAN IP 자동 탐색 및 콘솔 출력

### MIME 타입 매핑 (핵심 항목)

```javascript
const MIME = {
    '.html' : 'text/html; charset=utf-8',
    '.js'   : 'text/javascript',
    '.glb'  : 'model/gltf-binary',    // GLB 필수
    '.gltf' : 'model/gltf+json',
};
```

> `.glb` MIME이 누락되면 Three.js GLTFLoader가 파일을 인식하지 못합니다.

---

## 🎮 index.html — Three.js 뷰어 구조

### Scene 설정

```javascript
scene.background = new THREE.Color(0x1a1a2e);   // 짙은 네이비 배경
scene.fog        = new THREE.Fog(0x1a1a2e, 300, 600);
// 카메라에서 300~600 unit 구간에서 배경색으로 자연스럽게 페이드
// 안개를 없애려면 이 줄을 삭제
```

### Camera 설정

```javascript
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
//                                         ↑FOV       ↑near ↑far
camera.position.set(0, 60, 120);
// X=0   : 좌우 중앙
// Y=60  : 모델보다 약간 위 (내려다보는 시점)
// Z=120 : 앞쪽 120 unit 거리
```

| FOV | 효과 |
|-----|------|
| 20° | 망원렌즈 — 물체가 납작하게 보임 |
| 45° | 자연스러운 원근감 (현재값, 권장) |
| 75° | 광각렌즈 — 넓게 보이지만 왜곡 |

### OrbitControls 설정

```javascript
controls.enableDamping = true;     // 마우스를 놓으면 서서히 멈춤 (관성)
controls.dampingFactor = 0.08;     // 감쇠 강도 (0.01=미끄럽게, 0.5=빠르게 멈춤)
controls.minDistance   = 20;       // 최소 줌 거리 (모델 안으로 들어가기 방지)
controls.maxDistance   = 300;      // 최대 줌 거리
controls.target.set(0, 15, 0);    // 회전 중심점 (모델 중하단)
```

> `enableDamping = true` 사용 시 `animate()` 루프 안에서 반드시 `controls.update()` 호출 필요

### 조명 설정

```javascript
// 1. 환경광 — 전체 기본 밝기 (방향 없음, 그림자 없음)
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
// 강도 0.0=완전 어두움 / 0.5=적당 / 1.0=입체감 소실

// 2. 방향광 — 태양광 역할 (그림자 생성)
const sun = new THREE.DirectionalLight(0xffffff, 100);
sun.position.set(60, 100, 60);
// 우측 상단 대각선 방향 → 자연스러운 그림자
// set(0, 100, 0)  → 정수리에서 수직으로 내리쬠 (납작한 그림자)
// set(-60, 30, 0) → 좌측 낮은 각도 (긴 그림자, 석양 느낌)

sun.castShadow = true;
Object.assign(sun.shadow.mapSize, { width:2048, height:2048 });
// 그림자 해상도: 512=저화질/512=모바일, 2048=선명/PC 권장, 4096=고사양

Object.assign(sun.shadow.camera, { near:1, far:300, left:-80, right:80, top:80, bottom:-80 });
// 그림자 계산 범위 — far가 너무 작으면 그림자가 잘림
// 모델 크기(50 unit 기준): far=300, left/right/top/bottom=±80 권장

// 3. 보조 포인트 조명 — 어두운 면 채우기
const fill = new THREE.PointLight(0x4fc3f7, 0.6, 250);
fill.position.set(-60, 40, -50);
// 청색 계열 → 흰빛 태양광과 대비로 금속 느낌 강화
// 세 번째 인자 250 = 빛이 닿는 최대 거리
```

---

## 🔧 GLB 로드 및 초기 보정 상세

### 좌표계 문제와 해결

CAD 소프트웨어는 Z-up, Three.js는 Y-up 좌표계를 사용합니다. 변환 없이 로드하면 모터가 옆으로 누워 보입니다.

```
Z-up (CAD)          Y-up (Three.js)
     Z↑                    Y↑
     │                     │
     └──→ X      Z←────────└──→ X

→ wrapper.rotation.x = Math.PI / 2  (또는 -Math.PI / 2)
  로 래퍼 그룹 전체를 회전시켜 모터를 세움
```

```javascript
// model을 직접 회전하지 않고 wrapper로 감싸는 이유:
// 크기 정규화·위치 보정을 wrapper 하나에서 일괄 처리하기 위함
// model 내부 파트 상대 위치는 유지 → 혼 탐색·회전 제어 정상 동작

const wrapper = new THREE.Group();
wrapper.rotation.x = Math.PI / 2;  // +/- 방향은 GLB에 따라 다름, 실제 확인 필요
wrapper.add(model);
scene.add(wrapper);
```

### 크기 정규화

```javascript
const box    = new THREE.Box3().setFromObject(wrapper);
const maxDim = box.getSize(new THREE.Vector3()).length();
wrapper.scale.setScalar(50 / maxDim);
// Bounding Box 대각선이 50 unit이 되도록 자동 배율 조정
// 50 → 30: 더 작게 / 50 → 80: 더 크게
// 변경 시 camera.position, controls.minDistance도 함께 조정 필요
```

### 바닥 정렬

```javascript
box.setFromObject(wrapper);         // 스케일 적용 후 재계산
wrapper.position.y = -box.min.y;   // 모델 하단을 Y=0에 정렬
// 바닥에서 띄우려면: wrapper.position.y = -box.min.y + 5;
```

### 혼(Horn) 파트 탐색

```javascript
hornMesh = model.getObjectByName('sg90_horn')  // ① Blender 이름 설정 시
        || model.getObjectByName('NAUO2')       // ② 현재 GLB 실제 노드명
        || findSmallestMesh(model);             // ③ 자동 폴백 (최소 버텍스 메시)
```

| 탐색 순서 | 조건 | 방법 |
|----------|------|------|
| ① sg90_horn | Blender에서 오브젝트 이름 직접 설정 후 GLB 내보내기 | 가장 정확, 권장 |
| ② NAUO2 | 현재 GLB의 실제 노드 이름 (CAD Assistant 자동 부여) | 현재 동작 중 |
| ③ 최소 메시 | 이름 탐색 모두 실패 시 버텍스 수 최소 메시 선택 | 최후 수단 |

---

## 🎯 서보 각도 제어 로직

### 라디안 변환과 중립점 설정

Three.js의 `rotation.y`는 라디안 단위를 사용합니다. 단순 변환 외에 SG90의 중립 위치(90°)를 Three.js의 기본 방향(0 rad)에 맞추는 보정이 필요합니다.

```javascript
function degToRad(deg) {
    return THREE.MathUtils.degToRad(deg - 90);
    //                               ↑ 중립점 보정  ↑ 단위 변환 (× π/180)
}
```

```
변환 결과:
  0°   → -π/2 rad (-1.5708) — 최대 왼쪽
  90°  →  0   rad           — 정면 중립 (GLB 기본 방향과 일치)
  180° → +π/2 rad (+1.5708) — 최대 오른쪽

보정 없이 쓰면:
  슬라이더 90° 위치에서도 혼이 옆으로 돌아간 상태로 시작됨
```

### 라디안 단위 기본 지식

```
원 한 바퀴 = 360° = 2π rad ≈ 6.2832
반 바퀴    = 180° =  π rad ≈ 3.1416
직각       =  90° = π/2 rad ≈ 1.5708

변환 공식:
  라디안 = 도(°) × π / 180
  도(°)  = 라디안 × 180 / π
```

### 보간(Lerp) 애니메이션

실제 SG90처럼 부드럽게 이동하는 효과를 위해 Lerp를 적용합니다.

```javascript
// animate() 루프 내
const diff = targetAngle - currentAngle;
if (Math.abs(diff) > 0.05) {
    currentAngle += diff * Math.min(speed, 1);
    // 매 프레임 남은 거리의 speed 비율만큼 이동
    // → 목표에 가까워질수록 속도가 줄어드는 자연스러운 감속
}
```

| 속도값 | 효과 |
|--------|------|
| 0.02 | 매우 느림 — 각도 변화를 천천히 관찰 (교육용) |
| 0.05 | 보통 — 자연스러운 서보 동작 (기본값) |
| 0.15 | 빠름 |
| 1.00 | 즉시 — 보간 없이 바로 이동 |

---

## 🔍 GLB 구조 분석 도구 (analyze_glb.html)

```
http://localhost:3030/analyze_glb.html
```

브라우저에서 GLB 내부 구조를 텍스트로 출력합니다.

- 전체 씬 트리 (노드 계층, 타입, 이름)
- 메시별 버텍스 수 및 재질 정보
- 애니메이션 목록
- 파트 이름 검증 (`sg90_horn` 등 탐색 성공 여부)

---

## 🛠️ 트러블슈팅

### 모터가 누워있음

```
원인: CAD 소프트웨어의 Z-up 좌표계로 GLB가 저장됨
해결: wrapper.rotation.x 값 변경
  Math.PI / 2   →  +90° 회전
  -Math.PI / 2  →  -90° 회전 (반대 방향으로 누워있을 때)
  Math.PI       →  180° 회전 (상하 뒤집힘)
```

### 혼이 회전하지 않음

```
원인 1: hornMesh가 null (파트 이름 불일치)
  → 브라우저 콘솔(F12)에서 탐색된 혼 파트 이름 확인
  → NAUO2가 아닌 다른 이름이면 코드에서 직접 수정

원인 2: 회전 축 불일치
  → rotation.y 대신 rotation.x 또는 rotation.z 시도
  → 슬라이더 조작 시 혼이 제자리 회전하면 올바른 축

원인 3: Blender에서 이름 미설정
  → Blender에서 혼 오브젝트 선택 → F2 → 'sg90_horn' 입력 후 GLB 재내보내기
```

### 그림자가 보이지 않음

```
원인: sun.shadow.camera의 far 범위가 너무 좁음
해결: far 값을 모델 크기보다 충분히 크게 설정
  Object.assign(sun.shadow.camera, { near:1, far:300, left:-80, right:80, top:80, bottom:-80 });
```

### GLB 로드 실패

```
CORS 오류   → file:// 직접 열기 금지, node server.js 실행 후 http://localhost:3030 접속
ENOENT      → public/ 폴더에 sg90_servo.glb 파일 없음
파싱 오류   → GLB 파일 손상 → Blender에서 재내보내기
MIME 오류   → server.js MIME 테이블에 '.glb': 'model/gltf-binary' 누락
```

### 포트 충돌

```bash
# Linux / macOS
lsof -i :3030
kill -9 <PID>

# Windows
netstat -ano | findstr :3030
taskkill /PID <PID번호> /F

# 또는 server.js에서 포트 변경
const PORT = 3031;
```

---

## 📐 Blender 파트 이름 설정 (권장)

Three.js 코드에서 `getObjectByName()`으로 정확히 탐색하려면 Blender에서 아래 이름을 설정하고 GLB를 재내보내는 것을 권장합니다.

| 역할 | Blender 오브젝트 이름 |
|------|---------------------|
| 서보 본체 | `sg90_body` |
| 혼 (회전부) | `sg90_horn` ← 필수 |
| 하단 캡 | `sg90_bottom` |
| 상단 커버 | `sg90_top` |
| M2×8 나사 | `sg90_screw_long` |
| M2×4 나사 | `sg90_screw_short` |

### GLB 내보내기 필수 옵션

```
Format  : GLB (Binary)
✅ +Y Up   ← Three.js 좌표계 맞춤 (이 옵션으로 내보내면 wrapper 보정 불필요)
✅ Apply Modifiers
Ctrl+A → All Transforms 적용 후 내보내기
```

> `+Y Up` 옵션으로 내보내면 `wrapper.rotation.x` 보정이 필요 없어집니다.

---

## 🛠️ 사용 기술 스택

```
┌─────────────────────────────────────────────────┐
│  Browser (Chrome / Edge)                        │
│  ┌───────────────────────────────────────────┐  │
│  │  Three.js r159                            │  │
│  │  ├─ GLTFLoader     (GLB 로드 + 보정)      │  │
│  │  ├─ OrbitControls  (카메라 제어)          │  │
│  │  └─ WebGLRenderer  (3D 렌더링)            │  │
│  └───────────────────────────────────────────┘  │
│                    ↕ HTTP                       │
│  ┌───────────────────────────────────────────┐  │
│  │  Node.js 18  (http 내장 모듈만 사용)      │  │
│  │  └─ server.js  포트 3030                  │  │
│  └───────────────────────────────────────────┘  │
│                    ↑                            │
│  sg90_servo.glb  (FreeCAD / CAD Assistant 변환) │
│  └─ NAUO1(본체) · NAUO2(혼) · NAUO3~7(기타)    │
└─────────────────────────────────────────────────┘
```

---

## 📋 SG90 Micro Servo 스펙

| 항목 | 값 |
|------|-----|
| 제조사 | Tower Pro |
| 전압 | 4.8V ~ 6.0V DC |
| 토크 | 1.8 kgf·cm @ 4.8V / 2.2 kgf·cm @ 6.0V |
| 속도 | 0.10 sec/60° @ 4.8V |
| 회전각 | 0° ~ 180° |
| 무게 | 9g |
| 크기 | 22 × 11.8 × 31 mm |
| PWM | 500μs(0°) ~ 1500μs(90°) ~ 2400μs(180°) |

---

*각 단계별 상세 내용은 `docs/` 폴더의 개별 문서를 참조하세요.*
