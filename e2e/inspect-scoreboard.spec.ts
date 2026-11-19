import { test, expect } from '@playwright/test';

test('inspect scoreboard panel visibility', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="chessboard-board"]', { timeout: 10000 });
  
  // Check if scoreboard panel exists in DOM
  const scoreboardPanel = page.locator('[data-testid="scoreboard-panel"]');
  const exists = await scoreboardPanel.count();
  console.log('Scoreboard panel count:', exists);
  
  if (exists > 0) {
    const isVisible = await scoreboardPanel.isVisible();
    console.log('Scoreboard panel visible:', isVisible);
    
    // Get bounding box
    const box = await scoreboardPanel.boundingBox();
    console.log('Scoreboard panel bounding box:', box);
    
    // Get computed styles
    const styles = await scoreboardPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        width: computed.width,
        overflow: computed.overflow,
        position: computed.position,
        zIndex: computed.zIndex,
      };
    });
    console.log('Scoreboard panel styles:', styles);
    
    // Check parent elements
    const parentInfo = await scoreboardPanel.evaluate(el => {
      const parents = [];
      let current = el.parentElement;
      while (current && parents.length < 5) {
        const computed = window.getComputedStyle(current);
        parents.push({
          tag: current.tagName,
          className: current.className,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          height: computed.height,
          width: computed.width,
          overflow: computed.overflow,
          position: computed.position,
        });
        current = current.parentElement;
      }
      return parents;
    });
    console.log('Parent elements:', JSON.stringify(parentInfo, null, 2));
  }
  
  // Check sidebar
  const sidebar = page.locator('aside[aria-label="Painel lateral"]');
  const sidebarCount = await sidebar.count();
  console.log('Sidebar count:', sidebarCount);
  
  if (sidebarCount > 0) {
    const sidebarVisible = await sidebar.isVisible();
    console.log('Sidebar visible:', sidebarVisible);
    
    const sidebarBox = await sidebar.boundingBox();
    console.log('Sidebar bounding box:', sidebarBox);
    
    const sidebarStyles = await sidebar.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        width: computed.width,
        transform: computed.transform,
        position: computed.position,
      };
    });
    console.log('Sidebar styles:', sidebarStyles);
  }
  
  // Check viewport
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  console.log('Viewport:', viewport);
});