module.exports = (arrayOfNumbers) => {
    arrayOfNumbers = arrayOfNumbers.sort(function(a, b) { return a - b; });
    const half = Math.floor(arrayOfNumbers.length / 2);
    let mediane;
    if (arrayOfNumbers.length % 2) {
        mediane = arrayOfNumbers[half];
    } else {
        mediane = (arrayOfNumbers[half - 1] + arrayOfNumbers[half]) / 2.0;
    }

    return mediane;
};