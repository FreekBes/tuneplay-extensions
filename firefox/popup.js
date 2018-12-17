'use strict';

let updateBtn = document.getElementById("installupdates");
var updateDownloadId = null;
var oldBodyWidth = null;
var oldBodyHeight = null;
var manifestData = chrome.runtime.getManifest();
document.getElementById("extversion").innerHTML += manifestData.version;

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

let addTrack = document.getElementById('addtrack');
addTrack.onclick = function(event) {
	window.location.href = "add.html";
};

let openTP = document.getElementById('opentp');
openTP.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/",
		active: true
	});
};

let openTPE = document.getElementById('opentpe');
openTPE.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/edit.php",
		active: true
	});
};

let openSPI = document.getElementById('openspi');
openSPI.onclick = function(event) {
	chrome.tabs.create({
		url: "https://www.tuneplay.net/spotifyimporter.php",
		active: true
	});
};

let logIn = document.getElementById("login");
logIn.onclick = function(event) {
	/*
	chrome.tabs.create({
		url: "https://www.tuneplay.net/login.php",
		active: true
	});
	*/
	window.location.href = "login.html";
};