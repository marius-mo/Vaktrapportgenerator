// ============================================
// FELLES FUNKSJONALITET
// Brukes av både index.html (operativ vakt) og basetekniker.html.
// ============================================

// ============================================
// THEME TOGGLE FUNCTIONALITY
// ============================================
(function() {
    'use strict';

    // Get theme from localStorage or system preference
    function getInitialTheme() {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Initialize theme immediately (before DOMContentLoaded to prevent flash)
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);

    // Theme toggle handler
    function initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);

            // Add a subtle animation effect
            themeToggle.style.transform = 'translateY(-50%) scale(0.9)';
            setTimeout(() => {
                themeToggle.style.transform = 'translateY(-50%) scale(1)';
            }, 150);
        });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', function(e) {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
})();

// Firebase Firestore: init hvis config er satt (erstatt REPLACE_* i index.html med din config)
window.firestoreDb = null;
(function initFirebase() {
    var config = window.FIREBASE_CONFIG;
    if (!config || !config.apiKey || config.apiKey.indexOf('REPLACE') !== -1) return;
    try {
        firebase.initializeApp(config);
        window.firestoreDb = firebase.firestore();
    } catch (e) { console.warn('Firebase init failed:', e); }
})();

// ============================================
// DELTE HJELPEFUNKSJONER
// ============================================

function formatDate(dateString) {
    if (!dateString || dateString === 'Ikke angitt') {
        return 'Ikke angitt';
    }
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('no-NO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateForFilename(dateString) {
    if (!dateString || dateString === 'Ikke angitt') {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    }
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
    return dateString;
}

function sanitizeForFilename(text) {
    if (!text) return 'Ukjent';
    // Replace spaces and special characters with underscores
    // Remove or replace characters that are not safe for filenames
    return text
        .replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Unngår at tekst fra brukere tolkes som HTML når den settes inn med innerHTML.
function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setDateInputToToday(inputId) {
    const dateInput = document.getElementById(inputId);
    if (!dateInput) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// ============================================
// TEKSTBOKSER SOM VOKSER MED INNHOLDET
// ============================================
// Alle tekstbokser blir så høye som teksten krever, så man slipper å scrolle
// inne i feltet. De krymper igjen når tekst slettes, men aldri under min-height.
(function() {
    'use strict';

    function tilpass(felt) {
        // Skjulte felt har ingen høyde å måle; de tilpasses når de vises.
        if (!felt.getClientRects().length) return;
        felt.style.overflowY = 'hidden';
        felt.style.height = 'auto';
        var kant = felt.offsetHeight - felt.clientHeight;
        felt.style.height = (felt.scrollHeight + kant) + 'px';
    }

    var planlagt = false;
    function tilpassAlle() {
        if (planlagt) return;
        planlagt = true;
        requestAnimationFrame(function() {
            planlagt = false;
            document.querySelectorAll('textarea').forEach(tilpass);
        });
    }

    // Verdier satt fra kode (lastet rapport, utkast, sanntidsoppdatering)
    // utløser ikke input-hendelser, så settet på value fanges opp direkte.
    var verdi = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    Object.defineProperty(HTMLTextAreaElement.prototype, 'value', {
        configurable: true,
        get: verdi.get,
        set: function(ny) {
            verdi.set.call(this, ny);
            tilpassAlle();
        }
    });

    document.addEventListener('input', function(e) {
        if (e.target.tagName === 'TEXTAREA') tilpass(e.target);
    });
    document.addEventListener('reset', function() { setTimeout(tilpassAlle, 0); }, true);
    window.addEventListener('resize', tilpassAlle);

    function start() {
        tilpassAlle();
        // Nye felt (dialoger, kort) og felt som blir synlige (avhuket helikopter).
        // Endringer på selve tekstboksene ignoreres, ellers ville høydeendringen
        // vår utløse en ny runde i det uendelige.
        new MutationObserver(function(endringer) {
            for (var i = 0; i < endringer.length; i++) {
                if (endringer[i].type === 'childList' || endringer[i].target.tagName !== 'TEXTAREA') {
                    tilpassAlle();
                    return;
                }
            }
        }).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'disabled']
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
