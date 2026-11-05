// Özgün, çevrimdışı sentez: anlamlı efektler ve beş sahne için ayrı kısa müzik döngüsü.
let acik=false,muzik=false,baglam:AudioContext|null=null,ana:GainNode|null=null,timer:number|undefined;
let sahne="",adim=0;
try{acik=localStorage.getItem("akkopru-2026:ses")==="acik";muzik=localStorage.getItem("akkopru-2026:muzik")==="acik";}catch{}
export const sesAcikMi=()=>acik;
export const muzikAcikMi=()=>muzik;
export function sesAyarla(v:boolean){acik=v;try{localStorage.setItem("akkopru-2026:ses",v?"acik":"kapali");}catch{}}
function ortam(){baglam??=new AudioContext();void baglam.resume();return baglam;}
export function muzikAyarla(v:boolean){muzik=v;try{localStorage.setItem("akkopru-2026:muzik",v?"acik":"kapali");}catch{}if(!v)dur();else baslat();}
function nota(f:number,t:number,sure:number,guc:number,hedef:AudioNode,tip:OscillatorType="sine"){
 const c=ortam(),o=c.createOscillator(),g=c.createGain();o.type=tip;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(guc,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+sure);o.connect(g);g.connect(hedef);o.start(t);o.stop(t+sure+.01);
}
export function sesCal(tur:number){if(!acik)return;try{const c=ortam(),t=c.currentTime;
 if(tur===0||tur===1||tur===4){const b=c.createBuffer(1,Math.floor(c.sampleRate*.1),c.sampleRate),v=b.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=Math.sin(i*17.23)*Math.cos(i*.79)*(1-i/v.length);const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();s.buffer=b;f.type=tur===1?"lowpass":"highpass";f.frequency.value=tur===1?450:3500;g.gain.value=.045;s.connect(f);f.connect(g);g.connect(c.destination);s.start();}
 else if(tur===2){for(let i=0;i<3;i++)nota(i%2?660:880,t+i*.11,.09,.025,c.destination,"triangle");}
 else if(tur===3){nota(440,t,.3,.025,c.destination);nota(554,t+.08,.3,.018,c.destination);}
 else{nota(100+tur*19,t,.09,.025,c.destination,tur%2?"triangle":"sine");}
 }catch{}}
const MOTIFLER:Record<string,number[]>={masa:[57,64,60,67,57,62,60,64],kriz:[45,46,52,45,48,46,51,45],kampanya:[60,64,67,69,67,64,62,67],secim:[48,55,60,62,55,59,60,67],sonsoz:[60,67,64,62,57,64,60,55]};
function sec(){return document.querySelector('.sonsoz')?'sonsoz':document.querySelector('.secim-gecesi')?'secim':document.querySelector('.kampanya,.kampanya-sahnesi')?'kampanya':document.querySelector('.ihanet,.tur-acil,.kulis-sahnesi')?'kriz':'masa';}
function dur(){if(timer!==undefined)window.clearInterval(timer);timer=undefined;if(ana&&baglam)ana.gain.setValueAtTime(0,baglam.currentTime);}
function baslat(){if(!muzik||document.hidden)return;try{const c=ortam();if(timer!==undefined)return;ana=c.createGain();ana.gain.value=.28;ana.connect(c.destination);timer=window.setInterval(()=>{if(!muzik||document.hidden){dur();return;}const yeni=sec();if(yeni!==sahne){sahne=yeni;adim=0;}const m=MOTIFLER[sahne]!,n=m[adim++%m.length]!;const f=440*2**((n-69)/12);nota(f,c.currentTime,1.7,.07,ana!);if(adim%4===1){nota(f/2,c.currentTime,3,.04,ana!);nota(f*1.5,c.currentTime,2,.025,ana!);}},sahne==='kriz'?500:850);}catch{}}
export function sesleriHazirla(){document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b||b.disabled)return;const ad=b.textContent??'';sesCal(b.classList.contains('secenek')?1:/Ayı bitir|Sonucu kabul/.test(ad)?3:/Kürsü|Görüş/.test(ad)?2:/kapat|dön|Devam/.test(ad)?0:4);baslat();});document.addEventListener('visibilitychange',()=>{if(document.hidden)dur();else if(muzik&&baglam?.state==='running')baslat();});}
