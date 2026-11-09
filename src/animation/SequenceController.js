const DURATIONS={idle:4.5,explode:1.9,hold:3.2,assemble:1.9};
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};

export class SequenceController{
 constructor({auto=true}={}){this.auto=auto;this.phase='idle';this.elapsed=0;this.progress=0;}
 explode(){this.phase='explode';this.elapsed=0;this.progress=0;}
 reassemble(){this.phase='assemble';this.elapsed=0;this.progress=1;}
 update(delta){
  let remaining=Math.min(Math.max(delta,0),.25),changed=false;
  if(this.phase==='idle'&&this.auto){this.elapsed+=remaining;if(this.elapsed>=DURATIONS.idle){remaining=this.elapsed-DURATIONS.idle;this.phase='explode';this.elapsed=0;changed=true;}else remaining=0;}
  while(remaining>0&&this.phase!=='idle'){
   const duration=DURATIONS[this.phase],step=Math.min(remaining,duration-this.elapsed);
   this.elapsed+=step;remaining-=step;
   if(this.phase==='explode')this.progress=smooth(this.elapsed/duration);
   else if(this.phase==='hold')this.progress=1;
   else if(this.phase==='assemble')this.progress=1-smooth(this.elapsed/duration);
   if(this.elapsed>=duration){
    this.elapsed=0;changed=true;
    if(this.phase==='explode'){this.phase='hold';this.progress=1;}
    else if(this.phase==='hold'){this.phase='assemble';}
    else {this.phase='idle';this.progress=0;}
   }
  }
  return{phase:this.phase,progress:this.progress,changed};
 }
}
