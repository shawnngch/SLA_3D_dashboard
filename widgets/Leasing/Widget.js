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
  "esri/tasks/support/Query",
  // 'node_modules/chart.js/dist/Chart.js',
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils, QueryTask, Query,
    // Chart
  ) {

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-leasing',
      tenancyList: [],
      TADT: null,
      DataTableLoaded: false,
      FilterValues: null,

      postCreate: function () {
        this.inherited(arguments);

        this._AfterLoad();

        var that = this
        //Global Variable Listener (on window.filterlistener)
        window.filterlistener.registerListener(function (val) {
          // alert("Someone changed the value of x.a to " + val);
          that._onFilterChanged();
        });

      },
      onOpen: function () {
        window.lastwidget.setWidget("Leasing");
        //Show first tab for Expiry Chart
        $("#Exp6M").click()
      },

      _onFilterChanged: function () {
        console.log("_onFilterChanged")

        var tenantvalues = $('#TenantFilter').dropdown('get value');
        console.log(tenantvalues)
        var NLAChart = this.NLAChart;
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
        var IDTA = [], tenancy = [], PMS = [], subtenants = [];

        for (var i = 0; i < tenancy0.length; i++) {
          // if (tenancy0[i].TA_Account == this.TenantFilter.value || this.TenantFilter.value == '') {
          if (tenantvalues.indexOf(tenancy0[i].TA_Account) != -1 || tenantvalues.length == 0) {
            if (tenancy0[i].Timeline == window.maxTimeline) tenancy.push(tenancy0[i])
          }
        }
        for (var i = 0; i < IDTA0.length; i++) {
          // if (IDTA0[i].TA_Account == this.TenantFilter.value || this.TenantFilter.value == '') {
          if (tenantvalues.indexOf(IDTA0[i].TA_Account) != -1 || tenantvalues.length == 0) {
            if (IDTA0[i].Timeline == window.maxTimeline) IDTA.push(IDTA0[i])
          }
        }
        for (var i = 0; i < IDTA.length; i++) {
          var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA[i].Property_ID, "Timeline", window.maxTimeline)
          // console.log(IDTA[i].Property_ID + " " + PMSindex)
          if (PMSindex != -1) {
            PMS.push(PMS0[PMSindex])
          }
        }
        for (var i = 0; i < subtenants0.length; i++) {
          if (tenantvalues.indexOf(subtenants0[i].TA_Account) != -1 || tenantvalues.length == 0) {
            subtenants.push(subtenants0[i])
          }
        }

        //Get Date for NLA Chart
        var objArr = { year: [], NLA: [] }
        for (var i = 0; i < PMS.length; i++) {
          if (PMS[i].END_DATE != null && new Date(PMS[i].START_DATE) < new Date()) {
            var EndDate = new Date(PMS[i].END_DATE)
            var endYear = EndDate.getFullYear().toString()
            var yearIndex = objArr.year.indexOf(endYear)

            var FloorArea = PMS[i].TOTAL_PROP_BLDG_GFA_SQM / 1000
            if (yearIndex == -1) {
              if (objArr.year.length == 0) {
                objArr.year.push(endYear)
                objArr.NLA.push(FloorArea)
                continue
              }

              for (var j = 0; j < objArr.year.length; j++) {
                if (endYear < objArr.year[j]) {
                  objArr.year.splice(j, 0, endYear)
                  objArr.NLA.splice(j, 0, FloorArea)
                  break
                }
                if (j == objArr.year.length - 1) {
                  objArr.year.push(endYear)
                  objArr.NLA.push(FloorArea)
                  break
                }
              }
            } else {
              objArr.NLA[yearIndex] += (FloorArea)
            }

          }
        }
        var maxNLA = 0
        for (i = 0; i < objArr.NLA.length; i++) {
          objArr.NLA[i] = objArr.NLA[i].toFixed(2);
          if (parseFloat(objArr.NLA[i]) > maxNLA) maxNLA = objArr.NLA[i]
        }
        maxNLA = Math.round(Math.ceil(maxNLA / 5) * 5 * 1.1)

        var NChart = new Chart(NLAChart, {
          type: 'bar',
          data: {
            labels: objArr.year,
            datasets: [{
              label: 'Current Rent',
              yAxisID: 'Current Rent',
              data: [90, 250, 300, 250, 300, 97],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255,99,132,1)',
              borderWidth: 2,
              xAxisID: "x-axis1",
              datalabels: {
                color: 'rgba(255,99,132,1)',
                anchor: 'end',
                align: 'end'
              }
            }, {
              label: 'NLA',
              yAxisID: 'NLA',
              data: objArr.NLA,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              // type: 'line',
              borderWidth: 1,
              xAxisID: "x-axis1",
              datalabels: {

                color: 'rgba(54, 162, 235, 1)'
              }
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            // aspectRatio:3,
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
                  labelString: "Current Rent ('000)"
                },
                // ticks: {
                //   max: 330,
                // }
              }, {
                id: 'NLA',
                type: 'linear',
                position: 'right',
                scaleLabel: {
                  display: true,
                  labelString: "NLA ('000)"
                },
                // ticks: {
                //   max: maxNLA,
                // }
              }]
            },
            legend: {
              display: true
            },
            plugins: {
              datalabels: {
                // color: 'rgba(54, 162, 235, 1)',
                color: 'grey',
                display: function (context) {
                  return context.dataset.data[context.dataIndex];
                },
                // font: {
                //   weight: 'bold'
                // },
                anchor: 'end',
                align: 'end'
              }
            },
          },
          scrollY: '100%',
        });

        //Get data for expiryTable
        var totalExpiring = 0, allocationNo = { modeOfAllocation: [], qty: [] }, TATableData = [];
        const tenancyAttributes = Object.keys(tenancy[0])
        for (var i = 0; i < tenancy.length; i++) {
          if (tenancy[i].ExistingTAExpiryDate > new Date()) {
            var MOA = tenancy[i].Mode_of_allocation
            var modeIndex = allocationNo.modeOfAllocation.indexOf(MOA)
            totalExpiring += 1
            if (modeIndex == -1) {
              allocationNo.modeOfAllocation.push(tenancy[i].Mode_of_allocation)
              allocationNo.qty.push(1)
            } else {
              allocationNo.qty[modeIndex] += 1
            }
          }
          const tenancyRowArray = Object.values(tenancy[i])
          TATableData.push(tenancyRowArray)
        }


        //Set data for expiryTable
        this.expiringTable.innerHTML = ""
        for (var i = 0; i < allocationNo.modeOfAllocation.length; i++) {
          var rowHTML = "<tr>"
          if (i == 0) {
            rowHTML += "<td rowspan=" + allocationNo.modeOfAllocation.length + "><strong>" + totalExpiring + "</strong></td>"
          }
          rowHTML += "<td>" + allocationNo.modeOfAllocation[i] + "</td><td>" + allocationNo.qty[i] + "</td></tr>"
          this.expiringTable.innerHTML += rowHTML
        }

        var colNames = []
        for (var i = 0; i < tenancyAttributes.length; i++) {
          colNames.push({ title: tenancyAttributes[i] })
        }


        console.log("DataTableLoaded = " + this.DataTableLoaded)
        if (this.DataTableLoaded == false) {
          try {
            // this.test.innerHTML = TATableData.length
            this.TADT = $('#TATable').DataTable({
              data: TATableData,
              columns: colNames,
              columnDefs: [
                {
                  targets: [0],
                  visible: false
                },
                {
                  targets: [1],
                  visible: false
                },
                {
                  targets: [2],
                  visible: false
                },
                {
                  targets: [3],
                  visible: false
                },
                {
                  targets: [12],
                  visible: false
                }
              ],
              scrollY: '250',
              scrollX: true,
              paging: false,
              dom: 't',
              pageResize: true
            });

          } catch (error) {
            console.log(error.message)
          }
          this.DataTableLoaded = true
          // console.log("DataTableLoaded = " + this.DataTableLoaded)
          // console.log(TATableData)
          // console.log(colNames)
        } else {
          var searchstr = tenantvalues.join("|");

          this.TADT.column(3).search(searchstr, true, false).draw();
        }

        $('#TATable tbody').on('click', 'tr', function () {
          if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $(this).removeClass('active');
          }
          else {
            $('#TATable').DataTable().$('tr.selected').removeClass('selected');
            $('#TATable').DataTable().$('tr.active').removeClass('active');
            $(this).addClass('selected');
            $(this).addClass('active');
          }
        });
      },

      _AfterLoad: function () {
        // this.TenantFilter.innerHTML = "<option></option>"
        // for (var i = 0; i < window.tenancy.length; i++) {
        //   if (this.tenancyList.indexOf(window.tenancy[i].TA_Account) == -1) {
        //     this.TenantFilter.innerHTML += "<option value='" + window.tenancy[i].TA_Account + "'>" + window.tenancy[i].TA_Account + " - " + window.tenancy[i].Licensee_Tenant_Name + "</option>"
        //     this.tenancyList.push(window.tenancy[i].TA_Account)
        //   }
        // }
        // this.own(on(this.TenantFilter, 'change', lang.hitch(this, this._onFilterChanged)));
      },
      _chartSelect: function (evt) {
        console.log(evt.currentTarget.id)

        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById("tab"+evt.currentTarget.id).style.display = "block";
        evt.currentTarget.className += " active";

      },

    });
    return clazz;
  });