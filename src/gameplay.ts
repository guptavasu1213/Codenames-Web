declare const doT: any;
var gameStat = (<HTMLInputElement>document.querySelector("#gamestat")).querySelectorAll("td");

(<HTMLInputElement>document.querySelector("#homeButton")).innerHTML = '<a href="/"><img src="../images/homebutton.png">';

let socket = new WebSocket("ws://localhost:8080/api/v1/games/" + window.location.pathname.replace("/", ""));
console.log("Attempting Websocket Connection");
socket.onopen = () => {
	console.log("Websocket Succesfully Connected");
};
socket.onclose = (event) => {
	console.log("Socket Closed Donnection", event);
};
socket.onerror = (error) => {
	console.log("Socket error: ", error);
};
socket.onmessage = (msg) => {
	var gameState = JSON.parse(msg.data);

	console.log("======================================================");

	console.log("Turn: ", gameState["turn"]);
	console.log("RECEIVED: ", gameState);

	// setting game stats on the top of the gameboard
	if (gameState["teamName"] != "Spymaster") {
		gameStat[0].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"]; // r1c1
		gameStat[1].innerHTML = "<h3>" + gameState["teamName"] + "'s Room</h3><h2> " + gameState["turn"] + "'s Turn </h2>";
		gameStat[2].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"]; // r1c3
	} else {
		gameStat[1].innerHTML = "<h3>" + gameState["teamName"] + "'s Room</h3><h2> " + gameState["turn"] + "'s Turn </h2>";
	}

    // using doT.js to fill in the card labels
	var template = (<HTMLInputElement>document.querySelector("#gameplay-template")).innerHTML;
	var renderedFN = doT.template(template);
	var renderResult = renderedFN(gameState["cards"]);
	(<HTMLInputElement>document.querySelector("#gameplay-filled")).innerHTML = renderResult;

	// defining the board
	var gameBoard = (<HTMLInputElement>document.querySelector("#gameboard")).querySelectorAll("td");

	var i;
	for (i = 0; i < gameState["cards"].length; i++) {
		// changing cards color for players
		if (gameState["cards"][i]["visible"]) {
			switch (gameState["cards"][i]["owner"]) {
				case "Blue":
					gameBoard[i].style.backgroundColor = "#3498DB";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Red":
					gameBoard[i].style.backgroundColor = "#E74C3C";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Bystander":
					gameBoard[i].style.backgroundColor = "#95A5A6";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Assassin":
					gameBoard[i].style.backgroundColor = "#17202A";
					gameBoard[i].style.fontWeight = "Bold";
					break;
			}
		}
		// changing cards to the spy master - if the card is visible
		if (gameState["teamName"] == "Spymaster") {
			if (gameState["cards"][i]["visible"]) {
				switch (gameState["cards"][i]["owner"]) {
					case "Blue":
						gameBoard[i].style.backgroundColor = "#3498DB";
						gameBoard[i].style.fontWeight = "Bold";
						break;
					case "Red":
						gameBoard[i].style.backgroundColor = "#E74C3C";
						gameBoard[i].style.fontWeight = "Bold";
						break;
					case "Bystander":
						gameBoard[i].style.backgroundColor = "#95A5A6";
						gameBoard[i].style.fontWeight = "Bold";
						break;
					case "Assassin":
						gameBoard[i].style.backgroundColor = "#17202A";
						gameBoard[i].style.color = "White";
						gameBoard[i].style.fontWeight = "Bold";
						break;
				}
				// changing cards to the spy master - if the card is not visible
			} else {
				switch (gameState["cards"][i]["owner"]) {
					case "Blue":
						gameBoard[i].style.color = "#3498DB";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Red":
						gameBoard[i].style.color = "#E74C3C";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Bystander":
						gameBoard[i].style.color = "#95A5A6";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Assassin":
						gameBoard[i].style.color = "#17202A";
						gameBoard[i].style.fontWeight = "950";
						break;
				}
			}
		}

		// indicate cannot click if not your turn
		if (gameState["teamName"] != gameState["turn"] || gameState["cards"][i]["visible"] || gameState["hasEnded"]) {
			gameBoard[i].style.cursor = "not-allowed";
		}
	}

	(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
	(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "hidden";

	var gameWinner;

	// if the game ended

	// Case 1 - Assassin card clicked durring game play
	// Turn X, Winner Y
	//if the gameState indicates ended but there are cards remaining for both teams
	if (gameState["hasEnded"] && gameState["blueCardsRemaining"] > 0 && gameState["redCardsRemaining"] > 0) {
		console.log("Game Ended - Caused by Assassin Card");
		if (gameState["turn"] == "Blue") {
			gameWinner = "Red Team Won";
		} else {
			gameWinner = "Blue Team Won";
		}
		gameStat[0].innerHTML = "";
		gameStat[1].innerHTML = "<h1>" + gameWinner + "<h1>";
		gameStat[2].innerHTML = "";

		(<HTMLInputElement>document.querySelector("#newGame")).innerHTML = "New Game";
		(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "visible";
		(<HTMLInputElement>document.querySelector("#newGame")).addEventListener("click", onNewGameClick);

		// end game card reveal

		var i;
		for (i = 0; i < gameState["cards"].length; i++) {
			if (gameState["cards"][i]["owner"] != "N/A") {
				switch (gameState["cards"][i]["owner"]) {
					case "Blue":
						gameBoard[i].style.color = "#3498DB";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Red":
						gameBoard[i].style.color = "#E74C3C";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Bystander":
						gameBoard[i].style.color = "#95A5A6";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Assassin":
						gameBoard[i].style.color = "White";
						gameBoard[i].style.fontWeight = "950";
						break;
				}
			}
			if (gameState["cards"][i]["visible"]) {
				if (gameState["cards"][i]["owner"] == "Assassin") {
					gameBoard[i].style.color = "White";
				} else {
					gameBoard[i].style.color = "Black";
				}
				console.log("Card turned to black", gameBoard[i].innerHTML);
			}
		}
	}

	// Case 2 - Player has no cards left
	// Turn X, Winner X
	if (gameState["hasEnded"]) {
		if (gameState["blueCardsRemaining"] == 0 || gameState["redCardsRemaining"] == 0) {
			gameWinner = gameState["turn"] + " Team Won";
		}
		gameStat[0].innerHTML = "";
		gameStat[1].innerHTML = "<h1>" + gameWinner + "<h1>";
		gameStat[2].innerHTML = "";

		(<HTMLInputElement>document.querySelector("#newGame")).innerHTML = "New Game";
		(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "visible";
		(<HTMLInputElement>document.querySelector("#newGame")).addEventListener("click", onNewGameClick);

		// end game card reveal

		var i;
		for (i = 0; i < gameState["cards"].length; i++) {
			if (gameState["cards"][i]["owner"] != "N/A") {
				switch (gameState["cards"][i]["owner"]) {
					case "Blue":
						gameBoard[i].style.color = "#3498DB";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Red":
						gameBoard[i].style.color = "#E74C3C";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Bystander":
						gameBoard[i].style.color = "#95A5A6";
						gameBoard[i].style.fontWeight = "950";
						break;
					case "Assassin":
						gameBoard[i].style.color = "#17202A";
						gameBoard[i].style.fontWeight = "950";
						break;
				}
			}
			if (gameState["cards"][i]["visible"]) {
				if (gameState["cards"][i]["owner"] == "Assassin") {
					gameBoard[i].style.color = "White";
				} else {
					gameBoard[i].style.color = "Black";
				}
				console.log("Card turned to black", gameBoard[i].innerHTML);
			}
		}
	}

	function onNewGameClick() {
		console.log("New Game Button Pressed");
		sendUpdate(null, null, true);
		(<HTMLInputElement>document.querySelector("#newGame")).style.visibility = "hidden";
		console.log("New Game Started");
	}

	// if team on streak and needs to end turn
	if (gameState["streak"] > 0 && gameState["teamName"] == gameState["turn"]) {
		console.log("Game Streak Detected! | Streak : ", gameState["streak"]);
		(<HTMLInputElement>document.querySelector("#endTurn")).innerHTML = "End Turn";
		(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "visible";
		(<HTMLInputElement>document.querySelector("#endTurn")).addEventListener("click", onEndTurnClick);

		function onEndTurnClick() {
			console.log("End Turn Button Pressed");
			var turnBefore = gameState["turn"];
			sendUpdate(5, true, false);
			var turnAfter = gameState["turn"];
			(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
			console.log("Turn Ended!");
		}
	}

	if (gameState["hasEnded"] && gameState["streak"] > 0) {
		console.log("GAME ENDED WHILE ON STREAK | Game State: ", gameState["hasEnded"], "Streak: ", gameState["streak"]);
		(<HTMLInputElement>document.querySelector("#endTurn")).style.visibility = "hidden";
	} else {
		console.log("all good | Game State: ", gameState["hasEnded"], "Streak: ", gameState["streak"]);
	}

	// adding event listener to cadrds
	gameBoard[0].addEventListener("click", card1Clicked);
	gameBoard[1].addEventListener("click", card2Clicked);
	gameBoard[2].addEventListener("click", card3Clicked);
	gameBoard[3].addEventListener("click", card4Clicked);
	gameBoard[4].addEventListener("click", card5Clicked);
	gameBoard[5].addEventListener("click", card6Clicked);
	gameBoard[6].addEventListener("click", card7Clicked);
	gameBoard[7].addEventListener("click", card8Clicked);
	gameBoard[8].addEventListener("click", card9Clicked);
	gameBoard[9].addEventListener("click", card10Clicked);
	gameBoard[10].addEventListener("click", card11Clicked);
	gameBoard[11].addEventListener("click", card12Clicked);
	gameBoard[12].addEventListener("click", card13Clicked);
	gameBoard[13].addEventListener("click", card14Clicked);
	gameBoard[14].addEventListener("click", card15Clicked);
	gameBoard[15].addEventListener("click", card16Clicked);
	gameBoard[16].addEventListener("click", card17Clicked);
	gameBoard[17].addEventListener("click", card18Clicked);
	gameBoard[18].addEventListener("click", card19Clicked);
	gameBoard[19].addEventListener("click", card20Clicked);
	gameBoard[20].addEventListener("click", card21Clicked);
	gameBoard[21].addEventListener("click", card22Clicked);
	gameBoard[22].addEventListener("click", card23Clicked);
	gameBoard[23].addEventListener("click", card24Clicked);
	gameBoard[24].addEventListener("click", card25Clicked);

	function card1Clicked() {
		if (gameState["cards"][0]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(1, false, false);
		}
	}

	function card2Clicked() {
		if (gameState["cards"][1]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(2, false, false);
		}
	}

	function card3Clicked() {
		if (gameState["cards"][2]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(3, false, false);
		}
	}

	function card4Clicked() {
		if (gameState["cards"][3]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(4, false, false);
		}
	}

	function card5Clicked() {
		if (gameState["cards"][4]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(5, false, false);
		}
	}
	function card6Clicked() {
		if (gameState["cards"][5]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(6, false, false);
		}
	}
	function card7Clicked() {
		if (gameState["cards"][6]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(7, false, false);
		}
	}
	function card8Clicked() {
		if (gameState["cards"][7]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(8, false, false);
		}
	}
	function card9Clicked() {
		if (gameState["cards"][8]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(9, false, false);
		}
	}
	function card10Clicked() {
		if (gameState["cards"][9]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(10, false, false);
		}
	}
	function card11Clicked() {
		if (gameState["cards"][10]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(11, false, false);
		}
	}
	function card12Clicked() {
		if (gameState["cards"][11]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(12, false, false);
		}
	}
	function card13Clicked() {
		if (gameState["cards"][12]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(13, false, false);
		}
	}
	function card14Clicked() {
		if (gameState["cards"][13]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(14, false, false);
		}
	}
	function card15Clicked() {
		if (gameState["cards"][14]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(15, false, false);
		}
	}
	function card16Clicked() {
		if (gameState["cards"][15]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(16, false, false);
		}
	}
	function card17Clicked() {
		if (gameState["cards"][16]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(17, false, false);
		}
	}
	function card18Clicked() {
		if (gameState["cards"][17]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(18, false, false);
		}
	}
	function card19Clicked() {
		if (gameState["cards"][18]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(19, false, false);
		}
	}
	function card20Clicked() {
		if (gameState["cards"][19]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(20, false, false);
		}
	}
	function card21Clicked() {
		if (gameState["cards"][20]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(21, false, false);
		}
	}
	function card22Clicked() {
		if (gameState["cards"][21]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(22, false, false);
		}
	}
	function card23Clicked() {
		if (gameState["cards"][22]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(23, false, false);
		}
	}
	function card24Clicked() {
		if (gameState["cards"][23]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(24, false, false);
		}
	}
	function card25Clicked() {
		if (gameState["cards"][24]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
			sendUpdate(25, false, false);
		}
	}
};

function sendUpdate(cardNumber: any, endTurn: any, nextGame: any) {
	let updateJSON = JSON.stringify({
		cardClickedNumber: cardNumber,
		endTurnClicked: endTurn,
		nextGameInitiated: nextGame,
	});

	console.log("SENT: ", updateJSON);

	socket.send(updateJSON);
	console.log("Update Send Through Web Socket");
}
