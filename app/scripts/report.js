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
  if(bclist.contains('sl-skin')){bclist.remove('sl-skin');}
  if(bclist.contains('reportal-viewmode')){bclist.remove('reportal-viewmode');}
}
// end of do not change

function prependScript(pathToScript) {
  var head = document.getElementsByTagName('head')[0];
  var js = document.createElement('script');
  // js.type = "text/javascript";
  js.src = pathToScript;
  head.insertBefore(js, head.firstChild);
}
//change to the location of the script !IMPORTANT
//prependScript('/isa/BDJPFRDMEYBPBKLVADAYFQCDAVIOEQJR/polymer-elements/webcomponents.min.js');

//meta-creator, pass array of arrays [['paramName', 'paramValue']]
function metaCycle(params){
    if(params.length>0){
      var head = document.getElementsByTagName('head')[0];
      var meta = document.createElement('meta'),curAttr;
      for(var i=0;i<params.length;i++){
        curAttr=params[i];
        meta.setAttribute(curAttr[0], (curAttr[1]).toString());
      }
      head.insertBefore(meta, head.firstChild);
    }
}
/*
//This script assumes that the icons are placed in the same folder as the script itself
//make reportal a web-app via  tags
  metaCycle([['name','viewport'],['content','width=device-width, initial-scale=1']]);
  metaCycle([['name','theme-color'],['content','#303F9F']]); //Chrome for Android theme color
  metaCycle([['name','msapplication-TileColor'],['content','#3372DF']]); //Tile color for Win8
  metaCycle([['name','msapplication-TileImage'],['content','ms-touch-icon-144x144-precomposed.png']]); //Tile icon for Win8 (144x144)

//Add to homescreen for Chrome on Android
  metaCycle([['name','mobile-web-app-capable'],['content','yes']]);
  metaCycle([['name','application-name'],['content','Confirmit Material Dream']]);
//Add to homescreen for Safari on iOS
  metaCycle([['name','apple-mobile-web-app-capable'],['content','yes']]);
  metaCycle([['name','apple-mobile-web-app-status-bar-style'],['content','black']]);
  metaCycle([['name','apple-mobile-web-app-title'],['content','Confirmit Material Dream']]);
*/
(function() {
  if (typeof YUI !== 'undefined') {
    YUI().use('event-custom', function (Y) {
      Y.Global.on('cf:chartBeforeCreate', function (eventData) {
        console.log(eventData);
        eventData.chartOptions.chart.width = null;
        eventData.chartOptions.chart.height = null;
        eventData.chartOptions.chart.spacing = [16, 24, 24, 24];
      });
    });
  }
})();


