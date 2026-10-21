// ============================================
// BASETEKNIKER - LEVENDE STATUSTAVLE OG VAKTRAPPORT
// ============================================
// Saker og helikopterstatus lever videre mellom vakter og deles mellom
// teknikere. Vaktrapporten er et øyeblikksbilde av tavlen ved vaktslutt.

const BT_HELIKOPTRE = ['LN-OXH', 'LN-OXI', 'LN-OXJ', 'LN-OXK'];
const BT_HELI_STATUSER = ['Serviceable', 'Begrenset', 'AOG'];
const BT_SAK_STATUSER = ['Åpen', 'Pågår', 'Venter på deler', 'Lukket'];
const BT_AAPNE_STATUSER = ['Åpen', 'Pågår', 'Venter på deler'];

const BT_COLLECTION_SAKER = 'bt_saker';
const BT_COLLECTION_HELI = 'bt_helikopter';
const BT_COLLECTION_RAPPORTER = 'bt_rapporter';

// Lokal fallback brukes bare når Firestore ikke er konfigurert.
const BT_LS_SAKER = 'bt_saker';
const BT_LS_HELI = 'bt_helikopter';
const BT_LS_RAPPORTER = 'bt_rapporter';

var btSaker = [];
var btHelikopterStatus = {};
var btRapporter = [];
var btRedigererSakId = null;

// ============================================
// LAGRING (Firestore med localStorage som reserve)
// ============================================

function btHarSky() {
    return !!window.firestoreDb;
}

function btLesLokalt(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (e) {
        console.warn('Kunne ikke lese ' + key, e);
        return JSON.parse(fallback);
    }
}

function btSkrivLokalt(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Kunne ikke lagre ' + key, e);
        alert('Kunne ikke lagre lokalt. Sjekk lagringsplass i nettleseren.');
    }
}

function btNyId() {
    return 'lok_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// --- Saker ---

// GSE er fjernet; eldre saker flyttes til tilsvarende tools-verdier.
function btNormaliserSak(sak) {
    if (sak.kategori === 'GSE/verktøy') sak.kategori = 'Tools/kalibrering';
    if (sak.omraade === 'GSE/verktøy') sak.omraade = 'Tools';
    return sak;
}

function btLyttPaaSaker() {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_SAKER)
            .onSnapshot(function(snapshot) {
                btSaker = snapshot.docs.map(function(d) {
                    var data = d.data();
                    data.id = d.id;
                    return btNormaliserSak(data);
                });
                btRenderIssueBoard();
            }, function(err) {
                console.error('Firestore saker-feil:', err);
                document.getElementById('issueBoard').innerHTML =
                    '<p class="no-reports">Kunne ikke hente saker fra skyen.</p>';
            });
        return;
    }
    btSaker = btLesLokalt(BT_LS_SAKER, '[]').map(btNormaliserSak);
    btRenderIssueBoard();
}

function btLagreSak(sak, callback) {
    if (btHarSky()) {
        var id = sak.id;
        var data = Object.assign({}, sak);
        delete data.id;
        var ref = window.firestoreDb.collection(BT_COLLECTION_SAKER);
        var promise = id ? ref.doc(id).set(data) : ref.add(data);
        promise.then(function() { if (callback) callback(); })
            .catch(function(err) {
                console.error('Kunne ikke lagre sak:', err);
                alert('Kunne ikke lagre saken. Prøv igjen.');
            });
        return;
    }
    if (!sak.id) sak.id = btNyId();
    var index = btSaker.findIndex(function(s) { return s.id === sak.id; });
    if (index === -1) {
        btSaker.unshift(sak);
    } else {
        btSaker[index] = sak;
    }
    btSkrivLokalt(BT_LS_SAKER, btSaker);
    btRenderIssueBoard();
    if (callback) callback();
}

function btSlettSak(id, callback) {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_SAKER).doc(id).delete()
            .then(function() { if (callback) callback(); })
            .catch(function(err) {
                console.error('Kunne ikke slette sak:', err);
                alert('Kunne ikke slette saken.');
            });
        return;
    }
    btSaker = btSaker.filter(function(s) { return s.id !== id; });
    btSkrivLokalt(BT_LS_SAKER, btSaker);
    btRenderIssueBoard();
    if (callback) callback();
}

// --- Helikopterstatus ---

function btLyttPaaHelikopter() {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_HELI)
            .onSnapshot(function(snapshot) {
                btHelikopterStatus = {};
                snapshot.docs.forEach(function(d) {
                    btHelikopterStatus[d.id] = d.data();
                });
                btRenderHelicopterBoard();
            }, function(err) {
                console.error('Firestore helikopter-feil:', err);
                document.getElementById('helicopterBoard').innerHTML =
                    '<p class="no-reports">Kunne ikke hente helikopterstatus.</p>';
            });
        return;
    }
    btHelikopterStatus = btLesLokalt(BT_LS_HELI, '{}');
    btRenderHelicopterBoard();
}

function btLagreHelikopter(reg, data) {
    data.oppdatert = new Date().toISOString();
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_HELI).doc(reg).set(data)
            .catch(function(err) {
                console.error('Kunne ikke lagre helikopterstatus:', err);
                alert('Kunne ikke lagre helikopterstatus.');
            });
        return;
    }
    btHelikopterStatus[reg] = data;
    btSkrivLokalt(BT_LS_HELI, btHelikopterStatus);
    btRenderHelicopterBoard();
}

// --- Rapporter ---

function btLastRapporter() {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_RAPPORTER)
            .orderBy('timestamp', 'desc')
            .limit(30)
            .get()
            .then(function(snapshot) {
                btRapporter = snapshot.docs.map(function(d) {
                    var data = d.data();
                    data.id = d.id;
                    return data;
                });
                btRenderRapportRegister();
            })
            .catch(function(err) {
                console.error('Kunne ikke hente rapporter:', err);
                document.getElementById('btReportRegister').innerHTML =
                    '<p class="no-reports">Kunne ikke hente rapporter fra skyen.</p>';
            });
        return;
    }
    btRapporter = btLesLokalt(BT_LS_RAPPORTER, '[]');
    btRenderRapportRegister();
}

function btLagreRapport(rapport) {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_COLLECTION_RAPPORTER).add(rapport)
            .then(function() { btLastRapporter(); })
            .catch(function(err) {
                console.error('Kunne ikke lagre rapport:', err);
                alert('Kunne ikke lagre rapporten i skyen.');
            });
        return;
    }
    rapport.id = btNyId();
    btRapporter.unshift(rapport);
    if (btRapporter.length > 30) btRapporter = btRapporter.slice(0, 30);
    btSkrivLokalt(BT_LS_RAPPORTER, btRapporter);
    btRenderRapportRegister();
}

// ============================================
// HELIKOPTERSTATUS-TAVLE
// ============================================

function btRenderHelicopterBoard() {
    var board = document.getElementById('helicopterBoard');
    if (!board) return;

    board.innerHTML = BT_HELIKOPTRE.map(function(reg) {
        var data = btHelikopterStatus[reg] || {};
        var status = data.status || 'Serviceable';
        var knapper = BT_HELI_STATUSER.map(function(s) {
            var aktiv = s === status ? ' is-active' : '';
            return '<button type="button" class="heli-status-btn heli-status-' +
                btStatusKlasse(s) + aktiv + '" data-reg="' + escapeHtml(reg) +
                '" data-status="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
        }).join('');

        return '<div class="helicopter-card heli-tone-' + btStatusKlasse(status) + '">' +
            '<div class="helicopter-card-head">' +
                '<span class="helicopter-card-reg">' + escapeHtml(reg) + '</span>' +
                '<div class="heli-status-group">' + knapper + '</div>' +
            '</div>' +
            '<div class="helicopter-card-fields">' +
                '<label>Neste ettersyn' +
                    '<input type="text" class="heli-input" data-reg="' + escapeHtml(reg) +
                    '" data-field="nesteEttersyn" value="' + escapeHtml(data.nesteEttersyn || '') +
                    '" placeholder="f.eks. 100t / 12.11.2026">' +
                '</label>' +
                '<label>Merknad' +
                    '<input type="text" class="heli-input" data-reg="' + escapeHtml(reg) +
                    '" data-field="merknad" value="' + escapeHtml(data.merknad || '') +
                    '" placeholder="Kort merknad">' +
                '</label>' +
            '</div>' +
            (data.oppdatert ? '<div class="helicopter-card-meta">Sist oppdatert ' +
                escapeHtml(btFormatTidspunkt(data.oppdatert)) + '</div>' : '') +
        '</div>';
    }).join('');

    board.querySelectorAll('.heli-status-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var reg = this.getAttribute('data-reg');
            var data = Object.assign({}, btHelikopterStatus[reg] || {});
            data.status = this.getAttribute('data-status');
            btLagreHelikopter(reg, data);
        });
    });

    board.querySelectorAll('.heli-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var reg = this.getAttribute('data-reg');
            var data = Object.assign({}, btHelikopterStatus[reg] || {});
            data[this.getAttribute('data-field')] = this.value;
            btLagreHelikopter(reg, data);
        });
    });
}

function btStatusKlasse(status) {
    switch (status) {
        case 'Serviceable': return 'ok';
        case 'Begrenset': return 'warn';
        case 'AOG': return 'bad';
        case 'Åpen': return 'open';
        case 'Pågår': return 'progress';
        case 'Venter på deler': return 'waiting';
        case 'Lukket': return 'closed';
        default: return 'neutral';
    }
}

// ============================================
// SAKSTAVLE
// ============================================

function btSynligeSaker() {
    var visLukkede = document.getElementById('filterShowClosed').checked;
    var alleBaser = document.getElementById('filterAllBases').checked;
    var kategori = document.getElementById('filterKategori').value;
    var valgtBase = document.getElementById('btBase').value;

    return btSaker.filter(function(sak) {
        if (!visLukkede && sak.status === 'Lukket') return false;
        if (!alleBaser && sak.base !== valgtBase) return false;
        if (kategori && sak.kategori !== kategori) return false;
        return true;
    });
}

function btSorterSaker(saker) {
    var prioRang = { 'Høy': 0, 'Normal': 1, 'Lav': 2 };
    var statusRang = { 'Åpen': 0, 'Pågår': 1, 'Venter på deler': 2, 'Lukket': 3 };
    return saker.slice().sort(function(a, b) {
        var s = (statusRang[a.status] || 0) - (statusRang[b.status] || 0);
        if (s !== 0) return s;
        var p = (prioRang[a.prioritet] || 1) - (prioRang[b.prioritet] || 1);
        if (p !== 0) return p;
        return new Date(a.opprettet || 0) - new Date(b.opprettet || 0);
    });
}

function btDagerSiden(isoDato) {
    if (!isoDato) return 0;
    var da = new Date(isoDato).getTime();
    if (isNaN(da)) return 0;
    return Math.floor((Date.now() - da) / 86400000);
}

function btFormatTidspunkt(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('no-NO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function btRenderIssueBoard() {
    var board = document.getElementById('issueBoard');
    if (!board) return;

    var saker = btSorterSaker(btSynligeSaker());

    if (saker.length === 0) {
        board.innerHTML = '<p class="no-reports">Ingen saker som matcher filteret. Trykk «Ny sak» for å legge til.</p>';
        btOppdaterSammendrag();
        return;
    }

    board.innerHTML = saker.map(function(sak) {
        var dager = btDagerSiden(sak.opprettet);
        var sisteLogg = (sak.logg && sak.logg.length) ? sak.logg[sak.logg.length - 1] : null;
        var prioKlasse = sak.prioritet === 'Høy' ? 'prio-high'
            : (sak.prioritet === 'Lav' ? 'prio-low' : 'prio-normal');

        var statusKnapper = BT_SAK_STATUSER.map(function(s) {
            var aktiv = s === sak.status ? ' is-active' : '';
            return '<button type="button" class="issue-status-btn issue-status-' +
                btStatusKlasse(s) + aktiv + '" data-id="' + escapeHtml(sak.id) +
                '" data-status="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
        }).join('');

        return '<div class="issue-card ' + prioKlasse + (sak.status === 'Lukket' ? ' is-closed' : '') + '">' +
            '<div class="issue-card-main">' +
                '<div class="issue-card-top">' +
                    '<span class="issue-title">' + escapeHtml(sak.tittel || 'Uten tittel') + '</span>' +
                    (sak.prioritet === 'Høy' ? '<span class="issue-badge badge-high">Høy</span>' : '') +
                '</div>' +
                '<div class="issue-card-meta">' +
                    '<span class="issue-chip">' + escapeHtml(sak.omraade || '-') + '</span>' +
                    '<span class="issue-chip">' + escapeHtml(sak.kategori || '-') + '</span>' +
                    '<span class="issue-chip">' + escapeHtml(sak.base || '-') + '</span>' +
                    (sak.ansvarlig ? '<span class="issue-chip">' + escapeHtml(sak.ansvarlig) + '</span>' : '') +
                    '<span class="issue-age">' + (sak.status === 'Lukket' ? 'Lukket' : 'Åpen i ' + dager + ' d') + '</span>' +
                '</div>' +
                (sisteLogg ? '<div class="issue-last-log">' +
                    escapeHtml(btFormatTidspunkt(sisteLogg.tid)) +
                    (sisteLogg.av ? ' · ' + escapeHtml(sisteLogg.av) : '') + ': ' +
                    escapeHtml(sisteLogg.tekst) + '</div>' : '') +
            '</div>' +
            '<div class="issue-card-actions">' +
                '<div class="issue-status-group">' + statusKnapper + '</div>' +
                '<button type="button" class="btn-small btn-view issue-open-btn" data-id="' +
                    escapeHtml(sak.id) + '">Åpne</button>' +
            '</div>' +
        '</div>';
    }).join('');

    board.querySelectorAll('.issue-status-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            btEndreStatus(this.getAttribute('data-id'), this.getAttribute('data-status'));
        });
    });

    board.querySelectorAll('.issue-open-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            btAapneSakModal(this.getAttribute('data-id'));
        });
    });

    btOppdaterSammendrag();
}

function btOppdaterSammendrag() {
    var badge = document.getElementById('liveBadge');
    if (!badge) return;
    var alleBaser = document.getElementById('filterAllBases').checked;
    var valgtBase = document.getElementById('btBase').value;
    var aapne = btSaker.filter(function(s) {
        if (BT_AAPNE_STATUSER.indexOf(s.status) === -1) return false;
        return alleBaser || s.base === valgtBase;
    });
    badge.textContent = aapne.length > 0 ? 'Live · ' + aapne.length + ' åpne' : 'Live';
}

function btEndreStatus(id, nyStatus) {
    var sak = btSaker.find(function(s) { return s.id === id; });
    if (!sak || sak.status === nyStatus) return;

    var oppdatert = Object.assign({}, sak);
    oppdatert.status = nyStatus;
    oppdatert.oppdatert = new Date().toISOString();
    oppdatert.logg = (sak.logg || []).concat([{
        tid: new Date().toISOString(),
        av: btAktivTekniker(),
        tekst: 'Status endret til ' + nyStatus + '.'
    }]);
    btLagreSak(oppdatert);
}

function btAktivTekniker() {
    var felt = document.getElementById('btTekniker');
    return felt && felt.value.trim() ? felt.value.trim() : 'Ukjent';
}

// ============================================
// SAKSDIALOG
// ============================================

function btAapneSakModal(id) {
    btRedigererSakId = id || null;
    var modal = document.getElementById('issueModal');
    var sak = id ? btSaker.find(function(s) { return s.id === id; }) : null;

    document.getElementById('issueModalTitle').textContent = sak ? 'Rediger sak' : 'Ny sak';
    document.getElementById('issueTittel').value = sak ? (sak.tittel || '') : '';
    document.getElementById('issueOmraade').value = sak ? (sak.omraade || 'LN-OXH') : 'LN-OXH';
    document.getElementById('issueKategori').value = sak ? (sak.kategori || 'Feil') : 'Feil';
    document.getElementById('issuePrioritet').value = sak ? (sak.prioritet || 'Normal') : 'Normal';
    document.getElementById('issueStatus').value = sak ? (sak.status || 'Åpen') : 'Åpen';
    document.getElementById('issueAnsvarlig').value = sak
        ? (sak.ansvarlig || '')
        : btAktivTekniker().replace('Ukjent', '');
    document.getElementById('issueBase').value = sak
        ? (sak.base || 'Bergen')
        : document.getElementById('btBase').value;

    document.getElementById('issueNyLogg').value = '';
    document.getElementById('issueNyLoggLabel').textContent = sak
        ? 'Ny oppdatering (valgfritt):'
        : 'Beskrivelse:';
    document.getElementById('issueDeleteBtn').style.display = sak ? '' : 'none';

    var historikk = document.getElementById('issueLoggHistorikk');
    if (sak && sak.logg && sak.logg.length) {
        historikk.innerHTML = '<h3 class="report-group-title">Logg</h3>' +
            sak.logg.slice().reverse().map(function(post) {
                return '<div class="issue-log-entry">' +
                    '<div class="issue-log-meta">' + escapeHtml(btFormatTidspunkt(post.tid)) +
                    (post.av ? ' · ' + escapeHtml(post.av) : '') + '</div>' +
                    '<div class="issue-log-text">' + escapeHtml(post.tekst) + '</div>' +
                '</div>';
            }).join('');
    } else {
        historikk.innerHTML = '';
    }

    modal.style.display = 'flex';
    document.getElementById('issueTittel').focus();
}

function btLukkSakModal() {
    document.getElementById('issueModal').style.display = 'none';
    btRedigererSakId = null;
}

function btLagreFraModal() {
    var tittel = document.getElementById('issueTittel').value.trim();
    if (!tittel) {
        alert('Saken må ha en tittel.');
        document.getElementById('issueTittel').focus();
        return;
    }

    var naa = new Date().toISOString();
    var eksisterende = btRedigererSakId
        ? btSaker.find(function(s) { return s.id === btRedigererSakId; })
        : null;
    var nyLoggTekst = document.getElementById('issueNyLogg').value.trim();
    var nyStatus = document.getElementById('issueStatus').value;

    var sak = {
        id: btRedigererSakId || undefined,
        tittel: tittel,
        omraade: document.getElementById('issueOmraade').value,
        kategori: document.getElementById('issueKategori').value,
        prioritet: document.getElementById('issuePrioritet').value,
        status: nyStatus,
        ansvarlig: document.getElementById('issueAnsvarlig').value.trim(),
        base: document.getElementById('issueBase').value,
        opprettet: eksisterende ? (eksisterende.opprettet || naa) : naa,
        oppdatert: naa,
        logg: (eksisterende && eksisterende.logg) ? eksisterende.logg.slice() : []
    };

    if (eksisterende && eksisterende.status !== nyStatus) {
        sak.logg.push({ tid: naa, av: btAktivTekniker(), tekst: 'Status endret til ' + nyStatus + '.' });
    }
    if (nyLoggTekst) {
        sak.logg.push({ tid: naa, av: btAktivTekniker(), tekst: nyLoggTekst });
    }
    if (!eksisterende && sak.logg.length === 0) {
        sak.logg.push({ tid: naa, av: btAktivTekniker(), tekst: 'Sak opprettet.' });
    }

    btLagreSak(sak, btLukkSakModal);
}

// ============================================
// VAKTRAPPORT (PDF)
// ============================================

function btSamleRapportData() {
    var dato = document.getElementById('btDate').value;
    var base = document.getElementById('btBase').value;

    var relevante = btSaker.filter(function(s) { return s.base === base; });
    var aapne = btSorterSaker(relevante.filter(function(s) {
        return BT_AAPNE_STATUSER.indexOf(s.status) !== -1;
    }));

    // Saker med loggaktivitet på valgt dato regnes som endret denne vakten.
    var endretIDag = relevante.filter(function(s) {
        return (s.logg || []).some(function(post) {
            return (post.tid || '').slice(0, 10) === dato;
        });
    });

    return {
        dato: dato,
        base: base,
        tekniker: document.getElementById('btTekniker').value.trim(),
        kontroll: {
            verktoy: document.getElementById('btVerktoy').checked,
            kalibrering: document.getElementById('btKalibrering').checked,
            hangar: document.getElementById('btHangar').checked,
            forbruk: document.getElementById('btForbruk').checked
        },
        generelt: document.getElementById('btGenerelt').value.trim(),
        overlevering: document.getElementById('btOverlevering').value.trim(),
        helikopter: BT_HELIKOPTRE.map(function(reg) {
            var d = btHelikopterStatus[reg] || {};
            return {
                reg: reg,
                status: d.status || 'Serviceable',
                nesteEttersyn: d.nesteEttersyn || '',
                merknad: d.merknad || ''
            };
        }),
        aapneSaker: aapne.map(btSakSnapshot),
        endringer: endretIDag.map(btSakSnapshot),
        timestamp: new Date().toISOString()
    };
}

function btSakSnapshot(sak) {
    var sisteLogg = (sak.logg && sak.logg.length) ? sak.logg[sak.logg.length - 1] : null;
    return {
        tittel: sak.tittel || '',
        omraade: sak.omraade || '',
        kategori: sak.kategori || '',
        prioritet: sak.prioritet || '',
        status: sak.status || '',
        ansvarlig: sak.ansvarlig || '',
        dagerAapen: btDagerSiden(sak.opprettet),
        sisteLogg: sisteLogg ? sisteLogg.tekst : '',
        sisteLoggTid: sisteLogg ? sisteLogg.tid : ''
    };
}

function btGenererPdf() {
    var dato = document.getElementById('btDate').value;
    if (!dato) {
        alert('Velg dato før du genererer rapporten.');
        return;
    }
    if (!document.getElementById('btTekniker').value.trim()) {
        alert('Fyll inn hvem som har vært på vakt.');
        document.getElementById('btTekniker').focus();
        return;
    }

    var data = btSamleRapportData();

    var logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = logo.width;
        canvas.height = logo.height;
        canvas.getContext('2d').drawImage(logo, 0, 0);
        btTegnPdf(data, {
            data: canvas.toDataURL('image/png'),
            width: logo.width,
            height: logo.height
        });
    };
    logo.onerror = function() {
        console.warn('Logo kunne ikke lastes, fortsetter uten.');
        btTegnPdf(data, null);
    };
    logo.src = 'assets/airliftlogo.webp';
}

function btTegnPdf(data, logoInfo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const navy = [10, 37, 64];
    const blueDark = [21, 101, 192];
    const green = [46, 125, 50];
    const amber = [194, 120, 3];
    const red = [229, 57, 53];
    const textPrimary = [26, 26, 26];
    const textSecondary = [97, 97, 97];
    const border = [224, 224, 224];

    const pageWidth = 210;
    const pageHeight = 297;
    const left = 10;
    const right = 10;
    const bottom = 15;
    const width = pageWidth - left - right;

    var y = 0;

    // Header
    const headerHeight = 20;
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    if (logoInfo && logoInfo.data) {
        try {
            var maxH = 14;
            var ratio = logoInfo.width / logoInfo.height;
            var h = maxH;
            var w = h * ratio;
            if (w > 40) { w = 40; h = w / ratio; }
            doc.addImage(logoInfo.data, 'PNG', pageWidth - right - w, (headerHeight - h) / 2, w, h);
        } catch (e) {
            console.error('Kunne ikke legge til logo:', e);
        }
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Vaktrapport - Basetekniker', pageWidth / 2, headerHeight / 2 + 2, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Sharepoint: \\Technical - Part-145\\Planning\\Status reports - Handover', left, headerHeight - 2);
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text(formatDate(data.dato), pageWidth - right, headerHeight - 2, { align: 'right' });

    y = headerHeight + 8;

    function sikrePlass(behov) {
        if (y + behov > pageHeight - bottom) {
            doc.addPage();
            y = 15;
        }
    }

    function seksjonstittel(tittel) {
        y += 3;
        sikrePlass(14);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(blueDark[0], blueDark[1], blueDark[2]);
        doc.text(tittel, left, y);
        y += 2;
        doc.setDrawColor(border[0], border[1], border[2]);
        doc.setLineWidth(0.4);
        doc.line(left, y, left + width, y);
        y += 5;
    }

    function statusFarge(status) {
        if (status === 'Serviceable' || status === 'Lukket') return green;
        if (status === 'AOG' || status === 'Åpen') return red;
        return amber;
    }

    // Rapportinformasjon
    seksjonstittel('Rapportinformasjon');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text('Dato:', left, y);
    doc.text('Base:', left + 70, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(formatDate(data.dato), left + 16, y);
    doc.text(data.base || '-', left + 86, y);
    y += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text('Tekniker:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(doc.splitTextToSize(data.tekniker || '-', width - 20), left + 20, y);
    y += 9;

    // Helikopterstatus
    seksjonstittel('Helikopterstatus');
    data.helikopter.forEach(function(heli) {
        sikrePlass(12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        doc.text(heli.reg, left, y);

        var farge = statusFarge(heli.status);
        doc.setTextColor(farge[0], farge[1], farge[2]);
        doc.text(heli.status, left + 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        if (heli.nesteEttersyn) {
            doc.text('Neste ettersyn: ' + heli.nesteEttersyn, left + 58, y);
        }
        y += 4.5;
        if (heli.merknad) {
            var linjer = doc.splitTextToSize(heli.merknad, width - 8);
            doc.text(linjer, left + 4, y);
            y += linjer.length * 4;
        }
        y += 2;
    });
    y += 3;

    // Åpne saker
    seksjonstittel('Utestående saker (' + data.aapneSaker.length + ')');
    if (data.aapneSaker.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        doc.text('Ingen utestående saker registrert.', left, y);
        y += 8;
    } else {
        data.aapneSaker.forEach(function(sak) {
            sikrePlass(16);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
            var tittelLinjer = doc.splitTextToSize(
                (sak.prioritet === 'Høy' ? '[HØY] ' : '') + sak.tittel, width - 40);
            doc.text(tittelLinjer, left, y);

            var farge = statusFarge(sak.status);
            doc.setTextColor(farge[0], farge[1], farge[2]);
            doc.text(sak.status, left + width, y, { align: 'right' });
            y += tittelLinjer.length * 4.2;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
            var meta = [sak.omraade, sak.kategori, sak.ansvarlig || 'Ingen ansvarlig',
                'åpen i ' + sak.dagerAapen + ' d'].filter(Boolean).join('  ·  ');
            doc.text(meta, left + 2, y);
            y += 4;

            if (sak.sisteLogg) {
                var loggLinjer = doc.splitTextToSize('Siste: ' + sak.sisteLogg, width - 6);
                doc.text(loggLinjer, left + 2, y);
                y += loggLinjer.length * 3.8;
            }
            y += 3.5;
        });
    }

    // Endringer denne vakten
    seksjonstittel('Endringer denne vakten (' + data.endringer.length + ')');
    if (data.endringer.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        doc.text('Ingen saker ble opprettet eller oppdatert denne vakten.', left, y);
        y += 8;
    } else {
        doc.setFontSize(8.5);
        data.endringer.forEach(function(sak) {
            sikrePlass(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
            var linjer = doc.splitTextToSize(
                sak.tittel + ' (' + sak.omraade + ') - ' + sak.status +
                (sak.sisteLogg ? ': ' + sak.sisteLogg : ''), width - 6);
            doc.text(linjer, left + 2, y);
            y += linjer.length * 4 + 1.5;
        });
        y += 3;
    }

    // Basestatus
    seksjonstittel('Basestatus');
    var punkter = [
        ['Verktøy på plass', data.kontroll.verktoy],
        ['Kalibrering av tools à jour', data.kontroll.kalibrering],
        ['Hangar ryddig', data.kontroll.hangar],
        ['Forbruksmateriell OK', data.kontroll.forbruk]
    ];
    doc.setFontSize(9);
    punkter.forEach(function(punkt, i) {
        sikrePlass(8);
        var kolonne = i % 2;
        var x = left + kolonne * (width / 2);
        if (kolonne === 0 && i > 0) y += 5.5;

        var boks = 4;
        if (punkt[1]) {
            doc.setFillColor(green[0], green[1], green[2]);
            doc.setDrawColor(green[0], green[1], green[2]);
            doc.rect(x, y - 3, boks, boks, 'FD');
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1.2);
            doc.line(x + 0.9, y - 1.1, x + 1.9, y - 0.1);
            doc.line(x + 1.9, y - 0.1, x + 3.3, y - 2.3);
            doc.setLineWidth(0.4);
        } else {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(border[0], border[1], border[2]);
            doc.rect(x, y - 3, boks, boks, 'FD');
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(punkt[1] ? textPrimary[0] : textSecondary[0],
                         punkt[1] ? textPrimary[1] : textSecondary[1],
                         punkt[1] ? textPrimary[2] : textSecondary[2]);
        doc.text(punkt[0], x + 6, y);
    });
    y += 9;

    if (data.generelt) {
        sikrePlass(14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        doc.text('Generell status / hendelser:', left, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        var gLinjer = doc.splitTextToSize(data.generelt, width - 4);
        gLinjer.forEach(function(linje) {
            sikrePlass(6);
            doc.text(linje, left + 2, y);
            y += 4.2;
        });
        y += 4;
    }

    // Overlevering
    seksjonstittel('Overlevering til neste vakt');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    var oLinjer = doc.splitTextToSize(data.overlevering || '(Ingen merknader)', width - 4);
    oLinjer.forEach(function(linje) {
        sikrePlass(6);
        doc.text(linje, left + 2, y);
        y += 4.2;
    });

    // Footer
    var sider = doc.internal.getNumberOfPages();
    for (var i = 1; i <= sider; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        doc.text('Basetekniker - ' + (data.base || '') + ' - ' + formatDate(data.dato),
            left, pageHeight - 8);
        doc.text('Side ' + i + ' av ' + sider, pageWidth - right, pageHeight - 8, { align: 'right' });
    }

    var filnavn = 'Vaktrapport_Basetekniker_' + sanitizeForFilename(data.base) + '_' +
        formatDateForFilename(data.dato) + '.pdf';
    doc.save(filnavn);

    btLagreRapport(data);

    var epost = document.getElementById('btSendEmail');
    if (epost) {
        epost.disabled = false;
        epost.classList.remove('btn-neutral');
        epost.classList.add('btn-success');
    }
}

// ============================================
// RAPPORTREGISTER
// ============================================

function btRenderRapportRegister() {
    var div = document.getElementById('btReportRegister');
    if (!div) return;

    if (!btRapporter || btRapporter.length === 0) {
        div.innerHTML = '<p class="no-reports">Ingen tidligere rapporter registrert</p>';
        return;
    }

    div.innerHTML = btRapporter.map(function(rapport, index) {
        var antall = (rapport.aapneSaker || []).length;
        return '<div class="report-item">' +
            '<div class="report-item-info">' +
                '<div class="report-item-date">' + escapeHtml(formatDate(rapport.dato || '')) + '</div>' +
                '<div class="report-item-details">Base: ' + escapeHtml(rapport.base || '-') +
                    ' | Tekniker: ' + escapeHtml(rapport.tekniker || '-') +
                    ' | ' + antall + ' utestående</div>' +
            '</div>' +
            '<div class="report-item-actions">' +
                '<button class="btn-small btn-pdf" data-index="' + index + '">PDF</button>' +
                '<button class="btn-small btn-delete" data-index="' + index + '">Slett</button>' +
            '</div>' +
        '</div>';
    }).join('');

    div.querySelectorAll('.btn-pdf').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rapport = btRapporter[parseInt(this.getAttribute('data-index'), 10)];
            if (!rapport) return;
            var logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = logo.width;
                canvas.height = logo.height;
                canvas.getContext('2d').drawImage(logo, 0, 0);
                btTegnPdfUtenLagring(rapport, {
                    data: canvas.toDataURL('image/png'),
                    width: logo.width,
                    height: logo.height
                });
            };
            logo.onerror = function() { btTegnPdfUtenLagring(rapport, null); };
            logo.src = 'assets/airliftlogo.webp';
        });
    });

    div.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'), 10);
            var rapport = btRapporter[index];
            if (!rapport) return;
            if (!confirm('Slette denne rapporten? Sakene på tavlen beholdes.')) return;

            if (btHarSky() && rapport.id) {
                window.firestoreDb.collection(BT_COLLECTION_RAPPORTER).doc(rapport.id).delete()
                    .then(function() { btLastRapporter(); })
                    .catch(function(err) {
                        console.error('Kunne ikke slette rapport:', err);
                        alert('Kunne ikke slette rapporten.');
                    });
                return;
            }
            btRapporter.splice(index, 1);
            btSkrivLokalt(BT_LS_RAPPORTER, btRapporter);
            btRenderRapportRegister();
        });
    });
}

// Regenererer en lagret rapport uten å lagre den på nytt.
function btTegnPdfUtenLagring(rapport, logoInfo) {
    var original = btLagreRapport;
    btLagreRapport = function() {};
    try {
        btTegnPdf(rapport, logoInfo);
    } finally {
        btLagreRapport = original;
    }
}

// ============================================
// E-POST
// ============================================

function btSendEpost() {
    var base = document.getElementById('btBase').value || 'Ikke angitt';
    var dato = document.getElementById('btDate').value;
    var formatert = dato ? formatDateForFilename(dato) : 'Ikke angitt';

    var mottakere = [
        'AL_Teknikere-LOS@airlift.no',
        'camo.aw169@airlift.no',
        'basetekniker-flesland@airlift.no'
    ].join('; ');

    var emne = 'Vaktrapport basetekniker ' + base + ' ' + formatert;
    var tekst = 'Hei,\n\nSe vedlagt vaktrapport fra basetekniker.\n\nGod vakt 😊';

    window.location.href = 'mailto:' + encodeURIComponent(mottakere) +
        '?subject=' + encodeURIComponent(emne) +
        '&body=' + encodeURIComponent(tekst);
}

// ============================================
// OPPSTART
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setDateInputToToday('btDate');

    // Husk base og tekniker lokalt, så man slipper å fylle ut hver vakt.
    var lagretBase = localStorage.getItem('bt_valgt_base');
    if (lagretBase) document.getElementById('btBase').value = lagretBase;
    var lagretTekniker = localStorage.getItem('bt_tekniker');
    if (lagretTekniker) document.getElementById('btTekniker').value = lagretTekniker;

    document.getElementById('btBase').addEventListener('change', function() {
        localStorage.setItem('bt_valgt_base', this.value);
        btRenderIssueBoard();
    });
    document.getElementById('btTekniker').addEventListener('change', function() {
        localStorage.setItem('bt_tekniker', this.value.trim());
    });

    ['filterShowClosed', 'filterAllBases', 'filterKategori'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', btRenderIssueBoard);
    });

    document.getElementById('newIssueBtn').addEventListener('click', function() {
        btAapneSakModal(null);
    });
    document.getElementById('issueModalClose').addEventListener('click', btLukkSakModal);
    document.getElementById('issueModal').addEventListener('click', function(e) {
        if (e.target === this) btLukkSakModal();
    });
    document.getElementById('issueSaveBtn').addEventListener('click', btLagreFraModal);
    document.getElementById('issueDeleteBtn').addEventListener('click', function() {
        if (!btRedigererSakId) return;
        if (!confirm('Slette denne saken permanent? Bruk heller status «Lukket» hvis den er ferdig.')) return;
        btSlettSak(btRedigererSakId, btLukkSakModal);
    });

    document.getElementById('btExportPdf').addEventListener('click', btGenererPdf);
    document.getElementById('btSendEmail').addEventListener('click', btSendEpost);
    document.getElementById('btReset').addEventListener('click', function() {
        if (!confirm('Nullstille vaktfeltene? Saker og helikopterstatus beholdes.')) return;
        ['btVerktoy', 'btKalibrering', 'btHangar', 'btForbruk'].forEach(function(id) {
            document.getElementById(id).checked = false;
        });
        document.getElementById('btGenerelt').value = '';
        document.getElementById('btOverlevering').value = '';
        setDateInputToToday('btDate');
        var epost = document.getElementById('btSendEmail');
        epost.disabled = true;
        epost.classList.add('btn-neutral');
        epost.classList.remove('btn-success');
    });

    btLyttPaaHelikopter();
    btLyttPaaSaker();
    btLastRapporter();
});
