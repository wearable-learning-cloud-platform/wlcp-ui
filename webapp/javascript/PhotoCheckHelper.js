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
	 * Scores one photo file with a loaded model.
	 * Resolves to { scores : {className : probability}, top : {className, probability}, previewDataUrl, ms }.
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
			var top = null;
			for(var i = 0; i < predictions.length; i++) {
				var p = predictions[i];
				scores[p.className] = Number(p.probability.toFixed(4));
				if(top === null || p.probability > top.probability) { top = {className : p.className, probability : p.probability}; }
			}
			var preview = this.toCanvas(img, this.PREVIEW_SIDE).toDataURL("image/jpeg", 0.7);
			return {scores : scores, top : top, previewDataUrl : preview, ms : ms};
		} finally {
			URL.revokeObjectURL(objectUrl);
		}
	}
};
