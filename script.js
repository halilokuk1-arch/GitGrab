document.addEventListener('DOMContentLoaded', () => {
    const trendingGrid = document.getElementById('trendingGrid');
    const resultsGrid = document.getElementById('resultsGrid');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const toast = document.getElementById('copyToast');

    // --- 1. SKELETON LOADING (Yükleme Efekti) ---
    function showSkeletons(gridElement, count = 6) {
        gridElement.innerHTML = '';
        for (let i = 0; i < count; i++) {
            gridElement.innerHTML += `
                <div class="repo-card skeleton">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>`;
        }
    }

    // --- 2. GÜÇLENDİRİLMİŞ TOAST ---
    function showEliteToast(msg, type = 'success') {
        const toastMsg = document.getElementById('toastMsg');
        toastMsg.textContent = msg;
        toast.style.borderColor = type === 'success' ? '#10b981' : '#f59e0b';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- 3. README ÖNİZLEME (Elite Özellik) ---
    async function getReadme(fullName) {
        try {
            const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
                headers: { 'Accept': 'application/vnd.github.raw' }
            });
            const text = await res.text();
            return text.slice(0, 500) + "..."; // İlk 500 karakter
        } catch {
            return "README dosyası yüklenemedi.";
        }
    }

    // --- 4. MODAL AÇILIŞ (README Entegrasyonu) ---
    async function openEliteDetail(repo) {
        modalBody.innerHTML = `<div class="spinner"></div><p style="text-align:center">Veriler analiz ediliyor...</p>`;
        modalOverlay.classList.add('active');

        const readmeContent = await getReadme(repo.full_name);

        modalBody.innerHTML = `
            <div class="modal-repo-header">
                <img src="${repo.owner.avatar_url}" class="modal-avatar">
                <div>
                    <div class="modal-repo-name">${repo.name}</div>
                    <div class="modal-repo-owner">@${repo.owner.login}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--accent-1); margin-bottom: 8px;">📖 Proje Özeti</h4>
                <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; font-size: 0.85rem; color: var(--text-secondary); max-height: 150px; overflow-y: auto;">
                    ${readmeContent}
                </div>
            </div>

            <div class="modal-stats">
                <div class="modal-stat"><div class="modal-stat-value">⭐ ${repo.stargazers_count}</div></div>
                <div class="modal-stat"><div class="modal-stat-value">🍴 ${repo.forks_count}</div></div>
                <div class="modal-stat"><div class="modal-stat-value">👁️ ${repo.watchers_count}</div></div>
            </div>

            <div class="modal-actions" style="margin-top: 20px;">
                <button class="repo-action-btn btn-download" id="shareBtn">🔗 Paylaş</button>
                <a href="${repo.html_url}" target="_blank" class="repo-action-btn btn-view">GitHub</a>
            </div>
        `;

        // Paylaş Butonu
        document.getElementById('shareBtn').onclick = () => {
            const shareText = `${repo.name} projesini keşfet! ${repo.html_url}`;
            navigator.clipboard.writeText(shareText);
            showEliteToast('Paylaşım linki kopyalandı!');
        };
    }

    // --- 5. KART OLUŞTURMA ---
    function createEliteCard(repo) {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.innerHTML = `
            <div class="repo-card-header">
                <img src="${repo.owner.avatar_url}" class="repo-avatar">
                <div class="repo-info">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-owner">${repo.owner.login}</div>
                </div>
            </div>
            <div class="repo-topics">
                ${(repo.topics || []).slice(0, 3).map(t => `<span class="topic-tag">${t}</span>`).join('')}
            </div>
            <div class="repo-meta">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>${repo.language || 'Code'}</span>
            </div>
        `;
        card.onclick = () => openEliteDetail(repo);
        return card;
