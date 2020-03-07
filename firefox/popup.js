'use strict';

let updateBtn = document.getElementById("installupdates");
var updateDownloadId = null;
var oldBodyWidth = null;
var oldBodyHeight = null;
var manifestData = chrome.runtime.getManifest();
document.getElementById("extversion").innerHTML += manifestData.version;

let addTrack = document.getElementById('addtrack');
let openTP = document.getElementById('opentp');
let openTPE = document.getElementById('opentpe');
let openSPI = document.getElementById('openspi');
let logIn = document.getElementById("login");

addTrack.onclick = function(event) {
	window.location.href = "add.html";
};

openTP.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/",
		active: true
	});
	window.close();
};

openTPE.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/edit.php",
		active: true
	});
	window.close();
};

openSPI.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/spotifyimporter.php",
		active: true
	});
	window.close();
};

logIn.onclick = function(event) {
	/*
	chrome.tabs.create({
		url: "https://www.tuneplay.net/login.php",
		active: true
	});
	*/
	window.location.href = "login.html";
};

chrome.cookies.get({url: 'https://www.tuneplay.net', name: 'session_login'}, function(cookie) {
	if (cookie && cookie.value === "true") {
		// signed in
		document.getElementById("mainmenu").style.display = "block";
		document.getElementById("loginmenu").style.display = "none";
	}
	else {
		// not signed in
		document.getElementById("mainmenu").style.display = "none";
		document.getElementById("loginmenu").style.display = "block";
	}
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	if (tabs.length > 0) {
		if (tabs[0].url.startsWith("https://www.tuneplay.net/?") || tabs[0].url == "https://www.tuneplay.net/") {
			openTP.style.display = "none";
			addTrack.style.display = "none";
			return;
		}
	}
});