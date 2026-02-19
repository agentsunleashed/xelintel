/* ============================================
   XELINTEL — App Logic
   Search, Navigation, Collapse/Expand, Keyboard Shortcuts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Elements ──────────────────────────────
    const searchInput = document.getElementById('searchInput');
    const sidebarNav = document.getElementById('sidebarNav');
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
    const sections = document.querySelectorAll('.topic-section');
    const cards = document.querySelectorAll('.card');

    // ─── Build Sidebar ─────────────────────────
    function buildSidebar() {
        let html = '';
        sections.forEach(section => {
            const sectionId = section.dataset.section;
            const title = section.querySelector('.section-title');
            const icon = title.querySelector('.section-icon')?.textContent || '';
            const titleText = title.textContent.trim().replace(icon, '').trim();

            html += `<li class="sidebar-section">
                <div class="sidebar-section-title">${icon} ${titleText}</div>`;

            section.querySelectorAll('.card').forEach(card => {
                const cardTitle = card.querySelector('.card-title').textContent.trim();
                const topic = card.dataset.topic;
                html += `<a class="sidebar-link" data-target="${topic}" href="#${sectionId}">${cardTitle}</a>`;
            });

            html += `</li>`;
        });
        sidebarNav.innerHTML = html;

        // Sidebar link clicks
        sidebarNav.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.dataset.target;
                const card = document.querySelector(`[data-topic="${target}"]`);
                if (card) {
                    // Ensure section and card are expanded
                    const section = card.closest('.topic-section');
                    section.classList.remove('collapsed');
                    card.classList.remove('collapsed');

                    // Scroll to card
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Highlight briefly
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 2000);

                    // Update active state
                    sidebarNav.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }

    // ─── Section Toggle ────────────────────────
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        title.addEventListener('click', () => {
            section.classList.toggle('collapsed');
        });
    });

    // ─── Card Toggle ───────────────────────────
    cards.forEach(card => {
        const title = card.querySelector('.card-title');
        title.addEventListener('click', () => {
            card.classList.toggle('collapsed');
        });
    });

    // ─── Expand/Collapse All ───────────────────
    expandAllBtn.addEventListener('click', () => {
        sections.forEach(s => s.classList.remove('collapsed'));
        cards.forEach(c => c.classList.remove('collapsed'));
    });

    collapseAllBtn.addEventListener('click', () => {
        cards.forEach(c => c.classList.add('collapsed'));
    });

    // ─── Search ────────────────────────────────
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(searchInput.value), 150);
    });

    function performSearch(query) {
        // Clear previous highlights
        document.querySelectorAll('.search-match').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });

        // Remove existing no-results message
        const existingNoResults = document.querySelector('.no-results');
        if (existingNoResults) existingNoResults.remove();

        if (!query || query.length < 2) {
            // Show all
            sections.forEach(s => {
                s.style.display = '';
                s.classList.remove('collapsed');
            });
            cards.forEach(c => {
                c.style.display = '';
            });
            return;
        }

        const lowerQuery = query.toLowerCase();
        let totalMatches = 0;

        sections.forEach(section => {
            let sectionHasMatch = false;

            section.querySelectorAll('.card').forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(lowerQuery)) {
                    card.style.display = '';
                    card.classList.remove('collapsed');
                    sectionHasMatch = true;
                    totalMatches++;

                    // Highlight matches in card
                    highlightText(card.querySelector('.card-body'), query);
                } else {
                    card.style.display = 'none';
                }
            });

            if (sectionHasMatch) {
                section.style.display = '';
                section.classList.remove('collapsed');
            } else {
                section.style.display = 'none';
            }
        });

        // Show no results message
        if (totalMatches === 0) {
            const content = document.getElementById('content');
            const msg = document.createElement('div');
            msg.className = 'no-results';
            msg.innerHTML = `<h3>No results for "${escapeHtml(query)}"</h3><p>Try different keywords or shorter phrases.</p>`;
            content.insertBefore(msg, content.firstChild);
        }
    }

    function highlightText(container, query) {
        if (!container) return;
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');

        textNodes.forEach(node => {
            if (regex.test(node.textContent)) {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<mark class="search-match">$1</mark>');
                node.parentNode.replaceChild(span, node);
            }
        });
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Keyboard Shortcuts ────────────────────
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or Cmd+K → Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Escape → Clear search and blur
        if (e.key === 'Escape') {
            searchInput.value = '';
            performSearch('');
            searchInput.blur();
        }
    });

    // ─── Scroll Spy ────────────────────────────
    function updateScrollSpy() {
        const scrollPos = window.scrollY + 120;

        let activeCard = null;
        cards.forEach(card => {
            if (card.style.display === 'none') return;
            const rect = card.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            if (top <= scrollPos) {
                activeCard = card;
            }
        });

        sidebarNav.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (activeCard && link.dataset.target === activeCard.dataset.topic) {
                link.classList.add('active');
                // Scroll sidebar to keep active link visible
                link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    }

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateScrollSpy, 50);

        // Back to top button
        const btn = document.getElementById('backToTop');
        if (btn) {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }
    });

    // ─── Back to Top Button ────────────────────
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.title = 'Back to top';
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTopBtn);

    // ─── Initialize ────────────────────────────
    buildSidebar();
});
