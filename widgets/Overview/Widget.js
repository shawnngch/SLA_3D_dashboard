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
  "esri/layers/FeatureLayer",
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  'node_modules/chart.js/dist/Chart.js',
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils,
  FeatureLayer, QueryTask, Query, Chart, HorizontalSlider) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-overview',
      _config: null,
      timelineDates: [],

      postCreate: function () {
        // window.lastwidget.setIsOverview(true);
        this._config = lang.clone(this.config.editor);
        // this._config = lang.clone(this.config);
        var that = this;

        //Load all data if not already loaded
        if (window.PMS == null || window.IDTA == null || window.tenancy == null || window.subtenants == null) {
          //Load all data
          var PMS = [], IDTA = [], subtenants = [], tenancy = [];

          var pmsQueryTask = new QueryTask({
            url: this._config.layerInfos[0].featureLayer.url
          });
          var tenancyQueryTask = new QueryTask({
            url: this._config.layerInfos[3].featureLayer.url
          });
          var idtaQueryTask = new QueryTask({
            url: this._config.layerInfos[1].featureLayer.url
          });
          var subtenantsQueryTask = new QueryTask({
            url: this._config.layerInfos[2].featureLayer.url
          });

          var query = new Query();
          query.returnGeometry = false;
          // query.where = "timeline = '" + new Date(this.slider.get("value")).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + "'";
          query.where = "1=1"
          query.outFields = ["*"];

          pmsQueryTask.execute(query).then(function (pmsResults) {
            var resultset = pmsResults.features;
            console.log("PMS");
            for (var i = 0; i < resultset.length; i++) {
              PMS.push(resultset[i].attributes);
            }
            window.PMS = PMS
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
            // Actual work after loading all data
            // that._ChangeView();
            that._loadSlider();
          });
        } else {
          // this._ChangeView();
          this._loadSlider();
        }

        this.inherited(arguments);
      },
      onOpen:function(){
        window.lastwidget.setWidget("Overview");
      },
  
      
      _ChangeView: function () {
        this.sceneView.map.layers.forEach(function (layer) {
          // Turn on building layer
            if (layer.title == "SLA Buildings") {
              layer.visible = true;
            }
          // Turn off unit layer
            if (layer.title == "Buildings Tanglin") {
              layer.visible = false;
            }
          });
      },

      _loadSlider: function () {

        for (var i = 0; i < window.PMS.length; i++) {
          if (this.timelineDates.indexOf(window.PMS[i].Timeline) == -1) {
            this.timelineDates.push(window.PMS[i].Timeline)
          }
        }

        this.slider = new HorizontalSlider({
          name: "slider",
          value: Math.max.apply(null, this.timelineDates),
          minimum: Math.min.apply(null, this.timelineDates),
          maximum: Math.max.apply(null, this.timelineDates),
          discreteValues: this.timelineDates.length,
          intermediateChanges: true,
          showButtons: false,
          style: "width:100%;display: inline-block;"
        }, this.sliderBar);
        this.slider.startup();

        this.own(on(this.slider, 'change', lang.hitch(this, this._onSliderValueChanged)));
        this._onSliderValueChanged();
      },

      _onSliderValueChanged: function () {
        this.SnapshotDate.innerHTML = new Date(this.slider.get("value")).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        window.timeline = new Date(this.slider.get("value"))

        var LeaseExpiryChart = this.LeaseExpiryChart;
        var LeasingActivityChart = this.LeasingActivityChart;
        var TenantMixChart = this.TenantMixChart;

        //LeasingActivityChart Variable
        var newLease = 0, renewal = 0;
        function findWithAttr(array, attr, value) {
          for (var i = 0; i < array.length; i += 1) {
            if (array[i][attr] === value) {
              return i;
            }
          }
          return -1;
        }

        //PMS-------------------------------------------------------------------------------------------------------------------
        var OccupiedProperties = 0, marketable = 0, unmarketable = 0, totalProperties = 0;
        var SliderVal = this.slider.get("value")

        const PMS_filtered = window.PMS.filter(el => el.Timeline == SliderVal);
        const IDTA_filtered = window.IDTA.filter(el => el.Timeline == SliderVal);
        const tenancy_filtered = window.tenancy.filter(el => el.Timeline == SliderVal);

        for (var i = 0; i < PMS_filtered.length; i++) {
          if (PMS_filtered[i].Timeline == this.slider.get("value")) {
            if (PMS_filtered[i].MODE_OF_OCCUPATION != "TA") {
              marketable += (PMS_filtered[i].Marketable_Unmarketable == "Marketable") ? 1 : 0;
              unmarketable += (PMS_filtered[i].Marketable_Unmarketable == "Unmarketable") ? 1 : 0;
            } else {
              OccupiedProperties += 1;
            }
            totalProperties += 1
            //IDTA-------------------------------------------
            var propertyID = PMS_filtered[i].PROPERTY_ID;

            var IDTAindex = findWithAttr(IDTA_filtered, "Property_ID", propertyID);
            if (IDTAindex === -1) { continue; }

            var TA_Account = IDTA_filtered[IDTAindex].TA_Account
            var tenancyIndex = findWithAttr(tenancy, "TA_Account", TA_Account);
            if (tenancyIndex === -1) { continue; }

            var PMSstartDate = PMS_filtered[i].START_DATE;
            var tenancyStartDate = tenancy[tenancyIndex].ExistingTAStartDate;
            if (PMSstartDate == tenancyStartDate) {
              newLease += 1;
            } else {
              renewal += 1;
            }

          }
        }
        var rate = (OccupiedProperties / (PMS_filtered.length)) * 100;
        this.OccupancyRate.textContent = "" + rate.toFixed(2).toString() + "%";
        this.propOccupied.textContent = OccupiedProperties;
        this.totalPropertiesManaged.textContent = totalProperties;
        this.propMarketable.textContent = marketable;
        this.propUnmarketable.textContent = unmarketable;

        //tenancy-------------------------------------------------------------------------------------------------------------------
        
        var refDate = (SliderVal == Math.max.apply(null, this.timelineDates))?new Date():SliderVal;
        var grossMonthlyRentalRevenue = 0, noOfLeases = 0;
        var expiryPortfolio = { year: [], count: [], sortedYear: [], sortedCount: [] }
        var tenancyMix = { type: [], count: [] }

        const numberWithCommas = (x) => {
          var parts = x.toFixed(2).toString().split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return parts.join(".");
        }

        for (var i = 0; i < tenancy_filtered.length; i++) {
          grossMonthlyRentalRevenue += (tenancy_filtered[i].Monthly_rental == null) ? 0 : tenancy_filtered[i].Monthly_rental;
          if (tenancy_filtered[i].ExistingTAStartDate <= refDate && tenancy_filtered[i].ExistingTAExpiryDate >= refDate) {
            noOfLeases += 1;
            var year0 = new Date(tenancy_filtered[i].ExistingTAExpiryDate).getFullYear();
            var type0 = tenancy_filtered[i].Broad_classification_of_use;
            if (expiryPortfolio.year.includes(year0)) {
              var expiryIndex = expiryPortfolio.year.indexOf(year0);
              expiryPortfolio.count[expiryIndex] += 1;
            } else {
              expiryPortfolio.year.push(year0);
              expiryPortfolio.count.push(1);
            }
            //tenancyMix
            if (tenancyMix.type.includes(type0)) {
              var typeIndex = tenancyMix.type.indexOf(type0);
              tenancyMix.count[typeIndex] += 1;
            } else {
              tenancyMix.type.push(type0);
              tenancyMix.count.push(1);
            }
          }
        }

        // //Arrange expiryPortfolio
        expiryPortfolio.sortedYear = expiryPortfolio.year.sort();
        var yearPos = [];
        for (var i = 0; i < expiryPortfolio.sortedYear.length; i++) {
          yearPos.push(expiryPortfolio.year.indexOf(expiryPortfolio.sortedYear[i]));
        }
        for (var i = 0; i < yearPos.length; i++) {
          expiryPortfolio.sortedCount.push(expiryPortfolio.count[yearPos[i]]);
        }

        this.grossMonthlyRentalRevenue.textContent = "$" + numberWithCommas(grossMonthlyRentalRevenue);
        this.noOfLeases.textContent = noOfLeases;

        var LEChart = new Chart(LeaseExpiryChart, {
          type: 'bar',
          data: {
            labels: expiryPortfolio.sortedYear,
            datasets: [{
              label: 'Expiry Date',
              data: expiryPortfolio.sortedCount,
              // yAxisID: 'Distict Count',
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            },
            legend: {
              display: false
            }
          }
        });
        var TMChart = new Chart(TenantMixChart, {
          type: 'horizontalBar',
          data: {
            labels: tenancyMix.type,
            datasets: [{
              label: 'Expiry Date',
              data: tenancyMix.count,
              // yAxisID: 'Distict Count',
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            },
            legend: {
              display: false
            },
            plugins: {
              datalabels: {
                // hide datalabels for all datasets
                display: true
              }
            }
          }
        });
        var LAChart = new Chart(LeasingActivityChart, {
          type: 'pie',
          data: {
            datasets: [{
              data: [renewal, newLease],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
              ],
            }],

            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: [
              'Renewals',
              'New leases'
            ]
          }
        });
      },

    });
    return clazz;
  });