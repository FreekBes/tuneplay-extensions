'use strict';

var searchXhr = null;
var searchIds = [];
var searchResults = [];

chrome.runtime.onInstalled.addListener(function() {
	// alert("To be able to install updates, make sure to enable access to file-URLs for the extension.");
});

chrome.omnibox.setDefaultSuggestion({
	description: "Search on TunePlay, or press enter to go there right away"
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
	if (searchXhr != null) {
		searchXhr.abort();
		searchXhr = null;
	}
	
	if (text.trim() != "") {
		searchXhr = new XMLHttpRequest();
		searchXhr.open('GET', 'https://www.tuneplay.net/search.php?type=all&amount=5&q=' + encodeURIComponent(text.trim()));
		searchXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		searchXhr.onload = function() {
			var response = searchXhr.responseText;
			var responseJSON = JSON.parse(response);
			
			for (var i = 0; i < responseJSON.length; i++) {
				if ("search_id" in responseJSON[i]) {
					searchIds.push(responseJSON[i]["search_id"]);
				}
				
				if ("results" in responseJSON[i]) {
					searchResults = responseJSON[i]["results"];
				}
			}
			
			var suggestResults = [];
			for (var j = 0; j < searchResults.length; j++) {
				var tempRes = {};
				if (searchResults[j]["result_type"] === "track") {
					tempRes.description = searchResults[j]["title"] + " - " + searchResults[j]["artists_text"];
				}
				else if (searchResults[j]["result_type"] === "artist") {
					tempRes.description = searchResults[j]["name"] + " (" + searchResults[j]["type_text"].toLowerCase() + ")";
				}
				else if (searchResults[j]["result_type"] === "person") {
					tempRes.description = searchResults[j]["name"] + " (person)";
				}
				else if (searchResults[j]["result_type"] === "album") {
					tempRes.description = searchResults[j]["name"] + " (" + searchResults[j]["type"].toLowerCase() + ")";
				}
				
				if (tempRes.description != undefined && tempRes.description != null) {
					tempRes.description = tempRes.description.replace(/"/g , "&quot;").replace(/'/g , "'").replace(/</g , "&lt;").replace(/>/g , "&gt;").replace(/&/g , "&amp;");
					tempRes.content = searchResults[j]["url"];
					suggestResults.push(tempRes);
				}
			}
			
			// chrome.omnibox.setDefaultSuggestion({description:suggestResults[0].description});
			// suggestResults.shift();
			suggest(suggestResults);
		};
		searchXhr.send();
	}
	else {
		suggest([]);
	}
});

chrome.omnibox.onInputEntered.addListener(function(text, disposition) {
	if (text == null || text == undefined || text.trim().indexOf("https://www.tuneplay.net/") != 0) {
		text = "https://www.tuneplay.net/";
	}
	else {
		text = text.trim();
	}
	if (disposition == "newForegroundTab") {
		chrome.tabs.create({
			url: text,
			active: true
		});
	}
	else if (disposition == "newBackgroundTab") {
		chrome.tabs.create({
			url: text,
			active: false
		});
	}
	else {
		// disposition == "currentTab"
		chrome.tabs.update(null, {url: text});
	}
});

var visData = {
	audioAnalyser: null,
	audioFreqDataArray: null,
	ctx: null,
	source: null,
	audioOut: null
};

function sendVisFrequencyData() {
	visData.audioAnalyser.getByteFrequencyData(visData.audioFreqDataArray);
	return Array.from(visData.audioFreqDataArray);
}

// audio capture for visualizer
function getAudioContext() {
	return new Promise(function(resolve, reject) {
		try {
			if (visData.ctx != null) {
				resolve(visData.ctx);
			}
			else {
				chrome.tabs.query({active: true, currentWindow: true, url: "https://www.tuneplay.net/"}, function(tabs) {
					chrome.tabCapture.capture({audio: true}, function(stream) {
						if (stream != null) {
							// set-up the audio context
							visData.ctx = new AudioContext();
							visData.source = visData.ctx.createMediaStreamSource(stream);
							
							// set-up the analyser
							visData.audioAnalyser = visData.ctx.createAnalyser();
							visData.audioAnalyser.fftSize = 512;
							visData.audioFreqDataArray = new Uint8Array(visData.audioAnalyser.frequencyBinCount);
							visData.source.connect(visData.audioAnalyser);
							
							// connect audio source back to the destination in order to keep the audio playing in the tab
							visData.source.connect(visData.ctx.destination);

							resolve(visData.ctx);
						}
						else {
							reject("tabCapture stream equals null");
						}
					});
				});
			}
		}
		catch(err) {
			reject(err.message);
		}
	});
}

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name == "tp_visualizer") {
		port.onMessage.addListener(function(data) {
			switch(data.command) {
				case "ping":
					port.postMessage({result: "ping", success: true});
					break;
				case "init_audio_context":
					getAudioContext().then(function(audioContext) {
						port.postMessage({result: "init_audio_context", success: true});
					}).catch(function(errorMessage) {
						port.postMessage({result: "init_audio_context", success: false, error: errorMessage});
					});
					break;
				case "get_frequencies":
					port.postMessage({result: "get_frequencies", success: true, freq: sendVisFrequencyData()});
					break;
				case "garbage_collect":
					visData.audioAnalyser = null;
					visData.audioFreqDataArray = null;
					visData.ctx = null;
					visData.source = null;
					visData.audioOut = null;
					break;
			}
		});
	}
});