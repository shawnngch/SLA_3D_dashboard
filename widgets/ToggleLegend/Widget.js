///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  "dojo/dom-class",
  'dojo/on',
  "dojo/query",
  "dojo/dom-style",
  'jimu/BaseWidget',
  "dojo/throttle",
  "dojo/_base/fx",
  "dijit/focus",
  'dojo/topic',
  "dojo/_base/window",
  'jimu/PanelManager',
  'jimu/utils'
], function(declare, lang, domClass, on, query, domStyle, BaseWidget, throttle,
            baseFx, focus, topic, win, PanelManager, jimuUtils) {
  var clazz = declare([BaseWidget], {
    name: 'FullScreen',
    baseClass: 'jimu-widget-toggleLegend',
    LegendState: true,

    _onToggleLegendClick: function() {
      // this._toggleFullScreen();
      if(this.LegendState == true){
        document.getElementById('widgets_Legend0').style.display = "none";
        this.LegendState = false
      }else{
        document.getElementById('widgets_Legend0').style.display = "block";
        this.LegendState = true
      }
    },
  });

  return clazz;
});
