"""Renderiza páginas PDF y crea láminas de lectura con números de página PDF."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import subprocess, sys
root = Path(__file__).resolve().parent
source, label, pages = sys.argv[1:4]
out = root / 'tmp' / 'pdfs'
out.mkdir(parents=True, exist_ok=True)
numbers = []
for part in pages.split(','):
    if '-' in part:
        a,b=map(int,part.split('-')); numbers.extend(range(a,b+1))
    else: numbers.append(int(part))
files=[]
for p in numbers:
    prefix=out/f'{label}-{p:03}'
    target=Path(str(prefix)+'.png')
    if not target.exists(): subprocess.run(['pdftoppm','-f',str(p),'-l',str(p),'-singlefile','-scale-to','1800','-png',str(root/'materiales'/source),str(prefix)],check=True,capture_output=True)
    files.append((p,target))
for i in range(0,len(files),4):
    batch=files[i:i+4]
    sheet=Image.new('RGB',(1800,2540),'#ddd')
    draw=ImageDraw.Draw(sheet)
    for j,(p,f) in enumerate(batch):
        img=Image.open(f).convert('RGB'); img.thumbnail((890,1230))
        x=(j%2)*900; y=(j//2)*1270
        sheet.paste(img,(x,y+30)); draw.text((x+10,y+8),f'{label} - pagina PDF {p}',fill='black')
    name=out/f'{label}-lamina-{batch[0][0]:03}.jpg'
    sheet.save(name,quality=92)
    print(name,flush=True)
