// ============================================
// BASETEKNIKER - LEVENDE STATUSTAVLE OG VAKTRAPPORT
// ============================================
// Basetekniker har ansvar for alle tre baser (BGO, TOS, HFT). Saker,
// større reparasjoner, tools-due og ettersyn lever videre mellom vakter og
// deles mellom teknikere. Vaktrapporten er et øyeblikksbilde ved vaktslutt.

const BT_BASER = ['BGO', 'TOS', 'HFT'];
const BT_HELIKOPTRE = ['LN-OXH', 'LN-OXI', 'LN-OXJ', 'LN-OXK'];
const BT_SAK_STATUSER = ['Åpen', 'Pågår', 'Venter på deler', 'Lukket'];
const BT_AAPNE_STATUSER = ['Åpen', 'Pågår', 'Venter på deler'];
const BT_PROSJEKT_STATUSER = ['Planlagt', 'Pågår', 'Venter på deler', 'Ferdig'];
const BT_ETTERSYN_STATUSER = ['Pågår', 'Venter på deler', 'Ferdig'];

// Firestore-samlinger. Uten Firebase brukes samme navn som nøkler i localStorage.
const BT_SAKER = 'bt_saker';
const BT_PROSJEKTER = 'bt_prosjekter';
const BT_TOOLS = 'bt_tools';
const BT_STATUS = 'bt_status';
const BT_RAPPORTER = 'bt_rapporter';

const BT_ETTERSYN_ID = 'ettersyn';
const BT_MLG_ID = 'oxi-mlg-repair';
const BT_TOOLS_VARSEL_DAGER = 30;

// Bibliotekene for filimport lastes først når noen faktisk drar inn en fil.
const BT_PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const BT_PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const BT_XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

// Basene het tidligere Bergen/Tromsø/Hammerfest på denne siden.
const BT_GAMLE_BASENAVN = { 'Bergen': 'BGO', 'Tromsø': 'TOS', 'Hammerfest': 'HFT' };

var btSaker = [];
var btProsjekter = [];
var btTools = [];
var btEttersyn = {};
var btRapporter = [];
var btRedigererSakId = null;
var btRedigererToolId = null;
var btImportRader = [];
var btImportFilnavn = '';
var btToolMelding = '';
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

function btLagreMange(samling, dokumenter, callback) {
    if (btHarSky()) {
        var db = window.firestoreDb;
        var ref = db.collection(samling);
        // Firestore tillater maks 500 skrivinger per batch.
        var biter = [];
        for (var i = 0; i < dokumenter.length; i += 400) biter.push(dokumenter.slice(i, i + 400));
        Promise.all(biter.map(function(bit) {
            var batch = db.batch();
            bit.forEach(function(dok) {
                var data = Object.assign({}, dok);
                var id = data.id;
                delete data.id;
                batch.set(id ? ref.doc(id) : ref.doc(), data);
            });
            return batch.commit();
        })).then(function() { if (callback) callback(); })
            .catch(function(err) {
                alert(btSkyFeil(err, 'Kunne ikke lagre'));
            });
        return;
    }

    var liste = btLesLokalt(samling, '[]');
    dokumenter.forEach(function(dok) {
        var data = Object.assign({}, dok);
        if (!data.id) data.id = btNyId();
        var index = liste.findIndex(function(x) { return x.id === data.id; });
        if (index === -1) {
            liste.unshift(data);
        } else {
            liste[index] = data;
        }
    });
    btSkrivLokalt(samling, liste);
    btVarsleLokalt(samling, liste);
    if (callback) callback();
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
        case 'Venter på deler': return 'waiting';
        case 'Lukket':
        case 'Ferdig': return 'closed';
        case 'Planlagt': return 'planned';
        default: return 'neutral';
    }
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

// Eldre saker brukte GSE og fulle basenavn.
function btNormaliserSak(sak) {
    if (sak.kategori === 'GSE/verktøy') sak.kategori = 'Tools/kalibrering';
    if (sak.omraade === 'GSE/verktøy') sak.omraade = 'Tools';
    sak.base = btNormaliserBase(sak.base);
    return sak;
}

function btErAapen(sak) {
    return BT_AAPNE_STATUSER.indexOf(sak.status) !== -1;
}

function btSynligeSaker() {
    var visLukkede = document.getElementById('filterShowClosed').checked;
    var base = document.getElementById('filterBase').value;
    var kategori = document.getElementById('filterKategori').value;

    return btSaker.filter(function(sak) {
        if (!visLukkede && sak.status === 'Lukket') return false;
        if (base && sak.base !== base) return false;
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
                '<span class="issue-chip issue-chip-base">' + escapeHtml(sak.base || '-') + '</span>' +
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
    var board = document.getElementById('issueBoard');
    if (!board) return;

    btRenderSakOppsummering();
    btOppdaterLiveBadge();

    var saker = btSorterSaker(btSynligeSaker());
    if (saker.length === 0) {
        board.innerHTML = '<p class="no-reports">Ingen saker som matcher filteret. Trykk «Ny sak» for å legge til.</p>';
        return;
    }

    // Med «Alle baser» grupperes sakene per base, så hver base kan følges opp for seg.
    var valgtBase = document.getElementById('filterBase').value;
    var html = '';
    if (valgtBase) {
        html = saker.map(btSakKortHtml).join('');
    } else {
        BT_BASER.forEach(function(base) {
            var gruppe = saker.filter(function(s) { return s.base === base; });
            if (gruppe.length === 0) return;
            html += '<h3 class="report-group-title">' + base + ' (' + gruppe.length + ')</h3>' +
                gruppe.map(btSakKortHtml).join('');
        });
        var utenBase = saker.filter(function(s) { return BT_BASER.indexOf(s.base) === -1; });
        if (utenBase.length) {
            html += '<h3 class="report-group-title">Uten base (' + utenBase.length + ')</h3>' +
                utenBase.map(btSakKortHtml).join('');
        }
    }
    board.innerHTML = html;

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
}

function btRenderSakOppsummering() {
    var div = document.getElementById('issueBaseSummary');
    if (!div) return;
    var valgt = document.getElementById('filterBase').value;

    div.innerHTML = BT_BASER.map(function(base) {
        var aapne = btSaker.filter(function(s) { return s.base === base && btErAapen(s); });
        var hoy = aapne.filter(function(s) { return s.prioritet === 'Høy'; }).length;
        var venter = aapne.filter(function(s) { return s.status === 'Venter på deler'; }).length;
        var under = [hoy ? hoy + ' høy prioritet' : 'Ingen høy prioritet'];
        if (venter) under.push(venter + ' venter på deler');

        return '<button type="button" class="base-tile' + (valgt === base ? ' is-active' : '') +
            (hoy ? ' tone-bad' : '') + '" data-base="' + base + '">' +
            '<span class="base-tile-code">' + base + '</span>' +
            '<span class="base-tile-main">' + (aapne.length === 1 ? '1 åpen sak' : aapne.length + ' åpne saker') + '</span>' +
            '<span class="base-tile-sub">' + escapeHtml(under.join(' · ')) + '</span>' +
        '</button>';
    }).join('');

    div.querySelectorAll('.base-tile').forEach(function(tile) {
        tile.addEventListener('click', function() {
            var filter = document.getElementById('filterBase');
            var base = this.getAttribute('data-base');
            filter.value = filter.value === base ? '' : base;
            btRenderIssueBoard();
        });
    });
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

    // Ny sak: foreslå ansvarlig bare når én tekniker er på jobb.
    var paaJobb = document.getElementById('btTekniker').value.split(',')
        .map(function(n) { return n.trim(); }).filter(Boolean);
    document.getElementById('issueAnsvarlig').value = sak
        ? (sak.ansvarlig || '')
        : (paaJobb.length === 1 ? paaJobb[0] : '');

    // Ny sak: bruk basen det filtreres på, ellers den som ble brukt sist.
    var standardBase = document.getElementById('filterBase').value ||
        localStorage.getItem('bt_sist_base') || BT_BASER[0];
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
// STØRRE REPARASJONER
// ============================================

function btStandardProsjekt(tittel, maskin) {
    var naa = btNaa();
    return {
        tittel: tittel,
        maskin: maskin || '',
        base: '',
        status: 'Planlagt',
        ansvarlig: '',
        planlagtStart: '',
        forventetFerdig: '',
        delpunkter: [],
        merknad: '',
        slettet: false,
        opprettet: naa,
        oppdatert: naa
    };
}

// LN-OXI MLG repair skal alltid finnes på tavlen. Prosjekter slettes aldri
// fysisk (bare merkes), så den opprettes bare én gang.
function btSikreMlgProsjekt() {
    var standard = btStandardProsjekt('LN-OXI MLG repair', 'LN-OXI');
    if (btHarSky()) {
        var ref = window.firestoreDb.collection(BT_PROSJEKTER).doc(BT_MLG_ID);
        // Spør serveren direkte, så en tom lokal cache aldri overskriver lagret arbeid.
        ref.get({ source: 'server' })
            .then(function(doc) { if (!doc.exists) return ref.set(standard); })
            .catch(function(err) { btSkyFeil(err, 'Kunne ikke sjekke MLG-reparasjonen'); });
        return;
    }
    var liste = btLesLokalt(BT_PROSJEKTER, '[]');
    if (!liste.some(function(p) { return p.id === BT_MLG_ID; })) {
        standard.id = BT_MLG_ID;
        btLagre(BT_PROSJEKTER, standard);
    }
}

function btSynligeProsjekter() {
    var visFerdige = document.getElementById('filterShowDoneProjects').checked;
    return btProsjekter
        .filter(function(p) { return !p.slettet && (visFerdige || p.status !== 'Ferdig'); })
        .sort(function(a, b) { return new Date(a.opprettet || 0) - new Date(b.opprettet || 0); });
}

function btProsjektKortHtml(p) {
    var id = escapeHtml(p.id);
    var delpunkter = p.delpunkter || [];
    var ferdige = delpunkter.filter(function(d) { return d.ferdig; }).length;
    var prosent = delpunkter.length ? Math.round(ferdige / delpunkter.length * 100) : 0;
    var tone = p.status === 'Ferdig' ? 'tone-ok' : (p.status === 'Venter på deler' ? 'tone-warn' : 'tone-info');

    var statusKnapper = BT_PROSJEKT_STATUSER.map(function(s) {
        return '<button type="button" class="issue-status-btn issue-status-' + btStatusKlasse(s) +
            (s === p.status ? ' is-active' : '') + ' prosjekt-status-btn" data-id="' + id +
            '" data-status="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
    }).join('');

    var dagerTilFerdig = p.forventetFerdig && p.status !== 'Ferdig'
        ? btDagerMellom(btIDag(), p.forventetFerdig) : null;
    var fristTekst = dagerTilFerdig === null ? '' : (dagerTilFerdig >= 0
        ? dagerTilFerdig + ' dager til forventet ferdig'
        : Math.abs(dagerTilFerdig) + ' dager over forventet ferdig');

    var punktHtml = delpunkter.map(function(d, i) {
        return '<div class="delpunkt-item' + (d.ferdig ? ' is-done' : '') + '">' +
            '<label><input type="checkbox" class="delpunkt-check" data-id="' + id + '" data-index="' + i + '"' +
            (d.ferdig ? ' checked' : '') + '><span>' + escapeHtml(d.tekst) + '</span></label>' +
            '<button type="button" class="remove-person-btn delpunkt-fjern" data-id="' + id +
            '" data-index="' + i + '" aria-label="Fjern delpunkt">×</button>' +
        '</div>';
    }).join('');

    return '<div class="bt-card ' + tone + '">' +
        '<div class="bt-card-head">' +
            '<input type="text" class="bt-title-input prosjekt-felt" data-id="' + id + '" data-felt="tittel"' +
                ' data-fokus="prosjekt:' + id + ':tittel" value="' + escapeHtml(p.tittel || '') + '" aria-label="Navn på reparasjon">' +
            '<div class="issue-status-group">' + statusKnapper + '</div>' +
        '</div>' +
        '<div class="bt-field-grid">' +
            '<label>Maskin<select class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="maskin" data-fokus="prosjekt:' + id + ':maskin">' +
                btMaskinValg(p.maskin, '–') + '</select></label>' +
            '<label>Base<select class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="base" data-fokus="prosjekt:' + id + ':base">' +
                btBaseValg(p.base, '–') + '</select></label>' +
            '<label>Ansvarlig<input type="text" class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="ansvarlig"' +
                ' data-fokus="prosjekt:' + id + ':ansvarlig" value="' + escapeHtml(p.ansvarlig || '') + '" placeholder="Navn"></label>' +
            '<label>Planlagt start<input type="date" class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="planlagtStart"' +
                ' data-fokus="prosjekt:' + id + ':planlagtStart" value="' + escapeHtml(p.planlagtStart || '') + '"></label>' +
            '<label>Forventet ferdig<input type="date" class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="forventetFerdig"' +
                ' data-fokus="prosjekt:' + id + ':forventetFerdig" value="' + escapeHtml(p.forventetFerdig || '') + '"></label>' +
        '</div>' +
        '<div class="progress-row">' +
            '<div class="progress-bar"><div class="progress-fill" style="width: ' + prosent + '%"></div></div>' +
            '<span class="progress-text">' + ferdige + ' av ' + delpunkter.length + ' delpunkter ferdig</span>' +
        '</div>' +
        '<div class="delpunkt-list">' + punktHtml + '</div>' +
        '<div class="delpunkt-add">' +
            '<input type="text" class="bt-input delpunkt-ny" data-id="' + id + '" data-fokus="prosjekt:' + id + ':nyttpunkt"' +
                ' placeholder="Nytt delpunkt, f.eks. «Bestille MLG-deler»">' +
            '<button type="button" class="btn-small btn-view delpunkt-legg-til" data-id="' + id + '">Legg til</button>' +
        '</div>' +
        '<label class="bt-textarea-label">Merknad / fremdrift' +
            '<textarea class="bt-input prosjekt-felt" data-id="' + id + '" data-felt="merknad"' +
            ' data-fokus="prosjekt:' + id + ':merknad" placeholder="Status, deler, avtaler med CAMO osv.">' +
            escapeHtml(p.merknad || '') + '</textarea></label>' +
        '<div class="bt-card-meta">' +
            (fristTekst ? '<span class="' + (dagerTilFerdig < 0 ? 'text-bad' : '') + '">' + fristTekst + '</span> · ' : '') +
            (p.oppdatert ? 'Sist oppdatert ' + escapeHtml(btFormatTidspunkt(p.oppdatert)) + ' · ' : '') +
            '<button type="button" class="link-button prosjekt-fjern" data-id="' + id + '">Fjern reparasjon</button>' +
        '</div>' +
    '</div>';
}

function btRenderProsjekter() {
    var board = document.getElementById('projectBoard');
    if (!board) return;

    var prosjekter = btSynligeProsjekter();
    var html = prosjekter.length
        ? prosjekter.map(btProsjektKortHtml).join('')
        : '<p class="no-reports">Ingen aktive reparasjoner.</p>';

    btRenderBevarFokus(board, html, function() {
        board.querySelectorAll('.prosjekt-felt').forEach(function(felt) {
            felt.addEventListener('change', function() {
                var endring = {};
                endring[this.getAttribute('data-felt')] = this.value;
                btOppdaterProsjekt(this.getAttribute('data-id'), endring);
            });
        });
        board.querySelectorAll('.prosjekt-status-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btOppdaterProsjekt(this.getAttribute('data-id'), { status: this.getAttribute('data-status') });
            });
        });
        board.querySelectorAll('.delpunkt-check').forEach(function(boks) {
            boks.addEventListener('change', function() {
                btEndreDelpunkt(this.getAttribute('data-id'), parseInt(this.getAttribute('data-index'), 10), this.checked);
            });
        });
        board.querySelectorAll('.delpunkt-fjern').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btFjernDelpunkt(this.getAttribute('data-id'), parseInt(this.getAttribute('data-index'), 10));
            });
        });
        board.querySelectorAll('.delpunkt-ny').forEach(function(felt) {
            felt.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btLeggTilDelpunkt(this.getAttribute('data-id'), this);
                }
            });
        });
        board.querySelectorAll('.delpunkt-legg-til').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.getAttribute('data-id');
                var felt = board.querySelector('.delpunkt-ny[data-id="' + CSS.escape(id) + '"]');
                btLeggTilDelpunkt(id, felt);
            });
        });
        board.querySelectorAll('.prosjekt-fjern').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var p = btProsjekter.find(function(x) { return x.id === btn.getAttribute('data-id'); });
                if (!p) return;
                if (!confirm('Fjerne «' + (p.tittel || 'reparasjonen') + '» fra tavlen? Sett heller status «Ferdig» hvis den er fullført.')) return;
                btOppdaterProsjekt(p.id, { slettet: true });
            });
        });
    });
}

function btOppdaterProsjekt(id, endring) {
    var p = btProsjekter.find(function(x) { return x.id === id; });
    if (!p) return;
    var oppdatert = Object.assign({}, p, endring, { oppdatert: btNaa() });
    btLagre(BT_PROSJEKTER, oppdatert);
}

function btLeggTilDelpunkt(id, felt) {
    var tekst = felt ? felt.value.trim() : '';
    if (!tekst) return;
    var p = btProsjekter.find(function(x) { return x.id === id; });
    if (!p) return;
    felt.value = '';
    btOppdaterProsjekt(id, { delpunkter: (p.delpunkter || []).concat([{ tekst: tekst, ferdig: false }]) });
}

function btEndreDelpunkt(id, index, ferdig) {
    var p = btProsjekter.find(function(x) { return x.id === id; });
    if (!p || !p.delpunkter || !p.delpunkter[index]) return;
    var punkter = p.delpunkter.map(function(d, i) {
        return i === index ? { tekst: d.tekst, ferdig: ferdig } : d;
    });
    btOppdaterProsjekt(id, { delpunkter: punkter });
}

function btFjernDelpunkt(id, index) {
    var p = btProsjekter.find(function(x) { return x.id === id; });
    if (!p || !p.delpunkter) return;
    btOppdaterProsjekt(id, { delpunkter: p.delpunkter.filter(function(d, i) { return i !== index; }) });
}

function btNyttProsjekt() {
    var tittel = prompt('Navn på reparasjonen:', '');
    if (!tittel || !tittel.trim()) return;
    btLagre(BT_PROSJEKTER, btStandardProsjekt(tittel.trim(), ''));
}

// ============================================
// TOOLS - NESTE DUE
// ============================================

function btToolDager(tool, fraDato) {
    return btDagerMellom(fraDato || btIDag(), tool.nesteDue);
}

function btToolTone(dager) {
    if (dager === null) return 'tone-neutral';
    if (dager < 0) return 'tone-bad';
    if (dager <= BT_TOOLS_VARSEL_DAGER) return 'tone-warn';
    return 'tone-ok';
}

function btToolDagerTekst(dager) {
    if (dager === null) return 'Ingen dato';
    if (dager < 0) return 'Forfalt ' + Math.abs(dager) + ' d';
    if (dager === 0) return 'Due i dag';
    return dager + ' d';
}

function btSorterTools(tools) {
    return tools.slice().sort(function(a, b) {
        return (a.nesteDue || '9999').localeCompare(b.nesteDue || '9999');
    });
}

// Oppsummering per base: antall forfalt, antall snart due og nærmeste due-dato.
function btToolStatusPerBase(fraDato) {
    return BT_BASER.map(function(base) {
        var tools = btTools.filter(function(t) { return t.base === base; });
        var forfalt = tools.filter(function(t) { var d = btToolDager(t, fraDato); return d !== null && d < 0; });
        var snart = tools.filter(function(t) {
            var d = btToolDager(t, fraDato);
            return d !== null && d >= 0 && d <= BT_TOOLS_VARSEL_DAGER;
        });
        var kommende = btSorterTools(tools.filter(function(t) {
            var d = btToolDager(t, fraDato);
            return d !== null && d >= 0;
        }));
        return {
            base: base,
            antall: tools.length,
            forfalt: forfalt.length,
            snart: snart.length,
            neste: kommende.length ? { beskrivelse: kommende[0].beskrivelse, nesteDue: kommende[0].nesteDue } : null
        };
    });
}

function btRenderTools() {
    btRenderToolOppsummering();

    var liste = document.getElementById('toolList');
    if (!liste) return;
    var base = document.getElementById('toolFilterBase').value;
    var periode = document.getElementById('toolFilterPeriode').value;

    var iBase = btTools.filter(function(t) { return !base || t.base === base; });
    var synlige = btSorterTools(iBase.filter(function(t) {
        if (!periode) return true;
        var d = btToolDager(t);
        return d !== null && d <= parseInt(periode, 10);
    }));

    var teller = btTools.length ? 'Viser ' + synlige.length + ' av ' + iBase.length + ' tools' : '';
    document.getElementById('toolCount').textContent =
        [btToolMelding, teller].filter(Boolean).join(' · ');

    if (btTools.length === 0) {
        liste.innerHTML = '<p class="no-reports">Ingen tools registrert. Dra inn en due-rapport over, eller legg til manuelt.</p>';
        return;
    }
    if (synlige.length === 0) {
        liste.innerHTML = '<p class="no-reports">Ingen tools forfaller i denne perioden. Velg «Alle tools» for å se hele lista.</p>';
        return;
    }

    liste.innerHTML = synlige.map(function(t) {
        var dager = btToolDager(t);
        return '<div class="tool-item ' + btToolTone(dager) + '">' +
            '<span class="tool-days">' + escapeHtml(btToolDagerTekst(dager)) + '</span>' +
            '<div class="tool-main">' +
                '<span class="tool-name">' + escapeHtml(t.beskrivelse || '-') + '</span>' +
                '<span class="tool-meta">' +
                    '<span class="issue-chip issue-chip-base">' + escapeHtml(t.base || '-') + '</span> ' +
                    'Due ' + escapeHtml(btKortDato(t.nesteDue)) +
                    (t.kilde ? ' · fra ' + escapeHtml(t.kilde) : '') +
                '</span>' +
            '</div>' +
            '<button type="button" class="btn-small btn-view tool-edit-btn" data-id="' + escapeHtml(t.id) + '">Endre</button>' +
        '</div>';
    }).join('');

    liste.querySelectorAll('.tool-edit-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { btAapneToolModal(this.getAttribute('data-id')); });
    });
}

function btRenderToolOppsummering() {
    var div = document.getElementById('toolBaseSummary');
    if (!div) return;
    var valgt = document.getElementById('toolFilterBase').value;

    div.innerHTML = btToolStatusPerBase().map(function(s) {
        var tone = s.forfalt ? ' tone-bad' : (s.snart ? ' tone-warn' : '');
        var hoved = s.antall === 0 ? 'Ingen tools registrert'
            : (s.neste ? 'Neste due ' + btKortDato(s.neste.nesteDue) : 'Ingen kommende due');
        var under = s.antall === 0 ? '' : [
            s.forfalt ? s.forfalt + ' forfalt' : null,
            s.snart ? s.snart + ' innen ' + BT_TOOLS_VARSEL_DAGER + ' d' : null,
            s.neste ? s.neste.beskrivelse : null
        ].filter(Boolean).join(' · ');

        return '<button type="button" class="base-tile' + (valgt === s.base ? ' is-active' : '') + tone +
            '" data-base="' + s.base + '">' +
            '<span class="base-tile-code">' + s.base + '</span>' +
            '<span class="base-tile-main">' + escapeHtml(hoved) + '</span>' +
            '<span class="base-tile-sub">' + escapeHtml(under) + '</span>' +
        '</button>';
    }).join('');

    div.querySelectorAll('.base-tile').forEach(function(tile) {
        tile.addEventListener('click', function() {
            var filter = document.getElementById('toolFilterBase');
            var base = this.getAttribute('data-base');
            filter.value = filter.value === base ? '' : base;
            btRenderTools();
        });
    });
}

function btAapneToolModal(id) {
    btRedigererToolId = id || null;
    var tool = id ? btTools.find(function(t) { return t.id === id; }) : null;
    document.getElementById('toolModalTitle').textContent = tool ? 'Endre tool' : 'Legg til tool';
    document.getElementById('toolBeskrivelse').value = tool ? (tool.beskrivelse || '') : '';
    document.getElementById('toolBase').value = tool ? (tool.base || BT_BASER[0])
        : (document.getElementById('toolFilterBase').value || BT_BASER[0]);
    document.getElementById('toolDue').value = tool ? (tool.nesteDue || '') : '';
    document.getElementById('toolDeleteBtn').style.display = tool ? '' : 'none';
    document.getElementById('toolModal').style.display = 'flex';
    document.getElementById('toolBeskrivelse').focus();
}

function btLukkToolModal() {
    document.getElementById('toolModal').style.display = 'none';
    btRedigererToolId = null;
}

function btLagreTool() {
    var beskrivelse = document.getElementById('toolBeskrivelse').value.trim();
    var due = document.getElementById('toolDue').value;
    if (!beskrivelse) { alert('Skriv inn hvilket tool det gjelder.'); return; }
    if (!due) { alert('Velg neste due-dato.'); return; }

    var eksisterende = btRedigererToolId
        ? btTools.find(function(t) { return t.id === btRedigererToolId; }) : null;
    btLagre(BT_TOOLS, Object.assign({}, eksisterende || { opprettet: btNaa(), kilde: 'Manuelt' }, {
        id: btRedigererToolId || undefined,
        beskrivelse: beskrivelse,
        base: document.getElementById('toolBase').value,
        nesteDue: due,
        oppdatert: btNaa()
    }), btLukkToolModal);
}

// ============================================
// IMPORT AV DUE-RAPPORT
// ============================================
// Leser teksten ut av fila direkte i nettleseren, uten AI og uten at fila
// sendes noe sted. Hver linje med en dato blir en kandidat, og den seneste
// datoen på linja brukes som neste due (rapporter har gjerne både «siste
// kalibrering» og «neste due»). Brukeren godkjenner alt før det lagres.

var btSkriptLaster = {};

function btLastSkript(url) {
    if (!btSkriptLaster[url]) {
        btSkriptLaster[url] = new Promise(function(resolve, reject) {
            var s = document.createElement('script');
            s.src = url;
            s.onload = resolve;
            s.onerror = function() {
                delete btSkriptLaster[url];
                reject(new Error('Kunne ikke laste ' + url));
            };
            document.head.appendChild(s);
        });
    }
    return btSkriptLaster[url];
}

function btLesPdf(fil) {
    return btLastSkript(BT_PDFJS_URL).then(function() {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = BT_PDFJS_WORKER_URL;
        return fil.arrayBuffer();
    }).then(function(buffer) {
        return window.pdfjsLib.getDocument({ data: buffer }).promise;
    }).then(function(pdf) {
        var sider = [];
        for (var i = 1; i <= pdf.numPages; i++) {
            sider.push(pdf.getPage(i).then(function(side) { return side.getTextContent(); }));
        }
        return Promise.all(sider);
    }).then(function(innhold) {
        // PDF-tekst kommer som løse biter; biter på samme høyde settes sammen til en linje.
        var linjer = [];
        innhold.forEach(function(tekst) {
            var rader = [];
            tekst.items.forEach(function(item) {
                if (!item.str || !item.str.trim()) return;
                var x = item.transform[4];
                var y = item.transform[5];
                var rad = rader.find(function(r) { return Math.abs(r.y - y) < 3; });
                if (!rad) {
                    rad = { y: y, deler: [] };
                    rader.push(rad);
                }
                rad.deler.push({ x: x, tekst: item.str });
            });
            rader.sort(function(a, b) { return b.y - a.y; });
            rader.forEach(function(rad) {
                linjer.push(rad.deler.sort(function(a, b) { return a.x - b.x; })
                    .map(function(d) { return d.tekst; }).join('  '));
            });
        });
        return linjer;
    });
}

function btLesRegneark(fil) {
    return btLastSkript(BT_XLSX_URL).then(function() {
        return fil.arrayBuffer();
    }).then(function(buffer) {
        var bok = XLSX.read(buffer, { type: 'array', cellNF: true });
        var linjer = [];
        bok.SheetNames.forEach(function(navn) {
            var ark = bok.Sheets[navn];
            if (!ark['!ref']) return;
            var omraade = XLSX.utils.decode_range(ark['!ref']);
            for (var r = omraade.s.r; r <= omraade.e.r; r++) {
                var celler = [];
                for (var c = omraade.s.c; c <= omraade.e.c; c++) {
                    var celle = ark[XLSX.utils.encode_cell({ r: r, c: c })];
                    if (!celle) continue;
                    // Datoceller leses fra serienummeret, så formatet i fila ikke kan feiltolkes.
                    if (celle.t === 'n' && celle.z && XLSX.SSF.is_date(celle.z)) {
                        var d = XLSX.SSF.parse_date_code(celle.v);
                        celler.push(d.y + '-' + String(d.m).padStart(2, '0') + '-' + String(d.d).padStart(2, '0'));
                    } else {
                        celler.push(String(celle.w !== undefined ? celle.w : celle.v));
                    }
                }
                if (celler.length) linjer.push(celler.join('  '));
            }
        });
        return linjer;
    });
}

function btLesFil(fil) {
    var navn = (fil.name || '').toLowerCase();
    if (navn.endsWith('.pdf') || fil.type === 'application/pdf') return btLesPdf(fil);
    if (/\.(xlsx|xls|xlsm|ods)$/.test(navn)) return btLesRegneark(fil);
    return fil.text().then(function(tekst) {
        return tekst.split(/\r?\n/).map(function(l) { return l.replace(/[;\t,]+/g, '  '); });
    });
}

const BT_MAANEDER = {
    jan: 1, feb: 2, mar: 3, apr: 4, mai: 5, may: 5, jun: 6, jul: 7,
    aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12
};

function btAar(tekst) {
    return tekst.length === 2 ? 2000 + parseInt(tekst, 10) : parseInt(tekst, 10);
}

function btGyldigIso(aar, mnd, dag) {
    if (!(aar >= 2000 && aar <= 2100) || !(mnd >= 1 && mnd <= 12) || !(dag >= 1 && dag <= 31)) return null;
    var d = new Date(Date.UTC(aar, mnd - 1, dag));
    if (d.getUTCMonth() !== mnd - 1 || d.getUTCDate() !== dag) return null;
    return aar + '-' + String(mnd).padStart(2, '0') + '-' + String(dag).padStart(2, '0');
}

// Finner datoer i en tekstlinje. Norsk rekkefølge (dag før måned) antas,
// men 03/25/2027 tolkes som amerikansk fordi 25 ikke kan være en måned.
function btFinnDatoer(tekst) {
    var funn = [];
    var monstre = [
        { re: /\b(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})\b/g,
          del: function(m) { return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]; } },
        { re: /\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4}|\d{2})\b/g,
          del: function(m) {
              var dag = parseInt(m[1], 10);
              var mnd = parseInt(m[2], 10);
              if (mnd > 12 && dag <= 12) { var t = dag; dag = mnd; mnd = t; }
              return [btAar(m[3]), mnd, dag];
          } },
        { re: /\b(\d{1,2})[\s.\-\/]*(jan|feb|mar|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|des|dec)[a-zæøå]*\.?[\s.\-\/]*(\d{4}|\d{2})\b/gi,
          del: function(m) { return [btAar(m[3]), BT_MAANEDER[m[2].toLowerCase()], parseInt(m[1], 10)]; } }
    ];
    monstre.forEach(function(monster) {
        var treff;
        monster.re.lastIndex = 0;
        while ((treff = monster.re.exec(tekst)) !== null) {
            var start = treff.index;
            var slutt = start + treff[0].length;
            if (funn.some(function(f) { return start < f.slutt && slutt > f.start; })) continue;
            var deler = monster.del(treff);
            var iso = btGyldigIso(deler[0], deler[1], deler[2]);
            if (iso) funn.push({ start: start, slutt: slutt, iso: iso });
        }
    });
    return funn;
}

function btFinnBaseITekst(tekst) {
    if (/\bBGO\b/.test(tekst) || /bergen|flesland/i.test(tekst)) return 'BGO';
    if (/\bTOS\b/.test(tekst) || /troms[øo]/i.test(tekst)) return 'TOS';
    if (/\bHFT\b/.test(tekst) || /hammerfest/i.test(tekst)) return 'HFT';
    return '';
}

function btToolNokkel(beskrivelse, base) {
    return (beskrivelse || '').toLowerCase().replace(/\s+/g, ' ').trim() + '|' + (base || '');
}

function btFinnTool(beskrivelse, base) {
    var nokkel = btToolNokkel(beskrivelse, base);
    return btTools.find(function(t) { return btToolNokkel(t.beskrivelse, t.base) === nokkel; }) || null;
}

function btTolkLinjer(linjer) {
    var rader = [];
    linjer.forEach(function(linje) {
        if (!linje || !linje.trim()) return;
        var datoer = btFinnDatoer(linje);
        if (datoer.length === 0) return;

        var due = datoer.reduce(function(maks, d) { return d.iso > maks ? d.iso : maks; }, datoer[0].iso);

        // Beskrivelsen er linja uten datoer og basekoder.
        var beskrivelse = linje;
        datoer.slice().sort(function(a, b) { return b.start - a.start; }).forEach(function(d) {
            beskrivelse = beskrivelse.slice(0, d.start) + ' ' + beskrivelse.slice(d.slutt);
        });
        // \b fungerer ikke med æøå i JavaScript, så bokstavgrensene skrives ut.
        beskrivelse = beskrivelse
            .replace(/\b(BGO|TOS|HFT)\b/g, ' ')
            .replace(/(^|[^a-zæøå])(bergen|flesland|tromsø|tromso|hammerfest)(?![a-zæøå])/gi, '$1 ')
            .replace(/[|;\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .replace(/^[\s,.:\-–]+|[\s,.:\-–]+$/g, '')
            .trim();
        if (beskrivelse.length < 3 || !/[a-zæøå]/i.test(beskrivelse)) return;

        // Linjer som ligner topptekst/bunntekst foreslås ikke importert.
        var mistenkelig = /(generert|generated|printed|utskrevet|utskrift|^\s*(dato|date)\s*:|\bpage\s+\d|\bside\s+\d+\s+(av|of)\b)/i.test(linje);

        rader.push({ beskrivelse: beskrivelse, base: btFinnBaseITekst(linje), due: due, valgt: !mistenkelig });
    });

    // Samme tool flere ganger i fila: behold seneste due.
    var unike = {};
    rader.forEach(function(r) {
        var nokkel = btToolNokkel(r.beskrivelse, r.base);
        if (!unike[nokkel] || r.due > unike[nokkel].due) unike[nokkel] = r;
    });
    return Object.keys(unike).map(function(k) { return unike[k]; });
}

function btHaandterFil(fil) {
    if (!fil) return;
    var sone = document.getElementById('toolDropZone');
    var originalTekst = sone.innerHTML;
    sone.classList.add('is-loading');
    sone.innerHTML = '<p>Leser ' + escapeHtml(fil.name) + '...</p>';

    btLesFil(fil).then(function(linjer) {
        var rader = btTolkLinjer(linjer);
        if (rader.length === 0) {
            alert('Fant ingen datoer i «' + fil.name + '».\n\nEr PDF-en skannet (et bilde av papir)? ' +
                'Da finnes det ingen tekst å lese, og den må leses med OCR eller AI i stedet.');
            return;
        }
        btImportFilnavn = fil.name;
        btImportRader = rader;
        btAapneImportModal();
    }).catch(function(err) {
        console.error('Import feilet:', err);
        alert('Kunne ikke lese fila. Sjekk at det er en PDF, Excel- eller CSV-fil, og at du er på nett.');
    }).then(function() {
        sone.classList.remove('is-loading');
        sone.innerHTML = originalTekst;
    });
}

function btAapneImportModal() {
    var utenBase = btImportRader.filter(function(r) { return !r.base; }).length;
    document.getElementById('importInfo').textContent =
        'Fant ' + btImportRader.length + ' linjer med dato i «' + btImportFilnavn + '». ' +
        'Den seneste datoen på hver linje er brukt som neste due. Sjekk og rett før du importerer.' +
        (utenBase ? ' ' + utenBase + ' linjer mangler base – velg standard base under, eller per linje.' : '');
    document.getElementById('importStandardBase').value = document.getElementById('toolFilterBase').value || '';
    btRenderImportRader();
    document.getElementById('importModal').style.display = 'flex';
}

function btLukkImportModal() {
    document.getElementById('importModal').style.display = 'none';
    btImportRader = [];
}

function btRenderImportRader() {
    var div = document.getElementById('importRows');
    var standardBase = document.getElementById('importStandardBase').value;

    var html = '<div class="import-row import-row-head"><span></span><span>Tool</span><span>Base</span><span>Neste due</span><span>Endring</span></div>' +
        btImportRader.map(function(r, i) {
            var base = r.base || standardBase;
            var eksisterende = base ? btFinnTool(r.beskrivelse, base) : null;
            var endring = !base ? 'Mangler base'
                : (!eksisterende ? 'Ny'
                    : (eksisterende.nesteDue === r.due ? 'Uendret' : 'Fra ' + btKortDato(eksisterende.nesteDue)));
            var endringKlasse = !base ? 'text-bad' : (eksisterende && eksisterende.nesteDue === r.due ? 'text-muted' : '');

            return '<div class="import-row' + (r.valgt ? '' : ' is-unselected') + '">' +
                '<input type="checkbox" class="import-valgt" data-index="' + i + '"' + (r.valgt ? ' checked' : '') + ' aria-label="Importer linje">' +
                '<input type="text" class="bt-input import-beskrivelse" data-index="' + i + '" data-fokus="import:' + i + ':beskrivelse" value="' + escapeHtml(r.beskrivelse) + '">' +
                '<select class="bt-input import-base" data-index="' + i + '" data-fokus="import:' + i + ':base">' +
                    btBaseValg(r.base, standardBase ? 'Standard (' + standardBase + ')' : 'Velg...') + '</select>' +
                '<input type="date" class="bt-input import-due" data-index="' + i + '" data-fokus="import:' + i + ':due" value="' + escapeHtml(r.due) + '">' +
                '<span class="import-endring ' + endringKlasse + '">' + escapeHtml(endring) + '</span>' +
            '</div>';
        }).join('');

    // Tegnes på nytt etter fokusbyttet, så et klikk i neste felt ikke går tapt.
    function senere() { setTimeout(btRenderImportRader, 0); }

    btRenderBevarFokus(div, html, function() {
        div.querySelectorAll('.import-valgt').forEach(function(boks) {
            boks.addEventListener('change', function() {
                btImportRader[parseInt(this.getAttribute('data-index'), 10)].valgt = this.checked;
                senere();
            });
        });
        div.querySelectorAll('.import-beskrivelse').forEach(function(felt) {
            felt.addEventListener('input', function() {
                btImportRader[parseInt(this.getAttribute('data-index'), 10)].beskrivelse = this.value;
            });
            felt.addEventListener('change', senere);
        });
        div.querySelectorAll('.import-base').forEach(function(felt) {
            felt.addEventListener('change', function() {
                btImportRader[parseInt(this.getAttribute('data-index'), 10)].base = this.value;
                senere();
            });
        });
        div.querySelectorAll('.import-due').forEach(function(felt) {
            felt.addEventListener('change', function() {
                btImportRader[parseInt(this.getAttribute('data-index'), 10)].due = this.value;
                senere();
            });
        });
    });

    var valgte = btImportRader.filter(function(r) { return r.valgt; }).length;
    document.getElementById('importSaveBtn').textContent = 'Importer valgte (' + valgte + ')';
    document.getElementById('importVelgAlle').checked = valgte === btImportRader.length;
}

function btImporterValgte() {
    var standardBase = document.getElementById('importStandardBase').value;
    var valgte = btImportRader.filter(function(r) { return r.valgt; });
    if (valgte.length === 0) { alert('Ingen linjer er valgt.'); return; }

    var utenBase = valgte.filter(function(r) { return !(r.base || standardBase); }).length;
    if (utenBase) {
        alert(utenBase + ' valgte linjer mangler base. Velg «Base for rader uten base», eller base per linje.');
        return;
    }
    var utenDato = valgte.filter(function(r) { return !r.due || !r.beskrivelse.trim(); }).length;
    if (utenDato) {
        alert(utenDato + ' valgte linjer mangler tool-navn eller dato.');
        return;
    }

    var naa = btNaa();
    var dokumenter = valgte.map(function(r) {
        var base = r.base || standardBase;
        var eksisterende = btFinnTool(r.beskrivelse, base);
        return Object.assign({}, eksisterende || { opprettet: naa }, {
            id: eksisterende ? eksisterende.id : undefined,
            beskrivelse: r.beskrivelse.trim(),
            base: base,
            nesteDue: r.due,
            kilde: btImportFilnavn,
            oppdatert: naa
        });
    });

    var antall = dokumenter.length;
    btLagreMange(BT_TOOLS, dokumenter, function() {
        btLukkImportModal();
        btToolMelding = 'Importerte ' + antall + ' tools fra ' + btImportFilnavn;
        btRenderTools();
        setTimeout(function() {
            btToolMelding = '';
            btRenderTools();
        }, 10000);
    });
}

// ============================================
// ETTERSYN
// ============================================

function btLagreEttersyn(endring) {
    btLagre(BT_STATUS, Object.assign({}, btEttersyn, endring, { id: BT_ETTERSYN_ID, oppdatert: btNaa() }));
}

function btRenderEttersyn() {
    var panel = document.getElementById('ettersynPanel');
    if (!panel) return;
    var e = btEttersyn || {};
    var reg = e.reg || '';

    var html = '<div class="form-group ettersyn-maskin">' +
        '<label for="ettersynMaskin">Maskin på ettersyn:</label>' +
        '<select id="ettersynMaskin" class="bt-input" data-fokus="ettersyn:reg">' +
            btMaskinValg(reg, 'Ingen maskin på ettersyn') + '</select>' +
    '</div>';

    if (reg) {
        var status = e.status || 'Pågår';
        var tone = status === 'Ferdig' ? 'tone-ok' : (status === 'Venter på deler' ? 'tone-warn' : 'tone-info');
        var statusKnapper = BT_ETTERSYN_STATUSER.map(function(s) {
            return '<button type="button" class="issue-status-btn issue-status-' + btStatusKlasse(s) +
                (s === status ? ' is-active' : '') + ' ettersyn-status-btn" data-status="' + escapeHtml(s) + '">' +
                escapeHtml(s) + '</button>';
        }).join('');

        var dager = e.forventetFerdig && status !== 'Ferdig' ? btDagerMellom(btIDag(), e.forventetFerdig) : null;
        var frist = dager === null ? '' : (dager >= 0
            ? dager + ' dager til forventet ferdig'
            : Math.abs(dager) + ' dager over forventet ferdig');

        html += '<div class="bt-card ' + tone + '">' +
            '<div class="bt-card-head">' +
                '<span class="bt-card-title">' + escapeHtml(reg) + (e.type ? ' – ' + escapeHtml(e.type) : '') + '</span>' +
                '<div class="issue-status-group">' + statusKnapper + '</div>' +
            '</div>' +
            '<div class="bt-field-grid">' +
                '<label>Type ettersyn<input type="text" class="bt-input ettersyn-felt" data-felt="type" data-fokus="ettersyn:type"' +
                    ' value="' + escapeHtml(e.type || '') + '" placeholder="f.eks. 600t / 1 år"></label>' +
                '<label>Base<select class="bt-input ettersyn-felt" data-felt="base" data-fokus="ettersyn:base">' +
                    btBaseValg(e.base, '–') + '</select></label>' +
                '<label>Startet<input type="date" class="bt-input ettersyn-felt" data-felt="startet" data-fokus="ettersyn:startet"' +
                    ' value="' + escapeHtml(e.startet || '') + '"></label>' +
                '<label>Forventet ferdig<input type="date" class="bt-input ettersyn-felt" data-felt="forventetFerdig" data-fokus="ettersyn:forventetFerdig"' +
                    ' value="' + escapeHtml(e.forventetFerdig || '') + '"></label>' +
            '</div>' +
            '<label class="bt-textarea-label">Fremdrift / merknad' +
                '<textarea class="bt-input ettersyn-felt" data-felt="merknad" data-fokus="ettersyn:merknad"' +
                ' placeholder="Hva er gjort, hva gjenstår, funn underveis">' + escapeHtml(e.merknad || '') + '</textarea></label>' +
            '<div class="bt-card-meta">' +
                (frist ? '<span class="' + (dager < 0 ? 'text-bad' : '') + '">' + frist + '</span>' : '') +
                (frist && e.oppdatert ? ' · ' : '') +
                (e.oppdatert ? 'Sist oppdatert ' + escapeHtml(btFormatTidspunkt(e.oppdatert)) : '') +
            '</div>' +
        '</div>';
    }

    btRenderBevarFokus(panel, html, function() {
        document.getElementById('ettersynMaskin').addEventListener('change', function() {
            btByttEttersynMaskin(this);
        });
        panel.querySelectorAll('.ettersyn-felt').forEach(function(felt) {
            felt.addEventListener('change', function() {
                var endring = {};
                endring[this.getAttribute('data-felt')] = this.value;
                btLagreEttersyn(endring);
            });
        });
        panel.querySelectorAll('.ettersyn-status-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btLagreEttersyn({ status: this.getAttribute('data-status') });
            });
        });
    });
}

// Ny maskin betyr nytt ettersyn; feltene fra forrige maskin tas ikke med.
function btByttEttersynMaskin(select) {
    var gammel = btEttersyn.reg || '';
    var ny = select.value;
    if (ny === gammel) return;

    if (gammel && btEttersyn.status !== 'Ferdig') {
        var sporsmal = ny
            ? 'Avslutte ettersynet på ' + gammel + ' og starte på ' + ny + '?'
            : 'Fjerne ' + gammel + ' fra ettersyn?';
        if (!confirm(sporsmal)) {
            select.value = gammel;
            return;
        }
    }
    btLagreEttersyn({
        reg: ny,
        type: '',
        base: '',
        startet: ny ? btIDag() : '',
        forventetFerdig: '',
        status: ny ? 'Pågår' : '',
        merknad: ''
    });
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

    var kritiskeTools = btSorterTools(btTools.filter(function(t) {
        var d = btToolDager(t, dato);
        return d !== null && d <= BT_TOOLS_VARSEL_DAGER;
    })).map(function(t) {
        return { beskrivelse: t.beskrivelse || '', base: t.base || '', nesteDue: t.nesteDue || '',
            dagerIgjen: btToolDager(t, dato) };
    });

    var e = btEttersyn || {};

    return {
        dato: dato,
        tekniker: document.getElementById('btTekniker').value.trim(),
        baser: BT_BASER.slice(),
        kontroll: {
            verktoy: document.getElementById('btVerktoy').checked,
            kalibrering: document.getElementById('btKalibrering').checked,
            hangar: document.getElementById('btHangar').checked,
            forbruk: document.getElementById('btForbruk').checked
        },
        generelt: document.getElementById('btGenerelt').value.trim(),
        overlevering: document.getElementById('btOverlevering').value.trim(),
        aapneSaker: aapne.map(btSakSnapshot),
        endringer: endretIDag.map(btSakSnapshot),
        prosjekter: btProsjekter.filter(function(p) { return !p.slettet && p.status !== 'Ferdig'; })
            .sort(function(a, b) { return new Date(a.opprettet || 0) - new Date(b.opprettet || 0); })
            .map(function(p) {
                return {
                    tittel: p.tittel || '', maskin: p.maskin || '', base: p.base || '',
                    status: p.status || '', ansvarlig: p.ansvarlig || '',
                    planlagtStart: p.planlagtStart || '', forventetFerdig: p.forventetFerdig || '',
                    delpunkter: (p.delpunkter || []).map(function(d) { return { tekst: d.tekst, ferdig: !!d.ferdig }; }),
                    merknad: p.merknad || ''
                };
            }),
        tools: {
            totalt: btTools.length,
            perBase: btToolStatusPerBase(dato),
            kritiske: kritiskeTools
        },
        ettersyn: {
            reg: e.reg || '', type: e.type || '', base: e.base || '', startet: e.startet || '',
            forventetFerdig: e.forventetFerdig || '', status: e.status || '', merknad: e.merknad || ''
        },
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

    // --- Utestående saker, gruppert per base ---
    var aapne = (data.aapneSaker || []).map(function(s) {
        return Object.assign({}, s, { base: btNormaliserBase(s.base) || btNormaliserBase(data.base) || '' });
    });
    seksjonstittel('Utestående saker (' + aapne.length + ')');
    var grupper = (data.baser || []).slice();
    aapne.forEach(function(s) { if (grupper.indexOf(s.base) === -1) grupper.push(s.base); });
    if (grupper.length === 0) grupper = [''];
    grupper.forEach(function(base) {
        var iGruppe = aapne.filter(function(s) { return s.base === base; });
        undertittel((base || 'Uten base') + ' (' + iGruppe.length + ')');
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

    // --- Basestatus ---
    seksjonstittel('Basestatus');
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
        undertittel('Generell status / hendelser');
        tekst(data.generelt, { innrykk: 2, farge: textSecondary });
        y += 2;
    }

    // --- Overlevering ---
    seksjonstittel('Overlevering til neste vakt');
    tekst(data.overlevering || '(Ingen merknader)', { innrykk: 2 });

    // --- Ettersyn (til sist) ---
    if (data.ettersyn) {
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
            rapport.ettersyn && rapport.ettersyn.reg ? escapeHtml(rapport.ettersyn.reg) + ' på ettersyn' : null
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

    btSettTeknikere(localStorage.getItem('bt_tekniker') || '');
    document.getElementById('btTeknikerDropdown').addEventListener('change', function() {
        if (this.value && btValgteTeknikere.indexOf(this.value) === -1) {
            btValgteTeknikere.push(this.value);
            btOppdaterTeknikerFelt();
        }
    });
    document.getElementById('btTeknikerExtra').addEventListener('input', btOppdaterTeknikerFelt);

    // Saker
    ['filterShowClosed', 'filterBase', 'filterKategori'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', btRenderIssueBoard);
    });
    document.getElementById('newIssueBtn').addEventListener('click', function() { btAapneSakModal(null); });
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

    // Større reparasjoner
    document.getElementById('newProjectBtn').addEventListener('click', btNyttProsjekt);
    document.getElementById('filterShowDoneProjects').addEventListener('change', btRenderProsjekter);

    // Tools
    ['toolFilterBase', 'toolFilterPeriode'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', btRenderTools);
    });
    document.getElementById('newToolBtn').addEventListener('click', function() { btAapneToolModal(null); });
    document.getElementById('toolModalClose').addEventListener('click', btLukkToolModal);
    document.getElementById('toolModal').addEventListener('click', function(e) {
        if (e.target === this) btLukkToolModal();
    });
    document.getElementById('toolSaveBtn').addEventListener('click', btLagreTool);
    document.getElementById('toolDeleteBtn').addEventListener('click', function() {
        if (!btRedigererToolId) return;
        if (!confirm('Slette dette toolet fra oversikten?')) return;
        btSlett(BT_TOOLS, btRedigererToolId, btLukkToolModal);
    });

    // Filimport: dra og slipp eller klikk for å velge
    var sone = document.getElementById('toolDropZone');
    var filInput = document.getElementById('toolFileInput');
    // Uten dette åpner nettleseren fila i stedet når den slippes ved siden av sonen.
    document.addEventListener('dragover', function(e) { e.preventDefault(); });
    document.addEventListener('drop', function(e) { e.preventDefault(); });
    sone.addEventListener('click', function() { filInput.click(); });
    sone.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filInput.click(); }
    });
    sone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sone.classList.add('is-dragover');
    });
    sone.addEventListener('dragleave', function() { sone.classList.remove('is-dragover'); });
    sone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sone.classList.remove('is-dragover');
        if (e.dataTransfer.files.length) btHaandterFil(e.dataTransfer.files[0]);
    });
    filInput.addEventListener('change', function() {
        if (this.files.length) btHaandterFil(this.files[0]);
        this.value = '';
    });

    document.getElementById('importModalClose').addEventListener('click', btLukkImportModal);
    document.getElementById('importSaveBtn').addEventListener('click', btImporterValgte);
    document.getElementById('importStandardBase').addEventListener('change', btRenderImportRader);
    document.getElementById('importVelgAlle').addEventListener('change', function() {
        var valgt = this.checked;
        btImportRader.forEach(function(r) { r.valgt = valgt; });
        btRenderImportRader();
    });

    // Rapport
    document.getElementById('btExportPdf').addEventListener('click', btGenererPdf);
    document.getElementById('btSendEmail').addEventListener('click', btSendEpost);
    document.getElementById('btReset').addEventListener('click', function() {
        if (!confirm('Nullstille vaktfeltene? Saker, reparasjoner, tools og ettersyn beholdes.')) return;
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

    // Sanntidsdata
    btLytt(BT_SAKER, function(liste) {
        btSaker = liste.map(btNormaliserSak);
        btRenderIssueBoard();
    }, 'issueBoard');
    btLytt(BT_PROSJEKTER, function(liste) {
        btProsjekter = liste;
        btRenderProsjekter();
    }, 'projectBoard');
    btSikreMlgProsjekt();
    btLytt(BT_TOOLS, function(liste) {
        btTools = liste.map(function(t) { t.base = btNormaliserBase(t.base); return t; });
        btRenderTools();
    }, 'toolList');
    btLytt(BT_STATUS, function(liste) {
        btEttersyn = liste.find(function(d) { return d.id === BT_ETTERSYN_ID; }) || {};
        btRenderEttersyn();
    }, 'ettersynPanel');
    btLastRapporter();
});
