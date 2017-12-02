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
    Type,
    NormalObjectType,
} from "./model";

function outputType(type: Type, prefix: string, indent: string, output: string[]): void {
    switch (type._kind) {
        case "ArrayType":
            outputType(type.members, prefix, indent + "    ", output);
            output.push("[]");
            break;
        case "NamedType":
            output.push(prefix + type.name);
            break;
        case "NormalObjectType":
            outputNormalObjectType(type, prefix, indent + "    ", output);
            break;
    }
}

function outputNormalObjectType(type: NormalObjectType, prefix: string, indent: string, output: string[]): void {
    output.push("{\n");
    for (const field of type.fields) {
        const optional = field.optional ? "?" : "";
        const nullable = field.nullable ? " | null" : "";
        output.push(`    ${indent}${field.name}${optional}: `);
        outputType(field.type, "", indent, output);
        output.push(`${nullable};\n`);
    }
    output.push(indent + "}");
}

function generateInterfaces(model: Model): string {
    const output: string[] = [];
    for (let i = 0; i < model.interfaces.length; i++) {
        const iface = model.interfaces[i];
        const otype = iface.type;
        output.push("export interface " + iface.name + " ");
        outputNormalObjectType(otype, "", "", output);
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
        case "NormalObjectType": {
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

function outputValidationFunctionBody(type: NormalObjectType, varName: string, output: string[], scope: Scope) {
    output.push("    validation.checkObject(" + varName + ", path);\n");
    output.push("    return {\n");
    for (const field of type.fields) {
        const accessor = `${varName}.${field.name}`;
        let prefix = "";
        if (field.nullable)
            prefix = `(${accessor} === null) ? null : ${prefix}`;
        if (field.optional)
            prefix = `(${accessor} === undefined) ? undefined : ${prefix}`;
        output.push(`        ${field.name}: ${prefix}`);
        outputValidationExpr(field.type, output, scope);
        output.push(`(${varName}.${field.name}, validation.join(path, '${field.name}')),\n`);

    }
    output.push("    };\n");
}

function generateValidationFunctions(model: Model): string {
    const output: string[] = [];
    for (let i = 0; i < model.interfaces.length; i++) {
        const scope = new Scope();
        const iface = model.interfaces[i];
        const varName = "obj";
        output.push("export function " + iface.name + "(" + varName + ": any, path?: string): " + iface.name + " {\n");
        outputValidationFunctionBody(iface.type, varName, output, scope);
        output.push(scope.extraFunctions.join(""));
        output.push("}\n");
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
