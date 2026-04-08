/*
  Project 4: Javascript Calculator

  display:
  Points to the text area that shows the current number or result.

  buttons:
  Points to the parent container that holds every calculator button.
  This is for event delegation so one listener can manage all button clicks
  instead of attaching a separate listener to every single button.
*/
const display = document.querySelector('.calculator-display');
const buttons = document.querySelector('.calculator-buttons');

/*
  Central calculator state object.

  This stores the information the calculator needs between button presses:

  displayValue:
  The number currently shown on the screen as a string.
  It's kept as a string so digit entry is easy to build one character at a time.

  firstOperand:
  Stores the first number in an operation, such as the 8 in 8 + 2.

  operator:
  Stores which operator was selected, such as add, subtract, multiply, or divide.

  waitingForSecondOperand:
  A flag that tells the program whether the next digit typed should begin a new
  number instead of appending to the current one.
*/
const calculator = {
  displayValue: '0',
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
};

/*
  updateDisplay()
  Pushes the current calculator.displayValue onto the screen.

  JavaScript changes the state object first, then this function refreshes the UI
  so the user can actually see that change.
*/
function updateDisplay() {
  display.textContent = calculator.displayValue;
}

/*
  resetCalculator()
  Returns the calculator to its default startup state.

  The C button should fully clear:
  - the visible number
  - the stored first operand
  - the stored operator
  - the waiting state

  This is also useful when recovering from an Error state
*/
function resetCalculator() {
  calculator.displayValue = '0';
  calculator.firstOperand = null;
  calculator.operator = null;
  calculator.waitingForSecondOperand = false;
  updateDisplay();
}

/*
  inputDigit(digit)
  Handles number-button presses.

  Main behavior:
  1. If the calculator is currently showing Error, reset first
  2. If user just selected an operator, replace the display with the new digit
     because the user is starting the second operand
  3. Otherwise, append the digit to the existing display
*/
function inputDigit(digit) {
  if (calculator.displayValue === 'Error') {
    resetCalculator();
  }

  if (calculator.waitingForSecondOperand) {
    calculator.displayValue = digit;
    calculator.waitingForSecondOperand = false;
    return;
  }

  calculator.displayValue =
    calculator.displayValue === '0' ? digit : calculator.displayValue + digit;
}

/*
  removeLastDigit()
  Implements the backspace button

  Main behavior:
  - If the screen shows Error, reset the calculator.
  - If waiting for the second operand, do nothing because a new number
    has not actually started yet
  - Otherwise remove the last character from the display string.
  - If only one character remains, fall back to 0

  Backspace gives the user a lightweight correction tool without forcing a full clear
*/
function removeLastDigit() {
  if (calculator.displayValue === 'Error') {
    resetCalculator();
    return;
  }

  if (calculator.waitingForSecondOperand) {
    return;
  }

  calculator.displayValue = calculator.displayValue.length > 1
    ? calculator.displayValue.slice(0, -1)
    : '0';
}

/*
  calculate(firstOperand, secondOperand, operator)
  Performs the actual arithmetic

  Important design choice:
  No eval() is used here

  Instead, explicitly map operator names to real math operations:
  - add => +
  - subtract => -
  - multiply => *
  - divide => /

  Divide-by-zero protection
  If the second operand is 0 during division, return null so the program can
  convert that case into a visible Error state
*/
function calculate(firstOperand, secondOperand, operator) {
  switch (operator) {
    case 'add':
      return firstOperand + secondOperand;
    case 'subtract':
      return firstOperand - secondOperand;
    case 'multiply':
      return firstOperand * secondOperand;
    case 'divide':
      return secondOperand === 0 ? null : firstOperand / secondOperand;
    default:
      return secondOperand;
  }
}

/*
  formatResult(result)
  Cleans up the output before putting it on screen.

  JavaScript floating-point math can sometimes produce long decimal values.
  This function:
  - turns invalid values into Error
  - rounds the answer to a manageable precision
  - converts the result back to a string for display
*/
function formatResult(result) {
  if (!Number.isFinite(result)) {
    return 'Error';
  }

  const roundedResult = Math.round(result * 1000000000) / 1000000000;
  return String(roundedResult);
}

/*
  handleOperator(nextOperator)
  Runs when the user presses +, -, x, or /

  Main behavior:
  1. If the display is Error, reset first
  2. Convert the visible display string into a number.
  3. If the user presses operators repeatedly before typing a second number,
     just replace the stored operator.
  4. If there is no first operand yet, store the current display as firstOperand.
  5. If there is already a stored first operand and operator, calculate the
     intermediate result so chained operations work.

  Example:
  8 + 2 + 3
  After pressing the second +, the calculator computes 10 first, then waits
  for the next operand.

  This function handles the transition between one operand and the next and
  makes multi-step calculations behave like a real calculator.
*/
function handleOperator(nextOperator) {
  if (calculator.displayValue === 'Error') {
    resetCalculator();
    return;
  }

  const inputValue = Number(calculator.displayValue);

  if (calculator.operator && calculator.waitingForSecondOperand) {
    calculator.operator = nextOperator;
    return;
  }

  if (calculator.firstOperand === null) {
    calculator.firstOperand = inputValue;
  } else if (calculator.operator) {
    const result = calculate(calculator.firstOperand, inputValue, calculator.operator);

    if (result === null) {
      calculator.displayValue = 'Error';
      calculator.firstOperand = null;
      calculator.operator = null;
      calculator.waitingForSecondOperand = false;
      updateDisplay();
      return;
    }

    calculator.displayValue = formatResult(result);
    calculator.firstOperand = Number(calculator.displayValue);
  }

  calculator.operator = nextOperator;
  calculator.waitingForSecondOperand = true;
}

/*
  handleEquals()
  Runs when the user presses =

  Main behavior:
  - Make sure a valid operation is ready
  - Convert the current display into the second operand
  - Calculate the final result
  - Handle divide-by-zero safely
  - Reset operator tracking so a new calculation can begin

  This is the function that completes the arithmetic cycle and produces the
  final displayed answer for the current operation.
*/
function handleEquals() {
  if (
    calculator.operator === null ||
    calculator.waitingForSecondOperand ||
    calculator.displayValue === 'Error'
  ) {
    return;
  }

  const secondOperand = Number(calculator.displayValue);
  const result = calculate(calculator.firstOperand, secondOperand, calculator.operator);

  if (result === null) {
    calculator.displayValue = 'Error';
  } else {
    calculator.displayValue = formatResult(result);
  }

  calculator.firstOperand = null;
  calculator.operator = null;
  calculator.waitingForSecondOperand = false;
  updateDisplay();
}

/*
  Event delegation for the keypad.

  Instead of adding one click listener to every button, this adds one listener to
  the parent .calculator-buttons container and inspects which button was clicked

  - less repetitive code
  - easier to maintain
  - works well because all calculator buttons live in the same section
*/
buttons.addEventListener('click', (event) => {
  const target = event.target;

  if (!target.matches('button')) {
    return;
  }

  const { action, value } = target.dataset;

  /*
    data-action controls which logical branch should run:
    - number => digit entry
    - clear => full reset
    - backspace => remove one digit
    - operator => store/execute an operator
    - equals => finalize the result
  */
  if (action === 'number') {
    inputDigit(value);
    updateDisplay();
    return;
  }

  if (action === 'clear') {
    resetCalculator();
    return;
  }

  if (action === 'backspace') {
    removeLastDigit();
    updateDisplay();
    return;
  }

  if (action === 'operator') {
    handleOperator(value);
    updateDisplay();
    return;
  }

  if (action === 'equals') {
    handleEquals();
  }
});

/*
  Initialize the calculator screen when the page first loads.
  This is to ensure that the visible display matches the default state object
*/
updateDisplay();
