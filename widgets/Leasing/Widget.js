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

    //lighting._lastTimezone:The time zone which map shows
    //lighting.date: The date map uses

    postCreate: function () {
      this.inherited(arguments);

      this.sceneView.when(lang.hitch(this, this._init));
    },

    _init: function () {

      //init UI
      // var date = this._getDateOfLighting();
      //use lighting.date to init monthSelect
      // this._initMonthSelect(date);
      //use initialTimeZone to init zoneSelect
      // this._initZoneSelect();
      //use lighting.date and GMT to init slider
      // this._updateSliderUIByDate(date);

      //bind events
      // var lighting = this.sceneView.environment.lighting;
      // this.own(on(lighting, "date-will-change", lang.hitch(this, this._onDateWillChange)));
      // this.own(on(this.zoneSelect, 'change', lang.hitch(this, this._onZoneSelectChanged)));
      // this.own(on(this.monthSelect, 'change', lang.hitch(this, this._onMonthSelectChanged)));
      // this.own(on(this.slider, 'change', lang.hitch(this, this._onSliderValueChanged)));


      // var LeaseExpiryChart = this.LeaseExpiryChart;
      var NILAChart = this.NILAChart;
      var LeasingActivityChart = this.LeasingActivityChart;
      var TenantMixChart = this.TenantMixChart;


      // var myChart = new Chart(LeaseExpiryChart, {
      //   type: 'bar',
      //   data: {
      //     labels: ["2018", "2019", "2020"],
      //     datasets: [{
      //       label: 'Expiry Date',
      //       data: [90, 250, 300],
      //       // yAxisID: 'Distict Count',
      //       backgroundColor: [
      //         'rgba(255, 99, 132, 0.2)',
      //         'rgba(54, 162, 235, 0.2)',
      //         'rgba(255, 206, 86, 0.2)'
      //       ],
      //       borderColor: [
      //         'rgba(255,99,132,1)',
      //         'rgba(54, 162, 235, 1)',
      //         'rgba(255, 206, 86, 1)'
      //       ],
      //       borderWidth: 1
      //     }, {
      //       label: 'Line Dataset',
      //       data: [3.9, 4.8, 1.8],

      //       // Changes this dataset to become a line
      //       type: 'line'
      //     }]
      //   },
      //   options: {
      //     scales: {
      //       yAxes: [{
      //         // ticks: {
      //         //   beginAtZero: true
      //         // },
      //         scaleLabel: {
      //           display: true,
      //           labelString: 'Current Rent(\'000)'
      //         }
      //       }],
      //       xAxes: [{
      //         display: false
      //       }]
      //     },
      //     legend: {
      //       display: false
      //     }
      //   }
      // });

      // var NChart = new Chart(NILAChart, {
      //   type: 'bar',
      //   data: {
      //     labels: ["2018", "2019", "2020"],
      //     datasets: [{
      //       label: 'Expiry Date',
      //       data: [3.9, 4.8, 1.8],
      //       // yAxisID: 'Distict Count',
      //       backgroundColor: [
      //         'rgba(255, 99, 132, 0.2)',
      //         'rgba(54, 162, 235, 0.2)',
      //         'rgba(255, 206, 86, 0.2)'
      //       ],
      //       borderColor: [
      //         'rgba(255,99,132,1)',
      //         'rgba(54, 162, 235, 1)',
      //         'rgba(255, 206, 86, 1)'
      //       ],
      //       borderWidth: 1
      //     }]
      //   },
      //   options: {
      //     scales: {
      //       yAxes: [{
      //         // ticks: {
      //         //   beginAtZero: true
      //         // },
      //         scaleLabel: {
      //           display: true,
      //           labelString: 'NILA (\'000)'
      //         }
      //       }]
      //     },
      //     legend: {
      //       display: false
      //     }
      //   }
      // });

      var NChart = new Chart(NILAChart, {
        type: 'line',
        data: {
          labels: ['2018', '2019', '2020'],
          datasets: [{
            label: 'Current Rent',
            yAxisID: 'Current Rent',
            data: [90000, 250000, 300000],
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            // backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 2,
            xAxisID: "x-axis1",
          }, {
            label: 'NILA',
            yAxisID: 'NILA',
            data: [3009, 4800, 1800],
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            // backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            // type: 'line',
            borderWidth: 1,
            xAxisID: "x-axis1",
          }]
        },
        options: {
          scales: {
            xAxes: [{
              stacked: true,
              id: "x-axis1",
              // barThickness: 70,
            }],
            yAxes: [{
              id: 'Current Rent',
              type: 'linear',
              position: 'left',
              scaleLabel: {
                display: true,
                labelString: 'Current Rent'
              }
            }, {
              id: 'NILA',
              type: 'linear',
              position: 'right',
              scaleLabel: {
                display: true,
                labelString: 'NILA'
              }
            }]
          },
          legend: {
            display: true
          }
        }
      });
      var LAChart = new Chart(LeasingActivityChart, {
        type: 'pie',
        data: {
          datasets: [{
            data: [49, 78],
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
      var TMChart = new Chart(TenantMixChart, {
        type: 'bar',
        data: {
          labels: ["Residential", "Commercial", "C & Cl", "Industrial"],
          datasets: [{
            label: 'Expiry Date',
            data: [111, 9, 6, 1],
            // yAxisID: 'Distict Count',
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)'
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
          }
        }
      });

    }

  });
  return clazz;
});