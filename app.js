/* ── CURSOR ── */
const cur = document.getElementById('cursor');
let cx = 0, cy = 0;
document.addEventListener('mousemove', e => {
  cx = e.clientX; cy = e.clientY;
  cur.style.left = cx + 'px';
  cur.style.top  = cy + 'px';
});
document.querySelectorAll('a,button').forEach(el => {
  el.addEventListener('mouseenter', () => cur.classList.add('hover'));
  el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
});

/* ── ANIMATED BG ── */
(function() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initDots() {
    dots = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + .3,
        vx: (Math.random() - .5) * .18,
        vy: (Math.random() - .5) * .18,
        opacity: Math.random() * .4 + .1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H;
      if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,212,${d.opacity})`;
      ctx.fill();
    });
    // connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(0,245,212,${.06 * (1 - dist/100)})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initDots(); });
  resize(); initDots(); draw();
})();

/* ── STATE ── */
let currentLang = '', currentPeriod = 'daily', totalStars = 0;

const langColors = {
  JavaScript:'#f7df1e', TypeScript:'#2b7489', Python:'#3572a5',
  Rust:'#dea584', Go:'#00add8', Java:'#b07219', 'C++':'#f34b7d',
  C:'#555555', Shell:'#89e051', Ruby:'#701516', Swift:'#ffac45',
  Vue:'#41b883', HTML:'#e34c26', Kotlin:'#f18e33', Dart:'#00b4ab'
};
const lc = l => langColors[l] || '#4d7cfe';

function fmtNum(n) {
  if (!n) return '0';
  return n > 1000000 ? (n/1000000).toFixed(1)+'M' : n > 1000 ? (n/1000).toFixed(1)+'k' : String(n);
}

function getZipUrl(fullName, branch) {
  return `https://github.com/${fullName}/archive/refs/heads/${branch||'main'}.zip`;
}

/* ── TRENDING ── */
async function loadTrending() {
  const grid = document.getElementById('trending-grid');
  grid.innerHTML = Array(6).fill('<div class="skel"></div>').join('');
  const days = {daily:1,weekly:7,monthly:30}[currentPeriod];
  const since = new Date(Date.now() - days*86400000).toISOString().split('T')[0];
  let q = `created:>${since} stars:>10${currentLang?' language:'+currentLang:''}`;
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`,
      {headers:{'Accept':'application/vnd.github.v3+json'}});
    const data = await res.json();
    if (data.items?.length) renderTrending(data.items);
    else grid.innerHTML = '<div style="padding:60px;text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--muted)">// no results — try different filters</div>';
    const rem = res.headers.get('X-RateLimit-Remaining');
    if (rem) {
      document.getElementById('rate-limit-info').textContent = `RATE LIMIT: ${rem}/60`;
      document.getElementById('nav-api-status').textContent = rem > 10 ? 'API LIVE' : 'API LOW';
    }
  } catch { renderTrending(mockData()); }
}

function renderTrending(repos) {
  const grid = document.getElementById('trending-grid');
  grid.innerHTML = '';
  const rankLabels = ['01','02','03','04','05','06','07','08','09','10'];
  const rankClass  = ['gold','silver','bronze','','','','','','',''];
  repos.forEach((repo, i) => {
    const div = document.createElement('div');
    div.className = 'tcard';
    div.style.animationDelay = (i * .06) + 's';
    const color  = lc(repo.language);
    const zipUrl = getZipUrl(repo.full_name, repo.default_branch);
    div.innerHTML = `
      <div class="trank ${rankClass[i]||''}">${rankLabels[i]||i+1}</div>
      <div class="tinfo">
        <a href="${repo.html_url}" target="_blank" class="trepo-name">${repo.full_name}</a>
        <div class="trepo-desc">${repo.description||'No description.'}</div>
      </div>
      <div class="tmeta">
        <span class="tstars">★ ${fmtNum(repo.stargazers_count)}</span>
        <span class="tnew">↑ TRENDING</span>
        <span class="tlang"><span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>${repo.language||'—'}</span>
        <a class="tzip" href="${zipUrl}" target="_blank">⬇ ZIP</a>
      </div>`;
    div.addEventListener('click', e => { if (!e.target.closest('a')) copyClone(repo.clone_url, repo.name); });
    grid.appendChild(div);
    totalStars += repo.stargazers_count;
    animNum('s-stars', totalStars);
  });
  attachCursorToNew();
}

function mockData() {
  return [
    {full_name:'microsoft/vscode',description:'Visual Studio Code — the open source editor',html_url:'https://github.com/microsoft/vscode',stargazers_count:165000,forks_count:29000,language:'TypeScript',clone_url:'https://github.com/microsoft/vscode.git',default_branch:'main'},
    {full_name:'torvalds/linux',description:'Linux kernel source tree',html_url:'https://github.com/torvalds/linux',stargazers_count:178000,forks_count:54000,language:'C',clone_url:'https://github.com/torvalds/linux.git',default_branch:'master'},
    {full_name:'facebook/react',description:'A declarative, efficient, and flexible JavaScript library for building user interfaces',html_url:'https://github.com/facebook/react',stargazers_count:226000,forks_count:46000,language:'JavaScript',clone_url:'https://github.com/facebook/react.git',default_branch:'main'},
    {full_name:'rust-lang/rust',description:'Empowering everyone to build reliable and efficient software',html_url:'https://github.com/rust-lang/rust',stargazers_count:97000,forks_count:12500,language:'Rust',clone_url:'https://github.com/rust-lang/rust.git',default_branch:'master'},
    {full_name:'vercel/next.js',description:'The React Framework for the Web',html_url:'https://github.com/vercel/next.js',stargazers_count:126000,forks_count:27000,language:'JavaScript',clone_url:'https://github.com/vercel/next.js.git',default_branch:'canary'},
    {full_name:'openai/openai-python',description:'The official Python library for the OpenAI API',html_url:'https://github.com/openai/openai-python',stargazers_count:23000,forks_count:3200,language:'Python',clone_url:'https://github.com/openai/openai-python.git',default_branch:'main'},
  ];
}

/* ── SEARCH ── */
async function doSearch(query) {
  if (!query.trim()) return;
  const sec  = document.getElementById('results-section');
  const grid = document.getElementById('results-grid');
  sec.classList.remove('hidden');
  grid.innerHTML = Array(6).fill('<div class="skel" style="height:160px"></div>').join('');
  document.getElementById('results-title').textContent = `"${query}"`;
  document.getElementById('results-meta').textContent  = 'SEARCHING...';
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  try {
    const res  = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`,
      {headers:{'Accept':'application/vnd.github.v3+json'}});
    const data = await res.json();
    if (data.items?.length) {
      document.getElementById('results-meta').textContent = `${data.total_count.toLocaleString()} REPOS FOUND`;
      renderResults(data.items);
      animNum('s-stars', data.items.reduce((a,r)=>a+r.stargazers_count,0));
    } else {
      document.getElementById('results-meta').textContent = 'NO RESULTS';
      grid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;font-family:var(--font-mono);color:var(--muted)">// nothing found — try different keywords</div>';
    }
  } catch {
    document.getElementById('results-meta').textContent = 'ERROR';
    grid.innerHTML = '<div style="grid-column:1/-1;padding:60px;text-align:center;font-family:var(--font-mono);color:var(--red)">// API error — try again in a moment</div>';
  }
}

function renderResults(repos) {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  repos.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = (i * .05) + 's';
    const color  = lc(repo.language);
    const topics = (repo.topics||[]).slice(0,3).map(t=>`<span class="rtopic">${t}</span>`).join('');
    const zipUrl = getZipUrl(repo.full_name, repo.default_branch);
    card.innerHTML = `
      <div class="card-actions">
        <button class="btn-clone" onclick="copyClone('${repo.clone_url}','${repo.name}')">⎘ CLONE</button>
        <a class="btn-zip" href="${zipUrl}" target="_blank">⬇ ZIP</a>
      </div>
      <div class="repo-owner">
        <img src="${repo.owner.avatar_url}" loading="lazy" alt="">
        ${repo.owner.login}
      </div>
      <a class="repo-name" href="${repo.html_url}" target="_blank">${repo.name}</a>
      <div class="repo-desc">${repo.description||'No description provided.'}</div>
      <div class="repo-foot">
        <span class="rstat stars">★ ${fmtNum(repo.stargazers_count)}</span>
        <span class="rstat">⑂ ${fmtNum(repo.forks_count)}</span>
        ${repo.language?`<span class="rstat"><span class="lang-pip" style="background:${color}"></span>${repo.language}</span>`:''}
      </div>
      ${topics?`<div class="repo-topics">${topics}</div>`:''}`;
    grid.appendChild(card);
  });
  attachCursorToNew();
}

/* ── HELPERS ── */
function copyClone(url, name) {
  navigator.clipboard.writeText(`git clone ${url}`)
    .then(() => showToast(`// COPIED → git clone ${name}`));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function animNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = parseFloat(el.textContent) || 0;
  const steps = 30, step = (target - cur) / steps;
  let i = 0;
  const t = setInterval(() => {
    cur += step; i++;
    if (i >= steps) { cur = target; clearInterval(t); }
    el.textContent = fmtNum(Math.round(cur));
  }, 25);
}

function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll('.ltag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTrending();
}

function setTrendingPeriod(period, btn) {
  currentPeriod = period;
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTrending();
}

function quickSearch(term) {
  document.getElementById('search-input').value = term;
  doSearch(term);
}

function attachCursorToNew() {
  document.querySelectorAll('a,button').forEach(el => {
    if (!el.dataset.cursorBound) {
      el.dataset.cursorBound = '1';
      el.addEventListener('mouseenter', () => cur.classList.add('hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
    }
  });
}

/* ── NAV HIDE ON SCROLL ── */
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.getElementById('nav').style.transform = y > lastY && y > 80 ? 'translateY(-100%)' : 'translateY(0)';
  document.getElementById('nav').style.transition = 'transform .3s';
  lastY = y;
});

/* ── INIT ── */
document.getElementById('search-btn').addEventListener('click', () =>
  doSearch(document.getElementById('search-input').value));
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch(e.target.value);
});

loadTrending();
