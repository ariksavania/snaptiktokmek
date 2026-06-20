document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const downloadForm = document.getElementById('download-form');
    const tiktokUrlInput = document.getElementById('tiktok-url');
    const pasteBtn = document.getElementById('paste-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    const loader = document.getElementById('loader');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    
    const downloaderCard = document.getElementById('downloader-card');
    const resultCard = document.getElementById('result-card');
    const resultUsername = document.getElementById('result-username');
    const resultCaption = document.getElementById('result-caption');
    const resultAvatar = document.getElementById('result-avatar');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const resultThumbnail = document.getElementById('result-thumbnail');
    const videoPreviewWrapper = document.getElementById('video-preview-wrapper');
    
    const downloadVideoBtn = document.getElementById('download-video-btn');
    const downloadMusicBtn = document.getElementById('download-music-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const faqItems = document.querySelectorAll('.faq-item');

    // =========================================================================
    // PASTING UTILITY FROM CLIPBOARD
    // =========================================================================
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                tiktokUrlInput.value = text;
                // Add focus for styling triggers
                tiktokUrlInput.focus();
            }
        } catch (err) {
            console.error('Gagal mengakses clipboard: ', err);
            // Fallback: alert user if clipboard permissions denied
            alert('Tidak dapat membaca clipboard otomatis. Silakan tempel secara manual dengan klik kanan atau Ctrl+V.');
        }
    });

    // =========================================================================
    // FORM SUBMIT & DOWNLOAD LOGIC
    // =========================================================================
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = tiktokUrlInput.value.trim();
        if (!url) return;

        // Reset States
        hideElement(errorAlert);
        showElement(loader);
        
        // Disable form inputs during request
        tiktokUrlInput.disabled = true;
        submitBtn.disabled = true;
        pasteBtn.disabled = true;

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Populate Result Details
                resultUsername.textContent = '@' + data.username;
                resultCaption.textContent = data.caption;
                
                // Configure Avatar Profile Picture
                if (data.avatar) {
                    resultAvatar.src = data.avatar;
                    showElement(resultAvatar);
                    hideElement(avatarPlaceholder);
                } else {
                    hideElement(resultAvatar);
                    showElement(avatarPlaceholder);
                }

                // Configure Video Preview Thumbnail
                if (data.thumbnail) {
                    resultThumbnail.src = data.thumbnail;
                    showElement(videoPreviewWrapper);
                } else {
                    hideElement(videoPreviewWrapper);
                }

                // Configure Download Buttons
                downloadVideoBtn.setAttribute('href', data.video_url);
                
                if (data.music_url) {
                    downloadMusicBtn.setAttribute('href', data.music_url);
                    showElement(downloadMusicBtn);
                } else {
                    hideElement(downloadMusicBtn);
                }

                // Switch UI states
                hideElement(loader);
                hideElement(downloaderCard);
                showElement(resultCard);
            } else {
                throw new Error(data.error || 'Terjadi kesalahan sistem. Hubungi administrator.');
            }

        } catch (err) {
            // Show error message
            errorMessage.textContent = err.message;
            hideElement(loader);
            showElement(errorAlert);
        } finally {
            // Re-enable form inputs
            tiktokUrlInput.disabled = false;
            submitBtn.disabled = false;
            pasteBtn.disabled = false;
        }
    });

    // =========================================================================
    // FLOW RESET (Download another video)
    // =========================================================================
    resetBtn.addEventListener('click', () => {
        // Clear input form
        tiktokUrlInput.value = '';
        
        // Restore elements visibility
        hideElement(resultCard);
        showElement(downloaderCard);
        tiktokUrlInput.focus();
    });

    // =========================================================================
    // FAQ ACCORDION COLLAPSE INTERACTION
    // =========================================================================
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all active items
            faqItems.forEach(innerItem => {
                innerItem.classList.remove('active');
            });

            // If not active before, toggle it
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
    function showElement(el) {
        if (el) el.classList.remove('hidden');
    }

    function hideElement(el) {
        if (el) el.classList.add('hidden');
    }
});
