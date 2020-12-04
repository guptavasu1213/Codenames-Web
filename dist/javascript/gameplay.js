document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';

var gameStat = document.querySelector("#gamestat").querySelectorAll("td");

let socket = new WebSocket("ws://localhost:8080/api/v1/games/" + window.location.pathname.replace("/", ""));
console.log("Attempting websockt connection");
socket.onopen = () => {
	console.log("Succesfully connected!");
};
socket.onclose = (event) => {
	console.log("Socket closed connection", event);
};
socket.onerror = (error) => {
	console.log("Socket error: ", error);
};
socket.onmessage = (msg) => {
	gameState = JSON.parse(msg.data);
	console.log(gameState);

	// setting game stats on the top of the gameboard
	if (gameState["teamName"] != "Spymaster") {
		gameStat[0].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"]; // r1c1
		gameStat[1].innerHTML = "<h2>" + gameState["teamName"] + "'s Room</h2> <h3> " + gameState["turn"] + "'s Turn </h3>";
		gameStat[2].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"]; // r1c3
	} else {
		gameStat[1].innerHTML = "<h2>" + gameState["teamName"] + "'s Room</h2>";
	}

	document.querySelector("#newGame").style.visibility = "hidden";

	// if the game ended
	if (gameState["hasEnded"] || gameState["blueCardsRemaining"] == 0 || gameState["redCardsRemaining"] == 0) {
		console.log("Game Ended!");
		if (gameState["turn"] == "Blue") {
			gameWinner = "Red Team Won";
		} else {
			gameWinner = "Blue Team Won";
		}

		gameStat[0].innerHTML = "";
		gameStat[1].innerHTML = "<h1>" + gameWinner + "<h1>";
		gameStat[2].innerHTML = "";

		document.querySelector("#newGame").innerHTML = "New Game";
		document.querySelector("#newGame").style.visibility = "visible";
		document.querySelector("#newGame").addEventListener("click", onNewGameClick);

		function onNewGameClick() {
			sendUpdate(null, null, true);
			document.querySelector("#newGame").style.visibility = "hidden";
		}
	}

	// using doT.js to fill in the card labels
	var template = document.querySelector("#gameplay-template").innerHTML;
	var renderedFN = doT.template(template);
	var renderResult = renderedFN(gameState["cards"]);
	document.querySelector("#gameplay-filled").innerHTML = renderResult;

	// defining the board
	var gameBoard = document.querySelector("#gameboard").querySelectorAll("td");

	var i;
	for (i = 0; i < gameState["cards"].length; i++) {
		// changing cards color to reflect game
		if (gameState["cards"][i]["visible"] || gameState["teamName"] == "Spymaster") {
			switch (gameState["cards"][i]["owner"]) {
				case "Blue":
					gameBoard[i].style.backgroundColor = "Blue";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Red":
					gameBoard[i].style.backgroundColor = "Red";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Bystander":
					gameBoard[i].style.backgroundColor = "Gray";
					gameBoard[i].style.fontWeight = "Bold";
					break;
				case "Assassin":
					gameBoard[i].style.backgroundColor = "Brown";
					gameBoard[i].style.fontWeight = "Bold";
					break;
			}
		}

		// indicate cannot click if not your turn
		if (gameState["teamName"] != gameState["turn"] || gameState["cards"][i]["visible"] || gameState["hasEnded"]) {
			gameBoard[i].style.cursor = "not-allowed";
		}
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
			sendUpdate(24, false, false);
		}
	}
};

function sendUpdate(cardNumber, endTurn, nextGame) {
	console.log("update");

	let socket = new WebSocket("ws://localhost:8080/api/v1/games/" + window.location.pathname.replace("/", ""));
	socket.onopen = () => {
		console.log("Succesfully connected!");

		let updateJSON = JSON.stringify({
			cardClickedNumber: cardNumber,
			endTurnClicked: endTurn,
			nextGameInitiated: nextGame,
		});

		socket.send(updateJSON);
		console.log("State Update Sent");
	};
	socket.onclose = (event) => {
		console.log("Socket closed connection", event);
	};
	socket.onerror = (error) => {
		console.log("Socket error: ", error);
	};
}
