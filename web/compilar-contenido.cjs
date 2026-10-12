const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname,'temas');
const topics = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir,f),'utf8').replace(/^\uFEFF/,''))).sort((a,b) => a.number-b.number);
const pending = {id:'pendiente',number:0,title:'Tu espacio de estudio',conceptLabels:{},cards:[],cases:[],map:null};
const data = {subjects:[{id:'gestion-proyectos',title:'Gestión y Dirección de Proyectos',topics:topics.length ? topics : [pending]}]};
fs.writeFileSync(path.join(__dirname,'dist','contenido.js'),'// Generado desde web/temas.\nglobalThis.StudyContent = '+JSON.stringify(data,null,2)+';\n');
console.log(topics.length ? `${topics.length} temas compilados.` : 'Estructura lista. Temario pendiente.');
