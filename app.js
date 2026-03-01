const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let rx = 0, ry = 0, cx = 0, cy = 0;
document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; cursor.style.left = cx+'px'; cursor.style.top = cy+'px'; });
(function animRing() { rx += (cx-rx)*.15; ry += (cy-ry)*.15; ring.style.left = rx+'px'; ring.style.top = ry+'px'; requestAnimationFrame(animRing); })();
document.querySelectorAll('a,button').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.transform='translate(-50%,-50%) scale(1.8)'; cursor.style.background='var(--accent2)'; ring.style.width='50px'; ring.style.height='50px'; });
  el.addEventListener('mouseleave', () => { cursor.style.transform='translate(-50%,-50%) scale(1)'; cursor.style.background='var(--accent)'; ring.style.width='36px'; ring.style.height='36px'; });
});

let currentLang = '', currentPeriod = 'daily', totalStars = 0;

const langColors = { JavaScript:'#f0e050',TypeScript:'#2b7489',Python:'#3572A5',Rust:'#dea584',Go:'#00ADD8',Java:'#b07219','C++':'#f34b7d',C:'#555555',Shell:'#89e051',Ruby:'#701516',Swift:'#ffac45',Vue:'#41b883',HTML:'#e34c26' };
const getLangColor = l => langColors[l] || '#f0883e';

function getZipUrl(fullName, defaultBranch) {
  return `https://github.com/${fullName}/archive/refs/heads/${defaultBranch || 'main'}.zip`;
}

async function loadTrending() {
  const grid = document.getElementById('trending-grid');
  grid.innerHTML = Array(7).fill('<div class="skeleton"></div>').join('');
  const days = { daily:1, weekly:7, monthly:30 }[currentPeriod];
  const since = new Date(Date.now() - days*86400000).toISOString().split('T')[0];
  let q = `created:>${since} stars:>10${currentLang ? ' language:'+currentLang : ''}`;
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`, { headers:{'Accept':'application/vnd.github.v3+json'} });
    const data = await res.json();
    data.items?.length ? renderTrending(data.items) : (grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--muted)">No results found.</div>');
    const rem = res.headers.get('X-RateLimit-Remaining');
    if (rem) document.getElementById('rate-limit-info').textContent = `API calls remaining: ${rem}/60`;
  } catch { renderTrending(mockData()); }
}

function renderTrending(repos) {
  const grid = document.getElementById('trending-grid');
  grid.innerHTML = '';
  repos.forEach((repo, i) => {
    const item = document.createElement('div');
    item.className = 'trending-item';
    item.style.animationDelay = (i*.06)+'s';
    const color = getLangColor(repo.language);
    const s = repo.stargazers_count > 1000 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count;
    const f = repo.forks_count > 1000 ? (repo.forks_count/1000).toFixed(1)+'k' : repo.forks_count;
    const zipUrl = getZipUrl(repo.full_name, repo.default_branch);
    item.innerHTML = `
      <div class="rank ${i<3?'top3':''}">${i<3?['①','②','③'][i]:i+1}</div>
      <div class="trending-info">
        <a href="${repo.html_url}" target="_blank" class="trending-repo-name">${repo.full_name}</a>
        <div class="trending-desc">${repo.description||'No description.'}</div>
      </div>
      <div class="trending-stats">
        <div class="stars-count">★ ${s}<span class="stars-new">↑ NEW</span></div>
        <div class="lang-badge"><span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block"></span>${repo.language||'Various'}<span style="margin-left:6px;color:var(--dim)">⑂ ${f}</span></div>
        <a class="trending-zip" href="${zipUrl}" target="_blank">⬇ Download ZIP</a>
      </div>`;
    item.addEventListener('click', e => { if (!e.target.closest('a')) copyClone(repo.clone_url, repo.name); });
    grid.appendChild(item);
    totalStars += repo.stargazers_count;
    animNum('live-stars', totalStars);
  });
}

function mockData() {
  return [
    { full_name:'microsoft/vscode', description:'Visual Studio Code', html_url:'https://github.com/microsoft/vscode', stargazers_count:165000, forks_count:29000, language:'TypeScript', clone_url:'https://github.com/microsoft/vscode.git', default_branch:'main' },
    { full_name:'torvalds/linux', description:'Linux kernel source tree', html_url:'https://github.com/torvalds/linux', stargazers_count:178000, forks_count:54000, language:'C', clone_url:'https://github.com/torvalds/linux.git', default_branch:'master' },
    { full_name:'facebook/react', description:'A declarative, efficient, and flexible JavaScript library', html_url:'https://github.com/facebook/react', stargazers_count:226000, forks_count:46000, language:'JavaScript', clone_url:'https://github.com/facebook/react.git', default_branch:'main' },
    { full_name:'rust-lang/rust', description:'Empowering everyone to build reliable and efficient software', html_url:'https://github.com/rust-lang/rust', stargazers_count:97000, forks_count:12500, language:'Rust', clone_url:'https://github.com/rust-lang/rust.git', default_branch:'master' },
    { full_name:'vercel/next.js', description:'The React Framework for the Web', html_url:'https://github.com/vercel/next.js', stargazers_count:126000, forks_count:27000, language:'JavaScript', clone_url:'https://github.com/vercel/next.js.git', default_branch:'canary' },
    { full_name:'openai/openai-python', description:'The official Python library for the OpenAI API', html_url:'https://github.com/openai/openai-python', stargazers_count:23000, forks_count:3200, language:'Python', clone_url:'https://github.com/openai/openai-python.git', default_branch:'main' },
  ];
}

async function doSearch(query) {
  if (!query.trim()) return;
  const sec = document.getElementById('results-section');
  const grid = document.getElementById('results-grid');
  sec.classList.add('visible');
  grid.innerHTML = Array(6).fill('<div class="skeleton" style="height:180px"></div>').join('');
  document.getElementById('results-title').textContent = `Searching "${query}"...`;
  document.getElementById('results-meta').textContent = '';
  sec.scrollIntoView({ behavior:'smooth', block:'start' });
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`, { headers:{'Accept':'application/vnd.github.v3+json'} });
    const data = await res.json();
    if (data.items?.length) {
      document.getElementById('results-title').textContent = `Results for "${query}"`;
      document.getElementById('results-meta').textContent = `${data.total_count.toLocaleString()} repositories found`;
      renderResults(data.items);
      animNum('live-stars', data.items.reduce((a,r)=>a+r.stargazers_count,0));
    } else {
      document.getElementById('results-title').textContent = `No results for "${query}"`;
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Nothing found.</div>';
    }
  } catch { document.getElementById('results-title').textContent = 'Error — try again in a moment'; grid.innerHTML = ''; }
}

function renderResults(repos) {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  repos.forEach((repo, i) => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = (i*.04)+'s';
    const color = getLangColor(repo.language);
    const s = repo.stargazers_count > 1000 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count;
    const topics = (repo.topics||[]).slice(0,3).map(t=>`<span class="topic-tag">${t}</span>`).join('');
    const zipUrl = getZipUrl(repo.full_name, repo.default_branch);
    card.innerHTML = `
      <div class="card-actions">
        <button class="clone-btn" onclick="copyClone('${repo.clone_url}','${repo.name}')">⎘ Clone</button>
        <a class="zip-btn" href="${zipUrl}" target="_blank">⬇ ZIP</a>
      </div>
      <div class="repo-owner"><img src="${repo.owner.avatar_url}" loading="lazy">${repo.owner.login}</div>
      <a class="repo-name" href="${repo.html_url}" target="_blank">${repo.name}</a>
      <div class="repo-desc">${repo.description||'No description provided.'}</div>
      <div class="repo-meta">
        <span class="repo-stat">★ ${s}</span>
        <span class="repo-stat">⑂ ${repo.forks_count}</span>
        ${repo.language?`<span class="repo-stat"><span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block;margin-right:2px"></span>${repo.language}</span>`:''}
      </div>
      ${topics?`<div class="repo-topics">${topics}</div>`:''}`;
    grid.appendChild(card);
  });
}

function copyClone(url, name) {
  navigator.clipboard.writeText(`git clone ${url}`).then(()=>showToast(`✓ Copied: git clone ${name}`));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3000);
}

function animNum(id, target) {
  const el = document.getElementById(id);
  let cur = parseInt(el.textContent.replace(/\D/g,''))||0;
  const step = (target-cur)/30; let i=0;
  const t = setInterval(()=>{
    cur+=step; i++;
    if(i>=30){cur=target;clearInterval(t);}
    el.textContent = cur>1e6?(cur/1e6).toFixed(1)+'M+':cur>1000?(cur/1000).toFixed(0)+'k':Math.round(cur).toLocaleString();
  },30);
}

function setLang(lang, btn) { currentLang=lang; document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); loadTrending(); }
function setTrendingPeriod(period, btn) { currentPeriod=period; document.querySelectorAll('.period-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); loadTrending(); }
function quickSearch(term) { document.getElementById('search-input').value=term; doSearch(term); }

document.getElementById('search-btn').addEventListener('click', ()=>doSearch(document.getElementById('search-input').value));
document.getElementById('search-input').addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(e.target.value); });

loadTrending();
setTimeout(()=>animNum('repo-count', 330000000), 800);
