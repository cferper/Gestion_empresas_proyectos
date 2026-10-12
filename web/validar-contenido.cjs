const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const topics=fs.readdirSync(path.join(__dirname,'temas')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'temas',f),'utf8'))).sort((a,b)=>a.number-b.number);
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'fuentes.json'),'utf8'));
const bounds=[[6,33],[34,47],[48,85],[86,109],[110,125],[126,147]],ids=new Set();
assert.deepEqual(topics.map(t=>t.number),[1,2,3,4,5,6]);
function unique(id){assert.ok(id&&!ids.has(id),`ID duplicado: ${id}`);ids.add(id);}
function source(s,t){const file=inventory.find(f=>f.document===s.document);assert.ok(file,`Fuente desconocida: ${s.document}`);assert.ok(s.pdfPage>=1&&s.pdfPage<=file.pages);assert.ok(fs.existsSync(path.join(__dirname,'..',s.document)));if(s.document==='materiales/Libro GEP.pdf'){assert.ok(s.pdfPage>=bounds[t.number-1][0]&&s.pdfPage<=bounds[t.number-1][1]);assert.equal(Number(s.printedPage),s.pdfPage-5);}}
function activity(a,t){unique(a.id);assert.ok(a.concepts.length);a.concepts.forEach(c=>assert.ok(t.conceptLabels[c]));assert.ok(a.sources.length);a.sources.forEach(s=>source(s,t));}
for(const t of topics){unique(t.id);assert.ok(t.cards.length>=15);for(const c of t.cards){activity(c,t);assert.ok(c.question&&c.answer&&c.explanation);}for(const c of t.cases){activity(c,t);for(const key of ['elastic','elongation']){assert.ok(c.prompts[key]);assert.ok(c.predictionOptions[key].length>=2);}assert.ok(c.solution&&c.criteria.length>=2);}unique(t.map.id);t.map.edges.forEach(e=>{assert.ok(e.from&&e.relation&&e.to);e.sources.forEach(s=>source(s,t));});for(const b of Object.values(t.map.blanks)){assert.ok(['from','relation','to'].includes(b.target));assert.equal(b.answer,t.map.edges[b.edgeIndex][b.target]);assert.ok(b.options.includes(b.answer));}assert.equal(t.tests.length,6);for(const q of t.tests){activity(q,t);assert.ok(q.question&&q.explanation);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);}}
const near=(a,b)=>assert.ok(Math.abs(a-b)<0.0001);
near(10000*.1/(1-Math.pow(1.1,-2)),5761.9047619);
near((120000+200*110)/1200,118.3333333);
near(120-(120000+22000)/1200,1.6666667);
near((90000-60000)/30000,1);near(5000/30000,.1666667);
near(80000/500000,.16);near((80000-20000)/500000,.12);
near(30000+10000-8000,32000);near(10/(1000*5)*1e6,2000);
console.log(`6 temas, ${ids.size} IDs únicos, fuentes y páginas, mapas, tests y cálculos comprobados.`);
