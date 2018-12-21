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
], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils,
  ) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-overview',
      ChartR: null,

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
          if (that.datepicker0.value == "") {
            that.colcontainer.classList.add("hidden");
          } else {
            that.colcontainer.classList.remove("hidden");
            //populate Cluster Info
            that._populateClusterInfo();

          }


        });
        this.tblPropertyInformation.classList.add("hidden");
        this.ImageContainer.classList.add("hidden");

        var view = this.sceneView
        view.on("click", function (event) {
          view.hitTest(event.screenPoint).then(function (response) {
            var graphic = response.results[0].graphic;
            var feature = that._findFeature(window.Buildings, graphic);
            // console.log(feature);
            if (!(feature == null)) {
              // that.colcontainer.classList.remove("hidden");
              that._populateContent(feature);
              that.tblPropertyInformation.classList.remove("hidden");
              that.ImageContainer.classList.remove("hidden");

              that._loadimages(feature.GBR_ID);
              that._imagecontrols();
            }
            // } else {
            //   that.colcontainer.classList.add("hidden");

            // }
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
          var TAExpiry = new Date(tenancy0[i].EXISTING_TA_EXPIRY_DATE), Timeline = new Date(tenancy0[i].TIMELINE), maxTimeline = new Date(window.maxTimeline)

          if (TAExpiry <= dateOccupationDate && Timeline.getTime() == maxTimeline.getTime()) {
            console.log(TAExpiry + "<=" + dateOccupationDate)
            tenancy.push(tenancy0[i])
            listTAAccounts.push(tenancy0[i].TA_ACCOUNT)
          }
        }

        for (var i = 0; i < IDTA0.length; i++) {
          if ((listTAAccounts.indexOf(IDTA0[i].TA_ACCOUNT) != -1 || listTAAccounts.length == 0) && (IDTA0[i].TIMELINE == window.maxTimeline)) {
            IDTA.push(IDTA0[i])
          }
        }
        for (var i = 0; i < IDTA.length; i++) {
          var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA[i].PROPERTY_ID, "TIMELINE", window.maxTimeline)
          if (PMSindex != -1) {
            PMS.push(PMS0[PMSindex])
          }
        }
        console.log(PMS)
        var noOfProp = 0, monthlyRent = 0, marketable = 0, unmarketable = 0;
        //Get Date for Chart
        var chartData = { year: [], Rent: [] }
        for (var i = 0; i < PMS.length; i++) {
          noOfProp += 1
          monthlyRent += PMS[i].RESERVE_RENT
          marketable += (PMS[i].MARKETABLE_UNMARKETABLE == "Marketable") ? 1 : 0;
          unmarketable += (PMS[i].MARKETABLE_UNMARKETABLE == "Unmarketable") ? 1 : 0;

          if (PMS[i].END_DATE != null && new Date(PMS[i].START_DATE) < new Date()) {
            var EndDate = new Date(PMS[i].END_DATE)
            var endYear = EndDate.getFullYear().toString()
            var yearIndex = chartData.year.indexOf(endYear)

            var FloorArea = PMS[i].TOTAL_PROP_BLDG_GFA_SQM // 1000
            var Rent = PMS[i].ASKING_RENT // 1000
            if (yearIndex == -1) {
              if (chartData.year.length == 0) {
                chartData.year.push(endYear)
                chartData.Rent.push(Rent)
                continue
              }

              for (var j = 0; j < chartData.year.length; j++) {
                if (endYear < chartData.year[j]) {
                  chartData.year.splice(j, 0, endYear)
                  chartData.Rent.splice(j, 0, Rent)
                  break
                }
                if (j == chartData.year.length - 1) {
                  chartData.year.push(endYear)
                  chartData.Rent.push(Rent)
                  break
                }
              }
            } else {
              chartData.Rent[yearIndex] += (Rent)
            }

          }
        }

        if (this.ChartR != null) {
          this.ChartR.destroy()
          // this.Chart6M.destroy()
        }
        this.ChartR = new Chart(this.ChartRent, {
          type: 'bar',
          data: {
            labels: chartData.year,
            datasets: [{
              label: 'Rent',
              data: chartData.Rent,
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
                align: 'end'
              }
            }]
          },
          options: {
            'onClick': (evt, item) => {
              if (item.length > 0)
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
        this.NoOfProp.textContent = noOfProp;
        this.monthlyRent.textContent = monthlyRent;
        this.propMarketable.textContent = marketable;
        this.propUnmarketable.textContent = unmarketable;

      },

      _populateContent: function (feature) {
        // console.log(feature)
        this.PropertyName.textContent = feature.BUILDING_NAME;
        this.OccupancyStatus.textContent = feature.MODE_OF_OCCUPATION;
        this.Tenant.textContent = feature.LICENSEE_TENANT;
        this.LeaseExpiry.textContent = feature.EXISTING_TA_EXPIRY_DATE;
        this.ApprovedBroadLandUse.textContent = feature.BROAD_CLASSIFICATION;
        this.GFA.textContent = feature.TOTAL_PROP_BLDG_GFA_SQM + " m²";
        // this.AskingRent.textContent = feature.BUILDING_NAME;
        // this.ReserveRent.textContent = feature.BUILDING_NAME;

      },
      _imagecontrols: function () {

        this.ImageContainer.innerHTML +=
          "<div class='w3-center w3-container w3-section w3-large w3-text-white w3-display-bottommiddle' style='width:100%'>" +
          "<div class='w3-left w3-hover-text-khaki' id='imageLeft' data-dojo-attach-point='imageLeft'>&#10094;</div>" +
          "<div class='w3-right w3-hover-text-khaki' id='imageRight' data-dojo-attach-point='imageRight'>&#10095;</div>" +
          //  "<span class='w3-badge demo w3-border w3-transparent w3-hover-white' onclick='currentDiv(1)'></span>"+
          //  "<span class='w3-badge demo w3-border w3-transparent w3-hover-white' onclick='currentDiv(2)'></span>"+
          "</div>"

        var slideIndex = 1;
        showDivs(slideIndex);
        document.getElementById("imageLeft").onclick = function () { plusDivs(-1) };
        document.getElementById("imageRight").onclick = function () { plusDivs(-1) };
        // this.imageLeft.onclick = function(){plusDivs(-1)};
        // this.imageRight.onclick = function(){plusDivs(-1)};
        function plusDivs(n) {
          showDivs(slideIndex += n);
        }

        // function currentDiv(n) {
        //   showDivs(slideIndex = n);
        // }

        function showDivs(n) {
          var i;
          var x = document.getElementsByClassName("mySlides");
          var dots = document.getElementsByClassName("demo");
          if (n > x.length) { slideIndex = 1 }
          if (n < 1) { slideIndex = x.length }
          for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
          }
          // for (i = 0; i < dots.length; i++) {
          //    dots[i].className = dots[i].className.replace(" w3-white", "");
          // }
          x[slideIndex - 1].style.display = "block";
          // dots[slideIndex-1].className += " w3-white";
        }
      },
      _loadimages: function (GBR_ID) {
        function imageExists(image_url) {

          var http = new XMLHttpRequest();

          http.open('HEAD', image_url, false);
          http.send();

          return http.status != 404;

        }

        this.ImageContainer.innerHTML = ""
        for (i = 1; i <= 10; i++) {
          if (imageExists("widgets/Marketing/images/photos/" + GBR_ID + "-" + i + ".jpg")) {
            this.ImageContainer.innerHTML += "<img class='mySlides' src='widgets/Marketing/images/photos/" + GBR_ID + "-" + i + ".jpg' style='width:100%'>"
          }
        }
      }

    });
    return clazz;
  });