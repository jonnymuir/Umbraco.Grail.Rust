(function(a,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("lit"),require("three")):typeof define=="function"&&define.amd?define(["exports","lit","three"],n):(a=typeof globalThis<"u"?globalThis:a||self,n(a.ContentCartographer={},a.lit,a.THREE))})(this,function(a,n,y){"use strict";function b(c){const e=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(c){for(const t in c)if(t!=="default"){const r=Object.getOwnPropertyDescriptor(c,t);Object.defineProperty(e,t,r.get?r:{enumerable:!0,get:()=>c[t]})}}return e.default=c,Object.freeze(e)}const i=b(y),m=class m extends n.LitElement{constructor(){super(),this.error="",this.impact=null,this.loading=!1,this.animate=()=>{requestAnimationFrame(this.animate),this.renderer&&this.scene&&this.camera&&this.renderer.render(this.scene,this.camera)},this.nodeId="1",this.baseUrl="/api/cartographer",this.config={}}async firstUpdated(){try{await this.loadWasm(),console.log("✅ WASM loaded"),this.initThree(),await this.loadGraphData()}catch(e){this.error=`Failed: ${e instanceof Error?e.message:String(e)}`,console.error(this.error,e)}}loadWasm(){return new Promise((e,t)=>{const r=document.createElement("script");r.src="/wasm/grail_core.js",r.type="text/javascript",r.onload=()=>{setTimeout(()=>{this.wasm=window.grail_core||window.wasm_bindgen,!this.wasm||!this.wasm.CartographerWasm?t(new Error("WASM module not available after load")):e()},100)},r.onerror=()=>t(new Error("Failed to load WASM script")),document.head.appendChild(r)})}async loadGraphData(){var e,t;if(!(!this.wasm||!this.scene)){this.loading=!0,this.requestUpdate();try{console.log("📡 Fetching graph from",`${this.baseUrl}/graph`);const r=await fetch(`${this.baseUrl}/graph`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({node_id:parseInt(this.nodeId)||1,depth:3,include_media:!0,include_tags:!0,include_unpublished:!1})});if(!r.ok){const s=await r.text();throw new Error(`HTTP ${r.status}: ${s}`)}const o=await r.json();if(console.log("📦 API response:",o),!o.success)throw new Error(o.error||"API error");const d=o.data;console.log("📊 Graph loaded:",{nodes:((e=d.nodes)==null?void 0:e.length)||0,edges:((t=d.edges)==null?void 0:t.length)||0}),this.renderGraph(d),await this.loadImpact()}catch(r){this.error=`Load failed: ${r instanceof Error?r.message:String(r)}`,console.error(this.error,r),console.log("⚠️ Falling back to demo graph"),this.renderDemoGraph()}finally{this.loading=!1,this.requestUpdate()}}}renderDemoGraph(){if(!(!this.wasm||!this.scene))try{const{CartographerWasm:e}=this.wasm,t=new e,d={nodes:[{id:"1",name:"Homepage",node_type:"content",level:0,is_published:!0},{id:"2",name:"About",node_type:"content",level:1,is_published:!0},{id:"3",name:"Services",node_type:"content",level:1,is_published:!0},{id:"4",name:"Blog",node_type:"content",level:1,is_published:!0},{id:"5",name:"Logo",node_type:"media",level:0,is_published:!0},{id:"6",name:"Team",node_type:"media",level:1,is_published:!0},{id:"7",name:"Featured",node_type:"tag",level:0,is_published:!0},{id:"8",name:"Article",node_type:"content",level:2,is_published:!0},{id:"9",name:"Archive",node_type:"content",level:2,is_published:!1},{id:"10",name:"Contact",node_type:"content",level:1,is_published:!0}],edges:[{source:"1",target:"2",relationship_type:"child_of",strength:1},{source:"1",target:"3",relationship_type:"child_of",strength:1},{source:"1",target:"4",relationship_type:"child_of",strength:1},{source:"1",target:"5",relationship_type:"uses_media",strength:.8},{source:"1",target:"10",relationship_type:"child_of",strength:1},{source:"2",target:"6",relationship_type:"uses_media",strength:.7},{source:"3",target:"7",relationship_type:"tagged_with",strength:.5},{source:"4",target:"8",relationship_type:"child_of",strength:1},{source:"4",target:"9",relationship_type:"child_of",strength:1},{source:"8",target:"7",relationship_type:"tagged_with",strength:.5}]};this.renderGraph(d),console.log("✅ Demo graph rendered (Rust physics)")}catch(e){this.error=`Demo render failed: ${e instanceof Error?e.message:String(e)}`,console.error(this.error,e)}}async loadImpact(){try{const e=await fetch(`${this.baseUrl}/impact?nodeId=${this.nodeId}`,{method:"POST"});if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();if(!t.success)throw new Error(t.error||"API error");this.impact=t.data,console.log("📈 Impact:",this.impact.impact_score),this.requestUpdate()}catch(e){console.warn("Impact load failed:",e)}}renderGraph(e){if(this.scene)try{const{CartographerWasm:t}=this.wasm,r=new t;r.add_nodes(JSON.stringify(e.nodes)),r.add_edges(JSON.stringify(e.edges));const o=r.calculate_layout(this.nodeId,100),d=JSON.parse(o);this.scene.children.slice().forEach(s=>{s instanceof i.Light||this.scene.remove(s)}),d.nodes.forEach(s=>{const h={media:1096065,tag:16096779,content:5195493},l=s.id===this.nodeId?16739179:h[s.node_type]||5195493,u=new i.SphereGeometry(5,16,16),f=new i.MeshPhongMaterial({color:l}),p=new i.Mesh(u,f);p.position.set(s.x*1.5,s.y*1.5,s.z),this.scene.add(p)}),d.edges.forEach(s=>{const h=d.nodes.find(p=>p.id===s.source),l=d.nodes.find(p=>p.id===s.target);if(!h||!l)return;const u=new i.BufferGeometry().setFromPoints([new i.Vector3(h.x*1.5,h.y*1.5,h.z),new i.Vector3(l.x*1.5,l.y*1.5,l.z)]),f=new i.LineBasicMaterial({color:7041664,transparent:!0,opacity:.3*s.strength});this.scene.add(new i.Line(u,f))}),console.log("✅ Graph rendered (Rust physics)")}catch(t){this.error=`Render failed: ${t instanceof Error?t.message:String(t)}`,console.error(this.error,t)}}initThree(){if(!this.canvasContainer)return;const e=this.canvasContainer.clientWidth,t=this.canvasContainer.clientHeight;this.scene=new i.Scene,this.scene.background=new i.Color(988970),this.camera=new i.PerspectiveCamera(75,e/t,.1,1e4),this.camera.position.z=200,this.renderer=new i.WebGLRenderer({antialias:!0}),this.renderer.setSize(e,t),this.renderer.setPixelRatio(window.devicePixelRatio),this.canvasContainer.appendChild(this.renderer.domElement);const r=new i.AmbientLight(16777215,.6);this.scene.add(r);const o=new i.DirectionalLight(16777215,.8);o.position.set(100,100,100),this.scene.add(o),this.animate()}render(){return n.html`
      <div class="wrapper">
        <div class="main">
          <div class="header">
            Content Cartographer (Node: ${this.nodeId}) ${this.wasm?"✅":"⏳"}
          </div>
          <div class="canvas-container" style="position: relative;"></div>
          ${this.error?n.html`<div class="error">${this.error}</div>`:""}
          <div class="controls">Powered by Rust petgraph + three.js</div>
        </div>
        <div class="sidebar">
          ${this.loading?n.html`<div class="loading">Loading...</div>`:""}
          ${this.impact?n.html`
                <h3>Impact Analysis</h3>
                <div class="impact-metric">
                  <div style="font-weight: 600; margin-bottom: 4px;">Score</div>
                  <div class="impact-bar">
                    <div class="impact-fill" style="width: ${this.impact.impact_score*100}%"></div>
                  </div>
                  <div style="color: #999; font-size: 11px;">${(this.impact.impact_score*100).toFixed(1)}%</div>
                </div>
                ${this.impact.directly_dependent.length>0?n.html`<div class="impact-metric">
                      <strong>${this.impact.directly_dependent.length}</strong> directly affected
                    </div>`:""}
                ${this.impact.indirectly_dependent.length>0?n.html`<div class="impact-metric">
                      <strong>${this.impact.indirectly_dependent.length}</strong> indirectly affected
                    </div>`:""}
                ${this.impact.backlinks.length>0?n.html`<div class="impact-metric">
                      <strong>${this.impact.backlinks.length}</strong> backlinks
                    </div>`:""}
              `:""}
        </div>
      </div>
    `}updated(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector(".canvas-container");e&&!this.canvasContainer&&(this.canvasContainer=e,this.renderer||this.initThree())}};m.styles=n.css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    .wrapper {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }
    .main { display: flex; flex-direction: column; }
    .header {
      padding: 12px 16px;
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      font-weight: 600;
      color: #111;
    }
    .canvas-container {
      flex: 1;
      background: #0f172a;
      position: relative;
      min-height: 500px;
    }
    canvas { display: block; width: 100%; height: 100%; }
    .controls {
      padding: 8px 12px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #666;
    }
    .sidebar {
      background: #f9fafb;
      border-left: 1px solid #e5e7eb;
      padding: 12px;
      overflow-y: auto;
      max-height: calc(500px + 50px);
      font-size: 13px;
    }
    .sidebar h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
    }
    .impact-metric {
      margin-bottom: 12px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #4f46e5;
    }
    .impact-bar {
      width: 100%;
      height: 6px;
      background: #e5e7eb;
      border-radius: 2px;
      margin: 4px 0;
      overflow: hidden;
    }
    .impact-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #ef4444);
    }
    .error {
      color: #dc2626;
      padding: 12px;
      font-size: 12px;
      background: #fee;
      border: 1px solid #fca;
      border-radius: 4px;
    }
    .loading {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
  `,m.properties={nodeId:{type:String},baseUrl:{type:String},config:{type:Object}};let g=m;customElements.define("content-cartographer",g);async function w(){try{return await import("/wasm/grail_core.js")}catch(c){throw console.error("Failed to initialize Cartographer WASM module:",c),c}}const v={showDepth:3,visualizationMode:"force-directed",highlightRelationships:["depends_on","uses_media","tagged_with","references"],enableImpactAnalysis:!0,enableExport:!0,physics:{temperature:100,cooling:.1,iterations:100}},_="1.0.0",x="@umbraco-grail/content-cartographer";a.ContentCartographer=g,a.DEFAULT_CONFIG=v,a.PACKAGE_NAME=x,a.VERSION=_,a.initializeCartographer=w,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
