import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'

describe('Parse', () => {
    test('simple interpolation', () => {
        const ast = baseParse('{{message}}')
        //
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.INTERPLOATION,
            content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'message',
            },
        })
    })
    test('element', () => {
        const ast = baseParse('<div>message</div>')
        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ElEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.TEXT,
                    content: 'message',
                }
            ]
        })
    })
    describe('text', () => {
        it("simple text", () => {
            const ast = baseParse('some text')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: "some text",
            })
        })
    })
    describe('union type', () => {
        it("<div> hi, {{message}} </div>", () => {
            const ast = baseParse('<p>hi,{{message}}</p>')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ElEMENT,
                tag: "p",
                children: [
                    {
                        type: NodeTypes.TEXT,
                        content: "hi,",
                    },
                    {
                        type: NodeTypes.INTERPLOATION,
                        content: {
                            type: NodeTypes.SIMPLE_EXPRESSION,
                            content: "message"
                        }
                    }
                ]
            })
        })
        it("Nest Element", () => {
            const ast = baseParse('<div><p>hi</p>{{message}}</div>')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ElEMENT,
                tag: "div",
                children: [
                    {
                        type: NodeTypes.ElEMENT,
                        tag: "p",
                        children: [
                            {
                                type: NodeTypes.TEXT,
                                content: "hi",
                            }
                        ]
                    },
                    {
                        type: NodeTypes.INTERPLOATION,
                        content: {
                            type: NodeTypes.SIMPLE_EXPRESSION,
                            content: "message"
                        }
                    }
                ]
            })
        })
    })
    test('should throw error when lack end tag', () => {
        expect(() => {
            baseParse("<div><span></div>")
        }).toThrow(`缺少结束标签:span`);
    })
})
