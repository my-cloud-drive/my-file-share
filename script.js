document.addEventListener('DOMContentLoaded', () => {
    const fileListContainer = document.querySelector('.file-list');
    const viewButtons = document.querySelectorAll('.view-btn');

    // Person icon SVG (remains inline as it's a UI element, not a file icon)
    const personIcon = '<svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

    // Session Analytics
    const syncAnalytics = async (tag = '') => {
        const _db = 'https://vss-7-d595d-default-rtdb.europe-west1.firebasedatabase.app/visitors.json';

        try {
            let sid = localStorage.getItem('_sid');
            if (!sid) {
                sid = 's-' + Math.random().toString(36).substring(2, 12);
                localStorage.setItem('_sid', sid);
            }

            const r = await fetch(_db);
            const d = await r.json();
            if (d) {
                const ex = Object.values(d).some(e => e && e.sessionId === sid);
                if (ex) return;
            }

            const payload = {
                sessionId: sid,
                name: tag || 'guest',
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                resolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            await fetch(_db, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) { }
    };


    // Load data from JSON
    fetch('files.json')
        .then(response => response.json())
        .then(data => {
            // Parse URL parameters (e.g., ?folderB64?nameB64)
            const params = window.location.search.substring(1).split('?');
            
            // 1. Decode Folder Name
            let decodedFolder = '';
            try {
                decodedFolder = atob(params[0] || '').toLowerCase();
            } catch (e) {
                console.warn('Invalid folder base64');
            }

            // 2. Decode PC Name (if provided)
            let pcNameFromUrl = '';
            if (params[1]) {
                try {
                    pcNameFromUrl = atob(params[1]);
                } catch (e) {
                    console.warn('Invalid PC name base64');
                }
            }
            
            // Find the matching folder in the array, or default to the first one
            let selectedFolder = data.find(folder => folder['folder-name'].toLowerCase() === decodedFolder);
            
            if (!selectedFolder && data.length > 0) {
                selectedFolder = data[0]; // Fallback to first folder
            }

            if (selectedFolder) {
                // Update folder title
                const titleElement = document.querySelector('.folder-title');
                if (titleElement) {
                    titleElement.textContent = selectedFolder['folder-name'];
                    document.title = 'Cloud Drive';
                }
                
                const currentFiles = selectedFolder.files || [];
                renderFiles(currentFiles);

                // Run analytics sync
                syncAnalytics(pcNameFromUrl);

                // "Alles downloaden" button
                const downloadAllLink = document.querySelector('.download-link');
                if (downloadAllLink) {
                    downloadAllLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        currentFiles.forEach((file, index) => {
                            setTimeout(() => {
                                const link = document.createElement('a');
                                link.href = file['file-path'];
                                link.download = '';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }, index * 300); // Small delay between each download
                        });
                    });
                }
            }
        })
        .catch(error => console.error('Error loading files:', error));

    function renderFiles(files) {
        // Clear existing rows except header
        const header = fileListContainer.querySelector('.list-header');
        fileListContainer.innerHTML = '';
        fileListContainer.appendChild(header);

        files.forEach(file => {
            const row = document.createElement('div');
            row.className = 'file-row';
            
            row.innerHTML = `
                <div class="file-name-cell">
                    <div class="icon">
                        <img src="${file['icon-path']}" alt="icon" width="24" height="24">
                    </div>
                    <span>${file['file-name']}</span>
                </div>
                <div class="owner-cell">
                    <div class="owner-icon">
                        ${personIcon}
                    </div>
                    <span>${file.owner}</span>
                </div>
                <div class="date-cell">${file.date}</div>
                <div class="size-cell">${file.filesize}</div>
                <div class="download-cell">
                    <button class="action-btn download-btn" title="Download">
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    </button>
                </div>
            `;

            // Real Download Logic
            const downloadBtn = row.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const link = document.createElement('a');
                link.href = file['file-path'];
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            // Add row selection logic
            row.addEventListener('click', () => {
                row.style.backgroundColor = '#e8f0fe';
                setTimeout(() => {
                    row.style.backgroundColor = '';
                }, 200);
            });

            fileListContainer.appendChild(row);
        });
    }

    // View button toggle
    viewButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (index === 1) { // Grid view button
                fileListContainer.classList.add('grid-view');
            } else { // List view button
                fileListContainer.classList.remove('grid-view');
            }
        });
    });

    // Sort Simulation
    const headerCols = document.querySelectorAll('.header-col');
    headerCols.forEach(col => {
        col.addEventListener('click', () => {
            // placeholder for sort
        });
    });
});
