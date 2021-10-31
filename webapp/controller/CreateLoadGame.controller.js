sap.ui.controller("org.wlcp.wlcp-ui.controller.CreateLoadGame", {
	
	getMaxPlayer : function (max, teamCount) {
		return Math.floor(max / teamCount);
	},
		
	onPlayerChange: function (oEvent) {
		
		var playerCount = GameEditor.getEditorController().newGameModel.playersPerTeam;
		var teamCount = GameEditor.getEditorController().newGameModel.teamCount;
		
		var maxPlayerValue = this.getMaxPlayer(9, teamCount)
		if(playerCount > maxPlayerValue){
			GameEditor.getEditorController().newGameModel.playersPerTeam = playerCount - 1;
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team1") + teamCount + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team2")+ maxPlayerValue + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team3"));
		}
			
	},
			
	onTeamChange: function (oEvent) {
					
		var playerCount = GameEditor.getEditorController().newGameModel.playersPerTeam;
		var teamCount = GameEditor.getEditorController().newGameModel.teamCount;
			
		var maxPlayerValue = this.getMaxPlayer(9, teamCount)
		if(playerCount > maxPlayerValue){
			GameEditor.getEditorController().newGameModel.TeamCount = teamCount - 1;
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team1") + teamCount + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team2")+ maxPlayerValue + " " + sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.team3"));
		}
			
	},
	
	cancelCreateLoadGame : function() {
		sap.ui.getCore().byId("createLoadGame").close();
		sap.ui.getCore().byId("createLoadGame").destroy();
	},
	
	/**
	 * This is called when the create button is pressed on the Create Game Dialog.
	 * If it succeeds, createGameSuccess() will be called.
	 */
	createGame : function() {

		// Log BUTTON_PRESS event: create-new-game-button
		Logger.info("Create Game dialog: Create pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().newGameModel.gameId, 
				"create-new-game-button"
			)
		); 

		RestAPIHelper.post("/gameController/saveGame", {game : GameEditor.getEditorController().newGameModel, gameSave : {type : 0, description : "First Save"}}, true, this.createGameSuccess, this.createGameError, this);
	},
	
	loadGame : function() {
		if(this.selectedGame != null & this.selectedDetail == null) {
			GameEditor.getEditorController().gameModel.gameId = this.selectedGame;
			GameEditor.getEditorController().resetEditor();
			GameEditor.getEditorController().load();
		}
		if(this.selectedGame != null && this.selectedDetail != null) {
			GameEditor.getEditorController().gameModel.gameId = this.selectedGame;
			GameEditor.getEditorController().resetEditor();
			sap.ui.getCore().byId("container-wlcp-ui---gameEditor--saveButton").setEnabled(false);
			sap.ui.getCore().byId("container-wlcp-ui---gameEditor--runButton").setEnabled(false);
			sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").setEnabled(false);
			// for(var i = 1; i < sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").getMenu().getItems().length; i++) {
			// 	sap.ui.getCore().byId("container-wlcp-ui---gameEditor--optionsButton").getMenu().getItems()[i].setEnabled(false);
			// }
			GameEditor.getEditorController().loadArchivedGame(this.selectedDetail, this.type);
		}
		this.cancelLoadGame();
	},

	onSearch : function(oFilter) {
		sap.ui.getCore().byId("publicGames").getBinding("items").filter(new sap.ui.model.Filter("gameId", sap.ui.model.FilterOperator.StartsWith, oFilter.getParameters().newValue))
		sap.ui.getCore().byId("privateGames").getBinding("items").filter(new sap.ui.model.Filter("gameId", sap.ui.model.FilterOperator.StartsWith, oFilter.getParameters().newValue))
	},
	
	/**
	 * Called when the user wants to cancel creating a game.
	 * They will be returned to main editor screen with all controls disabled
	 * except for the main toolbar.
	 */
	cancelCreateGame : function(oEvent) {

		// Log BUTTON_PRESS event: cancel-new-game-button
		Logger.info("Create Game dialog: Cancel pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.GAME_EDITOR, 
				GameEditor.getEditorController().newGameModel.gameId, 
				"cancel-new-game-button"
			)
		); 

		sap.ui.getCore().byId("createGame").close();
		sap.ui.getCore().byId("createGame").destroy();
	},
	
	cancelLoadGame : function() {
		sap.ui.getCore().byId("loadGame").close();
		sap.ui.getCore().byId("loadGame").destroy();
	},
	
	/**
	 * Called if the game has been created in the back end successfully.
	 * The game editors or game managers model will be updated accordingly.
	 * The dialog will be closed and a success message shown.
	 */
	createGameSuccess : function(oSuccess) {
		GameEditor.getEditorController().resetEditor();
		if(GameEditor.getEditor() != null) {
			GameEditor.getEditorController().gameModel.gameId = oSuccess.gameId;
			GameEditor.getEditorController().gameModel.teamCount = oSuccess.teamCount;
			GameEditor.getEditorController().gameModel.playersPerTeam = oSuccess.playersPerTeam;
			GameEditor.getEditorController().gameModel.visibility = oSuccess.visibility;
			GameEditor.getEditorController().gameModel.stateIdCount = oSuccess.stateIdCount;
			GameEditor.getEditorController().gameModel.transitionIdCount = oSuccess.transitionIdCount;
			GameEditor.getEditorController().gameModel.connectionIdCount = oSuccess.connectionIdCount;
			GameEditor.getEditorController().gameModel.username.usernameId = oSuccess.username.usernameId;
			GameEditor.getEditorController().newGameModel.gameId = "";
			GameEditor.getEditorController().newGameModel.teamCount = 3;
			GameEditor.getEditorController().newGameModel.playersPerTeam = 3;
			GameEditor.getEditorController().newGameModel.visibility = true;
			GameEditor.getEditorController().newGameModel.stateIdCount = 0;
			GameEditor.getEditorController().newGameModel.transitionIdCount = 0;
			GameEditor.getEditorController().newGameModel.connectionIdCount = 0;
			GameEditor.getEditorController().initNewGame();
		}
		sap.ui.getCore().byId("createGame").close();
		sap.ui.getCore().byId("createGame").destroy();
		sap.m.MessageToast.show(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.messages.createSuccess"));
	},
	
	loadGameSuccess : function(oData) {
		GameEditor.getEditorController().resetEditor();
		GameEditor.getEditorController().gameModel.gameId = oData.results[0].gameId;
		GameEditor.getEditorController().gameModel.teamCount = oData.results[0].TeamCount;
		GameEditor.getEditorController().gameModel.playersPerTeam = oData.results[0].PlayersPerTeam;
		GameEditor.getEditorController().gameModel.visibility = oData.results[0].Visibility;
		GameEditor.getEditorController().gameModel.stateIdCount = oData.results[0].StateIdCount;
		GameEditor.getEditorController().gameModel.transitionIdCount = oData.results[0].TransitionIdCount;
		GameEditor.getEditorController().gameModel.connectionIdCount = oData.results[0].ConnectionIdCount;
		GameEditor.getEditorController().gameModel.usernameId = oData.results[0].Username;
		GameEditor.getEditorController().load();
	},
	
	loadGameError : function() {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.load.error"));
	},
	
	/**
	 * If an error occurs creating the game in the back end
	 * and error message will be shown.
	 */
	createGameError : function(oError) {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.create.error"));
	},

	selectGame : function (oEvent) {
		sap.ui.getCore().byId("load").setEnabled(true);
		sap.ui.getCore().byId("advance").setEnabled(true);
		this.selectedGame = oEvent.getParameters().item.getText();
		if(sap.ui.getCore().byId("gameLoadSplitter").getContentAreas()[1].getLayoutData().getProperty("size") === "50%"){
			this.showAdvance(oEvent);
		}
	},

	selectDetail : function(oEvent) {
		sap.ui.getCore().byId("load").setEnabled(true);
		sap.ui.getCore().byId("advance").setEnabled(true);
		this.selectedDetail = oEvent.getParameters().item.getKey().split(" ")[0];
		this.type = oEvent.getParameters().item.getKey().split(" ")[1];
	},

	setExpansionGame : function(oEvent) {
		oEvent.getSource().setExpanded(!oEvent.getSource().getExpanded());
		sap.ui.getCore().byId("load").setEnabled(false);
		sap.ui.getCore().byId("advance").setEnabled(false);
		this.selectedGame = null;
	},

	setExpansionDetail : function(oEvent) {
		oEvent.getSource().setExpanded(!oEvent.getSource().getExpanded());
		sap.ui.getCore().byId("load").setEnabled(false);
		sap.ui.getCore().byId("advance").setEnabled(false);
		this.selectedDetail = null;
		this.type = null;
	},

	showAdvance : function (oEvent) {
		if(sap.ui.getCore().byId("gameLoadSplitter").getContentAreas()[1].getLayoutData().getProperty("size") === "50%") {
			sap.ui.getCore().byId("advance").setText("Show Advance");
			sap.ui.getCore().byId("gameLoadSplitter").getContentAreas()[1].getLayoutData().setProperty("size", "0%");
			return;
		} else {
			sap.ui.getCore().byId("advance").setText("Hide Advance");
		}
		RestAPIHelper.get(
			"/gameController/getGameHistory?gameId=" + this.selectedGame + "&saveType=MANUAL", 
			false,

			function(data) {
				sap.ui.getCore().byId("gameLoadSplitter").getContentAreas()[1].getLayoutData().setProperty("size", "50%");
				oEvent.getSource().getModel().setProperty("/manualSaves", data);
			}, 

			function(error) {
				//Allow default error handling
			}, this
		);

		RestAPIHelper.get(
			"/gameController/getGameHistory?gameId=" + this.selectedGame + "&saveType=AUTO", 
			false,

			function(data) {
				sap.ui.getCore().byId("gameLoadSplitter").getContentAreas()[1].getLayoutData().setProperty("size", "50%");
				oEvent.getSource().getModel().setProperty("/autoSaves", data);
			}, 

			function(error) {
				//Allow default error handling
			}, this
		);
	},
});