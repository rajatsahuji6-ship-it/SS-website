const sb=supabase.createClient(SS_CONFIG.SUPABASE_URL,SS_CONFIG.SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sections=[],products=[],images=[],currentSection=null;

async function fetchData(){
 const [a,b,c]=await Promise.all([
  sb.from("sections").select("*").order("is_pinned",{ascending:false}).order("display_order"),
  sb.from("products").select("*").order("is_pinned",{ascending:false}).order("display_order"),
  sb.from("product_images").select("*").order("display_order")
 ]);
 sections=a.data||[]; products=b.data||[]; images=c.data||[];
}
const productImage=p=>images.find(x=>x.product_id===p.id)?.image_url||p.image_url||"";

function productCard(p){
 return `<article class="product-card" onclick="openProduct(${p.id})">
 <div class="product-photo">${p.is_pinned?'<span class="badge">✦ PINNED</span>':""}<img src="${esc(productImage(p))}" alt="${esc(p.name)}"></div>
 <h3>${esc(p.name)}</h3><p>Discover this piece →</p></article>`;
}

async function renderHome(){
 await fetchData();
 $("#home").classList.remove("hidden");
 $("#collectionGrid").innerHTML=sections.length?sections.map(s=>{
  const fallback=productImage(products.find(p=>p.section_id===s.id)||{});
  return `<article class="collection-card" onclick="openCollection(${s.id})">
  <img src="${esc(s.cover_image_url||fallback)}" alt="${esc(s.name)}">
  <div class="overlay">${s.is_pinned?'<span class="badge">✦ PINNED COLLECTION</span>':""}<h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><b>Explore collection →</b></div></article>`;
 }).join(""):"<p>No collections yet.</p>";
 const pinned=products.filter(p=>p.is_pinned);
 $("#featuredSection").classList.toggle("hidden",!pinned.length);
 $("#featuredGrid").innerHTML=pinned.map(productCard).join("");
}

function openCollection(id){
 currentSection=id;
 $("#home").classList.add("hidden");
 const s=sections.find(x=>x.id===id);
 $("#collections").classList.add("hidden"); $("#featuredSection").classList.add("hidden"); $("#productView").classList.add("hidden");
 $("#collectionView").classList.remove("hidden");
 $("#collectionContent").innerHTML=`<div class="page-heading"><p class="eyebrow">COLLECTION</p><h1>${esc(s.name)}</h1><p>${esc(s.description)}</p><button class="button" onclick="shareCollection(${s.id})">Share collection</button></div>
 <div class="product-grid">${products.filter(p=>p.section_id===id).map(productCard).join("")}</div>`;
 scrollTo(0,0);
}
function showCollections(){
 $("#home").classList.remove("hidden");
 $("#collectionView").classList.add("hidden"); $("#productView").classList.add("hidden"); $("#collections").classList.remove("hidden");
 if(products.some(p=>p.is_pinned))$("#featuredSection").classList.remove("hidden"); scrollTo(0,0);
}
$("#allCollections").onclick=showCollections;

function openProduct(id){
 $("#home").classList.add("hidden");
 const p=products.find(x=>x.id===id); let pics=images.filter(x=>x.product_id===id);
 if(!pics.length&&p.image_url)pics=[{image_url:p.image_url}];
 $("#collectionView").classList.add("hidden"); $("#collections").classList.add("hidden"); $("#featuredSection").classList.add("hidden"); $("#productView").classList.remove("hidden");
 $("#productContent").innerHTML=`<div class="product-detail"><div><div class="main-image"><img id="mainImage" src="${esc(pics[0]?.image_url||"")}"></div>
 <div class="thumbnails">${pics.map((x,n)=>`<img class="${n?"":"active"}" src="${esc(x.image_url)}" onclick="changeImage(this)">`).join("")}</div></div>
 <div class="product-copy">${p.is_pinned?'<span class="badge">✦ FEATURED PICK</span>':""}<p class="eyebrow">S&S SELECTION</p><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p>
 <a class="button primary shop-button" href="${esc(p.product_link)}" target="_blank" rel="noopener">Shop now ↗</a>
 <div class="actions"><button class="button" onclick="shareProduct()">Share</button><button class="button" onclick="saveProduct(${p.id},this)">♡ Save</button></div></div></div>`;
 scrollTo(0,0);
}
$("#backToCollection").onclick=()=>openCollection(currentSection);
function changeImage(el){$("#mainImage").src=el.src;document.querySelectorAll(".thumbnails img").forEach(x=>x.classList.remove("active"));el.classList.add("active")}

async function shareCollection(id){
 const s=sections.find(x=>x.id===id);
 const url=`${location.origin}${location.pathname}#collection-${id}`;
 const payload={title:`S&S — ${s.name}`,text:`Explore the ${s.name} collection on S&S`,url};
 if(navigator.share){
  try{await navigator.share(payload)}catch(e){if(e.name!=="AbortError")console.error(e)}
 }else{
  await navigator.clipboard.writeText(url);
  alert("Collection link copied");
 }
}

async function shareProduct(){if(navigator.share)await navigator.share({title:"S&S Selection",url:location.href});else{await navigator.clipboard.writeText(location.href);alert("Link copied")}}
function saveProduct(id,btn){let w=JSON.parse(localStorage.getItem("ss-wishlist")||"[]");w=w.includes(id)?w.filter(x=>x!==id):[...w,id];localStorage.setItem("ss-wishlist",JSON.stringify(w));btn.textContent=w.includes(id)?"♥ Saved":"♡ Save"}

$("#productImages").onchange=()=>{const n=$("#productImages").files.length;$("#fileCount").textContent=n?`${n} image(s) selected`:"No images selected"};

$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("ss-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("ss-theme")==="dark")document.body.classList.add("dark");

async function route(){const admin=location.hash==="#admin";$("#publicSite").classList.toggle("hidden",admin);$("#adminSite").classList.toggle("hidden",!admin);admin?checkAuth():renderHome()}
async function checkAuth(){const{data:{session}}=await sb.auth.getSession();$("#loginPanel").classList.toggle("hidden",!!session);$("#dashboard").classList.toggle("hidden",!session);if(session)renderAdmin()}
$("#loginForm").onsubmit=async ev=>{ev.preventDefault();const{error}=await sb.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});$("#loginMessage").textContent=error?.message||"";checkAuth()};
$("#logoutBtn").onclick=async()=>{await sb.auth.signOut();checkAuth()};

async function uploadFile(file,folder){
 const path=`${folder}/${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
 const r=await sb.storage.from(SS_CONFIG.STORAGE_BUCKET).upload(path,file); if(r.error)throw r.error;
 return sb.storage.from(SS_CONFIG.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
async function renderAdmin(){
 await fetchData();
 $("#productCollection").innerHTML='<option value="">Choose collection</option>'+sections.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
 $("#collectionAdminList").innerHTML=sections.map(s=>`<div class="admin-row"><img src="${esc(s.cover_image_url||"")}"><div class="grow"><b>${esc(s.name)}</b><br><small>${s.is_pinned?"Pinned":"Not pinned"}</small></div><button class="mini" onclick="pinCollection(${s.id},${!s.is_pinned})">${s.is_pinned?"Unpin":"Pin"}</button><button class="mini danger" onclick="deleteCollection(${s.id})">Delete</button></div>`).join("");
 $("#productAdminList").innerHTML=products.map(p=>`<div class="admin-row"><img src="${esc(productImage(p))}"><div class="grow"><b>${esc(p.name)}</b><br><small>${p.is_pinned?"Pinned":"Not pinned"}</small></div><button class="mini" onclick="pinProduct(${p.id},${!p.is_pinned})">${p.is_pinned?"Unpin":"Pin"}</button><button class="mini danger" onclick="deleteProduct(${p.id})">Delete</button></div>`).join("");
}
$("#collectionForm").onsubmit=async ev=>{ev.preventDefault();try{message("Uploading cover…");const url=await uploadFile($("#collectionCover").files[0],"sections");const{error}=await sb.from("sections").insert({name:$("#collectionName").value,description:$("#collectionDescription").value||null,cover_image_url:url,is_pinned:$("#collectionPinned").checked,display_order:+$("#collectionOrder").value||0});if(error)throw error;ev.target.reset();message("Collection created.");renderAdmin()}catch(err){message(err.message)}};
$("#productForm").onsubmit=async ev=>{ev.preventDefault();try{const files=[...$("#productImages").files];if(!files.length)throw new Error("Select at least one product image.");const urls=[];for(let i=0;i<files.length;i++){message(`Uploading image ${i+1} of ${files.length}…`);urls.push(await uploadFile(files[i],"products"));}const{data:p,error}=await sb.from("products").insert({section_id:+$("#productCollection").value,name:$("#productName").value,description:$("#productDescription").value||null,product_link:$("#productLink").value,image_url:urls[0],is_pinned:$("#productPinned").checked,display_order:+$("#productOrder").value||0}).select().single();if(error)throw error;const{error:imageError}=await sb.from("product_images").insert(urls.map((u,n)=>({product_id:p.id,image_url:u,display_order:n})));if(imageError)throw imageError;ev.target.reset();$("#fileCount").textContent="No images selected";message(`Product added with ${urls.length} photo(s).`);renderAdmin()}catch(err){message(err.message)}};
async function pinCollection(id,value){const{error}=await sb.from("sections").update({is_pinned:value}).eq("id",id);message(error?.message||"Collection updated.");renderAdmin()}
async function pinProduct(id,value){const{error}=await sb.from("products").update({is_pinned:value}).eq("id",id);message(error?.message||"Product updated.");renderAdmin()}
async function deleteCollection(id){if(confirm("Delete this collection and its products?")){const{error}=await sb.from("sections").delete().eq("id",id);message(error?.message||"Deleted.");renderAdmin()}}
async function deleteProduct(id){if(confirm("Delete this product?")){const{error}=await sb.from("products").delete().eq("id",id);message(error?.message||"Deleted.");renderAdmin()}}
function message(text){$("#adminMessage").textContent=text}
async function handleRoute(){
 const match=location.hash.match(/^#collection-(\d+)$/);
 if(match){
  $("#publicSite").classList.remove("hidden");
  $("#adminSite").classList.add("hidden");
  await fetchData();
  openCollection(Number(match[1]));
 }else{
  route();
 }
}
addEventListener("hashchange",handleRoute);handleRoute();