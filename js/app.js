/**
 * SecurEats v3 - Simple : Accueil, Menu, Commande, Profil
 * Paiement au livreur (TPE CB/espèces)
 */
const App = (() => {
  const MENU = {
    burgers: [
      { id:'b1', name:'Classic Smash', img:'img/classicBurger.png', desc:'Steak 150g, cheddar, salade, tomate, sauce maison', price:8.90, bg:'bg-burger' },
      { id:'b2', name:'Double Cheese', img:'img/doubleCheese.png', desc:'2 steaks, double cheddar, cornichons, oignon grillé', price:11.90, bg:'bg-burger' },
      { id:'b3', name:'BBQ Bacon', img:'img/bbqBurger.png', desc:'Steak 180g, bacon, cheddar, oignons frits, sauce BBQ', price:13.90, bg:'bg-burger' },
      { id:'b4', name:'Chicken Crispy', img:'img/cryspychickenB.png', desc:'Poulet pané, salade, tomate, mayo épicée', price:10.90, bg:'bg-burger' },
      { id:'b5', name:'Veggie Deluxe', img:'img/veggieB.png', desc:'Steak végétal, avocat, roquette, sauce tahini', price:10.50, bg:'bg-burger' },
      { id:'b6', name:'Le Monstre', img:'img/leMonstreburger.png', desc:'Triple steak, triple cheddar, bacon, jalapeños', price:16.90, bg:'bg-burger' }
    ],
    sides: [
      { id:'s1', name:'Frites Maison', img:'img/frites.png', desc:'Frites fraîches, sel de mer', price:3.90, bg:'bg-side' },
      { id:'s2', name:'Sweet Potatoes', img:'img/sweetpoteto.png', desc:'Patate douce, paprika fumé', price:4.50, bg:'bg-side' },
      { id:'s3', name:'Onion Rings', img:'img/oignonRing.png', desc:'Oignons panés, sauce ranch', price:4.90, bg:'bg-side' },
      { id:'s4', name:'Nuggets x8', img:'img/nuggets.png', desc:'Croustillants, 3 sauces', price:6.50, bg:'bg-side' },
      { id:'s5', name:'Mozza Sticks', img:'img/mozzaStick.png', desc:'Mozza fondante, marinara', price:5.90, bg:'bg-side' },
      { id:'s6', name:'Coleslaw', img:'img/Coleslaw.png', desc:'Chou, carotte, mayo légère', price:3.50, bg:'bg-side' }
    ],
    desserts: [
      { id:'d1', name:'Cookie Géant', img:'img/cookie.png', desc:'Chocolat noir & lait, cœur fondant', price:3.50, bg:'bg-dessert' },
      { id:'d2', name:'Brownie', img:'img/brownie.png', desc:'Chocolat intense, noix de pécan', price:4.50, bg:'bg-dessert' },
      { id:'d3', name:'Sundae Caramel', img:'img/sundae.png', desc:'Vanille, caramel, chantilly', price:5.50, bg:'bg-dessert' },
      { id:'d4', name:'Churros x5', img:'img/Churros.png', desc:'Cannelle, sauce chocolat', price:5.90, bg:'bg-dessert' },
      { id:'d5', name:'Cheesecake', img:'img/cheeseCake.png', desc:'NY cheesecake, fruits rouges', price:5.50, bg:'bg-dessert' },
      { id:'d6', name:'Donut Glazed', img:'img/donut.png', desc:'Glaçage chocolat ou fraise', price:2.90, bg:'bg-dessert' }
    ],
    boissons: [
      { id:'dr1', name:'Coca-Cola', img:'img/coca.png', desc:'33cl', price:2.50, bg:'bg-drink' },
      { id:'dr2', name:'Sprite', img:'img/sprite.png', desc:'33cl', price:2.50, bg:'bg-drink' },
      { id:'dr3', name:'Ice Tea', img:'img/iceTea.png', desc:'Pêche', price:2.90, bg:'bg-drink' },
      { id:'dr4', name:'Milkshake', img:'img/Milkshake.png', desc:'Vanille, choco, fraise, Oreo', price:5.90, bg:'bg-drink' },
      { id:'dr5', name:'Jus d\'Orange', img:'img/jusOrange.png', desc:'Pressé minute', price:3.90, bg:'bg-drink' },
      { id:'dr6', name:'Eau', img:'img/eau.png', desc:'Plate ou gazeuse 50cl', price:1.90, bg:'bg-drink' }
    ]
  };
  const BS = [
    { ...MENU.burgers[0], cat:'burgers', tag:'#1' },
    { ...MENU.burgers[2], cat:'burgers', tag:'Top' },
    { ...MENU.burgers[5], cat:'burgers', tag:'!!!' },
    { ...MENU.sides[3], cat:'sides', tag:'Side' },
    { ...MENU.desserts[3], cat:'desserts', tag:'Sweet' },
    { ...MENU.boissons[3], cat:'boissons', tag:'Drink' }
  ];
  const FEE = 2.99;
  let cart=[], orderMode='livraison', currentCat='burgers', modalItem=null, modalQty=1;

  function show(id) {
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('bottom-nav').style.display=['home-screen','menu-screen','profile-screen'].includes(id)?'flex':'none';
  }
  function toast(m,t=''){const e=document.getElementById('toast');e.textContent=m;e.className='toast show '+t;setTimeout(()=>e.className='toast',2500);}
  function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function find(cat,id){return MENU[cat].find(i=>i.id===id);}
  function sub(){return cart.reduce((s,c)=>s+c.price*c.qty,0);}
  function count(){return cart.reduce((s,c)=>s+c.qty,0);}

  // HOME
  function loadHome() {
    const c=document.getElementById('bestseller-carousel');
    c.innerHTML=BS.map(i=>`<div class="bs-card" data-id="${i.id}" data-cat="${i.cat}"><div class="bs-badge">${i.tag}</div><div class="bs-visual ${i.bg}"><img src="${i.img}" alt="${i.name}" loading="lazy"></div><div class="bs-body"><div class="bs-name">${i.name}</div><div class="bs-footer"><span class="bs-price">${i.price.toFixed(2)}\u20AC</span><button class="bs-add" data-id="${i.id}" data-cat="${i.cat}">+</button></div></div></div>`).join('');
    c.querySelectorAll('.bs-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('.bs-add'))return;openMenu(card.dataset.cat);}));
    c.querySelectorAll('.bs-add').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();addToCart(b.dataset.cat,b.dataset.id,1);toast(find(b.dataset.cat,b.dataset.id).name+' ajouté','success');}));
    loadOrders();
  }
  async function loadOrders(){
    const orders=await DB.getAllDeliveries();orders.sort((a,b)=>b.created-a.created);
    const list=document.getElementById('delivery-list'),label=document.getElementById('recent-label');
    if(!orders.length){list.innerHTML='';label.style.display='none';return;}
    label.style.display='';
    list.innerHTML=orders.slice(0,3).map(o=>`<div class="delivery-card"><div class="delivery-card-header"><span class="delivery-id">#${o.id.slice(0,8).toUpperCase()}</span><span class="delivery-status status-${o.status}">${{preparing:'En prépa',transit:'En route',delivered:'Livré'}[o.status]}</span></div><div class="delivery-items-preview">${esc((o.items||[]).map(i=>i.qty+'x '+i.name).join(', '))}</div><div class="delivery-card-footer"><span class="delivery-date">${new Date(o.created).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span><span class="delivery-total">${(o.total||0).toFixed(2)} \u20AC</span></div></div>`).join('');
  }

  // MENU
  function openMenu(cat){show('menu-screen');document.querySelectorAll('.cat-tab').forEach(t=>t.classList.toggle('active',t.dataset.cat===cat));renderCat(cat);updateFC();}
  function renderCat(cat){
    currentCat=cat;const g=document.getElementById('app-menu-grid');
    g.innerHTML=MENU[cat].map(i=>`<div class="m-card" data-id="${i.id}" data-cat="${cat}"><div class="m-card-visual ${i.bg}"><img src="${i.img}" alt="${i.name}" loading="lazy"></div><div class="m-card-body"><div class="m-card-name">${i.name}</div><div class="m-card-desc">${i.desc}</div><div class="m-card-footer"><span class="m-card-price">${i.price.toFixed(2)}\u20AC</span><button class="m-card-add" data-id="${i.id}" data-cat="${cat}">+</button></div></div></div>`).join('');
    g.querySelectorAll('.m-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('.m-card-add'))return;openModal(card.dataset.cat,card.dataset.id);}));
    g.querySelectorAll('.m-card-add').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();addToCart(b.dataset.cat,b.dataset.id,1);toast(find(b.dataset.cat,b.dataset.id).name+' ajouté','success');}));
  }
  function openModal(cat,id){
    const i=find(cat,id);if(!i)return;modalItem={...i,cat};modalQty=1;
    document.getElementById('im-emoji').innerHTML=`<img src="${i.img}" alt="${i.name}">`;
    document.getElementById('im-name').textContent=i.name;document.getElementById('im-desc').textContent=i.desc;
    document.getElementById('im-price').textContent=i.price.toFixed(2)+'\u20AC';document.getElementById('im-qty').textContent='1';
    document.getElementById('item-modal').classList.add('active');
  }

  // CART
  function addToCart(cat,id,qty){const i=find(cat,id);if(!i)return;const x=cart.find(c=>c.id===id);if(x)x.qty+=qty;else cart.push({id,name:i.name,img:i.img,price:i.price,qty});updateFC();document.getElementById('menu-badge').textContent=count();}
  function updateFC(){const fc=document.getElementById('floating-cart'),n=count();fc.classList.toggle('visible',n>0);document.getElementById('fc-count').textContent=n+(n>1?' articles':' article');document.getElementById('fc-total').innerHTML=sub().toFixed(2)+' \u20AC';}
  function renderCart(){
    const list=document.getElementById('cart-list');
    if(!cart.length){list.innerHTML='<div class="cart-empty-state"><span>&#127828;</span><p>Panier vide</p></div>';document.getElementById('cart-summary').style.display='none';document.getElementById('btn-to-mode').disabled=true;return;}
    document.getElementById('cart-summary').style.display='';document.getElementById('btn-to-mode').disabled=false;
    list.innerHTML=cart.map(c=>`<div class="cart-item"><div class="cart-item-emoji"><img src="${c.img}" alt="${c.name}"></div><div class="cart-item-info"><div class="cart-item-name">${c.name}</div><div class="cart-item-price">${(c.price*c.qty).toFixed(2)} \u20AC</div></div><div class="cart-item-controls"><button class="cart-qty-btn ${c.qty===1?'remove':''}" data-id="${c.id}" data-d="-1">${c.qty===1?'\u{1F5D1}':'\u2212'}</button><span class="cart-qty">${c.qty}</span><button class="cart-qty-btn" data-id="${c.id}" data-d="1">+</button></div></div>`).join('');
    list.querySelectorAll('.cart-qty-btn').forEach(b=>b.addEventListener('click',()=>{const i=cart.find(c=>c.id===b.dataset.id);if(!i)return;i.qty+=parseInt(b.dataset.d);if(i.qty<=0)cart=cart.filter(c=>c.id!==b.dataset.id);renderCart();updateFC();}));
    const fee=orderMode==='livraison'?FEE:0,total=sub()+fee;
    document.getElementById('cs-subtotal').innerHTML=sub().toFixed(2)+' \u20AC';
    document.getElementById('cs-fee').innerHTML=fee.toFixed(2)+' \u20AC';document.getElementById('cs-fee-row').style.display=fee?'':'none';
    document.getElementById('cs-total').innerHTML=total.toFixed(2)+' \u20AC';
  }

  // MODE → CHECKOUT
  function selectMode(mode){
    orderMode=mode;
    const labels={livraison:'Livraison',collect:'Click & Collect',surplace:'Sur place'};
    const icons={livraison:'\u{1F69A}',collect:'\u{1F3C3}',surplace:'\u{1F37D}'};
    document.getElementById('chosen-mode-bar').innerHTML=`<span>${icons[mode]}</span> ${labels[mode]}`;
    document.getElementById('fg-address').style.display=mode==='livraison'?'':'none';
    document.getElementById('fg-table').style.display=mode==='surplace'?'':'none';
    document.getElementById('pay-info').style.display=mode==='livraison'?'':'none';
    const fee=mode==='livraison'?FEE:0;
    document.getElementById('checkout-total').innerHTML=(sub()+fee).toFixed(2)+' \u20AC';
    document.getElementById('checkout-title').textContent=labels[mode];
    show('checkout-screen');
  }

  // CONFIRM ORDER
  async function confirmOrder(){
    const name=document.getElementById('f-name').value.trim();
    const phone=document.getElementById('f-phone').value.trim();
    const address=document.getElementById('f-address').value.trim();
    const table=document.getElementById('f-table').value.trim();
    const notes=document.getElementById('f-notes').value.trim();
    if(!name||!phone){toast('Prénom et téléphone requis','error');return;}
    if(orderMode==='livraison'&&!address){toast('Adresse requise','error');return;}
    if(orderMode==='surplace'&&!table){toast('N° de table requis','error');return;}
    if(!cart.length)return;
    const fee=orderMode==='livraison'?FEE:0,total=sub()+fee;
    const id=Crypto.generateId();
    const items=cart.map(c=>({name:c.name,qty:c.qty,price:c.price}));
    const mLabels={livraison:'Livraison',collect:'Click & Collect',surplace:'Sur place'};
    const order={id,recipient:name,phone,address,table,items,notes,mode:orderMode,modeLabel:mLabels[orderMode],deliveryFee:fee,total,status:'preparing',created:Date.now()};
    await DB.saveDelivery(order);
    // QR
    const secret=genCode();
    const enc=await Crypto.encryptWithPassword({v:3,id:order.id,r:name,p:phone,a:address,i:items,m:orderMode,tot:total,t:order.created},secret);
    showConfirm(order,'SE1:'+enc,secret);
    cart=[];
    document.querySelectorAll('#checkout-screen .form-input, #checkout-screen .form-textarea').forEach(el=>el.value='');
  }
  function genCode(){const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';const b=crypto.getRandomValues(new Uint8Array(6));for(const x of b)c+=ch[x%ch.length];return c;}

  function showConfirm(order,qr,secret){
    show('confirm-screen');
    document.getElementById('confirm-id').textContent='#'+order.id.slice(0,8).toUpperCase();
    document.getElementById('confirm-card').innerHTML=`
      <div class="confirm-line"><span class="confirm-label">Client</span><span>${esc(order.recipient)}</span></div>
      <div class="confirm-line"><span class="confirm-label">Articles</span><span>${esc(order.items.map(i=>i.qty+'x '+i.name).join(', '))}</span></div>
      <div class="confirm-line"><span class="confirm-label">Mode</span><span>${esc(order.modeLabel)}</span></div>
      ${order.address?`<div class="confirm-line"><span class="confirm-label">Adresse</span><span>${esc(order.address)}</span></div>`:''}
      <div class="confirm-line"><span class="confirm-label">Paiement</span><span>${orderMode==='livraison'?'Au livreur (TPE CB/espèces)':'Au comptoir'}</span></div>
      <div class="confirm-line total"><span>Total</span><span>${order.total.toFixed(2)} \u20AC</span></div>`;
    const now=new Date(),min=orderMode==='livraison'?30:orderMode==='collect'?15:10,max=orderMode==='livraison'?45:orderMode==='collect'?25:15;
    const fmt=d=>d.getHours().toString().padStart(2,'0')+'h'+d.getMinutes().toString().padStart(2,'0');
    document.getElementById('eta-time').textContent='entre '+fmt(new Date(now.getTime()+min*60000))+' et '+fmt(new Date(now.getTime()+max*60000));
    document.getElementById('confirm-eta').querySelector('.eta-icon').textContent=orderMode==='livraison'?'\u{1F69A}':orderMode==='collect'?'\u{1F3C3}':'\u{1F37D}';
    const notes={livraison:'Le livreur vous appelle 5 min avant. Vous payez à la porte, CB ou espèces.',collect:'On vous prévient quand c\'est prêt. Passez au comptoir.',surplace:'C\'est en route vers votre table.'};
    document.getElementById('confirm-note').textContent=notes[orderMode];
    try{const mx=QR.generate(qr,'L');QR.renderCanvas(mx,document.getElementById('qr-canvas'),{moduleSize:4,margin:3});}catch(e){}
  }

  // PROFILE
  async function loadProfile(){
    const u=await DB.getSetting('user');
    if(u){document.getElementById('profile-name').textContent=u.first;document.getElementById('profile-avatar').textContent=u.first.charAt(0).toUpperCase();document.getElementById('p-first').value=u.first||'';document.getElementById('p-email').value=u.email||'';document.getElementById('p-phone').value=u.phone||'';}
  }
  async function saveProfile(){
    const f=document.getElementById('p-first').value.trim(),e=document.getElementById('p-email').value.trim(),p=document.getElementById('p-phone').value.trim();
    if(!f){toast('Prénom requis','error');return;}
    await DB.setSetting('user',{first:f,email:e,phone:p});
    document.getElementById('profile-name').textContent=f;document.getElementById('profile-avatar').textContent=f.charAt(0).toUpperCase();
    toast('Profil sauvegardé','success');
  }

  // INIT
  async function init(){
    await DB.init();show('home-screen');loadHome();

    // Bottom nav
    document.querySelectorAll('.bnav-item').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.bnav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');
      const t=b.dataset.tab;show(t+'-screen');
      if(t==='home')loadHome();if(t==='menu'){renderCat(currentCat);updateFC();}if(t==='profile')loadProfile();
    }));

    // Quick actions
    document.querySelectorAll('.quick-card').forEach(c=>c.addEventListener('click',()=>{orderMode=c.dataset.mode;openMenu('burgers');}));
    document.getElementById('btn-profile').addEventListener('click',()=>{document.querySelectorAll('.bnav-item').forEach(x=>x.classList.remove('active'));document.querySelector('.bnav-item[data-tab="profile"]').classList.add('active');show('profile-screen');loadProfile();});

    // Menu
    document.getElementById('menu-back').addEventListener('click',()=>{show('home-screen');loadHome();});
    document.querySelectorAll('.cat-tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.cat-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');renderCat(t.dataset.cat);}));
    document.getElementById('menu-cart-btn').addEventListener('click',()=>{show('cart-screen');renderCart();});
    document.getElementById('fc-btn').addEventListener('click',()=>{show('cart-screen');renderCart();});

    // Modal
    document.getElementById('im-minus').addEventListener('click',()=>{if(modalQty>1){modalQty--;document.getElementById('im-qty').textContent=modalQty;}});
    document.getElementById('im-plus').addEventListener('click',()=>{modalQty++;document.getElementById('im-qty').textContent=modalQty;});
    document.getElementById('im-add').addEventListener('click',()=>{if(!modalItem)return;addToCart(modalItem.cat,modalItem.id,modalQty);toast(modalQty+'x '+modalItem.name+' ajouté','success');document.getElementById('item-modal').classList.remove('active');});
    document.getElementById('item-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('item-modal').classList.remove('active');});

    // Cart → Mode → Checkout → Confirm
    document.getElementById('cart-back').addEventListener('click',()=>{show('menu-screen');updateFC();});
    document.getElementById('btn-to-mode').addEventListener('click',()=>{if(!cart.length)return;show('mode-screen');});
    document.getElementById('mode-back').addEventListener('click',()=>{show('cart-screen');renderCart();});
    document.querySelectorAll('.mode-card').forEach(c=>c.addEventListener('click',()=>selectMode(c.dataset.mode)));
    document.getElementById('checkout-back').addEventListener('click',()=>show('mode-screen'));
    document.getElementById('btn-confirm').addEventListener('click',confirmOrder);
    document.getElementById('btn-go-home').addEventListener('click',()=>{document.querySelectorAll('.bnav-item').forEach(x=>x.classList.remove('active'));document.querySelector('.bnav-item[data-tab="home"]').classList.add('active');show('home-screen');loadHome();});

    // Partager l'app
    document.getElementById('btn-share-app').addEventListener('click',async()=>{
      const url='https://secure-eats.vercel.app';
      const text='Je commande mes burgers sur SecurEats — même chose que Uber mais 7€ moins cher. Teste : '+url;
      if(navigator.share){try{await navigator.share({title:'SecurEats',text,url});}catch(e){}}
      else{await navigator.clipboard.writeText(text);toast('Lien copié !','success');}
    });

    // Profile
    document.getElementById('profile-back').addEventListener('click',()=>{show('home-screen');loadHome();});
    document.getElementById('btn-save-profile').addEventListener('click',saveProfile);

    if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

    // === INSTALL PROMPT ===
    let deferredPrompt = null;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = localStorage.getItem('install-dismissed');

    if (!isStandalone && !dismissed) {
      // Android : intercepter l'événement natif
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('install-banner').classList.add('show');
      });

      // iOS : détecter Safari et afficher le guide
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        setTimeout(() => document.getElementById('install-banner').classList.add('show'), 2000);
      }

      document.getElementById('btn-install').addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
          document.getElementById('install-banner').classList.remove('show');
        } else if (isIOS) {
          document.getElementById('install-banner').classList.remove('show');
          document.getElementById('ios-modal').classList.add('active');
        }
      });

      document.getElementById('btn-install-dismiss').addEventListener('click', () => {
        document.getElementById('install-banner').classList.remove('show');
        localStorage.setItem('install-dismissed', '1');
      });

      document.getElementById('btn-ios-ok').addEventListener('click', () => {
        document.getElementById('ios-modal').classList.remove('active');
      });
    }
  }
  return{init};
})();
document.addEventListener('DOMContentLoaded',App.init);
