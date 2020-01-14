sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/HashChanger"
], function(Controller, HashChanger) {
  "use strict";

  return Controller.extend("org.wlcp.wlcp-ui.controller.MainView", {

    userModelData : {
      username: ""
    },

    userModel : new sap.ui.model.json.JSONModel(),
    

    onInit : function() {
      if(this.getCookie("wlcp.userSession") != "") {
          this.userModelData.username = this.getCookie("wlcp.userSession");
          this.userModel.setData(this.userModelData);
          sap.ui.getCore().setModel(this.userModel, "user");
          if(HashChanger.getInstance().getHash() == "") {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteLoginView");
          }
      } else {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteLoginView");
      }
    },

    getCookie : function(cname) {
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  });
});
