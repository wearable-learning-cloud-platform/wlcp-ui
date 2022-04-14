var StateConfigDisplayPhoto = class StateConfigDisplayPhoto extends StateConfig {
	
	constructor(state) {
		super(state);
		this.displayPhotoPage = null;
	}
	
	//side bar in configure window list of available states
	getNavigationListItem() {
		return {	
			text : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayPhoto"),
			type : StateConfigType.DISPLAY_PHOTO,
			icon : "sap-icon://picture"	
		}
	}
	
	//return title of page
	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.outputState.displayPhoto"),
			type : StateConfigType.DISPLAY_PHOTO,
			url : "",
			scale : 50,
			scalingString : "50%",
			height : 0,
			width : 0
		}
	}
	
	updateScalingString(oEvent) {
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
						this.displayPhotoPage = iconTabs[i].navigationContainerPages[n];
						var img = new Image();
						img.addEventListener("load", $.proxy(function() {
							this.displayPhotoPage.height = img.naturalHeight * (this.displayPhotoPage.scale/100);
							this.displayPhotoPage.width = img.naturalWidth * (this.displayPhotoPage.scale/100);
							this.state.model.setData(this.state.modelJSON);
						}, this));
						img.src = iconTabs[i].navigationContainerPages[n].url;
					}
				}
			}
		}
		this.onChange(oEvent);
	}

	handleUploadPress() {
		var oFileUploader = null;
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			if(iconTabs[i].scope == sap.ui.getCore().byId("outputStateDialogIconTabBar").getSelectedKey()) {
				for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
						oFileUploader = sap.ui.getCore().byId("outputStateDialogIconTabBar").getItems()[i].getContent()[0].getContentAreas()[1].getPages()[1].getContent()[2].getItems()[0];
						break;
					}
				}
			}
		}

		oFileUploader.setUploadUrl(ServerConfig.getServerAddress() + "/objectStoreController/uploadFile");
		if(oFileUploader.getHeaderParameters().length == 0) {
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name : "Authorization",
				value : "Bearer " + SessionHelper.getCookie("wlcp.userSession")
			}));
		}
		oFileUploader.setSendXHR(true);

		oFileUploader.checkFileReadable().then(function() {
			this.busyDialog.open();
			oFileUploader.upload();
		}.bind(this), function(error) {
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
					if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
						this.displayPhotoPage = iconTabs[i].navigationContainerPages[n];
						this.displayPhotoPage.url = ServerConfig.getServerAddress() + "/objectStoreController/files/" + sResponse;
						this.state.model.setData(this.state.modelJSON);
						this.updateScalingString();
						break;
					}
				}
			}
		}
		this.busyDialog.close();
	}
	
	//put XML code here
	getStateConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.States.OutputStateDisplayPhotoConfig", this);
	}
	
	
	//returns verified scopes Team 1, Player 2, Game Wide ect
	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.state.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
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
		for(var key in loadData.pictureOutputs) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
							iconTabs[i].navigationContainerPages[n].url = loadData.pictureOutputs[key].url;
							iconTabs[i].navigationContainerPages[n].scale = loadData.pictureOutputs[key].scale;
							this.displayPhotoPage = iconTabs[i].navigationContainerPages[n];
							var img = new Image();
							img.addEventListener("load", $.proxy(function() {
								this.displayPhotoPage.height = img.naturalHeight * (this.displayPhotoPage.scale/100);
								this.displayPhotoPage.width = img.naturalWidth * (this.displayPhotoPage.scale/100);
								this.state.model.setData(this.state.modelJSON);
							}, this));
							img.src = iconTabs[i].navigationContainerPages[n].url;
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
				if(iconTabs[i].navigationContainerPages[n].type == StateConfigType.DISPLAY_PHOTO) {
					if(iconTabs[i].navigationContainerPages[n].url != "") {
						outputStateData[iconTabs[i].scope] = {
							    url : iconTabs[i].navigationContainerPages[n].url,
							    scale : iconTabs[i].navigationContainerPages[n].scale
							}
					}
				}
			}
		}
		return {
			pictureOutputs : outputStateData
		};
	}
}