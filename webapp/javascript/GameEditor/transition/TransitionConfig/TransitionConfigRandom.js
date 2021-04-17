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
	
	validate(transition) {
		
		var state = transition.connection.connectionFrom;

		var scopeCollection = [];

		for(var i = 0; i < transition.modelJSON.iconTabs.length; i++) {
			for(var n = 0; n < transition.modelJSON.iconTabs[i].navigationContainerPages.length; n++) {
				if(transition.modelJSON.iconTabs[i].navigationContainerPages[n].title == "Random") {
					scopeCollection.push({scope : transition.modelJSON.iconTabs[i].scope, randomEnabled : transition.modelJSON.iconTabs[i].navigationContainerPages[n].randomEnabled});
				}
			}
		}
		
		for(var i = 0; i < state.outputConnections.length; i++) {
			if(state.outputConnections[i].transition != null && transition.overlayId != state.outputConnections[i].transition.overlayId) {
				for(var n = 0; n < state.outputConnections[i].transition.modelJSON.iconTabs.length; n++) {
					for(var j = 0; j < scopeCollection.length; j++) {
						if(state.outputConnections[i].transition.modelJSON.iconTabs[n].scope == scopeCollection[j].scope) {
							for(var k = 0; k < state.outputConnections[i].transition.modelJSON.iconTabs[n].navigationContainerPages.length; k++) {
								if(state.outputConnections[i].transition.modelJSON.iconTabs[n].navigationContainerPages[k].title == "Random") {
									if(state.outputConnections[i].transition.modelJSON.iconTabs[n].navigationContainerPages[k].randomEnabled && !scopeCollection[j].randomEnabled) {
										scopeCollection[j].randomEnabled = true;
										transition.modelJSON.iconTabs[n].navigationContainerPages[k].randomEnabled = scopeCollection[j].randomEnabled;
										this.setScopeData(transition, transition.modelJSON.iconTabs[n]);
									}
									state.outputConnections[i].transition.modelJSON.iconTabs[n].navigationContainerPages[k].randomEnabled = scopeCollection[j].randomEnabled
									this.setScopeData(state.outputConnections[i].transition, state.outputConnections[i].transition.modelJSON.iconTabs[n]);
								}
							}
						}
					}
				}
			}
		}

		transition.validationRules[0].validate(transition);
	}

	setScopeData(transition, model) {
		for(var i = 0; i < transition.modelJSON.iconTabs.length; i++) {
			if(transition.modelJSON.iconTabs[i].scope == model.scope) {
				transition.modelJSON.iconTabs[i] = model;
				transition.model.setData(transition.modelJSON);
				break;
			}
		}
	}
}