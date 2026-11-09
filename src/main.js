import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBoard } from './scene/createBoard.js';
import { SequenceController } from './animation/SequenceController.js';

const $=selector=>document.querySelector(selector);
const canvas=$('#scene'),viewport=$('.viewport'),status=$('#status'),sceneState=$('#sceneState'),stateLabel=$('#stateLabel'),progressFill=$('#progressFill');
if(!canvas||!viewport||!status||!sceneState||!stateLabel||!progressFill)throw new Error('Motherboard lab cannot start: required UI elements are missing.');

try{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#070b16');scene.fog=new THREE.FogExp2('#070b16',.022);
 const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(11,9,12);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,reduced.matches?1:1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04).texture;scene.environment=env;room.dispose();pmrem.dispose();
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=23;controls.maxPolarAngle=Math.PI*.49;controls.autoRotate=!reduced.matches;controls.autoRotateSpeed=.62;controls.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight('#a9d8ff','#111226',1.8));
 const key=new THREE.DirectionalLight('#d4edff',3.2);key.position.set(5,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;scene.add(key);
 const cyan=new THREE.PointLight('#18cfff',35,22,2);cyan.position.set(-7,5,-4);scene.add(cyan);const violet=new THREE.PointLight('#9d55ff',27,18,2);violet.position.set(6,4,5);scene.add(violet);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#080d1a',roughness:.9,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.05;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(80,80,'#17445d','#12243c');grid.position.y=-1.035;grid.material.transparent=true;grid.material.opacity=.24;scene.add(grid);
 const model=createBoard();model.root.position.y=-.12;scene.add(model.root);
 const starPositions=new Float32Array(650*3);let seed=0x5eed1234;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<650;i++){starPositions[i*3]=(random()-.5)*44;starPositions[i*3+1]=random()*18-2;starPositions[i*3+2]=(random()-.5)*44;}
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#71dfff',size:.035,transparent:true,opacity:.58,sizeAttenuation:true}));scene.add(stars);
 const sequence=new SequenceController({auto:!reduced.matches});let previous=0,lastPhase='';let disposed=false;
 function setStatus(message){status.textContent=message;}
 function setPhase(phase){if(phase===lastPhase)return;lastPhase=phase;const labels={idle:'AUTO CYCLE / READY',explode:'COMPONENTS / SEPARATING',hold:'DIAGNOSTIC / INSPECTION',assemble:'AUTO-RECOVERY / ALIGNING'};sceneState.textContent=labels[phase];setStatus(phase==='idle'?'SYSTEM NOMINAL // READY FOR INSPECTION':phase==='explode'?'ASSEMBLY SEPARATING // CONTROLLED MOTION':phase==='hold'?'SUBSYSTEMS EXPOSED // SIGNAL PATHS VISIBLE':'AUTO-RECOVERY // ALIGNING COMPONENTS');}
 function resize(){const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
 const onMotionChange=event=>{sequence.auto=!event.matches;controls.autoRotate=!event.matches;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,event.matches?1:1.6));};reduced.addEventListener('change',onMotionChange);
 $('#explodeBtn')?.addEventListener('click',()=>sequence.explode());$('#assembleBtn')?.addEventListener('click',()=>sequence.reassemble());$('#resetViewBtn')?.addEventListener('click',()=>{camera.position.set(11,9,12);controls.target.set(0,0,0);controls.update();});
 const onKey=event=>{if(event.code==='Space'&&!event.repeat&&!/^(INPUT|TEXTAREA|BUTTON)$/.test(event.target?.tagName||'')){event.preventDefault();if(sequence.progress>.5)sequence.reassemble();else sequence.explode();}};window.addEventListener('keydown',onKey);
 function animate(time){if(disposed)return;requestAnimationFrame(animate);const delta=Math.min(.05,(time-previous)*.001||.016),seconds=time*.001;previous=time;const state=sequence.update(delta),progress=state.progress;setPhase(state.phase);
  for(const item of model.parts){const e=item.accent,offset=item.offset;item.group.position.set(item.origin.x+offset.x*progress,item.origin.y+offset.y*progress,item.origin.z+offset.z*progress);item.group.rotation.x=Math.sin(progress*Math.PI)*e*.035;item.group.rotation.z=Math.sin(progress*Math.PI*2)*e*.018;}
  model.root.traverse(object=>{if(object.userData.rotor)object.rotation.y=seconds*3.4;});model.pulseMaterials.forEach((material,index)=>{material.emissiveIntensity=1.7+(Math.sin(seconds*4+index*.85)+1)*.8;});stars.material.opacity=.48+(Math.sin(seconds*.65)+1)*.1;cyan.intensity=31+Math.sin(seconds*1.3)*4;violet.intensity=25+Math.cos(seconds*1.1)*4;
  progressFill.style.width=Math.round((1-progress)*100)+'%';stateLabel.textContent=progress<.015?'LOCKED · 100%':progress>.985?'SEPARATED · 0%':'TRANSIT · '+Math.round((1-progress)*100)+'%';controls.update();renderer.render(scene,camera);
 }
 requestAnimationFrame(animate);
 window.addEventListener('pagehide',()=>{disposed=true;observer.disconnect();reduced.removeEventListener('change',onMotionChange);window.removeEventListener('keydown',onKey);scene.traverse(object=>{if(object.isMesh){object.geometry.dispose();if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());else object.material.dispose();}});env.dispose();renderer.dispose();},{once:true});
}catch(error){console.error('Motherboard lab initialization failed:',error);setStatus('3D INITIALIZATION FAILED // CHECK WEBGL SUPPORT');throw error;}
