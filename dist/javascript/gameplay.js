document.querySelector("#homeButton").innerHTML = '<a href="/"><img src="../images/homebutton.png">';

var gameStat = document.querySelector("#gamestat").querySelectorAll("td")
var gameBoard = document.querySelector("#gameboard").querySelectorAll("td")


// var req = new XMLHttpRequest();
// req.open("GET", "/api/v1/games" + gameId);
// req.send();
// req.onreadystatechange = function () {
//     if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
//         var gameState = JSON.parse(req.response);

//         var i;
//         for (i = 0; i < gameState.CardsName.length; i++) {
//             console.log(gameState.CardsName[i])
//             gameBoard[i].innerHTML = gameState.CardsName[i]
//         }
//     }
// }

var gameState = {
    "hasEnded": false,
    "redCardsRemaining": 9,
    "blueCardsRemaining": 9,
    "turn": "Blue",
    "streak": 0,
    "cards": [
        {
            "label": "log",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "model",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "mole",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "europe",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "jet",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "film",
            "visible": true,
            "owner": "Bystander"
        },
        {
            "label": "amazon",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "slip",
            "visible": true,
            "owner": "Red"
        },
        {
            "label": "ham",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "club",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "jam",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "trip",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "tower",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "part",
            "visible": true,
            "owner": "Assassin"
        },
        {
            "label": "new york",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "orange",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "gold",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "canada",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "beach",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "air",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "dice",
            "visible": true,
            "owner": "Blue"
        },
        {
            "label": "park",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "revolution",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "knight",
            "visible": false,
            "owner": "N/A"
        },
        {
            "label": "dinosaur",
            "visible": false,
            "owner": "N/A"
        }
    ]
}

// setting game stats are the top of the gameboard
gameStat[0].innerHTML = "<b>Blue</b> - " + gameState["blueCardsRemaining"]
gameStat[1].innerHTML = "<h2>" + gameState["turn"] + "'s Turn </h2>"
gameStat[2].innerHTML = "<b>Red</b> - " + gameState["redCardsRemaining"]


// inserting card information
var i;
for (i = 0; i < gameState["cards"].length; i++) {
    gameBoard[i].innerHTML = gameState["cards"][i]["label"] // adding card label
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







