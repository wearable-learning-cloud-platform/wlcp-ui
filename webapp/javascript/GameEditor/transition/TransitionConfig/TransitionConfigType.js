var TransitionConfigType = {
    SINGLE_BUTTON_PRESS : 0,
    SEQUENCE_BUTTON_PRESS : 1,
    KEYBOARD_INPUT : 2,
    TIMER : 3,
    RANDOM : 4,

    toString : function(transitionConfigType) {
        switch(transitionConfigType) {
            case this.SINGLE_BUTTON_PRESS:
                return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.singleButtonPress");
            case this.SEQUENCE_BUTTON_PRESS:
                return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.sequenceButtonPress");
            case this.KEYBOARD_INPUT:
                return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.keyboardInput");
            case this.TIMER:
                return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.timer");
            case this.RANDOM:
                return sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.random");
            default:
                break;
        }
    }
};