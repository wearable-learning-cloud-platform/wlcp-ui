var StateConfigPlayVideo = class StateConfigPlayVideo extends StateConfig {
	
	constructor(state) {
		super(state);
		this.playVideoPage = null;
	}
	
	//side bar in configure window list of available states
	getNavigationListItem() {
		return {	
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playVideo"),
			icon : "sap-icon://video"	
		}
	}
	
	//return title of page
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.playVideo"),
			url : "",
		}
    }

    urlUpdated(oEvent) {
        this.onChange(oEvent);
    }
    
    handleUploadPress() {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
						this.playVideoPage = i;
						break;
					}
				}
			}
		}

		if(typeof this.oFileUploader === "undefined") {
			var oFileUploader = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems()[this.playVideoPage].getContent()[0].getContentAreas()[1].getPages()[3].getContent()[2].getItems()[0];
		    oFileUploader.setUploadUrl(ServerConfig.getServerAddress() + "/objectStoreController/uploadFile");
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name : "Authorization",
				value : "Bearer " + SessionHelper.getCookie("wlcp.userSession")
			}));
			oFileUploader.setSendXHR(true);
		}
		oFileUploader.checkFileReadable().then(function() {
			oFileUploader.upload();
		}, function(error) {
			MessageToast.show("Error reading file!");
		}).then(function() {
			oFileUploader.clear();
		});
	}

	handleUploadComplete(oEvent) {
		var sResponse = oEvent.getParameter("responseRaw");
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
						this.playVideoPage = iconTabs[i].navigationContainerPages[n];
						this.playVideoPage.url = ServerConfig.getServerAddress() + "/objectStoreController/files/" + sResponse;
                        this.state.model.setData(this.state.modelJSON);
                        this.urlUpdated(oEvent);
						break;
					}
				}
			}
		}
    }
	
	//put XML code here
	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStatePlayVideoConfig", this);
	}
	
	//returns verified scopes Team 1, Player 2, Game Wide ect
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].url != "") {
						activeScopes.push(iconTabs[i].scope);
					}
				}
			}
		}
		return activeScopes;
	}
	
	//not sure, loading previous data maybe?
	setLoadData(loadData) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var key in loadData.videoOutputs) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
							iconTabs[i].navigationContainerPages[n].url = loadData.videoOutputs[key].url;
							this.playVideoPage = iconTabs[i].navigationContainerPages[n];
						}
					}
					
				}
			}
		}
	}
	
	//when the user clicks accept?
	getSaveData() {
		var outputStateData = {};
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].title == this.getNavigationContainerPage().title) {
					if(iconTabs[i].navigationContainerPages[n].url != "") {
						outputStateData[iconTabs[i].scope] = {
							    url : iconTabs[i].navigationContainerPages[n].url,
							}
					}
				}
			}
		}
		return {
			videoOutputs : outputStateData
		};
	}
}