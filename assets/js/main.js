import {initCloud} from './cloud.js';
import {documentTotals,legacyDocumentLines} from './document.js';
import {jobTotals} from './work.js';
import {quoteTotals,quoteLegacyLines} from './quote.js';
import {createStore,invoiceTotal} from './store.js';
import {icon} from './icons.js';
import {routeInfo,viewPage} from './views.js';
import {escapeHtml as h,eur,today,initials,round2} from './utils.js';

const store=createStore();
const app=document.getElementById('app');
let currentPage='dashboard';
let isMenuOpen=false;
let activeModal=null;
let searchText='';
let filterText='';
const navGroups=[
 {title:'ESPACIO DE TRABAJO',items:[['dashboard','Vista general'],['clients','Clientes'],['quotes','Presupuestos'],['jobs','Trabajos']]},
 {title:'FINANZAS Y CONTROL',items:[['invoices','Documentos'],['expenses','Gastos'],['payments','Cobros'],['reports','Informes']]},
 {title:'TU ESPACIO',items:[['agenda','Agenda'],['settings','Configuración']]}
];
const navLabel=page=>routeInfo[page]?.[0]||'Vista general';
function readPage(){const p=location.hash.replace(/^#\/?/,'').split(/[/?]/)[0];return routeInfo[p]?p:'dashboard';}
function buttonRoute(page,label){return `<a href="#/${page}" class="nav-link ${currentPage===page?'is-active':''}" ${currentPage===page?'aria-current="page"':''}><span class="nav-icon">${icon(routeInfo[page][2],19)}</span><span>${label}</span>${page==='agenda'?`<span class="nav-count">${store.get().tasks.filter(t=>!t.done).length}</span>`:''}</a>`;}
function render(){
 currentPage=readPage();const s=store.get();
 document.body.dataset.theme=s.meta.theme;document.body.dataset.accent=s.meta.accent;
 const sidebar=navGroups.map(g=>`<div class="nav-group"><div class="nav-group-label">${g.title}</div>${g.items.map(([p,label])=>buttonRoute(p,label)).join('')}</div>`).join('');
 app.innerHTML=`<div class="mobile-shade ${isMenuOpen?'visible':''}" data-action="close-menu"></div><aside class="sidebar ${isMenuOpen?'menu-open':''}"><a class="brand" href="#/dashboard" aria-label="SOLO BUSINESS 404 Inicio"><span class="brand-symbol"><span class="brand-cut"></span></span><span class="brand-copy"><b>SOLO<span>BUSINESS</span></b><small>WORKSPACE / 404</small></span></a><div class="sidebar-body"><div class="workspace-select"><div class="workspace-square">${icon('briefcase',19)}</div><div class="workspace-label"><strong>${h(s.meta.company)}</strong><small>Espacio personal</small></div>${icon('chevrondown',16)}</div>${sidebar}</div><div class="sidebar-bottom"><div class="side-promo"><div class="side-promo-icon">${icon('spark',18)}</div><div class="side-promo-title">Tu negocio.<br><em>En buenas manos.</em></div><p>Organiza el trabajo. Gana perspectiva. Crece a tu ritmo.</p><span>EDICIÓN DE PRUEBA · 0.9.7</span></div><div class="side-user"><span class="user-avatar">${h(initials(s.meta.owner))}</span><span><b>${h(s.meta.owner)}</b><small>Administrador · demo</small></span><a href="#/settings" aria-label="Configuración de perfil">${icon('settings',18)}</a></div></div></aside>
 <div class="workspace"><header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" data-action="open-menu" aria-label="Abrir menú">${icon('menu',22)}</button><div class="breadcrumb">Workspace <span>/</span> <strong>${h(navLabel(currentPage))}</strong></div></div><div class="topbar-right"><button class="global-search" data-action="open-search">${icon('search',17)} <span>Buscar en tu negocio…</span><kbd>Ctrl K</kbd></button><span class="top-separator"></span><button class="icon-button" data-action="toggle-theme" aria-label="Cambiar tema" title="Cambiar modo">${icon(s.meta.theme==='dark'?'sun':'moon',19)}</button><button class="icon-button notification-button" data-action="notifications" aria-label="Notificaciones de demo" title="Avisos">${icon('bell',19)}<span class="notification-dot"></span></button><span class="top-avatar">${h(initials(s.meta.owner))}</span></div></header>
 <main id="main" class="main-container"><div class="page-titlebar"><div><span class="page-kicker">SOLO BUSINESS <span>✦</span> 404</span><div class="page-headrow"><h1>${h(navLabel(currentPage))}</h1><span class="demo-badge">${icon('info',13)} DEMO LOCAL</span></div><p>${h(routeInfo[currentPage][1])}</p></div><div class="page-actions"><span class="local-status"><span class="live-dot"></span> Datos locales</span><button class="btn btn-top" data-action="quick-add">${icon('plus',17)} Crear nuevo ${icon('chevrondown',14)}</button></div></div>${currentPage!=='dashboard'&&currentPage!=='settings'&&currentPage!=='reports'?`<div class="page-tools"><label class="list-search">${icon('search',17)}<input id="view-filter" type="search" value="${h(filterText)}" placeholder="Filtrar ${h(navLabel(currentPage).toLowerCase())}…" aria-label="Filtrar registros de esta vista" autocomplete="off"></label><span class="tool-hint">Datos de prueba · Nube opcional beta</span></div>`:''}<div id="view-content">${viewPage(currentPage,s,filterText)}</div><footer class="app-footer"><span>© 2026 SOLO BUSINESS 404 <span class="footer-sep">/</span> v0.9.7 RC · Modo remoto experimental</span><span>${icon('shield',15)} Sin emisión fiscal · Sin servicios externos</span></footer></main></div>${store.getPersistenceError()?`<div role="alert" class="storage-warning" style="position:fixed;bottom:12px;left:12px;right:12px;z-index:9999;background:#7f1d1d;color:white;border:2px solid white;border-radius:10px;padding:14px 18px;box-shadow:0 6px 24px #0006">⚠ El almacenamiento local requiere atención: los cambios NO se están guardando (${h(store.getPersistenceError())}). Exporta una copia JSON antes de cerrar la pestaña.</div>`:''}<div id="toast-region" class="toast-region" aria-live="polite"></div>`;
}
function syncView(){const v=document.getElementById('view-content');if(v)v.innerHTML=viewPage(currentPage,store.get(),filterText);}
store.subscribe(()=>render());
window.addEventListener('hashchange',()=>{filterText='';isMenuOpen=false;closeModal();render();window.scrollTo(0,0);});
if(!location.hash)history.replaceState(null,'','#/dashboard');
render();

function showToast(message,type='success'){
 let box=document.getElementById('toast-region');if(!box)return;
 const node=document.createElement('div');node.className=`toast toast-${type}`;node.innerHTML=`${icon(type==='error'?'alert':'check',18)} <span>${h(message)}</span><button aria-label="Cerrar aviso" data-action="dismiss-toast">${icon('x',16)}</button>`;box.append(node);
 setTimeout(()=>{if(node.isConnected)node.remove()},4500);
}
let modalReturnFocus=null;
function closeModal(){document.getElementById('modal-host')?.remove();activeModal=null;document.body.classList.remove('modal-open');if(modalReturnFocus?.isConnected)modalReturnFocus.focus();modalReturnFocus=null;}
function openModal(title,body,opts={}){
 const returnFocus=document.activeElement;closeModal();modalReturnFocus=returnFocus;activeModal=opts.kind||'informational';const host=document.createElement('div');host.id='modal-host';host.className='modal-overlay';
 host.innerHTML=`<div class="modal-backdrop" data-action="close-modal"></div><section class="modal-window ${opts.large?'modal-large':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><div class="eyebrow">SOLO BUSINESS / DEMO</div><h2 id="modal-title">${h(title)}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Cerrar ventana">${icon('x',20)}</button></header><div class="modal-body">${body}</div></section>`;
 document.body.append(host);document.body.classList.add('modal-open');host.querySelector('input:not([type="hidden"]),select,button')?.focus();
}
const clientOptions=()=>`<option value="">Selecciona cliente</option>${store.get().clients.filter(c=>c.status!=='Archivado').map(c=>`<option value="${h(c.id)}">${h(c.company||c.name)}</option>`).join('')}`;
const text=(name,label,placeholder='',type='text',extra='')=>`<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" placeholder="${h(placeholder)}" ${extra}></label>`;
const select=(name,label,options)=>`<label class="form-field"><span>${label}</span><select name="${name}" required>${options}</select></label>`;
const money=(name,label,val='')=>text(name,label,'0,00','number',`min="0" max="100000000" step="0.01" required value="${val}"`);
const fieldForm=(kind,contents,submit='Guardar registro',notice='Estos datos se guardan solo en tu navegador.')=>`<form id="entity-form" data-kind="${kind}"><div class="form-grid">${contents}</div><p class="form-notice">${icon('info',16)} ${notice}</p><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">${icon('check',17)} ${submit}</button></div></form>`;
function openEntity(kind,preselect=''){
 const noClients=store.get().clients.length===0;
 if(['quote','job','invoice'].includes(kind)&&noClients){showToast('Primero necesitas dar de alta un cliente.','error');openEntity('client');return;}
 const clients=()=>select('clientId','Cliente *',clientOptions());
 const tax=()=>select('tax','IVA orientativo',`<option value="21">21 %</option><option value="10">10 %</option><option value="4">4 %</option><option value="0">0 %</option>`);
 const content={
  client:clientForm(),
  quote:quoteForm(),
  job:fieldForm('job',`${clients()}${text('title','Nombre del trabajo *','Ej. Soporte informático','text','required maxlength="170"')}${money('hours','Horas estimadas')}${money('rate','Tarifa/hora (€)')}`,'Crear trabajo'),
  invoice:fieldForm('invoice',`${clients()}${text('title','Concepto *','Ej. Servicios profesionales','text','required maxlength="170"')}${money('subtotal','Base imponible simulada (€)')}${tax()}${text('due','Vencimiento estimado','','date',`required value="${today()}"`)}`,'Crear documento SIM','IMPORTANTE: documento simulado sin validez fiscal. No se emite factura legal.'),
  expense:fieldForm('expense',`${text('title','Concepto del gasto *','Ej. Licencia software','text','required maxlength="170"')}${text('supplier','Proveedor','Ej. Servicios digitales','text','maxlength="140"')}${money('amount','Importe total (€)')}${select('category','Categoría',`<option>Software</option><option>Material</option><option>Servicios</option><option>Viajes</option><option>Otros</option>`)}${text('date','Fecha','','date',`required value="${today()}"`)}`,'Registrar gasto'),
  task:fieldForm('task',`${text('title','Tarea *','Ej. Llamar al cliente','text','required maxlength="170"')}${text('date','Fecha prevista','','date',`required value="${today()}"`)}${select('priority','Prioridad','<option>Media</option><option>Alta</option><option>Baja</option>')}`,'Crear tarea')
 };
 const titles={client:'Nuevo cliente',quote:'Nuevo presupuesto',job:'Nuevo trabajo',invoice:'Nuevo borrador SIM',expense:'Nuevo gasto',task:'Nueva tarea'};
 openModal(titles[kind],content[kind],{kind});
 if(preselect){const s=document.querySelector('#entity-form [name="clientId"]');if(s)s.value=preselect;}
}

function openJobDetail(id){
 const s=store.get(),j=s.jobs.find(x=>x.id===id);if(!j)throw Error('Trabajo no encontrado.');const t=jobTotals(j);
 const entries=(j.entries||[]).map(e=>`<tr><td>${h(e.date)}</td><td>${h(e.kind==='hour'?'Horas':'Material')}</td><td>${h(e.description)}</td><td>${h(e.quantity)}</td><td>${eur(e.quantity*e.unitCost)}</td><td>${j.status==='Completado'?'—':`<button class="table-btn" data-action="delete-work-entry" data-id="${h(j.id)}" data-value="${h(e.id)}">Quitar</button>`}</td></tr>`).join('');
 const stateOptions=['Pendiente','En curso','Completado'].map(x=>`<option ${j.status===x?'selected':''}>${x}</option>`).join('');
 openModal(`Trabajo ${j.id}`,`<p><strong>${h(j.title)}</strong> · ${h(s.clients.find(c=>c.id===j.clientId)?.company||s.clients.find(c=>c.id===j.clientId)?.name||'Cliente')}</p>${j.quoteId?`<p>Presupuesto vinculado: <b>${h(j.quoteId)}</b></p>`:''}
 <div class="work-stats"><div><small>Ingresos previstos</small><b>${eur(t.income)}</b></div><div><small>Coste horas</small><b>${eur(t.labor)}</b></div><div><small>Materiales</small><b>${eur(t.materials)}</b></div><div><small>Margen bruto previsto</small><b>${eur(t.profit)} (${t.margin}%)</b></div></div>
 <form id="job-control" data-id="${h(j.id)}"><div class="form-grid">${text('title','Nombre del trabajo','','text',`required maxlength="170" value="${h(j.title)}"`)}${money('budget','Ingreso previsto (€)',t.income)}${money('hours','Horas estimadas',j.hours)}${money('rate','Tarifa estimada (€ / h)',j.rate)}<label class="form-field"><span>Avance (%)</span><input type="number" name="progress" min="0" max="100" step="1" value="${j.progress}" required></label></div><div class="modal-footer"><button class="btn btn-primary" type="submit">Guardar trabajo y avance</button></div></form>
 <h3>Partes de trabajo (${(j.entries||[]).length})</h3><div class="table-wrap"><table><thead><tr><th>FECHA</th><th>TIPO</th><th>DESCRIPCIÓN</th><th>CANTIDAD</th><th>COSTE</th><th></th></tr></thead><tbody>${entries||'<tr><td colspan="6">Aún no hay partes.</td></tr>'}</tbody></table></div>
 ${j.status==='Completado'?'<p class="form-notice">Trabajo cerrado: para modificarlo, pulsa Reabrir.</p><button class="btn btn-outline" data-action="reopen-job" data-id="'+h(j.id)+'">Reabrir trabajo</button>':`<form id="work-entry-form" data-id="${h(j.id)}"><h3>Añadir horas o materiales</h3><div class="form-grid"><label class="form-field"><span>Tipo</span><select name="kind"><option value="hour">Horas</option><option value="material">Material</option></select></label>${text('description','Descripción','','text','required maxlength="180"')}${money('quantity','Horas / unidades',1)}${money('unitCost','Coste unitario (€)',0)}${text('date','Fecha','','date',`required value="${today()}"`)}</div><div class="modal-footer"><button class="btn btn-primary" type="submit">Registrar parte</button></div></form>`}
 <p class="form-notice">Rentabilidad orientativa: ingresos previstos menos costes directos introducidos. No incluye impuestos, costes indirectos ni gastos generales.</p>`,{kind:'job-detail',large:true});
}
function quoteLine(row={}){
 const v=(k,f='')=>h(row[k]??f);
 return `<div class="quote-line"><label>Concepto<input required name="description" maxlength="170" placeholder="Ej. Soporte técnico" value="${v('description')}"></label><label>Cantidad<input required name="quantity" type="number" min="0.01" max="100000" step="0.01" value="${v('quantity',1)}"></label><label>Precio (€)<input required name="price" type="number" min="0" max="10000000" step="0.01" value="${v('price',0)}"></label><label>Dto. %<input required name="discount" type="number" min="0" max="100" step="0.01" value="${v('discount',0)}"></label><label>IVA %<select name="tax">${[21,10,4,0].map(n=>`<option value="${n}" ${Number(row.tax??21)===n?'selected':''}>${n}%</option>`).join('')}</select></label><button type="button" class="table-btn" data-action="remove-quote-line">Quitar</button></div>`;
}
function quoteForm(q=null){
 const lines=q?quoteLegacyLines(q):[{description:'',quantity:1,price:0,discount:0,tax:21}];
 return `<form id="entity-form" data-kind="${q?'quote-edit':'quote'}" class="quote-form"><input type="hidden" name="id" value="${h(q?.id||'')}"><div class="form-grid"><label class="form-field"><span>Cliente *</span><select name="clientId" required>${clientOptions()}</select></label>${text('title','Título del presupuesto *','Ej. Instalación y mantenimiento','text',`required maxlength="170" value="${h(q?.title||'')}"`)}${text('validUntil','Válido hasta','','date',`value="${h(q?.validUntil||'')}"`)}</div><h3>Conceptos y servicios</h3><div id="quote-lines">${lines.map(quoteLine).join('')}</div><button class="btn btn-outline" type="button" data-action="add-quote-line">+ Añadir línea</button><div class="quote-calculation" id="quote-calculation" aria-live="polite"></div><label class="form-field"><span>Condiciones y observaciones</span><textarea name="notes" maxlength="2000" rows="3" placeholder="Plazos, condiciones y alcance">${h(q?.notes||'')}</textarea></label><p class="form-notice">Presupuesto de prueba. El PDF se obtiene mediante Imprimir → Guardar como PDF, sin valor fiscal.</p><div class="modal-footer"><button class="btn btn-outline" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar presupuesto</button></div></form>`;
}
function getQuoteLines(form){return [...form.querySelectorAll('.quote-line')].map(row=>Object.fromEntries(['description','quantity','price','discount','tax'].map(name=>[name,row.querySelector(`[name="${name}"]`)?.value])));}
function updateQuotePreview(){const form=document.querySelector('.quote-form');const target=document.getElementById('quote-calculation');if(!form||!target)return;try{const t=quoteTotals(getQuoteLines(form));target.innerHTML=`<span>Base: <b>${eur(t.base)}</b></span><span>IVA: <b>${eur(t.vat)}</b></span><strong>Total: ${eur(t.total)}</strong>`;}catch{target.textContent='Comprueba los importes y conceptos.';}}
function openQuoteEditor(id=null){const q=id?store.get().quotes.find(x=>x.id===id):null;if(id&&!q)throw Error('No se encontró el presupuesto.');if(q&&q.status!=='Borrador')throw Error('Solo se editan borradores.');openModal(q?'Editar presupuesto':'Nuevo presupuesto',quoteForm(q),{kind:'quote',large:true});const select=document.querySelector('.quote-form [name="clientId"]');if(q)select.value=q.clientId;updateQuotePreview();}
function printQuote(id){const s=store.get(),q=s.quotes.find(x=>x.id===id);if(!q)throw Error('Presupuesto no encontrado.');const c=s.clients.find(x=>x.id===q.clientId);const t=quoteTotals(quoteLegacyLines(q));const safe=h;const w=window.open('','_blank');if(!w)throw Error('Permite ventanas emergentes para imprimir el presupuesto.');const rows=t.items.map(line=>`<tr><td>${safe(line.description)}</td><td>${line.quantity}</td><td>${eur(line.price)}</td><td>${line.discount}%</td><td>${line.tax}%</td><td>${eur(line.total)}</td></tr>`).join('');w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Presupuesto ${safe(q.id)}</title><style>body{font:14px system-ui;color:#17202e;max-width:850px;margin:40px auto;padding:0 20px}header{display:flex;justify-content:space-between;border-bottom:3px solid #157d72;padding-bottom:24px}h1{margin:0}table{width:100%;border-collapse:collapse;margin:32px 0}td,th{border-bottom:1px solid #ddd;padding:12px 6px;text-align:left}th{background:#eee}.total{text-align:right;font-size:20px}aside{margin-top:55px;color:#555}.badge{background:#fff3cf;padding:12px} @media print{body{margin:12mm auto}.no-print{display:none}}</style></head><body><header><div><h1>${safe(s.meta.company)}</h1><p>Documento de prueba · No es factura</p></div><div><h2>PRESUPUESTO</h2><b>${safe(q.id)}</b><p>${safe(q.date)}</p></div></header><p><b>Cliente:</b> ${safe(c?.company||c?.name||'')}<br>${safe(c?.name||'')}<br>${safe(c?.nif||'')}</p><p><b>Asunto:</b> ${safe(q.title)}<br><b>Validez:</b> ${safe(q.validUntil||'No indicada')}</p><table><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Dto.</th><th>IVA</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Base: ${eur(t.base)}<br>IVA: ${eur(t.vat)}<br><b>Total: ${eur(t.total)}</b></div><aside><p>${safe(q.notes||'')}</p><p class="badge">DOCUMENTO DE DEMOSTRACIÓN. Presupuesto no aceptado electrónicamente; sin emisión de factura.</p></aside><p class="no-print"><button onclick="window.print()">Imprimir / Guardar como PDF</button></p></body></html>`);w.document.close();}
function clientForm(client=null){
 const val=(key)=>h(client?.[key]||'');const type=client?.type||'Empresa';
 const textField=(key,label,mode='text')=>`<label class="form-field"><span>${label}</span><input name="${key}" type="${mode}" maxlength="${key==='notes'?2000:150}" value="${val(key)}" ${key==='name'?'required':''}></label>`;
 const people=client?.contacts||[];
 return fieldForm(client?'client-edit':'client',`<input type="hidden" name="id" value="${h(client?.id||'')}">${textField('name','Nombre y apellidos *')}${textField('company','Empresa o nombre comercial')}${textField('email','Correo electrónico','email')}${textField('phone','Teléfono','tel')}${textField('nif','NIF / NIE / CIF (opcional)')}${select('type','Tipo de cliente',`<option value="Empresa" ${type==='Empresa'?'selected':''}>Empresa</option><option value="Particular" ${type==='Particular'?'selected':''}>Particular</option>`)}<label class="form-field"><span>Etiquetas (separadas por comas)</span><input name="tags" maxlength="500" value="${h((client?.tags||[]).join(', '))}" placeholder="VIP, recurrente, mantenimiento"></label><label class="form-field full-field"><span>Notas internas</span><textarea name="notes" maxlength="2000" rows="3">${val('notes')}</textarea></label><div class="form-field full-field"><span>Otros contactos</span><div id="extra-contacts">${people.map(contactRow).join('')}</div><button type="button" class="btn btn-outline" data-action="add-contact">+ Añadir contacto</button></div>`,client?'Guardar cambios':'Crear cliente','Identificadores españoles: comprobación de formato y dígito de control. No se verifica titularidad.');
}
function contactRow(c={}){return `<div class="contact-extra"><input aria-label="Nombre del contacto" placeholder="Nombre" maxlength="120" data-contact="name" value="${h(c.name||'')}"><input aria-label="Email del contacto" placeholder="Email" type="email" maxlength="200" data-contact="email" value="${h(c.email||'')}"><input aria-label="Teléfono del contacto" placeholder="Teléfono" maxlength="60" data-contact="phone" value="${h(c.phone||'')}"><button type="button" class="table-btn" data-action="remove-contact">Quitar</button></div>`;}
function openClientEdit(id){const c=store.get().clients.find(c=>c.id===id);if(!c)throw Error('Cliente no encontrado.');openModal('Editar cliente',clientForm(c),{kind:'client-edit',large:true});}
function openClientDetail(id){const s=store.get(),c=s.clients.find(c=>c.id===id);if(!c)throw Error('Cliente no encontrado.');const linked=[...s.quotes.filter(x=>x.clientId===id).map(x=>'Presupuesto · '+x.title),...s.jobs.filter(x=>x.clientId===id).map(x=>'Trabajo · '+x.title),...s.invoices.filter(x=>x.clientId===id).map(x=>'SIM · '+x.title)];openModal('Ficha de cliente',`<div class="client-detail"><h3>${h(c.company||c.name)}</h3><p>${h(c.name)} · ${h(c.type)} · ${h(c.status||'Activo')}</p><p>${h(c.email||'Sin email')} · ${h(c.phone||'Sin teléfono')} · ${h(c.nif||'Sin identificador')}</p><p><strong>Etiquetas:</strong> ${h((c.tags||[]).join(', ')||'Ninguna')}</p><p><strong>Notas:</strong> ${h(c.notes||'Sin notas')}</p><h4>Contactos adicionales</h4>${(c.contacts||[]).map(x=>`<p>${h(x.name)} · ${h(x.email)} · ${h(x.phone)}</p>`).join('')||'<p>Ninguno</p>'}<h4>Historial de registros vinculados</h4>${linked.map(x=>`<p>${h(x)}</p>`).join('')||'<p>Sin registros vinculados</p>'}<div class="modal-footer"><button class="btn btn-outline" data-action="delete-client" data-id="${h(id)}">Eliminar si no tiene registros</button><button class="btn btn-primary" data-action="edit-client" data-id="${h(id)}">Editar ficha</button></div></div>`,{kind:'client-detail',large:true});}

function openSearch(){
 searchText='';openModal('Búsqueda rápida',`<div class="command-box"><div class="command-input-wrap">${icon('search',21)}<input id="command-input" type="search" placeholder="Busca un cliente, trabajo, presupuesto…" autocomplete="off" aria-label="Búsqueda general"></div><div id="command-results"></div><div class="command-help">${icon('command',15)} Ctrl + K para abrir · Esc para cerrar</div></div>`,{kind:'search',large:true});
 updateSearchResults();document.getElementById('command-input')?.focus();
}
function updateSearchResults(){
 const q=searchText.trim().toLocaleLowerCase('es');const target=document.getElementById('command-results');if(!target)return;
 const items=[];const src=store.get();
 for(const [collection,route,name] of [['clients','clients','Cliente'],['quotes','quotes','Presupuesto'],['jobs','jobs','Trabajo'],['invoices','invoices','Documento SIM'],['expenses','expenses','Gasto'],['tasks','agenda','Tarea']])for(const e of src[collection]){
  const title=e.company||e.title||e.name||e.id;const subtitle=e.company?e.name:(e.id||'');
  if(!q||`${title} ${subtitle}`.toLocaleLowerCase('es').includes(q)){items.push({route,name,title,subtitle});}
 }
 const view=items.slice(0,9);target.innerHTML=`<div class="command-caption">${q?'RESULTADOS EN TU ESPACIO':'ACCESO RÁPIDO'}</div>${view.length?view.map(item=>`<button class="command-result" data-action="search-go" data-value="${item.route}"><span class="result-icon">${icon(routeInfo[item.route]?.[2]||'grid',18)}</span><span><strong>${h(item.title)}</strong><small>${h(item.name)} · ${h(item.subtitle)}</small></span>${icon('arrow',16)}</button>`).join(''):`<div class="search-empty">No hay coincidencias. Prueba con otro término.</div>`}`;
}
function openQuickAdd(){openModal('¿Qué quieres crear?',`<div class="quick-grid">${[['client','people','Cliente','Añadir un contacto'],['quote','file','Presupuesto','Preparar una propuesta'],['job','briefcase','Trabajo','Organizar un encargo'],['invoice','receipt','Borrador SIM','Documento no fiscal'],['expense','wallet','Gasto','Anotar un coste'],['task','calendar','Tarea','Planificar una acción']].map(([name,ico,label,help])=>`<button class="quick-tile" data-action="new-${name}"><span>${icon(ico,23)}</span><strong>${label}</strong><small>${help}</small></button>`).join('')}</div>`,{kind:'quick',large:true});}
function openGuide(){openModal('Bienvenido a SOLO BUSINESS 404',`<div class="guide-content"><div class="guide-mark">${icon('spark',32)}</div><p>Estás explorando la <b>versión 0.9.7 de demostración</b>. Puedes crear clientes, presupuestos, trabajos, gastos, tareas, documentos SIM y cobros simulados. Cada cambio queda en este navegador.</p><div class="guide-steps"><div><span>01</span><strong>Crea un cliente</strong><small>Centraliza su información.</small></div><div><span>02</span><strong>Prepara un presupuesto</strong><small>Márcalo como enviado y aceptado.</small></div><div><span>03</span><strong>Conviértelo en trabajo</strong><small>Controla su estado.</small></div><div><span>04</span><strong>Explora las simulaciones</strong><small>Los borradores no son facturas legales.</small></div></div><button class="btn btn-primary" data-action="close-modal">Entendido ${icon('check',17)}</button></div>`,{kind:'guide',large:true});}
function openNotifications(){const items=store.get().activity.slice(0,5);openModal('Actividad reciente',`<div class="activity-feed">${items.map(item=>`<div class="feed-row"><span class="feed-icon">${icon('bolt',17)}</span><div><strong>${h(item.title)}</strong><p>${h(item.detail)}</p><small>${h(item.date)}</small></div></div>`).join('')}</div>`,{kind:'activity'});}
function docLine(l={}){return `<div class="quote-line"><label>Concepto<input name="description" required maxlength="170" value="${h(l.description||'')}"></label><label>Cantidad<input name="quantity" type="number" min="0.01" step="0.01" required value="${l.quantity??1}"></label><label>Precio (€)<input name="price" type="number" min="0" step="0.01" required value="${l.price??0}"></label><label>Dto. %<input name="discount" type="number" min="0" max="100" step="0.01" value="${l.discount??0}"></label><label>IVA<select name="tax">${[0,4,10,21].map(n=>`<option value="${n}" ${n===(l.tax??21)?'selected':''}>${n}%</option>`).join('')}</select></label><button type="button" class="table-btn" data-action="remove-doc-line">Quitar</button></div>`;}
function docForm(i){const s=store.get();return `<form id="document-form" class="entity-form"><div class="warning-banner">SIMULACIÓN · Sin validez fiscal, sin numeración tributaria ni emisión AEAT.</div><label>Cliente<select name="clientId" required>${s.clients.filter(c=>c.status!=='Archivado').map(c=>`<option value="${h(c.id)}" ${i?.clientId===c.id?'selected':''}>${h(c.company||c.name)}</option>`).join('')}</select></label><label>Asunto<input name="title" required maxlength="170" value="${h(i?.title||'')}"></label><label>Vencimiento<input name="due" type="date" required value="${h(i?.due||today())}"></label><div id="doc-lines">${(i?legacyDocumentLines(i):[{description:'',quantity:1,price:0,discount:0,tax:21}]).map(docLine).join('')}</div><button type="button" class="btn btn-outline" data-action="add-doc-line">Añadir concepto</button><p id="doc-preview" aria-live="polite"></p><div class="modal-footer"><button class="btn btn-primary" type="submit">Guardar borrador SIM</button></div></form>`;}
function readDoc(form){return {clientId:form.elements.clientId.value,title:form.elements.title.value,due:form.elements.due.value,lines:[...form.querySelectorAll('#doc-lines .quote-line')].map(row=>Object.fromEntries(['description','quantity','price','discount','tax'].map(k=>[k,row.querySelector(`[name="${k}"]`).value]))) };}
function previewDoc(){const f=document.getElementById('document-form'),out=document.getElementById('doc-preview');if(!f||!out)return;try{const t=documentTotals(readDoc(f).lines);out.textContent=`Base: ${eur(t.base)} · IVA: ${eur(t.vat)} · Total: ${eur(t.total)}`;}catch{out.textContent='Revisa los conceptos.';}}
let editingDocument=null;
function openDocumentEditor(id=null){const i=id?store.get().invoices.find(x=>x.id===id):null;if(id&&(!i||i.status!=='Borrador'))throw Error('Solo se editan borradores SIM.');editingDocument=id;openModal(i?'Editar documento SIM':'Nuevo documento SIM',docForm(i),{kind:'document',large:true});previewDoc();}
function printDocument(id){const s=store.get(),i=s.invoices.find(x=>x.id===id);if(!i)throw Error('Documento no encontrado.');const t=documentTotals(legacyDocumentLines(i)),c=s.clients.find(x=>x.id===i.clientId),w=window.open('','_blank');if(!w)throw Error('Activa las ventanas emergentes para imprimir.');w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>SIM ${h(i.id)}</title><style>body{font:15px system-ui;max-width:850px;margin:40px auto;color:#17202e}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}.alert{padding:16px;background:#fff0cb;border:2px solid #9a6200}h1{color:#a04510}@media print{button{display:none}}</style><h1>DOCUMENTO SIMULADO — NO ES FACTURA</h1><p class="alert">Documento de prueba sin validez fiscal. No justifica operaciones ni pagos.</p><h2>${h(s.meta.company)}</h2><p>Cliente: ${h(c?.company||c?.name||'')} · ${h(c?.nif||'')}</p><p>Referencia SIM: ${h(i.id)} · Vencimiento orientativo: ${h(i.due)}</p><h3>${h(i.title)}</h3><table><tr><th>Concepto</th><th>Cantidad</th><th>Precio</th><th>Dto.</th><th>IVA</th><th>Total</th></tr>${t.items.map(x=>`<tr><td>${h(x.description)}</td><td>${x.quantity}</td><td>${eur(x.price)}</td><td>${x.discount}%</td><td>${x.tax}%</td><td>${eur(x.total)}</td></tr>`).join('')}</table><h2>Base ${eur(t.base)} · IVA ${eur(t.vat)} · Total ${eur(t.total)}</h2><button onclick="print()">Imprimir / Guardar como PDF</button>`);w.document.close();}
function openPayment(id){const inv=store.get().invoices.find(x=>x.id===id);if(!inv)return;const pending=round2(invoiceTotal(inv)-inv.paid);openModal('Simular cobro',`<div class="payment-summary"><small>Documento simulado</small><strong>${h(inv.id)} · ${h(inv.title)}</strong><span>Importe pendiente: <b>${eur(pending)}</b></span></div>${fieldForm('payment',`<input type="hidden" name="invoiceId" value="${h(inv.id)}">${money('amount','Importe del cobro (€)',pending)}`,'Registrar cobro simulado','Solo modifica los datos de demostración, sin conexión bancaria.')}`,{kind:'payment'});}
function askReset(){openModal('Restaurar datos de ejemplo',`<div class="confirm-content"><div class="confirm-icon">${icon('alert',25)}</div><p>Se reemplazarán todos los cambios locales por los datos originales de la demostración. Puedes hacer una exportación JSON antes de continuar.</p><div class="modal-footer"><button class="btn btn-outline" data-action="close-modal">Cancelar</button><button class="btn btn-danger" data-action="confirm-reset">Sí, restaurar demo</button></div></div>`,{kind:'confirm'});}
function exportData(){const blob=new Blob([JSON.stringify(store.get(),null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='solo-business-404-demo.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2500);showToast('Exportación JSON descargada.');}
function importData(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{
 try{const file=input.files?.[0];if(!file)return;if(file.size>5*1024*1024)throw Error('El archivo supera el límite de 5 MB.');store.restore(JSON.parse(await file.text()));closeModal();showToast('Datos de prueba importados correctamente.');}
 catch(err){showToast(`No se pudo importar: ${err.message}`,'error');}
 });input.click();}
function onAction(btn){const action=btn.dataset.action;const id=btn.dataset.id;const value=btn.dataset.value;
 try{switch(action){
 case 'open-menu':isMenuOpen=true;render();break;
 case 'close-menu':isMenuOpen=false;render();break;
 case 'close-modal':closeModal();break;
 case 'dismiss-toast':btn.closest('.toast')?.remove();break;
 case 'new-client':openEntity('client');break;
 case 'client-detail':openClientDetail(id);break;
 case 'edit-client':openClientEdit(id);break;
 case 'client-status':store.setClientStatus(id,value);showToast('Estado del cliente actualizado.');break;
 case 'delete-client':{if(!confirm('¿Eliminar este cliente sin registros vinculados? Esta acción no se puede deshacer.'))break;store.deleteClient(id);closeModal();showToast('Cliente eliminado.');break;}
 case 'add-contact':{const area=document.getElementById('extra-contacts');if(area&&area.children.length<20)area.insertAdjacentHTML('beforeend',contactRow());else showToast('Máximo 20 contactos.','error');break;}
 case 'remove-contact':btn.closest('.contact-extra')?.remove();break;
 case 'new-quote':openQuoteEditor();break;
 case 'edit-quote':openQuoteEditor(id);break;
 case 'print-quote':printQuote(id);break;
 case 'add-quote-line':{const area=document.getElementById('quote-lines');if(area.children.length>=40)throw Error('Máximo 40 líneas.');area.insertAdjacentHTML('beforeend',quoteLine());updateQuotePreview();break;}
 case 'remove-quote-line':{const area=document.getElementById('quote-lines');if(area.children.length<=1)throw Error('Se necesita al menos una línea.');btn.closest('.quote-line').remove();updateQuotePreview();break;}
 case 'new-job':openEntity('job');break;
 case 'job-detail':openJobDetail(id);break;
 case 'reopen-job':store.setJobStatus(id,'En curso');openJobDetail(id);break;
 case 'delete-work-entry':if(confirm('¿Quitar este parte de trabajo?')){store.removeWorkEntry(id,value);openJobDetail(id);}break;
 case 'new-invoice':openDocumentEditor();break;
 case 'edit-document':openDocumentEditor(id);break;
 case 'print-document':printDocument(id);break;
 case 'add-doc-line':{const a=document.getElementById('doc-lines');if(a.children.length>=40)throw Error('Máximo 40 conceptos.');a.insertAdjacentHTML('beforeend',docLine());previewDoc();break;}
 case 'remove-doc-line':{const a=document.getElementById('doc-lines');if(a.children.length<=1)throw Error('Debe quedar un concepto.');btn.closest('.quote-line').remove();previewDoc();break;}
 case 'new-expense':openEntity('expense');break;
 case 'new-task':openEntity('task');break;
 case 'quick-add':openQuickAdd();break;
 case 'open-search':openSearch();break;
 case 'search-go':closeModal();location.hash=`#/${value}`;break;
 case 'show-guide':openGuide();break;
 case 'notifications':openNotifications();break;
 case 'toggle-theme':store.updateMeta({theme:store.get().meta.theme==='dark'?'light':'dark'});break;
 case 'set-theme':store.updateMeta({theme:value});showToast('Apariencia actualizada.');break;
 case 'set-accent':store.updateMeta({accent:value});showToast('Color de acento actualizado.');break;
 case 'quote-status':store.setQuoteStatus(id,value);showToast('Estado del presupuesto actualizado.');break;
 case 'job-status':store.setJobStatus(id,value);showToast('Estado del trabajo actualizado.');break;
 case 'quote-to-job':store.createJobFromQuote(id);location.hash='#/jobs';showToast('Trabajo vinculado creado correctamente.');break;
 case 'toggle-task':store.toggleTask(id);showToast('Tarea actualizada.');break;
 case 'record-payment':openPayment(id);break;
 case 'export-data':exportData();break;
 case 'import-data':importData();break;
 case 'reset-data':askReset();break;
 case 'confirm-reset':store.reset();closeModal();showToast('Datos originales restaurados.');break;
 default:break;
 }}catch(err){showToast(err.message,'error');}
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(btn){e.preventDefault();onAction(btn);}});
document.addEventListener('submit',e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement))return;
 if(!['document-form','work-entry-form','job-control','settings-form','entity-form'].includes(form.getAttribute('id')))return;
 e.preventDefault();try{
  if(form.getAttribute('id')==='document-form'){const d=readDoc(form);if(editingDocument)store.updateInvoiceDraft(editingDocument,d);else store.addInvoiceDraft(d);closeModal();showToast('Documento SIM guardado.');return;}
  if(form.getAttribute('id')==='work-entry-form'){const d=Object.fromEntries(new FormData(form));const id=form.dataset.id;store.addWorkEntry(id,d);openJobDetail(id);showToast('Parte registrado.');return;}
  if(form.getAttribute('id')==='job-control'){const d=Object.fromEntries(new FormData(form));const id=form.dataset.id;store.updateJob(id,d);store.setJobProgress(id,Number(d.progress));openJobDetail(id);showToast('Trabajo actualizado.');return;}
  if(form.getAttribute('id')==='settings-form'){const fd=new FormData(form);const company=String(fd.get('company')||'').trim();const owner=String(fd.get('owner')||'').trim();if(!company||!owner)throw Error('Rellena el nombre y el negocio.');store.updateMeta({company,owner});showToast('Preferencias guardadas.');return;}
  if(form.getAttribute('id')!=='entity-form')return;
  const fd=new FormData(form);const data=Object.fromEntries(fd.entries());
  if(['client','client-edit'].includes(form.dataset.kind)){data.contacts=JSON.stringify([...form.querySelectorAll('.contact-extra')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-contact]')].map(input=>[input.dataset.contact,input.value]))).filter(x=>x.name.trim()));}
  const actions={client:'addClient',quote:'addQuote',job:'addJob',invoice:'addInvoiceDraft',expense:'addExpense',task:'addTask'};
  const kind=form.dataset.kind;
  if(kind==='client-edit'){store.updateClient(data.id,data);closeModal();showToast('Cliente actualizado.');return;}
  if(kind==='payment'){store.recordDemoPayment(data.invoiceId,data.amount);closeModal();showToast('Cobro simulado registrado.');return;}
  if(kind==='quote'||kind==='quote-edit'){data.lines=getQuoteLines(form);if(kind==='quote')store.addQuote(data);else store.updateQuote(data.id,data);closeModal();showToast('Presupuesto guardado.');return;}
  const method=actions[kind];if(!method)throw Error('Acción no disponible.');store[method](data);closeModal();showToast('Registro de demostración guardado correctamente.');
 }catch(err){showToast(err.message,'error');}
});
document.addEventListener('change',e=>{if(e.target.closest('.quote-form'))updateQuotePreview();});
document.addEventListener('input',e=>{if(e.target.closest('.quote-form'))updateQuotePreview();if(e.target.id==='command-input'){searchText=e.target.value;updateSearchResults();}if(e.target.id==='view-filter'){filterText=e.target.value;syncView();}});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}
 if(e.key==='Escape'&&activeModal)closeModal();
 if(e.key==='Tab'&&activeModal){const nodes=[...document.querySelectorAll('#modal-host button,#modal-host input:not([type="hidden"]),#modal-host select,#modal-host textarea,#modal-host a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);if(nodes.length){const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
});

document.addEventListener('input',e=>{if(e.target.closest?.('#document-form'))previewDoc();});
document.addEventListener('change',e=>{if(e.target.closest?.('#document-form'))previewDoc();});

initCloud(store);
