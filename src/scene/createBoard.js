import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const box=(w,h,d,r=.05)=>new RoundedBoxGeometry(w,h,d,3,r);


export function createBoard(){
 const root=new THREE.Group(), assembly=new THREE.Group(), parts=[], pulseMaterials=[];
 root.add(assembly);
 const m={
  pcb:new THREE.MeshStandardMaterial({color:'#123b36',metalness:.58,roughness:.34}),
  dark:new THREE.MeshStandardMaterial({color:'#101827',metalness:.78,roughness:.23}),
  metal:new THREE.MeshStandardMaterial({color:'#a8bbca',metalness:.92,roughness:.2}),
  copper:new THREE.MeshStandardMaterial({color:'#bd8054',metalness:.9,roughness:.22,emissive:'#351409',emissiveIntensity:.3}),
  cyan:new THREE.MeshStandardMaterial({color:'#60eaff',metalness:.55,roughness:.2,emissive:'#04b9e8',emissiveIntensity:1.35}),
  violet:new THREE.MeshStandardMaterial({color:'#9e7bff',metalness:.62,roughness:.2,emissive:'#4c1ce0',emissiveIntensity:1.1}),
  ceramic:new THREE.MeshStandardMaterial({color:'#e5edf2',metalness:.38,roughness:.24})
 };
 const add=(parent,geometry,material,pos=[0,0,0])=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const part=(name,pos,offset,accent=1)=>{const group=new THREE.Group();group.position.set(...pos);assembly.add(group);parts.push({name,group,origin:group.position.clone(),offset:new THREE.Vector3(...offset),accent});return group;};
 const shape=new THREE.Shape(); shape.moveTo(-4.86,-3.38);shape.lineTo(4.86,-3.38);shape.quadraticCurveTo(5,-3.38,5,-3.24);shape.lineTo(5,3.24);shape.quadraticCurveTo(5,3.38,4.86,3.38);shape.lineTo(-4.86,3.38);shape.quadraticCurveTo(-5,3.38,-5,3.24);shape.lineTo(-5,-3.24);shape.quadraticCurveTo(-5,-3.38,-4.86,-3.38);
 const substrate=add(assembly,new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.055,bevelThickness:.045,curveSegments:12}),m.pcb);substrate.rotation.x=-Math.PI/2;substrate.position.y=-.28;
 add(assembly,box(10.08,.1,6.84,.09),m.dark,[0,-.34,0]);
 const paths=[[[-.7,.04,-.7],[-.7,.04,-1.45],[-2.8,.04,-1.45],[-3.4,.04,-2.05]],[[.4,.04,-.65],[1.35,.04,-.65],[1.7,.04,-1.75],[3.25,.04,-1.75]],[[-.65,.04,.5],[-1.4,.04,.5],[-1.8,.04,1.8],[-3.55,.04,1.8]],[[.55,.04,.4],[1.5,.04,.4],[2.2,.04,1.6],[3.75,.04,1.6]],[[-1.6,.04,-.45],[-2.8,.04,-.45],[-3.2,.04,.05],[-4.25,.04,.05]],[[1.55,.04,-.2],[2.55,.04,-.2],[3.15,.04,.35],[4.4,.04,.35]],[[-.5,.04,1],[-.5,.04,2.1],[.6,.04,2.6],[2,.04,2.6]],[[.45,.04,-1],[.45,.04,-2.35],[1.3,.04,-2.8],[3.4,.04,-2.8]]];
 paths.forEach((path,i)=>{const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p)),false,'centripetal');add(assembly,new THREE.TubeGeometry(curve,36,i<4?.026:.014,8,false),i%3===0?m.cyan:m.copper);});
 for(const [x,z] of [[-4.55,-2.95],[4.55,-2.95],[-4.55,2.95],[4.55,2.95]]){const ring=add(assembly,new THREE.TorusGeometry(.16,.035,12,40),m.copper,[x,.07,z]);ring.rotation.x=Math.PI/2;add(assembly,new THREE.CylinderGeometry(.09,.09,.018,32),m.dark,[x,.05,z]);}
 const socket=part('LGA SOCKET',[-.55,.12,-.3],[-.65,1.15,-.5],.7);add(socket,box(2.12,.16,2,.1),m.dark);add(socket,box(1.86,.1,1.72,.07),m.metal,[0,.13,0]);
 const cpu=part('PROCESSOR',[-.55,.34,-.3],[-.65,2,-.55]);add(cpu,box(1.43,.25,1.35,.11),m.ceramic);add(cpu,box(1.12,.035,1.04,.06),m.violet,[0,.145,0]);
 const cooler=part('COOLER / FAN',[-.55,.78,-.3],[-.6,3.15,-.55],1.4);add(cooler,box(1.38,.5,1.38,.18),m.dark);const rotor=new THREE.Group();rotor.position.y=.28;rotor.userData.rotor=true;cooler.add(rotor);add(rotor,new THREE.TorusGeometry(.48,.045,12,48),m.cyan);add(rotor,new THREE.CylinderGeometry(.14,.14,.12,32),m.metal);for(let i=0;i<9;i++){const blade=add(rotor,box(.12,.035,.48,.025),i%2?m.metal:m.violet,[.18,0,0]);blade.rotation.y=i*Math.PI*2/9;}
 for(let i=0;i<2;i++){const z=-.9+i*1.08,dimm=part('DDR5 MEMORY '+(i+1),[2.05,.62,z],[1.15,1.65+i*.25,z<0?-1.2:1.2],.8);add(dimm,box(.42,1.35,.3,.06),m.dark);add(dimm,box(.29,.92,.32,.045),i?m.violet:m.cyan);for(let p=0;p<12;p++)add(dimm,box(.018,.13,.035,.008),m.copper,[-.16+p*.029,-.67,.16]);}
 const pcie=part('PCIe GEN5',[.25,.28,2.1],[.1,1.15,2.6]);add(pcie,box(5.2,.2,.68,.08),m.dark);add(pcie,box(4.2,.16,.54,.06),m.violet,[.25,.17,0]);add(pcie,box(.28,.7,.7,.06),m.metal,[-2.4,.2,0]);for(let p=0;p<28;p++)add(pcie,box(.035,.022,.15,.01),m.copper,[-1.65+p*.12,-.12,.14]);
 const chipset=part('CHIPSET / HEATSINK',[2.55,.13,1],[1.8,1.55,1],1.1);add(chipset,box(1.35,.22,1.15,.1),m.dark);add(chipset,box(.95,.16,.78,.08),m.cyan,[0,.2,0]);for(let i=0;i<7;i++)add(chipset,box(.055,.35,.78,.02),m.metal,[-.34+i*.11,.43,0]);
 for(let i=0;i<6;i++){const x=-2.72+i*.52,vrm=part('VRM PHASE '+(i+1),[x,.12,-2.3],[x<0?-1.15:1.15,.95,-1.65],.6);add(vrm,box(.34,.35,.4,.045),m.dark);add(vrm,box(.23,.4,.25,.035),i%2?m.violet:m.cyan,[0,.34,0]);}
 for(let i=0;i<10;i++){const x=-4+(i%5)*.39,z=2.45+Math.floor(i/5)*.52,cap=part('SOLID CAPACITOR '+(i+1),[x,.2,z],[x<0?-.95:.95,.82,.95],.5);add(cap,new THREE.CylinderGeometry(.12,.12,.38,32),i%2?m.dark:m.violet);add(cap,new THREE.CylinderGeometry(.095,.095,.02,32),m.metal,[0,.2,0]);}
 const io=part('REAR I/O ARMOR',[-4.55,.4,-.1],[-1.8,.8,0],.8);add(io,box(.5,.8,2,.08),m.dark);for(let i=0;i<4;i++)add(io,box(.08,.19,.25,.025),i%2?m.violet:m.cyan,[.28,-.22+i*.15,-.6+(i%2)*.8]);
 for(let i=0;i<5;i++){const ledMat=new THREE.MeshStandardMaterial({color:'#63efff',emissive:'#09c8ff',emissiveIntensity:2,metalness:.35,roughness:.2});const led=add(assembly,new THREE.SphereGeometry(.055,24,16),ledMat,[-3.6+i*.32,.1,-.7]);led.userData.phase=i*.85;pulseMaterials.push(ledMat);}
 const power=part('24-PIN POWER',[4.1,.25,-2.5],[1.3,.9,-1.25],.8);add(power,box(.82,.54,.72,.09),m.ceramic);add(power,box(.58,.6,.48,.06),m.dark,[0,.3,0]);
 return {root,assembly,parts,pulseMaterials,rotors:[rotor]};

}
