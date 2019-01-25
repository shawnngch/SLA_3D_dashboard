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
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils,
  FeatureLayer, QueryTask, Query, HorizontalSlider) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-overview',
      _config: null,
      timelineDates: [],
      LEChart: null,
      TMChart: null,
      LAChart: null,

      postCreate: function () {
        this._loadSlider();
        this.inherited(arguments);

        var that = this
        //Global Variable Listener (on window.filterlistener)
        window.filterlistener.registerListener(function (val) {
          // alert("Someone changed the value of x.a to " + val);
          console.log("filterChange onSliderValueChanged")
          that._onSliderValueChanged();
        });
      },
      onOpen: function () {
        window.lastwidget.setWidget("Overview");
      },
      onClose: function () {
        window.lastwidget.setWidget("");
      },

      _loadSlider: function () {

        for (var i = 0; i < window.PMS.length; i++) {
          if (this.timelineDates.indexOf(window.PMS[i].TIMELINE) == -1) {
            this.timelineDates.push(window.PMS[i].TIMELINE)
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

        this.own(on(this.slider, 'change', lang.hitch(this, function () {
          window.timeline.DateVal = new Date(this.slider.get("value"))
        }//this._onSliderValueChanged
        )));
      },

      _onSliderValueChanged: function () {
        this.SnapshotDate.innerHTML = new Date(this.slider.get("value")).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        // window.timeline = new Date(this.slider.get("value"))
        // window.timeline.DateVal = new Date(this.slider.get("value"))

        //LeasingActivityChart Variable
        var newLease = 0, renewal = 0;
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

        //PMS-------------------------------------------------------------------------------------------------------------------
        var OccupiedProperties = 0, marketable = 0, unmarketable = 0, totalProperties = 0;
        var SliderVal = this.slider.get("value")
        //----
        var PropVal = $('#PropertyFilter').dropdown('get value');
        var ClusterVal = $('#ClusterFilter').dropdown('get value');

        var IDTA0 = window.IDTA, tenancy0 = window.tenancy, PMS0 = window.PMS;
        //Data based on filter
        var IDTA_filtered = [], tenancy_filtered = [], PMS_filtered = []
        var filterInput_TA = [], filterInput_PropertyID = []

        if (PropVal.length == 0 && ClusterVal.length == 0) {
          PMS_filtered = window.PMS.filter(el => el.TIMELINE == SliderVal);
          IDTA_filtered = window.IDTA.filter(el => el.TIMELINE == SliderVal);
          tenancy_filtered = window.tenancy.filter(el => el.TIMELINE == SliderVal);
        } else {
          //filterInput_TA = selected TA_Account based on cluster
          for (var i = 0; i < tenancy0.length; i++) {
            if (ClusterVal.indexOf(tenancy0[i].CLASSIFICATION_OF_CLUSTER) != -1) {
              if (tenancy0[i].TIMELINE == SliderVal) {
                filterInput_TA.push(tenancy0[i].TA_ACCOUNT)
              }
            }
          }
          //---------------------------------------------------NEW-----------------------------------
          //filterInput_PropertyID = selected PropertyID
          for (var i = 0; i < PMS0.length; i++) {
            if (PropVal.indexOf(PMS0[i].PROPERTY_ID) != -1) {
              if (PMS0[i].TIMELINE == SliderVal) {
                filterInput_PropertyID.push(PMS0[i].PROPERTY_ID)
              }
            }
          }
          var IDTA = window.searchIDTA(filterInput_TA, "TA_ACCOUNT", SliderVal)
          IDTA = IDTA.concat(window.searchIDTA(filterInput_PropertyID, "PROPERTY_ID", SliderVal))
          
          for (var i = 0; i < IDTA.length; i++) {
            var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA[i].PROPERTY_ID, "TIMELINE", SliderVal)
            var tenancyIndex = findWithAttr(tenancy0, "TA_ACCOUNT", IDTA[i].TA_ACCOUNT, "TIMELINE", SliderVal)
            if (PMSindex != -1) {
              PMS_filtered.push(PMS0[PMSindex])
            }
            if (tenancyIndex != -1) {
              tenancy_filtered.push(tenancy0[tenancyIndex])
            }
          }
          //---------------------------------------------------NEW-----------------------------------

          // for (var i = 0; i < IDTA0.length; i++) {
          //   if (filterInput_TA.indexOf(IDTA0[i].TA_ACCOUNT) != -1 || PropVal.indexOf(IDTA0[i].PROPERTY_ID) != -1) {
          //     if (IDTA0[i].TIMELINE == SliderVal) {
          //       IDTA_filtered.push(IDTA0[i])
          //     }
          //   }
          // }
          // for (var i = 0; i < IDTA_filtered.length; i++) {
          //   var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA_filtered[i].PROPERTY_ID, "TIMELINE", SliderVal)
          //   var tenancyIndex = findWithAttr(tenancy0, "TA_ACCOUNT", IDTA_filtered[i].TA_ACCOUNT, "TIMELINE", SliderVal)
          //   if (PMSindex != -1) {
          //     PMS_filtered.push(PMS0[PMSindex])
          //   }
          //   if (tenancyIndex != -1) {
          //     tenancy_filtered.push(tenancy0[tenancyIndex])
          //   }
          // }

        }
        //----

        // var refDate = (SliderVal == Math.max.apply(null, this.timelineDates)) ? new Date() : SliderVal;
        
        for (var i = 0; i < PMS_filtered.length; i++) {
          if (PMS_filtered[i].TIMELINE == this.slider.get("value")) {
            if (PMS_filtered[i].MODE_OF_OCCUPATION != "TA") {
              marketable += (PMS_filtered[i].MARKETABLE_UNMARKETABLE == "Marketable") ? 1 : 0;
              unmarketable += (PMS_filtered[i].MARKETABLE_UNMARKETABLE == "Unmarketable") ? 1 : 0;
            } else {
              OccupiedProperties += 1;
            }
            totalProperties += 1
            //IDTA-------------------------------------------
            var propertyID = PMS_filtered[i].PROPERTY_ID;

            var IDTAindex = findWithAttr(IDTA_filtered, "PROPERTY_ID", propertyID);
            if (IDTAindex === -1) continue;
            var TA_Account = IDTA_filtered[IDTAindex].TA_ACCOUNT
            var tenancyIndex = findWithAttr(tenancy_filtered, "TA_ACCOUNT", TA_Account);
            if (tenancyIndex === -1) continue;

            //Remove repeated tenancyIndex
            // if (tenancyIndice.indexOf(tenancyIndex) === -1) {
            //   tenancyIndice.push(tenancyIndex)
            // } else continue;

            // if (tenancy_filtered[tenancyIndex].EXISTING_TA_EXPIRY_DATE  >= refDate) {
            var PMSstartDate = PMS_filtered[i].START_DATE;
            var tenancyStartDate = tenancy_filtered[tenancyIndex].EXISTING_TA_START_DATE;
            if (PMSstartDate == tenancyStartDate) {
              newLease += 1;
            } else {
              renewal += 1;
            }

            // }

          }
        }
        var rate = (OccupiedProperties / (totalProperties)) * 100;
        this.OccupancyRate.textContent = "" + rate.toFixed(2).toString() + "%";
        this.propOccupied.textContent = OccupiedProperties;
        this.totalPropertiesManaged.textContent = totalProperties;
        this.propMarketable.textContent = marketable;
        this.propUnmarketable.textContent = unmarketable;

        //tenancy-------------------------------------------------------------------------------------------------------------------

        var grossMonthlyRentalRevenue = 0, noOfLeases = 0;
        var expiryPortfolio = { year: [], count: [], sortedYear: [], sortedCount: [] }
        var tenancyMix = { type: [], count: [] }

        const numberWithCommas = (x) => {
          var parts = x.toFixed(2).toString().split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          return parts.join(".");
        }

        for (var i = 0; i < tenancy_filtered.length; i++) {
          grossMonthlyRentalRevenue += (tenancy_filtered[i].MONTHLY_RENTAL == null) ? 0 : tenancy_filtered[i].MONTHLY_RENTAL;
          var eStart = new Date(tenancy_filtered[i].EXISTING_TA_START_DATE), eExpiry = new Date(tenancy_filtered[i].EXISTING_TA_EXPIRY_DATE)
          // if (eStart <= refDate && eExpiry >= refDate) {
          noOfLeases += 1;
          var year0 = new Date(tenancy_filtered[i].EXISTING_TA_EXPIRY_DATE).getFullYear();
          var type0 = tenancy_filtered[i].BROAD_CLASSIFICATION;
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
          // } else {
          //   console.log(tenancy_filtered[i])
          //   // console.log(eStart +" <= "+ refDate+" && "+eExpiry+" >= "+refDate)
          // }
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

        if (this.LEChart != null) {
          this.LEChart.destroy()
          this.TMChart.destroy()
          this.LAChart.destroy()
        }
        this.LEChart = new Chart(this.LeaseExpiryChart, {
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
              borderWidth: 1,
              datalabels: {
                anchor: 'end',
                align: 'start'
              }
            }]
          },
          options: {
            'onClick': (evt, item) => {
              console.log(item[0]['_model'].label)
            },
            plugins: {
              datalabels: {
                color: 'grey',
                display: function (context) {
                  return context.dataset.data[context.dataIndex];
                },
                font: {
                  weight: 'bold'
                },
                formatter: Math.round
              }
            },
            //Chart Size
            responsive: true,
            maintainAspectRatio: false,
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
        this.TMChart = new Chart(this.TenantMixChart, {
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
              borderWidth: 1,
              datalabels: {
                anchor: 'end',
                align: 'start'
              }
            }]
          },
          options: {
            'onClick': (evt, item) => {
              console.log(item[0]['_model'].label)
            },
            plugins: {
              datalabels: {
                color: 'grey',
                display: function (context) {
                  return context.dataset.data[context.dataIndex];
                },
                font: {
                  weight: 'bold'
                },
                formatter: Math.round
              }
            },
            responsive: true,
            maintainAspectRatio: false,
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
        this.LAChart = new Chart(this.LeasingActivityChart, {
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
              datalabels: {
                anchor: 'end',
                align: 'start'
              }
            }],
            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: [
              'Renewals',
              'New leases'
            ]
          },
          options: {
            'onClick': (evt, item) => {
              console.log(item[0]['_model'].label)
            },
            plugins: {
              datalabels: {
                color: 'grey',
                display: function (context) {
                  return context.dataset.data[context.dataIndex];
                },
                font: {
                  weight: 'bold'
                },
                formatter: Math.round
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });


      },

    });
    return clazz;
  });