import React, { useEffect, useRef } from 'react';

export default function CursorAnimation() {
  const canvasRef = useRef(null);
  const trailBoxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const trailBox = trailBoxRef.current;
    if (!trailBox) return;

    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    let trail = { x: canvas.width / 2, y: canvas.height / 2 };
    let velocity = { x: 0, y: 0 };
    let trailPoints = [];

    const PIXEL_SIZE = 35;
    const glowingPixels = new Map();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Calculate which grid square the cursor is in
      const gridX = Math.floor(mouse.x / PIXEL_SIZE) * PIXEL_SIZE;
      const gridY = Math.floor(mouse.y / PIXEL_SIZE) * PIXEL_SIZE;
      const key = `${gridX},${gridY}`;
      
      // Add this pixel to glowing pixels with full brightness
      glowingPixels.set(key, { x: gridX, y: gridY, alpha: 0.3 });
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update trail position with smooth easing
      const dx = mouse.x - trail.x;
      const dy = mouse.y - trail.y;
      trail.x += dx * 0.15;
      trail.y += dy * 0.15;
      
      // Calculate velocity for deformation
      velocity.x = dx * 0.15;
      velocity.y = dy * 0.15;
      
      // Add current position to trail points
      trailPoints.unshift({ x: trail.x, y: trail.y });
      if (trailPoints.length > 15) {
          trailPoints.pop();
      }
      
      // Draw comet trail on canvas
      if (trailPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
          
          for (let i = 0; i < trailPoints.length; i++) {
              const point = trailPoints[i];
              const alpha = 1 - (i / trailPoints.length);
              ctx.lineTo(point.x, point.y);
          }
          
          // Draw the trail shape
          for (let i = 0; i < trailPoints.length; i++) {
              const point = trailPoints[i];
              const alpha = 1 - (i / trailPoints.length);
              const size = 12 * alpha;
              
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
              ctx.fillRect(point.x - size/2, point.y - size/2, size, size);
          }
      }

      // Update trail box position
      trailBox.style.left = (trail.x - 6) + 'px';
      trailBox.style.top = (trail.y - 6) + 'px';
      trailBox.style.transform = 'scale(1)';

      // Draw and fade glowing pixels
      glowingPixels.forEach((pixel, key) => {
          // Draw the pixel in red
          ctx.fillStyle = `rgba(255, 0, 0, ${pixel.alpha})`;
          ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE - 3, PIXEL_SIZE - 3);
          
          // Fade out faster
          pixel.alpha -= 0.05;
          
          // Remove if fully faded
          if (pixel.alpha <= 0) {
              glowingPixels.delete(key);
          }
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
      <div
        ref={trailBoxRef}
        className="trail-box"
        style={{
          position: 'fixed',
          width: '12px',
          height: '12px',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </>
  );
}
