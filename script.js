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
    function handleHelicopterChange(checkbox) {
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
            // Focus after a short delay
            setTimeout(() => {
                textField.focus();
            }, 50);
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

    // Bruk samme UI-logikk ved lasting av rapport som ved manuell avhuking.
    window.applyLoadedHelicopterState = function(heliId, isChecked, notes, statusValue) {
        const checkbox = document.getElementById(heliId);
        if (!checkbox) return;

        checkbox.checked = !!isChecked;
        handleHelicopterChange(checkbox);

        const textField = document.getElementById(heliId + 'Text');
        const statusDiv = document.getElementById(heliId + 'Status');
        if (!textField || !statusDiv) return;

        if (checkbox.checked) {
            textField.value = notes || '';
            if (statusValue) {
                const statusRadio = statusDiv.querySelector(`input[value="${statusValue}"]`);
                if (statusRadio) statusRadio.checked = true;
            }
        }
    };
    
    // Add event listeners to all helicopter checkboxes
    const helicopterCheckboxes = document.querySelectorAll('.helicopter-checkbox');
    
    helicopterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleHelicopterChange(this);
        });
        // Sett initial visning ved last av side
        handleHelicopterChange(checkbox);
    });

    // PDF Export functionality
    const exportPdfBtn = document.getElementById('exportPdf');
    const sharepointBtn = document.getElementById('openSharepointMappe');
    const sendEmailBtn = document.getElementById('sendEmail');
    const saveDraftBtn = document.getElementById('saveDraft');
    exportPdfBtn.addEventListener('click', function() {
        generatePDF();
    });
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            saveDraftReport();
        });
    }

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
    }
    
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
            } else if (file.type === 'application/pdf') {
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    data: null,
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
    
    // Reset title and hide status fields when form is reset
    const reportForm = document.getElementById('reportForm');
    reportForm.addEventListener('reset', function() {
        setTimeout(() => {
            clearLoadedDraftMeta();
            reportTitle.textContent = 'Vaktrapport';
            setDateToToday();
            // Hide all helicopter status fields
            document.querySelectorAll('.helicopter-status').forEach(statusDiv => {
                statusDiv.style.display = 'none';
            });
            // Clear all helicopter status radio selections
            document.querySelectorAll('.helicopter-status input[type="radio"]').forEach(radio => {
                radio.checked = false;
            });
            // Clear person selections
            selectedPersons = [];
            if (window.selectedPersons) {
                window.selectedPersons.length = 0;
            }
            document.getElementById('personDropdown').value = '';
            document.getElementById('personExtra').value = '';
            if (window.updatePersonField) {
                window.updatePersonField();
            }
            if (window.updatePersonDropdown) {
                window.updatePersonDropdown();
            }
            // Clear uploaded files
            if (window.uploadedFiles) {
                window.uploadedFiles.length = 0;
            }
            if (window.updateUploadedFilesDisplay) {
                window.updateUploadedFilesDisplay();
            }
            // Nullstill steg-farger for prosessknapper.
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
        }, 0);
    });

    // Load and display report register
    const baseFilter = document.getElementById('reportBaseFilter');
    if (baseFilter) {
        baseFilter.addEventListener('change', applyReportBaseFilter);
    }
    loadReportRegister();

    // Archive modal
    const openArchiveBtn = document.getElementById('openArchive');
    const archiveModal = document.getElementById('archiveModal');
    const closeArchiveBtn = document.getElementById('closeArchive');
    if (openArchiveBtn && archiveModal) {
        openArchiveBtn.addEventListener('click', function() {
            renderArchiveRegister();
            archiveModal.style.display = 'flex';
        });
    }
    if (closeArchiveBtn) {
        closeArchiveBtn.addEventListener('click', closeArchiveModal);
    }
    if (archiveModal) {
        archiveModal.addEventListener('click', function(e) {
            if (e.target === archiveModal) closeArchiveModal();
        });
    }
});

// Store and retrieve reports: Firestore (felles) eller localStorage (lokal fallback)
window.loadedDraftMeta = null;
window.vaktrapportArchivedList = [];

const DRAFT_EXPIRY_DAYS = 14;
const ARCHIVE_AFTER_DAYS = 30;

function daysSinceTimestamp(isoTimestamp) {
    if (!isoTimestamp) return 0;
    var then = new Date(isoTimestamp).getTime();
    if (isNaN(then)) return 0;
    return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function getReportAgeDays(report) {
    var basis = report.date ? (report.date + 'T00:00:00') : report.timestamp;
    if (!basis) return 0;
    var then = new Date(basis).getTime();
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

function closeArchiveModal() {
    var modal = document.getElementById('archiveModal');
    if (modal) modal.style.display = 'none';
}
window.closeArchiveModal = closeArchiveModal;

function renderArchiveRegister() {
    var archiveDiv = document.getElementById('archiveRegister');
    if (!archiveDiv) return;
    var archived = window.vaktrapportArchivedList || [];
    if (archived.length === 0) {
        archiveDiv.innerHTML = '<p class="no-reports">Ingen arkiverte rapporter</p>';
        return;
    }
    archiveDiv.innerHTML = archived.map(function(report) {
        var sourceIndex = report._sourceIndex;
        var reportDate = report.date || 'Ikke angitt';
        var base = report.base || 'Ikke angitt';
        var vakttype = report.vakttype || '';
        var person = report.person || 'Ikke angitt';
        return '<div class="report-item">' +
            '<div class="report-item-info">' +
            '<div class="report-item-date">' + formatDate(reportDate) + '</div>' +
            '<div class="report-item-details">Base: ' + base + (vakttype ? ' | Vakttype: ' + vakttype : '') + ' | Personer: ' + person + '</div>' +
            '</div>' +
            '<div class="report-item-actions">' +
            '<button class="btn-small btn-view" onclick="loadReport(' + sourceIndex + ')">Vis</button>' +
            '<button class="btn-small btn-pdf" onclick="downloadReportPdf(' + sourceIndex + ')">PDF</button>' +
            '<button class="btn-small btn-delete" onclick="deleteReport(' + sourceIndex + ')">Slett</button>' +
            '</div></div>';
    }).join('');
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

function clearLoadedDraftMeta() {
    window.loadedDraftMeta = null;
}

function removeLoadedDraftIfAny() {
    var meta = window.loadedDraftMeta;
    if (!meta || !meta.isDraft) return;

    if (window.firestoreDb && meta.id) {
        window.firestoreDb.collection('vaktrapporter').doc(meta.id).delete()
            .then(function() {
                clearLoadedDraftMeta();
                loadReportRegister();
            })
            .catch(function(err) {
                console.error('Firestore delete loaded draft error:', err);
            });
        return;
    }

    var reports = JSON.parse(localStorage.getItem('vaktrapport_reports') || '[]');
    var draftIndex = -1;

    if (typeof meta.index === 'number' && reports[meta.index] && reports[meta.index].isDraft) {
        draftIndex = meta.index;
    } else if (meta.timestamp) {
        draftIndex = reports.findIndex(function(report) {
            return !!report.isDraft && report.timestamp === meta.timestamp;
        });
    }

    if (draftIndex !== -1) {
        reports.splice(draftIndex, 1);
        localStorage.setItem('vaktrapport_reports', JSON.stringify(reports));
        loadReportRegister();
    }

    clearLoadedDraftMeta();
}

function collectCurrentReportData(isDraft) {
    const date = (document.getElementById('date').value || '').trim();
    const base = (document.getElementById('base').value || '').trim();
    const vakttype = (document.getElementById('vakttype').value || '').trim();
    const person = (document.getElementById('person').value || '').trim();
    const statusBase = (document.getElementById('statusBase').value || '').trim();
    const filePath = 'Sharepoint: \\Technical - Part-145\\Planning\\Status reports - Handover';

    const kaffiChecked = document.getElementById('kaffi').checked;
    const fuelTraktorChecked = document.getElementById('fuelTraktor').checked;
    const vaskeGulvChecked = document.getElementById('vaskeGulv').checked;
    const vaskeHelikopterChecked = document.getElementById('vaskeHelikopter').checked;
    const tommeBossChecked = document.getElementById('tommeBoss').checked;

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

    return {
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
        isDraft: !!isDraft,
        timestamp: new Date().toISOString()
    };
}

function saveDraftReport() {
    const reportData = collectCurrentReportData(true);
    saveReportToRegister(reportData);
    alert('Utkast lagret i arkivet.');
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

    var recent = filtered.filter(function(r) {
        return !!r.isDraft || getReportAgeDays(r) <= ARCHIVE_AFTER_DAYS;
    });
    var archived = filtered.filter(function(r) {
        return !r.isDraft && getReportAgeDays(r) > ARCHIVE_AFTER_DAYS;
    });

    window.vaktrapportArchivedList = archived;
    renderReportRegister(recent, registerDiv);
    renderArchiveRegister();

    var openArchiveBtn = document.getElementById('openArchive');
    if (openArchiveBtn) {
        openArchiveBtn.textContent = archived.length > 0 ? 'Arkiv (' + archived.length + ')' : 'Arkiv';
    }
}

function renderReportRegister(reports, registerDiv) {
    if (!reports || reports.length === 0) {
        registerDiv.innerHTML = '<p class="no-reports">Ingen tidligere rapporter registrert</p>';
        return;
    }
    var drafts = reports.filter(function(report) { return !!report.isDraft; });
    var regular = reports.filter(function(report) { return !report.isDraft; });

    function renderRows(rows) {
        return rows.map(function(report, index) {
        var sourceIndex = (typeof report._sourceIndex === 'number') ? report._sourceIndex : index;
        var reportDate = report.date || 'Ikke angitt';
        var base = report.base || 'Ikke angitt';
        var vakttype = report.vakttype || '';
        var person = report.person || 'Ikke angitt';
        var draftBadge = report.isDraft ? '<span class="report-badge">Utkast</span>' : '';
        return '<div class="report-item">' +
            '<div class="report-item-info">' +
            '<div class="report-item-date">' + formatDate(reportDate) + draftBadge + '</div>' +
            '<div class="report-item-details">Base: ' + base + (vakttype ? ' | Vakttype: ' + vakttype : '') + ' | Personer: ' + person + '</div>' +
            '</div>' +
            '<div class="report-item-actions">' +
            '<button class="btn-small btn-view" onclick="loadReport(' + sourceIndex + ')">Vis</button>' +
            '<button class="btn-small btn-pdf" onclick="downloadReportPdf(' + sourceIndex + ')">PDF</button>' +
            '<button class="btn-small btn-delete" onclick="deleteReport(' + sourceIndex + ')">Slett</button>' +
            '</div></div>';
        }).join('');
    }

    var sections = '';
    if (drafts.length > 0) {
        sections += '<h3 class="report-group-title">Utkast</h3>' + renderRows(drafts);
    }
    if (regular.length > 0) {
        sections += '<h3 class="report-group-title">Tidligere rapporter</h3>' + renderRows(regular);
    }
    registerDiv.innerHTML = sections || '<p class="no-reports">Ingen tidligere rapporter registrert</p>';
}

function loadReport(index) {
    var reports = window.vaktrapportDocsList || [];
    if (index < 0 || index >= reports.length) return;
    var report = reports[index];
    closeArchiveModal();
    window.loadedDraftMeta = {
        isDraft: !!report.isDraft,
        id: report.id || null,
        index: index,
        timestamp: report.timestamp || null
    };
        
        // Populate form with report data
        setDateToToday();
        if (report.base) document.getElementById('base').value = report.base;
        if (report.vakttype) {
            document.getElementById('vakttype').value = report.vakttype;
            // Update title when loading report
            const reportTitle = document.getElementById('reportTitle');
            reportTitle.textContent = `Vaktrapport - ${report.vakttype}`;
        }
        
        // Load person selections
        if (report.person) {
            const personNames = report.person.split(',').map(n => n.trim()).filter(n => n);
            const knownNames = [
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
            const extraNames = [];
            
            // Clear previous selections
            if (window.selectedPersons) {
                window.selectedPersons.length = 0;
            }
            selectedPersons = [];
            
            personNames.forEach(name => {
                if (knownNames.includes(name)) {
                    if (!selectedPersons.includes(name)) {
                        selectedPersons.push(name);
                    }
                } else if (name) {
                    extraNames.push(name);
                }
            });
            
            if (extraNames.length > 0) {
                document.getElementById('personExtra').value = extraNames.join(', ');
            } else {
                document.getElementById('personExtra').value = '';
            }
            
            if (window.updatePersonField) {
                window.updatePersonField();
            }
            if (window.updatePersonDropdown) {
                window.updatePersonDropdown();
            }
        }
        document.getElementById('statusBase').value = report.statusBase || '';
        
        document.getElementById('kaffi').checked = report.kaffi || false;
        document.getElementById('fuelTraktor').checked = report.fuelTraktor || false;
        document.getElementById('vaskeGulv').checked = report.vaskeGulv || false;
        document.getElementById('vaskeHelikopter').checked = report.vaskeHelikopter || false;
        document.getElementById('tommeBoss').checked = report.tommeBoss || false;
        
        if (window.applyLoadedHelicopterState) {
            window.applyLoadedHelicopterState('heliOXH', report.heliOXH, report.heliOXHText, report.heliOXHStatus);
            window.applyLoadedHelicopterState('heliOXI', report.heliOXI, report.heliOXIText, report.heliOXIStatus);
            window.applyLoadedHelicopterState('heliOXJ', report.heliOXJ, report.heliOXJText, report.heliOXJStatus);
            window.applyLoadedHelicopterState('heliOXK', report.heliOXK, report.heliOXKText, report.heliOXKStatus);
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
                doc.setFont('helvetica', 'normal');
                doc.text(`📄 ${file.name}`, leftMargin + 3, yPos);
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
        removeLoadedDraftIfAny();
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
    
    // Save PDF
    doc.save(filename);
    window.dispatchEvent(new Event('vaktrapport:pdfExported'));
}

// formatDate, formatDateForFilename og sanitizeForFilename ligger i common.js.
