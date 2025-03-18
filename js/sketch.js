let stars = [];
let spaceJunk = [];
let numStars = 50;    // Balanced star count
let junkSpawnRate = 60; // Higher means less frequent
let planets = [];
let numPlanets = 5;
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
let lazerMaxWeight = 10;
let junkSpawnAreaX = 0.3;
let junkSpawnAreaY = 0.2;
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
let explosions = []
let explosionLifespan = 250
let milestones = [50, 100, 150, 250]; // Milestone scores
let currentMilestone = 0; // Track the current milestone
let milestoneMessage = ""; // Store the milestone message
let milestoneDisplayTime = 2; // Track how long the message is displayed
let milestoneAnimationStart = 0; // Track when the animation started
let milestoneAnimationDuration = 30; // Duration of the glitchy effect (in frames)
let astronautImg;

const milestoneMessages = [
  "One step forward for humanity!",
  "Every piece of trash removed brings us closer to a cleaner future.",
  "The stars shine brighter as we clean up our mess.",
  "Cheers to being eco-friendly."
];

function preload() {
  myFont = loadFont('assets/PublicPixel-rv0pA.ttf');
  for (let i = 0; i < 3; i++) {
    crackedGlass.push(loadImage(`assets/New Piskel-${i+1}.png.png`))
  }
  astronautImg = loadImage('assets/astronaut.png');
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
  textAlign(RIGHT, TOP); // Align text to the top-right
  blendMode(BLEND);
  textSize(30);
  fill(255); // Ensure text is visible (white color)
  
  // Position text in the top-right corner with some padding
  let padding = 20; // Adjust this value for spacing from the edges
  text(`Score: ${score}`, width / 2 - padding, -height / 2 + padding);
  text(`Health: ${health}`, width / 2 - padding, -height / 2 + padding + 40);
  
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
    strokeWeight(lazerMaxWeight * 2 /lazerTimer)
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

      // Check for collision with the player
    if (checkPlanetCollision(planet)) {
      health = 0; // Set health to 0
      gameOn = false; // End the game
      break; // Exit the loop
    }
  }

  for (let i = explosions.length-1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].show();
    if (explosions[i].isFinished()) {
      explosions.splice(i, 1)
    }
  }

  // Spawn junk periodically
  if (frameCount % junkSpawnRate === 0 && spaceJunk.length < 10) {
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

  if (currentMilestone < milestones.length && score >= milestones[currentMilestone]) {
    milestoneMessage = milestoneMessages[currentMilestone];
    milestoneDisplayTime = frameCount + 180; // Display message for 3 seconds (60 FPS * 3)
    milestoneAnimationStart = frameCount; // Start the animation
    currentMilestone++; // Move to the next milestone
  }
  
  if (frameCount < milestoneDisplayTime) {
    let animationProgress = (frameCount - milestoneAnimationStart) / milestoneAnimationDuration;
    animationProgress = constrain(animationProgress, 0, 1); // Clamp between 0 and 1

    // Glitchy effect: Randomly offset the text and image position
    if (animationProgress < 1) {
      let offsetX = random(-10, 10);
      let offsetY = random(-10, 10);
      translate(offsetX, offsetY);
    }

    // Fade in the text and image
    let opacity = map(animationProgress, 0, 1, 0, 255);
    fill(255, opacity);
    tint(255, opacity); // Apply opacity to the image

    // Move the text and image into position
    let textY = map(animationProgress, 0, 1, height / 2 + 100, height / 2 + 50);
    let imageX = -textWidth(milestoneMessage) / 2 - 200; // Further to the left
    let imageY = textY - astronautImg.height / 6; // Slightly higher to align with text

    // Draw the astronaut image (smaller size)
    let imageScale = 0.4; // Scale down to 40% of original size
    image(astronautImg, imageX, imageY, astronautImg.width * imageScale, astronautImg.height * imageScale);

    // Draw the milestone text
    textSize(30);
    textAlign(CENTER, CENTER);
    text(milestoneMessage, 0, textY);
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
// Explosion Class
// ----------------------------------------------------
class Explosion {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    this.vel = p5.Vector.random3D();
    this.vel.mult(random(1, 3));
    this.lifespan = explosionLifespan;
    this.r = random(3, 6);
    this.c1 = color(120, 0, 0);
    this.c2 = color(120, 120, 0);
  }
  
  update() {
    this.pos.add(this.vel);
    this.lifespan -= 4;
  }
  
  show() {
    push();
    translate(this.pos.x-shipX, this.pos.y-shipY, this.pos.z);
    let col = lerpColor(this.c2, this.c1, this.lifespan/explosionLifespan)//color(red(this.c1), green(this.c1), blue(this.c1), this.lifespan);
    col.setAlpha(this.lifespan)
    fill(col);
    noStroke()
    sphere(this.r);
    pop();
  }
  
  isFinished() {
    return this.lifespan < 0;
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
    this.z = random(0, 100)

    // Moderate speed variation
    this.speed = (paralaxSpeed / (dist(this.x, this.y, this.z, shipX, shipY, 1500))) / 5; 

    // Size limit
    this.size = 30;

    // Mild, independent rotation speeds
    this.rotationXSpeed = random(0.01, 0.05);
    this.rotationYSpeed = random(0.01, 0.05);

    // Lifetime for a 3-second fade-out
    this.creationTime = millis();
    this.maxLifetime = 6000;

    // Select a random model from the provided spaceJunkList
    this.spaceJunkObject = floor(random(6));
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
    } else if (this.spaceJunkObject === 2) {
      this.drawHouse();
    } else if (this.spaceJunkObject === 3) {
      this.drawCar();
    } else if (this.spaceJunkObject === 4) {
      this.drawGuitar();
    } else if (this.spaceJunkObject === 5) {
      this.drawSatellite();
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


  drawGuitar() {
    fill(150, 75, 0);
    push();
    translate(0, -35, 0);
    rotateX(HALF_PI);
    cylinder(10, 6);
    pop();

    push();
    fill(100);
    translate(0, -18, 0);
    box(6, 30, 5); // Guitar neck
    pop();
    
    push();
    fill(75);
    translate(1, -17, 3);
    box(1, 37, 0.5); // Guitar string
    pop();
    push();
    fill(75);
    translate(-1.5, -17, 3);
    box(1, 37, 0.5); // Guitar string
    pop();

    push();
    fill(120);
    translate(0, 0, 0);
    box(8, 10, 5); // Guitar headstock
    pop();
  }

  drawSatellite() {
    push();
    fill(180);
    box(20, 20, 20);
    translate(0, -12, 0);
    box(15, 15, 15);
    pop();

    push();
    fill(50, 50, 255);
    translate(-18, 0, 0);
    box(3, 30, 50); // Left panel support
    translate(-10, 0, 0);
    box(3, 30, 50); // Left panel
    pop();

    push();
    fill(50, 50, 255);
    translate(15, 0, 0);
    box(3, 30, 50); // Right panel support
    translate(10, 0, 0);
    box(3, 30, 50); // Right panel
    pop();
  }

  drawHouse() {
    push();
    // House base
    fill(150, 100, 50); // Brown color for the walls
    translate(0, -20, 0); // Center the house
    box(40, 40, 40); // Main house structure
  
    // Roof
    fill(100, 50, 0); // Dark brown color for the roof
    translate(0, -20, 0); // Position the roof on top of the house
  
    // Front triangle
    beginShape();
    vertex(-20, 0, -20); // Bottom-left corner
    vertex(20, 0, -20);  // Bottom-right corner
    vertex(0, -30, 0);   // Top-center point
    endShape(CLOSE);
  
    // Back triangle
    beginShape();
    vertex(-20, 0, 20);  // Bottom-left corner (back)
    vertex(20, 0, 20);   // Bottom-right corner (back)
    vertex(0, -30, 0);   // Top-center point
    endShape(CLOSE);
  
    // Left side triangle
    beginShape();
    vertex(-20, 0, -20); // Bottom-left corner (front)
    vertex(-20, 0, 20);  // Bottom-left corner (back)
    vertex(0, -30, 0);   // Top-center point
    endShape(CLOSE);
  
    // Right side triangle
    beginShape();
    vertex(20, 0, -20);  // Bottom-right corner (front)
    vertex(20, 0, 20);   // Bottom-right corner (back)
    vertex(0, -30, 0);   // Top-center point
    endShape(CLOSE);

    // Door
    fill(100, 50, 50); // Red color for the door
    translate(0, 29, 21); // Position the door at the front of the house
    box(10, 20, 5); // Door shape

    // Windows
    fill(200, 200, 255); // Light blue color for the windows
    translate(-15, -15, -21); // Left window
    box(12, 15, 5);
    translate(30, 5, 1); // Right window
    box(12, 15, 5);
  
    pop();
  }

  drawCar() {
    push();
    fill(200, 0, 0); // Red color for the car body
    box(60, 30, 30); // Car body
  
    // Wheels
    fill(255); // White color for the wheels
    // Front wheels
    translate(-20, 15, -15); // Lowered and aligned with the bottom
    sphere(10); // Front-left wheel
    translate(40, 0, 0);
    sphere(10); // Front-right wheel
  
    // Rear wheels
    translate(0, -30, 0); // Move to the rear
    sphere(10); // Rear-right wheel
    translate(-40, 0, 0);
    sphere(10); // Rear-left wheel
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
    this.reset();
  }

  reset() {
    this.x = random(-width*3, width*3) + shipX;
    this.y = random(-height*3, height*3) + shipY;
    this.z = random(-5000, -8000);
    this.speed = (paralaxSpeed / (dist(this.x, this.y, this.z, shipX, shipY, 1500))) * 1.5;
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
    for (let i = 0; i < 20; i++) {
      explosions.push(new Explosion(spaceJunk[r-1].x, spaceJunk[r-1].y, spaceJunk[r-1].z))
    }
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

function checkPlanetCollision(planet) {
  // Calculate the distance in 3D space (X, Y, and Z)
  let dx = shipX - planet.x;
  let dy = shipY - planet.y;
  let dz = 1500 - planet.z; // 1500 is the player's Z position (from the camera setup)

  // Calculate the 3D distance
  let distance = sqrt(dx * dx + dy * dy + dz * dz);

  // Define collision thresholds
  let planetSize = planet.baseSize / 2; // Approximate planet radius
  let playerSize = shipSize / 2; // Approximate player radius

  // Check if the distance is less than the sum of the radii
  if (distance < playerSize + planetSize) {
    return true; // Collision detected
  }
  return false; // No collision
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
    health = 100;
    gameOn = true;
    junkSpawnRate = 60;
    spaceJunk = [];
    currentMilestone = 0;
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

