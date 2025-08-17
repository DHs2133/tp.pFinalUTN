import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | undefined;
    if (!value) {
      return null;
    }
    if (value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  };
}
