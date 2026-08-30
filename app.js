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
  if (!currentOrgId) {
    document.getElementById('org-title').innerText = "Please access via your shared organization link.";
    document.getElementById('btn-open-push').style.display = 'none';
    document.getElementById('playback-panel').style.display = 'none';
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
  const count = visiblePushes.length;

  const mountainOffset = (count * 25) % 500;
  const riverOffset = (count * 45) % 350;
  const forestOffset = (count * 75) % 420;

  const mountBack = document.getElementById('mountains-back');
  const riverLayer = document.getElementById('river-layer');
  const hillsForest = document.getElementById('hills-forest');

  if (mountBack) mountBack.style.backgroundPosition = `-${mountainOffset}px 0`;
  if (riverLayer) riverLayer.style.backgroundPosition = `-${riverOffset}px 0`;
  if (hillsForest) hillsForest.style.backgroundPosition = `-${forestOffset}px 0`;

  const waveGroup = document.getElementById('trail-waves');
  const defs = document.getElementById('trail-defs');
  const bikeContainer = document.getElementById('bike-container');
  const trackContainer = document.querySelector('.track-container');

  if (waveGroup && defs && bikeContainer && trackContainer) {
    waveGroup.innerHTML = '';
    if (visiblePushes.length === 0) return;

    const trackRect = trackContainer.getBoundingClientRect();
    const bikeRect = bikeContainer.getBoundingClientRect();

    const scaleX = 780 / (trackRect.width || 780);
    const scaleY = 250 / (trackRect.height || 250);

    const bikeLeftRel = (bikeRect.left - trackRect.left) * scaleX;
    const bikeTopRel = (bikeRect.top - trackRect.top) * scaleY;
    const bikeHeight = bikeRect.height * scaleY;

    const rearEdgeX = bikeLeftRel - 4;
    const midY = bikeTopRel + (bikeHeight * 0.44);
    const groundY = bikeTopRel + bikeHeight - 1;

    const windGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    windGroup.setAttribute("stroke", "url(#windFade)");
    windGroup.setAttribute("stroke-linecap", "round");
    windGroup.innerHTML = `
      <path d="M ${Math.max(10, rearEdgeX - 260)} ${midY - 20} L ${rearEdgeX - 10} ${midY - 20}" stroke-width="1.8" stroke-dasharray="14 8 28 6" opacity="0.8" />
      <path d="M ${Math.max(10, rearEdgeX - 190)} ${midY - 34} L ${rearEdgeX - 4} ${midY - 34}" stroke-width="1.4" stroke-dasharray="10 5 18 4" opacity="0.65" />
      <path d="M ${Math.max(10, rearEdgeX - 300)} ${midY} L ${rearEdgeX - 8} ${midY}" stroke-width="2" stroke-dasharray="18 8 10 4" opacity="0.85" />
      <path d="M ${Math.max(10, rearEdgeX - 150)} ${midY + 16} L ${rearEdgeX - 12} ${midY + 16}" stroke-width="1.5" stroke-dasharray="8 4 14 3" opacity="0.7" />
    `;
    waveGroup.appendChild(windGroup);

    const groundGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    groundGroup.setAttribute("stroke-linecap", "round");
    groundGroup.innerHTML = `
      <line x1="${Math.max(10, rearEdgeX - 220)}" y1="${groundY}" x2="${rearEdgeX}" y2="${groundY}" stroke="url(#groundFade)" stroke-width="2.5" stroke-dasharray="12 4 6 2" />
      <line x1="${Math.max(10, rearEdgeX - 150)}" y1="${groundY - 2.5}" x2="${rearEdgeX - 8}" y2="${groundY - 2.5}" stroke="url(#windFade)" stroke-width="1.4" stroke-dasharray="8 4" opacity="0.7" />
      <circle cx="${rearEdgeX - 12}" cy="${groundY - 1}" r="1.4" fill="#94a3b8" opacity="0.85" />
      <circle cx="${rearEdgeX - 45}" cy="${groundY}" r="1.1" fill="#94a3b8" opacity="0.65" />
      <circle cx="${rearEdgeX - 95}" cy="${groundY + 0.5}" r="0.8" fill="#cbd5e1" opacity="0.45" />
    `;
    waveGroup.appendChild(groundGroup);

    const recentPushes = visiblePushes.slice(-8);

    recentPushes.forEach((p, index) => {
      const color = p.members?.color_code || '#ef4444';
      const pushRatio = (index + 1) / recentPushes.length;
      const gradId = `grad-push-${p.id || index}`;

      let existingGrad = document.getElementById(gradId);
      if (!existingGrad) {
        existingGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        existingGrad.setAttribute("id", gradId);
        existingGrad.setAttribute("x1", "0%");
        existingGrad.setAttribute("y1", "0%");
        existingGrad.setAttribute("x2", "100%");
        existingGrad.setAttribute("y2", "0%");
        existingGrad.innerHTML = `
          <stop offset="0%" stop-color="${color}" stop-opacity="0" />
          <stop offset="60%" stop-color="${color}" stop-opacity="0.65" />
          <stop offset="100%" stop-color="${color}" stop-opacity="1" />
        `;
        defs.appendChild(existingGrad);
      }

      const trailLength = (recentPushes.length - index) * 35;
      const startX = Math.max(15, rearEdgeX - trailLength);
      const waveYOffset = (index % 2 === 0 ? 5 : -5) * pushRatio;

      const thrustPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      thrustPath.setAttribute(
        "d",
        `M ${startX} ${midY + waveYOffset} C ${(startX + rearEdgeX) / 2} ${midY - waveYOffset * 1.5}, ${rearEdgeX - 18} ${midY + waveYOffset * 0.4}, ${rearEdgeX} ${midY}`
      );
      thrustPath.setAttribute("fill", "none");
      thrustPath.setAttribute("stroke", `url(#${gradId})`);
      thrustPath.setAttribute("stroke-width", (3.8 * pushRatio + 1.2).toFixed(1));
      thrustPath.setAttribute("stroke-linecap", "round");
      thrustPath.setAttribute("opacity", (0.45 + 0.55 * pushRatio).toFixed(2));
      waveGroup.appendChild(thrustPath);

      const sparkDist = (recentPushes.length - index) * 16;
      const spark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      spark.setAttribute("cx", Math.max(10, rearEdgeX - sparkDist));
      spark.setAttribute("cy", midY + (index % 3 === 0 ? -4 : 4));
      spark.setAttribute("r", (2.2 * pushRatio).toFixed(1));
      spark.setAttribute("fill", color);
      spark.setAttribute("opacity", (0.55 + 0.45 * pushRatio).toFixed(2));
      waveGroup.appendChild(spark);
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