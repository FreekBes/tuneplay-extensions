'use strict';

let updateBtn = document.getElementById("installupdates");
var updateDownloadId = null;
var oldBodyWidth = null;
var oldBodyHeight = null;
var manifestData = chrome.runtime.getManifest();
document.getElementById("extversion").innerHTML += manifestData.version;

var updateXhr = new XMLHttpRequest();
updateXhr.open('GET', 'https://www.tuneplay.net/downloads/getextension.php?installed='+manifestData.version);
updateXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
updateXhr.onload = function() {
	var response = updateXhr.responseText;
	var responseJSON = JSON.parse(response);
	if (responseJSON["data"]["update_available"] === true || responseJSON["data"]["update_available"] === "true") {
		updateBtn.style.display = "block";
	}
	updateBtn.onclick = function(event) {
		chrome.downloads.onChanged.addListener(function(downloadDelta) {
			if (downloadDelta != null) {
				if (downloadDelta.id != null && downloadDelta.id == updateDownloadId) {
					console.log(downloadDelta);
					if (downloadDelta.error != undefined) {
						console.warn("An error occured downloading the update.");
						document.getElementById('installupdates').style.display = "none";
					}
					else if (downloadDelta.exists != undefined) {
						if (downloadDelta.exists.current == false) {
							console.warn("Update file has been moved or deleted!");
						}
					}
					else if (downloadDelta.state != undefined) {
						if (downloadDelta.state["current"] == "complete") {
							console.log("Update download complete!");
							document.getElementById('updatetext').innerHTML = "Install update";
							updateBtn.onclick = function(event) {
								console.warn("Installing update from downloadID " + updateDownloadId);
								// chrome.downloads.show(updateDownloadId);
								chrome.downloads.open(updateDownloadId);
								/*
								chrome.downloads.removeFile(updateDownloadId, function() {
									console.warn("Update file removed.");
								});
								*/
							};
							chrome.downloads.setShelfEnabled(true);
						}
					}
					else if (downloadDelta.danger != undefined) {
						if (downloadDelta.danger.current != "safe" && downloadDelta.danger.current != "accepted") {
							oldBodyWidth = document.body.offsetWidth;
							document.body.style.width = "400px";
							chrome.downloads.acceptDanger(downloadDelta.id, function() {
								document.body.style.width = oldBodyWidth + "px";
								console.log("User has made a decision whether or not to download the update.");
							});
						}
						else {
							console.log("Download is safe");
						}
					}
					else {
						console.log("Unknown downloadDelta status!");
					}
				}
			}
		});
		
		chrome.downloads.setShelfEnabled(false);
		chrome.downloads.download({
			url: responseJSON["data"]["download"],
			conflictAction: "overwrite"
		}, function(downloadId) {
			updateDownloadId = downloadId;
		});
	};
};
updateXhr.send();

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