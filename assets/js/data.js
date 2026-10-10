export const STORAGE_KEY='solo-business-404-demo-v1';
export function seedData(){
 return {
  meta:{version:1,company:'Mi estudio',owner:'Alex Martín',currency:'EUR',theme:'dark',accent:'mint'},
  clients:[
   {id:'CL-001',name:'Clara Soler',company:'Atelier Soler',email:'clara@example.test',phone:'600 000 101',nif:'',type:'Empresa',since:'2026-01-15'},
   {id:'CL-002',name:'Pablo Herrera',company:'Norte Studio',email:'pablo@example.test',phone:'600 000 102',nif:'',type:'Empresa',since:'2026-02-09'},
   {id:'CL-003',name:'Lucía Torres',company:'',email:'lucia@example.test',phone:'600 000 103',nif:'',type:'Particular',since:'2026-03-22'},
   {id:'CL-004',name:'Marc Vidal',company:'Vidal & Co.',email:'marc@example.test',phone:'600 000 104',nif:'',type:'Empresa',since:'2026-04-10'},
   {id:'CL-005',name:'Inés Roca',company:'Roca Interiorismo',email:'ines@example.test',phone:'600 000 105',nif:'',type:'Empresa',since:'2026-04-25'}
  ],
  quotes:[
   {id:'PRE-2026-001',clientId:'CL-001',title:'Rediseño de identidad de marca',subtotal:2450,tax:21,status:'Aceptado',date:'2026-10-01'},
   {id:'PRE-2026-002',clientId:'CL-002',title:'Landing de campaña',subtotal:1800,tax:21,status:'Enviado',date:'2026-10-03'},
   {id:'PRE-2026-003',clientId:'CL-004',title:'Mantenimiento trimestral',subtotal:960,tax:21,status:'Borrador',date:'2026-10-07'},
   {id:'PRE-2026-004',clientId:'CL-005',title:'Consultoría y análisis',subtotal:1250,tax:21,status:'Aceptado',date:'2026-10-09'}
  ],
  jobs:[
   {id:'TR-001',clientId:'CL-001',title:'Diseño de marca Atelier Soler',hours:14,rate:65,status:'En curso',progress:68,date:'2026-10-01'},
   {id:'TR-002',clientId:'CL-002',title:'Landing Norte Studio',hours:18,rate:60,status:'En curso',progress:35,date:'2026-10-04'},
   {id:'TR-003',clientId:'CL-003',title:'Soporte informático',hours:4,rate:50,status:'Completado',progress:100,date:'2026-10-06'},
   {id:'TR-004',clientId:'CL-005',title:'Auditoría de presencia digital',hours:10,rate:75,status:'Pendiente',progress:10,date:'2026-10-10'}
  ],
  invoices:[
   {id:'SIM-001',clientId:'CL-001',title:'Diseño · octubre',subtotal:2450,tax:21,status:'Pendiente',date:'2026-10-02',due:'2026-10-23',paid:0},
   {id:'SIM-002',clientId:'CL-003',title:'Soporte técnico',subtotal:380,tax:21,status:'Pagado',date:'2026-10-04',due:'2026-10-18',paid:459.8},
   {id:'SIM-003',clientId:'CL-004',title:'Mantenimiento y soporte',subtotal:960,tax:21,status:'Pendiente',date:'2026-10-05',due:'2026-10-20',paid:0},
   {id:'SIM-004',clientId:'CL-005',title:'Servicios de consultoría',subtotal:1250,tax:21,status:'Borrador',date:'2026-10-10',due:'2026-10-25',paid:0}
  ],
  expenses:[
   {id:'G-001',title:'Suscripciones de software',supplier:'Herramientas de trabajo',amount:129.9,category:'Software',date:'2026-10-02'},
   {id:'G-002',title:'Material de oficina',supplier:'Papelería Ejemplo',amount:72.5,category:'Material',date:'2026-10-04'},
   {id:'G-003',title:'Servicio de alojamiento',supplier:'Proveedor de hosting',amount:38.4,category:'Servicios',date:'2026-10-06'},
   {id:'G-004',title:'Desplazamientos',supplier:'Movilidad',amount:63.2,category:'Viajes',date:'2026-10-09'}
  ],
  tasks:[
   {id:'TA-001',title:'Revisar propuesta de Norte Studio',date:'2026-10-12',priority:'Alta',done:false},
   {id:'TA-002',title:'Reunión con Atelier Soler',date:'2026-10-13',priority:'Media',done:false},
   {id:'TA-003',title:'Enviar documentación de proyecto',date:'2026-10-15',priority:'Media',done:false},
   {id:'TA-004',title:'Preparar presupuesto trimestral',date:'2026-10-09',priority:'Baja',done:true}
  ],
  activity:[
   {id:'A1',title:'Presupuesto aceptado',detail:'Atelier Soler',date:'2026-10-10',kind:'quote'},
   {id:'A2',title:'Borrador creado',detail:'Roca Interiorismo',date:'2026-10-10',kind:'invoice'},
   {id:'A3',title:'Gasto registrado',detail:'Desplazamientos',date:'2026-10-09',kind:'expense'}
  ]
 };
}
