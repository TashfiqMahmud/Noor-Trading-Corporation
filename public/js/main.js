(function(){
  // ── Money formatter ───────────────────────────────────────
  function money(n){
    return '\u09F3' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function esc(s){
    return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  window.NTCFmt = {money, esc};

  // ── Cart badge ────────────────────────────────────────────
  function updateBadges(){
    const n = window.NTCCart ? NTCCart.getItemCount() : 0;
    document.querySelectorAll('[data-cart-count]').forEach(el=>{
      el.textContent = n;
      el.style.display = n > 0 ? 'flex' : 'none';
    });
  }
  window.addEventListener('ntc:cart-updated', updateBadges);

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, type='ok'){
    let stack = document.querySelector('.toast-stack');
    if(!stack){ stack=document.createElement('div'); stack.className='toast-stack'; document.body.appendChild(stack); }
    const t = document.createElement('div');
    t.className = 'toast' + (type==='err'?' err':'');
    const icon = type==='err'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="tick"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="tick"><polyline points="20 6 9 17 4 12"/></svg>';
    t.innerHTML = icon + '<span></span>';
    t.querySelector('span').textContent = msg;
    stack.appendChild(t);
    setTimeout(()=>{ t.style.transition='opacity 200ms'; t.style.opacity='0'; setTimeout(()=>t.remove(),220); }, 2800);
  }
  window.NTCToast = toast;

  // ── Stars ─────────────────────────────────────────────────
  function stars(n){
    n = n||0;
    let s='';
    for(let i=1;i<=5;i++) s += i<=n ? '★' : '☆';
    return '<div class="stars">'+s+'</div>';
  }
  window.NTCStars = stars;

  // ── Product card builder (Medistore-style) ────────────────
  function productCard(p){
    const disc = p.compareAtPrice && p.compareAtPrice > p.price
      ? Math.round((1-p.price/p.compareAtPrice)*100) : 0;
    const inStock = p.inStock !== false;

    return `<div class="product-card">
  <a href="/product.html?slug=${esc(p.slug)}" class="product-cat-label">${esc(p.categoryName||'')}</a>
  <a href="/product.html?slug=${esc(p.slug)}" class="product-img-wrap" style="display:flex">
    <img src="${esc(p.imageUrl||'/images/products/placeholder.svg')}" alt="${esc(p.name)}" loading="lazy"/>
    ${disc>=5 ? `<span class="badge-sale">Sale!</span>` : ''}
    ${p.isFeatured ? `<span class="badge-featured">Featured</span>` : ''}
    ${!inStock ? `<div class="badge-oos"><span>OUT OF STOCK</span></div>` : ''}
  </a>
  <div class="product-body">
    ${stars(0)}
    <div class="product-name"><a href="/product.html?slug=${esc(p.slug)}">${esc(p.name)}</a></div>
    <div class="product-price-wrap">
      ${disc>=5 ? `<span class="product-price-old">${money(p.compareAtPrice)}</span>` : ''}
      <span class="product-price">${money(p.price)}</span>
    </div>
  </div>
  <div class="product-actions">
    ${inStock
      ? `<div class="qty-wrap">
           <div class="qty" data-pid="${p.id}">
             <button type="button" onclick="stepQty(this,-1)">−</button>
             <input type="number" value="1" min="1" max="${p.stockQuantity||99}"/>
             <button type="button" onclick="stepQty(this,1)">+</button>
           </div>
         </div>
         <button class="btn-cart" onclick="addCard(this,${p.id},'${esc(p.name).replace(/'/g,'&#39;')}')">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
           Add to cart
         </button>`
      : `<a href="/product.html?slug=${esc(p.slug)}" class="btn-readmore">Read more</a>`}
  </div>
</div>`;
  }
  window.NTCCard = productCard;

  // ── Qty helpers ───────────────────────────────────────────
  window.stepQty = function(btn,dir){
    const q=btn.closest('.qty'), i=q.querySelector('input');
    const v=parseInt(i.value)||1, mn=parseInt(i.min)||1, mx=parseInt(i.max)||999;
    i.value=Math.min(mx,Math.max(mn,v+dir));
  };
  window.addCard = function(btn,pid,name){
    const q=btn.closest('.product-actions').querySelector('.qty input');
    const qty=q?parseInt(q.value)||1:1;
    NTCCart.addItem(pid,qty);
    NTCToast('\u201c'+name+'\u201d added to cart');
  };

  // ── Category nav loader ───────────────────────────────────
  async function loadCatNav(){
    try {
      const res = await fetch(apiUrl('/api/categories'));
      const cats = await res.json();
      const nav = document.getElementById('cat-nav-list');
      if(!nav) return;
      nav.innerHTML =
        '<a href="/shop.html" class="all-products">All Products</a>' +
        cats.map(c=>`<a href="/shop.html?category=${esc(c.slug)}">${esc(c.name)}</a>`).join('');
      const footerCats = document.getElementById('footer-cats');
      if(footerCats){
        footerCats.innerHTML = '<li><a href="/shop.html">All Products</a></li>' +
          cats.map(c=>`<li><a href="/shop.html?category=${esc(c.slug)}">${esc(c.name)}</a></li>`).join('');
      }
    } catch(e){}
  }

  // ── Mobile menu ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded',()=>{
    updateBadges();
    loadCatNav();
    const tog = document.querySelector('[data-menu-toggle]');
    const panel = document.querySelector('[data-mobile-nav]');
    if(tog && panel) tog.addEventListener('click',()=>panel.classList.toggle('open'));
    document.querySelectorAll('[data-search-form]').forEach(f=>{
      f.addEventListener('submit',e=>{
        e.preventDefault();
        const q=(f.querySelector('input[name=q]')?.value||'').trim();
        const url=new URL('/shop.html',location.origin);
        if(q) url.searchParams.set('q',q);
        location.href=url.toString();
      });
    });
  });
})();
