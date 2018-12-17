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