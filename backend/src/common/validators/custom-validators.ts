import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isMongoId,
} from 'class-validator';

/**
 * Validates whether a value is a valid 24-character hexadecimal MongoDB ObjectId
 */
export function IsMongoObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMongoObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} phải là ObjectId hợp lệ (24 ký tự hex)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return isMongoId(value);
        },
      },
    });
  };
}

/**
 * Validates whether a value is a valid Vietnamese phone number
 * Format: 10 digits starting with 03, 05, 07, 08, 09 or +84...
 */
export const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

export function IsPhoneNumberVN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumberVN',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} phải là số điện thoại Việt Nam hợp lệ (10 chữ số, ví dụ 0901234567)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return VN_PHONE_REGEX.test(value.trim());
        },
      },
    });
  };
}
