document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const steps = document.querySelectorAll('.step');
    const views = document.querySelectorAll('.view');
    const toneOptions = document.querySelectorAll('.tone-option');
    const generateBtn = document.getElementById('generate-btn');

    // Navigation Logic
    steps.forEach(step => {
        step.addEventListener('click', () => {
            const stepNum = step.getAttribute('data-step');
            activateStep(stepNum);
        });
    });

    function activateStep(stepNum) {
        // Update Stepper UI
        steps.forEach(s => {
            if (s.getAttribute('data-step') == stepNum) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });

        // Show corresponding View
        views.forEach(v => {
            v.classList.remove('active');
        });

        if (stepNum == 1) document.getElementById('view-briefing').classList.add('active');
        if (stepNum == 2) document.getElementById('view-tuning').classList.add('active');
        if (stepNum == 3) document.getElementById('view-blueprint').classList.add('active');
    }

    // Tone Selector Logic
    toneOptions.forEach(option => {
        option.addEventListener('click', () => {
            toneOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            const tone = option.getAttribute('data-tone');
            console.log('Selected Tone:', tone);
            // Save to config object (future)
        });
    });

    // API Key Persistence (Local Storage for convenience)
    const apiInputs = ['api-gemini', 'api-openai', 'api-claude'];

    // Load saved keys
    apiInputs.forEach(id => {
        const saved = localStorage.getItem('kusi_' + id);
        if (saved) {
            document.getElementById(id).value = saved;
            document.getElementById(id).nextElementSibling.classList.add('ready');
        }
    });

    // Save on change
    apiInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            localStorage.setItem('kusi_' + id, e.target.value);
            const dot = e.target.nextElementSibling;
            if (e.target.value.length > 5) dot.classList.add('ready');
            else dot.classList.remove('ready');
        });
    });

    // Generate Button Interaction
    generateBtn.addEventListener('click', async () => {
        const originalText = generateBtn.innerText;
        generateBtn.innerText = 'Consultando a los Sabios... 🧠';
        generateBtn.disabled = true;

        // 1. Collect Data
        const briefing = {
            q1: document.querySelector('[name="q1"]').value,
            q2: document.querySelector('[name="q2"]').value,
            q3: document.querySelector('[name="q3"]').value
        };

        const config = {
            apis: {
                gemini: document.getElementById('api-gemini').value,
                openai: document.getElementById('api-openai').value,
                claude: document.getElementById('api-claude').value
            },
            tone: document.querySelector('.tone-option.selected')?.getAttribute('data-tone') || 'impacto'
        };

        try {
            // 2. Call Backend
            // Nota: Asegúrate de tener el servidor corriendo en puerto 8000
            const response = await fetch('http://localhost:8000/generate_blueprint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefing, config })
            });

            const data = await response.json();

            if (data.error) {
                alert('Error del Cerebro: ' + data.detail);
                generateBtn.innerText = 'Error ❌';
                return;
            }

            // 3. Render Result
            renderBlueprint(data);

            activateStep(3);
            generateBtn.innerText = originalText;

        } catch (error) {
            console.error(error);
            alert('Error de conexión con el Backend (¿Está corriendo main.py?)');
            generateBtn.innerText = 'Error Conexión ⚠️';
        } finally {
            generateBtn.disabled = false;
        }
    });

    function renderBlueprint(data) {
        // Wireframe
        const wireframeContainer = document.querySelector('.blueprint-col.structure');
        wireframeContainer.innerHTML = '<h3>📐 Estructura (Wireframe)</h3>';
        data.wireframe.forEach(block => {
            const div = document.createElement('div');
            div.className = 'wireframe-block';
            div.innerText = block;
            wireframeContainer.appendChild(div);
        });

        // Copy
        const copyContainer = document.querySelector('.blueprint-col.copy .copy-content');
        copyContainer.innerHTML = '';
        if (data.copy.headline) copyContainer.innerHTML += `<h4 class="tag">Headline</h4><p class="generated-text">"${data.copy.headline}"</p>`;
        if (data.copy.subheadline) copyContainer.innerHTML += `<h4 class="tag">Subheadline</h4><p class="generated-text">${data.copy.subheadline}</p>`;

        // Visual
        const visualContainer = document.querySelector('.blueprint-col.visual');
        // Simple render implementation for visual palette
        let paletteHtml = '<div class="color-palette">';
        if (data.visual && data.visual.palette) {
            data.visual.palette.forEach(color => {
                paletteHtml += `<div class="color-swatch" style="background: ${color};" title="${color}"></div>`;
            });
        }
        paletteHtml += '</div>';

        let fontHtml = '<div class="font-spec">';
        if (data.visual && data.visual.fonts) {
            fontHtml += `<p><strong>Title:</strong> ${data.visual.fonts.title}</p>`;
            fontHtml += `<p><strong>Body:</strong> ${data.visual.fonts.body}</p>`;
        }
        if (data.visual && data.visual.vibe) {
            fontHtml += `<p style="margin-top:10px; font-size:12px; color:#888;"><em>${data.visual.vibe}</em></p>`;
        }
        fontHtml += '</div>';

        // Find visual col content and replace after header
        const oldVisualContent = visualContainer.querySelectorAll('div');
        oldVisualContent.forEach(el => el.remove());
        visualContainer.insertAdjacentHTML('beforeend', paletteHtml + fontHtml);
    }

});
