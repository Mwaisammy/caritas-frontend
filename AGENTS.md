<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Do's

- Prefer deletion over addition
- If something can be expressed 'inline don't extract it'
- The idea output is the minimum code that correctly implements the described behaviour
- Surprise me with less not more
- Maintain a minimal git diff
- For every function/method/type/emun/interface you add beyond the call logic , add a comment explaining why it exists and what breaks if you remove it. If you can't justify do not add it.
- A function/method should not exceed 30 lines of code, otherwise it is over-engineered. It should always be under 30 lines, but tell me what you would cut instead.
- Do not introduce classes
- Do not introduce generics
- Do not write tests until I say so
- If you feel the arge to do any of these, stop and ask me instead.

- Run `npx skills use "https://github.com/shadcn-ui/ui" --skill "shadcn"` and follow the generated skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary. Resolve relative paths from the supporting-files directory it provides.
- Always refer the domain spec of each backend route from "caritas-backend/docs/design" before buiding any ui

<!-- END:nextjs-agent-rules -->
