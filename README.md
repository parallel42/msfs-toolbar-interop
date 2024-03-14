# MSFS Toolbar Interop

## Summary
This project was created to facilitate interoperability on View Listeners between projects running in the MSFS Toolbar. This requires an in-game panel to function.

## Why?
In MSFS 2020, there is no dedicated area to run javascript other than in an aircraft instrument. This makes it very dificult for add-on developers that need to execute javascript for their add-on to work properly. The area where it would make the most sense to execute javascript is the Toolbar area. Since it is loaded at all time, it makes it a prime location for javascript code injection.

There aren't many ways to inject in the toolbar. The expected way would be to create a package that overrides the Toolbar.html/.js files. The problem with this technique is that only one mod can override the toolbar at a time, meaning that all mods will stop working except the last one loaded. This project brings a new way to load js code in the toolbar.

## The Concept
Panel icons are loaded directly in the toolbar as `<svg>` elements instead of being rendered in a `<img>` element. This enables us to use `<foreignObject>` inside of the SVG to inject code. Here we're using an `<img>` element with an empty src to trigger an error that enables us to execute code. We use this opportunity to load our real js document containing all the logic for our app.

### SVG icon code injection
Opening the svg icon from your in-game panel (PackageSources\html_ui\icons\toolbar) in a text editor enables you to modify it to look like the code below and enable the injection.
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
        script.src = 'coui://html_ui/InGamePanels/P42Flow/toolbar_content/flow_toolbar.js';
        document.head.appendChild(script);
      }
    })()"></img>
  </foreignObject>
</svg>
```

### View Listener interoperability
Next, if you are using any View Listeners, you need to add ``toolbar_interop.js`` to your project and load it. This module enables the interoperability of View Listeners, all of wich can only be registered once. ``toolbar_interop.js`` creates a central repository of View Listeners where they are registered once and everyone can use safely. You can make the following code part of your js document, just make sure it is loaded first. Optionally, use the callback in ``load_js`` to know when the module is loaded and proceed with the execution of your module. We don't recommend integrating the content of ``toolbar_interop.js`` directly in your code as it might conflict with other modules if an update is made. For interoperability reasons, we ask that you don't modify this file. Please raise an issue if you encounter a problem you if you would like functionality added.
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
  // module loaded
});
```

### How to use ``toolbar_interop.js``
When loaded, it creates a class at ``window.toolbar_interop``. You can use this class to register new View Listeners, refresh them (re-register) and unregister them. The class will manage a single instance of the View Listeners for everyone to use. Doing it this way, we ensure everyone has the data they need.

#### Registering an View Listener
Make sure to add the name of your project as a 2nd argument. This enables other mods to get a list of all modules using the same listener.
```js
const listener = window.toolbar_interop.register('JS_LISTENER_WEATHER', 'SimFX', (listener) => {
  // Listener was registered. "listener" is equivalent to the return of get_listener
});
```

#### Get a Listener
This will return the requested listener with the list of other modules using the same listener.
```js
const listener = window.toolbar_interop.get_listener('JS_LISTENER_WEATHER');
```
```js
{
  listener: ViewListener,
  clients: Array<String>,
}
```

#### Refresh Listener
In some situation (like the JS_LISTENER_WEATHER listener), some data is transmited right after the Listener is registered without a way to request that data again. Refreshing a Listener allows us to get that up-to-date data.
```js
const listener = window.toolbar_interop.refresh('JS_LISTENER_WEATHER', (listener) => {
  // Listener was refreshed. "listener" is equivalent to the return of get_listener 
});
```

