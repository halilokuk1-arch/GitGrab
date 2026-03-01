document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const loadingTrend = document.getElementById('loadingTrend');

    // Kart Oluşturma Fonksiyonu (Senin CSS'ine tam uyumlu)
    function createCard(repo) {
        return `
            <div class="repo-card">
                <div class="repo-card-header">
                    <img src="${repo.owner.avatar_url}" class="repo-avatar" alt="avatar">
                    <div class="repo-info">
                        <div class="repo-owner">${repo.owner.login}</div>
                        <div class="repo-name">${repo.name}</div>
                    </div>
                </div>
                <p class="repo-desc">${repo.description || 'Bu repo için bir açıklama bulunmuyor.'}</p>
                <div class="repo-topics">
                    ${(repo.topics || []).slice(0, 3).map(t => `<span class="topic-tag">${t}</span>`).join('')}
                </div>
                <div class="repo-meta">
                    <span class="meta-item">⭐ ${repo.stargazers_count.toLocaleString()}</span>
                    <span class="meta-item">🍴 ${repo.forks_count.toLocaleString()}</span>
                    <span class="meta-item"><span class="lang-dot" style="background:#6366f1"></span> ${repo.language || 'Mix'}</span>
                </div>
                <div class="repo-actions">
                    <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        ZIP İndir
                    </a>
                    <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
                </div>
            </div>`;
    }

    async function loadTrending(query = 'stars:>50000') {
        loadingTrend.style.display = 'block';
        trendingGrid.innerHTML = '';
        
        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`);
            const data = await res.json();
            
            loadingTrend.style.display = 'none';
            data.items.slice(0, 6).forEach(repo => {
                trendingGrid.innerHTML += createCard(repo);
            });
        } catch (err) {
            loadingTrend.innerHTML = '<p>GitHub Kotası Doldu, biraz bekleyin.</p>';
        }
    }

    // Sayfa açılınca en popülerleri getir
    loadTrending();

    // Dil filtrelerini çalıştır
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            const q = lang ? `language:${lang} stars:>10000` : 'stars:>50000';
            loadTrending(q);
        });
    });
});
