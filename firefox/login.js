setInterval(function() {
	chrome.cookies.get({url: 'https://www.tuneplay.net', name: 'session_login'}, function(cookie) {
		if (cookie && cookie.value === "true") {
			// login successfull
			window.location.href = "popup.html";
		}
	});
}, 250);