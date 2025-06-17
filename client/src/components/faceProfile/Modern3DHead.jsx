// Create this as: components/faceProfile/Modern3DHead.jsx

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const Modern3DHead = ({ step, captureSteps }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const headModelRef = useRef(null);
  const animationIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentStep = captureSteps[step];

  // Head rotation targets for each step (more realistic angles)
  const getTargetRotation = () => {
    switch (currentStep.id) {
      case "front":
        return { x: 0, y: 0, z: 0 };
      case "right":
        return { x: 0, y: -Math.PI / 6, z: 0 }; // 30 degrees right
      case "left":
        return { x: 0, y: Math.PI / 6, z: 0 }; // 30 degrees left
      case "up":
        return { x: -Math.PI / 8, y: 0, z: 0 }; // 22.5 degrees up
      case "down":
        return { x: Math.PI / 8, y: 0, z: 0 }; // 22.5 degrees down
      default:
        return { x: 0, y: 0, z: 0 };
    }
  };

  const getStepColor = () => {
    switch (currentStep.id) {
      case "front":
        return new THREE.Color(0x10b981); // emerald
      case "right":
        return new THREE.Color(0x3b82f6); // blue
      case "left":
        return new THREE.Color(0x8b5cf6); // purple
      case "up":
        return new THREE.Color(0xf59e0b); // amber
      case "down":
        return new THREE.Color(0xef4444); // red
      default:
        return new THREE.Color(0x6b7280); // gray
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f2937); // Dark gray background
    sceneRef.current = scene;

    // Camera setup - adjusted for better view
    const camera = new THREE.PerspectiveCamera(
      45,
      300 / 300, // Square aspect ratio
      0.1,
      1000
    );
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(300, 300);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup for better model visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(2, 2, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 10;
    scene.add(directionalLight);

    // Fill light (softer from the side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    // Rim light (back lighting for definition)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // Load 3D model with DRACO support
    const loader = new GLTFLoader();
    
    // Set up DRACO decoder for compressed models
    const dracoLoader = new DRACOLoader();
    // Set the path to the DRACO decoder files (served from CDN)
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

    // Try multiple possible paths
    const possiblePaths = [
      "/models/generic_human_head_a.glb",
      "/generic_human_head_a.glb",
      "/assets/generic_human_head_a.glb",
      "./models/generic_human_head_a.glb",
      "./generic_human_head_a.glb"
    ];
    
    let currentPathIndex = 0;
    
    const tryLoadModel = (pathIndex = 0) => {
      if (pathIndex >= possiblePaths.length) {
        setError(`Could not load 3D model from any of these paths:
${possiblePaths.map(p => `- ${p}`).join('\n')}

Please verify:
1. File exists at: C:\\GitHub\\Groupify\\client\\public\\models\\generic_human_head_a.glb
2. File is a valid GLB format
3. Development server is running`);
        setIsLoading(false);
        return;
      }
      
      const currentPath = possiblePaths[pathIndex];
      console.log(`🔄 Trying path ${pathIndex + 1}/${possiblePaths.length}: ${currentPath}`);
      
      loader.load(
        currentPath,
        (gltf) => {
          console.log(`✅ Model loaded successfully from: ${currentPath}`);
          const model = gltf.scene;

        // Center the model and scale appropriately
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Scale the model to fit nicely in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim; // Adjust this value to make model larger/smaller
        model.scale.setScalar(scale);

        // Position the model slightly down to center the head better
        model.position.y -= 0.1;

        // Enable shadows and improve materials
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Improve material properties
            if (child.material) {
              child.material.side = THREE.FrontSide;
              
              // If it's a standard material, enhance it
              if (child.material.type === 'MeshStandardMaterial') {
                child.material.roughness = 0.8;
                child.material.metalness = 0.1;
              }
              
              // Ensure proper lighting response
              child.material.needsUpdate = true;
            }
          }
        });

        // Create a group to hold the model for easier rotation
        const modelGroup = new THREE.Group();
        modelGroup.add(model);
        scene.add(modelGroup);
        
        headModelRef.current = modelGroup;
        setIsLoading(false);
        setError(null);
      },
      (progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        console.log(`Loading progress: ${percentage.toFixed(1)}%`);
      },
      (error) => {
        console.error(`❌ Error loading from ${currentPath}:`, error);
        // Try next path
        tryLoadModel(pathIndex + 1);
      }
    );
  };
  
  // Start trying to load the model
  tryLoadModel();
    );

    // Animation loop with smooth transitions
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (headModelRef.current) {
        const targetRotation = getTargetRotation();
        const time = Date.now() * 0.001;

        // Smooth rotation animation (slower, more realistic)
        headModelRef.current.rotation.x = THREE.MathUtils.lerp(
          headModelRef.current.rotation.x,
          targetRotation.x,
          0.03 // Slower transition for more realistic movement
        );
        headModelRef.current.rotation.y = THREE.MathUtils.lerp(
          headModelRef.current.rotation.y,
          targetRotation.y,
          0.03
        );
        headModelRef.current.rotation.z = THREE.MathUtils.lerp(
          headModelRef.current.rotation.z,
          targetRotation.z,
          0.03
        );

        // Subtle breathing animation (very gentle)
        const breathingOffset = Math.sin(time * 1.2) * 0.008; // Slower, more subtle
        headModelRef.current.position.y += breathingOffset;

        // Very subtle head sway for natural look
        const swayX = Math.sin(time * 0.8) * 0.002;
        const swayZ = Math.cos(time * 0.6) * 0.001;
        headModelRef.current.rotation.x += swayX;
        headModelRef.current.rotation.z += swayZ;
      }

      // Update lighting color based on step (more gradual)
      if (directionalLight) {
        const targetColor = getStepColor();
        directionalLight.color.lerp(targetColor, 0.015); // Slower color transition
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      renderer.dispose();
      
      // Dispose of DRACO loader
      if (dracoLoader) {
        dracoLoader.dispose();
      }
      
      // Clean up geometry and materials
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // Update rotation when step changes
  useEffect(() => {
    // The rotation will be handled smoothly in the animation loop
    console.log(`🎯 Switching to step: ${currentStep.id}`);
  }, [step, currentStep]);

  const getGradientColor = () => {
    switch (currentStep.id) {
      case "front":
        return "from-emerald-400 to-green-500";
      case "right":
        return "from-blue-400 to-cyan-500";
      case "left":
        return "from-purple-400 to-violet-500";
      case "up":
        return "from-amber-400 to-orange-500";
      case "down":
        return "from-red-400 to-pink-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
        3D AI Position Guide
      </div>

      {/* 3D Model Container */}
      <div className="relative">
        {/* Glow effect background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${getGradientColor()} rounded-2xl blur-xl opacity-30 animate-pulse`}
          style={{ transform: "scale(1.1)" }}
        />

        {/* 3D Model Mount Point */}
        <div
          ref={mountRef}
          className="relative w-80 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-600"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-white text-sm">Loading 3D Model...</p>
              <p className="text-gray-300 text-xs mt-1">generic_human_head_a.glb</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 rounded-2xl p-4">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-red-200 text-sm mb-2 font-medium">Model Loading Failed</p>
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Direction Indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {currentStep.id === "right" && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 text-4xl font-bold animate-bounce">
              →
            </div>
          )}
          {currentStep.id === "left" && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 text-4xl font-bold animate-bounce">
              ←
            </div>
          )}
          {currentStep.id === "up" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-orange-400 text-4xl font-bold animate-bounce">
              ↑
            </div>
          )}
          {currentStep.id === "down" && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-red-400 text-4xl font-bold animate-bounce">
              ↓
            </div>
          )}
        </div>

        {/* Step indicator in corner */}
        {!isLoading && !error && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            Step {step + 1}: {currentStep.title}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center space-y-3">
        <div
          className={`text-xl font-bold bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent`}
        >
          {currentStep.title}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          {currentStep.tip}
        </div>

        {/* AI Instruction indicator */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <div
            className={`w-3 h-3 bg-gradient-to-r ${getGradientColor()} rounded-full animate-ping`}
          />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Follow the 3D model's position
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {captureSteps.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === step
                ? `bg-gradient-to-r ${getGradientColor()} shadow-lg scale-125`
                : "bg-gray-300 dark:bg-gray-600 scale-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Modern3DHead;