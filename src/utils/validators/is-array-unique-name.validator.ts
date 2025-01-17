import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export default function IsArrayUniqueName(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsArrayUniqueName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any[], args: ValidationArguments) {
          if (!value || value.length === 0) return true;

          const names = value.map((item) => item.name);
          const uniqueNames = new Set(names);
          return uniqueNames.size === names.length;
        },
        defaultMessage(_: ValidationArguments) {
          return 'Each participant must have a unique name.';
        },
      },
    });
  };
}
