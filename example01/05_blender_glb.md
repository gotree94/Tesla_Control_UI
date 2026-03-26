# 05. Blender — 파트 분리 · Origin 설정 · GLB 내보내기

← [04. Blender 임포트](./04_blender_import.md) | 다음 → [06. GLB 구조 검증](./06_analyze_glb.md)

---

## 5.1 작업 개요

이 단계는 가장 중요한 작업입니다.  
Three.js에서 혼(Horn)을 정확하게 회전시키려면 아래 세 가지가 필수입니다.

```
① 파트 분리   : 본체와 혼이 독립된 Mesh 오브젝트여야 함
② 이름 부여   : Three.js 코드에서 getObjectByName()으로 접근
③ Origin 설정 : 혼의 회전 중심점을 샤프트 축 위에 정확히 설정
```

---

## 5.2 파트 분리 방법

### 방법 A: Edit Mode → Separate (파트가 하나로 합쳐진 경우)

```
① 합쳐진 메시 오브젝트 선택
② Tab → Edit Mode 진입
③ 메시 분리:
   - A 키 → 전체 선택 해제
   - 본체 면 클릭 후 L 키 → 연결된 메시 전체 선택
   - P 키 → Separate → Selection
   → 선택한 부분이 별도 오브젝트로 분리

④ 나머지 파트도 같은 방법으로 반복
⑤ Tab → Object Mode 복귀
```

### 방법 B: Separate by Loose Parts (가장 빠름)

```
① 오브젝트 선택
② Tab → Edit Mode
③ A 키 → 전체 선택
④ P 키 → By Loose Parts
   → 물리적으로 분리된 메시들이 자동으로 각각 독립 오브젝트로 분리!
⑤ Tab → Object Mode 복귀
```

> 💡 SG90처럼 파트 간에 접촉하거나 겹치는 면이 없으면 **By Loose Parts**가 가장 빠릅니다.

---

## 5.3 오브젝트 이름 부여

Three.js 코드에서 `scene.getObjectByName("이름")`으로 접근하므로,  
Blender에서 정확한 이름을 설정해야 합니다.

### 이름 설정 방법

```
방법 1: Outliner에서 오브젝트 더블클릭 → 새 이름 입력 → Enter
방법 2: Properties 패널 → Object Properties(📐) → Item → Name 필드 수정
방법 3: 오브젝트 선택 → F2 → 이름 입력
```

### 권장 이름 규칙

| 파트 역할 | Blender 오브젝트 이름 | Three.js 접근 코드 |
|---------|-------------------|-----------------|
| 서보 본체 | `sg90_body` | `scene.getObjectByName('sg90_body')` |
| 혼 (회전부) | `sg90_horn` | `scene.getObjectByName('sg90_horn')` ← 핵심! |
| 하단 캡 | `sg90_bottom` | `scene.getObjectByName('sg90_bottom')` |
| 상단 커버 | `sg90_top` | `scene.getObjectByName('sg90_top')` |
| M2×8 나사 | `sg90_screw_long` | — (제어 불필요) |
| M2×4 나사 | `sg90_screw_short` | — (제어 불필요) |

> ⚠️ 이름은 대소문자를 구분합니다. `sg90_Horn` ≠ `sg90_horn`

---

## 5.4 혼(Horn) Origin 재설정 — 가장 중요한 작업!

Three.js에서 오브젝트를 회전할 때는 **Origin(원점)**을 중심으로 회전합니다.  
혼의 Origin이 샤프트 중심 축 위에 없으면, 회전 시 엉뚱한 위치로 돌아갑니다.

```
잘못된 경우:
  Origin이 혼의 기하 중심에 있으면
  → 회전 시 혼이 제자리에서 도는 것이 아니라
  → 원을 그리며 공전하는 현상 발생

올바른 경우:
  Origin = 샤프트 중심 축 (혼의 중앙 구멍 하단)
  → 회전 시 제자리에서 Y축을 기준으로 정확히 회전
```

### Origin 재설정 절차

**Step 1: 혼의 샤프트 중심 좌표 확인**

```
① sg90_horn 오브젝트 선택
② Tab → Edit Mode
③ 중앙 원형 구멍(샤프트 홀)의 꼭지점 하나 클릭
④ N 패널(우측) → Item → Vertex 좌표 확인
   예: X=0.0, Y=0.0, Z=3.0  ← 이 Z값 기억
⑤ Tab → Object Mode 복귀
```

**Step 2: 3D Cursor를 샤프트 중심으로 이동**

```
방법 A (정확): N패널 → View → 3D Cursor 탭
  X: 0.0  (중앙)
  Y: 0.0  (중앙)
  Z: <Step1에서 확인한 Z값>  ← 본체 상단 높이

방법 B (스냅): 샤프트 중심 꼭지점 선택 후
  Shift + S → Cursor to Selected
```

**Step 3: Origin을 3D Cursor 위치로 설정**

```
sg90_horn 오브젝트 선택 (Object Mode에서)
Object 메뉴 → Set Origin → Origin to 3D Cursor
```

**Step 4: 결과 확인**

```
뷰포트에서 sg90_horn의 오렌지 점(Origin 표시)이
샤프트 중심 하단에 위치하면 성공!

검증:
  R → Y → 90 → Enter
  → 혼이 Y축을 중심으로 제자리 회전하면 OK
  Ctrl+Z 로 되돌리기
```

---

## 5.5 재질(Material) 설정

GLB로 내보낼 때 PBR(Physically Based Rendering) 재질을 설정하면  
Three.js에서 더 사실적으로 렌더링됩니다.

### 재질 추가 및 설정

```
① 오브젝트 선택
② Properties → 🎨 Material Properties
③ [+New] 클릭 → 재질 생성
④ 재질 이름 설정 (예: mat_body, mat_horn)
⑤ Surface: Principled BSDF (기본값)
⑥ 파라미터 설정:
```

### 파트별 권장 재질 값

| 파트 | Base Color | Metallic | Roughness |
|------|-----------|---------|-----------|
| `sg90_body` | `#C8B89A` (베이지) | 0.0 | 0.7 |
| `sg90_horn` | `#E8E8E8` (밝은 회색) | 0.0 | 0.5 |
| `sg90_bottom` | `#2A2A2A` (어두운 회색) | 0.0 | 0.8 |
| `sg90_top` | `#B8A888` (연한 베이지) | 0.0 | 0.6 |
| 나사류 | `#888888` (중간 회색) | 0.6 | 0.4 |

### Viewport Shading 변경으로 재질 미리보기

```
뷰포트 우측 상단 구 모양 아이콘 클릭
또는 Z 키 → Material Preview (분홍구 아이콘) 선택
→ 설정한 색상이 뷰포트에 표시됨
```

---

## 5.6 내보내기 전 최종 점검

```
□ 모든 Transform 적용 (필수!)
   A 키 → 전체 선택
   Ctrl + A → Apply → All Transforms
   (스케일/회전이 적용되지 않으면 GLB에서 변환값이 이상해짐)

□ 오브젝트 이름 확인
   Outliner에서: sg90_body, sg90_horn, sg90_bottom, sg90_top …

□ sg90_horn의 Origin이 샤프트 중심에 있는지 확인

□ 재질이 모든 파트에 할당되어 있는지 확인
   Material Properties에서 각 파트 확인
```

---

## 5.7 GLB 파일 내보내기

### 내보내기 실행

```
File → Export → glTF 2.0 (.glb/.gltf)
파일명: sg90_servo.glb
저장위치: sg90-servo-viewer/public/
```

### 내보내기 옵션 설정 (오른쪽 패널)

```
Format: GLB (Binary)  ← 단일 파일, 권장
         GLTF Separate → JSON+bin+이미지 분리 (디버깅용)

─── Include ────────────────────────────────
✅ Selected Objects    또는
✅ Visible Objects     (모두 내보낼 때)
☐  Cameras            ← 해제 (불필요)
☐  Punctual Lights    ← 해제 (불필요)
✅ Custom Properties

─── Transform ──────────────────────────────
✅ +Y Up              ← Three.js 좌표계와 일치 (필수!)

─── Geometry ───────────────────────────────
✅ Apply Modifiers
✅ UVs
✅ Normals
✅ Vertex Colors
✅ Loose Edges        ← 해제 가능
✅ Loose Points       ← 해제 가능

─── Material ───────────────────────────────
Material: Export       ← PBR 재질 포함
✅ Images              ← 텍스처 있으면 포함

─── Animation ──────────────────────────────
☐  Animation           ← 해제 (Three.js로 제어할 것이므로)
```

### 내보내기 완료 확인

```bash
# 터미널에서 파일 크기 확인
ls -lh sg90-servo-viewer/public/sg90_servo.glb

# 예상 크기: 500KB ~ 3MB
# (SG90 정도의 단순 기계 모델 기준)
```

---

## 5.8 온라인 GLB 사전 검증

Blender에서 내보낸 GLB를 서버 없이 바로 확인할 수 있는 도구들:

```
1. gltf-viewer.donmccurdy.com   ← 가장 많이 사용
   → 파일 드래그 앤 드롭
   → Inspector 탭에서 메시 이름 확인 가능

2. sandbox.babylonjs.com
   → 고품질 렌더링 확인
   → 씬 트리, 재질 확인

3. VS Code + glTF Tools 확장
   → 파일 우클릭 → "glTF: Inspect"
   → JSON 형태로 노드, 재질, 메시 구조 확인
```

---

## CAD-Assistant GLB 내보내기

* 홈페이지 : cad-assistant : https://www.opencascade.com/products/cad-assistant/
* 다운로드 링크 : https://www.opencascade.com/sites/default/files/private/occt/applications/cad_assistant_1.6.0_2021-10-05_win64.zip

<img width="1545" height="734" alt="CONV_002" src="https://github.com/user-attachments/assets/1072c77d-bc38-4a35-91a0-7664b1d50f78" />

<img width="1545" height="734" alt="CONV_001" src="https://github.com/user-attachments/assets/528619cf-0814-40e5-b7f5-1d587f526172" />

* 분석한 구조 내용 검색
```
  새로운 1 (8 일치)
	줄    6: [Group] (unnamed)
	줄    8:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro1_Pea
	줄 1938:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro2_Pea
	줄 2557:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro3_Pea
	줄 3224:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro4_Pea
	줄 3942:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro5_BS_EN_ISO_7045_-_M2_x_8_-_Z_-_8S
	줄 4321:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro5_BS_EN_ISO_7045_-_M2_x_8_-_Z_-_8S_1
	줄 4700:     [Group] SG90_-_Micro_Servo_9g_-_Tower_Pro6_BS_EN_ISO_7045_-_M2_x_4_-_Z_-_4S

```

* index.html 수정
```
        // 5) 혼 탐색 순서:
        //    ① sg90_horn (Blender에서 이름 설정했을 경우)
        //    ② NAUO2     (현재 GLB의 2번 파트 = 혼 추정)
        //    ③ 메시 중 버텍스 수가 가장 적은 것 (자동 폴백)
        //hornMesh = model.getObjectByName('sg90_horn')
		hornMesh = model.getObjectByName('SG90_-_Micro_Servo_9g_-_Tower_Pro2_Pea')
                //|| model.getObjectByName('NAUO2')
                || findSmallestMesh(model);
```

---

← [04. Blender 임포트](./04_blender_import.md) | 다음 → [06. GLB 구조 검증](./06_analyze_glb.md)
