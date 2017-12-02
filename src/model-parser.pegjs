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

Start = interfaces:Interface* _ {
    return {
        _kind: "Model",
        interfaces
    };
}

Interface = _ "interface" _ name:IDENT _ type:NormalObjectType {
    return {
        _kind: "Interface",
        name,
        type
    };
}

NormalObjectType = "{" fields:Field* _ "}" {
    return {
        _kind: "NormalObjectType",
        fields
    }
}

Field = _ name:IDENT _ optional:"?"? _ ":" _ type:Type nullable:(_ "|" _ "null")? _ ";" {
    return {
        _kind: "Field",
        name,
        optional: !!optional,
        nullable: !!nullable,
        type
    };
}

Type = ArrayType / NamedType / NormalObjectType

ArrayType = members:NamedType _ "[" _ "]" {
    return {
        _kind: "ArrayType",
        members
    };
}

NamedType = name:IDENT {
    return {
        _kind: "NamedType",
        name
    };
}

IDENT = a:[A-Za-z_] b:[A-Za-z_0-9]* {
    return a + b.join("");
}

_ = [ \t\n\r]*
