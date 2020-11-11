var SessionHelper = {

    cookieName : "wlcp.userSession",
    userModel : new sap.ui.model.json.JSONModel(),

    setupNewSession : function(context) {
        this.createSessionExpirationTimer(context);
        this.setUsernameModel();
    },

    createSessionExpirationTimer : function(context) {
        window.wlcpSessionTimeout = setTimeout(function() { 
            sap.m.MessageBox.information("Your session has expired. Press ok to go back to the login!", {
              title: "Session Expired!",
              onClose: function(oEvent) {
                if(typeof sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.Login"] !== "undefined") {
                  sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.Login"].undefined.getController().resetDataModel();
                }
                if(typeof sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.MainToolpage"] !== "undefined") {
                  sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.MainToolpage"].undefined.getController().resetGameManager();
                }
                if(typeof sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.GameEditor"] !== "undefined") {
                  sap.ui.core.UIComponent.getRouterFor(context)._oViews._oCache.view["org.wlcp.wlcp-ui.view.GameEditor"].undefined.getController().resetEditor();
                }
                sap.ui.core.UIComponent.getRouterFor(context).navTo("RouteLoginView");
              },
              actions: sap.m.MessageBox.Action.OK,
            });
          }, (jwt_decode(this.getCookie(this.cookieName)).exp * 1000) - Date.now());
    },

    sessionCookieValid : function() {
        if(this.getCookie(this.cookieName) != "") {
            return true;
        } else {
            return false;
        }
    },

    setUsernameModel : function() {
        var userModelData = {
            username: jwt_decode(this.getCookie("wlcp.userSession")).sub
        };
        this.userModel.setData(userModelData);
        sap.ui.getCore().setModel(this.userModel, "user");
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

}