import { createHash } from 'node:crypto';
import { inflateSync, deflateSync } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';

const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  if(pa<=pb&&pa<=pc)return a;
  if(pb<=pc)return b;
  return c;
}

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let k=0;k<8;k++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}

function chunk(type,data){
  const name=Buffer.from(type,'ascii');
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length,0);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,data])),0);
  return Buffer.concat([length,name,data,crc]);
}

export function decodePng(buffer){
  if(!buffer.subarray(0,8).equals(SIGNATURE)) throw new Error('invalid PNG signature');
  let offset=8,width=0,height=0,bitDepth=0,colorType=0;
  const idat=[];
  while(offset<buffer.length){
    const length=buffer.readUInt32BE(offset);offset+=4;
    const type=buffer.toString('ascii',offset,offset+4);offset+=4;
    const data=buffer.subarray(offset,offset+length);offset+=length+4;
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];
    }else if(type==='IDAT') idat.push(data);
    else if(type==='IEND') break;
  }
  if(bitDepth!==8) throw new Error(`unsupported PNG bit depth: ${bitDepth}`);
  const channels=colorType===6?4:colorType===2?3:colorType===0?1:0;
  if(!channels) throw new Error(`unsupported PNG color type: ${colorType}`);
  const bpp=channels,rowBytes=width*channels;
  const raw=inflateSync(Buffer.concat(idat));
  const out=Buffer.alloc(width*height*4);
  let src=0;
  const prior=Buffer.alloc(rowBytes),row=Buffer.alloc(rowBytes);
  for(let y=0;y<height;y++){
    const filter=raw[src++];
    for(let x=0;x<rowBytes;x++){
      const value=raw[src++],left=x>=bpp?row[x-bpp]:0,up=prior[x],upLeft=x>=bpp?prior[x-bpp]:0;
      let recon;
      if(filter===0) recon=value;
      else if(filter===1) recon=(value+left)&255;
      else if(filter===2) recon=(value+up)&255;
      else if(filter===3) recon=(value+Math.floor((left+up)/2))&255;
      else if(filter===4) recon=(value+paeth(left,up,upLeft))&255;
      else throw new Error(`unsupported PNG filter: ${filter}`);
      row[x]=recon;
    }
    for(let x=0;x<width;x++){
      const si=x*channels,di=(y*width+x)*4;
      if(colorType===6){out[di]=row[si];out[di+1]=row[si+1];out[di+2]=row[si+2];out[di+3]=row[si+3];}
      else if(colorType===2){out[di]=row[si];out[di+1]=row[si+1];out[di+2]=row[si+2];out[di+3]=255;}
      else {out[di]=out[di+1]=out[di+2]=row[si];out[di+3]=255;}
    }
    row.copy(prior);
  }
  return {width,height,data:out};
}

export function encodePng({width,height,data}){
  if(data.length!==width*height*4) throw new Error('RGBA buffer length mismatch');
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  const raw=Buffer.alloc(height*(1+width*4));
  for(let y=0;y<height;y++){
    const dst=y*(1+width*4);raw[dst]=0;
    data.copy(raw,dst+1,y*width*4,(y+1)*width*4);
  }
  return Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))]);
}

export function meanFrameDiff(a,b,stride=4){
  if(a.width!==b.width||a.height!==b.height) throw new Error('frame dimensions differ');
  let total=0,count=0;
  for(let y=0;y<a.height;y+=stride){
    for(let x=0;x<a.width;x+=stride){
      const i=(y*a.width+x)*4;
      const la=.299*a.data[i]+.587*a.data[i+1]+.114*a.data[i+2];
      const lb=.299*b.data[i]+.587*b.data[i+1]+.114*b.data[i+2];
      total+=Math.abs(la-lb);count++;
    }
  }
  return count?total/count:0;
}

export function resizeNearest(image,width,height){
  const out=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++){
    const sy=Math.min(image.height-1,Math.floor(y*image.height/height));
    for(let x=0;x<width;x++){
      const sx=Math.min(image.width-1,Math.floor(x*image.width/width));
      const si=(sy*image.width+sx)*4,di=(y*width+x)*4;
      image.data.copy(out,di,si,si+4);
    }
  }
  return {width,height,data:out};
}

export function composeSheet(images,{columns=5,padding=4,background=[247,243,234,255]}={}){
  if(!images.length) throw new Error('images required for sheet');
  const w=images[0].width,h=images[0].height;
  if(images.some(img=>img.width!==w||img.height!==h)) throw new Error('sheet image dimensions differ');
  const rows=Math.ceil(images.length/columns);
  const width=columns*w+(columns+1)*padding,height=rows*h+(rows+1)*padding;
  const data=Buffer.alloc(width*height*4);
  for(let i=0;i<width*height;i++){
    data[i*4]=background[0];data[i*4+1]=background[1];data[i*4+2]=background[2];data[i*4+3]=background[3];
  }
  images.forEach((img,index)=>{
    const col=index%columns,row=Math.floor(index/columns);
    const ox=padding+col*(w+padding),oy=padding+row*(h+padding);
    for(let y=0;y<h;y++){
      const src=y*w*4,dst=((oy+y)*width+ox)*4;
      img.data.copy(data,dst,src,src+w*4);
    }
  });
  return {width,height,data};
}

export async function readPng(file){return decodePng(await readFile(file));}
export async function writePng(file,image){await writeFile(file,encodePng(image));}
export async function fileSha256(file){return createHash('sha256').update(await readFile(file)).digest('hex');}
