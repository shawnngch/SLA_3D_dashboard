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
    tenancyList: [],
    TADT: null,
    subtenancyDT: null,
    TADataTableLoaded: false,
    subtenancyTableLoaded: false,


    //lighting._lastTimezone:The time zone which map shows
    //lighting.date: The date map uses

    postCreate: function () {
      this.inherited(arguments);

      // this._config = lang.clone(this.config.editor);

      // this._AfterLoad();
      var that = this
      //Global Variable Listener (on window.filterlistener)
      window.filterlistener.registerListener(function (val) {
        // alert("Someone changed the value of x.a to " + val);
        that._onFilterChanged();
      });
    },
    onOpen: function () {
      window.lastwidget.setWidget("Subtenant");
    },
    onClose: function () {
      window.lastwidget.setWidget("");
    },

    _onFilterChanged: function () {
      console.log("_onFilterChanged")

      var tenantvalues = $('#TenantFilter').dropdown('get value');
      console.log(tenantvalues)
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
          if (tenancy0[i].TIMELINE == window.maxTimeline) tenancy.push(tenancy0[i])
        }
      }
      for (var i = 0; i < IDTA0.length; i++) {
        // if (IDTA0[i].TA_Account == this.TenantFilter.value || this.TenantFilter.value == '') {
        if (tenantvalues.indexOf(IDTA0[i].TA_Account) != -1 || tenantvalues.length == 0) {
          if (IDTA0[i].TIMELINE == window.maxTimeline) IDTA.push(IDTA0[i])
        }
      }
      for (var i = 0; i < IDTA.length; i++) {
        var PMSindex = findWithAttr(PMS0, "PROPERTY_ID", IDTA[i].PROPERTY_ID, "TIMELINE", window.maxTimeline)
        if (PMSindex != -1) {
          PMS.push(PMS0[PMSindex])
        }
      }
      for (var i = 0; i < subtenants0.length; i++) {
        if (tenantvalues.indexOf(subtenants0[i].TA_Account) != -1 || tenantvalues.length == 0) {
          subtenants.push(subtenants0[i])
        }
      }


      // //Get data for expiryTable
      // var totalExpiring = 0, allocationNo = { modeOfAllocation: [], qty: [] }, 
      // var TATableData = [];
      const tenancyAttributes = Object.keys(tenancy[0])
      const subtenantsAttributes = Object.keys(subtenants[0])
      // for (var i = 0; i < tenancy.length; i++) {
      //   const tenancyRowArray = Object.values(tenancy[i])
      //   TATableData.push(tenancyRowArray)
      // }
      var TATableData = tenancy.map(function (obj) {
        return Object.keys(obj).map(function (key) {
          if (key.includes("_DATE")){
            obj[key]= window.toShortDate(obj[key])
          }
          return obj[key];
        });
      });
      var subtenancyTableData = subtenants.map(function (obj) {
        return Object.keys(obj).map(function (key) {
          if (key.includes("_Date")){
            obj[key]= window.toShortDate(obj[key])
          }
          return obj[key];
        });
      });

      var TAColNames = [], subtenancyColNames = [];
      // for (var i = 0; i < tenancyAttributes.length; i++) {
      //   TAColNames.push({ title: tenancyAttributes[i] })
      // }
      var col = ['','','','TA Account','','','','Tenant Name','Tenancy Status','Property','','Specific Usage','','','','GFA(m²)','','','Monthly Rental','','Rate(PSF)','','TA Start Date','TA End Date','Tenure End Date','','','']
      for (var i = 0; i < col.length; i++) {
        TAColNames.push({ title: col[i] })
      }
      // for (var i = 0; i < subtenantsAttributes.length; i++) {
      //   subtenancyColNames.push({ title: subtenantsAttributes[i] })
      // }
      var stCol = ['objectid','sn','TA Account','Property ID','GBR ID','Block No','Unit No','Classification of Cluster','Licensee Tenant Name','Status of Tenancy','Unit Location','Broad Classification of Use','Specific usage','Type of Food Retail Offering','GFA(sqm)','GFA(psf)','Approved ORA area','Monthly Rental','Rate(Psm)','Rate(Psf)','Maintence Charge','TA Start Date','TA Expiry Date','Commited Tenure End Date']
      for (var i = 0; i < stCol.length; i++) {
        subtenancyColNames.push({ title: stCol[i] })
      }

      //TATable
      if (this.TADataTableLoaded == false) {
        this.TADT = $('#TATable1').DataTable({
          data: TATableData,
          columns: TAColNames,
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
              targets: [4],
              visible: false
            },
            {
              targets: [5],
              visible: false
            },
            {
              targets: [6],
              visible: false
            },
            {
              targets: [10],
              visible: false
            },
            {
              targets: [12],
              visible: false
            },
            {
              targets: [13],
              visible: false
            },
            {
              targets: [14],
              visible: false
            },
            {
              targets: [16],
              visible: false
            },
            {
              targets: [17],
              visible: false
            },
            {
              targets: [19],
              visible: false
            },
            {
              targets: [21],
              visible: false
            },
            {
              targets: [25],
              visible: false
            },
            {
              targets: [26],
              visible: false
            },
            {
              targets: [27],
              visible: false
            },
            {
              targets: [28],
              visible: false
            }
          ],
          scrollY: '250',
          scrollX: true,
          paging: false,
          dom: 't'
        });
        this.TADataTableLoaded = true
        console.log("DataTableLoaded = " + this.TADataTableLoaded)
      } else {
        var searchstr = tenantvalues.join("|");

        this.TADT.column(3).search(searchstr, true, false).draw();
      }
      //subtenancyTable
      if (this.subtenancyTableLoaded == false) {
        this.subtenancyDT = $('#subtenancyTable').DataTable({
          data: subtenancyTableData,
          columns: subtenancyColNames,
          columnDefs: [//4,5,7,11,13,16,18
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
              targets: [6],
              visible: false
            },
            {
              targets: [8],
              visible: false
            },
            {
              targets: [9],
              visible: false
            },
            {
              targets: [10],
              visible: false
            },
            {
              targets: [12],
              visible: false
            },
            {
              targets: [14],
              visible: false
            },
            {
              targets: [15],
              visible: false
            },
            {
              targets: [17],
              visible: false
            },
            {
              targets: [19],
              visible: false
            },
            {
              targets: [20],
              visible: false
            },
            {
              targets: [21],
              visible: false
            },
            {
              targets: [22],
              visible: false
            }
          ],
          scrollY: '250',
          scrollX: true,
          paging: false,
          dom: 't'
        });
        this.subtenancyTableLoaded = true
        console.log("subtenancyTableLoaded = " + this.subtenancyTableLoaded)
      } else {
        var searchstr = tenantvalues.join("|");

        this.subtenancyDT.column(2).search(searchstr, true, false).draw();
      }



    },

    _AfterLoad: function () {
      this.TenantFilter.innerHTML = "<option></option>"
      for (var i = 0; i < window.tenancy.length; i++) {
        if (this.tenancyList.indexOf(window.tenancy[i].TA_Account) == -1) {
          this.TenantFilter.innerHTML += "<option value='" + window.tenancy[i].TA_Account + "'>" + window.tenancy[i].TA_Account + " - " + window.tenancy[i].Licensee_Tenant_Name + "</option>"
          this.tenancyList.push(window.tenancy[i].TA_Account)
        }
      }
      this.own(on(this.TenantFilter, 'change', lang.hitch(this, this._onFilterChanged)));
    }

  });
  return clazz;
});