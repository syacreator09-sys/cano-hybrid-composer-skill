function renderAt(frame){const t=frame/FPS;
 const globalP=clamp(t/DUR); E.stage.style.backgroundPosition=`${-7*globalP}px ${-4*globalP}px, ${5*globalP}px ${8*globalP}px, 0 0`;

 const h=life(t,0,2.7,.15,.22);op(E.kicker,h);op(E.title,h);op(E.sub,h);
 tf(E.title,0,10*(1-ease(h))-3*pr(t,.4,2.2),.97+.03*ease(h)+.006*pr(t,.4,2.2));
 E.title.style.letterSpacing=(-.055+.004*pr(t,.4,2.2))+"em";
 op(E.phase,life(t,.5,11.6,.12,.08)); if(t<3.1)E.phase.textContent="01 · MENSAJE"; else if(t<6.1)E.phase.textContent="02 · COMPRENDE"; else if(t<9.2)E.phase.textContent="03 · DECIDE Y ACTÚA"; else E.phase.textContent="04 · CONFIRMA";

 const vh=life(t,.8,3.7,.16,.20);op(E.hero,vh);const heroP=pr(t,.8,3.7);tf(E.hero,-14*(1-ease(vh))-4*heroP,8*(1-ease(vh))-7*heroP,.97+.03*ease(vh)+.012*heroP);
 const vb=life(t,1.45,3.75,.16,.22);op(E.bubble,vb);const bubbleP=pr(t,1.45,3.75);tf(E.bubble,26*(1-ease(vb))-5*bubbleP,10*(1-ease(vb))-6*bubbleP,.95+.05*ease(vb)+.008*bubbleP);
 const lp=life(t,2.55,3.9,.10,.20);draw(E.p1,lp);op(E.pulse,lp);E.pulse.style.left=(560-130*ease(pr(t,2.55,3.9)))+"px";E.pulse.style.top=(610-96*ease(pr(t,2.55,3.9)))+"px";

 const va=life(t,3.15,6.35,.12,.18);op(E.ai,va);const aiP=pr(t,3.15,6.35);tf(E.ai,0,18*(1-ease(va))-11*aiP,.90+.12*ease(va)+.015*aiP,-4+16*aiP);
 E.aiRing.style.transform=`rotate(${175*aiP}deg) scale(${.97+.07*ease(va)+.025*aiP})`;
 op(E.aiTag,va);op(E.auraAI,va*.72);E.auraAI.style.transform=`scale(${.88+.18*ease(va)+.04*aiP}) rotate(${-20+55*aiP}deg)`;
 const ao=life(t,3.35,6.22,.08,.12);op(E.aiOrbitDot,ao);const aop=pr(t,3.35,6.22);const ang=(-155+310*aop)*Math.PI/180;E.aiOrbitDot.style.left=(354+176*Math.cos(ang))+"px";E.aiOrbitDot.style.top=(508+126*Math.sin(ang))+"px";E.aiOrbitDot.style.transform=`scale(${.75+.35*sm(aop)})`;
 const ex=life(t,4.25,6.3,.14,.20);op(E.extract,ex);tf(E.extract,0,18*(1-ease(ex))-4*pr(t,4.25,6.3),.97+.03*ease(ex));
 [...E.extract.children].forEach((el,i)=>{const q=sm(pr(t,4.3+i*.12,5.25+i*.12));el.style.transform=`translateY(${10*(1-q)-2*q}px) scale(${.96+.04*q})`;el.style.opacity=q;});

 const hd=life(t,5.62,6.55,.10,.18);op(E.handoffDot,hd);const hp=ease(pr(t,5.62,6.55));E.handoffDot.style.left=(355+2*hp)+"px";E.handoffDot.style.top=(670-330*hp)+"px";E.handoffDot.style.transform=`scale(${.65+.55*sm(hp)})`;

 const vp=life(t,5.95,9.55,.13,.18);op(E.hub,vp);const actP=pr(t,5.95,9.55);tf(E.hub,0,12*(1-ease(vp))-4*actP,.97+.03*ease(vp)+.006*actP);op(E.auraAction,vp*.7);E.auraAction.style.transform=`scale(${.92+.12*ease(vp)+.03*actP})`;
 const d2=life(t,6.0,7.35,.10,.18),d3=life(t,6.0,7.35,.10,.18);draw(E.p2,d2);draw(E.p3,d3);
 if(d2>.92){E.p2.style.strokeDasharray="10 9";E.p2.style.strokeDashoffset=(-26*pr(t,6.8,9.3)).toFixed(2)}
 if(d3>.92){E.p3.style.strokeDasharray="10 9";E.p3.style.strokeDashoffset=(-26*pr(t,6.8,9.3)).toFixed(2)}
 const ap=life(t,6.35,9.18,.08,.12);op(E.actionPulseDot,ap);const app=pr(t,6.35,9.18);let ax,ay;if(app<.5){const q=ease(app*2);ax=360+(198-360)*q;ay=360+(426-360)*q;}else{const q=ease((app-.5)*2);ax=198+(520-198)*q;ay=426;}E.actionPulseDot.style.left=ax+"px";E.actionPulseDot.style.top=ay+"px";E.actionPulseDot.style.transform=`scale(${.72+.38*sm(app)})`;
 const c1=life(t,6.05,9.5,.14,.18);op(E.crm,c1);const cp1=pr(t,6.05,9.5);tf(E.crm,-28*(1-ease(c1))-3*cp1,-4*cp1,.97+.03*ease(c1)+.006*cp1);
 const c2=life(t,6.18,9.5,.14,.18);op(E.cal,c2);const cp2=pr(t,6.18,9.5);tf(E.cal,28*(1-ease(c2))+3*cp2,-4*cp2,.97+.03*ease(c2)+.006*cp2);
 [...E.crm.querySelectorAll('.row')].forEach((el,i)=>{const q=sm(pr(t,6.45+i*.28,7.35+i*.28));el.style.transform=`translateX(${8*(1-q)}px)`;el.style.opacity=.45+.55*q;el.querySelector('.ico').style.transform=`scale(${.9+.1*q})`;});
 [...E.cal.querySelectorAll('.day')].forEach((el,i)=>{const q=sm(pr(t,6.55+i*.08,7.15+i*.08));el.style.transform=`translateY(${5*(1-q)}px)`;el.style.opacity=.5+.5*q;});
 E.crmStatus.textContent=t>8.0?"Reserva confirmada":"Preparando reserva";E.crmStatus.style.color=t>8.0?"#0f766e":"#76818a";
 const slotP=sm(pr(t,7.25,8.15));E.selected.style.transform=`scale(${1+.06*slotP}) translateX(${2*slotP}px)`;E.selected.style.boxShadow=`0 ${10+6*slotP}px ${26+10*slotP}px rgba(15,118,110,${.20+.12*slotP})`;

 const vf=life(t,9.05,12.01,.12,.02);op(E.confirm,vf);const finalP=pr(t,9.05,12.01);tf(E.confirm,0,28*(1-ease(vf))-9*finalP,.94+.07*ease(vf)+.012*finalP);
 const chk=E.confirm.querySelector('.check');const qCheck=sm(pr(t,9.18,9.75));chk.style.transform=`scale(${.72+.34*qCheck}) rotate(${-10+10*qCheck}deg)`;
 const fp=life(t,9.45,11.82,.08,.08);op(E.confirmPulseDot,fp);const fpp=pr(t,9.45,11.82);const fx=108+470*fpp;const fy=450+42*sm(fpp);E.confirmPulseDot.style.left=fx+"px";E.confirmPulseDot.style.top=fy+"px";E.confirmPulseDot.style.transform=`scale(${.72+.30*sm(fpp)})`;
 [...E.confirm.querySelectorAll('.info')].forEach((el,i)=>{const q=sm(pr(t,9.55+i*.13,10.2+i*.13));el.style.transform=`translateY(${12*(1-q)-2*q}px) scale(${.97+.03*q})`;el.style.opacity=.42+.58*q;});
 const rf=E.confirm.querySelector('.resultFooter');const qf=sm(pr(t,10.3,10.95));rf.style.transform=`translateY(${10*(1-qf)}px)`;rf.style.opacity=qf;

 op(E.caption,1); if(t<3.1)E.capText.textContent="1. El cliente escribe"; else if(t<6.1)E.capText.textContent="2. La IA entiende el mensaje"; else if(t<9.2)E.capText.textContent="3. Consulta CRM y agenda"; else E.capText.textContent="4. Confirma y sincroniza";E.prog.style.width=(100*globalP)+"%";
 return true;}