const startBtn = document.querySelector("[data-startbtn]");
const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");
const player3 = document.getElementById("player3");
const player4 = document.getElementById("player4");
const gameContainer = document.querySelector(".game-container");
const playersCards = document.querySelector(".player-cards");
const playersNameContainer = document.querySelector(".players-name-container");
// const score1 = document.getElementById('score-1');
// const score2 = document.getElementById('score-2');
// const winner = document.getElementById("winner");

const roles = [
  { name: "Raja", points: 1000, image: "./images/King.jpg" },
  { name: "Mantri", points: 500, image: "./images/minister.avif" },
  { name: "Sipahi", points: 300, image: "./images/soilder.avif" },
  { name: "Chor", points: 0, image: "./images/thief.jpg" },
];

startBtn.addEventListener("click", () => {
  // if any player not entered the name handle that case and show a toastify
  const playersName = [
    player1.value,
    player2.value,
    player3.value,
    player4.value,
  ];
  console.log(playersName);

  if (playersName.includes("")) {
    Toastify({
      text: "Please enter all names!",
      duration: 3000,
    });
  } else {
    // Hide the players-name-container
    playersNameContainer.classList.add("hide");

    // Show the player-cards-container
    gameContainer.classList.remove("hide");
    gameContainer.classList.add("show");

    // Create players
    createPlayers(playersName);

    // Create player cards
    createPlayerCards(playersName);

    // Update points table
    // const initialPoints = {};
    // playersName.forEach((name, index) => {
    //   initialPoints[name] = 0;
    // });
    // updatePointsTable(initialPoints);

    // Start the game
    gameStart();
  }
});

// Function to create players
function createPlayers(names) {
  let htmlCode = "";
  for (let i = 0; i < names.length; i++) {
    htmlCode += `
          <div class="col-md-6 d-flex align-items-center justify-content-center">
              <h5>Player ${i + 1}'s Name : </h5>
              <h2 id='p${i}'>${names[i]}</h2>
          </div>
      `;
  }

  // Replace the existing players-name-container content with the new players
  playersNameContainer.innerHTML = htmlCode;
}

// Function to create player cards
function createPlayerCards(playerNames) {
  const playerCardsContainer = document.querySelector(".player-cards");
  playerCardsContainer.innerHTML = ""; // Clear the container
  playerNames.forEach((name, index) => {
    const playerCard = document.createElement("div");
    playerCard.classList.add("player-card");
    playerCard.id = `player-card-${index + 1}`;

    const playerCardFaceFront = document.createElement("div");
    playerCardFaceFront.classList.add("player-card__face");
    playerCardFaceFront.classList.add("player-card__face--front");
    playerCard.appendChild(playerCardFaceFront);

    const playerNameElement = document.createElement("h3");
    playerNameElement.textContent = name;
    playerCardFaceFront.appendChild(playerNameElement);

    const scoreElement = document.createElement("p");
    scoreElement.textContent = `Score: 0`;
    playerCardFaceFront.appendChild(scoreElement);

    const playerCardFaceBack = document.createElement("div");
    playerCardFaceBack.classList.add("player-card__face");
    playerCardFaceBack.classList.add("player-card__face--back");
    playerCard.appendChild(playerCardFaceBack);

    const imgTag = document.createElement("img");
    playerCardFaceBack.appendChild(imgTag);

    playerCardsContainer.appendChild(playerCard);
  });
}

// Function to update points table
//   function updatePointsTable(points) {
//     const pointsTable = document.querySelector(".points-table-container .points-table");
//     pointsTable.innerHTML = ""; // Clear the existing points table

//     for (const playerName in points) {
//       const row = document.createElement("div");
//       row.classList.add("points-row");

//       const playerNameSpan = document.createElement("span");
//       playerNameSpan.textContent = playerName;
//       row.appendChild(playerNameSpan);

//       const pointsSpan = document.createElement("span");
//       pointsSpan.textContent = points[playerName];
//       row.appendChild(pointsSpan);

//       pointsTable.appendChild(row);
//     }
//   }

// Function to start the game
//   function gameStart() {
//     Toastify({
//       text: "Game Started!",
//       duration: 3000,
//     });

//   }

function flipCard(card, direction) {
  card.classList.toggle("is-flipped");
  setTimeout(() => {
    card.classList.toggle("is-flipped");
    if (direction === "next") {
      // Code to flip the next card goes here
    }
  }, 3000);
}

function selectNextPlayer() {
  // Code to select the next player goes here
  // For example, you can use the modulo operator to cycle through the players array
  // and select the next player:
  const currentKingIndex = Math.floor(Math.random() * 4);
  return currentKingIndex;
}

//   function showPlayerCard(playerNames, currentPlayerIndex) {
//     // Code to show the player card goes here
//     // For example, you can use the `textContent` property to display the player's name
//     // and the `dataset` property to display the player's points:
//     const playerCard = document.getElementById(`player-card-${currentPlayerIndex + 1}`);
//     // console.log(playerCard);
//     const  playerNameElement = playerCard.querySelector('.player-card__face');
//     console.log(playerNameElement);
//     playerNameElement.classList.add(".player-card__face--back");
//     playerNameElement.classList.add(".player-card--flip");
//     // const card = document.querySelector('.player-card');
//     // card.textContent = player.name;
//     // card.dataset.points = player.points;
//   }

function addImage(currentPlayerIndex, roleIndex) {
  const playerCard = document.getElementById(
    `player-card-${currentPlayerIndex + 1}`
  );

  const backCardImg = playerCard.querySelector(`.player-card__face--back img`);
  backCardImg.src = roles[roleIndex].image;
  console.log(roleIndex);
  backCardImg.alt = roles[roleIndex].name;
  roleIndex++;
}

function showPlayerCard(currentPlayerIndex) {
  // Get the player card element
  const playerCard = document.getElementById(
    `player-card-${currentPlayerIndex + 1}`
  );

  // Set the player's name and points
  // const playerNameElement = playerCard.querySelector('.player-card__face .player-name');
  // playerNameElement.textContent = playerNames[currentPlayerIndex];

  // Add the "flip" class to show the back of the player card
  playerCard.classList.add("is-flipped");

  // Set a timeout to flip the player card back after 2 seconds
  setTimeout(() => {
    playerCard.classList.remove("is-flipped");
  }, 3000);
}
function gameStart() {
  Toastify({
    text: "Game Started!",
    duration: 3000,
  }).showToast();

  // Toastify({
  //     text:"Game Started",
  //     position: "top-center",
  //     duration: 5000,
  //     onVisibilityChange: function (toast) {
  //               // This function is called whenever the visibility of the notification changes

  //               if (toast.visibility === "hidden") {
  //                 // The notification is hidden (i.e., it has completed its duration)

  //                 // Execute a function here
  //                 //   console.log("The notification has been closed.");
  //                 // Flip the first player card
  //
  //               }
  //             },
  //   }).showToast();

  let currentKingIndex = selectNextPlayer();
  addImage(currentKingIndex, 0);
  console.log(`The king index is ${currentKingIndex}`);
  showPlayerCard(currentKingIndex);

  let currentMinisterIndex = selectNextPlayer();
  let currentSoilderIndex;
  let currentThiefIndex;

  if (currentKingIndex === currentMinisterIndex) {
    for (let i = 0; i < 4; i++) {
      currentMinisterIndex = selectNextPlayer();
      if (currentKingIndex !== currentMinisterIndex) {
        break;
      }
    }
  }
  console.log(`The minister index is ${currentMinisterIndex}`);
  addImage(currentMinisterIndex, 1);

  setTimeout(() => {
    showPlayerCard(currentMinisterIndex);
  }, 3000);
  const kingCard = document.getElementById(
    `player-card-${currentKingIndex + 1}`
  );

  kingCard.addEventListener("click", () => {
    // Add the "flip" class to show the back of the player card
    kingCard.classList.add("is-flipped");

    // Set a timeout to flip the player card back after 2 seconds
    setTimeout(() => {
      kingCard.classList.remove("is-flipped");
    }, 3000);
  });

  const ministerCard = document.getElementById(
    `player-card-${currentMinisterIndex + 1}`
  );

  ministerCard.addEventListener("click", () => {
    // Add the "flip" class to show the back of the player card
    ministerCard.classList.add("is-flipped");

    // Set a timeout to flip the player card back after 2 seconds
    setTimeout(() => {
      ministerCard.classList.remove("is-flipped");
    }, 3000);
  });

  for (let i = 0; i < 4; i++) {
    currentSoilderIndex = selectNextPlayer();
    if (
      currentSoilderIndex !== currentMinisterIndex &&
      currentSoilderIndex !== currentKingIndex
    ) {
      break;
    }
  }
  addImage(currentSoilderIndex, 2);
  console.log(`The soldier index is ${currentSoilderIndex}`);

  for (let i = 0; i < 4; i++) {
    currentThiefIndex = selectNextPlayer();
    if (
      currentThiefIndex !== currentMinisterIndex &&
      currentThiefIndex !== currentKingIndex &&
      currentThiefIndex !== currentSoilderIndex
    ) {
      break;
    }
  }

  addImage(currentThiefIndex, 3);
  console.log(`The Thief index is ${currentThiefIndex}`);

  let timeLeft;

  setTimeout(() => {
    // Set initial time left
    timeLeft = 30;

    // Create a timer ID for the setInterval function
    let timerId = setInterval(countdown, 1000);

    function countdown() {
      if (timeLeft === 0) {
        // Stop the timer
        clearInterval(timerId);
      } else {
        // Decrement the time left
        Toastify({
          text: `Time left ${timeLeft}`,
          position: "top-center",
          duration: 1000,
        }).showToast();

        timeLeft--;
      }
    }
  }, 3000);

  const thiefCard = document.getElementById(
    `player-card-${currentThiefIndex + 1}`
  );

  thiefCard.addEventListener("click", () => {
    if (timeLeft >= 0) {
      // Add the "flip" class to show the back of the player card
      thiefCard.classList.add("is-flipped");

      // Set a timeout to flip the player card back after 2 seconds
      setTimeout(() => {
        thiefCard.classList.remove("is-flipped");
      }, 3000);
      if (timeLeft > 0) {
        Toastify({
          text: "Congratulations, You Selected correct!!",
          position: "top-center",
          duration: 2000,
        }).showToast();
      }
      timeLeft = 0;
    }
  });

  const soldierCard = document.getElementById(
    `player-card-${currentSoilderIndex + 1}`
  );

  soldierCard.addEventListener("click", () => {
    if (timeLeft >= 0) {
      // Add the "flip" class to show the back of the player card
      soldierCard.classList.add("is-flipped");

      // Set a timeout to flip the player card back after 2 seconds
      setTimeout(() => {
        soldierCard.classList.remove("is-flipped");
      }, 3000);
      if (timeLeft > 0) {
        Toastify({
          text: "Sorry, Better Luck next Time!!",
          position: "top-center",
          duration: 2000,
        }).showToast();
        timeLeft = 0;
      }
    }
  });

  // const playerCard = document.querySelector('.player-card');
  // playerCard.classList.add('is-flipped');

  // Wait for 3 seconds and flip the next player card
  // setTimeout(() => {
  //   const nextPlayer = selectNextPlayer(roles);
  //   const playerCard = document.querySelector('.player-card');
  //   playerCard.classList.add('is-flipped');
  //   setTimeout(() => {
  //     // Show the player cards and the points table
  //     const gameContainer = document.querySelector('.game-container');
  //     gameContainer.classList.remove('hide');

  //     // Check if the player has selected the correct role
  //     if (playerSelectedRole === currentPlayer.role) {
  //       // Reward the player's points
  //     } else {
  //       // Swap the thief and minister's points
  //       const currentThief = players.find(player => player.role === 'thief');
  //       const currentMinister = players.find(player => player.role === 'minister');
  //       const tempPoints = currentThief.points;
  //       currentThief.points = currentMinister.points;
  //       currentMinister.points = tempPoints;

  //       // Show a Toastify message
  //       Toastify({
  //         text: "Sorry, the player's role was not correct. The thief and the minister's points have been swapped.",
  //         duration: 3000,
  //       });

  //       // Check if the player has selected a role
  //       if (playerSelectedRole) {
  //         // Swap the sele

  //       }

  //     }
  //     });
  // });
}

// script.js
// Assume you have an array of player names: ['Raja', 'Mantri', 'Chor', 'Sipahi']

// Function to create player cards dynamically
// function createPlayerCards() {
//     const playerNames = ['player1', 'Mantri', 'Chor', 'Sipahi'];
//     const playerCardsContainer = document.querySelector('.player-cards');

//     playerNames.forEach((name) => {
//         const card = document.createElement('div');
//         card.classList.add('player-card');
//         card.textContent = name;
//         playerCardsContainer.appendChild(card);
//     });
// }

// // Function to update points table dynamically
// function updatePointsTable(points) {
//     const pointsTable = document.querySelector('.points-table');
//     pointsTable.innerHTML = ''; // Clear existing content

//     for (const playerName in points) {
//         const row = document.createElement('div');
//         row.classList.add('points-row');
//         row.innerHTML = `<span>${playerName}:</span> <span>${points[playerName]}</span>`;
//         pointsTable.appendChild(row);
//     }
// }

// // Example usage:
// const initialPoints = {
//     Raja: 0,
//     Mantri: 0,
//     Chor: 0,
//     Sipahi: 0,
// };

// createPlayerCards();
// updatePointsTable(initialPoints);
// // Add event listeners for game logic (e.g., button clicks, updating points, etc.)
// // ...
