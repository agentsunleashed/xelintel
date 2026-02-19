/* ===================================================
   XELINTEL — App Logic
   Tab switching · Subtopic pills · Search
   =================================================== */

(function () {
    'use strict';

    // ── DOM REFS ────────────────────────────────────
    const sectionTabs  = document.querySelectorAll('.section-tab');
    const subtopicBar  = document.getElementById('subtopicBar');
    const contentPanel = document.getElementById('contentPanel');
    const articles     = document.querySelectorAll('.topic-content');
    const searchInput  = document.getElementById('searchInput');
    const searchOverlay= document.getElementById('searchOverlay');
    const searchResults= document.getElementById('searchResults');

    let currentSection = 'intro';
    let currentTopic   = null;

    // ── INIT ────────────────────────────────────────
    function init() {
        buildPills('intro');
        bindTabs();
        bindSearch();
        bindKeyboard();
        showFirstTopic('intro');
    }

    // ── TAB SWITCHING ───────────────────────────────
    function bindTabs() {
        sectionTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.dataset.section;
                if (section === currentSection) return;
                activateSection(section);
            });
        });
    }

    function activateSection(section) {
        currentSection = section;
        sectionTabs.forEach(t => t.classList.toggle('active', t.dataset.section === section));
        buildPills(section);
        showFirstTopic(section);
        clearSearch();
    }

    // ── SUBTOPIC PILLS ──────────────────────────────
    function buildPills(section) {
        subtopicBar.innerHTML = '';
        const topics = document.querySelectorAll(`.topic-content[data-section="${section}"]`);
        topics.forEach((art, i) => {
            const pill = document.createElement('button');
            pill.className = 'subtopic-pill' + (i === 0 ? ' active' : '');
            pill.textContent = art.dataset.label;
            pill.dataset.topic = art.dataset.topic;
            pill.addEventListener('click', () => selectPill(pill));
            subtopicBar.appendChild(pill);
        });
    }

    function selectPill(pill) {
        subtopicBar.querySelectorAll('.subtopic-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        showTopic(pill.dataset.topic);
        clearSearch();
    }

    function showFirstTopic(section) {
        const first = document.querySelector(`.topic-content[data-section="${section}"]`);
        if (first) showTopic(first.dataset.topic);
    }

    function showTopic(topicId) {
        currentTopic = topicId;
        articles.forEach(a => a.classList.remove('visible'));
        const target = document.querySelector(`.topic-content[data-topic="${topicId}"]`);
        if (target) {
            target.classList.add('visible');
            contentPanel.scrollTop = 0;
            appendQuickNav(target);
        }
    }

    // ── SEARCH ──────────────────────────────────────
    function bindSearch() {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => runSearch(searchInput.value.trim()), 180);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                clearSearch();
                searchInput.blur();
            }
        });
    }

    function runSearch(query) {
        if (!query || query.length < 2) {
            clearSearch();
            return;
        }

        const results = [];
        const re = new RegExp(`(${escapeRegex(query)})`, 'gi');

        articles.forEach(art => {
            const section = art.dataset.section.toUpperCase();
            const label   = art.dataset.label;
            const topic   = art.dataset.topic;

            // Search through list items and headings
            const items = art.querySelectorAll('li, h3');
            items.forEach(el => {
                const text = el.textContent;
                if (re.test(text)) {
                    results.push({
                        section, label, topic,
                        html: text.replace(re, '<mark>$1</mark>')
                    });
                }
            });
        });

        if (results.length === 0) {
            searchResults.innerHTML =
                '<div class="search-no-results"><span>⌀</span>No results for "' +
                escapeHtml(query) + '"</div>';
        } else {
            searchResults.innerHTML = results.slice(0, 60).map(r =>
                `<div class="search-result" data-section="${r.section.toLowerCase()}" data-topic="${r.topic}">
                    <span class="sr-tab">${r.section}</span>
                    <span class="sr-subtab">${r.label}</span>
                    <div class="sr-text">${r.html}</div>
                </div>`
            ).join('');

            // Click to navigate
            searchResults.querySelectorAll('.search-result').forEach(el => {
                el.addEventListener('click', () => {
                    const sec = el.dataset.section;
                    const top = el.dataset.topic;
                    activateSection(sec);
                    showTopic(top);
                    // Activate correct pill
                    subtopicBar.querySelectorAll('.subtopic-pill').forEach(p => {
                        p.classList.toggle('active', p.dataset.topic === top);
                    });
                    searchInput.value = '';
                    clearSearch();
                });
            });
        }

        searchOverlay.classList.remove('hidden');
    }

    function clearSearch() {
        searchOverlay.classList.add('hidden');
        searchResults.innerHTML = '';
    }

    // ── KEYBOARD SHORTCUTS ──────────────────────────
    function bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K → focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                return;
            }

            // If search is focused, don't capture other shortcuts
            if (document.activeElement === searchInput) return;

            // Left / Right → switch tabs
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const tabArr = [...sectionTabs];
                const idx = tabArr.findIndex(t => t.dataset.section === currentSection);
                let next;
                if (e.key === 'ArrowLeft') next = idx > 0 ? idx - 1 : tabArr.length - 1;
                else next = idx < tabArr.length - 1 ? idx + 1 : 0;
                activateSection(tabArr[next].dataset.section);
                return;
            }

            // 1-9 → jump to subtopic pill
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                const pills = subtopicBar.querySelectorAll('.subtopic-pill');
                if (pills[num - 1]) selectPill(pills[num - 1]);
            }
        });
    }

    // ── HELPERS ─────────────────────────────────────
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ── QUICK NAV FOOTER ────────────────────────────
    function appendQuickNav(article) {
        // Remove any existing quick-nav in this article
        const existing = article.querySelector('.quick-nav');
        if (existing) existing.remove();

        const nav = document.createElement('div');
        nav.className = 'quick-nav';

        const title = document.createElement('div');
        title.className = 'quick-nav-title';
        title.textContent = 'Quick Nav — All Tabs';
        nav.appendChild(title);

        // Get ordered tab names from the tab bar
        const tabOrder = [...sectionTabs].map(t => t.dataset.section);
        const tabLabels = {};
        sectionTabs.forEach(t => { tabLabels[t.dataset.section] = t.textContent.trim(); });

        tabOrder.forEach(section => {
            const sectionArticles = document.querySelectorAll(`.topic-content[data-section="${section}"]`);
            if (sectionArticles.length === 0) return;

            const group = document.createElement('div');
            group.className = 'quick-nav-group';

            const tabLabel = document.createElement('div');
            tabLabel.className = 'quick-nav-tab';
            tabLabel.textContent = tabLabels[section] || section;
            group.appendChild(tabLabel);

            const links = document.createElement('div');
            links.className = 'quick-nav-links';

            sectionArticles.forEach(art => {
                const link = document.createElement('span');
                link.className = 'quick-nav-link';
                if (art.dataset.topic === currentTopic) link.classList.add('qn-current');
                link.textContent = art.dataset.label;
                link.addEventListener('click', () => {
                    activateSection(section);
                    showTopic(art.dataset.topic);
                    subtopicBar.querySelectorAll('.subtopic-pill').forEach(p => {
                        p.classList.toggle('active', p.dataset.topic === art.dataset.topic);
                    });
                });
                links.appendChild(link);
            });

            group.appendChild(links);
            nav.appendChild(group);
        });

        // Insert before the phrase-block (so it stays in column 1)
        const phraseBlock = article.querySelector('.phrase-block');
        if (phraseBlock) {
            article.insertBefore(nav, phraseBlock);
        } else {
            article.appendChild(nav);
        }
    }

    // ── GO ──────────────────────────────────────────
    init();
})();
