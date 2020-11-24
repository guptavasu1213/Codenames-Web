function attachCreateRoomListener() {
    var createLink = (<HTMLInputElement>document.querySelector("#createLink"));
    createLink.addEventListener("click", onCreateRoomClick);
}

function attachJoinRoomListener() {
    var joinLink = (<HTMLInputElement>document.querySelector("#joinLink"));
    joinLink.addEventListener("click", OnJoinRoomClick);
}

function attachRulesListener() {
    var rulesLink = (<HTMLInputElement>document.querySelector("#rulesLink"));
    rulesLink.addEventListener("click", OnRulesClick);
}

function onCreateRoomClick() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            var links = JSON.parse(req.response);
            var blueLink = links.blueLink;
            var redLink = links.redLink;
            var spyLink = links.spyLink;

            (<HTMLInputElement>document.querySelector("#blueLinkText")).innerHTML = "Blue Room";
            (<HTMLInputElement>document.querySelector("#redLinkText")).innerHTML = "Red Room";
            (<HTMLInputElement>document.querySelector("#spyLinkText")).innerHTML = "Spy Room";

            (<HTMLInputElement>document.querySelector("#blueLink")).innerHTML = blueLink;
            (<HTMLInputElement>document.querySelector("#blueLink")).addEventListener("click", onBlueLinkClick);

            function onBlueLinkClick() {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", (<HTMLInputElement>document.querySelector("#blueLink")).innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                (<HTMLInputElement>document.querySelector("#blueLink")).innerHTML = "link coppied";
                setTimeout(function () {
                    (<HTMLInputElement>document.querySelector("#blueLink")).innerHTML = blueLink;
                }, 200);
            }

            (<HTMLInputElement>document.querySelector("#redLink")).innerHTML = redLink;
            (<HTMLInputElement>document.querySelector("#redLink")).addEventListener("click", onRedLinkClick);

            function onRedLinkClick() {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", (<HTMLInputElement>document.querySelector("#redLink")).innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                (<HTMLInputElement>document.querySelector("#redLink")).innerHTML = "link coppied";
                setTimeout(function () {
                    (<HTMLInputElement>document.querySelector("#redLink")).innerHTML = redLink;
                }, 200);
            }

            (<HTMLInputElement>document.querySelector("#spyLink")).innerHTML = spyLink;
            (<HTMLInputElement>document.querySelector("#spyLink")).addEventListener("click", onSpyLinkClick);

            function onSpyLinkClick() {
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", (<HTMLInputElement>document.querySelector("#spyLink")).innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                (<HTMLInputElement>document.querySelector("#spyLink")).innerHTML = "link coppied";
                setTimeout(function () {
                    (<HTMLInputElement>document.querySelector("#spyLink")).innerHTML = spyLink;
                }, 200);
            }

            (<HTMLInputElement>document.querySelector("#hint")).innerHTML = "Click on the room code to copy the link!<br>Then paste it to your friends!<br>Then click home and join the room!";

            (<HTMLInputElement>document.querySelector("#createLink")).style.display = "none";
            (<HTMLInputElement>document.querySelector("#joinLink")).style.display = "none";
            (<HTMLInputElement>document.querySelector("#rulesLink") ).style.display = "none";

            (<HTMLInputElement>document.querySelector("#homeButton")) .innerHTML = '<a href="/"><img src="../images/homebutton.png">';
        }
    }
    req.open("POST", "/api/v1/create");
    req.send();
}

function OnJoinRoomClick() {
    (<HTMLInputElement>document.querySelector("#homeButton")).innerHTML = '<a href="/"><img src="../images/homebutton.png">';
    (<HTMLInputElement>document.querySelector("#createLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#joinLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#rulesLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#joinText")).innerHTML = "<br>Insert Room Code";
    (<HTMLInputElement>document.querySelector("#joinCode")).innerHTML = '<br><input type="text" id="joinCodeBox" maxlength="6">';
    (<HTMLInputElement>document.querySelector("#joinCodeBox")).focus();
    (<HTMLInputElement>document.querySelector("#join")).innerHTML = "Join Room"; 
    (<HTMLInputElement>document.querySelector("#join")).addEventListener("click", onJoinClick);

    function onJoinClick() {
        var roomCode = (<HTMLInputElement>document.querySelector("#joinCodeBox")).value;
        var loc = window.location;
        loc.assign("/" + roomCode);
    }
}

function OnRulesClick() {
    (<HTMLInputElement>document.querySelector("#homeButton")).innerHTML = '<a href="/"><img src="../images/homebutton.png">';
    (<HTMLInputElement>document.querySelector("#createLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#joinLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#rulesLink")).style.display = "none";
    (<HTMLInputElement>document.querySelector("#rules")).innerHTML = "Codenames is a game of guessing which codenames (i.e., words) in a set are related to a hint-word given by another player.<br><br>";
    (<HTMLInputElement>document.querySelector("#allRulesLink")).innerHTML = "Click here for all Rules";
    (<HTMLInputElement>document.querySelector("#allRulesLink")).addEventListener("click", onAllRulesClick);

    function onAllRulesClick() {
        var loc = window.location;
        loc.assign("https://czechgames.com/files/rules/codenames-rules-en.pdf");
    }
}

attachCreateRoomListener();
attachJoinRoomListener();
attachRulesListener();