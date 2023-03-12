import { NodeTypes } from "./ast"
const enum TagType {
    START,
    END
}
export function baseParse(content: string) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context, []))
}
function parseChildren(context, ancestors) {
    const nodes: any = []

    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context)
        } else if (s[0] === "<") {
            if (/[a-z]/i.test(context.source[1])) {
                node = parseElement(context, ancestors);
            }
        } else {
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}
function isEnd(context, ancestors) {
    // 遇到结束标签时
    const s = context.source;
    // </div>
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // source 有值
    return !s;
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

    advanceBy(context, closeDelimiter.length)

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
function parseElement(context: any, ancestors) {
    const element: any = parseTag(context, TagType.START);
    ancestors.push(element)
    element.children = parseChildren(context, ancestors)
    ancestors.pop(element)
    if (startsWithEndTagOpen(context.source, element.tag))
        parseTag(context, TagType.END)
    else {
        throw new Error(`缺少结束标签:${element.tag}`)
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return source.startsWith("</") && source.slice(2, 2 + tag.length) === tag
}
function parseTag(context: any, type: TagType) {
    const match: any = /^<\/?([a-z]*)/ig.exec(context.source);
    const tag = match[1];

    advanceBy(context, match[0].length);
    advanceBy(context, 1)
    if (type === TagType.START)
        return {
            type: NodeTypes.ElEMENT,
            tag
        };
    return;
}

function parseText(context: any) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }

    // 获取 content
    const content = parseTextData(context, endIndex);

    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context: any, length: number) {
    const rawText = context.source.slice(0, length);
    // 移动
    advanceBy(context, length);
    return rawText;
}
