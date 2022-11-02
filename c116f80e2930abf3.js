export class vElement {
    constructor(tag) {
        this.attributes = Object.create(null);
        this.properties = Object.create(null);
        this.$on = Object.create(null);
        this.$once = Object.create(null);
        this.style = Object.create(null);
        this.children = [];
        this.$ref = null;
        this.tag = tag;
    }
    on(type, handler) {
        if (!this.$on[type]) {
            this.$on[type] = [];
        }
        this.$on[type].push(handler);
        return this;
    }
    ons(types, handler) {
        for (const t of types) {
            this.on(t, handler);
        }
        return this;
    }
    once(type, handler) {
        if (!this.$once[type]) {
            this.$once[type] = [];
        }
        this.$once[type].push(handler);
        return this;
    }
    emit(ev, info) {
        {
            const m = this.$on[ev];
            if (m && m.length) {
                for (let i = 0, l = m.length; i < l; i++) {
                    m[i](info);
                }
            }
        }
        {
            const m = this.$once[ev];
            if (m && m.length) {
                for (let i = 0, l = m.length; i < l; i++) {
                    m[i](info);
                }
                m.length = 0;
            }
        }
    }
    addEventListener(type, handler) {
        this.on(type, handler);
        return this;
    }
    addClass(c) {
        const oc = (this.attributes.class || '') + ' ' + c;
        const s = new Set(oc.split(/\s/).filter(x => !!x));
        this.setAttributes({ class: [...s].join(' ') });
        return this;
    }
    addChildren(children) {
        for (let child of children) {
            this.addChild(child);
        }
        return this;
    }
    addChild(child) {
        if (typeof child === 'string') {
            child = new vText(child);
        }
        if (!child) {
            return this;
        }
        this.children.push(child);
        return this;
    }
    addText(s) {
        this.addChildren([s]);
        return this;
    }
    setAny(t) {
        let { properties } = this;
        for (let [key, value] of Object.entries(t)) {
            properties[key] = value;
        }
        return this;
    }
    setProperties(t) {
        let { properties } = this;
        for (let [key, value] of Object.entries(t)) {
            properties[key] = value;
        }
        return this;
    }
    setStyle(t) {
        let { style } = this;
        for (let [key, value] of Object.entries(t)) {
            style[key] = value;
        }
        return this;
    }
    setValue(v) {
        this.properties.value = v;
        return this;
    }
    setAttributes(t) {
        let { attributes } = this;
        for (let [key, value] of Object.entries(t)) {
            attributes[key] = value;
        }
        return this;
    }
    removeStyle(key) {
        this.style[key] = null;
        return this;
    }
    removeAttribute(key) {
        this.attributes[key] = null;
        return this;
    }
    afterRendOrDiff() { }
}
export class vText {
    constructor(data) {
        this.data = '';
        this.$ref = null;
        this.data = data;
    }
    afterRendOrDiff() { }
}
function isNul(item) {
    return (item === null) || (item === void 0);
}
export class Watcher {
    constructor(init) {
        this.listened = [];
        this.target = null;
        this.flushMs = 100;
        this.flushAfterEvent = false;
        this.$on = Object.create(null);
        this.$once = Object.create(null);
        this.flushing = false;
        this.vdomTree = null;
        this.flushTimer = null;
        this.delayFlush = () => {
            if (this.flushTimer !== null) {
                return;
            }
            this.flushTimer = setInterval(() => {
                if (this._flush()) {
                    if (this.flushTimer !== null) {
                        clearInterval(this.flushTimer);
                        this.flushTimer = null;
                    }
                }
            }, this.flushMs);
        };
        this.listened = (init.listened || []).concat(['click', 'change']);
        this.target = init.target;
        this.data = init.data;
        this.root = init.root;
        this.model = this.genModel();
        this.flushAfterEvent = !!init.flushAfterEvent;
        this.listenDOMEvent();
        this.delayFlush();
    }
    afterflush(handler) {
        this.on("afterflush", handler);
    }
    on(ev, handler) {
        if (!this.$on[ev]) {
            this.$on[ev] = [];
        }
        this.$on[ev].push(handler);
    }
    once(ev, handler) {
        if (!this.$once[ev]) {
            this.$once[ev] = [];
        }
        this.$once[ev].push(handler);
    }
    emit(ev) {
        {
            const m = this.$on[ev];
            if (m && m.length) {
                for (let i = 0, l = m.length; i < l; i++) {
                    m[i]({
                        model: this.model,
                        eventName: ev,
                        watcher: this
                    });
                }
            }
        }
        {
            const m = this.$once[ev];
            if (m && m.length) {
                for (let i = 0, l = m.length; i < l; i++) {
                    m[i]({
                        model: this.model,
                        eventName: ev,
                        watcher: this
                    });
                }
                m.length = 0;
            }
        }
    }
    genModel() {
        return new Proxy(this.data, {
            get: (target, key) => {
                const value = Reflect.get(target, key);
                if (typeof value === 'object' && value) {
                    this.flush();
                }
                return value;
            },
            set: (target, key, value) => {
                if (value !== Reflect.get(target, key)) {
                    Reflect.set(target, key, value);
                    this.flush();
                }
                return true;
            }
        });
        /*
        //Proxy代理某些类型(如File)时,会出bug,故弃用以下代码
        const self = this
        const pair = {
            get: fget as any,
            set: fset as any
        }
        function join<T extends Object>(item: T): T {
            return new Proxy(item, pair)
        }
        function fget<T extends Object>(target: T, key: string | symbol): any {
            const value = Reflect.get(target, key)
            if ((typeof value === 'object') && value) {
                return join(value)
            } else {
                return value
            }
        }
        function fset<T extends Object>(target: T, key: string | symbol, value: any): boolean {
            if (value !== Reflect.get(target, key)) {
                Reflect.set(target, key, value)
                self.flush()
            }
            return true
        }
        return join(this.data)*/
    }
    is_rended() {
        return !!this.vdomTree;
    }
    flush() {
        this.delayFlush();
    }
    _flush() {
        const f = this.flushing;
        if (!f) {
            this.flushing = true;
            setTimeout(() => {
                this.flushing = false;
            }, this.flushMs);
            if (!this.vdomTree) {
                if (!this.target) {
                    throw new Error('no target.');
                }
                //simple replacement at first flushing
                let newTarget;
                let t = this.vdomTree = this.root(this.data);
                try {
                    newTarget = rend(t);
                }
                catch (e) {
                    newTarget = document.createTextNode('error appearanced while calling root function.');
                }
                this.target.replaceWith(newTarget);
                this.target = null;
            }
            else {
                /*diff*/
                let newTree = this.root(this.data);
                singleElementDiff(this.vdomTree, newTree);
                this.vdomTree = newTree;
            }
            setTimeout(() => this.emit('afterflush'));
        }
        return !f;
    }
    listenDOMEvent() {
        const f = (type) => {
            return (e) => {
                const { target } = e;
                const g = {
                    model: this.model,
                    event: e,
                    srcTarget: target,
                    currentTarget: target,
                    watcher: this,
                    flush: this.delayFlush,
                    stop: false,
                    $ref: null,
                    data: this.data,
                };
                const h = () => {
                    if (!g.currentTarget) {
                        return;
                    }
                    const $ref = Reflect.get(g.currentTarget, '$ref');
                    if (!$ref) {
                        return;
                    }
                    g.$ref = $ref;
                    setImmediate(() => $ref.emit(type, g))
                        .then(() => g.stop)
                        .then(stop => {
                        if ((!stop) && g.currentTarget) {
                            g.currentTarget = g.currentTarget.parentElement;
                            h();
                        }
                    });
                };
                h();
                this.flushAfterEvent && this.delayFlush();
            };
        };
        const sT = new Set(this.listened);
        for (const name of sT) {
            document.addEventListener(name, f(name), true);
        }
    }
}
export class vHTML extends vElement {
    constructor(tag, html) {
        super(tag);
        this.html = '';
        this.html = html;
    }
    afterRendOrDiff() {
        if (this.$ref) {
            this.$ref.innerHTML = this.html;
        }
    }
}
export function f() {
    return function h(tag) {
        return new vElement(tag);
    };
}
export async function sleep(ms, val) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms, val);
    });
}
function shiftRef(ot, nt) {
    const r = ot.$ref;
    if (r) {
        Reflect.set(r, '$ref', nt);
        nt.$ref = r;
        ot.$ref = null;
    }
    return r;
}
function rend(node) {
    let res;
    if (node instanceof vElement) {
        res = document.createElement(node.tag);
        const { children, style, attributes, properties } = node;
        const rst = res.style;
        for (const [key, value] of Object.entries(style)) {
            rst[key] = value;
        }
        if (node instanceof vHTML) {
            res.innerHTML = node.html;
        }
        else {
            for (const child of children) {
                res.appendChild(rend(child));
            }
        }
        for (let [key, value] of Object.entries(attributes)) {
            isNul(value) || res.setAttribute(key, value + '');
        }
        for (let [key, value] of Object.entries(properties)) {
            Reflect.set(res, key, value);
        }
    }
    else {
        res = document.createTextNode(node.data);
    }
    node.$ref = res;
    Reflect.set(res, '$ref', node);
    setImmediate(() => node.afterRendOrDiff());
    return res;
}
function chidrenDiff(ocs, ncs, pr) {
    let i = 0;
    for (const l = Math.min(ocs.length, ncs.length); i < l; i++) {
        singleElementDiff(ocs[i], ncs[i]);
    }
    if (ocs.length === ncs.length) {
        return;
    }
    if (ocs.length > ncs.length) {
        for (const l = ocs.length; i < l; i++) {
            const c = ocs[i];
            if (c.$ref) {
                Reflect.set(c.$ref, '$ref', null);
                c.$ref.remove();
                c.$ref = null;
            }
        }
    }
    else {
        for (const l = ncs.length; i < l; i++) {
            pr.appendChild(rend(ncs[i]));
        }
    }
}
function attrsDiff(type, ot, nt, $ref) {
    const f = () => {
        switch (type) {
            case 'attributes':
                {
                    const keysSet = new Set([...Object.keys(ot.attributes), ...Object.keys(nt.attributes)]);
                    for (const key of keysSet) {
                        const v0 = nt.attributes[key];
                        const v1 = ot.attributes[key];
                        if (isNul(v0)) {
                            $ref.removeAttribute(key);
                        }
                        else if (v0 !== v1) {
                            $ref.setAttribute(key, v0 + '');
                        }
                    }
                }
                break;
            case 'properties':
                {
                    const keysSet = new Set([...Object.keys(ot.properties), ...Object.keys(nt.properties)]);
                    for (const key of keysSet) {
                        if (key === '$ref')
                            continue;
                        const v0 = nt.properties[key];
                        const v1 = ot.properties[key];
                        if (v0 !== v1) {
                            Reflect.set($ref, key, v0);
                        }
                    }
                }
                break;
            case 'styles':
                {
                    const keysSet = new Set([...Object.keys(ot.style), ...Object.keys(nt.style)]);
                    for (const key of keysSet) {
                        const v0 = nt.style[key];
                        const v1 = ot.style[key];
                        if (isNul(v0)) {
                            $ref.style[key] = '';
                        }
                        else if (v0 !== v1) {
                            $ref.style[key] = v0 + '';
                        }
                    }
                }
                break;
        }
    };
    setImmediate(f);
}
function singleElementDiff(ot, nt) {
    const _ref = shiftRef(ot, nt);
    if (!_ref) {
        return;
    }
    if (ot instanceof vElement && nt instanceof vElement && ot.tag === nt.tag) {
        const $ref = _ref;
        chidrenDiff(ot.children, nt.children, $ref);
        attrsDiff('attributes', ot, nt, $ref);
        attrsDiff('styles', ot, nt, $ref);
        attrsDiff('properties', ot, nt, $ref);
        setImmediate(() => nt.afterRendOrDiff());
    }
    else if (ot instanceof vText && nt instanceof vText) {
        if (nt.data !== ot.data) {
            _ref.data = nt.data;
        }
        setImmediate(() => nt.afterRendOrDiff());
    }
    else {
        _ref.replaceWith(rend(nt));
    }
}
export async function loopAwait(f, print = false, testor = (t, count) => true, sleepTime = 500) {
    let count = 0;
    while (true) {
        try {
            const result = await f(count);
            count++;
            print && console.log(result);
            await sleep(sleepTime);
            if (testor(result, count)) {
                return result;
            }
        }
        catch (e) {
            print && console.log(e);
        }
    }
}
export async function setImmediate(f) {
    return new Promise(res => res(void 0)).then(f);
}
//# sourceMappingURL=index.js.map
