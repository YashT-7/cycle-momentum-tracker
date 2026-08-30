const urlParams = new URLSearchParams(window.location.search);
const currentOrgId = urlParams.get('org');

let cachedMembers = [];
let allPushes = [];
let currentPlaybackIndex = 0;
let playbackInterval = null;
let playbackSpeedMs = 600;

const BIKE_SVGS = {
  red: `<svg class="bike-svg" viewBox="0 0 100 65">
          <circle cx="22" cy="45" r="16" stroke="#1e293b" stroke-width="3.5" fill="none"/>
          <circle cx="22" cy="45" r="3" fill="#cbd5e1"/>
          <circle cx="78" cy="45" r="16" stroke="#1e293b" stroke-width="3.5" fill="none"/>
          <circle cx="78" cy="45" r="3" fill="#cbd5e1"/>
          <polyline points="22,45 45,45 62,25 35,25 22,45" stroke="#ef4444" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="45,45 35,18" stroke="#ef4444" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polyline points="78,45 65,15" stroke="#ef4444" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polyline points="60,15 67,15 70,18" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M28,18 Q35,16 42,18" stroke="#0f172a" stroke-width="5" stroke-linecap="round" fill="none"/>
          <circle cx="45" cy="45" r="5.5" stroke="#475569" stroke-width="2.5" fill="#94a3b8"/>
        </svg>`,
  blue: `<svg class="bike-svg" viewBox="0 0 100 65">
          <circle cx="22" cy="45" r="16" stroke="#1e293b" stroke-width="3.5" fill="none"/>
          <circle cx="22" cy="45" r="3" fill="#93c5fd"/>
          <circle cx="78" cy="45" r="16" stroke="#1e293b" stroke-width="3.5" fill="none"/>
          <circle cx="78" cy="45" r="3" fill="#93c5fd"/>
          <polyline points="22,45 45,45 62,25 35,25 22,45" stroke="#2563eb" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="45,45 35,18" stroke="#2563eb" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polyline points="78,45 65,15" stroke="#2563eb" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polyline points="60,15 67,15 70,18" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M28,18 Q35,16 42,18" stroke="#1e3a8a" stroke-width="5" stroke-linecap="round" fill="none"/>
          <circle cx="45" cy="45" r="5.5" stroke="#1e3a8a" stroke-width="2.5" fill="#60a5fa"/>
        </svg>`
};

async function init() {
  // If no organization UUID is present in the URL, redirect directly to the admin login page
  if (!currentOrgId) {
    window.location.replace("admin.html");
    return;
  }

  await fetchOrgDetails();
  await loadMembers();
  await loadPushes();
}

async function fetchOrgDetails() {
  try {
    const res = await fetch(`/api/tracker?action=getOrg&org_id=${currentOrgId}`);
    const data = await res.json();
    if (data && data.name) {
      document.getElementById('org-title').innerText = data.name;
      renderBicycleGraphic(data.cycle_svg);
    } else {
      document.getElementById('org-title').innerText = "Organization Not Found";
    }
  } catch {
    document.getElementById('org-title').innerText = "Connection Error";
  }
}

function renderBicycleGraphic(cycleSvgData) {
  const container = document.getElementById('bike-container');
  if (!container) return;
  if (cycleSvgData === 'blue') {
    container.innerHTML = BIKE_SVGS.blue;
  } else if (cycleSvgData && cycleSvgData.startsWith('<svg')) {
    container.innerHTML = cycleSvgData;
  } else {
    container.innerHTML = BIKE_SVGS.red;
  }
}

async function loadMembers() {
  const res = await fetch(`/api/tracker?action=getMembers&org_id=${currentOrgId}`);
  const data = await res.json();
  if (!Array.isArray(data)) return;
  cachedMembers = data;

  const select = document.getElementById('member-select');
  if (select) {
    select.innerHTML = '<option value="">-- Choose Name --</option>';
    data.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });
  }
}

async function loadPushes() {
  const res = await fetch(`/api/tracker?action=getPushes&org_id=${currentOrgId}`);
  const data = await res.json();
  if (!Array.isArray(data)) return;

  allPushes = data;
  currentPlaybackIndex = data.length;
  renderStep(currentPlaybackIndex);
}

function renderStep(stepIndex) {
  const visiblePushes = allPushes.slice(0, stepIndex);
  const totalSteps = visiblePushes.length;

  // 1. Smooth Parallax Scrolling
  const mountainOffset = totalSteps * 25;
  const riverOffset = totalSteps * 45;
  const forestOffset = totalSteps * 75;

  const mountBack = document.getElementById('mountains-back');
  const riverLayer = document.getElementById('river-layer');
  const hillsForest = document.getElementById('hills-forest');

  if (mountBack) mountBack.style.backgroundPosition = `-${mountainOffset}px 0`;
  if (riverLayer) riverLayer.style.backgroundPosition = `-${riverOffset}px 0`;
  if (hillsForest) hillsForest.style.backgroundPosition = `-${forestOffset}px 0`;

  // 2. Infinite-Reach Electric Momentum Trail
  const waveGroup = document.getElementById('trail-waves');
  const bikeContainer = document.getElementById('bike-container');
  const trackContainer = document.querySelector('.track-container');

  if (!waveGroup || !bikeContainer || !trackContainer) return;
  waveGroup.innerHTML = '';
  if (totalSteps === 0) return;

  const trackRect = trackContainer.getBoundingClientRect();
  const bikeRect = bikeContainer.getBoundingClientRect();
  const scaleX = 780 / (trackRect.width || 780);
  const scaleY = 250 / (trackRect.height || 250);

  const bikeLeftRel = (bikeRect.left - trackRect.left) * scaleX;
  const bikeTopRel = (bikeRect.top - trackRect.top) * scaleY;
  const bikeHeight = bikeRect.height * scaleY;

  // Exact Hub and Ground Anchors
  const hubX = bikeLeftRel + 26; 
  const hubY = bikeTopRel + (bikeHeight * 0.72); 
  const groundY = bikeTopRel + bikeHeight - 2;

  // UNCONSTRAINED SCALING:
  // Trail length grows with every single push and easily extends past x: -300px off-screen
  const currentTrailReach = 80 + (totalSteps * 14); 
  const startX = hubX - currentTrailReach; // Fully allowed to be negative

  // Cone vertical spread grows wider and taller (past top & bottom bounds)
  const maxSpreadY = Math.min(130, 30 + (totalSteps * 1.8));

  // A. Expanding Backdrop Plasma Flare
  const conePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  conePath.setAttribute("d", `M ${startX} ${hubY - maxSpreadY} Q ${(startX + hubX) / 2} ${hubY} ${hubX} ${hubY} Q ${(startX + hubX) / 2} ${hubY} ${startX} ${hubY + maxSpreadY} Z`);
  conePath.setAttribute("fill", "url(#coneFade)");
  conePath.setAttribute("opacity", Math.min(0.55, 0.2 + (totalSteps * 0.005)).toFixed(2));
  waveGroup.appendChild(conePath);

  // B. Multi-Member Zig-Zag Thunderbolts (Renders up to 50 active strands extending out of view)
  const activePushes = visiblePushes.slice(-50);
  const strandCount = activePushes.length;

  activePushes.forEach((p, idx) => {
    const color = p.members?.color_code || '#38bdf8';
    const normIdx = idx / strandCount;
    
    // Spread strands across the entire expanding cone height
    const verticalSpread = (normIdx - 0.5) * 2 * maxSpreadY; 
    
    // Each bolt's starting origin scales back past the viewport edge
    const individualStartX = startX + (normIdx * (currentTrailReach * 0.35));
    const totalSpan = hubX - individualStartX;
    
    // Increase segment count so bolts remain jagged even when spanning way past the screen
    const segments = Math.max(8, Math.floor(totalSpan / 45));
    const segWidth = totalSpan / segments;

    let points = [];
    for (let i = 0; i <= segments; i++) {
      const curX = individualStartX + (i * segWidth);
      const taper = (1 - (i / segments)); // Converges perfectly into the rear hub
      
      // Dynamic jagged lightning offset
      const jitterY = (i === segments) ? 0 : ((i % 2 === 0 ? 1 : -1) * (10 + (idx % 4) * 3) * taper);
      const curY = hubY + (verticalSpread * taper) + jitterY;
      points.push(`${curX.toFixed(1)},${curY.toFixed(1)}`);
    }

    // Bolt Polyline
    const bolt = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    bolt.setAttribute("points", points.join(" "));
    bolt.setAttribute("fill", "none");
    bolt.setAttribute("stroke", color);
    bolt.setAttribute("stroke-width", (2.2 + normIdx * 3.8).toFixed(1));
    bolt.setAttribute("stroke-linecap", "round");
    bolt.setAttribute("stroke-linejoin", "round");
    bolt.setAttribute("opacity", (0.35 + normIdx * 0.65).toFixed(2));
    waveGroup.appendChild(bolt);

    // Front-leading Thrust Arrowheads (at hub point)
    if (idx > strandCount - 8) {
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrow.setAttribute("points", `${hubX},${hubY} ${hubX - 16},${hubY - 8} ${hubX - 11},${hubY} ${hubX - 16},${hubY + 8}`);
      arrow.setAttribute("fill", color);
      arrow.setAttribute("opacity", "0.95");
      waveGroup.appendChild(arrow);
    }

    // Floating Shock Diamond Particles (Dispersed across the screen)
    if (idx % 2 === 0) {
      const sparkX = Math.max(10, individualStartX + (Math.random() * (hubX - individualStartX)));
      const sparkY = hubY + ((Math.random() - 0.5) * maxSpreadY * 1.6);
      const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      diamond.setAttribute("points", `${sparkX},${sparkY - 6} ${sparkX + 6},${sparkY} ${sparkX},${sparkY + 6} ${sparkX - 6},${sparkY}`);
      diamond.setAttribute("fill", color);
      diamond.setAttribute("opacity", "0.85");
      waveGroup.appendChild(diamond);
    }
  });

  // C. Unbroken Ground Laser Line
  const groundLaser = document.createElementNS("http://www.w3.org/2000/svg", "line");
  groundLaser.setAttribute("x1", startX);
  groundLaser.setAttribute("y1", groundY);
  groundLaser.setAttribute("x2", hubX);
  groundLaser.setAttribute("y2", groundY);
  groundLaser.setAttribute("stroke", "url(#groundLaserTrack)");
  groundLaser.setAttribute("stroke-width", "4");
  groundLaser.setAttribute("stroke-dasharray", "24 8 48 14");
  waveGroup.appendChild(groundLaser);
}

function togglePlayPause() {
  if (playbackInterval) pausePlayback();
  else startPlayback();
}

function startPlayback() {
  if (currentPlaybackIndex >= allPushes.length) currentPlaybackIndex = 0;
  const btn = document.getElementById('btn-play-pause');
  if (btn) {
    btn.innerHTML = '⏸ Pause';
    btn.classList.add('active');
  }
  playbackInterval = setInterval(() => {
    if (currentPlaybackIndex < allPushes.length) {
      currentPlaybackIndex++;
      renderStep(currentPlaybackIndex);
    } else {
      pausePlayback();
    }
  }, playbackSpeedMs);
}

function pausePlayback() {
  clearInterval(playbackInterval);
  playbackInterval = null;
  const btn = document.getElementById('btn-play-pause');
  if (btn) {
    btn.innerHTML = '▶ Play';
    btn.classList.remove('active');
  }
}

function jumpToStart() {
  pausePlayback();
  currentPlaybackIndex = 0;
  renderStep(0);
}

function jumpToCurrent() {
  pausePlayback();
  currentPlaybackIndex = allPushes.length;
  renderStep(allPushes.length);
}

function changeSpeed(ms) {
  playbackSpeedMs = parseInt(ms, 10);
  if (playbackInterval) {
    pausePlayback();
    startPlayback();
  }
}

function toggleModal(show) {
  if (!currentOrgId) return;
  document.getElementById('push-modal').style.display = show ? 'block' : 'none';
}

async function submitPush() {
  const memberId = document.getElementById('member-select').value;
  const pin = document.getElementById('member-pin').value;
  const note = document.getElementById('push-note').value;

  if (!memberId || !pin) {
    alert("Please select your name and enter your PIN.");
    return;
  }

  const res = await fetch('/api/tracker?action=submitPush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_id: currentOrgId,
      member_id: memberId,
      pin,
      note
    })
  });

  const result = await res.json();
  if (!res.ok) {
    alert(result.error || "Failed to submit push");
  } else {
    toggleModal(false);
    document.getElementById('member-pin').value = '';
    document.getElementById('push-note').value = '';
    await loadPushes();
    jumpToCurrent();
  }
}

window.onload = init;