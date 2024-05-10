// eslint-disable-next-line import/prefer-default-export
export function getImageUrlFromPicture(pictureElement) {
  // Get window width
  const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  // Get all source elements within the picture element
  const sourceElements = pictureElement.querySelectorAll('source');

  // Initialize variable to store matching image URL
  let matchingURL = null;

  // Iterate through each source element
  [...sourceElements].forEach((source) => {
    // Get media query from the source element
    const mediaQuery = source.getAttribute('media');

    // Check if media query matches window width
    if (!mediaQuery || window.matchMedia(mediaQuery).matches) {
      // Get the srcset attribute value
      const srcset = source.getAttribute('srcset');
      // Set the matching URL
      matchingURL = srcset.split(',')[0].trim().split(' ')[0];
      // Break out of loop once matching URL is found
    }
  });

  // If no match found, return default image URL
  if (!matchingURL) {
    matchingURL = pictureElement.querySelector('img').getAttribute('src');
  }

  return matchingURL;
}
