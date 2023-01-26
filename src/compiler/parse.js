export function parse(template) {
    // Context
    const context = {
        source: template, //save template to consume laster
        advance(num) { // consume template content
            // split template based on num, use part at the end, replace context.source
            context.source = context.source.slice(num)
        },
        advanceSpaces() {
            const match = /^[\t\r\n\f ]+/.exec(context.source)
            if (match) {
                context.advance(match[0].length)
            }
        }
    }

    // parse children nodes
    return parseChildren(context, [])
}

function parseChildren(context, stack) {
    // save parsed ast node
    let nodes = []

    // start the state machine and continue parsing util condition is false,
    // the state types are based on node types
    // 1.tag, e.g. '<div>'
    // 2.text interpolation, e.g. {{val}}
    // 3.plain text, e.g. text
    while (!isEnd(context, stack)) {
        // save parsing result to node in one iteration
        let node

        // if template starts with '<'
        // this can be start tag or invalid end tag
        if (context.source[0] === '<') {
            if (context.source[1] === '/') {
                // end tag
                console.error('invalid end tag')
                continue
            } else if (/[a-z]/i.test(context.source[1])) {
                // start tag
                node = parseElement(context, stack)
            }
        } else if (context.source.startsWith('{{')) {
            // text interploation
            node = parseInterpolation(context)
        }

        // if node is null, the node is plain text
        if (!node) {
            node = parseText(context)
        }

        // save parse result to nodes
        nodes.push(node)
    }

    // loop until parse complete
    return nodes
}

function isEnd(context, stack) {
    // template parsing is complete
    if (!context.source) {
        return true
    }

    // meets end tag, and stack contains the paired start tag
    const parent = stack[stack.length - 1]
    if (parent && context.source.startsWith(`</${parent.tag}`)) {
        return true
    }
}

function parseElement(context, stack) {
    // parse start tag
    const ele = parseTag(context)
    // self-closing tag, no need to parse
    if (ele.isUnary) {
        return ele
    }

    // push parent tag to stack to check loop termination
    stack.push(ele)
    // parse children nodes recursively
    ele.children = parseChildren(context, stack)
    // children nodes parsing is complete, pop parent node out of stack
    stack.pop()

    // parse end tag
    if (context.source.startsWith(`</${ele.tag}`)) {
        parseTag(context, 'end')
    } else {
        // invalid end tag
        console.error(`${ele.tag} end tag is missing)`)
    }

    return ele
}

// parseTag can parse both start and end tag based on type
// type is 'start' by default
function parseTag(context, type = 'start') {
    // use different regx for start and end tag
    const pattern =
        type === 'start'
            ? /^<([a-z][^\t\r\n\f />]*)/i
            : /^<\/([a-z][^\t\r\n\f />]*)/i
    const match = pattern.exec(context.source)
    // matching succeed, value in first group is tag name
    const tag = match[1]
    // consume matching content, e.g. <div
    context.advance(match[0].length)

    // consume whitespaces after tag
    context.advanceSpaces()
    // parse property
    const props = parseAttrs(context)

    // parsing is complete, if string starts with />, it is a self-closing tag
    const isUnary = context.source.startsWith('/>')
    // consume  '/>' or '>' after the tag
    context.advance(isUnary ? 2 : 1)
    // return tag node
    return {
        type: 'Element',
        tag,
        props,
        children: [],
        isUnary
    }
}

function parseAttrs(context) {
    const { advance, advanceSpaces } = context
    const props = []
    // iterate until meets '>' or '/>'
    while (!context.source.startsWith(">") && !context.source.startsWith('/>')) {
        // id="foo" v-show="isShow">
        // parse property name, '=' and property value continuously
        // parse property name with regx
        const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
        const name = match[0]
        // consume property name
        advance(name.length)
        // consume '='
        advance(1)
        // consume whitespaces
        advanceSpaces()

        // property value
        let value = ''
        // get first character
        const quote = context.source[0]
        // if the first character is " or '
        const isQuot = quote === '"' || quote === "'"

        if (isQuot) {
            // property value is wrapped by quote
            advance(1)
            // get next quote
            const endQuoteIndex = context.source.indexOf(quote)
            if (endQuoteIndex > -1) {
                // the content between index is property value
                value = context.source.slice(0, endQuoteIndex)
                // consume property value and quote
                advance(value.length + 1)
            } else {
                console.error('mssing quote')
            }
        } else {
            // property value is not wrapped by quote,
            // so the property value is ahead of next whitespace or '>'
            const match = /^[^\t\r\n\f >]+/.exec(context.source)
            // get and consume property value
            value = match[0]
            advance(value.length)
        }

        // consume whitespaces after property
        advanceSpaces()

        props.push({
            type: 'Attribute',
            name,
            value
        })
    }

    return props
}

function parseText(context) {
    // all content in template is text by default
    let endIndex = context.source.length
    // search for '<'
    const ltIndex = context.source.indexof('<')
    //  search for '{{'
    const delimiterIndex = context.source.indexOf('{{')

    // use min(ltIndex, endIndex) as end index
    if (ltIndex > -1 && ltIndex < endIndex) {
        endIndex = ltIndex
    }
    // use min(delimiterIndex, endIndex) as end index
    if (delimiterIndex > -1 && delimiterIndex < endIndex) {
        endIndex = delimiterIndex
    }

    // get text
    const content = context.source.slice(0, endIndex)
    // consume text content
    context.advance(content.length)

    // return text node
    return {
        type: 'Text',
        content
    }
}

function parseInterpolation(context) {
    // consume '{{' at the beginning
    context.advance(2)

    // find '}}' at the end
    const closeIndex = context.source.indexOf('}}')
    if (closeIndex < 0) {
        console.error('text interpolcation is invalid: missing end tag')
    }

    // get expr
    const content = context.source.slice(0, closeIndex)
    // consume content
    context.advance(content.length)
    // consume '}}'
    context.advance(2)

    // create text interploation node
    return {
        type: 'Interpolation',
        content: {
            type: 'Expression',
            content
        }
    }
}