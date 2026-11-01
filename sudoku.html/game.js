

console.log("game connected!");

// =====================================
// 1. SUDOKU BOARD AND PUZZLE DATA
// =====================================

let board = [];
let solution = [];
let originalPuzzle = [];
let fixedCells = [];

let gameCompleted = false;


// =====================================
// 2. HTML ELEMENTS
// =====================================

let timer = document.querySelector("#game-timer");
let startButton = document.querySelector("#start-btn");
let pauseButton = document.querySelector("#pause-btn");
let resetButton = document.querySelector("#reset-btn");
let undoButton = document.querySelector("#undo-btn");

let cells = document.querySelectorAll(".board input");
let buttons = document.querySelectorAll(".numpad button");

let solvedOverlay = document.querySelector("#solved-overlay");
let solvedTime = document.querySelector("#solved-time");
let playAgainButton = document.querySelector("#play-again-btn");

let selectedCell = null;


// =====================================
// 2.5. UNDO HISTORY
// =====================================

let history = [];

function copyBoard(grid) {

    return grid.map(function(row) {
        return [...row];
    });

}

function saveHistory() {

    history.push(copyBoard(board));

}


// =====================================
// 3. PUZZLE GENERATION
// =====================================

// Create an empty 9 x 9 grid

function createEmptyBoard() {

    return Array.from({ length: 9 }, function() {
        return Array(9).fill(0);
    });

}


// Randomize an array of numbers

function shuffleNumbers(numbers) {

    for (let i = numbers.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];

    }

    return numbers;

}


// Check whether a number can be placed
// in a particular position

function isSafe(grid, row, col, number) {

    // Check row

    for (let i = 0; i < 9; i++) {

        if (grid[row][i] === number) {
            return false;
        }

    }


    // Check column

    for (let i = 0; i < 9; i++) {

        if (grid[i][col] === number) {
            return false;
        }

    }


    // Check 3 x 3 box

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;

    for (let i = startRow; i < startRow + 3; i++) {

        for (let j = startCol; j < startCol + 3; j++) {

            if (grid[i][j] === number) {
                return false;
            }

        }

    }

    return true;

}


// =====================================
// 3.1. GENERATE A COMPLETE SOLUTION
// =====================================

function fillSolution(grid) {

    // Find the next empty cell

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (grid[row][col] === 0) {

                let numbers = shuffleNumbers(
                    [1, 2, 3, 4, 5, 6, 7, 8, 9]
                );

                // Try randomized numbers

                for (let number of numbers) {

                    if (isSafe(grid, row, col, number)) {

                        grid[row][col] = number;

                        if (fillSolution(grid)) {
                            return true;
                        }

                        // Backtrack

                        grid[row][col] = 0;

                    }

                }

                return false;

            }

        }

    }

    return true;

}


// =====================================
// 3.2. COUNT POSSIBLE SOLUTIONS
// =====================================

// This function checks whether a puzzle
// has exactly one valid solution.

function getCandidates(grid, row, col) {

    let candidates = [];

    for (let number = 1; number <= 9; number++) {

        if (isSafe(grid, row, col, number)) {
            candidates.push(number);
        }

    }

    return candidates;

}


function countSolutions(grid, limit = 2) {

    let bestCell = null;
    let bestCandidates = null;

    // Find the empty cell with the fewest
    // possible numbers (MRV strategy)

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (grid[row][col] === 0) {

                let candidates = getCandidates(grid, row, col);

                if (candidates.length === 0) {
                    return 0;
                }

                if (
                    bestCandidates === null ||
                    candidates.length < bestCandidates.length
                ) {

                    bestCell = { row, col };
                    bestCandidates = candidates;

                }

            }

        }

    }


    // No empty cells means one solution found

    if (bestCell === null) {
        return 1;
    }


    let totalSolutions = 0;

    let row = bestCell.row;
    let col = bestCell.col;

    for (let number of bestCandidates) {

        grid[row][col] = number;

        totalSolutions += countSolutions(grid, limit);

        grid[row][col] = 0;

        // Stop once we know there is
        // more than one solution

        if (totalSolutions >= limit) {
            return totalSolutions;
        }

    }

    return totalSolutions;

}


// =====================================
// 3.3. REMOVE NUMBERS FROM SOLUTION
// =====================================

function createPuzzle(solutionGrid) {

    let puzzle = copyBoard(solutionGrid);

    let positions = [];

    // Store all 81 cell positions

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            positions.push({ row, col });

        }

    }


    // Randomize the positions

    shuffleNumbers(positions);


    // Target: remove approximately 40 numbers

    let targetRemovals = 40;
    let removed = 0;


    for (let position of positions) {

        if (removed >= targetRemovals) {
            break;
        }

        let row = position.row;
        let col = position.col;

        let originalValue = puzzle[row][col];

        // Temporarily remove a number

        puzzle[row][col] = 0;


        // Keep the removal only if the puzzle
        // still has exactly one solution

        let solutionsFound = countSolutions(
            copyBoard(puzzle),
            2
        );

        if (solutionsFound === 1) {

            removed++;

        }

        else {

            // Restore the number

            puzzle[row][col] = originalValue;

        }

    }

    console.log("Numbers removed:", removed);
    console.log("Remaining clues:", 81 - removed);

    return puzzle;

}


// =====================================
// 3.4. GENERATE A NEW PUZZLE
// =====================================

function generateNewPuzzle() {

    console.log("Generating a new Sudoku puzzle...");

    // Reset completed-game state

    gameCompleted = false;

    if (solvedOverlay) {
        solvedOverlay.hidden = true;
    }

    document.body.style.overflow = "";


    let solutionGrid = createEmptyBoard();

    // Generate completed Sudoku

    fillSolution(solutionGrid);

    solution = copyBoard(solutionGrid);


    // Remove numbers to create puzzle

    originalPuzzle = createPuzzle(solutionGrid);

    board = copyBoard(originalPuzzle);


    // Identify fixed cells

    fixedCells = board.map(function(row) {

        return row.map(function(value) {
            return value !== 0;
        });

    });


    // Reset game history

    history = [];
    selectedCell = null;


    // Reset timer

    clearInterval(interval);
    seconds = 0;

    if (timer) {
        timer.innerText = "00:00";
    }


    // Display generated puzzle

    renderBoard();

    highlightConflicts();

    console.log("Puzzle generated!");
    console.log("Puzzle:", board);
    console.log("Solution:", solution);

}


// =====================================
// 3.5. DISPLAY GENERATED PUZZLE
// =====================================

function renderBoard() {

    cells.forEach(function(cell) {

        let row = Number(cell.dataset.row);
        let col = Number(cell.dataset.col);

        let value = board[row][col];

        cell.value = value === 0 ? "" : value;

        // Lock original puzzle clues

        cell.readOnly = fixedCells[row][col];

        cell.classList.toggle(
            "fixed",
            fixedCells[row][col]
        );

        cell.classList.remove("selected", "related", "error");

    });

}


// =====================================
// 4. ROW VALIDATION
// =====================================

function isRowFull(row) {

    for (let i = 0; i < 9; i++) {

        if (board[row][i] === 0) {
            return false;
        }

    }

    return true;

}


function isRowValid(row) {

    let numbers = [];

    for (let i = 0; i < 9; i++) {

        let value = board[row][i];

        if (value === 0) continue;

        if (numbers.includes(value)) {
            return false;
        }

        numbers.push(value);

    }

    return true;

}


// =====================================
// 5. COLUMN VALIDATION
// =====================================

function isColFull(col) {

    for (let i = 0; i < 9; i++) {

        if (board[i][col] === 0) {
            return false;
        }

    }

    return true;

}


function isColValid(col) {

    let numbers = [];

    for (let i = 0; i < 9; i++) {

        let value = board[i][col];

        if (value === 0) continue;

        if (numbers.includes(value)) {
            return false;
        }

        numbers.push(value);

    }

    return true;

}


// =====================================
// 6. 3 X 3 BOX VALIDATION
// =====================================

function isBoxValid(startRow, startCol) {

    let numbers = [];

    for (let i = startRow; i < startRow + 3; i++) {

        for (let j = startCol; j < startCol + 3; j++) {

            let value = board[i][j];

            if (value === 0) continue;

            if (numbers.includes(value)) {
                return false;
            }

            numbers.push(value);

        }

    }

    return true;

}


// =====================================
// 7. VALIDATE THE SELECTED CELL
// =====================================

function validateCell(row, col) {

    let rowValid = isRowValid(row);
    let colValid = isColValid(col);

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;

    let boxValid = isBoxValid(startRow, startCol);

    console.log("Row valid:", rowValid);
    console.log("Column valid:", colValid);
    console.log("3 x 3 box valid:", boxValid);

    return rowValid && colValid && boxValid;

}


// =====================================
// 8. HIGHLIGHT SELECTED CELL
// =====================================

function highlightCells() {

    if (!selectedCell) return;

    let selectedRow = Number(selectedCell.dataset.row);
    let selectedCol = Number(selectedCell.dataset.col);

    let startRow = Math.floor(selectedRow / 3) * 3;
    let startCol = Math.floor(selectedCol / 3) * 3;

    cells.forEach(function(cell) {

        let row = Number(cell.dataset.row);
        let col = Number(cell.dataset.col);

        cell.classList.remove("selected", "related");

        if (cell === selectedCell) {

            cell.classList.add("selected");

        }

        else if (
            row === selectedRow ||
            col === selectedCol ||
            (
                row >= startRow &&
                row < startRow + 3 &&
                col >= startCol &&
                col < startCol + 3
            )
        ) {

            cell.classList.add("related");

        }

    });

}


// =====================================
// 9. HIGHLIGHT SUDOKU CONFLICTS
// =====================================

function highlightConflicts() {

    cells.forEach(function(cell) {
        cell.classList.remove("error");
    });

    function checkGroup(positions) {

        const values = positions
            .map(({ row, col }) => board[row][col])
            .filter(value => value !== 0);

        const hasDuplicate =
            new Set(values).size !== values.length;

        if (hasDuplicate) {

            positions.forEach(({ row, col }) => {

                cells.forEach(function(cell) {

                    if (
                        Number(cell.dataset.row) === row &&
                        Number(cell.dataset.col) === col
                    ) {
                        cell.classList.add("error");
                    }

                });

            });

        }

    }


    // Check rows

    for (let row = 0; row < 9; row++) {

        let positions = [];

        for (let col = 0; col < 9; col++) {
            positions.push({ row, col });
        }

        checkGroup(positions);

    }


    // Check columns

    for (let col = 0; col < 9; col++) {

        let positions = [];

        for (let row = 0; row < 9; row++) {
            positions.push({ row, col });
        }

        checkGroup(positions);

    }


    // Check 3 x 3 boxes

    for (let boxRow = 0; boxRow < 9; boxRow += 3) {

        for (let boxCol = 0; boxCol < 9; boxCol += 3) {

            let positions = [];

            for (let row = boxRow; row < boxRow + 3; row++) {

                for (let col = boxCol; col < boxCol + 3; col++) {
                    positions.push({ row, col });
                }

            }

            checkGroup(positions);

        }

    }

}


// =====================================
// 10. ENTER OR DELETE A NUMBER
// =====================================

function enterNumber(value) {

    if (!selectedCell || gameCompleted) return;

    let row = Number(selectedCell.dataset.row);
    let col = Number(selectedCell.dataset.col);

    // Do not allow changes to fixed clues

    if (fixedCells[row][col]) return;

    let previousValue = board[row][col];
    let newValue;


    if (value === "del" || value === "0") {

        newValue = 0;

    }

    else if (/^[1-9]$/.test(value)) {

        newValue = Number(value);

    }

    else {

        return;

    }


    if (previousValue === newValue) return;

    saveHistory();

    board[row][col] = newValue;

    selectedCell.value = newValue === 0 ? "" : newValue;


    console.log("Row:", row);
    console.log("Column:", col);
    console.log("Board:", board);


    let valid = validateCell(row, col);

    highlightConflicts();


    if (valid) {
        console.log("No duplicate found!");
    }

    else {
        console.log("Duplicate detected!");
    }


    // Check whether puzzle is solved

    if (isSudokuSolved()) {

        clearInterval(interval);

        gameCompleted = true;

        showSolvedCard();

        console.log("Congratulations! Sudoku solved!");

    }

}


// =====================================
// 11. UNDO LAST MOVE
// =====================================

function undoMove() {

    if (gameCompleted) return;

    if (history.length === 0) {

        console.log("Nothing to undo!");

        return;

    }

    board = history.pop();

    renderBoard();

    highlightConflicts();
    highlightCells();

    console.log("Undo successful!");
    console.log(board);

}


if (undoButton) {

    undoButton.addEventListener("click", function() {
        undoMove();
    });

}


// =====================================
// 12. SELECT A CELL
// =====================================

cells.forEach(function(cell) {

    cell.addEventListener("click", function() {

        if (gameCompleted) return;

        selectedCell = cell;

        highlightCells();

        console.log("Selected cell:", cell);

    });

});


// =====================================
// 13. DEVICE KEYBOARD INPUT
// =====================================

document.addEventListener("keydown", function(event) {

    if (!selectedCell || gameCompleted) return;

    if (/^[0-9]$/.test(event.key)) {

        event.preventDefault();

        enterNumber(event.key);

    }

    else if (
        event.key === "Backspace" ||
        event.key === "Delete"
    ) {

        event.preventDefault();

        enterNumber("del");

    }

    else if (event.key.length === 1) {

        event.preventDefault();

    }

});


// =====================================
// 14. DIRECT INPUT VALIDATION
// =====================================

cells.forEach(function(cell) {

    cell.addEventListener("input", function() {

        if (gameCompleted) return;

        selectedCell = cell;

        let row = Number(cell.dataset.row);
        let col = Number(cell.dataset.col);

        // Protect fixed clues

        if (fixedCells[row][col]) {

            cell.value = board[row][col];

            return;

        }

        let value = cell.value;


        if (!/^[0-9]$/.test(value)) {

            cell.value = "";

            if (board[row][col] !== 0) {

                saveHistory();

                board[row][col] = 0;

            }

            highlightConflicts();

            return;

        }

        enterNumber(value);

    });

});


// =====================================
// 15. ON-SCREEN NUMBER PAD
// =====================================

buttons.forEach(function(button) {

    button.addEventListener("click", function(event) {

        event.preventDefault();

        if (gameCompleted) return;

        let value = button.innerText.trim().toLowerCase();

        console.log("Numpad clicked:", value);


        // CLEAR PLAYER ENTRIES
        // Original puzzle clues remain intact.

        if (value === "clear") {

            let hasChanges = board.some(function(row, r) {

                return row.some(function(value, c) {

                    return value !== originalPuzzle[r][c];

                });

            });


            if (hasChanges) {

                saveHistory();

            }


            board = copyBoard(originalPuzzle);

            renderBoard();

            highlightConflicts();
            highlightCells();

            console.log("Player entries cleared!");

        }


        // ENTER OR DELETE NUMBER

        else if (
            /^[0-9]$/.test(value) ||
            value === "del"
        ) {

            enterNumber(value);

        }

    });

});


// =====================================
// 16. CHECK WHETHER SUDOKU IS SOLVED
// =====================================

function isSudokuSolved() {

    // Every row must be full and valid

    for (let i = 0; i < 9; i++) {

        if (!isRowFull(i) || !isRowValid(i)) {
            return false;
        }

    }


    // Every column must be full and valid

    for (let i = 0; i < 9; i++) {

        if (!isColFull(i) || !isColValid(i)) {
            return false;
        }

    }


    // Every box must be valid

    for (let row = 0; row < 9; row += 3) {

        for (let col = 0; col < 9; col += 3) {

            if (!isBoxValid(row, col)) {
                return false;
            }

        }

    }


    // Compare completed board with actual solution

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (board[row][col] !== solution[row][col]) {
                return false;
            }

        }

    }

    return true;

}


// =====================================
// 17. TIMER
// =====================================

let seconds = 0;
let interval = null;


function updateTimer() {

    seconds++;

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    if (timer) {

        timer.innerText =
            String(minutes).padStart(2, "0")
            + ":"
            + String(remainingSeconds).padStart(2, "0");

    }

}


if (startButton) {

    startButton.addEventListener("click", function() {

        if (gameCompleted) return;

        clearInterval(interval);

        interval = setInterval(updateTimer, 1000);

    });

}


if (pauseButton) {

    pauseButton.addEventListener("click", function() {

        clearInterval(interval);

    });

}


if (resetButton) {

    resetButton.addEventListener("click", function() {

        if (gameCompleted) return;

        clearInterval(interval);

        seconds = 0;

        if (timer) {
            timer.innerText = "00:00";
        }

    });

}


// =====================================
// 18. GAME SOLVED SUCCESS CARD
// =====================================

function showSolvedCard() {

    if (!solvedOverlay || !solvedTime) {
        console.error("Game Solved card elements not found!");
        return;
    }

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    let completionTime =
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0");

    // Display actual completion time

    solvedTime.innerText = completionTime;

    // Show success card

    solvedOverlay.hidden = false;

    // Prevent background scrolling

    document.body.style.overflow = "hidden";

    console.log("Success card displayed:", completionTime);

}


// =====================================
// 19. PLAY AGAIN
// =====================================

if (playAgainButton) {

    playAgainButton.addEventListener("click", function() {

        // Generate a completely new puzzle

        generateNewPuzzle();

        // Automatically start the timer

        clearInterval(interval);

        interval = setInterval(updateTimer, 1000);

        console.log("New game started!");

    });

}


// =====================================
// 20. START ZEN SUDOKU
// =====================================

// Generate the first puzzle when the page loads

generateNewPuzzle();
