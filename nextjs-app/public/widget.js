"use strict";var ChatbotWidget=(()=>{var h=Object.defineProperty;var x=Object.getOwnPropertyDescriptor;var E=Object.getOwnPropertyNames;var C=Object.prototype.hasOwnProperty;var M=(n,e)=>{for(var t in e)h(n,t,{get:e[t],enumerable:!0})},k=(n,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of E(e))!C.call(n,s)&&s!==t&&h(n,s,{get:()=>e[s],enumerable:!(i=x(e,s))||i.enumerable});return n};var B=n=>k(h({},"__esModule",{value:!0}),n);var H={};M(H,{destroy:()=>S,init:()=>T});function m(n){return n.replace(/\/$/,"")}async function u(n,e){try{let t=await fetch(`${m(n)}/api/public/config`,{headers:{Authorization:`Bearer ${e}`}});return t.ok?await t.json():null}catch(t){return null}}async function w(n,e,t,i=5){var a;let s=await fetch(`${m(n)}/api/public/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({query:t,top_k:i})}),o=await s.json().catch(()=>({}));if(!s.ok)throw new Error((o==null?void 0:o.error)||`Request failed (${s.status})`);return{answer:o.answer,sources:(a=o.sources)!=null?a:[]}}var d={position:"bottom-right",primaryColor:"#4f46e5",welcomeMessage:"Hi! How can I help you today?",chatbotName:"Assistant"},f=0;function c(){return f+=1,`msg-${Date.now()}-${f}`}var p=class{constructor(e){this.resolved={...d};this.messages=[];this.isOpen=!1;this.isSending=!1;this.configReady=Promise.resolve();var t,i,s,o;if(!(e!=null&&e.apiKey))throw new Error('[ChatbotWidget] "apiKey" is required.');if(!(e!=null&&e.baseUrl))throw new Error('[ChatbotWidget] "baseUrl" is required.');this.config=e,this.resolved={position:(t=e.position)!=null?t:d.position,primaryColor:(i=e.primaryColor)!=null?i:d.primaryColor,welcomeMessage:(s=e.welcomeMessage)!=null?s:d.welcomeMessage,chatbotName:(o=e.chatbotName)!=null?o:d.chatbotName}}async mount(){this.buildDom(),document.body.appendChild(this.host),this.applyTheme(),this.configReady=this.loadRemoteConfig(),await this.configReady}async loadRemoteConfig(){var t,i,s,o,a,l,b,g;let e=await u(this.config.baseUrl,this.config.apiKey);e&&(this.resolved={position:(i=(t=this.config.position)!=null?t:e.position)!=null?i:this.resolved.position,primaryColor:(o=(s=this.config.primaryColor)!=null?s:e.primaryColor)!=null?o:this.resolved.primaryColor,welcomeMessage:(l=(a=this.config.welcomeMessage)!=null?a:e.welcomeMessage)!=null?l:this.resolved.welcomeMessage,chatbotName:(g=(b=this.config.chatbotName)!=null?b:e.name)!=null?g:this.resolved.chatbotName},this.applyTheme())}destroy(){var e;(e=this.host)==null||e.remove()}buildDom(){this.host=document.createElement("div"),this.host.setAttribute("data-chatbot-widget-host",""),this.shadow=this.host.attachShadow({mode:"open"});let e=document.createElement("style");e.textContent=N,this.shadow.appendChild(e);let t=document.createElement("div");t.className="cbw-root",this.shadow.appendChild(t),this.toggleBtnEl=document.createElement("button"),this.toggleBtnEl.className="cbw-toggle",this.toggleBtnEl.setAttribute("aria-label","Open chat"),this.toggleBtnEl.innerHTML=y,this.toggleBtnEl.addEventListener("click",()=>this.toggle()),t.appendChild(this.toggleBtnEl),this.panelEl=document.createElement("div"),this.panelEl.className="cbw-panel cbw-hidden",t.appendChild(this.panelEl);let i=document.createElement("div");i.className="cbw-header";let s=document.createElement("span");s.className="cbw-header-title",s.textContent=this.resolved.chatbotName;let o=document.createElement("button");o.className="cbw-close",o.setAttribute("aria-label","Close chat"),o.innerHTML=v,o.addEventListener("click",()=>this.close()),i.appendChild(s),i.appendChild(o),this.panelEl.appendChild(i),this.messagesEl=document.createElement("div"),this.messagesEl.className="cbw-messages",this.panelEl.appendChild(this.messagesEl);let a=document.createElement("div");a.className="cbw-input-bar",this.inputEl=document.createElement("textarea"),this.inputEl.className="cbw-input",this.inputEl.placeholder="Type your message\u2026",this.inputEl.rows=1,this.inputEl.addEventListener("keydown",l=>{l.key==="Enter"&&!l.shiftKey&&(l.preventDefault(),this.handleSend())}),this.inputEl.addEventListener("input",()=>{this.inputEl.style.height="auto",this.inputEl.style.height=`${Math.min(this.inputEl.scrollHeight,100)}px`}),this.sendBtnEl=document.createElement("button"),this.sendBtnEl.className="cbw-send",this.sendBtnEl.setAttribute("aria-label","Send message"),this.sendBtnEl.innerHTML=L,this.sendBtnEl.addEventListener("click",()=>this.handleSend()),a.appendChild(this.inputEl),a.appendChild(this.sendBtnEl),this.panelEl.appendChild(a)}applyTheme(){this.host.style.setProperty("--cbw-primary",this.resolved.primaryColor);let e=this.shadow.querySelector(".cbw-root");e&&(e.classList.toggle("cbw-left",this.resolved.position==="bottom-left"),e.classList.toggle("cbw-right",this.resolved.position!=="bottom-left"));let t=this.shadow.querySelector(".cbw-header-title");t&&(t.textContent=this.resolved.chatbotName)}toggle(){this.isOpen?this.close():this.open()}async open(){this.isOpen=!0,this.panelEl.classList.remove("cbw-hidden"),this.toggleBtnEl.innerHTML=v,this.messages.length===0&&(await this.configReady,this.addMessage({id:c(),role:"bot",content:this.resolved.welcomeMessage})),this.inputEl.focus()}close(){this.isOpen=!1,this.panelEl.classList.add("cbw-hidden"),this.toggleBtnEl.innerHTML=y}addMessage(e){this.messages.push(e),this.renderMessage(e),this.messagesEl.scrollTop=this.messagesEl.scrollHeight}renderMessage(e){let t=document.createElement("div");t.className=`cbw-row ${e.role==="user"?"cbw-row-user":"cbw-row-bot"}`;let i=document.createElement("div");if(i.className="cbw-bubble",i.textContent=e.content,t.appendChild(i),e.sources&&e.sources.length>0){let s=document.createElement("div");s.className="cbw-sources";for(let o of e.sources){let a=document.createElement("span");a.className="cbw-source-chip",a.textContent=`\u{1F4C4} ${o.document_name}`,s.appendChild(a)}i.appendChild(s)}this.messagesEl.appendChild(t)}setTyping(e){let t=this.shadow.querySelector(".cbw-typing");e?t||(t=document.createElement("div"),t.className="cbw-row cbw-row-bot cbw-typing",t.innerHTML='<div class="cbw-bubble cbw-dots"><span></span><span></span><span></span></div>',this.messagesEl.appendChild(t),this.messagesEl.scrollTop=this.messagesEl.scrollHeight):t==null||t.remove()}async handleSend(){var t;let e=this.inputEl.value.trim();if(!(!e||this.isSending)){this.inputEl.value="",this.inputEl.style.height="auto",this.addMessage({id:c(),role:"user",content:e}),this.isSending=!0,this.sendBtnEl.disabled=!0,this.setTyping(!0);try{let{answer:i,sources:s}=await w(this.config.baseUrl,this.config.apiKey,e,(t=this.config.topK)!=null?t:5);this.setTyping(!1),this.addMessage({id:c(),role:"bot",content:i,sources:s})}catch(i){this.setTyping(!1);let s=i instanceof Error?i.message:"Something went wrong. Please try again.";this.addMessage({id:c(),role:"bot",content:`\u26A0\uFE0F ${s}`})}finally{this.isSending=!1,this.sendBtnEl.disabled=!1}}}},y='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9-1.5 0-2.92-.37-4.16-1.02L3 21l1.05-3.68A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"/></svg>',v='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',L='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>',N=`
  :host { all: initial; }
  .cbw-root {
    position: fixed;
    bottom: 20px;
    z-index: 2147483000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .cbw-root.cbw-right { right: 20px; }
  .cbw-root.cbw-left { left: 20px; }

  .cbw-toggle {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    transition: transform 0.15s ease;
  }
  .cbw-toggle:hover { transform: scale(1.06); }

  .cbw-panel {
    position: absolute;
    bottom: 72px;
    width: 340px;
    max-height: min(70vh, 520px);
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.06);
  }
  .cbw-root.cbw-right .cbw-panel { right: 0; }
  .cbw-root.cbw-left .cbw-panel { left: 0; }
  .cbw-panel.cbw-hidden { display: none; }

  .cbw-header {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
  }
  .cbw-close {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    opacity: 0.85;
  }
  .cbw-close:hover { opacity: 1; }

  .cbw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8f9fb;
  }

  .cbw-row { display: flex; }
  .cbw-row-user { justify-content: flex-end; }
  .cbw-row-bot { justify-content: flex-start; }

  .cbw-bubble {
    max-width: 82%;
    padding: 9px 13px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .cbw-row-user .cbw-bubble {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .cbw-row-bot .cbw-bubble {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid rgba(0,0,0,0.06);
    border-bottom-left-radius: 4px;
  }

  .cbw-sources { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
  .cbw-source-chip {
    font-size: 10.5px;
    background: rgba(79,70,229,0.08);
    color: var(--cbw-primary, #4f46e5);
    border: 1px solid rgba(79,70,229,0.18);
    border-radius: 99px;
    padding: 2px 8px;
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cbw-dots { display: flex; gap: 4px; align-items: center; }
  .cbw-dots span {
    width: 6px; height: 6px; border-radius: 50%;
    background: #9ca3af;
    animation: cbw-blink 1.2s ease-in-out infinite;
  }
  .cbw-dots span:nth-child(2) { animation-delay: 0.2s; }
  .cbw-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cbw-blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

  .cbw-input-bar {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid rgba(0,0,0,0.06);
    background: #fff;
  }
  .cbw-input {
    flex: 1;
    resize: none;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 13.5px;
    font-family: inherit;
    max-height: 100px;
    outline: none;
  }
  .cbw-input:focus { border-color: var(--cbw-primary, #4f46e5); }

  .cbw-send {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border: none;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .cbw-send:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 480px) {
    .cbw-panel { width: calc(100vw - 32px); }
  }
`;var r=null;function T(n){r==null||r.destroy();let e=new p(n);return r=e,e.mount(),e}function S(){r==null||r.destroy(),r=null}return B(H);})();
//# sourceMappingURL=index.global.js.map