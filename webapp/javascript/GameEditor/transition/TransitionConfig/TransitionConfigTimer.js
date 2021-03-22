var TransitionConfigTimer = class TransitionConfigTimer extends TransitionConfig {

    constructor(transition) {
		super(transition);
    }
    
    getNavigationListItem() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer"),
			icon : "sap-icon://fob-watch",
			selected : false,
			visible : true
		}
	}
	
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer"),
			duration : 0
		}
	}
	
	getTransitionConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransitionTimerConfig", this);
	}

	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer")) {
					if(iconTabs[i].navigationContainerPages[n].duration > 0) {
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
		for(var i = 0; i < neighborTransitions.length; i++) {
			if(this.transition.overlayId != neighborTransitions[i].overlayId) {
				for(var n = 0; n < neighborTransitions[i].modelJSON.iconTabs.length; n++) {
					scopeCollection.push({transition : neighborTransitions[i], model : neighborTransitions[i].modelJSON.iconTabs[n]});
				}
			}
		}
		for(var i = 0; i < scopeCollection.length; i++) {
			for(var n = 0; n < scopeCollection.length; n++) {
				if((scopeCollection[i].model.scope == scopeCollection[n].model.scope) && !activeScopes.includes(scopeCollection[i].model.scope)) {
					for(var j = 0; j < scopeCollection[i].model.navigationContainerPages.length; j++) {
						if(scopeCollection[i].model.navigationContainerPages[j].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer")) {
							if(scopeCollection[i].model.navigationContainerPages[j].duration > 0) {
								activeScopes.push(scopeCollection[i].model.scope);
							}
						}
					}
				}
			}
		}
		return activeScopes;
	}

	setLoadData(loadData) {
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var key in loadData.timerDurations) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer")) {
							iconTabs[i].navigationContainerPages[n].duration = loadData.timerDurations[key].duration;
						}
					}
				}
			}
		}
	}
	
	getSaveData() {
		var timerDurations = {};
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer")) {
					if(iconTabs[i].navigationContainerPages[n].duration > 0) {
						timerDurations[iconTabs[i].scope] = {
							duration : iconTabs[i].navigationContainerPages[n].duration
						}
					}
				}
			}
		}
		return {
			timerDurations : timerDurations
		};
	}
}