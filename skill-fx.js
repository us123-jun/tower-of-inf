/* Cosmetic skill events only. Damage, rewards and proc timing stay in the combat engines. */
(()=>{
'use strict';
const canvas=$('skillEffectCanvas'),ctx=canvas.getContext('2d'),cap=64;
const defs={
 '마력탄':{id:'arcane',kind:'arcane',color:'#c7a8ff',life:.72},
 '마력 공명':{id:'echo',kind:'echo',color:'#e0caff',life:.65},
 '화염구':{id:'fire',kind:'fire',color:'#ffac66',life:.85},
 '화상':{id:'ignite',kind:'burn',color:'#ee8458',life:.55},
 '얼음 창':{id:'frost',kind:'frost',color:'#a6e9f0',life:.8},
 '얼음 보호막':{id:'iceWard',kind:'ward',color:'#9cdaec',life:1},
 '연쇄 번개':{id:'spark',kind:'spark',color:'#e7d68c',life:.55},
 '천둥의 심판':{id:'thunder',kind:'thunder',color:'#fff1b8',life:.85},
 '메테오':{id:'meteor',kind:'meteor',color:'#ffb07b',life:1.15},
 '블리자드':{id:'blizzard',kind:'blizzard',color:'#b2ebfa',life:1.15},
 '폭풍 베기':{id:'storm',kind:'storm',color:'#9fdfcc',life:.72},
 '생명 흡수':{id:'drain',kind:'heal',color:'#b2e6a0',life:.8},
 '치명적 일격':{id:'executioner',kind:'execution',color:'#f4b8a4',life:.5},
 '철벽 수호':{id:'guard',kind:'guard',color:'#e2d29e',life:.55}
};
let effects=[],last=0,serial=0;
const visible=()=>!document.hidden&&document.body.dataset.screen==='combat'&&phase==='battle';
function clear(channel){effects=channel?effects.filter(f=>f.channel!==channel):[];if(!channel||channel==='idle')ctx.clearRect(0,0,canvas.width,canvas.height);}
function sync(){canvas.hidden=isActionTower()||!visible();if(!visible())clear();}
function idlePoints(){const box=document.querySelector('.arena').getBoundingClientRect(),heroBox=document.querySelector('.hero .sprite').getBoundingClientRect(),enemyBox=document.querySelector('.enemy .sprite').getBoundingClientRect();return {from:{x:heroBox.left+heroBox.width/2-box.left,y:heroBox.top+heroBox.height-box.top-8},to:{x:enemyBox.left+enemyBox.width/2-box.left,y:enemyBox.top+enemyBox.height-box.top-8},size:Math.max(.65,Math.min(1.6,heroBox.height/116)),dir:1};}
function emit(names,opts={}){
 if(!visible()||paused)return 0;
 const channel=opts.channel||(isActionTower()?'action':'idle');if((channel==='action')!==isActionTower())return 0;
 const points=channel==='idle'?idlePoints():opts;if(!points.from||!points.to)return 0;
 const mode=opts.phase||(channel==='idle'?'sequence':'impact');let added=0;
 for(const name of new Set(names)){
  const d=defs[name];if(!d||!skillActive(d.id))continue;
  const self=['ward','guard','heal'].includes(d.kind);
  if(mode==='cast'&&!self&&weaponSchool()!=='mage')continue;
  if(mode==='impact'&&self)continue;
  if(mode==='block'&&d.kind!=='ward'&&d.kind!=='guard')continue;
  if(mode==='cast'&&d.kind==='burn')continue;
  const intensity=Math.min(1.5,1+(trainingBoost(d.id)-1)*.25+(rank(d.id)-1)*.06);
  effects.push({...d,name,channel,mode,age:0,life:mode==='cast'&&!self?.32:d.life,from:{x:points.from.x,y:points.from.y},to:{x:points.to.x,y:points.to.y},size:points.size||1,dir:points.dir||1,intensity,seed:++serial,captionRow:added%3,label:mode!=='cast'||self});added++;
  if(name==='마력탄'&&skillActive('echo')&&mode!=='cast')effects.push({...defs['마력 공명'],name:'마력 공명',channel,mode,age:0,from:{...points.from},to:{...points.to},size:points.size||1,dir:points.dir||1,intensity,seed:++serial,label:false});
 }
 if(effects.length>cap)effects.splice(0,effects.length-cap);return added;
}
function step(dt,channel){if(paused||phase!=='battle')return;const delta=Math.max(0,Math.min(.1,dt));for(const f of effects)if(f.channel===channel)f.age+=delta;effects=effects.filter(f=>f.age<f.life);}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,w,h);}
function line(c,pts,color,width=4){for(let j=1;j<pts.length;j++){const a=pts[j-1],b=pts[j],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let i=0;i<=count;i++){const t=i/count;rect(c,a[0]+(b[0]-a[0])*t-width/2,a[1]+(b[1]-a[1])*t-width/2,width,width,color)}}}
function ring(c,x,y,rx,ry,color,phase=0,width=3){const points=[];for(let i=0;i<=36;i++){const a=i*Math.PI/18+phase;points.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry])}line(c,points,color,width);}
function crystal(c,x,y,h,color){for(let i=0;i<h;i+=4){const w=Math.max(3,Math.min(18,i*.6,(h-i)*.8));rect(c,x-w/2,y+i,w,5,color)}line(c,[[x,y+9],[x,y+h-4]],'#ecfbff',3);}
function motes(c,f,t,color,count=12,radius=75,up=false){for(let i=0;i<count;i++){const a=i*2.4+f.seed*.37,r=(.25+t*.75)*radius*(.4+(i%4)*.2),x=Math.cos(a)*r,y=-50+Math.sin(a)*r*.6-(up?t*65:0);rect(c,x,y,i%3===0?6:3,i%3===0?6:3,color)}}
function glyph(c,color,t){ring(c,0,1,48+8*t,15+3*t,color);for(let i=0;i<6;i++){const a=i*Math.PI/3+t;rect(c,Math.cos(a)*43,-4+Math.sin(a)*14,5,5,'#f3e5d3')}}
function label(c,f,t,y=-135){if(!f.label||f.kind==='burn')return;c.save();c.globalAlpha*=Math.min(1,t*9);c.font='bold 17px Spire,sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#0a1820';c.strokeText(f.name,0,y-t*12-(f.captionRow||0)*19);c.fillStyle=f.color;c.fillText(f.name,0,y-t*12-(f.captionRow||0)*19);c.restore();}
function reduced(c,f){const self=['ward','guard','heal'].includes(f.kind),p=self||f.mode==='cast'?f.from:f.to;c.save();c.translate(p.x,p.y);c.scale(f.size,f.size);c.globalAlpha=.8;ring(c,0,-45,30,40,f.color);label(c,f,.5,-110);c.restore();}
function drawOne(c,f){
 const t=f.age/f.life,self=['ward','guard','heal'].includes(f.kind),at=self?f.from:f.to,fade=Math.min(1,t*12)*Math.min(1,(1-t)*5);
 c.save();c.globalAlpha=fade;
 if(f.mode==='cast'&&!self){c.translate(f.from.x,f.from.y);c.scale(f.size,f.size);glyph(c,f.color,t);motes(c,f,1-t,f.color,8,40);c.restore();return;}
 // Idle battles show the cast travelling to the enemy before its impact, with no damage scheduling.
 if(f.mode==='sequence'&&!self&&t<.2&&['arcane','fire','frost','spark'].includes(f.kind)){
  const p=t/.2,x=f.from.x+(f.to.x-f.from.x)*p,y=f.from.y+(f.to.y-f.from.y)*p-53*f.size;
  for(let i=5;i>=0;i--)rect(c,x-i*8*f.size,y-3*f.size,Math.max(3,(11-i)*f.size),6*f.size,i===0?'#fff4df':f.color);
  c.restore();return;
 }
 c.translate(at.x,at.y);c.scale(f.size*f.intensity,f.size*f.intensity);
 const q=f.mode==='sequence'&&!self?Math.max(0,(t-.2)/.8):t;
 switch(f.kind){
 case 'arcane':
  ring(c,0,-53,12+q*40,12+q*40,f.color,q,4);ring(c,0,-53,8+q*23,8+q*23,'#f1e1ff',-q,3);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+q;line(c,[[Math.cos(a)*9,-53+Math.sin(a)*9],[Math.cos(a)*(30+q*30),-53+Math.sin(a)*(30+q*30)]],f.color)}motes(c,f,q,f.color,10,64);break;
 case 'echo':
  for(let i=0;i<3;i++){const a=q*7+i*Math.PI*2/3,x=Math.cos(a)*45,y=-53+Math.sin(a)*30;rect(c,x,y,9,9,f.color);line(c,[[x-10,y],[x+10,y]],'#fff1ff',3)}break;
 case 'fire':
  ring(c,0,0,26+q*57,9+q*16,'#c26c47');for(let i=0;i<11;i++){const x=(i-5)*10,h=(35+((i*17)%35))*(1-q*.7);for(let y=0;y<h;y+=6)rect(c,x+Math.sin(q*12+i+y)*5,-y,Math.max(4,14-y*.1),7,y<h*.55?'#ffc67c':'#e98655')}motes(c,f,q,'#ffd992',14,78,true);break;
 case 'burn':for(let i=0;i<5;i++){const x=(i-2)*12,y=-22-q*54+(i%2)*13;rect(c,x,y,7,13,'#e78255');rect(c,x+2,y+5,4,7,'#ffd38b')}break;
 case 'frost':
  for(let i=-1;i<=1;i++){c.save();c.translate(i*27,0);c.rotate(i*.18);crystal(c,0,-95*(1-q*.15),80,f.color);c.restore()}ring(c,0,0,25+q*36,8+q*12,'#7fbdcf');motes(c,f,q,'#c9f4fc',10,65);break;
 case 'ward':
  ring(c,0,-48,51,72,f.color);ring(c,0,-48,45,65,'#d9f4fd');for(let i=0;i<6;i++){const a=i*Math.PI/3+q*.5;crystal(c,Math.cos(a)*48,-48+Math.sin(a)*60-9,18,f.color)}glyph(c,'#7eacbf',q);if(f.mode==='block')motes(c,f,q,'#d7f7ff',14,60);break;
 case 'spark':case 'thunder':{
  const strong=f.kind==='thunder',height=strong?270:120,pts=[[strong?-38:-65,-height]];
  for(let i=1;i<=7;i++)pts.push([Math.sin(i*4+f.seed+Math.floor(q*6))*24,-height+(height-35)*i/7]);
  line(c,pts,strong?'#b8a7ea':'#e6c56c',strong?11:7);line(c,pts,'#fff8d3',3);
  if(strong){line(c,[[35,-185],[12,-130],[38,-132],[0,-35]],'#efd994',4);glyph(c,'#c9b8e0',q)}ring(c,0,-29,18+q*50,9+q*21,f.color);motes(c,f,q,'#fff2bb',12,73);break;}
 case 'meteor':{
  if(q<.48){const p=q/.48,x=-125*(1-p),y=-260*(1-p)-35;for(let i=7;i>=0;i--){rect(c,x-i*10,y-i*13,24-i*2,26-i*2,i>3?'#b25f50':'#ed9966')}rect(c,x-12,y-15,28,28,'#f8b67d');rect(c,x-7,y-8,13,14,'#fff0bd')}
  else{const p=(q-.48)/.52;ring(c,0,-5,22+p*125,10+p*34,'#edaf75',0,5);ring(c,0,-5,17+p*91,7+p*24,'#ffd7a2');for(let i=0;i<7;i++)rect(c,(i-3)*18,-(1-p)*(65-8*Math.abs(i-3)),13,22,'#e38b5d');motes(c,f,p,'#f7c28b',23,130,true)}break;}
 case 'blizzard':
  ring(c,0,0,90,25,'#8abbd0');ring(c,0,-30,84,24,f.color,q*4);for(let i=0;i<19;i++){const x=Math.sin(i*2.4+q*8)*(45+(i%5)*12),y=-155+((q*180+i*19)%155);rect(c,x,y,5,8,i%3?'#c7f1f7':'#81b9d7')}for(let i=-2;i<=2;i++)crystal(c,i*28,-26+(i%2)*8,35+12*(i%2===0),f.color);break;
 case 'storm':
  for(let i=0;i<3;i++){const pts=[],angle=-1.5+q*3+(i-1)*.23;for(let a=-1.3;a<=1.3;a+=.13)pts.push([f.dir*(Math.cos(a+angle)*86-22),-50+Math.sin(a+angle)*64]);line(c,pts,i===1?'#f2edcf':f.color,i===1?6:3)}glyph(c,'#658e87',q);motes(c,f,q,f.color,12,92);break;
 case 'execution':line(c,[[-39,-100],[39,-20]],'#ffe0ca',7);line(c,[[34,-104],[-34,-17]],f.color,5);motes(c,f,q,'#e3aa97',8,56);break;
 case 'heal':
  for(let i=0;i<5;i++){const x=(i-2)*18,y=-20-q*75+(i%2)*20;rect(c,x-7,y,15,4,f.color);rect(c,x-2,y-5,5,15,f.color)}ring(c,0,0,37,12,'#83b993');break;
 case 'guard':
  line(c,[[-29,-92],[0,-101],[29,-92],[26,-51],[0,-27],[-26,-51],[-29,-92]],f.color,4);line(c,[[0,-91],[0,-42]],'#f6ebc7',3);line(c,[[-18,-73],[18,-73]],'#f6ebc7',3);motes(c,f,q,'#e0cda0',7,47);break;
 }
 label(c,f,q);c.restore();
}
function draw(context,channel){const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;for(const f of effects)if(f.channel===channel){if(reducedMotion)reduced(context,f);else drawOne(context,f)}}
function frame(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;sync();
 if(!canvas.hidden){const box=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,box.width,box.height);ctx.imageSmoothingEnabled=false;step(dt,'idle');draw(ctx,'idle');}
 requestAnimationFrame(frame);
}
window.SkillFX={emit,step,draw,clear,sync,snapshot(){return effects.map(f=>({name:f.name,kind:f.kind,mode:f.mode,channel:f.channel,age:f.age,life:f.life,from:{...f.from},to:{...f.to},label:f.label}))}};
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)clear();});
sync();requestAnimationFrame(frame);
})();
