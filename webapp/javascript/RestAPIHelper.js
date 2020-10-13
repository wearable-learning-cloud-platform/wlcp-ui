var RestAPIHelper = {

	busyDialog : new sap.m.BusyDialog(),
	busyDialogRequests : [],

	getAbsolute : function(url, async, successHandler, errorHandler, context) {
		this.requestBusyDialog();
		var that = this;
		$.ajax({
			url: window.location.origin + url, 
			type: 'GET',
			async : async,
			success: function(data) {
				that.callHandlerBasedOnContext(successHandler, data, context);
			},
			error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context);
			}
		});

	},

	get : function(url, async, successHandler, errorHandler, context) {
		this.requestBusyDialog();
		var that = this;
		$.ajax({
			url: ServerConfig.getServerAddress() + url, 
			type: 'GET',
			async : async,
			success: function(data) {
				that.callHandlerBasedOnContext(successHandler, data, context);
			},
			error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context);
			}
		});

	},

	postAbsolute : function(url, data, async, successHandler, errorHandler, context) {
		this.requestBusyDialog();
        var that = this;
		$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'},
		url: window.location.origin + url,
		type: 'POST',
		dataType: 'json',
		async : async,
		data: JSON.stringify(data),
		success: function(data) {
            that.callHandlerBasedOnContext(successHandler, data, context);
		},
		error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context);
			}
		});
	},

	post : function(url, data, async, successHandler, errorHandler, context) {
		this.requestBusyDialog();
        var that = this;
		$.ajax({headers : { 'Accept': 'application/json', 'Content-Type': 'application/json'},
		url: ServerConfig.getServerAddress() + url,
		type: 'POST',
		dataType: 'json',
		async : async,
		data: JSON.stringify(data),
		success: function(data) {
            that.callHandlerBasedOnContext(successHandler, data, context);
		},
		error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context);
			}
		});
	},
	
	createErrorResponseDialog : function(error) {
		if(typeof(error.responseJSON.subErrors) === "undefined") { error.responseJSON.subErrors = []; error.responseJSON.subErrors.push({message:"No Sub-errors..."}); }
		var controller = sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse");
		var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.ErrorResponse", controller);
		controller.dialog = fragment;
		controller.errorResponseDataModel = new sap.ui.model.json.JSONModel(error.responseJSON);
		fragment.setModel(controller.errorResponseDataModel);
		fragment.open();
	},
    
    callHandlerBasedOnContext : function(handler, data, context) {
		this.closeBusyDialog();
        if(typeof(context) !== "undefined") {
            var handler = handler.bind(context);
            handler(data);
        } else {
            handler(data);
        }
	},
	
	requestBusyDialog : function() {
		if(this.busyDialogRequests.length > 0) {
			this.busyDialogRequests.push("");
		} else {
			this.busyDialog.open();
		}
	},

	closeBusyDialog : function() {
		this.busyDialogRequests.pop();
		if(this.busyDialogRequests.length <= 0) {
			this.busyDialog.close();
			this.busyDialog.destroy();
			this.busyDialog = new sap.m.BusyDialog()
		}
	}
}