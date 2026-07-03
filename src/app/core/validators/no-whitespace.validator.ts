import { AbstractControl, ValidationErrors } from '@angular/forms';

export class NoWhitespaceDirective {
  static validate(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === undefined) {
      return null;
    }
    if (String(control.value).trim() === '') {
      return { required: true };
    }
    return null;
  }
}
