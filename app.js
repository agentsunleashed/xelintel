/* ============================================
   XELINTEL — Tab Navigation
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const sectionTabs = document.querySelectorAll('.section-tab');
    const subtopicBar = document.getElementById('subtopicBar');
    const allTopics = document.querySelectorAll('.topic-content');

    let activeSection = 'ai-strategy';
    let activeTopic = null;

    // ─── Section Tab Click ─────────────────────
    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => switchSection(tab.dataset.section));
    });

    function switchSection(sectionId) {
        activeSection = sectionId;
        sectionTabs.forEach(t => t.classList.toggle('active', t.dataset.section === sectionId));
        buildSubtopicPills(sectionId);
        const firstTopic = document.querySelector(`.topic-content[data-section="${sectionId}"]`);
        if (firstTopic) showTopic(firstTopic.dataset.topic);
    }

    function buildSubtopicPills(sectionId) {
        const topics = document.querySelectorAll(`.topic-content[data-section="${sectionId}"]`);
        let html = '';
        topics.forEach((t, i) => {
            html += `<button class="subtopic-pill ${i === 0 ? 'active' : ''}" data-topic="${t.dataset.topic}">${t.dataset.label}</button>`;
        });
        subtopicBar.innerHTML = html;
        subtopicBar.querySelectorAll('.subtopic-pill').forEach(pill => {
            pill.addEventListener('click', () => showTopic(pill.dataset.topic));
        });
    }

    function showTopic(topicId) {
        activeTopic = topicId;
        allTopics.forEach(t => t.classList.remove('visible'));
        const target = document.querySelector(`.topic-content[data-topic="${topicId}"]`);
        if (target) {
            target.classList.add('visible');
            document.getElementById('contentPanel').scrollTop = 0;
        }
        subtopicBar.querySelectorAll('.subtopic-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.topic === topicId);
        });
    }

    // ─── Keyboard Shortcuts ────────────────────
    document.addEventListener('keydown', (e) => {
        // Number keys 1-9 → switch sections
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= sectionTabs.length) {
                e.preventDefault();
                switchSection(sectionTabs[num - 1].dataset.section);
            }
        }
        // Arrow keys for subtopic navigation
        const pills = subtopicBar.querySelectorAll('.subtopic-pill');
        const idx = Array.from(pills).findIndex(p => p.classList.contains('active'));
        if (e.key === 'ArrowRight' && idx < pills.length - 1) { e.preventDefault(); showTopic(pills[idx + 1].dataset.topic); }
        if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); showTopic(pills[idx - 1].dataset.topic); }
    });

    // ─── Initialize ────────────────────────────
    switchSection('ai-strategy');
});
