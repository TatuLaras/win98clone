const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const numColumns = 16;
const numRows = 16;
const numMines = 40;

var wrapper = document.querySelector('#game');
var mineMatrix = Array(numRows)
    .fill()
    .map(() => Array(numColumns));
var revealedCellMatrix = Array(numRows)
    .fill()
    .map(() => Array(numColumns));
var revealedZeros = [];
var numMinesApplied = 0;
var initialized = false;

var timeCounterNumber = 0;
var flagsPlaced = 0;
var gameOver = false;

const getNumberColor = (num) => {
    switch (num) {
        case 1:
            return '#0100FE';
        case 2:
            return '#017F01';
        case 3:
            return '#FE0000';
        case 4:
            return '#010080';
        case 5:
            return '#810002';
        case 6:
            return '#008081';
        case 7:
            return '#000000';
        case 8:
            return '#808080';
    }
};

const setMineCounter = (number) => {
    var hundreds = document.querySelector('#flag-counter .hundreds');
    var tens = document.querySelector('#flag-counter .tens');
    var ones = document.querySelector('#flag-counter .ones');

    const classPrefix = 'time';

    for (i = 0; i < 10; i++) {
        hundreds.classList.remove(classPrefix + i);
        tens.classList.remove(classPrefix + i);
        ones.classList.remove(classPrefix + i);
    }

    var numberString = number.toString();

    // Pad with zeros
    while (numberString.length < 3) {
        numberString = '0' + numberString;
    }

    var onesDigit = numberString[2];
    var tensDigit = numberString[1];
    var hundredsDigit = numberString[0];

    hundreds.classList.add(classPrefix + hundredsDigit);
    tens.classList.add(classPrefix + tensDigit);
    ones.classList.add(classPrefix + onesDigit);
};

const incrementTimeCounter = () => {
    timeCounterNumber++;
    timeCounterNumber = clamp(timeCounterNumber, 0, 999);
    var hundreds = document.querySelector('#time-counter .hundreds');
    var tens = document.querySelector('#time-counter .tens');
    var ones = document.querySelector('#time-counter .ones');

    const classPrefix = 'time';

    for (i = 0; i < 10; i++) {
        hundreds.classList.remove(classPrefix + i);
        tens.classList.remove(classPrefix + i);
        ones.classList.remove(classPrefix + i);
    }

    var numberString = timeCounterNumber.toString();

    // Pad with zeros
    while (numberString.length < 3) {
        numberString = '0' + numberString;
    }

    var onesDigit = numberString[2];
    var tensDigit = numberString[1];
    var hundredsDigit = numberString[0];

    hundreds.classList.add(classPrefix + hundredsDigit);
    tens.classList.add(classPrefix + tensDigit);
    ones.classList.add(classPrefix + onesDigit);
};

const revealConnected = (x, y) => {
    if (revealedZeros.includes(x + '-' + y)) {
        return;
    }
    revealedZeros.push(x + '-' + y);

    for (var ny = -1; ny < 2; ny++) {
        for (var nx = -1; nx < 2; nx++) {
            var xIndex = x + nx;
            var yIndex = y + ny;
            // If not out of bounds
            if (xIndex >= 0 && xIndex < numColumns && yIndex >= 0 && yIndex < numRows) {
                if (mineMatrix[xIndex][yIndex] == 0) {
                    revealConnected(xIndex, yIndex);
                    revealNeighbours(xIndex, yIndex);
                }
            }
        }
    }
};

const revealNeighbours = (x, y) => {
    for (ny = -1; ny <= 1; ny++) {
        for (nx = -1; nx <= 1; nx++) {
            var xIndex = x + nx;
            var yIndex = y + ny;

            // If not out of bounds
            if (xIndex >= 0 && xIndex < numColumns && yIndex >= 0 && yIndex < numRows) {
                if (mineMatrix[xIndex][yIndex] >= 0) {
                    revealCell(xIndex, yIndex);
                }
            }
        }
    }
};

const revealCell = (x, y) => {
    var cell = document.getElementById(x + '-' + y);
    if (cell.classList.contains('flag')) return;

    if (mineMatrix[x][y] > 0) {
        cell.innerHTML = mineMatrix[x][y];
        cell.style.color = getNumberColor(mineMatrix[x][y]);
    }

    revealedCellMatrix[x][y] = true;
    cell.classList.add('revealed');
};

const cellClick = (e) => {
    if (
        e.target.classList.contains('revealed') ||
        e.target.classList.contains('flag') ||
        gameOver == true
    )
        return;

    var xIndex = parseInt(e.target.style.gridColumn, 10) - 1;
    var yIndex = parseInt(e.target.style.gridRow, 10) - 1;

    if (initialized === false) initField(xIndex, yIndex);

    if (mineMatrix[xIndex][yIndex] < 0) {
        e.target.classList.add('mine');
        loseGame();
    } else {
        revealCell(xIndex, yIndex);
        if (mineMatrix[xIndex][yIndex] == 0) {
            revealConnected(xIndex, yIndex);
        }
        checkIfWin();
    }
};

// flag
const cellRightClick = (e) => {
    e.preventDefault();
    if (e.target.classList.contains('revealed') || gameOver == true) return;

    if (e.target.classList.contains('flag')) {
        e.target.classList.remove('flag');
        flagsPlaced--;
    } else {
        if (flagsPlaced < numMinesApplied) {
            e.target.classList.add('flag');
            flagsPlaced++;
        }
    }
    setMineCounter(numMinesApplied - flagsPlaced);
};

const revealAll = () => {
    // Empty Grid
    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            var cell = document.getElementById(x + '-' + y);
            cell.classList.remove('mine');
            cell.innerHTML = '';

            if (mineMatrix[x][y] < 0 && !cell.classList.contains('flag')) {
                cell.classList.add('mine');
            } else if (mineMatrix[x][y] > 0) {
                cell.innerHTML = mineMatrix[x][y];
                cell.classList.remove('flag');
                cell.style.color = getNumberColor(mineMatrix[x][y]);
            }
            cell.classList.add('revealed');
        }
    }
};

const loseGame = () => {
    gameOver = true;
    var smiley = document.querySelector('#smiley');
    smiley.classList.remove('scared');
    smiley.classList.add('dead');

    revealAll();
};

const checkIfWin = () => {
    // Empty Grid
    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            if (revealedCellMatrix[x][y] === false && mineMatrix[x][y] >= 0) return;
        }
    }

    var smiley = document.querySelector('#smiley');
    smiley.classList.remove('scared');
    smiley.classList.add('won');
    gameOver = true;
};

const initField = (startX, startY) => {
    numMinesApplied = 0;
    initialized = true;

    // Empty Grid
    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            mineMatrix[x][y] = 0;
            revealedCellMatrix[x][y] = false;
        }
    }

    // Mines
    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            var mineprobability =
                (numMines - numMinesApplied) / ((numColumns - y + 1) * 16 + (numRows - x + 1));
            var isStartingPos = x === startX && y === startY;
            var cellHasMine = Math.random() <= mineprobability && isStartingPos === false;

            if (cellHasMine) {
                mineMatrix[x][y] = -1;
                numMinesApplied++;

                // increment neighbour cells' bomb count
                for (ny = -1; ny <= 1; ny++) {
                    for (nx = -1; nx <= 1; nx++) {
                        var xIndex = x + nx;
                        var yIndex = y + ny;
                        // If not mine or outside bounds, increment
                        if (
                            xIndex >= 0 &&
                            xIndex < numColumns &&
                            yIndex >= 0 &&
                            yIndex < numRows &&
                            mineMatrix[xIndex][yIndex] >= 0
                        ) {
                            mineMatrix[xIndex][yIndex] = mineMatrix[xIndex][yIndex] + 1;
                        }
                    }
                }
            }
        }
    }
};

const reset = () => {
    wrapper.innerHTML = '';
    timeCounterNumber = 0;
    flagsPlaced = 0;
    numMinesApplied = 0;
    revealedZeros = [];
    gameOver = false;

    timeCounterNumber = 0;

    var hundreds = document.querySelector('#time-counter .hundreds');
    var tens = document.querySelector('#time-counter .tens');
    var ones = document.querySelector('#time-counter .ones');

    const classPrefix = 'time';

    for (i = 0; i < 10; i++) {
        hundreds.classList.remove(classPrefix + i);
        tens.classList.remove(classPrefix + i);
        ones.classList.remove(classPrefix + i);
    }

    var smiley = document.querySelector('#smiley');
    smiley.classList.remove('scared');
    smiley.classList.remove('won');
    smiley.classList.remove('dead');

    // DOM unrevealed cells
    for (y = 0; y < numRows; y++) {
        for (x = 0; x < numColumns; x++) {
            var cell = document.createElement('div');
            cell.style.gridColumn = x + 1;
            cell.style.gridRow = y + 1;
            cell.classList.add('cell');
            cell.addEventListener('click', cellClick);
            cell.addEventListener('contextmenu', cellRightClick);
            cell.addEventListener('mousedown', addActive);

            cell.id = x + '-' + y;

            wrapper.appendChild(cell);
        }
    }

    initialized = false;
};

var activeCell;
const addActive = (e) => {
    var smiley = document.querySelector('#smiley');
    smiley.classList.add('scared');

    e.target.classList.add('active');
    activeCell = e.target;
};

const removeActive = (e) => {
    if (activeCell) {
        var smiley = document.querySelector('#smiley');
        smiley.classList.remove('scared');

        activeCell.classList.remove('active');
        activeCell = null;
    }
};

document.addEventListener('mouseup', removeActive);

var intervalId = window.setInterval(function () {
    if (gameOver == false && initialized == true) incrementTimeCounter();
}, 1000);

reset();
setMineCounter(numMines);
