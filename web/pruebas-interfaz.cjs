// Prueba lógica de las cuatro actividades en los seis temas.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = name => fs.readFileSync(path.join(__dirname,'dist',name),'utf8');
const element = () => ({innerHTML:'',textContent:'',value:'',hidden:false,dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){},focus(){},querySelector(){return null;},showModal(){this.open=true;},close(){this.open=false;}});
const ids = new Map([...read('index.html').matchAll(/id="([^"]+)"/g)].map(match => [match[1],element()]));
const tabs = ['tarjetas','casos','mapa','test'].map(view => Object.assign(element(),{dataset:{view}}));
const selectors = new Map([['.pestanas',element()],['.indice',element()]]);
const entries = new Map([['aleaciones-progreso-v1','dato original intacto']]);
const storage = {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
const context = vm.createContext({document:{getElementById:id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id);},querySelector:s=>selectors.get(s),querySelectorAll:()=>tabs},window:{localStorage:storage,addEventListener(){}},setInterval(){},URL:{createObjectURL:()=> 'blob:prueba',revokeObjectURL(){}},Blob});
for (const file of ['contenido.js','progreso.js','app.js']) vm.runInContext(read(file),context);
assert.match(ids.get('panel').innerHTML,/Repaso pendiente/);
assert.match(ids.get('estadisticas').innerHTML,/0 \/ 32/);
for (let number=1;number<=6;number++) {
 ids.get('tema').listeners.change({target:{value:`gep-t${number}`}});
 for (const [view,title] of [['casos','Situación inicial'],['mapa','Reconstruye las relaciones'],['tarjetas','Repaso pendiente'],['test','Comprueba lo que recuerdas']]) {
   selectors.get('.pestanas').listeners.click({target:{closest:()=>tabs.find(t=>t.dataset.view===view)}});
   assert.match(ids.get('panel').innerHTML,new RegExp(title));
 }
 const click=action=>ids.get('panel').listeners.click({target:{closest:()=>({dataset:{action}})}});
 const question=context.StudyContent.subjects[0].topics[number-1].tests[0];
 ids.get('panel').listeners.input({target:{dataset:{test:question.id},value:String(question.correct)}});
 click('check-test');assert.match(ids.get('panel').innerHTML,/1 aciertos · 0 errores · 5 sin responder/);
 click('retry-test');assert.doesNotMatch(ids.get('panel').innerHTML,/Puntuación: /);
}
ids.get('exportar').listeners.click();
const exported = JSON.parse(ids.get('texto-copia').value);
assert.equal(exported.app,'gestion-proyectos');
assert.match(ids.get('descargar-copia').download,/^gestion-proyectos-progreso-/);
assert.equal(ids.get('copia-progreso').open,true);
const oldCopy = JSON.stringify({...exported,app:'aleaciones'});
assert.throws(()=>context.StudyProgress.mergeImport(context.StudyProgress.fresh(),oldCopy));
context.StudyProgress.save(storage,context.StudyProgress.fresh());
assert.ok(entries.has('gestion-proyectos-progreso-v1'));
assert.equal(entries.get('aleaciones-progreso-v1'),'dato original intacto');
console.log('24 vistas, corrección y reinicio de tests, exportación e independencia del progreso comprobados.');
