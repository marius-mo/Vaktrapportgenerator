// ============================================
// BASETEKNIKER - LEVENDE STATUSTAVLE OG VAKTRAPPORT
// ============================================
// Basetekniker har ansvar for alle tre baser (BGO, TOS, HFT). Basestatus,
// saker og ettersyn lever videre mellom vakter og deles mellom teknikere.
// Vaktrapporten er et øyeblikksbilde ved vaktslutt.

const BT_BASER = ['BGO', 'TOS', 'HFT'];
const BT_HELIKOPTRE = ['LN-OXH', 'LN-OXI', 'LN-OXJ', 'LN-OXK'];
const BT_SAK_STATUSER = ['Åpen', 'Pågår', 'Lukket'];
const BT_AAPNE_STATUSER = ['Åpen', 'Pågår'];
const BT_ETTERSYN_STATUSER = ['Planlegging', 'Pågår', 'Ferdig'];

// Firestore-samlinger. Uten Firebase brukes samme navn som nøkler i localStorage.
// bt_status holder både basestatus (base-BGO osv.) og ettersyn.
const BT_SAKER = 'bt_saker';
const BT_STATUS = 'bt_status';
const BT_RAPPORTER = 'bt_rapporter';
// Større reparasjoner lå her før de ble slått sammen med ettersyn.
const BT_PROSJEKTER = 'bt_prosjekter';

// Brukes bare når eldre rapporter med tools-oversikt lastes ned på nytt.
const BT_TOOLS_VARSEL_DAGER = 30;

// Basene het tidligere Bergen/Tromsø/Hammerfest på denne siden.
const BT_GAMLE_BASENAVN = { 'Bergen': 'BGO', 'Tromsø': 'TOS', 'Hammerfest': 'HFT' };

var btSaker = [];
var btBaseStatus = {};
var btEttersynListe = [];
var btNiceToKnow = {};
var btRedigererNiceToKnow = false;
var btRapporter = [];
var btRedigererSakId = null;
var btLokaleLyttere = {};

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

// Lokale lyttere varsles etter at nettleseren er ferdig med fokusbytte, slik
// Firestore også gjør. Ellers tegnes kortet på nytt midt i et klikk på et
// annet felt, og fokus havner i feil felt.
function btVarsleLokalt(samling, liste) {
    var lytter = btLokaleLyttere[samling];
    if (lytter) setTimeout(function() { lytter(liste); }, 0);
}

// Viser en forståelig feil når skyen avviser en lesing eller lagring.
// Manglende tilgang skyldes Firestore-reglene, ikke brukeren, og sies rett ut.
function btSkyFeil(err, handling) {
    console.error(handling + ':', err);
    var nektet = !!err && (err.code === 'permission-denied' || /permission/i.test(err.message || ''));
    var melding = nektet
        ? 'Databasen (Firestore) gir ikke tilgang til baseteknikerdataene, så ingenting kan lagres eller hentes. ' +
          'Reglene i Firebase Console må oppdateres – se «Firestore-regler» i README.'
        : handling + '. Sjekk nettforbindelsen og prøv igjen.';
    var banner = document.getElementById('btSkyFeil');
    if (banner) {
        banner.textContent = melding;
        banner.style.display = '';
    }
    return melding;
}

// Abonnerer på en samling. Callback får hele lista hver gang noe endres,
// også når en annen tekniker endrer noe.
function btLytt(samling, callback, feilElementId) {
    if (btHarSky()) {
        window.firestoreDb.collection(samling).onSnapshot(function(snapshot) {
            callback(snapshot.docs.map(function(d) {
                var data = d.data();
                data.id = d.id;
                return data;
            }));
        }, function(err) {
            btSkyFeil(err, 'Kunne ikke hente data');
            var el = feilElementId && document.getElementById(feilElementId);
            if (el) el.innerHTML = '<p class="no-reports">Kunne ikke hente data fra skyen.</p>';
        });
        return;
    }
    btLokaleLyttere[samling] = callback;
    callback(btLesLokalt(samling, '[]'));
}

function btLagre(samling, dok, callback) {
    var data = Object.assign({}, dok);
    var id = data.id;
    delete data.id;

    if (btHarSky()) {
        var ref = window.firestoreDb.collection(samling);
        var docRef = id ? ref.doc(id) : ref.doc();
        docRef.set(data)
            .then(function() { if (callback) callback(docRef.id); })
            .catch(function(err) {
                alert(btSkyFeil(err, 'Kunne ikke lagre'));
            });
        return;
    }

    var liste = btLesLokalt(samling, '[]');
    data.id = id || btNyId();
    var index = liste.findIndex(function(x) { return x.id === data.id; });
    if (index === -1) {
        liste.unshift(data);
    } else {
        liste[index] = data;
    }
    btSkrivLokalt(samling, liste);
    btVarsleLokalt(samling, liste);
    if (callback) callback(data.id);
}

function btSlett(samling, id, callback) {
    if (btHarSky()) {
        window.firestoreDb.collection(samling).doc(id).delete()
            .then(function() { if (callback) callback(); })
            .catch(function(err) {
                alert(btSkyFeil(err, 'Kunne ikke slette'));
            });
        return;
    }
    var liste = btLesLokalt(samling, '[]').filter(function(x) { return x.id !== id; });
    btSkrivLokalt(samling, liste);
    btVarsleLokalt(samling, liste);
    if (callback) callback();
}

// ============================================
// FELLES HJELPERE
// ============================================

function btNaa() {
    return new Date().toISOString();
}

function btIDag() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function btNormaliserBase(base) {
    return BT_GAMLE_BASENAVN[base] || base || '';
}

// Hele dager fra en dato til en annen (YYYY-MM-DD), uavhengig av tidssone.
function btDagerMellom(fraIso, tilIso) {
    if (!fraIso || !tilIso) return null;
    var fra = fraIso.split('-').map(Number);
    var til = tilIso.split('-').map(Number);
    return Math.round((Date.UTC(til[0], til[1] - 1, til[2]) - Date.UTC(fra[0], fra[1] - 1, fra[2])) / 86400000);
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

function btKortDato(iso) {
    if (!iso) return '-';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
}

function btStatusKlasse(status) {
    switch (status) {
        case 'Åpen': return 'open';
        case 'Pågår': return 'progress';
        case 'Lukket':
        case 'Ferdig': return 'closed';
        case 'Planlagt':
        case 'Planlegging': return 'planned';
        default: return 'neutral';
    }
}

// Brukes når eldre rapporter med tools-oversikt lastes ned på nytt.
function btToolDagerTekst(dager) {
    if (dager === null) return 'Ingen dato';
    if (dager < 0) return 'Forfalt ' + Math.abs(dager) + ' d';
    if (dager === 0) return 'Due i dag';
    return dager + ' d';
}

function btBaseValg(valgt, medTomTekst) {
    var html = medTomTekst ? '<option value="">' + escapeHtml(medTomTekst) + '</option>' : '';
    return html + BT_BASER.map(function(b) {
        return '<option value="' + b + '"' + (b === valgt ? ' selected' : '') + '>' + b + '</option>';
    }).join('');
}

function btMaskinValg(valgt, medTomTekst) {
    var html = medTomTekst ? '<option value="">' + escapeHtml(medTomTekst) + '</option>' : '';
    return html + BT_HELIKOPTRE.map(function(r) {
        return '<option value="' + r + '"' + (r === valgt ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
}

// Tegner HTML på nytt uten at feltet brukeren skriver i mister fokus eller tekst.
// Trengs fordi sanntidsoppdateringer kan komme mens noen fyller ut et felt.
function btRenderBevarFokus(container, html, etterRender) {
    var aktiv = document.activeElement;
    var nokkel = null;
    var verdi = null;
    var start = null;
    var slutt = null;
    if (aktiv && container.contains(aktiv) && aktiv.getAttribute('data-fokus')) {
        nokkel = aktiv.getAttribute('data-fokus');
        verdi = aktiv.value;
        try { start = aktiv.selectionStart; slutt = aktiv.selectionEnd; } catch (e) { /* ikke tekstfelt */ }
    }

    container.innerHTML = html;
    if (etterRender) etterRender();

    if (nokkel) {
        var nytt = container.querySelector('[data-fokus="' + CSS.escape(nokkel) + '"]');
        if (nytt) {
            if (verdi !== null) nytt.value = verdi;
            nytt.focus();
            try { if (start !== null) nytt.setSelectionRange(start, slutt); } catch (e) { /* ikke tekstfelt */ }
        }
    }
}

// ============================================
// SAKSTAVLE
// ============================================

// Status «Venter på deler» er fjernet; slike saker og ettersyn regnes som pågående.
function btUtenVenterPaaDeler(dok) {
    if (dok.status === 'Venter på deler') dok.status = 'Pågår';
    return dok;
}

// Eldre saker brukte GSE og fulle basenavn.
function btNormaliserSak(sak) {
    btUtenVenterPaaDeler(sak);
    if (sak.kategori === 'GSE/verktøy') sak.kategori = 'Tools/kalibrering';
    if (sak.omraade === 'GSE/verktøy') sak.omraade = 'Tools';
    sak.base = btNormaliserBase(sak.base);
    return sak;
}

function btErAapen(sak) {
    return BT_AAPNE_STATUSER.indexOf(sak.status) !== -1;
}

function btSynligeSaker(iBase) {
    var visLukkede = document.getElementById('filterShowClosed').checked;
    var kategori = document.getElementById('filterKategori').value;

    return btSaker.filter(function(sak) {
        if (!iBase(sak.base)) return false;
        if (!visLukkede && sak.status === 'Lukket') return false;
        if (kategori && sak.kategori !== kategori) return false;
        return true;
    });
}

function btSorterSaker(saker) {
    var prioRang = { 'Høy': 0, 'Normal': 1, 'Lav': 2 };
    var statusRang = { 'Åpen': 0, 'Pågår': 1, 'Lukket': 2 };
    return saker.slice().sort(function(a, b) {
        var s = (statusRang[a.status] || 0) - (statusRang[b.status] || 0);
        if (s !== 0) return s;
        var p = (prioRang[a.prioritet] !== undefined ? prioRang[a.prioritet] : 1) -
            (prioRang[b.prioritet] !== undefined ? prioRang[b.prioritet] : 1);
        if (p !== 0) return p;
        return new Date(a.opprettet || 0) - new Date(b.opprettet || 0);
    });
}

function btSakKortHtml(sak) {
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
}

function btRenderIssueBoard() {
    btOppdaterLiveBadge();
    var filtrert = document.getElementById('filterShowClosed').checked ||
        !!document.getElementById('filterKategori').value;

    BT_BASER.forEach(function(base) {
        var board = document.getElementById('issueBoard-' + base);
        if (!board) return;
        btRenderBaseOppsummering(base);
        var saker = btSorterSaker(btSynligeSaker(function(b) { return b === base; }));
        board.innerHTML = saker.length
            ? saker.map(btSakKortHtml).join('')
            : '<p class="no-reports">' + (filtrert ? 'Ingen saker som matcher filteret.' : 'Ingen utestående saker.') + '</p>';
    });

    var utenBase = btSorterSaker(btSynligeSaker(function(b) { return BT_BASER.indexOf(b) === -1; }));
    var annet = document.getElementById('baseSeksjon-annet');
    if (annet) {
        annet.style.display = utenBase.length ? '' : 'none';
        document.getElementById('issueBoard-annet').innerHTML = utenBase.map(btSakKortHtml).join('');
    }
}

function btRenderBaseOppsummering(base) {
    var el = document.getElementById('baseOppsummering-' + base);
    if (!el) return;
    var aapne = btSaker.filter(function(s) { return s.base === base && btErAapen(s); });
    var hoy = aapne.filter(function(s) { return s.prioritet === 'Høy'; }).length;
    var deler = [aapne.length === 0 ? 'ingen åpne saker' : (aapne.length === 1 ? '1 åpen sak' : aapne.length + ' åpne saker')];
    if (hoy) deler.push(hoy + ' høy prioritet');
    el.textContent = '· ' + deler.join(' · ');
    el.classList.toggle('text-bad', hoy > 0);
}

function btOppdaterLiveBadge() {
    var badge = document.getElementById('liveBadge');
    if (!badge) return;
    var antall = btSaker.filter(btErAapen).length;
    badge.textContent = antall > 0 ? 'Live · ' + antall + ' åpne' : 'Live';
}

function btEndreStatus(id, nyStatus) {
    var sak = btSaker.find(function(s) { return s.id === id; });
    if (!sak || sak.status === nyStatus) return;

    var oppdatert = Object.assign({}, sak);
    oppdatert.status = nyStatus;
    oppdatert.oppdatert = btNaa();
    oppdatert.logg = (sak.logg || []).concat([{
        tid: btNaa(),
        av: btAktivTekniker(),
        tekst: 'Status endret til ' + nyStatus + '.'
    }]);
    btSaker = btSaker.map(function(s) { return s.id === id ? oppdatert : s; });
    btLagre(BT_SAKER, oppdatert);
}

function btAktivTekniker() {
    var felt = document.getElementById('btTekniker');
    return felt && felt.value.trim() ? felt.value.trim() : 'Ukjent';
}

// ============================================
// TEKNIKERVALG (samme oppsett som «Personer involvert» på operativ side)
// ============================================

const BT_TEKNIKERE = ['Gustav Svanstrøm', 'Johan Karlsson'];
var btValgteTeknikere = [];

// Samler valgte og fritekst-navn i det skjulte feltet resten av siden leser.
function btOppdaterTeknikerFelt() {
    var ekstra = document.getElementById('btTeknikerExtra').value
        .split(',').map(function(n) { return n.trim(); }).filter(Boolean);
    var alle = btValgteTeknikere.slice();
    ekstra.forEach(function(n) { if (alle.indexOf(n) === -1) alle.push(n); });

    document.getElementById('btTekniker').value = alle.join(', ');
    localStorage.setItem('bt_tekniker', alle.join(', '));
    btRenderTeknikerValg();
}

function btRenderTeknikerValg() {
    var dropdown = document.getElementById('btTeknikerDropdown');
    dropdown.innerHTML = '<option value="">Velg tekniker...</option>' +
        BT_TEKNIKERE.filter(function(n) { return btValgteTeknikere.indexOf(n) === -1; })
            .map(function(n) {
                return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
            }).join('');

    var liste = document.getElementById('btValgteTeknikere');
    if (btValgteTeknikere.length === 0) {
        liste.innerHTML = '<p class="no-persons">Ingen tekniker valgt</p>';
        return;
    }
    liste.innerHTML = btValgteTeknikere.map(function(n, i) {
        return '<div class="selected-person-item"><span>' + escapeHtml(n) + '</span>' +
            '<button type="button" class="remove-person-btn" data-index="' + i + '">×</button></div>';
    }).join('');
    liste.querySelectorAll('.remove-person-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            btValgteTeknikere.splice(parseInt(this.getAttribute('data-index'), 10), 1);
            btOppdaterTeknikerFelt();
        });
    });
}

// Fordeler lagrede navn på faste teknikere og fritekst.
function btSettTeknikere(tekst) {
    var navn = (tekst || '').split(',').map(function(n) { return n.trim(); }).filter(Boolean);
    btValgteTeknikere = navn.filter(function(n) { return BT_TEKNIKERE.indexOf(n) !== -1; });
    document.getElementById('btTeknikerExtra').value =
        navn.filter(function(n) { return BT_TEKNIKERE.indexOf(n) === -1; }).join(', ');
    btOppdaterTeknikerFelt();
}

// ============================================
// SAKSDIALOG
// ============================================

function btAapneSakModal(id, nyBase) {
    btRedigererSakId = id || null;
    var modal = document.getElementById('issueModal');
    var sak = id ? btSaker.find(function(s) { return s.id === id; }) : null;

    document.getElementById('issueModalTitle').textContent = sak ? 'Rediger sak' : 'Ny sak';
    document.getElementById('issueTittel').value = sak ? (sak.tittel || '') : '';
    document.getElementById('issueOmraade').value = sak ? (sak.omraade || 'LN-OXH') : 'LN-OXH';
    document.getElementById('issueKategori').value = sak ? (sak.kategori || 'Feil') : 'Feil';
    document.getElementById('issuePrioritet').value = sak ? (sak.prioritet || 'Normal') : 'Normal';
    document.getElementById('issueStatus').value = sak ? (sak.status || 'Åpen') : 'Åpen';

    // Ny sak: foreslå ansvarlig bare når én tekniker er på jobb.
    var paaJobb = document.getElementById('btTekniker').value.split(',')
        .map(function(n) { return n.trim(); }).filter(Boolean);
    document.getElementById('issueAnsvarlig').value = sak
        ? (sak.ansvarlig || '')
        : (paaJobb.length === 1 ? paaJobb[0] : '');

    // Ny sak: bruk basen den ble opprettet fra, ellers den som ble brukt sist.
    var standardBase = nyBase || localStorage.getItem('bt_sist_base') || BT_BASER[0];
    document.getElementById('issueBase').value = sak ? (sak.base || BT_BASER[0]) : standardBase;

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

    var naa = btNaa();
    var eksisterende = btRedigererSakId
        ? btSaker.find(function(s) { return s.id === btRedigererSakId; })
        : null;
    var nyLoggTekst = document.getElementById('issueNyLogg').value.trim();
    var nyStatus = document.getElementById('issueStatus').value;
    var base = document.getElementById('issueBase').value;

    var sak = {
        id: btRedigererSakId || undefined,
        tittel: tittel,
        omraade: document.getElementById('issueOmraade').value,
        kategori: document.getElementById('issueKategori').value,
        prioritet: document.getElementById('issuePrioritet').value,
        status: nyStatus,
        ansvarlig: document.getElementById('issueAnsvarlig').value.trim(),
        base: base,
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

    localStorage.setItem('bt_sist_base', base);
    btLagre(BT_SAKER, sak, btLukkSakModal);
}

// ============================================
// BASESTATUS (én seksjon per base)
// ============================================
// Basestatus og tool status lagres som dokumentene base-BGO, base-TOS og
// base-HFT i bt_status, og står til neste tekniker oppdaterer dem.

function btBaseDokId(base) {
    return 'base-' + base;
}

function btByggBaseSeksjoner() {
    var div = document.getElementById('baseSeksjoner');
    div.innerHTML = BT_BASER.map(function(base) {
        return '<div class="form-section base-seksjon" data-base="' + base + '">' +
            '<div class="section-heading-row">' +
                '<h2>' + base + ' <span class="base-oppsummering" id="baseOppsummering-' + base + '"></span></h2>' +
                '<button type="button" class="btn btn-success ny-sak-btn" data-base="' + base + '">Ny sak</button>' +
            '</div>' +
            '<div class="base-status-felt">' +
                '<label for="baseStatus-' + base + '">Basestatus</label>' +
                '<textarea id="baseStatus-' + base + '" class="bt-input base-felt" data-base="' + base + '" data-felt="status"' +
                    ' placeholder="Status på basen nå: hangar, utstyr, bemanning, avtaler …"></textarea>' +
                '<label for="baseTools-' + base + '">Tool status</label>' +
                '<input type="text" id="baseTools-' + base + '" class="bt-input base-felt" data-base="' + base + '" data-felt="tools"' +
                    ' placeholder="f.eks. Alle tools innenfor kalibrering, TQ-0051 due 01.11">' +
            '</div>' +
            '<div class="bt-card-meta" id="baseMeta-' + base + '"></div>' +
            '<h3 class="report-group-title">Utestående saker</h3>' +
            '<div id="issueBoard-' + base + '" class="issue-board"><p class="no-reports">Laster...</p></div>' +
        '</div>';
    }).join('') +
    // Saker med en base som ikke finnes lenger, så de ikke forsvinner ut av syne.
    '<div class="form-section base-seksjon" id="baseSeksjon-annet" style="display: none;">' +
        '<h2>Saker uten base</h2>' +
        '<div id="issueBoard-annet" class="issue-board"></div>' +
    '</div>';
}

function btFyllBaseFelt() {
    BT_BASER.forEach(function(base) {
        var data = btBaseStatus[base] || {};
        [['baseStatus-', 'status'], ['baseTools-', 'tools']].forEach(function(par) {
            var felt = document.getElementById(par[0] + base);
            // Feltet noen skriver i nå, overskrives ikke av oppdateringer fra andre.
            if (felt && felt !== document.activeElement) felt.value = data[par[1]] || '';
        });
        var meta = document.getElementById('baseMeta-' + base);
        if (meta) {
            meta.textContent = data.oppdatert
                ? 'Sist oppdatert ' + btFormatTidspunkt(data.oppdatert) + (data.av ? ' av ' + data.av : '')
                : '';
        }
    });
}

function btLagreBaseFelt(felt) {
    var base = felt.getAttribute('data-base');
    var data = Object.assign({}, btBaseStatus[base] || {}, {
        id: btBaseDokId(base),
        base: base,
        oppdatert: btNaa(),
        av: btAktivTekniker()
    });
    data[felt.getAttribute('data-felt')] = felt.value;
    // Oppdateres med en gang, så tool status rett etter basestatus ikke overskriver den.
    btBaseStatus[base] = data;
    btLagre(BT_STATUS, data);
}

// ============================================
// ETTERSYN (flere samtidig)
// ============================================
// Hvert ettersyn er et eget dokument i bt_status, merket med art: 'ettersyn'.
// Det eldre enkeltdokumentet «ettersyn» har ingen merking, men har maskin.

const BT_ETTERSYN_RANG = { 'Pågår': 0, 'Planlegging': 1, 'Ferdig': 2 };

function btErEttersyn(dok) {
    return dok.id.indexOf('base-') !== 0 && (dok.art === 'ettersyn' || !!dok.reg);
}

function btSorterEttersyn(liste) {
    return liste.slice().sort(function(a, b) {
        var r = (BT_ETTERSYN_RANG[a.status] !== undefined ? BT_ETTERSYN_RANG[a.status] : 1) -
            (BT_ETTERSYN_RANG[b.status] !== undefined ? BT_ETTERSYN_RANG[b.status] : 1);
        if (r !== 0) return r;
        return (a.startet || '9999').localeCompare(b.startet || '9999') ||
            new Date(a.opprettet || 0) - new Date(b.opprettet || 0);
    });
}

function btEttersynFrist(e) {
    if (e.status === 'Ferdig') return null;
    if (e.status === 'Planlegging' && e.startet) {
        var tilStart = btDagerMellom(btIDag(), e.startet);
        if (tilStart > 0) return { tekst: 'Starter om ' + tilStart + ' dager', over: false };
        if (tilStart === 0) return { tekst: 'Starter i dag', over: false };
        return { tekst: 'Skulle startet for ' + Math.abs(tilStart) + ' dager siden', over: true };
    }
    if (e.forventetFerdig) {
        var tilFerdig = btDagerMellom(btIDag(), e.forventetFerdig);
        return tilFerdig >= 0
            ? { tekst: tilFerdig + ' dager til forventet ferdig', over: false }
            : { tekst: Math.abs(tilFerdig) + ' dager over forventet ferdig', over: true };
    }
    return null;
}

function btEttersynKortHtml(e) {
    var id = escapeHtml(e.id);
    var status = e.status || 'Planlegging';
    var tone = status === 'Ferdig' ? 'tone-ok' : (status === 'Planlegging' ? 'tone-neutral' : 'tone-info');
    var fokus = function(felt) { return ' data-id="' + id + '" data-felt="' + felt + '" data-fokus="ettersyn:' + id + ':' + felt + '"'; };

    var statusKnapper = BT_ETTERSYN_STATUSER.map(function(s) {
        return '<button type="button" class="issue-status-btn issue-status-' + btStatusKlasse(s) +
            (s === status ? ' is-active' : '') + ' ettersyn-status-btn" data-id="' + id +
            '" data-status="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
    }).join('');

    var frist = btEttersynFrist(Object.assign({}, e, { status: status }));

    return '<div class="bt-card ' + tone + (status === 'Ferdig' ? ' is-closed' : '') + '">' +
        '<div class="bt-card-head">' +
            '<span class="bt-card-title">' + escapeHtml(e.reg || 'Velg maskin') +
                (e.type ? ' – ' + escapeHtml(e.type) : '') + '</span>' +
            '<div class="issue-status-group">' + statusKnapper + '</div>' +
        '</div>' +
        '<div class="bt-field-grid">' +
            '<label>Maskin<select class="bt-input ettersyn-felt"' + fokus('reg') + '>' +
                btMaskinValg(e.reg, 'Velg...') + '</select></label>' +
            '<label>Type ettersyn<input type="text" class="bt-input ettersyn-felt"' + fokus('type') +
                ' value="' + escapeHtml(e.type || '') + '" placeholder="f.eks. 400 hrs / MLG repair"></label>' +
            '<label>Base<select class="bt-input ettersyn-felt"' + fokus('base') + '>' +
                btBaseValg(e.base, '–') + '</select></label>' +
            '<label>Start<input type="date" class="bt-input ettersyn-felt"' + fokus('startet') +
                ' value="' + escapeHtml(e.startet || '') + '"></label>' +
            '<label>Forventet ferdig<input type="date" class="bt-input ettersyn-felt"' + fokus('forventetFerdig') +
                ' value="' + escapeHtml(e.forventetFerdig || '') + '"></label>' +
        '</div>' +
        '<label class="bt-textarea-label">Fremdrift / merknad' +
            '<textarea class="bt-input ettersyn-felt"' + fokus('merknad') +
            ' placeholder="Hva er gjort, hva gjenstår, deler, funn underveis">' + escapeHtml(e.merknad || '') + '</textarea></label>' +
        '<div class="bt-card-meta">' +
            (frist ? '<span class="' + (frist.over ? 'text-bad' : '') + '">' + escapeHtml(frist.tekst) + '</span> · ' : '') +
            (e.oppdatert ? 'Sist oppdatert ' + escapeHtml(btFormatTidspunkt(e.oppdatert)) + ' · ' : '') +
            '<button type="button" class="link-button ettersyn-fjern" data-id="' + id + '">Fjern ettersyn</button>' +
        '</div>' +
    '</div>';
}

function btRenderEttersyn() {
    var panel = document.getElementById('ettersynPanel');
    if (!panel) return;
    var liste = btSorterEttersyn(btEttersynListe);
    btRenderBevarFokus(panel, liste.length
        ? liste.map(btEttersynKortHtml).join('')
        : '<p class="no-reports">Ingen ettersyn registrert. Trykk «Legg til ettersyn».</p>');
}

function btOppdaterEttersyn(id, endring) {
    var e = btEttersynListe.find(function(x) { return x.id === id; });
    if (!e) return;
    var oppdatert = Object.assign({}, e, endring, { art: 'ettersyn', oppdatert: btNaa() });
    // Oppdater lista med en gang. Ellers bygger en ny endring rett etter (f.eks.
    // når man tabber videre til neste felt) på en kopi uten denne, og overskriver den.
    btEttersynListe = btEttersynListe.map(function(x) { return x.id === id ? oppdatert : x; });
    btLagre(BT_STATUS, oppdatert);
}

function btNyttEttersyn() {
    var naa = btNaa();
    btLagre(BT_STATUS, {
        art: 'ettersyn',
        reg: '',
        type: '',
        base: '',
        startet: '',
        forventetFerdig: '',
        status: 'Planlegging',
        merknad: '',
        opprettet: naa,
        oppdatert: naa
    });
}

// ============================================
// FLYTTING AV STØRRE REPARASJONER
// ============================================
// Større reparasjoner er slått sammen med ettersyn. Reparasjoner som ligger
// igjen, flyttes over én gang og merkes som flyttet. Fast dokument-id gjør at
// to teknikere som åpner siden samtidig, ikke lager hver sin kopi.

function btReparasjonTilEttersyn(p) {
    var reg = p.maskin || '';
    var punkter = (p.delpunkter || []).map(function(d) {
        return (d.ferdig ? '[x] ' : '[ ] ') + d.tekst;
    });
    return {
        id: 'reparasjon-' + p.id,
        art: 'ettersyn',
        reg: reg,
        type: (p.tittel || '').replace(reg, '').trim() || p.tittel || '',
        base: p.base || '',
        startet: p.planlagtStart || '',
        forventetFerdig: p.forventetFerdig || '',
        status: p.status === 'Planlagt' ? 'Planlegging' : (p.status || 'Planlegging'),
        merknad: [p.merknad || ''].concat(punkter).filter(Boolean).join('\n'),
        opprettet: p.opprettet || btNaa(),
        oppdatert: btNaa()
    };
}

function btFlyttReparasjoner() {
    var skalFlyttes = function(p) { return !p.slettet && !p.flyttet; };

    if (btHarSky()) {
        var db = window.firestoreDb;
        // Spør serveren direkte, så en tom lokal cache ikke gir feil svar.
        db.collection(BT_PROSJEKTER).get({ source: 'server' }).then(function(snapshot) {
            snapshot.docs.forEach(function(d) {
                var p = d.data();
                p.id = d.id;
                if (!skalFlyttes(p)) return;
                var ettersyn = btReparasjonTilEttersyn(p);
                var nyId = ettersyn.id;
                delete ettersyn.id;
                db.collection(BT_STATUS).doc(nyId).set(ettersyn)
                    .then(function() {
                        return db.collection(BT_PROSJEKTER).doc(p.id).update({ slettet: true, flyttet: true });
                    })
                    .catch(function(err) { btSkyFeil(err, 'Kunne ikke flytte reparasjon til ettersyn'); });
            });
        }).catch(function(err) { console.warn('Kunne ikke sjekke gamle reparasjoner:', err); });
        return;
    }

    var prosjekter = btLesLokalt(BT_PROSJEKTER, '[]');
    var flyttet = prosjekter.filter(skalFlyttes);
    if (flyttet.length === 0) return;
    flyttet.forEach(function(p) { btLagre(BT_STATUS, btReparasjonTilEttersyn(p)); });
    btSkrivLokalt(BT_PROSJEKTER, prosjekter.map(function(p) {
        return skalFlyttes(p) ? Object.assign({}, p, { slettet: true, flyttet: true }) : p;
    }));
}

// ============================================
// NICE TO KNOW
// ============================================
// Felles oppslagsinfo som kundenumre og telefonnumre. Lagres som dokumentet
// «nice-to-know» i bt_status. Det er ment for skjermen og tas ikke med i PDF-en.

const BT_NICE_TO_KNOW_ID = 'nice-to-know';

// Gjør telefonnumre, e-post og nettadresser klikkbare. Bare numre skrevet som
// telefonnumre (med mellomrom eller +47) lenkes, så kundenumre ikke blir lenker.
function btLenkifiser(tekst) {
    return escapeHtml(tekst)
        .replace(/\bhttps?:\/\/[^\s<]+/g, function(url) {
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
        })
        .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, function(epost) {
            return '<a href="mailto:' + epost + '">' + epost + '</a>';
        })
        .replace(/(\+47\s?)?\b(\d{2}\s\d{2}\s\d{2}\s\d{2}|\d{3}\s\d{2}\s\d{3})\b|\+47\s?\d{8}\b/g, function(nummer) {
            return '<a href="tel:' + nummer.replace(/\s/g, '') + '">' + nummer + '</a>';
        });
}

function btRenderNiceToKnow() {
    var visning = document.getElementById('ntkVisning');
    if (!visning) return;
    var tekst = (btNiceToKnow.tekst || '').trim();
    visning.innerHTML = tekst
        ? btLenkifiser(tekst)
        : '<span class="no-persons">Ingen info lagt inn ennå. Trykk «Rediger» for å legge til kundenumre, telefonnumre o.l.</span>';
    document.getElementById('ntkMeta').textContent = btNiceToKnow.oppdatert
        ? 'Sist oppdatert ' + btFormatTidspunkt(btNiceToKnow.oppdatert) + (btNiceToKnow.av ? ' av ' + btNiceToKnow.av : '')
        : '';
}

function btSettNiceToKnowRedigering(paa) {
    btRedigererNiceToKnow = paa;
    var felt = document.getElementById('ntkTekst');
    document.getElementById('ntkVisning').style.display = paa ? 'none' : '';
    felt.style.display = paa ? '' : 'none';
    document.getElementById('ntkRediger').style.display = paa ? 'none' : '';
    document.getElementById('ntkLagre').style.display = paa ? '' : 'none';
    document.getElementById('ntkAvbryt').style.display = paa ? '' : 'none';
    if (paa) {
        document.getElementById('niceToKnow').open = true;
        felt.value = btNiceToKnow.tekst || '';
        felt.focus();
    } else {
        btRenderNiceToKnow();
    }
}

function btLagreNiceToKnow() {
    var data = {
        id: BT_NICE_TO_KNOW_ID,
        tekst: document.getElementById('ntkTekst').value,
        oppdatert: btNaa(),
        av: btAktivTekniker()
    };
    btNiceToKnow = data;
    btLagre(BT_STATUS, data);
    btSettNiceToKnowRedigering(false);
}

// ============================================
// VAKTRAPPORT (PDF)
// ============================================

function btSamleRapportData() {
    var dato = document.getElementById('btDate').value;

    var aapne = btSorterSaker(btSaker.filter(btErAapen));
    // Saker med loggaktivitet på valgt dato regnes som endret denne vakten.
    var endretIDag = btSaker.filter(function(s) {
        return (s.logg || []).some(function(post) {
            return (post.tid || '').slice(0, 10) === dato;
        });
    });

    return {
        dato: dato,
        tekniker: document.getElementById('btTekniker').value.trim(),
        baser: BT_BASER.slice(),
        baseOversikt: BT_BASER.map(function(base) {
            var b = btBaseStatus[base] || {};
            return { base: base, status: b.status || '', tools: b.tools || '' };
        }),
        aapneSaker: aapne.map(btSakSnapshot),
        endringer: endretIDag.map(btSakSnapshot),
        ettersynListe: btSorterEttersyn(btEttersynListe).map(function(e) {
            return {
                reg: e.reg || '', type: e.type || '', base: e.base || '', startet: e.startet || '',
                forventetFerdig: e.forventetFerdig || '', status: e.status || 'Planlegging', merknad: e.merknad || ''
            };
        }),
        timestamp: btNaa()
    };
}

function btSakSnapshot(sak) {
    var sisteLogg = (sak.logg && sak.logg.length) ? sak.logg[sak.logg.length - 1] : null;
    return {
        tittel: sak.tittel || '',
        base: sak.base || '',
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

function btMedLogo(callback) {
    var logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = logo.width;
        canvas.height = logo.height;
        canvas.getContext('2d').drawImage(logo, 0, 0);
        callback({ data: canvas.toDataURL('image/png'), width: logo.width, height: logo.height });
    };
    logo.onerror = function() {
        console.warn('Logo kunne ikke lastes, fortsetter uten.');
        callback(null);
    };
    logo.src = 'assets/airliftlogo.webp';
}

function btGenererPdf() {
    if (!document.getElementById('btDate').value) {
        alert('Velg dato før du genererer rapporten.');
        return;
    }
    if (!document.getElementById('btTekniker').value.trim()) {
        alert('Velg hvilken basetekniker som er på jobb.');
        document.getElementById('btTeknikerDropdown').focus();
        return;
    }
    var data = btSamleRapportData();
    btMedLogo(function(logoInfo) { btTegnPdf(data, logoInfo, true); });
}

function btTegnPdf(data, logoInfo, lagreIRegister) {
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

    // Eldre rapporter var per base; nyere dekker alle baser.
    var baseTekst = data.baser ? data.baser.join(' / ') : (btNormaliserBase(data.base) || '-');

    var y = 0;

    // Header
    const headerHeight = 20;
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    if (logoInfo && logoInfo.data) {
        try {
            var ratio = logoInfo.width / logoInfo.height;
            var lh = 14;
            var lw = lh * ratio;
            if (lw > 40) { lw = 40; lh = lw / ratio; }
            doc.addImage(logoInfo.data, 'PNG', pageWidth - right - lw, (headerHeight - lh) / 2, lw, lh);
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

    y = headerHeight + 5;

    function sikrePlass(behov) {
        if (y + behov > pageHeight - bottom) {
            doc.addPage();
            y = 15;
        }
    }

    function farge(f) { doc.setTextColor(f[0], f[1], f[2]); }

    function seksjonstittel(tittel) {
        y += 3;
        sikrePlass(14);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        farge(blueDark);
        doc.text(tittel, left, y);
        y += 2;
        doc.setDrawColor(border[0], border[1], border[2]);
        doc.setLineWidth(0.4);
        doc.line(left, y, left + width, y);
        y += 5;
    }

    function undertittel(tittel) {
        sikrePlass(10);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        farge(navy);
        doc.text(tittel, left, y);
        y += 5;
    }

    // Skriver tekst med linjebryting og sideskift underveis.
    function tekst(innhold, valg) {
        valg = valg || {};
        var innrykk = valg.innrykk || 0;
        doc.setFontSize(valg.storrelse || 9);
        doc.setFont('helvetica', valg.stil || 'normal');
        farge(valg.farge || textPrimary);
        var linjer = doc.splitTextToSize(innhold, width - innrykk - (valg.hoyreMarg || 0));
        var linjeHoyde = valg.linjeHoyde || 4.2;
        linjer.forEach(function(linje) {
            sikrePlass(linjeHoyde + 1);
            doc.text(linje, left + innrykk, y);
            y += linjeHoyde;
        });
    }

    function tom(melding) {
        tekst(melding, { stil: 'italic', farge: textSecondary });
        y += 2;
    }

    function statusFarge(status) {
        if (status === 'Serviceable' || status === 'Lukket' || status === 'Ferdig') return green;
        if (status === 'Planlegging' || status === 'Planlagt') return blueDark;
        if (status === 'AOG' || status === 'Åpen') return red;
        return amber;
    }

    // Tittel til venstre, status i farge til høyre på samme linje.
    function tittelMedStatus(tittel, status) {
        sikrePlass(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        var linjer = doc.splitTextToSize(tittel, width - 42);
        if (status) {
            farge(statusFarge(status));
            doc.text(status, left + width, y, { align: 'right' });
        }
        farge(textPrimary);
        linjer.forEach(function(linje) {
            sikrePlass(5);
            doc.text(linje, left, y);
            y += 4.2;
        });
    }

    // --- Rapportinformasjon ---
    seksjonstittel('Rapportinformasjon');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    farge(textPrimary);
    doc.text('Dato:', left, y);
    doc.text('Baser:', left + 70, y);
    doc.setFont('helvetica', 'normal');
    farge(textSecondary);
    doc.text(formatDate(data.dato), left + 16, y);
    doc.text(baseTekst, left + 86, y);
    y += 5.5;
    doc.setFont('helvetica', 'bold');
    farge(textPrimary);
    doc.text('Tekniker:', left, y);
    var teknikerLinjer = doc.splitTextToSize(data.tekniker || '-', width - 22);
    doc.setFont('helvetica', 'normal');
    farge(textSecondary);
    doc.text(teknikerLinjer, left + 20, y);
    y += teknikerLinjer.length * 4.2 + 2;

    // Etikett i fet skrift til venstre, tekst med linjebryting til høyre.
    function etikettTekst(etikett, verdi) {
        sikrePlass(6);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        farge(textPrimary);
        doc.text(etikett + ':', left, y);
        doc.setFont('helvetica', 'normal');
        farge(textSecondary);
        doc.splitTextToSize(verdi, width - 26).forEach(function(linje, i) {
            if (i > 0) sikrePlass(5);
            doc.text(linje, left + 26, y);
            y += 4;
        });
        y += 1;
    }

    // --- Base for base (eldre rapporter: utestående saker gruppert per base) ---
    var aapne = (data.aapneSaker || []).map(function(s) {
        return Object.assign({}, s, { base: btNormaliserBase(s.base) || btNormaliserBase(data.base) || '' });
    });
    var oversikt = {};
    (data.baseOversikt || []).forEach(function(b) { oversikt[b.base] = b; });
    if (!data.baseOversikt) seksjonstittel('Utestående saker (' + aapne.length + ')');
    var grupper = (data.baser || []).slice();
    aapne.forEach(function(s) { if (grupper.indexOf(s.base) === -1) grupper.push(s.base); });
    if (grupper.length === 0) grupper = [''];
    grupper.forEach(function(base) {
        var iGruppe = aapne.filter(function(s) { return s.base === base; });
        if (data.baseOversikt) {
            seksjonstittel((base || 'Uten base') + ' – ' +
                (iGruppe.length === 1 ? '1 åpen sak' : iGruppe.length + ' åpne saker'));
            if (oversikt[base]) {
                etikettTekst('Basestatus', oversikt[base].status || '-');
                etikettTekst('Tool status', oversikt[base].tools || '-');
                y += 1.5;
            }
        } else {
            undertittel((base || 'Uten base') + ' (' + iGruppe.length + ')');
        }
        if (iGruppe.length === 0) {
            tom('Ingen åpne saker.');
            return;
        }
        iGruppe.forEach(function(sak) {
            tittelMedStatus((sak.prioritet === 'Høy' ? '[HØY] ' : '') + sak.tittel, sak.status);
            tekst([sak.omraade, sak.kategori, sak.ansvarlig || 'Ingen ansvarlig', 'åpen i ' + sak.dagerAapen + ' d']
                .filter(Boolean).join('  ·  '), { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 4 });
            if (sak.sisteLogg) {
                tekst('Siste: ' + sak.sisteLogg, { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 3.8 });
            }
            y += 2.5;
        });
    });

    // --- Endringer denne vakten ---
    var endringer = data.endringer || [];
    seksjonstittel('Endringer denne vakten (' + endringer.length + ')');
    if (endringer.length === 0) {
        tom('Ingen saker ble opprettet eller oppdatert denne vakten.');
    } else {
        endringer.forEach(function(sak) {
            var base = btNormaliserBase(sak.base) || btNormaliserBase(data.base);
            tekst((base ? base + ' · ' : '') + sak.tittel + ' (' + sak.omraade + ') - ' + sak.status +
                (sak.sisteLogg ? ': ' + sak.sisteLogg : ''), { storrelse: 8.5, innrykk: 2, linjeHoyde: 4 });
            y += 1.5;
        });
    }

    // --- Større reparasjoner ---
    if (data.prosjekter) {
        seksjonstittel('Større reparasjoner');
        if (data.prosjekter.length === 0) {
            tom('Ingen aktive reparasjoner.');
        }
        data.prosjekter.forEach(function(p) {
            tittelMedStatus(p.tittel, p.status);
            var meta = [p.maskin, p.base, p.ansvarlig ? 'Ansvarlig: ' + p.ansvarlig : null].filter(Boolean);
            var datoer = [
                p.planlagtStart ? 'Planlagt start ' + btKortDato(p.planlagtStart) : null,
                p.forventetFerdig ? 'Forventet ferdig ' + btKortDato(p.forventetFerdig) : null
            ].filter(Boolean);
            if (meta.length || datoer.length) {
                tekst(meta.concat(datoer).join('  ·  '), { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 4 });
            }
            var ferdige = p.delpunkter.filter(function(d) { return d.ferdig; }).length;
            if (p.delpunkter.length) {
                tekst('Fremdrift: ' + ferdige + ' av ' + p.delpunkter.length + ' delpunkter ferdig',
                    { storrelse: 8, innrykk: 2, linjeHoyde: 4 });
                p.delpunkter.forEach(function(d) {
                    tekst((d.ferdig ? '[x] ' : '[  ] ') + d.tekst,
                        { storrelse: 8, farge: d.ferdig ? textSecondary : textPrimary, innrykk: 5, linjeHoyde: 3.9 });
                });
            }
            if (p.merknad) {
                tekst('Merknad: ' + p.merknad, { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 3.9 });
            }
            y += 3;
        });
    }

    // --- Tools - neste due ---
    if (data.tools) {
        seksjonstittel('Tools – neste due');
        if (!data.tools.totalt) {
            tom('Ingen tools registrert.');
        } else {
            data.tools.perBase.forEach(function(s) {
                sikrePlass(6);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                farge(textPrimary);
                doc.text(s.base, left, y);
                var deler = [];
                if (s.antall === 0) {
                    deler.push('ingen tools registrert');
                } else {
                    deler.push(s.neste ? 'neste due ' + btKortDato(s.neste.nesteDue) + ' (' + s.neste.beskrivelse + ')' : 'ingen kommende due');
                    if (s.forfalt) deler.push(s.forfalt + ' forfalt');
                    if (s.snart) deler.push(s.snart + ' innen ' + BT_TOOLS_VARSEL_DAGER + ' d');
                }
                doc.setFont('helvetica', 'normal');
                farge(s.forfalt ? red : textSecondary);
                var linjer = doc.splitTextToSize(deler.join('  ·  '), width - 14);
                doc.text(linjer, left + 14, y);
                y += linjer.length * 4.2 + 1;
            });
            y += 2;
            if (data.tools.kritiske.length) {
                undertittel('Forfalt eller due innen ' + BT_TOOLS_VARSEL_DAGER + ' dager (' + data.tools.kritiske.length + ')');
                data.tools.kritiske.forEach(function(t) {
                    sikrePlass(5);
                    doc.setFontSize(8.5);
                    doc.setFont('helvetica', 'normal');
                    farge(t.dagerIgjen < 0 ? red : amber);
                    doc.text(btKortDato(t.nesteDue), left + 2, y);
                    doc.text(btToolDagerTekst(t.dagerIgjen), left + width, y, { align: 'right' });
                    farge(textPrimary);
                    doc.text(t.base, left + 24, y);
                    var navn = doc.splitTextToSize(t.beskrivelse, width - 60);
                    doc.text(navn, left + 36, y);
                    y += navn.length * 4 + 0.8;
                });
            } else {
                tom('Ingen tools er forfalt eller due de neste ' + BT_TOOLS_VARSEL_DAGER + ' dagene.');
            }
        }
    }

    // --- Kontrollpunkter og overlevering (bare eldre rapporter har disse) ---
    if (data.kontroll) {
        seksjonstittel(data.baseOversikt ? 'Vaktslutt' : 'Basestatus');
        var punkter = [
            ['Verktøy på plass', data.kontroll.verktoy],
            ['Kalibrering av tools à jour', data.kontroll.kalibrering],
            ['Hangar ryddig', data.kontroll.hangar],
            ['Forbruksmateriell OK', data.kontroll.forbruk]
        ];
        doc.setFontSize(9);
        punkter.forEach(function(punkt, i) {
            var kolonne = i % 2;
            if (kolonne === 0 && i > 0) y += 5.5;
            sikrePlass(6);
            var x = left + kolonne * (width / 2);
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
            farge(punkt[1] ? textPrimary : textSecondary);
            doc.text(punkt[0], x + 6, y);
        });
        y += 8;

        if (data.generelt) {
            undertittel(data.baseOversikt ? 'Generelle hendelser' : 'Generell status / hendelser');
            tekst(data.generelt, { innrykk: 2, farge: textSecondary });
            y += 2;
        }

        // --- Overlevering ---
        seksjonstittel('Overlevering til neste vakt');
        tekst(data.overlevering || '(Ingen merknader)', { innrykk: 2 });
    }

    // --- Ettersyn (til sist) ---
    if (data.ettersynListe) {
        seksjonstittel('Ettersyn (' + data.ettersynListe.length + ')');
        if (data.ettersynListe.length === 0) tom('Ingen ettersyn registrert.');
        data.ettersynListe.forEach(function(e) {
            tittelMedStatus((e.reg || 'Ukjent maskin') + (e.type ? ' – ' + e.type : ''), e.status);
            tekst([
                e.base || null,
                e.startet ? 'Start ' + btKortDato(e.startet) : null,
                e.forventetFerdig ? 'Forventet ferdig ' + btKortDato(e.forventetFerdig) : null
            ].filter(Boolean).join('  ·  ') || '-', { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 4 });
            if (e.merknad) tekst(e.merknad, { storrelse: 8.5, innrykk: 2, linjeHoyde: 4 });
            y += 2.5;
        });
    } else if (data.ettersyn) {
        seksjonstittel('Ettersyn');
        var e = data.ettersyn;
        if (!e.reg) {
            tom('Ingen maskin på ettersyn.');
        } else {
            tittelMedStatus(e.reg + (e.type ? ' – ' + e.type : ''), e.status);
            tekst([
                e.base || null,
                e.startet ? 'Startet ' + btKortDato(e.startet) : null,
                e.forventetFerdig ? 'Forventet ferdig ' + btKortDato(e.forventetFerdig) : null
            ].filter(Boolean).join('  ·  ') || '-', { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 4 });
            if (e.merknad) tekst(e.merknad, { storrelse: 8.5, innrykk: 2, linjeHoyde: 4 });
        }
    } else if (data.helikopter) {
        // Eldre rapporter hadde status for alle maskiner.
        seksjonstittel('Helikopterstatus');
        data.helikopter.forEach(function(h) {
            tittelMedStatus(h.reg + (h.nesteEttersyn ? ' – neste ettersyn ' + h.nesteEttersyn : ''), h.status);
            if (h.merknad) tekst(h.merknad, { storrelse: 8, farge: textSecondary, innrykk: 2, linjeHoyde: 4 });
        });
    }

    // Footer
    var sider = doc.internal.getNumberOfPages();
    for (var i = 1; i <= sider; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        farge(textSecondary);
        doc.text('Basetekniker - ' + baseTekst + ' - ' + formatDate(data.dato), left, pageHeight - 8);
        doc.text('Side ' + i + ' av ' + sider, pageWidth - right, pageHeight - 8, { align: 'right' });
    }

    doc.save('Vaktrapport_Basetekniker_' + formatDateForFilename(data.dato) + '.pdf');

    if (!lagreIRegister) return;
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

function btLastRapporter() {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_RAPPORTER)
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
                btSkyFeil(err, 'Kunne ikke hente rapporter');
                document.getElementById('btReportRegister').innerHTML =
                    '<p class="no-reports">Kunne ikke hente rapporter fra skyen.</p>';
            });
        return;
    }
    btRapporter = btLesLokalt(BT_RAPPORTER, '[]');
    btRenderRapportRegister();
}

function btLagreRapport(rapport) {
    if (btHarSky()) {
        window.firestoreDb.collection(BT_RAPPORTER).add(rapport)
            .then(function() { btLastRapporter(); })
            .catch(function(err) {
                alert(btSkyFeil(err, 'PDF-en er lastet ned, men rapporten kunne ikke lagres i registeret'));
            });
        return;
    }
    rapport.id = btNyId();
    btRapporter.unshift(rapport);
    if (btRapporter.length > 30) btRapporter = btRapporter.slice(0, 30);
    btSkrivLokalt(BT_RAPPORTER, btRapporter);
    btRenderRapportRegister();
}

function btAntallAktiveEttersyn(rapport) {
    if (rapport.ettersynListe) {
        return rapport.ettersynListe.filter(function(e) { return e.status !== 'Ferdig'; }).length;
    }
    return rapport.ettersyn && rapport.ettersyn.reg ? 1 : 0;
}

function btRenderRapportRegister() {
    var div = document.getElementById('btReportRegister');
    if (!div) return;

    if (!btRapporter || btRapporter.length === 0) {
        div.innerHTML = '<p class="no-reports">Ingen tidligere rapporter registrert</p>';
        return;
    }

    div.innerHTML = btRapporter.map(function(rapport, index) {
        var antall = (rapport.aapneSaker || []).length;
        var forfalt = rapport.tools
            ? rapport.tools.perBase.reduce(function(sum, s) { return sum + s.forfalt; }, 0) : 0;
        var deler = [
            rapport.baser ? null : 'Base: ' + escapeHtml(btNormaliserBase(rapport.base) || '-'),
            'Tekniker: ' + escapeHtml(rapport.tekniker || '-'),
            antall + ' utestående',
            forfalt ? forfalt + ' tools forfalt' : null,
            btAntallAktiveEttersyn(rapport) ? btAntallAktiveEttersyn(rapport) + ' ettersyn' : null
        ].filter(Boolean);
        return '<div class="report-item">' +
            '<div class="report-item-info">' +
                '<div class="report-item-date">' + escapeHtml(formatDate(rapport.dato || '')) + '</div>' +
                '<div class="report-item-details">' + deler.join(' | ') + '</div>' +
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
            btMedLogo(function(logoInfo) { btTegnPdf(rapport, logoInfo, false); });
        });
    });

    div.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'), 10);
            var rapport = btRapporter[index];
            if (!rapport) return;
            if (!confirm('Slette denne rapporten? Tavlen beholdes.')) return;

            if (btHarSky() && rapport.id) {
                window.firestoreDb.collection(BT_RAPPORTER).doc(rapport.id).delete()
                    .then(function() { btLastRapporter(); })
                    .catch(function(err) {
                        alert(btSkyFeil(err, 'Kunne ikke slette rapporten'));
                    });
                return;
            }
            btRapporter.splice(index, 1);
            btSkrivLokalt(BT_RAPPORTER, btRapporter);
            btRenderRapportRegister();
        });
    });
}

// ============================================
// E-POST
// ============================================

function btSendEpost() {
    var dato = document.getElementById('btDate').value;
    var formatert = dato ? formatDateForFilename(dato) : 'Ikke angitt';

    var mottakere = [
        'AL_Teknikere-LOS@airlift.no',
        'camo.aw169@airlift.no',
        'basetekniker-flesland@airlift.no'
    ].join('; ');

    var emne = 'Vaktrapport basetekniker ' + BT_BASER.join('/') + ' ' + formatert;
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
    btByggBaseSeksjoner();

    btSettTeknikere(localStorage.getItem('bt_tekniker') || '');
    document.getElementById('btTeknikerDropdown').addEventListener('change', function() {
        if (this.value && btValgteTeknikere.indexOf(this.value) === -1) {
            btValgteTeknikere.push(this.value);
            btOppdaterTeknikerFelt();
        }
    });
    document.getElementById('btTeknikerExtra').addEventListener('input', btOppdaterTeknikerFelt);

    // Baser: saker, basestatus og tool status. Kortene tegnes på nytt ved
    // hver endring, så klikk fanges opp på seksjonene i stedet for per knapp.
    ['filterShowClosed', 'filterKategori'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', btRenderIssueBoard);
    });
    var baseSeksjoner = document.getElementById('baseSeksjoner');
    baseSeksjoner.addEventListener('click', function(e) {
        var knapp = e.target.closest('button');
        if (!knapp) return;
        if (knapp.classList.contains('issue-status-btn')) {
            btEndreStatus(knapp.getAttribute('data-id'), knapp.getAttribute('data-status'));
        } else if (knapp.classList.contains('issue-open-btn')) {
            btAapneSakModal(knapp.getAttribute('data-id'));
        } else if (knapp.classList.contains('ny-sak-btn')) {
            btAapneSakModal(null, knapp.getAttribute('data-base'));
        }
    });
    baseSeksjoner.addEventListener('change', function(e) {
        if (e.target.classList.contains('base-felt')) btLagreBaseFelt(e.target);
    });

    document.getElementById('issueModalClose').addEventListener('click', btLukkSakModal);
    document.getElementById('issueModal').addEventListener('click', function(e) {
        if (e.target === this) btLukkSakModal();
    });
    document.getElementById('issueSaveBtn').addEventListener('click', btLagreFraModal);
    document.getElementById('issueDeleteBtn').addEventListener('click', function() {
        if (!btRedigererSakId) return;
        if (!confirm('Slette denne saken permanent? Bruk heller status «Lukket» hvis den er ferdig.')) return;
        btSlett(BT_SAKER, btRedigererSakId, btLukkSakModal);
    });

    // Nice to know: husk om boksen var åpen sist
    var niceToKnow = document.getElementById('niceToKnow');
    try { niceToKnow.open = localStorage.getItem('bt_ntk_aapen') === '1'; } catch (e) { /* ikke tilgjengelig */ }
    niceToKnow.addEventListener('toggle', function() {
        try { localStorage.setItem('bt_ntk_aapen', niceToKnow.open ? '1' : '0'); } catch (e) { /* ikke tilgjengelig */ }
    });
    document.getElementById('ntkRediger').addEventListener('click', function() { btSettNiceToKnowRedigering(true); });
    document.getElementById('ntkLagre').addEventListener('click', btLagreNiceToKnow);
    document.getElementById('ntkAvbryt').addEventListener('click', function() {
        var endret = document.getElementById('ntkTekst').value !== (btNiceToKnow.tekst || '');
        if (endret && !confirm('Forkaste endringene?')) return;
        btSettNiceToKnowRedigering(false);
    });
    btRenderNiceToKnow();

    // Ettersyn
    document.getElementById('newEttersynBtn').addEventListener('click', btNyttEttersyn);
    var ettersynPanel = document.getElementById('ettersynPanel');
    ettersynPanel.addEventListener('change', function(e) {
        if (!e.target.classList.contains('ettersyn-felt')) return;
        var endring = {};
        endring[e.target.getAttribute('data-felt')] = e.target.value;
        btOppdaterEttersyn(e.target.getAttribute('data-id'), endring);
    });
    ettersynPanel.addEventListener('click', function(e) {
        var knapp = e.target.closest('button');
        if (!knapp) return;
        var id = knapp.getAttribute('data-id');
        if (knapp.classList.contains('ettersyn-status-btn')) {
            btOppdaterEttersyn(id, { status: knapp.getAttribute('data-status') });
        } else if (knapp.classList.contains('ettersyn-fjern')) {
            var e2 = btEttersynListe.find(function(x) { return x.id === id; });
            var navn = e2 && e2.reg ? e2.reg + (e2.type ? ' – ' + e2.type : '') : 'dette ettersynet';
            if (!confirm('Fjerne ' + navn + ' fra lista? Sett heller status «Ferdig» hvis det er fullført.')) return;
            btSlett(BT_STATUS, id);
        }
    });

    // Rapport
    document.getElementById('btExportPdf').addEventListener('click', btGenererPdf);
    document.getElementById('btSendEmail').addEventListener('click', btSendEpost);

    // Sanntidsdata
    btLytt(BT_SAKER, function(liste) {
        btSaker = liste.map(btNormaliserSak);
        btRenderIssueBoard();
    }, 'issueBoard-' + BT_BASER[0]);
    btLytt(BT_STATUS, function(liste) {
        btBaseStatus = {};
        liste.forEach(function(d) {
            if (d.id.indexOf('base-') === 0) btBaseStatus[d.base || d.id.slice(5)] = d;
        });
        btEttersynListe = liste.filter(btErEttersyn).map(btUtenVenterPaaDeler);
        btNiceToKnow = liste.find(function(d) { return d.id === BT_NICE_TO_KNOW_ID; }) || {};
        // Mens noen redigerer, beholdes det de skriver; visningen oppdateres etterpå.
        if (!btRedigererNiceToKnow) btRenderNiceToKnow();
        btFyllBaseFelt();
        btRenderEttersyn();
    }, 'ettersynPanel');
    btFlyttReparasjoner();
    btLastRapporter();
});
