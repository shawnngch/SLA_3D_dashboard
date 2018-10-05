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

    //lighting._lastTimezone:The time zone which map shows
    //lighting.date: The date map uses

    postCreate: function () {
      this.inherited(arguments);

      this._config = lang.clone(this.config.editor);
      var that = this;

      var SnapshotDate = this.SnapshotDate
      if (!this.SnapshotDate) {
        console.log("no value")
        SnapshotDate = new Date("2018-10-01");
        this.SnapshotDate = SnapshotDate;
      } else {
        console.log(SnapshotDate)
      }

      var optionsfull = { year: 'numeric', month: 'long', day: 'numeric' };
      var tenancyQueryTask = new QueryTask({
        url: this._config.layerInfos[3].featureLayer.url
      });

      var query = new Query();
      query.returnGeometry = false;
      query.where = "SnapshotDate = '" + SnapshotDate.toLocaleDateString('en-US', optionsfull) + "'";
      query.outFields = ["*"];

      tenancyQueryTask.execute(query).then(function (tenancyResults) {
        var resultset = tenancyResults.features;
        var tenants = []
        that.TenantFilter.innerHTML = "<option></option>"

        for (var i = 0; i < resultset.length; i++) {
          tenants.push({
            TA_Account: resultset[i].attributes.TA_Account,
            Licensee_Tenant_Name: resultset[i].attributes.Licensee_Tenant_Name
          })

          that.TenantFilter.innerHTML += "<option value='" + resultset[i].attributes.TA_Account + "'>" + resultset[i].attributes.TA_Account + " - " + resultset[i].attributes.Licensee_Tenant_Name + "</option>"
        }

        that.own(on(that.TenantFilter, 'change', lang.hitch(that, that._onFilterChanged)));
        that._onFilterChanged();
      })

    },

    _onFilterChanged: function () {
      console.log("_onFilterChanged")
      var optionsfull = { year: 'numeric', month: 'long', day: 'numeric' };
      var that = this;
      var NLAChart = this.NLAChart;
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
      var param0 =
      {
        attribute: 'TA_Account',
        Values: [this.TenantFilter.value],
        queryTask: tenancyQueryTask
      }

      this.queryManager(param0).then(function (tenancyResults) {
        console.log("tenancyResults")
        var resultset = tenancyResults.features;
        var List_TA_Account = []
        for (var i = 0; i < resultset.length; i++) {
          tenancy.push(resultset[i].attributes);
          List_TA_Account.push(resultset[i].attributes.TA_Account)
        }

        return {
          attribute: 'TA_Account',
          Values: List_TA_Account,
          queryTask: IDTAqueryTask
        }

      }).then(param => {
        return that.queryManager(param)
      }).then(function (IDTAresults) {
        console.log("IDTAresults")
        var resultset = IDTAresults.features;
        var List_Property_ID = []

        for (var i = 0; i < resultset.length; i++) {
          IDTA.push(resultset[i].attributes);
          List_Property_ID.push(resultset[i].attributes.Property_ID)
        }

        return {
          attribute: 'Property_ID',
          Values: List_Property_ID,
          queryTask: PMSqueryTask
        }
      }).then(param => {
        return that.queryManager(param)
      }).then(function (PMSresults) {
        console.log("PMSresults")
        var resultset = PMSresults.features;

        for (var i = 0; i < resultset.length; i++) {
          PMS.push(resultset[i].attributes);
        }

        console.log(tenancy)
        console.log(IDTA)
        console.log(PMS)

        var objArr = { year: [], NLA: [] }
        for (var i = 0; i < PMS.length; i++) {
          if (PMS[i].END_DATE != null && new Date(PMS[i].START_DATE) < new Date()) {
            var EndDate = new Date(PMS[i].END_DATE)
            var endYear = EndDate.getFullYear().toString()
            var yearIndex = objArr.year.indexOf(endYear)

            if (yearIndex == -1) {
              if(objArr.year.length == 0){
                objArr.year.push(endYear)
                objArr.NLA.push(PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
                continue
              }

              for (var j = 0; j < objArr.year.length; j++) {
                if(endYear<objArr.year[j]){
                  objArr.year.splice(j,0,endYear)
                  objArr.NLA.splice(j,0,PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
                  break
                }
                if(j==objArr.year.length-1){
                  objArr.year.push(endYear)
                  objArr.NLA.push(PMS[i].TOTAL_PROP_BLDG_GFA_SQM)
                  break
                }
              }
            }else{
              objArr.NLA[yearIndex] +=PMS[i].TOTAL_PROP_BLDG_GFA_SQM
            }

          }
        }

        var NChart = new Chart(NLAChart, {
          type: 'line',
          data: {
            labels: objArr.year,
            datasets: [{
              label: 'Current Rent',
              yAxisID: 'Current Rent',
              // data: [90000, 250000, 300000],
              backgroundColor: 'rgba(255, 255, 255, 0.0)',
              // backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255,99,132,1)',
              borderWidth: 2,
              xAxisID: "x-axis1",
            }, {
              label: 'NLA',
              yAxisID: 'NLA',
              data: objArr.NLA,
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
      });
    },

    queryManager: function (param) {
      var query = new Query();
      var whereStatement = "SnapshotDate = '" + this.SnapshotDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + "'";

      query.returnGeometry = false;
      query.outFields = ["*"];

      var first = true
      for (var i = 0; i < param.Values.length; i++) {
        if (param.Values[i] == '') {
          continue;
        } else {
          if (first) {
            whereStatement += " AND (" + param.attribute + " ='" + param.Values[i] + "'"
            first = false
          } else {
            whereStatement += " OR " + param.attribute + " ='" + param.Values[i] + "'"
          }
        }

        if (!first && i == param.Values.length - 1) {
          whereStatement += ")"
        }
      }
      query.where = whereStatement;

      // return query
      return param.queryTask.execute(query)
    }

  });
  return clazz;
});