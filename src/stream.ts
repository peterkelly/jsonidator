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

import * as stream from "stream";
import * as path from "path";

import { parse } from "./model";
import { generate } from "./generate";

export function process(): stream.Transform {
    const transformer = new stream.Transform({
        objectMode: true,
        transform: (file: any, encoding: any, callback: any) => {
            const File = file.constructor;
            if (!file.path.match(/\.model$/))
                throw new Error("File " + path.basename(file.path) + "must have .model extension");

            // console.log("transform");
            // console.log("    file.constructor.name = " + file.constructor.name);
            // // console.log("    file = " + JSON.stringify(file, null, "    "));
            // console.log("    file.cwd      = " + file.cwd);
            // console.log("    file.base     = " + file.base);
            // console.log("    file.path     = " + file.path);
            // console.log("    file.contents = " + file.contents.constructor.name);
            // console.log("    encoding      = " + JSON.stringify(encoding));
            // console.log("    callback      = " + callback);

            const model = parse(file.contents.toString("utf-8"));
            const output = generate(model);
            const out = new File({
                cwd: file.cwd,
                base: file.base,
                path: file.path.replace(/\.model$/, ".ts"),
                contents: new Buffer(output),
            });

            // console.log("    out.cwd       = " + outFile.cwd);
            // console.log("    out.base      = " + outFile.base);
            // console.log("    out.path      = " + outFile.path);

            transformer.push(out);
            callback(null);
        }
    });
    return transformer;
}
