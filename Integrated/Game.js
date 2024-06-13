document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const caughtLettersContainer = document.getElementById('caught-letters');
    const basket = document.getElementById('basket');
    const timerDisplay = document.getElementById('timer');
    const letters = 'ASDFJKL;'.split('');
    // const vowels = 'AEIOU';
    const gameDuration = 20000; // 20 seconds
    const letterInterval = 1000; // Create a new letter every second
    let fallenLetters = new Set();
    let caughtLetters = [];
    let vowelsCount = 0;
    let intervalId;
    let timerId;

    const wordEntryContainer = document.getElementById('word-entry-container');
    const wordTimerDisplay = document.getElementById('word-timer');
    const inputWords = document.getElementById('input-words');
    const submitWordsButton = document.getElementById('submit-words');
    const shuffleLettersButton = document.getElementById('shuffle-letters');
    const scoreDisplay = document.getElementById('score');
    const errorDisplay = document.getElementById('error');
    const validWordsContainer = document.getElementById('valid-words');
    let wordEntryTimeLeft = 60; // 120 seconds for word entry
    let wordEntryInterval;
    let totalScore = 0;
    let scoredWords = new Set(); // Keep track of words already scored

    function createFallingLetter(letter) {
        const letterElement = document.createElement('div');
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        letterElement.style.color = randomColor; 
        const inverseColor = invertColor(randomColor);
        letterElement.style.backgroundColor = inverseColor; // Set the background color
        letterElement.textContent = letter;
        letterElement.classList.add('letter');
        gameContainer.appendChild(letterElement);
        const isVowel = vowels.includes(letter);
        const speed = isVowel ? Math.random() * 2 + 2 : Math.random() * 2 + 3; // Vowels: 1-3s, Consonants: 3-8s
        letterElement.style.animationDuration = `${speed}s`;
        letterElement.style.left = `${Math.random() * 90}%`; // Random horizontal position

        // Remove letter after animation ends and check if caught
        letterElement.addEventListener('animationiteration', () => {
            fallenLetters.delete(letter);
            letterElement.remove();
        });
        letterElement.addEventListener('animationend', () => {
            const basketRect = basket.getBoundingClientRect();
            const letterRect = letterElement.getBoundingClientRect();
            if (
                letterRect.bottom >= basketRect.top &&
                letterRect.left >= basketRect.left &&
                letterRect.right <= basketRect.right
            ) {
                caughtLetters.push(letter);
                letterElement.remove(); // Remove the letter immediately when caught
            }
        });
    }

    function startFallingLetters() {
        intervalId = setInterval(() => {
            if (fallenLetters.size >= letters.length || (Date.now() - startTime > gameDuration && vowelsCount >= 3)) {
                clearInterval(intervalId);
                setTimeout(endGame, 2000); // End game after a short delay
                return;
            }

            let randomIndex = Math.floor(Math.random() * letters.length);
            let randomLetter = letters[randomIndex];

            // Ensure at least 3 vowels fall
            if (vowelsCount < 3) {
                randomLetter = vowels[Math.floor(Math.random() * vowels.length)];
                if (!fallenLetters.has(randomLetter)) {
                    vowelsCount++;
                }
            }

            if (!fallenLetters.has(randomLetter)) {
                createFallingLetter(randomLetter);
                fallenLetters.add(randomLetter);
            }
        }, letterInterval);

        setTimeout(() => {
            clearInterval(intervalId);
        }, gameDuration);
    }

    function showCaughtLetters() {
        caughtLettersContainer.textContent = '';
        caughtLetters.forEach(letter => {
            const letterBox = document.createElement('div');
            letterBox.textContent = letter;
            letterBox.classList.add('letter-box');
            letterBox.addEventListener('click', () => {
                inputWords.value += letter;
            });
            caughtLettersContainer.appendChild(letterBox);
        });
    }

    function updateTimer() {
        const timeLeft = Math.max(0, Math.ceil((gameDuration - (Date.now() - startTime)) / 1000));
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
        }
    }

    function endGame() {
        basket.style.display = 'none';
        showCaughtLetters();
        wordEntryContainer.style.display = 'block';
        startWordEntryTimer();
    }

    function startWordEntryTimer() {
        wordEntryInterval = setInterval(updateWordEntryTimer, 1000);
    }

    function updateWordEntryTimer() {
        wordEntryTimeLeft--;
        wordTimerDisplay.textContent = wordEntryTimeLeft;
        if (wordEntryTimeLeft <= 0) {
            clearInterval(wordEntryInterval);
            inputWords.disabled = true;
            submitWordsButton.disabled = true;
            shuffleLettersButton.disabled = true; // Disable shuffle button when time is up
            calculateFinalScore();
        }
    }

    inputWords.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitWord();
        }
    });

    function shuffleCaughtLetters() {
        caughtLetters = caughtLetters.sort(() => Math.random() - 0.5);
        showCaughtLetters();
    }

    shuffleLettersButton.addEventListener('click', () => {
        shuffleCaughtLetters();
    });

    submitWordsButton.addEventListener('click', submitWord);

    function submitWord() {
        const word = inputWords.value.trim();
        if (word.length > 1) { // Word length should be 2 letters minimum
            calculateScore(word);
            inputWords.value = '';
        } else {
            errorDisplay.textContent = 'Word must be at least 2 letters long';
        }
    }

    async function calculateScore(word) {
        if (scoredWords.has(word.toUpperCase())) {
            errorDisplay.textContent = `Word already used: ${word}`;
            return;
        }

        const isValid = await validateWord(word);
        if (isValid) {
            let valid = true;
            for (let letter of word.toUpperCase()) {
                if (!caughtLetters.includes(letter)) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                totalScore += word.length;
                scoreDisplay.textContent = `Score: ${totalScore}`;
                errorDisplay.textContent = ''; // Clear any previous error message
                scoredWords.add(word.toUpperCase()); // Mark word as scored
                displayValidWord(word); // Display the valid word
            } else {
                errorDisplay.textContent = `Invalid word using caught letters: ${word}`;
            }
        } else {
            errorDisplay.textContent = `Invalid word: ${word}`;
        }
    }

    async function validateWord(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('Word not found');
            const data = await response.json();
            return data.length > 0;
        } catch (error) {
            console.error(`Error validating word "${word}":`, error);
            return false;
        }
    }

    function calculateFinalScore() {
        scoreDisplay.textContent = `Final Score: ${totalScore}`;
        setTimeout(()=>{
            function senddata() {
                const final_score_scoreboard = `${totalScore}`
                localStorage.setItem('myData',final_score_scoreboard);
                window.location.href = '../Score/Score.html'
            }
            senddata();
        },1000)
    }

    function displayValidWord(word) {
        const wordUppercase = word.toUpperCase();
        const wordElement = document.createElement('li');
        wordElement.textContent = wordUppercase;
        validWordsContainer.appendChild(wordElement);
    }

    // Move basket with mouse
    document.addEventListener('mousemove', (event) => {
        const basketWidth = basket.offsetWidth;
        const containerRect = gameContainer.getBoundingClientRect();
        let newLeft = event.clientX - containerRect.left - basketWidth / 2;
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - basketWidth));
        basket.style.left = `${newLeft}px`;
    });

    const startTime = Date.now();
    startFallingLetters();
    timerId = setInterval(updateTimer, 1000); // Update timer every second

    // Add event listener to the button
    const gotoNextGameButton = document.getElementById('goto-next-game');
    gotoNextGameButton.addEventListener('click', () => {
        // Redirect to the linked game
        window.location.href = '../WordFinder/Home.html';
    });
    function invertColor(hex) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // Convert hex to RGB
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16);
        const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16);
        const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    
        // Combine RGB values and return the inverse color
        return "#" + padZero(r) + padZero(g) + padZero(b);
    }
    
    // Function to pad zeros
    function padZero(str) {
        return str.length === 1 ? "0" + str : str;
    }
});
