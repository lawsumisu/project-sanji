const imageCache: {[key: string]: HTMLImageElement } = {};

export function loadImage(source: string): Promise<HTMLImageElement> {
  if (imageCache[source]) {
    return Promise.resolve(imageCache[source]);
  } else {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        imageCache[source] = image;
        resolve(image);
      };
      image.src = source;
    })
  }
}
