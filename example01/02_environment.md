# 02. 개발 환경 설치

← [01. 프로젝트 개요](./01_overview.md) | 다음 → [03. SolidWorks STEP 분석](./03_solidworks.md)

---

## 2.1 필요 소프트웨어 목록

| 소프트웨어 | 권장 버전 | 용도 | 비고 |
|-----------|----------|------|------|
| SolidWorks | 2018 이상 | 원본 3D 모델 확인 | 라이선스 필요 (STEP 파일만 있으면 생략 가능) |
| **Blender** | **3.6 LTS** | STEP → GLB 변환 | 무료 / 필수 |
| **Node.js** | **18.x LTS** | 웹 서버 실행 | 무료 / 필수 |
| VS Code | 최신 | 코드 편집 | 무료 / 권장 |
| Chrome 또는 Edge | 최신 | 3D 뷰어 실행 | WebGL 필수 |

---

## 2.2 Blender 설치 및 확인

### 설치

```
공식 사이트: https://www.blender.org/download/lts/3-6/

Windows : .msi 설치 파일 실행
macOS   : .dmg 마운트 후 Applications 폴더로 이동
Linux   : 공식 tar.xz 압축 해제 또는 snap install blender
```

### 버전 확인

```
Blender 실행 → 상단 메뉴 Help → About Blender
버전: 3.6.x LTS  ← LTS 버전 권장
```

### 필수 애드온 확인 (기본 내장)

```
Edit → Preferences → Add-ons 탭
검색창에 "gltf" 입력

✅ Import-Export: glTF 2.0 format   ← 반드시 활성화 확인
```

> ⚠️ 이 애드온이 비활성화되어 있으면 GLB 내보내기 메뉴가 표시되지 않습니다.

### STEP 임포트 애드온 설치 (선택 — Blender 기본 미포함)

Blender 3.6에는 STEP 직접 임포트 기능이 없습니다.  
아래 두 가지 방법 중 하나를 선택합니다.

**방법 A : FreeCAD 경유 변환 (권장)**

```
FreeCAD 설치: https://www.freecad.org/downloads.php

순서:
1. FreeCAD 실행
2. File → Open → SG90...STEP 선택
3. File → Export → Wavefront OBJ (*.obj) 선택
4. 내보내기 옵션:
   ✅ Export per shape  (파트별 분리)
   파일명: sg90_assembly.obj 저장
5. Blender에서 OBJ 임포트
```

**방법 B : online-convert 활용** <- 기능 확인 안됨.

```
https://www.online-convert.com
STEP → OBJ 온라인 변환 후 Blender에서 임포트
(파일 크기 100MB 미만 무료)
```

**방법 C : CAD Assistant (Desktop 앱)** 

```
OPEN CASCADE 제공 무료 뷰어/변환기
https://www.opencascade.com/products/cad-assistant/

STEP 파일 열기 → Export as → OBJ / glTF 직접 변환 가능
```

---

## 2.3 Node.js 설치 및 확인

### Windows

```
공식 사이트: https://nodejs.org
LTS 버전 (18.x) 설치 파일(.msi) 실행
설치 시 "Add to PATH" 옵션 반드시 체크
```

### macOS

```bash
# Homebrew 사용 (권장)
brew install node@18
brew link node@18

# 또는 공식 .pkg 인스톨러 사용
```

### Linux (Ubuntu / Debian)

```bash
# NodeSource 저장소 추가 후 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 설치 확인

```bash
node --version
# v18.x.x  ← 18 이상 확인

npm --version
# 9.x.x
```

---

## 2.4 VS Code 설치 및 권장 확장

```
공식 사이트: https://code.visualstudio.com

권장 확장 (Extensions):
- ESLint                  : JavaScript 코드 검사
- Prettier                : 코드 자동 포맷
- Live Server             : 정적 HTML 빠른 미리보기 (개발 보조)
- glTF Tools              : GLB/GLTF 파일 뷰어 · 구조 확인
- Korean Language Pack    : 한국어 UI
```

### glTF Tools 확장 사용법

VS Code에서 `.glb` 파일을 오른쪽 클릭 → **"glTF: Inspect"**  
→ 메시 이름, 재질, 노드 계층 구조를 JSON 형태로 확인 가능

---

## 2.5 프로젝트 폴더 초기 설정

```bash
# 프로젝트 폴더 생성
mkdir sg90-servo-viewer
cd sg90-servo-viewer

# package.json 생성
npm init -y

# public 폴더 생성 (정적 파일 서빙 위치)
mkdir public

# 파일 배치
# sg90-servo-viewer/
# ├── server.js          ← 07단계에서 작성
# ├── package.json
# └── public/
#     ├── index.html     ← 08단계에서 작성
#     ├── analyze_glb.html
#     └── sg90_servo.glb ← 05단계에서 Blender로 생성
```

### package.json 스크립트 추가

```json
{
  "name": "sg90-servo-viewer",
  "version": "1.0.0",
  "description": "SG90 Micro Servo 3D Interactive Viewer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "keywords": ["sg90", "servo", "three.js", "glb", "nodejs"],
  "license": "MIT"
}
```

> `node --watch`는 Node.js 18.11 이상에서 파일 변경 시 자동 재시작 (nodemon 대체)

---

## 2.6 환경 확인 체크리스트

```
□ Blender 3.6 LTS 설치 완료
□ Blender → Add-ons → glTF 2.0 활성화 확인
□ FreeCAD 또는 CAD Assistant 설치 (STEP→OBJ 변환용)
□ Node.js 18.x 설치 완료 (node --version으로 확인)
□ VS Code 설치 + glTF Tools 확장 설치
□ 프로젝트 폴더 구조 생성 완료
□ SG90...STEP 파일을 작업 폴더에 복사
```

---

← [01. 프로젝트 개요](./01_overview.md) | 다음 → [03. SolidWorks STEP 분석](./03_solidworks.md)
