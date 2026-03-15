# 03. SolidWorks STEP 파일 분석

← [02. 개발 환경](./02_environment.md) | 다음 → [04. Blender 임포트](./04_blender_import.md)

---

## 3.1 STEP 파일이란?

**STEP (Standard for the Exchange of Product data)**은 CAD 소프트웨어 간  
3D 모델 데이터를 교환하기 위한 국제 표준 포맷입니다.

```
표준명  : ISO 10303
확장자  : .step, .stp
형태    : 순수 텍스트 (ASCII)
본 파일 : AP214 (자동차/기계 분야 표준)
생성 도구: SolidWorks 2018
```

STEP은 텍스트 파일이기 때문에 메모장, VS Code 등으로 열어 내부 구조를 분석할 수 있습니다.

---

## 3.2 STEP 파일 헤더 분석

파일 상단의 HEADER 섹션에서 기본 정보를 확인합니다.

```
ISO-10303-21;
HEADER;
FILE_DESCRIPTION (( 'STEP AP214' ), '1' );
FILE_NAME ('SG90 - Micro Servo 9g - Tower Pro.STEP',
    '2019-03-11T10:24:25',   ← 생성일시
    ( '' ),
    ( '' ),
    'SwSTEP 2.0',            ← SolidWorks STEP 내보내기 버전
    'SolidWorks 2018',       ← 원본 CAD 소프트웨어
    '' );
FILE_SCHEMA (( 'AUTOMOTIVE_DESIGN' ));  ← AP214 스키마
ENDSEC;
```

---

## 3.3 파트 구성 분석 (PRODUCT 엔터티)

STEP 파일에서 파트(부품) 정보는 `PRODUCT` 엔터티로 정의됩니다.

### 실제 파일에서 추출한 PRODUCT 목록

```
#1989  = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro', ...)
         → 최상위 어셈블리 루트

#21480 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.2_Pe...' )
         → 파트 2 (Pe = Part)

#21898 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.1_Pe...' )
         → 파트 1

#22317 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.5_BS EN ISO 7045 - M2 x 8 - Z - 8S', ...)
         → 나사 M2×8 (ISO 표준 나사)

#27162 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.3_Pe...' )
         → 파트 3

#51623 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.4_Pe...' )
         → 파트 4

#61031 = PRODUCT ( 'SG90 - Micro Servo 9g - Tower Pro.6_BS EN ISO 7045 - M2 x 4 - Z - 4S', ...)
         → 나사 M2×4 (ISO 표준 나사)
```

### 파트 역할 추정표

| STEP ID | 파트 번호 | 추정 역할 | Blender 이름 (예정) |
|---------|----------|---------|-------------------|
| #21898 | 1_Pe | 서보 본체 하우징 (Body) | `sg90_body` |
| #21480 | 2_Pe | 혼 / 출력축 어셈블리 (Horn) | `sg90_horn` |
| #27162 | 3_Pe | 하단 캡 또는 기어 케이스 | `sg90_bottom` |
| #51623 | 4_Pe | 상단 커버 또는 브래킷 | `sg90_top` |
| #22317 | 5_Screw | M2×8 십자 나사 | `sg90_screw_long` |
| #61031 | 6_Screw | M2×4 십자 나사 | `sg90_screw_short` |

> ⚠️ 추정 역할은 Blender 임포트 후 실제 형상을 보고 확정합니다.

---

## 3.4 STEP 파일 핵심 엔터티 설명

SG90 STEP 파일에서 자주 등장하는 엔터티의 역할을 이해합니다.

```
CARTESIAN_POINT     : 3D 좌표 점 (x, y, z)
DIRECTION           : 방향 벡터
AXIS2_PLACEMENT_3D  : 3D 공간에서 축 배치 (위치 + 방향)
LINE / CIRCLE / PLANE : 기하 요소 (선, 원, 평면)
EDGE_CURVE          : 모서리 곡선
FACE_OUTER_BOUND    : 면의 외곽 경계
ADVANCED_FACE       : 곡면 (파라메트릭 면)
PRODUCT             : 파트/어셈블리 이름 및 정의
PRODUCT_DEFINITION  : 파트의 형상 참조
```

---

## 3.5 좌표 단위 확인

```
STEP AP214의 기본 단위: mm (밀리미터)

CARTESIAN_POINT 예시:
  #12 = CARTESIAN_POINT ('NONE', (-3.95, -10.65, 2.40))
                                   ↑       ↑      ↑
                                  X(mm)  Y(mm)  Z(mm)

SG90 본체 크기 검증:
  파일 내 좌표 범위를 통해 약 22mm × 12mm × 31mm 범위 확인
  → 실제 SG90 스펙 일치
```

---

## 3.6 STEP 파일을 텍스트로 직접 분석하는 방법

### VS Code에서 분석

```bash
# VS Code로 STEP 파일 열기
code "SG90 - Micro Servo 9g - Tower Pro.STEP"

# Ctrl+F → "PRODUCT" 검색으로 파트 이름 확인
# Ctrl+F → "CARTESIAN_POINT" 검색으로 좌표 범위 파악
```

### 터미널(bash)에서 분석

```bash
# PRODUCT 엔터티만 추출
grep "^#.*= PRODUCT" "SG90 - Micro Servo 9g - Tower Pro.STEP"

# 파일 통계
wc -l "SG90 - Micro Servo 9g - Tower Pro.STEP"
# → 66,691줄

wc -c "SG90 - Micro Servo 9g - Tower Pro.STEP"
# → 5,321,945바이트 (약 5.3MB)

# CARTESIAN_POINT 개수 (복잡도 파악)
grep -c "CARTESIAN_POINT" "SG90 - Micro Servo 9g - Tower Pro.STEP"
```

---

## 3.7 SolidWorks에서 직접 STEP 파일 확인 (SolidWorks가 있는 경우)

SolidWorks가 설치되어 있다면, 원본 어셈블리를 직접 열어 파트 구성을 확인하고  
더 정밀한 제어를 위해 개별 파트로 STEP 파일을 분리 저장할 수 있습니다.

```
SolidWorks → 파일 열기 → SG90...STEP 선택

Feature Manager (좌측 트리)에서 파트 확인:
  └─ sg90_assembly
      ├─ sg90_body<1>      ← 본체
      ├─ sg90_horn<1>      ← 혼 (회전 파트)
      ├─ sg90_bottom<1>    ← 하단
      ├─ sg90_top<1>       ← 상단
      ├─ M2x8_screw<1>     ← 나사
      └─ M2x4_screw<1>     ← 나사
```

**파트별로 개별 STEP 파일 내보내기 (고급):**

```
각 파트를 개별 선택 → 오른쪽 클릭 → Open Part
→ File → Save As → STEP AP214
→ 파일명 규칙: sg90_body.step, sg90_horn.step …

장점: Blender에서 파트별 임포트 → 파트 분리 작업 불필요
단점: SolidWorks 라이선스 필요
```

---

## 3.8 다음 단계 준비

STEP 파일 분석을 완료했으면 다음을 준비합니다.

```
□ STEP 파일의 파트 구성 (6개 파트) 이해 완료
□ 어느 파트가 "혼(Horn)"인지 잠정 파악
□ Blender 또는 FreeCAD로 STEP → OBJ 변환 준비
□ 변환된 파일을 sg90-servo-viewer/public/ 폴더에 준비
```

---

← [02. 개발 환경](./02_environment.md) | 다음 → [04. Blender 임포트](./04_blender_import.md)
