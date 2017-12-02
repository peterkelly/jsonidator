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

const parser: any = require("./model-parser");

export interface Model {
    _kind: "model";
    interfaces: Interface[];
}

export interface Interface {
    _kind: "Interface";
    name: string;
    type: ObjectType;
}

export interface Field {
    _kind: "Field";
    name: string;
    body: FieldBody;
}

export type Type = ArrayType | NamedType | ObjectType;

export interface ArrayType {
    _kind: "ArrayType";
    members: Type;
}

export interface NamedType {
    _kind: "NamedType";
    name: string;
}

export function parse(input: string): Model {
    try {
        return (<any> parser).parse(input);
    }
    catch (e) {
        if (e instanceof parser.SyntaxError)
            throw new ParseError(e);
        else
            throw e;
    }
}

export type ObjectType = NormalObjectType | IndexedObjectType;

export interface NormalObjectType {
    _kind: "NormalObjectType";
    fields: Field[];
}

export interface IndexedObjectType {
    _kind: "IndexedObjectType";
    member: FieldBody;
}

export interface FieldBody {
    _kind: "FieldType";
    optional: boolean;
    nullable: boolean;
    type: Type;
}

export class ParseError extends Error {
    public location: {
        start: {
            offset: number;
            line: number;
            column: number;
        };
        end: {
            offset: number;
            line: number;
            column: number;
        };
    };

    public constructor(e: any) {
        super(e.message);
        this.location = e.location;
        Object.setPrototypeOf(this, ParseError.prototype);
    }
}
