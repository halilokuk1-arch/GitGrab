document.addEventListener('DOMContentLoaded', () => {
    // DOM Elementleri
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('resultsGrid');
    const searchTimeText = document.getElementById('searchTime');
    const trendingGrid = document.getElementById('trendingGrid');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const toast = document.getElementById('copyToast');

    // Toast Gösterme Fonksiyonu
    function showToast(message) {
        toast.querySelector('span').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Modal Açma Fonksiyonu
    function openRepoDetail(repo) {
        modalBody.innerHTML = `
            <div class="modal-repo-header">
                <img src="${repo.owner.avatar_url}" class="modal-avatar" alt="avatar">
                <div>
                    <div class="modal-repo-owner">${repo.owner.login}</div>
                    <div class="modal-repo-name">${repo.name}</div>
                </div>
            </div>
            <p class="modal-desc">${repo.description || 'Bu repo için bir açıklama bulunmuyor.'}</p>
            <div class="modal-stats">
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.stargazers_count.toLocaleString()}</div>
                    <div class="modal-stat-label">Yıldız</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.forks_count.toLocaleString()}</div>
                    <div class="modal-stat-label">Fork</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.open_issues_count.toLocaleString()}</div>
                    <div class="modal-stat-label">Açık Hata</div>
                </div>
                <div class="modal-stat">
                    <div class="modal-stat-value">${repo.language || 'N/A'}</div>
                    <div class="modal-stat-label">Dil</div>
                </div>
            </div>
            <div class="modal-clone-box">
                <span class="modal-clone-url">git clone https://github.com/${repo.full_name}.git</span>
                <button class="modal-copy-btn" id="copyBtn">Kopyala</button>
            </div>
            <div class="modal-actions">
                <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download">ZIP İndir</a>
                <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub'da Gör</a>
            </div>
        `;

        modalOverlay.classList.add('active');

        // Kopyalama Olayı
        document.getElementById('copyBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(`git clone https://github.com/${repo.full_name}.git`);
            showToast('Klonlama komutu panoya kopyalandı!');
        });
    }

    // Kart Oluşturma Motoru
    function createCard(repo) {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.innerHTML = `
            <div class="repo-card-header">
                <img src="${repo.owner.avatar_url}" class="repo-avatar" alt="avatar">
                <div class="repo-info">
                    <div class="repo-owner">${repo.owner.login}</div>
                    <div class="repo-name">${repo.name}</div>
                </div>
            </div>
            <p class="repo-desc">${repo.description || 'Açıklama yok.'}</p>
            <div class="repo-meta">
                <span class="meta-item">⭐ ${repo.stargazers_count.toLocaleString()}</span>
                <span class="meta-item">🌐 ${repo.language || 'Mix'}</span>
            </div>
            <div class="repo-actions">
                <a href="${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip" class="repo-action-btn btn-download action-bypass">İndir</a>
                <button class="repo-action-btn btn-view action-bypass" style="width:100%">Detaylar</button>
            </div>
        `;

        // Karta Tıklayınca Modal Açılsın (Ama butonlara tıklanırsa engelle)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.action-bypass')) {
                openRepoDetail(repo);
            }
        });

        // Detay butonuna tıklanınca da modal açılsın
        card.querySelector('.btn-view').addEventListener('click', (e) => {
            e.stopPropagation(); // Kartın kendi tıklamasını durdur
            openRepoDetail(repo);
        });

        return card;
    }

    // API'den Veri Çekme Fonksiyonu
    async function fetchRepos(query, gridElement, isSearch = false) {
        if (!query) return;
        
        const startTime = performance.now(); // Kronometreyi başlat
        gridElement.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        
        if (isSearch) resultsSection.style.display = 'block';

        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`);
            if (!res.ok) throw new Error("API Limiti");
            const data = await res.json();
            
            gridElement.innerHTML = '';
            
            // Eğer arama yapıldıysa süreyi yazdır
            if (isSearch) {
                const endTime = performance.now();
                searchTimeText.textContent = `${data.total_count.toLocaleString()} sonuç bulundu (${((endTime - startTime) / 1000).toFixed(2)} saniye)`;
                resultsSection.scrollIntoView({ behavior: 'smooth' }); // Sonuçlara kaydır
            }

            data.items.slice(0, 6).forEach(repo => {
                gridElement.appendChild(createCard(repo));
            });

        } catch (err) {
            gridElement.innerHTML = `<p style="color: #ef4444; text-align: center;">Çok fazla istek atıldı. Lütfen biraz bekleyin.</p>`;
        }
    }

    // --- BAŞLANGIÇ ÇALIŞTIRICILARI ---

    // 1. Sayfa açılınca trendleri getir
    fetchRepos('stars:>50000', trendingGrid);

    // 2. Arama butonu tetikleyicisi
    searchBtn.addEventListener('click', () => fetchRepos(searchInput.value, resultsGrid, true));
    
    // 3. Enter tuşu ile arama
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchRepos(searchInput.value, resultsGrid, true);
    });

    // 4. Popüler etiketlere (React, Python) tıklayarak arama
    document.querySelectorAll('.search-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.query;
            fetchRepos(tag.dataset.query, resultsGrid, true);
        });
    });

    // 5. Trendlerdeki dil filtreleri
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const q = btn.dataset.lang ? `language:${btn.dataset.lang} stars:>10000` : 'stars:>50000';
            fetchRepos(q, trendingGrid);
        });
    });

    // 6. Modal Kapatma İşlemleri
    closeModal.addEventListener('click', () => modalOverlay.classList.remove('active'));
    window.addEventListener('click', (e) => { 
        if(e.target === modalOverlay) modalOverlay.classList.remove('active'); 
    });
});
