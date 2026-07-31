const ORDER_SEED = [
  ["FS-10422","PulseTech","Toronto, ON","Prime","Jul 31 · 20:00","Routine urgent order","ready"],
  ["FS-10423","Hearth & Hue","Ottawa, ON","Standard","Aug 3 · 20:00","Routine delivery","ready"],
  ["FS-10424","Northstar","Calgary, AB","Economy","Aug 6 · 20:00","Several warehouses can fulfill it","ready"],
  ["FS-10425","Northstar","Montréal, QC","Standard","Aug 3 · 20:00","Nearest warehouse missed pickup","attention"],
  ["FS-10426","PulseTech","Edmonton, AB","Standard","Aug 4 · 20:00","Not enough stock in the network","danger"],
  ["FS-10427","Hearth & Hue","Halifax, NS","Prime","Aug 2 · 20:00","May need two separate shipments","attention"],
  ["FS-10428","PulseTech","Vancouver, BC","Prime","Aug 1 · 20:00","Required stock is in another country","attention"],
  ["FS-10429","Northstar","Iqaluit, NU","Merchant Priority","Aug 2 · 20:00","Faster shipping exceeds the cost limit","attention"],
  ["FS-10430","PulseTech","Seattle, WA","Standard","Aug 4 · 20:00","Battery requires special shipping","attention"],
  ["FS-10431","Hearth & Hue","Columbus, OH","Replacement","Aug 1 · 20:00","Carrier problem will require recovery","ready"]
];
const AGENTS = [
  ["OR","Fulfillment Orchestrator","ORCHESTRATION · v1.0.0","Selects goals, evaluates results, replans after changed conditions, and routes human authority.","Deterministic reference","Nominal"],
  ["FG","Fulfillment Planning","GOAL · v1.0.0","Coordinates validation, plan generation, evidence, recommendation, and release authority.","Bounded workflow","Nominal"],
  ["SG","Shortage Resolution","GOAL · v1.0.0","Explores alternate FCs, permitted splits, scarcity, and advisory transfers.","Bounded workflow","Nominal"],
  ["RG","Delivery Recovery","GOAL · v1.0.0","Responds to disruption, reassesses the promise, and proposes supported recovery.","Bounded workflow","Nominal"],
  ["IV","Inventory Availability","TASK · v1.0.0","Returns versioned ATP facts after reservations, damage, quarantine, and safety stock.","Deterministic","99.9%"],
  ["CT","Capacity & Cutoff","TASK · v1.0.0","Validates facility workload, operating hours, and next carrier pickup.","Deterministic","99.8%"],
  ["PK","Packaging Selection","TASK · v1.0.0","Enumerates packaging supported by the FC and product handling requirements.","Deterministic","100%"],
  ["CR","Carrier Availability","TASK · v1.0.0","Checks route, parcel, service, and product restrictions.","Deterministic","99.9%"],
  ["DE","Delivery Estimation","TASK · v1.0.0","Returns a reproducible delivery distribution and calibrated confidence.","Predictive simulation","94.7%"]
];
const GUARDRAILS = [
  ["Inventory integrity","No negative stock, double allocation, or ownership mismatch.","FAIL CLOSED"],
  ["Accepted promise","The customer promise cannot be silently extended.","HARD CONSTRAINT"],
  ["Safety & restrictions","Packaging, product, carrier, and route compatibility.","NO OVERRIDE"],
  ["Cross-border eligibility","Complete customs and route facts required before release.","HOLD IF UNKNOWN"],
  ["Human authority","Cost, split, air, and automatic-release permissions revalidated.","EXECUTION TIME"],
  ["Append-only audit","Mutation and audit event must commit in one transaction.","ATOMIC"]
];
const PROFILES = [
  ["Prime","≥95% confidence · Air allowed · Auto ≤ $35"],
  ["Standard","≥90% confidence · Prefer ground · Auto ≤ $25"],
  ["Economy","≥85% confidence · No air or split by default"],
  ["Replacement","≥95% confidence · Service recovery priority"],
  ["Merchant Priority","Merchant threshold · Configured preference order"]
];
const state = {
  orders: ORDER_SEED.map((o,i)=>({id:o[0],merchant:o[1],destination:o[2],profile:o[3],promise:o[4],signal:o[5],signalState:o[6],selected:false,status:"Awaiting orchestration",allocation:"—",carrier:"—",decision:"Pending",index:i})),
  runs: [],
  approvals: [],
  audit: [
    {time:"14:32:08.441",title:"Simulation baseline verified",body:"Seed overseer-demo-v1 restored with all business invariants passing.",code:"simulation.baseline_verified"},
    {time:"14:31:52.109",title:"Carrier disruption received",body:"UPS Standard event linked to FS-10421 and routed for recovery assessment.",code:"tracking.disruption_received"},
    {time:"14:30:14.822",title:"Policy version evaluated",body:"Goal profiles v1.0 and guardrails v1.0 active for new runs.",code:"policy.evaluated"},
    {time:"14:28:31.207",title:"Order FS-10420 released",body:"Single-FC Toronto plan met promise at 96% confidence within authority.",code:"order.released"}
  ],
  runConfig:{goal:"balanced",confidence:90,costLimit:35,allowSplit:true,allowAir:true,allowRecovery:true},
  activeRunId:null,
  runTimer:null,
  agentFilter:"orchestration"
};
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const escapeHtml = value => String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function applyTheme(theme){
  document.documentElement.dataset.theme=theme;
  $("#theme-toggle").querySelector("b").textContent=theme==="dark"?"Light":"Dark";
  $("#theme-toggle").setAttribute("aria-label",`Switch to ${theme==="dark"?"light":"dark"} mode`);
  localStorage.setItem("overseer-theme",theme);
}
const friendlyStatus = status => ({
  "Awaiting orchestration":"Not planned yet",
  "Released":"Ready to fulfill",
  "Awaiting approval":"Needs a decision",
  "Held":"Paused — action needed",
  "Recommended":"Recommendation ready",
  "Running":"Agents working"
}[status]||status);
const goalName = value => ({balanced:"Balanced",service:"Delivery first",cost:"Cost first"}[value]||value);
let wizardStep=1;
function showWizardStep(step){
  wizardStep=Math.max(1,Math.min(4,step));
  $$(".wizard-page").forEach(page=>page.classList.toggle("active",Number(page.dataset.wizardPage)===wizardStep));
  $$("[data-wizard-go]").forEach(button=>{
    const n=Number(button.dataset.wizardGo);
    button.classList.toggle("active",n===wizardStep);
    button.classList.toggle("complete",n<wizardStep);
  });
  $("#wizard-back").classList.toggle("hidden",wizardStep===1);
  $("#wizard-next").classList.toggle("hidden",wizardStep===4);
  $("#confirm-run").classList.toggle("hidden",wizardStep!==4);
  const nextLabels={1:"Review agent team",2:"Set limits",3:"Final review"};
  if(wizardStep<4)$("#wizard-next").innerHTML=`${nextLabels[wizardStep]} <span>→</span>`;
  if(wizardStep===4)renderConfirmation();
}
function renderConfirmation(){
  const preset=$('input[name="goalPreset"]:checked').value;
  const mode=$('input[name="mode"]:checked').value;
  const missing=$$(".agent-enabled").filter(input=>!input.checked);
  $("#confirmation-card").innerHTML=`
    <div><span>Orders included</span><strong>${state.orders.filter(o=>o.selected).length}</strong></div>
    <div><span>Business outcome</span><strong>${goalName(preset)}</strong><small>${preset==="balanced"?"Balance reliable delivery and cost":preset==="service"?"Prefer the strongest on-time plan":"Prefer the lowest-cost safe plan"}</small></div>
    <div><span>Agent team</span><strong>${missing.length?"Incomplete":"Coordinator + planning lead + 8 specialists"}</strong><small>${missing.length?"Return to Agent team and include the required roles":"All required evidence checks included"}</small></div>
    <div><span>Agents must ask you when</span><strong>Confidence is below ${$("#confidence-limit").value}% or cost is above $${$("#cost-limit").value}</strong></div>
    <div><span>Special permissions</span><strong>${[$("#allow-split").checked?"Multiple shipments":null,$("#allow-air").checked?"Air service":null,$("#allow-recovery").checked?"Automatic recovery":null].filter(Boolean).join(" · ")||"None"}</strong></div>
    <div><span>After planning</span><strong>${mode==="execute"?"Continue safe orders automatically":"Show recommendations only"}</strong></div>`;
  $("#confirm-run").disabled=missing.length>0;
  $("#confirm-run").title=missing.length?"The coordinator and planning lead are required to run this workflow":"";
}

function navigate(view){
  $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.viewPanel===view));
  $$(".nav-item").forEach(v=>v.classList.toggle("active",v.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderResults(processed){
  if(!processed.length)return;
  const released=processed.filter(o=>o.status==="Released"||o.status==="Recommended").length;
  const protectedPromises=processed.filter(o=>o.status!=="Held").length;
  const savings=processed.reduce((sum,o)=>sum+[8.4,6.2,15.8,11.7,0,4.9,12.1,18.6,0,7.4][o.index],0);
  $("#result-savings").textContent=`$${savings.toFixed(2)}`;
  $("#result-released").textContent=`${released} / ${processed.length}`;
  $("#result-promises").textContent=protectedPromises;
  $("#report-sentence").textContent=`${processed.length} orders evaluated. ${released} required no human work; ${processed.length-released} need review or corrective action.`;
  $("#savings-track").style.width=`${Math.min(100,savings/50*100)}%`;
  $("#auto-track").style.width=`${Math.min(100,released/processed.length/0.7*100)}%`;
  $("#promise-track").style.width=`${Math.min(100,protectedPromises/processed.length*100)}%`;
  const issues=[];
  if(processed.some(o=>o.index===4))issues.push(["Inventory shortage","Network stock is unavailable after protected safety stock.","orders"]);
  if(processed.some(o=>[5,7].includes(o.index)))issues.push(["Cost authority exceeded","An air upgrade or split needs human approval.","approvals"]);
  if(processed.some(o=>o.index===8))issues.push(["Carrier restriction","Lithium handling removes the available air option.","orders"]);
  if(processed.some(o=>o.index===3))issues.push(["Missed facility cutoff","Earlier planning may avoid cross-border recovery cost.","runs"]);
  const visibleIssues=issues.length?issues:[["No material exceptions","All selected orders stayed within automatic authority.","runs"]];
  $("#top-issues").innerHTML=visibleIssues.slice(0,3).map((x,i)=>`<div class="issue-row"><span class="issue-rank">${i+1}</span><div><strong>${x[0]}</strong><small>${x[1]}</small></div><button data-issue-go="${x[2]}">Review →</button></div>`).join("");
  $$("[data-issue-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.issueGo)));
  $("#decision-board-rows").innerHTML=processed.map(o=>{
    const run=state.runs.find(r=>r.id===o.id);
    const needsHelp=["Awaiting approval","Held","Recommended"].includes(o.status);
    const stoppedBy=o.status==="Awaiting approval"?"Authority gate":o.status==="Held"&&o.index===4?"Inventory task agent → Goal agent":o.status==="Held"&&o.index===8?"Carrier task agent → Goal agent":o.status==="Recommended"?"Recommend-only control":"No stop — all checks passed";
    const action=o.status==="Awaiting approval"?"Approve, compare, or pause":o.status==="Held"&&o.index===4?"Review transfer or wait for stock":o.status==="Held"?"Review safe options or correct data":o.status==="Recommended"?"Review and approve":"Warehouse can begin fulfillment";
    return `<button class="decision-board-row ${needsHelp?"needs-help":"cleared"}" data-open-run="${o.id}"><span class="decision-symbol">${needsHelp?"!":"✓"}</span><div><b>${o.id} · ${escapeHtml(o.merchant)}</b><small>${escapeHtml(friendlyStatus(o.status))}</small></div><div><span>STOPPED BY</span><b>${stoppedBy}</b></div><div><span>SUGGESTED ACTION</span><b>${action}</b></div><em>View flow →</em></button>`;
  }).join("");
  $$("[data-open-run]").forEach(button=>button.addEventListener("click",()=>{state.activeRunId=button.dataset.openRun;navigate("runs");renderRuns();}));
  $("#results-report").classList.remove("hidden");
  $("#start-here").classList.add("hidden");
  $(".architecture-showcase").classList.add("hidden");
}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function renderIntake(){
  $("#orders-body").innerHTML=state.orders.map(o=>`<tr class="${o.selected?"selected":""}">
    <td><input class="order-check" type="checkbox" data-id="${o.id}" ${o.selected?"checked":""} aria-label="Select ${o.id}"></td>
    <td><strong>${o.id}</strong></td><td>${escapeHtml(o.merchant)}</td><td>${escapeHtml(o.destination)}</td>
    <td><span class="profile-pill">${escapeHtml(o.profile)}</span></td><td>${escapeHtml(o.promise)}</td>
    <td><span class="row-signal"><i></i>${escapeHtml(o.signal)}</span></td><td><span class="state-pill ${o.signalState}" title="System status: ${escapeHtml(o.status)}">${escapeHtml(friendlyStatus(o.status))}</span></td></tr>`).join("");
  const n=state.orders.filter(o=>o.selected).length;
  $("#selection-label").textContent=`${n} selected`;
  $("#master-check").checked=n===state.orders.length;
  $("#master-check").indeterminate=n>0&&n<state.orders.length;
  $$(".order-check").forEach(c=>c.addEventListener("change",()=>{state.orders.find(o=>o.id===c.dataset.id).selected=c.checked;renderIntake();}));
}
function renderOrders(){
  const q=($("#order-search")?.value||"").toLowerCase();
  const list=state.orders.filter(o=>`${o.id} ${o.merchant}`.toLowerCase().includes(q));
  $("#all-orders-body").innerHTML=list.map(o=>`<tr><td><strong>${o.id}</strong><br><small>${escapeHtml(o.destination)}</small></td><td>${escapeHtml(o.merchant)}</td><td><span class="profile-pill">${escapeHtml(o.profile)}</span></td><td>${escapeHtml(o.allocation)}</td><td>${escapeHtml(o.carrier)}</td><td>${escapeHtml(o.decision)}</td><td><span class="state-pill ${o.status.includes("Approval")||o.status==="Held"?"attention":"ready"}" title="System status: ${escapeHtml(o.status)}">${escapeHtml(friendlyStatus(o.status))}</span></td></tr>`).join("");
}
function renderAgents(){
  const filter=state.agentFilter;
  const filtered=AGENTS.filter(a=>a[2].toLowerCase().startsWith(filter));
  const explainers={
    orchestration:["Coordinator layer","Chooses the right workflow, responds when facts change, and decides when a person must be involved.","Inputs: order event, current state, policy version, prior results","Cannot: calculate inventory, change rules, or approve its own exception"],
    goal:["Workflow-lead layer","Ensures the correct sequence of specialist checks is completed for a specific business outcome.","Inputs: selected goal, success criteria, agent results, operating limits","Cannot: write inventory, create shipments, or skip a required check"],
    task:["Specialist layer","Returns one narrow fact or calculation with evidence. Most specialists are deterministic services, not language models.","Inputs: only the minimum fields needed for its check","Cannot: choose the final plan or mutate any operational state"]
  };
  const e=explainers[filter];
  $("#agent-layer-explainer").innerHTML=`<div><p class="eyebrow">${e[0]}</p><h2>${e[1]}</h2></div><div><span>${e[2]}</span><span>${e[3]}</span></div>`;
  $("#agent-grid").innerHTML=filtered.map(a=>{
    const parameters=a[2].startsWith("ORCHESTRATION")?"Max 12 transitions · 3 replans · fail closed":a[2].startsWith("GOAL")?"Required-check ledger · 30s timeout · version pinned":"3s timeout · schema validated · read-only";
    return `<article class="agent-card"><header><i>${a[0]}</i><div><h2>${a[1]}</h2><small>${a[2]}</small></div></header><p>${a[3]}</p><dl class="agent-parameters"><div><dt>Execution</dt><dd>${a[4]}</dd></div><div><dt>Internal parameters</dt><dd>${parameters}</dd></div><div><dt>Authority</dt><dd>${a[2].startsWith("TASK")?"Return evidence only":"Propose; mutations require control service"}</dd></div></dl><div class="agent-meta"><span>Version pinned for every run</span><b>● ${a[5]}</b></div></article>`}).join("");
}
function renderGoals(){
  const goals=[
    ["Fulfillment planning","Generate a defensible, promise-feasible plan and determine execution authority.",["Validate order and payment","Enumerate ATP / CTP candidates","Apply package and carrier rules","Compare cost and preferences","Release or request approval"],"8 required task capabilities"],
    ["Shortage resolution","Resolve an infeasible allocation without weakening inventory or promise constraints.",["Confirm network shortage","Evaluate alternate FCs","Analyze permitted split","Protect scarce stock","Hold, advise transfer, or replan"],"5 required task capabilities"],
    ["Delivery recovery","React to a post-release disruption with a supported, authority-safe recovery path.",["Read tracking state","Reassess promise risk","Evaluate supported alternatives","Calculate recovery cost","Execute or escalate"],"5 required task capabilities"]
  ];
  $("#goal-columns").innerHTML=goals.map((g,i)=>`<article class="goal-card"><p class="eyebrow">GOAL-0${i+1} · ACTIVE</p><h2>${g[0]}</h2><p>${g[1]}</p><ol>${g[2].map(x=>`<li>${x}</li>`).join("")}</ol><footer>${g[3]} · v1.0.0</footer></article>`).join("");
}
function renderPolicy(){
  $("#guardrail-list").innerHTML=GUARDRAILS.map(g=>`<div class="guardrail-row"><i>✓</i><div><strong>${g[0]}</strong><p>${g[1]}</p></div><span>${g[2]}</span></div>`).join("");
  $("#profile-list").innerHTML=PROFILES.map(p=>`<div class="profile-row"><div><strong>${p[0]}</strong><p>${p[1]}</p></div><span>v1.0</span></div>`).join("");
}
function renderApprovals(){
  const el=$("#approval-list");
  if(!state.approvals.length){el.innerHTML=`<div class="approval-empty">No open approval requests. Exceptions generated by agent runs will appear here.</div>`;return;}
  el.innerHTML=state.approvals.map(a=>`<article class="approval-card" data-approval="${a.id}"><div><p class="eyebrow">YOUR DECISION · COST LIMIT EXCEEDED</p><h2>${a.id} · ${escapeHtml(a.merchant)}</h2><p>Ground service misses the promised date. Air is the only option above your required delivery confidence.</p><div class="approval-facts"><div><span>Recommended plan</span><b>${a.plan}</b></div><div><span>Expected cost</span><b>${a.cost}</b></div><div><span>Delivery confidence</span><b>${a.confidence}</b></div></div></div><div class="approval-actions"><button class="reject" data-decision="reject">Pause order</button><button class="approve" data-decision="approve">Approve & continue</button></div></article>`).join("");
  $$("[data-decision]").forEach(btn=>btn.addEventListener("click",()=>decideApproval(btn.closest("[data-approval]").dataset.approval,btn.dataset.decision)));
}
async function decideApproval(id,decision){
  const approval=state.approvals.find(a=>a.id===id), order=state.orders.find(o=>o.id===id);
  if(enterprise?.connected&&approval?.approvalId){
    const note=prompt(`Explain why you ${decision==="approve"?"approve":"reject"} this recommendation:`);
    if(!note)return;
    try{
      await apiPost(`/api/approvals/${encodeURIComponent(approval.approvalId)}/decision`,{decision,note});
      toast(`${id} ${decision==="approve"?"approved":"rejected"} with an audited decision`);
      await refreshEnterprise();
    }catch(error){toast(error.message||"The governed service rejected this decision");}
    return;
  }
  if(decision==="approve"){order.status="Released";order.decision="Human approved";order.allocation="YVR1";order.carrier="FedEx Priority";audit("Human approval committed",`${id} recommendation v1 revalidated and allowed to continue by Alex Ortega.`,"approval.approved");toast(`${id} approved and ready to fulfill`);}
  else {order.status="Held";order.decision="Paused by overseer";audit("Order paused",`${id} retained without operational mutation.`,"approval.held");toast(`${id} paused for follow-up`);}
  state.approvals=state.approvals.filter(a=>a.id!==id);updateCounts();renderApprovals();renderOrders();
}
function audit(title,body,code){
  const now=new Date();state.audit.unshift({time:now.toLocaleTimeString("en-CA",{hour12:false})+".000",title,body,code});renderAudit();
}
function renderAudit(){
  $("#audit-timeline").innerHTML=state.audit.map(e=>`<article class="event"><span class="event-time">${e.time} EDT</span><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.body)} <code>${e.code}</code></p></article>`).join("");
}
function updateCounts(){
  $("#run-count").textContent=state.runs.length;
  $("#approval-count").textContent=state.approvals.length;
}
function renderRuns(){
  $("#runs-empty").classList.toggle("hidden",state.runs.length>0);
  $("#runs-layout").classList.toggle("hidden",!state.runs.length);
  if(!state.runs.length)return;
  if(!state.activeRunId||!state.runs.some(r=>r.id===state.activeRunId))state.activeRunId=state.runs[0].id;
  $("#run-list").innerHTML=state.runs.map(r=>`<button class="run-list-item ${r.id===state.activeRunId?"active":""}" data-run="${r.id}"><div><strong>${r.id}</strong><span class="state-pill ${r.status==="Awaiting approval"?"attention":r.status==="Running"?"working":"ready"}" title="System status: ${r.status}">${friendlyStatus(r.status)}</span></div><p>${escapeHtml(r.merchant)} · ${escapeHtml(r.profile)}</p><small>${r.status==="Running"?`Step ${r.phase} of 4 · ${["Preparing","Coordinator selecting workflow","Specialists checking facts","Comparing plans","Applying authority"][r.phase]}`:friendlyStatus(r.status)==="Ready to fulfill"?"Planning finished — fulfillment can begin":friendlyStatus(r.status)}</small></button>`).join("");
  $$(".run-list-item").forEach(b=>b.addEventListener("click",()=>{state.activeRunId=b.dataset.run;renderRuns();}));
  renderRunDetail(state.runs.find(r=>r.id===state.activeRunId));
}
function taskEvidence(r){
  const pending=r.phase<2;
  const stopped=r.finalStatus==="Held";
  return [
    ["Order and payment","Order lines + payment status","Valid order · payment authorized","Did not capture or change payment"],
    ["Address and delivery area","Customer destination","Serviceable zone · remote-area flag checked","Did not edit the customer address"],
    ["Inventory","SKU quantities at 3 warehouses",r.index===4?"Shortage: 0 available after safety stock":"Available quantity and record version returned","Did not reserve or move inventory"],
    ["Facility timing","Workload, hours, pickup cutoff",r.index===3?"Toronto pickup missed · Columbus remains feasible":"Facility has capacity before pickup","Did not change facility workload"],
    ["Package safety","Product dimensions + handling flags",r.index===8?"Battery restriction requires approved service":"Supported package selected","Did not waive a safety restriction"],
    ["Carrier options","Route, parcel, and product rules",stopped&&r.index===8?"No safe air option":"Eligible end-to-end services returned","Did not book transportation"],
    ["Delivery estimate","Eligible service + destination",r.confidence==="—"?"Not calculated — no feasible service":`${r.confidence} chance of on-time delivery`,"Did not change the promised date"],
    ["Cost and authority","Plan costs + your limits",r.cost==="—"?"Not calculated — plan stopped":`${r.cost} expected cost · limit $${state.runConfig.costLimit}`,"Did not approve an exception"]
  ].map((t,i)=>({name:t[0],input:t[1],output:t[2],prohibited:t[3],status:pending?"Waiting":r.phase===2&&i>3?"Working":"Finished"}));
}
function lifecycleFor(r){
  const nodes=["Received","Coordinator","Planning","Decision gate","Ready to fulfill","Picking","Packing","Shipped","Delivered"];
  let active=0;
  if(r.status==="Running")active=Math.min(3,Math.max(1,r.phase));
  else if(["Awaiting approval","Held","Recommended"].includes(r.status))active=3;
  else if(r.status==="Released")active=4;
  const owner=["System","Orchestration","Goal + task agents","Policy / human","Operations","Warehouse","Warehouse","Carrier","Carrier"];
  return `<div class="order-lifecycle-scroll"><div class="order-lifecycle">${nodes.map((node,i)=>`${i?'<i aria-hidden="true">→</i>':''}<div class="lifecycle-node ${i<active?"complete":i===active?"active":"future"}"><span>${i<active?"✓":i+1}</span><b>${node}</b><small>${owner[i]}</small></div>`).join("")}</div><div class="exception-branch"><span>↳ Exception path</span><b>Delivery problem</b><i>→</i><b>Coordinator replans</b><small>Only used when new evidence makes the original plan infeasible</small></div></div>`;
}
function interventionFor(r){
  if(r.status==="Running"){
    const working=["Preparing the run","Fulfillment Coordinator · orchestration agent","Specialist team · task agents","Policy and authority control"][r.phase]||"Agent team";
    return {tone:"info",title:"No help needed yet",owner:working,why:"The required evidence sequence is still running. No decision has been made.",actions:[["Keep watching","watch"]]};
  }
  if(r.status==="Awaiting approval"){
    return {tone:"warning",title:"Your approval is required",owner:"Policy and authority control stopped automatic execution",why:r.reason,actions:[["Review and approve","approval"],["Compare alternatives","alternatives"],["Pause this order","pause"]]};
  }
  if(r.status==="Held"&&r.index===4){
    return {tone:"danger",title:"Inventory problem needs an operations decision",owner:"Inventory specialist (task agent) found the problem; Planning Lead (goal agent) stopped the workflow",why:r.reason,actions:[["Review warehouse transfer","transfer"],["Wait for inventory","pause"],["Mark unable to fulfill","unfulfillable"]]};
  }
  if(r.status==="Held"&&r.index===8){
    return {tone:"danger",title:"Safety restriction stopped this order",owner:"Carrier specialist (task agent) rejected the unsafe service; Planning Lead (goal agent) could not build a safe plan",why:r.reason,actions:[["Review safe alternatives","alternatives"],["Correct product data","correct"],["Pause this order","pause"]]};
  }
  if(r.status==="Recommended"){
    return {tone:"info",title:"Recommendation is ready for your review",owner:"No agent stopped the workflow; recommend-only mode requires a person before execution",why:r.reason,actions:[["Review recommendation","alternatives"],["Approve and continue","approval"]]};
  }
  return {tone:"success",title:"No human help is required",owner:"Authority control cleared the plan after all agent checks passed",why:r.reason,actions:[["View order handoff","order"],["Inspect evidence","evidence"]]};
}
function renderRunDetail(r){
  const isApproval=r.status==="Awaiting approval", isHold=r.status==="Held";
  const tasks=taskEvidence(r);
  const stageStatus=n=>r.phase<n?"Waiting":r.phase===n&&r.status==="Running"?"Working":"Finished";
  const intervention=interventionFor(r);
  $("#run-detail").innerHTML=`<div class="object-context"><div class="object-identity"><span class="object-icon">O</span><div><p>FULFILLMENT ORDER OBJECT</p><h2>${r.id}</h2></div></div><dl><div><dt>Merchant</dt><dd>${escapeHtml(r.merchant)}</dd></div><div><dt>Destination</dt><dd>${escapeHtml(r.destination)}</dd></div><div><dt>Service profile</dt><dd>${escapeHtml(r.profile)}</dd></div><div><dt>Object state</dt><dd><span class="state-pill ${r.status==="Running"?"working":isApproval?"attention":"ready"}">${friendlyStatus(r.status)}</span></dd></div></dl></div>
  <nav class="execution-tabs" aria-label="Order execution sections"><button class="active" data-scroll-target="decision-zone">Decision</button><button data-scroll-target="lineage-zone">Workflow lineage</button><button data-scroll-target="trace-zone">Agent trace</button><button data-scroll-target="output-zone">Output</button></nav>
  <div class="run-summary"><div><p class="eyebrow">EXECUTION INSTANCE · ${r.runId}</p><h2>${goalName(state.runConfig.goal)} fulfillment plan</h2><p>Coordinator version 1.0 · Policy version 1.0 · Evidence snapshot locked</p><small class="run-config">Escalate below ${state.runConfig.confidence}% confidence or above $${state.runConfig.costLimit}</small></div><div class="run-kpis"><div><span>Current stage</span><b>${r.status==="Running"?`${r.phase} / 4`:"4 / 4"}</b></div><div><span>Plans compared</span><b>${r.phase<3?"—":r.alternatives}</b></div><div><span>Next owner</span><b>${r.status==="Running"?"AGENTS":isApproval?"YOU":isHold?"YOU":"OPS"}</b></div></div></div>
  <section class="intervention-card ${intervention.tone}" id="decision-zone"><div class="intervention-main"><span class="intervention-icon">${intervention.tone==="success"?"✓":intervention.tone==="info"?"i":"!"}</span><div><p class="eyebrow">${r.status==="Running"?"CURRENT RESPONSIBILITY":"GOVERNED DECISION"}</p><h3>${intervention.title}</h3><b>${intervention.owner}</b><p>${intervention.why}</p></div></div><div class="suggested-actions"><span>AVAILABLE ACTIONS</span>${intervention.actions.map((a,i)=>`<button class="${i===0?"primary-action":"secondary-action"}" data-next-action="${a[1]}">${a[0]}${i===0?" →":""}</button>`).join("")}</div></section>
  <section class="workflow-drawing lineage-canvas" id="lineage-zone"><div class="workflow-heading"><div><p class="eyebrow">WORKFLOW LINEAGE</p><h3>Object state and execution path</h3></div><span class="workflow-legend"><i></i> Current step</span></div>${lifecycleFor(r)}<div class="architecture-map"><div class="${stageStatus(1).toLowerCase()}"><span>1</span><b>Coordinator</b><small>${stageStatus(1)}</small></div><i>→</i><div class="${stageStatus(2).toLowerCase()}"><span>2</span><b>Planning lead</b><small>${stageStatus(2)}</small></div><i>→</i><div class="${stageStatus(2).toLowerCase()}"><span>3</span><b>8 specialists</b><small>${stageStatus(2)}</small></div><i>→</i><div class="${stageStatus(3).toLowerCase()}"><span>4</span><b>Authority gate</b><small>${stageStatus(3)}</small></div></div></section>
  <div class="agent-work-log" id="trace-zone">
    <details open><summary><span class="agent-level orchestration">MANAGER</span><b>Fulfillment Coordinator</b><em>${stageStatus(1)}</em></summary><div class="work-evidence"><p><strong>Received</strong> Order event, current state, your outcome and limits.</p><p><strong>${r.phase<1?"Will do":"Did"}</strong> ${r.phase<1?"Choose the correct workflow and decide when to involve a person.":`Selected ${r.goal.replace(" goal","")} because this is ${r.index===4?"an inventory exception":"a new fulfillment order"}.`}</p><p><strong>Did not</strong> Calculate inventory, change a policy, or approve its own exception.</p></div></details>
    <details ${r.phase>=2?"open":""}><summary><span class="agent-level goal">WORKFLOW LEAD</span><b>Order Planning Lead</b><em>${stageStatus(2)}</em></summary><div class="work-evidence"><p><strong>Received</strong> Workflow objective plus mandatory evidence checklist.</p><p><strong>${r.phase<2?"Will do":"Did"}</strong> ${r.phase<2?"Run all required specialist checks and compare only safe plans.":`Completed the evidence ledger and ${r.alternatives?`generated ${r.alternatives} plan alternatives`:"found no complete plan"}.`}</p><p><strong>Did not</strong> Change stock, book a carrier, or skip a required check.</p></div></details>
    <details ${r.phase>=2?"open":""}><summary><span class="agent-level task">SPECIALISTS</span><b>Eight fact and calculation checks</b><em>${stageStatus(2)}</em></summary><div class="evidence-table">${tasks.map(t=>`<div class="evidence-row"><span class="evidence-state ${t.status.toLowerCase()}">${t.status}</span><div><b>${t.name}</b><small>Input: ${t.input}</small></div><div><strong>Output</strong><span>${t.status==="Waiting"?"Not started":t.output}</span></div><div><strong>Did not</strong><span>${t.prohibited}</span></div></div>`).join("")}</div></details>
    <details ${r.phase>=3?"open":""}><summary><span class="agent-level authority">CONTROL</span><b>Policy and human-authority gate</b><em>${stageStatus(3)}</em></summary><div class="work-evidence"><p><strong>Checked</strong> Customer promise, safety rules, your cost limit, required confidence, and automatic-action permission.</p><p><strong>Result</strong> ${r.phase<3?"Not evaluated yet.":r.status==="Running"?"Evaluating the recommended plan against your limits.":r.reason}</p><p><strong>Could not</strong> Weaken a promise, bypass safety, or increase authority.</p></div></details>
  </div>
  ${r.status==="Running"?`<div class="execution-wait" id="output-zone"><i></i><b>Agents are working</b><span>The decision will appear only after all required evidence and authority checks finish.</span></div>`:`<div class="decision-result" id="output-zone"><div><p class="eyebrow">WRITEBACK PREVIEW</p><h3>${friendlyStatus(r.status)}</h3><p>${r.reason}</p></div><div class="plan-grid"><div><span>Warehouse</span><b>${r.allocation}</b></div><div><span>Delivery service</span><b>${r.carrier}</b></div><div><span>Expected cost</span><b>${r.cost}</b></div><div><span>On-time chance</span><b>${r.confidence}</b></div></div></div>`}`;
  $$("[data-scroll-target]",$("#run-detail")).forEach(tab=>tab.addEventListener("click",()=>{
    $$("[data-scroll-target]",$("#run-detail")).forEach(t=>t.classList.toggle("active",t===tab));
    $(`#${tab.dataset.scrollTarget}`,$("#run-detail"))?.scrollIntoView({behavior:"smooth",block:"start"});
  }));
  $$("[data-next-action]",$("#run-detail")).forEach(button=>button.addEventListener("click",()=>{
    const action=button.dataset.nextAction;
    if(action==="approval"){
      if(!state.approvals.some(a=>a.id===r.id)){
        state.approvals.push({id:r.id,merchant:r.merchant,plan:`${r.allocation} · ${r.carrier}`,cost:r.cost,confidence:r.confidence});
        renderApprovals();updateCounts();
      }
      navigate("approvals");
    }
    else if(action==="order")navigate("orders");
    else if(action==="evidence")button.closest(".run-detail").querySelector(".agent-work-log")?.scrollIntoView({behavior:"smooth"});
    else if(action==="watch")toast("No action required — execution will continue automatically");
    else toast(`${button.textContent.trim()} recorded as the suggested next step for ${r.id}`);
  }));
}
function planFor(order){
  const base={id:order.id,merchant:order.merchant,destination:order.destination,profile:order.profile,runId:`OR-${String(order.index+1).padStart(3,"0")}-01`,time:`${(1.1+order.index*.13).toFixed(1)}s`,alternatives:3,status:"Released",goal:"Fulfillment planning goal",path:"Fulfillment planning → release",allocation:"YYZ1",carrier:"UPS Standard",cost:"$18.40",confidence:"94%",reason:"Plan meets the accepted promise and all constraints within automatic-release authority."};
  if(order.index===2)Object.assign(base,{allocation:"YVR1",carrier:"Canada Post Expedited",cost:"$14.20",confidence:"89%",alternatives:7,reason:"Chosen from seven feasible plans by expected cost, ground preference, and workload balance."});
  if(order.index===3)Object.assign(base,{allocation:"CMH1",carrier:"FedEx International Economy",cost:"$27.90",confidence:"92%",reason:"YYZ1 rejected after ground cutoff; the more distant FC remains promise-feasible."});
  if(order.index===4)Object.assign(base,{status:"Held",goal:"Inventory-shortage resolution goal",path:"Planning → shortage resolution → hold",allocation:"None",carrier:"None",cost:"—",confidence:"—",alternatives:0,reason:"No network inventory remains after protected safety stock. Advisory transfer requires human review."});
  if(order.index===5)Object.assign(base,{status:"Awaiting approval",allocation:"YYZ1 + YVR1",carrier:"Purolator Express",cost:"$49.10",confidence:"96%",reason:"Split protects the promise but exceeds the configured split premium authority."});
  if(order.index===6)Object.assign(base,{allocation:"CMH1",carrier:"UPS Worldwide Expedited",cost:"$33.70",confidence:"96%",reason:"Cross-Border modifier passed customs, route, and product eligibility checks."});
  if(order.index===7)Object.assign(base,{status:"Awaiting approval",allocation:"YVR1",carrier:"FedEx Priority",cost:"$59.80",confidence:"97%",reason:"Air is the only promise-feasible service and exceeds automatic cost authority."});
  if(order.index===8)Object.assign(base,{status:"Held",allocation:"CMH1",carrier:"None",cost:"—",confidence:"—",alternatives:1,reason:"Available air service rejects the lithium product; unsafe override is prohibited."});
  if(order.index===9)Object.assign(base,{allocation:"CMH1",carrier:"USPS Priority Mail",cost:"$16.60",confidence:"96%",reason:"Initial plan released. The shipment is subscribed to simulated disruption events."});
  return base;
}
function beginRuns(mode){
  const selected=state.orders.filter(o=>o.selected);
  state.runConfig={
    goal:$('input[name="goalPreset"]:checked').value,
    confidence:Number($("#confidence-limit").value),
    costLimit:Number($("#cost-limit").value),
    allowSplit:$("#allow-split").checked,
    allowAir:$("#allow-air").checked,
    allowRecovery:$("#allow-recovery").checked
  };
  selected.forEach(o=>{
    const run=planFor(o);
    const numericCost=Number(run.cost.replace(/[^0-9.]/g,""))||0;
    const numericConfidence=Number(run.confidence.replace("%",""))||0;
    if(o.index===5&&!state.runConfig.allowSplit){run.status="Held";run.reason="Split shipments were disabled for this run. No complete single-facility plan meets the promise.";}
    if(o.index===7&&!state.runConfig.allowAir){run.status="Held";run.reason="Air upgrades were disabled for this run. Available ground services miss the accepted promise.";}
    if(numericCost>state.runConfig.costLimit&&run.status==="Released"){run.status="Awaiting approval";run.reason=`The recommended plan costs $${numericCost.toFixed(2)}, above your $${state.runConfig.costLimit} automatic limit.`;}
    if(numericConfidence&&numericConfidence<state.runConfig.confidence&&run.status==="Released"){run.status="Awaiting approval";run.reason=`Delivery confidence is ${numericConfidence}%, below your ${state.runConfig.confidence}% minimum.`;}
    if(mode==="recommend"&&run.status==="Released")run.status="Recommended";
    run.configuration=`${state.runConfig.goal} · ≥${state.runConfig.confidence}% · auto ≤$${state.runConfig.costLimit}`;
    run.index=o.index;
    run.finalStatus=run.status;
    run.status="Running";
    run.phase=0;
    state.runs.unshift(run);
    o.status="Agents working";o.decision="Evidence collection in progress";
    audit(`Agent team started for ${o.id}`,`Coordinator received the order and your ${goalName(state.runConfig.goal)} operating instruction.`,"run.started");
    o.selected=false;
  });
  state.activeRunId=state.runs[0]?.id||null;
  updateCounts();renderIntake();renderRuns();renderApprovals();renderOrders();
  $("#run-complete-bar").classList.add("hidden");
  navigate("runs");toast(`${selected.length} agent teams started — open any order to watch`);
  if(state.runTimer)clearInterval(state.runTimer);
  let phase=0;
  state.runTimer=setInterval(()=>{
    phase+=1;
    state.runs.filter(r=>r.status==="Running").forEach(r=>{r.phase=phase;});
    if(phase<4){
      if(phase===1)audit("Coordinator selected workflows",`${selected.length} orders were routed to the appropriate planning workflow.`,"orchestration.goal_selected");
      if(phase===2)audit("Specialist evidence collected","Required order, inventory, facility, package, carrier, delivery, cost, and policy checks returned.","task.evidence_collected");
      if(phase===3)audit("Plans sent to authority gate","Feasible plans are being tested against user limits and automatic-action permissions.","policy.evaluation_started");
      renderRuns();return;
    }
    clearInterval(state.runTimer);state.runTimer=null;
    state.runs.filter(r=>r.status==="Running").forEach(run=>{
      run.status=run.finalStatus;
      const o=state.orders.find(order=>order.id===run.id);
      o.status=run.status;o.allocation=run.allocation;o.carrier=run.carrier;o.decision=run.status==="Released"?"Automatically authorized":friendlyStatus(run.status);
      if(run.status==="Awaiting approval")state.approvals.push({id:o.id,merchant:o.merchant,plan:`${run.allocation} · ${run.carrier}`,cost:run.cost,confidence:run.confidence});
      audit(`Planning finished for ${o.id}`,`${run.alternatives} alternatives considered. Governed outcome: ${friendlyStatus(run.status)}.`,"run.completed");
    });
    $("#stat-completed").textContent=38+selected.length;
    $("#stat-auto").textContent=`${Math.round(state.orders.filter(o=>o.status==="Released").length/Math.max(1,selected.length)*100)}%`;
    renderResults(selected);renderRuns();renderApprovals();renderOrders();updateCounts();
    $("#run-complete-bar").classList.remove("hidden");
    toast("Planning finished — review the architecture or open the summary");
  },1100);
}
function reset(){
  if(state.runTimer){clearInterval(state.runTimer);state.runTimer=null;}
  state.orders=ORDER_SEED.map((o,i)=>({id:o[0],merchant:o[1],destination:o[2],profile:o[3],promise:o[4],signal:o[5],signalState:o[6],selected:false,status:"Awaiting orchestration",allocation:"—",carrier:"—",decision:"Pending",index:i}));
  state.runs=[];state.approvals=[];state.audit=[{time:"14:32:08.441",title:"Simulation baseline verified",body:"Seed overseer-demo-v1 restored with all business invariants passing.",code:"simulation.baseline_verified"}];
  $("#results-report").classList.add("hidden");$("#start-here").classList.remove("hidden");
  $(".architecture-showcase").classList.remove("hidden");
  $("#run-complete-bar").classList.add("hidden");
  renderAll();navigate("command");toast("Simulation restored to overseer-demo-v1");
}
function renderAll(){renderIntake();renderOrders();renderAgents();renderGoals();renderPolicy();renderApprovals();renderAudit();renderRuns();updateCounts();}

$$(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("#select-all").addEventListener("click",()=>{state.orders.forEach(o=>o.selected=true);renderIntake();});
$("#master-check").addEventListener("change",e=>{state.orders.forEach(o=>o.selected=e.target.checked);renderIntake();});
$("#run-agents").addEventListener("click",()=>{const n=state.orders.filter(o=>o.selected).length;if(!n){toast("Select at least one order first");return;}$("#dialog-copy").textContent=`You selected ${n} order${n>1?"s":""}. Before anything begins, choose the outcome you want, review every agent and its permissions, then set the limits that require your decision.`;showWizardStep(1);$("#run-dialog").showModal();});
$("#run-dialog").addEventListener("close",()=>{if($("#run-dialog").returnValue==="confirm")beginRuns($('input[name="mode"]:checked').value);});
$("#order-search").addEventListener("input",renderOrders);
$("#reset-button").addEventListener("click",()=>{if(confirm("Reset all mutable simulation state to overseer-demo-v1?"))reset();});
$("#profile-button").addEventListener("click",()=>toast("Role: Orchestration Overseer · Full operational scope"));
$("#theme-toggle").addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
$("#language-help").addEventListener("click",()=>toast("Plain labels are shown first. Hover a status to see its system term."));
$("#confidence-limit").addEventListener("input",e=>$("#confidence-output").textContent=`${e.target.value}%`);
$("#cost-limit").addEventListener("input",e=>$("#cost-output").textContent=`$${e.target.value}`);
$$('input[name="goalPreset"]').forEach(input=>input.addEventListener("change",()=>{
  $$(".goal-presets label").forEach(label=>label.classList.toggle("selected",label.contains($('input[name="goalPreset"]:checked'))));
  const values={balanced:[90,35],service:[95,55],cost:[85,25]}, preset=values[$('input[name="goalPreset"]:checked').value];
  $("#confidence-limit").value=preset[0];$("#confidence-output").textContent=`${preset[0]}%`;
  $("#cost-limit").value=preset[1];$("#cost-output").textContent=`$${preset[1]}`;
}));
$("#wizard-next").addEventListener("click",()=>showWizardStep(wizardStep+1));
$("#wizard-back").addEventListener("click",()=>showWizardStep(wizardStep-1));
$$("[data-wizard-go]").forEach(button=>button.addEventListener("click",()=>showWizardStep(Number(button.dataset.wizardGo))));
$$(".agent-enabled").forEach(input=>input.addEventListener("change",()=>{if(wizardStep===4)renderConfirmation();}));
$$("[data-agent-filter]").forEach(button=>button.addEventListener("click",()=>{
  state.agentFilter=button.dataset.agentFilter;
  $$("[data-agent-filter]").forEach(b=>b.classList.toggle("active",b===button));
  renderAgents();
}));
$("#tour-button").addEventListener("click",()=>$("#tour-dialog").showModal());
$("#tour-dialog").addEventListener("close",()=>{if($("#tour-dialog").returnValue==="start")navigate("intake");});
$$("[data-recovery]").forEach(b=>b.addEventListener("click",()=>{audit("Recovery workflow started","FS-10421 disruption reassessed against remaining customer promise.","goal.delivery_recovery_started");navigate("audit");toast("Delivery recovery workflow started");}));
renderAll();
applyTheme(localStorage.getItem("overseer-theme")||"light");

/* Governed-service integration. GitHub Pages falls back to demo mode. */
const enterprise = {connected:false,session:null,readiness:null,controls:null,approvals:[]};
async function apiGet(path){
  const response=await fetch(path,{headers:{"Accept":"application/json"}});
  const type=response.headers.get("content-type")||"";
  if(!response.ok||!type.includes("application/json"))throw new Error("Governed service unavailable");
  return response.json();
}
async function apiPost(path,body){
  const response=await fetch(path,{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({error:"Invalid service response"}));
  if(!response.ok)throw new Error(data.error||"Governed request failed");
  return data;
}
function renderEnterprise(){
  const root=$("#enterprise-status");
  if(!root)return;
  if(!enterprise.connected){
    root.innerHTML=`<section class="enterprise-hero"><span class="backend-indicator demo"></span><div><p>CONNECTION</p><h2>Public demonstration mode</h2><span>No private backend is connected. Run the Python service and open http://127.0.0.1:8080 to enter governed mode.</span></div></section>
      <div class="enterprise-callout"><b>Your public website is working normally.</b>Demo actions use controlled sample data and do not write to a company database.</div>`;
    return;
  }
  const actor=enterprise.session.actor, caps=enterprise.session.capabilities;
  const checks=enterprise.readiness.checks;
  const control=enterprise.controls.controls.bounded_execution;
  root.innerHTML=`<section class="enterprise-hero"><span class="backend-indicator live"></span><div><p>CONNECTION</p><h2>Governed service connected</h2><span>Persistent records, verified identity, server permissions, and audit controls are active.</span></div></section>
    <div class="enterprise-grid">
      <article class="enterprise-tile"><span>SIGNED IN AS</span><b>${escapeHtml(actor.id)}</b><small>Identity mode: ${escapeHtml(actor.mode)}</small></article>
      <article class="enterprise-tile"><span>SERVER ROLE</span><b>${escapeHtml(actor.role)}</b><small>${caps.execute?"Can request runs":"Read only"} · ${caps.approve?"Can approve":"Cannot approve"}</small></article>
      <article class="enterprise-tile"><span>EXECUTION CONTROL</span><b>${escapeHtml(control.value)}</b><small>Bounded writes fail closed when disabled</small></article>
      <article class="enterprise-tile"><span>PENDING DECISIONS</span><b>${enterprise.approvals.length}</b><small>Independent approval required</small></article>
    </div>
    <section class="enterprise-panel"><h2>Runtime readiness</h2>
      <div class="enterprise-check"><i></i><b>Database</b><span>${escapeHtml(checks.database)} · persistent operational records</span></div>
      <div class="enterprise-check"><i></i><b>Audit chain</b><span>${escapeHtml(checks.audit_chain)} · tamper-evident history verified</span></div>
      <div class="enterprise-check"><i></i><b>Identity boundary</b><span>${escapeHtml(checks.identity)} · role enforced by the service</span></div>
      <div class="enterprise-check"><i class="${control.value==="disabled"?"":"warn"}"></i><b>Bounded execution</b><span>${escapeHtml(control.value)} · ${control.value==="disabled"?"safe shadow/recommend modes only":"LIVE WRITES PERMITTED"}</span></div>
    </section>
    <div class="enterprise-callout"><b>${actor.mode==="development"?"Local development identity":"Company identity verified"}</b>${actor.mode==="development"?"Use an OIDC identity proxy before sharing this service with other users.":"Identity claims were supplied by the trusted authentication boundary."}</div>`;
}
async function refreshEnterprise(){
  try{
    const [session,readiness,controls,orders,approvals,auditData]=await Promise.all([
      apiGet("/api/session"),apiGet("/api/readiness"),apiGet("/api/controls"),
      apiGet("/api/orders"),apiGet("/api/approvals"),apiGet("/api/audit")
    ]);
    Object.assign(enterprise,{connected:true,session,readiness,controls,approvals:approvals.approvals});
    orders.orders.forEach(remote=>{
      const local=state.orders.find(order=>order.id===remote.id);
      if(local){local.merchant=remote.merchant;local.destination=remote.destination;local.profile=remote.profile;local.status=remote.status;local.decision=`Persistent record v${remote.version}`;}
    });
    state.approvals=approvals.approvals.map(item=>({id:item.order_id,approvalId:item.id,merchant:item.merchant,plan:item.reason,cost:"—",confidence:item.escalation}));
    state.audit=auditData.events.map(event=>({time:event.timestamp.slice(11,23),title:event.action,body:`${event.object_type} ${event.object_id} · ${event.actor}`,code:event.event_id}));
    $("#service-mode").textContent="Governed mode";
    $("#service-identity").textContent=`${session.actor.id} · ${session.actor.role}`;
    $("#service-dot").classList.add("live");
    $("#profile-button").querySelector("strong").textContent=session.actor.id;
    $("#profile-button").querySelector("small").textContent=`${session.actor.role} · server verified`;
    renderAll();renderEnterprise();
  }catch(error){
    enterprise.connected=false;
    $("#service-mode").textContent="Simulation";
    $("#service-identity").textContent="Toronto · public demo";
    renderEnterprise();
  }
}
$("#refresh-enterprise")?.addEventListener("click",refreshEnterprise);
refreshEnterprise();
