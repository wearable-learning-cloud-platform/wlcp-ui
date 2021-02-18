var RestAPIHelper = {

	busyDialog : new sap.m.BusyDialog(),
	busyDialogRequests : [],

	getAbsolute : function(url, async, successHandler, errorHandler, context, showBusy = true) {
		this.genericGet(window.location.origin + url, async, successHandler, errorHandler, context, undefined, showBusy);
	},

	get : function(url, async, successHandler, errorHandler, context, showBusy = true) {
		this.genericGet(ServerConfig.getServerAddress() + url, async, successHandler, errorHandler, context, undefined, showBusy);
	},

	genericGet : function(url, async, successHandler, errorHandler, context, headers = {Authorization: "Bearer " + SessionHelper.getCookie("wlcp.userSession")}, showBusy) {
		if(showBusy) { this.requestBusyDialog(); }
		var that = this;
		$.ajax({
			headers : headers,
			url: url, 
			type: 'GET',
			async : async,
			success: function(data) {
				that.callHandlerBasedOnContext(successHandler, data, context, showBusy);
			},
			error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context, showBusy);
			}
		});
	},

	postAbsolute : function(url, data, async, successHandler, errorHandler, context, showBusy = true) {
		this.genericPost(window.location.origin + url, data, async, successHandler, errorHandler, context, undefined, showBusy);
	},

	post : function(url, data, async, successHandler, errorHandler, context, showBusy = true) {
		this.genericPost(ServerConfig.getServerAddress() + url, data, async, successHandler, errorHandler, context, undefined, showBusy);
	},

	genericPost : function(url, data, async, successHandler, errorHandler, context, headers = {Authorization: "Bearer " + SessionHelper.getCookie("wlcp.userSession")}, showBusy) {
		this.requestBusyDialog();
        var that = this;
		$.ajax({
		headers : headers,
		contentType : "application/json",
		url: url,
		type: 'POST',
		async : async,
		data: JSON.stringify(data),
		success: function(data) {
            that.callHandlerBasedOnContext(successHandler, data, context, showBusy);
		},
		error : function(error) {
				that.createErrorResponseDialog(error);
				that.callHandlerBasedOnContext(errorHandler, error, context, showBusy);
			}
		});
	},
	
	createErrorResponseDialog : function(error) {
		if(typeof(error.responseJSON) === "undefined") { return; }
		if(typeof(error.responseJSON.subErrors) === "undefined") { error.responseJSON.subErrors = []; error.responseJSON.subErrors.push({message:"No Sub-errors..."}); }
		var controller = sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse");
		var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.ErrorResponse", controller);
		controller.dialog = fragment;
		if(typeof error.responseJSON.timestamp === "string") { error.responseJSON.timestamp = new Date(error.responseJSON.timestamp) }
		else { error.responseJSON.timestamp = new Date(error.responseJSON.timestamp.year.toString() + "-" + error.responseJSON.timestamp.monthValue.toString() + "-" + error.responseJSON.timestamp.dayOfMonth.toString() + " " + error.responseJSON.timestamp.hour + ":"  +error.responseJSON.timestamp.minute + ":" + error.responseJSON.timestamp.second); }
		controller.errorResponseDataModel = new sap.ui.model.json.JSONModel(error.responseJSON);
		fragment.setModel(controller.errorResponseDataModel);
		fragment.open();
	},
    
    callHandlerBasedOnContext : function(handler, data, context, showBusy) {
		if(showBusy) { this.closeBusyDialog(); }
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
			this.fallback = setTimeout(function() {
				this.busyDialog.close();
				this.busyDialog.destroy();
				this.busyDialog = new sap.m.BusyDialog();
				this.busyDialogRequests = [];
			}.bind(this), 30000);
			this.busyDialog.open();
		}
	},

	closeBusyDialog : function() {
		this.busyDialogRequests.pop();
		if(this.busyDialogRequests.length <= 0) {
			clearTimeout(this.fallback);
			this.busyDialog.close();
			this.busyDialog.destroy();
			this.busyDialog = new sap.m.BusyDialog();
		}
	}
}