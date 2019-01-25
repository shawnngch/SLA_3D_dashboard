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
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/when',
  'dojo/on',
  // 'dojo/aspect',
  'dojo/query',
  'dojo/keys',
  'dojo/Deferred',
  'dojo/promise/all',
  'jimu/BaseWidget',
  // 'jimu/LayerInfos/LayerInfos',
  'jimu/utils',
  // 'esri/dijits/Search',
  "esri/layers/SceneLayer",
  "esri/layers/MapImageLayer",
  "esri/layers/ElevationLayer",
  // "esri/graphicsUtils",
  "esri/layers/TileLayer",
  'esri/widgets/Search',
  'esri/widgets/Search/SearchViewModel',
  // 'esri/tasks/locator',
  'esri/tasks/Locator',
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  // 'esri/layers/FeatureLayer',
  // 'esri/InfoTemplate',
  'esri/core/lang',
  'esri/symbols/PictureMarkerSymbol',
  './utils',
  'esri/widgets/Legend',
  'dojo/NodeList-dom'
],
  function (declare, lang, array, html, when, on, /*aspect,*/ query, keys, Deferred, all,
    BaseWidget, /*LayerInfos,*/ jimuUtils, SceneLayer, MapImageLayer, ElevationLayer,/*graphicsUtils,*/TileLayer, Search, SearchViewModel, Locator, QueryTask, Query,
    /*FeatureLayer, InfoTemplate,*/ esriLang, PictureMarkerSymbol, utils, Legend) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      name: 'filter0',
      baseClass: 'jimu-widget-filter0',
      searchDijit: null,
      _config: null,
      lastwidget0: null,
      subtenantsLayerTitle: null,
      texturedLayerTitle: null,
      untexturedLayerTitle: null,
      LayerTitle: {
        'subtenants': null,
        'textured': null,
        'untextured': null,
        'stateProperty': null,
      },

      postCreate: function () {
        window.toShortDate = function toShortDate(dateVal) {
          var date0 = new Date(dateVal)
          return (date0.getMonth() + 1) + "/" + date0.getDate() + "/" + date0.getFullYear();
        }

        //window.searchIDTA(values, field, Timeline)
        window.searchIDTA = function searchIDTA(values, field, Timeline) {
          var IDTA_filtered = window.IDTA.filter(el => el.TIMELINE == Timeline);
          var IDTA_return = []
          for (var i = 0; i < IDTA_filtered.length; i++) {
            if (values.indexOf(IDTA_filtered[i][field]) >= 0) {
              IDTA_return.push(IDTA_filtered[i])
            }
          }
          return IDTA_return
        }

        var that = this
        // Actual work after loading all data
          //Global Variable Listener (on Window.lastwidget)
          function Create(callback) {
            var widget = null;
            return {
              getWidget: function () { return widget; },
              setWidget: function (p) { widget = p; callback(widget); },
            };
          }

          window.lastwidget = Create(function (widget) {
            that.lastwidget0 = widget
            console.log(widget)
            that._populateFilterVal()
          });

          //Global Variable Listener (on Window.filtervalues)
          window.filterlistener = {
            filterValuesInternal: null,
            aListener: function (val) { },
            set filterValues(val) {
              this.filterValuesInternal = val;
              this.aListener(val);
            },
            get filterValues() {
              return this.filterValuesInternal;
            },
            registerListener: function (listener) {
              this.aListener = listener;
            }
          }

          //Global Variable Listener (on window.OccupationDate)
          window.OccupationDate = {
            OccupationDateInternal: null,
            aListener: function (val) { },
            set DateVal(val) {
              this.OccupationDateInternal = val;
              this.aListener(val);
            },
            get DateVal() {
              return this.OccupationDateInternal;
            },
            registerListener: function (listener) {
              this.aListener = listener;
            }
          }

          window.OccupationDate.registerListener(function (target_occupation_date) {
            // alert("Someone changed the value of x.a to " + val);
            // that._onFilterChanged(target_occupation_date);
            console.log("OccupationDate Listener")
            that._onFilterChanged();
          });

          // //Global Variable Listener (on window.OccupationDate)
          window.timeline = {
            timelineInternal: null,
            aListener: function (val) { },
            set DateVal(val) {
              this.timelineInternal = val;
              this.aListener(val);
            },
            get DateVal() {
              return this.timelineInternal;
            },
            registerListener: function (listener) {
              this.aListener = listener;
            }
          }

          window.timeline.registerListener(function () {
            that._onFilterChanged();
          });
      },
      startup: function () {

        var that = this;
        this._config = lang.clone(this.config.editor);
        window._config = this._config
        //Load all data
        var PMS = [], IDTA = [], subtenants = [], tenancy = [], Units = [], Buildings = [];
        var Timeline = [];

        var pmsQueryTask = new QueryTask({ url: this._config.layerInfos[0].featureLayer.url });
        var tenancyQueryTask = new QueryTask({ url: this._config.layerInfos[3].featureLayer.url });
        var idtaQueryTask = new QueryTask({ url: this._config.layerInfos[1].featureLayer.url });
        var subtenantsQueryTask = new QueryTask({ url: this._config.layerInfos[2].featureLayer.url });
        var Units_queryTask = new QueryTask({ url: this._config.layerInfos[4].featureLayer.url });
        var Buildings_queryTask = new QueryTask({ url: this._config.layerInfos[5].featureLayer.url });

        var query = new Query();
        query.returnGeometry = false;
        query.where = "1=1"
        query.outFields = ["*"];

        pmsQueryTask.execute(query).then(function (pmsResults) {
          var resultset = pmsResults.features;
          console.log("PMS");
          for (var i = 0; i < resultset.length; i++) {
            PMS.push(resultset[i].attributes);
            if (Timeline.indexOf(resultset[i].attributes["TIMELINE"]) == -1) Timeline.push(resultset[i].attributes["TIMELINE"])
          }
          window.PMS = PMS;
          window.maxTimeline = Math.max.apply(null, Timeline);
        }).then(function () {
          return tenancyQueryTask.execute(query);
        }).then(function (tenancyResults) {
          var resultset = tenancyResults.features;
          console.log("tenancy");
          for (var i = 0; i < resultset.length; i++) {
            tenancy.push(resultset[i].attributes);
          }
          window.tenancy = tenancy
        }).then(function () {
          return idtaQueryTask.execute(query);
        }).then(function (idtaResults) {
          var resultset = idtaResults.features;
          console.log("IDTA");
          for (var i = 0; i < resultset.length; i++) {
            IDTA.push(resultset[i].attributes);
          }
          window.IDTA = IDTA
        }).then(function () {
          return subtenantsQueryTask.execute(query);
        }).then(function (subtenantsResults) {
          var resultset = subtenantsResults.features;
          console.log("subtenants");
          for (var i = 0; i < resultset.length; i++) {
            subtenants.push(resultset[i].attributes);
          }
          window.subtenants = subtenants
          return
        }).then(function () {
          return Units_queryTask.execute(query);
        }).then(function (Units_Results) {
          var resultset = Units_Results.features;
          console.log("Units");
          for (var i = 0; i < resultset.length; i++) {
            Units.push(resultset[i].attributes);
          }
          window.Units = Units
          return
        }).then(function () {
          return Buildings_queryTask.execute(query);
        }).then(function (Buildings_Results) {
          var resultset = Buildings_Results.features;
          console.log("Buildings");
          for (var i = 0; i < resultset.length; i++) {
            Buildings.push(resultset[i].attributes);
          }
          window.Buildings = Buildings
          return
        }).then(function () {
          //Load all geometry layers----------------------------------------------------------------------------
          //subtenant
          var Unit_Scene = new SceneLayer({
            url: that._config.GeometryLayers.subtenants.sceneLayer.url,
            popupEnabled: true,
            outFields: ["*"],
            visible: false
          })
          // that.LayerTitle.subtenants = Unit_Scene.title
          //Textured Buildings
          var Buildings_Textured_Scene = new SceneLayer({
            url: that._config.GeometryLayers.textured.sceneLayer.url,
            popupEnabled: true,
            outFields: ["*"],
            visible: false
          })
          // that.LayerTitle.textured = Buildings_Textured_Scene.title
          //Untextured Buildings
          var Buildings_Untextured_Scene = new SceneLayer({
            url: that._config.GeometryLayers.untextured.sceneLayer.url,
            popupEnabled: true,
            outFields: ["*"],
            visible: false
          })
          // that.LayerTitle.untextured = Buildings_Untextured_Scene.title
          that.sceneView.map.addMany([Unit_Scene, Buildings_Untextured_Scene, Buildings_Textured_Scene])

          window.lastwidget.setWidget("");
        });
      },
      onOpen: function () {
        var dd = $('.ui.dropdown').dropdown();
        this.own(on(this.TenantFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.PropertyFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.ClusterFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.BuildingFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.FloorFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.ViewFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.StatePropertyFilter, 'change', lang.hitch(this, this._onFilterChanged)));
        this.own(on(this.ClearFilter, 'click', lang.hitch(this, this._ClearFilter)));
      },
      _populateFilterVal: function () {
        console.log("Filter0 _populateFilterVal")

        this.inherited(arguments);

        //get filter values
        var Cluster = [], Property = [], Building = [], Floor = [];

        if (this.lastwidget0 == "" || this.lastwidget0 == "Overview" || this.lastwidget0 == "Leasing" || this.lastwidget0 == "Marketing") {
          for (var i = 0; i < Buildings.length; i++) {
            if (Buildings[i].CLASSIFICATION_OF_CLUSTER !== null && Cluster.indexOf(Buildings[i].CLASSIFICATION_OF_CLUSTER) == -1)
              Cluster.push(Buildings[i].CLASSIFICATION_OF_CLUSTER)
            if (Buildings[i].PROPERTY_ID !== null && Property.indexOf(Buildings[i].PROPERTY_ID) == -1)
              Property.push(Buildings[i].PROPERTY_ID)
          }
        } else if (this.lastwidget0 == "Subtenant") {
          for (var i = 0; i < Units.length; i++) {
            if (Units[i].CLASSIFICATION_OF_CLUSTER !== null && Cluster.indexOf(Units[i].CLASSIFICATION_OF_CLUSTER) == -1)
              Cluster.push(Units[i].CLASSIFICATION_OF_CLUSTER)
            if (Units[i].PROPERTY_ID !== null && Property.indexOf(Units[i].PROPERTY_ID) == -1)
              Property.push(Units[i].PROPERTY_ID)
            if (Units[i].BLOCK_NO !== null && Building.indexOf(Units[i].BLOCK_NO) == -1)
              Building.push(Units[i].BLOCK_NO)
            if (Units[i].STOREY !== null && Floor.indexOf(Units[i].STOREY) == -1)
              Floor.push(Units[i].STOREY)
          }
        }

        window.Cluster = Cluster;
        window.Property = Property;
        window.Building = Building;
        window.Floor = Floor;

        var tenancyList = []
        this.TenantFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.tenancy.length; i++) {
          if (tenancyList.indexOf(window.tenancy[i].TA_Account) == -1) {
            this.TenantFilter.innerHTML += "<option value='" + window.tenancy[i].TA_ACCOUNT + "'>" + window.tenancy[i].TA_ACCOUNT + " - " + window.tenancy[i].LICENSEE_TENANT + "</option>"
            tenancyList.push(window.tenancy[i].TA_ACCOUNT)
          }
        }
        this.PropertyFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Property.length; i++) {
          this.PropertyFilter.innerHTML += "<option value='" + window.Property[i] + "'>" + window.Property[i] + "</option>"
        }
        this.ClusterFilter.innerHTML = "<option></option>"
        for (var i = 0; i < window.Cluster.length; i++) {
          this.ClusterFilter.innerHTML += "<option value='" + window.Cluster[i] + "'>" + window.Cluster[i] + "</option>"
        }
        this.BuildingFilter.innerHTML = "<option> </option>"
        for (var i = 0; i < window.Building.length; i++) {
          this.BuildingFilter.innerHTML += "<option value='" + window.Building[i] + "'>" + window.Building[i] + "</option>"
        }
        this.FloorFilter.innerHTML = "<option> </option>"
        for (var i = 0; i < window.Floor.length; i++) {
          this.FloorFilter.innerHTML += "<option value='" + window.Floor[i] + "'>" + window.Floor[i] + "</option>"
        }
        this.ViewFilter.innerHTML = ""
        // var viewcount = (this.lastwidget0 == "Subtenant") ? 6 : 4
        // for (var i = 0; i < viewcount; i++) {
        //   this.ViewFilter.innerHTML += "<option value='" + this._config.ViewBy[i].Value + "'>" + this._config.ViewBy[i].Display + "</option>"
        // }

        var ViewVals
        if (this.lastwidget0 == "Subtenant") {
          ViewVals = this._config.GeometryLayers.subtenants.ViewVals
        } else {
          ViewVals = this._config.GeometryLayers.untextured.ViewVals
        }
        for (var i = 0; i < ViewVals.length; i++) {
          this.ViewFilter.innerHTML += "<option value='" + this._config.ViewBy[ViewVals[i]].Value + "'>" + this._config.ViewBy[ViewVals[i]].Display + "</option>"
        }

        // Values retrieved from window.filterlistener.filterValues adds [']
        //This function loops through the global variable and removes [']
        for (var fValue in window.filterlistener.filterValues) {
          if (window.filterlistener.filterValues.hasOwnProperty(fValue)) {
            var arrValue = window.filterlistener.filterValues[fValue]
            for (var i = 0; i < arrValue.length; i++) {
              arrValue[i] = arrValue[i].split("'").join("");
            }
          }
        }

        //set filters, set previous value of filter
        if (this.lastwidget0 == "" || this.lastwidget0 == "Overview") {
          this.TenantFilterContainer.hidden = true
          this.BuildingFilterContainer.hidden = true
          this.FloorFilterContainer.hidden = true
        } else if (this.lastwidget0 == "Leasing") {
          this.TenantFilterContainer.hidden = false
          this.BuildingFilterContainer.hidden = true
          this.FloorFilterContainer.hidden = true
          // $('#TenantFilter').dropdown('set value', window.filterlistener.filterValues.Tenant);
        } else if (this.lastwidget0 == "Subtenant") {
          this.TenantFilterContainer.hidden = false
          this.BuildingFilterContainer.hidden = false
          this.FloorFilterContainer.hidden = false
          $('#TenantFilter').dropdown('set value', window.filterlistener.filterValues.Tenant);
          $('#BuildingFilter').dropdown('set value', window.filterlistener.filterValues.Building);
          $('#FloorFilter').dropdown('set value', window.filterlistener.filterValues.Floor);
        }
        $('#PropertyFilter').dropdown('set value', window.filterlistener.filterValues ? window.filterlistener.filterValues.Property : '');
        $('#ClusterFilter').dropdown('set value', window.filterlistener.filterValues ? window.filterlistener.filterValues.Cluster : '');

        //set Default View when widget opened
        this.ViewFilter.value = this._config.defaultView[this.lastwidget0]
        // if (this.lastwidget0 == "Overview" || this.lastwidget0 == "Marketing") {
        //   this.ViewFilter.value = "Occupancy"
        // } else if (this.lastwidget0 == "Leasing") {
        //   this.ViewFilter.value = "SLA_DeptInCharge"
        // } else if (this.lastwidget0 == "Subtenant") {
        //   this.ViewFilter.value = "Tenant Mix"
        // }
        this._onFilterChanged()

      },

      setPosition: function () {
        console.log("Filter0 setPosition")
        this.inherited(arguments);
      },

      resize: function () {
        console.log("Filter0 resize")
      },


      destroy: function () {
        console.log("Filter0 destroy")
        utils.setAppConfig(null);
        var popupVm = this.sceneView.popup.viewModel;
        if (popupVm) {
          popupVm.visible = false;
        }
        if (this.searchDijit && this.searchDijit.viewModel) {
          this.searchDijit.viewModel.set('view', null);
          this.searchDijit.viewModel.clear();
        }

        this.inherited(arguments);
      },

      _onFilterChanged: function () {
        console.log("Filter0 _onFilterChanged")
        var TenantVal = $('#TenantFilter').dropdown('get value');
        var PropVal = $('#PropertyFilter').dropdown('get value');
        var ClusterVal = $('#ClusterFilter').dropdown('get value');
        var BuildingVal = $('#BuildingFilter').dropdown('get value');
        var FloorVal = $('#FloorFilter').dropdown('get value');
        var ViewVal = this.ViewFilter.value;
        var StatePropertyVal = this.StatePropertyFilter.checked;

        var FilterValues0 = {
          'Tenant': TenantVal,
          'Property': PropVal,
          'Cluster': ClusterVal,
          'Building': BuildingVal,
          'Floor': FloorVal
        };
        window.filterlistener.filterValues = FilterValues0;
        console.log("_onFilterChanged Property = " + window.filterlistener.filterValues.Property)

        function findWithAttr(array, attr, value) {
          for (var i = 0; i < array.length; i += 1) {
            if (array[i][attr] === value) {
              return i;
            }
          }
          return -1;
        }
        function isNumber(n) {
          return !isNaN(parseFloat(n)) && isFinite(n);
        }
        function arrayQuery(value, query) {
          var Q = []
          if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i += 1) {
              if (!(/^\d+$/.test(value[i]))) value[i] = "'" + value[i] + "'"
              Q.push(query + value[i])
            }
          } else {
            //if(!(/^\d+$/.test(value)))"'" + value + "'"
            if (value != "")
              if (isNumber(value))
                Q.push(query + "'" + value + "'")
              else
                Q.push(query + "'" + value + "'")
          }
          return Q.join(" OR ")

        }


        var ClusterQuery = arrayQuery(ClusterVal, "CLASSIFICATION_OF_CLUSTER = ")
        var PropQuery = arrayQuery(PropVal, "PROPERTY_ID = ")
        // var strMaxTimeline = window.toShortDate(window.maxTimeline)
        // var TimelineQuery = arrayQuery(strMaxTimeline, "TIMELINE = ")//"TIMELINE > '7/29/2018'"

        if (window.timeline.DateVal == null) window.timeline.DateVal = new Date(window.maxTimeline)
        if (this.lastwidget0 == "Subtenant") {
          var BldgQuery = arrayQuery(BuildingVal, "BLOCK_NO= ")
          var floorQuery = arrayQuery(FloorVal, "STOREY= ")
          var TenancyQuery = arrayQuery(TenantVal, "TA_ACCOUNT = ")
        } else if (this.lastwidget0 == "Leasing") {
          var TenancyQuery = arrayQuery(TenantVal, "TA_ACCOUNT = ")
        } else if (this.lastwidget0 == "Marketing") {
          var TenureQuery
          var TimelineQuery = "TIMELINE='" + window.toShortDate(new Date(window.maxTimeline)) + "'"
          var target_occupation_date = window.OccupationDate.DateVal
          if (!(target_occupation_date == null || target_occupation_date == "")) {
            var date = (new Date(target_occupation_date));
            if (isNaN(date.getTime())) {  // d.valueOf() could also work
              // date is not valid
              TenureQuery = null
            } else {
              // date is valid
              var strdate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + (date.getFullYear()) //+' 12:00:00 AM'
              // var strdate = (date.getFullYear())+'-'+(date.getMonth() + 1) + '-' + date.getDate()
              TenureQuery = "(" + arrayQuery(strdate, "COMMITTED_TENURE_END_DATE  >  ") + " OR COMMITTED_TENURE_END_DATE = '')"
            }
          } else {
            TenureQuery = null
          }
        } else if (this.lastwidget0 == "Overview") {
          var TimelineQuery
          // var mTL = new Date(window.maxTimeline)
          // console.log(window.timeline.DateVal)
          // console.log(mTL)
          if (window.toShortDate(window.timeline.DateVal) === window.toShortDate(new Date(window.maxTimeline))) {
            TimelineQuery = "OBJECTID > 94"
          } else {
            TimelineQuery = "OBJECTID < 95"
          }
        }

        var queryDef
        //Query only non-hidden filters
        if (this.lastwidget0 == "Subtenant") {
          queryDef = [TenancyQuery, ClusterQuery, PropQuery, BldgQuery, floorQuery].filter(Boolean).join(" OR ");
        } else if (this.lastwidget0 == "Leasing") {
          queryDef = [TenancyQuery, ClusterQuery, PropQuery].filter(Boolean).join(" OR ");
        } else if (this.lastwidget0 == "Marketing") {
          // queryDef = [[TenancyQuery, ClusterQuery, PropQuery].filter(Boolean).join(" OR "), ExpiryQuery].filter(Boolean).join(" AND ");
          // queryDef = [TenureQuery, TimelineQuery].filter(Boolean).join(" AND ");
          queryDef = [TenureQuery, TimelineQuery].filter(Boolean).join(" AND ");
        } else if (this.lastwidget0 == "Overview") {
          var ClusterQuery1 = ClusterQuery ? [TimelineQuery, ClusterQuery].filter(Boolean).join(" AND ") : ''
          var PropQuery1 = PropQuery ? [TimelineQuery, PropQuery].filter(Boolean).join(" AND ") : ''
          if (ClusterQuery1 == "" && PropQuery1 == "") queryDef = TimelineQuery
          else queryDef = [ClusterQuery1, PropQuery1].filter(Boolean).join(" OR ")
        } else {
          queryDef = [ClusterQuery, PropQuery].filter(Boolean).join(" OR ");
        }

        // ----------------------------------------------------------update Graphical Layer---------------------------------------------------------------
        var that = this
        this.LayerTitle.stateProperty = this.sceneView.map.layers.items[1].title
        this.LayerTitle.subtenants = this.sceneView.map.layers.items[3].title
        this.LayerTitle.untextured = this.sceneView.map.layers.items[4].title
        this.LayerTitle.textured = this.sceneView.map.layers.items[5].title

        this.sceneView.map.layers.forEach(function (layer) {
          if (!(layer.title == "Tanglin Ortho" || layer.title == null)) {
            if (ViewVal == "none") {
              if (that.lastwidget0 == "Overview" || that.lastwidget0 == "Leasing" || that.lastwidget0 == "Marketing" || that.lastwidget0 == "") {

                //turn on LOD2 only 
                if (layer.title == that.LayerTitle.textured) {
                  layer.visible = true;
                  layer.popupTemplate = that._config.GeometryLayers.textured.sceneLayer.template;
                  layer.definitionExpression = queryDef;
                } else if (layer.title == that.LayerTitle.stateProperty) {
                  layer.visible = StatePropertyVal;
                  // layer.popupTemplate = that._config.GeometryLayers.textured.sceneLayer.template;
                  // layer.definitionExpression = queryDef;
                } else {
                  layer.visible = false;
                }
              }
            } else {
              if (that.lastwidget0 == "Subtenant") {
                if (layer.title == that.LayerTitle.subtenants) {
                  var viewIndex = findWithAttr(that._config.ViewBy, "Value", ViewVal)
                  var renderer = that._config.ViewBy[viewIndex].Renderer
                  layer.definitionExpression = queryDef;
                  layer.renderer = renderer
                  layer.opacity = 0.7;
                  layer.visible = true;
                } else if (layer.title == that.LayerTitle.stateProperty) {
                  layer.visible = StatePropertyVal;
                } else {
                  layer.visible = false;
                }
              } else if (that.lastwidget0 == "Overview" || that.lastwidget0 == "Leasing" || that.lastwidget0 == "Marketing" || that.lastwidget0 == "") {
                if (layer.title == that.LayerTitle.untextured || layer.title == that.LayerTitle.stateProperty) {
                  var viewIndex = findWithAttr(that._config.ViewBy, "Value", ViewVal)
                  var renderer
                  if (layer.title == that.LayerTitle.stateProperty) {
                    // renderer = that._config.ViewBy[viewIndex].Renderer2D
                    // layer.renderer = renderer
                    // layer.opacity = 0.3;

                    var TQ = "TIMELINE ='" + window.toShortDate(new Date(window.timeline.DateVal)) + "'"
                    // queryDef =[[ClusterQuery, PropQuery].filter(Boolean).join(" OR "),TQ].filter(Boolean).join(" AND ") ;

                    var ClusterQuery1 //= ClusterQuery?[TQ, ClusterQuery].filter(Boolean).join(" AND "):''
                    var PropQuery1 = PropQuery ? [TQ, PropQuery].filter(Boolean).join(" AND ") : ''
                    if (PropQuery1 == "") layer.definitionExpression = TQ
                    else layer.definitionExpression = [ClusterQuery1, PropQuery1].filter(Boolean).join(" OR ")
                    // layer.definitionExpression = [[ClusterQuery, PropQuery].filter(Boolean).join(" OR "), TQ].filter(Boolean).join(" AND ");
                  }
                  else {
                    renderer = that._config.ViewBy[viewIndex].Renderer
                    layer.renderer = renderer
                    layer.opacity = 0.8;
                    layer.definitionExpression = queryDef;
                  }
                  console.log(queryDef)
                  layer.visible = true;
                  layer.popupEnabled = true;
                  // layer.popupTemplate = that._config.GeometryLayers.untextured.sceneLayer.template;
                  // } else if (layer.title == that.LayerTitle.stateProperty) {
                  //   layer.visible = StatePropertyVal;
                } else {
                  layer.visible = false;
                }

                if (that.lastwidget0 == "Marketing") {
                  layer.popupEnabled = false;
                }
              }

            }
          }
        });


      },

      _ClearFilter: function () {
        // console.log("_ClearFilter")
        $('#TenantFilter').dropdown('clear');
        $('#BuildingFilter').dropdown('clear');
        $('#FloorFilter').dropdown('clear');
        $('#PropertyFilter').dropdown('clear');
        $('#ClusterFilter').dropdown('clear');
        $('#ViewFilter').dropdown('set selected', 'none');
        this._populateFilterVal()
      },
    });
  });
