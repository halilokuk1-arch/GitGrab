document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsGrid = document.getElementById('resultsGrid');

    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        resultsGrid.innerHTML = '<p>Aranıyor...</p>';

        try {
            const response = await fetch(`https://api.github.com/search/repositories?q=${query}`);
            const data = await response.json();
            
            resultsGrid.innerHTML = ''; // Temizle
            
            data.items.forEach(repo => {
                const card = document.createElement('div');
                card.className = 'repo-card';
                card.innerHTML = `
                    <div class="repo-info">
                        <div class="repo-name">${repo.name}</div>
                        <div class="repo-desc">${repo.description || 'Açıklama yok.'}</div>
                        <div class="repo-meta">
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>🍴 ${repo.forks_count}</span>
                        </div>
                        <div class="repo-actions">
                            <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub'da Gör</a>
                        </div>
                    </div>
                `;
                resultsGrid.appendChild(card);
            });
        } catch (error) {
            resultsGrid.innerHTML = '<p>Bir hata oluştu. Lütfen tekrar deneyin.</p>';
        }
    });
});
