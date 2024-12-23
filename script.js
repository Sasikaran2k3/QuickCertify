
let template = null;
let data = null;
let textBoxes = [];
let selectedColumn = '';
let isDragging = false;
let isResizing = false;
let currentTextBox = null;
let currentHandle = null;
let startX, startY, originalX, originalY, originalWidth, originalHeight;
let currentStep = 1;
let isSingleMode = false;

function nextStep() {
    if (isSingleMode) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep++;
        if (currentStep === 4) {
            window.scrollTo(0, 0);
        }
        document.getElementById(`step${currentStep}`).classList.add('active');
        console.log(`step${currentStep}`);
    } else {
        if (currentStep == 1)
            document.getElementById(`step${currentStep}`).classList.remove('active');
        else
            document.getElementById(`Bstep${currentStep}`).classList.remove('active');
        currentStep++;
        if (currentStep === 4) {
            window.scrollTo(0, 0);
        }
        document.getElementById(`Bstep${currentStep}`).classList.add('active');
        console.log(`Bstep${currentStep}`);
    }
    updateProgressBar();

}

function updateProgressBar() {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Previous event listeners and functions remain the same
document.getElementById('templateUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                template = img;
                initCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// document.getElementById('userInput').addEventListener('input', function(e) {
//     document.getElementById('step4').style.display = 'block';
//     document.getElementById('step5').style.display = 'block';
// });

document.getElementById('dataUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const workbook = XLSX.read(event.target.result, {
                type: 'binary'
            });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(firstSheet);

            if (data.length > 0) {
                const columns = Object.keys(data[0]);
                const select = document.getElementById('bulk-form').querySelector('#columnSelect');
                select.innerHTML = columns.map(col =>
                    `<option value="${col}">${col}</option>`
                ).join('');
                // document.getElementById('bulk-form').querySelector('#step3').style.display = 'block';
                // document.getElementById('bulk-form').querySelector('#step4').style.display = 'block';
                // document.getElementById('bulk-form').querySelector('#step5').style.display = 'block';
            }
        };
        reader.readAsBinaryString(file);
    }
});

function initCanvas() {
    const canvas = document.getElementById('certificateCanvas');
    canvas.src = template.src;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const canvas1 = document.getElementById('bulk-form').querySelector('#certificateCanvas');
    canvas1.src = template.src;
    canvas1.style.width = '100%';
    canvas1.style.height = '100%';
}

// Modified and new functions for resizable text boxes
function addTextBox(flag) {
    document.getElementsByClassName("addTextBox")[0].disabled = true;
    document.getElementsByClassName("addTextBox")[1].disabled = true;
    const container = flag === 0 ?
        document.getElementById('bulk-form').querySelector('.canvas-container') :
        document.querySelector('.canvas-container');

    const textBox = document.createElement('div');
    textBox.className = 'text-box';
    currentTextBox = textBox;

    // Select column based on flag
    selectedColumn = flag === 0 ?
        document.getElementById('bulk-form').querySelector('#columnSelect').value :
        document.querySelector('#columnSelect').value;

    // Check if data and selectedColumn are valid
    if (flag === 0) {
        if (data && data.length > 0 && selectedColumn in data[0]) {
            textBox.textContent = data[0][selectedColumn]; // Set text to first row value
        } else {
            textBox.textContent = 'No data available'; // Fallback text
        }
    } else {
        textBox.textContent = document.getElementById('userInput').value;
    }
    // Center the text content and set font size dynamically
    textBox.style.textAlign = 'center';
    textBox.style.lineHeight = '50px'; // Assuming the height is 50px as set below
    textBox.style.fontSize = flag === 0 ? document.getElementById('BfontSize').value + 'px' : document.querySelector('#fontSize').value + 'px'; // Dynamically set font size

    const containerRect = container.getBoundingClientRect();
    textBox.style.left = `${(containerRect.width - 200) / 2}px`;
    textBox.style.top = `${(containerRect.height - 50) / 2}px`;
    textBox.style.width = '200px';
    textBox.style.height = '50px';

    // Add resize handles
    const handles = ['tl', 'tr', 'bl', 'br'];
    handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.dataset.handle = pos;
        textBox.appendChild(handle);
    });

    container.appendChild(textBox);
    textBoxes.push(textBox);


    // Add event listeners
    textBox.addEventListener('mousedown', startDragging);
    textBox.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', startResizing);
    });

    // Update font size dynamically
    document.getElementById('fontSize').addEventListener('change', function() {
        textBox.style.fontSize = this.value + 'px';
    });
}

function updatePreview(type) {
    if (currentTextBox) {
        switch (type) {
            case 'color':
                currentTextBox.style.color = document.getElementById(isSingleMode?'colorPicker':'BcolorPicker').value;
                break;
            case 'font':
                currentTextBox.style.fontFamily = document.getElementById(isSingleMode?'fontSelect':'BfontSelect').value;
                break;
            case 'font-size':
                currentTextBox.style.fontSize = document.getElementById(isSingleMode?'fontSize':'BfontSize').value + 'px';
                break;
        }
    }
}

function startDragging(e) {
    if (e.target.classList.contains('resize-handle')) return;

    isDragging = true;
    // currentTextBox = e.target.closest('.text-box');
    startX = e.clientX;
    startY = e.clientY;
    originalX = currentTextBox.offsetLeft;
    originalY = currentTextBox.offsetTop;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
}

function startResizing(e) {
    e.stopPropagation();
    isResizing = true;
    // currentTextBox = e.target.closest('.text-box');
    currentHandle = e.target.dataset.handle;
    startX = e.clientX;
    startY = e.clientY;
    originalWidth = currentTextBox.offsetWidth;
    originalHeight = currentTextBox.offsetHeight;
    originalX = currentTextBox.offsetLeft;
    originalY = currentTextBox.offsetTop;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
}

function resize(e) {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    switch (currentHandle) {
        case 'tl':
            currentTextBox.style.width = `${originalWidth - deltaX}px`;
            currentTextBox.style.height = `${originalHeight - deltaY}px`;
            currentTextBox.style.left = `${originalX + deltaX}px`;
            currentTextBox.style.top = `${originalY + deltaY}px`;
            break;
        case 'tr':
            currentTextBox.style.width = `${originalWidth + deltaX}px`;
            currentTextBox.style.height = `${originalHeight - deltaY}px`;
            currentTextBox.style.top = `${originalY + deltaY}px`;
            break;
        case 'bl':
            currentTextBox.style.width = `${originalWidth - deltaX}px`;
            currentTextBox.style.height = `${originalHeight + deltaY}px`;
            currentTextBox.style.left = `${originalX + deltaX}px`;
            break;
        case 'br':
            currentTextBox.style.width = `${originalWidth + deltaX}px`;
            currentTextBox.style.height = `${originalHeight + deltaY}px`;
            break;
    }
}

function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
}

function drag(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = originalX + deltaX;
    let newY = originalY + deltaY;

    // Get guide positions and text box dimensions
    const container = currentTextBox.parentElement;
    const verticalGuide = container.querySelector('.vertical-guide').offsetLeft;
    const horizontalGuide = container.querySelector('.horizontal-guide').offsetTop;
    const textBoxCenterX = newX + (currentTextBox.offsetWidth / 2);
    const textBoxCenterY = newY + (currentTextBox.offsetHeight / 2);

    // Check if text box center is near vertical guide (within 10px)
    if (Math.abs(textBoxCenterX - verticalGuide) < 10) {
        newX = verticalGuide - (currentTextBox.offsetWidth / 2);
        container.querySelector('.vertical-guide').style.opacity = '1';
    } else {
        container.querySelector('.vertical-guide').style.opacity = '0';
    }
    

    // Check if text box center is near horizontal guide (within 10px)
    if (Math.abs(textBoxCenterY - horizontalGuide) < 10) {
        newY = horizontalGuide - (currentTextBox.offsetHeight / 2);
        container.querySelector('.horizontal-guide').style.opacity = '1';
    } else {
        container.querySelector('.horizontal-guide').style.opacity = '0';
    }

    currentTextBox.style.left = `${newX}px`;
    currentTextBox.style.top = `${newY}px`;
}

function stopDragging() {
    const container = currentTextBox.parentElement;
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    container.querySelector('.vertical-guide').style.opacity = '0';
    container.querySelector('.horizontal-guide').style.opacity = '0';

}

// New function for text alignment
function alignText(alignment) {
    if (currentTextBox) {
        currentTextBox.style.textAlign = alignment;
    }
}

async function generateCertificates(flag) {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    const zip = new JSZip();
    const container = flag === 0 ? document.getElementById('bulk-form').querySelector('.canvas-container') : document.querySelector('.canvas-container');
    selectedColumn = flag === 0 ? document.getElementById('bulk-form').querySelector('#columnSelect').value : document.getElementById('columnSelect').value;

    // Remove borders and handles once before starting generation
    const prepareTextBoxesForGeneration = () => {
        // Hide guides before generation
        container.querySelector('.horizontal-guide').style.display = 'none';
        container.querySelector('.vertical-guide').style.display = 'none';
        textBoxes.forEach(box => {
            // Apply styling
            box.style.border = 'none';
            box.style.backgroundColor = 'transparent';
            box.querySelectorAll('.resize-handle').forEach(handle => {
                handle.style.display = 'none';
            });
        });
    };

    // Restore editing UI after generation
    const restoreTextBoxesUI = () => {
        textBoxes.forEach(box => {
            box.style.border = '1px solid #000';
            box.style.backgroundColor = 'rgba(255,255,255,0.7)';
            box.querySelectorAll('.resize-handle').forEach(handle => {
                handle.style.display = 'block';
            });
        });
    };

    try {
        if (flag === 1) { // Single Certificate
document.getElementsByClassName("count")[0].setAttribute('data-value', '1');
            // Update text content for single entry
            textBoxes.forEach(box => {
                box.textContent = document.getElementById("userInput").value;
                box.style.color = document.getElementById('colorPicker').value;
                box.style.fontFamily = document.getElementById('fontSelect').value;
                box.style.fontSize = document.getElementById('fontSize').value + 'px';
            });

            prepareTextBoxesForGeneration();

            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(container, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2
            });
            const dataUrl = canvas.toDataURL('image/png', 1.0);

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'certificate.png';
            link.click();

        } else { // Bulk Generation
            prepareTextBoxesForGeneration();
            document.getElementsByClassName("Bcount")[0].setAttribute('data-value', data.length.toString());
            // Process each row of data
            for (let i = 0; i < data.length; i++) {
                // Update text content for each text box with current row's data
                textBoxes.forEach(box => {
                    box.textContent = data[i][selectedColumn];
                    box.style.color = document.getElementById('BcolorPicker').value;
                    box.style.fontFamily = document.getElementById('BfontSelect').value;
                    box.style.fontSize = document.getElementById('BfontSize').value + 'px';
                });

                await new Promise(resolve => setTimeout(resolve, 100));

                const canvas = await html2canvas(container, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    scale: 2,
                    logging: false
                });

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const base64Data = dataUrl.split(',')[1];

                const fileName = `certificate_${data[i][selectedColumn].replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                zip.file(fileName, base64Data, {
                    base64: true
                });

                loading.textContent = `Generating certificates... ${i + 1}/${data.length}`;
            }

            // Generate and download zip file
            const content = await zip.generateAsync({
                type: 'blob'
            });
            saveAs(content, 'certificates.zip');
        }
    } catch (error) {
        console.error('Error generating certificates:', error);
        alert('Error generating certificates. Please try again.');
    } finally {
        restoreTextBoxesUI(); // Restore the UI state regardless of success or failure
        loading.style.display = 'none';
    }
    nextStep();
}

function showSingleForm() {
    isSingleMode = true;
    document.getElementById('nextStepBtn').disabled = false;

    // document.getElementById("single-form").style.display = "block";
    // document.getElementById("bulk-form").style.display = "none";
}

function showBulkForm() {
    isSingleMode = false;
    document.getElementById('nextStepBtn').disabled = false;

    // document.getElementById("bulk-form").style.display = "block";
    // document.getElementById("single-form").style.display = "none";
}
