// ===== CANVAS — chaotic particles with rare temporary connections =====
const canvas=document.getElementById('neural-bg'),ctx=canvas?canvas.getContext('2d'):null;
if(!ctx){var _c=document.getElementById('neural-bg');if(_c)_c.style.display='none';}else{
let mouseX=-9999,mouseY=-9999,particles=[],connections=[];
const CONN_DIST=180,CONN_CHANCE=0.003,CONN_DURATION_MIN=60,CONN_DURATION_MAX=180;
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight}
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&'ontouchend' in document);
const isMobile=isIOS||('ontouchstart' in window&&window.innerWidth<1024);
const LGHT_LEVELS=isMobile?3:4,LGHT_DISP=0.12,LGHT_REGEN=isMobile?5:3;
const LGHT_MAX_CONN=isMobile?3:6,LGHT_TENDRIL=isMobile?0:0.15;
const LGHT_FLICK_SPD=0.35,LGHT_FLICK_AMP=0.25;
const ICON_BASE=isMobile?10:12,ICON_VAR=isMobile?4:6,ICON_SW=1.2,ICON_GLOW=6;
const ICON_PATHS=[];
(function(){
    const d=new Path2D();
    d.moveTo(-.6,-1);d.lineTo(.2,-1);d.lineTo(.6,-.6);d.lineTo(.6,1);d.lineTo(-.6,1);d.closePath();
    d.moveTo(.2,-1);d.lineTo(.2,-.6);d.lineTo(.6,-.6);
    ICON_PATHS.push(d);
    const g=new Path2D();
    const iR=.45,oR=.85,tw=.28;
    for(let i=0;i<6;i++){
        const a=(i/6)*Math.PI*2-Math.PI/2,a1=a-tw,a2=a+tw;
        if(!i)g.moveTo(Math.cos(a1)*iR,Math.sin(a1)*iR);
        else g.lineTo(Math.cos(a1)*iR,Math.sin(a1)*iR);
        g.lineTo(Math.cos(a1)*oR,Math.sin(a1)*oR);
        g.lineTo(Math.cos(a2)*oR,Math.sin(a2)*oR);
        g.lineTo(Math.cos(a2)*iR,Math.sin(a2)*iR);
        const nA=((i+1)/6)*Math.PI*2-Math.PI/2-tw;
        g.arc(0,0,iR,a2,nA,false);
    }
    g.closePath();g.moveTo(.2,0);g.arc(0,0,.2,0,Math.PI*2);
    ICON_PATHS.push(g);
    const c=new Path2D();
    c.moveTo(-.3,-.8);c.lineTo(-.8,0);c.lineTo(-.3,.8);
    c.moveTo(.3,-.8);c.lineTo(.8,0);c.lineTo(.3,.8);
    ICON_PATHS.push(c);
    const l=new Path2D();
    l.arc(0,-.2,.55,Math.PI*1.15,Math.PI*1.85,true);
    l.lineTo(.3,.4);l.lineTo(.3,.65);l.lineTo(-.3,.65);l.lineTo(-.3,.4);l.closePath();
    l.moveTo(-.25,.75);l.lineTo(.25,.75);l.moveTo(-.15,.9);l.lineTo(.15,.9);
    ICON_PATHS.push(l);
    const b=new Path2D();
    b.moveTo(-.9,.9);b.lineTo(.9,.9);
    b.rect(-.7,.1,.4,.8);b.rect(-.2,-.6,.4,1.5);b.rect(.3,-.15,.4,1.05);
    ICON_PATHS.push(b);
    const m=new Path2D();
    m.arc(-.15,-.15,.55,0,Math.PI*2);m.moveTo(.22,.22);m.lineTo(.85,.85);
    ICON_PATHS.push(m);
})();
const ICON_COUNT=ICON_PATHS.length;

function easeInCubic(t){return t*t*t}
function easeOutCubic(t){return 1-(1-t)*(1-t)*(1-t)}
function genLightningPts(ax,ay,bx,by,levels,disp){
    let pts=[{x:ax,y:ay},{x:bx,y:by}];
    for(let lv=0;lv<levels;lv++){
        const next=[];
        for(let i=0;i<pts.length-1;i++){
            const p1=pts[i],p2=pts[i+1];
            const dx=p2.x-p1.x,dy=p2.y-p1.y;
            const len=Math.sqrt(dx*dx+dy*dy)||1;
            const off=(Math.random()-.5)*disp;
            next.push(p1,{x:(p1.x+p2.x)/2+(-dy/len)*off,y:(p1.y+p2.y)/2+(dx/len)*off});
        }
        next.push(pts[pts.length-1]);pts=next;disp*=.55;
    }
    return pts;
}
function strokeLightning(pts,color,lw,alpha){
    if(pts.length<2)return;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
    ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.globalAlpha=alpha;ctx.stroke();
}
function genTendril(pts,idx){
    if(idx<1||idx>=pts.length-1)return null;
    const p=pts[idx],prev=pts[idx-1];
    const dx=p.x-prev.x,dy=p.y-prev.y,len=Math.sqrt(dx*dx+dy*dy);
    if(len<1)return null;
    const ang=Math.atan2(dy,dx)+(Math.random()>.5?1:-1)*(Math.PI/4+Math.random()*Math.PI/4);
    const bLen=len*(1.5+Math.random());
    return genLightningPts(p.x,p.y,p.x+Math.cos(ang)*bLen,p.y+Math.sin(ang)*bLen,2,bLen*.2);
}

class Particle{constructor(){this.reset()}
reset(){
    this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;
    this.size=Math.random()*ICON_VAR+ICON_BASE;
    this.baseSpeed=Math.random()*.25+.1;
    this.angle=Math.random()*Math.PI*2;
    this.turnRate=(Math.random()-.5)*.02;
    this.turnTimer=0;this.turnInterval=Math.floor(Math.random()*200)+100;
    this.opacity=Math.random()*.3+.1;
    const r=Math.random();this.color=r<.45?'79,125,245':r<.85?'108,92,231':'212,168,83';
    this.pulsePhase=Math.random()*Math.PI*2;
    this.iconType=Math.floor(Math.random()*ICON_COUNT);
    this.rotation=Math.random()*Math.PI*2;
    this.rotSpeed=(Math.random()-.5)*.003;
}
update(){
    this.turnTimer++;
    if(this.turnTimer>=this.turnInterval){
        this.turnRate=(Math.random()-.5)*.04;
        this.turnInterval=Math.floor(Math.random()*200)+80;
        this.turnTimer=0;
    }
    this.angle+=this.turnRate;
    this.x+=Math.cos(this.angle)*this.baseSpeed;
    this.y+=Math.sin(this.angle)*this.baseSpeed;
    const dx=mouseX-this.x,dy=mouseY-this.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<180){const f=(180-dist)/180*.008;this.x-=dx*f;this.y-=dy*f;}
    if(this.x<-20)this.x=canvas.width+20;if(this.x>canvas.width+20)this.x=-20;
    if(this.y<-20)this.y=canvas.height+20;if(this.y>canvas.height+20)this.y=-20;
    this.pulsePhase+=.02;this.rotation+=this.rotSpeed;
}
draw(){
    const pulse=Math.sin(this.pulsePhase)*.15+.85;
    const sz=this.size*pulse;
    ctx.beginPath();ctx.arc(this.x,this.y,sz+ICON_GLOW,0,Math.PI*2);
    ctx.fillStyle=`rgba(${this.color},${this.opacity*.08})`;ctx.fill();
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.rotation);ctx.scale(sz,sz);
    ctx.strokeStyle=`rgba(${this.color},${this.opacity*pulse})`;
    ctx.lineWidth=ICON_SW/sz;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.stroke(ICON_PATHS[this.iconType]);ctx.restore();
}}

class Connection{constructor(a,b){
    this.a=a;this.b=b;this.life=0;
    this.maxLife=Math.floor(Math.random()*(CONN_DURATION_MAX-CONN_DURATION_MIN))+CONN_DURATION_MIN;
    this.dataPos=0;this.dataDir=Math.random()>.5?1:-1;this.dataSpeed=Math.random()*.02+.01;
    this.rgb=Math.random()>.6?'rgb(212,168,83)':'rgb(79,125,245)';
    this.rgbaP=Math.random()>.6?'rgba(212,168,83,':'rgba(79,125,245,';
    this.pts=[];this.tendrils=[];this.regenC=0;this._regen();
}
_regen(){
    const d=Math.sqrt((this.b.x-this.a.x)**2+(this.b.y-this.a.y)**2);
    this.pts=genLightningPts(this.a.x,this.a.y,this.b.x,this.b.y,LGHT_LEVELS,d*LGHT_DISP);
    this.tendrils=[];
    if(LGHT_TENDRIL>0)for(let i=2;i<this.pts.length-2;i+=2)
        if(Math.random()<LGHT_TENDRIL){const t=genTendril(this.pts,i);if(t)this.tendrils.push(t);}
}
update(){
    this.life++;this.dataPos+=this.dataSpeed*this.dataDir;
    if(this.dataPos>1||this.dataPos<0)this.dataDir*=-1;
    this.regenC++;if(this.regenC>=LGHT_REGEN){this.regenC=0;this._regen();}
    return this.life<this.maxLife;
}
draw(){
    const dx=this.b.x-this.a.x,dy=this.b.y-this.a.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d>CONN_DIST*1.8){this.life=this.maxLife;return;}
    const pr=this.life/this.maxLife;
    let fade;
    if(pr<.15)fade=easeInCubic(pr/.15);
    else if(pr>.75)fade=easeOutCubic((1-pr)/.25);
    else fade=.75+Math.sin(this.life*LGHT_FLICK_SPD)*LGHT_FLICK_AMP;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    strokeLightning(this.pts,this.rgb,4,fade*.18);
    strokeLightning(this.pts,this.rgb,2,fade*.35);
    strokeLightning(this.pts,this.rgb,.7,fade*.9);
    for(let i=0;i<this.tendrils.length;i++){
        strokeLightning(this.tendrils[i],this.rgb,1.5,fade*.1);
        strokeLightning(this.tendrils[i],this.rgb,.5,fade*.4);
    }
    ctx.globalAlpha=1;
    const total=this.pts.length-1;
    if(total<1){ctx.restore();return;}
    const segF=Math.max(0,Math.min(this.dataPos,1))*total;
    const segI=Math.min(Math.floor(segF),total-1),segT=segF-segI;
    const px=this.pts[segI].x+(this.pts[segI+1].x-this.pts[segI].x)*segT;
    const py=this.pts[segI].y+(this.pts[segI+1].y-this.pts[segI].y)*segT;
    ctx.beginPath();ctx.arc(px,py,2.5,0,Math.PI*2);
    ctx.fillStyle=this.rgbaP+(fade*.7)+')';ctx.fill();
    ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fillStyle=this.rgbaP+(fade*.15)+')';ctx.fill();
    ctx.restore();
}}

function initParticles(){let c=Math.min(Math.floor(canvas.width*canvas.height/28000),45);if(isIOS)c=Math.min(c,25);particles=[];connections=[];for(let i=0;i<c;i++)particles.push(new Particle())}
function tryNewConnections(){
    if(connections.length>=LGHT_MAX_CONN)return;
    for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
            const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);
            if(d<CONN_DIST&&Math.random()<CONN_CHANCE){
                const exists=connections.some(c=>(c.a===particles[i]&&c.b===particles[j])||(c.a===particles[j]&&c.b===particles[i]));
                if(!exists){connections.push(new Connection(particles[i],particles[j]));if(connections.length>=LGHT_MAX_CONN)return;}
            }
        }
    }
}
function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{p.update();p.draw()});
    tryNewConnections();
    connections=connections.filter(c=>{const alive=c.update();c.draw();return alive;});
    requestAnimationFrame(animate);
}
resizeCanvas();initParticles();animate();
window.addEventListener('resize',()=>{resizeCanvas();initParticles()});
document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY});
}

// ===== ACCORDION =====
function toggleAccordion(el){
    const item=el.closest('.svc-item');
    const body=item.querySelector('.svc-body');
    const isOpen=item.classList.contains('open');
    document.querySelectorAll('.svc-item.open').forEach(i=>{
        if(i!==item){i.classList.remove('open');i.querySelector('.svc-body').style.maxHeight='0'}
    });
    if(isOpen){item.classList.remove('open');body.style.maxHeight='0'}
    else{item.classList.add('open');body.style.maxHeight=body.scrollHeight+'px'}
}

// ===== COUNTERS =====
function animateCounters(container){
    if(!container)container=document;
    container.querySelectorAll('[data-count]').forEach(el=>{
        const target=parseInt(el.dataset.count),start=performance.now();
        function update(now){const p=Math.min((now-start)/1500,1);el.textContent=Math.floor(target*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(update)}
        requestAnimationFrame(update);
    });
}
const heroObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){animateCounters(e.target);heroObs.unobserve(e.target)}})},{threshold:.5});
document.querySelectorAll('.metrics').forEach(el=>heroObs.observe(el));

// ===== HEADER SCROLL =====
window.addEventListener('scroll',()=>{
    var h=document.getElementById('header');if(h)h.classList.toggle('scrolled',window.scrollY>50);
});

// ===== ACTIVE NAV =====
(function(){
    var path=window.location.pathname.replace(/^\/(?:ru|en|vi|zh)\//,'/').replace(/\/index\.html$/,'/').replace(/\/$/,'');
    if(path==='')path='/';
    document.querySelectorAll('.nav-tab[href]').forEach(function(a){
        var href=a.getAttribute('href').replace(/\/$/,'');
        if(href==='')href='/';
        a.classList.toggle('active',href===path);
    });
})();

// ===== HAMBURGER =====
(function(){
    var ham=document.getElementById('ham'),nav=document.getElementById('nav');
    if(ham&&nav)ham.addEventListener('click',function(){ham.classList.toggle('active');nav.classList.toggle('mobile-open')});
})();

// ===== MODAL =====
function openModal(){document.getElementById('modalOverlay').classList.add('active');document.body.style.overflow='hidden'}
function closeModal(e){if(e&&e.target!==e.currentTarget&&!e.target.classList.contains('modal-close'))return;document.getElementById('modalOverlay').classList.remove('active');document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

// ===== TOAST =====
function showToast(msg,type){
    if(!type)type='success';
    const el=document.createElement('div');
    el.className='toast '+type;
    el.textContent=msg;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},4000);
}

// ===== I18N ENGINE =====
let currentLang='ru',i18nCache={},typedInstance=null;

function detectLang(){
    var parts=window.location.pathname.split('/').filter(Boolean);
    var urlLang=['ru','en','vi','zh'].indexOf(parts[0])!==-1?parts[0]:null;
    if(urlLang)return urlLang;
    // No prefix = default Russian
    return 'ru';
}

function getPagePath(){
    var path=window.location.pathname.replace(/^\/(?:ru|en|vi|zh)\//,'/');
    if(path==='/index.html')path='/';
    return path.replace(/\/$/,'')||'/';
}

function toggleLangMenu(){document.getElementById('langSw').classList.toggle('open')}
document.addEventListener('click',function(e){var sw=document.getElementById('langSw');if(sw&&!sw.contains(e.target))sw.classList.remove('open')});

function getI18n(key,fb){if(currentLang==='ru')return fb;var d=i18nCache[currentLang];return(d&&d[key])||fb}

function setLang(lang){
    if(lang===currentLang){document.getElementById('langSw').classList.remove('open');return}
    localStorage.setItem('la_lang',lang);
    var pagePath=getPagePath();
    var newPath='/'+lang+pagePath;
    // Ensure trailing slash for Cloudflare Pages compatibility
    if(newPath.length>1&&!newPath.endsWith('/'))newPath+='/';
    window.location.href=newPath;
}

async function loadAndApplyLang(lang){
    if(lang!=='ru'&&!i18nCache[lang]){
        try{var r=await fetch('/i18n/'+lang+'.json');if(!r.ok)throw 0;i18nCache[lang]=await r.json()}
        catch(e){showToast('Language loading error','error');return}
    }
    applyLang(lang);
}

function applyLang(lang){
    var dict=lang==='ru'?null:i18nCache[lang];
    currentLang=lang;localStorage.setItem('la_lang',lang);document.documentElement.lang=lang;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
        var k=el.getAttribute('data-i18n');
        if(lang==='ru'){if(el._i18nOrig!==undefined)el.textContent=el._i18nOrig}
        else{if(el._i18nOrig===undefined)el._i18nOrig=el.textContent;if(dict[k]!==undefined)el.textContent=dict[k]}
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
        var k=el.getAttribute('data-i18n-html');
        if(lang==='ru'){if(el._i18nOrigH!==undefined)el.innerHTML=el._i18nOrigH}
        else{if(el._i18nOrigH===undefined)el._i18nOrigH=el.innerHTML;if(dict[k]!==undefined)el.innerHTML=dict[k]}
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
        var k=el.getAttribute('data-i18n-ph');
        if(lang==='ru'){if(el._i18nOrigP!==undefined)el.placeholder=el._i18nOrigP}
        else{if(el._i18nOrigP===undefined)el._i18nOrigP=el.placeholder;if(dict[k]!==undefined)el.placeholder=dict[k]}
    });
    reinitTyped(lang,dict);
    var lc=document.getElementById('langCurrent');if(lc)lc.textContent=lang.toUpperCase();
    document.querySelectorAll('.lang-opt').forEach(function(o){o.classList.toggle('active',o.dataset.lang===lang)});
    var sw=document.getElementById('langSw');if(sw)sw.classList.remove('open');
    document.querySelectorAll('.svc-item.open .svc-body').forEach(function(b){b.style.maxHeight=b.scrollHeight+'px'});
    if(typeof AOS!=='undefined')AOS.refresh();
}

function reinitTyped(lang,dict){
    if(typedInstance){typedInstance.destroy();typedInstance=null}
    var el=document.getElementById('typed-target');if(!el)return;
    if(typeof Typed==='undefined')return;
    var strings=(lang==='ru')?['цифровые продукты','маркетинговые стратегии','веб-сервисы','мобильные приложения','техническую документацию']
        :(dict&&dict['typed.strings'])||['digital products','marketing strategies','web services','mobile apps','technical documentation'];
    typedInstance=new Typed('#typed-target',{strings:strings,typeSpeed:70,backSpeed:40,backDelay:2000,loop:true,showCursor:true,cursorChar:'|'});
}

// ===== NAV LANG LINKS =====
function updateNavLinks(lang){
    var prefix='/'+lang;
    document.querySelectorAll('.nav-tab[href]').forEach(function(a){
        var href=a.getAttribute('data-href')||a.getAttribute('href');
        if(!a.getAttribute('data-href'))a.setAttribute('data-href',href);
        var newHref=prefix+href;
        if(newHref.length>1&&!newHref.endsWith('/'))newHref+='/';
        a.setAttribute('href',newHref);
    });
    var logo=document.querySelector('.logo[href]');
    if(logo){logo.setAttribute('href',prefix+'/')}
}

// ===== FORM HELPERS =====
const API_URL=location.hostname.includes('pages.dev')?'https://la-api.ravinski-genlawyer.workers.dev':'/api';
const pageLoadTime=Date.now();
function isRateLimited(){const t=localStorage.getItem('la_rl');return t&&Date.now()-parseInt(t)<60000}
function setRateLimit(){localStorage.setItem('la_rl',Date.now().toString())}

// ===== SUBMIT JOIN =====
async function submitJoin(){
    const name=document.getElementById('join-name').value.trim();
    const about=document.getElementById('join-about').value.trim();
    const experience=document.getElementById('join-experience').value.trim();
    const hobbies=document.getElementById('join-hobbies').value.trim();
    const contact=document.getElementById('join-contact').value.trim();
    const hp=document.getElementById('join-hp').value;
    if(hp)return;
    if(Date.now()-pageLoadTime<3000)return;
    if(isRateLimited()){showToast(getI18n('toast.ratelimit','Подождите минуту перед повторной отправкой'),'warning');return}
    if(!name){showToast(getI18n('toast.noname','Укажите имя'),'warning');return}
    if(!contact){showToast(getI18n('toast.nocontact','Укажите контакт для связи'),'warning');return}
    const btn=document.querySelector('.join-form-wrap .btn--green');
    btn.disabled=true;btn.textContent=getI18n('toast.sending','Отправляем...');
    try{
        const res=await fetch(API_URL+'/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,about,experience,hobbies,contact})});
        if(!res.ok)throw new Error();
        showToast(getI18n('toast.success','Заявка отправлена! Мы свяжемся через защищённый канал'),'success');setRateLimit();
        document.getElementById('join-name').value='';document.getElementById('join-about').value='';document.getElementById('join-experience').value='';
        document.getElementById('join-hobbies').value='';document.getElementById('join-contact').value='';
    }catch{showToast(getI18n('toast.error','Ошибка отправки. Напишите нам напрямую в Telegram'),'error')}
    finally{btn.disabled=false;btn.textContent=getI18n('join.form.btn','Присоединиться')}
}

// ===== AOS INIT =====
if(typeof AOS!=='undefined')AOS.init({duration:600,once:true,offset:80});

// ===== I18N INIT =====
(function(){
    var lang=detectLang();
    updateNavLinks(lang);
    if(lang!=='ru'){
        loadAndApplyLang(lang);
    }else{
        var el=document.getElementById('typed-target');
        if(el&&typeof Typed!=='undefined'){
            typedInstance=new Typed('#typed-target',{strings:['цифровые продукты','маркетинговые стратегии','веб-сервисы','мобильные приложения','техническую документацию'],typeSpeed:70,backSpeed:40,backDelay:2000,loop:true,showCursor:true,cursorChar:'|'});
        }
    }
})();
