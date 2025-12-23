import { IsString, IsNotEmpty, IsDateString, IsUUID, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(dateString: string, args: ValidationArguments) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        return inputDate >= today;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Date must be today or a future date. Past dates are not allowed.';
    }
}

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
    validate(endDateString: string, args: ValidationArguments) {
        const dto = args.object as CreateLeaveRequestDto;
        if (!dto.startDate) return true; // Let other validators handle missing startDate

        const startDate = new Date(dto.startDate);
        const endDate = new Date(endDateString);
        return endDate >= startDate;
    }

    defaultMessage(args: ValidationArguments) {
        return 'End date must be equal to or after start date.';
    }
}

export class CreateLeaveRequestDto {
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @IsDateString()
    @IsNotEmpty()
    @Validate(IsFutureDateConstraint)
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    @Validate(IsFutureDateConstraint)
    @Validate(IsEndDateAfterStartDateConstraint)
    endDate: string;
}
