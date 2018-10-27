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
  "esri/tasks/QueryTask",
  "esri/layers/SceneLayer",
  "esri/tasks/support/Query",
  "esri/renderers/SimpleRenderer",
  "esri/renderers/UniqueValueRenderer",
  'node_modules/chart.js/dist/Chart.js',
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils,
  QueryTask, SceneLayer, Query, SimpleRenderer, UniqueValueRenderer, Chart) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-overview',
      _config: null,
      SnapshotDate: window.SnapshotDate,
      TADT: null,

      //lighting._lastTimezone:The time zone which map shows
      //lighting.date: The date map uses

      postCreate: function () {
        this.inherited(arguments);

        this._config = lang.clone(this.config.editor);
        var that = this;

        var SnapshotDate = this.SnapshotDate
        if (!this.SnapshotDate) {
          console.log("no SnapshotDate")
          SnapshotDate = new Date("2018-10-01");
          this.SnapshotDate = SnapshotDate;
        }

        var TanglinBuildings_queryTask = new QueryTask({
          url: this._config.layerInfos[0].featureLayer.url //"https://services2.arcgis.com/GrCObcYo81O3Ymu8/ArcGIS/rest/services/Buildings_Tanglin/FeatureServer/0"
        });
        var TanglinBuildings = [], Cluster = [], Property = [], Building = [], Floor = [];

        var query = new Query();
        query.returnGeometry = false;
        // query.where = "SnapshotDate = '" + this.SnapshotDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + "'";
        query.where = "";
        query.outFields = ["*"];

        TanglinBuildings_queryTask.execute(query).then(function (Results) {
          console.log("TanglinBuildings_queryTask_Results")
          var resultset = Results.features;
          for (var i = 0; i < resultset.length; i++) {
            TanglinBuildings.push(resultset[i].attributes);

            if (resultset[i].attributes.subtenancy_info_Classification_ !== null && Cluster.indexOf(resultset[i].attributes.subtenancy_info_Classification_) == -1)
              Cluster.push(resultset[i].attributes.subtenancy_info_Classification_)
            if (resultset[i].attributes.subtenancy_info_Property_Unit_L !== null && Property.indexOf(resultset[i].attributes.subtenancy_info_Property_Unit_L) == -1)
              Property.push(resultset[i].attributes.subtenancy_info_Property_Unit_L)
            if (resultset[i].attributes.subtenancy_info_Block_No !== null && Building.indexOf(resultset[i].attributes.subtenancy_info_Block_No) == -1)
              Building.push(resultset[i].attributes.subtenancy_info_Block_No)
            if (resultset[i].attributes.Tanglin_Village_Storey !== null && Floor.indexOf(resultset[i].attributes.Tanglin_Village_Storey) == -1)
              Floor.push(resultset[i].attributes.Tanglin_Village_Storey)

          }
          window.TanglinBuildings = TanglinBuildings;
          window.Cluster = Cluster;
          window.Property = Property;
          window.Building = Building;
          window.Floor = Floor;

          that.populateFilterVal();
          console.log(TanglinBuildings)
        }, function (err) {
          // Do something when the process errors out
          console.log(err)
        })

        // var TanglinLayer = new SceneLayer({
        //   url: "https://services2.arcgis.com/GrCObcYo81O3Ymu8/arcgis/rest/services/Buildings_Tanglin/SceneServer"
        // });
        // var TanglinQuery = TanglinLayer.createQuery();

        // TanglinLayer.queryFeatures(TanglinQuery)
        //   .then(function (response) {
        //     console.log(response)
        //   }, function (err) {
        //     console.log(err)
        //   });

      },
      populateFilterVal: function () {
        this.PropertyFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Property.length; i++) {
          this.PropertyFilter.innerHTML += "<option value='" + window.Property[i] + "'>" + window.Property[i] + "</option>"
        }
        this.ClusterFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Cluster.length; i++) {
          this.ClusterFilter.innerHTML += "<option value='" + window.Cluster[i] + "'>" + window.Cluster[i] + "</option>"
        }
        this.BuildingFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Building.length; i++) {
          this.BuildingFilter.innerHTML += "<option value='" + window.Building[i] + "'>" + window.Building[i] + "</option>"
        }
        this.FloorFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Floor.length; i++) {
          this.FloorFilter.innerHTML += "<option value='" + window.Floor[i] + "'>" + window.Floor[i] + "</option>"
        }
        for (var i = 0; i < this._config.ViewBy.length; i++) {
          this.ViewFilter.innerHTML += "<option value='" + this._config.ViewBy[i].Value + "'>" + this._config.ViewBy[i].Display + "</option>"
        }
        this.own(on(this.PropertyFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.ClusterFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.BuildingFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.FloorFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.ViewFilter, 'change', lang.hitch(this, this._onFilterChanged)));
      },

      _onFilterChanged: function () {
        var PropVal = this.PropertyFilter.value, ClusterVal = this.ClusterFilter.value,
          BuildingVal = this.BuildingFilter.value, FloorVal = this.FloorFilter.value
        ViewVal = this.ViewFilter.value;

        // var foundLayer = this.sceneView.map.allLayers.find(function (layer) {
        //   return layer.title === "Buildings Tanglin";
        // });

        var ClusterQuery = ClusterVal ? "subtenancy_info_Classification_ = '" + ClusterVal + "'" : ""
        var PropQuery = PropVal ? "subtenancy_info_Property_Unit_L= '" + PropVal + "'" : ""
        var BldgQuery = BuildingVal ? "subtenancy_info_Block_No= '" + BuildingVal + "'" : ""
        var floorQuery = FloorVal ? "Tanglin_Village_Storey= " + FloorVal : ""

        function findWithAttr(array, attr, value) {
          for (var i = 0; i < array.length; i += 1) {
            if (array[i][attr] === value) {
              return i;
            }
          }
          return -1;
        }
        var viewIndex = findWithAttr(this._config.ViewBy, "Value", ViewVal)
        var renderer = this._config.ViewBy[viewIndex].Renderer

        var queryDef = [ClusterQuery, PropQuery, BldgQuery, floorQuery].filter(Boolean).join("OR ");

        // update the definition expression of Buildings Tanglin layer
        this.sceneView.map.layers.forEach(function (layer) {
          if (layer.title == "Buildings Tanglin") {
            layer.definitionExpression = queryDef;
            layer.renderer = renderer
            layer.opacity = 0.5;
          }
        });

        console.log("_onFilterChanged")
      }

    });
    return clazz;
  });