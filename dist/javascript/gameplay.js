"use strict";
var gameStat = document.querySelector("#gamestat").querySelectorAll("td");
var gameState;
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
    document.querySelector("#endTurn").style.visibility = "hidden";
    document.querySelector("#newGame").style.visibility = "hidden";
    logTurnAndData();
    addCardLabels(gameState["cards"]);
    updateGameStats(gameState);
    var gameBoard = document.querySelector("#gameboard").querySelectorAll("td");
    styleCards(gameState, gameBoard);
    addEventListeners(gameState, gameBoard);
    if (gameState["hasEnded"]) {
        gameEnded();
    }
    if (gameState["streak"] > 0 && gameState["teamName"] == gameState["turn"]) {
        gameStreak();
    }
};
function logTurnAndData() {
    console.log("======================================================");
    console.log("Turn: ", gameState["turn"]);
    console.log("RECEIVED: ", gameState);
    console.log("Turn and Socket Data logged");
}
function sendUpdate(cardNumber, endTurn, nextGame) {
    var updateJSON = JSON.stringify({
        cardClickedNumber: cardNumber,
        endTurnClicked: endTurn,
        nextGameInitiated: nextGame,
    });
    console.log("SENT: ", updateJSON);
    socket.send(updateJSON);
    console.log("Update Send Through Web Socket");
}
function addCardLabels(gameState) {
    var template = document.querySelector("#gameplay-template").innerHTML;
    var renderedFN = doT.template(template);
    var renderResult = renderedFN(gameState);
    document.querySelector("#gameplay-filled").innerHTML = renderResult;
    console.log("Card Labels Added");
}
function updateGameStats(gameState) {
    gameStat[0].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"];
    gameStat[1].innerHTML = "<h3>" + gameState["teamName"] + "'s Room</h3><h2> " + gameState["turn"] + "'s Turn </h2>";
    gameStat[2].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"];
    console.log("Game Stats Updated");
}
function onNewGameClick() {
    sendUpdate(null, null, true);
    document.querySelector("#newGame").style.visibility = "hidden";
    console.log("New Game Button Pressed");
    document.querySelector("#newGame").style.visibility = "hidden";
}
function onEndTurnClick() {
    console.log("End Turn Button Pressed");
    var turnBefore = gameState["turn"];
    sendUpdate(5, true, false);
    var turnAfter = gameState["turn"];
    document.querySelector("#endTurn").style.visibility = "hidden";
    console.log("End Turn Button Pressed");
}
function gameStreak() {
    console.log("Game Streak Detected! | Streak : ", gameState["streak"]);
    document.querySelector("#endTurn").innerHTML = "End Turn";
    document.querySelector("#endTurn").style.visibility = "visible";
    document.querySelector("#endTurn").addEventListener("click", onEndTurnClick);
    if (gameState["hasEnded"]) {
        document.querySelector("#endTurn").style.visibility = "hidden";
    }
}
function gameEnded() {
    var gameWinner;
    if (gameState["blueCardsRemaining"] > 0 && gameState["redCardsRemaining"] > 0) {
        console.log("Game Ended - Caused by Assassin Card");
        if (gameState["turn"] == "Blue") {
            gameWinner = "Red Team Won";
        }
        else {
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
    document.querySelector("#newGame").innerHTML = "New Game";
    document.querySelector("#newGame").style.visibility = "visible";
    document.querySelector("#newGame").addEventListener("click", onNewGameClick);
}
function addEventListeners(gameState, gameBoard) {
    var i;
    for (i = 0; i < 25; i++) {
        let j = i;
        gameBoard[i].addEventListener("click", function (event) {
            if (gameState["cards"][j]["visible"] == false && gameState["teamName"] == gameState["turn"]) {
                sendUpdate(j + 1, false, false);
            }
        }, false);
    }
    console.log("Event Listeners Added");
}
function addClassToCard(i, gameState, gameBoard, gameEndedNoOwner, gameEndedCardVisible, spymasterCardVisible, spymasterCardNotVisible, gameAliveNotSpymaster) {
    if (gameState["hasEnded"]) {
        if (gameState["cards"][i]["owner"] != "N/A") {
            gameBoard[i].className = gameEndedNoOwner;
        }
        if (gameState["cards"][i]["visible"]) {
            gameBoard[i].className = gameEndedCardVisible;
        }
    }
    else {
        if (gameState["teamName"] == "Spymaster") {
            if (gameState["cards"][i]["visible"]) {
                gameBoard[i].className = spymasterCardVisible;
            }
            else {
                gameBoard[i].className = spymasterCardNotVisible;
            }
        }
        else {
            gameBoard[i].className = gameAliveNotSpymaster;
        }
    }
}
function styleCards(gameState, gameBoard) {
    var i;
    for (i = 0; i < gameState["cards"].length; i++) {
        gameBoard[i].className = "defaultClass";
        switch (gameState["cards"][i]["owner"]) {
            case "Blue":
                addClassToCard(i, gameState, gameBoard, "blueCard-gameEnded-noOwner", "blueCard-gameEnded-cardVisible", "blueCard-gameAlive-spymaster-cardVisible", "blueCard-gameAlive-spymaster-cardNotVisible", "blueCard-gameAlive-notSpymaster");
                break;
            case "Red":
                addClassToCard(i, gameState, gameBoard, "redCard-gameEnded-noOwner", "redCard-gameEnded-cardVisible", "redCard-gameAlive-spymaster-cardVisible", "redCard-gameAlive-spymaster-cardNotVisible", "redCard-gameAlive-notSpymaster");
                break;
            case "Bystander":
                addClassToCard(i, gameState, gameBoard, "bystanderCard-gameEnded-noOwner", "bystanderCard-gameEnded-cardVisible", "bystanderCard-gameAlive-spymaster-cardVisible", "bystanderCard-gameAlive-spymaster-cardNotVisible", "bystanderCard-gameAlive-notSpymaster");
                break;
            case "Assassin":
                addClassToCard(i, gameState, gameBoard, "assassinCard-gameEnded-noOwner", "assassinCard-gameEnded-cardVisible", "assassinCard-gameAlive-spymaster-cardVisible", "assassinCard-gameAlive-spymaster-cardNotVisible", "assassinCard-gameAlive-notSpymaster");
                break;
        }
        if (gameState["teamName"] != gameState["turn"] || gameState["cards"][i]["visible"] || gameState["hasEnded"]) {
            gameBoard[i].style.cursor = "not-allowed";
        }
    }
    console.log("Cards Styled");
}
