window.addEventListener("message", function(event) {
    // we only accept messages from ourselves
    if (event.source != window) {
        return;
    }
    if (event.data.type && (event.data.type == "TP_VISUALIZER_EVENT")) {
        switch (event.data.command) {
            case "vis_button":
                if (visualizer.ready) {
                    if (visualizer.shown) {
                        visualizer.hide();
                    }
                    else {
                        visualizer.show();
                    }
                }
                else if (!visualizer.loading) {
                    visualizer.openPort();
                    visualizer.initAudioContext();
                }
                break;
            case "show":
                visualizer.show();
                break;
            case "hide":
                visualizer.hide();
                break;
            case "theme_color_changed":
                visualizer.barColor = event.data.colors["primary"];
                break;
            case "ping":
                console.log("pong (from webpage)");
                break;
            case "ping_port":
                visualizer.pingPort();
                break;
        }
    }
});

var visualizer = {
    width: 1920,
    height: 1080,
    fps: 24,
    barColor: '#FFCB2E',
    port: null,
    looper: null,
    loading: false,
    ready: false,
    shown: false,
    canvas: null,

    show: function() {
        var bottom = document.getElementsByClassName("bottom")[0];
        var viscanvas = document.getElementById("visualizer");
        bottom.className += " ispopout";
        viscanvas.className += " active";
        visualizer.shown = true;
        visualizer.draw();
    },

    hide: function() {
        var bottom = document.getElementsByClassName("bottom")[0];
        var viscanvas = document.getElementById("visualizer");
        bottom.className = bottom.className.replace("ispopout", "").trim();
        viscanvas.className = viscanvas.className.replace("active", "").trim();
        visualizer.shown = false;
    },

    openPort: function() {
        visualizer.loading = true;
        visualizer.port = chrome.runtime.connect({ name: "tp_visualizer" });
        visualizer.port.onMessage.addListener(function(data) {
            switch (data.result) {
                case "ping":
                    console.log("pong (from port)");
                    break;
                case "init_audio_context":
                    if (data.success === true) {
                        console.log("Audio context initialized");
                        visualizer.setUpLooper();
                    }
                    else {
                        console.warn("Could not initialize audio context");
                        console.error(data.error);
                    }
                    break;
                case "get_frequencies":
                    if (data.success === true) {
                        // console.log(data.freq);
                        visualizer.draw(data.freq);
                    }
                    break;
                default:
                    console.warn("Unknown result for tp_visualizer: " + data.result, data);
                    break;
            }
        });
        visualizer.port.onDisconnect.addListener(function() {
            visualizer.ready = false;
            visualizer.port = null;
        });
    },

    pingPort: function() {
        if (visualizer.port != null) {
            visualizer.port.postMessage({
                command: "ping"
            });
        }
        else {
            console.warn("Could not ping port! Port equals null.");
        }
    },

    initAudioContext: function() {
        if (visualizer.port != null) {
            visualizer.port.postMessage({
                command: "init_audio_context"
            });
        }
        else {
            console.error("Could not initialize audio context! Port equals null.");
        }
    },

    setUpLooper: function() {
        visualizer.looper = setInterval(visualizer.getAudioFrequencies, Math.round(1 / visualizer.fps * 1000));
        console.log("Visualizer looper set");
        visualizer.loading = false;
        visualizer.ready = true;
        visualizer.show();
    },

    getAudioFrequencies: function() {
        if (visualizer.ready) {
            visualizer.port.postMessage({
                command: "get_frequencies"
            });
        }
    },

    draw: function(freq) {
        if (visualizer.ready) {
            var canvasCtx = visualizer.canvas.getContext("2d");
            canvasCtx.clearRect(0, 0, visualizer.width, visualizer.height);
            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            
            if (freq != null) {
                var bufferLength = freq.length;
                var barWidth = (visualizer.width / bufferLength) * 2.5;
                var barHeight;
                var x = 0;
                for (var i = 0; i < bufferLength; i++) {
                    barHeight = freq[i] * 2.5;
                    canvasCtx.fillStyle = visualizer.barColor;
                    if (visualizer.shown) {
                        canvasCtx.fillRect(x, visualizer.height / 2 - barHeight / 2, barWidth, barHeight);
                    }
                    else {
                        canvasCtx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
                    }

                    x += barWidth + 1;
                }

                if (visualizer.shown) {
                    var reflectionGradient = canvasCtx.createLinearGradient(0, visualizer.height / 2, 0, visualizer.height);
                    reflectionGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
                    reflectionGradient.addColorStop(0.08, 'rgba(0, 0, 0, 0.33)');
                    reflectionGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
                    reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
                    canvasCtx.fillStyle = reflectionGradient;
                    canvasCtx.fillRect(0, visualizer.height / 2, visualizer.width, visualizer.height / 2);
                }
            }
        }
    },

    init: function() {
        var visualizerButton = document.createElement("a");
        visualizerButton.setAttribute("id", "visualizerstartbtn");
        visualizerButton.setAttribute("class", "optionbtn material-icons");
        visualizerButton.setAttribute("title", "Show visualizer");
        visualizerButton.setAttribute("onclick", "window.postMessage({type: 'TP_VISUALIZER_EVENT', command: 'vis_button'}, '*');");
        visualizerButton.innerHTML = "&#xe24b;";
        document.getElementById("optionswrapper").appendChild(visualizerButton);

        visualizer.canvas = document.createElement("canvas");
        visualizer.canvas.setAttribute("id", "visualizer");
        visualizer.canvas.setAttribute("width", visualizer.width);
        visualizer.canvas.setAttribute("height", visualizer.height);
        document.getElementsByTagName("body")[0].appendChild(visualizer.canvas);

        console.log("Visualizer initialized");
    }
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "FROM_TP_EXT") {
        switch (request.command) {
            case "init_visualizer":
                visualizer.init();
                visualizer.openPort();
                visualizer.initAudioContext();
                sendResponse({success: true});
                break;
            case "visualizer_initialized":
                sendResponse({initialized: visualizer.ready});
                break;
        }
    }
});

console.log("Content script visualizer.js added to webpage");