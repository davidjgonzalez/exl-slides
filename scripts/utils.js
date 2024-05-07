// eslint-disable-next-line import/prefer-default-export
export function getImageUrlFromPicture(element) {
  // Check if it's a <picture> element
  if (element.tagName.toLowerCase() === 'picture') {
    const sources = element.querySelectorAll('source');

    // Iterate through each <source> element
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const media = source.getAttribute('media');
      const srcset = source.getAttribute('srcset');

      // Check if the media query matches the viewport or if there's no media query
      if (!media || window.matchMedia(media).matches) {
        // Return the URL of the matching source
        return srcset.split(',').map((item) => item.trim().split(' ')[0])[0];
      }
    }
  }

  // If no matching <source> element is found, return the URL of the <img> element
  return element.querySelector('img').getAttribute('src');
}
