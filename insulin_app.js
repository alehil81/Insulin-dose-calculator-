const $=id=>document.getElementById(id);
const SETTINGS_KEY="insulin-dose-calculator-settings-v9";

const defaults={
  mode:"meal-correction",
  defaultTarget:120,
  defaultIcr:"",
  defaultIsf:"",
  lowThreshold:70,
  activeInsulinTime:4,
  activityReductionPct:20,
  steroidIncreasePct:20,
  basalIncrement:2,
  activityOn:false,
  steroidOn:false
};

let settings=loadSettings();
let recentBolusType="meal-correction";

function loadSettings(){
  try{
    const raw=localStorage.getItem(SETTINGS_KEY);
    return raw?{...defaults,...JSON.parse(raw)}:{...defaults};
  }catch(e){return {...defaults}}
}
function parseNum(v){
  const s=String(v??"").replace(/,/g,"").trim();
  if(s==="")return null;
  const n=Number(s);
  return Number.isFinite(n)?n:null;
}
function fmt(n,d=1){
  if(!Number.isFinite(n))return "—";
  return n.toFixed(d).replace(/\.0$/,"");
}
function roundWhole(n){return Math.max(0,Math.round(n))}
function clampPct(v){return Math.max(0,Math.min(100,Number.isFinite(v)?v:0))}
function median3(a,b,c){return [a,b,c].sort((x,y)=>x-y)[1]}

function saveSettings(){
  settings.defaultTarget=parseNum($("defaultTarget").value)??120;
  settings.defaultIcr=parseNum($("defaultIcr").value)??"";
  settings.defaultIsf=parseNum($("defaultIsf").value)??"";
  settings.lowThreshold=parseNum($("lowThreshold").value)??70;
  settings.activeInsulinTime=Math.max(.5,parseNum($("defaultActiveInsulinTime").value)??4);
  settings.activityReductionPct=clampPct(parseNum($("defaultActivityReductionPct").value)??20);
  settings.steroidIncreasePct=clampPct(parseNum($("defaultSteroidIncreasePct").value)??20);
  settings.basalIncrement=Math.max(.1,parseNum($("defaultBasalIncrement").value)??2);

  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  $("savedStatus").textContent="Settings saved locally";
  applySavedDefaults(false);
  setTimeout(()=>$("savedStatus").textContent="Settings stored locally",1200);
}

function resetSettings(){
  settings={...defaults};
  localStorage.removeItem(SETTINGS_KEY);
  renderSettings();
  clearCase();
}

function renderSettings(){
  document.querySelectorAll("#modeSeg button").forEach(b=>b.classList.toggle("active",b.dataset.mode===settings.mode));
  document.querySelectorAll("#activityToggle button").forEach(b=>b.classList.toggle("active",(b.dataset.value==="on")===settings.activityOn));
  document.querySelectorAll("#steroidToggle button").forEach(b=>b.classList.toggle("active",(b.dataset.value==="on")===settings.steroidOn));
  document.querySelectorAll("#recentBolusTypeSeg button").forEach(
    b=>b.classList.toggle("active",b.dataset.recentBolusType===recentBolusType)
  );

  $("defaultTarget").value=settings.defaultTarget;
  $("defaultIcr").value=settings.defaultIcr!==""?settings.defaultIcr:"";
  $("defaultIsf").value=settings.defaultIsf!==""?settings.defaultIsf:"";
  $("lowThreshold").value=settings.lowThreshold;
  $("defaultActiveInsulinTime").value=settings.activeInsulinTime;
  $("defaultActivityReductionPct").value=settings.activityReductionPct;
  $("defaultSteroidIncreasePct").value=settings.steroidIncreasePct;
  $("defaultBasalIncrement").value=settings.basalIncrement;

  $("carbField").classList.toggle("hidden",settings.mode==="correction");
  $("currentBgField").classList.toggle("hidden",settings.mode==="meal");
  $("targetBgField").classList.toggle("hidden",settings.mode==="meal");
  calculate();
  calculateBasal();
}

function applySavedDefaults(force=false){
  if(force||!$("targetGlucose").value)$("targetGlucose").value=settings.defaultTarget;
  if((force||!$("icr").value)&&settings.defaultIcr!=="")$("icr").value=settings.defaultIcr;
  if((force||!$("isf").value)&&settings.defaultIsf!=="")$("isf").value=settings.defaultIsf;
  if(force||!$("activeInsulinTime").value)$("activeInsulinTime").value=settings.activeInsulinTime;
  if(force||!$("activityReductionPct").value)$("activityReductionPct").value=settings.activityReductionPct;
  if(force||!$("steroidIncreasePct").value)$("steroidIncreasePct").value=settings.steroidIncreasePct;
  if(force||!$("basalIncrement").value)$("basalIncrement").value=settings.basalIncrement;
  calculate();
  calculateBasal();
}

function clearCase(){
  ["carbs","currentGlucose","icr","isf","recentDose","hoursSinceDose","tdd",
   "fasting1","fasting2","fasting3","basalCurrentDose"].forEach(id=>$(id).value="");

  $("targetGlucose").value=settings.defaultTarget;
  $("activeInsulinTime").value=settings.activeInsulinTime;
  $("activityReductionPct").value=settings.activityReductionPct;
  $("steroidIncreasePct").value=settings.steroidIncreasePct;
  $("basalIncrement").value=settings.basalIncrement;
  settings.activityOn=false;
  settings.steroidOn=false;
  recentBolusType="meal-correction";
  renderSettings();
  calculateTdd();
}

function calculateTdd(){
  const tdd=parseNum($("tdd").value);
  if(tdd===null||tdd<=0){
    $("estIcr").textContent="—";
    $("estIsf").textContent="—";
    return;
  }
  $("estIcr").textContent=fmt(500/tdd,1);
  $("estIsf").textContent=fmt(1800/tdd,1);
}

function exponentialEffectRemaining(hoursSinceDose,durationHours){
  // Configurable exponential insulin model based on LoopKit's published equation.
  // For standard rapid-acting analogs we use ~75 min peak and 10 min delay.
  // The user's active-insulin time controls action duration.
  const durationMinutes=durationHours*60;
  const peakMinutes=75;
  const delayMinutes=10;
  const timeMinutes=hoursSinceDose*60;
  const t=timeMinutes-delayMinutes;

  if(t<=0)return 1;
  if(t>=durationMinutes)return 0;

  // The model requires duration > 2*peak. Treat shorter entries as invalid.
  if(durationMinutes<=2*peakMinutes)return NaN;

  const tau=peakMinutes*(1-peakMinutes/durationMinutes)/(1-2*peakMinutes/durationMinutes);
  const a=2*tau/durationMinutes;
  const S=1/(1-a+(1+a)*Math.exp(-durationMinutes/tau));

  const remaining=1-S*(1-a)*
    ((((t*t)/(tau*durationMinutes*(1-a)))-(t/tau)-1)*Math.exp(-t/tau)+1);

  return Math.max(0,Math.min(1,remaining));
}

function estimatedIob(){
  const dose=parseNum($("recentDose").value);
  const hours=parseNum($("hoursSinceDose").value);
  const duration=parseNum($("activeInsulinTime").value)??settings.activeInsulinTime;

  if(dose===null||dose<=0||hours===null||hours<0)return 0;
  if(duration===null||duration<=2.5)return NaN;

  const remaining=exponentialEffectRemaining(hours,duration);
  if(!Number.isFinite(remaining))return NaN;
  return Math.max(0,dose*remaining);
}

function iobUsed(){
  const value=estimatedIob();
  return Number.isFinite(value)?value:0;
}

function calculate(){
  const mode=settings.mode;
  const mealNeeded=mode!=="correction";
  const correctionNeeded=mode!=="meal";

  const carbs=parseNum($("carbs").value);
  const icr=parseNum($("icr").value);
  const current=parseNum($("currentGlucose").value);
  const target=parseNum($("targetGlucose").value);
  const isf=parseNum($("isf").value);

  const mealValid=!mealNeeded||(carbs!==null&&carbs>=0&&icr!==null&&icr>0);
  const correctionValid=!correctionNeeded||(current!==null&&target!==null&&isf!==null&&isf>0);

  const estimated=estimatedIob();
  const usedIob=Number.isFinite(estimated)?estimated:0;
  $("estimatedIobOut").textContent=Number.isFinite(estimated)?fmt(estimated,2):"Check AIT";

  if(!mealValid||!correctionValid){
    $("finalDose").textContent="—";
    $("doseSub").textContent="Enter the required inputs";
    ["mealDoseOut","rawCorrectionOut","iobOut","netCorrectionOut","baseBolusOut",
     "activityAdjustmentOut","steroidAdjustmentOut","rawTotalOut"].forEach(id=>$(id).textContent="—");
    updateWarnings(current);
    return;
  }

  const mealDose=mealNeeded?carbs/icr:0;
  let rawCorrection=0;
  let iobDeducted=0;
  let netCorrection=0;

  if(correctionNeeded){
    rawCorrection=(current-target)/isf;
    if(rawCorrection>0){
      iobDeducted=Math.min(usedIob,rawCorrection);
      netCorrection=rawCorrection-iobDeducted;
    }else{
      netCorrection=rawCorrection;
    }
  }

  const baseBolus=Math.max(0,mealDose+netCorrection);

  const activityPct=clampPct(parseNum($("activityReductionPct").value)??settings.activityReductionPct);
  const steroidPct=clampPct(parseNum($("steroidIncreasePct").value)??settings.steroidIncreasePct);

  const afterActivity=settings.activityOn?baseBolus*(1-activityPct/100):baseBolus;
  const activityAdjustment=afterActivity-baseBolus;

  const afterSteroid=settings.steroidOn?afterActivity*(1+steroidPct/100):afterActivity;
  const steroidAdjustment=afterSteroid-afterActivity;

  const finalPreRound=Math.max(0,afterSteroid);
  const rounded=roundWhole(finalPreRound);

  $("finalDose").textContent=rounded+" U";
  $("doseSub").textContent="Rounded to nearest 1 U";
  $("mealDoseOut").textContent=fmt(mealDose,2)+" U";
  $("rawCorrectionOut").textContent=correctionNeeded?fmt(rawCorrection,2)+" U":"—";
  $("iobOut").textContent=correctionNeeded?fmt(iobDeducted,2)+" U":"—";
  $("netCorrectionOut").textContent=correctionNeeded?fmt(netCorrection,2)+" U":"—";
  $("baseBolusOut").textContent=fmt(baseBolus,2)+" U";
  $("activityAdjustmentOut").textContent=(settings.activityOn?fmt(activityAdjustment,2)+" U":"Off");
  $("steroidAdjustmentOut").textContent=(settings.steroidOn?"+"+fmt(steroidAdjustment,2)+" U":"Off");
  $("rawTotalOut").textContent=fmt(finalPreRound,2)+" U";

  updateWarnings(current);
}

function updateWarnings(current){
  const box=$("warningBox");
  box.className="warningBox hidden";
  box.textContent="";
  const messages=[];

  if(current!==null&&settings.mode!=="meal"){
    const low=parseNum($("lowThreshold").value)??70;
    if(current<low){
      messages.push({level:"low",text:"Low-glucose flag: address hypoglycemia according to the patient's established clinical plan before relying on a bolus calculation."});
    }else if(current>=250){
      messages.push({level:"high",text:"High-glucose flag: this calculator provides bolus arithmetic only and does not assess ketones, illness, dehydration, injection/site problems, or other sick-day factors."});
    }
  }

  const recentDose=parseNum($("recentDose").value);
  const hours=parseNum($("hoursSinceDose").value);
  const duration=parseNum($("activeInsulinTime").value)??4;

  if(duration<=2.5){
    messages.push({level:"high",text:"Active insulin time is too short for the selected exponential rapid-acting model. Use an active insulin time above 2.5 hours."});
  }

  const active=estimatedIob();
  if(recentDose!==null&&recentDose>0&&hours!==null&&hours>=0&&Number.isFinite(active)&&active>0.01){
    const purposeText={
      meal:"meal bolus",
      correction:"correction-only bolus",
      "meal-correction":"meal + correction bolus"
    }[recentBolusType]||"recent bolus";

    let context="";
    if(recentBolusType==="correction"){
      context=" This is correction insulin still expected to lower glucose.";
    }else if(recentBolusType==="meal"){
      context=" Some of this insulin may still be paired with absorption from the prior meal.";
    }else{
      context=" Some of this insulin may still be paired with prior meal absorption, while some may have been given for correction.";
    }

    messages.push({
      level:"high",
      text:`Estimated active insulin from the recent ${purposeText}: ${fmt(active,2)} U.${context} Active insulin is used to avoid stacking the positive correction component; it is not automatically subtracted from carbohydrate coverage.`
    });
  }

  if(messages.length){
    box.className="warningBox "+(messages.some(m=>m.level==="low")?"low":"high");
    box.textContent=messages.map(m=>m.text).join(" ");
  }
}

function calculateBasal(){
  const a=parseNum($("fasting1").value);
  const b=parseNum($("fasting2").value);
  const c=parseNum($("fasting3").value);
  const currentDose=parseNum($("basalCurrentDose").value);
  const increment=Math.max(.1,parseNum($("basalIncrement").value)??settings.basalIncrement);

  const out=$("basalRecommendedOut");
  const medOut=$("basalMedianOut");
  const explain=$("basalExplanation");
  const warning=$("basalWarning");
  warning.className="warningBox hidden";
  warning.textContent="";

  if([a,b,c,currentDose].some(v=>v===null)||currentDose<0){
    medOut.textContent="—";
    out.textContent="—";
    explain.textContent="Enter all three fasting values and the current basal dose.";
    return;
  }

  const med=median3(a,b,c);
  const anyBelow80=[a,b,c].some(v=>v<80);
  const anyBelow70=[a,b,c].some(v=>v<70);

  let recommended=currentDose;
  let action="No change";

  if(anyBelow80||med<100){
    recommended=Math.max(0,currentDose-increment);
    action=`Decrease by ${fmt(increment,1)} U`;
  }else if(med>120){
    recommended=currentDose+increment;
    action=`Increase by ${fmt(increment,1)} U`;
  }

  medOut.textContent=fmt(med,0)+" mg/dL";
  out.textContent=fmt(recommended,1)+" U/day";
  explain.textContent=`${action}. Rule used: target median fasting BG 100–120 mg/dL; any fasting BG <80 mg/dL triggers a decrease.`;

  if(anyBelow70){
    warning.className="warningBox low";
    warning.textContent="At least one fasting glucose is <70 mg/dL. Hypoglycemia takes priority over routine titration; review the regimen and clinical context.";
  }
}

document.querySelectorAll("#modeSeg button").forEach(b=>b.addEventListener("click",()=>{
  settings.mode=b.dataset.mode;
  renderSettings();
}));

document.querySelectorAll("#recentBolusTypeSeg button").forEach(b=>b.addEventListener("click",()=>{
  recentBolusType=b.dataset.recentBolusType;
  renderSettings();
}));

document.querySelectorAll("#activityToggle button").forEach(b=>b.addEventListener("click",()=>{
  settings.activityOn=b.dataset.value==="on";
  renderSettings();
}));

document.querySelectorAll("#steroidToggle button").forEach(b=>b.addEventListener("click",()=>{
  settings.steroidOn=b.dataset.value==="on";
  renderSettings();
}));

["carbs","icr","currentGlucose","targetGlucose","isf","activeInsulinTime","recentDose",
 "hoursSinceDose","activityReductionPct","steroidIncreasePct"].forEach(id=>$(id).addEventListener("input",calculate));

["fasting1","fasting2","fasting3","basalCurrentDose","basalIncrement"].forEach(id=>$(id).addEventListener("input",calculateBasal));

$("tdd").addEventListener("input",calculateTdd);
$("lowThreshold").addEventListener("input",calculate);

$("useIcrEstimate").addEventListener("click",()=>{
  const tdd=parseNum($("tdd").value);
  if(tdd&&tdd>0){$("icr").value=(500/tdd).toFixed(1);calculate()}
});
$("useIsfEstimate").addEventListener("click",()=>{
  const tdd=parseNum($("tdd").value);
  if(tdd&&tdd>0){$("isf").value=(1800/tdd).toFixed(1);calculate()}
});

$("saveSettings").addEventListener("click",saveSettings);
$("resetSettings").addEventListener("click",()=>{
  if(confirm("Reset all saved calculator settings?"))resetSettings()
});
$("clearCase").addEventListener("click",clearCase);

renderSettings();
applySavedDefaults(false);
calculateTdd();
