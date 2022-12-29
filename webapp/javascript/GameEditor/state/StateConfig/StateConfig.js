var StateConfig = class StateConfig {

	constructor(state) {
		this.state = state;
		this.busyDialog = new sap.m.BusyDialog();
	}
	
	onChange(oEvent) {
		this.state.onChange(oEvent);
	}
	
	getNavigationListItem() {
		return {
			text : "",
			type : "",
			icon : ""
		}
	}
	
	getNavigationContainerPage() {
		return {
			title : "",
			type : ""
		}
	}
	
	getStateConfigFragment() {
		return null;
	}
	
	getActiveScopes() {
		return [];
	}
	
	setLoadData(loadData) {
		
	}
	
	getSaveData() {
		return {};
	}

	acceptStateConfig(oEvent) {

	}

	closeStateConfig(oEvent) {

	}

	scopeSelected(oEvent) {

	}

	stateConfigSelected(oEvent) {

	}

	testForNewOrOverwrite(oFileUploader, oEvent) {
		if(!this.urlExists()) {
			this.handleClear(oEvent, false);
			this.busyDialog.open();
			oFileUploader.upload();
			oFileUploader.clear();
		} else {
			this.overwriteMessageBox(oFileUploader, oEvent);
		}
	}

	urlExists() {
		var urlExists = false;
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == this.getNavigationListItem().type) {
						urlExists = iconTabs[i].navigationContainerPages[n].url !== "";
						break;
					}
				}
			}
		}
		return urlExists;
	}

	overwriteMessageBox(oFileUploader, oEvent) {
		sap.m.MessageBox.warning("Overwrite current file?", {
			actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
			emphasizedAction: sap.m.MessageBox.Action.OK,
			onClose: function (sAction) {
				this.busyDialog.open();
				if(sAction === sap.m.MessageBox.Action.OK) {
					this.handleClear(oEvent, false);
					oFileUploader.upload();
					oFileUploader.clear();
				} else if(sAction == sap.m.MessageBox.Action.CANCEL) {
					oFileUploader.clear();
					this.busyDialog.close();
				}
			}.bind(this)
		});
	}

	handleClear(oEvent, runOnChange=true) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == this.getNavigationListItem().type) {
						if(typeof this.sound !== "undefined") {
							this.stop();
							this.sound = undefined;
						}
						iconTabs[i].navigationContainerPages[n] = this.getNavigationContainerPage();
						break;
					}
				}
			}
		}
		this.state.model.setData(this.state.modelJSON);
		if(runOnChange) {
			this.onChange(oEvent);
		}
	}

}