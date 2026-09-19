// Convert the CC0 Kenney GLBs into embedded geometry: works from file:// and in APKs.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),input=path.join(root,'.tmp/kenney-characters'),out=path.join(root,'assets/characters');fs.mkdirSync(out,{recursive:true});
function convert(letter){
 const file=path.join(input,'Models/GLB format/character-'+letter+'.glb'),b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.toString('utf8',20,20+len)),bin=b.subarray(28+len);
 function accessor(id){const a=j.accessors[id],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes={5126:4,5125:4,5123:2,5121:1}[a.componentType],read={5126:'readFloatLE',5125:'readUInt32LE',5123:'readUInt16LE',5121:'readUInt8'}[a.componentType];if(!n||!read)throw Error('Unsupported accessor');const data=[];for(let i=0;i<a.count;i++)for(let k=0;k<n;k++)data.push(bin[read]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||n*bytes)+k*bytes));return data;}
 const meshes={};for(const node of j.nodes){if(node.mesh===undefined)continue;const p=j.meshes[node.mesh].primitives[0];meshes[node.name]={positions:accessor(p.attributes.POSITION),normals:accessor(p.attributes.NORMAL),uv:accessor(p.attributes.TEXCOORD_0),indices:accessor(p.indices)};}
 const clips={};for(const a of j.animations||[]){if(!['idle','walk','sprint','emote-yes','emote-no'].includes(a.name))continue;clips[a.name]=a.channels.filter(c=>c.target.path==='rotation').map(c=>({node:j.nodes[c.target.node].name,times:accessor(a.samplers[c.sampler].input),values:accessor(a.samplers[c.sampler].output)}));}
 const texture=fs.readFileSync(path.join(input,'Models/GLB format/Textures/texture-'+letter+'.png')),preview=fs.readFileSync(path.join(input,'Previews/character-'+letter+'.png'));
 fs.copyFileSync(file,path.join(out,'character-'+letter+'.glb'));fs.mkdirSync(path.join(out,'Textures'),{recursive:true});fs.writeFileSync(path.join(out,'Textures/texture-'+letter+'.png'),texture);
 return {name:letter==='b'?'Rio':'Alex',meshes,clips,texture:'data:image/png;base64,'+texture.toString('base64'),preview:'data:image/png;base64,'+preview.toString('base64')};
}
const assets=['b','c'].map(convert);fs.copyFileSync(path.join(input,'License.txt'),path.join(out,'LICENSE-Kenney.txt'));fs.writeFileSync(path.join(out,'characters.json'),JSON.stringify(assets));console.log('Imported',assets.length,'characters with locomotion and emote clips');
