import{r as e}from"./rolldown-runtime-C60lm6uB.js";import{i as t,r as n}from"./framework-BgSIrAUN.js";var r=e(n(),1),i=t(),a=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,o=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec2 uPointerVelocity;
uniform float uPointerActive;
uniform float uTravel;
uniform float uTime;
uniform sampler2D uTypography;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float band(float d, float width) { return exp(-pow(d / width, 2.0)); }

vec3 dust(vec2 p, float time, float density) {
  vec2 grid = p * density;
  vec2 id = floor(grid);
  vec2 f = fract(grid);
  vec3 col = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = vec2(float(x), float(y));
      float seed = hash(id + cell);
      vec2 point = vec2(seed, hash(id + cell + 17.3));
      vec2 delta = cell + point - f;
      float speck = band(length(delta), mix(0.022, 0.048, seed));
      float glow = band(length(delta), 0.12) * 0.05;
      float live = smoothstep(0.82, 0.98, seed);
      float breathe = 0.65 + 0.35 * sin(time * 0.65 + seed * 45.0);
      vec3 tint = mix(vec3(0.66,0.76,0.82), vec3(0.86,0.8,0.7), step(0.96,seed));
      col += tint * (speck + glow) * live * breathe;
    }
  }
  return col;
}

// A broad horizontal cloud crosses the scene behind the optical core.
// Particles disperse vertically without a traced line or hard boundary.
vec3 glassFlow(vec2 point, float time, float radius, float aspect) {
  float distance = point.y;
  float edgeFade = 1.0 - smoothstep(aspect * 0.48, aspect * 0.68, abs(point.x));
  float width = radius * 0.36;
  float spread = smoothstep(width * 0.4, width * 2.9, abs(distance));
  float envelope = (band(distance, width) * 0.50 + band(distance, width * 2.8) * 0.31) * edgeFade;
  float pixelWidth = fwidth(distance) * 115.0 * 0.60;
  if (envelope < 0.002) return vec3(0.0);

  // Shear the individual layers gently, so the stream has depth and flow.
  vec2 stream = vec2(point.x - time * 0.020 + distance * sin(time * 0.12) * 0.10,
    distance + sin(point.x * 3.0 + time * 0.16) * spread * radius * 0.04);
  vec2 grid = stream * vec2(92.0, 115.0);
  vec2 id = floor(grid);
  vec2 f = fract(grid);
  vec3 silver = vec3(0.0);
  for (int row = -1; row <= 1; row++) {
    for (int column = -1; column <= 1; column++) {
      vec2 cell = vec2(float(column), float(row));
      float seed = hash(id + cell + 82.4);
      vec2 offset = vec2(seed, hash(id + cell + 4.3));
      vec2 delta = cell + offset - f;
      float length = mix(mix(0.10, 0.58, pow(seed, 2.0)), 0.09 + seed * 0.09, spread);
      float thickness = max(pixelWidth, mix(0.045, 0.105, hash(id + cell + 17.0)));
      float glint = exp(-dot(delta / vec2(length, thickness), delta / vec2(length, thickness)));
      float bloom = exp(-dot(delta / vec2(length * 1.35, 0.30), delta / vec2(length * 1.35, 0.30)));
      float presence = smoothstep(0.46 + spread * 0.18, 0.88 + spread * 0.07, seed);
      float breathe = 0.62 + 0.38 * sin(time * 0.58 + seed * 34.0);
      // A stable, rare subset becomes larger glass grains. Reuse the same
      // positions and flow so their size adds depth without adding density.
      float largeGrain = step(0.973, hash(id + cell + 61.8));
      float grainScale = mix(0.85, 1.30, hash(id + cell + 29.1));
      vec2 grainSize = vec2(0.25, 0.30) * grainScale;
      float grain = exp(-dot(delta / grainSize, delta / grainSize));
      vec2 haloSize = grainSize * 2.05;
      float grainHalo = exp(-dot(delta / haloSize, delta / haloSize));
      float light = mix(glint * 0.43 + bloom * 0.066, grain * 1.10 + grainHalo * 0.15, largeGrain);
      silver += mix(vec3(0.82, 0.90, 0.97), vec3(0.94, 0.97, 1.0), largeGrain) * light * presence * breathe;
    }
  }
  // Only a faint, broad reflection joins the glints. There is no traced edge.
  float reflection = 0.50 + 0.50 * pow(0.5 + 0.5 * sin(point.x * 3.0 - time * 0.30), 2.0);
  silver += vec3(0.68, 0.79, 0.88) * reflection * 0.007;
  return silver * envelope;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 aspectScale = vec2(aspect, 1.0);
  vec2 center = vec2(0.5, 0.57) + (uPointer - 0.5) * vec2(0.015, 0.012) * uPointerActive;
  vec2 p = (vUv - center) * aspectScale;
  float travel = smoothstep(0.0, 1.0, uTravel);
  float visibility = 1.0 - smoothstep(0.77, 1.0, uTravel);
  float zoom = 1.0 + pow(travel, 2.7) * 8.0;
  float radius = min(0.275, aspect * 0.34) * (1.0 + sin(uTime * 0.48) * 0.012);
  vec2 q = p / zoom;
  vec2 pointerInLens = (uPointer - center) * aspectScale / zoom;
  vec2 fromPointer = q - pointerInLens;
  float pointerPresence = uPointerActive * (1.0 - smoothstep(0.86, 0.96, uPointer.y));
  float influence = exp(-dot(fromPointer, fromPointer) / (radius * radius * 0.64)) * pointerPresence;
  vec2 wake = uPointerVelocity * aspectScale / zoom;
  // Warp all surrounding light together: attraction, a slight curl, and the
  // wake from movement. The remaining glints move with the glass reflections.
  vec2 fieldPoint = q + fromPointer * influence * 0.32;
  fieldPoint += vec2(-fromPointer.y, fromPointer.x) * influence *
    (0.13 + sin(uTime * 0.8) * 0.045);
  fieldPoint -= wake * influence * 0.065;
  float r = length(q);
  float angle = atan(q.y, q.x);
  float rotation = uTime * 0.075 + uPointer.x * 0.22;
  float edge = r - radius;
  float inside = 1.0 - smoothstep(radius - 0.002, radius + 0.003, r);
  float normalizedRadius = r / radius;
  vec2 n = q / max(r, 0.0001);
  vec2 lightDir = normalize(turn(sin(rotation) * 0.22) * vec2(-0.62, 0.85) + (uPointer - 0.5) * 0.48);
  float lit = pow(max(dot(n, lightDir), 0.0), 8.0);
  float opposite = pow(max(dot(n, -lightDir), 0.0), 13.0);

  vec3 color = vec3(0.01176);
  // A dark body, two cold light sources and very thin optical coatings.
  vec3 lens = vec3(0.0);
  lens += vec3(0.7,0.79,0.87) * band(edge, 0.024) * (0.035 + 0.16 * lit + 0.09 * opposite);
  lens += vec3(0.84,0.91,0.96) * band(edge, 0.0031) * (0.05 + 1.8 * lit + 0.9 * opposite);
  lens += vec3(1.0) * band(edge, 0.0008) * (0.08 + lit * 1.5 + opposite * 0.75);
  float innerRing = r - radius * (0.94 + 0.013 * sin(angle * 3.0 + rotation));
  lens += vec3(0.63,0.73,0.79) * band(innerRing, 0.0012) * (lit * 0.4 + opposite * 0.11);
  float coating = r - radius * (1.018 + 0.006 * sin(angle * 5.0 + rotation));
  lens += vec3(0.24,0.35,0.46) * band(coating, 0.001) * (lit + opposite) * 0.32;
  vec2 bent = turn(-0.4 + sin(rotation) * 0.1) * q;
  float crescent = length((bent + vec2(radius * 0.21, radius * -0.07)) * vec2(0.92,1.03)) - radius * 0.92;
  lens += vec3(0.36,0.43,0.49) * band(crescent, 0.018) * inside * lit * 0.16;
  lens += vec3(0.24,0.28,0.32) * pow(max(0.0, 1.0 - normalizedRadius), 3.0) * 0.025;
  lens += vec3(0.68,0.77,0.85) * band(edge + radius * 0.085, radius * 0.11) * inside * (lit * 0.055 + opposite * 0.018);

  // A nearby cursor acts as a light source on the glass, instead of floating
  // over it as an unrelated glow. The highlight remains while hovering.
  vec2 cursorDirection = normalize(pointerInLens + vec2(0.0001));
  float cursorRim = pow(max(dot(n, cursorDirection), 0.0), 10.0) * pointerPresence *
    band(length(pointerInLens) - radius, radius * 0.85);
  lens += vec3(0.85,0.92,0.98) * cursorRim *
    (band(edge, 0.026) * 0.32 + band(edge, 0.0018) * 1.05);
  lens += vec3(0.68,0.79,0.88) * influence *
    (inside * 0.041 + band(edge + 0.026, 0.045) * 0.074);

  // Inward spiral coordinates: increasing scroll compresses particles toward the lens.
  vec2 flow = turn(0.025 * uTime + 0.12 / (r + 0.16)) * fieldPoint;
  flow *= 1.0 + travel * 1.8;
  flow += normalize(flow + vec2(0.0001)) * uTime * 0.003;
  float halo = exp(-pow((r - radius * 1.15) / (radius * 0.6), 2.0));
  // The opaque optical core occludes the entire background stream. Only its
  // own surface reflections and refracted typography appear on the sphere.
  float behindGlass = smoothstep(radius, radius + 0.008, r);
  vec3 particles = dust(flow, uTime, 54.0);
  particles *= (0.15 + halo * 0.10 + influence * 0.11) * behindGlass;
  // Carry the horizontal stream behind the sphere, hiding the central section.
  vec2 streamPoint = fieldPoint * (1.0 + travel * 0.65);
  vec3 reflectedFlow = glassFlow(streamPoint, uTime, radius, aspect);
  reflectedFlow *= behindGlass * (1.0 + influence * 3.2);
  color += (lens + particles + reflectedFlow) * visibility;

  // Sample the real heading texture through the curved lens. Only the intersecting
  // letters bend; the title remains intact in the surrounding black space.
  float textFade = 1.0 - smoothstep(0.08, 0.59, uTravel);
  float curvature = pow(max(0.0, 1.0 - normalizedRadius * normalizedRadius), 1.4) * inside;
  vec2 warped = vUv;
  warped -= q / aspectScale * curvature * 0.13;
  warped.x += sin(q.y * 24.0 + rotation) * curvature * 0.004;
  warped.y += sin(q.x * 10.0 + rotation) * curvature * 0.006;
  warped += (fieldPoint - q) / aspectScale * inside * 0.045;
  float boundary = band(edge + 0.006, 0.02);
  warped.x += boundary * q.x / aspect * 0.055;
  float chromatic = curvature * 0.0004 + boundary * 0.00065;
  vec3 typeColor;
  typeColor.r = texture(uTypography, warped + vec2(chromatic, 0.0)).r;
  typeColor.g = texture(uTypography, warped).g;
  typeColor.b = texture(uTypography, warped - vec2(chromatic, 0.0)).b;
  vec3 trailing = vec3(0.0);
  for (int i = 1; i <= 5; i++) {
    float offset = float(i) * 0.0028 * boundary;
    trailing += texture(uTypography, warped + vec2(offset,0.0)).rgb * 0.027 * boundary;
  }
  color += (typeColor * (1.0 - curvature * 0.11) + trailing) * textFade;

  // Below the hero, movement briefly exposes silver dust; idle is pure black.
  float afterHero = smoothstep(0.86, 1.0, uTravel);
  vec2 nearPointer = (vUv - uPointer) * aspectScale;
  float localMask = exp(-dot(nearPointer, nearPointer) * 30.0);
  if (afterHero * uPointerActive > 0.001) {
    vec2 passingFlow = (vUv - 0.5) * aspectScale + nearPointer * localMask * uPointerActive * 0.18;
    vec3 passingDust = dust(passingFlow + vec2(uTime * 0.006, 0.0), uTime, 54.0);
    color += passingDust * localMask * afterHero * uPointerActive * 0.48;
    color += vec3(0.15, 0.18, 0.2) * localMask * afterHero * uPointerActive * 0.021;
  }
  fragColor = vec4(color, 1.0);
}`;function s(e,t,n){let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(console.warn(`Optical scene unavailable:`,e.getShaderInfoLog(r)),e.deleteShader(r),null)):null}function c({locale:e=`en`}){let t=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e=t.current,n=e?.closest(`.portfolio-home`),r=n?.querySelector(`.hero`),i=n?.querySelector(`.hero-sticky`);if(!e||!n||!r||!i)return;let c=window.matchMedia(`(prefers-reduced-motion: reduce)`),l=window.matchMedia(`(pointer: fine)`),u=e.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,powerPreference:`low-power`});if(!u)return;let d=s(u,u.VERTEX_SHADER,a),f=s(u,u.FRAGMENT_SHADER,o),p=u.createProgram();if(!d||!f||!p){d&&u.deleteShader(d),f&&u.deleteShader(f),p&&u.deleteProgram(p);return}if(u.attachShader(p,d),u.attachShader(p,f),u.linkProgram(p),!u.getProgramParameter(p,u.LINK_STATUS)){u.deleteShader(d),u.deleteShader(f),u.deleteProgram(p);return}let m=u.createVertexArray(),h=u.createBuffer();u.bindVertexArray(m),u.bindBuffer(u.ARRAY_BUFFER,h),u.bufferData(u.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),u.STATIC_DRAW);let g=u.getAttribLocation(p,`aPosition`);u.enableVertexAttribArray(g),u.vertexAttribPointer(g,2,u.FLOAT,!1,0,0);let _=u.createTexture();u.bindTexture(u.TEXTURE_2D,_),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MIN_FILTER,u.LINEAR),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MAG_FILTER,u.LINEAR),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_S,u.CLAMP_TO_EDGE),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_T,u.CLAMP_TO_EDGE);let v=Object.fromEntries([`uResolution`,`uPointer`,`uPointerVelocity`,`uPointerActive`,`uTravel`,`uTime`,`uTypography`].map(e=>[e,u.getUniformLocation(p,e)])),y=document.createElement(`canvas`),b=y.getContext(`2d`),x={x:.5,y:.5,active:0},S={x:.5,y:.5,active:0},C={x:0,y:0},w=0,T=0,E=0,D=-1/0,O=!1,k=!0,A=!1,j=!1,M=window.innerWidth,N=window.innerHeight,P=0,F=1,I=()=>{if(!b||O||A)return;let e=Math.min(window.devicePixelRatio||1,2);y.width=Math.round(M*e),y.height=Math.round(N*e),b.scale(e,e),b.clearRect(0,0,M,N),b.textBaseline=`middle`,c.matches||(n.dataset.renderer=`webgl2`);let t=i.getBoundingClientRect();for(let e of n.querySelectorAll(`[data-optical-text]`)){let n=getComputedStyle(e),r=e.getBoundingClientRect(),i=e.textContent||``;b.font=`${n.fontWeight} ${n.fontSize} ${n.fontFamily}`,b.fillStyle=n.color;let a=Number.parseFloat(n.letterSpacing)||0,o=Array.from(i),s=o.map(e=>b.measureText(e).width),c=s.reduce((e,t)=>e+t,0)+a*(o.length-1),l=(M-c)/2,u=r.top-t.top+r.height/2;o.forEach((e,t)=>{b.fillText(e,l,u),l+=s[t]+a})}u.bindTexture(u.TEXTURE_2D,_),u.pixelStorei(u.UNPACK_FLIP_Y_WEBGL,!0),u.texImage2D(u.TEXTURE_2D,0,u.RGBA,u.RGBA,u.UNSIGNED_BYTE,y),j=!0},L=()=>{M=e.clientWidth,N=e.clientHeight;let t=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(21e5/(M*N)));e.width=Math.max(1,Math.round(M*t)),e.height=Math.max(1,Math.round(N*t)),u.viewport(0,0,e.width,e.height),P=r.getBoundingClientRect().top+window.scrollY,F=Math.max(1,r.offsetHeight-N),I(),z()},R=t=>{if(w=0,O||A||document.hidden)return;if(c.matches){delete n.dataset.renderer,e.style.visibility=`hidden`;return}if(e.style.visibility=`visible`,!j)return;let r=T?Math.max(.001,Math.min((t-T)/1e3,.06)):.016;T=t,E+=r;let i=1-Math.exp(-r*11),a=1-Math.exp(-r*5),o=Math.max(0,Math.min(1,(window.scrollY-P)/F));o>.85&&t-D>900&&(S.active=0);let s=x.x,l=x.y;x.x+=(S.x-x.x)*i,x.y+=(S.y-x.y)*i,x.active+=(S.active-x.active)*a,C.x+=((x.x-s)/r-C.x)*a,C.y+=((x.y-l)/r-C.y)*a,u.useProgram(p),u.bindVertexArray(m),u.activeTexture(u.TEXTURE0),u.bindTexture(u.TEXTURE_2D,_),u.uniform1i(v.uTypography,0),u.uniform2f(v.uResolution,e.width,e.height),u.uniform2f(v.uPointer,x.x,x.y),u.uniform2f(v.uPointerVelocity,Math.max(-.6,Math.min(.6,C.x)),Math.max(-.6,Math.min(.6,C.y))),u.uniform1f(v.uPointerActive,x.active),u.uniform1f(v.uTravel,o),u.uniform1f(v.uTime,E),u.drawArrays(u.TRIANGLE_STRIP,0,4),n.dataset.renderer=`webgl2`,k||x.active>.001||S.active>0?z():T=0};function z(){!w&&!O&&!document.hidden&&!A&&(w=requestAnimationFrame(R))}let B=e=>{!l.matches||c.matches||e.pointerType===`touch`||(S.x=e.clientX/M,S.y=1-e.clientY/N,S.active=1,D=performance.now(),z())},V=e=>{e.relatedTarget||(S.active=0)},H=()=>{S.active=0},U=()=>{document.hidden?(S.active=0,x.active=0,cancelAnimationFrame(w),w=0):(T=0,z())},W=()=>{S.active=0,x.active=0,L()},G=t=>{t.preventDefault(),A=!0,cancelAnimationFrame(w),w=0,delete n.dataset.renderer,e.style.visibility=`hidden`},K=new IntersectionObserver(([e])=>{k=e.isIntersecting,z()},{threshold:0});K.observe(r);let q=new ResizeObserver(L);return q.observe(i),window.addEventListener(`pointermove`,B,{passive:!0}),window.addEventListener(`pointerout`,V,{passive:!0}),window.addEventListener(`blur`,H),window.addEventListener(`resize`,L,{passive:!0}),document.addEventListener(`visibilitychange`,U),e.addEventListener(`webglcontextlost`,G),c.addEventListener(`change`,W),l.addEventListener(`change`,W),L(),document.fonts.ready.then(()=>{O||(I(),z())}),()=>{O=!0,cancelAnimationFrame(w),K.disconnect(),q.disconnect(),window.removeEventListener(`pointermove`,B),window.removeEventListener(`pointerout`,V),window.removeEventListener(`blur`,H),window.removeEventListener(`resize`,L),document.removeEventListener(`visibilitychange`,U),e.removeEventListener(`webglcontextlost`,G),c.removeEventListener(`change`,W),l.removeEventListener(`change`,W),delete n.dataset.renderer,u.deleteTexture(_),u.deleteBuffer(h),u.deleteVertexArray(m),u.deleteProgram(p),u.deleteShader(d),u.deleteShader(f)}},[e]),(0,i.jsx)(`canvas`,{ref:t,className:`particle-field`,"aria-hidden":`true`})}export{c as ParticleField};