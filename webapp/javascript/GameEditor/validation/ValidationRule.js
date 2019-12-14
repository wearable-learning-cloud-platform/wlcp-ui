var ValidationRule = class ValidationRule {
	
	constructor() {
		
	}
	
	validate(connection) {
		
	}
	
	removeConnection(connection) {
		GameEditor.getJsPlumbInstance().deleteConnection(GameEditor.getJsPlumbInstance().getConnections({source:connection.connectionFrom,target:connection.connectionTo})[0], {fireEvent : false, force : true});
		if(GameEditor.getEditorController().connectionList.indexOf(connection) >= 0) {
			GameEditor.getEditorController().connectionList.splice(GameEditor.getEditorController().connectionList.indexOf(this), 1);
		}
	}
}