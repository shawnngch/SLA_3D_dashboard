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

      postCreate: function () {
        this._config = lang.clone(this.config.editor);
        var that = this;
        var Dates = [];

        //Get unique SnapshotDate from PMS for timeslider
        var PMSqueryTask = new QueryTask({
          url: this._config.layerInfos[0].featureLayer.url
        });

        var query = new Query();
        query.returnGeometry = false;
        query.where = "1 = 1";
        query.outFields = ["SnapshotDate"];

        PMSqueryTask.execute(query).then(function (PMSresults) {
          var resultset = PMSresults.features;

          for (var i = 0; i < resultset.length; i++) {
            if (Dates.indexOf(resultset[i].attributes.SnapshotDate) == -1) {
              Dates.push(resultset[i].attributes.SnapshotDate)
            }
          }

          that.slider = new HorizontalSlider({
            name: "slider",
            value: Math.max.apply(null, Dates),
            minimum: Math.min.apply(null, Dates),
            maximum: Math.max.apply(null, Dates),
            discreteValues: Dates.length,
            intermediateChanges: true,
            showButtons: false,
            style: "width:100%;display: inline-block;"
          }, that.sliderBar);
          that.slider.startup();

          that.own(on(that.slider, 'change', lang.hitch(that, that._onSliderValueChanged)));
          that._onSliderValueChanged();
        })
        this.inherited(arguments);
      },

      _onSliderValueChanged: function () {
        var options = { year: 'numeric', month: 'long' };
        var optionsfull = { year: 'numeric', month: 'long', day: 'numeric' };
        this.SnapshotDate.innerHTML = new Date(this.slider.get("value")).toLocaleDateString('en-US', options);
        window.SnapshotDate = new Date(this.slider.get("value"))

        var LeaseExpiryChart = this.LeaseExpiryChart;
        var LeasingActivityChart = this.LeasingActivityChart;
        var TenantMixChart = this.TenantMixChart;
        var that = this;
        this._config = lang.clone(this.config.editor);

        var PMS = [], IDTA = [], subTenants = [], tenancy = [];

        var PMSqueryTask = new QueryTask({
          url: this._config.layerInfos[0].featureLayer.url
        });
        var tenancyQueryTask = new QueryTask({
          url: this._config.layerInfos[3].featureLayer.url
        });
        var IDTAqueryTask = new QueryTask({
          url: this._config.layerInfos[1].featureLayer.url
        });

        var query = new Query();
        query.returnGeometry = false;
        query.where = "SnapshotDate = '" + new Date(this.slider.get("value")).toLocaleDateString('en-US', optionsfull) + "'";
        query.outFields = ["*"];

        PMSqueryTask.execute(query).then(function (PMSresults) {
          //store attributes
          var resultset = PMSresults.features;
          var OccupiedProperties = 0, Marketable = 0, Unmarketable = 0;
          console.log("PMS");
          // console.log(resultset);

          for (var i = 0; i < resultset.length; i++) {
            PMS.push(resultset[i].attributes);
            OccupiedProperties += (resultset[i].attributes.MODE_OF_OCCUPATION == "TA") ? 1 : 0;
            Marketable += (resultset[i].attributes.Marketable_Unmarketable == "Marketable") ? 1 : 0;
            Unmarketable += (resultset[i].attributes.Marketable_Unmarketable == "Unmarketable") ? 1 : 0;
          }

          rate = (OccupiedProperties / (resultset.length)) * 100;

          that.OccupancyRate.textContent = "" + rate.toFixed(2).toString() + "%";
          that.propOccupied.textContent = OccupiedProperties;
          that.totalPropertiesManaged.textContent = resultset.length;
          that.propMarketable.textContent = Marketable;
          that.propUnmarketable.textContent = Unmarketable;

        }).then(function () {
          return tenancyQueryTask.execute(query);
        }).then(function (tenancyResults) {
          var resultset = tenancyResults.features;
          console.log("tenancy");
          // console.log(resultset);

          var today = new Date();
          var grossMonthlyRentalRevenue = 0, noOfLeases = 0;
          var expiryPortfolio = { year: [], count: [], sortedYear: [], sortedCount: [] }
          var tenancyMix = { type: [], count: [] }

          const numberWithCommas = (x) => {
            var parts = x.toFixed(2).toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
          }

          for (var i = 0; i < resultset.length; i++) {
            tenancy.push(resultset[i].attributes);
            grossMonthlyRentalRevenue += (resultset[i].attributes.Monthly_rental == null) ? 0 : resultset[i].attributes.Monthly_rental;
            if (resultset[i].attributes.ExistingTAStartDate <= today && resultset[i].attributes.ExistingTAExpiryDate >= today) {
              noOfLeases += 1;
              var year0 = new Date(resultset[i].attributes.ExistingTAExpiryDate).getFullYear();
              var type0 = resultset[i].attributes.Broad_classification_of_use;
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

          //Arrange expiryPortfolio
          expiryPortfolio.sortedYear = expiryPortfolio.year.sort();
          var yearPos = [];
          for (var i = 0; i < expiryPortfolio.sortedYear.length; i++) {
            yearPos.push(expiryPortfolio.year.indexOf(expiryPortfolio.sortedYear[i]));
          }
          for (var i = 0; i < yearPos.length; i++) {
            expiryPortfolio.sortedCount.push(expiryPortfolio.count[yearPos[i]]);
          }

          that.grossMonthlyRentalRevenue.textContent = "$" + numberWithCommas(grossMonthlyRentalRevenue);
          that.noOfLeases.textContent = noOfLeases;

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
              }
            }
          });
        }).then(function () {
          return IDTAqueryTask.execute(query);
        }).then(function (IDTAresults) {
          var resultset = IDTAresults.features;
          var newLease = 0;
          var renewal = 0;
          function findWithAttr(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
              if (array[i][attr] === value) {
                return i;
              }
            }
            return -1;
          }

          console.log("IDTA");
          // console.log(resultset);
          for (var i = 0; i < resultset.length; i++) {
            IDTA.push(resultset[i].attributes);
          }
          for (var i = 0; i < PMS.length; i++) {
            var propertyID = PMS[i].PROPERTY_ID;
            var IDTAindex = findWithAttr(IDTA, "Property_ID", propertyID);
            if (IDTAindex === -1) { continue; }

            var TA_Account = IDTA[IDTAindex].TA_Account
            var tenancyIndex = findWithAttr(tenancy, "TA_Account", TA_Account);
            if (tenancyIndex === -1) { continue; }

            var PMSstartDate = PMS[i].START_DATE;
            var tenancyStartDate = tenancy[tenancyIndex].ExistingTAStartDate;
            if (PMSstartDate == tenancyStartDate) {
              newLease += 1;
            } else {
              renewal += 1;
            }
          }

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

        });
      },

    });
    return clazz;
  });