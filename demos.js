/* OMNA project demos: a working, in-browser simulation of each project's main flow. Logic mirrors the n8n workflows; data is sample data. */
(function(){
const slug=typeof MODE!=="undefined"&&MODE!=="hub"?MODE:null; if(!slug) return;
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const wait=ms=>new Promise(r=>setTimeout(r,matchMedia("(prefers-reduced-motion: reduce)").matches?0:ms));
const now=()=>{const d=new Date();return d.toTimeString().slice(0,5)};
const rid=p=>p+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
const egp=n=>Number(n).toLocaleString("en-US")+" EGP";

/* ---------- toolkit ---------- */
function UI(root,cfg){
  const q=s=>root.querySelector(s);
  const busy={on:false};
  const api={
    me(t){ if(!q(".dm-msgs")) return; q(".dm-msgs").insertAdjacentHTML("beforeend",`<div class="dm-b me" dir="auto">${esc(t)}<small>${now()}</small></div>`); scroll(".dm-msgs"); },
    bot(t,extra=""){ if(!q(".dm-msgs")) return; q(".dm-msgs").insertAdjacentHTML("beforeend",`<div class="dm-b them" dir="auto">${esc(t)}${extra}<small>${now()}</small></div>`); scroll(".dm-msgs"); },
    out(html){ const o=q(".dm-out"); if(o){o.innerHTML=html;} },
    staff(t,buttons=[]){ const d=document.createElement("div"); d.className="dm-tg"; d.innerHTML=`<span class="from">${esc(cfg.staffBot||"OMNA Bot")}</span>${esc(t)}`;
      if(buttons.length){ const kb=document.createElement("div"); kb.className="dm-kb"; buttons.forEach(b=>{const x=document.createElement("button");x.type="button";x.textContent=b.label;x.onclick=async()=>{ if(busy.on) return; if(b.once!==false) kb.querySelectorAll("button").forEach(y=>y.disabled=true); await b.onClick(d,x); };kb.appendChild(x)}); d.appendChild(kb); }
      q(".dm-tgm").appendChild(d); scroll(".dm-tgm"); return d; },
    note(card,t){ card.insertAdjacentHTML("beforeend",`<div class="dm-done">${esc(t)}</div>`); },
    toast(t){ q(".dm-tgm").insertAdjacentHTML("beforeend",`<div class="dm-toast">${esc(t)}</div>`); scroll(".dm-tgm"); },
    clear(){ const l=q(".dm-log"); l.innerHTML=""; },
    async log(k,v="",cls="",ms=220){ const l=q(".dm-log"); l.querySelector(".dm-empty")?.remove(); l.insertAdjacentHTML("beforeend",`<li class="${cls}"><i></i><div><span class="k">${esc(k)}</span>${v?` <span class="v">· ${esc(v)}</span>`:""}</div></li>`); l.scrollTop=1e6; await wait(ms); },
    head(k,v){ return api.log(k,v,"head",250); },
    email(to,subject,body){ const id="m"+Math.random().toString(36).slice(2,8); mails[id]={to,subject,body}; api.staff(`✉ Email to ${to}\n“${subject}”`,[{label:"Open email",once:false,onClick:()=>openMail(id)}]); },
    sheet(name,cols,rows,flash){ sheets[name]={cols,rows}; renderSheet(name,flash); },
    state:{}, busy
  };
  const mails={}, sheets={}; let cur=null;
  function scroll(s){ const e=q(s); if(e) e.scrollTop=1e6; }
  function renderSheet(name,flash){ cur=name||cur; const tabs=Object.keys(sheets).map(n=>`<button type="button" data-s="${esc(n)}" aria-selected="${n===cur}">${esc(n)}</button>`).join("");
    const s=sheets[cur]; q(".dm-sheet").innerHTML=`<header><b>Google Sheet</b><div class="dm-stabs">${tabs}</div></header><div class="dm-tbl"><table><thead><tr>${s.cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.length?s.rows.map((r,i)=>`<tr class="${flash&&i===s.rows.length-1?"fl":""}">${s.cols.map(c=>`<td>${esc(r[c]??"")}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${s.cols.length}" class="dm-none">No rows yet.</td></tr>`}</tbody></table></div>`;
    q(".dm-sheet").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>renderSheet(b.dataset.s)); }
  function openMail(id){ const m=mails[id]; const d=document.getElementById("dm-dlg"); d.querySelector("b").textContent=m.subject; d.querySelector(".to").textContent="To: "+m.to; d.querySelector(".body").textContent=m.body; d.showModal?d.showModal():d.setAttribute("open",""); }
  api.run=async fn=>{ if(busy.on) return; busy.on=true; q(".dm-state").textContent="running"; q(".dm-state").className="pill dm-state acc"; api.clear(); try{ await fn(); q(".dm-state").textContent="succeeded"; q(".dm-state").className="pill dm-state ok"; }catch(e){ console.error(e); q(".dm-state").textContent="error"; } busy.on=false; };
  return api;
}
const CSS=`.dm{padding-block:44px;border-top:1px solid var(--line)}
.dm-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
.dm-col{min-width:0;display:flex;flex-direction:column;height:560px;overflow:hidden}
.dm-col>header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:600}
.dm-phone{border-radius:24px;border:7px solid var(--ink);background:color-mix(in srgb,var(--p) 7%,var(--bg))}
.dm-phone>header{background:var(--p);color:var(--accent-ink);border:0}
.dm-msgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.dm-b{max-width:86%;padding:8px 11px;border-radius:12px;font-size:.88rem;line-height:1.45;white-space:pre-wrap;box-shadow:0 1px 0 rgba(0,0,0,.06)}
.dm-b.me{align-self:flex-end;background:color-mix(in srgb,var(--p) 18%,var(--surface));border-top-right-radius:4px}
.dm-b.them{align-self:flex-start;background:var(--surface);border-top-left-radius:4px}
.dm-b small{display:block;text-align:end;font-size:.66rem;color:var(--muted);margin-top:2px}
.dm-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 10px;border-top:1px solid var(--line);background:var(--surface)}
.dm-chips button{flex:none;border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:5px 10px;font-size:.78rem;cursor:pointer;color:var(--ink)}
.dm-chips button:hover{border-color:var(--p);color:var(--p)}
.dm-in{display:flex;gap:8px;padding:8px 10px 10px;background:var(--surface)}
.dm-in input{flex:1;min-width:0;border-radius:999px;border:1px solid var(--line);background:var(--bg);padding:8px 13px;color:var(--ink)}
.dm-in button{border:0;border-radius:999px;background:var(--p);color:var(--accent-ink);padding:0 14px;font-weight:600;cursor:pointer}
.dm-form{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--surface)}
.dm-form label{display:flex;flex-direction:column;gap:4px;font-size:.84rem;font-weight:600}
.dm-form input,.dm-form select,.dm-form textarea{padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-weight:400}
.dm-form textarea{min-height:64px;resize:vertical}
.dm-out{padding:10px 14px;border-top:1px solid var(--line);font-size:.86rem;background:var(--bg);max-height:170px;overflow:auto;white-space:pre-wrap}
.dm-out:empty{display:none}
.dm-log{list-style:none;margin:0;padding:8px 0;flex:1;overflow:auto;background:#0E1622;color:#CFD9E6;font:400 .76rem/1.45 ui-monospace,Menlo,Consolas,monospace}
.dm-log li{display:grid;grid-template-columns:14px 1fr;gap:8px;padding:2px 12px}
.dm-log li i{width:8px;height:8px;border-radius:50%;margin-top:5px;background:#5B8BD8}
.dm-log li .k{color:#fff}.dm-log li .v{color:#8FA3C2}
.dm-log li.ok i{background:#3CC293}.dm-log li.warn i{background:#F2A54C}.dm-log li.bad i{background:#F27777}.dm-log li.head{padding-top:8px}.dm-log li.head .k{color:#F5A46C}
.dm-empty{display:block!important;color:#8FA3C2;padding:8px 12px}
.dm-tgp>header{background:#2B8FD0;color:#fff;border:0}
.dm-tgm{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;background:#E3F0FA}
.dm-tg{background:#fff;color:#14202B;border-radius:10px;padding:9px 11px;font-size:.84rem;white-space:pre-wrap;box-shadow:0 1px 0 rgba(0,0,0,.06)}
.dm-tg .from{display:block;font-weight:600;font-size:.74rem;color:#2B8FD0;margin-bottom:3px}
.dm-kb{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.dm-kb button{flex:1 1 auto;border:0;border-radius:8px;padding:6px 8px;background:#E3F0FA;color:#1F6FA6;font-weight:600;cursor:pointer}.dm-kb button:disabled{opacity:.45;cursor:default}
.dm-done{margin-top:6px;font-weight:600;font-size:.82rem}
.dm-toast{align-self:center;background:rgba(0,0,0,.72);color:#fff;border-radius:9px;padding:6px 11px;font-size:.8rem}
.dm-sheet{margin-top:14px;overflow:hidden}
.dm-sheet header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line)}
.dm-stabs{display:flex;gap:4px;margin-left:auto;flex-wrap:wrap}.dm-stabs button{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:4px 9px;font-size:.8rem;cursor:pointer}.dm-stabs button[aria-selected=true]{background:var(--ink);color:var(--bg)}
.dm-tbl{overflow:auto;max-height:280px}.dm-tbl table{border-collapse:collapse;width:100%;font-size:.82rem}.dm-tbl th,.dm-tbl td{text-align:left;padding:7px 11px;border-bottom:1px solid var(--line);white-space:nowrap}.dm-tbl th{font:500 .68rem/1 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--surface-2);position:sticky;top:0}
.dm-tbl tr.fl{animation:dmfl 1.4s ease}@keyframes dmfl{0%{background:color-mix(in srgb,var(--p) 25%,transparent)}100%{background:transparent}}
.dm-none{color:var(--muted)}
#dm-dlg{border:0;padding:0;border-radius:14px;max-width:min(600px,calc(100vw - 32px));width:100%}#dm-dlg::backdrop{background:rgba(0,0,0,.5)}
#dm-dlg header{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid #ddd;color:#111}#dm-dlg .body{padding:16px;white-space:pre-wrap;color:#1f2937;font-size:.92rem;max-height:65vh;overflow:auto}
@media (max-width:1000px){.dm-grid{grid-template-columns:1fr 1fr}.dm-logc{grid-column:1/-1;order:3;height:320px}}
@media (max-width:680px){.dm-grid{grid-template-columns:1fr}.dm-col{height:520px}}`;

/* ---------- per-project demos ---------- */
const D={};

/* Talabat Mini */
D["talabat-mini"]={title:"Order a meal",intro:"Write an order the way a customer would, confirm it, then run the kitchen from Telegram. Every status tap updates the customer.",
 left:"chat",phone:"Talabat Mini",staffBot:"Kitchen Bot",chips:["2 shawarma and a pepsi to Nasr City","1 kofta, fries to Maadi","3 molokhia","CONFIRM","CANCEL"],
 init(u){ u.state.menu={shawarma:85,kofta:95,fries:30,pepsi:25,molokhia:70,koshari:45}; u.state.zones={"nasr city":20,"heliopolis":25,"maadi":35,"zamalek":30}; u.state.orders=[];
   u.sheet("Menu",["item","price_egp"],Object.entries(u.state.menu).map(([k,v])=>({item:k,price_egp:v}))); u.sheet("Zones",["zone","delivery_egp"],Object.entries(u.state.zones).map(([k,v])=>({zone:k,delivery_egp:v}))); u.sheet("Orders",["order_id","items","zone","total","status"],u.state.orders);
   u.bot("Welcome to Talabat Mini! Tell us your order and area, e.g. “2 shawarma and a pepsi to Nasr City”."); },
 async onSend(t,u){ await u.head("WhatsApp Trigger","customer message"); await u.log("Normalize WhatsApp"); await u.log("Incoming Message"); await u.log("Find Draft Order",u.state.draft?u.state.draft.id:"none");
   const low=t.toLowerCase().trim();
   if(u.state.draft&&/^(confirm|yes|ok|تمام|اكد)/.test(low)){ const o=u.state.draft; await u.log("Decide Step","confirm"); await u.log("Confirm Order",o.id,"ok"); o.status="confirmed"; u.state.draft=null; u.state.orders.push(o); u.sheet("Orders",["order_id","items","zone","total","status"],u.state.orders,true);
     await u.log("Post to Kitchen","Telegram card"); kitchenCard(o,u); await u.log("Save Kitchen Message"); await u.log("Confirmed Reply","WhatsApp","ok"); u.bot(`✅ Order ${o.id} confirmed! The kitchen has it. We'll update you here.`); return; }
   if(u.state.draft&&/^(cancel|no|الغاء|لا)/.test(low)){ await u.log("Decide Step","cancel"); await u.log("Cancel Order",u.state.draft.id); u.state.draft=null; await u.log("Cancelled Reply"); u.bot("Your draft order was cancelled. Send a new order any time."); return; }
   await u.log("Decide Step","new order"); await u.log("Read Menu"); await u.log("Read Zones"); await u.log("Prepare Order Parsing"); await u.log("AI Parse Order","reading items, quantities and area",""," ");
   const items=[]; for(const [k,p] of Object.entries(u.state.menu)){ const m=low.match(new RegExp("(\\d+)?\\s*"+k)); if(m) items.push({k,q:+(m[1]||1),p}); }
   const zone=Object.keys(u.state.zones).find(z=>low.includes(z));
   await u.log("Validate Order",items.length?(zone?"ok":"missing delivery area"):"no menu items found",items.length&&zone?"ok":"warn");
   if(!items.length){ await u.log("Order Valid?","false"); await u.log("Text Only Reply"); u.bot("I couldn't find menu items in that. Our menu: "+Object.keys(u.state.menu).join(", ")+"."); return; }
   if(!zone){ await u.log("Order Valid?","false"); u.bot("Got it: "+items.map(i=>i.q+" × "+i.k).join(", ")+". Which area should we deliver to? We cover "+Object.keys(u.state.zones).map(z=>z.replace(/\b\w/g,c=>c.toUpperCase())).join(", ")+"."); return; }
   const sub=items.reduce((s,i)=>s+i.q*i.p,0), fee=u.state.zones[zone]; const o={id:"",items:items.map(i=>i.q+"× "+i.k).join(", "),zone,total:sub+fee,status:"draft"}; o.id=o.order_id=rid("T"); u.state.draft=o;
   await u.log("Order Valid?","true","ok"); await u.log("Save Draft Order",o.id); await u.log("Draft Saved Reply");
   u.bot(`🧾 Your order ${o.id}\n${items.map(i=>`${i.q} × ${i.k} = ${i.q*i.p}`).join("\n")}\nDelivery (${zone}) = ${fee}\nTotal ${egp(o.total)}\n\nReply CONFIRM to place it or CANCEL.`); }};
function kitchenCard(o,u){ const flow=["Accept","Preparing","Out for delivery","Delivered"]; let i=0;
  const card=u.staff(`🍽 New order ${o.id}\n${o.items}\nZone: ${o.zone} · Total ${egp(o.total)}`,[{label:"▶ "+flow[0],once:false,onClick:async(c,btn)=>{ await u.run(async()=>{ await u.head("Telegram Trigger","kitchen button"); await u.log("Parse Kitchen Button",flow[i]); await u.log("Find Order",o.id); await u.log("Check Transition",(o.status)+" → "+flow[i].toLowerCase(),"ok"); await u.log("Answer Kitchen Button"); o.status=flow[i].toLowerCase(); await u.log("Update Order Status",o.status); u.sheet("Orders",["order_id","items","zone","total","status"],u.state.orders,true); await u.log("Update Kitchen Message"); await u.log("Customer Update","WhatsApp","ok");
      const msg={accept:"👨‍🍳 The kitchen accepted your order.",preparing:"🔥 Your food is being prepared.","out for delivery":"🛵 Your order is on its way!",delivered:"✅ Delivered. Enjoy your meal!"}[o.status]; u.bot(msg+" ("+o.id+")"); i++; if(i<flow.length) btn.textContent="▶ "+flow[i]; else { btn.disabled=true; u.note(c,"Delivered ✓"); } }); }}]); }

/* Bayt Leads */
D["bayt-leads"]={title:"Become a lead",intro:"Message on WhatsApp like a home buyer. AI extracts what you want, scores you, matches listings and alerts sales. Missing details? It asks.",
 left:"chat",phone:"Bayt Leads",staffBot:"Bayt Sales Bot",chips:["Looking for an apartment in New Cairo, budget 4 million, buying now","Villa in Sheikh Zayed within 3 months, 12M","I want something in Obour","Apartment 6th of October 2.5 million, just browsing"],
 init(u){ u.state.list=[{id:"U-101",area:"New Cairo",type:"apartment",price:3800000,beds:3},{id:"U-102",area:"New Cairo",type:"apartment",price:4500000,beds:3},{id:"U-103",area:"New Cairo",type:"villa",price:14000000,beds:5},{id:"U-201",area:"Sheikh Zayed",type:"villa",price:11500000,beds:4},{id:"U-202",area:"Sheikh Zayed",type:"apartment",price:3200000,beds:2},{id:"U-301",area:"6th of October",type:"apartment",price:2400000,beds:2},{id:"U-401",area:"Obour",type:"apartment",price:1900000,beds:3},{id:"U-501",area:"New Capital",type:"apartment",price:5200000,beds:3}];
   u.state.leads=[]; u.sheet("Listings",["id","area","type","price","beds"],u.state.list.map(l=>({...l,price:egp(l.price)}))); u.sheet("Leads",["lead_id","area","type","budget","timeline","score","status"],u.state.leads);
   u.bot("Hi! Tell us what you're looking for: area, apartment or villa, budget, and when you want to buy."); },
 async onSend(t,u){ await u.head("WhatsApp Trigger","new message"); await u.log("Customer Messages Only"); await u.log("Prepare AI Extraction"); await u.log("AI Extract Lead","area, type, budget, timeline","",380);
   const low=t.toLowerCase(); const areas=["New Cairo","Sheikh Zayed","6th of October","Nasr City","New Capital","Obour"]; const P=u.state.pending||{};
   const area=areas.find(a=>low.includes(a.toLowerCase().replace("6th of ","")))||P.area; const type=/villa/.test(low)?"villa":/apartment|flat|شقة/.test(low)?"apartment":P.type;
   let bm=low.match(/(\d+(?:\.\d+)?)\s*(m\b|million|مليون)/)||low.match(/(\d+(?:\.\d+)?)m\b/); let budget=bm?Math.round(parseFloat(bm[1])*1e6):P.budget;
   const timeline=/now|immediately|asap/.test(low)?"now":/3 months/.test(low)?"within 3 months":/6 months/.test(low)?"within 6 months":/browsing/.test(low)?"just browsing":P.timeline;
   await u.log("Read AI Fields",[area,type,budget&&egp(budget),timeline].filter(Boolean).join(" · ")||"nothing found");
   const missing=[!area&&"area",!type&&"apartment or villa",!budget&&"budget",!timeline&&"when you want to buy"].filter(Boolean);
   await u.log("Validate Lead",missing.length?"missing: "+missing.join(", "):"complete",missing.length?"warn":"ok");
   if(missing.length){ u.state.pending={area,type,budget,timeline}; await u.log("Valid Lead?","false"); await u.log("Save for Review"); await u.log("Ask for Missing Details?","true"); await u.log("Ask Missing Details","WhatsApp"); u.bot("Thanks! To match you with the right homes, could you tell me your "+missing.join(", ")+"?"); return; }
   u.state.pending=null; await u.log("Valid Lead?","true","ok"); await u.log("Find Existing Lead"); await u.log("Already Known?","no"); await u.log("Read Listings",u.state.list.length+" units");
   const score=Math.min(100,(timeline==="now"?45:timeline==="within 3 months"?35:timeline==="within 6 months"?20:5)+(budget>=3e6?30:budget>=2e6?20:10)+25);
   const matches=u.state.list.filter(l=>l.area===area&&l.type===type&&l.price<=budget*1.15).sort((a,b)=>Math.abs(a.price-budget)-Math.abs(b.price-budget)).slice(0,3);
   await u.log("Score & Match",`score ${score}/100 · ${matches.length} match${matches.length===1?"":"es"}`,"ok");
   const lead={lead_id:rid("L"),area,type,budget:egp(budget),timeline,score,status:matches.length?"matched":"no match"}; u.state.leads.push(lead); u.sheet("Leads",["lead_id","area","type","budget","timeline","score","status"],u.state.leads,true);
   await u.log("Save Lead",lead.lead_id); await u.log("Came from WhatsApp?","true");
   if(matches.length){ await u.log("Send Matches on WhatsApp","",""); u.bot("Here are your best matches 🏡\n"+matches.map(m=>`• ${m.id} · ${m.beds}-bed ${m.type} in ${m.area} · ${egp(m.price)}`).join("\n")+"\nReply with a unit ID to book a viewing."); }
   else u.bot("We don't have a match right now in "+area+". A sales advisor will contact you with new listings.");
   await u.log("Alert Sales","Telegram","ok"); u.staff(`🔥 New ${score>=70?"hot ":""}lead ${lead.lead_id} (${score}/100)\n${type} in ${area} · ${egp(budget)} · ${timeline}\nMatches: ${matches.map(m=>m.id).join(", ")||"none"}`,[{label:"📅 Book viewing",onClick:async c=>{ await u.run(async()=>{ await u.head("Book Viewing Form","sales team"); await u.log("Validate Viewing Request"); await u.log("Find Lead",lead.lead_id); await u.log("Find Unit",matches[0]?.id||"—"); await u.log("Check Lead and Unit","ok","ok"); await u.log("Create Calendar Event","tomorrow 12:00"); await u.log("Save Viewing"); await u.log("Mark Lead Viewing Booked"); lead.status="viewing booked"; u.sheet("Leads",["lead_id","area","type","budget","timeline","score","status"],u.state.leads,true); u.note(c,"Viewing booked for tomorrow 12:00 ✓"); u.bot("📅 Your viewing of "+(matches[0]?.id||"the unit")+" is booked for tomorrow at 12:00. See you there!"); }); }}]); }};

/* Nile Smile Lite */
const CLINIC={hours:"Saturday to Thursday, 10:00 to 21:00. Closed on Friday.",address:"14 El-Nozha St, Heliopolis, Cairo.",prices:"Check-up 300 EGP · Cleaning 600 EGP · Filling from 900 EGP · Whitening 3,500 EGP."};
function clinicAnswer(low){ if(/hour|open|close|مواعيد|امتى/.test(low)) return ["Opening hours",CLINIC.hours]; if(/where|address|location|عنوان|فين/.test(low)) return ["Location",CLINIC.address]; if(/price|cost|how much|بكام|سعر/.test(low)) return ["Prices",CLINIC.prices]; return null; }
function clinicBooking(low){ const svc=["cleaning","check-up","checkup","filling","whitening"].find(s=>low.includes(s)); const day=/tomorrow|بكرة/.test(low)?"tomorrow":/friday|الجمعة/.test(low)?"Friday":/saturday/.test(low)?"Saturday":null; const tm=low.match(/(\d{1,2})(?::(\d\d))?\s*(am|pm)?/); let h=tm?+tm[1]:null; if(h!=null&&tm[3]==="pm"&&h<12) h+=12; return {svc:svc&&svc.replace("checkup","check-up"),day,h}; }
D["nile-smile-lite"]={title:"Chat with the clinic",intro:"Ask the clinic anything, book an appointment, or report a problem. Problems open a ticket for staff, who reply with /reply.",
 left:"chat",phone:"Nile Smile Dental",staffBot:"Nile Smile Staff",chips:["What are your opening hours?","How much is a cleaning?","Book a cleaning tomorrow at 5 pm","Book a check-up Friday 11 am","My tooth hurts a lot since yesterday"],
 init(u){ u.state.appts=[]; u.state.tickets=[]; u.sheet("Appointments",["id","service","day","time","status"],u.state.appts); u.sheet("Tickets",["ticket","message","status"],u.state.tickets); u.bot("Hello! I'm the Nile Smile assistant 🦷 Ask about hours, prices or location, or book an appointment."); },
 async onSend(t,u){ const low=t.toLowerCase(); await u.head("WhatsApp Trigger","message"); await u.log("Customer Messages Only"); await u.log("Normalize WhatsApp"); await u.log("Incoming Message"); await u.log("Log Incoming"); await u.log("AI Agent","deciding which tool to use","",380);
   const a=clinicAnswer(low); const b=/book|appointment|حجز|احجز/.test(low)?clinicBooking(low):null;
   if(b){ await u.log("Check Booking Rules",`${b.svc||"?"} · ${b.day||"?"} · ${b.h!=null?b.h+":00":"?"}`);
     const prob=!b.svc?"which service you'd like (check-up, cleaning, filling or whitening)":!b.day?"which day":b.day==="Friday"?"FRIDAY":b.h==null?"what time":(b.h<10||b.h>=21)?"HOURS":null;
     if(prob==="FRIDAY"){ await u.log("Check Booking Rules","clinic closed on Friday","warn"); u.bot("We're closed on Fridays. Would Saturday at the same time work?"); return; }
     if(prob==="HOURS"){ await u.log("Check Booking Rules","outside 10:00–21:00","warn"); u.bot("We're open 10:00 to 21:00. Which time in that window suits you?"); return; }
     if(prob){ u.bot("Happy to book you in! Could you tell me "+prob+"?"); return; }
     await u.log("Read Appointments"); const taken=u.state.appts.some(x=>x.day===b.day&&x.time===b.h+":00"); if(taken){ await u.log("Check Booking Rules","slot taken","warn"); u.bot(`${b.h}:00 ${b.day} is taken. ${b.h+1}:00 is free. Shall I book that?`); return; }
     const ap={id:rid("A"),service:b.svc,day:b.day,time:b.h+":00",status:"booked"}; u.state.appts.push(ap); await u.log("Save Appointment",ap.id,"ok"); u.sheet("Appointments",["id","service","day","time","status"],u.state.appts,true); await u.log("Reply Channel","WhatsApp"); await u.log("Send WhatsApp Reply","","ok"); await u.log("Log Reply");
     u.bot(`✅ Booked: ${b.svc} on ${b.day} at ${b.h}:00 (${ap.id}). Address: ${CLINIC.address}`); return; }
   if(a){ await u.log("Clinic Knowledge Base",`retrieved: ${a[0]}`,"ok"); await u.log("Send WhatsApp Reply","","ok"); await u.log("Log Reply"); u.bot(a[1]); return; }
   if(/hurt|pain|bleed|swollen|broken|complain|بيوجع|الم|شكوى/.test(low)){ const tk={ticket:rid("TK"),message:t,status:"open"}; u.state.tickets.push(tk); await u.log("Create Ticket",tk.ticket,"warn"); u.sheet("Tickets",["ticket","message","status"],u.state.tickets,true); await u.log("Alert Staff","Telegram group");
     u.staff(`🆘 Ticket ${tk.ticket}\nPatient (WhatsApp): “${t}”`,[{label:"↩ /reply "+tk.ticket+" …",onClick:async c=>{ await u.run(async()=>{ await u.head("Telegram Trigger","staff command"); await u.log("Parse Staff Reply","/reply "+tk.ticket); await u.log("Valid Command?","true"); await u.log("Find Ticket",tk.ticket); await u.log("Ticket Found?","true"); await u.log("Customer Channel","WhatsApp"); await u.log("Send Staff Reply (WhatsApp)","","ok"); await u.log("Mark Ticket Answered"); tk.status="answered"; u.sheet("Tickets",["ticket","message","status"],u.state.tickets,true); await u.log("Confirm to Staff"); u.note(c,"Replied ✓"); u.bot("Dr. Mona here 👩‍⚕️ Sorry you're in pain. Please come in today at 6 pm, we've reserved an emergency slot for you."); }); }}]);
     await u.log("Send WhatsApp Reply"); u.bot("I'm sorry to hear that. I've passed this to our dental team and someone will reply very shortly."); return; }
   await u.log("Fallback Reply"); u.bot("I can help with hours, prices, our location, or booking an appointment. What would you like?"); }};

/* Nile Smile Hub */
D["nile-smile-hub"]={title:"One inbox, four channels",intro:"Pick a channel and write as a patient. The AI brain triages each message; tickets go to the staff desk, where Take and Resolve hand the patient over and back.",
 left:"chat",phone:"Nile Smile Dental",staffBot:"Nile Smile Staff Desk",chips:["What time do you open?","Book whitening tomorrow 7 pm","I was charged twice for my visit","Thanks, you're great!","Is the parking free?"],
 channels:["WhatsApp","Telegram","Messenger","Instagram"],
 init(u){ u.state.ch="WhatsApp"; u.state.human=false; u.state.appts=[]; u.state.tickets=[]; u.sheet("Conversations",["time","channel","intent","message"],[]); u.sheet("Appointments",["id","service","day","time"],u.state.appts); u.sheet("Tickets",["ticket","channel","status","taken_by"],u.state.tickets); u.bot("Welcome to Nile Smile Dental 🦷 How can we help today?"); },
 async onSend(t,u){ const low=t.toLowerCase(); const ch=u.state.ch;
   await u.head({WhatsApp:"WhatsApp Trigger",Telegram:"Telegram Trigger",Messenger:"Incoming Events (POST)",Instagram:"Incoming Events (POST)"}[ch],ch); if(ch==="Messenger"||ch==="Instagram"){ await u.log("Acknowledge Fast (200)"); await u.log("Extract Messenger & Instagram"); } else await u.log(ch==="WhatsApp"?"Extract WhatsApp Messages":"Classify Update");
   await u.log("Run Core AI Brain"); await u.log("Validate Input"); await u.log("Find Customer"); await u.log("Load History"); await u.log("Build Context");
   if(u.state.human){ await u.log("Human Mode?","true · ticket open","warn"); await u.log("Forward to Staff"); u.staff(`💬 ${ch} patient (ticket ${u.state.human}): “${t}”`); await u.log("Result: Forwarded","","ok"); return; }
   await u.log("Human Mode?","false"); await u.log("Is Text?","true");
   const intent=/book|appointment|احجز/.test(low)?"booking":/charged|refund|complain|wrong|problem|hurt|pain/.test(low)?"problem":clinicAnswer(low)?"question":/thank|great|hi\b|hello/.test(low)?"small_talk":"question";
   await u.log("AI Triage","Groq → "+intent,"",380); await u.log("Validate AI Output","ok"); await u.log("Log Inbound"); await u.log("Route by Intent",intent,"ok");
   const conv=u.state.conv=(u.state.conv||[]); conv.push({time:now(),channel:ch,intent,message:t}); u.sheet("Conversations",["time","channel","intent","message"],conv,true);
   if(intent==="question"){ await u.log("Search Knowledge Base"); await u.log("Gemini Embeddings (Search)"); await u.log("Build KB Context"); const a=clinicAnswer(low); if(a){ await u.log("Answer from Knowledge Base",a[0],"ok"); await u.log("Validate Answer"); u.bot(a[1]); } else { await u.log("Answer from Knowledge Base","not in the clinic documents","warn"); await u.log("Answer Fallback"); u.bot("I don't have that in our clinic information. I'll ask the team and get back to you."); } }
   else if(intent==="booking"){ const b=clinicBooking(low); await u.log("Validate Booking",`${b.svc||"?"} · ${b.day||"?"} · ${b.h!=null?b.h+":00":"?"}`); if(!b.svc||!b.day||b.h==null){ await u.log("Booking Ready?","false"); u.bot("Sure! Which service, which day and what time would you like?"); }
     else { await u.log("Booking Ready?","true"); await u.log("Check Slot"); await u.log("Find Free Slot"); await u.log("Slot Free?","true","ok"); const ap={id:rid("A"),service:b.svc,day:b.day,time:b.h+":00"}; u.state.appts.push(ap); await u.log("Prepare Appointment"); await u.log("Save Appointment",ap.id); u.sheet("Appointments",["id","service","day","time"],u.state.appts,true); await u.log("Booking Confirmation"); u.bot(`✅ You're booked for ${b.svc} ${b.day} at ${b.h}:00 (${ap.id}).`); } }
   else if(intent==="problem"){ const tk={ticket:rid("TK"),channel:ch,status:"open",taken_by:""}; u.state.tickets.push(tk); await u.log("Create Ticket",tk.ticket,"warn"); await u.log("Save Ticket"); u.sheet("Tickets",["ticket","channel","status","taken_by"],u.state.tickets,true); await u.log("Alert Staff","via Delivery & Staff Desk"); await u.log("Ticket Reply");
     u.bot("I'm sorry about that. I've opened ticket "+tk.ticket+" and a team member will take it from here.");
     const card=u.staff(`🎫 ${tk.ticket} · ${ch}\n“${t}”`,[{label:"🙋 Take",onClick:async c=>{ await u.run(async()=>{ await u.head("Staff Button Click","Take"); await u.log("Parse Button"); await u.log("Get Ticket",tk.ticket); await u.log("Apply Button Rules","open → taken","ok"); await u.log("Mark Taken"); tk.status="taken"; tk.taken_by="Sara"; u.state.human=tk.ticket; u.sheet("Tickets",["ticket","channel","status","taken_by"],u.state.tickets,true); await u.log("Show Taken in Group"); await u.log("Tell Customer: Taken","via "+ch,"ok"); u.note(c,"Taken by Sara"); u.bot("Sara from the clinic here 👋 I'm looking into your billing now.");
        u.staff(`Ticket ${tk.ticket} is yours. Patient messages now come straight here.`,[{label:"✅ Resolve",onClick:async c2=>{ await u.run(async()=>{ await u.head("Staff Button Click","Resolve"); await u.log("Apply Button Rules","taken → resolved","ok"); await u.log("Mark Resolved"); tk.status="resolved"; u.state.human=false; u.sheet("Tickets",["ticket","channel","status","taken_by"],u.state.tickets,true); await u.log("Release Customer to AI"); await u.log("Show Resolved in Group"); await u.log("Tell Customer: Resolved","","ok"); u.note(c2,"Resolved ✓"); u.bot("Your request is resolved and the duplicate charge refunded. The assistant is back if you need anything else 🦷"); }); }}]); }); }}]); }
   else { await u.log("Small Talk Reply","Groq"); u.bot("Thank you, that's kind! 😊 Anything else we can help with?"); }
   await u.log("Prepare Reply"); await u.log("Send Reply","via "+ch,"ok"); await u.log("Log Outbound"); }};

/* HR Radar */
D["hr-radar"]={title:"Apply for a job",intro:"Fill the real application form. Pick one of the sample CVs: it's scored against the job, and you see the email you'd receive.",
 left:"form",staffBot:"HR Radar",
 form:`<label>Full name<input name="name" value="Youssef Kamal"></label><label>Email<input name="email" value="youssef.kamal@example.com"></label><label>Mobile<input name="mobile" value="01012345678"></label>
 <label>Position<select name="pos"><option>J-01 · Junior Automation Engineer</option><option>J-02 · Data Analyst</option></select></label><label>Years of experience<input name="yrs" type="number" value="2" min="0"></label>
 <label>CV (sample)<select name="cv"><option value="auto">Automation engineer CV</option><option value="data">Data analyst CV</option><option value="none">Unrelated CV</option><option value="scan">Scanned image PDF</option></select></label>
 <label style="flex-direction:row;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="ok" checked> I agree that my data is used for this application only</label><button class="btn" type="submit">Apply now</button>`,
 init(u){ u.state.apps=[]; u.state.cal={"Sun 10:00":"busy","Sun 12:00":"free","Mon 11:00":"free"}; u.sheet("Applicants",["name","position","score","decision","interview"],u.state.apps); u.sheet("Calendar",["slot","status"],Object.entries(u.state.cal).map(([k,v])=>({slot:k,status:v}))); },
 async onSubmit(f,u){ const v=Object.fromEntries(new FormData(f)); v.ok=f.ok.checked;
   await u.head("Application Form","submitted"); await u.log("Validate Application");
   const err=[]; if(v.name.trim().split(/\s+/).length<2) err.push("full name"); if(!/^[^@\s]+@[^@\s]+\.\w{2,}$/.test(v.email)) err.push("valid email"); if(!/^01[0125]\d{8}$/.test(v.mobile)) err.push("Egyptian mobile (01xxxxxxxxx)"); if(!v.ok) err.push("consent");
   if(err.length){ await u.log("Application Valid?","false","bad"); await u.log("Email: Please Fix"); u.email(v.email||"applicant","Please fix your application","Hi,\n\nWe couldn't accept your application yet. Please check: "+err.join(", ")+".\n\nHR Radar"); u.out("Please fix: "+err.join(", ")); return; }
   await u.log("Application Valid?","true","ok"); await u.log("Find Earlier Application"); if(u.state.apps.some(a=>a.email===v.email&&a.position===v.pos)){ await u.log("New Applicant?","false","warn"); await u.log("Email: Already Received"); u.out("We already have your application for this role."); return; }
   await u.log("New Applicant?","true"); await u.log("Restore CV File");
   if(v.cv==="scan"){ await u.log("Extract CV Text","no text layer","warn"); await u.log("Email: Send a Text PDF"); u.email(v.email,"Please send a text PDF","Hi "+v.name.split(" ")[0]+",\n\nYour CV looks like a scanned image, so we couldn't read it. Please export it as a text PDF and apply again.\n\nHR Radar"); u.out("CV unreadable: please send a text PDF."); return; }
   await u.log("Extract CV Text","ok"); await u.log("Read Job",v.pos.slice(0,4)); await u.log("Prepare Fair Scoring","name, gender and photo removed");
   const fit={"J-01":{auto:86,data:52,none:22},"J-02":{auto:48,data:84,none:20}}[v.pos.slice(0,4)][v.cv]+Math.min(6,+v.yrs);
   await u.log("AI Score CV",fit+"/100","",420); await u.log("Validate Score","ok"); const a={name:v.name,email:v.email,position:v.pos,score:fit,decision:"",interview:""}; u.state.apps.push(a); await u.log("Save Applicant");
   const dec=fit>=70?"interview":fit>=50?"on hold":"reject"; await u.log("Route Decision",dec,dec==="interview"?"ok":dec==="on hold"?"warn":"");
   if(dec==="interview"){ await u.log("Propose Slots"); await u.log("Check Calendar"); const slot=Object.keys(u.state.cal).find(k=>u.state.cal[k]==="free"); await u.log("Pick First Free Slot",slot); u.state.cal[slot]="booked"; u.sheet("Calendar",["slot","status"],Object.entries(u.state.cal).map(([k,s])=>({slot:k,status:s}))); await u.log("Create Interview Event"); await u.log("Record Interview"); a.decision="interview"; a.interview=slot; await u.log("Email: Interview Invite","","ok");
     u.email(v.email,"Interview invitation · "+v.pos,"Hi "+v.name.split(" ")[0]+",\n\nThanks for applying! Your profile scored "+fit+"/100 for "+v.pos+".\nWe've booked an online interview on "+slot+" (30 minutes). The calendar invite is on its way.\n\nHR Radar"); u.out("🎉 Interview booked: "+slot); }
   else if(dec==="on hold"){ a.decision="on hold"; await u.log("Tell HR: On Hold"); u.staff(`⏸ On hold: ${v.name} · ${v.pos} · ${fit}/100\nWorth a human look.`,[{label:"Invite anyway",onClick:async c=>{u.note(c,"HR invited the candidate ✓")}},{label:"Decline",onClick:async c=>{u.note(c,"Declined")}}]); u.out("Your application is with our HR team for review."); }
   else { a.decision="rejected"; await u.log("Email: Polite Rejection"); u.email(v.email,"Your application · "+v.pos,"Hi "+v.name.split(" ")[0]+",\n\nThank you for applying. We've decided to move forward with candidates closer to this role's requirements. We'll keep your CV for future openings.\n\nHR Radar"); u.out("Thanks for applying. Check your email."); }
   u.sheet("Applicants",["name","position","score","decision","interview"],u.state.apps,true); }};

/* Seat */
D["seat"]={title:"Register for the workshop",intro:"Register with an InstaPay reference and a payment screenshot. AI reads the screenshot. Then check people in at the door bot with their ticket ID.",
 left:"form",staffBot:"Seat Door Bot",
 form:`<label>Full name<input name="name" value="Laila Mahmoud"></label><label>Email<input name="email" value="laila@example.com"></label><label>Mobile<input name="mobile" value="01112345678"></label>
 <label>Event<select name="ev"><option>E-01 · n8n Automation Workshop (500 EGP)</option></select></label><label>InstaPay reference number<input name="ref" value="IP-778201"></label>
 <label>Payment screenshot (sample)<select name="shot"><option value="ok">Clear: 500 EGP, ref IP-778201</option><option value="wrong">Clear: 300 EGP</option><option value="blur">Blurry photo</option></select></label><button class="btn" type="submit">Register</button>
 <hr style="border:0;border-top:1px dashed var(--line);width:100%"><label>Door check-in: ticket ID<input name="tk" placeholder="SEAT-XXXX"></label><button class="btn ghost" type="button" data-act="door">Send to door bot</button>`,
 init(u){ u.state.cap=3; u.state.regs=[{ticket:"SEAT-A1B2",name:"Omar Adel",status:"confirmed",checked_in:"no"},{ticket:"SEAT-C3D4",name:"Mai Samir",status:"confirmed",checked_in:"no"}]; u.sheet("Registrations",["ticket","name","status","checked_in"],u.state.regs); u.sheet("Events",["event","capacity","price"],[{event:"E-01 · n8n Automation Workshop",capacity:3,price:"500 EGP"}]); u.staff("Door bot ready. Staff send a ticket ID to check people in."); },
 async onSubmit(f,u){ const v=Object.fromEntries(new FormData(f)); await u.head("Registration Form","submitted"); await u.log("Validate Registration");
   if(!/^01[0125]\d{8}$/.test(v.mobile)||!/IP-\d{6}/.test(v.ref)){ await u.log("Form OK?","false","bad"); await u.log("Fix Form Page"); u.out("Please check your mobile number and InstaPay reference (IP-123456)."); return; }
   await u.log("Form OK?","true"); await u.log("Read Event","capacity "+u.state.cap); await u.log("Read Event Registrations"); await u.log("Check Event Rules","no duplicate email"); await u.log("Event Rules OK?","true");
   await u.log("AI Read Payment",{ok:"500 EGP · ref IP-778201",wrong:"300 EGP",blur:"unreadable"}[v.shot],"",420);
   const pay=v.shot==="ok"&&v.ref==="IP-778201"?"paid":v.shot==="blur"?"unclear":"mismatch"; await u.log("Check Payment",pay,pay==="paid"?"ok":"warn");
   if(pay!=="paid"){ await u.log("Send to Review"); await u.log("Tell Organizer"); u.staff(`🔎 Payment check needed: ${v.name}\nRef ${v.ref} · screenshot ${pay}`,[{label:"✅ Accept",onClick:async c=>{u.note(c,"Accepted by organizer")}},{label:"❌ Reject",onClick:async c=>{u.note(c,"Rejected")}}]); await u.log("Checking Payment Page"); u.out("We're checking your payment. You'll get an email within a few hours."); return; }
   const confirmed=u.state.regs.filter(r=>r.status==="confirmed").length; const tk="SEAT-"+Math.random().toString(36).slice(2,6).toUpperCase();
   await u.log("Save Registration",tk); await u.log("Route Status",confirmed<u.state.cap?"confirmed":"waitlist");
   if(confirmed<u.state.cap){ u.state.regs.push({ticket:tk,name:v.name,status:"confirmed",checked_in:"no"}); await u.log("Email: Ticket","","ok"); u.email(v.email,"Your ticket: n8n Automation Workshop","Hi "+v.name.split(" ")[0]+",\n\nYou're in! 🎟\nTicket: "+tk+"\nShow this ID (or its QR code) at the door.\n\nSeat"); await u.log("You're In Page"); u.out("🎟 You're in! Ticket "+tk+". Try it at the door bot below."); f.tk.value=tk; }
   else { u.state.regs.push({ticket:tk,name:v.name,status:"waitlist",checked_in:"no"}); await u.log("Email: Waitlist"); await u.log("Waitlist Page"); u.out("The workshop is full. You're on the waitlist and we'll email you if a seat opens."); }
   u.sheet("Registrations",["ticket","name","status","checked_in"],u.state.regs,true); },
 async onAction(act,f,u){ if(act!=="door") return; const id=f.tk.value.trim().toUpperCase(); await u.head("Door Bot","Telegram: "+id); await u.log("Read Token"); await u.log("Find Ticket",id); const r=u.state.regs.find(x=>x.ticket===id);
   const res=!r?"invalid":r.status!=="confirmed"?"waitlist":r.checked_in==="yes"?"already":"ok"; await u.log("Check Ticket",res,res==="ok"?"ok":"bad"); await u.log("Valid Ticket?",String(res==="ok"));
   if(res==="ok"){ r.checked_in="yes"; await u.log("Record Check-in"); u.sheet("Registrations",["ticket","name","status","checked_in"],u.state.regs,true); }
   await u.log("Reply to Door"); u.staff({ok:`✅ ${id} · ${r?.name} · welcome in!`,already:`⚠️ ${id} already checked in.`,waitlist:`⛔ ${id} is on the waitlist, not confirmed.`,invalid:`❌ ${id} not found.`}[res]); }};

/* Hader */
D["hader"]={title:"Take attendance",intro:"Submit a class's attendance as a teacher. IDs are checked against the class list. Parents of absent and late students are messaged, and if WhatsApp fails it falls back to SMS.",
 left:"form",staffBot:"Hader",
 form:`<label>Class<select name="cls"><option>G5-A</option><option>G5-B</option></select></label><label>Period<select name="per"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label>Date<input name="date" type="date"></label>
 <label>Absent student IDs<input name="abs" value="S001, S004" placeholder="S001, S004"></label><label>Late student IDs<input name="late" value="S002" placeholder="S002"></label><label>Teacher name<input name="teacher" value="Ms. Hoda"></label><button class="btn" type="submit">Submit attendance</button>`,
 init(u,f){ const today=new Date().toISOString().slice(0,10); if(f) f.date.value=today; u.state.stu={"G5-A":[["S001","Ali Hassan","WA ok"],["S002","Nour Adel","WA ok"],["S003","Omar Fathy","WA ok"],["S004","Salma Tarek","no WhatsApp"],["S005","Youssef Ali","WA ok"]],"G5-B":[["S101","Mariam Said","WA ok"],["S102","Karim Nabil","WA ok"],["S103","Hana Mostafa","WA ok"]]}; u.state.att=[]; u.state.subs=new Set();
   u.sheet("Students",["id","name","class","parent_channel"],Object.entries(u.state.stu).flatMap(([c,l])=>l.map(s=>({id:s[0],name:s[1],class:c,parent_channel:s[2]})))); u.sheet("Attendance",["date","class","period","id","status","parent_notified"],u.state.att); },
 async onSubmit(f,u){ const v=Object.fromEntries(new FormData(f)); const ids=s=>s.toUpperCase().split(/[\s,]+/).filter(Boolean);
   await u.head("Attendance Form","submitted"); await u.log("Validate Submission"); const abs=ids(v.abs), late=ids(v.late);
   if(abs.some(x=>late.includes(x))||!v.teacher.trim()){ await u.log("Submission OK?","false","bad"); await u.log("Fix and Resubmit Page"); u.out("A student can't be both absent and late, and the teacher name is required."); return; }
   await u.log("Submission OK?","true"); await u.log("Find Earlier Submission"); const key=v.date+v.cls+v.per; if(u.state.subs.has(key)){ await u.log("First Submission?","false","warn"); await u.log("Already Submitted Page"); u.out("This class and period was already submitted today."); return; }
   await u.log("First Submission?","true"); await u.log("Read Class Students",v.cls); const roster=u.state.stu[v.cls]; const bad=[...abs,...late].filter(x=>!roster.some(s=>s[0]===x));
   await u.log("Build Records",roster.length+" students"); if(bad.length){ await u.log("IDs Valid?","not in "+v.cls+": "+bad.join(", "),"bad"); await u.log("Fix and Resubmit Page"); u.out("These IDs are not in "+v.cls+": "+bad.join(", ")); return; }
   await u.log("IDs Valid?","true","ok"); u.state.subs.add(key);
   const rows=roster.map(s=>({date:v.date,class:v.cls,period:v.per,id:s[0],status:abs.includes(s[0])?"absent":late.includes(s[0])?"late":"present",parent_notified:""})); u.state.att.push(...rows); await u.log("Save Attendance",rows.length+" rows"); u.sheet("Attendance",["date","class","period","id","status","parent_notified"],u.state.att,true); await u.log("Submission Saved Page"); u.out("✅ Saved: "+rows.length+" students, "+abs.length+" absent, "+late.length+" late.");
   await u.log("Absent or Late Only",(abs.length+late.length)+" parents");
   for(const r of rows.filter(r=>r.status!=="present")){ const s=roster.find(x=>x[0]===r.id); const msg=`Dear parent, ${s[1]} was ${r.status} in period ${v.per} today (${v.date}). Hader · ${v.cls}`;
     if(s[2]==="WA ok"){ await u.log("Message Parent on WhatsApp",s[1],"ok"); r.parent_notified="WhatsApp"; u.bot("📱 WhatsApp to "+s[1]+"'s parent:\n"+msg); }
     else { await u.log("Message Parent on WhatsApp","failed: number not on WhatsApp","warn"); await u.log("Fallback SMS",s[1],"ok"); r.parent_notified="SMS"; u.bot("✉ SMS to "+s[1]+"'s parent:\n"+msg); }
     await u.log("Mark Parent Notified"); }
   u.sheet("Attendance",["date","class","period","id","status","parent_notified"],u.state.att,true); }};
D["hader"].phoneTitle="Parents' phones";

/* Fatora Flow */
D["fatora-flow"]={title:"Send an invoice",intro:"Send a sample invoice by email or Telegram. AI reads it, the rules check it, and finance approves with one tap.",
 left:"form",staffBot:"Fatora Finance",
 form:`<label>Arrives by<select name="via"><option>Email attachment (Gmail)</option><option>File on Telegram</option></select></label>
 <label>Invoice (sample)<select name="inv"><option value="a">Nile Supplies · INV-0418 · 14,136 EGP</option><option value="b">Delta Print · INV-2210 · 62,700 EGP (over vendor limit)</option><option value="c">Nile Supplies · INV-0418 again (duplicate)</option><option value="d">Blurry photo of a receipt</option></select></label><button class="btn" type="submit">Send invoice</button>`,
 init(u){ u.state.vendors={"Nile Supplies":{limit:50000},"Delta Print":{limit:40000}}; u.state.invs=[]; u.sheet("Vendors",["vendor","approval_limit"],Object.entries(u.state.vendors).map(([k,v])=>({vendor:k,approval_limit:egp(v.limit)}))); u.sheet("Invoices",["number","vendor","total","status","decided_by"],u.state.invs); },
 async onSubmit(f,u){ const v=Object.fromEntries(new FormData(f)); const S={a:{vendor:"Nile Supplies",number:"INV-0418",sub:12400,vat:1736},b:{vendor:"Delta Print",number:"INV-2210",sub:55000,vat:7700},c:{vendor:"Nile Supplies",number:"INV-0418",sub:12400,vat:1736},d:null}[v.inv];
   if(v.via.startsWith("Email")){ await u.head("Gmail Trigger","new email with PDF"); await u.log("One Item per Attachment"); } else { await u.head("Telegram Trigger","file"); await u.log("Route Update"); await u.log("Download Telegram File"); await u.log("Tag Telegram File"); }
   await u.log("Prepare Extraction"); await u.log("AI Read Invoice",S?`${S.vendor} · ${S.number} · ${egp(S.sub+S.vat)}`:"low confidence","",420);
   if(!S){ await u.log("Validate Invoice","fields missing","warn"); await u.log("Send to Review Queue"); await u.log("Tell Finance: Review Needed"); u.staff("🔎 Review needed: an invoice couldn't be read clearly. Please check it by hand."); u.out("Sent to the finance review queue."); return; }
   await u.log("Validate Invoice","totals add up (subtotal + 14% VAT)","ok"); await u.log("Read Vendors"); await u.log("Find Same Invoice Number");
   if(u.state.invs.some(i=>i.number===S.number&&i.vendor===S.vendor)){ await u.log("Final Checks","duplicate invoice number","bad"); await u.log("Send to Review Queue"); u.staff(`⚠️ Duplicate: ${S.vendor} ${S.number} was already received. Not sent for approval.`); u.out("Duplicate invoice: stopped before approval."); return; }
   const total=S.sub+S.vat, over=total>u.state.vendors[S.vendor].limit; await u.log("Final Checks",over?"over vendor limit":"ok",over?"warn":"ok");
   const inv={number:S.number,vendor:S.vendor,total:egp(total),status:"pending approval",decided_by:""}; u.state.invs.push(inv); await u.log("Save Invoice"); u.sheet("Invoices",["number","vendor","total","status","decided_by"],u.state.invs,true); await u.log("Ready for Approval?","true"); await u.log("Ask for Approval","Telegram card");
   u.staff(`🧾 ${S.vendor} · ${S.number}\nSubtotal ${egp(S.sub)} + VAT ${egp(S.vat)} = ${egp(total)}${over?"\n⚠️ Above the "+egp(u.state.vendors[S.vendor].limit)+" vendor limit: manager approval required":""}`,[["✅ Approve","approved"],["❌ Reject","rejected"]].map(([l,s])=>({label:l,onClick:async c=>{ await u.run(async()=>{ await u.head("Telegram Trigger","button"); await u.log("Parse Decision",s); await u.log("Find Invoice",S.number); await u.log("Find Vendor Limit"); await u.log("Apply Approval Rules",over&&s==="approved"?"limit exceeded: needs manager":"allowed",over&&s==="approved"?"warn":"ok"); await u.log("Answer Button");
     if(over&&s==="approved"){ await u.log("Decision Valid?","false","bad"); u.toast("Only the finance manager can approve above the limit."); c.querySelectorAll("button").forEach(b=>b.disabled=false); return; }
     await u.log("Decision Valid?","true"); inv.status=s; inv.decided_by="Hany (finance)"; await u.log("Record Decision"); u.sheet("Invoices",["number","vendor","total","status","decided_by"],u.state.invs,true); await u.log("Update Approval Message","","ok"); u.note(c,(s==="approved"?"✅ Approved":"❌ Rejected")+" by Hany"); }); }})));
   await u.log("Save Approval Message"); u.out("Invoice read and sent to finance for approval."); }};

/* Post Pilot */
D["post-pilot"]={title:"Run the content pipeline",intro:"Pick topics from the content queue and let AI draft them. Approve or send back on Telegram, then publish what's due.",
 left:"form",staffBot:"Post Pilot",
 form:`<p style="margin:0;font-size:.86rem;color:var(--muted)">Content queue (Google Sheet). Tick the briefs to draft:</p>
 <label style="flex-direction:row;gap:8px;font-weight:500"><input type="checkbox" name="t1" checked> Launch: our new Ramadan menu · Facebook</label>
 <label style="flex-direction:row;gap:8px;font-weight:500"><input type="checkbox" name="t2" checked> Hiring: junior automation engineer · LinkedIn</label>
 <label style="flex-direction:row;gap:8px;font-weight:500"><input type="checkbox" name="t3"> Tip: 3 ways to save time with WhatsApp bots · LinkedIn</label>
 <label style="flex-direction:row;gap:8px;font-weight:500"><input type="checkbox" name="t4"> (empty brief) · Facebook</label>
 <button class="btn" type="submit">Every 30 minutes: draft now</button><button class="btn ghost" type="button" data-act="publish">Every 10 minutes: publish due posts</button><button class="btn ghost" type="button" data-act="stats">20:00: daily stats</button>`,
 init(u){ u.state.posts=[]; u.sheet("Content Queue",["id","topic","platform","status"],u.state.posts); u.sheet("Rules",["rule"],[{rule:"Max 600 characters on Facebook, 1,300 on LinkedIn"},{rule:"2–4 hashtags"},{rule:"No prices without approval"},{rule:"Brand voice: friendly, clear, Egyptian English"}]); },
 async onSubmit(f,u){ const T={t1:["Launch: our new Ramadan menu","Facebook"],t2:["Hiring: junior automation engineer","LinkedIn"],t3:["Tip: 3 ways to save time with WhatsApp bots","LinkedIn"],t4:["","Facebook"]}; const picked=Object.keys(T).filter(k=>f[k].checked);
   await u.head("Every 30 Minutes","schedule"); await u.log("Read Rules"); await u.log("Read Content Queue"); await u.log("Pick Topics to Draft",picked.length+" due");
   for(const k of picked){ const [topic,pl]=T[k]; if(!topic){ await u.log("Brief OK?","empty brief","bad"); await u.log("Mark Brief Problem"); await u.log("Tell Team: Needs a Human"); u.staff("✋ A brief in the queue is empty. Please add a topic."); continue; }
     await u.log("Brief OK?","true"); await u.log("Prepare Draft Prompt",pl); await u.log("AI Draft Posts",topic,"",380);
     const body={t1:"🌙 Ramadan Kareem! Our new iftar menu is here: slow-cooked classics, fresh juices and desserts made for sharing. Book your table today. #Ramadan #Iftar #Cairo",t2:"We're hiring a Junior Automation Engineer 🚀 Build n8n workflows, connect AI models and ship automations real businesses use every day. Cairo · Hybrid. Apply through the link. #Hiring #n8n #Automation",t3:"3 ways a WhatsApp bot saves your team hours each week:\n1. Answer the 10 questions you get daily\n2. Take bookings without back-and-forth\n3. Hand tricky chats to a human with full context\n#WhatsApp #Automation #SmallBusiness"}[k];
     await u.log("Check Drafts","length, hashtags, rules","ok"); await u.log("Drafts OK?","true"); const p={id:rid("P"),topic,platform:pl,status:"awaiting approval",text:body}; u.state.posts.push(p); await u.log("Save Drafts",p.id); await u.log("Send for Approval","Telegram"); approval(p,u); await u.log("Save Approval Message"); }
   u.sheet("Content Queue",["id","topic","platform","status"],u.state.posts,true); u.out(picked.length?"Drafts sent to Telegram for approval.":"Nothing ticked."); },
 async onAction(act,f,u){ if(act==="publish"){ await u.head("Every 10 Minutes","schedule"); await u.log("Read Approved"); const due=u.state.posts.filter(p=>p.status==="approved"); await u.log("Due Now",due.length+" posts");
     for(const p of due){ await u.log("Route Platform",p.platform); await u.log(p.platform==="Facebook"?"Post to Facebook Page":"Post to LinkedIn","","ok"); await u.log(p.platform==="Facebook"?"Record Facebook Post":"Record LinkedIn Post"); p.status="posted"; u.bot("📣 Published on "+p.platform+":\n\n"+p.text); }
     u.sheet("Content Queue",["id","topic","platform","status"],u.state.posts,true); u.out(due.length?due.length+" post(s) published.":"Nothing approved is due yet."); }
   if(act==="stats"){ await u.head("Every Day 20:00","schedule"); await u.log("Read Posted"); const fb=u.state.posts.filter(p=>p.status==="posted"&&p.platform==="Facebook"); await u.log("Facebook Posts Only",fb.length+""); await u.log("Get Facebook Stats"); await u.log("Save Stats"); await u.log("Daily Summary"); await u.log("Post Summary","Telegram","ok");
     u.staff(`📊 Today: ${u.state.posts.filter(p=>p.status==="posted").length} posted, ${u.state.posts.filter(p=>p.status==="awaiting approval").length} waiting\n${fb.length?fb.map(p=>`• ${p.topic}: ${180+Math.floor(Math.random()*400)} reach · ${12+Math.floor(Math.random()*60)} reactions`).join("\n"):"No Facebook posts yet."}`); } }};
D["post-pilot"].phoneTitle="Facebook & LinkedIn";
function approval(p,u){ u.staff(`📝 ${p.platform} draft · ${p.topic}\n\n${p.text}`,[{label:"✅ Approve",onClick:async c=>{ await u.run(async()=>{ await u.head("Telegram Trigger","button"); await u.log("Parse Approval"); await u.log("Find Content",p.id); await u.log("Check Approval"); await u.log("Button or Command?","button"); await u.log("Answer Button"); await u.log("Decision Allowed?","true"); p.status="approved"; await u.log("Record Decision","approved · scheduled","ok"); u.sheet("Content Queue",["id","topic","platform","status"],u.state.posts,true); u.note(c,"Approved ✓ (publishes on the next 10-minute run)"); }); }},
  {label:"↩ Redraft",onClick:async c=>{ await u.run(async()=>{ await u.head("Telegram Trigger","button"); await u.log("Parse Approval","redraft"); await u.log("Record Decision","back to queue"); await u.log("Send Back for Redraft"); p.status="redraft"; u.sheet("Content Queue",["id","topic","platform","status"],u.state.posts,true); u.note(c,"Sent back for a new draft"); }); }}]); }

/* ---------- mount ---------- */
const d=D[slug]; if(!d) return;
const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
function mount(){ const hero=document.querySelector(".phero"); if(!hero||document.querySelector(".dm")) return;
  const sec=document.createElement("section"); sec.className="dm"; sec.id="demo";
  const leftChat=`<div class="panel dm-col dm-phone"><header><span>${esc(d.phone||"Customer")}</span>${d.channels?`<select class="dm-ch" aria-label="Channel" style="border:0;border-radius:8px;padding:3px 6px;font-size:.8rem">${d.channels.map(c=>`<option>${c}</option>`).join("")}</select>`:'<span style="font-size:.75rem;opacity:.85">customer</span>'}</header><div class="dm-msgs" aria-live="polite"></div><div class="dm-chips">${(d.chips||[]).map(c=>`<button type="button" dir="auto">${esc(c)}</button>`).join("")}</div><form class="dm-in"><input aria-label="Message" dir="auto" placeholder="Type a message…" autocomplete="off"><button type="submit">Send</button></form></div>`;
  const leftForm=`<div class="panel dm-col"><header><span>${esc(d.title)}</span><span class="pill">form</span></header><form class="dm-form">${d.form}</form><div class="dm-out" aria-live="polite"></div></div>`;
  const phoneSide=d.left==="form"&&d.phoneTitle?`<div class="panel dm-col dm-phone" style="height:auto;max-height:320px;margin-top:14px"><header><span>${esc(d.phoneTitle||"Messages sent")}</span></header><div class="dm-msgs" style="min-height:120px"></div></div>`:"";
  sec.innerHTML=`<div class="wrap"><div class="sechead"><div><div class="eyebrow">Live demo</div><h2 style="margin-top:8px">${esc(d.title)}</h2><p>${esc(d.intro)} Runs in your browser with sample data; the steps are the real workflow's nodes.</p></div><button class="btn ghost sm dm-reset" type="button">Reset demo</button></div>
   <div class="dm-grid"><div style="min-width:0">${d.left==="form"?leftForm:leftChat}${phoneSide}</div><div class="panel dm-col dm-logc"><header><span>Execution log</span><span class="pill dm-state">idle</span></header><ol class="dm-log"><li class="dm-empty">Start from the left: the workflow runs here node by node.</li></ol></div><div class="panel dm-col dm-tgp"><header><span>${esc(d.staffBot||"Team")} · Telegram</span><span style="font-size:.75rem;opacity:.85">staff</span></header><div class="dm-tgm" aria-live="polite"></div></div></div>
   <div class="panel dm-sheet"></div></div>
   <dialog id="dm-dlg"><header><div><b></b><div class="to" style="font-size:.82rem;color:#666"></div></div><button type="button" class="iconbtn" aria-label="Close" onclick="this.closest('dialog').close()">✕</button></header><div class="body"></div></dialog>`;
  hero.after(sec);
  const start=()=>{ const u=UI(sec,d); sec.querySelector(".dm-msgs")&&(sec.querySelector(".dm-msgs").innerHTML=""); sec.querySelector(".dm-tgm").innerHTML=""; sec.querySelector(".dm-out")&&(sec.querySelector(".dm-out").innerHTML="");
    const form=sec.querySelector(".dm-form"); d.init(u,form);
    if(d.left==="chat"){ const send=t=>{ if(!t||u.busy.on) return; u.me(t); u.run(()=>d.onSend(t,u)); };
      sec.querySelectorAll(".dm-chips button").forEach(b=>b.onclick=()=>send(b.textContent));
      const inf=sec.querySelector(".dm-in"); inf.onsubmit=e=>{e.preventDefault();const i=inf.querySelector("input");const t=i.value.trim();i.value="";send(t)};
      const chs=sec.querySelector(".dm-ch"); if(chs) chs.onchange=()=>{u.state.ch=chs.value;u.bot("(now chatting on "+chs.value+")")}; }
    else { form.onsubmit=e=>{e.preventDefault(); u.run(()=>d.onSubmit(form,u))}; form.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>u.run(()=>d.onAction(b.dataset.act,form,u))); }
  };
  sec.querySelector(".dm-reset").onclick=()=>{ const f=sec.querySelector(".dm-form"); if(f) f.reset(); start(); };
  start();
}
new MutationObserver(mount).observe(document.getElementById("app")||document.body,{childList:true,subtree:true}); mount();
})();
