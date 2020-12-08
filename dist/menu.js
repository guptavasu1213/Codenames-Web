"use strict";
function attachCreateRoomListener() {
    var createLink = document.querySelector("#createLink");
    createLink.addEventListener("click", onCreateRoomClick);
}
function attachJoinRoomListener() {
    var joinLink = document.querySelector("#joinLink");
    joinLink.addEventListener("click", OnJoinRoomClick);
}
function attachRulesListener() {
    var rulesLink = document.querySelector("#rulesLink");
    rulesLink.addEventListener("click", OnRulesClick);
}
function onCreateRoomClick() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            var links = JSON.parse(req.response);
            var blueLink = links.blueCode;
            var redLink = links.redCode;
            var spyLink = links.spyCode;
            document.querySelector("#blueLinkText").innerHTML = "Blue Room";
            document.querySelector("#redLinkText").innerHTML = "Red Room";
            document.querySelector("#spyLinkText").innerHTML = "Spy Room";
            document.querySelector("#blueLink").innerHTML = blueLink;
            document.querySelector("#blueLink").addEventListener("click", onBlueLinkClick);
            function onBlueLinkClick(event) {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#blueLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                if (event.altKey) {
                    window.open("/" + document.querySelector("#blueLink").innerHTML);
                }
                else {
                    document.querySelector("#blueLink").innerHTML = "link copied";
                    setTimeout(function () {
                        document.querySelector("#blueLink").innerHTML = blueLink;
                    }, 200);
                }
            }
            document.querySelector("#redLink").innerHTML = redLink;
            document.querySelector("#redLink").addEventListener("click", onRedLinkClick);
            function onRedLinkClick(event) {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#redLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                if (event.altKey) {
                    window.open("/" + document.querySelector("#redLink").innerHTML);
                }
                else {
                    document.querySelector("#redLink").innerHTML = "link copied";
                    setTimeout(function () {
                        document.querySelector("#redLink").innerHTML = redLink;
                    }, 200);
                }
            }
            document.querySelector("#spyLink").innerHTML = spyLink;
            document.querySelector("#spyLink").addEventListener("click", onSpyLinkClick);
            function onSpyLinkClick(event) {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#spyLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                if (event.altKey) {
                    window.open("/" + document.querySelector("#spyLink").innerHTML);
                }
                else {
                    document.querySelector("#spyLink").innerHTML = "link copied";
                    setTimeout(function () {
                        document.querySelector("#spyLink").innerHTML = spyLink;
                    }, 200);
                }
            }
            document.querySelector("#hint").innerHTML = "Click on the room code to copy the link!<br>Then paste it to your friends!<br>Then click home and join the room!<br><br>Option-Click on the room code to open room in a new window!";
            document.querySelector("#createLink").style.display = "none";
            document.querySelector("#joinLink").style.display = "none";
            document.querySelector("#rulesLink").style.display = "none";
            document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';
        }
    };
    req.open("POST", "/api/v1/games");
    req.send();
}
function OnJoinRoomClick() {
    document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';
    document.querySelector("#createLink").style.display = "none";
    document.querySelector("#joinLink").style.display = "none";
    document.querySelector("#rulesLink").style.display = "none";
    document.querySelector("#joinText").innerHTML = "<br>Insert Room Code";
    document.querySelector("#joinCode").innerHTML = '<br><input type="text" id="joinCodeBox" maxlength="6">';
    document.querySelector("#joinCodeBox").focus();
    document.querySelector("#join").innerHTML = "Join Room";
    document.querySelector("#join").addEventListener("click", onJoinClick);
    function onJoinClick() {
        var roomCode = document.querySelector("#joinCodeBox").value;
        var loc = window.location;
        loc.assign("/" + roomCode);
    }
}
function OnRulesClick() {
    document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';
    document.querySelector("#createLink").style.display = "none";
    document.querySelector("#joinLink").style.display = "none";
    document.querySelector("#rulesLink").style.display = "none";
    document.querySelector("#rules").innerHTML = "Codenames is a game of guessing which codenames (i.e., words) in a set are related to a hint-word given by another player.<br><br>";
    document.querySelector("#allRulesLink").innerHTML = "Click here for all Rules";
    document.querySelector("#allRulesLink").addEventListener("click", onAllRulesClick);
    function onAllRulesClick() {
        var loc = window.location;
        loc.assign("https://czechgames.com/files/rules/codenames-rules-en.pdf");
    }
}
attachCreateRoomListener();
attachJoinRoomListener();
attachRulesListener();
