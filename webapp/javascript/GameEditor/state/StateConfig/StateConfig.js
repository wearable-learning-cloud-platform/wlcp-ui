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
}