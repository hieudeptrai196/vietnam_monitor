const sharp = require('sharp');
const fs = require('fs');

async function processIcon() {
  const inputFile = 'public/icon.png';
  const size = 512;
  
  try {
    console.log('Trimming the icon to remove empty whitespace...');
    const trimmed = await sharp(inputFile)
      // trim uses top-left pixel color as background to trim by default
      .trim({ threshold: 40 })
      .toBuffer();
      
    // Scale it so it fits perfectly inside a circle
    // If the image is a perfect square bounding box, a circle circumscribing it means the circle radius is size/2. 
    // To make sure the image corners are inside the circle, we should resize it to size * (1/sqrt(2)) = size * 0.707.
    // Actually, if the user wants it to look "round", the logo itself might be a shape. 
    // The previous whitespace was the issue. Let's just fit it closely into 90% of the circle to have a tiny margin.
    const innerSize = Math.floor(size * 0.85);

    const squareImage = await sharp(trimmed)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      // Expand it back to 512x512 with transparent background
      .extend({
        top: Math.floor((size - innerSize) / 2),
        bottom: Math.ceil((size - innerSize) / 2),
        left: Math.floor((size - innerSize) / 2),
        right: Math.ceil((size - innerSize) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Now let's apply a circular mask
    const circleMask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    
    // Create new image that's the masked version
    // But since the background is transparent anyway, if the logo itself needs a circle wrapper, we can give it a solid white circle background instead of transparent?
    // Wait, the user said "thừa ra khoảng trắng, nhìn ko tròn". This implies there is a visible white square on the dark tabs, and they want the white to be a circle or transparent. 
    // If we make a white circle background and put the cropped transparent logo on it, it will look like a solid round icon!
    // Let's do a white circle background, and composite the logo on top.
    
    const backgroundCircle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    
    const circularBuffer = await sharp(backgroundCircle)
      .composite([{ input: squareImage, blend: 'over' }])
      .png()
      .toBuffer();

    console.log('Writing output files...');
    fs.writeFileSync('public/favicon.png', circularBuffer);
    fs.writeFileSync('public/apple-icon.png', circularBuffer);
    
    // Let's also do a smaller version for the DOM if needed, but the big ones will scale down fine.
    console.log('Successfully created beautiful rounded favicons free of extraneous white border!');
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

processIcon();
