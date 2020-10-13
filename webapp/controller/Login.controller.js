sap.ui.controller("org.wlcp.wlcp-ui.controller.Login", {
	
	modelData : {
		username : "",
		password : "",
		newUser : {
			usernameId : "",
			password : "",
			firstName : "",
			lastName : "",
		}
	},
	
	model : new sap.ui.model.json.JSONModel(),
	
	userModelData : {
		username: ""
	},
	
	newUserModelData : {
		username: ""
	},
	
	userModel : new sap.ui.model.json.JSONModel(),
	newUserModel : new sap.ui.model.json.JSONModel(),
	
	onLoginPress: function() {
		this.userModelData.username = this.modelData.username.toLowerCase();
		this.userModel.setData(this.userModelData);
		sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteModeSelectionView");
	},
	
	validateLogin : function() {
		this.newUserModelData.username = this.modelData.username.toLowerCase();
		//this.newUserModelData.password = this.modelData.password;
		this.newUserModel.setData(this.newUserModelData);

		RestAPIHelper.post("/userController/userLogin", this.newUserModel.getData(), true, this.oDataSuccess, this.oDataError, this);
	},
	
	oDataSuccess : function(oData) {
		var usernameFound = false;
		
		if(oData!=null && oData == true) {
			
			this.onLoginPress();
			usernameFound = true;
			
		}
		
		if(!usernameFound) {
			sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("login.message.incorrectLogin"));
		}
	},
	
	oDataError : function(oData) {
		sap.m.MessageBox.error(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("login.message.validationError"));
	},
	
	registerNewUser : function() {
		
		//Create an instance of the dialog
		this.registerNewUserDialog = sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.RegisterNewUser", this);
		
		//Set the model for the dialog
		this.registerNewUserDialog.setModel(this.model);
		
		//Open the dialog
		this.registerNewUserDialog.open();
	},

	confirmRegisterNewUser : function() {
		var registerData = this.model.getData().newUser;
		
		//Convert the username to all lower case
		registerData.usernameId = registerData.usernameId.toLowerCase();

		//Populate the DTO
		var userRegistrationDto = {
			usernameId : registerData.usernameId,
			password : registerData.password,
			firstName : registerData.firstName,
			lastName : registerData.lastName
		}
		
		//If we get here we can register them
		RestAPIHelper.post("/registrationController/registerUser", userRegistrationDto, true, function(data) {
			this.cancelRegisterNewUser();
			sap.m.MessageBox.success(sap.ui.getCore().getModel("i18n").getResourceBundle().getText("register.message.success"));
		}, function(error) {
			//Let the default handler handle the error
		}, this);
	},
	
	cancelRegisterNewUser : function() {
		this.registerNewUserDialog.close();
		this.registerNewUserDialog.destroy();
	},

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf wlcpfrontend.views.Login
*/
	onInit: function() {
		
		//Set the data to the model
		this.model.setData(this.modelData);
		this.getView().setModel(this.model);
		
		this.userModel.setData(this.userModelData);
		sap.ui.getCore().setModel(this.userModel, "user");
		
		this.getView().addEventDelegate({
			  onAfterRendering: function(){

			  }
			}, this);
	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf wlcpfrontend.views.Login
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf wlcpfrontend.views.Login
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf wlcpfrontend.views.Login
*/
//	onExit: function() {
//
//	}

});