sap.ui.controller("org.wlcp.wlcp-ui.controller.GameInstances", {

	socket : null,
	
	onStartGameInstance : function() {
		var loadGameDialogModel = {
			privateGames : null,
			publicGames : null
		};
		RestAPIHelper.get("/gameController/getPrivateGames?usernameId=" + sap.ui.getCore().getModel("user").oData.username, false,
		function(data) {
			loadGameDialogModel.privateGames = data;
			RestAPIHelper.get("/gameController/getPublicGames", false,
			function(data) {
				loadGameDialogModel.publicGames = data;
				var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameInstances.StartGameInstance", this);
				fragment.setModel(new sap.ui.model.json.JSONModel(loadGameDialogModel));
				fragment.open();
				this.dialog = fragment;
			}, 
			function(error) {
				//Allow default error handling
			}, this);
		}, 
		function(error) {
			//Allow default error handling
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
		var gameToLoad = "";
		if(sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey() != "" && sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey() != "") {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.load.selectError"));
			return;
		} else if(sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey() != "") {
			gameToLoad = sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey();
		} else if(sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey() != "") {
			gameToLoad = sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey();
		} else {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.load.selectNoneError"));
			return;
		}
		RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startGameInstance", {gameId : gameToLoad, usernameId : sap.ui.getCore().getModel("user").oData.username}, true, this.gameInstanceStarted, this.gameInstanceStartError, this);
	},
	
	gameInstanceStarted : function(response) {
		this.onCancel();
		
		this.getGameInstances();
		sap.m.MessageToast.show("Game Instance Start Successfully!");
	},
	
	gameInstanceStartError : function(response) {
		this.onCancel();
		sap.m.MessageToast.show(response.responseText);
	},
	
	stopGameInstance : function(oEvent) {
		if(oEvent == sap.m.MessageBox.Action.OK) {
			RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/stopGameInstance", {gameInstanceId : this.stopInstanceId}, true, this.gameInstanceStopped, this.gameInstanceStoppedError, this);
		}
	},
	
	gameInstanceStopped : function(response) {
		this.getGameInstances();
		sap.m.MessageToast.show("Game Instance Stopped Successfully!");
	},
	
	gameInstanceStoppedError : function(response) {
		sap.m.MessageToast.show(response.responseText);
	},

	getGameInstancesSuccess : function(data) {
		this.getView().setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
		//sap.ui.getCore().byId("__xmlview3--gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel(data), "odata");
		this.getView().byId("gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
	},

	onRouteMatched: function (oEvent) {
		this.getGameInstances();
	},

	getGameInstances : function() {
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/gameInstances?usernameId=" + sap.ui.getCore().getModel("user").getProperty("/username"), true, this.getGameInstancesSuccess, this.getGameInstancesError, this);
	},

	reset : function() {
		this.getView().setModel(new sap.ui.model.json.JSONModel({object : {}}), "odata");
		this.getView().byId("gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel({object : {}}), "odata");
		var oTileContainer = this.getView().byId("gameInstanceTileContainer");
		oTileContainer.setEditable(false);
	},

	onTilePress : function(oEvent) {
		var gameInstanceId = oEvent.getSource().getProperty("number");
		RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/getPlayerUserMap/" + gameInstanceId, true, function(success) {
			var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameInstances.GameInstanceInfo", this);
			fragment.setModel(new sap.ui.model.json.JSONModel({list : success}));
			fragment.open();
			this.dialog = fragment;
		}.bind(this), function(error){});
	},
	
/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.GameInstances
*/
	onInit: function() {

		//RestAPIHelper.getAbsolute("/wlcp-gameserver/gameInstanceController/gameInstances/", true, this.getGameInstancesSuccess, this.getGameInstancesError, this);
		
		//TEMPORARY FIX TO STOP FLICKERING OF TILES!!
		//THE TILE CONTAINER CONTROL HAS BEEN DEPRECIATED
		//THIS NEED TO BE REWRITTEN

		sap.ui.core.UIComponent.getRouterFor(this).getRoute("RouteMainToolPage").attachPatternMatched(this.onRouteMatched, this);
		
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