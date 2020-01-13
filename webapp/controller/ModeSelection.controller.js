sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function(Controller, JSONModel) {
"use strict";

return Controller.extend("org.wlcp.wlcp-ui.controller.ModeSelection", {

    onInit : function () {

    },

    navigateToGameManager : function() {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteMainToolPage");
    },

    navigateToGameEditor : function() {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteGameEditorView");
    },

    navigateToGamePlayer : function() {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteVirtualDeviceView", {
            username : sap.ui.getCore().getModel("user").oData.username,
            gameInstanceId : 0,
            debugMode : false
        });
    }
});

});