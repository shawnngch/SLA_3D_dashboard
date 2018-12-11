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
      // var dd = $('#TA1').dropdown();

      // this._onFilterChanged();

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
          return obj[key];
        });
      });
      var subtenancyTableData = subtenants.map(function (obj) {
        return Object.keys(obj).map(function (key) {
          return obj[key];
        });
      });

      var TAColNames = [], subtenancyColNames = [];
      for (var i = 0; i < tenancyAttributes.length; i++) {
        TAColNames.push({ title: tenancyAttributes[i] })
      }
      for (var i = 0; i < subtenantsAttributes.length; i++) {
        subtenancyColNames.push({ title: subtenantsAttributes[i] })
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
          // columnDefs: [
          //   {
          //     targets: [0],
          //     visible: false
          //   },
          //   {
          //     targets: [1],
          //     visible: false
          //   },
          //   {
          //     targets: [2],
          //     visible: false
          //   },
          //   {
          //     targets: [3],
          //     visible: false
          //   },
          //   {
          //     targets: [12],
          //     visible: false
          //   }
          // ],
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