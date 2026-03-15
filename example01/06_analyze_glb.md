# 06. analyze_glb.html로 GLB 구조 검증

← [05. GLB 변환](./05_blender_glb.md) | 다음 → [07. Node.js 서버](./07_nodejs_server.md)

---

## 6.1 GLB 검증이 필요한 이유

Blender에서 내보낸 GLB 파일이 Three.js에서 올바르게 동작하려면  
파트 이름(오브젝트명)이 코드에서 참조하는 이름과 **정확히 일치**해야 합니다.

```
Three.js 코드:
  hornMesh = model.getObjectByName('sg90_horn');

GLB 내부 노드 이름:
  ✅ sg90_horn  → 정상 탐색
  ❌ Horn       → null 반환 → 제어 불가
  ❌ sg90_Horn  → null 반환 (대소문자 구분)
  ❌ Mesh_001   → null 반환 (Blender 기본 이름)
```

`analyze_glb.html`은 GLB 파일을 브라우저에서 직접 로드하여  
**씬 트리 구조 · 메시 이름 · 버텍스 수 · 재질 정보**를 텍스트로 출력하는 도구입니다.

---

## 6.2 analyze_glb.html 파일 수정

업로드된 원본 파일은 Tesla 모델용이므로, SG90 모델에 맞게 수정합니다.

```html
<!-- 수정 전 (원본 Tesla 버전) -->
loader.load('tesla_2018_model_3.glb', (gltf) => {

<!-- 수정 후 (SG90 버전) -->
loader.load('sg90_servo.glb', (gltf) => {
```

### 완성된 analyze_glb.html

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>SG90 GLB 구조 분석</title>
    <style>
        body { font-family: monospace; background:#1a1a2e; color:#e0e0e0; padding:20px; }
        h1   { color:#4fc3f7; }
        pre  { background:#0d1b2a; padding:16px; border-radius:8px;
               white-space:pre-wrap; line-height:1.6; font-size:13px; }
        .ok  { color:#81c784; }
        .warn{ color:#ffb74d; }
        .err { color:#ef5350; }
    </style>
</head>
<body>
    <h1>🔍 SG90 Servo GLB 구조 분석</h1>
    <pre id="output">로딩 중...</pre>

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
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        const output = document.getElementById('output');
        const loader = new GLTFLoader();

        // ── Three.js에서 탐색할 파트 이름 목록 ──
        const EXPECTED_PARTS = [
            'sg90_body',
            'sg90_horn',       // 회전 제어 대상 — 필수!
            'sg90_bottom',
            'sg90_top',
            'sg90_screw_long',
            'sg90_screw_short',
        ];

        loader.load('sg90_servo.glb', (gltf) => {
            let r = '=== SG90 Servo GLB 구조 분석 ===\n\n';

            // ── 씬 전체 트리 출력 ──
            r += '▶ 전체 씬 구조:\n';
            r += '─'.repeat(60) + '\n';

            let meshCount = 0;
            let matCount  = 0;

            gltf.scene.traverse((child) => {
                const depth  = getDepth(child);
                const indent = '  '.repeat(depth);
                r += `${indent}[${child.type}] ${child.name || '(unnamed)'}\n`;

                if (child.isMesh) {
                    meshCount++;
                    const verts = child.geometry.attributes.position?.count ?? 0;
                    r += `${indent}  ├ vertices : ${verts}\n`;

                    if (child.material) {
                        const mats = Array.isArray(child.material)
                            ? child.material : [child.material];
                        mats.forEach(m => {
                            r += `${indent}  ├ material : ${m.name || m.type}\n`;
                            matCount++;
                        });
                    }
                }
            });

            // ── 통계 ──
            r += '\n' + '='.repeat(60) + '\n';
            r += `총 메시 수     : ${meshCount}\n`;
            r += `총 재질 수     : ${matCount}\n`;
            r += '='.repeat(60) + '\n\n';

            // ── 애니메이션 정보 ──
            r += '▶ 애니메이션:\n';
            r += '─'.repeat(60) + '\n';
            if (gltf.animations?.length > 0) {
                gltf.animations.forEach((anim, i) => {
                    r += `  Animation[${i}]: "${anim.name}" (${anim.duration.toFixed(2)}s)\n`;
                    anim.tracks.forEach(t => r += `    - ${t.name}\n`);
                });
            } else {
                r += '  애니메이션 없음 (정상 — Three.js 코드로 제어)\n';
            }

            // ── 파트 이름 검증 ──
            r += '\n' + '='.repeat(60) + '\n';
            r += '▶ 파트 이름 검증:\n';
            r += '─'.repeat(60) + '\n';

            EXPECTED_PARTS.forEach(name => {
                const found = gltf.scene.getObjectByName(name);
                const icon  = found ? '✅' : '❌';
                const type  = found ? `[${found.type}]` : '미발견';
                r += `  ${icon} ${name.padEnd(20)} ${type}\n`;
            });

            // ── 결론 ──
            r += '\n' + '='.repeat(60) + '\n';
            r += '▶ 결론:\n';
            r += '─'.repeat(60) + '\n';

            const hornFound = gltf.scene.getObjectByName('sg90_horn');
            if (hornFound) {
                r += '  ✅ sg90_horn 파트 탐색 성공!\n';
                r += '  ✅ Three.js 서보 제어 준비 완료\n';
            } else {
                r += '  ❌ sg90_horn 파트를 찾지 못했습니다.\n\n';
                r += '  발견된 모든 메시 이름:\n';
                gltf.scene.traverse(c => {
                    if (c.isMesh) r += `    - "${c.name}"\n`;
                });
                r += '\n  → Blender에서 혼 오브젝트 이름을 "sg90_horn"으로 변경 후 재내보내기\n';
            }

            output.textContent = r;

        }, (xhr) => {
            const pct = xhr.total ? Math.round(xhr.loaded / xhr.total * 100) : '?';
            output.textContent = `로딩 중... ${pct}%`;
        }, (err) => {
            output.textContent = `❌ 로드 실패:\n${err}\n\nsg90_servo.glb 파일이 서버 루트(public/)에 있는지 확인하세요.`;
        });

        function getDepth(obj) {
            let d = 0, cur = obj;
            while (cur.parent) { d++; cur = cur.parent; }
            return d;
        }
    </script>
</body>
</html>
```

---

## 6.3 실행 방법

```bash
# 1. sg90_servo.glb 파일을 public/ 폴더에 복사
cp ~/Downloads/sg90_servo.glb ./sg90-servo-viewer/public/

# 2. analyze_glb.html도 public/ 폴더에 저장
cp analyze_glb.html ./sg90-servo-viewer/public/

# 3. Node.js 서버 실행 (07단계 서버 준비 전이면 임시로 아래 사용)
cd sg90-servo-viewer
node server.js

# 4. 브라우저에서 접속
# http://localhost:3030/analyze_glb.html
```

---

## 6.4 정상 출력 예시

```
=== SG90 Servo GLB 구조 분석 ===

▶ 전체 씬 구조:
────────────────────────────────────────────────────────────
[Scene] Scene
  [Object3D] sg90_assembly
    [Mesh] sg90_body
      ├ vertices : 2048
      ├ material : mat_body
    [Mesh] sg90_horn
      ├ vertices : 512
      ├ material : mat_horn
    [Mesh] sg90_bottom
      ├ vertices : 384
      ├ material : mat_body
    [Mesh] sg90_top
      ├ vertices : 256
      ├ material : mat_body
    [Mesh] sg90_screw_long
      ├ vertices : 96
      ├ material : mat_screw
    [Mesh] sg90_screw_short
      ├ vertices : 96
      ├ material : mat_screw

============================================================
총 메시 수     : 6
총 재질 수     : 3
============================================================

▶ 애니메이션:
────────────────────────────────────────────────────────────
  애니메이션 없음 (정상 — Three.js 코드로 제어)

============================================================
▶ 파트 이름 검증:
────────────────────────────────────────────────────────────
  ✅ sg90_body             [Mesh]
  ✅ sg90_horn             [Mesh]
  ✅ sg90_bottom           [Mesh]
  ✅ sg90_top              [Mesh]
  ✅ sg90_screw_long       [Mesh]
  ✅ sg90_screw_short      [Mesh]

============================================================
▶ 결론:
────────────────────────────────────────────────────────────
  ✅ sg90_horn 파트 탐색 성공!
  ✅ Three.js 서보 제어 준비 완료
```

---

## 6.5 문제별 진단 및 해결

### ❌ sg90_horn 미발견 — 발견된 이름이 "Horn_001"인 경우

```
원인: Blender에서 이름을 변경하지 않고 내보냄

해결:
① Blender에서 해당 오브젝트 선택
② F2 또는 N패널 → Name 필드 → "sg90_horn" 입력
③ File → Export → glTF 2.0 (GLB) 재내보내기
```

### ❌ 메시 수가 1인 경우

```
원인: 파트가 분리되지 않고 하나의 메시로 내보내짐

해결:
① Blender에서 해당 메시 선택
② Tab → Edit Mode
③ P 키 → By Loose Parts
④ GLB 재내보내기
```

### ❌ 로드 실패 (Error loading model)

```
원인: 파일 경로 오류

확인:
- sg90_servo.glb 파일이 public/ 폴더에 있는지 확인
- 서버가 실행 중인지 확인 (node server.js)
- 브라우저 콘솔(F12)에서 정확한 에러 메시지 확인
```

### ❌ vertices = 0

```
원인: 빈 메시 또는 임포트 오류

해결:
① Blender에서 해당 오브젝트 선택 후 뷰포트에서 형상 확인
② 형상이 보이면 → 수정 없이 GLB 재내보내기
③ 형상이 없으면 → STEP/OBJ 재임포트 필요
```

---

← [05. GLB 변환](./05_blender_glb.md) | 다음 → [07. Node.js 서버](./07_nodejs_server.md)
