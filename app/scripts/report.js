/*
 Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

//do not change! take care or body classes;
var body = document.querySelector('body');
if(body){
  var bclist = body.classList;
  if(bclist && bclist.contains('sl-skin')){bclist.remove('sl-skin');}
  if(bclist && bclist.contains('reportal-viewmode')){bclist.remove('reportal-viewmode');}
}

function setUIdefaults(namespace, config){
  document.querySelector('template').initializeDefaultValue = function(ev){
    console.log('init template');
    console.log(namespace);
    console.log(config);
    // LS is the name of variable specified in binding on iron-localstorage value attribute, must match!
    this[namespace] = config;
  };

}

function importHref(element, params, onload, onerror) {
  var l = document.createElement(element);
  for(var param in params){
    l[param] = params[param];
  }
  if (onload) {
    l.onload = onload.bind(this);
  }
  if (onerror) {
    l.onerror = onerror.bind(this);
  }
  document.head.appendChild(l);
  return l;
}
//importHref('script',{src:'/isa/BDJPFRDMEYBPBKLVADAYFQCDAVIOEQJR/polymer-elements/webcomponents-lite.min.js'});

//meta-creator, pass array of arrays [['paramName', 'paramValue']]
function addMeta(params){
  if(params && typeof params ==='object'){
    var meta = document.createElement('meta');
    for(var key in params){
      meta.setAttribute(key, params[key]);
    }
    document.head.appendChild(meta);
  }
}

//This script assumes that the icons are placed in the same folder as the script itself
//make reportal a web-app via  tags
addMeta({name:'viewport', content:'width=device-width, initial-scale=1'});
//addMeta({name:'theme-color', content:'#303F9F'}); //Chrome for Android theme color
//addMeta({name:'msapplication-TileColor', content:'#3372DF'}); //Tile color for Win8
//addMeta({name:'msapplication-TileImage', content:'ms-touch-icon-144x144-precomposed.png'}); //Tile icon for Win8 (144x144)

//Add to homescreen for Chrome on Android
addMeta({name:'mobile-web-app-capable',content:'yes'});
//addMeta({name:'application-name', content:'Confirmit Material Dream'});
//Add to homescreen for Safari on iOS
addMeta({name:'apple-mobile-web-app-capable', content:'yes'});
addMeta({name:'apple-mobile-web-app-status-bar-style', content:'black'});
//addMeta({name:'apple-mobile-web-app-title', content:'Confirmit Material Dream'});

/* fix YUI overriding CustomEvent globally*/
var CustomEventIframe=document.createElement('iframe');
CustomEventIframe.style.display="none";
document.body.appendChild(CustomEventIframe);
var realCustomEvent = CustomEventIframe.contentWindow['CustomEvent'];
window.CustomEvent = realCustomEvent;

/* replace in Polymer-mini.html @ ~1039 if events do not work properly in Polymer
 Polymer.dom = function (obj, patch) {
 if (obj instanceof Event || (obj && obj.__proto__ && obj.__proto__.hasOwnProperty('initCustomEvent'))) {
 return Polymer.EventApi.factory(obj);
 } else {
 return factory(obj, patch);
 }
 };
 */

/*null HighCharts width and height globally, adjust spacing*/
(function() {
  if (typeof YUI !== 'undefined') {
    YUI().use('event-custom', function (Y) {
      Y.Global.on('cf:chartBeforeCreate', function (eventData) {
        eventData.chartOptions.chart.width = null;
        eventData.chartOptions.chart.height = null;
        eventData.chartOptions.chart.spacing = [16, 24, 24, 24];
      });
    });
  }
})();

  window._poll = window._poll || function(fn, callback,timeout, interval, errback){
    var endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;
    (function p() {
      if(fn()) { callback();}
      else if (Number(new Date()) < endTime) { setTimeout(p, interval); }
      else { if(typeof errback ==='function'){errback(new Error('timed out for ' + fn + ': ' + arguments))}}
    })();
  };


