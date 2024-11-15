// 1. Create the PixiJS Application
const app = new PIXI.Application({
    width: 400,
    height: 600,
    backgroundColor: 0x1099bb,
  });
  document.body.appendChild(app.view);
  
  // 2. Create the Character
  const character = new PIXI.Graphics();
  character.beginFill(0xff0000); // Red color
  character.drawRect(0, 0, 30, 30); // 30x30 square
  character.endFill();
  character.x = app.screen.width / 2 - 15; // Center horizontally
  character.y = app.screen.height - 90; // Start above the floor
  
  app.stage.addChild(character);
  
  // 3. Variables for Movement and Physics
  let velocityY = 0;
  const gravity = 0.5;
  const jumpStrength = -10;
  
  // 4. Platforms Array
  const platforms = [];
  
  // 5. Create the Floor
  function createFloor() {
    const floor = new PIXI.Graphics();
    floor.beginFill(0x654321); // Brown color for the floor
    floor.drawRect(0, 0, app.screen.width, 30); // Floor size
    floor.endFill();
    floor.x = 0;
    floor.y = app.screen.height - 30; // Positioned at the bottom
    app.stage.addChild(floor);
    platforms.push(floor);
  }
  
  createFloor(); // Call the function to create the floor
  
  // 6. Generate Initial Platforms (Optional, you can comment this out if not needed)
  function createPlatform(x, y) {
    const platform = new PIXI.Graphics();
    platform.beginFill(0x00ff00); // Green color
    platform.drawRect(0, 0, 60, 10); // Platform size
    platform.endFill();
    platform.x = x;
    platform.y = y;
    app.stage.addChild(platform);
    platforms.push(platform);
  }
  
  /*
  // Uncomment this section if you want additional platforms above the floor
  for (let i = 1; i < 5; i++) {
    createPlatform(
      Math.random() * (app.screen.width - 60),
      app.screen.height - 100 - i * 100 // Stacked vertically above the floor
    );
  }
  */
  
  // 7. Keyboard Input for Left and Right Movement
  const keys = {};
  
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  
  // 8. Game Loop
  app.ticker.add(() => {
    // Apply gravity
    velocityY += gravity;
    character.y += velocityY;
  
    // Move left and right
    if (keys['ArrowLeft']) {
      character.x -= 5;
    }
    if (keys['ArrowRight']) {
      character.x += 5;
    }
  
    // Wrap around the screen horizontally
    if (character.x > app.screen.width) {
      character.x = -character.width;
    } else if (character.x + character.width < 0) {
      character.x = app.screen.width;
    }
  
    // Collision Detection with Platforms
    for (let platform of platforms) {
      if (
        character.x + character.width > platform.x &&
        character.x < platform.x + platform.width &&
        character.y + character.height > platform.y &&
        character.y + character.height < platform.y + platform.height &&
        velocityY >= 0
      ) {
        velocityY = jumpStrength; // Jump up
      }
    }
  
    // Prevent character from falling through the floor
    if (character.y + character.height > app.screen.height) {
      character.y = app.screen.height - character.height;
      velocityY = 0;
    }
  });
  