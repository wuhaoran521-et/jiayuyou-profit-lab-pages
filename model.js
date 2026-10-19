(function(root){
const sum=a=>a.reduce((x,y)=>x+y,0), num=x=>Number(x)||0;
const days=(year,m)=>new Date(year,m+1,0).getDate();
function migrate(s){s.year??=2026;s.products.forEach(p=>{p.salesModes??=Array(12).fill('monthly');p.daily??=Array.from({length:12},()=>Array(31).fill(null));p.dailyAverage??=Array(12).fill(null);p.operatingDays??=Array.from({length:12},(_,m)=>days(s.year,m));});return s;}
function sync(s){migrate(s);s.products.forEach(p=>p.salesModes.forEach((mode,m)=>{if(mode==='daily'){const a=p.daily[m].slice(0,days(s.year,m));p.volumes[m]=a.every(v=>v===null)?null:sum(a.map(num));}if(mode==='average')p.volumes[m]=p.dailyAverage[m]===null?null:num(p.dailyAverage[m])*Math.min(num(p.operatingDays[m]),days(s.year,m));}));return s;}
function product(p){const cost=num(p.base)+num(p.other);let price;
if(p.mode==='price')price=num(p.price);else if(p.mode==='margin')price=cost/(1-num(p.rate)/100);else price=cost*(1+num(p.rate)/100);
return {...p,cost,price,unitProfit:price-cost,markup:cost?(price-cost)/cost:null,margin:price?(price-cost)/price:null};}
function calculate(s){sync(s);const products=s.products.map(product),investment=sum(s.investments.map(i=>num(i.amount)));let cumulative=-investment;
const months=Array.from({length:12},(_,m)=>{const revenue=sum(products.map(p=>p.price*num(p.volumes[m]))),cost=sum(products.map(p=>p.cost*num(p.volumes[m]))),volume=sum(products.map(p=>num(p.volumes[m])));
const expenses=s.expenses.map(e=>e.mode==='percent'?revenue*num(e.values[m])/100:num(e.values[m]));const fixed=sum(s.expenses.filter(e=>e.mode==='fixed').map(e=>num(e.values[m]))),variableRate=sum(s.expenses.filter(e=>e.mode==='percent').map(e=>num(e.values[m])/100));
const gross=revenue-cost,expense=sum(expenses),profit=gross-expense,contribution=revenue?gross/revenue-variableRate:null,breakeven=contribution>0?fixed/contribution:null;cumulative+=profit;
return {revenue,cost,volume,gross,expense,expenses,profit,cumulative,margin:revenue?gross/revenue:null,netMargin:revenue?profit/revenue:null,contribution,breakeven,breakVolume:breakeven!==null&&revenue>0?breakeven/(revenue/volume):null,safety:breakeven!==null&&revenue?1-breakeven/revenue:null};});
const annual={};['revenue','cost','volume','gross','expense','profit'].forEach(k=>annual[k]=sum(months.map(m=>m[k])));annual.margin=annual.revenue?annual.gross/annual.revenue:null;annual.netMargin=annual.revenue?annual.profit/annual.revenue:null;annual.cumulative=annual.profit-investment;
return {products,months,annual,investment,payback:months.findIndex(m=>m.cumulative>=0)+1};}
function validate(s){if(!s||s.version!==1||!Array.isArray(s.categories)||!Array.isArray(s.products)||!Array.isArray(s.expenses)||!Array.isArray(s.investments))throw Error('不是有效的方案文件');
const n=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;const arr=a=>Array.isArray(a)&&a.length===12&&a.every(x=>x===null||n(x));const str=x=>typeof x==='string'&&x.length<=200;
if(!s.categories.every(str)||!s.products.every(p=>str(p.id)&&str(p.name)&&s.categories.includes(p.category)&&n(p.base)&&n(p.other)&&n(p.rate)&&n(p.price)&&['markup','margin','price'].includes(p.mode)&&(p.mode!=='margin'||p.rate<100)&&arr(p.volumes))||!s.expenses.every(e=>str(e.id)&&str(e.name)&&['fixed','percent'].includes(e.mode)&&arr(e.values))||!s.investments.every(i=>str(i.id)&&str(i.name)&&n(i.amount)&&typeof i.reserve==='boolean'))throw Error('方案中有无效字段或数值');
for(const list of [s.products,s.expenses,s.investments])if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('记录编号重复');
migrate(s);if(!Number.isInteger(s.year)||s.year<2000||s.year>2100||!s.products.every(p=>Array.isArray(p.salesModes)&&p.salesModes.length===12&&p.salesModes.every(m=>['monthly','daily','average'].includes(m))&&Array.isArray(p.daily)&&p.daily.length===12&&p.daily.every(a=>Array.isArray(a)&&a.length===31&&a.every(x=>x===null||n(x)))&&arr(p.dailyAverage)&&arr(p.operatingDays)&&p.operatingDays.every(x=>x!==null&&Number.isInteger(x)&&x<=31)))throw Error('日销量或年份数据无效');return sync(s);}
root.Model={calculate,product,validate,migrate,sync,days};if(typeof module!=='undefined')module.exports=root.Model;
})(typeof window!=='undefined'?window:globalThis);
