/**
 * =========================================================================
 * 📁 CẤU HÌNH DANH SÁCH ẢNH TẠI ĐÂY (IMAGE CONFIGURATION)
 * =========================================================================
 * - Điền đường dẫn file ảnh trong thuộc tính 'src'.
 * - Điền tên tác phẩm trong thuộc tính 'title'.
 * =========================================================================
 */
const danhSachAnh = [
  {
    src: './danhsachanh/photo_2026-09-07_15-27-51.jpg',
    title: 'Tuấn Hoàng'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-01.jpg',
    title: 'Long cầy'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-10.jpg',
    title: 'Thích Minh Tuệ'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-15.jpg',
    title: 'Thiên đao'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-39.jpg',
    title: 'Việt Đức'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-47.jpg',
    title: 'Khang hentai'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-28-55.jpg',
    title: 'Phú Lê'
  },
  {
    src: './danhsachanh/photo_2026-09-07_15-29-05.jpg',
    title: 'Hoàng gà tre'
  }
];

// =========================================================================
// THÔNG SỐ HỆ THỐNG ĐƯỜNG HẦM 3D (3D TUNNEL ENGINE CONFIG)
// =========================================================================
const CONFIG = {
  // Khoảng cách giữa 2 bức ảnh liên tiếp dọc trục Z (pixel)
  zSpacingDesktop: 950,
  zSpacingMobile: 750,

  // Khoảng cách ban đầu từ camera đến bức ảnh đầu tiên
  startZOffset: 650,

  // Khoảng cách giữa các vành đai đường hầm
  ringSpacing: 160,

  // Độ lệch hai bên thành đường hầm (trái / phải)
  wallOffsetDesktop: 360,
  wallOffsetMobile: 130,

  // Góc nghiêng của khung tranh hướng vào tâm đường hầm
  tiltAngleDesktop: 20,
  tiltAngleMobile: 10,

  // Độ mượt cuộn nội suy Lerp (0.08: rất êm và tự nhiên)
  lerpEase: 0.08,

  // Hệ số nhạy lăn chuột
  wheelMultiplier: 1.3,

  // Giới hạn tầm nhìn sương mù trong đường hầm
  fogFar: 3400,
  fogFadeStart: 2200,
  fadePassCamera: 220
};

// =========================================================================
// TRẠNG THÁI KHÔNG GIAN
// =========================================================================
let currentZ = 0;
let targetZ = 0;
let maxScrollZ = 0;

let zSpacing = CONFIG.zSpacingDesktop;
let wallOffset = CONFIG.wallOffsetDesktop;
let tiltAngle = CONFIG.tiltAngleDesktop;

// Parallax góc nhìn chuột
let targetCamRotX = 0;
let targetCamRotY = 0;
let currentCamRotX = 0;
let currentCamRotY = 0;

// Kéo chuột & Vuốt cảm ứng
let isDragging = false;
let dragStartY = 0;
let dragStartTargetZ = 0;
let touchStartY = 0;
let lastTouchY = 0;
let touchVelocity = 0;

// Phần tử DOM
const viewportEl = document.getElementById('viewport');
const cameraRigEl = document.getElementById('camera-rig');
const tunnelEl = document.getElementById('tunnel');

let ringItems = [];
let photoItems = [];

// =========================================================================
// 1. TẠO HỆ THỐNG ĐƯỜNG HẦM 3D & KHUNG TRANH
// =========================================================================
function updateResponsiveParams() {
  const isMobile = window.innerWidth <= 768;
  zSpacing = isMobile ? CONFIG.zSpacingMobile : CONFIG.zSpacingDesktop;
  wallOffset = isMobile ? CONFIG.wallOffsetMobile : CONFIG.wallOffsetDesktop;
  tiltAngle = isMobile ? CONFIG.tiltAngleMobile : CONFIG.tiltAngleDesktop;
  maxScrollZ = (danhSachAnh.length - 1) * zSpacing + 300;
}

function buildTunnel() {
  updateResponsiveParams();
  tunnelEl.innerHTML = '';
  ringItems = [];
  photoItems = [];

  const totalDepth = CONFIG.startZOffset + danhSachAnh.length * zSpacing + 1200;
  const numRings = Math.ceil(totalDepth / CONFIG.ringSpacing);
  const isMobile = window.innerWidth <= 768;
  const tunnelRadius = isMobile ? 410 : 650;
  const railCenterZ = -(totalDepth / 2);

  // 1.1. Tạo 4 thanh ray neon định hình chạy dọc suốt chiều dài hầm
  const railTop = document.createElement('div');
  railTop.className = 'tunnel-rail rail-top';
  railTop.style.height = `${totalDepth}px`;
  railTop.style.transform = `translate3d(0, -${tunnelRadius}px, ${railCenterZ}px) rotateX(90deg)`;
  tunnelEl.appendChild(railTop);

  const railBottom = document.createElement('div');
  railBottom.className = 'tunnel-rail rail-bottom';
  railBottom.style.height = `${totalDepth}px`;
  railBottom.style.transform = `translate3d(0, ${tunnelRadius}px, ${railCenterZ}px) rotateX(90deg)`;
  tunnelEl.appendChild(railBottom);

  const railLeft = document.createElement('div');
  railLeft.className = 'tunnel-rail rail-left';
  railLeft.style.width = `${totalDepth}px`;
  railLeft.style.transform = `translate3d(-${tunnelRadius}px, 0, ${railCenterZ}px) rotateY(90deg)`;
  tunnelEl.appendChild(railLeft);

  const railRight = document.createElement('div');
  railRight.className = 'tunnel-rail rail-right';
  railRight.style.width = `${totalDepth}px`;
  railRight.style.transform = `translate3d(${tunnelRadius}px, 0, ${railCenterZ}px) rotateY(90deg)`;
  tunnelEl.appendChild(railRight);

  // 1.2. Tạo các vành đai đường hầm (Tunnel Rings) dọc suốt chiều sâu Z
  for (let i = 0; i < numRings; i++) {
    const ringZ = -(i * CONFIG.ringSpacing);
    const ring = document.createElement('div');
    ring.className = 'tunnel-ring';
    ring.style.transform = `translate3d(0, 0, ${ringZ}px)`;

    // Thêm các chốt cơ khí 4 hướng trên vành đai
    ring.innerHTML = `
      <div class="tunnel-ring-notch notch-top"></div>
      <div class="tunnel-ring-notch notch-bottom"></div>
      <div class="tunnel-ring-notch notch-left"></div>
      <div class="tunnel-ring-notch notch-right"></div>
    `;

    tunnelEl.appendChild(ring);
    ringItems.push({ el: ring, baseZ: ringZ });
  }

  // 1.2. Đặt các khung ảnh so le gắn trên thành đường hầm
  danhSachAnh.forEach((item, index) => {
    const isLeft = index % 2 === 0;
    const xPos = isLeft ? -wallOffset : wallOffset;
    const rotY = isLeft ? tiltAngle : -tiltAngle;
    const yOffset = isLeft ? -15 : 15;
    const baseZ = -CONFIG.startZOffset - index * zSpacing;

    const card = document.createElement('article');
    card.className = 'tunnel-card';
    card.style.transform = `translate3d(${xPos}px, ${yOffset}px, ${baseZ}px) rotateY(${rotY}deg)`;

    card.innerHTML = `
      <div class="card-bracket cb-tl"></div>
      <div class="card-bracket cb-tr"></div>
      <div class="card-bracket cb-bl"></div>
      <div class="card-bracket cb-br"></div>
      
      <div class="card-photo-box">
        <img src="${item.src}" alt="${item.title}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'360\\' height=\\'360\\' viewBox=\\'0 0 360 360\\' fill=\\'%230a101b\\'><rect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%230a101b\\'/><text x=\\'50%25\\' y=\\'50%25\\' fill=\\'%2300f0ff\\' font-family=\\'monospace\\' font-size=\\'14\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>IMAGE // NOT FOUND</text></svg>'">
      </div>

      <div class="card-caption">
        <span class="card-tag">EXHIBIT // ${String(index + 1).padStart(2, '0')}</span>
        <h2 class="card-name">${item.title}</h2>
      </div>
    `;

    tunnelEl.appendChild(card);
    photoItems.push({ el: card, baseZ: baseZ, isLeft: isLeft });
  });
}

function updatePositionsOnResize() {
  updateResponsiveParams();
  photoItems.forEach((item, index) => {
    const isLeft = item.isLeft;
    const xPos = isLeft ? -wallOffset : wallOffset;
    const rotY = isLeft ? tiltAngle : -tiltAngle;
    const yOffset = isLeft ? -15 : 15;
    const baseZ = -CONFIG.startZOffset - index * zSpacing;
    item.baseZ = baseZ;
    item.el.style.transform = `translate3d(${xPos}px, ${yOffset}px, ${baseZ}px) rotateY(${rotY}deg)`;
  });
}

// =========================================================================
// 2. VÒNG LẶP RENDER HOẠT HỌA (SMOOTH LERP 60-120FPS)
// =========================================================================
function render() {
  // Giới hạn phạm vi cuộn
  targetZ = Math.max(-100, Math.min(targetZ, maxScrollZ));

  // Nội suy Lerp siêu êm
  currentZ += (targetZ - currentZ) * CONFIG.lerpEase;

  // Parallax camera bên trong lòng đường hầm
  currentCamRotX += (targetCamRotX - currentCamRotX) * 0.05;
  currentCamRotY += (targetCamRotY - currentCamRotY) * 0.05;
  cameraRigEl.style.transform = `rotateX(${currentCamRotX.toFixed(2)}deg) rotateY(${currentCamRotY.toFixed(2)}deg)`;

  // Di chuyển toàn bộ đường hầm theo trục Z
  tunnelEl.style.transform = `translate3d(0, 0, ${currentZ.toFixed(2)}px)`;

  // Tối ưu hóa render cho các vành đai đường hầm (Culling out-of-view rings)
  for (let i = 0; i < ringItems.length; i++) {
    const ring = ringItems[i];
    const relZ = ring.baseZ + currentZ;

    if (relZ < -CONFIG.fogFar || relZ > 150) {
      if (ring.el.style.visibility !== 'hidden') {
        ring.el.style.visibility = 'hidden';
      }
    } else {
      if (ring.el.style.visibility !== 'visible') {
        ring.el.style.visibility = 'visible';
      }
      if (relZ < -CONFIG.fogFadeStart) {
        const ratio = (relZ + CONFIG.fogFar) / (CONFIG.fogFar - CONFIG.fogFadeStart);
        ring.el.style.opacity = Math.max(0, ratio).toFixed(2);
      } else if (relZ > 0) {
        const ratio = 1 - (relZ / 150);
        ring.el.style.opacity = Math.max(0, ratio).toFixed(2);
      } else {
        ring.el.style.opacity = '1';
      }
    }
  }

  // Tối ưu hóa render và hiệu ứng chiều sâu cho các khung ảnh
  for (let i = 0; i < photoItems.length; i++) {
    const item = photoItems[i];
    const relZ = item.baseZ + currentZ;

    if (relZ < -CONFIG.fogFar) {
      if (item.el.style.visibility !== 'hidden') {
        item.el.style.visibility = 'hidden';
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
      }
    } else if (relZ < -CONFIG.fogFadeStart) {
      item.el.style.visibility = 'visible';
      item.el.style.pointerEvents = 'auto';
      const ratio = (relZ + CONFIG.fogFar) / (CONFIG.fogFar - CONFIG.fogFadeStart);
      item.el.style.opacity = Math.max(0, Math.min(1, ratio)).toFixed(3);
      item.el.style.filter = `blur(${( (1 - ratio) * 5 ).toFixed(1)}px)`;
    } else if (relZ > 0) {
      if (relZ >= CONFIG.fadePassCamera) {
        if (item.el.style.visibility !== 'hidden') {
          item.el.style.visibility = 'hidden';
          item.el.style.opacity = '0';
          item.el.style.pointerEvents = 'none';
        }
      } else {
        item.el.style.visibility = 'visible';
        item.el.style.pointerEvents = 'none';
        const ratio = 1 - (relZ / CONFIG.fadePassCamera);
        item.el.style.opacity = Math.max(0, ratio).toFixed(3);
        item.el.style.filter = 'none';
      }
    } else {
      item.el.style.visibility = 'visible';
      item.el.style.opacity = '1';
      item.el.style.pointerEvents = 'auto';
      item.el.style.filter = 'none';
    }
  }

  requestAnimationFrame(render);
}

// =========================================================================
// 3. ĐIỀU KHIỂN TƯƠNG TÁC (CUỘN, CHẠM, KÉO CHUỘT)
// =========================================================================

// Cuộn chuột
window.addEventListener('wheel', (e) => {
  targetZ += e.deltaY * CONFIG.wheelMultiplier;
}, { passive: true });

// Cảm ứng vuốt chạm điện thoại
window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  lastTouchY = touchStartY;
  touchVelocity = 0;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const currentY = e.touches[0].clientY;
  const deltaY = lastTouchY - currentY;
  targetZ += deltaY * 2.2;
  touchVelocity = deltaY;
  lastTouchY = currentY;
}, { passive: true });

window.addEventListener('touchend', () => {
  targetZ += touchVelocity * 6; // Quán tính vuốt
});

// Kéo chuột tự do
viewportEl.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartY = e.clientY;
  dragStartTargetZ = targetZ;
  viewportEl.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  // Parallax nhẹ khi đưa chuột trong lòng đường hầm
  const normX = (e.clientX / window.innerWidth) * 2 - 1;
  const normY = (e.clientY / window.innerHeight) * 2 - 1;
  targetCamRotY = normX * 3.5;
  targetCamRotX = -normY * 3.5;

  if (isDragging) {
    const deltaY = dragStartY - e.clientY;
    targetZ = dragStartTargetZ + deltaY * 2.2;
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    viewportEl.style.cursor = 'grab';
  }
});

// Bàn phím
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    targetZ += 320;
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    targetZ -= 320;
  }
});

// Resize
window.addEventListener('resize', () => {
  updatePositionsOnResize();
  resizeCanvas();
});

// =========================================================================
// 4. CANVAS NỀN: HIỆU ỨNG PHỐI CẢNH ĐƯỜNG HẦM & HẠT WARP SPEED
// =========================================================================
const canvas = document.getElementById('tunnel-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const NUM_PARTICLES = 250;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initParticles() {
  particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: (Math.random() - 0.5) * canvas.width * 2.2,
      y: (Math.random() - 0.5) * canvas.height * 2.2,
      z: Math.random() * 2000,
      size: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.7 + 0.3
    });
  }
}

function drawTunnelCanvas() {
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Cổng năng lượng phát sáng ở tâm hầm (Distant Tunnel Portal Glow)
  const portalRadius = Math.min(canvas.width, canvas.height) * 0.45;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalRadius);
  grad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
  grad.addColorStop(0.3, 'rgba(0, 130, 255, 0.09)');
  grad.addColorStop(0.7, 'rgba(0, 40, 100, 0.02)');
  grad.addColorStop(1, 'rgba(2, 4, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vẽ các vành tròn phối cảnh đường hầm nối tiếp ở xa xăm
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
  ctx.lineWidth = 1;
  const maxR = Math.max(canvas.width, canvas.height);
  for (let r = 40; r < maxR; r += 75) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Vẽ các tia phối cảnh đường hầm quy tụ về điểm hội tụ vô cực
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  const numLines = 20;
  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2;
    const endX = cx + Math.cos(angle) * canvas.width * 1.3;
    const endY = cy + Math.sin(angle) * canvas.height * 1.3;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Tốc độ di chuyển hạt theo quán tính cuộn
  const scrollDelta = Math.abs(targetZ - currentZ);
  const dynamicSpeed = 1.6 + scrollDelta * 0.08;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.z -= dynamicSpeed;

    if (p.z <= 0) {
      p.z = 2000;
      p.x = (Math.random() - 0.5) * canvas.width * 2.2;
      p.y = (Math.random() - 0.5) * canvas.height * 2.2;
    }

    const k = 400 / p.z;
    const px = cx + p.x * k;
    const py = cy + p.y * k;

    if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
      const radius = Math.max(0.5, p.size * k * 0.8);
      const alpha = Math.min(1, (1 - p.z / 2000) * p.alpha);

      // Kéo vệt sáng sao băng khi cuộn nhanh
      if (scrollDelta > 4) {
        const trailLen = Math.min(30, scrollDelta * 0.4 * k);
        const prevK = 400 / (p.z + trailLen * 8);
        const prevPx = cx + p.x * prevK;
        const prevPy = cy + p.y * prevK;

        ctx.strokeStyle = `rgba(0, 240, 255, ${(alpha * 0.5).toFixed(2)})`;
        ctx.lineWidth = radius;
        ctx.beginPath();
        ctx.moveTo(prevPx, prevPy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(160, 240, 255, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(drawTunnelCanvas);
}

// =========================================================================
// 5. KHỞI ĐỘNG
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  initParticles();
  buildTunnel();
  render();
  drawTunnelCanvas();
});
