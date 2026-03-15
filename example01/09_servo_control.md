# 09. 서보 각도 제어 로직

← [08. Three.js 뷰어](./08_threejs_viewer.md) | 다음 → [10. 실행 및 테스트](./10_run_test.md)

---

## 9.1 좌표계 이해

### SolidWorks / Blender 좌표계

```
Blender (GLB +Y Up 내보내기 후):
  Y축 ↑ : 위 (Up)
  Z축 ↑ : 앞 (Front)
  X축 → : 오른쪽 (Right)

SG90 샤프트 방향:
  → Y축 방향 (위쪽)으로 뻗음
  → hornMesh.rotation.y 로 회전 제어
```

### Three.js 좌표계

```
Three.js 기본:
  Y축 ↑ : 위
  Z축 → 화면 앞 (앞)
  X축 → : 오른쪽

GLB 파일이 +Y Up 옵션으로 내보내졌으면
Blender와 Three.js 좌표계가 일치함
```

---

## 9.2 각도 → 라디안 변환

SG90의 동작 범위 `0° ~ 180°`를 Three.js rotation.y 값으로 변환합니다.

```javascript
// 90°(중립)을 0 라디안으로 정규화
// 0°  → -π/2 rad (= -90°)
// 90° →  0   rad
// 180°→ +π/2 rad (= +90°)

function degToRad(deg) {
    return THREE.MathUtils.degToRad(deg - 90);
}

// 사용 예
hornMesh.rotation.y = degToRad(0);    // → -1.5708 rad
hornMesh.rotation.y = degToRad(90);   // → 0 rad
hornMesh.rotation.y = degToRad(180);  // → +1.5708 rad
```

### 변환 테이블

| 서보 각도 | Three.js rotation.y | 설명 |
|---------|-------------------|------|
| 0°      | -π/2 (-1.5708 rad) | 최소각 |
| 45°     | -π/4 (-0.7854 rad) | 좌측 45° |
| 90°     | 0 rad              | 중립 (기본) |
| 135°    | +π/4 (+0.7854 rad) | 우측 45° |
| 180°    | +π/2 (+1.5708 rad) | 최대각 |

---

## 9.3 보간(Lerp) 애니메이션

실제 SG90은 즉시 이동하지 않고 일정 속도로 회전합니다.  
Three.js에서도 보간(Lerp)으로 부드러운 이동을 구현합니다.

```javascript
// 변수 선언
let targetAngle  = 90;   // 목표 각도 (UI에서 설정)
let currentAngle = 90;   // 현재 각도 (매 프레임 갱신)

// animate() 루프 내에서 실행
function animate() {
    requestAnimationFrame(animate);

    const speed = parseFloat(speedSel.value);  // 0.02 ~ 1.0
    const diff  = targetAngle - currentAngle;

    if (Math.abs(diff) > 0.05) {
        // Lerp: 현재 → 목표를 speed 비율만큼 이동
        currentAngle += diff * Math.min(speed, 1.0);
        hornMesh.rotation.y = degToRad(currentAngle);
    }

    controls.update();
    renderer.render(scene, camera);
}
```

### 속도값에 따른 동작 차이

```
speed = 0.02  → 매 프레임 차이의 2% 이동  → 매우 느림 (교육 관찰용)
speed = 0.05  → 매 프레임 차이의 5% 이동  → 보통
speed = 0.15  → 매 프레임 차이의 15% 이동 → 빠름
speed = 1.00  → 매 프레임 목표에 도달     → 즉시
```

---

## 9.4 스윕(Sweep) 자동 왕복 모드

```javascript
let sweeping = false;    // 스윕 활성 여부
let sweepDir = 1;        // 방향 (+1 or -1)

// animate() 루프 내
if (sweeping) {
    targetAngle += sweepDir * 1.2;   // 1.2°/프레임 이동

    if (targetAngle >= 180) { targetAngle = 180; sweepDir = -1; }
    if (targetAngle <=   0) { targetAngle =   0; sweepDir =  1; }

    slider.value = Math.round(targetAngle);
    angleDisp.textContent = `${Math.round(targetAngle)}°`;
}
```

---

## 9.5 실제 SG90 PWM 신호와의 비교

3D 뷰어는 시각적 시뮬레이션이지만, 실제 하드웨어 제어 시 아래 값과 매핑됩니다.

| 각도 | Three.js rotation.y | PWM 펄스폭 | 실제 예시 |
|------|-------------------|-----------|---------|
| 0°   | -π/2 rad | 500μs  | 최소 회전 |
| 90°  | 0 rad    | 1500μs | 중립 위치 |
| 180° | +π/2 rad | 2400μs | 최대 회전 |

### Raspberry Pi에서 실제 SG90 제어 예시 (참고)

```python
# Raspberry Pi GPIO - pigpio 라이브러리 사용
import pigpio
import time

pi  = pigpio.pi()
PIN = 18  # 서보 신호 핀 (BCM 번호)

def set_servo_angle(angle):
    """각도(0~180) → PWM 펄스폭(500~2400μs) 변환"""
    pulse = 500 + (angle / 180.0) * 1900
    pi.set_servo_pulsewidth(PIN, pulse)

# 중립(90°)으로 이동
set_servo_angle(90)
time.sleep(1)

# 0° → 180° 스윕
for angle in range(0, 181, 5):
    set_servo_angle(angle)
    time.sleep(0.05)
```

---

## 9.6 회전 축 방향이 틀릴 때 수정 방법

Blender에서 어떻게 내보냈느냐에 따라 회전 축이 다를 수 있습니다.

```javascript
// 테스트: 각 축으로 회전해보고 올바른 축 찾기

// Y축 회전 (기본 시도)
hornMesh.rotation.y = degToRad(currentAngle);

// X축 회전 (수평 샤프트인 경우)
hornMesh.rotation.x = degToRad(currentAngle);

// Z축 회전
hornMesh.rotation.z = degToRad(currentAngle);
```

```
판별 기준:
  - 슬라이더를 0°~180°로 움직일 때
  - 혼이 제자리에서 회전하면 ✅ 올바른 축
  - 혼이 원을 그리며 공전하면 ❌ Origin 위치 문제
  - 혼이 전혀 안 움직이면 ❌ 다른 축 시도
  - hornMesh가 null이면 ❌ 파트 이름 불일치
```

---

## 9.7 디버깅 코드

브라우저 콘솔(F12)에서 확인하는 디버깅 코드:

```javascript
// GLB 로드 후 씬 트리 전체 출력
gltf.scene.traverse((child) => {
    console.log(
        '  '.repeat(getDepth(child)),
        `[${child.type}]`,
        child.name || '(unnamed)',
        child.isMesh ? `v=${child.geometry.attributes.position.count}` : ''
    );
});

// 혼의 현재 rotation 값 실시간 확인
// 콘솔에서 직접 실행:
// hornMesh.rotation.y  // 라디안 값
// THREE.MathUtils.radToDeg(hornMesh.rotation.y)  // 도(°) 값
```

---

← [08. Three.js 뷰어](./08_threejs_viewer.md) | 다음 → [10. 실행 및 테스트](./10_run_test.md)
