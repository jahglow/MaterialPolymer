/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
/*
(function(document) {
  'use strict';


  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  app.displayInstalledToast = function() {
    document.querySelector('#caching-complete').show();
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    console.log('Our app is ready to rock!');
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered
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

    // Scale bottomContainer and bottom sub title to nothing and back
    Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);

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

})(document);*/

// 4. Conditionally load the webcomponents polyfill if needed by the browser.
// This feature detect will need to change over time as browsers implement
// different features.
var webComponentsSupported = ('registerElement' in document && 'import' in document.createElement('link') && 'content' in document.createElement('template') && window.wrap);

if (!webComponentsSupported) {
  console.log('webComponents not supported');
  var script = document.createElement('script');
  script.async = true;
  script.src = '../bower_components/webcomponentsjs/webcomponents-lite.min.js';
  script.onload = finishLazyLoading;
  document.head.appendChild(script);
} else {
  console.log('webComponents supported');
  finishLazyLoading();
}

function finishLazyLoading() {
  // (Optional) Use native Shadow DOM if it's available in the browser.
  window.Polymer = window.Polymer || {dom: 'shadow'};
  // 6. Fade splash screen, then remove.
  var onImportLoaded = function() {
    console.log('on import loaded');
    var loadEl = document.getElementById('splash');
    loadEl.addEventListener('transitionend', function(){
      loadEl.style.display='none';
      loadEl.parentNode.removeChild(loadEl);
    });

    document.body.classList.remove('loading');

    // App is visible and ready to load some data!
  };

  var link = document.querySelector('#bundle');

  // 5. Go if the async Import loaded quickly. Otherwise wait for it.
  // crbug.com/504944 - readyState never goes to complete until Chrome 46.
  // crbug.com/505279 - Resource Timing API is not available until Chrome 46.
  if (link.import && link.import.readyState === 'complete') {
    console.log('link import complete');
    if(!webComponentsSupported){
      window.addEventListener('WebComponentsReady', onImportLoaded)
    } else {
      onImportLoaded();
    }

  } else {
    console.log('listen to LOAD');
    if(!webComponentsSupported){
      window.addEventListener('WebComponentsReady', onImportLoaded)
    } else {
      link.addEventListener('load', onImportLoaded);
    }

  }
}
