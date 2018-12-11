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
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/on',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/config',
  'jimu/utils',
  'esri/core/watchUtils',
  'node_modules/chart.js/dist/Chart.js',
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils, Chart) {

  var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

    baseClass: 'jimu-widget-overview',

    postCreate: function () {
      this.inherited(arguments);
      var that = this
      //Global Variable Listener (on window.filterlistener)
      window.filterlistener.registerListener(function (val) {
        //populate Cluster Info
        // that._populateClusterInfo();
      });

    },
    onOpen: function () {
      window.lastwidget.setWidget("Marketing");
      $("#datepicker").datepicker({ dateFormat: 'dd M yy' });

      var that = this
      $('#datepicker').change(function () {
        window.OccupationDate.DateVal = that.datepicker0.value
        console.log(that.datepicker0.value)

        that.colcontainer.classList.add("hidden");

        //populate Cluster Info
        that._populateClusterInfo();
      });

      var view = this.sceneView
      view.on("click", function (event) {
        view.hitTest(event.screenPoint).then(function (response) {
          var graphic = response.results[0].graphic;
          var feature = that._findFeature(window.Buildings, graphic);
          console.log(feature);
          if (!(feature == null)) {
            that.colcontainer.classList.remove("hidden");
            that._populateContent(feature);

          } else {
            that.colcontainer.classList.add("hidden");

          }
        });
      });
    },

    _findFeature: function (layer, graphic) {
      var feature = layer.filter(function (b) {
        return (b.OBJECTID === graphic.attributes.OBJECTID);
      })[0];
      return feature;
    },

    _populateClusterInfo: function () {
      
      function findWithAttr(array, attr, value, attr2, value2) {
        for (var i = 0; i < array.length; i += 1) {
          if (!attr2 && !value2) {
            if (array[i][attr] === value) {
              return i;
            }
          } else {
            if (array[i][attr] === value && array[i][attr2] === value2) {
              return i;
            }
          }
        }
        return -1;
      }
      //Full set of data
      var IDTA0 = window.IDTA, tenancy0 = window.tenancy, PMS0 = window.PMS, subtenants0 = window.subtenants;
      //Data based on filter
      var IDTA = [], tenancy = [], PMS = [], subtenants = [], listTAAccounts = [] //,listTAAccounts_IDTA = [];

      for (var i = 0; i < tenancy0.length; i++) {
        var dateOccupationDate = new Date(window.OccupationDate.DateVal)
        var TAExpiry = new Date(tenancy0[i].ExistingTAExpiryDate), Timeline = new Date(tenancy0[i].Timeline), maxTimeline = new Date(window.maxTimeline)

        if (TAExpiry <= dateOccupationDate && Timeline.getTime() == maxTimeline.getTime()) {
          tenancy.push(tenancy0[i])
          listTAAccounts.push(tenancy0[i].TA_Account)
        }
      }

      for (var i = 0; i < IDTA0.length; i++) {
        if ((listTAAccounts.indexOf(IDTA0[i].TA_Account) != -1 || listTAAccounts.length == 0)&&(IDTA0[i].Timeline == window.maxTimeline)){
            IDTA.push(IDTA0[i])
        }
      }
      for (var i = 0; i < IDTA.length; i++) {
        var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA[i].Property_ID, "Timeline", window.maxTimeline)
        if (PMSindex != -1) {
          PMS.push(PMS0[PMSindex])
        }
      }

    },

    _populateContent: function (feature) {

    }

  });
  return clazz;
});