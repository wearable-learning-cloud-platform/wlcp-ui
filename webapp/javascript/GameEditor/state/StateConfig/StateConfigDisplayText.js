var StateConfigDisplayText = class StateConfigDisplayText extends StateConfig {

	constructor(state) {
		super(state);
	}
	
	getNavigationListItem() {
		return {
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayText"),
			type : StateConfigType.DISPLAY_TEXT,
			icon : "sap-icon://discussion-2"
		}
	}
	
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayText"),
			type : StateConfigType.DISPLAY_TEXT,
			displayText : ""
		}
	}
	
	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStateDisplayTextConfig", this);
	}
	
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_TEXT) {
					if(iconTabs[i].navigationContainerPages[n].displayText != "") {
						activeScopes.push(iconTabs[i].scope);
					}
				}
			}
		}
		return activeScopes;
	}
	
	setLoadData(loadData) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var key in loadData.displayText) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_TEXT) {
							iconTabs[i].navigationContainerPages[n].displayText = loadData.displayText[key];
						}
					}
				}
			}
		}
	}
	
	getSaveData() {
		var outputStateData = {};
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_TEXT) {
					if(iconTabs[i].navigationContainerPages[n].displayText != "") {
						outputStateData[iconTabs[i].scope] = iconTabs[i].navigationContainerPages[n].displayText;
					}
				}
			}
		}
		return {
			displayText : outputStateData
		};
	}
}