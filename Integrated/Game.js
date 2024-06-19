document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const timerDisplay = document.getElementById('timer');
    const resultContainer = document.getElementById('result');
    const resultText = document.getElementById('result-text');
    const pressedCountDisplay = document.getElementById('pressed-count');
    const missedCountDisplay = document.getElementById('missed-count');
    const wrongCountDisplay = document.getElementById('wrong-count');
    const difficultySelection = document.getElementById('difficulty-selection');
    const easyBtn = document.getElementById('easy-btn');
    const moderateBtn = document.getElementById('moderate-btn');
    const hardBtn = document.getElementById('hard-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToLevelSelectionBtn = document.getElementById('back-to-level-selection-btn');

    let letters = [];
    let gameDuration = 20000; // 20 seconds
    let letterInterval = 1000; // Create a new letter every second
    let fallenLetters = []; // Array to store active letters
    let pressedCount = 0;
    let missedCount = 0;
    let wrongCount = 0;
    let intervalId;
    let timerId;
    let startTime;
    let gameEnded = false; // Flag to check if the game has ended

    easyBtn.addEventListener('click', () => {
        setDifficulty('easy');
    });

    moderateBtn.addEventListener('click', () => {
        setDifficulty('moderate');
    });

    hardBtn.addEventListener('click', () => {
        setDifficulty('hard');
    });

    playAgainBtn.addEventListener('click', () => {
        resetGame();
        startGame();
    });

    backToLevelSelectionBtn.addEventListener('click', () => {
        resetGame();
        difficultySelection.classList.remove('d-none');
        resultContainer.style.display = 'none';
    });

    function setDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy':
                letters = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''];
                gameDuration = 20000;
                letterInterval = 1000;
                break;
            case 'moderate':
                letters = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'];
                gameDuration = 20000;
                letterInterval = 900;
                break;
            case 'hard':
                letters = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];
                gameDuration = 20000;
                letterInterval = 800;
                break;
            default:
                break;
        }

        startGame();
    }

    function startGame() {
        difficultySelection.classList.add('d-none');
        gameContainer.classList.remove('d-none');

        gameEnded = false; // Reset game ended flag

        intervalId = setInterval(() => {
            if (fallenLetters.length >= letters.length || gameEnded) {
                clearInterval(intervalId);
                setTimeout(endGame, 2000);
                return;
            }

            const randomIndex = Math.floor(Math.random() * letters.length);
            const randomLetter = letters[randomIndex];

            createFallingLetter(randomLetter);
        }, letterInterval);

        startTime = Date.now();
        timerId = setInterval(updateTimer, 1000); // Update timer every second
    }

    function createFallingLetter(letter) {
        const letterElement = document.createElement('div');
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        letterElement.style.color = randomColor;
        const inverseColor = invertColor(randomColor);
        letterElement.style.backgroundColor = inverseColor;
        letterElement.textContent = letter;
        letterElement.classList.add('letter');
        gameContainer.appendChild(letterElement);
        letterElement.style.animationDuration = `${Math.random() * 2 + 3}s`;
        letterElement.style.left = `${Math.random() * 90}%`;

        letterElement.addEventListener('animationend', () => {
            if (!letterElement.classList.contains('burst')) {
                missedCount++;
                updateMissedCount();
            }
            const index = fallenLetters.indexOf(letterElement);
            if (index !== -1) {
                fallenLetters.splice(index, 1);
            }
            letterElement.remove();
        });

        fallenLetters.push(letterElement);
    }

    function updateTimer() {
        const timeLeft = Math.max(0, Math.ceil((gameDuration - (Date.now() - startTime)) / 1000));
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            clearInterval(intervalId); // Stop creating new letters
            endGame();
        }
    }

    function endGame() {
        if (gameEnded) return; // Ensure endGame is only called once
        gameEnded = true;

        fallenLetters.forEach(letterElement => {
            letterElement.remove();
        });
        fallenLetters = []; // Clear the array
        showResult();
    }

    function showResult() {
        resultContainer.style.display = 'block';
        resultText.innerHTML = `
            <h3 class="correct">Correct: ${pressedCount}</h3>
            <h3 class="wrong">Wrong: ${wrongCount}</h3>
            <h3 class="missed">Missed: ${missedCount}</h3>
        `;
    }

    function updateMissedCount() {
        missedCountDisplay.textContent = `Missed: ${missedCount}`;
    }

    function updatePressedCount() {
        pressedCountDisplay.textContent = `Correct: ${pressedCount}`;
    }

    function updateWrongCount() {
        wrongCountDisplay.textContent = `Wrong: ${wrongCount}`;
    }

    function resetGame() {
        pressedCount = 0;
        missedCount = 0;
        wrongCount = 0;
        updatePressedCount();
        updateMissedCount();
        updateWrongCount();
        resultContainer.style.display = 'none';
        gameContainer.classList.add('d-none');
        fallenLetters = [];
        gameEnded = false;
    }

    document.addEventListener('keydown', (event) => {
        const pressedKey = event.key.toUpperCase();
        let found = false;
        for (let i = 0; i < fallenLetters.length; i++) {
            const letterElement = fallenLetters[i];
            if (letterElement.textContent === pressedKey) {
                letterElement.classList.add('burst');
                createExplosionEffect(letterElement);
                setTimeout(() => {
                    letterElement.remove();
                    pressedCount++;
                    updatePressedCount();
                }, 500); // Wait for burst animation to finish
                found = true;
                break; // Exit loop after finding the letter
            }
        }
        if (!found) {
            wrongCount++;
            updateWrongCount();
        }
    });

    function invertColor(hex) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16);
        const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16);
        const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
        return "#" + padZero(r) + padZero(g) + padZero(b);
    }

    function padZero(str) {
        return str.length === 1 ? "0" + str : str;
    }

    function createExplosionEffect(letterElement) {
        letterElement.innerHTML = '<div class="spinner-grow text-danger" role="status"><span class="sr-only">Loading...</span></div>';
        letterElement.style.animation = 'none';
        setTimeout(() => {
            letterElement.innerHTML = ''; // Clear the inner content after explosion
        }, 500); // Match the duration with the spinner animation
    }
});
