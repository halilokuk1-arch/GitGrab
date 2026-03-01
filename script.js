document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('resultsGrid');
    const trendingGrid = document.getElementById('trendingGrid');

    // Senin o şık kart yapını oluşturan fonksiyon
    function createRepoCard(repo) {
        return `
            <div class="repo-card">
                <div class="repo-card-header">
                    <img src="${repo.owner.avatar_url}" class="repo-avatar" alt="avatar">
                    <div class="repo-info">
                        <div class="repo-owner">${repo.owner.login}</div>
                        <div class="repo-name">${repo.name}</div>
                    </div>
                </div>
                <p class="repo-desc">${repo.description || 'Açıklama yok.'}</p>
                <div class="repo-meta">
                    <span class="meta-item">⭐ ${repo.stargazers_count}</span>
                    <span class="meta-item">🍴 ${repo.forks_count}</span>
                </div>
                <div class="repo-actions">
                    <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">ZIP İndir</a>
                    <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
                </div>
            </div>`;
    }

    async function search(query, grid, isSearch = false) {
        if (!query) return;
        if (isSearch) resultsSection.style.display = 'block';
        grid.innerHTML = '<p>Yükleniyor...</p>';

        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars`);
            const data = await res.json();
            grid.innerHTML = '';
            data.items.slice(0, 6).forEach(repo => {
                grid.innerHTML += createRepoCard(repo);
            });
        } catch (e) {
            grid.innerHTML = '<p>Hata oluştu.</p>';
        }
    }

    // İlk açılışta trendleri çek (Eski kodundaki gibi dolu görünmesi için)
    search('stars:>80000', trendingGrid);

    searchBtn.addEventListener('click', () => search(searchInput.value, resultsGrid, true));
    
    document.querySelectorAll('.search-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.query;
            search(tag.dataset.query, resultsGrid, true);
        });
    });
});
