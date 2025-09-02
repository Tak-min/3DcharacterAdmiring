import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store/store';

// プレースホルダーモデルのURL
const MODEL_URL = '/models/character.glb';

// 3Dモデルコンポーネント
function Character({ animation }) {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  
  // アニメーションミキサーの設定
  const mixer = useRef(new THREE.AnimationMixer(scene));
  const currentAction = useRef();
  
  // カメラ位置の初期設定
  useEffect(() => {
    camera.position.set(0, 1.5, 2);
    camera.lookAt(0, 1, 0);
  }, [camera]);
  
  // モデルのクローンとマテリアルの設定
  useEffect(() => {
    // GLTFシーンをクローン
    const model = scene.clone();
    
    // グループに追加
    group.current.clear();
    group.current.add(model);
    
    // アニメーションのセットアップ
    if (animations.length) {
      mixer.current = new THREE.AnimationMixer(model);
    }
    
    return () => {
      // クリーンアップ
      model.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(material => material.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [scene, animations]);
  
  // アニメーションの更新
  useEffect(() => {
    if (!animations.length) return;
    
    // 前のアクションを停止
    if (currentAction.current) {
      currentAction.current.fadeOut(0.5);
    }
    
    // 指定されたアニメーション名に基づいてアニメーションを検索
    const clip = animations.find(anim => anim.name === animation) || 
                animations.find(anim => anim.name === 'Idle_Neutral') || 
                animations[0];
    
    if (clip) {
      // 新しいアクションを開始
      const action = mixer.current.clipAction(clip);
      action.reset().fadeIn(0.5).play();
      currentAction.current = action;
    }
  }, [animation, animations]);
  
  // アニメーションの更新（フレームごと）
  useFrame((_, delta) => {
    mixer.current.update(delta);
  });
  
  return (
    <group ref={group} dispose={null} position={[0, 0, 0]} />
  );
}

// エラー処理のためのモデルプリロード
useGLTF.preload(MODEL_URL);

// メインの3Dシーンコンポーネント
const CharacterScene = () => {
  const currentAnimation = useStore(state => state.currentAnimation);
  
  return (
    <div className="character-canvas">
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Character animation={currentAnimation} />
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={1.5}
          maxDistance={4}
        />
      </Canvas>
    </div>
  );
};

export default CharacterScene;
