const ORDER_SEED = [
  ["FS-10422","PulseTech","Toronto, ON","Prime","Jul 31 · 20:00","Normal Prime","ready"],
  ["FS-10423","Hearth & Hue","Ottawa, ON","Standard","Aug 3 · 20:00","Ground feasible","ready"],
  ["FS-10424","Northstar","Calgary, AB","Economy","Aug 6 · 20:00","Several FCs feasible","ready"],
  ["FS-10425","Northstar","Montréal, QC","Standard","Aug 3 · 20:00","Closest FC cutoff missed","attention"],
  ["FS-10426","PulseTech","Edmonton, AB","Standard","Aug 4 · 20:00","Network inventory shortage","danger"],
  ["FS-10427","Hearth & Hue","Halifax, NS","Prime","Aug 2 · 20:00","Split shipment analysis","attention"],
  ["FS-10428","PulseTech","Vancouver, BC","Prime","Aug 1 · 20:00","Cross-border stock only","attention"],
  ["FS-10429","Northstar","Iqaluit, NU","Merchant Priority","Aug 2 · 20:00","Air upgrade approval","attention"],
  ["FS-10430","PulseTech","Seattle, WA","Standard","Aug 4 · 20:00","Lithium restriction","attention"],
  ["FS-10431","Hearth & Hue","Columbus, OH","Replacement","Aug 1 · 20:00","Later carrier disruption","ready"]
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
  ]
};
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const escapeHtml = value => String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

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
  $("#result-time").textContent=`${processed.length*7} min`;
  $("#report-sentence").textContent=`${processed.length} orders evaluated. ${released} required no human work; ${processed.length-released} need review or corrective action.`;
  const issues=[];
  if(processed.some(o=>o.index===4))issues.push(["Inventory shortage","Network stock is unavailable after protected safety stock.","orders"]);
  if(processed.some(o=>[5,7].includes(o.index)))issues.push(["Cost authority exceeded","An air upgrade or split needs human approval.","approvals"]);
  if(processed.some(o=>o.index===8))issues.push(["Carrier restriction","Lithium handling removes the available air option.","orders"]);
  if(processed.some(o=>o.index===3))issues.push(["Missed facility cutoff","Earlier planning may avoid cross-border recovery cost.","runs"]);
  const visibleIssues=issues.length?issues:[["No material exceptions","All selected orders stayed within automatic authority.","runs"]];
  $("#top-issues").innerHTML=visibleIssues.slice(0,3).map((x,i)=>`<div class="issue-row"><span class="issue-rank">${i+1}</span><div><strong>${x[0]}</strong><small>${x[1]}</small></div><button data-issue-go="${x[2]}">Review →</button></div>`).join("");
  $$("[data-issue-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.issueGo)));
  $("#results-report").classList.remove("hidden");
  $("#start-here").classList.add("hidden");
}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function renderIntake(){
  $("#orders-body").innerHTML=state.orders.map(o=>`<tr class="${o.selected?"selected":""}">
    <td><input class="order-check" type="checkbox" data-id="${o.id}" ${o.selected?"checked":""} aria-label="Select ${o.id}"></td>
    <td><strong>${o.id}</strong></td><td>${escapeHtml(o.merchant)}</td><td>${escapeHtml(o.destination)}</td>
    <td><span class="profile-pill">${escapeHtml(o.profile)}</span></td><td>${escapeHtml(o.promise)}</td>
    <td><span class="row-signal"><i></i>${escapeHtml(o.signal)}</span></td><td><span class="state-pill ${o.signalState}">${escapeHtml(o.status)}</span></td></tr>`).join("");
  const n=state.orders.filter(o=>o.selected).length;
  $("#selection-label").textContent=`${n} selected`;
  $("#master-check").checked=n===state.orders.length;
  $("#master-check").indeterminate=n>0&&n<state.orders.length;
  $$(".order-check").forEach(c=>c.addEventListener("change",()=>{state.orders.find(o=>o.id===c.dataset.id).selected=c.checked;renderIntake();}));
}
function renderOrders(){
  const q=($("#order-search")?.value||"").toLowerCase();
  const list=state.orders.filter(o=>`${o.id} ${o.merchant}`.toLowerCase().includes(q));
  $("#all-orders-body").innerHTML=list.map(o=>`<tr><td><strong>${o.id}</strong><br><small>${escapeHtml(o.destination)}</small></td><td>${escapeHtml(o.merchant)}</td><td><span class="profile-pill">${escapeHtml(o.profile)}</span></td><td>${escapeHtml(o.allocation)}</td><td>${escapeHtml(o.carrier)}</td><td>${escapeHtml(o.decision)}</td><td><span class="state-pill ${o.status.includes("Approval")||o.status==="Held"?"attention":"ready"}">${escapeHtml(o.status)}</span></td></tr>`).join("");
}
function renderAgents(){
  $("#agent-grid").innerHTML=AGENTS.map(a=>`<article class="agent-card"><header><i>${a[0]}</i><div><h2>${a[1]}</h2><small>${a[2]}</small></div></header><p>${a[3]}</p><div class="agent-meta"><span>${a[4]}</span><b>● ${a[5]}</b></div></article>`).join("");
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
  el.innerHTML=state.approvals.map(a=>`<article class="approval-card" data-approval="${a.id}"><div><p class="eyebrow">OPEN · AIR UPGRADE OVER AUTHORITY</p><h2>${a.id} · ${escapeHtml(a.merchant)}</h2><p>Ground service misses the accepted promise. Air is the only plan above the required delivery confidence.</p><div class="approval-facts"><div><span>Selected plan</span><b>${a.plan}</b></div><div><span>Expected cost</span><b>${a.cost}</b></div><div><span>On-time confidence</span><b>${a.confidence}</b></div></div></div><div class="approval-actions"><button class="reject" data-decision="reject">Hold</button><button class="approve" data-decision="approve">Approve & release</button></div></article>`).join("");
  $$("[data-decision]").forEach(btn=>btn.addEventListener("click",()=>decideApproval(btn.closest("[data-approval]").dataset.approval,btn.dataset.decision)));
}
function decideApproval(id,decision){
  const approval=state.approvals.find(a=>a.id===id), order=state.orders.find(o=>o.id===id);
  if(decision==="approve"){order.status="Released";order.decision="Human approved";order.allocation="YVR1";order.carrier="FedEx Priority";audit("Human approval committed",`${id} recommendation v1 revalidated and released by Alex Ortega.`,"approval.approved");toast(`${id} approved and released`);}
  else {order.status="Held";order.decision="Held by overseer";audit("Approval held",`${id} retained without operational mutation.`,"approval.held");toast(`${id} placed on hold`);}
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
  $("#run-list").innerHTML=state.runs.map((r,i)=>`<button class="run-list-item ${i===0?"active":""}" data-run="${r.id}"><div><strong>${r.id}</strong><span class="state-pill ${r.status==="Awaiting approval"?"attention":"ready"}">${r.status}</span></div><p>${escapeHtml(r.merchant)} · ${escapeHtml(r.profile)}</p><small>${r.path}</small></button>`).join("");
  $$(".run-list-item").forEach(b=>b.addEventListener("click",()=>{$$(".run-list-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderRunDetail(state.runs.find(r=>r.id===b.dataset.run));}));
  renderRunDetail(state.runs[0]);
}
function renderRunDetail(r){
  const isApproval=r.status==="Awaiting approval", isHold=r.status==="Held";
  $("#run-detail").innerHTML=`<div class="run-summary"><div><p class="eyebrow">ORCHESTRATION RUN · ${r.runId}</p><h2>${r.id}</h2><p>${escapeHtml(r.merchant)} · ${escapeHtml(r.destination)} · ${escapeHtml(r.profile)}</p></div><div class="run-kpis"><div><span>Plan time</span><b>${r.time}</b></div><div><span>Alternatives</span><b>${r.alternatives}</b></div><div><span>Decision</span><b>${isApproval?"HUMAN":isHold?"HELD":"AUTO"}</b></div></div></div>
  <div class="hierarchy">
    <div class="step"><span class="step-icon">O</span><h3>Fulfillment Orchestrator <span class="state-pill ready">Succeeded</span></h3><p>Selected ${r.goal}; pinned ${escapeHtml(r.profile)} profile v1.0 and guardrails v1.0.</p></div>
    <div class="step"><span class="step-icon">G</span><h3>${r.goal} <span class="state-pill ${isHold?"danger":"ready"}">${isHold?"Escalated":"Completed"}</span></h3><p>All mandatory checks returned current, schema-valid evidence.</p><div class="task-chips"><span>✓ Order validation</span><span>✓ Address zone</span><span>✓ Inventory ATP</span><span>✓ Capacity / cutoff</span><span>✓ Packaging</span><span>✓ Carrier services</span><span>✓ Delivery estimate</span><span>✓ Policy authority</span></div></div>
    <div class="step"><span class="step-icon">D</span><h3>Decision checkpoint <span class="state-pill ${isApproval?"attention":isHold?"danger":"ready"}">${r.status}</span></h3><p>${r.reason}</p></div>
  </div>
  <div class="plan-box"><h3>Recommended plan · evidence snapshot v1</h3><div class="plan-grid"><div><span>Allocation</span><b>${r.allocation}</b></div><div><span>Carrier service</span><b>${r.carrier}</b></div><div><span>Expected cost</span><b>${r.cost}</b></div><div><span>On-time confidence</span><b>${r.confidence}</b></div></div></div>`;
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
  selected.forEach(o=>{
    const run=planFor(o); if(mode==="recommend"&&run.status==="Released")run.status="Recommended";
    state.runs.unshift(run);
    o.status=run.status;o.allocation=run.allocation;o.carrier=run.carrier;o.decision=run.status==="Released"?"Auto-authorized":run.status;
    if(run.status==="Awaiting approval")state.approvals.push({id:o.id,merchant:o.merchant,plan:`${run.allocation} · ${run.carrier}`,cost:run.cost,confidence:run.confidence});
    audit(`Orchestration completed for ${o.id}`,`${run.goal} produced ${run.alternatives} alternatives; outcome: ${run.status}.`,"run.completed");
    o.selected=false;
  });
  updateCounts();renderIntake();renderRuns();renderApprovals();renderOrders();
  $("#stat-completed").textContent=38+selected.length;
  $("#stat-auto").textContent=`${Math.round(state.orders.filter(o=>o.status==="Released").length/Math.max(1,selected.length)*100)}%`;
  renderResults(selected);
  navigate("command");toast(`${selected.length} orders planned — outcome summary is ready`);
}
function reset(){
  state.orders=ORDER_SEED.map((o,i)=>({id:o[0],merchant:o[1],destination:o[2],profile:o[3],promise:o[4],signal:o[5],signalState:o[6],selected:false,status:"Awaiting orchestration",allocation:"—",carrier:"—",decision:"Pending",index:i}));
  state.runs=[];state.approvals=[];state.audit=[{time:"14:32:08.441",title:"Simulation baseline verified",body:"Seed overseer-demo-v1 restored with all business invariants passing.",code:"simulation.baseline_verified"}];
  $("#results-report").classList.add("hidden");$("#start-here").classList.remove("hidden");
  renderAll();navigate("command");toast("Simulation restored to overseer-demo-v1");
}
function renderAll(){renderIntake();renderOrders();renderAgents();renderGoals();renderPolicy();renderApprovals();renderAudit();renderRuns();updateCounts();}

$$(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("#select-all").addEventListener("click",()=>{state.orders.forEach(o=>o.selected=true);renderIntake();});
$("#master-check").addEventListener("change",e=>{state.orders.forEach(o=>o.selected=e.target.checked);renderIntake();});
$("#run-agents").addEventListener("click",()=>{const n=state.orders.filter(o=>o.selected).length;if(!n){toast("Select at least one order first");return;}$("#dialog-copy").textContent=`${n} selected order${n>1?"s":""} will receive independent orchestration runs. Profiles are assigned from the accepted checkout service and merchant policy.`;$("#run-dialog").showModal();});
$("#run-dialog").addEventListener("close",()=>{if($("#run-dialog").returnValue==="confirm")beginRuns($('input[name="mode"]:checked').value);});
$("#order-search").addEventListener("input",renderOrders);
$("#reset-button").addEventListener("click",()=>{if(confirm("Reset all mutable simulation state to overseer-demo-v1?"))reset();});
$("#profile-button").addEventListener("click",()=>toast("Role: Orchestration Overseer · Full operational scope"));
$("#tour-button").addEventListener("click",()=>$("#tour-dialog").showModal());
$("#tour-dialog").addEventListener("close",()=>{if($("#tour-dialog").returnValue==="start")navigate("intake");});
$$("[data-recovery]").forEach(b=>b.addEventListener("click",()=>{audit("Recovery workflow started","FS-10421 disruption reassessed against remaining customer promise.","goal.delivery_recovery_started");navigate("audit");toast("Delivery recovery workflow started");}));
renderAll();
