(function(document) {
  'use strict';

  if (!window.webComponentsSupported) {
    importHref('script',{src:'//reportal.euro.confirmit.com/isa/BDJPFRDMEYBPBKLVADAYFQCDAVIOEQJR/Polymer/webcomponents-lite.min.js',onload:finishLazyLoading});
    /*var script = document.createElement('script');
     script.async = true;
     script.src = '//reportal.euro.confirmit.com/isa/BDJPFRDMEYBPBKLVADAYFQCDAVIOEQJR/Polymer/webcomponents-lite.min.js';
     script.onload = finishLazyLoading;
     document.head.appendChild(script);*/
  } else {
    finishLazyLoading();
  }

// everything necessary to make your app run seamless, define here
  function appInit(){
    Polymer.Base.fire('reportalAppReady',{finished:true},{node:window});
  }
  function _replaceLoadingAnimation() {
    var progress = document.createElement('paper-progress');
    progress.setAttribute('indeterminate','');
    Polymer.Base.async(function(){
      try{
        window._poll(function(){return document.querySelector('#wait_c');},
          function(){
            var container = document.querySelector('#wait_c');
            if(container){
              container.setAttribute('style','');
              container.innerHTML='';
              container.appendChild(progress);
              var toolbar=document.querySelector('div[main] #headerContainer');
              if(toolbar){toolbar.appendChild(container);}
            }
          },
          5000, //5 seconds total
          1000, //check every second
          function(){console.log('failed to find & restyle loading progress for <report-master>');}
        );
      } catch(e){
        alert( e.name + ':' + e.message + '\n' + e.stack);
      }
    },3000);
  }


  function finishLazyLoading() {
    // (Optional) Use native Shadow DOM if it's available in the browser.
    window.Polymer = window.Polymer || {dom: 'shadow'};
    console.log('finish lazy loading')
    // 6. Fade splash screen, then remove.
    var onImportLoaded = function() {

      console.log('onImportLoaded');
      var loadEl = document.getElementById('splash');
      loadEl.addEventListener('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function(){loadEl.parentNode.removeChild(loadEl);});
      document.body.classList.remove('loading');
      validatorFix();
      appInit();
      _replaceLoadingAnimation();
      // App is visible and ready to load some data!
    };

    var link = document.querySelector('#bundle');

    // 5. Go if the async Import loaded quickly. Otherwise wait for it.
    // crbug.com/504944 - readyState never goes to complete until Chrome 46.
    // crbug.com/505279 - Resource Timing API is not available until Chrome 46.
    if (link.import && link.import.readyState === 'complete') {
      onImportLoaded();
    } else {
      link.addEventListener('load', onImportLoaded);
    }
  }


  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  //load local storage data into app


  addEventListener('iron-select',function(e){
    if(e.target.localName==='paper-tabs' && e.target.attributes.hasOwnProperty('lsns')){
      document.querySelector('#app').set(e.target.attributes.getNamedItem('lsns').value,e.target.selected);
    }
  });
  // Main area's paper-scroll-header-panel custom condensing transformation of
  // the appName in the middle-container and the bottom title in the bottom-container.
  // The appName is moved to top and shrunk on condensing. The bottom sub title
  // is shrunk to nothing on condensing.
  addEventListener('paper-header-transform', function(e) {
    var appName = document.querySelector('.app-name');
    var middleContainer = document.querySelector('.middle-container');
    var bottomContainer = document.querySelector('.bottom-container');
    var detail = e.detail;

    var heightDiff = detail.height - detail.condensedHeight;
    var yRatio = Math.min(1, detail.y / heightDiff);
    var maxMiddleScale = 0.50;  // appName max size when condensed. The smaller the number the smaller the condensed size.
    var scaleMiddle = Math.max(maxMiddleScale, (heightDiff - detail.y) / (heightDiff / (1-maxMiddleScale))  + maxMiddleScale);
    var scaleBottom = 1 - yRatio;

    // Move/translate middleContainer
    Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);

    // Scale bottomContainer and bottom sub title to nothing and back if not a paper-tabs or r-menu that uses paper-tabs
    if(bottomContainer.localName==='paper-tabs' || bottomContainer.firstElementChild.localName==='paper-tabs' || bottomContainer.firstElementChild.localName==='r-menu' || bottomContainer.localName==='r-menu'){
      Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', bottomContainer);
    } else {
      Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);
    }
    // Scale middleContainer appName
    Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
  });

  // Close drawer after menu item is selected if drawerPanel is narrow
  app.onMenuSelect = function() {
    var drawerPanel = document.querySelector('#paperDrawerPanel');
    if (drawerPanel.narrow) {
      drawerPanel.closeDrawer();
    }
  };

  // fix Page_Validators null because of elements upgrade bug
  function validatorFix(){
    Polymer.Base.async(function(){
      var validator = document.querySelectorAll('span[id*="_validator"]');
      var rv = document.querySelectorAll('span[id*="_rv"]');
      var valid = document.querySelectorAll('span[id*="_valid"]');
      if(typeof(Page_Validators)!=='undefined' && Page_Validators.length>0){
        if(Page_Validators.indexOf(null)>0){Page_Validators = [];}
        if(validator && validator.length>0){
          for(var v=0;v<validator.length;v++){
            window[validator[v].id] = validator[v];
            window[rv[v].id] = rv[v];
            if(Page_Validators.length===0 || Page_Validators.indexOf(validator[v])===-1){
              Page_Validators.push(validator[v]);
              Page_Validators.push(rv[v]);
            }
          }
        }
        if(valid && valid.length>0){
          for(var va=0;va<valid.length;va++){
            window[valid[va].id] = valid[va];
            if(Page_Validators.length===0 || Page_Validators.indexOf(valid[va])===-1){
              Page_Validators.push(valid[va]);
            }
          }
        }
      }
    },3000);
  }
})(document);
