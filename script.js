// Tema, Firebase-init og delte hjelpefunksjoner ligger i common.js.

window.vaktrapportDocsList = []; // liste med { id, ...reportData } fra Firestore

function setDateToToday() {
    const dateInput = document.getElementById('date');
    if (!dateInput) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
}

// Enable/disable helicopter text fields and show/hide status checkboxes based on checkbox state
document.addEventListener('DOMContentLoaded', function() {
    // Set date to today automatically
    setDateToToday();
    
    // Function to handle helicopter checkbox change
    function handleHelicopterChange(checkbox, utenFokus) {
        const helicopterId = checkbox.id;
        let textFieldId, statusDivId;
        
        // Map checkbox ID to text field ID and status div ID
        if (helicopterId === 'heliOXH') {
            textFieldId = 'heliOXHText';
            statusDivId = 'heliOXHStatus';
        } else if (helicopterId === 'heliOXI') {
            textFieldId = 'heliOXIText';
            statusDivId = 'heliOXIStatus';
        } else if (helicopterId === 'heliOXJ') {
            textFieldId = 'heliOXJText';
            statusDivId = 'heliOXJStatus';
        } else if (helicopterId === 'heliOXK') {
            textFieldId = 'heliOXKText';
            statusDivId = 'heliOXKStatus';
        } else {
            return; // Unknown helicopter ID
        }
        
        const textField = document.getElementById(textFieldId);
        const statusDiv = document.getElementById(statusDivId);
        
        if (!textField || !statusDiv) {
            console.error('Could not find text field or status div for:', helicopterId);
            return;
        }
        
        // Handle checkbox state
        if (checkbox.checked) {
            // Checkbox is checked: show status options and enable text field
            statusDiv.style.display = 'flex';
            textField.removeAttribute('disabled');
            textField.disabled = false;
            textField.style.display = '';
            // Fokus bare når brukeren selv huker av, ikke når en kollega gjør det (live).
            if (!utenFokus) {
                setTimeout(() => {
                    textField.focus();
                }, 50);
            }
        } else {
            // Checkbox is unchecked: hide status options and disable text field
            statusDiv.style.display = 'none';
            textField.disabled = true;
            textField.setAttribute('disabled', 'disabled');
            textField.value = '';
            textField.style.display = 'none';
            // Clear status radio selections
            const statusRadios = statusDiv.querySelectorAll('input[type="radio"]');
            statusRadios.forEach(radio => {
                radio.checked = false;
            });
        }
    }

    // Add event listeners to all helicopter checkboxes
    const helicopterCheckboxes = document.querySelectorAll('.helicopter-checkbox');
    
    helicopterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleHelicopterChange(this);
        });
        // Sett initial visning ved last av side
        handleHelicopterChange(checkbox, true);
    });
    window.vaktHeliVis = function(checkbox) { handleHelicopterChange(checkbox, true); };

    // PDF Export functionality
    const exportPdfBtn = document.getElementById('exportPdf');
    const sharepointBtn = document.getElementById('openSharepointMappe');
    const sendEmailBtn = document.getElementById('sendEmail');
    exportPdfBtn.addEventListener('click', function() {
        generatePDF();
    });

    // E-mail shortcut with prefilled recipients/subject/body
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', function () {
            const base = (document.getElementById('base').value || 'Ikke angitt').trim();
            const vakttype = (document.getElementById('vakttype').value || 'Ikke angitt').trim();
            const date = (document.getElementById('date').value || '').trim();

            let formattedDate = 'Ikke angitt';
            if (date) {
                const parts = date.split('-');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    formattedDate = date;
                }
            }
            const subject = `Statusrapport ${base} ${vakttype} ${formattedDate}`;
            const body = `Hei,\n\nSe vedlagt vaktrapport.\n\nGod vakt 😊`;

            const toRecipients = [
                'AL_Teknikere-LOS@airlift.no',
                'camo.aw169@airlift.no',
                'JornErik.Sorensen@airlift.no',
                'karianne.blom@airlift.no',
                'basetekniker-flesland@airlift.no',
                'asgeir.hogstad@airlift.no'
            ].join('; ');

            const mailtoUrl =
                `mailto:${encodeURIComponent(toRecipients)}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(body)}`;

            // Etter e-post åpnes, marker SharePoint-knapp som neste steg.
            if (sharepointBtn) {
                sharepointBtn.classList.remove('btn-neutral');
                sharepointBtn.classList.add('btn-success');
                sharepointBtn.classList.remove('is-disabled');
                sharepointBtn.removeAttribute('aria-disabled');
                sharepointBtn.removeAttribute('tabindex');
            }

            window.location.href = mailtoUrl;
        });
    }

    // Når PDF faktisk er eksportert, marker e-postknappen som grønn.
    window.addEventListener('vaktrapport:pdfExported', function () {
        if (sendEmailBtn) {
            sendEmailBtn.classList.remove('btn-neutral');
            sendEmailBtn.classList.add('btn-success');
            sendEmailBtn.disabled = false;
        }
    });


    // Store selected persons
    let selectedPersons = [];
    
    // All available persons in the dropdown
    const allAvailablePersons = [
        'Marius Høvik',
        'Torfinn Roti',
        'Eirik Dypevik',
        'Johnny Mæland',
        'Håvard Adsen',
        'Odd Fiksdal',
        'Johan Karlsson',
        'Leif Rune Krogh Hus',
        'Stig Hestad',
        'Jøran Festervoll',
        'Elliot Jaako',
        'Gustav Svanstrøm',
        'Andreas Valø',
        'Luigino Visintini'
    ];
    
    // Update dropdown options to exclude selected persons
    function updatePersonDropdown() {
        const dropdown = document.getElementById('personDropdown');
        const currentValue = dropdown.value;
        
        // Clear all options except the first placeholder
        dropdown.innerHTML = '<option value="">Velg person...</option>';
        
        // Add only persons that are not selected
        allAvailablePersons.forEach(person => {
            if (!selectedPersons.includes(person)) {
                const option = document.createElement('option');
                option.value = person;
                option.textContent = person;
                dropdown.appendChild(option);
            }
        });
        
        // Restore the current value if it's still valid
        if (currentValue && !selectedPersons.includes(currentValue)) {
            dropdown.value = currentValue;
        } else {
            dropdown.value = '';
        }
    }
    
    // Update person field and display
    function updatePersonField() {
        const personField = document.getElementById('person');
        const extraField = document.getElementById('personExtra').value.trim();
        
        const allNames = [...selectedPersons];
        if (extraField) {
            // Split by comma and add each name
            const extraNames = extraField.split(',').map(n => n.trim()).filter(n => n);
            allNames.push(...extraNames);
        }
        
        personField.value = allNames.join(', ');
        
        // Update required validation
        if (allNames.length > 0) {
            personField.setCustomValidity('');
        } else {
            personField.setCustomValidity('Velg minst én person eller skriv inn navn');
        }
        
        // Update display and dropdown
        updateSelectedPersonsDisplay();
        updatePersonDropdown();
        if (window.vaktPersonEndret) window.vaktPersonEndret();
    }

    // Fyller personvalget fra en kommaseparert tekst (brukes av live-status).
    window.settPersonerFraTekst = function(tekst) {
        const navn = String(tekst || '').split(',').map(n => n.trim()).filter(n => n);
        const ekstra = [];
        selectedPersons.length = 0;
        navn.forEach(n => {
            if (allAvailablePersons.includes(n)) {
                if (!selectedPersons.includes(n)) selectedPersons.push(n);
            } else {
                ekstra.push(n);
            }
        });
        document.getElementById('personExtra').value = ekstra.join(', ');
        updatePersonField();
    };
    
    // Update the display of selected persons
    function updateSelectedPersonsDisplay() {
        const container = document.getElementById('selectedPersons');
        container.innerHTML = '';
        
        if (selectedPersons.length === 0) {
            container.innerHTML = '<p class="no-persons">Ingen personer valgt</p>';
            return;
        }
        
        selectedPersons.forEach((name, index) => {
            const personItem = document.createElement('div');
            personItem.className = 'selected-person-item';
            personItem.innerHTML = `
                <span>${name}</span>
                <button type="button" class="remove-person-btn" data-index="${index}">×</button>
            `;
            container.appendChild(personItem);
        });
        
        // Add event listeners to remove buttons
        container.querySelectorAll('.remove-person-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                selectedPersons.splice(index, 1);
                updatePersonField();
            });
        });
    }
    
    // Initialize dropdown on page load
    updatePersonDropdown();
    
    // File upload handling - use window.uploadedFiles directly
    window.uploadedFiles = [];
    const uploadedFiles = window.uploadedFiles; // Local reference for convenience
    
    const fileUploadInput = document.getElementById('fileUpload');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    
    // Prevent default drag and drop behavior on the page
    // (The upload area will handle its own events with stopPropagation)
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
    
    // Function to process and add files
    function processFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedFiles.push({
                        name: file.name,
                        type: file.type,
                        data: e.target.result,
                        isImage: true
                    });
                    updateUploadedFilesDisplay();
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
                // Selve fila tas vare på, så PDF-en kan legges inn i rapporten ved eksport.
                uploadedFiles.push({
                    name: file.name,
                    type: 'application/pdf',
                    data: null,
                    fil: file,
                    isImage: false
                });
                updateUploadedFilesDisplay();
            }
        });
    }
    
    // Click on upload area triggers file input
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', function() {
            fileUploadInput.click();
        });
        
        // Drag and drop functionality
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.style.borderColor = '#667eea';
            fileUploadArea.style.backgroundColor = '#e8eaff';
        });
        
        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.style.borderColor = '#e0e0e0';
            fileUploadArea.style.backgroundColor = '#f8f9fa';
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.style.borderColor = '#e0e0e0';
            fileUploadArea.style.backgroundColor = '#f8f9fa';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFiles(files);
            }
        });
    }
    
    // Handle file selection from input
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                processFiles(files);
            }
            // Reset input to allow selecting same file again
            e.target.value = '';
        });
    }
    
    // Update display of uploaded files
    function updateUploadedFilesDisplay() {
        if (!uploadedFilesContainer) return;
        
        uploadedFilesContainer.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'uploaded-file-item';
            
            if (file.isImage) {
                fileItem.innerHTML = `
                    <img src="${file.data}" alt="${file.name}">
                    <div class="file-info">${file.name}</div>
                    <button type="button" class="remove-file-btn" data-index="${index}">×</button>
                `;
            } else {
                fileItem.className += ' pdf-file';
                fileItem.innerHTML = `
                    <div class="file-icon">📄</div>
                    <div class="file-info">${file.name}</div>
                    <button type="button" class="remove-file-btn" data-index="${index}">×</button>
                `;
            }
            
            uploadedFilesContainer.appendChild(fileItem);
        });
        
        // Add event listeners to remove buttons
        uploadedFilesContainer.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                uploadedFiles.splice(index, 1);
                updateUploadedFilesDisplay();
            });
        });
    }
    
    // Make function available globally
    window.updateUploadedFilesDisplay = updateUploadedFilesDisplay;
    
    // Add person from dropdown
    document.getElementById('personDropdown').addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue && !selectedPersons.includes(selectedValue)) {
            selectedPersons.push(selectedValue);
            this.value = ''; // Reset dropdown
            updatePersonField();
        }
    });
    
    // Update when extra field changes
    document.getElementById('personExtra').addEventListener('input', updatePersonField);
    
    // Initial update
    updatePersonField();
    
    // Make functions available globally for loadReport
    window.updatePersonField = updatePersonField;
    window.updatePersonDropdown = updatePersonDropdown;
    window.selectedPersons = selectedPersons;

    // Update title based on vakttype selection
    const vakttypeSelect = document.getElementById('vakttype');
    const reportTitle = document.getElementById('reportTitle');
    
    function updateTitle() {
        const vakttype = vakttypeSelect.value;
        if (vakttype) {
            reportTitle.textContent = `Vaktrapport - ${vakttype}`;
        } else {
            reportTitle.textContent = 'Vaktrapport';
        }
    }
    
    window.vaktOppdaterTittel = updateTitle;

    // «Basetekniker» er ikke en vakttype i dette skjemaet, men en snarvei til egen side.
    vakttypeSelect.addEventListener('change', function() {
        if (vakttypeSelect.value === 'Basetekniker') {
            window.location.href = 'basetekniker.html';
            return;
        }
        updateTitle();
    });

    // Når man går tilbake med nettleserens tilbakeknapp kan valget bli husket.
    window.addEventListener('pageshow', function() {
        if (vakttypeSelect.value === 'Basetekniker') {
            vakttypeSelect.value = '';
            updateTitle();
        }
    });
    
    // Etter at PDF og e-post er sendt, nullstilles stegfargene når statusen nullstilles.
    window.vaktNullstillSteg = function() {
        if (window.uploadedFiles) window.uploadedFiles.length = 0;
        if (window.updateUploadedFilesDisplay) window.updateUploadedFilesDisplay();
        if (sendEmailBtn) {
            sendEmailBtn.classList.remove('btn-success');
            sendEmailBtn.classList.add('btn-neutral');
            sendEmailBtn.disabled = true;
        }
        if (sharepointBtn) {
            sharepointBtn.classList.remove('btn-success');
            sharepointBtn.classList.add('btn-neutral');
            sharepointBtn.classList.add('is-disabled');
            sharepointBtn.setAttribute('aria-disabled', 'true');
            sharepointBtn.setAttribute('tabindex', '-1');
        }
    };

    // Load and display report register
    const baseFilter = document.getElementById('reportBaseFilter');
    if (baseFilter) {
        baseFilter.addEventListener('change', applyReportBaseFilter);
    }
    loadReportRegister();
    vaktLiveStart();

});

// Store and retrieve reports: Firestore (felles) eller localStorage (lokal fallback)

const DRAFT_EXPIRY_DAYS = 14;

function daysSinceTimestamp(isoTimestamp) {
    if (!isoTimestamp) return 0;
    var then = new Date(isoTimestamp).getTime();
    if (isNaN(then)) return 0;
    return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function pruneExpiredDrafts() {
    var all = window.vaktrapportDocsList || [];
    var isExpiredDraft = function(r) {
        return !!r.isDraft && daysSinceTimestamp(r.timestamp) > DRAFT_EXPIRY_DAYS;
    };
    var expired = all.filter(isExpiredDraft);
    if (expired.length === 0) return;

    window.vaktrapportDocsList = all.filter(function(r) { return !isExpiredDraft(r); });

    if (window.firestoreDb) {
        expired.forEach(function(r) {
            if (r.id) {
                window.firestoreDb.collection('vaktrapporter').doc(r.id).delete()
                    .catch(function(err) { console.error('Kunne ikke slette utgått utkast:', err); });
            }
        });
    } else {
        var stored = JSON.parse(localStorage.getItem('vaktrapport_reports') || '[]');
        stored = stored.filter(function(r) { return !isExpiredDraft(r); });
        localStorage.setItem('vaktrapport_reports', JSON.stringify(stored));
    }
}

function saveReportToRegister(reportData) {
    if (window.firestoreDb) {
        window.firestoreDb.collection('vaktrapporter').add(reportData)
            .then(function() { loadReportRegister(); })
            .catch(function(err) {
                console.error('Firestore save error:', err);
                alert('Kunne ikke lagre rapport til skyen. Prøv igjen.');
            });
        return;
    }
    var reports = JSON.parse(localStorage.getItem('vaktrapport_reports') || '[]');
    reports.unshift(reportData);
    if (reports.length > 50) reports = reports.slice(0, 50);
    localStorage.setItem('vaktrapport_reports', JSON.stringify(reports));
    loadReportRegister();
}

function loadReportRegister() {
    var registerDiv = document.getElementById('reportRegister');
    if (window.firestoreDb) {
        window.firestoreDb.collection('vaktrapporter')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get()
            .then(function(snapshot) {
                window.vaktrapportDocsList = snapshot.docs.map(function(d) {
                    var data = d.data();
                    data.id = d.id;
                    return data;
                });
                pruneExpiredDrafts();
                populateBaseFilter(window.vaktrapportDocsList);
                applyReportBaseFilter();
            })
            .catch(function(err) {
                console.error('Firestore load error:', err);
                registerDiv.innerHTML = '<p class="no-reports">Kunne ikke hente rapporter fra skyen.</p>';
            });
        return;
    }
    var reports = JSON.parse(localStorage.getItem('vaktrapport_reports') || '[]');
    window.vaktrapportDocsList = reports.map(function(r, i) { r.id = i; return r; });
    pruneExpiredDrafts();
    populateBaseFilter(window.vaktrapportDocsList);
    applyReportBaseFilter();
}

function populateBaseFilter(reports) {
    var baseFilter = document.getElementById('reportBaseFilter');
    if (!baseFilter) return;
    var selected = baseFilter.value || '';
    var bases = Array.from(new Set((reports || []).map(function(r) {
        return (r.base || '').trim();
    }).filter(Boolean))).sort();

    baseFilter.innerHTML = '<option value="">Alle baser</option>' +
        bases.map(function(base) {
            return '<option value="' + base.replace(/"/g, '&quot;') + '">' + base + '</option>';
        }).join('');
    baseFilter.value = bases.includes(selected) ? selected : '';
}

function applyReportBaseFilter() {
    var registerDiv = document.getElementById('reportRegister');
    var baseFilter = document.getElementById('reportBaseFilter');
    var selectedBase = baseFilter ? baseFilter.value : '';
    var allReports = window.vaktrapportDocsList || [];
    var filtered = allReports
        .map(function(r, i) {
            var copy = Object.assign({}, r);
            copy._sourceIndex = i;
            return copy;
        })
        .filter(function(r) {
            if (!selectedBase) return true;
            return (r.base || '').trim() === selectedBase;
        });

    // Bare siste eksporterte PDF vises; eldre rapporter ligger i SharePoint.
    // Gamle utkast (fra før live-status) og live-dokumentene vises ikke.
    var latest = filtered.filter(function(r) { return !r.isDraft && r.art !== 'live'; })
        .sort(function(a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); })
        .slice(0, 1);
    renderReportRegister(latest, registerDiv);
}

function renderReportRegister(reports, registerDiv) {
    if (!reports || reports.length === 0) {
        registerDiv.innerHTML = '<p class="no-reports">Ingen rapporter registrert</p>' + sharepointHenvisningHtml();
        return;
    }

    function renderRows(rows) {
        return rows.map(function(report, index) {
        var sourceIndex = (typeof report._sourceIndex === 'number') ? report._sourceIndex : index;
        var reportDate = report.date || 'Ikke angitt';
        var base = report.base || 'Ikke angitt';
        var vakttype = report.vakttype || '';
        var person = report.person || 'Ikke angitt';
        return '<div class="report-item">' +
            '<div class="report-item-info">' +
            '<div class="report-item-date">' + escapeHtml(formatDate(reportDate)) + '</div>' +
            '<div class="report-item-details">Base: ' + escapeHtml(base) + (vakttype ? ' | Vakttype: ' + escapeHtml(vakttype) : '') + ' | Personer: ' + escapeHtml(person) + '</div>' +
            '</div>' +
            '<div class="report-item-actions">' +
            '<button class="btn-small btn-pdf" onclick="downloadReportPdf(' + sourceIndex + ')">PDF</button>' +
            '<button class="btn-small btn-delete" onclick="deleteReport(' + sourceIndex + ')">Slett</button>' +
            '</div></div>';
        }).join('');
    }

    registerDiv.innerHTML = renderRows(reports) + sharepointHenvisningHtml();
}

function downloadReportPdf(index) {
    var reports = window.vaktrapportDocsList || [];
    if (index < 0 || index >= reports.length) return;
    var report = reports[index];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const filePath = report.filePath || 'Sharepoint: \\Technical - Part-145\\Planning\\Status reports - Handover';

    generatePDFContent(
        doc,
        report.date || '',
        report.base || '',
        report.vakttype || '',
        report.person || '',
        report.statusBase || '',
        filePath,
        !!report.heliOXH, report.heliOXHText || '', report.heliOXHStatus || '',
        !!report.heliOXI, report.heliOXIText || '', report.heliOXIStatus || '',
        !!report.heliOXJ, report.heliOXJText || '', report.heliOXJStatus || '',
        !!report.heliOXK, report.heliOXKText || '', report.heliOXKStatus || '',
        [], null, false
    );
}

function deleteReport(index) {
    if (!confirm('Er du sikker på at du vil slette denne rapporten?')) return;
    if (window.firestoreDb && window.vaktrapportDocsList && window.vaktrapportDocsList[index]) {
        var docId = window.vaktrapportDocsList[index].id;
        if (docId && typeof docId === 'string' && docId.length > 0) {
            window.firestoreDb.collection('vaktrapporter').doc(docId).delete()
                .then(function() { loadReportRegister(); })
                .catch(function(err) {
                    console.error('Firestore delete error:', err);
                    alert('Kunne ikke slette rapport.');
                });
            return;
        }
    }
    var reports = JSON.parse(localStorage.getItem('vaktrapport_reports') || '[]');
    reports.splice(index, 1);
    localStorage.setItem('vaktrapport_reports', JSON.stringify(reports));
    loadReportRegister();
}


function generatePDF() {
    // Validate required fields before generating PDF
    const date = document.getElementById('date').value.trim();
    const base = document.getElementById('base').value.trim();
    const vakttype = document.getElementById('vakttype').value.trim();
    const person = document.getElementById('person').value.trim();
    const statusBase = document.getElementById('statusBase').value.trim();
    
    const missingFields = [];
    if (!date) missingFields.push('Dato');
    if (!base) missingFields.push('Base');
    if (!vakttype) missingFields.push('Vakttype');
    if (!person) missingFields.push('Personer involvert');
    
    if (missingFields.length > 0) {
        alert('Vennligst fyll ut alle påkrevde felt:\n\n' + missingFields.join('\n'));
        return;
    }
    
    // Load logo image first
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = function() {
        // Convert image to base64 data URL
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0);
        const logoData = canvas.toDataURL('image/png');
        
        // Store logo dimensions to maintain exact aspect ratio
        const logoInfo = {
            data: logoData,
            width: logoImg.width,
            height: logoImg.height
        };
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Get form values (already validated above)
        const filePath = 'Sharepoint: \\Technical - Part-145\\Planning\\Status reports - Handover';
        
        const heliOXH = document.getElementById('heliOXH').checked;
        const heliOXHText = heliOXH ? document.getElementById('heliOXHText').value : '';
        const heliOXHStatusRadio = heliOXH ? document.querySelector('input[name="heliOXHStatus"]:checked') : null;
        const heliOXHStatus = heliOXHStatusRadio ? heliOXHStatusRadio.value : '';
        
        const heliOXI = document.getElementById('heliOXI').checked;
        const heliOXIText = heliOXI ? document.getElementById('heliOXIText').value : '';
        const heliOXIStatusRadio = heliOXI ? document.querySelector('input[name="heliOXIStatus"]:checked') : null;
        const heliOXIStatus = heliOXIStatusRadio ? heliOXIStatusRadio.value : '';
        
        const heliOXJ = document.getElementById('heliOXJ').checked;
        const heliOXJText = heliOXJ ? document.getElementById('heliOXJText').value : '';
        const heliOXJStatusRadio = heliOXJ ? document.querySelector('input[name="heliOXJStatus"]:checked') : null;
        const heliOXJStatus = heliOXJStatusRadio ? heliOXJStatusRadio.value : '';
        
        const heliOXK = document.getElementById('heliOXK').checked;
        const heliOXKText = heliOXK ? document.getElementById('heliOXKText').value : '';
        const heliOXKStatusRadio = heliOXK ? document.querySelector('input[name="heliOXKStatus"]:checked') : null;
        const heliOXKStatus = heliOXKStatusRadio ? heliOXKStatusRadio.value : '';
        
        // Get uploaded files
        const files = window.uploadedFiles || [];
        
        generatePDFContent(doc, date, base, vakttype, person, statusBase, filePath, 
            heliOXH, heliOXHText, heliOXHStatus,
            heliOXI, heliOXIText, heliOXIStatus,
            heliOXJ, heliOXJText, heliOXJStatus,
            heliOXK, heliOXKText, heliOXKStatus, files, logoInfo);
    };
    logoImg.onerror = function() {
        // If logo fails to load, continue without it
        console.warn('Logo could not be loaded, continuing without logo');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const filePath = 'Sharepoint: \\Technical - Part-145\\Planning\\Status reports - Handover';
        
        const heliOXH = document.getElementById('heliOXH').checked;
        const heliOXHText = heliOXH ? document.getElementById('heliOXHText').value : '';
        const heliOXHStatusRadio = heliOXH ? document.querySelector('input[name="heliOXHStatus"]:checked') : null;
        const heliOXHStatus = heliOXHStatusRadio ? heliOXHStatusRadio.value : '';
        
        const heliOXI = document.getElementById('heliOXI').checked;
        const heliOXIText = heliOXI ? document.getElementById('heliOXIText').value : '';
        const heliOXIStatusRadio = heliOXI ? document.querySelector('input[name="heliOXIStatus"]:checked') : null;
        const heliOXIStatus = heliOXIStatusRadio ? heliOXIStatusRadio.value : '';
        
        const heliOXJ = document.getElementById('heliOXJ').checked;
        const heliOXJText = heliOXJ ? document.getElementById('heliOXJText').value : '';
        const heliOXJStatusRadio = heliOXJ ? document.querySelector('input[name="heliOXJStatus"]:checked') : null;
        const heliOXJStatus = heliOXJStatusRadio ? heliOXJStatusRadio.value : '';
        
        const heliOXK = document.getElementById('heliOXK').checked;
        const heliOXKText = heliOXK ? document.getElementById('heliOXKText').value : '';
        const heliOXKStatusRadio = heliOXK ? document.querySelector('input[name="heliOXKStatus"]:checked') : null;
        const heliOXKStatus = heliOXKStatusRadio ? heliOXKStatusRadio.value : '';
        
        const files = window.uploadedFiles || [];
        
        generatePDFContent(doc, date, base, vakttype, person, statusBase, filePath, 
            heliOXH, heliOXHText, heliOXHStatus,
            heliOXI, heliOXIText, heliOXIStatus,
            heliOXJ, heliOXJText, heliOXJStatus,
            heliOXK, heliOXKText, heliOXKStatus, files, null);
    };
    logoImg.src = 'assets/airliftlogo.webp';
}

function generatePDFContent(doc, date, base, vakttype, person, statusBase, filePath,
    heliOXH, heliOXHText, heliOXHStatus,
    heliOXI, heliOXIText, heliOXIStatus,
    heliOXJ, heliOXJText, heliOXJStatus,
    heliOXK, heliOXKText, heliOXKStatus, files = [], logoInfo = null, shouldSaveToRegister = true) {
    
    // Website Design System Colors - Aviation Inspired
    const primaryBlue = [30, 136, 229]; // #1E88E5 - Sky Blue
    const primaryBlueDark = [21, 101, 192]; // #1565C0 - Deep Blue
    const primaryNavy = [10, 37, 64]; // #0A2540 - Deep Navy
    const successGreen = [46, 125, 50]; // #2E7D32 - Forest Green
    const errorRed = [229, 57, 53]; // #E53935 - Coral Red
    const warningAmber = [255, 179, 0]; // #FFB300 - Amber
    
    // Text Colors
    const textPrimary = [26, 26, 26]; // #1A1A1A - Primary text
    const textSecondary = [97, 97, 97]; // #616161 - Secondary text
    const textTertiary = [158, 158, 158]; // #9E9E9E - Tertiary text
    
    // Background Colors
    const bgPrimary = [255, 255, 255]; // White
    const bgSecondary = [245, 247, 250]; // #F5F7FA - Light gray
    const bgTertiary = [232, 236, 241]; // #E8ECF1 - Lighter gray
    const borderColor = [224, 224, 224]; // #E0E0E0 - Border gray
    const borderLight = [238, 238, 238]; // #EEEEEE - Light border
    
    // Page dimensions: A4 = 210mm x 297mm
    const leftMargin = 10;
    const rightMargin = 10;
    const topMargin = 15;
    const bottomMargin = 15;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - leftMargin - rightMargin; // 190mm
    
    // Reset text color and set font
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.setFont('helvetica');
    
    // Professional Header with gradient background
    const headerHeight = 20;
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Add logo if available
    if (logoInfo && logoInfo.data) {
        try {
            // Calculate logo dimensions maintaining exact aspect ratio
            const maxLogoHeight = 14; // mm - maximum height to fit in header
            const aspectRatio = logoInfo.width / logoInfo.height;
            let logoHeight = maxLogoHeight;
            let logoWidth = logoHeight * aspectRatio;
            
            // If width is too large, scale down based on width instead
            const maxLogoWidth = 40; // mm - maximum width
            if (logoWidth > maxLogoWidth) {
                logoWidth = maxLogoWidth;
                logoHeight = logoWidth / aspectRatio;
            }
            
            // Position logo in top right corner of the blue header
            const logoX = pageWidth - rightMargin - logoWidth;
            const logoY = (headerHeight - logoHeight) / 2;
            doc.addImage(logoInfo.data, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
            console.error('Error adding logo to PDF:', error);
        }
    }
    
    // Title in header - white text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleText = vakttype && vakttype !== 'Ikke angitt' 
        ? `Vaktrapport - ${vakttype}` 
        : 'Vaktrapport';
    doc.text(titleText, pageWidth / 2, headerHeight / 2 + 2, { align: 'center' });
    
    // SharePoint path in header footer area (subtle)
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    const filePathShort = filePath.length > 60 ? filePath.substring(0, 57) + '...' : filePath;
    doc.text(filePathShort, leftMargin, headerHeight - 2);
    
    // Date in header (right side)
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text(formatDate(date), pageWidth - rightMargin, headerHeight - 2, { align: 'right' });
    
    let yPos = topMargin + headerHeight + 3;
    
    // Information Card Section - Modern card design
    const infoCardY = yPos;
    const infoCardHeight = 38;
    
    // Card background with subtle shadow effect
    doc.setFillColor(bgPrimary[0], bgPrimary[1], bgPrimary[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    // Use roundedRect if available, otherwise use regular rect
    if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(leftMargin, infoCardY, contentWidth, infoCardHeight, 2, 2, 'FD');
    } else {
        doc.rect(leftMargin, infoCardY, contentWidth, infoCardHeight, 'FD');
    }
    
    // Card title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlueDark[0], primaryBlueDark[1], primaryBlueDark[2]);
    doc.text('Rapportinformasjon', leftMargin + 4, infoCardY + 6);
    
    // Information grid (2 columns)
    const infoX1 = leftMargin + 4;
    const infoX2 = leftMargin + contentWidth / 2 + 2;
    const infoStartY = infoCardY + 12;
    let infoY = infoStartY;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    
    // Column 1
    doc.text('Dato:', infoX1, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(formatDate(date), infoX1 + 18, infoY);
    infoY += 5.5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text('Base:', infoX1, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(base || 'Ikke angitt', infoX1 + 18, infoY);
    
    // Column 2
    infoY = infoStartY;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text('Vakttype:', infoX2, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(vakttype || 'Ikke angitt', infoX2 + 25, infoY);
    infoY += 5.5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text('Personer:', infoX2, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    const personText = person.length > 30 ? person.substring(0, 27) + '...' : person;
    doc.text(personText || 'Ikke angitt', infoX2 + 25, infoY);
    
    yPos = infoCardY + infoCardHeight + 6;
    
    // Status Base Card Section
    const statusCardY = yPos;
    
    // Card background
    doc.setFillColor(bgPrimary[0], bgPrimary[1], bgPrimary[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    
    // Calculate text box dimensions
    const textBoxPadding = 4;
    const textBoxInnerWidth = contentWidth - (textBoxPadding * 2);
    const statusBaseText = statusBase || '(Ingen tekst)';
    const statusBaseLines = doc.splitTextToSize(statusBaseText, textBoxInnerWidth);
    const lineHeight = 4.5;
    const minBoxHeight = 18;
    const calculatedHeight = Math.max(statusBaseLines.length * lineHeight + (textBoxPadding * 2), minBoxHeight);
    const statusCardHeight = calculatedHeight + 12;
    
    if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(leftMargin, statusCardY, contentWidth, statusCardHeight, 2, 2, 'FD');
    } else {
        doc.rect(leftMargin, statusCardY, contentWidth, statusCardHeight, 'FD');
    }
    
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlueDark[0], primaryBlueDark[1], primaryBlueDark[2]);
    doc.text('Status base', leftMargin + 4, statusCardY + 6);
    
    // Draw text inside the box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    doc.text(statusBaseLines, leftMargin + textBoxPadding, statusCardY + 10 + textBoxPadding);
    
    yPos = statusCardY + statusCardHeight + 6;
    
    // Kontrollpunkter Section - Modern card design
    const kontrollCardY = yPos;
    const kontrollCardHeight = 55;
    
    // Card background
    doc.setFillColor(bgPrimary[0], bgPrimary[1], bgPrimary[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(leftMargin, kontrollCardY, contentWidth, kontrollCardHeight, 2, 2, 'FD');
    } else {
        doc.rect(leftMargin, kontrollCardY, contentWidth, kontrollCardHeight, 'FD');
    }
    
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlueDark[0], primaryBlueDark[1], primaryBlueDark[2]);
    doc.text('Kontrollpunkter', leftMargin + 4, kontrollCardY + 6);
    
    // Helper function to draw modern checkbox with checkmark
    const drawCheckboxItem = (label, isChecked, x, y) => {
        const boxSize = 4.5;
        const boxX = x;
        const boxY = y - 3;
        
        if (isChecked) {
            // Draw filled success green box
            doc.setFillColor(successGreen[0], successGreen[1], successGreen[2]);
            doc.setDrawColor(successGreen[0], successGreen[1], successGreen[2]);
            doc.setLineWidth(0.8);
            if (typeof doc.roundedRect === 'function') {
                doc.roundedRect(boxX, boxY, boxSize, boxSize, 1, 1, 'FD');
            } else {
                doc.rect(boxX, boxY, boxSize, boxSize, 'FD');
            }
            
            // Draw white checkmark
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1.4);
            doc.setLineCap('round');
            doc.setLineJoin('round');
            doc.line(boxX + 1, boxY + 2.5, boxX + 2.2, boxY + 4);
            doc.line(boxX + 2.2, boxY + 4, boxX + 4.5, boxY + 1);
        } else {
            // Draw empty box with border
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            doc.setLineWidth(0.6);
            if (typeof doc.roundedRect === 'function') {
                doc.roundedRect(boxX, boxY, boxSize, boxSize, 1, 1, 'FD');
            } else {
                doc.rect(boxX, boxY, boxSize, boxSize, 'FD');
            }
        }
        
        // Draw label text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (isChecked) {
            doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        } else {
            doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        }
        doc.text(label, boxX + 7, y);
    };
    
    // Draw each checkbox item in two columns
    const kaffiChecked = document.getElementById('kaffi').checked;
    const fuelTraktorChecked = document.getElementById('fuelTraktor').checked;
    const vaskeGulvChecked = document.getElementById('vaskeGulv').checked;
    const vaskeHelikopterChecked = document.getElementById('vaskeHelikopter').checked;
    const tommeBossChecked = document.getElementById('tommeBoss').checked;
    
    // Two-column layout
    const checkboxStartY = kontrollCardY + 13;
    const checkboxColumn1X = leftMargin + 4;
    const checkboxColumn2X = leftMargin + contentWidth / 2 + 2;
    const checkboxRowHeight = 7.5;
    
    // Row 1
    let checkboxY = checkboxStartY;
    drawCheckboxItem('Kaffi', kaffiChecked, checkboxColumn1X, checkboxY);
    drawCheckboxItem('Fuel traktor', fuelTraktorChecked, checkboxColumn2X, checkboxY);
    checkboxY += checkboxRowHeight;
    
    // Row 2
    drawCheckboxItem('Vaske gulv', vaskeGulvChecked, checkboxColumn1X, checkboxY);
    drawCheckboxItem('Tømme boss', tommeBossChecked, checkboxColumn2X, checkboxY);
    checkboxY += checkboxRowHeight;
    
    // Row 3
    drawCheckboxItem('Vaske helikopter', vaskeHelikopterChecked, checkboxColumn1X, checkboxY);
    
    yPos = kontrollCardY + kontrollCardHeight + 6;
    
    // Helikoptre Section - Modern card design
    const heliCardY = yPos;
    let heliCardHeight = 0;
    let heliContentY = heliCardY;
    
    // Calculate total height needed
    let totalHeliHeight = 12; // Title + padding
    if (heliOXH) {
        totalHeliHeight += 14;
        if (heliOXHText) {
            const lines = doc.splitTextToSize(heliOXHText || '', contentWidth - 12);
            totalHeliHeight += lines.length * 4.5;
        }
    }
    if (heliOXI) {
        totalHeliHeight += 14;
        if (heliOXIText) {
            const lines = doc.splitTextToSize(heliOXIText || '', contentWidth - 12);
            totalHeliHeight += lines.length * 4.5;
        }
    }
    if (heliOXJ) {
        totalHeliHeight += 14;
        if (heliOXJText) {
            const lines = doc.splitTextToSize(heliOXJText || '', contentWidth - 12);
            totalHeliHeight += lines.length * 4.5;
        }
    }
    if (heliOXK) {
        totalHeliHeight += 14;
        if (heliOXKText) {
            const lines = doc.splitTextToSize(heliOXKText || '', contentWidth - 12);
            totalHeliHeight += lines.length * 4.5;
        }
    }
    if (!heliOXH && !heliOXI && !heliOXJ && !heliOXK) {
        totalHeliHeight += 8;
    }
    heliCardHeight = Math.max(totalHeliHeight, 22);
    
    // Card background
    doc.setFillColor(bgPrimary[0], bgPrimary[1], bgPrimary[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(leftMargin, heliCardY, contentWidth, heliCardHeight, 2, 2, 'FD');
    } else {
        doc.rect(leftMargin, heliCardY, contentWidth, heliCardHeight, 'FD');
    }
    
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlueDark[0], primaryBlueDark[1], primaryBlueDark[2]);
    doc.text('Helikoptre', leftMargin + 4, heliCardY + 6);
    
    heliContentY = heliCardY + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Helper function to draw status badge
    const drawStatusBadge = (status, x, y) => {
        const statusText = `Status: ${status}`;
        const textWidth = doc.getTextWidth(statusText);
        const badgePadding = 2;
        const badgeHeight = 5;
        const badgeWidth = textWidth + (badgePadding * 2);
        
        if (status === 'SERVICEABLE') {
            doc.setFillColor(successGreen[0], successGreen[1], successGreen[2]);
            doc.setTextColor(255, 255, 255);
        } else if (status === 'UNSERVICEABLE') {
            doc.setFillColor(errorRed[0], errorRed[1], errorRed[2]);
            doc.setTextColor(255, 255, 255);
        }
        
            if (typeof doc.roundedRect === 'function') {
                doc.roundedRect(x, y - 3.5, badgeWidth, badgeHeight, 1, 1, 'F');
            } else {
                doc.rect(x, y - 3.5, badgeWidth, badgeHeight, 'F');
            }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(statusText, x + badgePadding, y);
        
        // Reset
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        return badgeWidth;
    };

    const drawHeliStatusAndText = (titleText, status, text) => {
        const titleY = heliContentY;

        if (status) {
            const badgeX = leftMargin + 4 + doc.getTextWidth(titleText) + 6;
            drawStatusBadge(status, badgeX, titleY);
        }

        heliContentY += 5.5;

        if (text) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
            const lines = doc.splitTextToSize(text, contentWidth - 8);
            doc.text(lines, leftMargin + 4, heliContentY);
            heliContentY += (lines.length * 4.5) + 3;
        } else if (status) {
            heliContentY += 2;
        }
    };
    
    const selectedHelicopters = [];
    if (heliOXH) selectedHelicopters.push({ title: 'LN-OXH', status: heliOXHStatus, text: heliOXHText });
    if (heliOXI) selectedHelicopters.push({ title: 'LN-OXI', status: heliOXIStatus, text: heliOXIText });
    if (heliOXJ) selectedHelicopters.push({ title: 'LN-OXJ', status: heliOXJStatus, text: heliOXJText });
    if (heliOXK) selectedHelicopters.push({ title: 'LN-OXK', status: heliOXKStatus, text: heliOXKText });

    selectedHelicopters.forEach((helicopter, index) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.text(helicopter.title, leftMargin + 4, heliContentY);
        drawHeliStatusAndText(helicopter.title, helicopter.status, helicopter.text);

        if (index < selectedHelicopters.length - 1) {
            doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
            doc.setLineWidth(0.3);
            doc.line(leftMargin + 4, heliContentY, leftMargin + contentWidth - 4, heliContentY);
            heliContentY += 4;
        }
    });
    
    if (!heliOXH && !heliOXI && !heliOXJ && !heliOXK) {
        doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
        doc.text('(Ingen helikoptre valgt)', leftMargin + 4, heliContentY);
    }
    
    yPos = heliCardY + heliCardHeight + 6;
    
    // Add uploaded files/attachments
    const pdfVedlegg = [];
    if (files && files.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - bottomMargin - 30) {
            doc.addPage();
            yPos = topMargin;
        }
        
        yPos += 5;
        
        // Vedlegg Card Section
        const vedleggCardY = yPos;
        
        // Section title (outside card)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryBlueDark[0], primaryBlueDark[1], primaryBlueDark[2]);
        doc.text('Vedlegg', leftMargin, vedleggCardY);
        yPos += 8;

        if (files.some(f => !f.isImage && f.fil)) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
            doc.text('PDF-vedlegg ligger bakerst i rapporten: klikk på navnet. De kan også lastes ned fra vedleggspanelet i PDF-leseren.', leftMargin, yPos - 2);
            yPos += 4;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        
        files.forEach((file, index) => {
            // Check if we need a new page
            if (yPos > pageHeight - bottomMargin - 30) {
                doc.addPage();
                yPos = topMargin;
            }
            
            if (file.isImage && file.data) {
                try {
                    // Add image to PDF (use full content width)
                    const imgWidth = contentWidth;
                    const imgHeight = (imgWidth * 0.75); // Maintain aspect ratio (approximate)
                    
                    // Check if image fits on current page
                    if (yPos + imgHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPos = topMargin;
                    }
                    
                    // Add image with border
                    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                    doc.setLineWidth(0.3);
                    doc.rect(leftMargin - 1, yPos - 1, imgWidth + 2, imgHeight + 2, 'S');
                    
                    doc.addImage(file.data, 'JPEG', leftMargin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 5;
                    
                    // Add filename below image with card style
                    doc.setFillColor(bgSecondary[0], bgSecondary[1], bgSecondary[2]);
                    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
                    doc.setLineWidth(0.3);
                    const filenameBoxHeight = 5;
                    if (typeof doc.roundedRect === 'function') {
                        doc.roundedRect(leftMargin, yPos, contentWidth, filenameBoxHeight, 1, 1, 'FD');
                    } else {
                        doc.rect(leftMargin, yPos, contentWidth, filenameBoxHeight, 'FD');
                    }
                    
                    doc.setFontSize(8);
                    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
                    doc.setFont('helvetica', 'normal');
                    doc.text(file.name, leftMargin + 3, yPos + 3.5);
                    yPos += filenameBoxHeight + 4;
                    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
                    doc.setFontSize(9);
                } catch (error) {
                    console.error('Error adding image to PDF:', error);
                    doc.text(`${file.name} (kunne ikke legges til)`, leftMargin, yPos);
                    yPos += 5.5;
                }
            } else {
                // PDF file or other - display in card style
                doc.setFillColor(bgSecondary[0], bgSecondary[1], bgSecondary[2]);
                doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                doc.setLineWidth(0.3);
                if (typeof doc.roundedRect === 'function') {
                    doc.roundedRect(leftMargin, yPos - 3, contentWidth, 6, 1, 1, 'FD');
                } else {
                    doc.rect(leftMargin, yPos - 3, contentWidth, 6, 'FD');
                }
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                if (file.fil) {
                    // Lenken til vedlegget legges på etter at PDF-en er satt sammen (vaktLeggVedPdfVedlegg).
                    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
                    doc.text(`PDF:  ${file.name}`, leftMargin + 3, yPos);
                    doc.setFontSize(8);
                    doc.text('Åpne vedlegg >', leftMargin + contentWidth - 3, yPos, { align: 'right' });
                    pdfVedlegg.push({
                        fil: file.fil, navn: file.name, side: doc.internal.getNumberOfPages(),
                        x: leftMargin, y: yPos - 3, b: contentWidth, h: 6
                    });
                } else {
                    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
                    doc.text(`PDF:  ${file.name}`, leftMargin + 3, yPos);
                }
                doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
                yPos += 7;
            }
        });
    }
    
    // Generate filename with base, vakttype and date
    const sanitizedBase = sanitizeForFilename(base || 'Ukjent');
    const sanitizedVakttype = sanitizeForFilename(vakttype || 'Ukjent');
    const formattedDate = formatDateForFilename(date);
    const filename = `Vaktrapport_${sanitizedBase}_${sanitizedVakttype}_${formattedDate}.pdf`;
    
    // Save report data to register
    const reportData = {
        date: date,
        base: base,
        vakttype: vakttype,
        person: person,
        statusBase: statusBase,
        filePath: filePath,
        kaffi: kaffiChecked,
        fuelTraktor: fuelTraktorChecked,
        vaskeGulv: vaskeGulvChecked,
        vaskeHelikopter: vaskeHelikopterChecked,
        tommeBoss: tommeBossChecked,
        heliOXH: heliOXH,
        heliOXHText: heliOXHText,
        heliOXHStatus: heliOXHStatus,
        heliOXI: heliOXI,
        heliOXIText: heliOXIText,
        heliOXIStatus: heliOXIStatus,
        heliOXJ: heliOXJ,
        heliOXJText: heliOXJText,
        heliOXJStatus: heliOXJStatus,
        heliOXK: heliOXK,
        heliOXKText: heliOXKText,
        heliOXKStatus: heliOXKStatus,
        isDraft: false,
        timestamp: new Date().toISOString()
    };
    if (shouldSaveToRegister) {
        saveReportToRegister(reportData);
    }
    
    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        const footerY = pageHeight - 6;
        doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
        doc.rect(0, footerY, pageWidth, 6, 'F');
        
        // Footer text
        doc.setFontSize(6);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        const footerText = `Side ${i} av ${pageCount} | Generert ${new Date().toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}`;
        doc.text(footerText, pageWidth / 2, footerY + 4, { align: 'center' });
        
        // Footer line
        doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setLineWidth(0.3);
        doc.line(0, footerY, pageWidth, footerY);
    }
    
    // Save PDF. PDF-vedlegg legges inn bakerst med lenke før nedlasting.
    if (pdfVedlegg.length === 0) {
        doc.save(filename);
        window.dispatchEvent(new Event('vaktrapport:pdfExported'));
        return;
    }
    vaktLeggVedPdfVedlegg(doc.output('arraybuffer'), pdfVedlegg)
        .then(function(bytes) {
            vaktLastNedPdf(bytes, filename);
            window.dispatchEvent(new Event('vaktrapport:pdfExported'));
        })
        .catch(function(err) {
            console.error('Kunne ikke legge ved PDF-vedlegg:', err);
            alert('PDF-vedleggene kunne ikke legges inn i rapporten. Rapporten lastes ned uten dem – legg dem ved e-posten manuelt.');
            doc.save(filename);
            window.dispatchEvent(new Event('vaktrapport:pdfExported'));
        });
}

// Laster ned ferdige PDF-bytes med riktig filnavn.
function vaktLastNedPdf(bytes, filnavn) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const lenke = document.createElement('a');
    lenke.href = url;
    lenke.download = filnavn;
    document.body.appendChild(lenke);
    lenke.click();
    lenke.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
}

// Legger PDF-vedleggene inn i rapporten med pdf-lib:
//  - sidene i vedlegget kopieres inn bakerst i rapporten,
//  - navnet i vedleggslista blir en lenke til første side av vedlegget
//    (virker i alle PDF-lesere, også for de som får rapporten på e-post),
//  - fila legges også ved som filvedlegg, så den kan lastes ned for seg fra
//    vedleggspanelet i PDF-leseren (Adobe, Chrome m.fl.).
// Et vedlegg som ikke kan leses (f.eks. passordbeskyttet) legges bare ved som fil.
async function vaktLeggVedPdfVedlegg(rapportBytes, vedlegg) {
    if (!window.PDFLib) throw new Error('pdf-lib er ikke lastet');
    const { PDFDocument, PDFName } = window.PDFLib;
    const pdf = await PDFDocument.load(rapportBytes);
    const mmTilPt = 72 / 25.4;

    for (const v of vedlegg) {
        const bytes = new Uint8Array(await v.fil.arrayBuffer());
        let forsteSide = null;
        try {
            const kilde = await PDFDocument.load(bytes, { ignoreEncryption: true });
            const sider = await pdf.copyPages(kilde, kilde.getPageIndices());
            sider.forEach(function(side) { pdf.addPage(side); });
            if (sider.length) forsteSide = pdf.getPage(pdf.getPageCount() - sider.length);
        } catch (err) {
            console.warn('Kunne ikke kopiere sidene i ' + v.navn + ', legges bare ved som fil:', err);
        }
        await pdf.attach(bytes, v.navn, {
            mimeType: 'application/pdf',
            description: 'Vedlegg til vaktrapport',
            creationDate: new Date(),
            modificationDate: new Date()
        });
        if (forsteSide) {
            const side = pdf.getPage(v.side - 1);
            const hoyde = side.getHeight();
            const lenke = pdf.context.obj({
                Type: 'Annot',
                Subtype: 'Link',
                Rect: [v.x * mmTilPt, hoyde - (v.y + v.h) * mmTilPt, (v.x + v.b) * mmTilPt, hoyde - v.y * mmTilPt],
                Border: [0, 0, 0],
                Dest: [forsteSide.ref, PDFName.of('Fit')]
            });
            side.node.addAnnot(pdf.context.register(lenke));
        }
    }
    return pdf.save();
}

// formatDate, formatDateForFilename og sanitizeForFilename ligger i common.js.

// ============================================
// LIVE STATUS PER BASE
// ============================================
// Alt i skjemaet (unntatt dato og vedlegg) lagres fortløpende i Firestore som
// dokumentet «live-<base>» i samlingen vaktrapporter, og vises med en gang hos
// alle som har valgt samme base, slik som på baseteknikersiden. Det finnes
// derfor ingen utkast: ved vaktslutt eksporteres PDF, og siste PDF ligger i
// arkivet nederst. Hvert felt lagres for seg (merge), så to personer kan
// skrive i hvert sitt felt samtidig uten å overskrive hverandre.

const VAKT_HELIKOPTRE = ['heliOXH', 'heliOXI', 'heliOXJ', 'heliOXK'];
const VAKT_KONTROLLPUNKTER = ['kaffi', 'fuelTraktor', 'vaskeGulv', 'vaskeHelikopter', 'tommeBoss'];
const VAKT_TEKSTFELT = ['statusBase'].concat(VAKT_HELIKOPTRE.map(function(h) { return h + 'Text'; }));
const VAKT_LIVE_FELT = ['vakttype', 'person', 'statusBase']
    .concat(VAKT_KONTROLLPUNKTER)
    .concat([].concat.apply([], VAKT_HELIKOPTRE.map(function(h) { return [h, h + 'Text', h + 'Status']; })));
const VAKT_SIST_BASE = 'vakt_sist_base';

var vaktLiveBase = '';
var vaktLiveStopp = null;
var vaktLiveKlar = false;     // første svar for basen er mottatt
var vaktAnvender = false;     // skjemaet fylles fra live-data (ikke lagre tilbake)
var vaktVentende = {};        // felt -> timer for lagring mens man skriver
var vaktLiveData = {};
var vaktFraAnnenBase = false; // skjemaet viser en annen base sin status

function vaktLiveDokId(base) {
    return 'live-' + base;
}

function vaktLesFelt(felt) {
    if (felt === 'person') return (document.getElementById('person').value || '').trim();
    if (/Status$/.test(felt) && VAKT_HELIKOPTRE.indexOf(felt.replace(/Status$/, '')) !== -1) {
        var radio = document.querySelector('input[name="' + felt + '"]:checked');
        return radio ? radio.value : '';
    }
    var el = document.getElementById(felt);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value;
}

function vaktLagreFelter(felter) {
    if (!vaktLiveBase || !vaktLiveKlar || vaktAnvender) return;
    var data = { base: vaktLiveBase, art: 'live', oppdatert: new Date().toISOString() };
    felter.forEach(function(felt) { data[felt] = vaktLesFelt(felt); });
    Object.assign(vaktLiveData, data);
    var base = vaktLiveBase;

    if (window.firestoreDb) {
        window.firestoreDb.collection('vaktrapporter').doc(vaktLiveDokId(base)).set(data, { merge: true })
            .catch(function(err) {
                console.error('Kunne ikke lagre live-status:', err);
                vaktVisLiveInfo('Kunne ikke lagre. Sjekk nettforbindelsen – endringene dine er ikke delt.', true);
            });
    } else {
        try {
            var lagret = JSON.parse(localStorage.getItem('vakt_live_' + base) || '{}');
            localStorage.setItem('vakt_live_' + base, JSON.stringify(Object.assign(lagret, data)));
        } catch (e) { /* lagring ikke tilgjengelig */ }
    }
    vaktVisLiveInfo();
}

// Tekst lagres når man tar en liten pause i skrivingen, så det ikke blir en
// lagring per tastetrykk.
function vaktPlanleggLagring(felt, ms) {
    if (vaktAnvender) return;
    clearTimeout(vaktVentende[felt]);
    vaktVentende[felt] = setTimeout(function() {
        delete vaktVentende[felt];
        vaktLagreFelter([felt]);
    }, ms);
}

function vaktLagreNaa(felt) {
    if (vaktVentende[felt] === undefined) return;
    clearTimeout(vaktVentende[felt]);
    delete vaktVentende[felt];
    vaktLagreFelter([felt]);
}

function vaktLagreAltVentende() {
    Object.keys(vaktVentende).forEach(vaktLagreNaa);
}

// Et felt man skriver i (eller har ulagret tekst i) overskrives ikke av live-data.
// Ved bytte av base (tving) overskrives alt, så ingenting henger igjen fra forrige base.
var vaktTving = false;
function vaktErIBruk(el, felt) {
    if (vaktTving) return false;
    return (el && document.activeElement === el) || vaktVentende[felt] !== undefined;
}

function vaktBrukLiveData(data, tving) {
    vaktLiveData = data || {};
    vaktAnvender = true;
    vaktTving = !!tving;
    try {
        var vakttype = document.getElementById('vakttype');
        if (!vaktErIBruk(vakttype, 'vakttype')) {
            var verdi = vaktLiveData.vakttype || '';
            vakttype.value = Array.prototype.some.call(vakttype.options, function(o) { return o.value === verdi; }) ? verdi : '';
            if (window.vaktOppdaterTittel) window.vaktOppdaterTittel();
        }

        var ekstra = document.getElementById('personExtra');
        if (!vaktErIBruk(ekstra, 'person') && window.settPersonerFraTekst &&
            (vaktLiveData.person || '') !== (document.getElementById('person').value || '').trim()) {
            window.settPersonerFraTekst(vaktLiveData.person || '');
        }

        var status = document.getElementById('statusBase');
        if (!vaktErIBruk(status, 'statusBase') && status.value !== (vaktLiveData.statusBase || '')) {
            status.value = vaktLiveData.statusBase || '';
        }

        VAKT_KONTROLLPUNKTER.forEach(function(id) {
            document.getElementById(id).checked = !!vaktLiveData[id];
        });

        VAKT_HELIKOPTRE.forEach(function(h) {
            var boks = document.getElementById(h);
            var paa = !!vaktLiveData[h];
            if (boks.checked !== paa) {
                boks.checked = paa;
                if (window.vaktHeliVis) window.vaktHeliVis(boks);
            }
            if (!paa) return;
            var tekst = document.getElementById(h + 'Text');
            if (!vaktErIBruk(tekst, h + 'Text') && tekst.value !== (vaktLiveData[h + 'Text'] || '')) {
                tekst.value = vaktLiveData[h + 'Text'] || '';
            }
            document.querySelectorAll('input[name="' + h + 'Status"]').forEach(function(radio) {
                radio.checked = radio.value === vaktLiveData[h + 'Status'];
            });
        });
    } finally {
        vaktAnvender = false;
        vaktTving = false;
    }
    vaktVisLiveInfo();
}

function vaktFormatTid(iso) {
    var d = new Date(iso || '');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('no-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function vaktVisLiveInfo(feilmelding, erFeil) {
    var el = document.getElementById('vaktLiveInfo');
    if (!el) return;
    el.classList.toggle('er-feil', !!erFeil);
    if (feilmelding) {
        el.textContent = feilmelding;
        return;
    }
    if (!vaktLiveBase) {
        el.innerHTML = 'Velg base for å se og dele live status for vakten.';
        return;
    }
    if (!vaktLiveKlar) {
        el.innerHTML = '<span class="live-badge">Live</span> Henter status for ' + escapeHtml(vaktLiveBase) + '…';
        return;
    }
    var tid = vaktFormatTid(vaktLiveData.oppdatert);
    el.innerHTML = '<span class="live-badge">Live</span> ' + escapeHtml(vaktLiveBase) +
        (tid ? ' · sist oppdatert ' + escapeHtml(tid) : '') +
        ' · Endringer lagres fortløpende og vises for alle på basen.';
}

function vaktMottaLiveData(base, data) {
    if (base !== vaktLiveBase) return;
    var forste = !vaktLiveKlar;
    vaktLiveKlar = true;
    if (forste && !data) {
        if (vaktFraAnnenBase) {
            // Byttet fra en annen base: start tomt, ikke kopier den andre basens status.
            vaktBrukLiveData({}, true);
        } else {
            // Første gang basen brukes: det som står i skjemaet blir utgangspunktet.
            vaktLagreFelter(VAKT_LIVE_FELT);
        }
        return;
    }
    vaktBrukLiveData(data || {}, forste);
}

function vaktByttBase(base) {
    vaktLagreAltVentende();
    if (vaktLiveStopp) vaktLiveStopp();
    vaktLiveStopp = null;
    vaktFraAnnenBase = vaktFraAnnenBase || !!vaktLiveBase;
    vaktLiveBase = base || '';
    vaktLiveKlar = false;
    vaktLiveData = {};
    try {
        if (base) localStorage.setItem(VAKT_SIST_BASE, base);
    } catch (e) { /* lagring ikke tilgjengelig */ }
    vaktVisLiveInfo();
    if (!base) return;

    if (window.firestoreDb) {
        vaktLiveStopp = window.firestoreDb.collection('vaktrapporter').doc(vaktLiveDokId(base))
            .onSnapshot(function(snap) {
                vaktMottaLiveData(base, snap.exists ? snap.data() : null);
            }, function(err) {
                console.error('Kunne ikke hente live-status:', err);
                vaktVisLiveInfo('Kunne ikke hente live-status fra skyen. Sjekk nettforbindelsen.', true);
            });
        return;
    }
    var lokal = null;
    try { lokal = JSON.parse(localStorage.getItem('vakt_live_' + base) || 'null'); } catch (e) { /* ugyldig */ }
    vaktMottaLiveData(base, lokal);
}

function vaktFeltFraElement(el) {
    if (!el) return '';
    if (el.name && /^heliOX.Status$/.test(el.name)) return el.name;
    if (VAKT_TEKSTFELT.indexOf(el.id) !== -1 || VAKT_KONTROLLPUNKTER.indexOf(el.id) !== -1) return el.id;
    return '';
}

// Nullstiller live-statusen for basen (for alle). Spør først.
function vaktNullstillLive() {
    if (!vaktLiveBase) {
        alert('Velg base først.');
        return;
    }
    if (!confirm('Nullstille alt for ' + vaktLiveBase + '?\n\nStatus, personer, helikoptre og kontrollpunkter ' +
        'tømmes for alle som jobber på basen. Siste PDF i arkivet berøres ikke.')) return;
    Object.keys(vaktVentende).forEach(function(f) { clearTimeout(vaktVentende[f]); });
    vaktVentende = {};
    var tom = { base: vaktLiveBase, art: 'live', oppdatert: new Date().toISOString() };
    VAKT_LIVE_FELT.forEach(function(felt) {
        tom[felt] = (VAKT_KONTROLLPUNKTER.indexOf(felt) !== -1 || VAKT_HELIKOPTRE.indexOf(felt) !== -1) ? false : '';
    });
    if (window.firestoreDb) {
        window.firestoreDb.collection('vaktrapporter').doc(vaktLiveDokId(vaktLiveBase)).set(tom)
            .catch(function(err) {
                console.error('Kunne ikke nullstille:', err);
                alert('Kunne ikke nullstille. Sjekk nettforbindelsen og prøv igjen.');
            });
    } else {
        try { localStorage.setItem('vakt_live_' + vaktLiveBase, JSON.stringify(tom)); } catch (e) { /* lagring ikke tilgjengelig */ }
        vaktBrukLiveData(tom);
    }
    if (window.vaktNullstillSteg) window.vaktNullstillSteg();
}

function vaktLiveStart() {
    var skjema = document.getElementById('reportForm');
    var baseValg = document.getElementById('base');

    // Enter i et felt skal aldri sende skjemaet og laste siden på nytt.
    skjema.addEventListener('submit', function(e) { e.preventDefault(); });
    skjema.addEventListener('input', function(e) {
        var felt = vaktFeltFraElement(e.target);
        if (felt && VAKT_TEKSTFELT.indexOf(felt) !== -1) vaktPlanleggLagring(felt, 600);
    });
    skjema.addEventListener('change', function(e) {
        var el = e.target;
        if (el.id === 'base') {
            vaktByttBase(el.value);
            return;
        }
        if (el.id === 'vakttype') {
            if (el.value !== 'Basetekniker') vaktLagreFelter(['vakttype']);
            return;
        }
        if (el.id === 'personDropdown' || el.id === 'personExtra') {
            vaktLagreNaa('person');
            return;
        }
        if (el.classList.contains('helicopter-checkbox')) {
            vaktLagreFelter([el.id, el.id + 'Text', el.id + 'Status']);
            return;
        }
        var felt = vaktFeltFraElement(el);
        if (!felt) return;
        if (VAKT_TEKSTFELT.indexOf(felt) !== -1) vaktLagreNaa(felt);
        else vaktLagreFelter([felt]);
    });
    skjema.addEventListener('focusout', function(e) {
        var felt = vaktFeltFraElement(e.target);
        if (felt) vaktLagreNaa(felt);
        if (e.target.id === 'personExtra') vaktLagreNaa('person');
    });

    window.vaktPersonEndret = function() {
        vaktPlanleggLagring('person', 600);
    };

    var nullstill = document.getElementById('resetLive');
    if (nullstill) nullstill.addEventListener('click', vaktNullstillLive);

    // Ulagret tekst sendes før siden lukkes eller legges i bakgrunnen.
    window.addEventListener('pagehide', vaktLagreAltVentende);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') vaktLagreAltVentende();
    });
    // Uten Firebase: hold flere faner i samme nettleser i takt.
    window.addEventListener('storage', function(e) {
        if (!window.firestoreDb && vaktLiveBase && e.key === 'vakt_live_' + vaktLiveBase) {
            try { vaktBrukLiveData(JSON.parse(e.newValue || '{}')); } catch (err) { /* ugyldig */ }
        }
    });

    var sist = '';
    try { sist = localStorage.getItem(VAKT_SIST_BASE) || ''; } catch (e) { /* lagring ikke tilgjengelig */ }
    var gyldig = Array.prototype.some.call(baseValg.options, function(o) { return o.value && o.value === sist; });
    if (gyldig) baseValg.value = sist;
    vaktByttBase(baseValg.value);
}
