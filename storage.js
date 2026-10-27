/* Keep this key stable across releases. Player saves never belong in the Git repository. */
(()=>{
'use strict';
const KEY='eternity-stages-v2',BACKUP=KEY+'.backup',SCHEMA=1;
let known=null,lastBackupAt=0,loaded=false;
const status={saved:false,error:'',recovered:false,readOnly:false};
function decode(raw){
 if(!raw)return null;const data=JSON.parse(raw);
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid save');
 if(!['gold','best','floor','inventory','atk'].some(k=>Object.hasOwn(data,k)))throw Error('not a game save');
 for(const k of ['gold','gems','tickets','atk','hp','best','floor'])if(data[k]!==undefined&&(!Number.isFinite(data[k])||data[k]<0))throw Error('invalid stat');
 if(data.saveSchemaVersion!==undefined&&(!Number.isInteger(data.saveSchemaVersion)||data.saveSchemaVersion<1))throw Error('invalid schema');
 return data;
}
function paint(){
 const info=document.getElementById('saveHealth'),notice=document.getElementById('storageNotice');
 const message=status.error||(status.recovered?'자동 백업에서 진행을 복구했습니다. 마지막 백업 이후의 진행은 일부 빠질 수 있습니다.':'');
 if(info)info.textContent=message||(status.saved?'자동 저장 정상 · 현재 기기와 브라우저에 저장됩니다.':'진행을 이 브라우저에 자동 저장합니다.');
 if(notice){notice.hidden=!message;notice.textContent=message;}
}
function load(){
 loaded=true;let main=null,backup=null;
 try{main=localStorage.getItem(KEY);known=main;backup=localStorage.getItem(BACKUP);}catch{status.error='브라우저 저장소에 접근할 수 없습니다. 진행 저장 관리에서 저장 파일을 내보내세요.';status.readOnly=true;paint();return null;}
 for(const [raw,recovery] of [[main,false],[backup,true]]){
  if(!raw)continue;
  try{const data=decode(raw);
   if((data.saveSchemaVersion||1)>SCHEMA){status.readOnly=true;status.error='더 최신 버전의 저장입니다. 원본을 보호하고 있습니다. 게임을 새로고침한 뒤 다시 이용하세요.';paint();return data;}
   status.recovered=recovery;paint();return data;
  }catch{}
 }
 if(main||backup){status.error='저장을 읽지 못해 원본을 보존하고 있습니다. 진행 저장 관리에서 백업 파일을 불러오세요.';status.readOnly=true;}
 paint();return null;
}
function save(data){
 if(!loaded)load();if(status.readOnly){paint();return false;}
 const now=Date.now();
 try{
  const current=localStorage.getItem(KEY);
  if(current!==known){status.readOnly=true;status.error='다른 탭에서 저장이 변경되었습니다. 이 탭의 저장을 멈췄습니다. 새로고침해 최신 진행을 불러오세요.';paint();return false;}
  const next=JSON.stringify({...data,saveSchemaVersion:SCHEMA});
  // A backup failure must not prevent writing the main save when space still permits it.
  try{if(current&&(!localStorage.getItem(BACKUP)||now-lastBackupAt>=60000)){const previous=decode(current);if((previous.saveSchemaVersion||1)<=SCHEMA){localStorage.setItem(BACKUP,current);lastBackupAt=now;}}}catch{}
  localStorage.setItem(KEY,next);known=next;status.saved=true;status.error='';paint();return true;
 }catch{status.error='자동 저장에 실패했습니다. 진행 저장 관리에서 저장 파일을 내보내세요.';paint();return false;}
}
function resumeAfterImport(){known=localStorage.getItem(KEY);loaded=true;status.readOnly=false;status.error='';status.recovered=false;paint();}
window.GameStorage={load,save,resumeAfterImport,getStatus:()=>({...status}),keys:{main:KEY,backup:BACKUP},schema:SCHEMA};
window.addEventListener('storage',event=>{if(event.key===KEY&&event.newValue!==known){status.readOnly=true;status.error='다른 탭에서 저장이 변경되었습니다. 새로고침해 최신 진행을 불러오세요.';paint();}});
})();
