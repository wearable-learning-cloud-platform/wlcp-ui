var RestAPIHelper = {

	get : function(url, async, successHandler, errorHandler) {
		$.ajax({
			url: ServerConfig.getServerAddress() + url, 
			type: 'GET',
			async : async,
			success: function(data) {
					successHandler(data);
				},
			error : function() {

				}
		});

	},

	post : function(url, data, async, successHandler, errorHandler, context) {
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
				if(typeof(error.responseJSON.subErrors) !== "undefined") {
					var controller = sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse");
					var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.ErrorResponse", controller);
					fragment.open();
					controller.setupDataModel(error);
				} else {
					var controller = sap.ui.controller("org.wlcp.wlcp-ui.controller.ErrorResponse");
					var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.ErrorResponse", controller);
					fragment.open();
					controller.setupDataModel(error);
				}
				that.callHandlerBasedOnContext(errorHandler, data, context);
			}
		});
    },
    
    callHandlerBasedOnContext : function(handler, data, context) {
        if(typeof(context) !== "undefined") {
            var handler = handler.bind(context);
            handler(data);
        } else {
            handler(data);
        }
    }
}