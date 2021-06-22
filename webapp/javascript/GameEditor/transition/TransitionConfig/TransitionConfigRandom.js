var TransitionConfigRandom = class TransitionConfigRandom extends TransitionConfig {

    constructor(transition) {
		super(transition);
		this.validationRules.push(new RandomTransitionValidationRule());
    }
    
    getNavigationListItem() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random"),
			icon : "sap-icon://combine",
			selected : false,
			visible : true
		}
	}
	
	getNavigationContainerPage() {
		return {
            title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random"),
            randomEnabled : false
		}
	}
	
	getTransitionConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransitionRandomConfig", this);
	}

	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random")) {
					if(iconTabs[i].navigationContainerPages[n].randomEnabled == true) {
						activeScopes.push(iconTabs[i].scope);
					}
				}
			}
		}
		return activeScopes;
	}

	getFullyActiveScopes(neighborTransitions) {
		var scopeCollection = [];
		var activeScopes = [];
		return activeScopes;
	}

	setLoadData(loadData) {
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var key in loadData.randoms) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random")) {
							iconTabs[i].navigationContainerPages[n].randomEnabled = loadData.randoms[key].randomEnabled;
						}
					}
				}
			}
		}
	}
	
	getSaveData() {
		var randoms = {};
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random")) {
					if(iconTabs[i].navigationContainerPages[n].randomEnabled) {
						randoms[iconTabs[i].scope] = {
							randomEnabled : iconTabs[i].navigationContainerPages[n].randomEnabled
						}
					}
				}
			}
		}
		return {
			randoms : randoms
		};
	}
}

var RandomTransitionValidationRule = class RandomTransitionValidationRule extends ValidationRule {
	
	validate(transition, updateNeighborTransitions, dialogOnChange) {

		var scopeCollection = [];

		//Get a list of scope vs random enabled for this transition
		for(var i = 0; i < transition.modelJSON.iconTabs.length; i++) {
			for(var n = 0; n < transition.modelJSON.iconTabs[i].navigationContainerPages.length; n++) {
				if(transition.modelJSON.iconTabs[i].navigationContainerPages[n].title == "Random") {
					scopeCollection.push({scope : transition.modelJSON.iconTabs[i].scope, randomEnabled : transition.modelJSON.iconTabs[i].navigationContainerPages[n].randomEnabled});
				}
			}
		}

		var transitionList = [];
		
		//Get a list of neighbor connections
		var neighborConnections = GameEditor.getJsPlumbInstance().getConnections({source : transition.connection.connectionFrom.htmlId});
		
		//Loop through the neighbor connections
		for(var i = 0; i < neighborConnections.length; i++) {
			for(var n = 0; n < GameEditor.getEditorController().transitionList.length; n++) {
				if(neighborConnections[i].id == GameEditor.getEditorController().transitionList[n].connection.connectionId && neighborConnections[i].id !== transition.connection.connectionId) {
					transitionList.push(GameEditor.getEditorController().transitionList[n]);
				}
			}
		}

		//If the change is being made from the dialog set all scopes the same
		//If the change is being made from a new transition placement set this transition to the same
		for(var i = 0; i < transitionList.length; i++) {
			var scopes = transitionList[i].modelJSON.iconTabs;
			for(var n = 0; n < scopes.length; n++) {
				for(var j = 0; j < scopeCollection.length; j++) {
					if(scopes[n].scope == scopeCollection[j].scope) {
						var transitionTypes = transitionList[i].modelJSON.iconTabs[n].navigationContainerPages;
						for(var k = 0; k < transitionTypes.length; k++) {
							if(transitionTypes[k].title === "Random") {
								if(transitionTypes[k].randomEnabled && !scopeCollection[j].randomEnabled && !dialogOnChange) {
									for(var l = 0; l < transition.modelJSON.iconTabs.length; l++) {
										if(transition.modelJSON.iconTabs[l].scope == scopes[n].scope) {
											for(var m = 0; m < transition.modelJSON.iconTabs[l].navigationContainerPages.length; m++) {
												if(transition.modelJSON.iconTabs[l].navigationContainerPages[m].title == "Random") {
													transition.modelJSON.iconTabs[l].navigationContainerPages[m].randomEnabled = transitionTypes[k].randomEnabled;
													if(transition.modelJSON.iconTabs[l].navigationContainerPages[m].randomEnabled) {
														transition.modelJSON.iconTabs[l].activeTransition = "Random";
													}
												}
											}
										}
									}
								} else {
									transitionTypes[k].randomEnabled = scopeCollection[j].randomEnabled;
									if(transitionTypes[k].randomEnabled) {
										transitionList[i].modelJSON.iconTabs[n].activeTransition = "Random";
									}
								}
							}
						}
					}
				}
			}
			transitionList[i].model.setData(transitionList[i].modelJSON);
		}
		
		transition.transitionConfigs[0].validationRules[0].validate(transition);
	}
}