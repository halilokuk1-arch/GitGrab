document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const toast = document.getElementById('copyToast');

    // --- 1. FONKSİYON: TOAST GÖSTER ---
    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- 2. FONKSİYON: DETAY PENCERESİNİ AÇ ---
    function openRepoDetail(repo) {
        modalBody.innerHTML = `
            <div class="modal-repo-header">
                <img src="${repo.owner.avatar_url}" class="modal-avatar" alt="avatar">
                <div>
                    <div class="modal-repo-owner">${repo.owner.login}</div>
                    <div class="modal-repo-name">${repo.name}</div>
                </div>
            </div>
            <p class="modal-desc">${repo.description || 'Açıklama bulunmuyor.'}</p>
            <div class="modal-stats">
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.stargazers_count}</div>
                    <div class="modal-stat-label">Yıldız</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.forks_count}</div>
                    <div class="modal-stat-label">Fork</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.open_issues_count}</div>
                    <div class="modal-stat-label">Issue</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.language || 'Mix'}</div>
                    <div class="modal-stat-label">Dil</div>
                </div>
            </div>
            <div class="modal-clone-box">
                <span class="modal-clone-url">https://github.com/${repo.full_name}.git</span>
                <button class="modal-copy-btn" id="copyBtn">Kopyala</button>
            </div>
            <div class="modal-actions">
                <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">ZIP Olarak İndir</a>
                <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub'da Aç</a>
            </div>
        `;

        modalOverlay.classList.add('active');

        // Kopyala butonu işlevi
        document.getElementById('copyBtn').onclick = () => {
            navigator.clipboard.writeText(`https://github.com/${repo.full_name}.git`);
            showToast();
        };
    }

    // --- 3. FONKSİYON: KART OLUŞTURMA (MODAL ENTEGRELİ) ---
    function createCard(repo) {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.innerHTML = `
            <div class="repo-card-header">
                <img src="${repo.owner.avatar_url}" class="repo-avatar">
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
        `;
        
        // Karta tıklayınca modalı aç
        card.onclick = () => openRepoDetail(repo);
        return card;
    }

    // --- 4. VERİ ÇEKME ---
    async function loadRepos(q = 'stars:>50000') {
        trendingGrid.innerHTML = '<div class="spinner"></div>';
        const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc`);
        const data = await res.json();
        trendingGrid.innerHTML = '';
        data.items.slice(0, 6).forEach(repo => {
            trendingGrid.appendChild(createCard(repo));
        });
    }

    // Modal Kapatma
    closeModal.onclick = () => modalOverlay.classList.remove('active');
    window.onclick = (e) => { if(e.target == modalOverlay) modalOverlay.classList.remove('active'); };

    loadRepos();
});
