export function generate(ast) {
    // iterate ast nodes recursively and generate code
    const code = genNode(ast[0])
    return `return ${code}`
}

function genNode(ast) {
    // use different logics for node types
    if (ast.type === 'Element') {
        return genElement(ast)
    } else if (ast.type === 'Text') {
        return genText(ast)
    } else if (ast.type === 'Interpolation') {
        return genText(ast.content)
    }
    return ''
}

function genElement(el) {
    const tag = `'${el.tag}'`
    // iterate elements recursively
    const children = genChildren(el)

    // Attribute
    const props = genProps(el)

    // _c(tag,props,chidlren)
    const code = `this._c(${tag},${props}${children ? `,${children}` : ""})`
    return code
}

function genChildren(el) {
    const children = el.children

    if (children.length > 0) {
        // if there is only one Text element, generate string: _c('div',null,'text')
        if (
            children.length === 1 &&
            (children[0].type === 'Text' || children[0].type === 'Interpolation')
        ) {
            return children[0].type === 'Text'
                ? `'${children[0].content}'`
                : `this.${children[0].content.content}`
        }
        // other conditions, generate array: _c('div',null,[_c('span,null,'text')])
        return `[${children.map((c) => genNode(c)).join(',')}]`
    }
}

function genProps(el) {
    if (el.props.length > 0) {
        // iterate el.props, return{key:val}
        const result = {}
        for (const prop of el.props) {
            result[prop.name] = prop.value
        }
        return JSON.stringify(result)
    }
    return null
}

function genText(text) {
    const content =
        text.type === 'Expression' ? `this.${text.content}` : `'${text.content}'`
    return `this._v(${content})`
}