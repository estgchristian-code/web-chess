import { test, expect } from '@playwright/test';

test('inspect scoreboard panel visibility - detailed', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="chessboard-board"]', { timeout: 10000 });
  
  // Wait a bit more for useEffect to run
  await page.waitForTimeout(500);
  
  // Check isMobile state by evaluating the component
  const isMobileState = await page.evaluate(() => {
    // Find the React fiber for GameScreen
    const root = document.querySelector('#root');
    if (!root) return null;
    
    // Get the internal React state
    const fiber = root._reactRootContainer?.current?.child;
    return fiber;
  });
  
  // Check sidebar className again after wait
  const sidebar = page.locator('aside[aria-label="Painel lateral"]');
  const sidebarClassName = await sidebar.getAttribute('class');
  console.log('Sidebar className after wait:', sidebarClassName);
  
  // Check viewport
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  console.log('Viewport:', viewport);
  
  // Check if scoreboard is in viewport
  const scoreboardPanel = page.locator('[data-testid="scoreboard-panel"]');
  const scoreboardBox = await scoreboardPanel.boundingBox();
  console.log('Scoreboard panel bounding box:', scoreboardBox);
  
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  console.log('Viewport height:', viewportHeight);
  
  if (scoreboardBox) {
    const isInViewport = scoreboardBox.y < viewportHeight && scoreboardBox.y + scoreboardBox.height > 0;
    console.log('Scoreboard in viewport:', isInViewport);
    console.log('Scoreboard y position:', scoreboardBox.y);
  }
  
  // Check sidebar position
  const sidebarBox = await sidebar.boundingBox();
  console.log('Sidebar bounding box:', sidebarBox);
  
  // Check transform
  const sidebarTransform = await sidebar.evaluate(el => window.getComputedStyle(el).transform);
  console.log('Sidebar transform:', sidebarTransform);
});