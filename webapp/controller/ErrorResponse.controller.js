sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse", {

    onCloseErrorResponse : function(oEvent) {
        sap.ui.getCore().byId("errorResponseDialog").close();
        sap.ui.getCore().byId("errorResponseDialog").destroy();
    },

    setupDataModel : function(error) {
        if(typeof(error.responseJSON.subErrors) === "undefined") { error.responseJSON.subErrors = []; error.responseJSON.subErrors.push({message:"No Sub-errors..."}); }
        this.errorResponseDataModel = new sap.ui.model.json.JSONModel(error.responseJSON);
        sap.ui.getCore().byId("errorResponseDialog").setModel(this.errorResponseDataModel);
    },

    showDebugMessage : function(oEvent) {
        sap.m.MessageBox.error(this.errorResponseDataModel.getData().debugMessage);
    }

});