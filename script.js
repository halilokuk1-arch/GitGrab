document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const resultsGrid = document.getElementById('resultsGrid');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const toast = document.getElementById('copyToast');

    // --- 1. SKELETON LOAD (Yükleme Efekti) ---
    function showSkeletons(grid) {
        grid.innerHTML = Array(6).fill('<div class="skeleton-card skeleton"></div>').join('');
    }

    // --- 2. README ÇEKME FONKSİYONU ---
    async function fetchReadme(fullName) {
        try {
            const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
                headers: { 'Accept': 'application/vnd.github.raw' }
            });
            if (!res.ok) return "Bu proje için README detayı bulunamadı.";
            const text = await res.text();
            return marked.parse(text); // Markdown'ı HTML'e çevirir
        } catch {
            return "Detaylar yüklenirken bir hata oluştu.";
        }
    }

    // --- 3. MODAL AÇILIŞ (README VE ETİKETLER) ---
    async function openEliteDetail(repo) {
        modalOverlay.classList.add('active');
        modalBody.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <div class="spinner"></div>
                <p>Proje detayları ve README analiz ediliyor...</p>
            </div>
        `;

        const readmeHTML = await fetchReadme(repo.full_name);

        modalBody.innerHTML = `
            <div class="modal-repo-header">
                <img src="${repo.owner.avatar_url}" class="modal-avatar">
                <div>
                    <div class="modal-repo-name">${repo.name}</div>
                    <div class="modal-repo-owner">@${repo.owner.login}</div>
                </div>
            </div>

            <div class="repo-topics" style="margin-bottom: 15px;">
                ${(repo.topics || []).map(t => `<span class="topic-tag">${t}</span>`).join('')}
            </div>
            
            <div class="readme-box">
                ${readmeHTML}
            </div>

            <div class="modal-stats" style="margin-top: 20px;">
                <div class="modal-stat"><div class="modal-stat-value">⭐ ${repo.stargazers_count.toLocaleString()}</div><div class="modal-stat-label">Yıldız</div></div>
                <div class="modal-stat"><div class="modal-stat-value">🍴 ${repo.forks_count.toLocaleString()}</div><div class="modal-stat-label">Fork</div></div>
                <div class="modal-stat"><div class="modal-stat-value">${repo.language || 'Mix'}</div><div class="modal-stat-label">Dil</div></div>
            </div>

            <div class="modal-actions" style="margin-top: 20px;">
                <button class="repo-action-btn btn-download" id="shareBtn">🔗 Paylaş</button>
                <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub'da Aç</a>
            </div>
        `;

        document.getElementById('shareBtn').onclick = () => {
            navigator.clipboard.writeText(`Hey, bu projeye bakmalısın: ${repo.html_url}`);
            showToast('Paylaşım linki kopyalandı!');
        };
    }

    // --- 4. KART OLUŞTURMA (TOPICS EKLENDİ) ---
    function createEliteCard(repo) {
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
            <div class="repo-topics">
                ${(repo.topics || []).slice(0, 3).map(t => `<span class="topic-tag">${t}</span>`).join('')}
            </div>
            <div class="repo-meta">
                <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>
                <span>🌐 ${repo.language || 'Mix'}</span>
            </div>
        `;
        card.onclick = () => openEliteDetail(repo);
        return card;
    }

    // --- 5. ANA VERİ MOTORU ---
    async function loadRepos(q, grid) {
        showSkeletons(grid);
        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc`);
            const data = await res.json();
            grid.innerHTML = '';
            data.items.slice(0, 6).forEach(repo => grid.appendChild(createEliteCard(repo)));
        } catch (err) {
            grid.innerHTML = '<p>Veri çekme sınırı aşıldı, lütfen biraz bekleyin.</p>';
        }
    }

    // Başlatıcılar
    loadRepos('stars:>100000', trendingGrid);
    
    document.getElementById('searchBtn').onclick = () => {
        const val = document.getElementById('searchInput').value;
        document.getElementById('results-section').style.display = 'block';
        loadRepos(val, resultsGrid);
    };

    document.getElementById('closeModal').onclick = () => modalOverlay.classList.remove('active');
    
    function showToast(msg) {
        toast.querySelector('span').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
