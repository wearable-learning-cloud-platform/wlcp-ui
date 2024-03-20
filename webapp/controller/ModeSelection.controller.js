sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function(Controller, JSONModel) {
"use strict";

return Controller.extend("org.wlcp.wlcp-ui.controller.ModeSelection", {

    onInit : function () {
        this.getView().setModel(sap.ui.getCore().getModel("user"), "user");
    },

    navigateToGameManager : function() {

        // Navigate to the game manager
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteMainToolPage");

        // Log BUTTON_PRESS event: button-mode-selection-navigate-to-game-manager
		Logger.info("Button Press Mode Selection: Navigate to game manager tile pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.MODE_SELECTION, 
				null, 
				"button-mode-selection-navigate-to-game-manager"
			)
        );
        
    },

    navigateToGameEditor : function() {

        // Navigate to the game editor
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteGameEditorView");

        // Log BUTTON_PRESS event: button-mode-selection-navigate-to-game-editor
		Logger.info("Button Press Mode Selection: Navigate to game editor tile pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.MODE_SELECTION, 
				null, 
				"button-mode-selection-navigate-to-game-editor"
			)
        );

    },

    navigateToGamePlayer : function() {

        // Navigate to the game player
        sap.ui.core.UIComponent.getRouterFor(this).navTo("RouteVirtualDeviceView", {
            username : sap.ui.getCore().getModel("user").oData.username,
            gameInstanceId : 0,
            debugMode : false
        });

        // Log BUTTON_PRESS event: button-mode-selection-navigate-to-game-player
		Logger.info("Button Press Mode Selection: Navigate to game player tile pressed");
		MetricsHelper.saveLogEvent(
			MetricsHelper.createButtonPayload(
				MetricsHelper.LogEventType.BUTTON_PRESS, 
				MetricsHelper.LogContext.MODE_SELECTION, 
				null, 
				"button-mode-selection-navigate-to-game-player"
			)
        );

    },

    logout() {

        RestAPIHelper.get("/logout", true, function() {

            // Log BUTTON_PRESS event: button-mode-selection-logout-success
            Logger.info("Button Press Mode Selection: Logout pressed and successful");
            MetricsHelper.saveLogEvent(
                MetricsHelper.createButtonPayload(
                    MetricsHelper.LogEventType.BUTTON_PRESS, 
                    MetricsHelper.LogContext.MODE_SELECTION, 
                    null, 
                    "button-mode-selection-logout-success"
                )

            );

            // Reload the page
            location.reload();

        }, function() {

            // Log BUTTON_PRESS event: button-mode-selection-logout-error
            Logger.info("Button Press Mode Selection: Logout pressed and error");
            MetricsHelper.saveLogEvent(
                MetricsHelper.createButtonPayload(
                    MetricsHelper.LogEventType.BUTTON_PRESS, 
                    MetricsHelper.LogContext.MODE_SELECTION, 
                    null, 
                    "button-mode-selection-logout-error"
                )

            );   
        });

    },

    help() {

        // Show some info about the platform
        new sap.m.MessageBox.information("Please see more at http://www.wearablelearning.org/");

         // Log BUTTON_PRESS event: button-mode-selection-about-pressed
        Logger.info("Button Press Mode Selection : About pressed");
        MetricsHelper.saveLogEvent(
            MetricsHelper.createButtonPayload(
                MetricsHelper.LogEventType.BUTTON_PRESS, 
                MetricsHelper.LogContext.MODE_SELECTION, 
                null, 
                "button-mode-selection-about-pressed"
            )

        );

    }
});

});