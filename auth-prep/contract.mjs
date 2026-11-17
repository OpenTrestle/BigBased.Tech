/**
 * BigBased review-only auth planning: no provider IO, cookies, sessions,
 * credentials, account creation, remote sync, or authorization grants.
 * Aligned to OpenTrestle/opentrestle-platform PR #162.
 */
export const clients=Object.freeze({
  bigbased:{clientKey:"bigbased",redirect:"https://bigbased.com/auth/callback",providerHost:"auth.opentrestle.com",verifiedIssuer:null,active:false},
  mybased:{clientKey:"mybased",redirect:"https://mybased.ai/auth/callback",providerHost:"auth.opentrestle.com",verifiedIssuer:null,active:false}
});
const denied=reason=>Object.freeze({allowed:false,reason});
export function authOptions(){
 return Object.freeze({guest:true,authenticated:false,synchronized:false,
   email:{label:"BigBased email sign-in",enabled:false},
   external:{label:"Continue with OpenTrestle",enabled:false,optional:true}});
}
export function inspectVault(raw){
 if(typeof raw!=="string"||raw.length>2000000)return denied("BAD_VAULT");
 let v;try{v=JSON.parse(raw)}catch{return denied("BAD_JSON")}
 if(!v||!Array.isArray(v.projects)||v.projects.length>16)return denied("BAD_PROJECT_LIST");
 const seen=new Set(),projects=[];
 for(const p of v.projects){
   if(!p||typeof p.id!=="string"||!p.id||p.id.length>128||!p.project||typeof p.project.title!=="string"||seen.has(p.id))return denied("BAD_OR_DUPLICATE_PROJECT");
   seen.add(p.id);projects.push(Object.freeze({localId:p.id,title:p.project.title.slice(0,140)}));
 }
 return Object.freeze({allowed:true,projects:Object.freeze(projects)});
}
export function planImport({inventory,accountId,selectedIds,consent,remoteTitles=[]}={}){
 if(!inventory?.allowed)return denied("INVALID_INVENTORY");
 if(typeof accountId!=="string"||!/^bb_acc_[A-Za-z0-9_-]{6,80}$/.test(accountId))return denied("VERIFIED_ACCOUNT_REQUIRED");
 if(consent!==true)return denied("CONSENT_REQUIRED");
 if(!Array.isArray(selectedIds)||!selectedIds.length||new Set(selectedIds).size!==selectedIds.length)return denied("EXPLICIT_SELECTION_REQUIRED");
 if(selectedIds.some(id=>!inventory.projects.some(p=>p.localId===id)))return denied("UNKNOWN_PROJECT");
 if(!Array.isArray(remoteTitles)||remoteTitles.some(t=>typeof t!=="string"))return denied("REMOTE_SNAPSHOT_REQUIRED");
 if(inventory.projects.some(p=>selectedIds.includes(p.localId)&&remoteTitles.includes(p.title)))return denied("CONFLICT_REVIEW_REQUIRED");
 return Object.freeze({allowed:true,kind:"REVIEW_ONLY",selectedIds:Object.freeze([...selectedIds]),serverWrites:0,imported:false,localSourcePreserved:true});
}
export function planIdentityLink({accountId,identity,confirmation,stepUpVerified,existingLinks=[]}={}){
 if(typeof accountId!=="string"||!/^bb_acc_[A-Za-z0-9_-]{6,80}$/.test(accountId))return denied("BIGBASED_ACCOUNT_REQUIRED");
 if(identity?.verifiedByServer!==true||typeof identity.issuer!=="string"||!identity.issuer.startsWith("https://")||typeof identity.subject!=="string"||!identity.subject)return denied("VERIFIED_ISSUER_SUBJECT_REQUIRED");
 if(confirmation!==true||stepUpVerified!==true)return denied("CONSENT_AND_STEP_UP_REQUIRED");
 if(existingLinks.some(x=>x.issuer===identity.issuer&&x.subject===identity.subject&&x.accountId!==accountId))return denied("ALREADY_LINKED_TO_OTHER_ACCOUNT");
 return Object.freeze({allowed:true,kind:"REVIEW_ONLY",issuer:identity.issuer,subject:identity.subject,linked:false,serverWrites:0});
}
export function authorizeResource({actorAccountId,resourceAccountId,product,membershipGranted,capability}={}){
 if(!["bigbased","mybased"].includes(product))return denied("CROSS_COMPANY_DENIED");
 if(["code","console","needs-me","tool-execution","billing-admin"].includes(capability))return denied("PRIVILEGED_CAPABILITY_DENIED");
 if(!actorAccountId||actorAccountId!==resourceAccountId||membershipGranted!==true)return denied("MEMBERSHIP_REQUIRED");
 return Object.freeze({allowed:true,executionAuthorized:false,scope:"BIGBASED_ONLY"});
}
export function offlineUxState(state="guest",action=""){
 if(action==="KEEP_EXPLORING"||action==="CANCEL")return "guest";
 if(action==="OPEN_SIGN_IN")return "reviewing-options";
 if(action==="PREVIEW_TRANSFER"&&state==="reviewing-options")return "reviewing-transfer";
 return "guest"; // no forged authentication path
}
