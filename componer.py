from pathlib import Path
from PIL import Image,ImageDraw
import sys
r=Path(__file__).resolve().parent/'tmp'/'pdfs'
a,b=map(int,sys.argv[1:3])
for i in range(a,b+1,4):
    batch=list(range(i,min(i+4,b+1)))
    s=Image.new('RGB',(1800,2540),'#ddd');d=ImageDraw.Draw(s)
    for j,p in enumerate(batch):
        f=r/f'libro-{p:03}.png';im=Image.open(f);im.thumbnail((890,1230));x=j%2*900;y=j//2*1270
        s.paste(im,(x,y+30));d.text((x+10,y+8),'Libro - PDF '+str(p),fill='black')
    s.save(r/f'lectura-{i:03}.jpg',quality=92)
