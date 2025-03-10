let stars = [];
let spaceJunk = [];
let numStars = 100;    // Balanced star count
let junkSpawnRate = 7; // Higher means less frequent
let planets = [];
let numPlanets = 5;
let shipX = 0;
let shipY = 0;
let shipSpeed = 5;
let movingUp = false;
let movingDown = false;
let movingLeft = false;
let movingRight = false;

// We'll use an offscreen buffer for color-picking.
let pickBuffer;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // Create a matching offscreen buffer in WEBGL mode
  pickBuffer = createGraphics(width, height, WEBGL);

  // (Optional) force pickBuffer to use pixelDensity(1) 
  // so reading pixels is simpler. This avoids retina scaling issues.
  pickBuffer.pixelDensity(1);

  // Create initial stars
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }
  for (let i = 0; i < numPlanets; i++) {
    planets.push(new Planet());
  }
}

function draw() {
  background(0);

  // Position the camera back a bit
  translate(0, 0, -1000);


  // Update and show stars
  for (let star of stars) {
    star.update();
    star.show();
  }

  for (let planet of planets) {
    planet.update();
    planet.show();
  }

  // Spawn junk periodically
  if (frameCount % junkSpawnRate === 0) {
    spaceJunk.push(new SpaceJunk());
  }

  // Update and show space junk
  for (let i = spaceJunk.length - 1; i >= 0; i--) {
    spaceJunk[i].update();
    spaceJunk[i].show();

    // Remove expired junk
    if (spaceJunk[i].isExpired()) {
      spaceJunk.splice(i, 1);
    }
  }  
  if (movingUp) {
    shipY -= shipSpeed;
  }
  if (movingDown) {
    shipY += shipSpeed;
  }
  if (movingLeft) {
    shipX -= shipSpeed;
  }
  if (movingRight) {
    shipX += shipSpeed;
  }
  
}

// ----------------------------------------------------
// Star Class
// ----------------------------------------------------
class Star {
  constructor() {
    this.reset();
    this.twinkleOffset = random(1000);
    this.rotation = random(TWO_PI);
  }

  reset() {
    this.basex = random(-width, width) + shipX;
    this.basey = random(-height, height) + shipY;
    this.x = this.basex;
    this.y = this.basey;
    
    this.z = random(0, 3000);
    this.speed = map(this.z, 0, 3000, 20, 5);
    this.baseSize = random(3, 7);
  }

  update() {
    this.z += this.speed;
    if (this.z > 2000) {
      this.reset();
      this.z = 0;
    }
    this.rotation += 0.02;
  }

  show() {
    push();
    translate(this.x - shipX, this.y - shipY, this.z);
    rotate(this.rotation);

    let twinkle = map(sin(frameCount * 0.1 + this.twinkleOffset), -1, 1, 0.7, 1);
    
    let size = this.baseSize * twinkle;
    let alpha = map(this.z, 0, 2000, 255, 50) * twinkle;

    noStroke();
    fill(255, alpha);

    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = PI / 4 * i;
      let r = (i % 2 === 0) ? size * 0.4 : size;
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      vertex(x, y);
    }
    endShape(CLOSE);

    pop();
  }
}


// ----------------------------------------------------
// Space Junk Class
// ----------------------------------------------------
class SpaceJunk {
  constructor() {
    // Spawn somewhat away from the center:
    this.x = random(-width * 0.3, width * 0.3) + shipX;
    this.y = random(-height * 0.3, height * 0.3) + shipY;
    
    // Don’t spawn right in front of the camera:
    this.z = random(700, 3000);

    // Moderate speed
    this.speed = random(6, 6);

    // Size limit
    this.size = random(10, 30);

    // Mild rotation
    this.rotationSpeed = random(0.01, 0.05);

    // Lifetime for a 3-second fade-out
    this.creationTime = millis();
    this.maxLifetime = 3000;
  }

  update() {
    this.z += this.speed;
  }

  show() {
    let lifetime = millis() - this.creationTime;
    let alpha = map(lifetime, 0, this.maxLifetime, 255, 0);

    push();
    translate(this.x - shipX, this.y - shipY, this.z);
    rotateX(frameCount * this.rotationSpeed);
    rotateY(frameCount * this.rotationSpeed);
    noStroke();
    fill(200, 150, 50, alpha);
    box(this.size);
    pop();
  }

  isExpired() {
    return millis() - this.creationTime > this.maxLifetime;
  }
}

// ----------------------------------------------------
// Planet Class
// ----------------------------------------------------
class Planet {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(-width, width) + shipX;
    this.y = random(-height, height) + shipY;
    this.z = random(-7000, -8000);
    this.speed = map(this.z, -7000, -8000, 20, 5);
    this.baseSize = random(1, 4) * 150;
    this.palette1 = color(random(255), random(255), random(255));
    this.palette2 = color(random(255), random(255), random(255));
    this.palette3 = color(random(255), random(255), random(255));
    this.planetTexture = createGraphics(width, height);
    this.planetTexture.background(color(random(255), random(255), random(255)))
    generatePlanetTexture(this.planetTexture, this)
  }

  update() {
    this.z += this.speed;

    if (this.z > 2000) {
      this.reset();
      //this.z = 0;
    }
  }

  show() {
    push();
    translate(this.x - shipX, this.y - shipY, this.z);
    let size = map(this.z, 0, 2000, this.baseSize * 2, this.baseSize * 0.5);
    let alpha = map(this.z, 0, 2000, 255, 50);
    noStroke();
    drawPlanet(this);
    pop();
  }
}

// ----------------------------------------------------
// COLOR-PICKING WHEN CLICKED
// ----------------------------------------------------
function mouseClicked() {
  // 1) Clear the pick buffer and match the main camera transform:
  pickBuffer.background(0);
  
  // By default, pickBuffer uses the same perspective as p5, 
  // but let's reset to be safe:
  pickBuffer.camera();       // Reset camera
  pickBuffer.perspective();  // Default perspective
  pickBuffer.push();
  pickBuffer.translate(0, 0, -1000);
  pickBuffer.translate(-shipX, -shipY, 0); //account for movement

  // 2) Draw each piece of junk with a unique "ID color."
  //    We'll store that "ID" in the red channel. 
  //    NOTE: This limits you to 255 objects if you only use .fill(i,0,0). 
  //    If you need more, you'd pack the ID into R/G/B or use another strategy.
  for (let i = 0; i < spaceJunk.length; i++) {
    let junk = spaceJunk[i];
    
    pickBuffer.push();
    pickBuffer.translate(junk.x, junk.y, junk.z);
    pickBuffer.rotateX(frameCount * junk.rotationSpeed);
    pickBuffer.rotateY(frameCount * junk.rotationSpeed);
    
    // Unique color ID in the red channel:
    pickBuffer.noStroke();
    pickBuffer.fill(i, 0, 0); 
    pickBuffer.box(junk.size);
    pickBuffer.pop();
  }
  pickBuffer.pop();

  // 3) Read the color under the mouse in this offscreen buffer:
  pickBuffer.loadPixels();

  // If your main canvas has a pixelDensity > 1 (e.g., on a retina screen),
  // you need to multiply mouseX, mouseY by that same density:
  let d = pixelDensity();
  let px = floor(mouseX * d);
  let py = floor(mouseY * d);

  // Index into the pixel array (4 bytes/pixel: R,G,B,A):
  let index = 4 * (px + py * width * d);
  let r = pickBuffer.pixels[index]; // We used the red channel as the ID

  // 4) If that "red" ID matches a piece of junk, remove it.
  if (r < spaceJunk.length) {
    spaceJunk.splice(r, 1);
  }
}

function drawPlanet(planet) {
  palette1 = planet.palette1;
  palette2 = planet.palette2;
  palette3 = planet.palette3;
  rotateY(frameCount * 0.01)
  noStroke();
  texture(planet.planetTexture);
  sphere(150);
  return;
  let numBands = 4;      // Number of panels on the sphere
  let sphereSize = planet.baseSize;  // Radius of the sphere
  let panelResolution = 2; // Subdivisions per panel for a smoother gradient

  // Loop through latitude and longitude panels
  for (let i = 0; i < numBands; i++) {
    let lat1 = map(i, 0, numBands, -PI / 2, PI / 2);
    let lat2 = map(i + 1, 0, numBands, -PI / 2, PI / 2);
    
    for (let j = 0; j < numBands; j++) {
      let lon1 = map(j, 0, numBands, 0, TWO_PI);
      let lon2 = map(j + 1, 0, numBands, 0, TWO_PI);

      // Subdivide each panel to create a smooth gradient
      for (let u = 0; u < panelResolution; u++) {
        for (let v = 0; v < panelResolution; v++) {
          
          let lerpU1 = map(u, 0, panelResolution, lon1, lon2);
          let lerpU2 = map(u + 1, 0, panelResolution, lon1, lon2);
          let lerpV1 = map(v, 0, panelResolution, lat1, lat2);
          let lerpV2 = map(v + 1, 0, panelResolution, lat1, lat2);

          let x1 = sphereSize * cos(lerpV1) * cos(lerpU1);
          let y1 = sphereSize * cos(lerpV1) * sin(lerpU1);
          let z1 = sphereSize * sin(lerpV1);

          let x2 = sphereSize * cos(lerpV2) * cos(lerpU1);
          let y2 = sphereSize * cos(lerpV2) * sin(lerpU1);
          let z2 = sphereSize * sin(lerpV2);

          let x3 = sphereSize * cos(lerpV2) * cos(lerpU2);
          let y3 = sphereSize * cos(lerpV2) * sin(lerpU2);
          let z3 = sphereSize * sin(lerpV2);

          let x4 = sphereSize * cos(lerpV1) * cos(lerpU2);
          let y4 = sphereSize * cos(lerpV1) * sin(lerpU2);
          let z4 = sphereSize * sin(lerpV1);

          // Generate a noise value for each vertex (0 to 1)
          let t1 = noise(x1 * 0.05, y1 * 0.05);
          let t2 = noise(x2 * 0.05, y2 * 0.05);
          let t3 = noise(x3 * 0.05, y3 * 0.05);
          let t4 = noise(x4 * 0.05, y4 * 0.05);

          // Map the noise values to our random palette gradient
          let c1 = getPaletteColor(t1, palette1, palette2, palette3);
          let c2 = getPaletteColor(t2, palette1, palette2, palette3);
          let c3 = getPaletteColor(t3, palette1, palette2, palette3);
          let c4 = getPaletteColor(t4, palette1, palette2, palette3);

          // Draw the quad with vertex colors to form a gradient on the panel
          beginShape();
          fill(c1);
          vertex(x1, y1, z1);
          fill(c2);
          vertex(x2, y2, z2);
          fill(c3);
          vertex(x3, y3, z3);
          fill(c4);
          vertex(x4, y4, z4);
          endShape(CLOSE);
        }
      }
    }
  }
}

function getPaletteColor(t, palette1, palette2, palette3) {
  if (t < 0.5) {
    // Map 0 to 0.5 from palette1 to palette2
    return lerpColor(palette1, palette2, t * 2);
  } else {
    // Map 0.5 to 1 from palette2 to palette3
    return lerpColor(palette2, palette3, (t - 0.5) * 2);
  }
}

function generatePlanetTexture(planetTexture, planet) {
  for (let i = 0; i < 150; i++) {
    drawWrappedCircle(planetTexture, random(width), random(height), 340, planet)
  }
}

function drawWrappedCircle(pg, x, y, d, planet) {
  pg.noStroke();
  let w = pg.width;
  let h = pg.height;
  let paletteColors = [planet.palette1, planet.palette2, planet.palette3]
  let randomColor = random(paletteColors)
  randomColor.setAlpha(30)
  pg.fill(randomColor)

  
    // Loop over offsets: drawing the circle at its original position,
    // and also at positions shifted by -w and +w horizontally and -h and +h vertically.
    for (let dx = -w; dx <= w; dx += w) {
      for (let dy = -h; dy <= h; dy += h) {
        pg.ellipse(x + dx, y + dy, d);
      }
  } 
}

function keyPressed() {
  if (key === 'W' || key === 'w') {
    movingUp = true;
  }
  if (key === 'S' || key === 's') {
    movingDown = true;
  }
  if (key === 'A' || key === 'a') {
    movingLeft = true;
  }
  if (key === 'D' || key === 'd') {
    movingRight = true;
  }
}

function keyReleased() {
  if (key === 'W' || key === 'w') {
    movingUp = false;
  }
  if (key === 'S' || key === 's') {
    movingDown = false;
  }
  if (key === 'A' || key === 'a') {
    movingLeft = false;
  }
  if (key === 'D' || key === 'd') {
    movingRight = false;
  }
}













