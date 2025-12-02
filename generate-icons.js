// 简单的 PNG 图标生成脚本
// 运行: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cornerRadius = size / 4;
  
  // Background with blue color
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, cornerRadius);
  ctx.fill();
  
  // Calculator icon
  const center = size / 2;
  const iconSize = size * 0.6;
  
  // Draw calculator body
  const rectSize = iconSize * 0.7;
  const rectX = center - rectSize / 2;
  const rectY = center - rectSize / 2;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(rectX, rectY, rectSize, rectSize);
  
  // Draw display
  ctx.fillStyle = 'white';
  ctx.fillRect(rectX + rectSize * 0.1, rectY + rectSize * 0.1, rectSize * 0.8, rectSize * 0.2);
  
  // Draw buttons
  const buttonSize = rectSize * 0.15;
  const gap = rectSize * 0.08;
  const startX = rectX + rectSize * 0.1;
  const startY = rectY + rectSize * 0.4;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillStyle = 'white';
      ctx.fillRect(
        startX + col * (buttonSize + gap),
        startY + row * (buttonSize + gap),
        buttonSize,
        buttonSize
      );
    }
  }
  
  return canvas;
}

// Generate 192x192 icon
const canvas192 = drawIcon(192);
const buffer192 = canvas192.toBuffer('image/png');
fs.writeFileSync('./public/icon-192.png', buffer192);
console.log('✓ Generated icon-192.png');

// Generate 512x512 icon
const canvas512 = drawIcon(512);
const buffer512 = canvas512.toBuffer('image/png');
fs.writeFileSync('./public/icon-512.png', buffer512);
console.log('✓ Generated icon-512.png');

console.log('\nIcons generated successfully!');
