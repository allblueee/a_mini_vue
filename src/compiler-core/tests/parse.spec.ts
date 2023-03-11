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
        () => {
            const ast = baseParse('<div>message</div>')
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ElEMENT,
                tag: 'div',
            })
        }
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
            
        })
    })
})
