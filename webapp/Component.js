sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"org/wlcp/wlcp-ui/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("org.wlcp.wlcp-ui.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// set the i18n model
			sap.ui.getCore().setModel(new sap.ui.model.resource.ResourceModel({bundleName : "org.wlcp.wlcp-ui.i18n.i18n"}), "i18n");
	
			// load external resources such as JavaScript
			this.loadExternalResources();
		},

		loadExternalResources : function() {

			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-core');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-widget');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-mouse');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-droppable');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-draggable');
			jQuery.sap.require('sap.ui.thirdparty.jqueryui.jquery-ui-sortable');
			jQuery.sap.require("sap.m.MessageBox");

			sap.ui.localResources("javascript");

			jQuery.sap.require("javascript/GameEditor/state/State");
			jQuery.sap.require("javascript/GameEditor/state/StartState");
			jQuery.sap.require("javascript/GameEditor/state/OutputState");
			
			jQuery.sap.require("javascript/GameEditor/transition/Transition");
			jQuery.sap.require("javascript/GameEditor/transition/InputTransition");
			
			jQuery.sap.require("javascript/GameEditor/connection/Connection");
			
			jQuery.sap.require("javascript/GameEditor/validation/ValidationEngine/ValidationEngineHelpers");
			
			jQuery.sap.require("javascript/GameEditor/validation/ValidationRule");
			jQuery.sap.require("javascript/GameEditor/validation/ConnectionValidationRules");
			jQuery.sap.require("javascript/GameEditor/validation/StateValidationRules");
			jQuery.sap.require("javascript/GameEditor/validation/TransitionValidationRules");
			
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfig");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigDisplayText");
			jQuery.sap.require("javascript/GameEditor/state/StateConfig/StateConfigDisplayPhoto");
			
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfig");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigSingleButtonPress");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigSequenceButtonPress");
			jQuery.sap.require("javascript/GameEditor/transition/TransitionConfig/TransitionConfigKeyboardInput");
			
			jQuery.sap.require("javascript/GameEditor/GameEditor");
			jQuery.sap.require("javascript/ServerConfig");
			jQuery.sap.require("javascript/DataLogger");
			
			jQuery.sap.require("javascript/jsplumb");
			jQuery.sap.require("javascript/path-data-polyfill");
			jQuery.sap.require("javascript/stomp");
		}
	});
});
