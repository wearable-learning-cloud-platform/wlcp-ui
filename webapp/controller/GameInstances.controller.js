sap.ui.controller("org.wlcp.wlcp-ui.controller.GameInstances", {

	socket : null,
	
	onStartGameInstance : function() {
		
		//Create an instance of the dialog
		this.dialog = sap.ui.xmlfragment("wlcpfrontend.fragments.GameInstances.StartGameInstance", this);
		
		//Set the model
		this.dialog.setModel(ODataModel.getODataModel(), "odata");
		
		//Setup an on after rendering function for filtering
		this.dialog.addEventDelegate({
			onAfterRendering : $.proxy(this.onAfterRenderingStartGameInstance, this)
		});
		
		//Open the dialog
		this.dialog.open();
	},
	
	onAfterRenderingStartGameInstance : function () {
		var gameBinding = sap.ui.getCore().byId("gameInstanceGame").getBinding("items");
		gameBinding.filter([new sap.ui.model.Filter("Username", "EQ", sap.ui.getCore().getModel("user").oData.username)]);
		gameBinding.filter([new sap.ui.model.Filter("DataLog", "EQ", false)]);
	},
	
	onCancel : function(oEvent) {
		this.dialog.close();
		this.dialog.destroy();
	},
	
	onStopGameInstance : function(oEvent) {
		this.stopInstanceId = ODataModel.getODataModel().getProperty(oEvent.getParameter("tile").oBindingContexts.odata.sPath).GameInstanceId;
		sap.m.MessageBox.confirm("Are you sure you want to stop this game instance?", {onClose : $.proxy(this.stopGameInstance, this)});
	},
	
	onEdit : function() {
		var oTileContainer = this.getView().byId("gameInstanceTileContainer");
		var newValue = !oTileContainer.getEditable();
		oTileContainer.setEditable(newValue);
	},
	
	startGameInstance : function() {
		this.busy = new sap.m.BusyDialog();
		this.busy.open();
		$.ajax({url: ODataModel.getWebAppURL() + "/Rest/Controllers/transpileGame?gameId=" + sap.ui.getCore().byId("gameInstanceGame").getSelectedKey() + "&write=true", type: 'GET', success : $.proxy(this.transpileSuccess, this), error : $.proxy(this.transpileError, this)});
	},
	
	transpileSuccess : function() {
		var gameId = sap.ui.getCore().byId("gameInstanceGame").getSelectedKey();
		$.ajax({url : "http://" + ServerConfig.getServerAddress() + "/controllers/startGameInstance/" + gameId + "/" + sap.ui.getCore().getModel("user").oData.username, success : $.proxy(this.gameInstanceStarted, this), error : $.proxy(this.gameInstanceStartError, this)});
	},
	
	transpileError : function() {
		sap.m.MessageBox.error("There was an error transpiling the game! The instance could not be started!");
		this.onCancel();
		this.busy.close();
	},
	
	gameInstanceStarted : function(response) {
		this.onCancel();
		this.busy.close();
		ODataModel.getODataModel().refresh();
		sap.m.MessageToast.show("Game Instance Start Successfully!");
	},
	
	gameInstanceStartError : function(response) {
		this.onCancel();
		this.busy.close();
		sap.m.MessageToast.show(response.responseText);
	},
	
	stopGameInstance : function(oEvent) {
		this.busy = new sap.m.BusyDialog();
		this.busy.open();
		$.ajax({url : "http://" + ServerConfig.getServerAddress() + "/controllers/stopGameInstance/" + this.stopInstanceId, success : $.proxy(this.gameInstanceStopped, this), error : $.proxy(this.gameInstanceStoppedError, this)});
	},
	
	gameInstanceStopped : function(response) {
		this.busy.close();
		ODataModel.getODataModel().refresh();
		sap.m.MessageToast.show("Game Instance Stopped Successfully!");
	},
	
	gameInstanceStoppedError : function(response) {
		this.busy.close();
		sap.m.MessageToast.show(response.responseText);
	},
	
/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.GameInstances
*/
	onInit: function() {
		
		//TEMPORARY FIX TO STOP FLICKERING OF TILES!!
		//THE TILE CONTAINER CONTROL HAS BEEN DEPRECIATED
		//THIS NEED TO BE REWRITTEN
		
//		this.getView().byId("gameInstanceTileContainer").addEventDelegate({
//			  onAfterRendering: function(){
//			        var oBinding = this.getView().byId("gameInstanceTileContainer").getBinding("tiles");
//			        oBinding.filter([new sap.ui.model.Filter("Username", "EQ", sap.ui.getCore().getModel("user").oData.username)]);
//			        oBinding.filter([new sap.ui.model.Filter("DebugInstance", "EQ", false)]);
//			  }
//			}, this);
	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf wlcpfrontend.views.GameInstances
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf wlcpfrontend.views.GameInstances
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf wlcpfrontend.views.GameInstances
*/
//	onExit: function() {
//
//	}

});