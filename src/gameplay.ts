// stores gameState data received from web socket
var gameState: any;

// declaring doT as any
declare const doT: any;

// adds the home button to the gameplay screen
(<HTMLInputElement>document.querySelector("#homeButton")).innerHTML = '<a href="/"><img src="../images/homebutton.png">';

// stores the web socket created to exchange data
var socket = new WebSocket("ws://localhost:8080/api/v1/games/" + window.location.pathname.replace("/", ""));

console.log("Attempting Websocket Connection");

socket.onopen = function () {
	console.log("Websocket Succesfully Connected");
};
socket.onclose = function (event) {
	console.log("Socket Closed Donnection", event);
};
socket.onerror = function (error) {
	console.log("Socket error: ", error);
};
socket.onmessage = function (msg) {
	gameState = JSON.parse(msg.data);

	// clearning button residue
	(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
	(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "hidden";

	// loggin the player turn and data received by socket
	logTurnAndData();

	// using doT.js to fill in the card labels
	addCardLabels(gameState["cards"]);

	// updating game stats on top of the game board
	updateGameStats(gameState);

	// defining the board
	var gameBoard = (<HTMLInputElement>document.querySelector("#gameboard")).querySelectorAll("td");

	// styling cards accoding to visibility and owners
	styleCards(gameState, gameBoard);

	// adding event listeners to cards
	addEventListeners(gameState, gameBoard);

	if (gameState["hasEnded"]) {
		gameEnded();
	}

	// if team on streak and needs to end turn
	if (gameState["streak"] > 0 && gameState["teamName"] == gameState["turn"]) {
		gameStreak();
	}
};

//####################################################################################
// Helped Functions
//####################################################################################

function logTurnAndData() {
	console.log("======================================================");
	console.log("Turn: ", gameState["turn"]);
	console.log("RECEIVED: ", gameState);
	console.log("Turn and Socket Data logged");
}

function sendUpdate(cardNumber: any, endTurn: any, nextGame: any) {
	var updateJSON = JSON.stringify({
		cardClickedNumber: cardNumber,
		endTurnClicked: endTurn,
		nextGameInitiated: nextGame,
	});
	console.log("SENT: ", updateJSON);
	socket.send(updateJSON);
	console.log("Update Send Through Web Socket");
}

function addCardLabels(gameState: any) {
	var template = (<HTMLInputElement>document.querySelector("#gameplay-template")).innerHTML;
	var renderedFN = doT.template(template);
	var renderResult = renderedFN(gameState);
	(<HTMLInputElement>document.querySelector("#gameplay-filled")).innerHTML = renderResult;
	console.log("Card Labels Added");
}

function updateGameStats(gameState: any) {
	gameStat[0].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"]; // r1c1
	gameStat[1].innerHTML = "<h3>" + gameState["teamName"] + "'s Room</h3><h2> " + gameState["turn"] + "'s Turn </h2>";
	gameStat[2].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"]; // r1c3
	console.log("Game Stats Updated");
}

function onNewGameClick() {
	sendUpdate(null, null, true);
	(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "hidden";
	console.log("New Game Button Pressed");
	(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "hidden";
}

function onEndTurnClick() {
	console.log("End Turn Button Pressed");
	var turnBefore = gameState["turn"];
	sendUpdate(5, true, false);
	var turnAfter = gameState["turn"];
	(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
	console.log("End Turn Button Pressed");
}

function gameStreak() {
	console.log("Game Streak Detected! | Streak : ", gameState["streak"]);
	(<HTMLInputElement>document.querySelector("#endTurn")).innerHTML = "End Turn";
	(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "visible";
	(<HTMLInputElement>document.querySelector("#endTurn")).addEventListener("click", onEndTurnClick);
	if (gameState["hasEnded"]) {
		(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
	}
}

function gameEnded() {
	var gameWinner;
	if (gameState["blueCardsRemaining"] > 0 && gameState["redCardsRemaining"] > 0) {
		console.log("Game Ended - Caused by Assassin Card");
		if (gameState["turn"] == "Blue") {
			gameWinner = "Red Team Won";
		} else {
			gameWinner = "Blue Team Won";
		}
	}

	if (gameState["blueCardsRemaining"] == 0 || gameState["redCardsRemaining"] == 0) {
		gameWinner = gameState["turn"] + " Team Won";
		console.log("Game Ended - Caused by No remaining Card");
	}

	gameStat[0].innerHTML = "";
	gameStat[1].innerHTML = "<h1>" + gameWinner + "<h1>";
	gameStat[2].innerHTML = "";
	(<HTMLInputElement>document.querySelector("#newGame")).innerHTML = "New Game";
	(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "visible";
	(<HTMLInputElement>document.querySelector("#newGame")).addEventListener("click", onNewGameClick);
}

function addEventListeners(gameState: any, gameBoard: any) {
	var i;
	for (i = 0; i < 25; i++) {
		let j = i;

		gameBoard[i].addEventListener(
			"click",
			function (event: any) {
				if (gameState["cards"][j]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
					sendUpdate(j + 1, false, false);
				}
			},
			false
		);
	}
	console.log("Event Listeners Added");
}

function styleCards(gameState: any, gameBoard:any) {
	var i;
	for (i = 0; i < gameState["cards"].length; i++) {
		gameBoard[i].className = "defaultClass";

		switch (gameState["cards"][i]["owner"]) {
			//##################################################################
			case "Blue":
				if (gameState["hasEnded"]) {
					if (gameState["cards"][i]["owner"] != "N/A") {
						gameBoard[i].className = "blueCard-gameEnded-noOwner";
					}
					if (gameState["cards"][i]["visible"]) {
						gameBoard[i].className = "blueCard-gameEnded-cardVisible";
					}
				} else {
					// spymaster team
					if (gameState["teamName"] == "Spymaster") {
						if (gameState["cards"][i]["visible"]) {
							gameBoard[i].className = "blueCard-gameAlive-spymaster-cardVisible";
						} else {
							gameBoard[i].className = "blueCard-gameAlive-spymaster-cardNotVisible";
						}
						// not spymaster team
					} else {
						gameBoard[i].className = "blueCard-gameAlive-notSpymaster";
					}
				}
				break;

			//##################################################################
			case "Red":
				if (gameState["hasEnded"]) {
					if (gameState["cards"][i]["owner"] != "N/A") {
						gameBoard[i].className = "redCard-gameEnded-noOwner";
					}
					if (gameState["cards"][i]["visible"]) {
						gameBoard[i].className = "redCard-gameEnded-cardVisible";
					}
				} else {
					// spymaster team
					if (gameState["teamName"] == "Spymaster") {
						if (gameState["cards"][i]["visible"]) {
							gameBoard[i].className = "redCard-gameAlive-spymaster-cardVisible";
						} else {
							gameBoard[i].className = "redCard-gameAlive-spymaster-cardNotVisible";
						}
						// not spymaster team
					} else {
						gameBoard[i].className = "redCard-gameAlive-notSpymaster";
					}
				}
				break;

			//##################################################################
			case "Bystander":
				if (gameState["hasEnded"]) {
					if (gameState["cards"][i]["owner"] != "N/A") {
						gameBoard[i].className = "bystanderCard-gameEnded-noOwner";
					}
					if (gameState["cards"][i]["visible"]) {
						gameBoard[i].className = "bystanderCard-gameEnded-cardVisible";
					}
				} else {
					// spymaster team
					if (gameState["teamName"] == "Spymaster") {
						if (gameState["cards"][i]["visible"]) {
							gameBoard[i].className = "bystanderCard-gameAlive-spymaster-cardVisible";
						} else {
							gameBoard[i].className = "bystanderCard-gameAlive-spymaster-cardNotVisible";
						}
						// not spymaster team
					} else {
						gameBoard[i].className = "bystanderCard-gameAlive-notSpymaster";
						// gameBoard[i].style.backgroundColor = "#95A5A6";
						// gameBoard[i].style.fontWeight = "Bold";
					}
				}
				break;

			//##################################################################
			case "Assassin":
				if (gameState["hasEnded"]) {
					if (gameState["cards"][i]["owner"] != "N/A") {
						gameBoard[i].className = "assassinCard-gameEnded-noOwner";
					}
					if (gameState["cards"][i]["visible"]) {
						gameBoard[i].className = "assassinCard-gameEnded-cardVisible";
					}
				} else {
					// spymaster team
					if (gameState["teamName"] == "Spymaster") {
						if (gameState["cards"][i]["visible"]) {
							gameBoard[i].className = "assassinCard-gameAlive-spymaster-cardVisible";
						} else {
							gameBoard[i].className = "assassinCard-gameAlive-spymaster-cardNotVisible";
						}
						// not spymaster team
					} else {
						gameBoard[i].className = "assassinCard-gameAlive-notSpymaster";
					}
				}
				break;
		}

		// indicate cannot click if not your turn
		if (gameState["teamName"] != gameState["turn"] || gameState["cards"][i]["visible"] || gameState["hasEnded"]) {
			gameBoard[i].style.cursor = "not-allowed";
		}
	}
	console.log("Cards Styled");
}
