/* ── CURSOR ── */
const cur = document.getElementById('cursor');
const curBlur = document.getElementById('cursor-blur');
let mx = 0, my = 0, bx = 0, by = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
});
(function loopBlur() {
  bx += (mx - bx) * 0.08;
  by += (my - by) * 0.08;
  curBlur.style.left = bx + 'px';
  curBlur.style.top  = by + 'px';
  requestAnimationFrame(loopBlur);
})();

/* ── STATE ── */
let lang = '', period = 'daily', totalStars = 0;

const LC = {
  JavaScript:'#f7df1e', TypeScript:'#2b7489', Python:'#3572a5',
  Rust:'#dea584', Go:'#00add8', Java:'#b07219', 'C++':'#f34b7d',
  C:'#858585', Shell:'#89e051', Ruby:'#701516', Swift:'#f05138',
  Vue:'#41b883', HTML:'#e34c26', Kotlin:'#f18e33', Dart:'#00b4ab',
  CSS:'#563d7c', PHP:'#4f5d95',
};
const lc = l => LC[l] || '#7c6bff';

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n/1000).toFixed(1) + 'k';
  return String(n);
}

function zipUrl(full, branch) {
  return `https://github.com/${full}/archive/refs/heads/${branch || 'main'}.zip`;
}

/* ── TRENDING ── */
async function loadTrending() {
  const list = document.getElementById('trending-list');
  list.innerHTML = Array(6).fill('<div class="skel"></div>').join('');
  const days = {daily:1, weekly:7, monthly:30}[period];
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  let q = `created:>${since} stars:>5${lang ? ' language:' + lang : ''}`;
  try {
    const r = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`,
      {headers:{'Accept':'application/vnd.github.v3+json'}}
    );
    const d = await r.json();
    if (d.items?.length) renderTrending(d.items);
    else list.innerHTML = empty('No repos found for these filters.');
    const rem = r.headers.get('X-RateLimit-Remaining');
    if (rem) document.getElementById('rl').textContent = `API calls left: ${rem}/60`;
  } catch { renderTrending(mock()); }
}

function renderTrending(repos) {
  const list = document.getElementById('trending-list');
  list.innerHTML = '';
  const cls = ['s1','s2','s3','','','','','','',''];
  repos.forEach((repo, i) => {
    const row = document.createElement('div');
    row.className = 'trow';
    row.style.animationDelay = (i * .055) + 's';
    const z = zipUrl(repo.full_name, repo.default_branch);
    row.innerHTML = `
      <div class="tnum ${cls[i]}">${String(i+1).padStart(2,'0')}</div>
      <div class="tinfo">
        <a href="${repo.html_url}" target="_blank" class="tname">${repo.full_name}</a>
        <div class="tdesc">${repo.description || 'No description.'}</div>
      </div>
      <div class="tstats">
        <div class="tstar">★ ${fmt(repo.stargazers_count)}</div>
        <div class="tnew">↑ TRENDING</div>
        <div class="tlang">
          <span style="width:8px;height:8px;border-radius:50%;background:${lc(repo.language)};display:inline-block;flex-shrink:0"></span>
          ${repo.language || 'Various'}
        </div>
        <a class="tzip" href="${z}" target="_blank">⬇ Download ZIP</a>
      </div>`;
    row.addEventListener('click', e => { if (!e.target.closest('a')) clone(repo.clone_url, repo.name); });
    list.appendChild(row);
    totalStars += repo.stargazers_count;
    animNum('n-stars', totalStars);
  });
  bindCursor();
}

function mock() {
  return [
    {full_name:'microsoft/vscode',description:'Visual Studio Code — open source code editor',html_url:'https://github.com/microsoft/vscode',stargazers_count:163000,forks_count:28700,language:'TypeScript',clone_url:'https://github.com/microsoft/vscode.git',default_branch:'main'},
    {full_name:'torvalds/linux',description:'Linux kernel source tree',html_url:'https://github.com/torvalds/linux',stargazers_count:177000,forks_count:53000,language:'C',clone_url:'https://github.com/torvalds/linux.git',default_branch:'master'},
    {full_name:'facebook/react',description:'The library for web and native user interfaces',html_url:'https://github.com/facebook/react',stargazers_count:225000,forks_count:45900,language:'JavaScript',clone_url:'https://github.com/facebook/react.git',default_branch:'main'},
    {full_name:'rust-lang/rust',description:'Empowering everyone to build reliable and efficient software',html_url:'https://github.com/rust-lang/rust',stargazers_count:96500,forks_count:12400,language:'Rust',clone_url:'https://github.com/rust-lang/rust.git',default_branch:'master'},
    {full_name:'vercel/next.js',description:'The React Framework for the Web',html_url:'https://github.com/vercel/next.js',stargazers_count:125000,forks_count:26800,language:'JavaScript',clone_url:'https://github.com/vercel/next.js.git',default_branch:'canary'},
    {full_name:'openai/openai-python',description:'The official Python library for the OpenAI API',html_url:'https://github.com/openai/openai-python',stargazers_count:23200,forks_count:3300,language:'Python',clone_url:'https://github.com/openai/openai-python.git',default_branch:'main'},
    {full_name:'denoland/deno',description:'A modern runtime for JavaScript and TypeScript',html_url:'https://github.com/denoland/deno',stargazers_count:92000,forks_count:5100,language:'Rust',clone_url:'https://github.com/denoland/deno.git',default_branch:'main'},
  ];
}

/* ── SEARCH ── */
async function doSearch(query) {
  if (!query.trim()) return;
  const sec  = document.getElementById('results-wrap');
  const grid = document.getElementById('results-grid');
  sec.classList.remove('hidden');
  grid.innerHTML = Array(6).fill('<div class="skel" style="height:200px"></div>').join('');
  document.getElementById('results-title').textContent = `"${query}"`;
  document.getElementById('results-sub').textContent = 'Searching…';
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  try {
    const r = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`,
      {headers:{'Accept':'application/vnd.github.v3+json'}}
    );
    const d = await r.json();
    if (d.items?.length) {
      document.getElementById('results-sub').textContent = `${d.total_count.toLocaleString()} repositories found`;
      renderResults(d.items);
      animNum('n-stars', d.items.reduce((a,r) => a + r.stargazers_count, 0));
    } else {
      document.getElementById('results-sub').textContent = 'No results found';
      grid.innerHTML = empty('Nothing matched your search. Try different keywords.');
    }
  } catch {
    document.getElementById('results-sub').textContent = 'API error';
    grid.innerHTML = empty('Could not reach GitHub API. Check rate limits.');
  }
}

function renderResults(repos) {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  repos.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = (i * .045) + 's';
    const color  = lc(repo.language);
    const topics = (repo.topics || []).slice(0,3).map(t => `<span class="rtag">${t}</span>`).join('');
    const z = zipUrl(repo.full_name, repo.default_branch);
    card.innerHTML = `
      <div class="card-top">
        <div class="repo-owner">
          <img src="${repo.owner.avatar_url}" alt="" loading="lazy">
          ${repo.owner.login}
        </div>
        <div class="card-btns">
          <button class="btn-sm" onclick="clone('${repo.clone_url}','${repo.name}')">⎘ Clone</button>
          <a class="btn-sm zip" href="${z}" target="_blank">⬇ ZIP</a>
        </div>
      </div>
      <a class="repo-name" href="${repo.html_url}" target="_blank">${repo.name}</a>
      <div class="repo-desc">${repo.description || 'No description provided.'}</div>
      <div class="repo-meta">
        <span class="rmeta gold">★ ${fmt(repo.stargazers_count)}</span>
        <span class="rmeta">⑂ ${fmt(repo.forks_count)}</span>
        ${repo.language ? `<span class="rmeta"><span class="ldot" style="background:${color}"></span>${repo.language}</span>` : ''}
      </div>
      ${topics ? `<div class="repo-topics">${topics}</div>` : ''}`;
    grid.appendChild(card);
  });
  bindCursor();
}

/* ── HELPERS ── */
function empty(msg) {
  return `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:rgba(255,255,255,.3);font-size:15px">${msg}</div>`;
}

function clone(url, name) {
  navigator.clipboard.writeText(`git clone ${url}`)
    .then(() => toast(`✓ Copied: git clone ${name}`));
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function animNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const steps = 35, step = target / steps;
  let i = 0;
  clearInterval(el._t);
  el._t = setInterval(() => {
    cur += step; i++;
    if (i >= steps) { cur = target; clearInterval(el._t); }
    el.textContent = fmt(Math.round(cur));
  }, 28);
}

function setLang(l, btn) {
  lang = l;
  document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTrending();
}

function setPeriod(p, btn) {
  period = p;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTrending();
}

function qs(term) {
  document.getElementById('search-input').value = term;
  doSearch(term);
}

function bindCursor() {
  document.querySelectorAll('a,button').forEach(el => {
    if (!el._cb) {
      el._cb = true;
      el.addEventListener('mouseenter', () => cur.style.cssText += ';width:20px;height:20px');
      el.addEventListener('mouseleave', () => cur.style.cssText += ';width:10px;height:10px');
    }
  });
}

/* ── INIT ── */
document.getElementById('search-btn').addEventListener('click', () =>
  doSearch(document.getElementById('search-input').value));
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch(e.target.value);
});

/* nav hide on scroll */
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const nav = document.querySelector('nav');
  nav.style.transform = y > lastY && y > 100 ? 'translateY(-100%)' : '';
  nav.style.transition = 'transform .3s';
  lastY = y;
}, {passive:true});

bindCursor();
loadTrending();
