{
  function node(option, type) {
    option.type = type
    return option
  }

  function operator(operator_type, left, right) {
    return node({
      operator: operator_type,
      left, right
    }, "operator")
  }

  function literal(option, literal_type) {
    return node({
      ...option,
      literal_type,
    }, "literal")
  }
  function ref(option, ref_type) {
    return node({
      ref_type,
      ...option
    }, "ref")
  }
  function matrix_ref(id) {
    return ref({ id }, "matrix")
  }
}

Final
  = _ exp:Expression? _ {
    return exp
  }

Expression "表达式"
  = head:Term tail:(_("+" / "-") _ Term)* {
    return tail.reduce(function (result, element) {
      if (element[1] === "+") {
        return operator("add", result, element[3])
      }
      if (element[1] === "-") {
        return operator("sub", result, element[3])
      }
    }, head);
  }

Term "表达式"
  = head:Factor tail:(_("*" / "/") _ Factor)* {
    return tail.reduce(function (result, element) {
      if (element[1] === "*") {
        return operator("mul", result, element[3])
      }
      if (element[1] === "/") {
        return operator("div", result, element[3])
      }
    }, head);
  }

Factor "表达式"
  = "(" _ expr:Expression _ ")" { return expr; }
  / Fraction
  / Float
  / Ref
  / Integer

Ref "引用" 
  = Matrix

Matrix "矩阵引用"
  = _ "M" id:[0-9]+ { return matrix_ref(parseInt(id[0])) }
  
Fraction "分数"
  = _ s:"-"? n:([0-9]+) "//" d:([0-9]+) { return literal({d: parseInt(d[0]), n: parseInt(n[0]), s: s ? -1 : 1}, "fraction", text()) }

Float "小数"
  = _ "-"? [0-9]+ "." [0-9]+ { return literal({ value: parseFloat(text()) }, "float", text()) }

Integer "整数"
  = _ "-"? [0-9]+ { return literal({ value: parseInt(text()) }, "integer", text()) }

_ "空白字符"
  = [ \t\n\r]*