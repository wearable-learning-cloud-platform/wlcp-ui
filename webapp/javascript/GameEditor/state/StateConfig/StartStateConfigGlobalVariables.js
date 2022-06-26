var StartStateConfigGlobalVariables = class StartStateConfigGlobalVariables extends StateConfig {

	constructor(state) {
		super(state);
	}

	getNavigationListItem() {
		return {
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.startState.globalVariable"),
			icon : "sap-icon://globe"
		}
	}

	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.startState.globalVariable"),
			items : []
		}
	}

	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.StartStateGlobalVariableConfig", this);
	}

	addGlobalVariable(oEvent) {
		for(var i = 0; i < this.state.model.getData().navigationContainerPages.length; i++) {
			if(this.state.model.getData().navigationContainerPages[i].title === this.getNavigationContainerPage().title) {
				this.state.model.getData().navigationContainerPages[i].items.push({name : "", type : "", defaultValue : ""});
				this.state.model.refresh();
				return;
			}
		}
	}

	deleteGlobalVariable(oEvent) {
		for(var i = 0; i < this.state.model.getData().navigationContainerPages.length; i++) {
			if(this.state.model.getData().navigationContainerPages[i].title === this.getNavigationContainerPage().title) {
				for(var n = 0; n < this.state.model.getData().navigationContainerPages[i].items.length; n++) {
					if(this.state.model.getData().navigationContainerPages[i].items[n].name === oEvent.getSource().getParent().getCells()[0].getValue()) {
						this.state.model.getData().navigationContainerPages[i].items.splice(n, 1);
						this.state.model.refresh();
						return;
					}
				}
			}
		}
	}

	setLoadData(loadData) {
		for(var i = 0; i < this.state.model.getData().navigationContainerPages.length; i++) {
			if(this.state.model.getData().navigationContainerPages[i].title === this.getNavigationContainerPage().title) {
				this.state.model.getData().navigationContainerPages[i].items = loadData.globalVariables;
			}
		}
	}

	getSaveData() {
		for(var i = 0; i < this.state.model.getData().navigationContainerPages.length; i++) {
			if(this.state.model.getData().navigationContainerPages[i].title === this.getNavigationContainerPage().title) {
				return {
					globalVariables : this.state.model.getData().navigationContainerPages[i].items
				};
			}
		}
	}

}