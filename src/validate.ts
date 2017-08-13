// Copyright 2017 Peter Kelly <peter@pmkelly.net>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export type ValidationFunction<T> = (data: any, path?: string) => T;

export class ValidationError extends Error {
    public constructor(path: string | undefined, expected: string, value: any) {
        const prefix = path ? (path + ": ") : "";
        let message: string;
        if (value === undefined)
            message = prefix + "Missing field; expected " + expected;
        else
            message = prefix + "Expected " + expected + ", got " + gotStr(value);
        super(message);

        // Workaround for problem with subclassing Error in TypeScript
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md
        // #extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

function type(value: string) {
    if (value === null)
        return "null";
    else
        return typeof(value);
}

function gotStr(data: any): string {
    switch (type(data)) {
        case "null":
        case "undefined":
        case "object":
            return type(data);
        default:
            return JSON.stringify(data);
    }
}

export function join(parent: string | undefined, child: string): string {
    if (parent)
        return `${parent}.${child}`;
    else
        return child;
}

export function array<T>(validationFun: ValidationFunction<T>): ValidationFunction<T[]> {
    return (data: any, path?: string): T[] => {
        path = path || "";
        if (!(data instanceof Array))
            throw new ValidationError(path, "an array", data);
        const result: T[] = [];
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            result.push(validationFun(element, path + "[" + i + "]"));
        }
        return result;
    };
}

export function checkObject(data: any, path?: string): void {
    if (type(data) !== "object") {
        throw new ValidationError(path, "an object", data);
    }
}

export function string(data: any, path?: string): string {
    path = path || "";
    if (type(data) !== "string")
        throw new ValidationError(path, "a string", data);
    return data;
}

export function number(data: any, path?: string): number {
    path = path || "";
    if (type(data) !== "number")
        throw new ValidationError(path, "a number", data);
    return data;
}

export function boolean(data: any, path?: string): boolean {
    path = path || "";
    if (type(data) !== "boolean")
        throw new ValidationError(path, "a boolean", data);
    return data;
}

export function any(data: any, path?: string): boolean {
    return data;
}
