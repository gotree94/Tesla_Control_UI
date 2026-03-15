# 11. 트러블슈팅 및 FAQ

← [10. 실행 및 테스트](./10_run_test.md) | [목차로 돌아가기](../README.md)

---

## 11.1 GLB 파일 관련

### ❌ 혼이 공전함 (제자리 회전이 아니라 원을 그림)

```
원인: sg90_horn의 Origin(원점)이 회전축 중심에 없음

해결:
1. Blender에서 sg90_horn 선택
2. Tab → Edit Mode
3. 샤프트 중심 꼭지점 선택
4. Shift+S → Cursor to Selected
5. Tab → Object Mode
6. Object → Set Origin → Origin to 3D Cursor
7. GLB 재내보내기

확인: R → Y → 90 → Enter 후 혼이 제자리 회전하면 OK
```

### ❌ Three.js에서 sg90_horn을 찾지 못함 (null 반환)

```
원인 1: Blender 오브젝트 이름 불일치
확인: analyze_glb.html에서 실제 메시 이름 확인
해결: Blender에서 F2 → "sg90_horn" 으로 정확히 변경 후 재내보내기

원인 2: 대소문자 불일치 (sg90_Horn ≠ sg90_horn)
해결: 이름을 소문자로 통일

원인 3: 파트가 메시가 아닌 빈 오브젝트(Empty)로 내보내짐
확인: analyze_glb.html에서 [Object3D]로 표시되는지 확인
해결: Blender에서 해당 오브젝트에 실제 Mesh가 있는지 확인
```

### ❌ GLB 파일이 로드되지 않음

```
브라우저 콘솔(F12) 에러 메시지 확인:

"Failed to fetch" / "ENOENT" 오류:
  → public/ 폴더에 sg90_servo.glb 파일이 없음
  → 파일명 오탈자 확인 (sg90_servo.glb / sg90servo.glb 등)

"Unexpected token" 오류:
  → GLB 파일이 손상됨
  → Blender에서 재내보내기 필요

CORS 오류:
  → file:// 프로토콜로 직접 열고 있음
  → node server.js 실행 후 http://localhost:3030 으로 접속
```

### ❌ 모델이 너무 작거나 거대함

```
원인: 단위 불일치 (mm vs m)

해결 A: index.html의 스케일 정규화 코드 확인
  const maxDim = box.getSize(new THREE.Vector3()).length();
  model.scale.setScalar(50 / maxDim);  // 50 = 목표 크기(mm 기준 표시크기)

해결 B: Blender 내보내기 시 Transform Apply 확인
  Ctrl+A → All Transforms 후 재내보내기
```

### ❌ 모델이 검은색으로 표시됨

```
원인 1: 재질(Material) 미설정
  → Blender에서 각 파트에 Material 추가 후 재내보내기

원인 2: 법선(Normal) 방향 반전
  → Blender Edit Mode → Face Orientation 확인 (빨간 면이 있으면 문제)
  → Alt+N → Recalculate Outside

원인 3: WebGL 지원 없음 (구형 브라우저)
  → Chrome 또는 Edge 최신 버전 사용
```

---

## 11.2 Node.js 서버 관련

### ❌ 포트 3030이 이미 사용 중

```bash
# Linux/macOS에서 프로세스 종료
lsof -i :3030
kill -9 <PID>

# Windows
netstat -ano | findstr :3030
taskkill /PID <PID번호> /F

# 또는 server.js에서 포트 번호 변경
const PORT = 3031;
```

### ❌ GLB 파일 응답이 application/octet-stream

```
원인: MIME 매핑에 .glb 가 없음
확인: 서버 로그에서 Content-Type 확인

해결: server.js MIME 테이블에 추가
const MIME = {
    ...
    '.glb' : 'model/gltf-binary',   ← 이 줄 추가
};
```

### ❌ 네트워크에서 접속 안 됨 (192.168.x.x:3030)

```
확인 1: HOST가 '0.0.0.0' 인지 확인
  const HOST = '0.0.0.0';  // 'localhost' 이면 외부 접속 불가

확인 2: 방화벽에서 3030 포트 허용
  Windows: Windows Defender 방화벽 → 3030 포트 인바운드 규칙 추가
  Linux:   sudo ufw allow 3030
```

---

## 11.3 Three.js / 브라우저 관련

### ❌ Import Map이 지원되지 않음 (오래된 브라우저)

```
지원 브라우저:
  Chrome 89+, Edge 89+, Firefox 108+, Safari 16.4+

해결: 브라우저를 최신 버전으로 업데이트
또는: CDN 스크립트 태그 방식으로 변경

<script src="https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js"></script>
```

### ❌ 슬라이더를 움직여도 혼이 회전하지 않음

```
원인 1: hornMesh가 null (파트 이름 불일치)
  → 브라우저 콘솔에서 hornMesh 값 확인
  → analyze_glb.html로 정확한 이름 확인

원인 2: 회전 축 불일치
  → rotation.y 대신 rotation.x 또는 rotation.z 시도:
  hornMesh.rotation.x = degToRad(currentAngle);
  hornMesh.rotation.z = degToRad(currentAngle);

원인 3: animate() 루프가 실행되지 않음
  → 콘솔에 오류 없는지 확인 (F12 → Console 탭)
```

### ❌ 화면이 회색/검은색으로만 표시됨

```
확인 1: WebGL 지원 여부
  브라우저 주소창에: chrome://gpu
  WebGL: Hardware accelerated 확인

확인 2: onResize() 함수가 호출되었는지
  → renderer.setSize()가 호출되지 않으면 0×0 크기로 렌더링됨

확인 3: animate()가 호출되었는지
  → 마지막 줄에 animate(); 가 있는지 확인
```

---

## 11.4 Blender 관련

### ❌ STEP 임포트 메뉴가 없음

```
Blender 기본에는 STEP 임포터가 없습니다.

해결책 (우선순위 순):
1. CAD Assistant (무료) → STEP 열기 → GLB 직접 내보내기
   https://www.opencascade.com/products/cad-assistant/

2. FreeCAD (무료) → STEP 열기 → OBJ 내보내기 → Blender에서 임포트
   https://www.freecad.org

3. online-convert.com → STEP → OBJ 온라인 변환 (무료, 100MB 미만)
```

### ❌ OBJ 임포트 후 파트가 하나로 합쳐짐

```
원인: Split by Group 옵션 미체크

해결:
File → Import → Wavefront (.obj)
우측 옵션 패널:
  ✅ Split by Object
  ✅ Split by Group  ← 이 옵션 체크!
```

### ❌ Blender에서 SG90이 극도로 작게 보임

```
원인: mm 단위 STEP → Blender m 단위 불일치

해결 1: 임포트 직후
  A (전체선택) → S → 1000 → Enter (1000배 확대)

해결 2: Blender 단위 설정
  Scene Properties → Units → Scale: 0.001

해결 3: 임포트 옵션에서 Scale 조정
  Import 창 → Transform → Scale: 1000
```

---

## 11.5 자주 묻는 질문 (FAQ)

**Q. npm install이 필요한가요?**

```
A. 아니요. server.js는 Node.js 내장 모듈만 사용합니다.
   (http, fs, path, os)
   Three.js도 CDN으로 브라우저에서 직접 로드됩니다.
   npm install 없이 node server.js 바로 실행 가능합니다.
```

**Q. analyze_glb.html은 무조건 실행해야 하나요?**

```
A. 필수는 아니지만 강력히 권장합니다.
   sg90_horn 이름이 정확한지 확인하지 않으면
   index.html에서 혼 제어가 전혀 동작하지 않습니다.
   반드시 analyze_glb.html로 검증 후 진행하세요.
```

**Q. GLB 파일 크기가 너무 큰데 줄일 수 있나요?**

```
A. 네. 방법:
1. Blender에서 Decimate 모디파이어로 폴리곤 수 감소
   → 오브젝트 선택 → Properties → Modifier → Add → Decimate
   → Ratio: 0.3~0.5 (50~70% 감소)

2. 나사(Screw) 파트는 제어 불필요하므로 내보내기 제외 가능

3. gltf-transform CLI 도구 사용 (압축):
   npm i -g @gltf-transform/cli
   gltf-transform optimize sg90_servo.glb sg90_servo_opt.glb
```

**Q. 실제 SG90과 연동해서 동시에 움직이게 할 수 있나요?**

```
A. 네. 확장 방법:
1. Node.js 서버에 WebSocket 추가
2. Raspberry Pi에서 WebSocket 클라이언트로 연결
3. 브라우저 슬라이더 이동 → WebSocket으로 각도 전송
   → Pi에서 수신 → GPIO PWM으로 SG90 실제 구동

이 기능은 이 프로젝트의 다음 단계로 구현 가능합니다.
```

**Q. Three.js 버전을 업그레이드하면 어떻게 되나요?**

```
A. import map의 버전 번호만 변경하면 됩니다.
   "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
   
   단, OrbitControls, GLTFLoader의 경로도 같은 버전으로 일치시켜야 합니다.
   r159 → r160+ 에서 일부 API 변경이 있을 수 있습니다.
```

---

← [10. 실행 및 테스트](./10_run_test.md) | [목차로 돌아가기](../README.md)
