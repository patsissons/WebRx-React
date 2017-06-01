declare global {
  interface NumberConstructor {
    isNumber(value: any): value is number;
    isNumeric(value: any): boolean;
    isInt(value: number): boolean;
  }
}

function isNumber(value: any): value is number {
  return typeof value === 'number' || value instanceof Number;
}
Number.isNumber = isNumber;

// jQuery implementation
// see: https://github.com/jquery/jquery/blob/bf48c21d225c31f0f9b5441d95f73615ca3dcfdb/src/core.js#L206
function isNumeric(value: any) {
  return value == null ? false : (value - parseFloat(value) + 1) >= 0;
}
Number.isNumeric = isNumeric;

function isInt(value: any) {
  return isNumber(value) && parseInt(value.toFixed(0)) === value;
}
Number.isInt = isInt;

export {};
