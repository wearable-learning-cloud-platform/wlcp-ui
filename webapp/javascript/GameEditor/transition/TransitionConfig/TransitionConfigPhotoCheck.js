/**
 * Photo Check transition config. The creator pastes a Teachable Machine shareable link, loads the
 * model's class names, picks the class that counts as a match and how sure the model must be.
 * One setting per scope, like the timer. Saved as transition.photoChecks[scope] =
 * {modelUrl, targetClass, threshold} with threshold 0..1; an empty targetClass is the
 * "any other photo" branch.
 */
var TransitionConfigPhotoCheck = class TransitionConfigPhotoCheck extends TransitionConfig {

	constructor(transition) {
		super(transition);
	}

	static isPageActive(page) {
		return page.modelUrl !== "" && (page.anyOther || page.targetClass !== "");
	}

	getNavigationListItem() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.photoCheck"),
			type : TransitionConfigType.PHOTO_CHECK,
			icon : "sap-icon://camera",
			selected : false,
			visible : true
		}
	}

	getNavigationContainerPage() {
		return {
			title : sap.ui.getCore().getModel("i18n").getResourceBundle().getText("gameEditor.inputTransition.photoCheck"),
			type : TransitionConfigType.PHOTO_CHECK,
			modelUrl : "",
			targetClass : "",
			thresholdPercent : 80,
			anyOther : false,
			classNames : [],
			loadStatus : ""
		}
	}

	getTransitionConfigFragment() {
		return sap.ui.xmlfragment("org.wlcp.wlcp-ui.fragment.GameEditor.Transitions.InputTransitionPhotoCheckConfig", this);
	}

	getActiveScopes() {
		var activeScopes = [];
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				var page = iconTabs[i].navigationContainerPages[n];
				if(page.type == TransitionConfigType.PHOTO_CHECK && TransitionConfigPhotoCheck.isPageActive(page)) {
					activeScopes.push(iconTabs[i].scope);
				}
			}
		}
		return activeScopes;
	}

	getFullyActiveScopes(neighborTransitions) {
		return [];
	}

	setLoadData(loadData) {
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var key in loadData.photoChecks) {
			for(var i = 0; i < iconTabs.length; i++) {
				if(key == iconTabs[i].scope) {
					for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
						var page = iconTabs[i].navigationContainerPages[n];
						if(page.type == TransitionConfigType.PHOTO_CHECK) {
							var saved = loadData.photoChecks[key];
							page.modelUrl = saved.modelUrl || "";
							page.targetClass = saved.targetClass || "";
							page.anyOther = page.targetClass === "";
							// The no-match branch is saved with threshold 0; show the default so unticking the box leaves a sane value.
							page.thresholdPercent = page.anyOther || saved.threshold === null || saved.threshold === undefined ? 80 : Math.round(saved.threshold * 100);
							// Show the saved class in the dropdown before the model is fetched again.
							page.classNames = page.targetClass !== "" ? [{name : page.targetClass}] : [];
						}
					}
				}
			}
		}
	}

	getSaveData() {
		var photoChecks = {};
		var iconTabs = this.transition.modelJSON.iconTabs;
		for(var i = 0; i < iconTabs.length; i++) {
			for(var n = 0; n < iconTabs[i].navigationContainerPages.length; n++) {
				var page = iconTabs[i].navigationContainerPages[n];
				if(page.type == TransitionConfigType.PHOTO_CHECK && TransitionConfigPhotoCheck.isPageActive(page)) {
					photoChecks[iconTabs[i].scope] = {
						modelUrl : page.modelUrl.trim(),
						targetClass : page.anyOther ? "" : page.targetClass,
						threshold : page.anyOther ? 0 : page.thresholdPercent / 100
					}
				}
			}
		}
		return {
			photoChecks : photoChecks
		};
	}

	/** Reads metadata.json from the pasted link and fills the class dropdown. Runs in the creator's browser. */
	loadClasses(oEvent) {
		var path = oEvent.getSource().getBindingContext().getPath();
		var model = this.transition.model;
		var page = model.getProperty(path);
		var base = (page.modelUrl || "").trim();
		if(base === "") { return; }
		if(!base.endsWith("/")) { base += "/"; }
		var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
		model.setProperty(path + "/loadStatus", bundle.getText("gameEditor.inputTransition.photoCheck.loading"));
		var that = this;
		fetch(base + "metadata.json").then(function(response) {
			if(!response.ok) { throw new Error("HTTP " + response.status); }
			return response.json();
		}).then(function(metadata) {
			if(!metadata || !Array.isArray(metadata.labels) || metadata.labels.length === 0) { throw new Error("no labels"); }
			var names = metadata.labels.map(function(label) { return {name : label}; });
			model.setProperty(path + "/modelUrl", base);
			model.setProperty(path + "/classNames", names);
			if(metadata.labels.indexOf(model.getProperty(path + "/targetClass")) === -1) {
				model.setProperty(path + "/targetClass", metadata.labels[0]);
			}
			var defaultNames = metadata.labels.every(function(label) { return /^Class \d+$/.test(label); });
			model.setProperty(path + "/loadStatus", bundle.getText(defaultNames ? "gameEditor.inputTransition.photoCheck.defaultNames" : "gameEditor.inputTransition.photoCheck.loaded"));
			that.onChange();
		}).catch(function(e) {
			Logger.error("Photo check: could not load model metadata: " + e.message);
			model.setProperty(path + "/classNames", []);
			model.setProperty(path + "/loadStatus", bundle.getText("gameEditor.inputTransition.photoCheck.loadFailed"));
			that.onChange();
		});
	}

	onModelUrlChange(oEvent) {
		// A new link invalidates the class list until it is loaded again.
		var path = oEvent.getSource().getBindingContext().getPath();
		this.transition.model.setProperty(path + "/classNames", []);
		this.transition.model.setProperty(path + "/loadStatus", "");
		this.onChange(oEvent);
	}
}
