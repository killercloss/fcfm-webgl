(function(){
  const c=document.getElementById('wasd-webgl-canvas'); if(!c||!window.THREE) return;
  const s=new THREE.Scene(); s.background=new THREE.Color(0xEFE9DF);
  const cam=new THREE.PerspectiveCamera(45,c.clientWidth/c.clientHeight,0.1,100); cam.position.z=5;
  const r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});
  r.setSize(c.clientWidth,c.clientHeight); r.setPixelRatio(window.devicePixelRatio);

  const cube=new THREE.Mesh(
    new THREE.BoxGeometry(1.4,1.4,1.4),
    new THREE.MeshStandardMaterial({color:0xC6302C,roughness:0.6,metalness:0.2})
  );
  s.add(cube);

  const d=new THREE.DirectionalLight(0xffffff,0.9); d.position.set(3,3,5); s.add(d);
  s.add(new THREE.AmbientLight(0xffffff,0.5));

  const keys={};
  window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
  window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  const sp=0.05;

  (function anim(){
    requestAnimationFrame(anim);
    if(keys.w) cube.position.z-=sp;
    if(keys.s) cube.position.z+=sp;
    if(keys.a) cube.position.x-=sp;
    if(keys.d) cube.position.x+=sp;
    if(keys.q) cube.position.y+=sp;
    if(keys.e) cube.position.y-=sp;
    cube.rotation.x+=0.002; cube.rotation.y+=0.003;
    r.render(s,cam);
  })();

  window.addEventListener('resize',()=>{
    const w=c.clientWidth,h=c.clientHeight;
    cam.aspect=w/h; cam.updateProjectionMatrix(); r.setSize(w,h);
  });
})();
