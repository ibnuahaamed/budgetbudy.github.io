/* ===== STATE ===== */
let state = {
  user: null,
  transactions: [],
  budgets: [],
  goals: [],
  categories: [],
  balanceVisible: true,
  currentType: 'expense',
  currentFilter: 'all',
  editingGoalId: null,
  chart: null,
};

const COLORS = ['#7c3aed','#00ffc8','#f43f5e','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#8b5cf6','#06b6d4'];

const DEFAULT_CATS = [
  { id: 'cat_food', name: 'Food', icon: '🍔', type: 'expense', color: '#f59e0b', isDefault: true },
  { id: 'cat_transport', name: 'Transport', icon: '🚗', type: 'expense', color: '#3b82f6', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping', icon: '🛍', type: 'expense', color: '#ec4899', isDefault: true },
  { id: 'cat_health', name: 'Health', icon: '🏥', type: 'expense', color: '#10b981', isDefault: true },
  { id: 'cat_entertainment', name: 'Entertainment', icon: '🎬', type: 'expense', color: '#8b5cf6', isDefault: true },
  { id: 'cat_bills', name: 'Bills', icon: '💡', type: 'expense', color: '#f43f5e', isDefault: true },
  { id: 'cat_salary', name: 'Salary', icon: '💼', type: 'income', color: '#00ffc8', isDefault: true },
  { id: 'cat_freelance', name: 'Freelance', icon: '💻', type: 'income', color: '#7c3aed', isDefault: true },
  { id: 'cat_investment', name: 'Investment', icon: '📈', type: 'income', color: '#10b981', isDefault: true },
];

/* ===== LOCAL STORAGE ===== */
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

/* ===== INIT ===== */
window.addEventListener('DOMContentLoaded', () => {
  // Splash loading animation
  setTimeout(() => {
    const savedUser = LS.get('ft_user');
    if (savedUser) {
      state.user = savedUser;
      loadUserData();
      goTo('screen-app');
      initApp();
    } else {
      goTo('screen-login');
    }
  }, 2400);
  initColorPicker();
});

function loadUserData() {
  const uid = state.user.id;
  state.transactions = LS.get(`ft_txns_${uid}`) || DEMO_TRANSACTIONS();
  state.budgets = LS.get(`ft_budgets_${uid}`) || [];
  state.goals = LS.get(`ft_goals_${uid}`) || DEMO_GOALS();
  state.categories = LS.get(`ft_cats_${uid}`) || [...DEFAULT_CATS];
}

function saveData() {
  const uid = state.user.id;
  LS.set(`ft_txns_${uid}`, state.transactions);
  LS.set(`ft_budgets_${uid}`, state.budgets);
  LS.set(`ft_goals_${uid}`, state.goals);
  LS.set(`ft_cats_${uid}`, state.categories);
}

/* ===== DEMO DATA ===== */
function DEMO_TRANSACTIONS() {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0,10);
  const days = (n) => { let d = new Date(now); d.setDate(d.getDate()-n); return fmt(d); };
  return [
    { id: uid(), type:'income', amount:45000, desc:'Monthly Salary', category:'cat_salary', date:days(1) },
    { id: uid(), type:'expense', amount:1200, desc:'Grocery Shopping', category:'cat_food', date:days(2) },
    { id: uid(), type:'expense', amount:800, desc:'Uber Ride', category:'cat_transport', date:days(3) },
    { id: uid(), type:'expense', amount:2500, desc:'Netflix & Spotify', category:'cat_entertainment', date:days(4) },
    { id: uid(), type:'income', amount:15000, desc:'Freelance Project', category:'cat_freelance', date:days(5) },
    { id: uid(), type:'expense', amount:3200, desc:'Electricity Bill', category:'cat_bills', date:days(6) },
    { id: uid(), type:'expense', amount:650, desc:'Lunch at Restaurant', category:'cat_food', date:days(7) },
    { id: uid(), type:'expense', amount:1800, desc:'Gym Membership', category:'cat_health', date:days(8) },
  ];
}
function DEMO_GOALS() {
  const target = new Date(); target.setMonth(target.getMonth()+6);
  return [
    { id: uid(), name:'New Laptop', target:80000, saved:32000, date:target.toISOString().slice(0,10) },
    { id: uid(), name:'Emergency Fund', target:200000, saved:75000, date:new Date(Date.now()+365*24*3600000).toISOString().slice(0,10) },
  ];
}

/* ===== UTILS ===== */
function uid() { return Math.random().toString(36).slice(2,10); }
function fmt(n) { return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function fmtShort(n) { if(n>=100000) return '₹'+(n/100000).toFixed(1)+'L'; if(n>=1000) return '₹'+(n/1000).toFixed(1)+'k'; return '₹'+n; }
function fmtDate(s) { return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }); }
function getCat(id) { return state.categories.find(c=>c.id===id) || { name:'Other', icon:'💰', color:'#7c3aed' }; }
function getMonthlyStats() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const monthly = state.transactions.filter(t => {
    const d = new Date(t.date); return d.getMonth()===m && d.getFullYear()===y;
  });
  const income = monthly.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = monthly.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return { income, expense };
}
function getTotalBalance() {
  const income = state.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = state.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return income - expense;
}
function getCategorySpend(catId) {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type==='expense' && t.category===catId && d.getMonth()===m && d.getFullYear()===y;
  }).reduce((s,t)=>s+t.amount,0);
}

/* ===== AUTH ===== */
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const name = email.split('@')[0].replace(/\./g,' ').split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  state.user = { id: btoa(email).replace(/=/g,''), name, email };
  LS.set('ft_user', state.user);
  loadUserData();
  goTo('screen-app');
  initApp();
  toast('Welcome back, '+name.split(' ')[0]+'! 👋', 'success');
}
function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  state.user = { id: btoa(email).replace(/=/g,''), name, email };
  LS.set('ft_user', state.user);
  state.categories = [...DEFAULT_CATS];
  state.transactions = DEMO_TRANSACTIONS();
  state.goals = DEMO_GOALS();
  state.budgets = [];
  saveData();
  goTo('screen-app');
  initApp();
  toast('Account created! Welcome '+name.split(' ')[0]+' 🎉', 'success');
}
function logout() {
  LS.del('ft_user');
  state.user = null;
  state.transactions = [];
  state.budgets = [];
  state.goals = [];
  state.categories = [];
  if(state.chart) { state.chart.destroy(); state.chart = null; }
  goTo('screen-login');
}
function togglePass(id,btn) {
  const el = document.getElementById(id);
  el.type = el.type==='password' ? 'text' : 'password';
  btn.textContent = el.type==='password' ? '👁' : '🙈';
}

/* ===== NAVIGATION ===== */
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}
function switchTab(tab) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelectorAll('.nav-item[data-tab]').forEach(n => {
    n.classList.toggle('active', n.dataset.tab===tab);
  });
  if(tab==='dashboard') renderDashboard();
  if(tab==='expenses') renderTransactions();
  if(tab==='budget') renderBudget();
  if(tab==='goals') renderGoals();
  if(tab==='categories') renderCategories();
}

/* ===== INIT APP ===== */
function initApp() {
  const name = state.user?.name || 'User';
  document.getElementById('user-name-display').textContent = name;
  document.getElementById('user-avatar').textContent = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const h = new Date().getHours();
  const greet = h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greet-text').textContent = greet;
  renderDashboard();
}

/* ===== DASHBOARD ===== */
function renderDashboard() {
  const balance = getTotalBalance();
  const { income, expense } = getMonthlyStats();
  const balEl = document.getElementById('balance-display');
  balEl.textContent = state.balanceVisible ? fmt(balance) : '₹ ••••••';
  balEl.style.color = balance < 0 ? 'var(--expense)' : '#fff';
  document.getElementById('total-income-display').textContent = state.balanceVisible ? fmt(income) : '₹ ••';
  document.getElementById('total-expense-display').textContent = state.balanceVisible ? fmt(expense) : '₹ ••';
  renderChart();
  renderBudgetProgress();
  const recent = [...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  renderTxnList('recent-txn-list', recent);
}
function toggleBalanceVisibility() {
  state.balanceVisible = !state.balanceVisible;
  renderDashboard();
}

/* ===== CHART ===== */
function renderChart() {
  const canvas = document.getElementById('spendChart');
  const ctx = canvas.getContext('2d');
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const labels = [], incomeData = [], expenseData = [];
  for(let w=1; w<=Math.ceil(daysInMonth/7); w++) {
    const from = (w-1)*7+1, to = Math.min(w*7, daysInMonth);
    labels.push(`W${w}`);
    const wkTxns = state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear()===y && d.getMonth()===m && d.getDate()>=from && d.getDate()<=to;
    });
    incomeData.push(wkTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
    expenseData.push(wkTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }
  if(state.chart) { state.chart.destroy(); }
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'Income', data:incomeData, backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6, borderSkipped:false },
        { label:'Expense', data:expenseData, backgroundColor:'rgba(244,63,94,0.7)', borderRadius:6, borderSkipped:false }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:true, plugins:{ legend:{display:false} },
      scales: {
        x:{ grid:{display:false}, ticks:{color:'#475569',font:{family:'Sora',size:11}} },
        y:{ display:false }
      }
    }
  });
  const legendEl = document.getElementById('chart-legend');
  legendEl.innerHTML = `<div class="legend-item"><div class="legend-dot" style="background:#10b981"></div>Income</div><div class="legend-item"><div class="legend-dot" style="background:#f43f5e"></div>Expense</div>`;
}

/* ===== BUDGET PROGRESS (dashboard) ===== */
function renderBudgetProgress() {
  const el = document.getElementById('budget-progress-list');
  if(state.budgets.length===0) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">📊</span><p>Set budgets to track spending</p></div>`;
    return;
  }
  el.innerHTML = state.budgets.slice(0,4).map(b => {
    const spent = getCategorySpend(b.category);
    const pct = Math.min(100, Math.round((spent/b.amount)*100));
    const cat = getCat(b.category);
    const color = pct>=90 ? 'var(--expense)' : pct>=70 ? 'var(--warning)' : 'var(--income)';
    return `<div class="bp-item fade-in">
      <div class="bp-top">
        <span class="bp-name">${cat.icon} ${cat.name}</span>
        <span class="bp-pct" style="color:${color}">${pct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text2)">
        <span>${fmt(spent)} spent</span><span>${fmt(b.amount)} limit</span>
      </div>
    </div>`;
  }).join('');
}

/* ===== TRANSACTIONS ===== */
function renderTransactions() {
  const search = document.getElementById('txn-search')?.value?.toLowerCase() || '';
  let txns = [...state.transactions];
  if(state.currentFilter !== 'all') txns = txns.filter(t=>t.type===state.currentFilter);
  if(search) txns = txns.filter(t => t.desc.toLowerCase().includes(search) || getCat(t.category).name.toLowerCase().includes(search));
  txns.sort((a,b)=>new Date(b.date)-new Date(a.date));
  renderTxnList('all-txn-list', txns);
}
function filterTxn(type, btn) {
  state.currentFilter = type;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  renderTransactions();
}
function renderTxnList(containerId, txns) {
  const el = document.getElementById(containerId);
  if(!el) return;
  if(txns.length===0) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>No transactions yet</p></div>`;
    return;
  }
  el.innerHTML = txns.map(t => {
    const cat = getCat(t.category);
    return `<div class="txn-item ${t.type} fade-in">
      <div class="txn-icon" style="background:${cat.color}22">${cat.icon}</div>
      <div class="txn-info">
        <div class="txn-desc">${t.desc}</div>
        <div class="txn-cat">${cat.name} · ${fmtDate(t.date)}</div>
      </div>
      <div class="txn-right">
        <div class="txn-amount">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
      </div>
      <button class="txn-delete" onclick="deleteTransaction('${t.id}')">🗑</button>
    </div>`;
  }).join('');
}
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t=>t.id!==id);
  saveData();
  renderTransactions();
  renderDashboard();
  toast('Transaction deleted');
}

/* ===== ADD TRANSACTION MODAL ===== */
function openAddModal(type='expense') {
  state.currentType = type;
  document.getElementById('type-expense').classList.toggle('active', type==='expense');
  document.getElementById('type-income').classList.toggle('active', type==='income');
  document.getElementById('txn-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('txn-amount').value = '';
  document.getElementById('txn-desc').value = '';
  populateCategorySelect('txn-category', type);
  openModal('modal-add');
}
function setType(type) {
  state.currentType = type;
  document.getElementById('type-expense').classList.toggle('active', type==='expense');
  document.getElementById('type-income').classList.toggle('active', type==='income');
  populateCategorySelect('txn-category', type);
}
function populateCategorySelect(selectId, type) {
  const sel = document.getElementById(selectId);
  const cats = state.categories.filter(c=>c.type===type);
  sel.innerHTML = `<option value="">Select category</option>` + cats.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}
function saveTransaction(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('txn-amount').value);
  const desc = document.getElementById('txn-desc').value.trim();
  const category = document.getElementById('txn-category').value;
  const date = document.getElementById('txn-date').value;
  if(!amount || !desc || !date) return toast('Please fill all fields', 'error');
  const txn = { id:uid(), type:state.currentType, amount, desc, category, date };
  state.transactions.unshift(txn);
  saveData();
  closeModal('modal-add');
  toast(`${state.currentType==='income'?'Income':'Expense'} added! ✅`, 'success');
  renderDashboard();
  renderTransactions();
}

/* ===== BUDGET ===== */
function openBudgetModal() {
  document.getElementById('budget-amount').value = '';
  populateCategorySelect('budget-category', 'expense');
  openModal('modal-budget');
}
function saveBudget(e) {
  e.preventDefault();
  const category = document.getElementById('budget-category').value;
  const amount = parseFloat(document.getElementById('budget-amount').value);
  if(!category || !amount) return toast('Fill all fields', 'error');
  const existing = state.budgets.findIndex(b=>b.category===category);
  if(existing>=0) state.budgets[existing].amount = amount;
  else state.budgets.push({ id:uid(), category, amount });
  saveData();
  closeModal('modal-budget');
  renderBudget();
  renderDashboard();
  toast('Budget saved! 💰', 'success');
}
function renderBudget() {
  let totalBudget=0, totalSpent=0;
  state.budgets.forEach(b=>{ totalBudget+=b.amount; totalSpent+=getCategorySpend(b.category); });
  document.getElementById('total-budget-val').textContent = fmtShort(totalBudget);
  document.getElementById('total-spent-val').textContent = fmtShort(totalSpent);
  document.getElementById('total-remaining-val').textContent = fmtShort(Math.max(0,totalBudget-totalSpent));
  const el = document.getElementById('budget-list');
  if(state.budgets.length===0) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">📊</span><p>No budgets set yet.<br>Tap '+ Set' to add your first budget</p></div>`;
    return;
  }
  el.innerHTML = state.budgets.map(b => {
    const cat = getCat(b.category);
    const spent = getCategorySpend(b.category);
    const pct = Math.min(100, Math.round((spent/b.amount)*100));
    const color = pct>=90 ? 'var(--expense)' : pct>=70 ? 'var(--warning)' : 'var(--income)';
    return `<div class="budget-item fade-in">
      <div class="budget-item-top">
        <div class="budget-item-left">
          <div class="budget-icon" style="background:${cat.color}22">${cat.icon}</div>
          <div><div class="budget-name">${cat.name}</div><div class="budget-sub">${pct}% used this month</div></div>
        </div>
        <div class="budget-vals">
          <div class="budget-spent" style="color:${color}">${fmt(spent)}</div>
          <div class="budget-total">of ${fmt(b.amount)}</div>
        </div>
        <button class="budget-delete" onclick="deleteBudget('${b.id}')">🗑</button>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('');
}
function deleteBudget(id) {
  state.budgets = state.budgets.filter(b=>b.id!==id);
  saveData();
  renderBudget();
  toast('Budget removed');
}

/* ===== GOALS ===== */
function openGoalModal(goalId=null) {
  state.editingGoalId = goalId;
  const goal = goalId ? state.goals.find(g=>g.id===goalId) : null;
  document.getElementById('goal-modal-title').textContent = goalId ? 'Edit Goal' : 'New Goal';
  document.getElementById('goal-name').value = goal?.name || '';
  document.getElementById('goal-target').value = goal?.target || '';
  document.getElementById('goal-saved').value = goal?.saved || 0;
  document.getElementById('goal-date').value = goal?.date || '';
  openModal('modal-goal');
}
function saveGoal(e) {
  e.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const saved = parseFloat(document.getElementById('goal-saved').value)||0;
  const date = document.getElementById('goal-date').value;
  if(!name || !target || !date) return toast('Fill all fields','error');
  if(state.editingGoalId) {
    const idx = state.goals.findIndex(g=>g.id===state.editingGoalId);
    if(idx>=0) state.goals[idx] = { ...state.goals[idx], name, target, saved, date };
  } else {
    state.goals.push({ id:uid(), name, target, saved, date });
  }
  saveData();
  closeModal('modal-goal');
  renderGoals();
  toast('Goal saved! 🎯', 'success');
}
function addToGoal(goalId) {
  const inp = document.getElementById(`goal-inp-${goalId}`);
  const amt = parseFloat(inp.value);
  if(!amt||amt<=0) return toast('Enter valid amount','error');
  const goal = state.goals.find(g=>g.id===goalId);
  if(goal) {
    goal.saved = Math.min(goal.target, goal.saved+amt);
    saveData();
    inp.value = '';
    renderGoals();
    if(goal.saved >= goal.target) toast('Goal completed! 🎉 Congratulations!','success');
    else toast(`₹${amt.toLocaleString('en-IN')} added to goal!`,'success');
  }
}
function deleteGoal(id) {
  state.goals = state.goals.filter(g=>g.id!==id);
  saveData();
  renderGoals();
  toast('Goal deleted');
}
function renderGoals() {
  const el = document.getElementById('goals-list');
  if(state.goals.length===0) {
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">🎯</span><p>No goals yet.<br>Set a financial goal to get started!</p></div>`;
    return;
  }
  el.innerHTML = state.goals.map(g => {
    const pct = Math.min(100, Math.round((g.saved/g.target)*100));
    const daysLeft = Math.max(0, Math.ceil((new Date(g.date)-new Date())/(1000*60*60*24)));
    const complete = pct>=100;
    return `<div class="goal-item fade-in">
      <div class="goal-top">
        <div>
          <div class="goal-name">${g.name}</div>
          <div class="goal-date">${complete ? '✅ Completed!' : daysLeft+' days left · '+fmtDate(g.date)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="goal-pct">${pct}%</div>
          <button class="goal-delete" onclick="deleteGoal('${g.id}')">🗑</button>
        </div>
      </div>
      <div class="goal-amounts">
        <span class="goal-saved">${fmt(g.saved)}</span>
        <span class="goal-target">/ ${fmt(g.target)}</span>
      </div>
      <div class="progress-track" style="height:8px">
        <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--accent))"></div>
      </div>
      ${!complete ? `<div class="goal-add-row">
        <input type="number" id="goal-inp-${g.id}" class="goal-add-input" placeholder="Add amount…" min="1" step="100"/>
        <button class="goal-add-btn" onclick="addToGoal('${g.id}')">+ Add</button>
      </div>` : `<div class="goal-complete-badge">🏆 Goal Achieved!</div>`}
    </div>`;
  }).join('');
}

/* ===== CATEGORIES ===== */
let selectedColor = COLORS[0];
function initColorPicker() {
  const cp = document.getElementById('color-picker');
  cp.innerHTML = COLORS.map(c=>`<div class="color-dot ${c===selectedColor?'selected':''}" style="background:${c}" onclick="selectColor('${c}',this)"></div>`).join('');
}
function selectColor(color, el) {
  selectedColor = color;
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('selected'));
  el.classList.add('selected');
}
function openCategoryModal() {
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '';
  openModal('modal-category');
}
function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  const type = document.getElementById('cat-type').value;
  const icon = document.getElementById('cat-icon').value || '💰';
  if(!name) return toast('Enter category name','error');
  if(state.categories.find(c=>c.name.toLowerCase()===name.toLowerCase())) return toast('Category already exists','error');
  state.categories.push({ id:'cat_'+uid(), name, type, icon, color:selectedColor });
  saveData();
  closeModal('modal-category');
  renderCategories();
  toast('Category added! ✅','success');
}
function deleteCategory(id) {
  const cat = state.categories.find(c=>c.id===id);
  if(cat?.isDefault) return toast('Cannot delete default categories','error');
  state.categories = state.categories.filter(c=>c.id!==id);
  saveData();
  renderCategories();
  toast('Category deleted');
}
function renderCategories() {
  const el = document.getElementById('categories-list');
  if(state.categories.length===0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:span 2"><span class="empty-icon">🏷</span><p>No categories yet</p></div>`;
    return;
  }
  el.innerHTML = state.categories.map(c=>`<div class="cat-item fade-in">
    ${c.isDefault ? '<span class="cat-default">Default</span>' : `<button class="cat-delete" onclick="deleteCategory('${c.id}')">✕</button>`}
    <div class="cat-icon-wrap" style="background:${c.color}22">${c.icon}</div>
    <div class="cat-name">${c.name}</div>
    <div class="cat-type ${c.type}">${c.type}</div>
  </div>`).join('');
}

/* ===== MODAL HELPERS ===== */
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }

/* ===== TOAST ===== */
let toastTimer;
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.classList.remove('show'); }, 2800);
}

/* ===== NOTIF PANEL ===== */
function showNotifPanel() {
  const { income, expense } = getMonthlyStats();
  const budgetAlerts = state.budgets.filter(b => {
    const spent = getCategorySpend(b.category);
    return (spent/b.amount)>=0.8;
  });
  const msgs = [];
  if(budgetAlerts.length>0) msgs.push(`⚠️ ${budgetAlerts.length} budget(s) near limit!`);
  const completedGoals = state.goals.filter(g=>g.saved>=g.target);
  if(completedGoals.length>0) msgs.push(`🏆 ${completedGoals.length} goal(s) completed!`);
  msgs.push(`📈 This month: ${fmt(income)} income`);
  msgs.push(`📉 This month: ${fmt(expense)} spent`);
  toast(msgs[0] || 'No new notifications');
}

/* ===== KEYBOARD HANDLING ===== */
document.addEventListener('keydown', (e) => {
  if(e.key==='Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    document.body.style.overflow='';
  }
});
