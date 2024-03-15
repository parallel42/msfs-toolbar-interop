(function () {

	// This code is executed in the context of the toolbar, so you can interact with the toolbar and the sim.
	// This is an example where having an icon in the toolbar is not desired. This code shows you how to make this dependent on a sim variable that can be used to dictate if the icon should be visible or not.
	// It can be potentially useful for aircraft developers wishing to have an in-game panel for their aircraft that isn't visible when the aircraft isn't loaded.

	function load_js(path, callback) {
		// Create script element
		var module = document.createElement('script');
		module.src = path;
		module.async = false;

		// Check if already exists
		if (document.head.querySelector('script[src="' + path + '"]')) {
			if (typeof callback !== 'undefined') {
				callback();
			}
			return;
		}

		// Add to head
		document.head.appendChild(module);
		module.onload = () => {
			if (typeof callback !== 'undefined') {
				callback();
			}
		}
	}

	// Example of what you can do with the toolbar interop.
	function initialize() {

		// Find the Toolbar
		const toolbar = document.querySelector('tool-bar');

		// (Optional) Find the button for the panel and hide it.
		const toolbar_button = toolbar.querySelector('toolbar-button[panel-id="PANEL_INTEROP_EXAMPLE"]');
		toolbar_button.style.display = 'none';


		// TODO Change InteropExample for the name of your project.
		let weather_listener = window.toolbar_interop.register('JS_LISTENER_WEATHER', 'InteropExample');

		if(weather_listener) {

			// A quick search for `JS_LISTENER_` in the core sim files will show you all the available listeners you can use.
			// In this example, we are using the weather listener. A full list of events and triggers for the Weather listener can be found in the core sim files at
			// \Store\Microsoft Flight Simulator\Content\Packages\fs-base-ui\html_ui\JS\Services\Weather.js


			// Some events have callbacks, like the time update
			weather_listener.on("ON_GAME_TIME_UPDATED", (data, locked) => {
				console.log('Time update: ', data);
			});


			// Some events have no callbacks like 'ASK_WEATHER_LIST'. Instead, they trigger a response event called 'SetWeatherList'
			weather_listener.on('SetWeatherList', (presets_list) => {
				console.log('Weather list: ', presets_list);
			});
			weather_listener.trigger("ASK_WEATHER_LIST");


			// In some situations, en event is only triggered once after registering the event listener. For example, the weather preset update.
			// To get an updated value, you need to re-register the event listener from time to time using interop. (see further down in the code.)
			weather_listener.on('UpdatePreset', (weather_preset) => {
				console.log('Current Weather preset: ', weather_preset);
			});

		}

		// Let's re-register the listener every 5 seconds to get uptodate weather information.
		setInterval(() => {
			weather_listener = window.toolbar_interop.refresh('JS_LISTENER_WEATHER');
		}, 5000);
	}

	load_js("/pages/ToolBar/toolbar_interop.js", () => {
		if (window.toolbar_interop) {
			initialize()
		} else {
			document.addEventListener('toolbar_interop_ready', () => {
				initialize()
			});
		}

	});

})();