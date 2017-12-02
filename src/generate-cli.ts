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

/// <reference types="node" />

import * as fs from "fs";

// const parser: any = require("./model-parser");
import { parse, ParseError } from "./model";
import { generate } from "./generate";

export function main(): void {
    if (process.argv.length < 3) {
        console.error("Please specify model filename");
        process.exit(1);
    }

    const filename = process.argv[2];

    const input = fs.readFileSync(filename, { encoding: "utf-8" });
    try {
        const model = parse(input);
        // console.log(JSON.stringify(model, null, "    "));
        process.stdout.write(generate(model));
    }
    catch (e) {
        if (e instanceof ParseError) {
            const start = e.location.start;
            console.error(`${filename}:${start.line}:${start.column}: ${e.message}`);
        } else {
            console.error(e);
        }
        // let isPegSyntaxError = false;
        // // console.log("peg$SyntaxError = " + parser.SyntaxError);
        // if (e instanceof parser.SyntaxError)
        //     isPegSyntaxError = true;
        // console.log("isPegSyntaxError = " + isPegSyntaxError);
        // if ((typeof(e) === "object") && (e !== null)) {
        //     console.error("e is a " + e.constructor.name);
        //     try {
        //         console.error(JSON.stringify(e, null, "    "));
        //     }
        //     catch (e) {
        //     }
        // }
        // else {
        //     console.error("e is a " + typeof(e));
        // }
        // console.error("====");
        // console.error(e);
        process.exit(1);
    }
}
