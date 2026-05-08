// app.js - Full OCR-powered medicine recognition logic
// Comprehensive medicine database for matching
const MEDICINE_DB = [
    "Paracetamol", "Acetaminophen", "Amoxicillin", "Azithromycin", "Ciprofloxacin", "Doxycycline",
    "Metformin", "Atorvastatin", "Rosuvastatin", "Simvastatin", "Losartan", "Telmisartan",
    "Amlodipine", "Nifedipine", "Omeprazole", "Pantoprazole", "Esomeprazole", "Cetirizine",
    "Levocetirizine", "Fexofenadine", "Loratadine", "Montelukast", "Salbutamol", "Albuterol",
    "Budesonide", "Fluticasone", "Prednisolone", "Prednisone", "Dexamethasone", "Hydrochlorothiazide",
    "Furosemide", "Spironolactone", "Clopidogrel", "Aspirin", "Warfarin", "Apixaban",
    "Gabapentin", "Pregabalin", "Tramadol", "Ibuprofen", "Naproxen", "Diclofenac",
    "Celecoxib", "Mefenamic Acid", "Cephalexin", "Cefixime", "Clindamycin", "Fluconazole",
    "Itraconazole", "Metronidazole", "Tinidazole", "Albendazole", "Mebendazole", "Levothyroxine",
    "Carbimazole", "Insulin", "Sitagliptin", "Vildagliptin", "Gliclazide", "Glimepiride",
    "Enalapril", "Ramipril", "Lisinopril", "Carvedilol", "Bisoprolol", "Metoprolol",
    "Digoxin", "Nitroglycerin", "Fenofibrate", "Allopurinol", "Colchicine", "Hydroxychloroquine",
    "Methotrexate", "Sulfasalazine", "Ranitidine", "Famotidine", "Ondansetron", "Domperidone",
    "Metoclopramide", "Loperamide", "Bisacodyl", "Lactulose", "Empagliflozin", "Dapagliflozin",
    "Clonazepam", "Alprazolam", "Lorazepam", "Diazepam", "Escitalopram", "Sertraline",
    "Fluoxetine", "Amitriptyline", "Quetiapine", "Olanzapine", "Risperidone", "Trazodone"
];

// Abbreviations and common misspellings mapping
const SHORTHAND_MAP = {
    "pcm": "Paracetamol", "para": "Paracetamol", "amox": "Amoxicillin", "azy": "Azithromycin",
    "cipro": "Ciprofloxacin", "doxy": "Doxycycline", "met": "Metformin", "atorva": "Atorvastatin",
    "losar": "Losartan", "amlodip": "Amlodipine", "omep": "Omeprazole", "panto": "Pantoprazole",
    "cetz": "Cetirizine", "levo": "Levocetirizine", "mont": "Montelukast", "salb": "Salbutamol",
    "bude": "Budesonide", "pred": "Prednisolone", "dexa": "Dexamethasone", "clopi": "Clopidogrel",
    "gaba": "Gabapentin", "trama": "Tramadol", "ibu": "Ibuprofen", "napro": "Naproxen"
};

// Common drug patterns for regex matching
const DRUG_PATTERNS = [
    { regex: /paracetamol|pcm|acetaminophen/i, name: "Paracetamol" },
    { regex: /amoxicillin|amox/i, name: "Amoxicillin" },
    { regex: /azithromycin|azy|azithro/i, name: "Azithromycin" },
    { regex: /ciprofloxacin|cipro/i, name: "Ciprofloxacin" },
    { regex: /metformin|met/i, name: "Metformin" },
    { regex: /atorvastatin|atorva/i, name: "Atorvastatin" },
    { regex: /losartan|losar/i, name: "Losartan" },
    { regex: /omeprazole|omep/i, name: "Omeprazole" },
    { regex: /amlodipine|amlodip/i, name: "Amlodipine" },
    { regex: /doxycycline|doxy/i, name: "Doxycycline" }
];

let currentImageFile = null;
let currentImageUrl = null;

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const readBtn = document.getElementById('readBtn');
const clearBtn = document.getElementById('clearBtn');
const resultCard = document.getElementById('resultCard');
const medicineNameElem = document.getElementById('medicineName');
const ocrTextElem = document.getElementById('ocrText');
const confidenceMsg = document.getElementById('confidenceMsg');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('.upload-section')) {
        fileInput.click();
    }
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#667eea';
    uploadZone.style.background = '#f0f4ff';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '#cbd5e0';
    uploadZone.style.background = '#f7f9fc';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#cbd5e0';
    uploadZone.style.background = '#f7f9fc';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
    } else {
        alert('Please drop an image file');
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
    }
});

readBtn.addEventListener('click', readPrescription);
clearBtn.addEventListener('click', clearAll);

// Handle image file upload
function handleImageFile(file) {
    currentImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageUrl = e.target.result;
        previewImage.src = currentImageUrl;
        previewArea.style.display = 'block';
        resultCard.style.display = 'none';
        readBtn.disabled = false;
        statusText.innerHTML = '✅ Image loaded. Click "Read Medicine" to analyze.';
    };
    reader.readAsDataURL(file);
}

// Extract medicine name from OCR text
function extractMedicineFromText(ocrText) {
    if (!ocrText || ocrText.trim().length === 0) return null;
    
    const text = ocrText.toLowerCase();
    
    // Check for shorthand mappings first (fastest)
    const words = text.split(/[\s,.;:()\-/]+/);
    for (const word of words) {
        const cleanWord = word.trim().toLowerCase();
        if (SHORTHAND_MAP[cleanWord]) {
            return SHORTHAND_MAP[cleanWord];
        }
    }
    
    // Check regex patterns
    for (const pattern of DRUG_PATTERNS) {
        if (pattern.regex.test(text)) {
            return pattern.name;
        }
    }
    
    // Check direct matches from medicine database
    let bestMatch = null;
    let bestScore = 0;
    
    for (const medicine of MEDICINE_DB) {
        const medLower = medicine.toLowerCase();
        if (text.includes(medLower)) {
            const score = medLower.length / Math.max(text.length, 1);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = medicine;
            }
        }
    }
    
    // Fuzzy matching for partial words
    for (const word of words) {
        if (word.length < 4) continue;
        
        for (const medicine of MEDICINE_DB) {
            const medLower = medicine.toLowerCase();
            // Check if word is contained in medicine name or vice versa
            if (medLower.includes(word) && word.length >= 4) {
                return medicine;
            }
            if (word.includes(medLower) && medLower.length >= 4) {
                return medicine;
            }
        }
    }
    
    return bestMatch;
}

// Perform OCR on image
async function performOCR(imageUrl) {
    return new Promise((resolve, reject) => {
        statusText.innerHTML = '🔄 Initializing OCR engine...';
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        
        Tesseract.recognize(
            imageUrl,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = (m.progress * 100).toFixed(1);
                        progressFill.style.width = `${m.progress * 100}%`;
                        statusText.innerHTML = `📖 Reading prescription... ${progress}%`;
                    } else if (m.status === 'loading tesseract') {
                        statusText.innerHTML = '⏳ Loading OCR engine (first time may take a moment)...';
                    }
                }
            }
        ).then(({ data: { text } }) => {
            progressBar.style.display = 'none';
            statusText.innerHTML = '✅ OCR completed! Analyzing text...';
            resolve(text);
        }).catch((error) => {
            progressBar.style.display = 'none';
            statusText.innerHTML = '❌ OCR failed. Please try a clearer image.';
            reject(error);
        });
    });
}

// Main read function
async function readPrescription() {
    if (!currentImageUrl) {
        alert('Please upload a prescription image first');
        return;
    }
    
    readBtn.disabled = true;
    readBtn.innerHTML = '<span class="loading"></span> Processing...';
    resultCard.style.display = 'none';
    
    try {
        const recognizedText = await performOCR(currentImageUrl);
        
        // Display raw OCR text (truncate if too long)
        let displayText = recognizedText || '(No text detected)';
        if (displayText.length > 1000) {
            displayText = displayText.substring(0, 1000) + '... (truncated)';
        }
        ocrTextElem.innerHTML = `<strong>📝 Extracted Text:</strong><br>${displayText.replace(/\n/g, '<br>')}`;
        
        const medicine = extractMedicineFromText(recognizedText);
        
        if (medicine) {
            medicineNameElem.innerHTML = medicine;
            confidenceMsg.innerHTML = `✅ ✓ Medicine identified from prescription handwriting<br>🔍 Based on OCR analysis of ${recognizedText.length} characters`;
            statusText.innerHTML = '🎉 Medicine successfully identified!';
        } else {
            medicineNameElem.innerHTML = '⚠️ Could not identify';
            confidenceMsg.innerHTML = `❌ No known medicine name found in the prescription text.<br>💡 Make sure the image is clear and the handwriting is legible.<br><br>📌 Tip: Try taking a photo with better lighting and contrast.`;
            statusText.innerHTML = '⚠️ No medicine match found. Try a clearer image.';
        }
        
        resultCard.style.display = 'block';
        
    } catch (error) {
        console.error('OCR Error:', error);
        medicineNameElem.innerHTML = 'Error';
        ocrTextElem.innerHTML = 'Failed to process image. Please ensure the image is clear and try again.';
        confidenceMsg.innerHTML = '❌ OCR processing failed. Try a different image with better lighting and contrast.';
        resultCard.style.display = 'block';
        statusText.innerHTML = '❌ Processing failed';
    } finally {
        readBtn.disabled = false;
        readBtn.innerHTML = '🔍 Read Medicine';
    }
}

// Clear everything
function clearAll() {
    currentImageFile = null;
    currentImageUrl = null;
    fileInput.value = '';
    previewArea.style.display = 'none';
    previewImage.src = '';
    resultCard.style.display = 'none';
    readBtn.disabled = true;
    statusText.innerHTML = '';
    progressBar.style.display = 'none';
    medicineNameElem.innerHTML = '—';
    ocrTextElem.innerHTML = '';
    confidenceMsg.innerHTML = '';
}