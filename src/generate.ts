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

import {
    Model,
    Interface,
    Field,
    FieldBody,
    Type,
    ObjectType,
    NormalObjectType,
    IndexedObjectType,
} from "./model";

function outputType(type: Type, indent: string, output: string[]): void {
    switch (type._kind) {
        case "ArrayType":
            outputType(type.members, indent + "    ", output);
            output.push("[]");
            break;
        case "NamedType":
            output.push(type.name);
            break;
        case "NormalObjectType":
            outputNormalObjectType(type, indent + "    ", output);
            break;
        case "IndexedObjectType":
            outputIndexedObjectType(type, indent + "    ", output);
            break;
    }
}

function outputFieldBody(body: FieldBody, indent: string, output: string[]) {
    const optional = body.optional ? "?" : "";
    const nullable = body.nullable ? " | null" : "";
    output.push(`${optional}: `);
    outputType(body.type, indent, output);
    output.push(`${nullable};\n`);
}

function outputNormalObjectType(type: NormalObjectType, indent: string, output: string[]): void {
    output.push("{\n");
    for (const field of type.fields) {
        const body = field.body;
        output.push(`    ${indent}${field.name}`);
        outputFieldBody(body, indent, output);
    }
    output.push(indent + "}");
}

function outputIndexedObjectType(type: IndexedObjectType, indent: string, output: string[]): void {
    output.push("{\n");
    output.push(indent + "    [key: string]");
    outputFieldBody(type.member, indent, output);
    output.push(indent + "}");
}

function generateInterfaces(model: Model): string {
    const output: string[] = [];
    for (let i = 0; i < model.interfaces.length; i++) {
        const iface = model.interfaces[i];
        const otype = iface.type;
        output.push("export interface " + iface.name + " ");
        if (otype._kind === "NormalObjectType")
            outputNormalObjectType(otype, "", output);
        else
            outputIndexedObjectType(otype, "", output);
        output.push("\n");
        if (i + 1 < model.interfaces.length)
            output.push("\n");
    }
    return output.join("");
}

class Scope {
    public nextFunctionId: number = 1;
    public extraFunctions: string[] = [];
}

function outputValidationExpr(type: Type, output: string[], scope: Scope): void {
    switch (type._kind) {
        case "ArrayType":
            output.push("validation.array(");
            outputValidationExpr(type.members, output, scope);
            output.push(")");
            break;
        case "NamedType":
            switch (type.name) {
                case "string":
                    output.push("validation.string");
                    break;
                case "number":
                    output.push("validation.number");
                    break;
                case "boolean":
                    output.push("validation.boolean");
                    break;
                case "any":
                    output.push("validation.any");
                    break;
                default:
                    output.push(type.name);
                    break;
            }
            break;
        case "NormalObjectType":
        case "IndexedObjectType": {
            const varName = "v";
            const body: string[] = [];
            outputValidationFunctionBody(type, varName, body, scope);

            const functionId = scope.nextFunctionId++;
            const functionName = "validate" + functionId;
            output.push(functionName);
            const extraContent: string[] = [];
            extraContent.push("\n");
            extraContent.push("function " + functionName + "(" + varName + ": any, path?: string): any {\n");
            extraContent.push(body.join(""));
            extraContent.push("}\n");
            const lines = extraContent.join("").split("\n");
            const indentedLines = lines.map(l => (l === "") ? "" : "    " + l);
            scope.extraFunctions.push(indentedLines.join("\n"));
            break;
        }
    }
}

function outputNormalValidationFunctionBody(type: NormalObjectType, varName: string, output: string[], scope: Scope) {
    output.push("    validation.checkObject(" + varName + ", path);\n");
    output.push("    return {\n");
    for (const field of type.fields) {
        const body = field.body;
        const accessor = `${varName}.${field.name}`;
        let prefix = "";
        if (body.nullable)
            prefix = `(${accessor} === null) ? null : ${prefix}`;
        if (body.optional)
            prefix = `(${accessor} === undefined) ? undefined : ${prefix}`;
        output.push(`        ${field.name}: ${prefix}`);
        outputValidationExpr(body.type, output, scope);
        output.push(`(${accessor}, validation.join(path, '${field.name}')),\n`);

    }
    output.push("    };\n");
}

function outputIndexedValidationFunctionBody(type: IndexedObjectType, varName: string, output: string[], scope: Scope) {
    const body = type.member;

    output.push("    validation.checkObject(" + varName + ", path);\n");
    output.push("    const result: any = {};\n");
    output.push("    for (let key in " + varName + ") {\n");
    output.push("        const value = " + varName + "[key];\n");

    let prefix = "";
    if (body.nullable)
        prefix = `(value === null) ? null : ${prefix}`;
    if (body.optional)
        prefix = `(value === undefined) ? undefined : ${prefix}`;
    output.push(`        result[key] = ${prefix}`);
    outputValidationExpr(body.type, output, scope);
    output.push(`(value, validation.join(path, key));\n`);

    output.push("    }\n");
    output.push("    return result;\n");
}

function outputValidationFunctionBody(type: ObjectType, varName: string, output: string[], scope: Scope): void {
    if (type._kind === "NormalObjectType")
        outputNormalValidationFunctionBody(type, varName, output, scope);
    else
        outputIndexedValidationFunctionBody(type, varName, output, scope);
}

function outputObjectValidationFunction(type: ObjectType, name: string, varName: string, output: string[]): void {
    const scope = new Scope();
    output.push("export function " + name + "(" + varName + ": any, path?: string): " + name + " {\n");
    outputValidationFunctionBody(type, varName, output, scope);
    output.push(scope.extraFunctions.join(""));
    output.push("}\n");
}

function generateValidationFunctions(model: Model): string {
    const output: string[] = [];
    for (let i = 0; i < model.interfaces.length; i++) {
        const iface = model.interfaces[i];
        const varName = "obj";
        outputObjectValidationFunction(iface.type, iface.name, varName, output);
        if (i + 1 < model.interfaces.length)
            output.push("\n");
    }
    return output.join("");
}

export function generate(model: Model): string {
    return "/* tslint:disable */\n\n" +
        "// This file was automatically generated by jsonidator. You should\n" +
        "// modify the original model file if you wish to make changes.\n\n" +
        "import * as validation from \"jsonidator\";\n\n" +
        generateInterfaces(model) +
        "\n" +
        generateValidationFunctions(model);
}
