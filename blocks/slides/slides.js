import state from './state.js';
import {
  getPreference, setPreference, getStepFromLink, getVisual, getAudioFilename,
  showAllSteps, showStep, setStepOnLink,
} from './utils.js';

function html(content) {
  const initialView = getPreference('view') || 'as-slides';
  const autoplayAudio = getPreference('autoplayAudio') || false;

  return `
        <div class="container ${initialView}" data-block-id="${content.id}">

            <div class="header">
                <h2 class="title">${content.title}</h2>

                <div class="display-toggles">
                    <button class="as-docs button secondary" data-toggle-view="as-docs">View as docs</button>
                    <button class="as-slides button secondary" data-toggle-view="as-slides">View as slides</button>
                </div>
            </div>
        
            <div class="intro">
                ${content.body}
            </div>

            <div class="steps" itemscope itemtype="http://schema.org/ImageGallery">
            ${content.steps.map((step, index) => `
                <div class="step" data-step="${index}" class="${step.active ? 'active' : ''}" 
                     itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">

                    <meta itemprop="caption" content="${step.title}">
                    <meta itemprop="representativeOfPage" content="${index === 0 ? 'true' : 'false'}">

                    <!-- Visuals -->
                    <div class="visual ${step.visual.code ? 'code' : 'image'}">
                        <span class="step-counter">${index + 1}<span class="slash">/</span>${content.steps.length}</span>

                        ${step.visual.image ? `
                            <!-- Image visual -->
                            ${step.visual.callouts?.filter((callout) => !callout.toast).map((callout) => `
                                <span class="callout" data-callout>
                                    <span class="indicator ${callout.clickable ? 'clickable' : ''}" 
                                            ${!callout.button && callout.clickable === 'next' ? 'data-next-step' : ''} 
                                            data-callout-indicator
                                            data-callout-indicator-width="${callout.width}"
                                            data-callout-indicator-height="${callout.height}"
                                            data-callout-indicator-x="${callout.x}"
                                            data-callout-indicator-y="${callout.y}">
                                                <i></i>
                                                ${callout.button ? `<button ${callout.clickable === 'next' ? 'data-next-step' : ''} data-callout-button>${callout.button}</button>` : ''}
                                    </span>
                                    ${callout.tooltip ? `<p class="tooltip" data-callout-tooltip>${callout.tooltip}</p>` : ''}
                                   
                                </span>
                            `).join('')}                
                            ${step.visual.image}` : ''}

                        ${step.visual.code ? `
                            <!-- Code visual -->
                            <div class="body">${step.visual.body}</div>
                            ${step.visual.code}` : ''}      
                            
                        ${step.visual.callouts?.find((callout) => callout.toast) ? `
                            <div class="toast">${step.visual.callouts?.find((callout) => callout.toast).toast}</div>
                        ` : ''}

                    </div>            

                    <!-- Slide Controls -->
                    <div class="controls">
                        <div class="controls-bar">
                            <button class="previous-button" data-previous-step="${index - 1}">Previous</button>
                            <button class="next-button" data-next-step="${index + 1}">Next</button>

                            <span class="auto-play">
                                <label for="auto-play" class="auto-play-label">Autoplay</label>
                                <button 
                                    name="auto-play" 
                                    class="auto-play-button" 
                                    data-auto-play-audio="${autoplayAudio}" 
                                    title="Turn autoplay on to automatically advance through the steps."></button>
                            </span>

                            <audio 
                                class="audio-player" data-audio-controls
                                src="${step.audio}" controls preload controlslist="nodownload">
                                <source src="${step.audio} type="audio/wav">
                                Your browser does not support the audio element.
                            </audio>
                        </div >

                        <div class="step-name" data-step-name>
                            <label class="step-name-label for="step-name-${index}">Current step:</label>
                            <select class="step-name-select" name="step-name-${index}">
                                ${// eslint-disable-next-line no-shadow
  content.steps.map((step, index) => `<option value="${index}">${index + 1}. ${step.title}</option>`).join('')}
                            </select>
                        </div>
                    </div>
            
                    <!-- Content -->
                    <div class="content" itemprop="description">
                        ${step.body}
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
}

function addEventHandlers(block, initialStep = 0) {
  state.currentStep = initialStep;
  const numberOfSteps = [...block.querySelectorAll('[data-step]')].length;

  block.querySelectorAll('[data-toggle-view]').forEach((button) => {
    button.addEventListener('click', () => {
      block.querySelector('.container').classList.toggle('as-docs');

      if (button.dataset.toggleView === 'as-docs') {
        setPreference('view', 'as-docs');
        showAllSteps(block);
      } else {
        setPreference('view', 'as-slides');
        showStep(block, state.currentStep);
      }
    });
  });

  block.querySelectorAll('[data-previous-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.currentStep > 0 && getPreference('view') !== 'as-docs') {
        state.currentStep -= 1;
        setStepOnLink(block, state.currentStep);
        showStep(block, state.currentStep, 'previous');
      }
    });
  });

  block.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.currentStep < numberOfSteps - 1 && getPreference('view') !== 'as-docs') {
        state.currentStep += 1;
        setStepOnLink(block, state.currentStep);
        showStep(block, state.currentStep, 'next');
      }
    });
  });

  block.querySelectorAll('[data-step-name]').forEach((select) => {
    select.addEventListener('change', () => {
      state.currentStep = select.value;
      setStepOnLink(block, state.currentStep);
      showStep(block, state.currentStep, 'jump');
    });
  });

  block.querySelectorAll('audio').forEach((audio) => {
    audio.addEventListener('ended', () => {
      setTimeout(() => {
        if (getPreference('autoplayAudio')) {
          audio.closest('[data-step]').querySelector('[data-next-step]').click();
        }
      }, 2000);
    });
  });

  block.querySelectorAll('[data-auto-play-audio]').forEach((audioControls) => {
    audioControls?.addEventListener('click', () => {
      const autoPlayAudio = audioControls.dataset.autoPlayAudio === 'true';

      block.querySelectorAll('[data-auto-play-audio]').forEach((ac) => {
        ac.dataset.autoPlayAudio = !autoPlayAudio;
      });

      setPreference('autoplayAudio', !autoPlayAudio);
    });
  });
}

export default async function decorate(block) {
  const blockId = block.querySelector(':scope > div:first-child > div:first-child > h2').id;

  const content = {
    id: blockId,
    title: block.querySelector(':scope > div:first-child > div:first-child > h2').textContent,
    body: [...block.querySelectorAll(':scope > div:first-child > div:first-child > *')].filter((el) => !el.matches('h2')).map((el) => el.outerHTML).join(''),

    steps: await Promise.all([...block.querySelectorAll(':scope > div:not(:first-child)')].map(async (step, index) => {
      const stepContent = step.querySelector(':scope > div:first-child');
      const visual = step.querySelector(':scope > div:last-child');

      return {
        active: index === getStepFromLink(block),
        title: stepContent.querySelector(':scope > h3').textContent,
        body: [...stepContent.querySelectorAll(':scope > *')].filter((el) => !el.matches('h3')).map((el) => el.outerHTML).join(' '),
        visual: getVisual(visual),
        audio: `https://dxenablementbeta.blob.core.windows.net/exl-slides/audio/${await getAudioFilename(stepContent)}.wav`,
      };
    })),
  };

  block.innerHTML = html(content);

  addEventHandlers(block, getStepFromLink(block));

  if (getPreference('view') === 'as-docs') {
    showAllSteps(block);
  } else {
    showStep(block, getStepFromLink(block));
  }

  return block;
}
