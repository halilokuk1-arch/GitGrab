document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsArea = document.getElementById('results-area');
    const resultsGrid = document.getElementById('resultsGrid');
    const trendingGrid = document.getElementById('trendingGrid');
    const tags = document.querySelectorAll('.search-tag');
    const langBtns = document.querySelectorAll('.lang-btn');

    // GitHub'dan Veri Çekme Fonksiyonu
    async function fetchGitHub(query, targetGrid, isSearch = false) {
        targetGrid.innerHTML = '<div class="spinner"></div>';
        if(isSearch) resultsArea.style.display = 'block';

        try {
            const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`;
            const response = await fetch(url);
            const data = await response.json();
            
            targetGrid.innerHTML = '';
            data.items.slice(0, 9).forEach(repo => {
                const card = document.createElement('div');
                card.className = 'repo-card';
                card.innerHTML = `
                    <div class="repo-info">
                        <div class="repo-owner">${repo.owner.login}</div>
                        <div class="repo-name">${repo.name}</div>
                        <p class="repo-desc">${repo.description || 'Açıklama bulunmuyor.'}</p>
                        <div class="repo-meta">
                            <span class="meta-item">⭐ ${repo.stargazers_count}</span>
                            <span class="meta-item">🍴 ${repo.forks_count}</span>
                            <span class="meta-item">🌐 ${repo.language || 'Mix'}</span>
                        </div>
                        <div class="repo-actions">
                            <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">İndir (ZIP)</a>
                            <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
                        </div>
                    </div>`;
                targetGrid.appendChild(card);
            });
        } catch (error) {
            targetGrid.innerHTML = '<p>Veri çekilirken bir hata oluştu.</p>';
        }
    }

    // İlk açılışta Trendleri Yükle (Örn: Popüler olanlar)
    fetchGitHub('stars:>10000', trendingGrid);

    // Arama Tetikleyicileri
    searchBtn.addEventListener('click', () => fetchGitHub(searchInput.value, resultsGrid, true));
    
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.query;
            fetchGitHub(tag.dataset.query, resultsGrid, true);
        });
    });

    // Dil Filtreleri
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const lang = btn.dataset.lang;
            const query = lang ? `language:${lang} stars:>5000` : 'stars:>10000';
            fetchGitHub(query, trendingGrid);
        });
    });
});
