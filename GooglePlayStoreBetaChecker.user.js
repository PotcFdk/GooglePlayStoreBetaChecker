// ==UserScript==
// @author      PotcFdk
// @name        Google Play Store Beta Checker
// @namespace   https://github.com/PotcFdk/GooglePlayStoreBetaChecker
// @description Checks if a beta program is available or active for any given app.
// @include     https://play.google.com/store/apps/details*
// @version     0.2.0
// @grant       none
// @downloadURL https://raw.githubusercontent.com/PotcFdk/GooglePlayStoreBetaChecker/master/GooglePlayStoreBetaChecker.user.js
// @updateURL   https://raw.githubusercontent.com/PotcFdk/GooglePlayStoreBetaChecker/master/GooglePlayStoreBetaChecker.meta.js
// ==/UserScript==

/*
	Google Play Store Beta Checker - Copyright (c) PotcFdk, 2017

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

function doProcess () {
	var ajax_failures = 0;

	function ajax(appid, showTxt)
	{
		var testurl = "https://play.google.com/apps/testing/" + appid;
		var xhr = new XMLHttpRequest();
		xhr.responseType = "document";
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState == 4 && xhr.status == 200)
			{
				console.log("Processed GPlay testing page request: " + appid);
				showTxt();
				
				if (xhr.response.getElementsByClassName("alreadyTester").length > 0) {
					showTxt("Beta active!", testurl, true);
				} else {
					var inputs = xhr.response.getElementsByTagName("input");
					var i;
					for (i = 0; i < inputs.length; i++) {
						if (inputs[i].className == "action") {
							showTxt("Beta available!", testurl, false);
							break;
						}
					}
				}
			}
			else if (xhr.readyState == 4)
			{
				if (ajax_failures++ < 3)
				{
					console.log ("Failed AJAX (HTTP status " + xhr.status + "). Retrying (" + ajax_failures + "/3)...");
					ajax();
				}
				else
				{
					console.log ("Failed AJAX (HTTP status " + xhr.status + "). Retrying using the classic button click method...");
				}
			}
		};
		xhr.open("GET", testurl, true);
		xhr.withCredentials = true;
		xhr.send();
	}
			
	switch (window.location.pathname) {
		case "/store/apps/details":
			window.location.search.substr(1).split("&").forEach(function (item) {
				tmp = item.split("=");
				if (tmp[0] === "id")
					appid = decodeURIComponent(tmp[1]);
			});

			var showTxtObj;

			function showTxt(str, url)
			{
				if (!str) { showTxtObj.innerHTML = ""; return; }
				
				console.log(str);
				
				if (!showTxtObj) {
					var l_info = document.getElementsByClassName("left-info");
					showTxtObj = l_info[l_info.length-1].getElementsByTagName("span")[0].cloneNode(true);
					l_info[l_info.length-1].appendChild(showTxtObj);
				}
				
				showTxtObj.innerHTML = '<a target="_blank" href="' + url + '">' + str + '</a>';
			}

			showTxt("Loading Beta status...")
			ajax(appid, showTxt);
			break;
			
		case "/apps":
			var cards = document.getElementsByClassName("card");
			var i;
			for (i = 0; i < cards.length; i++) {
				var already_handled = cards[i].getAttribute("gpsbc-already-handled");
				if (already_handled != "true") {
					cards[i].setAttribute("gpsbc-already-handled", true);
					
					var appid = cards[i].getAttribute("data-docid");
					
					var reason_set = cards[i].getElementsByClassName("reason-set")[0];
					var ratingline = reason_set.getElementsByClassName("reason-set-star-rating")[0];
					var span = document.createElement("span");
					ratingline.appendChild(span);
					
					(function (reason_set, span) {
					ajax(appid, function(str, url, active) {
						if (!str) return;
						reason_set.style.backgroundColor = active ? "rgba(0,255,0,0.2)" : "rgba(0,0,255,0.2)";
						span.textContent = str;
					});
					})(reason_set, span);
				}
			}
	}
};

var url = document.location.toString();
document.querySelector('html').addEventListener('DOMNodeInserted', function(ev){
	var new_url = document.location.toString();
	if (document.location.pathname != "/apps" && url == new_url) return;
	url = new_url;
	doProcess();
});

doProcess();