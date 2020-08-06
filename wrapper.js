// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiate;
(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };
  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }
  __instantiate = (m, a) => {
    System = __instantiate = undefined;
    rF(m);
    return a ? gExpA(m) : gExp(m);
  };
})();

System.register("https://deno.land/std@0.63.0/async/deferred", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function deferred() {
        let methods;
        const promise = new Promise((resolve, reject) => {
            methods = { resolve, reject };
        });
        return Object.assign(promise, methods);
    }
    exports_1("deferred", deferred);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/async/mux_async_iterator", ["https://deno.land/std@0.63.0/async/deferred"], function (exports_2, context_2) {
    "use strict";
    var deferred_ts_1, MuxAsyncIterator;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [
            function (deferred_ts_1_1) {
                deferred_ts_1 = deferred_ts_1_1;
            }
        ],
        execute: function () {
            MuxAsyncIterator = class MuxAsyncIterator {
                constructor() {
                    this.iteratorCount = 0;
                    this.yields = [];
                    this.throws = [];
                    this.signal = deferred_ts_1.deferred();
                }
                add(iterator) {
                    ++this.iteratorCount;
                    this.callIteratorNext(iterator);
                }
                async callIteratorNext(iterator) {
                    try {
                        const { value, done } = await iterator.next();
                        if (done) {
                            --this.iteratorCount;
                        }
                        else {
                            this.yields.push({ iterator, value });
                        }
                    }
                    catch (e) {
                        this.throws.push(e);
                    }
                    this.signal.resolve();
                }
                async *iterate() {
                    while (this.iteratorCount > 0) {
                        await this.signal;
                        for (let i = 0; i < this.yields.length; i++) {
                            const { iterator, value } = this.yields[i];
                            yield value;
                            this.callIteratorNext(iterator);
                        }
                        if (this.throws.length) {
                            for (const e of this.throws) {
                                throw e;
                            }
                            this.throws.length = 0;
                        }
                        this.yields.length = 0;
                        this.signal = deferred_ts_1.deferred();
                    }
                }
                [Symbol.asyncIterator]() {
                    return this.iterate();
                }
            };
            exports_2("MuxAsyncIterator", MuxAsyncIterator);
        }
    };
});
System.register("https://deno.land/std@0.63.0/signal/mod", ["https://deno.land/std@0.63.0/async/mux_async_iterator"], function (exports_3, context_3) {
    "use strict";
    var mux_async_iterator_ts_1;
    var __moduleName = context_3 && context_3.id;
    function signal(...signos) {
        const mux = new mux_async_iterator_ts_1.MuxAsyncIterator();
        if (signos.length < 1) {
            throw new Error("No signals are given. You need to specify at least one signal to create a signal stream.");
        }
        const streams = signos.map(Deno.signal);
        streams.forEach((stream) => {
            mux.add(stream);
        });
        const dispose = () => {
            streams.forEach((stream) => {
                stream.dispose();
            });
        };
        return Object.assign(mux, { dispose });
    }
    exports_3("signal", signal);
    function onSignal(signo, callback) {
        const sig = signal(signo);
        (async () => {
            for await (const _ of sig) {
                callback();
            }
        })();
        return sig;
    }
    exports_3("onSignal", onSignal);
    return {
        setters: [
            function (mux_async_iterator_ts_1_1) {
                mux_async_iterator_ts_1 = mux_async_iterator_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/encoding/utf8", [], function (exports_4, context_4) {
    "use strict";
    var encoder, decoder;
    var __moduleName = context_4 && context_4.id;
    function encode(input) {
        return encoder.encode(input);
    }
    exports_4("encode", encode);
    function decode(input) {
        return decoder.decode(input);
    }
    exports_4("decode", decode);
    return {
        setters: [],
        execute: function () {
            exports_4("encoder", encoder = new TextEncoder());
            exports_4("decoder", decoder = new TextDecoder());
        }
    };
});
System.register("https://deno.land/std@0.63.0/_util/has_own_property", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    function hasOwnProperty(obj, v) {
        if (obj == null) {
            return false;
        }
        return Object.prototype.hasOwnProperty.call(obj, v);
    }
    exports_5("hasOwnProperty", hasOwnProperty);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/bytes/mod", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    function findIndex(source, pat) {
        const s = pat[0];
        for (let i = 0; i < source.length; i++) {
            if (source[i] !== s)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j++;
                if (source[j] !== pat[j - pin]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin;
            }
        }
        return -1;
    }
    exports_6("findIndex", findIndex);
    function findLastIndex(source, pat) {
        const e = pat[pat.length - 1];
        for (let i = source.length - 1; i >= 0; i--) {
            if (source[i] !== e)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j--;
                if (source[j] !== pat[pat.length - 1 - (pin - j)]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin - pat.length + 1;
            }
        }
        return -1;
    }
    exports_6("findLastIndex", findLastIndex);
    function equal(source, match) {
        if (source.length !== match.length)
            return false;
        for (let i = 0; i < match.length; i++) {
            if (source[i] !== match[i])
                return false;
        }
        return true;
    }
    exports_6("equal", equal);
    function hasPrefix(source, prefix) {
        for (let i = 0, max = prefix.length; i < max; i++) {
            if (source[i] !== prefix[i])
                return false;
        }
        return true;
    }
    exports_6("hasPrefix", hasPrefix);
    function hasSuffix(source, suffix) {
        for (let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--) {
            if (source[srci] !== suffix[sfxi])
                return false;
        }
        return true;
    }
    exports_6("hasSuffix", hasSuffix);
    function repeat(origin, count) {
        if (count === 0) {
            return new Uint8Array();
        }
        if (count < 0) {
            throw new Error("bytes: negative repeat count");
        }
        else if ((origin.length * count) / count !== origin.length) {
            throw new Error("bytes: repeat count causes overflow");
        }
        const int = Math.floor(count);
        if (int !== count) {
            throw new Error("bytes: repeat count must be an integer");
        }
        const nb = new Uint8Array(origin.length * count);
        let bp = copyBytes(origin, nb);
        for (; bp < nb.length; bp *= 2) {
            copyBytes(nb.slice(0, bp), nb, bp);
        }
        return nb;
    }
    exports_6("repeat", repeat);
    function concat(origin, b) {
        const output = new Uint8Array(origin.length + b.length);
        output.set(origin, 0);
        output.set(b, origin.length);
        return output;
    }
    exports_6("concat", concat);
    function contains(source, pat) {
        return findIndex(source, pat) != -1;
    }
    exports_6("contains", contains);
    function copyBytes(src, dst, off = 0) {
        off = Math.max(0, Math.min(off, dst.byteLength));
        const dstBytesAvailable = dst.byteLength - off;
        if (src.byteLength > dstBytesAvailable) {
            src = src.subarray(0, dstBytesAvailable);
        }
        dst.set(src, off);
        return src.byteLength;
    }
    exports_6("copyBytes", copyBytes);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/_util/assert", [], function (exports_7, context_7) {
    "use strict";
    var DenoStdInternalError;
    var __moduleName = context_7 && context_7.id;
    function assert(expr, msg = "") {
        if (!expr) {
            throw new DenoStdInternalError(msg);
        }
    }
    exports_7("assert", assert);
    return {
        setters: [],
        execute: function () {
            DenoStdInternalError = class DenoStdInternalError extends Error {
                constructor(message) {
                    super(message);
                    this.name = "DenoStdInternalError";
                }
            };
            exports_7("DenoStdInternalError", DenoStdInternalError);
        }
    };
});
System.register("https://deno.land/std@0.63.0/io/bufio", ["https://deno.land/std@0.63.0/bytes/mod", "https://deno.land/std@0.63.0/_util/assert"], function (exports_8, context_8) {
    "use strict";
    var mod_ts_1, assert_ts_1, DEFAULT_BUF_SIZE, MIN_BUF_SIZE, MAX_CONSECUTIVE_EMPTY_READS, CR, LF, BufferFullError, PartialReadError, BufReader, AbstractBufBase, BufWriter, BufWriterSync;
    var __moduleName = context_8 && context_8.id;
    function createLPS(pat) {
        const lps = new Uint8Array(pat.length);
        lps[0] = 0;
        let prefixEnd = 0;
        let i = 1;
        while (i < lps.length) {
            if (pat[i] == pat[prefixEnd]) {
                prefixEnd++;
                lps[i] = prefixEnd;
                i++;
            }
            else if (prefixEnd === 0) {
                lps[i] = 0;
                i++;
            }
            else {
                prefixEnd = pat[prefixEnd - 1];
            }
        }
        return lps;
    }
    async function* readDelim(reader, delim) {
        const delimLen = delim.length;
        const delimLPS = createLPS(delim);
        let inputBuffer = new Deno.Buffer();
        const inspectArr = new Uint8Array(Math.max(1024, delimLen + 1));
        let inspectIndex = 0;
        let matchIndex = 0;
        while (true) {
            const result = await reader.read(inspectArr);
            if (result === null) {
                yield inputBuffer.bytes();
                return;
            }
            if (result < 0) {
                return;
            }
            const sliceRead = inspectArr.subarray(0, result);
            await Deno.writeAll(inputBuffer, sliceRead);
            let sliceToProcess = inputBuffer.bytes();
            while (inspectIndex < sliceToProcess.length) {
                if (sliceToProcess[inspectIndex] === delim[matchIndex]) {
                    inspectIndex++;
                    matchIndex++;
                    if (matchIndex === delimLen) {
                        const matchEnd = inspectIndex - delimLen;
                        const readyBytes = sliceToProcess.subarray(0, matchEnd);
                        const pendingBytes = sliceToProcess.slice(inspectIndex);
                        yield readyBytes;
                        sliceToProcess = pendingBytes;
                        inspectIndex = 0;
                        matchIndex = 0;
                    }
                }
                else {
                    if (matchIndex === 0) {
                        inspectIndex++;
                    }
                    else {
                        matchIndex = delimLPS[matchIndex - 1];
                    }
                }
            }
            inputBuffer = new Deno.Buffer(sliceToProcess);
        }
    }
    exports_8("readDelim", readDelim);
    async function* readStringDelim(reader, delim) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        for await (const chunk of readDelim(reader, encoder.encode(delim))) {
            yield decoder.decode(chunk);
        }
    }
    exports_8("readStringDelim", readStringDelim);
    async function* readLines(reader) {
        yield* readStringDelim(reader, "\n");
    }
    exports_8("readLines", readLines);
    return {
        setters: [
            function (mod_ts_1_1) {
                mod_ts_1 = mod_ts_1_1;
            },
            function (assert_ts_1_1) {
                assert_ts_1 = assert_ts_1_1;
            }
        ],
        execute: function () {
            DEFAULT_BUF_SIZE = 4096;
            MIN_BUF_SIZE = 16;
            MAX_CONSECUTIVE_EMPTY_READS = 100;
            CR = "\r".charCodeAt(0);
            LF = "\n".charCodeAt(0);
            BufferFullError = class BufferFullError extends Error {
                constructor(partial) {
                    super("Buffer full");
                    this.partial = partial;
                    this.name = "BufferFullError";
                }
            };
            exports_8("BufferFullError", BufferFullError);
            PartialReadError = class PartialReadError extends Deno.errors.UnexpectedEof {
                constructor() {
                    super("Encountered UnexpectedEof, data only partially read");
                    this.name = "PartialReadError";
                }
            };
            exports_8("PartialReadError", PartialReadError);
            BufReader = class BufReader {
                constructor(rd, size = DEFAULT_BUF_SIZE) {
                    this.r = 0;
                    this.w = 0;
                    this.eof = false;
                    if (size < MIN_BUF_SIZE) {
                        size = MIN_BUF_SIZE;
                    }
                    this._reset(new Uint8Array(size), rd);
                }
                static create(r, size = DEFAULT_BUF_SIZE) {
                    return r instanceof BufReader ? r : new BufReader(r, size);
                }
                size() {
                    return this.buf.byteLength;
                }
                buffered() {
                    return this.w - this.r;
                }
                async _fill() {
                    if (this.r > 0) {
                        this.buf.copyWithin(0, this.r, this.w);
                        this.w -= this.r;
                        this.r = 0;
                    }
                    if (this.w >= this.buf.byteLength) {
                        throw Error("bufio: tried to fill full buffer");
                    }
                    for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
                        const rr = await this.rd.read(this.buf.subarray(this.w));
                        if (rr === null) {
                            this.eof = true;
                            return;
                        }
                        assert_ts_1.assert(rr >= 0, "negative read");
                        this.w += rr;
                        if (rr > 0) {
                            return;
                        }
                    }
                    throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
                }
                reset(r) {
                    this._reset(this.buf, r);
                }
                _reset(buf, rd) {
                    this.buf = buf;
                    this.rd = rd;
                    this.eof = false;
                }
                async read(p) {
                    let rr = p.byteLength;
                    if (p.byteLength === 0)
                        return rr;
                    if (this.r === this.w) {
                        if (p.byteLength >= this.buf.byteLength) {
                            const rr = await this.rd.read(p);
                            const nread = rr ?? 0;
                            assert_ts_1.assert(nread >= 0, "negative read");
                            return rr;
                        }
                        this.r = 0;
                        this.w = 0;
                        rr = await this.rd.read(this.buf);
                        if (rr === 0 || rr === null)
                            return rr;
                        assert_ts_1.assert(rr >= 0, "negative read");
                        this.w += rr;
                    }
                    const copied = mod_ts_1.copyBytes(this.buf.subarray(this.r, this.w), p, 0);
                    this.r += copied;
                    return copied;
                }
                async readFull(p) {
                    let bytesRead = 0;
                    while (bytesRead < p.length) {
                        try {
                            const rr = await this.read(p.subarray(bytesRead));
                            if (rr === null) {
                                if (bytesRead === 0) {
                                    return null;
                                }
                                else {
                                    throw new PartialReadError();
                                }
                            }
                            bytesRead += rr;
                        }
                        catch (err) {
                            err.partial = p.subarray(0, bytesRead);
                            throw err;
                        }
                    }
                    return p;
                }
                async readByte() {
                    while (this.r === this.w) {
                        if (this.eof)
                            return null;
                        await this._fill();
                    }
                    const c = this.buf[this.r];
                    this.r++;
                    return c;
                }
                async readString(delim) {
                    if (delim.length !== 1) {
                        throw new Error("Delimiter should be a single character");
                    }
                    const buffer = await this.readSlice(delim.charCodeAt(0));
                    if (buffer === null)
                        return null;
                    return new TextDecoder().decode(buffer);
                }
                async readLine() {
                    let line;
                    try {
                        line = await this.readSlice(LF);
                    }
                    catch (err) {
                        let { partial } = err;
                        assert_ts_1.assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
                        if (!(err instanceof BufferFullError)) {
                            throw err;
                        }
                        if (!this.eof &&
                            partial.byteLength > 0 &&
                            partial[partial.byteLength - 1] === CR) {
                            assert_ts_1.assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                            this.r--;
                            partial = partial.subarray(0, partial.byteLength - 1);
                        }
                        return { line: partial, more: !this.eof };
                    }
                    if (line === null) {
                        return null;
                    }
                    if (line.byteLength === 0) {
                        return { line, more: false };
                    }
                    if (line[line.byteLength - 1] == LF) {
                        let drop = 1;
                        if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                            drop = 2;
                        }
                        line = line.subarray(0, line.byteLength - drop);
                    }
                    return { line, more: false };
                }
                async readSlice(delim) {
                    let s = 0;
                    let slice;
                    while (true) {
                        let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
                        if (i >= 0) {
                            i += s;
                            slice = this.buf.subarray(this.r, this.r + i + 1);
                            this.r += i + 1;
                            break;
                        }
                        if (this.eof) {
                            if (this.r === this.w) {
                                return null;
                            }
                            slice = this.buf.subarray(this.r, this.w);
                            this.r = this.w;
                            break;
                        }
                        if (this.buffered() >= this.buf.byteLength) {
                            this.r = this.w;
                            const oldbuf = this.buf;
                            const newbuf = this.buf.slice(0);
                            this.buf = newbuf;
                            throw new BufferFullError(oldbuf);
                        }
                        s = this.w - this.r;
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = slice;
                            throw err;
                        }
                    }
                    return slice;
                }
                async peek(n) {
                    if (n < 0) {
                        throw Error("negative count");
                    }
                    let avail = this.w - this.r;
                    while (avail < n && avail < this.buf.byteLength && !this.eof) {
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = this.buf.subarray(this.r, this.w);
                            throw err;
                        }
                        avail = this.w - this.r;
                    }
                    if (avail === 0 && this.eof) {
                        return null;
                    }
                    else if (avail < n && this.eof) {
                        return this.buf.subarray(this.r, this.r + avail);
                    }
                    else if (avail < n) {
                        throw new BufferFullError(this.buf.subarray(this.r, this.w));
                    }
                    return this.buf.subarray(this.r, this.r + n);
                }
            };
            exports_8("BufReader", BufReader);
            AbstractBufBase = class AbstractBufBase {
                constructor() {
                    this.usedBufferBytes = 0;
                    this.err = null;
                }
                size() {
                    return this.buf.byteLength;
                }
                available() {
                    return this.buf.byteLength - this.usedBufferBytes;
                }
                buffered() {
                    return this.usedBufferBytes;
                }
            };
            BufWriter = class BufWriter extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                async flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        await Deno.writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                async write(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = await this.writer.write(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            await this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_8("BufWriter", BufWriter);
            BufWriterSync = class BufWriterSync extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriterSync
                        ? writer
                        : new BufWriterSync(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        Deno.writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                writeSync(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = this.writer.writeSync(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_8("BufWriterSync", BufWriterSync);
        }
    };
});
System.register("https://deno.land/std@0.63.0/io/ioutil", ["https://deno.land/std@0.63.0/_util/assert"], function (exports_9, context_9) {
    "use strict";
    var assert_ts_2, DEFAULT_BUFFER_SIZE, MAX_SAFE_INTEGER;
    var __moduleName = context_9 && context_9.id;
    async function copyN(r, dest, size) {
        let bytesRead = 0;
        let buf = new Uint8Array(DEFAULT_BUFFER_SIZE);
        while (bytesRead < size) {
            if (size - bytesRead < DEFAULT_BUFFER_SIZE) {
                buf = new Uint8Array(size - bytesRead);
            }
            const result = await r.read(buf);
            const nread = result ?? 0;
            bytesRead += nread;
            if (nread > 0) {
                let n = 0;
                while (n < nread) {
                    n += await dest.write(buf.slice(n, nread));
                }
                assert_ts_2.assert(n === nread, "could not write");
            }
            if (result === null) {
                break;
            }
        }
        return bytesRead;
    }
    exports_9("copyN", copyN);
    async function readShort(buf) {
        const high = await buf.readByte();
        if (high === null)
            return null;
        const low = await buf.readByte();
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        return (high << 8) | low;
    }
    exports_9("readShort", readShort);
    async function readInt(buf) {
        const high = await readShort(buf);
        if (high === null)
            return null;
        const low = await readShort(buf);
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        return (high << 16) | low;
    }
    exports_9("readInt", readInt);
    async function readLong(buf) {
        const high = await readInt(buf);
        if (high === null)
            return null;
        const low = await readInt(buf);
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        const big = (BigInt(high) << 32n) | BigInt(low);
        if (big > MAX_SAFE_INTEGER) {
            throw new RangeError("Long value too big to be represented as a JavaScript number.");
        }
        return Number(big);
    }
    exports_9("readLong", readLong);
    function sliceLongToBytes(d, dest = new Array(8)) {
        let big = BigInt(d);
        for (let i = 0; i < 8; i++) {
            dest[7 - i] = Number(big & 0xffn);
            big >>= 8n;
        }
        return dest;
    }
    exports_9("sliceLongToBytes", sliceLongToBytes);
    return {
        setters: [
            function (assert_ts_2_1) {
                assert_ts_2 = assert_ts_2_1;
            }
        ],
        execute: function () {
            DEFAULT_BUFFER_SIZE = 32 * 1024;
            MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
        }
    };
});
System.register("https://deno.land/std@0.63.0/hash/sha1", [], function (exports_10, context_10) {
    "use strict";
    var HEX_CHARS, EXTRA, SHIFT, blocks, Sha1;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [],
        execute: function () {
            HEX_CHARS = "0123456789abcdef".split("");
            EXTRA = [-2147483648, 8388608, 32768, 128];
            SHIFT = [24, 16, 8, 0];
            blocks = [];
            Sha1 = class Sha1 {
                constructor(sharedMemory = false) {
                    this.#h0 = 0x67452301;
                    this.#h1 = 0xefcdab89;
                    this.#h2 = 0x98badcfe;
                    this.#h3 = 0x10325476;
                    this.#h4 = 0xc3d2e1f0;
                    this.#lastByteIndex = 0;
                    if (sharedMemory) {
                        blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        this.#blocks = blocks;
                    }
                    else {
                        this.#blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                    this.#h0 = 0x67452301;
                    this.#h1 = 0xefcdab89;
                    this.#h2 = 0x98badcfe;
                    this.#h3 = 0x10325476;
                    this.#h4 = 0xc3d2e1f0;
                    this.#block = this.#start = this.#bytes = this.#hBytes = 0;
                    this.#finalized = this.#hashed = false;
                }
                #blocks;
                #block;
                #start;
                #bytes;
                #hBytes;
                #finalized;
                #hashed;
                #h0;
                #h1;
                #h2;
                #h3;
                #h4;
                #lastByteIndex;
                update(message) {
                    if (this.#finalized) {
                        return this;
                    }
                    let msg;
                    if (message instanceof ArrayBuffer) {
                        msg = new Uint8Array(message);
                    }
                    else {
                        msg = message;
                    }
                    let index = 0;
                    const length = msg.length;
                    const blocks = this.#blocks;
                    while (index < length) {
                        let i;
                        if (this.#hashed) {
                            this.#hashed = false;
                            blocks[0] = this.#block;
                            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        }
                        if (typeof msg !== "string") {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                            }
                        }
                        else {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                let code = msg.charCodeAt(index);
                                if (code < 0x80) {
                                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                                }
                                else if (code < 0x800) {
                                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else if (code < 0xd800 || code >= 0xe000) {
                                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else {
                                    code = 0x10000 +
                                        (((code & 0x3ff) << 10) | (msg.charCodeAt(++index) & 0x3ff));
                                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                            }
                        }
                        this.#lastByteIndex = i;
                        this.#bytes += i - this.#start;
                        if (i >= 64) {
                            this.#block = blocks[16];
                            this.#start = i - 64;
                            this.hash();
                            this.#hashed = true;
                        }
                        else {
                            this.#start = i;
                        }
                    }
                    if (this.#bytes > 4294967295) {
                        this.#hBytes += (this.#bytes / 4294967296) >>> 0;
                        this.#bytes = this.#bytes >>> 0;
                    }
                    return this;
                }
                finalize() {
                    if (this.#finalized) {
                        return;
                    }
                    this.#finalized = true;
                    const blocks = this.#blocks;
                    const i = this.#lastByteIndex;
                    blocks[16] = this.#block;
                    blocks[i >> 2] |= EXTRA[i & 3];
                    this.#block = blocks[16];
                    if (i >= 56) {
                        if (!this.#hashed) {
                            this.hash();
                        }
                        blocks[0] = this.#block;
                        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                    }
                    blocks[14] = (this.#hBytes << 3) | (this.#bytes >>> 29);
                    blocks[15] = this.#bytes << 3;
                    this.hash();
                }
                hash() {
                    let a = this.#h0;
                    let b = this.#h1;
                    let c = this.#h2;
                    let d = this.#h3;
                    let e = this.#h4;
                    let f;
                    let j;
                    let t;
                    const blocks = this.#blocks;
                    for (j = 16; j < 80; ++j) {
                        t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
                        blocks[j] = (t << 1) | (t >>> 31);
                    }
                    for (j = 0; j < 20; j += 5) {
                        f = (b & c) | (~b & d);
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e + 1518500249 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = (a & b) | (~a & c);
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d + 1518500249 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = (e & a) | (~e & b);
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c + 1518500249 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = (d & e) | (~d & a);
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b + 1518500249 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = (c & d) | (~c & e);
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a + 1518500249 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 40; j += 5) {
                        f = b ^ c ^ d;
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e + 1859775393 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = a ^ b ^ c;
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d + 1859775393 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = e ^ a ^ b;
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c + 1859775393 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = d ^ e ^ a;
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b + 1859775393 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = c ^ d ^ e;
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a + 1859775393 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 60; j += 5) {
                        f = (b & c) | (b & d) | (c & d);
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e - 1894007588 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = (a & b) | (a & c) | (b & c);
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d - 1894007588 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = (e & a) | (e & b) | (a & b);
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c - 1894007588 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = (d & e) | (d & a) | (e & a);
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b - 1894007588 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = (c & d) | (c & e) | (d & e);
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a - 1894007588 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 80; j += 5) {
                        f = b ^ c ^ d;
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e - 899497514 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = a ^ b ^ c;
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d - 899497514 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = e ^ a ^ b;
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c - 899497514 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = d ^ e ^ a;
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b - 899497514 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = c ^ d ^ e;
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a - 899497514 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    this.#h0 = (this.#h0 + a) >>> 0;
                    this.#h1 = (this.#h1 + b) >>> 0;
                    this.#h2 = (this.#h2 + c) >>> 0;
                    this.#h3 = (this.#h3 + d) >>> 0;
                    this.#h4 = (this.#h4 + e) >>> 0;
                }
                hex() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    return (HEX_CHARS[(h0 >> 28) & 0x0f] +
                        HEX_CHARS[(h0 >> 24) & 0x0f] +
                        HEX_CHARS[(h0 >> 20) & 0x0f] +
                        HEX_CHARS[(h0 >> 16) & 0x0f] +
                        HEX_CHARS[(h0 >> 12) & 0x0f] +
                        HEX_CHARS[(h0 >> 8) & 0x0f] +
                        HEX_CHARS[(h0 >> 4) & 0x0f] +
                        HEX_CHARS[h0 & 0x0f] +
                        HEX_CHARS[(h1 >> 28) & 0x0f] +
                        HEX_CHARS[(h1 >> 24) & 0x0f] +
                        HEX_CHARS[(h1 >> 20) & 0x0f] +
                        HEX_CHARS[(h1 >> 16) & 0x0f] +
                        HEX_CHARS[(h1 >> 12) & 0x0f] +
                        HEX_CHARS[(h1 >> 8) & 0x0f] +
                        HEX_CHARS[(h1 >> 4) & 0x0f] +
                        HEX_CHARS[h1 & 0x0f] +
                        HEX_CHARS[(h2 >> 28) & 0x0f] +
                        HEX_CHARS[(h2 >> 24) & 0x0f] +
                        HEX_CHARS[(h2 >> 20) & 0x0f] +
                        HEX_CHARS[(h2 >> 16) & 0x0f] +
                        HEX_CHARS[(h2 >> 12) & 0x0f] +
                        HEX_CHARS[(h2 >> 8) & 0x0f] +
                        HEX_CHARS[(h2 >> 4) & 0x0f] +
                        HEX_CHARS[h2 & 0x0f] +
                        HEX_CHARS[(h3 >> 28) & 0x0f] +
                        HEX_CHARS[(h3 >> 24) & 0x0f] +
                        HEX_CHARS[(h3 >> 20) & 0x0f] +
                        HEX_CHARS[(h3 >> 16) & 0x0f] +
                        HEX_CHARS[(h3 >> 12) & 0x0f] +
                        HEX_CHARS[(h3 >> 8) & 0x0f] +
                        HEX_CHARS[(h3 >> 4) & 0x0f] +
                        HEX_CHARS[h3 & 0x0f] +
                        HEX_CHARS[(h4 >> 28) & 0x0f] +
                        HEX_CHARS[(h4 >> 24) & 0x0f] +
                        HEX_CHARS[(h4 >> 20) & 0x0f] +
                        HEX_CHARS[(h4 >> 16) & 0x0f] +
                        HEX_CHARS[(h4 >> 12) & 0x0f] +
                        HEX_CHARS[(h4 >> 8) & 0x0f] +
                        HEX_CHARS[(h4 >> 4) & 0x0f] +
                        HEX_CHARS[h4 & 0x0f]);
                }
                toString() {
                    return this.hex();
                }
                digest() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    return [
                        (h0 >> 24) & 0xff,
                        (h0 >> 16) & 0xff,
                        (h0 >> 8) & 0xff,
                        h0 & 0xff,
                        (h1 >> 24) & 0xff,
                        (h1 >> 16) & 0xff,
                        (h1 >> 8) & 0xff,
                        h1 & 0xff,
                        (h2 >> 24) & 0xff,
                        (h2 >> 16) & 0xff,
                        (h2 >> 8) & 0xff,
                        h2 & 0xff,
                        (h3 >> 24) & 0xff,
                        (h3 >> 16) & 0xff,
                        (h3 >> 8) & 0xff,
                        h3 & 0xff,
                        (h4 >> 24) & 0xff,
                        (h4 >> 16) & 0xff,
                        (h4 >> 8) & 0xff,
                        h4 & 0xff,
                    ];
                }
                array() {
                    return this.digest();
                }
                arrayBuffer() {
                    this.finalize();
                    const buffer = new ArrayBuffer(20);
                    const dataView = new DataView(buffer);
                    dataView.setUint32(0, this.#h0);
                    dataView.setUint32(4, this.#h1);
                    dataView.setUint32(8, this.#h2);
                    dataView.setUint32(12, this.#h3);
                    dataView.setUint32(16, this.#h4);
                    return buffer;
                }
            };
            exports_10("Sha1", Sha1);
        }
    };
});
System.register("https://deno.land/std@0.63.0/textproto/mod", ["https://deno.land/std@0.63.0/bytes/mod", "https://deno.land/std@0.63.0/encoding/utf8"], function (exports_11, context_11) {
    "use strict";
    var mod_ts_2, utf8_ts_1, invalidHeaderCharRegex, TextProtoReader;
    var __moduleName = context_11 && context_11.id;
    function str(buf) {
        if (buf == null) {
            return "";
        }
        else {
            return utf8_ts_1.decode(buf);
        }
    }
    function charCode(s) {
        return s.charCodeAt(0);
    }
    return {
        setters: [
            function (mod_ts_2_1) {
                mod_ts_2 = mod_ts_2_1;
            },
            function (utf8_ts_1_1) {
                utf8_ts_1 = utf8_ts_1_1;
            }
        ],
        execute: function () {
            invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
            TextProtoReader = class TextProtoReader {
                constructor(r) {
                    this.r = r;
                }
                async readLine() {
                    const s = await this.readLineSlice();
                    if (s === null)
                        return null;
                    return str(s);
                }
                async readMIMEHeader() {
                    const m = new Headers();
                    let line;
                    let buf = await this.r.peek(1);
                    if (buf === null) {
                        return null;
                    }
                    else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
                        line = (await this.readLineSlice());
                    }
                    buf = await this.r.peek(1);
                    if (buf === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
                        throw new Deno.errors.InvalidData(`malformed MIME header initial line: ${str(line)}`);
                    }
                    while (true) {
                        const kv = await this.readLineSlice();
                        if (kv === null)
                            throw new Deno.errors.UnexpectedEof();
                        if (kv.byteLength === 0)
                            return m;
                        let i = kv.indexOf(charCode(":"));
                        if (i < 0) {
                            throw new Deno.errors.InvalidData(`malformed MIME header line: ${str(kv)}`);
                        }
                        const key = str(kv.subarray(0, i));
                        if (key == "") {
                            continue;
                        }
                        i++;
                        while (i < kv.byteLength &&
                            (kv[i] == charCode(" ") || kv[i] == charCode("\t"))) {
                            i++;
                        }
                        const value = str(kv.subarray(i)).replace(invalidHeaderCharRegex, encodeURI);
                        try {
                            m.append(key, value);
                        }
                        catch {
                        }
                    }
                }
                async readLineSlice() {
                    let line;
                    while (true) {
                        const r = await this.r.readLine();
                        if (r === null)
                            return null;
                        const { line: l, more } = r;
                        if (!line && !more) {
                            if (this.skipSpace(l) === 0) {
                                return new Uint8Array(0);
                            }
                            return l;
                        }
                        line = line ? mod_ts_2.concat(line, l) : l;
                        if (!more) {
                            break;
                        }
                    }
                    return line;
                }
                skipSpace(l) {
                    let n = 0;
                    for (let i = 0; i < l.length; i++) {
                        if (l[i] === charCode(" ") || l[i] === charCode("\t")) {
                            continue;
                        }
                        n++;
                    }
                    return n;
                }
            };
            exports_11("TextProtoReader", TextProtoReader);
        }
    };
});
System.register("https://deno.land/std@0.63.0/async/delay", [], function (exports_12, context_12) {
    "use strict";
    var __moduleName = context_12 && context_12.id;
    function delay(ms) {
        return new Promise((res) => setTimeout(() => {
            res();
        }, ms));
    }
    exports_12("delay", delay);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/async/pool", [], function (exports_13, context_13) {
    "use strict";
    var __moduleName = context_13 && context_13.id;
    function pooledMap(poolLimit, array, iteratorFn) {
        const res = new TransformStream({
            async transform(p, controller) {
                controller.enqueue(await p);
            },
        });
        (async () => {
            const writer = res.writable.getWriter();
            const executing = [];
            for await (const item of array) {
                const p = Promise.resolve().then(() => iteratorFn(item));
                writer.write(p);
                const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= poolLimit) {
                    await Promise.race(executing);
                }
            }
            await Promise.all(executing);
            writer.close();
        })();
        return res.readable.getIterator();
    }
    exports_13("pooledMap", pooledMap);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/async/mod", ["https://deno.land/std@0.63.0/async/deferred", "https://deno.land/std@0.63.0/async/delay", "https://deno.land/std@0.63.0/async/mux_async_iterator", "https://deno.land/std@0.63.0/async/pool"], function (exports_14, context_14) {
    "use strict";
    var __moduleName = context_14 && context_14.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_14(exports);
    }
    return {
        setters: [
            function (deferred_ts_2_1) {
                exportStar_1(deferred_ts_2_1);
            },
            function (delay_ts_1_1) {
                exportStar_1(delay_ts_1_1);
            },
            function (mux_async_iterator_ts_2_1) {
                exportStar_1(mux_async_iterator_ts_2_1);
            },
            function (pool_ts_1_1) {
                exportStar_1(pool_ts_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/http/server", ["https://deno.land/std@0.63.0/encoding/utf8", "https://deno.land/std@0.63.0/io/bufio", "https://deno.land/std@0.63.0/_util/assert", "https://deno.land/std@0.63.0/async/mod", "https://deno.land/std@0.63.0/http/_io"], function (exports_15, context_15) {
    "use strict";
    var utf8_ts_2, bufio_ts_1, assert_ts_3, mod_ts_3, _io_ts_1, ServerRequest, Server;
    var __moduleName = context_15 && context_15.id;
    function _parseAddrFromStr(addr) {
        let url;
        try {
            const host = addr.startsWith(":") ? `0.0.0.0${addr}` : addr;
            url = new URL(`http://${host}`);
        }
        catch {
            throw new TypeError("Invalid address.");
        }
        if (url.username ||
            url.password ||
            url.pathname != "/" ||
            url.search ||
            url.hash) {
            throw new TypeError("Invalid address.");
        }
        return {
            hostname: url.hostname,
            port: url.port === "" ? 80 : Number(url.port),
        };
    }
    exports_15("_parseAddrFromStr", _parseAddrFromStr);
    function serve(addr) {
        if (typeof addr === "string") {
            addr = _parseAddrFromStr(addr);
        }
        const listener = Deno.listen(addr);
        return new Server(listener);
    }
    exports_15("serve", serve);
    async function listenAndServe(addr, handler) {
        const server = serve(addr);
        for await (const request of server) {
            handler(request);
        }
    }
    exports_15("listenAndServe", listenAndServe);
    function serveTLS(options) {
        const tlsOptions = {
            ...options,
            transport: "tcp",
        };
        const listener = Deno.listenTls(tlsOptions);
        return new Server(listener);
    }
    exports_15("serveTLS", serveTLS);
    async function listenAndServeTLS(options, handler) {
        const server = serveTLS(options);
        for await (const request of server) {
            handler(request);
        }
    }
    exports_15("listenAndServeTLS", listenAndServeTLS);
    return {
        setters: [
            function (utf8_ts_2_1) {
                utf8_ts_2 = utf8_ts_2_1;
            },
            function (bufio_ts_1_1) {
                bufio_ts_1 = bufio_ts_1_1;
            },
            function (assert_ts_3_1) {
                assert_ts_3 = assert_ts_3_1;
            },
            function (mod_ts_3_1) {
                mod_ts_3 = mod_ts_3_1;
            },
            function (_io_ts_1_1) {
                _io_ts_1 = _io_ts_1_1;
            }
        ],
        execute: function () {
            ServerRequest = class ServerRequest {
                constructor() {
                    this.done = mod_ts_3.deferred();
                    this._contentLength = undefined;
                    this._body = null;
                    this.finalized = false;
                }
                get contentLength() {
                    if (this._contentLength === undefined) {
                        const cl = this.headers.get("content-length");
                        if (cl) {
                            this._contentLength = parseInt(cl);
                            if (Number.isNaN(this._contentLength)) {
                                this._contentLength = null;
                            }
                        }
                        else {
                            this._contentLength = null;
                        }
                    }
                    return this._contentLength;
                }
                get body() {
                    if (!this._body) {
                        if (this.contentLength != null) {
                            this._body = _io_ts_1.bodyReader(this.contentLength, this.r);
                        }
                        else {
                            const transferEncoding = this.headers.get("transfer-encoding");
                            if (transferEncoding != null) {
                                const parts = transferEncoding
                                    .split(",")
                                    .map((e) => e.trim().toLowerCase());
                                assert_ts_3.assert(parts.includes("chunked"), 'transfer-encoding must include "chunked" if content-length is not set');
                                this._body = _io_ts_1.chunkedBodyReader(this.headers, this.r);
                            }
                            else {
                                this._body = _io_ts_1.emptyReader();
                            }
                        }
                    }
                    return this._body;
                }
                async respond(r) {
                    let err;
                    try {
                        await _io_ts_1.writeResponse(this.w, r);
                    }
                    catch (e) {
                        try {
                            this.conn.close();
                        }
                        catch {
                        }
                        err = e;
                    }
                    this.done.resolve(err);
                    if (err) {
                        throw err;
                    }
                }
                async finalize() {
                    if (this.finalized)
                        return;
                    const body = this.body;
                    const buf = new Uint8Array(1024);
                    while ((await body.read(buf)) !== null) {
                    }
                    this.finalized = true;
                }
            };
            exports_15("ServerRequest", ServerRequest);
            Server = class Server {
                constructor(listener) {
                    this.listener = listener;
                    this.closing = false;
                    this.connections = [];
                }
                close() {
                    this.closing = true;
                    this.listener.close();
                    for (const conn of this.connections) {
                        try {
                            conn.close();
                        }
                        catch (e) {
                            if (!(e instanceof Deno.errors.BadResource)) {
                                throw e;
                            }
                        }
                    }
                }
                async *iterateHttpRequests(conn) {
                    const reader = new bufio_ts_1.BufReader(conn);
                    const writer = new bufio_ts_1.BufWriter(conn);
                    while (!this.closing) {
                        let request;
                        try {
                            request = await _io_ts_1.readRequest(conn, reader);
                        }
                        catch (error) {
                            if (error instanceof Deno.errors.InvalidData ||
                                error instanceof Deno.errors.UnexpectedEof) {
                                await _io_ts_1.writeResponse(writer, {
                                    status: 400,
                                    body: utf8_ts_2.encode(`${error.message}\r\n\r\n`),
                                });
                            }
                            break;
                        }
                        if (request === null) {
                            break;
                        }
                        request.w = writer;
                        yield request;
                        const responseError = await request.done;
                        if (responseError) {
                            this.untrackConnection(request.conn);
                            return;
                        }
                        await request.finalize();
                    }
                    this.untrackConnection(conn);
                    try {
                        conn.close();
                    }
                    catch (e) {
                    }
                }
                trackConnection(conn) {
                    this.connections.push(conn);
                }
                untrackConnection(conn) {
                    const index = this.connections.indexOf(conn);
                    if (index !== -1) {
                        this.connections.splice(index, 1);
                    }
                }
                async *acceptConnAndIterateHttpRequests(mux) {
                    if (this.closing)
                        return;
                    let conn;
                    try {
                        conn = await this.listener.accept();
                    }
                    catch (error) {
                        if (error instanceof Deno.errors.BadResource ||
                            error instanceof Deno.errors.InvalidData ||
                            error instanceof Deno.errors.UnexpectedEof) {
                            return mux.add(this.acceptConnAndIterateHttpRequests(mux));
                        }
                        throw error;
                    }
                    this.trackConnection(conn);
                    mux.add(this.acceptConnAndIterateHttpRequests(mux));
                    yield* this.iterateHttpRequests(conn);
                }
                [Symbol.asyncIterator]() {
                    const mux = new mod_ts_3.MuxAsyncIterator();
                    mux.add(this.acceptConnAndIterateHttpRequests(mux));
                    return mux.iterate();
                }
            };
            exports_15("Server", Server);
        }
    };
});
System.register("https://deno.land/std@0.63.0/http/http_status", [], function (exports_16, context_16) {
    "use strict";
    var Status, STATUS_TEXT;
    var __moduleName = context_16 && context_16.id;
    return {
        setters: [],
        execute: function () {
            (function (Status) {
                Status[Status["Continue"] = 100] = "Continue";
                Status[Status["SwitchingProtocols"] = 101] = "SwitchingProtocols";
                Status[Status["Processing"] = 102] = "Processing";
                Status[Status["EarlyHints"] = 103] = "EarlyHints";
                Status[Status["OK"] = 200] = "OK";
                Status[Status["Created"] = 201] = "Created";
                Status[Status["Accepted"] = 202] = "Accepted";
                Status[Status["NonAuthoritativeInfo"] = 203] = "NonAuthoritativeInfo";
                Status[Status["NoContent"] = 204] = "NoContent";
                Status[Status["ResetContent"] = 205] = "ResetContent";
                Status[Status["PartialContent"] = 206] = "PartialContent";
                Status[Status["MultiStatus"] = 207] = "MultiStatus";
                Status[Status["AlreadyReported"] = 208] = "AlreadyReported";
                Status[Status["IMUsed"] = 226] = "IMUsed";
                Status[Status["MultipleChoices"] = 300] = "MultipleChoices";
                Status[Status["MovedPermanently"] = 301] = "MovedPermanently";
                Status[Status["Found"] = 302] = "Found";
                Status[Status["SeeOther"] = 303] = "SeeOther";
                Status[Status["NotModified"] = 304] = "NotModified";
                Status[Status["UseProxy"] = 305] = "UseProxy";
                Status[Status["TemporaryRedirect"] = 307] = "TemporaryRedirect";
                Status[Status["PermanentRedirect"] = 308] = "PermanentRedirect";
                Status[Status["BadRequest"] = 400] = "BadRequest";
                Status[Status["Unauthorized"] = 401] = "Unauthorized";
                Status[Status["PaymentRequired"] = 402] = "PaymentRequired";
                Status[Status["Forbidden"] = 403] = "Forbidden";
                Status[Status["NotFound"] = 404] = "NotFound";
                Status[Status["MethodNotAllowed"] = 405] = "MethodNotAllowed";
                Status[Status["NotAcceptable"] = 406] = "NotAcceptable";
                Status[Status["ProxyAuthRequired"] = 407] = "ProxyAuthRequired";
                Status[Status["RequestTimeout"] = 408] = "RequestTimeout";
                Status[Status["Conflict"] = 409] = "Conflict";
                Status[Status["Gone"] = 410] = "Gone";
                Status[Status["LengthRequired"] = 411] = "LengthRequired";
                Status[Status["PreconditionFailed"] = 412] = "PreconditionFailed";
                Status[Status["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
                Status[Status["RequestURITooLong"] = 414] = "RequestURITooLong";
                Status[Status["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
                Status[Status["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
                Status[Status["ExpectationFailed"] = 417] = "ExpectationFailed";
                Status[Status["Teapot"] = 418] = "Teapot";
                Status[Status["MisdirectedRequest"] = 421] = "MisdirectedRequest";
                Status[Status["UnprocessableEntity"] = 422] = "UnprocessableEntity";
                Status[Status["Locked"] = 423] = "Locked";
                Status[Status["FailedDependency"] = 424] = "FailedDependency";
                Status[Status["TooEarly"] = 425] = "TooEarly";
                Status[Status["UpgradeRequired"] = 426] = "UpgradeRequired";
                Status[Status["PreconditionRequired"] = 428] = "PreconditionRequired";
                Status[Status["TooManyRequests"] = 429] = "TooManyRequests";
                Status[Status["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
                Status[Status["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
                Status[Status["InternalServerError"] = 500] = "InternalServerError";
                Status[Status["NotImplemented"] = 501] = "NotImplemented";
                Status[Status["BadGateway"] = 502] = "BadGateway";
                Status[Status["ServiceUnavailable"] = 503] = "ServiceUnavailable";
                Status[Status["GatewayTimeout"] = 504] = "GatewayTimeout";
                Status[Status["HTTPVersionNotSupported"] = 505] = "HTTPVersionNotSupported";
                Status[Status["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
                Status[Status["InsufficientStorage"] = 507] = "InsufficientStorage";
                Status[Status["LoopDetected"] = 508] = "LoopDetected";
                Status[Status["NotExtended"] = 510] = "NotExtended";
                Status[Status["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
            })(Status || (Status = {}));
            exports_16("Status", Status);
            exports_16("STATUS_TEXT", STATUS_TEXT = new Map([
                [Status.Continue, "Continue"],
                [Status.SwitchingProtocols, "Switching Protocols"],
                [Status.Processing, "Processing"],
                [Status.EarlyHints, "Early Hints"],
                [Status.OK, "OK"],
                [Status.Created, "Created"],
                [Status.Accepted, "Accepted"],
                [Status.NonAuthoritativeInfo, "Non-Authoritative Information"],
                [Status.NoContent, "No Content"],
                [Status.ResetContent, "Reset Content"],
                [Status.PartialContent, "Partial Content"],
                [Status.MultiStatus, "Multi-Status"],
                [Status.AlreadyReported, "Already Reported"],
                [Status.IMUsed, "IM Used"],
                [Status.MultipleChoices, "Multiple Choices"],
                [Status.MovedPermanently, "Moved Permanently"],
                [Status.Found, "Found"],
                [Status.SeeOther, "See Other"],
                [Status.NotModified, "Not Modified"],
                [Status.UseProxy, "Use Proxy"],
                [Status.TemporaryRedirect, "Temporary Redirect"],
                [Status.PermanentRedirect, "Permanent Redirect"],
                [Status.BadRequest, "Bad Request"],
                [Status.Unauthorized, "Unauthorized"],
                [Status.PaymentRequired, "Payment Required"],
                [Status.Forbidden, "Forbidden"],
                [Status.NotFound, "Not Found"],
                [Status.MethodNotAllowed, "Method Not Allowed"],
                [Status.NotAcceptable, "Not Acceptable"],
                [Status.ProxyAuthRequired, "Proxy Authentication Required"],
                [Status.RequestTimeout, "Request Timeout"],
                [Status.Conflict, "Conflict"],
                [Status.Gone, "Gone"],
                [Status.LengthRequired, "Length Required"],
                [Status.PreconditionFailed, "Precondition Failed"],
                [Status.RequestEntityTooLarge, "Request Entity Too Large"],
                [Status.RequestURITooLong, "Request URI Too Long"],
                [Status.UnsupportedMediaType, "Unsupported Media Type"],
                [Status.RequestedRangeNotSatisfiable, "Requested Range Not Satisfiable"],
                [Status.ExpectationFailed, "Expectation Failed"],
                [Status.Teapot, "I'm a teapot"],
                [Status.MisdirectedRequest, "Misdirected Request"],
                [Status.UnprocessableEntity, "Unprocessable Entity"],
                [Status.Locked, "Locked"],
                [Status.FailedDependency, "Failed Dependency"],
                [Status.TooEarly, "Too Early"],
                [Status.UpgradeRequired, "Upgrade Required"],
                [Status.PreconditionRequired, "Precondition Required"],
                [Status.TooManyRequests, "Too Many Requests"],
                [Status.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large"],
                [Status.UnavailableForLegalReasons, "Unavailable For Legal Reasons"],
                [Status.InternalServerError, "Internal Server Error"],
                [Status.NotImplemented, "Not Implemented"],
                [Status.BadGateway, "Bad Gateway"],
                [Status.ServiceUnavailable, "Service Unavailable"],
                [Status.GatewayTimeout, "Gateway Timeout"],
                [Status.HTTPVersionNotSupported, "HTTP Version Not Supported"],
                [Status.VariantAlsoNegotiates, "Variant Also Negotiates"],
                [Status.InsufficientStorage, "Insufficient Storage"],
                [Status.LoopDetected, "Loop Detected"],
                [Status.NotExtended, "Not Extended"],
                [Status.NetworkAuthenticationRequired, "Network Authentication Required"],
            ]));
        }
    };
});
System.register("https://deno.land/std@0.63.0/http/_io", ["https://deno.land/std@0.63.0/io/bufio", "https://deno.land/std@0.63.0/textproto/mod", "https://deno.land/std@0.63.0/_util/assert", "https://deno.land/std@0.63.0/encoding/utf8", "https://deno.land/std@0.63.0/http/server", "https://deno.land/std@0.63.0/http/http_status"], function (exports_17, context_17) {
    "use strict";
    var bufio_ts_2, mod_ts_4, assert_ts_4, utf8_ts_3, server_ts_1, http_status_ts_1;
    var __moduleName = context_17 && context_17.id;
    function emptyReader() {
        return {
            read(_) {
                return Promise.resolve(null);
            },
        };
    }
    exports_17("emptyReader", emptyReader);
    function bodyReader(contentLength, r) {
        let totalRead = 0;
        let finished = false;
        async function read(buf) {
            if (finished)
                return null;
            let result;
            const remaining = contentLength - totalRead;
            if (remaining >= buf.byteLength) {
                result = await r.read(buf);
            }
            else {
                const readBuf = buf.subarray(0, remaining);
                result = await r.read(readBuf);
            }
            if (result !== null) {
                totalRead += result;
            }
            finished = totalRead === contentLength;
            return result;
        }
        return { read };
    }
    exports_17("bodyReader", bodyReader);
    function chunkedBodyReader(h, r) {
        const tp = new mod_ts_4.TextProtoReader(r);
        let finished = false;
        const chunks = [];
        async function read(buf) {
            if (finished)
                return null;
            const [chunk] = chunks;
            if (chunk) {
                const chunkRemaining = chunk.data.byteLength - chunk.offset;
                const readLength = Math.min(chunkRemaining, buf.byteLength);
                for (let i = 0; i < readLength; i++) {
                    buf[i] = chunk.data[chunk.offset + i];
                }
                chunk.offset += readLength;
                if (chunk.offset === chunk.data.byteLength) {
                    chunks.shift();
                    if ((await tp.readLine()) === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                }
                return readLength;
            }
            const line = await tp.readLine();
            if (line === null)
                throw new Deno.errors.UnexpectedEof();
            const [chunkSizeString] = line.split(";");
            const chunkSize = parseInt(chunkSizeString, 16);
            if (Number.isNaN(chunkSize) || chunkSize < 0) {
                throw new Error("Invalid chunk size");
            }
            if (chunkSize > 0) {
                if (chunkSize > buf.byteLength) {
                    let eof = await r.readFull(buf);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    const restChunk = new Uint8Array(chunkSize - buf.byteLength);
                    eof = await r.readFull(restChunk);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    else {
                        chunks.push({
                            offset: 0,
                            data: restChunk,
                        });
                    }
                    return buf.byteLength;
                }
                else {
                    const bufToFill = buf.subarray(0, chunkSize);
                    const eof = await r.readFull(bufToFill);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    if ((await tp.readLine()) === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    return chunkSize;
                }
            }
            else {
                assert_ts_4.assert(chunkSize === 0);
                if ((await r.readLine()) === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                await readTrailers(h, r);
                finished = true;
                return null;
            }
        }
        return { read };
    }
    exports_17("chunkedBodyReader", chunkedBodyReader);
    function isProhibidedForTrailer(key) {
        const s = new Set(["transfer-encoding", "content-length", "trailer"]);
        return s.has(key.toLowerCase());
    }
    async function readTrailers(headers, r) {
        const trailers = parseTrailer(headers.get("trailer"));
        if (trailers == null)
            return;
        const trailerNames = [...trailers.keys()];
        const tp = new mod_ts_4.TextProtoReader(r);
        const result = await tp.readMIMEHeader();
        if (result == null) {
            throw new Deno.errors.InvalidData("Missing trailer header.");
        }
        const undeclared = [...result.keys()].filter((k) => !trailerNames.includes(k));
        if (undeclared.length > 0) {
            throw new Deno.errors.InvalidData(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
        }
        for (const [k, v] of result) {
            headers.append(k, v);
        }
        const missingTrailers = trailerNames.filter((k) => !result.has(k));
        if (missingTrailers.length > 0) {
            throw new Deno.errors.InvalidData(`Missing trailers: ${Deno.inspect(missingTrailers)}.`);
        }
        headers.delete("trailer");
    }
    exports_17("readTrailers", readTrailers);
    function parseTrailer(field) {
        if (field == null) {
            return undefined;
        }
        const trailerNames = field.split(",").map((v) => v.trim().toLowerCase());
        if (trailerNames.length === 0) {
            throw new Deno.errors.InvalidData("Empty trailer header.");
        }
        const prohibited = trailerNames.filter((k) => isProhibidedForTrailer(k));
        if (prohibited.length > 0) {
            throw new Deno.errors.InvalidData(`Prohibited trailer names: ${Deno.inspect(prohibited)}.`);
        }
        return new Headers(trailerNames.map((key) => [key, ""]));
    }
    async function writeChunkedBody(w, r) {
        const writer = bufio_ts_2.BufWriter.create(w);
        for await (const chunk of Deno.iter(r)) {
            if (chunk.byteLength <= 0)
                continue;
            const start = utf8_ts_3.encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
            const end = utf8_ts_3.encoder.encode("\r\n");
            await writer.write(start);
            await writer.write(chunk);
            await writer.write(end);
        }
        const endChunk = utf8_ts_3.encoder.encode("0\r\n\r\n");
        await writer.write(endChunk);
    }
    exports_17("writeChunkedBody", writeChunkedBody);
    async function writeTrailers(w, headers, trailers) {
        const trailer = headers.get("trailer");
        if (trailer === null) {
            throw new TypeError("Missing trailer header.");
        }
        const transferEncoding = headers.get("transfer-encoding");
        if (transferEncoding === null || !transferEncoding.match(/^chunked/)) {
            throw new TypeError(`Trailers are only allowed for "transfer-encoding: chunked", got "transfer-encoding: ${transferEncoding}".`);
        }
        const writer = bufio_ts_2.BufWriter.create(w);
        const trailerNames = trailer.split(",").map((s) => s.trim().toLowerCase());
        const prohibitedTrailers = trailerNames.filter((k) => isProhibidedForTrailer(k));
        if (prohibitedTrailers.length > 0) {
            throw new TypeError(`Prohibited trailer names: ${Deno.inspect(prohibitedTrailers)}.`);
        }
        const undeclared = [...trailers.keys()].filter((k) => !trailerNames.includes(k));
        if (undeclared.length > 0) {
            throw new TypeError(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
        }
        for (const [key, value] of trailers) {
            await writer.write(utf8_ts_3.encoder.encode(`${key}: ${value}\r\n`));
        }
        await writer.write(utf8_ts_3.encoder.encode("\r\n"));
        await writer.flush();
    }
    exports_17("writeTrailers", writeTrailers);
    async function writeResponse(w, r) {
        const protoMajor = 1;
        const protoMinor = 1;
        const statusCode = r.status || 200;
        const statusText = http_status_ts_1.STATUS_TEXT.get(statusCode);
        const writer = bufio_ts_2.BufWriter.create(w);
        if (!statusText) {
            throw new Deno.errors.InvalidData("Bad status code");
        }
        if (!r.body) {
            r.body = new Uint8Array();
        }
        if (typeof r.body === "string") {
            r.body = utf8_ts_3.encoder.encode(r.body);
        }
        let out = `HTTP/${protoMajor}.${protoMinor} ${statusCode} ${statusText}\r\n`;
        const headers = r.headers ?? new Headers();
        if (r.body && !headers.get("content-length")) {
            if (r.body instanceof Uint8Array) {
                out += `content-length: ${r.body.byteLength}\r\n`;
            }
            else if (!headers.get("transfer-encoding")) {
                out += "transfer-encoding: chunked\r\n";
            }
        }
        for (const [key, value] of headers) {
            out += `${key}: ${value}\r\n`;
        }
        out += `\r\n`;
        const header = utf8_ts_3.encoder.encode(out);
        const n = await writer.write(header);
        assert_ts_4.assert(n === header.byteLength);
        if (r.body instanceof Uint8Array) {
            const n = await writer.write(r.body);
            assert_ts_4.assert(n === r.body.byteLength);
        }
        else if (headers.has("content-length")) {
            const contentLength = headers.get("content-length");
            assert_ts_4.assert(contentLength != null);
            const bodyLength = parseInt(contentLength);
            const n = await Deno.copy(r.body, writer);
            assert_ts_4.assert(n === bodyLength);
        }
        else {
            await writeChunkedBody(writer, r.body);
        }
        if (r.trailers) {
            const t = await r.trailers();
            await writeTrailers(writer, headers, t);
        }
        await writer.flush();
    }
    exports_17("writeResponse", writeResponse);
    function parseHTTPVersion(vers) {
        switch (vers) {
            case "HTTP/1.1":
                return [1, 1];
            case "HTTP/1.0":
                return [1, 0];
            default: {
                const Big = 1000000;
                if (!vers.startsWith("HTTP/")) {
                    break;
                }
                const dot = vers.indexOf(".");
                if (dot < 0) {
                    break;
                }
                const majorStr = vers.substring(vers.indexOf("/") + 1, dot);
                const major = Number(majorStr);
                if (!Number.isInteger(major) || major < 0 || major > Big) {
                    break;
                }
                const minorStr = vers.substring(dot + 1);
                const minor = Number(minorStr);
                if (!Number.isInteger(minor) || minor < 0 || minor > Big) {
                    break;
                }
                return [major, minor];
            }
        }
        throw new Error(`malformed HTTP version ${vers}`);
    }
    exports_17("parseHTTPVersion", parseHTTPVersion);
    async function readRequest(conn, bufr) {
        const tp = new mod_ts_4.TextProtoReader(bufr);
        const firstLine = await tp.readLine();
        if (firstLine === null)
            return null;
        const headers = await tp.readMIMEHeader();
        if (headers === null)
            throw new Deno.errors.UnexpectedEof();
        const req = new server_ts_1.ServerRequest();
        req.conn = conn;
        req.r = bufr;
        [req.method, req.url, req.proto] = firstLine.split(" ", 3);
        [req.protoMinor, req.protoMajor] = parseHTTPVersion(req.proto);
        req.headers = headers;
        fixLength(req);
        return req;
    }
    exports_17("readRequest", readRequest);
    function fixLength(req) {
        const contentLength = req.headers.get("Content-Length");
        if (contentLength) {
            const arrClen = contentLength.split(",");
            if (arrClen.length > 1) {
                const distinct = [...new Set(arrClen.map((e) => e.trim()))];
                if (distinct.length > 1) {
                    throw Error("cannot contain multiple Content-Length headers");
                }
                else {
                    req.headers.set("Content-Length", distinct[0]);
                }
            }
            const c = req.headers.get("Content-Length");
            if (req.method === "HEAD" && c && c !== "0") {
                throw Error("http: method cannot contain a Content-Length");
            }
            if (c && req.headers.has("transfer-encoding")) {
                throw new Error("http: Transfer-Encoding and Content-Length cannot be send together");
            }
        }
    }
    return {
        setters: [
            function (bufio_ts_2_1) {
                bufio_ts_2 = bufio_ts_2_1;
            },
            function (mod_ts_4_1) {
                mod_ts_4 = mod_ts_4_1;
            },
            function (assert_ts_4_1) {
                assert_ts_4 = assert_ts_4_1;
            },
            function (utf8_ts_3_1) {
                utf8_ts_3 = utf8_ts_3_1;
            },
            function (server_ts_1_1) {
                server_ts_1 = server_ts_1_1;
            },
            function (http_status_ts_1_1) {
                http_status_ts_1 = http_status_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/ws/mod", ["https://deno.land/std@0.63.0/encoding/utf8", "https://deno.land/std@0.63.0/_util/has_own_property", "https://deno.land/std@0.63.0/io/bufio", "https://deno.land/std@0.63.0/io/ioutil", "https://deno.land/std@0.63.0/hash/sha1", "https://deno.land/std@0.63.0/http/_io", "https://deno.land/std@0.63.0/textproto/mod", "https://deno.land/std@0.63.0/async/deferred", "https://deno.land/std@0.63.0/_util/assert", "https://deno.land/std@0.63.0/bytes/mod"], function (exports_18, context_18) {
    "use strict";
    var utf8_ts_4, has_own_property_ts_1, bufio_ts_3, ioutil_ts_1, sha1_ts_1, _io_ts_2, mod_ts_5, deferred_ts_3, assert_ts_5, mod_ts_6, OpCode, WebSocketImpl, kGUID, kSecChars;
    var __moduleName = context_18 && context_18.id;
    function isWebSocketCloseEvent(a) {
        return has_own_property_ts_1.hasOwnProperty(a, "code");
    }
    exports_18("isWebSocketCloseEvent", isWebSocketCloseEvent);
    function isWebSocketPingEvent(a) {
        return Array.isArray(a) && a[0] === "ping" && a[1] instanceof Uint8Array;
    }
    exports_18("isWebSocketPingEvent", isWebSocketPingEvent);
    function isWebSocketPongEvent(a) {
        return Array.isArray(a) && a[0] === "pong" && a[1] instanceof Uint8Array;
    }
    exports_18("isWebSocketPongEvent", isWebSocketPongEvent);
    function unmask(payload, mask) {
        if (mask) {
            for (let i = 0, len = payload.length; i < len; i++) {
                payload[i] ^= mask[i & 3];
            }
        }
    }
    exports_18("unmask", unmask);
    async function writeFrame(frame, writer) {
        const payloadLength = frame.payload.byteLength;
        let header;
        const hasMask = frame.mask ? 0x80 : 0;
        if (frame.mask && frame.mask.byteLength !== 4) {
            throw new Error("invalid mask. mask must be 4 bytes: length=" + frame.mask.byteLength);
        }
        if (payloadLength < 126) {
            header = new Uint8Array([0x80 | frame.opcode, hasMask | payloadLength]);
        }
        else if (payloadLength < 0xffff) {
            header = new Uint8Array([
                0x80 | frame.opcode,
                hasMask | 0b01111110,
                payloadLength >>> 8,
                payloadLength & 0x00ff,
            ]);
        }
        else {
            header = new Uint8Array([
                0x80 | frame.opcode,
                hasMask | 0b01111111,
                ...ioutil_ts_1.sliceLongToBytes(payloadLength),
            ]);
        }
        if (frame.mask) {
            header = mod_ts_6.concat(header, frame.mask);
        }
        unmask(frame.payload, frame.mask);
        header = mod_ts_6.concat(header, frame.payload);
        const w = bufio_ts_3.BufWriter.create(writer);
        await w.write(header);
        await w.flush();
    }
    exports_18("writeFrame", writeFrame);
    async function readFrame(buf) {
        let b = await buf.readByte();
        assert_ts_5.assert(b !== null);
        let isLastFrame = false;
        switch (b >>> 4) {
            case 0b1000:
                isLastFrame = true;
                break;
            case 0b0000:
                isLastFrame = false;
                break;
            default:
                throw new Error("invalid signature");
        }
        const opcode = b & 0x0f;
        b = await buf.readByte();
        assert_ts_5.assert(b !== null);
        const hasMask = b >>> 7;
        let payloadLength = b & 0b01111111;
        if (payloadLength === 126) {
            const l = await ioutil_ts_1.readShort(buf);
            assert_ts_5.assert(l !== null);
            payloadLength = l;
        }
        else if (payloadLength === 127) {
            const l = await ioutil_ts_1.readLong(buf);
            assert_ts_5.assert(l !== null);
            payloadLength = Number(l);
        }
        let mask;
        if (hasMask) {
            mask = new Uint8Array(4);
            assert_ts_5.assert((await buf.readFull(mask)) !== null);
        }
        const payload = new Uint8Array(payloadLength);
        assert_ts_5.assert((await buf.readFull(payload)) !== null);
        return {
            isLastFrame,
            opcode,
            mask,
            payload,
        };
    }
    exports_18("readFrame", readFrame);
    function createMask() {
        return crypto.getRandomValues(new Uint8Array(4));
    }
    function acceptable(req) {
        const upgrade = req.headers.get("upgrade");
        if (!upgrade || upgrade.toLowerCase() !== "websocket") {
            return false;
        }
        const secKey = req.headers.get("sec-websocket-key");
        return (req.headers.has("sec-websocket-key") &&
            typeof secKey === "string" &&
            secKey.length > 0);
    }
    exports_18("acceptable", acceptable);
    function createSecAccept(nonce) {
        const sha1 = new sha1_ts_1.Sha1();
        sha1.update(nonce + kGUID);
        const bytes = sha1.digest();
        return btoa(String.fromCharCode(...bytes));
    }
    exports_18("createSecAccept", createSecAccept);
    async function acceptWebSocket(req) {
        const { conn, headers, bufReader, bufWriter } = req;
        if (acceptable(req)) {
            const sock = new WebSocketImpl({ conn, bufReader, bufWriter });
            const secKey = headers.get("sec-websocket-key");
            if (typeof secKey !== "string") {
                throw new Error("sec-websocket-key is not provided");
            }
            const secAccept = createSecAccept(secKey);
            await _io_ts_2.writeResponse(bufWriter, {
                status: 101,
                headers: new Headers({
                    Upgrade: "websocket",
                    Connection: "Upgrade",
                    "Sec-WebSocket-Accept": secAccept,
                }),
            });
            return sock;
        }
        throw new Error("request is not acceptable");
    }
    exports_18("acceptWebSocket", acceptWebSocket);
    function createSecKey() {
        let key = "";
        for (let i = 0; i < 16; i++) {
            const j = Math.floor(Math.random() * kSecChars.length);
            key += kSecChars[j];
        }
        return btoa(key);
    }
    exports_18("createSecKey", createSecKey);
    async function handshake(url, headers, bufReader, bufWriter) {
        const { hostname, pathname, search } = url;
        const key = createSecKey();
        if (!headers.has("host")) {
            headers.set("host", hostname);
        }
        headers.set("upgrade", "websocket");
        headers.set("connection", "upgrade");
        headers.set("sec-websocket-key", key);
        headers.set("sec-websocket-version", "13");
        let headerStr = `GET ${pathname}${search} HTTP/1.1\r\n`;
        for (const [key, value] of headers) {
            headerStr += `${key}: ${value}\r\n`;
        }
        headerStr += "\r\n";
        await bufWriter.write(utf8_ts_4.encode(headerStr));
        await bufWriter.flush();
        const tpReader = new mod_ts_5.TextProtoReader(bufReader);
        const statusLine = await tpReader.readLine();
        if (statusLine === null) {
            throw new Deno.errors.UnexpectedEof();
        }
        const m = statusLine.match(/^(?<version>\S+) (?<statusCode>\S+) /);
        if (!m) {
            throw new Error("ws: invalid status line: " + statusLine);
        }
        assert_ts_5.assert(m.groups);
        const { version, statusCode } = m.groups;
        if (version !== "HTTP/1.1" || statusCode !== "101") {
            throw new Error(`ws: server didn't accept handshake: ` +
                `version=${version}, statusCode=${statusCode}`);
        }
        const responseHeaders = await tpReader.readMIMEHeader();
        if (responseHeaders === null) {
            throw new Deno.errors.UnexpectedEof();
        }
        const expectedSecAccept = createSecAccept(key);
        const secAccept = responseHeaders.get("sec-websocket-accept");
        if (secAccept !== expectedSecAccept) {
            throw new Error(`ws: unexpected sec-websocket-accept header: ` +
                `expected=${expectedSecAccept}, actual=${secAccept}`);
        }
    }
    exports_18("handshake", handshake);
    async function connectWebSocket(endpoint, headers = new Headers()) {
        const url = new URL(endpoint);
        const { hostname } = url;
        let conn;
        if (url.protocol === "http:" || url.protocol === "ws:") {
            const port = parseInt(url.port || "80");
            conn = await Deno.connect({ hostname, port });
        }
        else if (url.protocol === "https:" || url.protocol === "wss:") {
            const port = parseInt(url.port || "443");
            conn = await Deno.connectTls({ hostname, port });
        }
        else {
            throw new Error("ws: unsupported protocol: " + url.protocol);
        }
        const bufWriter = new bufio_ts_3.BufWriter(conn);
        const bufReader = new bufio_ts_3.BufReader(conn);
        try {
            await handshake(url, headers, bufReader, bufWriter);
        }
        catch (err) {
            conn.close();
            throw err;
        }
        return new WebSocketImpl({
            conn,
            bufWriter,
            bufReader,
            mask: createMask(),
        });
    }
    exports_18("connectWebSocket", connectWebSocket);
    function createWebSocket(params) {
        return new WebSocketImpl(params);
    }
    exports_18("createWebSocket", createWebSocket);
    return {
        setters: [
            function (utf8_ts_4_1) {
                utf8_ts_4 = utf8_ts_4_1;
            },
            function (has_own_property_ts_1_1) {
                has_own_property_ts_1 = has_own_property_ts_1_1;
            },
            function (bufio_ts_3_1) {
                bufio_ts_3 = bufio_ts_3_1;
            },
            function (ioutil_ts_1_1) {
                ioutil_ts_1 = ioutil_ts_1_1;
            },
            function (sha1_ts_1_1) {
                sha1_ts_1 = sha1_ts_1_1;
            },
            function (_io_ts_2_1) {
                _io_ts_2 = _io_ts_2_1;
            },
            function (mod_ts_5_1) {
                mod_ts_5 = mod_ts_5_1;
            },
            function (deferred_ts_3_1) {
                deferred_ts_3 = deferred_ts_3_1;
            },
            function (assert_ts_5_1) {
                assert_ts_5 = assert_ts_5_1;
            },
            function (mod_ts_6_1) {
                mod_ts_6 = mod_ts_6_1;
            }
        ],
        execute: function () {
            (function (OpCode) {
                OpCode[OpCode["Continue"] = 0] = "Continue";
                OpCode[OpCode["TextFrame"] = 1] = "TextFrame";
                OpCode[OpCode["BinaryFrame"] = 2] = "BinaryFrame";
                OpCode[OpCode["Close"] = 8] = "Close";
                OpCode[OpCode["Ping"] = 9] = "Ping";
                OpCode[OpCode["Pong"] = 10] = "Pong";
            })(OpCode || (OpCode = {}));
            exports_18("OpCode", OpCode);
            WebSocketImpl = class WebSocketImpl {
                constructor({ conn, bufReader, bufWriter, mask, }) {
                    this.sendQueue = [];
                    this._isClosed = false;
                    this.conn = conn;
                    this.mask = mask;
                    this.bufReader = bufReader || new bufio_ts_3.BufReader(conn);
                    this.bufWriter = bufWriter || new bufio_ts_3.BufWriter(conn);
                }
                async *[Symbol.asyncIterator]() {
                    let frames = [];
                    let payloadsLength = 0;
                    while (!this._isClosed) {
                        let frame;
                        try {
                            frame = await readFrame(this.bufReader);
                        }
                        catch (e) {
                            this.ensureSocketClosed();
                            break;
                        }
                        unmask(frame.payload, frame.mask);
                        switch (frame.opcode) {
                            case OpCode.TextFrame:
                            case OpCode.BinaryFrame:
                            case OpCode.Continue:
                                frames.push(frame);
                                payloadsLength += frame.payload.length;
                                if (frame.isLastFrame) {
                                    const concat = new Uint8Array(payloadsLength);
                                    let offs = 0;
                                    for (const frame of frames) {
                                        concat.set(frame.payload, offs);
                                        offs += frame.payload.length;
                                    }
                                    if (frames[0].opcode === OpCode.TextFrame) {
                                        yield utf8_ts_4.decode(concat);
                                    }
                                    else {
                                        yield concat;
                                    }
                                    frames = [];
                                    payloadsLength = 0;
                                }
                                break;
                            case OpCode.Close: {
                                const code = (frame.payload[0] << 8) | frame.payload[1];
                                const reason = utf8_ts_4.decode(frame.payload.subarray(2, frame.payload.length));
                                await this.close(code, reason);
                                yield { code, reason };
                                return;
                            }
                            case OpCode.Ping:
                                await this.enqueue({
                                    opcode: OpCode.Pong,
                                    payload: frame.payload,
                                    isLastFrame: true,
                                });
                                yield ["ping", frame.payload];
                                break;
                            case OpCode.Pong:
                                yield ["pong", frame.payload];
                                break;
                            default:
                        }
                    }
                }
                dequeue() {
                    const [entry] = this.sendQueue;
                    if (!entry)
                        return;
                    if (this._isClosed)
                        return;
                    const { d, frame } = entry;
                    writeFrame(frame, this.bufWriter)
                        .then(() => d.resolve())
                        .catch((e) => d.reject(e))
                        .finally(() => {
                        this.sendQueue.shift();
                        this.dequeue();
                    });
                }
                enqueue(frame) {
                    if (this._isClosed) {
                        throw new Deno.errors.ConnectionReset("Socket has already been closed");
                    }
                    const d = deferred_ts_3.deferred();
                    this.sendQueue.push({ d, frame });
                    if (this.sendQueue.length === 1) {
                        this.dequeue();
                    }
                    return d;
                }
                send(data) {
                    const opcode = typeof data === "string"
                        ? OpCode.TextFrame
                        : OpCode.BinaryFrame;
                    const payload = typeof data === "string" ? utf8_ts_4.encode(data) : data;
                    const isLastFrame = true;
                    const frame = {
                        isLastFrame,
                        opcode,
                        payload,
                        mask: this.mask,
                    };
                    return this.enqueue(frame);
                }
                ping(data = "") {
                    const payload = typeof data === "string" ? utf8_ts_4.encode(data) : data;
                    const frame = {
                        isLastFrame: true,
                        opcode: OpCode.Ping,
                        mask: this.mask,
                        payload,
                    };
                    return this.enqueue(frame);
                }
                get isClosed() {
                    return this._isClosed;
                }
                async close(code = 1000, reason) {
                    try {
                        const header = [code >>> 8, code & 0x00ff];
                        let payload;
                        if (reason) {
                            const reasonBytes = utf8_ts_4.encode(reason);
                            payload = new Uint8Array(2 + reasonBytes.byteLength);
                            payload.set(header);
                            payload.set(reasonBytes, 2);
                        }
                        else {
                            payload = new Uint8Array(header);
                        }
                        await this.enqueue({
                            isLastFrame: true,
                            opcode: OpCode.Close,
                            mask: this.mask,
                            payload,
                        });
                    }
                    catch (e) {
                        throw e;
                    }
                    finally {
                        this.ensureSocketClosed();
                    }
                }
                closeForce() {
                    this.ensureSocketClosed();
                }
                ensureSocketClosed() {
                    if (this.isClosed)
                        return;
                    try {
                        this.conn.close();
                    }
                    catch (e) {
                        console.error(e);
                    }
                    finally {
                        this._isClosed = true;
                        const rest = this.sendQueue;
                        this.sendQueue = [];
                        rest.forEach((e) => e.d.reject(new Deno.errors.ConnectionReset("Socket has already been closed")));
                    }
                }
            };
            kGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            kSecChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-.~_";
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/_util/_util_promisify", [], function (exports_19, context_19) {
    "use strict";
    var kCustomPromisifiedSymbol, kCustomPromisifyArgsSymbol, NodeInvalidArgTypeError;
    var __moduleName = context_19 && context_19.id;
    function promisify(original) {
        if (typeof original !== "function") {
            throw new NodeInvalidArgTypeError("original", "Function", original);
        }
        if (original[kCustomPromisifiedSymbol]) {
            const fn = original[kCustomPromisifiedSymbol];
            if (typeof fn !== "function") {
                throw new NodeInvalidArgTypeError("util.promisify.custom", "Function", fn);
            }
            return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
                value: fn,
                enumerable: false,
                writable: false,
                configurable: true,
            });
        }
        const argumentNames = original[kCustomPromisifyArgsSymbol];
        function fn(...args) {
            return new Promise((resolve, reject) => {
                original.call(this, ...args, (err, ...values) => {
                    if (err) {
                        return reject(err);
                    }
                    if (argumentNames !== undefined && values.length > 1) {
                        const obj = {};
                        for (let i = 0; i < argumentNames.length; i++) {
                            obj[argumentNames[i]] = values[i];
                        }
                        resolve(obj);
                    }
                    else {
                        resolve(values[0]);
                    }
                });
            });
        }
        Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true,
        });
        return Object.defineProperties(fn, Object.getOwnPropertyDescriptors(original));
    }
    exports_19("promisify", promisify);
    return {
        setters: [],
        execute: function () {
            kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
            kCustomPromisifyArgsSymbol = Symbol.for("nodejs.util.promisify.customArgs");
            NodeInvalidArgTypeError = class NodeInvalidArgTypeError extends TypeError {
                constructor(argumentName, type, received) {
                    super(`The "${argumentName}" argument must be of type ${type}. Received ${typeof received}`);
                    this.code = "ERR_INVALID_ARG_TYPE";
                }
            };
            promisify.custom = kCustomPromisifiedSymbol;
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/_util/_util_callbackify", [], function (exports_20, context_20) {
    "use strict";
    var NodeFalsyValueRejectionError, NodeInvalidArgTypeError;
    var __moduleName = context_20 && context_20.id;
    function callbackify(original) {
        if (typeof original !== "function") {
            throw new NodeInvalidArgTypeError('"original"');
        }
        const callbackified = function (...args) {
            const maybeCb = args.pop();
            if (typeof maybeCb !== "function") {
                throw new NodeInvalidArgTypeError("last");
            }
            const cb = (...args) => {
                maybeCb.apply(this, args);
            };
            original.apply(this, args).then((ret) => {
                queueMicrotask(cb.bind(this, null, ret));
            }, (rej) => {
                rej = rej || new NodeFalsyValueRejectionError(rej);
                queueMicrotask(cb.bind(this, rej));
            });
        };
        const descriptors = Object.getOwnPropertyDescriptors(original);
        if (typeof descriptors.length.value === "number") {
            descriptors.length.value++;
        }
        if (typeof descriptors.name.value === "string") {
            descriptors.name.value += "Callbackified";
        }
        Object.defineProperties(callbackified, descriptors);
        return callbackified;
    }
    exports_20("callbackify", callbackify);
    return {
        setters: [],
        execute: function () {
            NodeFalsyValueRejectionError = class NodeFalsyValueRejectionError extends Error {
                constructor(reason) {
                    super("Promise was rejected with falsy value");
                    this.code = "ERR_FALSY_VALUE_REJECTION";
                    this.reason = reason;
                }
            };
            NodeInvalidArgTypeError = class NodeInvalidArgTypeError extends TypeError {
                constructor(argumentName) {
                    super(`The ${argumentName} argument must be of type function.`);
                    this.code = "ERR_INVALID_ARG_TYPE";
                }
            };
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/_util/_util_types", [], function (exports_21, context_21) {
    "use strict";
    var _toString, _isObjectLike, _isFunctionLike;
    var __moduleName = context_21 && context_21.id;
    function isAnyArrayBuffer(value) {
        return (_isObjectLike(value) &&
            (_toString.call(value) === "[object ArrayBuffer]" ||
                _toString.call(value) === "[object SharedArrayBuffer]"));
    }
    exports_21("isAnyArrayBuffer", isAnyArrayBuffer);
    function isArrayBufferView(value) {
        return ArrayBuffer.isView(value);
    }
    exports_21("isArrayBufferView", isArrayBufferView);
    function isArgumentsObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Arguments]";
    }
    exports_21("isArgumentsObject", isArgumentsObject);
    function isArrayBuffer(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object ArrayBuffer]");
    }
    exports_21("isArrayBuffer", isArrayBuffer);
    function isAsyncFunction(value) {
        return (_isFunctionLike(value) && _toString.call(value) === "[object AsyncFunction]");
    }
    exports_21("isAsyncFunction", isAsyncFunction);
    function isBigInt64Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object BigInt64Array]");
    }
    exports_21("isBigInt64Array", isBigInt64Array);
    function isBigUint64Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object BigUint64Array]");
    }
    exports_21("isBigUint64Array", isBigUint64Array);
    function isBooleanObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Boolean]";
    }
    exports_21("isBooleanObject", isBooleanObject);
    function isBoxedPrimitive(value) {
        return (isBooleanObject(value) ||
            isStringObject(value) ||
            isNumberObject(value) ||
            isSymbolObject(value) ||
            isBigIntObject(value));
    }
    exports_21("isBoxedPrimitive", isBoxedPrimitive);
    function isDataView(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object DataView]";
    }
    exports_21("isDataView", isDataView);
    function isDate(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Date]";
    }
    exports_21("isDate", isDate);
    function isFloat32Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Float32Array]");
    }
    exports_21("isFloat32Array", isFloat32Array);
    function isFloat64Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Float64Array]");
    }
    exports_21("isFloat64Array", isFloat64Array);
    function isGeneratorFunction(value) {
        return (_isFunctionLike(value) &&
            _toString.call(value) === "[object GeneratorFunction]");
    }
    exports_21("isGeneratorFunction", isGeneratorFunction);
    function isGeneratorObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Generator]";
    }
    exports_21("isGeneratorObject", isGeneratorObject);
    function isInt8Array(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Int8Array]";
    }
    exports_21("isInt8Array", isInt8Array);
    function isInt16Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Int16Array]");
    }
    exports_21("isInt16Array", isInt16Array);
    function isInt32Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Int32Array]");
    }
    exports_21("isInt32Array", isInt32Array);
    function isMap(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Map]";
    }
    exports_21("isMap", isMap);
    function isMapIterator(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Map Iterator]");
    }
    exports_21("isMapIterator", isMapIterator);
    function isModuleNamespaceObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Module]";
    }
    exports_21("isModuleNamespaceObject", isModuleNamespaceObject);
    function isNativeError(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Error]";
    }
    exports_21("isNativeError", isNativeError);
    function isNumberObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Number]";
    }
    exports_21("isNumberObject", isNumberObject);
    function isBigIntObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object BigInt]";
    }
    exports_21("isBigIntObject", isBigIntObject);
    function isPromise(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Promise]";
    }
    exports_21("isPromise", isPromise);
    function isRegExp(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object RegExp]";
    }
    exports_21("isRegExp", isRegExp);
    function isSet(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Set]";
    }
    exports_21("isSet", isSet);
    function isSetIterator(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Set Iterator]");
    }
    exports_21("isSetIterator", isSetIterator);
    function isSharedArrayBuffer(value) {
        return (_isObjectLike(value) &&
            _toString.call(value) === "[object SharedArrayBuffer]");
    }
    exports_21("isSharedArrayBuffer", isSharedArrayBuffer);
    function isStringObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object String]";
    }
    exports_21("isStringObject", isStringObject);
    function isSymbolObject(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object Symbol]";
    }
    exports_21("isSymbolObject", isSymbolObject);
    function isTypedArray(value) {
        const reTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)Array\]$/;
        return _isObjectLike(value) && reTypedTag.test(_toString.call(value));
    }
    exports_21("isTypedArray", isTypedArray);
    function isUint8Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Uint8Array]");
    }
    exports_21("isUint8Array", isUint8Array);
    function isUint8ClampedArray(value) {
        return (_isObjectLike(value) &&
            _toString.call(value) === "[object Uint8ClampedArray]");
    }
    exports_21("isUint8ClampedArray", isUint8ClampedArray);
    function isUint16Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Uint16Array]");
    }
    exports_21("isUint16Array", isUint16Array);
    function isUint32Array(value) {
        return (_isObjectLike(value) && _toString.call(value) === "[object Uint32Array]");
    }
    exports_21("isUint32Array", isUint32Array);
    function isWeakMap(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object WeakMap]";
    }
    exports_21("isWeakMap", isWeakMap);
    function isWeakSet(value) {
        return _isObjectLike(value) && _toString.call(value) === "[object WeakSet]";
    }
    exports_21("isWeakSet", isWeakSet);
    return {
        setters: [],
        execute: function () {
            _toString = Object.prototype.toString;
            _isObjectLike = (value) => value !== null && typeof value === "object";
            _isFunctionLike = (value) => value !== null && typeof value === "function";
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/_utils", [], function (exports_22, context_22) {
    "use strict";
    var _TextDecoder, _TextEncoder;
    var __moduleName = context_22 && context_22.id;
    function notImplemented(msg) {
        const message = msg ? `Not implemented: ${msg}` : "Not implemented";
        throw new Error(message);
    }
    exports_22("notImplemented", notImplemented);
    function intoCallbackAPI(func, cb, ...args) {
        func(...args)
            .then((value) => cb && cb(null, value))
            .catch((err) => cb && cb(err, null));
    }
    exports_22("intoCallbackAPI", intoCallbackAPI);
    function intoCallbackAPIWithIntercept(func, interceptor, cb, ...args) {
        func(...args)
            .then((value) => cb && cb(null, interceptor(value)))
            .catch((err) => cb && cb(err, null));
    }
    exports_22("intoCallbackAPIWithIntercept", intoCallbackAPIWithIntercept);
    function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
            list[index] = list[index + 1];
        list.pop();
    }
    exports_22("spliceOne", spliceOne);
    function normalizeEncoding(enc) {
        if (enc == null || enc === "utf8" || enc === "utf-8")
            return "utf8";
        return slowCases(enc);
    }
    exports_22("normalizeEncoding", normalizeEncoding);
    function slowCases(enc) {
        switch (enc.length) {
            case 4:
                if (enc === "UTF8")
                    return "utf8";
                if (enc === "ucs2" || enc === "UCS2")
                    return "utf16le";
                enc = `${enc}`.toLowerCase();
                if (enc === "utf8")
                    return "utf8";
                if (enc === "ucs2")
                    return "utf16le";
                break;
            case 3:
                if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
                    return "hex";
                }
                break;
            case 5:
                if (enc === "ascii")
                    return "ascii";
                if (enc === "ucs-2")
                    return "utf16le";
                if (enc === "UTF-8")
                    return "utf8";
                if (enc === "ASCII")
                    return "ascii";
                if (enc === "UCS-2")
                    return "utf16le";
                enc = `${enc}`.toLowerCase();
                if (enc === "utf-8")
                    return "utf8";
                if (enc === "ascii")
                    return "ascii";
                if (enc === "ucs-2")
                    return "utf16le";
                break;
            case 6:
                if (enc === "base64")
                    return "base64";
                if (enc === "latin1" || enc === "binary")
                    return "latin1";
                if (enc === "BASE64")
                    return "base64";
                if (enc === "LATIN1" || enc === "BINARY")
                    return "latin1";
                enc = `${enc}`.toLowerCase();
                if (enc === "base64")
                    return "base64";
                if (enc === "latin1" || enc === "binary")
                    return "latin1";
                break;
            case 7:
                if (enc === "utf16le" ||
                    enc === "UTF16LE" ||
                    `${enc}`.toLowerCase() === "utf16le") {
                    return "utf16le";
                }
                break;
            case 8:
                if (enc === "utf-16le" ||
                    enc === "UTF-16LE" ||
                    `${enc}`.toLowerCase() === "utf-16le") {
                    return "utf16le";
                }
                break;
            default:
                if (enc === "")
                    return "utf8";
        }
    }
    return {
        setters: [],
        execute: function () {
            exports_22("_TextDecoder", _TextDecoder = TextDecoder);
            exports_22("_TextEncoder", _TextEncoder = TextEncoder);
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/util", ["https://deno.land/std@0.63.0/node/_util/_util_promisify", "https://deno.land/std@0.63.0/node/_util/_util_callbackify", "https://deno.land/std@0.63.0/node/_util/_util_types", "https://deno.land/std@0.63.0/node/_utils"], function (exports_23, context_23) {
    "use strict";
    var types, _utils_ts_1, TextDecoder, TextEncoder;
    var __moduleName = context_23 && context_23.id;
    function isArray(value) {
        return Array.isArray(value);
    }
    exports_23("isArray", isArray);
    function isBoolean(value) {
        return typeof value === "boolean" || value instanceof Boolean;
    }
    exports_23("isBoolean", isBoolean);
    function isNull(value) {
        return value === null;
    }
    exports_23("isNull", isNull);
    function isNullOrUndefined(value) {
        return value === null || value === undefined;
    }
    exports_23("isNullOrUndefined", isNullOrUndefined);
    function isNumber(value) {
        return typeof value === "number" || value instanceof Number;
    }
    exports_23("isNumber", isNumber);
    function isString(value) {
        return typeof value === "string" || value instanceof String;
    }
    exports_23("isString", isString);
    function isSymbol(value) {
        return typeof value === "symbol";
    }
    exports_23("isSymbol", isSymbol);
    function isUndefined(value) {
        return value === undefined;
    }
    exports_23("isUndefined", isUndefined);
    function isObject(value) {
        return value !== null && typeof value === "object";
    }
    exports_23("isObject", isObject);
    function isError(e) {
        return e instanceof Error;
    }
    exports_23("isError", isError);
    function isFunction(value) {
        return typeof value === "function";
    }
    exports_23("isFunction", isFunction);
    function isRegExp(value) {
        return value instanceof RegExp;
    }
    exports_23("isRegExp", isRegExp);
    function isPrimitive(value) {
        return (value === null || (typeof value !== "object" && typeof value !== "function"));
    }
    exports_23("isPrimitive", isPrimitive);
    function validateIntegerRange(value, name, min = -2147483648, max = 2147483647) {
        if (!Number.isInteger(value)) {
            throw new Error(`${name} must be 'an integer' but was ${value}`);
        }
        if (value < min || value > max) {
            throw new Error(`${name} must be >= ${min} && <= ${max}.  Value was ${value}`);
        }
    }
    exports_23("validateIntegerRange", validateIntegerRange);
    return {
        setters: [
            function (_util_promisify_ts_1_1) {
                exports_23({
                    "promisify": _util_promisify_ts_1_1["promisify"]
                });
            },
            function (_util_callbackify_ts_1_1) {
                exports_23({
                    "callbackify": _util_callbackify_ts_1_1["callbackify"]
                });
            },
            function (types_1) {
                types = types_1;
            },
            function (_utils_ts_1_1) {
                _utils_ts_1 = _utils_ts_1_1;
            }
        ],
        execute: function () {
            exports_23("types", types);
            exports_23("TextDecoder", TextDecoder = _utils_ts_1._TextDecoder);
            exports_23("TextEncoder", TextEncoder = _utils_ts_1._TextEncoder);
        }
    };
});
System.register("https://deno.land/std@0.63.0/node/events", ["https://deno.land/std@0.63.0/node/util", "https://deno.land/std@0.63.0/_util/assert"], function (exports_24, context_24) {
    "use strict";
    var util_ts_1, assert_ts_6, EventEmitter, captureRejectionSymbol;
    var __moduleName = context_24 && context_24.id;
    function once(emitter, name) {
        return new Promise((resolve, reject) => {
            if (emitter instanceof EventTarget) {
                emitter.addEventListener(name, (...args) => {
                    resolve(args);
                }, { once: true, passive: false, capture: false });
                return;
            }
            else if (emitter instanceof EventEmitter) {
                const eventListener = (...args) => {
                    if (errorListener !== undefined) {
                        emitter.removeListener("error", errorListener);
                    }
                    resolve(args);
                };
                let errorListener;
                if (name !== "error") {
                    errorListener = (err) => {
                        emitter.removeListener(name, eventListener);
                        reject(err);
                    };
                    emitter.once("error", errorListener);
                }
                emitter.once(name, eventListener);
                return;
            }
        });
    }
    exports_24("once", once);
    function createIterResult(value, done) {
        return { value, done };
    }
    function on(emitter, event) {
        const unconsumedEventValues = [];
        const unconsumedPromises = [];
        let error = null;
        let finished = false;
        const iterator = {
            next() {
                const value = unconsumedEventValues.shift();
                if (value) {
                    return Promise.resolve(createIterResult(value, false));
                }
                if (error) {
                    const p = Promise.reject(error);
                    error = null;
                    return p;
                }
                if (finished) {
                    return Promise.resolve(createIterResult(undefined, true));
                }
                return new Promise(function (resolve, reject) {
                    unconsumedPromises.push({ resolve, reject });
                });
            },
            return() {
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
                finished = true;
                for (const promise of unconsumedPromises) {
                    promise.resolve(createIterResult(undefined, true));
                }
                return Promise.resolve(createIterResult(undefined, true));
            },
            throw(err) {
                error = err;
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
            },
            [Symbol.asyncIterator]() {
                return this;
            },
        };
        emitter.on(event, eventHandler);
        emitter.on("error", errorHandler);
        return iterator;
        function eventHandler(...args) {
            const promise = unconsumedPromises.shift();
            if (promise) {
                promise.resolve(createIterResult(args, false));
            }
            else {
                unconsumedEventValues.push(args);
            }
        }
        function errorHandler(err) {
            finished = true;
            const toError = unconsumedPromises.shift();
            if (toError) {
                toError.reject(err);
            }
            else {
                error = err;
            }
            iterator.return();
        }
    }
    exports_24("on", on);
    return {
        setters: [
            function (util_ts_1_1) {
                util_ts_1 = util_ts_1_1;
            },
            function (assert_ts_6_1) {
                assert_ts_6 = assert_ts_6_1;
            }
        ],
        execute: function () {
            EventEmitter = (() => {
                class EventEmitter {
                    constructor() {
                        this._events = new Map();
                    }
                    _addListener(eventName, listener, prepend) {
                        this.emit("newListener", eventName, listener);
                        if (this._events.has(eventName)) {
                            const listeners = this._events.get(eventName);
                            if (prepend) {
                                listeners.unshift(listener);
                            }
                            else {
                                listeners.push(listener);
                            }
                        }
                        else {
                            this._events.set(eventName, [listener]);
                        }
                        const max = this.getMaxListeners();
                        if (max > 0 && this.listenerCount(eventName) > max) {
                            const warning = new Error(`Possible EventEmitter memory leak detected.
         ${this.listenerCount(eventName)} ${eventName.toString()} listeners.
         Use emitter.setMaxListeners() to increase limit`);
                            warning.name = "MaxListenersExceededWarning";
                            console.warn(warning);
                        }
                        return this;
                    }
                    addListener(eventName, listener) {
                        return this._addListener(eventName, listener, false);
                    }
                    emit(eventName, ...args) {
                        if (this._events.has(eventName)) {
                            if (eventName === "error" &&
                                this._events.get(EventEmitter.errorMonitor)) {
                                this.emit(EventEmitter.errorMonitor, ...args);
                            }
                            const listeners = this._events.get(eventName).slice();
                            for (const listener of listeners) {
                                try {
                                    listener.apply(this, args);
                                }
                                catch (err) {
                                    this.emit("error", err);
                                }
                            }
                            return true;
                        }
                        else if (eventName === "error") {
                            if (this._events.get(EventEmitter.errorMonitor)) {
                                this.emit(EventEmitter.errorMonitor, ...args);
                            }
                            const errMsg = args.length > 0 ? args[0] : Error("Unhandled error.");
                            throw errMsg;
                        }
                        return false;
                    }
                    eventNames() {
                        return Array.from(this._events.keys());
                    }
                    getMaxListeners() {
                        return this.maxListeners || EventEmitter.defaultMaxListeners;
                    }
                    listenerCount(eventName) {
                        if (this._events.has(eventName)) {
                            return this._events.get(eventName).length;
                        }
                        else {
                            return 0;
                        }
                    }
                    _listeners(target, eventName, unwrap) {
                        if (!target._events.has(eventName)) {
                            return [];
                        }
                        const eventListeners = target._events.get(eventName);
                        return unwrap
                            ? this.unwrapListeners(eventListeners)
                            : eventListeners.slice(0);
                    }
                    unwrapListeners(arr) {
                        const unwrappedListeners = new Array(arr.length);
                        for (let i = 0; i < arr.length; i++) {
                            unwrappedListeners[i] = arr[i]["listener"] || arr[i];
                        }
                        return unwrappedListeners;
                    }
                    listeners(eventName) {
                        return this._listeners(this, eventName, true);
                    }
                    rawListeners(eventName) {
                        return this._listeners(this, eventName, false);
                    }
                    off(eventName, listener) {
                        return this.removeListener(eventName, listener);
                    }
                    on(eventName, listener) {
                        return this.addListener(eventName, listener);
                    }
                    once(eventName, listener) {
                        const wrapped = this.onceWrap(eventName, listener);
                        this.on(eventName, wrapped);
                        return this;
                    }
                    onceWrap(eventName, listener) {
                        const wrapper = function (...args) {
                            this.context.removeListener(this.eventName, this.rawListener);
                            this.listener.apply(this.context, args);
                        };
                        const wrapperContext = {
                            eventName: eventName,
                            listener: listener,
                            rawListener: wrapper,
                            context: this,
                        };
                        const wrapped = wrapper.bind(wrapperContext);
                        wrapperContext.rawListener = wrapped;
                        wrapped.listener = listener;
                        return wrapped;
                    }
                    prependListener(eventName, listener) {
                        return this._addListener(eventName, listener, true);
                    }
                    prependOnceListener(eventName, listener) {
                        const wrapped = this.onceWrap(eventName, listener);
                        this.prependListener(eventName, wrapped);
                        return this;
                    }
                    removeAllListeners(eventName) {
                        if (this._events === undefined) {
                            return this;
                        }
                        if (eventName) {
                            if (this._events.has(eventName)) {
                                const listeners = this._events.get(eventName).slice();
                                this._events.delete(eventName);
                                for (const listener of listeners) {
                                    this.emit("removeListener", eventName, listener);
                                }
                            }
                        }
                        else {
                            const eventList = this.eventNames();
                            eventList.map((value) => {
                                this.removeAllListeners(value);
                            });
                        }
                        return this;
                    }
                    removeListener(eventName, listener) {
                        if (this._events.has(eventName)) {
                            const arr = this._events.get(eventName);
                            assert_ts_6.assert(arr);
                            let listenerIndex = -1;
                            for (let i = arr.length - 1; i >= 0; i--) {
                                if (arr[i] == listener ||
                                    (arr[i] && arr[i]["listener"] == listener)) {
                                    listenerIndex = i;
                                    break;
                                }
                            }
                            if (listenerIndex >= 0) {
                                arr.splice(listenerIndex, 1);
                                this.emit("removeListener", eventName, listener);
                                if (arr.length === 0) {
                                    this._events.delete(eventName);
                                }
                            }
                        }
                        return this;
                    }
                    setMaxListeners(n) {
                        util_ts_1.validateIntegerRange(n, "maxListeners", 0);
                        this.maxListeners = n;
                        return this;
                    }
                }
                EventEmitter.defaultMaxListeners = 10;
                EventEmitter.errorMonitor = Symbol("events.errorMonitor");
                return EventEmitter;
            })();
            exports_24("EventEmitter", EventEmitter);
            exports_24("default", EventEmitter);
            exports_24("captureRejectionSymbol", captureRejectionSymbol = Symbol.for("nodejs.rejection"));
        }
    };
});
System.register("file:///home/vscode/server/src/Rcon", ["https://deno.land/std@0.63.0/ws/mod", "https://deno.land/std@0.63.0/node/events"], function (exports_25, context_25) {
    "use strict";
    var mod_ts_7, events_ts_1, Rcon;
    var __moduleName = context_25 && context_25.id;
    return {
        setters: [
            function (mod_ts_7_1) {
                mod_ts_7 = mod_ts_7_1;
            },
            function (events_ts_1_1) {
                events_ts_1 = events_ts_1_1;
            }
        ],
        execute: function () {
            Rcon = class Rcon extends events_ts_1.EventEmitter {
                constructor() {
                    super(...arguments);
                    this._connected = false;
                }
                get connected() {
                    return this._connected;
                }
                async connect(port, password, ip) {
                    try {
                        this._sock = await mod_ts_7.connectWebSocket(`ws://${ip || 'localhost'}:${port}/${password}`);
                        this._connected = true;
                        this.emit('connected');
                        this._poll();
                    }
                    catch (err) {
                        this.emit('failed', err);
                    }
                }
                async send(data) {
                    if (!this._connected) {
                        return;
                    }
                    if (this._sock) {
                        await this._sock.send(JSON.stringify({
                            Identifier: -1,
                            Message: data,
                            Name: 'WebRcon'
                        }));
                    }
                }
                async _poll() {
                    if (!this._sock || !this._connected) {
                        return;
                    }
                    for await (const msg of this._sock) {
                        if (!this._connected) {
                            break;
                        }
                        if (typeof msg === 'string') {
                            try {
                                const json = JSON.parse(msg);
                                this.emit('packet', json);
                                if (json !== undefined) {
                                    if (json.Message !== undefined && json.Message.length > 0) {
                                        this.emit('message', json.Message);
                                    }
                                }
                                else {
                                    this.emit('warn', 'Invalid JSON received');
                                }
                            }
                            catch (err) {
                                this.emit('error', err);
                            }
                        }
                        else if (mod_ts_7.isWebSocketCloseEvent(msg)) {
                            this.close(msg.code, msg.reason);
                            break;
                        }
                    }
                }
                close(code, reason) {
                    if (this._sock) {
                        this._sock.close();
                    }
                    this._connected = false;
                    this.emit('close', code, reason);
                }
            };
            exports_25("Rcon", Rcon);
        }
    };
});
System.register("file:///home/vscode/server/src/LineReader", ["https://deno.land/std@0.63.0/node/events"], function (exports_26, context_26) {
    "use strict";
    var events_ts_2, LineReader;
    var __moduleName = context_26 && context_26.id;
    return {
        setters: [
            function (events_ts_2_1) {
                events_ts_2 = events_ts_2_1;
            }
        ],
        execute: function () {
            LineReader = class LineReader extends events_ts_2.EventEmitter {
                constructor(reader, length = 1) {
                    super();
                    this._line = '';
                    this._closed = false;
                    this._decoder = new TextDecoder();
                    this._r = reader;
                    this._buf = new Uint8Array(length);
                    this._read();
                }
                get closed() {
                    return this._closed;
                }
                async _read() {
                    while (true) {
                        try {
                            let result = await this._r.read(this._buf);
                            if (!result) {
                                this.close();
                                break;
                            }
                            this.emit('data', this._buf);
                            const char = this._decoder.decode(this._buf);
                            if (this._buf[0] !== 10 && this._buf[0] !== 13) {
                                this._line = this._line + char;
                            }
                            else {
                                this.emit('line', this._line);
                                this._line = '';
                            }
                        }
                        catch (err) {
                            this.emit('error', err);
                            break;
                        }
                    }
                }
                close() {
                    if (this._closed) {
                        return;
                    }
                    this._closed = true;
                    this._r.close();
                    this.emit('close');
                }
            };
            exports_26("LineReader", LineReader);
        }
    };
});
System.register("file:///home/vscode/server/src/ChildProcess", ["https://deno.land/std@0.63.0/node/events", "file:///home/vscode/server/src/LineReader"], function (exports_27, context_27) {
    "use strict";
    var events_ts_3, LineReader_ts_1, encoder, ChildProcess;
    var __moduleName = context_27 && context_27.id;
    return {
        setters: [
            function (events_ts_3_1) {
                events_ts_3 = events_ts_3_1;
            },
            function (LineReader_ts_1_1) {
                LineReader_ts_1 = LineReader_ts_1_1;
            }
        ],
        execute: function () {
            encoder = new TextEncoder();
            ChildProcess = class ChildProcess extends events_ts_3.EventEmitter {
                constructor(cmd, env) {
                    super();
                    this._exited = false;
                    this._proc = Deno.run({ cmd, env, stdout: 'piped', stderr: 'piped' });
                    this.stdout = new LineReader_ts_1.LineReader(this._proc.stdout);
                    this.stderr = new LineReader_ts_1.LineReader(this._proc.stderr);
                    this._status();
                }
                get exited() {
                    return this._exited;
                }
                get pid() {
                    return this._proc.pid;
                }
                get rid() {
                    return this._proc.rid;
                }
                kill(signo) {
                    this._proc.kill(signo);
                }
                async write(p) {
                    if (this._proc.stdin) {
                        return await this._proc.stdin.write(p);
                    }
                    return 0;
                }
                async writeText(str) {
                    if (this._proc.stdin) {
                        return await this._proc.stdin.write(encoder.encode(str));
                    }
                    return 0;
                }
                async _status() {
                    const { success, code, signal } = await this._proc.status();
                    this._exit(success, code, signal);
                }
                async _exit(success, code, signal) {
                    if (this._exited) {
                        return;
                    }
                    this._exited = true;
                    this.stdout.close();
                    this.stderr.close();
                    if (this._proc.stdin) {
                        this._proc.stdin.close();
                    }
                    this._proc.close();
                    this.emit('exit', success, code, signal);
                }
            };
            exports_27("ChildProcess", ChildProcess);
        }
    };
});
System.register("file:///home/vscode/server/src/Utils", [], function (exports_28, context_28) {
    "use strict";
    var __moduleName = context_28 && context_28.id;
    function filter(line) {
        return line.trim() !== '' && !line.match(/filename\:/ig);
    }
    exports_28("filter", filter);
    function parse(str) {
        const args = [];
        let _r = false;
        let _p = '';
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) === ' ' && !_r) {
                args.push(_p);
                _p = '';
            }
            else {
                if (str.charAt(i).match(/\"/)) {
                    _r = !_r;
                }
                else {
                    _p += str.charAt(i);
                }
            }
        }
        args.push(_p);
        return args;
    }
    exports_28("parse", parse);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("file:///home/vscode/server/src/wrapper", ["https://deno.land/std@0.63.0/signal/mod", "file:///home/vscode/server/src/Rcon", "file:///home/vscode/server/src/ChildProcess", "file:///home/vscode/server/src/LineReader", "file:///home/vscode/server/src/Utils"], function (exports_29, context_29) {
    "use strict";
    var mod_ts_8, Rcon_ts_1, ChildProcess_ts_1, LineReader_ts_2, Utils_ts_1, env, rcon, process, stdin, RCON_IP, RCON_PORT, RCON_PASS, connect, kill, update;
    var __moduleName = context_29 && context_29.id;
    return {
        setters: [
            function (mod_ts_8_1) {
                mod_ts_8 = mod_ts_8_1;
            },
            function (Rcon_ts_1_1) {
                Rcon_ts_1 = Rcon_ts_1_1;
            },
            function (ChildProcess_ts_1_1) {
                ChildProcess_ts_1 = ChildProcess_ts_1_1;
            },
            function (LineReader_ts_2_1) {
                LineReader_ts_2 = LineReader_ts_2_1;
            },
            function (Utils_ts_1_1) {
                Utils_ts_1 = Utils_ts_1_1;
            }
        ],
        execute: function () {
            env = Deno.env.toObject();
            rcon = new Rcon_ts_1.Rcon();
            process = new ChildProcess_ts_1.ChildProcess(Utils_ts_1.parse(Deno.args[0]), env);
            stdin = new LineReader_ts_2.LineReader(Deno.stdin);
            RCON_IP = env.RCON_IP, RCON_PORT = env.RCON_PORT, RCON_PASS = env.RCON_PASS;
            connect = () => {
                setTimeout(() => {
                    rcon.connect(RCON_PORT, RCON_PASS, RCON_IP);
                }, 5000);
            };
            kill = () => {
                if (rcon.connected) {
                    rcon.close(0);
                }
                process.kill(Deno.Signal.SIGINT);
            };
            update = async () => {
                try {
                    console.log('Checing for new version...');
                    const decoder = new TextDecoder('utf-8');
                    const data = await Deno.readFile('latest.json');
                    const current = JSON.parse(decoder.decode(data));
                    console.log(`Current version is: ${current.version}`);
                    const response = await fetch('https://umod.org/games/rust/latest.json');
                    const latest = await response.json();
                    console.log(`Latest version is: ${latest.version}`);
                    if (current.version !== latest.version) {
                        console.log(`New verson found '${latest.version}', restarting server!`);
                        kill();
                    }
                    else {
                        console.log(`No new versons found...`);
                        setTimeout(() => {
                            update();
                        }, 1000 * 60 * 60);
                    }
                }
                catch (err) {
                    console.log(err);
                    setTimeout(() => {
                        update();
                    }, 60000);
                }
            };
            rcon.on('failed', err => {
                console.log('failed to connect to rcon, retrying:', err);
                connect();
            });
            rcon.on('connected', () => {
                rcon.send('status');
            });
            rcon.on('close', (code, reason) => {
                if (code !== 0) {
                    console.log('RCON closed, retrying:', { code, reason });
                    connect();
                }
            });
            rcon.on('message', (message) => {
                if (Utils_ts_1.filter(message)) {
                    console.log(message);
                }
            });
            process.stdout.on('line', (line) => {
                if (line.match(/server\sstartup\scomplete/gi)) {
                    update();
                    console.log('Connecting to RCON');
                    connect();
                }
                if (Utils_ts_1.filter(line) && !rcon.connected) {
                    console.log(line);
                }
            });
            process.stderr.on('line', (line) => {
                if (Utils_ts_1.filter(line)) {
                    console.log(line);
                }
            });
            stdin.on('line', (line) => {
                if (line.trim() === 'quit') {
                    kill();
                }
                else {
                    if (rcon.connected) {
                        rcon.send(line);
                    }
                    else {
                        console.log(`Can't run '${line}', rcon is not connected!`);
                    }
                }
            });
            process.once('exit', (success, code, signal) => {
                console.log(`game quit with code ${code}`);
                Deno.exit();
            });
            mod_ts_8.onSignal(Deno.Signal.SIGINT, () => {
                kill();
                setTimeout(() => {
                    Deno.exit();
                }, 60000);
            });
        }
    };
});

__instantiate("file:///home/vscode/server/src/wrapper", false);
