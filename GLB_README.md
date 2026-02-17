# GLB (GL Binary) 파일 포맷 완벽 가이드

[![glTF](https://img.shields.io/badge/glTF-2.0-green.svg)](https://www.khronos.org/gltf/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **"3D의 JPEG"** - 웹에 최적화된 3D 모델 전송 형식

## 📑 목차

- [GLB란?](#glb란)
- [GLB vs GLTF](#glb-vs-gltf)
- [파일 구조](#파일-구조)
- [포함 내용](#포함-내용)
- [생성 방법](#생성-방법)
- [뷰어/편집 도구](#뷰어편집-도구)
- [코드 예제](#코드-예제)
- [최적화 팁](#최적화-팁)
- [장단점](#장단점)
- [리소스](#리소스)

---

## 🎯 GLB란?

**GLB (GL Binary)**는 glTF 2.0의 바이너리 버전으로, 3D 모델을 단일 파일로 패키징한 형식입니다.

- **개발**: Khronos Group (OpenGL, Vulkan 제작)
- **목적**: 웹 및 모바일 환경에서 효율적인 3D 콘텐츠 전송
- **표준**: ISO/IEC 12113:2022
- **버전**: 현재 glTF 2.0

### 주요 특징

✅ 단일 바이너리 파일  
✅ 작은 파일 크기  
✅ 빠른 로딩 속도  
✅ PBR 재질 지원  
✅ 애니메이션 내장 가능  
✅ 모든 주요 플랫폼 지원  

---

## 📊 GLB vs GLTF

| 특징 | GLB (.glb) | GLTF (.gltf) |
|------|-----------|--------------|
| **파일 구조** | 단일 바이너리 | 여러 파일 (JSON + bin + 텍스처) |
| **파일 크기** | 작음 | 큼 |
| **HTTP 요청** | 1회 | 여러 번 |
| **로딩 속도** | ⚡ 빠름 | 느림 |
| **편집 가능성** | 어려움 (바이너리) | 쉬움 (텍스트 JSON) |
| **웹 배포** | ✅ 권장 | 개발용만 권장 |
| **디버깅** | 어려움 | 쉬움 |

### 사용 시나리오

```
GLB 사용:
✅ 웹/모바일 앱 배포
✅ 프로덕션 환경
✅ AR/VR 애플리케이션
✅ 게임 에셋

GLTF 사용:
🔧 개발 중
🔧 디버깅 필요 시
🔧 버전 관리 (Git)
```

---

## 🏗️ 파일 구조

GLB 파일은 다음과 같은 구조를 가집니다:

```
┌─────────────────────────────────────┐
│ Header (12 bytes)                   │
│ ┌─────────────────────────────────┐ │
│ │ Magic: 0x46546C67 ("glTF")      │ │
│ │ Version: 2                       │ │
│ │ Length: Total file size          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Chunk 0: JSON (Scene Description)   │
│ ┌─────────────────────────────────┐ │
│ │ - Scenes                         │ │
│ │ - Nodes (hierarchy)              │ │
│ │ - Meshes                         │ │
│ │ - Materials (PBR)                │ │
│ │ - Textures                       │ │
│ │ - Animations                     │ │
│ │ - Cameras                        │ │
│ │ - Accessors (data pointers)      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Chunk 1: Binary Buffer (Raw Data)   │
│ ┌─────────────────────────────────┐ │
│ │ - Vertex data                    │ │
│ │ - Normals                        │ │
│ │ - UV coordinates                 │ │
│ │ - Embedded textures (PNG/JPEG)   │ │
│ │ - Animation keyframes            │ │
│ │ - Morph targets                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Header 세부사항

```c
struct GLBHeader {
    uint32_t magic;      // 0x46546C67 (ASCII: "glTF")
    uint32_t version;    // glTF version (2)
    uint32_t length;     // Total file size in bytes
};
```

---

## 📦 포함 내용

### ✅ 지원되는 데이터

| 타입 | 설명 |
|------|------|
| **Geometry** | 버텍스, 노말, UV, 컬러 |
| **Materials** | PBR 재질 (메탈릭/러프니스) |
| **Textures** | PNG, JPEG (내장 가능) |
| **Animations** | 키프레임, 보간 |
| **Skinning** | 본 구조, 웨이트 |
| **Morph Targets** | Blend Shapes |
| **Cameras** | Perspective/Orthographic |
| **Lights** | Directional, Point, Spot (확장) |
| **Hierarchy** | 부모-자식 관계 (Nodes) |

### ❌ 미지원 항목

- 물리 시뮬레이션
- 커스텀 스크립트/로직
- 파티클 시스템
- 복잡한 셰이더 (GLSL 제외)
- 포스트 프로세싱

---

## 🔧 생성 방법

### 1. Blender (무료, 권장)

```
1. File → Export → glTF 2.0 (.glb/.gltf)

2. 설정:
   ✅ Format: glTF Binary (.glb)
   ✅ Include: Selected Objects
   ✅ Transform: +Y Up
   ✅ Geometry: Apply Modifiers
   ✅ Compression: None (또는 Draco)
   
3. Export glTF 2.0 클릭
```

**최적 설정:**
```
Mesh:
  ✅ UVs
  ✅ Normals
  ✅ Tangents
  ✅ Vertex Colors
  
Material:
  ✅ Materials
  ✅ Images
  
Animation:
  ✅ Animations (필요 시)
  ✅ Shape Keys (필요 시)
```

### 2. 3ds Max

```
1. glTF Exporter 플러그인 설치
2. File → Export → glTF
3. Binary (.glb) 선택
```

### 3. Maya

```
1. File → Export All
2. File type: glTF Export
3. Options: Binary format
```

### 4. 온라인 변환 도구

| 서비스 | URL | 지원 형식 |
|--------|-----|----------|
| **Aspose** | https://products.aspose.app/3d/conversion | FBX, OBJ, STL → GLB |
| **AnyConv** | https://anyconv.com/gltf-to-glb-converter/ | GLTF → GLB |
| **Blackthread** | https://products.aspose.com/3d/conversion/ | 다양한 형식 |

### 5. 명령줄 (gltf-transform)

```bash
# 설치
npm install -g @gltf-transform/cli

# GLTF → GLB 변환
gltf-transform copy model.gltf model.glb

# Draco 압축 적용
gltf-transform draco model.glb compressed.glb
```

---

## 🖥️ 뷰어/편집 도구

### 온라인 뷰어

| 도구 | URL | 특징 |
|------|-----|------|
| **glTF Viewer** | https://gltf-viewer.donmccurdy.com/ | 빠르고 가벼움 |
| **Babylon.js Sandbox** | https://sandbox.babylonjs.com/ | 상세 정보 표시 |
| **Three.js Editor** | https://threejs.org/editor/ | 씬 편집 가능 |
| **Sketchfab** | https://sketchfab.com | 업로드 필요 |

### 데스크톱 소프트웨어

```
무료:
  ✅ Blender - 완전한 편집 기능
  ✅ Paint 3D (Windows) - 기본 뷰어
  
유료:
  💰 Substance Painter - 텍스처링
  💰 3ds Max / Maya - 전문가용
  💰 Cinema 4D - 모션 그래픽
```

### 개발 도구

**VS Code 확장:**
```
glTF Tools by Cesium
- GLB 미리보기
- JSON 유효성 검사
- 3D 뷰어 내장
```

**Chrome DevTools:**
```
Three.js Inspector
- 씬 계층 구조
- 재질 편집
- 성능 분석
```

---

## 💻 코드 예제

### Three.js (JavaScript)

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 씬 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// GLB 로드
const loader = new GLTFLoader();
loader.load(
    'model.glb',
    (gltf) => {
        // 성공
        scene.add(gltf.scene);
        
        // 애니메이션
        if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(gltf.scene);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }
        
        // 씬 순회
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                console.log(child.name);
                child.castShadow = true;
            }
        });
    },
    (progress) => {
        // 로딩 진행률
        console.log((progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        // 에러
        console.error('Error loading GLB:', error);
    }
);

// 렌더링 루프
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
```

### Babylon.js

```javascript
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

BABYLON.SceneLoader.Append('', 'model.glb', scene, (scene) => {
    const camera = new BABYLON.ArcRotateCamera(
        'camera',
        0, 0, 10,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);
    
    const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
});

engine.runRenderLoop(() => {
    scene.render();
});
```

### Python (trimesh)

```python
import trimesh
import numpy as np

# GLB 로드
scene = trimesh.load('model.glb')

# 정보 출력
print(f"Geometries: {len(scene.geometry)}")
for name, geom in scene.geometry.items():
    print(f"  {name}: {len(geom.vertices)} vertices")

# 메시 추출
mesh = scene.dump(concatenate=True)
print(f"Total vertices: {len(mesh.vertices)}")
print(f"Total faces: {len(mesh.faces)}")

# 내보내기
mesh.export('output.obj')
```

### Unity (C#)

```csharp
using GLTFast;
using UnityEngine;

public class GLBLoader : MonoBehaviour
{
    async void Start()
    {
        var gltf = new GltfImport();
        bool success = await gltf.Load("model.glb");
        
        if (success)
        {
            await gltf.InstantiateMainSceneAsync(transform);
            Debug.Log("GLB loaded successfully");
        }
        else
        {
            Debug.LogError("Loading failed");
        }
    }
}
```

### React Three Fiber

```jsx
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/model.glb');
  return <primitive object={scene} />;
}

function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} />
      <Model />
    </Canvas>
  );
}
```

---

## 🚀 최적화 팁

### 1. Draco 압축

Draco는 Google에서 개발한 3D 메시 압축 알고리즘으로 **90%까지 파일 크기 감소** 가능합니다.

```javascript
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('compressed.glb', (gltf) => {
    scene.add(gltf.scene);
});
```

**명령줄:**
```bash
gltf-transform draco input.glb output.glb --quantize 14
```

### 2. 텍스처 최적화

```bash
# 텍스처 크기 줄이기
gltf-transform resize input.glb output.glb --width 1024 --height 1024

# 불필요한 텍스처 제거
gltf-transform dedup input.glb output.glb

# JPEG로 변환 (투명도 없는 경우)
gltf-transform etc1s input.glb output.glb --quality 50
```

**권장 텍스처 크기:**
```
모바일: 512x512 ~ 1024x1024
데스크톱: 1024x1024 ~ 2048x2048
고품질: 2048x2048 ~ 4096x4096
```

### 3. 메시 단순화

**Blender Decimate Modifier:**
```
1. Mesh 선택
2. Add Modifier → Decimate
3. Ratio: 0.5 (50% 폴리곤 감소)
4. Apply Modifier
```

**명령줄 (gltf-transform):**
```bash
gltf-transform simplify input.glb output.glb --ratio 0.5
```

### 4. 불필요한 데이터 제거

```bash
# 애니메이션 제거
gltf-transform prune input.glb output.glb --unused

# 빈 노드 제거
gltf-transform flatten input.glb output.glb

# 중복 제거
gltf-transform dedup input.glb output.glb
```

### 5. 최적화 체크리스트

```
✅ Draco 압축 적용
✅ 텍스처 크기 최소화 (POT: Power of Two)
✅ 불필요한 UV 맵 제거
✅ LOD (Level of Detail) 생성
✅ 중복 버텍스 병합
✅ 사용하지 않는 애니메이션 제거
✅ 압축된 텍스처 포맷 사용 (KTX2, Basis)
```

### 성능 비교

| 최적화 | 원본 | 최적화 후 | 감소율 |
|--------|------|----------|--------|
| **Draco 압축** | 10 MB | 1 MB | 90% |
| **텍스처 리사이즈** | 15 MB | 5 MB | 67% |
| **메시 단순화** | 100K tris | 50K tris | 50% |
| **종합** | 25 MB | 3 MB | 88% |

---

## ⚖️ 장단점

### ✅ 장점

| 장점 | 설명 |
|------|------|
| **웹 최적화** | 작은 파일 크기, 빠른 로딩 |
| **단일 파일** | 배포 및 관리 편의성 |
| **표준 형식** | 모든 플랫폼에서 지원 |
| **PBR 재질** | 사실적인 렌더링 |
| **압축 지원** | Draco, KTX2 등 |
| **확장성** | 커스텀 데이터 추가 가능 |
| **무료** | 로열티 없음 |

### ❌ 단점

| 단점 | 설명 |
|------|------|
| **편집 어려움** | 바이너리라 직접 수정 불가 |
| **파일 크기** | 복잡한 모델은 여전히 큼 |
| **제한된 기능** | 고급 셰이더, 물리 미지원 |
| **학습 곡선** | 초보자에게 어려울 수 있음 |
| **버전 호환성** | 구형 뷰어는 glTF 2.0 미지원 |

---

## 🔍 파일 분석

### 명령줄 도구

```bash
# gltf-transform 설치
npm install -g @gltf-transform/cli

# 파일 정보 확인
gltf-transform inspect model.glb

# 출력 예시:
# ┌──────────────────┬────────┐
# │ Property         │ Value  │
# ├──────────────────┼────────┤
# │ Scenes           │ 1      │
# │ Nodes            │ 45     │
# │ Meshes           │ 12     │
# │ Materials        │ 8      │
# │ Textures         │ 16     │
# │ Animations       │ 3      │
# │ File size        │ 5.2 MB │
# └──────────────────┴────────┘

# 유효성 검사
gltf-transform validate model.glb
```

### Python 스크립트

```python
import struct
import json

def analyze_glb(filename):
    with open(filename, 'rb') as f:
        # Header 읽기
        magic = struct.unpack('I', f.read(4))[0]
        version = struct.unpack('I', f.read(4))[0]
        length = struct.unpack('I', f.read(4))[0]
        
        print(f"Magic: {hex(magic)} ({''.join(chr(b) for b in struct.pack('I', magic))})")
        print(f"Version: {version}")
        print(f"File Size: {length:,} bytes ({length/1024/1024:.2f} MB)")
        
        # JSON Chunk
        chunk_length = struct.unpack('I', f.read(4))[0]
        chunk_type = struct.unpack('I', f.read(4))[0]
        
        if chunk_type == 0x4E4F534A:  # "JSON"
            json_data = f.read(chunk_length).decode('utf-8')
            gltf = json.loads(json_data)
            
            print(f"\nScenes: {len(gltf.get('scenes', []))}")
            print(f"Nodes: {len(gltf.get('nodes', []))}")
            print(f"Meshes: {len(gltf.get('meshes', []))}")
            print(f"Materials: {len(gltf.get('materials', []))}")
            print(f"Textures: {len(gltf.get('textures', []))}")
            print(f"Animations: {len(gltf.get('animations', []))}")

analyze_glb('model.glb')
```

---

## 📚 리소스

### 공식 문서

- **glTF 공식 사이트**: https://www.khronos.org/gltf/
- **glTF Specification**: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- **glTF GitHub**: https://github.com/KhronosGroup/glTF

### 샘플 모델

- **Khronos Sample Models**: https://github.com/KhronosGroup/glTF-Sample-Models
- **Sketchfab**: https://sketchfab.com/features/gltf
- **Poly Haven**: https://polyhaven.com/

### 라이브러리

| 언어 | 라이브러리 | GitHub |
|------|-----------|--------|
| **JavaScript** | Three.js | https://github.com/mrdoob/three.js |
| **JavaScript** | Babylon.js | https://github.com/BabylonJS/Babylon.js |
| **Python** | trimesh | https://github.com/mikedh/trimesh |
| **C#** | UnityGLTF | https://github.com/KhronosGroup/UnityGLTF |
| **C++** | tinygltf | https://github.com/syoyo/tinygltf |

### 튜토리얼

- **Three.js GLB Tutorial**: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- **Blender glTF Export**: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- **glTF Tutorials**: https://github.khronos.org/glTF-Tutorials/

### 도구

- **gltf-transform**: https://gltf-transform.donmccurdy.com/
- **glTF Viewer**: https://gltf-viewer.donmccurdy.com/
- **Draco 3D**: https://github.com/google/draco

---

## 🤝 기여

이 문서에 기여하고 싶으시다면:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 문서는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📧 문의

질문이나 제안사항이 있으시면 이슈를 생성하거나 이메일로 연락주세요.

---

**Made with ❤️ for the 3D community**

Last updated: 2026-02-17
