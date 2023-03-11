import { NodeTypes } from "./ast"
const enum TagType {
    START,
    END
}
export function baseParse(content: string) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context))
}
function parseChildren(context) {
    const nodes: any = []
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
        node = parseInterpolation(context)
    } else if (s[0] === "<") {
        if (/[a-z]/i.test(context.source[1])) {
            node = parseElement(context);
        }
    } else {
        node = parseText(context)
    }
    nodes.push(node)
    return nodes
}
function parseInterpolation(context) {
    // {{message}}
    const openDelimiter = '{{'
    const closeDelimiter = '}}'
    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDelimiter.length
    )

    advanceBy(context, openDelimiter.length)

    const rawContentLength = closeIndex - openDelimiter.length

    const rawContent = parseTextData(context, rawContentLength)
    const content = rawContent.trim()

    advanceBy(context, rawContentLength + closeDelimiter.length)

    return {
        type: NodeTypes.INTERPLOATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        },
    }
}
function advanceBy(context, length) {
    context.source = context.source.slice(length)
}
function createRoot(children) {
    return {
        children,
    }
}
function createParseContext(context: string) {
    return {
        source: context,
    }
}
function parseElement(context: any) {
    const element = parseTag(context, TagType.START);
    parseTag(context, TagType.END)
    return element;
}

function parseTag(context: any, type: TagType) {
    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];

    advanceBy(context, match[0].length);
    advanceBy(context, 1)
    if (type === TagType.START)
        return {
            type: NodeTypes.ElEMENT,
            tag: 'div'
        };
}

function parseText(context: any) {
    // 获取 content
    const content = parseTextData(context, context.source.length);

    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context: any, length: number) {
    const content = context.source.slice(0, length);
    // 移动
    advanceBy(context, context.length);
    return content;
}
