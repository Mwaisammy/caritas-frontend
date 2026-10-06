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

Keep functions focused and readable. Prefer straightforward code over abstractions. Don’t compress JSX or extract components merely to meet a line-count limit.

- Do not introduce classes
- Do not introduce generics
- Do not write tests until I say so
- If you feel the arge to do any of these, stop and ask me instead.

## Important

- Lean on using shadcn components as shadcn is installed in this project, DO NOT write components from scratch

<!-- END:nextjs-agent-rules -->
