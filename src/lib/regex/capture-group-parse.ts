enum TokenType {
  Unknown,
  NamedCapturingGroup,
  CapturingGroup,
  NonCapturingGroup,
}

enum Nesting {
  Closing,
  Opening,
  Undefined,
}

interface IToken {
  type: TokenType;
  content: string;
  start_pos: number;
  //nesting: Nesting;
  bracket_start: number;
  capturing_group?: number;
  capturing_group_name?: string;
}

function create_IToken(
  type: TokenType,
  start_pos: number,
  //nesting: Nesting,
  content?: string
): IToken {
  return {
    type,
    content: content ?? "",
    start_pos,
    //nesting,
    bracket_start: -1,
  };
}

export function parse_to_capture_groups(regex_src: string) {
  if (regex_src.length === 0) return;

  const state = {
    ptr: 0,
    tokens: [] as IToken[],
    brackets_stack: [] as number[],
    brackets_level: 0,
    capturing_group_counter: 1,
  };

  const tokens = state.tokens;

  while (state.ptr < regex_src.length) {
    const c = regex_src.charCodeAt(state.ptr);
    if (c === 0x5c /* \ */) {
      state.ptr += 2;
    } else if (c === 0x28 /* ( */) {
      state.brackets_level++;
      state.ptr++;
      const c2 = regex_src.charCodeAt(state.ptr);
      if (c2 === 0x3f /* ? */) {
        state.ptr++;
        const c3 = regex_src.charCodeAt(state.ptr);
        if (c3 === 0x3a /* : */ || c3 === 0x3d /* = */ || c3 === 0x21 /* ! */) {
          // 是非捕获组
          tokens.push(
            create_IToken(
              TokenType.NonCapturingGroup,
              state.ptr,
              //Nesting.Opening,
              "(?" + String.fromCharCode(c3)
            )
          );
          state.ptr++;
          state.brackets_stack.push(tokens.length - 1);
        } else if (c3 === 0x3c /* < */) {
          state.ptr++;
          const c4 = regex_src.charCodeAt(state.ptr);
          if (c4 === 0x3d /* = */ || c4 === 0x21 /* ! */) {
            // 是非捕获组
            state.ptr++;
            tokens.push(
              create_IToken(
                TokenType.NonCapturingGroup,
                state.ptr,
                //Nesting.Opening,
                "(?<" + String.fromCharCode(c4)
              )
            );
            state.brackets_stack.push(tokens.length - 1);
          } else {
            // 可能是具名捕获组
            const name_start = state.ptr;
            while (
              state.ptr < regex_src.length &&
              regex_src.charCodeAt(state.ptr) !== 0x3e /* > */
            ) {
              state.ptr++;
            }
            if (state.ptr === regex_src.length) {
              throw new Error(
                "[RegexCapturingGroupParser] 具名捕获组的名字未关闭。"
              );
            }
            const name = regex_src.slice(name_start, state.ptr);
            const name_regex = /^[A-Za-z][\dA-Za-z]*$/;
            if (!name_regex.test(name)) {
              throw new Error(
                `[RegexCapturingGroupParser] 具名捕获组的名字 ${name} 不符合规范。`
              );
            }

            state.ptr++;
            const token = create_IToken(
              TokenType.NamedCapturingGroup,
              state.ptr,
              //Nesting.Opening,
              "(?<" + name + ">"
            );
            token.capturing_group = state.capturing_group_counter;
            token.capturing_group_name = name;
            tokens.push(token);
            state.brackets_stack.push(tokens.length - 1);
            state.capturing_group_counter++;
          }
        } else {
          throw new Error(
            "[RegexCapturingGroupParser] 多余的问号，或是正则表达式未完成，在位置" +
              state.ptr
          );
        }
      } else {
        // 是一般的捕获组
        const token = create_IToken(
          TokenType.CapturingGroup,
          state.ptr - 1,
          //Nesting.Opening,
          "("
        );
        token.capturing_group = state.capturing_group_counter;
        tokens.push(token);
        state.brackets_stack.push(tokens.length - 1);
        state.capturing_group_counter++;
      }
    } else if (c === 0x29 /* ) */) {
      // 可能是括号关闭
      console.log(state.brackets_stack);

      if (state.brackets_level === 0) {
        throw new Error(
          "[RegexCapturingGroupParser] 多余的关闭的括号，在位置" + state.ptr
        );
      }
      state.brackets_level--;
      const start_token_index = state.brackets_stack.pop()!;
      const start_token = tokens[start_token_index];
      const token = create_IToken(
        start_token.type,
        state.ptr,
        //Nesting.Closing,
        ")"
      );
      token.bracket_start = start_token_index;
      tokens.push(token);
      state.ptr++;
    } else {
      if (
        tokens.length === 0 ||
        tokens[tokens.length - 1].type !== TokenType.Unknown
      ) {
        tokens.push(
          create_IToken(TokenType.Unknown, state.ptr /** Nesting.Undefined */)
        );
      }
      const token = tokens[tokens.length - 1];
      token.content += String.fromCharCode(c);
      state.ptr++;
    }
  }

  if (state.brackets_level !== 0) {
    throw new Error(
      `[RegexCapturingGroupParser] 有 ${state.brackets_level} 层括号未被关闭。`
    );
  }

  console.log(tokens);

  const capture_groups: [start: IToken, end: IToken][] = new Array(
    state.capturing_group_counter - 1
  );
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (
      token.bracket_start > -1 &&
      (token.type === TokenType.CapturingGroup ||
        token.type === TokenType.NamedCapturingGroup)
    ) {
      capture_groups[tokens[token.bracket_start].capturing_group! - 1] = [
        tokens[token.bracket_start],
        token,
      ];
    }
  }

  return capture_groups;
}
