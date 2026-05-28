
const contentDiv = document.getElementById('content');
const navLinks = document.querySelectorAll('nav a');

const cssMap = {
    p1_start: '/css/p1_start.css',
    p2_console: '/css/p2_console.css',
    p3_config: '/css/p3_config.css',
    p4_players: '/css/p4_players.css',
    p5_worlds: '/css/p5_worlds.css',
    p6_contact: '/css/p6_contact.css',
};

async function loadSection(name) {
    try {
        const res = await fetch(`/sections/${name}.html`);
        if (!res.ok) throw new Error('No encontrado');

        const html = await res.text();
        contentDiv.innerHTML = html;

        // cargar JS de la sección
        if (name === "p4_players") {
            if (typeof iniciarPlayers === "function") {
                iniciarPlayers();
            }
        }

        if (name === "p2_console") {
            if (typeof iniciarConsole === "function") {
                iniciarConsole();
            }
        }

        // Activar link actual
        navLinks.forEach(a => {
            a.classList.toggle('activo', a.dataset.section === name);
        });

        // Cambiar CSS dinámico
        const existingLink = document.getElementById('section-css');
        if (existingLink) existingLink.remove();

        if (cssMap[name]) {
            const link = document.createElement('link');
            link.id = 'section-css';
            link.rel = 'stylesheet';
            link.href = cssMap[name];
            document.head.appendChild(link);
        }

    } catch (e) {
        contentDiv.innerHTML = '<p>Error cargando la sección.</p>';
    }
}

function getSection() {
    return location.hash.replace('#', '') || 'p1_start';
}

navLinks.forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const section = a.dataset.section;
        history.pushState({ section }, '', `#${section}`);
        loadSection(section);
    });
});

window.addEventListener('popstate', () => loadSection(getSection()));

// Carga inicial
loadSection(getSection());
