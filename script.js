document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('resultsArea');
    const resultsGrid = document.getElementById('resultsGrid');
    const trendingGrid = document.getElementById('trendingGrid');
    const langBtns = document.querySelectorAll('.lang-btn');
    const searchTags = document.querySelectorAll('.search-tag');

    // GitHub'dan veri çekme fonksiyonu
    async function getRepos(query, grid, showArea = false) {
        grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        if (showArea) resultsArea.style.display = 'block';

        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`);
            const data = await res.json();
            
            grid.innerHTML = '';
            data.items.slice(0, 8).forEach(repo => {
                grid.innerHTML += `
                    <div class="repo-card">
                        <div class="repo-info">
                            <div class="repo-owner">${repo.owner.login}</div>
                            <div class="repo-name">${repo.name}</div>
                            <p class="repo-desc">${repo.description || 'Açıklama yok.'}</p>
                            <div class="repo-meta">
                                <span>⭐ ${repo.stargazers_count}</span>
                                <span>🍴 ${repo.forks_count}</span>
                                <span>🌐 ${repo.language || 'N/A'}</span>
                            </div>
                            <div class="repo-actions">
                                <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">ZIP İndir</a>
                                <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
                            </div>
                        </div>
                    </div>`;
            });
        } catch (err) {
            grid.innerHTML = '<p>Veri çekilemedi. Lütfen internetinizi kontrol edin.</p>';
        }
    }

    // İlk yüklemede trendleri getir
    getRepos('stars:>20000', trendingGrid);

    // Arama Butonu
    searchBtn.addEventListener('click', () => getRepos(searchInput.value, resultsGrid, true));

    // Popüler Etiketler
    searchTags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.query;
            getRepos(tag.dataset.query, resultsGrid, true);
        });
    });

    // Dil Filtreleri
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const q = btn.dataset.lang ? `language:${btn.dataset.lang} stars:>5000` : 'stars:>20000';
            getRepos(q, trendingGrid);
        });
    });
});
