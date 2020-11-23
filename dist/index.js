function attachCreateRoomListener (){
    var createLink = document.querySelector("#createLink")
    createLink.addEventListener("click", onCreateRoomClick)
}

function onCreateRoomClick() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
            var links = JSON.parse(req.response);
            var blueLink = links.blueLink
            var redLink = links.redLink
            var spyLink = links.spyLink

            document.querySelector("#blueLinkText").innerHTML = "Blue Room"
            document.querySelector("#redLinkText").innerHTML = "Red Room"
            document.querySelector("#spyLinkText").innerHTML = "Spy Room"
            
            document.querySelector("#blueLink").innerHTML = blueLink
            document.querySelector("#blueLink").addEventListener("click", onBlueLinkClick)

            function onBlueLinkClick(){
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#blueLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                document.querySelector("#blueLink").innerHTML = "link coppied"
                setTimeout(function(){
                    document.querySelector("#blueLink").innerHTML = blueLink
                }, 200);  
            }
            
            document.querySelector("#redLink").innerHTML = redLink
            document.querySelector("#redLink").addEventListener("click", onRedLinkClick)

            function onRedLinkClick(){
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#redLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                document.querySelector("#redLink").innerHTML = "link coppied"
                setTimeout(function(){
                    document.querySelector("#redLink").innerHTML = redLink
                }, 200);  
            }

            document.querySelector("#spyLink").innerHTML = spyLink
            document.querySelector("#spyLink").addEventListener("click", onSpyLinkClick)

            function onSpyLinkClick(){
                var copyLink = document.createElement("input");
                copyLink.setAttribute("value", document.querySelector("#spyLink").innerHTML);
                document.body.appendChild(copyLink);
                copyLink.select();
                document.execCommand("copy");
                document.body.removeChild(copyLink);
                document.querySelector("#spyLink").innerHTML = "link coppied"
                setTimeout(function(){
                    document.querySelector("#spyLink").innerHTML = spyLink
                }, 200);  
            }









            document.querySelector("#hint").innerHTML = "Click on the room code to copy the link!<br>Then paste it to your friends!<br>Then click home and join the room!"

            document.querySelector("#createLink").style.display = "none"
            document.querySelector("#joinLink").style.display = "none"
            document.querySelector("#rulesLink").style.display = "none"

            document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="homebutton.png">'


        }
    }
    req.open("POST", "/api/v1/create");
    req.send();
    
}

attachCreateRoomListener()