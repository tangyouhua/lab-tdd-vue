import { generate } from "../src/compiler/generate"
import { parse } from "../src/compiler/parse"
describe("compiler", () => {
    it("parse element", () => {
        const template = "<div></div>"
        const ast = parse(template)
        expect(ast[0]).toEqual({
            tag: "div",
            type: "Element",
            props: [],
            children: [],
            isUnary: false,
        })
    })

    it("parse unary element", () => {
        const template = "<img/>"
        const ast = parse(template)
        expect(ast[0]).toEqual({
            tag: 'img',
            type: 'Element',
            props: [],
            children: [],
            isUnary: true,
        })
    })

    it("parse nested elements", () => {
        const template = '<div><span></span></div>'
        const ast = parse(template)
        expect(ast[0]).toEqual({
            tag: 'div',
            type: 'Element',
            props: [],
            children: [
                {
                    tag: 'span',
                    type: 'Element',
                    props: [],
                    children: [],
                    isUnary: false,
                }
            ],
            isUnary: false
        })
    })

    it("parse props and directive", () => {
        const template = '<div id="foo" v-show="isShow"></div>'
        const ast = parse(template)
        expect(ast[0]).toEqual({
            tag: 'div',
            type: 'Element',
            props: [
                {
                    type: 'Attribute',
                    name: 'id',
                    value: 'foo'
                },
                {
                    type: 'Attribute',
                    name: 'v-show',
                    value: 'isShow',
                }
            ],
            children: [],
            isUnary: false
        })
    })

    it('parse interpolation', () => {
        const template = '<div>{{foo}}</div>'
        const ast = parse(template)
        expect(ast[0]).toEqual({
            tag: 'div',
            type: 'Element',
            props: [],
            children: [
                {
                    type: 'Interpolation',
                    content: {
                        type: 'Expression',
                        content: 'foo'
                    }
                }
            ],
            isUnary: false
        })
    })

    it('generate element with text', () => {
        const ast = [
            {
                type: 'Element',
                tag: 'div',
                props: [],
                isUnary: false,
                children: [{ type: 'Text', content: 'foo' }]
            }
        ]
        const code = generate(ast)
        expect(code).toMatch(`return this._c('div',null,'foo')`)
    })

    it('generate element with expression', () => {
        const ast = [
            {
                type: 'Element',
                tag: 'div',
                props: [],
                isUnary: false,
                children: [
                    {
                        type: 'Interpolation',
                        content: { type: 'Expression', content: 'foo' }
                    }
                ]
            }
        ]
        const code = generate(ast)
        expect(code).toMatch(`return this._c('div',null,this.foo)`)
    })

    it('generate element with multi children', () => {
        const ast = [
            {
                type: 'Element',
                tag: 'div',
                props: [],
                isUnary: false,
                children: [
                    { type: 'Text', content: 'foo' },
                    {
                        type: 'Element',
                        tag: 'span',
                        props: [],
                        isUnary: false,
                        children: [{ type: 'Text', content: 'bar' }]
                    }
                ]
            }
        ]
        const code = generate(ast)
        expect(code).toMatch(
            `return this._c('div',null,[this._v('foo'),this._c('span',null,'bar')])`
        )
    })
})