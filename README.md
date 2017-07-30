# JSONidator - A code generator for JSON validation

JSONidator generates TypeScript code that dynamically type checks JSON data to
ensure it complies with a schema defined in a model file. The syntax used to
describe schemas, at present, is based on TypeScript.

**Warning:** This project is in the early stages of development and it's API
and input file format is likely to change in subsequent versions.

# Supported features

- Interface types (top-level definitions only)
- Builtin JSON types (string, number, boolean)
- Nullability (`fieldName: SomeType | null` means that fieldName can be `null`)
- Optionality (`fieldName?: SomeType` means that fieldName can be absent)
- Arrays

Please note that TypeScript's type system supports a much broader range of
features, such as union types and generics. JSONidator will likely support some
of these in the future.

# Example

Create a file called `types.model`:

    interface Family {
        surname: string;
        location: string | null;
        members: Person[];
    }

    interface Person {
        name: string;
        age: number;
        employed: boolean;
        profession?: string;
    }

Run the following command to generate a TypeScript file containing validation
functions for the above:

    jsonidator types.model > types.ts

The contents of `types.ts` will look like this:

    export interface Family {
        // ... as above
    }

    export interface Person {
        // ... as above
    }

    export function Family(obj: any, path?: string): Family {
        // Check that fields of obj match the Family interface. Return a new
        // Family object on success, throw an error on failure.
    }

    export function Person(obj: any, path?: string): Person {
        // Check that fields of obj match the Person interface. Return a new
        // Family object on success, throw an error on failure.
    }

You should save the generated file somewhere in your source tree so that it
will be compiled along with the rest of your code. You can then import both the
interfaces and validation functions as follows:

    import { Family } from "./types";

    const input = ... // read data as string from server/client/filesystem
    const data = JSON.parse(input); // Convert string to JSON object
    const family = Family(data); // Ensure data is a valid Family object

# Integrating with your build process

It's best to have JSONidator run automatically as part of your build process.
If you do this, you should exclude the generated code from your repository by
listing it in `.gitignore`, and have the `clean` part of your build process
delete it. This ensures the model and generated code don't get out of sync.
Avoid modifying the generate coded by hand - if you need to change something,
do it in the model.

## Basic usage

    const jsonidator = require("jsonidator");

    const input = fs.readFileSync("src/types.model", { encoding: "utf-8" });
    const model = jsonidator.parse(input);
    const source = jsonidator.generate(model);
    fs.writeFileSync("src/types.ts", source);

## Gulp integration

    const jsonidator = require("jsonidator");

    gulp.task("gen-types", () => {
        return gulp.src("src/*.model")
            .pipe(jsonidator.process())
            .pipe(gulp.dest("src/generated"));
    });
