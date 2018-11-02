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
  'node_modules/chart.js/dist/Chart.js',
  'dijit/form/HorizontalSlider',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'

], function (declare, BaseWidget, _WidgetsInTemplateMixin, on, lang, html, djConfig, jimuUtils, watchUtils, QueryTask, Query, Chart) {

  var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

    baseClass: 'jimu-widget-overview',
    _config: null,
    SnapshotDate: window.SnapshotDate,
    tenancyList:[],
    TADT: null,
    DataTableLoaded: false,

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

      //Check if Data not loaded
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
          url: this._config.layerInfos[1].featureLayer.url
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
          that._AfterLoad()
        });
      } else {
        this._AfterLoad();
      }
    },
    onOpen:function(){
      window.lastwidget.setWidget("Overview");
    },

    _onFilterChanged: function () {
      console.log("_onFilterChanged")
      var NLAChart = this.NLAChart;
      function findWithAttr(array, attr, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i][attr] === value) {
            return i;
          }
        }
        return -1;
      }

      //Full set of data
      var IDTA0 = window.IDTA, tenancy0 = window.tenancy, PMS0 = window.PMS;
      //Data based on filter
      var IDTA = [], tenancy = [], PMS = [];

      for (var i = 0; i < tenancy0.length; i++) {
        if (tenancy0[i].TA_Account == this.TenantFilter.value || this.TenantFilter.value == '') {
          tenancy.push(tenancy0[i])
        }
      }
      for (var i = 0; i < IDTA0.length; i++) {
        if (IDTA0[i].TA_Account == this.TenantFilter.value || this.TenantFilter.value == '') {
          IDTA.push(IDTA0[i])
        }
      }
      for (var i = 0; i < IDTA.length; i++) {
        if (!(findWithAttr(PMS0, "", IDTA[i].PROPERTY_ID))) {
          PMS.push(PMS0[i])
        }
      }

      //Get Date for NLA Chart
      var objArr = { year: [], NLA: [] }
      for (var i = 0; i < PMS.length; i++) {
        if (PMS[i].END_DATE != null && new Date(PMS[i].START_DATE) < new Date()) {
          var EndDate = new Date(PMS[i].END_DATE)
          var endYear = EndDate.getFullYear().toString()
          var yearIndex = objArr.year.indexOf(endYear)

          if (yearIndex == -1) {
            if (objArr.year.length == 0) {
              objArr.year.push(endYear)
              objArr.NLA.push(PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
              continue
            }

            for (var j = 0; j < objArr.year.length; j++) {
              if (endYear < objArr.year[j]) {
                objArr.year.splice(j, 0, endYear)
                objArr.NLA.splice(j, 0, PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
                break
              }
              if (j == objArr.year.length - 1) {
                objArr.year.push(endYear)
                objArr.NLA.push(PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
                break
              }
            }
          } else {
            objArr.NLA[yearIndex] += PMS[i].TOTAL_PROP_BLDG_GFA_SQM
          }

        }
      }

      var NChart = new Chart(NLAChart, {
        type: 'bar',
        data: {
          labels: objArr.year,
          datasets: [{
            label: 'Current Rent',
            yAxisID: 'Current Rent',
            // data: [90000, 250000, 300000,250000, 300000],
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 2,
            xAxisID: "x-axis1",
          }, {
            label: 'NLA',
            yAxisID: 'NLA',
            data: objArr.NLA,
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
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
              id: 'NLA',
              type: 'linear',
              position: 'right',
              scaleLabel: {
                display: true,
                labelString: 'NLA'
              }
            }]
          },
          legend: {
            display: true
          }
        }
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

      if (this.DataTableLoaded == false) {
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
          dom: 't'
        });
        this.DataTableLoaded = true
        console.log("DataTableLoaded = " + this.DataTableLoaded)
        console.log(TATableData)
        console.log(colNames)
      } else {
        this.TADT.column(2).search(this.TenantFilter.value).draw();
      }

      // $('#TATable tbody').on('click', 'tr', function () {
      //   if ($(this).hasClass('selected')) {
      //     $(this).removeClass('selected');
      //   }
      //   else {
      //     $('#TATable').DataTable().$('tr.selected').removeClass('selected');
      //     $(this).addClass('selected');
      //   }
      // });
    },

    _AfterLoad: function(){
      this.TenantFilter.innerHTML = "<option></option>"
      for (var i = 0; i < window.tenancy.length; i++) {
        if(this.tenancyList.indexOf(window.tenancy[i].TA_Account)==-1){
          this.TenantFilter.innerHTML += "<option value='" + window.tenancy[i].TA_Account + "'>" + window.tenancy[i].TA_Account + " - " + window.tenancy[i].Licensee_Tenant_Name + "</option>"
          this.tenancyList.push(window.tenancy[i].TA_Account)
        }
      }
      this.own(on(this.TenantFilter, 'change', lang.hitch(this, this._onFilterChanged)));
      this._onFilterChanged();
    }

  });
  return clazz;
});