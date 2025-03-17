let stars = [];
let spaceJunk = [];
let numStars = 50;    // Balanced star count
let junkSpawnRate = 60; // Higher means less frequent
let planets = [];
let numPlanets = 15;
let shipX = 0;
let shipY = 0;
let shipSpeed = 5;
let movingUp = false;
let movingDown = false;
let movingLeft = false;
let movingRight = false;
let lazerXOffset = 250;
let lazerYOffset = -200;
let lazerTimeFrames = 4;
let lazerTimer = lazerTimeFrames;
let blastX = 0;
let blastY = 0;
let lazerMaxWeight = 5
let junkSpawnAreaX = 0.1;
let junkSpawnAreaY = 0.1;
let shipSize = 100;
let damageShakeFrames = 10;
let damageShakeFrameEnd = 0;
let damageShakeMagnitude = 5;
let paralaxSpeed = 25000
let framesTillDifficultyInrease = 3000
let myFont;
let score = 0;
let crackedGlass = [];
let health = 100;
let gameOn = true;
// We'll use an offscreen buffer for color-picking.
let pickBuffer;

function preload() {
  myFont = loadFont('assets/PublicPixel-rv0pA.ttf');
  for (let i = 0; i < 3; i++) {
    crackedGlass.push(loadImage(`assets/New Piskel-${i+1}.png.png`))
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
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
  textFont(myFont);
}

function draw() {
  background(0)
  cursor(CROSS)
  resetMatrix();
  ortho();

  // Draw 2D HUD elements
  textAlign(CENTER, TOP);
  blendMode(BLEND)
  textSize(30);
  text(`Score: ${score}`, 0, -height / 2 + 10);
  text(`Health: ${health}`, 0, -height / 2 + 40);
  
  let img;
  if (health <= 30) {
    img = crackedGlass[2]
  } else if (health <= 60) {
    img = crackedGlass[1]
  } else if (health <= 90) {
    img = crackedGlass[0]
  }
  if (health <= 0) {
    textSize(60);
    text("Game Over", 0,0);
    gameOn = false;
  }
  textAlign(LEFT);
  textSize(30);
  text(`WASD = MOVE`, -width/2 + 20, -height/2 + 20);
  text(`LCLICK = SHOOT\n SPACE JUNK`, -width/2 + 20, -height/2 + 60);
  text(`R = RESET`, -width/2 + 20, -height/2 + 140);
  

  // Switch back to 3D
  perspective();
  
  stroke("green")
  lazerTimer++
  if (frameCount % framesTillDifficultyInrease == 0) {
    junkSpawnRate = Math.max(10, floor(junkSpawnRate * (2/3)));
  }
  
  if (lazerTimer <= lazerTimeFrames) {
    strokeWeight(lazerMaxWeight/lazerTimer)
    line(lerp(lazerXOffset, blastX-(width/2), lazerTimer/lazerTimeFrames), lerp(height/2 - lazerYOffset, blastY-(height/2), lazerTimer/lazerTimeFrames),
    lerp(lazerXOffset, blastX-(width/2), Math.min(1, (lazerTimer+1)/lazerTimeFrames)), lerp(height/2 - lazerYOffset, blastY-(height/2), Math.min(1, (lazerTimer+1)/lazerTimeFrames)))
    line(lerp(-lazerXOffset, blastX-(width/2), lazerTimer/lazerTimeFrames), lerp(height/2 - lazerYOffset, blastY-(height/2), lazerTimer/lazerTimeFrames),
    lerp(-lazerXOffset, blastX-(width/2), Math.min(1, (lazerTimer+1)/lazerTimeFrames)), lerp(height/2 - lazerYOffset, blastY-(height/2), Math.min(1, (lazerTimer+1)/lazerTimeFrames)))
  }
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

    /*
    // Remove expired junk
    if (spaceJunk[i].isExpired()) {
      spaceJunk.splice(i, 1);
    }*/
   if (spaceJunk[i].z > 1500 && 
    spaceJunk[i].x >= -shipSize+shipX && spaceJunk[i].x <= shipSize+shipX &&
    spaceJunk[i].y >= -shipSize+shipY && spaceJunk[i].y <= shipSize+shipY
  ) {
      //hit ship
        spaceJunk.splice(i, 1);
        damageShakeFrameEnd = frameCount + damageShakeFrames;
        health -= 10;
   } else if (spaceJunk[i].z > 1800) {
    score -= 5
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

  if (frameCount < damageShakeFrameEnd) {
    shipX += random(-damageShakeMagnitude, damageShakeMagnitude);
    shipY += random(-damageShakeMagnitude, damageShakeMagnitude);
  }
  if (img) {
    push()
    translate(0, 0, 1500);
    noStroke()
    texture(img)
    plane(width/2 - 150,height/2 - 150)
    pop()
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
    
    this.z = random(-3000, 3000);
    this.speed = 15 //map(this.z, 0, 3000, 20, 5);
    this.baseSize = random(3, 7);
  }

  update() {
    this.speed = paralaxSpeed/(dist(this.x, this.y, this.z, shipX, shipY, 1500))
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
    this.x = random(-width * junkSpawnAreaX, width * junkSpawnAreaX) + shipX;
    this.y = random(-height * junkSpawnAreaY, height * junkSpawnAreaY) + shipY;
    
    // Don’t spawn right in front of the camera:
    this.z = random(700, 800)

    // Moderate speed variation
    this.speed = (paralaxSpeed/(dist(this.x, this.y, this.z, shipX, shipY, 1500))) / 10 //random(4, 8);

    // Size limit
    this.size = 30;

    // Mild, independent rotation speeds
    this.rotationXSpeed = random(0.01, 0.05);
    this.rotationYSpeed = random(0.01, 0.05);

    // Lifetime for a 3-second fade-out
    this.creationTime = millis();
    this.maxLifetime = 6000;

    // Select a random model from the provided spaceJunkList
    this.spaceJunkObject = floor(random(2));
  }

  update() {
    this.z += this.speed;
  }

  show() {
    let lifetime = millis() - this.creationTime;

    push();
    translate(this.x - shipX, this.y - shipY, this.z);
    rotateX(frameCount * this.rotationXSpeed);
    rotateY(frameCount * this.rotationYSpeed);
    noStroke();
    fill(200, 150, 50, alpha);

    // Draw the selected junk type
    if (this.spaceJunkObject === 0) {
      this.drawPipe();
    } else if (this.spaceJunkObject === 1) {
      this.drawLamp();
    }

    pop();
  }

  drawLamp() {
    push();
    sphere(15, 6, 6);
    pop();

    push();
    fill(100);
    translate(0, -18, 0);
    box(5, 30, 5);
    pop();

    push();
    fill(120);
    translate(0, -35, 0);
    cylinder(10, 5);
    pop();
  }

  drawPipe() {
    fill(120);
    push();
    cylinder(8, 40); // Pipe body
    pop();

    push();
    fill(200);
    translate(0, -20, 0);
    sphere(10, 6, 6);
    translate(0, 40, 0);
    sphere(10, 6, 6);
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
    this.planetTexture = createGraphics(width, height);
    console.log("planet made")
    this.reset();
  }

  reset() {
    this.x = random(-width*3, width*3) + shipX;
    this.y = random(-height*3, height*3) + shipY;
    this.z = random(-5000, -8000);
    this.speed = (paralaxSpeed/(dist(this.x, this.y, this.z, shipX, shipY, 1500))) * 3//map(this.z, -7000, -8000, 20, 5);
    this.baseSize = random(1, 4) * 150;
    this.palette1 = color(random(255), random(255), random(255));
    this.palette2 = color(random(255), random(255), random(255));
    this.palette3 = color(random(255), random(255), random(255));
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
  if (!gameOn) {
    return;
  }
  lazerTimer = 0;
  blastX = mouseX;
  blastY = mouseY;
  checkJunkDelete()
}

function checkJunkDelete() {
  // 1) Clear the pick buffer and match the main camera transform:
  pickBuffer.background(0, 255, 255);
  
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
    //pickBuffer.rotateX(frameCount * junk.rotationSpeed);
    //pickBuffer.rotateY(frameCount * junk.rotationSpeed);
    
    // Unique color ID in the red channel:
    pickBuffer.noStroke();
    pickBuffer.fill(i+1, 0, 0); //the ensure red is greater than 0
    pickBuffer.box(40);
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
  let index = floor(4 * (mouseX + mouseY * floor(width)));
  let r = pickBuffer.pixels[index + 2]; // We used the red channel as the ID

  // 4) If that "red" ID matches a piece of junk, remove it.
  if (r > 0) {
    score += 5
    spaceJunk.splice(r-1, 1); //every index is 1 off
  }
}

function drawPlanet(planet) {
  palette1 = planet.palette1;
  palette2 = planet.palette2;
  palette3 = planet.palette3;
  rotateY(frameCount * 0.01)
  noStroke();
  texture(planet.planetTexture);
  sphere(planet.baseSize);
  return;
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
  if (key === 'R' || key === 'r') {
    score = 0;
    health = 100
    gameOn = true
    junkSpawnRate = 60
    spaceJunk = []
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













