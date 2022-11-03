import * as ubf from "./c116f80e2930abf3.js";
class Data {
    constructor() {
        this.faces = 3;
        this.puzzle = null;
        this.cubesAmount = 4;
        this.question = null;
        this.answer = null;
        this.linkSelectTmp = [];
    }
    newPuzzle() {
        this.puzzle = new Puzzle(this.faces, new Array(this.cubesAmount).fill(0));
        this.answer = null;
    }
}
class Puzzle {
    constructor(depth, content) {
        this.depth = 3;
        this.content = [];
        this.path = [];
        this.linked = [];
        this.depth = depth;
        this.content = content;
        if (!this.isValid()) {
            throw alert('不合理的谜题!');
        }
        this.setDefaultLink();
    }
    setDefaultLink() {
        for (let i = 0, l = this.content.length; i < l; i++) {
            this.linked[i] = new Set;
            if (i !== 0) {
                this.linked[i].add(i - 1);
            }
            if (i !== l - 1) {
                this.linked[i].add(i + 1);
            }
        }
    }
    isValid() {
        for (const v of this.content) {
            if (v >= this.depth) {
                return false;
            }
        }
        return true;
    }
    add(index) {
        this.content[index] = (this.content[index] + 1) % this.depth;
    }
    clickEach() {
        const v = [];
        for (let i = 0, l = this.content.length; i < l; i++) {
            v.push(this.click(i));
        }
        return v;
    }
    click(index) {
        const len = this.content.length;
        if (index >= len) {
            throw alert('错误的索引号');
        }
        const t = this.clone();
        const n = t.content[index];
        if (!isNaN(n)) {
            t.content[index] = (n + 1) % t.depth;
        }
        const k = t.linked[index];
        if (k) {
            for (const next of k) {
                if (next === index) {
                    continue;
                }
                const n = t.content[next];
                if (!isNaN(n)) {
                    t.content[next] = (n + 1) % t.depth;
                }
            }
        }
        t.path.push(index);
        return t;
    }
    clone() {
        const ct = [...this.content];
        const path = [...this.path];
        const linked = this.linked.map(x => new Set(x));
        const p = new Puzzle(this.depth, ct);
        p.path = path;
        p.linked = linked;
        return p;
    }
    isSame() {
        for (let i = 0, l = this.content.length; i < l; i++) {
            if (this.content[0] !== this.content[i]) {
                return false;
            }
        }
        return true;
    }
    findAnswer() {
        const rc = new Set();
        const stack = [];
        let i = 0;
        stack.push(this.clone());
        rc.add(this.content.join());
        while (i < stack.length) {
            if (stack[i].isSame()) {
                return stack[i].clone();
            }
            for (const n of stack[i].clickEach()) {
                const h = n.content.join();
                if (!rc.has(h)) {
                    stack.push(n.clone());
                    rc.add(h);
                }
            }
            i++;
        }
        alert('没有找到答案!');
        return null;
    }
}
document.title = '稻妻方块解谜';
const h = ubf.f();
new ubf.Watcher({
    root(data) {
        return uiCps.app(data);
    },
    target: document.getElementById('app'),
    data: new Data
});
var uiCps;
(function (uiCps) {
    function app(data) {
        return h('div').addChildren([
            h('h3').addText('适用于多数稻妻方块谜题'),
            uiCps.puzMeta(data),
            uiCps.puzDetail(data),
            uiCps.puzResult(data)
        ]);
    }
    uiCps.app = app;
    function puzMeta(data) {
        return h('div').addChildren([
            h('div').addChildren([
                '单个方块面数:',
                h('select')
                    .addChildren([
                    2, 3, 4, 5, 6
                ].map(x => {
                    return h('option').addText(x + '');
                }))
                    .setValue(data.faces)
                    .on('change', ({ model, srcTarget }) => {
                    model.faces = +srcTarget.value;
                }),
                '方块个数:',
                h('select')
                    .addChildren([
                    3, 4, 5, 6, 7
                ].map(x => {
                    return h('option').addText(x + '');
                }))
                    .setValue(data.cubesAmount)
                    .on('change', ({ model, srcTarget }) => {
                    model.cubesAmount = +srcTarget.value;
                }),
            ]),
            h('div').addChildren([
                h('button').addText('生成方块').on('click', ({ model }) => {
                    if (model.puzzle && !confirm('已有谜题,要重新生成吗?')) {
                        return;
                    }
                    model.newPuzzle();
                }),
                h('button').addText('寻找答案').on('click', ({ model }) => {
                    if (model.puzzle) {
                        model.question = model.puzzle.clone();
                        model.answer = model.puzzle.findAnswer();
                    }
                }).setAttributes({
                    disabled: data.puzzle ? null : ''
                })
            ])
        ]);
    }
    uiCps.puzMeta = puzMeta;
    function puzDetail(data) {
        return h('div').addChildren((function () {
            const r = [];
            if (data.puzzle) {
                for (let i = 0, l = data.puzzle.content.length; i < l; i++) {
                    r.push(puzCube(data, i));
                }
            }
            return r;
        })());
    }
    uiCps.puzDetail = puzDetail;
    function puzCube(data, i) {
        var _a, _b, _c;
        if (!data.puzzle) {
            return null;
        }
        return h('div').setStyle({
            display: 'grid',
            gridTemplateColumns: '1fr 3fr 7fr'
        }).addChildren([
            h('span').addText(`${i}号方块`),
            h('button').addText(`第${(_a = data.puzzle) === null || _a === void 0 ? void 0 : _a.content[i]}面(点击切换状态)`).on('click', ({ model }) => {
                var _a;
                (_a = model.puzzle) === null || _a === void 0 ? void 0 : _a.add(i);
            }),
            h('div').addChildren([
                h('span').addChildren([
                    h('select').addChildren((function () {
                        const ii = i;
                        const r = [];
                        for (let i = 0, l = data.puzzle.content.length; i < l; i++) {
                            r.push(h('option').addText(i + ''));
                        }
                        return r;
                    })()).setValue(((_b = data.linkSelectTmp[i]) !== null && _b !== void 0 ? _b : 0) + '').on('change', ({ model, srcTarget }) => {
                        model.linkSelectTmp[i] = +srcTarget.value;
                    }),
                    h('button').addText(`连接到${(_c = data.linkSelectTmp[i]) !== null && _c !== void 0 ? _c : 0}号方块`).on('click', ({ model }) => {
                        var _a;
                        if (!model.puzzle) {
                            return;
                        }
                        if (!model.puzzle.linked[i]) {
                            model.puzzle.linked[i] = new Set;
                        }
                        model.puzzle.linked[i].add((_a = data.linkSelectTmp[i]) !== null && _a !== void 0 ? _a : 0);
                    })
                ]),
                h('span').addText('连接状态(单击连接方块,删除其连接)').addChildren((function () {
                    var _a;
                    const r = [];
                    const linked = (_a = data.puzzle) === null || _a === void 0 ? void 0 : _a.linked[i];
                    if (linked) {
                        for (const x of linked) {
                            r.push(h('button').addText(x + '').setStyle({
                                border: '1px solid red'
                            }).on('click', ({ flush }) => {
                                linked.delete(x);
                                flush();
                            }));
                        }
                    }
                    return r;
                })())
            ])
        ]);
    }
    uiCps.puzCube = puzCube;
    function puzResult(data) {
        if (data.question && data.answer) {
            return h('div').addChildren([
                h('div').addText('初始状态:').addChildren(data.question.content.map(x => {
                    const s = x + '';
                    return h('button').addText(s);
                })),
                h('div').addText('最终结果:').addChildren(data.answer.content.map(x => {
                    const s = x + '';
                    return h('button').addText(s);
                })),
                h('div').addText('击打顺序:').addChildren(data.answer.path.map(x => {
                    const s = x + '';
                    return h('button').addText(s);
                })),
            ]);
        }
        else {
            return null;
        }
    }
    uiCps.puzResult = puzResult;
})(uiCps || (uiCps = {}));
//# sourceMappingURL=index.js.map
