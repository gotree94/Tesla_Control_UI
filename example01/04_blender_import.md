# 04. Blender STEP 임포트 및 씬 구조 확인

← [03. SolidWorks STEP 분석](./03_solidworks.md) | 다음 → [05. GLB 변환](./05_blender_glb.md)

---

## 4.1 Blender UI 기본 구성 이해

작업 전 Blender 화면 구성을 파악합니다.

```
┌──────────────────────────────────────────────────────┐
│  상단 메뉴바: File / Edit / Render / Window / Help   │
├──────────────┬───────────────────────┬───────────────┤
│  Outliner    │                       │  Properties   │
│  (씬 트리)   │    3D Viewport         │  패널         │
│              │    (뷰포트)            │               │
│  ┌─ Scene    │                       │  🌏 Scene     │
│  └─ Objects  │                       │  🎨 Material  │
│              │                       │  📐 Object    │
├──────────────┼───────────────────────┤               │
│  Timeline    │    Status Bar         │               │
└──────────────┴───────────────────────┴───────────────┘

주요 단축키:
  숫자패드 1   : 정면뷰(Front)
  숫자패드 3   : 측면뷰(Right)
  숫자패드 7   : 상면뷰(Top)
  숫자패드 5   : 원근/직교 전환
  G / R / S   : 이동 / 회전 / 크기
  X           : 삭제
  Tab         : Object ↔ Edit Mode 전환
  A           : 전체 선택
  H / Alt+H   : 숨기기 / 숨기기 해제
```

---

## 4.2 Blender 초기 설정

새로 Blender를 열면 기본 큐브, 카메라, 조명이 있습니다.

### 초기 오브젝트 삭제

```
① 뷰포트에서 A 키 → 모두 선택
② X 키 → Delete 확인
→ 씬이 완전히 비워짐
```

### 단위 설정 (mm → 미터 주의)

```
Properties 패널(우측) → 🌏 Scene Properties
→ Units 섹션
  Unit System : Metric
  Unit Scale  : 0.001   ← mm 단위 STEP 파일에 대응
  Length      : Millimeters
```

> 💡 STEP 파일은 mm 단위이지만 Blender 내부는 m 단위입니다.  
> Scale 0.001 설정 시 1mm → 0.001m로 정확히 매핑됩니다.

---

## 4.3 OBJ 파일 임포트 (FreeCAD 변환 경유)

FreeCAD 또는 CAD Assistant로 STEP → OBJ 변환한 파일을 임포트합니다.

### 임포트 메뉴

```
File → Import → Wavefront (.obj)
→ sg90_assembly.obj 선택
```

### 임포트 옵션 설정 (우측 패널)

```
Transform:
  Forward Axis : -Z    ← CAD 좌표계 맞춤
  Up Axis      : Y

Geometry:
  ✅ Split by Object   (오브젝트 이름별 분리)
  ✅ Split by Group    (그룹별 분리) ← 파트 분리 핵심!
  ✅ Import UV         (UV 좌표 유지)

Material:
  ✅ Import Materials  (MTL 파일 재질 임포트)
```

> ⚠️ **Split by Group**을 체크해야 파트별로 개별 오브젝트로 분리됩니다.  
> 이 옵션이 없으면 SG90 전체가 하나의 메시로 합쳐집니다.

### 임포트 후 화면 조정

```
숫자패드 0     : 원근뷰
숫자패드 .    : 선택 오브젝트 중심으로 뷰 이동
숫자패드 5    : 원근 ↔ 직교 전환
마우스 중간버튼 드래그 : 뷰 회전
스크롤        : 줌 인/아웃
```

---

## 4.4 CAD Assistant로 직접 GLB 변환하는 방법 (권장 대안)

**OPEN CASCADE CAD Assistant**를 사용하면 Blender OBJ 임포트 없이  
STEP → GLB 직접 변환이 가능합니다. (단, 파트 이름 수동 설정은 Blender에서 필요)

```
① CAD Assistant 실행
② File → Open → SG90...STEP 선택
③ 좌측 Model Tree에서 파트 구조 확인
④ File → Export → GLTF / GLB 선택
⑤ 내보내기 옵션:
   Format: GLB (Binary)
   ✅ Export Mesh
   ✅ Export Colors
⑥ sg90_cad.glb 저장

→ 이후 Blender에서 GLB 임포트 후 이름 설정만 진행
```

---

## 4.5 임포트 후 씬 구조 확인

### Outliner에서 파트 트리 확인

```
Outliner (우측 상단) 예상 구조:

Collection
├── sg90_assembly          ← 어셈블리 루트 (Empty 오브젝트)
│   ├── Mesh_1             ← 파트 1 (이름이 자동 부여됨)
│   ├── Mesh_2             ← 파트 2
│   ├── Mesh_3             ← 파트 3
│   ├── Mesh_4             ← 파트 4
│   ├── Screw_M2x8         ← 나사 1
│   └── Screw_M2x4         ← 나사 2

※ FreeCAD 변환 품질에 따라 이름이 다를 수 있음
```

### 개별 파트 선택 및 형상 확인

```
① Outliner에서 각 오브젝트 클릭 → 뷰포트에서 선택(주황 테두리)
② 뷰포트에서 숫자패드 . → 선택 파트 중심으로 뷰 이동
③ 형상을 보고 어떤 부품인지 판단:
   - 직사각형 박스형  → 본체 (Body)
   - 십자/원형 날개   → 혼 (Horn) ← 회전 제어 대상!
   - 작은 원기둥형    → 나사 (Screw)
```

---

## 4.6 파트 형상 확인 기준

### 혼(Horn) 파트 식별 기준

```
형상 특징:
  - 십자형 날개 (Cross Horn) 또는 원형/단일 날개
  - 중앙에 원형 구멍 (샤프트 구멍)
  - 날개 끝에 작은 구멍들 (로드 연결용)
  - 크기: 약 직경 22mm, 두께 3mm

위치:
  - 본체 상단 중앙에 결합
  - 이 파트가 Three.js에서 rotation.y 제어 대상
```

### 본체(Body) 파트 식별 기준

```
형상 특징:
  - 직사각형 박스 형태
  - 측면에 마운팅 귀(Ear) 돌출
  - 하단에 평평한 면 (바닥)
  - 크기: 약 22mm × 12mm × 31mm
```

---

## 4.7 임포트 문제 해결

### 문제 1: 모델이 너무 작거나 거대하게 임포트됨

```
원인: 단위 불일치 (mm vs m)
해결:
  임포트 옵션에서 Scale: 1000 (m → mm) 또는 0.001 적용
  또는 임포트 후:
    모든 오브젝트 선택(A) → S → 1000 → Enter (1000배 확대)
```

### 문제 2: 모든 파트가 하나의 메시로 합쳐짐

```
원인: Split by Group 옵션 미체크
해결:
  다시 임포트하되 Split by Object, Split by Group 체크
  또는 → 05단계에서 Edit Mode로 직접 분리 (4.4절 참조)
```

### 문제 3: 재질이 없거나 검게 표시됨

```
원인: MTL 파일 누락 또는 텍스처 경로 오류
해결:
  OBJ와 MTL 파일이 같은 폴더에 있는지 확인
  또는 Blender에서 Material Properties로 수동 재질 적용
  (3D 뷰어에서는 Three.js PBR 재질로 덮어씌울 예정이므로 크게 중요하지 않음)
```

### 문제 4: STEP 파일을 Blender에서 직접 열 수 없음

```
Blender 기본 버전에는 STEP 임포터가 없습니다.
해결 방법 (우선순위 순):
  1순위: CAD Assistant → GLB 직접 변환
  2순위: FreeCAD → OBJ 변환 → Blender 임포트
  3순위: Online-convert.com 활용
  4순위: SolidWorks에서 직접 OBJ 내보내기
```

---

## 4.8 다음 단계 준비

Blender 임포트가 완료되면 다음을 확인합니다.

```
□ 6개(이상) 파트가 Outliner에 표시됨
□ 뷰포트에서 SG90 형상이 정상적으로 보임
□ 각 파트 클릭 시 해당 형상이 선택됨
□ 혼(Horn) 파트 후보를 시각적으로 식별함
□ 단위 크기가 실제 SG90(22mm×12mm×31mm)과 유사함
```

---

← [03. SolidWorks STEP 분석](./03_solidworks.md) | 다음 → [05. GLB 변환](./05_blender_glb.md)
