/* eslint-disable max-len */
let CURRENT_STEP = 0;

function normalizeSpaces(str) {
  // Replace multiple spaces with a single space
  return str.replace(/\s+/g, ' ').trim();
}

function setPreference(key, value) {
  if (typeof (Storage) === 'undefined') {
    return;
  }

  const preferences = JSON.parse(localStorage.getItem('experienceleague') || '{}');
  preferences.slide = {
    ...preferences.slide,
    [key]: value,
  };
  localStorage.setItem('experienceleague', JSON.stringify(preferences));
}

function getPreference(key) {
  if (typeof (Storage) === 'undefined') {
    return null;
  }
  const preferences = JSON.parse(localStorage.getItem('experienceleague') || '{}');

  if (preferences?.slide) {
    return preferences.slide[key];
  }
  return null;
}

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

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

            <div class="steps">
            ${content.steps.map((step, index) => `
                <div class="step" data-step="${index}" class="${step.active ? 'active' : ''}">

                    <h3 class="title">${index + 1}. ${step.title}</h3>

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
                        </div>

                        <select class="step-name" data-step-name>
                            ${// eslint-disable-next-line no-shadow
  content.steps.map((step, index) => `<option value="${index}">${index + 1}. ${step.title}</option>`).join('')}
                        </select>
                    </div>
            
                    <!-- Content -->
                    <div class="content">
                        ${step.body}
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
}

function addCallouts(step) {
  const interval = setInterval(() => {
    const image = step.querySelector('img');

    if (image.complete && image.naturalWidth > 0) {
      clearInterval(interval);

      step.querySelectorAll('[data-callout]').forEach((callout) => {
        callout.classList.add('visible');

        const indicator = callout.querySelector('[data-callout-indicator]');
        const button = callout.querySelector('[data-callout-button]');
        const tooltip = callout.querySelector('[data-callout-tooltip]');

        const scaleX = image.clientWidth / image.naturalWidth;
        const scaleY = image.clientHeight / image.naturalHeight;

        const width = parseInt(indicator.dataset.calloutIndicatorWidth, 10) || 100;
        const height = parseInt(indicator.dataset.calloutIndicatorHeight, 10) || width;
        const left = parseInt(indicator.dataset.calloutIndicatorX, 10);
        const top = parseInt(indicator.dataset.calloutIndicatorY, 10);

        const indicatorLeft = ((left - (width / 2)) * scaleX) / (image.clientWidth);
        const indicatorTop = ((top - (height / 2)) * scaleY) / (image.clientHeight);

        const indicatorWidth = (width * scaleX) / image.clientWidth;
        const indicatorHeight = (height * scaleY) / image.clientHeight;

        indicator.style.left = `${indicatorLeft * 100}%`;
        indicator.style.top = `${indicatorTop * 100}%`;
        indicator.style.width = `${indicatorWidth * 100}%`;
        indicator.style.height = `${indicatorHeight * 100}%`;

        if (button) {
          (new ResizeObserver((entries) => {
            // eslint-disable-next-line no-restricted-syntax
            for (const entry of entries) {
              const borderBox = entry.borderBoxSize[0];

              button.style.left = '50%';
              button.style.top = '50%';
              button.style.marginTop = `${-1 * ((borderBox?.blockSize || button.offsetHeight) / 2)}px`;
              button.style.marginLeft = `${-1 * ((borderBox?.inlineSize || button.offsetWidth) / 2)}px`;
            }
          })).observe(button);

          indicator.style.left = 'unset';
          indicator.style.top = 'unset';
          indicator.style.width = `${button.offsetWidth * 1.5}px`;
          indicator.style.height = indicator.style.width;
        }

        if (tooltip) {
          const tooltipAdjust = 50;
          const tooltipLeft = ((left - tooltipAdjust) * scaleX) / (image.clientWidth);
          const tooltipTop = ((top + tooltipAdjust) * scaleY) / (image.clientHeight);

          tooltip.style.left = `${tooltipLeft * 100}%`;
          tooltip.style.top = `${tooltipTop * 100}%`;
        }
      });
    }
  }, 100); // Wait for the image to have display on its parent

}

function parseCallout(calloutParams = '') {
  const params = calloutParams.split('|') || [];

  const callout = {};

  callout.toast = params.find((value) => value?.startsWith('toast='))?.split('=')[1] || null;

  if (callout.toast) {
    return callout;
  }

  callout.button = params.find((value) => value?.startsWith('button='))?.split('=')[1] || null;

  callout.width = parseInt(params[0], 10);
  callout.height = callout.width;
  callout.x = parseInt(params[1], 10);
  callout.y = parseInt(params[2], 10);

  if (Number.isNaN(callout.width) || Number.isNaN(callout.height) || Number.isNaN(callout.x) || Number.isNaN(callout.y)) {
    if (callout.button) {
      callout.position = 'middle';
      callout.x = 'unset';
      callout.y = 'unset';
    } else {
      return null;
    }
  }

  callout.tooltip = params.find((value) => value?.startsWith('tooltip='))?.split('=')[1] || null;
  callout.clickable = params.find((value) => value === 'next') ? 'next' : false;
  if (!callout.clickable) {
    callout.clickable = params.find((value) => value?.startsWith('click='))?.split('=')[1] || false;
  }

  return callout;
}

function getVisual(cell) {
  const visual = {};

  if (cell.querySelector(':scope picture')) {
    // image
    visual.image = cell.querySelector(':scope picture').outerHTML;
    visual.callouts = [...cell.querySelectorAll(':scope > ul > li')].map((li) => parseCallout(li.textContent)).filter((item) => item !== null);
  } else if (cell.querySelector(':scope > pre')) {
    // code
    visual.code = cell.querySelector(':scope > pre').outerHTML;
    visual.body = [...cell.querySelectorAll(':scope > *')].filter((el) => !el.matches('pre')).map((el) => el.outerHTML).join('');
  }

  return visual;
}

async function activateStep(block, stepIndex, direction = 'next') {
  // There should only be 1 match, but the forEach guards against no matches as well
  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  step.classList.add('active');

  step.querySelectorAll('[data-callout] ~ picture > img').forEach((image) => {
    if (image.complete && image.naturalWidth > 0) {
      addCallouts(step);
    } else {
      image.addEventListener('load', () => {
        addCallouts(step);
      });
    }
  });

  const audio = step.querySelector('audio');

  const autoplayAudio = direction === 'next'
            && getPreference('autoplayAudio')
            && getPreference('view') !== 'as-docs';

  if (stepIndex === CURRENT_STEP && autoplayAudio) {
    try {
      await audio.play();
    } catch (error) {
      // Its fine if the audio doesn't play
    }
  } else {
    await audio.pause();
  }
}

function showStep(block, stepIndex, direction = 'next') {
  const numberOfSteps = [...block.querySelectorAll('[data-step]')].length;

  const step = block.querySelector(`[data-step="${stepIndex}"]`);

  const previousButton = step.querySelector('[data-previous-step]');
  const nextButton = step.querySelector('[data-next-step]');

  previousButton.removeAttribute('disabled');
  nextButton.removeAttribute('disabled');

  if (stepIndex === 0) {
    previousButton.setAttribute('disabled', true);
  } else if (stepIndex === numberOfSteps - 1) {
    nextButton.setAttribute('disabled', true);
  }

  // Pause any playing audio from all steps
  block.querySelectorAll('audio').forEach((audio) => {
    audio.pause();
    // TBD if we should reset the audio to the beginning
    // audio.currentTime = 0;
  });

  // Remove active from all steps
  block.querySelectorAll('[data-step]').forEach((s) => {
    s.classList.remove('active');
  });

  // Must come after the remove active above
  activateStep(block, stepIndex, direction);

  step.querySelectorAll('[data-step-name]').forEach((select) => {
    select.value = stepIndex;
  });
}

function showAllSteps(block) {
  block.querySelectorAll('[data-step]').forEach(async (step, index) => {
    await step.querySelector('audio')?.pause();
    activateStep(block, index, false);
  });
}

function getStepFromLink(block) {
  // eslint-disable-next-line prefer-const
  let [blockId, stepIndex] = ((window.location?.hash ?? '').replace('#', '') ?? '').split('=');
  stepIndex = parseInt(stepIndex, 10);
  stepIndex = Number.isNaN(stepIndex) ? 0 : stepIndex - 1;

  if (block.querySelector(`[data-block-id="${blockId}"] [data-step="${stepIndex}"]`)) {
    return stepIndex;
  }

  return 0;
}

function setStepOnLink(block, stepIndexStr) {
  const { blockId } = block.querySelector('[data-block-id]').dataset;

  let stepIndex = parseInt(stepIndexStr, 10);
  if (Number.isNaN(stepIndex)) {
    stepIndex = 0;
  }

  if (blockId && stepIndex > -1) {
    window.location.hash = `#${blockId}=${stepIndex + 1}`;
  }
}

function addEventHandlers(block, initialStep = 0) {
  CURRENT_STEP = initialStep;
  const numberOfSteps = [...block.querySelectorAll('[data-step]')].length;

  block.querySelectorAll('[data-toggle-view]').forEach((button) => {
    button.addEventListener('click', () => {
      block.querySelector('.container').classList.toggle('as-docs');

      if (button.dataset.toggleView === 'as-docs') {
        setPreference('view', 'as-docs');
        showAllSteps(block);
      } else {
        setPreference('view', 'as-slides');
        showStep(block, CURRENT_STEP);
      }
    });
  });

  block.querySelectorAll('[data-previous-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (CURRENT_STEP > 0 && getPreference('view') !== 'as-docs') {
        CURRENT_STEP -= 1;
        setStepOnLink(block, CURRENT_STEP);
        showStep(block, CURRENT_STEP, 'previous');
      }
    });
  });

  block.querySelectorAll('[data-next-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (CURRENT_STEP < numberOfSteps - 1 && getPreference('view') !== 'as-docs') {
        CURRENT_STEP += 1;
        setStepOnLink(block, CURRENT_STEP);
        showStep(block, CURRENT_STEP, 'next');
      }
    });
  });

  block.querySelectorAll('[data-step-name]').forEach((select) => {
    select.addEventListener('change', () => {
      CURRENT_STEP = select.value;
      setStepOnLink(block, CURRENT_STEP);
      showStep(block, CURRENT_STEP, 'jump');
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
        audio: `https://dxenablementbeta.blob.core.windows.net/exl-slides/audio/${await sha256(normalizeSpaces([...stepContent.querySelectorAll(':scope > *')].filter((el) => !el.matches('h3')).map((el) => el.textContent).join(' ')))}.wav`,
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
