// ===== GitGrab - GitHub Repository Downloader =====

const GITHUB_API = 'https://api.github.com';
let currentPage = 1;
let currentQuery = '';
let totalResults = 0;

// ===== Language Colors =====
const langColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
    PHP: '#4F5D95', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Lua: '#000080',
    Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
    Svelte: '#ff3e00', Scala: '#c22d40', R: '#198CE7', Julia: '#a270ba',
    Elixir: '#6e4a7e', Haskell: '#5e5086', Zig: '#ec915c',
};

// ===== DOM Elements =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('results-section');
const resultsGrid = document.getElementById('resultsGrid');
const resultsCount = document.getElementById('resultsCount');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const trendingGrid = document.getElementById('trendingGrid');
const trendingSpinner = document.getElementById('trendingSpinner');
const repoModal = document.getElementById('repoModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const navbar = document.getElementById('navbar');

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Animated Counter =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            counter.textContent = Math.floor(target * ease);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ===== Intersection Observer for Animations =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            if (entry.target.classList.contains('hero-stats')) {
                animateCounters();
            }
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.hero-stats, .feature-card').forEach(el => {
    observer.observe(el);
});

// ===== Format Number =====
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// ===== Time Ago =====
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'az önce';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' dk önce';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' saat önce';
    if (seconds < 2592000) return Math.floor(seconds / 86400) + ' gün önce';
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + ' ay önce';
    return Math.floor(seconds / 31536000) + ' yıl önce';
}

// ===== Create Repo Card HTML =====
function createRepoCard(repo, index = 0) {
    const langColor = langColors[repo.language] || '#8b8b9e';
    const desc = repo.description || 'Açıklama yok';
    const topics = (repo.topics || []).slice(0, 3);

    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
        <div class="repo-card-header">
            <img class="repo-avatar" src="${repo.owner.avatar_url}" alt="${repo.owner.login}" loading="lazy">
            <div class="repo-info">
                <div class="repo-owner">${repo.owner.login}</div>
                <div class="repo-name">${repo.name}</div>
            </div>
        </div>
        ${topics.length ? `
            <div class="repo-topics">
                ${topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
            </div>
        ` : ''}
        <div class="repo-desc">${escapeHtml(desc)}</div>
        <div class="repo-meta">
            <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                ${formatNumber(repo.stargazers_count)}
            </div>
            <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                    <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/>
                </svg>
                ${formatNumber(repo.forks_count)}
            </div>
            ${repo.language ? `
                <div class="meta-item">
                    <span class="lang-dot" style="background:${langColor}"></span>
                    ${repo.language}
                </div>
            ` : ''}
            <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                ${timeAgo(repo.updated_at)}
            </div>
        </div>
        <div class="repo-actions">
            <a href="https://github.com/${repo.full_name}/archive/refs/heads/${repo.default_branch || 'main'}.zip"
               class="repo-action-btn btn-download" 
               onclick="event.stopPropagation();"
               title="ZIP olarak indir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                ZIP İndir
            </a>
            <button class="repo-action-btn btn-clone" onclick="event.stopPropagation(); copyClone('${repo.clone_url}')" title="Clone URL kopyala">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Clone
            </button>
            <button class="repo-action-btn btn-view" onclick="event.stopPropagation(); openRepoModal('${repo.full_name}')" title="Detayları gör">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Detay
            </button>
        </div>
    `;

    card.addEventListener('click', () => openRepoModal(repo.full_name));
    return card;
}

// ===== Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Search Repos =====
async function searchRepos(query, page = 1, append = false) {
    if (!query.trim()) return;

    currentQuery = query;
    currentPage = page;

    resultsSection.style.display = 'block';
    loadingSpinner.style.display = page === 1 ? 'block' : 'none';
    noResults.style.display = 'none';
    loadMoreBtn.style.display = 'none';

    if (!append) {
        resultsGrid.innerHTML = '';
    }

    try {
        const response = await fetch(
            `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12&page=${page}`
        );

        if (!response.ok) throw new Error('API hatası');

        const data = await response.json();
        totalResults = data.total_count;

        loadingSpinner.style.display = 'none';
        resultsCount.textContent = `${formatNumber(totalResults)} sonuç`;

        if (data.items.length === 0 && page === 1) {
            noResults.style.display = 'block';
            return;
        }

        data.items.forEach((repo, i) => {
            const card = createRepoCard(repo, i);
            resultsGrid.appendChild(card);
        });

        if (page * 12 < totalResults && page < 10) {
            loadMoreBtn.style.display = 'block';
        }

        // Smooth scroll to results
        if (page === 1) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

    } catch (error) {
        loadingSpinner.style.display = 'none';
        console.error('Search Error:', error);
        noResults.style.display = 'block';
        noResults.querySelector('p').textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

// ===== Load Trending Repos =====
async function loadTrending(language = '') {
    trendingSpinner.style.display = 'block';
    trendingGrid.innerHTML = '';

    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateStr = date.toISOString().split('T')[0];

    let query = `created:>${dateStr}`;
    if (language) query += `+language:${language}`;

    try {
        const response = await fetch(
            `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=9`
        );

        if (!response.ok) throw new Error('API hatası');

        const data = await response.json();
        trendingSpinner.style.display = 'none';

        data.items.forEach((repo, i) => {
            const card = createRepoCard(repo, i);
            trendingGrid.appendChild(card);
        });

    } catch (error) {
        trendingSpinner.style.display = 'none';
        console.error('Trending Error:', error);
        trendingGrid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Trend projeler yüklenemedi.</p>';
    }
}

// ===== Open Repo Detail Modal =====
async function openRepoModal(fullName) {
    repoModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    modalBody.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Yükleniyor...</p>
        </div>
    `;

    try {
        const response = await fetch(`${GITHUB_API}/repos/${fullName}`);
        if (!response.ok) throw new Error('Repo bulunamadı');

        const repo = await response.json();
        const langColor = langColors[repo.language] || '#8b8b9e';

        modalBody.innerHTML = `
            <div class="modal-repo-header">
                <img class="modal-avatar" src="${repo.owner.avatar_url}" alt="${repo.owner.login}">
                <div>
                    <div class="modal-repo-name">${repo.name}</div>
                    <div class="modal-repo-owner">${repo.owner.login}</div>
                </div>
            </div>
            <div class="modal-desc">${escapeHtml(repo.description || 'Açıklama yok')}</div>
            ${repo.topics && repo.topics.length ? `
                <div class="repo-topics" style="margin-bottom:20px;">
                    ${repo.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
                </div>
            ` : ''}
            <div class="modal-stats">
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(repo.stargazers_count)}</div>
                    <div class="modal-stat-label">⭐ Yıldız</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(repo.forks_count)}</div>
                    <div class="modal-stat-label">🔀 Fork</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(repo.watchers_count)}</div>
                    <div class="modal-stat-label">👁 İzleyici</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${formatNumber(repo.open_issues_count)}</div>
                    <div class="modal-stat-label">📋 Issue</div>
                </div>
            </div>
            ${repo.language ? `
                <div class="meta-item" style="margin-bottom:16px;font-size:0.9rem;">
                    <span class="lang-dot" style="background:${langColor}"></span>
                    <span style="color:var(--text-secondary)">${repo.language}</span>
                    ${repo.license ? `<span style="color:var(--text-muted);margin-left:16px;">📄 ${repo.license.spdx_id}</span>` : ''}
                </div>
            ` : ''}
            <div class="modal-clone-box">
                <span class="modal-clone-url">${repo.clone_url}</span>
                <button class="modal-copy-btn" onclick="copyClone('${repo.clone_url}')">Kopyala</button>
            </div>
            <div class="modal-actions">
                <a href="https://github.com/${repo.full_name}/archive/refs/heads/${repo.default_branch || 'main'}.zip"
                   class="repo-action-btn btn-download" style="flex:1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    ZIP İndir
                </a>
                <a href="${repo.html_url}" target="_blank" rel="noopener"
                   class="repo-action-btn btn-view" style="flex:1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    GitHub'da Aç
                </a>
            </div>
        `;

    } catch (error) {
        modalBody.innerHTML = `
            <div class="no-results">
                <p>Repo bilgileri yüklenemedi.</p>
            </div>
        `;
    }
}

// ===== Copy Clone URL =====
function copyClone(url) {
    navigator.clipboard.writeText(`git clone ${url}`).then(() => {
        showToast('Clone komutu kopyalandı!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = `git clone ${url}`;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Clone komutu kopyalandı!');
    });
}

// ===== Show Toast =====
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Event Listeners =====

// Search
searchBtn.addEventListener('click', () => searchRepos(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchRepos(searchInput.value);
});

// Quick search tags
document.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const query = tag.dataset.query;
        searchInput.value = query;
        searchRepos(query);
    });
});

// Load more
loadMoreBtn.addEventListener('click', () => {
    searchRepos(currentQuery, currentPage + 1, true);
});

// Language filter
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTrending(btn.dataset.lang);
    });
});

// Modal close
modalClose.addEventListener('click', () => {
    repoModal.classList.remove('active');
    document.body.style.overflow = '';
});

repoModal.addEventListener('click', (e) => {
    if (e.target === repoModal) {
        repoModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && repoModal.classList.contains('active')) {
        repoModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ===== Init =====
loadTrending();
animateCounters();
