const STORAGE_KEY="expenseflow_transactions_v1";
const COLORS=["#8273e8","#55c7a0","#f2a879","#75a8e8","#e58cbb","#e6c45e","#8d9eae","#a89bf4"];
const ICONS={"Food & Dining":"🍜","Transport":"🚕","Shopping":"🛍️","Bills":"🧾","Health":"💊","Education":"📚","Entertainment":"🎧","Other":"✦"};
let expenses=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
const $=id=>document.getElementById(id);
const fmt=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const today=new Date(); $("date").value=localDate(today);
function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function currentMonth(){return $("monthSelect").value||`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`}
function monthLabel(key){let [y,m]=key.split("-");return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}
function initMonths(){let opts=[];for(let i=0;i<15;i++){let d=new Date(today.getFullYear(),today.getMonth()-i,1),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;opts.push(`<option value="${key}">${monthLabel(key)}</option>`)}$("monthSelect").innerHTML=opts.join("")}
function monthExpenses(){return expenses.filter(e=>e.date.startsWith(currentMonth()))}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(expenses));render()}
function render(){let list=monthExpenses(),total=list.reduce((s,e)=>s+e.amount,0),budget=25000,percent=Math.min(total/budget*100,100);
$("totalAmount").textContent=fmt(total);$("monthCount").textContent=list.length;$("budgetAmount").textContent=fmt(budget);$("budgetProgress").style.width=percent+"%";$("budgetUsed").textContent=Math.round(total/budget*100)+"% used";$("budgetRemaining").textContent=fmt(Math.max(budget-total,0))+" left";$("dailyAverage").textContent=fmt(total/Math.max(today.getDate(),1));$("donutTotal").textContent=fmt(total);
renderChart(list,total);renderRows();}
function renderChart(list,total){let groups={};list.forEach(e=>groups[e.category]=(groups[e.category]||0)+e.amount);let entries=Object.entries(groups).sort((a,b)=>b[1]-a[1]);let start=0,parts=entries.map(([cat,val],i)=>{let end=start+(total?val/total*360:0),part=`${COLORS[i%COLORS.length]} ${start}deg ${end}deg`;start=end;return part});$("donut").style.background=parts.length?`conic-gradient(${parts.join(",")})`:"conic-gradient(#eeeef5 0deg 360deg)";
$("legend").innerHTML=entries.length?entries.slice(0,5).map(([cat,val],i)=>`<div class="legend-row"><span class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></span><span>${escapeHtml(cat)}</span><strong>${Math.round(val/total*100)}%</strong></div>`).join(""):`<div class="empty-legend">Add expenses to see your breakdown.</div>`}
function renderRows(){let search=$("search").value.toLowerCase(),all=[...expenses].filter(e=>e.description.toLowerCase().includes(search)||e.category.toLowerCase().includes(search)).sort((a,b)=>b.date.localeCompare(a.date)||b.created-b.created);
$("transactionRows").innerHTML=all.slice(0,12).map(e=>`<tr><td><div class="transaction-title"><span class="category-icon">${ICONS[e.category]||"✦"}</span><span>${escapeHtml(e.description||e.category)}</span></div></td><td><span class="category-badge">${escapeHtml(e.category)}</span></td><td>${new Date(e.date+"T12:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td class="amount-cell">− ${fmt(e.amount)}</td><td><button class="delete-btn" aria-label="Delete expense" data-delete="${e.id}">×</button></td></tr>`).join("");
let has=all.length>0;$("emptyState").style.display=has?"none":"block";document.querySelector(".table-wrap").style.display=has?"block":"none";}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("expenseForm").addEventListener("submit",e=>{e.preventDefault();let amount=Number($("amount").value);if(!Number.isFinite(amount)||amount<=0){showToast("Please enter a valid amount.");return}expenses.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),amount,category:$("category").value,date:$("date").value,description:$("description").value.trim()||$("category").value,created:Date.now()});persist();$("amount").value="";$("description").value="";showToast("Expense added — nice and mindful! ✦")});
$("transactionRows").addEventListener("click",e=>{let b=e.target.closest("[data-delete]");if(b){expenses=expenses.filter(x=>x.id!==b.dataset.delete);persist();showToast("Transaction removed.")}});
$("monthSelect").addEventListener("change",render);$("search").addEventListener("input",renderRows);
$("exportBtn").addEventListener("click",()=>{let rows=[["Date","Amount","Category","Description"],...expenses.map(e=>[e.date,e.amount,e.category,e.description])];let csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="expenseflow-transactions.csv";a.click();URL.revokeObjectURL(url);showToast("CSV export ready.")});
function showToast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
$("openForm").addEventListener("click",()=>$("amount").focus());$("emptyAdd").addEventListener("click",()=>$("amount").focus());
initMonths();render();