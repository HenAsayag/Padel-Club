const express=require('express'),http=require('http'),os=require('os'),path=require('path');
const {ExpressPeerServer}=require('peer');
function makeServer(){
 const app=express(),server=http.createServer(app);
 app.get('/network-config.js',(req,res)=>{res.type('application/javascript').set('Cache-Control','no-store').send("window.PADEL_NETWORK={host:location.hostname,port:Number(location.port)||80,path:'/peerjs',secure:location.protocol==='https:',iceServers:[]};");});
 app.use('/peerjs',ExpressPeerServer(server,{path:'/',allow_discovery:false}));
 app.use(express.static(path.join(__dirname,'public'),{etag:true}));
 return server;
}
if(require.main===module){const port=Number(process.env.PORT)||4179;makeServer().listen(port,'0.0.0.0',()=>{console.log('Padel Club: http://localhost:'+port);for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&!n.internal)console.log('Both phones: http://'+n.address+':'+port);console.log('Same Wi-Fi: create a room on phone 1, enter its code on phone 2. Keep this terminal open.');});}
module.exports={makeServer};
