/* A small town whose facilities feed the existing hero progression. */
(()=>{
'use strict';
let selectedFacility='training',mapStamp='',detailStamp='';
const number=n=>n.toLocaleString(),icon={wood:'▰',stone:'◆',rune:'✦'};
function buildingArt(id,level=1){
 const stone='#536969',shadow='#263b43',light='#86998b',wood='#725746',gold='#d6bc81',glass='#edcd8b';
 const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
 const roof=(color,w=52)=>[rect(32-w/2,20,w,6,color),rect(32-w/2+5,14,w-10,6,color),rect(32-w/2+11,8,w-22,6,color),rect(28,4,8,4,color)].join('');
 let art=rect(5,59,54,4,'#152a31')+rect(13,26,38,32,stone)+rect(15,29,4,27,light)+rect(43,29,7,27,shadow)+rect(27,40,11,18,wood);
 if(id==='hall'){art+=roof('#9e6452')+rect(21,23,22,14,wood)+rect(27,25,10,8,gold)+rect(8,57,48,4,light)+rect(18,43,5,8,glass)+rect(42,43,5,8,glass)}
 if(id==='training'){art+=roof('#78877b')+rect(5,41,5,19,wood)+rect(0,44,15,4,gold)+rect(3,38,9,4,gold)+rect(50,39,5,21,wood)+rect(46,45,13,4,wood)+rect(49,38,8,7,'#a79266')+rect(23,31,4,15,'#c7d1c8')+rect(20,41,10,3,gold)}
 if(id==='smith'){art+=roof('#8a6650')+rect(43,4,10,31,shadow)+rect(41,3,14,5,stone)+rect(17,35,18,20,'#192b31')+rect(21,43,10,11,'#d28855')+rect(24,46,4,8,'#f0c178')+rect(44,48,17,4,light)+rect(49,52,6,7,stone)+rect(42,59,19,3,shadow)}
 if(id==='sanctuary'){art+=roof('#729d88')+rect(25,16,12,5,'#d0dbb0')+rect(29,12,4,13,'#d0dbb0')+rect(15,33,8,9,glass)+rect(42,33,7,9,glass)+rect(0,54,12,7,wood)+rect(3,45,5,10,'#91b389')+rect(53,55,11,6,wood)+rect(56,44,5,12,'#91b389')}
 if(id==='mage'){art=rect(12,58,40,4,shadow)+rect(21,16,25,43,stone)+rect(23,20,4,35,light)+rect(38,19,7,40,shadow)+rect(26,39,12,19,wood)+roof('#81749d',40)+rect(29,0,6,7,'#c6b7e2')+rect(28,23,9,11,'#b6addb')+rect(30,25,5,7,'#e3daf0')+rect(16,52,36,8,stone)}
 if(id==='library'){art+=roof('#657f98')+rect(16,32,9,11,glass)+rect(39,32,9,11,glass)+rect(24,21,16,10,wood)+rect(27,23,4,6,'#d3c39f')+rect(32,23,5,6,'#aabaaf')+rect(1,54,13,7,wood)+rect(3,50,10,4,'#a5906e')}
 if(id==='workshop'){art+=roof('#96846a')+rect(5,33,8,23,wood)+rect(50,33,8,23,wood)+rect(17,42,25,14,wood)+rect(19,44,21,3,'#a38c63')+rect(2,55,20,5,'#9a805c')+rect(6,50,18,5,'#87694f')+rect(45,55,17,6,light)+rect(49,50,10,5,stone)}
 if(level>=5)art+=rect(52,13,2,24,wood)+rect(54,13,9,8,id==='mage'?'#b9a0cf':'#b8bf91');
 if(level>=10)art+=rect(18,55,4,4,gold)+rect(45,55,4,4,gold);
 return `<svg viewBox="0 0 64 64" shape-rendering="crispEdges" aria-hidden="true">${art}</svg>`;
}
function effect(id,level){switch(id){
 case 'hall':return '다른 시설의 최대 레벨 Lv.'+Math.min(20,level*2)+' · 회관 Lv.2 대장간/마법 연구소, Lv.3 도서관 해금';
 case 'training':return '공통 공격력 +'+level*6+' · 검과 마법 무기 모두 적용';
 case 'smith':return '장착 무기 공격력 +'+level*3+'%';
 case 'sanctuary':return '최대 체력 +'+level*40;
 case 'mage':return '마법 공격력 +'+level*4+'% · 마법 무기 장착 시 적용';
 case 'library':return '배운 스킬의 골드 강화 비용 -'+Math.min(40,level*2)+'%';
 case 'workshop':return '분당 목재 '+workshopRate(level,'wood')+' · 석재 '+workshopRate(level,'stone')+' · 마력석 '+workshopRate(level,'rune');
 }}
function select(id){if(!villageFacilities.some(d=>d.id===id))return;selectedFacility=id;render();}
function render(){
 if(view!=='village')return;
 const v=s.village,hall=townLevel('hall'),built=villageFacilities.filter(d=>townLevel(d.id)>0).length;
 $('villageHallLevel').textContent='Lv. '+hall;$('villageBuiltCount').textContent='시설 '+built+' / '+villageFacilities.length;
 $('villageMaterials').innerHTML=Object.keys(materialLabels).map(k=>`<div class="materialPill ${k}"><span>${icon[k]}</span><div><small>${materialLabels[k]}</small><strong>${number(v.materials[k])}</strong></div></div>`).join('');
 const mapKey=JSON.stringify([v.buildings,selectedFacility]);
 if(mapKey!==mapStamp){mapStamp=mapKey;
 $('villageMap').innerHTML='<div class="villageLantern lanternA"></div><div class="villageLantern lanternB"></div>'+villageFacilities.map(d=>{const lv=townLevel(d.id),locked=hall<d.unlock;return `<button class="villagePlot ${lv?'built':'unbuilt'} ${selectedFacility===d.id?'selected':''}" style="left:${d.x}%;top:${d.y}%;--facility-color:${d.color}" data-facility="${d.id}" aria-pressed="${selectedFacility===d.id}" aria-label="${d.name}, ${lv?'레벨 '+lv:locked?'회관 레벨 '+d.unlock+' 필요':'건설 가능'}">${buildingArt(d.id,lv)}<b>${d.name}</b><small>${lv?'Lv. '+lv:locked?'회관 Lv.'+d.unlock:'빈 부지'}</small></button>`}).join('');
 $('villageFacilityList').innerHTML=villageFacilities.map(d=>`<button class="${selectedFacility===d.id?'active':''}" data-facility="${d.id}" aria-pressed="${selectedFacility===d.id}">${d.name}<span>${townLevel(d.id)?'Lv.'+townLevel(d.id):'미건설'}</span></button>`).join('');
 }
 const d=villageFacilities.find(d=>d.id===selectedFacility),lv=townLevel(d.id),price=villageCost(d.id),reason=villageBuildReason(d.id),max=lv>=d.max;
 const detailKey=JSON.stringify([selectedFacility,v.buildings,v.materials,s.gold]);
 if(detailKey!==detailStamp){detailStamp=detailKey;
 $('villageDetail').innerHTML=`<div class="facilityPortrait" style="--facility-color:${d.color}">${buildingArt(d.id,Math.max(1,lv))}<span>${d.tag}</span></div><span class="eyebrow">${lv?'LEVEL '+lv+' / '+d.max:'NEW FACILITY'}</span><h2>${d.name}</h2><p class="facilityLore">${d.lore}</p><div class="facilityEffect"><small>현재 효과</small><p>${lv?effect(d.id,lv):'아직 시설이 없습니다.'}</p></div>${!max?'<div class="facilityEffect next"><small>'+(lv?'다음 레벨':'건설 후')+'</small><p>'+effect(d.id,lv+1)+'</p></div>':''}${!max?'<div class="facilityCosts"><span class="'+(s.gold<price.gold?'short':'')+'">G '+number(price.gold)+'</span>'+Object.keys(materialLabels).filter(k=>price[k]>0).map(k=>'<span class="'+(v.materials[k]<price[k]?'short':'')+'">'+materialLabels[k]+' '+number(price[k])+'</span>').join('')+'</div>':''}<button class="primary villageBuild" data-build-facility="${d.id}" ${reason?'disabled':''}>${max?'최고 레벨':lv?'시설 강화 · Lv.'+(lv+1):'시설 건설'}</button><p class="facilityRequirement" role="status">${reason||'골드와 자재를 사용하면 바로 완성됩니다.'}</p>`;
 }
 const p=villageProduction(),rate=townLevel('workshop');
 $('villageProductionRate').textContent=rate?effect('workshop',rate):'자원 작업장을 지으면 자재 생산을 시작합니다.';
 $('villageStock').innerHTML=Object.keys(materialLabels).map(k=>`<div><small>${materialLabels[k]}</small><b>${number(p.stock[k])}</b></div>`).join('');
 $('collectVillage').disabled=!Object.values(p.stock).some(n=>n>0);
 $('villageBonusList').innerHTML=[['공통 공격력','+'+townBonus('attack')],['장착 무기 공격력','+'+Math.round(townBonus('weaponPct')*100)+'%'],['최대 체력','+'+townBonus('hp')],['마법 공격력','+'+Math.round(townBonus('magicPct')*100)+'%'+(weaponSchool()==='mage'?' · 활성':' · 마법 무기 필요')],['스킬 강화 비용','-'+Math.round(townBonus('trainingDiscount')*100)+'%']].map(([label,value])=>'<div><span>'+label+'</span><b>'+value+'</b></div>').join('');
}
for(const id of ['villageMap','villageFacilityList'])$(id).onclick=e=>{const b=e.target.closest('[data-facility]');if(b)select(b.dataset.facility)};
$('villageDetail').onclick=e=>{const b=e.target.closest('[data-build-facility]');if(b&&!b.disabled)buildVillage(b.dataset.buildFacility)};
$('collectVillage').onclick=collectVillageProduction;
window.Village={render,select,buildingArt,effect};
render();setInterval(()=>{if(view==='village')render()},1000);
})();
