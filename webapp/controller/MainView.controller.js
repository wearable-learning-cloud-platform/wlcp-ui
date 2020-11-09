sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/HashChanger"
], function(Controller, HashChanger) {
  "use strict";

  return Controller.extend("org.wlcp.wlcp-ui.controller.MainView", {

    onInit : function() {
      if(HashChanger.getInstance().getHash().includes("RouteVirtualDeviceView") && (HashChanger.getInstance().getHash().includes("true"))) { return; }
      if(SessionHelper.sessionCookieValid()) {
        SessionHelper.setupNewSession(this);
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");
      } else {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteLoginView");
      }
    }

  });

});
