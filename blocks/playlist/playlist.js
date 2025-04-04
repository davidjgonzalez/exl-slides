let content = {};
let index = 0;

function html(content, i = 0) {
    const html = `
        <div>
            ${content.title}
            <div>${content.body}</div>
            
            <nav>
                <button data-previous>Previous</button>
                <button data-next>Next</button>
            </nav>
            
            <div data-playlist-item>
                ${videoHtml(content.videos[i], i)}
            </div>
        </div>
    `;    

    return html;
}

function videoHtml(item, i = 0) {
    return `
        <div class="video">
            <iframe
                src="${item.url}" 
                frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen scrolling="no"></iframe>
                
            <h3>${item.title}</h3>

            <div>
                ${item.body}
            </div>    
        </div>
        `;    
}

function addEventListeners(block) {

    block.querySelector('[data-next]').addEventListener('click', (e) => {
        if (index < content.videos.length - 1) {
            index++;
            block.querySelector('[data-playlist-item]').innerHTML = videoHtml(content.videos[index], index);
        }
    });

    block.querySelector('[data-previous]').addEventListener('click', (e) => {
        if (index > 0) {
            index--;
            block.querySelector('[data-playlist-item]').innerHTML = videoHtml(content.videos[index], index);
        }
    });
}

export default async function decorate(block) {
    const language = new URLSearchParams(window.location.search).get('lang') || 'en';

    content = {
        title: block.querySelector('h1')?.outerHTML,
        body: [...block.querySelectorAll(':scope > div:first-child > div:first-child > *')].filter((el) => !el.matches('h1,ul')).map(el => el.outerHTML).join(''),

        videos: (await Promise.all([...block.querySelectorAll(':scope > div > div > ul > li')].map(async (li) => {
                let url = li.textContent.trim();
                url = url.replace(/\/[a-z-]+\//, '/' + language + '/');

                const response = await fetch(url + '.plain.html');

                if (response.ok) {
                    const html = await response.text();
                    
                    const videoDoc = new DOMParser().parseFromString(html, 'text/html');
                    const videoUrl = videoDoc.querySelector('a[href^="https://video.tv.adobe.com"]')?.href || null;

                    if (videoUrl) {
                        return {
                            title: getVideoTitle(videoDoc.querySelector('body > div > h1')) || "No title",
                            body: [...videoDoc.querySelectorAll('body > div > p')]
                                .filter((el) => !el.textContent.match(/.*{.*}.*/))
                                .map((el) => el.outerHTML)
                                .join(' ') || 'No body',
                            url: videoDoc.querySelector('a[href^="https://video.tv.adobe.com"]')?.href || 'No href'
                        }
                    }
                }
        }))).filter((item) => item)
    };
    
    block.innerHTML = html(content, index);

    addEventListeners(block);

    return block;
}



/**
 * No idea why the H1 is structured like this .. but i guess something like this will get the title.
 * 
 * @param {*} h1 
 * @returns 
 */
function getVideoTitle(h1) {
    const childNodes = h1?.childNodes || [];

    // Initialize an empty string to store the text
    let textBeforeSpan = '';
    
    // Iterate over each child node
    for (let i = 0; i < childNodes.length; i++) {
        // Check if the child node is a text node and it's not empty
        if (childNodes[i].nodeType === Node.TEXT_NODE && childNodes[i].nodeValue.trim() !== '') {
            // Concatenate the text to the result string
            textBeforeSpan += childNodes[i].nodeValue.trim();
        }
        // If we encounter a <span> element, break the loop
        if (childNodes[i].nodeName === 'SPAN') {
            break;
        }
    }

    return textBeforeSpan;
}

