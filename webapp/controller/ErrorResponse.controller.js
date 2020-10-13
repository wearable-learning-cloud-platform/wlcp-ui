sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse", {

    dialog : null,
    errorResponseDataModel : null,

    onCloseErrorResponse : function(oEvent) {
        this.dialog.close();
        this.dialog.destroy();
    },

    showDebugMessage : function(oEvent) {
        sap.m.MessageBox.error(this.errorResponseDataModel.getData().debugMessage);
    }

});