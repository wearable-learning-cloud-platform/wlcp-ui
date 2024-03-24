sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/dnd/DragInfo",
	"sap/ui/core/dnd/DropInfo",
	"sap/f/dnd/GridDropInfo",
	"sap/ui/core/library"
], function (Controller, JSONModel, DragInfo, DropInfo, GridDropInfo, coreLibrary) {
return sap.ui.controller("org.wlcp.wlcp-ui.controller.GameInstances", {

	switched : false,
	selectedGame : "",

	loadGameDialogModel : {
		privateGames : null,
		publicGames : null,
		assignPlayers : false,
		playerNames : [],
		teamPlayers : [],
		teamCount : 0,
		playerCount : 0,
		gameToLoad : "",
		gameToLoadDTO : null
	},
	
	onStartGameInstance : function() {
		RestAPIHelper.get("/gameController/getPrivateGames?usernameId=" + sap.ui.getCore().getModel("user").oData.username, false,
		function(data) {
			this.loadGameDialogModel.privateGames = data;
			RestAPIHelper.get("/gameController/getPublicGames", false,
			function(data) {
				this.loadGameDialogModel.publicGames = data;
				var fragment = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameInstances.StartGameInstance", this);
				fragment.setModel(new sap.ui.model.json.JSONModel(this.loadGameDialogModel));
				fragment.open();
				this.switched = false;
				this.selectedGame = "";
				this.dialog = fragment;
				this.attachDragAndDrop();
			}, 
			function(error) {
				//Allow default error handling
			}, this);
		}, 
		function(error) {
			//Allow default error handling
		}, this);
	},

	attachDragAndDrop: function () {
		var oList = sap.ui.getCore().byId("assignPlayerList");
		oList.addDragDropConfig(new sap.ui.core.dnd.DragInfo({
			sourceAggregation: "items"
		}));

		var oGrid = sap.ui.getCore().byId("playersToSelectFrom");
		oGrid.addDragDropConfig(new sap.f.dnd.GridDropInfo({
			targetAggregation: "items",
			dropPosition: sap.ui.core.dnd.DropPosition.On,
			dropLayout: sap.ui.core.dnd.DropLayout.Horizontal,
			dropIndicatorSize: this.onDropIndicatorSize.bind(this),
			drop: this.onDrop.bind(this)
		}));
	},

	onDrop: function (oInfo) {
		this.dialog.getModel().setProperty(oInfo.getParameters().droppedControl.getBindingContext().getPath() + "/state", "Success");
		this.dialog.getModel().setProperty(oInfo.getParameters().droppedControl.getBindingContext().getPath() + "/icon", "sap-icon://accept");
		this.dialog.getModel().setProperty(oInfo.getParameters().droppedControl.getBindingContext().getPath() + "/text", oInfo.getParameters().draggedControl.getTitle());
		this.dialog.getModel().setProperty(oInfo.getParameters().droppedControl.getBindingContext().getPath() + "/removeVisible", true);
		for(var i = 0; i < this.dialog.getModel().getData().playerNames.length; i++) {
			if(this.dialog.getModel().getData().playerNames[i].title === oInfo.getParameters().draggedControl.getTitle()) {
				this.dialog.getModel().getData().playerNames.splice(i, 1);
				break;
			}
		}
		this.dialog.getModel().setData(this.dialog.getModel().getData());
	},

	onDropIndicatorSize: function (oDraggedControl) {

	},

	assignName : function(oAction) {
		if(oAction.getSource().getParent().getItems()[0].getValue() === "") {
			sap.m.MessageBox.error("Name cannot be blank");
			return;
		}
		for(var i = 0; i < this.dialog.getModel().getData().playerNames.length; i++) {
			if(this.dialog.getModel().getData().playerNames[i].title === oAction.getSource().getParent().getItems()[0].getValue()) {
				oAction.getSource().getParent().getItems()[0].setValue("");
				sap.m.MessageBox.error("Name already exists");
				return;
			}
		}
		this.dialog.getModel().getData().playerNames.push({title:oAction.getSource().getParent().getItems()[0].getValue() });
		this.dialog.getModel().setData(this.dialog.getModel().getData());
		this.dialog.setModel(this.dialog.getModel());
		oAction.getSource().getParent().getItems()[0].setValue("");
	},

	deleteName : function(oAction) {
		for(var i = 0; i < this.dialog.getModel().getData().playerNames.length; i++) {
			if(oAction.getParameters().listItem.getTitle() === this.dialog.getModel().getData().playerNames[i].title) {
				this.dialog.getModel().getData().playerNames.splice(i, 1);
				this.dialog.getModel().setData(this.dialog.getModel().getData());
				this.dialog.setModel(this.dialog.getModel());
				return;
			}
		}
	},

	deletePlayerNameAssignment : function(oAction) {
		oAction.getSource().getParent().getItems()[0].setState("Error")
		oAction.getSource().getParent().getItems()[0].setText("No Name");
		oAction.getSource().getParent().getItems()[0].setIcon("sap-icon://error");
		oAction.getSource().getParent().getItems()[1].setVisible(false);
	},
	
	onAfterRenderingStartGameInstance : function () {
		var gameBinding = sap.ui.getCore().byId("gameInstanceGame").getBinding("items");
		gameBinding.filter([new sap.ui.model.Filter("Username", "EQ", sap.ui.getCore().getModel("user").oData.username)]);
		gameBinding.filter([new sap.ui.model.Filter("DataLog", "EQ", false)]);
	},

	handleWizardCancel : function(oEvent) {
		this.dialog.close();
		this.dialog.destroy();
	},

	handleWizardNextButton : function(oEvent) {
		var currentStep = sap.ui.getCore().byId("gameInstanceWizard").mAggregations._progressNavigator.getCurrentStep();
		switch(currentStep) {
			case 1:
				if(!this.checkForGameIdSelectionErrors()) {
					return;
				}
				this.loadGameDialogModel.teamCount = this.dialog.getModel().getProperty("/gameToLoadDTO/teamCount");
				this.loadGameDialogModel.playerCount = this.dialog.getModel().getProperty("/gameToLoadDTO/playerCount");
				this.loadGameDialogModel.teamPlayers = [];
				for(var teams = 0; teams < this.loadGameDialogModel.teamCount; teams++) {
					for(var players = 0; players < this.loadGameDialogModel.playerCount; players++) {
						this.loadGameDialogModel.teamPlayers.push({team : teams + 1, player : players + 1, text : "No Name", icon : "sap-icon://error", state : "Error", removeVisible : false});
					}
				}
				this.loadGameDialogModel.playerNames = [];
				for(var i = 0; i < this.loadGameDialogModel.teamCount * this.loadGameDialogModel.playerCount; i++) {
					this.loadGameDialogModel.playerNames.push({title:"Player " + (i + 1)});
				}
				this.dialog.setModel(new sap.ui.model.json.JSONModel(this.loadGameDialogModel));
				sap.ui.getCore().byId("wizardBackButton").setVisible(true);
				break;
			case 2:
				var teamPlayers = this.dialog.getModel().getProperty("/teamPlayers");
				for(var i = 0; i < teamPlayers.length; i++) {
					if(teamPlayers[i].state !== "Success" && this.switched) {
						sap.m.MessageBox.error("Assign Names to all Teams / Players!");
						return;
					}
				}
				sap.ui.getCore().byId("wizardStartGameButton").setVisible(true);
				sap.ui.getCore().byId("wizardBackButton").setVisible(true);
				sap.ui.getCore().byId("wizardNextButton").setVisible(false);
				break;
			default:
				break;
		}
		var wizard = sap.ui.getCore().byId("gameInstanceWizard");
		wizard.nextStep();
	},

	handleWizardBackButton : function(oEvent) {
		var currentStep = sap.ui.getCore().byId("gameInstanceWizard").mAggregations._progressNavigator.getCurrentStep();
		switch(currentStep) {
			case 2:
					sap.ui.getCore().byId("wizardBackButton").setVisible(false);
				break;
			case 3:
				sap.ui.getCore().byId("wizardStartGameButton").setVisible(false);
				sap.ui.getCore().byId("wizardNextButton").setVisible(true);
				break;
			default:
				break;
		}
		var wizard = sap.ui.getCore().byId("gameInstanceWizard");
		wizard.previousStep();
	},
	
	handleWizardSubmit : function(oEvent) {
		var playerNames = null;
		if(this.switched) {
			playerNames = {};
			for(var i = 0; i < this.dialog.getModel().getProperty("/teamPlayers").length; i++) {
				
				var path = "Team " + this.dialog.getModel().getProperty("/teamPlayers")[i].team + " Player " + this.dialog.getModel().getProperty("/teamPlayers")[i].player;
				playerNames[path] = this.dialog.getModel().getProperty("/teamPlayers")[i].text;
			}
		}
		RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/startGameInstance", {gameId : this.dialog.getModel().getProperty("/gameToLoad"), usernameId : sap.ui.getCore().getModel("user").oData.username, playerNames}, true, this.gameInstanceStarted, this.gameInstanceStartError, this);
	},

	checkForGameIdSelectionErrors : function() {
		if(this.selectedGame !== "") {
			for(var i = 0; i < this.loadGameDialogModel.publicGames.length; i++) {
				if(this.loadGameDialogModel.publicGames[i].gameId === this.selectedGame) {
					this.dialog.getModel().setProperty("/gameToLoad", this.selectedGame);
					this.loadGameDialogModel.gameToLoadDTO = this.loadGameDialogModel.publicGames[i];
					this.dialog.getModel().setProperty("/gameToLoadDTO", this.loadGameDialogModel.gameToLoadDTO);
					return true;
				}
			}
		} else {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.load.selectNoneError"));
			return false;
		}
	},

	switch : function(oEvent) {
		sap.ui.getCore().byId("assignSection").setVisible(oEvent.getParameters().state);
		this.switched = sap.ui.getCore().byId("assignSection").getVisible();
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
	
	gameInstanceStarted : function(response) {
		var gameInstances = this.getView().byId("gameInstanceTileContainer").getModel("odata").getProperty("/object");
		gameInstances.push(response);
		this.getView().byId("gameInstanceTileContainer").getModel("odata").setProperty("/object", gameInstances);
		this.handleWizardCancel();
		sap.m.MessageToast.show("Game Instance Start Successfully!");
	},
	
	gameInstanceStartError : function(response) {
		this.handleWizardCancel();
		sap.m.MessageToast.show(response.responseText);
	},
	
	stopGameInstance : function(oEvent) {
		if(oEvent == sap.m.MessageBox.Action.OK) {
			RestAPIHelper.postAbsolute("/wlcp-gameserver/gameInstanceController/stopGameInstance", {gameInstanceId : this.stopInstanceId}, true, this.gameInstanceStopped, this.gameInstanceStoppedError, this);
		}
	},
	
	gameInstanceStopped : function(response) {
		var gameInstances = this.getView().byId("gameInstanceTileContainer").getModel("odata").getProperty("/object");
		for(var i = 0; i < gameInstances.length; i++) {
			if(gameInstances[i].gameInstanceId === response.gameInstanceId) {
				gameInstances.splice(i, 1);
			}
		}
		this.getView().byId("gameInstanceTileContainer").getModel("odata").setProperty("/object", gameInstances);
		sap.m.MessageToast.show("Game Instance Stopped Successfully!");
	},
	
	gameInstanceStoppedError : function(response) {
		sap.m.MessageToast.show(response.responseText);
	},

	getGameInstancesSuccess : function(data) {
		this.getView().setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
		this.getView().byId("gameInstanceTileContainer").setModel(new sap.ui.model.json.JSONModel({object : data}), "odata");
	},

	onRouteMatched: function (oEvent) {
		this.getView().byId("gameInstanceTileContainer").setEditable(false);
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

	onCancelTilePress : function(oEvent) {
		this.dialog.close();
		this.dialog.destroy();
	},

	onSearch : function(oFilter) {
		sap.ui.getCore().byId("publicGames").getBinding("items").filter(new sap.ui.model.Filter("gameId", sap.ui.model.FilterOperator.StartsWith, oFilter.getParameters().newValue))
		sap.ui.getCore().byId("privateGames").getBinding("items").filter(new sap.ui.model.Filter("gameId", sap.ui.model.FilterOperator.StartsWith, oFilter.getParameters().newValue))
	},

	setExpansionGame : function(oEvent) {
		oEvent.getSource().setExpanded(!oEvent.getSource().getExpanded());
		this.selectedGame = "";
	},

	selectGame : function (oEvent) {
		this.selectedGame = oEvent.getParameters().item.getText();
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

})});