# MSFS Toolbar Interop

## Overview
This project was created to facilitate interoperability on View Listeners between projects running in the MSFS Toolbar. Its primary goal is to make it easier for add-on developers to run JavaScript code, which is crucial for the functionality of their add-ons. This requires an in-game panel to function.

## Why?
In Microsoft Flight Simulator (MSFS) 2020, addon developers face a significant challenge due to the lack of a dedicated space for running JavaScript, with the only conventional option being within aircraft instruments. This limitation complicates the development of generalized utility addons that rely on JavaScript to operate. The toolbar, always available during gameplay, presents an ideal but underutilized location for JavaScript execution. Traditionally, adding JavaScript to the toolbar involves overriding the Toolbar's HTML and/or JS files, a method that allows only one mod to function at a time (the last one loaded) thereby limiting compatibility between addons. This project introduces an innovative approach to inject JavaScript into the toolbar, overcoming the limitations of traditional methods and enabling multiple mods to use the Toolbar simultaneously.

## Key Features
- **JavaScript Code Injection:** A new method to inject JavaScript into the MSFS Toolbar, bypassing the limitations of traditional methods.  
- **View Listener Interoperability:** Allows multiple add-ons to share and manage View Listeners efficiently, preventing conflicts and ensuring smooth operation.

## Part 1: SVG Icon Code Injection
In order to run JavaScript code in the toolbar, your addon needs to have an in-game panel available in the toolbar. Since your code runs in the toolbar, it is possible to manually hide the icon from the toolbar if it isn't needed.

 1. Locate your SVG icon within your package source: `PackageSources\html_ui\icons\toolbar`.
 2. Edit the SVG icon file using a text editor to include the injection mechanism as demonstrated below:
```xml
<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="Titre" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="64px" height="64px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
  
  <!-- Content of your SVG file like <path>, <g>, etc. -->
    
  <foreignObject>
    <img src onerror="(() => {
      if(!window.p42_example_injected) {
        window.p42_example_injected = true;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'coui://html_ui/InGamePanels/P42Example/toolbar_content/your_script.js';
        document.head.appendChild(script);
      }
    })()"></img>
  </foreignObject>
</svg>
```
This code dynamically loads a JavaScript file (``your_script.js``) when the SVG icon triggers an error due to its empty src attribute, leveraging the onerror event.

## Part 2: Ensuring View Listener Interoperability
For addons using View Listeners, integrating toolbar_interop.js is essential for managing listener instances and ensuring all mods can access necessary data without conflicts.

1. Include `toolbar_interop.js` in your project. You will find it and its folder structure in this Github repository under "Example Panel". Please keep the same structure (``PackageSources/html_ui/pages/ToolBar/toolbar_interop.js``).
2. Load the script at the beginning of your main JS file using the provided loader function to avoid conflicts and ensure proper initialization. Use the callback to continue your code initialization.
```js
function load_js(path, callback) {
  // Create script element
  var module = document.createElement('script');
  module.src = path;

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
```
```js
load_js("/pages/ToolBar/toolbar_interop.js", () => {
  if(window.toolbar_interop) {
    // Interop already exists.
    // Now we can register view listeners.
  } else {
    // Interop isn't loaded yet, let's wait for the ready event.
    document.addEventListener('toolbar_interop_ready', () => {
      // Now we can register view listeners.
    });
  }
});
```

## Using toolbar_interop.js
After loading, `toolbar_interop.js` provides a mechanism to register, refresh, and unregister View Listeners effectively, managing a centralized repository for all listeners.

#### - Registering a View Listener
> Make sure to add the name of your project as a 2nd argument. This enables other mods to get a list of all modules using the same listener.
> ```js
> const listener = window.toolbar_interop.register('JS_LISTENER_WEATHER', 'SimFX', (listener) => {
>   // Listener was registered. "listener" is equivalent to the return of get_listener
> });
> ```

#### - Get a Listener
> This will return the requested listener with the list of other modules using the same listener.
> ```js
> const listener = window.toolbar_interop.get_listener('JS_LISTENER_WEATHER');
> ```
> ```js
> {
>   listener: ViewListener,
>   is_refreshing: Boolean,
>   clients: Array<String>,
> }
> ```

#### - Refresh Listener
> With some listeners like `JS_LISTENER_WEATHER`, some data is transmited right after the Listener is registered without a way to request that data again. Refreshing the Listener allows us to get that up-to-date data.
> ```js
> window.toolbar_interop.refresh('JS_LISTENER_WEATHER', (listener) => {
>   // Listener was refreshed. "listener" is equivalent to the return of get_listener 
> });
> ```

## Conclusion
By following these guidelines, you can leveraging the toolbar for JavaScript execution while ensuring smooth interoperability between multiple addons through shared View Listeners.
