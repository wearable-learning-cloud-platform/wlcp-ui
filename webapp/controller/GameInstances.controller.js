sap.ui.controller("org.wlcp.wlcp-ui.controller.GameInstances", {

	socket : null,
	
	onStartGameInstance : function() {

		//Set a pointer to this we can use in the callback
		var that = this;

		//Get the data
		RestAPIHelper.get("/gameController/getGames/", true, 

		function(data) {

		//Create an instance of the dialog
		that.dialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameInstances.StartGameInstance", that);

		//Set the model
		that.dialog.setModel(new sap.ui.model.json.JSONModel(data), "odata");

		//Open the dialog
		that.dialog.open();

		},

		function(error) {

		}, this);

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
		this.stopInstanceId = this.getView().getModel("odata").getProperty(oEvent.getParameter("tile").oBindingContexts.odata.sPath).gameInstanceId;
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

		RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startGameInstance", {gameId : sap.ui.getCore().byId("gameInstanceGame").getSelectedKey(), usernameId : sap.ui.getCore().getModel("user").oData.username}, true, this.gameInstanceStarted, this.gameInstanceStartError, this);
	},
	
	gameInstanceStarted : function(response) {
		this.onCancel();
		this.busy.close();
		
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/gameInstances", true, this.getGameInstancesSuccess, this.getGameInstancesError, this);
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
		RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/stopGameInstance", {gameInstanceId : this.stopInstanceId}, true, this.gameInstanceStopped, this.gameInstanceStoppedError, this);
	},
	
	gameInstanceStopped : function(response) {
		this.busy.close();
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/gameInstances", true, this.getGameInstancesSuccess, this.getGameInstancesError, this);
		sap.m.MessageToast.show("Game Instance Stopped Successfully!");
	},
	
	gameInstanceStoppedError : function(response) {
		this.busy.close();
		sap.m.MessageToast.show(response.responseText);
	},

	getGameInstancesSuccess : function(data) {
		this.getView().setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
		//sap.ui.getCore().byId("__xmlview3--gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel(data), "odata");
		this.getView().byId("gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
	},
	
/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.GameInstances
*/
	onInit: function() {

		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/gameInstances/", true, this.getGameInstancesSuccess, this.getGameInstancesError, this);
		
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