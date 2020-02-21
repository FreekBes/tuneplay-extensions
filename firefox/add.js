'use strict';

var tabUrl = null;
var tabTitle = null;
var urlIdType = null;
var urlId = null;
var editId = null;
var trackTitle = null;
var trackCover = null;
var trackCoverUrl = "";
var trackType = "";
let question = document.getElementById("question");
var coverSampleContainer = document.getElementById("coversamplecontainer");
let coverSample = document.getElementById("coversample");
let nextBtn = document.getElementById('nextbtn');
let addBtn = document.getElementById('addbtn');
let optionBox = document.getElementById("optionbox");

function checkIfAlreadyAdded() {
	return new Promise(function(resolve, reject) {
		var checkXhr = new XMLHttpRequest();
		checkXhr.open('POST', 'https://www.tuneplay.net/get.php?type=track&'+urlIdType+'='+encodeURIComponent(urlId));
		checkXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		checkXhr.setRequestHeader ("enctype", "multipart/form-data");
		checkXhr.onload = resolve;
		checkXhr.onerror = reject;
		checkXhr.send();
		return false;
	});
}

function searchForTracks() {
	return new Promise(function(resolve, reject) {
		var checkXhr = new XMLHttpRequest();
		checkXhr.open('POST', 'https://www.tuneplay.net/search.php?type=track&amount=10&suggested=1&q='+encodeURIComponent(trackTitle));
		checkXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		checkXhr.setRequestHeader ("enctype", "multipart/form-data");
		checkXhr.onload = resolve;
		checkXhr.onerror = reject;
		checkXhr.send();
		return false;
	});
}

function showSpinner(loadingText) {
	document.getElementById("noloading").style.display = "none";
	document.getElementById("loading").style.display = "block";
	if (loadingText != null) {
		document.getElementById("loadingtext").innerHTML = loadingText;
	}
	else {
		document.getElementById("loadingtext").innerHTML = "Loading...";
	}
}

function hideSpinner() {
	document.getElementById("loading").style.display = "none";
	document.getElementById("noloading").style.display = "block";
	document.getElementById("loadingtext").innerHTML = "Loading...";
}

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function resetOptions() {
	addBtn.className = "next disabled";
	nextBtn.className = "next disabled";
	optionBox.innerHTML = "";
}

function selectOption(event) {
	var options = document.getElementsByClassName("button");
	for (var i = 0; i < options.length; i++) {
		options[i].getElementsByTagName("img")[0].src = "../images/ic_radio_button_unchecked_white_24dp_2x.png";
		options[i].setAttribute("id", "");
	}
	
	var elem = event.currentTarget;
	var type = elem.getAttribute("btntype");
	if (type == "trackTitle") {
		if (elem.getAttribute("btnvalue") == "None of the above (specify)" || elem.getAttribute("btnvalue") == "None of the above") {
			trackTitle = prompt("Enter the title of this track", trackTitle);
			elem.getElementsByTagName("span")[0].innerHTML = trackTitle;
			if (trackTitle == null || trackTitle == "") {
				window.location.href = "popup.html";
			}
		}
		else {
			trackTitle = elem.getAttribute("btnvalue");
		}
	}
	else if (type == "trackCover") {
		trackCover = elem.getAttribute("btnvalue");
	}
	else if (type == "trackType") {
		trackType = elem.getAttribute("btnvalue");
	}
	else if (type == "editId") {
		editId = elem.getAttribute("btnvalue");
	}
	
	var chosen = elem.getElementsByTagName('span')[0].innerText;
	elem.getElementsByTagName("img")[0].src = "../images/ic_radio_button_checked_white_24dp_2x.png";
	elem.setAttribute("id", "option-selected");
	addBtn.className = "next";
	nextBtn.className = "next";
}

function optionAlreadyThere(text) {
	var options = document.getElementsByClassName("button");
	for (var i = 0; i < options.length; i++) {
		if (options[i].innerText == text.trim()) {
			return true;
		}
	}
	return false;
}

function addOption(text, type, callback) {
	if (!optionAlreadyThere(text)) {
		var option = document.createElement("div");
		option.className = "button";
		option.setAttribute("btntype", type);
		option.setAttribute("btnvalue", text);
		option.innerHTML = '<img src="../images/ic_radio_button_unchecked_white_24dp_2x.png" /><span>'+text.trim()+'</span>';
		if (typeof callback == "function") {
			option.onclick = callback;
		}
		else {
			option.onclick = selectOption;
		}
		optionBox.appendChild(option);
	}
}

function addTrackOption(track, type, callback) {
	var option = document.createElement("div");
	option.className = "button";
	option.setAttribute("btntype", type);
	option.setAttribute("btnvalue", track["id"]);
	option.innerHTML = '<img src="../images/ic_radio_button_unchecked_white_24dp_2x.png" /><img class="noradio" src="https://www.tuneplay.net/'+track["cover"].replace("x500.jpg", "x40.jpg")+'" /><span>'+track["title"]+'<br><small>'+track["artists_text"]+'</small></span>';
	if (typeof callback == "function") {
		option.onclick = callback;
	}
	else {
		option.onclick = selectOption;
	}
	optionBox.appendChild(option);
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	tabUrl = tabs[0].url;
	if (tabUrl.indexOf("youtube.com/watch") > -1) {
		hideSpinner();
		urlIdType = "yt_id";
		urlId = getParameterByName("v", tabUrl);
		showSpinner("Checking if track has already been added...");
		checkIfAlreadyAdded().then(function(checkResult) {
			var checkResponse = JSON.parse(checkResult.target.response);
			hideSpinner();
			if (checkResponse["data"].length == 0) {
				question.innerHTML = "Which of the following is the title of this track?";
				tabTitle = tabs[0].title.replace("- YouTube", "");
				var tabTitleParts = tabTitle.split(/,|-|–|\||\sby\s|\sft.\s|\swith\s|\sFt.\s/);
				resetOptions();
				for (var i = 0; i < tabTitleParts.length; i++) {
					addOption(tabTitleParts[i].trim(), "trackTitle");
					if (tabTitleParts[i].indexOf("(") > -1 && tabTitleParts[i].indexOf(")") > -1) {
						addOption(tabTitleParts[i].trim().replace(/\(.*\)/, ""), "trackTitle");
					}
				}
				addOption(tabTitle.trim(), "trackTitle");
				if (tabTitle.indexOf("(") > -1 && tabTitle.indexOf(")") > -1) {
					addOption(tabTitle.trim().replace(/\(.*\)/, ""), "trackTitle");
				}
				addOption("None of the above (specify)", "trackTitle");
				nextBtn.style.display = "block";
				addBtn.style.display = "none";
				nextBtn.onclick = function(event) {
					showSpinner("Searching for track...");
					searchForTracks().then(function(searchResult) {
						var searchResponse = JSON.parse(searchResult.target.response);
						var tracksFound = false;
						for (i = 0; i < searchResponse.length; i++) {
							if ("results" in searchResponse[i]) {
								tracksFound = searchResponse[i]['results'];
								break;
							}
						}
						nextBtn.onclick = function(event) {
							question.innerHTML = "What type of music is this?<br><small><small>Select track if not sure</small></small>";
							resetOptions();
							addOption("Track", "trackType");
							addOption("Liveset", "trackType");
							addOption("Performance", "trackType");
							addOption("Broadcast", "trackType");
							addOption("Mix", "trackType");
							nextBtn.style.display = "block";
							addBtn.style.display = "none";
							nextBtn.onclick = function(event) {
								question.innerHTML = "Is the following image the right cover art of this track?";
								coverSampleContainer.style.display = "block";
								trackCoverUrl = 'https://img.youtube.com/vi/'+urlId+'/maxresdefault.jpg';
								coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
								resetOptions();
								addOption("Yes", "trackCover", function(event) {
									selectOption(event);
									addBtn.style.display = "block";
									nextBtn.style.display = "none";
								});
								addOption("No", "trackCover", function(event) {
									selectOption(event);
									nextBtn.style.display = "block";
									addBtn.style.display = "none";
								});
								nextBtn.style.display = "block";
								addBtn.style.display = "none";
								nextBtn.onclick = function(event) {
									if (trackCover == "No") {
										question.innerHTML = "Is the following image the right cover art of this track?";
										coverSampleContainer.style.display = "block";
										trackCoverUrl = 'https://img.youtube.com/vi/'+urlId+'/sddefault.jpg';
										coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
										resetOptions();
										addOption("Yes", "trackCover", function(event) {
											selectOption(event);
											addBtn.style.display = "block";
											nextBtn.style.display = "none";
										});
										addOption("No", "trackCover", function(event) {
											selectOption(event);
											nextBtn.style.display = "block";
											addBtn.style.display = "none";
										});
										nextBtn.style.display = "block";
										addBtn.style.display = "none";
										nextBtn.onclick = function(event) {
											if (trackCover == "No") {
												question.innerHTML = "Is the following image the right cover art of this track?";
												coverSampleContainer.style.display = "block";
												trackCoverUrl = 'https://img.youtube.com/vi/'+urlId+'/hqdefault.jpg';
												coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
												resetOptions();
												addOption("Yes", "trackCover", function(event) {
													selectOption(event);
													addBtn.style.display = "block";
													nextBtn.style.display = "none";
												});
												addOption("No", "trackCover", function(event) {
													selectOption(event);
													nextBtn.style.display = "block";
													addBtn.style.display = "none";
												});
												nextBtn.style.display = "block";
												addBtn.style.display = "none";
												nextBtn.onclick = function(event) {
													if (trackCover == "No") {
														question.innerHTML = "Is the following image the right cover art of this track?";
														coverSampleContainer.style.display = "block";
														trackCoverUrl = 'https://img.youtube.com/vi/'+urlId+'/0.jpg';
														coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
														resetOptions();
														addOption("Yes", "trackCover");
														addOption("No", "trackCover");
														nextBtn.style.display = "none";
														addBtn.style.display = "block";
													}
													else {
														addToTP();
													}
												};
											}
											else {
												addToTP();
											}
										};
									}
									else {
										addToTP();
									}
								};
							};
						};
						hideSpinner();
						if (tracksFound !== false) {
							question.innerHTML = "Select the track you're trying to edit";
							resetOptions();
							for (i = 0; i < tracksFound.length; i++) {
								addTrackOption(tracksFound[i], "editId", function(event) {
									selectOption(event);
									addBtn.style.display = "block";
									nextBtn.style.display = "none";
								});
							}
							addOption("None of the above", "editId", function(event) {
								selectOption(event);
								addBtn.style.display = "none";
								nextBtn.style.display = "block";
							});
						}
						else {
							// trigger onclick method of nextbtn, as no track was found
							nextBtn.onclick();
						}
					},
					function(e) {
						hideSpinner();
						question.innerHTML = "An error occured";
						optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to search for tracks on TunePlay. Try again later.</div>";
						nextBtn.style.display = "none";
						addBtn.style.display = "none";
					});
				};
			}
			else {
				hideSpinner();
				question.innerHTML = "Track has already been added";
				optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Thanks for helping out though!</div>";
				nextBtn.style.display = "none";
				addBtn.style.display = "none";
			}
		},
		function(e) {
			hideSpinner();
			question.innerHTML = "An error occured";
			optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to check if the track has already been added or not.</div>";
			nextBtn.style.display = "none";
			addBtn.style.display = "none";
		});
	}
	else if (tabUrl.indexOf("soundcloud.com") > -1) {
		showSpinner("Retrieving data from Soundcloud...");
		chrome.tabs.executeScript( 
			tabs[0].id, 
			{
				code: 'document.getElementsByClassName("playbackSoundBadge__titleLink")[0].getAttribute("href");'
			},
			function(results) {
				// console.log(results[0]);
				if (results != undefined && results.length > 0) {
					if (results[0] != 0 && results[0] != undefined && results[0] != null && results[0] != "") {
						var urlToResolve = "http://www.soundcloud.com" + results[0];
						var scResolveXhr = new XMLHttpRequest();
						scResolveXhr.open('GET', "https://api.soundcloud.com/resolve.json?url=" + encodeURIComponent(urlToResolve) + "&client_id=0f470b2d5c062da3803265e51d8ea82f");
						scResolveXhr.onload = function() {
							var scTrackURL = scResolveXhr.responseURL;
							if (scTrackURL != undefined && scTrackURL != null && scTrackURL != "") {
								var tempSCid = scTrackURL.split("tracks/")[1].split(".json")[0];
								
								var tempiframe = document.createElement("iframe");
								tempiframe.id = "sc-player";
								tempiframe.width = "100%";
								tempiframe.height = "166";
								tempiframe.scrolling = "no";
								tempiframe.frameborder = "no";
								tempiframe.src = 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + tempSCid + '&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false';
								tempiframe.onload = function(event) {
									var tempSCplayer = SC.Widget("sc-player");
									tempSCplayer.getCurrentSound(function(responseJSON) {
										hideSpinner();
										urlIdType = "sc_id";
										urlId = responseJSON.id;
										showSpinner("Checking if track has already been added...");
										checkIfAlreadyAdded().then(function(checkResult) {
											var checkResponse = JSON.parse(checkResult.target.response);
											hideSpinner();
											if (checkResponse["data"].length == 0) {
												hideSpinner();
												question.innerHTML = "Which of the following is the title of this track?";
												tabTitle = responseJSON.title;
												var tabTitleParts = tabTitle.split(/,|-|–|\||\sby\s|\sft.\s|\swith\s|\sFt.\s/);
												resetOptions();
												for (var i = 0; i < tabTitleParts.length; i++) {
													addOption(tabTitleParts[i].trim(), "trackTitle");
													if (tabTitleParts[i].indexOf("(") > -1 && tabTitleParts[i].indexOf(")") > -1) {
														addOption(tabTitleParts[i].trim().replace(/\(.*\)/, ""), "trackTitle");
													}
													if (tabTitleParts[i].indexOf("[") > -1 && tabTitleParts[i].indexOf("]") > -1) {
														addOption(tabTitleParts[i].trim().replace(/\[.*\]/, ""), "trackTitle");
													}
												}
												addOption(tabTitle.trim(), "trackTitle");
												if (tabTitle.indexOf("(") > -1 && tabTitle.indexOf(")") > -1) {
													addOption(tabTitle.trim().replace(/\(.*\)/, ""), "trackTitle");
												}
												if (tabTitle.indexOf("[") > -1 && tabTitle.indexOf("]") > -1) {
													addOption(tabTitle.trim().replace(/\[.*\]/, ""), "trackTitle");
												}
												addOption("None of the above (specify)", "trackTitle");
												nextBtn.style.display = "block";
												addBtn.style.display = "none";
												nextBtn.onclick = function(event) {
													showSpinner("Searching for track...");
													searchForTracks().then(function(searchResult) {
														var searchResponse = JSON.parse(searchResult.target.response);
														var tracksFound = false;
														for (i = 0; i < searchResponse.length; i++) {
															if ("results" in searchResponse[i]) {
																tracksFound = searchResponse[i]['results'];
																break;
															}
														}
														nextBtn.onclick = function(event) {
															question.innerHTML = "What type of music is this?<br><small><small>Select track if not sure</small></small>";
															resetOptions();
															addOption("Track", "trackType");
															addOption("Liveset", "trackType");
															addOption("Performance", "trackType");
															addOption("Broadcast", "trackType");
															addOption("Mix", "trackType");
															if (responseJSON["artwork_url"] != null) {
																nextBtn.style.display = "block";
																addBtn.style.display = "none";
																nextBtn.onclick = function(event) {
																	question.innerHTML = "Is the following image the right cover art of this track?";
																	coverSampleContainer.style.display = "block";
																	trackCoverUrl = responseJSON['artwork_url'].replace("-large.", "-t500x500.");
																	coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
																	resetOptions();
																	addOption("Yes", "trackCover");
																	addOption("No", "trackCover");
																	nextBtn.style.display = "none";
																	addBtn.style.display = "block";
																	nextBtn.onclick = null;
																};
															}
															else {
																nextBtn.style.display = "none";
																addBtn.style.display = "block";
																nextBtn.onclick = null;
															}
														};
														hideSpinner();
														if (tracksFound !== false) {
															question.innerHTML = "Select the track you're trying to edit";
															resetOptions();
															for (i = 0; i < tracksFound.length; i++) {
																addTrackOption(tracksFound[i], "editId", function(event) {
																	selectOption(event);
																	addBtn.style.display = "block";
																	nextBtn.style.display = "none";
																});
															}
															addOption("None of the above", "editId", function(event) {
																selectOption(event);
																addBtn.style.display = "none";
																nextBtn.style.display = "block";
															});
														}
														else {
															// trigger onclick method of nextbtn, as no track was found
															nextBtn.onclick();
														}
													},
													function(e) {
														hideSpinner();
														question.innerHTML = "An error occured";
														optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to search for tracks on TunePlay. Try again later.</div>";
														nextBtn.style.display = "none";
														addBtn.style.display = "none";
													});
												};
											}
											else {
												hideSpinner();
												question.innerHTML = "Track has already been added";
												optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Thanks for helping out though!</div>";
												nextBtn.style.display = "none";
												addBtn.style.display = "none";
											}
										},
										function(e) {
											hideSpinner();
											question.innerHTML = "An error occured";
											optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to check if the track has already been added or not.</div>";
											nextBtn.style.display = "none";
											addBtn.style.display = "none";
										});
									});
								};
								
								document.getElementById("invisible").appendChild(tempiframe);
							}
						};
						scResolveXhr.send();
					}
					else {
						hideSpinner();
						question.innerHTML = "An error occured";
						optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to retrieve URL to this track from Soundcloud. Cannot add this track right now.</div>";
						nextBtn.style.display = "none";
						addBtn.style.display = "none";
					}
				}
				else {
					hideSpinner();
					question.innerHTML = "An error occured";
					optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to retrieve URL to this track from Soundcloud. Cannot add this track right now.</div>";
					nextBtn.style.display = "none";
					addBtn.style.display = "none";
				}
			}
		);
	}
	else if (tabUrl.indexOf("open.spotify.com") > -1) {
		hideSpinner();
		question.innerHTML = "Spotify is not supported yet by this plugin";
		optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Make sure to keep the plugin up-to-date, as it might get support for Spotify in the near future!</div>";
		nextBtn.style.display = "none";
		addBtn.style.display = "none";
	}
	else if (tabUrl.indexOf("mixcloud.com") > -1) {
		showSpinner("Retrieving information about this mix from Mixcloud...");
		chrome.tabs.executeScript( 
			tabs[0].id, 
			{
				code: '[document.getElementsByClassName("player-cloudcast-title")[0].innerText, document.getElementsByClassName("player-cloudcast-title")[0].getAttribute("href")]'
			},
			function(results) {
				// console.log(results[0]);
				// console.log(typeof results[0]);
				
				if (results != undefined && results.length > 0) {
					if (results[0] != 0 && results[0] != undefined && results[0] != null && results[0] != "") {
						var tempResults = results[0];
						if (tempResults[0] != "null" && tempResults[0] != "undefined" && tempResults[0] != null && tempResults[0] != undefined && tempResults[0] != 0 && tempResults[0] != ""
						 && tempResults[1] != "null" && tempResults[1] != "undefined" && tempResults[1] != null && tempResults[1] != undefined && tempResults[1] != 0 && tempResults[1] != "") {
							hideSpinner();
							urlIdType = "mc_id";
							urlId = tempResults[1];
							showSpinner("Checking if mix has already been added...");
							checkIfAlreadyAdded().then(function(checkResult) {
								var checkResponse = JSON.parse(checkResult.target.response);
								if (checkResponse["data"].length == 0) {
									hideSpinner();
									question.innerHTML = "Which of the following is the title of this mix?";
									var tabTitleParts = tempResults[0].split(/,|-|–|\||\sby\s|\sft.\s|\swith\s|\sFt.\s/);
									resetOptions();
									for (var i = 0; i < tabTitleParts.length; i++) {
										addOption(tabTitleParts[i].trim(), "trackTitle");
										if (tabTitleParts[i].indexOf("(") > -1 && tabTitleParts[i].indexOf(")") > -1) {
											addOption(tabTitleParts[i].trim().replace(/\(.*\)/, ""), "trackTitle");
										}
										if (tabTitleParts[i].indexOf("[") > -1 && tabTitleParts[i].indexOf("]") > -1) {
											addOption(tabTitleParts[i].trim().replace(/\[.*\]/, ""), "trackTitle");
										}
									}
									addOption(tempResults[0].trim(), "trackTitle");
									if (tempResults[0].indexOf("(") > -1 && tempResults[0].indexOf(")") > -1) {
										addOption(tempResults[0].trim().replace(/\(.*\)/, ""), "trackTitle");
									}
									if (tempResults[0].indexOf("[") > -1 && tempResults[0].indexOf("]") > -1) {
										addOption(tempResults[0].trim().replace(/\[.*\]/, ""), "trackTitle");
									}
									addOption("None of the above (specify)", "trackTitle");
									nextBtn.style.display = "block";
									addBtn.style.display = "none";
									nextBtn.onclick = function(event) {
										showSpinner("Searching for mix...");
										searchForTracks().then(function(searchResult) {
											var searchResponse = JSON.parse(searchResult.target.response);
											var tracksFound = false;
											for (i = 0; i < searchResponse.length; i++) {
												if ("results" in searchResponse[i]) {
													tracksFound = searchResponse[i]['results'];
													break;
												}
											}
											nextBtn.onclick = function(event) {
												question.innerHTML = "What type of music is this?<br><small><small>Select mix if not sure</small></small>";
												resetOptions();
												addOption("Track", "trackType");
												addOption("Liveset", "trackType");
												addOption("Performance", "trackType");
												addOption("Broadcast", "trackType");
												addOption("Mix", "trackType");
												nextBtn.style.display = "block";
												addBtn.style.display = "none";
												nextBtn.onclick = function(event) {
													showSpinner("Retrieving cover art from Mixcloud...");
													chrome.tabs.executeScript( 
														tabs[0].id, 
														{
															code: 'document.getElementsByClassName("player-cloudcast-image")[0].children[0].getAttribute("src");'
														},
														function(results) {
															// console.log(results[0]);
															if (results != undefined && results.length > 0) {
																if (results[0] != 0 && results[0] != undefined && results[0] != null && results[0] != "") {
																	hideSpinner();
																	question.innerHTML = "Is the following image the right cover art of this mix?";
																	coverSampleContainer.style.display = "block";
																	trackCoverUrl = results[0].replace("/52x52/","/1000x1000/");
																	coverSample.style.backgroundImage = 'url("'+trackCoverUrl+'")';
																	resetOptions();
																	addOption("Yes", "trackCover");
																	addOption("No", "trackCover");
																	nextBtn.style.display = "none";
																	addBtn.style.display = "block";
																	nextBtn.onclick = null;
																}
																else {
																	hideSpinner();
																	question.innerHTML = "An error occured";
																	optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to fetch cover art from Mixcloud. Continue without automatically uploading the cover?</div>";
																	nextBtn.style.display = "none";
																	addBtn.style.display = "block";
																}
															}
															else {
																hideSpinner();
																question.innerHTML = "An error occured";
																optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to fetch cover art from Mixcloud. Continue without automatically uploading the cover?</div>";
																nextBtn.style.display = "none";
																addBtn.style.display = "block";
															}
														}
													);
												};
											};
											hideSpinner();
											if (tracksFound !== false) {
												question.innerHTML = "Select the mix you're trying to edit";
												resetOptions();
												for (i = 0; i < tracksFound.length; i++) {
													addTrackOption(tracksFound[i], "editId", function(event) {
														selectOption(event);
														addBtn.style.display = "block";
														nextBtn.style.display = "none";
													});
												}
												addOption("None of the above", "editId", function(event) {
													selectOption(event);
													addBtn.style.display = "none";
													nextBtn.style.display = "block";
												});
											}
											else {
												// trigger onclick method of nextbtn, as no track was found
												nextBtn.onclick();
											}
										},
										function(e) {
											hideSpinner();
											question.innerHTML = "An error occured";
											optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to search for tracks on TunePlay. Try again later.</div>";
											nextBtn.style.display = "none";
											addBtn.style.display = "none";
										});
									};
								}
								else {
									hideSpinner();
									question.innerHTML = "Mix has already been added";
									optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Thanks for helping out though!</div>";
									nextBtn.style.display = "none";
									addBtn.style.display = "none";
								}
							},
							function(e) {
								hideSpinner();
								question.innerHTML = "An error occured";
								optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to check if the mix has already been added or not.</div>";
								nextBtn.style.display = "none";
								addBtn.style.display = "none";
							});
						}
						else {
							hideSpinner();
							question.innerHTML = "An error occured";
							optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to fetch information about this mix from Mixcloud. Cannot add this mix right now.</div>";
							nextBtn.style.display = "none";
							addBtn.style.display = "none";
						}
					}
					else {
						hideSpinner();
						question.innerHTML = "An error occured";
						optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to fetch information about this mix from Mixcloud. Cannot add this mix right now.</div>";
						nextBtn.style.display = "none";
						addBtn.style.display = "none";
					}
				}
				else {
					hideSpinner();
					question.innerHTML = "An error occured";
					optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to fetch information about this mix from Mixcloud. Cannot add this mix right now.</div>";
					nextBtn.style.display = "none";
					addBtn.style.display = "none";
				}
			}
		);
	}
	else {
		hideSpinner();
		question.innerHTML = "No track to add detected";
		optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;' id='manual' class='button'><img src='../images/ic_add_white_24dp_2x.png' /><span>Manually add a track using the TunePlay Editor</span></div>";
		document.getElementById("manual").onclick = function(event) {
			showSpinner("Opening the TunePlay Editor...");
			chrome.tabs.create({
				url: "https://www.tuneplay.net/edit.php?type=track",
				active: true
			});
		};
		nextBtn.style.display = "none";
		addBtn.style.display = "none";
	}
});

nextBtn.onclick = null;

function addToTP() {
	coverSampleContainer.style.display = "none";
	showSpinner("Adding " + trackType.toLowerCase() + " to TunePlay...");
	if (trackTitle == null) {
		trackTitle = document.getElementById("option-selected").innerText;
	}
	var params = "";
	// console.log(trackTitle);
	if (trackTitle == "None of the above" || trackTitle == null || trackTitle == "" || trackTitle == "None of the above (specify)") {
		params = urlIdType+"="+urlId;
	}
	else {
		if (editId == "None of the above" || editId == null) {
			params = "title="+encodeURIComponent(trackTitle)+"&"+urlIdType+"="+urlId;
		}
		else {
			params = urlIdType+"="+urlId;
		}
	}
	
	if (trackCover == "Yes" && trackCoverUrl != "" && trackCoverUrl != null) {
		params += "&img_url="+encodeURIComponent(trackCoverUrl);
	}
	
	if (trackType == "Track") {
		params += "&type=1";
	}
	else if (trackType == "Liveset") {
		params += "&type=2";
	}
	else if (trackType == "Performance") {
		params += "&type=3";
	}
	else if (trackType == "Broadcast") {
		params += "&type=4";
	}
	else if (trackType == "Mix") {
		params += "&type=5";
	}
	else {
		trackType = "Track";
		// set trackType, but do not send it to the server, as it has not been verified by the user.
		// the string is only used for on-screen text afterwards.
	}
	
	var editUrl = 'https://www.tuneplay.net/edittrack.php?editor=TunePlay%20Extension';
	if (editId == "None of the above" || editId == null) {
		editUrl += "&create=true";
	}
	else {
		params += "&id="+encodeURIComponent(editId);
	}
	
	var addXhr = new XMLHttpRequest();
	addXhr.open('POST', editUrl);
	addXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	addXhr.setRequestHeader ("enctype", "multipart/form-data");
	addXhr.onload = function() {
		var response = addXhr.responseText;
		var responseJSON = JSON.parse(response);
		
		if (editId == "None of the above" || editId == null) {
			var opened = false;
			for (var i = 0; i < responseJSON.length; i++) {
				// console.log(responseJSON[i]["message"]);
				if ("id" in responseJSON[i]) {
					opened = true;
					showSpinner("Opening " + trackType.toLowerCase() + " in the TunePlay Editor...");
					chrome.tabs.create({
						url: "https://www.tuneplay.net/edit.php?type=track&id=" + responseJSON[i]["id"],
						active: true
					});
				}
			}
			
			// default error message
			var errorMsg = "You could try adding it manually";
			if (!opened) {
				// detect error message
				for (var i = 0; i < responseJSON.length; i++) {
					// console.log(responseJSON[i]["type"]);
					// console.log(responseJSON[i]["message"]);
					if (responseJSON[i]["type"] == "error") {
						errorMsg = responseJSON[i]["message"];
						break;
					}
				}
				
				if (errorMsg == undefined) {
					errorMsg = "You could try adding it manually";
				}
				
				hideSpinner();
				question.innerHTML = "An error occured";
				optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'>Unable to add " + trackType.toLowerCase() + " to the TunePlay database.<br><small>"+errorMsg+".</small></div>";
				nextBtn.style.display = "none";
				addBtn.style.display = "none";
			}
		}
		else {
			hideSpinner();
			question.innerHTML = trackType + " has been edited";
			optionBox.innerHTML = "<div style='text-align: center; padding: 14px; font-size: 14px;'><img src='../images/ic_done_white_24dp_2x.png' /><br>It is now available for the world to play using TunePlay. Thanks!</div>";
			nextBtn.style.display = "none";
			addBtn.style.display = "none";
		}
	};
	addXhr.send(params);
}

addBtn.onclick = function(event) {
	addToTP();
};