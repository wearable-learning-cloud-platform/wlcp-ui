/**
 * Photo check support for the Virtual Device (game player).
 *
 * Loads TensorFlow.js and the Teachable Machine image library on first use, keeps one loaded
 * model per model URL, and scores a photo file against a model. Everything runs in the phone's
 * browser; only class scores leave the device.
 *
 * Libraries come from jsDelivr, the same source as the snippet Teachable Machine gives on export.
 * Versions are pinned. The wasm backend is used with cpu as the fallback, never webgl, because
 * the first webgl prediction on a phone took over 10 s in testing while wasm took under 100 ms.
 */
var PhotoCheckHelper = {

	TFJS_VERSION : "4.22.0",
	TM_IMAGE_VERSION : "0.8.5",
	MAX_IMAGE_SIDE : 1024,
	PREVIEW_SIDE : 320,

	librariesPromise : null,
	models : {},

	cdn : function(pkg, version, file) {
		return "https://cdn.jsdelivr.net/npm/" + pkg + "@" + version + "/" + file;
	},

	loadScript : function(url) {
		return new Promise(function(resolve, reject) {
			var existing = document.querySelector('script[src="' + url + '"]');
			if(existing && existing.dataset.loaded === "true") { resolve(); return; }
			var script = existing || document.createElement("script");
			script.addEventListener("load", function() { script.dataset.loaded = "true"; resolve(); });
			script.addEventListener("error", function() { reject(new Error("Could not load " + url)); });
			if(!existing) {
				script.src = url;
				script.async = true;
				document.head.appendChild(script);
			}
		});
	},

	/** Loads tf, the wasm backend and tmImage once. Resolves when a backend is ready. */
	loadLibraries : function() {
		if(this.librariesPromise === null) {
			var that = this;
			this.librariesPromise = (async function() {
				var t0 = performance.now();
				await that.loadScript(that.cdn("@tensorflow/tfjs", that.TFJS_VERSION, "dist/tf.min.js"));
				await that.loadScript(that.cdn("@tensorflow/tfjs-backend-wasm", that.TFJS_VERSION, "dist/tf-backend-wasm.min.js"));
				await that.loadScript(that.cdn("@teachablemachine/image", that.TM_IMAGE_VERSION, "dist/teachablemachine-image.min.js"));
				if(typeof tf === "undefined" || typeof tmImage === "undefined") {
					throw new Error("TensorFlow.js or the Teachable Machine library did not define its global");
				}
				try {
					tf.wasm.setWasmPaths(that.cdn("@tensorflow/tfjs-backend-wasm", that.TFJS_VERSION, "dist/"));
					await tf.setBackend("wasm");
				} catch(e) {
					Logger.error("wasm backend unavailable, using cpu: " + e.message);
					await tf.setBackend("cpu");
				}
				await tf.ready();
				Logger.info("PhotoCheck libraries ready in " + Math.round(performance.now() - t0) + " ms, TF.js " + tf.version.tfjs + " backend " + tf.getBackend());
			})().catch(function(e) {
				that.librariesPromise = null;
				throw e;
			});
		}
		return this.librariesPromise;
	},

	baseUrl : function(url) {
		url = (url || "").trim();
		return url.endsWith("/") ? url : url + "/";
	},

	/** Loads (or returns the cached) Teachable Machine model at url. Also runs one warm-up prediction. */
	loadModel : function(url) {
		var base = this.baseUrl(url);
		if(!this.models[base]) {
			var that = this;
			this.models[base] = (async function() {
				await that.loadLibraries();
				var t0 = performance.now();
				var model = await tmImage.load(base + "model.json", base + "metadata.json");
				var blank = document.createElement("canvas");
				blank.width = blank.height = 224;
				await model.predict(blank);
				Logger.info("PhotoCheck model " + base + " loaded in " + Math.round(performance.now() - t0) + " ms, classes: " + model.getClassLabels().join(", "));
				return model;
			})().catch(function(e) {
				delete that.models[base];
				throw e;
			});
		}
		return this.models[base];
	},

	/** Draws an image to a canvas no larger than maxSide so scoring does not depend on page layout. */
	toCanvas : function(img, maxSide) {
		var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
		var canvas = document.createElement("canvas");
		canvas.width = Math.round(img.naturalWidth * scale);
		canvas.height = Math.round(img.naturalHeight * scale);
		canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas;
	},

	/**
	 * Draws the center square of an image. Teachable Machine scores only this part of a photo, so this is
	 * what to show the player as what the model saw.
	 */
	toCenterSquare : function(img, side) {
		var crop = Math.min(img.naturalWidth, img.naturalHeight);
		var canvas = document.createElement("canvas");
		canvas.width = canvas.height = side;
		canvas.getContext("2d").drawImage(img, (img.naturalWidth - crop) / 2, (img.naturalHeight - crop) / 2, crop, crop, 0, 0, side, side);
		return canvas;
	},

	/**
	 * Scores one photo file with a loaded model.
	 * Resolves to { scores : {className : probability}, previewDataUrl, ms }.
	 */
	scoreFile : async function(model, file) {
		var objectUrl = URL.createObjectURL(file);
		try {
			var img = new Image();
			img.src = objectUrl;
			await img.decode();
			var canvas = this.toCanvas(img, this.MAX_IMAGE_SIDE);
			var t0 = performance.now();
			var predictions = await model.predict(canvas);
			var ms = Math.round(performance.now() - t0);
			var scores = {};
			for(var i = 0; i < predictions.length; i++) {
				scores[predictions[i].className] = Number(predictions[i].probability.toFixed(4));
			}
			var preview = this.toCenterSquare(img, this.PREVIEW_SIDE).toDataURL("image/jpeg", 0.7);
			return {scores : scores, previewDataUrl : preview, ms : ms};
		} finally {
			URL.revokeObjectURL(objectUrl);
		}
	},

	/** The target class names of a rule, without the empty "any other photo" entry. */
	targetsOf : function(targetClasses) {
		return (targetClasses || []).filter(function(name) { return name; });
	},

	/** Target classes the model does not have, for example after it was retrained with new names. */
	missingClasses : function(model, targets) {
		var labels = model.getClassLabels().map(function(label) { return label.toLowerCase(); });
		return targets.filter(function(name) { return labels.indexOf(name.toLowerCase()) === -1; });
	},

	/** True when two requests ask for the same check: same model and the same rule. */
	isSameCheck : function(a, b) {
		return !!a && !!b && a.modelUrl === b.modelUrl
			&& JSON.stringify(a.targetClasses) === JSON.stringify(b.targetClasses)
			&& JSON.stringify(a.thresholds) === JSON.stringify(b.thresholds);
	},

	scoreOf : function(scores, className) {
		for(var name in scores) {
			if(name.toLowerCase() === className.toLowerCase()) { return scores[name]; }
		}
		return 0;
	},

	/**
	 * Applies the rule the way the server does, to explain the result to the player. The server still decides.
	 * Resolves to { matched, hasOtherBranch, closest : {className, score, threshold} }, where closest is
	 * the class that matched or else the target that came nearest to its threshold.
	 */
	checkScores : function(scores, targetClasses, thresholds) {
		var result = {matched : false, hasOtherBranch : false, closest : null};
		for(var i = 0; i < (targetClasses || []).length; i++) {
			if(!targetClasses[i]) { result.hasOtherBranch = true; continue; }
			var score = this.scoreOf(scores, targetClasses[i]);
			if(score >= thresholds[i] && !result.matched) {
				result.matched = true;
				result.closest = {className : targetClasses[i], score : score, threshold : thresholds[i]};
			} else if(!result.matched && (result.closest === null || score - thresholds[i] > result.closest.score - result.closest.threshold)) {
				result.closest = {className : targetClasses[i], score : score, threshold : thresholds[i]};
			}
		}
		return result;
	},

	percent : function(probability) {
		return (probability * 100).toFixed(1);
	},

	escapeHtml : function(text) {
		var div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	},

	/** The result card: the part of the photo the model saw, and one bar per class with its threshold line. */
	resultHtml : function(scores, targetClasses, thresholds, previewDataUrl, sawText, lineText) {
		var bars = "";
		var anyLine = false;
		for(var name in scores) {
			var line = "";
			var passed = false;
			for(var i = 0; i < (targetClasses || []).length; i++) {
				if(targetClasses[i] && targetClasses[i].toLowerCase() === name.toLowerCase()) {
					line = '<div class="photoCheckBarLine" style="left:' + (thresholds[i] * 100) + '%"></div>';
					passed = scores[name] >= thresholds[i];
					anyLine = true;
				}
			}
			bars += '<div class="photoCheckBarLabel"><span class="photoCheckBarName">' + this.escapeHtml(name) + '</span><span>' + this.percent(scores[name]) + '%</span></div>'
				+ '<div class="photoCheckBarTrack"><div class="photoCheckBarFill' + (passed ? ' photoCheckBarFillPassed' : '') + '" style="width:' + (scores[name] * 100) + '%"></div>' + line + '</div>';
		}
		return '<div class="photoCheckResultCard">'
			+ '<div class="photoCheckSaw"><img alt="" src="' + previewDataUrl + '">' + this.escapeHtml(sawText) + '</div>'
			+ '<div class="photoCheckBars">' + bars + (anyLine ? '<div class="photoCheckBarsNote">' + this.escapeHtml(lineText) + '</div>' : '') + '</div>'
			+ '</div>';
	}
};
