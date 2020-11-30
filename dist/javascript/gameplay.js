document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';

var gameStat = document.querySelector("#gamestat").querySelectorAll("td")

let socket = new WebSocket("ws://localhost:8080/api/v1/games/" + (window.location.pathname).replace("/", ""))
console.log("Attempting websockt connection")
socket.onopen = () => { console.log("Succesfully connected!") }
socket.onclose = (event) => { console.log("Socket closed connection", event) }
socket.onerror = (error) => { console.log("Socket error: ", error) }
socket.onmessage = (msg) => {
    gameState = JSON.parse(msg.data)
    console.log(gameState)

    // setting game stats on the top of the gameboard
    if (gameState["teamName"] != "Spymaster") {
        gameStat[1].innerHTML = "<h2>" + gameState["teamName"] + "'s Room</h2>"
        gameStat[3].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"] // r1c1
        gameStat[4].innerHTML = "--- " + gameState["turn"] + "'s Turn --- "       // r1c2
        gameStat[5].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"]   // r1c3
    } else {
        gameStat[1].innerHTML = "<h2>" + gameState["teamName"] + "'s Room</h2>"
    }

    // using doT.js to fill in the card labels
    var template = document.querySelector("#gameplay-template").innerHTML;
    var renderedFN = doT.template(template);
    var renderResult = renderedFN(gameState["cards"]);
    document.querySelector("#gameplay-filled").innerHTML = renderResult; 

    // using classes to change cards color to reflect game
    var gameBoard = document.querySelector("#gameboard").querySelectorAll("td")
    var i;
    for (i = 0; i < gameState["cards"].length; i++) {
        if (gameState["cards"][i]["visible"]) {
            switch (gameState["cards"][i]["owner"]) {
                case "Blue":
                    gameBoard[i].style.backgroundColor = "Blue"
                    gameBoard[i].style.fontWeight = "Bold"
                    break;
                case "Red":
                    gameBoard[i].style.backgroundColor = "Red"
                    gameBoard[i].style.fontWeight = "Bold"
                    break;
                case "Bystander":
                    gameBoard[i].style.backgroundColor = "Gray"
                    gameBoard[i].style.fontWeight = "Bold"
                    break;
                case "Assassin":
                    gameBoard[i].style.backgroundColor = "Brown"
                    gameBoard[i].style.fontWeight = "Bold"
                    break;
            }
        }
    }

}

// add event listeners to each squre


socket.onopen = () => {
    console.log("Succesfully connected!")
    let updateJSON = JSON.stringify(
        {
            cardClickedNumber: 6,
            endTurnClicked: false,
            nextGameInitiated: false
        }
    )
    socket.send(updateJSON)
    console.log("State Update Sent")
}

socket.onclose = (event) => { console.log("Socket closed connection", event) }
socket.onerror = (error) => { console.log("Socket error: ", error) }







