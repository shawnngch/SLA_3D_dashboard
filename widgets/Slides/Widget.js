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
  'dojo/topic',
  'dojo/query',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/_base/array'
], function (declare, BaseWidget, topic, query, html, lang, array) {
  var clazz = declare([BaseWidget], {

    name: 'Slides',
    baseClass: 'jimu-widget-slides',

    _selfHeight: 0,
    _isExpand: false,
    _marginLeading: "marginLeft",
    _marginTrailing: "marginRight",
    _isSlideBarMoving: false,
    _timeoutId: -1,

    postCreate: function () {
      this.inherited(arguments);
      if (window.isRTL) {
        this._marginLeading = "marginRight";
        this._marginTrailing = "marginLeft";
      } else {
        this._marginLeading = "marginLeft";
        this._marginTrailing = "marginRight";
      }
      if (!this.isOnScreen) {
        html.addClass(this.domNode, 'slides-in-widget-pool');
      }
      if (window._layoutManager) {
        this.own(topic.subscribe("beforeLayoutChange",
          lang.hitch(this, this._onBeforeLayoutChange)));
        this.own(topic.subscribe("afterLayoutChange",
          lang.hitch(this, this._onAfterLayoutChange)));
      }
    },

    onOpen: function () {
      this.inherited(arguments);
      this._expand();
    },

    onClose: function () {
      this.inherited(arguments);
      this._collapse();
    },

    setPosition: function (position, containerNode) {
      //make sure always put Slides into map
      if (arguments[1] === this.sceneView.map.id) {
        this.inherited(arguments);
      } else {
        containerNode = this.sceneView.map.id;
        this.setPosition(position, containerNode);
      }
    },

    resize: function () {
      this._clearTimeoutId();
    },

    destroy: function () {
      this._collapse();
      this.inherited(arguments);
    },

    _onBeforeLayoutChange: function () {
      this._isExpandBeforeLayoutChagne = this._isExpand;
      if (this._isExpand) {
        this._collapse();
      }
    },

    _onAfterLayoutChange: function () {
      if (this._isExpandBeforeLayoutChagne) {
        this._expand();
      }
      this._isExpandBeforeLayoutChagne = this._isExpand;
    },

    _onIconClicked: function () {
      this._expand();
    },

    _expand: function () {
      if (this._isExpand) {
        return;
      }

      this._isExpand = true;
      html.addClass(this.domNode, 'expand');
      html.addClass(this.sceneView.container, 'slide-widget-expand');
      this._selfHeight = this.domNode.clientHeight;
      var deltaY = this._selfHeight;
      this._offsetBottom(deltaY);
    },

    _offsetBottom: function (deltaY) {
      var widgets = this._getBottomPositionOnScreenOffPanelWidgets();
      if (widgets && widgets.length > 0) {
        array.forEach(widgets, lang.hitch(this, function (widget) {
          var newPosition = lang.clone(widget.getPosition());
          newPosition.bottom += deltaY;
          widget.setPosition(newPosition);
        }));
      }

      var placeholders = this._getBottomPositionPlaceholders();
      if (placeholders && placeholders.length > 0) {
        array.forEach(placeholders, lang.hitch(this, function (placeholder) {
          var newPosition = lang.clone(placeholder.position);
          newPosition.bottom += deltaY;
          placeholder.moveTo(newPosition);
        }));
      }

      var widgetIcons = this._getBottomPositionWidgetIcons();
      if (widgetIcons && widgetIcons.length > 0) {
        array.forEach(widgetIcons, lang.hitch(this, function (widgetIcon) {
          var newPosition = lang.clone(widgetIcon.position);
          newPosition.bottom += deltaY;
          widgetIcon.moveTo(newPosition);
        }));
      }
    },

    _clearTimeoutId: function () {
      if (this._timeoutId > 0) {
        clearTimeout(this._clearTimeoutId);
      }
      this._timeoutId = -1;
    },

    _onSlideCloseClicked: function () {
      if (this.isOnScreen) {
        if (this.closeable) {
          this.widgetManager.closeWidget(this);
        } else {
          this._collapse();
        }
      } else {
        this.widgetManager.closeWidget(this);
      }
    },

    _collapse: function () {
      if (!this._isExpand) {
        return;
      }

      this._isExpand = false;
      html.removeClass(this.domNode, 'expand');
      html.removeClass(this.sceneView.container, 'slide-widget-expand');
      this._clearTimeoutId();
      var deltaY = - this._selfHeight;
      this._offsetBottom(deltaY);
    },

    _getBottomPositionOnScreenOffPanelWidgets: function () {
      var widgets = this.widgetManager.getOnScreenOffPanelWidgets();
      if (widgets && widgets.length > 0) {
        widgets = array.filter(widgets, lang.hitch(this, function (widget) {
          var position = widget.getPosition();
          return (widget !== this && position &&
            typeof position.bottom === 'number' && position.relativeTo === "map");
        }));
      }
      if (!widgets) {
        widgets = [];
      }
      return widgets;
    },

    _getBottomPositionPlaceholders: function () {
      var placeholders = [];
      if (window._layoutManager && window._layoutManager.widgetPlaceholders) {
        placeholders = array.filter(window._layoutManager.widgetPlaceholders,
          lang.hitch(this, function (item) {
            return item.position && typeof item.position.bottom === "number";
          }));
      }
      return placeholders;
    },

    _getBottomPositionWidgetIcons: function () {
      var widgetIcons = [];
      if (window._layoutManager && window._layoutManager.preloadWidgetIcons) {
        widgetIcons = array.filter(window._layoutManager.preloadWidgetIcons,
          lang.hitch(this, function (item) {
            return item.position && typeof item.position.bottom === "number";
          }));
      }
      return widgetIcons;
    }
  });

  return clazz;
});