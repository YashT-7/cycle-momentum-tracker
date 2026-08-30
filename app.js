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

  // 1. Move background parallax layers continuously
  const mountainOffset = totalSteps * 25;
  const riverOffset = totalSteps * 45;
  const forestOffset = totalSteps * 75;

  const mountBack = document.getElementById('mountains-back');
  const riverLayer = document.getElementById('river-layer');
  const hillsForest = document.getElementById('hills-forest');

  if (mountBack) mountBack.style.backgroundPosition = `-${mountainOffset}px 0`;
  if (riverLayer) riverLayer.style.backgroundPosition = `-${riverOffset}px 0`;
  if (hillsForest) hillsForest.style.backgroundPosition = `-${forestOffset}px 0`;

  // 2. Render Full Cumulative Momentum Journey
  const waveGroup = document.getElementById('trail-waves');
  const defs = document.getElementById('trail-defs');
  const bikeContainer = document.getElementById('bike-container');
  const trackContainer = document.querySelector('.track-container');

  if (waveGroup && defs && bikeContainer && trackContainer) {
    waveGroup.innerHTML = '';
    if (totalSteps === 0) return;

    // Track & bicycle bounding box
    const trackRect = trackContainer.getBoundingClientRect();
    const bikeRect = bikeContainer.getBoundingClientRect();

    const scaleX = 780 / (trackRect.width || 780);
    const scaleY = 250 / (trackRect.height || 250);

    const bikeLeftRel = (bikeRect.left - trackRect.left) * scaleX;
    const bikeTopRel = (bikeRect.top - trackRect.top) * scaleY;
    const bikeHeight = bikeRect.height * scaleY;

    const rearEdgeX = bikeLeftRel - 6;
    const midY = bikeTopRel + (bikeHeight * 0.44);
    const groundY = bikeTopRel + bikeHeight - 1;

    // Stream width spans from left edge (0) to rear tire as pushes accumulate
    const maxTrailReach = rearEdgeX - 20;
    const currentTrailLength = Math.min(maxTrailReach, Math.max(40, totalSteps * 6.5));
    const streamStartX = rearEdgeX - currentTrailLength;

    // A. Ambient Wind Streaks (Scales with velocity)
    const windSpeedFactor = Math.min(1, totalSteps / 30);
    const windGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    windGroup.setAttribute("stroke", "url(#windFade)");
    windGroup.setAttribute("stroke-linecap", "round");
    windGroup.innerHTML = `
      <path d="M ${Math.max(10, rearEdgeX - (220 * windSpeedFactor))} ${midY - 20} L ${rearEdgeX - 10} ${midY - 20}" stroke-width="1.8" stroke-dasharray="14 8 28 6" opacity="${(0.4 + 0.4 * windSpeedFactor).toFixed(2)}" />
      <path d="M ${Math.max(10, rearEdgeX - (180 * windSpeedFactor))} ${midY - 34} L ${rearEdgeX - 4} ${midY - 34}" stroke-width="1.4" stroke-dasharray="10 5 18 4" opacity="${(0.3 + 0.4 * windSpeedFactor).toFixed(2)}" />
      <path d="M ${Math.max(10, rearEdgeX - (280 * windSpeedFactor))} ${midY} L ${rearEdgeX - 8} ${midY}" stroke-width="2" stroke-dasharray="18 8 10 4" opacity="${(0.5 + 0.4 * windSpeedFactor).toFixed(2)}" />
    `;
    waveGroup.appendChild(windGroup);

    // B. Ground Friction Dash (Grows stronger with pushes)
    const groundGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    groundGroup.setAttribute("stroke-linecap", "round");
    groundGroup.innerHTML = `
      <line x1="${Math.max(10, rearEdgeX - (180 * windSpeedFactor))}" y1="${groundY}" x2="${rearEdgeX}" y2="${groundY}" stroke="url(#groundFade)" stroke-width="2.5" stroke-dasharray="12 4 6 2" />
      <circle cx="${rearEdgeX - 12}" cy="${groundY - 1}" r="1.4" fill="#94a3b8" opacity="0.8" />
      <circle cx="${rearEdgeX - 45}" cy="${groundY}" r="1.1" fill="#94a3b8" opacity="0.6" />
    `;
    waveGroup.appendChild(groundGroup);

    // C. Chronological Member Push History Ribbon
    // Render up to the last 50 pushes along the timeline path so all members remain visible
    const renderPushes = visiblePushes.slice(-50);
    const renderCount = renderPushes.length;

    renderPushes.forEach((p, idx) => {
      const color = p.members?.color_code || '#ef4444';
      
      // Calculate exact timeline slot from streamStartX to rearEdgeX
      const segmentStartX = streamStartX + (idx / renderCount) * currentTrailLength;
      const segmentEndX = streamStartX + ((idx + 1) / renderCount) * currentTrailLength;
      
      // Sinuous dynamic wave variation per member
      const waveAmplitude = 6 * (1 - (idx / renderCount) * 0.4);
      const waveY1 = midY + (idx % 2 === 0 ? waveAmplitude : -waveAmplitude);
      const waveY2 = midY + (idx % 3 === 0 ? -waveAmplitude * 0.8 : waveAmplitude * 0.8);
      
      const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathElem.setAttribute("d", `M ${segmentStartX} ${waveY1} Q ${(segmentStartX + segmentEndX) / 2} ${waveY2}, ${segmentEndX} ${midY}`);
      pathElem.setAttribute("fill", "none");
      pathElem.setAttribute("stroke", color);
      pathElem.setAttribute("stroke-width", (2.2 + (idx / renderCount) * 2.6).toFixed(1));
      pathElem.setAttribute("stroke-linecap", "round");
      pathElem.setAttribute("opacity", (0.35 + (idx / renderCount) * 0.65).toFixed(2));
      waveGroup.appendChild(pathElem);

      // Add a distinct contribution spark node for each member push along the timeline
      if (idx % 2 === 0 || idx > renderCount - 8) {
        const spark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        spark.setAttribute("cx", segmentEndX);
        spark.setAttribute("cy", waveY2);
        spark.setAttribute("r", (1.6 + (idx / renderCount) * 1.6).toFixed(1));
        spark.setAttribute("fill", color);
        spark.setAttribute("opacity", (0.4 + (idx / renderCount) * 0.6).toFixed(2));
        waveGroup.appendChild(spark);
      }
    });
  }
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