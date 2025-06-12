/**
 * Tailwind CSS Animation Helpers
 * Custom animation generators for use with Tailwind CSS
 */

/**
 * Creates a sine wave animation keyframe set
 * @param amplitude - The maximum displacement of the wave
 * @param frequency - The number of complete waves
 * @returns Animation keyframe object
 */
export function createSineWaveAnimation(amplitude: number = 10, frequency: number = 1) {
  const steps = 20;
  const keyframes: Record<string, { transform: string }> = {};
  
  for (let i = 0; i <= steps; i++) {
    const percent = (i / steps) * 100;
    const radian = (i / steps) * Math.PI * 2 * frequency;
    const y = Math.sin(radian) * amplitude;
    
    keyframes[`${percent}%`] = {
      transform: `translateY(${y}px)`
    };
  }
  
  return keyframes;
}

/**
 * Creates a glowing animation keyframe set
 * @param minOpacity - Minimum opacity value in the animation
 * @param maxOpacity - Maximum opacity value in the animation
 * @param steps - Number of steps in the animation
 * @returns Animation keyframe object
 */
export function createGlowAnimation(minOpacity: number = 0.4, maxOpacity: number = 0.8, steps: number = 4) {
  const keyframes: Record<string, { opacity: string }> = {};
  
  // Create the glow-up part (first half)
  for (let i = 0; i <= steps; i++) {
    const percent = (i / steps) * 50;
    const opacity = minOpacity + ((maxOpacity - minOpacity) * (i / steps));
    keyframes[`${percent}%`] = { opacity: opacity.toString() };
  }
  
  // Create the glow-down part (second half)
  for (let i = 0; i <= steps; i++) {
    const percent = 50 + (i / steps) * 50;
    const opacity = maxOpacity - ((maxOpacity - minOpacity) * (i / steps));
    keyframes[`${percent}%`] = { opacity: opacity.toString() };
  }
  
  return keyframes;
}

/**
 * Creates a 3D rotation animation keyframe set
 * @param axis - The axis to rotate around ('x', 'y', or 'z')
 * @param degrees - The maximum rotation in degrees
 * @returns Animation keyframe object
 */
export function create3DRotationAnimation(axis: 'x' | 'y' | 'z', degrees: number = 360) {
  return {
    '0%': { transform: `rotate${axis.toUpperCase()}(0deg)` },
    '100%': { transform: `rotate${axis.toUpperCase()}(${degrees}deg)` }
  };
}

/**
 * Creates a morphing border radius animation
 * @returns Animation keyframe object with changing border radius
 */
export function createMorphingAnimation() {
  return {
    '0%': { borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' },
    '25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
    '50%': { borderRadius: '20% 40% 50% 70% / 30% 40% 70% 60%' },
    '75%': { borderRadius: '40% 20% 30% 50% / 60% 30% 70% 40%' },
    '100%': { borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' }
  };
}

/**
 * Creates a floating animation with subtle rotation
 * @param yMovement - The pixel amount to move vertically
 * @param rotationDegree - The maximum rotation in degrees
 * @returns Animation keyframe object
 */
export function createFloatingAnimation(yMovement: number = 10, rotationDegree: number = 3) {
  return {
    '0%': { transform: `translateY(0) rotate(0deg)` },
    '25%': { transform: `translateY(-${yMovement/2}px) rotate(-${rotationDegree/2}deg)` },
    '50%': { transform: `translateY(-${yMovement}px) rotate(${rotationDegree/4}deg)` },
    '75%': { transform: `translateY(-${yMovement/2}px) rotate(${rotationDegree}deg)` },
    '100%': { transform: `translateY(0) rotate(0deg)` }
  };
}

/**
 * Creates a shimmering gradient animation keyframe set
 * @param startPosition - Starting position in pixels
 * @param endPosition - Ending position in pixels
 * @returns Animation keyframe object
 */
export function createShimmerAnimation(startPosition: number = -200, endPosition: number = 200) {
  return {
    '0%': { backgroundPosition: `${startPosition}px 0` },
    '100%': { backgroundPosition: `${endPosition}px 0` }
  };
} 