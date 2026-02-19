/* ============================================
   XELINTEL — Tab Navigation & Search
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const sectionTabs = document.querySelectorAll('.section-tab');
    const subtopicBar = document.getElementById('subtopicBar');
    const allTopics = document.querySelectorAll('.topic-content');
    const searchInput = document.getElementById('searchInput');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchResults = document.getElementById('searchResults');

    let activeSection = 'ai-strategy';
    let activeTopic = null;

    // ─── Build topic index for search ──────────
    const topicIndex = [];
    allTopics.forEach(topic => {
        topicIndex.push({
            section: topic.dataset.section,
            topic: topic.dataset.topic,
            label: topic.dataset.label,
            text: topic.textContent,
            el: topic
        });
    });

    // ─── Section Tab Click ─────────────────────
    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            closeSearch();
            switchSection(tab.dataset.section);
        });
    });

    function switchSection(sectionId) {
        activeSection = sectionId;

        // Update tab styles
        sectionTabs.forEach(t => t.classList.toggle('active', t.dataset.section === sectionId));

        // Build subtopic pills
        buildSubtopicPills(sectionId);

        // Show first topic in that section
        const firstTopic = document.querySelector(`.topic-content[data-section="${sectionId}"]`);
        if (firstTopic) {
            showTopic(firstTopic.dataset.topic);
        }
    }

    function buildSubtopicPills(sectionId) {
        const topics = document.querySelectorAll(`.topic-content[data-section="${sectionId}"]`);
        let html = '';
        topics.forEach((t, i) => {
            const isActive = i === 0 ? 'active' : '';
            html += `<button class="subtopic-pill ${isActive}" data-topic="${t.dataset.topic}">${t.dataset.label}</button>`;
        });
        subtopicBar.innerHTML = html;

        // Bind pill clicks
        subtopicBar.querySelectorAll('.subtopic-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                closeSearch();
                showTopic(pill.dataset.topic);
            });
        });
    }

    function showTopic(topicId) {
        activeTopic = topicId;

        // Hide all, show selected
        allTopics.forEach(t => t.classList.remove('visible'));
        const target = document.querySelector(`.topic-content[data-topic="${topicId}"]`);
        if (target) {
            target.classList.add('visible');
            // Scroll content panel to top
            document.getElementById('contentPanel').scrollTop = 0;
        }

        // Update pill styles
        subtopicBar.querySelectorAll('.subtopic-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.topic === topicId);
        });
    }

    // ─── Navigate to specific section + topic ──
    function navigateTo(sectionId, topicId) {
        // Switch section tab
        activeSection = sectionId;
        sectionTabs.forEach(t => t.classList.toggle('active', t.dataset.section === sectionId));

        // Build pills for that section
        buildSubtopicPills(sectionId);

        // Show the specific topic
        showTopic(topicId);
    }

    // ─── Search ────────────────────────────────
    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = searchInput.value.trim();
        if (q.length < 2) {
            closeSearch();
            return;
        }
        searchTimeout = setTimeout(() => performSearch(q), 120);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            performSearch(searchInput.value.trim());
        }
    });

    function performSearch(query) {
        const lower = query.toLowerCase();
        const results = [];

        topicIndex.forEach(item => {
            if (item.text.toLowerCase().includes(lower)) {
                // Extract snippet
                const idx = item.text.toLowerCase().indexOf(lower);
                const start = Math.max(0, idx - 60);
                const end = Math.min(item.text.length, idx + query.length + 60);
                let snippet = (start > 0 ? '...' : '') + item.text.substring(start, end) + (end < item.text.length ? '...' : '');
                
                // Highlight
                const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
                snippet = snippet.replace(regex, '<mark>$1</mark>');

                // Section label
                const sectionTab = document.querySelector(`.section-tab[data-section="${item.section}"]`);
                const sectionLabel = sectionTab ? sectionTab.textContent.trim() : item.section;

                results.push({
                    section: item.section,
                    sectionLabel,
                    topic: item.topic,
                    label: item.label,
                    snippet
                });
            }
        });

        showSearchResults(results, query);
    }

    function showSearchResults(results, query) {
        searchOverlay.classList.remove('hidden');

        if (results.length === 0) {
            searchResults.innerHTML = `<div class="search-empty"><h3>No results for "${escapeHtml(query)}"</h3><p>Try different keywords</p></div>`;
            return;
        }

        let html = '';
        results.forEach(r => {
            html += `
                <div class="sr-item" data-section="${r.section}" data-topic="${r.topic}">
                    <div class="sr-section">${escapeHtml(r.sectionLabel)}</div>
                    <div class="sr-title">${escapeHtml(r.label)}</div>
                    <div class="sr-snippet">${r.snippet}</div>
                </div>`;
        });
        searchResults.innerHTML = html;

        // Click to navigate
        searchResults.querySelectorAll('.sr-item').forEach(item => {
            item.addEventListener('click', () => {
                closeSearch();
                navigateTo(item.dataset.section, item.dataset.topic);
            });
        });
    }

    function closeSearch() {
        searchOverlay.classList.add('hidden');
        searchResults.innerHTML = '';
    }

    // ─── Keyboard Shortcuts ────────────────────
    document.addEventListener('keydown', (e) => {
        // Ctrl+K → focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Escape → clear search
        if (e.key === 'Escape') {
            searchInput.value = '';
            closeSearch();
            searchInput.blur();
        }

        // Number keys 1-9 → switch sections
        if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== searchInput) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= sectionTabs.length) {
                e.preventDefault();
                const tab = sectionTabs[num - 1];
                switchSection(tab.dataset.section);
            }
        }

        // Arrow keys for subtopic navigation
        if (document.activeElement !== searchInput && !searchOverlay.classList.contains('hidden') === false) {
            const pills = subtopicBar.querySelectorAll('.subtopic-pill');
            const currentIdx = Array.from(pills).findIndex(p => p.classList.contains('active'));

            if (e.key === 'ArrowRight' && currentIdx < pills.length - 1) {
                e.preventDefault();
                showTopic(pills[currentIdx + 1].dataset.topic);
            }
            if (e.key === 'ArrowLeft' && currentIdx > 0) {
                e.preventDefault();
                showTopic(pills[currentIdx - 1].dataset.topic);
            }
        }
    });

    // ─── Utilities ─────────────────────────────
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Initialize ────────────────────────────
    switchSection('ai-strategy');
});
