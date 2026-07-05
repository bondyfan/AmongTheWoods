(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(s){if(s.ep)return;s.ep=!0;const o=t(s);fetch(s.href,o)}})();const jl="modulepreload",Kl=function(i){return"/"+i},oa={},Zl=function(e,t,n){let s=Promise.resolve();if(t&&t.length>0){let a=function(l){return Promise.all(l.map(h=>Promise.resolve(h).then(d=>({status:"fulfilled",value:d}),d=>({status:"rejected",reason:d}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),c=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));s=a(t.map(l=>{if(l=Kl(l),l in oa)return;oa[l]=!0;const h=l.endsWith(".css"),d=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${d}`))return;const u=document.createElement("link");if(u.rel=h?"stylesheet":jl,h||(u.as="script"),u.crossOrigin="",u.href=l,c&&u.setAttribute("nonce",c),document.head.appendChild(u),h)return new Promise((p,g)=>{u.addEventListener("load",p),u.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${l}`)))})}))}function o(a){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=a,window.dispatchEvent(r),!r.defaultPrevented)throw a}return s.then(a=>{for(const r of a||[])r.status==="rejected"&&o(r.reason);return e().catch(o)})};/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ir="160",Jl=0,ra=1,Ql=2,Bc=1,Hc=2,Ln=3,Yn=0,Kt=1,jt=2,Vn=0,zi=1,aa=2,ca=3,la=4,eh=5,ii=100,th=101,nh=102,ha=103,da=104,ih=200,sh=201,oh=202,rh=203,xr=204,vr=205,ah=206,ch=207,lh=208,hh=209,dh=210,uh=211,fh=212,ph=213,mh=214,gh=0,_h=1,xh=2,Qs=3,vh=4,Mh=5,Sh=6,yh=7,Ur=0,Eh=1,bh=2,Wn=0,wh=1,Th=2,Ah=3,Rh=4,Ch=5,Lh=6,Gc=300,Gi=301,Vi=302,Mr=303,Sr=304,lo=306,yr=1e3,_n=1001,Er=1002,qt=1003,ua=1004,To=1005,cn=1006,Ph=1007,ds=1008,Xn=1009,Dh=1010,Ih=1011,Nr=1012,Vc=1013,Hn=1014,Gn=1015,us=1016,Wc=1017,Xc=1018,ri=1020,Uh=1021,xn=1023,Nh=1024,Fh=1025,ai=1026,Wi=1027,Oh=1028,qc=1029,kh=1030,Yc=1031,$c=1033,Ao=33776,Ro=33777,Co=33778,Lo=33779,fa=35840,pa=35841,ma=35842,ga=35843,jc=36196,_a=37492,xa=37496,va=37808,Ma=37809,Sa=37810,ya=37811,Ea=37812,ba=37813,wa=37814,Ta=37815,Aa=37816,Ra=37817,Ca=37818,La=37819,Pa=37820,Da=37821,Po=36492,Ia=36494,Ua=36495,zh=36283,Na=36284,Fa=36285,Oa=36286,Kc=3e3,ci=3001,Bh=3200,Hh=3201,Zc=0,Gh=1,hn="",It="srgb",Dn="srgb-linear",Fr="display-p3",ho="display-p3-linear",eo="linear",lt="srgb",to="rec709",no="p3",_i=7680,ka=519,Vh=512,Wh=513,Xh=514,Jc=515,qh=516,Yh=517,$h=518,jh=519,za=35044,Ba="300 es",br=1035,Pn=2e3,io=2001;class $i{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const s=this._listeners[e];if(s!==void 0){const o=s.indexOf(t);o!==-1&&s.splice(o,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let o=0,a=s.length;o<a;o++)s[o].call(this,e);e.target=null}}}const zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Do=Math.PI/180,wr=180/Math.PI;function ms(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(zt[i&255]+zt[i>>8&255]+zt[i>>16&255]+zt[i>>24&255]+"-"+zt[e&255]+zt[e>>8&255]+"-"+zt[e>>16&15|64]+zt[e>>24&255]+"-"+zt[t&63|128]+zt[t>>8&255]+"-"+zt[t>>16&255]+zt[t>>24&255]+zt[n&255]+zt[n>>8&255]+zt[n>>16&255]+zt[n>>24&255]).toLowerCase()}function $t(i,e,t){return Math.max(e,Math.min(t,i))}function Kh(i,e){return(i%e+e)%e}function Io(i,e,t){return(1-t)*i+t*e}function Ha(i){return(i&i-1)===0&&i!==0}function Tr(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Ji(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Yt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class je{constructor(e=0,t=0){je.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos($t(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),o=this.x-e.x,a=this.y-e.y;return this.x=o*n-a*s+e.x,this.y=o*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class $e{constructor(e,t,n,s,o,a,r,c,l){$e.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,o,a,r,c,l)}set(e,t,n,s,o,a,r,c,l){const h=this.elements;return h[0]=e,h[1]=s,h[2]=r,h[3]=t,h[4]=o,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,o=this.elements,a=n[0],r=n[3],c=n[6],l=n[1],h=n[4],d=n[7],u=n[2],p=n[5],g=n[8],x=s[0],m=s[3],f=s[6],v=s[1],_=s[4],E=s[7],R=s[2],T=s[5],A=s[8];return o[0]=a*x+r*v+c*R,o[3]=a*m+r*_+c*T,o[6]=a*f+r*E+c*A,o[1]=l*x+h*v+d*R,o[4]=l*m+h*_+d*T,o[7]=l*f+h*E+d*A,o[2]=u*x+p*v+g*R,o[5]=u*m+p*_+g*T,o[8]=u*f+p*E+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],o=e[3],a=e[4],r=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*r*l-n*o*h+n*r*c+s*o*l-s*a*c}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],o=e[3],a=e[4],r=e[5],c=e[6],l=e[7],h=e[8],d=h*a-r*l,u=r*c-h*o,p=l*o-a*c,g=t*d+n*u+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return e[0]=d*x,e[1]=(s*l-h*n)*x,e[2]=(r*n-s*a)*x,e[3]=u*x,e[4]=(h*t-s*c)*x,e[5]=(s*o-r*t)*x,e[6]=p*x,e[7]=(n*c-l*t)*x,e[8]=(a*t-n*o)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,o,a,r){const c=Math.cos(o),l=Math.sin(o);return this.set(n*c,n*l,-n*(c*a+l*r)+a+e,-s*l,s*c,-s*(-l*a+c*r)+r+t,0,0,1),this}scale(e,t){return this.premultiply(Uo.makeScale(e,t)),this}rotate(e){return this.premultiply(Uo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Uo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Uo=new $e;function Qc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function so(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Zh(){const i=so("canvas");return i.style.display="block",i}const Ga={};function cs(i){i in Ga||(Ga[i]=!0,console.warn(i))}const Va=new $e().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Wa=new $e().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Es={[Dn]:{transfer:eo,primaries:to,toReference:i=>i,fromReference:i=>i},[It]:{transfer:lt,primaries:to,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[ho]:{transfer:eo,primaries:no,toReference:i=>i.applyMatrix3(Wa),fromReference:i=>i.applyMatrix3(Va)},[Fr]:{transfer:lt,primaries:no,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Wa),fromReference:i=>i.applyMatrix3(Va).convertLinearToSRGB()}},Jh=new Set([Dn,ho]),ot={enabled:!0,_workingColorSpace:Dn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Jh.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,e,t){if(this.enabled===!1||e===t||!e||!t)return i;const n=Es[e].toReference,s=Es[t].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,e){return this.convert(i,this._workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this._workingColorSpace)},getPrimaries:function(i){return Es[i].primaries},getTransfer:function(i){return i===hn?eo:Es[i].transfer}};function Bi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function No(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let xi;class el{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{xi===void 0&&(xi=so("canvas")),xi.width=e.width,xi.height=e.height;const n=xi.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=xi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=so("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),o=s.data;for(let a=0;a<o.length;a++)o[a]=Bi(o[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Bi(t[n]/255)*255):t[n]=Bi(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Qh=0;class tl{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Qh++}),this.uuid=ms(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let o;if(Array.isArray(s)){o=[];for(let a=0,r=s.length;a<r;a++)s[a].isDataTexture?o.push(Fo(s[a].image)):o.push(Fo(s[a]))}else o=Fo(s);n.url=o}return t||(e.images[this.uuid]=n),n}}function Fo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?el.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let ed=0;class nn extends $i{constructor(e=nn.DEFAULT_IMAGE,t=nn.DEFAULT_MAPPING,n=_n,s=_n,o=cn,a=ds,r=xn,c=Xn,l=nn.DEFAULT_ANISOTROPY,h=hn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ed++}),this.uuid=ms(),this.name="",this.source=new tl(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=o,this.minFilter=a,this.anisotropy=l,this.format=r,this.internalFormat=null,this.type=c,this.offset=new je(0,0),this.repeat=new je(1,1),this.center=new je(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new $e,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(cs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===ci?It:hn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Gc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case yr:e.x=e.x-Math.floor(e.x);break;case _n:e.x=e.x<0?0:1;break;case Er:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case yr:e.y=e.y-Math.floor(e.y);break;case _n:e.y=e.y<0?0:1;break;case Er:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return cs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===It?ci:Kc}set encoding(e){cs("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===ci?It:hn}}nn.DEFAULT_IMAGE=null;nn.DEFAULT_MAPPING=Gc;nn.DEFAULT_ANISOTROPY=1;class Lt{constructor(e=0,t=0,n=0,s=1){Lt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,o=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*o,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*o,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*o,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*o,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,o;const c=e.elements,l=c[0],h=c[4],d=c[8],u=c[1],p=c[5],g=c[9],x=c[2],m=c[6],f=c[10];if(Math.abs(h-u)<.01&&Math.abs(d-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+x)<.1&&Math.abs(g+m)<.1&&Math.abs(l+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const _=(l+1)/2,E=(p+1)/2,R=(f+1)/2,T=(h+u)/4,A=(d+x)/4,I=(g+m)/4;return _>E&&_>R?_<.01?(n=0,s=.707106781,o=.707106781):(n=Math.sqrt(_),s=T/n,o=A/n):E>R?E<.01?(n=.707106781,s=0,o=.707106781):(s=Math.sqrt(E),n=T/s,o=I/s):R<.01?(n=.707106781,s=.707106781,o=0):(o=Math.sqrt(R),n=A/o,s=I/o),this.set(n,s,o,t),this}let v=Math.sqrt((m-g)*(m-g)+(d-x)*(d-x)+(u-h)*(u-h));return Math.abs(v)<.001&&(v=1),this.x=(m-g)/v,this.y=(d-x)/v,this.z=(u-h)/v,this.w=Math.acos((l+p+f-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class td extends $i{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Lt(0,0,e,t),this.scissorTest=!1,this.viewport=new Lt(0,0,e,t);const s={width:e,height:t,depth:1};n.encoding!==void 0&&(cs("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===ci?It:hn),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:cn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new nn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new tl(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class di extends td{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class nl extends nn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class nd extends nn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class gs{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,o,a,r){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3];const u=o[a+0],p=o[a+1],g=o[a+2],x=o[a+3];if(r===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d;return}if(r===1){e[t+0]=u,e[t+1]=p,e[t+2]=g,e[t+3]=x;return}if(d!==x||c!==u||l!==p||h!==g){let m=1-r;const f=c*u+l*p+h*g+d*x,v=f>=0?1:-1,_=1-f*f;if(_>Number.EPSILON){const R=Math.sqrt(_),T=Math.atan2(R,f*v);m=Math.sin(m*T)/R,r=Math.sin(r*T)/R}const E=r*v;if(c=c*m+u*E,l=l*m+p*E,h=h*m+g*E,d=d*m+x*E,m===1-r){const R=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=R,l*=R,h*=R,d*=R}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,s,o,a){const r=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=o[a],u=o[a+1],p=o[a+2],g=o[a+3];return e[t]=r*g+h*d+c*p-l*u,e[t+1]=c*g+h*u+l*d-r*p,e[t+2]=l*g+h*p+r*u-c*d,e[t+3]=h*g-r*d-c*u-l*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,o=e._z,a=e._order,r=Math.cos,c=Math.sin,l=r(n/2),h=r(s/2),d=r(o/2),u=c(n/2),p=c(s/2),g=c(o/2);switch(a){case"XYZ":this._x=u*h*d+l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d-u*p*g;break;case"YXZ":this._x=u*h*d+l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d+u*p*g;break;case"ZXY":this._x=u*h*d-l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d-u*p*g;break;case"ZYX":this._x=u*h*d-l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d+u*p*g;break;case"YZX":this._x=u*h*d+l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d-u*p*g;break;case"XZY":this._x=u*h*d-l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d+u*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],o=t[8],a=t[1],r=t[5],c=t[9],l=t[2],h=t[6],d=t[10],u=n+r+d;if(u>0){const p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-c)*p,this._y=(o-l)*p,this._z=(a-s)*p}else if(n>r&&n>d){const p=2*Math.sqrt(1+n-r-d);this._w=(h-c)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(o+l)/p}else if(r>d){const p=2*Math.sqrt(1+r-n-d);this._w=(o-l)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(c+h)/p}else{const p=2*Math.sqrt(1+d-n-r);this._w=(a-s)/p,this._x=(o+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs($t(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,o=e._z,a=e._w,r=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+a*r+s*l-o*c,this._y=s*h+a*c+o*r-n*l,this._z=o*h+a*l+n*c-s*r,this._w=a*h-n*r-s*c-o*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,s=this._y,o=this._z,a=this._w;let r=a*e._w+n*e._x+s*e._y+o*e._z;if(r<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,r=-r):this.copy(e),r>=1)return this._w=a,this._x=n,this._y=s,this._z=o,this;const c=1-r*r;if(c<=Number.EPSILON){const p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*s+t*this._y,this._z=p*o+t*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,r),d=Math.sin((1-t)*h)/l,u=Math.sin(t*h)/l;return this._w=a*d+this._w*u,this._x=n*d+this._x*u,this._y=s*d+this._y*u,this._z=o*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),s=2*Math.PI*Math.random(),o=2*Math.PI*Math.random();return this.set(t*Math.cos(s),n*Math.sin(o),n*Math.cos(o),t*Math.sin(s))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class P{constructor(e=0,t=0,n=0){P.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Xa.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Xa.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,o=e.elements;return this.x=o[0]*t+o[3]*n+o[6]*s,this.y=o[1]*t+o[4]*n+o[7]*s,this.z=o[2]*t+o[5]*n+o[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,o=e.elements,a=1/(o[3]*t+o[7]*n+o[11]*s+o[15]);return this.x=(o[0]*t+o[4]*n+o[8]*s+o[12])*a,this.y=(o[1]*t+o[5]*n+o[9]*s+o[13])*a,this.z=(o[2]*t+o[6]*n+o[10]*s+o[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,o=e.x,a=e.y,r=e.z,c=e.w,l=2*(a*s-r*n),h=2*(r*t-o*s),d=2*(o*n-a*t);return this.x=t+c*l+a*d-r*h,this.y=n+c*h+r*l-o*d,this.z=s+c*d+o*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s,this.y=o[1]*t+o[5]*n+o[9]*s,this.z=o[2]*t+o[6]*n+o[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,o=e.z,a=t.x,r=t.y,c=t.z;return this.x=s*c-o*r,this.y=o*a-n*c,this.z=n*r-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Oo.copy(this).projectOnVector(e),this.sub(Oo)}reflect(e){return this.sub(Oo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos($t(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Oo=new P,Xa=new gs;class _s{constructor(e=new P(1/0,1/0,1/0),t=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const o=n.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let a=0,r=o.count;a<r;a++)e.isMesh===!0?e.getVertexPosition(a,fn):fn.fromBufferAttribute(o,a),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),bs.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),bs.copy(n.boundingBox)),bs.applyMatrix4(e.matrixWorld),this.union(bs)}const s=e.children;for(let o=0,a=s.length;o<a;o++)this.expandByObject(s[o],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Qi),ws.subVectors(this.max,Qi),vi.subVectors(e.a,Qi),Mi.subVectors(e.b,Qi),Si.subVectors(e.c,Qi),Nn.subVectors(Mi,vi),Fn.subVectors(Si,Mi),Zn.subVectors(vi,Si);let t=[0,-Nn.z,Nn.y,0,-Fn.z,Fn.y,0,-Zn.z,Zn.y,Nn.z,0,-Nn.x,Fn.z,0,-Fn.x,Zn.z,0,-Zn.x,-Nn.y,Nn.x,0,-Fn.y,Fn.x,0,-Zn.y,Zn.x,0];return!ko(t,vi,Mi,Si,ws)||(t=[1,0,0,0,1,0,0,0,1],!ko(t,vi,Mi,Si,ws))?!1:(Ts.crossVectors(Nn,Fn),t=[Ts.x,Ts.y,Ts.z],ko(t,vi,Mi,Si,ws))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(wn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),wn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),wn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),wn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),wn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),wn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),wn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),wn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(wn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const wn=[new P,new P,new P,new P,new P,new P,new P,new P],fn=new P,bs=new _s,vi=new P,Mi=new P,Si=new P,Nn=new P,Fn=new P,Zn=new P,Qi=new P,ws=new P,Ts=new P,Jn=new P;function ko(i,e,t,n,s){for(let o=0,a=i.length-3;o<=a;o+=3){Jn.fromArray(i,o);const r=s.x*Math.abs(Jn.x)+s.y*Math.abs(Jn.y)+s.z*Math.abs(Jn.z),c=e.dot(Jn),l=t.dot(Jn),h=n.dot(Jn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>r)return!1}return!0}const id=new _s,es=new P,zo=new P;class Or{constructor(e=new P,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):id.setFromPoints(e).getCenter(n);let s=0;for(let o=0,a=e.length;o<a;o++)s=Math.max(s,n.distanceToSquared(e[o]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;es.subVectors(e,this.center);const t=es.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(es,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(zo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(es.copy(e.center).add(zo)),this.expandByPoint(es.copy(e.center).sub(zo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Tn=new P,Bo=new P,As=new P,On=new P,Ho=new P,Rs=new P,Go=new P;class il{constructor(e=new P,t=new P(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Tn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Tn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Tn.copy(this.origin).addScaledVector(this.direction,t),Tn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Bo.copy(e).add(t).multiplyScalar(.5),As.copy(t).sub(e).normalize(),On.copy(this.origin).sub(Bo);const o=e.distanceTo(t)*.5,a=-this.direction.dot(As),r=On.dot(this.direction),c=-On.dot(As),l=On.lengthSq(),h=Math.abs(1-a*a);let d,u,p,g;if(h>0)if(d=a*c-r,u=a*r-c,g=o*h,d>=0)if(u>=-g)if(u<=g){const x=1/h;d*=x,u*=x,p=d*(d+a*u+2*r)+u*(a*d+u+2*c)+l}else u=o,d=Math.max(0,-(a*u+r)),p=-d*d+u*(u+2*c)+l;else u=-o,d=Math.max(0,-(a*u+r)),p=-d*d+u*(u+2*c)+l;else u<=-g?(d=Math.max(0,-(-a*o+r)),u=d>0?-o:Math.min(Math.max(-o,-c),o),p=-d*d+u*(u+2*c)+l):u<=g?(d=0,u=Math.min(Math.max(-o,-c),o),p=u*(u+2*c)+l):(d=Math.max(0,-(a*o+r)),u=d>0?o:Math.min(Math.max(-o,-c),o),p=-d*d+u*(u+2*c)+l);else u=a>0?-o:o,d=Math.max(0,-(a*u+r)),p=-d*d+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Bo).addScaledVector(As,u),p}intersectSphere(e,t){Tn.subVectors(e.center,this.origin);const n=Tn.dot(this.direction),s=Tn.dot(Tn)-n*n,o=e.radius*e.radius;if(s>o)return null;const a=Math.sqrt(o-s),r=n-a,c=n+a;return c<0?null:r<0?this.at(c,t):this.at(r,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,o,a,r,c;const l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return l>=0?(n=(e.min.x-u.x)*l,s=(e.max.x-u.x)*l):(n=(e.max.x-u.x)*l,s=(e.min.x-u.x)*l),h>=0?(o=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(o=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||o>s||((o>n||isNaN(n))&&(n=o),(a<s||isNaN(s))&&(s=a),d>=0?(r=(e.min.z-u.z)*d,c=(e.max.z-u.z)*d):(r=(e.max.z-u.z)*d,c=(e.min.z-u.z)*d),n>c||r>s)||((r>n||n!==n)&&(n=r),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Tn)!==null}intersectTriangle(e,t,n,s,o){Ho.subVectors(t,e),Rs.subVectors(n,e),Go.crossVectors(Ho,Rs);let a=this.direction.dot(Go),r;if(a>0){if(s)return null;r=1}else if(a<0)r=-1,a=-a;else return null;On.subVectors(this.origin,e);const c=r*this.direction.dot(Rs.crossVectors(On,Rs));if(c<0)return null;const l=r*this.direction.dot(Ho.cross(On));if(l<0||c+l>a)return null;const h=-r*On.dot(Go);return h<0?null:this.at(h/a,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class St{constructor(e,t,n,s,o,a,r,c,l,h,d,u,p,g,x,m){St.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,o,a,r,c,l,h,d,u,p,g,x,m)}set(e,t,n,s,o,a,r,c,l,h,d,u,p,g,x,m){const f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=s,f[1]=o,f[5]=a,f[9]=r,f[13]=c,f[2]=l,f[6]=h,f[10]=d,f[14]=u,f[3]=p,f[7]=g,f[11]=x,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new St().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,s=1/yi.setFromMatrixColumn(e,0).length(),o=1/yi.setFromMatrixColumn(e,1).length(),a=1/yi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*o,t[5]=n[5]*o,t[6]=n[6]*o,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,o=e.z,a=Math.cos(n),r=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(o),d=Math.sin(o);if(e.order==="XYZ"){const u=a*h,p=a*d,g=r*h,x=r*d;t[0]=c*h,t[4]=-c*d,t[8]=l,t[1]=p+g*l,t[5]=u-x*l,t[9]=-r*c,t[2]=x-u*l,t[6]=g+p*l,t[10]=a*c}else if(e.order==="YXZ"){const u=c*h,p=c*d,g=l*h,x=l*d;t[0]=u+x*r,t[4]=g*r-p,t[8]=a*l,t[1]=a*d,t[5]=a*h,t[9]=-r,t[2]=p*r-g,t[6]=x+u*r,t[10]=a*c}else if(e.order==="ZXY"){const u=c*h,p=c*d,g=l*h,x=l*d;t[0]=u-x*r,t[4]=-a*d,t[8]=g+p*r,t[1]=p+g*r,t[5]=a*h,t[9]=x-u*r,t[2]=-a*l,t[6]=r,t[10]=a*c}else if(e.order==="ZYX"){const u=a*h,p=a*d,g=r*h,x=r*d;t[0]=c*h,t[4]=g*l-p,t[8]=u*l+x,t[1]=c*d,t[5]=x*l+u,t[9]=p*l-g,t[2]=-l,t[6]=r*c,t[10]=a*c}else if(e.order==="YZX"){const u=a*c,p=a*l,g=r*c,x=r*l;t[0]=c*h,t[4]=x-u*d,t[8]=g*d+p,t[1]=d,t[5]=a*h,t[9]=-r*h,t[2]=-l*h,t[6]=p*d+g,t[10]=u-x*d}else if(e.order==="XZY"){const u=a*c,p=a*l,g=r*c,x=r*l;t[0]=c*h,t[4]=-d,t[8]=l*h,t[1]=u*d+x,t[5]=a*h,t[9]=p*d-g,t[2]=g*d-p,t[6]=r*h,t[10]=x*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(sd,e,od)}lookAt(e,t,n){const s=this.elements;return en.subVectors(e,t),en.lengthSq()===0&&(en.z=1),en.normalize(),kn.crossVectors(n,en),kn.lengthSq()===0&&(Math.abs(n.z)===1?en.x+=1e-4:en.z+=1e-4,en.normalize(),kn.crossVectors(n,en)),kn.normalize(),Cs.crossVectors(en,kn),s[0]=kn.x,s[4]=Cs.x,s[8]=en.x,s[1]=kn.y,s[5]=Cs.y,s[9]=en.y,s[2]=kn.z,s[6]=Cs.z,s[10]=en.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,o=this.elements,a=n[0],r=n[4],c=n[8],l=n[12],h=n[1],d=n[5],u=n[9],p=n[13],g=n[2],x=n[6],m=n[10],f=n[14],v=n[3],_=n[7],E=n[11],R=n[15],T=s[0],A=s[4],I=s[8],S=s[12],w=s[1],U=s[5],V=s[9],te=s[13],L=s[2],N=s[6],W=s[10],Y=s[14],q=s[3],X=s[7],Z=s[11],ee=s[15];return o[0]=a*T+r*w+c*L+l*q,o[4]=a*A+r*U+c*N+l*X,o[8]=a*I+r*V+c*W+l*Z,o[12]=a*S+r*te+c*Y+l*ee,o[1]=h*T+d*w+u*L+p*q,o[5]=h*A+d*U+u*N+p*X,o[9]=h*I+d*V+u*W+p*Z,o[13]=h*S+d*te+u*Y+p*ee,o[2]=g*T+x*w+m*L+f*q,o[6]=g*A+x*U+m*N+f*X,o[10]=g*I+x*V+m*W+f*Z,o[14]=g*S+x*te+m*Y+f*ee,o[3]=v*T+_*w+E*L+R*q,o[7]=v*A+_*U+E*N+R*X,o[11]=v*I+_*V+E*W+R*Z,o[15]=v*S+_*te+E*Y+R*ee,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],o=e[12],a=e[1],r=e[5],c=e[9],l=e[13],h=e[2],d=e[6],u=e[10],p=e[14],g=e[3],x=e[7],m=e[11],f=e[15];return g*(+o*c*d-s*l*d-o*r*u+n*l*u+s*r*p-n*c*p)+x*(+t*c*p-t*l*u+o*a*u-s*a*p+s*l*h-o*c*h)+m*(+t*l*d-t*r*p-o*a*d+n*a*p+o*r*h-n*l*h)+f*(-s*r*h-t*c*d+t*r*u+s*a*d-n*a*u+n*c*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],o=e[3],a=e[4],r=e[5],c=e[6],l=e[7],h=e[8],d=e[9],u=e[10],p=e[11],g=e[12],x=e[13],m=e[14],f=e[15],v=d*m*l-x*u*l+x*c*p-r*m*p-d*c*f+r*u*f,_=g*u*l-h*m*l-g*c*p+a*m*p+h*c*f-a*u*f,E=h*x*l-g*d*l+g*r*p-a*x*p-h*r*f+a*d*f,R=g*d*c-h*x*c-g*r*u+a*x*u+h*r*m-a*d*m,T=t*v+n*_+s*E+o*R;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/T;return e[0]=v*A,e[1]=(x*u*o-d*m*o-x*s*p+n*m*p+d*s*f-n*u*f)*A,e[2]=(r*m*o-x*c*o+x*s*l-n*m*l-r*s*f+n*c*f)*A,e[3]=(d*c*o-r*u*o-d*s*l+n*u*l+r*s*p-n*c*p)*A,e[4]=_*A,e[5]=(h*m*o-g*u*o+g*s*p-t*m*p-h*s*f+t*u*f)*A,e[6]=(g*c*o-a*m*o-g*s*l+t*m*l+a*s*f-t*c*f)*A,e[7]=(a*u*o-h*c*o+h*s*l-t*u*l-a*s*p+t*c*p)*A,e[8]=E*A,e[9]=(g*d*o-h*x*o-g*n*p+t*x*p+h*n*f-t*d*f)*A,e[10]=(a*x*o-g*r*o+g*n*l-t*x*l-a*n*f+t*r*f)*A,e[11]=(h*r*o-a*d*o-h*n*l+t*d*l+a*n*p-t*r*p)*A,e[12]=R*A,e[13]=(h*x*s-g*d*s+g*n*u-t*x*u-h*n*m+t*d*m)*A,e[14]=(g*r*s-a*x*s-g*n*c+t*x*c+a*n*m-t*r*m)*A,e[15]=(a*d*s-h*r*s+h*n*c-t*d*c-a*n*u+t*r*u)*A,this}scale(e){const t=this.elements,n=e.x,s=e.y,o=e.z;return t[0]*=n,t[4]*=s,t[8]*=o,t[1]*=n,t[5]*=s,t[9]*=o,t[2]*=n,t[6]*=s,t[10]*=o,t[3]*=n,t[7]*=s,t[11]*=o,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),o=1-n,a=e.x,r=e.y,c=e.z,l=o*a,h=o*r;return this.set(l*a+n,l*r-s*c,l*c+s*r,0,l*r+s*c,h*r+n,h*c-s*a,0,l*c-s*r,h*c+s*a,o*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,o,a){return this.set(1,n,o,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,o=t._x,a=t._y,r=t._z,c=t._w,l=o+o,h=a+a,d=r+r,u=o*l,p=o*h,g=o*d,x=a*h,m=a*d,f=r*d,v=c*l,_=c*h,E=c*d,R=n.x,T=n.y,A=n.z;return s[0]=(1-(x+f))*R,s[1]=(p+E)*R,s[2]=(g-_)*R,s[3]=0,s[4]=(p-E)*T,s[5]=(1-(u+f))*T,s[6]=(m+v)*T,s[7]=0,s[8]=(g+_)*A,s[9]=(m-v)*A,s[10]=(1-(u+x))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;let o=yi.set(s[0],s[1],s[2]).length();const a=yi.set(s[4],s[5],s[6]).length(),r=yi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(o=-o),e.x=s[12],e.y=s[13],e.z=s[14],pn.copy(this);const l=1/o,h=1/a,d=1/r;return pn.elements[0]*=l,pn.elements[1]*=l,pn.elements[2]*=l,pn.elements[4]*=h,pn.elements[5]*=h,pn.elements[6]*=h,pn.elements[8]*=d,pn.elements[9]*=d,pn.elements[10]*=d,t.setFromRotationMatrix(pn),n.x=o,n.y=a,n.z=r,this}makePerspective(e,t,n,s,o,a,r=Pn){const c=this.elements,l=2*o/(t-e),h=2*o/(n-s),d=(t+e)/(t-e),u=(n+s)/(n-s);let p,g;if(r===Pn)p=-(a+o)/(a-o),g=-2*a*o/(a-o);else if(r===io)p=-a/(a-o),g=-a*o/(a-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+r);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=u,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,o,a,r=Pn){const c=this.elements,l=1/(t-e),h=1/(n-s),d=1/(a-o),u=(t+e)*l,p=(n+s)*h;let g,x;if(r===Pn)g=(a+o)*d,x=-2*d;else if(r===io)g=o*d,x=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+r);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-u,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=x,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const yi=new P,pn=new St,sd=new P(0,0,0),od=new P(1,1,1),kn=new P,Cs=new P,en=new P,qa=new St,Ya=new gs;class uo{constructor(e=0,t=0,n=0,s=uo.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,o=s[0],a=s[4],r=s[8],c=s[1],l=s[5],h=s[9],d=s[2],u=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin($t(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,o)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-$t(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(r,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,o),this._z=0);break;case"ZXY":this._x=Math.asin($t(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,o));break;case"ZYX":this._y=Math.asin(-$t(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(c,o)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin($t(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,o)):(this._x=0,this._y=Math.atan2(r,p));break;case"XZY":this._z=Math.asin(-$t(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(r,o)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return qa.makeRotationFromQuaternion(e),this.setFromRotationMatrix(qa,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ya.setFromEuler(this),this.setFromQuaternion(Ya,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}uo.DEFAULT_ORDER="XYZ";class kr{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let rd=0;const $a=new P,Ei=new gs,An=new St,Ls=new P,ts=new P,ad=new P,cd=new gs,ja=new P(1,0,0),Ka=new P(0,1,0),Za=new P(0,0,1),ld={type:"added"},hd={type:"removed"};class Ft extends $i{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:rd++}),this.uuid=ms(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ft.DEFAULT_UP.clone();const e=new P,t=new uo,n=new gs,s=new P(1,1,1);function o(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(o),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new St},normalMatrix:{value:new $e}}),this.matrix=new St,this.matrixWorld=new St,this.matrixAutoUpdate=Ft.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new kr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.multiply(Ei),this}rotateOnWorldAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.premultiply(Ei),this}rotateX(e){return this.rotateOnAxis(ja,e)}rotateY(e){return this.rotateOnAxis(Ka,e)}rotateZ(e){return this.rotateOnAxis(Za,e)}translateOnAxis(e,t){return $a.copy(e).applyQuaternion(this.quaternion),this.position.add($a.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ja,e)}translateY(e){return this.translateOnAxis(Ka,e)}translateZ(e){return this.translateOnAxis(Za,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(An.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ls.copy(e):Ls.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),ts.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?An.lookAt(ts,Ls,this.up):An.lookAt(Ls,ts,this.up),this.quaternion.setFromRotationMatrix(An),s&&(An.extractRotation(s.matrixWorld),Ei.setFromRotationMatrix(An),this.quaternion.premultiply(Ei.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(ld)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(hd)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),An.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),An.multiply(e.parent.matrixWorld)),e.applyMatrix4(An),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ts,e,ad),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ts,cd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++){const o=t[n];(o.matrixWorldAutoUpdate===!0||e===!0)&&o.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const s=this.children;for(let o=0,a=s.length;o<a;o++){const r=s[o];r.matrixWorldAutoUpdate===!0&&r.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(r=>({boxInitialized:r.boxInitialized,boxMin:r.box.min.toArray(),boxMax:r.box.max.toArray(),sphereInitialized:r.sphereInitialized,sphereRadius:r.sphere.radius,sphereCenter:r.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function o(r,c){return r[c.uuid]===void 0&&(r[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=o(e.geometries,this.geometry);const r=this.geometry.parameters;if(r!==void 0&&r.shapes!==void 0){const c=r.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const d=c[l];o(e.shapes,d)}else o(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const r=[];for(let c=0,l=this.material.length;c<l;c++)r.push(o(e.materials,this.material[c]));s.material=r}else s.material=o(e.materials,this.material);if(this.children.length>0){s.children=[];for(let r=0;r<this.children.length;r++)s.children.push(this.children[r].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let r=0;r<this.animations.length;r++){const c=this.animations[r];s.animations.push(o(e.animations,c))}}if(t){const r=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),d=a(e.shapes),u=a(e.skeletons),p=a(e.animations),g=a(e.nodes);r.length>0&&(n.geometries=r),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(r){const c=[];for(const l in r){const h=r[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}Ft.DEFAULT_UP=new P(0,1,0);Ft.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const mn=new P,Rn=new P,Vo=new P,Cn=new P,bi=new P,wi=new P,Ja=new P,Wo=new P,Xo=new P,qo=new P;let Ps=!1;class gn{constructor(e=new P,t=new P,n=new P){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),mn.subVectors(e,t),s.cross(mn);const o=s.lengthSq();return o>0?s.multiplyScalar(1/Math.sqrt(o)):s.set(0,0,0)}static getBarycoord(e,t,n,s,o){mn.subVectors(s,t),Rn.subVectors(n,t),Vo.subVectors(e,t);const a=mn.dot(mn),r=mn.dot(Rn),c=mn.dot(Vo),l=Rn.dot(Rn),h=Rn.dot(Vo),d=a*l-r*r;if(d===0)return o.set(0,0,0),null;const u=1/d,p=(l*c-r*h)*u,g=(a*h-r*c)*u;return o.set(1-p-g,g,p)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Cn)===null?!1:Cn.x>=0&&Cn.y>=0&&Cn.x+Cn.y<=1}static getUV(e,t,n,s,o,a,r,c){return Ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ps=!0),this.getInterpolation(e,t,n,s,o,a,r,c)}static getInterpolation(e,t,n,s,o,a,r,c){return this.getBarycoord(e,t,n,s,Cn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(o,Cn.x),c.addScaledVector(a,Cn.y),c.addScaledVector(r,Cn.z),c)}static isFrontFacing(e,t,n,s){return mn.subVectors(n,t),Rn.subVectors(e,t),mn.cross(Rn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return mn.subVectors(this.c,this.b),Rn.subVectors(this.a,this.b),mn.cross(Rn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return gn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return gn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,s,o){return Ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ps=!0),gn.getInterpolation(e,this.a,this.b,this.c,t,n,s,o)}getInterpolation(e,t,n,s,o){return gn.getInterpolation(e,this.a,this.b,this.c,t,n,s,o)}containsPoint(e){return gn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return gn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,o=this.c;let a,r;bi.subVectors(s,n),wi.subVectors(o,n),Wo.subVectors(e,n);const c=bi.dot(Wo),l=wi.dot(Wo);if(c<=0&&l<=0)return t.copy(n);Xo.subVectors(e,s);const h=bi.dot(Xo),d=wi.dot(Xo);if(h>=0&&d<=h)return t.copy(s);const u=c*d-h*l;if(u<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(n).addScaledVector(bi,a);qo.subVectors(e,o);const p=bi.dot(qo),g=wi.dot(qo);if(g>=0&&p<=g)return t.copy(o);const x=p*l-c*g;if(x<=0&&l>=0&&g<=0)return r=l/(l-g),t.copy(n).addScaledVector(wi,r);const m=h*g-p*d;if(m<=0&&d-h>=0&&p-g>=0)return Ja.subVectors(o,s),r=(d-h)/(d-h+(p-g)),t.copy(s).addScaledVector(Ja,r);const f=1/(m+x+u);return a=x*f,r=u*f,t.copy(n).addScaledVector(bi,a).addScaledVector(wi,r)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const sl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zn={h:0,s:0,l:0},Ds={h:0,s:0,l:0};function Yo(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Se{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=It){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ot.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=ot.workingColorSpace){return this.r=e,this.g=t,this.b=n,ot.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=ot.workingColorSpace){if(e=Kh(e,1),t=$t(t,0,1),n=$t(n,0,1),t===0)this.r=this.g=this.b=n;else{const o=n<=.5?n*(1+t):n+t-n*t,a=2*n-o;this.r=Yo(a,o,e+1/3),this.g=Yo(a,o,e),this.b=Yo(a,o,e-1/3)}return ot.toWorkingColorSpace(this,s),this}setStyle(e,t=It){function n(o){o!==void 0&&parseFloat(o)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let o;const a=s[1],r=s[2];switch(a){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return n(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return n(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return n(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const o=s[1],a=o.length;if(a===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(o,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=It){const n=sl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Bi(e.r),this.g=Bi(e.g),this.b=Bi(e.b),this}copyLinearToSRGB(e){return this.r=No(e.r),this.g=No(e.g),this.b=No(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=It){return ot.fromWorkingColorSpace(Bt.copy(this),e),Math.round($t(Bt.r*255,0,255))*65536+Math.round($t(Bt.g*255,0,255))*256+Math.round($t(Bt.b*255,0,255))}getHexString(e=It){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ot.workingColorSpace){ot.fromWorkingColorSpace(Bt.copy(this),t);const n=Bt.r,s=Bt.g,o=Bt.b,a=Math.max(n,s,o),r=Math.min(n,s,o);let c,l;const h=(r+a)/2;if(r===a)c=0,l=0;else{const d=a-r;switch(l=h<=.5?d/(a+r):d/(2-a-r),a){case n:c=(s-o)/d+(s<o?6:0);break;case s:c=(o-n)/d+2;break;case o:c=(n-s)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=ot.workingColorSpace){return ot.fromWorkingColorSpace(Bt.copy(this),t),e.r=Bt.r,e.g=Bt.g,e.b=Bt.b,e}getStyle(e=It){ot.fromWorkingColorSpace(Bt.copy(this),e);const t=Bt.r,n=Bt.g,s=Bt.b;return e!==It?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(zn),this.setHSL(zn.h+e,zn.s+t,zn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(zn),e.getHSL(Ds);const n=Io(zn.h,Ds.h,t),s=Io(zn.s,Ds.s,t),o=Io(zn.l,Ds.l,t);return this.setHSL(n,s,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,o=e.elements;return this.r=o[0]*t+o[3]*n+o[6]*s,this.g=o[1]*t+o[4]*n+o[7]*s,this.b=o[2]*t+o[5]*n+o[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Bt=new Se;Se.NAMES=sl;let dd=0;class xs extends $i{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:dd++}),this.uuid=ms(),this.name="",this.type="Material",this.blending=zi,this.side=Yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=xr,this.blendDst=vr,this.blendEquation=ii,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Se(0,0,0),this.blendAlpha=0,this.depthFunc=Qs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ka,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=_i,this.stencilZFail=_i,this.stencilZPass=_i,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==zi&&(n.blending=this.blending),this.side!==Yn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==xr&&(n.blendSrc=this.blendSrc),this.blendDst!==vr&&(n.blendDst=this.blendDst),this.blendEquation!==ii&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Qs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ka&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==_i&&(n.stencilFail=this.stencilFail),this.stencilZFail!==_i&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==_i&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(o){const a=[];for(const r in o){const c=o[r];delete c.metadata,a.push(c)}return a}if(t){const o=s(e.textures),a=s(e.images);o.length>0&&(n.textures=o),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let o=0;o!==s;++o)n[o]=t[o].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Ht extends xs{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Se(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ur,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const vt=new P,Is=new je;class sn{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=za,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Gn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,o=this.itemSize;s<o;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Is.fromBufferAttribute(this,t),Is.applyMatrix3(e),this.setXY(t,Is.x,Is.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix3(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix4(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyNormalMatrix(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.transformDirection(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ji(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Yt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ji(t,this.array)),t}setX(e,t){return this.normalized&&(t=Yt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ji(t,this.array)),t}setY(e,t){return this.normalized&&(t=Yt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ji(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Yt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ji(t,this.array)),t}setW(e,t){return this.normalized&&(t=Yt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Yt(t,this.array),n=Yt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Yt(t,this.array),n=Yt(n,this.array),s=Yt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,o){return e*=this.itemSize,this.normalized&&(t=Yt(t,this.array),n=Yt(n,this.array),s=Yt(s,this.array),o=Yt(o,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==za&&(e.usage=this.usage),e}}class ol extends sn{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class rl extends sn{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class ht extends sn{constructor(e,t,n){super(new Float32Array(e),t,n)}}let ud=0;const rn=new St,$o=new Ft,Ti=new P,tn=new _s,ns=new _s,Tt=new P;class Jt extends $i{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ud++}),this.uuid=ms(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Qc(e)?rl:ol)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const o=new $e().getNormalMatrix(e);n.applyNormalMatrix(o),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return rn.makeRotationFromQuaternion(e),this.applyMatrix4(rn),this}rotateX(e){return rn.makeRotationX(e),this.applyMatrix4(rn),this}rotateY(e){return rn.makeRotationY(e),this.applyMatrix4(rn),this}rotateZ(e){return rn.makeRotationZ(e),this.applyMatrix4(rn),this}translate(e,t,n){return rn.makeTranslation(e,t,n),this.applyMatrix4(rn),this}scale(e,t,n){return rn.makeScale(e,t,n),this.applyMatrix4(rn),this}lookAt(e){return $o.lookAt(e),$o.updateMatrix(),this.applyMatrix4($o.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ti).negate(),this.translate(Ti.x,Ti.y,Ti.z),this}setFromPoints(e){const t=[];for(let n=0,s=e.length;n<s;n++){const o=e[n];t.push(o.x,o.y,o.z||0)}return this.setAttribute("position",new ht(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _s);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const o=t[n];tn.setFromBufferAttribute(o),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,tn.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,tn.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(tn.min),this.boundingBox.expandByPoint(tn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Or);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new P,1/0);return}if(e){const n=this.boundingSphere.center;if(tn.setFromBufferAttribute(e),t)for(let o=0,a=t.length;o<a;o++){const r=t[o];ns.setFromBufferAttribute(r),this.morphTargetsRelative?(Tt.addVectors(tn.min,ns.min),tn.expandByPoint(Tt),Tt.addVectors(tn.max,ns.max),tn.expandByPoint(Tt)):(tn.expandByPoint(ns.min),tn.expandByPoint(ns.max))}tn.getCenter(n);let s=0;for(let o=0,a=e.count;o<a;o++)Tt.fromBufferAttribute(e,o),s=Math.max(s,n.distanceToSquared(Tt));if(t)for(let o=0,a=t.length;o<a;o++){const r=t[o],c=this.morphTargetsRelative;for(let l=0,h=r.count;l<h;l++)Tt.fromBufferAttribute(r,l),c&&(Ti.fromBufferAttribute(e,l),Tt.add(Ti)),s=Math.max(s,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,s=t.position.array,o=t.normal.array,a=t.uv.array,r=s.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new sn(new Float32Array(4*r),4));const c=this.getAttribute("tangent").array,l=[],h=[];for(let w=0;w<r;w++)l[w]=new P,h[w]=new P;const d=new P,u=new P,p=new P,g=new je,x=new je,m=new je,f=new P,v=new P;function _(w,U,V){d.fromArray(s,w*3),u.fromArray(s,U*3),p.fromArray(s,V*3),g.fromArray(a,w*2),x.fromArray(a,U*2),m.fromArray(a,V*2),u.sub(d),p.sub(d),x.sub(g),m.sub(g);const te=1/(x.x*m.y-m.x*x.y);isFinite(te)&&(f.copy(u).multiplyScalar(m.y).addScaledVector(p,-x.y).multiplyScalar(te),v.copy(p).multiplyScalar(x.x).addScaledVector(u,-m.x).multiplyScalar(te),l[w].add(f),l[U].add(f),l[V].add(f),h[w].add(v),h[U].add(v),h[V].add(v))}let E=this.groups;E.length===0&&(E=[{start:0,count:n.length}]);for(let w=0,U=E.length;w<U;++w){const V=E[w],te=V.start,L=V.count;for(let N=te,W=te+L;N<W;N+=3)_(n[N+0],n[N+1],n[N+2])}const R=new P,T=new P,A=new P,I=new P;function S(w){A.fromArray(o,w*3),I.copy(A);const U=l[w];R.copy(U),R.sub(A.multiplyScalar(A.dot(U))).normalize(),T.crossVectors(I,U);const te=T.dot(h[w])<0?-1:1;c[w*4]=R.x,c[w*4+1]=R.y,c[w*4+2]=R.z,c[w*4+3]=te}for(let w=0,U=E.length;w<U;++w){const V=E[w],te=V.start,L=V.count;for(let N=te,W=te+L;N<W;N+=3)S(n[N+0]),S(n[N+1]),S(n[N+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new sn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,p=n.count;u<p;u++)n.setXYZ(u,0,0,0);const s=new P,o=new P,a=new P,r=new P,c=new P,l=new P,h=new P,d=new P;if(e)for(let u=0,p=e.count;u<p;u+=3){const g=e.getX(u+0),x=e.getX(u+1),m=e.getX(u+2);s.fromBufferAttribute(t,g),o.fromBufferAttribute(t,x),a.fromBufferAttribute(t,m),h.subVectors(a,o),d.subVectors(s,o),h.cross(d),r.fromBufferAttribute(n,g),c.fromBufferAttribute(n,x),l.fromBufferAttribute(n,m),r.add(h),c.add(h),l.add(h),n.setXYZ(g,r.x,r.y,r.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let u=0,p=t.count;u<p;u+=3)s.fromBufferAttribute(t,u+0),o.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,o),d.subVectors(s,o),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(r,c){const l=r.array,h=r.itemSize,d=r.normalized,u=new l.constructor(c.length*h);let p=0,g=0;for(let x=0,m=c.length;x<m;x++){r.isInterleavedBufferAttribute?p=c[x]*r.data.stride+r.offset:p=c[x]*h;for(let f=0;f<h;f++)u[g++]=l[p++]}return new sn(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Jt,n=this.index.array,s=this.attributes;for(const r in s){const c=s[r],l=e(c,n);t.setAttribute(r,l)}const o=this.morphAttributes;for(const r in o){const c=[],l=o[r];for(let h=0,d=l.length;h<d;h++){const u=l[h],p=e(u,n);c.push(p)}t.morphAttributes[r]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let r=0,c=a.length;r<c;r++){const l=a[r];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const s={};let o=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let d=0,u=l.length;d<u;d++){const p=l[d];h.push(p.toJSON(e.data))}h.length>0&&(s[c]=h,o=!0)}o&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const r=this.boundingSphere;return r!==null&&(e.data.boundingSphere={center:r.center.toArray(),radius:r.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const s=e.attributes;for(const l in s){const h=s[l];this.setAttribute(l,h.clone(t))}const o=e.morphAttributes;for(const l in o){const h=[],d=o[l];for(let u=0,p=d.length;u<p;u++)h.push(d[u].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,h=a.length;l<h;l++){const d=a[l];this.addGroup(d.start,d.count,d.materialIndex)}const r=e.boundingBox;r!==null&&(this.boundingBox=r.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Qa=new St,Qn=new il,Us=new Or,ec=new P,Ai=new P,Ri=new P,Ci=new P,jo=new P,Ns=new P,Fs=new je,Os=new je,ks=new je,tc=new P,nc=new P,ic=new P,zs=new P,Bs=new P;class Ce extends Ft{constructor(e=new Jt,t=new Ht){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,a=s.length;o<a;o++){const r=s[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[r]=o}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,o=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const r=this.morphTargetInfluences;if(o&&r){Ns.set(0,0,0);for(let c=0,l=o.length;c<l;c++){const h=r[c],d=o[c];h!==0&&(jo.fromBufferAttribute(d,e),a?Ns.addScaledVector(jo,h):Ns.addScaledVector(jo.sub(t),h))}t.add(Ns)}return t}raycast(e,t){const n=this.geometry,s=this.material,o=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Us.copy(n.boundingSphere),Us.applyMatrix4(o),Qn.copy(e.ray).recast(e.near),!(Us.containsPoint(Qn.origin)===!1&&(Qn.intersectSphere(Us,ec)===null||Qn.origin.distanceToSquared(ec)>(e.far-e.near)**2))&&(Qa.copy(o).invert(),Qn.copy(e.ray).applyMatrix4(Qa),!(n.boundingBox!==null&&Qn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Qn)))}_computeIntersections(e,t,n){let s;const o=this.geometry,a=this.material,r=o.index,c=o.attributes.position,l=o.attributes.uv,h=o.attributes.uv1,d=o.attributes.normal,u=o.groups,p=o.drawRange;if(r!==null)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const m=u[g],f=a[m.materialIndex],v=Math.max(m.start,p.start),_=Math.min(r.count,Math.min(m.start+m.count,p.start+p.count));for(let E=v,R=_;E<R;E+=3){const T=r.getX(E),A=r.getX(E+1),I=r.getX(E+2);s=Hs(this,f,e,n,l,h,d,T,A,I),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const g=Math.max(0,p.start),x=Math.min(r.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const v=r.getX(m),_=r.getX(m+1),E=r.getX(m+2);s=Hs(this,a,e,n,l,h,d,v,_,E),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const m=u[g],f=a[m.materialIndex],v=Math.max(m.start,p.start),_=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let E=v,R=_;E<R;E+=3){const T=E,A=E+1,I=E+2;s=Hs(this,f,e,n,l,h,d,T,A,I),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const g=Math.max(0,p.start),x=Math.min(c.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const v=m,_=m+1,E=m+2;s=Hs(this,a,e,n,l,h,d,v,_,E),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}}function fd(i,e,t,n,s,o,a,r){let c;if(e.side===Kt?c=n.intersectTriangle(a,o,s,!0,r):c=n.intersectTriangle(s,o,a,e.side===Yn,r),c===null)return null;Bs.copy(r),Bs.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Bs);return l<t.near||l>t.far?null:{distance:l,point:Bs.clone(),object:i}}function Hs(i,e,t,n,s,o,a,r,c,l){i.getVertexPosition(r,Ai),i.getVertexPosition(c,Ri),i.getVertexPosition(l,Ci);const h=fd(i,e,t,n,Ai,Ri,Ci,zs);if(h){s&&(Fs.fromBufferAttribute(s,r),Os.fromBufferAttribute(s,c),ks.fromBufferAttribute(s,l),h.uv=gn.getInterpolation(zs,Ai,Ri,Ci,Fs,Os,ks,new je)),o&&(Fs.fromBufferAttribute(o,r),Os.fromBufferAttribute(o,c),ks.fromBufferAttribute(o,l),h.uv1=gn.getInterpolation(zs,Ai,Ri,Ci,Fs,Os,ks,new je),h.uv2=h.uv1),a&&(tc.fromBufferAttribute(a,r),nc.fromBufferAttribute(a,c),ic.fromBufferAttribute(a,l),h.normal=gn.getInterpolation(zs,Ai,Ri,Ci,tc,nc,ic,new P),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:r,b:c,c:l,normal:new P,materialIndex:0};gn.getNormal(Ai,Ri,Ci,d.normal),h.face=d}return h}class Ot extends Jt{constructor(e=1,t=1,n=1,s=1,o=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:o,depthSegments:a};const r=this;s=Math.floor(s),o=Math.floor(o),a=Math.floor(a);const c=[],l=[],h=[],d=[];let u=0,p=0;g("z","y","x",-1,-1,n,t,e,a,o,0),g("z","y","x",1,-1,n,t,-e,a,o,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,o,4),g("x","y","z",-1,-1,e,t,-n,s,o,5),this.setIndex(c),this.setAttribute("position",new ht(l,3)),this.setAttribute("normal",new ht(h,3)),this.setAttribute("uv",new ht(d,2));function g(x,m,f,v,_,E,R,T,A,I,S){const w=E/A,U=R/I,V=E/2,te=R/2,L=T/2,N=A+1,W=I+1;let Y=0,q=0;const X=new P;for(let Z=0;Z<W;Z++){const ee=Z*U-te;for(let ue=0;ue<N;ue++){const G=ue*w-V;X[x]=G*v,X[m]=ee*_,X[f]=L,l.push(X.x,X.y,X.z),X[x]=0,X[m]=0,X[f]=T>0?1:-1,h.push(X.x,X.y,X.z),d.push(ue/A),d.push(1-Z/I),Y+=1}}for(let Z=0;Z<I;Z++)for(let ee=0;ee<A;ee++){const ue=u+ee+N*Z,G=u+ee+N*(Z+1),$=u+(ee+1)+N*(Z+1),he=u+(ee+1)+N*Z;c.push(ue,G,he),c.push(G,$,he),q+=6}r.addGroup(p,q,S),p+=q,u+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ot(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Xi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Xt(i){const e={};for(let t=0;t<i.length;t++){const n=Xi(i[t]);for(const s in n)e[s]=n[s]}return e}function pd(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function al(i){return i.getRenderTarget()===null?i.outputColorSpace:ot.workingColorSpace}const md={clone:Xi,merge:Xt};var gd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,_d=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ui extends xs{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=gd,this.fragmentShader=_d,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Xi(e.uniforms),this.uniformsGroups=pd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class cl extends Ft{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new St,this.projectionMatrix=new St,this.projectionMatrixInverse=new St,this.coordinateSystem=Pn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class ln extends cl{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=wr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Do*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return wr*2*Math.atan(Math.tan(Do*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,s,o,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Do*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,o=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;o+=a.offsetX*s/c,t-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const r=this.filmOffset;r!==0&&(o+=e*r/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Li=-90,Pi=1;class xd extends Ft{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new ln(Li,Pi,e,t);s.layers=this.layers,this.add(s);const o=new ln(Li,Pi,e,t);o.layers=this.layers,this.add(o);const a=new ln(Li,Pi,e,t);a.layers=this.layers,this.add(a);const r=new ln(Li,Pi,e,t);r.layers=this.layers,this.add(r);const c=new ln(Li,Pi,e,t);c.layers=this.layers,this.add(c);const l=new ln(Li,Pi,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,o,a,r,c]=t;for(const l of t)this.remove(l);if(e===Pn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),r.up.set(0,1,0),r.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===io)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),r.up.set(0,-1,0),r.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[o,a,r,c,l,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,o),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,r),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,l),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(d,u,p),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class ll extends nn{constructor(e,t,n,s,o,a,r,c,l,h){e=e!==void 0?e:[],t=t!==void 0?t:Gi,super(e,t,n,s,o,a,r,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class vd extends di{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];t.encoding!==void 0&&(cs("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===ci?It:hn),this.texture=new ll(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:cn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ot(5,5,5),o=new ui({name:"CubemapFromEquirect",uniforms:Xi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Kt,blending:Vn});o.uniforms.tEquirect.value=t;const a=new Ce(s,o),r=t.minFilter;return t.minFilter===ds&&(t.minFilter=cn),new xd(1,10,this).update(e,a),t.minFilter=r,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){const o=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(o)}}const Ko=new P,Md=new P,Sd=new $e;class Bn{constructor(e=new P(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=Ko.subVectors(n,t).cross(Md.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Ko),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const o=-(e.start.dot(this.normal)+this.constant)/s;return o<0||o>1?null:t.copy(e.start).addScaledVector(n,o)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Sd.getNormalMatrix(e),s=this.coplanarPoint(Ko).applyMatrix4(e),o=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ei=new Or,Gs=new P;class zr{constructor(e=new Bn,t=new Bn,n=new Bn,s=new Bn,o=new Bn,a=new Bn){this.planes=[e,t,n,s,o,a]}set(e,t,n,s,o,a){const r=this.planes;return r[0].copy(e),r[1].copy(t),r[2].copy(n),r[3].copy(s),r[4].copy(o),r[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Pn){const n=this.planes,s=e.elements,o=s[0],a=s[1],r=s[2],c=s[3],l=s[4],h=s[5],d=s[6],u=s[7],p=s[8],g=s[9],x=s[10],m=s[11],f=s[12],v=s[13],_=s[14],E=s[15];if(n[0].setComponents(c-o,u-l,m-p,E-f).normalize(),n[1].setComponents(c+o,u+l,m+p,E+f).normalize(),n[2].setComponents(c+a,u+h,m+g,E+v).normalize(),n[3].setComponents(c-a,u-h,m-g,E-v).normalize(),n[4].setComponents(c-r,u-d,m-x,E-_).normalize(),t===Pn)n[5].setComponents(c+r,u+d,m+x,E+_).normalize();else if(t===io)n[5].setComponents(r,d,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ei.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ei.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ei)}intersectsSprite(e){return ei.center.set(0,0,0),ei.radius=.7071067811865476,ei.applyMatrix4(e.matrixWorld),this.intersectsSphere(ei)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(Gs.x=s.normal.x>0?e.max.x:e.min.x,Gs.y=s.normal.y>0?e.max.y:e.min.y,Gs.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Gs)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function hl(){let i=null,e=!1,t=null,n=null;function s(o,a){t(o,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){i=o}}}function yd(i,e){const t=e.isWebGL2,n=new WeakMap;function s(l,h){const d=l.array,u=l.usage,p=d.byteLength,g=i.createBuffer();i.bindBuffer(h,g),i.bufferData(h,d,u),l.onUploadCallback();let x;if(d instanceof Float32Array)x=i.FLOAT;else if(d instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(t)x=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else x=i.UNSIGNED_SHORT;else if(d instanceof Int16Array)x=i.SHORT;else if(d instanceof Uint32Array)x=i.UNSIGNED_INT;else if(d instanceof Int32Array)x=i.INT;else if(d instanceof Int8Array)x=i.BYTE;else if(d instanceof Uint8Array)x=i.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)x=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:g,type:x,bytesPerElement:d.BYTES_PER_ELEMENT,version:l.version,size:p}}function o(l,h,d){const u=h.array,p=h._updateRange,g=h.updateRanges;if(i.bindBuffer(d,l),p.count===-1&&g.length===0&&i.bufferSubData(d,0,u),g.length!==0){for(let x=0,m=g.length;x<m;x++){const f=g[x];t?i.bufferSubData(d,f.start*u.BYTES_PER_ELEMENT,u,f.start,f.count):i.bufferSubData(d,f.start*u.BYTES_PER_ELEMENT,u.subarray(f.start,f.start+f.count))}h.clearUpdateRanges()}p.count!==-1&&(t?i.bufferSubData(d,p.offset*u.BYTES_PER_ELEMENT,u,p.offset,p.count):i.bufferSubData(d,p.offset*u.BYTES_PER_ELEMENT,u.subarray(p.offset,p.offset+p.count)),p.count=-1),h.onUploadCallback()}function a(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function r(l){l.isInterleavedBufferAttribute&&(l=l.data);const h=n.get(l);h&&(i.deleteBuffer(h.buffer),n.delete(l))}function c(l,h){if(l.isGLBufferAttribute){const u=n.get(l);(!u||u.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const d=n.get(l);if(d===void 0)n.set(l,s(l,h));else if(d.version<l.version){if(d.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");o(d.buffer,l,h),d.version=l.version}}return{get:a,remove:r,update:c}}class qi extends Jt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const o=e/2,a=t/2,r=Math.floor(n),c=Math.floor(s),l=r+1,h=c+1,d=e/r,u=t/c,p=[],g=[],x=[],m=[];for(let f=0;f<h;f++){const v=f*u-a;for(let _=0;_<l;_++){const E=_*d-o;g.push(E,-v,0),x.push(0,0,1),m.push(_/r),m.push(1-f/c)}}for(let f=0;f<c;f++)for(let v=0;v<r;v++){const _=v+l*f,E=v+l*(f+1),R=v+1+l*(f+1),T=v+1+l*f;p.push(_,E,T),p.push(E,R,T)}this.setIndex(p),this.setAttribute("position",new ht(g,3)),this.setAttribute("normal",new ht(x,3)),this.setAttribute("uv",new ht(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new qi(e.width,e.height,e.widthSegments,e.heightSegments)}}var Ed=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,wd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Td=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ad=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Rd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Cd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ld=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Pd=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Dd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Id=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ud=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Nd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Fd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Od=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,kd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,zd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Bd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Hd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Gd=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Vd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Wd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Xd=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,qd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,$d=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,jd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Kd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Zd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Jd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Qd="gl_FragColor = linearToOutputTexel( gl_FragColor );",eu=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,tu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,nu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,iu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,su=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ou=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,ru=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,au=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,cu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,lu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,hu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,du=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,uu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,fu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,pu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,mu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,gu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,_u=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,xu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,vu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Mu=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Su=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,yu=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Eu=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,bu=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,wu=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Tu=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Au=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ru=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Cu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Lu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Pu=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Du=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Iu=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Uu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Nu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Fu=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ou=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,ku=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,zu=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Bu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Hu=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Gu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wu=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Xu=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,$u=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ju=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ku=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Zu=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Ju=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Qu=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ef=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,tf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,nf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,sf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,of=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,rf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,af=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,cf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,lf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,df=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,uf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ff=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,pf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,mf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,gf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,_f=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,xf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,vf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Mf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,yf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Ef=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,bf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Tf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Af=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Lf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Pf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Df=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,If=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Uf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Nf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ff=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Of=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,kf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Gf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Wf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Xf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,$f=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Jf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ep=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,tp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,np=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ze={alphahash_fragment:Ed,alphahash_pars_fragment:bd,alphamap_fragment:wd,alphamap_pars_fragment:Td,alphatest_fragment:Ad,alphatest_pars_fragment:Rd,aomap_fragment:Cd,aomap_pars_fragment:Ld,batching_pars_vertex:Pd,batching_vertex:Dd,begin_vertex:Id,beginnormal_vertex:Ud,bsdfs:Nd,iridescence_fragment:Fd,bumpmap_pars_fragment:Od,clipping_planes_fragment:kd,clipping_planes_pars_fragment:zd,clipping_planes_pars_vertex:Bd,clipping_planes_vertex:Hd,color_fragment:Gd,color_pars_fragment:Vd,color_pars_vertex:Wd,color_vertex:Xd,common:qd,cube_uv_reflection_fragment:Yd,defaultnormal_vertex:$d,displacementmap_pars_vertex:jd,displacementmap_vertex:Kd,emissivemap_fragment:Zd,emissivemap_pars_fragment:Jd,colorspace_fragment:Qd,colorspace_pars_fragment:eu,envmap_fragment:tu,envmap_common_pars_fragment:nu,envmap_pars_fragment:iu,envmap_pars_vertex:su,envmap_physical_pars_fragment:gu,envmap_vertex:ou,fog_vertex:ru,fog_pars_vertex:au,fog_fragment:cu,fog_pars_fragment:lu,gradientmap_pars_fragment:hu,lightmap_fragment:du,lightmap_pars_fragment:uu,lights_lambert_fragment:fu,lights_lambert_pars_fragment:pu,lights_pars_begin:mu,lights_toon_fragment:_u,lights_toon_pars_fragment:xu,lights_phong_fragment:vu,lights_phong_pars_fragment:Mu,lights_physical_fragment:Su,lights_physical_pars_fragment:yu,lights_fragment_begin:Eu,lights_fragment_maps:bu,lights_fragment_end:wu,logdepthbuf_fragment:Tu,logdepthbuf_pars_fragment:Au,logdepthbuf_pars_vertex:Ru,logdepthbuf_vertex:Cu,map_fragment:Lu,map_pars_fragment:Pu,map_particle_fragment:Du,map_particle_pars_fragment:Iu,metalnessmap_fragment:Uu,metalnessmap_pars_fragment:Nu,morphcolor_vertex:Fu,morphnormal_vertex:Ou,morphtarget_pars_vertex:ku,morphtarget_vertex:zu,normal_fragment_begin:Bu,normal_fragment_maps:Hu,normal_pars_fragment:Gu,normal_pars_vertex:Vu,normal_vertex:Wu,normalmap_pars_fragment:Xu,clearcoat_normal_fragment_begin:qu,clearcoat_normal_fragment_maps:Yu,clearcoat_pars_fragment:$u,iridescence_pars_fragment:ju,opaque_fragment:Ku,packing:Zu,premultiplied_alpha_fragment:Ju,project_vertex:Qu,dithering_fragment:ef,dithering_pars_fragment:tf,roughnessmap_fragment:nf,roughnessmap_pars_fragment:sf,shadowmap_pars_fragment:of,shadowmap_pars_vertex:rf,shadowmap_vertex:af,shadowmask_pars_fragment:cf,skinbase_vertex:lf,skinning_pars_vertex:hf,skinning_vertex:df,skinnormal_vertex:uf,specularmap_fragment:ff,specularmap_pars_fragment:pf,tonemapping_fragment:mf,tonemapping_pars_fragment:gf,transmission_fragment:_f,transmission_pars_fragment:xf,uv_pars_fragment:vf,uv_pars_vertex:Mf,uv_vertex:Sf,worldpos_vertex:yf,background_vert:Ef,background_frag:bf,backgroundCube_vert:wf,backgroundCube_frag:Tf,cube_vert:Af,cube_frag:Rf,depth_vert:Cf,depth_frag:Lf,distanceRGBA_vert:Pf,distanceRGBA_frag:Df,equirect_vert:If,equirect_frag:Uf,linedashed_vert:Nf,linedashed_frag:Ff,meshbasic_vert:Of,meshbasic_frag:kf,meshlambert_vert:zf,meshlambert_frag:Bf,meshmatcap_vert:Hf,meshmatcap_frag:Gf,meshnormal_vert:Vf,meshnormal_frag:Wf,meshphong_vert:Xf,meshphong_frag:qf,meshphysical_vert:Yf,meshphysical_frag:$f,meshtoon_vert:jf,meshtoon_frag:Kf,points_vert:Zf,points_frag:Jf,shadow_vert:Qf,shadow_frag:ep,sprite_vert:tp,sprite_frag:np},se={common:{diffuse:{value:new Se(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new $e}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new $e}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new $e}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new $e},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new $e},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new $e},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new $e}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new $e}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new $e}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Se(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Se(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0},uvTransform:{value:new $e}},sprite:{diffuse:{value:new Se(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}}},En={basic:{uniforms:Xt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:ze.meshbasic_vert,fragmentShader:ze.meshbasic_frag},lambert:{uniforms:Xt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Se(0)}}]),vertexShader:ze.meshlambert_vert,fragmentShader:ze.meshlambert_frag},phong:{uniforms:Xt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Se(0)},specular:{value:new Se(1118481)},shininess:{value:30}}]),vertexShader:ze.meshphong_vert,fragmentShader:ze.meshphong_frag},standard:{uniforms:Xt([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new Se(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag},toon:{uniforms:Xt([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new Se(0)}}]),vertexShader:ze.meshtoon_vert,fragmentShader:ze.meshtoon_frag},matcap:{uniforms:Xt([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:ze.meshmatcap_vert,fragmentShader:ze.meshmatcap_frag},points:{uniforms:Xt([se.points,se.fog]),vertexShader:ze.points_vert,fragmentShader:ze.points_frag},dashed:{uniforms:Xt([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ze.linedashed_vert,fragmentShader:ze.linedashed_frag},depth:{uniforms:Xt([se.common,se.displacementmap]),vertexShader:ze.depth_vert,fragmentShader:ze.depth_frag},normal:{uniforms:Xt([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:ze.meshnormal_vert,fragmentShader:ze.meshnormal_frag},sprite:{uniforms:Xt([se.sprite,se.fog]),vertexShader:ze.sprite_vert,fragmentShader:ze.sprite_frag},background:{uniforms:{uvTransform:{value:new $e},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ze.background_vert,fragmentShader:ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:ze.backgroundCube_vert,fragmentShader:ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ze.cube_vert,fragmentShader:ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ze.equirect_vert,fragmentShader:ze.equirect_frag},distanceRGBA:{uniforms:Xt([se.common,se.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ze.distanceRGBA_vert,fragmentShader:ze.distanceRGBA_frag},shadow:{uniforms:Xt([se.lights,se.fog,{color:{value:new Se(0)},opacity:{value:1}}]),vertexShader:ze.shadow_vert,fragmentShader:ze.shadow_frag}};En.physical={uniforms:Xt([En.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new $e},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new $e},clearcoatNormalScale:{value:new je(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new $e},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new $e},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new $e},sheen:{value:0},sheenColor:{value:new Se(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new $e},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new $e},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new $e},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new $e},attenuationDistance:{value:0},attenuationColor:{value:new Se(0)},specularColor:{value:new Se(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new $e},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new $e},anisotropyVector:{value:new je},anisotropyMap:{value:null},anisotropyMapTransform:{value:new $e}}]),vertexShader:ze.meshphysical_vert,fragmentShader:ze.meshphysical_frag};const Vs={r:0,b:0,g:0};function ip(i,e,t,n,s,o,a){const r=new Se(0);let c=o===!0?0:1,l,h,d=null,u=0,p=null;function g(m,f){let v=!1,_=f.isScene===!0?f.background:null;_&&_.isTexture&&(_=(f.backgroundBlurriness>0?t:e).get(_)),_===null?x(r,c):_&&_.isColor&&(x(_,1),v=!0);const E=i.xr.getEnvironmentBlendMode();E==="additive"?n.buffers.color.setClear(0,0,0,1,a):E==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||v)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),_&&(_.isCubeTexture||_.mapping===lo)?(h===void 0&&(h=new Ce(new Ot(1,1,1),new ui({name:"BackgroundCubeMaterial",uniforms:Xi(En.backgroundCube.uniforms),vertexShader:En.backgroundCube.vertexShader,fragmentShader:En.backgroundCube.fragmentShader,side:Kt,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,T,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),h.material.uniforms.envMap.value=_,h.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,h.material.toneMapped=ot.getTransfer(_.colorSpace)!==lt,(d!==_||u!==_.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,d=_,u=_.version,p=i.toneMapping),h.layers.enableAll(),m.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new Ce(new qi(2,2),new ui({name:"BackgroundMaterial",uniforms:Xi(En.background.uniforms),vertexShader:En.background.vertexShader,fragmentShader:En.background.fragmentShader,side:Yn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,l.material.toneMapped=ot.getTransfer(_.colorSpace)!==lt,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(d!==_||u!==_.version||p!==i.toneMapping)&&(l.material.needsUpdate=!0,d=_,u=_.version,p=i.toneMapping),l.layers.enableAll(),m.unshift(l,l.geometry,l.material,0,0,null))}function x(m,f){m.getRGB(Vs,al(i)),n.buffers.color.setClear(Vs.r,Vs.g,Vs.b,f,a)}return{getClearColor:function(){return r},setClearColor:function(m,f=1){r.set(m),c=f,x(r,c)},getClearAlpha:function(){return c},setClearAlpha:function(m){c=m,x(r,c)},render:g}}function sp(i,e,t,n){const s=i.getParameter(i.MAX_VERTEX_ATTRIBS),o=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||o!==null,r={},c=m(null);let l=c,h=!1;function d(L,N,W,Y,q){let X=!1;if(a){const Z=x(Y,W,N);l!==Z&&(l=Z,p(l.object)),X=f(L,Y,W,q),X&&v(L,Y,W,q)}else{const Z=N.wireframe===!0;(l.geometry!==Y.id||l.program!==W.id||l.wireframe!==Z)&&(l.geometry=Y.id,l.program=W.id,l.wireframe=Z,X=!0)}q!==null&&t.update(q,i.ELEMENT_ARRAY_BUFFER),(X||h)&&(h=!1,I(L,N,W,Y),q!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function u(){return n.isWebGL2?i.createVertexArray():o.createVertexArrayOES()}function p(L){return n.isWebGL2?i.bindVertexArray(L):o.bindVertexArrayOES(L)}function g(L){return n.isWebGL2?i.deleteVertexArray(L):o.deleteVertexArrayOES(L)}function x(L,N,W){const Y=W.wireframe===!0;let q=r[L.id];q===void 0&&(q={},r[L.id]=q);let X=q[N.id];X===void 0&&(X={},q[N.id]=X);let Z=X[Y];return Z===void 0&&(Z=m(u()),X[Y]=Z),Z}function m(L){const N=[],W=[],Y=[];for(let q=0;q<s;q++)N[q]=0,W[q]=0,Y[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:W,attributeDivisors:Y,object:L,attributes:{},index:null}}function f(L,N,W,Y){const q=l.attributes,X=N.attributes;let Z=0;const ee=W.getAttributes();for(const ue in ee)if(ee[ue].location>=0){const $=q[ue];let he=X[ue];if(he===void 0&&(ue==="instanceMatrix"&&L.instanceMatrix&&(he=L.instanceMatrix),ue==="instanceColor"&&L.instanceColor&&(he=L.instanceColor)),$===void 0||$.attribute!==he||he&&$.data!==he.data)return!0;Z++}return l.attributesNum!==Z||l.index!==Y}function v(L,N,W,Y){const q={},X=N.attributes;let Z=0;const ee=W.getAttributes();for(const ue in ee)if(ee[ue].location>=0){let $=X[ue];$===void 0&&(ue==="instanceMatrix"&&L.instanceMatrix&&($=L.instanceMatrix),ue==="instanceColor"&&L.instanceColor&&($=L.instanceColor));const he={};he.attribute=$,$&&$.data&&(he.data=$.data),q[ue]=he,Z++}l.attributes=q,l.attributesNum=Z,l.index=Y}function _(){const L=l.newAttributes;for(let N=0,W=L.length;N<W;N++)L[N]=0}function E(L){R(L,0)}function R(L,N){const W=l.newAttributes,Y=l.enabledAttributes,q=l.attributeDivisors;W[L]=1,Y[L]===0&&(i.enableVertexAttribArray(L),Y[L]=1),q[L]!==N&&((n.isWebGL2?i:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](L,N),q[L]=N)}function T(){const L=l.newAttributes,N=l.enabledAttributes;for(let W=0,Y=N.length;W<Y;W++)N[W]!==L[W]&&(i.disableVertexAttribArray(W),N[W]=0)}function A(L,N,W,Y,q,X,Z){Z===!0?i.vertexAttribIPointer(L,N,W,q,X):i.vertexAttribPointer(L,N,W,Y,q,X)}function I(L,N,W,Y){if(n.isWebGL2===!1&&(L.isInstancedMesh||Y.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;_();const q=Y.attributes,X=W.getAttributes(),Z=N.defaultAttributeValues;for(const ee in X){const ue=X[ee];if(ue.location>=0){let G=q[ee];if(G===void 0&&(ee==="instanceMatrix"&&L.instanceMatrix&&(G=L.instanceMatrix),ee==="instanceColor"&&L.instanceColor&&(G=L.instanceColor)),G!==void 0){const $=G.normalized,he=G.itemSize,Me=t.get(G);if(Me===void 0)continue;const ve=Me.buffer,Ne=Me.type,Oe=Me.bytesPerElement,Ae=n.isWebGL2===!0&&(Ne===i.INT||Ne===i.UNSIGNED_INT||G.gpuType===Vc);if(G.isInterleavedBufferAttribute){const Qe=G.data,F=Qe.stride,Gt=G.offset;if(Qe.isInstancedInterleavedBuffer){for(let Ee=0;Ee<ue.locationSize;Ee++)R(ue.location+Ee,Qe.meshPerAttribute);L.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=Qe.meshPerAttribute*Qe.count)}else for(let Ee=0;Ee<ue.locationSize;Ee++)E(ue.location+Ee);i.bindBuffer(i.ARRAY_BUFFER,ve);for(let Ee=0;Ee<ue.locationSize;Ee++)A(ue.location+Ee,he/ue.locationSize,Ne,$,F*Oe,(Gt+he/ue.locationSize*Ee)*Oe,Ae)}else{if(G.isInstancedBufferAttribute){for(let Qe=0;Qe<ue.locationSize;Qe++)R(ue.location+Qe,G.meshPerAttribute);L.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let Qe=0;Qe<ue.locationSize;Qe++)E(ue.location+Qe);i.bindBuffer(i.ARRAY_BUFFER,ve);for(let Qe=0;Qe<ue.locationSize;Qe++)A(ue.location+Qe,he/ue.locationSize,Ne,$,he*Oe,he/ue.locationSize*Qe*Oe,Ae)}}else if(Z!==void 0){const $=Z[ee];if($!==void 0)switch($.length){case 2:i.vertexAttrib2fv(ue.location,$);break;case 3:i.vertexAttrib3fv(ue.location,$);break;case 4:i.vertexAttrib4fv(ue.location,$);break;default:i.vertexAttrib1fv(ue.location,$)}}}}T()}function S(){V();for(const L in r){const N=r[L];for(const W in N){const Y=N[W];for(const q in Y)g(Y[q].object),delete Y[q];delete N[W]}delete r[L]}}function w(L){if(r[L.id]===void 0)return;const N=r[L.id];for(const W in N){const Y=N[W];for(const q in Y)g(Y[q].object),delete Y[q];delete N[W]}delete r[L.id]}function U(L){for(const N in r){const W=r[N];if(W[L.id]===void 0)continue;const Y=W[L.id];for(const q in Y)g(Y[q].object),delete Y[q];delete W[L.id]}}function V(){te(),h=!0,l!==c&&(l=c,p(l.object))}function te(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:d,reset:V,resetDefaultState:te,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfProgram:U,initAttributes:_,enableAttribute:E,disableUnusedAttributes:T}}function op(i,e,t,n){const s=n.isWebGL2;let o;function a(h){o=h}function r(h,d){i.drawArrays(o,h,d),t.update(d,o,1)}function c(h,d,u){if(u===0)return;let p,g;if(s)p=i,g="drawArraysInstanced";else if(p=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](o,h,d,u),t.update(d,o,u)}function l(h,d,u){if(u===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<u;g++)this.render(h[g],d[g]);else{p.multiDrawArraysWEBGL(o,h,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=d[x];t.update(g,o,1)}}this.setMode=a,this.render=r,this.renderInstances=c,this.renderMultiDraw=l}function rp(i,e,t){let n;function s(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");n=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function o(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const a=typeof WebGL2RenderingContext<"u"&&i.constructor.name==="WebGL2RenderingContext";let r=t.precision!==void 0?t.precision:"highp";const c=o(r);c!==r&&(console.warn("THREE.WebGLRenderer:",r,"not supported, using",c,"instead."),r=c);const l=a||e.has("WEBGL_draw_buffers"),h=t.logarithmicDepthBuffer===!0,d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),u=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),x=i.getParameter(i.MAX_VERTEX_ATTRIBS),m=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),f=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),_=u>0,E=a||e.has("OES_texture_float"),R=_&&E,T=a?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:l,getMaxAnisotropy:s,getMaxPrecision:o,precision:r,logarithmicDepthBuffer:h,maxTextures:d,maxVertexTextures:u,maxTextureSize:p,maxCubemapSize:g,maxAttributes:x,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:v,vertexTextures:_,floatFragmentTextures:E,floatVertexTextures:R,maxSamples:T}}function ap(i){const e=this;let t=null,n=0,s=!1,o=!1;const a=new Bn,r=new $e,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const p=d.length!==0||u||n!==0||s;return s=u,n=d.length,p},this.beginShadows=function(){o=!0,h(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,p){const g=d.clippingPlanes,x=d.clipIntersection,m=d.clipShadows,f=i.get(d);if(!s||g===null||g.length===0||o&&!m)o?h(null):l();else{const v=o?0:n,_=v*4;let E=f.clippingState||null;c.value=E,E=h(g,u,_,p);for(let R=0;R!==_;++R)E[R]=t[R];f.clippingState=E,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,u,p,g){const x=d!==null?d.length:0;let m=null;if(x!==0){if(m=c.value,g!==!0||m===null){const f=p+x*4,v=u.matrixWorldInverse;r.getNormalMatrix(v),(m===null||m.length<f)&&(m=new Float32Array(f));for(let _=0,E=p;_!==x;++_,E+=4)a.copy(d[_]).applyMatrix4(v,r),a.normal.toArray(m,E),m[E+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}function cp(i){let e=new WeakMap;function t(a,r){return r===Mr?a.mapping=Gi:r===Sr&&(a.mapping=Vi),a}function n(a){if(a&&a.isTexture){const r=a.mapping;if(r===Mr||r===Sr)if(e.has(a)){const c=e.get(a).texture;return t(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const l=new vd(c.height/2);return l.fromEquirectangularTexture(i,a),e.set(a,l),a.addEventListener("dispose",s),t(l.texture,a.mapping)}else return null}}return a}function s(a){const r=a.target;r.removeEventListener("dispose",s);const c=e.get(r);c!==void 0&&(e.delete(r),c.dispose())}function o(){e=new WeakMap}return{get:n,dispose:o}}class dl extends cl{constructor(e=-1,t=1,n=1,s=-1,o=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=o,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,o,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let o=n-e,a=n+e,r=s+t,c=s-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=l*this.view.offsetX,a=o+l*this.view.width,r-=h*this.view.offsetY,c=r-h*this.view.height}this.projectionMatrix.makeOrthographic(o,a,r,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Oi=4,sc=[.125,.215,.35,.446,.526,.582],si=20,Zo=new dl,oc=new Se;let Jo=null,Qo=0,er=0;const ni=(1+Math.sqrt(5))/2,Di=1/ni,rc=[new P(1,1,1),new P(-1,1,1),new P(1,1,-1),new P(-1,1,-1),new P(0,ni,Di),new P(0,ni,-Di),new P(Di,0,ni),new P(-Di,0,ni),new P(ni,Di,0),new P(-ni,Di,0)];class ac{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Jo=this._renderer.getRenderTarget(),Qo=this._renderer.getActiveCubeFace(),er=this._renderer.getActiveMipmapLevel(),this._setSize(256);const o=this._allocateTargets();return o.depthBuffer=!0,this._sceneToCubeUV(e,n,s,o),t>0&&this._blur(o,0,0,t),this._applyPMREM(o),this._cleanup(o),o}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Jo,Qo,er),e.scissorTest=!1,Ws(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Gi||e.mapping===Vi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Jo=this._renderer.getRenderTarget(),Qo=this._renderer.getActiveCubeFace(),er=this._renderer.getActiveMipmapLevel();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:cn,minFilter:cn,generateMipmaps:!1,type:us,format:xn,colorSpace:Dn,depthBuffer:!1},s=cc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cc(e,t,n);const{_lodMax:o}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=lp(o)),this._blurMaterial=hp(o,e,t)}return s}_compileMaterial(e){const t=new Ce(this._lodPlanes[0],e);this._renderer.compile(t,Zo)}_sceneToCubeUV(e,t,n,s){const r=new ln(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(oc),h.toneMapping=Wn,h.autoClear=!1;const p=new Ht({name:"PMREM.Background",side:Kt,depthWrite:!1,depthTest:!1}),g=new Ce(new Ot,p);let x=!1;const m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,x=!0):(p.color.copy(oc),x=!0);for(let f=0;f<6;f++){const v=f%3;v===0?(r.up.set(0,c[f],0),r.lookAt(l[f],0,0)):v===1?(r.up.set(0,0,c[f]),r.lookAt(0,l[f],0)):(r.up.set(0,c[f],0),r.lookAt(0,0,l[f]));const _=this._cubeSize;Ws(s,v*_,f>2?_:0,_,_),h.setRenderTarget(s),x&&h.render(g,r),h.render(e,r)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=d,e.background=m}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===Gi||e.mapping===Vi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=hc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=lc());const o=s?this._cubemapMaterial:this._equirectMaterial,a=new Ce(this._lodPlanes[0],o),r=o.uniforms;r.envMap.value=e;const c=this._cubeSize;Ws(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,Zo)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=rc[(s-1)%rc.length];this._blur(e,s-1,s,o,a)}t.autoClear=n}_blur(e,t,n,s,o){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",o),this._halfBlur(a,e,n,n,s,"longitudinal",o)}_halfBlur(e,t,n,s,o,a,r){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new Ce(this._lodPlanes[s],l),u=l.uniforms,p=this._sizeLods[n]-1,g=isFinite(o)?Math.PI/(2*p):2*Math.PI/(2*si-1),x=o/g,m=isFinite(o)?1+Math.floor(h*x):si;m>si&&console.warn(`sigmaRadians, ${o}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${si}`);const f=[];let v=0;for(let A=0;A<si;++A){const I=A/x,S=Math.exp(-I*I/2);f.push(S),A===0?v+=S:A<m&&(v+=2*S)}for(let A=0;A<f.length;A++)f[A]=f[A]/v;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=f,u.latitudinal.value=a==="latitudinal",r&&(u.poleAxis.value=r);const{_lodMax:_}=this;u.dTheta.value=g,u.mipInt.value=_-n;const E=this._sizeLods[s],R=3*E*(s>_-Oi?s-_+Oi:0),T=4*(this._cubeSize-E);Ws(t,R,T,3*E,2*E),c.setRenderTarget(t),c.render(d,Zo)}}function lp(i){const e=[],t=[],n=[];let s=i;const o=i-Oi+1+sc.length;for(let a=0;a<o;a++){const r=Math.pow(2,s);t.push(r);let c=1/r;a>i-Oi?c=sc[a-i+Oi-1]:a===0&&(c=0),n.push(c);const l=1/(r-2),h=-l,d=1+l,u=[h,h,d,h,d,d,h,h,d,d,h,d],p=6,g=6,x=3,m=2,f=1,v=new Float32Array(x*g*p),_=new Float32Array(m*g*p),E=new Float32Array(f*g*p);for(let T=0;T<p;T++){const A=T%3*2/3-1,I=T>2?0:-1,S=[A,I,0,A+2/3,I,0,A+2/3,I+1,0,A,I,0,A+2/3,I+1,0,A,I+1,0];v.set(S,x*g*T),_.set(u,m*g*T);const w=[T,T,T,T,T,T];E.set(w,f*g*T)}const R=new Jt;R.setAttribute("position",new sn(v,x)),R.setAttribute("uv",new sn(_,m)),R.setAttribute("faceIndex",new sn(E,f)),e.push(R),s>Oi&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function cc(i,e,t){const n=new di(i,e,t);return n.texture.mapping=lo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ws(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function hp(i,e,t){const n=new Float32Array(si),s=new P(0,1,0);return new ui({name:"SphericalGaussianBlur",defines:{n:si,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Br(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function lc(){return new ui({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Br(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function hc(){return new ui({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Br(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Br(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function dp(i){let e=new WeakMap,t=null;function n(r){if(r&&r.isTexture){const c=r.mapping,l=c===Mr||c===Sr,h=c===Gi||c===Vi;if(l||h)if(r.isRenderTargetTexture&&r.needsPMREMUpdate===!0){r.needsPMREMUpdate=!1;let d=e.get(r);return t===null&&(t=new ac(i)),d=l?t.fromEquirectangular(r,d):t.fromCubemap(r,d),e.set(r,d),d.texture}else{if(e.has(r))return e.get(r).texture;{const d=r.image;if(l&&d&&d.height>0||h&&d&&s(d)){t===null&&(t=new ac(i));const u=l?t.fromEquirectangular(r):t.fromCubemap(r);return e.set(r,u),r.addEventListener("dispose",o),u.texture}else return null}}}return r}function s(r){let c=0;const l=6;for(let h=0;h<l;h++)r[h]!==void 0&&c++;return c===l}function o(r){const c=r.target;c.removeEventListener("dispose",o);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function up(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const s=t(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function fp(i,e,t,n){const s={},o=new WeakMap;function a(d){const u=d.target;u.index!==null&&e.remove(u.index);for(const g in u.attributes)e.remove(u.attributes[g]);for(const g in u.morphAttributes){const x=u.morphAttributes[g];for(let m=0,f=x.length;m<f;m++)e.remove(x[m])}u.removeEventListener("dispose",a),delete s[u.id];const p=o.get(u);p&&(e.remove(p),o.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function r(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,t.memory.geometries++),u}function c(d){const u=d.attributes;for(const g in u)e.update(u[g],i.ARRAY_BUFFER);const p=d.morphAttributes;for(const g in p){const x=p[g];for(let m=0,f=x.length;m<f;m++)e.update(x[m],i.ARRAY_BUFFER)}}function l(d){const u=[],p=d.index,g=d.attributes.position;let x=0;if(p!==null){const v=p.array;x=p.version;for(let _=0,E=v.length;_<E;_+=3){const R=v[_+0],T=v[_+1],A=v[_+2];u.push(R,T,T,A,A,R)}}else if(g!==void 0){const v=g.array;x=g.version;for(let _=0,E=v.length/3-1;_<E;_+=3){const R=_+0,T=_+1,A=_+2;u.push(R,T,T,A,A,R)}}else return;const m=new(Qc(u)?rl:ol)(u,1);m.version=x;const f=o.get(d);f&&e.remove(f),o.set(d,m)}function h(d){const u=o.get(d);if(u){const p=d.index;p!==null&&u.version<p.version&&l(d)}else l(d);return o.get(d)}return{get:r,update:c,getWireframeAttribute:h}}function pp(i,e,t,n){const s=n.isWebGL2;let o;function a(p){o=p}let r,c;function l(p){r=p.type,c=p.bytesPerElement}function h(p,g){i.drawElements(o,g,r,p*c),t.update(g,o,1)}function d(p,g,x){if(x===0)return;let m,f;if(s)m=i,f="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](o,g,r,p*c,x),t.update(g,o,x)}function u(p,g,x){if(x===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<x;f++)this.render(p[f]/c,g[f]);else{m.multiDrawElementsWEBGL(o,g,0,r,p,0,x);let f=0;for(let v=0;v<x;v++)f+=g[v];t.update(f,o,1)}}this.setMode=a,this.setIndex=l,this.render=h,this.renderInstances=d,this.renderMultiDraw=u}function mp(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(o,a,r){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=r*(o/3);break;case i.LINES:t.lines+=r*(o/2);break;case i.LINE_STRIP:t.lines+=r*(o-1);break;case i.LINE_LOOP:t.lines+=r*o;break;case i.POINTS:t.points+=r*o;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function gp(i,e){return i[0]-e[0]}function _p(i,e){return Math.abs(e[1])-Math.abs(i[1])}function xp(i,e,t){const n={},s=new Float32Array(8),o=new WeakMap,a=new Lt,r=[];for(let l=0;l<8;l++)r[l]=[l,0];function c(l,h,d){const u=l.morphTargetInfluences;if(e.isWebGL2===!0){const p=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=p!==void 0?p.length:0;let x=o.get(h);if(x===void 0||x.count!==g){let L=function(){V.dispose(),o.delete(h),h.removeEventListener("dispose",L)};x!==void 0&&x.texture.dispose();const v=h.morphAttributes.position!==void 0,_=h.morphAttributes.normal!==void 0,E=h.morphAttributes.color!==void 0,R=h.morphAttributes.position||[],T=h.morphAttributes.normal||[],A=h.morphAttributes.color||[];let I=0;v===!0&&(I=1),_===!0&&(I=2),E===!0&&(I=3);let S=h.attributes.position.count*I,w=1;S>e.maxTextureSize&&(w=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const U=new Float32Array(S*w*4*g),V=new nl(U,S,w,g);V.type=Gn,V.needsUpdate=!0;const te=I*4;for(let N=0;N<g;N++){const W=R[N],Y=T[N],q=A[N],X=S*w*4*N;for(let Z=0;Z<W.count;Z++){const ee=Z*te;v===!0&&(a.fromBufferAttribute(W,Z),U[X+ee+0]=a.x,U[X+ee+1]=a.y,U[X+ee+2]=a.z,U[X+ee+3]=0),_===!0&&(a.fromBufferAttribute(Y,Z),U[X+ee+4]=a.x,U[X+ee+5]=a.y,U[X+ee+6]=a.z,U[X+ee+7]=0),E===!0&&(a.fromBufferAttribute(q,Z),U[X+ee+8]=a.x,U[X+ee+9]=a.y,U[X+ee+10]=a.z,U[X+ee+11]=q.itemSize===4?a.w:1)}}x={count:g,texture:V,size:new je(S,w)},o.set(h,x),h.addEventListener("dispose",L)}let m=0;for(let v=0;v<u.length;v++)m+=u[v];const f=h.morphTargetsRelative?1:1-m;d.getUniforms().setValue(i,"morphTargetBaseInfluence",f),d.getUniforms().setValue(i,"morphTargetInfluences",u),d.getUniforms().setValue(i,"morphTargetsTexture",x.texture,t),d.getUniforms().setValue(i,"morphTargetsTextureSize",x.size)}else{const p=u===void 0?0:u.length;let g=n[h.id];if(g===void 0||g.length!==p){g=[];for(let _=0;_<p;_++)g[_]=[_,0];n[h.id]=g}for(let _=0;_<p;_++){const E=g[_];E[0]=_,E[1]=u[_]}g.sort(_p);for(let _=0;_<8;_++)_<p&&g[_][1]?(r[_][0]=g[_][0],r[_][1]=g[_][1]):(r[_][0]=Number.MAX_SAFE_INTEGER,r[_][1]=0);r.sort(gp);const x=h.morphAttributes.position,m=h.morphAttributes.normal;let f=0;for(let _=0;_<8;_++){const E=r[_],R=E[0],T=E[1];R!==Number.MAX_SAFE_INTEGER&&T?(x&&h.getAttribute("morphTarget"+_)!==x[R]&&h.setAttribute("morphTarget"+_,x[R]),m&&h.getAttribute("morphNormal"+_)!==m[R]&&h.setAttribute("morphNormal"+_,m[R]),s[_]=T,f+=T):(x&&h.hasAttribute("morphTarget"+_)===!0&&h.deleteAttribute("morphTarget"+_),m&&h.hasAttribute("morphNormal"+_)===!0&&h.deleteAttribute("morphNormal"+_),s[_]=0)}const v=h.morphTargetsRelative?1:1-f;d.getUniforms().setValue(i,"morphTargetBaseInfluence",v),d.getUniforms().setValue(i,"morphTargetInfluences",s)}}return{update:c}}function vp(i,e,t,n){let s=new WeakMap;function o(c){const l=n.render.frame,h=c.geometry,d=e.get(c,h);if(s.get(d)!==l&&(e.update(d),s.set(d,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",r)===!1&&c.addEventListener("dispose",r),s.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){const u=c.skeleton;s.get(u)!==l&&(u.update(),s.set(u,l))}return d}function a(){s=new WeakMap}function r(c){const l=c.target;l.removeEventListener("dispose",r),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:o,dispose:a}}class ul extends nn{constructor(e,t,n,s,o,a,r,c,l,h){if(h=h!==void 0?h:ai,h!==ai&&h!==Wi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ai&&(n=Hn),n===void 0&&h===Wi&&(n=ri),super(null,s,o,a,r,c,h,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=r!==void 0?r:qt,this.minFilter=c!==void 0?c:qt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const fl=new nn,pl=new ul(1,1);pl.compareFunction=Jc;const ml=new nl,gl=new nd,_l=new ll,dc=[],uc=[],fc=new Float32Array(16),pc=new Float32Array(9),mc=new Float32Array(4);function ji(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let o=dc[s];if(o===void 0&&(o=new Float32Array(s),dc[s]=o),e!==0){n.toArray(o,0);for(let a=1,r=0;a!==e;++a)r+=t,i[a].toArray(o,r)}return o}function yt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Et(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function fo(i,e){let t=uc[e];t===void 0&&(t=new Int32Array(e),uc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Mp(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Sp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;i.uniform2fv(this.addr,e),Et(t,e)}}function yp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(yt(t,e))return;i.uniform3fv(this.addr,e),Et(t,e)}}function Ep(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;i.uniform4fv(this.addr,e),Et(t,e)}}function bp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(yt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Et(t,e)}else{if(yt(t,n))return;mc.set(n),i.uniformMatrix2fv(this.addr,!1,mc),Et(t,n)}}function wp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(yt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Et(t,e)}else{if(yt(t,n))return;pc.set(n),i.uniformMatrix3fv(this.addr,!1,pc),Et(t,n)}}function Tp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(yt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Et(t,e)}else{if(yt(t,n))return;fc.set(n),i.uniformMatrix4fv(this.addr,!1,fc),Et(t,n)}}function Ap(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Rp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;i.uniform2iv(this.addr,e),Et(t,e)}}function Cp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(yt(t,e))return;i.uniform3iv(this.addr,e),Et(t,e)}}function Lp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;i.uniform4iv(this.addr,e),Et(t,e)}}function Pp(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Dp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(yt(t,e))return;i.uniform2uiv(this.addr,e),Et(t,e)}}function Ip(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(yt(t,e))return;i.uniform3uiv(this.addr,e),Et(t,e)}}function Up(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(yt(t,e))return;i.uniform4uiv(this.addr,e),Et(t,e)}}function Np(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);const o=this.type===i.SAMPLER_2D_SHADOW?pl:fl;t.setTexture2D(e||o,s)}function Fp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||gl,s)}function Op(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||_l,s)}function kp(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||ml,s)}function zp(i){switch(i){case 5126:return Mp;case 35664:return Sp;case 35665:return yp;case 35666:return Ep;case 35674:return bp;case 35675:return wp;case 35676:return Tp;case 5124:case 35670:return Ap;case 35667:case 35671:return Rp;case 35668:case 35672:return Cp;case 35669:case 35673:return Lp;case 5125:return Pp;case 36294:return Dp;case 36295:return Ip;case 36296:return Up;case 35678:case 36198:case 36298:case 36306:case 35682:return Np;case 35679:case 36299:case 36307:return Fp;case 35680:case 36300:case 36308:case 36293:return Op;case 36289:case 36303:case 36311:case 36292:return kp}}function Bp(i,e){i.uniform1fv(this.addr,e)}function Hp(i,e){const t=ji(e,this.size,2);i.uniform2fv(this.addr,t)}function Gp(i,e){const t=ji(e,this.size,3);i.uniform3fv(this.addr,t)}function Vp(i,e){const t=ji(e,this.size,4);i.uniform4fv(this.addr,t)}function Wp(i,e){const t=ji(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Xp(i,e){const t=ji(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function qp(i,e){const t=ji(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Yp(i,e){i.uniform1iv(this.addr,e)}function $p(i,e){i.uniform2iv(this.addr,e)}function jp(i,e){i.uniform3iv(this.addr,e)}function Kp(i,e){i.uniform4iv(this.addr,e)}function Zp(i,e){i.uniform1uiv(this.addr,e)}function Jp(i,e){i.uniform2uiv(this.addr,e)}function Qp(i,e){i.uniform3uiv(this.addr,e)}function em(i,e){i.uniform4uiv(this.addr,e)}function tm(i,e,t){const n=this.cache,s=e.length,o=fo(t,s);yt(n,o)||(i.uniform1iv(this.addr,o),Et(n,o));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||fl,o[a])}function nm(i,e,t){const n=this.cache,s=e.length,o=fo(t,s);yt(n,o)||(i.uniform1iv(this.addr,o),Et(n,o));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||gl,o[a])}function im(i,e,t){const n=this.cache,s=e.length,o=fo(t,s);yt(n,o)||(i.uniform1iv(this.addr,o),Et(n,o));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||_l,o[a])}function sm(i,e,t){const n=this.cache,s=e.length,o=fo(t,s);yt(n,o)||(i.uniform1iv(this.addr,o),Et(n,o));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||ml,o[a])}function om(i){switch(i){case 5126:return Bp;case 35664:return Hp;case 35665:return Gp;case 35666:return Vp;case 35674:return Wp;case 35675:return Xp;case 35676:return qp;case 5124:case 35670:return Yp;case 35667:case 35671:return $p;case 35668:case 35672:return jp;case 35669:case 35673:return Kp;case 5125:return Zp;case 36294:return Jp;case 36295:return Qp;case 36296:return em;case 35678:case 36198:case 36298:case 36306:case 35682:return tm;case 35679:case 36299:case 36307:return nm;case 35680:case 36300:case 36308:case 36293:return im;case 36289:case 36303:case 36311:case 36292:return sm}}class rm{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=zp(t.type)}}class am{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=om(t.type)}}class cm{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let o=0,a=s.length;o!==a;++o){const r=s[o];r.setValue(e,t[r.id],n)}}}const tr=/(\w+)(\])?(\[|\.)?/g;function gc(i,e){i.seq.push(e),i.map[e.id]=e}function lm(i,e,t){const n=i.name,s=n.length;for(tr.lastIndex=0;;){const o=tr.exec(n),a=tr.lastIndex;let r=o[1];const c=o[2]==="]",l=o[3];if(c&&(r=r|0),l===void 0||l==="["&&a+2===s){gc(t,l===void 0?new rm(r,i,e):new am(r,i,e));break}else{let d=t.map[r];d===void 0&&(d=new cm(r),gc(t,d)),t=d}}}class Ys{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const o=e.getActiveUniform(t,s),a=e.getUniformLocation(t,o.name);lm(o,a,this)}}setValue(e,t,n,s){const o=this.map[t];o!==void 0&&o.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let o=0,a=t.length;o!==a;++o){const r=t[o],c=n[r.id];c.needsUpdate!==!1&&r.setValue(e,c.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,o=e.length;s!==o;++s){const a=e[s];a.id in t&&n.push(a)}return n}}function _c(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const hm=37297;let dm=0;function um(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let a=s;a<o;a++){const r=a+1;n.push(`${r===e?">":" "} ${r}: ${t[a]}`)}return n.join(`
`)}function fm(i){const e=ot.getPrimaries(ot.workingColorSpace),t=ot.getPrimaries(i);let n;switch(e===t?n="":e===no&&t===to?n="LinearDisplayP3ToLinearSRGB":e===to&&t===no&&(n="LinearSRGBToLinearDisplayP3"),i){case Dn:case ho:return[n,"LinearTransferOETF"];case It:case Fr:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function xc(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+um(i.getShaderSource(e),a)}else return s}function pm(i,e){const t=fm(e);return`vec4 ${i}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function mm(i,e){let t;switch(e){case wh:t="Linear";break;case Th:t="Reinhard";break;case Ah:t="OptimizedCineon";break;case Rh:t="ACESFilmic";break;case Lh:t="AgX";break;case Ch:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function gm(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(ki).join(`
`)}function _m(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(ki).join(`
`)}function xm(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function vm(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const o=i.getActiveAttrib(e,s),a=o.name;let r=1;o.type===i.FLOAT_MAT2&&(r=2),o.type===i.FLOAT_MAT3&&(r=3),o.type===i.FLOAT_MAT4&&(r=4),t[a]={type:o.type,location:i.getAttribLocation(e,a),locationSize:r}}return t}function ki(i){return i!==""}function vc(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Mc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Mm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ar(i){return i.replace(Mm,ym)}const Sm=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function ym(i,e){let t=ze[e];if(t===void 0){const n=Sm.get(e);if(n!==void 0)t=ze[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Ar(t)}const Em=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Sc(i){return i.replace(Em,bm)}function bm(i,e,t,n){let s="";for(let o=parseInt(e);o<parseInt(t);o++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return s}function yc(i){let e="precision "+i.precision+` float;
precision `+i.precision+" int;";return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function wm(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Bc?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Hc?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ln&&(e="SHADOWMAP_TYPE_VSM"),e}function Tm(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Gi:case Vi:e="ENVMAP_TYPE_CUBE";break;case lo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Am(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Vi:e="ENVMAP_MODE_REFRACTION";break}return e}function Rm(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Ur:e="ENVMAP_BLENDING_MULTIPLY";break;case Eh:e="ENVMAP_BLENDING_MIX";break;case bh:e="ENVMAP_BLENDING_ADD";break}return e}function Cm(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Lm(i,e,t,n){const s=i.getContext(),o=t.defines;let a=t.vertexShader,r=t.fragmentShader;const c=wm(t),l=Tm(t),h=Am(t),d=Rm(t),u=Cm(t),p=t.isWebGL2?"":gm(t),g=_m(t),x=xm(o),m=s.createProgram();let f,v,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(ki).join(`
`),f.length>0&&(f+=`
`),v=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(ki).join(`
`),v.length>0&&(v+=`
`)):(f=[yc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ki).join(`
`),v=[p,yc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Wn?"#define TONE_MAPPING":"",t.toneMapping!==Wn?ze.tonemapping_pars_fragment:"",t.toneMapping!==Wn?mm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ze.colorspace_pars_fragment,pm("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ki).join(`
`)),a=Ar(a),a=vc(a,t),a=Mc(a,t),r=Ar(r),r=vc(r,t),r=Mc(r,t),a=Sc(a),r=Sc(r),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,v=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Ba?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ba?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const E=_+f+a,R=_+v+r,T=_c(s,s.VERTEX_SHADER,E),A=_c(s,s.FRAGMENT_SHADER,R);s.attachShader(m,T),s.attachShader(m,A),t.index0AttributeName!==void 0?s.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function I(V){if(i.debug.checkShaderErrors){const te=s.getProgramInfoLog(m).trim(),L=s.getShaderInfoLog(T).trim(),N=s.getShaderInfoLog(A).trim();let W=!0,Y=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,m,T,A);else{const q=xc(s,T,"vertex"),X=xc(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Program Info Log: `+te+`
`+q+`
`+X)}else te!==""?console.warn("THREE.WebGLProgram: Program Info Log:",te):(L===""||N==="")&&(Y=!1);Y&&(V.diagnostics={runnable:W,programLog:te,vertexShader:{log:L,prefix:f},fragmentShader:{log:N,prefix:v}})}s.deleteShader(T),s.deleteShader(A),S=new Ys(s,m),w=vm(s,m)}let S;this.getUniforms=function(){return S===void 0&&I(this),S};let w;this.getAttributes=function(){return w===void 0&&I(this),w};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=s.getProgramParameter(m,hm)),U},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=dm++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=T,this.fragmentShader=A,this}let Pm=0;class Dm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),o=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(o)===!1&&(a.add(o),o.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Im(e),t.set(e,n)),n}}class Im{constructor(e){this.id=Pm++,this.code=e,this.usedTimes=0}}function Um(i,e,t,n,s,o,a){const r=new kr,c=new Dm,l=[],h=s.isWebGL2,d=s.logarithmicDepthBuffer,u=s.vertexTextures;let p=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(S){return S===0?"uv":`uv${S}`}function m(S,w,U,V,te){const L=V.fog,N=te.geometry,W=S.isMeshStandardMaterial?V.environment:null,Y=(S.isMeshStandardMaterial?t:e).get(S.envMap||W),q=Y&&Y.mapping===lo?Y.image.height:null,X=g[S.type];S.precision!==null&&(p=s.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));const Z=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,ee=Z!==void 0?Z.length:0;let ue=0;N.morphAttributes.position!==void 0&&(ue=1),N.morphAttributes.normal!==void 0&&(ue=2),N.morphAttributes.color!==void 0&&(ue=3);let G,$,he,Me;if(X){const Vt=En[X];G=Vt.vertexShader,$=Vt.fragmentShader}else G=S.vertexShader,$=S.fragmentShader,c.update(S),he=c.getVertexShaderID(S),Me=c.getFragmentShaderID(S);const ve=i.getRenderTarget(),Ne=te.isInstancedMesh===!0,Oe=te.isBatchedMesh===!0,Ae=!!S.map,Qe=!!S.matcap,F=!!Y,Gt=!!S.aoMap,Ee=!!S.lightMap,Ie=!!S.bumpMap,me=!!S.normalMap,dt=!!S.displacementMap,Ge=!!S.emissiveMap,b=!!S.metalnessMap,M=!!S.roughnessMap,k=S.anisotropy>0,J=S.clearcoat>0,K=S.iridescence>0,Q=S.sheen>0,_e=S.transmission>0,ce=k&&!!S.anisotropyMap,fe=J&&!!S.clearcoatMap,Te=J&&!!S.clearcoatNormalMap,Ve=J&&!!S.clearcoatRoughnessMap,j=K&&!!S.iridescenceMap,st=K&&!!S.iridescenceThicknessMap,Ke=Q&&!!S.sheenColorMap,Pe=Q&&!!S.sheenRoughnessMap,ye=!!S.specularMap,pe=!!S.specularColorMap,ke=!!S.specularIntensityMap,it=_e&&!!S.transmissionMap,mt=_e&&!!S.thicknessMap,Xe=!!S.gradientMap,ie=!!S.alphaMap,C=S.alphaTest>0,re=!!S.alphaHash,ae=!!S.extensions,Re=!!N.attributes.uv1,be=!!N.attributes.uv2,rt=!!N.attributes.uv3;let at=Wn;return S.toneMapped&&(ve===null||ve.isXRRenderTarget===!0)&&(at=i.toneMapping),{isWebGL2:h,shaderID:X,shaderType:S.type,shaderName:S.name,vertexShader:G,fragmentShader:$,defines:S.defines,customVertexShaderID:he,customFragmentShaderID:Me,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:Oe,instancing:Ne,instancingColor:Ne&&te.instanceColor!==null,supportsVertexTextures:u,outputColorSpace:ve===null?i.outputColorSpace:ve.isXRRenderTarget===!0?ve.texture.colorSpace:Dn,map:Ae,matcap:Qe,envMap:F,envMapMode:F&&Y.mapping,envMapCubeUVHeight:q,aoMap:Gt,lightMap:Ee,bumpMap:Ie,normalMap:me,displacementMap:u&&dt,emissiveMap:Ge,normalMapObjectSpace:me&&S.normalMapType===Gh,normalMapTangentSpace:me&&S.normalMapType===Zc,metalnessMap:b,roughnessMap:M,anisotropy:k,anisotropyMap:ce,clearcoat:J,clearcoatMap:fe,clearcoatNormalMap:Te,clearcoatRoughnessMap:Ve,iridescence:K,iridescenceMap:j,iridescenceThicknessMap:st,sheen:Q,sheenColorMap:Ke,sheenRoughnessMap:Pe,specularMap:ye,specularColorMap:pe,specularIntensityMap:ke,transmission:_e,transmissionMap:it,thicknessMap:mt,gradientMap:Xe,opaque:S.transparent===!1&&S.blending===zi,alphaMap:ie,alphaTest:C,alphaHash:re,combine:S.combine,mapUv:Ae&&x(S.map.channel),aoMapUv:Gt&&x(S.aoMap.channel),lightMapUv:Ee&&x(S.lightMap.channel),bumpMapUv:Ie&&x(S.bumpMap.channel),normalMapUv:me&&x(S.normalMap.channel),displacementMapUv:dt&&x(S.displacementMap.channel),emissiveMapUv:Ge&&x(S.emissiveMap.channel),metalnessMapUv:b&&x(S.metalnessMap.channel),roughnessMapUv:M&&x(S.roughnessMap.channel),anisotropyMapUv:ce&&x(S.anisotropyMap.channel),clearcoatMapUv:fe&&x(S.clearcoatMap.channel),clearcoatNormalMapUv:Te&&x(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ve&&x(S.clearcoatRoughnessMap.channel),iridescenceMapUv:j&&x(S.iridescenceMap.channel),iridescenceThicknessMapUv:st&&x(S.iridescenceThicknessMap.channel),sheenColorMapUv:Ke&&x(S.sheenColorMap.channel),sheenRoughnessMapUv:Pe&&x(S.sheenRoughnessMap.channel),specularMapUv:ye&&x(S.specularMap.channel),specularColorMapUv:pe&&x(S.specularColorMap.channel),specularIntensityMapUv:ke&&x(S.specularIntensityMap.channel),transmissionMapUv:it&&x(S.transmissionMap.channel),thicknessMapUv:mt&&x(S.thicknessMap.channel),alphaMapUv:ie&&x(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(me||k),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:Re,vertexUv2s:be,vertexUv3s:rt,pointsUvs:te.isPoints===!0&&!!N.attributes.uv&&(Ae||ie),fog:!!L,useFog:S.fog===!0,fogExp2:L&&L.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:d,skinning:te.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:ee,morphTextureStride:ue,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&U.length>0,shadowMapType:i.shadowMap.type,toneMapping:at,useLegacyLights:i._useLegacyLights,decodeVideoTexture:Ae&&S.map.isVideoTexture===!0&&ot.getTransfer(S.map.colorSpace)===lt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===jt,flipSided:S.side===Kt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:ae&&S.extensions.derivatives===!0,extensionFragDepth:ae&&S.extensions.fragDepth===!0,extensionDrawBuffers:ae&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:ae&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ae&&S.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function f(S){const w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(const U in S.defines)w.push(U),w.push(S.defines[U]);return S.isRawShaderMaterial===!1&&(v(w,S),_(w,S),w.push(i.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function v(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function _(S,w){r.disableAll(),w.isWebGL2&&r.enable(0),w.supportsVertexTextures&&r.enable(1),w.instancing&&r.enable(2),w.instancingColor&&r.enable(3),w.matcap&&r.enable(4),w.envMap&&r.enable(5),w.normalMapObjectSpace&&r.enable(6),w.normalMapTangentSpace&&r.enable(7),w.clearcoat&&r.enable(8),w.iridescence&&r.enable(9),w.alphaTest&&r.enable(10),w.vertexColors&&r.enable(11),w.vertexAlphas&&r.enable(12),w.vertexUv1s&&r.enable(13),w.vertexUv2s&&r.enable(14),w.vertexUv3s&&r.enable(15),w.vertexTangents&&r.enable(16),w.anisotropy&&r.enable(17),w.alphaHash&&r.enable(18),w.batching&&r.enable(19),S.push(r.mask),r.disableAll(),w.fog&&r.enable(0),w.useFog&&r.enable(1),w.flatShading&&r.enable(2),w.logarithmicDepthBuffer&&r.enable(3),w.skinning&&r.enable(4),w.morphTargets&&r.enable(5),w.morphNormals&&r.enable(6),w.morphColors&&r.enable(7),w.premultipliedAlpha&&r.enable(8),w.shadowMapEnabled&&r.enable(9),w.useLegacyLights&&r.enable(10),w.doubleSided&&r.enable(11),w.flipSided&&r.enable(12),w.useDepthPacking&&r.enable(13),w.dithering&&r.enable(14),w.transmission&&r.enable(15),w.sheen&&r.enable(16),w.opaque&&r.enable(17),w.pointsUvs&&r.enable(18),w.decodeVideoTexture&&r.enable(19),S.push(r.mask)}function E(S){const w=g[S.type];let U;if(w){const V=En[w];U=md.clone(V.uniforms)}else U=S.uniforms;return U}function R(S,w){let U;for(let V=0,te=l.length;V<te;V++){const L=l[V];if(L.cacheKey===w){U=L,++U.usedTimes;break}}return U===void 0&&(U=new Lm(i,w,S,o),l.push(U)),U}function T(S){if(--S.usedTimes===0){const w=l.indexOf(S);l[w]=l[l.length-1],l.pop(),S.destroy()}}function A(S){c.remove(S)}function I(){c.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:E,acquireProgram:R,releaseProgram:T,releaseShaderCache:A,programs:l,dispose:I}}function Nm(){let i=new WeakMap;function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function t(o){i.delete(o)}function n(o,a,r){i.get(o)[a]=r}function s(){i=new WeakMap}return{get:e,remove:t,update:n,dispose:s}}function Fm(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Ec(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function bc(){const i=[];let e=0;const t=[],n=[],s=[];function o(){e=0,t.length=0,n.length=0,s.length=0}function a(d,u,p,g,x,m){let f=i[e];return f===void 0?(f={id:d.id,object:d,geometry:u,material:p,groupOrder:g,renderOrder:d.renderOrder,z:x,group:m},i[e]=f):(f.id=d.id,f.object=d,f.geometry=u,f.material=p,f.groupOrder=g,f.renderOrder=d.renderOrder,f.z=x,f.group=m),e++,f}function r(d,u,p,g,x,m){const f=a(d,u,p,g,x,m);p.transmission>0?n.push(f):p.transparent===!0?s.push(f):t.push(f)}function c(d,u,p,g,x,m){const f=a(d,u,p,g,x,m);p.transmission>0?n.unshift(f):p.transparent===!0?s.unshift(f):t.unshift(f)}function l(d,u){t.length>1&&t.sort(d||Fm),n.length>1&&n.sort(u||Ec),s.length>1&&s.sort(u||Ec)}function h(){for(let d=e,u=i.length;d<u;d++){const p=i[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:s,init:o,push:r,unshift:c,finish:h,sort:l}}function Om(){let i=new WeakMap;function e(n,s){const o=i.get(n);let a;return o===void 0?(a=new bc,i.set(n,[a])):s>=o.length?(a=new bc,o.push(a)):a=o[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function km(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new P,color:new Se};break;case"SpotLight":t={position:new P,direction:new P,color:new Se,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new P,color:new Se,distance:0,decay:0};break;case"HemisphereLight":t={direction:new P,skyColor:new Se,groundColor:new Se};break;case"RectAreaLight":t={color:new Se,position:new P,halfWidth:new P,halfHeight:new P};break}return i[e.id]=t,t}}}function zm(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Bm=0;function Hm(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Gm(i,e){const t=new km,n=zm(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new P);const o=new P,a=new St,r=new St;function c(h,d){let u=0,p=0,g=0;for(let V=0;V<9;V++)s.probe[V].set(0,0,0);let x=0,m=0,f=0,v=0,_=0,E=0,R=0,T=0,A=0,I=0,S=0;h.sort(Hm);const w=d===!0?Math.PI:1;for(let V=0,te=h.length;V<te;V++){const L=h[V],N=L.color,W=L.intensity,Y=L.distance,q=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)u+=N.r*W*w,p+=N.g*W*w,g+=N.b*W*w;else if(L.isLightProbe){for(let X=0;X<9;X++)s.probe[X].addScaledVector(L.sh.coefficients[X],W);S++}else if(L.isDirectionalLight){const X=t.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity*w),L.castShadow){const Z=L.shadow,ee=n.get(L);ee.shadowBias=Z.bias,ee.shadowNormalBias=Z.normalBias,ee.shadowRadius=Z.radius,ee.shadowMapSize=Z.mapSize,s.directionalShadow[x]=ee,s.directionalShadowMap[x]=q,s.directionalShadowMatrix[x]=L.shadow.matrix,E++}s.directional[x]=X,x++}else if(L.isSpotLight){const X=t.get(L);X.position.setFromMatrixPosition(L.matrixWorld),X.color.copy(N).multiplyScalar(W*w),X.distance=Y,X.coneCos=Math.cos(L.angle),X.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),X.decay=L.decay,s.spot[f]=X;const Z=L.shadow;if(L.map&&(s.spotLightMap[A]=L.map,A++,Z.updateMatrices(L),L.castShadow&&I++),s.spotLightMatrix[f]=Z.matrix,L.castShadow){const ee=n.get(L);ee.shadowBias=Z.bias,ee.shadowNormalBias=Z.normalBias,ee.shadowRadius=Z.radius,ee.shadowMapSize=Z.mapSize,s.spotShadow[f]=ee,s.spotShadowMap[f]=q,T++}f++}else if(L.isRectAreaLight){const X=t.get(L);X.color.copy(N).multiplyScalar(W),X.halfWidth.set(L.width*.5,0,0),X.halfHeight.set(0,L.height*.5,0),s.rectArea[v]=X,v++}else if(L.isPointLight){const X=t.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity*w),X.distance=L.distance,X.decay=L.decay,L.castShadow){const Z=L.shadow,ee=n.get(L);ee.shadowBias=Z.bias,ee.shadowNormalBias=Z.normalBias,ee.shadowRadius=Z.radius,ee.shadowMapSize=Z.mapSize,ee.shadowCameraNear=Z.camera.near,ee.shadowCameraFar=Z.camera.far,s.pointShadow[m]=ee,s.pointShadowMap[m]=q,s.pointShadowMatrix[m]=L.shadow.matrix,R++}s.point[m]=X,m++}else if(L.isHemisphereLight){const X=t.get(L);X.skyColor.copy(L.color).multiplyScalar(W*w),X.groundColor.copy(L.groundColor).multiplyScalar(W*w),s.hemi[_]=X,_++}}v>0&&(e.isWebGL2?i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=se.LTC_FLOAT_1,s.rectAreaLTC2=se.LTC_FLOAT_2):(s.rectAreaLTC1=se.LTC_HALF_1,s.rectAreaLTC2=se.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=se.LTC_FLOAT_1,s.rectAreaLTC2=se.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=se.LTC_HALF_1,s.rectAreaLTC2=se.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=u,s.ambient[1]=p,s.ambient[2]=g;const U=s.hash;(U.directionalLength!==x||U.pointLength!==m||U.spotLength!==f||U.rectAreaLength!==v||U.hemiLength!==_||U.numDirectionalShadows!==E||U.numPointShadows!==R||U.numSpotShadows!==T||U.numSpotMaps!==A||U.numLightProbes!==S)&&(s.directional.length=x,s.spot.length=f,s.rectArea.length=v,s.point.length=m,s.hemi.length=_,s.directionalShadow.length=E,s.directionalShadowMap.length=E,s.pointShadow.length=R,s.pointShadowMap.length=R,s.spotShadow.length=T,s.spotShadowMap.length=T,s.directionalShadowMatrix.length=E,s.pointShadowMatrix.length=R,s.spotLightMatrix.length=T+A-I,s.spotLightMap.length=A,s.numSpotLightShadowsWithMaps=I,s.numLightProbes=S,U.directionalLength=x,U.pointLength=m,U.spotLength=f,U.rectAreaLength=v,U.hemiLength=_,U.numDirectionalShadows=E,U.numPointShadows=R,U.numSpotShadows=T,U.numSpotMaps=A,U.numLightProbes=S,s.version=Bm++)}function l(h,d){let u=0,p=0,g=0,x=0,m=0;const f=d.matrixWorldInverse;for(let v=0,_=h.length;v<_;v++){const E=h[v];if(E.isDirectionalLight){const R=s.directional[u];R.direction.setFromMatrixPosition(E.matrixWorld),o.setFromMatrixPosition(E.target.matrixWorld),R.direction.sub(o),R.direction.transformDirection(f),u++}else if(E.isSpotLight){const R=s.spot[g];R.position.setFromMatrixPosition(E.matrixWorld),R.position.applyMatrix4(f),R.direction.setFromMatrixPosition(E.matrixWorld),o.setFromMatrixPosition(E.target.matrixWorld),R.direction.sub(o),R.direction.transformDirection(f),g++}else if(E.isRectAreaLight){const R=s.rectArea[x];R.position.setFromMatrixPosition(E.matrixWorld),R.position.applyMatrix4(f),r.identity(),a.copy(E.matrixWorld),a.premultiply(f),r.extractRotation(a),R.halfWidth.set(E.width*.5,0,0),R.halfHeight.set(0,E.height*.5,0),R.halfWidth.applyMatrix4(r),R.halfHeight.applyMatrix4(r),x++}else if(E.isPointLight){const R=s.point[p];R.position.setFromMatrixPosition(E.matrixWorld),R.position.applyMatrix4(f),p++}else if(E.isHemisphereLight){const R=s.hemi[m];R.direction.setFromMatrixPosition(E.matrixWorld),R.direction.transformDirection(f),m++}}}return{setup:c,setupView:l,state:s}}function wc(i,e){const t=new Gm(i,e),n=[],s=[];function o(){n.length=0,s.length=0}function a(d){n.push(d)}function r(d){s.push(d)}function c(d){t.setup(n,d)}function l(d){t.setupView(n,d)}return{init:o,state:{lightsArray:n,shadowsArray:s,lights:t},setupLights:c,setupLightsView:l,pushLight:a,pushShadow:r}}function Vm(i,e){let t=new WeakMap;function n(o,a=0){const r=t.get(o);let c;return r===void 0?(c=new wc(i,e),t.set(o,[c])):a>=r.length?(c=new wc(i,e),r.push(c)):c=r[a],c}function s(){t=new WeakMap}return{get:n,dispose:s}}class Wm extends xs{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Bh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Xm extends xs{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const qm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ym=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function $m(i,e,t){let n=new zr;const s=new je,o=new je,a=new Lt,r=new Wm({depthPacking:Hh}),c=new Xm,l={},h=t.maxTextureSize,d={[Yn]:Kt,[Kt]:Yn,[jt]:jt},u=new ui({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:qm,fragmentShader:Ym}),p=u.clone();p.defines.HORIZONTAL_PASS=1;const g=new Jt;g.setAttribute("position",new sn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Ce(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Bc;let f=this.type;this.render=function(T,A,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;const S=i.getRenderTarget(),w=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),V=i.state;V.setBlending(Vn),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);const te=f!==Ln&&this.type===Ln,L=f===Ln&&this.type!==Ln;for(let N=0,W=T.length;N<W;N++){const Y=T[N],q=Y.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);const X=q.getFrameExtents();if(s.multiply(X),o.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(o.x=Math.floor(h/X.x),s.x=o.x*X.x,q.mapSize.x=o.x),s.y>h&&(o.y=Math.floor(h/X.y),s.y=o.y*X.y,q.mapSize.y=o.y)),q.map===null||te===!0||L===!0){const ee=this.type!==Ln?{minFilter:qt,magFilter:qt}:{};q.map!==null&&q.map.dispose(),q.map=new di(s.x,s.y,ee),q.map.texture.name=Y.name+".shadowMap",q.camera.updateProjectionMatrix()}i.setRenderTarget(q.map),i.clear();const Z=q.getViewportCount();for(let ee=0;ee<Z;ee++){const ue=q.getViewport(ee);a.set(o.x*ue.x,o.y*ue.y,o.x*ue.z,o.y*ue.w),V.viewport(a),q.updateMatrices(Y,ee),n=q.getFrustum(),E(A,I,q.camera,Y,this.type)}q.isPointLightShadow!==!0&&this.type===Ln&&v(q,I),q.needsUpdate=!1}f=this.type,m.needsUpdate=!1,i.setRenderTarget(S,w,U)};function v(T,A){const I=e.update(x);u.defines.VSM_SAMPLES!==T.blurSamples&&(u.defines.VSM_SAMPLES=T.blurSamples,p.defines.VSM_SAMPLES=T.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new di(s.x,s.y)),u.uniforms.shadow_pass.value=T.map.texture,u.uniforms.resolution.value=T.mapSize,u.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(A,null,I,u,x,null),p.uniforms.shadow_pass.value=T.mapPass.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(A,null,I,p,x,null)}function _(T,A,I,S){let w=null;const U=I.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(U!==void 0)w=U;else if(w=I.isPointLight===!0?c:r,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const V=w.uuid,te=A.uuid;let L=l[V];L===void 0&&(L={},l[V]=L);let N=L[te];N===void 0&&(N=w.clone(),L[te]=N,A.addEventListener("dispose",R)),w=N}if(w.visible=A.visible,w.wireframe=A.wireframe,S===Ln?w.side=A.shadowSide!==null?A.shadowSide:A.side:w.side=A.shadowSide!==null?A.shadowSide:d[A.side],w.alphaMap=A.alphaMap,w.alphaTest=A.alphaTest,w.map=A.map,w.clipShadows=A.clipShadows,w.clippingPlanes=A.clippingPlanes,w.clipIntersection=A.clipIntersection,w.displacementMap=A.displacementMap,w.displacementScale=A.displacementScale,w.displacementBias=A.displacementBias,w.wireframeLinewidth=A.wireframeLinewidth,w.linewidth=A.linewidth,I.isPointLight===!0&&w.isMeshDistanceMaterial===!0){const V=i.properties.get(w);V.light=I}return w}function E(T,A,I,S,w){if(T.visible===!1)return;if(T.layers.test(A.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&w===Ln)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,T.matrixWorld);const te=e.update(T),L=T.material;if(Array.isArray(L)){const N=te.groups;for(let W=0,Y=N.length;W<Y;W++){const q=N[W],X=L[q.materialIndex];if(X&&X.visible){const Z=_(T,X,S,w);T.onBeforeShadow(i,T,A,I,te,Z,q),i.renderBufferDirect(I,null,te,Z,T,q),T.onAfterShadow(i,T,A,I,te,Z,q)}}}else if(L.visible){const N=_(T,L,S,w);T.onBeforeShadow(i,T,A,I,te,N,null),i.renderBufferDirect(I,null,te,N,T,null),T.onAfterShadow(i,T,A,I,te,N,null)}}const V=T.children;for(let te=0,L=V.length;te<L;te++)E(V[te],A,I,S,w)}function R(T){T.target.removeEventListener("dispose",R);for(const I in l){const S=l[I],w=T.target.uuid;w in S&&(S[w].dispose(),delete S[w])}}}function jm(i,e,t){const n=t.isWebGL2;function s(){let C=!1;const re=new Lt;let ae=null;const Re=new Lt(0,0,0,0);return{setMask:function(be){ae!==be&&!C&&(i.colorMask(be,be,be,be),ae=be)},setLocked:function(be){C=be},setClear:function(be,rt,at,bt,Vt){Vt===!0&&(be*=bt,rt*=bt,at*=bt),re.set(be,rt,at,bt),Re.equals(re)===!1&&(i.clearColor(be,rt,at,bt),Re.copy(re))},reset:function(){C=!1,ae=null,Re.set(-1,0,0,0)}}}function o(){let C=!1,re=null,ae=null,Re=null;return{setTest:function(be){be?Oe(i.DEPTH_TEST):Ae(i.DEPTH_TEST)},setMask:function(be){re!==be&&!C&&(i.depthMask(be),re=be)},setFunc:function(be){if(ae!==be){switch(be){case gh:i.depthFunc(i.NEVER);break;case _h:i.depthFunc(i.ALWAYS);break;case xh:i.depthFunc(i.LESS);break;case Qs:i.depthFunc(i.LEQUAL);break;case vh:i.depthFunc(i.EQUAL);break;case Mh:i.depthFunc(i.GEQUAL);break;case Sh:i.depthFunc(i.GREATER);break;case yh:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ae=be}},setLocked:function(be){C=be},setClear:function(be){Re!==be&&(i.clearDepth(be),Re=be)},reset:function(){C=!1,re=null,ae=null,Re=null}}}function a(){let C=!1,re=null,ae=null,Re=null,be=null,rt=null,at=null,bt=null,Vt=null;return{setTest:function(ct){C||(ct?Oe(i.STENCIL_TEST):Ae(i.STENCIL_TEST))},setMask:function(ct){re!==ct&&!C&&(i.stencilMask(ct),re=ct)},setFunc:function(ct,Wt,Sn){(ae!==ct||Re!==Wt||be!==Sn)&&(i.stencilFunc(ct,Wt,Sn),ae=ct,Re=Wt,be=Sn)},setOp:function(ct,Wt,Sn){(rt!==ct||at!==Wt||bt!==Sn)&&(i.stencilOp(ct,Wt,Sn),rt=ct,at=Wt,bt=Sn)},setLocked:function(ct){C=ct},setClear:function(ct){Vt!==ct&&(i.clearStencil(ct),Vt=ct)},reset:function(){C=!1,re=null,ae=null,Re=null,be=null,rt=null,at=null,bt=null,Vt=null}}}const r=new s,c=new o,l=new a,h=new WeakMap,d=new WeakMap;let u={},p={},g=new WeakMap,x=[],m=null,f=!1,v=null,_=null,E=null,R=null,T=null,A=null,I=null,S=new Se(0,0,0),w=0,U=!1,V=null,te=null,L=null,N=null,W=null;const Y=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,X=0;const Z=i.getParameter(i.VERSION);Z.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec(Z)[1]),q=X>=1):Z.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec(Z)[1]),q=X>=2);let ee=null,ue={};const G=i.getParameter(i.SCISSOR_BOX),$=i.getParameter(i.VIEWPORT),he=new Lt().fromArray(G),Me=new Lt().fromArray($);function ve(C,re,ae,Re){const be=new Uint8Array(4),rt=i.createTexture();i.bindTexture(C,rt),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let at=0;at<ae;at++)n&&(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)?i.texImage3D(re,0,i.RGBA,1,1,Re,0,i.RGBA,i.UNSIGNED_BYTE,be):i.texImage2D(re+at,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,be);return rt}const Ne={};Ne[i.TEXTURE_2D]=ve(i.TEXTURE_2D,i.TEXTURE_2D,1),Ne[i.TEXTURE_CUBE_MAP]=ve(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(Ne[i.TEXTURE_2D_ARRAY]=ve(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ne[i.TEXTURE_3D]=ve(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),r.setClear(0,0,0,1),c.setClear(1),l.setClear(0),Oe(i.DEPTH_TEST),c.setFunc(Qs),Ge(!1),b(ra),Oe(i.CULL_FACE),me(Vn);function Oe(C){u[C]!==!0&&(i.enable(C),u[C]=!0)}function Ae(C){u[C]!==!1&&(i.disable(C),u[C]=!1)}function Qe(C,re){return p[C]!==re?(i.bindFramebuffer(C,re),p[C]=re,n&&(C===i.DRAW_FRAMEBUFFER&&(p[i.FRAMEBUFFER]=re),C===i.FRAMEBUFFER&&(p[i.DRAW_FRAMEBUFFER]=re)),!0):!1}function F(C,re){let ae=x,Re=!1;if(C)if(ae=g.get(re),ae===void 0&&(ae=[],g.set(re,ae)),C.isWebGLMultipleRenderTargets){const be=C.texture;if(ae.length!==be.length||ae[0]!==i.COLOR_ATTACHMENT0){for(let rt=0,at=be.length;rt<at;rt++)ae[rt]=i.COLOR_ATTACHMENT0+rt;ae.length=be.length,Re=!0}}else ae[0]!==i.COLOR_ATTACHMENT0&&(ae[0]=i.COLOR_ATTACHMENT0,Re=!0);else ae[0]!==i.BACK&&(ae[0]=i.BACK,Re=!0);Re&&(t.isWebGL2?i.drawBuffers(ae):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(ae))}function Gt(C){return m!==C?(i.useProgram(C),m=C,!0):!1}const Ee={[ii]:i.FUNC_ADD,[th]:i.FUNC_SUBTRACT,[nh]:i.FUNC_REVERSE_SUBTRACT};if(n)Ee[ha]=i.MIN,Ee[da]=i.MAX;else{const C=e.get("EXT_blend_minmax");C!==null&&(Ee[ha]=C.MIN_EXT,Ee[da]=C.MAX_EXT)}const Ie={[ih]:i.ZERO,[sh]:i.ONE,[oh]:i.SRC_COLOR,[xr]:i.SRC_ALPHA,[dh]:i.SRC_ALPHA_SATURATE,[lh]:i.DST_COLOR,[ah]:i.DST_ALPHA,[rh]:i.ONE_MINUS_SRC_COLOR,[vr]:i.ONE_MINUS_SRC_ALPHA,[hh]:i.ONE_MINUS_DST_COLOR,[ch]:i.ONE_MINUS_DST_ALPHA,[uh]:i.CONSTANT_COLOR,[fh]:i.ONE_MINUS_CONSTANT_COLOR,[ph]:i.CONSTANT_ALPHA,[mh]:i.ONE_MINUS_CONSTANT_ALPHA};function me(C,re,ae,Re,be,rt,at,bt,Vt,ct){if(C===Vn){f===!0&&(Ae(i.BLEND),f=!1);return}if(f===!1&&(Oe(i.BLEND),f=!0),C!==eh){if(C!==v||ct!==U){if((_!==ii||T!==ii)&&(i.blendEquation(i.FUNC_ADD),_=ii,T=ii),ct)switch(C){case zi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case aa:i.blendFunc(i.ONE,i.ONE);break;case ca:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case la:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case zi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case aa:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case ca:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case la:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}E=null,R=null,A=null,I=null,S.set(0,0,0),w=0,v=C,U=ct}return}be=be||re,rt=rt||ae,at=at||Re,(re!==_||be!==T)&&(i.blendEquationSeparate(Ee[re],Ee[be]),_=re,T=be),(ae!==E||Re!==R||rt!==A||at!==I)&&(i.blendFuncSeparate(Ie[ae],Ie[Re],Ie[rt],Ie[at]),E=ae,R=Re,A=rt,I=at),(bt.equals(S)===!1||Vt!==w)&&(i.blendColor(bt.r,bt.g,bt.b,Vt),S.copy(bt),w=Vt),v=C,U=!1}function dt(C,re){C.side===jt?Ae(i.CULL_FACE):Oe(i.CULL_FACE);let ae=C.side===Kt;re&&(ae=!ae),Ge(ae),C.blending===zi&&C.transparent===!1?me(Vn):me(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),c.setFunc(C.depthFunc),c.setTest(C.depthTest),c.setMask(C.depthWrite),r.setMask(C.colorWrite);const Re=C.stencilWrite;l.setTest(Re),Re&&(l.setMask(C.stencilWriteMask),l.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),l.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),k(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?Oe(i.SAMPLE_ALPHA_TO_COVERAGE):Ae(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ge(C){V!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),V=C)}function b(C){C!==Jl?(Oe(i.CULL_FACE),C!==te&&(C===ra?i.cullFace(i.BACK):C===Ql?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ae(i.CULL_FACE),te=C}function M(C){C!==L&&(q&&i.lineWidth(C),L=C)}function k(C,re,ae){C?(Oe(i.POLYGON_OFFSET_FILL),(N!==re||W!==ae)&&(i.polygonOffset(re,ae),N=re,W=ae)):Ae(i.POLYGON_OFFSET_FILL)}function J(C){C?Oe(i.SCISSOR_TEST):Ae(i.SCISSOR_TEST)}function K(C){C===void 0&&(C=i.TEXTURE0+Y-1),ee!==C&&(i.activeTexture(C),ee=C)}function Q(C,re,ae){ae===void 0&&(ee===null?ae=i.TEXTURE0+Y-1:ae=ee);let Re=ue[ae];Re===void 0&&(Re={type:void 0,texture:void 0},ue[ae]=Re),(Re.type!==C||Re.texture!==re)&&(ee!==ae&&(i.activeTexture(ae),ee=ae),i.bindTexture(C,re||Ne[C]),Re.type=C,Re.texture=re)}function _e(){const C=ue[ee];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function ce(){try{i.compressedTexImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function fe(){try{i.compressedTexImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Te(){try{i.texSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ve(){try{i.texSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function j(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function st(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ke(){try{i.texStorage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Pe(){try{i.texStorage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ye(){try{i.texImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function pe(){try{i.texImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ke(C){he.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),he.copy(C))}function it(C){Me.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),Me.copy(C))}function mt(C,re){let ae=d.get(re);ae===void 0&&(ae=new WeakMap,d.set(re,ae));let Re=ae.get(C);Re===void 0&&(Re=i.getUniformBlockIndex(re,C.name),ae.set(C,Re))}function Xe(C,re){const Re=d.get(re).get(C);h.get(re)!==Re&&(i.uniformBlockBinding(re,Re,C.__bindingPointIndex),h.set(re,Re))}function ie(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},ee=null,ue={},p={},g=new WeakMap,x=[],m=null,f=!1,v=null,_=null,E=null,R=null,T=null,A=null,I=null,S=new Se(0,0,0),w=0,U=!1,V=null,te=null,L=null,N=null,W=null,he.set(0,0,i.canvas.width,i.canvas.height),Me.set(0,0,i.canvas.width,i.canvas.height),r.reset(),c.reset(),l.reset()}return{buffers:{color:r,depth:c,stencil:l},enable:Oe,disable:Ae,bindFramebuffer:Qe,drawBuffers:F,useProgram:Gt,setBlending:me,setMaterial:dt,setFlipSided:Ge,setCullFace:b,setLineWidth:M,setPolygonOffset:k,setScissorTest:J,activeTexture:K,bindTexture:Q,unbindTexture:_e,compressedTexImage2D:ce,compressedTexImage3D:fe,texImage2D:ye,texImage3D:pe,updateUBOMapping:mt,uniformBlockBinding:Xe,texStorage2D:Ke,texStorage3D:Pe,texSubImage2D:Te,texSubImage3D:Ve,compressedTexSubImage2D:j,compressedTexSubImage3D:st,scissor:ke,viewport:it,reset:ie}}function Km(i,e,t,n,s,o,a){const r=s.isWebGL2,c=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap;let d;const u=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(b,M){return p?new OffscreenCanvas(b,M):so("canvas")}function x(b,M,k,J){let K=1;if((b.width>J||b.height>J)&&(K=J/Math.max(b.width,b.height)),K<1||M===!0)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap){const Q=M?Tr:Math.floor,_e=Q(K*b.width),ce=Q(K*b.height);d===void 0&&(d=g(_e,ce));const fe=k?g(_e,ce):d;return fe.width=_e,fe.height=ce,fe.getContext("2d").drawImage(b,0,0,_e,ce),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+b.width+"x"+b.height+") to ("+_e+"x"+ce+")."),fe}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+b.width+"x"+b.height+")."),b;return b}function m(b){return Ha(b.width)&&Ha(b.height)}function f(b){return r?!1:b.wrapS!==_n||b.wrapT!==_n||b.minFilter!==qt&&b.minFilter!==cn}function v(b,M){return b.generateMipmaps&&M&&b.minFilter!==qt&&b.minFilter!==cn}function _(b){i.generateMipmap(b)}function E(b,M,k,J,K=!1){if(r===!1)return M;if(b!==null){if(i[b]!==void 0)return i[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let Q=M;if(M===i.RED&&(k===i.FLOAT&&(Q=i.R32F),k===i.HALF_FLOAT&&(Q=i.R16F),k===i.UNSIGNED_BYTE&&(Q=i.R8)),M===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Q=i.R8UI),k===i.UNSIGNED_SHORT&&(Q=i.R16UI),k===i.UNSIGNED_INT&&(Q=i.R32UI),k===i.BYTE&&(Q=i.R8I),k===i.SHORT&&(Q=i.R16I),k===i.INT&&(Q=i.R32I)),M===i.RG&&(k===i.FLOAT&&(Q=i.RG32F),k===i.HALF_FLOAT&&(Q=i.RG16F),k===i.UNSIGNED_BYTE&&(Q=i.RG8)),M===i.RGBA){const _e=K?eo:ot.getTransfer(J);k===i.FLOAT&&(Q=i.RGBA32F),k===i.HALF_FLOAT&&(Q=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Q=_e===lt?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(Q=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Q=i.RGB5_A1)}return(Q===i.R16F||Q===i.R32F||Q===i.RG16F||Q===i.RG32F||Q===i.RGBA16F||Q===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Q}function R(b,M,k){return v(b,k)===!0||b.isFramebufferTexture&&b.minFilter!==qt&&b.minFilter!==cn?Math.log2(Math.max(M.width,M.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?M.mipmaps.length:1}function T(b){return b===qt||b===ua||b===To?i.NEAREST:i.LINEAR}function A(b){const M=b.target;M.removeEventListener("dispose",A),S(M),M.isVideoTexture&&h.delete(M)}function I(b){const M=b.target;M.removeEventListener("dispose",I),U(M)}function S(b){const M=n.get(b);if(M.__webglInit===void 0)return;const k=b.source,J=u.get(k);if(J){const K=J[M.__cacheKey];K.usedTimes--,K.usedTimes===0&&w(b),Object.keys(J).length===0&&u.delete(k)}n.remove(b)}function w(b){const M=n.get(b);i.deleteTexture(M.__webglTexture);const k=b.source,J=u.get(k);delete J[M.__cacheKey],a.memory.textures--}function U(b){const M=b.texture,k=n.get(b),J=n.get(M);if(J.__webglTexture!==void 0&&(i.deleteTexture(J.__webglTexture),a.memory.textures--),b.depthTexture&&b.depthTexture.dispose(),b.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(k.__webglFramebuffer[K]))for(let Q=0;Q<k.__webglFramebuffer[K].length;Q++)i.deleteFramebuffer(k.__webglFramebuffer[K][Q]);else i.deleteFramebuffer(k.__webglFramebuffer[K]);k.__webglDepthbuffer&&i.deleteRenderbuffer(k.__webglDepthbuffer[K])}else{if(Array.isArray(k.__webglFramebuffer))for(let K=0;K<k.__webglFramebuffer.length;K++)i.deleteFramebuffer(k.__webglFramebuffer[K]);else i.deleteFramebuffer(k.__webglFramebuffer);if(k.__webglDepthbuffer&&i.deleteRenderbuffer(k.__webglDepthbuffer),k.__webglMultisampledFramebuffer&&i.deleteFramebuffer(k.__webglMultisampledFramebuffer),k.__webglColorRenderbuffer)for(let K=0;K<k.__webglColorRenderbuffer.length;K++)k.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(k.__webglColorRenderbuffer[K]);k.__webglDepthRenderbuffer&&i.deleteRenderbuffer(k.__webglDepthRenderbuffer)}if(b.isWebGLMultipleRenderTargets)for(let K=0,Q=M.length;K<Q;K++){const _e=n.get(M[K]);_e.__webglTexture&&(i.deleteTexture(_e.__webglTexture),a.memory.textures--),n.remove(M[K])}n.remove(M),n.remove(b)}let V=0;function te(){V=0}function L(){const b=V;return b>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+s.maxTextures),V+=1,b}function N(b){const M=[];return M.push(b.wrapS),M.push(b.wrapT),M.push(b.wrapR||0),M.push(b.magFilter),M.push(b.minFilter),M.push(b.anisotropy),M.push(b.internalFormat),M.push(b.format),M.push(b.type),M.push(b.generateMipmaps),M.push(b.premultiplyAlpha),M.push(b.flipY),M.push(b.unpackAlignment),M.push(b.colorSpace),M.join()}function W(b,M){const k=n.get(b);if(b.isVideoTexture&&dt(b),b.isRenderTargetTexture===!1&&b.version>0&&k.__version!==b.version){const J=b.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{he(k,b,M);return}}t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+M)}function Y(b,M){const k=n.get(b);if(b.version>0&&k.__version!==b.version){he(k,b,M);return}t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+M)}function q(b,M){const k=n.get(b);if(b.version>0&&k.__version!==b.version){he(k,b,M);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+M)}function X(b,M){const k=n.get(b);if(b.version>0&&k.__version!==b.version){Me(k,b,M);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+M)}const Z={[yr]:i.REPEAT,[_n]:i.CLAMP_TO_EDGE,[Er]:i.MIRRORED_REPEAT},ee={[qt]:i.NEAREST,[ua]:i.NEAREST_MIPMAP_NEAREST,[To]:i.NEAREST_MIPMAP_LINEAR,[cn]:i.LINEAR,[Ph]:i.LINEAR_MIPMAP_NEAREST,[ds]:i.LINEAR_MIPMAP_LINEAR},ue={[Vh]:i.NEVER,[jh]:i.ALWAYS,[Wh]:i.LESS,[Jc]:i.LEQUAL,[Xh]:i.EQUAL,[$h]:i.GEQUAL,[qh]:i.GREATER,[Yh]:i.NOTEQUAL};function G(b,M,k){if(k?(i.texParameteri(b,i.TEXTURE_WRAP_S,Z[M.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,Z[M.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,Z[M.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,ee[M.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,ee[M.minFilter])):(i.texParameteri(b,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(b,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(M.wrapS!==_n||M.wrapT!==_n)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(b,i.TEXTURE_MAG_FILTER,T(M.magFilter)),i.texParameteri(b,i.TEXTURE_MIN_FILTER,T(M.minFilter)),M.minFilter!==qt&&M.minFilter!==cn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,ue[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const J=e.get("EXT_texture_filter_anisotropic");if(M.magFilter===qt||M.minFilter!==To&&M.minFilter!==ds||M.type===Gn&&e.has("OES_texture_float_linear")===!1||r===!1&&M.type===us&&e.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||n.get(M).__currentAnisotropy)&&(i.texParameterf(b,J.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,s.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy)}}function $(b,M){let k=!1;b.__webglInit===void 0&&(b.__webglInit=!0,M.addEventListener("dispose",A));const J=M.source;let K=u.get(J);K===void 0&&(K={},u.set(J,K));const Q=N(M);if(Q!==b.__cacheKey){K[Q]===void 0&&(K[Q]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),K[Q].usedTimes++;const _e=K[b.__cacheKey];_e!==void 0&&(K[b.__cacheKey].usedTimes--,_e.usedTimes===0&&w(M)),b.__cacheKey=Q,b.__webglTexture=K[Q].texture}return k}function he(b,M,k){let J=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(J=i.TEXTURE_3D);const K=$(b,M),Q=M.source;t.bindTexture(J,b.__webglTexture,i.TEXTURE0+k);const _e=n.get(Q);if(Q.version!==_e.__version||K===!0){t.activeTexture(i.TEXTURE0+k);const ce=ot.getPrimaries(ot.workingColorSpace),fe=M.colorSpace===hn?null:ot.getPrimaries(M.colorSpace),Te=M.colorSpace===hn||ce===fe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Te);const Ve=f(M)&&m(M.image)===!1;let j=x(M.image,Ve,!1,s.maxTextureSize);j=Ge(M,j);const st=m(j)||r,Ke=o.convert(M.format,M.colorSpace);let Pe=o.convert(M.type),ye=E(M.internalFormat,Ke,Pe,M.colorSpace,M.isVideoTexture);G(J,M,st);let pe;const ke=M.mipmaps,it=r&&M.isVideoTexture!==!0&&ye!==jc,mt=_e.__version===void 0||K===!0,Xe=R(M,j,st);if(M.isDepthTexture)ye=i.DEPTH_COMPONENT,r?M.type===Gn?ye=i.DEPTH_COMPONENT32F:M.type===Hn?ye=i.DEPTH_COMPONENT24:M.type===ri?ye=i.DEPTH24_STENCIL8:ye=i.DEPTH_COMPONENT16:M.type===Gn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===ai&&ye===i.DEPTH_COMPONENT&&M.type!==Nr&&M.type!==Hn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=Hn,Pe=o.convert(M.type)),M.format===Wi&&ye===i.DEPTH_COMPONENT&&(ye=i.DEPTH_STENCIL,M.type!==ri&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=ri,Pe=o.convert(M.type))),mt&&(it?t.texStorage2D(i.TEXTURE_2D,1,ye,j.width,j.height):t.texImage2D(i.TEXTURE_2D,0,ye,j.width,j.height,0,Ke,Pe,null));else if(M.isDataTexture)if(ke.length>0&&st){it&&mt&&t.texStorage2D(i.TEXTURE_2D,Xe,ye,ke[0].width,ke[0].height);for(let ie=0,C=ke.length;ie<C;ie++)pe=ke[ie],it?t.texSubImage2D(i.TEXTURE_2D,ie,0,0,pe.width,pe.height,Ke,Pe,pe.data):t.texImage2D(i.TEXTURE_2D,ie,ye,pe.width,pe.height,0,Ke,Pe,pe.data);M.generateMipmaps=!1}else it?(mt&&t.texStorage2D(i.TEXTURE_2D,Xe,ye,j.width,j.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,j.width,j.height,Ke,Pe,j.data)):t.texImage2D(i.TEXTURE_2D,0,ye,j.width,j.height,0,Ke,Pe,j.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){it&&mt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Xe,ye,ke[0].width,ke[0].height,j.depth);for(let ie=0,C=ke.length;ie<C;ie++)pe=ke[ie],M.format!==xn?Ke!==null?it?t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ie,0,0,0,pe.width,pe.height,j.depth,Ke,pe.data,0,0):t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ie,ye,pe.width,pe.height,j.depth,0,pe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):it?t.texSubImage3D(i.TEXTURE_2D_ARRAY,ie,0,0,0,pe.width,pe.height,j.depth,Ke,Pe,pe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ie,ye,pe.width,pe.height,j.depth,0,Ke,Pe,pe.data)}else{it&&mt&&t.texStorage2D(i.TEXTURE_2D,Xe,ye,ke[0].width,ke[0].height);for(let ie=0,C=ke.length;ie<C;ie++)pe=ke[ie],M.format!==xn?Ke!==null?it?t.compressedTexSubImage2D(i.TEXTURE_2D,ie,0,0,pe.width,pe.height,Ke,pe.data):t.compressedTexImage2D(i.TEXTURE_2D,ie,ye,pe.width,pe.height,0,pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):it?t.texSubImage2D(i.TEXTURE_2D,ie,0,0,pe.width,pe.height,Ke,Pe,pe.data):t.texImage2D(i.TEXTURE_2D,ie,ye,pe.width,pe.height,0,Ke,Pe,pe.data)}else if(M.isDataArrayTexture)it?(mt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Xe,ye,j.width,j.height,j.depth),t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,Ke,Pe,j.data)):t.texImage3D(i.TEXTURE_2D_ARRAY,0,ye,j.width,j.height,j.depth,0,Ke,Pe,j.data);else if(M.isData3DTexture)it?(mt&&t.texStorage3D(i.TEXTURE_3D,Xe,ye,j.width,j.height,j.depth),t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,Ke,Pe,j.data)):t.texImage3D(i.TEXTURE_3D,0,ye,j.width,j.height,j.depth,0,Ke,Pe,j.data);else if(M.isFramebufferTexture){if(mt)if(it)t.texStorage2D(i.TEXTURE_2D,Xe,ye,j.width,j.height);else{let ie=j.width,C=j.height;for(let re=0;re<Xe;re++)t.texImage2D(i.TEXTURE_2D,re,ye,ie,C,0,Ke,Pe,null),ie>>=1,C>>=1}}else if(ke.length>0&&st){it&&mt&&t.texStorage2D(i.TEXTURE_2D,Xe,ye,ke[0].width,ke[0].height);for(let ie=0,C=ke.length;ie<C;ie++)pe=ke[ie],it?t.texSubImage2D(i.TEXTURE_2D,ie,0,0,Ke,Pe,pe):t.texImage2D(i.TEXTURE_2D,ie,ye,Ke,Pe,pe);M.generateMipmaps=!1}else it?(mt&&t.texStorage2D(i.TEXTURE_2D,Xe,ye,j.width,j.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,Ke,Pe,j)):t.texImage2D(i.TEXTURE_2D,0,ye,Ke,Pe,j);v(M,st)&&_(J),_e.__version=Q.version,M.onUpdate&&M.onUpdate(M)}b.__version=M.version}function Me(b,M,k){if(M.image.length!==6)return;const J=$(b,M),K=M.source;t.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+k);const Q=n.get(K);if(K.version!==Q.__version||J===!0){t.activeTexture(i.TEXTURE0+k);const _e=ot.getPrimaries(ot.workingColorSpace),ce=M.colorSpace===hn?null:ot.getPrimaries(M.colorSpace),fe=M.colorSpace===hn||_e===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);const Te=M.isCompressedTexture||M.image[0].isCompressedTexture,Ve=M.image[0]&&M.image[0].isDataTexture,j=[];for(let ie=0;ie<6;ie++)!Te&&!Ve?j[ie]=x(M.image[ie],!1,!0,s.maxCubemapSize):j[ie]=Ve?M.image[ie].image:M.image[ie],j[ie]=Ge(M,j[ie]);const st=j[0],Ke=m(st)||r,Pe=o.convert(M.format,M.colorSpace),ye=o.convert(M.type),pe=E(M.internalFormat,Pe,ye,M.colorSpace),ke=r&&M.isVideoTexture!==!0,it=Q.__version===void 0||J===!0;let mt=R(M,st,Ke);G(i.TEXTURE_CUBE_MAP,M,Ke);let Xe;if(Te){ke&&it&&t.texStorage2D(i.TEXTURE_CUBE_MAP,mt,pe,st.width,st.height);for(let ie=0;ie<6;ie++){Xe=j[ie].mipmaps;for(let C=0;C<Xe.length;C++){const re=Xe[C];M.format!==xn?Pe!==null?ke?t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C,0,0,re.width,re.height,Pe,re.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C,pe,re.width,re.height,0,re.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ke?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C,0,0,re.width,re.height,Pe,ye,re.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C,pe,re.width,re.height,0,Pe,ye,re.data)}}}else{Xe=M.mipmaps,ke&&it&&(Xe.length>0&&mt++,t.texStorage2D(i.TEXTURE_CUBE_MAP,mt,pe,j[0].width,j[0].height));for(let ie=0;ie<6;ie++)if(Ve){ke?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,j[ie].width,j[ie].height,Pe,ye,j[ie].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,pe,j[ie].width,j[ie].height,0,Pe,ye,j[ie].data);for(let C=0;C<Xe.length;C++){const ae=Xe[C].image[ie].image;ke?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C+1,0,0,ae.width,ae.height,Pe,ye,ae.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C+1,pe,ae.width,ae.height,0,Pe,ye,ae.data)}}else{ke?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,0,0,Pe,ye,j[ie]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0,pe,Pe,ye,j[ie]);for(let C=0;C<Xe.length;C++){const re=Xe[C];ke?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C+1,0,0,Pe,ye,re.image[ie]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ie,C+1,pe,Pe,ye,re.image[ie])}}}v(M,Ke)&&_(i.TEXTURE_CUBE_MAP),Q.__version=K.version,M.onUpdate&&M.onUpdate(M)}b.__version=M.version}function ve(b,M,k,J,K,Q){const _e=o.convert(k.format,k.colorSpace),ce=o.convert(k.type),fe=E(k.internalFormat,_e,ce,k.colorSpace);if(!n.get(M).__hasExternalTextures){const Ve=Math.max(1,M.width>>Q),j=Math.max(1,M.height>>Q);K===i.TEXTURE_3D||K===i.TEXTURE_2D_ARRAY?t.texImage3D(K,Q,fe,Ve,j,M.depth,0,_e,ce,null):t.texImage2D(K,Q,fe,Ve,j,0,_e,ce,null)}t.bindFramebuffer(i.FRAMEBUFFER,b),me(M)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,K,n.get(k).__webglTexture,0,Ie(M)):(K===i.TEXTURE_2D||K>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,K,n.get(k).__webglTexture,Q),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ne(b,M,k){if(i.bindRenderbuffer(i.RENDERBUFFER,b),M.depthBuffer&&!M.stencilBuffer){let J=r===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(k||me(M)){const K=M.depthTexture;K&&K.isDepthTexture&&(K.type===Gn?J=i.DEPTH_COMPONENT32F:K.type===Hn&&(J=i.DEPTH_COMPONENT24));const Q=Ie(M);me(M)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Q,J,M.width,M.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,Q,J,M.width,M.height)}else i.renderbufferStorage(i.RENDERBUFFER,J,M.width,M.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,b)}else if(M.depthBuffer&&M.stencilBuffer){const J=Ie(M);k&&me(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,J,i.DEPTH24_STENCIL8,M.width,M.height):me(M)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,J,i.DEPTH24_STENCIL8,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,b)}else{const J=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let K=0;K<J.length;K++){const Q=J[K],_e=o.convert(Q.format,Q.colorSpace),ce=o.convert(Q.type),fe=E(Q.internalFormat,_e,ce,Q.colorSpace),Te=Ie(M);k&&me(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Te,fe,M.width,M.height):me(M)?c.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Te,fe,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,fe,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Oe(b,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,b),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),W(M.depthTexture,0);const J=n.get(M.depthTexture).__webglTexture,K=Ie(M);if(M.depthTexture.format===ai)me(M)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(M.depthTexture.format===Wi)me(M)?c.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function Ae(b){const M=n.get(b),k=b.isWebGLCubeRenderTarget===!0;if(b.depthTexture&&!M.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");Oe(M.__webglFramebuffer,b)}else if(k){M.__webglDepthbuffer=[];for(let J=0;J<6;J++)t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[J]),M.__webglDepthbuffer[J]=i.createRenderbuffer(),Ne(M.__webglDepthbuffer[J],b,!1)}else t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=i.createRenderbuffer(),Ne(M.__webglDepthbuffer,b,!1);t.bindFramebuffer(i.FRAMEBUFFER,null)}function Qe(b,M,k){const J=n.get(b);M!==void 0&&ve(J.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&Ae(b)}function F(b){const M=b.texture,k=n.get(b),J=n.get(M);b.addEventListener("dispose",I),b.isWebGLMultipleRenderTargets!==!0&&(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=M.version,a.memory.textures++);const K=b.isWebGLCubeRenderTarget===!0,Q=b.isWebGLMultipleRenderTargets===!0,_e=m(b)||r;if(K){k.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(r&&M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer[ce]=[];for(let fe=0;fe<M.mipmaps.length;fe++)k.__webglFramebuffer[ce][fe]=i.createFramebuffer()}else k.__webglFramebuffer[ce]=i.createFramebuffer()}else{if(r&&M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer=[];for(let ce=0;ce<M.mipmaps.length;ce++)k.__webglFramebuffer[ce]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(Q)if(s.drawBuffers){const ce=b.texture;for(let fe=0,Te=ce.length;fe<Te;fe++){const Ve=n.get(ce[fe]);Ve.__webglTexture===void 0&&(Ve.__webglTexture=i.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(r&&b.samples>0&&me(b)===!1){const ce=Q?M:[M];k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let fe=0;fe<ce.length;fe++){const Te=ce[fe];k.__webglColorRenderbuffer[fe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[fe]);const Ve=o.convert(Te.format,Te.colorSpace),j=o.convert(Te.type),st=E(Te.internalFormat,Ve,j,Te.colorSpace,b.isXRRenderTarget===!0),Ke=Ie(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ke,st,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,k.__webglColorRenderbuffer[fe])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Ne(k.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){t.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),G(i.TEXTURE_CUBE_MAP,M,_e);for(let ce=0;ce<6;ce++)if(r&&M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)ve(k.__webglFramebuffer[ce][fe],b,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,fe);else ve(k.__webglFramebuffer[ce],b,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);v(M,_e)&&_(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Q){const ce=b.texture;for(let fe=0,Te=ce.length;fe<Te;fe++){const Ve=ce[fe],j=n.get(Ve);t.bindTexture(i.TEXTURE_2D,j.__webglTexture),G(i.TEXTURE_2D,Ve,_e),ve(k.__webglFramebuffer,b,Ve,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,0),v(Ve,_e)&&_(i.TEXTURE_2D)}t.unbindTexture()}else{let ce=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(r?ce=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(ce,J.__webglTexture),G(ce,M,_e),r&&M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)ve(k.__webglFramebuffer[fe],b,M,i.COLOR_ATTACHMENT0,ce,fe);else ve(k.__webglFramebuffer,b,M,i.COLOR_ATTACHMENT0,ce,0);v(M,_e)&&_(ce),t.unbindTexture()}b.depthBuffer&&Ae(b)}function Gt(b){const M=m(b)||r,k=b.isWebGLMultipleRenderTargets===!0?b.texture:[b.texture];for(let J=0,K=k.length;J<K;J++){const Q=k[J];if(v(Q,M)){const _e=b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,ce=n.get(Q).__webglTexture;t.bindTexture(_e,ce),_(_e),t.unbindTexture()}}}function Ee(b){if(r&&b.samples>0&&me(b)===!1){const M=b.isWebGLMultipleRenderTargets?b.texture:[b.texture],k=b.width,J=b.height;let K=i.COLOR_BUFFER_BIT;const Q=[],_e=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=n.get(b),fe=b.isWebGLMultipleRenderTargets===!0;if(fe)for(let Te=0;Te<M.length;Te++)t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let Te=0;Te<M.length;Te++){Q.push(i.COLOR_ATTACHMENT0+Te),b.depthBuffer&&Q.push(_e);const Ve=ce.__ignoreDepthValues!==void 0?ce.__ignoreDepthValues:!1;if(Ve===!1&&(b.depthBuffer&&(K|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&(K|=i.STENCIL_BUFFER_BIT)),fe&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ce.__webglColorRenderbuffer[Te]),Ve===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[_e]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_e])),fe){const j=n.get(M[Te]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,j,0)}i.blitFramebuffer(0,0,k,J,0,0,k,J,K,i.NEAREST),l&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Q)}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),fe)for(let Te=0;Te<M.length;Te++){t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.RENDERBUFFER,ce.__webglColorRenderbuffer[Te]);const Ve=n.get(M[Te]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.TEXTURE_2D,Ve,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}}function Ie(b){return Math.min(s.maxSamples,b.samples)}function me(b){const M=n.get(b);return r&&b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function dt(b){const M=a.render.frame;h.get(b)!==M&&(h.set(b,M),b.update())}function Ge(b,M){const k=b.colorSpace,J=b.format,K=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||b.format===br||k!==Dn&&k!==hn&&(ot.getTransfer(k)===lt?r===!1?e.has("EXT_sRGB")===!0&&J===xn?(b.format=br,b.minFilter=cn,b.generateMipmaps=!1):M=el.sRGBToLinear(M):(J!==xn||K!==Xn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),M}this.allocateTextureUnit=L,this.resetTextureUnits=te,this.setTexture2D=W,this.setTexture2DArray=Y,this.setTexture3D=q,this.setTextureCube=X,this.rebindTextures=Qe,this.setupRenderTarget=F,this.updateRenderTargetMipmap=Gt,this.updateMultisampleRenderTarget=Ee,this.setupDepthRenderbuffer=Ae,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=me}function Zm(i,e,t){const n=t.isWebGL2;function s(o,a=hn){let r;const c=ot.getTransfer(a);if(o===Xn)return i.UNSIGNED_BYTE;if(o===Wc)return i.UNSIGNED_SHORT_4_4_4_4;if(o===Xc)return i.UNSIGNED_SHORT_5_5_5_1;if(o===Dh)return i.BYTE;if(o===Ih)return i.SHORT;if(o===Nr)return i.UNSIGNED_SHORT;if(o===Vc)return i.INT;if(o===Hn)return i.UNSIGNED_INT;if(o===Gn)return i.FLOAT;if(o===us)return n?i.HALF_FLOAT:(r=e.get("OES_texture_half_float"),r!==null?r.HALF_FLOAT_OES:null);if(o===Uh)return i.ALPHA;if(o===xn)return i.RGBA;if(o===Nh)return i.LUMINANCE;if(o===Fh)return i.LUMINANCE_ALPHA;if(o===ai)return i.DEPTH_COMPONENT;if(o===Wi)return i.DEPTH_STENCIL;if(o===br)return r=e.get("EXT_sRGB"),r!==null?r.SRGB_ALPHA_EXT:null;if(o===Oh)return i.RED;if(o===qc)return i.RED_INTEGER;if(o===kh)return i.RG;if(o===Yc)return i.RG_INTEGER;if(o===$c)return i.RGBA_INTEGER;if(o===Ao||o===Ro||o===Co||o===Lo)if(c===lt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(o===Ao)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(o===Ro)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(o===Co)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(o===Lo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(o===Ao)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(o===Ro)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(o===Co)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(o===Lo)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(o===fa||o===pa||o===ma||o===ga)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(o===fa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(o===pa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(o===ma)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(o===ga)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(o===jc)return r=e.get("WEBGL_compressed_texture_etc1"),r!==null?r.COMPRESSED_RGB_ETC1_WEBGL:null;if(o===_a||o===xa)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(o===_a)return c===lt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(o===xa)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(o===va||o===Ma||o===Sa||o===ya||o===Ea||o===ba||o===wa||o===Ta||o===Aa||o===Ra||o===Ca||o===La||o===Pa||o===Da)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(o===va)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(o===Ma)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(o===Sa)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(o===ya)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(o===Ea)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(o===ba)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(o===wa)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(o===Ta)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(o===Aa)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(o===Ra)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(o===Ca)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(o===La)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(o===Pa)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(o===Da)return c===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(o===Po||o===Ia||o===Ua)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(o===Po)return c===lt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(o===Ia)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(o===Ua)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(o===zh||o===Na||o===Fa||o===Oa)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(o===Po)return r.COMPRESSED_RED_RGTC1_EXT;if(o===Na)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(o===Fa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(o===Oa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return o===ri?n?i.UNSIGNED_INT_24_8:(r=e.get("WEBGL_depth_texture"),r!==null?r.UNSIGNED_INT_24_8_WEBGL:null):i[o]!==void 0?i[o]:null}return{convert:s}}class Jm extends ln{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class ge extends Ft{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Qm={type:"move"};class nr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,o=null,a=null;const r=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,n),f=this._getHandJoint(l,x);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],u=h.position.distanceTo(d.position),p=.02,g=.005;l.inputState.pinching&&u>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,n),o!==null&&(c.matrix.fromArray(o.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,o.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(o.linearVelocity)):c.hasLinearVelocity=!1,o.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(o.angularVelocity)):c.hasAngularVelocity=!1));r!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&o!==null&&(s=o),s!==null&&(r.matrix.fromArray(s.transform.matrix),r.matrix.decompose(r.position,r.rotation,r.scale),r.matrixWorldNeedsUpdate=!0,s.linearVelocity?(r.hasLinearVelocity=!0,r.linearVelocity.copy(s.linearVelocity)):r.hasLinearVelocity=!1,s.angularVelocity?(r.hasAngularVelocity=!0,r.angularVelocity.copy(s.angularVelocity)):r.hasAngularVelocity=!1,this.dispatchEvent(Qm)))}return r!==null&&(r.visible=s!==null),c!==null&&(c.visible=o!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new ge;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class e0 extends $i{constructor(e,t){super();const n=this;let s=null,o=1,a=null,r="local-floor",c=1,l=null,h=null,d=null,u=null,p=null,g=null;const x=t.getContextAttributes();let m=null,f=null;const v=[],_=[],E=new je;let R=null;const T=new ln;T.layers.enable(1),T.viewport=new Lt;const A=new ln;A.layers.enable(2),A.viewport=new Lt;const I=[T,A],S=new Jm;S.layers.enable(1),S.layers.enable(2);let w=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let $=v[G];return $===void 0&&($=new nr,v[G]=$),$.getTargetRaySpace()},this.getControllerGrip=function(G){let $=v[G];return $===void 0&&($=new nr,v[G]=$),$.getGripSpace()},this.getHand=function(G){let $=v[G];return $===void 0&&($=new nr,v[G]=$),$.getHandSpace()};function V(G){const $=_.indexOf(G.inputSource);if($===-1)return;const he=v[$];he!==void 0&&(he.update(G.inputSource,G.frame,l||a),he.dispatchEvent({type:G.type,data:G.inputSource}))}function te(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",te),s.removeEventListener("inputsourceschange",L);for(let G=0;G<v.length;G++){const $=_[G];$!==null&&(_[G]=null,v[G].disconnect($))}w=null,U=null,e.setRenderTarget(m),p=null,u=null,d=null,s=null,f=null,ue.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){o=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){r=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(G){l=G},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(G){if(s=G,s!==null){if(m=e.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",te),s.addEventListener("inputsourceschange",L),x.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(E),s.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const $={antialias:s.renderState.layers===void 0?x.antialias:!0,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:o};p=new XRWebGLLayer(s,t,$),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new di(p.framebufferWidth,p.framebufferHeight,{format:xn,type:Xn,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil})}else{let $=null,he=null,Me=null;x.depth&&(Me=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,$=x.stencil?Wi:ai,he=x.stencil?ri:Hn);const ve={colorFormat:t.RGBA8,depthFormat:Me,scaleFactor:o};d=new XRWebGLBinding(s,t),u=d.createProjectionLayer(ve),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),f=new di(u.textureWidth,u.textureHeight,{format:xn,type:Xn,depthTexture:new ul(u.textureWidth,u.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,$),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0});const Ne=e.properties.get(f);Ne.__ignoreDepthValues=u.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(r),ue.setContext(s),ue.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function L(G){for(let $=0;$<G.removed.length;$++){const he=G.removed[$],Me=_.indexOf(he);Me>=0&&(_[Me]=null,v[Me].disconnect(he))}for(let $=0;$<G.added.length;$++){const he=G.added[$];let Me=_.indexOf(he);if(Me===-1){for(let Ne=0;Ne<v.length;Ne++)if(Ne>=_.length){_.push(he),Me=Ne;break}else if(_[Ne]===null){_[Ne]=he,Me=Ne;break}if(Me===-1)break}const ve=v[Me];ve&&ve.connect(he)}}const N=new P,W=new P;function Y(G,$,he){N.setFromMatrixPosition($.matrixWorld),W.setFromMatrixPosition(he.matrixWorld);const Me=N.distanceTo(W),ve=$.projectionMatrix.elements,Ne=he.projectionMatrix.elements,Oe=ve[14]/(ve[10]-1),Ae=ve[14]/(ve[10]+1),Qe=(ve[9]+1)/ve[5],F=(ve[9]-1)/ve[5],Gt=(ve[8]-1)/ve[0],Ee=(Ne[8]+1)/Ne[0],Ie=Oe*Gt,me=Oe*Ee,dt=Me/(-Gt+Ee),Ge=dt*-Gt;$.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(Ge),G.translateZ(dt),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();const b=Oe+dt,M=Ae+dt,k=Ie-Ge,J=me+(Me-Ge),K=Qe*Ae/M*b,Q=F*Ae/M*b;G.projectionMatrix.makePerspective(k,J,K,Q,b,M),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function q(G,$){$===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices($.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(s===null)return;S.near=A.near=T.near=G.near,S.far=A.far=T.far=G.far,(w!==S.near||U!==S.far)&&(s.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,U=S.far);const $=G.parent,he=S.cameras;q(S,$);for(let Me=0;Me<he.length;Me++)q(he[Me],$);he.length===2?Y(S,T,A):S.projectionMatrix.copy(T.projectionMatrix),X(G,S,$)};function X(G,$,he){he===null?G.matrix.copy($.matrixWorld):(G.matrix.copy(he.matrixWorld),G.matrix.invert(),G.matrix.multiply($.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy($.projectionMatrix),G.projectionMatrixInverse.copy($.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=wr*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(u===null&&p===null))return c},this.setFoveation=function(G){c=G,u!==null&&(u.fixedFoveation=G),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=G)};let Z=null;function ee(G,$){if(h=$.getViewerPose(l||a),g=$,h!==null){const he=h.views;p!==null&&(e.setRenderTargetFramebuffer(f,p.framebuffer),e.setRenderTarget(f));let Me=!1;he.length!==S.cameras.length&&(S.cameras.length=0,Me=!0);for(let ve=0;ve<he.length;ve++){const Ne=he[ve];let Oe=null;if(p!==null)Oe=p.getViewport(Ne);else{const Qe=d.getViewSubImage(u,Ne);Oe=Qe.viewport,ve===0&&(e.setRenderTargetTextures(f,Qe.colorTexture,u.ignoreDepthValues?void 0:Qe.depthStencilTexture),e.setRenderTarget(f))}let Ae=I[ve];Ae===void 0&&(Ae=new ln,Ae.layers.enable(ve),Ae.viewport=new Lt,I[ve]=Ae),Ae.matrix.fromArray(Ne.transform.matrix),Ae.matrix.decompose(Ae.position,Ae.quaternion,Ae.scale),Ae.projectionMatrix.fromArray(Ne.projectionMatrix),Ae.projectionMatrixInverse.copy(Ae.projectionMatrix).invert(),Ae.viewport.set(Oe.x,Oe.y,Oe.width,Oe.height),ve===0&&(S.matrix.copy(Ae.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),Me===!0&&S.cameras.push(Ae)}}for(let he=0;he<v.length;he++){const Me=_[he],ve=v[he];Me!==null&&ve!==void 0&&ve.update(Me,$,l||a)}Z&&Z(G,$),$.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:$}),g=null}const ue=new hl;ue.setAnimationLoop(ee),this.setAnimationLoop=function(G){Z=G},this.dispose=function(){}}}function t0(i,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,al(i)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function s(m,f,v,_,E){f.isMeshBasicMaterial||f.isMeshLambertMaterial?o(m,f):f.isMeshToonMaterial?(o(m,f),d(m,f)):f.isMeshPhongMaterial?(o(m,f),h(m,f)):f.isMeshStandardMaterial?(o(m,f),u(m,f),f.isMeshPhysicalMaterial&&p(m,f,E)):f.isMeshMatcapMaterial?(o(m,f),g(m,f)):f.isMeshDepthMaterial?o(m,f):f.isMeshDistanceMaterial?(o(m,f),x(m,f)):f.isMeshNormalMaterial?o(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&r(m,f)):f.isPointsMaterial?c(m,f,v,_):f.isSpriteMaterial?l(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function o(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Kt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Kt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const v=e.get(f).envMap;if(v&&(m.envMap.value=v,m.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const _=i._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*_,t(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function r(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function c(m,f,v,_){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*v,m.scale.value=_*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function l(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function d(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function u(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),e.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,v){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Kt&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function x(m,f){const v=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function n0(i,e,t,n){let s={},o={},a=[];const r=t.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function c(v,_){const E=_.program;n.uniformBlockBinding(v,E)}function l(v,_){let E=s[v.id];E===void 0&&(g(v),E=h(v),s[v.id]=E,v.addEventListener("dispose",m));const R=_.program;n.updateUBOMapping(v,R);const T=e.render.frame;o[v.id]!==T&&(u(v),o[v.id]=T)}function h(v){const _=d();v.__bindingPointIndex=_;const E=i.createBuffer(),R=v.__size,T=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,R,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,_,E),E}function d(){for(let v=0;v<r;v++)if(a.indexOf(v)===-1)return a.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){const _=s[v.id],E=v.uniforms,R=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,_);for(let T=0,A=E.length;T<A;T++){const I=Array.isArray(E[T])?E[T]:[E[T]];for(let S=0,w=I.length;S<w;S++){const U=I[S];if(p(U,T,S,R)===!0){const V=U.__offset,te=Array.isArray(U.value)?U.value:[U.value];let L=0;for(let N=0;N<te.length;N++){const W=te[N],Y=x(W);typeof W=="number"||typeof W=="boolean"?(U.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,V+L,U.__data)):W.isMatrix3?(U.__data[0]=W.elements[0],U.__data[1]=W.elements[1],U.__data[2]=W.elements[2],U.__data[3]=0,U.__data[4]=W.elements[3],U.__data[5]=W.elements[4],U.__data[6]=W.elements[5],U.__data[7]=0,U.__data[8]=W.elements[6],U.__data[9]=W.elements[7],U.__data[10]=W.elements[8],U.__data[11]=0):(W.toArray(U.__data,L),L+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,V,U.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(v,_,E,R){const T=v.value,A=_+"_"+E;if(R[A]===void 0)return typeof T=="number"||typeof T=="boolean"?R[A]=T:R[A]=T.clone(),!0;{const I=R[A];if(typeof T=="number"||typeof T=="boolean"){if(I!==T)return R[A]=T,!0}else if(I.equals(T)===!1)return I.copy(T),!0}return!1}function g(v){const _=v.uniforms;let E=0;const R=16;for(let A=0,I=_.length;A<I;A++){const S=Array.isArray(_[A])?_[A]:[_[A]];for(let w=0,U=S.length;w<U;w++){const V=S[w],te=Array.isArray(V.value)?V.value:[V.value];for(let L=0,N=te.length;L<N;L++){const W=te[L],Y=x(W),q=E%R;q!==0&&R-q<Y.boundary&&(E+=R-q),V.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=E,E+=Y.storage}}}const T=E%R;return T>0&&(E+=R-T),v.__size=E,v.__cache={},this}function x(v){const _={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(_.boundary=4,_.storage=4):v.isVector2?(_.boundary=8,_.storage=8):v.isVector3||v.isColor?(_.boundary=16,_.storage=12):v.isVector4?(_.boundary=16,_.storage=16):v.isMatrix3?(_.boundary=48,_.storage=48):v.isMatrix4?(_.boundary=64,_.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),_}function m(v){const _=v.target;_.removeEventListener("dispose",m);const E=a.indexOf(_.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(s[_.id]),delete s[_.id],delete o[_.id]}function f(){for(const v in s)i.deleteBuffer(s[v]);a=[],s={},o={}}return{bind:c,update:l,dispose:f}}class xl{constructor(e={}){const{canvas:t=Zh(),context:n=null,depth:s=!0,stencil:o=!0,alpha:a=!1,antialias:r=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=e;this.isWebGLRenderer=!0;let u;n!==null?u=n.getContextAttributes().alpha:u=a;const p=new Uint32Array(4),g=new Int32Array(4);let x=null,m=null;const f=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=It,this._useLegacyLights=!1,this.toneMapping=Wn,this.toneMappingExposure=1;const _=this;let E=!1,R=0,T=0,A=null,I=-1,S=null;const w=new Lt,U=new Lt;let V=null;const te=new Se(0);let L=0,N=t.width,W=t.height,Y=1,q=null,X=null;const Z=new Lt(0,0,N,W),ee=new Lt(0,0,N,W);let ue=!1;const G=new zr;let $=!1,he=!1,Me=null;const ve=new St,Ne=new je,Oe=new P,Ae={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Qe(){return A===null?Y:1}let F=n;function Gt(y,D){for(let z=0;z<y.length;z++){const B=y[z],O=t.getContext(B,D);if(O!==null)return O}return null}try{const y={alpha:!0,depth:s,stencil:o,antialias:r,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ir}`),t.addEventListener("webglcontextlost",ie,!1),t.addEventListener("webglcontextrestored",C,!1),t.addEventListener("webglcontextcreationerror",re,!1),F===null){const D=["webgl2","webgl","experimental-webgl"];if(_.isWebGL1Renderer===!0&&D.shift(),F=Gt(D,y),F===null)throw Gt(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let Ee,Ie,me,dt,Ge,b,M,k,J,K,Q,_e,ce,fe,Te,Ve,j,st,Ke,Pe,ye,pe,ke,it;function mt(){Ee=new up(F),Ie=new rp(F,Ee,e),Ee.init(Ie),pe=new Zm(F,Ee,Ie),me=new jm(F,Ee,Ie),dt=new mp(F),Ge=new Nm,b=new Km(F,Ee,me,Ge,Ie,pe,dt),M=new cp(_),k=new dp(_),J=new yd(F,Ie),ke=new sp(F,Ee,J,Ie),K=new fp(F,J,dt,ke),Q=new vp(F,K,J,dt),Ke=new xp(F,Ie,b),Ve=new ap(Ge),_e=new Um(_,M,k,Ee,Ie,ke,Ve),ce=new t0(_,Ge),fe=new Om,Te=new Vm(Ee,Ie),st=new ip(_,M,k,me,Q,u,c),j=new $m(_,Q,Ie),it=new n0(F,dt,Ie,me),Pe=new op(F,Ee,dt,Ie),ye=new pp(F,Ee,dt,Ie),dt.programs=_e.programs,_.capabilities=Ie,_.extensions=Ee,_.properties=Ge,_.renderLists=fe,_.shadowMap=j,_.state=me,_.info=dt}mt();const Xe=new e0(_,F);this.xr=Xe,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const y=Ee.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=Ee.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(y){y!==void 0&&(Y=y,this.setSize(N,W,!1))},this.getSize=function(y){return y.set(N,W)},this.setSize=function(y,D,z=!0){if(Xe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=y,W=D,t.width=Math.floor(y*Y),t.height=Math.floor(D*Y),z===!0&&(t.style.width=y+"px",t.style.height=D+"px"),this.setViewport(0,0,y,D)},this.getDrawingBufferSize=function(y){return y.set(N*Y,W*Y).floor()},this.setDrawingBufferSize=function(y,D,z){N=y,W=D,Y=z,t.width=Math.floor(y*z),t.height=Math.floor(D*z),this.setViewport(0,0,y,D)},this.getCurrentViewport=function(y){return y.copy(w)},this.getViewport=function(y){return y.copy(Z)},this.setViewport=function(y,D,z,B){y.isVector4?Z.set(y.x,y.y,y.z,y.w):Z.set(y,D,z,B),me.viewport(w.copy(Z).multiplyScalar(Y).floor())},this.getScissor=function(y){return y.copy(ee)},this.setScissor=function(y,D,z,B){y.isVector4?ee.set(y.x,y.y,y.z,y.w):ee.set(y,D,z,B),me.scissor(U.copy(ee).multiplyScalar(Y).floor())},this.getScissorTest=function(){return ue},this.setScissorTest=function(y){me.setScissorTest(ue=y)},this.setOpaqueSort=function(y){q=y},this.setTransparentSort=function(y){X=y},this.getClearColor=function(y){return y.copy(st.getClearColor())},this.setClearColor=function(){st.setClearColor.apply(st,arguments)},this.getClearAlpha=function(){return st.getClearAlpha()},this.setClearAlpha=function(){st.setClearAlpha.apply(st,arguments)},this.clear=function(y=!0,D=!0,z=!0){let B=0;if(y){let O=!1;if(A!==null){const de=A.texture.format;O=de===$c||de===Yc||de===qc}if(O){const de=A.texture.type,xe=de===Xn||de===Hn||de===Nr||de===ri||de===Wc||de===Xc,we=st.getClearColor(),Le=st.getClearAlpha(),We=we.r,Ue=we.g,Fe=we.b;xe?(p[0]=We,p[1]=Ue,p[2]=Fe,p[3]=Le,F.clearBufferuiv(F.COLOR,0,p)):(g[0]=We,g[1]=Ue,g[2]=Fe,g[3]=Le,F.clearBufferiv(F.COLOR,0,g))}else B|=F.COLOR_BUFFER_BIT}D&&(B|=F.DEPTH_BUFFER_BIT),z&&(B|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ie,!1),t.removeEventListener("webglcontextrestored",C,!1),t.removeEventListener("webglcontextcreationerror",re,!1),fe.dispose(),Te.dispose(),Ge.dispose(),M.dispose(),k.dispose(),Q.dispose(),ke.dispose(),it.dispose(),_e.dispose(),Xe.dispose(),Xe.removeEventListener("sessionstart",Vt),Xe.removeEventListener("sessionend",ct),Me&&(Me.dispose(),Me=null),Wt.stop()};function ie(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),E=!0}function C(){console.log("THREE.WebGLRenderer: Context Restored."),E=!1;const y=dt.autoReset,D=j.enabled,z=j.autoUpdate,B=j.needsUpdate,O=j.type;mt(),dt.autoReset=y,j.enabled=D,j.autoUpdate=z,j.needsUpdate=B,j.type=O}function re(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function ae(y){const D=y.target;D.removeEventListener("dispose",ae),Re(D)}function Re(y){be(y),Ge.remove(y)}function be(y){const D=Ge.get(y).programs;D!==void 0&&(D.forEach(function(z){_e.releaseProgram(z)}),y.isShaderMaterial&&_e.releaseShaderCache(y))}this.renderBufferDirect=function(y,D,z,B,O,de){D===null&&(D=Ae);const xe=O.isMesh&&O.matrixWorld.determinant()<0,we=Xl(y,D,z,B,O);me.setMaterial(B,xe);let Le=z.index,We=1;if(B.wireframe===!0){if(Le=K.getWireframeAttribute(z),Le===void 0)return;We=2}const Ue=z.drawRange,Fe=z.attributes.position;let _t=Ue.start*We,Qt=(Ue.start+Ue.count)*We;de!==null&&(_t=Math.max(_t,de.start*We),Qt=Math.min(Qt,(de.start+de.count)*We)),Le!==null?(_t=Math.max(_t,0),Qt=Math.min(Qt,Le.count)):Fe!=null&&(_t=Math.max(_t,0),Qt=Math.min(Qt,Fe.count));const wt=Qt-_t;if(wt<0||wt===1/0)return;ke.setup(O,B,we,z,Le);let bn,ut=Pe;if(Le!==null&&(bn=J.get(Le),ut=ye,ut.setIndex(bn)),O.isMesh)B.wireframe===!0?(me.setLineWidth(B.wireframeLinewidth*Qe()),ut.setMode(F.LINES)):ut.setMode(F.TRIANGLES);else if(O.isLine){let qe=B.linewidth;qe===void 0&&(qe=1),me.setLineWidth(qe*Qe()),O.isLineSegments?ut.setMode(F.LINES):O.isLineLoop?ut.setMode(F.LINE_LOOP):ut.setMode(F.LINE_STRIP)}else O.isPoints?ut.setMode(F.POINTS):O.isSprite&&ut.setMode(F.TRIANGLES);if(O.isBatchedMesh)ut.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else if(O.isInstancedMesh)ut.renderInstances(_t,wt,O.count);else if(z.isInstancedBufferGeometry){const qe=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,yo=Math.min(z.instanceCount,qe);ut.renderInstances(_t,wt,yo)}else ut.render(_t,wt)};function rt(y,D,z){y.transparent===!0&&y.side===jt&&y.forceSinglePass===!1?(y.side=Kt,y.needsUpdate=!0,ys(y,D,z),y.side=Yn,y.needsUpdate=!0,ys(y,D,z),y.side=jt):ys(y,D,z)}this.compile=function(y,D,z=null){z===null&&(z=y),m=Te.get(z),m.init(),v.push(m),z.traverseVisible(function(O){O.isLight&&O.layers.test(D.layers)&&(m.pushLight(O),O.castShadow&&m.pushShadow(O))}),y!==z&&y.traverseVisible(function(O){O.isLight&&O.layers.test(D.layers)&&(m.pushLight(O),O.castShadow&&m.pushShadow(O))}),m.setupLights(_._useLegacyLights);const B=new Set;return y.traverse(function(O){const de=O.material;if(de)if(Array.isArray(de))for(let xe=0;xe<de.length;xe++){const we=de[xe];rt(we,z,O),B.add(we)}else rt(de,z,O),B.add(de)}),v.pop(),m=null,B},this.compileAsync=function(y,D,z=null){const B=this.compile(y,D,z);return new Promise(O=>{function de(){if(B.forEach(function(xe){Ge.get(xe).currentProgram.isReady()&&B.delete(xe)}),B.size===0){O(y);return}setTimeout(de,10)}Ee.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let at=null;function bt(y){at&&at(y)}function Vt(){Wt.stop()}function ct(){Wt.start()}const Wt=new hl;Wt.setAnimationLoop(bt),typeof self<"u"&&Wt.setContext(self),this.setAnimationLoop=function(y){at=y,Xe.setAnimationLoop(y),y===null?Wt.stop():Wt.start()},Xe.addEventListener("sessionstart",Vt),Xe.addEventListener("sessionend",ct),this.render=function(y,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Xe.enabled===!0&&Xe.isPresenting===!0&&(Xe.cameraAutoUpdate===!0&&Xe.updateCamera(D),D=Xe.getCamera()),y.isScene===!0&&y.onBeforeRender(_,y,D,A),m=Te.get(y,v.length),m.init(),v.push(m),ve.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),G.setFromProjectionMatrix(ve),he=this.localClippingEnabled,$=Ve.init(this.clippingPlanes,he),x=fe.get(y,f.length),x.init(),f.push(x),Sn(y,D,0,_.sortObjects),x.finish(),_.sortObjects===!0&&x.sort(q,X),this.info.render.frame++,$===!0&&Ve.beginShadows();const z=m.state.shadowsArray;if(j.render(z,y,D),$===!0&&Ve.endShadows(),this.info.autoReset===!0&&this.info.reset(),st.render(x,y),m.setupLights(_._useLegacyLights),D.isArrayCamera){const B=D.cameras;for(let O=0,de=B.length;O<de;O++){const xe=B[O];Qr(x,y,xe,xe.viewport)}}else Qr(x,y,D);A!==null&&(b.updateMultisampleRenderTarget(A),b.updateRenderTargetMipmap(A)),y.isScene===!0&&y.onAfterRender(_,y,D),ke.resetDefaultState(),I=-1,S=null,v.pop(),v.length>0?m=v[v.length-1]:m=null,f.pop(),f.length>0?x=f[f.length-1]:x=null};function Sn(y,D,z,B){if(y.visible===!1)return;if(y.layers.test(D.layers)){if(y.isGroup)z=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(D);else if(y.isLight)m.pushLight(y),y.castShadow&&m.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||G.intersectsSprite(y)){B&&Oe.setFromMatrixPosition(y.matrixWorld).applyMatrix4(ve);const xe=Q.update(y),we=y.material;we.visible&&x.push(y,xe,we,z,Oe.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||G.intersectsObject(y))){const xe=Q.update(y),we=y.material;if(B&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),Oe.copy(y.boundingSphere.center)):(xe.boundingSphere===null&&xe.computeBoundingSphere(),Oe.copy(xe.boundingSphere.center)),Oe.applyMatrix4(y.matrixWorld).applyMatrix4(ve)),Array.isArray(we)){const Le=xe.groups;for(let We=0,Ue=Le.length;We<Ue;We++){const Fe=Le[We],_t=we[Fe.materialIndex];_t&&_t.visible&&x.push(y,xe,_t,z,Oe.z,Fe)}}else we.visible&&x.push(y,xe,we,z,Oe.z,null)}}const de=y.children;for(let xe=0,we=de.length;xe<we;xe++)Sn(de[xe],D,z,B)}function Qr(y,D,z,B){const O=y.opaque,de=y.transmissive,xe=y.transparent;m.setupLightsView(z),$===!0&&Ve.setGlobalState(_.clippingPlanes,z),de.length>0&&Wl(O,de,D,z),B&&me.viewport(w.copy(B)),O.length>0&&Ss(O,D,z),de.length>0&&Ss(de,D,z),xe.length>0&&Ss(xe,D,z),me.buffers.depth.setTest(!0),me.buffers.depth.setMask(!0),me.buffers.color.setMask(!0),me.setPolygonOffset(!1)}function Wl(y,D,z,B){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;const de=Ie.isWebGL2;Me===null&&(Me=new di(1,1,{generateMipmaps:!0,type:Ee.has("EXT_color_buffer_half_float")?us:Xn,minFilter:ds,samples:de?4:0})),_.getDrawingBufferSize(Ne),de?Me.setSize(Ne.x,Ne.y):Me.setSize(Tr(Ne.x),Tr(Ne.y));const xe=_.getRenderTarget();_.setRenderTarget(Me),_.getClearColor(te),L=_.getClearAlpha(),L<1&&_.setClearColor(16777215,.5),_.clear();const we=_.toneMapping;_.toneMapping=Wn,Ss(y,z,B),b.updateMultisampleRenderTarget(Me),b.updateRenderTargetMipmap(Me);let Le=!1;for(let We=0,Ue=D.length;We<Ue;We++){const Fe=D[We],_t=Fe.object,Qt=Fe.geometry,wt=Fe.material,bn=Fe.group;if(wt.side===jt&&_t.layers.test(B.layers)){const ut=wt.side;wt.side=Kt,wt.needsUpdate=!0,ea(_t,z,B,Qt,wt,bn),wt.side=ut,wt.needsUpdate=!0,Le=!0}}Le===!0&&(b.updateMultisampleRenderTarget(Me),b.updateRenderTargetMipmap(Me)),_.setRenderTarget(xe),_.setClearColor(te,L),_.toneMapping=we}function Ss(y,D,z){const B=D.isScene===!0?D.overrideMaterial:null;for(let O=0,de=y.length;O<de;O++){const xe=y[O],we=xe.object,Le=xe.geometry,We=B===null?xe.material:B,Ue=xe.group;we.layers.test(z.layers)&&ea(we,D,z,Le,We,Ue)}}function ea(y,D,z,B,O,de){y.onBeforeRender(_,D,z,B,O,de),y.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),O.onBeforeRender(_,D,z,B,y,de),O.transparent===!0&&O.side===jt&&O.forceSinglePass===!1?(O.side=Kt,O.needsUpdate=!0,_.renderBufferDirect(z,D,B,O,y,de),O.side=Yn,O.needsUpdate=!0,_.renderBufferDirect(z,D,B,O,y,de),O.side=jt):_.renderBufferDirect(z,D,B,O,y,de),y.onAfterRender(_,D,z,B,O,de)}function ys(y,D,z){D.isScene!==!0&&(D=Ae);const B=Ge.get(y),O=m.state.lights,de=m.state.shadowsArray,xe=O.state.version,we=_e.getParameters(y,O.state,de,D,z),Le=_e.getProgramCacheKey(we);let We=B.programs;B.environment=y.isMeshStandardMaterial?D.environment:null,B.fog=D.fog,B.envMap=(y.isMeshStandardMaterial?k:M).get(y.envMap||B.environment),We===void 0&&(y.addEventListener("dispose",ae),We=new Map,B.programs=We);let Ue=We.get(Le);if(Ue!==void 0){if(B.currentProgram===Ue&&B.lightsStateVersion===xe)return na(y,we),Ue}else we.uniforms=_e.getUniforms(y),y.onBuild(z,we,_),y.onBeforeCompile(we,_),Ue=_e.acquireProgram(we,Le),We.set(Le,Ue),B.uniforms=we.uniforms;const Fe=B.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Fe.clippingPlanes=Ve.uniform),na(y,we),B.needsLights=Yl(y),B.lightsStateVersion=xe,B.needsLights&&(Fe.ambientLightColor.value=O.state.ambient,Fe.lightProbe.value=O.state.probe,Fe.directionalLights.value=O.state.directional,Fe.directionalLightShadows.value=O.state.directionalShadow,Fe.spotLights.value=O.state.spot,Fe.spotLightShadows.value=O.state.spotShadow,Fe.rectAreaLights.value=O.state.rectArea,Fe.ltc_1.value=O.state.rectAreaLTC1,Fe.ltc_2.value=O.state.rectAreaLTC2,Fe.pointLights.value=O.state.point,Fe.pointLightShadows.value=O.state.pointShadow,Fe.hemisphereLights.value=O.state.hemi,Fe.directionalShadowMap.value=O.state.directionalShadowMap,Fe.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Fe.spotShadowMap.value=O.state.spotShadowMap,Fe.spotLightMatrix.value=O.state.spotLightMatrix,Fe.spotLightMap.value=O.state.spotLightMap,Fe.pointShadowMap.value=O.state.pointShadowMap,Fe.pointShadowMatrix.value=O.state.pointShadowMatrix),B.currentProgram=Ue,B.uniformsList=null,Ue}function ta(y){if(y.uniformsList===null){const D=y.currentProgram.getUniforms();y.uniformsList=Ys.seqWithValue(D.seq,y.uniforms)}return y.uniformsList}function na(y,D){const z=Ge.get(y);z.outputColorSpace=D.outputColorSpace,z.batching=D.batching,z.instancing=D.instancing,z.instancingColor=D.instancingColor,z.skinning=D.skinning,z.morphTargets=D.morphTargets,z.morphNormals=D.morphNormals,z.morphColors=D.morphColors,z.morphTargetsCount=D.morphTargetsCount,z.numClippingPlanes=D.numClippingPlanes,z.numIntersection=D.numClipIntersection,z.vertexAlphas=D.vertexAlphas,z.vertexTangents=D.vertexTangents,z.toneMapping=D.toneMapping}function Xl(y,D,z,B,O){D.isScene!==!0&&(D=Ae),b.resetTextureUnits();const de=D.fog,xe=B.isMeshStandardMaterial?D.environment:null,we=A===null?_.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Dn,Le=(B.isMeshStandardMaterial?k:M).get(B.envMap||xe),We=B.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,Ue=!!z.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Fe=!!z.morphAttributes.position,_t=!!z.morphAttributes.normal,Qt=!!z.morphAttributes.color;let wt=Wn;B.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(wt=_.toneMapping);const bn=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ut=bn!==void 0?bn.length:0,qe=Ge.get(B),yo=m.state.lights;if($===!0&&(he===!0||y!==S)){const on=y===S&&B.id===I;Ve.setState(B,y,on)}let gt=!1;B.version===qe.__version?(qe.needsLights&&qe.lightsStateVersion!==yo.state.version||qe.outputColorSpace!==we||O.isBatchedMesh&&qe.batching===!1||!O.isBatchedMesh&&qe.batching===!0||O.isInstancedMesh&&qe.instancing===!1||!O.isInstancedMesh&&qe.instancing===!0||O.isSkinnedMesh&&qe.skinning===!1||!O.isSkinnedMesh&&qe.skinning===!0||O.isInstancedMesh&&qe.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&qe.instancingColor===!1&&O.instanceColor!==null||qe.envMap!==Le||B.fog===!0&&qe.fog!==de||qe.numClippingPlanes!==void 0&&(qe.numClippingPlanes!==Ve.numPlanes||qe.numIntersection!==Ve.numIntersection)||qe.vertexAlphas!==We||qe.vertexTangents!==Ue||qe.morphTargets!==Fe||qe.morphNormals!==_t||qe.morphColors!==Qt||qe.toneMapping!==wt||Ie.isWebGL2===!0&&qe.morphTargetsCount!==ut)&&(gt=!0):(gt=!0,qe.__version=B.version);let jn=qe.currentProgram;gt===!0&&(jn=ys(B,D,O));let ia=!1,Zi=!1,Eo=!1;const kt=jn.getUniforms(),Kn=qe.uniforms;if(me.useProgram(jn.program)&&(ia=!0,Zi=!0,Eo=!0),B.id!==I&&(I=B.id,Zi=!0),ia||S!==y){kt.setValue(F,"projectionMatrix",y.projectionMatrix),kt.setValue(F,"viewMatrix",y.matrixWorldInverse);const on=kt.map.cameraPosition;on!==void 0&&on.setValue(F,Oe.setFromMatrixPosition(y.matrixWorld)),Ie.logarithmicDepthBuffer&&kt.setValue(F,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&kt.setValue(F,"isOrthographic",y.isOrthographicCamera===!0),S!==y&&(S=y,Zi=!0,Eo=!0)}if(O.isSkinnedMesh){kt.setOptional(F,O,"bindMatrix"),kt.setOptional(F,O,"bindMatrixInverse");const on=O.skeleton;on&&(Ie.floatVertexTextures?(on.boneTexture===null&&on.computeBoneTexture(),kt.setValue(F,"boneTexture",on.boneTexture,b)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}O.isBatchedMesh&&(kt.setOptional(F,O,"batchingTexture"),kt.setValue(F,"batchingTexture",O._matricesTexture,b));const bo=z.morphAttributes;if((bo.position!==void 0||bo.normal!==void 0||bo.color!==void 0&&Ie.isWebGL2===!0)&&Ke.update(O,z,jn),(Zi||qe.receiveShadow!==O.receiveShadow)&&(qe.receiveShadow=O.receiveShadow,kt.setValue(F,"receiveShadow",O.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(Kn.envMap.value=Le,Kn.flipEnvMap.value=Le.isCubeTexture&&Le.isRenderTargetTexture===!1?-1:1),Zi&&(kt.setValue(F,"toneMappingExposure",_.toneMappingExposure),qe.needsLights&&ql(Kn,Eo),de&&B.fog===!0&&ce.refreshFogUniforms(Kn,de),ce.refreshMaterialUniforms(Kn,B,Y,W,Me),Ys.upload(F,ta(qe),Kn,b)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Ys.upload(F,ta(qe),Kn,b),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&kt.setValue(F,"center",O.center),kt.setValue(F,"modelViewMatrix",O.modelViewMatrix),kt.setValue(F,"normalMatrix",O.normalMatrix),kt.setValue(F,"modelMatrix",O.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const on=B.uniformsGroups;for(let wo=0,$l=on.length;wo<$l;wo++)if(Ie.isWebGL2){const sa=on[wo];it.update(sa,jn),it.bind(sa,jn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return jn}function ql(y,D){y.ambientLightColor.needsUpdate=D,y.lightProbe.needsUpdate=D,y.directionalLights.needsUpdate=D,y.directionalLightShadows.needsUpdate=D,y.pointLights.needsUpdate=D,y.pointLightShadows.needsUpdate=D,y.spotLights.needsUpdate=D,y.spotLightShadows.needsUpdate=D,y.rectAreaLights.needsUpdate=D,y.hemisphereLights.needsUpdate=D}function Yl(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(y,D,z){Ge.get(y.texture).__webglTexture=D,Ge.get(y.depthTexture).__webglTexture=z;const B=Ge.get(y);B.__hasExternalTextures=!0,B.__hasExternalTextures&&(B.__autoAllocateDepthBuffer=z===void 0,B.__autoAllocateDepthBuffer||Ee.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(y,D){const z=Ge.get(y);z.__webglFramebuffer=D,z.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(y,D=0,z=0){A=y,R=D,T=z;let B=!0,O=null,de=!1,xe=!1;if(y){const Le=Ge.get(y);Le.__useDefaultFramebuffer!==void 0?(me.bindFramebuffer(F.FRAMEBUFFER,null),B=!1):Le.__webglFramebuffer===void 0?b.setupRenderTarget(y):Le.__hasExternalTextures&&b.rebindTextures(y,Ge.get(y.texture).__webglTexture,Ge.get(y.depthTexture).__webglTexture);const We=y.texture;(We.isData3DTexture||We.isDataArrayTexture||We.isCompressedArrayTexture)&&(xe=!0);const Ue=Ge.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Ue[D])?O=Ue[D][z]:O=Ue[D],de=!0):Ie.isWebGL2&&y.samples>0&&b.useMultisampledRTT(y)===!1?O=Ge.get(y).__webglMultisampledFramebuffer:Array.isArray(Ue)?O=Ue[z]:O=Ue,w.copy(y.viewport),U.copy(y.scissor),V=y.scissorTest}else w.copy(Z).multiplyScalar(Y).floor(),U.copy(ee).multiplyScalar(Y).floor(),V=ue;if(me.bindFramebuffer(F.FRAMEBUFFER,O)&&Ie.drawBuffers&&B&&me.drawBuffers(y,O),me.viewport(w),me.scissor(U),me.setScissorTest(V),de){const Le=Ge.get(y.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+D,Le.__webglTexture,z)}else if(xe){const Le=Ge.get(y.texture),We=D||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,Le.__webglTexture,z||0,We)}I=-1},this.readRenderTargetPixels=function(y,D,z,B,O,de,xe){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=Ge.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&xe!==void 0&&(we=we[xe]),we){me.bindFramebuffer(F.FRAMEBUFFER,we);try{const Le=y.texture,We=Le.format,Ue=Le.type;if(We!==xn&&pe.convert(We)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Fe=Ue===us&&(Ee.has("EXT_color_buffer_half_float")||Ie.isWebGL2&&Ee.has("EXT_color_buffer_float"));if(Ue!==Xn&&pe.convert(Ue)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ue===Gn&&(Ie.isWebGL2||Ee.has("OES_texture_float")||Ee.has("WEBGL_color_buffer_float")))&&!Fe){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=y.width-B&&z>=0&&z<=y.height-O&&F.readPixels(D,z,B,O,pe.convert(We),pe.convert(Ue),de)}finally{const Le=A!==null?Ge.get(A).__webglFramebuffer:null;me.bindFramebuffer(F.FRAMEBUFFER,Le)}}},this.copyFramebufferToTexture=function(y,D,z=0){const B=Math.pow(2,-z),O=Math.floor(D.image.width*B),de=Math.floor(D.image.height*B);b.setTexture2D(D,0),F.copyTexSubImage2D(F.TEXTURE_2D,z,0,0,y.x,y.y,O,de),me.unbindTexture()},this.copyTextureToTexture=function(y,D,z,B=0){const O=D.image.width,de=D.image.height,xe=pe.convert(z.format),we=pe.convert(z.type);b.setTexture2D(z,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,z.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,z.unpackAlignment),D.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,B,y.x,y.y,O,de,xe,we,D.image.data):D.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,B,y.x,y.y,D.mipmaps[0].width,D.mipmaps[0].height,xe,D.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,B,y.x,y.y,xe,we,D.image),B===0&&z.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),me.unbindTexture()},this.copyTextureToTexture3D=function(y,D,z,B,O=0){if(_.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const de=y.max.x-y.min.x+1,xe=y.max.y-y.min.y+1,we=y.max.z-y.min.z+1,Le=pe.convert(B.format),We=pe.convert(B.type);let Ue;if(B.isData3DTexture)b.setTexture3D(B,0),Ue=F.TEXTURE_3D;else if(B.isDataArrayTexture||B.isCompressedArrayTexture)b.setTexture2DArray(B,0),Ue=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,B.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,B.unpackAlignment);const Fe=F.getParameter(F.UNPACK_ROW_LENGTH),_t=F.getParameter(F.UNPACK_IMAGE_HEIGHT),Qt=F.getParameter(F.UNPACK_SKIP_PIXELS),wt=F.getParameter(F.UNPACK_SKIP_ROWS),bn=F.getParameter(F.UNPACK_SKIP_IMAGES),ut=z.isCompressedTexture?z.mipmaps[O]:z.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,ut.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ut.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,y.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,y.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,y.min.z),z.isDataTexture||z.isData3DTexture?F.texSubImage3D(Ue,O,D.x,D.y,D.z,de,xe,we,Le,We,ut.data):z.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Ue,O,D.x,D.y,D.z,de,xe,we,Le,ut.data)):F.texSubImage3D(Ue,O,D.x,D.y,D.z,de,xe,we,Le,We,ut),F.pixelStorei(F.UNPACK_ROW_LENGTH,Fe),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,_t),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Qt),F.pixelStorei(F.UNPACK_SKIP_ROWS,wt),F.pixelStorei(F.UNPACK_SKIP_IMAGES,bn),O===0&&B.generateMipmaps&&F.generateMipmap(Ue),me.unbindTexture()},this.initTexture=function(y){y.isCubeTexture?b.setTextureCube(y,0):y.isData3DTexture?b.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?b.setTexture2DArray(y,0):b.setTexture2D(y,0),me.unbindTexture()},this.resetState=function(){R=0,T=0,A=null,me.reset(),ke.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Fr?"display-p3":"srgb",t.unpackColorSpace=ot.workingColorSpace===ho?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===It?ci:Kc}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===ci?It:Dn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class i0 extends xl{}i0.prototype.isWebGL1Renderer=!0;class Hr{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Se(e),this.near=t,this.far=n}clone(){return new Hr(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class s0 extends Ft{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class ls extends Jt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);const o=[],a=[],r=[],c=[],l=new P,h=new je;a.push(0,0,0),r.push(0,0,1),c.push(.5,.5);for(let d=0,u=3;d<=t;d++,u+=3){const p=n+d/t*s;l.x=e*Math.cos(p),l.y=e*Math.sin(p),a.push(l.x,l.y,l.z),r.push(0,0,1),h.x=(a[u]/e+1)/2,h.y=(a[u+1]/e+1)/2,c.push(h.x,h.y)}for(let d=1;d<=t;d++)o.push(d,d+1,0);this.setIndex(o),this.setAttribute("position",new ht(a,3)),this.setAttribute("normal",new ht(r,3)),this.setAttribute("uv",new ht(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ls(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class vs extends Jt{constructor(e=1,t=1,n=1,s=32,o=1,a=!1,r=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:o,openEnded:a,thetaStart:r,thetaLength:c};const l=this;s=Math.floor(s),o=Math.floor(o);const h=[],d=[],u=[],p=[];let g=0;const x=[],m=n/2;let f=0;v(),a===!1&&(e>0&&_(!0),t>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new ht(d,3)),this.setAttribute("normal",new ht(u,3)),this.setAttribute("uv",new ht(p,2));function v(){const E=new P,R=new P;let T=0;const A=(t-e)/n;for(let I=0;I<=o;I++){const S=[],w=I/o,U=w*(t-e)+e;for(let V=0;V<=s;V++){const te=V/s,L=te*c+r,N=Math.sin(L),W=Math.cos(L);R.x=U*N,R.y=-w*n+m,R.z=U*W,d.push(R.x,R.y,R.z),E.set(N,A,W).normalize(),u.push(E.x,E.y,E.z),p.push(te,1-w),S.push(g++)}x.push(S)}for(let I=0;I<s;I++)for(let S=0;S<o;S++){const w=x[S][I],U=x[S+1][I],V=x[S+1][I+1],te=x[S][I+1];h.push(w,U,te),h.push(U,V,te),T+=6}l.addGroup(f,T,0),f+=T}function _(E){const R=g,T=new je,A=new P;let I=0;const S=E===!0?e:t,w=E===!0?1:-1;for(let V=1;V<=s;V++)d.push(0,m*w,0),u.push(0,w,0),p.push(.5,.5),g++;const U=g;for(let V=0;V<=s;V++){const L=V/s*c+r,N=Math.cos(L),W=Math.sin(L);A.x=S*W,A.y=m*w,A.z=S*N,d.push(A.x,A.y,A.z),u.push(0,w,0),T.x=N*.5+.5,T.y=W*.5*w+.5,p.push(T.x,T.y),g++}for(let V=0;V<s;V++){const te=R+V,L=U+V;E===!0?h.push(L,L+1,te):h.push(L+1,L,te),I+=3}l.addGroup(f,I,E===!0?1:2),f+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new vs(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Ms extends vs{constructor(e=1,t=1,n=32,s=1,o=!1,a=0,r=Math.PI*2){super(0,e,t,n,s,o,a,r),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:r}}static fromJSON(e){return new Ms(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Gr extends Jt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};const o=[],a=[];r(s),l(n),h(),this.setAttribute("position",new ht(o,3)),this.setAttribute("normal",new ht(o.slice(),3)),this.setAttribute("uv",new ht(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function r(v){const _=new P,E=new P,R=new P;for(let T=0;T<t.length;T+=3)p(t[T+0],_),p(t[T+1],E),p(t[T+2],R),c(_,E,R,v)}function c(v,_,E,R){const T=R+1,A=[];for(let I=0;I<=T;I++){A[I]=[];const S=v.clone().lerp(E,I/T),w=_.clone().lerp(E,I/T),U=T-I;for(let V=0;V<=U;V++)V===0&&I===T?A[I][V]=S:A[I][V]=S.clone().lerp(w,V/U)}for(let I=0;I<T;I++)for(let S=0;S<2*(T-I)-1;S++){const w=Math.floor(S/2);S%2===0?(u(A[I][w+1]),u(A[I+1][w]),u(A[I][w])):(u(A[I][w+1]),u(A[I+1][w+1]),u(A[I+1][w]))}}function l(v){const _=new P;for(let E=0;E<o.length;E+=3)_.x=o[E+0],_.y=o[E+1],_.z=o[E+2],_.normalize().multiplyScalar(v),o[E+0]=_.x,o[E+1]=_.y,o[E+2]=_.z}function h(){const v=new P;for(let _=0;_<o.length;_+=3){v.x=o[_+0],v.y=o[_+1],v.z=o[_+2];const E=m(v)/2/Math.PI+.5,R=f(v)/Math.PI+.5;a.push(E,1-R)}g(),d()}function d(){for(let v=0;v<a.length;v+=6){const _=a[v+0],E=a[v+2],R=a[v+4],T=Math.max(_,E,R),A=Math.min(_,E,R);T>.9&&A<.1&&(_<.2&&(a[v+0]+=1),E<.2&&(a[v+2]+=1),R<.2&&(a[v+4]+=1))}}function u(v){o.push(v.x,v.y,v.z)}function p(v,_){const E=v*3;_.x=e[E+0],_.y=e[E+1],_.z=e[E+2]}function g(){const v=new P,_=new P,E=new P,R=new P,T=new je,A=new je,I=new je;for(let S=0,w=0;S<o.length;S+=9,w+=6){v.set(o[S+0],o[S+1],o[S+2]),_.set(o[S+3],o[S+4],o[S+5]),E.set(o[S+6],o[S+7],o[S+8]),T.set(a[w+0],a[w+1]),A.set(a[w+2],a[w+3]),I.set(a[w+4],a[w+5]),R.copy(v).add(_).add(E).divideScalar(3);const U=m(R);x(T,w+0,v,U),x(A,w+2,_,U),x(I,w+4,E,U)}}function x(v,_,E,R){R<0&&v.x===1&&(a[_]=v.x-1),E.x===0&&E.z===0&&(a[_]=R/2/Math.PI+.5)}function m(v){return Math.atan2(v.z,-v.x)}function f(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Gr(e.vertices,e.indices,e.radius,e.details)}}class Yi extends Gr{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,s=1/n,o=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(o,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Yi(e.radius,e.detail)}}class fs extends Jt{constructor(e=.5,t=1,n=32,s=1,o=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:s,thetaStart:o,thetaLength:a},n=Math.max(3,n),s=Math.max(1,s);const r=[],c=[],l=[],h=[];let d=e;const u=(t-e)/s,p=new P,g=new je;for(let x=0;x<=s;x++){for(let m=0;m<=n;m++){const f=o+m/n*a;p.x=d*Math.cos(f),p.y=d*Math.sin(f),c.push(p.x,p.y,p.z),l.push(0,0,1),g.x=(p.x/t+1)/2,g.y=(p.y/t+1)/2,h.push(g.x,g.y)}d+=u}for(let x=0;x<s;x++){const m=x*(n+1);for(let f=0;f<n;f++){const v=f+m,_=v,E=v+n+1,R=v+n+2,T=v+1;r.push(_,E,T),r.push(E,R,T)}}this.setIndex(r),this.setAttribute("position",new ht(c,3)),this.setAttribute("normal",new ht(l,3)),this.setAttribute("uv",new ht(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fs(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class mi extends Jt{constructor(e=1,t=32,n=16,s=0,o=Math.PI*2,a=0,r=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:o,thetaStart:a,thetaLength:r},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const c=Math.min(a+r,Math.PI);let l=0;const h=[],d=new P,u=new P,p=[],g=[],x=[],m=[];for(let f=0;f<=n;f++){const v=[],_=f/n;let E=0;f===0&&a===0?E=.5/t:f===n&&c===Math.PI&&(E=-.5/t);for(let R=0;R<=t;R++){const T=R/t;d.x=-e*Math.cos(s+T*o)*Math.sin(a+_*r),d.y=e*Math.cos(a+_*r),d.z=e*Math.sin(s+T*o)*Math.sin(a+_*r),g.push(d.x,d.y,d.z),u.copy(d).normalize(),x.push(u.x,u.y,u.z),m.push(T+E,1-_),v.push(l++)}h.push(v)}for(let f=0;f<n;f++)for(let v=0;v<t;v++){const _=h[f][v+1],E=h[f][v],R=h[f+1][v],T=h[f+1][v+1];(f!==0||a>0)&&p.push(_,E,T),(f!==n-1||c<Math.PI)&&p.push(E,R,T)}this.setIndex(p),this.setAttribute("position",new ht(g,3)),this.setAttribute("normal",new ht(x,3)),this.setAttribute("uv",new ht(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new mi(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class po extends Jt{constructor(e=1,t=.4,n=12,s=48,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:o},n=Math.floor(n),s=Math.floor(s);const a=[],r=[],c=[],l=[],h=new P,d=new P,u=new P;for(let p=0;p<=n;p++)for(let g=0;g<=s;g++){const x=g/s*o,m=p/n*Math.PI*2;d.x=(e+t*Math.cos(m))*Math.cos(x),d.y=(e+t*Math.cos(m))*Math.sin(x),d.z=t*Math.sin(m),r.push(d.x,d.y,d.z),h.x=e*Math.cos(x),h.y=e*Math.sin(x),u.subVectors(d,h).normalize(),c.push(u.x,u.y,u.z),l.push(g/s),l.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=s;g++){const x=(s+1)*p+g-1,m=(s+1)*(p-1)+g-1,f=(s+1)*(p-1)+g,v=(s+1)*p+g;a.push(x,m,v),a.push(m,f,v)}this.setIndex(a),this.setAttribute("position",new ht(r,3)),this.setAttribute("normal",new ht(c,3)),this.setAttribute("uv",new ht(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new po(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class Ut extends xs{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Se(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Se(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zc,this.normalScale=new je(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ur,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class vl extends Ft{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Se(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class o0 extends vl{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ft.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Se(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const ir=new St,Tc=new P,Ac=new P;class r0{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new je(512,512),this.map=null,this.mapPass=null,this.matrix=new St,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new zr,this._frameExtents=new je(1,1),this._viewportCount=1,this._viewports=[new Lt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Tc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Tc),Ac.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ac),t.updateMatrixWorld(),ir.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ir),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ir)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class a0 extends r0{constructor(){super(new dl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class c0 extends vl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ft.DEFAULT_UP),this.updateMatrix(),this.target=new Ft,this.shadow=new a0}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class l0{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Rc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Rc();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Rc(){return(typeof performance>"u"?Date:performance).now()}class h0{constructor(e,t,n=0,s=1/0){this.ray=new il(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new kr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return Rr(e,this,n,t),n.sort(Cc),n}intersectObjects(e,t=!0,n=[]){for(let s=0,o=e.length;s<o;s++)Rr(e[s],this,n,t);return n.sort(Cc),n}}function Cc(i,e){return i.distance-e.distance}function Rr(i,e,t,n){if(i.layers.test(e.layers)&&i.raycast(e,t),n===!0){const s=i.children;for(let o=0,a=s.length;o<a;o++)Rr(s[o],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ir}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ir);const Be={radius:5500,goalR:5400,caveR:9},Ct=(i,e)=>Math.hypot(i,e),Nt=[{name:"Verdant Forest",rMax:550,ground:5603388,ground2:6721863,dirt:9071426,fog:13163694,sky:11456488,foliage:[2976301,3964727,5017407],trunk:7031341,trees:{pine:.4,leafy:.4,birch:.2,dead:0},snowy:!1,grass:7315532,flowers:!0,mushrooms:!1,enemies:["rabbit","rat","spider","snake"],packs:null,treeDensity:1},{name:"Dark Forest",rMax:1200,ground:4021295,ground2:3362858,dirt:6048304,fog:9677190,sky:9414840,foliage:[1985058,2577706,1720110],trunk:4994336,trees:{pine:.55,leafy:.25,birch:0,dead:.2},snowy:!1,grass:4482618,flowers:!1,mushrooms:!0,enemies:["spider","snake","wolf","venomspider","bat"],packs:{skulls:[.8,.2,0]},treeDensity:1.3},{name:"Haunted Forest",rMax:2e3,ground:4279096,ground2:3752751,dirt:5524050,fog:9078432,sky:10130096,foliage:[2767400,1977888,3814472],trunk:3813936,trees:{pine:.3,leafy:.1,birch:0,dead:.6},snowy:!1,grass:6055504,flowers:!1,mushrooms:!0,enemies:["zombie","bat","venomspider","wolf"],packs:{skulls:[.6,.3,.1]},treeDensity:1.1},{name:"Murky Swamp",rMax:2900,ground:4872762,ground2:4214842,dirt:4016698,fog:10727574,sky:11056288,foliage:[3824176,3033642,4875320],trunk:4536872,trees:{pine:.2,leafy:.5,birch:0,dead:.3},snowy:!1,grass:6320202,flowers:!1,mushrooms:!0,enemies:["snake","venomspider","stormsnake","boar"],packs:{skulls:[.5,.4,.1]},treeDensity:.9},{name:"Highlands",rMax:3800,ground:8026709,ground2:9143390,dirt:9929050,fog:12171682,sky:10335428,foliage:[6057523,7175482,5135916],trunk:6048307,trees:{pine:.5,leafy:.1,birch:.1,dead:.3},snowy:!1,grass:9408608,flowers:!1,mushrooms:!1,enemies:["wolf","boar","elk","venomspider","stormsnake"],packs:{skulls:[.4,.4,.2]},treeDensity:.7},{name:"Snowfall Woods",rMax:4700,ground:14673900,ground2:13688036,dirt:11846865,fog:15134194,sky:13228516,foliage:[4022613,4877920,3495499],trunk:4864560,trees:{pine:.8,leafy:0,birch:0,dead:.2},snowy:!0,grass:12767964,flowers:!1,mushrooms:!1,enemies:["icewolf","icespider","bear","stormsnake"],packs:{skulls:[.3,.5,.2]},treeDensity:.85},{name:"Frozen Peak",rMax:99999,ground:15922938,ground2:15002867,dirt:13227745,fog:16054524,sky:14674418,foliage:[9416896,4022613,13623272],trunk:4010537,trees:{pine:.7,leafy:0,birch:0,dead:.3},snowy:!0,grass:14542830,flowers:!1,mushrooms:!1,enemies:["icewolf","wendigo","yeti","icegolem"],packs:{skulls:[0,.5,.5]},treeDensity:.5}];function mo(i,e){const t=Ct(i,e);for(let n=0;n<Nt.length;n++)if(t<=Nt[n].rMax)return n;return Nt.length-1}function ps(i,e){return Nt[mo(i,e)]}function os(i,e){return Math.min(1,Ct(i,e)/Be.goalR)}const $s=["meat","wood","stone","hide","iron"],d0={meat:"🍖",wood:"🪵",stone:"🪨",hide:"🟫",iron:"🔩"},Lc=.1,Dt=i=>Math.round((Number(i)||0)/Lc)*Lc,Rt=i=>Dt(i).toFixed(1),u0=new Set(["wolf","boar","elk","bear","icewolf","wendigo","yeti"]),f0=i=>Math.max(1,Math.round(i/80)),p0=.1,go={rabbit:{name:"Rabbit",icon:"🐇",hp:1,dmg:0,speed:8.8,range:0,attackCd:1,xp:1,meat:1,hitR:.35,aggro:0,passive:!0},rat:{name:"Giant Rat",icon:"🐀",hp:12,dmg:4,speed:7.2,range:1.2,attackCd:.9,xp:5,meat:1,hitR:.5,aggro:22},spider:{name:"Forest Spider",icon:"🕷️",hp:20,dmg:6,speed:6,range:1.3,attackCd:1,xp:8,meat:1,hitR:.7,aggro:22},snake:{name:"Grass Snake",icon:"🐍",hp:16,dmg:8,speed:6.8,range:1.5,attackCd:1.3,xp:10,meat:1,hitR:.6,aggro:20},wolf:{name:"Black Wolf",icon:"🐺",hp:45,dmg:10,speed:8,range:1.6,attackCd:1,xp:15,meat:2,hitR:.8,aggro:26},venomspider:{name:"Venom Spider",icon:"☣️",hp:55,dmg:11,meleeDmg:7,speed:6,range:1.4,attackCd:1.1,xp:20,meat:2,hitR:.8,aggro:30,ranged:!0,shootRange:12,spellCd:2.5,projectileSpeed:15,shotColor:9109306},bat:{name:"Cave Bat",icon:"🦇",hp:18,dmg:6,speed:9.5,range:1.4,attackCd:1.1,xp:12,meat:1,hitR:.6,aggro:30,flying:!0},zombie:{name:"Zombie",icon:"🧟",hp:90,dmg:14,speed:4.6,range:1.7,attackCd:1.3,xp:28,meat:2,hitR:.85,aggro:32},boar:{name:"Wild Boar",icon:"🐗",hp:80,dmg:16,speed:7.5,range:1.7,attackCd:1.1,xp:25,meat:3,hitR:.9,aggro:24},elk:{name:"Mad Elk",icon:"🦌",hp:110,dmg:20,speed:7.2,range:1.9,attackCd:1.4,xp:32,meat:4,hitR:1,aggro:24},stormsnake:{name:"Storm Serpent",icon:"⚡",hp:70,dmg:8,meleeDmg:9,speed:7,range:1.5,attackCd:1.2,xp:28,meat:3,hitR:.6,aggro:30,ranged:!0,shootRange:14,spellCd:3,projectileSpeed:30,shotColor:16771402,stun:1.2},icewolf:{name:"Ice Wolf",icon:"❄️",hp:120,dmg:18,speed:8.6,range:1.6,attackCd:.9,xp:35,meat:4,hitR:.8,aggro:28},icespider:{name:"Frost Spider",icon:"🕸️",hp:100,dmg:16,meleeDmg:10,speed:6.2,range:1.4,attackCd:1.1,xp:30,meat:3,hitR:.8,aggro:30,ranged:!0,shootRange:13,spellCd:2.2,projectileSpeed:17,shotColor:9101567},bear:{name:"Grizzly Bear",icon:"🐻",hp:180,dmg:26,speed:5.5,range:2.1,attackCd:1.5,xp:45,meat:5,hitR:1.2,aggro:26},wendigo:{name:"Wendigo",icon:"👹",hp:220,dmg:30,speed:8.4,range:2,attackCd:1.2,xp:55,meat:6,hitR:.9,aggro:34},yeti:{name:"Yeti",icon:"🏔️",hp:350,dmg:40,speed:5,range:2.5,attackCd:1.7,xp:70,meat:8,hitR:1.5,aggro:30},icegolem:{name:"Ice Golem",icon:"🗿",hp:400,dmg:45,meleeDmg:30,speed:3.6,range:2.2,attackCd:1.8,xp:80,meat:9,hitR:1.4,aggro:30,ranged:!0,shootRange:14,spellCd:4,projectileSpeed:13,shotColor:12577023,stun:.8}},oo=[{skulls:1,hpMult:4,dmgMult:1.5,sizeMult:1.5,xpMult:3,meatMult:3,dropChance:.1,packSize:8,reinforceInterval:6,reinforceCount:1},{skulls:2,hpMult:8,dmgMult:2,sizeMult:1.8,xpMult:6,meatMult:5,dropChance:.25,packSize:11,reinforceInterval:4,reinforceCount:2},{skulls:3,hpMult:15,dmgMult:3,sizeMult:2.2,xpMult:10,meatMult:8,dropChance:.5,packSize:14,reinforceInterval:2.5,reinforceCount:3}],Cr=i=>Math.max(1,Math.ceil(i/30)),rs=[0,0,40,110,220,380,600,880,1230,1660,2200],Lr=10,m0=["weapon","head","chest","boots","pet","orb"],sr={weapon:"Weapon",head:"Head",chest:"Chest",boots:"Boots",pet:"Pet",orb:"Orb"},li=[{id:"fists",slot:"weapon",level:1,icon:"🖐️",name:"Bare Hands",cost:null,free:!0,weapon:{kind:"melee",dmg:12,cd:.45,range:1.5,chop:.5,tier:0},desc:"Punch things. Can slowly break small trees for wood (rocks need a real tool)."},{id:"club",slot:"weapon",level:2,icon:"🏏",name:"Wooden Club",cost:{wood:8},weapon:{kind:"melee",dmg:22,cd:.5,range:1.7,chop:1,tier:1},desc:"A crude stone-age club. Damage 22, chops trees and mines rocks."},{id:"stoneAxe",slot:"weapon",level:3,icon:"🪓",name:"Stone Axe",cost:{wood:12,stone:10},weapon:{kind:"melee",dmg:38,cd:.5,range:1.8,chop:2,tier:1},desc:"Knapped stone on a haft. Damage 38, fast chopping & mining."},{id:"steelAxe",slot:"weapon",level:6,icon:"⚒️",name:"Iron Axe",cost:{wood:18,iron:6},needs:"furnace",weapon:{kind:"melee",dmg:68,cd:.48,range:1.9,chop:3,tier:2},desc:"Smelted iron head. Damage 68, tears through wood and rock."},{id:"warAxe",slot:"weapon",level:8,icon:"🔥",name:"War Axe",cost:{wood:25,iron:16,hide:6},needs:"furnace",weapon:{kind:"melee",dmg:120,cd:.48,range:2,chop:4,tier:3},desc:"Iron-age battle axe. Damage 120."},{id:"huntingBow",slot:"weapon",level:4,icon:"🏹",name:"Hunting Bow",cost:{wood:25,hide:4},needs:"cabin",weapon:{kind:"bow",dmg:16,cd:.75,range:3.5,pierce:!1,tier:1},desc:"Wood + hide string. Arrows for 16 dmg, barely 3.5 m of reach."},{id:"longbow",slot:"weapon",level:6,icon:"🎯",name:"Longbow",cost:{wood:40,hide:8,iron:4},needs:"furnace",weapon:{kind:"bow",dmg:32,cd:.62,range:7,pierce:!1,tier:2},desc:"Iron-tipped arrows, damage 32, reach 7 m."},{id:"rapidBow",slot:"weapon",level:8,icon:"🌀",name:"Windstorm Bow",cost:{wood:45,iron:14,hide:10},needs:"furnace",weapon:{kind:"bow",dmg:30,cd:.35,range:10,pierce:!0,tier:3},desc:"Very fast piercing arrows, reach 10 m."},{id:"steelSword",slot:"weapon",level:9,icon:"⚔️",name:"Knight's Sword",cost:{iron:25,wood:10,hide:8},needs:"keep",weapon:{kind:"melee",dmg:150,cd:.42,range:2.1,chop:4,tier:3},desc:"Medieval steel. Damage 150, lightning-fast swings."},{id:"crossbow",slot:"weapon",level:9,icon:"🎯",name:"Crossbow",cost:{wood:50,iron:20},needs:"keep",weapon:{kind:"bow",dmg:60,cd:.9,range:12,pierce:!0,tier:3},desc:"Medieval war machine. Piercing bolts for 60 damage."},{id:"leatherCap",slot:"head",level:3,icon:"🧢",name:"Hide Cap",cost:{hide:4,meat:10},needs:"tent",stats:{hp:25},desc:"+25 max health."},{id:"furHood",slot:"head",level:6,icon:"🎩",name:"Fur Hood",cost:{hide:10,meat:25},needs:"tent",stats:{hp:60},desc:"+60 max health."},{id:"bearHelm",slot:"head",level:9,icon:"⛑️",name:"Bearskull Helm",cost:{hide:18,iron:8,meat:40},needs:"furnace",stats:{hp:110},desc:"+110 max health."},{id:"leatherArmor",slot:"chest",level:3,icon:"🦺",name:"Hide Tunic",cost:{hide:7,meat:15},needs:"tent",stats:{hp:50},desc:"+50 max health. Finally, actual clothes."},{id:"furCoat",slot:"chest",level:6,icon:"🧥",name:"Fur Coat",cost:{hide:14,meat:30},needs:"tent",stats:{hp:100},desc:"+100 max health."},{id:"bearHide",slot:"chest",level:9,icon:"🛡️",name:"Bearhide Plate",cost:{hide:24,iron:12,meat:45},needs:"furnace",stats:{hp:170},desc:"+170 max health."},{id:"swiftBoots",slot:"boots",level:3,icon:"👢",name:"Hide Wraps",cost:{hide:5,meat:10},needs:"tent",stats:{speed:.2},desc:"+20% movement speed."},{id:"huntersBoots",slot:"boots",level:6,icon:"🥾",name:"Hunter's Boots",cost:{hide:10,meat:25},needs:"tent",stats:{speed:.35},desc:"+35% movement speed."},{id:"windBoots",slot:"boots",level:9,icon:"💨",name:"Windwalkers",cost:{hide:14,iron:8,meat:40},needs:"furnace",stats:{speed:.5},desc:"+50% movement speed."},{id:"tamedWolf",slot:"pet",level:4,icon:"🐺",name:"Tamed Wolf",cost:{meat:55},pet:{dmg:14},desc:"A loyal, invincible wolf fights by your side."},{id:"alphaWolf",slot:"pet",level:8,icon:"👑",name:"Alpha Wolf",cost:{meat:120},pet:{dmg:32},desc:"A huge alpha. Bites for 32."},{id:"guardianSphere",slot:"orb",level:5,icon:"🔮",name:"Guardian Sphere",cost:{meat:50,stone:30,iron:6},needs:"furnace",orb:{count:1,targets:1,dmg:12},desc:"Orbits you and fires bolts at enemies."},{id:"twinSphere",slot:"orb",level:8,icon:"✨",name:"Twin-bolt Sphere",cost:{meat:90,iron:14,stone:40},needs:"furnace",orb:{count:1,targets:2,dmg:14},desc:"Fires two bolts at once (14 dmg each)."},{id:"duoSphere",slot:"orb",level:10,icon:"🌐",name:"Gemini Spheres",cost:{meat:130,iron:24,stone:60},needs:"furnace",orb:{count:2,targets:2,dmg:14},desc:"TWO spheres, each firing twin bolts."}],an=i=>li.find(e=>e.id===i);function Ml(i,e){if(!e||!i)return i;const t={meat:i.meat||0};i.wood&&(t.wood=i.wood);for(const n of["stone","hide","iron"])i[n]&&(t.meat+=i[n]*3);return t.meat||delete t.meat,t}const ro=6,Vr=[{id:"haste",level:4,icon:"⚡",name:"Haste",cost:{meat:40},cd:90,desc:"Double attack speed for 10 s."},{id:"powerDash",level:5,icon:"💨",name:"Power Dash",cost:{meat:45},cd:25,desc:"Dash forward, dealing 40 damage to everything in your path."},{id:"heal",level:6,icon:"💚",name:"Mend Wounds",cost:{meat:50},cd:60,desc:"Instantly restore 50 health."},{id:"stunDash",level:7,icon:"🌪️",name:"Stun Dash",cost:{meat:70},cd:35,desc:"Dash that damages (30) and stuns enemies for 3 s."},{id:"shockwave",level:8,icon:"💥",name:"Shockwave",cost:{meat:85},cd:45,desc:"Blast all nearby enemies: 25 damage + knockback."},{id:"frostNova",level:9,icon:"❄️",name:"Frost Nova",cost:{meat:100},cd:50,desc:"Freeze all nearby enemies for 4 s."},{id:"rage",level:10,icon:"😡",name:"Rage",cost:{meat:120},cd:90,desc:"+50% damage for 12 s."}],_o=i=>Vr.find(e=>e.id===i),Wr=[{id:"range",icon:"📏",name:"Range Training",max:10,desc:"+2 m bow range, +0.1 m melee reach per level. Level 10 reaches across the whole screen.",cost:i=>({meat:25*i*i,...i>=3?{wood:10*(i-2)}:{}})},{id:"power",icon:"💪",name:"Power Training",max:10,desc:"+5% weapon damage per level.",cost:i=>({meat:28*i*i,...i>=3?{wood:12*(i-2)}:{}})},{id:"swift",icon:"🤺",name:"Swift Hands",max:10,desc:"+4% attack speed per level.",cost:i=>({meat:26*i*i,...i>=3?{wood:11*(i-2)}:{}})}],Sl=[{id:"home",icon:"⛺",max:4,names:["Hide Tent","Wooden Cabin","Stone House","Medieval Keep"],levels:[{level:2,cost:{hide:6,wood:10},desc:"Age 2 — a hide tent by the cave mouth. Unlocks hide clothing."},{level:4,cost:{wood:60,stone:10},desc:"Age 3 — a timber cabin. Unlocks bows. +15 max health."},{level:7,cost:{stone:80,wood:30,iron:6},desc:"Age 4 — an iron-age stone house. +40 max health."},{level:9,cost:{stone:200,wood:150,iron:30,hide:20,meat:100},desc:"Age 5 — a MEDIEVAL KEEP. Unlocks knightly gear. +80 max health."}]},{id:"chest",icon:"📦",max:1,names:["Storage Chest"],levels:[{level:3,cost:{wood:25},desc:"Store resources safely — whatever is in the chest survives your death."}]},{id:"furnace",icon:"🔥",max:1,names:["Stone Furnace"],levels:[{level:5,cost:{stone:40,wood:15},desc:"Smelts iron: automatically turns 4 🪨 into 1 🔩 every 20 s. Unlocks the iron age."}]},{id:"boat",icon:"🛶",max:1,names:["Log Boat"],levels:[{level:4,cost:{wood:30,hide:4},desc:"Lets you paddle across lakes — treasure islands await."}]},{id:"tower",icon:"🗼",max:1,names:["Guard Tower"],levels:[{level:8,cost:{wood:60,stone:40,iron:10},desc:"Watches over your camp: automatically shoots enemies that come near home."}]},{id:"grave",icon:"🪦",max:1,names:["Graveyard"],levels:[{level:5,cost:{stone:30,wood:20,meat:20},desc:"A remote respawn shrine, built WHERE YOU STAND. When you die you choose: wake at the cave or at the graveyard."}]}],Pc=["Stone Age","Hide Camp","Timber Age","Iron Age","Medieval"],Kg={x:0,z:700,r:17},Zg=5,Jg=i=>({meat:50+15*i,xp:120+50*i}),Ze={half:150,baseHp:1500,basePos:{player:{x:-118,z:118},enemy:{x:118,z:-118}},baseR:16,lanes:{mid:[[-104,104],[-52,52],[0,0],[52,-52],[104,-104]],top:[[-110,96],[-118,40],[-114,-40],[-96,-110],[-40,-118],[40,-114],[96,-110]],bot:[[-96,110],[-40,114],[40,118],[96,110],[114,40],[118,-40],[110,-96]]},waveInterval:60,towerSlotsT:[.14,.27,.4],tower:{hp:400,dmg:22,range:13,cd:1.1},camps:[{x:-80,z:62,types:["rat","rat","spider"],respawn:50},{x:-62,z:80,types:["rat","spider"],respawn:50},{x:80,z:-62,types:["rat","rat","spider"],respawn:50},{x:62,z:-80,types:["rat","spider"],respawn:50},{x:-52,z:22,types:["spider","spider","rat"],respawn:60},{x:-22,z:52,types:["spider","spider","rat"],respawn:60},{x:52,z:-22,types:["spider","spider","rat"],respawn:60},{x:22,z:-52,types:["spider","spider","rat"],respawn:60},{x:-68,z:-28,types:["wolf","wolf"],respawn:80},{x:68,z:28,types:["wolf","wolf"],respawn:80},{x:-30,z:-68,types:["boar","boar"],respawn:95},{x:30,z:68,types:["boar","boar"],respawn:95},{x:-62,z:-62,types:["bear"],respawn:130},{x:62,z:62,types:["bear"],respawn:130},{x:0,z:74,types:["elk","snake"],respawn:90},{x:0,z:-74,types:["elk","snake"],respawn:90},{x:-74,z:0,types:["venomspider","snake"],respawn:90},{x:74,z:0,types:["venomspider","snake"],respawn:90}]},g0={wolf:{hp:60,dmg:9,speed:6.5,range:1.6,cd:1,xp:8,meat:1,hitR:.8},boar:{hp:110,dmg:15,speed:6,range:1.7,cd:1.2,xp:14,meat:2,hitR:.9},bear:{hp:220,dmg:24,speed:5,range:2,cd:1.5,xp:22,meat:3,hitR:1.2}},_0=[["wolf","wolf"],["wolf","wolf","wolf"],["wolf","wolf","wolf","boar"],["wolf","wolf","boar","boar"],["wolf","wolf","boar","boar","bear"]],yl=[{id:"den",icon:"🏚️",name:"Creep Den",perLane:!0,max:5,cost:i=>({meat:30+i*30,wood:15+i*20}),desc:"Lane building. Sends a creep wave down its lane every 60 s. Each level adds bigger, stronger waves."},{id:"tower",icon:"🗼",name:"Watchtower",perLane:!0,max:3,cost:i=>({meat:45+i*30,wood:50+i*35}),desc:"Defensive turret on your half of the lane. Fires bolts at enemy creeps and heroes."},{id:"forge",icon:"⚒️",name:"War Forge",perLane:!1,max:5,cost:i=>({meat:50+i*45,wood:40+i*35}),desc:"+15% damage and health for ALL your creeps per level."},{id:"lodge",icon:"🏕️",name:"Hunting Lodge",perLane:!1,max:5,cost:i=>({meat:40+i*40}),desc:"Passive income: +2 meat every 10 s per level."},{id:"walls",icon:"🧱",name:"Base Walls",perLane:!1,max:3,cost:i=>({meat:60+i*40,wood:80+i*50}),desc:"+500 base health per level (also repairs 250 on build)."}],Dc=[[50,"den","mid"],[140,"den","bot"],[230,"den","top"],[170,"tower","mid"],[290,"tower","bot"],[410,"tower","top"],[320,"den","mid"],[440,"den","bot"],[500,"forge"],[560,"den","mid"],[620,"tower","mid"],[680,"den","top"],[740,"forge"],[800,"den","bot"],[860,"walls"],[920,"den","mid"],[980,"forge"],[1040,"den","top"]],is=[{key:"weapons",label:"⚔️ Weapons",items:()=>li.filter(i=>i.slot==="weapon"&&!i.free)},{key:"armor",label:"🛡️ Clothing",items:()=>li.filter(i=>["head","chest","boots"].includes(i.slot))},{key:"friends",label:"🐾 Companions",items:()=>li.filter(i=>["pet","orb"].includes(i.slot))},{key:"spells",label:"📖 Spells",items:()=>Vr},{key:"training",label:"📈 Training",items:()=>Wr}],or=new Map;function In(i){return or.has(i)||or.set(i,new Ut({color:i})),or.get(i)}function ne(i,e,t,n){const s=new Ce(new Ot(i,e,t),In(n));return s.castShadow=!0,s}function Pt(i,e,t,n,s=7){const o=new Ce(new vs(i,e,t,s),In(n));return o.castShadow=!0,o}function Mn(i,e,t,n=7){const s=new Ce(new Ms(i,e,n),In(t));return s.castShadow=!0,s}function qn(i,e,t=8){const n=new Ce(new mi(i,t,Math.max(5,t-2)),In(e));return n.castShadow=!0,n}function x0(){const i=new ge,e=14262374,t=ne(.2,.5,.2,e);t.position.set(-.13,.25,0);const n=ne(.2,.5,.2,e);n.position.set(.13,.25,0);const s=ne(.5,.62,.3,e);s.position.y=.81;const o=ne(.32,.32,.32,e);o.position.y=1.32;const a=ne(.34,.1,.34,3811866);a.position.y=1.5;const r=new ge,c=ne(.26,.22,.04,3964727);c.position.set(0,.52,-.18);const l=ne(.26,.22,.04,2976301);l.position.set(0,.52,.18),r.add(c,l),i.add(r);const h=new ge;h.position.set(-.33,1.06,0);const d=ne(.15,.52,.15,e);d.position.y=-.26,h.add(d);const u=new ge;u.position.set(.33,1.06,0);const p=ne(.15,.52,.15,e);p.position.y=-.26,u.add(p);const g=ne(.16,.14,.16,e);g.position.y=-.56,u.add(g);const x=new ge;x.position.set(0,-.56,0),u.add(x);const m=new ge;m.position.set(0,-.5,0),h.add(m);const f=new ge;return f.position.y=1.52,i.add(f),i.add(t,n,s,o,a,h,u),i.userData={leftLeg:t,rightLeg:n,leftArm:h,rightArm:u,rightSocket:x,leftSocket:m,torso:s,armL:d,armR:p,leaf:r,capSlot:f,hair:a},i}function v0(i){const e=new ge,t=i>=3?1.3:i>=2?1.15:1,n=i>=3?16746564:i>=2?13620957:9079434,s=ne(.06,.6,.06,7031341);s.position.y=-.08;const o=ne(.07,.16*t,.24*t,n);o.position.set(0,.2,.12*t);const a=ne(.05,.2*t,.05,15265522);if(a.position.set(0,.2,.26*t),e.add(s,o,a),i>=3){const r=o.clone();r.position.z=-.12*t;const c=a.clone();c.position.z=-.26*t,e.add(r,c)}return e}function M0(i){const e=new ge,t=i>=2?9067034:6046502,n=new Ce(new po(.32,.03,5,10,Math.PI),In(t));return n.castShadow=!0,n.rotation.z=Math.PI/2,e.add(n),e}function Ki({bodyW:i,bodyH:e,bodyL:t,color:n,headSize:s,snout:o,snoutColor:a,earColor:r,legH:c,tail:l,eyeColor:h}){const d=new ge,u=ne(i,e,t,n);u.position.y=c+e/2,d.add(u);const p=ne(s,s,s,n);p.position.set(0,c+e+s*.1,-t/2-s*.25),d.add(p);{const _=ne(s*.5,s*.42,s*.6,a||n);_.position.set(0,-s*.15,-s*.6),p.add(_)}const g=ne(s*.22,s*.3,s*.12,r||n);g.position.set(-s*.3,s*.6,0),p.add(g);const x=g.clone();if(x.position.x=s*.3,p.add(x),h){const _=new Ht({color:h}),E=new Ce(new Ot(s*.12,s*.12,s*.06),_);E.position.set(-s*.22,s*.1,-s*.51),p.add(E);const R=E.clone();R.position.x=s*.22,p.add(R)}const m=[],f=i/2-.08,v=t/2-.12;for(const[_,E]of[[-f,-v],[f,-v],[-f,v],[f,v]]){const R=ne(.13,c,.13,n);R.position.set(_,c/2,E),d.add(R),m.push(R)}if(l){const _=ne(.1,.1,.42,n);_.position.set(0,c+e,t/2+.16),_.rotation.x=-.5,d.add(_)}return d.userData={legs:m,head:p},d}function ao(i="black"){const e={black:1776415,ice:12376296,tame:11569754},t={black:16724770,ice:2267647,tame:2759178};return Ki({bodyW:.48,bodyH:.45,bodyL:1.05,color:e[i],headSize:.36,snout:!0,legH:.38,tail:!0,eyeColor:t[i]})}function S0(){const i=Ki({bodyW:.66,bodyH:.58,bodyL:1.1,color:5913126,headSize:.42,snout:!0,snoutColor:13209466,legH:.3,eyeColor:16777215}),e=i.userData.head,t=ne(.05,.16,.05,15787728);t.position.set(-.14,-.2,-.32),t.rotation.x=.4,e.add(t);const n=t.clone();return n.position.x=.14,e.add(n),i}function y0(){return Ki({bodyW:.95,bodyH:.85,bodyL:1.5,color:4862498,headSize:.55,snout:!0,snoutColor:7031347,legH:.42,eyeColor:1116677})}function E0(){const i=new ge,e=15265522,t=9413808,n=ne(.3,.7,.32,e);n.position.set(-.24,.35,0);const s=ne(.3,.7,.32,e);s.position.set(.24,.35,0);const o=ne(.95,1.05,.6,e);o.position.y=1.22;const a=ne(.52,.5,.5,e);a.position.y=2;const r=ne(.34,.3,.06,t);r.position.set(0,-.02,-.25),a.add(r);const c=new Ht({color:6740479}),l=new Ce(new Ot(.08,.08,.04),c);l.position.set(-.09,.05,-.29),a.add(l);const h=l.clone();h.position.x=.09,a.add(h);const d=new ge;d.position.set(-.62,1.62,0);const u=ne(.26,.95,.28,e);u.position.y=-.42,d.add(u);const p=new ge;p.position.set(.62,1.62,0);const g=ne(.26,.95,.28,e);return g.position.y=-.42,p.add(g),i.add(n,s,o,a,d,p),i.userData={legs:[n,s],arms:[d,p],head:a},i}function rr(i="forest"){const t={forest:{body:2760472,abdomen:1840142,legs:2365970,eyes:16724770,scale:1},venom:{body:3824168,abdomen:2902558,legs:3032352,eyes:8257338,scale:1.15},frost:{body:14214894,abdomen:12375266,legs:10335426,eyes:2267647,scale:1.2}}[i],n=new ge,s=qn(.28,t.body,8);s.position.set(0,.42,.05);const o=qn(.36,t.abdomen,8);o.position.set(0,.5,.42);const a=qn(.17,t.body,7);a.position.set(0,.4,-.28);const r=new Ht({color:t.eyes});for(const l of[-.07,.07]){const h=new Ce(new Ot(.05,.05,.03),r);h.position.set(l,.44,-.43),n.add(h)}const c=[];for(let l=-1;l<=1;l+=2)for(let h=0;h<4;h++){const d=new ge;d.position.set(l*.22,.45,-.25+h*.18);const u=ne(.04,.04,.34,t.legs);u.position.set(l*.16,.04,0),u.rotation.y=l*-.9;const p=ne(.035,.4,.035,t.legs);p.position.set(l*.32,-.2,u.position.z+l*-.12*0),p.rotation.z=l*.35,d.add(u,p),n.add(d),c.push(d)}return n.add(s,o,a),n.userData={legs:c,head:a,spider:!0},n.scale.multiplyScalar(t.scale),n}function b0(){const i=Ki({bodyW:.32,bodyH:.26,bodyL:.62,color:9078144,headSize:.24,snout:!0,snoutColor:13213856,legH:.16,eyeColor:1706506}),e=ne(.05,.05,.55,13213856);return e.position.set(0,.28,.55),e.rotation.x=.25,i.add(e),i}function w0(){const i=Ki({bodyW:.28,bodyH:.26,bodyL:.48,color:14206628,headSize:.2,snout:!0,snoutColor:15783624,legH:.18,eyeColor:1706506}),e=i.userData.head;for(const n of[-.07,.07]){const s=ne(.05,.34,.06,14206628);s.position.set(n,.28,.02),s.rotation.z=n<0?.14:-.14,e.add(s)}const t=qn(.09,15787216,6);return t.position.set(0,.28,.32),i.add(t),i}function Ic(i="grass"){const t={grass:{colors:[4880944,4024360],eyes:16765498,scale:1},storm:{colors:[3820142,5926558],eyes:8251647,scale:1.25}}[i],n=new ge,s=[];for(let a=0;a<5;a++){const r=a/4,c=ne(.24-r*.1,.18-r*.05,.3,t.colors[a%2]);c.position.set(0,.1,-.5+a*.28),n.add(c),s.push(c)}const o=new Ht({color:t.eyes});for(const a of[-.07,.07]){const r=new Ce(new Ot(.05,.05,.03),o);r.position.set(a,.18,-.63),n.add(r)}if(i==="storm"){const a=new Ce(new Ms(.07,.22,4),new Ht({color:16771402}));a.position.set(0,.3,-.5),n.add(a)}return n.userData={segments:s},n.scale.multiplyScalar(t.scale),n}function T0(){const i=new ge,e=qn(.2,3811888,7);e.position.y=0;const t=ne(.06,.12,.05,3811888);t.position.set(-.08,.2,-.05);const n=t.clone();n.position.x=.08;const s=new Ht({color:16755234});for(const a of[-.07,.07]){const r=new Ce(new Ot(.04,.04,.03),s);r.position.set(a,.02,-.17),i.add(r)}const o=[];for(const a of[-1,1]){const r=new ge;r.position.set(a*.12,.05,0);const c=ne(.55,.04,.3,2759714);c.position.x=a*.3,r.add(c),i.add(r),o.push(r)}return i.add(e,t,n),i.userData={wings:o},i}function A0(){const i=Ki({bodyW:.7,bodyH:.72,bodyL:1.35,color:8017462,headSize:.42,snout:!0,snoutColor:6045736,legH:.62,eyeColor:1707269}),e=i.userData.head;for(const t of[-1,1]){const n=ne(.06,.5,.06,14272936);n.position.set(t*.16,.5,.05),n.rotation.z=t*-.35,e.add(n);const s=ne(.05,.28,.05,14272936);s.position.set(t*.28,.62,.05),s.rotation.z=t*.6,e.add(s)}return i}function Xr({fur:i,face:e,eyes:t,width:n=1,height:s=1}){const o=new ge,a=ne(.3*n,.7*s,.32,i);a.position.set(-.24*n,.35*s,0);const r=ne(.3*n,.7*s,.32,i);r.position.set(.24*n,.35*s,0);const c=ne(.95*n,1.05*s,.6,i);c.position.y=1.22*s;const l=ne(.52,.5,.5,i);l.position.y=2*s;const h=ne(.34,.3,.06,e);h.position.set(0,-.02,-.25),l.add(h);const d=new Ht({color:t}),u=new Ce(new Ot(.08,.08,.04),d);u.position.set(-.09,.05,-.29),l.add(u);const p=u.clone();p.position.x=.09,l.add(p);const g=new ge;g.position.set(-.62*n,1.62*s,0);const x=ne(.26*n,.95*s,.28,i);x.position.y=-.42*s,g.add(x);const m=new ge;m.position.set(.62*n,1.62*s,0);const f=ne(.26*n,.95*s,.28,i);return f.position.y=-.42*s,m.add(f),o.add(a,r,c,l,g,m),o.userData={legs:[a,r],arms:[g,m],head:l},o}function R0(){const i=Xr({fur:6978130,face:9083498,eyes:16724770,width:.72,height:.92}),e=ne(.7,.4,.5,4866616);return e.position.y=.95,i.add(e),i.userData.head.rotation.z=.25,i.userData.arms.forEach(t=>{t.rotation.x=-1.1}),i}function C0(){const i=Xr({fur:4868690,face:12103844,eyes:16720418,width:.8,height:1.05}),e=i.userData.head;for(const t of[-1,1]){const n=ne(.06,.4,.06,13681840);n.position.set(t*.18,.42,0),n.rotation.z=t*-.5,e.add(n)}return i}function L0(){return Xr({fur:11190220,face:7177364,eyes:6744831,width:1.25,height:.95})}function Pr(i){switch(i){case"rabbit":return w0();case"rat":return b0();case"spider":return rr("forest");case"venomspider":return rr("venom");case"icespider":return rr("frost");case"snake":return Ic("grass");case"stormsnake":return Ic("storm");case"bat":return T0();case"wolf":return ao("black");case"icewolf":return ao("ice");case"boar":return S0();case"elk":return A0();case"bear":return y0();case"zombie":return R0();case"wendigo":return C0();case"yeti":return E0();case"icegolem":return L0()}}function Fi(i,e,t){const n=new Ce(new Yi(i,0),In(e));return n.castShadow=!0,n.rotation.set(t()*3,t()*3,t()*3),n.scale.y=.8+t()*.5,n}function P0(i){return new Ce(new mi(.17,8,6),new Ht({color:i}))}function D0(){const i=new Jt,e=new Ht({color:16771496,transparent:!0,opacity:.6,side:jt,depthWrite:!1,depthTest:!1}),t=new Ce(i,e);return t.renderOrder=10,t.frustumCulled=!1,t}const Xs=24;function I0(i,e,t,n,s,o,a,r){const c=Math.max(.05,s-a),l=new Float32Array((Xs+1)*2*3);for(let u=0;u<=Xs;u++){const p=n-o+u/Xs*o*2,g=Math.sin(p),x=Math.cos(p),m=e+g*s,f=t+x*s,v=e+g*c,_=t+x*c,E=u*6;l[E]=v,l[E+1]=r(v,_)+.12,l[E+2]=_,l[E+3]=m,l[E+4]=r(m,f)+.12,l[E+5]=f}const h=[];for(let u=0;u<Xs;u++){const p=u*2;h.push(p,p+1,p+2,p+1,p+3,p+2)}const d=i.geometry;d.setAttribute("position",new sn(l,3)),d.setIndex(h)}function U0(i){const e=new ge;for(let t=0;t<2;t++){const n=.8+i()*1.4,s=Mn(.2+i()*.2,n,4999232,6);s.position.set((i()-.5)*.6,n/2,(i()-.5)*.6),e.add(s)}return e}function N0(){const i=new ge;for(let t=0;t<4;t++){const n=Pt(.08,.08,.7,6046502,5);n.rotation.z=Math.PI/2,n.rotation.y=t/4*Math.PI,n.position.y=.1,i.add(n)}const e=new Ce(new Ms(.22,.55,6),new Ut({color:16747562,emissive:16734720,emissiveIntensity:.9}));return e.position.y=.42,i.add(e),i.userData={flame:e},i}function F0(){const i=new ge,e=Mn(1.9,2,9071438,6);e.position.y=1;const t=ne(.6,.9,.1,3812382);t.position.set(0,.45,-1.35);for(let n=0;n<3;n++){const s=Pt(.04,.04,2.6,6046502,4);s.rotation.z=(n-1)*.35,s.position.y=1.3,i.add(s)}return i.add(e,t),i}function O0(){const i=new ge,e=ne(1.4,1.5,1.4,7236192);e.position.y=.75;const t=ne(.4,1,.4,6051918);t.position.set(.3,1.9,.3);const n=new Ce(new Ot(.6,.5,.1),new Ut({color:16742178,emissive:16729088,emissiveIntensity:.8}));return n.position.set(0,.5,-.71),i.add(e,t,n),i}function k0(){const i=new ge,e=ne(1.1,.6,.7,9069112);e.position.y=.3;const t=ne(1.14,.22,.74,7228714);t.position.y=.7;const n=ne(.14,.2,.06,13938487);return n.position.set(0,.56,-.37),i.add(e,t,n),i}function z0(){const i=new ge,e=ne(.7,.25,2,9069112);e.position.y=.5,e.rotation.z=.5;for(const t of[-.7,.7]){const n=ne(.1,.6,.1,6046502);n.position.set(0,.3,t),i.add(n)}return i.add(e),i}function B0(){const i=new ge;for(let t=0;t<4;t++){const n=ne(.5,.8+t%2*.25,.14,9078136);n.position.set(-1.2+t*.85,.42,t%2*.8-.4),n.rotation.z=(t-1.5)*.06;const s=Pt(.25,.25,.14,9078136,8);s.rotation.x=Math.PI/2,s.position.set(n.position.x,.84+t%2*.25,n.position.z),i.add(n,s)}const e=ne(3.6,.1,2.2,4864558);return e.position.y=.05,i.add(e),i}function H0(){const i=new ge;for(let e=-2;e<=2;e++){const t=Pt(.14,.14,1.7,9069112,6);t.rotation.x=Math.PI/2,t.position.set(e*.29,0,0),i.add(t)}return i}function G0(){const i=new ge,e=ne(3.4,2.1,2.8,7228714);e.position.y=1.05;const t=Mn(3,1.9,4994336,4);t.position.y=3.05,t.rotation.y=Math.PI/4;const n=ne(.9,1.4,.15,2891538);n.position.set(.6,.7,1.42);const s=ne(.7,.6,.12,15980938);s.position.set(-.9,1.3,1.42);const o=ne(.5,1.2,.5,9078136);o.position.set(-1.1,3.2,-.6);for(let a=0;a<3;a++){const r=Pt(.16,.16,1.1,9069112,6);r.rotation.z=Math.PI/2,r.position.set(2.2,.16+(a===2?.28:0),-.5+a%2*.36),i.add(r)}return i.add(e,t,n,s,o),i}const ar={player:3829685,enemy:11876922};function xo(i){const e=new ge,t=ne(.05,.7,.05,6046502);t.position.y=.35;const n=ne(.34,.2,.03,i);return n.position.set(.17,.58,0),e.add(t,n),e}function El(i){const e=new ge,t=Pt(1.1,1.4,1.2,9078136,8);t.position.y=.6;const n=Pt(.55,.75,2.6,10130826,8);n.position.y=2.4;const s=Pt(.95,.8,.7,7236192,8);s.position.y=3.9;const o=new Ce(new mi(.42,10,8),new Ut({color:i,emissive:i,emissiveIntensity:.6}));o.position.y=4.7;const a=xo(i);return a.position.set(.9,.9,0),e.add(t,n,s,o,a),e.userData={orb:o},e}function V0(i){const e=new ge,t=Pt(7.5,8.5,.8,9078136,10);t.position.y=.4,t.receiveShadow=!0;const n=ne(6,3.4,5,7228714);n.position.y=2.5;const s=Mn(4.8,2.6,4994336,4);s.position.y=5.5,s.rotation.y=Math.PI/4;const o=ne(1.4,1.9,.2,2891538);o.position.set(0,1.7,-2.5);const a=ne(1.2,2.4,.1,i);a.position.set(0,3.4,-2.56),e.add(t,n,s,o,a);for(const[r,c]of[[-5.5,-5.5],[5.5,-5.5],[-5.5,5.5],[5.5,5.5]]){const l=Pt(.22,.28,3.4,6046502,6);l.position.set(r,1.7,c);const h=xo(i);h.scale.setScalar(1.6),h.position.set(r,3.2,c),e.add(l,h)}return e}function W0(i){const e=new ge,t=ne(2.2,1.5,2.2,7228714);t.position.y=.75;const n=Mn(1.9,1.3,4021295,4);n.position.y=2.1,n.rotation.y=Math.PI/4;const s=ne(.7,1,.15,2891538);s.position.set(0,.6,-1.12);const o=xo(i);return o.position.set(.9,1.4,.9),e.add(t,n,s,o),e}function X0(i){const e=new ge,t=ne(1.6,1.1,1.6,i);t.position.y=.55;const n=Mn(1.4,1,4994336,4);return n.position.y=1.55,n.rotation.y=Math.PI/4,e.add(t,n),e}function q0(i,e){const t=new ge,n=ne(i,.14,e,9069112);n.position.y=.45,n.receiveShadow=!0,t.add(n);for(let s=-e/2+.5;s<e/2;s+=.7){const o=ne(i+.06,.04,.08,7228714);o.position.set(0,.53,s),t.add(o)}for(const s of[-1,1]){const o=ne(.09,.09,e,6046502);o.position.set(s*(i/2-.05),.95,0),t.add(o);for(let a=-e/2+.4;a<e/2;a+=1.4){const r=ne(.09,.55,.09,6046502);r.position.set(s*(i/2-.05),.66,a),t.add(r)}}return t}function Y0(){const i=new ge,e=ne(.3,.22,.22,11880495),t=Pt(.045,.045,.4,15787728,5);return t.rotation.z=Math.PI/2,t.position.y=-.06,i.add(e,t),i}function $0(){const i=new ge,e=Pt(.09,.09,.5,9069112,6);e.rotation.z=Math.PI/2;const t=Pt(.08,.08,.42,7688750,6);return t.rotation.z=Math.PI/2,t.rotation.y=.5,t.position.y=.13,i.add(e,t),i}function j0(){const i=new ge,e=new Ce(new Yi(.22,0),In(9079428));e.castShadow=!0;const t=new Ce(new Yi(.15,0),In(10132116));return t.position.set(.2,-.05,.1),i.add(e,t),i}function K0(){const i=new ge,e=ne(.5,.06,.42,9071438);e.rotation.y=.4;const t=ne(.24,.07,.2,7230008);return t.position.set(.08,.02,.05),i.add(e,t),i}function Z0(){const i=ne(.4,.14,.18,12107462);i.rotation.y=.5;const e=new ge,t=ne(.4,.14,.18,11054774);return t.position.set(.05,.14,.02),t.rotation.y=.3,e.add(i,t),e}function Uc(){const i=new ge,e=new Ce(new Ot(.42,.36,.42),new Ut({color:13938487,emissive:9071120,emissiveIntensity:.55}));e.castShadow=!0;const t=new Ce(new Ot(.46,.1,.46),new Ut({color:8018458,emissive:3811848,emissiveIntensity:.4}));return i.add(e,t),i}function J0(i,e){let t=e()*(i.pine+i.leafy+i.birch+i.dead);for(const n of["pine","leafy","birch","dead"])if(t-=i[n],t<=0)return n;return"pine"}function bl(i,e,t){const n=new ge,s=[.65,1,1.5][i]*(.8+t()*.45),o=e.foliage[Math.floor(t()*e.foliage.length)],a=J0(e.trees,t);if(a==="dead"){const l=2.1*s,h=Pt(.09*s,.17*s,l,4141606,5);h.position.y=l/2,h.rotation.z=(t()-.5)*.15,n.add(h);const d=2+Math.floor(t()*2);for(let u=0;u<d;u++){const p=ne(.07*s,.7*s,.07*s,4141606);p.position.set((t()-.5)*.3,l*(.55+t()*.35),(t()-.5)*.3),p.rotation.z=(t()<.5?1:-1)*(.6+t()*.6),p.rotation.y=t()*Math.PI,n.add(p)}return{mesh:n,radius:.28*s+.12}}if(a==="birch"){const l=2.2*s,h=Pt(.09*s,.13*s,l,14473420,6);h.position.y=l/2,n.add(h);for(let u=0;u<3;u++){const p=ne(.11*s,.06*s,.11*s,3815988);p.position.set(0,l*(.25+t()*.55),0),p.rotation.y=t()*Math.PI,n.add(p)}const d=1+i;for(let u=0;u<d;u++){const p=qn((.62-u*.1)*s,9418590,7);p.position.set((t()-.5)*.5*s,l+u*.45*s,(t()-.5)*.5*s),p.scale.y=.8,n.add(p)}return{mesh:n,radius:.28*s+.13}}const r=1.6*s,c=Pt(.13*s,.2*s,r,e.trunk,6);if(c.position.y=r/2,n.add(c),a==="pine"){const l=2+i;for(let h=0;h<l;h++){const d=(1.1-h*.22)*s,u=Mn(d,1.1*s,o,7);u.position.y=r+h*.72*s,n.add(u)}if(e.snowy){const h=Mn((1.1-(l-1)*.22)*s*.9,.5*s,15791609,7);h.position.y=r+(l-1)*.72*s+.45*s,n.add(h)}}else{const l=1+i;for(let h=0;h<l;h++){const d=qn((.8-h*.12)*s,o,7);d.position.set((t()-.5)*.5*s,r+.5*s+h*.55*s,(t()-.5)*.5*s),d.scale.y=.85,n.add(d)}}return{mesh:n,radius:.35*s+.15}}function wl(i,e){const t=new ge,n=3+Math.floor(e()*3);for(let s=0;s<n;s++){const o=.42+e()*.3,a=Mn(.055,o,i,4);a.castShadow=!1,a.position.set((e()-.5)*.4,o/2,(e()-.5)*.4),a.rotation.set((e()-.5)*.5,0,(e()-.5)*.5),t.add(a)}return t}function Tl(i){const e=new ge,t=ne(.03,.26,.03,5012026);t.castShadow=!1,t.position.y=.13;const n=[16777215,15979338,14711450,14245708],s=ne(.11,.09,.11,n[Math.floor(i()*n.length)]);return s.castShadow=!1,s.position.y=.3,e.add(t,s),e}function Q0(i){const e=new ge,t=Pt(.045,.06,.16,15130056,5);t.castShadow=!1,t.position.y=.08;const n=Mn(.13,.12,i()<.5?12597547:11569754,6);return n.castShadow=!1,n.position.y=.2,e.add(t,n),e}function Al(i,e){const t=new ge;for(let n=0;n<2+Math.floor(e()*2);n++){const s=qn(.2+e()*.14,i,6);s.position.set((e()-.5)*.4,.18,(e()-.5)*.4),s.scale.y=.75,t.add(s)}return t}function eg(i,e){const t=Pt(.13,.13,.8+e()*.5,i,6);return t.rotation.z=Math.PI/2,t.rotation.y=e()*Math.PI,t.position.y=.13,t}function Rl(i){const e=.25+i()*.6,t=new Ce(new Yi(e,0),In(9079428));return t.castShadow=!0,t.position.y=e*.4,t.rotation.set(i()*3,i()*3,i()*3),t}function tg(){const i=new ge,e=new Ce(new mi(.28,12,10),new Ut({color:2832970,emissive:3719423,emissiveIntensity:.8}));e.castShadow=!0;const t=new Ce(new po(.42,.04,6,18),new Ut({color:10475775,emissive:2250103,emissiveIntensity:.6}));return t.rotation.x=Math.PI/2,i.add(e,t),i.userData={ring:t},i}function ng(){const i=new ge,e=ne(.05,.05,.55,9071162),t=Mn(.06,.14,7829367,5);return t.rotation.x=-Math.PI/2,t.position.z=-.33,i.add(e,t),i}function ig(){return new Ce(new mi(.13,8,6),new Ht({color:8380671}))}const sg="assets/sounds/",og="assets/music/";class rg{constructor(){this.muted=!1,this.cache=new Map,this.music=null,this.musicName=null,this.musicVolume=.35,this.lastPlayed=new Map}_base(e){if(!this.cache.has(e)){const t=new Audio(sg+e+".mp3");t.preload="auto",this.cache.set(e,t)}return this.cache.get(e)}sfx(e,t=.5,n=60){if(this.muted)return;const s=performance.now();if(s-(this.lastPlayed.get(e)||0)<n)return;this.lastPlayed.set(e,s);const o=this._base(e).cloneNode();o.volume=t,o.play().catch(()=>{})}playMusic(e){if(this.musicName===e)return;this.stopMusic(),this.musicName=e;const t=new Audio(og+e+".mp3");t.loop=!0,t.volume=this.muted?0:this.musicVolume,t.play().catch(()=>{}),this.music=t}stopMusic(){this.music&&(this.music.pause(),this.music=null,this.musicName=null)}toggleMute(){return this.muted=!this.muted,this.music&&(this.music.volume=this.muted?0:this.musicVolume),this.muted}_family(e){return/spider/i.test(e)?"spider":/snake|serpent/i.test(e)?"snake":/wolf/i.test(e)?"wolf":e==="rat"?"rat":e==="bat"?"bat":"beast"}creature(e,t,n=.5,s=70){this.sfx(this._family(e)+"_"+t,n,s)}}const le=new rg,ti={home:{x:-9,z:13},chest:{x:6,z:16},furnace:{x:11,z:11},boat:{x:0,z:21},tower:{x:13,z:17}},ag=6,cg=12,lg=5.5;class hg{constructor(e,t,n,s){this.scene=e,this.world=t,this.player=n,this.hooks=s,this.levels={home:0,chest:0,furnace:0,boat:0,tower:0,grave:0},this.storage={meat:0,wood:0,stone:0,hide:0,iron:0},this.meshes={},this.gravePos=null,this.smeltT=20,this.towerCd=0,this.healPopupT=0}has(e){return e==="tent"?this.levels.home>=1:e==="cabin"?this.levels.home>=2:e==="stonehouse"?this.levels.home>=3:e==="keep"?this.levels.home>=4:this.levels[e]>=1}era(){return Pc[Math.min(this.levels.home,Pc.length-1)]}homeHpBonus(){return[0,0,15,40,80][Math.min(this.levels.home,4)]}buildingInfo(e){const t=Sl.find(a=>a.id===e),n=this.levels[e],s=n>=t.max,o=s?null:t.levels[n];return{def:t,level:n,maxed:s,name:t.names[Math.min(n,t.names.length-1)],nextName:s?null:t.names[n],cost:(o==null?void 0:o.cost)??null,reqLevel:(o==null?void 0:o.level)??null,desc:(s?t.levels[t.max-1]:o).desc}}build(e){var n,s;return this.buildingInfo(e).maxed?!1:(this.levels[e]++,this._placeMesh(e),le.sfx("tower_build",.55),(s=(n=this.hooks).toast)==null||s.call(n,`🏕️ Built: ${this.buildingInfo(e).name}!`,"level"),!0)}_placeMesh(e){this.meshes[e]&&this.scene.remove(this.meshes[e]);const t=e==="grave"?{x:Math.round(this.player.pos.x),z:Math.round(this.player.pos.z)}:ti[e];let n;if(e==="home"){const s=this.levels.home;if(n=s===1?F0():G0(),s>=3){const o=s===4?7238272:9407100;n.traverse(a=>{var r,c,l;a.isMesh&&((l=(c=(r=a.material)==null?void 0:r.color)==null?void 0:c.getHex)==null?void 0:l.call(c))===7228714&&(a.material=a.material.clone(),a.material.color.setHex(o))}),s===4&&n.scale.setScalar(1.25)}n.rotation.y=.4}else e==="chest"?n=k0():e==="furnace"?n=O0():e==="boat"?n=z0():e==="grave"?(n=B0(),this.gravePos={x:t.x,z:t.z}):e==="tower"&&(n=El(8827998),n.scale.setScalar(.8));n.position.set(t.x,this.world.heightAt(t.x,t.z),t.z),this.scene.add(n),this.meshes[e]=n,e!=="grave"&&this.world.obstacles.push({x:t.x,z:t.z,r:e==="home"?3.2:1.1})}depositAll(){let e=0;for(const t of $s)this.storage[t]=Dt(this.storage[t]+this.player[t]),e=Dt(e+this.player[t]),this.player[t]=0;return e&&le.sfx("click",.5),e}withdrawAll(){let e=0;for(const t of $s)this.player[t]=Dt(this.player[t]+this.storage[t]),e=Dt(e+this.storage[t]),this.storage[t]=0;return e&&le.sfx("click",.5),e}storageLine(){return $s.map(e=>Rt(this.storage[e])).join(" / ")}update(e,t,n){var o,a,r,c,l;this.healPopupT=Math.max(0,this.healPopupT-e);const s=Math.hypot(this.player.pos.x-ti.home.x,this.player.pos.z-ti.home.z);!this.player.dead&&s<ag&&this.player.hp<this.player.maxHp&&(this.player.hp=Math.min(this.player.maxHp,this.player.hp+cg*e),this.healPopupT<=0&&(this.healPopupT=1.2,(a=(o=this.hooks).popup)==null||a.call(o,this.player.mesh.position.clone().setY(this.player.mesh.position.y+2.3),"+ heal","#7dff8a")));for(const h of((r=t==null?void 0:t.alive)==null?void 0:r.call(t))??[]){const d=h.pos.x-ti.home.x,u=h.pos.z-ti.home.z,p=Math.hypot(d,u)||1,g=lg+(h.hitR??.5);p<g&&(h.pos.x=ti.home.x+d/p*g,h.pos.z=ti.home.z+u/p*g)}if(this.levels.furnace>=1&&(this.smeltT-=e,this.smeltT<=0)){if(this.smeltT=20,this.player.stone>=4)this.player.stone=Dt(this.player.stone-4),this.player.iron=Dt(this.player.iron+1);else if(this.storage.stone>=4)this.storage.stone=Dt(this.storage.stone-4),this.storage.iron=Dt(this.storage.iron+1);else return;le.sfx("upgrade",.3,500);const h=this.meshes.furnace;h&&((l=(c=this.hooks).popup)==null||l.call(c,h.position.clone().setY(h.position.y+2.2),"+1 🔩","#c8d0d8"))}if(this.levels.tower>=1&&t&&n&&(this.towerCd-=e,this.towerCd<=0)){const h=this.meshes.tower;let d=null,u=20;for(const p of t.alive()){const g=Math.hypot(p.pos.x-h.position.x,p.pos.z-h.position.z);g<u&&(u=g,d=p)}d&&(this.towerCd=1.2,n.spawnBolt(h.position.clone().setY(h.position.y+3.8),d,{dmg:25,onHit:()=>t.damage(d,25,null)}),le.sfx("attack_ranged",.2,300))}}dispose(){for(const e of Object.values(this.meshes))this.scene.remove(e);this.meshes={}}}class dg{constructor(){this.keys=new Set,this.mouse={x:0,y:0,left:!1,right:!1},this.keyHandlers=new Map,window.addEventListener("keydown",e=>{if(e.repeat)return;this.keys.add(e.code);const t=this.keyHandlers.get(e.code);t&&t()}),window.addEventListener("keyup",e=>this.keys.delete(e.code)),window.addEventListener("blur",()=>{this.keys.clear(),this.mouse.left=!1,this.mouse.right=!1}),window.addEventListener("mousemove",e=>{this.mouse.x=e.clientX/window.innerWidth*2-1,this.mouse.y=-(e.clientY/window.innerHeight)*2+1}),window.addEventListener("mousedown",e=>{e.target.closest("button, .panel, .spell-slot, #minimap")||(e.button===0&&(this.mouse.left=!0),e.button===2&&(this.mouse.right=!0))}),window.addEventListener("mouseup",e=>{e.button===0&&(this.mouse.left=!1),e.button===2&&(this.mouse.right=!1)}),window.addEventListener("contextmenu",e=>e.preventDefault())}onKey(e,t){this.keyHandlers.set(e,t)}get moveX(){return(this.keys.has("KeyD")||this.keys.has("ArrowRight")?1:0)-(this.keys.has("KeyA")||this.keys.has("ArrowLeft")?1:0)}get moveZ(){return(this.keys.has("KeyS")||this.keys.has("ArrowDown")?1:0)-(this.keys.has("KeyW")||this.keys.has("ArrowUp")?1:0)}get attack(){return this.mouse.left||this.mouse.right||this.keys.has("Space")||this.keys.has("KeyF")}}const Zt=new dg,Ye=40,Ii=3,cr={ridge:2.2,river:2.7};function ss(i){return function(){i|=0,i=i+1831565813|0;let e=Math.imul(i^i>>>15,1|i);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function as(i,e,t){let n=i*374761393+e*668265263+t*1442695;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}const Nc=i=>i*i*(3-2*i);function qs(i,e,t,n){const s=i/t,o=e/t,a=Math.floor(s),r=Math.floor(o),c=Nc(s-a),l=Nc(o-r),h=as(a,r,n),d=as(a+1,r,n),u=as(a,r+1,n),p=as(a+1,r+1,n);return h+(d-h)*c+(u+(p-u)*c-(h+(d-h)*c))*l}const lr=(i,e)=>{let t=(i-e)%(Math.PI*2);return t>Math.PI&&(t-=Math.PI*2),t<-Math.PI&&(t+=Math.PI*2),Math.abs(t)},Ui=220;class Cl{constructor(e,t=1337){this.scene=e,this.seed=t,this.chunks=new Map,this.fallingTrees=[],this.nextTreeId=1,this._statics=[],this._arena=null,this.obstacles=[],this.rings=[],this.lakes=[],this._lakeRegions=new Map,this._treasured=new Set,this.onIsland=null,this.onWoodLog=null,this._woodLogDrops=new Set,this._genRings(),this._genLakes(),this._buildGround(),this._buildRingRivers(),this._buildCave()}_addStatic(e){return this.scene.add(e),this._statics.push(e),e}dispose(){var e;for(const t of this._statics)this.scene.remove(t);this._statics=[];for(const t of this.chunks.values())this.scene.remove(t.group);this.chunks.clear();for(const t of this.fallingTrees)(e=t.mesh.parent)==null||e.remove(t.mesh);this.fallingTrees=[],this.removeArena(),this.obstacles=[],this.nextTreeId=1}reset(e){this.dispose(),this.seed=e,this.rings=[],this.lakes=[],this._lakeRegions.clear(),this._treasured.clear(),this._woodLogDrops.clear(),this._genRings(),this._genLakes(),this._buildGround(),this._buildRingRivers(),this._buildCave()}buildArena(e,t,n){this.removeArena();const s=new ge,o=ss(this.seed^687690),a=new ls(n+4,40);a.rotateX(-Math.PI/2);const r=a.attributes.position;for(let l=0;l<r.count;l++)r.setY(l,this.heightAt(e+r.getX(l),t+r.getZ(l))+.05);a.computeVertexNormals();const c=new Ce(a,new Ut({color:12756842}));c.receiveShadow=!0,c.position.set(e,0,t),s.add(c);for(let l=0;l<Math.PI*2;l+=.28){const h=e+Math.cos(l)*(n+1.2)+(o()-.5),d=t+Math.sin(l)*(n+1.2)+(o()-.5),u=Fi(1.6+o()*.9,9078136,o);u.position.set(h,this.heightAt(h,d)+.3,d),s.add(u)}this.scene.add(s),this._arena=s}removeArena(){this._arena&&(this.scene.remove(this._arena),this._arena=null)}heightAt(e,t){let n=qs(e,t,30,this.seed)*1.9+qs(e,t,10,this.seed+7)*.55-1.2;const s=Ct(e,t);return s<28&&(n*=Math.max(.1,(s-10)/18)),n}_genRings(){const e=ss(this.seed^24301),t=Nt.slice(0,-1).map(n=>n.rMax);this.rings=t.map((n,s)=>{const o=s%2===0?"ridge":"river",a=[],r=Math.max(2,Math.round(n/250));for(let c=0;c<r;c++){const l=(o==="river"?9:15)+e()*8;a.push({a:e()*Math.PI*2,w:l/n})}return{r:n,type:o,gaps:a}})}_genLakes(){}_regionLakes(e,t){const n=e+","+t;let s=this._lakeRegions.get(n);if(s)return s;s=[];const o=ss(this.seed^e*92821^t*68917^43438),a=o()<.55?1:o()<.4?2:0;for(let r=0;r<a;r++){const c=e*Ui+20+o()*(Ui-40),l=t*Ui+20+o()*(Ui-40),h=6+o()*12,d=Ct(c,l);if(d<70||d>Be.radius-30||this.rings.some(p=>Math.abs(d-p.r)<h+12))continue;const u=h>=14?{r:4.5}:null;s.push({x:c,z:l,r:h,island:u,id:n+":"+r})}return this._lakeRegions.set(n,s),s}lakesNear(e,t){const n=Math.floor(e/Ui),s=Math.floor(t/Ui),o=[];for(let a=-1;a<=1;a++)for(let r=-1;r<=1;r++)o.push(...this._regionLakes(n+a,s+r));return o}_buildRingRivers(){for(const e of this.rings){if(e.type!=="river")continue;const t=cr.river,n=Math.max(64,Math.min(4096,Math.round(e.r))),s=new fs(e.r-t,e.r+t,n,1);s.rotateX(-Math.PI/2);const o=s.attributes.position;for(let r=0;r<o.count;r++)o.setY(r,this.heightAt(o.getX(r),o.getZ(r))+.18);const a=new Ce(s,new Ut({color:4157342,transparent:!0,opacity:.88,side:jt}));this._addStatic(a);for(const r of e.gaps){const c=Math.sin(r.a)*e.r,l=Math.cos(r.a)*e.r,h=q0(Math.min(r.w*e.r-2,5),8.5);h.position.set(c,this.heightAt(c,l),l),h.rotation.y=Math.atan2(c,l),this._addStatic(h)}}}_buildCave(){const e=ss(this.seed^51790),t=Be.caveR,n=.62;for(let o=n;o<Math.PI*2-n;o+=1.7/t){const a=Math.sin(o)*t,r=Math.cos(o)*t,c=1.4+e()*.8,l=Fi(c,6051918,e);l.position.set(a,this.heightAt(a,r)+.3,r),this._addStatic(l),this.obstacles.push({x:a,z:r,r:c*.85})}for(let o=0;o<3;o++){const a=Math.PI*.6+e()*Math.PI*.8,r=3+e()*(t-5),c=Math.sin(a)*r,l=Math.cos(a)*r,h=U0(e);h.position.set(c,this.heightAt(c,l),l),this._addStatic(h)}const s=N0();s.position.set(2,this.heightAt(2,14),14),this._addStatic(s)}_groundColor(e,t,n){const s=Ct(e,t),o=ps(e,t),a=new Se(o.ground),r=new Se(o.ground2),c=new Se(o.dirt),l=qs(e,t,5,this.seed+21);n.copy(a).lerp(r,l);const h=qs(e,t,15,this.seed+13);h>.55&&n.lerp(c,Math.min(1,(h-.55)/.2));const d=Nt.indexOf(o);if(d<Nt.length-1){const p=o.rMax-s;if(p<24){const g=Nt[d+1],x=new Se(g.ground).lerp(new Se(g.ground2),l);n.lerp(x,.5-p/24*.5)}}s<Be.caveR+2.5&&n.lerp(new Se(2763302),Math.min(1,(Be.caveR+2.5-s)/3));const u=(as(Math.round(e*3),Math.round(t*3),this.seed+99)-.5)*.05;return n.offsetHSL(0,0,u),n}_buildGround(){const e=Be.radius*2+400,t=new qi(e,e,1,1);t.rotateX(-Math.PI/2);const n=new Ce(t,new Ut({color:2898468}));n.position.y=-2.6,this._addStatic(n)}_groundTile(e,t){const n=new qi(Ye,Ye,10,10);n.rotateX(-Math.PI/2),n.translate(e+Ye/2,0,t+Ye/2);const s=n.attributes.position,o=new Float32Array(s.count*3),a=new Se,r=new Se(1120014);for(let l=0;l<s.count;l++){const h=s.getX(l),d=s.getZ(l);s.setY(l,this.heightAt(h,d)),Ct(h,d)>Be.radius+6?a.copy(r):this._groundColor(h,d,a),o[l*3]=a.r,o[l*3+1]=a.g,o[l*3+2]=a.b}n.setAttribute("color",new sn(o,3)),n.computeVertexNormals();const c=new Ce(n,new Ut({vertexColors:!0}));return c.receiveShadow=!0,c}_chunkKey(e,t){return e+","+t}_place(e,t,n){return e.position.set(t,this.heightAt(t,n),n),e}isWater(e,t){for(const n of this.lakesNear(e,t)){const s=Math.hypot(e-n.x,t-n.z);if(s<n.r)return!(n.island&&s<n.island.r)}for(const n of this.rings){if(n.type!=="river")continue;const s=Ct(e,t);if(Math.abs(s-n.r)<cr.river){const o=Math.atan2(e,t);if(!n.gaps.some(a=>lr(o,a.a)<a.w/2))return!0}}return!1}_genChunk(e,t){var v;const n=this._chunkKey(e,t);if(this.chunks.has(n))return;const s=new ge,o=[],a=[],r=ss(this.seed^e*73856093^t*19349663),c=e*Ye,l=t*Ye,h=Ct(c+Ye/2,l+Ye/2),d=ps(c+Ye/2,l+Ye/2);s.add(this._groundTile(c,l));const u=this.lakesNear(c+Ye/2,l+Ye/2);for(const _ of u){if(_.x<c||_.x>=c+Ye||_.z<l||_.z>=l+Ye)continue;const E=new Ce(new ls(_.r,20),new Ut({color:4157342,transparent:!0,opacity:.85}));if(E.rotation.x=-Math.PI/2,E.position.set(_.x,this.heightAt(_.x,_.z)+.22,_.z),s.add(E),_.island){const R=new Ce(new ls(_.island.r+.8,14),new Ut({color:14206346}));R.rotation.x=-Math.PI/2,R.position.set(_.x,this.heightAt(_.x,_.z)+.28,_.z),s.add(R),this._treasured.has(_.id)||(this._treasured.add(_.id),(v=this.onIsland)==null||v.call(this,_))}}const p=(_,E)=>{const R=Ct(_,E);return!(R>Be.radius-3||R<14||_>-13&&_<16&&E>8&&E<24||this.rings.some(T=>Math.abs(R-T.r)<5)||u.some(T=>{const A=Math.hypot(_-T.x,E-T.z);return A<T.r+1.2&&!(T.island&&A<T.island.r)}))},g=Math.round((8+r()*8)*d.treeDensity);for(let _=0;_<g;_++){const E=c+r()*Ye,R=l+r()*Ye;if(!p(E,R))continue;const T=r()<.45?0:r()<.75?1:2,{mesh:A,radius:I}=bl(T,d,r);this._place(A,E,R),A.rotation.y=r()*Math.PI*2,s.add(A),o.push({id:this.nextTreeId++,mesh:A,x:E,z:R,radius:I,size:T,hp:[2,4,6][T],wood:[2,4,7][T],alive:!0,kind:"tree"})}const x=2+Math.floor(r()*3);for(let _=0;_<x;_++){const E=c+r()*Ye,R=l+r()*Ye;if(!p(E,R))continue;const T=r()<.6?0:1,A=T===0?.9+r()*.3:1.3+r()*.4,I=Fi(A,9079428,r);I.position.set(E,this.heightAt(E,R)+A*.25,R),s.add(I),a.push({id:this.nextTreeId++,mesh:I,x:E,z:R,radius:A*.9,hp:[3,5][T],stone:[3,6][T],alive:!0,kind:"rock"})}const m=(_,E)=>{for(let R=0;R<_;R++){const T=c+r()*Ye,A=l+r()*Ye;if(!p(T,A))continue;const I=E();this._place(I,T,A),I.rotation.y=r()*Math.PI*2,s.add(I)}};if(m(22+Math.floor(r()*12),()=>wl(d.grass,r)),m(2+Math.floor(r()*3),()=>Al(d.foliage[0],r)),m(1+Math.floor(r()*2),()=>Rl(r)),d.flowers&&m(2+Math.floor(r()*5),()=>Tl(r)),d.mushrooms&&m(1+Math.floor(r()*3),()=>Q0(r)),r()<.35){const _=c+r()*Ye,E=l+r()*Ye;if(p(_,E)){const R=`${n}:woodlog`;if(this.onWoodLog&&!this._woodLogDrops.has(R))this._woodLogDrops.add(R),this.onWoodLog({x:_,z:E});else if(!this.onWoodLog){const T=eg(d.trunk,r);this._place(T,_,E),T.rotation.y=r()*Math.PI*2,s.add(T)}}}const f=d.snowy?13161692:8552826;for(const _ of this.rings){if(_.type!=="ridge"||Math.abs(h-_.r)>Ye)continue;const E=Math.atan2(c+Ye/2,l+Ye/2),R=Ye*1.5/_.r;for(let T=E-R;T<E+R;T+=2.3/_.r){const A=Math.sin(T)*_.r,I=Math.cos(T)*_.r;if(A<c-2||A>c+Ye+2||I<l-2||I>l+Ye+2||_.gaps.some(V=>lr(T,V.a)<V.w/2+.6/_.r))continue;const S=A+(r()-.5)*1.2,w=I+(r()-.5)*1.8,U=Fi(1.5+r()*1.1,f,r);U.position.set(S,this.heightAt(S,w)+.35,w),s.add(U)}}if(Math.abs(h-Be.radius)<Ye*1.5){const _=Math.atan2(c+Ye/2,l+Ye/2),E=Ye*1.5/Be.radius;for(let R=_-E;R<_+E;R+=2.6/Be.radius){const T=Math.sin(R)*Be.radius,A=Math.cos(R)*Be.radius;if(T<c-4||T>c+Ye+4||A<l-4||A>l+Ye+4)continue;const I=Fi(1.9+r()*1.2,8157292,r);I.position.set(T,this.heightAt(T,A)+.3,A),s.add(I)}}this.scene.add(s),this.chunks.set(n,{group:s,trees:o,rocks:a})}update(e,t){var o;const n=Math.floor(t.x/Ye),s=Math.floor(t.z/Ye);for(let a=-Ii;a<=Ii;a++)for(let r=-Ii;r<=Ii;r++)this._genChunk(n+a,s+r);for(const[a,r]of this.chunks){const[c,l]=a.split(",").map(Number);(Math.abs(c-n)>Ii+1||Math.abs(l-s)>Ii+1)&&(this.scene.remove(r.group),this.chunks.delete(a))}for(let a=this.fallingTrees.length-1;a>=0;a--){const r=this.fallingTrees[a];r.t+=e;const c=Math.min(1,r.t/.9);r.kind==="rock"?(r.mesh.scale.setScalar(Math.max(.01,1-c)),r.mesh.position.y-=e*.8):(r.mesh.rotation.x=r.dirX*c*c*(Math.PI/2-.1),r.mesh.rotation.z=r.dirZ*c*c*(Math.PI/2-.1)),r.t>1.6&&((o=r.mesh.parent)==null||o.remove(r.mesh),this.fallingTrees.splice(a,1))}for(const a of this.chunks.values())for(const r of[...a.trees,...a.rocks])r.shake>0&&(r.shake-=e,r.mesh.rotation.z=Math.sin(r.shake*40)*.05*r.shake,r.shake<=0&&(r.mesh.rotation.z=0))}_near(e,t,n){const s=[],o=Math.floor(e.x/Ye),a=Math.floor(e.z/Ye);for(let r=-1;r<=1;r++)for(let c=-1;c<=1;c++){const l=this.chunks.get(this._chunkKey(o+r,a+c));if(l)for(const h of l[n]){if(!h.alive)continue;const d=h.x-e.x,u=h.z-e.z;d*d+u*u<(t+h.radius)**2&&s.push(h)}}return s}treesNear(e,t){return this._near(e,t,"trees")}rocksNear(e,t){return this._near(e,t,"rocks")}collide(e,t,n={}){const s=(a,r,c)=>{const l=e.x-a,h=e.z-r,d=l*l+h*h;if(d<c*c&&d>1e-6){const u=Math.sqrt(d);e.x=a+l/u*c,e.z=r+h/u*c}};for(const a of this.treesNear(e,t+.5))s(a.x,a.z,t+a.radius);for(const a of this.rocksNear(e,t+.5))s(a.x,a.z,t+a.radius);for(const a of this.obstacles)s(a.x,a.z,t+a.r);const o=Ct(e.x,e.z);for(const a of this.rings){if(n.boat&&a.type==="river")continue;const r=cr[a.type];if(Math.abs(o-a.r)>r+t)continue;const c=Math.atan2(e.x,e.z);if(a.gaps.some(d=>lr(c,d.a)<d.w/2))continue;const h=(a.r+(o>=a.r?1:-1)*(r+t))/(o||1);e.x*=h,e.z*=h}if(!n.boat)for(const a of this.lakesNear(e.x,e.z)){const r=Math.hypot(e.x-a.x,e.z-a.z);a.island&&r<a.island.r+t*.5||r<a.r+t&&s(a.x,a.z,t+a.r)}return e}clampToBand(e,t,n,s,o=5){const a=Ct(n,s);let r=20,c=Be.radius-5;for(const d of this.rings)d.r<a&&d.r+o>r&&(r=d.r+o),d.r>=a&&d.r-o<c&&(c=d.r-o);const l=Ct(e,t)||1,h=Math.max(r,Math.min(c,l));return{x:e*(h/l),z:t*(h/l)}}chop(e,t,n){if(e.hp-=t,e.shake=.35,le.sfx("base_hit",.4),e.hp>0)return 0;e.alive=!1;const s=e.x-n.x,o=e.z-n.z,a=Math.hypot(s,o)||1;return this.fallingTrees.push({mesh:e.mesh,t:0,dirX:o/a,dirZ:s/a,kind:"tree"}),le.sfx("tower_build",.55),e.wood}mineRock(e,t,n){return e.hp-=t,e.shake=.3,le.sfx("base_hit",.5),e.hp>0?0:(e.alive=!1,this.fallingTrees.push({mesh:e.mesh,t:0,dirX:0,dirZ:0,kind:"rock"}),le.sfx("tower_build",.5),e.stone)}}const Ni=Nt[0];function ug(i,e,t){let n=1/0;for(let s=0;s<t.length-1;s++){const[o,a]=t[s],[r,c]=t[s+1],l=r-o,h=c-a,d=l*l+h*h||1;let u=((i-o)*l+(e-a)*h)/d;u=Math.max(0,Math.min(1,u));const p=o+l*u,g=a+h*u;n=Math.min(n,Math.hypot(i-p,e-g))}return n}function hr(i,e){let t=1/0;for(const n of Object.values(Ze.lanes))t=Math.min(t,ug(i,e,n));return t}function js(i,e){const t=Ze.lanes[i],n=[];let s=0;for(let a=0;a<t.length-1;a++){const r=Math.hypot(t[a+1][0]-t[a][0],t[a+1][1]-t[a][1]);n.push(r),s+=r}let o=e*s;for(let a=0;a<n.length;a++){if(o<=n[a]){const r=o/n[a];return{x:t[a][0]+(t[a+1][0]-t[a][0])*r,z:t[a][1]+(t[a+1][1]-t[a][1])*r}}o-=n[a]}return{x:t[t.length-1][0],z:t[t.length-1][1]}}const dr=(i,e)=>Math.min(Math.hypot(i-Ze.basePos.player.x,e-Ze.basePos.player.z),Math.hypot(i-Ze.basePos.enemy.x,e-Ze.basePos.enemy.z)),fg=(i,e)=>Math.min(...Ze.camps.map(t=>Math.hypot(i-t.x,e-t.z)));class pg extends Cl{heightAt(e,t){let n=super.heightAt(e,t)*.5;const s=Math.min(hr(e,t)/6,dr(e,t)/Ze.baseR,1);return n*Math.max(.1,Math.min(1,s))}_genRings(){this.rings=[]}_genLakes(){this.lakes=[]}lakesNear(){return[]}_buildRingRivers(){}_buildCave(){}_buildGround(){const e=Ze.half*2+40,t=Math.round(e/3),n=new qi(e,e,t,t);n.rotateX(-Math.PI/2);const s=n.attributes.position,o=new Float32Array(s.count*3),a=new Se,r=new Se(Ni.ground),c=new Se(Ni.ground2),l=new Se(Ni.dirt),h=new Se(9407100);for(let p=0;p<s.count;p++){const g=s.getX(p),x=s.getZ(p);s.setY(p,this.heightAt(g,x));const m=(Math.sin(g*.37)*Math.cos(x*.31)+1)/2;a.copy(r).lerp(c,m);const f=hr(g,x);f<4.5&&a.lerp(l,Math.min(1,(4.5-f)/2.2));const v=dr(g,x);v<Ze.baseR&&a.lerp(h,Math.min(1,(Ze.baseR-v)/6)),o[p*3]=a.r,o[p*3+1]=a.g,o[p*3+2]=a.b}n.setAttribute("color",new sn(o,3)),n.computeVertexNormals();const d=new Ce(n,new Ut({vertexColors:!0}));d.receiveShadow=!0,this._addStatic(d);const u=()=>Math.abs(Math.sin(this.seed+this._statics.length*13.7))%1;for(let p=0;p<Math.PI*2;p+=.05){const g=Ze.half+3,x=Math.cos(p)*g*1.02,m=Math.sin(p)*g*1.02;if(Math.abs(x)>Ze.half+8||Math.abs(m)>Ze.half+8)continue;const f=Fi(1.8+u()*1.2,8157292,u);f.position.set(x,this.heightAt(x,m)+.3,m),this._addStatic(f)}}_genChunk(e,t){const n=this._chunkKey(e,t);if(this.chunks.has(n))return;const s=new ge,o=[];let a=this.seed^e*73856093^t*19349663;const r=()=>{a|=0,a=a+1831565813|0;let u=Math.imul(a^a>>>15,1|a);return u=u+Math.imul(u^u>>>7,61|u)^u,((u^u>>>14)>>>0)/4294967296},c=40,l=e*c,h=t*c,d=(u,p,g)=>Math.abs(u)<Ze.half-2&&Math.abs(p)<Ze.half-2&&hr(u,p)>g&&dr(u,p)>Ze.baseR+2&&fg(u,p)>6;for(let u=0;u<16;u++){const p=l+r()*c,g=h+r()*c;if(!d(p,g,5))continue;const x=r()<.4?0:r()<.75?1:2,{mesh:m,radius:f}=bl(x,Ni,r);m.position.set(p,this.heightAt(p,g),g),m.rotation.y=r()*Math.PI*2,s.add(m),o.push({id:this.nextTreeId++,mesh:m,x:p,z:g,radius:f,size:x,hp:[2,4,6][x],wood:[2,4,7][x],alive:!0})}for(let u=0;u<14;u++){const p=l+r()*c,g=h+r()*c;if(!d(p,g,2.5))continue;const x=r(),m=x<.55?wl(Ni.grass,r):x<.75?Al(Ni.foliage[0],r):x<.9?Tl(r):Rl(r);m.position.set(p,this.heightAt(p,g),g),m.rotation.y=r()*Math.PI*2,s.add(m)}this.scene.add(s),this.chunks.set(n,{group:s,trees:o,rocks:[]})}clampToSection(e){return e}}let mg=1;const gg=["mid","top","bot"],Fc=9.5,_g=i=>i==="player"?"enemy":"player";function Oc(){return{dens:{mid:0,top:0,bot:0},towers:{mid:0,top:0,bot:0},forge:0,lodge:0,walls:0}}class Ll{constructor(e,t,n,s,o,a,r){this.scene=e,this.world=t,this.player=n,this.projectiles=s,this.pickups=o,this.ui=a,this.hooks=r,this.teams={player:Oc(),enemy:Oc()},this.units=[],this.time=0,this.waveT=8,this.incomeT=10,this.aiDone=new Set,this.aiEnabled=!0,this.heroes=[],t.obstacles=[],this.bases={};for(const c of["player","enemy"]){const l=Ze.basePos[c],h=V0(ar[c]),d=this._makeUnit({kind:"base",team:c,type:"base",mesh:h,x:l.x,z:l.z,hp:Ze.baseHp,dmg:0,speed:0,range:0,hitR:Fc});this.bases[c]=d,t.obstacles.push({x:l.x,z:l.z,r:Fc})}this.camps=Ze.camps.map(c=>({cfg:c,unitIds:[],respawnT:0}));for(const c of this.camps)this._spawnCamp(c);this._hutCount={player:0,enemy:0}}_makeUnit({kind:e,team:t,type:n,mesh:s,x:o,z:a,hp:r,dmg:c,speed:l,range:h,hitR:d,cd:u=1,xp:p=0,meat:g=0,lane:x=null,camp:m=null,cfg:f=null}){const v={id:mg++,kind:e,team:t,type:n,cfg:f,pos:new P(o,0,a),mesh:s,hp:r,maxHp:r,dmg:c,speed:l,range:h,hitR:d,attackCd:0,atkInterval:u,xp:p,meat:g,lane:x,wp:0,camp:m,stunT:0,dying:0,walkT:Math.random()*10,lastHitBy:null,spellT:2};return s.position.set(o,this.world.heightAt(o,a),a),this.scene.add(s),this.units.push(v),e!=="base"?this._addHpTracker(v):this._addHpTracker(v,3.5,64),v}_addHpTracker(e,t=null,n=null){const s=t??(e.kind==="tower"?5.4:1.9);this.ui.addTracker("mu"+e.id,()=>e.mesh.parent&&!e.dying?e.mesh.position.clone().setY(e.mesh.position.y+s):null,`<div class="hpbar"${n?` style="width:${n}px"`:""}><div class="hpbar-fill"></div></div>`,"hpwrap",o=>{const a=Math.max(0,e.hp/e.maxHp),r=o.firstChild.firstChild;r.style.width=a*100+"%",r.style.background=e.team==="player"?"#5fa8e0":e.team==="enemy"?"#e05050":"#e0c040"})}_spawnCamp(e){var t,n;e.unitIds=[];for(let s=0;s<e.cfg.types.length;s++){const o=e.cfg.types[s],a=go[o],r=s/e.cfg.types.length*Math.PI*2,c=this._makeUnit({kind:"neutral",team:"neutral",type:o,cfg:a,mesh:Pr(o),x:e.cfg.x+Math.cos(r)*2,z:e.cfg.z+Math.sin(r)*2,hp:a.hp*1.4,dmg:a.meleeDmg??a.dmg,speed:a.speed,range:a.range,hitR:a.hitR,cd:a.attackCd,xp:a.xp,meat:Cr(a.hp*1.4),camp:e});e.unitIds.push(c.id),(n=(t=this.hooks).discover)==null||n.call(t,o)}}_spawnCreep(e,t,n){const s=this.teams[e],o=g0[n],a=1+.15*s.forge,r=js(t,e==="player"?.04:.96),c=e==="player"&&n==="wolf"?ao("tame"):Pr(n),l=xo(ar[e]);l.position.set(0,n==="bear"?1.4:1,.3),c.add(l),this._makeUnit({kind:"creep",team:e,type:n,mesh:c,x:r.x+(Math.random()-.5)*2,z:r.z+(Math.random()-.5)*2,hp:o.hp*a,dmg:o.dmg*a,speed:o.speed,range:o.range,hitR:o.hitR,cd:o.cd,xp:o.xp,meat:Cr(o.hp*a),lane:t})}buildingInfo(e,t,n){const s=this.teams[e],o=yl.find(r=>r.id===t),a=t==="den"?s.dens[n]:t==="tower"?s.towers[n]:s[t];return{def:o,level:a,maxed:a>=o.max,cost:a>=o.max?null:o.cost(a+1)}}build(e,t,n=null){var c,l;if(this.buildingInfo(e,t,n).maxed)return!1;const o=this.teams[e],a=ar[e],r=Ze.basePos[e];if(t==="den"){if(o.dens[n]++,o.dens[n]===1){const h=js(n,e==="player"?.03:.97),d=W0(a);d.position.set(h.x,this.world.heightAt(h.x,h.z),h.z),this.scene.add(d),this.world.obstacles.push({x:h.x,z:h.z,r:1.6})}}else if(t==="tower"){const h=o.towers[n]++,d=Ze.towerSlotsT[h],u=js(n,e==="player"?d:1-d),p=4,g=El(a),x=u.x+(n==="bot"?-p:p)*(e==="player"?1:-1)*.7,m=u.z+(n==="top"?p:-p)*(e==="player"?1:-1)*.7;this._makeUnit({kind:"tower",team:e,type:"tower",mesh:g,x,z:m,hp:Ze.tower.hp,dmg:Ze.tower.dmg,speed:0,range:Ze.tower.range,hitR:1.4,cd:Ze.tower.cd,lane:n}),this.world.obstacles.push({x,z:m,r:1.5})}else{if(o[t]++,t==="walls"){const x=this.bases[e];x.maxHp+=500,x.hp=Math.min(x.maxHp,x.hp+250)}const h=this._hutCount[e]++,d=Math.PI/4+h*.7+(e==="enemy"?Math.PI:0),u=r.x+Math.cos(d)*11,p=r.z+Math.sin(d)*11,g=X0(t==="forge"?6052966:t==="lodge"?7232042:9078136);g.position.set(u,this.world.heightAt(u,p),p),this.scene.add(g)}return le.sfx("tower_build",.5),(l=(c=this.hooks).onBuilt)==null||l.call(c,e,t,n),!0}hostileMgr(e="player"){const t=this;return{alive:()=>t.units.filter(n=>!n.dying&&n.team!==e),damage:(n,s,o,a="local")=>t.damageUnit(n,s,a),stun:(n,s)=>{(n.kind==="creep"||n.kind==="neutral")&&(n.stunT=Math.max(n.stunT,s))},list:this.units}}damageUnit(e,t,n=null){e.dying||(e.hp-=t,n&&(e.lastHitBy=n),this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y+(e.kind==="tower"?4.5:1.4)),Math.round(t).toString(),"#ffffff"),le.sfx("hit",.2,120),e.hp<=0&&this._killUnit(e))}_killUnit(e){var t,n,s,o;e.dying=1e-4,this.ui.removeTracker("mu"+e.id),le.sfx(e.kind==="tower"||e.kind==="base"?"base_hit":"death",.4,60),e.lastHitBy==="local"?(n=(t=this.hooks).rewardLocal)==null||n.call(t,e.xp,e.meat,e.pos):e.lastHitBy==="partner"&&((o=(s=this.hooks).rewardPartner)==null||o.call(s,e.xp,e.meat,e.pos)),e.kind==="neutral"&&e.camp&&(e.camp.respawnT=e.camp.cfg.respawn),e.kind==="base"&&this.hooks.onEnd(e.team==="enemy")}update(e,t){if(this.time+=e,this.heroes=t,this.aiEnabled)for(let n=0;n<Dc.length;n++){const[s,o,a]=Dc[n];this.time>=s&&!this.aiDone.has(n)&&(this.aiDone.add(n),this.build("enemy",o,a))}if(this.waveT-=e,this.waveT<=0){this.waveT=Ze.waveInterval;let n=!1;for(const s of["player","enemy"])for(const o of gg){const a=this.teams[s].dens[o];if(a>0&&this.units.filter(r=>r.kind==="creep"&&r.team===s).length<26){for(const r of _0[a-1])this._spawnCreep(s,o,r);n=!0}}n&&le.sfx("spawn",.4)}if(this.incomeT-=e,this.incomeT<=0){this.incomeT=10;const n=this.teams.player.lodge*2;n>0&&(this.player.meat=Dt(this.player.meat+n),this.hooks.popup(this.player.mesh.position.clone().setY(this.player.mesh.position.y+2.2),`+${n} 🍖`,"#ff9d76"))}for(const n of this.camps)n.respawnT>0&&!this.units.some(s=>n.unitIds.includes(s.id)&&!s.dying)&&(n.respawnT-=e,n.respawnT<=0&&this._spawnCamp(n));this._updateUnits(e)}_heroTargets(e){return this.heroes.filter(t=>t.team!==e&&!t.obj.dead).map(t=>t.obj)}_updateUnits(e){for(let t=this.units.length-1;t>=0;t--){const n=this.units[t];if(n.dying){n.dying+=e,n.kind==="tower"||n.kind==="base"?(n.mesh.position.y-=e*2.2,n.mesh.rotation.z+=e*.3):(n.mesh.rotation.z=Math.min(Math.PI/2,n.dying*4),n.mesh.position.y-=Math.max(0,n.dying-.5)*e*2),n.dying>1.1&&(this.scene.remove(n.mesh),this.units.splice(t,1));continue}if(n.kind!=="base"){if(n.stunT>0){n.stunT-=e;continue}if(n.attackCd-=e,n.kind==="tower"){this._towerAI(n);continue}if(n.kind==="neutral"){this._neutralAI(n,e);continue}this._creepAI(n,e)}}}_nearestEnemyOf(e,t,n=!0){let s=null,o=t;for(const a of this.units){if(a.dying||a.team===e.team||a.team==="neutral")continue;const r=e.pos.distanceTo(a.pos)-a.hitR;r<o&&(o=r,s=a)}if(n)for(const a of this._heroTargets(e.team)){const r=e.pos.distanceTo(a.pos)-.6;r<o&&(o=r,s={hero:a,pos:a.pos,hitR:.6})}return s}_attack(e,t){e.attackCd=e.atkInterval,e.lungeT=.2,t.hero?t.hero.takeDamage(e.dmg,{pos:e.pos,range:e.range}):this.damageUnit(t,e.dmg,(e.team==="player",null))}_moveUnit(e,t,n,s,o=1){const a=t-e.pos.x,r=n-e.pos.z,c=Math.hypot(a,r)||1;e.pos.x+=a/c*e.speed*o*s,e.pos.z+=r/c*e.speed*o*s,this.world.collide(e.pos,.4),e.walkT+=s*e.speed*o,e.mesh.rotation.y=Math.atan2(a,r)+Math.PI}_animateUnit(e,t){var o;const n=e.mesh.userData;(n.legs||[]).forEach((a,r)=>{a.rotation.x=Math.sin(e.walkT*2.2+r%2*Math.PI)*(n.spider?.3:.6)}),(n.wings||[]).forEach((a,r)=>{a.rotation.z=Math.sin(e.walkT*6+r*Math.PI)*.55}),(n.segments||[]).forEach((a,r)=>{a.position.x=Math.sin(e.walkT*2.4+r*1.1)*.13});const s=(o=e.cfg)!=null&&o.flying?1.5:0;e.mesh.position.set(e.pos.x,this.world.heightAt(e.pos.x,e.pos.z)+s,e.pos.z)}_creepAI(e,t){const n=this._nearestEnemyOf(e,9);if(n)e.pos.distanceTo(n.pos)>e.range+n.hitR?this._moveUnit(e,n.pos.x,n.pos.z,t):e.attackCd<=0&&this._attack(e,n);else{const s=Ze.lanes[e.lane],o=e.team==="player"?s:[...s].reverse();if(e.wp<o.length){const[a,r]=o[e.wp];Math.hypot(e.pos.x-a,e.pos.z-r)<3?e.wp++:this._moveUnit(e,a,r,t)}else{const a=this.bases[_g(e.team)];e.pos.distanceTo(a.pos)>e.range+a.hitR?this._moveUnit(e,a.pos.x,a.pos.z,t):e.attackCd<=0&&this._attack(e,a)}}this._animateUnit(e,t)}_neutralAI(e,t){var c;const n=e.camp.cfg,s=this._heroTargets("neutral");let o=null,a=11;for(const l of s){const h=e.pos.distanceTo(l.pos);h<a&&(a=h,o=l)}const r=Math.hypot(e.pos.x-n.x,e.pos.z-n.z);if(r>22||!o&&r>2)this._moveUnit(e,n.x,n.z,t,1.3),e.hp=Math.min(e.maxHp,e.hp+e.maxHp*t*.3);else if(o){const l=e.pos.distanceTo(o.pos);(c=e.cfg)!=null&&c.ranged&&(e.spellT-=t,l<e.cfg.shootRange&&e.spellT<=0&&(e.spellT=e.cfg.spellCd,this.projectiles.spawnEnemyShot(e.mesh.position.clone().setY(e.mesh.position.y+.8),o,{dmg:e.cfg.dmg,speed:e.cfg.projectileSpeed,color:e.cfg.shotColor,stun:e.cfg.stun||0}),le.sfx("attack_ranged",.15,250))),l>e.range+.6?this._moveUnit(e,o.pos.x,o.pos.z,t):e.attackCd<=0&&(e.attackCd=e.atkInterval,o.takeDamage(e.dmg))}this._animateUnit(e,t)}_towerAI(e){if(e.attackCd>0)return;const t=this._nearestEnemyOf(e,e.range);if(!t)return;e.attackCd=e.atkInterval;const n=e.mesh.position.clone().setY(e.mesh.position.y+4.7),s=t.hero?{pos:t.pos,mesh:{position:t.pos},dying:!1,hitR:.6}:t;this.projectiles.spawnBolt(n,s,{dmg:e.dmg,onHit:()=>t.hero?t.hero.takeDamage(e.dmg,{pos:t.pos,range:1.6}):this.damageUnit(t,e.dmg)}),le.sfx("attack_ranged",.18,200)}statusLine(){const e=this.bases.player,t=this.bases.enemy,n=Math.max(0,Math.ceil(this.waveT));return`🏰 ${Math.max(0,Math.round(e.hp))}/${e.maxHp} · Enemy 🏰 ${Math.max(0,Math.round(t.hp))}/${t.maxHp} · Wave in ${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`}snapshot(){return this.units.filter(e=>!e.dying).map(e=>({id:e.id,k:e.kind,t:e.type,tm:e.team,x:+e.pos.x.toFixed(1),z:+e.pos.z.toFixed(1),hp:Math.round(e.hp),m:Math.round(e.maxHp),ln:e.lane||0}))}dispose(){for(const e of this.units)this.scene.remove(e.mesh),this.ui.removeTracker("mu"+e.id);this.units=[],this.world.obstacles=[]}}class xg{constructor(e,t){this.hooks=t,this.scene=e,this.mesh=x0(),e.add(this.mesh),this.slashes=[],this.levelFx=[],this.pos=new P(0,0,0),this.facing=new P(0,0,-1),this.hp=100,this.xp=0,this.level=1,this.meat=0,this.wood=0,this.stone=0,this.hide=0,this.iron=0,this.kills=0,this.campBonus=0,this.itemsOwned=new Set(["fists"]),this.equipment={weapon:"fists",head:null,chest:null,boots:null,pet:null,orb:null},this.stats={range:0,power:0,swift:0},this.spellsOwned=new Set,this.spellSlots=[],this.spellCds={},this.hasteT=0,this.rageT=0,this.dashT=0,this.dashDir=new P,this.dashHit=new Set,this.dashSpec=null,this.attackCd=0,this.attackT=0,this.attackDur=.3,this.stunT=0,this.walkT=0,this.dead=!1,this.hintedAxe=!1,this.recompute()}hasItem(e){return this.itemsOwned.has(e)}ownItem(e,t=!0){if(this.itemsOwned.has(e))return!1;this.itemsOwned.add(e);const n=an(e);return t&&(!this.equipment[n.slot]||this.equipment[n.slot]==="fists")&&this.equip(e),!0}equip(e){var n,s;const t=an(e);!t||!this.itemsOwned.has(e)||(this.equipment[t.slot]=e,this.recompute(),(s=(n=this.hooks).onEquipChange)==null||s.call(n,t.slot))}unequip(e){var t,n;e==="weapon"?this.equipment.weapon="fists":this.equipment[e]=null,this.recompute(),(n=(t=this.hooks).onEquipChange)==null||n.call(t,e)}cycleWeapon(){const e=["fists",...[...this.itemsOwned].filter(s=>{var o;return s!=="fists"&&((o=an(s))==null?void 0:o.slot)==="weapon"})];if(e.length<2)return;const t=e.indexOf(this.equipment.weapon),n=e[(t+1)%e.length];this.equip(n),le.sfx("click",.4),this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y+2.4),`${an(n).icon} ${an(n).name}`,"#ffe9a8")}ownSpell(e){return this.spellsOwned.has(e)?!1:(this.spellsOwned.add(e),this.spellSlots.length<ro&&this.spellSlots.push(e),!0)}toggleSpellSlot(e){const t=this.spellSlots.indexOf(e);t>=0?this.spellSlots.splice(t,1):this.spellsOwned.has(e)&&this.spellSlots.length<ro&&this.spellSlots.push(e)}castSpell(e,t){const n=this.spellSlots[e];if(!n||this.dead||this.stunT>0)return;if((this.spellCds[n]||0)>0){le.sfx("error",.35,300);return}const s=_o(n);this.spellCds[n]=s.cd,le.sfx("special",.45);const{enemyMgr:o}=t;switch(n){case"haste":this.hasteT=10;break;case"rage":this.rageT=12;break;case"heal":this.hp=Math.min(this.maxHp,this.hp+50),this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y+2.2),"+50 ❤️","#7fe07f");break;case"powerDash":case"stunDash":this.dashT=.28,this.dashDir.copy(this.facing),this.dashHit.clear(),this.dashSpec=n==="stunDash"?{dmg:30,stun:3}:{dmg:40,stun:0};break;case"shockwave":for(const a of o.alive())if(a.pos.distanceTo(this.pos)<6.5){const c=new P().subVectors(a.pos,this.pos).normalize();a.pos.addScaledVector(c,4),o.damage(a,this.dmgMult*25,null)}break;case"frostNova":for(const a of o.alive())a.pos.distanceTo(this.pos)<7&&o.stun(a,4);break}}recompute(){var r,c,l,h,d;const e=u=>an(this.equipment[u]),t=this.maxHp||100;let n=100,s=1;for(const u of["head","chest","boots"]){const p=e(u);(r=p==null?void 0:p.stats)!=null&&r.hp&&(n+=p.stats.hp),(c=p==null?void 0:p.stats)!=null&&c.speed&&(s+=p.stats.speed)}this.maxHp=n+(this.campBonus||0),this.maxHp>t&&(this.hp+=this.maxHp-t),this.hp=Math.min(this.hp,this.maxHp),this.speed=8.5*s;const o=((l=e("weapon"))==null?void 0:l.weapon)||an("fists").weapon,a=this.stats;this.weapon={...o,dmg:o.dmg*(1+.05*a.power),cd:o.cd*(1-.04*a.swift),range:o.range+(o.kind==="bow"?2:.1)*a.range},this.attackRange=this.weapon.range,this.pet=((h=e("pet"))==null?void 0:h.pet)||null,this.orb=((d=e("orb"))==null?void 0:d.orb)||null,this._refreshWeaponMeshes(),this._refreshOutfit()}_refreshOutfit(){const e=this.mesh.userData;if(!e.torso)return;const t={leatherArmor:9067051,furCoat:7232064,bearHide:4864554},n={leatherCap:9067051,furHood:7232064,bearHelm:12107462},s=14262374,o=this.equipment.chest,a=o?t[o]??8016432:s;for(const c of[e.torso,e.armL,e.armR])c.material=new Ut({color:a});e.leaf.visible=!o,e.capSlot.clear();const r=this.equipment.head;if(r){const c=new Ce(new Ot(.38,.14,.38),new Ut({color:n[r]??9067051}));e.capSlot.add(c),e.hair.visible=!1}else e.hair.visible=!0}applyStun(e){var t,n;this.dead||(this.stunT=Math.max(this.stunT,e),this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y+2.3),"⚡ Stunned!","#ffe94a"),(n=(t=this.hooks).onHurt)==null||n.call(t))}get dmgMult(){return this.rageT>0?1.5:1}get cdMult(){return this.hasteT>0?.5:1}_refreshWeaponMeshes(){const{rightSocket:e,leftSocket:t}=this.mesh.userData;if(e.clear(),t.clear(),this.weapon.kind==="melee"&&this.weapon.tier>0){const n=v0(this.weapon.tier);n.rotation.x=-.2,e.add(n)}this.weapon.kind==="bow"&&t.add(M0(this.weapon.tier))}addXp(e){for(this.xp+=e;this.level<Lr&&this.xp>=rs[this.level+1];)this.level++,this.hooks.onLevelUp(this.level)}xpProgress(){if(this.level>=Lr)return 1;const e=rs[this.level],t=rs[this.level+1];return(this.xp-e)/(t-e)}takeDamage(e){var t,n;this.dead||(this.hp-=e,le.sfx("hit",.45,120),(n=(t=this.hooks).onHurt)==null||n.call(t),this.hp<=0&&(this.hp=0,this.dead=!0,this.hooks.onDeath()))}update(e,t){var l;const{input:n,world:s,enemyMgr:o,projectiles:a,aimPoint:r}=t;if(this._updateLevelFx(e),this.dead)return;this.hasteT=Math.max(0,this.hasteT-e),this.rageT=Math.max(0,this.rageT-e);for(const h in this.spellCds)this.spellCds[h]=Math.max(0,this.spellCds[h]-e);if(this.stunT>0){this.stunT-=e,this.mesh.position.set(this.pos.x,s.heightAt(this.pos.x,this.pos.z),this.pos.z),this.attackCd-=e,this._updateSlashes(e);return}let c=!1;if(this.dashT>0){this.dashT-=e,this.pos.addScaledVector(this.dashDir,34*e),s.collide(this.pos,.45,{boat:t.boat}),this._applyBounds(t);for(const h of o.alive())this.dashHit.has(h.id)||h.pos.distanceTo(this.pos)<1.7+h.hitR&&(this.dashHit.add(h.id),this.dashSpec.stun&&o.stun(h,this.dashSpec.stun),o.damage(h,this.dmgMult*this.dashSpec.dmg,this.dashDir));c=!0,this.walkT+=e*20}else{let h=n.moveX,d=n.moveZ;if(t.mouseMove&&(h!==0||d!==0)){const u=r.x-this.pos.x,p=r.z-this.pos.z,g=Math.hypot(u,p);if(g>.01){const x=u/g,m=p/g,f=-d,v=h;h=x*f-m*v,d=m*f+x*v}}if(c=h!==0||d!==0,c){const u=Math.hypot(h,d);h/=u,d/=u;const p=t.boat&&((l=s.isWater)==null?void 0:l.call(s,this.pos.x,this.pos.z)),g=this.speed*(p?.85:1);this.pos.x+=h*g*e,this.pos.z+=d*g*e,s.collide(this.pos,.45,{boat:t.boat}),this._applyBounds(t),this.walkT+=e*g}}this.facing.set(r.x-this.pos.x,0,r.z-this.pos.z),this.facing.lengthSq()<.01&&this.facing.set(0,0,-1),this.facing.normalize(),this.mesh.position.set(this.pos.x,s.heightAt(this.pos.x,this.pos.z),this.pos.z),this.mesh.rotation.y=Math.atan2(this.facing.x,this.facing.z),this.attackCd-=e,n.attack&&this.attackCd<=0&&this.dashT<=0&&(this.weapon.kind==="bow"?this._doShoot(a):this._doMelee(s,o,t.pickups)),this._animate(e,c),this._updateSlashes(e)}_clampToWorld(){const e=Math.hypot(this.pos.x,this.pos.z),t=Be.radius-2;if(e>t){const n=t/e;this.pos.x*=n,this.pos.z*=n}}_applyBounds(e){const t=e.arenaZone;if(t){const n=this.pos.x-t.x,s=this.pos.z-t.z,o=Math.hypot(n,s),a=t.r-.6;o>a&&(this.pos.x=t.x+n/o*a,this.pos.z=t.z+s/o*a);return}if(e.mobaBounds){const n=e.mobaBounds-1;this.pos.x=Math.max(-n,Math.min(n,this.pos.x)),this.pos.z=Math.max(-n,Math.min(n,this.pos.z));return}this._clampToWorld()}revive(e=1){this.dead=!1,this.hp=Math.max(1,Math.round(this.maxHp*e)),this.stunT=0,this.dashT=0,this.mesh.rotation.z=0}loseLevel(){this.level>1&&this.level--,this.xp=rs[this.level]}_inArc(e,t,n,s=0){const o=e-this.pos.x,a=t-this.pos.z,r=Math.hypot(o,a);return r>n+s?!1:r<.4?!0:o/r*this.facing.x+a/r*this.facing.z>.45}_spawnSlash(){const e=this.weapon.range,t=new fs(e*.4,e,14,1,Math.PI/2-1.1,2.2);t.rotateX(Math.PI/2);const n=new Ht({color:this.weapon.tier>0?16767370:16777215,transparent:!0,opacity:.7,side:jt,depthWrite:!1}),s=new Ce(t,n),o=Math.atan2(this.facing.x,this.facing.z);s.position.set(this.pos.x,this.mesh.position.y+.85,this.pos.z),s.rotation.y=o-.5,this.scene.add(s),this.slashes.push({mesh:s,baseRy:o,t:0,life:.2})}spawnLevelUpEffect(){const e=this.pos.x,t=this.pos.z,n=this.mesh.position.y,s=16765514,o=16773808;for(let l=0;l<2;l++){const h=new fs(.5,.75,40);h.rotateX(-Math.PI/2);const d=new Ht({color:l?o:s,transparent:!0,opacity:.85,side:jt,depthWrite:!1}),u=new Ce(h,d);u.position.set(e,n+.06,t),this.scene.add(u),this.levelFx.push({mesh:u,t:0,life:.75,delay:l*.12,kind:"ring"})}const a=new vs(.7,.7,4.5,20,1,!0),r=new Ht({color:s,transparent:!0,opacity:.5,side:jt,depthWrite:!1}),c=new Ce(a,r);c.position.set(e,n+2.25,t),this.scene.add(c),this.levelFx.push({mesh:c,t:0,life:.7,delay:0,kind:"column"});for(let l=0;l<16;l++){const h=new Ce(new Ot(.11,.11,.11),new Ht({color:l%2?o:s,transparent:!0,opacity:1,depthWrite:!1})),d=l/16*Math.PI*2+Math.random()*.3,u=3+Math.random()*3.5;h.position.set(e,n+.4,t),this.scene.add(h),this.levelFx.push({mesh:h,t:0,life:.6+Math.random()*.3,delay:0,kind:"spark",vel:new P(Math.cos(d)*u,6+Math.random()*3,Math.sin(d)*u)})}}_updateLevelFx(e){for(let t=this.levelFx.length-1;t>=0;t--){const n=this.levelFx[t];if(n.delay>0){n.delay-=e;continue}n.t+=e;const s=Math.min(1,n.t/n.life),o=n.mesh;if(n.kind==="ring"){const a=.4+s*3.2;o.scale.set(a,1,a),o.material.opacity=.85*(1-s)}else n.kind==="column"?(o.scale.set(1+s*.4,1,1+s*.4),o.position.y+=e*1.5,o.material.opacity=.5*(1-s)):(n.vel.y-=16*e,o.position.addScaledVector(n.vel,e),o.rotation.x+=e*8,o.rotation.y+=e*6,o.material.opacity=1-s);n.t>=n.life&&(this.scene.remove(o),o.geometry.dispose(),o.material.dispose(),this.levelFx.splice(t,1))}}_updateSlashes(e){for(let t=this.slashes.length-1;t>=0;t--){const n=this.slashes[t];n.t+=e;const s=Math.min(1,n.t/n.life);n.mesh.rotation.y=n.baseRy-.5+s*1.1,n.mesh.material.opacity=.7*(1-s),n.mesh.scale.setScalar(.92+s*.08),n.t>=n.life&&(this.scene.remove(n.mesh),n.mesh.geometry.dispose(),n.mesh.material.dispose(),this.slashes.splice(t,1))}}_doMelee(e,t,n){var a,r,c,l;const s=this.weapon;this.attackCd=s.cd*this.cdMult,this.attackDur=Math.min(.34,s.cd*.8),this.attackT=this.attackDur,this._spawnSlash(),le.sfx("attack_melee",.4);for(const h of t.alive())this._inArc(h.pos.x,h.pos.z,s.range,h.hitR)&&t.damage(h,this.dmgMult*s.dmg,this.facing);const o=e.treesNear(this.pos,s.range+.6).filter(h=>this._inArc(h.x,h.z,s.range,h.radius)).sort((h,d)=>(h.x-this.pos.x)**2+(h.z-this.pos.z)**2-((d.x-this.pos.x)**2+(d.z-this.pos.z)**2));if(o.length&&s.chop>0){const h=o[0],d=e.chop(h,s.chop,this.pos);if((r=(a=this.hooks).onChop)==null||r.call(a,h,s.chop),d>0){const u=new P(h.x,0,h.z),p=Math.min(3,Math.max(1,Math.round(d/3)));let g=d;for(let x=0;x<p;x++){const m=x===p-1?g:Math.ceil(d/p);g-=m,n.spawn("wood",m,u,1.2)}}}else if(s.chop>=1){const h=(((c=e.rocksNear)==null?void 0:c.call(e,this.pos,s.range+.6))??[]).filter(d=>this._inArc(d.x,d.z,s.range,d.radius)).sort((d,u)=>(d.x-this.pos.x)**2+(d.z-this.pos.z)**2-((u.x-this.pos.x)**2+(u.z-this.pos.z)**2));if(h.length){const d=e.mineRock(h[0],s.chop,this.pos);if(d>0){const u=new P(h[0].x,0,h[0].z);n.spawn("stone",Math.ceil(d/2),u,1),n.spawn("stone",Math.floor(d/2)||1,u,1)}}}else s.chop<1&&!this.hintedRock&&(((l=e.rocksNear)==null?void 0:l.call(e,this.pos,s.range+.6))??[]).some(h=>this._inArc(h.x,h.z,s.range,h.radius))&&(this.hintedRock=!0,this.hooks.popup(this.mesh.position.clone().setY(this.mesh.position.y+2.2),"Bare hands can't mine rock — craft a club!","#ffcc66"))}_doShoot(e){const t=this.weapon;this.attackCd=t.cd*this.cdMult,this.attackDur=.25,this.attackT=.25,le.sfx("attack_ranged",.4);const n=24,s=this.pos.clone().add(this.facing.clone().multiplyScalar(.6)).setY(this.mesh.position.y+1.1);e.spawnArrow(s,this.facing.clone(),{dmg:this.dmgMult*t.dmg,pierce:t.pierce,speed:n,life:t.range/n})}_animate(e,t){const{leftLeg:n,rightLeg:s,leftArm:o,rightArm:a,rightSocket:r}=this.mesh.userData,c=t?Math.sin(this.walkT*1.4)*.55:0;n.rotation.x=c,s.rotation.x=-c;const l=this.weapon.kind==="bow";if(this.attackT>0){this.attackT-=e;const h=1-Math.max(0,this.attackT)/this.attackDur;if(l)o.rotation.x=-1.5,a.rotation.x=-1.2*Math.sin(h*Math.PI);else{const d=.85*Math.min(1,h/.3),u=h<=.3?0:(h-.3)/.7,p=u*u*(3-2*u);a.rotation.x=d*(1-p)-2.6*p,a.rotation.z=-.35*Math.sin(h*Math.PI),r.rotation.x=-1.1*p*(1-u*.4)}}else a.rotation.x=-c*.6,a.rotation.z=0,r.rotation.x=0,o.rotation.x=l?-.5:c*.6}snapshot(){return{x:+this.pos.x.toFixed(2),z:+this.pos.z.toFixed(2),fx:+this.facing.x.toFixed(2),fz:+this.facing.z.toFixed(2),hp:Math.round(this.hp),xp:this.xp,level:this.level,meat:this.meat,wood:this.wood,stats:{...this.stats},eq:{...this.equipment},items:[...this.itemsOwned],spells:[...this.spellSlots]}}}let vg=1;const Mg=28;class Sg{constructor(e,t,n,s,o=0){const a=go[e];this.id=vg++,this.type=e,this.cfg=a,this.bossRank=o;const r=o>0?oo[o-1]:null;this.hp=a.hp*(1+s*1.2)*(r?r.hpMult:1),this.maxHp=this.hp,this.dmg=a.dmg*(1+s*.8)*(r?r.dmgMult:1),this.xp=Math.round(a.xp*(r?r.xpMult:1)),this.meat=a.meat??Cr(this.maxHp),this.sizeMult=r?r.sizeMult:1,this.hitR=a.hitR*this.sizeMult,this.range=a.range*this.sizeMult,this.speed=a.speed*(r?.9:1),r&&(this.reinforceT=r.reinforceInterval),this.meleeDmg=(a.meleeDmg??a.dmg)*(1+s*.8)*(r?r.dmgMult:1),this.pos=new P(t,0,n),this.mesh=Pr(e),this.sizeMult!==1&&this.mesh.scale.multiplyScalar(this.sizeMult),this.mesh.position.copy(this.pos),this.attackCd=0,this.spellTimer=a.ranged?a.spellCd*(.5+Math.random()*.5):0,this.pauseT=0,this.stunT=0,this.aggroed=o>0,this.wanderDir=Math.random()*Math.PI*2,this.wanderT=0,this.walkT=Math.random()*10,this.lungeT=0,this.dying=0,this.flyY=a.flying?1.5:0}}class yg{constructor(e,t,n){this.scene=e,this.world=t,this.hooks=n,this.list=[],this.spawnTimer=1.5,this.packTimer=20,this.discovered=new Set}alive(){return this.list.filter(e=>!e.dying)}spawnInitialWave(){this._spawn("rat",-8,42,0),this._spawn("spider",0,46,0),this._spawn("rat",8,42,0)}_spawn(e,t,n,s,o=0){const a=new Sg(e,t,n,s,o);return this.scene.add(a.mesh),this.list.push(a),this.discovered.has(e)||(this.discovered.add(e),this.hooks.onDiscover(e)),o>0&&this.hooks.onBossSpawn(a),this.hooks.onSpawn(a),a}_remove(e,t){this.hooks.onRemove(e),this.scene.remove(e.mesh),this.list.splice(t,1)}_spawnPoint(e,{allSides:t=!1,spread:n=0}={}){const s=Math.hypot(e.pos.x,e.pos.z),o=Math.atan2(e.pos.x,e.pos.z),a=!t&&s>5&&Math.random()<.65?o+(Math.random()-.5)*1.8:Math.random()*Math.PI*2,r=30+Math.random()*14;let c=e.pos.x+Math.sin(a)*r+(Math.random()-.5)*n,l=e.pos.z+Math.cos(a)*r+(Math.random()-.5)*n;({x:c,z:l}=this.world.clampToBand(c,l,e.pos.x,e.pos.z));const h=Math.hypot(c,l);if(h<28){const d=28/(h||1);c*=d,l*=d}if(h>Be.radius-6){const d=(Be.radius-6)/h;c*=d,l*=d}return{x:c,z:l}}_anchor(e){const t=e.filter(n=>!n.dead);return t.length?t[Math.floor(Math.random()*t.length)]:e[0]}_trySpawn(e){const t=this._anchor(e),n=os(t.pos.x,t.pos.z),s=8+Math.floor(n*12);if(this.alive().length>=s)return;const{x:o,z:a}=this._spawnPoint(t),r=ps(t.pos.x,t.pos.z),c=r.enemies[Math.floor(Math.random()*r.enemies.length)];this._spawn(c,o,a,n)}_trySpawnPack(e){const t=this._anchor(e),n=Nt[mo(t.pos.x,t.pos.z)];if(!n.packs)return;const s=os(t.pos.x,t.pos.z),o=n.enemies[Math.floor(Math.random()*n.enemies.length)],a=this._spawnPoint(t);let r=0;if(Math.random()<.7){let l=Math.random();r=1;for(let h=0;h<3;h++)if(l-=n.packs.skulls[h],l<=0){r=h+1;break}}const c=r>0?oo[r-1].packSize:5+Math.floor(Math.random()*6);for(let l=0;l<c;l++){const h=l/c*Math.PI*2,d=2+Math.random()*4;this._spawn(o,a.x+Math.cos(h)*d,a.z+Math.sin(h)*d,s)}r>0&&(this._spawn(o,a.x,a.z,s,r),le.sfx("lane_unlock",.45))}_bossReinforcements(e,t){const n=this._anchor(t),s=os(n.pos.x,n.pos.z);for(const o of this.list){if(o.bossRank===0||o.dying||(o.reinforceT-=e,o.reinforceT>0))continue;const a=oo[o.bossRank-1];if(o.reinforceT=a.reinforceInterval,!(this.alive().length>=Mg))for(let r=0;r<a.reinforceCount;r++){const{x:c,z:l}=this._spawnPoint(n,{allSides:!0});this._spawn(o.type,c,l,s)}}}stun(e,t){e.dying||(e.stunT=Math.max(e.stunT,t))}damage(e,t,n,s="local"){e.dying||(e.hp-=t,e.aggroed=!0,e.lastHitBy=s,this.hooks.popup(e.mesh.position.clone().setY(e.mesh.position.y+1.4*e.sizeMult+.4),Math.round(t).toString(),"#ffffff"),n&&e.bossRank===0&&(e.pos.x+=n.x*.45,e.pos.z+=n.z*.45),e.hp<=0?this._kill(e):le.sfx("hit",.25,90))}_kill(e){e.dying=1e-4,le.sfx("death",.28,40),le.creature(e.type,"death",.45,30),e.bossRank>0&&this.hooks.onBossDeath(e),this.hooks.onRemove(e),this.hooks.onKill(e)}update(e,t,n){const s=this._anchor(t),o=os(s.pos.x,s.pos.z);this.spawnTimer-=e,this.spawnTimer<=0&&(this.spawnTimer=2.2-1.2*o,this._trySpawn(t)),this.packTimer-=e,this.packTimer<=0&&(this.packTimer=26+Math.random()*18-o*8,this._trySpawnPack(t)),this._bossReinforcements(e,t);for(let a=this.list.length-1;a>=0;a--){const r=this.list[a];if(r.dying){r.dying+=e,r.mesh.rotation.z=Math.min(Math.PI/2,r.dying*4),r.mesh.position.y=this.world.heightAt(r.pos.x,r.pos.z)+r.flyY*Math.max(0,1-r.dying*2)-Math.max(0,r.dying-.5)*1.2,r.dying>1&&(this.scene.remove(r.mesh),this.list.splice(a,1));continue}let c=null,l=1/0;for(const m of t){if(m.dead)continue;const f=Math.hypot(m.pos.x-r.pos.x,m.pos.z-r.pos.z);f<l&&(l=f,c=m)}const h=c?new P().subVectors(c.pos,r.pos):new P;if(c||(l=Math.hypot(s.pos.x-r.pos.x,s.pos.z-r.pos.z)),l>(r.bossRank?110:75)){r.bossRank>0&&this.hooks.onBossDeath(r),this._remove(r,a);continue}if(r.stunT>0){r.stunT-=e,r.mesh.position.set(r.pos.x,this.world.heightAt(r.pos.x,r.pos.z)+r.flyY,r.pos.z);continue}if(r.cfg.passive&&c&&l<10){const m=new P().subVectors(r.pos,c.pos),f=Math.hypot(m.x,m.z)||1;r.pos.x+=m.x/f*r.speed*e,r.pos.z+=m.z/f*r.speed*e,this.world.collide(r.pos,.3*r.sizeMult),r.mesh.rotation.y=Math.atan2(m.x,m.z),r.walkT+=e*r.speed,(r.mesh.userData.legs||[]).forEach((_,E)=>{_.rotation.x=Math.sin(r.walkT*3.4+E%2*Math.PI)*.7}),r.mesh.position.set(r.pos.x,this.world.heightAt(r.pos.x,r.pos.z),r.pos.z);continue}l<r.cfg.aggro&&(r.aggroed=!0),r.cfg.ranged&&(r.spellTimer-=e),r.pauseT>0&&(r.pauseT-=e);let d=0,u=0;r.pauseT>0||(r.aggroed&&c?l>r.range*.75&&(d=h.x/l*r.speed,u=h.z/l*r.speed):(r.wanderT-=e,r.wanderT<=0&&(r.wanderT=2+Math.random()*3,r.wanderDir=Math.random()*Math.PI*2),d=Math.cos(r.wanderDir)*r.speed*.25,u=Math.sin(r.wanderDir)*r.speed*.25));for(const m of this.list){if(m===r||m.dying)continue;const f=r.pos.x-m.pos.x,v=r.pos.z-m.pos.z,_=f*f+v*v;if(_<1.44&&_>1e-6){const E=Math.sqrt(_);d+=f/E*3,u+=v/E*3}}if(r.pos.x+=d*e,r.pos.z+=u*e,r.cfg.flying||this.world.collide(r.pos,.4*r.sizeMult),c&&r.cfg.ranged&&r.aggroed&&r.spellTimer<=0&&l<r.cfg.shootRange&&l>2.2){r.spellTimer=r.cfg.spellCd,r.pauseT=.5,r.lungeT=.2;const m=r.mesh.position.clone().setY(r.mesh.position.y+.8*r.sizeMult);n.spawnEnemyShot(m,c,{dmg:r.dmg,speed:r.cfg.projectileSpeed,color:r.cfg.shotColor,stun:r.cfg.stun||0}),le.sfx("attack_ranged",.18,200),le.creature(r.type,"attack",.32,200)}r.attackCd-=e,!r.cfg.passive&&c&&r.attackCd<=0&&l<r.range&&(r.attackCd=r.cfg.attackCd,r.lungeT=.25,c.takeDamage(r.meleeDmg,{id:r.id,pos:r.pos,range:r.range,melee:!0}),le.creature(r.type,"attack",.3,110));const p=Math.hypot(d,u);p>.1?(r.mesh.rotation.y=Math.atan2(d,u)+Math.PI,r.walkT+=e*p):r.aggroed&&(r.mesh.rotation.y=Math.atan2(h.x,h.z)+Math.PI,r.walkT+=e*2);const g=r.mesh.userData;(g.legs||[]).forEach((m,f)=>{m.rotation.x=Math.sin(r.walkT*2.2+f%2*Math.PI)*(g.spider?.3:.6)}),(g.wings||[]).forEach((m,f)=>{m.rotation.z=Math.sin(r.walkT*6+f*Math.PI)*.55}),(g.segments||[]).forEach((m,f)=>{m.position.x=Math.sin(r.walkT*2.4+f*1.1)*.13});const x=this.world.heightAt(r.pos.x,r.pos.z)+r.flyY+(r.cfg.flying?Math.sin(r.walkT*1.5)*.25:0);if(r.lungeT>0){r.lungeT-=e;const m=Math.sin((1-r.lungeT/.25)*Math.PI);r.mesh.position.set(r.pos.x+h.x/(l||1)*m*.5,x,r.pos.z+h.z/(l||1)*m*.5)}else r.mesh.position.set(r.pos.x,x,r.pos.z)}}snapshot(){return this.alive().map(e=>({id:e.id,t:e.type,b:e.bossRank,x:+e.pos.x.toFixed(1),z:+e.pos.z.toFixed(1),hp:Math.round(e.hp),m:Math.round(e.maxHp)}))}}let ur=1;class Eg{constructor(e){this.scene=e,this.list=[]}spawnArrow(e,t,{dmg:n,pierce:s,speed:o,life:a}){const r=ng();r.position.copy(e),r.rotation.y=Math.atan2(t.x,t.z)+Math.PI,this.scene.add(r),this.list.push({id:ur++,kind:"arrow",mesh:r,vel:t.clone().multiplyScalar(o),dmg:n,pierce:s,life:a,hit:new Set})}spawnBolt(e,t,{dmg:n,onHit:s=null}){const o=ig();o.position.copy(e),this.scene.add(o),this.list.push({id:ur++,kind:"bolt",mesh:o,target:t,speed:26,dmg:n,onHit:s,life:2,hit:new Set})}spawnEnemyShot(e,t,{dmg:n,speed:s,color:o,stun:a=0}){const r=P0(o);r.position.copy(e);const c=new P(t.pos.x,e.y,t.pos.z).sub(e).normalize();this.scene.add(r),this.list.push({id:ur++,kind:"enemyShot",mesh:r,color:o,vel:c.multiplyScalar(s),dmg:n,stun:a,life:2.2,hit:new Set})}snapshotShots(){return this.list.filter(e=>e.kind==="enemyShot").map(e=>({i:e.id,x:+e.mesh.position.x.toFixed(1),z:+e.mesh.position.z.toFixed(1),c:e.color}))}update(e,t,n){var s;for(let o=this.list.length-1;o>=0;o--){const a=this.list[o];if(a.life-=e,a.kind==="bolt"&&a.target&&!a.target.dying){const c=new P(a.target.pos.x,a.target.mesh.position.y+.9,a.target.pos.z).sub(a.mesh.position),l=c.length()||1;a.mesh.position.addScaledVector(c,a.speed*e/l)}else{const c=a.vel||new P(0,0,-a.speed);a.mesh.position.addScaledVector(c,e)}let r=!1;if(a.kind==="bolt"&&a.onHit)if(a.target&&!a.target.dying){const c=a.target.pos.x-a.mesh.position.x,l=a.target.pos.z-a.mesh.position.z;c*c+l*l<((a.target.hitR||.6)+.3)**2&&(a.onHit(),r=!0)}else r=!0;else if(a.kind==="enemyShot")for(const c of n){if(c.dead)continue;const l=c.pos.x-a.mesh.position.x,h=c.pos.z-a.mesh.position.z;if(l*l+h*h<.72**2){c.takeDamage(a.dmg,{pos:{x:a.mesh.position.x,z:a.mesh.position.z},range:1.4,shot:!0}),a.stun&&((s=c.applyStun)==null||s.call(c,a.stun,{pos:{x:a.mesh.position.x,z:a.mesh.position.z},range:1.4,shot:!0})),r=!0;break}}else for(const c of t.alive()){if(a.hit.has(c.id))continue;const l=c.pos.x-a.mesh.position.x,h=c.pos.z-a.mesh.position.z;if(l*l+h*h<(c.hitR+.25)**2&&(a.hit.add(c.id),t.damage(c,a.dmg,null),!(a.kind==="arrow"&&a.pierce))){r=!0;break}}(r||a.life<=0)&&(this.scene.remove(a.mesh),this.list.splice(o,1))}}}let Pl=1;class bg{constructor(e,t){this.id=Pl++,this.mesh=ao("tame"),t&&this.mesh.scale.multiplyScalar(1.45),e.add(this.mesh),this.pos=new P(0,0,0),this.biteCd=0,this.walkT=0}update(e,t,n,s,o){this.biteCd-=e;let a=null,r=324;for(const u of n.alive()){const p=u.pos.distanceToSquared(t.pos);p<r&&(r=p,a=u)}const c=a?a.pos:t.pos.clone().add(new P(1.4,0,1.6)),l=new P().subVectors(c,this.pos),h=l.length(),d=9.5;h>(a?1.2:.4)&&(this.pos.addScaledVector(l,Math.min(1,d*e/h)),this.walkT+=e*d),a&&h<1.5+a.hitR&&this.biteCd<=0&&(this.biteCd=.9,n.damage(a,s,null)),this.mesh.position.set(this.pos.x,o.heightAt(this.pos.x,this.pos.z),this.pos.z),h>.2&&(this.mesh.rotation.y=Math.atan2(l.x,l.z)+Math.PI),(this.mesh.userData.legs||[]).forEach((u,p)=>{u.rotation.x=Math.sin(this.walkT*2+p%2*Math.PI)*.6})}}class wg{constructor(e,t){this.id=Pl++,this.slot=t,this.mesh=tg(),e.add(this.mesh),this.t=t*Math.PI,this.shootCd=0}update(e,t,n,s,o){this.t+=e*1.6;const a=2.6;if(this.mesh.position.set(t.pos.x+Math.cos(this.t)*a,t.mesh.position.y+1.7+Math.sin(this.t*2.5)*.15,t.pos.z+Math.sin(this.t)*a),this.mesh.userData.ring.rotation.z+=e*3,this.shootCd-=e,this.shootCd>0)return;const r=n.alive().map(c=>({e:c,d2:c.pos.distanceToSquared(t.pos)})).filter(c=>c.d2<225).sort((c,l)=>c.d2-l.d2).slice(0,o.targets);if(r.length){this.shootCd=1.1,le.sfx("attack_ranged",.22,150);for(const{e:c}of r)s.spawnBolt(this.mesh.position.clone(),c,{dmg:o.dmg,onHit:()=>n.damage(c,o.dmg,null)})}}}class Tg{constructor(e){this.scene=e,this.wolf=null,this.wolfItem=null,this.spheres=[],this.orbItem=null}sync(e){const t=e.equipment.pet;t!==this.wolfItem&&(this.wolf&&(this.scene.remove(this.wolf.mesh),this.wolf=null),this.wolfItem=t,t&&(this.wolf=new bg(this.scene,t==="alphaWolf"),this.wolf.pos.copy(e.pos).add(new P(1.5,0,1.5)),le.sfx("spawn",.5)));const n=e.equipment.orb;if(n!==this.orbItem){for(const s of this.spheres)this.scene.remove(s.mesh);if(this.spheres=[],this.orbItem=n,n&&e.orb){for(let s=0;s<e.orb.count;s++)this.spheres.push(new wg(this.scene,s));le.sfx("special",.5)}}}update(e,t,n,s,o){if(this.wolf&&t.pet&&this.wolf.update(e,t,n,t.pet.dmg,o),t.orb)for(const a of this.spheres)a.update(e,t,n,s,t.orb)}}const fr=3.2,Ag=.9;let Rg=1;class Cg{constructor(e,t,n){this.scene=e,this.world=t,this.hooks=n,this.list=[]}spawn(e,t,n,s=.8){e!=="item"&&(t=Dt(t));const a=({meat:Y0,wood:$0,stone:j0,hide:K0,iron:Z0,item:Uc}[e]||Uc)(),r=n.x+(Math.random()-.5)*s*2,c=n.z+(Math.random()-.5)*s*2;a.position.set(r,this.world.heightAt(r,c)+.45,c),this.scene.add(a),this.list.push({id:Rg++,kind:e,payload:t,mesh:a,x:r,z:c,t:Math.random()*6,magnet:!1})}update(e,t){var n;for(let s=this.list.length-1;s>=0;s--){const o=this.list[s];o.t+=e;let a=null,r=1/0;for(const c of t){if(c.dead)continue;const l=Math.hypot(c.pos.x-o.mesh.position.x,c.pos.z-o.mesh.position.z);l<r&&(r=l,a=c)}if(a&&!o.magnet&&r<fr&&(o.magnet=!0),o.magnet&&a){const c=a.pos.x-o.mesh.position.x,l=a.pos.z-o.mesh.position.z,h=10+(fr-Math.min(r,fr))*9,d=(((n=a.mesh)==null?void 0:n.position.y)??0)+.7;if(o.mesh.position.x+=c/(r||1)*h*e,o.mesh.position.z+=l/(r||1)*h*e,o.mesh.position.y+=(d-o.mesh.position.y)*Math.min(1,e*8),r<Ag){this.hooks.onCollect(o,a),this.scene.remove(o.mesh),this.list.splice(s,1);continue}}else o.mesh.position.y=this.world.heightAt(o.x,o.z)+.45+Math.sin(o.t*3)*.12;o.mesh.rotation.y+=e*(o.kind==="item"?2.4:1.2)}}snapshot(){return this.list.map(e=>({i:e.id,k:e.kind,pl:e.payload,x:+e.mesh.position.x.toFixed(1),z:+e.mesh.position.z.toFixed(1)}))}removeById(e){const t=this.list.findIndex(s=>s.id===e);if(t<0)return null;const n=this.list[t];return this.scene.remove(n.mesh),this.list.splice(t,1),n}}const pr={meat:()=>le.sfx("kill_gold",.35,80),wood:()=>le.sfx("click",.45,80),stone:()=>le.sfx("click",.4,80),hide:()=>le.sfx("kill_gold",.3,80),iron:()=>le.sfx("upgrade",.35,120),item:()=>le.sfx("special",.55)},Mt=25,Lg=45;class Dr{constructor(e,t){this.canvas=e,this.moba=t,e.width=160,e.height=160,this.ctx=e.getContext("2d"),this.redrawT=0}_pt(e,t){const n=this.canvas.width/(Ze.half*2+10);return{x:(e+Ze.half+5)*n,y:(t+Ze.half+5)*n}}update(e,t){if(this.redrawT-=e,this.redrawT>0)return;this.redrawT=.25;const{ctx:n,canvas:s}=this;n.fillStyle="#2c4423",n.fillRect(0,0,s.width,s.height),n.strokeStyle="#8a6b42",n.lineWidth=3;for(const a of["mid","top","bot"]){n.beginPath();for(let r=0;r<=1.001;r+=.05){const c=js(a,Math.min(1,r)),l=this._pt(c.x,c.z);r===0?n.moveTo(l.x,l.y):n.lineTo(l.x,l.y)}n.stroke()}n.fillStyle="#c9a94e";for(const a of Ze.camps){const r=this._pt(a.x,a.z);n.fillRect(r.x-1.5,r.y-1.5,3,3)}for(const a of this.moba.units){if(a.dying)continue;const r=this._pt(a.pos.x,a.pos.z),c=a.team==="player"?"#5fa8e0":a.team==="enemy"?"#e05050":"#e0c040";n.fillStyle=c,a.kind==="base"?n.fillRect(r.x-5,r.y-5,10,10):a.kind==="tower"?n.fillRect(r.x-2.5,r.y-2.5,5,5):(n.beginPath(),n.arc(r.x,r.y,a.kind==="neutral"?1.4:1.8,0,Math.PI*2),n.fill())}const o=this._pt(t.pos.x,t.pos.z);n.fillStyle="#ffffff",n.beginPath(),n.arc(o.x,o.y,3,0,Math.PI*2),n.fill(),n.strokeStyle="#000",n.lineWidth=1,n.stroke()}}class Pg{constructor(e,t){this.canvas=e,this.world=t,e.width=170,e.height=170,this.ctx=e.getContext("2d"),this.span=Be.radius*2,this.cols=Math.ceil(this.span/Mt),this.rows=this.cols,this.discovered=new Uint8Array(this.cols*this.rows),this.redrawT=0,this.viewSpans=[280,480,820,1400],this.zoom=0,this.deathAt=null}zoomBy(e){return this.zoom=Math.max(0,Math.min(this.viewSpans.length-1,this.zoom+e)),this.redrawT=0,this.zoom}_cellAt(e,t){const n=Math.floor((e+Be.radius)/Mt),s=Math.floor((t+Be.radius)/Mt);return{cx:n,cz:s}}reveal(e,t){const n=Math.ceil(Lg/Mt),{cx:s,cz:o}=this._cellAt(e,t);for(let a=-n;a<=n;a++)for(let r=-n;r<=n;r++){const c=s+r,l=o+a;c<0||c>=this.cols||l<0||l>=this.rows||r*r+a*a>n*n||(this.discovered[l*this.cols+c]=1)}}update(e,t,n,s=null){var o;this.reveal(t.pos.x,t.pos.z),(o=s==null?void 0:s.mesh)!=null&&o.visible&&this.reveal(s.pos.x,s.pos.z),this.redrawT-=e,this.redrawT<=0&&(this.redrawT=.25,this._draw(t,n,s))}_draw(e,t,n=null){var f;const{ctx:s,canvas:o}=this,a=o.width,r=o.height,c=this.viewSpans[this.zoom],l=a/c,h=e.pos.x-c/2,d=e.pos.z-c/2,u=(v,_)=>({x:(v-h)*l,y:(_-d)*l});s.fillStyle="#0a0f08",s.fillRect(0,0,a,r);const p=Math.max(0,Math.floor((h+Be.radius)/Mt)),g=Math.max(0,Math.floor((d+Be.radius)/Mt)),x=Math.ceil(c/Mt)+1;for(let v=g;v<Math.min(this.rows,g+x);v++)for(let _=p;_<Math.min(this.cols,p+x);_++){if(!this.discovered[v*this.cols+_])continue;const E=(_+.5)*Mt-Be.radius,R=(v+.5)*Mt-Be.radius;if(Ct(E,R)>Be.radius)continue;const T=ps(E,R);s.fillStyle="#"+T.ground.toString(16).padStart(6,"0");const A=u(E-Mt/2,R-Mt/2);s.fillRect(A.x,A.y,Mt*l+1,Mt*l+1)}const m=u(0,0);if(m.x>0&&m.x<a&&m.y>0&&m.y<r&&(s.font="10px sans-serif",s.textAlign="center",s.fillText("🏠",m.x,m.y+3)),t){s.textAlign="center";for(const v of t.alive()){const _=u(v.pos.x,v.pos.z);_.x<0||_.x>a||_.y<0||_.y>r||(v.bossRank>0?(s.font="9px sans-serif",s.fillText("💀",_.x,_.y+3)):(s.fillStyle="#e04040",s.beginPath(),s.arc(_.x,_.y,2,0,Math.PI*2),s.fill()))}}if(this.deathAt){const v=u(this.deathAt.x,this.deathAt.z);s.textAlign="center",s.font="12px sans-serif",s.fillText("⚰️",Math.max(6,Math.min(a-6,v.x)),Math.max(11,Math.min(r-2,v.y+4)))}if((f=n==null?void 0:n.mesh)!=null&&f.visible){const v=u(n.pos.x,n.pos.z);v.x>0&&v.x<a&&v.y>0&&v.y<r&&(s.fillStyle="#5fa8e0",s.beginPath(),s.arc(v.x,v.y,3,0,Math.PI*2),s.fill(),s.strokeStyle="#000",s.stroke())}s.fillStyle="#ffffff",s.beginPath(),s.arc(a/2,r/2,3,0,Math.PI*2),s.fill(),s.strokeStyle="#000",s.stroke()}drawBig(e,t,n=null){var h;const s=e.getContext("2d"),o=e.width,a=e.height;s.fillStyle="#0a0f08",s.fillRect(0,0,o,a);const r=o/this.span;for(let d=0;d<this.rows;d++)for(let u=0;u<this.cols;u++){if(!this.discovered[d*this.cols+u])continue;const p=(u+.5)*Mt-Be.radius,g=(d+.5)*Mt-Be.radius;if(Ct(p,g)>Be.radius)continue;const x=ps(p,g);s.fillStyle="#"+x.ground.toString(16).padStart(6,"0"),s.fillRect(u*Mt*r,d*Mt*r,Math.max(1.5,Mt*r+.5),Math.max(1.5,Mt*r+.5))}if(s.textAlign="center",s.font="13px sans-serif",s.fillText("🏠",o/2,a/2+4),this.deathAt){const d=(this.deathAt.x+Be.radius)*r,u=(this.deathAt.z+Be.radius)*r;s.font="15px sans-serif",s.fillText("⚰️",d,u+5)}if((h=n==null?void 0:n.mesh)!=null&&h.visible){const d=(n.pos.x+Be.radius)*r,u=(n.pos.z+Be.radius)*r;s.fillStyle="#5fa8e0",s.beginPath(),s.arc(d,u,4,0,Math.PI*2),s.fill()}const c=(t.pos.x+Be.radius)*r,l=(t.pos.z+Be.radius)*r;s.fillStyle="#ffffff",s.beginPath(),s.arc(c,l,4,0,Math.PI*2),s.fill(),s.strokeStyle="#000",s.stroke()}}const et=i=>document.getElementById(i);class Dg{constructor(e){this.hooks=e,this.popups=[],this.trackers=new Map,et("start-btn").addEventListener("click",()=>{le.sfx("click",.5),this.hideMenu(),e.onStart()}),et("restart-btn").addEventListener("click",()=>location.reload()),et("spellbar").addEventListener("click",n=>{const s=n.target.closest(".spell-slot");s&&e.onCastSpell(Number(s.dataset.slot))});const t=()=>{et("menu").classList.contains("hidden")||(le.playMusic("mainmenu"),window.removeEventListener("pointerdown",t))};window.addEventListener("pointerdown",t)}hideMenu(){et("menu").classList.add("hidden"),et("hud").classList.remove("hidden")}updateHUD(e,t,n){et("hp-bar").style.width=e.hp/e.maxHp*100+"%",et("hp-text").textContent=`${Math.ceil(e.hp)} / ${e.maxHp}`,et("xp-bar").style.width=e.xpProgress()*100+"%",et("level-text").textContent=e.level>=Lr?`Lv ${e.level} (MAX)`:`Lv ${e.level} — ${e.xp}/${rs[e.level+1]} XP`,et("meat").textContent=`🍖 ${Rt(e.meat)}`,et("wood").textContent=`🪵 ${Rt(e.wood)}`,et("stone").textContent=`🪨 ${Rt(e.stone)}`,et("hide").textContent=`🟫 ${Rt(e.hide)}`,et("iron").textContent=`🔩 ${Rt(e.iron)}`,et("progress-bar").style.width=t*100+"%",et("progress-text").textContent=`${Math.round(t*Be.goalR)} m / ${Be.goalR} m from home`,et("biome-name").textContent=n;const s=an(e.equipment.weapon);et("weapon-display").innerHTML=`${s.icon} ${s.name} <kbd>Q</kbd>`,this.updateSpellbar(e)}updateSpellbar(e){const t=et("spellbar");for(let n=0;n<ro;n++){let s=t.children[n];s||(s=document.createElement("div"),s.className="spell-slot",s.dataset.slot=n,s.innerHTML=`<span class="spell-icon"></span><span class="spell-key">${n+1}</span><div class="spell-cd"></div>`,t.appendChild(s));const o=e.spellSlots[n],a=s.querySelector(".spell-icon"),r=s.querySelector(".spell-cd");if(!o){s.classList.add("empty"),a.textContent="",r.style.height="0%",s.title="";continue}const c=_o(o);s.classList.remove("empty"),a.textContent=c.icon,s.title=`${c.name} — ${c.desc}`;const l=e.spellCds[o]||0;r.style.height=l/c.cd*100+"%",s.classList.toggle("ready",l<=0)}}pulseShopButton(e){et("shop-btn").classList.toggle("pulse",e)}toast(e,t=""){const n=document.createElement("div");n.className="toast "+t,n.textContent=e,et("toasts").appendChild(n),setTimeout(()=>n.classList.add("show"),10),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>n.remove(),400)},3200)}banner(e){const t=et("banner");t.textContent=e,t.classList.remove("hidden","anim"),t.offsetWidth,t.classList.add("anim")}popup(e,t,n){const s=document.createElement("div");s.className="popup",s.textContent=t,s.style.color=n,et("popups").appendChild(s),this.popups.push({el:s,pos:e.clone(),t:0})}addTracker(e,t,n,s="",o=null){const a=document.createElement("div");a.className="tracker "+s,a.innerHTML=n,et("popups").appendChild(a),this.trackers.set(e,{el:a,getPos:t,onUpdate:o})}removeTracker(e){const t=this.trackers.get(e);t&&(t.el.remove(),this.trackers.delete(e))}updateOverlays(e,t){var s;const n=new P;for(let o=this.popups.length-1;o>=0;o--){const a=this.popups[o];a.t+=e,a.pos.y+=e*1.2,n.copy(a.pos).project(t),a.el.style.transform=`translate(${(n.x*.5+.5)*window.innerWidth}px, ${(-n.y*.5+.5)*window.innerHeight}px)`,a.el.style.opacity=Math.max(0,1-a.t/1.1),a.t>1.1&&(a.el.remove(),this.popups.splice(o,1))}for(const o of this.trackers.values()){const a=o.getPos();if(!a){o.el.style.opacity=0;continue}n.copy(a).project(t),o.el.style.opacity=1,o.el.style.transform=`translate(${(n.x*.5+.5)*window.innerWidth}px, ${(-n.y*.5+.5)*window.innerHeight}px)`,(s=o.onUpdate)==null||s.call(o,o.el)}}hurtFlash(){const e=et("vignette");e.classList.remove("flash"),e.offsetWidth,e.classList.add("flash")}showEnd(e,t){et("hud").classList.add("hidden"),document.querySelectorAll(".panel").forEach(s=>s.classList.add("hidden")),et("endscreen").classList.remove("hidden"),et("end-title").textContent=e?"You reached the Frozen Peak!":"The woods claimed you…",et("end-title").className=e?"win":"lose",et("end-stats").innerHTML=`Level <b>${t.level}</b> &nbsp;·&nbsp; Kills <b>${t.kills}</b> &nbsp;·&nbsp; Distance <b>${t.distance} m</b> &nbsp;·&nbsp; Wood <b>${t.wood}</b> &nbsp;·&nbsp; Time <b>${t.time}</b>`}setPaused(e){et("paused").classList.toggle("hidden",!e)}}const Ig={tent:"Hide Tent",cabin:"Wooden Cabin",furnace:"Stone Furnace"},At=i=>document.getElementById(i);class Ug{constructor(e){this.hooks=e,this.open=null,this.shopTab=is[0].key,this.player=null,this.moba=null,this.camp=null,this.discovered=new Set,At("shop-btn").addEventListener("click",()=>this.toggle("shop")),At("char-btn").addEventListener("click",()=>this.toggle("character")),At("bestiary-btn").addEventListener("click",()=>this.toggle("bestiary")),At("settings-btn").addEventListener("click",()=>this.toggle("settings")),document.querySelectorAll(".panel-close").forEach(t=>t.addEventListener("click",()=>this.toggle(null)))}toggle(e){this.open===e&&(e=null),this.open=e,le.sfx("click",.4),At("shop").classList.toggle("hidden",e!=="shop"),At("character").classList.toggle("hidden",e!=="character"),At("bestiary").classList.toggle("hidden",e!=="bestiary"),At("settings").classList.toggle("hidden",e!=="settings"),e==="shop"&&this.renderShop(),e==="character"&&this.renderCharacter(),e==="bestiary"&&this.renderBestiary(),e==="shop"&&At("shop-btn").classList.remove("pulse"),this.hooks.onPauseChange(e!==null)}refresh(){this.open==="shop"&&this.renderShop(),this.open==="character"&&this.renderCharacter(),this.open==="bestiary"&&this.renderBestiary()}_costStr(e){return e?Object.entries(e).map(([t,n])=>`${Rt(n)} ${d0[t]??t}`).join(" + "):"free"}_affordable(e){return Object.entries(e).every(([t,n])=>this.player[t]>=n)}renderShop(){const e=this.player;At("shop-res").textContent=`🍖 ${Rt(e.meat)}  🪵 ${Rt(e.wood)}  🪨 ${Rt(e.stone)}  🟫 ${Rt(e.hide)}  🔩 ${Rt(e.iron)}`;const t=this.moba?[...is,{key:"base",label:"🏰 Base"}]:this.camp?[{key:"camp",label:"🏕️ Camp"},...is]:is,n=At("shop-tabs");n.innerHTML="";for(const r of t){const c=document.createElement("button");c.className="tab"+(r.key===this.shopTab?" active":""),c.textContent=r.label,c.addEventListener("click",()=>{this.shopTab=r.key,this.renderShop()}),n.appendChild(c)}const s=is.find(r=>r.key===this.shopTab),o=this.shopTab==="spells",a=At("shop-items");if(a.innerHTML="",this.shopTab==="training"){this._renderTraining(a);return}if(this.shopTab==="base"){this._renderBase(a);return}if(this.shopTab==="camp"){this._renderCamp(a);return}for(const r of s.items()){const c=o?e.spellsOwned.has(r.id):e.hasItem(r.id),l=e.level<r.level,h=r.needs&&this.camp&&!this.camp.has(r.needs),d=Ml(r.cost,!!this.moba),u=d&&this._affordable(d),p=document.createElement("div");p.className="card"+(c?" owned":l||h?" locked":u?" buyable":" expensive");let g;c?g='<span class="tag ok">Owned</span>':l?g=`<span class="tag">Unlocks at Lv ${r.level}</span>`:h?g=`<span class="tag">Requires ${Ig[r.needs]??r.needs} (Camp)</span>`:g=`<button class="buy-btn" data-id="${r.id}">Buy — ${this._costStr(d)}</button>`;const x=o?"📖 spell":sr[r.slot].toLowerCase();p.innerHTML=`
        <div class="card-head"><span class="icon">${r.icon}</span>
          <span class="name">${r.name}</span><span class="lv">Lv ${r.level} · ${x}</span></div>
        <div class="desc">${r.desc}</div>
        <div class="card-foot">${g}</div>`,a.appendChild(p)}a.querySelectorAll(".buy-btn").forEach(r=>{r.addEventListener("click",()=>o?this.hooks.onBuySpell(r.dataset.id):this.hooks.onBuyItem(r.dataset.id))})}_renderTraining(e){const t=this.player;for(const n of Wr){const s=t.stats[n.id],o=s>=n.max,a=s+1,r=o?null:n.cost(a),c=!o&&t.level<a,l=r&&this._affordable(r),h=document.createElement("div");h.className="card"+(o?" owned":c?" locked":l?" buyable":" expensive");let d;o?d='<span class="tag ok">Fully trained</span>':c?d=`<span class="tag">Level ${a} needs player Lv ${a}</span>`:d=`<button class="buy-btn" data-id="${n.id}">Train to ${a} — ${this._costStr(r)}</button>`,h.innerHTML=`
        <div class="card-head"><span class="icon">${n.icon}</span>
          <span class="name">${n.name}</span><span class="lv">${s}/${n.max}</span></div>
        <div class="desc">${n.desc}</div>
        <div class="card-foot">${d}</div>`,e.appendChild(h)}e.querySelectorAll(".buy-btn").forEach(n=>{n.addEventListener("click",()=>this.hooks.onBuyStat(n.dataset.id))})}renderCharacter(){const e=this.player,t=At("equip-slots");t.innerHTML="";for(const a of m0){const r=e.equipment[a],c=r?an(r):null,l=document.createElement("div");l.className="equip-slot"+(c?" filled":""),l.innerHTML=`
        <span class="slot-label">${sr[a]}</span>
        <span class="slot-item">${c?`${c.icon} ${c.name}`:"<i>empty</i>"}</span>
        ${c&&!(a==="weapon"&&r==="fists")?`<button class="unequip-btn" data-slot="${a}">✕</button>`:""}`,t.appendChild(l)}t.querySelectorAll(".unequip-btn").forEach(a=>a.addEventListener("click",()=>this.hooks.onUnequip(a.dataset.slot))),At("char-stats").innerHTML=`❤️ ${Math.ceil(e.hp)}/${e.maxHp} &nbsp; 🏃 ${Math.round(e.speed*10)/10} &nbsp; `+(e.weapon.kind==="bow"?`🏹 ${e.weapon.dmg} dmg`:`⚔️ ${e.weapon.dmg} dmg`);const n=At("inventory");n.innerHTML="";const s=[...e.itemsOwned].filter(a=>!Object.values(e.equipment).includes(a));s.length||(n.innerHTML='<div class="empty-note">Nothing in your pack — everything is equipped.</div>');for(const a of s){const r=an(a),c=document.createElement("button");c.className="inv-item",c.innerHTML=`${r.icon} <b>${r.name}</b> <span class="lv">${sr[r.slot]}</span>`,c.title=r.desc,c.addEventListener("click",()=>this.hooks.onEquip(a)),n.appendChild(c)}const o=At("spellbook");o.innerHTML="",e.spellsOwned.size||(o.innerHTML='<div class="empty-note">No spells learned yet — see the Spells tab in the shop.</div>');for(const a of e.spellsOwned){const r=_o(a),c=e.spellSlots.indexOf(a),l=document.createElement("button");l.className="inv-item"+(c>=0?" slotted":""),l.innerHTML=`${r.icon} <b>${r.name}</b> <span class="lv">${c>=0?`key ${c+1}`:"not slotted"}</span>`,l.title=r.desc+` (cooldown ${r.cd}s)`,l.addEventListener("click",()=>this.hooks.onToggleSpell(a)),o.appendChild(l)}At("spellbook-note").textContent=`${e.spellSlots.length}/${ro} spell slots used — click a spell to slot/unslot it.`}_renderBase(e){var s,o;const t=((o=(s=this.hooks).mobaTeam)==null?void 0:o.call(s))??"player",n=[];for(const a of yl)if(a.perLane)for(const r of["mid","top","bot"])n.push({def:a,lane:r});else n.push({def:a,lane:null});for(const{def:a,lane:r}of n){const c=this.moba.buildingInfo(t,a.id,r),l=c.cost&&this._affordable(c.cost),h=document.createElement("div");h.className="card"+(c.maxed?" owned":l?" buyable":" expensive");const d=r?`${a.name} — ${r.toUpperCase()}`:a.name,u=c.maxed?'<span class="tag ok">Fully built</span>':`<button class="buy-btn" data-id="${a.id}" data-lane="${r||""}">${c.level===0?"Build":"Upgrade to "+(c.level+1)} — ${this._costStr(c.cost)}</button>`;h.innerHTML=`
        <div class="card-head"><span class="icon">${a.icon}</span>
          <span class="name">${d}</span><span class="lv">${c.level}/${a.max}</span></div>
        <div class="desc">${a.desc}</div>
        <div class="card-foot">${u}</div>`,e.appendChild(h)}e.querySelectorAll(".buy-btn").forEach(a=>{a.addEventListener("click",()=>this.hooks.onBuild(a.dataset.id,a.dataset.lane||null))})}_renderCamp(e){const t=this.player,n=this.camp,s=document.createElement("div");s.className="card owned",s.style.gridColumn="1 / -1",s.innerHTML=`<div class="card-head"><span class="icon">🕰️</span>
      <span class="name">Current era: ${n.era()}</span></div>
      <div class="desc">Upgrade your home to advance through the ages and unlock new gear.</div>`,e.appendChild(s);for(const o of Sl){const a=n.buildingInfo(o.id),r=!a.maxed&&t.level<a.reqLevel,c=a.cost&&this._affordable(a.cost),l=document.createElement("div");l.className="card"+(a.maxed?" owned":r?" locked":c?" buyable":" expensive");let h;a.maxed?h='<span class="tag ok">Built</span>':r?h=`<span class="tag">Unlocks at Lv ${a.reqLevel}</span>`:h=`<button class="camp-btn" data-id="${o.id}">${a.level===0?"Build":"Upgrade to"} ${a.nextName} — ${this._costStr(a.cost)}</button>`,l.innerHTML=`
        <div class="card-head"><span class="icon">${o.icon}</span>
          <span class="name">${a.level>0?a.name:a.nextName??a.name}</span>
          <span class="lv">${a.level}/${o.max}</span></div>
        <div class="desc">${a.desc}</div>
        <div class="card-foot">${h}</div>`,e.appendChild(l)}if(n.has("chest")){const o=document.createElement("div");o.className="card owned",o.style.gridColumn="1 / -1",o.innerHTML=`<div class="card-head"><span class="icon">📦</span>
        <span class="name">Chest storage</span>
        <span class="lv">🍖 ${Rt(n.storage.meat)} · 🪵 ${Rt(n.storage.wood)} · 🪨 ${Rt(n.storage.stone)} · 🟫 ${Rt(n.storage.hide)} · 🔩 ${Rt(n.storage.iron)}</span></div>
        <div class="desc">Whatever is stored here survives your death.</div>
        <div class="card-foot">
          <button class="buy-btn" data-chest="deposit">Deposit all</button>
          <button class="buy-btn" data-chest="withdraw" style="margin-top:6px">Withdraw all</button>
        </div>`,e.appendChild(o)}e.querySelectorAll(".camp-btn").forEach(o=>{o.addEventListener("click",()=>this.hooks.onCampBuild(o.dataset.id))}),e.querySelectorAll("[data-chest]").forEach(o=>{o.addEventListener("click",()=>{o.dataset.chest==="deposit"?n.depositAll():n.withdrawAll(),this.renderShop()})})}discover(e){this.discovered.add(e)}renderBestiary(){const e=At("bestiary-items");e.innerHTML="";for(const[t,n]of Object.entries(go)){const s=this.discovered.has(t),o=document.createElement("div");o.className="card"+(s?"":" locked"),o.innerHTML=s?`<div class="card-head"><span class="icon">${n.icon}</span><span class="name">${n.name}</span></div>
           <div class="desc">❤️ ${n.hp} · ⚔️ ${n.dmg} · ⭐ ${n.xp} XP · 🍖 ${n.meat}</div>`:`<div class="card-head"><span class="icon">❓</span><span class="name">???</span></div>
           <div class="desc">Not discovered yet. Travel further north…</div>`,e.appendChild(o)}}}const gi=new xl({antialias:!0});gi.setSize(window.innerWidth,window.innerHeight);gi.setPixelRatio(Math.min(window.devicePixelRatio,2));gi.shadowMap.enabled=!0;gi.shadowMap.type=Hc;document.getElementById("game").appendChild(gi.domElement);const pt=new s0;pt.fog=new Hr(Nt[0].fog,35,110);pt.background=new Se(Nt[0].sky);const fi=new ln(50,window.innerWidth/window.innerHeight,.1,300),Dl=new o0(14674655,3820085,.9);pt.add(Dl);const un=new c0(16773853,1.4);un.castShadow=!0;un.shadow.mapSize.set(2048,2048);un.shadow.camera.left=-40;un.shadow.camera.right=40;un.shadow.camera.top=40;un.shadow.camera.bottom=-40;un.shadow.camera.far=120;pt.add(un,un.target);window.addEventListener("resize",()=>{fi.aspect=window.innerWidth/window.innerHeight,fi.updateProjectionMatrix(),gi.setSize(window.innerWidth,window.innerHeight)});const De={mode:"menu",kind:"survival",paused:!1,time:0,biomeIndex:0,seed:20260704,snapshot(){return{t:Math.round(De.time*1e3),seed:De.seed,p:{u_local:H.snapshot()},e:$n.snapshot()}}};let oe=null,dn=null,Hi=null,pi="player",tt=null;const qr=()=>oe!=null&&oe.active?oe.combatMgr():De.kind==="moba"?dn.hostileMgr("player"):$n,Je=new Dg({onStart:()=>Ol==="moba"?zg():Og(),onCastSpell:i=>H.castSpell(i,{enemyMgr:qr()})}),nt=new Ug({onPauseChange:i=>{De.paused=i&&!(oe!=null&&oe.active),Je.setPaused(!1)},onBuyItem:Wg,onBuySpell:Xg,onBuyStat:qg,onEquip:i=>{H.equip(i),nt.refresh()},onUnequip:i=>{H.unequip(i),nt.refresh()},onToggleSpell:i=>{H.toggleSpellSlot(i),nt.refresh()},onBuild:(i,e)=>Vg(i,e),onCampBuild:i=>kg(i),mobaTeam:()=>pi});let ft=new Cl(pt,De.seed);const H=new xg(pt,{popup:(i,e,t)=>Je.popup(i,e,t),onHurt:()=>Je.hurtFlash(),onLevelUp:i=>{le.sfx("evolve",.55),H.spawnLevelUpEffect();const e=li.filter(s=>s.level===i).map(s=>s.name),t=Vr.filter(s=>s.level===i).map(s=>s.name),n=[...e,...t];Je.toast(`⭐ Level ${i}!`+(n.length?` New: ${n.join(", ")}`:""),"level"),le.sfx("evolve_ready",.4),Je.pulseShopButton(!0)},onDeath:()=>{if(De.kind==="moba"){Gg();return}oe!=null&&oe.active&&oe.handleLocalDeath()||Hg()},onEquipChange:()=>co.sync(H),onChop:(i,e)=>oe==null?void 0:oe.sendChop(i,e)});nt.player=H;const Ng={meat:["🍖","#ff9d76"],wood:["🪵","#d8a468"],stone:["🪨","#c8c8c0"],hide:["🟫","#c9986a"],iron:["🔩","#c8d0d8"]};function Il(i,e){var t;if(i==="item"){const n=an(e);H.ownItem(e),Je.toast(`🎁 Loot: ${n.icon} ${n.name}!`,"level"),nt.refresh()}else{H[i]=Dt(H[i]+e);const[n,s]=Ng[i];Je.popup(H.mesh.position.clone().setY(H.mesh.position.y+2),`+${Rt(e)} ${n}`,s)}(t=pr[i])==null||t.call(pr)}const xt=new Cg(pt,ft,{onCollect:(i,e)=>{e===H?Il(i.kind,i.payload):oe==null||oe.onRemoteCollect(i)}});ft.onWoodLog=i=>xt.spawn("wood",1,i,.15);function Yr(i){nt.discover(i);const e=go[i];Je.toast(`🆕 New creature discovered: ${e.icon} ${e.name}! (see Bestiary — N)`,"discover"),le.sfx("evolve_ready",.35)}const $n=new yg(pt,ft,{popup:(i,e,t)=>Je.popup(i,e,t),onKill:i=>{(oe==null?void 0:oe.active)&&oe.onKillCredit(i)||(H.kills++,H.addXp(i.xp),Je.popup(i.mesh.position.clone().setY(i.mesh.position.y+2.1),`+${i.xp} XP`,"#c9a4ff"));const t=Math.min(4,Math.max(1,Math.round(i.meat/2)));let n=i.meat;for(let s=0;s<t;s++){const o=s===t-1?n:Math.ceil(i.meat/t);n-=o,xt.spawn("meat",o,i.pos,.9*i.sizeMult)}mo(i.pos.x,i.pos.z)===0?xt.spawn("hide",p0,i.pos,.9):u0.has(i.type)&&xt.spawn("hide",f0(i.maxHp),i.pos,1.1*i.sizeMult),i.bossRank>0&&Fg(i)},onDiscover:Yr,onBossSpawn:i=>{Je.addTracker("boss"+i.id,()=>i.mesh.parent?i.mesh.position.clone().setY(i.mesh.position.y+2.6*i.sizeMult):null,"💀".repeat(i.bossRank),"skulls"),Je.toast(`${"💀".repeat(i.bossRank)} A pack mother appears! Her children keep coming until she falls.`,"boss")},onBossDeath:i=>Je.removeTracker("boss"+i.id),onSpawn:i=>{const e=i.cfg.ranged,t=e?"#"+i.cfg.shotColor.toString(16).padStart(6,"0"):"",n='<div class="hpbar"><div class="hpbar-fill"></div></div>'+(e?`<div class="castbar"><div class="castbar-fill" style="background:${t}"></div></div>`:"");Je.addTracker("hp"+i.id,()=>i.mesh.parent?i.mesh.position.clone().setY(i.mesh.position.y+1.5*i.sizeMult+.5):null,n,"hpwrap",s=>{const o=Math.max(0,i.hp/i.maxHp),a=s.children[0].firstChild;if(a.style.width=o*100+"%",a.style.background=o>.5?"#5fd35f":o>.25?"#e0c040":"#e05050",e){const r=1-Math.max(0,i.spellTimer)/i.cfg.spellCd;s.children[1].firstChild.style.width=r*100+"%"}})},onRemove:i=>Je.removeTracker("hp"+i.id)}),yn=new Eg(pt),co=new Tg(pt),vn=new Pg(document.getElementById("minimap"),ft);function Fg(i){const e=oo[i.bossRank-1];if(Math.random()>=e.dropChance)return;const t=li.filter(s=>!s.free&&!H.hasItem(s.id)&&s.level<=H.level+1);if(!t.length){xt.spawn("meat",5,i.pos,1);return}const n=t[Math.floor(Math.random()*t.length)];xt.spawn("item",n.id,i.pos,.5)}function $r(){const i=Math.floor(De.time/60),e=Math.floor(De.time%60);return{level:H.level,kills:H.kills,distance:Math.max(0,Math.round(Ct(H.pos.x,H.pos.z))),wood:H.wood,time:`${i}:${String(e).padStart(2,"0")}`}}function jr(){Je.hideMenu(),De.mode="play",le.playMusic("level1"),De.kind==="survival"&&(tt=new hg(pt,ft,H,{popup:(i,e,t)=>Je.popup(i,e,t),toast:(i,e)=>Je.toast(i,e)}),nt.camp=tt,He("minimap-zoom").classList.remove("hidden"),H.pos.set(0,0,-2),ft.onIsland=i=>{if(oe!=null&&oe.active&&!oe.isHost)return;const e={x:i.x,z:i.z};if(xt.spawn("meat",8,e,1.2),xt.spawn("stone",6,e,1.2),xt.spawn("hide",3,e,1.2),Math.random()<.4){const t=li.filter(n=>!n.free);xt.spawn("item",t[Math.floor(Math.random()*t.length)].id,e,.6)}},oe!=null&&oe.active&&oe.mode==="coop"&&!oe.isHost||$n.spawnInitialWave())}function Og(){jr(),Je.toast("You wake in a cave… follow the light. Punch small trees for wood, craft at the camp (U).","info")}function kg(i){if(!tt)return;const e=tt.buildingInfo(i);if(!(e.maxed||H.level<e.reqLevel)){if(!Object.entries(e.cost).every(([t,n])=>H[t]>=n)){le.sfx("error",.5);return}for(const[t,n]of Object.entries(e.cost))H[t]=Dt(H[t]-n);tt.build(i),H.campBonus=tt.homeHpBonus(),H.recompute(),nt.refresh()}}function Ks(i,e){De.kind="moba",pi=e,tt==null||tt.dispose(),tt=null,nt.camp=null,He("minimap-zoom").classList.add("hidden"),ft.dispose(),ft=new pg(pt,i),ft.onWoodLog=s=>xt.spawn("wood",1,s,.15),xt.world=ft,$n.world=ft,De.seed=i;const t=Ze.basePos[e],n=e==="player"?1:-1;H.pos.set(t.x+9*n,0,t.z-9*n),H.meat=15,He("base-btn").classList.remove("hidden")}function Ul(){return{popup:(i,e,t)=>Je.popup(i,e,t),discover:Yr,rewardLocal:(i,e,t)=>{i>0&&(H.addXp(i),Je.popup(t.clone().setY(2),`+${i} XP`,"#c9a4ff")),e>0&&xt.spawn("meat",e,t,.8)},rewardPartner:(i,e)=>{var t;return(t=oe==null?void 0:oe.sendMobaReward)==null?void 0:t.call(oe,i,e)},onBuilt:()=>nt.refresh(),onEnd:i=>{var t;const e=pi==="player"?i:!i;(t=oe==null?void 0:oe.sendMobaEnd)==null||t.call(oe,!e),Nl(e)}}}function Nl(i){if(De.mode!=="play")return;De.mode=i?"won":"dead",hi.visible=!1,le.stopMusic(),le.sfx(i?"victory":"defeat",.6);const e=document.getElementById("end-title");Je.showEnd(i,$r()),e.textContent=i?"Enemy base destroyed — VICTORY!":"Your base has fallen…"}function zg(){Ks(Math.floor(Math.random()*1e9),"player"),dn=new Ll(pt,ft,H,yn,xt,Je,Ul()),nt.moba=dn,Hi=new Dr(document.getElementById("minimap"),dn),jr(),Je.toast("🏰 MOBA! Farm the jungle camps, then build Creep Dens & Towers (shop → Base tab).","level")}function Bg(i){const e=Ze.basePos[pi];!e||H.dead||H.hp>=H.maxHp||Math.hypot(H.pos.x-e.x,H.pos.z-e.z)>Ze.baseR||(H.hp=Math.min(H.maxHp,H.hp+18*i))}function Fl(i){let e=0;for(const t of $s){const n=Math.floor(H[t]*5)/10;if(H[t]=0,n<=0)continue;e=Dt(e+n);const s=Math.min(3,Math.max(1,Math.round(n/5)));let o=n;for(let a=0;a<s;a++){const r=a===s-1?o:Math.ceil(n/s);o-=r,xt.spawn(t,r,i,1.6)}}return e}function Hg(){vn.deathAt={x:H.pos.x,z:H.pos.z};const i=Fl(H.pos.clone());H.loseLevel(),H.mesh.rotation.z=Math.PI/2,le.sfx("defeat",.5),Je.toast(`☠️ You fell… Level lost (now ${H.level}); half your carried loot (${i}) spilled where you died. Chest storage is safe.`,"boss"),setTimeout(()=>{De.mode==="play"&&(tt!=null&&tt.has("grave")&&tt.gravePos?He("respawn-choice").classList.remove("hidden"):Kr("cave"))},2500)}function Kr(i){He("respawn-choice").classList.add("hidden"),De.mode==="play"&&(H.revive(1),i==="grave"&&(tt!=null&&tt.gravePos)?H.pos.set(tt.gravePos.x,0,tt.gravePos.z+2):H.pos.set(0,0,-2))}function Gg(){Je.toast("☠️ You fell — respawning at your base…","boss"),setTimeout(()=>{if(De.mode!=="play")return;H.revive(1);const i=Ze.basePos[pi],e=pi==="player"?1:-1;H.pos.set(i.x+9*e,0,i.z-9*e)},3e3+H.level*500)}function Vg(i,e){const t=nt.moba;if(!t)return;const n=t.buildingInfo(pi,i,e);if(n.cost){if(!Object.entries(n.cost).every(([s,o])=>H[s]>=o)){le.sfx("error",.5);return}for(const[s,o]of Object.entries(n.cost))H[s]-=o;t===dn?dn.build("player",i,e):(oe.sendMobaBuild(i,e),t.registerBuild(i,e)),le.sfx("purchase",.5),nt.refresh()}}const He=i=>document.getElementById(i),Zs=Object.assign({mouseMove:!1},JSON.parse(localStorage.getItem("atw-settings")||"{}"));{const i=He("set-mousemove");i.checked=Zs.mouseMove,i.addEventListener("change",()=>{Zs.mouseMove=i.checked,localStorage.setItem("atw-settings",JSON.stringify(Zs)),le.sfx("click",.4)});const e=He("set-mute");e.addEventListener("change",()=>{e.checked!==le.muted&&le.toggleMute()})}async function vo(){if(!oe){const{Multiplayer:i}=await Zl(async()=>{const{Multiplayer:e}=await import("./multiplayer-Rgdfsa2Q.js");return{Multiplayer:e}},[]);oe=new i({scene:pt,player:H,enemyMgr:$n,pickups:xt,projectiles:yn,ui:Je,panels:nt,game:De,input:Zt,get world(){return ft},popup:(e,t,n)=>Je.popup(e,t,n),onDiscover:Yr,grantPickup:Il,dropHalfMeat:Fl,markDeath:e=>{vn.deathAt={x:e.x,z:e.z}},startPlaying:jr,onCoopWin:()=>{De.mode==="play"&&(De.mode="won",le.stopMusic(),le.sfx("victory",.6),Je.showEnd(!0,$r()))},setupMobaWorld:Ks,createMobaHost:e=>(Ks(e,"player"),dn=new Ll(pt,ft,H,yn,xt,Je,Ul()),dn.aiEnabled=!1,nt.moba=dn,Hi=new Dr(document.getElementById("minimap"),dn),dn),attachMobaGuest:(e,t)=>{Ks(e,"enemy"),nt.moba=t,Hi=new Dr(document.getElementById("minimap"),t)},endMoba:Nl}),window.__game.mp=oe}return oe}function Mo(i){He("mp-error").textContent=(i==null?void 0:i.message)||String(i)}let Ol="survival";function kl(i){le.sfx("click",.4),Ol=i,He("mode-select").classList.add("hidden");const e=He("mode-options");e.classList.remove("hidden"),e.classList.toggle("is-moba",i==="moba"),He("mode-title").textContent=i==="moba"?"🏰 MOBA":"🌲 Survival"}He("mode-survival-btn").addEventListener("click",()=>kl("survival"));He("mode-moba-btn").addEventListener("click",()=>kl("moba"));He("mode-back-btn").addEventListener("click",()=>{le.sfx("click",.4),He("mode-options").classList.add("hidden"),He("mode-select").classList.remove("hidden"),He("mp-error").textContent=""});He("mp-moba-btn").addEventListener("click",async()=>{try{const i=await vo();Zr(await i.host("moba",null))}catch(i){Mo(i)}});function Zr(i){He("mp-choose").classList.add("hidden"),He("mp-wait").classList.remove("hidden"),He("mp-code-display").textContent=i,He("start-btn").classList.add("hidden")}He("mp-coop-btn").addEventListener("click",async()=>{try{const i=await vo();Zr(await i.host("coop",null))}catch(i){Mo(i)}});He("mp-pvp-btn").addEventListener("click",async()=>{try{const i=await vo(),e=Number(He("mp-interval").value);Zr(await i.host("pvp",e))}catch(i){Mo(i)}});He("mp-join-btn").addEventListener("click",async()=>{try{await(await vo()).join(He("mp-code").value)}catch(i){Mo(i)}});function Wg(i){const e=an(i);if(!e||H.hasItem(i)||H.level<e.level||e.needs&&tt&&!tt.has(e.needs))return;const t=Ml(e.cost,De.kind==="moba");if(!Object.entries(t).every(([n,s])=>H[n]>=s)){le.sfx("error",.5);return}for(const[n,s]of Object.entries(t))H[n]=Dt(H[n]-s);H.ownItem(i),le.sfx("purchase",.5),nt.refresh()}function Xg(i){const e=_o(i);if(!(!e||H.spellsOwned.has(i)||H.level<e.level)){if(!Object.entries(e.cost).every(([t,n])=>H[t]>=n)){le.sfx("error",.5);return}for(const[t,n]of Object.entries(e.cost))H[t]=Dt(H[t]-n);H.ownSpell(i),le.sfx("upgrade",.5),nt.refresh()}}function qg(i){const e=Wr.find(s=>s.id===i),t=H.stats[i];if(!e||t>=e.max||H.level<t+1)return;const n=e.cost(t+1);if(!Object.entries(n).every(([s,o])=>H[s]>=o)){le.sfx("error",.5);return}for(const[s,o]of Object.entries(n))H[s]=Dt(H[s]-o);H.stats[i]++,H.recompute(),le.sfx("upgrade",.5),nt.refresh()}const Un=()=>De.mode==="play";Zt.onKey("KeyU",()=>Un()&&nt.toggle("shop"));Zt.onKey("KeyB",()=>Un()&&zl());function zl(){De.kind==="moba"&&(nt.shopTab="base"),nt.toggle("shop")}He("base-btn").addEventListener("click",()=>Un()&&zl());Zt.onKey("KeyC",()=>Un()&&nt.toggle("character"));Zt.onKey("KeyN",()=>Un()&&nt.toggle("bestiary"));Zt.onKey("KeyQ",()=>Un()&&!De.paused&&H.cycleWeapon());let oi=!1,mr=0;function So(i){if(De.kind!=="survival"||De.mode!=="play"){oi=!1;return}oi=i!==void 0?i:!oi,He("bigmap").classList.toggle("hidden",!oi),oi&&(le.sfx("click",.4),vn.drawBig(He("bigmap-canvas"),H,(oe==null?void 0:oe.mode)==="coop"?oe.remote:null))}Zt.onKey("KeyM",()=>So());He("minimap").addEventListener("click",()=>So());function Jr(){He("mm-zoom-in").disabled=vn.zoom<=0,He("mm-zoom-out").disabled=vn.zoom>=vn.viewSpans.length-1}He("mm-zoom-in").addEventListener("click",i=>{i.stopPropagation(),vn.zoomBy(-1),Jr(),le.sfx("click",.3)});He("mm-zoom-out").addEventListener("click",i=>{i.stopPropagation(),vn.zoomBy(1),Jr(),le.sfx("click",.3)});Jr();function Bl(){return De.kind!=="survival"||!tt?!1:Ct(H.pos.x,H.pos.z)<Be.caveR+4?!0:Math.hypot(H.pos.x- -9,H.pos.z-13)<6}Zt.onKey("KeyE",()=>{!Un()||!Bl()||(nt.shopTab="camp",nt.toggle("shop"))});He("bigmap").querySelector(".panel-close").addEventListener("click",()=>So(!1));He("respawn-cave").addEventListener("click",()=>Kr("cave"));He("respawn-grave").addEventListener("click",()=>Kr("grave"));for(let i=0;i<6;i++)Zt.onKey("Digit"+(i+1),()=>Un()&&!De.paused&&H.castSpell(i,{enemyMgr:qr()}));Zt.onKey("Escape",()=>{if(Un()){if(oi){So(!1);return}if(nt.open){nt.toggle(null);return}oe!=null&&oe.active||(De.paused=!De.paused,Je.setPaused(De.paused))}});const kc=new h0,Yg=new Bn(new P(0,1,0),0),Js=new P(0,0,-10),hi=D0();hi.visible=!1;pt.add(hi);const hs=H0();hs.visible=!1;pt.add(hs);function Hl(){kc.setFromCamera(new je(Zt.mouse.x,Zt.mouse.y),fi),kc.ray.intersectPlane(Yg,Js);const i=Js.x-H.pos.x,e=Js.z-H.pos.z,t=H.attackRange,n=H.weapon.kind==="bow",s=n?.22:.55,o=n?.35:Math.min(.5,t*.22);hi.visible=!0,I0(hi,H.pos.x,H.pos.z,Math.atan2(i,e),t,s,o,(a,r)=>ft.heightAt(a,r)),hi.material.color.setHex(n?10475775:16771496)}const gr=new Se(Nt[0].fog),_r=new Se(Nt[0].sky),zc=new Se(790282);function $g(i){const e=mo(H.pos.x,H.pos.z);if(e!==De.biomeIndex){De.biomeIndex=e;const r=Nt[e];Je.banner(`— ${r.name} —`),le.sfx("lane_unlock",.5),le.playMusic(e>=3?"level3":"level1")}const t=Nt[De.biomeIndex],n=Ct(H.pos.x,H.pos.z),s=Math.max(0,Math.min(1,(Be.caveR+6-n)/(Be.caveR+3)));Dl.intensity=.9-.62*s,un.intensity=1.4*(1-.8*s),pt.fog.near=35-14*s,pt.fog.far=110-60*s;const o=new Se(t.fog).lerp(zc,s),a=new Se(t.sky).lerp(zc,s);s>.01?(gr.copy(o),_r.copy(a)):(gr.lerp(o,Math.min(1,i*1.5)),_r.lerp(a,Math.min(1,i*1.5))),pt.fog.color.copy(gr),pt.background.copy(_r)}function Gl(){const i=H.mesh.position.y;fi.position.set(H.pos.x,i+26,H.pos.z+14),fi.lookAt(H.pos.x,i,H.pos.z-2),un.position.set(H.pos.x+18,35,H.pos.z+12),un.target.position.set(H.pos.x,0,H.pos.z)}const jg=new l0;function Vl(){var e,t;requestAnimationFrame(Vl);const i=Math.min(jg.getDelta(),.05);if(De.mode==="play"&&!De.paused){De.time+=i,Hl();const n=qr();if(H.update(i,{input:Zt,world:ft,enemyMgr:n,projectiles:yn,pickups:xt,aimPoint:Js,arenaZone:oe!=null&&oe.active?oe.arenaZone():null,mobaBounds:De.kind==="moba"?Ze.half:null,mouseMove:Zs.mouseMove,boat:De.kind==="survival"&&(tt==null?void 0:tt.has("boat"))}),De.kind==="moba"){oe!=null&&oe.active?(oe.updateWorldSim(i),oe.update(i)):(dn.update(i,[{obj:H,team:"player"}]),yn.update(i,n,[H]),xt.update(i,[H])),Bg(i),co.update(i,H,n,yn,ft),ft.update(i,H.pos),Hi==null||Hi.update(i,H);const s=document.getElementById("mp-status"),o=(t=(e=nt.moba)==null?void 0:e.statusLine)==null?void 0:t.call(e);o&&(s.textContent=o,s.classList.remove("hidden")),Je.updateHUD(H,0,"MOBA — destroy the enemy base")}else{oe!=null&&oe.active?(oe.updateWorldSim(i),oe.update(i)):($n.update(i,[H],yn),yn.update(i,$n,[H]),xt.update(i,[H])),co.update(i,H,n,yn,ft),tt==null||tt.update(i,n,yn),ft.update(i,H.pos),vn.update(i,H,n,oe!=null&&oe.active&&oe.mode==="coop"?oe.remote:null),$g(i);const s=(tt==null?void 0:tt.has("boat"))&&ft.isWater(H.pos.x,H.pos.z);hs.visible=!!s,s&&(hs.position.set(H.pos.x,H.mesh.position.y+.12,H.pos.z),hs.rotation.y=H.mesh.rotation.y),He("home-hint").classList.toggle("hidden",!Bl()||nt.open),oi&&(mr-=i,mr<=0&&(mr=.5,vn.drawBig(He("bigmap-canvas"),H,(oe==null?void 0:oe.mode)==="coop"?oe.remote:null)));const o=os(H.pos.x,H.pos.z);Je.updateHUD(H,o,Nt[De.biomeIndex].name),Ct(H.pos.x,H.pos.z)>=Be.goalR&&(De.mode="won",hi.visible=!1,le.stopMusic(),le.sfx("victory",.6),oe==null||oe.broadcastWin(),Je.showEnd(!0,$r()),document.getElementById("end-title").textContent="You crossed the whole wilds!")}}Gl(),Je.updateOverlays(i,fi),gi.render(pt,fi)}ft.update(0,H.pos);Gl();Vl();window.__game={game:De,scene:pt,player:H,enemyMgr:$n,companions:co,pickups:xt,panels:nt,input:Zt,updateAim:Hl,minimap:vn,get world(){return ft},get camp(){return tt}};export{Kg as A,Ot as B,go as E,yl as M,ar as T,P as V,le as a,Zg as b,Jg as c,El as d,ao as e,Pr as f,xo as g,x0 as h,Ce as i,In as j,an as k,v0 as l,V0 as m,M0 as n,oo as o,Uc as p,Z0 as q,Dt as r,K0 as s,j0 as t,$0 as u,Y0 as v,P0 as w};
