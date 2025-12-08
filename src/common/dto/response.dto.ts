
export class ResponseDto<T> {
    success: boolean;
    message: string;
    data?: T;
    meta?: any;

    constructor(success: boolean, message: string, data?: T, meta?: any) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }
}
