document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const loadingTrend = document.getElementById('loadingTrend');

    // Senin CSS yapına tam uyumlu Kart Tasarımı
    function generateCardHTML(repo) {
        return `
            <div class="repo-card">
                <div class="repo-card-header">
                    <img src="${repo.owner.avatar_url}" class="repo-avatar" alt="avatar">
                    <div class="repo-info">
                        <div class="repo-owner">${repo.owner.login}</div>
                        <div class="repo-name">${repo.name}</div>
                    </div>
                </div>
                <p class="repo-desc">${repo.description || 'Açıklama bulunmuyor.'}</p>
                <div class="repo-meta">
                    <span class="meta-item">⭐ ${repo.stargazers_count.toLocaleString()}</span>
                    <span class="meta-item">🍴 ${repo.forks_count.toLocaleString()}</span>
                    <span class="meta-item">🌐 ${repo.language || 'Mix'}</span>
                </div>
                <div class="repo-actions">
                    <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">ZIP İndir</a>
                    <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
                </div>
            </div>`;
    }

    async function loadRepos(query = 'stars:>50000') {
        if (loadingTrend) loadingTrend.style.display = 'block';
        trendingGrid.innerHTML = '';

        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`);
            const data = await res.json();
            
            if (loadingTrend) loadingTrend.style.display = 'none';

            data.items.slice(0, 6).forEach(repo => {
                trendingGrid.innerHTML += generateCardHTML(repo);
            });
        } catch (err) {
            loadingTrend.innerHTML = '<p style="color:red">Bağlantı hatası! Lütfen yenileyin.</p>';
        }
    }

    // Başlat
    loadRepos();

    // Filtreleme butonları
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const q = btn.dataset.lang ? `language:${btn.dataset.lang} stars:>10000` : 'stars:>50000';
            loadRepos(q);
        });
    });
});
