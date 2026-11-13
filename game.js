(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = 1000, H = 560, R = 14;
  const bounds = { left: 82, right: 918, top: 78, bottom: 482 };
  const pocketSpots = [{x:82,y:78},{x:500,y:76},{x:918,y:78},{x:82,y:482},{x:500,y:484},{x:918,y:482}];
  const $ = (id) => document.getElementById(id);
  const ui = { overlay:$('overlay'), overlayTitle:$('overlayTitle'), overlayText:$('overlayText'), overlayBtn:$('overlayBtn'), aim:$('aimSlider'), power:$('powerSlider'), angle:$('angleReadout'), powerText:$('powerReadout'), score:$('score'), progress:$('progress'), shots:$('shots'), streak:$('streak'), precision:$('precision'), shotLabel:$('shotLabel'), coordX:$('coordX'), coordY:$('coordY'), shoot:$('shootBtn'), reset:$('resetBtn'), sound:$('soundBtn'), soundState:$('soundState') };
  let balls = [], aim = 0, running = false, started = false, moving = false, gameOver = false;
  let shots = 0, nodes = 0, streak = 0, bestStreak = 0, successfulShots = 0, soundOn = true, lastTime = 0;
  let audio;

  function newGame() {
    balls = [{id:'cue',x:250,y:280,vx:0,vy:0,color:'#f1f4e9',label:'',glow:'#d7fff1'}];
    const rack = [
      {x:620,y:280},{x:648,y:264},{x:648,y:296},{x:676,y:248},{x:676,y:280},{x:676,y:312},{x:704,y:264},{x:704,y:296}
    ];
    for (let i=0;i<7;i++) balls.push({id:`node${i+1}`,x:rack[i].x,y:rack[i].y,vx:0,vy:0,color:['#ff5c8a','#ff805e','#db72ff','#ffbf5d','#59d9ff','#a9fb68','#fe78c3'][i],label:String(i+1),glow:['#ff4c92','#ff714d','#d967ff','#ffbf5d','#38d6ff','#a9fb68','#ff66c0'][i]});
    balls.push({id:'eight',x:rack[7].x,y:rack[7].y,vx:0,vy:0,color:'#151b1c',label:'8',glow:'#9fa7a3'});
    aim=0; shots=0; nodes=0; streak=0; bestStreak=0; successfulShots=0; started=false; running=false; moving=false; gameOver=false;
    ui.aim.value=0; ui.power.value=52; updateUI();
    showOverlay('SYSTEM READY','Drag on the table to aim, then fire.','START BREAK');
    draw();
  }
  function showOverlay(title,text,button){ui.overlayTitle.textContent=title;ui.overlayText.textContent=text;ui.overlayBtn.innerHTML=`${button} <span>↗</span>`;ui.overlay.classList.remove('hidden')}
  function hideOverlay(){ui.overlay.classList.add('hidden')}
  function cue(){return balls.find(b=>b.id==='cue')}
  function updateUI(){ui.score.textContent=String(nodes).padStart(2,'0');ui.progress.style.width=`${nodes/7*100}%`;ui.shots.textContent=String(shots).padStart(2,'0');ui.streak.innerHTML=`${String(bestStreak).padStart(2,'0')} <small>nodes</small>`;ui.precision.innerHTML=`${shots?Math.round(successfulShots/shots*100):'—'}<small>%</small>`;ui.shotLabel.textContent=`SHOT ${String(shots+1).padStart(2,'0')}`;ui.angle.textContent=`${String((Math.round(aim*180/Math.PI)+360)%360).padStart(3,'0')}°`;ui.powerText.textContent=ui.power.value}
  function resize(){const dpr=Math.min(window.devicePixelRatio||1,2), rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);draw()}
  function pointerPos(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)/rect.width*W,y:(e.clientY-rect.top)/rect.height*H}}
  function setAimFromPoint(p){const c=cue();if(!c)return;aim=Math.atan2(p.y-c.y,p.x-c.x);ui.aim.value=Math.round(aim*180/Math.PI);updateUI();ui.coordX.textContent=String(Math.round(p.x)).padStart(3,'0');ui.coordY.textContent=String(Math.round(p.y)).padStart(3,'0');draw()}
  function fire(){if(!started){started=true;hideOverlay()}if(moving||gameOver)return;const c=cue();if(!c)return;const power=Number(ui.power.value);const speed=140+power*5.2;c.vx=Math.cos(aim)*speed;c.vy=Math.sin(aim)*speed;moving=true;shots++;streak=0;updateUI();playTone(110,.09,'triangle');}
  function playTone(freq,duration,type='sine'){if(!soundOn)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
  function draw(){if(!ctx)return;ctx.clearRect(0,0,W,H);
    // Felt and luminous table rails
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#254a3b');bg.addColorStop(.5,'#183b30');bg.addColorStop(1,'#102b25');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#061b16';ctx.fillRect(19,17,962,526);
    const rail=ctx.createLinearGradient(20,25,970,520);rail.addColorStop(0,'#315b45');rail.addColorStop(.5,'#173b30');rail.addColorStop(1,'#294f3b');ctx.fillStyle=rail;ctx.fillRect(38,34,924,492);
    ctx.strokeStyle='#8cdb9c';ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.strokeRect(48,44,904,472);ctx.globalAlpha=1;
    const cloth=ctx.createLinearGradient(80,78,920,482);cloth.addColorStop(0,'#174637');cloth.addColorStop(.55,'#13503b');cloth.addColorStop(1,'#103c32');ctx.fillStyle=cloth;ctx.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
    // subtle circuit weave
    ctx.save();ctx.beginPath();ctx.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);ctx.clip();ctx.strokeStyle='#9af5ba';ctx.globalAlpha=.055;ctx.lineWidth=1;
    for(let x=112;x<920;x+=48){ctx.beginPath();ctx.moveTo(x,78);ctx.lineTo(x,482);ctx.stroke()}
    for(let y=102;y<482;y+=48){ctx.beginPath();ctx.moveTo(82,y);ctx.lineTo(918,y);ctx.stroke()}
    ctx.globalAlpha=.13;ctx.setLineDash([3,10]);ctx.beginPath();ctx.moveTo(250,80);ctx.lineTo(250,480);ctx.stroke();ctx.restore();
    // rails diamonds
    for(let i=0;i<9;i++){const x=145+i*89;ctx.fillStyle='#a9e3a9';ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(x,56);ctx.lineTo(x+5,61);ctx.lineTo(x,66);ctx.lineTo(x-5,61);ctx.fill();ctx.beginPath();ctx.moveTo(x,494);ctx.lineTo(x+5,499);ctx.lineTo(x,504);ctx.lineTo(x-5,499);ctx.fill()}ctx.globalAlpha=1;
    // pockets
    for(const p of pocketSpots){const g=ctx.createRadialGradient(p.x-3,p.y-4,2,p.x,p.y,31);g.addColorStop(0,'#020a09');g.addColorStop(.7,'#06100e');g.addColorStop(1,'#071c16');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,27,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8af5bd';ctx.globalAlpha=.22;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,28,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
    if(started&&!gameOver&&cue()&&!moving){drawAim()}
    for(const b of balls)drawBall(b);
    if(!started){ctx.fillStyle='#a4f5c2';ctx.globalAlpha=.22;ctx.font='11px monospace';ctx.fillText('DRAG TO ALIGN  /  SEND THE BREAK',370,455);ctx.globalAlpha=1}
  }
  function drawAim(){const c=cue();if(!c)return;const dx=Math.cos(aim),dy=Math.sin(aim);ctx.save();ctx.setLineDash([8,7]);ctx.strokeStyle='#d3ffe1';ctx.globalAlpha=.72;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(c.x+dx*R,c.y+dy*R);ctx.lineTo(c.x+dx*190,c.y+dy*190);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.3;ctx.strokeStyle='#a1ffb7';ctx.beginPath();ctx.arc(c.x,c.y,22,-.6,.6);ctx.stroke();ctx.restore();
    // cue stick behind cue ball
    ctx.save();ctx.translate(c.x,c.y);ctx.rotate(aim+Math.PI);const pull=Number(ui.power.value)*.11;ctx.shadowColor='#9af5bd';ctx.shadowBlur=9;ctx.strokeStyle='#c9e6ca';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-34-pull,-2);ctx.lineTo(-108-pull,0);ctx.stroke();ctx.strokeStyle='#83b49a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-105-pull,0);ctx.lineTo(-178-pull,0);ctx.stroke();ctx.restore()}
  function drawBall(b){ctx.save();ctx.shadowColor=b.glow;ctx.shadowBlur=b.id==='cue'?10:13;const grad=ctx.createRadialGradient(b.x-R*.35,b.y-R*.45,1,b.x,b.y,R*1.1);grad.addColorStop(0,b.id==='eight'?'#65766f':b.id==='cue'?'#fff':b.color);grad.addColorStop(.6,b.color);grad.addColorStop(1,b.id==='eight'?'#050909':'#07140f');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=b.id==='cue'?'#e4ffef':'#ffffff55';ctx.lineWidth=1;ctx.stroke();if(b.label){ctx.fillStyle=b.id==='eight'?'#070a09':'#f8fff8';ctx.beginPath();ctx.arc(b.x,b.y,6.3,0,Math.PI*2);ctx.fill();ctx.fillStyle=b.id==='eight'?'#d9eee2':'#15211b';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.label,b.x,b.y+.5)}else{ctx.fillStyle='#ffffffaa';ctx.beginPath();ctx.arc(b.x-4,b.y-5,2.1,0,Math.PI*2);ctx.fill()}ctx.restore()}

  function update(dt){if(!moving)return;const step=Math.min(dt,.02), sub=2, h=step/sub;let scratched=false;
    for(let s=0;s<sub;s++){
      for(const b of balls){b.x+=b.vx*h;b.y+=b.vy*h;b.vx*=Math.exp(-1.38*h);b.vy*=Math.exp(-1.38*h);if(Math.hypot(b.vx,b.vy)<5){b.vx=0;b.vy=0}
        const pocket=pocketSpots.find(p=>Math.hypot(b.x-p.x,b.y-p.y)<25);
        if(pocket){if(b.id==='cue'){scratched=true;balls=balls.filter(q=>q!==b);playTone(78,.2,'sawtooth')}else if(b.id==='eight'){balls=balls.filter(q=>q!==b);gameOver=true;showOverlay(nodes>=7?'FIREWALL DOWN':'SYSTEM LOCKED',nodes>=7?'Perfect run. You cleared the system.':'The 8-ball hit the pocket too soon. Try another run.','PLAY AGAIN');playTone(70,.35,'sawtooth')}else{balls=balls.filter(q=>q!==b);nodes++;streak++;successfulShots++;bestStreak=Math.max(bestStreak,streak);playTone(520,.08,'sine')}continue}
        const nearPocket=(axis,pos)=>pocketSpots.some(p=>Math.abs(p[axis]-pos)<34);
        if(b.x<bounds.left+R){if(!(nearPocket('y',b.y)&&b.x<bounds.left+R+5)){b.x=bounds.left+R;b.vx=Math.abs(b.vx)*.82;playTone(185,.025)}}
        if(b.x>bounds.right-R){if(!(nearPocket('y',b.y)&&b.x>bounds.right-R-5)){b.x=bounds.right-R;b.vx=-Math.abs(b.vx)*.82;playTone(185,.025)}}
        if(b.y<bounds.top+R){if(!(nearPocket('x',b.x)&&b.y<bounds.top+R+5)){b.y=bounds.top+R;b.vy=Math.abs(b.vy)*.82;playTone(185,.025)}}
        if(b.y>bounds.bottom-R){if(!(nearPocket('x',b.x)&&b.y>bounds.bottom-R-5)){b.y=bounds.bottom-R;b.vy=-Math.abs(b.vy)*.82;playTone(185,.025)}}
      }
      for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=R*2;if(d===0||d>=min)continue;const nx=dx/d,ny=dy/d,overlap=min-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){const impulse=rel*.94;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;playTone(260,.025,'triangle')}}
    }
    if(scratched){balls.push({id:'cue',x:250,y:280,vx:0,vy:0,color:'#f1f4e9',label:'',glow:'#d7fff1'});streak=0}
    const still=balls.every(b=>Math.hypot(b.vx,b.vy)<1);if(still){moving=false;if(nodes>=7&&!gameOver){gameOver=true;showOverlay('SYSTEM CLEARED','All seven nodes are offline. Mission complete.','PLAY AGAIN')}updateUI()}
    draw();
  }
  function loop(now){if(!lastTime)lastTime=now;update(Math.min((now-lastTime)/1000,.04));lastTime=now;requestAnimationFrame(loop)}
  canvas.addEventListener('pointerdown',e=>{if(!started||moving||gameOver)return;canvas.setPointerCapture(e.pointerId);setAimFromPoint(pointerPos(e))});
  canvas.addEventListener('pointermove',e=>{if(e.buttons&&started&&!moving&&!gameOver)setAimFromPoint(pointerPos(e))});
  ui.aim.addEventListener('input',()=>{aim=Number(ui.aim.value)*Math.PI/180;updateUI();draw()});
  ui.power.addEventListener('input',()=>{ui.powerText.textContent=ui.power.value;draw()});
  ui.shoot.addEventListener('click',fire);ui.overlayBtn.addEventListener('click',()=>{if(gameOver){newGame();started=true;hideOverlay()}else{started=true;hideOverlay();draw()}});ui.reset.addEventListener('click',newGame);
  window.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&e.target.tagName!=='INPUT'){e.preventDefault();fire()}if(e.key==='ArrowLeft'){aim-=.04;ui.aim.value=Math.round(aim*180/Math.PI);updateUI();draw()}if(e.key==='ArrowRight'){aim+=.04;ui.aim.value=Math.round(aim*180/Math.PI);updateUI();draw()}});
  ui.sound.addEventListener('click',()=>{soundOn=!soundOn;ui.soundState.textContent=soundOn?'ON':'OFF';ui.sound.style.opacity=soundOn?'1':'.65'});
  window.addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);resize();newGame();requestAnimationFrame(loop);
})();
