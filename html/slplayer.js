var SLPlayer = (function() {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    return (
        function(SLPlayer) {
            SLPlayer = SLPlayer || {};

            var Module = typeof SLPlayer !== "undefined" ? SLPlayer : {};
            Module["workerBuffer"] = 0;
            Module["workerBufferMax"] = 0;
            Module["workerBufferSize"] = 0;
            Module["hasYUV"] = false;
            Module["stringToCMax"] = 0;
            Module["stringToCBuffer"] = 0;
            Module["WorkerBufferToC"] = function(buff) {
                if ("object" != typeof buff || "number" != typeof buff.byteLength || buff.byteLength <= 0) {
                    return 0
                }
                var data = new Uint8Array(buff);
                var len = data.length;
                if (Module["workerBufferMax"] < len) {
                    if (0 != Module["workerBuffer"]) {
                        this._free(Module["workerBuffer"])
                    }
                    Module["workerBuffer"] = this._malloc(len);
                    Module["workerBufferMax"] = len
                }
                Module["workerBufferSize"] = len;
                HEAPU8.set(data, Module["workerBuffer"]);
                return Module["workerBuffer"]
            };
            Module["StringToC"] = function(str) {
                var len = lengthBytesUTF8(str) + 1;
                if (Module["stringToCMax"] < len) {
                    if (0 != Module["stringToCBuffer"]) {
                        this._free(Module["stringToCBuffer"])
                    }
                    Module["stringToCBuffer"] = this._malloc(len);
                    Module["stringToCMax"] = len
                }
                stringToUTF8(str, Module["stringToCBuffer"], Module["stringToCMax"]);
                return Module["stringToCBuffer"]
            };
            uint8ArrayFromString = function(str) {
                var ret = new Uint8Array(lengthBytesUTF8(str));
                stringToUTF8Array(str, ret, 0, ret.length + 1);
                return ret
            };
            Module["version"] = function() {
                return UTF8ToString(this._version())
            };
            Module["start"] = function(url) {
                Module["viewURL"] = url;
                Module["hasYUV"] = false;
                this._start()
            };
            Module["stop"] = function() {
                this._stop()
            };
            Module["onworkermessage"] = function(event) {
                if ("object" != typeof event.data) {
                    console.error("worker response error: event.data is not object");
                    return
                }
                if ("string" != typeof event.data.m) {
                    console.error("worker response error: event.data.m is not undefined.");
                    return
                }
                switch (event.data.m) {
                    case "onWorkerInit":
                        Module["onWorkerInit"](event.data);
                        break;
                    case "onWorkerConnect":
                        Module["onWorkerConnect"](event.data);
                        break;
                    case "onWorkerError":
                        Module["onWorkerError"](event.data);
                        break;
                    case "onWorkerYUV":
                        Module["onWorkerYUV"](event.data);
                        break;
                    case "onWorkerPCM":
                        Module["onWorkerPCM"](event.data);
                        break;
                    default:
                        console.error("can not found method: ", event.data.m);
                        break
                }
            };
            Module["onWorkerInit"] = function(obj) {
                Module["doWorkerConnect"](Module["viewURL"])
            };
            Module["onWorkerConnect"] = function(obj) {};
            Module["onWorkerError"] = function(obj) {
                var str;
                var err = obj.e;
                if ("object" == typeof err && "string" == typeof err.message) {
                    str = err.message
                } else {
                    str = String(err)
                }
                _onWorkerError(obj.c, Module["StringToC"](str))
            };
            Module["onWorkerYUV"] = function(obj) {
                var yuv = new Uint8Array(obj.yuv);
                var cBuffer = Module["WorkerBufferToC"](yuv.subarray(0, obj.len));
                var cLen = Module["workerBufferSize"];
                Module["doWorkerACK"]("yuv", obj.yuv);
                _onWorkerYUV(obj.w, obj.h, cBuffer, cLen);
                if ("function" == typeof Module["onPlayTime"]) {
                    if (obj.ts !== Module["_lastPlayTime"]) {
                        Module["_lastPlayTime"] = obj.ts;
                        Module["onPlayTime"](obj.ts)
                    }
                }
                if (false == Module["hasYUV"]) {
                    Module["hasYUV"] = true;
                    if ("function" == typeof Module["onVideoStart"]) {
                        Module["onVideoStart"]()
                    }
                }
            };
            Module["onWorkerPCM"] = function(obj) {};
            Module["doWorkerConnect"] = function(url) {
                if ("object" != typeof Module["_worker"]) {
                    return
                }
                Module["_worker"].postMessage({
                    "m": "onWorkerConnect",
                    "url": url
                })
            };
            Module["doWorkerACK"] = function(name, value) {
                if ("object" != typeof Module["_worker"]) {
                    return
                }
                Module["_worker"].postMessage({
                    "m": "onWorkerACK",
                    "name": name,
                    "value": value
                }, [value])
            };
            var moduleOverrides = {};
            var key;
            for (key in Module) {
                if (Module.hasOwnProperty(key)) {
                    moduleOverrides[key] = Module[key]
                }
            }
            Module["arguments"] = [];
            Module["thisProgram"] = "./this.program";
            Module["quit"] = function(status, toThrow) {
                throw toThrow
            };
            Module["preRun"] = [];
            Module["postRun"] = [];
            var ENVIRONMENT_IS_WEB = false;
            var ENVIRONMENT_IS_WORKER = false;
            var ENVIRONMENT_IS_NODE = false;
            var ENVIRONMENT_IS_SHELL = false;
            ENVIRONMENT_IS_WEB = typeof window === "object";
            ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
            ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
            ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
            var scriptDirectory = "";

            function locateFile(path) {
                if (Module["locateFile"]) {
                    return Module["locateFile"](path, scriptDirectory)
                } else {
                    return scriptDirectory + path
                }
            }

            if (ENVIRONMENT_IS_NODE) {
                scriptDirectory = __dirname + "/";
                var nodeFS;
                var nodePath;
                Module["read"] = function shell_read(filename, binary) {
                    var ret;
                    if (!nodeFS) nodeFS = require("fs");
                    if (!nodePath) nodePath = require("path");
                    filename = nodePath["normalize"](filename);
                    ret = nodeFS["readFileSync"](filename);
                    return binary ? ret : ret.toString()
                };
                Module["readBinary"] = function readBinary(filename) {
                    var ret = Module["read"](filename, true);
                    if (!ret.buffer) {
                        ret = new Uint8Array(ret)
                    }
                    assert(ret.buffer);
                    return ret
                };
                if (process["argv"].length > 1) {
                    Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/")
                }
                Module["arguments"] = process["argv"].slice(2);
                process["on"]("uncaughtException", function(ex) {
                    if (!(ex instanceof ExitStatus)) {
                        throw ex
                    }
                });
                process["on"]("unhandledRejection", abort);
                Module["quit"] = function(status) {
                    process["exit"](status)
                };
                Module["inspect"] = function() {
                    return "[Emscripten Module object]"
                }
            } else if (ENVIRONMENT_IS_SHELL) {
                if (typeof read != "undefined") {
                    Module["read"] = function shell_read(f) {
                        return read(f)
                    }
                }
                Module["readBinary"] = function readBinary(f) {
                    var data;
                    if (typeof readbuffer === "function") {
                        return new Uint8Array(readbuffer(f))
                    }
                    data = read(f, "binary");
                    assert(typeof data === "object");
                    return data
                };
                if (typeof scriptArgs != "undefined") {
                    Module["arguments"] = scriptArgs
                } else if (typeof arguments != "undefined") {
                    Module["arguments"] = arguments
                }
                if (typeof quit === "function") {
                    Module["quit"] = function(status) {
                        quit(status)
                    }
                }
            } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = self.location.href
                } else if (document.currentScript) {
                    scriptDirectory = document.currentScript.src
                }
                if (_scriptDir) {
                    scriptDirectory = _scriptDir
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
                } else {
                    scriptDirectory = ""
                }
                Module["read"] = function shell_read(url) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, false);
                    xhr.send(null);
                    return xhr.responseText
                };
                if (ENVIRONMENT_IS_WORKER) {
                    Module["readBinary"] = function readBinary(url) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.responseType = "arraybuffer";
                        xhr.send(null);
                        return new Uint8Array(xhr.response)
                    }
                }
                Module["readAsync"] = function readAsync(url, onload, onerror) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function xhr_onload() {
                        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                            onload(xhr.response);
                            return
                        }
                        onerror()
                    };
                    xhr.onerror = onerror;
                    xhr.send(null)
                };
                Module["setWindowTitle"] = function(title) {
                    document.title = title
                }
            } else {}
            var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);
            var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);
            for (key in moduleOverrides) {
                if (moduleOverrides.hasOwnProperty(key)) {
                    Module[key] = moduleOverrides[key]
                }
            }
            moduleOverrides = undefined;
            var STACK_ALIGN = 16;

            function dynamicAlloc(size) {
                var ret = HEAP32[DYNAMICTOP_PTR >> 2];
                var end = ret + size + 15 & -16;
                if (end <= _emscripten_get_heap_size()) {
                    HEAP32[DYNAMICTOP_PTR >> 2] = end
                } else {
                    var success = _emscripten_resize_heap(end);
                    if (!success) return 0
                }
                return ret
            }

            function getNativeTypeSize(type) {
                switch (type) {
                    case "i1":
                    case "i8":
                        return 1;
                    case "i16":
                        return 2;
                    case "i32":
                        return 4;
                    case "i64":
                        return 8;
                    case "float":
                        return 4;
                    case "double":
                        return 8;
                    default:
                        {
                            if (type[type.length - 1] === "*") {
                                return 4
                            } else if (type[0] === "i") {
                                var bits = parseInt(type.substr(1));
                                assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                                return bits / 8
                            } else {
                                return 0
                            }
                        }
                }
            }

            function warnOnce(text) {
                if (!warnOnce.shown) warnOnce.shown = {};
                if (!warnOnce.shown[text]) {
                    warnOnce.shown[text] = 1;
                    err(text)
                }
            }

            var asm2wasmImports = {
                "f64-rem": function(x, y) {
                    return x % y
                },
                "debugger": function() {
                    debugger
                }
            };
            var jsCallStartIndex = 1;
            var functionPointers = new Array(0);
            var funcWrappers = {};

            function dynCall(sig, ptr, args) {
                if (args && args.length) {
                    return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
                } else {
                    return Module["dynCall_" + sig].call(null, ptr)
                }
            }

            var tempRet0 = 0;
            var setTempRet0 = function(value) {
                tempRet0 = value
            };
            var getTempRet0 = function() {
                return tempRet0
            };
            if (typeof WebAssembly !== "object") {
                err("no native wasm support detected")
            }
            var wasmMemory;
            var wasmTable;
            var ABORT = false;
            var EXITSTATUS = 0;

            function assert(condition, text) {
                if (!condition) {
                    abort("Assertion failed: " + text)
                }
            }

            function getCFunc(ident) {
                var func = Module["_" + ident];
                assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
                return func
            }

            function ccall(ident, returnType, argTypes, args, opts) {
                var toC = {
                    "string": function(str) {
                        var ret = 0;
                        if (str !== null && str !== undefined && str !== 0) {
                            var len = (str.length << 2) + 1;
                            ret = stackAlloc(len);
                            stringToUTF8(str, ret, len)
                        }
                        return ret
                    },
                    "array": function(arr) {
                        var ret = stackAlloc(arr.length);
                        writeArrayToMemory(arr, ret);
                        return ret
                    }
                };

                function convertReturnValue(ret) {
                    if (returnType === "string") return UTF8ToString(ret);
                    if (returnType === "boolean") return Boolean(ret);
                    return ret
                }

                var func = getCFunc(ident);
                var cArgs = [];
                var stack = 0;
                if (args) {
                    for (var i = 0; i < args.length; i++) {
                        var converter = toC[argTypes[i]];
                        if (converter) {
                            if (stack === 0) stack = stackSave();
                            cArgs[i] = converter(args[i])
                        } else {
                            cArgs[i] = args[i]
                        }
                    }
                }
                var ret = func.apply(null, cArgs);
                ret = convertReturnValue(ret);
                if (stack !== 0) stackRestore(stack);
                return ret
            }

            function setValue(ptr, value, type, noSafe) {
                type = type || "i8";
                if (type.charAt(type.length - 1) === "*") type = "i32";
                switch (type) {
                    case "i1":
                        HEAP8[ptr >> 0] = value;
                        break;
                    case "i8":
                        HEAP8[ptr >> 0] = value;
                        break;
                    case "i16":
                        HEAP16[ptr >> 1] = value;
                        break;
                    case "i32":
                        HEAP32[ptr >> 2] = value;
                        break;
                    case "i64":
                        tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
                        break;
                    case "float":
                        HEAPF32[ptr >> 2] = value;
                        break;
                    case "double":
                        HEAPF64[ptr >> 3] = value;
                        break;
                    default:
                        abort("invalid type for setValue: " + type)
                }
            }

            var ALLOC_NORMAL = 0;
            var ALLOC_NONE = 3;

            function allocate(slab, types, allocator, ptr) {
                var zeroinit, size;
                if (typeof slab === "number") {
                    zeroinit = true;
                    size = slab
                } else {
                    zeroinit = false;
                    size = slab.length
                }
                var singleType = typeof types === "string" ? types : null;
                var ret;
                if (allocator == ALLOC_NONE) {
                    ret = ptr
                } else {
                    ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
                }
                if (zeroinit) {
                    var stop;
                    ptr = ret;
                    assert((ret & 3) == 0);
                    stop = ret + (size & ~3);
                    for (; ptr < stop; ptr += 4) {
                        HEAP32[ptr >> 2] = 0
                    }
                    stop = ret + size;
                    while (ptr < stop) {
                        HEAP8[ptr++ >> 0] = 0
                    }
                    return ret
                }
                if (singleType === "i8") {
                    if (slab.subarray || slab.slice) {
                        HEAPU8.set(slab, ret)
                    } else {
                        HEAPU8.set(new Uint8Array(slab), ret)
                    }
                    return ret
                }
                var i = 0,
                    type, typeSize, previousType;
                while (i < size) {
                    var curr = slab[i];
                    type = singleType || types[i];
                    if (type === 0) {
                        i++;
                        continue
                    }
                    if (type == "i64") type = "i32";
                    setValue(ret + i, curr, type);
                    if (previousType !== type) {
                        typeSize = getNativeTypeSize(type);
                        previousType = type
                    }
                    i += typeSize
                }
                return ret
            }

            function getMemory(size) {
                if (!runtimeInitialized) return dynamicAlloc(size);
                return _malloc(size)
            }

            var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

            function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
                var endIdx = idx + maxBytesToRead;
                var endPtr = idx;
                while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
                if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
                    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
                } else {
                    var str = "";
                    while (idx < endPtr) {
                        var u0 = u8Array[idx++];
                        if (!(u0 & 128)) {
                            str += String.fromCharCode(u0);
                            continue
                        }
                        var u1 = u8Array[idx++] & 63;
                        if ((u0 & 224) == 192) {
                            str += String.fromCharCode((u0 & 31) << 6 | u1);
                            continue
                        }
                        var u2 = u8Array[idx++] & 63;
                        if ((u0 & 240) == 224) {
                            u0 = (u0 & 15) << 12 | u1 << 6 | u2
                        } else {
                            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
                        }
                        if (u0 < 65536) {
                            str += String.fromCharCode(u0)
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                        }
                    }
                }
                return str
            }

            function UTF8ToString(ptr, maxBytesToRead) {
                return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
            }

            function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
                if (!(maxBytesToWrite > 0)) return 0;
                var startIdx = outIdx;
                var endIdx = outIdx + maxBytesToWrite - 1;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) {
                        var u1 = str.charCodeAt(++i);
                        u = 65536 + ((u & 1023) << 10) | u1 & 1023
                    }
                    if (u <= 127) {
                        if (outIdx >= endIdx) break;
                        outU8Array[outIdx++] = u
                    } else if (u <= 2047) {
                        if (outIdx + 1 >= endIdx) break;
                        outU8Array[outIdx++] = 192 | u >> 6;
                        outU8Array[outIdx++] = 128 | u & 63
                    } else if (u <= 65535) {
                        if (outIdx + 2 >= endIdx) break;
                        outU8Array[outIdx++] = 224 | u >> 12;
                        outU8Array[outIdx++] = 128 | u >> 6 & 63;
                        outU8Array[outIdx++] = 128 | u & 63
                    } else {
                        if (outIdx + 3 >= endIdx) break;
                        outU8Array[outIdx++] = 240 | u >> 18;
                        outU8Array[outIdx++] = 128 | u >> 12 & 63;
                        outU8Array[outIdx++] = 128 | u >> 6 & 63;
                        outU8Array[outIdx++] = 128 | u & 63
                    }
                }
                outU8Array[outIdx] = 0;
                return outIdx - startIdx
            }

            function stringToUTF8(str, outPtr, maxBytesToWrite) {
                return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
            }

            function lengthBytesUTF8(str) {
                var len = 0;
                for (var i = 0; i < str.length; ++i) {
                    var u = str.charCodeAt(i);
                    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
                    if (u <= 127) ++len;
                    else if (u <= 2047) len += 2;
                    else if (u <= 65535) len += 3;
                    else len += 4
                }
                return len
            }

            var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

            function allocateUTF8(str) {
                var size = lengthBytesUTF8(str) + 1;
                var ret = _malloc(size);
                if (ret) stringToUTF8Array(str, HEAP8, ret, size);
                return ret
            }

            function allocateUTF8OnStack(str) {
                var size = lengthBytesUTF8(str) + 1;
                var ret = stackAlloc(size);
                stringToUTF8Array(str, HEAP8, ret, size);
                return ret
            }

            function writeArrayToMemory(array, buffer) {
                HEAP8.set(array, buffer)
            }

            function writeAsciiToMemory(str, buffer, dontAddNull) {
                for (var i = 0; i < str.length; ++i) {
                    HEAP8[buffer++ >> 0] = str.charCodeAt(i)
                }
                if (!dontAddNull) HEAP8[buffer >> 0] = 0
            }

            function demangle(func) {
                return func
            }

            function demangleAll(text) {
                var regex = /__Z[\w\d_]+/g;
                return text.replace(regex, function(x) {
                    var y = demangle(x);
                    return x === y ? x : y + " [" + x + "]"
                })
            }

            function jsStackTrace() {
                var err = new Error;
                if (!err.stack) {
                    try {
                        throw new Error(0)
                    } catch (e) {
                        err = e
                    }
                    if (!err.stack) {
                        return "(no stack trace available)"
                    }
                }
                return err.stack.toString()
            }

            function stackTrace() {
                var js = jsStackTrace();
                if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
                return demangleAll(js)
            }

            var WASM_PAGE_SIZE = 65536;

            function alignUp(x, multiple) {
                if (x % multiple > 0) {
                    x += multiple - x % multiple
                }
                return x
            }

            var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

            function updateGlobalBuffer(buf) {
                Module["buffer"] = buffer = buf
            }

            function updateGlobalBufferViews() {
                Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
                Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
                Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
                Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
                Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
                Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
                Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
                Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer)
            }

            var STACK_BASE = 53936,
                DYNAMIC_BASE = 5296816,
                DYNAMICTOP_PTR = 53664;
            var TOTAL_STACK = 5242880;
            var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 104857600;
            if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
            if (Module["buffer"]) {
                buffer = Module["buffer"]
            } else {
                if (typeof WebAssembly === "object" && typeof WebAssembly.Memory === "function") {
                    wasmMemory = new WebAssembly.Memory({
                        "initial": TOTAL_MEMORY / WASM_PAGE_SIZE
                    });
                    buffer = wasmMemory.buffer
                } else {
                    buffer = new ArrayBuffer(TOTAL_MEMORY)
                }
                Module["buffer"] = buffer
            }
            updateGlobalBufferViews();
            HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

            function callRuntimeCallbacks(callbacks) {
                while (callbacks.length > 0) {
                    var callback = callbacks.shift();
                    if (typeof callback == "function") {
                        callback();
                        continue
                    }
                    var func = callback.func;
                    if (typeof func === "number") {
                        if (callback.arg === undefined) {
                            Module["dynCall_v"](func)
                        } else {
                            Module["dynCall_vi"](func, callback.arg)
                        }
                    } else {
                        func(callback.arg === undefined ? null : callback.arg)
                    }
                }
            }

            var __ATPRERUN__ = [];
            var __ATINIT__ = [];
            var __ATMAIN__ = [];
            var __ATEXIT__ = [];
            var __ATPOSTRUN__ = [];
            var runtimeInitialized = false;
            var runtimeExited = false;

            function preRun() {
                if (Module["preRun"]) {
                    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                    while (Module["preRun"].length) {
                        addOnPreRun(Module["preRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPRERUN__)
            }

            function ensureInitRuntime() {
                if (runtimeInitialized) return;
                runtimeInitialized = true;
                if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
                TTY.init();
                callRuntimeCallbacks(__ATINIT__)
            }

            function preMain() {
                FS.ignorePermissions = false;
                callRuntimeCallbacks(__ATMAIN__)
            }

            function exitRuntime() {
                runtimeExited = true
            }

            function postRun() {
                if (Module["postRun"]) {
                    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                    while (Module["postRun"].length) {
                        addOnPostRun(Module["postRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPOSTRUN__)
            }

            function addOnPreRun(cb) {
                __ATPRERUN__.unshift(cb)
            }

            function addOnPostRun(cb) {
                __ATPOSTRUN__.unshift(cb)
            }

            var Math_abs = Math.abs;
            var Math_ceil = Math.ceil;
            var Math_floor = Math.floor;
            var Math_min = Math.min;
            var runDependencies = 0;
            var runDependencyWatcher = null;
            var dependenciesFulfilled = null;

            function getUniqueRunDependency(id) {
                return id
            }

            function addRunDependency(id) {
                runDependencies++;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
            }

            function removeRunDependency(id) {
                runDependencies--;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
                if (runDependencies == 0) {
                    if (runDependencyWatcher !== null) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null
                    }
                    if (dependenciesFulfilled) {
                        var callback = dependenciesFulfilled;
                        dependenciesFulfilled = null;
                        callback()
                    }
                }
            }

            Module["preloadedImages"] = {};
            Module["preloadedAudios"] = {};
            var dataURIPrefix = "data:application/octet-stream;base64,";

            function isDataURI(filename) {
                return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
            }

            var wasmBinaryFile = "slplayer.wasm";
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile)
            }

            function getBinary() {
                try {
                    if (Module["wasmBinary"]) {
                        return new Uint8Array(Module["wasmBinary"])
                    }
                    if (Module["readBinary"]) {
                        return Module["readBinary"](wasmBinaryFile)
                    } else {
                        throw "both async and sync fetching of the wasm failed"
                    }
                } catch (err) {
                    abort(err)
                }
            }

            function getBinaryPromise() {
                if (!Module["wasmBinary"] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
                    return fetch(wasmBinaryFile, {
                        credentials: "same-origin"
                    }).then(function(response) {
                        if (!response["ok"]) {
                            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                        }
                        return response["arrayBuffer"]()
                    }).catch(function() {
                        return getBinary()
                    })
                }
                return new Promise(function(resolve, reject) {
                    resolve(getBinary())
                })
            }

            function createWasm(env) {
                var info = {
                    "env": env,
                    "global": {
                        "NaN": NaN,
                        Infinity: Infinity
                    },
                    "global.Math": Math,
                    "asm2wasm": asm2wasmImports
                };

                function receiveInstance(instance, module) {
                    var exports = instance.exports;
                    Module["asm"] = exports;
                    removeRunDependency("wasm-instantiate")
                }

                addRunDependency("wasm-instantiate");
                if (Module["instantiateWasm"]) {
                    try {
                        return Module["instantiateWasm"](info, receiveInstance)
                    } catch (e) {
                        err("Module.instantiateWasm callback failed with error: " + e);
                        return false
                    }
                }

                function receiveInstantiatedSource(output) {
                    receiveInstance(output["instance"])
                }

                function instantiateArrayBuffer(receiver) {
                    getBinaryPromise().then(function(binary) {
                        return WebAssembly.instantiate(binary, info)
                    }).then(receiver, function(reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }

                if (!Module["wasmBinary"] && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                    WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, {
                        credentials: "same-origin"
                    }), info).then(receiveInstantiatedSource, function(reason) {
                        err("wasm streaming compile failed: " + reason);
                        err("falling back to ArrayBuffer instantiation");
                        instantiateArrayBuffer(receiveInstantiatedSource)
                    })
                } else {
                    instantiateArrayBuffer(receiveInstantiatedSource)
                }
                return {}
            }

            Module["asm"] = function(global, env, providedBuffer) {
                env["memory"] = wasmMemory;
                env["table"] = wasmTable = new WebAssembly.Table({
                    "initial": 824,
                    "maximum": 824,
                    "element": "anyfunc"
                });
                env["__memory_base"] = 1024;
                env["__table_base"] = 0;
                var exports = createWasm(env);
                return exports
            };
            var ASM_CONSTS = [function() {
                return screen.width
            }, function() {
                return screen.height
            }, function($0) {
                if (typeof Module["setWindowTitle"] !== "undefined") {
                    Module["setWindowTitle"](UTF8ToString($0))
                }
                return 0
            }, function($0, $1, $2) {
                var w = $0;
                var h = $1;
                var pixels = $2;
                if (!Module["SDL2"]) Module["SDL2"] = {};
                var SDL2 = Module["SDL2"];
                if (SDL2.ctxCanvas !== Module["canvas"]) {
                    SDL2.ctx = Module["createContext"](Module["canvas"], false, true);
                    SDL2.ctxCanvas = Module["canvas"]
                }
                if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
                    SDL2.image = SDL2.ctx.createImageData(w, h);
                    SDL2.w = w;
                    SDL2.h = h;
                    SDL2.imageCtx = SDL2.ctx
                }
                var data = SDL2.image.data;
                var src = pixels >> 2;
                var dst = 0;
                var num;
                if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
                    num = data.length;
                    while (dst < num) {
                        var val = HEAP32[src];
                        data[dst] = val & 255;
                        data[dst + 1] = val >> 8 & 255;
                        data[dst + 2] = val >> 16 & 255;
                        data[dst + 3] = 255;
                        src++;
                        dst += 4
                    }
                } else {
                    if (SDL2.data32Data !== data) {
                        SDL2.data32 = new Int32Array(data.buffer);
                        SDL2.data8 = new Uint8Array(data.buffer)
                    }
                    var data32 = SDL2.data32;
                    num = data32.length;
                    data32.set(HEAP32.subarray(src, src + num));
                    var data8 = SDL2.data8;
                    var i = 3;
                    var j = i + 4 * num;
                    if (num % 8 == 0) {
                        while (i < j) {
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0;
                            data8[i] = 255;
                            i = i + 4 | 0
                        }
                    } else {
                        while (i < j) {
                            data8[i] = 255;
                            i = i + 4 | 0
                        }
                    }
                }
                SDL2.ctx.putImageData(SDL2.image, 0, 0);
                return 0
            }, function($0, $1, $2, $3, $4) {
                var w = $0;
                var h = $1;
                var hot_x = $2;
                var hot_y = $3;
                var pixels = $4;
                var canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext("2d");
                var image = ctx.createImageData(w, h);
                var data = image.data;
                var src = pixels >> 2;
                var dst = 0;
                var num;
                if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
                    num = data.length;
                    while (dst < num) {
                        var val = HEAP32[src];
                        data[dst] = val & 255;
                        data[dst + 1] = val >> 8 & 255;
                        data[dst + 2] = val >> 16 & 255;
                        data[dst + 3] = val >> 24 & 255;
                        src++;
                        dst += 4
                    }
                } else {
                    var data32 = new Int32Array(data.buffer);
                    num = data32.length;
                    data32.set(HEAP32.subarray(src, src + num))
                }
                ctx.putImageData(image, 0, 0);
                var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
                var urlBuf = _malloc(url.length + 1);
                stringToUTF8(url, urlBuf, url.length + 1);
                return urlBuf
            }, function($0) {
                if (Module["canvas"]) {
                    Module["canvas"].style["cursor"] = UTF8ToString($0)
                }
                return 0
            }, function() {
                if (Module["canvas"]) {
                    Module["canvas"].style["cursor"] = "none"
                }
            }, function() {
                if (typeof AudioContext !== "undefined") {
                    return 1
                } else if (typeof webkitAudioContext !== "undefined") {
                    return 1
                }
                return 0
            }, function() {
                if (typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia !== "undefined") {
                    return 1
                } else if (typeof navigator.webkitGetUserMedia !== "undefined") {
                    return 1
                }
                return 0
            }, function($0) {
                if (typeof Module["SDL2"] === "undefined") {
                    Module["SDL2"] = {}
                }
                var SDL2 = Module["SDL2"];
                if (!$0) {
                    SDL2.audio = {}
                } else {
                    SDL2.capture = {}
                }
                if (!SDL2.audioContext) {
                    if (typeof AudioContext !== "undefined") {
                        SDL2.audioContext = new AudioContext
                    } else if (typeof webkitAudioContext !== "undefined") {
                        SDL2.audioContext = new webkitAudioContext
                    }
                }
                return SDL2.audioContext === undefined ? -1 : 0
            }, function() {
                var SDL2 = Module["SDL2"];
                return SDL2.audioContext.sampleRate
            }, function($0, $1, $2, $3) {
                var SDL2 = Module["SDL2"];
                var have_microphone = function(stream) {
                    if (SDL2.capture.silenceTimer !== undefined) {
                        clearTimeout(SDL2.capture.silenceTimer);
                        SDL2.capture.silenceTimer = undefined
                    }
                    SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
                    SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
                    SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {
                        if (SDL2 === undefined || SDL2.capture === undefined) {
                            return
                        }
                        audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
                        SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
                        dynCall("vi", $2, [$3])
                    };
                    SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
                    SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
                    SDL2.capture.stream = stream
                };
                var no_microphone = function(error) {};
                SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
                SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
                var silence_callback = function() {
                    SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
                    dynCall("vi", $2, [$3])
                };
                SDL2.capture.silenceTimer = setTimeout(silence_callback, $1 / SDL2.audioContext.sampleRate * 1e3);
                if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
                    navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false
                    }).then(have_microphone).catch(no_microphone)
                } else if (navigator.webkitGetUserMedia !== undefined) {
                    navigator.webkitGetUserMedia({
                        audio: true,
                        video: false
                    }, have_microphone, no_microphone)
                }
            }, function($0, $1, $2, $3) {
                var SDL2 = Module["SDL2"];
                SDL2.audio.scriptProcessorNode = SDL2.audioContext["createScriptProcessor"]($1, 0, $0);
                SDL2.audio.scriptProcessorNode["onaudioprocess"] = function(e) {
                    if (SDL2 === undefined || SDL2.audio === undefined) {
                        return
                    }
                    SDL2.audio.currentOutputBuffer = e["outputBuffer"];
                    dynCall("vi", $2, [$3])
                };
                SDL2.audio.scriptProcessorNode["connect"](SDL2.audioContext["destination"])
            }, function($0) {
                var SDL2 = Module["SDL2"];
                if ($0) {
                    if (SDL2.capture.silenceTimer !== undefined) {
                        clearTimeout(SDL2.capture.silenceTimer)
                    }
                    if (SDL2.capture.stream !== undefined) {
                        var tracks = SDL2.capture.stream.getAudioTracks();
                        for (var i = 0; i < tracks.length; i++) {
                            SDL2.capture.stream.removeTrack(tracks[i])
                        }
                        SDL2.capture.stream = undefined
                    }
                    if (SDL2.capture.scriptProcessorNode !== undefined) {
                        SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {};
                        SDL2.capture.scriptProcessorNode.disconnect();
                        SDL2.capture.scriptProcessorNode = undefined
                    }
                    if (SDL2.capture.mediaStreamNode !== undefined) {
                        SDL2.capture.mediaStreamNode.disconnect();
                        SDL2.capture.mediaStreamNode = undefined
                    }
                    if (SDL2.capture.silenceBuffer !== undefined) {
                        SDL2.capture.silenceBuffer = undefined
                    }
                    SDL2.capture = undefined
                } else {
                    if (SDL2.audio.scriptProcessorNode != undefined) {
                        SDL2.audio.scriptProcessorNode.disconnect();
                        SDL2.audio.scriptProcessorNode = undefined
                    }
                    SDL2.audio = undefined
                }
                if (SDL2.audioContext !== undefined && SDL2.audio === undefined && SDL2.capture === undefined) {
                    SDL2.audioContext.close();
                    SDL2.audioContext = undefined
                }
            }, function($0, $1) {
                var SDL2 = Module["SDL2"];
                var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
                for (var c = 0; c < numChannels; ++c) {
                    var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
                    if (channelData.length != $1) {
                        throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
                    }
                    if (numChannels == 1) {
                        for (var j = 0; j < $1; ++j) {
                            setValue($0 + j * 4, channelData[j], "float")
                        }
                    } else {
                        for (var j = 0; j < $1; ++j) {
                            setValue($0 + (j * numChannels + c) * 4, channelData[j], "float")
                        }
                    }
                }
            }, function($0, $1) {
                var SDL2 = Module["SDL2"];
                var numChannels = SDL2.audio.currentOutputBuffer["numberOfChannels"];
                for (var c = 0; c < numChannels; ++c) {
                    var channelData = SDL2.audio.currentOutputBuffer["getChannelData"](c);
                    if (channelData.length != $1) {
                        throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
                    }
                    for (var j = 0; j < $1; ++j) {
                        channelData[j] = HEAPF32[$0 + (j * numChannels + c << 2) >> 2]
                    }
                }
            }];

            function _emscripten_asm_const_i(code) {
                return ASM_CONSTS[code]()
            }

            function _emscripten_asm_const_ii(code, a0) {
                return ASM_CONSTS[code](a0)
            }

            function _emscripten_asm_const_iiiii(code, a0, a1, a2, a3) {
                return ASM_CONSTS[code](a0, a1, a2, a3)
            }

            function _emscripten_asm_const_iii(code, a0, a1) {
                return ASM_CONSTS[code](a0, a1)
            }

            function _emscripten_asm_const_iiiiii(code, a0, a1, a2, a3, a4) {
                return ASM_CONSTS[code](a0, a1, a2, a3, a4)
            }

            function _emscripten_asm_const_iiii(code, a0, a1, a2) {
                return ASM_CONSTS[code](a0, a1, a2)
            }

            function _getInt(key) {
                var sKey = UTF8ToString(key);
                if (Module && "number" == typeof Module[sKey]) {
                    return Module[sKey]
                }
                return 0
            }

            function _getString(key, val, max) {
                var sKey = UTF8ToString(key);
                if (Module && "string" == typeof Module[sKey]) {
                    var sVal = Module[sKey];
                    var len = max > lengthBytesUTF8(sVal) ? lengthBytesUTF8(sVal) + 1 : max;
                    stringToUTF8(sVal, val, len);
                    return len
                }
                return 0
            }

            function _onEnd() {
                if (Module && "function" == typeof Module.onEnd) {
                    Module.onEnd()
                }
            }

            function _onError(code, err) {
                if (Module && "function" == typeof Module.onError) {
                    Module.onError(code, UTF8ToString(err))
                }
            }

            function _onStart() {
                if (Module && "function" == typeof Module.onStart) {
                    Module.onStart()
                }
            }

            function _startWorker() {
                if (!Module) {
                    console.error("Module is not object");
                    return
                }
                if ("object" === typeof Module._worker) {
                    Module._worker.terminate()
                }
                Module["_worker"] = new Worker("sldecoder.js");
                Module["_worker"].onmessage = Module["onworkermessage"];
                Module["_worker"].onerror = function(err) {
                    var str;
                    if ("object" == typeof err && "string" == typeof err.message) {
                        str = err.message
                    } else {
                        str = String(err)
                    }
                    _onWorkerError(2, stringToUTF8(str))
                }
            }

            function _stopWorker() {
                if (!Module) {
                    console.error("Module is not object");
                    return
                }
                if ("object" === typeof Module._worker) {
                    console.debug("worker while terminate().");
                    Module._worker.terminate()
                }
            }

            function _workerConnect(url) {
                if (!Module) {
                    console.error("Module is not object");
                    return
                }
                Module["doWorkerConnect"](UTF8ToString(url))
            }

            __ATINIT__.push({
                func: function() {
                    ___emscripten_environ_constructor()
                }
            });
            var tempDoublePtr = 53920;
            var ENV = {};

            function ___buildEnvironment(environ) {
                var MAX_ENV_VALUES = 64;
                var TOTAL_ENV_SIZE = 1024;
                var poolPtr;
                var envPtr;
                if (!___buildEnvironment.called) {
                    ___buildEnvironment.called = true;
                    ENV["USER"] = ENV["LOGNAME"] = "web_user";
                    ENV["PATH"] = "/";
                    ENV["PWD"] = "/";
                    ENV["HOME"] = "/home/web_user";
                    ENV["LANG"] = "C.UTF-8";
                    ENV["_"] = Module["thisProgram"];
                    poolPtr = getMemory(TOTAL_ENV_SIZE);
                    envPtr = getMemory(MAX_ENV_VALUES * 4);
                    HEAP32[envPtr >> 2] = poolPtr;
                    HEAP32[environ >> 2] = envPtr
                } else {
                    envPtr = HEAP32[environ >> 2];
                    poolPtr = HEAP32[envPtr >> 2]
                }
                var strings = [];
                var totalSize = 0;
                for (var key in ENV) {
                    if (typeof ENV[key] === "string") {
                        var line = key + "=" + ENV[key];
                        strings.push(line);
                        totalSize += line.length
                    }
                }
                if (totalSize > TOTAL_ENV_SIZE) {
                    throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
                }
                var ptrSize = 4;
                for (var i = 0; i < strings.length; i++) {
                    var line = strings[i];
                    writeAsciiToMemory(line, poolPtr);
                    HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
                    poolPtr += line.length + 1
                }
                HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
            }

            function ___lock() {}

            function ___setErrNo(value) {
                if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
                return value
            }

            var PATH = {
                splitPath: function(filename) {
                    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                    return splitPathRe.exec(filename).slice(1)
                },
                normalizeArray: function(parts, allowAboveRoot) {
                    var up = 0;
                    for (var i = parts.length - 1; i >= 0; i--) {
                        var last = parts[i];
                        if (last === ".") {
                            parts.splice(i, 1)
                        } else if (last === "..") {
                            parts.splice(i, 1);
                            up++
                        } else if (up) {
                            parts.splice(i, 1);
                            up--
                        }
                    }
                    if (allowAboveRoot) {
                        for (; up; up--) {
                            parts.unshift("..")
                        }
                    }
                    return parts
                },
                normalize: function(path) {
                    var isAbsolute = path.charAt(0) === "/",
                        trailingSlash = path.substr(-1) === "/";
                    path = PATH.normalizeArray(path.split("/").filter(function(p) {
                        return !!p
                    }), !isAbsolute).join("/");
                    if (!path && !isAbsolute) {
                        path = "."
                    }
                    if (path && trailingSlash) {
                        path += "/"
                    }
                    return (isAbsolute ? "/" : "") + path
                },
                dirname: function(path) {
                    var result = PATH.splitPath(path),
                        root = result[0],
                        dir = result[1];
                    if (!root && !dir) {
                        return "."
                    }
                    if (dir) {
                        dir = dir.substr(0, dir.length - 1)
                    }
                    return root + dir
                },
                basename: function(path) {
                    if (path === "/") return "/";
                    var lastSlash = path.lastIndexOf("/");
                    if (lastSlash === -1) return path;
                    return path.substr(lastSlash + 1)
                },
                extname: function(path) {
                    return PATH.splitPath(path)[3]
                },
                join: function() {
                    var paths = Array.prototype.slice.call(arguments, 0);
                    return PATH.normalize(paths.join("/"))
                },
                join2: function(l, r) {
                    return PATH.normalize(l + "/" + r)
                },
                resolve: function() {
                    var resolvedPath = "",
                        resolvedAbsolute = false;
                    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                        var path = i >= 0 ? arguments[i] : FS.cwd();
                        if (typeof path !== "string") {
                            throw new TypeError("Arguments to path.resolve must be strings")
                        } else if (!path) {
                            return ""
                        }
                        resolvedPath = path + "/" + resolvedPath;
                        resolvedAbsolute = path.charAt(0) === "/"
                    }
                    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
                        return !!p
                    }), !resolvedAbsolute).join("/");
                    return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
                },
                relative: function(from, to) {
                    from = PATH.resolve(from).substr(1);
                    to = PATH.resolve(to).substr(1);

                    function trim(arr) {
                        var start = 0;
                        for (; start < arr.length; start++) {
                            if (arr[start] !== "") break
                        }
                        var end = arr.length - 1;
                        for (; end >= 0; end--) {
                            if (arr[end] !== "") break
                        }
                        if (start > end) return [];
                        return arr.slice(start, end - start + 1)
                    }

                    var fromParts = trim(from.split("/"));
                    var toParts = trim(to.split("/"));
                    var length = Math.min(fromParts.length, toParts.length);
                    var samePartsLength = length;
                    for (var i = 0; i < length; i++) {
                        if (fromParts[i] !== toParts[i]) {
                            samePartsLength = i;
                            break
                        }
                    }
                    var outputParts = [];
                    for (var i = samePartsLength; i < fromParts.length; i++) {
                        outputParts.push("..")
                    }
                    outputParts = outputParts.concat(toParts.slice(samePartsLength));
                    return outputParts.join("/")
                }
            };
            var TTY = {
                ttys: [],
                init: function() {},
                shutdown: function() {},
                register: function(dev, ops) {
                    TTY.ttys[dev] = {
                        input: [],
                        output: [],
                        ops: ops
                    };
                    FS.registerDevice(dev, TTY.stream_ops)
                },
                stream_ops: {
                    open: function(stream) {
                        var tty = TTY.ttys[stream.node.rdev];
                        if (!tty) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
                        }
                        stream.tty = tty;
                        stream.seekable = false
                    },
                    close: function(stream) {
                        stream.tty.ops.flush(stream.tty)
                    },
                    flush: function(stream) {
                        stream.tty.ops.flush(stream.tty)
                    },
                    read: function(stream, buffer, offset, length, pos) {
                        if (!stream.tty || !stream.tty.ops.get_char) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
                        }
                        var bytesRead = 0;
                        for (var i = 0; i < length; i++) {
                            var result;
                            try {
                                result = stream.tty.ops.get_char(stream.tty)
                            } catch (e) {
                                throw new FS.ErrnoError(ERRNO_CODES.EIO)
                            }
                            if (result === undefined && bytesRead === 0) {
                                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                            }
                            if (result === null || result === undefined) break;
                            bytesRead++;
                            buffer[offset + i] = result
                        }
                        if (bytesRead) {
                            stream.node.timestamp = Date.now()
                        }
                        return bytesRead
                    },
                    write: function(stream, buffer, offset, length, pos) {
                        if (!stream.tty || !stream.tty.ops.put_char) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
                        }
                        try {
                            for (var i = 0; i < length; i++) {
                                stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                            }
                        } catch (e) {
                            throw new FS.ErrnoError(ERRNO_CODES.EIO)
                        }
                        if (length) {
                            stream.node.timestamp = Date.now()
                        }
                        return i
                    }
                },
                default_tty_ops: {
                    get_char: function(tty) {
                        if (!tty.input.length) {
                            var result = null;
                            if (ENVIRONMENT_IS_NODE) {
                                var BUFSIZE = 256;
                                var buf = new Buffer(BUFSIZE);
                                var bytesRead = 0;
                                var isPosixPlatform = process.platform != "win32";
                                var fd = process.stdin.fd;
                                if (isPosixPlatform) {
                                    var usingDevice = false;
                                    try {
                                        fd = fs.openSync("/dev/stdin", "r");
                                        usingDevice = true
                                    } catch (e) {}
                                }
                                try {
                                    bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
                                } catch (e) {
                                    if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                                    else throw e
                                }
                                if (usingDevice) {
                                    fs.closeSync(fd)
                                }
                                if (bytesRead > 0) {
                                    result = buf.slice(0, bytesRead).toString("utf-8")
                                } else {
                                    result = null
                                }
                            } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                                result = window.prompt("Input: ");
                                if (result !== null) {
                                    result += "\n"
                                }
                            } else if (typeof readline == "function") {
                                result = readline();
                                if (result !== null) {
                                    result += "\n"
                                }
                            }
                            if (!result) {
                                return null
                            }
                            tty.input = intArrayFromString(result, true)
                        }
                        return tty.input.shift()
                    },
                    put_char: function(tty, val) {
                        if (val === null || val === 10) {
                            out(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        } else {
                            if (val != 0) tty.output.push(val)
                        }
                    },
                    flush: function(tty) {
                        if (tty.output && tty.output.length > 0) {
                            out(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        }
                    }
                },
                default_tty1_ops: {
                    put_char: function(tty, val) {
                        if (val === null || val === 10) {
                            err(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        } else {
                            if (val != 0) tty.output.push(val)
                        }
                    },
                    flush: function(tty) {
                        if (tty.output && tty.output.length > 0) {
                            err(UTF8ArrayToString(tty.output, 0));
                            tty.output = []
                        }
                    }
                }
            };
            var MEMFS = {
                ops_table: null,
                mount: function(mount) {
                    return MEMFS.createNode(null, "/", 16384 | 511, 0)
                },
                createNode: function(parent, name, mode, dev) {
                    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    }
                    if (!MEMFS.ops_table) {
                        MEMFS.ops_table = {
                            dir: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr,
                                    lookup: MEMFS.node_ops.lookup,
                                    mknod: MEMFS.node_ops.mknod,
                                    rename: MEMFS.node_ops.rename,
                                    unlink: MEMFS.node_ops.unlink,
                                    rmdir: MEMFS.node_ops.rmdir,
                                    readdir: MEMFS.node_ops.readdir,
                                    symlink: MEMFS.node_ops.symlink
                                },
                                stream: {
                                    llseek: MEMFS.stream_ops.llseek
                                }
                            },
                            file: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr
                                },
                                stream: {
                                    llseek: MEMFS.stream_ops.llseek,
                                    read: MEMFS.stream_ops.read,
                                    write: MEMFS.stream_ops.write,
                                    allocate: MEMFS.stream_ops.allocate,
                                    mmap: MEMFS.stream_ops.mmap,
                                    msync: MEMFS.stream_ops.msync
                                }
                            },
                            link: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr,
                                    readlink: MEMFS.node_ops.readlink
                                },
                                stream: {}
                            },
                            chrdev: {
                                node: {
                                    getattr: MEMFS.node_ops.getattr,
                                    setattr: MEMFS.node_ops.setattr
                                },
                                stream: FS.chrdev_stream_ops
                            }
                        }
                    }
                    var node = FS.createNode(parent, name, mode, dev);
                    if (FS.isDir(node.mode)) {
                        node.node_ops = MEMFS.ops_table.dir.node;
                        node.stream_ops = MEMFS.ops_table.dir.stream;
                        node.contents = {}
                    } else if (FS.isFile(node.mode)) {
                        node.node_ops = MEMFS.ops_table.file.node;
                        node.stream_ops = MEMFS.ops_table.file.stream;
                        node.usedBytes = 0;
                        node.contents = null
                    } else if (FS.isLink(node.mode)) {
                        node.node_ops = MEMFS.ops_table.link.node;
                        node.stream_ops = MEMFS.ops_table.link.stream
                    } else if (FS.isChrdev(node.mode)) {
                        node.node_ops = MEMFS.ops_table.chrdev.node;
                        node.stream_ops = MEMFS.ops_table.chrdev.stream
                    }
                    node.timestamp = Date.now();
                    if (parent) {
                        parent.contents[name] = node
                    }
                    return node
                },
                getFileDataAsRegularArray: function(node) {
                    if (node.contents && node.contents.subarray) {
                        var arr = [];
                        for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
                        return arr
                    }
                    return node.contents
                },
                getFileDataAsTypedArray: function(node) {
                    if (!node.contents) return new Uint8Array;
                    if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
                    return new Uint8Array(node.contents)
                },
                expandFileStorage: function(node, newCapacity) {
                    var prevCapacity = node.contents ? node.contents.length : 0;
                    if (prevCapacity >= newCapacity) return;
                    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
                    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
                    if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
                    var oldContents = node.contents;
                    node.contents = new Uint8Array(newCapacity);
                    if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
                    return
                },
                resizeFileStorage: function(node, newSize) {
                    if (node.usedBytes == newSize) return;
                    if (newSize == 0) {
                        node.contents = null;
                        node.usedBytes = 0;
                        return
                    }
                    if (!node.contents || node.contents.subarray) {
                        var oldContents = node.contents;
                        node.contents = new Uint8Array(new ArrayBuffer(newSize));
                        if (oldContents) {
                            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
                        }
                        node.usedBytes = newSize;
                        return
                    }
                    if (!node.contents) node.contents = [];
                    if (node.contents.length > newSize) node.contents.length = newSize;
                    else
                        while (node.contents.length < newSize) node.contents.push(0);
                    node.usedBytes = newSize
                },
                node_ops: {
                    getattr: function(node) {
                        var attr = {};
                        attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                        attr.ino = node.id;
                        attr.mode = node.mode;
                        attr.nlink = 1;
                        attr.uid = 0;
                        attr.gid = 0;
                        attr.rdev = node.rdev;
                        if (FS.isDir(node.mode)) {
                            attr.size = 4096
                        } else if (FS.isFile(node.mode)) {
                            attr.size = node.usedBytes
                        } else if (FS.isLink(node.mode)) {
                            attr.size = node.link.length
                        } else {
                            attr.size = 0
                        }
                        attr.atime = new Date(node.timestamp);
                        attr.mtime = new Date(node.timestamp);
                        attr.ctime = new Date(node.timestamp);
                        attr.blksize = 4096;
                        attr.blocks = Math.ceil(attr.size / attr.blksize);
                        return attr
                    },
                    setattr: function(node, attr) {
                        if (attr.mode !== undefined) {
                            node.mode = attr.mode
                        }
                        if (attr.timestamp !== undefined) {
                            node.timestamp = attr.timestamp
                        }
                        if (attr.size !== undefined) {
                            MEMFS.resizeFileStorage(node, attr.size)
                        }
                    },
                    lookup: function(parent, name) {
                        throw FS.genericErrors[ERRNO_CODES.ENOENT]
                    },
                    mknod: function(parent, name, mode, dev) {
                        return MEMFS.createNode(parent, name, mode, dev)
                    },
                    rename: function(old_node, new_dir, new_name) {
                        if (FS.isDir(old_node.mode)) {
                            var new_node;
                            try {
                                new_node = FS.lookupNode(new_dir, new_name)
                            } catch (e) {}
                            if (new_node) {
                                for (var i in new_node.contents) {
                                    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
                                }
                            }
                        }
                        delete old_node.parent.contents[old_node.name];
                        old_node.name = new_name;
                        new_dir.contents[new_name] = old_node;
                        old_node.parent = new_dir
                    },
                    unlink: function(parent, name) {
                        delete parent.contents[name]
                    },
                    rmdir: function(parent, name) {
                        var node = FS.lookupNode(parent, name);
                        for (var i in node.contents) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
                        }
                        delete parent.contents[name]
                    },
                    readdir: function(node) {
                        var entries = [".", ".."];
                        for (var key in node.contents) {
                            if (!node.contents.hasOwnProperty(key)) {
                                continue
                            }
                            entries.push(key)
                        }
                        return entries
                    },
                    symlink: function(parent, newname, oldpath) {
                        var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                        node.link = oldpath;
                        return node
                    },
                    readlink: function(node) {
                        if (!FS.isLink(node.mode)) {
                            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                        }
                        return node.link
                    }
                },
                stream_ops: {
                    read: function(stream, buffer, offset, length, position) {
                        var contents = stream.node.contents;
                        if (position >= stream.node.usedBytes) return 0;
                        var size = Math.min(stream.node.usedBytes - position, length);
                        if (size > 8 && contents.subarray) {
                            buffer.set(contents.subarray(position, position + size), offset)
                        } else {
                            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
                        }
                        return size
                    },
                    write: function(stream, buffer, offset, length, position, canOwn) {
                        canOwn = false;
                        if (!length) return 0;
                        var node = stream.node;
                        node.timestamp = Date.now();
                        if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                            if (canOwn) {
                                node.contents = buffer.subarray(offset, offset + length);
                                node.usedBytes = length;
                                return length
                            } else if (node.usedBytes === 0 && position === 0) {
                                node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                                node.usedBytes = length;
                                return length
                            } else if (position + length <= node.usedBytes) {
                                node.contents.set(buffer.subarray(offset, offset + length), position);
                                return length
                            }
                        }
                        MEMFS.expandFileStorage(node, position + length);
                        if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
                        else {
                            for (var i = 0; i < length; i++) {
                                node.contents[position + i] = buffer[offset + i]
                            }
                        }
                        node.usedBytes = Math.max(node.usedBytes, position + length);
                        return length
                    },
                    llseek: function(stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                position += stream.node.usedBytes
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                        }
                        return position
                    },
                    allocate: function(stream, offset, length) {
                        MEMFS.expandFileStorage(stream.node, offset + length);
                        stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
                    },
                    mmap: function(stream, buffer, offset, length, position, prot, flags) {
                        if (!FS.isFile(stream.node.mode)) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
                        }
                        var ptr;
                        var allocated;
                        var contents = stream.node.contents;
                        if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                            allocated = false;
                            ptr = contents.byteOffset
                        } else {
                            if (position > 0 || position + length < stream.node.usedBytes) {
                                if (contents.subarray) {
                                    contents = contents.subarray(position, position + length)
                                } else {
                                    contents = Array.prototype.slice.call(contents, position, position + length)
                                }
                            }
                            allocated = true;
                            ptr = _malloc(length);
                            if (!ptr) {
                                throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)
                            }
                            buffer.set(contents, ptr)
                        }
                        return {
                            ptr: ptr,
                            allocated: allocated
                        }
                    },
                    msync: function(stream, buffer, offset, length, mmapFlags) {
                        if (!FS.isFile(stream.node.mode)) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
                        }
                        if (mmapFlags & 2) {
                            return 0
                        }
                        var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                        return 0
                    }
                }
            };
            var IDBFS = {
                dbs: {},
                indexedDB: function() {
                    if (typeof indexedDB !== "undefined") return indexedDB;
                    var ret = null;
                    if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
                    assert(ret, "IDBFS used, but indexedDB not supported");
                    return ret
                },
                DB_VERSION: 21,
                DB_STORE_NAME: "FILE_DATA",
                mount: function(mount) {
                    return MEMFS.mount.apply(null, arguments)
                },
                syncfs: function(mount, populate, callback) {
                    IDBFS.getLocalSet(mount, function(err, local) {
                        if (err) return callback(err);
                        IDBFS.getRemoteSet(mount, function(err, remote) {
                            if (err) return callback(err);
                            var src = populate ? remote : local;
                            var dst = populate ? local : remote;
                            IDBFS.reconcile(src, dst, callback)
                        })
                    })
                },
                getDB: function(name, callback) {
                    var db = IDBFS.dbs[name];
                    if (db) {
                        return callback(null, db)
                    }
                    var req;
                    try {
                        req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
                    } catch (e) {
                        return callback(e)
                    }
                    if (!req) {
                        return callback("Unable to connect to IndexedDB")
                    }
                    req.onupgradeneeded = function(e) {
                        var db = e.target.result;
                        var transaction = e.target.transaction;
                        var fileStore;
                        if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
                        } else {
                            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
                        }
                        if (!fileStore.indexNames.contains("timestamp")) {
                            fileStore.createIndex("timestamp", "timestamp", {
                                unique: false
                            })
                        }
                    };
                    req.onsuccess = function() {
                        db = req.result;
                        IDBFS.dbs[name] = db;
                        callback(null, db)
                    };
                    req.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                getLocalSet: function(mount, callback) {
                    var entries = {};

                    function isRealDir(p) {
                        return p !== "." && p !== ".."
                    }

                    function toAbsolute(root) {
                        return function(p) {
                            return PATH.join2(root, p)
                        }
                    }

                    var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
                    while (check.length) {
                        var path = check.pop();
                        var stat;
                        try {
                            stat = FS.stat(path)
                        } catch (e) {
                            return callback(e)
                        }
                        if (FS.isDir(stat.mode)) {
                            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
                        }
                        entries[path] = {
                            timestamp: stat.mtime
                        }
                    }
                    return callback(null, {
                        type: "local",
                        entries: entries
                    })
                },
                getRemoteSet: function(mount, callback) {
                    var entries = {};
                    IDBFS.getDB(mount.mountpoint, function(err, db) {
                        if (err) return callback(err);
                        try {
                            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                            transaction.onerror = function(e) {
                                callback(this.error);
                                e.preventDefault()
                            };
                            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                            var index = store.index("timestamp");
                            index.openKeyCursor().onsuccess = function(event) {
                                var cursor = event.target.result;
                                if (!cursor) {
                                    return callback(null, {
                                        type: "remote",
                                        db: db,
                                        entries: entries
                                    })
                                }
                                entries[cursor.primaryKey] = {
                                    timestamp: cursor.key
                                };
                                cursor.continue()
                            }
                        } catch (e) {
                            return callback(e)
                        }
                    })
                },
                loadLocalEntry: function(path, callback) {
                    var stat, node;
                    try {
                        var lookup = FS.lookupPath(path);
                        node = lookup.node;
                        stat = FS.stat(path)
                    } catch (e) {
                        return callback(e)
                    }
                    if (FS.isDir(stat.mode)) {
                        return callback(null, {
                            timestamp: stat.mtime,
                            mode: stat.mode
                        })
                    } else if (FS.isFile(stat.mode)) {
                        node.contents = MEMFS.getFileDataAsTypedArray(node);
                        return callback(null, {
                            timestamp: stat.mtime,
                            mode: stat.mode,
                            contents: node.contents
                        })
                    } else {
                        return callback(new Error("node type not supported"))
                    }
                },
                storeLocalEntry: function(path, entry, callback) {
                    try {
                        if (FS.isDir(entry.mode)) {
                            FS.mkdir(path, entry.mode)
                        } else if (FS.isFile(entry.mode)) {
                            FS.writeFile(path, entry.contents, {
                                canOwn: true
                            })
                        } else {
                            return callback(new Error("node type not supported"))
                        }
                        FS.chmod(path, entry.mode);
                        FS.utime(path, entry.timestamp, entry.timestamp)
                    } catch (e) {
                        return callback(e)
                    }
                    callback(null)
                },
                removeLocalEntry: function(path, callback) {
                    try {
                        var lookup = FS.lookupPath(path);
                        var stat = FS.stat(path);
                        if (FS.isDir(stat.mode)) {
                            FS.rmdir(path)
                        } else if (FS.isFile(stat.mode)) {
                            FS.unlink(path)
                        }
                    } catch (e) {
                        return callback(e)
                    }
                    callback(null)
                },
                loadRemoteEntry: function(store, path, callback) {
                    var req = store.get(path);
                    req.onsuccess = function(event) {
                        callback(null, event.target.result)
                    };
                    req.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                storeRemoteEntry: function(store, path, entry, callback) {
                    var req = store.put(entry, path);
                    req.onsuccess = function() {
                        callback(null)
                    };
                    req.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                removeRemoteEntry: function(store, path, callback) {
                    var req = store.delete(path);
                    req.onsuccess = function() {
                        callback(null)
                    };
                    req.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                },
                reconcile: function(src, dst, callback) {
                    var total = 0;
                    var create = [];
                    Object.keys(src.entries).forEach(function(key) {
                        var e = src.entries[key];
                        var e2 = dst.entries[key];
                        if (!e2 || e.timestamp > e2.timestamp) {
                            create.push(key);
                            total++
                        }
                    });
                    var remove = [];
                    Object.keys(dst.entries).forEach(function(key) {
                        var e = dst.entries[key];
                        var e2 = src.entries[key];
                        if (!e2) {
                            remove.push(key);
                            total++
                        }
                    });
                    if (!total) {
                        return callback(null)
                    }
                    var errored = false;
                    var completed = 0;
                    var db = src.type === "remote" ? src.db : dst.db;
                    var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
                    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

                    function done(err) {
                        if (err) {
                            if (!done.errored) {
                                done.errored = true;
                                return callback(err)
                            }
                            return
                        }
                        if (++completed >= total) {
                            return callback(null)
                        }
                    }

                    transaction.onerror = function(e) {
                        done(this.error);
                        e.preventDefault()
                    };
                    create.sort().forEach(function(path) {
                        if (dst.type === "local") {
                            IDBFS.loadRemoteEntry(store, path, function(err, entry) {
                                if (err) return done(err);
                                IDBFS.storeLocalEntry(path, entry, done)
                            })
                        } else {
                            IDBFS.loadLocalEntry(path, function(err, entry) {
                                if (err) return done(err);
                                IDBFS.storeRemoteEntry(store, path, entry, done)
                            })
                        }
                    });
                    remove.sort().reverse().forEach(function(path) {
                        if (dst.type === "local") {
                            IDBFS.removeLocalEntry(path, done)
                        } else {
                            IDBFS.removeRemoteEntry(store, path, done)
                        }
                    })
                }
            };
            var NODEFS = {
                isWindows: false,
                staticInit: function() {
                    NODEFS.isWindows = !!process.platform.match(/^win/);
                    var flags = process["binding"]("constants");
                    if (flags["fs"]) {
                        flags = flags["fs"]
                    }
                    NODEFS.flagsForNodeMap = {
                        1024: flags["O_APPEND"],
                        64: flags["O_CREAT"],
                        128: flags["O_EXCL"],
                        0: flags["O_RDONLY"],
                        2: flags["O_RDWR"],
                        4096: flags["O_SYNC"],
                        512: flags["O_TRUNC"],
                        1: flags["O_WRONLY"]
                    }
                },
                bufferFrom: function(arrayBuffer) {
                    return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
                },
                mount: function(mount) {
                    assert(ENVIRONMENT_IS_NODE);
                    return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
                },
                createNode: function(parent, name, mode, dev) {
                    if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
                        throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                    }
                    var node = FS.createNode(parent, name, mode);
                    node.node_ops = NODEFS.node_ops;
                    node.stream_ops = NODEFS.stream_ops;
                    return node
                },
                getMode: function(path) {
                    var stat;
                    try {
                        stat = fs.lstatSync(path);
                        if (NODEFS.isWindows) {
                            stat.mode = stat.mode | (stat.mode & 292) >> 2
                        }
                    } catch (e) {
                        if (!e.code) throw e;
                        throw new FS.ErrnoError(ERRNO_CODES[e.code])
                    }
                    return stat.mode
                },
                realPath: function(node) {
                    var parts = [];
                    while (node.parent !== node) {
                        parts.push(node.name);
                        node = node.parent
                    }
                    parts.push(node.mount.opts.root);
                    parts.reverse();
                    return PATH.join.apply(null, parts)
                },
                flagsForNode: function(flags) {
                    flags &= ~2097152;
                    flags &= ~2048;
                    flags &= ~32768;
                    flags &= ~524288;
                    var newFlags = 0;
                    for (var k in NODEFS.flagsForNodeMap) {
                        if (flags & k) {
                            newFlags |= NODEFS.flagsForNodeMap[k];
                            flags ^= k
                        }
                    }
                    if (!flags) {
                        return newFlags
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                    }
                },
                node_ops: {
                    getattr: function(node) {
                        var path = NODEFS.realPath(node);
                        var stat;
                        try {
                            stat = fs.lstatSync(path)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                        if (NODEFS.isWindows && !stat.blksize) {
                            stat.blksize = 4096
                        }
                        if (NODEFS.isWindows && !stat.blocks) {
                            stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
                        }
                        return {
                            dev: stat.dev,
                            ino: stat.ino,
                            mode: stat.mode,
                            nlink: stat.nlink,
                            uid: stat.uid,
                            gid: stat.gid,
                            rdev: stat.rdev,
                            size: stat.size,
                            atime: stat.atime,
                            mtime: stat.mtime,
                            ctime: stat.ctime,
                            blksize: stat.blksize,
                            blocks: stat.blocks
                        }
                    },
                    setattr: function(node, attr) {
                        var path = NODEFS.realPath(node);
                        try {
                            if (attr.mode !== undefined) {
                                fs.chmodSync(path, attr.mode);
                                node.mode = attr.mode
                            }
                            if (attr.timestamp !== undefined) {
                                var date = new Date(attr.timestamp);
                                fs.utimesSync(path, date, date)
                            }
                            if (attr.size !== undefined) {
                                fs.truncateSync(path, attr.size)
                            }
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    lookup: function(parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        var mode = NODEFS.getMode(path);
                        return NODEFS.createNode(parent, name, mode)
                    },
                    mknod: function(parent, name, mode, dev) {
                        var node = NODEFS.createNode(parent, name, mode, dev);
                        var path = NODEFS.realPath(node);
                        try {
                            if (FS.isDir(node.mode)) {
                                fs.mkdirSync(path, node.mode)
                            } else {
                                fs.writeFileSync(path, "", {
                                    mode: node.mode
                                })
                            }
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                        return node
                    },
                    rename: function(oldNode, newDir, newName) {
                        var oldPath = NODEFS.realPath(oldNode);
                        var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
                        try {
                            fs.renameSync(oldPath, newPath)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    unlink: function(parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        try {
                            fs.unlinkSync(path)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    rmdir: function(parent, name) {
                        var path = PATH.join2(NODEFS.realPath(parent), name);
                        try {
                            fs.rmdirSync(path)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    readdir: function(node) {
                        var path = NODEFS.realPath(node);
                        try {
                            return fs.readdirSync(path)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    symlink: function(parent, newName, oldPath) {
                        var newPath = PATH.join2(NODEFS.realPath(parent), newName);
                        try {
                            fs.symlinkSync(oldPath, newPath)
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    readlink: function(node) {
                        var path = NODEFS.realPath(node);
                        try {
                            path = fs.readlinkSync(path);
                            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                            return path
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    }
                },
                stream_ops: {
                    open: function(stream) {
                        var path = NODEFS.realPath(stream.node);
                        try {
                            if (FS.isFile(stream.node.mode)) {
                                stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
                            }
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    close: function(stream) {
                        try {
                            if (FS.isFile(stream.node.mode) && stream.nfd) {
                                fs.closeSync(stream.nfd)
                            }
                        } catch (e) {
                            if (!e.code) throw e;
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    read: function(stream, buffer, offset, length, position) {
                        if (length === 0) return 0;
                        try {
                            return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                        } catch (e) {
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    write: function(stream, buffer, offset, length, position) {
                        try {
                            return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                        } catch (e) {
                            throw new FS.ErrnoError(ERRNO_CODES[e.code])
                        }
                    },
                    llseek: function(stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                try {
                                    var stat = fs.fstatSync(stream.nfd);
                                    position += stat.size
                                } catch (e) {
                                    throw new FS.ErrnoError(ERRNO_CODES[e.code])
                                }
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                        }
                        return position
                    }
                }
            };
            var WORKERFS = {
                DIR_MODE: 16895,
                FILE_MODE: 33279,
                reader: null,
                mount: function(mount) {
                    assert(ENVIRONMENT_IS_WORKER);
                    if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
                    var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
                    var createdParents = {};

                    function ensureParent(path) {
                        var parts = path.split("/");
                        var parent = root;
                        for (var i = 0; i < parts.length - 1; i++) {
                            var curr = parts.slice(0, i + 1).join("/");
                            if (!createdParents[curr]) {
                                createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                            }
                            parent = createdParents[curr]
                        }
                        return parent
                    }

                    function base(path) {
                        var parts = path.split("/");
                        return parts[parts.length - 1]
                    }

                    Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
                        WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
                    });
                    (mount.opts["blobs"] || []).forEach(function(obj) {
                        WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
                    });
                    (mount.opts["packages"] || []).forEach(function(pack) {
                        pack["metadata"].files.forEach(function(file) {
                            var name = file.filename.substr(1);
                            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
                        })
                    });
                    return root
                },
                createNode: function(parent, name, mode, dev, contents, mtime) {
                    var node = FS.createNode(parent, name, mode);
                    node.mode = mode;
                    node.node_ops = WORKERFS.node_ops;
                    node.stream_ops = WORKERFS.stream_ops;
                    node.timestamp = (mtime || new Date).getTime();
                    assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
                    if (mode === WORKERFS.FILE_MODE) {
                        node.size = contents.size;
                        node.contents = contents
                    } else {
                        node.size = 4096;
                        node.contents = {}
                    }
                    if (parent) {
                        parent.contents[name] = node
                    }
                    return node
                },
                node_ops: {
                    getattr: function(node) {
                        return {
                            dev: 1,
                            ino: undefined,
                            mode: node.mode,
                            nlink: 1,
                            uid: 0,
                            gid: 0,
                            rdev: undefined,
                            size: node.size,
                            atime: new Date(node.timestamp),
                            mtime: new Date(node.timestamp),
                            ctime: new Date(node.timestamp),
                            blksize: 4096,
                            blocks: Math.ceil(node.size / 4096)
                        }
                    },
                    setattr: function(node, attr) {
                        if (attr.mode !== undefined) {
                            node.mode = attr.mode
                        }
                        if (attr.timestamp !== undefined) {
                            node.timestamp = attr.timestamp
                        }
                    },
                    lookup: function(parent, name) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
                    },
                    mknod: function(parent, name, mode, dev) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    },
                    rename: function(oldNode, newDir, newName) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    },
                    unlink: function(parent, name) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    },
                    rmdir: function(parent, name) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    },
                    readdir: function(node) {
                        var entries = [".", ".."];
                        for (var key in node.contents) {
                            if (!node.contents.hasOwnProperty(key)) {
                                continue
                            }
                            entries.push(key)
                        }
                        return entries
                    },
                    symlink: function(parent, newName, oldPath) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    },
                    readlink: function(node) {
                        throw new FS.ErrnoError(ERRNO_CODES.EPERM)
                    }
                },
                stream_ops: {
                    read: function(stream, buffer, offset, length, position) {
                        if (position >= stream.node.size) return 0;
                        var chunk = stream.node.contents.slice(position, position + length);
                        var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
                        buffer.set(new Uint8Array(ab), offset);
                        return chunk.size
                    },
                    write: function(stream, buffer, offset, length, position) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    },
                    llseek: function(stream, offset, whence) {
                        var position = offset;
                        if (whence === 1) {
                            position += stream.position
                        } else if (whence === 2) {
                            if (FS.isFile(stream.node.mode)) {
                                position += stream.node.size
                            }
                        }
                        if (position < 0) {
                            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                        }
                        return position
                    }
                }
            };
            var FS = {
                root: null,
                mounts: [],
                devices: {},
                streams: [],
                nextInode: 1,
                nameTable: null,
                currentPath: "/",
                initialized: false,
                ignorePermissions: true,
                trackingDelegate: {},
                tracking: {
                    openFlags: {
                        READ: 1,
                        WRITE: 2
                    }
                },
                ErrnoError: null,
                genericErrors: {},
                filesystems: null,
                syncFSRequests: 0,
                handleFSError: function(e) {
                    if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
                    return ___setErrNo(e.errno)
                },
                lookupPath: function(path, opts) {
                    path = PATH.resolve(FS.cwd(), path);
                    opts = opts || {};
                    if (!path) return {
                        path: "",
                        node: null
                    };
                    var defaults = {
                        follow_mount: true,
                        recurse_count: 0
                    };
                    for (var key in defaults) {
                        if (opts[key] === undefined) {
                            opts[key] = defaults[key]
                        }
                    }
                    if (opts.recurse_count > 8) {
                        throw new FS.ErrnoError(40)
                    }
                    var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
                        return !!p
                    }), false);
                    var current = FS.root;
                    var current_path = "/";
                    for (var i = 0; i < parts.length; i++) {
                        var islast = i === parts.length - 1;
                        if (islast && opts.parent) {
                            break
                        }
                        current = FS.lookupNode(current, parts[i]);
                        current_path = PATH.join2(current_path, parts[i]);
                        if (FS.isMountpoint(current)) {
                            if (!islast || islast && opts.follow_mount) {
                                current = current.mounted.root
                            }
                        }
                        if (!islast || opts.follow) {
                            var count = 0;
                            while (FS.isLink(current.mode)) {
                                var link = FS.readlink(current_path);
                                current_path = PATH.resolve(PATH.dirname(current_path), link);
                                var lookup = FS.lookupPath(current_path, {
                                    recurse_count: opts.recurse_count
                                });
                                current = lookup.node;
                                if (count++ > 40) {
                                    throw new FS.ErrnoError(40)
                                }
                            }
                        }
                    }
                    return {
                        path: current_path,
                        node: current
                    }
                },
                getPath: function(node) {
                    var path;
                    while (true) {
                        if (FS.isRoot(node)) {
                            var mount = node.mount.mountpoint;
                            if (!path) return mount;
                            return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
                        }
                        path = path ? node.name + "/" + path : node.name;
                        node = node.parent
                    }
                },
                hashName: function(parentid, name) {
                    var hash = 0;
                    for (var i = 0; i < name.length; i++) {
                        hash = (hash << 5) - hash + name.charCodeAt(i) | 0
                    }
                    return (parentid + hash >>> 0) % FS.nameTable.length
                },
                hashAddNode: function(node) {
                    var hash = FS.hashName(node.parent.id, node.name);
                    node.name_next = FS.nameTable[hash];
                    FS.nameTable[hash] = node
                },
                hashRemoveNode: function(node) {
                    var hash = FS.hashName(node.parent.id, node.name);
                    if (FS.nameTable[hash] === node) {
                        FS.nameTable[hash] = node.name_next
                    } else {
                        var current = FS.nameTable[hash];
                        while (current) {
                            if (current.name_next === node) {
                                current.name_next = node.name_next;
                                break
                            }
                            current = current.name_next
                        }
                    }
                },
                lookupNode: function(parent, name) {
                    var err = FS.mayLookup(parent);
                    if (err) {
                        throw new FS.ErrnoError(err, parent)
                    }
                    var hash = FS.hashName(parent.id, name);
                    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                        var nodeName = node.name;
                        if (node.parent.id === parent.id && nodeName === name) {
                            return node
                        }
                    }
                    return FS.lookup(parent, name)
                },
                createNode: function(parent, name, mode, rdev) {
                    if (!FS.FSNode) {
                        FS.FSNode = function(parent, name, mode, rdev) {
                            if (!parent) {
                                parent = this
                            }
                            this.parent = parent;
                            this.mount = parent.mount;
                            this.mounted = null;
                            this.id = FS.nextInode++;
                            this.name = name;
                            this.mode = mode;
                            this.node_ops = {};
                            this.stream_ops = {};
                            this.rdev = rdev
                        };
                        FS.FSNode.prototype = {};
                        var readMode = 292 | 73;
                        var writeMode = 146;
                        Object.defineProperties(FS.FSNode.prototype, {
                            read: {
                                get: function() {
                                    return (this.mode & readMode) === readMode
                                },
                                set: function(val) {
                                    val ? this.mode |= readMode : this.mode &= ~readMode
                                }
                            },
                            write: {
                                get: function() {
                                    return (this.mode & writeMode) === writeMode
                                },
                                set: function(val) {
                                    val ? this.mode |= writeMode : this.mode &= ~writeMode
                                }
                            },
                            isFolder: {
                                get: function() {
                                    return FS.isDir(this.mode)
                                }
                            },
                            isDevice: {
                                get: function() {
                                    return FS.isChrdev(this.mode)
                                }
                            }
                        })
                    }
                    var node = new FS.FSNode(parent, name, mode, rdev);
                    FS.hashAddNode(node);
                    return node
                },
                destroyNode: function(node) {
                    FS.hashRemoveNode(node)
                },
                isRoot: function(node) {
                    return node === node.parent
                },
                isMountpoint: function(node) {
                    return !!node.mounted
                },
                isFile: function(mode) {
                    return (mode & 61440) === 32768
                },
                isDir: function(mode) {
                    return (mode & 61440) === 16384
                },
                isLink: function(mode) {
                    return (mode & 61440) === 40960
                },
                isChrdev: function(mode) {
                    return (mode & 61440) === 8192
                },
                isBlkdev: function(mode) {
                    return (mode & 61440) === 24576
                },
                isFIFO: function(mode) {
                    return (mode & 61440) === 4096
                },
                isSocket: function(mode) {
                    return (mode & 49152) === 49152
                },
                flagModes: {
                    "r": 0,
                    "rs": 1052672,
                    "r+": 2,
                    "w": 577,
                    "wx": 705,
                    "xw": 705,
                    "w+": 578,
                    "wx+": 706,
                    "xw+": 706,
                    "a": 1089,
                    "ax": 1217,
                    "xa": 1217,
                    "a+": 1090,
                    "ax+": 1218,
                    "xa+": 1218
                },
                modeStringToFlags: function(str) {
                    var flags = FS.flagModes[str];
                    if (typeof flags === "undefined") {
                        throw new Error("Unknown file open mode: " + str)
                    }
                    return flags
                },
                flagsToPermissionString: function(flag) {
                    var perms = ["r", "w", "rw"][flag & 3];
                    if (flag & 512) {
                        perms += "w"
                    }
                    return perms
                },
                nodePermissions: function(node, perms) {
                    if (FS.ignorePermissions) {
                        return 0
                    }
                    if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
                        return 13
                    } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
                        return 13
                    } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
                        return 13
                    }
                    return 0
                },
                mayLookup: function(dir) {
                    var err = FS.nodePermissions(dir, "x");
                    if (err) return err;
                    if (!dir.node_ops.lookup) return 13;
                    return 0
                },
                mayCreate: function(dir, name) {
                    try {
                        var node = FS.lookupNode(dir, name);
                        return 17
                    } catch (e) {}
                    return FS.nodePermissions(dir, "wx")
                },
                mayDelete: function(dir, name, isdir) {
                    var node;
                    try {
                        node = FS.lookupNode(dir, name)
                    } catch (e) {
                        return e.errno
                    }
                    var err = FS.nodePermissions(dir, "wx");
                    if (err) {
                        return err
                    }
                    if (isdir) {
                        if (!FS.isDir(node.mode)) {
                            return 20
                        }
                        if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                            return 16
                        }
                    } else {
                        if (FS.isDir(node.mode)) {
                            return 21
                        }
                    }
                    return 0
                },
                mayOpen: function(node, flags) {
                    if (!node) {
                        return 2
                    }
                    if (FS.isLink(node.mode)) {
                        return 40
                    } else if (FS.isDir(node.mode)) {
                        if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                            return 21
                        }
                    }
                    return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
                },
                MAX_OPEN_FDS: 4096,
                nextfd: function(fd_start, fd_end) {
                    fd_start = fd_start || 0;
                    fd_end = fd_end || FS.MAX_OPEN_FDS;
                    for (var fd = fd_start; fd <= fd_end; fd++) {
                        if (!FS.streams[fd]) {
                            return fd
                        }
                    }
                    throw new FS.ErrnoError(24)
                },
                getStream: function(fd) {
                    return FS.streams[fd]
                },
                createStream: function(stream, fd_start, fd_end) {
                    if (!FS.FSStream) {
                        FS.FSStream = function() {};
                        FS.FSStream.prototype = {};
                        Object.defineProperties(FS.FSStream.prototype, {
                            object: {
                                get: function() {
                                    return this.node
                                },
                                set: function(val) {
                                    this.node = val
                                }
                            },
                            isRead: {
                                get: function() {
                                    return (this.flags & 2097155) !== 1
                                }
                            },
                            isWrite: {
                                get: function() {
                                    return (this.flags & 2097155) !== 0
                                }
                            },
                            isAppend: {
                                get: function() {
                                    return this.flags & 1024
                                }
                            }
                        })
                    }
                    var newStream = new FS.FSStream;
                    for (var p in stream) {
                        newStream[p] = stream[p]
                    }
                    stream = newStream;
                    var fd = FS.nextfd(fd_start, fd_end);
                    stream.fd = fd;
                    FS.streams[fd] = stream;
                    return stream
                },
                closeStream: function(fd) {
                    FS.streams[fd] = null
                },
                chrdev_stream_ops: {
                    open: function(stream) {
                        var device = FS.getDevice(stream.node.rdev);
                        stream.stream_ops = device.stream_ops;
                        if (stream.stream_ops.open) {
                            stream.stream_ops.open(stream)
                        }
                    },
                    llseek: function() {
                        throw new FS.ErrnoError(29)
                    }
                },
                major: function(dev) {
                    return dev >> 8
                },
                minor: function(dev) {
                    return dev & 255
                },
                makedev: function(ma, mi) {
                    return ma << 8 | mi
                },
                registerDevice: function(dev, ops) {
                    FS.devices[dev] = {
                        stream_ops: ops
                    }
                },
                getDevice: function(dev) {
                    return FS.devices[dev]
                },
                getMounts: function(mount) {
                    var mounts = [];
                    var check = [mount];
                    while (check.length) {
                        var m = check.pop();
                        mounts.push(m);
                        check.push.apply(check, m.mounts)
                    }
                    return mounts
                },
                syncfs: function(populate, callback) {
                    if (typeof populate === "function") {
                        callback = populate;
                        populate = false
                    }
                    FS.syncFSRequests++;
                    if (FS.syncFSRequests > 1) {
                        console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
                    }
                    var mounts = FS.getMounts(FS.root.mount);
                    var completed = 0;

                    function doCallback(err) {
                        FS.syncFSRequests--;
                        return callback(err)
                    }

                    function done(err) {
                        if (err) {
                            if (!done.errored) {
                                done.errored = true;
                                return doCallback(err)
                            }
                            return
                        }
                        if (++completed >= mounts.length) {
                            doCallback(null)
                        }
                    }

                    mounts.forEach(function(mount) {
                        if (!mount.type.syncfs) {
                            return done(null)
                        }
                        mount.type.syncfs(mount, populate, done)
                    })
                },
                mount: function(type, opts, mountpoint) {
                    var root = mountpoint === "/";
                    var pseudo = !mountpoint;
                    var node;
                    if (root && FS.root) {
                        throw new FS.ErrnoError(16)
                    } else if (!root && !pseudo) {
                        var lookup = FS.lookupPath(mountpoint, {
                            follow_mount: false
                        });
                        mountpoint = lookup.path;
                        node = lookup.node;
                        if (FS.isMountpoint(node)) {
                            throw new FS.ErrnoError(16)
                        }
                        if (!FS.isDir(node.mode)) {
                            throw new FS.ErrnoError(20)
                        }
                    }
                    var mount = {
                        type: type,
                        opts: opts,
                        mountpoint: mountpoint,
                        mounts: []
                    };
                    var mountRoot = type.mount(mount);
                    mountRoot.mount = mount;
                    mount.root = mountRoot;
                    if (root) {
                        FS.root = mountRoot
                    } else if (node) {
                        node.mounted = mount;
                        if (node.mount) {
                            node.mount.mounts.push(mount)
                        }
                    }
                    return mountRoot
                },
                unmount: function(mountpoint) {
                    var lookup = FS.lookupPath(mountpoint, {
                        follow_mount: false
                    });
                    if (!FS.isMountpoint(lookup.node)) {
                        throw new FS.ErrnoError(22)
                    }
                    var node = lookup.node;
                    var mount = node.mounted;
                    var mounts = FS.getMounts(mount);
                    Object.keys(FS.nameTable).forEach(function(hash) {
                        var current = FS.nameTable[hash];
                        while (current) {
                            var next = current.name_next;
                            if (mounts.indexOf(current.mount) !== -1) {
                                FS.destroyNode(current)
                            }
                            current = next
                        }
                    });
                    node.mounted = null;
                    var idx = node.mount.mounts.indexOf(mount);
                    node.mount.mounts.splice(idx, 1)
                },
                lookup: function(parent, name) {
                    return parent.node_ops.lookup(parent, name)
                },
                mknod: function(path, mode, dev) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    if (!name || name === "." || name === "..") {
                        throw new FS.ErrnoError(22)
                    }
                    var err = FS.mayCreate(parent, name);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.mknod) {
                        throw new FS.ErrnoError(1)
                    }
                    return parent.node_ops.mknod(parent, name, mode, dev)
                },
                create: function(path, mode) {
                    mode = mode !== undefined ? mode : 438;
                    mode &= 4095;
                    mode |= 32768;
                    return FS.mknod(path, mode, 0)
                },
                mkdir: function(path, mode) {
                    mode = mode !== undefined ? mode : 511;
                    mode &= 511 | 512;
                    mode |= 16384;
                    return FS.mknod(path, mode, 0)
                },
                mkdirTree: function(path, mode) {
                    var dirs = path.split("/");
                    var d = "";
                    for (var i = 0; i < dirs.length; ++i) {
                        if (!dirs[i]) continue;
                        d += "/" + dirs[i];
                        try {
                            FS.mkdir(d, mode)
                        } catch (e) {
                            if (e.errno != 17) throw e
                        }
                    }
                },
                mkdev: function(path, mode, dev) {
                    if (typeof dev === "undefined") {
                        dev = mode;
                        mode = 438
                    }
                    mode |= 8192;
                    return FS.mknod(path, mode, dev)
                },
                symlink: function(oldpath, newpath) {
                    if (!PATH.resolve(oldpath)) {
                        throw new FS.ErrnoError(2)
                    }
                    var lookup = FS.lookupPath(newpath, {
                        parent: true
                    });
                    var parent = lookup.node;
                    if (!parent) {
                        throw new FS.ErrnoError(2)
                    }
                    var newname = PATH.basename(newpath);
                    var err = FS.mayCreate(parent, newname);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.symlink) {
                        throw new FS.ErrnoError(1)
                    }
                    return parent.node_ops.symlink(parent, newname, oldpath)
                },
                rename: function(old_path, new_path) {
                    var old_dirname = PATH.dirname(old_path);
                    var new_dirname = PATH.dirname(new_path);
                    var old_name = PATH.basename(old_path);
                    var new_name = PATH.basename(new_path);
                    var lookup, old_dir, new_dir;
                    try {
                        lookup = FS.lookupPath(old_path, {
                            parent: true
                        });
                        old_dir = lookup.node;
                        lookup = FS.lookupPath(new_path, {
                            parent: true
                        });
                        new_dir = lookup.node
                    } catch (e) {
                        throw new FS.ErrnoError(16)
                    }
                    if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
                    if (old_dir.mount !== new_dir.mount) {
                        throw new FS.ErrnoError(18)
                    }
                    var old_node = FS.lookupNode(old_dir, old_name);
                    var relative = PATH.relative(old_path, new_dirname);
                    if (relative.charAt(0) !== ".") {
                        throw new FS.ErrnoError(22)
                    }
                    relative = PATH.relative(new_path, old_dirname);
                    if (relative.charAt(0) !== ".") {
                        throw new FS.ErrnoError(39)
                    }
                    var new_node;
                    try {
                        new_node = FS.lookupNode(new_dir, new_name)
                    } catch (e) {}
                    if (old_node === new_node) {
                        return
                    }
                    var isdir = FS.isDir(old_node.mode);
                    var err = FS.mayDelete(old_dir, old_name, isdir);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!old_dir.node_ops.rename) {
                        throw new FS.ErrnoError(1)
                    }
                    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
                        throw new FS.ErrnoError(16)
                    }
                    if (new_dir !== old_dir) {
                        err = FS.nodePermissions(old_dir, "w");
                        if (err) {
                            throw new FS.ErrnoError(err)
                        }
                    }
                    try {
                        if (FS.trackingDelegate["willMovePath"]) {
                            FS.trackingDelegate["willMovePath"](old_path, new_path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                    }
                    FS.hashRemoveNode(old_node);
                    try {
                        old_dir.node_ops.rename(old_node, new_dir, new_name)
                    } catch (e) {
                        throw e
                    } finally {
                        FS.hashAddNode(old_node)
                    }
                    try {
                        if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                    }
                },
                rmdir: function(path) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    var node = FS.lookupNode(parent, name);
                    var err = FS.mayDelete(parent, name, true);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.rmdir) {
                        throw new FS.ErrnoError(1)
                    }
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(16)
                    }
                    try {
                        if (FS.trackingDelegate["willDeletePath"]) {
                            FS.trackingDelegate["willDeletePath"](path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                    parent.node_ops.rmdir(parent, name);
                    FS.destroyNode(node);
                    try {
                        if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                },
                readdir: function(path) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    var node = lookup.node;
                    if (!node.node_ops.readdir) {
                        throw new FS.ErrnoError(20)
                    }
                    return node.node_ops.readdir(node)
                },
                unlink: function(path) {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    var parent = lookup.node;
                    var name = PATH.basename(path);
                    var node = FS.lookupNode(parent, name);
                    var err = FS.mayDelete(parent, name, false);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    if (!parent.node_ops.unlink) {
                        throw new FS.ErrnoError(1)
                    }
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(16)
                    }
                    try {
                        if (FS.trackingDelegate["willDeletePath"]) {
                            FS.trackingDelegate["willDeletePath"](path)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                    parent.node_ops.unlink(parent, name);
                    FS.destroyNode(node);
                    try {
                        if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                    }
                },
                readlink: function(path) {
                    var lookup = FS.lookupPath(path);
                    var link = lookup.node;
                    if (!link) {
                        throw new FS.ErrnoError(2)
                    }
                    if (!link.node_ops.readlink) {
                        throw new FS.ErrnoError(22)
                    }
                    return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
                },
                stat: function(path, dontFollow) {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontFollow
                    });
                    var node = lookup.node;
                    if (!node) {
                        throw new FS.ErrnoError(2)
                    }
                    if (!node.node_ops.getattr) {
                        throw new FS.ErrnoError(1)
                    }
                    return node.node_ops.getattr(node)
                },
                lstat: function(path) {
                    return FS.stat(path, true)
                },
                chmod: function(path, mode, dontFollow) {
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontFollow
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(1)
                    }
                    node.node_ops.setattr(node, {
                        mode: mode & 4095 | node.mode & ~4095,
                        timestamp: Date.now()
                    })
                },
                lchmod: function(path, mode) {
                    FS.chmod(path, mode, true)
                },
                fchmod: function(fd, mode) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(9)
                    }
                    FS.chmod(stream.node, mode)
                },
                chown: function(path, uid, gid, dontFollow) {
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontFollow
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(1)
                    }
                    node.node_ops.setattr(node, {
                        timestamp: Date.now()
                    })
                },
                lchown: function(path, uid, gid) {
                    FS.chown(path, uid, gid, true)
                },
                fchown: function(fd, uid, gid) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(9)
                    }
                    FS.chown(stream.node, uid, gid)
                },
                truncate: function(path, len) {
                    if (len < 0) {
                        throw new FS.ErrnoError(22)
                    }
                    var node;
                    if (typeof path === "string") {
                        var lookup = FS.lookupPath(path, {
                            follow: true
                        });
                        node = lookup.node
                    } else {
                        node = path
                    }
                    if (!node.node_ops.setattr) {
                        throw new FS.ErrnoError(1)
                    }
                    if (FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(21)
                    }
                    if (!FS.isFile(node.mode)) {
                        throw new FS.ErrnoError(22)
                    }
                    var err = FS.nodePermissions(node, "w");
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    node.node_ops.setattr(node, {
                        size: len,
                        timestamp: Date.now()
                    })
                },
                ftruncate: function(fd, len) {
                    var stream = FS.getStream(fd);
                    if (!stream) {
                        throw new FS.ErrnoError(9)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(22)
                    }
                    FS.truncate(stream.node, len)
                },
                utime: function(path, atime, mtime) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    var node = lookup.node;
                    node.node_ops.setattr(node, {
                        timestamp: Math.max(atime, mtime)
                    })
                },
                open: function(path, flags, mode, fd_start, fd_end) {
                    if (path === "") {
                        throw new FS.ErrnoError(2)
                    }
                    flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
                    mode = typeof mode === "undefined" ? 438 : mode;
                    if (flags & 64) {
                        mode = mode & 4095 | 32768
                    } else {
                        mode = 0
                    }
                    var node;
                    if (typeof path === "object") {
                        node = path
                    } else {
                        path = PATH.normalize(path);
                        try {
                            var lookup = FS.lookupPath(path, {
                                follow: !(flags & 131072)
                            });
                            node = lookup.node
                        } catch (e) {}
                    }
                    var created = false;
                    if (flags & 64) {
                        if (node) {
                            if (flags & 128) {
                                throw new FS.ErrnoError(17)
                            }
                        } else {
                            node = FS.mknod(path, mode, 0);
                            created = true
                        }
                    }
                    if (!node) {
                        throw new FS.ErrnoError(2)
                    }
                    if (FS.isChrdev(node.mode)) {
                        flags &= ~512
                    }
                    if (flags & 65536 && !FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(20)
                    }
                    if (!created) {
                        var err = FS.mayOpen(node, flags);
                        if (err) {
                            throw new FS.ErrnoError(err)
                        }
                    }
                    if (flags & 512) {
                        FS.truncate(node, 0)
                    }
                    flags &= ~(128 | 512);
                    var stream = FS.createStream({
                        node: node,
                        path: FS.getPath(node),
                        flags: flags,
                        seekable: true,
                        position: 0,
                        stream_ops: node.stream_ops,
                        ungotten: [],
                        error: false
                    }, fd_start, fd_end);
                    if (stream.stream_ops.open) {
                        stream.stream_ops.open(stream)
                    }
                    if (Module["logReadFiles"] && !(flags & 1)) {
                        if (!FS.readFiles) FS.readFiles = {};
                        if (!(path in FS.readFiles)) {
                            FS.readFiles[path] = 1;
                            console.log("FS.trackingDelegate error on read file: " + path)
                        }
                    }
                    try {
                        if (FS.trackingDelegate["onOpenFile"]) {
                            var trackingFlags = 0;
                            if ((flags & 2097155) !== 1) {
                                trackingFlags |= FS.tracking.openFlags.READ
                            }
                            if ((flags & 2097155) !== 0) {
                                trackingFlags |= FS.tracking.openFlags.WRITE
                            }
                            FS.trackingDelegate["onOpenFile"](path, trackingFlags)
                        }
                    } catch (e) {
                        console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
                    }
                    return stream
                },
                close: function(stream) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(9)
                    }
                    if (stream.getdents) stream.getdents = null;
                    try {
                        if (stream.stream_ops.close) {
                            stream.stream_ops.close(stream)
                        }
                    } catch (e) {
                        throw e
                    } finally {
                        FS.closeStream(stream.fd)
                    }
                    stream.fd = null
                },
                isClosed: function(stream) {
                    return stream.fd === null
                },
                llseek: function(stream, offset, whence) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(9)
                    }
                    if (!stream.seekable || !stream.stream_ops.llseek) {
                        throw new FS.ErrnoError(29)
                    }
                    if (whence != 0 && whence != 1 && whence != 2) {
                        throw new FS.ErrnoError(22)
                    }
                    stream.position = stream.stream_ops.llseek(stream, offset, whence);
                    stream.ungotten = [];
                    return stream.position
                },
                read: function(stream, buffer, offset, length, position) {
                    if (length < 0 || position < 0) {
                        throw new FS.ErrnoError(22)
                    }
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(9)
                    }
                    if ((stream.flags & 2097155) === 1) {
                        throw new FS.ErrnoError(9)
                    }
                    if (FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(21)
                    }
                    if (!stream.stream_ops.read) {
                        throw new FS.ErrnoError(22)
                    }
                    var seeking = typeof position !== "undefined";
                    if (!seeking) {
                        position = stream.position
                    } else if (!stream.seekable) {
                        throw new FS.ErrnoError(29)
                    }
                    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
                    if (!seeking) stream.position += bytesRead;
                    return bytesRead
                },
                write: function(stream, buffer, offset, length, position, canOwn) {
                    if (length < 0 || position < 0) {
                        throw new FS.ErrnoError(22)
                    }
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(9)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(9)
                    }
                    if (FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(21)
                    }
                    if (!stream.stream_ops.write) {
                        throw new FS.ErrnoError(22)
                    }
                    if (stream.flags & 1024) {
                        FS.llseek(stream, 0, 2)
                    }
                    var seeking = typeof position !== "undefined";
                    if (!seeking) {
                        position = stream.position
                    } else if (!stream.seekable) {
                        throw new FS.ErrnoError(29)
                    }
                    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
                    if (!seeking) stream.position += bytesWritten;
                    try {
                        if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
                    } catch (e) {
                        console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
                    }
                    return bytesWritten
                },
                allocate: function(stream, offset, length) {
                    if (FS.isClosed(stream)) {
                        throw new FS.ErrnoError(9)
                    }
                    if (offset < 0 || length <= 0) {
                        throw new FS.ErrnoError(22)
                    }
                    if ((stream.flags & 2097155) === 0) {
                        throw new FS.ErrnoError(9)
                    }
                    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                        throw new FS.ErrnoError(19)
                    }
                    if (!stream.stream_ops.allocate) {
                        throw new FS.ErrnoError(95)
                    }
                    stream.stream_ops.allocate(stream, offset, length)
                },
                mmap: function(stream, buffer, offset, length, position, prot, flags) {
                    if ((stream.flags & 2097155) === 1) {
                        throw new FS.ErrnoError(13)
                    }
                    if (!stream.stream_ops.mmap) {
                        throw new FS.ErrnoError(19)
                    }
                    return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
                },
                msync: function(stream, buffer, offset, length, mmapFlags) {
                    if (!stream || !stream.stream_ops.msync) {
                        return 0
                    }
                    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
                },
                munmap: function(stream) {
                    return 0
                },
                ioctl: function(stream, cmd, arg) {
                    if (!stream.stream_ops.ioctl) {
                        throw new FS.ErrnoError(25)
                    }
                    return stream.stream_ops.ioctl(stream, cmd, arg)
                },
                readFile: function(path, opts) {
                    opts = opts || {};
                    opts.flags = opts.flags || "r";
                    opts.encoding = opts.encoding || "binary";
                    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                        throw new Error('Invalid encoding type "' + opts.encoding + '"')
                    }
                    var ret;
                    var stream = FS.open(path, opts.flags);
                    var stat = FS.stat(path);
                    var length = stat.size;
                    var buf = new Uint8Array(length);
                    FS.read(stream, buf, 0, length, 0);
                    if (opts.encoding === "utf8") {
                        ret = UTF8ArrayToString(buf, 0)
                    } else if (opts.encoding === "binary") {
                        ret = buf
                    }
                    FS.close(stream);
                    return ret
                },
                writeFile: function(path, data, opts) {
                    opts = opts || {};
                    opts.flags = opts.flags || "w";
                    var stream = FS.open(path, opts.flags, opts.mode);
                    if (typeof data === "string") {
                        var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                        var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                        FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
                    } else if (ArrayBuffer.isView(data)) {
                        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
                    } else {
                        throw new Error("Unsupported data type")
                    }
                    FS.close(stream)
                },
                cwd: function() {
                    return FS.currentPath
                },
                chdir: function(path) {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    if (lookup.node === null) {
                        throw new FS.ErrnoError(2)
                    }
                    if (!FS.isDir(lookup.node.mode)) {
                        throw new FS.ErrnoError(20)
                    }
                    var err = FS.nodePermissions(lookup.node, "x");
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                    FS.currentPath = lookup.path
                },
                createDefaultDirectories: function() {
                    FS.mkdir("/tmp");
                    FS.mkdir("/home");
                    FS.mkdir("/home/web_user")
                },
                createDefaultDevices: function() {
                    FS.mkdir("/dev");
                    FS.registerDevice(FS.makedev(1, 3), {
                        read: function() {
                            return 0
                        },
                        write: function(stream, buffer, offset, length, pos) {
                            return length
                        }
                    });
                    FS.mkdev("/dev/null", FS.makedev(1, 3));
                    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
                    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
                    FS.mkdev("/dev/tty", FS.makedev(5, 0));
                    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
                    var random_device;
                    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                        var randomBuffer = new Uint8Array(1);
                        random_device = function() {
                            crypto.getRandomValues(randomBuffer);
                            return randomBuffer[0]
                        }
                    } else if (ENVIRONMENT_IS_NODE) {
                        try {
                            var crypto_module = require("crypto");
                            random_device = function() {
                                return crypto_module["randomBytes"](1)[0]
                            }
                        } catch (e) {
                            random_device = function() {
                                return Math.random() * 256 | 0
                            }
                        }
                    } else {
                        random_device = function() {
                            abort("random_device")
                        }
                    }
                    FS.createDevice("/dev", "random", random_device);
                    FS.createDevice("/dev", "urandom", random_device);
                    FS.mkdir("/dev/shm");
                    FS.mkdir("/dev/shm/tmp")
                },
                createSpecialDirectories: function() {
                    FS.mkdir("/proc");
                    FS.mkdir("/proc/self");
                    FS.mkdir("/proc/self/fd");
                    FS.mount({
                        mount: function() {
                            var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                            node.node_ops = {
                                lookup: function(parent, name) {
                                    var fd = +name;
                                    var stream = FS.getStream(fd);
                                    if (!stream) throw new FS.ErrnoError(9);
                                    var ret = {
                                        parent: null,
                                        mount: {
                                            mountpoint: "fake"
                                        },
                                        node_ops: {
                                            readlink: function() {
                                                return stream.path
                                            }
                                        }
                                    };
                                    ret.parent = ret;
                                    return ret
                                }
                            };
                            return node
                        }
                    }, {}, "/proc/self/fd")
                },
                createStandardStreams: function() {
                    if (Module["stdin"]) {
                        FS.createDevice("/dev", "stdin", Module["stdin"])
                    } else {
                        FS.symlink("/dev/tty", "/dev/stdin")
                    }
                    if (Module["stdout"]) {
                        FS.createDevice("/dev", "stdout", null, Module["stdout"])
                    } else {
                        FS.symlink("/dev/tty", "/dev/stdout")
                    }
                    if (Module["stderr"]) {
                        FS.createDevice("/dev", "stderr", null, Module["stderr"])
                    } else {
                        FS.symlink("/dev/tty1", "/dev/stderr")
                    }
                    var stdin = FS.open("/dev/stdin", "r");
                    var stdout = FS.open("/dev/stdout", "w");
                    var stderr = FS.open("/dev/stderr", "w")
                },
                ensureErrnoError: function() {
                    if (FS.ErrnoError) return;
                    FS.ErrnoError = function ErrnoError(errno, node) {
                        this.node = node;
                        this.setErrno = function(errno) {
                            this.errno = errno
                        };
                        this.setErrno(errno);
                        this.message = "FS error";
                        if (this.stack) Object.defineProperty(this, "stack", {
                            value: (new Error).stack,
                            writable: true
                        })
                    };
                    FS.ErrnoError.prototype = new Error;
                    FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                    [2].forEach(function(code) {
                        FS.genericErrors[code] = new FS.ErrnoError(code);
                        FS.genericErrors[code].stack = "<generic error, no stack>"
                    })
                },
                staticInit: function() {
                    FS.ensureErrnoError();
                    FS.nameTable = new Array(4096);
                    FS.mount(MEMFS, {}, "/");
                    FS.createDefaultDirectories();
                    FS.createDefaultDevices();
                    FS.createSpecialDirectories();
                    FS.filesystems = {
                        "MEMFS": MEMFS,
                        "IDBFS": IDBFS,
                        "NODEFS": NODEFS,
                        "WORKERFS": WORKERFS
                    }
                },
                init: function(input, output, error) {
                    FS.init.initialized = true;
                    FS.ensureErrnoError();
                    Module["stdin"] = input || Module["stdin"];
                    Module["stdout"] = output || Module["stdout"];
                    Module["stderr"] = error || Module["stderr"];
                    FS.createStandardStreams()
                },
                quit: function() {
                    FS.init.initialized = false;
                    var fflush = Module["_fflush"];
                    if (fflush) fflush(0);
                    for (var i = 0; i < FS.streams.length; i++) {
                        var stream = FS.streams[i];
                        if (!stream) {
                            continue
                        }
                        FS.close(stream)
                    }
                },
                getMode: function(canRead, canWrite) {
                    var mode = 0;
                    if (canRead) mode |= 292 | 73;
                    if (canWrite) mode |= 146;
                    return mode
                },
                joinPath: function(parts, forceRelative) {
                    var path = PATH.join.apply(null, parts);
                    if (forceRelative && path[0] == "/") path = path.substr(1);
                    return path
                },
                absolutePath: function(relative, base) {
                    return PATH.resolve(base, relative)
                },
                standardizePath: function(path) {
                    return PATH.normalize(path)
                },
                findObject: function(path, dontResolveLastLink) {
                    var ret = FS.analyzePath(path, dontResolveLastLink);
                    if (ret.exists) {
                        return ret.object
                    } else {
                        ___setErrNo(ret.error);
                        return null
                    }
                },
                analyzePath: function(path, dontResolveLastLink) {
                    try {
                        var lookup = FS.lookupPath(path, {
                            follow: !dontResolveLastLink
                        });
                        path = lookup.path
                    } catch (e) {}
                    var ret = {
                        isRoot: false,
                        exists: false,
                        error: 0,
                        name: null,
                        path: null,
                        object: null,
                        parentExists: false,
                        parentPath: null,
                        parentObject: null
                    };
                    try {
                        var lookup = FS.lookupPath(path, {
                            parent: true
                        });
                        ret.parentExists = true;
                        ret.parentPath = lookup.path;
                        ret.parentObject = lookup.node;
                        ret.name = PATH.basename(path);
                        lookup = FS.lookupPath(path, {
                            follow: !dontResolveLastLink
                        });
                        ret.exists = true;
                        ret.path = lookup.path;
                        ret.object = lookup.node;
                        ret.name = lookup.node.name;
                        ret.isRoot = lookup.path === "/"
                    } catch (e) {
                        ret.error = e.errno
                    }
                    return ret
                },
                createFolder: function(parent, name, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(canRead, canWrite);
                    return FS.mkdir(path, mode)
                },
                createPath: function(parent, path, canRead, canWrite) {
                    parent = typeof parent === "string" ? parent : FS.getPath(parent);
                    var parts = path.split("/").reverse();
                    while (parts.length) {
                        var part = parts.pop();
                        if (!part) continue;
                        var current = PATH.join2(parent, part);
                        try {
                            FS.mkdir(current)
                        } catch (e) {}
                        parent = current
                    }
                    return current
                },
                createFile: function(parent, name, properties, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(canRead, canWrite);
                    return FS.create(path, mode)
                },
                createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
                    var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
                    var mode = FS.getMode(canRead, canWrite);
                    var node = FS.create(path, mode);
                    if (data) {
                        if (typeof data === "string") {
                            var arr = new Array(data.length);
                            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                            data = arr
                        }
                        FS.chmod(node, mode | 146);
                        var stream = FS.open(node, "w");
                        FS.write(stream, data, 0, data.length, 0, canOwn);
                        FS.close(stream);
                        FS.chmod(node, mode)
                    }
                    return node
                },
                createDevice: function(parent, name, input, output) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    var mode = FS.getMode(!!input, !!output);
                    if (!FS.createDevice.major) FS.createDevice.major = 64;
                    var dev = FS.makedev(FS.createDevice.major++, 0);
                    FS.registerDevice(dev, {
                        open: function(stream) {
                            stream.seekable = false
                        },
                        close: function(stream) {
                            if (output && output.buffer && output.buffer.length) {
                                output(10)
                            }
                        },
                        read: function(stream, buffer, offset, length, pos) {
                            var bytesRead = 0;
                            for (var i = 0; i < length; i++) {
                                var result;
                                try {
                                    result = input()
                                } catch (e) {
                                    throw new FS.ErrnoError(5)
                                }
                                if (result === undefined && bytesRead === 0) {
                                    throw new FS.ErrnoError(11)
                                }
                                if (result === null || result === undefined) break;
                                bytesRead++;
                                buffer[offset + i] = result
                            }
                            if (bytesRead) {
                                stream.node.timestamp = Date.now()
                            }
                            return bytesRead
                        },
                        write: function(stream, buffer, offset, length, pos) {
                            for (var i = 0; i < length; i++) {
                                try {
                                    output(buffer[offset + i])
                                } catch (e) {
                                    throw new FS.ErrnoError(5)
                                }
                            }
                            if (length) {
                                stream.node.timestamp = Date.now()
                            }
                            return i
                        }
                    });
                    return FS.mkdev(path, mode, dev)
                },
                createLink: function(parent, name, target, canRead, canWrite) {
                    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                    return FS.symlink(target, path)
                },
                forceLoadFile: function(obj) {
                    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
                    var success = true;
                    if (typeof XMLHttpRequest !== "undefined") {
                        throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
                    } else if (Module["read"]) {
                        try {
                            obj.contents = intArrayFromString(Module["read"](obj.url), true);
                            obj.usedBytes = obj.contents.length
                        } catch (e) {
                            success = false
                        }
                    } else {
                        throw new Error("Cannot load without read() or XMLHttpRequest.")
                    }
                    if (!success) ___setErrNo(5);
                    return success
                },
                createLazyFile: function(parent, name, url, canRead, canWrite) {
                    function LazyUint8Array() {
                        this.lengthKnown = false;
                        this.chunks = []
                    }

                    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                        if (idx > this.length - 1 || idx < 0) {
                            return undefined
                        }
                        var chunkOffset = idx % this.chunkSize;
                        var chunkNum = idx / this.chunkSize | 0;
                        return this.getter(chunkNum)[chunkOffset]
                    };
                    LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                        this.getter = getter
                    };
                    LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                        var xhr = new XMLHttpRequest;
                        xhr.open("HEAD", url, false);
                        xhr.send(null);
                        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                        var datalength = Number(xhr.getResponseHeader("Content-length"));
                        var header;
                        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                        var chunkSize = 1024 * 1024;
                        if (!hasByteServing) chunkSize = datalength;
                        var doXHR = function(from, to) {
                            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                            if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                            if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                            if (xhr.overrideMimeType) {
                                xhr.overrideMimeType("text/plain; charset=x-user-defined")
                            }
                            xhr.send(null);
                            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                            if (xhr.response !== undefined) {
                                return new Uint8Array(xhr.response || [])
                            } else {
                                return intArrayFromString(xhr.responseText || "", true)
                            }
                        };
                        var lazyArray = this;
                        lazyArray.setDataGetter(function(chunkNum) {
                            var start = chunkNum * chunkSize;
                            var end = (chunkNum + 1) * chunkSize - 1;
                            end = Math.min(end, datalength - 1);
                            if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                                lazyArray.chunks[chunkNum] = doXHR(start, end)
                            }
                            if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                            return lazyArray.chunks[chunkNum]
                        });
                        if (usesGzip || !datalength) {
                            chunkSize = datalength = 1;
                            datalength = this.getter(0).length;
                            chunkSize = datalength;
                            console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
                        }
                        this._length = datalength;
                        this._chunkSize = chunkSize;
                        this.lengthKnown = true
                    };
                    if (typeof XMLHttpRequest !== "undefined") {
                        if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                        var lazyArray = new LazyUint8Array;
                        Object.defineProperties(lazyArray, {
                            length: {
                                get: function() {
                                    if (!this.lengthKnown) {
                                        this.cacheLength()
                                    }
                                    return this._length
                                }
                            },
                            chunkSize: {
                                get: function() {
                                    if (!this.lengthKnown) {
                                        this.cacheLength()
                                    }
                                    return this._chunkSize
                                }
                            }
                        });
                        var properties = {
                            isDevice: false,
                            contents: lazyArray
                        }
                    } else {
                        var properties = {
                            isDevice: false,
                            url: url
                        }
                    }
                    var node = FS.createFile(parent, name, properties, canRead, canWrite);
                    if (properties.contents) {
                        node.contents = properties.contents
                    } else if (properties.url) {
                        node.contents = null;
                        node.url = properties.url
                    }
                    Object.defineProperties(node, {
                        usedBytes: {
                            get: function() {
                                return this.contents.length
                            }
                        }
                    });
                    var stream_ops = {};
                    var keys = Object.keys(node.stream_ops);
                    keys.forEach(function(key) {
                        var fn = node.stream_ops[key];
                        stream_ops[key] = function forceLoadLazyFile() {
                            if (!FS.forceLoadFile(node)) {
                                throw new FS.ErrnoError(5)
                            }
                            return fn.apply(null, arguments)
                        }
                    });
                    stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
                        if (!FS.forceLoadFile(node)) {
                            throw new FS.ErrnoError(5)
                        }
                        var contents = stream.node.contents;
                        if (position >= contents.length) return 0;
                        var size = Math.min(contents.length - position, length);
                        if (contents.slice) {
                            for (var i = 0; i < size; i++) {
                                buffer[offset + i] = contents[position + i]
                            }
                        } else {
                            for (var i = 0; i < size; i++) {
                                buffer[offset + i] = contents.get(position + i)
                            }
                        }
                        return size
                    };
                    node.stream_ops = stream_ops;
                    return node
                },
                createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
                    Browser.init();
                    var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
                    var dep = getUniqueRunDependency("cp " + fullname);

                    function processData(byteArray) {
                        function finish(byteArray) {
                            if (preFinish) preFinish();
                            if (!dontCreateFile) {
                                FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                            }
                            if (onload) onload();
                            removeRunDependency(dep)
                        }

                        var handled = false;
                        Module["preloadPlugins"].forEach(function(plugin) {
                            if (handled) return;
                            if (plugin["canHandle"](fullname)) {
                                plugin["handle"](byteArray, fullname, finish, function() {
                                    if (onerror) onerror();
                                    removeRunDependency(dep)
                                });
                                handled = true
                            }
                        });
                        if (!handled) finish(byteArray)
                    }

                    addRunDependency(dep);
                    if (typeof url == "string") {
                        Browser.asyncLoad(url, function(byteArray) {
                            processData(byteArray)
                        }, onerror)
                    } else {
                        processData(url)
                    }
                },
                indexedDB: function() {
                    return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
                },
                DB_NAME: function() {
                    return "EM_FS_" + window.location.pathname
                },
                DB_VERSION: 20,
                DB_STORE_NAME: "FILE_DATA",
                saveFilesToDB: function(paths, onload, onerror) {
                    onload = onload || function() {};
                    onerror = onerror || function() {};
                    var indexedDB = FS.indexedDB();
                    try {
                        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                    } catch (e) {
                        return onerror(e)
                    }
                    openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
                        console.log("creating db");
                        var db = openRequest.result;
                        db.createObjectStore(FS.DB_STORE_NAME)
                    };
                    openRequest.onsuccess = function openRequest_onsuccess() {
                        var db = openRequest.result;
                        var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                        var files = transaction.objectStore(FS.DB_STORE_NAME);
                        var ok = 0,
                            fail = 0,
                            total = paths.length;

                        function finish() {
                            if (fail == 0) onload();
                            else onerror()
                        }

                        paths.forEach(function(path) {
                            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                            putRequest.onsuccess = function putRequest_onsuccess() {
                                ok++;
                                if (ok + fail == total) finish()
                            };
                            putRequest.onerror = function putRequest_onerror() {
                                fail++;
                                if (ok + fail == total) finish()
                            }
                        });
                        transaction.onerror = onerror
                    };
                    openRequest.onerror = onerror
                },
                loadFilesFromDB: function(paths, onload, onerror) {
                    onload = onload || function() {};
                    onerror = onerror || function() {};
                    var indexedDB = FS.indexedDB();
                    try {
                        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                    } catch (e) {
                        return onerror(e)
                    }
                    openRequest.onupgradeneeded = onerror;
                    openRequest.onsuccess = function openRequest_onsuccess() {
                        var db = openRequest.result;
                        try {
                            var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
                        } catch (e) {
                            onerror(e);
                            return
                        }
                        var files = transaction.objectStore(FS.DB_STORE_NAME);
                        var ok = 0,
                            fail = 0,
                            total = paths.length;

                        function finish() {
                            if (fail == 0) onload();
                            else onerror()
                        }

                        paths.forEach(function(path) {
                            var getRequest = files.get(path);
                            getRequest.onsuccess = function getRequest_onsuccess() {
                                if (FS.analyzePath(path).exists) {
                                    FS.unlink(path)
                                }
                                FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                                ok++;
                                if (ok + fail == total) finish()
                            };
                            getRequest.onerror = function getRequest_onerror() {
                                fail++;
                                if (ok + fail == total) finish()
                            }
                        });
                        transaction.onerror = onerror
                    };
                    openRequest.onerror = onerror
                }
            };
            var ERRNO_CODES = {
                EPERM: 1,
                ENOENT: 2,
                ESRCH: 3,
                EINTR: 4,
                EIO: 5,
                ENXIO: 6,
                E2BIG: 7,
                ENOEXEC: 8,
                EBADF: 9,
                ECHILD: 10,
                EAGAIN: 11,
                EWOULDBLOCK: 11,
                ENOMEM: 12,
                EACCES: 13,
                EFAULT: 14,
                ENOTBLK: 15,
                EBUSY: 16,
                EEXIST: 17,
                EXDEV: 18,
                ENODEV: 19,
                ENOTDIR: 20,
                EISDIR: 21,
                EINVAL: 22,
                ENFILE: 23,
                EMFILE: 24,
                ENOTTY: 25,
                ETXTBSY: 26,
                EFBIG: 27,
                ENOSPC: 28,
                ESPIPE: 29,
                EROFS: 30,
                EMLINK: 31,
                EPIPE: 32,
                EDOM: 33,
                ERANGE: 34,
                ENOMSG: 42,
                EIDRM: 43,
                ECHRNG: 44,
                EL2NSYNC: 45,
                EL3HLT: 46,
                EL3RST: 47,
                ELNRNG: 48,
                EUNATCH: 49,
                ENOCSI: 50,
                EL2HLT: 51,
                EDEADLK: 35,
                ENOLCK: 37,
                EBADE: 52,
                EBADR: 53,
                EXFULL: 54,
                ENOANO: 55,
                EBADRQC: 56,
                EBADSLT: 57,
                EDEADLOCK: 35,
                EBFONT: 59,
                ENOSTR: 60,
                ENODATA: 61,
                ETIME: 62,
                ENOSR: 63,
                ENONET: 64,
                ENOPKG: 65,
                EREMOTE: 66,
                ENOLINK: 67,
                EADV: 68,
                ESRMNT: 69,
                ECOMM: 70,
                EPROTO: 71,
                EMULTIHOP: 72,
                EDOTDOT: 73,
                EBADMSG: 74,
                ENOTUNIQ: 76,
                EBADFD: 77,
                EREMCHG: 78,
                ELIBACC: 79,
                ELIBBAD: 80,
                ELIBSCN: 81,
                ELIBMAX: 82,
                ELIBEXEC: 83,
                ENOSYS: 38,
                ENOTEMPTY: 39,
                ENAMETOOLONG: 36,
                ELOOP: 40,
                EOPNOTSUPP: 95,
                EPFNOSUPPORT: 96,
                ECONNRESET: 104,
                ENOBUFS: 105,
                EAFNOSUPPORT: 97,
                EPROTOTYPE: 91,
                ENOTSOCK: 88,
                ENOPROTOOPT: 92,
                ESHUTDOWN: 108,
                ECONNREFUSED: 111,
                EADDRINUSE: 98,
                ECONNABORTED: 103,
                ENETUNREACH: 101,
                ENETDOWN: 100,
                ETIMEDOUT: 110,
                EHOSTDOWN: 112,
                EHOSTUNREACH: 113,
                EINPROGRESS: 115,
                EALREADY: 114,
                EDESTADDRREQ: 89,
                EMSGSIZE: 90,
                EPROTONOSUPPORT: 93,
                ESOCKTNOSUPPORT: 94,
                EADDRNOTAVAIL: 99,
                ENETRESET: 102,
                EISCONN: 106,
                ENOTCONN: 107,
                ETOOMANYREFS: 109,
                EUSERS: 87,
                EDQUOT: 122,
                ESTALE: 116,
                ENOTSUP: 95,
                ENOMEDIUM: 123,
                EILSEQ: 84,
                EOVERFLOW: 75,
                ECANCELED: 125,
                ENOTRECOVERABLE: 131,
                EOWNERDEAD: 130,
                ESTRPIPE: 86
            };
            var SYSCALLS = {
                DEFAULT_POLLMASK: 5,
                mappings: {},
                umask: 511,
                calculateAt: function(dirfd, path) {
                    if (path[0] !== "/") {
                        var dir;
                        if (dirfd === -100) {
                            dir = FS.cwd()
                        } else {
                            var dirstream = FS.getStream(dirfd);
                            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                            dir = dirstream.path
                        }
                        path = PATH.join2(dir, path)
                    }
                    return path
                },
                doStat: function(func, path, buf) {
                    try {
                        var stat = func(path)
                    } catch (e) {
                        if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                            return -ERRNO_CODES.ENOTDIR
                        }
                        throw e
                    }
                    HEAP32[buf >> 2] = stat.dev;
                    HEAP32[buf + 4 >> 2] = 0;
                    HEAP32[buf + 8 >> 2] = stat.ino;
                    HEAP32[buf + 12 >> 2] = stat.mode;
                    HEAP32[buf + 16 >> 2] = stat.nlink;
                    HEAP32[buf + 20 >> 2] = stat.uid;
                    HEAP32[buf + 24 >> 2] = stat.gid;
                    HEAP32[buf + 28 >> 2] = stat.rdev;
                    HEAP32[buf + 32 >> 2] = 0;
                    HEAP32[buf + 36 >> 2] = stat.size;
                    HEAP32[buf + 40 >> 2] = 4096;
                    HEAP32[buf + 44 >> 2] = stat.blocks;
                    HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
                    HEAP32[buf + 52 >> 2] = 0;
                    HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
                    HEAP32[buf + 60 >> 2] = 0;
                    HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
                    HEAP32[buf + 68 >> 2] = 0;
                    HEAP32[buf + 72 >> 2] = stat.ino;
                    return 0
                },
                doMsync: function(addr, stream, len, flags) {
                    var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
                    FS.msync(stream, buffer, 0, len, flags)
                },
                doMkdir: function(path, mode) {
                    path = PATH.normalize(path);
                    if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
                    FS.mkdir(path, mode, 0);
                    return 0
                },
                doMknod: function(path, mode, dev) {
                    switch (mode & 61440) {
                        case 32768:
                        case 8192:
                        case 24576:
                        case 4096:
                        case 49152:
                            break;
                        default:
                            return -ERRNO_CODES.EINVAL
                    }
                    FS.mknod(path, mode, dev);
                    return 0
                },
                doReadlink: function(path, buf, bufsize) {
                    if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
                    var ret = FS.readlink(path);
                    var len = Math.min(bufsize, lengthBytesUTF8(ret));
                    var endChar = HEAP8[buf + len];
                    stringToUTF8(ret, buf, bufsize + 1);
                    HEAP8[buf + len] = endChar;
                    return len
                },
                doAccess: function(path, amode) {
                    if (amode & ~7) {
                        return -ERRNO_CODES.EINVAL
                    }
                    var node;
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    node = lookup.node;
                    var perms = "";
                    if (amode & 4) perms += "r";
                    if (amode & 2) perms += "w";
                    if (amode & 1) perms += "x";
                    if (perms && FS.nodePermissions(node, perms)) {
                        return -ERRNO_CODES.EACCES
                    }
                    return 0
                },
                doDup: function(path, flags, suggestFD) {
                    var suggest = FS.getStream(suggestFD);
                    if (suggest) FS.close(suggest);
                    return FS.open(path, flags, 0, suggestFD, suggestFD).fd
                },
                doReadv: function(stream, iov, iovcnt, offset) {
                    var ret = 0;
                    for (var i = 0; i < iovcnt; i++) {
                        var ptr = HEAP32[iov + i * 8 >> 2];
                        var len = HEAP32[iov + (i * 8 + 4) >> 2];
                        var curr = FS.read(stream, HEAP8, ptr, len, offset);
                        if (curr < 0) return -1;
                        ret += curr;
                        if (curr < len) break
                    }
                    return ret
                },
                doWritev: function(stream, iov, iovcnt, offset) {
                    var ret = 0;
                    for (var i = 0; i < iovcnt; i++) {
                        var ptr = HEAP32[iov + i * 8 >> 2];
                        var len = HEAP32[iov + (i * 8 + 4) >> 2];
                        var curr = FS.write(stream, HEAP8, ptr, len, offset);
                        if (curr < 0) return -1;
                        ret += curr
                    }
                    return ret
                },
                varargs: 0,
                get: function(varargs) {
                    SYSCALLS.varargs += 4;
                    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                    return ret
                },
                getStr: function() {
                    var ret = UTF8ToString(SYSCALLS.get());
                    return ret
                },
                getStreamFromFD: function() {
                    var stream = FS.getStream(SYSCALLS.get());
                    if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                    return stream
                },
                getSocketFromFD: function() {
                    var socket = SOCKFS.getSocket(SYSCALLS.get());
                    if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                    return socket
                },
                getSocketAddress: function(allowNull) {
                    var addrp = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    if (allowNull && addrp === 0) return null;
                    var info = __read_sockaddr(addrp, addrlen);
                    if (info.errno) throw new FS.ErrnoError(info.errno);
                    info.addr = DNS.lookup_addr(info.addr) || info.addr;
                    return info
                },
                get64: function() {
                    var low = SYSCALLS.get(),
                        high = SYSCALLS.get();
                    return low
                },
                getZero: function() {
                    SYSCALLS.get()
                }
            };

            function ___syscall140(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD(),
                        offset_high = SYSCALLS.get(),
                        offset_low = SYSCALLS.get(),
                        result = SYSCALLS.get(),
                        whence = SYSCALLS.get();
                    var offset = offset_low;
                    FS.llseek(stream, offset, whence);
                    HEAP32[result >> 2] = stream.position;
                    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall145(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD(),
                        iov = SYSCALLS.get(),
                        iovcnt = SYSCALLS.get();
                    return SYSCALLS.doReadv(stream, iov, iovcnt)
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall146(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD(),
                        iov = SYSCALLS.get(),
                        iovcnt = SYSCALLS.get();
                    return SYSCALLS.doWritev(stream, iov, iovcnt)
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall221(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD(),
                        cmd = SYSCALLS.get();
                    switch (cmd) {
                        case 0:
                            {
                                var arg = SYSCALLS.get();
                                if (arg < 0) {
                                    return -ERRNO_CODES.EINVAL
                                }
                                var newStream;
                                newStream = FS.open(stream.path, stream.flags, 0, arg);
                                return newStream.fd
                            }
                        case 1:
                        case 2:
                            return 0;
                        case 3:
                            return stream.flags;
                        case 4:
                            {
                                var arg = SYSCALLS.get();
                                stream.flags |= arg;
                                return 0
                            }
                        case 12:
                            {
                                var arg = SYSCALLS.get();
                                var offset = 0;
                                HEAP16[arg + offset >> 1] = 2;
                                return 0
                            }
                        case 13:
                        case 14:
                            return 0;
                        case 16:
                        case 8:
                            return -ERRNO_CODES.EINVAL;
                        case 9:
                            ___setErrNo(ERRNO_CODES.EINVAL);
                            return -1;
                        default:
                            {
                                return -ERRNO_CODES.EINVAL
                            }
                    }
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall5(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var pathname = SYSCALLS.getStr(),
                        flags = SYSCALLS.get(),
                        mode = SYSCALLS.get();
                    var stream = FS.open(pathname, flags, mode);
                    return stream.fd
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall54(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD(),
                        op = SYSCALLS.get();
                    switch (op) {
                        case 21509:
                        case 21505:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                return 0
                            }
                        case 21510:
                        case 21511:
                        case 21512:
                        case 21506:
                        case 21507:
                        case 21508:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                return 0
                            }
                        case 21519:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                var argp = SYSCALLS.get();
                                HEAP32[argp >> 2] = 0;
                                return 0
                            }
                        case 21520:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                return -ERRNO_CODES.EINVAL
                            }
                        case 21531:
                            {
                                var argp = SYSCALLS.get();
                                return FS.ioctl(stream, op, argp)
                            }
                        case 21523:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                return 0
                            }
                        case 21524:
                            {
                                if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                                return 0
                            }
                        default:
                            abort("bad ioctl syscall " + op)
                    }
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___syscall6(which, varargs) {
                SYSCALLS.varargs = varargs;
                try {
                    var stream = SYSCALLS.getStreamFromFD();
                    FS.close(stream);
                    return 0
                } catch (e) {
                    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                    return -e.errno
                }
            }

            function ___unlock() {}

            function _emscripten_get_now() {
                abort()
            }

            function _emscripten_get_now_is_monotonic() {
                return 0 || ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]
            }

            function _clock_gettime(clk_id, tp) {
                var now;
                if (clk_id === 0) {
                    now = Date.now()
                } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
                    now = _emscripten_get_now()
                } else {
                    ___setErrNo(22);
                    return -1
                }
                HEAP32[tp >> 2] = now / 1e3 | 0;
                HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
                return 0
            }

            function _dlopen() {
                abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
            }

            function _dlclose() {
                return _dlopen.apply(null, arguments)
            }

            function _dlerror() {
                return _dlopen.apply(null, arguments)
            }

            function _dlsym() {
                return _dlopen.apply(null, arguments)
            }

            function _emscripten_set_main_loop_timing(mode, value) {
                Browser.mainLoop.timingMode = mode;
                Browser.mainLoop.timingValue = value;
                if (!Browser.mainLoop.func) {
                    return 1
                }
                if (mode == 0) {
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
                        var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
                        setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
                    };
                    Browser.mainLoop.method = "timeout"
                } else if (mode == 1) {
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
                        Browser.requestAnimationFrame(Browser.mainLoop.runner)
                    };
                    Browser.mainLoop.method = "rAF"
                } else if (mode == 2) {
                    if (typeof setImmediate === "undefined") {
                        var setImmediates = [];
                        var emscriptenMainLoopMessageId = "setimmediate";
                        var Browser_setImmediate_messageHandler = function(event) {
                            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                                event.stopPropagation();
                                setImmediates.shift()()
                            }
                        };
                        addEventListener("message", Browser_setImmediate_messageHandler, true);
                        setImmediate = function Browser_emulated_setImmediate(func) {
                            setImmediates.push(func);
                            if (ENVIRONMENT_IS_WORKER) {
                                if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
                                Module["setImmediates"].push(func);
                                postMessage({
                                    target: emscriptenMainLoopMessageId
                                })
                            } else postMessage(emscriptenMainLoopMessageId, "*")
                        }
                    }
                    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
                        setImmediate(Browser.mainLoop.runner)
                    };
                    Browser.mainLoop.method = "immediate"
                }
                return 0
            }

            function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
                Module["noExitRuntime"] = true;
                assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
                Browser.mainLoop.func = func;
                Browser.mainLoop.arg = arg;
                var browserIterationFunc;
                if (typeof arg !== "undefined") {
                    browserIterationFunc = function() {
                        Module["dynCall_vi"](func, arg)
                    }
                } else {
                    browserIterationFunc = function() {
                        Module["dynCall_v"](func)
                    }
                }
                var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
                Browser.mainLoop.runner = function Browser_mainLoop_runner() {
                    if (ABORT) return;
                    if (Browser.mainLoop.queue.length > 0) {
                        var start = Date.now();
                        var blocker = Browser.mainLoop.queue.shift();
                        blocker.func(blocker.arg);
                        if (Browser.mainLoop.remainingBlockers) {
                            var remaining = Browser.mainLoop.remainingBlockers;
                            var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                            if (blocker.counted) {
                                Browser.mainLoop.remainingBlockers = next
                            } else {
                                next = next + .5;
                                Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                            }
                        }
                        console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
                        Browser.mainLoop.updateStatus();
                        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
                        setTimeout(Browser.mainLoop.runner, 0);
                        return
                    }
                    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
                    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
                    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
                        Browser.mainLoop.scheduler();
                        return
                    } else if (Browser.mainLoop.timingMode == 0) {
                        Browser.mainLoop.tickStartTime = _emscripten_get_now()
                    }
                    if (Browser.mainLoop.method === "timeout" && Module.ctx) {
                        err("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
                        Browser.mainLoop.method = ""
                    }
                    Browser.mainLoop.runIter(browserIterationFunc);
                    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
                    if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
                    Browser.mainLoop.scheduler()
                };
                if (!noSetTiming) {
                    if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);
                    else _emscripten_set_main_loop_timing(1, 1);
                    Browser.mainLoop.scheduler()
                }
                if (simulateInfiniteLoop) {
                    throw "SimulateInfiniteLoop"
                }
            }

            var Browser = {
                mainLoop: {
                    scheduler: null,
                    method: "",
                    currentlyRunningMainloop: 0,
                    func: null,
                    arg: 0,
                    timingMode: 0,
                    timingValue: 0,
                    currentFrameNumber: 0,
                    queue: [],
                    pause: function() {
                        Browser.mainLoop.scheduler = null;
                        Browser.mainLoop.currentlyRunningMainloop++
                    },
                    resume: function() {
                        Browser.mainLoop.currentlyRunningMainloop++;
                        var timingMode = Browser.mainLoop.timingMode;
                        var timingValue = Browser.mainLoop.timingValue;
                        var func = Browser.mainLoop.func;
                        Browser.mainLoop.func = null;
                        _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
                        _emscripten_set_main_loop_timing(timingMode, timingValue);
                        Browser.mainLoop.scheduler()
                    },
                    updateStatus: function() {
                        if (Module["setStatus"]) {
                            var message = Module["statusMessage"] || "Please wait...";
                            var remaining = Browser.mainLoop.remainingBlockers;
                            var expected = Browser.mainLoop.expectedBlockers;
                            if (remaining) {
                                if (remaining < expected) {
                                    Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                                } else {
                                    Module["setStatus"](message)
                                }
                            } else {
                                Module["setStatus"]("")
                            }
                        }
                    },
                    runIter: function(func) {
                        if (ABORT) return;
                        if (Module["preMainLoop"]) {
                            var preRet = Module["preMainLoop"]();
                            if (preRet === false) {
                                return
                            }
                        }
                        try {
                            func()
                        } catch (e) {
                            if (e instanceof ExitStatus) {
                                return
                            } else {
                                if (e && typeof e === "object" && e.stack) err("exception thrown: " + [e, e.stack]);
                                throw e
                            }
                        }
                        if (Module["postMainLoop"]) Module["postMainLoop"]()
                    }
                },
                isFullscreen: false,
                pointerLock: false,
                moduleContextCreatedCallbacks: [],
                workers: [],
                init: function() {
                    if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
                    if (Browser.initted) return;
                    Browser.initted = true;
                    try {
                        new Blob;
                        Browser.hasBlobConstructor = true
                    } catch (e) {
                        Browser.hasBlobConstructor = false;
                        console.log("warning: no blob constructor, cannot create blobs with mimetypes")
                    }
                    Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
                    Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
                    if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
                        console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
                        Module.noImageDecoding = true
                    }
                    var imagePlugin = {};
                    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
                        return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
                    };
                    imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
                        var b = null;
                        if (Browser.hasBlobConstructor) {
                            try {
                                b = new Blob([byteArray], {
                                    type: Browser.getMimetype(name)
                                });
                                if (b.size !== byteArray.length) {
                                    b = new Blob([new Uint8Array(byteArray).buffer], {
                                        type: Browser.getMimetype(name)
                                    })
                                }
                            } catch (e) {
                                warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
                            }
                        }
                        if (!b) {
                            var bb = new Browser.BlobBuilder;
                            bb.append(new Uint8Array(byteArray).buffer);
                            b = bb.getBlob()
                        }
                        var url = Browser.URLObject.createObjectURL(b);
                        var img = new Image;
                        img.onload = function img_onload() {
                            assert(img.complete, "Image " + name + " could not be decoded");
                            var canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            Module["preloadedImages"][name] = canvas;
                            Browser.URLObject.revokeObjectURL(url);
                            if (onload) onload(byteArray)
                        };
                        img.onerror = function img_onerror(event) {
                            console.log("Image " + url + " could not be decoded");
                            if (onerror) onerror()
                        };
                        img.src = url
                    };
                    Module["preloadPlugins"].push(imagePlugin);
                    var audioPlugin = {};
                    audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
                        return !Module.noAudioDecoding && name.substr(-4) in {
                            ".ogg": 1,
                            ".wav": 1,
                            ".mp3": 1
                        }
                    };
                    audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
                        var done = false;

                        function finish(audio) {
                            if (done) return;
                            done = true;
                            Module["preloadedAudios"][name] = audio;
                            if (onload) onload(byteArray)
                        }

                        function fail() {
                            if (done) return;
                            done = true;
                            Module["preloadedAudios"][name] = new Audio;
                            if (onerror) onerror()
                        }

                        if (Browser.hasBlobConstructor) {
                            try {
                                var b = new Blob([byteArray], {
                                    type: Browser.getMimetype(name)
                                })
                            } catch (e) {
                                return fail()
                            }
                            var url = Browser.URLObject.createObjectURL(b);
                            var audio = new Audio;
                            audio.addEventListener("canplaythrough", function() {
                                finish(audio)
                            }, false);
                            audio.onerror = function audio_onerror(event) {
                                if (done) return;
                                console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");

                                function encode64(data) {
                                    var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                                    var PAD = "=";
                                    var ret = "";
                                    var leftchar = 0;
                                    var leftbits = 0;
                                    for (var i = 0; i < data.length; i++) {
                                        leftchar = leftchar << 8 | data[i];
                                        leftbits += 8;
                                        while (leftbits >= 6) {
                                            var curr = leftchar >> leftbits - 6 & 63;
                                            leftbits -= 6;
                                            ret += BASE[curr]
                                        }
                                    }
                                    if (leftbits == 2) {
                                        ret += BASE[(leftchar & 3) << 4];
                                        ret += PAD + PAD
                                    } else if (leftbits == 4) {
                                        ret += BASE[(leftchar & 15) << 2];
                                        ret += PAD
                                    }
                                    return ret
                                }

                                audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                                finish(audio)
                            };
                            audio.src = url;
                            Browser.safeSetTimeout(function() {
                                finish(audio)
                            }, 1e4)
                        } else {
                            return fail()
                        }
                    };
                    Module["preloadPlugins"].push(audioPlugin);

                    function pointerLockChange() {
                        Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
                    }

                    var canvas = Module["canvas"];
                    if (canvas) {
                        canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {};
                        canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {};
                        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
                        document.addEventListener("pointerlockchange", pointerLockChange, false);
                        document.addEventListener("mozpointerlockchange", pointerLockChange, false);
                        document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
                        document.addEventListener("mspointerlockchange", pointerLockChange, false);
                        if (Module["elementPointerLock"]) {
                            canvas.addEventListener("click", function(ev) {
                                if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                                    Module["canvas"].requestPointerLock();
                                    ev.preventDefault()
                                }
                            }, false)
                        }
                    }
                },
                createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
                    if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
                    var ctx;
                    var contextHandle;
                    if (useWebGL) {
                        var contextAttributes = {
                            antialias: false,
                            alpha: false,
                            majorVersion: 1
                        };
                        if (webGLContextAttributes) {
                            for (var attribute in webGLContextAttributes) {
                                contextAttributes[attribute] = webGLContextAttributes[attribute]
                            }
                        }
                        if (typeof GL !== "undefined") {
                            contextHandle = GL.createContext(canvas, contextAttributes);
                            if (contextHandle) {
                                ctx = GL.getContext(contextHandle).GLctx
                            }
                        }
                    } else {
                        ctx = canvas.getContext("2d")
                    }
                    if (!ctx) return null;
                    if (setInModule) {
                        if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
                        Module.ctx = ctx;
                        if (useWebGL) GL.makeContextCurrent(contextHandle);
                        Module.useWebGL = useWebGL;
                        Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
                            callback()
                        });
                        Browser.init()
                    }
                    return ctx
                },
                destroyContext: function(canvas, useWebGL, setInModule) {},
                fullscreenHandlersInstalled: false,
                lockPointer: undefined,
                resizeCanvas: undefined,
                requestFullscreen: function(lockPointer, resizeCanvas, vrDevice) {
                    Browser.lockPointer = lockPointer;
                    Browser.resizeCanvas = resizeCanvas;
                    Browser.vrDevice = vrDevice;
                    if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
                    if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
                    if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
                    var canvas = Module["canvas"];

                    function fullscreenChange() {
                        Browser.isFullscreen = false;
                        var canvasContainer = canvas.parentNode;
                        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                            canvas.exitFullscreen = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {};
                            canvas.exitFullscreen = canvas.exitFullscreen.bind(document);
                            if (Browser.lockPointer) canvas.requestPointerLock();
                            Browser.isFullscreen = true;
                            if (Browser.resizeCanvas) {
                                Browser.setFullscreenCanvasSize()
                            } else {
                                Browser.updateCanvasDimensions(canvas)
                            }
                        } else {
                            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                            canvasContainer.parentNode.removeChild(canvasContainer);
                            if (Browser.resizeCanvas) {
                                Browser.setWindowedCanvasSize()
                            } else {
                                Browser.updateCanvasDimensions(canvas)
                            }
                        }
                        if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
                        if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen)
                    }

                    if (!Browser.fullscreenHandlersInstalled) {
                        Browser.fullscreenHandlersInstalled = true;
                        document.addEventListener("fullscreenchange", fullscreenChange, false);
                        document.addEventListener("mozfullscreenchange", fullscreenChange, false);
                        document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
                        document.addEventListener("MSFullscreenChange", fullscreenChange, false)
                    }
                    var canvasContainer = document.createElement("div");
                    canvas.parentNode.insertBefore(canvasContainer, canvas);
                    canvasContainer.appendChild(canvas);
                    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
                        canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"])
                    } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
                        canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"])
                    } : null);
                    if (vrDevice) {
                        canvasContainer.requestFullscreen({
                            vrDisplay: vrDevice
                        })
                    } else {
                        canvasContainer.requestFullscreen()
                    }
                },
                requestFullScreen: function(lockPointer, resizeCanvas, vrDevice) {
                    err("Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.");
                    Browser.requestFullScreen = function(lockPointer, resizeCanvas, vrDevice) {
                        return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
                    };
                    return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
                },
                nextRAF: 0,
                fakeRequestAnimationFrame: function(func) {
                    var now = Date.now();
                    if (Browser.nextRAF === 0) {
                        Browser.nextRAF = now + 1e3 / 60
                    } else {
                        while (now + 2 >= Browser.nextRAF) {
                            Browser.nextRAF += 1e3 / 60
                        }
                    }
                    var delay = Math.max(Browser.nextRAF - now, 0);
                    setTimeout(func, delay)
                },
                requestAnimationFrame: function requestAnimationFrame(func) {
                    if (typeof window === "undefined") {
                        Browser.fakeRequestAnimationFrame(func)
                    } else {
                        if (!window.requestAnimationFrame) {
                            window.requestAnimationFrame = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || Browser.fakeRequestAnimationFrame
                        }
                        window.requestAnimationFrame(func)
                    }
                },
                safeCallback: function(func) {
                    return function() {
                        if (!ABORT) return func.apply(null, arguments)
                    }
                },
                allowAsyncCallbacks: true,
                queuedAsyncCallbacks: [],
                pauseAsyncCallbacks: function() {
                    Browser.allowAsyncCallbacks = false
                },
                resumeAsyncCallbacks: function() {
                    Browser.allowAsyncCallbacks = true;
                    if (Browser.queuedAsyncCallbacks.length > 0) {
                        var callbacks = Browser.queuedAsyncCallbacks;
                        Browser.queuedAsyncCallbacks = [];
                        callbacks.forEach(function(func) {
                            func()
                        })
                    }
                },
                safeRequestAnimationFrame: function(func) {
                    return Browser.requestAnimationFrame(function() {
                        if (ABORT) return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        } else {
                            Browser.queuedAsyncCallbacks.push(func)
                        }
                    })
                },
                safeSetTimeout: function(func, timeout) {
                    Module["noExitRuntime"] = true;
                    return setTimeout(function() {
                        if (ABORT) return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        } else {
                            Browser.queuedAsyncCallbacks.push(func)
                        }
                    }, timeout)
                },
                safeSetInterval: function(func, timeout) {
                    Module["noExitRuntime"] = true;
                    return setInterval(function() {
                        if (ABORT) return;
                        if (Browser.allowAsyncCallbacks) {
                            func()
                        }
                    }, timeout)
                },
                getMimetype: function(name) {
                    return {
                        "jpg": "image/jpeg",
                        "jpeg": "image/jpeg",
                        "png": "image/png",
                        "bmp": "image/bmp",
                        "ogg": "audio/ogg",
                        "wav": "audio/wav",
                        "mp3": "audio/mpeg"
                    }[name.substr(name.lastIndexOf(".") + 1)]
                },
                getUserMedia: function(func) {
                    if (!window.getUserMedia) {
                        window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
                    }
                    window.getUserMedia(func)
                },
                getMovementX: function(event) {
                    return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
                },
                getMovementY: function(event) {
                    return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
                },
                getMouseWheelDelta: function(event) {
                    var delta = 0;
                    switch (event.type) {
                        case "DOMMouseScroll":
                            delta = event.detail / 3;
                            break;
                        case "mousewheel":
                            delta = event.wheelDelta / 120;
                            break;
                        case "wheel":
                            delta = event.deltaY;
                            switch (event.deltaMode) {
                                case 0:
                                    delta /= 100;
                                    break;
                                case 1:
                                    delta /= 3;
                                    break;
                                case 2:
                                    delta *= 80;
                                    break;
                                default:
                                    throw "unrecognized mouse wheel delta mode: " + event.deltaMode
                            }
                            break;
                        default:
                            throw "unrecognized mouse wheel event: " + event.type
                    }
                    return delta
                },
                mouseX: 0,
                mouseY: 0,
                mouseMovementX: 0,
                mouseMovementY: 0,
                touches: {},
                lastTouches: {},
                calculateMouseEvent: function(event) {
                    if (Browser.pointerLock) {
                        if (event.type != "mousemove" && "mozMovementX" in event) {
                            Browser.mouseMovementX = Browser.mouseMovementY = 0
                        } else {
                            Browser.mouseMovementX = Browser.getMovementX(event);
                            Browser.mouseMovementY = Browser.getMovementY(event)
                        }
                        if (typeof SDL != "undefined") {
                            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
                        } else {
                            Browser.mouseX += Browser.mouseMovementX;
                            Browser.mouseY += Browser.mouseMovementY
                        }
                    } else {
                        var rect = Module["canvas"].getBoundingClientRect();
                        var cw = Module["canvas"].width;
                        var ch = Module["canvas"].height;
                        var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
                        var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
                        if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                            var touch = event.touch;
                            if (touch === undefined) {
                                return
                            }
                            var adjustedX = touch.pageX - (scrollX + rect.left);
                            var adjustedY = touch.pageY - (scrollY + rect.top);
                            adjustedX = adjustedX * (cw / rect.width);
                            adjustedY = adjustedY * (ch / rect.height);
                            var coords = {
                                x: adjustedX,
                                y: adjustedY
                            };
                            if (event.type === "touchstart") {
                                Browser.lastTouches[touch.identifier] = coords;
                                Browser.touches[touch.identifier] = coords
                            } else if (event.type === "touchend" || event.type === "touchmove") {
                                var last = Browser.touches[touch.identifier];
                                if (!last) last = coords;
                                Browser.lastTouches[touch.identifier] = last;
                                Browser.touches[touch.identifier] = coords
                            }
                            return
                        }
                        var x = event.pageX - (scrollX + rect.left);
                        var y = event.pageY - (scrollY + rect.top);
                        x = x * (cw / rect.width);
                        y = y * (ch / rect.height);
                        Browser.mouseMovementX = x - Browser.mouseX;
                        Browser.mouseMovementY = y - Browser.mouseY;
                        Browser.mouseX = x;
                        Browser.mouseY = y
                    }
                },
                asyncLoad: function(url, onload, onerror, noRunDep) {
                    var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
                    Module["readAsync"](url, function(arrayBuffer) {
                        assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
                        onload(new Uint8Array(arrayBuffer));
                        if (dep) removeRunDependency(dep)
                    }, function(event) {
                        if (onerror) {
                            onerror()
                        } else {
                            throw 'Loading data file "' + url + '" failed.'
                        }
                    });
                    if (dep) addRunDependency(dep)
                },
                resizeListeners: [],
                updateResizeListeners: function() {
                    var canvas = Module["canvas"];
                    Browser.resizeListeners.forEach(function(listener) {
                        listener(canvas.width, canvas.height)
                    })
                },
                setCanvasSize: function(width, height, noUpdates) {
                    var canvas = Module["canvas"];
                    Browser.updateCanvasDimensions(canvas, width, height);
                    if (!noUpdates) Browser.updateResizeListeners()
                },
                windowedWidth: 0,
                windowedHeight: 0,
                setFullscreenCanvasSize: function() {
                    if (typeof SDL != "undefined") {
                        var flags = HEAPU32[SDL.screen >> 2];
                        flags = flags | 8388608;
                        HEAP32[SDL.screen >> 2] = flags
                    }
                    Browser.updateCanvasDimensions(Module["canvas"]);
                    Browser.updateResizeListeners()
                },
                setWindowedCanvasSize: function() {
                    if (typeof SDL != "undefined") {
                        var flags = HEAPU32[SDL.screen >> 2];
                        flags = flags & ~8388608;
                        HEAP32[SDL.screen >> 2] = flags
                    }
                    Browser.updateCanvasDimensions(Module["canvas"]);
                    Browser.updateResizeListeners()
                },
                updateCanvasDimensions: function(canvas, wNative, hNative) {
                    if (wNative && hNative) {
                        canvas.widthNative = wNative;
                        canvas.heightNative = hNative
                    } else {
                        wNative = canvas.widthNative;
                        hNative = canvas.heightNative
                    }
                    var w = wNative;
                    var h = hNative;
                    if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
                        if (w / h < Module["forcedAspectRatio"]) {
                            w = Math.round(h * Module["forcedAspectRatio"])
                        } else {
                            h = Math.round(w / Module["forcedAspectRatio"])
                        }
                    }
                    if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
                        var factor = Math.min(screen.width / w, screen.height / h);
                        w = Math.round(w * factor);
                        h = Math.round(h * factor)
                    }
                    if (Browser.resizeCanvas) {
                        if (canvas.width != w) canvas.width = w;
                        if (canvas.height != h) canvas.height = h;
                        if (typeof canvas.style != "undefined") {
                            canvas.style.removeProperty("width");
                            canvas.style.removeProperty("height")
                        }
                    } else {
                        if (canvas.width != wNative) canvas.width = wNative;
                        if (canvas.height != hNative) canvas.height = hNative;
                        if (typeof canvas.style != "undefined") {
                            if (w != wNative || h != hNative) {
                                canvas.style.setProperty("width", w + "px", "important");
                                canvas.style.setProperty("height", h + "px", "important")
                            } else {
                                canvas.style.removeProperty("width");
                                canvas.style.removeProperty("height")
                            }
                        }
                    }
                },
                wgetRequests: {},
                nextWgetRequestHandle: 0,
                getNextWgetRequestHandle: function() {
                    var handle = Browser.nextWgetRequestHandle;
                    Browser.nextWgetRequestHandle++;
                    return handle
                }
            };
            var EGL = {
                errorCode: 12288,
                defaultDisplayInitialized: false,
                currentContext: 0,
                currentReadSurface: 0,
                currentDrawSurface: 0,
                contextAttributes: {
                    alpha: false,
                    depth: false,
                    stencil: false,
                    antialias: false
                },
                stringCache: {},
                setErrorCode: function(code) {
                    EGL.errorCode = code
                },
                chooseConfig: function(display, attribList, config, config_size, numConfigs) {
                    if (display != 62e3) {
                        EGL.setErrorCode(12296);
                        return 0
                    }
                    if (attribList) {
                        for (;;) {
                            var param = HEAP32[attribList >> 2];
                            if (param == 12321) {
                                var alphaSize = HEAP32[attribList + 4 >> 2];
                                EGL.contextAttributes.alpha = alphaSize > 0
                            } else if (param == 12325) {
                                var depthSize = HEAP32[attribList + 4 >> 2];
                                EGL.contextAttributes.depth = depthSize > 0
                            } else if (param == 12326) {
                                var stencilSize = HEAP32[attribList + 4 >> 2];
                                EGL.contextAttributes.stencil = stencilSize > 0
                            } else if (param == 12337) {
                                var samples = HEAP32[attribList + 4 >> 2];
                                EGL.contextAttributes.antialias = samples > 0
                            } else if (param == 12338) {
                                var samples = HEAP32[attribList + 4 >> 2];
                                EGL.contextAttributes.antialias = samples == 1
                            } else if (param == 12344) {
                                break
                            }
                            attribList += 8
                        }
                    }
                    if ((!config || !config_size) && !numConfigs) {
                        EGL.setErrorCode(12300);
                        return 0
                    }
                    if (numConfigs) {
                        HEAP32[numConfigs >> 2] = 1
                    }
                    if (config && config_size > 0) {
                        HEAP32[config >> 2] = 62002
                    }
                    EGL.setErrorCode(12288);
                    return 1
                }
            };

            function _eglBindAPI(api) {
                if (api == 12448) {
                    EGL.setErrorCode(12288);
                    return 1
                } else {
                    EGL.setErrorCode(12300);
                    return 0
                }
            }

            function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
                return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs)
            }

            var GL = {
                counter: 1,
                lastError: 0,
                buffers: [],
                mappedBuffers: {},
                programs: [],
                framebuffers: [],
                renderbuffers: [],
                textures: [],
                uniforms: [],
                shaders: [],
                vaos: [],
                contexts: {},
                currentContext: null,
                offscreenCanvases: {},
                timerQueriesEXT: [],
                programInfos: {},
                stringCache: {},
                unpackAlignment: 4,
                init: function() {
                    GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
                    for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
                        GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i + 1)
                    }
                },
                recordError: function recordError(errorCode) {
                    if (!GL.lastError) {
                        GL.lastError = errorCode
                    }
                },
                getNewId: function(table) {
                    var ret = GL.counter++;
                    for (var i = table.length; i < ret; i++) {
                        table[i] = null
                    }
                    return ret
                },
                MINI_TEMP_BUFFER_SIZE: 256,
                miniTempBuffer: null,
                miniTempBufferViews: [0],
                getSource: function(shader, count, string, length) {
                    var source = "";
                    for (var i = 0; i < count; ++i) {
                        var len = length ? HEAP32[length + i * 4 >> 2] : -1;
                        source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
                    }
                    return source
                },
                createContext: function(canvas, webGLContextAttributes) {
                    var ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
                    return ctx && GL.registerContext(ctx, webGLContextAttributes)
                },
                registerContext: function(ctx, webGLContextAttributes) {
                    var handle = _malloc(8);
                    var context = {
                        handle: handle,
                        attributes: webGLContextAttributes,
                        version: webGLContextAttributes.majorVersion,
                        GLctx: ctx
                    };
                    if (ctx.canvas) ctx.canvas.GLctxObject = context;
                    GL.contexts[handle] = context;
                    if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
                        GL.initExtensions(context)
                    }
                    return handle
                },
                makeContextCurrent: function(contextHandle) {
                    GL.currentContext = GL.contexts[contextHandle];
                    Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
                    return !(contextHandle && !GLctx)
                },
                getContext: function(contextHandle) {
                    return GL.contexts[contextHandle]
                },
                deleteContext: function(contextHandle) {
                    if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
                    if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
                    if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
                    _free(GL.contexts[contextHandle]);
                    GL.contexts[contextHandle] = null
                },
                initExtensions: function(context) {
                    if (!context) context = GL.currentContext;
                    if (context.initExtensionsDone) return;
                    context.initExtensionsDone = true;
                    var GLctx = context.GLctx;
                    if (context.version < 2) {
                        var instancedArraysExt = GLctx.getExtension("ANGLE_instanced_arrays");
                        if (instancedArraysExt) {
                            GLctx["vertexAttribDivisor"] = function(index, divisor) {
                                instancedArraysExt["vertexAttribDivisorANGLE"](index, divisor)
                            };
                            GLctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
                                instancedArraysExt["drawArraysInstancedANGLE"](mode, first, count, primcount)
                            };
                            GLctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
                                instancedArraysExt["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
                            }
                        }
                        var vaoExt = GLctx.getExtension("OES_vertex_array_object");
                        if (vaoExt) {
                            GLctx["createVertexArray"] = function() {
                                return vaoExt["createVertexArrayOES"]()
                            };
                            GLctx["deleteVertexArray"] = function(vao) {
                                vaoExt["deleteVertexArrayOES"](vao)
                            };
                            GLctx["bindVertexArray"] = function(vao) {
                                vaoExt["bindVertexArrayOES"](vao)
                            };
                            GLctx["isVertexArray"] = function(vao) {
                                return vaoExt["isVertexArrayOES"](vao)
                            }
                        }
                        var drawBuffersExt = GLctx.getExtension("WEBGL_draw_buffers");
                        if (drawBuffersExt) {
                            GLctx["drawBuffers"] = function(n, bufs) {
                                drawBuffersExt["drawBuffersWEBGL"](n, bufs)
                            }
                        }
                    }
                    GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
                    var automaticallyEnabledExtensions = ["OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float", "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2"];
                    var exts = GLctx.getSupportedExtensions();
                    if (exts && exts.length > 0) {
                        GLctx.getSupportedExtensions().forEach(function(ext) {
                            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
                                GLctx.getExtension(ext)
                            }
                        })
                    }
                },
                populateUniformTable: function(program) {
                    var p = GL.programs[program];
                    var ptable = GL.programInfos[program] = {
                        uniforms: {},
                        maxUniformLength: 0,
                        maxAttributeLength: -1,
                        maxUniformBlockNameLength: -1
                    };
                    var utable = ptable.uniforms;
                    var numUniforms = GLctx.getProgramParameter(p, 35718);
                    for (var i = 0; i < numUniforms; ++i) {
                        var u = GLctx.getActiveUniform(p, i);
                        var name = u.name;
                        ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
                        if (name.slice(-1) == "]") {
                            name = name.slice(0, name.lastIndexOf("["))
                        }
                        var loc = GLctx.getUniformLocation(p, name);
                        if (loc) {
                            var id = GL.getNewId(GL.uniforms);
                            utable[name] = [u.size, id];
                            GL.uniforms[id] = loc;
                            for (var j = 1; j < u.size; ++j) {
                                var n = name + "[" + j + "]";
                                loc = GLctx.getUniformLocation(p, n);
                                id = GL.getNewId(GL.uniforms);
                                GL.uniforms[id] = loc
                            }
                        }
                    }
                }
            };

            function _eglCreateContext(display, config, hmm, contextAttribs) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                var glesContextVersion = 1;
                for (;;) {
                    var param = HEAP32[contextAttribs >> 2];
                    if (param == 12440) {
                        glesContextVersion = HEAP32[contextAttribs + 4 >> 2]
                    } else if (param == 12344) {
                        break
                    } else {
                        EGL.setErrorCode(12292);
                        return 0
                    }
                    contextAttribs += 8
                }
                if (glesContextVersion != 2) {
                    EGL.setErrorCode(12293);
                    return 0
                }
                EGL.contextAttributes.majorVersion = glesContextVersion - 1;
                EGL.contextAttributes.minorVersion = 0;
                EGL.context = GL.createContext(Module["canvas"], EGL.contextAttributes);
                if (EGL.context != 0) {
                    EGL.setErrorCode(12288);
                    GL.makeContextCurrent(EGL.context);
                    Module.useWebGL = true;
                    Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
                        callback()
                    });
                    GL.makeContextCurrent(null);
                    return 62004
                } else {
                    EGL.setErrorCode(12297);
                    return 0
                }
            }

            function _eglCreateWindowSurface(display, config, win, attrib_list) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (config != 62002) {
                    EGL.setErrorCode(12293);
                    return 0
                }
                EGL.setErrorCode(12288);
                return 62006
            }

            function _eglDestroyContext(display, context) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (context != 62004) {
                    EGL.setErrorCode(12294);
                    return 0
                }
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglDestroySurface(display, surface) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (surface != 62006) {
                    EGL.setErrorCode(12301);
                    return 1
                }
                if (EGL.currentReadSurface == surface) {
                    EGL.currentReadSurface = 0
                }
                if (EGL.currentDrawSurface == surface) {
                    EGL.currentDrawSurface = 0
                }
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglGetConfigAttrib(display, config, attribute, value) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (config != 62002) {
                    EGL.setErrorCode(12293);
                    return 0
                }
                if (!value) {
                    EGL.setErrorCode(12300);
                    return 0
                }
                EGL.setErrorCode(12288);
                switch (attribute) {
                    case 12320:
                        HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 32 : 24;
                        return 1;
                    case 12321:
                        HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 8 : 0;
                        return 1;
                    case 12322:
                        HEAP32[value >> 2] = 8;
                        return 1;
                    case 12323:
                        HEAP32[value >> 2] = 8;
                        return 1;
                    case 12324:
                        HEAP32[value >> 2] = 8;
                        return 1;
                    case 12325:
                        HEAP32[value >> 2] = EGL.contextAttributes.depth ? 24 : 0;
                        return 1;
                    case 12326:
                        HEAP32[value >> 2] = EGL.contextAttributes.stencil ? 8 : 0;
                        return 1;
                    case 12327:
                        HEAP32[value >> 2] = 12344;
                        return 1;
                    case 12328:
                        HEAP32[value >> 2] = 62002;
                        return 1;
                    case 12329:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12330:
                        HEAP32[value >> 2] = 4096;
                        return 1;
                    case 12331:
                        HEAP32[value >> 2] = 16777216;
                        return 1;
                    case 12332:
                        HEAP32[value >> 2] = 4096;
                        return 1;
                    case 12333:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12334:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12335:
                        HEAP32[value >> 2] = 12344;
                        return 1;
                    case 12337:
                        HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 4 : 0;
                        return 1;
                    case 12338:
                        HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 1 : 0;
                        return 1;
                    case 12339:
                        HEAP32[value >> 2] = 4;
                        return 1;
                    case 12340:
                        HEAP32[value >> 2] = 12344;
                        return 1;
                    case 12341:
                    case 12342:
                    case 12343:
                        HEAP32[value >> 2] = -1;
                        return 1;
                    case 12345:
                    case 12346:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12347:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12348:
                        HEAP32[value >> 2] = 1;
                        return 1;
                    case 12349:
                    case 12350:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    case 12351:
                        HEAP32[value >> 2] = 12430;
                        return 1;
                    case 12352:
                        HEAP32[value >> 2] = 4;
                        return 1;
                    case 12354:
                        HEAP32[value >> 2] = 0;
                        return 1;
                    default:
                        EGL.setErrorCode(12292);
                        return 0
                }
            }

            function _eglGetDisplay(nativeDisplayType) {
                EGL.setErrorCode(12288);
                return 62e3
            }

            function _eglGetError() {
                return EGL.errorCode
            }

            function _eglGetProcAddress(name_) {
                return _emscripten_GetProcAddress(name_)
            }

            function _eglInitialize(display, majorVersion, minorVersion) {
                if (display == 62e3) {
                    if (majorVersion) {
                        HEAP32[majorVersion >> 2] = 1
                    }
                    if (minorVersion) {
                        HEAP32[minorVersion >> 2] = 4
                    }
                    EGL.defaultDisplayInitialized = true;
                    EGL.setErrorCode(12288);
                    return 1
                } else {
                    EGL.setErrorCode(12296);
                    return 0
                }
            }

            function _eglMakeCurrent(display, draw, read, context) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (context != 0 && context != 62004) {
                    EGL.setErrorCode(12294);
                    return 0
                }
                if (read != 0 && read != 62006 || draw != 0 && draw != 62006) {
                    EGL.setErrorCode(12301);
                    return 0
                }
                GL.makeContextCurrent(context ? EGL.context : null);
                EGL.currentContext = context;
                EGL.currentDrawSurface = draw;
                EGL.currentReadSurface = read;
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglQueryString(display, name) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                EGL.setErrorCode(12288);
                if (EGL.stringCache[name]) return EGL.stringCache[name];
                var ret;
                switch (name) {
                    case 12371:
                        ret = allocate(intArrayFromString("Emscripten"), "i8", ALLOC_NORMAL);
                        break;
                    case 12372:
                        ret = allocate(intArrayFromString("1.4 Emscripten EGL"), "i8", ALLOC_NORMAL);
                        break;
                    case 12373:
                        ret = allocate(intArrayFromString(""), "i8", ALLOC_NORMAL);
                        break;
                    case 12429:
                        ret = allocate(intArrayFromString("OpenGL_ES"), "i8", ALLOC_NORMAL);
                        break;
                    default:
                        EGL.setErrorCode(12300);
                        return 0
                }
                EGL.stringCache[name] = ret;
                return ret
            }

            function _eglSwapBuffers() {
                if (!EGL.defaultDisplayInitialized) {
                    EGL.setErrorCode(12289)
                } else if (!Module.ctx) {
                    EGL.setErrorCode(12290)
                } else if (Module.ctx.isContextLost()) {
                    EGL.setErrorCode(12302)
                } else {
                    EGL.setErrorCode(12288);
                    return 1
                }
                return 0
            }

            function _eglSwapInterval(display, interval) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
                else _emscripten_set_main_loop_timing(1, interval);
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglTerminate(display) {
                if (display != 62e3) {
                    EGL.setErrorCode(12296);
                    return 0
                }
                EGL.currentContext = 0;
                EGL.currentReadSurface = 0;
                EGL.currentDrawSurface = 0;
                EGL.defaultDisplayInitialized = false;
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglWaitClient() {
                EGL.setErrorCode(12288);
                return 1
            }

            function _eglWaitGL() {
                return _eglWaitClient.apply(null, arguments)
            }

            function _eglWaitNative(nativeEngineId) {
                EGL.setErrorCode(12288);
                return 1
            }

            var JSEvents = {
                keyEvent: 0,
                mouseEvent: 0,
                wheelEvent: 0,
                uiEvent: 0,
                focusEvent: 0,
                deviceOrientationEvent: 0,
                deviceMotionEvent: 0,
                fullscreenChangeEvent: 0,
                pointerlockChangeEvent: 0,
                visibilityChangeEvent: 0,
                touchEvent: 0,
                previousFullscreenElement: null,
                previousScreenX: null,
                previousScreenY: null,
                removeEventListenersRegistered: false,
                removeAllEventListeners: function() {
                    for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
                        JSEvents._removeHandler(i)
                    }
                    JSEvents.eventHandlers = [];
                    JSEvents.deferredCalls = []
                },
                registerRemoveEventListeners: function() {
                    if (!JSEvents.removeEventListenersRegistered) {
                        __ATEXIT__.push(JSEvents.removeAllEventListeners);
                        JSEvents.removeEventListenersRegistered = true
                    }
                },
                deferredCalls: [],
                deferCall: function(targetFunction, precedence, argsList) {
                    function arraysHaveEqualContent(arrA, arrB) {
                        if (arrA.length != arrB.length) return false;
                        for (var i in arrA) {
                            if (arrA[i] != arrB[i]) return false
                        }
                        return true
                    }

                    for (var i in JSEvents.deferredCalls) {
                        var call = JSEvents.deferredCalls[i];
                        if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                            return
                        }
                    }
                    JSEvents.deferredCalls.push({
                        targetFunction: targetFunction,
                        precedence: precedence,
                        argsList: argsList
                    });
                    JSEvents.deferredCalls.sort(function(x, y) {
                        return x.precedence < y.precedence
                    })
                },
                removeDeferredCalls: function(targetFunction) {
                    for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
                        if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                            JSEvents.deferredCalls.splice(i, 1);
                            --i
                        }
                    }
                },
                canPerformEventHandlerRequests: function() {
                    return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
                },
                runDeferredCalls: function() {
                    if (!JSEvents.canPerformEventHandlerRequests()) {
                        return
                    }
                    for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
                        var call = JSEvents.deferredCalls[i];
                        JSEvents.deferredCalls.splice(i, 1);
                        --i;
                        call.targetFunction.apply(this, call.argsList)
                    }
                },
                inEventHandler: 0,
                currentEventHandler: null,
                eventHandlers: [],
                isInternetExplorer: function() {
                    return navigator.userAgent.indexOf("MSIE") !== -1 || navigator.appVersion.indexOf("Trident/") > 0
                },
                removeAllHandlersOnTarget: function(target, eventTypeString) {
                    for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                        if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                            JSEvents._removeHandler(i--)
                        }
                    }
                },
                _removeHandler: function(i) {
                    var h = JSEvents.eventHandlers[i];
                    h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
                    JSEvents.eventHandlers.splice(i, 1)
                },
                registerOrRemoveHandler: function(eventHandler) {
                    var jsEventHandler = function jsEventHandler(event) {
                        ++JSEvents.inEventHandler;
                        JSEvents.currentEventHandler = eventHandler;
                        JSEvents.runDeferredCalls();
                        eventHandler.handlerFunc(event);
                        JSEvents.runDeferredCalls();
                        --JSEvents.inEventHandler
                    };
                    if (eventHandler.callbackfunc) {
                        eventHandler.eventListenerFunc = jsEventHandler;
                        eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
                        JSEvents.eventHandlers.push(eventHandler);
                        JSEvents.registerRemoveEventListeners()
                    } else {
                        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                            if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                                JSEvents._removeHandler(i--)
                            }
                        }
                    }
                },
                getBoundingClientRectOrZeros: function(target) {
                    return target.getBoundingClientRect ? target.getBoundingClientRect() : {
                        left: 0,
                        top: 0
                    }
                },
                pageScrollPos: function() {
                    if (window.pageXOffset > 0 || window.pageYOffset > 0) {
                        return [window.pageXOffset, window.pageYOffset]
                    }
                    if (typeof document.documentElement.scrollLeft !== "undefined" || typeof document.documentElement.scrollTop !== "undefined") {
                        return [document.documentElement.scrollLeft, document.documentElement.scrollTop]
                    }
                    return [document.body.scrollLeft | 0, document.body.scrollTop | 0]
                },
                getNodeNameForTarget: function(target) {
                    if (!target) return "";
                    if (target == window) return "#window";
                    if (target == screen) return "#screen";
                    return target && target.nodeName ? target.nodeName : ""
                },
                tick: function() {
                    if (window["performance"] && window["performance"]["now"]) return window["performance"]["now"]();
                    else return Date.now()
                },
                fullscreenEnabled: function() {
                    return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled
                }
            };
            var __currentFullscreenStrategy = {};
            var __specialEventTargets = [0, typeof document !== "undefined" ? document : 0, typeof window !== "undefined" ? window : 0];

            function __findEventTarget(target) {
                try {
                    if (!target) return window;
                    if (typeof target === "number") target = __specialEventTargets[target] || UTF8ToString(target);
                    if (target === "#window") return window;
                    else if (target === "#document") return document;
                    else if (target === "#screen") return screen;
                    else if (target === "#canvas") return Module["canvas"];
                    return typeof target === "string" ? document.getElementById(target) : target
                } catch (e) {
                    return null
                }
            }

            function __findCanvasEventTarget(target) {
                if (typeof target === "number") target = UTF8ToString(target);
                if (!target || target === "#canvas") {
                    if (typeof GL !== "undefined" && GL.offscreenCanvases["canvas"]) return GL.offscreenCanvases["canvas"];
                    return Module["canvas"]
                }
                if (typeof GL !== "undefined" && GL.offscreenCanvases[target]) return GL.offscreenCanvases[target];
                return __findEventTarget(target)
            }

            function _emscripten_get_canvas_element_size(target, width, height) {
                var canvas = __findCanvasEventTarget(target);
                if (!canvas) return -4;
                HEAP32[width >> 2] = canvas.width;
                HEAP32[height >> 2] = canvas.height
            }

            function __get_canvas_element_size(target) {
                var stackTop = stackSave();
                var w = stackAlloc(8);
                var h = w + 4;
                var targetInt = stackAlloc(target.id.length + 1);
                stringToUTF8(target.id, targetInt, target.id.length + 1);
                var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
                var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
                stackRestore(stackTop);
                return size
            }

            function _emscripten_set_canvas_element_size(target, width, height) {
                var canvas = __findCanvasEventTarget(target);
                if (!canvas) return -4;
                canvas.width = width;
                canvas.height = height;
                return 0
            }

            function __set_canvas_element_size(target, width, height) {
                if (!target.controlTransferredOffscreen) {
                    target.width = width;
                    target.height = height
                } else {
                    var stackTop = stackSave();
                    var targetInt = stackAlloc(target.id.length + 1);
                    stringToUTF8(target.id, targetInt, target.id.length + 1);
                    _emscripten_set_canvas_element_size(targetInt, width, height);
                    stackRestore(stackTop)
                }
            }

            function __registerRestoreOldStyle(canvas) {
                var canvasSize = __get_canvas_element_size(canvas);
                var oldWidth = canvasSize[0];
                var oldHeight = canvasSize[1];
                var oldCssWidth = canvas.style.width;
                var oldCssHeight = canvas.style.height;
                var oldBackgroundColor = canvas.style.backgroundColor;
                var oldDocumentBackgroundColor = document.body.style.backgroundColor;
                var oldPaddingLeft = canvas.style.paddingLeft;
                var oldPaddingRight = canvas.style.paddingRight;
                var oldPaddingTop = canvas.style.paddingTop;
                var oldPaddingBottom = canvas.style.paddingBottom;
                var oldMarginLeft = canvas.style.marginLeft;
                var oldMarginRight = canvas.style.marginRight;
                var oldMarginTop = canvas.style.marginTop;
                var oldMarginBottom = canvas.style.marginBottom;
                var oldDocumentBodyMargin = document.body.style.margin;
                var oldDocumentOverflow = document.documentElement.style.overflow;
                var oldDocumentScroll = document.body.scroll;
                var oldImageRendering = canvas.style.imageRendering;

                function restoreOldStyle() {
                    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
                    if (!fullscreenElement) {
                        document.removeEventListener("fullscreenchange", restoreOldStyle);
                        document.removeEventListener("mozfullscreenchange", restoreOldStyle);
                        document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
                        document.removeEventListener("MSFullscreenChange", restoreOldStyle);
                        __set_canvas_element_size(canvas, oldWidth, oldHeight);
                        canvas.style.width = oldCssWidth;
                        canvas.style.height = oldCssHeight;
                        canvas.style.backgroundColor = oldBackgroundColor;
                        if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
                        document.body.style.backgroundColor = oldDocumentBackgroundColor;
                        canvas.style.paddingLeft = oldPaddingLeft;
                        canvas.style.paddingRight = oldPaddingRight;
                        canvas.style.paddingTop = oldPaddingTop;
                        canvas.style.paddingBottom = oldPaddingBottom;
                        canvas.style.marginLeft = oldMarginLeft;
                        canvas.style.marginRight = oldMarginRight;
                        canvas.style.marginTop = oldMarginTop;
                        canvas.style.marginBottom = oldMarginBottom;
                        document.body.style.margin = oldDocumentBodyMargin;
                        document.documentElement.style.overflow = oldDocumentOverflow;
                        document.body.scroll = oldDocumentScroll;
                        canvas.style.imageRendering = oldImageRendering;
                        if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
                        if (__currentFullscreenStrategy.canvasResizedCallback) {
                            dynCall_iiii(__currentFullscreenStrategy.canvasResizedCallback, 37, 0, __currentFullscreenStrategy.canvasResizedCallbackUserData)
                        }
                    }
                }

                document.addEventListener("fullscreenchange", restoreOldStyle);
                document.addEventListener("mozfullscreenchange", restoreOldStyle);
                document.addEventListener("webkitfullscreenchange", restoreOldStyle);
                document.addEventListener("MSFullscreenChange", restoreOldStyle);
                return restoreOldStyle
            }

            function __setLetterbox(element, topBottom, leftRight) {
                if (JSEvents.isInternetExplorer()) {
                    element.style.marginLeft = element.style.marginRight = leftRight + "px";
                    element.style.marginTop = element.style.marginBottom = topBottom + "px"
                } else {
                    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
                    element.style.paddingTop = element.style.paddingBottom = topBottom + "px"
                }
            }

            function _JSEvents_resizeCanvasForFullscreen(target, strategy) {
                var restoreOldStyle = __registerRestoreOldStyle(target);
                var cssWidth = strategy.softFullscreen ? window.innerWidth : screen.width;
                var cssHeight = strategy.softFullscreen ? window.innerHeight : screen.height;
                var rect = target.getBoundingClientRect();
                var windowedCssWidth = rect.right - rect.left;
                var windowedCssHeight = rect.bottom - rect.top;
                var canvasSize = __get_canvas_element_size(target);
                var windowedRttWidth = canvasSize[0];
                var windowedRttHeight = canvasSize[1];
                if (strategy.scaleMode == 3) {
                    __setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
                    cssWidth = windowedCssWidth;
                    cssHeight = windowedCssHeight
                } else if (strategy.scaleMode == 2) {
                    if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
                        var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
                        __setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
                        cssHeight = desiredCssHeight
                    } else {
                        var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
                        __setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
                        cssWidth = desiredCssWidth
                    }
                }
                if (!target.style.backgroundColor) target.style.backgroundColor = "black";
                if (!document.body.style.backgroundColor) document.body.style.backgroundColor = "black";
                target.style.width = cssWidth + "px";
                target.style.height = cssHeight + "px";
                if (strategy.filteringMode == 1) {
                    target.style.imageRendering = "optimizeSpeed";
                    target.style.imageRendering = "-moz-crisp-edges";
                    target.style.imageRendering = "-o-crisp-edges";
                    target.style.imageRendering = "-webkit-optimize-contrast";
                    target.style.imageRendering = "optimize-contrast";
                    target.style.imageRendering = "crisp-edges";
                    target.style.imageRendering = "pixelated"
                }
                var dpiScale = strategy.canvasResolutionScaleMode == 2 ? window.devicePixelRatio : 1;
                if (strategy.canvasResolutionScaleMode != 0) {
                    var newWidth = cssWidth * dpiScale | 0;
                    var newHeight = cssHeight * dpiScale | 0;
                    __set_canvas_element_size(target, newWidth, newHeight);
                    if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight)
                }
                return restoreOldStyle
            }

            function _JSEvents_requestFullscreen(target, strategy) {
                if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
                    _JSEvents_resizeCanvasForFullscreen(target, strategy)
                }
                if (target.requestFullscreen) {
                    target.requestFullscreen()
                } else if (target.msRequestFullscreen) {
                    target.msRequestFullscreen()
                } else if (target.mozRequestFullScreen) {
                    target.mozRequestFullScreen()
                } else if (target.mozRequestFullscreen) {
                    target.mozRequestFullscreen()
                } else if (target.webkitRequestFullscreen) {
                    target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
                } else {
                    if (typeof JSEvents.fullscreenEnabled() === "undefined") {
                        return -1
                    } else {
                        return -3
                    }
                }
                if (strategy.canvasResizedCallback) {
                    dynCall_iiii(strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData)
                }
                return 0
            }

            function _emscripten_exit_fullscreen() {
                if (typeof JSEvents.fullscreenEnabled() === "undefined") return -1;
                JSEvents.removeDeferredCalls(_JSEvents_requestFullscreen);
                var d = __specialEventTargets[1];
                if (d.exitFullscreen) {
                    d.fullscreenElement && d.exitFullscreen()
                } else if (d.msExitFullscreen) {
                    d.msFullscreenElement && d.msExitFullscreen()
                } else if (d.mozCancelFullScreen) {
                    d.mozFullScreenElement && d.mozCancelFullScreen()
                } else if (d.webkitExitFullscreen) {
                    d.webkitFullscreenElement && d.webkitExitFullscreen()
                } else {
                    return -1
                }
                if (__currentFullscreenStrategy.canvasResizedCallback) {
                    dynCall_iiii(__currentFullscreenStrategy.canvasResizedCallback, 37, 0, __currentFullscreenStrategy.canvasResizedCallbackUserData);
                    __currentFullscreenStrategy = 0
                }
                return 0
            }

            function __requestPointerLock(target) {
                if (target.requestPointerLock) {
                    target.requestPointerLock()
                } else if (target.mozRequestPointerLock) {
                    target.mozRequestPointerLock()
                } else if (target.webkitRequestPointerLock) {
                    target.webkitRequestPointerLock()
                } else if (target.msRequestPointerLock) {
                    target.msRequestPointerLock()
                } else {
                    if (document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock || document.body.msRequestPointerLock) {
                        return -3
                    } else {
                        return -1
                    }
                }
                return 0
            }

            function _emscripten_exit_pointerlock() {
                JSEvents.removeDeferredCalls(__requestPointerLock);
                if (document.exitPointerLock) {
                    document.exitPointerLock()
                } else if (document.msExitPointerLock) {
                    document.msExitPointerLock()
                } else if (document.mozExitPointerLock) {
                    document.mozExitPointerLock()
                } else if (document.webkitExitPointerLock) {
                    document.webkitExitPointerLock()
                } else {
                    return -1
                }
                return 0
            }

            function _emscripten_get_device_pixel_ratio() {
                return window.devicePixelRatio || 1
            }

            function _emscripten_get_element_css_size(target, width, height) {
                target = target ? __findEventTarget(target) : Module["canvas"];
                if (!target) return -4;
                if (target.getBoundingClientRect) {
                    var rect = target.getBoundingClientRect();
                    HEAPF64[width >> 3] = rect.right - rect.left;
                    HEAPF64[height >> 3] = rect.bottom - rect.top
                } else {
                    HEAPF64[width >> 3] = target.clientWidth;
                    HEAPF64[height >> 3] = target.clientHeight
                }
                return 0
            }

            function __fillGamepadEventData(eventStruct, e) {
                HEAPF64[eventStruct >> 3] = e.timestamp;
                for (var i = 0; i < e.axes.length; ++i) {
                    HEAPF64[eventStruct + i * 8 + 16 >> 3] = e.axes[i]
                }
                for (var i = 0; i < e.buttons.length; ++i) {
                    if (typeof e.buttons[i] === "object") {
                        HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i].value
                    } else {
                        HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i]
                    }
                }
                for (var i = 0; i < e.buttons.length; ++i) {
                    if (typeof e.buttons[i] === "object") {
                        HEAP32[eventStruct + i * 4 + 1040 >> 2] = e.buttons[i].pressed
                    } else {
                        HEAP32[eventStruct + i * 4 + 1040 >> 2] = e.buttons[i] == 1
                    }
                }
                HEAP32[eventStruct + 1296 >> 2] = e.connected;
                HEAP32[eventStruct + 1300 >> 2] = e.index;
                HEAP32[eventStruct + 8 >> 2] = e.axes.length;
                HEAP32[eventStruct + 12 >> 2] = e.buttons.length;
                stringToUTF8(e.id, eventStruct + 1304, 64);
                stringToUTF8(e.mapping, eventStruct + 1368, 64)
            }

            function _emscripten_get_gamepad_status(index, gamepadState) {
                if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
                if (!JSEvents.lastGamepadState[index]) return -7;
                __fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
                return 0
            }

            function _emscripten_get_heap_size() {
                return TOTAL_MEMORY
            }

            function _emscripten_get_num_gamepads() {
                return JSEvents.lastGamepadState.length
            }

            function _emscripten_glActiveTexture(x0) {
                GLctx["activeTexture"](x0)
            }

            function _emscripten_glAttachShader(program, shader) {
                GLctx.attachShader(GL.programs[program], GL.shaders[shader])
            }

            function _emscripten_glBeginQueryEXT(target, id) {
                GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.timerQueriesEXT[id])
            }

            function _emscripten_glBindAttribLocation(program, index, name) {
                GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
            }

            function _emscripten_glBindBuffer(target, buffer) {
                GLctx.bindBuffer(target, GL.buffers[buffer])
            }

            function _emscripten_glBindFramebuffer(target, framebuffer) {
                GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
            }

            function _emscripten_glBindRenderbuffer(target, renderbuffer) {
                GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
            }

            function _emscripten_glBindTexture(target, texture) {
                GLctx.bindTexture(target, GL.textures[texture])
            }

            function _emscripten_glBindVertexArrayOES(vao) {
                GLctx["bindVertexArray"](GL.vaos[vao])
            }

            function _emscripten_glBlendColor(x0, x1, x2, x3) {
                GLctx["blendColor"](x0, x1, x2, x3)
            }

            function _emscripten_glBlendEquation(x0) {
                GLctx["blendEquation"](x0)
            }

            function _emscripten_glBlendEquationSeparate(x0, x1) {
                GLctx["blendEquationSeparate"](x0, x1)
            }

            function _emscripten_glBlendFunc(x0, x1) {
                GLctx["blendFunc"](x0, x1)
            }

            function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
                GLctx["blendFuncSeparate"](x0, x1, x2, x3)
            }

            function _emscripten_glBufferData(target, size, data, usage) {
                GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
            }

            function _emscripten_glBufferSubData(target, offset, size, data) {
                GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
            }

            function _emscripten_glCheckFramebufferStatus(x0) {
                return GLctx["checkFramebufferStatus"](x0)
            }

            function _emscripten_glClear(x0) {
                GLctx["clear"](x0)
            }

            function _emscripten_glClearColor(x0, x1, x2, x3) {
                GLctx["clearColor"](x0, x1, x2, x3)
            }

            function _emscripten_glClearDepthf(x0) {
                GLctx["clearDepth"](x0)
            }

            function _emscripten_glClearStencil(x0) {
                GLctx["clearStencil"](x0)
            }

            function _emscripten_glColorMask(red, green, blue, alpha) {
                GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
            }

            function _emscripten_glCompileShader(shader) {
                GLctx.compileShader(GL.shaders[shader])
            }

            function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
                GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
            }

            function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
                GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
            }

            function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
                GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
            }

            function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
                GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
            }

            function _emscripten_glCreateProgram() {
                var id = GL.getNewId(GL.programs);
                var program = GLctx.createProgram();
                program.name = id;
                GL.programs[id] = program;
                return id
            }

            function _emscripten_glCreateShader(shaderType) {
                var id = GL.getNewId(GL.shaders);
                GL.shaders[id] = GLctx.createShader(shaderType);
                return id
            }

            function _emscripten_glCullFace(x0) {
                GLctx["cullFace"](x0)
            }

            function _emscripten_glDeleteBuffers(n, buffers) {
                for (var i = 0; i < n; i++) {
                    var id = HEAP32[buffers + i * 4 >> 2];
                    var buffer = GL.buffers[id];
                    if (!buffer) continue;
                    GLctx.deleteBuffer(buffer);
                    buffer.name = 0;
                    GL.buffers[id] = null;
                    if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
                    if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0
                }
            }

            function _emscripten_glDeleteFramebuffers(n, framebuffers) {
                for (var i = 0; i < n; ++i) {
                    var id = HEAP32[framebuffers + i * 4 >> 2];
                    var framebuffer = GL.framebuffers[id];
                    if (!framebuffer) continue;
                    GLctx.deleteFramebuffer(framebuffer);
                    framebuffer.name = 0;
                    GL.framebuffers[id] = null
                }
            }

            function _emscripten_glDeleteProgram(id) {
                if (!id) return;
                var program = GL.programs[id];
                if (!program) {
                    GL.recordError(1281);
                    return
                }
                GLctx.deleteProgram(program);
                program.name = 0;
                GL.programs[id] = null;
                GL.programInfos[id] = null
            }

            function _emscripten_glDeleteQueriesEXT(n, ids) {
                for (var i = 0; i < n; i++) {
                    var id = HEAP32[ids + i * 4 >> 2];
                    var query = GL.timerQueriesEXT[id];
                    if (!query) continue;
                    GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
                    GL.timerQueriesEXT[id] = null
                }
            }

            function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
                for (var i = 0; i < n; i++) {
                    var id = HEAP32[renderbuffers + i * 4 >> 2];
                    var renderbuffer = GL.renderbuffers[id];
                    if (!renderbuffer) continue;
                    GLctx.deleteRenderbuffer(renderbuffer);
                    renderbuffer.name = 0;
                    GL.renderbuffers[id] = null
                }
            }

            function _emscripten_glDeleteShader(id) {
                if (!id) return;
                var shader = GL.shaders[id];
                if (!shader) {
                    GL.recordError(1281);
                    return
                }
                GLctx.deleteShader(shader);
                GL.shaders[id] = null
            }

            function _emscripten_glDeleteTextures(n, textures) {
                for (var i = 0; i < n; i++) {
                    var id = HEAP32[textures + i * 4 >> 2];
                    var texture = GL.textures[id];
                    if (!texture) continue;
                    GLctx.deleteTexture(texture);
                    texture.name = 0;
                    GL.textures[id] = null
                }
            }

            function _emscripten_glDeleteVertexArraysOES(n, vaos) {
                for (var i = 0; i < n; i++) {
                    var id = HEAP32[vaos + i * 4 >> 2];
                    GLctx["deleteVertexArray"](GL.vaos[id]);
                    GL.vaos[id] = null
                }
            }

            function _emscripten_glDepthFunc(x0) {
                GLctx["depthFunc"](x0)
            }

            function _emscripten_glDepthMask(flag) {
                GLctx.depthMask(!!flag)
            }

            function _emscripten_glDepthRangef(x0, x1) {
                GLctx["depthRange"](x0, x1)
            }

            function _emscripten_glDetachShader(program, shader) {
                GLctx.detachShader(GL.programs[program], GL.shaders[shader])
            }

            function _emscripten_glDisable(x0) {
                GLctx["disable"](x0)
            }

            function _emscripten_glDisableVertexAttribArray(index) {
                GLctx.disableVertexAttribArray(index)
            }

            function _emscripten_glDrawArrays(mode, first, count) {
                GLctx.drawArrays(mode, first, count)
            }

            function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
                GLctx["drawArraysInstanced"](mode, first, count, primcount)
            }

            var __tempFixedLengthArray = [];

            function _emscripten_glDrawBuffersWEBGL(n, bufs) {
                var bufArray = __tempFixedLengthArray[n];
                for (var i = 0; i < n; i++) {
                    bufArray[i] = HEAP32[bufs + i * 4 >> 2]
                }
                GLctx["drawBuffers"](bufArray)
            }

            function _emscripten_glDrawElements(mode, count, type, indices) {
                GLctx.drawElements(mode, count, type, indices)
            }

            function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
                GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
            }

            function _emscripten_glEnable(x0) {
                GLctx["enable"](x0)
            }

            function _emscripten_glEnableVertexAttribArray(index) {
                GLctx.enableVertexAttribArray(index)
            }

            function _emscripten_glEndQueryEXT(target) {
                GLctx.disjointTimerQueryExt["endQueryEXT"](target)
            }

            function _emscripten_glFinish() {
                GLctx["finish"]()
            }

            function _emscripten_glFlush() {
                GLctx["flush"]()
            }

            function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
                GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
            }

            function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
                GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
            }

            function _emscripten_glFrontFace(x0) {
                GLctx["frontFace"](x0)
            }

            function __glGenObject(n, buffers, createFunction, objectTable) {
                for (var i = 0; i < n; i++) {
                    var buffer = GLctx[createFunction]();
                    var id = buffer && GL.getNewId(objectTable);
                    if (buffer) {
                        buffer.name = id;
                        objectTable[id] = buffer
                    } else {
                        GL.recordError(1282)
                    }
                    HEAP32[buffers + i * 4 >> 2] = id
                }
            }

            function _emscripten_glGenBuffers(n, buffers) {
                __glGenObject(n, buffers, "createBuffer", GL.buffers)
            }

            function _emscripten_glGenFramebuffers(n, ids) {
                __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
            }

            function _emscripten_glGenQueriesEXT(n, ids) {
                for (var i = 0; i < n; i++) {
                    var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
                    if (!query) {
                        GL.recordError(1282);
                        while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
                        return
                    }
                    var id = GL.getNewId(GL.timerQueriesEXT);
                    query.name = id;
                    GL.timerQueriesEXT[id] = query;
                    HEAP32[ids + i * 4 >> 2] = id
                }
            }

            function _emscripten_glGenRenderbuffers(n, renderbuffers) {
                __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
            }

            function _emscripten_glGenTextures(n, textures) {
                __glGenObject(n, textures, "createTexture", GL.textures)
            }

            function _emscripten_glGenVertexArraysOES(n, arrays) {
                __glGenObject(n, arrays, "createVertexArray", GL.vaos)
            }

            function _emscripten_glGenerateMipmap(x0) {
                GLctx["generateMipmap"](x0)
            }

            function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
                program = GL.programs[program];
                var info = GLctx.getActiveAttrib(program, index);
                if (!info) return;
                if (bufSize > 0 && name) {
                    var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
                    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
                } else {
                    if (length) HEAP32[length >> 2] = 0
                }
                if (size) HEAP32[size >> 2] = info.size;
                if (type) HEAP32[type >> 2] = info.type
            }

            function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
                program = GL.programs[program];
                var info = GLctx.getActiveUniform(program, index);
                if (!info) return;
                if (bufSize > 0 && name) {
                    var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
                    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
                } else {
                    if (length) HEAP32[length >> 2] = 0
                }
                if (size) HEAP32[size >> 2] = info.size;
                if (type) HEAP32[type >> 2] = info.type
            }

            function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
                var result = GLctx.getAttachedShaders(GL.programs[program]);
                var len = result.length;
                if (len > maxCount) {
                    len = maxCount
                }
                HEAP32[count >> 2] = len;
                for (var i = 0; i < len; ++i) {
                    var id = GL.shaders.indexOf(result[i]);
                    HEAP32[shaders + i * 4 >> 2] = id
                }
            }

            function _emscripten_glGetAttribLocation(program, name) {
                return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
            }

            function emscriptenWebGLGet(name_, p, type) {
                if (!p) {
                    GL.recordError(1281);
                    return
                }
                var ret = undefined;
                switch (name_) {
                    case 36346:
                        ret = 1;
                        break;
                    case 36344:
                        if (type !== "Integer" && type !== "Integer64") {
                            GL.recordError(1280)
                        }
                        return;
                    case 36345:
                        ret = 0;
                        break;
                    case 34466:
                        var formats = GLctx.getParameter(34467);
                        ret = formats ? formats.length : 0;
                        break
                }
                if (ret === undefined) {
                    var result = GLctx.getParameter(name_);
                    switch (typeof result) {
                        case "number":
                            ret = result;
                            break;
                        case "boolean":
                            ret = result ? 1 : 0;
                            break;
                        case "string":
                            GL.recordError(1280);
                            return;
                        case "object":
                            if (result === null) {
                                switch (name_) {
                                    case 34964:
                                    case 35725:
                                    case 34965:
                                    case 36006:
                                    case 36007:
                                    case 32873:
                                    case 34229:
                                    case 34068:
                                        {
                                            ret = 0;
                                            break
                                        }
                                    default:
                                        {
                                            GL.recordError(1280);
                                            return
                                        }
                                }
                            } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                                for (var i = 0; i < result.length; ++i) {
                                    switch (type) {
                                        case "Integer":
                                            HEAP32[p + i * 4 >> 2] = result[i];
                                            break;
                                        case "Float":
                                            HEAPF32[p + i * 4 >> 2] = result[i];
                                            break;
                                        case "Boolean":
                                            HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                                            break;
                                        default:
                                            throw "internal glGet error, bad type: " + type
                                    }
                                }
                                return
                            } else {
                                try {
                                    ret = result.name | 0
                                } catch (e) {
                                    GL.recordError(1280);
                                    err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                                    return
                                }
                            }
                            break;
                        default:
                            GL.recordError(1280);
                            return
                    }
                }
                switch (type) {
                    case "Integer64":
                        tempI64 = [ret >>> 0, (tempDouble = ret, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[p >> 2] = tempI64[0], HEAP32[p + 4 >> 2] = tempI64[1];
                        break;
                    case "Integer":
                        HEAP32[p >> 2] = ret;
                        break;
                    case "Float":
                        HEAPF32[p >> 2] = ret;
                        break;
                    case "Boolean":
                        HEAP8[p >> 0] = ret ? 1 : 0;
                        break;
                    default:
                        throw "internal glGet error, bad type: " + type
                }
            }

            function _emscripten_glGetBooleanv(name_, p) {
                emscriptenWebGLGet(name_, p, "Boolean")
            }

            function _emscripten_glGetBufferParameteriv(target, value, data) {
                if (!data) {
                    GL.recordError(1281);
                    return
                }
                HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
            }

            function _emscripten_glGetError() {
                if (GL.lastError) {
                    var error = GL.lastError;
                    GL.lastError = 0;
                    return error
                } else {
                    return GLctx.getError()
                }
            }

            function _emscripten_glGetFloatv(name_, p) {
                emscriptenWebGLGet(name_, p, "Float")
            }

            function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
                var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
                if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
                    result = result.name | 0
                }
                HEAP32[params >> 2] = result
            }

            function _emscripten_glGetIntegerv(name_, p) {
                emscriptenWebGLGet(name_, p, "Integer")
            }

            function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
                var log = GLctx.getProgramInfoLog(GL.programs[program]);
                if (log === null) log = "(unknown error)";
                if (maxLength > 0 && infoLog) {
                    var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
                    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
                } else {
                    if (length) HEAP32[length >> 2] = 0
                }
            }

            function _emscripten_glGetProgramiv(program, pname, p) {
                if (!p) {
                    GL.recordError(1281);
                    return
                }
                if (program >= GL.counter) {
                    GL.recordError(1281);
                    return
                }
                var ptable = GL.programInfos[program];
                if (!ptable) {
                    GL.recordError(1282);
                    return
                }
                if (pname == 35716) {
                    var log = GLctx.getProgramInfoLog(GL.programs[program]);
                    if (log === null) log = "(unknown error)";
                    HEAP32[p >> 2] = log.length + 1
                } else if (pname == 35719) {
                    HEAP32[p >> 2] = ptable.maxUniformLength
                } else if (pname == 35722) {
                    if (ptable.maxAttributeLength == -1) {
                        program = GL.programs[program];
                        var numAttribs = GLctx.getProgramParameter(program, 35721);
                        ptable.maxAttributeLength = 0;
                        for (var i = 0; i < numAttribs; ++i) {
                            var activeAttrib = GLctx.getActiveAttrib(program, i);
                            ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
                        }
                    }
                    HEAP32[p >> 2] = ptable.maxAttributeLength
                } else if (pname == 35381) {
                    if (ptable.maxUniformBlockNameLength == -1) {
                        program = GL.programs[program];
                        var numBlocks = GLctx.getProgramParameter(program, 35382);
                        ptable.maxUniformBlockNameLength = 0;
                        for (var i = 0; i < numBlocks; ++i) {
                            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                            ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
                        }
                    }
                    HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
                } else {
                    HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
                }
            }

            function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var query = GL.timerQueriesEXT[id];
                var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
                var ret;
                if (typeof param == "boolean") {
                    ret = param ? 1 : 0
                } else {
                    ret = param
                }
                tempI64 = [ret >>> 0, (tempDouble = ret, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[params >> 2] = tempI64[0], HEAP32[params + 4 >> 2] = tempI64[1]
            }

            function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var query = GL.timerQueriesEXT[id];
                var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
                var ret;
                if (typeof param == "boolean") {
                    ret = param ? 1 : 0
                } else {
                    ret = param
                }
                HEAP32[params >> 2] = ret
            }

            function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var query = GL.timerQueriesEXT[id];
                var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
                var ret;
                if (typeof param == "boolean") {
                    ret = param ? 1 : 0
                } else {
                    ret = param
                }
                tempI64 = [ret >>> 0, (tempDouble = ret, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[params >> 2] = tempI64[0], HEAP32[params + 4 >> 2] = tempI64[1]
            }

            function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var query = GL.timerQueriesEXT[id];
                var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
                var ret;
                if (typeof param == "boolean") {
                    ret = param ? 1 : 0
                } else {
                    ret = param
                }
                HEAP32[params >> 2] = ret
            }

            function _emscripten_glGetQueryivEXT(target, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
            }

            function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
            }

            function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
                var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
                if (log === null) log = "(unknown error)";
                if (maxLength > 0 && infoLog) {
                    var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
                    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
                } else {
                    if (length) HEAP32[length >> 2] = 0
                }
            }

            function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
                var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
                HEAP32[range >> 2] = result.rangeMin;
                HEAP32[range + 4 >> 2] = result.rangeMax;
                HEAP32[precision >> 2] = result.precision
            }

            function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
                var result = GLctx.getShaderSource(GL.shaders[shader]);
                if (!result) return;
                if (bufSize > 0 && source) {
                    var numBytesWrittenExclNull = stringToUTF8(result, source, bufSize);
                    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
                } else {
                    if (length) HEAP32[length >> 2] = 0
                }
            }

            function _emscripten_glGetShaderiv(shader, pname, p) {
                if (!p) {
                    GL.recordError(1281);
                    return
                }
                if (pname == 35716) {
                    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
                    if (log === null) log = "(unknown error)";
                    HEAP32[p >> 2] = log.length + 1
                } else if (pname == 35720) {
                    var source = GLctx.getShaderSource(GL.shaders[shader]);
                    var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
                    HEAP32[p >> 2] = sourceLength
                } else {
                    HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
                }
            }

            function stringToNewUTF8(jsString) {
                var length = lengthBytesUTF8(jsString) + 1;
                var cString = _malloc(length);
                stringToUTF8(jsString, cString, length);
                return cString
            }

            function _emscripten_glGetString(name_) {
                if (GL.stringCache[name_]) return GL.stringCache[name_];
                var ret;
                switch (name_) {
                    case 7939:
                        var exts = GLctx.getSupportedExtensions();
                        var gl_exts = [];
                        for (var i = 0; i < exts.length; ++i) {
                            gl_exts.push(exts[i]);
                            gl_exts.push("GL_" + exts[i])
                        }
                        ret = stringToNewUTF8(gl_exts.join(" "));
                        break;
                    case 7936:
                    case 7937:
                    case 37445:
                    case 37446:
                        var s = GLctx.getParameter(name_);
                        if (!s) {
                            GL.recordError(1280)
                        }
                        ret = stringToNewUTF8(s);
                        break;
                    case 7938:
                        var glVersion = GLctx.getParameter(GLctx.VERSION); {
                            glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
                        }
                        ret = stringToNewUTF8(glVersion);
                        break;
                    case 35724:
                        var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
                        var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                        var ver_num = glslVersion.match(ver_re);
                        if (ver_num !== null) {
                            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                            glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
                        }
                        ret = stringToNewUTF8(glslVersion);
                        break;
                    default:
                        GL.recordError(1280);
                        return 0
                }
                GL.stringCache[name_] = ret;
                return ret
            }

            function _emscripten_glGetTexParameterfv(target, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
            }

            function _emscripten_glGetTexParameteriv(target, pname, params) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
            }

            function _emscripten_glGetUniformLocation(program, name) {
                name = UTF8ToString(name);
                var arrayIndex = 0;
                if (name[name.length - 1] == "]") {
                    var leftBrace = name.lastIndexOf("[");
                    arrayIndex = name[leftBrace + 1] != "]" ? parseInt(name.slice(leftBrace + 1)) : 0;
                    name = name.slice(0, leftBrace)
                }
                var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
                if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
                    return uniformInfo[1] + arrayIndex
                } else {
                    return -1
                }
            }

            function emscriptenWebGLGetUniform(program, location, params, type) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
                if (typeof data == "number" || typeof data == "boolean") {
                    switch (type) {
                        case "Integer":
                            HEAP32[params >> 2] = data;
                            break;
                        case "Float":
                            HEAPF32[params >> 2] = data;
                            break;
                        default:
                            throw "internal emscriptenWebGLGetUniform() error, bad type: " + type
                    }
                } else {
                    for (var i = 0; i < data.length; i++) {
                        switch (type) {
                            case "Integer":
                                HEAP32[params + i * 4 >> 2] = data[i];
                                break;
                            case "Float":
                                HEAPF32[params + i * 4 >> 2] = data[i];
                                break;
                            default:
                                throw "internal emscriptenWebGLGetUniform() error, bad type: " + type
                        }
                    }
                }
            }

            function _emscripten_glGetUniformfv(program, location, params) {
                emscriptenWebGLGetUniform(program, location, params, "Float")
            }

            function _emscripten_glGetUniformiv(program, location, params) {
                emscriptenWebGLGetUniform(program, location, params, "Integer")
            }

            function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
                if (!pointer) {
                    GL.recordError(1281);
                    return
                }
                HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
            }

            function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
                if (!params) {
                    GL.recordError(1281);
                    return
                }
                var data = GLctx.getVertexAttrib(index, pname);
                if (pname == 34975) {
                    HEAP32[params >> 2] = data["name"]
                } else if (typeof data == "number" || typeof data == "boolean") {
                    switch (type) {
                        case "Integer":
                            HEAP32[params >> 2] = data;
                            break;
                        case "Float":
                            HEAPF32[params >> 2] = data;
                            break;
                        case "FloatToInteger":
                            HEAP32[params >> 2] = Math.fround(data);
                            break;
                        default:
                            throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type
                    }
                } else {
                    for (var i = 0; i < data.length; i++) {
                        switch (type) {
                            case "Integer":
                                HEAP32[params + i * 4 >> 2] = data[i];
                                break;
                            case "Float":
                                HEAPF32[params + i * 4 >> 2] = data[i];
                                break;
                            case "FloatToInteger":
                                HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
                                break;
                            default:
                                throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type
                        }
                    }
                }
            }

            function _emscripten_glGetVertexAttribfv(index, pname, params) {
                emscriptenWebGLGetVertexAttrib(index, pname, params, "Float")
            }

            function _emscripten_glGetVertexAttribiv(index, pname, params) {
                emscriptenWebGLGetVertexAttrib(index, pname, params, "FloatToInteger")
            }

            function _emscripten_glHint(x0, x1) {
                GLctx["hint"](x0, x1)
            }

            function _emscripten_glIsBuffer(buffer) {
                var b = GL.buffers[buffer];
                if (!b) return 0;
                return GLctx.isBuffer(b)
            }

            function _emscripten_glIsEnabled(x0) {
                return GLctx["isEnabled"](x0)
            }

            function _emscripten_glIsFramebuffer(framebuffer) {
                var fb = GL.framebuffers[framebuffer];
                if (!fb) return 0;
                return GLctx.isFramebuffer(fb)
            }

            function _emscripten_glIsProgram(program) {
                program = GL.programs[program];
                if (!program) return 0;
                return GLctx.isProgram(program)
            }

            function _emscripten_glIsQueryEXT(id) {
                var query = GL.timerQueriesEXT[id];
                if (!query) return 0;
                return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
            }

            function _emscripten_glIsRenderbuffer(renderbuffer) {
                var rb = GL.renderbuffers[renderbuffer];
                if (!rb) return 0;
                return GLctx.isRenderbuffer(rb)
            }

            function _emscripten_glIsShader(shader) {
                var s = GL.shaders[shader];
                if (!s) return 0;
                return GLctx.isShader(s)
            }

            function _emscripten_glIsTexture(id) {
                var texture = GL.textures[id];
                if (!texture) return 0;
                return GLctx.isTexture(texture)
            }

            function _emscripten_glIsVertexArrayOES(array) {
                var vao = GL.vaos[array];
                if (!vao) return 0;
                return GLctx["isVertexArray"](vao)
            }

            function _emscripten_glLineWidth(x0) {
                GLctx["lineWidth"](x0)
            }

            function _emscripten_glLinkProgram(program) {
                GLctx.linkProgram(GL.programs[program]);
                GL.populateUniformTable(program)
            }

            function _emscripten_glPixelStorei(pname, param) {
                if (pname == 3317) {
                    GL.unpackAlignment = param
                }
                GLctx.pixelStorei(pname, param)
            }

            function _emscripten_glPolygonOffset(x0, x1) {
                GLctx["polygonOffset"](x0, x1)
            }

            function _emscripten_glQueryCounterEXT(id, target) {
                GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.timerQueriesEXT[id], target)
            }

            function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
                function roundedToNextMultipleOf(x, y) {
                    return x + y - 1 & -y
                }

                var plainRowSize = width * sizePerPixel;
                var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
                return height * alignedRowSize
            }

            var __colorChannelsInGlTextureFormat = {
                6402: 1,
                6406: 1,
                6407: 3,
                6408: 4,
                6409: 1,
                6410: 2,
                35904: 3,
                35906: 4
            };
            var __sizeOfGlTextureElementType = {
                5121: 1,
                5123: 2,
                5125: 4,
                5126: 4,
                32819: 2,
                32820: 2,
                33635: 2,
                34042: 4,
                36193: 2
            };

            function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
                var sizePerPixel = __colorChannelsInGlTextureFormat[format] * __sizeOfGlTextureElementType[type];
                if (!sizePerPixel) {
                    GL.recordError(1280);
                    return
                }
                var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
                var end = pixels + bytes;
                switch (type) {
                    case 5121:
                        return HEAPU8.subarray(pixels, end);
                    case 5126:
                        return HEAPF32.subarray(pixels >> 2, end >> 2);
                    case 5125:
                    case 34042:
                        return HEAPU32.subarray(pixels >> 2, end >> 2);
                    case 5123:
                    case 33635:
                    case 32819:
                    case 32820:
                    case 36193:
                        return HEAPU16.subarray(pixels >> 1, end >> 1);
                    default:
                        GL.recordError(1280)
                }
            }

            function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
                var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
                if (!pixelData) {
                    GL.recordError(1280);
                    return
                }
                GLctx.readPixels(x, y, width, height, format, type, pixelData)
            }

            function _emscripten_glReleaseShaderCompiler() {}

            function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
                GLctx["renderbufferStorage"](x0, x1, x2, x3)
            }

            function _emscripten_glSampleCoverage(value, invert) {
                GLctx.sampleCoverage(value, !!invert)
            }

            function _emscripten_glScissor(x0, x1, x2, x3) {
                GLctx["scissor"](x0, x1, x2, x3)
            }

            function _emscripten_glShaderBinary() {
                GL.recordError(1280)
            }

            function _emscripten_glShaderSource(shader, count, string, length) {
                var source = GL.getSource(shader, count, string, length);
                GLctx.shaderSource(GL.shaders[shader], source)
            }

            function _emscripten_glStencilFunc(x0, x1, x2) {
                GLctx["stencilFunc"](x0, x1, x2)
            }

            function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
                GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
            }

            function _emscripten_glStencilMask(x0) {
                GLctx["stencilMask"](x0)
            }

            function _emscripten_glStencilMaskSeparate(x0, x1) {
                GLctx["stencilMaskSeparate"](x0, x1)
            }

            function _emscripten_glStencilOp(x0, x1, x2) {
                GLctx["stencilOp"](x0, x1, x2)
            }

            function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
                GLctx["stencilOpSeparate"](x0, x1, x2, x3)
            }

            function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
                GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
            }

            function _emscripten_glTexParameterf(x0, x1, x2) {
                GLctx["texParameterf"](x0, x1, x2)
            }

            function _emscripten_glTexParameterfv(target, pname, params) {
                var param = HEAPF32[params >> 2];
                GLctx.texParameterf(target, pname, param)
            }

            function _emscripten_glTexParameteri(x0, x1, x2) {
                GLctx["texParameteri"](x0, x1, x2)
            }

            function _emscripten_glTexParameteriv(target, pname, params) {
                var param = HEAP32[params >> 2];
                GLctx.texParameteri(target, pname, param)
            }

            function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
                var pixelData = null;
                if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
                GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
            }

            function _emscripten_glUniform1f(location, v0) {
                GLctx.uniform1f(GL.uniforms[location], v0)
            }

            function _emscripten_glUniform1fv(location, count, value) {
                if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[count - 1];
                    for (var i = 0; i < count; ++i) {
                        view[i] = HEAPF32[value + 4 * i >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
                }
                GLctx.uniform1fv(GL.uniforms[location], view)
            }

            function _emscripten_glUniform1i(location, v0) {
                GLctx.uniform1i(GL.uniforms[location], v0)
            }

            function _emscripten_glUniform1iv(location, count, value) {
                GLctx.uniform1iv(GL.uniforms[location], HEAP32.subarray(value >> 2, value + count * 4 >> 2))
            }

            function _emscripten_glUniform2f(location, v0, v1) {
                GLctx.uniform2f(GL.uniforms[location], v0, v1)
            }

            function _emscripten_glUniform2fv(location, count, value) {
                if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[2 * count - 1];
                    for (var i = 0; i < 2 * count; i += 2) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2)
                }
                GLctx.uniform2fv(GL.uniforms[location], view)
            }

            function _emscripten_glUniform2i(location, v0, v1) {
                GLctx.uniform2i(GL.uniforms[location], v0, v1)
            }

            function _emscripten_glUniform2iv(location, count, value) {
                GLctx.uniform2iv(GL.uniforms[location], HEAP32.subarray(value >> 2, value + count * 8 >> 2))
            }

            function _emscripten_glUniform3f(location, v0, v1, v2) {
                GLctx.uniform3f(GL.uniforms[location], v0, v1, v2)
            }

            function _emscripten_glUniform3fv(location, count, value) {
                if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[3 * count - 1];
                    for (var i = 0; i < 3 * count; i += 3) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
                }
                GLctx.uniform3fv(GL.uniforms[location], view)
            }

            function _emscripten_glUniform3i(location, v0, v1, v2) {
                GLctx.uniform3i(GL.uniforms[location], v0, v1, v2)
            }

            function _emscripten_glUniform3iv(location, count, value) {
                GLctx.uniform3iv(GL.uniforms[location], HEAP32.subarray(value >> 2, value + count * 12 >> 2))
            }

            function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
                GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3)
            }

            function _emscripten_glUniform4fv(location, count, value) {
                if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[4 * count - 1];
                    for (var i = 0; i < 4 * count; i += 4) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
                }
                GLctx.uniform4fv(GL.uniforms[location], view)
            }

            function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
                GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3)
            }

            function _emscripten_glUniform4iv(location, count, value) {
                GLctx.uniform4iv(GL.uniforms[location], HEAP32.subarray(value >> 2, value + count * 16 >> 2))
            }

            function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
                if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[4 * count - 1];
                    for (var i = 0; i < 4 * count; i += 4) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
                }
                GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view)
            }

            function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
                if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[9 * count - 1];
                    for (var i = 0; i < 9 * count; i += 9) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
                        view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
                        view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
                        view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
                        view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
                        view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
                }
                GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view)
            }

            function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
                if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
                    var view = GL.miniTempBufferViews[16 * count - 1];
                    for (var i = 0; i < 16 * count; i += 16) {
                        view[i] = HEAPF32[value + 4 * i >> 2];
                        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
                        view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
                        view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
                        view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
                        view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
                        view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
                        view[i + 9] = HEAPF32[value + (4 * i + 36) >> 2];
                        view[i + 10] = HEAPF32[value + (4 * i + 40) >> 2];
                        view[i + 11] = HEAPF32[value + (4 * i + 44) >> 2];
                        view[i + 12] = HEAPF32[value + (4 * i + 48) >> 2];
                        view[i + 13] = HEAPF32[value + (4 * i + 52) >> 2];
                        view[i + 14] = HEAPF32[value + (4 * i + 56) >> 2];
                        view[i + 15] = HEAPF32[value + (4 * i + 60) >> 2]
                    }
                } else {
                    var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
                }
                GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
            }

            function _emscripten_glUseProgram(program) {
                GLctx.useProgram(GL.programs[program])
            }

            function _emscripten_glValidateProgram(program) {
                GLctx.validateProgram(GL.programs[program])
            }

            function _emscripten_glVertexAttrib1f(x0, x1) {
                GLctx["vertexAttrib1f"](x0, x1)
            }

            function _emscripten_glVertexAttrib1fv(index, v) {
                GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
            }

            function _emscripten_glVertexAttrib2f(x0, x1, x2) {
                GLctx["vertexAttrib2f"](x0, x1, x2)
            }

            function _emscripten_glVertexAttrib2fv(index, v) {
                GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
            }

            function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
                GLctx["vertexAttrib3f"](x0, x1, x2, x3)
            }

            function _emscripten_glVertexAttrib3fv(index, v) {
                GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
            }

            function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
                GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
            }

            function _emscripten_glVertexAttrib4fv(index, v) {
                GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
            }

            function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
                GLctx["vertexAttribDivisor"](index, divisor)
            }

            function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
                GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
            }

            function _emscripten_glViewport(x0, x1, x2, x3) {
                GLctx["viewport"](x0, x1, x2, x3)
            }

            function __emscripten_do_request_fullscreen(target, strategy) {
                if (typeof JSEvents.fullscreenEnabled() === "undefined") return -1;
                if (!JSEvents.fullscreenEnabled()) return -3;
                if (!target) target = "#canvas";
                target = __findEventTarget(target);
                if (!target) return -4;
                if (!target.requestFullscreen && !target.msRequestFullscreen && !target.mozRequestFullScreen && !target.mozRequestFullscreen && !target.webkitRequestFullscreen) {
                    return -3
                }
                var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
                if (!canPerformRequests) {
                    if (strategy.deferUntilInEventHandler) {
                        JSEvents.deferCall(_JSEvents_requestFullscreen, 1, [target, strategy]);
                        return 1
                    } else {
                        return -2
                    }
                }
                return _JSEvents_requestFullscreen(target, strategy)
            }

            function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
                var strategy = {};
                strategy.scaleMode = HEAP32[fullscreenStrategy >> 2];
                strategy.canvasResolutionScaleMode = HEAP32[fullscreenStrategy + 4 >> 2];
                strategy.filteringMode = HEAP32[fullscreenStrategy + 8 >> 2];
                strategy.deferUntilInEventHandler = deferUntilInEventHandler;
                strategy.canvasResizedCallback = HEAP32[fullscreenStrategy + 12 >> 2];
                strategy.canvasResizedCallbackUserData = HEAP32[fullscreenStrategy + 16 >> 2];
                __currentFullscreenStrategy = strategy;
                return __emscripten_do_request_fullscreen(target, strategy)
            }

            function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
                if (!target) target = "#canvas";
                target = __findEventTarget(target);
                if (!target) return -4;
                if (!target.requestPointerLock && !target.mozRequestPointerLock && !target.webkitRequestPointerLock && !target.msRequestPointerLock) {
                    return -1
                }
                var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
                if (!canPerformRequests) {
                    if (deferUntilInEventHandler) {
                        JSEvents.deferCall(__requestPointerLock, 2, [target]);
                        return 1
                    } else {
                        return -2
                    }
                }
                return __requestPointerLock(target)
            }

            function abortOnCannotGrowMemory(requestedSize) {
                abort("OOM")
            }

            function emscripten_realloc_buffer(size) {
                var PAGE_MULTIPLE = 65536;
                size = alignUp(size, PAGE_MULTIPLE);
                var old = Module["buffer"];
                var oldSize = old.byteLength;
                try {
                    var result = wasmMemory.grow((size - oldSize) / 65536);
                    if (result !== (-1 | 0)) {
                        return Module["buffer"] = wasmMemory.buffer
                    } else {
                        return null
                    }
                } catch (e) {
                    return null
                }
            }

            function _emscripten_resize_heap(requestedSize) {
                var oldSize = _emscripten_get_heap_size();
                var PAGE_MULTIPLE = 65536;
                var LIMIT = 2147483648 - PAGE_MULTIPLE;
                if (requestedSize > LIMIT) {
                    return false
                }
                var MIN_TOTAL_MEMORY = 16777216;
                var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
                while (newSize < requestedSize) {
                    if (newSize <= 536870912) {
                        newSize = alignUp(2 * newSize, PAGE_MULTIPLE)
                    } else {
                        newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
                    }
                }
                var replacement = emscripten_realloc_buffer(newSize);
                if (!replacement || replacement.byteLength != newSize) {
                    return false
                }
                updateGlobalBuffer(replacement);
                updateGlobalBufferViews();
                TOTAL_MEMORY = newSize;
                HEAPU32[DYNAMICTOP_PTR >> 2] = requestedSize;
                return true
            }

            function _emscripten_sample_gamepad_data() {
                return (JSEvents.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null) ? 0 : -1
            }

            function __registerFocusEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.focusEvent) JSEvents.focusEvent = _malloc(256);
                var focusEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var nodeName = JSEvents.getNodeNameForTarget(e.target);
                    var id = e.target.id ? e.target.id : "";
                    var focusEvent = JSEvents.focusEvent;
                    stringToUTF8(nodeName, focusEvent + 0, 128);
                    stringToUTF8(id, focusEvent + 128, 128);
                    if (dynCall_iiii(callbackfunc, eventTypeId, focusEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: __findEventTarget(target),
                    allowsDeferredCalls: false,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: focusEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
                return 0
            }

            function _emscripten_set_element_css_size(target, width, height) {
                target = target ? __findEventTarget(target) : Module["canvas"];
                if (!target) return -4;
                target.style.width = width + "px";
                target.style.height = height + "px";
                return 0
            }

            function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
                return 0
            }

            function __fillFullscreenChangeEventData(eventStruct, e) {
                var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
                var isFullscreen = !!fullscreenElement;
                HEAP32[eventStruct >> 2] = isFullscreen;
                HEAP32[eventStruct + 4 >> 2] = JSEvents.fullscreenEnabled();
                var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
                var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
                var id = reportedElement && reportedElement.id ? reportedElement.id : "";
                stringToUTF8(nodeName, eventStruct + 8, 128);
                stringToUTF8(id, eventStruct + 136, 128);
                HEAP32[eventStruct + 264 >> 2] = reportedElement ? reportedElement.clientWidth : 0;
                HEAP32[eventStruct + 268 >> 2] = reportedElement ? reportedElement.clientHeight : 0;
                HEAP32[eventStruct + 272 >> 2] = screen.width;
                HEAP32[eventStruct + 276 >> 2] = screen.height;
                if (isFullscreen) {
                    JSEvents.previousFullscreenElement = fullscreenElement
                }
            }

            function __registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc(280);
                var fullscreenChangeEventhandlerFunc = function(event) {
                    var e = event || window.event;
                    var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
                    __fillFullscreenChangeEventData(fullscreenChangeEvent, e);
                    if (dynCall_iiii(callbackfunc, eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: false,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: fullscreenChangeEventhandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                if (typeof JSEvents.fullscreenEnabled() === "undefined") return -1;
                target = target ? __findEventTarget(target) : __specialEventTargets[1];
                if (!target) return -4;
                __registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
                __registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "mozfullscreenchange", targetThread);
                __registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
                __registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "msfullscreenchange", targetThread);
                return 0
            }

            function __registerGamepadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc(1432);
                var gamepadEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var gamepadEvent = JSEvents.gamepadEvent;
                    __fillGamepadEventData(gamepadEvent, e.gamepad);
                    if (dynCall_iiii(callbackfunc, eventTypeId, gamepadEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: __findEventTarget(target),
                    allowsDeferredCalls: true,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: gamepadEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
                if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
                __registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
                return 0
            }

            function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
                if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
                __registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
                return 0
            }

            function __registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(164);
                var keyEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var keyEventData = JSEvents.keyEvent;
                    stringToUTF8(e.key ? e.key : "", keyEventData + 0, 32);
                    stringToUTF8(e.code ? e.code : "", keyEventData + 32, 32);
                    HEAP32[keyEventData + 64 >> 2] = e.location;
                    HEAP32[keyEventData + 68 >> 2] = e.ctrlKey;
                    HEAP32[keyEventData + 72 >> 2] = e.shiftKey;
                    HEAP32[keyEventData + 76 >> 2] = e.altKey;
                    HEAP32[keyEventData + 80 >> 2] = e.metaKey;
                    HEAP32[keyEventData + 84 >> 2] = e.repeat;
                    stringToUTF8(e.locale ? e.locale : "", keyEventData + 88, 32);
                    stringToUTF8(e.char ? e.char : "", keyEventData + 120, 32);
                    HEAP32[keyEventData + 152 >> 2] = e.charCode;
                    HEAP32[keyEventData + 156 >> 2] = e.keyCode;
                    HEAP32[keyEventData + 160 >> 2] = e.which;
                    if (dynCall_iiii(callbackfunc, eventTypeId, keyEventData, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: __findEventTarget(target),
                    allowsDeferredCalls: JSEvents.isInternetExplorer() ? false : true,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: keyEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
                return 0
            }

            function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
                return 0
            }

            function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
                return 0
            }

            function __fillMouseEventData(eventStruct, e, target) {
                HEAPF64[eventStruct >> 3] = JSEvents.tick();
                HEAP32[eventStruct + 8 >> 2] = e.screenX;
                HEAP32[eventStruct + 12 >> 2] = e.screenY;
                HEAP32[eventStruct + 16 >> 2] = e.clientX;
                HEAP32[eventStruct + 20 >> 2] = e.clientY;
                HEAP32[eventStruct + 24 >> 2] = e.ctrlKey;
                HEAP32[eventStruct + 28 >> 2] = e.shiftKey;
                HEAP32[eventStruct + 32 >> 2] = e.altKey;
                HEAP32[eventStruct + 36 >> 2] = e.metaKey;
                HEAP16[eventStruct + 40 >> 1] = e.button;
                HEAP16[eventStruct + 42 >> 1] = e.buttons;
                HEAP32[eventStruct + 44 >> 2] = e["movementX"] || e["mozMovementX"] || e["webkitMovementX"] || e.screenX - JSEvents.previousScreenX;
                HEAP32[eventStruct + 48 >> 2] = e["movementY"] || e["mozMovementY"] || e["webkitMovementY"] || e.screenY - JSEvents.previousScreenY;
                if (Module["canvas"]) {
                    var rect = Module["canvas"].getBoundingClientRect();
                    HEAP32[eventStruct + 60 >> 2] = e.clientX - rect.left;
                    HEAP32[eventStruct + 64 >> 2] = e.clientY - rect.top
                } else {
                    HEAP32[eventStruct + 60 >> 2] = 0;
                    HEAP32[eventStruct + 64 >> 2] = 0
                }
                if (target) {
                    var rect = JSEvents.getBoundingClientRectOrZeros(target);
                    HEAP32[eventStruct + 52 >> 2] = e.clientX - rect.left;
                    HEAP32[eventStruct + 56 >> 2] = e.clientY - rect.top
                } else {
                    HEAP32[eventStruct + 52 >> 2] = 0;
                    HEAP32[eventStruct + 56 >> 2] = 0
                }
                if (e.type !== "wheel" && e.type !== "mousewheel") {
                    JSEvents.previousScreenX = e.screenX;
                    JSEvents.previousScreenY = e.screenY
                }
            }

            function __registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(72);
                target = __findEventTarget(target);
                var mouseEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    __fillMouseEventData(JSEvents.mouseEvent, e, target);
                    if (dynCall_iiii(callbackfunc, eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: mouseEventHandlerFunc,
                    useCapture: useCapture
                };
                if (JSEvents.isInternetExplorer() && eventTypeString == "mousedown") eventHandler.allowsDeferredCalls = false;
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
                return 0
            }

            function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
                return 0
            }

            function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
                return 0
            }

            function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
                return 0
            }

            function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
                return 0
            }

            function __fillPointerlockChangeEventData(eventStruct, e) {
                var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
                var isPointerlocked = !!pointerLockElement;
                HEAP32[eventStruct >> 2] = isPointerlocked;
                var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
                var id = pointerLockElement && pointerLockElement.id ? pointerLockElement.id : "";
                stringToUTF8(nodeName, eventStruct + 4, 128);
                stringToUTF8(id, eventStruct + 132, 128)
            }

            function __registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.pointerlockChangeEvent) JSEvents.pointerlockChangeEvent = _malloc(260);
                var pointerlockChangeEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
                    __fillPointerlockChangeEventData(pointerlockChangeEvent, e);
                    if (dynCall_iiii(callbackfunc, eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: false,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: pointerlockChangeEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                if (!document || !document.body || !document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock) {
                    return -1
                }
                target = target ? __findEventTarget(target) : __specialEventTargets[1];
                if (!target) return -4;
                __registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
                __registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mozpointerlockchange", targetThread);
                __registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "webkitpointerlockchange", targetThread);
                __registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mspointerlockchange", targetThread);
                return 0
            }

            function __registerUiEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc(36);
                if (eventTypeString == "scroll" && !target) {
                    target = document
                } else {
                    target = __findEventTarget(target)
                }
                var uiEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    if (e.target != target) {
                        return
                    }
                    var scrollPos = JSEvents.pageScrollPos();
                    var uiEvent = JSEvents.uiEvent;
                    HEAP32[uiEvent >> 2] = e.detail;
                    HEAP32[uiEvent + 4 >> 2] = document.body.clientWidth;
                    HEAP32[uiEvent + 8 >> 2] = document.body.clientHeight;
                    HEAP32[uiEvent + 12 >> 2] = window.innerWidth;
                    HEAP32[uiEvent + 16 >> 2] = window.innerHeight;
                    HEAP32[uiEvent + 20 >> 2] = window.outerWidth;
                    HEAP32[uiEvent + 24 >> 2] = window.outerHeight;
                    HEAP32[uiEvent + 28 >> 2] = scrollPos[0];
                    HEAP32[uiEvent + 32 >> 2] = scrollPos[1];
                    if (dynCall_iiii(callbackfunc, eventTypeId, uiEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: false,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: uiEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
                return 0
            }

            function __registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1684);
                target = __findEventTarget(target);
                var touchEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var touches = {};
                    for (var i = 0; i < e.touches.length; ++i) {
                        var touch = e.touches[i];
                        touches[touch.identifier] = touch
                    }
                    for (var i = 0; i < e.changedTouches.length; ++i) {
                        var touch = e.changedTouches[i];
                        touches[touch.identifier] = touch;
                        touch.changed = true
                    }
                    for (var i = 0; i < e.targetTouches.length; ++i) {
                        var touch = e.targetTouches[i];
                        touches[touch.identifier].onTarget = true
                    }
                    var touchEvent = JSEvents.touchEvent;
                    var ptr = touchEvent;
                    HEAP32[ptr + 4 >> 2] = e.ctrlKey;
                    HEAP32[ptr + 8 >> 2] = e.shiftKey;
                    HEAP32[ptr + 12 >> 2] = e.altKey;
                    HEAP32[ptr + 16 >> 2] = e.metaKey;
                    ptr += 20;
                    var canvasRect = Module["canvas"] ? Module["canvas"].getBoundingClientRect() : undefined;
                    var targetRect = JSEvents.getBoundingClientRectOrZeros(target);
                    var numTouches = 0;
                    for (var i in touches) {
                        var t = touches[i];
                        HEAP32[ptr >> 2] = t.identifier;
                        HEAP32[ptr + 4 >> 2] = t.screenX;
                        HEAP32[ptr + 8 >> 2] = t.screenY;
                        HEAP32[ptr + 12 >> 2] = t.clientX;
                        HEAP32[ptr + 16 >> 2] = t.clientY;
                        HEAP32[ptr + 20 >> 2] = t.pageX;
                        HEAP32[ptr + 24 >> 2] = t.pageY;
                        HEAP32[ptr + 28 >> 2] = t.changed;
                        HEAP32[ptr + 32 >> 2] = t.onTarget;
                        if (canvasRect) {
                            HEAP32[ptr + 44 >> 2] = t.clientX - canvasRect.left;
                            HEAP32[ptr + 48 >> 2] = t.clientY - canvasRect.top
                        } else {
                            HEAP32[ptr + 44 >> 2] = 0;
                            HEAP32[ptr + 48 >> 2] = 0
                        }
                        HEAP32[ptr + 36 >> 2] = t.clientX - targetRect.left;
                        HEAP32[ptr + 40 >> 2] = t.clientY - targetRect.top;
                        ptr += 52;
                        if (++numTouches >= 32) {
                            break
                        }
                    }
                    HEAP32[touchEvent >> 2] = numTouches;
                    if (dynCall_iiii(callbackfunc, eventTypeId, touchEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: touchEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
                return 0
            }

            function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
                return 0
            }

            function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
                return 0
            }

            function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
                return 0
            }

            function __fillVisibilityChangeEventData(eventStruct, e) {
                var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
                var visibilityState = visibilityStates.indexOf(document.visibilityState);
                HEAP32[eventStruct >> 2] = document.hidden;
                HEAP32[eventStruct + 4 >> 2] = visibilityState
            }

            function __registerVisibilityChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc(8);
                var visibilityChangeEventHandlerFunc = function(event) {
                    var e = event || window.event;
                    var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
                    __fillVisibilityChangeEventData(visibilityChangeEvent, e);
                    if (dynCall_iiii(callbackfunc, eventTypeId, visibilityChangeEvent, userData)) e.preventDefault()
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: false,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: visibilityChangeEventHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
                if (!__specialEventTargets[1]) {
                    return -4
                }
                __registerVisibilityChangeEventCallback(__specialEventTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
                return 0
            }

            function __registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
                if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
                var wheelHandlerFunc = function(event) {
                    var e = event || window.event;
                    var wheelEvent = JSEvents.wheelEvent;
                    __fillMouseEventData(wheelEvent, e, target);
                    HEAPF64[wheelEvent + 72 >> 3] = e["deltaX"];
                    HEAPF64[wheelEvent + 80 >> 3] = e["deltaY"];
                    HEAPF64[wheelEvent + 88 >> 3] = e["deltaZ"];
                    HEAP32[wheelEvent + 96 >> 2] = e["deltaMode"];
                    if (dynCall_iiii(callbackfunc, eventTypeId, wheelEvent, userData)) e.preventDefault()
                };
                var mouseWheelHandlerFunc = function(event) {
                    var e = event || window.event;
                    __fillMouseEventData(JSEvents.wheelEvent, e, target);
                    HEAPF64[JSEvents.wheelEvent + 72 >> 3] = e["wheelDeltaX"] || 0;
                    HEAPF64[JSEvents.wheelEvent + 80 >> 3] = -(e["wheelDeltaY"] ? e["wheelDeltaY"] : e["wheelDelta"]);
                    HEAPF64[JSEvents.wheelEvent + 88 >> 3] = 0;
                    HEAP32[JSEvents.wheelEvent + 96 >> 2] = 0;
                    var shouldCancel = dynCall_iiii(callbackfunc, eventTypeId, JSEvents.wheelEvent, userData);
                    if (shouldCancel) {
                        e.preventDefault()
                    }
                };
                var eventHandler = {
                    target: target,
                    allowsDeferredCalls: true,
                    eventTypeString: eventTypeString,
                    callbackfunc: callbackfunc,
                    handlerFunc: eventTypeString == "wheel" ? wheelHandlerFunc : mouseWheelHandlerFunc,
                    useCapture: useCapture
                };
                JSEvents.registerOrRemoveHandler(eventHandler)
            }

            function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
                target = __findEventTarget(target);
                if (typeof target.onwheel !== "undefined") {
                    __registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
                    return 0
                } else if (typeof target.onmousewheel !== "undefined") {
                    __registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "mousewheel", targetThread);
                    return 0
                } else {
                    return -1
                }
            }

            function _getenv(name) {
                if (name === 0) return 0;
                name = UTF8ToString(name);
                if (!ENV.hasOwnProperty(name)) return 0;
                if (_getenv.ret) _free(_getenv.ret);
                _getenv.ret = allocateUTF8(ENV[name]);
                return _getenv.ret
            }

            function _gettimeofday(ptr) {
                var now = Date.now();
                HEAP32[ptr >> 2] = now / 1e3 | 0;
                HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
                return 0
            }

            function _emscripten_memcpy_big(dest, src, num) {
                HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
            }

            function _usleep(useconds) {
                var msec = useconds / 1e3;
                if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]) {
                    var start = self["performance"]["now"]();
                    while (self["performance"]["now"]() - start < msec) {}
                } else {
                    var start = Date.now();
                    while (Date.now() - start < msec) {}
                }
                return 0
            }

            function _nanosleep(rqtp, rmtp) {
                var seconds = HEAP32[rqtp >> 2];
                var nanoseconds = HEAP32[rqtp + 4 >> 2];
                if (rmtp !== 0) {
                    HEAP32[rmtp >> 2] = 0;
                    HEAP32[rmtp + 4 >> 2] = 0
                }
                return _usleep(seconds * 1e6 + nanoseconds / 1e3)
            }

            function _sigaction(signum, act, oldact) {
                return 0
            }

            var __sigalrm_handler = 0;

            function _signal(sig, func) {
                if (sig == 14) {
                    __sigalrm_handler = func
                } else {}
                return 0
            }

            FS.staticInit();
            if (ENVIRONMENT_IS_NODE) {
                var fs = require("fs");
                var NODEJS_PATH = require("path");
                NODEFS.staticInit()
            }
            if (ENVIRONMENT_IS_NODE) {
                _emscripten_get_now = function _emscripten_get_now_actual() {
                    var t = process["hrtime"]();
                    return t[0] * 1e3 + t[1] / 1e6
                }
            } else if (typeof dateNow !== "undefined") {
                _emscripten_get_now = dateNow
            } else if (typeof self === "object" && self["performance"] && typeof self["performance"]["now"] === "function") {
                _emscripten_get_now = function() {
                    return self["performance"]["now"]()
                }
            } else if (typeof performance === "object" && typeof performance["now"] === "function") {
                _emscripten_get_now = function() {
                    return performance["now"]()
                }
            } else {
                _emscripten_get_now = Date.now
            }
            Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
                err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead.");
                Module["requestFullScreen"] = Module["requestFullscreen"];
                Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice)
            };
            Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) {
                Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
            };
            Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
                Browser.requestAnimationFrame(func)
            };
            Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
                Browser.setCanvasSize(width, height, noUpdates)
            };
            Module["pauseMainLoop"] = function Module_pauseMainLoop() {
                Browser.mainLoop.pause()
            };
            Module["resumeMainLoop"] = function Module_resumeMainLoop() {
                Browser.mainLoop.resume()
            };
            Module["getUserMedia"] = function Module_getUserMedia() {
                Browser.getUserMedia()
            };
            Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
                return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
            };
            var GLctx;
            GL.init();
            for (var i = 0; i < 32; i++) __tempFixedLengthArray.push(new Array(i));
            var ASSERTIONS = false;

            function intArrayFromString(stringy, dontAddNull, length) {
                var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
                var u8array = new Array(len);
                var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
                if (dontAddNull) u8array.length = numBytesWritten;
                return u8array
            }

            var asmGlobalArg = {};
            var asmLibraryArg = {
                "abort": abort,
                "setTempRet0": setTempRet0,
                "getTempRet0": getTempRet0,
                "_JSEvents_requestFullscreen": _JSEvents_requestFullscreen,
                "_JSEvents_resizeCanvasForFullscreen": _JSEvents_resizeCanvasForFullscreen,
                "___buildEnvironment": ___buildEnvironment,
                "___lock": ___lock,
                "___setErrNo": ___setErrNo,
                "___syscall140": ___syscall140,
                "___syscall145": ___syscall145,
                "___syscall146": ___syscall146,
                "___syscall221": ___syscall221,
                "___syscall5": ___syscall5,
                "___syscall54": ___syscall54,
                "___syscall6": ___syscall6,
                "___unlock": ___unlock,
                "__computeUnpackAlignedImageSize": __computeUnpackAlignedImageSize,
                "__emscripten_do_request_fullscreen": __emscripten_do_request_fullscreen,
                "__fillFullscreenChangeEventData": __fillFullscreenChangeEventData,
                "__fillGamepadEventData": __fillGamepadEventData,
                "__fillMouseEventData": __fillMouseEventData,
                "__fillPointerlockChangeEventData": __fillPointerlockChangeEventData,
                "__fillVisibilityChangeEventData": __fillVisibilityChangeEventData,
                "__findCanvasEventTarget": __findCanvasEventTarget,
                "__findEventTarget": __findEventTarget,
                "__get_canvas_element_size": __get_canvas_element_size,
                "__glGenObject": __glGenObject,
                "__registerFocusEventCallback": __registerFocusEventCallback,
                "__registerFullscreenChangeEventCallback": __registerFullscreenChangeEventCallback,
                "__registerGamepadEventCallback": __registerGamepadEventCallback,
                "__registerKeyEventCallback": __registerKeyEventCallback,
                "__registerMouseEventCallback": __registerMouseEventCallback,
                "__registerPointerlockChangeEventCallback": __registerPointerlockChangeEventCallback,
                "__registerRestoreOldStyle": __registerRestoreOldStyle,
                "__registerTouchEventCallback": __registerTouchEventCallback,
                "__registerUiEventCallback": __registerUiEventCallback,
                "__registerVisibilityChangeEventCallback": __registerVisibilityChangeEventCallback,
                "__registerWheelEventCallback": __registerWheelEventCallback,
                "__requestPointerLock": __requestPointerLock,
                "__setLetterbox": __setLetterbox,
                "__set_canvas_element_size": __set_canvas_element_size,
                "_clock_gettime": _clock_gettime,
                "_dlclose": _dlclose,
                "_dlerror": _dlerror,
                "_dlopen": _dlopen,
                "_dlsym": _dlsym,
                "_eglBindAPI": _eglBindAPI,
                "_eglChooseConfig": _eglChooseConfig,
                "_eglCreateContext": _eglCreateContext,
                "_eglCreateWindowSurface": _eglCreateWindowSurface,
                "_eglDestroyContext": _eglDestroyContext,
                "_eglDestroySurface": _eglDestroySurface,
                "_eglGetConfigAttrib": _eglGetConfigAttrib,
                "_eglGetDisplay": _eglGetDisplay,
                "_eglGetError": _eglGetError,
                "_eglGetProcAddress": _eglGetProcAddress,
                "_eglInitialize": _eglInitialize,
                "_eglMakeCurrent": _eglMakeCurrent,
                "_eglQueryString": _eglQueryString,
                "_eglSwapBuffers": _eglSwapBuffers,
                "_eglSwapInterval": _eglSwapInterval,
                "_eglTerminate": _eglTerminate,
                "_eglWaitClient": _eglWaitClient,
                "_eglWaitGL": _eglWaitGL,
                "_eglWaitNative": _eglWaitNative,
                "_emscripten_asm_const_i": _emscripten_asm_const_i,
                "_emscripten_asm_const_ii": _emscripten_asm_const_ii,
                "_emscripten_asm_const_iii": _emscripten_asm_const_iii,
                "_emscripten_asm_const_iiii": _emscripten_asm_const_iiii,
                "_emscripten_asm_const_iiiii": _emscripten_asm_const_iiiii,
                "_emscripten_asm_const_iiiiii": _emscripten_asm_const_iiiiii,
                "_emscripten_exit_fullscreen": _emscripten_exit_fullscreen,
                "_emscripten_exit_pointerlock": _emscripten_exit_pointerlock,
                "_emscripten_get_canvas_element_size": _emscripten_get_canvas_element_size,
                "_emscripten_get_device_pixel_ratio": _emscripten_get_device_pixel_ratio,
                "_emscripten_get_element_css_size": _emscripten_get_element_css_size,
                "_emscripten_get_gamepad_status": _emscripten_get_gamepad_status,
                "_emscripten_get_heap_size": _emscripten_get_heap_size,
                "_emscripten_get_now": _emscripten_get_now,
                "_emscripten_get_now_is_monotonic": _emscripten_get_now_is_monotonic,
                "_emscripten_get_num_gamepads": _emscripten_get_num_gamepads,
                "_emscripten_glActiveTexture": _emscripten_glActiveTexture,
                "_emscripten_glAttachShader": _emscripten_glAttachShader,
                "_emscripten_glBeginQueryEXT": _emscripten_glBeginQueryEXT,
                "_emscripten_glBindAttribLocation": _emscripten_glBindAttribLocation,
                "_emscripten_glBindBuffer": _emscripten_glBindBuffer,
                "_emscripten_glBindFramebuffer": _emscripten_glBindFramebuffer,
                "_emscripten_glBindRenderbuffer": _emscripten_glBindRenderbuffer,
                "_emscripten_glBindTexture": _emscripten_glBindTexture,
                "_emscripten_glBindVertexArrayOES": _emscripten_glBindVertexArrayOES,
                "_emscripten_glBlendColor": _emscripten_glBlendColor,
                "_emscripten_glBlendEquation": _emscripten_glBlendEquation,
                "_emscripten_glBlendEquationSeparate": _emscripten_glBlendEquationSeparate,
                "_emscripten_glBlendFunc": _emscripten_glBlendFunc,
                "_emscripten_glBlendFuncSeparate": _emscripten_glBlendFuncSeparate,
                "_emscripten_glBufferData": _emscripten_glBufferData,
                "_emscripten_glBufferSubData": _emscripten_glBufferSubData,
                "_emscripten_glCheckFramebufferStatus": _emscripten_glCheckFramebufferStatus,
                "_emscripten_glClear": _emscripten_glClear,
                "_emscripten_glClearColor": _emscripten_glClearColor,
                "_emscripten_glClearDepthf": _emscripten_glClearDepthf,
                "_emscripten_glClearStencil": _emscripten_glClearStencil,
                "_emscripten_glColorMask": _emscripten_glColorMask,
                "_emscripten_glCompileShader": _emscripten_glCompileShader,
                "_emscripten_glCompressedTexImage2D": _emscripten_glCompressedTexImage2D,
                "_emscripten_glCompressedTexSubImage2D": _emscripten_glCompressedTexSubImage2D,
                "_emscripten_glCopyTexImage2D": _emscripten_glCopyTexImage2D,
                "_emscripten_glCopyTexSubImage2D": _emscripten_glCopyTexSubImage2D,
                "_emscripten_glCreateProgram": _emscripten_glCreateProgram,
                "_emscripten_glCreateShader": _emscripten_glCreateShader,
                "_emscripten_glCullFace": _emscripten_glCullFace,
                "_emscripten_glDeleteBuffers": _emscripten_glDeleteBuffers,
                "_emscripten_glDeleteFramebuffers": _emscripten_glDeleteFramebuffers,
                "_emscripten_glDeleteProgram": _emscripten_glDeleteProgram,
                "_emscripten_glDeleteQueriesEXT": _emscripten_glDeleteQueriesEXT,
                "_emscripten_glDeleteRenderbuffers": _emscripten_glDeleteRenderbuffers,
                "_emscripten_glDeleteShader": _emscripten_glDeleteShader,
                "_emscripten_glDeleteTextures": _emscripten_glDeleteTextures,
                "_emscripten_glDeleteVertexArraysOES": _emscripten_glDeleteVertexArraysOES,
                "_emscripten_glDepthFunc": _emscripten_glDepthFunc,
                "_emscripten_glDepthMask": _emscripten_glDepthMask,
                "_emscripten_glDepthRangef": _emscripten_glDepthRangef,
                "_emscripten_glDetachShader": _emscripten_glDetachShader,
                "_emscripten_glDisable": _emscripten_glDisable,
                "_emscripten_glDisableVertexAttribArray": _emscripten_glDisableVertexAttribArray,
                "_emscripten_glDrawArrays": _emscripten_glDrawArrays,
                "_emscripten_glDrawArraysInstancedANGLE": _emscripten_glDrawArraysInstancedANGLE,
                "_emscripten_glDrawBuffersWEBGL": _emscripten_glDrawBuffersWEBGL,
                "_emscripten_glDrawElements": _emscripten_glDrawElements,
                "_emscripten_glDrawElementsInstancedANGLE": _emscripten_glDrawElementsInstancedANGLE,
                "_emscripten_glEnable": _emscripten_glEnable,
                "_emscripten_glEnableVertexAttribArray": _emscripten_glEnableVertexAttribArray,
                "_emscripten_glEndQueryEXT": _emscripten_glEndQueryEXT,
                "_emscripten_glFinish": _emscripten_glFinish,
                "_emscripten_glFlush": _emscripten_glFlush,
                "_emscripten_glFramebufferRenderbuffer": _emscripten_glFramebufferRenderbuffer,
                "_emscripten_glFramebufferTexture2D": _emscripten_glFramebufferTexture2D,
                "_emscripten_glFrontFace": _emscripten_glFrontFace,
                "_emscripten_glGenBuffers": _emscripten_glGenBuffers,
                "_emscripten_glGenFramebuffers": _emscripten_glGenFramebuffers,
                "_emscripten_glGenQueriesEXT": _emscripten_glGenQueriesEXT,
                "_emscripten_glGenRenderbuffers": _emscripten_glGenRenderbuffers,
                "_emscripten_glGenTextures": _emscripten_glGenTextures,
                "_emscripten_glGenVertexArraysOES": _emscripten_glGenVertexArraysOES,
                "_emscripten_glGenerateMipmap": _emscripten_glGenerateMipmap,
                "_emscripten_glGetActiveAttrib": _emscripten_glGetActiveAttrib,
                "_emscripten_glGetActiveUniform": _emscripten_glGetActiveUniform,
                "_emscripten_glGetAttachedShaders": _emscripten_glGetAttachedShaders,
                "_emscripten_glGetAttribLocation": _emscripten_glGetAttribLocation,
                "_emscripten_glGetBooleanv": _emscripten_glGetBooleanv,
                "_emscripten_glGetBufferParameteriv": _emscripten_glGetBufferParameteriv,
                "_emscripten_glGetError": _emscripten_glGetError,
                "_emscripten_glGetFloatv": _emscripten_glGetFloatv,
                "_emscripten_glGetFramebufferAttachmentParameteriv": _emscripten_glGetFramebufferAttachmentParameteriv,
                "_emscripten_glGetIntegerv": _emscripten_glGetIntegerv,
                "_emscripten_glGetProgramInfoLog": _emscripten_glGetProgramInfoLog,
                "_emscripten_glGetProgramiv": _emscripten_glGetProgramiv,
                "_emscripten_glGetQueryObjecti64vEXT": _emscripten_glGetQueryObjecti64vEXT,
                "_emscripten_glGetQueryObjectivEXT": _emscripten_glGetQueryObjectivEXT,
                "_emscripten_glGetQueryObjectui64vEXT": _emscripten_glGetQueryObjectui64vEXT,
                "_emscripten_glGetQueryObjectuivEXT": _emscripten_glGetQueryObjectuivEXT,
                "_emscripten_glGetQueryivEXT": _emscripten_glGetQueryivEXT,
                "_emscripten_glGetRenderbufferParameteriv": _emscripten_glGetRenderbufferParameteriv,
                "_emscripten_glGetShaderInfoLog": _emscripten_glGetShaderInfoLog,
                "_emscripten_glGetShaderPrecisionFormat": _emscripten_glGetShaderPrecisionFormat,
                "_emscripten_glGetShaderSource": _emscripten_glGetShaderSource,
                "_emscripten_glGetShaderiv": _emscripten_glGetShaderiv,
                "_emscripten_glGetString": _emscripten_glGetString,
                "_emscripten_glGetTexParameterfv": _emscripten_glGetTexParameterfv,
                "_emscripten_glGetTexParameteriv": _emscripten_glGetTexParameteriv,
                "_emscripten_glGetUniformLocation": _emscripten_glGetUniformLocation,
                "_emscripten_glGetUniformfv": _emscripten_glGetUniformfv,
                "_emscripten_glGetUniformiv": _emscripten_glGetUniformiv,
                "_emscripten_glGetVertexAttribPointerv": _emscripten_glGetVertexAttribPointerv,
                "_emscripten_glGetVertexAttribfv": _emscripten_glGetVertexAttribfv,
                "_emscripten_glGetVertexAttribiv": _emscripten_glGetVertexAttribiv,
                "_emscripten_glHint": _emscripten_glHint,
                "_emscripten_glIsBuffer": _emscripten_glIsBuffer,
                "_emscripten_glIsEnabled": _emscripten_glIsEnabled,
                "_emscripten_glIsFramebuffer": _emscripten_glIsFramebuffer,
                "_emscripten_glIsProgram": _emscripten_glIsProgram,
                "_emscripten_glIsQueryEXT": _emscripten_glIsQueryEXT,
                "_emscripten_glIsRenderbuffer": _emscripten_glIsRenderbuffer,
                "_emscripten_glIsShader": _emscripten_glIsShader,
                "_emscripten_glIsTexture": _emscripten_glIsTexture,
                "_emscripten_glIsVertexArrayOES": _emscripten_glIsVertexArrayOES,
                "_emscripten_glLineWidth": _emscripten_glLineWidth,
                "_emscripten_glLinkProgram": _emscripten_glLinkProgram,
                "_emscripten_glPixelStorei": _emscripten_glPixelStorei,
                "_emscripten_glPolygonOffset": _emscripten_glPolygonOffset,
                "_emscripten_glQueryCounterEXT": _emscripten_glQueryCounterEXT,
                "_emscripten_glReadPixels": _emscripten_glReadPixels,
                "_emscripten_glReleaseShaderCompiler": _emscripten_glReleaseShaderCompiler,
                "_emscripten_glRenderbufferStorage": _emscripten_glRenderbufferStorage,
                "_emscripten_glSampleCoverage": _emscripten_glSampleCoverage,
                "_emscripten_glScissor": _emscripten_glScissor,
                "_emscripten_glShaderBinary": _emscripten_glShaderBinary,
                "_emscripten_glShaderSource": _emscripten_glShaderSource,
                "_emscripten_glStencilFunc": _emscripten_glStencilFunc,
                "_emscripten_glStencilFuncSeparate": _emscripten_glStencilFuncSeparate,
                "_emscripten_glStencilMask": _emscripten_glStencilMask,
                "_emscripten_glStencilMaskSeparate": _emscripten_glStencilMaskSeparate,
                "_emscripten_glStencilOp": _emscripten_glStencilOp,
                "_emscripten_glStencilOpSeparate": _emscripten_glStencilOpSeparate,
                "_emscripten_glTexImage2D": _emscripten_glTexImage2D,
                "_emscripten_glTexParameterf": _emscripten_glTexParameterf,
                "_emscripten_glTexParameterfv": _emscripten_glTexParameterfv,
                "_emscripten_glTexParameteri": _emscripten_glTexParameteri,
                "_emscripten_glTexParameteriv": _emscripten_glTexParameteriv,
                "_emscripten_glTexSubImage2D": _emscripten_glTexSubImage2D,
                "_emscripten_glUniform1f": _emscripten_glUniform1f,
                "_emscripten_glUniform1fv": _emscripten_glUniform1fv,
                "_emscripten_glUniform1i": _emscripten_glUniform1i,
                "_emscripten_glUniform1iv": _emscripten_glUniform1iv,
                "_emscripten_glUniform2f": _emscripten_glUniform2f,
                "_emscripten_glUniform2fv": _emscripten_glUniform2fv,
                "_emscripten_glUniform2i": _emscripten_glUniform2i,
                "_emscripten_glUniform2iv": _emscripten_glUniform2iv,
                "_emscripten_glUniform3f": _emscripten_glUniform3f,
                "_emscripten_glUniform3fv": _emscripten_glUniform3fv,
                "_emscripten_glUniform3i": _emscripten_glUniform3i,
                "_emscripten_glUniform3iv": _emscripten_glUniform3iv,
                "_emscripten_glUniform4f": _emscripten_glUniform4f,
                "_emscripten_glUniform4fv": _emscripten_glUniform4fv,
                "_emscripten_glUniform4i": _emscripten_glUniform4i,
                "_emscripten_glUniform4iv": _emscripten_glUniform4iv,
                "_emscripten_glUniformMatrix2fv": _emscripten_glUniformMatrix2fv,
                "_emscripten_glUniformMatrix3fv": _emscripten_glUniformMatrix3fv,
                "_emscripten_glUniformMatrix4fv": _emscripten_glUniformMatrix4fv,
                "_emscripten_glUseProgram": _emscripten_glUseProgram,
                "_emscripten_glValidateProgram": _emscripten_glValidateProgram,
                "_emscripten_glVertexAttrib1f": _emscripten_glVertexAttrib1f,
                "_emscripten_glVertexAttrib1fv": _emscripten_glVertexAttrib1fv,
                "_emscripten_glVertexAttrib2f": _emscripten_glVertexAttrib2f,
                "_emscripten_glVertexAttrib2fv": _emscripten_glVertexAttrib2fv,
                "_emscripten_glVertexAttrib3f": _emscripten_glVertexAttrib3f,
                "_emscripten_glVertexAttrib3fv": _emscripten_glVertexAttrib3fv,
                "_emscripten_glVertexAttrib4f": _emscripten_glVertexAttrib4f,
                "_emscripten_glVertexAttrib4fv": _emscripten_glVertexAttrib4fv,
                "_emscripten_glVertexAttribDivisorANGLE": _emscripten_glVertexAttribDivisorANGLE,
                "_emscripten_glVertexAttribPointer": _emscripten_glVertexAttribPointer,
                "_emscripten_glViewport": _emscripten_glViewport,
                "_emscripten_memcpy_big": _emscripten_memcpy_big,
                "_emscripten_request_fullscreen_strategy": _emscripten_request_fullscreen_strategy,
                "_emscripten_request_pointerlock": _emscripten_request_pointerlock,
                "_emscripten_resize_heap": _emscripten_resize_heap,
                "_emscripten_sample_gamepad_data": _emscripten_sample_gamepad_data,
                "_emscripten_set_blur_callback_on_thread": _emscripten_set_blur_callback_on_thread,
                "_emscripten_set_canvas_element_size": _emscripten_set_canvas_element_size,
                "_emscripten_set_element_css_size": _emscripten_set_element_css_size,
                "_emscripten_set_focus_callback_on_thread": _emscripten_set_focus_callback_on_thread,
                "_emscripten_set_fullscreenchange_callback_on_thread": _emscripten_set_fullscreenchange_callback_on_thread,
                "_emscripten_set_gamepadconnected_callback_on_thread": _emscripten_set_gamepadconnected_callback_on_thread,
                "_emscripten_set_gamepaddisconnected_callback_on_thread": _emscripten_set_gamepaddisconnected_callback_on_thread,
                "_emscripten_set_keydown_callback_on_thread": _emscripten_set_keydown_callback_on_thread,
                "_emscripten_set_keypress_callback_on_thread": _emscripten_set_keypress_callback_on_thread,
                "_emscripten_set_keyup_callback_on_thread": _emscripten_set_keyup_callback_on_thread,
                "_emscripten_set_main_loop": _emscripten_set_main_loop,
                "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing,
                "_emscripten_set_mousedown_callback_on_thread": _emscripten_set_mousedown_callback_on_thread,
                "_emscripten_set_mouseenter_callback_on_thread": _emscripten_set_mouseenter_callback_on_thread,
                "_emscripten_set_mouseleave_callback_on_thread": _emscripten_set_mouseleave_callback_on_thread,
                "_emscripten_set_mousemove_callback_on_thread": _emscripten_set_mousemove_callback_on_thread,
                "_emscripten_set_mouseup_callback_on_thread": _emscripten_set_mouseup_callback_on_thread,
                "_emscripten_set_pointerlockchange_callback_on_thread": _emscripten_set_pointerlockchange_callback_on_thread,
                "_emscripten_set_resize_callback_on_thread": _emscripten_set_resize_callback_on_thread,
                "_emscripten_set_touchcancel_callback_on_thread": _emscripten_set_touchcancel_callback_on_thread,
                "_emscripten_set_touchend_callback_on_thread": _emscripten_set_touchend_callback_on_thread,
                "_emscripten_set_touchmove_callback_on_thread": _emscripten_set_touchmove_callback_on_thread,
                "_emscripten_set_touchstart_callback_on_thread": _emscripten_set_touchstart_callback_on_thread,
                "_emscripten_set_visibilitychange_callback_on_thread": _emscripten_set_visibilitychange_callback_on_thread,
                "_emscripten_set_wheel_callback_on_thread": _emscripten_set_wheel_callback_on_thread,
                "_getInt": _getInt,
                "_getString": _getString,
                "_getenv": _getenv,
                "_gettimeofday": _gettimeofday,
                "_nanosleep": _nanosleep,
                "_onEnd": _onEnd,
                "_onError": _onError,
                "_onStart": _onStart,
                "_sigaction": _sigaction,
                "_signal": _signal,
                "_startWorker": _startWorker,
                "_stopWorker": _stopWorker,
                "_usleep": _usleep,
                "_workerConnect": _workerConnect,
                "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
                "emscriptenWebGLGet": emscriptenWebGLGet,
                "emscriptenWebGLGetTexPixelData": emscriptenWebGLGetTexPixelData,
                "emscriptenWebGLGetUniform": emscriptenWebGLGetUniform,
                "emscriptenWebGLGetVertexAttrib": emscriptenWebGLGetVertexAttrib,
                "emscripten_realloc_buffer": emscripten_realloc_buffer,
                "stringToNewUTF8": stringToNewUTF8,
                "tempDoublePtr": tempDoublePtr,
                "DYNAMICTOP_PTR": DYNAMICTOP_PTR
            };
            var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
            Module["asm"] = asm;
            var ___em_js__getInt = Module["___em_js__getInt"] = function() {
                return Module["asm"]["___em_js__getInt"].apply(null, arguments)
            };
            var ___em_js__getString = Module["___em_js__getString"] = function() {
                return Module["asm"]["___em_js__getString"].apply(null, arguments)
            };
            var ___em_js__onEnd = Module["___em_js__onEnd"] = function() {
                return Module["asm"]["___em_js__onEnd"].apply(null, arguments)
            };
            var ___em_js__onError = Module["___em_js__onError"] = function() {
                return Module["asm"]["___em_js__onError"].apply(null, arguments)
            };
            var ___em_js__onStart = Module["___em_js__onStart"] = function() {
                return Module["asm"]["___em_js__onStart"].apply(null, arguments)
            };
            var ___em_js__startWorker = Module["___em_js__startWorker"] = function() {
                return Module["asm"]["___em_js__startWorker"].apply(null, arguments)
            };
            var ___em_js__stopWorker = Module["___em_js__stopWorker"] = function() {
                return Module["asm"]["___em_js__stopWorker"].apply(null, arguments)
            };
            var ___em_js__workerConnect = Module["___em_js__workerConnect"] = function() {
                return Module["asm"]["___em_js__workerConnect"].apply(null, arguments)
            };
            var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {
                return Module["asm"]["___emscripten_environ_constructor"].apply(null, arguments)
            };
            var ___errno_location = Module["___errno_location"] = function() {
                return Module["asm"]["___errno_location"].apply(null, arguments)
            };
            var __get_environ = Module["__get_environ"] = function() {
                return Module["asm"]["__get_environ"].apply(null, arguments)
            };
            var _emscripten_GetProcAddress = Module["_emscripten_GetProcAddress"] = function() {
                return Module["asm"]["_emscripten_GetProcAddress"].apply(null, arguments)
            };
            var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
                return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments)
            };
            var _free = Module["_free"] = function() {
                return Module["asm"]["_free"].apply(null, arguments)
            };
            var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
                return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments)
            };
            var _main = Module["_main"] = function() {
                return Module["asm"]["_main"].apply(null, arguments)
            };
            var _malloc = Module["_malloc"] = function() {
                return Module["asm"]["_malloc"].apply(null, arguments)
            };
            var _memcpy = Module["_memcpy"] = function() {
                return Module["asm"]["_memcpy"].apply(null, arguments)
            };
            var _memmove = Module["_memmove"] = function() {
                return Module["asm"]["_memmove"].apply(null, arguments)
            };
            var _memset = Module["_memset"] = function() {
                return Module["asm"]["_memset"].apply(null, arguments)
            };
            var _onWorkerError = Module["_onWorkerError"] = function() {
                return Module["asm"]["_onWorkerError"].apply(null, arguments)
            };
            var _onWorkerYUV = Module["_onWorkerYUV"] = function() {
                return Module["asm"]["_onWorkerYUV"].apply(null, arguments)
            };
            var _resizeCanvas = Module["_resizeCanvas"] = function() {
                return Module["asm"]["_resizeCanvas"].apply(null, arguments)
            };
            var _sbrk = Module["_sbrk"] = function() {
                return Module["asm"]["_sbrk"].apply(null, arguments)
            };
            var _start = Module["_start"] = function() {
                return Module["asm"]["_start"].apply(null, arguments)
            };
            var _stop = Module["_stop"] = function() {
                return Module["asm"]["_stop"].apply(null, arguments)
            };
            var _strstr = Module["_strstr"] = function() {
                return Module["asm"]["_strstr"].apply(null, arguments)
            };
            var _version = Module["_version"] = function() {
                return Module["asm"]["_version"].apply(null, arguments)
            };
            var establishStackSpace = Module["establishStackSpace"] = function() {
                return Module["asm"]["establishStackSpace"].apply(null, arguments)
            };
            var stackAlloc = Module["stackAlloc"] = function() {
                return Module["asm"]["stackAlloc"].apply(null, arguments)
            };
            var stackRestore = Module["stackRestore"] = function() {
                return Module["asm"]["stackRestore"].apply(null, arguments)
            };
            var stackSave = Module["stackSave"] = function() {
                return Module["asm"]["stackSave"].apply(null, arguments)
            };
            var dynCall_i = Module["dynCall_i"] = function() {
                return Module["asm"]["dynCall_i"].apply(null, arguments)
            };
            var dynCall_ii = Module["dynCall_ii"] = function() {
                return Module["asm"]["dynCall_ii"].apply(null, arguments)
            };
            var dynCall_iii = Module["dynCall_iii"] = function() {
                return Module["asm"]["dynCall_iii"].apply(null, arguments)
            };
            var dynCall_iiii = Module["dynCall_iiii"] = function() {
                return Module["asm"]["dynCall_iiii"].apply(null, arguments)
            };
            var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
                return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
            };
            var dynCall_iiiiidii = Module["dynCall_iiiiidii"] = function() {
                return Module["asm"]["dynCall_iiiiidii"].apply(null, arguments)
            };
            var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
                return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
            };
            var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
                return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
            };
            var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
                return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments)
            };
            var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
                return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments)
            };
            var dynCall_ji = Module["dynCall_ji"] = function() {
                return Module["asm"]["dynCall_ji"].apply(null, arguments)
            };
            var dynCall_jiji = Module["dynCall_jiji"] = function() {
                return Module["asm"]["dynCall_jiji"].apply(null, arguments)
            };
            var dynCall_v = Module["dynCall_v"] = function() {
                return Module["asm"]["dynCall_v"].apply(null, arguments)
            };
            var dynCall_vf = Module["dynCall_vf"] = function() {
                return Module["asm"]["dynCall_vf"].apply(null, arguments)
            };
            var dynCall_vff = Module["dynCall_vff"] = function() {
                return Module["asm"]["dynCall_vff"].apply(null, arguments)
            };
            var dynCall_vffff = Module["dynCall_vffff"] = function() {
                return Module["asm"]["dynCall_vffff"].apply(null, arguments)
            };
            var dynCall_vfi = Module["dynCall_vfi"] = function() {
                return Module["asm"]["dynCall_vfi"].apply(null, arguments)
            };
            var dynCall_vi = Module["dynCall_vi"] = function() {
                return Module["asm"]["dynCall_vi"].apply(null, arguments)
            };
            var dynCall_vif = Module["dynCall_vif"] = function() {
                return Module["asm"]["dynCall_vif"].apply(null, arguments)
            };
            var dynCall_viff = Module["dynCall_viff"] = function() {
                return Module["asm"]["dynCall_viff"].apply(null, arguments)
            };
            var dynCall_vifff = Module["dynCall_vifff"] = function() {
                return Module["asm"]["dynCall_vifff"].apply(null, arguments)
            };
            var dynCall_viffff = Module["dynCall_viffff"] = function() {
                return Module["asm"]["dynCall_viffff"].apply(null, arguments)
            };
            var dynCall_vii = Module["dynCall_vii"] = function() {
                return Module["asm"]["dynCall_vii"].apply(null, arguments)
            };
            var dynCall_viif = Module["dynCall_viif"] = function() {
                return Module["asm"]["dynCall_viif"].apply(null, arguments)
            };
            var dynCall_viii = Module["dynCall_viii"] = function() {
                return Module["asm"]["dynCall_viii"].apply(null, arguments)
            };
            var dynCall_viiii = Module["dynCall_viiii"] = function() {
                return Module["asm"]["dynCall_viiii"].apply(null, arguments)
            };
            var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
                return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
            };
            var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
                return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
            };
            var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
                return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments)
            };
            var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
                return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments)
            };
            var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
                return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments)
            };
            var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {
                return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments)
            };
            Module["asm"] = asm;
            Module["then"] = function(func) {
                if (Module["calledRun"]) {
                    func(Module)
                } else {
                    var old = Module["onRuntimeInitialized"];
                    Module["onRuntimeInitialized"] = function() {
                        if (old) old();
                        func(Module)
                    }
                }
                return Module
            };

            function ExitStatus(status) {
                this.name = "ExitStatus";
                this.message = "Program terminated with exit(" + status + ")";
                this.status = status
            }

            ExitStatus.prototype = new Error;
            ExitStatus.prototype.constructor = ExitStatus;
            var calledMain = false;
            dependenciesFulfilled = function runCaller() {
                if (!Module["calledRun"]) run();
                if (!Module["calledRun"]) dependenciesFulfilled = runCaller
            };
            Module["callMain"] = function callMain(args) {
                args = args || [];
                ensureInitRuntime();
                var argc = args.length + 1;
                var argv = stackAlloc((argc + 1) * 4);
                HEAP32[argv >> 2] = allocateUTF8OnStack(Module["thisProgram"]);
                for (var i = 1; i < argc; i++) {
                    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
                }
                HEAP32[(argv >> 2) + argc] = 0;
                try {
                    var ret = Module["_main"](argc, argv, 0);
                    exit(ret, true)
                } catch (e) {
                    if (e instanceof ExitStatus) {
                        return
                    } else if (e == "SimulateInfiniteLoop") {
                        Module["noExitRuntime"] = true;
                        return
                    } else {
                        var toLog = e;
                        if (e && typeof e === "object" && e.stack) {
                            toLog = [e, e.stack]
                        }
                        err("exception thrown: " + toLog);
                        Module["quit"](1, e)
                    }
                } finally {
                    calledMain = true
                }
            };

            function run(args) {
                args = args || Module["arguments"];
                if (runDependencies > 0) {
                    return
                }
                preRun();
                if (runDependencies > 0) return;
                if (Module["calledRun"]) return;

                function doRun() {
                    if (Module["calledRun"]) return;
                    Module["calledRun"] = true;
                    if (ABORT) return;
                    ensureInitRuntime();
                    preMain();
                    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                    if (Module["_main"] && shouldRunNow) Module["callMain"](args);
                    postRun()
                }

                if (Module["setStatus"]) {
                    Module["setStatus"]("Running...");
                    setTimeout(function() {
                        setTimeout(function() {
                            Module["setStatus"]("")
                        }, 1);
                        doRun()
                    }, 1)
                } else {
                    doRun()
                }
            }

            Module["run"] = run;

            function exit(status, implicit) {
                if (implicit && Module["noExitRuntime"] && status === 0) {
                    return
                }
                if (Module["noExitRuntime"]) {} else {
                    ABORT = true;
                    EXITSTATUS = status;
                    exitRuntime();
                    if (Module["onExit"]) Module["onExit"](status)
                }
                Module["quit"](status, new ExitStatus(status))
            }

            function abort(what) {
                if (Module["onAbort"]) {
                    Module["onAbort"](what)
                }
                if (what !== undefined) {
                    out(what);
                    err(what);
                    what = JSON.stringify(what)
                } else {
                    what = ""
                }
                ABORT = true;
                EXITSTATUS = 1;
                throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info."
            }

            Module["abort"] = abort;
            if (Module["preInit"]) {
                if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
                while (Module["preInit"].length > 0) {
                    Module["preInit"].pop()()
                }
            }
            var shouldRunNow = true;
            if (Module["noInitialRun"]) {
                shouldRunNow = false
            }
            Module["noExitRuntime"] = true;
            run();


            return SLPlayer
        }
    );
})();
if (typeof exports === 'object' && typeof module === 'object')
    module.exports = SLPlayer;
else if (typeof define === 'function' && define['amd'])
    define([], function() {
        return SLPlayer;
    });
else if (typeof exports === 'object')
    exports["SLPlayer"] = SLPlayer;